/**
 * PDF Generation Service using Puppeteer
 *
 * This service generates PDF files from portfolio HTML templates
 * using Puppeteer to ensure the exported PDF looks identical to the HTML design
 *
 * OPTIMIZED: Now uses browser pool, caching, and clean architecture patterns
 */

import { generateAllPortfolioFiles } from './templateConvert.js';
import { getTemplateHTML, getCaseStudyHTML } from '../src/services/templateEngine.js';
import browserPool from '../src/infrastructure/pdf/BrowserPool.js';
import pdfCache from '../src/infrastructure/cache/PDFCache.js';
import pdfRepository from '../src/core/repositories/PDFRepository.js';
import logger from '../src/infrastructure/logging/Logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;

const PDF_CONFIG = {
  fastMode: process.env.PDF_FAST_MODE === 'true' || isRailway, // Default fast mode on Railway
  maxTimeout: parseInt(process.env.PDF_MAX_TIMEOUT || (isProduction ? '30000' : '10000'), 10), // 30s in prod, 10s in dev
  skipImages: process.env.PDF_SKIP_IMAGE_WAIT === 'true' || isRailway, // Skip image wait on Railway
  enableCache: process.env.PDF_CACHE_ENABLED !== 'false',
  // Production-specific optimizations
  reduceMemory: isRailway || process.env.PDF_REDUCE_MEMORY === 'true'
};

// PDF generation options for optimal quality
const DEFAULT_PDF_OPTIONS = {
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: false,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0'
  },
  preferCSSPageSize: true,
  // High quality settings
  scale: 1,
  pageRanges: '', // All pages
  // Additional options for better quality
  omitBackground: false,
  landscape: false
};

// Viewport settings for consistent rendering
const DEFAULT_VIEWPORT = {
  width: 1200,
  height: 1600,
  deviceScaleFactor: PDF_CONFIG.reduceMemory ? 1 : 2 // Lower quality in memory-constrained environments
};

/**
 * Prepare portfolio data with case studies
 * Now uses repository pattern for data access
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID for ownership validation
 * @returns {Promise<Object>} Complete portfolio data with case studies
 */
