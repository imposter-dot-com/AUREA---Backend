/**
 * User Profile CRUD Operations Test Script
 * 
 * This script tests all user profile operations that a user can perform:
 * 1. Login
 * 2. Get current profile
 * 3. Update name
 * 4. Update email
 * 5. Change password
 * 6. Delete account (commented out by default)
 * 
 * Test User: user2@example.com
 * Password: password123
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
  cyan: '\x1b[36m'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    };
    
    // Only add body if it exists and method is not GET
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
const testUser = {
  email: 'user2@example.com',
  password: '123456',
  newEmail: 'user2_updated@example.com',
  newPassword: '12NewPassword1233456',
  newName: 'Updated User Name'
};

/**
 * Step 1: Login
 */
async function testLogin() {
  printSection('STEP 1: User Login');
  
  console.log(`${colors.blue}Attempting login with:${colors.reset}`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Password: ${testUser.password}`);
  
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (result.status === 200 && result.data.success) {
    authToken = result.data.data.token;
    printResult(true, 'Login successful!');
    console.log(`${colors.yellow}Token:${colors.reset} ${authToken.substring(0, 50)}...`);
    console.log(`${colors.yellow}User:${colors.reset}`, result.data.data.user);
    return true;
  } else {
    printResult(false, 'Login failed!', result.data);
    return false;
  }
}

/**
 * Step 2: Get Current User Profile
 */
async function testGetProfile() {
  printSection('STEP 2: Get Current User Profile');
  
  const result = await apiRequest('/api/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Profile retrieved successfully!');
    console.log('\n' + `${colors.yellow}Profile Data:${colors.reset}`);
    console.log(JSON.stringify(result.data.data, null, 2));
    return result.data.data;
  } else {
    printResult(false, 'Failed to get profile!', result.data);
    return null;
  }
}

/**
 * Step 3: Update User Name
 */
async function testUpdateName() {
  printSection('STEP 3: Update User Name');
  
  console.log(`${colors.blue}Updating name to:${colors.reset} ${testUser.newName}`);
  
  const result = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: testUser.newName
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Name updated successfully!');
    console.log(`${colors.yellow}Updated User:${colors.reset}`, result.data.data);
    return true;
  } else {
    printResult(false, 'Failed to update name!', result.data);
    return false;
  }
}

/**
 * Step 4: Update Email
 */
async function testUpdateEmail() {
  printSection('STEP 4: Update Email Address');
  
  console.log(`${colors.blue}Updating email from:${colors.reset} ${testUser.email}`);
  console.log(`${colors.blue}                 to:${colors.reset} ${testUser.newEmail}`);
  
  const result = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      email: testUser.newEmail
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Email updated successfully!');
    console.log(`${colors.yellow}Updated User:${colors.reset}`, result.data.data);
    testUser.email = testUser.newEmail; // Update for future tests
    return true;
  } else {
    printResult(false, 'Failed to update email!', result.data);
    return false;
  }
}

/**
 * Step 5: Change Password
 */
async function testChangePassword() {
  printSection('STEP 5: Change Password');
  
  console.log(`${colors.blue}Changing password...${colors.reset}`);
  console.log(`  Current Password: ${testUser.password}`);
  console.log(`  New Password: ${testUser.newPassword}`);
  
  const result = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      currentPassword: testUser.password,
      newPassword: testUser.newPassword
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Password changed successfully!');
    console.log(`${colors.yellow}Updated User:${colors.reset}`, result.data.data);
    testUser.password = testUser.newPassword; // Update for future tests
    return true;
  } else {
    printResult(false, 'Failed to change password!', result.data);
    return false;
  }
}

/**
 * Step 6: Test New Login with Updated Credentials
 */
async function testLoginWithNewCredentials() {
  printSection('STEP 6: Test Login with New Credentials');
  
  console.log(`${colors.blue}Testing login with updated credentials:${colors.reset}`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Password: ${testUser.password}`);
  
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (result.status === 200 && result.data.success) {
    authToken = result.data.data.token; // Update token
    printResult(true, 'Login with new credentials successful!');
    console.log(`${colors.yellow}New Token:${colors.reset} ${authToken.substring(0, 50)}...`);
    return true;
  } else {
    printResult(false, 'Login with new credentials failed!', result.data);
    return false;
  }
}

/**
 * Step 7: Revert Changes (Update back to original)
 */
async function testRevertChanges() {
  printSection('STEP 7: Revert Changes (Cleanup)');
  
  console.log(`${colors.blue}Reverting changes to original values...${colors.reset}`);
  
  // Revert email
  const emailResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      email: 'user2@example.com'
    })
  });

  // Revert password
  const passwordResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      currentPassword: testUser.newPassword,
      newPassword: testUser.password
    })
  });

  // Revert name
  const nameResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: 'User Two'
    })
  });

  if (emailResult.data.success && passwordResult.data.success && nameResult.data.success) {
    printResult(true, 'Changes reverted successfully!');
    console.log(`${colors.yellow}Account restored to original state${colors.reset}`);
    return true;
  } else {
    printResult(false, 'Failed to revert some changes!');
    return false;
  }
}

