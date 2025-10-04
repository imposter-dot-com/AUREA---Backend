/**
 * PDF Service Test Script
 * 
 * Comprehensive test script for PDF generation functionality
 * Tests both direct service calls and HTTP API endpoints
 * Supports testing with remote URLs (e.g., Vercel deployments)
 * 
 * Usage: 
 *   node test/test-pdf-service.js                                      # Auto-detect available portfolios
 *   node test/test-pdf-service.js <subdomain>                          # Test specific portfolio
 *   node test/test-pdf-service.js <subdomain> --api                    # Test via API endpoints
 *   node test/test-pdf-service.js --url https://example.vercel.app     # Test from remote URL
 */

import { generatePDFFromHTML, validatePDFGeneration, getPDFStatus, generatePortfolioPDF } from '../src/services/pdfService.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'user2@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || '123456';
const DEFAULT_REMOTE_URL = 'https://more-is-coming-portfolio.vercel.app';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Wait for server to be ready
 */
async function waitForServer(maxAttempts = 10) {
  log.info('Checking server status...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { 
        timeout: 5000 
      });
      if (response.ok) {
        const data = await response.json();
        log.success('Server is ready!');
        log.info(`  Environment: ${data.environment}`);
        return true;
      }
    } catch (error) {
      log.warn(`Attempt ${i + 1}/${maxAttempts} - waiting for server...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Server not ready after maximum attempts');
}

/**
 * Authenticate user and get token
 */
async function authenticateUser() {
  log.info('Authenticating user...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Authentication failed: ${error.message}`);
    }

    const data = await response.json();
    log.success('Authentication successful');
    
    if (data.data && data.data.user) {
      log.info(`  User: ${data.data.user.name} (${data.data.user.email})`);
    }
    
    return data.data.token;
  } catch (error) {
    log.error(`Authentication failed: ${error.message}`);
    throw error;
  }
}

/**
 * Find available portfolios
 */
async function findAvailablePortfolios() {
  log.info('Scanning for available portfolios...');
  
  const generatedFilesPath = path.join(process.cwd(), 'generated-files');
  
  if (!fs.existsSync(generatedFilesPath)) {
    log.warn('No generated-files directory found');
    return [];
  }
  
  const items = fs.readdirSync(generatedFilesPath);
  const portfolios = items.filter(item => {
    const itemPath = path.join(generatedFilesPath, item);
    const htmlPath = path.join(itemPath, 'index.html');
    return fs.statSync(itemPath).isDirectory() && 
           fs.existsSync(htmlPath) &&
           item !== 'pdfs' && 
           item !== 'debug';
  });
  
  if (portfolios.length > 0) {
    log.success(`Found ${portfolios.length} portfolio(s):`);
    portfolios.forEach(p => log.info(`  • ${p}`));
  } else {
    log.warn('No portfolios found');
  }
  
  return portfolios;
}

/**
 * Fetch HTML from remote URL
 */
