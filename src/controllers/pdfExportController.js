/**
 * PDF Export Controller
 *
 * Handles PDF generation requests for portfolios and case studies
 */

import {
  generatePortfolioPDF,
  generateCombinedPDF,
  savePDFToFile,
  cleanupOldPDFs
} from '../../services/pdfGenerationService.js';
import Portfolio from '../models/Portfolio.js';
import { optionalAuth } from '../middleware/auth.js';

/**
 * @desc    Export portfolio as PDF
 * @route   GET /api/pdf/portfolio/:portfolioId
 * @access  Private (owner) / Public (if portfolio is published)
 */
export const exportPortfolioPDF = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { pageType = 'portfolio', save = 'false' } = req.query;

    // Validate portfolio ID
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find portfolio
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check access permissions
    const isOwner = req.user && portfolio.userId.toString() === req.user._id.toString();
    const isPublished = portfolio.isPublished;

    if (!isOwner && !isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portfolio is not published.'
      });
    }

    console.log(`📄 Generating PDF for portfolio: ${portfolio.title}`);

    // Generate PDF
    const pdfResult = await generatePortfolioPDF(
      portfolioId,
      portfolio.userId,
      pageType,
      {
        // Custom PDF options can be passed here
        format: req.query.format || 'A4',
        landscape: req.query.landscape === 'true'
      }
    );

    // Save to file system if requested (for debugging or caching)
    if (save === 'true' && isOwner) {
      const filepath = await savePDFToFile(
        pdfResult.buffer,
        pdfResult.filename
      );
      console.log(`PDF saved to: ${filepath}`);
    }

    // Set response headers
    res.set({
      'Content-Type': pdfResult.contentType,
      'Content-Disposition': `inline; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Send PDF buffer
    res.send(pdfResult.buffer);

  } catch (error) {
    console.error('Export portfolio PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Export combined portfolio and case studies as PDF
 * @route   GET /api/pdf/portfolio/:portfolioId/complete
 * @access  Private (owner) / Public (if portfolio is published)
 */
export const exportCompletePDF = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { save = 'false' } = req.query;

    // Validate portfolio ID
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find portfolio
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check access permissions
    const isOwner = req.user && portfolio.userId.toString() === req.user._id.toString();
    const isPublished = portfolio.isPublished;

    if (!isOwner && !isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portfolio is not published.'
      });
    }

    console.log(`📄 Generating complete PDF for portfolio: ${portfolio.title}`);

    // Generate combined PDF
    const pdfResult = await generateCombinedPDF(
      portfolioId,
      portfolio.userId,
      {
        format: req.query.format || 'A4',
        landscape: req.query.landscape === 'true'
      }
    );

    // Save to file system if requested
    if (save === 'true' && isOwner) {
      const filepath = await savePDFToFile(
        pdfResult.buffer,
        pdfResult.filename
      );
      console.log(`Complete PDF saved to: ${filepath}`);
    }

    // Set response headers
    res.set({
      'Content-Type': pdfResult.contentType,
      'Content-Disposition': `inline; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Send PDF buffer
    res.send(pdfResult.buffer);

  } catch (error) {
    console.error('Export complete PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate complete PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Download portfolio PDF (forces download instead of inline view)
 * @route   GET /api/pdf/portfolio/:portfolioId/download
 * @access  Private (owner) / Public (if portfolio is published)
 */
export const downloadPortfolioPDF = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { pageType = 'portfolio' } = req.query;

    // Validate portfolio ID
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find portfolio
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check access permissions
    const isOwner = req.user && portfolio.userId.toString() === req.user._id.toString();
    const isPublished = portfolio.isPublished;

    if (!isOwner && !isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portfolio is not published.'
      });
    }

    console.log(`⬇️ Downloading PDF for portfolio: ${portfolio.title}`);

    // Generate PDF
    const pdfResult = await generatePortfolioPDF(
      portfolioId,
      portfolio.userId,
      pageType,
      {
        format: req.query.format || 'A4',
        landscape: req.query.landscape === 'true'
      }
    );

    // Set response headers for download
    res.set({
      'Content-Type': pdfResult.contentType,
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`, // attachment forces download
      'Content-Length': pdfResult.buffer.length
    });

    // Send PDF buffer
    res.send(pdfResult.buffer);

  } catch (error) {
    console.error('Download portfolio PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get PDF export status/information
 * @route   GET /api/pdf/portfolio/:portfolioId/info
 * @access  Private (owner) / Public (if portfolio is published)
 */
export const getPDFInfo = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    // Validate portfolio ID
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio ID is required'
      });
    }

    // Find portfolio with case studies
    const portfolio = await Portfolio.findById(portfolioId)
      .populate('caseStudies');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check access permissions
    const isOwner = req.user && portfolio.userId.toString() === req.user._id.toString();
    const isPublished = portfolio.isPublished;

    if (!isOwner && !isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portfolio is not published.'
      });
    }

    // Calculate estimated file sizes
    const projectCount = portfolio.content?.work?.projects?.length || 0;
    const caseStudyCount = portfolio.caseStudies?.length || 0;

    // Rough estimates based on typical content
    const estimatedMainSize = 500000 + (projectCount * 50000); // 500KB base + 50KB per project
    const estimatedCaseStudySize = caseStudyCount * 200000; // 200KB per case study
    const estimatedTotalSize = estimatedMainSize + estimatedCaseStudySize;

    // Available export options
    const exportOptions = {
      formats: ['A4', 'A3', 'Letter', 'Legal'],
      orientations: ['portrait', 'landscape'],
      pageTypes: ['portfolio', 'all']
    };

    // Add specific case study page types
    if (caseStudyCount > 0) {
      portfolio.caseStudies.forEach(cs => {
        if (cs.projectId) {
          exportOptions.pageTypes.push(`case-study-${cs.projectId}`);
        }
      });
    }

    res.json({
      success: true,
      message: 'PDF export information retrieved',
      data: {
        portfolio: {
          id: portfolio._id,
          title: portfolio.title,
          isPublished: portfolio.isPublished,
          projectCount,
          caseStudyCount
        },
        exportInfo: {
          estimatedSize: {
            mainPortfolio: `~${Math.round(estimatedMainSize / 1024)}KB`,
            caseStudies: `~${Math.round(estimatedCaseStudySize / 1024)}KB`,
            total: `~${Math.round(estimatedTotalSize / 1024)}KB`
          },
          availableExports: [
            {
              type: 'portfolio',
              description: 'Main portfolio page only',
              endpoint: `/api/pdf/portfolio/${portfolioId}`
            },
            {
              type: 'complete',
              description: 'Portfolio with all case studies',
              endpoint: `/api/pdf/portfolio/${portfolioId}/complete`
            },
            {
              type: 'download',
              description: 'Force download instead of inline view',
              endpoint: `/api/pdf/portfolio/${portfolioId}/download`
            }
          ],
          options: exportOptions
        }
      }
    });

  } catch (error) {
    console.error('Get PDF info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PDF information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Clean up old generated PDFs (maintenance endpoint)
 * @route   POST /api/pdf/cleanup
 * @access  Private (admin only)
 */
export const cleanupPDFs = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { maxAgeInDays = 7 } = req.body;

    console.log(`🧹 Starting PDF cleanup (files older than ${maxAgeInDays} days)`);

    // Run cleanup
    await cleanupOldPDFs(maxAgeInDays);

    res.json({
      success: true,
      message: `PDF cleanup completed. Removed files older than ${maxAgeInDays} days.`
    });

  } catch (error) {
    console.error('PDF cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup PDFs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default {
  exportPortfolioPDF,
  exportCompletePDF,
  downloadPortfolioPDF,
  getPDFInfo,
  cleanupPDFs
};