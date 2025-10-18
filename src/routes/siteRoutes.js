import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';
import { publishLimiter, publicViewLimiter } from '../middleware/rateLimiter.js';
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/sites/:subdomain - Serve published portfolio site
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // First, check if site is active in database
    const Site = (await import('../models/Site.js')).default;
    const site = await Site.findBySubdomain(subdomain, false); // false = only active sites

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Then check if files exist
    const sitePath = path.join(__dirname, '../../generated-files', subdomain, 'index.html');

    if (fs.existsSync(sitePath)) {
      res.sendFile(sitePath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Site files not found'
      });
    }
  } catch (error) {
    console.error('Error serving site:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving site'
    });
  }
});

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
router.get('/config', getSiteConfig);

// PUT /api/sites/config - Update site configuration
router.put('/config', auth, updateSiteConfig);

// POST /api/sites/analytics/view - Record site view for analytics (with rate limiting)
router.post('/analytics/view', publicViewLimiter, recordSiteView);

export default router;