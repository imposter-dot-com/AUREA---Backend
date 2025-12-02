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
// TODO: Re-enable when templateConvert is ready
// import { generateAllPortfolioFiles } from '../../services/templateConvert.js';

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
    let html = await page.content();

    // Post-process to add proper navigation links (convert JS onClick to <a href>)
    html = postProcessNavigation(html, portfolioData);

    // Determine template ID
    const templateId = portfolioData.templateId || portfolioData.template || 'unknown';

    // Add project popup for non-Echelon templates (Serene, Chic, BoldFolio)
    // These templates use popups instead of case study pages
    if (templateId !== 'echolon' && templateId !== 'echelon') {
      // Get projects based on template type
      // Serene uses gallery rows (firstRow, secondRow, thirdRow)
      // Chic and BoldFolio use work.projects
      let projects = [];

      if (templateId === 'serene') {
        // Serene template: projects in gallery rows
        const gallery = portfolioData.content?.gallery || {};
        projects = [
          ...(gallery.firstRow || []),
          ...(gallery.secondRow || []),
          ...(gallery.thirdRow || [])
        ];
        logger.debug('Serene gallery projects found', { count: projects.length });
      } else {
        // Chic, BoldFolio: projects in work.projects
        projects = portfolioData.content?.work?.projects || [];
        logger.debug('Work projects found', { count: projects.length, templateId });
      }

      if (projects.length > 0) {
        // Add click handlers to project cards
        html = addProjectPopupHandlers(html, projects, templateId);

        // Generate and inject modal HTML/CSS/JS before </body>
        const popupScript = generateProjectPopupScript(projects, templateId);
        if (popupScript) {
          html = html.replace('</body>', `${popupScript}</body>`);
        }

        logger.info('Project popup functionality added', {
          templateId,
          projectCount: projects.length
        });
      } else {
        logger.debug('No projects found for popup', { templateId });
      }
    }

    logger.info('Successfully fetched and processed HTML', { htmlLength: html.length, templateId });

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
 * Post-process captured HTML to convert JS navigation to proper <a> links
 * React templates use onClick handlers which don't work in static HTML.
 * This function wraps navigation elements with proper anchor tags.
 *
 * @param {string} html - Captured HTML from Puppeteer
 * @param {Object} portfolioData - Portfolio data with subdomain and projects
 * @returns {string} HTML with proper navigation links
 */
function postProcessNavigation(html, portfolioData) {
  const subdomain = portfolioData.slug || portfolioData.subdomain;
  if (!subdomain) {
    logger.debug('No subdomain found, skipping navigation post-processing');
    return html;
  }

  // Get projects with case studies
  const projects = portfolioData.content?.work?.projects || [];
  const projectsWithCaseStudy = projects.filter(p => p.hasCaseStudy);

  if (projectsWithCaseStudy.length === 0) {
    logger.debug('No projects with case studies, skipping navigation post-processing');
    return html;
  }

  let processedHtml = html;
  let linksAdded = 0;

  // Process each project with a case study
  projectsWithCaseStudy.forEach((project) => {
    const caseStudyUrl = `/${subdomain}/case-study/${project.id}`;

    // Pattern 1: Match buttons containing "VIEW CASE STUDY" text
    // This handles the Echelon template's button-based navigation
    const buttonPattern = new RegExp(
      `(<button[^>]*>)([^<]*VIEW\\s+CASE\\s+STUDY[^<]*)(</button>)`,
      'gi'
    );

    // Check if this pattern exists before replacing
    if (buttonPattern.test(processedHtml)) {
      // Reset lastIndex for actual replacement
      buttonPattern.lastIndex = 0;

      // Only replace if not already wrapped in an anchor
      processedHtml = processedHtml.replace(buttonPattern, (match, openTag, content, closeTag) => {
        // Check if already wrapped
        const beforeMatch = processedHtml.substring(Math.max(0, processedHtml.indexOf(match) - 50), processedHtml.indexOf(match));
        if (beforeMatch.includes('<a ')) {
          return match;
        }
        linksAdded++;
        return `<a href="${caseStudyUrl}" style="text-decoration:none;display:inline-block;">${openTag}${content}${closeTag}</a>`;
      });
    }
  });

  // Pattern 2: Wrap project cards that have onClick with case study navigation
  // Match divs with "VIEW CASE STUDY →" as a child element
  const viewCaseStudyPattern = /(<[^>]+>)\s*(VIEW CASE STUDY\s*→?)\s*(<\/[^>]+>)/gi;

  projectsWithCaseStudy.forEach((project) => {
    const caseStudyUrl = `/${subdomain}/case-study/${project.id}`;

    // Only process first occurrence for each project (to avoid double-wrapping)
    let replaced = false;
    processedHtml = processedHtml.replace(viewCaseStudyPattern, (match, openTag, text, closeTag) => {
      if (replaced) return match;

      // Check if already wrapped in anchor
      const matchIndex = processedHtml.indexOf(match);
      const beforeMatch = processedHtml.substring(Math.max(0, matchIndex - 100), matchIndex);
      if (beforeMatch.includes(`href="${caseStudyUrl}"`)) {
        return match;
      }

      replaced = true;
      linksAdded++;
      return `<a href="${caseStudyUrl}" style="text-decoration:none;">${openTag}${text}${closeTag}</a>`;
    });
  });

  logger.info('Navigation post-processing complete', {
    subdomain,
    projectsWithCaseStudy: projectsWithCaseStudy.length,
    linksAdded
  });

  return processedHtml;
}

