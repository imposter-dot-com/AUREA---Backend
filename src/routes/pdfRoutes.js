/**
 * PDF Export Routes
 *
 * Handles PDF generation endpoints for portfolios
 */

import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import {
  exportPortfolioPDF,
  exportCompletePDF,
  downloadPortfolioPDF,
  getPDFInfo,
  cleanupPDFs
} from '../controllers/pdfExportController.js';

const router = express.Router();

/**
 * @route   GET /api/pdf/portfolio/:portfolioId
 * @desc    Export portfolio as PDF (view inline)
 * @access  Private (owner) / Public (if portfolio is published)
 * @query   pageType - 'portfolio' (main page only) or 'all' or 'case-study-{id}'
 * @query   save - 'true' to save to filesystem (owner only)
 * @query   format - PDF page format (A4, A3, Letter, Legal)
 * @query   landscape - 'true' for landscape orientation
 */
router.get('/portfolio/:portfolioId', optionalAuth, exportPortfolioPDF);

/**
 * @route   GET /api/pdf/portfolio/:portfolioId/complete
 * @desc    Export complete portfolio with all case studies as single PDF
 * @access  Private (owner) / Public (if portfolio is published)
 * @query   save - 'true' to save to filesystem (owner only)
 * @query   format - PDF page format (A4, A3, Letter, Legal)
 * @query   landscape - 'true' for landscape orientation
 */
router.get('/portfolio/:portfolioId/complete', optionalAuth, exportCompletePDF);

/**
 * @route   GET /api/pdf/portfolio/:portfolioId/download
 * @desc    Download portfolio PDF (forces download dialog)
 * @access  Private (owner) / Public (if portfolio is published)
 * @query   pageType - 'portfolio' (main page only) or specific case study
 * @query   format - PDF page format (A4, A3, Letter, Legal)
 * @query   landscape - 'true' for landscape orientation
 */
router.get('/portfolio/:portfolioId/download', optionalAuth, downloadPortfolioPDF);

/**
 * @route   GET /api/pdf/portfolio/:portfolioId/info
 * @desc    Get PDF export information and available options
 * @access  Private (owner) / Public (if portfolio is published)
 */
router.get('/portfolio/:portfolioId/info', optionalAuth, getPDFInfo);

/**
 * @route   POST /api/pdf/cleanup
 * @desc    Clean up old generated PDFs (maintenance endpoint)
 * @access  Private (admin only)
 * @body    maxAgeInDays - Maximum age of files to keep (default: 7)
 */
router.post('/cleanup', auth, cleanupPDFs);

export default router;