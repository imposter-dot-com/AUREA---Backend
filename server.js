// CRITICAL: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// NOTE: Commented out due to Express 5 incompatibility
// import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'xss-clean';
import hpp from 'hpp';
import connectDB from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { generalApiLimiter } from './src/middleware/rateLimiter.js';
import { initCloudinary } from './src/config/cloudinary.js';
import { initRedis } from './src/utils/cache.js';
// Swagger import moved to dynamic import below for production check
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

// Security and performance middleware with portfolio-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for static HTML
      frameSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// CORS configuration
const allowedOrigins = [
  "3.12.251.153",
  "3.20.63.178",
  "3.77.67.4",
  "3.79.134.69",
  "3.105.133.239",
  "3.105.190.221",
  "3.133.226.214",
  "3.149.57.90",
  "3.212.128.62",
  "5.161.61.238",
  "5.161.73.160",
  "5.161.75.7",
  "5.161.113.195",
  "5.161.117.52",
  "5.161.177.47",
  "5.161.194.92",
  "5.161.215.244",
  "5.223.43.32",
  "5.223.53.147",
  "5.223.57.22",
  "18.116.205.62",
  "18.180.208.214",
  "18.192.166.72",
  "18.193.252.127",
  "24.144.78.39",
  "24.144.78.185",
  "34.198.201.66",
  "45.55.123.175",
  "45.55.127.146",
  "49.13.24.81",
  "49.13.130.29",
  "49.13.134.145",
  "49.13.164.148",
  "49.13.167.123",
  "52.15.147.27",
  "52.22.236.30",
  "52.28.162.93",
  "52.59.43.236",
  "52.87.72.16",
  "54.64.67.106",
  "54.79.28.129",
  "54.87.112.51",
  "54.167.223.174",
  "54.249.170.27",
  "63.178.84.147",
  "64.225.81.248",
  "64.225.82.147",
  "69.162.124.227",
  "69.162.124.235",
  "69.162.124.238",
  "78.46.190.63",
  "78.46.215.1",
  "78.47.98.55",
  "78.47.173.76",
  "88.99.80.227",
  "91.99.101.207",
  "128.140.41.193",
  "128.140.106.114",
  "129.212.132.140",
  "134.199.240.137",
  "138.197.53.117",
  "138.197.53.138",
  "138.197.54.143",
  "138.197.54.247",
  "138.197.63.92",  
  "139.59.50.44",
  "142.132.180.39",
  "143.198.249.237",
  "143.198.250.89",
  "143.244.196.21",
  "143.244.196.211",
  "143.244.221.177",
  "144.126.251.21",
  "146.190.9.187",
  "152.42.149.135",
  "157.90.155.240",
  "157.90.156.63",
  "159.69.158.189",
  "159.223.243.219",
  "161.35.247.201",
  "167.99.18.52",
  "167.235.143.113",
  "168.119.53.160",
  "168.119.96.239",
  "168.119.123.75",
  "170.64.250.64",
  "170.64.250.132",
  "170.64.250.235",
  "178.156.181.172",
  "178.156.184.20",
  "178.156.185.127",
  "178.156.185.231",
  "178.156.187.238",
  "178.156.189.113",
  "178.156.189.249",
  "188.166.201.79",
  "206.189.241.133",
  "209.38.49.1",
  "209.38.49.206",
  "209.38.49.226",
  "209.38.51.43",
  "209.38.53.7",
  "209.38.124.252",
  "216.144.248.18",
  "216.144.248.19",
  "216.144.248.21",
  "216.144.248.22",
  "216.144.248.23",
  "216.144.248.24",
  "216.144.248.25",
  "216.144.248.26",
  "216.144.248.27",
  "216.144.248.28",
  "216.144.248.29",
  "216.144.248.30",
  "216.245.221.83",
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, Swagger UI, server-to-server)
    // This includes API calls, CLI tools, mobile apps, etc.
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow localhost origins for local testing
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Remove any trailing slashes for comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanAllowedOrigins = allowedOrigins
      .filter(o => o) // Remove null/undefined
      .map(o => o.replace(/\/$/, '')); // Remove trailing slashes
// CORS configuration

    if (cleanAllowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - cache preflight requests
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware - Input Sanitization
// NOTE: express-mongo-sanitize is currently incompatible with Express 5
// TODO: Replace with manual NoSQL injection protection or wait for package update
// Temporarily disabled to avoid breaking the server
// app.use(mongoSanitize({
//   replaceWith: '_'
// }));

// Prevent XSS attacks
// NOTE: xss-clean is also incompatible with Express 5 (Cannot set property query)
// TODO: Replace with express-validator sanitization or wait for package update
// Temporarily disabled to avoid breaking the server
// app.use(xss());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp({
  whitelist: ['sort', 'filter', 'page', 'limit', 'tags', 'category'] // Allow these params to appear multiple times
}));

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

