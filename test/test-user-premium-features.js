/**
 * User Premium Features Test Script
 * 
 * This script tests all premium-related operations:
 * 1. User Registration
 * 2. Check Premium Status (should be false)
 * 3. Set Premium to Monthly
 * 4. Verify Premium Status
 * 5. Set Premium to Yearly
 * 6. Set Premium to Lifetime
 * 7. Remove Premium Status
 * 8. Get User Premium Info (Admin)
 * 9. User CRUD with Premium Info
 * 10. Cleanup (Optional)
 */

const API_BASE_URL = 'http://localhost:5000';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    };
    
    if (options.body && options.method !== 'GET') {
      fetchOptions.body = options.body;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`${colors.red}Request Timeout: Server not responding at ${API_BASE_URL}${colors.reset}`);
      console.error(`${colors.yellow}Make sure the server is running with: npm run dev${colors.reset}`);
    } else {
      console.error(`${colors.red}Request Error:${colors.reset}`, error.message);
    }
    throw error;
  }
}

// Helper function to print section headers
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(60));
}

// Helper function to print results
function printResult(success, message, data = null) {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${icon} ${color}${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Test variables
let authToken = null;
let userId = null;
const testUser = {
  name: 'Premium Test User',
  email: `premiumtest${Date.now()}@example.com`,
  password: 'testPassword123'
};

/**
 * Step 1: Register a new user
 */
async function testRegisterUser() {
  printSection('STEP 1: Register New User');
  
  console.log(`${colors.blue}Registering user:${colors.reset}`);
  console.log(`  Name: ${testUser.name}`);
  console.log(`  Email: ${testUser.email}`);
  
  const result = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password
    })
  });

  if (result.status === 201 && result.data.success) {
    authToken = result.data.data.token;
    userId = result.data.data.user._id;
    printResult(true, 'User registered successfully!');
    console.log(`${colors.yellow}User ID:${colors.reset} ${userId}`);
    console.log(`${colors.yellow}Token:${colors.reset} ${authToken.substring(0, 50)}...`);
    return true;
  } else {
    printResult(false, 'Registration failed!', result.data);
    return false;
  }
}

/**
 * Step 2: Get current user profile
 */
async function testGetProfile() {
  printSection('STEP 2: Get User Profile');
  
  const result = await apiRequest('/api/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Profile retrieved successfully!');
    console.log(`\n${colors.yellow}Profile Data:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return result.data.data;
  } else {
    printResult(false, 'Failed to get profile!', result.data);
    return null;
  }
}

/**
 * Step 3: Check initial premium status (should be false)
 */
async function testCheckInitialPremium() {
  printSection('STEP 3: Check Initial Premium Status');
  
  console.log(`${colors.blue}Checking premium status (should be false)...${colors.reset}`);
  
  const result = await apiRequest('/api/users/premium/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Premium status checked!');
    console.log(`\n${colors.yellow}Premium Info:${colors.reset}`);
    console.log(`  Is Premium: ${result.data.data.isPremium}`);
    console.log(`  Premium Type: ${result.data.data.premiumType}`);
    console.log(`  Days Remaining: ${result.data.data.daysRemaining}`);
    
    if (!result.data.data.isPremium) {
      console.log(`${colors.green}✓ Correctly shows as non-premium${colors.reset}`);
    }
    return true;
  } else {
    printResult(false, 'Failed to check premium status!', result.data);
    return false;
  }
}

/**
 * Step 4: Set user as Monthly Premium
 */
async function testSetMonthlyPremium() {
  printSection('STEP 4: Set Monthly Premium');
  
  console.log(`${colors.blue}Setting user as monthly premium...${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}/premium`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      premiumType: 'monthly',
      duration: 30
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Monthly premium set successfully!');
    console.log(`\n${colors.yellow}Premium Info:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    printResult(false, 'Failed to set monthly premium!', result.data);
    return false;
  }
}

/**
 * Step 5: Verify premium status after setting
 */
