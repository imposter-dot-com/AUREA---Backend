# AUREA Backend System Architecture

**Version**: 1.0.0
**Status**: 80% Clean Architecture Implementation ✅
**Last Updated**: November 14, 2025

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Architectural Layers](#2-architectural-layers)
3. [Service Layer Architecture](#3-service-layer-architecture)
4. [Repository Layer](#4-repository-layer)
5. [Middleware Architecture](#5-middleware-architecture)
6. [API Layer (Controllers & Routes)](#6-api-layer-controllers--routes)
7. [Data Models & Relationships](#7-data-models--relationships)
8. [Shared Components](#8-shared-components)
9. [Infrastructure Layer](#9-infrastructure-layer)
10. [Configuration Management](#10-configuration-management)
11. [External Integrations](#11-external-integrations)
12. [Security Architecture](#12-security-architecture)
13. [Request Flow Example](#13-request-flow-example)
14. [File Organization](#14-file-organization)
15. [Performance Optimizations](#15-performance-optimizations)
16. [Key Architectural Decisions](#16-key-architectural-decisions)

---

## 1. Architecture Overview

### 1.1 Clean Architecture Status

**Current Status**: **80% Refactored to Clean Architecture** ✅

AUREA Backend implements **Clean Architecture** principles with clear separation of concerns, making the codebase maintainable, testable, and scalable.

**Key Metrics**:
- ✅ **10/10 Controllers** refactored to thin pattern (< 360 lines each)
- ✅ **11 Services** created with all business logic (3,622 total lines)
- ✅ **6 Repositories** for data access abstraction
- ✅ **100% Centralized Configuration** (no scattered process.env)
- ✅ **99% Structured Logging** (158/159 console.log replaced)
- ✅ **Consistent Error Handling** with custom exceptions
- ✅ **Standardized Responses** with responseFormatter

**Remaining 20%**: Legacy root-level services (2,594 lines) - functional but not yet migrated. Optional future enhancement.

### 1.2 Core Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP REQUEST                            │
│                 (Client Application)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                            │
│  • CORS, Helmet, Compression                                │
│  • Body Parsers, Request Logging                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE CHAIN                            │
│  1. auth.js          → JWT verification                     │
│  2. validation.js    → Input validation                     │
│  3. ownership.js     → Resource ownership check             │
│  4. rateLimiter.js   → Rate limit enforcement               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               THIN CONTROLLER (API Layer)                    │
│  • Extract request data (req.body, req.params)              │
│  • Delegate to Service                                      │
│  • Format response via responseFormatter                    │
│  • Pass errors to next()                                    │
│  Average: < 160 lines per controller                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             SERVICE LAYER (Business Logic)                   │
│  • Business rule validation                                 │
│  • Orchestrate multiple repositories                        │
│  • Throw custom exceptions                                  │
│  • Structured logging                                       │
│  Average: 329 lines per service                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          REPOSITORY LAYER (Data Access)                      │
│  • Database operations only                                 │
│  • No business logic                                        │
│  • Query building and execution                             │
│  • Return raw data                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              MONGOOSE MODELS (Schema Layer)                  │
│  • Schema validation                                        │
│  • Pre/post hooks                                           │
│  • Virtual fields                                           │
│  • Instance methods                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
│  • Data persistence                                         │
│  • Indexing for performance                                 │
│  • ACID transactions (where needed)                         │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Design Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Single Responsibility**: Each class/module does one thing well
4. **Open/Closed**: Open for extension, closed for modification
5. **Interface Segregation**: No forced dependencies on unused interfaces
6. **DRY (Don't Repeat Yourself)**: Shared logic in reusable services
7. **Fail Fast**: Validate early, throw exceptions immediately
8. **Explicit over Implicit**: Clear, readable code over clever tricks

---

## 2. Architectural Layers

### 2.1 Layer Breakdown

```
AUREA---Backend/
│
├── API Layer (Routes & Controllers)
│   ├── Routes: Define endpoints and middleware chains
│   ├── Controllers: Thin HTTP handlers (< 15 lines per method)
│   └── Middleware: Request processing, validation, auth
│
├── Core Layer (Business Logic & Data Access)
│   ├── Services: Business rules, validation, orchestration
│   └── Repositories: Database operations, query building
│
├── Shared Layer (Cross-cutting Concerns)
│   ├── Exceptions: Custom error classes with HTTP mapping
│   ├── Constants: HTTP status codes, error codes
│   └── Utils: Response formatter, validators
│
├── Infrastructure Layer (External Services)
│   ├── Logging: Structured logging with sanitization
│   ├── Cache: Redis integration with graceful degradation
│   └── PDF: Puppeteer browser pool management
│
└── Configuration Layer
    ├── Centralized config with lazy evaluation
    ├── Environment variable validation
    └── Service initialization
```

### 2.2 Layer Dependencies

```
┌──────────────────────────────────────────┐
│         API Layer                        │
│  (Routes, Controllers, Middleware)       │
└──────────────────────────────────────────┘
              ↓ depends on
┌──────────────────────────────────────────┐
│         Core Layer                       │
│  (Services, Repositories)                │
└──────────────────────────────────────────┘
              ↓ depends on
┌──────────────────────────────────────────┐
│      Shared + Infrastructure             │
│  (Exceptions, Utils, Logging)            │
└──────────────────────────────────────────┘
              ↓ depends on
┌──────────────────────────────────────────┐
│         Configuration                    │
│  (Centralized Config)                    │
└──────────────────────────────────────────┘

Rule: Higher layers can depend on lower layers, never reverse
```

---

## 3. Service Layer Architecture

**Location**: `src/core/services/`
**Total Lines**: 3,622 lines across 11 services
**Average**: 329 lines per service

### 3.1 Service Inventory

| Service | Lines | Responsibility |
|---------|-------|----------------|
| **AuthService.js** | 282 | JWT token generation, user authentication, session management |
| **PortfolioService.js** | 434 | Portfolio CRUD, limit checks, slug generation, publishing workflow |
| **SiteService.js** | 745 | Deployment orchestration (Vercel & subdomain), HTML generation |
| **SubdomainService.js** | 429 | Gmail-style subdomain validation, ownership checks, file cleanup |
| **UserService.js** | 453 | User profile management, account operations, statistics |
| **PremiumService.js** | 200 | Premium subscription management, status checks, feature gating |
| **TemplateService.js** | 291 | Dynamic template management, schema validation, versioning |
| **CaseStudyService.js** | 310 | Case study CRUD, portfolio linkage, access control |
| **PDFExportService.js** | 279 | PDF generation coordination, template rendering, Puppeteer |
| **UploadService.js** | 119 | Cloudinary integration, file validation, optimization |
| **ProposalExtractService.js** | 80 | Gemini AI integration, PDF content extraction |

### 3.2 Service Architecture Pattern

**Example: PortfolioService.js**

```javascript
// src/core/services/PortfolioService.js

import PortfolioRepository from '../repositories/PortfolioRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { ValidationError, NotFoundError } from '../../shared/exceptions/index.js';
import logger from '../../infrastructure/logging/Logger.js';
import config from '../../config/index.js';

class PortfolioService {
  constructor() {
    this.portfolioRepo = new PortfolioRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Create a new portfolio with business rule validation
   */
  async createPortfolio(userId, portfolioData) {
    logger.service('PortfolioService', 'createPortfolio', { userId });

    // Business Rule 1: Check portfolio limit
    const count = await this.portfolioRepo.countByUserId(userId);
    const user = await this.userRepo.findById(userId);

    const limit = user.isPremium ? 50 : 5;
    if (count >= limit) {
      throw new ValidationError(`Portfolio limit reached. ${user.isPremium ? 'Premium' : 'Free'} users can have up to ${limit} portfolios.`);
    }

    // Business Rule 2: Set defaults
    const template = portfolioData.template || 'echelon';

    // Business Rule 3: Validate template exists
    // (template validation logic)

    // Delegate to repository
    const portfolio = await this.portfolioRepo.create({
      userId,
      ...portfolioData,
      template,
      isPublished: false,
      viewCount: 0
    });

    logger.info('Portfolio created', { portfolioId: portfolio._id, userId });
    return portfolio;
  }

  /**
   * Get portfolio by ID with ownership validation
   */
  async getPortfolio(portfolioId, userId) {
    logger.service('PortfolioService', 'getPortfolio', { portfolioId, userId });

    const portfolio = await this.portfolioRepo.findById(portfolioId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Business Rule: User can only access own portfolios (unless admin)
    if (portfolio.userId.toString() !== userId) {
      throw ForbiddenError.ownershipRequired('portfolio');
    }

    return portfolio;
  }

  // ... more methods
}

export default new PortfolioService();
```

### 3.3 Service Patterns & Best Practices

**✅ DO:**
- All business logic and validation in services
- Orchestrate multiple repositories
- Throw custom exceptions (ValidationError, NotFoundError, etc.)
- Use structured logger (logger.service, logger.info, logger.error)
- Return domain objects, not HTTP responses
- Make services stateless (no instance variables except dependencies)
- Use dependency injection pattern (repositories in constructor)

**❌ DON'T:**
- Access req/res objects (no HTTP concerns)
- Directly access Mongoose models (use repositories)
- Use console.log (use logger)
- Return HTTP status codes (throw exceptions instead)
- Mix business logic with database operations

### 3.4 Service Dependencies

```javascript
// Services can depend on:
✅ Repositories (data access)
✅ Other Services (composition)
✅ Shared utilities (validators, formatters)
✅ Infrastructure (logger, cache)
✅ Configuration (config object)

// Services CANNOT depend on:
❌ Controllers (higher layer)
❌ Routes (higher layer)
❌ Middleware (higher layer)
❌ Express req/res objects
```

---

## 4. Repository Layer

**Location**: `src/core/repositories/`
**Total**: 6 repositories
**Purpose**: Data access abstraction

### 4.1 Repository Inventory

| Repository | Responsibility |
|------------|----------------|
| **PortfolioRepository.js** | Portfolio CRUD, slug checks, view increments, pagination |
| **UserRepository.js** | User CRUD, email lookups, password management |
| **SiteRepository.js** | Site records, subdomain lookups, deployment tracking |
| **CaseStudyRepository.js** | Case study CRUD, portfolio queries, project searches |
| **TemplateRepository.js** | Template CRUD, schema retrieval, version management |
| **PDFRepository.js** | PDF metadata, generation tracking |

### 4.2 Repository Pattern

**Example: PortfolioRepository.js**

```javascript
// src/core/repositories/PortfolioRepository.js

import Portfolio from '../../models/Portfolio.js';
import logger from '../../infrastructure/logging/Logger.js';

class PortfolioRepository {
  /**
   * Create a new portfolio
   */
  async create(portfolioData) {
    logger.database('create', 'portfolios', { userId: portfolioData.userId });
    return await Portfolio.create(portfolioData);
  }

  /**
   * Find portfolio by ID
   */
  async findById(portfolioId, options = {}) {
    logger.database('read', 'portfolios', { portfolioId });

    let query = Portfolio.findById(portfolioId);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.select) {
      query = query.select(options.select);
    }

    return await query.exec();
  }

  /**
   * Count portfolios by user ID
   */
  async countByUserId(userId) {
    logger.database('count', 'portfolios', { userId });
    return await Portfolio.countDocuments({ userId });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug) {
    logger.database('read', 'portfolios', { slug });
    const portfolio = await Portfolio.findOne({ slug });
    return !!portfolio;
  }

  /**
   * Get user portfolios with pagination
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    logger.database('read', 'portfolios', { userId, page, limit });

    return await Portfolio.find({ userId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  /**
   * Increment view count
   */
  async incrementViewCount(portfolioId) {
    logger.database('update', 'portfolios', { portfolioId, action: 'incrementView' });

    return await Portfolio.findByIdAndUpdate(
      portfolioId,
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() }
      },
      { new: true }
    );
  }

  // ... more methods
}

export default PortfolioRepository;
```

### 4.3 Repository Best Practices

**✅ DO:**
- Database operations only (CRUD, queries)
- Log all database operations
- Accept flexible options (populate, select, pagination)
- Return raw data (Mongoose documents)
- Let Mongoose errors bubble up
- Use async/await consistently

**❌ DON'T:**
- Business logic or validation
- Throw custom exceptions (let Mongoose errors propagate)
- Access other repositories
- Format responses
- Log business events (use services for that)

---

## 5. Middleware Architecture

**Location**: `src/middleware/`
**Total**: 11 middleware files

### 5.1 Middleware Chain Order

```javascript
// Critical order for protected routes:
router.post('/portfolios',
  auth,                      // 1. JWT verification
  portfolioCrudLimiter,      // 2. Rate limiting
  validatePortfolioCreation, // 3. Input validation
  validatePortfolioContent,  // 4. Schema validation
  ownership,                 // 5. Resource ownership (if editing)
  controller                 // 6. Handle request
);
```

### 5.2 Middleware Inventory

| Middleware | Purpose | When Applied |
|------------|---------|--------------|
| **auth.js** | JWT verification, user attachment | All protected routes |
| **rateLimiter.js** | Rate limiting per endpoint | All API routes |
| **validation.js** | Input validation (express-validator) | Routes with user input |
| **ownership.js** | Resource ownership verification | Update/delete operations |
| **errorHandler.js** | Centralized error handling | End of middleware chain |
| **bruteForcePrevention.js** | Progressive delays on failures | Login, signup, password reset |
| **logSanitizer.js** | Sensitive data redaction | Applied globally |
| **requestLogger.js** | HTTP request/response logging | Applied globally |
| **premium.js** | Premium feature access control | Premium-only routes |
| **upload.js** | Multer file upload configuration | Upload endpoints |
| **validatePortfolioContent.js** | Template schema validation | Portfolio create/update |

### 5.3 Key Middleware Details

#### 5.3.1 Authentication Middleware (auth.js)

```javascript
// Two variants:

// 1. Required authentication (throws 401 if no token)
export const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw UnauthorizedError.tokenInvalid();
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // Load user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// 2. Optional authentication (continues without user)
export const optionalAuth = async (req, res, next) => {
  // Same as above but continues if no token
  // Used for public routes that show different content for logged-in users
};
```

#### 5.3.2 Rate Limiter (rateLimiter.js)

**Endpoint-Specific Limits**:

| Endpoint Type | Limit | Window | Key |
|--------------|-------|--------|-----|
| Slug checks | 10/min | 1 min | IP |
| Publishing | 5/min | 1 min | User ID |
| Portfolio CRUD | 30/min | 1 min | User ID |
| Upload | 20/min | 1 min | User ID |
| Public views | 100/min | 1 min | IP |
| Case study CRUD | 25/min | 1 min | User ID |
| General API | 100/min | 1 min | User ID or IP |

```javascript
export const portfolioCrudLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: 'Too many portfolio requests, please try again later'
});
```

#### 5.3.3 Brute Force Prevention (bruteForcePrevention.js)

**Protection Levels**:

1. **Login**: 5 attempts → 30 min lockout
2. **Signup**: 3 attempts → 15 min lockout
3. **Password Reset**: 3 attempts → 15 min lockout

**Storage**: Redis (primary) or in-memory (fallback)

```javascript
export const loginBruteForce = async (req, res, next) => {
  const key = `bruteforce:login:${req.body.email}`;

  // Check if locked out
  const attempts = await redis.get(key);

  if (attempts >= 5) {
    throw new ForbiddenError('Too many failed login attempts. Account locked for 30 minutes.');
  }

  // Attach increment function to request
  req.incrementFailedAttempts = async () => {
    await redis.incr(key);
    await redis.expire(key, 1800); // 30 minutes
  };

  next();
};
```

#### 5.3.4 Log Sanitizer (logSanitizer.js)

**Automatically redacts** 10+ sensitive data types:
- Passwords
- JWT tokens
- API keys
- Email addresses
- Credit card numbers
- SSN
- Phone numbers
- And more...

Applied globally to all log output.

---

## 6. API Layer (Controllers & Routes)

### 6.1 Controller Inventory

**Location**: `src/controllers/`
**Total Lines**: 1,598 lines across 10 controllers (63% reduction from original)
**Average**: 160 lines per controller

| Controller | Lines | Endpoints | Responsibility |
|------------|-------|-----------|----------------|
| **authController.js** | 103 | 4 | Signup, login, JWT generation |
| **portfolioController.js** | 162 | 9 | Portfolio CRUD operations |
| **siteController.js** | 364 | 10 | Subdomain publishing, Vercel deployment |
| **userController.js** | 271 | 13 | User profile, admin operations |
| **caseStudyController.js** | 137 | 6 | Case study CRUD |
| **templateController.js** | 212 | 14 | Template management |
| **pdfExportController.js** | 109 | 5 | PDF generation |
| **uploadController.js** | 77 | 2 | Image upload |
| **proposalExtract.controller.js** | 88 | 2 | AI PDF extraction |
| **proposalExtract.genai.controller.js** | 75 | 1 | Gemini AI integration |

### 6.2 Thin Controller Pattern

**Example: portfolioController.js**

```javascript
// src/controllers/portfolioController.js

import portfolioService from '../core/services/PortfolioService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * Create a new portfolio
 * POST /api/portfolios
 */
export const createPortfolio = async (req, res, next) => {
  try {
    // 1. Extract data from request (1 line)
    const { title, description, template, content } = req.body;

    // 2. Delegate to service (1 line)
    const portfolio = await portfolioService.createPortfolio(req.user._id, {
      title, description, template, content
    });

    // 3. Format response (1 line)
    return responseFormatter.created(res, { portfolio }, 'Portfolio created successfully');
  } catch (error) {
    // 4. Pass errors to error middleware (1 line)
    next(error);
  }
};

/**
 * Get portfolio by ID
 * GET /api/portfolios/:id
 */
export const getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getPortfolio(req.params.id, req.user._id);
    return responseFormatter.success(res, { portfolio });
  } catch (error) {
    next(error);
  }
};

// ... more methods (each < 15 lines)
```

**Controller Characteristics**:
- **Thin**: < 15 lines per method
- **No business logic**: All in services
- **No database access**: All via services
- **Consistent error handling**: Pass to next()
- **Standard responses**: Use responseFormatter

### 6.3 Route Organization

**Location**: `src/routes/`
**Total**: 9 route files
**Total Endpoints**: 65+

| Route File | Endpoints | Description |
|------------|-----------|-------------|
| **authRoutes.js** | 4 | Authentication endpoints |
| **userRoutes.js** | 13 | User management, admin operations |
| **portfolioRoutes.js** | 9 | Portfolio CRUD, publishing |
| **templateRoutes.js** | 14 | Template system management |
| **caseStudyRoutes.js** | 6 | Case study CRUD |
| **siteRoutes.js** | 10 | Site publishing, analytics |
| **pdfRoutes.js** | 5 | PDF export endpoints |
| **uploadRoutes.js** | 2 | Image upload |
| **proposalExtract.routes.js** | 3 | AI PDF extraction |

**Example: portfolioRoutes.js**

```javascript
import express from 'express';
import { auth } from '../middleware/auth.js';
import { portfolioCrudLimiter } from '../middleware/rateLimiter.js';
import { validatePortfolioCreation } from '../middleware/validation.js';
import { validatePortfolioContent } from '../middleware/validatePortfolioContent.js';
import * as portfolioController from '../controllers/portfolioController.js';

const router = express.Router();

// Create portfolio
router.post('/',
  auth,                           // Authenticate
  portfolioCrudLimiter,           // Rate limit
  validatePortfolioCreation,      // Validate input
  validatePortfolioContent,       // Validate schema
  portfolioController.createPortfolio
);

// Get user's portfolios
router.get('/user/me',
  auth,
  portfolioController.getUserPortfolios
);

// Get single portfolio
router.get('/:id',
  auth,
  portfolioController.getPortfolio
);

// Update portfolio
router.put('/:id',
  auth,
  portfolioCrudLimiter,
  validatePortfolioCreation,
  validatePortfolioContent,
  portfolioController.updatePortfolio
);

// Delete portfolio
router.delete('/:id',
  auth,
  portfolioController.deletePortfolio
);

// Publish portfolio
router.put('/:id/publish',
  auth,
  portfolioController.publishPortfolio
);

export default router;
```

---

## 7. Data Models & Relationships

**Location**: `src/models/`
**Total**: 5 Mongoose schemas

### 7.1 Entity Relationship Diagram

```
┌────────────────────┐
│       User         │
│  _id (ObjectId)    │◄─────────┐
│  email (unique)    │          │
│  password (hashed) │          │ userId
│  isPremium         │          │
│  premiumType       │          │
└────────────────────┘          │
         │                      │
         │ userId               │
         │                      │
         ▼                      │
┌────────────────────┐          │
│    Portfolio       │──────────┘
│  _id (ObjectId)    │
│  userId (ref)      │◄─────────┐
│  templateId (ref)  │─────┐    │
│  slug (unique)     │     │    │ portfolioId
│  isPublished       │     │    │
│  viewCount         │     │    │
└────────────────────┘     │    │
         │                 │    │
         │ portfolioId     │    │
         │                 │    │
         ▼                 ▼    │
┌────────────────────┐  ┌─────────────┐
│    CaseStudy       │  │  Template   │
│  _id (ObjectId)    │  │  _id        │
│  portfolioId (ref) │  │  name       │
│  projectId         │  │  schema     │
│  content           │  │  version    │
└────────────────────┘  └─────────────┘
         │
         │ portfolioId
         │
         ▼
┌────────────────────┐
│       Site         │
│  _id (ObjectId)    │
│  userId (ref)      │
│  portfolioId (ref) │
│  subdomain (unique)│
│  deploymentType    │
│  views             │
└────────────────────┘

Relationships:
• User (1) → (*) Portfolio
• User (1) → (*) Site
• Portfolio (1) → (1) Site
• Portfolio (*) → (1) Template
• Portfolio (1) → (*) CaseStudy
```

### 7.2 Model Details

#### 7.2.1 User Model

```javascript
// src/models/User.js

const userSchema = new Schema({
  // Authentication
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },

  // Profile
  name: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },

  // Premium Subscription
  isPremium: { type: Boolean, default: false },
  premiumType: {
    type: String,
    enum: ['free', 'monthly', 'yearly', 'lifetime'],
    default: 'free'
  },
  premiumStartDate: { type: Date },
  premiumEndDate: { type: Date },

  // Storage Management
  storageUsed: { type: Number, default: 0 }, // in bytes
  storageLimit: { type: Number, default: 1073741824 }, // 1GB default

  // Access Control
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook: Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Check premium status
userSchema.methods.checkPremiumStatus = function() {
  if (!this.isPremium) return false;
  if (this.premiumType === 'lifetime') return true;
  return this.premiumEndDate && this.premiumEndDate > new Date();
};
```

**Indexes**:
- `{ email: 1 }` - Unique index for authentication

#### 7.2.2 Portfolio Model

```javascript
// src/models/Portfolio.js

const portfolioSchema = new Schema({
  // Ownership
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Template
  template: { type: String, default: 'echelon' }, // Legacy
  templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
  templateVersion: { type: String },

  // Content
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  content: { type: Schema.Types.Mixed }, // Dynamic based on template
  sections: [{ type: Schema.Types.Mixed }],
  styling: { type: Schema.Types.Mixed },

  // SEO & Publishing
  slug: { type: String, unique: true, sparse: true }, // Unique but optional
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },

  // Analytics
  viewCount: { type: Number, default: 0 },
  exportCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual: Public URL
portfolioSchema.virtual('publicUrl').get(function() {
  if (!this.isPublished || !this.slug) return null;
  return `${process.env.FRONTEND_URL}/portfolio/${this.slug}`;
});

// Ensure virtuals are included in JSON
portfolioSchema.set('toJSON', { virtuals: true });
portfolioSchema.set('toObject', { virtuals: true });
```

**Strategic Indexes**:
- `{ userId: 1, createdAt: -1 }` - User portfolio listing
- `{ isPublished: 1, publishedAt: -1 }` - Public portfolio queries
- `{ userId: 1, isPublished: 1 }` - User's published portfolios
- `{ slug: 1 }` - Unique sparse index for SEO URLs

#### 7.2.3 Template Model

```javascript
// src/models/Template.js

const templateSchema = new Schema({
  // Identification
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },

  // Schema & Validation
  schema: { type: Schema.Types.Mixed, required: true }, // JSON Schema
  version: { type: String, default: '1.0.0' }, // Semantic versioning

  // Categorization
  category: {
    type: String,
    enum: ['minimal', 'creative', 'professional', 'portfolio', 'resume'],
    default: 'portfolio'
  },
  tags: [{ type: String }],

  // Access Control
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Rating System
  ratings: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },

  // Metadata
  description: { type: String },
  preview: { type: String }, // Preview image URL
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

#### 7.2.4 CaseStudy Model

```javascript
// src/models/CaseStudy.js

const caseStudySchema = new Schema({
  // Linkage
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  projectId: { type: String, required: true }, // Matches portfolio project ID

  // Content Structure
  hero: {
    title: { type: String },
    subtitle: { type: String },
    image: { type: String }
  },

  overview: {
    description: { type: String },
    role: { type: String },
    duration: { type: String },
    team: [{ type: String }]
  },

  sections: [{
    type: { type: String, enum: ['text', 'image', 'gallery', 'video'] },
    title: { type: String },
    content: { type: Schema.Types.Mixed }
  }],

  // Publishing
  isPublished: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
caseStudySchema.index({ portfolioId: 1, projectId: 1 }, { unique: true });
```

#### 7.2.5 Site Model

```javascript
// src/models/Site.js

const siteSchema = new Schema({
  // Ownership
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, unique: true },

  // Subdomain Publishing
  subdomain: { type: String, unique: true, sparse: true },
  customDomain: { type: String },

  // Deployment
  deploymentType: {
    type: String,
    enum: ['vercel', 'subdomain', 'both'],
    required: true
  },
  vercelUrl: { type: String },
  vercelProjectId: { type: String },

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'unpublished', 'error'],
    default: 'draft'
  },

  // Analytics
  views: { type: Number, default: 0 },
  lastVisit: { type: Date },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date }
});
```

**Indexes**:
- `{ subdomain: 1 }` - Fast subdomain lookups
- `{ portfolioId: 1 }` - Unique constraint
- `{ userId: 1 }` - User site queries

---

## 8. Shared Components

**Location**: `src/shared/`

### 8.1 Custom Exceptions

**Location**: `src/shared/exceptions/`

All exceptions extend `ApplicationError` base class with automatic HTTP status mapping:

```javascript
// Base Exception
class ApplicationError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific Exceptions

// 400 - Validation Error
class ValidationError extends ApplicationError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }

  static invalidContent(message) {
    return new ValidationError(message);
  }
}

// 401 - Unauthorized
class UnauthorizedError extends ApplicationError {
  constructor(message) {
    super(message, 401, 'UNAUTHORIZED');
  }

  static tokenExpired() {
    return new UnauthorizedError('Token has expired');
  }

  static tokenInvalid() {
    return new UnauthorizedError('Invalid token');
  }

  static invalidCredentials() {
    return new UnauthorizedError('Invalid email or password');
  }
}

// 403 - Forbidden
class ForbiddenError extends ApplicationError {
  constructor(message) {
    super(message, 403, 'FORBIDDEN');
  }

  static ownershipRequired(resourceType) {
    return new ForbiddenError(`You don't have permission to access this ${resourceType}`);
  }
}

// 404 - Not Found
class NotFoundError extends ApplicationError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }

  static resource(resourceType, resourceId) {
    return new NotFoundError(`${resourceType} with ID ${resourceId} not found`);
  }
}

// 409 - Conflict
class ConflictError extends ApplicationError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }

  static slugTaken(slug) {
    return new ConflictError(`Slug '${slug}' is already taken`);
  }
}
```

**Usage in Services**:

```javascript
// Throw exceptions with rich context
throw NotFoundError.resource('Portfolio', portfolioId);
throw UnauthorizedError.invalidCredentials();
throw ForbiddenError.ownershipRequired('portfolio');
throw ConflictError.slugTaken(slug);
throw new ValidationError('Portfolio limit reached', 'portfolioCount');
```

**Error Middleware Handles Conversion**:

```javascript
// src/middleware/errorHandler.js

export const errorHandler = (err, req, res, next) => {
  // Custom exceptions have statusCode
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      field: err.field, // for validation errors
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Generic errors (programming errors)
  logger.error('Unexpected error', { error: err });
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### 8.2 Response Formatter

**Location**: `src/shared/utils/responseFormatter.js`

Standardizes all API responses:

```javascript
class ResponseFormatter {
  /**
   * Success response (200)
   */
  success(res, data = {}, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Created response (201)
   */
  created(res, data = {}, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Paginated response (200)
   */
  paginated(res, items, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: Math.ceil(pagination.total / pagination.limit)
        }
      }
    });
  }

  /**
   * Not found response (404)
   */
  notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  // ... more methods
}

export default new ResponseFormatter();
```

**Standard Response Format**:

```javascript
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { /* response data */ },
  "code": "ERROR_CODE", // only for errors
  "pagination": { /* pagination info */ } // only for paginated
}
```

### 8.3 Constants

**HTTP Status Codes** (`src/shared/constants/httpStatus.js`):
```javascript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};
```

**Error Codes** (`src/shared/constants/errorCodes.js`):
```javascript
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

---

## 9. Infrastructure Layer

**Location**: `src/infrastructure/`

### 9.1 Structured Logging

**Location**: `src/infrastructure/logging/Logger.js`
**Size**: 252 lines

**Features**:
- JSON structured logging for production
- Colorized console output for development
- Automatic sensitive data sanitization
- Contextual logging with metadata
- Integration with logSanitizer

**Log Levels**:
- `error` - Errors and exceptions
- `warn` - Warnings
- `info` - Important events
- `debug` - Detailed debug information

**Logger Methods**:

```javascript
import logger from '../../infrastructure/logging/Logger.js';

// General logging
logger.info('User logged in', { userId, email });
logger.error('Database connection failed', { error });
logger.warn('Cache miss', { key });
logger.debug('Processing request', { requestId });

// Specialized loggers
logger.service('PortfolioService', 'createPortfolio', { userId });
logger.database('create', 'portfolios', { userId });
logger.auth('login', userId, { ip: req.ip });
logger.externalApi('Cloudinary', '/upload', 200, 1234); // 1234ms duration
```

**Output Format** (Production):
```json
{
  "level": "INFO",
  "timestamp": "2025-11-14T12:34:56.789Z",
  "message": "Portfolio created",
  "context": {
    "portfolioId": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea"
  },
  "service": "PortfolioService",
  "method": "createPortfolio"
}
```

**Output Format** (Development):
```
[INFO] 2025-11-14 12:34:56 - Portfolio created
  portfolioId: 507f1f77bcf86cd799439011
  userId: 507f191e810c19729de860ea
```

**Automatic Sanitization**:
Passwords, tokens, emails, and other sensitive data automatically redacted via logSanitizer middleware.

### 9.2 PDF Infrastructure

**Browser Pool** (`src/infrastructure/pdf/BrowserPool.js`):

Manages Puppeteer browser instances for concurrent PDF generation:

```javascript
class BrowserPool {
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
    this.browsers = [];
    this.queue = [];
  }

  async acquire() {
    // Return available browser or create new (up to maxSize)
    // Queue requests if pool exhausted
  }

  async release(browser) {
    // Return browser to pool or close if pool full
  }

  async closeAll() {
    // Cleanup all browsers
  }
}

export default new BrowserPool(config.pdf.maxConcurrent || 3);
```

**Configuration**:
- `PDF_BROWSER_POOL_SIZE` - Max concurrent browsers (default: 3)
- `PDF_BROWSER_IDLE_TIMEOUT` - Browser idle timeout (default: 300000ms / 5 min)

**Usage**:
```javascript
const browser = await browserPool.acquire();
try {
  const page = await browser.newPage();
  await page.goto(url);
  const pdf = await page.pdf();
  return pdf;
} finally {
  await browserPool.release(browser);
}
```

### 9.3 Cache Layer

**Redis Cache** (`src/utils/cache.js`):

Optional Redis caching with graceful degradation:

```javascript
class Cache {
  constructor() {
    this.redis = null;
    this.enabled = false;
  }

  async init() {
    try {
      if (config.redis.url) {
        this.redis = createClient({ url: config.redis.url });
        await this.redis.connect();
        this.enabled = true;
        logger.info('Redis cache initialized');
      }
    } catch (error) {
      logger.warn('Redis unavailable, caching disabled', { error });
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.enabled) return false;
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  async del(key) {
    if (!this.enabled) return false;
    await this.redis.del(key);
  }
}

export default new Cache();
```

**Cache Strategy**:
- Public portfolios: 5-10 min TTL
- User data: No caching (always fresh)
- PDF generation: Cache results with file hash key
- Brute force tracking: Use Redis or fall back to in-memory

---

## 10. Configuration Management

**Location**: `src/config/index.js`
**Pattern**: 100% Centralized, No scattered process.env

### 10.1 Configuration Architecture

```javascript
// src/config/index.js

const config = {
  // Application
  app: {
    get port() { return parseInt(process.env.PORT, 10) || 5000; },
    get env() { return process.env.NODE_ENV || 'development'; },
    get name() { return 'AUREA Backend API'; },
    get version() { return '1.0.0'; }
  },

  // Database
  database: {
    get uri() { return process.env.MONGODB_URI; },
    get options() {
      return {
        useNewUrlParser: true,
        useUnifiedTopology: true
      };
    }
  },

  // Authentication
  auth: {
    get jwtSecret() { return process.env.JWT_SECRET; },
    get jwtExpire() { return process.env.JWT_EXPIRE || '30d'; },
    get bcryptRounds() { return 12; }
  },

  // CORS
  cors: {
    get allowedOrigins() {
      return process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:5173', 'http://localhost:3000'];
    },
    get credentials() { return true; },
    get maxAge() { return 86400; }
  },

  // Cloudinary
  cloudinary: {
    get cloudName() { return process.env.CLOUDINARY_CLOUD_NAME; },
    get apiKey() { return process.env.CLOUDINARY_API_KEY; },
    get apiSecret() { return process.env.CLOUDINARY_API_SECRET; }
  },

  // Redis
  redis: {
    get url() { return process.env.REDIS_URL; }
  },

  // Vercel
  vercel: {
    get token() { return process.env.VERCEL_TOKEN; },
    get orgId() { return process.env.VERCEL_ORG_ID; },
    get projectId() { return process.env.VERCEL_PROJECT_ID; }
  },

  // Gemini AI
  gemini: {
    get apiKey() { return process.env.GEMINI_API_KEY; }
  },

  // Logging
  logging: {
    get level() { return process.env.LOG_LEVEL || 'info'; },
    get prettyPrint() { return config.app.env === 'development'; }
  },

  // Rate Limiting
  rateLimit: {
    get windowMs() { return 60 * 1000; }, // 1 minute
    slugCheck: { max: 10 },
    publishing: { max: 5 },
    portfolioCrud: { max: 30 },
    upload: { max: 20 },
    publicView: { max: 100 },
    caseStudyCrud: { max: 25 },
    general: { max: 100 }
  },

  // Upload
  upload: {
    get maxSize() { return 10 * 1024 * 1024; }, // 10MB
    get allowedTypes() { return ['image/jpeg', 'image/png', 'image/webp']; }
  },

  // PDF
  pdf: {
    get outputDir() { return 'generated-files/pdfs'; },
    get maxConcurrent() { return parseInt(process.env.PDF_BROWSER_POOL_SIZE, 10) || 3; },
    get timeout() { return 60000; }, // 60 seconds
    get poolIdleTimeout() { return parseInt(process.env.PDF_BROWSER_IDLE_TIMEOUT, 10) || 300000; }
  },

  // Subdomain
  subdomain: {
    get minLength() { return 3; },
    get maxLength() { return 30; },
    get pattern() { return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/; }
  },

  // Pagination
  pagination: {
    get defaultLimit() { return 10; },
    get maxLimit() { return 100; }
  },

  // Frontend
  frontend: {
    get url() { return process.env.FRONTEND_URL || 'http://localhost:5173'; }
  }
};

export default config;
```

### 10.2 Benefits of Centralized Config

**✅ Advantages**:
1. **Single Source of Truth**: All config in one place
2. **Type Conversion**: Automatic parseInt, parseFloat
3. **Defaults**: Fallback values for optional config
4. **Validation**: Can validate on access
5. **Lazy Evaluation**: Delays reading env vars until needed
6. **Documentation**: Config structure self-documents requirements
7. **Testability**: Easy to mock config for tests

**❌ Before (Scattered)**:
```javascript
// Different files accessing process.env directly
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET;
```

**✅ After (Centralized)**:
```javascript
import config from './config/index.js';

const port = config.app.port;
const jwtSecret = config.auth.jwtSecret;
```

### 10.3 Environment Variable Validation

**Location**: `src/config/envValidator.js`

Validates required environment variables on startup:

```javascript
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logger.info('Environment variables validated');
};
```

Called in `server.js` before starting server.

---

## 11. External Integrations

### 11.1 Integration Overview

| Service | Purpose | Configuration | Graceful Degradation |
|---------|---------|---------------|---------------------|
| **MongoDB** | Primary database | MONGODB_URI | ❌ Required (server won't start) |
| **Redis** | Caching, brute force tracking | REDIS_URL | ✅ Falls back to in-memory |
| **Cloudinary** | Image storage | CLOUDINARY_* | ❌ Required for uploads |
| **Vercel** | Automated deployments | VERCEL_* | ✅ Optional feature |
| **Puppeteer** | PDF generation | Built-in | ❌ Required for PDFs |
| **Gemini AI** | PDF extraction | GEMINI_API_KEY | ✅ Optional feature |

### 11.2 MongoDB Integration

**Connection Management** (`src/config/database.js`):

```javascript
import mongoose from 'mongoose';
import logger from '../infrastructure/logging/Logger.js';
import config from './index.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, config.database.options);

    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      database: conn.connection.name
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    process.exit(1); // Critical error - cannot continue
  }
};

export default connectDB;
```

**Strategic Indexing**:
- Portfolio: `{ userId: 1, createdAt: -1 }`, `{ slug: 1 }`, `{ isPublished: 1 }`
- User: `{ email: 1 }`
- Site: `{ subdomain: 1 }`, `{ portfolioId: 1 }`
- CaseStudy: `{ portfolioId: 1, projectId: 1 }`

### 11.3 Redis Integration

**Initialization** (`src/utils/cache.js`):

```javascript
export const initRedis = async () => {
  if (!config.redis.url) {
    logger.warn('Redis URL not configured, caching disabled');
    return null;
  }

  try {
    const redis = createClient({ url: config.redis.url });
    await redis.connect();
    logger.info('Redis connected');
    return redis;
  } catch (error) {
    logger.warn('Redis connection failed, falling back to in-memory', { error });
    return null; // Graceful degradation
  }
};
```

**Use Cases**:
1. **Public Portfolio Cache**: 5-10 min TTL
2. **Brute Force Tracking**: Login attempt counters
3. **Rate Limiting**: Request counters (if Redis available)
4. **PDF Cache**: Generated PDF files by hash

**Graceful Degradation**:
- If Redis unavailable, brute force uses in-memory Map
- Rate limiting uses express-rate-limit's built-in memory store
- No caching for public portfolios (slightly slower but functional)

### 11.4 Cloudinary Integration

**Initialization** (`src/config/cloudinary.js`):

```javascript
import { v2 as cloudinary } from 'cloudinary';
import logger from '../infrastructure/logging/Logger.js';
import config from './index.js';

export const initCloudinary = () => {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });

  logger.info('Cloudinary configured', {
    cloudName: config.cloudinary.cloudName
  });
};
```

**Upload Service** (`src/core/services/UploadService.js`):

```javascript
class UploadService {
  async uploadImage(file, folder = 'portfolios') {
    logger.service('UploadService', 'uploadImage', { folder });

    // Validate file
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Invalid file type. Allowed: jpg, png, webp');
    }

    if (file.size > config.upload.maxSize) {
      throw new ValidationError('File too large. Max: 10MB');
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Cleanup temp file
    await fs.unlink(file.path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  }

  async deleteImage(publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
}
```

**Security**: All uploads proxied through backend - no frontend credentials.

### 11.5 Vercel Integration

**Deployment Service** (`services/deploymentService.js` - 483 lines):

```javascript
// Vercel API integration for automated deployments

class DeploymentService {
  async deployToVercel(portfolioId, userId) {
    logger.service('DeploymentService', 'deployToVercel', { portfolioId });

    // 1. Generate HTML files
    const files = await this.generatePortfolioFiles(portfolioId);

    // 2. Create Vercel project (if first deployment)
    const project = await this.createOrGetProject(portfolioId);

    // 3. Deploy files to Vercel
    const deployment = await this.createDeployment(project.id, files);

    // 4. Update Site record
    await Site.findOneAndUpdate(
      { portfolioId },
      {
        deploymentType: 'vercel',
        vercelUrl: deployment.url,
        vercelProjectId: project.id,
        status: 'published',
        publishedAt: new Date()
      },
      { upsert: true }
    );

    return deployment;
  }

  async createDeployment(projectId, files) {
    const response = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.vercel.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectId,
        files: files.map(f => ({
          file: f.name,
          data: Buffer.from(f.content).toString('base64')
        })),
        projectSettings: {
          framework: null // Static HTML
        }
      })
    });

    return await response.json();
  }
}
```

**Features**:
- Automated project creation
- File deployment via Vercel API
- Environment variable injection
- Deployment status tracking
- Custom domain support

### 11.6 Puppeteer Integration

**PDF Generation Service** (`services/pdfGenerationService.js` - 607 lines):

```javascript
import puppeteer from 'puppeteer';
import browserPool from '../src/infrastructure/pdf/BrowserPool.js';

class PDFGenerationService {
  async generatePortfolioPDF(portfolioId) {
    logger.service('PDFGenerationService', 'generatePortfolioPDF', { portfolioId });

    // 1. Acquire browser from pool
    const browser = await browserPool.acquire();

    try {
      // 2. Create page and navigate to frontend preview
      const page = await browser.newPage();
      const url = `${config.frontend.url}/portfolio/${portfolioId}/preview?pdfMode=true`;

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: config.pdf.timeout
      });

      // 3. Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      // 4. Save to file system
      const fileName = `portfolio-${portfolioId}-${Date.now()}.pdf`;
      const filePath = path.join(config.pdf.outputDir, fileName);
      await fs.writeFile(filePath, pdf);

      return { filePath, fileName };

    } finally {
      // 5. Release browser back to pool
      await browserPool.release(browser);
    }
  }
}
```

**Browser Pool Benefits**:
- Reuse browser instances (faster)
- Limit concurrent generations (prevent memory issues)
- Automatic cleanup of idle browsers
- Queue requests when pool exhausted

### 11.7 Gemini AI Integration

**Proposal Extract Service** (`src/core/services/ProposalExtractService.js`):

```javascript
import { GoogleGenerativeAI } from '@google/genai';
import config from '../../config/index.js';

