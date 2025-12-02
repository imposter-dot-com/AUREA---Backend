# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUREA Backend is a Node.js/Express 5.1.0 API with MongoDB for the portfolio builder platform. It provides 65+ endpoints for portfolio management, template system, case studies, PDF generation, and dual publishing (Vercel + custom subdomain).

**Tech Stack**: Node.js 18+, Express 5.1.0, MongoDB/Mongoose 8.18.1, JWT auth, Cloudinary, Puppeteer, Redis (optional), ES6 modules

## Development Commands

```bash
# Development
npm install && npm run dev          # Start with nodemon (port 5000)
npm start                           # Production server

# Testing (19 test files)
npm test                            # Frontend integration tests
npm run test:integration            # Full integration suite
node test/test-user-profile-crud.js # User CRUD (9 tests)
node test/test-custom-subdomain.js  # Subdomain feature (7 tests)
node test/test-template-system.js   # Template validation
node test/test-pdf-generation.js    # PDF generation
node test/test-full-authentication.js # Auth flow

# Admin Scripts
npm run admin:upgrade-premium       # Upgrade user to premium
npm run admin:clear-brute-force     # Clear brute force records
npm run admin:create-user           # Create test user
npm run admin:debug-login           # Debug login issues

# Database
node seeds/templateSeeds.js         # Seed templates
node seeds/migratePortfolios.js     # Migrate portfolios

# Health check
curl http://localhost:5000/health
```

## Architecture (Clean Architecture - 80% Complete)

### Request Flow
```
HTTP Request → Routes → Middleware Chain → Controller (thin) → Service (logic) → Repository (data) → MongoDB
```

### Directory Structure (83 source files)
```
src/
├── controllers/              # 10 thin HTTP handlers (< 360 lines each)
│   ├── authController.js
│   ├── userController.js
│   ├── portfolioController.js
│   ├── templateController.js
│   ├── caseStudyController.js
│   ├── siteController.js
│   ├── pdfExportController.js
│   ├── uploadController.js
│   ├── adminController.js
│   └── proposalExtract.controller.js
│
├── routes/                   # 10 route files (65+ endpoints)
│   ├── authRoutes.js         # signup, login, me, refresh
│   ├── userRoutes.js         # profile, storage, stats
│   ├── portfolioRoutes.js    # CRUD, publishing
│   ├── templateRoutes.js     # template CRUD, validation, rating
│   ├── caseStudyRoutes.js    # case study CRUD
│   ├── siteRoutes.js         # Vercel/subdomain publishing (13k lines)
│   ├── pdfRoutes.js          # PDF generation
│   ├── uploadRoutes.js       # Cloudinary upload
│   ├── adminRoutes.js        # admin operations
│   └── proposalExtract.routes.js
│
├── middleware/               # 11 middleware files
│   ├── auth.js               # JWT verification, optionalAuth
│   ├── validation.js         # express-validator rules
│   ├── ownership.js          # resource ownership checks
│   ├── errorHandler.js       # global error handling
│   ├── rateLimiter.js        # endpoint-specific limits
│   ├── requestLogger.js      # request/response logging
│   ├── logSanitizer.js       # sensitive data redaction
│   ├── bruteForcePrevention.js # login protection (8k lines)
│   ├── upload.js             # Multer configuration
│   ├── premium.js            # premium feature access
│   └── admin.js              # admin-only protection
│
├── models/                   # 5 Mongoose schemas
│   ├── User.js               # auth, profile, premium, storage
│   ├── Portfolio.js          # content, slug, template link
│   ├── Template.js           # schema, version, rating
│   ├── CaseStudy.js          # hero, content, sections
│   └── Site.js               # subdomain, vercelURL, status
│
├── core/
│   ├── services/             # 13 service classes (business logic)
│   │   ├── AuthService.js          # 20.7k lines - auth, JWT, 2FA
│   │   ├── PortfolioService.js     # 21k lines - CRUD, publishing
│   │   ├── TemplateService.js      # 8.6k lines - template ops
│   │   ├── CaseStudyService.js     # 9.4k lines - case study ops
│   │   ├── SiteService.js          # 36.4k lines - publishing
│   │   ├── SubdomainService.js     # 13.2k lines - subdomain logic
│   │   ├── UserService.js          # 13.8k lines - user management
│   │   ├── AdminService.js         # 13.9k lines - admin ops
│   │   ├── PremiumService.js       # 5.9k lines - premium features
│   │   ├── PDFExportService.js     # 8.6k lines - PDF generation
│   │   ├── UploadService.js        # 3.6k lines - Cloudinary
│   │   └── ProposalExtractService.js # Gemini AI extraction
│   │
│   └── repositories/         # 6 data access layers
│       ├── UserRepository.js
│       ├── PortfolioRepository.js
│       ├── TemplateRepository.js
│       ├── CaseStudyRepository.js
│       ├── SiteRepository.js
│       └── PDFRepository.js
│
├── shared/
│   ├── exceptions/           # 8 custom error classes
│   │   ├── ApplicationError.js   # Base class with HTTP mapping
│   │   ├── ValidationError.js    # 400
│   │   ├── UnauthorizedError.js  # 401
│   │   ├── ForbiddenError.js     # 403
│   │   ├── NotFoundError.js      # 404
│   │   ├── ConflictError.js      # 409
│   │   └── ServiceError.js       # Custom business errors
│   ├── constants/
│   │   ├── httpStatus.js
│   │   └── errorCodes.js
│   └── utils/
│       └── responseFormatter.js  # Standardized responses
│
├── infrastructure/
│   ├── logging/Logger.js         # 5k lines - structured logging
│   ├── pdf/BrowserPool.js        # 14k lines - Puppeteer pooling
│   ├── cache/PDFCache.js         # 9.5k lines - PDF caching
│   └── email/EmailService.js     # Nodemailer
│
├── config/
│   ├── index.js              # Centralized config (USE THIS)
│   ├── database.js           # MongoDB connection
│   ├── cloudinary.js         # Cloudinary setup
│   ├── passport.js           # OAuth strategies
│   ├── swagger.js            # Swagger UI
│   └── templateRegistry.js   # Template registration
│
└── utils/
    ├── cache.js              # Redis with memory fallback
    ├── slugGenerator.js      # URL-safe slugs
    ├── subdomainValidator.js # 5.7k lines - validation
    └── templateValidator.js  # 11k lines - schema validation

services/                     # Root-level legacy services (being migrated)
├── templateConvert.js        # 98k lines - HTML generation
├── pdfGenerationService.js   # 19.6k lines - PDF with Puppeteer
└── deploymentService.js      # 15.5k lines - Vercel deployment
```

