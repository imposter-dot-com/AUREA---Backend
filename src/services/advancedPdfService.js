// /**
//  * Advanced PDF Generator Service with Browser-Based Tailwind Rendering
//  * 
//  * This service uses Puppeteer to render HTML with Tailwind CDN in a real browser,
//  * ensuring perfect CSS compatibility and rendering fidelity.
//  */

// import puppeteer from 'puppeteer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load pre-compiled Tailwind CSS
// const getCompiledCSS = () => {
//   try {
//     const cssPath = path.join(process.cwd(), 'dist', 'output.css');
//     return fs.readFileSync(cssPath, 'utf8');
//   } catch (error) {
//     console.warn('⚠️ Could not load compiled CSS, falling back to CDN approach');
//     return null;
//   }
// };

// /**
//  * Optimizes HTML for better PDF rendering
//  * @param {string} htmlContent - Original HTML content
//  * @returns {string} Optimized HTML for PDF
//  */
// export const optimizeHTMLForPDFAdvanced = async (htmlContent) => {
//   try {
//     console.log('🔄 Optimizing HTML for advanced PDF...');
    
//     let optimizedHTML = htmlContent;
//     const compiledCSS = getCompiledCSS();
    
//     if (compiledCSS) {
//       console.log('🎨 Using pre-compiled Tailwind CSS for pixel-perfect rendering');
      
//       // Remove any existing Tailwind CDN references
//       optimizedHTML = optimizedHTML.replace(/<script[^>]*tailwindcss[^>]*><\/script>/gi, '');
      
//       // Add compiled CSS to head
//       const headInsertPoint = optimizedHTML.indexOf('</head>');
//       if (headInsertPoint !== -1) {
//         const inlineCSS = `<style>\n${compiledCSS}\n</style>\n`;
//         optimizedHTML = optimizedHTML.slice(0, headInsertPoint) + inlineCSS + optimizedHTML.slice(headInsertPoint);
//       }
//     } else {
//       console.log('🌐 Falling back to CDN approach');
//       // Ensure Tailwind CDN is included (fallback)
//       if (!optimizedHTML.includes('tailwindcss.com')) {
//         const headInsertPoint = optimizedHTML.indexOf('</head>');
//         if (headInsertPoint !== -1) {
//           const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>\n';
//           optimizedHTML = optimizedHTML.slice(0, headInsertPoint) + tailwindScript + optimizedHTML.slice(headInsertPoint);
//         }
//       }
//     }
    
//     // Add enhanced print styles
//     const printOptimizations = `
//       <style>
//         /* Force Tailwind to be applied */
//         html, body {
//           -webkit-print-color-adjust: exact !important;
//           color-adjust: exact !important;
//           print-color-adjust: exact !important;
//         }
        
//         /* Ensure all elements retain their visual properties */
//         * {
//           -webkit-print-color-adjust: exact !important;
//           color-adjust: exact !important;
//           print-color-adjust: exact !important;
//           box-decoration-break: clone !important;
//         }
        
//         /* Force background images and gradients to print */
//         .bg-gradient-to-br,
//         .bg-gradient-to-r,
//         .bg-gradient-to-b,
//         [class*="bg-gradient"] {
//           -webkit-print-color-adjust: exact !important;
//           color-adjust: exact !important;
//           print-color-adjust: exact !important;
//           background-attachment: local !important;
//         }
        
//         @media screen {
//           /* Ensure styles are visible on screen too */
//           * {
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//         }
        
//         @media print {
//           * {
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
          
//           body {
//             margin: 0 !important;
//             padding: 0 !important;
//           }
          
//           /* Disable animations for PDF but keep final state */
//           *, *::before, *::after {
//             animation-duration: 0s !important;
//             animation-delay: 0s !important;
//             transition-duration: 0s !important;
//             transition-delay: 0s !important;
//           }
          
//           /* Fix animated elements - show them but static */
//           .animate-blob,
//           .animate-blob-delay-2,
//           .animate-blob-delay-4 {
//             animation: none !important;
//             opacity: 0.4 !important;
//             transform: scale(1) !important;
//           }
          
//           .animate-pulse,
//           .animate-bounce,
//           .animate-spin {
//             animation: none !important;
//             opacity: 1 !important;
//             transform: none !important;
//           }
          
//           /* Ensure gradients work */
//           .bg-gradient-to-r,
//           .bg-gradient-to-br,
//           .bg-gradient-to-b {
//             background-image: var(--tw-gradient-stops) !important;
//           }
          
