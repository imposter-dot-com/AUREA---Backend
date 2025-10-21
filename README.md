<div align="center">

# 🌟 AUREA Backend API

### Professional Portfolio Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.18+-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**A comprehensive, production-ready portfolio management system with 65+ API endpoints, dynamic template system, AI-powered PDF processing, and enterprise-grade security.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [API Docs](#-api-reference) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

AUREA Backend is a sophisticated portfolio management platform that enables designers, developers, and creative professionals to build, manage, and deploy stunning portfolio websites. Built with modern technologies and best practices, it offers a complete ecosystem for portfolio creation and management.

### What Makes AUREA Special?

- **🎨 Dynamic Template System** - Schema-driven templates with no-code deployment
- **🤖 AI-Powered Processing** - Gemini AI integration for intelligent PDF extraction
- **🌐 Multi-Deployment Options** - Vercel deployment or local subdomain hosting
- **📱 Responsive HTML Generation** - Automatic mobile-optimized site generation
- **🔒 Enterprise Security** - JWT authentication, rate limiting, and role-based access
- **⚡ High Performance** - Redis caching, database indexing, and optimized queries
- **📊 Analytics & Tracking** - View counts, usage statistics, and user insights

---

## ✨ Key Features

### 🔐 Authentication & User Management
- **JWT-Based Authentication** with secure token management
- **Complete User CRUD** with profile management and password updates
- **Role-Based Access Control** (User, Admin, Premium)
- **Account Security** with password hashing (bcrypt) and validation

### 📁 Portfolio Management
- **Full Portfolio Lifecycle** - Create, Read, Update, Delete operations
- **Dynamic Template System** - 10+ professional templates with schema validation
- **Custom Slug URLs** - SEO-friendly portfolio URLs
- **Publishing System** - Publish/unpublish with version control
- **View Analytics** - Track portfolio views and engagement

### � Template System (NEW)
- **Schema-Driven Architecture** - JSON schema defines form structure
- **Real-Time Validation** - Content validation against template schema
- **Version Control** - Template versioning with rollback capability
- **Rating System** - User-driven template ratings and feedback
- **Premium Templates** - Support for free and premium template tiers
- **14 Template Endpoints** - Complete template lifecycle management

### 📖 Case Study System
- **Structured Project Documentation** - Rich case study creation
- **Smart Content Transformation** - Automatic HTML generation from data
- **Linked to Portfolios** - Seamless integration with portfolio projects
- **Public Access** - Share case studies via public URLs
- **Responsive Design** - Mobile-optimized case study pages

### 🌐 Site Publishing System
- **Vercel Deployment** - One-click deployment to Vercel
- **Gmail-Style Subdomains** ⭐ - Custom subdomains (e.g., `aurea.tool/your-name`)
- **Dual Publishing Modes** - Vercel OR local subdomain hosting
- **Automatic HTML Generation** - Dynamic responsive HTML from portfolio data
- **View Tracking** - Analytics for published sites

### 📄 PDF Export System
- **Portfolio PDF Export** - Generate professional PDF portfolios
- **Complete Export** - Include all case studies in single PDF
- **Template-Based Generation** - Multiple PDF templates available
- **Download or View** - Inline viewing or force download
- **Automatic Cleanup** - Old PDF cleanup functionality

### 🤖 AI-Powered PDF Processing
- **Gemini AI Integration** - Advanced document analysis
- **Two-Step Extraction** - Complete analysis + pricing focus
- **Structured Data Output** - Clean, usable JSON format
- **Extraction History** - Track all processed documents
- **Test Endpoints** - Verify AI connectivity

### 🖼️ Media Management
- **Cloudinary Integration** - Professional image hosting
- **Single & Batch Upload** - Upload one or multiple images
- **Image Validation** - Format and size validation
- **Automatic Optimization** - Image optimization on upload
- **Delete Functionality** - Remove images from cloud storage

### �️ Security & Performance
- **Helmet.js** - HTTP security headers
- **CORS Protection** - Configurable cross-origin policies
- **Rate Limiting** - Per-endpoint rate limits
- **Redis Caching** - Optional high-performance caching
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Centralized error management
- **Request Logging** - Detailed API request logs

### � Interactive Documentation
- **Swagger UI** - Complete API documentation at `/api-docs`
- **Live Testing** - Test endpoints directly from browser
- **Request/Response Examples** - Comprehensive examples for all endpoints
- **Authentication Support** - Test protected endpoints with JWT tokens

