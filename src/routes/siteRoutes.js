import express from 'express';
import { auth } from '../middleware/auth.js';
import { publishLimiter, publicViewLimiter } from '../middleware/rateLimiter.js';
import logger from '../infrastructure/logging/Logger.js';
import {
  debugGenerate,
  publishSite,
  subPublish,
  unpublishSite,
  getSiteStatus,
  getSiteConfig,
  updateSiteConfig,
  recordSiteView,
  getPublicProject
} from '../controllers/siteController.js';

const router = express.Router();

// ==========================================
// SPECIFIC ROUTES MUST COME BEFORE /:subdomain CATCH-ALL
// ==========================================

// POST /api/sites/debug-generate - Generate HTML/CSS files for debugging
router.post('/debug-generate', auth, publishLimiter, debugGenerate);

// POST /api/sites/publish - Publish portfolio to Vercel (with rate limiting)
router.post('/publish', auth, publishLimiter, publishSite);

// POST /api/sites/sub-publish - Publish portfolio to local subdomain (with rate limiting)
router.post('/sub-publish', auth, publishLimiter, subPublish);

// DELETE /api/sites/unpublish/:portfolioId - Unpublish a site (soft delete)
router.delete('/unpublish/:portfolioId', auth, unpublishSite);

// GET /api/sites/status - Get site deployment status
router.get('/status', getSiteStatus);

// GET /api/sites/config - Get site configuration
router.get('/config', auth, getSiteConfig);

// PUT /api/sites/config - Update site configuration
router.put('/config', auth, updateSiteConfig);

// POST /api/sites/analytics/view - Record site view for analytics (with rate limiting)
router.post('/analytics/view', publicViewLimiter, recordSiteView);

// POST /api/sites/:portfolioId/regenerate - Force regeneration of portfolio HTML files
router.post('/:portfolioId/regenerate', auth, publishLimiter, async (req, res, next) => {
  try {
    const { portfolioId } = req.params;

    // Import required models and services
    const { default: Portfolio } = await import('../models/Portfolio.js');
    const { default: Site } = await import('../models/Site.js');
    const { default: SiteService } = await import('../core/services/SiteService.js');

    // Find the portfolio and verify ownership
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      userId: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found or access denied'
      });
    }

    // Find the associated site
    const site = await Site.findOne({ portfolioId });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found for this portfolio. Please publish the portfolio first.'
      });
    }

    // Initialize SiteService
    const siteService = new SiteService();

    // Regenerate HTML files
    logger.info('Regenerating HTML files for portfolio', {
      portfolioId,
      subdomain: site.subdomain
    });

    const { allFiles, portfolioHTML } = await siteService.generatePortfolioHTML(portfolio);

    // Save the regenerated files
    const saveResult = await siteService.saveFilesToSubdomain(
      site.subdomain,
      allFiles,
      null // No old subdomain to cleanup
    );

    if (!saveResult.success) {
      throw new Error(saveResult.message || 'Failed to save regenerated files');
    }

    // Update the site's lastDeployedAt timestamp
    site.lastDeployedAt = new Date();
    await site.save();

    logger.info('Successfully regenerated portfolio HTML', {
      portfolioId,
      subdomain: site.subdomain,
      filesGenerated: Object.keys(allFiles).length
    });

    res.json({
      success: true,
      message: 'Portfolio HTML files regenerated successfully',
      data: {
        portfolioId,
        subdomain: site.subdomain,
        filesGenerated: Object.keys(allFiles).length,
        url: `/${site.subdomain}/html`
      }
    });

  } catch (error) {
    logger.error('Error regenerating portfolio HTML', { error: error.message });
    next(error);
  }
});

// ==========================================
// PUBLIC PROJECT DATA ROUTE (must be before /:subdomain catch-all)
// ==========================================

// GET /api/sites/:portfolioId/project/:projectId - Get public project data from published portfolio
// Accepts portfolioId as MongoDB _id OR subdomain/slug
router.get('/:portfolioId/project/:projectId', publicViewLimiter, getPublicProject);

// ==========================================
// PARAMETERIZED ROUTES
// ==========================================

