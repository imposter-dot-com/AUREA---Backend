# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUREA Backend is a comprehensive portfolio management platform API built with Node.js, Express, and MongoDB. It enables users to create, manage, and publish professional portfolios with case studies, supporting both Vercel deployment and local subdomain hosting with Gmail-style custom subdomain selection.

**Technology Stack**: Node.js 18+, Express 5, MongoDB (Mongoose), JWT authentication, Cloudinary, Puppeteer, Google Gemini AI, Redis (optional), ES6 modules

## Common Development Commands

```bash
# Development
npm run dev                    # Start development server with nodemon
npm start                      # Start production server

# Build & Verification
npm run build                  # Run production build checks and audit

# Testing
npm test                       # Run frontend integration tests
npm run test:integration       # Run integration test suite
npm run test:user              # Test user authentication flow
node test/test-user-profile-crud.js         # Full user CRUD test suite (9 tests)
node test/test-custom-subdomain.js          # Custom subdomain feature tests (7 tests)
node test/test-vercel-deployment-improved.js # Case study generation tests
node test/test-template-system.js           # Template system tests
node test/test-publish-flow.js              # Publishing flow tests
node test/test-pdf-generation.js            # PDF generation tests

# Admin Operations
npm run admin:upgrade-premium  # Upgrade user to premium (requires user ID)

# Database Seeding
node seeds/templateSeeds.js    # Seed template data
node seeds/migratePortfolios.js # Migrate existing portfolios to new template system

# Health Check
curl http://localhost:5000/health
```

## Architecture Overview

### Core Architecture Pattern

**Status:** **80% Refactored to Clean Architecture** ✅ (October 31, 2025)

The codebase has been substantially refactored from MVC to **Clean Architecture** with clear separation of concerns:

**Request Flow**: `Route → Middleware → Thin Controller → Service (Business Logic) → Repository (Data Access) → Model → Database`

**Key Improvements:**
- ✅ **10/10 Controllers** refactored to thin pattern (< 360 lines each)
- ✅ **11 Services** created with all business logic
- ✅ **5 Repositories** for data access abstraction
- ✅ **100% Centralized Configuration** (no scattered process.env)
- ✅ **99% Structured Logging** (replaced console.log)
- ✅ **Consistent Error Handling** with custom exceptions
- ✅ **Standardized Responses** with responseFormatter

**See comprehensive documentation:**
- `NEW_ARCHITECTURE_WALKTHROUGH.md` - Complete architecture guide
- `NEW_DEVELOPER_ONBOARDING.md` - Developer onboarding (40 pages)
- `REFACTORING_BEFORE_AFTER_COMPARISON.md` - Before/after analysis
- `REFACTORING_PROGRESS.md` - Detailed progress tracking

**Key Architectural Components**:

1. **Authentication Layer**: JWT-based with optional auth support for public routes
2. **Ownership Middleware**: Ensures users can only access/modify their own resources
3. **Rate Limiting**: Endpoint-specific limits (10/min for slug checks, 5/min for publishing, 30/min for CRUD)
4. **Caching Layer**: Optional Redis with graceful degradation
5. **File Generation System**: HTML generation via `services/templateConvert.js` with responsive templates
6. **Dual Publishing Modes**:
   - Vercel deployment via `services/deploymentService.js`
   - Local subdomain hosting in `generated-files/{subdomain}/` directory

### Data Model Relationships

```
User (1) → (*) Portfolio → (*) CaseStudy
User (1) → (*) Site
Portfolio (1) → (1) Site
Portfolio (*) → (1) Template
```

**Key Models**:
- `User`: Authentication, profile, premium status, storage quotas
- `Portfolio`: Main portfolio data with flexible content structure, slug, publishing status, linked to Template
- `Template`: Dynamic template definitions with JSON schemas, versioning, and ratings
- `CaseStudy`: Linked to specific portfolio projects with structured content (hero, overview, sections)
- `Site`: Deployment records with subdomain, URLs, deployment status

### Critical Middleware Chain

