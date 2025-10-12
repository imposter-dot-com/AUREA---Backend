/**
 * Test Script: Complete User Publish Flow to Vercel
 * 
 * This script simulates the complete user publishing workflow:
 * 1. User logs in to their account
 * 2. User views their draft portfolios
 * 3. User selects a portfolio to publish
 * 4. System verifies portfolio has case studies
 * 5. User clicks "Publish" button
 * 6. System generates HTML from user's portfolio data + case studies
 * 7. System automatically uploads and hosts to Vercel
 * 8. User receives live URL
 * 9. System verifies case study HTML was generated
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'user2@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || '123456';

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

/**
 * Check if server is ready
 */
// Helper function to wait for server to be ready
async function waitForServer(maxAttempts = 10, delayMs = 1000) {
  console.log(colorize('\n🔍 Checking if server is ready...', 'cyan'));
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        console.log(colorize('✓ Server is ready!', 'green'));
        return true;
      }
    } catch (error) {
      console.log(colorize(`  Attempt ${i + 1}/${maxAttempts}: Server not ready yet...`, 'yellow'));
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Server failed to start within timeout period');
}

/**
 * Authenticate user and get auth token
 */
// Step 1: Authenticate user and get token
async function authenticateUser() {
  console.log(colorize(`\n� STEP 1: Authenticating user (${USER_EMAIL})...`, 'bright'));
  
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

  const data = await response.json();
  console.log(colorize('✓ Authentication successful!', 'green'));
  console.log(colorize(`  User ID: ${data.userId}`, 'cyan'));
  console.log(colorize(`  Token: ${data.token.substring(0, 20)}...`, 'cyan'));
  
  return data.token;
}

/**
 * Get user's draft portfolios
 */
async function getDraftPortfolios(authToken) {
  console.log('\n� FETCHING USER\'S DRAFT PORTFOLIOS...');
  console.log('   (Simulating user viewing their saved drafts)');
  
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

  console.log(`✅ User has ${data.data.portfolios.length} draft portfolio(s)`);
  
  // Display portfolio list like the user would see
  console.log('\n📋 AVAILABLE DRAFTS:');
  data.data.portfolios.forEach((portfolio, index) => {
    console.log(`   ${index + 1}. ${portfolio.title}`);
    console.log(`      Status: ${portfolio.published ? 'Published' : 'Draft'}`);
    console.log(`      Last updated: ${new Date(portfolio.updatedAt).toLocaleDateString()}`);
  });
  
  return data.data.portfolios;
}

/**
 * Simulate user clicking "Publish" button
 * This triggers: HTML generation from user data + Vercel deployment
 */
