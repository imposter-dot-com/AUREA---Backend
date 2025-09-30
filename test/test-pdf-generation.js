// /**
//  * Test Script: PDF Generation for Published Portfolio
//  * 
//  * This script logs into the user account and generates a PDF of their published portfolio
//  */

// import fetch from 'node-fetch';
// import fs from 'fs';
// import path from 'path';

// const BASE_URL = 'http://localhost:5000';
// const USER_EMAIL = 'user2@example.com';
// const USER_PASSWORD = '123456';

// /**
//  * Check if server is ready
//  */
// async function waitForServer(maxAttempts = 10) {
//   console.log('🔍 Checking server status...');
  
//   for (let i = 0; i < maxAttempts; i++) {
//     try {
//       const response = await fetch(`${BASE_URL}/health`, { timeout: 5000 });
//       if (response.ok) {
//         console.log('✅ Server is ready!');
//         return true;
//       }
//     } catch (error) {
//       console.log(`⏳ Attempt ${i + 1}/${maxAttempts}...`);
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   }
  
//   throw new Error('Server not ready after maximum attempts');
// }

// /**
//  * Authenticate user and get auth token
//  */
// async function authenticateUser() {
//   console.log('🔐 Authenticating user...');
  
//   const response = await fetch(`${BASE_URL}/api/auth/login`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       email: USER_EMAIL,
//       password: USER_PASSWORD,
//     }),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(`Authentication failed: ${error.message}`);
//   }

//   const data = await response.json();
//   console.log('✅ Authentication successful');
  
//   if (data.data && data.data.user) {
//     console.log(`👤 User: ${data.data.user.name} (${data.data.user.email})`);
//   }
  
//   return data.data.token;
// }

// /**
//  * Get user's published sites
//  */
// async function getUserSites(token) {
//   console.log('📋 Fetching user sites...');
  
//   const response = await fetch(`${BASE_URL}/api/sites/status`, {
//     method: 'GET',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(`Failed to fetch sites: ${error.message}`);
//   }

//   const data = await response.json();
//   return data.sites || [];
// }

// /**
//  * Generate PDF for a specific subdomain
//  */
// async function generatePortfolioPDF(token, subdomain) {
//   console.log(`📄 Generating PDF for subdomain: ${subdomain}`);
  
//   const response = await fetch(`${BASE_URL}/api/site/${subdomain}/pdf?format=A4&quality=high`, {
//     method: 'GET',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//     },
//   });

//   console.log(`🔍 Response status: ${response.status} ${response.statusText}`);

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`❌ Response body: ${errorText}`);
//     throw new Error(`PDF generation failed: ${response.status} ${response.statusText} - ${errorText}`);
//   }

//   // Get PDF buffer
//   const pdfBuffer = await response.buffer();
  
//   // Save PDF to file
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//   const filename = `portfolio-${subdomain}-${timestamp}.pdf`;
//   const filepath = path.join(process.cwd(), 'test', filename);
  
//   // Ensure test directory exists
//   if (!fs.existsSync(path.join(process.cwd(), 'test'))) {
//     fs.mkdirSync(path.join(process.cwd(), 'test'));
//   }
  
//   fs.writeFileSync(filepath, pdfBuffer);
  
//   console.log(`✅ PDF generated successfully!`);
//   console.log(`📄 File saved: ${filepath}`);
//   console.log(`📊 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
  
//   return filepath;
// }

// /**
//  * Main test function
//  */
// async function testPDFGeneration() {
//   try {
//     console.log('🚀 Starting PDF Generation Test...\n');
    
//     // Check server status
//     await waitForServer();
    
//     // Authenticate user
//     const token = await authenticateUser();
    
//     // Check for published sites
//     console.log('\n📋 Checking for published portfolios...');
    
//     // First, let's check if there are any sites in the generated-files directory
//     const generatedFilesPath = path.join(process.cwd(), 'generated-files');
//     if (fs.existsSync(generatedFilesPath)) {
//       const sites = fs.readdirSync(generatedFilesPath);
      
//       if (sites.length > 0) {
//         console.log(`📁 Found ${sites.length} published site(s):`);
//         sites.forEach(site => console.log(`   • ${site}`));
        
//         // Generate PDF for the first available site
//         const selectedSite = sites[0];
//         console.log(`\n🎯 Selected site for PDF generation: ${selectedSite}`);
        
//         // Get a fresh token for PDF generation
//         const freshToken = await authenticateUser();
//         const pdfPath = await generatePortfolioPDF(freshToken, selectedSite);
        
//         console.log('\n✅ PDF Generation Test Completed Successfully!');
//         console.log(`📄 PDF saved at: ${pdfPath}`);
        
//         // Test opening the generated site in browser (optional)
//         console.log(`\n🌐 You can view the live site at: ${BASE_URL}/api/site/${selectedSite}`);
//         console.log(`📥 You can download the PDF at: ${BASE_URL}/api/site/${selectedSite}/pdf`);
        
//       } else {
//         console.log('⚠️ No published sites found. Please run the publish test first.');
//         console.log('💡 Run: node test/test-publish-flow.js');
//       }
//     } else {
//       console.log('⚠️ No generated-files directory found. No sites have been published yet.');
//       console.log('💡 Run: node test/test-publish-flow.js');
//     }
    
//   } catch (error) {
//     console.error('❌ Test failed:', error.message);
//     console.error('\n🔧 Troubleshooting:');
//     console.error('1. Make sure the server is running: npm run dev');
//     console.error('2. Make sure the user account exists: node test/test-publish-flow.js');
//     console.error('3. Make sure there are published portfolios available');
//     process.exit(1);
//   }
// }

// // Run the test
// testPDFGeneration();