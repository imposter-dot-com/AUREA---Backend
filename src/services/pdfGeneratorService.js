// /**
//  * PDF Generator Service
//  * 
//  * This service handles PDF generation from HTML content using Puppeteer.
//  * Converts portfolio HTML into downloadable PDF documents.
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
//     console.warn('⚠️ Could not load compiled CSS for basic PDF, using fallback approach');
//     return null;
//   }
// };

// /**
//  * Generates PDF from HTML content
//  * @param {string} htmlContent - The HTML content to convert to PDF
//  * @param {Object} options - PDF generation options
//  * @returns {Promise<Buffer>} PDF buffer
//  */
// export const generatePDFFromHTML = async (htmlContent, options = {}) => {
//   let browser = null;
  
//   try {
//     console.log('🚀 Starting PDF generation...');
    
//         // Launch browser with optimized settings for PDF generation
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-gpu',
//         '--no-first-run',
//         '--no-zygote',
//         '--single-process',
//         '--disable-extensions',
//         '--disable-background-timer-throttling',
//         '--disable-backgrounding-occluded-windows',
//         '--disable-renderer-backgrounding',
//         '--force-color-profile=srgb',
//         '--disable-features=VizDisplayCompositor'
//       ]
//     });

//     const page = await browser.newPage();
    
//     // Set viewport for consistent rendering
//     await page.setViewport({
//       width: 1200,
//       height: 800,
//       deviceScaleFactor: 2
//     });

//     // Optimize HTML for PDF rendering
//     const optimizedHTML = optimizeHTMLForPDF(htmlContent);

//     // Set HTML content
//     await page.setContent(optimizedHTML, {
//       waitUntil: ['networkidle0', 'domcontentloaded'],
//       timeout: 30000
//     });

//     // Wait for fonts and images to load
//     await page.evaluateHandle('document.fonts.ready');
    
//     // Wait for any animations or dynamic content to settle
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     // Generate PDF with enhanced options
//     const pdfOptions = {
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
//       ...options
//     };

//     console.log('📄 Generating PDF with options:', pdfOptions);
    
//     const pdfBuffer = await page.pdf(pdfOptions);
    
//     console.log(`✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);
    
//     return pdfBuffer;

//   } catch (error) {
//     console.error('❌ PDF generation failed:', error);
//     throw new Error(`PDF generation failed: ${error.message}`);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

// /**
//  * Saves PDF buffer to file
//  * @param {Buffer} pdfBuffer - PDF buffer
//  * @param {string} filename - Output filename
//  * @param {string} outputDir - Output directory (optional)
//  * @returns {Promise<string>} File path of saved PDF
//  */
// export const savePDFToFile = async (pdfBuffer, filename, outputDir = null) => {
//   try {
//     const dir = outputDir || path.join(process.cwd(), 'generated-files', 'pdfs');
    
//     // Ensure directory exists
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }

//     const filePath = path.join(dir, filename);
    
//     await fs.promises.writeFile(filePath, pdfBuffer);
    
//     console.log(`💾 PDF saved to: ${filePath}`);
    
//     return filePath;

//   } catch (error) {
//     console.error('❌ Failed to save PDF:', error);
//     throw new Error(`Failed to save PDF: ${error.message}`);
//   }
// };

// /**
//  * Generates PDF from portfolio site
//  * @param {string} siteSubdomain - Site subdomain
//  * @param {Object} options - PDF options
//  * @returns {Promise<Object>} PDF generation result
//  */
// export const generatePortfolioPDF = async (siteSubdomain, options = {}) => {
//   try {
//     // Read the generated HTML file
//     const siteDir = path.join(process.cwd(), 'generated-files', siteSubdomain);
//     const htmlFile = path.join(siteDir, 'index.html');

//     if (!fs.existsSync(htmlFile)) {
//       throw new Error(`HTML file not found for site: ${siteSubdomain}`);
//     }

//     const htmlContent = await fs.promises.readFile(htmlFile, 'utf8');
    
//     // Generate PDF
//     const pdfBuffer = await generatePDFFromHTML(htmlContent, options);
    
//     // Save PDF
//     const pdfFilename = `${siteSubdomain}-portfolio.pdf`;
//     const pdfPath = await savePDFToFile(pdfBuffer, pdfFilename);
    
//     return {
//       success: true,
//       pdfPath,
//       pdfFilename,
//       size: pdfBuffer.length,
//       buffer: pdfBuffer
//     };

