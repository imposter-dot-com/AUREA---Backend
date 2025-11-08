/**
 * Template Engine Service
 *
 * Orchestrates template selection and HTML generation for PDF exports.
 * Uses a hybrid approach: fetches rendered HTML from frontend preview pages
 * using Puppeteer, with fallback to server-side template generation.
 *
 * Architecture:
 * 1. Primary: Capture HTML from frontend React components via Puppeteer
 * 2. Fallback 1: Use templateConvert.js (Swiss design)
 * 3. Fallback 2: Generate minimal HTML with portfolio data
 */

import puppeteer from 'puppeteer';
import logger from '../infrastructure/logging/Logger.js';
// config module removed to avoid circular dependency - using process.env directly
import { getTemplate, templateExists, DEFAULT_TEMPLATE_ID } from '../config/templateRegistry.js';
import { generateAllPortfolioFiles } from '../../services/templateConvert.js';

/**
 * Template Engine Configuration
 * Note: fastMode and saveDebugFiles are loaded lazily to avoid circular dependency
 */
const getConfig = () => ({
  puppeteerTimeout: 30000, // 30 seconds timeout
  maxRetries: 2,
  retryDelay: 1000, // 1 second between retries
  enableFallback: true,
  fastMode: process.env.PDF_FAST_MODE === 'true' || false, // Skip some waits for faster generation
  saveDebugFiles: process.env.PDF_DEBUG === 'true' || false // Only save debug files when explicitly enabled
});

/**
 * Browser instance cache for reuse (performance optimization)
 */
let browserInstance = null;
let browserLastUsed = Date.now();
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Get or create Puppeteer browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function getBrowser() {
  // Close idle browser
  if (browserInstance && Date.now() - browserLastUsed > BROWSER_IDLE_TIMEOUT) {
    try {
      await browserInstance.close();
      browserInstance = null;
    } catch (error) {
      logger.error('Error closing idle browser', { error: error.message });
      browserInstance = null;
    }
  }

  // Create new browser if needed
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }

  browserLastUsed = Date.now();
  return browserInstance;
}

/**
 * Close browser instance (cleanup)
 */
export async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
    } catch (error) {
      logger.error('Error closing browser', { error: error.message });
    }
  }
}

/**
 * Fetch rendered HTML from frontend preview page
 * @param {string} previewUrl - Frontend preview URL
 * @param {Object} portfolioData - Portfolio data to inject
 * @param {Object} puppeteerSettings - Puppeteer configuration
 * @returns {Promise<string>} Rendered HTML
 */
