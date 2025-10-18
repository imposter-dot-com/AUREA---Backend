import Site from '../models/Site.js';
import Portfolio from '../models/Portfolio.js';
import CaseStudy from '../models/CaseStudy.js';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import HTML generation services
import { generatePortfolioHTML, generateAllPortfolioFiles } from '../../services/templateConvert.js';
import { getTemplateHTML } from '../services/templateEngine.js';

// Import subdomain validation utility
import { validateSubdomain, isReservedSubdomain, generateSubdomainSuggestions } from '../utils/subdomainValidator.js';

// Import deployment service modules
import { 
  generateDeploymentFiles, 
  saveDeploymentFiles, 
  validateDeployment, 
  generateDeploymentSummary,
  logDeploymentActivity,
  deployToVercel 
} from '../../services/deploymentService.js';

// Function to extract user name from portfolio hero section and create subdomain
// Generate clean subdomain from portfolio's designer name
function generateSubdomainFromPortfolio(portfolio, user) {
  try {
    let designerName = null;
    
    // Try to extract designer name from portfolio about section
    if (portfolio.content?.about?.name) {
      designerName = portfolio.content.about.name;
    } else if (portfolio.sections?.about?.name) {
      designerName = portfolio.sections.about.name;
    } else if (portfolio.about?.name) {
      designerName = portfolio.about.name;
    }
    
    // If no designer name found, try user data as fallback
    if (!designerName) {
      designerName = user.username || user.name || user.email?.split('@')[0];
    }
    
    if (designerName) {
      // Clean the name for folder naming
      const cleanName = designerName
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, '') // Remove special characters but keep underscores
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // Ensure minimum length
      if (cleanName.length >= 3) {
        return cleanName;
      }
    }
    
    // Final fallback to user ID
    return `user-${user._id || Date.now()}`;
  } catch (error) {
    console.log('Error generating subdomain from portfolio:', error);
    return `user-${Date.now()}`;
  }
}

// Legacy function - keeping for backward compatibility but deprecated
function generateSubdomainFromUser(user) {
  try {
    // Try to get a meaningful name from user data
    const username = user.username || user.name || user.email?.split('@')[0];
    
    if (username) {
      // Clean the username for folder naming
      const cleanName = username
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, '') // Remove special characters but keep underscores
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // Ensure minimum length
      if (cleanName.length >= 3) {
        return cleanName;
      }
    }
    
    // Fallback to user ID if username not available
    return `user-${user._id || Date.now()}`;
  } catch (error) {
    console.log('Error generating subdomain from user:', error);
    return `user-${Date.now()}`;
  }
}

// Legacy function - keeping for backward compatibility
function generateSubdomainFromHero(portfolio) {
  try {
    // Find hero section
    const heroSection = portfolio.sections?.find(section => section.type === 'hero');
    const heroName = heroSection?.content?.name;
    
    if (heroName && typeof heroName === 'string') {
      // Clean and format the name for subdomain
      const cleanName = heroName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // Ensure minimum length and add timestamp to make it unique
      if (cleanName.length >= 3) {
        return `${cleanName}-portfolio`;
      }
    }
    
    // Fallback to user ID or timestamp if name not available
    return `portfolio-${Date.now()}`;
  } catch (error) {
    console.log('Error generating subdomain from hero:', error);
    return `portfolio-${Date.now()}`;
  }
}

