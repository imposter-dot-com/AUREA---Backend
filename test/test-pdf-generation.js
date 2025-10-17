/**
 * Test Script for PDF Generation Route
 *
 * This script tests the PDF generation functionality
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';
let authToken = null;
let userId = null;
let portfolioId = null;

// Test user credentials
const testUser = {
  email: `testpdf${Date.now()}@example.com`,
  password: 'Test@123456',
  name: 'PDF Test User'
};

// Sample portfolio data matching templateConvert.js structure
const samplePortfolio = {
  title: 'PDF Export Test Portfolio',
  description: 'Testing PDF generation functionality',
  templateId: 'echelon',
  content: {
    hero: {
      title: 'DESIGNING WITH PRECISION',
      subtitle: 'Case studies in clarity and form'
    },
    about: {
      name: 'JOHN DESIGNER',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      bio: 'I am a designer focused on minimalism, clarity, and modernist design systems. My work emphasizes grid-based layouts, precise typography, and functional design solutions.'
    },
    work: {
      heading: 'SELECTED WORK',
      projects: [
        {
          id: 1,
          title: 'BRAND IDENTITY SYSTEM',
          description: 'Comprehensive brand identity and guidelines for a tech startup.',
          image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
          meta: '2024 — Branding',
          category: 'branding',
          hasCaseStudy: false
        },
        {
          id: 2,
          title: 'WEBSITE REDESIGN',
          description: 'Complete redesign of corporate website with modern aesthetic.',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
          meta: '2024 — Web Design',
          category: 'web',
          hasCaseStudy: false
        }
      ]
    },
    gallery: {
      heading: 'VISUAL STUDIES',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
          caption: 'Visual exploration 01',
          meta: '01'
        },
        {
          src: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80',
          caption: 'Visual exploration 02',
          meta: '02'
        }
      ]
    },
    contact: {
      heading: 'GET IN TOUCH',
      text: 'Available for new projects and collaborations.',
      button: 'CONTACT ME',
      email: 'hello@designer.com'
    }
  }
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${data.message || 'Unknown error'}`);
  }

  return data;
}

// Test functions
async function createTestUser() {
  console.log('📝 Creating test user...');

  try {
    await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    console.log('✅ User created successfully');

    // Login to get token
    const loginResponse = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    authToken = loginResponse.token || loginResponse.data?.token;
    userId = loginResponse.user?._id || loginResponse.user?.id || loginResponse.data?.user?._id || loginResponse.data?.user?.id;

    console.log('✅ Logged in successfully');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   User ID: ${userId}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to create/login user:', error.message);
    return false;
  }
}

async function createTestPortfolio() {
  console.log('\n📁 Creating test portfolio...');

  try {
    const response = await apiRequest('/api/portfolios', {
      method: 'POST',
      body: JSON.stringify(samplePortfolio)
    });

    // Debug log to check response structure
    console.log('   Response keys:', Object.keys(response));
    if (response.data) {
      console.log('   Data keys:', Object.keys(response.data));
    }

    // Extract portfolio ID from nested structure
    if (response.data?.portfolio) {
      portfolioId = response.data.portfolio._id || response.data.portfolio.id;
    } else if (response.data) {
      portfolioId = response.data._id || response.data.id;
    } else {
      portfolioId = response._id || response.id;
    }

    console.log('✅ Portfolio created successfully');
    console.log(`   Portfolio ID: ${portfolioId}`);
    console.log(`   Title: ${response.data?.title || response.portfolio?.title || samplePortfolio.title}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to create portfolio:', error.message);
    return false;
  }
}

async function testPDFGeneration() {
  console.log('\n📄 Testing PDF generation...');

  try {
    // Test 1: Get PDF info
    console.log('\n1️⃣ Getting PDF export info...');
    const infoResponse = await apiRequest(`/api/pdf/portfolio/${portfolioId}/info`);
    console.log('✅ PDF info retrieved:');
    console.log(`   Projects: ${infoResponse.data.portfolio.projectCount}`);
    console.log(`   Case Studies: ${infoResponse.data.portfolio.caseStudyCount}`);
    console.log(`   Estimated Size: ${infoResponse.data.exportInfo.estimatedSize.total}`);

    // Test 2: Generate main portfolio PDF
    console.log('\n2️⃣ Generating portfolio PDF...');
    const pdfResponse = await fetch(`${API_BASE_URL}/api/pdf/portfolio/${portfolioId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!pdfResponse.ok) {
      const error = await pdfResponse.text();
      throw new Error(`PDF generation failed: ${error}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer().then(buf => Buffer.from(buf));
    console.log(`✅ PDF generated successfully (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

    // Test 3: Test download endpoint
    console.log('\n3️⃣ Testing PDF download endpoint...');
    const downloadResponse = await fetch(`${API_BASE_URL}/api/pdf/portfolio/${portfolioId}/download`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!downloadResponse.ok) {
      throw new Error('Download endpoint failed');
    }

    const contentDisposition = downloadResponse.headers.get('content-disposition');
    console.log(`✅ Download endpoint working`);
    console.log(`   Content-Disposition: ${contentDisposition}`);

    // Test 4: Test complete PDF generation (with case studies)
    console.log('\n4️⃣ Generating complete PDF (portfolio + case studies)...');
    const completeResponse = await fetch(`${API_BASE_URL}/api/pdf/portfolio/${portfolioId}/complete`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.text();
      console.warn(`⚠️  Complete PDF generation failed (expected if no case studies): ${error}`);
    } else {
      const completeBuffer = await completeResponse.arrayBuffer().then(buf => Buffer.from(buf));
      console.log(`✅ Complete PDF generated (${(completeBuffer.length / 1024).toFixed(2)} KB)`);
    }

    // Optional: Save PDF to file for manual inspection
    if (pdfBuffer.length > 0) {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const outputDir = path.join(process.cwd(), 'test-output');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `test-portfolio-${Date.now()}.pdf`);
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`\n💾 PDF saved to: ${outputPath}`);
      console.log('   You can open this file to verify the PDF quality');
    }

    return true;
  } catch (error) {
    console.error('❌ PDF generation test failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    if (portfolioId) {
      await apiRequest(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE'
      });
      console.log('✅ Portfolio deleted');
    }

    // Note: User deletion would require admin privileges
    // For now, test users will remain in the database

    return true;
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting PDF Generation Tests');
  console.log('=' .repeat(50));

  let allTestsPassed = true;

  try {
    // Check if server is running
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('Server is not running. Please start the server first.');
    }
    console.log('✅ Server is running\n');

    // Run tests
    if (!await createTestUser()) {
      allTestsPassed = false;
    } else if (!await createTestPortfolio()) {
      allTestsPassed = false;
    } else if (!await testPDFGeneration()) {
      allTestsPassed = false;
    }

    // Cleanup
    await cleanup();

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    allTestsPassed = false;
  }

  console.log('\n' + '=' .repeat(50));
  if (allTestsPassed) {
    console.log('✅ All PDF generation tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the logs above.');
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
runTests();