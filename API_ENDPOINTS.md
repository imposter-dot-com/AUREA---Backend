# AUREA Backend API Endpoints

Complete list of all available API endpoints organized by functionality.

---

## 🔐 Authentication Routes (`/api/auth`)

### User Registration & Login
- **POST** `/api/auth/signup` - Create new user account
- **POST** `/api/auth/login` - Login with email/password
- **POST** `/api/auth/forgot-password` - Request password reset
- **POST** `/api/auth/verify-reset-token` - Verify password reset token
- **POST** `/api/auth/reset-password` - Reset password with token

### Email Verification (OTP)
- **POST** `/api/auth/send-verification-otp` - Send OTP to email
- **POST** `/api/auth/verify-email-otp` - Verify email with OTP
- **POST** `/api/auth/resend-verification-otp` - Resend verification OTP

### Login OTP (Alternative Login)
- **POST** `/api/auth/login/otp/send` - Send login OTP
- **POST** `/api/auth/login/otp/verify` - Verify login with OTP

### Google OAuth
- **GET** `/api/auth/google` - Initiate Google OAuth flow
- **GET** `/api/auth/google/callback` - Google OAuth callback
- **POST** `/api/auth/link-google` - Link Google account to existing user

### Current User
- **GET** `/api/auth/me` - Get current authenticated user

---

## 👤 User Management Routes (`/api/users`)

### Current User Profile
- **GET** `/api/users/profile` - Get current user profile with stats
- **PUT** `/api/users/profile` - Update user profile (full)
- **PATCH** `/api/users/profile` - Update user profile (partial)
- **DELETE** `/api/users/profile` - Delete own account

### Avatar Management
- **POST** `/api/users/avatar` - Upload user avatar

### Premium Status
- **GET** `/api/users/premium/status` - Check premium subscription status

### Admin User Management
- **GET** `/api/users` - Get all users (admin, with pagination)
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user by ID (admin)
- **DELETE** `/api/users/:id` - Delete user by ID (admin)

### Premium Management (Admin)
- **GET** `/api/users/:id/premium` - Get user's premium status
- **PUT** `/api/users/:id/premium` - Set premium status for user
- **DELETE** `/api/users/:id/premium` - Remove premium status

---

## 📁 Portfolio Routes (`/api/portfolios`)

### Portfolio CRUD
- **POST** `/api/portfolios` - Create new portfolio
- **GET** `/api/portfolios` - Get all portfolios (with filters)
- **GET** `/api/portfolios/:id` - Get portfolio by ID
- **PUT** `/api/portfolios/:id` - Update portfolio
- **DELETE** `/api/portfolios/:id` - Delete portfolio

### Portfolio Publishing
- **PUT** `/api/portfolios/:id/publish` - Publish portfolio
- **PUT** `/api/portfolios/:id/unpublish` - Unpublish portfolio

### Slug Management
- **GET** `/api/portfolios/check-slug/:slug` - Check if slug is available

### Public Access
- **GET** `/api/portfolios/public/:slug` - Get published portfolio by slug

### Statistics
- **GET** `/api/portfolios/stats` - Get portfolio statistics

---

## 📋 Case Study Routes (`/api/case-studies`)

### Case Study CRUD
- **POST** `/api/case-studies` - Create case study
- **GET** `/api/case-studies` - Get all case studies for user
- **GET** `/api/case-studies/:id` - Get case study by ID
- **PUT** `/api/case-studies/:id` - Update case study
- **DELETE** `/api/case-studies/:id` - Delete case study

### Public Access
- **GET** `/api/case-studies/public/:portfolioSlug/:projectId` - Get public case study

---

## 🎨 Template Routes (`/api/templates`)

### Template Browsing
- **GET** `/api/templates` - Get all templates (with filters)
- **GET** `/api/templates/:id` - Get template by ID
- **GET** `/api/templates/default` - Get default template
- **GET** `/api/templates/categories` - Get all template categories

### Template Management (Admin)
- **POST** `/api/templates` - Create new template
- **PUT** `/api/templates/:id` - Update template
- **DELETE** `/api/templates/:id` - Deactivate template

### Template Schema & Validation
- **GET** `/api/templates/:id/schema` - Get template JSON schema
- **POST** `/api/templates/:id/validate` - Validate content against schema

### Template Versions
- **POST** `/api/templates/:id/version` - Create new template version

### Template Publishing
- **PUT** `/api/templates/:id/publish` - Publish template
- **PUT** `/api/templates/:id/unpublish` - Unpublish template

### Template Ratings
- **POST** `/api/templates/:id/rating` - Add rating to template

---

## 🌐 Site Publishing Routes (`/api/sites`)

### Publishing
- **POST** `/api/sites/publish` - Publish to Vercel
- **POST** `/api/sites/sub-publish` - Publish to custom subdomain
- **DELETE** `/api/sites/unpublish/:portfolioId` - Unpublish site

### Site Management
- **GET** `/api/sites/status` - Get site deployment status
- **GET** `/api/sites/config` - Get site configuration
- **PUT** `/api/sites/config` - Update site configuration

### Analytics
- **POST** `/api/sites/analytics/view` - Record site view

