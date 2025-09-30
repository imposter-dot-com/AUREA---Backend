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
    const portfoliosResponse = await fetch(`${BASE_URL}/api/portfolios/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const portfoliosData = await portfoliosResponse.json();

    if (!portfoliosData.success) {
      throw new Error(`Failed to get portfolios: ${portfoliosData.message}`);
    }

    const portfolios = portfoliosData.data.portfolios || [];
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

    // Find the specific portfolio
    const targetPortfolio = portfolios.find(p => 
      p.title && p.title.toLowerCase().includes('your name')
    );

    if (targetPortfolio) {
      console.log('\n🎯 FOUND TARGET PORTFOLIO: "Your Name\'s Portfolio"');
      console.log('=' * 60);
      
      // Display detailed structure
      console.log('\n📋 PORTFOLIO STRUCTURE:');
      console.log('Basic Info:');
      console.log(`  Title: ${targetPortfolio.title}`);
      console.log(`  Description: ${targetPortfolio.description || 'N/A'}`);
      console.log(`  Template: ${targetPortfolio.templateId || targetPortfolio.template || 'default'}`);
      console.log(`  Published: ${targetPortfolio.published}`);
      console.log(`  URL: ${targetPortfolio.url || 'Not published'}`);
      console.log(`  Created: ${targetPortfolio.createdAt || 'N/A'}`);
      console.log(`  Updated: ${targetPortfolio.updatedAt || 'N/A'}`);

      // Check for different data formats
      console.log('\n🔍 DATA FORMAT ANALYSIS:');
      
      if (targetPortfolio.personalInfo) {
        console.log('✅ NEW FORMAT: Has personalInfo object');
        console.log('Personal Info:', JSON.stringify(targetPortfolio.personalInfo, null, 2));
      } else {
        console.log('❌ NEW FORMAT: No personalInfo found');
      }

      if (targetPortfolio.content) {
        console.log('✅ NEW FORMAT: Has content object');
        console.log('Content keys:', Object.keys(targetPortfolio.content));
        console.log('Content:', JSON.stringify(targetPortfolio.content, null, 2));
      } else {
        console.log('❌ NEW FORMAT: No content object found');
      }

      if (targetPortfolio.sections) {
        console.log('✅ LEGACY FORMAT: Has sections array');
        console.log(`Sections count: ${targetPortfolio.sections.length}`);
        targetPortfolio.sections.forEach((section, idx) => {
          console.log(`  ${idx + 1}. ${section.type}: ${section.visible !== false ? 'Visible' : 'Hidden'}`);
        });
      } else {
        console.log('❌ LEGACY FORMAT: No sections array found');
      }

      if (targetPortfolio.styling) {
        console.log('✅ Has styling configuration');
        console.log('Styling keys:', Object.keys(targetPortfolio.styling));
        if (targetPortfolio.styling.colors) {
          console.log('Colors:', targetPortfolio.styling.colors);
        }
        if (targetPortfolio.styling.fonts) {
          console.log('Fonts:', targetPortfolio.styling.fonts);
        }
      } else {
        console.log('❌ No styling configuration found');
      }

      // Full JSON dump for detailed inspection
      console.log('\n📄 COMPLETE PORTFOLIO DATA:');
      console.log('=' * 60);
      console.log(JSON.stringify(targetPortfolio, null, 2));

    } else {
      console.log('\n❌ Portfolio "chea ilong\'s Portfolio" not found!');
      console.log('Available portfolios:');
      portfolios.forEach((p, i) => {
        console.log(`  ${i + 1}. "${p.title}"`);
      });
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
  console.log('=' * 50);
  
  const serverReady = await waitForServer();
  if (serverReady) {
    await inspectPortfolioData();
  } else {
    console.log('💡 Please ensure the server is running: npm run dev');
  }
})();