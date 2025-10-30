# Quick Start: Refactored Backend Architecture

## 🎯 What Changed?

The backend has been refactored from a basic MVC pattern to **Clean Architecture** with clear separation of concerns.

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Controllers** | Fat (business logic) | Thin (HTTP only) |
| **Business Logic** | In controllers | In service layer |
| **Data Access** | Direct model calls | Repository layer |
| **Responses** | 204 duplicated patterns | 1 response formatter |
| **Errors** | Inconsistent handling | Custom exception classes |
| **Logging** | 175 console.log | Structured logger |
| **Config** | Scattered | Centralized + validated |

---

## 📁 New Architecture Overview

```
src/
├── shared/                 # Shared utilities & constants
│   ├── constants/         # HTTP codes, error codes
│   ├── utils/             # Response formatter
│   └── exceptions/        # Custom error classes
├── core/                   # Business logic
│   ├── services/          # Business logic layer
│   └── repositories/      # Data access layer
├── infrastructure/         # External concerns
│   └── logging/           # Structured logging
└── config/                 # Configuration
    ├── index.js           # Centralized config
    └── envValidator.js    # Env validation
```

---

## 🚀 How to Use (Examples)

### 1. Creating a New Service

```javascript
// src/core/services/ExampleService.js
import exampleRepository from '../repositories/ExampleRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError } from '../../shared/exceptions/index.js';

export class ExampleService {
  constructor(repository = exampleRepository) {
    this.repository = repository;
  }

  async getById(id) {
    logger.service('ExampleService', 'getById', { id });

    const item = await this.repository.findById(id);

    if (!item) {
      throw NotFoundError.resource('Example', id);
    }

    logger.info('Example retrieved', { id });
    return item;
  }

  async create(userId, data) {
    logger.service('ExampleService', 'create', { userId });

    // Validation
    if (!data.name) {
      throw new ValidationError('Name is required');
    }

    const item = await this.repository.create({
      userId,
      ...data
    });

    logger.info('Example created', { id: item._id, userId });
    return item;
  }
}

export default new ExampleService();
```

### 2. Creating a New Repository

```javascript
// src/core/repositories/ExampleRepository.js
import Example from '../../models/Example.js';
import logger from '../../infrastructure/logging/Logger.js';

export class ExampleRepository {
  async findById(id) {
    logger.database('findById', 'examples', { id });
    return await Example.findById(id);
  }

  async create(data) {
    logger.database('create', 'examples', { userId: data.userId });
    return await Example.create(data);
  }

  async update(id, data) {
    logger.database('update', 'examples', { id });
    return await Example.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    logger.database('delete', 'examples', { id });
    return await Example.findByIdAndDelete(id);
  }
}

export default new ExampleRepository();
```

### 3. Creating a Thin Controller

```javascript
// src/controllers/exampleController.js
import exampleService from '../core/services/ExampleService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

// All controllers follow this pattern: try-catch with service call
export const getById = async (req, res, next) => {
  try {
    const item = await exampleService.getById(req.params.id);
    return responseFormatter.success(res, { item });
  } catch (error) {
    next(error); // Let error middleware handle it
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await exampleService.create(req.user._id, req.body);
    return responseFormatter.created(res, { item }, 'Item created successfully');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const item = await exampleService.update(req.params.id, req.user._id, req.body);
    return responseFormatter.success(res, { item }, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    await exampleService.delete(req.params.id, req.user._id);
    return responseFormatter.success(res, null, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
};
```

---

## 📝 Common Patterns

### Pattern 1: Response Formatting

```javascript
import responseFormatter from '../shared/utils/responseFormatter.js';

// Success (200)
responseFormatter.success(res, { user }, 'User retrieved');

// Created (201)
responseFormatter.created(res, { portfolio }, 'Portfolio created');

// Not Found (404)
responseFormatter.notFound(res, 'Portfolio not found');

// Validation Error (400)
responseFormatter.validationError(res, 'Invalid input', validationErrors);

// Unauthorized (401)
responseFormatter.unauthorized(res, 'Invalid token');

// Forbidden (403)
responseFormatter.forbidden(res, 'Access denied');

// Conflict (409)
responseFormatter.conflict(res, 'Email already exists');

// Paginated
responseFormatter.paginated(res, items, { page: 1, limit: 10, total: 100 });
```

### Pattern 2: Exception Throwing

```javascript
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} from '../shared/exceptions/index.js';

// Not Found
throw NotFoundError.resource('Portfolio', portfolioId);

// Validation
throw new ValidationError('Invalid email format');

// Forbidden
throw ForbiddenError.ownershipRequired('portfolio');
throw ForbiddenError.premiumRequired();

// Conflict
throw ConflictError.slugTaken(slug);
throw ConflictError.duplicate('User', 'email');
```

### Pattern 3: Logging