// @desc    Generate HTML/CSS files for debugging
// @access  Private
export const debugGenerate = async (req, res) => {
  try {
    const { portfolioId } = req.body;
    const actualUserId = req.user._id;

    // Validate required parameters
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    logDeploymentActivity('Debug generation started', { portfolioId, userId: actualUserId });

    // Find and validate portfolio
    const portfolio = await Portfolio.findOne({ 
      _id: portfolioId, 
      userId: actualUserId 
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found or access denied'
      });
    }

    // Fetch case studies for this portfolio
    const caseStudies = await CaseStudy.find({ portfolioId: portfolioId });
    
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
        portfolioWithCaseStudies.content.work.projects = portfolioWithCaseStudies.content.work.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
      
      // Also update content.projects array if it exists
      if (portfolioWithCaseStudies.content?.projects) {
        portfolioWithCaseStudies.content.projects = portfolioWithCaseStudies.content.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
    }

    // Generate HTML content using templateConvert service (includes case studies)
    const allFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
    const htmlContent = allFiles['index.html'];
    const cssContent = '/* CSS is included inline in HTML */'; // Placeholder for compatibility

    // Use all generated files
    const deploymentFiles = allFiles;

    // Generate subdomain from portfolio's designer name for consistency
    const subdomain = generateSubdomainFromPortfolio(portfolio, req.user);

    // Validate deployment readiness
    const validation = validateDeployment(
      { 
        subdomain: subdomain,
        title: portfolio.title 
      },
      htmlContent,
      cssContent
    );

    logDeploymentActivity('Debug generation completed', { 
      portfolioId, 
      validation: validation.score 
    }, 'success');

    res.json({
      success: true,
      message: 'Files generated successfully',
      data: {
        portfolio: {
          id: portfolio._id,
          title: portfolio.title,
          slug: portfolio.slug,
          template: portfolio.template
        },
        files: deploymentFiles,
        validation,
        stats: {
          htmlSize: Buffer.byteLength(htmlContent, 'utf8'),
          cssSize: Buffer.byteLength(cssContent, 'utf8'),
          totalFiles: Object.keys(deploymentFiles).length
        }
      }
    });

  } catch (error) {
    logDeploymentActivity('Debug generation failed', { error: error.message }, 'error');
    console.error('Create debug generate error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Publish portfolio to hosting platform
// @access  Private
export const publishSite = async (req, res) => {
  try {
    const { portfolioId, customDomain } = req.body;
    const actualUserId = req.user._id;

    // Validate required parameters - subdomain is now auto-generated
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find and validate portfolio
    const portfolio = await Portfolio.findOne({ 
      _id: portfolioId, 
      userId: actualUserId 
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found or access denied'
      });
    }

    // Generate subdomain from portfolio's designer name
    let subdomain = generateSubdomainFromPortfolio(portfolio, req.user);

    logDeploymentActivity('Publication started', { 
      portfolioId, 
      subdomain, 
      userId: actualUserId 
    });

    // Check if subdomain is already taken (allow user to update their own site)
    const existingSite = await Site.findOne({ 
      subdomain,
      userId: { $ne: actualUserId }
    });

    if (existingSite) {
      // If subdomain is taken by another user, add timestamp to make it unique
      const uniqueSubdomain = `${subdomain}-${Date.now()}`;
      console.log(`Subdomain ${subdomain} taken, using ${uniqueSubdomain}`);
      subdomain = uniqueSubdomain;
    }

    // Fetch case studies for this portfolio
    const caseStudies = await CaseStudy.find({ portfolioId: portfolioId });
    
    console.log(`\n📑 === CASE STUDY DEBUG INFO (publishSite) ===`);
    console.log(`Portfolio ID: ${portfolioId}`);
    console.log(`Found ${caseStudies.length} case studies`);
    
    // Prepare portfolio data with case studies
    const portfolioWithCaseStudies = portfolio.toObject();
    
    // Convert case studies array to object keyed by projectId
    if (caseStudies && caseStudies.length > 0) {
      portfolioWithCaseStudies.caseStudies = {};
      
      caseStudies.forEach((cs, index) => {
        console.log(`\nCase Study ${index + 1}:`);
        console.log(`  Project ID: ${cs.projectId}`);
        console.log(`  Has content: ${!!cs.content}`);
        console.log(`  Has hero: ${!!cs.content?.hero}`);
        console.log(`  Hero title: ${cs.content?.hero?.title || 'MISSING'}`);
        console.log(`  Has sections: ${!!cs.content?.sections}`);
        console.log(`  Section count: ${cs.content?.sections?.length || 0}`);
        console.log(`  Has overview: ${!!cs.content?.overview}`);
        
        portfolioWithCaseStudies.caseStudies[cs.projectId] = cs.toObject();
      });
      
      console.log(`\nCase Studies Object Keys: ${Object.keys(portfolioWithCaseStudies.caseStudies).join(', ')}`);
      console.log(`=== END CASE STUDY DEBUG ===\n`);
      
      // Mark projects that have case studies
      const caseStudyProjectIds = caseStudies.map(cs => String(cs.projectId));
      
      // Update projects in content.work.projects array
      if (portfolioWithCaseStudies.content?.work?.projects) {
        portfolioWithCaseStudies.content.work.projects = portfolioWithCaseStudies.content.work.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
      
      // Also update content.projects array if it exists
      if (portfolioWithCaseStudies.content?.projects) {
        portfolioWithCaseStudies.content.projects = portfolioWithCaseStudies.content.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
    }

    // Generate HTML content using templateConvert service (includes case studies)
    const allFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
    const htmlContent = allFiles['index.html'];
    const cssContent = '/* CSS is included inline in HTML */'; // Placeholder for compatibility

    // Create site configuration
    const siteConfig = {
      subdomain,
      title: portfolio.title,
      owner: actualUserId,
      template: portfolio.template,
      customDomain,
      portfolioData: portfolio.toObject()
    };

    // Validate deployment
    const validation = validateDeployment(siteConfig, htmlContent, cssContent);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Deployment validation failed',
        data: {
          issues: validation.issues,
          recommendations: validation.recommendations
        }
      });
    }

    // Use all generated files (index.html + case studies)
    const deploymentFiles = allFiles;

    // Save files to generated-files directory (in subdomain-specific folder)
    const subdomainDir = path.join(process.cwd(), 'generated-files', subdomain);
    const saveResult = await saveDeploymentFiles(deploymentFiles, subdomainDir);

    if (!saveResult.success) {
      throw new Error(`Failed to save deployment files: ${saveResult.error}`);
    }

    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    const vercelDeployment = await deployToVercel(deploymentFiles, subdomain, siteConfig);

    if (!vercelDeployment.success) {
      throw new Error(`Vercel deployment failed: ${vercelDeployment.error}`);
    }

    console.log('✅ Successfully deployed to Vercel!');
    console.log(`🌐 Live URL: ${vercelDeployment.url}`);

    // Create or update site record in database with enhanced metadata
    const siteData = {
      userId: actualUserId,
      portfolioId: portfolioId,
      subdomain,
      title: portfolio.title,
      description: portfolio.description,
      customDomain,
      template: portfolio.template,
      published: true,
      isActive: true,  // Explicitly set active
      lastDeployedAt: new Date(),
      deploymentStatus: 'success',
      files: saveResult.files.map(f => f.filename),
      styling: portfolio.styling,
      vercelDeploymentId: vercelDeployment.deploymentId,
      vercelUrl: vercelDeployment.url,

      // Enhanced metadata for search/display
      metadata: {
        ownerName: req.user.name || req.user.username || '',
        ownerEmail: req.user.email || ''
      },

      // SEO fields
      seo: {
        title: portfolio.title || `${req.user.name || req.user.username}'s Portfolio`,
        description: portfolio.description || `Professional portfolio by ${req.user.name || req.user.username}`,
        image: portfolio.content?.hero?.backgroundImage || portfolio.content?.about?.profileImage || '',
        keywords: [
          portfolio.template || 'portfolio',
          req.user.name || '',
          'designer',
          'creative professional'
        ].filter(Boolean)
      }
    };

    let site = await Site.findOne({ subdomain, userId: actualUserId });
    
    if (site) {
      // Update existing site
      Object.assign(site, siteData);
      await site.save();
      logDeploymentActivity('Site updated', { siteId: site._id }, 'success');
    } else {
      // Create new site
      site = new Site(siteData);
      await site.save();
      logDeploymentActivity('New site created', { siteId: site._id }, 'success');
    }

    // Update portfolio with publication info
    portfolio.isPublished = true;
    portfolio.publishedUrl = vercelDeployment.url; // Use real Vercel URL
    portfolio.slug = subdomain;
    portfolio.publishedAt = new Date();
    await portfolio.save();

    // Generate deployment summary
    const deploymentSummary = generateDeploymentSummary(
      siteConfig,
      saveResult,
      validation
    );

    logDeploymentActivity('Publication completed', { 
      siteId: site._id,
      url: portfolio.url 
    }, 'success');

    res.status(201).json({
      success: true,
      message: 'Portfolio published successfully!',
      data: {
        site: {
          id: site._id,
          subdomain,
          url: portfolio.url,
          vercelUrl: vercelDeployment.url,
          customDomain,
          deploymentId: vercelDeployment.deploymentId,
          inspectorUrl: vercelDeployment.inspectorUrl
        },
        portfolio: {
          id: portfolio._id,
          title: portfolio.title,
          published: true
        },
        deployment: deploymentSummary,
        vercel: {
          deploymentId: vercelDeployment.deploymentId,
          url: vercelDeployment.url,
          status: vercelDeployment.status,
          createdAt: vercelDeployment.createdAt,
          regions: vercelDeployment.regions
        },
        files: {
          generated: saveResult.filesGenerated,
          totalSize: saveResult.totalSize,
          directory: saveResult.directory
        }
      }
    });

  } catch (error) {
    logDeploymentActivity('Publication failed', { error: error.message }, 'error');
    console.error('Publish site error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to publish portfolio',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get site deployment status
// @access  Public
export const getSiteStatus = async (req, res) => {
  try {
    const { subdomain } = req.query;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain parameter is required'
      });
    }

    // Find site by subdomain
    const site = await Site.findOne({ subdomain }).populate('portfolioId');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if site is accessible
    const siteUrl = site.customDomain || `https://${subdomain}.vercel.app`;
    let isAccessible = false;
    let responseTime = null;

    try {
      const startTime = Date.now();
      const response = await fetch(siteUrl, { 
        method: 'HEAD',
        timeout: 5000 
      });
      responseTime = Date.now() - startTime;
      isAccessible = response.ok;
    } catch (error) {
      console.warn(`Site accessibility check failed for ${siteUrl}:`, error.message);
    }

    res.json({
      success: true,
      message: 'Site status retrieved successfully',
      data: {
        site: {
          id: site._id,
          subdomain: site.subdomain,
          title: site.title,
          url: siteUrl,
          customDomain: site.customDomain,
          published: site.published,
          lastDeployedAt: site.lastDeployedAt,
          deploymentStatus: site.deploymentStatus
        },
        health: {
          isAccessible,
          responseTime,
          lastChecked: new Date()
        },
        portfolio: site.portfolioId ? {
          id: site.portfolioId._id,
          title: site.portfolioId.title,
          template: site.portfolioId.template
        } : null
      }
    });

  } catch (error) {
    console.error('Get site status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check site status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get site configuration
// @access  Public
export const getSiteConfig = async (req, res) => {
  try {
    const { subdomain } = req.query;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain parameter is required'
      });
    }

    const site = await Site.findOne({ subdomain }).populate('portfolioId');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'Site configuration retrieved successfully',
      data: {
        site: {
          id: site._id,
          subdomain: site.subdomain,
          title: site.title,
          description: site.description,
          customDomain: site.customDomain,
          template: site.template,
          published: site.published,
          styling: site.styling
        },
        deployment: {
          status: site.deploymentStatus,
          lastDeployedAt: site.lastDeployedAt,
          files: site.files
        },
        portfolio: site.portfolioId ? {
          id: site.portfolioId._id,
          title: site.portfolioId.title,
          sectionsCount: site.portfolioId.sections?.length || 0
        } : null
      }
    });

  } catch (error) {
    console.error('Get site config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update site configuration
// @access  Private
export const updateSiteConfig = async (req, res) => {
  try {
    const { subdomain, title, description, customDomain, published } = req.body;
    const actualUserId = req.user._id;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is required'
      });
    }

    // Find and validate site ownership
    const site = await Site.findOne({ 
      subdomain, 
      userId: actualUserId 
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found or access denied'
      });
    }

    // Update site configuration
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (customDomain !== undefined) updateData.customDomain = customDomain;
    if (published !== undefined) updateData.published = published;

    Object.assign(site, updateData);
    await site.save();

    logDeploymentActivity('Site configuration updated', { 
      siteId: site._id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Site configuration updated successfully',
      data: {
        site: {
          id: site._id,
          subdomain: site.subdomain,
          title: site.title,
          description: site.description,
          customDomain: site.customDomain,
          published: site.published
        }
      }
    });

  } catch (error) {
    logDeploymentActivity('Configuration update failed', { error: error.message }, 'error');
    console.error('Update site config error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update site configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Record site analytics/views
// @access  Public
export const recordSiteView = async (req, res) => {
  try {
    const { subdomain, userAgent, referrer, isUniqueVisitor } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is required'
      });
    }

    // Find active site
    const site = await Site.findBySubdomain(subdomain);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Extract referrer domain if provided
    let referrerSource = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerSource = referrerUrl.hostname;
      } catch (error) {
        referrerSource = referrer.substring(0, 100);
      }
    }

    // Update view count with enhanced analytics
    await site.incrementViews(referrerSource, isUniqueVisitor || false);

    // Update associated portfolio view count
    if (site.portfolioId) {
      await Portfolio.findByIdAndUpdate(
        site.portfolioId,
        { 
          $inc: { viewCount: 1 },
          lastViewedAt: new Date()
        }
      );
    }

    // Log analytics data (in production, this could go to an analytics service)
    logDeploymentActivity('Page view recorded', {
      subdomain,
      totalViews: site.viewCount,
      uniqueVisitors: site.uniqueVisitors,
      referrer: referrerSource,
      userAgent: userAgent?.substring(0, 100) // Truncate for privacy
    });

    res.json({
      success: true,
      message: 'View recorded successfully',
      data: {
        viewCount: site.viewCount,
        uniqueVisitors: site.uniqueVisitors,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Record site view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Publish portfolio to local subdomain (aurea.tool/$user)
// @access  Private
export const subPublish = async (req, res) => {
  try {
    const { portfolioId, customSubdomain } = req.body;
    const actualUserId = req.user._id;

    // Validate required parameters
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find and validate portfolio
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      userId: actualUserId
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found or access denied'
      });
    }

    // customSubdomain is ALWAYS required - user must explicitly provide it
    if (!customSubdomain) {
      // Generate suggestions based on portfolio name for user convenience
      const suggestedSubdomain = generateSubdomainFromPortfolio(portfolio, req.user);
      const suggestions = [suggestedSubdomain];

      // Add more suggestions
      const existingSite = await Site.findOne({ subdomain: suggestedSubdomain });
      if (existingSite) {
        suggestions.push(`${suggestedSubdomain}-portfolio`);
        suggestions.push(`${suggestedSubdomain}-${new Date().getFullYear()}`);
      } else {
        suggestions.push(`${suggestedSubdomain}-portfolio`);
        suggestions.push(`${req.user.name.toLowerCase().replace(/\s+/g, '-')}`);
      }

      return res.status(400).json({
        success: false,
        message: 'Custom subdomain is required. Please choose a unique subdomain for your portfolio.',
        required: 'customSubdomain',
        currentSubdomain: portfolio.slug || null,
        suggestions: suggestions.filter(s => s.length >= 3 && s.length <= 30).slice(0, 5)
      });
    }

    // Validate custom subdomain format using validation utility
    const validation = validateSubdomain(customSubdomain);

    if (!validation.valid) {
      const suggestions = generateSubdomainSuggestions(customSubdomain);
      return res.status(400).json({
        success: false,
        message: validation.error,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      });
    }

    // Check if custom subdomain is available
    const existingSite = await Site.findOne({ subdomain: customSubdomain });

    if (existingSite) {
      // Check if it belongs to the current user's THIS portfolio
      const isSamePortfolio = existingSite.portfolioId.toString() === portfolioId.toString();
      const isSameUser = existingSite.userId.toString() === actualUserId.toString();

      if (!isSameUser) {
        // Different user owns this subdomain - generate suggestions
        const suggestions = generateSubdomainSuggestions(customSubdomain);
        return res.status(409).json({
          success: false,
          message: 'This subdomain is already taken by another user. Please choose a different subdomain.',
          subdomain: customSubdomain,
          available: false,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        });
      }

      if (isSameUser && !isSamePortfolio) {
        // Same user but different portfolio owns this subdomain
        const suggestions = generateSubdomainSuggestions(customSubdomain);
        return res.status(409).json({
          success: false,
          message: 'This subdomain is already used by another one of your portfolios. Please choose a different subdomain.',
          subdomain: customSubdomain,
          available: false,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        });
      }

      // If it's the same portfolio, allow update (user is keeping/changing subdomain)
      console.log(`✅ User is publishing/updating portfolio with subdomain: ${customSubdomain}`);
    } else {
      console.log(`✅ Subdomain is available: ${customSubdomain}`);
    }

    const subdomain = customSubdomain;
    const isCustomSubdomain = true;
    console.log(`Using subdomain from user: ${subdomain}`);

    logDeploymentActivity('Sub-publication started', { 
      portfolioId, 
      subdomain, 
      userId: actualUserId,
      isCustom: isCustomSubdomain
    });

    // Fetch case studies for this portfolio
    const caseStudies = await CaseStudy.find({ portfolioId: portfolioId });
    
    console.log(`\n📑 === CASE STUDY DEBUG INFO (subPublish) ===`);
    console.log(`Portfolio ID: ${portfolioId}`);
    console.log(`Found ${caseStudies.length} case studies`);
    
    // Prepare portfolio data with case studies
    const portfolioWithCaseStudies = portfolio.toObject();
    
    // Convert case studies array to object keyed by projectId
    if (caseStudies && caseStudies.length > 0) {
      portfolioWithCaseStudies.caseStudies = {};
      
      caseStudies.forEach((cs, index) => {
        console.log(`\nCase Study ${index + 1}:`);
        console.log(`  Project ID: ${cs.projectId}`);
        console.log(`  Has content: ${!!cs.content}`);
        
        portfolioWithCaseStudies.caseStudies[cs.projectId] = cs.toObject();
      });
      
      console.log(`\nCase Studies Object Keys: ${Object.keys(portfolioWithCaseStudies.caseStudies).join(', ')}`);
      console.log(`=== END CASE STUDY DEBUG ===\n`);
      
      // Mark projects that have case studies
      const caseStudyProjectIds = caseStudies.map(cs => String(cs.projectId));
      
      // Update projects in content.work.projects array
      if (portfolioWithCaseStudies.content?.work?.projects) {
        portfolioWithCaseStudies.content.work.projects = portfolioWithCaseStudies.content.work.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
      
      // Also update content.projects array if it exists
      if (portfolioWithCaseStudies.content?.projects) {
        portfolioWithCaseStudies.content.projects = portfolioWithCaseStudies.content.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
    }

    // Generate HTML content using template engine for portfolio (template-specific design)
    console.log('📄 Generating HTML files for portfolio and case studies...');

    // Always use template engine for template-specific design (Echelon, Serene, etc.)
    const templateType = portfolio.templateId || portfolio.template || 'echolon';
    console.log(`📋 Template type: ${templateType}`);
    console.log(`🎨 Using template engine for template-specific generation`);

    let portfolioHTML;
    let allFiles;

    // Debug: Log portfolio structure before generation
    console.log('\n📊 Portfolio Structure Debug:');
    console.log('  Has content:', !!portfolioWithCaseStudies.content);
    console.log('  Has content.work:', !!portfolioWithCaseStudies.content?.work);
    console.log('  Has content.work.projects:', !!portfolioWithCaseStudies.content?.work?.projects);
    console.log('  Projects count:', portfolioWithCaseStudies.content?.work?.projects?.length || 0);
    console.log('  Has caseStudies:', !!portfolioWithCaseStudies.caseStudies);
    console.log('  Case studies count:', Object.keys(portfolioWithCaseStudies.caseStudies || {}).length);

    if (portfolioWithCaseStudies.content?.work?.projects) {
      console.log('\n  Projects with hasCaseStudy flag:');
      portfolioWithCaseStudies.content.work.projects.forEach((p, i) => {
        console.log(`    Project ${i + 1}: id=${p.id}, hasCaseStudy=${p.hasCaseStudy}`);
      });
    }

    try {
      console.log(`🎨 Using template engine for ${templateType} template...`);

      // Use template engine to get template-specific HTML (Echelon, Serene, etc.)
      portfolioHTML = await getTemplateHTML(
        portfolioWithCaseStudies,
        templateType,
        { forPDF: false } // Web viewing, not PDF
      );

      // Generate case study pages using templateConvert.js (uniform design)
      const caseStudyFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
      allFiles = caseStudyFiles; // Start with all files

      // Replace index.html with template-specific version
      allFiles['index.html'] = portfolioHTML;

      console.log('✅ Template-specific HTML generated successfully');
      console.log('  Portfolio HTML: Template-specific design');
      console.log('  Case studies:', Object.keys(allFiles).filter(k => k.startsWith('case-study-')).length);
    } catch (templateError) {
      console.warn('⚠️ Template engine failed, using fallback:', templateError.message);
      console.error('Full error:', templateError);
      // Fallback to templateConvert.js if template engine fails
      allFiles = generateAllPortfolioFiles(portfolioWithCaseStudies);
      portfolioHTML = allFiles['index.html'];
    }

    // Combine: template-specific portfolio + uniform case studies
    const deploymentFiles = {
      'index.html': portfolioHTML, // Main page
      ...Object.fromEntries(
        Object.entries(allFiles).filter(([key]) => key.startsWith('case-study-'))
      ) // Case study pages
    };

    const htmlContent = portfolioHTML;

    // Create site configuration
    const siteConfig = {
      subdomain,
      title: portfolio.title,
      owner: actualUserId,
      template: portfolio.template,
      portfolioData: portfolio.toObject()
    };

    // Validate deployment
    const deploymentValidation = validateDeployment(siteConfig, htmlContent, '');

    if (!deploymentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Deployment validation failed',
        data: {
          issues: deploymentValidation.issues,
          recommendations: deploymentValidation.recommendations
        }
      });
    }

    // deploymentFiles already defined above with template-specific HTML

    // Check if subdomain changed (need to clean up old folder)
    const oldSubdomain = portfolio.slug;
    const subdomainChanged = oldSubdomain && oldSubdomain !== subdomain;

    // If subdomain changed, delete old folder
    if (subdomainChanged) {
      const oldSubdomainDir = path.join(process.cwd(), 'generated-files', oldSubdomain);
      try {
        if (fs.existsSync(oldSubdomainDir)) {
          fs.rmSync(oldSubdomainDir, { recursive: true, force: true });
          console.log(`🗑️  Removed old subdomain folder: ${oldSubdomain}`);
        }
      } catch (error) {
        console.warn(`Warning: Could not remove old subdomain folder: ${error.message}`);
      }
    }

    // Save files to generated-files directory (in subdomain-specific folder)
    const subdomainDir = path.join(process.cwd(), 'generated-files', subdomain);
    const saveResult = await saveDeploymentFiles(deploymentFiles, subdomainDir);

    if (!saveResult.success) {
      throw new Error(`Failed to save deployment files: ${saveResult.error}`);
    }

    if (subdomainChanged) {
      console.log(`✅ Successfully moved portfolio to new subdomain: ${oldSubdomain} → ${subdomain}`);
    } else {
      console.log('✅ Successfully updated portfolio files!');
    }
    console.log(`📁 Location: ${subdomainDir}`);

    // Create or update site record in database with enhanced metadata
    const siteData = {
      userId: actualUserId,
      portfolioId: portfolio._id,
      subdomain,
      title: portfolio.title,
      description: portfolio.description || '',
      template: portfolio.template || 'default',
      published: true,
      isActive: true,  // Explicitly set active
      deploymentStatus: 'success',
      lastDeployedAt: new Date(),
      files: Object.keys(deploymentFiles),

      // Enhanced metadata for search/display
      metadata: {
        ownerName: req.user.name || req.user.username || '',
        ownerEmail: req.user.email || ''
      },

      // SEO fields
      seo: {
        title: portfolio.title || `${req.user.name || req.user.username}'s Portfolio`,
        description: portfolio.description || `Professional portfolio by ${req.user.name || req.user.username}`,
        image: portfolio.content?.hero?.backgroundImage || portfolio.content?.about?.profileImage || '',
        keywords: [
          portfolio.template || 'portfolio',
          req.user.name || '',
          'designer',
          'creative professional'
        ].filter(Boolean)
      }
    };

    // Find existing site for this user's portfolio
    let site = await Site.findOne({ 
      portfolioId: portfolio._id,
      userId: actualUserId
    });

    if (site) {
      // Update existing site
      Object.assign(site, siteData);
      await site.save();
      console.log('Updated existing site record');
    } else {
      // Create new site
      site = new Site(siteData);
      await site.save();
      console.log('Created new site record');
    }

    // Update portfolio published status
    portfolio.isPublished = true;
    portfolio.slug = subdomain;
    portfolio.publishedUrl = `aurea.tool/${subdomain}`;
    await portfolio.save();

    // Generate summary
    const summary = generateDeploymentSummary(
      site,
      deploymentFiles,
      validation,
      { localPath: subdomainDir }
    );

    logDeploymentActivity('Sub-publication completed successfully', {
      portfolioId,
      subdomain,
      filesCount: Object.keys(deploymentFiles).length,
      localPath: subdomainDir
    }, 'success');

    res.json({
      success: true,
      message: 'Portfolio published successfully to local subdomain',
      data: {
        site: {
          id: site._id,
          subdomain: site.subdomain,
          url: `aurea.tool/${subdomain}`,
          localUrl: `http://localhost:5000/api/sites/${subdomain}`,
          htmlFile: `${subdomainDir}/index.html`, // Direct path to HTML file
          published: site.published,
          deploymentStatus: site.deploymentStatus,
          lastDeployedAt: site.lastDeployedAt
        },
        portfolio: {
          id: portfolio._id,
          title: portfolio.title,
          slug: portfolio.slug,
          template: portfolio.templateId || portfolio.template || 'default',
          publishedUrl: portfolio.publishedUrl
        },
        deployment: {
          filesGenerated: Object.keys(deploymentFiles),
          localPath: subdomainDir,
          template: portfolio.templateId || portfolio.template || 'default',
          validation: {
            score: validation.score,
            isValid: validation.isValid
          }
        },
        summary
      }
    });

  } catch (error) {
    logDeploymentActivity('Sub-publication failed', { error: error.message }, 'error');
    console.error('Sub-publish site error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to publish portfolio',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Unpublish a site (soft delete)
// @route   DELETE /api/sites/unpublish/:portfolioId
// @access  Private
export const unpublishSite = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user._id;

    // Validate portfolio ID
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find site for this portfolio
    const site = await Site.findOne({
      portfolioId,
      userId
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Published site not found'
      });
    }

    // Deactivate site (soft delete)
    await site.deactivate();

    // Update portfolio published status
    const portfolio = await Portfolio.findById(portfolioId);
    if (portfolio) {
      portfolio.isPublished = false;
      portfolio.publishedUrl = null;
      await portfolio.save();
    }

    // Optionally delete generated files from disk
    const subdomainDir = path.join(process.cwd(), 'generated-files', site.subdomain);
    try {
      if (fs.existsSync(subdomainDir)) {
        fs.rmSync(subdomainDir, { recursive: true, force: true });
        console.log(`🗑️  Removed generated files for: ${site.subdomain}`);
      }
    } catch (error) {
      console.warn(`Warning: Could not remove generated files: ${error.message}`);
      // Continue even if file deletion fails
    }

    logDeploymentActivity('Site unpublished', {
      siteId: site._id,
      subdomain: site.subdomain,
      portfolioId
    }, 'success');

    res.status(200).json({
      success: true,
      message: 'Site unpublished successfully',
      data: {
        subdomain: site.subdomain,
        portfolioId,
        unpublishedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Unpublish site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish site',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};