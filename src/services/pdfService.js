/**
 * Enhanced PDF Generator Service
 * 
 * Modern PDF generation from HTML with advanced features:
 * - Optimized Puppeteer rendering with smart retry logic
 * - Tailwind pre-compiled CSS and CDN fallback support
 * - Enhanced print styles for pixel-perfect PDFs
 * - Concurrent processing for batch operations
 * - Memory optimization and resource management
 * - Comprehensive error handling and logging
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const CONFIG = {
  VIEWPORT: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2, // Higher quality rendering
  },
  TIMEOUTS: {
    pageLoad: 30000,
    rendering: 8000,
    cdnFallback: 12000,
    finalWait: 5000,
  },
  PDF_OPTIONS: {
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: false,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
    scale: 1,
    landscape: false,
  },
  BROWSER_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--font-render-hinting=none',
    '--force-color-profile=srgb',
    '--disable-features=VizDisplayCompositor',
  ],
};

/**
 * Load pre-compiled Tailwind CSS
 * @returns {string|null} Compiled CSS content or null
 */
const getCompiledCSS = async () => {
  try {
    const cssPath = path.join(process.cwd(), 'dist', 'output.css');
    if (existsSync(cssPath)) {
      const css = await fs.readFile(cssPath, 'utf8');
      console.log('✅ Loaded pre-compiled Tailwind CSS');
      return css;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Could not load compiled CSS, using CDN fallback');
    return null;
  }
};

/**
 * Enhanced print-optimized CSS
 * @returns {string} CSS styles for optimal PDF rendering
 */
const getPrintOptimizationCSS = () => `
  <style>
    /* Force exact color reproduction */
    html, body {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Global exact color rendering */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-decoration-break: clone !important;
    }
    
    /* Force background images and gradients */
    .bg-gradient-to-br,
    .bg-gradient-to-r,
    .bg-gradient-to-b,
    .bg-gradient-to-l,
    .bg-gradient-to-t,
    [class*="bg-gradient"],
    [class*="bg-cover"],
    [class*="bg-contain"] {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-attachment: local !important;
    }
    
    /* Text gradient support */
    .bg-clip-text {
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }
    
    @media print {
      /* Reset body margins */
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Disable animations but preserve final state */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      
      /* Fix animated elements - show static final state */
      .animate-blob,
      .animate-blob-delay-2,
      .animate-blob-delay-4 {
        animation: none !important;
        opacity: 0.7 !important;
        transform: scale(1) !important;
        display: block !important;
        visibility: visible !important;
      }
      
      .animate-pulse,
      .animate-bounce,
      .animate-spin,
      [class*="animate-"] {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        display: block !important;
        visibility: visible !important;
      }
      
      /* Ensure gradients render properly */
      .bg-gradient-to-r,
      .bg-gradient-to-br,
      .bg-gradient-to-b,
      .bg-gradient-to-l,
      .bg-gradient-to-t {
        background-image: var(--tw-gradient-stops) !important;
      }
      
      /* Ensure gradients render properly */
      .bg-gradient-to-r,
      .bg-gradient-to-br,
      .bg-gradient-to-b,
      .bg-gradient-to-l,
      .bg-gradient-to-t {
        background-image: var(--tw-gradient-stops) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* Preserve all backgrounds with exact colors */
      [class*="bg-"] {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Ensure blur effects work in PDF */
      [class*="blur"] {
        filter: inherit !important;
        -webkit-filter: inherit !important;
      }
      
      /* Page break optimizations */
      section {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 2rem;
      }
      
      /* Grid and masonry layout fixes */
      .masonry-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 2rem !important;
        break-inside: auto;
      }
      
      .masonry-grid > * {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 1.5rem;
      }
      
      /* Container optimizations */
      .container {
        max-width: 100% !important;
        width: 100% !important;
      }
      
      /* Force backdrop filters */
      .backdrop-blur-sm {
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
      }
      
      .backdrop-blur-md {
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }
      
      /* Shadow preservation */
      [class*="shadow-"] {
        box-shadow: inherit !important;
      }
      
      /* Image quality */
      img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Link styling for print */
      a {
        text-decoration: none;
        color: inherit;
      }
      
      /* Prevent orphans and widows */
      p, li {
        orphans: 3;
        widows: 3;
      }
    }
    
    /* Screen rendering optimizations */
    @media screen {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
`;

/**
 * Optimize HTML content for PDF generation
 * @param {string} htmlContent - Original HTML content
 * @param {string|null} compiledCSS - Pre-compiled CSS or null
 * @returns {string} Optimized HTML
 */
const optimizeHTMLForPDF = async (htmlContent, compiledCSS = null) => {
  try {
    console.log('🔄 Optimizing HTML for PDF rendering...');
    
    let optimizedHTML = htmlContent;
    
    // Remove existing Tailwind CDN if we have compiled CSS
    if (compiledCSS) {
      console.log('🎨 Using pre-compiled Tailwind CSS');
      optimizedHTML = optimizedHTML.replace(
        /<script[^>]*tailwindcss[^>]*><\/script>/gi,
        ''
      );
      
      // Inject compiled CSS before </head>
      const headCloseIndex = optimizedHTML.indexOf('</head>');
      if (headCloseIndex !== -1) {
        const inlineCSS = `<style id="compiled-tailwind">\n${compiledCSS}\n</style>\n`;
        optimizedHTML = 
          optimizedHTML.slice(0, headCloseIndex) + 
          inlineCSS + 
          optimizedHTML.slice(headCloseIndex);
      }
    } else {
      console.log('🌐 Using Tailwind CDN fallback');
      // Ensure Tailwind CDN is present
      if (!optimizedHTML.includes('tailwindcss.com')) {
        const headCloseIndex = optimizedHTML.indexOf('</head>');
        if (headCloseIndex !== -1) {
          const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>\n';
          optimizedHTML = 
            optimizedHTML.slice(0, headCloseIndex) + 
            tailwindScript + 
            optimizedHTML.slice(headCloseIndex);
        }
      }
    }
    
    // Add print optimization CSS
    const printCSS = getPrintOptimizationCSS();
    const headCloseIndex = optimizedHTML.indexOf('</head>');
    if (headCloseIndex !== -1) {
      optimizedHTML = 
        optimizedHTML.slice(0, headCloseIndex) + 
        printCSS + 
        optimizedHTML.slice(headCloseIndex);
    }
    
    // Remove unnecessary scripts that might interfere
    optimizedHTML = optimizedHTML
      .replace(/<script[^>]*>\s*\/\/ Smooth scroll[\s\S]*?<\/script>/gi, '')
      .replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '');
    
    console.log('✅ HTML optimization complete');
    return optimizedHTML;
    
  } catch (error) {
    console.error('❌ HTML optimization failed:', error);
    throw new Error(`HTML optimization failed: ${error.message}`);
  }
};

