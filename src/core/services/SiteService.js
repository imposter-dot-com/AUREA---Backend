import siteRepository from '../repositories/SiteRepository.js';
import portfolioRepository from '../repositories/PortfolioRepository.js';
import subdomainService from './SubdomainService.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../shared/exceptions/index.js';
import config from '../../config/index.js';
import path from 'path';
import fs from 'fs';

// Import external services
import { generateAllPortfolioFiles } from '../../../services/templateConvert.js';
import { getTemplateHTML } from '../../services/templateEngine.js';
import {
  saveDeploymentFiles,
  validateDeployment,
  generateDeploymentSummary,
  logDeploymentActivity,
  deployToVercel
} from '../../../services/deploymentService.js';

/**
 * Service for Site/Publishing business logic
 * Handles portfolio publishing to subdomain or Vercel, HTML generation, and site management
 */
export class SiteService {

  constructor(
    siteRepo = siteRepository,
    portfolioRepo = portfolioRepository,
    subdomainSvc = subdomainService
  ) {
    this.siteRepository = siteRepo;
    this.portfolioRepository = portfolioRepo;
    this.subdomainService = subdomainSvc;
  }

  /**
   * Publish portfolio to custom subdomain
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @param {string} customSubdomain - Custom subdomain chosen by user
   * @param {Object} user - User object (for subdomain generation)
   * @returns {Promise<Object>} Published site with details
   */
  async publishToSubdomain(portfolioId, userId, customSubdomain, user) {
    logger.service('SiteService', 'publishToSubdomain', { portfolioId, userId, customSubdomain });

    // Validate required parameters
    if (!portfolioId) {
      throw new ValidationError('Portfolio ID is required');
    }

    // Get portfolio with ownership check
    const portfolio = await this.portfolioRepository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Custom subdomain is ALWAYS required - user must explicitly provide it
    if (!customSubdomain) {
      // Generate suggestions for user convenience
      const suggestedSubdomain = await this.subdomainService.generateFromPortfolio(portfolio, user);
      const suggestions = await this.subdomainService.getSuggestionsWhenTaken(suggestedSubdomain, portfolio, user);

      throw new ValidationError('Custom subdomain is required. Please choose a unique subdomain for your portfolio.', {
        required: 'customSubdomain',
        currentSubdomain: portfolio.slug || null,
        suggestions: suggestions.slice(0, 5)
      });
    }

    // Validate and process subdomain
    const subdomainValidation = await this.subdomainService.validateAndProcess(
      customSubdomain,
      userId,
      portfolioId
    );

    if (!subdomainValidation.valid) {
      throw new ConflictError(subdomainValidation.error, {
        subdomain: customSubdomain,
        available: false,
        conflictType: subdomainValidation.conflictType,
        suggestions: subdomainValidation.suggestions
      });
    }

    const subdomain = subdomainValidation.subdomain;

    logDeploymentActivity('Sub-publication started', {
      portfolioId,
      subdomain,
      userId,
      isCustom: true
    });

    // Generate HTML files with case studies
    const { allFiles, portfolioHTML } = await this.generatePortfolioHTML(portfolio);

    // Validate deployment
    const siteConfig = {
      subdomain,
      title: portfolio.title,
      owner: userId,
      template: portfolio.template,
      portfolioData: portfolio.toObject()
    };

    const deploymentValidation = validateDeployment(siteConfig, portfolioHTML, '');

    if (!deploymentValidation.isValid) {
      throw new ValidationError('Deployment validation failed', {
        issues: deploymentValidation.issues,
        recommendations: deploymentValidation.recommendations
      });
    }

    // Save files and handle subdomain change
    const saveResult = await this.saveFilesToSubdomain(subdomain, allFiles, portfolio.slug);

    // Create or update site record
    const site = await this.createOrUpdateSite(portfolio, userId, subdomain, user, allFiles);

    // Generate the correct frontend URL for viewing the published portfolio
    const frontendUrl = config.frontend.url || 'http://localhost:5173';
    const publicUrl = `${frontendUrl}/${subdomain}/html`;

    // Update portfolio published status
    await this.portfolioRepository.update(portfolioId, {
      isPublished: true,
      slug: subdomain,
      publishedUrl: publicUrl
    });

    // Generate summary
    const summary = generateDeploymentSummary(
      site,
      allFiles,
      deploymentValidation,
      { localPath: saveResult.subdomainDir }
    );

    logDeploymentActivity('Sub-publication completed successfully', {
      portfolioId,
      subdomain,
      filesCount: Object.keys(allFiles).length,
      localPath: saveResult.subdomainDir
    }, 'success');

    logger.info('Portfolio published to subdomain', {
      portfolioId,
      siteId: site._id,
      subdomain
    });

    return {
      site,
      summary,
      url: publicUrl,
      localPath: saveResult.subdomainDir
    };
  }