//   } catch (error) {
//     console.error('❌ Portfolio PDF generation failed:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };

// /**
//  * Optimizes HTML for PDF generation
//  * @param {string} htmlContent - Original HTML content
//  * @returns {string} Optimized HTML for PDF
//  */
// export const optimizeHTMLForPDF = (htmlContent) => {
//   const compiledCSS = getCompiledCSS();
  
//   if (compiledCSS) {
//     console.log('🎨 Using pre-compiled Tailwind CSS for basic PDF generation');
    
//     // Remove any existing Tailwind CDN references
//     let optimizedHTML = htmlContent.replace(/<script[^>]*tailwindcss[^>]*><\/script>/gi, '');
    
//     // Add compiled CSS to head
//     const headInsertPoint = optimizedHTML.indexOf('</head>');
//     if (headInsertPoint !== -1) {
//       const inlineCSS = `<style>\n${compiledCSS}\n</style>\n`;
//       optimizedHTML = optimizedHTML.slice(0, headInsertPoint) + inlineCSS + optimizedHTML.slice(headInsertPoint);
//     }
    
//     return optimizedHTML;
//   }
  
//   console.log('🌐 Using fallback CSS approach for basic PDF generation');
  
//   // Fallback: Remove Tailwind CDN and config scripts, add basic PDF optimizations
//   let optimizedHTML = htmlContent
//     .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/gi, '')
//     .replace(/<script>\s*tailwind\.config\s*=\s*{[\s\S]*?}<\/script>/gi, '')
//     .replace(/<script(?:\s[^>]*)?>\s*\/\/ Smooth scroll[\s\S]*?<\/script>/gi, '');

//   // Add basic CSS optimizations for PDF
//   const basicPDFStyles = `
//     <style>
//       @media print {
//         body {
//           -webkit-print-color-adjust: exact !important;
//           color-adjust: exact !important;
//           print-color-adjust: exact !important;
//           margin: 0 !important;
//           padding: 0 !important;
//         }
        
//         *, *::before, *::after {
//           animation-duration: 0s !important;
//           animation-delay: 0s !important;
//           transition-duration: 0s !important;
//           transition-delay: 0s !important;
//         }
//       }
//     </style>
//   `;

//   const headInsertPoint = optimizedHTML.indexOf('</head>');
//   if (headInsertPoint !== -1) {
//     optimizedHTML = optimizedHTML.slice(0, headInsertPoint) + basicPDFStyles + optimizedHTML.slice(headInsertPoint);
//   }
  
//   return optimizedHTML;
// };

// /**
//  * Validates PDF generation prerequisites
//  * @param {string} siteSubdomain - Site subdomain to validate
//  * @returns {Object} Validation result
//  */
// export const validatePDFGeneration = (siteSubdomain) => {
//   const issues = [];
  
//   if (!siteSubdomain) {
//     issues.push('Site subdomain is required');
//   }
  
//   const siteDir = path.join(process.cwd(), 'generated-files', siteSubdomain);
//   const htmlFile = path.join(siteDir, 'index.html');
  
//   if (!fs.existsSync(siteDir)) {
//     issues.push(`Site directory not found: ${siteDir}`);
//   }
  
//   if (!fs.existsSync(htmlFile)) {
//     issues.push(`HTML file not found: ${htmlFile}`);
//   }
  
//   return {
//     isValid: issues.length === 0,
//     issues
//   };
// };

// /**
//  * Gets PDF generation status
//  * @param {string} siteSubdomain - Site subdomain
//  * @returns {Object} PDF status information
//  */
// export const getPDFStatus = (siteSubdomain) => {
//   try {
//     const pdfDir = path.join(process.cwd(), 'generated-files', 'pdfs');
//     const pdfFile = path.join(pdfDir, `${siteSubdomain}-portfolio.pdf`);
    
//     if (fs.existsSync(pdfFile)) {
//       const stats = fs.statSync(pdfFile);
//       return {
//         exists: true,
//         path: pdfFile,
//         size: stats.size,
//         createdAt: stats.birthtime,
//         modifiedAt: stats.mtime
//       };
//     }
    
//     return {
//       exists: false,
//       path: pdfFile
//     };
    
//   } catch (error) {
//     return {
//       exists: false,
//       error: error.message
//     };
//   }
// };