// Puppeteer health check route - Tests if Chrome can launch successfully
app.get('/health/puppeteer', async (req, res) => {
  try {
    // Import browser pool
    const { default: browserPool } = await import('./src/infrastructure/pdf/BrowserPool.js');

    // Try to acquire and release a browser
    const startTime = Date.now();
    const browser = await browserPool.acquire();

    // Get browser version
    const version = await browser.version();

    // Get pool stats
    const stats = browserPool.getStats();

    // Release browser back to pool
    await browserPool.release(browser);

    const duration = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Puppeteer is working correctly',
      details: {
        browserVersion: version,
        poolStats: stats,
        testDurationMs: duration,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isRailway: process.env.RAILWAY_ENVIRONMENT !== undefined,
          pdfConfig: {
            browserPoolSize: process.env.PDF_BROWSER_POOL_SIZE || '3',
            fastMode: process.env.PDF_FAST_MODE || 'false',
            maxTimeout: process.env.PDF_MAX_TIMEOUT || '10000',
            cacheEnabled: process.env.PDF_CACHE_ENABLED || 'true'
          }
        }
      }
    });
  } catch (error) {
    console.error('Puppeteer health check failed:', error);

    res.status(503).json({
      success: false,
      message: 'Puppeteer health check failed',
      error: error.message,
      details: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isRailway: process.env.RAILWAY_ENVIRONMENT !== undefined,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
          skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        },
        helpMessage: 'Check if Chromium is installed and PUPPETEER_EXECUTABLE_PATH is set correctly'
      }
    });
  }
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

// Setup Swagger documentation (only in development)
if (process.env.NODE_ENV !== 'production') {
  const { setupSwagger } = await import('./src/config/swagger.js');
  setupSwagger(app);
  console.log('📚 Swagger documentation available at http://localhost:5000/api-docs');
} else {
  // Swagger documentation completely disabled in production
  console.log('🔒 API documentation disabled in production mode');
}

// Root route - Minimal response for security
app.get('/', (req, res) => {
  res.status(200).json({
    success: true
  });
});

// Portfolio HTML serving routes - MUST come after API routes
// This serves the static HTML files generated during publish
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for error pages
const renderErrorPage = (title, message) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AUREA</title>
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
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/">← Back to AUREA</a></p>
  </div>
</body>
</html>`;

// Middleware to relax CSP for portfolio pages (they're static HTML)
const relaxCSPForPortfolios = (req, res, next) => {
  // Set a more permissive CSP for portfolio pages
  res.setHeader('Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " +
    "style-src * 'unsafe-inline';"
  );
  next();
};

// Serve case study HTML files
app.get('/:subdomain/case-study-:projectId.html', relaxCSPForPortfolios, async (req, res) => {
  try {
    const { subdomain, projectId } = req.params;
    const site = await Site.findBySubdomain(subdomain, false);

    if (!site) {
      return res.status(404).send(renderErrorPage(
        '📁 Portfolio Not Found',
        "The portfolio you're looking for doesn't exist or has been unpublished."
      ));
    }

    const caseStudyPath = path.join(__dirname, 'generated-files', subdomain, `case-study-${projectId}.html`);

    if (fs.existsSync(caseStudyPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(caseStudyPath);
    }

    res.status(404).send(renderErrorPage(
      '📄 Case Study Not Found',
      'The case study file is missing. Please try republishing your portfolio.'
    ));
  } catch (error) {
    console.error('Error serving case study:', error);
    res.status(500).send(renderErrorPage(
      '❌ Error',
      'An error occurred while loading the case study.'
    ));
  }
});

// Serve main portfolio HTML
app.get('/:subdomain/html', relaxCSPForPortfolios, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const site = await Site.findBySubdomain(subdomain, false);

    if (!site) {
      return res.status(404).send(renderErrorPage(
        '📁 Portfolio Not Found',
        "The portfolio you're looking for doesn't exist or has been unpublished."
      ));
    }

    const sitePath = path.join(__dirname, 'generated-files', subdomain, 'index.html');

    if (fs.existsSync(sitePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(sitePath);
    }

    res.status(404).send(renderErrorPage(
      '⚠️ Files Not Found',
      'The HTML files are missing. Please republish your portfolio.'
    ));
  } catch (error) {
    console.error('Error serving portfolio:', error);
    res.status(500).send(renderErrorPage(
      '❌ Error',
      'An error occurred while loading the portfolio.'
    ));
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const baseUrl = isDevelopment ? `http://localhost:${PORT}` : `Port ${PORT}`;

  console.log(`
🚀 AUREA Backend Server running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🌐 API Base: ${baseUrl}${isDevelopment ? '\n📚 API Docs: http://localhost:' + PORT + '/api-docs' : ''}

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