//           /* Page break optimizations */
//           section {
//             break-inside: avoid;
//             margin-bottom: 2rem;
//           }
          
//           /* Grid and layout fixes */
//           .masonry-grid {
//             display: block !important;
//             columns: 2;
//             column-gap: 2rem;
//           }
          
//           .masonry-grid > * {
//             break-inside: avoid;
//             margin-bottom: 2rem;
//           }
          
//           /* Ensure proper scaling for PDF */
//           .container {
//             max-width: none !important;
//             width: 100% !important;
//           }
          
//           /* Force backdrop filters to work */
//           .backdrop-blur-sm {
//             backdrop-filter: blur(4px) !important;
//             -webkit-backdrop-filter: blur(4px) !important;
//           }
//         }
        
//         /* Enhanced blob animations for PDF */
//         @keyframes blob {
//           0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
//           50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.3; }
//         }
        
//         /* Ensure text gradients work */
//         .bg-clip-text {
//           -webkit-background-clip: text !important;
//           background-clip: text !important;
//           -webkit-text-fill-color: transparent !important;
//         }
//       </style>
//     `;
    
//     // Insert print optimizations
//     const headCloseIndex = optimizedHTML.indexOf('</head>');
//     if (headCloseIndex !== -1) {
//       optimizedHTML = optimizedHTML.slice(0, headCloseIndex) + printOptimizations + optimizedHTML.slice(headCloseIndex);
//     }
    
//     console.log('✅ HTML optimized for advanced PDF generation');
//     return optimizedHTML;
    
//   } catch (error) {
//     console.error('❌ HTML optimization failed:', error);
//     throw new Error(`HTML optimization failed: ${error.message}`);
//   }
// };

// /**
//  * Generates PDF from HTML using advanced browser-based rendering
//  * @param {string} htmlContent - HTML content to convert
//  * @param {Object} options - PDF generation options
//  * @returns {Promise<Object>} PDF generation result
//  */
// export const generateAdvancedPDFFromHTML = async (htmlContent, options = {}) => {
//   let browser = null;
  
//   try {
//     console.log('🚀 Starting advanced PDF generation with browser rendering...');
    
//     // Optimize HTML for PDF
//     const optimizedHTML = await optimizeHTMLForPDFAdvanced(htmlContent);
    
//     // Launch browser with optimized settings
//     browser = await puppeteer.launch({
//       headless: 'new',
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-gpu',
//         '--disable-extensions',
//         '--disable-plugins',
//         '--disable-background-timer-throttling',
//         '--disable-backgrounding-occluded-windows',
//         '--disable-renderer-backgrounding'
//       ]
//     });
    
//     console.log('🌐 Browser launched, creating page...');
//     const page = await browser.newPage();
    
//     // Set viewport for consistent rendering - match common desktop sizes
//     await page.setViewport({
//       width: 1920,
//       height: 1080,
//       deviceScaleFactor: 1 // Use 1 for better PDF quality
//     });
    
//     // Emulate media features for better CSS matching
//     await page.emulateMediaFeatures([
//       { name: 'prefers-color-scheme', value: 'dark' },
//       { name: 'prefers-reduced-motion', value: 'no-preference' }
//     ]);
    
//     // Set content and wait for DOM to be ready
//     console.log('📄 Loading HTML content...');
//     await page.setContent(optimizedHTML, { 
//       waitUntil: ['domcontentloaded'],
//       timeout: 15000 
//     });
    
//     // Check if we're using pre-compiled CSS or CDN
//     const compiledCSS = getCompiledCSS();
    
