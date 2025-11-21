/**
 * Admin Dashboard Stats Test
 * Tests the admin dashboard statistics endpoint
 * Verifies that test users are properly excluded from stats
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const TEST_CONFIG = {
  // Test users to create (should be excluded from stats)
  testUsers: [
    { name: 'Test User', email: 'test@example.com', password: 'test123456' },
    { name: 'Regular Name', email: 'testuser@gmail.com', password: 'test123456' },
    { name: 'Valid User', email: 'user1@example.com', password: 'test123456' }
  ],
  // Real users to create (should be included in stats)
  realUsers: [
    { name: 'John Doe', email: 'john@example.com', password: 'test123456' },
    { name: 'Jane Smith', email: 'jane@example.com', password: 'test123456' }
  ],
  adminUser: {
    name: 'Admin User',
    email: 'admin@aurea.com',
    password: 'admin123456'
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to print test results
function logTest(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ PASS: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
}

// Helper function to create a user
async function createUser(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(`⚠️  User ${userData.email} may already exist`);
    }
    return data;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

// Helper function to login
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error(`Error logging in as ${email}:`, error.message);
    return null;
  }
}

// Helper function to manually set admin role
async function setUserAsAdmin(userId) {
  try {
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI);

    const User = (await import('../src/models/User.js')).default;
    await User.findByIdAndUpdate(userId, { role: 'admin' });

    await mongoose.default.disconnect();
    console.log('✅ User promoted to admin');
  } catch (error) {
    console.error('Error setting user as admin:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('\n🧪 Starting Admin Dashboard Stats Tests\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create test users (should be excluded)
    console.log('\n📝 Step 1: Creating test users (should be excluded from stats)...');
    for (const user of TEST_CONFIG.testUsers) {
      await createUser(user);
    }

    // Step 2: Create real users (should be included)
    console.log('\n📝 Step 2: Creating real users (should be included in stats)...');
    for (const user of TEST_CONFIG.realUsers) {
      await createUser(user);
    }

    // Step 3: Create admin user
    console.log('\n📝 Step 3: Creating admin user...');
    const adminSignupResult = await createUser(TEST_CONFIG.adminUser);

    if (adminSignupResult && adminSignupResult.data && adminSignupResult.data.user) {
      await setUserAsAdmin(adminSignupResult.data.user._id);
    }

    // Step 4: Login as admin
    console.log('\n📝 Step 4: Logging in as admin...');
    const adminToken = await login(TEST_CONFIG.adminUser.email, TEST_CONFIG.adminUser.password);

    if (!adminToken) {
      console.error('❌ Failed to get admin token. Cannot proceed with tests.');
      return;
    }
    console.log('✅ Admin login successful');

    // Step 5: Test the dashboard stats endpoint
    console.log('\n📝 Step 5: Testing admin dashboard stats endpoint...');
    const statsResponse = await fetch(`${API_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      const errorData = await statsResponse.json();
      console.log('❌ Stats endpoint returned error:', errorData);
      logTest('Dashboard Stats Endpoint', false, JSON.stringify(errorData));
      return;
    }

    const statsData = await statsResponse.json();
    console.log('\n📊 Dashboard Statistics:');
    console.log(JSON.stringify(statsData.data, null, 2));

    // Step 6: Verify stats
    console.log('\n📝 Step 6: Verifying stats...');

    // Test 1: Response structure
    logTest(
      'Response has success=true',
      statsData.success === true,
      `Expected true, got ${statsData.success}`
    );

    // Test 2: Data structure
    const stats = statsData.data;
    logTest(
      'Stats has users object',
      stats && typeof stats.users === 'object',
      `Users: ${JSON.stringify(stats?.users)}`
    );

    logTest(
      'Stats has portfolios object',
      stats && typeof stats.portfolios === 'object',
      `Portfolios: ${JSON.stringify(stats?.portfolios)}`
    );

    logTest(
      'Stats has metadata',
      stats && stats.metadata && Array.isArray(stats.metadata.excludedPatterns),
      `Metadata: ${JSON.stringify(stats?.metadata)}`
    );

    // Test 3: Verify test users are excluded
    // We created 3 test users, 2 real users, 1 admin
    // Total should be 3 (2 real + 1 admin), NOT 6
    logTest(
      'Test users are excluded from total count',
      stats && stats.users && stats.users.total <= 3,
      `Expected ≤3 users, got ${stats?.users?.total} (should exclude 3 test users)`
    );

    // Test 4: Excluded patterns are documented
    logTest(
      'Excluded patterns include "test" in name',
      stats?.metadata?.excludedPatterns?.some(p => p.includes('test') && p.includes('name')),
      `Patterns: ${JSON.stringify(stats?.metadata?.excludedPatterns)}`
    );

    logTest(
      'Excluded patterns include "test" in email',
      stats?.metadata?.excludedPatterns?.some(p => p.includes('test') && p.includes('email')),
      `Patterns: ${JSON.stringify(stats?.metadata?.excludedPatterns)}`
    );

    logTest(
      'Excluded patterns include user1@example.com',
      stats?.metadata?.excludedPatterns?.some(p => p.includes('user1@example.com')),
      `Patterns: ${JSON.stringify(stats?.metadata?.excludedPatterns)}`
    );

    // Test 5: Test authorization (non-admin should fail)
    console.log('\n📝 Step 7: Testing authorization (non-admin should fail)...');
    const regularToken = await login(TEST_CONFIG.realUsers[0].email, TEST_CONFIG.realUsers[0].password);

    const unauthorizedResponse = await fetch(`${API_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${regularToken}`,
        'Content-Type': 'application/json'
      }
    });

    logTest(
      'Non-admin users are denied access',
      unauthorizedResponse.status === 403,
      `Expected 403, got ${unauthorizedResponse.status}`
    );

    // Test 6: Test without token (should fail)
    const noTokenResponse = await fetch(`${API_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    logTest(
      'Requests without token are denied',
      noTokenResponse.status === 401,
      `Expected 401, got ${noTokenResponse.status}`
    );

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    testResults.errors.push({ test: 'General', details: error.message });
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.test}: ${err.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
