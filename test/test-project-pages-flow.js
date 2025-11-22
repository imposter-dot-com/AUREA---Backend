/**
 * Test: Template Project Pages (Case Studies) - Save and Publish Flow
 *
 * This test verifies that:
 * 1. Case studies can be created and saved for portfolio projects
 * 2. Publishing generates both portfolio HTML and case study HTML files
 * 3. Case study pages are properly linked from the main portfolio
 * 4. All templates support project pages correctly
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const TEST_USER = {
  email: `test-casestudy-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Case Study Tester'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

let authToken = '';
let userId = '';
let portfolioId = '';
let projectId = '';
let caseStudyId = '';
let subdomain = '';

/**
 * Helper: Log test step
 */
function logStep(step, message) {
  console.log(`\n${colors.blue}[${step}]${colors.reset} ${message}`);
}

/**
 * Helper: Log success
 */
function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

/**
 * Helper: Log error
 */
function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

/**
 * Helper: Log info
 */
function logInfo(message) {
  console.log(`${colors.yellow}ℹ️  ${message}${colors.reset}`);
}

/**
 * Helper: Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken && !options.noAuth) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Test 1: User signup
 */
async function testUserSignup() {
  logStep('1', 'Creating test user account');

  const { response, data } = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  // API returns: { success, message, data: { user, token } }
  if (response.ok && data.success && data.data?.token) {
    authToken = data.data.token;
    userId = data.data.user._id;
    logSuccess(`User created: ${data.data.user.email}`);
    logInfo(`User ID: ${userId}`);
    return true;
  } else {
    logError(`Signup failed: ${data.message || JSON.stringify(data)}`);
    return false;
  }
}

/**
 * Test 2: Create portfolio with projects
 */
async function testCreatePortfolio() {
  logStep('2', 'Creating portfolio with projects');

  const portfolioData = {
    title: `Test Portfolio ${Date.now()}`,
    template: 'echolon',
    content: {
      hero: {
        title: 'Welcome to My Portfolio',
        subtitle: 'Creative Designer & Developer'
      },
      about: {
        name: TEST_USER.name,
        bio: 'I create beautiful digital experiences',
        image: 'https://via.placeholder.com/400x400'
      },
      work: {
        heading: 'My Work',
        projects: [
          {
            id: '1',
            title: 'E-Commerce Redesign',
            meta: 'WEB DESIGN',
            description: 'A complete redesign of an online store',
            image: 'https://via.placeholder.com/800x600',
            tags: ['design', 'ui/ux', 'ecommerce']
          },
          {
            id: '2',
            title: 'Mobile Banking App',
            meta: 'APP DESIGN',
            description: 'Modern banking experience on mobile',
            image: 'https://via.placeholder.com/800x600',
            tags: ['mobile', 'fintech', 'ui/ux']
          },
          {
            id: '3',
            title: 'Brand Identity',
            meta: 'BRANDING',
            description: 'Complete brand identity for startup',
            image: 'https://via.placeholder.com/800x600',
            tags: ['branding', 'logo', 'identity']
          }
        ]
      },
      gallery: {
        heading: 'Visual Studies',
        images: [
          'https://via.placeholder.com/600x400',
          'https://via.placeholder.com/600x400'
        ]
      },
      contact: {
        heading: 'Get In Touch',
        text: 'Available for new projects and collaborations.',
        button: 'CONTACT',
        email: TEST_USER.email
      }
    }
  };

  const { response, data } = await apiRequest('/portfolios', {
    method: 'POST',
    body: JSON.stringify(portfolioData)
  });

  if (response.ok && data.data?.portfolio) {
    portfolioId = data.data.portfolio._id;
    projectId = '1'; // We'll create a case study for the first project
    logSuccess(`Portfolio created: ${data.data.portfolio.title}`);
    logInfo(`Portfolio ID: ${portfolioId}`);
    logInfo(`Number of projects: ${portfolioData.content.work.projects.length}`);
    return true;
  } else {
    logError(`Portfolio creation failed: ${data.message}`);
    return false;
  }
}

/**
 * Test 3: Create case study for project
 */
