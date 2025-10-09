# 🌟 AUREA Backend API

A comprehensive Node.js/Express backen## 🎯 **COMPLETE API SYSTEM: 17 Endpoints**

A comprehensive portfolio management platform with complete CRUD operations, authentication, and media handling:

### 🏗️ System Architecture
**Authentication Layer**: JWT-based secure access control  
**Portfolio Management**: Complete lifecycle from creation to publishing  
**Case Study System**: Structured project documentation  
**Media Handling**: Professional image upload and management  

### 📊 Core Data Models AUREA Portfolio Builder platform featuring **17 professional API endpoints**, MongoDB Atlas integration, Redis caching, Cloudinary image handling, and complete portfolio management system.

## ✨ Key Features

- 🔐 **Complete Authentication System** - JWT-based user management with secure access control
- 📁 **Advanced Portfolio Management** - Full CRUD operations with publishing, slug management, and view tracking
- 📖 **Case Study System** - Structured case study creation linked to portfolio projects
- 🖼️ **Professional Image Upload** - Cloudinary integration with structured file organization  
- ⚡ **Performance Optimized** - Redis caching, rate limiting, and database indexing
- 🛡️ **Enterprise Security** - Helmet, CORS, validation, and ownership middleware
- 📊 **Interactive Documentation** - Complete Swagger UI with live testing
- 🚀 **Production Ready** - Error handling, logging, and graceful degradationckend API

A modern Node.js/Express backend for the AUREA Portfolio Builder platform featuring **AI-powered PDF extraction** for pricing calculator tools, MongoDB Atlas integration, Cloudinary image handling, and comprehensive API documentation.

## ✨ Key Features

- 🤖 **Two-Step AI PDF Processing** - Advanced document analysis with Gemini AI
- 📊 **Pricing Calculator Integration** - Extract pricing-relevant data from client briefs  
- � **JWT Authentication** - Secure user management with optional auth
- 📁 **Portfolio Management** - Complete portfolio CRUD operations
- 🖼️ **Image Upload** - Cloudinary integration for media handling
- 📖 **Interactive Documentation** - Swagger UI with live testing
- ⚡ **ES6 Modules** - Modern JavaScript with clean architecture

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account
- Cloudinary account
- Redis instance (optional - gracefully degrades if unavailable)

### 1. Installation
```bash
# Clone and install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with your credentials. Contact the team for required environment variables.

### 3. Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
🚀 AUREA Backend Server running on port 5000
📊 Environment: development
✅ MongoDB Connected: cluster-name.mongodb.net
🎯 17 API Endpoints Active
📚 API Documentation: http://localhost:5000/api-docs
```

## 🎯 **MAIN FEATURE: Two-Step PDF Extraction**

Our flagship feature extracts comprehensive data from client proposal PDFs using advanced AI processing:

### 🔍 How It Works
**Step 1**: Complete document analysis - extracts ALL information  
**Step 2**: Pricing-focused filtering - filters pricing calculator relevant data

### � Extracted Data Structure
```javascript
// Portfolio Model
{
  userId: ObjectId,
  title: String,
  description: String,
  templateId: "echelon",
  content: Object,     // Flexible content structure
  styling: Object,     // Custom styling data
  isPublished: Boolean,
  slug: String,        // SEO-friendly URL
  viewCount: Number,
  caseStudies: [ObjectId]
}

// Case Study Model  
{
  portfolioId: ObjectId,
  userId: ObjectId,
  projectId: String,
  content: {
    hero: { title, subtitle, coverImage, client, year, role, duration },
    overview: { heading, description, challenge, solution, results },
    sections: [{ id, type, heading, content, image, images, layout }],
    additionalContext: { heading, content },
    nextProject: { id, title, image }
  }
}
```

### 🛠️ Quick Test
```bash
# Test API connectivity
curl http://localhost:5000/health

# Create portfolio (requires authentication)
# Visit: http://localhost:5000/api-docs
# Navigate to: POST /api/portfolios
```

## 📊 Complete API Endpoints (17 Total)

### 🔐 Authentication Endpoints (3)
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User authentication with JWT tokens  
- `GET /api/auth/me` - Get current user profile (protected)

