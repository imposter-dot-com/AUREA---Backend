/**
 * Test: Project Routing System
 *
 * Tests the new project-specific API endpoints that support:
 * - Getting individual projects by ID
 * - Updating individual projects
 * - Auto-generation of project IDs
 *
 * Affected Templates: Chic, Serene, BoldFolio
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testPortfolioId = '';
let testProjectId = 'project-1';

// Test data
const testUser = {
  name: 'Project Test User',
  email: `project-test-${Date.now()}@example.com`,
  password: 'SecurePass123!'
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
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

// Test 2: Create portfolio with Chic template (has work.projects)
async function test2_CreateChicPortfolio() {
  console.log('\n📝 Test 2: Create Chic Portfolio with Projects (without IDs)');

  const portfolioData = {
    title: 'Chic Portfolio Test',
    description: 'Testing project ID auto-generation',
    template: 'chic',
    content: {
      hero: {
        title: 'My Portfolio',
        subtitle: 'Designer & Creative'
      },
      about: {
        name: 'Test Designer',
        bio: 'A creative professional',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      work: {
        heading: 'Selected Work',
        projects: [
          {
            // Note: No ID provided - should be auto-generated
            title: 'Project Alpha',
            description: 'First test project',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80'
          },
          {
            // Note: No ID provided - should be auto-generated
            title: 'Project Beta',
            description: 'Second test project',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
          }
        ]
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

    // Note: IDs are auto-generated on GET, not on POST
    // This is intentional to avoid mutating input data
    console.log('✅ Portfolio created successfully');
    console.log(`   Portfolio ID: ${testPortfolioId}`);
    console.log(`   Note: IDs will be auto-generated on retrieval`);
    return true;
  }

  throw new Error('Portfolio creation failed');
}

// Test 3: Get portfolio and verify project IDs
async function test3_GetPortfolioWithProjectIds() {
  console.log('\n📝 Test 3: Get Portfolio and Verify Project IDs');

  const response = await apiRequest('GET', `/portfolios/${testPortfolioId}`);

  if (response.success && response.data.portfolio) {
    const projects = response.data.portfolio.content?.work?.projects || [];
    const allHaveIds = projects.every(p => p.id && p.id.startsWith('project-'));

    if (allHaveIds && projects.length === 2) {
      console.log('✅ Portfolio retrieved with correct project IDs');
      console.log(`   Project IDs: ${projects.map(p => p.id).join(', ')}`);
      return true;
    } else {
      throw new Error('Project IDs missing or incorrect');
    }
  }

  throw new Error('Get portfolio failed');
}

// Test 4: Get individual project by ID
async function test4_GetIndividualProject() {
  console.log('\n📝 Test 4: Get Individual Project by ID');

  const response = await apiRequest('GET', `/portfolios/${testPortfolioId}/projects/${testProjectId}`);

  if (response.success && response.data.project) {
    const project = response.data.project;

    if (project.id === testProjectId && project.title === 'Project Alpha') {
      console.log('✅ Individual project retrieved successfully');
      console.log(`   Project ID: ${project.id}`);
      console.log(`   Title: ${project.title}`);
      console.log(`   Portfolio: ${project.portfolioTitle}`);
      return true;
    } else {
      throw new Error('Project data incorrect');
    }
  }

  throw new Error('Get project failed');
}

// Test 5: Update individual project
async function test5_UpdateIndividualProject() {
  console.log('\n📝 Test 5: Update Individual Project');

  const updateData = {
    title: 'Updated Project Alpha',
    description: 'This project has been updated via the new API',
    meta: 'Updated 2025'
  };

  const response = await apiRequest('PUT', `/portfolios/${testPortfolioId}/projects/${testProjectId}`, updateData);

  if (response.success && response.data.project) {
    const project = response.data.project;

    if (project.title === 'Updated Project Alpha' && project.description === updateData.description) {
      console.log('✅ Project updated successfully');
      console.log(`   New Title: ${project.title}`);
      console.log(`   ID Preserved: ${project.id === testProjectId ? 'Yes' : 'No'}`);
      return true;
    } else {
      throw new Error('Project update data incorrect');
    }
  }

  throw new Error('Update project failed');
}

// Test 6: Verify update persisted in portfolio
async function test6_VerifyUpdatePersisted() {
  console.log('\n📝 Test 6: Verify Update Persisted in Portfolio');

  const response = await apiRequest('GET', `/portfolios/${testPortfolioId}`);

  if (response.success && response.data.portfolio) {
    const projects = response.data.portfolio.content?.work?.projects || [];
    const updatedProject = projects.find(p => p.id === testProjectId);

    if (updatedProject && updatedProject.title === 'Updated Project Alpha') {
      console.log('✅ Project update persisted in portfolio');
      console.log(`   Verified Title: ${updatedProject.title}`);
      return true;
    } else {
      throw new Error('Update did not persist');
    }
  }

  throw new Error('Verification failed');
}

// Test 7: Test Serene template (gallery structure with thirdRow)
async function test7_SereneTemplateProjects() {
  console.log('\n📝 Test 7: Create Serene Portfolio with Gallery Projects (All Three Rows)');

  const portfolioData = {
    title: 'Serene Portfolio Test',
    description: 'Testing Serene template project IDs',
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
            title: 'Nature Study 1',
            image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80'
          },
          {
            title: 'Nature Study 2',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
          }
        ],
        secondRow: [
          {
            title: 'Nature Study 3',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80'
          }
        ],
        thirdRow: [
          {
            title: 'Nature Study 4',
            image: 'https://images.unsplash.com/photo-1620121684840-edffcfc4b878?w=800&q=80'
          },
          {
            title: 'Nature Study 5',
            image: 'https://images.unsplash.com/photo-1616628188540-925618b98318?w=800&q=80'
          }
        ]
      }
    }
  };

  const createResponse = await apiRequest('POST', '/portfolios', portfolioData);

  if (createResponse.success && createResponse.data.portfolio) {
    const serenePortfolioId = createResponse.data.portfolio._id;

    // Get the portfolio to see auto-generated IDs
    const getResponse = await apiRequest('GET', `/portfolios/${serenePortfolioId}`);

    if (getResponse.success && getResponse.data.portfolio) {
      const firstRow = getResponse.data.portfolio.content?.gallery?.firstRow || [];
      const secondRow = getResponse.data.portfolio.content?.gallery?.secondRow || [];
      const thirdRow = getResponse.data.portfolio.content?.gallery?.thirdRow || [];
      const allProjects = [...firstRow, ...secondRow, ...thirdRow];
      const allHaveIds = allProjects.every(p => p.id && p.id.startsWith('project-'));

      if (allHaveIds && allProjects.length === 5) {
        console.log('✅ Serene portfolio created with auto-generated IDs');
        console.log(`   First Row IDs: ${firstRow.map(p => p.id).join(', ')}`);
        console.log(`   Second Row IDs: ${secondRow.map(p => p.id).join(', ')}`);
        console.log(`   Third Row IDs: ${thirdRow.map(p => p.id).join(', ')}`);

        // Test getting a project from third row
        const project5Id = thirdRow[1]?.id;

        if (project5Id) {
          const projectResponse = await apiRequest('GET', `/portfolios/${serenePortfolioId}/projects/${project5Id}`);

          if (projectResponse.success && projectResponse.data.project.title === 'Nature Study 5') {
            console.log('✅ Successfully retrieved project from Serene thirdRow');

            // Test updating a project in thirdRow
            const updateData = {
              title: 'Updated Nature Study 5',
              subtitle: 'Updated from thirdRow'
            };

            const updateResponse = await apiRequest('PUT', `/portfolios/${serenePortfolioId}/projects/${project5Id}`, updateData);

            if (updateResponse.success && updateResponse.data.project.title === 'Updated Nature Study 5') {
              console.log('✅ Successfully updated project in Serene thirdRow');
              return true;
            } else {
              throw new Error('Failed to update thirdRow project');
            }
          }
        }
      } else {
        throw new Error(`Serene: IDs check failed. allHaveIds=${allHaveIds}, count=${allProjects.length}`);
      }
    }
  }

  throw new Error('Serene template test failed');
}

// Test 8: Test BoldFolio template
async function test8_BoldFolioTemplateProjects() {
  console.log('\n📝 Test 8: Create BoldFolio Portfolio with Projects');

  const portfolioData = {
    title: 'BoldFolio Portfolio Test',
    description: 'Testing BoldFolio template project IDs',
    template: 'boldfolio',
    content: {
      hero: {
        title: 'Bold Creative',
        subtitle: 'Making Statements'
      },
      about: {
        name: 'Bold Designer',
        bio: 'Making bold statements',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      work: {
        heading: 'Portfolio',
        projects: [
          {
            title: 'Bold Project 1',
            description: 'First bold project',
            image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80'
          }
        ]
      },
      contact: {
        heading: 'Get In Touch',
        email: 'bold@example.com'
      }
    }
  };

  const createResponse = await apiRequest('POST', '/portfolios', portfolioData);

  if (createResponse.success && createResponse.data.portfolio) {
    const boldPortfolioId = createResponse.data.portfolio._id;

    // Get the portfolio to see auto-generated IDs
    const getResponse = await apiRequest('GET', `/portfolios/${boldPortfolioId}`);

    if (getResponse.success && getResponse.data.portfolio) {
      const projects = getResponse.data.portfolio.content?.work?.projects || [];
      const allHaveIds = projects.every(p => p.id && p.id.startsWith('project-'));

      if (allHaveIds && projects.length > 0) {
        console.log('✅ BoldFolio portfolio created with auto-generated IDs');
        console.log(`   Project IDs: ${projects.map(p => p.id).join(', ')}`);
        return true;
      } else {
        throw new Error(`BoldFolio: IDs check failed. allHaveIds=${allHaveIds}, count=${projects.length}`);
      }
    }
  }

  throw new Error('BoldFolio template test failed');
}

// Test 9: Test backward compatibility - portfolio with existing IDs
async function test9_BackwardCompatibility() {
  console.log('\n📝 Test 9: Backward Compatibility - Portfolios with Existing IDs');

  const portfolioData = {
    title: 'Legacy Portfolio',
    description: 'Portfolio with pre-existing IDs',
    template: 'chic',
    content: {
      hero: {
        title: 'Legacy Portfolio',
        subtitle: 'Testing compatibility'
      },
      about: {
        name: 'Legacy Designer',
        bio: 'Preserving old data',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      work: {
        projects: [
          {
            id: 'custom-project-alpha',
            title: 'Legacy Project',
            description: 'Has custom ID',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80'
          },
          {
            // This one has no ID - should get auto-generated
            title: 'New Project',
            description: 'Needs auto-generated ID',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
          }
        ]
      },
      contact: {
        heading: 'Contact',
        email: 'legacy@example.com'
      }
    }
  };

  const createResponse = await apiRequest('POST', '/portfolios', portfolioData);

  if (createResponse.success && createResponse.data.portfolio) {
    const legacyPortfolioId = createResponse.data.portfolio._id;

    // Get the portfolio to see how IDs were handled
    const getResponse = await apiRequest('GET', `/portfolios/${legacyPortfolioId}`);

    if (getResponse.success && getResponse.data.portfolio) {
      const projects = getResponse.data.portfolio.content?.work?.projects || [];
      const hasCustomId = projects.some(p => p.id === 'custom-project-alpha');
      const hasAutoId = projects.some(p => p.id === 'project-2');

      if (hasCustomId && hasAutoId && projects.length === 2) {
        console.log('✅ Backward compatibility maintained');
        console.log(`   Custom ID preserved: custom-project-alpha`);
        console.log(`   Auto-generated ID added: project-2`);
        return true;
      } else {
        const projectIds = projects.map(p => p.id).join(', ');
        throw new Error(`Backward compatibility failed. IDs: ${projectIds}, hasCustom=${hasCustomId}, hasAuto=${hasAutoId}`);
      }
    }
  }

  throw new Error('Backward compatibility test failed');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Project Routing System Tests\n');
  console.log('═══════════════════════════════════════════════════════════');

  const tests = [
    { name: 'User Signup', fn: test1_UserSignup },
    { name: 'Create Chic Portfolio', fn: test2_CreateChicPortfolio },
    { name: 'Get Portfolio with IDs', fn: test3_GetPortfolioWithProjectIds },
    { name: 'Get Individual Project', fn: test4_GetIndividualProject },
    { name: 'Update Individual Project', fn: test5_UpdateIndividualProject },
    { name: 'Verify Update Persisted', fn: test6_VerifyUpdatePersisted },
    { name: 'Serene Template', fn: test7_SereneTemplateProjects },
    { name: 'BoldFolio Template', fn: test8_BoldFolioTemplateProjects },
    { name: 'Backward Compatibility', fn: test9_BackwardCompatibility }
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
    console.log('✨ All tests passed! Project routing system is working correctly.\n');
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