class ProposalExtractService {
  constructor() {
    if (config.gemini.apiKey) {
      this.ai = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
      this.enabled = true;
    } else {
      logger.warn('Gemini AI not configured');
      this.enabled = false;
    }
  }

  async extractFromPDF(pdfBuffer) {
    if (!this.enabled) {
      throw new ValidationError('AI extraction not available');
    }

    logger.service('ProposalExtractService', 'extractFromPDF');

    // Convert PDF to text
    const text = await this.pdfToText(pdfBuffer);

    // Use Gemini AI to extract structured data
    const prompt = `
      Extract the following from this proposal document:
      - Project title
      - Client name
      - Budget/pricing
      - Timeline
      - Key deliverables

      Document:
      ${text}

      Return as JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const extracted = JSON.parse(response.text());

    return extracted;
  }
}
```

**Graceful Degradation**: Feature disabled if API key not provided.

---

## 12. Security Architecture

### 12.1 Multi-Layer Security

```
┌─────────────────────────────────────────────────────────────┐
│              Layer 1: Network Security                       │
│  • HTTPS enforcement (production)                           │
│  • Helmet.js security headers                               │
│  • CORS with strict origin validation                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Layer 2: Rate Limiting                          │
│  • Endpoint-specific limits (10-100 req/min)                │
│  • Per-user and per-IP tracking                             │
│  • Brute force protection (5 attempts → 30 min lockout)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Layer 3: Authentication                         │
│  • JWT with Bearer token (30-day expiry)                    │
│  • Bcrypt password hashing (cost: 12)                       │
│  • Token verification in auth middleware                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Layer 4: Authorization                          │
│  • Resource ownership verification                          │
│  • Role-based access control (user, admin)                  │
│  • Premium feature gating                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Layer 5: Input Validation                       │
│  • express-validator on all inputs                          │
│  • Template schema validation                               │
│  • File type and size validation                            │
│  • XSS prevention (input sanitization)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Layer 6: Data Security                          │
│  • Log sanitization (10+ sensitive data types)              │
│  • Cloudinary proxy (no frontend credentials)               │
│  • Secure session management                                │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Security Implementations

#### 12.2.1 Authentication Flow

```
1. User submits credentials
   POST /api/auth/login
   { email, password }

2. Brute force middleware checks
   • Count failed attempts for email
   • If >= 5: Reject with 403
   • If < 5: Continue

3. Controller validates credentials
   • Find user by email
   • Compare password with bcrypt
   • If invalid: Increment failed attempts

4. Generate JWT token
   • Sign with JWT_SECRET
   • Include userId in payload
   • Set 30-day expiration

5. Return token
   {
     "success": true,
     "token": "eyJhbGci...",
     "user": { ... }
   }

6. Client stores token
   • localStorage or secure cookie
   • Include in Authorization header

7. Subsequent requests
   Authorization: Bearer <token>

8. Auth middleware verifies
   • Extract token from header
   • Verify signature with JWT_SECRET
   • Load user from database
   • Attach to req.user
```

#### 12.2.2 Rate Limiting Strategy

**Per-Endpoint Limits**:
```javascript
// Aggressive limits for sensitive operations
slugCheckLimiter: 10 req/min per IP
publishingLimiter: 5 req/min per user

// Moderate limits for CRUD
portfolioCrudLimiter: 30 req/min per user
caseStudyCrudLimiter: 25 req/min per user
uploadLimiter: 20 req/min per user

// Generous limits for reads
publicViewLimiter: 100 req/min per IP
generalApiLimiter: 100 req/min per user or IP
```

**Implementation**:
```javascript
import rateLimit from 'express-rate-limit';

export const portfolioCrudLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.portfolioCrud.max, // 30
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  handler: (req, res) => {
    throw new TooManyRequestsError('Rate limit exceeded. Please try again later.');
  }
});
```

#### 12.2.3 Brute Force Protection

**Progressive Delays**:

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 | 0s | 0s |
| 2 | 1s | 1s |
| 3 | 3s | 4s |
| 4 | 9s | 13s |
| 5 | 27s | 40s |
| 6+ | 30 min lockout | - |

**Storage**: Redis (persistent) or in-memory Map (fallback)

**Endpoints Protected**:
- Login: 5 attempts → 30 min lockout
- Signup: 3 attempts → 15 min lockout
- Password reset: 3 attempts → 15 min lockout

#### 12.2.4 Input Validation

**Example: Portfolio Creation**

```javascript
// src/middleware/validation.js

