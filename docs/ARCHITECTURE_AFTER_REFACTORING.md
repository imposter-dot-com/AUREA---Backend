# AUREA Backend Architecture - After 100% Refactoring
## Clean Architecture Implementation - Final State

**Document Version:** 1.0
**Target Completion:** October 2025
**Architecture Pattern:** Clean Architecture with Service/Repository Layers
**Current Status:** 40% Complete → Target: 100% Complete

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer Breakdown](#layer-breakdown)
3. [Request Flow](#request-flow)
4. [Directory Structure](#directory-structure)
5. [All Services & Repositories](#all-services--repositories)
6. [Controller Mapping](#controller-mapping)
7. [Data Model Relationships](#data-model-relationships)
8. [Middleware Pipeline](#middleware-pipeline)
9. [Error Handling Flow](#error-handling-flow)
10. [Logging Architecture](#logging-architecture)
11. [Configuration Management](#configuration-management)
12. [Testing Strategy](#testing-strategy)

---

## 🏗️ Architecture Overview

### Clean Architecture Principles

The AUREA backend follows Clean Architecture with clear separation of concerns across multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  (Routes, Controllers, Middleware - HTTP Concerns Only)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                        Core Layer                           │
│    (Services - Business Logic, Repositories - Data Access)  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│     (Logging, Database, External Services - Cloudinary,     │
│              Redis, Vercel, Gemini AI)                      │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                     Shared Layer                            │
│  (Constants, Utils, Exceptions, DTOs - Used by All Layers)  │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   Configuration Layer                       │
│    (Environment Validation, Centralized Config Object)      │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Thin Controllers** - Controllers handle only HTTP concerns (request/response)
2. **Fat Services** - Services contain all business logic
3. **Dumb Repositories** - Repositories handle only data access, no business logic
4. **Smart Exceptions** - Custom exception classes with rich error context
5. **Structured Logging** - Contextual logging with automatic sanitization
6. **Centralized Configuration** - Single source of truth for all config
7. **Dependency Injection** - Services receive repositories via constructor
8. **Testability First** - All business logic testable in isolation

---

## 🎯 Layer Breakdown

### 1. API Layer

**Responsibility:** Handle HTTP requests and responses

**Components:**
- **Routes** (src/routes/) - Define API endpoints
- **Controllers** (src/controllers/) - HTTP request/response handling
- **Middleware** (src/middleware/) - Request processing pipeline

**Rules:**
- ✅ Controllers must be thin (< 300 lines, ideally < 200)
- ✅ Each controller method should be < 15 lines
- ✅ Controllers call services, never access models directly
- ✅ Use responseFormatter for all responses
- ✅ Pass errors to next() middleware
- ❌ No business logic in controllers
- ❌ No database queries in controllers
- ❌ No direct Model imports

**Example Controller (Thin Pattern):**
```javascript
import siteService from '../core/services/SiteService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

export const publishToSubdomain = async (req, res, next) => {
  try {
    const { portfolioId } = req.params;
    const { customSubdomain } = req.body;

    const site = await siteService.publishToSubdomain(
      portfolioId,
      req.user._id,
      customSubdomain
    );

    return responseFormatter.success(
      res,
      { site },
      'Portfolio published successfully'
    );
  } catch (error) {
    next(error);
  }
};
```

---

### 2. Core Layer

**Responsibility:** Business logic and data access

**Components:**
- **Services** (src/core/services/) - Business logic orchestration
- **Repositories** (src/core/repositories/) - Data access abstraction

#### 2.1 Services (Business Logic)

**Rules:**
- ✅ Contains all business logic
- ✅ Orchestrates multiple repositories
- ✅ Validates business rules
- ✅ Throws custom exceptions
- ✅ Uses logger for operations
- ✅ Testable with mocked repositories
- ❌ No HTTP concerns (no req/res)
- ❌ No direct database access (use repositories)

**Example Service:**
```javascript
import siteRepository from '../repositories/SiteRepository.js';
import portfolioRepository from '../repositories/PortfolioRepository.js';
import subdomainService from './SubdomainService.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ConflictError } from '../../shared/exceptions/index.js';

export class SiteService {
  constructor(
    siteRepo = siteRepository,
    portfolioRepo = portfolioRepository,
    subdomainSvc = subdomainService
  ) {
    this.siteRepository = siteRepo;
    this.portfolioRepository = portfolioRepo;
    this.subdomainService = subdomainSvc;
  }

  async publishToSubdomain(portfolioId, userId, customSubdomain) {
    logger.service('SiteService', 'publishToSubdomain', { portfolioId, userId });

    // Business Logic: Get portfolio with ownership check
    const portfolio = await this.portfolioRepository.findByIdAndUserId(
      portfolioId,
      userId
    );

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Business Logic: Generate or validate subdomain
    const subdomain = customSubdomain ||
      await this.subdomainService.generateFromPortfolio(portfolio);

    // Business Logic: Check availability
    const isAvailable = await this.subdomainService.checkAvailability(
      subdomain,
      userId
    );

    if (!isAvailable) {
      throw ConflictError.slugTaken(subdomain);
    }

    // Business Logic: Generate HTML files
    const htmlFiles = await this.generateHTML(portfolio);

    // Data Access: Save site record
    const site = await this.siteRepository.create({
      portfolioId,
      userId,
      subdomain,
      deploymentType: 'subdomain',
      status: 'published'
    });

    logger.info('Site published to subdomain', { siteId: site._id, subdomain });

    return site;
  }
}

export default new SiteService();
```

#### 2.2 Repositories (Data Access)

**Rules:**
- ✅ Contains only database operations
- ✅ Returns plain data (models)
- ✅ Uses logger for database operations
- ✅ Mockable for service testing
- ❌ No business logic
- ❌ No validation (services do that)
- ❌ No error handling beyond database errors

**Example Repository:**
```javascript
import Site from '../../models/Site.js';
import logger from '../../infrastructure/logging/Logger.js';

export class SiteRepository {
  async create(data) {
    logger.database('create', 'sites', { userId: data.userId });
    return await Site.create(data);
  }

  async findBySubdomain(subdomain) {
    logger.database('findBySubdomain', 'sites', { subdomain });
    return await Site.findOne({ subdomain });
  }

  async findByPortfolioId(portfolioId) {
    logger.database('findByPortfolioId', 'sites', { portfolioId });
    return await Site.findOne({ portfolioId });
  }

  async update(id, data) {
    logger.database('update', 'sites', { id });
    return await Site.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    logger.database('delete', 'sites', { id });
    return await Site.findByIdAndDelete(id);
  }

  async subdomainExists(subdomain, excludeUserId) {
    logger.database('subdomainExists', 'sites', { subdomain });
    const query = { subdomain };
    if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
    }
    return await Site.exists(query);
  }
}

export default new SiteRepository();
```

---

### 3. Infrastructure Layer

**Responsibility:** External concerns and technical capabilities

**Components:**
- **Logging** (src/infrastructure/logging/) - Structured logging system
- **Database** (src/config/database.js) - MongoDB connection
- **External Services** - Cloudinary, Redis, Vercel, Gemini AI integrations

**Example Logging Usage:**
```javascript
import logger from '../../infrastructure/logging/Logger.js';

// Service operations
logger.service('UserService', 'createUser', { email: 'user@example.com' });

// Database operations
logger.database('create', 'users', { email: 'user@example.com' });

// Authentication events
logger.auth('login', userId, { ip: req.ip, userAgent: req.headers['user-agent'] });

// External API calls
logger.externalApi('Cloudinary', '/upload', 200, 1250);

// General logging
logger.info('Operation completed', { context });
logger.error('Operation failed', { error, context });
logger.warn('Deprecation warning', { feature });
logger.debug('Debugging info', { data });
```

---

### 4. Shared Layer

**Responsibility:** Code shared across all layers

**Components:**
- **Constants** (src/shared/constants/) - HTTP status codes, error codes
- **Utils** (src/shared/utils/) - Response formatter, helpers
- **Exceptions** (src/shared/exceptions/) - Custom error classes
- **DTOs** (src/shared/dtos/) - Data Transfer Objects (future)

**Example Exception Usage:**
```javascript
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError
} from '../../shared/exceptions/index.js';

// Not found
throw NotFoundError.resource('Portfolio', portfolioId);

// Validation
throw new ValidationError('Invalid email format');

// Forbidden
throw ForbiddenError.ownershipRequired('portfolio');
throw ForbiddenError.premiumRequired();

// Conflict
throw ConflictError.slugTaken(slug);
throw ConflictError.duplicate('User', 'email');

// Unauthorized
throw UnauthorizedError.invalidToken();
throw UnauthorizedError.expiredToken();
```

---

### 5. Configuration Layer

**Responsibility:** Environment configuration and validation

**Components:**
- **Config** (src/config/index.js) - Centralized configuration object
- **Env Validator** (src/config/envValidator.js) - Environment validation

**Example Configuration Usage:**
```javascript
import config from '../config/index.js';

// App config
const port = config.app.port;
const isDev = config.app.isDevelopment;
const isProduction = config.app.isProduction;

// Database
const mongoUri = config.database.uri;

// Authentication
const jwtSecret = config.auth.jwtSecret;
const jwtExpiration = config.auth.jwtExpiration;

// External services
const cloudinaryName = config.cloudinary.cloudName;
const vercelToken = config.vercel.token;
const redisEnabled = config.redis.enabled;

// Rate limits
const rateLimitGeneral = config.rateLimit.general.max;

// File upload
const maxFileSize = config.upload.maxSize;
```

---

## 🔄 Request Flow

### Complete Request Journey

```
1. HTTP Request
   ↓
2. Express Server
   ↓
3. Security Middleware (Helmet, CORS)
   ↓
4. Body Parser Middleware
   ↓
5. Request Logger Middleware
   ↓
6. Rate Limiter Middleware
   ↓
7. Route Handler
   ↓
8. Route-Specific Middleware
   │
   ├─→ Authentication Middleware (auth.js)
   │   ↓
   ├─→ Validation Middleware (validation.js)
   │   ↓
   └─→ Ownership Middleware (ownership.js)
   ↓
9. Controller (HTTP Layer)
   │  - Parse request
   │  - Call service
   ↓
10. Service (Business Logic Layer)
    │  - Validate business rules
    │  - Call repositories
    │  - Orchestrate operations
    ↓
11. Repository (Data Access Layer)
    │  - Query database
    │  - Return models
    ↓
12. Database (MongoDB)
    ↓
13. Repository returns data
    ↓
14. Service processes and returns
    ↓
15. Controller formats response
    │  - Use responseFormatter
    ↓
16. Response Middleware
    ↓
17. HTTP Response to Client
```

### Error Flow

```
Error occurs in:
- Repository (database error)
- Service (business logic error)
- Controller (unexpected error)
  ↓
Exception thrown (custom exception class)
  ↓
next(error) in controller
  ↓
Error Handler Middleware
  │  - Check if operational error
  │  - Log error with context
  │  - Format error response
  │  - Map to HTTP status
  ↓
HTTP Error Response to Client
```

---

## 📂 Directory Structure (Final State)

```
AUREA---Backend/
├── server.js                         # Application entry point
├── package.json                      # Dependencies
├── .env                              # Environment variables
│
├── src/
│   │
│   ├── api/                          # API Layer (HTTP Concerns)
│   │   ├── routes/                   # Route definitions (9 files)
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── portfolioRoutes.js
│   │   │   ├── templateRoutes.js
│   │   │   ├── caseStudyRoutes.js
│   │   │   ├── siteRoutes.js
│   │   │   ├── pdfRoutes.js
│   │   │   ├── uploadRoutes.js
│   │   │   └── proposalExtract.routes.js
│   │   │
│   │   ├── controllers/              # HTTP handlers (10 files, all thin)
│   │   │   ├── authController.js     # ✅ Refactored (103 lines)
│   │   │   ├── portfolioController.js # ✅ Refactored (162 lines)
│   │   │   ├── userController.js     # ✅ Refactored (~150 lines)
│   │   │   ├── siteController.js     # ✅ Refactored (~200 lines)
│   │   │   ├── caseStudyController.js # ✅ Refactored (~120 lines)
│   │   │   ├── templateController.js # ✅ Refactored (~150 lines)
│   │   │   ├── pdfExportController.js # ✅ Refactored (~150 lines)
│   │   │   ├── uploadController.js   # ✅ Refactored (~80 lines)
│   │   │   ├── proposalExtract.controller.js # ✅ Refactored (~150 lines)
│   │   │   └── proposalExtract.genai.controller.js # ✅ Refactored (~150 lines)
│   │   │
│   │   └── middleware/               # Request processing (10 files)
│   │       ├── auth.js               # JWT authentication
│   │       ├── ownership.js          # Resource ownership verification
│   │       ├── validation.js         # Input validation
│   │       ├── errorHandler.js       # ✅ Updated for exceptions
│   │       ├── rateLimiter.js        # Rate limiting
│   │       ├── requestLogger.js      # Request logging
│   │       ├── upload.js             # Multer configuration
│   │       ├── logSanitizer.js       # Log sanitization
│   │       ├── bruteForcePrevention.js # Brute force protection
│   │       └── premium.js            # Premium feature checks
│   │
│   ├── core/                         # Core Layer (Business Logic & Data Access)
│   │   ├── services/                 # Business logic (8+ services)
│   │   │   ├── AuthService.js        # ✅ Created (282 lines)
│   │   │   ├── PortfolioService.js   # ✅ Created (434 lines)
│   │   │   ├── UserService.js        # ✅ Created (~400 lines)
│   │   │   ├── PremiumService.js     # ✅ Created (~200 lines)
│   │   │   ├── SiteService.js        # ✅ Created (~500 lines)
│   │   │   ├── SubdomainService.js   # ✅ Created (~200 lines)
│   │   │   ├── CaseStudyService.js   # ✅ Created (~250 lines)
│   │   │   ├── TemplateService.js    # ✅ Created (~400 lines)
│   │   │   ├── PdfService.js         # ✅ Created (~300 lines)
│   │   │   ├── ImageService.js       # ✅ Created (~150 lines)
│   │   │   └── ProposalService.js    # ✅ Created (~400 lines)
│   │   │
│   │   └── repositories/             # Data access (5 repositories)
│   │       ├── UserRepository.js     # ✅ Created (239 lines)
│   │       ├── PortfolioRepository.js # ✅ Created (229 lines)
│   │       ├── SiteRepository.js     # ✅ Created (~250 lines)
│   │       ├── CaseStudyRepository.js # ✅ Created (~200 lines)
│   │       └── TemplateRepository.js # ✅ Created (~250 lines)
│   │
│   ├── infrastructure/               # Infrastructure Layer (External Concerns)
│   │   └── logging/
│   │       └── Logger.js             # ✅ Structured logging (300+ lines)
│   │
│   ├── shared/                       # Shared Layer (Used by All)
│   │   ├── constants/
│   │   │   ├── httpStatus.js         # ✅ HTTP status codes
│   │   │   └── errorCodes.js         # ✅ Application error codes
│   │   │
│   │   ├── utils/
│   │   │   └── responseFormatter.js  # ✅ Response formatter (280 lines)
│   │   │
│   │   └── exceptions/               # Custom exception classes (6 types)
│   │       ├── ApplicationError.js   # ✅ Base exception class
│   │       ├── ValidationError.js    # ✅ 400 validation errors
│   │       ├── NotFoundError.js      # ✅ 404 not found errors
│   │       ├── UnauthorizedError.js  # ✅ 401 auth errors
│   │       ├── ForbiddenError.js     # ✅ 403 permission errors
│   │       ├── ConflictError.js      # ✅ 409 conflict errors
│   │       └── index.js              # ✅ Central export
│   │
│   ├── config/                       # Configuration Layer
│   │   ├── index.js                  # ✅ Centralized config (350+ lines)
│   │   ├── envValidator.js           # ✅ Environment validation (200+ lines)
│   │   ├── database.js               # MongoDB connection
│   │   ├── cloudinary.js             # Cloudinary initialization
│   │   ├── swagger.js                # Swagger UI setup
│   │   └── templateRegistry.js       # Template registration
│   │
│   ├── models/                       # Mongoose models (5 models)
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Template.js
│   │   ├── CaseStudy.js
│   │   └── Site.js
│   │
│   └── utils/                        # Utilities (4 utils)
│       ├── cache.js
│       ├── slugGenerator.js
│       ├── subdomainValidator.js
│       └── templateValidator.js
│
├── services/                         # Root-level services (modularized)
│   ├── templateConvert/              # ✅ Modularized (1,452 lines → modules)
│   │   ├── index.js                  # Main orchestrator (~200 lines)
│   │   ├── generators/               # Template-specific generators
│   │   │   ├── EchelonGenerator.js   # ~150 lines
│   │   │   ├── SereneGenerator.js    # ~150 lines
│   │   │   ├── ChicGenerator.js      # ~150 lines
│   │   │   ├── BoldFolioGenerator.js # ~150 lines
│   │   │   └── [additional templates...]
│   │   ├── CaseStudyGenerator.js     # ~200 lines
│   │   ├── StyleGenerator.js         # ~150 lines
│   │   └── FallbackHelper.js         # ~100 lines
│   │
│   ├── deployment/                   # ✅ Modularized (483 lines → modules)
│   │   ├── index.js                  # Main orchestrator (~150 lines)
│   │   ├── VercelClient.js           # Vercel API wrapper (~100 lines)
│   │   ├── FileGenerator.js          # File creation (~100 lines)
│   │   ├── DeploymentValidator.js    # Validation (~80 lines)
│   │   └── DeploymentLogger.js       # Activity logging (~50 lines)
│   │
│   └── pdf/                          # ✅ Modularized (520 lines → modules)
│       ├── index.js                  # Main service (~150 lines)
│       ├── PortfolioPdfGenerator.js  # Portfolio PDFs (~150 lines)
│       ├── CaseStudyPdfGenerator.js  # Case study PDFs (~100 lines)
│       ├── TemplateRenderer.js       # Template rendering (~100 lines)
│       └── PdfCleanup.js             # File cleanup (~20 lines)
│
├── test/                             # Test suites
│   ├── test-user-profile-crud.js     # 9 user tests
│   ├── test-custom-subdomain.js      # 7 subdomain tests
│   ├── test-vercel-deployment-improved.js
│   ├── test-template-system.js
│   ├── test-publish-flow.js
│   └── test-frontend-integration.js
│
├── scripts/                          # Admin utilities
│   ├── upgrade-user-to-premium.js
│   └── archive/                      # ✅ Archived migrations
│       ├── fix-template-sections-direct.js
│       └── fix-template-sections.js
│
├── generated-files/                  # Published portfolio HTML files
│   └── {subdomain}/
│       ├── index.html
│       └── case-study-{projectId}.html
│
└── uploads/                          # Temporary file uploads
    └── pdfs/

```

---

## 📦 All Services & Repositories

### Complete Service Layer (11 Services)

| Service | Lines | Responsibility | Status |
|---------|-------|----------------|--------|
| **AuthService** | 282 | Authentication, token management, password changes | ✅ Created |
| **PortfolioService** | 434 | Portfolio CRUD, publishing, statistics | ✅ Created |
| **UserService** | ~400 | User management, profile updates, admin operations | ✅ Created |
| **PremiumService** | ~200 | Premium tier management, feature access | ✅ Created |
| **SiteService** | ~500 | Publishing (subdomain/Vercel), HTML generation | ✅ Created |
| **SubdomainService** | ~200 | Subdomain generation, validation, availability | ✅ Created |
| **CaseStudyService** | ~250 | Case study CRUD, project validation | ✅ Created |
| **TemplateService** | ~400 | Template management, validation, ratings | ✅ Created |
| **PdfService** | ~300 | PDF generation orchestration, cleanup | ✅ Created |
| **ImageService** | ~150 | Image upload, optimization, Cloudinary integration | ✅ Created |
| **ProposalService** | ~400 | AI-powered PDF extraction, Gemini integration | ✅ Created |

**Total:** 11 services, ~3,516 lines of business logic

---

### Complete Repository Layer (5 Repositories)

| Repository | Lines | Responsibility | Status |
|------------|-------|----------------|--------|
| **UserRepository** | 239 | User CRUD, authentication queries, premium checks | ✅ Created |
| **PortfolioRepository** | 229 | Portfolio CRUD, slug queries, statistics | ✅ Created |
| **SiteRepository** | ~250 | Site CRUD, subdomain queries, deployment tracking | ✅ Created |
| **CaseStudyRepository** | ~200 | Case study CRUD, portfolio associations | ✅ Created |
| **TemplateRepository** | ~250 | Template CRUD, category queries, ratings | ✅ Created |

**Total:** 5 repositories, ~1,168 lines of data access logic

---

## 🎮 Controller Mapping

### All Controllers (10 Total)

| Controller | Before | After | Reduction | Services Used | Status |
|------------|--------|-------|-----------|---------------|--------|
| **authController** | 170 | 103 | 40% | AuthService | ✅ Refactored |
| **portfolioController** | 693 | 162 | 76% | PortfolioService | ✅ Refactored |
| **siteController** | 1,293 | ~200 | 85% | SiteService, SubdomainService | ✅ Refactored |
| **userController** | 782 | ~150 | 81% | UserService, PremiumService | ✅ Refactored |
| **caseStudyController** | 308 | ~120 | 61% | CaseStudyService | ✅ Refactored |
| **templateController** | 505 | ~150 | 70% | TemplateService | ✅ Refactored |
| **pdfExportController** | 414 | ~150 | 64% | PdfService | ✅ Refactored |
| **uploadController** | 169 | ~80 | 53% | ImageService | ✅ Refactored |
| **proposalExtract.controller** | 558 | ~150 | 73% | ProposalService | ✅ Refactored |
| **proposalExtract.genai.controller** | 470 | ~150 | 68% | ProposalService | ✅ Refactored |

**Totals:**
- **Before:** 5,362 lines
- **After:** ~1,465 lines
- **Reduction:** 73% average reduction
- **Business logic extracted:** ~3,897 lines moved to services

---

## 🔗 Data Model Relationships

### Database Schema

```
┌──────────────┐
│     User     │
│              │
│ - email      │
│ - password   │
│ - isPremium  │
│ - role       │
└──────┬───────┘
       │ 1
       │
       │ *
       │
┌──────┴────────┐        ┌──────────────┐
│   Portfolio   │ * ───1 │   Template   │
│               │        │              │
│ - title       │        │ - name       │
│ - content     │        │ - schema     │
│ - template    │        │ - version    │
│ - slug        │        └──────────────┘
│ - isPublished │
└──────┬────────┘
       │ 1
       │
       ├──────────────────┐
       │ *                │ 1
       │                  │
┌──────┴────────┐   ┌─────┴──────┐
│   CaseStudy   │   │    Site    │
│               │   │            │
│ - portfolioId │   │ - portfolioId
│ - projectId   │   │ - subdomain │
│ - content     │   │ - deploymentType
└───────────────┘   │ - status    │
                    └─────────────┘
```

### Repository Methods Coverage

Each repository provides complete CRUD and specialized query methods:

**UserRepository:**
- `create()`, `findById()`, `findByEmail()`, `update()`, `delete()`
- `findByUsername()`, `emailExists()`, `usernameExists()`
- `updatePassword()`, `updateAvatar()`, `upgradePremium()`

**PortfolioRepository:**
- `create()`, `findById()`, `findBySlug()`, `update()`, `delete()`
- `findByUserId()`, `countByUserId()`, `findPublished()`
- `incrementViewCount()`, `slugExists()`, `getStats()`

**SiteRepository:**
- `create()`, `findBySubdomain()`, `findByPortfolioId()`, `update()`, `delete()`
- `subdomainExists()`, `findPublicSites()`, `getDeploymentHistory()`

**CaseStudyRepository:**
- `create()`, `findById()`, `update()`, `delete()`
- `findByPortfolioAndProject()`, `findByPortfolioId()`, `findPublicCaseStudies()`

**TemplateRepository:**
- `create()`, `findById()`, `findByTemplateId()`, `update()`, `delete()`
- `findActive()`, `findByCategory()`, `incrementUsageCount()`, `rateTemplate()`

---

## 🛡️ Middleware Pipeline

### Request Processing Order

```
Request
  ↓
[1] Helmet (Security headers)
  ↓
[2] CORS (Cross-origin resource sharing)
  ↓
[3] Body Parsers (JSON, URL-encoded)
  ↓
[4] Request Logger (Log all requests)
  ↓
[5] Rate Limiter (Endpoint-specific limits)
  ↓
[6] Route Handler
  ↓
[7] Authentication (if protected route)
  │   - JWT verification
  │   - Attach user to req.user
  ↓
[8] Validation (if required)
  │   - express-validator rules
  │   - Validate input
  ↓
[9] Ownership (if resource-specific)
  │   - Verify resource ownership
  │   - Prevent unauthorized access
  ↓
[10] Controller
  │   - Call service
  │   - Format response
  ↓
[11] Error Handler (if error occurs)
  │   - Catch all errors
  │   - Format error response
  │   - Log error
  ↓
Response
```

### Middleware Combinations by Route Type

**Public Routes** (no auth):
- Security → CORS → Body Parser → Rate Limit → Controller

**Protected Routes** (requires auth):
- Security → CORS → Body Parser → Rate Limit → Auth → Controller

**Protected + Validated Routes**:
- Security → CORS → Body Parser → Rate Limit → Auth → Validation → Controller

**Protected + Validated + Ownership Routes**:
- Security → CORS → Body Parser → Rate Limit → Auth → Validation → Ownership → Controller

---

## ⚠️ Error Handling Flow

### Exception Hierarchy

```
ApplicationError (Base)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
└── ConflictError (409)
```

### Error Flow Diagram

```
Error Occurs
  ↓
Service throws custom exception
  │
  ├─ NotFoundError.resource('Portfolio', id)
  ├─ ValidationError('Invalid email')
  ├─ ForbiddenError.ownershipRequired('portfolio')
  ├─ ConflictError.slugTaken(slug)
  └─ UnauthorizedError.invalidToken()
  ↓
Controller catches in try-catch
  ↓
Controller calls next(error)
  ↓
Error Handler Middleware receives error
  ↓
Check if error instanceof ApplicationError
  │
  ├─ YES: Use error.statusCode and error.code
  └─ NO: Default to 500 Internal Server Error
  ↓
Log error with context
  │
  ├─ Development: Full stack trace
  └─ Production: Sanitized error message
  ↓
Format error response
{
  success: false,
  message: error.message,
  code: error.code,
  statusCode: error.statusCode,
  details: error.details (if ValidationError)
}
  ↓
Send HTTP response with appropriate status code
```

### Error Response Examples

**404 Not Found:**
```json
{
  "success": false,
  "message": "Portfolio not found",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404
}
```

**400 Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Subdomain 'john-doe' is already taken",
  "code": "SLUG_TAKEN",
  "statusCode": 409
}
```

---

## 📝 Logging Architecture

### Structured Logging System

**Logger Methods:**
- `logger.info(message, context)` - General information
- `logger.error(message, context)` - Error messages
- `logger.warn(message, context)` - Warning messages
- `logger.debug(message, context)` - Debug information

**Specialized Logging:**
- `logger.service(serviceName, method, context)` - Service operations
- `logger.database(operation, collection, context)` - Database queries
- `logger.auth(event, userId, context)` - Authentication events
- `logger.externalApi(service, endpoint, status, duration, context)` - External API calls

### Logging Patterns

**Service Layer:**
```javascript
export class PortfolioService {
  async createPortfolio(userId, data) {
    logger.service('PortfolioService', 'createPortfolio', { userId });

    // Business logic...

    logger.info('Portfolio created successfully', {
      portfolioId: portfolio._id,
      userId,
      template: data.template
    });

    return portfolio;
  }
}
```

**Repository Layer:**
```javascript
export class PortfolioRepository {
  async create(data) {
    logger.database('create', 'portfolios', { userId: data.userId });
    return await Portfolio.create(data);
  }
}
```

**Authentication:**
```javascript
logger.auth('login', user._id, {
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Log Output Format

**Development (Console):**
```
[2025-10-30 14:30:45] INFO [PortfolioService.createPortfolio] Portfolio created successfully
  Context: { portfolioId: '507f1f77bcf86cd799439011', userId: '507f191e810c19729de860ea' }
```

**Production (JSON):**
```json
{
  "timestamp": "2025-10-30T14:30:45.123Z",
  "level": "INFO",
  "service": "PortfolioService",
  "method": "createPortfolio",
  "message": "Portfolio created successfully",
  "context": {
    "portfolioId": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea"
  }
}
```

---

## ⚙️ Configuration Management

### Centralized Configuration Object

```javascript
// src/config/index.js
export default {
  app: {
    port: 5000,
    nodeEnv: 'development',
    isDevelopment: true,
    isProduction: false
  },
  database: {
    uri: 'mongodb+srv://...',
    options: { /* connection options */ }
  },
  auth: {
    jwtSecret: 'secret',
    jwtExpiration: '30d',
    bcryptRounds: 12
  },
  cloudinary: {
    cloudName: 'name',
    apiKey: 'key',
    apiSecret: 'secret'
  },
  redis: {
    enabled: true,
    url: 'redis://localhost:6379'
  },
  vercel: {
    token: 'token',
    orgId: 'org_id',
    projectId: 'project_id'
  },
  rateLimit: {
    general: { windowMs: 60000, max: 30 },
    auth: { windowMs: 60000, max: 10 },
    upload: { windowMs: 60000, max: 10 },
    publish: { windowMs: 60000, max: 5 }
  },
  upload: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};
```

### Environment Validation

**Validation on Startup:**
```javascript
// src/config/envValidator.js
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

// Validates all required variables exist
// Fails fast if any are missing
// Checks for placeholder values like '<password>'
```

---

## 🧪 Testing Strategy

### Testable Architecture

**Service Layer Testing (Unit Tests):**
```javascript
describe('PortfolioService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn()
    };
    service = new PortfolioService(mockRepository);
  });

  describe('createPortfolio', () => {
    it('should create portfolio with default template', async () => {
      const userId = 'user123';
      const data = { title: 'My Portfolio' };

      mockRepository.create.mockResolvedValue({
        _id: 'portfolio123',
        userId,
        ...data,
        template: 'echelon'
      });

      const result = await service.createPortfolio(userId, data);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        title: 'My Portfolio',
        template: 'echelon'
      });
      expect(result.template).toBe('echelon');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockRepository.create.mockRejectedValue(new Error('User not found'));

      await expect(
        service.createPortfolio('invalid', {})
      ).rejects.toThrow();
    });
  });
});
```

**Repository Layer Testing (Integration Tests):**
```javascript
describe('PortfolioRepository', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectTestDatabase();
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  describe('create', () => {
    it('should create portfolio in database', async () => {
      const data = {
        userId: testUserId,
        title: 'Test Portfolio'
      };

      const portfolio = await portfolioRepository.create(data);

      expect(portfolio._id).toBeDefined();
      expect(portfolio.title).toBe('Test Portfolio');
    });
  });
});
```

**Controller Testing (E2E Tests):**
```javascript
describe('POST /api/portfolios', () => {
  it('should create portfolio and return 201', async () => {
    const response = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Portfolio' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.portfolio.title).toBe('My Portfolio');
  });

  it('should return 401 if not authenticated', async () => {
    await request(app)
      .post('/api/portfolios')
      .send({ title: 'My Portfolio' })
      .expect(401);
  });
});
```

### Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Services | 80%+ | High |
| Repositories | 70%+ | Medium |
| Controllers | 60%+ | Medium |
| Middleware | 80%+ | High |
| Utilities | 90%+ | High |

---

## 🎯 Architecture Benefits

### Achieved Benefits

1. **Testability** ✅
   - Services testable with mocked repositories
   - Repositories testable with test database
   - Controllers testable with mocked services

2. **Maintainability** ✅
   - Business logic in one place (services)
   - Data access in one place (repositories)
   - Easy to find and modify code

3. **Scalability** ✅
   - Easy to add new features
   - Clear patterns to follow
   - No technical debt

4. **Reliability** ✅
   - Consistent error handling
   - Structured logging for debugging
   - Environment validation prevents misconfiguration

5. **Developer Experience** ✅
   - Consistent patterns across codebase
   - Less boilerplate (response formatter)
   - Clear separation of concerns
   - Easy onboarding for new developers

6. **Performance** ✅
   - No performance degradation
   - Efficient error handling
   - Optional caching layer

---

## 📈 Architecture Metrics

### Final Statistics

**Code Organization:**
- Controllers: 10 files, ~1,465 lines (73% reduction)
- Services: 11 files, ~3,516 lines (new)
- Repositories: 5 files, ~1,168 lines (new)
- Infrastructure: ~600 lines (logging, config)
- Shared: ~800 lines (constants, utils, exceptions)

**Total New Code:** ~6,000 lines of clean, well-organized code
**Total Code Reduced:** ~3,900 lines from controllers
**Net Addition:** ~2,100 lines (with much better organization)

**Quality Metrics:**
- ✅ 0 console.log statements (use logger)
- ✅ 0 direct Model imports in controllers
- ✅ 0 direct process.env access (use config)
- ✅ 100% consistent error handling
- ✅ 100% consistent response formatting
- ✅ 100% structured logging

---

## 🏆 Final Architecture Grade

**After 100% Completion:**

| Aspect | Grade | Notes |
|--------|-------|-------|
| **Separation of Concerns** | A+ | Perfect layer separation |
| **Testability** | A+ | All business logic testable |
| **Maintainability** | A+ | Easy to modify and extend |
| **Consistency** | A+ | Same patterns everywhere |
| **Documentation** | A+ | Comprehensive guides |
| **Error Handling** | A+ | Custom exceptions throughout |
| **Logging** | A+ | Structured logging with context |
| **Configuration** | A+ | Centralized and validated |

**Overall Architecture Grade: A+ (Professional, Production-Ready)**

---

**Document Status:** Complete - Ready for 100% implementation
**Next Steps:** Use as reference during refactoring phases
**Maintenance:** Update as architecture evolves
