# AUREA Backend Architecture Walkthrough

**Complete Guide to Clean Architecture Implementation**

**Created:** October 31, 2025
**Status:** Post-Refactoring (80% Complete)
**Architecture Pattern:** Clean Architecture with Service/Repository Layers

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer-by-Layer Deep Dive](#layer-by-layer-deep-dive)
3. [Request Flow](#request-flow)
4. [Core Patterns & Examples](#core-patterns--examples)
5. [Service Layer Pattern](#service-layer-pattern)
6. [Repository Pattern](#repository-pattern)
7. [Error Handling](#error-handling)
8. [Logging Strategy](#logging-strategy)
9. [Configuration Management](#configuration-management)
10. [Testing Approach](#testing-approach)

---

## Architecture Overview

### Clean Architecture Principles

The AUREA backend follows **Clean Architecture** principles, ensuring:

- **Separation of Concerns**: Each layer has a single, well-defined responsibility
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Testability**: Business logic is isolated and easily testable
- **Maintainability**: Changes in one layer don't cascade to others
- **Scalability**: Easy to add new features without modifying existing code

### Visual Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Request                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (Routes)                       │
│  • Route definitions                                         │
│  • Middleware chains (auth, validation, ownership, rate)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLERS (Thin)                          │
│  • HTTP request/response handling                            │
│  • Input extraction                                          │
│  • Delegates to services                                     │
│  • Uses responseFormatter for output                         │
│  • < 15 lines per method                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               SERVICE LAYER (Business Logic)                 │
│  • All business rules and logic                              │
│  • Data validation                                           │
│  • Orchestrates multiple repositories                        │
│  • Throws custom exceptions                                  │
│  • Uses structured logger                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            REPOSITORY LAYER (Data Access)                    │
│  • Database operations only                                  │
│  • CRUD operations                                           │
│  • No business logic                                         │
│  • Returns plain data                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (MongoDB)                          │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | What It Does | What It Doesn't Do |
|-------|---------------|--------------|-------------------|
| **Routes** | Route mapping | Maps URLs to controllers | Business logic |
| **Middleware** | Request processing | Auth, validation, rate limiting | Business logic |
| **Controllers** | HTTP handling | Extract input, format output | Business logic, data access |
| **Services** | Business logic | Validation, orchestration, rules | HTTP concerns, direct DB access |
| **Repositories** | Data access | CRUD operations | Business logic |
| **Models** | Data structure | Schema definition, virtuals | Business logic |

---

## Layer-by-Layer Deep Dive

### 1. API Layer (`src/api/`)

#### Routes (`src/routes/`)

**Purpose**: Define HTTP endpoints and attach middleware chains

**Example**: `src/routes/portfolioRoutes.js`

```javascript
import express from 'express';
import { auth } from '../middleware/auth.js';
import { validatePortfolio } from '../middleware/validation.js';
import * as portfolioController from '../controllers/portfolioController.js';

const router = express.Router();

// Middleware chain: auth → validation → controller
router.post(
  '/',
  auth,                           // 1. Authenticate user
  validatePortfolio,              // 2. Validate input
  portfolioController.createPortfolio  // 3. Handle request
);

export default router;
```

**Key Points**:
- Routes are just mappings, no logic
- Middleware chains execute in order
- Each middleware can short-circuit the chain

#### Middleware (`src/middleware/`)

**Authentication Middleware** (`auth.js`):
```javascript
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, config.auth.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;  // Attach user to request
    next();           // Continue to next middleware
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
```

**Ownership Middleware** (`ownership.js`):
```javascript
// Ensures user owns the resource they're accessing
export const ownsPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    req.portfolio = portfolio;  // Attach to request for next handler
    next();
  } catch (error) {
    next(error);
  }
};
```

**Rate Limiting Middleware** (`rateLimiter.js`):
```javascript
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const publishLimiter = rateLimit({
  windowMs: config.rateLimit.publish.windowMs,    // 1 minute
  max: config.rateLimit.publish.max,              // 5 requests
  message: {
    success: false,
    message: 'Too many publish requests, please try again later'
  }
});
```

---

### 2. Core Layer (`src/core/`)

#### Controllers (Thin Pattern)

**Purpose**: Handle HTTP concerns ONLY - no business logic

**Example**: `src/controllers/portfolioController.js`

```javascript
import portfolioService from '../core/services/PortfolioService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * @desc    Create new portfolio
 * @route   POST /api/portfolios
 * @access  Private
 */
export const createPortfolio = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const portfolioData = req.body;
    const userId = req.user._id;

    // 2. Delegate to service (business logic)
    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);

    // 3. Format response and send
    return responseFormatter.created(
      res,
      { portfolio },
      'Portfolio created successfully'
    );
  } catch (error) {
    // 4. Pass errors to error handler middleware
    next(error);
  }
};
```

**Controller Rules**:
- ✅ Extract data from req
- ✅ Call service methods
- ✅ Format responses with responseFormatter
- ✅ Pass errors to next()
- ❌ NO business logic
- ❌ NO database access
- ❌ NO validation logic
- ❌ Keep methods under 15 lines

#### Services (Business Logic)

**Purpose**: All business rules, validation, and orchestration

**Example**: `src/core/services/PortfolioService.js`

```javascript
import portfolioRepository from '../repositories/PortfolioRepository.js';
import userRepository from '../repositories/UserRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/exceptions/index.js';

export class PortfolioService {
  constructor(
    portfolioRepo = portfolioRepository,
    userRepo = userRepository
  ) {
    this.portfolioRepo = portfolioRepo;
    this.userRepo = userRepo;
  }

  /**
   * Create new portfolio with validation
   */
  async createPortfolio(userId, portfolioData) {
    logger.service('PortfolioService', 'createPortfolio', { userId });

    // Business rule: Validate user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Business rule: Check user's portfolio limit
    const portfolioCount = await this.portfolioRepo.countByUserId(userId);
    const limit = user.isPremium ? 50 : 5;

    if (portfolioCount >= limit) {
      throw new ValidationError(
        `Portfolio limit reached. ${user.isPremium ? 'Premium' : 'Free'} users can create up to ${limit} portfolios.`
      );
    }

    // Business rule: Set default template if not provided
    const template = portfolioData.template || 'echelon';

    // Business rule: Validate required fields
    if (!portfolioData.title) {
      throw new ValidationError('Portfolio title is required');
    }

    // Create portfolio via repository
    const portfolio = await this.portfolioRepo.create({
      userId,
      title: portfolioData.title,
      description: portfolioData.description || '',
      template,
      content: portfolioData.content || {}
    });

    logger.info('Portfolio created', {
      portfolioId: portfolio._id,
      userId,
      template
    });

    return portfolio;
  }

  /**
   * Publish portfolio with business rules
   */
  async publishPortfolio(portfolioId, userId) {
    logger.service('PortfolioService', 'publishPortfolio', { portfolioId, userId });

    // Get portfolio
    const portfolio = await this.portfolioRepo.findById(portfolioId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Business rule: Ownership check
    if (portfolio.userId.toString() !== userId.toString()) {
      throw ForbiddenError.ownershipRequired('portfolio');
    }

    // Business rule: Cannot publish empty portfolio
    if (!portfolio.content || Object.keys(portfolio.content).length === 0) {
      throw new ValidationError('Cannot publish empty portfolio. Please add content first.');
    }

    // Business rule: Generate slug if not exists
    if (!portfolio.slug) {
      portfolio.slug = await this.generateUniqueSlug(portfolio.title);
    }

    // Update portfolio
    const updatedPortfolio = await this.portfolioRepo.update(portfolioId, {
      isPublished: true,
      publishedAt: new Date(),
      slug: portfolio.slug
    });

    logger.info('Portfolio published', {
      portfolioId,
      slug: updatedPortfolio.slug
    });

    return updatedPortfolio;
  }

  /**
   * Generate unique slug (private helper)
   */
  async generateUniqueSlug(title) {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    let counter = 1;
    let uniqueSlug = slug;

    while (await this.portfolioRepo.slugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }
}

// Export singleton instance
export default new PortfolioService();
```

**Service Rules**:
- ✅ All business logic here
- ✅ Validate business rules
- ✅ Orchestrate multiple repositories
- ✅ Throw custom exceptions
- ✅ Use structured logger
- ✅ Keep methods focused (single responsibility)
- ❌ NO HTTP concerns (req, res)
- ❌ NO direct Model imports
- ❌ NO console.log

#### Repositories (Data Access)

**Purpose**: Database operations ONLY - no business logic

**Example**: `src/core/repositories/PortfolioRepository.js`

```javascript
import Portfolio from '../../models/Portfolio.js';
import logger from '../../infrastructure/logging/Logger.js';

export class PortfolioRepository {
  constructor(model = Portfolio) {
    this.model = model;
  }

  /**
   * Find portfolio by ID
   */
  async findById(id, options = {}) {
    logger.database('read', 'portfolios', { id });

    let query = this.model.findById(id);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return await query.exec();
  }

  /**
   * Find all portfolios by user ID
   */
  async findByUserId(userId, options = {}) {
    logger.database('read', 'portfolios', { userId });

    const {
      includeUnpublished = true,
      limit = 10,
      skip = 0,
      sort = { createdAt: -1 }
    } = options;

    const query = { userId };

    if (!includeUnpublished) {
      query.isPublished = true;
    }

    return await this.model
      .find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Create portfolio
   */
  async create(data) {
    logger.database('create', 'portfolios', { userId: data.userId });

    const portfolio = new this.model(data);
    return await portfolio.save();
  }

  /**
   * Update portfolio
   */
  async update(id, updates) {
    logger.database('update', 'portfolios', { id });

    return await this.model.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete portfolio
   */
  async delete(id) {
    logger.database('delete', 'portfolios', { id });

    return await this.model.findByIdAndDelete(id);
  }

  /**
   * Count portfolios by user
   */
  async countByUserId(userId) {
    logger.database('count', 'portfolios', { userId });

    return await this.model.countDocuments({ userId });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug, excludeId = null) {
    logger.database('read', 'portfolios', { slug });

    const query = { slug };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await this.model.countDocuments(query);
    return count > 0;
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    logger.database('read', 'portfolios', { slug });

    return await this.model.findOne({ slug });
  }
}

// Export singleton instance
export default new PortfolioRepository();
```

**Repository Rules**:
- ✅ Database operations only
- ✅ Return raw data
- ✅ Log all operations
- ✅ Accept options for flexibility
- ❌ NO business logic
- ❌ NO validation (except Mongoose)
- ❌ NO throwing custom exceptions
- ❌ Let Mongoose errors bubble up

---

### 3. Shared Layer (`src/shared/`)

#### Response Formatter

**Purpose**: Standardize all API responses

**File**: `src/shared/utils/responseFormatter.js`

```javascript
export const responseFormatter = {
  /**
   * Success response (200)
   */
  success(res, data, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  },

  /**
   * Created response (201)
   */
  created(res, data, message = 'Resource created') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  },

  /**
   * Not found response (404)
   */
  notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  },

  /**
   * Validation error (400)
   */
  validationError(res, message, errors = null) {
    return res.status(400).json({
      success: false,
      message,
      ...(errors && { errors })
    });
  },

  /**
   * Unauthorized (401)
   */
  unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message
    });
  },

  /**
   * Forbidden (403)
   */
  forbidden(res, message = 'Access denied') {
    return res.status(403).json({
      success: false,
      message
    });
  },

  /**
   * Conflict (409)
   */
  conflict(res, message = 'Resource conflict') {
    return res.status(409).json({
      success: false,
      message
    });
  },

  /**
   * Paginated response
   */
  paginated(res, items, pagination) {
    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }
};

export default responseFormatter;
```

#### Custom Exceptions

**Purpose**: Rich error context for business logic

**File**: `src/shared/exceptions/index.js`

```javascript
export class ApplicationError extends Error {
  constructor(message, statusCode = 500, code = 'APPLICATION_ERROR', context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message, context = {}) {
    super(message, 400, 'VALIDATION_ERROR', context);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message, context = {}) {
    super(message, 404, 'NOT_FOUND', context);
  }

  static resource(resourceType, resourceId) {
    return new NotFoundError(
      `${resourceType} not found`,
      { resourceType, resourceId }
    );
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message, context = {}) {
    super(message, 401, 'UNAUTHORIZED', context);
  }

  static tokenExpired() {
    return new UnauthorizedError('Token expired');
  }

  static tokenInvalid() {
    return new UnauthorizedError('Invalid token');
  }

  static invalidCredentials() {
    return new UnauthorizedError('Invalid email or password');
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message, context = {}) {
    super(message, 403, 'FORBIDDEN', context);
  }

  static ownershipRequired(resourceType) {
    return new ForbiddenError(
      `You don't have permission to access this ${resourceType}`,
      { resourceType }
    );
  }
}

export class ConflictError extends ApplicationError {
  constructor(message, code = 'RESOURCE_CONFLICT', context = {}) {
    super(message, 409, code, context);
  }

  static slugTaken(slug) {
    return new ConflictError(
      'This slug is already taken',
      'SLUG_TAKEN',
      { slug }
    );
  }
}
```

---

### 4. Infrastructure Layer (`src/infrastructure/`)

#### Structured Logger

**Purpose**: Contextual, searchable logs

**File**: `src/infrastructure/logging/Logger.js`

```javascript
import config from '../../config/index.js';

class Logger {
  constructor() {
    this.serviceName = 'AUREA-Backend';
    this.logLevel = config.logging.level;
  }

  /**
   * Log with level and context
   */
  log(level, message, context = {}) {
    const logObject = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      ...context
    };

    if (config.app.isDevelopment) {
      console.log(JSON.stringify(logObject));
    } else {
      console.log(JSON.stringify(logObject));
    }
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  error(message, context = {}) {
    this.log('error', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  debug(message, context = {}) {
    if (this.logLevel === 'debug') {
      this.log('debug', message, context);
    }
  }

  /**
   * Service-specific logging
   */
  service(serviceName, methodName, context = {}) {
    this.debug(`${serviceName}.${methodName}`, context);
  }

  /**
   * Database operation logging
   */
  database(operation, collection, context = {}) {
    this.debug(`DB ${operation}`, { collection, ...context });
  }

  /**
   * Authentication logging
   */
  auth(action, userId, context = {}) {
    this.info(`Auth: ${action}`, { userId, ...context });
  }
}

export default new Logger();
```

---

### 5. Configuration Layer (`src/config/`)

#### Centralized Config

**Purpose**: Single source of truth for all configuration

**File**: `src/config/index.js`

```javascript
import { getEnv, getEnvInt, isDevelopment, isProduction } from './envValidator.js';

export const config = {
  app: {
    name: 'AUREA Backend',
    port: getEnvInt('PORT', 5000),
    isDevelopment: isDevelopment(),
    isProduction: isProduction()
  },

  database: {
    uri: getEnv('MONGO_URI')
  },

  auth: {
    jwtSecret: getEnv('JWT_SECRET'),
    jwtExpiration: '30d',
    bcryptRounds: 12
  },

  cloudinary: {
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnv('CLOUDINARY_API_KEY'),
    apiSecret: getEnv('CLOUDINARY_API_SECRET')
  },

  cors: {
    origins: [
      'http://localhost:5173',
      'http://localhost:3000',
      getEnv('FRONTEND_URL')
    ].filter(Boolean)
  },

  rateLimit: {
    publish: {
      windowMs: 60 * 1000,  // 1 minute
      max: 5                // 5 requests
    },
    slugCheck: {
      windowMs: 60 * 1000,
      max: 10
    }
  }
};

export default config;
```

---

## Request Flow Example

Let's trace a complete request: **Create Portfolio**

### 1. HTTP Request arrives
```http
POST /api/portfolios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "My Portfolio",
  "description": "A portfolio showcasing my work",
  "template": "echelon"
}
```

### 2. Route matches
```javascript
// src/routes/portfolioRoutes.js
router.post('/', auth, validatePortfolio, portfolioController.createPortfolio);
```

### 3. Middleware chain executes

**auth middleware**:
- Extracts JWT token
- Verifies with `config.auth.jwtSecret`
- Loads user from database
- Attaches to `req.user`

**validatePortfolio middleware**:
- Checks required fields
- Validates data types
- Returns 400 if invalid

### 4. Controller handles request
```javascript
// src/controllers/portfolioController.js
export const createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(
      req.user._id,
      req.body
    );

    return responseFormatter.created(
      res,
      { portfolio },
      'Portfolio created successfully'
    );
  } catch (error) {
    next(error);
  }
};
```

### 5. Service processes business logic
```javascript
// src/core/services/PortfolioService.js
async createPortfolio(userId, portfolioData) {
  logger.service('PortfolioService', 'createPortfolio', { userId });

  // Business rule: Check portfolio limit
  const count = await this.portfolioRepo.countByUserId(userId);
  const user = await this.userRepo.findById(userId);

  if (count >= (user.isPremium ? 50 : 5)) {
    throw new ValidationError('Portfolio limit reached');
  }

  // Business rule: Set defaults
  const template = portfolioData.template || 'echelon';

  // Create via repository
  const portfolio = await this.portfolioRepo.create({
    userId,
    ...portfolioData,
    template
  });

  logger.info('Portfolio created', { portfolioId: portfolio._id });
  return portfolio;
}
```

### 6. Repository accesses database
```javascript
// src/core/repositories/PortfolioRepository.js
async create(data) {
  logger.database('create', 'portfolios', { userId: data.userId });
  const portfolio = new this.model(data);
  return await portfolio.save();
}
```

### 7. Response flows back
```javascript
// responseFormatter.created() sends:
{
  "success": true,
  "message": "Portfolio created successfully",
  "data": {
    "portfolio": {
      "_id": "6720abc...",
      "userId": "671fab...",
      "title": "My Portfolio",
      "description": "A portfolio showcasing my work",
      "template": "echelon",
      "createdAt": "2025-10-31T...",
      "updatedAt": "2025-10-31T..."
    }
  }
}
```

### 8. Logs generated
```json
{"timestamp":"2025-10-31T18:30:45.123Z","level":"DEBUG","service":"AUREA-Backend","message":"PortfolioService.createPortfolio","userId":"671fab..."}
{"timestamp":"2025-10-31T18:30:45.145Z","level":"DEBUG","service":"AUREA-Backend","message":"DB read","collection":"portfolios","userId":"671fab..."}
{"timestamp":"2025-10-31T18:30:45.167Z","level":"DEBUG","service":"AUREA-Backend","message":"DB read","collection":"users","id":"671fab..."}
{"timestamp":"2025-10-31T18:30:45.201Z","level":"DEBUG","service":"AUREA-Backend","message":"DB create","collection":"portfolios","userId":"671fab..."}
{"timestamp":"2025-10-31T18:30:45.234Z","level":"INFO","service":"AUREA-Backend","message":"Portfolio created","portfolioId":"6720abc...","userId":"671fab..."}
```

---

## Core Patterns & Examples

### Pattern 1: Service with Multiple Repositories

```javascript
export class SiteService {
  constructor(
    siteRepo = siteRepository,
    portfolioRepo = portfolioRepository,
    caseStudyRepo = caseStudyRepository
  ) {
    this.siteRepo = siteRepo;
    this.portfolioRepo = portfolioRepo;
    this.caseStudyRepo = caseStudyRepo;
  }

  async publishToSubdomain(portfolioId, userId, customSubdomain) {
    logger.service('SiteService', 'publishToSubdomain', { portfolioId });

    // Get portfolio
    const portfolio = await this.portfolioRepo.findById(portfolioId);
    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Check ownership
    if (portfolio.userId.toString() !== userId.toString()) {
      throw ForbiddenError.ownershipRequired('portfolio');
    }

    // Get case studies
    const caseStudies = await this.caseStudyRepo.findByPortfolioId(portfolioId);

    // Generate HTML
    const htmlFiles = await this.generateHTML(portfolio, caseStudies);

    // Save files
    const subdomain = customSubdomain || portfolio.slug;
    await this.saveFiles(subdomain, htmlFiles);

    // Create/update site record
    const site = await this.siteRepo.upsert({
      portfolioId,
      userId,
      subdomain,
      deploymentType: 'subdomain',
      status: 'published'
    });

    // Update portfolio
    await this.portfolioRepo.update(portfolioId, {
      isPublished: true,
      publishedAt: new Date()
    });

    return { site, url: `/${subdomain}/html` };
  }
}
```

### Pattern 2: Error Handling

```javascript
// In Service
async deletePortfolio(portfolioId, userId) {
  const portfolio = await this.portfolioRepo.findById(portfolioId);

  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  if (portfolio.userId.toString() !== userId.toString()) {
    throw ForbiddenError.ownershipRequired('portfolio');
  }

  if (portfolio.isPublished) {
    throw new ValidationError('Cannot delete published portfolio. Unpublish first.');
  }

  await this.portfolioRepo.delete(portfolioId);
  logger.info('Portfolio deleted', { portfolioId, userId });
}
```

```javascript
// In Controller
export const deletePortfolio = async (req, res, next) => {
  try {
    await portfolioService.deletePortfolio(req.params.id, req.user._id);
    return responseFormatter.success(res, null, 'Portfolio deleted');
  } catch (error) {
    next(error);  // Pass to error handler middleware
  }
};
```

```javascript
// Error Handler Middleware (server.js)
app.use((error, req, res, next) => {
  logger.error(error.message, {
    code: error.code,
    context: error.context,
    stack: error.stack
  });

  const statusCode = error.statusCode || 500;
  const message = config.app.isProduction && statusCode === 500
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    code: error.code || 'SERVER_ERROR',
    ...(config.app.isDevelopment && { stack: error.stack })
  });
});
```

### Pattern 3: Dependency Injection for Testing

```javascript
// Service with injected dependencies
export class PortfolioService {
  constructor(
    portfolioRepo = portfolioRepository,
    userRepo = userRepository,
    logger = defaultLogger
  ) {
    this.portfolioRepo = portfolioRepo;
    this.userRepo = userRepo;
    this.logger = logger;
  }

  // Methods...
}

// In tests, inject mocks
describe('PortfolioService', () => {
  it('should create portfolio', async () => {
    const mockPortfolioRepo = {
      create: jest.fn().mockResolvedValue({ id: '123' }),
      countByUserId: jest.fn().mockResolvedValue(2)
    };

    const mockUserRepo = {
      findById: jest.fn().mockResolvedValue({ isPremium: false })
    };

    const mockLogger = {
      service: jest.fn(),
      info: jest.fn()
    };

    const service = new PortfolioService(
      mockPortfolioRepo,
      mockUserRepo,
      mockLogger
    );

    const result = await service.createPortfolio('user123', { title: 'Test' });

    expect(mockPortfolioRepo.create).toHaveBeenCalled();
    expect(result.id).toBe('123');
  });
});
```

---

## Best Practices Summary

### DO ✅

1. **Controllers**:
   - Keep under 15 lines per method
   - Extract input from req
   - Delegate to services
   - Use responseFormatter
   - Pass errors to next()

2. **Services**:
   - Put all business logic here
   - Throw custom exceptions
   - Use structured logger
   - Orchestrate repositories
   - Validate business rules

3. **Repositories**:
   - Database operations only
   - Return raw data
   - Log all operations
   - Accept flexible options

4. **Error Handling**:
   - Use custom exceptions
   - Rich error context
   - Let middleware handle responses

5. **Configuration**:
   - Use centralized config object
   - Never access process.env directly
   - Validate environment variables

### DON'T ❌

1. **Controllers**:
   - ❌ Business logic
   - ❌ Database access
   - ❌ Validation logic
   - ❌ Direct Model imports

2. **Services**:
   - ❌ HTTP concerns (req, res)
   - ❌ Direct Model imports
   - ❌ console.log statements
   - ❌ Response formatting

3. **Repositories**:
   - ❌ Business logic
   - ❌ Throwing custom exceptions
   - ❌ Validation beyond Mongoose

4. **General**:
   - ❌ process.env directly
   - ❌ console.log/error/warn
   - ❌ Mixing concerns

---

## Quick Reference

### Import Paths

```javascript
// Controllers
import portfolioService from '../core/services/PortfolioService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

// Services
import portfolioRepository from '../repositories/PortfolioRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { ValidationError, NotFoundError } from '../../shared/exceptions/index.js';

// Middleware
import config from '../config/index.js';
import logger from '../infrastructure/logging/Logger.js';
```

### File Structure

```
src/
├── api/                      # API layer
│   ├── controllers/          # Thin controllers
│   ├── routes/              # Route definitions
│   └── middleware/          # Request processors
├── core/                     # Business logic
│   ├── services/            # Business logic
│   └── repositories/        # Data access
├── shared/                   # Shared utilities
│   ├── constants/           # Constants
│   ├── utils/               # Helpers
│   └── exceptions/          # Custom errors
├── infrastructure/           # Infrastructure
│   └── logging/             # Logging
├── config/                   # Configuration
│   └── index.js             # Config object
└── models/                   # Mongoose schemas
```

---

## Conclusion

This architecture provides:

- ✅ **Clear separation of concerns**: Each layer has single responsibility
- ✅ **High testability**: Business logic isolated and injectable
- ✅ **Easy maintenance**: Changes localized to specific layers
- ✅ **Excellent developer experience**: Consistent patterns throughout
- ✅ **Production ready**: Structured logging, error handling, configuration

Follow these patterns when adding new features, and the codebase will remain clean, maintainable, and scalable.

---

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Author:** AUREA Backend Team