export const validatePortfolioCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be max 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),

  body('template')
    .optional()
    .isIn(['echelon', 'serene', 'chic', 'boldfolio']).withMessage('Invalid template'),

  body('content')
    .optional()
    .isObject().withMessage('Content must be an object'),

  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    next();
  }
];
```

#### 12.2.5 Security Headers (Helmet.js)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For static HTML
      frameSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

**Headers Applied**:
- Content-Security-Policy (CSP)
- X-Frame-Options: SAMEORIGIN (clickjacking prevention)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS) in production
- X-XSS-Protection

#### 12.2.6 CORS Configuration

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [config.frontend.url] // Strict whitelist
  : ['http://localhost:5173', 'http://localhost:3000']; // Dev flexibility

app.use(cors({
  origin: (origin, callback) => {
    // No-origin requests (like Postman) blocked in production
    if (!origin && process.env.NODE_ENV === 'production') {
      return callback(new Error('No origin header'), false);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

#### 12.2.7 Log Sanitization

**Automatic Redaction** (src/middleware/logSanitizer.js):

```javascript
const SENSITIVE_PATTERNS = {
  password: /password["\s:]*["']?([^"'\s,}]+)/gi,
  token: /token["\s:]*["']?([^"'\s,}]+)/gi,
  apiKey: /api[-_]?key["\s:]*["']?([^"'\s,}]+)/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  // ... 10+ total patterns
};

