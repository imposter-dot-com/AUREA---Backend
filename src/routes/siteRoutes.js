import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';
import {
  debugGenerate,
  publishSite,
  subPublish,
  getSiteStatus,
  getSiteConfig,
  updateSiteConfig,
  recordSiteView
} from '../controllers/siteController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/sites/:subdomain - Serve published portfolio site
router.get('/:subdomain', (req, res) => {
  try {
    const { subdomain } = req.params;
    const sitePath = path.join(__dirname, '../../generated-files', subdomain, 'index.html');
    
    if (fs.existsSync(sitePath)) {
      res.sendFile(sitePath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error serving site'
    });
  }
});

// POST /api/sites/debug-generate - Generate HTML/CSS files for debugging
router.post('/debug-generate', auth, debugGenerate);

// POST /api/sites/publish - Publish portfolio to Vercel
router.post('/publish', auth, publishSite);

// POST /api/sites/sub-publish - Publish portfolio to local subdomain (aurea.tool/$user)
router.post('/sub-publish', auth, subPublish);

// GET /api/sites/status - Get site deployment status
router.get('/status', getSiteStatus);

// GET /api/sites/config - Get site configuration
router.get('/config', getSiteConfig);

// PUT /api/sites/config - Update site configuration
router.put('/config', auth, updateSiteConfig);

// POST /api/sites/analytics/view - Record site view for analytics
router.post('/analytics/view', recordSiteView);

export default router;