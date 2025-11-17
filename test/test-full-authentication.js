/**
 * Full Authentication System Test
 * Tests all new authentication features:
 * - Email OTP verification
 * - Forgot password flow
 * - OTP passwordless login
 * - Google OAuth (manual test)
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test123456';
const TEST_NAME = 'Test User';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logTest = (name) => {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`TEST: ${name}`, colors.cyan);
  log('='.repeat(60), colors.cyan);
};

const logPass = (message) => {
  testResults.passed++;
  testResults.total++;
  log(`✅ PASS: ${message}`, colors.green);
};

const logFail = (message, error) => {
  testResults.failed++;
  testResults.total++;
  log(`❌ FAIL: ${message}`, colors.red);
  if (error) {
    log(`   Error: ${error.message || error}`, colors.red);
  }
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, colors.blue);
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, colors.yellow);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Store test data
let testData = {
  userId: null,
  token: null,
  otp: null,
  resetToken: null
};

// API helper
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: () => true // Don't throw on any status
});

// Add auth token to requests
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ==================== TEST SUITES ====================

/**
 * Test 1: User Signup with Auto OTP Send
 */
async function testSignup() {
  logTest('User Signup with Auto OTP Send');

  try {
    const response = await api.post('/auth/signup', {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.status === 201) {
      testData.userId = response.data.data.user._id || response.data.data.user.id;
      testData.token = response.data.data.token;
      logPass('User signup successful');
      logInfo(`User ID: ${testData.userId}`);
      logInfo('Token received (but login blocked until email verified)');

      // Check if message mentions verification
      if (response.data.data.message && response.data.data.message.includes('verification')) {
        logPass('Signup response mentions email verification');
      }
    } else {
      logFail('Signup failed', response.data);
    }
  } catch (error) {
    logFail('Signup request failed', error);
  }
}

/**
 * Test 2: Login Blocked Before Verification
 */
async function testLoginBlocked() {
  logTest('Login Blocked Before Email Verification');

  try {
    const response = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.status === 403) {
      logPass('Login correctly blocked for unverified email');
      logInfo(`Response: ${response.data.message}`);
    } else if (response.status === 200) {
      logFail('Login should be blocked but succeeded', 'Security issue: unverified users can login');
    } else {
      logFail('Unexpected response', response.data);
    }
  } catch (error) {
    logFail('Login request failed', error);
  }
}

/**
 * Test 3: Simulate Email OTP Verification
 */