/**
 * Generate modal popup HTML, CSS, and JavaScript for static HTML
 * Used by Serene, Chic, and BoldFolio templates to show project details in a popup
 *
 * @param {Array} projects - Array of projects from portfolio
 * @param {string} templateId - Template identifier
 * @returns {string} Modal HTML/CSS/JS to inject into page
 */
function generateProjectPopupScript(projects, templateId) {
  // Include ALL projects (not just those with detailedDescription)
  // Each project can link to its detail page or show popup with description
  const popupProjects = projects.filter(p => p && p.id);

  if (popupProjects.length === 0) {
    logger.debug('No projects found, skipping popup generation');
    return '';
  }

  // Sanitize project data for JSON embedding (remove functions, circular refs)
  // Handle different image structures:
  // - Chic/Serene: project.image (string URL)
  // - BoldFolio: project.images (array of {src, width, height})
  const sanitizedProjects = popupProjects.map(p => {
    // Get image from either project.image or project.images[0].src
    let imageUrl = '';
    if (p.image) {
      imageUrl = p.image;
    } else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      // BoldFolio uses images array with objects containing src
      imageUrl = p.images[0]?.src || '';
    }

    return {
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      image: imageUrl,
      detailedDescription: p.detailedDescription || p.description || ''
    };
  });

  const popupHtml = `
<!-- Project Modal Popup - Generated by templateEngine -->
<style>
  .project-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  .project-modal-overlay.active {
    opacity: 1;
    visibility: visible;
  }
  .project-modal {
    background: #ffffff;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    transform: translateY(20px);
    transition: transform 0.3s ease;
  }
  .project-modal-overlay.active .project-modal {
    transform: translateY(0);
  }
  .project-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 30px 40px;
    border-bottom: 1px solid #e5e7eb;
  }
  .project-modal-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: #111;
  }
  .project-modal-header p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  .project-modal-close {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #999;
    line-height: 1;
    padding: 0;
    transition: color 0.2s ease;
  }
  .project-modal-close:hover {
    color: #333;
  }
  .project-modal-content {
    padding: 30px 40px;
  }
  .project-modal-content img {
    width: 100%;
    height: auto;
    margin-bottom: 24px;
    border-radius: 4px;
  }
  .project-modal-content .detailed-desc {
    font-size: 16px;
    line-height: 1.7;
    color: #444;
    white-space: pre-line;
  }
  .project-modal-footer {
    padding: 20px 40px;
    border-top: 1px solid #e5e7eb;
    text-align: right;
  }
  .project-modal-footer button {
    background: #111;
    color: #fff;
    border: none;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  .project-modal-footer button:hover {
    background: #333;
  }
  .project-card-clickable {
    cursor: pointer;
  }
  .project-card-clickable:hover {
    opacity: 0.9;
  }
</style>

<div id="projectModal" class="project-modal-overlay">
  <div class="project-modal" onclick="event.stopPropagation()">
    <div class="project-modal-header">
      <div>
        <h2 id="modalTitle">Project Title</h2>
        <p id="modalDescription">Project description</p>
      </div>
      <button class="project-modal-close" onclick="closeProjectModal()" aria-label="Close">&times;</button>
    </div>
    <div class="project-modal-content">
      <img id="modalImage" src="" alt="Project image" />
      <div id="modalDetailedDescription" class="detailed-desc"></div>
    </div>
    <div class="project-modal-footer">
      <button onclick="closeProjectModal()">Close</button>
    </div>
  </div>
</div>

<script>
(function() {
  // Project data embedded from portfolio
  var projectsData = ${JSON.stringify(sanitizedProjects)};

  // Open modal with project data
  window.openProjectModal = function(projectId) {
    var project = projectsData.find(function(p) { return p.id === projectId; });
    if (!project) {
      console.warn('Project not found:', projectId);
      return;
    }

    document.getElementById('modalTitle').textContent = project.title || 'Project';
    document.getElementById('modalDescription').textContent = project.description || '';
    document.getElementById('modalImage').src = project.image || '';
    document.getElementById('modalImage').alt = project.title || 'Project image';
    document.getElementById('modalDetailedDescription').textContent = project.detailedDescription || '';

    document.getElementById('projectModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  window.closeProjectModal = function() {
    document.getElementById('projectModal').classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close on backdrop click
  document.getElementById('projectModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeProjectModal();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeProjectModal();
    }
  });
})();
</script>
`;

  logger.info('Generated project popup script', {
    templateId,
    projectCount: popupProjects.length
  });

  return popupHtml;
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Add click handlers to project cards for popup functionality
 * Only for Serene, Chic, BoldFolio templates (not Echelon which uses case study pages)
 *
 * The approach: Find each project card (div.group) and wrap it in an anchor tag
 * or add onclick handlers to navigate to the project detail page.
 *
 * @param {string} html - Captured HTML from Puppeteer
 * @param {Array} projects - Projects array from portfolio data
 * @param {string} templateId - Template identifier
 * @returns {string} HTML with click handlers added
 */
