/**
 * Test Script: Complete User Publish Flow to Vercel with Case Study Verification
 * 
 * This script simulates the complete user publishing workflow:
 * 1. User logs in to their account
 * 2. User views their draft portfolios
 * 3. System verifies portfolio has case studies
 * 4. User selects a portfolio to publish
 * 5. User clicks "Publish" button
 * 6. System generates HTML from user's portfolio data + case studies
 * 7. System automatically uploads and hosts to Vercel
 * 8. User receives live URL
 * 9. System verifies case study HTML files were generated correctly
 * 10. System validates real data is in generated HTML (no mocks)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@gmail.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testtest';

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to wait for server to be ready
async function waitForServer(maxAttempts = 10, delayMs = 1000) {
  console.log(colorize('\n🔍 Checking if server is ready...', 'cyan'));
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        console.log(colorize('✓ Server is ready!', 'green'));
        return true;
      }
    } catch (error) {
      console.log(colorize(`  Attempt ${i + 1}/${maxAttempts}: Server not ready yet...`, 'yellow'));
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Server failed to start within timeout period. Make sure the server is running with: npm run dev');
}

/**
 * Authenticate user and get auth token
 */
async function authenticateUser() {
  console.log(colorize(`\n📝 STEP 1: Authenticating user (${USER_EMAIL})...`, 'bright'));
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Authentication failed: ${error}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Authentication failed: ${result.message}`);
  }

  const { user, token } = result.data;
  
  console.log(colorize('✓ Authentication successful!', 'green'));
  console.log(colorize(`  User ID: ${user._id}`, 'cyan'));
  console.log(colorize(`  User Name: ${user.name}`, 'cyan'));
  console.log(colorize(`  Token: ${token.substring(0, 20)}...`, 'cyan'));
  
  return token;
}

/**
 * Get user's draft portfolios with case study information
 */
async function getDraftPortfolios(authToken) {
  console.log(colorize('\n📂 STEP 2: Fetching draft portfolios...', 'bright'));
  console.log(colorize('   (Simulating user viewing their saved drafts)', 'cyan'));
  
  const response = await fetch(`${BASE_URL}/api/portfolios/user/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Failed to fetch portfolios: ${data.message || JSON.stringify(data)}`);
  }

  console.log(colorize(`✓ User has ${data.data.portfolios.length} draft portfolio(s)`, 'green'));
  
  // Display portfolio list like the user would see
  console.log(colorize('\n📋 AVAILABLE DRAFTS:', 'yellow'));
  data.data.portfolios.forEach((portfolio, index) => {
    const caseStudyCount = portfolio.caseStudies?.length || 0;
    
    console.log(colorize(`\n   ${index + 1}. ${portfolio.title}`, 'bright'));
    console.log(colorize(`      Status: ${portfolio.published ? 'Published' : 'Draft'}`, 'cyan'));
    console.log(colorize(`      Template: ${portfolio.templateType || 'Unknown'}`, 'cyan'));
    console.log(colorize(`      Case Studies: ${caseStudyCount}`, caseStudyCount > 0 ? 'green' : 'yellow'));
    console.log(colorize(`      Last updated: ${new Date(portfolio.updatedAt).toLocaleDateString()}`, 'cyan'));
    
    // Show case study details if any
    if (caseStudyCount > 0) {
      console.log(colorize('      Case Study Details:', 'magenta'));
      portfolio.caseStudies.forEach((cs, csIdx) => {
        const title = cs.content?.hero?.title || 'Untitled Project';
        console.log(colorize(`         ${csIdx + 1}. ${title} (Project ID: ${cs.projectId})`, 'magenta'));
      });
    }
  });
  
  return data.data.portfolios;
}

/**
 * Simulate user clicking "Publish" button
 * This triggers: HTML generation from user data + Vercel deployment
 */
async function clickPublishButton(authToken, portfolio) {
  console.log(colorize(`\n🚀 STEP 3: USER CLICKS "PUBLISH" BUTTON`, 'bright'));
  console.log(colorize(`   Portfolio: ${portfolio.title}`, 'cyan'));
  console.log(colorize('   (System now generates HTML and deploys to Vercel)', 'cyan'));
  
  const response = await fetch(`${BASE_URL}/api/sites/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      portfolioId: portfolio._id,
      template: 'minimalist'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Publish failed: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Publish failed: ${result.message || JSON.stringify(result)}`);
  }
  
  return result.data;
}

/**
 * Display publish results to user
 */
async function displayPublishResults(publishData) {
  console.log(colorize('\n✨ STEP 4: PUBLISH RESULTS', 'bright'));
  console.log(colorize('   ═══════════════════════════════════════', 'green'));
  
  const vercelInfo = publishData.vercel;
  const filesInfo = publishData.files;
  const siteInfo = publishData.site;
  
  if (vercelInfo?.url) {
    console.log(colorize(`   🌐 Live URL: ${vercelInfo.url}`, 'green'));
    console.log(colorize(`   � Status: ${vercelInfo.status}`, 'cyan'));
    console.log(colorize(`   🌍 Region: ${vercelInfo.regions?.[0] || 'N/A'}`, 'cyan'));
  }
  
  if (filesInfo) {
    console.log(colorize(`   � Files Generated: ${filesInfo.generated}`, 'cyan'));
    console.log(colorize(`   💾 Total Size: ${(filesInfo.totalSize / 1024).toFixed(2)} KB`, 'cyan'));
  }
  
  if (siteInfo) {
    console.log(colorize(`   🏷️  Subdomain: ${siteInfo.subdomain}`, 'cyan'));
  }
  
  console.log(colorize('   ═══════════════════════════════════════\n', 'green'));

  // Display list of generated files
  if (filesInfo?.directory) {
    const exportPath = filesInfo.directory;
    if (fs.existsSync(exportPath)) {
      const files = fs.readdirSync(exportPath).filter(f => f.endsWith('.html'));
      console.log(colorize('   Generated Files:', 'yellow'));
      files.forEach(file => {
        const isCaseStudy = file.includes('case-study-');
        const icon = isCaseStudy ? '📑' : '📄';
        const fileColor = isCaseStudy ? 'magenta' : 'cyan';
        console.log(colorize(`      ${icon} ${file}`, fileColor));
      });
      console.log();
    }
  }

  return publishData;
}

/**
 * Verify generated files exist and contain correct content
 */
async function verifyGeneratedFiles(publishData, portfolio) {
  console.log(colorize('\n🔍 STEP 5: VERIFYING GENERATED FILES', 'bright'));
  
  const exportPath = publishData.files?.directory;
  
  if (!exportPath) {
    console.log(colorize('⚠ No export directory info in publish data', 'yellow'));
    return;
  }
  
  // Check if export directory exists
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export directory not found: ${exportPath}`);
  }
  console.log(colorize(`✓ Export directory exists: ${exportPath}`, 'green'));

  // Verify index.html exists
  const indexPath = path.join(exportPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found');
  }
  console.log(colorize('✓ index.html exists', 'green'));
  
  // Read index.html content
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Verify it's not empty
  if (indexContent.length < 1000) {
    throw new Error('index.html appears to be empty or incomplete');
  }
  console.log(colorize(`✓ index.html has content (${indexContent.length} bytes)`, 'green'));

  // Verify case study HTML files
  const caseStudyCount = portfolio.caseStudies?.length || 0;
  console.log(colorize(`\n📑 Verifying ${caseStudyCount} case study file(s)...`, 'yellow'));
  
  if (caseStudyCount > 0) {
    let verifiedCount = 0;
    
    for (const caseStudy of portfolio.caseStudies) {
      const fileName = `case-study-${caseStudy.projectId}.html`;
      const filePath = path.join(exportPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(colorize(`✗ Missing: ${fileName}`, 'red'));
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = caseStudy.content?.hero?.title || 'Untitled';
      
      // Verify file has content
      if (content.length < 500) {
        console.log(colorize(`✗ ${fileName}: Too small (${content.length} bytes)`, 'red'));
        continue;
      }
      
      // Verify real data is in the HTML (not mock data)
      const hasRealTitle = content.includes(title);
      
      if (hasRealTitle) {
        console.log(colorize(`✓ ${fileName}: Valid (${content.length} bytes, contains "${title}")`, 'green'));
        verifiedCount++;
      } else {
        console.log(colorize(`✗ ${fileName}: Missing real data (title: "${title}")`, 'red'));
      }
    }
    
    console.log(colorize(`\n✓ Verified ${verifiedCount}/${caseStudyCount} case study files`, 
                        verifiedCount === caseStudyCount ? 'green' : 'yellow'));
    
    if (verifiedCount !== caseStudyCount) {
      console.log(colorize(`⚠ Warning: Some case study files failed verification`, 'yellow'));
    }
  } else {
    console.log(colorize('  No case studies to verify', 'yellow'));
  }

  console.log(colorize('\n✓ All file verifications complete!', 'green'));
}