export const sanitize = (data) => {
  let sanitized = JSON.stringify(data);

  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    sanitized = sanitized.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
  });

  return JSON.parse(sanitized);
};
```

**Applied To**:
- All log output (logger)
- Request/response logging
- Error messages in production

### 12.3 Security Best Practices

**✅ Implemented**:
- JWT authentication with Bearer tokens
- Bcrypt password hashing (cost: 12)
- Rate limiting per endpoint
- Brute force protection with progressive delays
- Input validation on all endpoints
- XSS prevention via input sanitization
- CSRF protection via token-based auth
- Helmet.js security headers
- Strict CORS policy
- Log sanitization (automatic)
- Cloudinary proxy (no frontend credentials)
- Resource ownership verification
- Role-based access control
- Premium feature gating

**Express 5 Note**:
Some security middleware (express-mongo-sanitize, xss-clean) disabled due to Express 5 incompatibility. Alternative protections: express-validator, HPP, Helmet, rate limiting, brute force prevention.

---

## 13. Request Flow Example

### Complete Request Flow: Create Portfolio

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENT REQUEST                                          │
│     POST http://localhost:5000/api/portfolios               │
│     Headers:                                                │
│       Authorization: Bearer eyJhbGci...                     │
│       Content-Type: application/json                        │
│     Body:                                                   │
│       {                                                     │
│         "title": "My Portfolio",                           │
│         "description": "My work",                          │
│         "template": "echelon",                             │
│         "content": { ... }                                 │
│       }                                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. EXPRESS SERVER (server.js)                              │
│     • Helmet.js: Apply security headers                    │
│     • CORS: Validate origin                                │
│     • Body Parser: Parse JSON body                         │
│     • Request Logger: Log request details                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. ROUTE MATCHING (portfolioRoutes.js)                     │
│     router.post('/',                                        │
│       auth,                      // Middleware 1            │
│       portfolioCrudLimiter,      // Middleware 2            │
│       validatePortfolioCreation, // Middleware 3            │
│       validatePortfolioContent,  // Middleware 4            │
│       createPortfolio            // Controller              │
│     );                                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. MIDDLEWARE CHAIN EXECUTION                              │
│                                                             │
│  4a. auth.js (Authentication)                              │
│      • Extract: "Bearer eyJhbGci..." from Authorization    │
│      • Verify JWT with config.auth.jwtSecret               │
│      • Decode payload: { id: "507f191e810c..." }          │
│      • Query: User.findById("507f191e810c...")            │
│      • Attach: req.user = { _id, email, ... }             │
│      • Continue: next()                                    │
│                                                             │
│  4b. portfolioCrudLimiter (Rate Limiting)                  │
│      • Key: req.user._id.toString()                        │
│      • Check: Redis/memory counter                         │
│      • Count: 12/30 requests in last minute               │
│      • Continue: next() (under limit)                      │
│                                                             │
│  4c. validatePortfolioCreation (Input Validation)          │
│      • Validate title: ✓ present, ✓ < 200 chars          │
│      • Validate description: ✓ optional, ✓ < 1000 chars  │
│      • Validate template: ✓ valid template name           │
│      • Validate content: ✓ is object                      │
│      • Continue: next()                                    │
│                                                             │
│  4d. validatePortfolioContent (Schema Validation)          │
│      • Fetch template schema from database                 │
│      • Validate content structure against schema           │
│      • Continue: next()                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. CONTROLLER (portfolioController.js)                     │
│     createPortfolio(req, res, next) {                      │
│       try {                                                 │
│         // Extract data (1 line)                           │
│         const { title, description, template, content }    │
│           = req.body;                                      │
│                                                             │
│         // Delegate to service (1 line)                    │
│         const portfolio = await                            │
│           portfolioService.createPortfolio(                │
│             req.user._id,                                  │
│             { title, description, template, content }      │
│           );                                               │
│                                                             │
│         // Format response (1 line)                        │
│         return responseFormatter.created(                  │
│           res,                                             │
│           { portfolio },                                   │
│           'Portfolio created successfully'                 │
│         );                                                 │
│       } catch (error) {                                    │
│         next(error); // Pass to error middleware           │
│       }                                                     │
│     }                                                       │
│                                                             │
│     Total: 4 lines of logic                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. SERVICE LAYER (PortfolioService.js)                     │
│     async createPortfolio(userId, portfolioData) {         │
│       logger.service('PortfolioService', 'createPortfolio');│
│                                                             │
│       // Business Rule 1: Check portfolio limit            │
│       const count = await                                  │
│         this.portfolioRepo.countByUserId(userId);         │
│       const user = await this.userRepo.findById(userId);  │
│                                                             │
│       const limit = user.isPremium ? 50 : 5;              │
│       if (count >= limit) {                                │
│         throw new ValidationError(                         │
│           `Portfolio limit reached (${limit})`             │
│         );                                                 │
│       }                                                     │
│                                                             │
│       // Business Rule 2: Set defaults                     │
│       const template = portfolioData.template || 'echelon';│
│                                                             │
│       // Business Rule 3: Validate template exists         │
│       const templateExists = await                         │
│         this.templateRepo.exists(template);                │
│       if (!templateExists) {                               │
│         throw new ValidationError('Invalid template');     │
│       }                                                     │
│                                                             │
│       // Delegate to repository                            │
│       const portfolio = await this.portfolioRepo.create({  │
│         userId,                                            │
│         ...portfolioData,                                  │
│         template,                                          │
│         isPublished: false,                                │
│         viewCount: 0                                       │
│       });                                                   │
│                                                             │
│       logger.info('Portfolio created', {                   │
│         portfolioId: portfolio._id                         │
│       });                                                   │
│                                                             │
│       return portfolio;                                    │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  7. REPOSITORY LAYER (PortfolioRepository.js)               │
│     async create(portfolioData) {                          │
│       logger.database('create', 'portfolios', {            │
│         userId: portfolioData.userId                       │
│       });                                                   │
│                                                             │
│       return await Portfolio.create(portfolioData);        │
│     }                                                       │
│                                                             │
│     Database operations only - no business logic           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  8. MONGOOSE MODEL (Portfolio.js)                           │
│     • Apply schema validation                              │
│     • Run pre-save hooks                                   │
│     • Generate _id: ObjectId("507f1f77bcf86cd799439011")  │
│     • Set timestamps: createdAt, updatedAt                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  9. MONGODB DATABASE                                        │
│     • Insert document into portfolios collection           │
│     • Apply indexes                                        │
│     • Return saved document                                │
│                                                             │
│     Saved:                                                  │
│     {                                                       │
│       _id: "507f1f77bcf86cd799439011",                    │
│       userId: "507f191e810c19729de860ea",                 │
│       title: "My Portfolio",                              │
│       description: "My work",                             │
│       template: "echelon",                                │
│       content: { ... },                                   │
│       isPublished: false,                                 │
│       viewCount: 0,                                       │
│       createdAt: "2025-11-14T12:34:56.789Z",             │
│       updatedAt: "2025-11-14T12:34:56.789Z"              │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  10. RESPONSE FLOW BACK                                     │
│      Repository returns portfolio document                 │
│      ↓                                                      │
│      Service returns portfolio                             │
│      ↓                                                      │
│      Controller formats with responseFormatter             │
│      ↓                                                      │
│      HTTP response sent to client                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  11. HTTP RESPONSE                                          │
│      Status: 201 Created                                   │
│      Headers:                                               │
│        Content-Type: application/json                      │
│      Body:                                                  │
│      {                                                      │
│        "success": true,                                    │
│        "message": "Portfolio created successfully",        │
│        "data": {                                           │
│          "portfolio": {                                    │
│            "_id": "507f1f77bcf86cd799439011",             │
│            "userId": "507f191e810c19729de860ea",          │
│            "title": "My Portfolio",                       │
│            "description": "My work",                      │
│            "template": "echelon",                         │
│            "content": { ... },                            │
│            "isPublished": false,                          │
│            "viewCount": 0,                                │
│            "createdAt": "2025-11-14T12:34:56.789Z",      │
│            "updatedAt": "2025-11-14T12:34:56.789Z"       │
│          }                                                  │
│        }                                                    │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  12. LOGS GENERATED                                         │
│      [DEBUG] PortfolioService.createPortfolio              │
│        userId: "507f191e810c19729de860ea"                 │
│                                                             │
│      [DEBUG] Database read - portfolios                    │
│        userId: "507f191e810c19729de860ea"                 │
│                                                             │
│      [DEBUG] Database read - users                         │
│        userId: "507f191e810c19729de860ea"                 │
│                                                             │
│      [DEBUG] Database create - portfolios                  │
│        userId: "507f191e810c19729de860ea"                 │
│                                                             │
│      [INFO] Portfolio created                              │
│        portfolioId: "507f1f77bcf86cd799439011"            │
│        userId: "507f191e810c19729de860ea"                 │
│                                                             │
│      All sensitive data automatically redacted             │
└─────────────────────────────────────────────────────────────┘
```