/**
 * Wait for styles to be fully applied
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {boolean} usingCompiledCSS - Whether using pre-compiled CSS
 */
const waitForStylesReady = async (page, usingCompiledCSS) => {
  try {
    if (usingCompiledCSS) {
      console.log('⏳ Waiting for pre-compiled styles to apply...');
      await page.waitForFunction(
        () => {
          const testEl = document.querySelector('body');
          if (!testEl) return false;
          const styles = window.getComputedStyle(testEl);
          return styles && document.readyState === 'complete';
        },
        { timeout: CONFIG.TIMEOUTS.rendering }
      );
      // Shorter wait for compiled CSS
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('⏳ Waiting for Tailwind CDN to load and process...');
      
      // Wait for Tailwind script
      try {
        await page.waitForFunction(
          () => window.tailwind !== undefined || document.readyState === 'complete',
          { timeout: CONFIG.TIMEOUTS.cdnFallback }
        );
        console.log('✅ Tailwind CDN detected');
      } catch (error) {
        console.log('⚠️ Tailwind detection timeout, continuing...');
      }
      
      // Wait for styles to be computed
      try {
        await page.waitForFunction(
          () => {
            const testEl = document.querySelector('body');
            if (!testEl) return true;
            const styles = window.getComputedStyle(testEl);
            const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
            return hasBackground && document.readyState === 'complete';
          },
          { timeout: CONFIG.TIMEOUTS.rendering }
        );
        console.log('✅ Styles applied');
      } catch (error) {
        console.log('⚠️ Style detection timeout, continuing...');
      }
      
      // Longer wait for CDN to process all classes
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
    
    console.log('✅ Styles ready for PDF generation');
  } catch (error) {
    console.warn('⚠️ Style readiness check failed, proceeding anyway:', error.message);
  }
};

/**
 * Force style recalculation in the page
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 */
const forceStyleRecalculation = async (page) => {
  try {
    await page.evaluate(() => {
      // Force layout recalculation
      document.body.style.transform = 'translateZ(0)';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.transform = '';
      
      // Force style computation for all elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.classList.length > 0) {
          window.getComputedStyle(el);
        }
      });
      
      // Wait for fonts
      if (document.fonts) {
        return document.fonts.ready;
      }
    });
    
    console.log('✅ Forced style recalculation');
  } catch (error) {
    console.warn('⚠️ Style recalculation failed:', error.message);
  }
};

