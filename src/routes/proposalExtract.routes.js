import { Router } from 'express';
// Using GenAI implementation as primary controller
import { 
  extractProposalData,
  getExtractionHistory,
  testGeminiConnection,
  upload 
} from '../controllers/proposalExtract.genai.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
// router.use(auth);

// POST /api/proposals/extract - Upload and extract PDF (Google GenAI - Two Step Method)
router.post('/extract', upload.single('pdf'), extractProposalData);

// GET /api/proposals/history - Get extraction history
router.get('/history', getExtractionHistory);

// GET /api/proposals/test-gemini - Test GenAI API connection
router.get('/test-gemini', testGeminiConnection);

export default router;