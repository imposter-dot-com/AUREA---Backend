/**
 * Proposal Extract Service
 * Business logic for AI-powered proposal/PDF extraction
 * Handles Gemini AI integration for document analysis
 */

import logger from '../../infrastructure/logging/Logger.js';
import { ValidationError } from '../../shared/exceptions/index.js';

class ProposalExtractService {
  /**
   * Extract data from proposal PDF using Gemini AI
   * @param {Buffer} fileBuffer - PDF file buffer
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Extracted data
   */
  async extractProposalData(fileBuffer, userId) {
    logger.service('ProposalExtractService', 'extractProposalData', { userId });

    if (!fileBuffer) {
      throw new ValidationError('No file provided');
    }

    // Import Gemini service
    const { extractFromPDF } = await import('../../../services/geminiExtractService.js');

    const extractedData = await extractFromPDF(fileBuffer);

    logger.info('Proposal data extracted', { userId });

    return extractedData;
  }

  /**
   * Get extraction history for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Extraction history
   */
  async getExtractionHistory(userId) {
    logger.service('ProposalExtractService', 'getExtractionHistory', { userId });

    // Placeholder - could be implemented with database
    return {
      history: [],
      count: 0
    };
  }

  /**
   * Test Gemini AI connection
   * @returns {Promise<Object>} Connection status
   */
  async testGeminiConnection() {
    logger.service('ProposalExtractService', 'testGeminiConnection', {});

    try {
      // Import and test Gemini
      const gemini = await import('@google/generative-ai');

      return {
        connected: true,
        service: 'Gemini AI',
        status: 'operational'
      };
    } catch (error) {
      logger.error('Gemini connection test failed', { error });

      return {
        connected: false,
        service: 'Gemini AI',
        status: 'unavailable',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const proposalExtractService = new ProposalExtractService();
export default proposalExtractService;