  /**
   * Publish portfolio to Vercel
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Deployment result
   */
  async publishToVercel(portfolioId, userId, user) {
    logger.service('SiteService', 'publishToVercel', { portfolioId, userId });

    // Get portfolio with ownership check
    const portfolio = await this.portfolioRepository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    logDeploymentActivity('Vercel deployment started', { portfolioId, userId });

    // Generate HTML files
    const { allFiles, portfolioHTML } = await this.generatePortfolioHTML(portfolio);

    // Deploy to Vercel
    const deploymentResult = await deployToVercel(
      portfolio.toObject(),
      allFiles,
      user
    );

    if (!deploymentResult.success) {
      logDeploymentActivity('Vercel deployment failed', {
        portfolioId,
        error: deploymentResult.error
      }, 'error');

      throw new Error(`Vercel deployment failed: ${deploymentResult.error}`);
    }

    // Create or update site record
    const site = await this.siteRepository.upsert(
      { portfolioId, userId },
      {
        userId,
        portfolioId: portfolio._id,
        subdomain: deploymentResult.subdomain || `vercel-${Date.now()}`,
        title: portfolio.title,
        description: portfolio.description || '',
        template: portfolio.template || 'default',
        published: true,
        isActive: true,
        deploymentType: 'vercel',
        deploymentStatus: 'success',
        lastDeployedAt: new Date(),
        vercelUrl: deploymentResult.url,
        files: Object.keys(allFiles)
      }
    );

    // Update portfolio
    await this.portfolioRepository.update(portfolioId, {
      isPublished: true,
      publishedUrl: deploymentResult.url
    });

    logDeploymentActivity('Vercel deployment completed successfully', {
      portfolioId,
      vercelUrl: deploymentResult.url
    }, 'success');

    logger.info('Portfolio deployed to Vercel', {
      portfolioId,
      siteId: site._id,
      vercelUrl: deploymentResult.url
    });

    return {
      site,
      deployment: deploymentResult,
      url: deploymentResult.url
    };
  }

  /**
   * Unpublish portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unpublish result
   */
  async unpublish(portfolioId, userId) {
    logger.service('SiteService', 'unpublish', { portfolioId, userId });

    // Get portfolio with ownership check
    const portfolio = await this.portfolioRepository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Find and delete site record
    const site = await this.siteRepository.findByPortfolioAndUser(portfolioId, userId);

    if (site) {
      // Clean up files if subdomain deployment
      if (site.subdomain) {
        await this.cleanupSubdomainFiles(site.subdomain);
      }

      // Delete site record
      await this.siteRepository.delete(site._id);

      logger.info('Site record deleted', { siteId: site._id, subdomain: site.subdomain });
    }

    // Update portfolio
    await this.portfolioRepository.update(portfolioId, {
      isPublished: false,
      publishedUrl: null
    });

    logger.info('Portfolio unpublished', { portfolioId });

    return {
      success: true,
      message: 'Portfolio unpublished successfully'
    };
  }

  /**
   * Get published site by subdomain
   * @param {string} subdomain - Subdomain to lookup
   * @returns {Promise<Object>} Site data
   */
  async getPublishedSite(subdomain) {
    logger.service('SiteService', 'getPublishedSite', { subdomain });

    const site = await this.siteRepository.findBySubdomain(subdomain);

    if (!site) {
      throw NotFoundError.resource('Site', subdomain);
    }

    if (!site.published || !site.isActive) {
      throw NotFoundError.resource('Published Site', subdomain);
    }

    return site;
  }