**Total Request Time**: ~100-200ms
- Middleware: ~10ms
- Service logic: ~20ms
- Database operations: ~50-100ms
- Response formatting: ~5ms

---

## 14. File Organization

### 14.1 Current Structure

```
AUREA---Backend/
├── src/                          # Clean Architecture (80% refactored)
│   ├── api/
│   │   ├── controllers/ (10)     # 1,598 lines (63% reduction)
│   │   ├── routes/ (9)           # 65+ endpoints
│   │   └── middleware/ (11)      # Auth, validation, rate limiting
│   │
│   ├── core/                     # Business logic & data access
│   │   ├── services/ (11)        # 3,622 lines of business rules
│   │   └── repositories/ (6)     # Data access abstraction
│   │
│   ├── shared/                   # Cross-cutting concerns
│   │   ├── constants/            # HTTP status, error codes
│   │   ├── exceptions/ (6)       # Custom error classes
│   │   └── utils/                # Response formatter
│   │
│   ├── infrastructure/           # External services
│   │   ├── logging/              # Structured logger (252 lines)
│   │   ├── cache/                # Redis integration
│   │   └── pdf/                  # Browser pool management
│   │
│   ├── config/                   # Centralized configuration
│   │   ├── index.js              # 100% centralized config
│   │   ├── database.js           # MongoDB connection
│   │   ├── cloudinary.js         # Cloudinary init
│   │   └── envValidator.js       # Env validation
│   │
│   ├── models/ (5)               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Template.js
│   │   ├── CaseStudy.js
│   │   └── Site.js
│   │
│   └── utils/                    # Helper utilities
│       ├── cache.js              # Redis wrapper
│       ├── slugGenerator.js
│       ├── subdomainValidator.js
│       └── templateValidator.js
│
├── services/                     # Legacy root-level (20% remaining)
│   ├── templateConvert.js        # HTML generation (1,504 lines)
│   ├── pdfGenerationService.js   # PDF generation (607 lines)
│   └── deploymentService.js      # Vercel API (483 lines)
│
├── generated-files/              # Published portfolio HTML
│   └── {subdomain}/
│       ├── index.html
│       └── case-study-{id}.html
│
├── docs/                         # Extensive documentation (13+ files)
│   ├── NEW_ARCHITECTURE_WALKTHROUGH.md
│   ├── NEW_DEVELOPER_ONBOARDING.md (40 pages)
│   ├── REFACTORING_PROGRESS.md
│   ├── SYSTEM_ARCHITECTURE.md (this file)
│   └── ... (9 more guides)
│
├── test/                         # Test suites
│   ├── test-user-profile-crud.js (9 tests)
│   ├── test-custom-subdomain.js (7 tests)
│   └── ... (6 more test files)
│
├── scripts/                      # Admin utilities
│   ├── upgrade-user-to-premium.js
│   ├── debug-login.js
│   ├── create-test-user.js
│   └── clear-brute-force.js
│
├── seeds/                        # Database seeders
│   ├── templateSeeds.js
│   └── migratePortfolios.js
│
├── server.js                     # Application entry point
├── package.json                  # Dependencies
├── swagger.yaml                  # API docs (144k+ lines)
├── .env                          # Environment variables (gitignored)
└── .env.example                  # Environment template
```

