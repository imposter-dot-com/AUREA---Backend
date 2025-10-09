/**
 * Deployment Service
 * 
 * This module handles deployment-related functionality, specifically for Vercel.
 * Manages site creation, file generation, and deployment orchestration.
 */

import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates the file structure for Vercel deployment
 * @param {Object} site - Site configuration object
 * @param {string} htmlContent - Generated HTML content (includes CSS inline)
 * @param {string} cssContent - Optional separate CSS content (unused with new generator)
 * @returns {Object} File structure for deployment
 */
export const generateDeploymentFiles = (site, htmlContent, cssContent) => {
  const files = {
    'index.html': htmlContent,
    // Note: CSS is now included inline in HTML, so no separate style.css needed
    'vercel.json': generateVercelConfig(site),
    'package.json': generatePackageJson(site)
  };
  
  return files;
};

/**
 * Generates Vercel configuration file content
 * @param {Object} site - Site configuration object
 * @returns {string} Vercel configuration as JSON string
 */
export const generateVercelConfig = (site) => {
  const config = {
    "version": 2,
    "builds": [
      {
        "src": "**/*",
        "use": "@vercel/static"
      }
    ]
  };
  
  return JSON.stringify(config, null, 2);
};

/**
 * Generates package.json for the deployment
 * @param {Object} site - Site configuration object
 * @returns {string} Package.json content as JSON string
 */
export const generatePackageJson = (site) => {
  const packageJson = {
    name: `${site.subdomain || 'portfolio'}-site`,
    version: "1.0.0",
    description: `Portfolio site for ${site.title || 'Portfolio'}`,
    scripts: {
      build: "echo 'Static site ready'"
    }
  };
  
  return JSON.stringify(packageJson, null, 2);
};

/**
 * Actually deploys files to Vercel using their API
 * @param {Object} files - Files object with filename -> content mappings
 * @param {string} projectName - Name for the Vercel project
 * @param {Object} site - Site configuration object
 * @returns {Promise<Object>} Vercel deployment result
 */
export const deployToVercel = async (files, projectName, site) => {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    
    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN environment variable is not set');
    }

    console.log('🚀 Starting Vercel deployment...');
    console.log(`📦 Project: ${projectName}`);
    
    // Prepare files for Vercel API format
    const vercelFiles = [];
    
    for (const [filename, content] of Object.entries(files)) {
      // Convert content to base64 for Vercel API
      const base64Content = Buffer.from(content, 'utf-8').toString('base64');
      
      vercelFiles.push({
        file: filename,
        data: base64Content,
        encoding: 'base64'
      });
    }

    // Create deployment payload
    const deploymentPayload = {
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: null, // Static site
        buildCommand: null,
        outputDirectory: null,
        installCommand: null,
        devCommand: null
      },
      target: 'production'
    };

    console.log(`📤 Uploading ${vercelFiles.length} files to Vercel...`);

    // Make deployment request to Vercel API
    const deploymentResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentPayload),
      timeout: 60000 // 60 second timeout
    });

    const deploymentData = await deploymentResponse.json();

    if (!deploymentResponse.ok) {
      console.error('❌ Vercel deployment failed:', deploymentData);
      throw new Error(`Vercel API error: ${deploymentData.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Deployment created successfully!');
    console.log(`🔗 Deployment ID: ${deploymentData.uid}`);
    console.log(`🌐 URL: ${deploymentData.url}`);

    // Wait for deployment to complete (but don't wait too long to avoid timeouts)
    console.log('⏳ Checking deployment status...');
    
    // Return immediately with deployment info, don't wait for completion to avoid server timeout
    return {
      success: true,
      deploymentId: deploymentData.uid,
      url: `https://${deploymentData.url}`,
      vercelUrl: `https://${deploymentData.url}`,
      alias: deploymentData.alias ? `https://${deploymentData.alias[0]}` : null,
      status: 'BUILDING', // Will be updated as it deploys
      createdAt: deploymentData.createdAt,
      regions: deploymentData.regions,
      inspectorUrl: `https://vercel.com/deployments/${deploymentData.uid}`
    };

  } catch (error) {
    console.error('❌ Vercel deployment error:', error);
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
};

/**
 * Waits for Vercel deployment to complete
 * @param {string} deploymentId - Vercel deployment ID
 * @param {string} vercelToken - Vercel API token
 * @returns {Promise<Object>} Final deployment status
 */
const waitForDeploymentCompletion = async (deploymentId, vercelToken, maxAttempts = 30) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`
        }
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.readyState === 'READY') {
        console.log('✅ Deployment completed successfully!');
        return statusData;
      } else if (statusData.readyState === 'ERROR') {
        throw new Error(`Deployment failed: ${statusData.error?.message || 'Unknown error'}`);
      } else {
        console.log(`⏳ Deployment status: ${statusData.readyState} (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        attempts++;
      }
    } catch (error) {
      console.error('❌ Error checking deployment status:', error.message);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('Deployment timeout - took too long to complete');
};

/**
 * Saves deployment files to the generated-files directory
 * @param {Object} files - Object containing filename -> content mappings
 * @param {string} baseDir - Base directory path (defaults to generated-files)
 * @returns {Promise<Object>} Result object with success status and file paths
 */
export const saveDeploymentFiles = async (files, baseDir = null) => {
  try {
    const generatedFilesDir = baseDir || path.join(process.cwd(), 'generated-files');
    
    // Ensure the directory exists
    if (!fs.existsSync(generatedFilesDir)) {
      fs.mkdirSync(generatedFilesDir, { recursive: true });
    }
    
    const savedFiles = [];
    
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(generatedFilesDir, filename);
      
      try {
        await fs.promises.writeFile(filePath, content, 'utf8');
        savedFiles.push({
          filename,
          path: filePath,
          size: Buffer.byteLength(content, 'utf8')
        });
        
        console.log(`✅ Generated ${filename} (${Buffer.byteLength(content, 'utf8')} bytes)`);
      } catch (error) {
        console.error(`❌ Failed to save ${filename}:`, error.message);
        throw new Error(`Failed to save ${filename}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      filesGenerated: savedFiles.length,
      files: savedFiles,
      directory: generatedFilesDir,
      totalSize: savedFiles.reduce((total, file) => total + file.size, 0)
    };
    
  } catch (error) {
    console.error('❌ Error saving deployment files:', error);
    return {
      success: false,
      error: error.message,
      filesGenerated: 0
    };
  }
};

/**
 * Validates deployment readiness
 * @param {Object} site - Site configuration object
 * @param {string} htmlContent - Generated HTML content
 * @param {string} cssContent - Generated CSS content
 * @returns {Object} Validation result with issues and recommendations
 */
export const validateDeployment = (site, htmlContent, cssContent) => {
  const issues = [];
  const recommendations = [];
  
  // Validate site configuration
  if (!site.subdomain || site.subdomain.length < 3) {
    issues.push('Site subdomain is missing or too short (minimum 3 characters)');
  }
  
  if (!site.title) {
    recommendations.push('Consider adding a site title for better SEO');
  }
  
  // Validate content
  if (!htmlContent || htmlContent.length < 100) {
    issues.push('HTML content is missing or too short');
  }
  
  if (!cssContent || cssContent.length < 50) {
    recommendations.push('CSS content seems minimal - consider adding more styling');
  }
  
  // Check for common HTML issues
  if (htmlContent && !htmlContent.includes('<title>')) {
    recommendations.push('HTML is missing a <title> tag for SEO');
  }
  
  if (htmlContent && !htmlContent.includes('<meta name="description"')) {
    recommendations.push('Consider adding a meta description for better SEO');
  }
  
  // Check for responsive design
  if (htmlContent && !htmlContent.includes('viewport')) {
    recommendations.push('Add viewport meta tag for mobile responsiveness');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
    score: Math.max(0, 100 - (issues.length * 20) - (recommendations.length * 5))
  };
};

/**
 * Generates a deployment summary report
 * @param {Object} site - Site configuration object
 * @param {Object} deploymentResult - Result from saveDeploymentFiles
 * @param {Object} validationResult - Result from validateDeployment
 * @returns {Object} Comprehensive deployment summary
 */
export const generateDeploymentSummary = (site, deploymentResult, validationResult) => {
  const timestamp = new Date().toISOString();
  
  return {
    deployment: {
      timestamp,
      status: deploymentResult.success ? 'success' : 'failed',
      site: {
        subdomain: site.subdomain,
        title: site.title,
        owner: site.owner,
        template: site.template,
        customDomain: site.customDomain
      },
      files: {
        generated: deploymentResult.filesGenerated || 0,
        totalSize: deploymentResult.totalSize || 0,
        directory: deploymentResult.directory
      },
      validation: {
        score: validationResult.score,
        isValid: validationResult.isValid,
        issuesCount: validationResult.issues?.length || 0,
        recommendationsCount: validationResult.recommendations?.length || 0
      }
    },
    urls: {
      primary: site.customDomain || `https://${site.subdomain}.vercel.app`,
      vercel: `https://${site.subdomain}.vercel.app`,
      admin: `https://vercel.com/dashboard/projects/${site.subdomain}`
    },
    nextSteps: generateNextSteps(site, deploymentResult, validationResult),
    metadata: {
      generatedAt: timestamp,
      generatedBy: 'Aurea Portfolio Generator',
      version: '2.0.0'
    }
  };
};

/**
 * Generates recommended next steps based on deployment results
 * @param {Object} site - Site configuration object
 * @param {Object} deploymentResult - Deployment results
 * @param {Object} validationResult - Validation results
 * @returns {Array} Array of next step recommendations
 */
const generateNextSteps = (site, deploymentResult, validationResult) => {
  const steps = [];
  
  if (deploymentResult.success) {
    steps.push({
      priority: 'high',
      action: 'Deploy to Vercel',
      description: `Upload the generated files from ${deploymentResult.directory} to Vercel`,
      command: 'vercel --prod'
    });
    
    if (site.customDomain) {
      steps.push({
        priority: 'medium',
        action: 'Configure Custom Domain',
        description: `Set up custom domain: ${site.customDomain}`,
        command: `vercel domains add ${site.customDomain}`
      });
    }
  } else {
    steps.push({
      priority: 'critical',
      action: 'Fix File Generation Issues',
      description: 'Resolve file generation errors before deployment',
      error: deploymentResult.error
    });
  }
  
  // Add validation-based steps
  if (validationResult.issues?.length > 0) {
    steps.push({
      priority: 'high',
      action: 'Fix Validation Issues',
      description: 'Address critical validation issues',
      issues: validationResult.issues
    });
  }
  
  if (validationResult.recommendations?.length > 0) {
    steps.push({
      priority: 'low',
      action: 'Implement Recommendations',
      description: 'Apply recommended improvements for better performance',
      recommendations: validationResult.recommendations
    });
  }
  
  // Add monitoring and maintenance steps
  steps.push({
    priority: 'low',
    action: 'Set Up Monitoring',
    description: 'Monitor site performance and analytics',
    tools: ['Vercel Analytics', 'Google Analytics', 'Lighthouse CI']
  });
  
  return steps;
};

/**
 * Creates a deployment checklist for manual verification
 * @param {Object} site - Site configuration object
 * @returns {Object} Deployment checklist
 */
export const createDeploymentChecklist = (site) => {
  return {
    preDeployment: [
      { item: 'Verify site configuration', checked: !!site.subdomain },
      { item: 'Validate portfolio content', checked: !!site.portfolioData },
      { item: 'Check template selection', checked: !!site.template },
      { item: 'Review styling options', checked: !!site.styling }
    ],
    duringDeployment: [
      { item: 'Generate HTML and CSS files', checked: false },
      { item: 'Create Vercel configuration', checked: false },
      { item: 'Validate file structure', checked: false },
      { item: 'Upload to Vercel', checked: false }
    ],
    postDeployment: [
      { item: 'Verify site accessibility', checked: false },
      { item: 'Test responsive design', checked: false },
      { item: 'Check custom domain (if applicable)', checked: false },
      { item: 'Set up SSL certificate', checked: false },
      { item: 'Configure analytics', checked: false }
    ],
    maintenance: [
      { item: 'Regular content updates', checked: false },
      { item: 'Performance monitoring', checked: false },
      { item: 'Backup portfolio data', checked: false },
      { item: 'Security updates', checked: false }
    ]
  };
};

/**
 * Logs deployment activities for debugging and monitoring
 * @param {string} activity - Activity description
 * @param {Object} data - Additional data to log
 * @param {string} level - Log level (info, warn, error)
 */
export const logDeploymentActivity = (activity, data = {}, level = 'info') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    activity,
    ...data
  };
  
  // Console logging with appropriate styling
  const styles = {
    info: '🔵',
    warn: '🟡',
    error: '🔴',
    success: '🟢'
  };
  
  console.log(`${styles[level] || '⚪'} [${timestamp}] ${activity}`, data);
  
  // In production, this could also write to a log file or external service
  return logEntry;
};