/**
 * Step 8: Delete Account (ACTIVE)
 * WARNING: This will permanently delete the account!
 */
async function testDeleteAccount() {
  printSection('STEP 8: Delete Account');
  
  console.log(`${colors.red}⚠️  WARNING: This will permanently delete the account!${colors.reset}`);
  console.log(`${colors.yellow}This step is active and will delete the account.${colors.reset}`);
  console.log(`Proceeding with account deletion...`);
  
  const result = await apiRequest('/api/users/profile', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      password: testUser.password // After revert, password is back to original
    })
  });

  if (result.status === 200 && result.data.success) {
    printResult(true, 'Account deleted successfully!');
    console.log(result.data);
    return true;
  } else {
    printResult(false, 'Failed to delete account!', result.data);
    return false;
  }
}

/**
 * Step 9: Re-create Account After Deletion
 */
async function testRecreateAccount() {
  printSection('STEP 9: Re-create Account After Deletion');
  const result = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'User Two',
      email: 'user2@example.com', // Use original email
      password: '123456' // Use original password
    })
  });
  if (result.status === 201 && result.data.success) {
    printResult(true, 'Account re-created successfully!', result.data);
    return true;
  } else {
    printResult(false, 'Failed to re-create account!', result.data);
    return false;
  }
}

/**
 * Test Validation Errors
 */
async function testValidationErrors() {
  printSection('BONUS: Test Validation Errors');
  
  console.log(`${colors.blue}Testing invalid email format...${colors.reset}`);
  const invalidEmailResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      email: 'invalid-email'
    })
  });

  if (invalidEmailResult.status === 400) {
    printResult(true, 'Validation correctly rejected invalid email!');
    console.log(JSON.stringify(invalidEmailResult.data, null, 2));
  } else {
    printResult(false, 'Validation did not catch invalid email!');
  }

  console.log(`\n${colors.blue}Testing short password...${colors.reset}`);
  const shortPasswordResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      currentPassword: testUser.password,
      newPassword: '123'
    })
  });

  if (shortPasswordResult.status === 400) {
    printResult(true, 'Validation correctly rejected short password!');
    console.log(JSON.stringify(shortPasswordResult.data, null, 2));
  } else {
    printResult(false, 'Validation did not catch short password!');
  }

  console.log(`\n${colors.blue}Testing password change without current password...${colors.reset}`);
  const noCurrentPasswordResult = await apiRequest('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      newPassword: 'NewPassword123'
    })
  });

  if (noCurrentPasswordResult.status === 400) {
    printResult(true, 'Validation correctly rejected password change without current password!');
    console.log(JSON.stringify(noCurrentPasswordResult.data, null, 2));
  } else {
    printResult(false, 'Validation did not catch missing current password!');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     USER PROFILE CRUD OPERATIONS TEST SUITE               ║');
  console.log('║     Testing user: user2@example.com                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check if server is running
  console.log(`${colors.blue}Checking server connection...${colors.reset}`);
  try {
    const healthCheck = await apiRequest('/health', { method: 'GET' });
    if (healthCheck.data.success) {
      printResult(true, `Server is running at ${API_BASE_URL}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cannot connect to server at ${API_BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the server first with: npm run dev${colors.reset}`);
    process.exit(1);
  }

  const results = {
    login: false,
    getProfile: false,
    updateName: false,
    updateEmail: false,
    changePassword: false,
    loginWithNew: false,
    revertChanges: false,
    deleteAccount: false,
    recreateAccount: false
  };

  try {
    // Step 1: Login
    results.login = await testLogin();
    if (!results.login) {
      console.log(`\n${colors.red}Cannot continue without successful login!${colors.reset}`);
      return;
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Get Profile
    results.getProfile = await testGetProfile();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Update Name
    results.updateName = await testUpdateName();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Update Email
    results.updateEmail = await testUpdateEmail();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 5: Change Password
    results.changePassword = await testChangePassword();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 6: Test Login with New Credentials
    results.loginWithNew = await testLoginWithNewCredentials();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 7: Revert Changes
    results.revertChanges = await testRevertChanges();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Bonus: Test Validation Errors
    await testValidationErrors();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 8: Delete Account (now active)
    results.deleteAccount = await testDeleteAccount();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 9: Re-create Account
    results.recreateAccount = await testRecreateAccount();
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error(`\n${colors.red}Test execution error:${colors.reset}`, error);
  }

  // Print summary
  printSection('TEST SUMMARY');
  
  const tests = [
    { name: 'Login', result: results.login },
    { name: 'Get Profile', result: results.getProfile },
    { name: 'Update Name', result: results.updateName },
    { name: 'Update Email', result: results.updateEmail },
    { name: 'Change Password', result: results.changePassword },
    { name: 'Login with New Credentials', result: results.loginWithNew },
    { name: 'Revert Changes', result: results.revertChanges },
    { name: 'Delete Account', result: results.deleteAccount },
    { name: 'Re-create Account', result: results.recreateAccount }
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
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