### 📁 Portfolio Management (8)
- `POST /api/portfolios` - Create new portfolio with template support
- `GET /api/portfolios/:id` - Get portfolio by ID with view tracking
- `PUT /api/portfolios/:id` - Update portfolio (owner only)
- `DELETE /api/portfolios/:id` - Delete portfolio and case studies  
- `GET /api/portfolios/user/:userId` - Get user's portfolios with filtering
- `GET /api/portfolios/slug/:slug/check` - Check slug availability
- `PUT /api/portfolios/:id/publish` - Publish portfolio with slug validation
- `GET /api/public/portfolio/:slug` - Get public portfolio (no auth required)

### 📖 Case Study Management (4)  
- `POST /api/case-studies` - Create case study linked to portfolio project
- `GET /api/case-studies/:id` - Get case study by ID
- `PUT /api/case-studies/:id` - Update case study content
- `DELETE /api/case-studies/:id` - Delete case study

### 🖼️ File Upload System (2)
- `POST /api/upload/image` - Upload image to Cloudinary with validation
- `DELETE /api/upload/image` - Delete image from Cloudinary

## 🔗 Detailed API Documentation

### � Authentication System
All protected endpoints require JWT Bearer tokens in the `Authorization` header:
```bash
Authorization: Bearer <your-jwt-token>
```

#### Registration & Login Flow
```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"securepass123"}'

# 2. Login and get JWT token  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepass123"}'

# 3. Access protected routes
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <jwt-token>"
```

### 📁 Portfolio Management System

#### Creating and Managing Portfolios
```bash
# Create portfolio
curl -X POST http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Portfolio","templateId":"echelon","description":"Portfolio description"}'

# Update portfolio  
curl -X PUT http://localhost:5000/api/portfolios/:id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":{...}}'

# Publish portfolio with slug
curl -X PUT http://localhost:5000/api/portfolios/:id/publish \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"slug":"my-awesome-portfolio"}'
```

### 📖 Case Study System
Case studies are linked to specific projects within portfolios:

```bash
# Create case study
curl -X POST http://localhost:5000/api/case-studies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"portfolio-id","projectId":"project-1","content":{...}}'
```

### 🖼️ Media Upload System
Upload images with automatic Cloudinary optimization:

```bash
# Upload single image
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@myimage.jpg"
```

### 🏥 System Health & Documentation
- **Health Check**: `GET /health` - Server status and database connectivity
- **API Documentation**: `GET /api-docs` - Interactive Swagger UI interface  
- **API Overview**: `GET /` - Available endpoints and system information

## 🛡️ Enterprise-Grade Security & Architecture

### 🔒 Security Features
- **Password Hashing**: bcrypt with salt rounds for secure storage
- **JWT Authentication**: Secure Bearer token validation with 30-day expiration
- **Ownership Middleware**: Users can only access/modify their own resources
- **Rate Limiting**: Endpoint-specific limits (10/min slug checks, 5/min publish, 30/min CRUD)
- **CORS Protection**: Configurable origins with development/production modes
- **Input Validation**: Comprehensive validation with express-validator
- **XSS Protection**: Input sanitization and security headers via Helmet
- **File Upload Security**: Type validation, size limits, and structured storage paths

### 🏗️ Modern Architecture  
- **ES6 Modules**: Modern `import`/`export` syntax throughout codebase
- **Async/Await**: Promise-based asynchronous operations with proper error handling
- **Clean MVC Structure**: Controllers, models, routes, and middleware organized by feature
- **Environment Configuration**: Centralized `.env` management with validation
- **Middleware Pipeline**: Modular request processing with authentication, validation, and ownership
- **Database Optimization**: MongoDB with Mongoose ODM, strategic indexing, and aggregation
- **Caching Layer**: Optional Redis integration with graceful degradation
- **Error Recovery**: Comprehensive error handling with standardized JSON responses

## 📁 Professional Project Structure