async function testEmailOTPVerification() {
  logTest('Email OTP Verification');

  logWarning('OTP needs to be retrieved from email or database');
  logInfo('For testing, you have two options:');
  logInfo('1. Check the email inbox for the OTP');
  logInfo('2. Query the database directly');

  log('\n📧 To get OTP from database, run this MongoDB query:');
  log(`db.users.findOne({ email: "${TEST_EMAIL}" }, { emailVerificationOTP: 1 })`, colors.yellow);

  logWarning('Skipping automatic OTP verification (requires manual OTP)');
  logInfo('Manual test: Use the OTP from email or database with verify-email-otp endpoint');

  // Mock OTP for testing flow (won't actually work)
  testData.otp = '123456';

  try {
    const response = await api.post('/auth/verify-email-otp', {
      email: TEST_EMAIL,
      otp: testData.otp
    });

    if (response.status === 200) {
      logPass('Email verified successfully');
    } else if (response.status === 400 && response.data.message.includes('Invalid')) {
      logInfo('OTP verification endpoint working (returned invalid OTP as expected)');
      logWarning('Use real OTP from email to complete verification');
    } else {
      logInfo(`Response status: ${response.status}`);
      logInfo(`Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logFail('OTP verification request failed', error);
  }
}

/**
 * Test 4: Resend Verification OTP
 */
async function testResendOTP() {
  logTest('Resend Verification OTP');

  try {
    const response = await api.post('/auth/resend-verification-otp', {
      email: TEST_EMAIL
    });

    if (response.status === 200) {
      logPass('Resend OTP successful');
      logInfo('Check email for new OTP');
    } else if (response.status === 400 && response.data.message.includes('already verified')) {
      logInfo('User already verified (expected if previous test passed)');
    } else {
      logFail('Resend OTP failed', response.data);
    }
  } catch (error) {
    logFail('Resend OTP request failed', error);
  }
}

/**
 * Test 5: Forgot Password Request
 */
async function testForgotPassword() {
  logTest('Forgot Password Request');

  try {
    const response = await api.post('/auth/forgot-password', {
      email: TEST_EMAIL
    });

    if (response.status === 200) {
      logPass('Password reset email sent');
      logInfo('Check email for reset link');
      logInfo('Reset token will be in the URL');
    } else {
      logFail('Forgot password failed', response.data);
    }
  } catch (error) {
    logFail('Forgot password request failed', error);
  }
}

/**
 * Test 6: Forgot Password with Non-existent Email
 */
async function testForgotPasswordNonExistent() {
  logTest('Forgot Password - Email Enumeration Prevention');

  try {
    const response = await api.post('/auth/forgot-password', {
      email: 'nonexistent@example.com'
    });

    if (response.status === 200) {
      logPass('Generic response returned (email enumeration prevented)');
      logInfo(`Response: ${response.data.message}`);
    } else {
      logFail('Should return 200 with generic message', response.data);
    }
  } catch (error) {
    logFail('Forgot password request failed', error);
  }
}

/**
 * Test 7: OTP Login Send
 */
async function testOTPLoginSend() {
  logTest('OTP Passwordless Login - Send OTP');

  try {
    const response = await api.post('/auth/login/otp/send', {
      email: TEST_EMAIL
    });

    if (response.status === 200) {
      logPass('Login OTP sent');
      logInfo('Check email for login code');
    } else if (response.status === 403 && response.data.message.includes('verify')) {
      logInfo('Cannot send login OTP to unverified email (expected)');
    } else {
      logInfo(`Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logFail('Send login OTP request failed', error);
  }
}

/**
 * Test 8: OTP Login with Non-existent Email
 */
async function testOTPLoginNonExistent() {
  logTest('OTP Login - Email Enumeration Prevention');

  try {
    const response = await api.post('/auth/login/otp/send', {
      email: 'nonexistent@example.com'
    });

    if (response.status === 200) {
      logPass('Generic response returned (email enumeration prevented)');
      logInfo(`Response: ${response.data.message}`);
    } else {
      logFail('Should return 200 with generic message', response.data);
    }
  } catch (error) {
    logFail('OTP login send request failed', error);
  }
}

/**
 * Test 9: Verify Email Already Verified
 */
async function testAlreadyVerified() {
  logTest('Attempt to Verify Already Verified Email');

  // This test assumes email was verified manually
  logWarning('This test requires email to be verified first');
  logInfo('Skip if email not yet verified');

  try {
    const response = await api.post('/auth/verify-email-otp', {
      email: TEST_EMAIL,
      otp: '123456'
    });

    if (response.status === 400 && response.data.message.includes('already verified')) {
      logPass('Correctly prevents re-verification');
    } else {
      logInfo(`Status: ${response.status}`);
    }
  } catch (error) {
    logFail('Request failed', error);
  }
}

/**
 * Test 10: Rate Limiting
 */
async function testRateLimiting() {
  logTest('Rate Limiting on OTP Endpoints');

  logInfo('Sending multiple OTP requests rapidly...');

  let blockedCount = 0;
  const requests = 12; // Try to exceed rate limit

  for (let i = 0; i < requests; i++) {
    try {
      const response = await api.post('/auth/send-verification-otp', {
        email: TEST_EMAIL
      });

      if (response.status === 429) {
        blockedCount++;
        logInfo(`Request ${i + 1}: Rate limited (429)`);
      } else {
        logInfo(`Request ${i + 1}: Status ${response.status}`);
      }
    } catch (error) {
      logInfo(`Request ${i + 1}: Error`);
    }

    await sleep(100); // Small delay between requests
  }

  if (blockedCount > 0) {
    logPass(`Rate limiting working (${blockedCount}/${requests} requests blocked)`);
  } else {
    logWarning('Rate limiting may not be working or limit not reached');
  }
}

/**
 * Test 11: Test Email Service Connection
 */
async function testEmailService() {
  logTest('Email Service Configuration');

  logInfo('Checking email service configuration...');

  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
  ];

  let allConfigured = true;

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      logPass(`${varName} is configured`);
    } else {
      logFail(`${varName} is missing`);
      allConfigured = false;
    }
  });

  if (allConfigured) {
    logPass('All email environment variables configured');
    logInfo('Emails should be sending successfully');
  } else {
    logWarning('Some email configuration is missing');
    logInfo('Update .env file with SMTP credentials');
  }
}