//     if (compiledCSS) {
//       console.log('🎨 Using pre-compiled CSS - minimal wait needed...');
//       // With pre-compiled CSS, we only need to wait for DOM to be ready
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     } else {
//       console.log('� Using CDN approach - waiting for Tailwind to load...');
      
//       // Wait for Tailwind script to load (CDN approach)
//       try {
//         await page.waitForFunction(() => {
//           return window.tailwind !== undefined || document.readyState === 'complete';
//         }, { timeout: 8000 });
//         console.log('✅ Tailwind script detected');
//       } catch (error) {
//         console.log('⚠️ Tailwind script detection timeout, continuing...');
//       }
      
//       // Wait for styles to be applied (CDN approach)
//       try {
//         await page.waitForFunction(() => {
//           const testElement = document.querySelector('body');
//           if (!testElement) return true;
          
//           const styles = window.getComputedStyle(testElement);
//           return styles && document.readyState === 'complete';
//         }, { timeout: 5000 });
//         console.log('✅ Basic styles detected');
//       } catch (error) {
//         console.log('⚠️ Style application detection timeout, continuing...');
//       }
      
//       // Give Tailwind time to process all classes (CDN approach)
//       console.log('⏳ Waiting longer for Tailwind to fully process all classes...');
//       await new Promise(resolve => setTimeout(resolve, 6000));
//     }
    
//     // Force a style recalculation to ensure everything is applied
//     await page.evaluate(() => {
//       // Force style recalculation
//       document.body.style.transform = 'translateZ(0)';
//       document.body.offsetHeight; // trigger reflow
//       document.body.style.transform = '';
      
//       // Trigger any lazy-loaded styles
//       const allElements = document.querySelectorAll('*');
//       allElements.forEach(el => {
//         if (el.classList.length > 0) {
//           // Force style computation
//           window.getComputedStyle(el);
//         }
//       });
//     });
    
//     // Short final wait for any final rendering
//     console.log('⏳ Final rendering wait...');
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     // Debug: Take screenshot to verify visual rendering
//     console.log('📸 Taking debug screenshot to verify rendering...');
//     const screenshotBuffer = await page.screenshot({ 
//       fullPage: true,
//       quality: 90,
//       type: 'jpeg'
//     });
    
//     // Save debug screenshot
//     const debugDir = path.join(process.cwd(), 'debug');
//     if (!fs.existsSync(debugDir)) {
//       fs.mkdirSync(debugDir);
//     }
//     const debugScreenshotPath = path.join(debugDir, `debug-screenshot-${Date.now()}.jpg`);
//     fs.writeFileSync(debugScreenshotPath, screenshotBuffer);
//     console.log(`🖼️ Debug screenshot saved: ${debugScreenshotPath}`);
    
//     // Default PDF options
//     const defaultOptions = {
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: false,
//       displayHeaderFooter: false,
//       margin: {
//         top: '0.5in',
//         right: '0.5in',
//         bottom: '0.5in',
//         left: '0.5in'
//       },
//       // Add these for better quality
//       scale: 1,
//       landscape: false,
//       pageRanges: '',
//       tagged: false,
//       outline: false
//     };
    
//     const pdfOptions = { ...defaultOptions, ...options };
    
//     console.log('📄 Generating PDF with options:', pdfOptions);
    
//     // Generate PDF
//     const pdfBuffer = await page.pdf(pdfOptions);
    
//     console.log('✅ Advanced PDF generated successfully!');
    
//     return {
//       success: true,
//       buffer: pdfBuffer,
//       size: pdfBuffer.length,
//       method: 'Advanced Browser Rendering',
//       optimizations: [
//         'Browser-based Tailwind rendering',
//         'Enhanced print CSS',
//         'Animation optimization',
//         'Layout fixes for PDF',
//         'High-resolution rendering'
//       ]
//     };
    
//   } catch (error) {
//     console.error('❌ Advanced PDF generation failed:', error);
//     throw new Error(`Advanced PDF generation failed: ${error.message}`);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

// /**
//  * Generates PDF for a published portfolio site using advanced rendering
//  * @param {string} subdomain - Site subdomain
//  * @param {Object} options - PDF options
//  * @returns {Promise<Object>} PDF generation result
//  */
// export const generateAdvancedPortfolioPDF = async (subdomain, options = {}) => {
//   try {
//     console.log(`🎯 Starting advanced PDF generation for: ${subdomain}`);
    
//     // Read the HTML file
//     const generatedFilesDir = path.join(process.cwd(), 'generated-files');
//     const siteDir = path.join(generatedFilesDir, subdomain);
//     const htmlFilePath = path.join(siteDir, 'index.html');
    
//     if (!fs.existsSync(htmlFilePath)) {
//       throw new Error(`HTML file not found: ${htmlFilePath}`);
//     }
    
//     const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
//     console.log(`📄 Read HTML file: ${htmlFilePath} (${(htmlContent.length / 1024).toFixed(2)} KB)`);
    
//     // Generate PDF using advanced method
//     const pdfResult = await generateAdvancedPDFFromHTML(htmlContent, options);
    
//     // Create filename
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const pdfFilename = `${subdomain}-advanced-${timestamp}.pdf`;
    
//     return {
//       ...pdfResult,
//       pdfFilename,
//       subdomain,
//       timestamp
//     };
    
//   } catch (error) {
//     console.error(`❌ Advanced portfolio PDF generation failed for ${subdomain}:`, error);
//     return {
//       success: false,
//       error: error.message,
//       subdomain
//     };
//   }
// };