async function fetchHTMLFromFrontend(previewUrl, portfolioData, puppeteerSettings) {
  const CONFIG = getConfig(); // Initialize config at function level
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport
    if (puppeteerSettings.viewport) {
      await page.setViewport(puppeteerSettings.viewport);
    }

    // Navigate to preview page with portfolio data
    const portfolioId = portfolioData._id || portfolioData.id;
    const urlWithData = `${previewUrl}?pdfMode=true`;

    logger.debug('Fetching HTML from frontend', { url: urlWithData, portfolioId });

    // Inject portfolio data BEFORE page loads so React can access it immediately
    await page.evaluateOnNewDocument((data) => {
      window.__PORTFOLIO_DATA__ = data;
      window.__PDF_MODE__ = true;
      logger.debug('Portfolio data injected', { portfolioId: data._id || data.id });
    }, portfolioData);

    // Navigate and wait for content - use 'load' instead of 'networkidle0' for React apps
    await page.goto(urlWithData, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: CONFIG.puppeteerTimeout
    });

    logger.debug('Page loaded, waiting for React to render');

    // Enable console logging from the page for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Show all logs except verbose ones
      if (type === 'error' || type === 'warning' || type === 'log') {
        logger.debug(`Browser ${type}`, { message: text });
      }
    });

    // Check for errors
    page.on('pageerror', error => {
      logger.error('Browser page error', { error: error.message });
    });

    // Wait for React to mount and render
    // Reduced from 3s to 1s since data is pre-injected (no API call delay)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Quick check if page has content
    const bodyText = await page.evaluate(() => document.body.innerText);
    logger.debug('Page loaded', { textLength: bodyText.length });

    // Wait for key selectors to appear (reduced timeout for speed)
    let foundContent = false;
    if (puppeteerSettings.waitForSelectors && puppeteerSettings.waitForSelectors.length > 0) {
      for (const selector of puppeteerSettings.waitForSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 }); // Reduced from 10s to 3s
          logger.debug('Found selector', { selector });
          foundContent = true;
          break; // If we find at least one selector, we're good
        } catch (error) {
          // Silent - will try next selector
        }
      }
    }

    // If no selectors found, quick body content check
    if (!foundContent) {
      try {
        await page.waitForFunction(
          () => document.body && document.body.innerText.length > 100,
          { timeout: 2000 } // Reduced from 10s to 2s
        );
        logger.debug('Found body content');
      } catch (error) {
        logger.warn('No selectors found, but proceeding', { message: 'Data may be injected' });
      }
    }

    // Wait for custom fonts to load (with timeout)
    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise(resolve => setTimeout(resolve, 1000)) // Max 1s wait for fonts
      ]);
      logger.debug('Fonts loaded');
    } catch (error) {
      logger.warn('Font loading timeout, proceeding');
    }

    // Scroll through page to trigger lazy loading (skip in fast mode)
    if (!CONFIG.fastMode) {
      await autoScroll(page, puppeteerSettings.scrollDelay || 300);
    }

    // Wait for images to load (skip in fast mode for speed)
    if (!CONFIG.fastMode) {
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve;
              setTimeout(resolve, 2000); // Max 2s per image
            }))
        );
      });
      logger.debug('Images loaded');
    } else {
      logger.debug('Fast mode enabled', { message: 'Skipping scroll and image wait' });
    }

    // Final wait for any animations (reduced from 1.5s to 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the full HTML
    const html = await page.content();

    logger.info('Successfully fetched HTML', { htmlLength: html.length });

    // Debug: Save screenshot and HTML for troubleshooting (only if enabled)
    if (CONFIG.saveDebugFiles) {
      try {
        const debugDir = './debug-pdf';
        const fs = await import('fs');
        const path = await import('path');

        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }

        const timestamp = Date.now();
        const templateId = portfolioData.templateId || portfolioData.template || 'unknown';

        // Save screenshot
        await page.screenshot({
          path: path.join(debugDir, `screenshot-${templateId}-${timestamp}.png`),
          fullPage: true
        });

        // Save HTML
        fs.writeFileSync(
          path.join(debugDir, `html-${templateId}-${timestamp}.html`),
          html
        );

        logger.debug('Debug files saved', { directory: debugDir });
      } catch (debugError) {
        logger.warn('Failed to save debug files', { error: debugError.message });
      }
    }

    return html;

  } catch (error) {
    logger.error('Error fetching HTML from frontend', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Auto-scroll page to trigger lazy loading
 * @param {Page} page - Puppeteer page
 * @param {number} delay - Delay between scroll steps (ms)
 */
async function autoScroll(page, delay = 500) {
  await page.evaluate(async (scrollDelay) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300; // Scroll 300px at a time
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Scroll back to top
          setTimeout(resolve, scrollDelay);
        }
      }, 100);
    });
  }, delay);
}

/**
 * Generate HTML using fallback method (templateConvert.js)
 * @param {Object} portfolioData - Portfolio data
 * @param {Object} options - Generation options
 * @returns {string} Generated HTML
 */
function generateFallbackHTML(portfolioData, options = {}) {
  logger.info('Using fallback: templateConvert.js');

  try {
    const files = generateAllPortfolioFiles(portfolioData, {
      forPDF: true,
      ...options
    });

    return files['index.html'] || '';
  } catch (error) {
    logger.error('Fallback HTML generation failed', { error });
    throw error;
  }
}

/**
 * Generate minimal HTML as last resort
 * @param {Object} portfolioData - Portfolio data
 * @returns {string} Minimal HTML
 */