---

## � Technology Stack

### Core Technologies
- **Runtime:** Node.js 18+
- **Framework:** Express 5.1.0
- **Database:** MongoDB 8.18+ (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Cloudinary
- **Caching:** Redis 4.7+ (optional)

### Key Dependencies
```json
{
  "express": "^5.1.0",           // Web framework
  "mongoose": "^8.18.1",         // MongoDB ODM
  "jsonwebtoken": "^9.0.2",      // JWT authentication
  "bcrypt": "^6.0.0",            // Password hashing
  "cloudinary": "^2.7.0",        // Media management
  "puppeteer": "^24.25.0",       // PDF generation
  "@google/genai": "^1.21.0",    // AI processing
  "helmet": "^8.0.0",            // Security headers
  "express-rate-limit": "^7.4.0", // Rate limiting
  "swagger-ui-express": "^5.0.1", // API documentation
  "joi": "^17.13.3",             // Validation
  "redis": "^4.7.0"              // Caching
}
```

### Development Tools
- **ES6 Modules** - Modern JavaScript module system
- **Nodemon** - Auto-restart on file changes
- **Swagger** - Interactive API documentation
- **dotenv** - Environment variable management

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **MongoDB** - Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- ✅ **Cloudinary Account** - [Sign up](https://cloudinary.com/) for image storage
- ✅ **Redis** (Optional) - [Download](https://redis.io/download) for caching
- ✅ **Git** - For version control

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/aurea-backend.git
   cd aurea-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```bash
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aurea
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Redis Configuration (Optional - gracefully degrades if unavailable)
   REDIS_URL=redis://localhost:6379
   
   # Google Gemini AI (Optional - for PDF extraction)
   GEMINI_API_KEY=your-gemini-api-key
   
   # Vercel Configuration (Optional - for Vercel deployments)
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   ```

4. **Seed Initial Data** (Optional)
   ```bash
   # Seed template data
   node seeds/templateSeeds.js
   
   # Migrate existing portfolios (if upgrading)
   node seeds/migratePortfolios.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   **Expected Output:**
   ```
   🚀 AUREA Backend Server
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Environment: development
   🌐 Port: 5000
   ✅ MongoDB Connected: aurea-cluster.mongodb.net
   ✅ Redis Connected: localhost:6379 (optional)
   ✅ Cloudinary Configured: your-cloud-name
   📝 Templates Initialized: 3 templates loaded
   🎯 65+ API Endpoints Active
   📚 API Documentation: http://localhost:5000/api-docs
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✨ Server ready at: http://localhost:5000
   ```

6. **Verify Installation**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/health
   
   # Expected response:
   # {"status":"healthy","timestamp":"2025-10-20T...","database":"connected"}
   ```

7. **Access API Documentation**
   
   Open your browser and navigate to:
   ```
   http://localhost:5000/api-docs
   ```

### Quick Test

Test the API with these commands:

```bash
# 1. Register a new user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# 2. Login and get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# 3. Get templates (no auth required)
curl http://localhost:5000/api/templates

# 4. Get user profile (auth required - use token from login)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 API Reference

### API Endpoints Overview

AUREA Backend provides **65+ RESTful API endpoints** organized into 9 main categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| 🏥 Health | 1 | Server health and status checks |
| 🔐 Authentication | 4 | User signup, login, profile management |
| 👤 User Management | 13 | Complete user CRUD operations |
| 📁 Portfolio | 9 | Portfolio lifecycle management |
| 🎨 Templates | 14 | Dynamic template system |
| 📖 Case Studies | 6 | Project case study management |
| 🌐 Site Publishing | 10 | Vercel & subdomain deployment |
| 📄 PDF Export | 5 | Portfolio PDF generation |
| 🖼️ Media Upload | 2 | Image upload and management |
| 🤖 AI Processing | 3 | PDF extraction with Gemini AI |

### Quick Reference

#### Health Check
```http
GET /health
```
Returns server status, database connectivity, and system info.

---

#### Authentication Endpoints

```http
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login and get JWT token
GET    /api/auth/me              # Get current user profile (protected)
PUT    /api/auth/me              # Update current user (protected)
```

**Example: User Registration**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Designer",
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6501234567890abcdef12345",
      "name": "Jane Designer",
      "email": "jane@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### User Management Endpoints

```http
GET    /api/users/profile                    # Get current user profile
PUT    /api/users/profile                    # Update profile (name, email, password)
PATCH  /api/users/profile/password           # Change password
POST   /api/users/profile/verify-password    # Verify current password
DELETE /api/users/profile                    # Delete account
GET    /api/users/premium/status             # Check premium status

# Admin endpoints
GET    /api/users                            # List all users (paginated)
GET    /api/users/:id                        # Get user by ID
PUT    /api/users/:id                        # Update user
DELETE /api/users/:id                        # Delete user
GET    /api/users/:id/portfolios             # Get user's portfolios
PUT    /api/users/:id/role                   # Update user role
DELETE /api/users/:id/force                  # Force delete with portfolios
```

---

#### Portfolio Endpoints

```http
POST   /api/portfolios                       # Create new portfolio
GET    /api/portfolios/stats                 # Get portfolio statistics
GET    /api/portfolios/user/me               # Get current user's portfolios
GET    /api/portfolios/check-slug/:slug      # Check slug availability
GET    /api/portfolios/public/:slug          # Get public portfolio
GET    /api/portfolios/:id                   # Get portfolio by ID
PUT    /api/portfolios/:id                   # Update portfolio
DELETE /api/portfolios/:id                   # Delete portfolio
PUT    /api/portfolios/:id/publish           # Publish portfolio
PUT    /api/portfolios/:id/unpublish         # Unpublish portfolio
```

**Example: Create Portfolio**
```bash
curl -X POST http://localhost:5000/api/portfolios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My Design Portfolio",
    "description": "A showcase of my creative work",
    "templateId": "echelon",
    "customData": {
      "hero": {
        "title": "Jane Designer",
        "subtitle": "UI/UX Designer & Creative Director"
      }
    }
  }'
```

---

#### Template System Endpoints (NEW)

```http
GET    /api/templates                        # Get all templates (with filters)
GET    /api/templates/categories             # Get template categories
GET    /api/templates/default                # Get default template
GET    /api/templates/:id                    # Get template by ID
GET    /api/templates/:id/schema             # Get template schema only
POST   /api/templates/:id/validate           # Validate content against schema
POST   /api/templates/:id/rating             # Rate template (1-5 stars)

# Admin endpoints
POST   /api/templates                        # Create new template
PUT    /api/templates/:id                    # Update template
DELETE /api/templates/:id                    # Deactivate template
POST   /api/templates/:id/version            # Create new template version
```

**Example: Get Templates with Filters**
```bash
# Get all minimal category templates
curl "http://localhost:5000/api/templates?category=minimal"

# Get premium templates with specific tags
curl "http://localhost:5000/api/templates?isPremium=true&tags=modern,clean"
```

**Example: Validate Portfolio Content**
```bash
curl -X POST http://localhost:5000/api/templates/echelon/validate \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "hero": {
        "title": "My Portfolio",
        "subtitle": "Designer & Developer"
      },
      "about": {
        "name": "John Doe",
        "bio": "Passionate about creating beautiful designs"
      }
    }
  }'
