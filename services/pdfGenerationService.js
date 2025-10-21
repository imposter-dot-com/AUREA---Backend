/**
 * PDF Generation Service using Puppeteer
 *
 * This service generates PDF files from portfolio HTML templates
 * using Puppeteer to ensure the exported PDF looks identical to the HTML design
 *
 * UPDATED: Now supports template-specific PDF generation using templateEngine
 */

import puppeteer from 'puppeteer';
import { generateAllPortfolioFiles } from './templateConvert.js';
import { getTemplateHTML, getCaseStudyHTML } from '../src/services/templateEngine.js';
import Portfolio from '../src/models/Portfolio.js';
import CaseStudy from '../src/models/CaseStudy.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  deviceScaleFactor: 2 // Higher quality for retina displays
};

/**
 * Initialize Puppeteer browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
const initializeBrowser = async () => {
  try {
    // Production-ready configuration
    const launchOptions = {
      headless: 'new', // Use new headless mode for better compatibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--start-maximized',
        '--disable-web-security', // Allow loading external resources
        '--disable-features=IsolateOrigins,site-per-process',
        // Additional production stability args
        // NOTE: --single-process and --no-zygote disable multi-process architecture
        // which reduces performance. Only enable if Railway/Heroku memory limits require it.
        // '--single-process', // Use single process (Railway/Heroku compatibility) [DISABLED]
        // '--no-zygote', // Disable zygote process [DISABLED]
        '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm
        '--disable-software-rasterizer' // Disable software rasterizer
      ],
      defaultViewport: DEFAULT_VIEWPORT,
      timeout: 60000 // Increase timeout for slow production environments
    };

    // Try to use system Chrome in production (if available via nixpacks)
    if (process.env.NODE_ENV === 'production') {
      // Try common Chrome paths on Linux servers
      const possiblePaths = [
        // '/nix/store/*/bin/chromium', // Glob pattern doesn't work with fs.existsSync - removed
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome'
      ];

      for (const chromePath of possiblePaths) {
        if (chromePath.includes('*')) {
          // For nix paths, we'll let Puppeteer find it
          continue;
        }
        try {
          if (fs.existsSync(chromePath)) {
            launchOptions.executablePath = chromePath;
            console.log(`🔍 Using system Chrome: ${chromePath}`);
            break;
          }
        } catch (err) {
          // Continue to next path
        }
      }
    }

    const browser = await puppeteer.launch(launchOptions);

    console.log('✅ Puppeteer browser initialized successfully');
    return browser;
  } catch (error) {
    console.error('Failed to initialize Puppeteer browser:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV
    });
    throw new Error(`Browser initialization failed: ${error.message}`);
  }
};

/**
 * Prepare portfolio data with case studies
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID for ownership validation
 * @returns {Promise<Object>} Complete portfolio data with case studies
 */
const preparePortfolioData = async (portfolioId, userId) => {
  try {
    // Fetch portfolio
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      userId: userId
    });

    if (!portfolio) {
      throw new Error('Portfolio not found or access denied');
    }

    // Fetch case studies
    const caseStudies = await CaseStudy.find({ portfolioId: portfolioId });

    // Prepare portfolio data with case studies
    const portfolioWithCaseStudies = portfolio.toObject();

    // Convert case studies array to object keyed by projectId
    if (caseStudies && caseStudies.length > 0) {
      portfolioWithCaseStudies.caseStudies = {};

      caseStudies.forEach(cs => {
        portfolioWithCaseStudies.caseStudies[cs.projectId] = cs.toObject();
      });

      // Mark projects that have case studies
      const caseStudyProjectIds = caseStudies.map(cs => String(cs.projectId));

      // Update projects in content.work.projects array
      if (portfolioWithCaseStudies.content?.work?.projects) {
        portfolioWithCaseStudies.content.work.projects = portfolioWithCaseStudies.content.work.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }

      // Also update content.projects array if it exists
      if (portfolioWithCaseStudies.content?.projects) {
        portfolioWithCaseStudies.content.projects = portfolioWithCaseStudies.content.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }
    }

    return portfolioWithCaseStudies;
  } catch (error) {
    console.error('Error preparing portfolio data:', error);
    throw error;
  }
};

