/**
 * Test that /api/portfolios/user/me returns cover field
 */

const API_BASE = 'http://localhost:5000/api';

async function testUserPortfoliosCover() {
  console.log('🧪 Testing /api/portfolios/user/me includes cover field...\n');

  try {
    // 1. Create test user
    console.log('1️⃣  Creating test user...');
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `cover-list-test-${Date.now()}@test.com`,
        password: 'Test123!@#',
        name: 'Cover List Test User'
      })
    });

    if (!signupRes.ok) {
      throw new Error('Signup failed');
    }

    const { data: { token } } = await signupRes.json();
    console.log('✅ User created\n');

    // 2. Create portfolio with cover
    console.log('2️⃣  Creating portfolio with cover...');
    const createRes = await fetch(`${API_BASE}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Portfolio with Cover',
        description: 'Testing cover in list',
        cover: 'https://example.com/cover.jpg'
      })
    });

    if (!createRes.ok) {
      throw new Error('Create portfolio failed');
    }

    const { data: { portfolio } } = await createRes.json();
    console.log('✅ Portfolio created with cover\n');

    // 3. Fetch user portfolios
    console.log('3️⃣  Fetching user portfolios via /api/portfolios/user/me...');
    const listRes = await fetch(`${API_BASE}/portfolios/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!listRes.ok) {
      throw new Error('Failed to fetch user portfolios');
    }

    const listData = await listRes.json();
    console.log('✅ User portfolios fetched\n');

    // 4. Verify cover field exists
    console.log('4️⃣  Verifying cover field in response...');
    const portfolios = listData.data || listData.portfolios;

    if (!portfolios || portfolios.length === 0) {
      throw new Error('No portfolios returned');
    }

    const firstPortfolio = portfolios[0];
    console.log('   Portfolio fields:', Object.keys(firstPortfolio).sort().join(', '));
    console.log(`   Cover field exists: ${firstPortfolio.hasOwnProperty('cover')}`);
    console.log(`   Cover value: ${firstPortfolio.cover}\n`);

    // 5. Cleanup
    console.log('5️⃣  Cleaning up...');
    await fetch(`${API_BASE}/portfolios/${portfolio._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Cleaned up\n');

    // Verify
    if (firstPortfolio.hasOwnProperty('cover') && firstPortfolio.cover === 'https://example.com/cover.jpg') {
      console.log('✅✅✅ TEST PASSED! ✅✅✅');
      console.log('The /api/portfolios/user/me endpoint correctly returns the cover field!\n');
    } else {
      console.log('❌ TEST FAILED');
      console.log(`   Expected cover: https://example.com/cover.jpg`);
      console.log(`   Got: ${firstPortfolio.cover}`);
      console.log(`   Has cover field: ${firstPortfolio.hasOwnProperty('cover')}\n`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testUserPortfoliosCover();