### 14.2 Why Root-Level Services Exist

The 3 legacy services in root-level `services/` (2,594 lines total) are:

1. **templateConvert.js** (1,504 lines)
   - Complex HTML generation with template logic
   - 4 template types: Echelon, Serene, Chic, BoldFolio
   - Inline CSS, responsive design
   - Case study HTML generation

2. **pdfGenerationService.js** (607 lines)
   - Puppeteer browser management
   - PDF generation from HTML
   - Template-aware rendering

3. **deploymentService.js** (483 lines)
   - Vercel API integration
   - Project creation and deployment
   - Environment variable management

**Status**: These services are **functional and working well**. Migration to Clean Architecture is optional future enhancement (Phase 10).

**Why Not Migrated Yet**:
- Large, complex files requiring careful refactoring
- Working correctly with no bugs
- Low priority (20% of remaining work)
- Would require breaking into multiple smaller services

---

## 15. Performance Optimizations

### 15.1 Database Optimizations

**Strategic Indexing**:
```javascript
// Portfolio indexes
{ userId: 1, createdAt: -1 }     // User portfolio listing (most common query)
{ isPublished: 1, publishedAt: -1 } // Public portfolio queries
{ userId: 1, isPublished: 1 }    // User's published portfolios
{ slug: 1 }                      // Unique sparse for SEO URLs

// User indexes
{ email: 1 }                     // Login queries (unique)

// Site indexes
{ subdomain: 1 }                 // Subdomain lookups (unique sparse)
{ portfolioId: 1 }               // Portfolio-to-site relationship (unique)
{ userId: 1 }                    // User site queries

// CaseStudy indexes
{ portfolioId: 1, projectId: 1 } // Compound unique for case study lookups
```

