/**
 * PDF Export Service
 * Business logic for PDF generation and export
 * Wraps pdfGenerationService for portfolio PDFs
 */

import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError } from '../../shared/exceptions/index.js';

class PDFExportService {
  /**
   * Export portfolio as PDF
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Export options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async exportPortfolioPDF(portfolioId, options = {}) {
    logger.service('PDFExportService', 'exportPortfolioPDF', { portfolioId });

    // Import PDF generation service
    const { generatePortfolioPDF } = await import('../../../services/pdfGenerationService.js');

    // generatePortfolioPDF expects (portfolioId, userId, pageType, options, templateId)
    // For public access, userId can be null - the function will fetch portfolio without user validation
    const pdfBuffer = await generatePortfolioPDF(
      portfolioId,
      null, // userId - null for public access
      'portfolio', // pageType
      options,
      options.templateId
    );

    if (!pdfBuffer) {
      throw new NotFoundError('Failed to generate PDF');
    }

    return pdfBuffer;
  }

  /**
   * Export complete portfolio with case studies
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Export options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async exportCompletePDF(portfolioId, options = {}) {
    logger.service('PDFExportService', 'exportCompletePDF', { portfolioId });

    const { generateCombinedPDF } = await import('../../../services/pdfGenerationService.js');

    // generateCombinedPDF expects (portfolioId, userId, options, templateId)
    // For public access, userId can be null - the function will fetch portfolio without user validation
    const pdfBuffer = await generateCombinedPDF(
      portfolioId,
      null, // userId - null for public access
      options,
      options.templateId
    );

    if (!pdfBuffer) {
      throw new NotFoundError('Failed to generate complete PDF');
    }

    return pdfBuffer;
  }

  /**
   * Get PDF generation info
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object>} PDF info
   */
  async getPDFInfo(portfolioId) {
    logger.service('PDFExportService', 'getPDFInfo', { portfolioId });

    return {
      portfolioId,
      available: true,
      formats: ['pdf'],
      maxSize: '10MB'
    };
  }

  /**
   * Cleanup old PDF files
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupPDFs() {
    logger.service('PDFExportService', 'cleanupPDFs', {});

    // Placeholder for cleanup logic
    return {
      cleaned: 0,
      message: 'PDF cleanup completed'
    };
  }
}

// Export singleton instance
const pdfExportService = new PDFExportService();
export default pdfExportService;
