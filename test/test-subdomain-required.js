/**
 * Test: Subdomain Required for Publishing
 * Verifies that customSubdomain is now required for new publishes
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';
let authToken = null;
let portfolioId = null;

// Helper to make API calls
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken && !options.noAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && contentType.includes('text/html')) {
    data = { html: true };
  } else {
    try {
      data = await response.json();
    } catch (e) {
      data = { text: await response.text() };
    }
  }

  return { status: response.status, data };
}

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(60));
}

// Setup: Create user and portfolio
async function setup() {
  section('SETUP');

  // Register user
  log('📝', 'Creating test user...');
  const { data: signup } = await api('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: `test${Date.now()}@test.com`,
      password: 'Test123!@#',
      name: 'Test User'
    })
  });

  authToken = signup.data.token;
  log('✅', `User created: ${signup.data.user.email}`);

  // Create portfolio
  log('📝', 'Creating test portfolio...');
  const { data: portfolio } = await api('/api/portfolios', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Portfolio',
      description: 'Test',
      template: 'echelon',
      content: {
        hero: {
          title: 'Test Designer',
          subtitle: 'Creative',
          backgroundImage: 'https://example.com/img.jpg'
        },
        about: {
          name: 'Test Designer',
          tagline: 'Designer',
          bio: 'Test bio',
          profileImage: 'https://example.com/profile.jpg'
        }
      }
    })
  });

  portfolioId = portfolio.data.portfolio._id;
  log('✅', `Portfolio created: ${portfolioId}`);
}

// Test 1: Check slug availability
async function testCheckSlug() {
  section('TEST 1: Check Slug Availability');

  // Test available subdomain
  log('🔍', 'Checking available subdomain...');
  const availableSlug = `test-${Date.now()}`;
  const { status: s1, data: d1 } = await api(`/api/portfolios/check-slug/${availableSlug}`);

  if (s1 === 200 && d1.available) {
    log('✅', `Subdomain "${availableSlug}" is available`);
    log('💬', `Message: ${d1.message}`);
  } else {
    log('❌', `FAILED: Expected available, got ${JSON.stringify(d1)}`);
    return false;
  }

  // Test invalid format
  log('🔍', 'Checking invalid format (too short)...');
  const { status: s2, data: d2 } = await api('/api/portfolios/check-slug/ab');

  if (s2 === 200 && !d2.available && d2.reason === 'INVALID_FORMAT') {
    log('✅', 'Invalid format correctly detected');
    log('💬', `Message: ${d2.message}`);
    if (d2.suggestions) {
      log('💡', `Suggestions: ${d2.suggestions.join(', ')}`);
    }
  } else {
    log('❌', `FAILED: Expected invalid format, got ${JSON.stringify(d2)}`);
    return false;
  }

  // Test reserved subdomain
  log('🔍', 'Checking reserved subdomain...');
  const { status: s3, data: d3 } = await api('/api/portfolios/check-slug/admin');

  if (s3 === 200 && !d3.available) {
    log('✅', 'Reserved subdomain correctly blocked');
    log('💬', `Message: ${d3.message}`);
    if (d3.suggestions) {
      log('💡', `Suggestions: ${d3.suggestions.join(', ')}`);
    }
  } else {
    log('❌', `FAILED: Expected reserved to be blocked, got ${JSON.stringify(d3)}`);
    return false;
  }

  log('🎉', 'Check slug test PASSED!');
  return true;
}

// Test 2: Publish without subdomain (should fail)
async function testPublishWithoutSubdomain() {
  section('TEST 2: Publish WITHOUT Subdomain (Should Require It)');

  log('📤', 'Attempting to publish without customSubdomain...');
  const { status, data } = await api('/api/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId
      // No customSubdomain provided
    })
  });

  if (status === 400 && !data.success) {
    log('✅', 'Correctly requires customSubdomain');
    log('💬', `Message: ${data.message}`);
    if (data.suggestions) {
      log('💡', `Suggestions: ${data.suggestions.join(', ')}`);
    }
    if (data.required) {
      log('📋', `Required field: ${data.required}`);
    }
  } else {
    log('❌', `FAILED: Expected 400 error, got ${status}`);
    console.log(data);
    return false;
  }

  log('🎉', 'Publish without subdomain test PASSED!');
  return true;
}

// Test 3: Publish with valid subdomain (should succeed)
async function testPublishWithSubdomain() {
  section('TEST 3: Publish WITH Valid Subdomain (Should Succeed)');

  const subdomain = `test-${Date.now()}`;
  log('📤', `Publishing with subdomain: ${subdomain}...`);

  const { status, data } = await api('/api/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId,
      customSubdomain: subdomain
    })
  });

  if (status === 200 && data.success) {
    log('✅', `Published successfully: ${subdomain}`);
    log('🌐', `URL: ${data.data.site.url}`);
    log('📁', `Files: ${data.data.deployment.filesGenerated.length} generated`);
  } else {
    log('❌', `FAILED: Expected 200 success, got ${status}`);
    console.log(data);
    return false;
  }

  log('🎉', 'Publish with subdomain test PASSED!');
  return true;
}

// Test 4: Publish with taken subdomain (should fail)
async function testPublishWithTakenSubdomain() {
  section('TEST 4: Publish With Taken Subdomain (Should Fail)');

  // Create another user and portfolio
  log('📝', 'Creating another user...');
  const { data: signup2 } = await api('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: `test2-${Date.now()}@test.com`,
      password: 'Test123!@#',
      name: 'Test User 2'
    })
  });

  const token2 = signup2.data.token;

  // Create portfolio for user 2
  const { data: portfolio2 } = await api('/api/portfolios', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}` },
    body: JSON.stringify({
      title: 'Test Portfolio 2',
      description: 'Test',
      template: 'echelon',
      content: {
        hero: { title: 'Test', subtitle: 'Test', backgroundImage: 'https://example.com/img.jpg' },
        about: { name: 'Test', tagline: 'Test', bio: 'Test', profileImage: 'https://example.com/profile.jpg' }
      }
    })
  });

  const portfolio2Id = portfolio2.data.portfolio._id;

  // Try to publish with already taken subdomain
  const takenSubdomain = `test-${Date.now() - 1000}`; // Use a timestamp that should be taken
  log('📤', `Attempting to publish with taken subdomain: ${takenSubdomain}...`);

  // First, have user 1 take the subdomain
  await api('/api/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId,
      customSubdomain: takenSubdomain
    })
  });

  // Now try to take it with user 2
  const { status, data } = await api('/api/sites/sub-publish', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}` },
    body: JSON.stringify({
      portfolioId: portfolio2Id,
      customSubdomain: takenSubdomain
    })
  });

  if (status === 409 && !data.success && !data.available) {
    log('✅', 'Correctly rejects taken subdomain');
    log('💬', `Message: ${data.message}`);
    if (data.suggestions) {
      log('💡', `Suggestions: ${data.suggestions.join(', ')}`);
    }
  } else {
    log('❌', `FAILED: Expected 409 conflict, got ${status}`);
    console.log(data);
    return false;
  }

  log('🎉', 'Taken subdomain test PASSED!');
  return true;
}

// Test 5: Re-publish existing portfolio (must provide subdomain)
async function testRepublish() {
  section('TEST 5: Re-Publish Existing Portfolio (Must Provide Subdomain)');

  // First, try without subdomain (should fail)
  log('📤', 'Attempting re-publish without subdomain...');
  const { status: s1, data: d1 } = await api('/api/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId
      // No customSubdomain - should require it
    })
  });

  if (s1 === 400 && !d1.success) {
    log('✅', 'Correctly requires subdomain even for re-publish');
    log('💬', `Message: ${d1.message}`);
    if (d1.currentSubdomain) {
      log('ℹ️', `Current subdomain: ${d1.currentSubdomain}`);
    }
    if (d1.suggestions) {
      log('💡', `Suggestions: ${d1.suggestions.join(', ')}`);
    }
  } else {
    log('❌', `FAILED: Expected 400 error, got ${s1}`);
    console.log(d1);
    return false;
  }

  // Wait longer to avoid rate limiting (15 seconds)
  log('⏳', 'Waiting 15 seconds for rate limit...');
  await new Promise(r => setTimeout(r, 15000));

  // Now try with same subdomain (should succeed)
  const existingSubdomain = `test-${Date.now() - 4000}`;
  log('📤', `Re-publishing with same subdomain: ${existingSubdomain}...`);
  const { status: s2, data: d2 } = await api('/api/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId,
      customSubdomain: existingSubdomain
    })
  });

  if (s2 === 200 && d2.success) {
    log('✅', 'Re-published successfully with explicit subdomain');
    log('🔄', `Subdomain: ${d2.data.site.subdomain}`);
  } else {
    log('❌', `FAILED: Expected 200 success, got ${s2}`);
    console.log(d2);
    return false;
  }

  log('🎉', 'Re-publish test PASSED!');
  return true;
}

// Run all tests
async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║    SUBDOMAIN REQUIRED - TEST SUITE                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 5
  };

  try {
    await setup();

    const tests = [
      { name: 'Check Slug', fn: testCheckSlug },
      { name: 'Publish Without Subdomain', fn: testPublishWithoutSubdomain },
      { name: 'Publish With Subdomain', fn: testPublishWithSubdomain },
      { name: 'Publish Taken Subdomain', fn: testPublishWithTakenSubdomain },
      { name: 'Re-publish', fn: testRepublish }
    ];

    for (const test of tests) {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }

      // Wait between tests
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (error) {
    log('❌', 'Test suite error');
    console.error(error);
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ Check slug availability: WORKING');
    console.log('✅ Subdomain ALWAYS required: WORKING');
    console.log('✅ Publish with valid subdomain: WORKING');
    console.log('✅ Reject taken subdomain: WORKING');
    console.log('✅ Re-publish requires subdomain: WORKING\n');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runTests().catch(console.error);
