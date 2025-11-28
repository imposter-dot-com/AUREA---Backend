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
    const { allFiles, portfolioHTML } = await this.generatePortfolioHTML(portfolio, subdomain);

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
   * @param {string} subdomain - Subdomain for absolute URL generation
   * @returns {Promise<Object>} { allFiles: Object, portfolioHTML: string }
   * @private
   */
  async generatePortfolioHTML(portfolio, subdomain = null) {
    logger.service('SiteService', 'generatePortfolioHTML', { portfolioId: portfolio._id, subdomain });

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

    // CRITICAL: Ensure portfolio has proper content structure
    if (!portfolioWithCaseStudies.content || typeof portfolioWithCaseStudies.content !== 'object') {
      logger.warn('Portfolio missing content structure, attempting to construct from available fields', {
        portfolioId: portfolio._id,
        hasTitle: !!portfolioWithCaseStudies.title,
        hasDescription: !!portfolioWithCaseStudies.description,
        fieldsAvailable: Object.keys(portfolioWithCaseStudies).join(', ')
      });

      // Construct content structure from available portfolio fields
      portfolioWithCaseStudies.content = this.constructContentFromPortfolio(portfolioWithCaseStudies);

      logger.info('Constructed content structure', {
        portfolioId: portfolio._id,
        hasHero: !!portfolioWithCaseStudies.content.hero,
        hasAbout: !!portfolioWithCaseStudies.content.about,
        projectCount: portfolioWithCaseStudies.content.work?.projects?.length || 0
      });
    }

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

      // CRITICAL: Clean development scripts from the HTML
      portfolioHTML = this.cleanDevelopmentScripts(portfolioHTML);

      // CRITICAL: Transform case study buttons into proper links
      // The frontend renders React buttons that lose interactivity when captured as static HTML
      portfolioHTML = this.transformCaseStudyButtons(portfolioHTML, portfolioWithCaseStudies, subdomain);

      // Debug: Log what we're passing to generateAllPortfolioFiles
      console.log('🔍 portfolioWithCaseStudies.content?.work?.projects:',
        portfolioWithCaseStudies.content?.work?.projects?.length || 0, 'items');
      console.log('🔍 portfolioWithCaseStudies keys:', Object.keys(portfolioWithCaseStudies).join(', '));
      console.log('🔍 content keys:', portfolioWithCaseStudies.content ? Object.keys(portfolioWithCaseStudies.content).join(', ') : 'no content');

      // Generate case study pages using templateConvert.js
      const caseStudyFiles = generateAllPortfolioFiles(portfolioWithCaseStudies, { forPDF: false, subdomain });
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

      // Fallback to templateConvert.js (already generates clean HTML)
      allFiles = generateAllPortfolioFiles(portfolioWithCaseStudies, { forPDF: false, subdomain });
      portfolioHTML = allFiles['index.html'];
    }

    // Import validation function
    const { validateNoPlaceholderData } = await import('../../../services/templateConvert.js');

    // Validate that generated HTML doesn't contain placeholder data
    const isValid = validateNoPlaceholderData(portfolioHTML);

    // Allow publishing with placeholder data - users may want to publish incomplete portfolios
    // This is intentional to support work-in-progress portfolios and testing
    if (!isValid) {
      logger.warn('Generated HTML contains template placeholder data (allowed)', {
        portfolioId: portfolio._id,
        template: templateType,
        note: 'Publishing with placeholder data is enabled to support incomplete portfolios'
      });
      // Previously this would throw an error, but we now allow it
      // throw new Error('Failed to generate portfolio HTML: template placeholder data detected. Please ensure your portfolio has all required fields filled.');
    }

    return { allFiles, portfolioHTML };
  }

  /**
   * Construct content structure from portfolio fields (migration helper)
   * @param {Object} portfolio - Portfolio object
   * @returns {Object} Constructed content structure
   * @private
   */
  constructContentFromPortfolio(portfolio) {
    // Try to find user info from different possible locations
    const userName = portfolio.userName || portfolio.name || portfolio.user?.name || 'Portfolio Owner';
    const userEmail = portfolio.email || portfolio.user?.email || '';
    const userBio = portfolio.bio || portfolio.description || '';

    // Construct a valid content structure from available fields
    const content = {
      hero: {
        title: portfolio.title || userName + "'s Portfolio",
        subtitle: portfolio.subtitle || portfolio.tagline || portfolio.description || 'Creative Portfolio'
      },
      about: {
        name: userName,
        bio: userBio || 'Creative professional showcasing my work',
        email: userEmail,
        phone: portfolio.phone || '',
        image: portfolio.profileImage || portfolio.image || ''
      },
      work: {
        heading: 'My Work',
        projects: []
      },
      gallery: portfolio.gallery || { heading: 'Gallery', images: [] },
      contact: portfolio.contact || {
        heading: 'Contact',
        email: userEmail
      },
      social: portfolio.social || {}
    };

    // Try to extract projects from various possible locations
    if (portfolio.projects && Array.isArray(portfolio.projects)) {
      content.work.projects = portfolio.projects.map((project, index) => ({
        id: project.id || project._id || index,
        title: project.title || project.name || `Project ${index + 1}`,
        meta: project.meta || project.category || 'PROJECT',
        description: project.description || '',
        image: project.image || project.thumbnail || project.coverImage || '',
        tags: project.tags || [],
        hasCaseStudy: false // Will be updated later if case studies exist
      }));
    }

    // Also check if there's a works array (alternative naming)
    if (!content.work.projects.length && portfolio.works && Array.isArray(portfolio.works)) {
      content.work.projects = portfolio.works.map((work, index) => ({
        id: work.id || work._id || index,
        title: work.title || work.name || `Work ${index + 1}`,
        meta: work.meta || work.type || 'WORK',
        description: work.description || '',
        image: work.image || work.thumbnail || '',
        tags: work.tags || [],
        hasCaseStudy: false
      }));
    }

    logger.info('Constructed portfolio content structure', {
      portfolioId: portfolio._id,
      projectCount: content.work.projects.length,
      hasAboutInfo: !!content.about.name,
      hasHeroContent: !!content.hero.title
    });

    return content;
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
   * Get all public published sites (for discover/gallery page)
   * No authentication required - public endpoint
   * @param {Object} options - Query options (page, limit, sortBy, order)
   * @returns {Promise<Object>} Sites with pagination
   */
  async getPublicSites(options = {}) {
    const {
      page = 1,
      limit = 12,
      sortBy = 'lastDeployedAt',
      order = 'desc'
    } = options;

    logger.service('SiteService', 'getPublicSites', { page, limit, sortBy, order });

    const { default: Site } = await import('../../models/Site.js');

    const query = {
      published: true,
      isActive: true,
      deploymentStatus: 'success'
    };

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const [sites, total] = await Promise.all([
      Site.find(query)
        .populate('portfolioId', 'title slug content.about.name content.about.headline content.about.avatarUrl templateId')
        .select('subdomain title description viewCount lastDeployedAt metadata.ownerName seo.image')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Site.countDocuments(query)
    ]);

    // Generate frontend URL
    const frontendUrl = config.frontend.url || 'http://localhost:5173';

    // Transform sites for public consumption (hide sensitive data)
    const publicSites = sites.map(site => ({
      subdomain: site.subdomain,
      title: site.title,
      description: site.description || '',
      ownerName: site.metadata?.ownerName || site.portfolioId?.content?.about?.name || 'Anonymous',
      headline: site.portfolioId?.content?.about?.headline || '',
      avatarUrl: site.portfolioId?.content?.about?.avatarUrl || '',
      coverImage: site.seo?.image || '',
      viewCount: site.viewCount || 0,
      template: site.portfolioId?.templateId || 'echelon',
      url: `${frontendUrl}/${site.subdomain}/html`,
      lastDeployedAt: site.lastDeployedAt
    }));

    return {
      sites: publicSites,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    };
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
  /**
   * Get public project data from a published portfolio
   * @param {string} portfolioIdentifier - Portfolio ID or subdomain/slug
   * @param {string} projectId - Project ID (e.g., project-1, serene-first-0)
   * @returns {Promise<Object>} Portfolio and project data
   */
  async getPublicProject(portfolioIdentifier, projectId) {
    logger.service('SiteService', 'getPublicProject', { portfolioIdentifier, projectId });

    // Import models
    const { default: Portfolio } = await import('../../models/Portfolio.js');
    const { default: Site } = await import('../../models/Site.js');
    const { default: CaseStudy } = await import('../../models/CaseStudy.js');
    const mongoose = (await import('mongoose')).default;

    let portfolio = null;
    let site = null;

    // Try to find portfolio by different identifiers
    const isValidObjectId = mongoose.Types.ObjectId.isValid(portfolioIdentifier);

    if (isValidObjectId) {
      // Try finding by portfolio _id first
      portfolio = await Portfolio.findById(portfolioIdentifier);
      if (portfolio) {
        site = await Site.findOne({ portfolioId: portfolio._id, isActive: true });
      }
    }

    // If not found by _id, try by subdomain/slug
    if (!portfolio) {
      site = await Site.findOne({ subdomain: portfolioIdentifier, isActive: true });
      if (site) {
        portfolio = await Portfolio.findById(site.portfolioId);
      }
    }

    // If still not found, try by portfolio slug
    if (!portfolio) {
      portfolio = await Portfolio.findOne({ slug: portfolioIdentifier });
      if (portfolio) {
        site = await Site.findOne({ portfolioId: portfolio._id, isActive: true });
      }
    }

    // Check if portfolio exists and is published
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    if (!portfolio.isPublished) {
      throw new NotFoundError('Portfolio not found or not published');
    }

    // Find the project based on template type
    const project = this.findProjectInPortfolio(portfolio, projectId);

    if (!project) {
      throw new NotFoundError(`Project '${projectId}' not found in portfolio`);
    }

    // Fetch case study if exists
    const caseStudy = await CaseStudy.findOne({
      portfolioId: portfolio._id,
      projectId: projectId
    });

    // Build response data
    const responseData = {
      portfolio: {
        _id: portfolio._id,
        title: portfolio.title,
        template: portfolio.template || portfolio.templateId || 'echelon',
        subdomain: site?.subdomain || portfolio.slug,
        isPublished: portfolio.isPublished
      },
      project: {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        detailedDescription: project.detailedDescription || caseStudy?.content?.overview?.description || '',
        image: project.image || '',
        images: project.images || [],
        category: project.category || '',
        year: project.year || '',
        meta: project.meta || '',
        subtitle: project.subtitle || '',
        awards: project.awards || '',
        logo: project.logo || '',
        link: project.link || '',
        span: project.span || 1,
        tags: project.tags || [],
        hasCaseStudy: !!caseStudy
      }
    };

    // Include case study data if available
    if (caseStudy) {
      responseData.caseStudy = caseStudy.toObject();
    }

    logger.info('Public project retrieved', {
      portfolioId: portfolio._id,
      projectId,
      hasCaseStudy: !!caseStudy
    });

    return responseData;
  }

  /**
   * Find project in portfolio content based on template type
   * @param {Object} portfolio - Portfolio document
   * @param {string} projectId - Project ID to find
   * @returns {Object|null} Project object or null
   * @private
   */
  findProjectInPortfolio(portfolio, projectId) {
    const template = portfolio.template || portfolio.templateId || 'echelon';
    const content = portfolio.content || {};

    logger.info('Finding project in portfolio', {
      portfolioId: portfolio._id,
      projectId,
      template,
      contentKeys: Object.keys(content)
    });

    // For Serene template, check gallery rows
    if (template === 'serene') {
      const gallery = content.gallery || {};
      const allProjects = [
        ...(gallery.firstRow || []),
        ...(gallery.secondRow || []),
        ...(gallery.thirdRow || [])
      ];

      const project = allProjects.find(p => p.id === projectId);
      if (project) return project;
    }

    // For Echelon, Chic, BoldFolio - check work.projects
    if (content.work?.projects) {
      const project = content.work.projects.find(p => p.id === projectId);
      if (project) return project;
    }

    // Also check content.projects directly (alternative structure)
    if (content.projects) {
      const project = content.projects.find(p => p.id === projectId);
      if (project) return project;
    }

    // Check gallery for non-Serene templates (some templates may use gallery)
    if (content.gallery?.projects) {
      const project = content.gallery.projects.find(p => p.id === projectId);
      if (project) return project;
    }

    // Also check all gallery rows as fallback for any template
    const gallery = content.gallery || {};
    const allGalleryProjects = [
      ...(gallery.firstRow || []),
      ...(gallery.secondRow || []),
      ...(gallery.thirdRow || [])
    ];

    const galleryProject = allGalleryProjects.find(p => p.id === projectId);
    if (galleryProject) return galleryProject;

    return null;
  }

  /**
   * Transform case study buttons into proper anchor links
   * The frontend renders React buttons that lose interactivity when captured as static HTML
   * This method converts those buttons into proper <a> links that work in static HTML
   * @param {string} html - HTML string to transform
   * @param {Object} portfolioData - Portfolio data with projects
   * @param {string} subdomain - Subdomain for absolute URL generation
   * @returns {string} Transformed HTML
   * @private
   */
  transformCaseStudyButtons(html, portfolioData, subdomain = null) {
    if (!html) return html;

    // Get projects that have case studies
    const projects = portfolioData.content?.work?.projects || [];
    const caseStudyProjectIds = Object.keys(portfolioData.caseStudies || {});

    logger.info('Transforming case study buttons', {
      totalProjects: projects.length,
      caseStudyCount: caseStudyProjectIds.length
    });

    if (caseStudyProjectIds.length === 0) {
      logger.info('No case studies to link - skipping button transformation');
      return html;
    }

    // Find all VIEW CASE STUDY buttons and replace them with links
    // Pattern: <button ...>VIEW CASE STUDY →</button>
    let buttonIndex = 0;

    html = html.replace(
      /<button([^>]*)>(VIEW CASE STUDY[^<]*)<\/button>/gi,
      (match, attributes, buttonText) => {
        // Get the project ID for this button (buttons appear in project order)
        const projectId = caseStudyProjectIds[buttonIndex] || projects[buttonIndex]?.id;
        buttonIndex++;

        if (!projectId) {
          logger.warn('No project ID found for case study button', { buttonIndex: buttonIndex - 1 });
          return match; // Keep original button if no project ID
        }

        // Extract style attribute if present
        const styleMatch = attributes.match(/style="([^"]*)"/i);
        const style = styleMatch ? styleMatch[1] : '';

        // Create anchor link with same styling - use absolute path with subdomain
        const linkPath = subdomain ? `/${subdomain}/case-study/${projectId}` : `./case-study-${projectId}.html`;
        const link = `<a href="${linkPath}" style="${style}; text-decoration: none;">${buttonText}</a>`;

        logger.info('Transformed case study button to link', { projectId });
        return link;
      }
    );

    logger.info('Case study buttons transformation complete', { buttonsTransformed: buttonIndex });
    return html;
  }

  /**
   * Clean development scripts from HTML
   * Removes Vite HMR, React refresh, and other development-only scripts
   * @param {string} html - HTML string to clean
   * @returns {string} Cleaned HTML
   * @private
   */
  cleanDevelopmentScripts(html) {
    if (!html) return html;

    logger.info('Cleaning development scripts from HTML');

    // Remove Vite client scripts
    html = html.replace(/<script[^>]*src="[^"]*\/@vite\/client"[^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src="[^"]*\/@react-refresh"[^>]*><\/script>/gi, '');

    // Remove Vite HMR inline scripts
    html = html.replace(/<script[^>]*>[\s\S]*?import\s*{\s*injectIntoGlobalHook\s*}\s*from[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*>[\s\S]*?window\.__vite[\s\S]*?<\/script>/gi, '');

    // Remove React DevTools scripts
    html = html.replace(/<script[^>]*>[\s\S]*?__REACT_DEVTOOLS[\s\S]*?<\/script>/gi, '');

    // Remove development mode indicators
    html = html.replace(/<script[^>]*>[\s\S]*?process\.env\.NODE_ENV[\s\S]*?<\/script>/gi, '');

    // Remove Vite preload modules
    html = html.replace(/<link[^>]*rel="modulepreload"[^>]*href="[^"]*\/@vite[^"]*"[^>]*>/gi, '');

    // Remove localhost references (common in development)
    html = html.replace(/http:\/\/localhost:\d+/gi, '');

    // Remove source map comments
    html = html.replace(/\/\/# sourceMappingURL=.*/gi, '');
    html = html.replace(/\/\*# sourceMappingURL=.*\*\//gi, '');

    // Validate that dev scripts are removed
    if (html.includes('@vite/client') || html.includes('@react-refresh')) {
      logger.warn('Development scripts may still be present after cleaning');
    } else {
      logger.info('Development scripts successfully removed from HTML');
    }

    return html;
  }
}

export default new SiteService();
