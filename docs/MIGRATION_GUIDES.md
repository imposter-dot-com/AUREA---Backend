# Controller Refactoring Migration Guides
## Step-by-Step Instructions for Clean Architecture

**Document Version:** 1.0
**Last Updated:** October 30, 2025
**Purpose:** Practical guides for refactoring controllers to Clean Architecture

---

## 📋 Table of Contents

1. [General Refactoring Process](#general-refactoring-process)
2. [Repository Creation Guide](#repository-creation-guide)
3. [Service Creation Guide](#service-creation-guide)
4. [Controller Refactoring Guide](#controller-refactoring-guide)
5. [Testing After Refactoring](#testing-after-refactoring)
6. [Specific Controller Guides](#specific-controller-guides)
7. [Common Patterns & Examples](#common-patterns--examples)
8. [Troubleshooting](#troubleshooting)

---

## 🔄 General Refactoring Process

### Overview of Steps

For each controller to be refactored:

```
1. Analyze Controller
   ↓
2. Create Repository (if needed)
   ↓
3. Create Service(s)
   ↓
4. Refactor Controller
   ↓
5. Test Endpoints
   ↓
6. Commit Changes
```

### Prerequisites

Before starting any refactoring:

- ✅ Read ARCHITECTURE_AFTER_REFACTORING.md to understand target architecture
- ✅ Ensure all existing tests pass
- ✅ Create a new git branch for safety
- ✅ Have responseFormatter, logger, config, and exceptions available

### Git Safety

```bash
# Create feature branch
git checkout -b refactor/controller-name

# Do refactoring work...

# Test thoroughly
npm test
node test/test-*.js

# Commit with descriptive message
git add .
git commit -m "refactor: convert ControllerName to Clean Architecture

- Created ServiceName and RepositoryName
- Extracted business logic to service layer
- Replaced console.log with logger
- Replaced process.env with config
- All tests passing"

# Merge back when complete
git checkout main
git merge refactor/controller-name
```

---

## 📦 Repository Creation Guide

### Step 1: Analyze Data Access Needs

Review the controller and identify all database operations:

**Questions to answer:**
- What models does the controller access?
- What queries are performed?
- Are there any complex queries?
- Are there aggregations or joins?

**Example from siteController.js:**
```javascript
// Found in controller:
await Site.findOne({ subdomain });
await Site.create({ portfolioId, subdomain, ... });
await Site.findByIdAndUpdate(id, data, { new: true });
await Site.findOne({ portfolioId });
```

### Step 2: Create Repository File

**Location:** `src/core/repositories/[ModelName]Repository.js`

**Template:**
```javascript
import [ModelName] from '../../models/[ModelName].js';
import logger from '../../infrastructure/logging/Logger.js';

/**
 * Repository for [ModelName] data access
 * Handles all database operations for [model description]
 */
export class [ModelName]Repository {

  /**
   * Create a new [model]
   * @param {Object} data - [Model] data
   * @returns {Promise<Object>} Created [model]
   */
  async create(data) {
    logger.database('create', '[collection]', { userId: data.userId });
    return await [ModelName].create(data);
  }

  /**
   * Find [model] by ID
   * @param {string} id - [Model] ID
   * @returns {Promise<Object|null>} [Model] or null
   */
  async findById(id) {
    logger.database('findById', '[collection]', { id });
    return await [ModelName].findById(id);
  }

  /**
   * Update [model]
   * @param {string} id - [Model] ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated [model] or null
   */
  async update(id, data) {
    logger.database('update', '[collection]', { id });
    return await [ModelName].findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Delete [model]
   * @param {string} id - [Model] ID
   * @returns {Promise<Object|null>} Deleted [model] or null
   */
  async delete(id) {
    logger.database('delete', '[collection]', { id });
    return await [ModelName].findByIdAndDelete(id);
  }

  // Add specialized query methods here
}

export default new [ModelName]Repository();
```

### Step 3: Add Specialized Query Methods

Based on controller analysis, add specific query methods:

**Example: SiteRepository with specialized queries**
```javascript
export class SiteRepository {
  // ... basic CRUD methods above ...

  /**
   * Find site by subdomain
   * @param {string} subdomain - Subdomain to search
   * @returns {Promise<Object|null>} Site or null
   */
  async findBySubdomain(subdomain) {
    logger.database('findBySubdomain', 'sites', { subdomain });
    return await Site.findOne({ subdomain });
  }

  /**
   * Find site by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object|null>} Site or null
   */
  async findByPortfolioId(portfolioId) {
    logger.database('findByPortfolioId', 'sites', { portfolioId });
    return await Site.findOne({ portfolioId });
  }

  /**
   * Check if subdomain exists (excluding specific user)
   * @param {string} subdomain - Subdomain to check
   * @param {string} excludeUserId - User ID to exclude
   * @returns {Promise<boolean>} True if exists
   */
  async subdomainExists(subdomain, excludeUserId) {
    logger.database('subdomainExists', 'sites', { subdomain });
    const query = { subdomain };
    if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
    }
    return await Site.exists(query);
  }

  /**
   * Get deployment history for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, sort)
   * @returns {Promise<Array>} Array of sites
   */
  async getDeploymentHistory(userId, options = {}) {
    logger.database('getDeploymentHistory', 'sites', { userId });
    const { limit = 10, sortBy = '-createdAt' } = options;
    return await Site.find({ userId })
      .sort(sortBy)
      .limit(limit);
  }
}
```

### Step 4: Test Repository Methods

Create simple test to verify repository works:

```javascript
// Quick manual test (can be run in Node REPL or test file)
import siteRepository from './src/core/repositories/SiteRepository.js';

// Test create
const site = await siteRepository.create({
  portfolioId: 'test123',
  userId: 'user123',
  subdomain: 'test-subdomain'
});
console.log('Created:', site);

// Test findBySubdomain
const found = await siteRepository.findBySubdomain('test-subdomain');
console.log('Found:', found);

// Cleanup
await siteRepository.delete(site._id);
```

---

## 🎯 Service Creation Guide

### Step 1: Analyze Business Logic

Review controller and identify all business logic:

**Business logic includes:**
- Validation rules
- Authorization checks
- Data transformations
- Orchestration of multiple operations
- Error handling
- Complex calculations

**Example from siteController.js:**
```javascript
// Business Logic Found:
// 1. Subdomain generation logic
// 2. Subdomain availability checking
// 3. Ownership verification
// 4. HTML file generation
// 5. Old file cleanup
// 6. Vercel deployment orchestration
```

### Step 2: Create Service File

**Location:** `src/core/services/[Feature]Service.js`

**Template:**
```javascript
import [repository] from '../repositories/[Repository].js';
import logger from '../../infrastructure/logging/Logger.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} from '../../shared/exceptions/index.js';

/**
 * Service for [feature] business logic
 * Handles [description of responsibilities]
 */
export class [Feature]Service {

  /**
   * Constructor with dependency injection
   * @param {Object} repo - Repository instance (for testing)
   */
  constructor(repo = [repository]) {
    this.repository = repo;
  }

  /**
   * [Method description]
   * @param {string} param - Parameter description
   * @returns {Promise<Object>} Result description
   * @throws {NotFoundError} If resource not found
   * @throws {ForbiddenError} If no permission
   */
  async methodName(param) {
    logger.service('[Feature]Service', 'methodName', { param });

    // Business Logic Step 1: Validate input
    if (!param) {
      throw new ValidationError('Parameter is required');
    }

    // Business Logic Step 2: Get data from repository
    const data = await this.repository.findById(param);

    if (!data) {
      throw NotFoundError.resource('[Resource]', param);
    }

    // Business Logic Step 3: Process/transform data
    // ... business logic here ...

    // Business Logic Step 4: Save changes
    const result = await this.repository.update(data._id, updatedData);

    logger.info('Operation completed', { resultId: result._id });

    return result;
  }
}

export default new [Feature]Service();
```

### Step 3: Extract Business Logic Methods

For each controller method, create corresponding service method:

**Before (in controller):**
```javascript
export const publishToSubdomain = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { customSubdomain } = req.body;
    const userId = req.user._id;

    // Get portfolio
    const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Generate subdomain if not provided
    let subdomain = customSubdomain;
    if (!subdomain) {
      subdomain = portfolio.slug || generateSlug(portfolio.content.about.name);
    }

    // Check availability
    const existingSite = await Site.findOne({ subdomain, userId: { $ne: userId } });
    if (existingSite) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already taken'
      });
    }

    // Generate HTML
    const htmlFiles = await generateAllPortfolioFiles(portfolio);

    // Save site
    const site = await Site.create({
      portfolioId,
      userId,
      subdomain,
      deploymentType: 'subdomain',
      status: 'published'
    });

    res.status(200).json({
      success: true,
      data: { site },
      message: 'Published successfully'
    });

  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

**After (in service):**
```javascript
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

    // Data Access: Create site record
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

  // Helper method (private business logic)
  async generateHTML(portfolio) {
    logger.service('SiteService', 'generateHTML', { portfolioId: portfolio._id });

    // Import templateConvert service
    const { generateAllPortfolioFiles } = await import('../../../services/templateConvert.js');

    return await generateAllPortfolioFiles(portfolio);
  }
}
```

### Step 4: Handle Multiple Services

Sometimes one controller needs multiple services:

**Example: userController needs UserService AND PremiumService**

```javascript
// UserService.js - User management
export class UserService {
  async updateUser(userId, data) {
    // User update logic
  }

  async deleteUser(userId) {
    // User deletion logic
  }
}

// PremiumService.js - Premium features
export class PremiumService {
  async upgradeToPremium(userId, tier) {
    // Premium upgrade logic
  }

  async checkPremiumStatus(user) {
    // Premium status checking
  }
}
```

**Both services are then used in controller:**
```javascript
import userService from '../core/services/UserService.js';
import premiumService from '../core/services/PremiumService.js';

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return responseFormatter.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const upgradePremium = async (req, res, next) => {
  try {
    const user = await premiumService.upgradeToPremium(req.params.id, req.body.tier);
    return responseFormatter.success(res, { user });
  } catch (error) {
    next(error);
  }
};
```

---

## 🎨 Controller Refactoring Guide

### Step 1: Add Imports

Replace old imports with new ones:

**Before:**
```javascript
import Portfolio from '../models/Portfolio.js';
import Site from '../models/Site.js';
import CaseStudy from '../models/CaseStudy.js';
```

**After:**
```javascript
import siteService from '../core/services/SiteService.js';
import subdomainService from '../core/services/SubdomainService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
// No direct Model imports!
```

### Step 2: Refactor Each Method

Apply thin controller pattern to each method:

**Pattern:**
```javascript
export const methodName = async (req, res, next) => {
  try {
    // 1. Extract parameters from request
    const { param1, param2 } = req.params;
    const { bodyParam } = req.body;
    const userId = req.user._id;

    // 2. Call service (business logic)
    const result = await service.methodName(param1, param2, bodyParam, userId);

    // 3. Format and send response
    return responseFormatter.success(
      res,
      { result },
      'Operation successful'
    );
  } catch (error) {
    // 4. Pass error to error handler middleware
    next(error);
  }
};
```

**Example Before/After:**

**Before (fat controller):**
```javascript
export const createPortfolio = async (req, res) => {
  try {
    const { title, description, template } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Business logic
    const selectedTemplate = template || 'echelon';

    // Database access
    const portfolio = await Portfolio.create({
      userId,
      title,
      description,
      template: selectedTemplate
    });

    console.log('Portfolio created:', portfolio._id);

    res.status(201).json({
      success: true,
      data: { portfolio },
      message: 'Portfolio created successfully'
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

**After (thin controller):**
```javascript
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

### Step 3: Replace console.log with logger

**Find and replace all console statements:**

```bash
# Find all console.log in controller
grep -n "console\." src/controllers/yourController.js
```

**Before:**
```javascript
console.log('Portfolio created:', portfolio._id);
console.error('Error:', error);
```

**After:**
```javascript
// Remove from controller entirely!
// Logging should be in service layer
```

**In service layer:**
```javascript
logger.info('Portfolio created', { portfolioId: portfolio._id });
logger.error('Operation failed', { error, context });
```

### Step 4: Replace process.env with config

**Find and replace all process.env:**

```bash
# Find all process.env in controller
grep -n "process\.env" src/controllers/yourController.js
```

**Before:**
```javascript
if (process.env.NODE_ENV === 'development') {
  // ...
}
const vercelToken = process.env.VERCEL_TOKEN;
```

**After:**
```javascript
import config from '../config/index.js';

if (config.app.isDevelopment) {
  // ...
}
const vercelToken = config.vercel.token;
```

### Step 5: Verify No Direct Model Imports

**Check imports at top of controller:**

```javascript
// ❌ BAD - Direct model imports
import Portfolio from '../models/Portfolio.js';
import Site from '../models/Site.js';

// ✅ GOOD - Service imports only
import portfolioService from '../core/services/PortfolioService.js';
import siteService from '../core/services/SiteService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
```

---

## 🧪 Testing After Refactoring

### Step 1: Run Existing Tests

```bash
# Run all test suites
npm test

# Run specific test file
node test/test-user-profile-crud.js
node test/test-custom-subdomain.js
```

**Expected:** All tests should pass

**If tests fail:**
1. Check error message carefully
2. Verify service methods match expected behavior
3. Check if exceptions are being thrown correctly
4. Ensure responseFormatter is formatting responses correctly

### Step 2: Manual Endpoint Testing

Use curl or Postman to test each endpoint:

```bash
# Example: Test portfolio creation
curl -X POST http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Portfolio",
    "description": "Test portfolio"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "portfolio": {
      "_id": "...",
      "title": "My Portfolio",
      "description": "Test portfolio",
      "template": "echelon"
    }
  },
  "message": "Portfolio created successfully"
}
```

### Step 3: Test Error Scenarios

Test error handling:

```bash
# Test without authentication (should get 401)
curl -X POST http://localhost:5000/api/portfolios \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Test with invalid data (should get 400)
curl -X POST http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test with non-existent resource (should get 404)
curl http://localhost:5000/api/portfolios/invalid-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Check Logging Output

**Start server and watch logs:**
```bash
npm run dev
```

**Expected logging format:**
```
[2025-10-30 14:30:45] INFO [PortfolioService.createPortfolio] Portfolio created successfully
  Context: { portfolioId: '507f1f77bcf86cd799439011', userId: '507f191e810c19729de860ea' }
```

**Verify:**
- ✅ No console.log output
- ✅ Structured logger output
- ✅ Context includes relevant information
- ✅ Sensitive data is sanitized

---

## 📖 Specific Controller Guides

### Guide: Site Controller Refactoring

**Complexity:** High (1,293 lines → ~200 lines)
**Time Estimate:** 8 hours

**Step 1: Create Repositories**
```javascript
// src/core/repositories/SiteRepository.js
export class SiteRepository {
  async create(data) { /* ... */ }
  async findBySubdomain(subdomain) { /* ... */ }
  async findByPortfolioId(portfolioId) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
  async subdomainExists(subdomain, excludeUserId) { /* ... */ }
}
```

**Step 2: Create Services**
```javascript
// src/core/services/SubdomainService.js
export class SubdomainService {
  async generateFromPortfolio(portfolio, user) { /* ... */ }
  async validateFormat(subdomain) { /* ... */ }
  async checkAvailability(subdomain, userId) { /* ... */ }
  async suggestAlternatives(baseSubdomain) { /* ... */ }
}

// src/core/services/SiteService.js
export class SiteService {
  async publishToSubdomain(portfolioId, userId, customSubdomain) { /* ... */ }
  async publishToVercel(portfolioId, userId) { /* ... */ }
  async unpublish(portfolioId, userId) { /* ... */ }
  async generateHTML(portfolioData) { /* ... */ }
  async cleanupOldFiles(oldSubdomain) { /* ... */ }
}
```

**Step 3: Refactor Controller**
```javascript
// src/controllers/siteController.js
import siteService from '../core/services/SiteService.js';
import subdomainService from '../core/services/SubdomainService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

export const subPublish = async (req, res, next) => {
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

export const vercelPublish = async (req, res, next) => {
  try {
    const { portfolioId } = req.params;

    const site = await siteService.publishToVercel(
      portfolioId,
      req.user._id
    );

    return responseFormatter.success(
      res,
      { site },
      'Portfolio deployed to Vercel successfully'
    );
  } catch (error) {
    next(error);
  }
};

// ... other thin controller methods
```

---

### Guide: User Controller Refactoring

**Complexity:** Medium (782 lines → ~150 lines)
**Time Estimate:** 6 hours

**Step 1: UserRepository Already Exists** ✅
No need to create - use existing UserRepository

**Step 2: Create Services**
```javascript
// src/core/services/UserService.js
export class UserService {
  constructor(userRepo = userRepository) {
    this.userRepository = userRepo;
  }

  async getAllUsers(filters, pagination) {
    logger.service('UserService', 'getAllUsers', { filters });

    const { page = 1, limit = 10 } = pagination;
    const users = await this.userRepository.findAll(filters, { page, limit });
    const total = await this.userRepository.count(filters);

    return { users, pagination: { page, limit, total } };
  }

  async getUserById(id) {
    logger.service('UserService', 'getUserById', { id });

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw NotFoundError.resource('User', id);
    }

    return user;
  }

  // ... more methods
}

// src/core/services/PremiumService.js
export class PremiumService {
  constructor(userRepo = userRepository) {
    this.userRepository = userRepo;
  }

  async upgradeToPremium(userId, tier, duration) {
    logger.service('PremiumService', 'upgradeToPremium', { userId, tier });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    const expirationDate = this.calculateExpiration(duration);

    const updatedUser = await this.userRepository.upgradePremium(
      userId,
      tier,
      expirationDate
    );

    logger.info('User upgraded to premium', { userId, tier });

    return updatedUser;
  }

  calculateExpiration(duration) {
    // Business logic for calculating expiration
    const now = new Date();
    if (duration === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else if (duration === 'yearly') {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    } else if (duration === 'lifetime') {
      return null; // null means lifetime
    }
  }

  // ... more methods
}
```

**Step 3: Refactor Controller**
```javascript
import userService from '../core/services/UserService.js';
import premiumService from '../core/services/PremiumService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    });

    return responseFormatter.paginated(
      res,
      result.users,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

export const upgradeToPremium = async (req, res, next) => {
  try {
    const { tier, duration } = req.body;

    const user = await premiumService.upgradeToPremium(
      req.params.id,
      tier,
      duration
    );

    return responseFormatter.success(
      res,
      { user },
      'User upgraded to premium successfully'
    );
  } catch (error) {
    next(error);
  }
};

// ... other thin controller methods
```

---

## 🎓 Common Patterns & Examples

### Pattern 1: CRUD Service

```javascript
export class ResourceService {
  constructor(repo = resourceRepository) {
    this.repository = repo;
  }

  async create(userId, data) {
    logger.service('ResourceService', 'create', { userId });

    // Validate
    if (!data.name) {
      throw new ValidationError('Name is required');
    }

    // Create
    const resource = await this.repository.create({
      userId,
      ...data
    });

    logger.info('Resource created', { resourceId: resource._id });
    return resource;
  }

  async getById(id, userId) {
    logger.service('ResourceService', 'getById', { id, userId });

    const resource = await this.repository.findByIdAndUserId(id, userId);

    if (!resource) {
      throw NotFoundError.resource('Resource', id);
    }

    return resource;
  }

  async update(id, userId, data) {
    logger.service('ResourceService', 'update', { id, userId });

    // Check ownership
    const resource = await this.repository.findByIdAndUserId(id, userId);

    if (!resource) {
      throw NotFoundError.resource('Resource', id);
    }

    // Update
    const updated = await this.repository.update(id, data);

    logger.info('Resource updated', { resourceId: updated._id });
    return updated;
  }

  async delete(id, userId) {
    logger.service('ResourceService', 'delete', { id, userId });

    // Check ownership
    const resource = await this.repository.findByIdAndUserId(id, userId);

    if (!resource) {
      throw NotFoundError.resource('Resource', id);
    }

    // Delete
    await this.repository.delete(id);

    logger.info('Resource deleted', { resourceId: id });
  }
}
```

### Pattern 2: Ownership Checking

```javascript
async updateResource(id, userId, data) {
  logger.service('ResourceService', 'updateResource', { id, userId });

  // Get resource with ownership check
  const resource = await this.repository.findById(id);

  if (!resource) {
    throw NotFoundError.resource('Resource', id);
  }

  // Check ownership
  if (resource.userId.toString() !== userId.toString()) {
    throw ForbiddenError.ownershipRequired('resource');
  }

  // Proceed with update
  const updated = await this.repository.update(id, data);

  return updated;
}
```

### Pattern 3: Multi-Step Operation

```javascript
async publishResource(id, userId) {
  logger.service('ResourceService', 'publishResource', { id, userId });

  // Step 1: Get resource
  const resource = await this.repository.findByIdAndUserId(id, userId);

  if (!resource) {
    throw NotFoundError.resource('Resource', id);
  }

  // Step 2: Validate can publish
  if (!resource.isComplete) {
    throw new ValidationError('Resource must be complete before publishing');
  }

  // Step 3: Check slug availability
  const slugTaken = await this.repository.slugExists(resource.slug, userId);

  if (slugTaken) {
    throw ConflictError.slugTaken(resource.slug);
  }

  // Step 4: Generate files (external service)
  const files = await this.generateFiles(resource);

  // Step 5: Update status
  const published = await this.repository.update(id, {
    isPublished: true,
    publishedAt: new Date()
  });

  logger.info('Resource published', { resourceId: published._id });

  return published;
}
```

---

## 🔧 Troubleshooting

### Issue: Tests Failing After Refactoring

**Symptoms:**
- Tests that passed before now fail
- Error messages about missing methods

**Solutions:**

1. **Check service exports:**
```javascript
// Make sure you export both class and default instance
export class MyService { }
export default new MyService();
```

2. **Check imports in tests:**
```javascript
// Old test import (might be wrong now)
import { createPortfolio } from '../controllers/portfolioController.js';

// Should be testing service instead
import portfolioService from '../src/core/services/PortfolioService.js';
```

3. **Update test mocks:**
```javascript
// Mock repository for service testing
jest.mock('../src/core/repositories/PortfolioRepository.js');
```

---

### Issue: 500 Server Error After Refactoring

**Symptoms:**
- Endpoint returns 500 error
- Used to work before refactoring

**Solutions:**

1. **Check error logs:**
```bash
# Look for the actual error in logs
npm run dev
# Make request and check terminal output
```

2. **Common causes:**
- Service not imported correctly
- Repository not passed to service
- Exception not being caught
- responseFormatter not imported

3. **Verify imports:**
```javascript
// Make sure default export is imported
import siteService from '../core/services/SiteService.js';
// NOT
import { SiteService } from '../core/services/SiteService.js';
```

---

### Issue: Response Format Changed

**Symptoms:**
- Frontend expects different response format
- Tests fail due to response structure

**Solutions:**

Use responseFormatter correctly:

```javascript
// Success response
return responseFormatter.success(res, { data }, 'Message');
// Returns: { success: true, data: { data }, message: 'Message' }

// Created response
return responseFormatter.created(res, { data }, 'Message');
// Returns: { success: true, data: { data }, message: 'Message' } with 201 status

// Error response (automatic via exceptions)
throw NotFoundError.resource('Resource', id);
// Returns: { success: false, message: '...', code: 'RESOURCE_NOT_FOUND' } with 404 status
```

---

### Issue: Logger Not Working

**Symptoms:**
- No log output
- Errors about logger methods

**Solutions:**

1. **Check logger import:**
```javascript
import logger from '../../infrastructure/logging/Logger.js';
// NOT from '../shared/utils/logger.js'
```

2. **Check log level:**
```javascript
// Make sure you're using correct method
logger.info('Message', { context }); // ✅
logger.log('Message'); // ❌ Wrong method
```

3. **Check logger is initialized:**
```bash
# Check if Logger.js exists
ls src/infrastructure/logging/Logger.js
```

---

**Document Status:** Complete - Ready for use during refactoring
**Next Steps:** Use alongside COMPLETE_REFACTORING_PLAN.md
**Maintenance:** Update with new patterns as discovered