**Query Optimization**:
- Use `.select()` to limit returned fields
- Use `.lean()` for read-only queries (skip Mongoose hydration)
- Use `.populate()` selectively (only when needed)
- Pagination for large result sets

### 15.2 Caching Strategy

**Redis Caching** (optional with graceful degradation):

```javascript
// Public portfolios: 5-10 min TTL
const cacheKey = `portfolio:public:${slug}`;
const cached = await cache.get(cacheKey);
if (cached) return JSON.parse(cached);

const portfolio = await Portfolio.findOne({ slug, isPublished: true });
await cache.set(cacheKey, JSON.stringify(portfolio), 600); // 10 min

// PDF generation: Cache by content hash
const cacheKey = `pdf:${portfolioId}:${contentHash}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const pdf = await generatePDF(portfolioId);
await cache.set(cacheKey, pdf, 3600); // 1 hour
```

**Cache Invalidation**:
- Update/delete portfolio → Invalidate public cache
- Publish/unpublish → Invalidate public cache
- User data → No caching (always fresh)

### 15.3 Browser Pooling

**Puppeteer Browser Pool** (src/infrastructure/pdf/BrowserPool.js):

Benefits:
- **Reuse browsers**: Launching browser is expensive (~2-5s)
- **Limit concurrency**: Max 3 concurrent generations
- **Prevent memory leaks**: Close idle browsers
- **Queue requests**: Handle bursts gracefully

Performance Impact:
- Without pooling: 5-10s per PDF
- With pooling: 1-2s per PDF (after first)

### 15.4 Compression

**Response Compression**:
```javascript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    // Compress text responses (JSON, HTML)
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6 // Compression level (1-9, higher = better compression but slower)
}));
```

**Bandwidth Savings**: 60-80% for JSON responses

### 15.5 Rate Limiting Benefits

**Performance Protection**:
- Prevents abuse/DoS
- Protects database from overload
- Ensures fair resource distribution
- Improves overall system stability

### 15.6 Lazy Loading

**Template Schemas**:
- Loaded on demand (not all at startup)
- Cached after first load
- Reduces initial memory footprint

**Dynamic Imports**:
```javascript
// Only load PDF generation when needed
if (req.path.includes('/pdf/')) {
  const pdfService = await import('./services/pdfGenerationService.js');
  // Use pdfService
}
```

---

## 16. Key Architectural Decisions

### 16.1 Why Clean Architecture?

**Problem**: Original MVC codebase had:
- Fat controllers (500-1,300 lines each)
- Business logic mixed with HTTP concerns
- Direct database access in controllers
- Hard to test
- Difficult to maintain

**Solution**: Clean Architecture provides:
- **Separation of Concerns**: Each layer has single responsibility
- **Testability**: Business logic isolated and mockable
- **Maintainability**: Changes localized to specific layers
- **Scalability**: Easy to add features without modifying existing code
- **Reusability**: Services can be used by multiple controllers or entry points

**Results**:
- 63% reduction in controller code (2,499 → 1,598 lines)
- Business logic in testable services
- Consistent patterns across codebase
- Onboarding time reduced by ~40%

### 16.2 Why Thin Controllers?

**Philosophy**: Controllers should be **"dumb" HTTP handlers**

**Benefits**:
1. **Easy to Test**: Just test req/res handling
2. **Reusable Logic**: Services can be used by CLI, cron jobs, other entry points
3. **Consistent**: All controllers follow same 4-line pattern
4. **Readable**: Clear what each controller does

**Pattern**:
```javascript
export const method = async (req, res, next) => {
  try {
    const data = extractDataFromRequest(req);      // 1 line
    const result = await service.method(data);     // 1 line
    return responseFormatter.success(res, result); // 1 line
  } catch (error) {
    next(error);                                   // 1 line
  }
};
```

### 16.3 Why Custom Exceptions?

**Problem**: Inconsistent error handling
- Some code returned errors: `return { error: 'Not found' }`
- Some threw errors: `throw new Error('Not found')`
- HTTP status codes scattered everywhere
- Hard to map errors to HTTP responses

**Solution**: Custom exception classes with automatic HTTP mapping

**Benefits**:
1. **Automatic HTTP Status**: Exception knows its own status code
2. **Rich Context**: Include field names, resource IDs, etc.
3. **Type Safety**: Can catch specific exception types
4. **Consistent Responses**: All errors formatted same way
5. **Static Factories**: `NotFoundError.resource('Portfolio', id)`

**Example**:
```javascript
// Service throws exception
throw NotFoundError.resource('Portfolio', portfolioId);