function generateMinimalHTML(portfolioData) {
  logger.info('Using minimal HTML fallback');

  const name = portfolioData.content?.about?.name || 'Portfolio';
  const title = portfolioData.title || name;
  const bio = portfolioData.content?.about?.bio || '';
  const projects = portfolioData.content?.work?.projects || [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2.5em; margin-bottom: 0.2em; }
    h2 { font-size: 1.8em; margin-top: 2em; border-bottom: 2px solid #333; }
    .bio { font-size: 1.1em; color: #666; margin-bottom: 2em; }
    .project { margin-bottom: 2em; padding: 1em; border: 1px solid #ddd; }
    .project h3 { margin-top: 0; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p class="bio">${bio}</p>

  ${projects.length > 0 ? `
    <h2>Projects</h2>
    ${projects.map(project => `
      <div class="project">
        <h3>${project.title || 'Untitled Project'}</h3>
        <p>${project.description || ''}</p>
      </div>
    `).join('')}
  ` : ''}
</body>
</html>
  `.trim();
}

/**
 * Get template-specific HTML for portfolio
 * Main entry point for the template engine
 *
 * @param {Object} portfolioData - Portfolio data including content, styling, etc.
 * @param {string} templateId - Template identifier (optional, uses portfolio.templateId if not provided)
 * @param {Object} options - Additional options
 * @param {boolean} options.forPDF - Whether HTML is for PDF generation
 * @param {boolean} options.forceFallback - Force use of fallback method
 * @returns {Promise<string>} Generated HTML
 */
export async function getTemplateHTML(portfolioData, templateId = null, options = {}) {
  const CONFIG = getConfig(); // Initialize config at function level
  // Determine which template to use
  const effectiveTemplateId = templateId ||
                               portfolioData.templateId ||
                               portfolioData.template ||
                               DEFAULT_TEMPLATE_ID;

  logger.info('Generating HTML for template', { templateId: effectiveTemplateId });

  // Get template configuration
  const template = getTemplate(effectiveTemplateId);

  if (!template) {
    logger.warn('Template not found, using fallback', { templateId: effectiveTemplateId });
    return generateFallbackHTML(portfolioData, options);
  }

  // If force fallback is enabled, skip frontend fetch
  if (options.forceFallback || !CONFIG.enableFallback) {
    return generateFallbackHTML(portfolioData, options);
  }

  // Try to fetch from frontend with retries
  let lastError = null;
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      logger.info('Attempting to fetch from frontend', { attempt, maxRetries: CONFIG.maxRetries });

      const html = await fetchHTMLFromFrontend(
        template.previewUrl,
        portfolioData,
        template.puppeteerSettings
      );

      return html;

    } catch (error) {
      lastError = error;
      logger.error('Fetch attempt failed', { attempt, error: error.message });

      // Wait before retry (except on last attempt)
      if (attempt < CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }

  // All attempts failed, use fallback
  logger.warn('Failed to fetch from frontend, using fallback', { attempts: CONFIG.maxRetries });
  logger.error('Last error', { error: lastError });

  if (CONFIG.enableFallback) {
    try {
      return generateFallbackHTML(portfolioData, options);
    } catch (fallbackError) {
      logger.error('Fallback generation failed', { error: fallbackError });
      // Last resort: minimal HTML
      return generateMinimalHTML(portfolioData);
    }
  }

  throw new Error(`Template engine failed: ${lastError.message}`);
}

/**
 * Get case study HTML
 * Uses frontend preview page for templates with case study support,
 * falls back to templateConvert.js for uniform design
 * @param {Object} portfolioData - Portfolio data with case studies
 * @param {string} projectId - Project ID for the case study
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Case study HTML
 */
export async function getCaseStudyHTML(portfolioData, projectId, options = {}) {
  const CONFIG = getConfig();
  logger.info('Generating case study HTML', { projectId });

  // Determine template
  const effectiveTemplateId = portfolioData.templateId ||
                              portfolioData.template ||
                              DEFAULT_TEMPLATE_ID;

  // Get template configuration
  const template = getTemplate(effectiveTemplateId);

  // Check if template has case study support and URL
  if (template && template.hasCaseStudySupport && template.caseStudyUrl && !options.forceFallback) {
    logger.info('Template has case study support, fetching from frontend', {
      templateId: effectiveTemplateId,
      caseStudyUrl: template.caseStudyUrl
    });

    // Try to fetch from frontend with retries
    let lastError = null;
    for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
      try {
        logger.info('Attempting to fetch case study from frontend', {
          attempt,
          maxRetries: CONFIG.maxRetries,
          projectId
        });

        // Construct case study preview URL with parameters
        const caseStudyPreviewUrl = `${template.caseStudyUrl}?portfolioId=${portfolioData._id || portfolioData.id}&projectId=${projectId}&pdfMode=true`;

        // Fetch HTML using the same Puppeteer logic
        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
          // Set viewport
          if (template.puppeteerSettings?.viewport) {
            await page.setViewport(template.puppeteerSettings.viewport);
          }

          // Inject portfolio data before navigation
          await page.evaluateOnNewDocument((data, pId) => {
            window.__PORTFOLIO_DATA__ = data;
            window.__PROJECT_ID__ = pId;
            window.__PDF_MODE__ = true;
          }, portfolioData, projectId);

          // Navigate to case study preview page
          await page.goto(caseStudyPreviewUrl, {
            waitUntil: ['load', 'domcontentloaded'],
            timeout: CONFIG.puppeteerTimeout
          });

          logger.debug('Case study page loaded, waiting for content');

          // Wait for React to render
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Wait for case study content selectors
          const caseStudySelectors = ['h1', 'h2', 'section', 'main', '[class*="case-study"]'];
          for (const selector of caseStudySelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 3000 });
              logger.debug('Found case study selector', { selector });
              break;
            } catch (error) {
              // Silent - try next selector
            }
          }

          // Wait for fonts (quick timeout)
          try {
            await Promise.race([
              page.evaluateHandle('document.fonts.ready'),
              new Promise(resolve => setTimeout(resolve, 1000))
            ]);
          } catch (error) {
            logger.debug('Font loading timeout, proceeding');
          }

          // Get the HTML
          const html = await page.content();
          logger.info('Successfully fetched case study HTML from frontend', {
            htmlLength: html.length,
            projectId
          });

          return html;

        } finally {
          await page.close();
        }

      } catch (error) {
        lastError = error;
        logger.error('Case study fetch attempt failed', {
          attempt,
          error: error.message,
          projectId
        });

        // Wait before retry (except on last attempt)
        if (attempt < CONFIG.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
      }
    }

    // Frontend fetch failed, fall back to templateConvert
    logger.warn('Failed to fetch case study from frontend, using templateConvert fallback', {
      projectId,
      lastError: lastError?.message
    });
  } else {
    logger.info('Using templateConvert for case study (no frontend support)', {
      templateId: effectiveTemplateId,
      hasCaseStudySupport: template?.hasCaseStudySupport
    });
  }

  // Fallback to templateConvert.js
  try {
    const files = generateAllPortfolioFiles(portfolioData, {
      forPDF: true,
      ...options
    });

    const caseStudyKey = `case-study-${projectId}.html`;
    const html = files[caseStudyKey];

    if (!html) {
      throw new Error(`Case study HTML not found for project ${projectId}`);
    }

    return html;

  } catch (error) {
    logger.error('Case study generation failed', { error, projectId });
    throw error;
  }
}

/**
 * Get template configuration
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template configuration
 */
export function getTemplateConfig(templateId) {
  return getTemplate(templateId);
}

/**
 * Check if template is available
 * @param {string} templateId - Template identifier
 * @returns {boolean} True if template exists
 */
export function isTemplateAvailable(templateId) {
  return templateExists(templateId);
}

/**
 * Configure template engine
 * @param {Object} config - Configuration options
 * @deprecated Configuration is now read from environment variables
 */
export function configure(config) {
  // This function is deprecated as CONFIG is now dynamically generated
  // To configure PDF settings, use environment variables:
  // PDF_FAST_MODE=true
  // PDF_DEBUG=true
  logger.warn('configure() is deprecated. Use environment variables instead.', { config });
}

// Cleanup on process exit
process.on('exit', () => {
  if (browserInstance) {
    browserInstance.close().catch(() => {});
  }
});

export default {
  getTemplateHTML,
  getCaseStudyHTML,
  getTemplateConfig,
  isTemplateAvailable,
  configure,
  closeBrowser
};
