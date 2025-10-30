import pdfExportService from '../core/services/PDFExportService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * PDF Export Controller - Thin HTTP layer
 * Handles HTTP requests/responses for PDF generation
 * All business logic delegated to PDFExportService
 */

/**
 * @desc    Export portfolio as PDF (view inline)
 * @route   GET /api/pdf/portfolio/:id
 * @access  Public
 */
export const exportPortfolioPDF = async (req, res, next) => {
  try {
    const pdfResult = await pdfExportService.exportPortfolioPDF(req.params.portfolioId, {
      templateId: req.query.templateId,
      inline: true
    });

    // pdfResult is an object with { buffer, filename, contentType }
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfResult.filename || 'portfolio.pdf'}"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export complete portfolio with case studies
 * @route   GET /api/pdf/portfolio/:id/complete
 * @access  Public
 */
export const exportCompletePDF = async (req, res, next) => {
  try {
    const pdfResult = await pdfExportService.exportCompletePDF(req.params.portfolioId, {
      templateId: req.query.templateId,
      includeCaseStudies: true
    });

    // pdfResult is an object with { buffer, filename, contentType }
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfResult.filename || 'portfolio-complete.pdf'}"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download portfolio PDF
 * @route   GET /api/pdf/portfolio/:id/download
 * @access  Public
 */
export const downloadPortfolioPDF = async (req, res, next) => {
  try {
    const pdfResult = await pdfExportService.exportPortfolioPDF(req.params.portfolioId, {
      templateId: req.query.templateId,
      download: true
    });

    // pdfResult is an object with { buffer, filename, contentType }
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename || 'portfolio.pdf'}"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get PDF generation info
 * @route   GET /api/pdf/portfolio/:id/info
 * @access  Public
 */
export const getPDFInfo = async (req, res, next) => {
  try {
    const info = await pdfExportService.getPDFInfo(req.params.portfolioId);

    return responseFormatter.success(
      res,
      info,
      'PDF info retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cleanup old PDF files
 * @route   POST /api/pdf/cleanup
 * @access  Private (Admin)
 */
export const cleanupPDFs = async (req, res, next) => {
  try {
    const result = await pdfExportService.cleanupPDFs();

    return responseFormatter.success(
      res,
      result,
      'PDF cleanup completed'
    );
  } catch (error) {
    next(error);
  }
};