/**
 * Generate PDF from portfolio HTML
 * @param {String} htmlContent - HTML content to convert
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDFFromHTML = async (htmlContent, options = {}) => {
  let browser = null;
  let page = null;

  try {
    // Initialize browser
    browser = await initializeBrowser();
    page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport(DEFAULT_VIEWPORT);

    // Enable JavaScript execution
    await page.setJavaScriptEnabled(true);

    // Set content with waitUntil options for full page load
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
      timeout: 30000 // 30 seconds timeout
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Additional wait for any lazy-loaded images
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        const imagePromises = [];

        images.forEach((img) => {
          if (!img.complete) {
            imagePromises.push(new Promise((imgResolve) => {
              img.addEventListener('load', imgResolve);
              img.addEventListener('error', imgResolve); // Resolve even on error
            }));
          }
        });

        Promise.all(imagePromises).then(resolve);

        // Fallback timeout to prevent infinite waiting
        setTimeout(resolve, 5000);
      });
    });

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

    // Scroll to bottom to ensure all content is loaded
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Scroll back to top
            resolve();
          }
        }, 50);
      });
    });

    // Generate PDF with merged options
    const pdfOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...options
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    console.log('✅ PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Clean up resources
    if (page) {
      await page.close().catch(console.error);
    }
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
};

/**
 * Generate PDF for a specific portfolio page
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID
 * @param {String} pageType - Type of page ('portfolio' or specific case study ID)
 * @param {Object} options - PDF generation options
 * @param {String} templateId - Optional template ID to override portfolio default
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePortfolioPDF = async (portfolioId, userId, pageType = 'portfolio', options = {}, templateId = null) => {
  try {
    console.log(`🚀 Starting PDF generation for portfolio: ${portfolioId}, page: ${pageType}, template: ${templateId || 'default'}`);

    // Prepare portfolio data
    const portfolioData = await preparePortfolioData(portfolioId, userId);

    let htmlContent;
    let filename;

    if (pageType === 'portfolio' || pageType === 'all') {
      // Main portfolio page - USE TEMPLATE ENGINE for template-specific HTML
      console.log('📄 Generating template-specific portfolio HTML...');

      try {
        // Try to use template engine (fetches from frontend)
        htmlContent = await getTemplateHTML(portfolioData, templateId, { forPDF: true });
        console.log('✅ Template HTML generated successfully');
      } catch (templateError) {
        console.warn('⚠️ Template engine failed, using fallback:', templateError.message);
        // Fallback to traditional method
        const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });
        htmlContent = allFiles['index.html'];
      }

      filename = `${portfolioData.title || 'portfolio'}.pdf`;

    } else if (pageType.startsWith('case-study-')) {
      // Case study page - USE UNIFORM DESIGN (templateConvert.js)
      console.log('📄 Generating case study HTML (uniform design)...');

      const projectId = pageType.replace('case-study-', '');

      try {
        // Use templateEngine's case study method (uses templateConvert.js internally)
        htmlContent = getCaseStudyHTML(portfolioData, projectId, { forPDF: true });
        console.log('✅ Case study HTML generated successfully');
      } catch (caseStudyError) {
        console.warn('⚠️ Case study generation failed:', caseStudyError.message);
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

    return {
      buffer: pdfBuffer,
      filename: filename.replace(/[^a-z0-9.-]/gi, '_'), // Sanitize filename
      contentType: 'application/pdf'
    };

  } catch (error) {
    console.error('Error in generatePortfolioPDF:', error);
    throw error;
  }
};

/**
 * Generate combined PDF with portfolio and all case studies
 * @param {String} portfolioId - Portfolio ID
 * @param {String} userId - User ID
 * @param {Object} options - PDF generation options
 * @param {String} templateId - Optional template ID to override portfolio default
 * @returns {Promise<Buffer>} Combined PDF buffer
 */
export const generateCombinedPDF = async (portfolioId, userId, options = {}, templateId = null) => {
  let browser = null;
  let page = null;

  try {
    console.log(`🚀 Starting combined PDF generation for portfolio: ${portfolioId}, template: ${templateId || 'default'}`);

    // Prepare portfolio data
    const portfolioData = await preparePortfolioData(portfolioId, userId);

    const htmlParts = [];

    // Add main portfolio page - USE TEMPLATE ENGINE for template-specific HTML
    console.log('📄 Generating template-specific portfolio HTML...');
    try {
      const portfolioHTML = await getTemplateHTML(portfolioData, templateId, { forPDF: true });
      htmlParts.push(portfolioHTML);
      console.log('✅ Portfolio HTML generated with template engine');
    } catch (templateError) {
      console.warn('⚠️ Template engine failed, using fallback:', templateError.message);
      // Fallback to traditional method
      const allFiles = generateAllPortfolioFiles(portfolioData, { forPDF: true });
      if (allFiles['index.html']) {
        htmlParts.push(allFiles['index.html']);
      }
    }

    // Add all case study pages - USE UNIFORM DESIGN (templateConvert.js)
    console.log('📄 Generating case study pages (uniform design)...');

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

    const filename = `${portfolioData.title || 'portfolio'}_complete.pdf`;

    return {
      buffer: pdfBuffer,
      filename: filename.replace(/[^a-z0-9.-]/gi, '_'),
      contentType: 'application/pdf'
    };

  } catch (error) {
    console.error('Error in generateCombinedPDF:', error);
    throw error;
  } finally {
    // Clean up resources
    if (page) {
      await page.close().catch(console.error);
    }
    if (browser) {
      await browser.close().catch(console.error);
    }
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