```

---

#### Case Study Endpoints

```http
POST   /api/case-studies                     # Create case study
GET    /api/case-studies/:id                 # Get case study by ID
GET    /api/case-studies/portfolio/:portfolioId/project/:projectId
PUT    /api/case-studies/:id                 # Update case study
DELETE /api/case-studies/:id                 # Delete case study
GET    /api/case-studies/public/:portfolioSlug/:projectId
```

---

#### Site Publishing Endpoints

```http
# Site publishing
POST   /api/sites/publish                    # Deploy to Vercel
POST   /api/sites/sub-publish                # Publish to local subdomain ⭐
POST   /api/sites/debug-generate             # Debug HTML generation
DELETE /api/sites/unpublish/:portfolioId     # Unpublish site

# Site access
GET    /api/sites/:subdomain                 # Get site by subdomain
GET    /api/sites/:subdomain/raw-html        # Get raw HTML
GET    /api/sites/:subdomain/case-study/:projectId/raw-html

# Configuration
GET    /api/sites/status                     # Get publishing status
GET    /api/sites/config                     # Get site configuration
PUT    /api/sites/config                     # Update site configuration
POST   /api/sites/analytics/view             # Record site view
```

**Example: Gmail-Style Subdomain Publishing** ⭐
```bash
curl -X POST http://localhost:5000/api/sites/sub-publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "portfolioId": "6501234567890abcdef12345",
    "subdomain": "jane-designer"
  }'