async function fetchRemoteHTML(url) {
  log.info(`Fetching HTML from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    log.success(`Fetched HTML (${(html.length / 1024).toFixed(2)} KB)`);
    
    return html;
  } catch (error) {
    log.error(`Failed to fetch remote HTML: ${error.message}`);
    throw error;
  }
}

/**
 * Test PDF generation from remote URL
 */
async function testPDFGenerationFromURL(url) {
  try {
    log.section(`Testing PDF Generation from Remote URL`);
    log.info(`Source: ${url}`);
    
    // Step 1: Fetch HTML
    log.info('Step 1: Fetching HTML from remote URL...');
    const htmlContent = await fetchRemoteHTML(url);
    
    // Step 2: Generate PDF
    log.info('Step 2: Generating PDF from fetched HTML...');
    const startTime = Date.now();
    
    const result = await generatePDFFromHTML(htmlContent, {
      debug: true,
      debugName: 'remote-url',
      format: 'A4',
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!result.success) {
      log.error(`PDF generation failed: ${result.error}`);
      return false;
    }
    
    log.success('PDF generated successfully from remote URL!');
    log.info(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
    log.info(`  Duration: ${result.duration}s (total: ${duration}s)`);
    log.info(`  Method: ${result.method}`);
    
    // Step 3: Save PDF
    log.info('Step 3: Saving PDF to disk...');
    const testDir = path.join(process.cwd(), 'test', 'downloads');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const urlParts = new URL(url);
    const hostname = urlParts.hostname.replace(/\./g, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const pdfPath = path.join(testDir, `${hostname}-${timestamp}.pdf`);
    
    fs.writeFileSync(pdfPath, result.buffer);
    
    log.success('PDF saved successfully!');
    log.info(`  Path: ${pdfPath}`);
    
    // Verify file
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      log.success(`  Verified on disk (${(stats.size / 1024).toFixed(2)} KB)`);
    }
    
    log.section('✅ Remote URL test passed!');
    return true;
    
  } catch (error) {
    log.error(`Test failed with error: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test PDF generation via API
 */
async function testPDFGenerationAPI(subdomain, token) {
  try {
    log.section(`Testing PDF Generation via API: ${subdomain}`);
    
    // Step 1: Check status before generation
    log.info('Step 1: Checking PDF status via API...');
    const statusResponse = await fetch(`${BASE_URL}/api/pdf/status/${subdomain}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      if (statusData.data.exists) {
        log.warn(`Found existing PDF: ${statusData.data.filename}`);
        log.info(`  Size: ${(statusData.data.size / 1024).toFixed(2)} KB`);
      } else {
        log.info('No existing PDF found');
      }
    }
    
    // Step 2: Generate PDF via API
    log.info('Step 2: Generating PDF via API...');
    const startTime = Date.now();
    
    const generateResponse = await fetch(`${BASE_URL}/api/pdf/generate/${subdomain}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debug: true,
        format: 'A4',
      }),
    });
    
    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      throw new Error(`API call failed: ${error.error}`);
    }
    
    const result = await generateResponse.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.success('PDF generated via API!');
    log.info(`  Filename: ${result.data.filename}`);
    log.info(`  Size: ${(result.data.size / 1024).toFixed(2)} KB`);
    log.info(`  Server Duration: ${result.data.duration}s`);
    log.info(`  Total Duration: ${duration}s`);
    log.info(`  Method: ${result.data.method}`);
    
    // Step 3: Download PDF
    log.info('Step 3: Testing PDF download...');
    const downloadResponse = await fetch(`${BASE_URL}/api/pdf/download/${subdomain}`);
    
    if (!downloadResponse.ok) {
      throw new Error('PDF download failed');
    }
    
    const pdfBuffer = await downloadResponse.buffer();
    
    // Save to test directory
    const testDir = path.join(process.cwd(), 'test', 'downloads');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const downloadPath = path.join(testDir, `${subdomain}-api-test-${timestamp}.pdf`);
    fs.writeFileSync(downloadPath, pdfBuffer);
    
    log.success('PDF downloaded successfully!');
    log.info(`  Downloaded size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    log.info(`  Saved to: ${downloadPath}`);
    
    log.section('✅ API test passed!');
    return true;
    
  } catch (error) {
    log.error(`API test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test PDF generation directly via service
 */
async function testPDFGenerationDirect(subdomain) {
  try {
    log.section(`Testing PDF Generation (Direct Service): ${subdomain}`);
    
    // Step 1: Validation
    log.info('Step 1: Validating prerequisites...');
    const validation = await validatePDFGeneration(subdomain);
    
    if (!validation.isValid) {
      log.error('Validation failed!');
      validation.issues.forEach(issue => log.error(`  - ${issue}`));
      return false;
    }
    
    log.success('Validation passed');
    
    // Step 2: Check existing PDF
    log.info('Step 2: Checking for existing PDF...');
    const existingStatus = await getPDFStatus(subdomain);
    
    if (existingStatus.exists) {
      log.warn(`Found existing PDF: ${existingStatus.filename}`);
      log.info(`  Size: ${(existingStatus.size / 1024).toFixed(2)} KB`);
      log.info(`  Created: ${existingStatus.createdAt}`);
      log.info(`  Total versions: ${existingStatus.totalVersions}`);
    } else {
      log.info('No existing PDF found');
    }
    
    // Step 3: Generate PDF
    log.info('Step 3: Generating PDF with debug enabled...');
    const startTime = Date.now();
    
    const result = await generatePortfolioPDF(subdomain, {
      debug: true,
      format: 'A4',
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!result.success) {
      log.error(`PDF generation failed: ${result.error}`);
      return false;
    }
    
    log.success('PDF generated successfully!');
    log.info(`  Filename: ${result.pdfFilename}`);
    log.info(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
    log.info(`  Duration: ${result.duration}s (total: ${duration}s)`);
    log.info(`  Method: ${result.method}`);
    log.info(`  Path: ${result.pdfPath}`);
    
    // Step 4: Verify new PDF
    log.info('Step 4: Verifying generated PDF...');
    const newStatus = await getPDFStatus(subdomain);
    
    if (newStatus.exists) {
      log.success('PDF verified successfully');
      log.info(`  New total versions: ${newStatus.totalVersions}`);
      
      // Verify file actually exists on disk
      if (fs.existsSync(result.pdfPath)) {
        const stats = fs.statSync(result.pdfPath);
        log.success(`  File exists on disk (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        log.error('  File not found on disk!');
        return false;
      }
    } else {
      log.error('PDF verification failed - file not found');
      return false;
    }
    
    log.section('✅ Direct service test passed!');
    return true;
    
  } catch (error) {
    log.error(`Test failed with error: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗
║   AUREA PDF Service Test Suite      ║
╚═══════════════════════════════════════╝${colors.reset}
  `);
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const useAPI = args.includes('--api');
    const urlIndex = args.indexOf('--url');
    const remoteURL = urlIndex !== -1 ? args[urlIndex + 1] : null;
    let subdomain = args.find(arg => !arg.startsWith('--') && arg !== remoteURL);
    
    // Test from remote URL
    if (remoteURL || (!subdomain && !useAPI)) {
      const url = remoteURL || DEFAULT_REMOTE_URL;
      log.info(`Testing with remote URL mode`);
      log.info(`URL: ${url}`);
      
      const success = await testPDFGenerationFromURL(url);
      
      console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}\n`);
      
      if (success) {
        log.success('Test suite completed successfully!');
        log.info('\n📚 Next steps:');
        log.info(`  • View PDF: test/downloads/*.pdf`);
        log.info(`  • Debug screenshot: debug/remote-url-*.jpg`);
        log.info(`  • Test another URL: node test/test-pdf-service.js --url https://example.com`);
        process.exit(0);
      } else {
        log.error('Test suite failed!');
        log.info('\n🔧 Troubleshooting:');
        log.info('  1. Check that the URL is accessible');
        log.info('  2. Ensure Puppeteer is installed: npm install');
        log.info('  3. Check if the page has Tailwind CSS');
        process.exit(1);
      }
    }
    
    // Auto-detect portfolios if no subdomain provided
    if (!subdomain) {
      log.info('No subdomain provided, scanning for available portfolios...');
      const portfolios = await findAvailablePortfolios();
      
      if (portfolios.length === 0) {
        log.error('No portfolios found!');
        log.info('\n💡 Tips:');
        log.info('  1. Make sure you have published portfolios');
        log.info('  2. Run: node test/test-publish-flow.js');
        log.info('  3. Or specify a subdomain: node test/test-pdf-service.js <subdomain>');
        log.info('  4. Or test a remote URL: node test/test-pdf-service.js --url https://example.com');
        process.exit(1);
      }
      
      subdomain = portfolios[0];
      log.success(`Auto-selected: ${subdomain}`);
      
      if (portfolios.length > 1) {
        log.info(`\n📋 Other available portfolios:`);
        portfolios.slice(1).forEach(p => log.info(`  • ${p}`));
      }
    }
    
    // Run appropriate test
    let success;
    
    if (useAPI) {
      // API test requires server and authentication
      log.section('Testing via API (requires running server)');
      await waitForServer();
      const token = await authenticateUser();
      success = await testPDFGenerationAPI(subdomain, token);
    } else {
      // Direct service test
      log.section('Testing via Direct Service');
      success = await testPDFGenerationDirect(subdomain);
    }
    
    console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}\n`);
    
    if (success) {
      log.success('Test suite completed successfully!');
      log.info('\n📚 Next steps:');
      log.info(`  • View PDF: generated-files/pdfs/${subdomain}-portfolio-*.pdf`);
      log.info(`  • Debug screenshot: debug/${subdomain}-*.jpg`);
      if (!useAPI) {
        log.info(`  • Test API: node test/test-pdf-service.js ${subdomain} --api`);
      }
      log.info(`  • Test remote URL: node test/test-pdf-service.js --url ${DEFAULT_REMOTE_URL}`);
      log.info(`  • Download: curl ${BASE_URL}/api/pdf/download/${subdomain} -o test.pdf`);
      process.exit(0);
    } else {
      log.error('Test suite failed!');
      log.info('\n🔧 Troubleshooting:');
      log.info('  1. Check that the portfolio exists in generated-files/');
      log.info('  2. Ensure Puppeteer is installed: npm install');
      log.info('  3. Check server logs for detailed error messages');
      if (useAPI) {
        log.info('  4. Make sure server is running: npm run dev');
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`\n${colors.bright}═══════════════════════════════════════${colors.reset}\n`);
    log.error(`Fatal error: ${error.message}`);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