## Key Patterns

### 1. Thin Controllers (HTTP I/O only)
```javascript
export const createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(req.user._id, req.body);
    return responseFormatter.created(res, { portfolio }, 'Portfolio created');
  } catch (error) {
    next(error);
  }
};
```

### 2. Custom Exceptions (throw, don't return)
```javascript
import { NotFoundError, ConflictError } from '../shared/exceptions/index.js';

if (!portfolio) throw NotFoundError.resource('Portfolio', portfolioId);
if (slugTaken) throw ConflictError.slugTaken(slug);
```

### 3. Response Formatting
```javascript
import responseFormatter from '../shared/utils/responseFormatter.js';

responseFormatter.success(res, data, 'Success');
responseFormatter.created(res, data, 'Created');
responseFormatter.paginated(res, items, { page, limit, total });
```

### 4. Structured Logging (no console.log)
```javascript
import logger from '../infrastructure/logging/Logger.js';

logger.info('Portfolio created', { portfolioId, userId });
logger.error('Database error', { error, context });
logger.service('PortfolioService', 'create', { userId });
```

### 5. Centralized Config
```javascript
import config from '../config/index.js';
// NOT: process.env.JWT_SECRET
```

### 6. Repository Pattern
```javascript
class PortfolioService {
  async getPortfolio(id) {
    const portfolio = await this.repository.findById(id);
    if (!portfolio) throw NotFoundError.resource('Portfolio', id);
    return portfolio;
  }
}
```

## Database Schema