```

**Result:**
```
✅ Site published at: aurea.tool/jane-designer
📁 Files generated in: generated-files/jane-designer/
```

---

#### PDF Export Endpoints

```http
GET    /api/pdf/portfolio/:portfolioId       # View portfolio PDF (inline)
GET    /api/pdf/portfolio/:portfolioId/complete # Complete PDF with case studies
GET    /api/pdf/portfolio/:portfolioId/download # Force download PDF
GET    /api/pdf/portfolio/:portfolioId/info  # Get PDF generation info
POST   /api/pdf/cleanup                      # Cleanup old PDFs (admin)
```

**Example: Export Portfolio as PDF**
```bash
# View PDF in browser
curl http://localhost:5000/api/pdf/portfolio/6501234567890abcdef12345

# Download PDF file
curl -O http://localhost:5000/api/pdf/portfolio/6501234567890abcdef12345/download
```

---

#### Media Upload Endpoints

```http
POST   /api/upload/single                    # Upload single image
POST   /api/upload/multiple                  # Upload multiple images
```

**Example: Upload Image**
```bash
curl -X POST http://localhost:5000/api/upload/single \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

---

#### AI PDF Processing Endpoints

```http
POST   /api/proposal-extract/extract         # Extract data from PDF
GET    /api/proposal-extract/history         # Get extraction history
GET    /api/proposal-extract/test-gemini     # Test Gemini AI connection
```

**Example: Extract Data from PDF**
```bash
curl -X POST http://localhost:5000/api/proposal-extract/extract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf=@/path/to/proposal.pdf"
```

---

### 📖 Detailed Documentation

For complete API documentation with request/response examples, authentication details, and interactive testing:

**🔗 Visit Swagger UI:** http://localhost:5000/api-docs

The interactive documentation includes:
- ✅ All 65+ endpoints with detailed descriptions
- ✅ Request/response schemas and examples
- ✅ Authentication testing with JWT tokens
- ✅ Live API testing directly from browser
- ✅ Model definitions and validation rules
- ✅ Error response examples

---

## 🏗️ Architecture

### Project Structure