function addProjectPopupHandlers(html, projects, templateId) {
  // Skip for Echelon (uses case study pages, not popups)
  if (templateId === 'echolon' || templateId === 'echelon') {
    logger.debug('Skipping popup handlers for Echelon template');
    return html;
  }

  // Include ALL projects with valid IDs
  const popupProjects = projects.filter(p => p && p.id);

  if (popupProjects.length === 0) {
    logger.debug('No valid projects found, skipping popup handlers');
    return html;
  }

  let processedHtml = html;
  let handlersAdded = 0;

  // Template-specific handling
  if (templateId === 'serene') {
    // SERENE: Uses <div class="group"> with <h3> titles
    popupProjects.forEach((project) => {
      if (!project.title) return;

      const projectId = project.id;
      const escapedTitle = escapeRegex(project.title);

      // Find the h3 with this title
      const titlePattern = new RegExp(
        `(<h3[^>]*>)([^<]*${escapedTitle}[^<]*)(</h3>)`,
        'gi'
      );

      if (titlePattern.test(processedHtml)) {
        titlePattern.lastIndex = 0;

        const titleMatch = processedHtml.match(titlePattern);
        if (titleMatch) {
          const titleIndex = processedHtml.indexOf(titleMatch[0]);
          const beforeTitle = processedHtml.substring(0, titleIndex);
          const groupDivIndex = beforeTitle.lastIndexOf('<div class="group"');

          if (groupDivIndex !== -1) {
            const afterGroupDiv = processedHtml.substring(groupDivIndex);
            const relativePattern = /<div\s+class="relative\s+overflow-hidden[^"]*"[^>]*style="[^"]*cursor:\s*(pointer|default)[^"]*"[^>]*>/;
            const relativeMatch = afterGroupDiv.match(relativePattern);

            if (relativeMatch) {
              const relativeDiv = relativeMatch[0];
              const relativeIndex = groupDivIndex + afterGroupDiv.indexOf(relativeDiv);

              if (!relativeDiv.includes('onclick')) {
                const newRelativeDiv = relativeDiv
                  .replace('cursor: default', 'cursor: pointer')
                  .replace('cursor:default', 'cursor:pointer')
                  .replace('>', ` onclick="openProjectModal('${projectId}')">`);

                processedHtml = processedHtml.substring(0, relativeIndex) +
                  newRelativeDiv +
                  processedHtml.substring(relativeIndex + relativeDiv.length);

                handlersAdded++;
              }
            }
          }
        }
      }
    });
  } else if (templateId === 'boldfolio' || templateId === 'chic') {
    // BOLDFOLIO/CHIC: Uses <h2> for project titles
    // BoldFolio: background-image divs
    // Chic: <div> with <img> inside, cursor: default on the container
    popupProjects.forEach((project) => {
      if (!project.title) return;

      const projectId = project.id;
      const escapedTitle = escapeRegex(project.title);

      // Find h2 with project title
      const titlePattern = new RegExp(
        `(<h2[^>]*>)([^<]*${escapedTitle}[^<]*)(</h2>)`,
        'gi'
      );

      if (titlePattern.test(processedHtml)) {
        titlePattern.lastIndex = 0;

        const titleMatch = processedHtml.match(titlePattern);
        if (titleMatch) {
          const titleIndex = processedHtml.indexOf(titleMatch[0]);
          const afterTitle = processedHtml.substring(titleIndex);

          // Try to find the next image container div after the title
          // Pattern 1: BoldFolio - div with background-image
          // Pattern 2: Chic - div with cursor: default that contains an img
          let imageDivPattern;
          let imageDivMatch;

          // First try BoldFolio pattern (background-image)
          imageDivPattern = /<div[^>]*style="[^"]*background-image:\s*url\([^)]+\)[^"]*cursor:\s*default[^"]*"[^>]*>/;
          imageDivMatch = afterTitle.match(imageDivPattern);

          // If not found, try Chic pattern (div with cursor: default followed by img)
          if (!imageDivMatch) {
            imageDivPattern = /<div[^>]*style="[^"]*overflow:\s*hidden[^"]*cursor:\s*default[^"]*"[^>]*>/;
            imageDivMatch = afterTitle.match(imageDivPattern);
          }

          // Also try matching any div with cursor: default that's near the title
          if (!imageDivMatch) {
            imageDivPattern = /<div[^>]*style="[^"]*cursor:\s*default[^"]*"[^>]*>/;
            imageDivMatch = afterTitle.match(imageDivPattern);
          }

          if (imageDivMatch) {
            const imageDiv = imageDivMatch[0];
            const imageDivIndex = titleIndex + afterTitle.indexOf(imageDiv);

            if (!imageDiv.includes('onclick')) {
              // Add onclick and change cursor to pointer
              const newImageDiv = imageDiv
                .replace('cursor: default', 'cursor: pointer')
                .replace('cursor:default', 'cursor:pointer')
                .replace('>', ` onclick="openProjectModal('${projectId}')">`);

              processedHtml = processedHtml.substring(0, imageDivIndex) +
                newImageDiv +
                processedHtml.substring(imageDivIndex + imageDiv.length);

              handlersAdded++;
              logger.debug('Added onclick to BoldFolio/Chic image div', { projectId, projectTitle: project.title });
            }
          } else {
            logger.debug('No image div found for project', { projectId, projectTitle: project.title });
          }
        }
      }
    });
  }

  // For all templates: Also make "View Details" text clickable and visible
  // First, make the overlay visible on hover by adding CSS
  const hoverCss = `
<style>
  .project-hover-overlay {
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
  }
  .project-hover-overlay:hover,
  [onclick*="openProjectModal"]:hover .project-hover-overlay {
    opacity: 1 !important;
  }
  [onclick*="openProjectModal"] {
    cursor: pointer !important;
  }
</style>
`;

  // Add hover CSS if not already present
  if (!processedHtml.includes('.project-hover-overlay')) {
    processedHtml = processedHtml.replace('</head>', `${hoverCss}</head>`);
  }

  // Add class to overlay divs that have opacity: 0
  processedHtml = processedHtml.replace(
    /(<div[^>]*class="absolute inset-0[^"]*"[^>]*style="[^"]*opacity:\s*0[^"]*")/gi,
    '$1 class="absolute inset-0 project-hover-overlay"'
  );

  logger.info('Added project popup handlers', {
    templateId,
    popupProjects: popupProjects.length,
    handlersAdded
  });

  return processedHtml;
}

