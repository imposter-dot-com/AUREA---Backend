/**
 * PDF Controller
 * 
 * Handles HTTP requests for PDF generation from portfolio sites
 */

import {
  generatePortfolioPDF,
  generatePDFFromHTML,
  batchGeneratePDFs,
  validatePDFGeneration,
  getPDFStatus,
} from '../services/pdfService.js';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Generate PDF for a single portfolio
 * POST /api/pdf/generate/:subdomain
 */
export const generatePDF = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const options = {
      debug: req.body.debug !== false,
      format: req.body.format || 'A4',
      landscape: req.body.landscape || false,
      margin: req.body.margin || {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    };

    console.log(`📥 PDF generation request for: ${subdomain}`);

    // Validate prerequisites
    const validation = await validatePDFGeneration(subdomain);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        issues: validation.issues,
      });
    }

    // Generate PDF
    const result = await generatePortfolioPDF(subdomain, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        filename: result.pdfFilename,
        size: result.size,
        duration: result.duration,
        method: result.method,
        path: result.pdfPath,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Download generated PDF
 * GET /api/pdf/download/:subdomain
 */
export const downloadPDF = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { version } = req.query; // Optional: specify version/filename

    console.log(`📥 PDF download request for: ${subdomain}`);

    // Get PDF status
    const status = await getPDFStatus(subdomain);

    if (!status.exists) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found',
        message: 'Please generate the PDF first',
      });
    }

    // Determine which file to serve
    let pdfPath = status.path;
    let filename = status.filename;

    if (version && status.allVersions?.includes(version)) {
      const pdfDir = path.join(process.cwd(), 'generated-files', 'pdfs');
      pdfPath = path.join(pdfDir, version);
      filename = version;
    }

    if (!existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found on disk',
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('❌ PDF download error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get PDF status and metadata
 * GET /api/pdf/status/:subdomain
 */
export const getStatus = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const status = await getPDFStatus(subdomain);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('❌ Get PDF status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Batch generate PDFs for multiple portfolios
 * POST /api/pdf/batch-generate
 */
export const batchGenerate = async (req, res) => {
  try {
    const { subdomains, concurrency = 2 } = req.body;

    if (!Array.isArray(subdomains) || subdomains.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'subdomains array is required',
      });
    }

    console.log(`📥 Batch PDF generation request for ${subdomains.length} portfolios`);

    // Validate all subdomains first
    const validations = await Promise.all(
      subdomains.map(async (subdomain) => ({
        subdomain,
        ...(await validatePDFGeneration(subdomain)),
      }))
    );

    const invalid = validations.filter(v => !v.isValid);
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed for some portfolios',
        invalid,
      });
    }

    // Generate PDFs
    const results = await batchGeneratePDFs(subdomains, { concurrency });

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      message: `Generated ${successful.length}/${results.length} PDFs`,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results,
      },
    });
  } catch (error) {
    console.error('❌ Batch PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Regenerate PDF for a portfolio
 * PUT /api/pdf/regenerate/:subdomain
 */
export const regeneratePDF = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const options = {
      debug: true,
      ...req.body,
    };

    console.log(`🔄 PDF regeneration request for: ${subdomain}`);

    // Check existing PDF
    const existingStatus = await getPDFStatus(subdomain);

    // Validate and generate
    const validation = await validatePDFGeneration(subdomain);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        issues: validation.issues,
      });
    }

    const result = await generatePortfolioPDF(subdomain, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'PDF regenerated successfully',
      data: {
        filename: result.pdfFilename,
        size: result.size,
        duration: result.duration,
        method: result.method,
        previousVersion: existingStatus.exists ? existingStatus.filename : null,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    console.error('❌ PDF regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Generate PDF from raw HTML
 * POST /api/pdf/generate-from-html
 * 
 * Request body:
 * {
 *   "html": "<h1>Hello PDF!</h1><p>This is generated from Express.</p>",
 *   "filename": "output.pdf",  // optional
 *   "format": "A4",            // optional
 *   "landscape": false,        // optional
 *   "printBackground": true    // optional
 * }
 */
export const generateFromHTML = async (req, res) => {
  try {
    const { html, filename, format, landscape, printBackground } = req.body;

    // Validate HTML input
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'HTML content is required',
      });
    }

    console.log(`📥 PDF generation request from raw HTML (${html.length} chars)`);

    // Prepare options
    const options = {
      format: format || 'A4',
      landscape: landscape || false,
      printBackground: printBackground !== false, // Default to true
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
      preferCSSPageSize: false,
    };

    // Generate PDF
    const result = await generatePDFFromHTML(html, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'PDF generation failed',
        details: result.details,
      });
    }

    // Set response headers for PDF download
    const pdfFilename = filename || 'output.pdf';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename}"`,
      'Content-Length': result.buffer.length,
    });

    // Send PDF buffer
    res.send(result.buffer);

    console.log(`✅ PDF sent successfully (${(result.size / 1024).toFixed(2)} KB)`);

  } catch (error) {
    console.error('❌ Error generating PDF from HTML:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating PDF',
      message: error.message,
    });
  }
};

export default {
  generatePDF,
  generateFromHTML,
  downloadPDF,
  getStatus,
  batchGenerate,
  regeneratePDF,
};