```
AUREA---Backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── cloudinary.js    # Cloudinary setup
│   │   ├── swagger.js       # Swagger documentation config
│   │   └── templateRegistry.js # Template registration system
│   │
│   ├── controllers/         # Business logic layer
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── portfolioController.js
│   │   ├── templateController.js
│   │   ├── caseStudyController.js
│   │   ├── siteController.js
│   │   ├── pdfExportController.js
│   │   ├── uploadController.js
│   │   └── proposalExtract.*.controller.js
│   │
│   ├── models/              # Database schemas (Mongoose)
│   │   ├── User.js          # User model with authentication
│   │   ├── Portfolio.js     # Portfolio with template support
│   │   ├── Template.js      # Dynamic template system
│   │   ├── CaseStudy.js     # Case study documentation
│   │   └── Site.js          # Published site records
│   │
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── templateRoutes.js
│   │   ├── caseStudyRoutes.js
│   │   ├── siteRoutes.js
│   │   ├── pdfRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── proposalExtract.routes.js
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── ownership.js     # Resource ownership verification
│   │   ├── validation.js    # Request validation
│   │   ├── errorHandler.js  # Error handling
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── requestLogger.js # Request logging
│   │
│   ├── services/            # Template engine service
│   │   └── templateEngine.js # HTML generation with Puppeteer
│   │
│   └── utils/               # Helper utilities
│       ├── cache.js         # Redis caching utilities
│       ├── slugGenerator.js # Slug generation & validation
│       ├── subdomainValidator.js # Subdomain validation
│       └── templateValidator.js  # Template validation
│
├── services/                # Business services (root level)
│   ├── deploymentService.js # Vercel deployment
│   ├── pdfGenerationService.js # PDF export
│   └── templateConvert.js   # Template HTML conversion
│
├── seeds/                   # Database seeders
│   ├── templateSeeds.js     # Seed initial templates
│   └── migratePortfolios.js # Migration scripts
│
├── scripts/                 # Utility scripts
│   └── upgrade-user-to-premium.js
│
├── test/                    # Test suites
│   ├── test-template-system.js
│   ├── test-custom-subdomain.js
│   ├── test-publish-flow.js
│   └── test-*.js
│
├── uploads/                 # Temporary file uploads
│   └── pdfs/
│
├── generated-files/         # Published site files (Gmail-style subdomains)
│   ├── {subdomain}/
│   │   ├── index.html
│   │   └── case-study-*.html
│
├── server.js                # Application entry point
├── package.json             # Dependencies and scripts
├── swagger.yaml             # OpenAPI specification
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── README.md                # This file
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React      │  │   Mobile     │  │   External   │      │
│  │  Frontend    │  │    Apps      │  │     APIs     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js Server (Port 5000)                         │ │
│  │  - CORS, Helmet, Compression                           │ │
│  │  - Rate Limiting (Express-Rate-Limit)                  │ │
│  │  - Request Logging & Error Handling                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  JWT Middleware                                        │ │
│  │  - Token verification                                  │ │
│  │  - Role-based access control (User/Admin/Premium)     │ │
│  │  - Optional authentication for public endpoints       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    ROUTING LAYER (9 Routers)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Auth    │ │  Users   │ │Portfolio │ │Templates │      │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Case   │ │  Sites   │ │   PDF    │ │  Upload  │      │
│  │  Studies │ │  Routes  │ │  Routes  │ │  Routes  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐                                               │
│  │    AI    │                                               │
│  │ Extract  │                                               │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic & Validation                           │ │
│  │  - Request validation (Joi, Express-Validator)         │ │
│  │  - Authorization checks                                │ │
│  │  - Business rule enforcement                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Template    │  │  Deployment  │  │  PDF Gen     │      │
│  │  Service     │  │  Service     │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Mongoose ODM                                          │ │
│  │  - Schema definitions                                  │ │
│  │  - Model methods                                       │ │
│  │  - Query optimization                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ MongoDB  │ │  Redis   │ │Cloudinary│ │ Google   │      │
│  │ Database │ │  Cache   │ │  CDN     │ │ Gemini   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                                 │
│  │  Vercel  │ │Puppeteer │                                 │
│  │  Deploy  │ │ PDF Gen  │                                 │
│  └──────────┘ └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Example

**User Creates Portfolio:**

1. **Client** → POST `/api/portfolios` with JWT token
2. **Rate Limiter** → Check request rate limits
3. **Auth Middleware** → Verify JWT token, extract user
4. **Router** → Route to portfolio controller
5. **Controller** → Validate request data (Joi)
6. **Controller** → Check template exists
7. **Service** → Validate content against template schema
8. **Model** → Create portfolio document
9. **Database** → Save to MongoDB
10. **Cache** → Invalidate user portfolio cache (Redis)
11. **Controller** → Return success response
12. **Client** ← Receive portfolio data

---

## 🧪 Complete API Endpoints (65+ Total)

## 🧪 Testing

### Available Test Scripts

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration          # Frontend integration tests
npm run test:user                 # User management tests

# Run template system tests
node test/test-template-system.js

# Test portfolio creation flow
node test/test-publish-flow.js

# Test PDF generation
node test/test-pdf-generation.js

# Test Vercel deployment
node test/test-vercel-deployment-improved.js

# Test custom subdomain publishing
node test/test-custom-subdomain.js
```

### Test Coverage

The test suite covers:

- ✅ **Authentication** - Signup, login, token validation
- ✅ **User Management** - Profile CRUD operations
- ✅ **Portfolio System** - Create, read, update, delete portfolios
- ✅ **Template System** - Template selection, validation, rating
- ✅ **Case Studies** - Case study creation and HTML generation
- ✅ **Publishing** - Vercel and subdomain deployment
- ✅ **PDF Export** - Portfolio and case study PDF generation
- ✅ **Media Upload** - Image upload to Cloudinary
- ✅ **AI Processing** - PDF extraction with Gemini AI

### Manual Testing

**Using Swagger UI:**
1. Navigate to http://localhost:5000/api-docs
2. Click "Authorize" button
3. Enter JWT token: `Bearer YOUR_TOKEN_HERE`
4. Test any endpoint directly from the browser

**Using cURL:**
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Using Postman:**
1. Import the Swagger JSON: `http://localhost:5000/api-docs.json`
2. Set up environment variables for `BASE_URL` and `JWT_TOKEN`
3. Run the collection