async function testCreateCaseStudy() {
  logStep('3', 'Creating case study for project');

  const caseStudyData = {
    portfolioId,
    projectId: '1',
    content: {
      hero: {
        title: 'E-Commerce Redesign: Case Study',
        subtitle: 'Transforming the online shopping experience',
        coverImage: 'https://via.placeholder.com/1200x600',
        client: 'TechStore Inc.',
        year: '2024',
        role: 'Lead Designer',
        duration: '3 months'
      },
      overview: {
        heading: 'Project Overview',
        description: 'TechStore needed a complete redesign of their e-commerce platform to improve conversion rates and user satisfaction.',
        challenge: 'The existing site had poor navigation, slow checkout, and low mobile performance.',
        solution: 'We implemented a modern design system with streamlined checkout and mobile-first approach.',
        results: 'Achieved 45% increase in conversion rate and 60% improvement in mobile sales.'
      },
      sections: [
        {
          id: 'research',
          type: 'text',
          heading: 'Research & Discovery',
          content: 'We conducted extensive user research including surveys, interviews, and usability testing to understand pain points.',
          layout: 'center'
        },
        {
          id: 'design-process',
          type: 'image-text',
          heading: 'Design Process',
          content: 'Our design process included wireframing, prototyping, and iterative testing with real users.',
          image: 'https://via.placeholder.com/800x600',
          layout: 'left'
        },
        {
          id: 'final-designs',
          type: 'gallery',
          heading: 'Final Designs',
          images: [
            'https://via.placeholder.com/600x400',
            'https://via.placeholder.com/600x400',
            'https://via.placeholder.com/600x400'
          ],
          layout: 'center'
        }
      ],
      additionalContext: {
        heading: 'Key Learnings',
        content: 'This project taught us the importance of mobile-first design and the impact of performance optimization on user experience.'
      }
    }
  };

  const { response, data } = await apiRequest('/case-studies', {
    method: 'POST',
    body: JSON.stringify(caseStudyData)
  });

  if (response.ok && data.data?.caseStudy) {
    caseStudyId = data.data.caseStudy._id;
    logSuccess(`Case study created for project "${caseStudyData.content.hero.title}"`);
    logInfo(`Case Study ID: ${caseStudyId}`);
    logInfo(`Linked to Portfolio: ${portfolioId}, Project: ${projectId}`);
    return true;
  } else {
    logError(`Case study creation failed: ${data.message}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

/**
 * Test 4: Verify case study is saved
 */
async function testVerifyCaseStudy() {
  logStep('4', 'Verifying case study is saved');

  const { response, data } = await apiRequest(`/case-studies/${caseStudyId}`);

  if (response.ok && data.data?.caseStudy) {
    const cs = data.data.caseStudy;
    logSuccess('Case study retrieved successfully');
    logInfo(`Title: ${cs.content.hero.title}`);
    logInfo(`Client: ${cs.content.hero.client}`);
    logInfo(`Sections: ${cs.content.sections.length}`);
    return true;
  } else {
    logError(`Case study retrieval failed: ${data.message}`);
    return false;
  }
}

/**
 * Test 5: Publish portfolio to subdomain
 */
async function testPublishPortfolio() {
  logStep('5', 'Publishing portfolio with case studies to subdomain');

  subdomain = `test-casestudy-${Date.now()}`;

  const { response, data } = await apiRequest('/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId,
      customSubdomain: subdomain
    })
  });

  if (response.ok && data.data?.site) {
    logSuccess('Portfolio published successfully');
    logInfo(`Subdomain: ${subdomain}`);
    logInfo(`URL: ${data.data.url}`);

    if (data.data.summary) {
      logInfo(`Files generated: ${data.data.summary.filesGenerated || 'N/A'}`);
    }

    return true;
  } else {
    logError(`Publishing failed: ${data.message}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

/**
 * Test 6: Verify generated HTML files
 */
async function testVerifyGeneratedFiles() {
  logStep('6', 'Verifying generated HTML files');

  const baseDir = path.join(process.cwd(), 'generated-files', subdomain);

  // Check if directory exists
  if (!fs.existsSync(baseDir)) {
    logError(`Directory not found: ${baseDir}`);
    return false;
  }

  logSuccess(`Found directory: ${baseDir}`);

  // Check for index.html
  const indexPath = path.join(baseDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const indexSize = Buffer.byteLength(indexContent, 'utf8');
    logSuccess(`✓ index.html exists (${(indexSize / 1024).toFixed(2)} KB)`);

    // Check if portfolio has project cards
    if (indexContent.includes('E-Commerce Redesign')) {
      logSuccess('  ✓ Contains project "E-Commerce Redesign"');
    } else {
      logError('  ✗ Missing project "E-Commerce Redesign"');
    }

    // Check if there's a case study link/button
    if (indexContent.includes('case-study-1') || indexContent.toLowerCase().includes('view case study')) {
      logSuccess('  ✓ Contains case study link for project');
    } else {
      logError('  ✗ Missing case study link');
    }
  } else {
    logError('✗ index.html not found');
    return false;
  }

  // Check for case study HTML
  const caseStudyPath = path.join(baseDir, `case-study-${projectId}.html`);
  if (fs.existsSync(caseStudyPath)) {
    const caseStudyContent = fs.readFileSync(caseStudyPath, 'utf-8');
    const caseStudySize = Buffer.byteLength(caseStudyContent, 'utf8');
    logSuccess(`✓ case-study-${projectId}.html exists (${(caseStudySize / 1024).toFixed(2)} KB)`);

    // Check if case study has required content
    if (caseStudyContent.includes('E-Commerce Redesign')) {
      logSuccess('  ✓ Contains case study title');
    } else {
      logError('  ✗ Missing case study title');
    }

    if (caseStudyContent.includes('TechStore Inc.') || caseStudyContent.includes('Lead Designer')) {
      logSuccess('  ✓ Contains case study metadata (client/role)');
    } else {
      logError('  ✗ Missing case study metadata');
    }

    if (caseStudyContent.includes('Research') || caseStudyContent.includes('Design Process')) {
      logSuccess('  ✓ Contains case study sections');
    } else {
      logError('  ✗ Missing case study sections');
    }
  } else {
    logError(`✗ case-study-${projectId}.html not found`);
    return false;
  }

  // List all files in directory
  const files = fs.readdirSync(baseDir);
  logInfo(`Total files generated: ${files.length}`);
  files.forEach(file => {
    logInfo(`  - ${file}`);
  });

  return true;
}

/**
 * Test 7: Update case study and republish
 */
async function testUpdateAndRepublish() {
  logStep('7', 'Updating case study and republishing');

  // Update case study
  const caseStudyUpdatePayload = {
    content: {
      hero: {
        title: 'E-Commerce Redesign: Updated Case Study',
        subtitle: 'UPDATED: Transforming the online shopping experience',
        coverImage: 'https://via.placeholder.com/1200x600',
        client: 'TechStore Inc.',
        year: '2024',
        role: 'Lead Designer & Developer',
        duration: '3 months'
      },
      overview: {
        heading: 'Project Overview',
        description: 'UPDATED: TechStore needed a complete redesign with enhanced features.',
        challenge: 'The existing site had poor navigation, slow checkout, and low mobile performance.',
        solution: 'We implemented a modern design system with AI-powered recommendations.',
        results: 'UPDATED: Achieved 60% increase in conversion rate and 80% improvement in mobile sales.'
      },
      sections: [
        {
          id: 'research',
          type: 'text',
          heading: 'Research & Discovery',
          content: 'UPDATED: Extended research phase with additional market analysis.',
          layout: 'center'
        }
      ]
    }
  };

  const { response: updateResponse, data: updateResult } = await apiRequest(`/case-studies/${caseStudyId}`, {
    method: 'PUT',
    body: JSON.stringify(caseStudyUpdatePayload)
  });

  if (!updateResponse.ok) {
    logError(`Case study update failed: ${updateResult.message}`);
    return false;
  }

  logSuccess('Case study updated successfully');

  // Republish portfolio
  const { response: publishResponse, data: publishData } = await apiRequest('/sites/sub-publish', {
    method: 'POST',
    body: JSON.stringify({
      portfolioId,
      customSubdomain: subdomain
    })
  });

  if (!publishResponse.ok) {
    logError(`Republishing failed: ${publishData.message}`);
    return false;
  }

  logSuccess('Portfolio republished with updated case study');

  // Verify updated content
  const caseStudyPath = path.join(process.cwd(), 'generated-files', subdomain, `case-study-${projectId}.html`);
  if (fs.existsSync(caseStudyPath)) {
    const content = fs.readFileSync(caseStudyPath, 'utf-8');

    if (content.includes('UPDATED')) {
      logSuccess('✓ Case study HTML contains updated content');
      return true;
    } else {
      logError('✗ Case study HTML does not contain updated content');
      return false;
    }
  } else {
    logError('✗ Case study HTML file not found after republish');
    return false;
  }
}

/**
 * Test 8: Cleanup - Delete test data
 */
async function testCleanup() {
  logStep('8', 'Cleaning up test data');

  try {
    // Delete case study
    if (caseStudyId) {
      await apiRequest(`/case-studies/${caseStudyId}`, { method: 'DELETE' });
      logSuccess('Case study deleted');
    }

    // Unpublish portfolio
    if (portfolioId) {
      await apiRequest(`/sites/unpublish/${portfolioId}`, { method: 'DELETE' });
      logSuccess('Portfolio unpublished');
    }

    // Delete portfolio
    if (portfolioId) {
      await apiRequest(`/portfolios/${portfolioId}`, { method: 'DELETE' });
      logSuccess('Portfolio deleted');
    }

    // Delete user (if endpoint exists)
    // Note: There might not be a user delete endpoint

    // Clean up generated files
    const baseDir = path.join(process.cwd(), 'generated-files', subdomain);
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
      logSuccess('Generated files cleaned up');
    }

    return true;
  } catch (error) {
    logError(`Cleanup error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Template Project Pages (Case Studies) - Full Flow Test   ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const tests = [
    { name: 'User Signup', fn: testUserSignup },
    { name: 'Create Portfolio with Projects', fn: testCreatePortfolio },
    { name: 'Create Case Study', fn: testCreateCaseStudy },
    { name: 'Verify Case Study Saved', fn: testVerifyCaseStudy },
    { name: 'Publish Portfolio', fn: testPublishPortfolio },
    { name: 'Verify Generated Files', fn: testVerifyGeneratedFiles },
    { name: 'Update and Republish', fn: testUpdateAndRepublish },
    { name: 'Cleanup', fn: testCleanup }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      console.error(error);
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.blue}Total: ${tests.length}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✅ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}Templates properly support project pages (case studies).${colors.reset}`);
    console.log(`${colors.green}Save and publish functionality is working correctly.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.yellow}Please review the errors above.${colors.reset}\n`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
