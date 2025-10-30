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
  recordSiteView
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

// ==========================================
// PARAMETERIZED ROUTES
// ==========================================

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