  /**
   * Get site status for portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Site status
   */
  async getSiteStatus(portfolioId, userId) {
    logger.service('SiteService', 'getSiteStatus', { portfolioId, userId });

    const site = await this.siteRepository.findByPortfolioAndUser(portfolioId, userId);

    if (!site) {
      return {
        published: false,
        subdomain: null,
        status: 'not_published'
      };
    }

    // Generate the correct frontend URL
    const frontendUrl = config.frontend.url || 'http://localhost:5173';
    const publicUrl = site.vercelUrl || `${frontendUrl}/${site.subdomain}/html`;

    return {
      published: site.published,
      subdomain: site.subdomain,
      status: site.deploymentStatus,
      url: publicUrl,
      lastDeployedAt: site.lastDeployedAt
    };
  }

  /**
   * Generate portfolio HTML with case studies
   * @param {Object} portfolio - Portfolio object
   * @returns {Promise<Object>} { allFiles: Object, portfolioHTML: string }
   * @private
   */
  async generatePortfolioHTML(portfolio) {
    logger.service('SiteService', 'generatePortfolioHTML', { portfolioId: portfolio._id });

    // Import CaseStudy model dynamically to avoid circular dependency
    const { default: CaseStudy } = await import('../../models/CaseStudy.js');

    // Fetch case studies for this portfolio
    const caseStudies = await CaseStudy.find({ portfolioId: portfolio._id });

    logger.info('Found case studies for portfolio', {
      portfolioId: portfolio._id,
      count: caseStudies.length
    });

    // Prepare portfolio data with case studies
    const portfolioWithCaseStudies = portfolio.toObject();

    // Convert case studies array to object keyed by projectId
    if (caseStudies && caseStudies.length > 0) {
      portfolioWithCaseStudies.caseStudies = {};

      caseStudies.forEach(cs => {
        portfolioWithCaseStudies.caseStudies[cs.projectId] = cs.toObject();
      });

      // Mark projects that have case studies
      const caseStudyProjectIds = caseStudies.map(cs => String(cs.projectId));

      // Update projects in content.work.projects array
      if (portfolioWithCaseStudies.content?.work?.projects) {
        portfolioWithCaseStudies.content.work.projects =
          portfolioWithCaseStudies.content.work.projects.map(project => ({
            ...project,
            hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
          }));
      }

      // Also update content.projects array if it exists
      if (portfolioWithCaseStudies.content?.projects) {
        portfolioWithCaseStudies.content.projects =
          portfolioWithCaseStudies.content.projects.map(project => ({
            ...project,
            hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
          }));
      }
    }

    // Generate HTML files
    const templateType = portfolio.templateId || portfolio.template || 'echelon';

    logger.info('Generating HTML with template', {
      portfolioId: portfolio._id,
      template: templateType,
      hasCaseStudies: !!portfolioWithCaseStudies.caseStudies
    });

    let portfolioHTML;
    let allFiles;

    try {
      // Use template engine for template-specific design
      portfolioHTML = await getTemplateHTML(
        portfolioWithCaseStudies,
        templateType,
        { forPDF: false }
      );

      // Generate case study pages using templateConvert.js
      const caseStudyFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
      allFiles = caseStudyFiles;

      // Replace index.html with template-specific version
      allFiles['index.html'] = portfolioHTML;

      logger.info('Template-specific HTML generated successfully', {
        template: templateType,
        caseStudiesCount: Object.keys(allFiles).filter(k => k.startsWith('case-study-')).length
      });

    } catch (templateError) {
      logger.warn('Template engine failed, using fallback', {
        error: templateError.message,
        template: templateType
      });

      // Fallback to templateConvert.js
      allFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
      portfolioHTML = allFiles['index.html'];
    }

    return { allFiles, portfolioHTML };
  }