```
User (1) → (*) Portfolio → (*) CaseStudy
User (1) → (*) Site
Portfolio (1) → (1) Site
Portfolio (*) → (1) Template

Strategic Indexes:
- { userId: 1, createdAt: -1 }     # User portfolio listing
- { isPublished: 1, publishedAt: -1 } # Public portfolios
- { slug: 1 }                      # Unique sparse for SEO
```

## Middleware Chain

Protected routes use this order:
1. `auth.js` - JWT validation, attach req.user
2. `validation.js` - express-validator rules
3. `ownership.js` - resource ownership check
4. `rateLimiter.js` - endpoint-specific limits

## API Endpoints (65+ Total)

**Swagger**: http://localhost:5000/api-docs

| Route | Endpoints | Purpose |
|-------|-----------|---------|
| `/api/auth/*` | 4 | signup, login, me, refresh |
| `/api/users/*` | 13 | profile, storage, stats |
| `/api/portfolios/*` | 9 | CRUD, publishing, slug checking |
| `/api/templates/*` | 14 | CRUD, validation, rating |
| `/api/case-studies/*` | 6 | CRUD linked to portfolios |
| `/api/sites/*` | 10 | Vercel/subdomain publishing |
| `/api/pdf/*` | 5 | PDF generation/download |
| `/api/upload/*` | 2 | Cloudinary upload |
| `/api/admin/*` | varies | User/system management |

## Critical Implementation Details

### Custom Subdomain Publishing
```javascript
// Regex: Gmail-style validation
/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/

// Flow: validate → check ownership → generate HTML → save files
// Files: generated-files/{subdomain}/index.html + case-study-{id}.html
// Auto-cleanup when subdomain changes
```

### Case Study Integration
```javascript
// CRITICAL: Pass full object, not just .content
portfolioData.caseStudies[projectId] = caseStudy.toObject(); // ✅
// NOT: caseStudy.content ❌
```

### HTML Generation
`services/templateConvert.js` (98k lines) generates all portfolio files:
```javascript
const files = generateAllPortfolioFiles(portfolioData);
// Returns: { 'index.html': '...', 'case-study-{id}.html': '...' }
```

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://user:PASSWORD@cluster.mongodb.net/aurea
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional
REDIS_URL=redis://localhost:6379
VERCEL_TOKEN=your-vercel-token
GEMINI_API_KEY=your-gemini-key
PDF_BROWSER_POOL_SIZE=3
PDF_BROWSER_IDLE_TIMEOUT=300000
```

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Slug checks | 10/minute |
| Publishing | 5/minute |
| CRUD operations | 30/minute |
| Login attempts | 5 attempts → 30 min lockout |

## Security

- **JWT**: 30-day expiry, Bearer token format
- **Passwords**: Bcrypt (cost factor 12)
- **Brute Force**: Progressive delays, lockout after 5 attempts
- **Log Sanitization**: Auto-redaction of passwords, tokens, emails
- **Headers**: Helmet.js with CSP, X-Frame-Options, HSTS
- **Rate Limiting**: Endpoint-specific
- **Express 5 Note**: `express-mongo-sanitize` and `xss-clean` disabled (incompatible)

## Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB "bad auth" | Replace `<password>` with actual password in MONGODB_URI |
| 409 Subdomain conflict | Subdomain taken by another user |
| Case studies show template data | Use `cs.toObject()` not `cs.content` |
| 429 Rate limit | Check rateLimiter.js for limits |
| Redis connection failed | Server continues with memory cache fallback |

## Debugging

```bash
# Server logs
tail -f logs/combined.log

# Test endpoint with auth
curl -X GET http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check health
curl http://localhost:5000/health

# Swagger docs
open http://localhost:5000/api-docs
```

## Key Dependencies

- **express 5.1.0** - Web framework (some middleware incompatible)
- **mongoose 8.18.1** - MongoDB ODM
- **jsonwebtoken 9.0.2** - JWT auth
- **bcrypt 6.0.0** - Password hashing
- **cloudinary 2.7.0** - Image storage
- **puppeteer 24.25.0** - PDF generation
- **express-validator 7.2.1** - Input validation
- **helmet 8.0.0** - Security headers
- **express-rate-limit 7.4.0** - Rate limiting
- **redis 4.7.0** - Caching (optional)
- **@google/genai 1.21.0** - Gemini AI