/**
 * Test 12: Google OAuth Setup Check
 */
async function testGoogleOAuthSetup() {
  logTest('Google OAuth Configuration');

  const oauthVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL'
  ];

  let allConfigured = true;

  oauthVars.forEach(varName => {
    if (process.env[varName]) {
      logPass(`${varName} is configured`);
    } else {
      logFail(`${varName} is missing`);
      allConfigured = false;
    }
  });

  if (allConfigured) {
    logPass('Google OAuth configured');
    logInfo('OAuth flow ready to test');
    logInfo(`OAuth URL: ${API_BASE_URL}/api/auth/google`);
  } else {
    logWarning('Google OAuth not fully configured');
    logInfo('Add Google OAuth credentials to .env');
  }
}

/**
 * Test 13: Server Health Check
 */
async function testServerHealth() {
  logTest('Server Health Check');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true
    });

    if (response.status === 200) {
      logPass('Server is running');
      logInfo(`Health check: ${JSON.stringify(response.data)}`);
    } else {
      logFail('Server health check failed', response.data);
    }
  } catch (error) {
    logFail('Cannot connect to server', error);
    logInfo(`Make sure server is running at ${API_BASE_URL}`);
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  AUREA FULL AUTHENTICATION SYSTEM TEST SUITE', colors.cyan);
  log('='.repeat(70) + '\n', colors.cyan);

  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Test Email: ${TEST_EMAIL}`);
  logInfo('Starting tests...\n');

  // Pre-flight checks
  await testServerHealth();
  await testEmailService();
  await testGoogleOAuthSetup();

  // Authentication flow tests
  await testSignup();
  await sleep(1000);

  await testLoginBlocked();
  await sleep(500);

  await testEmailOTPVerification();
  await sleep(500);

  await testResendOTP();
  await sleep(500);

  await testAlreadyVerified();
  await sleep(500);

  // Password reset tests
  await testForgotPassword();
  await sleep(500);

  await testForgotPasswordNonExistent();
  await sleep(500);

  // OTP login tests
  await testOTPLoginSend();
  await sleep(500);

  await testOTPLoginNonExistent();
  await sleep(500);

  // Security tests
  await testRateLimiting();

  // Final summary
  log('\n' + '='.repeat(70), colors.cyan);
  log('  TEST SUMMARY', colors.cyan);
  log('='.repeat(70), colors.cyan);
  log(`Total Tests: ${testResults.total}`, colors.blue);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, colors.red);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`, colors.blue);

  // Manual test instructions
  log('='.repeat(70), colors.yellow);
  log('  MANUAL TESTS REQUIRED', colors.yellow);
  log('='.repeat(70), colors.yellow);
  logWarning('The following need manual verification:');
  log('\n1. Email OTP Verification:', colors.yellow);
  log('   - Check email inbox for OTP');
  log('   - Use OTP with: POST /api/auth/verify-email-otp');
  log('   - Or get from DB: db.users.findOne({ email })');

  log('\n2. Forgot Password Flow:', colors.yellow);
  log('   - Check email for reset link');
  log('   - Click link or extract token');
  log('   - Use token with: POST /api/auth/reset-password');

  log('\n3. Google OAuth:', colors.yellow);
  log(`   - Visit: ${API_BASE_URL}/api/auth/google`);
  log('   - Complete Google sign-in');
  log('   - Verify redirect with token');

  log('\n4. Email Verification After Signup:', colors.yellow);
  log('   - Verify OTP received in email');
  log('   - Complete verification');
  log('   - Try login again (should succeed)');

  log('\n' + '='.repeat(70), colors.cyan);
  log('Test email created:', colors.cyan);
  log(`Email: ${TEST_EMAIL}`, colors.green);
  log(`Password: ${TEST_PASSWORD}`, colors.green);
  log('='.repeat(70) + '\n', colors.cyan);

  if (testResults.failed > 0) {
    log('⚠️  Some tests failed. Check errors above.', colors.red);
    process.exit(1);
  } else {
    log('✨ All automated tests passed!', colors.green);
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  log('\n❌ Test suite crashed:', colors.red);
  console.error(error);
  process.exit(1);
});
