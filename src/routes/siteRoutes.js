import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';
import {
  debugGenerate,
  publishSite,
  getSiteStatus,
  getSiteConfig,
  updateSiteConfig,
  recordSiteView
} from '../controllers/siteController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @route   GET /api/sites/:subdomain
// @desc    Serve published portfolio site
// @access  Public
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

// @route   POST /api/sites/debug-generate
// @desc    Generate HTML/CSS files for debugging
// @access  Private
router.post('/debug-generate', auth, debugGenerate);

// @route   POST /api/sites/publish
// @desc    Publish portfolio to hosting platform
// @access  Private
router.post('/publish', auth, publishSite);

// @route   GET /api/sites/status
// @desc    Get site deployment status
// @access  Public
router.get('/status', getSiteStatus);

// @route   GET /api/sites/config
// @desc    Get site configuration
// @access  Public
router.get('/config', getSiteConfig);

// @route   PUT /api/sites/config
// @desc    Update site configuration
// @access  Private
router.put('/config', auth, updateSiteConfig);

// @route   POST /api/sites/analytics/view
// @desc    Record site view for analytics
// @access  Public
router.post('/analytics/view', recordSiteView);

export default router;