/**
 * Add navigation links to case study HTML (Back to Portfolio + Next Project)
 *
 * @param {string} html - Case study HTML
 * @param {Object} navContext - Navigation context
 * @param {string} navContext.subdomain - Portfolio subdomain
 * @param {string} navContext.projectId - Current project ID
 * @param {string} navContext.nextProjectId - Next project ID (optional)
 * @param {string} navContext.nextProjectTitle - Next project title (optional)
 * @returns {string} HTML with navigation added
 */
function addCaseStudyNavigation(html, navContext) {
  const { subdomain, nextProjectId, nextProjectTitle } = navContext;

  if (!subdomain) {
    logger.debug('No subdomain provided, skipping case study navigation');
    return html;
  }

  // Check if navigation already exists (avoid duplicates)
  if (html.includes('BACK TO PORTFOLIO') || html.includes('back-to-portfolio') || html.includes('← BACK')) {
    logger.debug('Navigation already exists in case study HTML');
    return html;
  }

  const portfolioUrl = `/${subdomain}/html`;
  const nextUrl = nextProjectId ? `/${subdomain}/case-study/${nextProjectId}` : null;

  // Create navigation HTML matching the Echelon template style
  const navHtml = `
    <!-- Case Study Navigation -->
    <nav style="max-width:1400px;margin:80px auto 0;padding:0 60px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #E5E5E5;padding-top:40px;">
      <a href="${portfolioUrl}" style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:#000000;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;display:inline-flex;align-items:center;gap:8px;transition:opacity 0.3s ease;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        ← BACK TO PORTFOLIO
      </a>
      ${nextUrl ? `
      <a href="${nextUrl}" style="font-family:'Neue Haas Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#000000;text-decoration:none;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;transition:opacity 0.3s ease;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        ${nextProjectTitle || 'NEXT PROJECT'} →
      </a>
      ` : ''}
    </nav>
  `;

  // Insert navigation before closing </main> tag, or before </body> if no </main>
  let processedHtml = html;

  if (processedHtml.includes('</main>')) {
    processedHtml = processedHtml.replace('</main>', `${navHtml}</main>`);
  } else if (processedHtml.includes('</body>')) {
    processedHtml = processedHtml.replace('</body>', `${navHtml}</body>`);
  } else {
    // Append to end if no closing tags found
    processedHtml += navHtml;
  }

  logger.info('Case study navigation added', { subdomain, hasNextProject: !!nextProjectId });

  return processedHtml;
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
  // TODO: Re-enable when templateConvert is ready
  logger.info('Fallback disabled - using minimal HTML instead');
  return generateMinimalHTML(portfolioData);

  /*
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
  */
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
 * @param {string} options.subdomain - Portfolio subdomain for navigation links
 * @param {string} options.nextProjectId - Next project ID for navigation
 * @param {string} options.nextProjectTitle - Next project title for navigation
 * @param {boolean} options.forceFallback - Force use of fallback method
 * @returns {Promise<string>} Case study HTML
 */
export async function getCaseStudyHTML(portfolioData, projectId, options = {}) {
  const CONFIG = getConfig();
  const { subdomain, nextProjectId, nextProjectTitle, forceFallback } = options;

  logger.info('Generating case study HTML', { projectId, subdomain, nextProjectId });

  // Determine template
  const effectiveTemplateId = portfolioData.templateId ||
                              portfolioData.template ||
                              DEFAULT_TEMPLATE_ID;

  // Get template configuration
  const template = getTemplate(effectiveTemplateId);

  // Check if template has case study support and URL
  if (template && template.hasCaseStudySupport && template.caseStudyUrl && !forceFallback) {
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
          let html = await page.content();

          // Add navigation links (Back to Portfolio + Next Project)
          const effectiveSubdomain = subdomain || portfolioData.slug || portfolioData.subdomain;
          html = addCaseStudyNavigation(html, {
            subdomain: effectiveSubdomain,
            projectId,
            nextProjectId,
            nextProjectTitle
          });

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

  // TODO: Re-enable when templateConvert is ready
  // Fallback to minimal case study HTML for now
  logger.info('templateConvert disabled - generating minimal case study HTML');

  const effectiveSubdomain = subdomain || portfolioData.slug || portfolioData.subdomain;
  const caseStudy = portfolioData.caseStudies?.[projectId] || {};
  const title = caseStudy.content?.hero?.title || 'Case Study';

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 2em; margin-bottom: 1em; }
    .back-link { display: inline-block; margin-bottom: 2em; color: #666; text-decoration: none; }
    .back-link:hover { color: #000; }
  </style>
</head>
<body>
  <a href="/${effectiveSubdomain}/html" class="back-link">← Back to Portfolio</a>
  <h1>${title}</h1>
  <p>Case study content coming soon.</p>
</body>
</html>
  `.trim();

  // Add navigation links
  html = addCaseStudyNavigation(html, {
    subdomain: effectiveSubdomain,
    projectId,
    nextProjectId,
    nextProjectTitle
  });

  return html;

  /*
  // Fallback to templateConvert.js
  try {
    const files = generateAllPortfolioFiles(portfolioData, {
      forPDF: true,
      subdomain: subdomain || portfolioData.slug,
      ...options
    });

    const caseStudyKey = `case-study-${projectId}.html`;
    let html = files[caseStudyKey];

    if (!html) {
      throw new Error(`Case study HTML not found for project ${projectId}`);
    }

    // Add navigation links (Back to Portfolio + Next Project)
    const effectiveSubdomain = subdomain || portfolioData.slug || portfolioData.subdomain;
    html = addCaseStudyNavigation(html, {
      subdomain: effectiveSubdomain,
      projectId,
      nextProjectId,
      nextProjectTitle
    });

    return html;

  } catch (error) {
    logger.error('Case study generation failed', { error, projectId });
    throw error;
  }
  */
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