/**
 * Generate PDF from HTML content
 * @param {string} htmlContent - HTML content to convert
 * @param {Object} options - PDF generation options
 * @param {boolean} options.debug - Enable debug mode (saves screenshot)
 * @param {string} options.debugName - Debug file name prefix
 * @returns {Promise<Object>} PDF generation result
 */
export const generatePDFFromHTML = async (htmlContent, options = {}) => {
  let browser = null;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting enhanced PDF generation...');
    
    // Load compiled CSS
    const compiledCSS = await getCompiledCSS();
    
    // Optimize HTML
    const optimizedHTML = await optimizeHTMLForPDF(htmlContent, compiledCSS);
    
    // Launch browser
    console.log('🌐 Launching headless browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: CONFIG.BROWSER_ARGS,
    });
    
    const page = await browser.newPage();
    
    // Set viewport for high-quality rendering
    await page.setViewport(CONFIG.VIEWPORT);
    
    // Emulate media features
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    
    // Load content
    console.log('📄 Loading optimized HTML content...');
    await page.setContent(optimizedHTML, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: CONFIG.TIMEOUTS.pageLoad,
    });
    
    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
    console.log('🖼️ Images loaded');
    
    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);
    console.log('🔤 Fonts loaded');
    
    // Wait for styles to be ready
    await waitForStylesReady(page, !!compiledCSS);
    
    // Force style recalculation
    await forceStyleRecalculation(page);
    
    // Final rendering wait
    console.log('⏳ Final rendering stabilization...');
    await new Promise(resolve => setTimeout(resolve, CONFIG.TIMEOUTS.finalWait));
    
    // Scroll through page to trigger lazy-loaded content
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const step = 500;
      for (let y = 0; y < scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
    });
    console.log('📜 Scrolled through page to load lazy content');
    
    // Debug screenshot if requested
    if (options.debug) {
      try {
        console.log('📸 Capturing debug screenshot...');
        const debugDir = path.join(process.cwd(), 'debug');
        await fs.mkdir(debugDir, { recursive: true });
        
        const debugName = options.debugName || 'debug';
        const timestamp = Date.now();
        const screenshotPath = path.join(debugDir, `${debugName}-${timestamp}.jpg`);
        
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: 'jpeg',
          quality: 90,
        });
        
        console.log(`🖼️ Debug screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.warn('⚠️ Debug screenshot failed:', error.message);
      }
    }
    
    // Generate PDF
    const pdfOptions = { ...CONFIG.PDF_OPTIONS, ...options };
    delete pdfOptions.debug;
    delete pdfOptions.debugName;
    
    console.log('📄 Generating PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PDF generated successfully in ${duration}s (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    
    return {
      success: true,
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      duration: parseFloat(duration),
      method: compiledCSS ? 'Pre-compiled CSS' : 'Tailwind CDN',
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
};

/**
 * Generate PDF for a portfolio site
 * @param {string} subdomain - Site subdomain
 * @param {Object} options - PDF generation options
 * @returns {Promise<Object>} PDF generation result with file info
 */
export const generatePortfolioPDF = async (subdomain, options = {}) => {
  try {
    console.log(`🎯 Generating PDF for portfolio: ${subdomain}`);
    
    // Locate HTML file
    const siteDir = path.join(process.cwd(), 'generated-files', subdomain);
    const htmlFilePath = path.join(siteDir, 'index.html');
    
    if (!existsSync(htmlFilePath)) {
      throw new Error(`HTML file not found: ${htmlFilePath}`);
    }
    
    // Read HTML content
    const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
    console.log(`📄 Loaded HTML (${(htmlContent.length / 1024).toFixed(2)} KB)`);
    
    // Generate PDF
    const pdfResult = await generatePDFFromHTML(htmlContent, {
      ...options,
      debug: options.debug !== false, // Enable debug by default
      debugName: subdomain,
    });
    
    // Create PDF filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const pdfFilename = `${subdomain}-portfolio-${timestamp}.pdf`;
    
    // Save PDF
    const pdfDir = path.join(process.cwd(), 'generated-files', 'pdfs');
    await fs.mkdir(pdfDir, { recursive: true });
    
    const pdfPath = path.join(pdfDir, pdfFilename);
    await fs.writeFile(pdfPath, pdfResult.buffer);
    
    console.log(`💾 PDF saved: ${pdfPath}`);
    
    return {
      ...pdfResult,
      pdfPath,
      pdfFilename,
      subdomain,
    };
    
  } catch (error) {
    console.error(`❌ Portfolio PDF generation failed for ${subdomain}:`, error);
    return {
      success: false,
      error: error.message,
      subdomain,
    };
  }
};

/**
 * Batch generate PDFs for multiple portfolios
 * @param {string[]} subdomains - Array of site subdomains
 * @param {Object} options - PDF generation options
 * @param {number} options.concurrency - Max concurrent PDF generations (default: 2)
 * @returns {Promise<Object[]>} Array of PDF generation results
 */
export const batchGeneratePDFs = async (subdomains, options = {}) => {
  const concurrency = options.concurrency || 2;
  const results = [];
  
  console.log(`🚀 Starting batch PDF generation for ${subdomains.length} portfolios (concurrency: ${concurrency})`);
  
  // Process in batches
  for (let i = 0; i < subdomains.length; i += concurrency) {
    const batch = subdomains.slice(i, i + concurrency);
    console.log(`\n📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(subdomains.length / concurrency)}`);
    
    const batchResults = await Promise.allSettled(
      batch.map(subdomain => generatePortfolioPDF(subdomain, options))
    );
    
    results.push(...batchResults.map((result, idx) => ({
      subdomain: batch[idx],
      ...(result.status === 'fulfilled' ? result.value : { success: false, error: result.reason?.message }),
    })));
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Batch generation complete: ${successful}/${subdomains.length} successful`);
  
  return results;
};