// Error middleware catches and converts
res.status(404).json({
  success: false,
  message: 'Portfolio with ID 507f1f77... not found',
  code: 'NOT_FOUND'
});
```

### 16.4 Why Structured Logging?

**Problem**: `console.log` everywhere
- Hard to search
- No context
- Sensitive data exposed
- Can't filter by level

**Solution**: Structured JSON logging with automatic sanitization

**Benefits**:
1. **Searchable**: JSON logs easy to query
2. **Contextual**: Include userId, portfolioId, etc.
3. **Secure**: Automatic sensitive data redaction
4. **Filterable**: Log levels (error, warn, info, debug)
5. **Integration**: Works with ELK, Datadog, etc.

**Example**:
```javascript
// Before
console.log('Portfolio created:', portfolio);

// After
logger.info('Portfolio created', { portfolioId: portfolio._id, userId });
```

### 16.5 Why Centralized Config?

**Problem**: `process.env` scattered across 50+ files
- Hard to find what env vars are needed
- No type conversion
- No validation
- No defaults

**Solution**: Single config object with getters

**Benefits**:
1. **Single Source of Truth**: All config in one place
2. **Type Conversion**: Automatic parseInt, parseFloat
3. **Validation**: Can validate on access
4. **Defaults**: Fallback values
5. **Documentation**: Config structure self-documents
6. **Testability**: Easy to mock

**Example**:
```javascript
// Before
const port = parseInt(process.env.PORT || '5000', 10);

// After
const port = config.app.port;
```

### 16.6 Why Repository Pattern?

**Problem**: Services directly accessing Mongoose models
- Hard to test (can't mock database)
- Tight coupling to Mongoose
- Hard to switch databases

**Solution**: Repository layer abstracts data access

**Benefits**:
1. **Testability**: Mock repositories in tests
2. **Database Agnostic**: Could switch to PostgreSQL
3. **Query Optimization**: Centralize query logic
4. **Logging**: All DB operations logged
5. **Flexibility**: Easy to add caching

**Example**:
```javascript
// Before (Service)
const portfolio = await Portfolio.findById(id);

// After (Service → Repository)
const portfolio = await this.portfolioRepo.findById(id);
```

### 16.7 Why Endpoint-Specific Rate Limits?

**Problem**: One-size-fits-all rate limiting
- Too restrictive for reads
- Too permissive for writes
- Doesn't account for resource cost

**Solution**: Different limits per endpoint type

**Benefits**:
1. **Flexible**: Reads get higher limits
2. **Secure**: Writes more restricted
3. **Fair**: Users can browse but not abuse
4. **Resource Protection**: Expensive operations limited

**Strategy**:
- Reads (public): 100/min
- Writes (create, update): 5-30/min
- Validation checks: 10/min

### 16.8 Why Optional Redis?

**Problem**: Hard Redis dependency
- Server won't start without Redis
- Development requires Redis setup
- Deployment complexity

**Solution**: Graceful degradation

**Benefits**:
1. **Development**: Work without Redis
2. **Deployment**: Can deploy without Redis
3. **Resilience**: Server continues if Redis fails
4. **Performance**: Use Redis when available

**Trade-off**: Slightly slower without cache, but still functional

### 16.9 Why Browser Pool?

**Problem**: Creating new browser for each PDF
- Slow (2-5s to launch)
- Memory intensive
- Can't handle concurrent requests

**Solution**: Reuse browser instances

**Benefits**:
1. **Speed**: 5x faster PDF generation
2. **Concurrency**: Handle multiple requests
3. **Resource Management**: Limit max browsers
4. **Memory**: Cleanup idle browsers

**Performance**: 5-10s → 1-2s per PDF

---

## Conclusion

AUREA Backend implements a **production-ready Clean Architecture** at **80% completion**, providing:

- **Clear separation of concerns** across 6 architectural layers
- **Thin controllers** delegating to services (average < 160 lines)
- **Business logic** isolated in 11 services (3,622 lines)
- **Data access** abstracted through 6 repositories
- **Comprehensive security** with 6 protection layers
- **Structured logging** with automatic sanitization
- **Centralized configuration** for all environment variables
- **Custom exceptions** with HTTP status mapping
- **Performance optimizations** via caching, indexing, and pooling
- **65+ API endpoints** across 9 route files
- **Extensive documentation** (100+ pages across 13 files)

The architecture provides a **solid foundation** for scalable, maintainable, and testable code with clear patterns that new developers can quickly understand and follow.

**Remaining 20%**: Optional migration of 3 legacy root-level services (2,594 lines) to Clean Architecture - currently functional and not blocking.

---

**Document Version**: 1.0.0
**Last Updated**: November 14, 2025
**Author**: AUREA Development Team
**Status**: Complete ✅