All protected routes use this middleware order:
1. `auth.js` - JWT validation and user attachment to req.user
2. `validation.js` - Input validation using express-validator
3. `ownership.js` - Resource ownership verification
4. `rateLimiter.js` - Endpoint-specific rate limiting

### Gmail-Style Custom Subdomain System

**Feature**: Users can choose custom portfolio subdomains (like Gmail usernames)

**Implementation**: `src/controllers/siteController.js:subPublish()`

**Key Behavior**:
- Custom subdomain format: 3-30 lowercase letters, numbers, hyphens (regex: `/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/`)
- Ownership protection: 409 Conflict if subdomain taken by another user
- Auto-cleanup: Old folder deleted when user changes subdomain
- Fallback logic: Custom → Existing slug → Auto-generated from portfolio designer name
- File location: `generated-files/{subdomain}/index.html` + case study HTML files

**Priority Order**:
1. User-provided `customSubdomain` parameter
2. Existing `portfolio.slug` if already published
3. Auto-generated from `portfolio.content.about.name` or user data

### HTML Generation & Case Studies

**Service**: `services/templateConvert.js` (2000+ lines)

**Architecture**:
- Single function generates all files: `generateAllPortfolioFiles(portfolioData)`
- Returns object with keys: `'index.html'`, `'case-study-{projectId}.html'`
- Smart fallback logic: Uses real database content when available, professional defaults when empty
- Responsive HTML with inline CSS (no external stylesheets)

**Case Study Flow** (src/controllers/siteController.js):
1. Fetch case studies: `CaseStudy.find({ portfolioId })`
2. Convert to object keyed by projectId: `portfolioData.caseStudies[projectId] = cs.toObject()`
3. Mark projects with `hasCaseStudy: true` flag
4. Generate all HTML files including case studies
5. Save to `generated-files/{subdomain}/` directory

**Important**: Always pass complete case study objects using `cs.toObject()`, not just `cs.content`

### Authentication & Authorization

**JWT Configuration**:
- Secret: `process.env.JWT_SECRET`
- Expiration: 30 days
- Token format: `Authorization: Bearer <token>`

**Middleware Usage**:
- `auth` - Required authentication (throws 401 if no token)
- `optionalAuth` - Continues without user if no token (for public routes)

**Premium Feature System**:
- User model has `isPremium`, `premiumType` ('monthly', 'yearly', 'lifetime'), and expiration dates
- Method: `user.checkPremiumStatus()` checks active premium status
- Middleware: `src/middleware/premium.js` for premium-only routes

### File Upload System

**Cloudinary Integration**: `src/config/cloudinary.js`
- Initialized on server start via `initCloudinary()`
- Upload: `POST /api/upload/image` (multipart/form-data)
- Validation: File type (jpg, jpeg, png, webp), size limits
- Organized storage with structured paths

**Multer Configuration**: `src/middleware/upload.js`
- Temporary storage in `uploads/` directory
- Auto-cleanup after Cloudinary upload

### Error Handling Strategy

**Standardized Response Format**:
```javascript
{
  success: boolean,
  message: string,
  data?: object,
  error?: string (only in development)
}
```

**Error Handler**: `src/middleware/errorHandler.js`
- Catches all unhandled errors
- Mongoose validation errors → 400 with field details
- Development: Full error messages
- Production: Generic error messages (no stack traces)

### Database Optimization

**Strategic Indexes** (src/models/Portfolio.js):
- `{ userId: 1, createdAt: -1 }` - User portfolio listing
- `{ isPublished: 1, publishedAt: -1 }` - Public portfolio queries
- `{ userId: 1, isPublished: 1 }` - User's published portfolios
- `{ slug: 1 }` - Unique sparse index for SEO URLs

**Password Hashing** (src/models/User.js):
- Pre-save hook with bcrypt (cost factor: 12)
- Only hashes when password is modified
- Instance method: `user.comparePassword(candidatePassword)`

## Environment Configuration

