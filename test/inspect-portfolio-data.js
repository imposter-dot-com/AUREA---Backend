// inspect-portfolio-data.js - Script to inspect portfolio data from database
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const USER_CREDENTIALS = {
  email: 'user2@example.com',
  password: '123456'
};

async function authenticateUser() {
  console.log('🔐 Authenticating user...');
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(USER_CREDENTIALS)
    });

    const loginData = await loginResponse.json();

    if (loginData.success) {
      console.log('✅ Login successful!');
      return loginData.data.token;
    } else {
      throw new Error(`Login failed: ${loginData.message}`);
    }
  } catch (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
}

async function inspectPortfolioData() {
  try {
    const authToken = await authenticateUser();
    console.log(`🔑 Auth Token: ${authToken.substring(0, 30)}...`);

    // Get all portfolios
    console.log('\n📁 Fetching all portfolios...');
    const portfoliosResponse = await fetch(`${BASE_URL}/api/portfolios/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const portfoliosData = await portfoliosResponse.json();

    if (!portfoliosData.success) {
      throw new Error(`Failed to get portfolios: ${portfoliosData.message || 'Unknown error'}`);
    }

    const portfolios = portfoliosData.data?.portfolios || [];
    console.log(`\n📊 Found ${portfolios.length} portfolios:`);
    
    // List all portfolios with basic info
    portfolios.forEach((portfolio, index) => {
      console.log(`\n${index + 1}. "${portfolio.title || 'Untitled'}"`);
      console.log(`   📄 ID: ${portfolio._id}`);
      console.log(`   📊 Published: ${portfolio.published ? 'Yes' : 'No'}`);
      console.log(`   🎨 Template: ${portfolio.templateId || portfolio.template || 'default'}`);
      console.log(`   📝 Has sections: ${portfolio.sections?.length || 0}`);
      console.log(`   🔗 URL: ${portfolio.url || 'Not published'}`);
    });

    // Get the first portfolio for inspection
    const targetPortfolio = portfolios[0];

    if (targetPortfolio) {
      console.log(`\n🎯 FETCHING FULL PORTFOLIO DATA: "${targetPortfolio.title}"`);
      
      // Fetch complete portfolio data with content and styling
      const fullPortfolioResponse = await fetch(`${BASE_URL}/api/portfolios/${targetPortfolio._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const fullPortfolioData = await fullPortfolioResponse.json();
      
      if (!fullPortfolioData.success) {
        console.error('❌ Failed to fetch full portfolio:', fullPortfolioData.message);
        return;
      }

      const portfolio = fullPortfolioData.data;
      
      console.log('='.repeat(60));
      
      // Display detailed structure
      console.log('\n📋 PORTFOLIO STRUCTURE:');
      console.log('Basic Info:');
      console.log(`  Title: ${portfolio.title}`);
      console.log(`  Description: ${portfolio.description || 'N/A'}`);
      console.log(`  Template: ${portfolio.templateId || 'default'}`);
      console.log(`  Published: ${portfolio.isPublished}`);
      console.log(`  Slug: ${portfolio.slug || 'Not published'}`);
      console.log(`  View Count: ${portfolio.viewCount || 0}`);
      console.log(`  Created: ${portfolio.createdAt || 'N/A'}`);
      console.log(`  Updated: ${portfolio.updatedAt || 'N/A'}`);

      // Check for different data formats
      console.log('\n🔍 DATA FORMAT ANALYSIS:');
      
      if (portfolio.personalInfo) {
        console.log('✅ NEW FORMAT: Has personalInfo object');
        console.log('Personal Info:', JSON.stringify(portfolio.personalInfo, null, 2));
      } else {
        console.log('❌ NEW FORMAT: No personalInfo found');
      }

      if (portfolio.content) {
        console.log('✅ HAS CONTENT: Has content object');
        console.log('Content keys:', Object.keys(portfolio.content));
        console.log('Content:', JSON.stringify(portfolio.content, null, 2));
      } else {
        console.log('❌ NO CONTENT: No content object found');
      }

      if (portfolio.sections) {
        console.log('✅ LEGACY FORMAT: Has sections array');
        console.log(`Sections count: ${portfolio.sections.length}`);
        portfolio.sections.forEach((section, idx) => {
          console.log(`  ${idx + 1}. ${section.type}: ${section.visible !== false ? 'Visible' : 'Hidden'}`);
        });
      } else {
        console.log('❌ LEGACY FORMAT: No sections array found');
      }

      if (portfolio.styling) {
        console.log('✅ Has styling configuration');
        console.log('Styling keys:', Object.keys(portfolio.styling));
        if (portfolio.styling.colors) {
          console.log('Colors:', portfolio.styling.colors);
        }
        if (portfolio.styling.fonts) {
          console.log('Fonts:', portfolio.styling.fonts);
        }
      } else {
        console.log('❌ No styling configuration found');
      }

      // Full JSON dump for detailed inspection
      console.log('\n📄 COMPLETE PORTFOLIO DATA:');
      console.log('='.repeat(60));
      console.log(JSON.stringify(portfolio, null, 2));

    } else {
      console.log('\n❌ No portfolios found!');
    }

  } catch (error) {
    console.error('\n❌ Inspection failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Wait for server
async function waitForServer() {
  console.log('🔍 Checking server status...');
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Continue waiting
    }

    attempts++;
    console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.error('❌ Server not responding');
  return false;
}

// Main execution
(async () => {
  console.log('🔍 PORTFOLIO DATA INSPECTION');
  console.log('='.repeat(50));
  
  const serverReady = await waitForServer();
  if (serverReady) {
    await inspectPortfolioData();
  } else {
    console.log('💡 Please ensure the server is running: npm run dev');
  }
})();