```javascript
import logger from '../infrastructure/logging/Logger.js';

// Basic logging
logger.info('Operation completed', { userId, resourceId });
logger.error('Operation failed', { error, context });
logger.warn('Deprecated feature used', { feature });
logger.debug('Processing data', { dataSize });

// Specialized logging
logger.service('UserService', 'createUser', { email });
logger.database('create', 'users', { email });
logger.auth('login', userId, { ip });
logger.externalApi('Cloudinary', '/upload', 200, 1250);
```

### Pattern 4: Configuration

```javascript
import config from '../config/index.js';

// App config
const port = config.app.port;
const isDev = config.app.isDevelopment;

// Database
const dbUri = config.database.uri;

// Auth
const jwtSecret = config.auth.jwtSecret;
const jwtExpiration = config.auth.jwtExpiration;

// External services
const cloudinaryName = config.cloudinary.cloudName;
const redisEnabled = config.redis.enabled;

// Rate limits
const generalLimit = config.rateLimit.general.max;
```

---

## 🔄 Migration Checklist

When migrating a controller to the new architecture:

### Step 1: Create Repository (if not exists)
- [ ] Create `src/core/repositories/XRepository.js`
- [ ] Add CRUD methods
- [ ] Add specialized query methods
- [ ] Use logger for database operations
- [ ] Export singleton instance

### Step 2: Create Service
- [ ] Create `src/core/services/XService.js`
- [ ] Move business logic from controller
- [ ] Inject repository via constructor
- [ ] Use logger for service operations
- [ ] Throw custom exceptions
- [ ] Export singleton instance

### Step 3: Update Controller
- [ ] Import service and responseFormatter
- [ ] Replace business logic with service calls
- [ ] Use responseFormatter methods
- [ ] Remove manual error responses
- [ ] Pass errors to next() middleware
- [ ] Keep controllers thin (< 10 lines)

### Step 4: Test
- [ ] Run existing tests
- [ ] Verify all endpoints work
- [ ] Check error responses
- [ ] Verify logging output
- [ ] Test edge cases

---

## 📚 Available Utilities

### Response Formatter
**Location:** `src/shared/utils/responseFormatter.js`
- `success(res, data, message, statusCode)`
- `created(res, data, message)`
- `error(res, message, statusCode, code, details)`
- `validationError(res, message, details)`
- `notFound(res, message)`
- `unauthorized(res, message)`
- `forbidden(res, message)`
- `conflict(res, message)`
- `paginated(res, data, pagination, message)`

### Custom Exceptions
**Location:** `src/shared/exceptions/`
- `ApplicationError` - Base class
- `ValidationError` - 400 errors
- `NotFoundError` - 404 errors
- `UnauthorizedError` - 401 errors
- `ForbiddenError` - 403 errors
- `ConflictError` - 409 errors

### Logger
**Location:** `src/infrastructure/logging/Logger.js`
- `info(message, context)`
- `error(message, context)`
- `warn(message, context)`
- `debug(message, context)`
- `service(serviceName, method, context)`
- `database(operation, collection, context)`
- `auth(event, userId, context)`
- `externalApi(service, endpoint, status, duration, context)`

### Configuration
**Location:** `src/config/index.js`
- `config.app` - Application settings
- `config.database` - Database config
- `config.auth` - Auth settings
- `config.cloudinary` - Cloudinary config
- `config.redis` - Redis config
- `config.rateLimit` - Rate limiting rules
- `config.upload` - File upload settings

---

## ✅ Benefits Achieved

1. **Testability**: Services and repositories are easily testable with mocks
2. **Maintainability**: Business logic in one place, easy to find and modify
3. **Consistency**: All responses and errors follow same format
4. **Observability**: Structured logging makes debugging easier
5. **Reliability**: Environment validation prevents misconfiguration
6. **Scalability**: Clear separation makes it easy to add features
7. **Security**: Automatic log sanitization prevents credential leaks

---

## 📖 Next Steps

1. **Review** `REFACTORING_PROGRESS.md` for detailed status
2. **Study** the example PortfolioService and PortfolioRepository
3. **Migrate** one controller at a time using the checklist above
4. **Test** thoroughly after each migration
5. **Document** any new patterns or learnings

---

## 🆘 Getting Help

**Documentation:**
- `REFACTORING_PROGRESS.md` - Complete refactoring guide
- `CLAUDE.md` - Architecture overview and patterns
- `SECURITY.md` - Security implementation details

**Example Code:**
- `src/core/services/PortfolioService.js` - Complete service example
- `src/core/repositories/PortfolioRepository.js` - Complete repository example

**Key Principles:**
1. Controllers handle HTTP only (thin)
2. Services contain business logic
3. Repositories handle data access
4. Always throw exceptions, never return error objects
5. Always use response formatter
6. Always use structured logging
7. Always use centralized config

---

**Last Updated:** October 30, 2025
**Architecture Version:** 2.0 (Clean Architecture)
