# AUREA Backend - Developer Onboarding Guide

**Welcome to the AUREA Backend Team!**

This comprehensive guide will help you get up and running with the AUREA portfolio builder backend. By the end of this document, you'll understand the architecture, be able to run the project locally, and know how to contribute effectively.

**Last Updated:** October 31, 2025
**Architecture Version:** Post-Refactoring (80% Clean Architecture)
**Estimated Setup Time:** 30-60 minutes

---

## Table of Contents

1. [Welcome & Introduction](#1-welcome--introduction)
2. [Environment Setup](#2-environment-setup)
3. [Architecture Tour](#3-architecture-tour)
4. [Core Concepts](#4-core-concepts)
5. [Development Workflow](#5-development-workflow)
6. [Code Standards](#6-code-standards)
7. [Common Tasks](#7-common-tasks)
8. [Debugging](#8-debugging)
9. [Testing](#9-testing)
10. [Reference](#10-reference)

---

## 1. Welcome & Introduction

### 🎯 What is AUREA?

**AUREA** is a full-stack portfolio builder platform that enables users to create, customize, and publish professional portfolios with case studies. Think of it as "Wix for portfolios" with powerful template systems and dual publishing options.

### 🏗️ What This Backend Does

The AUREA backend is a RESTful API that powers:

- **User Management**: Authentication, profiles, premium subscriptions
- **Portfolio Builder**: Create, edit, publish portfolios with templates
- **Case Studies**: Detailed project showcases linked to portfolios
- **Publishing System**: Dual-mode (Vercel deployment OR local subdomain hosting)
- **Template Engine**: Dynamic templates with JSON schema validation
- **PDF Export**: Generate professional PDFs from portfolios
- **File Upload**: Image handling via Cloudinary
- **AI Features**: PDF extraction using Google Gemini AI

### 🛠️ Tech Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express 5 | HTTP server |
| **Database** | MongoDB (Mongoose) | Document storage |
| **Authentication** | JWT | Stateless auth |
| **File Storage** | Cloudinary | Image hosting |
| **Caching** | Redis (optional) | Performance optimization |
| **PDF Generation** | Puppeteer | HTML to PDF conversion |
| **AI** | Google Gemini (optional) | Document extraction |
| **Deployment** | Railway/Vercel API | Cloud hosting |

### 📁 Project Structure at a Glance

```
AUREA---Backend/
├── src/                      # Source code
│   ├── api/                  # HTTP layer (routes, controllers, middleware)
│   ├── core/                 # Business logic (services, repositories)
│   ├── shared/               # Utilities (exceptions, formatters)
│   ├── infrastructure/       # Infrastructure (logging)
│   ├── config/               # Configuration management
│   └── models/               # Mongoose schemas
├── services/                 # Legacy services (being refactored)
├── test/                     # Test suites
├── scripts/                  # Admin utilities
├── generated-files/          # Published portfolio HTML
├── uploads/                  # Temporary file storage
├── server.js                 # Application entry point
└── package.json              # Dependencies
```

---

## 2. Environment Setup

### Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** and **npm** ([Download](https://nodejs.org/))
- ✅ **MongoDB** account ([Atlas Free Tier](https://www.mongodb.com/cloud/atlas))
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ **Code Editor** (VS Code recommended)
- ✅ **Terminal/Shell** access

**Optional but recommended:**
- **Redis** for caching ([Docker](https://hub.docker.com/_/redis))
- **Cloudinary** account for image uploads
- **Postman** or **Insomnia** for API testing

### Step 1: Clone the Repository

```bash
cd ~/Desktop/fullstack
# Repository should already be at AUREA---Backend/
cd AUREA---Backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs ~50 packages including Express, Mongoose, JWT, Puppeteer, etc.

**Expected output:**
```
added 523 packages, and audited 524 packages in 45s
```

### Step 3: Configure Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
# Or manually create:
touch .env
```

**Edit `.env` with your values:**

```env
# Application
NODE_ENV=development
PORT=5000

# Database (REQUIRED)
MONGO_URI=mongodb+srv://username:YOUR_ACTUAL_PASSWORD@cluster.mongodb.net/aurea?retryWrites=true&w=majority

# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Image Storage (REQUIRED for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Redis (OPTIONAL - caching will be disabled if not provided)
REDIS_URL=redis://localhost:6379

# Vercel Deployment (OPTIONAL)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Google Gemini AI (OPTIONAL - for PDF extraction)
GEMINI_API_KEY=your-gemini-api-key

# Logging (OPTIONAL)
LOG_LEVEL=info
```

**⚠️ CRITICAL**: Replace `YOUR_ACTUAL_PASSWORD` with your real MongoDB password, not the placeholder!

### Step 4: Set Up MongoDB

**Option A: MongoDB Atlas (Recommended for beginners)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<password>` with your database user password
6. Add to `.env` as `MONGO_URI`

**Option B: Local MongoDB**

```bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt install mongodb
sudo systemctl start mongodb

# Connection string
MONGO_URI=mongodb://localhost:27017/aurea
```

### Step 5: First Run

Start the development server:

```bash
npm run dev
```

**Expected output:**
```
[nodemon] starting `node server.js`
{"timestamp":"2025-10-31T...","level":"INFO","message":"Brute force protection using memory store"}
{"timestamp":"2025-10-31T...","level":"INFO","message":"Connected to MongoDB"}
{"timestamp":"2025-10-31T...","level":"INFO","message":"Swagger UI available at: /api-docs"}
{"timestamp":"2025-10-31T...","level":"INFO","message":"Server running on port 5000"}
```

**Test the server:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### Step 6: Verify Setup

**Access Swagger API Documentation:**
```
Open in browser: http://localhost:5000/api-docs
```

You should see interactive API documentation with all 65+ endpoints.

**🎉 Success!** Your development environment is ready!

---

## 3. Architecture Tour

### Directory Structure Explained

Let's explore each directory and understand its purpose:

#### `src/api/` - HTTP Layer

**Controllers** (`src/api/controllers/` or `src/controllers/`):
- Thin HTTP handlers (< 15 lines per method)
- Extract input from `req`
- Call service methods
- Format responses
- Pass errors to middleware

**Routes** (`src/routes/`):
- Map HTTP verbs + paths to controllers
- Attach middleware chains
- Examples: `portfolioRoutes.js`, `authRoutes.js`

**Middleware** (`src/middleware/`):
- `auth.js` - JWT authentication
- `ownership.js` - Resource ownership verification
- `validation.js` - Input validation rules
- `rateLimiter.js` - Rate limiting
- `errorHandler.js` - Global error handling
- `bruteForcePrevention.js` - Brute force protection

#### `src/core/` - Business Logic

**Services** (`src/core/services/`):
- All business logic lives here
- Validates business rules
- Orchestrates repositories
- Throws custom exceptions
- Examples:
  - `PortfolioService.js` - Portfolio business logic
  - `AuthService.js` - Authentication logic
  - `SiteService.js` - Publishing logic
  - `UserService.js` - User management
  - `CaseStudyService.js` - Case study logic

**Repositories** (`src/core/repositories/`):
- Database operations only
- CRUD methods
- No business logic
- Examples:
  - `PortfolioRepository.js`
  - `UserRepository.js`
  - `SiteRepository.js`
  - `CaseStudyRepository.js`

#### `src/shared/` - Utilities

- **Constants** (`src/shared/constants/`):
  - `httpStatus.js` - HTTP status codes
  - `errorCodes.js` - Application error codes

- **Utils** (`src/shared/utils/`):
  - `responseFormatter.js` - Standardized API responses

- **Exceptions** (`src/shared/exceptions/`):
  - Custom error classes
  - `ValidationError`, `NotFoundError`, `UnauthorizedError`, etc.

#### `src/infrastructure/` - Infrastructure

- **Logging** (`src/infrastructure/logging/`):
  - `Logger.js` - Structured logging system
  - Replaces all `console.log` statements

#### `src/config/` - Configuration

- `index.js` - Centralized config object
- `envValidator.js` - Environment variable validation
- `database.js` - MongoDB connection
- `cloudinary.js` - Cloudinary setup
- `swagger.js` - API documentation
- `templateRegistry.js` - Template configurations

#### `src/models/` - Data Models

Mongoose schemas defining database structure:
- `User.js` - User accounts, authentication, premium status
- `Portfolio.js` - Portfolio data, content, templates
- `Template.js` - Dynamic template definitions
- `CaseStudy.js` - Project case studies
- `Site.js` - Published site records

#### Root Level Files

- `services/` - Legacy monolithic services (being refactored)
  - `templateConvert.js` - HTML generation (1,452 lines)
  - `deploymentService.js` - Vercel API integration
  - `pdfGenerationService.js` - PDF generation

- `test/` - Test suites
  - `test-user-profile-crud.js` - User tests (9 tests)
  - `test-custom-subdomain.js` - Subdomain tests (7 tests)
  - `test-vercel-deployment-improved.js` - Deployment tests

- `scripts/` - Admin utilities
  - `upgrade-user-to-premium.js` - Manual premium upgrades
  - `clear-brute-force.js` - Clear brute force records

### Where Things Live - Quick Reference

| Need to... | Go to... |
|------------|----------|
| Add HTTP endpoint | `src/routes/[feature]Routes.js` |
| Handle HTTP request | `src/controllers/[feature]Controller.js` |
| Add business logic | `src/core/services/[Feature]Service.js` |
| Add database query | `src/core/repositories/[Feature]Repository.js` |
| Define data schema | `src/models/[Feature].js` |
| Add middleware | `src/middleware/[middleware].js` |
| Configure app | `src/config/index.js` |
| Add utility | `src/shared/utils/[utility].js` |
| Handle errors | `src/shared/exceptions/[Error].js` |

---

## 4. Core Concepts

### Authentication Flow

AUREA uses **JWT (JSON Web Tokens)** for stateless authentication:

1. **User signs up** → Password hashed with bcrypt (cost factor 12) → User created
2. **User logs in** → Credentials verified → JWT generated (30-day expiration)
3. **Subsequent requests** → JWT sent in `Authorization: Bearer <token>` header
4. **Auth middleware** → Verifies JWT → Attaches user to `req.user`

**Code example:**
```javascript
// Login generates token
const token = jwt.sign({ id: user._id }, config.auth.jwtSecret, {
  expiresIn: '30d'
});

// Auth middleware verifies token
const decoded = jwt.verify(token, config.auth.jwtSecret);
const user = await User.findById(decoded.id);
req.user = user;
```

### Portfolio System

**Portfolio Structure:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Owner
  title: String,              // "John's Portfolio"
  description: String,
  template: String,           // "echelon", "serene", "chic"
  templateId: String,         // Database template reference
  content: {                  // Flexible schema
    about: { name, bio, ... },
    projects: [...],
    skills: [...],
    experience: [...]
  },
  isPublished: Boolean,
  publishedAt: Date,
  slug: String,               // Unique URL slug
  caseStudies: [ObjectId]     // Linked case studies
}
```

**Key Features:**
- **Flexible Content**: Schema adapts to template
- **Templates**: Pre-defined layouts (Echelon, Serene, Chic, BoldFolio)
- **Publishing**: Can publish to Vercel OR local subdomain
- **SEO**: Custom slugs for public URLs
- **Case Studies**: Detailed project showcases

### Template System

AUREA supports **dynamic templates** with JSON schema validation:

**Template Definition:**
```javascript
{
  templateId: "echelon",
  name: "Echelon",
  category: "swiss",
  schema: {
    sections: [
      { id: "hero", required: true, fields: [...] },
      { id: "about", required: false, fields: [...] },
      { id: "projects", required: false, fields: [...] }
    ]
  },
  version: "1.0.0"
}
```

**How It Works:**
1. User selects template
2. Frontend validates content against template schema
3. Backend validates on save
4. HTML generation uses template-specific generator
5. PDF export respects template design

### Publishing System (Dual Mode)

**Option 1: Custom Subdomain (Gmail-style)**
- User chooses subdomain: `john-portfolio`
- System generates HTML files
- Saves to `generated-files/john-portfolio/`
- Accessible at: `/:subdomain/html`
- Format: 3-30 chars, lowercase, numbers, hyphens

**Option 2: Vercel Deployment**
- Calls Vercel API
- Deploys to vercel.app domain
- Returns live URL
- Requires `VERCEL_TOKEN` configured

**Key Business Rules:**
- Subdomain must be unique globally
- User can only have one published site per portfolio
- Changing subdomain cleans up old files
- Cannot publish empty portfolios

### Case Study System

Case studies are **detailed project showcases** linked to portfolio projects:

**Structure:**
```javascript
{
  _id: ObjectId,
  portfolioId: ObjectId,      // Parent portfolio
  projectId: String,          // Links to portfolio.content.projects[projectId]
  content: {
    hero: { title, subtitle, coverImage, client, year, role },
    overview: { problem, solution, outcome },
    sections: [
      { type: "text", heading, body },
      { type: "image", url, caption },
      { type: "gallery", images: [...] }
    ],
    results: { metrics: [...], testimonial }
  }
}
```

**Integration:**
- Portfolio projects marked with `hasCaseStudy: true`
- HTML generation creates separate pages for each case study
- URLs: `/subdomain/case-study-{projectId}.html`

### Premium Subscription System

Users can upgrade to premium for enhanced features:

**User Premium Fields:**
```javascript
{
  isPremium: Boolean,
  premiumType: "monthly" | "yearly" | "lifetime",
  premiumExpiresAt: Date,
  premiumStartedAt: Date
}
```

**Premium Benefits:**
- Free: 5 portfolios
- Premium: 50 portfolios
- Premium templates
- Priority support
- Advanced analytics

**Check Premium:**
```javascript
const user = await User.findById(userId);
const isActive = user.checkPremiumStatus();  // Method checks expiration
```

### Rate Limiting

Different endpoints have different rate limits:

| Endpoint Type | Window | Max Requests |
|--------------|--------|--------------|
| General CRUD | 1 min | 30 requests |
| Slug check | 1 min | 10 requests |
| Publishing | 1 min | 5 requests |
| Auth (login) | 15 min | 5 attempts |
| File upload | 1 min | 20 requests |

**Implementation:**
```javascript
// In routes
import { publishLimiter } from '../middleware/rateLimiter.js';
router.post('/publish', auth, publishLimiter, siteController.publishSite);
```

---

## 5. Development Workflow

### How to Add a New Feature

Let's walk through adding a feature: **"Add portfolio tags"**

#### Step 1: Plan the Architecture

**What needs to change:**
- Database: Add `tags` field to Portfolio model
- Repository: Add methods to query by tags
- Service: Add validation for tags
- Controller: Add endpoints
- Routes: Wire up new endpoints

#### Step 2: Update the Model

**File:** `src/models/Portfolio.js`

```javascript
tags: {
  type: [String],
  default: [],
  validate: {
    validator: function(tags) {
      return tags.every(tag => tag.length <= 20 && /^[a-zA-Z0-9-]+$/.test(tag));
    },
    message: 'Tags must be alphanumeric, under 20 chars'
  }
}
```

#### Step 3: Update Repository

**File:** `src/core/repositories/PortfolioRepository.js`

```javascript
/**
 * Find portfolios by tags
 */
async findByTags(tags, options = {}) {
  logger.database('read', 'portfolios', { tags });

  const { limit = 10, skip = 0 } = options;

  return await this.model
    .find({ tags: { $in: tags }, isPublished: true })
    .limit(limit)
    .skip(skip)
    .exec();
}
```

#### Step 4: Update Service

**File:** `src/core/services/PortfolioService.js`

```javascript
/**
 * Update portfolio tags
 */
async updateTags(portfolioId, userId, tags) {
  logger.service('PortfolioService', 'updateTags', { portfolioId });

  // Business rule: Validate tags
  if (!Array.isArray(tags)) {
    throw new ValidationError('Tags must be an array');
  }

  if (tags.length > 10) {
    throw new ValidationError('Maximum 10 tags allowed');
  }

  // Get portfolio
  const portfolio = await this.portfolioRepo.findById(portfolioId);

  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  // Check ownership
  if (portfolio.userId.toString() !== userId.toString()) {
    throw ForbiddenError.ownershipRequired('portfolio');
  }

  // Update tags
  const updated = await this.portfolioRepo.update(portfolioId, { tags });

  logger.info('Portfolio tags updated', { portfolioId, tagCount: tags.length });

  return updated;
}

/**
 * Search by tags
 */
async searchByTags(tags, options = {}) {
  logger.service('PortfolioService', 'searchByTags', { tags });

  return await this.portfolioRepo.findByTags(tags, options);
}
```

#### Step 5: Update Controller

**File:** `src/controllers/portfolioController.js`

```javascript
/**
 * @desc    Update portfolio tags
 * @route   PUT /api/portfolios/:id/tags
 * @access  Private
 */
export const updateTags = async (req, res, next) => {
  try {
    const { tags } = req.body;
    const portfolio = await portfolioService.updateTags(
      req.params.id,
      req.user._id,
      tags
    );

    return responseFormatter.success(
      res,
      { portfolio },
      'Tags updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search portfolios by tags
 * @route   GET /api/portfolios/search/tags?tags=design,react
 * @access  Public
 */
export const searchByTags = async (req, res, next) => {
  try {
    const tags = req.query.tags.split(',');
    const portfolios = await portfolioService.searchByTags(tags, req.query);

    return responseFormatter.success(
      res,
      { portfolios, count: portfolios.length },
      'Portfolios retrieved'
    );
  } catch (error) {
    next(error);
  }
};
```

#### Step 6: Add Routes

**File:** `src/routes/portfolioRoutes.js`

```javascript
import { auth } from '../middleware/auth.js';
import { validateTags } from '../middleware/validation.js';

// Update tags (authenticated)
router.put(
  '/:id/tags',
  auth,
  validateTags,
  portfolioController.updateTags
);

// Search by tags (public)
router.get(
  '/search/tags',
  portfolioController.searchByTags
);
```

#### Step 7: Add Validation Middleware

**File:** `src/middleware/validation.js`

```javascript
import { body, query } from 'express-validator';
import { validate } from './validate.js';

export const validateTags = validate([
  body('tags')
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .isString()
    .trim()
    .isLength({ max: 20 })
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Tags must be alphanumeric')
]);
```

#### Step 8: Test

```bash
# Start server
npm run dev

# Test update tags
curl -X PUT http://localhost:5000/api/portfolios/123/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags":["design","react","portfolio"]}'

# Test search
curl http://localhost:5000/api/portfolios/search/tags?tags=design,react
```

#### Step 9: Document

Add to `swagger.yaml` or inline JSDoc:

```javascript
/**
 * @swagger
 * /api/portfolios/{id}/tags:
 *   put:
 *     summary: Update portfolio tags
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tags updated successfully
 */
```

### Git Workflow

**Branch naming:**
```bash
git checkout -b feature/portfolio-tags
git checkout -b fix/authentication-bug
git checkout -b refactor/user-service
```

**Commit messages:**
```bash
# Good commits
git commit -m "feat: add portfolio tags feature"
git commit -m "fix: resolve JWT expiration bug"
git commit -m "refactor: extract email service"
git commit -m "docs: update API documentation"

# Use conventional commits format
# <type>: <description>
# Types: feat, fix, refactor, docs, test, chore
```

**Pull request process:**
1. Create feature branch
2. Make changes following code standards
3. Test locally
4. Push to remote
5. Create PR with description
6. Wait for review
7. Address feedback
8. Merge when approved

---

## 6. Code Standards

### Controller Standards

**✅ DO:**
```javascript
export const createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(
      req.user._id,
      req.body
    );
    return responseFormatter.created(res, { portfolio }, 'Portfolio created');
  } catch (error) {
    next(error);
  }
};
```

**❌ DON'T:**
```javascript
export const createPortfolio = async (req, res) => {
  try {
    // ❌ Business logic in controller
    if (!req.body.title) {
      return res.status(400).json({ error: 'Title required' });
    }

    // ❌ Direct Model import
    const portfolio = await Portfolio.create({
      userId: req.user._id,
      ...req.body
    });

    // ❌ Manual response formatting
    res.status(201).json({ success: true, data: portfolio });
  } catch (error) {
    // ❌ Handling error in controller
    res.status(500).json({ error: error.message });
  }
};
```

### Service Standards

**✅ DO:**
```javascript
async createPortfolio(userId, portfolioData) {
  logger.service('PortfolioService', 'createPortfolio', { userId });

  // Business validation
  if (!portfolioData.title) {
    throw new ValidationError('Title is required');
  }

  // Check limits
  const count = await this.portfolioRepo.countByUserId(userId);
  if (count >= 5) {
    throw new ValidationError('Portfolio limit reached');
  }

  // Use repository
  const portfolio = await this.portfolioRepo.create({
    userId,
    ...portfolioData
  });

  logger.info('Portfolio created', { portfolioId: portfolio._id });
  return portfolio;
}
```

**❌ DON'T:**
```javascript
async createPortfolio(req, res) {  // ❌ HTTP concerns
  console.log('Creating portfolio');  // ❌ console.log

  // ❌ Direct Model access
  const portfolio = await Portfolio.create(req.body);

  // ❌ Response formatting in service
  res.json({ success: true, data: portfolio });
}
```

### Repository Standards

**✅ DO:**
```javascript
async findById(id) {
  logger.database('read', 'portfolios', { id });
  return await this.model.findById(id);
}

async create(data) {
  logger.database('create', 'portfolios', { userId: data.userId });
  const doc = new this.model(data);
  return await doc.save();
}
```

**❌ DON'T:**
```javascript
async create(data) {
  // ❌ Business validation
  if (!data.title) {
    throw new ValidationError('Title required');
  }

  // ❌ Business logic
  const count = await this.model.countDocuments({ userId: data.userId });
  if (count >= 5) {
    throw new Error('Limit reached');
  }

  return await this.model.create(data);
}
```

### Naming Conventions

```javascript
// Files: PascalCase for classes, camelCase for utilities
PortfolioService.js
portfolioController.js
responseFormatter.js

// Classes: PascalCase
class PortfolioService {}
class UserRepository {}

// Functions/Methods: camelCase
async createPortfolio() {}
function generateSlug() {}

// Constants: UPPER_SNAKE_CASE
const HTTP_STATUS = {};
const ERROR_CODES = {};

// Variables: camelCase
const portfolioData = {};
const userId = req.user._id;
```

### Import Order

```javascript
// 1. External packages
import express from 'express';
import jwt from 'jsonwebtoken';

// 2. Internal config
import config from '../config/index.js';

// 3. Services/Repositories
import portfolioService from '../core/services/PortfolioService.js';

// 4. Utilities
import responseFormatter from '../shared/utils/responseFormatter.js';
import logger from '../infrastructure/logging/Logger.js';

// 5. Models (rarely in new code)
import Portfolio from '../models/Portfolio.js';
```

---

## 7. Common Tasks

### Task 1: Add New API Endpoint

**Scenario:** Add "Get Portfolio Statistics"

```javascript
// 1. Service (src/core/services/PortfolioService.js)
async getStatistics(portfolioId, userId) {
  logger.service('PortfolioService', 'getStatistics', { portfolioId });

  const portfolio = await this.portfolioRepo.findById(portfolioId);
  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  if (portfolio.userId.toString() !== userId.toString()) {
    throw ForbiddenError.ownershipRequired('portfolio');
  }

  return {
    views: portfolio.viewCount,
    exports: portfolio.exportCount,
    lastViewed: portfolio.lastViewedAt,
    isPublished: portfolio.isPublished,
    publishedAt: portfolio.publishedAt
  };
}

// 2. Controller (src/controllers/portfolioController.js)
export const getStatistics = async (req, res, next) => {
  try {
    const stats = await portfolioService.getStatistics(
      req.params.id,
      req.user._id
    );
    return responseFormatter.success(res, { stats }, 'Statistics retrieved');
  } catch (error) {
    next(error);
  }
};

// 3. Route (src/routes/portfolioRoutes.js)
router.get('/:id/statistics', auth, portfolioController.getStatistics);
```

### Task 2: Add Validation

```javascript
// src/middleware/validation.js
import { body, param } from 'express-validator';
import { validate } from './validate.js';

export const validatePortfolioId = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid portfolio ID')
]);

export const validatePortfolioCreate = validate([
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be under 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be under 1000 characters'),

  body('template')
    .optional()
    .isIn(['echelon', 'serene', 'chic', 'boldfolio'])
    .withMessage('Invalid template')
]);
```

### Task 3: Add Custom Exception

```javascript
// src/shared/exceptions/StorageError.js
import { ApplicationError } from './index.js';

export class StorageError extends ApplicationError {
  constructor(message, context = {}) {
    super(message, 507, 'STORAGE_ERROR', context);
  }

  static quotaExceeded(userId, used, limit) {
    return new StorageError(
      'Storage quota exceeded',
      { userId, used, limit }
    );
  }
}
```

### Task 4: Add Middleware

```javascript
// src/middleware/checkStorageQuota.js
import userRepository from '../core/repositories/UserRepository.js';
import { StorageError } from '../shared/exceptions/StorageError.js';

export const checkStorageQuota = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user._id);

    const limit = user.isPremium ? 1000 : 100; // MB
    const used = user.storageUsed || 0;

    if (used >= limit) {
      throw StorageError.quotaExceeded(user._id, used, limit);
    }

    next();
  } catch (error) {
    next(error);
  }
};
```

---

## 8. Debugging

### Structured Logging

Use `logger` instead of `console.log`:

```javascript
import logger from '../infrastructure/logging/Logger.js';

// General logs
logger.info('User logged in', { userId, email });
logger.error('Database error', { error: error.message });
logger.warn('Deprecated API used', { endpoint: req.path });
logger.debug('Processing request', { body: req.body });

// Specialized logs
logger.service('PortfolioService', 'createPortfolio', { userId });
logger.database('create', 'portfolios', { userId });
logger.auth('login', userId, { ip: req.ip });
```

**View logs:**
```bash
# Development (pretty JSON)
npm run dev | jq .

# Filter by level
npm run dev | grep "ERROR"

# Search for specific user
npm run dev | grep "userId\":\"123"
```

### Debug Checklist

**API request not working?**
1. ✅ Is server running? (`curl http://localhost:5000/health`)
2. ✅ Correct HTTP method? (GET vs POST)
3. ✅ Correct endpoint path?
4. ✅ Auth token included? (`Authorization: Bearer ...`)
5. ✅ Valid token? (not expired)
6. ✅ Correct Content-Type? (`application/json`)
7. ✅ Valid request body?
8. ✅ Check logs for errors
9. ✅ Check middleware order in routes

**Database error?**
1. ✅ MongoDB connection working? (Check logs)
2. ✅ Correct collection name?
3. ✅ Valid ObjectId format?
4. ✅ Schema validation passing?
5. ✅ Indexes created?

**Business logic issue?**
1. ✅ Check service logs
2. ✅ Verify business rules
3. ✅ Check repository queries
4. ✅ Inspect data transformations

### Common Errors

**Error: "JWT malformed"**
```
Cause: Invalid token format
Fix: Ensure token is sent as: Authorization: Bearer <token>
```

**Error: "Portfolio not found"**
```
Cause: Invalid portfolio ID or wrong user
Fix: Check ObjectId format and ownership
```

**Error: "Validation failed"**
```
Cause: Schema validation error
Fix: Check model schema requirements
```

**Error: "Too many requests"**
```
Cause: Rate limit exceeded
Fix: Wait or increase rate limits in config
```

---

## 9. Testing

### Running Tests

```bash
# All tests
npm test

# Specific test suite
node test/test-user-profile-crud.js
node test/test-custom-subdomain.js

# Integration tests
npm run test:integration
```

### Writing Tests

**Example test:**
```javascript
// test/test-portfolio-tags.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let authToken;
let portfolioId;

async function runTests() {
  console.log('🧪 Testing Portfolio Tags Feature\n');

  // Test 1: Login
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@test.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
    console.log('✅ Test 1: Login successful');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.response?.data);
    return;
  }

  // Test 2: Create portfolio
  try {
    const portfolioRes = await axios.post(
      `${BASE_URL}/api/portfolios`,
      { title: 'Test Portfolio', template: 'echelon' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    portfolioId = portfolioRes.data.data.portfolio._id;
    console.log('✅ Test 2: Portfolio created');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.response?.data);
    return;
  }

  // Test 3: Add tags
  try {
    await axios.put(
      `${BASE_URL}/api/portfolios/${portfolioId}/tags`,
      { tags: ['design', 'react', 'web'] },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ Test 3: Tags added successfully');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.response?.data);
    return;
  }

  // Test 4: Search by tags
  try {
    const searchRes = await axios.get(
      `${BASE_URL}/api/portfolios/search/tags?tags=design,react`
    );
    console.log('✅ Test 4: Search by tags works');
    console.log(`   Found ${searchRes.data.data.count} portfolios`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error.response?.data);
  }

  console.log('\n🎉 All tests passed!');
}

runTests();
```

---

## 10. Reference

### Quick Commands

```bash
# Development
npm run dev              # Start dev server with auto-reload
npm start                # Start production server
npm test                 # Run test suites

# Database
node scripts/upgrade-user-to-premium.js <userId>
node scripts/clear-brute-force.js

# Health check
curl http://localhost:5000/health
```

### All Endpoints

See `/api-docs` for interactive documentation or:

**Auth** (3 endpoints):
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Portfolios** (9 endpoints):
- `POST /api/portfolios` - Create
- `GET /api/portfolios` - List all (user's)
- `GET /api/portfolios/:id` - Get single
- `PUT /api/portfolios/:id` - Update
- `DELETE /api/portfolios/:id` - Delete
- `GET /api/portfolios/check-slug/:slug` - Check slug availability
- `PUT /api/portfolios/:id/publish` - Publish
- `PUT /api/portfolios/:id/unpublish` - Unpublish

**Case Studies** (6 endpoints):
- `POST /api/case-studies` - Create
- `GET /api/case-studies/:id` - Get single
- `PUT /api/case-studies/:id` - Update
- `DELETE /api/case-studies/:id` - Delete
- `GET /api/case-studies/portfolio/:portfolioId` - Get by portfolio

**Sites** (3 endpoints):
- `POST /api/sites/sub-publish` - Publish to subdomain
- `POST /api/sites/publish` - Publish to Vercel
- `GET /api/sites/status` - Get site status

**PDF Export** (5 endpoints):
- `GET /api/pdf/portfolio/:id` - View PDF
- `GET /api/pdf/portfolio/:id/complete` - Complete PDF with case studies
- `GET /api/pdf/portfolio/:id/download` - Download PDF

**Upload** (2 endpoints):
- `POST /api/upload/single` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images

### Environment Variables Reference

```env
# Required
MONGO_URI           # MongoDB connection string
JWT_SECRET          # JWT signing secret
CLOUDINARY_*        # Cloudinary credentials (3 vars)

# Optional
REDIS_URL           # Redis cache (falls back to memory)
VERCEL_TOKEN        # Vercel deployment
FRONTEND_URL        # CORS origin
GEMINI_API_KEY      # AI features
LOG_LEVEL           # info, debug, warn, error
```

### File Locations Cheat Sheet

```
Add endpoint:         src/routes/[feature]Routes.js
Handle request:       src/controllers/[feature]Controller.js
Business logic:       src/core/services/[Feature]Service.js
Database query:       src/core/repositories/[Feature]Repository.js
Data model:           src/models/[Feature].js
Middleware:           src/middleware/[middleware].js
Utility:              src/shared/utils/[utility].js
Exception:            src/shared/exceptions/[Error].js
Config:               src/config/index.js
```

### Glossary

**Clean Architecture**: Software design pattern with clear layer separation
**Service Layer**: Business logic layer
**Repository**: Data access abstraction
**Middleware**: Request processing functions
**JWT**: JSON Web Token for authentication
**Mongoose**: MongoDB ODM (Object Document Mapper)
**Schema**: Database structure definition
**Slug**: URL-friendly identifier
**Subdomain**: Custom domain like `john.aurea.com`
**Template**: Pre-designed portfolio layout
**Case Study**: Detailed project showcase

---

## 🎉 You're Ready!

You now have:
- ✅ Working development environment
- ✅ Understanding of architecture
- ✅ Knowledge of core concepts
- ✅ Development workflow
- ✅ Code standards
- ✅ Debugging skills
- ✅ Testing approach
- ✅ Reference materials

**Next Steps:**
1. Pick a "good first issue" from backlog
2. Follow the development workflow
3. Ask questions in team chat
4. Submit your first PR
5. Celebrate your contribution! 🎊

**Need Help?**
- 📖 Architecture: `NEW_ARCHITECTURE_WALKTHROUGH.md`
- 🔧 Code Standards: This document (Section 6)
- 🐛 Debugging: This document (Section 8)
- 💬 Questions: Ask in team chat

**Welcome to the team! Happy coding! 🚀**

---

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Maintained By:** AUREA Backend Team
