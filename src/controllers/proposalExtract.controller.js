import proposalExtractService from '../core/services/ProposalExtractService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
import multer from 'multer';

/**
 * Proposal Extract Controller - Thin HTTP layer
 * Handles HTTP requests/responses for AI-powered proposal extraction
 * All business logic delegated to ProposalExtractService
 */

// Multer configuration for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * @desc    Extract data from proposal PDF using Gemini AI
 * @route   POST /api/proposals/extract
 * @access  Private
 */
export const extractProposalData = async (req, res, next) => {
  try {
    if (!req.file) {
      return responseFormatter.validationError(res, 'PDF file is required');
    }

    const extractedData = await proposalExtractService.extractProposalData(
      req.file.buffer,
      req.user._id
    );

    return responseFormatter.success(
      res,
      extractedData,
      'Proposal data extracted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get extraction history for current user
 * @route   GET /api/proposals/history
 * @access  Private
 */
export const getExtractionHistory = async (req, res, next) => {
  try {
    const history = await proposalExtractService.getExtractionHistory(req.user._id);

    return responseFormatter.success(
      res,
      history,
      'Extraction history retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test Gemini AI connection
 * @route   GET /api/proposals/test-connection
 * @access  Private
 */
export const testGeminiConnection = async (req, res, next) => {
  try {
    const status = await proposalExtractService.testGeminiConnection();

    return responseFormatter.success(
      res,
      status,
      'Connection test completed'
    );
  } catch (error) {
    next(error);
  }
};