**Required Variables**:
- `MONGODB_URI` - MongoDB connection string (use FULL password, no placeholders)
- `JWT_SECRET` - JWT signing secret for token generation
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Cloudinary image storage
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment: 'development' or 'production'
- `FRONTEND_URL` - Frontend URL for CORS (e.g., http://localhost:5173)

**Optional Variables**:
- `REDIS_URL` - Redis connection (gracefully degrades if unavailable)
- `VERCEL_TOKEN` - Vercel API token for deployments
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `GEMINI_API_KEY` - Google Gemini AI API key for PDF extraction features

**Note**: See `.env.example` for complete configuration template

## Common Patterns & Conventions

### Controller Response Pattern

```javascript
// Success response
res.status(200).json({
  success: true,
  message: 'Operation successful',
  data: { /* result data */ }
});

// Error response
res.status(400).json({
  success: false,
  message: 'Validation error',
  error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
});
```

### Async/Await Error Handling

All controllers use try-catch with proper error logging:
```javascript
export const controllerFunction = async (req, res) => {
  try {
    // Controller logic
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ success: false, message: 'Error message' });
  }
};
```

### Ownership Validation Pattern

```javascript
// Always validate resource ownership
const portfolio = await Portfolio.findOne({
  _id: portfolioId,
  userId: req.user._id
});

if (!portfolio) {
  return res.status(404).json({
    success: false,
    message: 'Portfolio not found or access denied'
  });
}
```

### Template System Architecture

**Dynamic Schema-Driven Templates** (see `TEMPLATE_SYSTEM_GUIDE.md` for details):

**Core Files**:
- `src/models/Template.js` - Template model with schema validation
- `src/controllers/templateController.js` - Template CRUD and validation
- `src/routes/templateRoutes.js` - 14 template endpoints
- `src/config/templateRegistry.js` - Template registration system
- `services/templateConvert.js` - HTML generation (1452 lines)
- `src/services/templateEngine.js` - PDF template rendering engine

**Key Features**:
- JSON schema definitions for template structure and validation
- Real-time content validation against template schemas
- Template versioning with semantic versioning (major.minor.patch)
- User rating system for templates
- Category and tag-based organization
- Premium template tiers

**Template Selection Priority** (for PDF generation):
1. `templateId` query parameter (explicit override)
2. Portfolio's `templateId` field
3. Portfolio's legacy `template` field
4. Default template (echelon)

### PDF Export System

**Dual PDF Generation Approach**:

1. **Template-Based Portfolio PDFs** (`src/services/templateEngine.js`):
   - Fetches rendered HTML from frontend preview pages using Puppeteer
   - Supports template-specific designs (Echelon, Serene, etc.)
   - Query parameters: `portfolioId`, `pdfMode`
   - Fallback to `templateConvert.js` if frontend unavailable

2. **Case Study PDFs** (`services/templateConvert.js`):
   - Uniform design for all case studies
   - Responsive HTML with inline CSS
   - Generated directly from database content

**PDF Endpoints** (5 total):
- `GET /api/pdf/portfolio/:id` - View portfolio PDF inline
- `GET /api/pdf/portfolio/:id/complete` - Complete PDF with all case studies
- `GET /api/pdf/portfolio/:id/download` - Force download PDF
- `GET /api/pdf/portfolio/:id/info` - PDF generation metadata
- `POST /api/pdf/cleanup` - Cleanup old PDFs (admin only)

## API Endpoint Organization

**65+ Total Endpoints across 9 route files**:

- `authRoutes.js` - Authentication (4): signup, login, me, update profile
- `userRoutes.js` - User management (13): profile CRUD, admin operations, premium status
- `portfolioRoutes.js` - Portfolio management (9): CRUD, publishing, slug checking, statistics
- `templateRoutes.js` - Template system (14): CRUD, validation, versioning, rating
- `caseStudyRoutes.js` - Case studies (6): CRUD linked to portfolios, public access
- `siteRoutes.js` - Site publishing (10): Vercel/subdomain publish, analytics, HTML serving
- `pdfRoutes.js` - PDF export (5): Portfolio/case study PDF generation and download
- `uploadRoutes.js` - File upload (2): single/batch image upload via Cloudinary
- `proposalExtract.routes.js` - AI PDF extraction (3): Gemini AI-powered document analysis

**Swagger Documentation**: `http://localhost:5000/api-docs`
- Complete API specs in `swagger.yaml` (144k+ lines)
- Interactive UI via swagger-ui-express
- Test endpoints directly from browser
- JWT token support for protected endpoints

## Known Quirks & Important Notes

1. **Environment Variable Name**: Use `MONGODB_URI` not `MONGO_URI` (common error in documentation)
2. **Password in MONGODB_URI**: Common error is using `<password>` placeholder instead of actual password
3. **Redis is Optional**: Server starts without Redis, caching is gracefully disabled
4. **ES6 Modules**: All files use `import/export`, not `require()` - important for dynamic imports
5. **Subdomain Folder Cleanup**: When subdomain changes, old folder is auto-deleted via `fs.rmSync()`
6. **Case Study Data**: Must pass `caseStudy.toObject()` not just `caseStudy.content` to template converter
7. **Slug Validation**: Portfolio slugs must be unique across all users, checked before publishing
8. **Virtual Fields**: Portfolio model has virtuals (`url`, `publicUrl`) - use `.toObject()` or `.toJSON()` to include them
9. **Rate Limiting**: Different endpoints have different rate limits - check `src/middleware/rateLimiter.js`
10. **CORS in Development**: Localhost origins are auto-allowed in development mode
11. **File Generation**: `templateConvert.js` generates all files (portfolio + case studies) in single call
12. **Template Initialization**: Templates auto-seed on first server start if database is empty
13. **HTML Serving Routes**: Portfolio HTML routes (`/:subdomain/html`) must come AFTER API routes in `server.js`
14. **Puppeteer for PDFs**: PDF generation requires Puppeteer which downloads Chromium on first install
15. **Gemini AI Optional**: PDF extraction features require `GEMINI_API_KEY`, but server runs without it

## Testing Strategy

**Test Files Location**: `test/` directory

**Key Test Suites**:
- `test-user-profile-crud.js` - Complete user CRUD operations (9 tests)
- `test-custom-subdomain.js` - Custom subdomain feature validation (7 tests)
- `test-vercel-deployment-improved.js` - HTML generation and case study verification
- `test-frontend-integration.js` - Frontend API integration tests

**Test Pattern**:
- Use unique timestamps in test data to avoid conflicts
- Clean up test data after runs
- Test both success and error cases
- Verify folder cleanup for subdomain changes

## Troubleshooting Common Issues

**MongoDB Connection Error "bad auth"**:
- Replace `<password>` with actual password in `MONGODB_URI`
- Ensure no special characters need URL encoding
- Use `MONGODB_URI` not `MONGO_URI` (correct env var name)

**Case Studies Not Showing**:
- Check `caseStudies` array is passed to `generateAllPortfolioFiles()`
- Verify using `cs.toObject()` not `cs.content`
- Check `projectId` matches between portfolio projects and case studies

**Subdomain Conflicts (409)**:
- Subdomain already taken by another user
- Check `Site.findOne({ subdomain })` for existing records
- Allow same user to update their own portfolio's subdomain

**Rate Limit Errors (429)**:
- Check endpoint-specific limits in `rateLimiter.js`
- Slug checks: 10/min, Publishing: 5/min, CRUD: 30/min

**CORS Errors**:
- Add frontend URL to `allowedOrigins` in `server.js`
- Development mode auto-allows localhost
- Check for trailing slashes in origins

## Project File Structure

```
AUREA---Backend/
├── server.js                 # Application entry point, route registration, CORS setup
├── package.json              # Dependencies and npm scripts
├── swagger.yaml              # OpenAPI 3.0 specification (144k+ lines)
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
│
├── src/
│   ├── config/               # Configuration files
│   │   ├── database.js       # MongoDB connection with error handling
│   │   ├── cloudinary.js     # Cloudinary SDK initialization
│   │   ├── swagger.js        # Swagger UI setup
│   │   └── templateRegistry.js # Template registration for PDF generation
│   │
│   ├── models/               # Mongoose schemas (5 models)
│   │   ├── User.js           # User authentication, premium status, bcrypt hooks
│   │   ├── Portfolio.js      # Portfolio with template linkage, virtuals
│   │   ├── Template.js       # Dynamic templates with JSON schemas
│   │   ├── CaseStudy.js      # Project case studies with structured content
│   │   └── Site.js           # Published sites with subdomain records
│   │
│   ├── controllers/          # Business logic layer (9 controllers)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── portfolioController.js
│   │   ├── templateController.js
│   │   ├── caseStudyController.js
│   │   ├── siteController.js    # Subdomain publishing, HTML serving
│   │   ├── pdfExportController.js
│   │   ├── uploadController.js
│   │   └── proposalExtract.genai.controller.js
│   │
│   ├── routes/               # API route definitions (9 route files)
│   │   └── [All route files map to controllers]
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.js           # JWT verification, optionalAuth for public routes
│   │   ├── ownership.js      # Resource ownership verification
│   │   ├── validation.js     # express-validator rules
│   │   ├── errorHandler.js   # Centralized error handling
│   │   ├── rateLimiter.js    # Endpoint-specific rate limits
│   │   ├── requestLogger.js  # Request/response logging
│   │   └── upload.js         # Multer configuration for file uploads
│   │
│   ├── services/             # Template rendering
│   │   └── templateEngine.js # Puppeteer-based PDF rendering from frontend
│   │
│   └── utils/                # Helper utilities
│       ├── cache.js          # Redis caching with graceful degradation
│       ├── slugGenerator.js  # Slug generation and validation
│       ├── subdomainValidator.js # Subdomain format validation
│       └── templateValidator.js  # Template schema validation
│
├── services/                 # Root-level services
│   ├── deploymentService.js  # Vercel API deployment (15k lines)
│   ├── pdfGenerationService.js # Puppeteer PDF generation (16k lines)
│   └── templateConvert.js    # HTML generation from portfolio data (1452 lines)
│
├── seeds/                    # Database seeders
│   ├── templateSeeds.js      # Initial template data
│   └── migratePortfolios.js  # Portfolio migration scripts
│
├── scripts/                  # Admin utilities
│   └── upgrade-user-to-premium.js
│
├── test/                     # Test suites
│   ├── test-user-profile-crud.js (9 tests)
│   ├── test-custom-subdomain.js (7 tests)
│   ├── test-vercel-deployment-improved.js
│   ├── test-template-system.js
│   ├── test-publish-flow.js
│   └── test-frontend-integration.js
│
├── generated-files/          # Published portfolio HTML files
│   └── {subdomain}/
│       ├── index.html
│       └── case-study-{projectId}.html
│
└── uploads/                  # Temporary file uploads (auto-cleanup)
    └── pdfs/
```

## Critical Implementation Details

### Server Initialization Sequence

The `server.js` file follows a specific initialization order that's critical to understand:

1. **Environment Setup**: `dotenv.config()` loads environment variables first
2. **Service Initialization**: Cloudinary and Redis initialize immediately after env load
3. **Database Connection**: MongoDB connects asynchronously
4. **Template Auto-Seeding**: 2-second delay, then checks if templates exist, seeds if empty
5. **Middleware Registration**: Security (Helmet) → CORS → Body Parsers → Request Logger → Rate Limiting
6. **Route Registration**: API routes registered BEFORE catch-all HTML serving routes
7. **HTML Serving**: Portfolio HTML routes (`/:subdomain/html`) registered last to avoid conflicts
8. **Error Handlers**: 404 handler and global error handler registered last

**Critical Order**: API routes MUST be registered before HTML serving routes, or API calls will be caught by the subdomain matcher.

### Portfolio HTML Serving Architecture

The system serves static HTML files generated during publishing:

**Routes**:
- `/:subdomain/html` → Main portfolio page
- `/:subdomain/case-study-:projectId.html` → Individual case study pages

**Flow**:
1. Request hits route handler in `server.js` (lines 229-292)
2. Queries database for `Site` record with matching subdomain
3. If site not found or unpublished → returns styled 404 error page
4. Constructs file path: `generated-files/{subdomain}/[filename]`
5. Checks if file exists with `fs.existsSync()`
6. If exists → serves HTML with correct Content-Type header
7. If missing → returns styled error page suggesting republish

**Error Pages**: Custom styled error pages rendered inline via `renderErrorPage()` helper function (lines 188-226).

### Swagger YAML Architecture

The `swagger.yaml` file is massive (144,647 lines) and follows OpenAPI 3.0 specification:

**Structure**:
- Complete request/response schemas for all 65+ endpoints
- Reusable component definitions for models
- Security scheme definitions (JWT Bearer tokens)
- Example requests and responses
- Validation rules and constraints

**Usage**: Accessible at `/api-docs` via swagger-ui-express, provides interactive API testing interface.

## Recent Major Changes

**Dynamic Template System** (October 2025):
- Migrated from static template files to database-driven template system
- JSON schema validation for portfolio content
- Template versioning with semantic versioning
- User rating and feedback system
- 14 new template-specific API endpoints

**Custom Subdomain Feature** (October 2025):
- Gmail-style subdomain selection with format validation
- Ownership protection prevents subdomain conflicts
- Auto-cleanup of old folders when subdomain changes
- Comprehensive test suite in `test-custom-subdomain.js`

**PDF Export System** (October 2025):
- Template-aware PDF generation using Puppeteer
- Fetches rendered HTML from frontend preview pages
- Fallback to server-side HTML generation
- Separate endpoints for portfolio and complete (with case studies) PDFs
- See `DYNAMIC_PDF_TEMPLATES.md` for architecture details

**Case Study System Enhancements**:
- Fixed data transformation to use real database content
- Smart fallback logic for empty/template values
- Responsive HTML generation with mobile optimization
- Projects automatically flagged with `hasCaseStudy: true`

**Premium Subscription System**:
- User model supports premium tiers (free, pro, enterprise)
- Premium status checking with expiration logic
- Storage quotas and limits per user

## Security Implementation

**Comprehensive security measures implemented** (October 2025):

### Critical Fixes
1. **Cloudinary Credential Protection**: Removed all API keys from frontend bundle, all uploads proxied through backend
2. **Log Sanitization**: Automatic redaction of passwords, tokens, credit cards, SSNs, emails in all logs
3. **Production CORS**: Strict origin validation, no-origin requests blocked in production

### Attack Prevention
4. **Brute Force Protection**: Progressive delays on login (5 attempts → 30 min lockout), signup (3 attempts), password reset
5. **NoSQL Injection Protection**: express-mongo-sanitize replaces `$` and `.` characters
6. **XSS Protection**: xss-clean middleware sanitizes all user input
7. **HTTP Parameter Pollution**: hpp middleware prevents duplicate parameter attacks

### Middleware Stack
- `src/middleware/logSanitizer.js` - Sanitizes 10+ sensitive data types
- `src/middleware/bruteForcePrevention.js` - 4 protection levels with Redis/memory storage
- Input sanitization applied globally in `server.js`

### Testing Security
```bash
# Test brute force (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
```

**See `SECURITY.md` for complete security documentation**

## Additional Documentation

For comprehensive guides on specific features:
- `SECURITY.md` - **NEW**: Complete security implementation guide
- `TEMPLATE_SYSTEM_GUIDE.md` - Complete template system documentation
- `DYNAMIC_PDF_TEMPLATES.md` - PDF generation architecture
- `FRONTEND_INTEGRATION_GUIDE.md` - Frontend API integration patterns
- `PDF_PERFORMANCE.md` - PDF generation optimization
- `BACKEND_IMPROVEMENTS_IMPLEMENTED.md` - Recent feature implementations
- `README.md` - User-facing documentation with 65+ endpoint reference
