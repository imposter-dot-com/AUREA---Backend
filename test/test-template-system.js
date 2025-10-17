import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_USER = {
  email: `test-template-${Date.now()}@example.com`,
  password: 'Test123456!',
  name: 'Template Test User'
};

let authToken = null;
let userId = null;
let templateId = null;
let portfolioId = null;

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testUserSignup() {
  console.log('\n📝 Test 1: User Signup');
  try {
    const result = await apiCall('POST', '/api/auth/signup', TEST_USER);

    if (result.success && result.data.token) {
      authToken = result.data.token;
      userId = result.data.user._id || result.data.user.id;
      console.log('✅ User signup successful');
      console.log(`   User ID: ${userId}`);
      return true;
    } else {
      console.error('❌ Signup failed:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Signup error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetTemplates() {
  console.log('\n📝 Test 2: Get All Templates');
  try {
    const result = await apiCall('GET', '/api/templates');

    if (result.success && Array.isArray(result.data)) {
      console.log(`✅ Retrieved ${result.data.length} templates`);
      result.data.forEach(template => {
        console.log(`   - ${template.name} (${template.templateId})`);
      });
      return true;
    } else {
      console.error('❌ Failed to get templates:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Get templates error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetDefaultTemplate() {
  console.log('\n📝 Test 3: Get Default Template');
  try {
    const result = await apiCall('GET', '/api/templates/default');

    if (result.success && result.data) {
      templateId = result.data._id;
      console.log('✅ Retrieved default template');
      console.log(`   Name: ${result.data.name}`);
      console.log(`   ID: ${templateId}`);
      console.log(`   Category: ${result.data.category}`);
      return true;
    } else {
      console.error('❌ Failed to get default template:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Get default template error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetTemplateSchema() {
  console.log('\n📝 Test 4: Get Template Schema');
  try {
    const result = await apiCall('GET', `/api/templates/${templateId}/schema`);

    if (result.success && result.data.schema) {
      console.log('✅ Retrieved template schema');
      console.log(`   Sections: ${Object.keys(result.data.schema.sections).join(', ')}`);
      return true;
    } else {
      console.error('❌ Failed to get template schema:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Get template schema error:', error.response?.data || error.message);
    return false;
  }
}

async function testCreatePortfolioWithTemplate() {
  console.log('\n📝 Test 5: Create Portfolio with Template');
  try {
    const portfolioData = {
      title: 'Test Portfolio with Template',
      description: 'Testing the new template system',
      templateId: templateId,
      customData: {
        hero: {
          title: 'MY PORTFOLIO',
          subtitle: 'Testing template system'
        },
        about: {
          name: 'Test User',
          bio: 'This is a test portfolio using the new template system'
        },
        work: {
          heading: 'MY PROJECTS',
          projects: [
            {
              id: 1,
              title: 'Test Project',
              description: 'A test project for template validation',
              category: 'web-design'
            }
          ]
        }
      }
    };

    const result = await apiCall('POST', '/api/portfolios', portfolioData, authToken);

    if (result.success && result.data.portfolio) {
      portfolioId = result.data.portfolio._id;
      console.log('✅ Portfolio created with template');
      console.log(`   Portfolio ID: ${portfolioId}`);
      console.log(`   Template ID: ${result.data.portfolio.templateId}`);
      console.log(`   Template Version: ${result.data.portfolio.templateVersion}`);
      return true;
    } else {
      console.error('❌ Failed to create portfolio:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Create portfolio error:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdatePortfolioWithValidation() {
  console.log('\n📝 Test 6: Update Portfolio with Validation');
  try {
    const updateData = {
      customData: {
        hero: {
          title: 'UPDATED PORTFOLIO',
          subtitle: 'Template validation works'
        },
        about: {
          name: 'Updated User',
          bio: 'Updated bio with template validation'
        }
      }
    };

    const result = await apiCall('PUT', `/api/portfolios/${portfolioId}`, updateData, authToken);

    if (result.success) {
      console.log('✅ Portfolio updated with validation');
      return true;
    } else {
      console.error('❌ Failed to update portfolio:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Update portfolio error:', error.response?.data || error.message);
    return false;
  }
}

async function testInvalidDataValidation() {
  console.log('\n📝 Test 7: Invalid Data Validation');
  try {
    const invalidData = {
      customData: {
        hero: {
          title: 'A'.repeat(300),  // Exceeds max length
          subtitle: 123  // Wrong type
        },
        about: {
          // Missing required 'name' field
          bio: 'Test bio'
        }
      }
    };

    const result = await apiCall('PUT', `/api/portfolios/${portfolioId}`, invalidData, authToken);

    console.error('❌ Validation should have failed but didn\'t');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors) {
      console.log('✅ Validation correctly rejected invalid data');
      console.log(`   Errors: ${error.response.data.errors.join(', ')}`);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testChangeTemplate() {
  console.log('\n📝 Test 8: Change Portfolio Template');
  try {
    // Get modern template
    const templatesResult = await apiCall('GET', '/api/templates');
    const modernTemplate = templatesResult.data.find(t => t.templateId === 'modern-bold');

    if (!modernTemplate) {
      console.log('⚠️  Modern template not found, skipping test');
      return true;
    }

    const updateData = {
      templateId: modernTemplate._id,
      customData: {
        hero: {
          title: 'Modern Portfolio',
          subtitle: 'Using modern template'
        },
        about: {
          name: 'Modern User',
          title: 'Creative Director',
          bio: 'Testing with modern template'
        }
      }
    };

    const result = await apiCall('PUT', `/api/portfolios/${portfolioId}`, updateData, authToken);

    if (result.success && result.data.portfolio.templateId === modernTemplate._id) {
      console.log('✅ Successfully changed portfolio template');
      console.log(`   New Template: ${modernTemplate.name}`);
      return true;
    } else {
      console.error('❌ Failed to change template:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Change template error:', error.response?.data || error.message);
    return false;
  }
}

async function testCleanup() {
  console.log('\n📝 Test 9: Cleanup');
  try {
    // Delete portfolio
    if (portfolioId) {
      await apiCall('DELETE', `/api/portfolios/${portfolioId}`, null, authToken);
      console.log('✅ Portfolio deleted');
    }

    // Note: We're not deleting templates as they should persist
    return true;
  } catch (error) {
    console.error('❌ Cleanup error:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Template System Tests');
  console.log('================================');

  const tests = [
    testUserSignup,
    testGetTemplates,
    testGetDefaultTemplate,
    testGetTemplateSchema,
    testCreatePortfolioWithTemplate,
    testUpdatePortfolioWithValidation,
    testInvalidDataValidation,
    testChangeTemplate,
    testCleanup
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n================================');
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Template system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Execute tests
runAllTests().catch(console.error);