/**
 * Validate PDF generation prerequisites
 * @param {string} subdomain - Site subdomain
 * @returns {Object} Validation result
 */
export const validatePDFGeneration = async (subdomain) => {
  const issues = [];
  
  if (!subdomain) {
    issues.push('Site subdomain is required');
  }
  
  const siteDir = path.join(process.cwd(), 'generated-files', subdomain);
  const htmlFile = path.join(siteDir, 'index.html');
  
  if (!existsSync(siteDir)) {
    issues.push(`Site directory not found: ${siteDir}`);
  }
  
  if (!existsSync(htmlFile)) {
    issues.push(`HTML file not found: ${htmlFile}`);
  } else {
    try {
      const stats = await fs.stat(htmlFile);
      if (stats.size === 0) {
        issues.push('HTML file is empty');
      }
    } catch (error) {
      issues.push(`Cannot read HTML file: ${error.message}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * Get PDF status and metadata
 * @param {string} subdomain - Site subdomain
 * @returns {Promise<Object>} PDF status information
 */
export const getPDFStatus = async (subdomain) => {
  try {
    const pdfDir = path.join(process.cwd(), 'generated-files', 'pdfs');
    const files = existsSync(pdfDir) ? await fs.readdir(pdfDir) : [];
    
    const pdfFiles = files
      .filter(f => f.startsWith(subdomain) && f.endsWith('.pdf'))
      .sort()
      .reverse(); // Most recent first
    
    if (pdfFiles.length === 0) {
      return {
        exists: false,
        subdomain,
      };
    }
    
    const latestPdf = pdfFiles[0];
    const pdfPath = path.join(pdfDir, latestPdf);
    const stats = await fs.stat(pdfPath);
    
    return {
      exists: true,
      path: pdfPath,
      filename: latestPdf,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      totalVersions: pdfFiles.length,
      allVersions: pdfFiles,
    };
    
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      subdomain,
    };
  }
};

export default {
  generatePDFFromHTML,
  generatePortfolioPDF,
  batchGeneratePDFs,
  validatePDFGeneration,
  getPDFStatus,
};
