/**
 * Test: Public Project Endpoint
 *
 * Tests the new public API endpoint for fetching project data:
 * GET /api/sites/:portfolioId/project/:projectId
 *
 * This endpoint:
 * - Accepts portfolioId as either MongoDB _id OR subdomain/slug
 * - Returns project data without requiring authentication
 * - Only works for published portfolios
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testPortfolioId = '';
let testSubdomain = '';

// Test data
const testUser = {
  name: 'Public Project Test User',
  email: `public-project-test-${Date.now()}@example.com`,
  password: 'SecurePass123!'
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null, requireAuth = true) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: (requireAuth && authToken) ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return { error: true, status: error.response.status, data: error.response.data };
    }
    throw error;
  }
};

// Test 1: User signup and authentication
async function test1_UserSignup() {
  console.log('\n📝 Test 1: User Signup and Authentication');

  const response = await apiRequest('POST', '/auth/signup', testUser);

  if (response.success && response.data && response.data.token) {
    authToken = response.data.token;
    testUserId = response.data.user._id || response.data.user.id;
    console.log('✅ User created and authenticated');
    console.log(`   User ID: ${testUserId}`);
    return true;
  }

  throw new Error(`Signup failed: ${JSON.stringify(response)}`);
}

// Test 2: Create portfolio with projects
async function test2_CreatePortfolioWithProjects() {
  console.log('\n📝 Test 2: Create Echelon Portfolio with Projects');

  const portfolioData = {
    title: 'Public Project Test Portfolio',
    description: 'Testing public project endpoint',
    template: 'echolon',
    content: {
      hero: {
        title: 'Test Portfolio',
        subtitle: 'Testing public project access'
      },
      about: {
        name: 'Test Designer',
        bio: 'A creative professional testing public access',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      work: {
        heading: 'Selected Work',
        projects: [
          {
            id: 'project-1',
            title: 'Brand Identity Project',
            description: 'Short description for preview',
            detailedDescription: 'Full case study content with detailed information...',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
            category: 'Branding',
            year: '2024',
            meta: '2024 — BRANDING'
          },
          {
            id: 'project-2',
            title: 'Web Design Project',
            description: 'Modern website redesign',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
            category: 'Web Design',
            year: '2024',
            meta: '2024 — WEB DESIGN'
          }
        ]
      },
      gallery: {
        heading: 'Gallery',
        images: []
      },
      contact: {
        heading: 'Get In Touch',
        email: 'test@example.com'
      }
    }
  };

  const response = await apiRequest('POST', '/portfolios', portfolioData);

  if (response.success && response.data.portfolio) {
    testPortfolioId = response.data.portfolio._id;
    console.log('✅ Portfolio created successfully');
    console.log(`   Portfolio ID: ${testPortfolioId}`);
    return true;
  }

  throw new Error('Portfolio creation failed');
}

// Test 3: Publish portfolio to subdomain
async function test3_PublishPortfolio() {
  console.log('\n📝 Test 3: Publish Portfolio to Subdomain');

  testSubdomain = `test-public-${Date.now()}`;

  const response = await apiRequest('POST', '/sites/sub-publish', {
    portfolioId: testPortfolioId,
    customSubdomain: testSubdomain
  });

  if (response.success) {
    console.log('✅ Portfolio published successfully');
    console.log(`   Subdomain: ${testSubdomain}`);
    console.log(`   URL: ${response.data.url}`);
    return true;
  }

  throw new Error(`Publishing failed: ${JSON.stringify(response)}`);
}

// Test 4: Get public project by portfolio ID (MongoDB _id)
async function test4_GetPublicProjectById() {
  console.log('\n📝 Test 4: Get Public Project by Portfolio ID (MongoDB _id)');

  // Make request WITHOUT authentication
  const response = await apiRequest('GET', `/sites/${testPortfolioId}/project/project-1`, null, false);

  if (response.success && response.data) {
    const { portfolio, project } = response.data;

    if (portfolio._id === testPortfolioId &&
        project.id === 'project-1' &&
        project.title === 'Brand Identity Project') {
      console.log('✅ Public project retrieved by portfolio ID');
      console.log(`   Portfolio: ${portfolio.title}`);
      console.log(`   Project: ${project.title}`);
      console.log(`   Category: ${project.category}`);
      console.log(`   Year: ${project.year}`);
      return true;
    }
  }

  throw new Error(`Failed to get public project: ${JSON.stringify(response)}`);
}

// Test 5: Get public project by subdomain
async function test5_GetPublicProjectBySubdomain() {
  console.log('\n📝 Test 5: Get Public Project by Subdomain');

  // Make request WITHOUT authentication
  const response = await apiRequest('GET', `/sites/${testSubdomain}/project/project-1`, null, false);

  if (response.success && response.data) {
    const { portfolio, project } = response.data;

    if (portfolio.subdomain === testSubdomain &&
        project.id === 'project-1' &&
        project.title === 'Brand Identity Project') {
      console.log('✅ Public project retrieved by subdomain');
      console.log(`   Subdomain: ${portfolio.subdomain}`);
      console.log(`   Template: ${portfolio.template}`);
      console.log(`   Project: ${project.title}`);
      return true;
    }
  }

  throw new Error(`Failed to get public project by subdomain: ${JSON.stringify(response)}`);
}

// Test 6: Get different project from same portfolio
async function test6_GetSecondProject() {
  console.log('\n📝 Test 6: Get Second Project from Portfolio');

  const response = await apiRequest('GET', `/sites/${testPortfolioId}/project/project-2`, null, false);

  if (response.success && response.data) {
    const { project } = response.data;

    if (project.id === 'project-2' && project.title === 'Web Design Project') {
      console.log('✅ Second project retrieved successfully');
      console.log(`   Project: ${project.title}`);
      console.log(`   Category: ${project.category}`);
      return true;
    }
  }

  throw new Error(`Failed to get second project: ${JSON.stringify(response)}`);
}

// Test 7: Test 404 for non-existent project
async function test7_NonExistentProject() {
  console.log('\n📝 Test 7: Test 404 for Non-Existent Project');

  const response = await apiRequest('GET', `/sites/${testPortfolioId}/project/non-existent-project`, null, false);

  if (response.error && response.status === 404) {
    console.log('✅ Correctly returned 404 for non-existent project');
    console.log(`   Status: ${response.status}`);
    return true;
  }

  throw new Error(`Expected 404, got: ${JSON.stringify(response)}`);
}

// Test 8: Test 404 for non-existent portfolio
async function test8_NonExistentPortfolio() {
  console.log('\n📝 Test 8: Test 404 for Non-Existent Portfolio');

  const response = await apiRequest('GET', '/sites/non-existent-portfolio/project/project-1', null, false);

  if (response.error && response.status === 404) {
    console.log('✅ Correctly returned 404 for non-existent portfolio');
    console.log(`   Status: ${response.status}`);
    return true;
  }

  throw new Error(`Expected 404, got: ${JSON.stringify(response)}`);
}

// Test 9: Test Serene template with gallery structure
async function test9_SereneTemplateProjects() {
  console.log('\n📝 Test 9: Test Serene Template with Gallery Structure');

  // Create Serene portfolio
  const portfolioData = {
    title: 'Serene Public Test Portfolio',
    description: 'Testing Serene template public access',
    template: 'serene',
    content: {
      hero: {
        title: 'Botanical Portfolio',
        subtitle: 'Nature & Design'
      },
      about: {
        name: 'Nature Designer',
        bio: 'Inspired by nature',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      navigation: {
        links: [
          { text: 'Home', href: '#' },
          { text: 'About', href: '#about' }
        ]
      },
      gallery: {
        firstRow: [
          {
            id: 'serene-first-0',
            title: 'Nature Study 1',
            description: 'First nature study',
            image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80'
          }
        ],
        secondRow: [
          {
            id: 'serene-second-0',
            title: 'Nature Study 2',
            description: 'Second nature study',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
          }
        ],
        thirdRow: [
          {
            id: 'serene-third-0',
            title: 'Nature Study 3',
            description: 'Third nature study',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80'
          }
        ]
      },
      footer: {
        text: 'Test Footer'
      }
    }
  };

  const createResponse = await apiRequest('POST', '/portfolios', portfolioData);

  if (!createResponse.success) {
    throw new Error('Failed to create Serene portfolio');
  }

  const serenePortfolioId = createResponse.data.portfolio._id;
  const sereneSubdomain = `serene-test-${Date.now()}`;

  // Publish the portfolio
  const publishResponse = await apiRequest('POST', '/sites/sub-publish', {
    portfolioId: serenePortfolioId,
    customSubdomain: sereneSubdomain
  });

  if (!publishResponse.success) {
    throw new Error('Failed to publish Serene portfolio');
  }

  // Test getting project from different rows
  const firstRowResponse = await apiRequest('GET', `/sites/${sereneSubdomain}/project/serene-first-0`, null, false);
  const secondRowResponse = await apiRequest('GET', `/sites/${sereneSubdomain}/project/serene-second-0`, null, false);
  const thirdRowResponse = await apiRequest('GET', `/sites/${sereneSubdomain}/project/serene-third-0`, null, false);

  if (firstRowResponse.success && firstRowResponse.data.project.title === 'Nature Study 1' &&
      secondRowResponse.success && secondRowResponse.data.project.title === 'Nature Study 2' &&
      thirdRowResponse.success && thirdRowResponse.data.project.title === 'Nature Study 3') {
    console.log('✅ Serene template projects retrieved from all gallery rows');
    console.log(`   First Row: ${firstRowResponse.data.project.title}`);
    console.log(`   Second Row: ${secondRowResponse.data.project.title}`);
    console.log(`   Third Row: ${thirdRowResponse.data.project.title}`);
    return true;
  }

  throw new Error('Failed to retrieve Serene gallery projects');
}

// Test 10: Unpublished portfolio should return 404
async function test10_UnpublishedPortfolio() {
  console.log('\n📝 Test 10: Test 404 for Unpublished Portfolio');

  // Create a new portfolio but don't publish it
  const portfolioData = {
    title: 'Unpublished Test Portfolio',
    description: 'This portfolio is not published',
    template: 'echolon',
    content: {
      hero: { title: 'Unpublished', subtitle: 'Test' },
      about: { name: 'Test', bio: 'Test' },
      work: {
        projects: [
          { id: 'project-1', title: 'Test Project', description: 'Test' }
        ]
      },
      gallery: { heading: 'Gallery', images: [] },
      contact: { heading: 'Contact', email: 'test@test.com' }
    }
  };

  const createResponse = await apiRequest('POST', '/portfolios', portfolioData);

  if (!createResponse.success) {
    throw new Error('Failed to create unpublished portfolio');
  }

  const unpublishedPortfolioId = createResponse.data.portfolio._id;

  // Try to access project from unpublished portfolio
  const response = await apiRequest('GET', `/sites/${unpublishedPortfolioId}/project/project-1`, null, false);

  if (response.error && response.status === 404) {
    console.log('✅ Correctly returned 404 for unpublished portfolio');
    console.log(`   Status: ${response.status}`);
    return true;
  }

  throw new Error(`Expected 404 for unpublished portfolio, got: ${JSON.stringify(response)}`);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Public Project Endpoint Tests\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Testing: GET /api/sites/:portfolioId/project/:projectId');
  console.log('═══════════════════════════════════════════════════════════');

  const tests = [
    { name: 'User Signup', fn: test1_UserSignup },
    { name: 'Create Portfolio', fn: test2_CreatePortfolioWithProjects },
    { name: 'Publish Portfolio', fn: test3_PublishPortfolio },
    { name: 'Get Project by Portfolio ID', fn: test4_GetPublicProjectById },
    { name: 'Get Project by Subdomain', fn: test5_GetPublicProjectBySubdomain },
    { name: 'Get Second Project', fn: test6_GetSecondProject },
    { name: 'Non-Existent Project 404', fn: test7_NonExistentProject },
    { name: 'Non-Existent Portfolio 404', fn: test8_NonExistentPortfolio },
    { name: 'Serene Template Gallery', fn: test9_SereneTemplateProjects },
    { name: 'Unpublished Portfolio 404', fn: test10_UnpublishedPortfolio }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✨ All tests passed! Public project endpoint is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