```
AUREA---Backend/
├── src/
│   ├── config/
│   │   ├── database.js           # MongoDB Atlas connection with retry logic
│   │   ├── cloudinary.js        # Image upload configuration
│   │   └── swagger.js           # API documentation setup
│   ├── controllers/
│   │   ├── authController.js     # JWT authentication & user management
│   │   ├── portfolioController.js # Portfolio CRUD with publishing system
│   │   ├── caseStudyController.js # Case study management linked to portfolios
│   │   ├── uploadController.js   # Cloudinary image upload & deletion
│   │   ├── proposalExtract.controller.js      # Legacy PDF processing
│   │   └── proposalExtract.genai.controller.js # AI-powered PDF extraction
│   ├── middleware/
│   │   ├── auth.js              # JWT token validation
│   │   ├── ownership.js         # Resource ownership validation
│   │   ├── rateLimiter.js       # Endpoint-specific rate limiting
│   │   ├── validation.js        # Input validation with express-validator
│   │   ├── errorHandler.js      # Standardized error responses
│   │   ├── requestLogger.js     # Request/response logging
│   │   └── upload.js           # Multer file upload configuration
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt authentication
│   │   ├── Portfolio.js        # Portfolio schema with virtual fields & indexes
│   │   └── CaseStudy.js        # Case study schema with structured content
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints (3)
│   │   ├── portfolioRoutes.js   # Portfolio management endpoints (8)
│   │   ├── caseStudyRoutes.js   # Case study endpoints (4)
│   │   ├── uploadRoutes.js      # Image upload endpoints (2)
│   │   └── proposalExtract.routes.js # Legacy PDF extraction endpoints
│   └── utils/
│       ├── cache.js            # Redis caching utilities with fallback
│       └── slugGenerator.js    # Slug validation & generation utilities
├── uploads/                     # Temporary file storage (auto-cleanup)
├── swagger.yaml                 # 📖 Complete API documentation (17 endpoints)
├── package.json                 # 📦 Production-optimized dependencies
├── server.js                    # 🚀 Application entry point with graceful shutdown
├── .env                         # Environment configuration
├── IMPLEMENTATION_SUMMARY.md    # 📋 Complete implementation details
├── PORTFOLIO_CONTROLLER_REVIEW.md # 📋 Controller review & updates
└── README.md                    # 📋 This comprehensive documentation
```

## � Optimized Dependencies

**Production Dependencies:**
```json
{
  "@google/genai": "^1.21.0",           // AI processing for PDF extraction
  "bcrypt": "^6.0.0",                   // Password hashing
  "cloudinary": "^2.7.0",               // Image upload service
  "cors": "^2.8.5",                     // Cross-origin requests
  "dotenv": "^17.2.2",                  // Environment management
  "express": "^5.1.0",                  // Web framework
  "jsonwebtoken": "^9.0.2",             // JWT authentication
  "mongoose": "^8.18.1",                // MongoDB ODM
  "multer": "^2.0.2",                   // File upload handling
  "pdf-text-extract": "^1.5.0",        // PDF text extraction
  "swagger-jsdoc": "^6.2.8",            // API documentation
  "swagger-ui-express": "^5.0.1"        // Interactive documentation UI
}
```

**Development Dependencies:**
```json
{
  "nodemon": "^3.1.10"                  // Auto-restart development server
}
```

**🧹 Removed Unused Dependencies:**
- `@google/generative-ai` (duplicate AI library)
- `pdf-poppler` (unused PDF processor)
- `pdf2json` (unused JSON converter)

## 🚀 Development Workflow

### 1. Setup & Start
```bash
# Install dependencies
npm install

# Configure environment variables
# Create .env file with required credentials

# Start development server
npm run dev
```

### 2. Testing the API
```bash
# Test server health
curl http://localhost:5000/health

# Interactive API testing
open http://localhost:5000/api-docs
```

### 3. API Documentation
- **Interactive UI**: `http://localhost:5000/api-docs`
- **JSON Spec**: `http://localhost:5000/api-docs.json`  
- **YAML Spec**: `http://localhost:5000/api-docs.yaml`

### 4. Health Monitoring
```bash
# Server health check
curl http://localhost:5000/health

# Expected response:
{
  "success": true,
  "message": "AUREA Backend is running",
  "timestamp": "2025-09-26T...",
  "environment": "development"
}
```

## 🎯 Use Cases & Integration

### Pricing Calculator Integration
Perfect for agencies and freelancers who need to:
1. **Upload client brief PDFs** 
2. **Extract project requirements** automatically
3. **Analyze complexity factors** for accurate pricing
4. **Generate pricing recommendations** based on extracted data

