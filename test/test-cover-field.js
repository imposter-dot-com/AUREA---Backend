/**
 * Test script for portfolio cover field
 */

const API_BASE = 'http://localhost:5000/api';

async function testCoverField() {
  console.log('🧪 Testing Portfolio Cover Field...\n');

  try {
    // 1. Create test user
    console.log('1️⃣  Creating test user...');
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `cover-test-${Date.now()}@test.com`,
        password: 'Test123!@#',
        name: 'Cover Test User'
      })
    });

    if (!signupRes.ok) {
      const error = await signupRes.json();
      throw new Error(`Signup failed: ${error.message}`);
    }

    const { data: { token } } = await signupRes.json();
    console.log('✅ User created and logged in\n');

    // 2. Create portfolio with cover field
    console.log('2️⃣  Creating portfolio with cover field...');
    const createRes = await fetch(`${API_BASE}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Portfolio with Cover',
        description: 'Testing cover field',
        template: 'echelon',
        cover: 'https://example.com/my-cover-image.jpg'
      })
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      throw new Error(`Create portfolio failed: ${error.message}`);
    }

    const { data: { portfolio } } = await createRes.json();
    console.log('✅ Portfolio created');
    console.log(`   ID: ${portfolio._id}`);
    console.log(`   Cover: ${portfolio.cover || 'null'}\n`);

    // 3. Update portfolio cover
    console.log('3️⃣  Updating portfolio cover...');
    const updateRes = await fetch(`${API_BASE}/portfolios/${portfolio._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cover: 'https://example.com/updated-cover.jpg'
      })
    });

    if (!updateRes.ok) {
      const error = await updateRes.json();
      throw new Error(`Update portfolio failed: ${error.message}`);
    }

    const { data: { portfolio: updatedPortfolio } } = await updateRes.json();
    console.log('✅ Portfolio cover updated');
    console.log(`   New cover: ${updatedPortfolio.cover}\n`);

    // 4. Get portfolio and verify cover field
    console.log('4️⃣  Fetching portfolio to verify cover...');
    const getRes = await fetch(`${API_BASE}/portfolios/${portfolio._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!getRes.ok) {
      const error = await getRes.json();
      throw new Error(`Get portfolio failed: ${error.message}`);
    }

    const { data: { portfolio: fetchedPortfolio } } = await getRes.json();
    console.log('✅ Portfolio fetched');
    console.log(`   Cover field exists: ${fetchedPortfolio.hasOwnProperty('cover')}`);
    console.log(`   Cover value: ${fetchedPortfolio.cover}\n`);

    // 5. Cleanup - Delete portfolio
    console.log('5️⃣  Cleaning up test data...');
    const deleteRes = await fetch(`${API_BASE}/portfolios/${portfolio._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!deleteRes.ok) {
      const error = await deleteRes.json();
      throw new Error(`Delete portfolio failed: ${error.message}`);
    }

    console.log('✅ Test data cleaned up\n');

    // Verify results
    if (fetchedPortfolio.cover === 'https://example.com/updated-cover.jpg') {
      console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅');
      console.log('Cover field is working correctly!\n');
    } else {
      console.log('❌ TEST FAILED: Cover field value mismatch');
      console.log(`   Expected: https://example.com/updated-cover.jpg`);
      console.log(`   Got: ${fetchedPortfolio.cover}\n`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testCoverField();
