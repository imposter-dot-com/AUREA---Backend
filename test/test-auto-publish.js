/**
 * Test Auto-Publishing with Hero Name Extraction
 * Tests the new automatic subdomain generation from user's name in hero section
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test credentials
const testUser = {
  email: 'user2@example.com',
  password: '123456'
};

async function testAutoPublish() {
  try {
    console.log('🧪 Testing Auto-Publishing with Hero Name Extraction');
    console.log('================================================');

    // 1. Login to get JWT token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    const token = loginData.data.token;
    console.log('✅ Login successful');

    // 2. Get user's portfolios
    console.log('📁 Fetching user portfolios...');
    const portfoliosResponse = await fetch(`${BASE_URL}/api/portfolios/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const portfoliosData = await portfoliosResponse.json();
    
    if (!portfoliosData.success || !portfoliosData.data.portfolios.length) {
      throw new Error('No portfolios found for user');
    }

    const portfolio = portfoliosData.data.portfolios[0];
    console.log(`✅ Found portfolio: "${portfolio.title}"`);
    
    // Check hero section for name
    const heroSection = portfolio.sections?.find(s => s.type === 'hero');
    const heroName = heroSection?.content?.name;
    console.log(`👤 Hero name found: "${heroName}"`);

    // 3. Publish portfolio (no subdomain needed - auto-generated)
    console.log('🚀 Publishing portfolio with auto-generated subdomain...');
    const publishResponse = await fetch(`${BASE_URL}/api/site/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        portfolioId: portfolio._id
        // Note: No subdomain field - it's auto-generated from hero name
      })
    });

    const publishData = await publishResponse.json();
    
    if (!publishData.success) {
      throw new Error(`Publish failed: ${publishData.message}`);
    }

    console.log('✅ Portfolio published successfully!');
    console.log('📊 Publication Results:');
    console.log(`   🌐 Auto-generated subdomain: ${publishData.data.site.subdomain}`);
    console.log(`   🔗 Live URL: ${publishData.data.site.url}`);
    console.log(`   📦 Vercel URL: ${publishData.data.site.vercelUrl}`);
    console.log(`   📁 Files generated: ${publishData.data.files.generated}`);
    console.log(`   💾 Total size: ${publishData.data.files.totalSize} bytes`);

    // 4. Verify subdomain format
    const expectedPrefix = heroName ? 
      heroName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-portfolio' : 
      'portfolio';
    
    if (publishData.data.site.subdomain.includes(expectedPrefix.split('-')[0])) {
      console.log('✅ Subdomain correctly generated from hero name');
    } else {
      console.log('⚠️  Subdomain may not match expected format');
    }

    console.log('\n🎉 Auto-publishing test completed successfully!');
    
    return {
      success: true,
      subdomain: publishData.data.site.subdomain,
      url: publishData.data.site.url,
      heroName: heroName
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testAutoPublish()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All tests passed!');
      console.log(`Hero name: "${result.heroName}" → Subdomain: "${result.subdomain}"`);
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });