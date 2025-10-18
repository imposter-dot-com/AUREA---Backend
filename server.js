import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { generalApiLimiter } from './src/middleware/rateLimiter.js';
import { initCloudinary } from './src/config/cloudinary.js';
import { initRedis } from './src/utils/cache.js';
import { setupSwagger } from './src/config/swagger.js';
import Template from './src/models/Template.js';
import Site from './src/models/Site.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import portfolioRoutes from './src/routes/portfolioRoutes.js';
import caseStudyRoutes from './src/routes/caseStudyRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import proposalExtractRoutes from './src/routes/proposalExtract.routes.js';
import siteRoutes from './src/routes/siteRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import pdfRoutes from './src/routes/pdfRoutes.js';
import templateRoutes from './src/routes/templateRoutes.js';

dotenv.config();

// Initialize services after environment variables are loaded
initCloudinary();
initRedis();

const app = express();

// Connect to database
connectDB();

// Initialize templates on startup
async function initializeTemplates() {
  try {
    const templateCount = await Template.countDocuments();

    if (templateCount === 0) {
      console.log('📝 No templates found. Running template seeder...');
      const seedTemplates = (await import('./seeds/templateSeeds.js')).default;
      await seedTemplates();
      console.log('✅ Templates initialized successfully');
    } else {
      console.log(`✅ Found ${templateCount} existing templates`);
    }
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
    // Don't crash the server if templates can't be initialized
  }
}

// Run initialization after database connection
setTimeout(() => {
  initializeTemplates();
}, 2000);

// Security and performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://aurea-frontend.vercel.app",
  "http://localhost:3000",
  "https://localhost:5173",
  "https://localhost:5000",
  "https://www.aurea.tools",
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, Swagger UI)
    if (!origin) return callback(null, true); 
    
    // In development, allow all localhost origins for Swagger UI
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Remove any trailing slashes for comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanAllowedOrigins = allowedOrigins.map(o => o ? o.replace(/\/$/, '') : o);
    
    if (cleanAllowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use(requestLogger);

// Apply general rate limiting to all routes
app.use('/api/', generalApiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AUREA Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Favicon route (prevents 404 errors in browser)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Common browser requests
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /api/\nAllow: /');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/proposals', proposalExtractRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdf', pdfRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to AUREA Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      portfolios: '/api/portfolios',
      caseStudies: '/api/case-studies',
      templates: '/api/templates',
      upload: '/api/upload',
      proposals: '/api/proposals',
      sites: '/api/sites',
      users: '/api/users',
      pdf: '/api/pdf',
      health: '/health',
      docs: '/api-docs',
      'portfolio-html': '/:subdomain/html',
      'case-study-html': '/:subdomain/case-study-:projectId.html'
    }
  });
});

// Portfolio HTML serving routes - MUST come after API routes
// This serves the static HTML files generated during publish
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve case study HTML files
app.get('/:subdomain/case-study-:projectId.html', async (req, res) => {
  try {
    const { subdomain, projectId } = req.params;

    // Check if site is active in database
    const site = await Site.findBySubdomain(subdomain, false);

    if (!site) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portfolio Not Found - AUREA</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #2d3748; margin-bottom: 10px; }
              p { color: #718096; line-height: 1.6; }
              a { color: #fb8500; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📁 Portfolio Not Found</h1>
              <p>The portfolio you're looking for doesn't exist or has been unpublished.</p>
              <p><a href="/">← Back to AUREA</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Serve the case study HTML file
    const caseStudyPath = path.join(__dirname, 'generated-files', subdomain, `case-study-${projectId}.html`);

    if (fs.existsSync(caseStudyPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(caseStudyPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Case Study Not Found - AUREA</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #2d3748; margin-bottom: 10px; }
              p { color: #718096; line-height: 1.6; }
              a { color: #fb8500; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📄 Case Study Not Found</h1>
              <p>The case study file is missing. Please try republishing your portfolio.</p>
              <p><a href="/${subdomain}/html">← Back to Portfolio</a></p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving case study HTML:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - AUREA</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #2d3748; margin-bottom: 10px; }
            p { color: #718096; line-height: 1.6; }
            a { color: #fb8500; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error Loading Case Study</h1>
            <p>An error occurred while loading the case study. Please try again later.</p>
            <p><a href="/">← Back to AUREA</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Serve main portfolio HTML
app.get('/:subdomain/html', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Check if site is active in database
    const site = await Site.findBySubdomain(subdomain, false); // false = only active sites

    if (!site) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portfolio Not Found - AUREA</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #2d3748; margin-bottom: 10px; }
              p { color: #718096; line-height: 1.6; }
              a {
                color: #fb8500;
                text-decoration: none;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📁 Portfolio Not Found</h1>
              <p>The portfolio you're looking for doesn't exist or has been unpublished.</p>
              <p><a href="/">← Back to AUREA</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Serve the static HTML file
    const sitePath = path.join(__dirname, 'generated-files', subdomain, 'index.html');

    if (fs.existsSync(sitePath)) {
      // Set proper headers for HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(sitePath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Files Not Found - AUREA</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #2d3748; margin-bottom: 10px; }
              p { color: #718096; line-height: 1.6; }
              a {
                color: #fb8500;
                text-decoration: none;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Portfolio Files Not Found</h1>
              <p>The HTML files for this portfolio are missing. Please try republishing your portfolio.</p>
              <p><a href="/">← Back to AUREA</a></p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving HTML:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - AUREA</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #2d3748; margin-bottom: 10px; }
            p { color: #718096; line-height: 1.6; }
            a {
              color: #fb8500;
              text-decoration: none;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error Loading Portfolio</h1>
            <p>An error occurred while loading the portfolio. Please try again later.</p>
            <p><a href="/">← Back to AUREA</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
🚀 AUREA Backend Server running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🌐 API Base URL: http://localhost:${PORT}
📖 Health Check: http://localhost:${PORT}/health
📚 API Documentation: http://localhost:${PORT}/api-docs
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  console.log('Shutting down the server due to Uncaught Exception');
  process.exit(1);
});

export default app;
