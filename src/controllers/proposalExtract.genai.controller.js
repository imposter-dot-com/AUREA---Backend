import proposalExtractService from '../core/services/ProposalExtractService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * Proposal Extract GenAI Controller - Thin HTTP layer
 * Handles HTTP requests/responses for Gemini AI proposal extraction
 * All business logic delegated to ProposalExtractService
 *
 * Note: This controller uses the same service as proposalExtract.controller.js
 * Kept separate for route organization purposes
 */

/**
 * @desc    Extract data from proposal PDF using Gemini AI (GenAI route)
 * @route   POST /api/genai/proposals/extract
 * @access  Private
 */
export const extractProposalDataGenAI = async (req, res, next) => {
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
      'Proposal data extracted successfully via Gemini AI'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test Gemini AI connection (GenAI route)
 * @route   GET /api/genai/test
 * @access  Private
 */
export const testGenAI = async (req, res, next) => {
  try {
    const status = await proposalExtractService.testGeminiConnection();

    return responseFormatter.success(
      res,
      status,
      'Gemini AI connection test completed'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get GenAI extraction history
 * @route   GET /api/genai/history
 * @access  Private
 */
export const getGenAIHistory = async (req, res, next) => {
  try {
    const history = await proposalExtractService.getExtractionHistory(req.user._id);

    return responseFormatter.success(
      res,
      history,
      'GenAI extraction history retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