### Debug & Regeneration
- **POST** `/api/sites/debug-generate` - Debug HTML generation
- **POST** `/api/sites/:portfolioId/regenerate` - Regenerate site files

### Raw HTML Access
- **GET** `/api/sites/:subdomain` - Get site details by subdomain
- **GET** `/api/sites/:subdomain/raw-html` - Get raw HTML for subdomain
- **GET** `/api/sites/:subdomain/case-study/:projectId/raw-html` - Get case study HTML
- **GET** `/api/sites/:subdomain/debug` - Debug site (auth required)

---

## 📄 PDF Export Routes (`/api/pdf`)

### Portfolio PDF Export
- **GET** `/api/pdf/portfolio/:portfolioId` - Export portfolio as PDF (view inline)
- **GET** `/api/pdf/portfolio/:portfolioId/complete` - Export complete PDF with case studies
- **GET** `/api/pdf/portfolio/:portfolioId/download` - Download portfolio PDF
- **GET** `/api/pdf/portfolio/:portfolioId/info` - Get PDF generation info

### Case Study PDF Export
- **GET** `/api/pdf/portfolio/:portfolioId/project/:projectId` - Export case study as PDF

### PDF Cleanup (Admin)
- **POST** `/api/pdf/cleanup` - Clean up old PDF files

---

## 📤 Upload Routes (`/api/upload`)

### Image Upload
- **POST** `/api/upload/single` - Upload single image to Cloudinary
- **POST** `/api/upload/multiple` - Upload multiple images

---

## 🤖 AI Proposal Extraction Routes (`/api/proposals`)

### PDF Extraction (Gemini AI)
- **POST** `/api/proposals/extract` - Extract data from proposal PDF
- **GET** `/api/proposals/history` - Get extraction history
- **GET** `/api/proposals/test-gemini` - Test Gemini AI connection

---

## 🛡️ Admin Routes (`/api/admin`)

### Dashboard Statistics
- **GET** `/api/admin/dashboard/stats` - Get comprehensive dashboard stats (excludes test users)
  - User statistics (total, this week, active, verified, growth)
  - Portfolio statistics (total, this week, published, views, growth)
  - Template statistics (total, active, clones, views, top templates)

### User Management
- **GET** `/api/admin/users/non-test` - Get list of non-test users with pagination

---

## 📊 Public HTML Routes

### Portfolio Pages
- **GET** `/:subdomain/html` - View published portfolio HTML
- **GET** `/:subdomain/case-study-:projectId.html` - View case study HTML

---

## ⚙️ System Routes

### Health Check
- **GET** `/health` - Basic health check
- **GET** `/health/puppeteer` - Puppeteer/browser health check

### Documentation
- **GET** `/api-docs` - Swagger API documentation (development only)
- **GET** `/api-docs.json` - OpenAPI JSON spec
- **GET** `/api-docs.yaml` - OpenAPI YAML spec

### Misc
- **GET** `/robots.txt` - Robots.txt for SEO
- **GET** `/favicon.ico` - Favicon (returns 204)

---

## 🔒 Authentication & Authorization

### Authentication Levels:
1. **Public** - No authentication required
2. **`auth`** - Requires JWT token (any authenticated user)
3. **`optionalAuth`** - Works with or without token
4. **`requireAdmin`** - Requires JWT token + admin role
5. **`requirePremium`** - Requires JWT token + active premium subscription

### Rate Limiting:
- **Login/Signup**: 5 attempts per hour (brute force protection)
- **Password Reset**: 3 attempts per hour
- **Slug Check**: 10 requests per minute
- **Publishing**: 5 requests per minute
- **Portfolio CRUD**: 30 requests per 15 minutes
- **Avatar Upload**: 5 requests per hour
- **Admin Routes**: 60 requests per 15 minutes
- **General API**: 100 requests per 15 minutes

---

## 📝 Request Headers

### Required Headers:
```
Content-Type: application/json
Authorization: Bearer <jwt_token>  // For protected routes
```

### CORS:
- Allowed origins configured in `server.js`
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH

---

## 🎯 Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "code": "ERROR_CODE"
}
```

### Paginated Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

## 🔢 Total Endpoint Count

- **Authentication**: 12 endpoints
- **User Management**: 13 endpoints
- **Portfolios**: 9 endpoints
- **Case Studies**: 6 endpoints
- **Templates**: 14 endpoints
- **Sites**: 10+ endpoints
- **PDF Export**: 5 endpoints
- **Upload**: 2 endpoints
- **Proposals/AI**: 3 endpoints
- **Admin**: 2 endpoints
- **System**: 5 endpoints

**Total: 80+ API endpoints**

---

## 📚 Additional Resources

- Full API documentation: `http://localhost:5000/api-docs` (development)
- Complete OpenAPI spec: `swagger.yaml` (144,000+ lines)
- Project documentation: `CLAUDE.md`
- Architecture guide: `docs/NEW_ARCHITECTURE_WALKTHROUGH.md`

---

**Base URL (Development):** `http://localhost:5000`
**Base URL (Production):** Set via `FRONTEND_URL` environment variable

**Last Updated:** November 18, 2025