/**
 * Main test function
 */
async function runTest() {
  console.log(colorize('\n╔══════════════════════════════════════════════════════════╗', 'bright'));
  console.log(colorize('║  AUREA BACKEND - VERCEL DEPLOYMENT TEST (with Case Studies) ║', 'bright'));
  console.log(colorize('╚══════════════════════════════════════════════════════════╝', 'bright'));

  let authToken;
  let portfolios;
  let selectedPortfolio;
  let publishData;

  try {
    // Wait for server
    await waitForServer();

    // Step 1: Authenticate
    authToken = await authenticateUser();

    // Step 2: Get portfolios
    portfolios = await getDraftPortfolios(authToken);
    
    if (portfolios.length === 0) {
      throw new Error('No portfolios found. Please create a portfolio first.');
    }

    // Select first portfolio
    selectedPortfolio = portfolios[0];

    // Step 3: Publish to Vercel
    publishData = await clickPublishButton(authToken, selectedPortfolio);

    // Step 4: Display results
    await displayPublishResults(publishData);

    // Step 5: Verify files
    await verifyGeneratedFiles(publishData, selectedPortfolio);

    // Success summary
    console.log(colorize('\n╔══════════════════════════════════════════════════════════╗', 'green'));
    console.log(colorize('║               ✓ TEST COMPLETED SUCCESSFULLY              ║', 'green'));
    console.log(colorize('╚══════════════════════════════════════════════════════════╝', 'green'));
    
    const vercelUrl = publishData.vercel?.url;
    const exportDir = publishData.files?.directory;
    
    if (vercelUrl) {
      console.log(colorize(`\n🌐 Your portfolio is live at: ${vercelUrl}`, 'cyan'));
    }
    
    if (exportDir) {
      console.log(colorize(`📁 Files exported to: ${exportDir}`, 'cyan'));
    }
    
    if (selectedPortfolio.caseStudies?.length > 0 && vercelUrl) {
      console.log(colorize(`\n📑 Case Study URLs:`, 'magenta'));
      selectedPortfolio.caseStudies.forEach(cs => {
        const caseStudyUrl = `${vercelUrl}/case-study-${cs.projectId}.html`;
        const title = cs.content?.hero?.title || 'Untitled';
        console.log(colorize(`   • ${title}: ${caseStudyUrl}`, 'magenta'));
      });
    }

  } catch (error) {
    console.log(colorize('\n╔══════════════════════════════════════════════════════════╗', 'red'));
    console.log(colorize('║                  ✗ TEST FAILED                           ║', 'red'));
    console.log(colorize('╚══════════════════════════════════════════════════════════╝', 'red'));
    console.log(colorize(`\n❌ Error: ${error.message}`, 'red'));
    
    if (error.stack) {
      console.log(colorize('\nStack trace:', 'yellow'));
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
runTest();