// GET /api/sites/:subdomain/debug - Debug portfolio data structure (protected)
router.get('/:subdomain/debug', auth, async (req, res, next) => {
  try {
    const { subdomain } = req.params;

    // Import required models and services
    const { default: Site } = await import('../models/Site.js');
    const { default: Portfolio } = await import('../models/Portfolio.js');
    const { default: CaseStudy } = await import('../models/CaseStudy.js');

    // Find the site by subdomain
    const site = await Site.findOne({ subdomain }).populate('portfolioId');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
        subdomain
      });
    }

    // Check ownership
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get the portfolio
    const portfolio = site.portfolioId;
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found for this site'
      });
    }

    // Get case studies
    const caseStudies = await CaseStudy.find({ portfolioId: portfolio._id });

    // Prepare debug information
    const debugInfo = {
      site: {
        subdomain: site.subdomain,
        isActive: site.isActive,
        published: site.published,
        lastDeployedAt: site.lastDeployedAt,
        createdAt: site.createdAt
      },
      portfolio: {
        _id: portfolio._id,
        title: portfolio.title,
        description: portfolio.description,
        hasContent: !!portfolio.content,
        contentKeys: portfolio.content ? Object.keys(portfolio.content) : [],
        contentStructure: portfolio.content ? {
          hasHero: !!portfolio.content.hero,
          hasAbout: !!portfolio.content.about,
          hasWork: !!portfolio.content.work,
          projectCount: portfolio.content.work?.projects?.length || 0,
          hasGallery: !!portfolio.content.gallery,
          hasContact: !!portfolio.content.contact
        } : null,
        hasSections: !!portfolio.sections,
        sectionCount: portfolio.sections?.length || 0,
        availableFields: Object.keys(portfolio.toObject()),
        isPublished: portfolio.isPublished,
        publishedAt: portfolio.publishedAt,
        updatedAt: portfolio.updatedAt
      },
      caseStudies: {
        count: caseStudies.length,
        projectIds: caseStudies.map(cs => cs.projectId)
      },
      dataValidation: {
        hasValidStructure: !!(portfolio.content || portfolio.sections),
        recommendation: ''
      }
    };

    // Add recommendations
    if (!portfolio.content && !portfolio.sections) {
      debugInfo.dataValidation.recommendation = 'Portfolio needs content structure. Re-save the portfolio with all required fields.';
    } else if (portfolio.content && (!portfolio.content.work || !portfolio.content.work.projects)) {
      debugInfo.dataValidation.recommendation = 'Portfolio content exists but missing work/projects. Add projects to the portfolio.';
    } else if (portfolio.updatedAt > site.lastDeployedAt) {
      debugInfo.dataValidation.recommendation = 'Portfolio was updated after last deployment. Re-publish to update the site.';
    } else {
      debugInfo.dataValidation.recommendation = 'Structure looks valid. If still seeing template data, try re-publishing.';
    }

    // If verbose mode requested, include full portfolio data
    if (req.query.verbose === 'true') {
      debugInfo.fullPortfolioData = portfolio.toObject();
    }

    res.json({
      success: true,
      message: 'Debug information retrieved',
      data: debugInfo
    });

  } catch (error) {
    logger.error('Error in portfolio debug endpoint', { error: error.message });
    next(error);
  }
});

// GET /api/sites/:subdomain/raw-html - Get raw HTML content for frontend to serve
router.get('/:subdomain/raw-html', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const path = (await import('path')).default;
    const fs = (await import('fs')).default;
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Check if site is active in database
    const Site = (await import('../models/Site.js')).default;
    const site = await Site.findBySubdomain(subdomain, false);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Read the HTML file
    const htmlPath = path.join(__dirname, '../../generated-files', subdomain, 'index.html');

    if (!fs.existsSync(htmlPath)) {
      return res.status(404).json({
        success: false,
        message: 'HTML file not found'
      });
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    res.json({
      success: true,
      html: htmlContent,
      subdomain: subdomain
    });

  } catch (error) {
    logger.error('Error fetching raw HTML', { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({
      success: false,
      message: 'Error fetching HTML content'
    });
  }
});

// GET /api/sites/:subdomain/case-study/:projectId/raw-html - Get case study raw HTML
router.get('/:subdomain/case-study/:projectId/raw-html', async (req, res) => {
  try {
    const { subdomain, projectId } = req.params;
    const path = (await import('path')).default;
    const fs = (await import('fs')).default;
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Check if site is active in database
    const Site = (await import('../models/Site.js')).default;
    const site = await Site.findBySubdomain(subdomain, false);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Read the case study HTML file
    const htmlPath = path.join(__dirname, '../../generated-files', subdomain, `case-study-${projectId}.html`);

    if (!fs.existsSync(htmlPath)) {
      return res.status(404).json({
        success: false,
        message: 'Case study HTML file not found'
      });
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    res.json({
      success: true,
      html: htmlContent,
      subdomain: subdomain,
      projectId: projectId
    });

  } catch (error) {
    logger.error('Error fetching case study HTML', { error: error.message, subdomain: req.params.subdomain, projectId: req.params.projectId });
    res.status(500).json({
      success: false,
      message: 'Error fetching case study HTML content'
    });
  }
});

// GET /api/sites/:subdomain - Get portfolio data as JSON for frontend
// Note: Raw HTML is served via /api/sites/:subdomain/raw-html
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Check if site is active in database
    const Site = (await import('../models/Site.js')).default;
    const Portfolio = (await import('../models/Portfolio.js')).default;
    const CaseStudy = (await import('../models/CaseStudy.js')).default;

    const site = await Site.findBySubdomain(subdomain, false); // false = only active sites

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Fetch the portfolio data
    const portfolio = await Portfolio.findById(site.portfolioId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Fetch case studies
    const caseStudies = await CaseStudy.find({ portfolioId: portfolio._id });

    // Return portfolio data with case studies
    res.json({
      success: true,
      data: {
        ...portfolio.toObject(),
        caseStudies: caseStudies.map(cs => cs.toObject()),
        site: {
          subdomain: site.subdomain,
          url: site.url,
          published: site.published,
          lastDeployedAt: site.lastDeployedAt
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching site data', { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({
      success: false,
      message: 'Error fetching site data'
    });
  }
});

export default router;