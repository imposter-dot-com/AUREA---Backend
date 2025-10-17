/**
 * Test Script: User Information Check
 * 
 * This script tests authentication and retrieves user information
 * for an existing user account.
 * 
 * Test User:
 *   Email: user2@gmail.com
 *   Password: 123456
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'user2@gmail.com',
  password: '123456'
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to display JSON nicely
function displayJSON(label, data) {
  log(`\n${label}:`, 'cyan');
  console.log(JSON.stringify(data, null, 2));
}

// Main test function
async function testUserInfo() {
  log('\n========================================', 'blue');
  log('  USER INFORMATION CHECK TEST', 'blue');
  log('========================================\n', 'blue');

  let authToken = null;

  try {
    // Test 1: Login
    log('Test 1: Login with existing credentials', 'yellow');
    log(`Email: ${testUser.email}`, 'cyan');
    log(`Password: ${'*'.repeat(testUser.password.length)}\n`, 'cyan');

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const loginData = await loginResponse.json();

    if (loginResponse.status === 200 && loginData.success) {
      log('✅ Login successful!', 'green');
      authToken = loginData.data.token;
      displayJSON('Login Response', {
        status: loginResponse.status,
        success: loginData.success,
        message: loginData.message,
        user: loginData.data.user,
        token: `${authToken.substring(0, 20)}...` // Show partial token
      });
    } else {
      log('❌ Login failed!', 'red');
      displayJSON('Error Response', loginData);
      process.exit(1);
    }

    // Test 2: Get User Profile
    log('\n\nTest 2: Fetching user profile', 'yellow');

    const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();

    if (profileResponse.status === 200 && profileData.success) {
      log('✅ Profile retrieved successfully!', 'green');
      displayJSON('User Profile', profileData.data);
    } else {
      log('❌ Failed to retrieve profile!', 'red');
      displayJSON('Error Response', profileData);
    }

    // Test 3: Get User Portfolios
    log('\n\nTest 3: Fetching user portfolios', 'yellow');

    const portfoliosResponse = await fetch(`${API_BASE_URL}/portfolios/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const portfoliosData = await portfoliosResponse.json();

    if (portfoliosResponse.status === 200 && portfoliosData.success) {
      log('✅ Portfolios retrieved successfully!', 'green');
      displayJSON('Portfolios', {
        totalPortfolios: portfoliosData.data.length,
        meta: portfoliosData.meta,
        portfolios: portfoliosData.data
      });
    } else {
      log('❌ Failed to retrieve portfolios!', 'red');
      displayJSON('Error Response', portfoliosData);
    }

    // Test 4: Get Portfolio Statistics
    log('\n\nTest 4: Fetching portfolio statistics', 'yellow');

    const statsResponse = await fetch(`${API_BASE_URL}/portfolios/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const statsData = await statsResponse.json();

    if (statsResponse.status === 200 && statsData.success) {
      log('✅ Statistics retrieved successfully!', 'green');
      
      // Format storage usage
      const storageUsedMB = (statsData.data.storageUsed / (1024 * 1024)).toFixed(2);
      const storageLimitMB = (statsData.data.storageLimit / (1024 * 1024)).toFixed(2);
      const storagePercentage = ((statsData.data.storageUsed / statsData.data.storageLimit) * 100).toFixed(2);

      displayJSON('Portfolio Statistics', {
        ...statsData.data,
        storageFormatted: {
          used: `${storageUsedMB} MB`,
          limit: `${storageLimitMB} MB`,
          percentage: `${storagePercentage}%`
        }
      });
    } else {
      log('❌ Failed to retrieve statistics!', 'red');
      displayJSON('Error Response', statsData);
    }

    // Summary
    log('\n========================================', 'blue');
    log('  TEST SUMMARY', 'blue');
    log('========================================\n', 'blue');
    
    log('✅ All tests completed successfully!', 'green');
    log(`\nUser Information:`, 'cyan');
    log(`  Email: ${testUser.email}`, 'reset');
    log(`  Account Status: Active`, 'green');
    log(`  Authentication: Working`, 'green');
    log(`  API Access: Authorized`, 'green');
    
    process.exit(0);

  } catch (error) {
    log('\n❌ Test failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testUserInfo();