  /**
   * Save files to subdomain directory
   * @param {string} subdomain - Subdomain
   * @param {Object} files - Files object
   * @param {string} oldSubdomain - Old subdomain (for cleanup)
   * @returns {Promise<Object>} Save result
   * @private
   */
  async saveFilesToSubdomain(subdomain, files, oldSubdomain = null) {
    logger.service('SiteService', 'saveFilesToSubdomain', { subdomain, oldSubdomain });

    // Check if subdomain changed (need to clean up old folder)
    const subdomainChanged = oldSubdomain && oldSubdomain !== subdomain;

    // If subdomain changed, delete old folder
    if (subdomainChanged) {
      await this.cleanupSubdomainFiles(oldSubdomain);
      logger.info('Old subdomain folder removed', { oldSubdomain, newSubdomain: subdomain });
    }

    // Save files to new subdomain directory
    const subdomainDir = path.join(process.cwd(), 'generated-files', subdomain);
    const saveResult = await saveDeploymentFiles(files, subdomainDir);

    if (!saveResult.success) {
      throw new Error(`Failed to save deployment files: ${saveResult.error}`);
    }

    if (subdomainChanged) {
      logger.info('Portfolio moved to new subdomain', { oldSubdomain, newSubdomain: subdomain });
    } else {
      logger.info('Portfolio files updated', { subdomain });
    }

    return { subdomainDir, saveResult };
  }

  /**
   * Clean up subdomain files
   * @param {string} subdomain - Subdomain
   * @private
   */
  async cleanupSubdomainFiles(subdomain) {
    logger.service('SiteService', 'cleanupSubdomainFiles', { subdomain });

    const subdomainDir = path.join(process.cwd(), 'generated-files', subdomain);

    try {
      if (fs.existsSync(subdomainDir)) {
        fs.rmSync(subdomainDir, { recursive: true, force: true });
        logger.info('Subdomain files cleaned up', { subdomain });
      }
    } catch (error) {
      logger.warn('Could not remove subdomain folder', {
        subdomain,
        error: error.message
      });
    }
  }

  /**
   * Create or update site record in database
   * @param {Object} portfolio - Portfolio object
   * @param {string} userId - User ID
   * @param {string} subdomain - Subdomain
   * @param {Object} user - User object
   * @param {Object} files - Files object
   * @returns {Promise<Object>} Site record
   * @private
   */
  async createOrUpdateSite(portfolio, userId, subdomain, user, files) {
    logger.service('SiteService', 'createOrUpdateSite', { portfolioId: portfolio._id, subdomain });

    const siteData = {
      userId,
      portfolioId: portfolio._id,
      subdomain,
      title: portfolio.title,
      description: portfolio.description || '',
      template: portfolio.template || 'default',
      published: true,
      isActive: true,
      deploymentStatus: 'success',
      lastDeployedAt: new Date(),
      files: Object.keys(files),

      // Enhanced metadata
      metadata: {
        ownerName: user.name || user.username || '',
        ownerEmail: user.email || ''
      },

      // SEO fields
      seo: {
        title: portfolio.title || `${user.name || user.username}'s Portfolio`,
        description: portfolio.description || `Professional portfolio by ${user.name || user.username}`,
        image: portfolio.content?.hero?.backgroundImage || portfolio.content?.about?.profileImage || '',
        keywords: [
          portfolio.template || 'portfolio',
          user.name || '',
          'designer',
          'creative professional'
        ].filter(Boolean)
      }
    };

    // Upsert site record
    const site = await this.siteRepository.upsert(
      { portfolioId: portfolio._id, userId },
      siteData
    );

    logger.info('Site record created/updated', { siteId: site._id, subdomain });

    return site;
  }

  /**
   * Get user's published sites
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sites
   */
  async getUserSites(userId, options = {}) {
    logger.service('SiteService', 'getUserSites', { userId });

    return await this.siteRepository.findByUserId(userId, options);
  }

  /**
   * Get deployment history for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Deployment history
   */
  async getDeploymentHistory(userId, options = {}) {
    logger.service('SiteService', 'getDeploymentHistory', { userId });

    return await this.siteRepository.getDeploymentHistory(userId, options);
  }
}

export default new SiteService();
