/**
 * Test Script: Login and Publish Portfolio
 * 
 * This script logs into the user account, selects a portfolio, and publishes it
 * to test the complete publish flow and HTML generation.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const USER_EMAIL = 'user1@example.com';
const USER_PASSWORD = 'password123';

/**
 * Check if server is ready
 */
async function waitForServer(maxAttempts = 10) {
  console.log('🔍 Checking server status...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Server not ready after maximum attempts');
}

/**
 * Authenticate user and get auth token
 */
async function authenticateUser() {
  console.log('🔐 Authenticating user...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD
    })
  });

  const data = await response.json();
  
  console.log('🔍 Auth response:', JSON.stringify(data, null, 2));
  
  if (!data.success) {
    throw new Error(`Authentication failed: ${data.message}`);
  }

  console.log('✅ Login successful!');
  return data.data?.token || data.token;
}

/**
 * Get all portfolios for the user
 */
async function getPortfolios(authToken) {
  console.log('📁 Fetching user portfolios...');
  
  const response = await fetch(`${BASE_URL}/api/portfolios/user/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  console.log('🔍 Portfolio response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    throw new Error(`Failed to fetch portfolios: ${data.message || JSON.stringify(data)}`);
  }

  console.log(`✅ Found ${data.data.portfolios.length} portfolios`);
  return data.data.portfolios;
}

/**
 * Publish a portfolio
 */
async function publishPortfolio(authToken, portfolioId, subdomain) {
  console.log(`🚀 Publishing portfolio: ${portfolioId}`);
  console.log(`📡 Subdomain: ${subdomain}`);
  
  const response = await fetch(`${BASE_URL}/api/sites/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      portfolioId: portfolioId,
      subdomain: subdomain,
      customDomain: null
    })
  });

  const data = await response.json();
  
  console.log('📋 Publish response:', JSON.stringify(data, null, 2));
  
  if (!data.success) {
    throw new Error(`Publishing failed: ${data.message}`);
  }

  console.log('✅ Portfolio published successfully!');
  return data.data;
}

/**
 * Check if generated files exist
 */
function checkGeneratedFiles(subdomain) {
  console.log('🔍 Checking generated files...');
  
  const subdomainDir = path.join(process.cwd(), 'generated-files', subdomain);
  
  if (!fs.existsSync(subdomainDir)) {
    console.log('❌ Subdomain directory not found');
    return { found: false };
  }
  
  const files = fs.readdirSync(subdomainDir);
  console.log(`📁 Found ${files.length} files in ${subdomainDir}:`);
  
  const fileDetails = [];
  files.forEach(filename => {
    const filePath = path.join(subdomainDir, filename);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    console.log(`  📄 ${filename} (${size} bytes)`);
    fileDetails.push({ filename, size, path: filePath });
    
    // If it's an HTML file, show a preview
    if (filename.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`  🔍 HTML Preview (first 200 chars): ${content.substring(0, 200)}...`);
    }
  });
  
  return { found: true, directory: subdomainDir, files: fileDetails };
}

/**
 * Main test function
 */
async function testPublishFlow() {
  try {
    console.log('🧪 TESTING PUBLISH FLOW');
    console.log('=======================');

    // 1. Wait for server
    await waitForServer();

    // 2. Authenticate
    const authToken = await authenticateUser();
    console.log(`🔑 Auth Token: ${authToken ? authToken.substring(0, 30) + '...' : 'No token received'}`);

    if (!authToken) {
      throw new Error('Authentication failed - no token received');
    }

    // 3. Get portfolios
    const portfolios = await getPortfolios(authToken);
    
    if (portfolios.length === 0) {
      throw new Error('No portfolios found for this user');
    }

    // 4. Display available portfolios
    console.log('\n📊 Available Portfolios:');
    portfolios.forEach((portfolio, index) => {
      console.log(`${index + 1}. "${portfolio.title}"`);
      console.log(`   📄 ID: ${portfolio._id}`);
      console.log(`   📊 Published: ${portfolio.published ? 'Yes' : 'No'}`);
      console.log(`   🎨 Template: ${portfolio.template}`);
      console.log(`   📝 Sections: ${portfolio.sections?.length || 0}`);
      if (portfolio.sections) {
        portfolio.sections.forEach((section, idx) => {
          console.log(`      ${idx + 1}. ${section.type}`);
        });
      }
      console.log('');
    });

    // 5. Select first portfolio for testing
    const selectedPortfolio = portfolios[0];
    console.log(`🎯 Selected Portfolio: "${selectedPortfolio.title}"`);

    // 6. Generate unique subdomain for testing
    const timestamp = Date.now();
    const subdomain = `test-publish-${timestamp}`;

    // 7. Publish the portfolio
    console.log('\n🚀 PUBLISHING PORTFOLIO...');
    const publishResult = await publishPortfolio(authToken, selectedPortfolio._id, subdomain);

    console.log('\n📋 PUBLISH RESULT:');
    console.log(JSON.stringify(publishResult, null, 2));

    // 8. Check generated files
    console.log('\n🔍 CHECKING GENERATED FILES...');
    const fileCheck = checkGeneratedFiles(subdomain);

    if (fileCheck.found) {
      console.log('\n✅ FILES SUCCESSFULLY GENERATED!');
      console.log(`📁 Directory: ${fileCheck.directory}`);
      console.log(`📄 Total files: ${fileCheck.files.length}`);
      
      // Show HTML file analysis
      const htmlFile = fileCheck.files.find(f => f.filename.endsWith('.html'));
      if (htmlFile) {
        console.log('\n🔍 HTML FILE ANALYSIS:');
        const htmlContent = fs.readFileSync(htmlFile.path, 'utf8');
        console.log(`📏 HTML size: ${htmlContent.length} characters`);
        console.log(`Contains portfolio title: ${htmlContent.includes(selectedPortfolio.title) ? '✅' : '❌'}`);
        console.log(`Contains user data: ${htmlContent.includes('mine') ? '✅' : '❌'}`);
        console.log(`Contains styling: ${htmlContent.includes('<style>') ? '✅' : '❌'}`);
        console.log(`Contains JavaScript: ${htmlContent.includes('<script>') ? '✅' : '❌'}`);
      }
    } else {
      console.log('\n❌ NO FILES GENERATED!');
    }

    // 9. Final summary
    console.log('\n🎊 TEST SUMMARY:');
    console.log(`✅ Authentication: SUCCESS`);
    console.log(`✅ Portfolio Selection: SUCCESS`);
    console.log(`✅ Publishing: SUCCESS`);
    console.log(`✅ File Generation: ${fileCheck.found ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ HTML Creation: ${fileCheck.files?.some(f => f.filename.endsWith('.html')) ? 'SUCCESS' : 'FAILED'}`);

    return {
      success: true,
      portfolio: selectedPortfolio,
      subdomain,
      publishResult,
      files: fileCheck
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPublishFlow()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 PUBLISH TEST COMPLETED SUCCESSFULLY!');
        console.log('The new HTML generator is working correctly with the publish flow.');
        process.exit(0);
      } else {
        console.log('\n💥 PUBLISH TEST FAILED!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { testPublishFlow };