const preparePortfolioData = async (portfolioId, userId = null) => {
  try {
    // Use repository for optimized data access
    const portfolioData = await pdfRepository.getPortfolioForPDF(portfolioId, userId);

    if (!portfolioData) {
      throw new Error('Portfolio not found or access denied');
    }

    return portfolioData;
  } catch (error) {
    logger.error('Error preparing portfolio data', {
      portfolioId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Generate PDF from portfolio HTML
 * OPTIMIZED: Now uses browser pool and fast mode options
 * @param {String} htmlContent - HTML content to convert
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDFFromHTML = async (htmlContent, options = {}) => {
  let browser = null;
  let page = null;

  try {
    // Get browser from pool instead of creating new one
    browser = await browserPool.acquire();
    page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport(DEFAULT_VIEWPORT);

    // Enable JavaScript execution
    await page.setJavaScriptEnabled(true);

    // Set content with optimized waitUntil options
    const waitOptions = PDF_CONFIG.fastMode
      ? ['domcontentloaded'] // Fast mode: just wait for DOM
      : ['domcontentloaded', 'load']; // Normal: wait for more

    await page.setContent(htmlContent, {
      waitUntil: waitOptions,
      timeout: PDF_CONFIG.maxTimeout
    });

    // Wait for fonts (with timeout in fast mode)
    if (!PDF_CONFIG.fastMode) {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise(resolve => setTimeout(resolve, 500)) // Max 500ms wait
      ]);
    }

    // Wait for images (skip in fast mode)
    if (!PDF_CONFIG.fastMode && !PDF_CONFIG.skipImages) {
      await page.evaluate(() => {
        return Promise.race([
          Promise.all(
            Array.from(document.images)
              .filter(img => !img.complete)
              .map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
              }))
          ),
          new Promise(resolve => setTimeout(resolve, 2000)) // Max 2s wait
        ]);
      });
    }

    // Add print media styles for better PDF rendering
    await page.addStyleTag({
      content: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Prevent page breaks inside elements */
          .section, .project-card, .case-study-section {
            page-break-inside: avoid;
          }

          /* Ensure images print properly */
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }

          /* Preserve backgrounds */
          body, div, section {
            -webkit-print-color-adjust: exact !important;
          }
        }
      `
    });

    // Skip scrolling in fast mode
    if (!PDF_CONFIG.fastMode) {
      // Quick scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
      });

      // Small wait for any animations
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Generate PDF with merged options
    const pdfOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...options
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    logger.info('PDF generated successfully', {
      sizeKB: Math.round(pdfBuffer.length / 1024),
      fastMode: PDF_CONFIG.fastMode
    });

    return pdfBuffer;

  } catch (error) {
    logger.error('Error generating PDF', {
      error: error.message,
      stack: error.stack,
      config: PDF_CONFIG,
      isProduction,
      isRailway
    });

    // Provide more helpful error messages for common issues
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      throw new Error(`PDF generation timeout (${PDF_CONFIG.maxTimeout}ms). Try increasing PDF_MAX_TIMEOUT environment variable.`);
    } else if (error.message.includes('memory') || error.message.includes('ENOMEM')) {
      throw new Error('PDF generation failed due to memory constraints. Try setting PDF_REDUCE_MEMORY=true and PDF_BROWSER_POOL_SIZE=1.');
    }

    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Clean up page
    if (page) {
      await page.close().catch(err =>
        logger.warn('Error closing page', { error: err.message })
      );
    }

    // Release browser back to pool (NOT close it)
    if (browser) {
      await browserPool.release(browser);
    }
  }
};

/**
 * Generate PDF for a specific portfolio page
 * OPTIMIZED: Now includes caching and performance improvements
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID
 * @param {String} pageType - Type of page ('portfolio' or specific case study ID)
 * @param {Object} options - PDF generation options
 * @param {String} templateId - Optional template ID to override portfolio default
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePortfolioPDF = async (portfolioId, userId, pageType = 'portfolio', options = {}, templateId = null) => {
  const startTime = Date.now();

  try {
    logger.info('Starting PDF generation', {
      portfolioId,
      pageType,
      templateId: templateId || 'default',
      fastMode: PDF_CONFIG.fastMode
    });

    // Prepare portfolio data
    const portfolioData = await preparePortfolioData(portfolioId, userId);

    // Generate content hash for cache key
    const contentHash = pdfCache.generateContentHash(portfolioData);

    // Check cache first
    const cacheKey = pdfCache.generateKey(portfolioId, templateId || portfolioData.templateId, {
      pageType,
      ...options,
      contentHash
    });

    if (PDF_CONFIG.enableCache) {
      const cachedPDF = await pdfCache.get(cacheKey);
      if (cachedPDF) {
        logger.info('PDF served from cache', {
          portfolioId,
          timeSaved: Date.now() - startTime
        });

        const filename = pageType === 'portfolio'
          ? `${portfolioData.title || 'portfolio'}.pdf`
          : `${pageType}.pdf`;

        return {
          buffer: cachedPDF,
          filename: filename.replace(/[^a-z0-9.-]/gi, '_'),
          contentType: 'application/pdf',
          cached: true
        };
      }
    }

    let htmlContent;
    let filename;

    if (pageType === 'portfolio' || pageType === 'all') {
      // Main portfolio page - USE TEMPLATE ENGINE for template-specific HTML
      logger.debug('Generating template-specific portfolio HTML');

      try {
        // Try to use template engine (fetches from frontend)
        htmlContent = await getTemplateHTML(portfolioData, templateId, { forPDF: true });
        logger.debug('Template HTML generated successfully');
      } catch (templateError) {
        logger.warn('Template engine failed, using fallback', { error: templateError.message });
        // Fallback to traditional method
        const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });
        htmlContent = allFiles['index.html'];
      }

      filename = `${portfolioData.title || 'portfolio'}.pdf`;

    } else if (pageType.startsWith('case-study-')) {
      // Case study page - USE UNIFORM DESIGN (templateConvert.js)
      logger.debug('Generating case study HTML');

      const projectId = pageType.replace('case-study-', '');

      try {
        // Use templateEngine's case study method (uses templateConvert.js internally)
        htmlContent = getCaseStudyHTML(portfolioData, projectId, { forPDF: true });
        logger.debug('Case study HTML generated successfully');
      } catch (caseStudyError) {
        logger.warn('Case study generation failed', { error: caseStudyError.message });
        // Fallback to direct templateConvert call
        const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });
        const caseStudyFile = `${pageType}.html`;
        htmlContent = allFiles[caseStudyFile];

        if (!htmlContent) {
          throw new Error(`Case study ${pageType} not found`);
        }
      }

      filename = `${pageType}.pdf`;

    } else {
      throw new Error('Invalid page type specified');
    }

    // Generate PDF from HTML
    const pdfBuffer = await generatePDFFromHTML(htmlContent, options);

    // Cache the generated PDF
    if (PDF_CONFIG.enableCache && pdfBuffer) {
      await pdfCache.set(cacheKey, pdfBuffer, {
        portfolioId,
        templateId: templateId || portfolioData.templateId,
        filename,
        pageType
      });
    }

    // Update repository stats (non-blocking)
    pdfRepository.updatePDFGenerationTime(portfolioId).catch(err =>
      logger.warn('Failed to update PDF stats', { error: err.message })
    );

    const generationTime = Date.now() - startTime;
    logger.info('PDF generation completed', {
      portfolioId,
      pageType,
      generationTimeMs: generationTime,
      sizeKB: Math.round(pdfBuffer.length / 1024)
    });

    return {
      buffer: pdfBuffer,
      filename: filename.replace(/[^a-z0-9.-]/gi, '_'), // Sanitize filename
      contentType: 'application/pdf',
      generationTime
    };

  } catch (error) {
    logger.error('Error in generatePortfolioPDF', {
      portfolioId,
      pageType,
      error: error.message
    });
    throw error;
  }
};

/**
 * Generate combined PDF with portfolio and all case studies
 * OPTIMIZED: Now uses caching and browser pool
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID
 * @param {Object} options - PDF generation options
 * @param {String} templateId - Optional template ID to override portfolio default
 * @returns {Promise<Buffer>} Combined PDF buffer
 */
export const generateCombinedPDF = async (portfolioId, userId, options = {}, templateId = null) => {
  const startTime = Date.now();

  try {
    logger.info('Starting combined PDF generation', {
      portfolioId,
      templateId: templateId || 'default',
      fastMode: PDF_CONFIG.fastMode
    });

    // Prepare portfolio data
    const portfolioData = await preparePortfolioData(portfolioId, userId);

    // Check cache first for combined PDF
    const contentHash = pdfCache.generateContentHash(portfolioData);
    const cacheKey = pdfCache.generateKey(portfolioId, templateId || portfolioData.templateId, {
      pageType: 'combined',
      includeCaseStudies: true,
      ...options,
      contentHash
    });

    if (PDF_CONFIG.enableCache) {
      const cachedPDF = await pdfCache.get(cacheKey);
      if (cachedPDF) {
        logger.info('Combined PDF served from cache', {
          portfolioId,
          timeSaved: Date.now() - startTime
        });

        const filename = `${portfolioData.title || 'portfolio'}_complete.pdf`;
        return {
          buffer: cachedPDF,
          filename: filename.replace(/[^a-z0-9.-]/gi, '_'),
          contentType: 'application/pdf',
          cached: true
        };
      }
    }

    const htmlParts = [];

    // Add main portfolio page - USE TEMPLATE ENGINE for template-specific HTML
    logger.debug('Generating template-specific portfolio HTML');
    try {
      const portfolioHTML = await getTemplateHTML(portfolioData, templateId, { forPDF: true });
      htmlParts.push(portfolioHTML);
      logger.debug('Portfolio HTML generated with template engine');
    } catch (templateError) {
      logger.warn('Template engine failed, using fallback', { error: templateError.message });
      // Fallback to traditional method
      const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });
      if (allFiles['index.html']) {
        htmlParts.push(allFiles['index.html']);
      }
    }

    // Add all case study pages - USE UNIFORM DESIGN (templateConvert.js)
    logger.debug('Generating case study pages');

    // Generate all case study HTML files
    const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });

    Object.keys(allFiles).forEach(filename => {
      if (filename.startsWith('case-study-') && filename.endsWith('.html')) {
        // Add page break before each case study
        const caseStudyHTML = allFiles[filename];
        if (caseStudyHTML) {
          // Insert a page break div before the case study content
          const pageBreakHTML = '<div style="page-break-before: always;"></div>';
          htmlParts.push(pageBreakHTML + caseStudyHTML);
        }
      }
    });

    // Combine all HTML parts
    let combinedHTML = '';
    if (htmlParts.length > 0) {
      // Use the first HTML as base and inject other content
      combinedHTML = htmlParts[0];

      if (htmlParts.length > 1) {
        // Find the closing body tag and inject other content before it
        const bodyCloseIndex = combinedHTML.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
          const beforeBody = combinedHTML.substring(0, bodyCloseIndex);
          const afterBody = combinedHTML.substring(bodyCloseIndex);

          // Extract body content from other HTML parts (remove html, head, body tags)
          const additionalContent = htmlParts.slice(1).map(html => {
            // Extract content between <body> and </body>
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            return bodyMatch ? bodyMatch[1] : '';
          }).join('\n');

          combinedHTML = beforeBody + additionalContent + afterBody;
        }
      }
    } else {
      throw new Error('No content to generate PDF');
    }

    // Generate PDF from combined HTML
    const pdfBuffer = await generatePDFFromHTML(combinedHTML, {
      ...options,
      pageRanges: '' // Ensure all pages are included
    });

    // Cache the combined PDF
    if (PDF_CONFIG.enableCache && pdfBuffer) {
      await pdfCache.set(cacheKey, pdfBuffer, {
        portfolioId,
        templateId: templateId || portfolioData.templateId,
        filename: `${portfolioData.title || 'portfolio'}_complete.pdf`,
        pageType: 'combined'
      });
    }

    // Update repository stats (non-blocking)
    pdfRepository.updatePDFGenerationTime(portfolioId).catch(err =>
      logger.warn('Failed to update PDF stats', { error: err.message })
    );

    const filename = `${portfolioData.title || 'portfolio'}_complete.pdf`;
    const generationTime = Date.now() - startTime;

    logger.info('Combined PDF generation completed', {
      portfolioId,
      generationTimeMs: generationTime,
      sizeKB: Math.round(pdfBuffer.length / 1024),
      caseStudiesCount: Object.keys(portfolioData.caseStudies || {}).length
    });

    return {
      buffer: pdfBuffer,
      filename: filename.replace(/[^a-z0-9.-]/gi, '_'),
      contentType: 'application/pdf',
      generationTime
    };

  } catch (error) {
    logger.error('Error in generateCombinedPDF', {
      portfolioId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Save PDF to file system (for debugging or caching)
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {String} filename - Filename to save as
 * @param {String} directory - Directory path (optional)
 * @returns {Promise<String>} File path
 */
export const savePDFToFile = async (pdfBuffer, filename, directory = null) => {
  try {
    const baseDir = directory || path.join(process.cwd(), 'generated-pdfs');

    // Create directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const filepath = path.join(baseDir, filename);

    // Write PDF to file
    await fs.promises.writeFile(filepath, pdfBuffer);

    console.log(`✅ PDF saved to: ${filepath}`);
    return filepath;

  } catch (error) {
    console.error('Error saving PDF to file:', error);
    throw error;
  }
};

/**
 * Clean up old PDF files (optional maintenance task)
 * @param {Number} maxAgeInDays - Maximum age of files to keep
 * @param {String} directory - Directory to clean
 */
export const cleanupOldPDFs = async (maxAgeInDays = 7, directory = null) => {
  try {
    const baseDir = directory || path.join(process.cwd(), 'generated-pdfs');

    if (!fs.existsSync(baseDir)) {
      return;
    }

    const files = await fs.promises.readdir(baseDir);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filepath = path.join(baseDir, file);
        const stats = await fs.promises.stat(filepath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.promises.unlink(filepath);
          console.log(`🗑️ Deleted old PDF: ${file}`);
        }
      }
    }

    console.log('✅ PDF cleanup completed');
  } catch (error) {
    console.error('Error cleaning up PDFs:', error);
  }
};

export default {
  generatePortfolioPDF,
  generateCombinedPDF,
  savePDFToFile,
  cleanupOldPDFs
};