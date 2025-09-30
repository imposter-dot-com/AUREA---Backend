import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { initCloudinary } from './src/config/cloudinary.js';
import { setupSwagger } from './src/config/swagger.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import portfolioRoutes from './src/routes/portfolioRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import proposalExtractRoutes from './src/routes/proposalExtract.routes.js';
import siteRoutes from './src/routes/siteRoutes.js';

dotenv.config();

// Initialize Cloudinary after environment variables are loaded
initCloudinary();

const app = express();

// Connect to database
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://aurea-frontend.vercel.app",
  "http://localhost:3000",
  "https://localhost:5173",
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 
    
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
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use(requestLogger);

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
app.use('/api/upload', uploadRoutes);
app.use('/api/proposals', proposalExtractRoutes);
app.use('/api/site', siteRoutes);

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
      upload: '/api/upload',
      proposals: '/api/proposals',
      site: '/api/site',
      health: '/health',
      docs: '/api-docs'
    }
  });
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
