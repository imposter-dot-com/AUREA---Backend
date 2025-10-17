# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUREA Backend is a comprehensive portfolio management platform API built with Node.js, Express, and MongoDB. It enables users to create, manage, and publish professional portfolios with case studies, supporting both Vercel deployment and local subdomain hosting with Gmail-style custom subdomain selection.

**Technology Stack**: Node.js 18+, Express 5, MongoDB (Mongoose), JWT authentication, Cloudinary, Redis (optional), ES6 modules

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

# Admin Operations
npm run admin:upgrade-premium  # Upgrade user to premium (requires user ID)

# Health Check
curl http://localhost:5000/health
```

## Architecture Overview

### Core Architecture Pattern

The codebase follows a classic MVC pattern with ES6 modules:

**Request Flow**: `Route → Middleware (auth, validation, ownership, rate limiting) → Controller → Model → Database`

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
```

**Key Models**:
- `User`: Authentication, profile, premium status, storage quotas
- `Portfolio`: Main portfolio data with flexible content structure, slug, publishing status
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
- `MONGO_URI` - MongoDB connection string (use FULL password, no placeholders)
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Image upload
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - 'development' or 'production'

**Optional Variables**:
- `REDIS_URL` - Redis connection (gracefully degrades if unavailable)
- `VERCEL_TOKEN` - For Vercel deployments via API
- `FRONTEND_URL` - CORS allowed origin

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

## API Endpoint Organization

**27 Total Endpoints across 7 route files**:

- `authRoutes.js` - Authentication (3): signup, login, me
- `userRoutes.js` - User management (7): profile CRUD, admin operations
- `portfolioRoutes.js` - Portfolio management (8): CRUD, publishing, slug checking
- `caseStudyRoutes.js` - Case studies (4): CRUD linked to portfolios
- `uploadRoutes.js` - File upload (2): image upload/delete via Cloudinary
- `siteRoutes.js` - Site publishing (3): Vercel publish, sub-publish, site status
- `proposalExtract.routes.js` - PDF extraction (legacy): AI-powered document analysis

**Swagger Documentation**: `http://localhost:5000/api-docs`
- Complete API specs in `swagger.yaml`
- Interactive UI via swagger-ui-express
- Test endpoints directly from browser

## Known Quirks & Important Notes

1. **Password in MONGO_URI**: Common error is using `<password>` placeholder instead of actual password
2. **Redis is Optional**: Server starts without Redis, caching is gracefully disabled
3. **ES6 Modules**: All files use `import/export`, not `require()` - important for dynamic imports
4. **Subdomain Folder Cleanup**: When subdomain changes, old folder is auto-deleted via `fs.rmSync()`
5. **Case Study Data**: Must pass `caseStudy.toObject()` not just `caseStudy.content` to template converter
6. **Slug Validation**: Portfolio slugs must be unique across all users, checked before publishing
7. **Virtual Fields**: Portfolio model has virtuals (`url`, `publicUrl`) - use `.toObject()` or `.toJSON()` to include them
8. **Rate Limiting**: Different endpoints have different rate limits - check `src/middleware/rateLimiter.js`
9. **CORS in Development**: Localhost origins are auto-allowed in development mode
10. **File Generation**: `templateConvert.js` generates all files (portfolio + case studies) in single call

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
- Replace `<password>` with actual password in `MONGO_URI`
- Ensure no special characters need URL encoding

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

## Recent Major Changes

**Custom Subdomain Feature** (October 2025):
- Gmail-style subdomain selection with format validation
- Ownership protection prevents subdomain conflicts
- Auto-cleanup of old folders when subdomain changes
- Comprehensive test suite in `test-custom-subdomain.js`

**Case Study System Enhancements**:
- Fixed data transformation to use real database content
- Smart fallback logic for empty/template values
- Responsive HTML generation with mobile optimization
- Projects automatically flagged with `hasCaseStudy: true`

**Premium Subscription System**:
- User model supports premium tiers (free, pro, enterprise)
- Premium status checking with expiration logic
- Storage quotas and limits per user