### Portfolio Management Platform
Complete portfolio management system for creative professionals:
- **User Registration & JWT Authentication**
- **Portfolio Creation with Template System (Echelon)**  
- **Case Study Management with Rich Content Structure**
- **Professional Image Upload via Cloudinary**
- **Publishing System with Custom Slugs**
- **View Tracking & Analytics**
- **Public Portfolio Sharing**
- **SEO-Friendly URLs**

### Frontend Integration Example
```javascript
// React/Next.js Portfolio Management
const createPortfolio = async (portfolioData) => {
  const response = await fetch('/api/portfolios', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: portfolioData.title,
      templateId: 'echelon',
      description: portfolioData.description,
      content: portfolioData.content
    })
  });
  
  const result = await response.json();
  return result.data; // New portfolio with generated ID
};

// Image Upload Integration
const uploadPortfolioImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  const result = await response.json();
  return result.data.imageUrl; // Cloudinary URL for use in portfolio
};
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 🔑 Authentication Errors
```bash
# "bad auth : authentication failed"
# ✅ Solution: Replace <password> in MONGO_URI with actual password
MONGO_URI=mongodb+srv://username:REAL_PASSWORD@cluster.mongodb.net/aurea
```

#### 🖼️ Image Upload Issues  
```bash
# "Invalid image format" or size errors
# ✅ Solution: Check file type (JPG, JPEG, PNG, WebP) and size limits
curl -X POST -F "image=@photo.jpg" \
  -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/upload/image
```

#### 📁 Portfolio Management Issues
```bash
# "Access denied" or ownership errors
# ✅ Solution: Ensure JWT token is valid and user owns the resource
# Check token expiration (30 days) and refresh if needed

# "Slug already exists" when publishing
# ✅ Solution: Use slug check endpoint before publishing
curl -X GET http://localhost:5000/api/portfolios/slug/my-slug/check
```

#### 🌐 CORS Issues
```bash
# Frontend can't connect to backend
# ✅ Solution: Ensure frontend URL is in allowed origins list
# Check server.js for CORS configuration
```

#### 📦 Dependency Issues
```bash
# Node.js version warnings
# ✅ Solution: Use Node.js 18+ recommended
node --version  # Should be v18+
```

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development npm run dev

# Check logs for:
# ✅ MongoDB connection success
# ✅ Swagger UI availability  
# ✅ Redis connection status (optional)
# ✅ Cloudinary configuration
```

## 🚀 Production Deployment

### Environment Setup
Ensure all required environment variables are properly configured for production:
- Database connection strings
- API keys for third-party services (Cloudinary, Redis)
- JWT secrets and security configurations
- CORS allowed origins

### Build & Start
```bash
# Production build check
npm run build

# Start production server
npm start
```

### Health Monitoring
Monitor these endpoints in production:
- `GET /health` - Server status and environment information
- `GET /api-docs` - API documentation availability
- Database connection logs in console
- Redis connection status (if enabled)

## 📈 Performance Optimization

- **Redis Caching**: Optional caching for public portfolios (5-10 min TTL)
- **Database Indexing**: Strategic indexes on userId, slug, isPublished fields
- **Rate Limiting**: Endpoint-specific limits to prevent abuse
- **Response Compression**: Gzip compression for all API responses
- **MongoDB Optimization**: Efficient queries with proper pagination
- **Graceful Degradation**: Redis optional, system works without caching
- **Connection Pooling**: Optimized MongoDB connection management

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- Use ES6+ features consistently
- Follow existing file structure
- Add JSDoc comments for complex functions
- Update swagger.yaml for new endpoints
- Test all endpoints before submitting

---

## 📞 Support & Documentation

- **API Documentation**: http://localhost:5000/api-docs  
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md` for complete details
- **Controller Review**: See `PORTFOLIO_CONTROLLER_REVIEW.md` for endpoint specifications
- **Issues**: Create GitHub issue with detailed description

---

**🎉 AUREA Backend - Professional Portfolio Management API**  
**Version**: 1.0.0 | **Status**: Production Ready | **Last Updated**: October 8, 2025