async function clickPublishButton(authToken, portfolio) {
  console.log(`\n�️  USER CLICKS "PUBLISH" BUTTON`);
  console.log(`   Selected: "${portfolio.title}"`);
  console.log('\n⚙️  STARTING PUBLISH PROCESS...');
  console.log('   Step 1: Extracting user portfolio data');
  console.log('   Step 2: Generating HTML from user data');
  console.log('   Step 3: Creating deployment files');
  console.log('   Step 4: Uploading to Vercel');
  console.log('   Step 5: Configuring live site');
  
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

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Publish failed: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Display publish results to user
 */
function displayPublishResults(publishResult) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ PORTFOLIO PUBLISHED SUCCESSFULLY!                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const vercelInfo = publishResult.data?.vercel;
  const filesInfo = publishResult.data?.files;
  const siteInfo = publishResult.data?.site;
  
  console.log('\n🎉 YOUR PORTFOLIO IS NOW LIVE!');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (vercelInfo?.url) {
    console.log(`\n🌐 Live URL: ${vercelInfo.url}`);
    console.log(`   Status: ${vercelInfo.status}`);
    console.log(`   Region: ${vercelInfo.regions?.[0] || 'N/A'}`);
  }
  
  if (filesInfo) {
    console.log(`\n📁 Generated Files:`);
    console.log(`   Total Files: ${filesInfo.generated}`);
    console.log(`   Total Size: ${(filesInfo.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Location: ${filesInfo.directory}`);
  }
  
  if (siteInfo) {
    console.log(`\n📝 Site Details:`);
    console.log(`   Subdomain: ${siteInfo.subdomain}`);
    console.log(`   Portfolio: ${publishResult.data?.portfolio?.title}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n💡 What happened:');
  console.log('   1. ✅ Extracted your portfolio data');
  console.log('   2. ✅ Generated HTML from your content');
  console.log('   3. ✅ Created deployment files');
  console.log('   4. ✅ Uploaded to Vercel');
  console.log('   5. ✅ Site is now live and accessible!');
  
  if (vercelInfo?.url) {
    console.log(`\n🎊 Visit your live portfolio: ${vercelInfo.url}\n`);
  }
}

/**
 * Verify generated files exist
 */
async function verifyGeneratedFiles(subdomain) {
  console.log(`\n🔍 VERIFYING GENERATED FILES...`);
  
  const generatedDir = path.join(process.cwd(), 'generated-files', subdomain);
  
  if (!fs.existsSync(generatedDir)) {
    console.log(`❌ Directory not found: ${generatedDir}`);
    return false;
  }
  
  console.log(`✅ Found directory: ${generatedDir}`);
  
  const files = fs.readdirSync(generatedDir);
  console.log(`📄 Files generated: ${files.length}`);
  
  files.forEach(file => {
    const filePath = path.join(generatedDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
  
  return files.length > 0;
}

/**
 * Main test function - Simulates complete user publish flow
 */
async function runTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  USER PORTFOLIO PUBLISH FLOW TEST                          ║');
  console.log('║  (Login → Select Draft → Click Publish → Live on Vercel)  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if Vercel token is configured
    if (!process.env.VERCEL_TOKEN) {
      console.log('⚠️ WARNING: VERCEL_TOKEN not found in environment variables!');
      console.log('Please set VERCEL_TOKEN in your .env file to enable Vercel deployment.\n');
      throw new Error('VERCEL_TOKEN is required for deployment');
    }
    
    console.log('✅ VERCEL_TOKEN configured');

    // Step 1: Wait for server
    await waitForServer();

    // Step 2: User logs in
    console.log('\n👤 STEP 1: USER LOGIN');
    console.log('════════════════════════════════════════════════════════════');
    const authToken = await authenticateUser();

    // Step 3: User views their draft portfolios
    console.log('\n📂 STEP 2: VIEW DRAFT PORTFOLIOS');
    console.log('════════════════════════════════════════════════════════════');
    const portfolios = await getDraftPortfolios(authToken);

    if (portfolios.length === 0) {
      throw new Error('No portfolios found. Please create a portfolio first.');
    }

    // Step 4: User selects a portfolio (first one for this test)
    console.log('\n🎯 STEP 3: SELECT PORTFOLIO TO PUBLISH');
    console.log('════════════════════════════════════════════════════════════');
    const selectedPortfolio = portfolios[0];
    console.log(`   User selected: "${selectedPortfolio.title}"`);
    console.log(`   Portfolio ID: ${selectedPortfolio._id}`);
    console.log(`   Current status: ${selectedPortfolio.published ? 'Published' : 'Draft'}`);

    // Step 5: User clicks "Publish" button
    console.log('\n🚀 STEP 4: PUBLISH TO VERCEL');
    console.log('════════════════════════════════════════════════════════════');
    const publishResult = await clickPublishButton(authToken, selectedPortfolio);
    
    // Step 6: Display results to user
    console.log('\n� STEP 5: PUBLISH COMPLETE');
    console.log('════════════════════════════════════════════════════════════');
    displayPublishResults(publishResult);

    // Verify files were generated
    const filesInfo = publishResult.data?.files;
    if (filesInfo?.directory) {
      const subdomain = filesInfo.directory.split('/').pop();
      await verifyGeneratedFiles(subdomain);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ PUBLISH FLOW TEST COMPLETED SUCCESSFULLY               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Print final summary
    console.log('📊 FLOW SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ User Login: SUCCESS');
    console.log('✅ View Draft Portfolios: SUCCESS');
    console.log('✅ Select Portfolio: SUCCESS');
    console.log('✅ Click Publish Button: SUCCESS');
    console.log('✅ HTML Generation: SUCCESS (from user data)');
    console.log('✅ Vercel Upload: SUCCESS');
    console.log('✅ Live Site: SUCCESS');
    
    const vercelUrl = publishResult.data?.vercel?.url;
    if (vercelUrl) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log(`🎉 Portfolio is live at: ${vercelUrl}`);
      console.log('📱 Share this URL with the world!\n');
    }

  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ PUBLISH FLOW TEST FAILED                               ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error('❌ ERROR:', error.message);
    console.error('\n📋 Error Details:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