---

## 📚 Additional Documentation

### Comprehensive Guides

- **[Template System Guide](TEMPLATE_SYSTEM_GUIDE.md)** - Complete template management documentation
- **[Frontend Integration Guide](FRONTEND_INTEGRATION_GUIDE.md)** - React integration patterns
- **[Integration Success Outcomes](INTEGRATION_SUCCESS_OUTCOMES.md)** - Expected results and KPIs
- **[PDF Performance Guide](PDF_PERFORMANCE.md)** - PDF generation optimization
- **[Subdomain Publishing Guide](SUB_PUBLISH_GUIDE.md)** - Gmail-style subdomain setup

### API Documentation

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI Spec**: `swagger.yaml`

### Development Guides

- **[Backend Improvements](BACKEND_IMPROVEMENTS_IMPLEMENTED.md)** - Recent enhancements
- **[Dynamic Template Refactor](DYNAMIC_TEMPLATE_REFACTOR.md)** - Template system architecture

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/aurea-backend.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add template rating system
fix: resolve JWT token expiration issue
docs: update API documentation
refactor: improve portfolio controller logic
```

### Code Style Guidelines

- Use ES6+ features
- Follow ESLint configuration
- Use async/await for asynchronous code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

### Pull Request Guidelines

- Provide clear description of changes
- Reference related issues
- Ensure all tests pass
- Update documentation if needed
- Add screenshots for UI changes

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👥 Team & Support

### Development Team

**AUREA Development Team**
- Backend Architecture & API Design
- Template System Development
- Security & Performance Optimization

### Contact & Support

- **📧 Email**: support@aurea.com
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-org/aurea-backend/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-org/aurea-backend/discussions)
- **📖 Documentation**: [Full Documentation](https://docs.aurea.com)

### Reporting Issues

When reporting issues, please include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - How to reproduce the issue
3. **Expected Behavior** - What you expected to happen
4. **Actual Behavior** - What actually happened
5. **Environment** - Node version, OS, etc.
6. **Logs** - Relevant error messages or logs
7. **Screenshots** - If applicable

---

## 🙏 Acknowledgments

### Technologies & Libraries

- **Express.js** - Web framework
- **MongoDB & Mongoose** - Database
- **JWT** - Authentication
- **Cloudinary** - Media management
- **Puppeteer** - PDF generation
- **Google Gemini AI** - AI processing
- **Redis** - Caching
- **Swagger** - API documentation

### Inspiration & Resources

- Portfolio design best practices
- Modern web architecture patterns
- RESTful API design principles

---

## 📊 Project Statistics

- **65+ API Endpoints**
- **5 Database Models**
- **9 Route Modules**
- **10+ Middleware Functions**
- **3+ AI-Powered Features**
- **100% RESTful Design**
- **Production Ready**

---

<div align="center">

**Made with ❤️ by the AUREA Team**

[⭐ Star on GitHub](https://github.com/your-org/aurea-backend) • [🐛 Report Bug](https://github.com/your-org/aurea-backend/issues) • [📖 Documentation](https://docs.aurea.com)

</div>

---

## 📝 Change Log

### Version 1.0.0 (October 2025)

**✨ Major Features**
- Complete authentication and user management system
- Dynamic template system with schema validation
- Portfolio CRUD with template support
- Case study management with smart HTML generation
- Dual publishing system (Vercel + local subdomain)
- PDF export with multiple template options
- AI-powered PDF extraction with Gemini AI
- Professional image upload with Cloudinary

**🛡️ Security Enhancements**
- JWT authentication with role-based access
- Rate limiting on all endpoints
- Input validation and sanitization
- Helmet security headers
- CORS configuration
- Ownership verification middleware

**⚡ Performance Improvements**
- Redis caching implementation
- Database query optimization
- Response compression
- Connection pooling
- Graceful degradation for optional services

**📚 Documentation**
- Complete Swagger/OpenAPI documentation
- Comprehensive README with examples
- Integration guides for frontend
- Template system documentation
- Deployment guides

---

<div align="center">

**Made with ❤️ by the AUREA Development Team**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/your-org/aurea-backend)
[![Documentation](https://img.shields.io/badge/Docs-Swagger-85EA2D?style=flat&logo=swagger)](http://localhost:5000/api-docs)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Version 1.0.0** | Production Ready | Last Updated: October 20, 2025
