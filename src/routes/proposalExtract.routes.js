import { Router } from 'express';
// Using main controller with refactored service layer
import {
  extractProposalData,
  getExtractionHistory,
  testGeminiConnection,
  upload
} from '../controllers/proposalExtract.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// POST /api/proposals/extract - Upload and extract PDF (Google GenAI)
router.post('/extract', auth, upload.single('pdf'), extractProposalData);

// GET /api/proposals/history - Get extraction history
router.get('/history', auth, getExtractionHistory);

// GET /api/proposals/test-gemini - Test GenAI API connection (no auth required)
router.get('/test-gemini', testGeminiConnection);

export default router;