async function testVerifyPremiumActive() {
  printSection('STEP 5: Verify Premium is Active');
  
  const result = await apiRequest('/api/users/premium/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Premium status verified!');
    console.log(`\n${colors.yellow}Premium Details:${colors.reset}`);
    console.log(`  Is Premium: ${result.data.data.isPremium}`);
    console.log(`  Premium Type: ${result.data.data.premiumType}`);
    console.log(`  Start Date: ${result.data.data.premiumStartDate}`);
    console.log(`  End Date: ${result.data.data.premiumEndDate}`);
    console.log(`  Days Remaining: ${result.data.data.daysRemaining}`);
    
    if (result.data.data.isPremium && result.data.data.premiumType === 'monthly') {
      console.log(`${colors.green}✓ Premium is active and type is monthly${colors.reset}`);
    }
    return true;
  } else {
    printResult(false, 'Failed to verify premium!', result.data);
    return false;
  }
}

/**
 * Step 6: Change to Yearly Premium
 */
async function testSetYearlyPremium() {
  printSection('STEP 6: Change to Yearly Premium');
  
  console.log(`${colors.blue}Changing to yearly premium...${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}/premium`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      premiumType: 'yearly',
      duration: 365
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Yearly premium set successfully!');
    console.log(`\n${colors.yellow}Premium Info:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    printResult(false, 'Failed to set yearly premium!', result.data);
    return false;
  }
}

/**
 * Step 7: Set to Lifetime Premium
 */
async function testSetLifetimePremium() {
  printSection('STEP 7: Set Lifetime Premium');
  
  console.log(`${colors.blue}Setting to lifetime premium...${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}/premium`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      premiumType: 'lifetime'
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Lifetime premium set successfully!');
    console.log(`\n${colors.yellow}Premium Info:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    
    if (result.data.data.premiumType === 'lifetime') {
      console.log(`${colors.green}✓ Premium type is now lifetime${colors.reset}`);
    }
    return true;
  } else {
    printResult(false, 'Failed to set lifetime premium!', result.data);
    return false;
  }
}

/**
 * Step 8: Get premium status via admin endpoint
 */
async function testGetUserPremiumAdmin() {
  printSection('STEP 8: Get User Premium (Admin Endpoint)');
  
  console.log(`${colors.blue}Fetching premium info via admin endpoint...${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}/premium`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Admin premium info retrieved!');
    console.log(`\n${colors.yellow}Admin Premium Info:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    printResult(false, 'Failed to get admin premium info!', result.data);
    return false;
  }
}

/**
 * Step 9: Remove premium status
 */
async function testRemovePremium() {
  printSection('STEP 9: Remove Premium Status');
  
  console.log(`${colors.blue}Removing premium status...${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}/premium`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Premium status removed successfully!');
    console.log(`\n${colors.yellow}Premium Info After Removal:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    printResult(false, 'Failed to remove premium!', result.data);
    return false;
  }
}

/**
 * Step 10: Verify premium is removed
 */
async function testVerifyPremiumRemoved() {
  printSection('STEP 10: Verify Premium Removed');
  
  const result = await apiRequest('/api/users/premium/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Premium status verified!');
    console.log(`\n${colors.yellow}Premium Info:${colors.reset}`);
    console.log(`  Is Premium: ${result.data.data.isPremium}`);
    console.log(`  Premium Type: ${result.data.data.premiumType}`);
    
    if (!result.data.data.isPremium && result.data.data.premiumType === 'none') {
      console.log(`${colors.green}✓ Premium successfully removed${colors.reset}`);
    }
    return true;
  } else {
    printResult(false, 'Failed to verify premium removal!', result.data);
    return false;
  }
}

/**
 * Step 11: Test Get All Users
 */
async function testGetAllUsers() {
  printSection('STEP 11: Get All Users (Admin)');
  
  console.log(`${colors.blue}Fetching all users...${colors.reset}`);
  
  const result = await apiRequest('/api/users?page=1&limit=5', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Users list retrieved!');
    console.log(`\n${colors.yellow}Users Info:${colors.reset}`);
    console.log(`  Total Users: ${result.data.pagination.total}`);
    console.log(`  Returned: ${result.data.data.length} users`);
    console.log(`  Page: ${result.data.pagination.page}/${result.data.pagination.pages}`);
    return true;
  } else {
    printResult(false, 'Failed to get users!', result.data);
    return false;
  }
}

/**
 * Step 12: Get User by ID
 */
async function testGetUserById() {
  printSection('STEP 12: Get User By ID (Admin)');
  
  console.log(`${colors.blue}Fetching user by ID: ${userId}${colors.reset}`);
  
  const result = await apiRequest(`/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'User retrieved by ID!');
    console.log(`\n${colors.yellow}User Details:${colors.reset}`);
    console.log(`  Name: ${result.data.data.name}`);
    console.log(`  Email: ${result.data.data.email}`);
    console.log(`  Stats:`, result.data.data.stats);
    return true;
  } else {
    printResult(false, 'Failed to get user by ID!', result.data);
    return false;
  }
}

/**
 * Optional: Delete test user
 */
async function testDeleteUser() {
  printSection('CLEANUP: Delete Test User (Optional)');
  
  console.log(`${colors.yellow}⚠️  This will permanently delete the test user${colors.reset}`);
  console.log(`${colors.blue}Deleting user...${colors.reset}`);
  
  const result = await apiRequest('/api/users/profile', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      password: testUser.password
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Test user deleted successfully!');
    console.log(result.data);
    return true;
  } else {
    printResult(false, 'Failed to delete user!', result.data);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     PREMIUM FEATURES TEST SUITE                           ║');
  console.log('║     Testing User Management & Premium Status              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check if server is running
  console.log(`${colors.blue}Checking server connection...${colors.reset}`);
  try {
    const healthCheck = await apiRequest('/health', { method: 'GET' });
    if (healthCheck.data.success) {
      printResult(true, `Server is running at ${API_BASE_URL}`);
      console.log(`${colors.yellow}Environment: ${healthCheck.data.environment}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cannot connect to server at ${API_BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the server first with: npm run dev${colors.reset}`);
    process.exit(1);
  }

  const results = {
    register: false,
    getProfile: false,
    checkInitial: false,
    setMonthly: false,
    verifyActive: false,
    setYearly: false,
    setLifetime: false,
    getAdminPremium: false,
    removePremium: false,
    verifyRemoved: false,
    getAllUsers: false,
    getUserById: false,
    deleteUser: false
  };

  try {
    // Run all tests
    results.register = await testRegisterUser();
    if (!results.register) {
      console.log(`\n${colors.red}Cannot continue without successful registration!${colors.reset}`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    results.getProfile = await testGetProfile();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.checkInitial = await testCheckInitialPremium();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.setMonthly = await testSetMonthlyPremium();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.verifyActive = await testVerifyPremiumActive();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.setYearly = await testSetYearlyPremium();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.setLifetime = await testSetLifetimePremium();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.getAdminPremium = await testGetUserPremiumAdmin();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.removePremium = await testRemovePremium();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.verifyRemoved = await testVerifyPremiumRemoved();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.getAllUsers = await testGetAllUsers();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    results.getUserById = await testGetUserById();
    
    // Optional: Delete test user
    await new Promise(resolve => setTimeout(resolve, 500));
    results.deleteUser = await testDeleteUser();

  } catch (error) {
    console.error(`\n${colors.red}Test execution error:${colors.reset}`, error);
  }

  // Print summary
  printSection('TEST SUMMARY');
  
  const tests = [
    { name: 'Register User', result: results.register },
    { name: 'Get Profile', result: results.getProfile },
    { name: 'Check Initial Premium (False)', result: results.checkInitial },
    { name: 'Set Monthly Premium', result: results.setMonthly },
    { name: 'Verify Premium Active', result: results.verifyActive },
    { name: 'Set Yearly Premium', result: results.setYearly },
    { name: 'Set Lifetime Premium', result: results.setLifetime },
    { name: 'Get Admin Premium Info', result: results.getAdminPremium },
    { name: 'Remove Premium', result: results.removePremium },
    { name: 'Verify Premium Removed', result: results.verifyRemoved },
    { name: 'Get All Users', result: results.getAllUsers },
    { name: 'Get User By ID', result: results.getUserById },
    { name: 'Delete Test User', result: results.deleteUser }
  ];

  const passed = tests.filter(t => t.result).length;
  const total = tests.length;

  console.log('\nTest Results:');
  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌';
    const color = test.result ? colors.green : colors.red;
    console.log(`  ${icon} ${color}${test.name}${colors.reset}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`${colors.bright}Total: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Please review the output above.${colors.reset}`);
  }

  console.log('\n' + `${colors.cyan}Test completed at: ${new Date().toLocaleString()}${colors.reset}`);
  console.log('─'.repeat(60) + '\n');
  
  if (results.deleteUser) {
    console.log(`${colors.green}✓ Test user was deleted - cleanup complete${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}Note: Test user was NOT deleted${colors.reset}`);
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${testUser.email}\n`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
