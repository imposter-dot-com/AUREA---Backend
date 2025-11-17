# AUREA - Full Stack Development Guide

**Bridging Frontend & Backend Development**

This guide explains how the AUREA frontend and backend work together, how to develop features that span both systems, and best practices for full-stack development workflows.

---

## 📑 Table of Contents

1. [Quick Overview](#1-quick-overview)
2. [System Integration](#2-system-integration)
3. [Authentication Flow](#3-authentication-flow-end-to-end)
4. [Portfolio CRUD Flow](#4-portfolio-crud-flow)
5. [File Upload Flow](#5-file-upload-flow)
6. [Publishing Flow](#6-publishing-flow)
7. [Adding New Features](#7-adding-new-features-full-stack)
8. [Common Integration Patterns](#8-common-integration-patterns)
9. [Debugging Full Stack Issues](#9-debugging-full-stack-issues)
10. [Best Practices](#10-best-practices)

---

## 1. Quick Overview

### 1.1 Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│              React 19.1.1 + Vite 7.1.2                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  UI Layer (Components + Pages)                     │    │
│  │  - React components with Tailwind CSS              │    │
│  │  - Framer Motion animations                        │    │
│  │  - Form validation                                 │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  State Management (Zustand)                        │    │
│  │  - authStore: JWT token, user session             │    │
│  │  - portfolioStore: Portfolio CRUD, caching         │    │
│  │  - templateStore: Template management              │    │
│  │  - uploadStore: File upload progress              │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  API Layer (Axios + API Modules)                   │    │
│  │  - authApi, portfolioApi, templateApi, etc.        │    │
│  │  - Request/response interceptors                   │    │
│  │  - Error handling + retry logic                    │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │
                │ HTTP/HTTPS (REST API)
                │ Authorization: Bearer <JWT>
                │
┌───────────────▼──────────────────────────────────────────────┐
│                   BACKEND SERVER                             │
│              Node.js 18+ + Express 5.1.0                     │
│              Running on http://localhost:5000                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Routes (/api/auth, /api/portfolios, etc.)    │    │
│  │  - Rate limiting                                   │    │
│  │  - CORS validation                                 │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  Middleware Chain                                  │    │
│  │  - auth.js: JWT verification                       │    │
│  │  - validation.js: Input validation                 │    │
│  │  - ownership.js: Resource ownership check          │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  Controllers (Thin HTTP handlers)                  │    │
│  │  - Parse requests                                  │    │
│  │  - Delegate to services                            │    │
│  │  - Format responses                                │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  Services (Business Logic)                         │    │
│  │  - 11 service classes                              │    │
│  │  - Business rules enforcement                      │    │
│  │  - Data transformation                             │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  Repositories (Data Access)                        │    │
│  │  - 6 repository classes                            │    │
│  │  - Database abstraction                            │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐    │
│  │  Models (Mongoose Schemas)                         │    │
│  │  - User, Portfolio, Template, CaseStudy, Site      │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │
                │ Mongoose Driver
                │
┌───────────────▼──────────────────────────────────────────────┐
│                   MongoDB Atlas                              │
│              Document Database (Cloud)                       │
│                                                              │
│  Collections:                                                │
│  - users                                                     │
│  - portfolios                                                │
│  - templates                                                 │
│  - casestudies                                               │
│  - sites                                                     │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Communication Protocol

**Request/Response Format:**

```javascript
// REQUEST (Frontend → Backend)
POST http://localhost:5000/api/portfolios
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
Body:
  {
    "title": "My Portfolio",
    "templateId": "echelon",
    "content": { ... }
  }

// RESPONSE (Backend → Frontend)
Status: 201 Created
Body:
  {
    "success": true,
    "message": "Portfolio created successfully",
    "data": {
      "portfolio": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "My Portfolio",
        "userId": "507f191e810c19729de860ea",
        "templateId": "echelon",
        "content": { ... },
        "createdAt": "2025-11-14T10:30:00.000Z"
      }
    }
  }
```

**Standard Response Structure:**
```javascript
{
  success: boolean,        // Operation success
  message: string,         // Human-readable message
  data?: object,           // Result data (on success)
  error?: string,          // Error details (development only)
  errors?: array           // Validation errors (if applicable)
}
```

### 1.3 Technology Mapping

| Frontend | Backend | Purpose |
|----------|---------|---------|
| React components | Express routes | UI ↔ HTTP endpoints |
| Zustand stores | Services | State ↔ Business logic |
| Axios | Controllers | HTTP client ↔ HTTP handlers |
| localStorage | JWT | Client persistence ↔ Stateless auth |
| FormData | Multer | File uploads ↔ File handling |
| Blob URLs | Cloudinary | Preview ↔ Storage |

---

## 2. System Integration

### 2.1 Backend API Endpoints (65+)

**Base URL:** `http://localhost:5000`

**Authentication & Users (17 endpoints):**
```
POST   /api/auth/signup                    # Register new user
POST   /api/auth/login                     # Login user
GET    /api/auth/me                        # Get current user
PUT    /api/users/profile                  # Update profile
DELETE /api/users/profile                  # Delete account
POST   /api/users/admin/upgrade-premium    # Upgrade to premium
```

**Portfolios (9 endpoints):**
```
GET    /api/portfolios                     # List user portfolios
POST   /api/portfolios                     # Create portfolio
GET    /api/portfolios/:id                 # Get single portfolio
PUT    /api/portfolios/:id                 # Update portfolio
DELETE /api/portfolios/:id                 # Delete portfolio
POST   /api/portfolios/:id/publish         # Publish portfolio
POST   /api/portfolios/:id/unpublish       # Unpublish portfolio
GET    /api/portfolios/slug/:slug          # Get by slug (public)
POST   /api/portfolios/check-slug          # Check slug availability
```

**Templates (14 endpoints):**
```
GET    /api/templates                      # List all templates
GET    /api/templates/:id                  # Get template details
POST   /api/templates                      # Create template (admin)
PUT    /api/templates/:id                  # Update template
GET    /api/templates/:id/schema           # Get JSON schema
POST   /api/templates/:id/validate         # Validate content
```

**Case Studies (6 endpoints):**
```
GET    /api/case-studies/portfolio/:portfolioId  # List case studies
POST   /api/case-studies                         # Create case study
GET    /api/case-studies/:id                     # Get case study
PUT    /api/case-studies/:id                     # Update case study
DELETE /api/case-studies/:id                     # Delete case study
GET    /api/case-studies/public/:portfolioSlug/:projectId  # Public access
```

**Sites & Publishing (10 endpoints):**
```
POST   /api/sites/vercel-publish           # Deploy to Vercel
POST   /api/sites/sub-publish              # Publish to subdomain
GET    /api/sites/portfolio/:portfolioId   # Get site status
```

**File Upload (2 endpoints):**
```
POST   /api/upload/image                   # Upload to Cloudinary
DELETE /api/upload/image                   # Delete from Cloudinary
```

**PDF Export (5 endpoints):**
```
GET    /api/pdf/portfolio/:id              # Generate portfolio PDF
GET    /api/pdf/case-study/:id             # Generate case study PDF
```

### 2.2 Frontend API Modules

**Location:** `Aurea-frontend/src/lib/`

```javascript
authApi.js         → /api/auth/*
portfolioApi.js    → /api/portfolios/*
templateApi.js     → /api/templates/*
caseStudyApi.js    → /api/case-studies/*
uploadApi.js       → /api/upload/*
siteApi.js         → /api/sites/*
pdfApi.js          → /api/pdf/*
```

**Example Integration:**

```javascript
// Frontend: src/lib/portfolioApi.js
export const portfolioApi = {
  create: async (data) => {
    const response = await api.post('/api/portfolios', data);
    return response.data;
  }
};

// Backend: src/controllers/portfolioController.js
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

---

## 3. Authentication Flow (End-to-End)

### 3.1 User Registration

**Frontend → Backend → Database**

```javascript
// STEP 1: User fills signup form
// File: Aurea-frontend/src/pages/SignupPage.jsx

function SignupPage() {
  const { signup } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Call store action
    const result = await signup(
      formData.name,
      formData.email,
      formData.password
    );

    if (result.success) {
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}

// STEP 2: Store calls API
// File: Aurea-frontend/src/stores/authStore.js

signup: async (name, email, password) => {
  try {
    const response = await authApi.signup({ name, email, password });

    if (response.success) {
      // Auto-login after signup
      return await get().login(email, password);
    }

    return { success: false, error: response.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// STEP 3: API module sends HTTP request
// File: Aurea-frontend/src/lib/authApi.js

export const authApi = {
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  }
};

// STEP 4: Backend receives request
// File: AUREA---Backend/src/routes/authRoutes.js

router.post(
  '/signup',
  bruteForceProtection.signupLimiter,  // Rate limiting
  validation.signup,                    // Validation
  authController.signup                 // Controller
);

// STEP 5: Controller delegates to service
// File: AUREA---Backend/src/controllers/authController.js

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const result = await authService.signup(name, email, password);

    return responseFormatter.created(
      res,
      { user: result.user, token: result.token },
      'User registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

// STEP 6: Service contains business logic
// File: AUREA---Backend/src/core/services/AuthService.js

async signup(name, email, password) {
  // Check if user exists
  const existingUser = await this.userRepository.findByEmail(email);
  if (existingUser) {
    throw ConflictError.emailTaken(email);
  }

  // Create user (password hashed by model)
  const user = await this.userRepository.create({
    name,
    email,
    password
  });

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  logger.info('User signed up', { userId: user._id, email });

  return {
    user: { _id: user._id, name: user.name, email: user.email },
    token
  };
}

// STEP 7: Repository accesses database
// File: AUREA---Backend/src/core/repositories/UserRepository.js

async create(userData) {
  const user = await User.create(userData);
  logger.debug('User created', { userId: user._id });
  return user;
}

// STEP 8: Model hashes password
// File: AUREA---Backend/src/models/User.js

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // Hash password with bcrypt (cost factor: 12)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

**Response Flow:**
```
Database → Repository → Service → Controller → HTTP Response → API Module → Store → Component → UI Update
```

### 3.2 User Login

**Complete Flow:**

```javascript
// Frontend Component
const handleLogin = async (email, password) => {
  const result = await authStore.login(email, password);
  if (result.success) {
    navigate('/dashboard');
  }
};

// Auth Store
login: async (email, password) => {
  const response = await authApi.login({ email, password });

  if (response.success) {
    set({
      user: response.data.user,
      isAuthenticated: true
    });

    // Start 60s token expiration monitoring
    get().startTokenExpirationCheck();

    return { success: true };
  }

  return { success: false, error: response.message };
}

// Backend Service
async login(email, password) {
  const user = await this.userRepository.findByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  return { user, token };
}
```

### 3.3 Protected Routes

**Frontend Protection:**
```jsx
// Aurea-frontend/src/components/PortfolioBuilder/ProtectedRoute.jsx

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }

  return children;
};

// Usage in App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Backend Protection:**
```javascript
// AUREA---Backend/src/middleware/auth.js

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Usage in routes
router.get('/portfolios', auth, portfolioController.getUserPortfolios);
```

### 3.4 Token Management

**JWT Storage (Frontend):**
```javascript
// Stored in localStorage by authStore (persisted)
{
  state: {
    user: { ... },
    token: "eyJhbGciOiJIUzI1NiIs..." // Auto-injected in requests
  },
  version: 0
}

// Axios interceptor adds to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('aurea_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**JWT Verification (Backend):**
```javascript
// Middleware verifies on every protected request
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Decoded payload:
{
  id: "507f191e810c19729de860ea",
  email: "user@example.com",
  iat: 1731583200,  // Issued at
  exp: 1734175200   // Expires at (30 days)
}
```

---

## 4. Portfolio CRUD Flow

### 4.1 Create Portfolio (End-to-End)

**Complete Flow from UI to Database:**

```javascript
// ═══════════════════════════════════════════════════════════
// FRONTEND: User clicks "Create Portfolio"
// ═══════════════════════════════════════════════════════════

// File: Aurea-frontend/src/pages/Dashboard.jsx
function Dashboard() {
  const { createPortfolio } = usePortfolioStore();
  const { createPortfolioFromTemplate } = useTemplateStore();
  const navigate = useNavigate();

  const handleCreatePortfolio = async (templateId) => {
    // 1. Generate portfolio data from template
    const portfolioData = await createPortfolioFromTemplate(templateId);

    // 2. Create portfolio via store
    const result = await createPortfolio({
      title: 'Untitled Portfolio',
      description: '',
      ...portfolioData
    });

    if (result.success) {
      toast.success('Portfolio created!');
      navigate(`/portfolio-builder/${result.portfolio._id}`);
    } else {
      toast.error('Failed to create portfolio');
    }
  };

  return (
    <button onClick={() => handleCreatePortfolio('echelon')}>
      Create Portfolio
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// FRONTEND STORE: Business logic + API call
// ═══════════════════════════════════════════════════════════

// File: Aurea-frontend/src/stores/portfolioStore.js
createPortfolio: async (portfolioData) => {
  set({ isCreating: true });

  try {
    const response = await portfolioApi.create(portfolioData);

    // Add to portfolios array (optimistic update)
    set((state) => ({
      portfolios: [response.data.portfolio, ...state.portfolios],
      currentPortfolio: response.data.portfolio,
      isCreating: false
    }));

    return { success: true, portfolio: response.data.portfolio };
  } catch (error) {
    set({ isCreating: false });
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// API LAYER: HTTP request
// ═══════════════════════════════════════════════════════════

// File: Aurea-frontend/src/lib/portfolioApi.js
export const portfolioApi = {
  create: async (data) => {
    const response = await api.post('/api/portfolios', data);
    return response.data;
  }
};

// ═══════════════════════════════════════════════════════════
// BACKEND ROUTE: Middleware chain
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/routes/portfolioRoutes.js
router.post(
  '/',
  auth,                           // 1. Verify JWT, attach user
  rateLimiter.crudLimiter,        // 2. Rate limiting (30/min)
  validation.createPortfolio,     // 3. Validate input
  portfolioController.createPortfolio  // 4. Controller
);

// ═══════════════════════════════════════════════════════════
// BACKEND CONTROLLER: Thin HTTP handler
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/controllers/portfolioController.js
export const createPortfolio = async (req, res, next) => {
  try {
    // Delegate to service
    const portfolio = await portfolioService.createPortfolio(
      req.user._id,
      req.body
    );

    // Format response
    return responseFormatter.created(
      res,
      { portfolio },
      'Portfolio created successfully'
    );
  } catch (error) {
    next(error);  // Error middleware handles it
  }
};

// ═══════════════════════════════════════════════════════════
// BACKEND SERVICE: Business logic
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/core/services/PortfolioService.js
async createPortfolio(userId, portfolioData) {
  logger.service('PortfolioService', 'createPortfolio', { userId });

  // Business Rule: Check portfolio limit
  const count = await this.portfolioRepo.countByUserId(userId);
  const user = await this.userRepo.findById(userId);

  const limit = user.isPremium ? 50 : 5;
  if (count >= limit) {
    throw new ValidationError(
      `Portfolio limit reached. ${user.isPremium ? 'Pro' : 'Free'} users can create up to ${limit} portfolios.`
    );
  }

  // Business Rule: Validate template exists
  const template = await this.templateRepo.findById(portfolioData.templateId);
  if (!template) {
    throw new NotFoundError('Template not found');
  }

  // Create portfolio via repository
  const portfolio = await this.portfolioRepo.create({
    userId,
    title: portfolioData.title,
    description: portfolioData.description,
    templateId: portfolioData.templateId,
    content: portfolioData.content,
    styling: portfolioData.styling,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  logger.info('Portfolio created', { portfolioId: portfolio._id, userId });

  return portfolio;
}

// ═══════════════════════════════════════════════════════════
// BACKEND REPOSITORY: Database access
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/core/repositories/PortfolioRepository.js
async create(portfolioData) {
  const portfolio = await Portfolio.create(portfolioData);
  logger.debug('Portfolio created in database', { id: portfolio._id });
  return portfolio;
}

async countByUserId(userId) {
  return await Portfolio.countDocuments({ userId });
}

// ═══════════════════════════════════════════════════════════
// DATABASE: MongoDB document created
// ═══════════════════════════════════════════════════════════

/*
Document inserted into 'portfolios' collection:
{
  _id: ObjectId("673c4f8a9e7d3b2c1a4f5e6d"),
  userId: ObjectId("507f191e810c19729de860ea"),
  title: "Untitled Portfolio",
  description: "",
  templateId: "echelon",
  content: {
    hero: { title: "...", subtitle: "..." },
    about: { name: "...", bio: "..." },
    work: { projects: [...] }
  },
  styling: {
    colors: { primary: "#000", ... },
    fonts: { body: "Inter, sans-serif", ... }
  },
  isPublished: false,
  slug: null,
  createdAt: ISODate("2025-11-14T10:30:00.000Z"),
  updatedAt: ISODate("2025-11-14T10:30:00.000Z")
}
*/
```

**Response travels back up the stack:**
```
Database → Repository → Service → Controller → HTTP Response (201) → API Module → Store → Component → UI Update
```

### 4.2 Update Portfolio (With Optimistic Update)

```javascript
// Frontend Store
updatePortfolio: async (id, updates) => {
  // Store original for rollback
  const original = get().portfolios.find(p => p._id === id);

  // Optimistic update (instant UI feedback)
  set((state) => ({
    portfolios: state.portfolios.map(p =>
      p._id === id ? { ...p, ...updates } : p
    ),
    isUpdating: true
  }));

  try {
    // Send to backend
    const response = await portfolioApi.update(id, updates);

    // Update with server response
    set((state) => ({
      portfolios: state.portfolios.map(p =>
        p._id === id ? response.data.portfolio : p
      ),
      isUpdating: false
    }));

    toast.success('Portfolio updated!');
    return { success: true, data: response.data.portfolio };
  } catch (error) {
    // Rollback on error
    set((state) => ({
      portfolios: state.portfolios.map(p =>
        p._id === id ? original : p
      ),
      isUpdating: false
    }));

    toast.error('Update failed');
    return { success: false, error };
  }
}

// Backend Service
async updatePortfolio(portfolioId, userId, updates) {
  // Check ownership
  const portfolio = await this.portfolioRepo.findByIdAndUser(portfolioId, userId);
  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  // Validate template if changing
  if (updates.templateId && updates.templateId !== portfolio.templateId) {
    const template = await this.templateRepo.findById(updates.templateId);
    if (!template) {
      throw new ValidationError('Invalid template');
    }
  }

  // Update
  const updatedPortfolio = await this.portfolioRepo.update(portfolioId, {
    ...updates,
    'metadata.updatedAt': new Date()
  });

  logger.info('Portfolio updated', { portfolioId, userId });

  return updatedPortfolio;
}
```

### 4.3 Delete Portfolio

```javascript
// Frontend
deletePortfolio: async (id) => {
  if (!confirm('Delete this portfolio? This cannot be undone.')) {
    return { success: false };
  }

  // Optimistic removal
  set((state) => ({
    portfolios: state.portfolios.filter(p => p._id !== id)
  }));

  try {
    await portfolioApi.delete(id);

    toast.success('Portfolio deleted');
    return { success: true };
  } catch (error) {
    // Fetch fresh data to restore
    await get().fetchUserPortfolios(null, true);

    toast.error('Delete failed');
    return { success: false, error };
  }
}

// Backend Service
async deletePortfolio(portfolioId, userId) {
  const portfolio = await this.portfolioRepo.findByIdAndUser(portfolioId, userId);
  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  // Delete associated case studies
  await this.caseStudyRepo.deleteByPortfolio(portfolioId);

  // Delete published site if exists
  const site = await this.siteRepo.findByPortfolio(portfolioId);
  if (site) {
    await this.siteService.unpublish(portfolioId, userId);
  }

  // Delete portfolio
  await this.portfolioRepo.delete(portfolioId);

  logger.info('Portfolio deleted', { portfolioId, userId });

  return { success: true };
}
```

---

## 5. File Upload Flow

### 5.1 Image Upload (Complete Flow)

**Frontend → Backend → Cloudinary → Storage**

```javascript
// ═══════════════════════════════════════════════════════════
// FRONTEND: User selects image
// ═══════════════════════════════════════════════════════════

// File: Aurea-frontend/src/components/PortfolioBuilder/FormFields/ImageField.jsx
function ImageField({ value, onChange }) {
  const { startUpload, updateProgress, completeUpload } = useUploadStore();
  const [uploadId, setUploadId] = useState(null);

  const handleFileSelect = async (file) => {
    // 1. Create instant blob preview + start fake progress
    const id = startUpload(file);
    setUploadId(id);

    try {
      // 2. Client-side compression (60-80% size reduction)
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true  // Non-blocking
      });

      // 3. Upload to backend
      const formData = new FormData();
      formData.append('image', compressed);

      const response = await uploadApi.uploadImage(formData, (progress) => {
        // Map real progress to 30-100% range
        updateProgress(id, 30 + (progress * 0.7));
      });

      // 4. Complete upload (cleanup blob, set final URL)
      const cloudinaryUrl = response.data.url;
      completeUpload(id, cloudinaryUrl);

      // 5. Update form value
      onChange(cloudinaryUrl);

      toast.success('Image uploaded!');
    } catch (error) {
      failUpload(id, error.message);
      toast.error('Upload failed');
    }
  };

  // Show preview (blob or final URL)
  const previewUrl = uploadId ? getPreviewUrl(uploadId) : value;

  return (
    <div>
      {previewUrl && <img src={previewUrl} alt="Preview" />}

      <Dropzone onDrop={([file]) => handleFileSelect(file)}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input {...getInputProps()} accept="image/*" />
            <p>Drag & drop or click to upload</p>
          </div>
        )}
      </Dropzone>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FRONTEND API: Upload request
// ═══════════════════════════════════════════════════════════

// File: Aurea-frontend/src/lib/uploadApi.js
export const uploadApi = {
  uploadImage: async (formData, onProgress) => {
    const response = await api.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        const progress = (e.loaded / e.total) * 100;
        onProgress?.(progress);
      },
      timeout: 60000  // 60s for large files
    });

    return response.data;
  }
};

// ═══════════════════════════════════════════════════════════
// BACKEND ROUTE: File upload middleware
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/routes/uploadRoutes.js
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post(
  '/image',
  auth,
  rateLimiter.uploadLimiter,  // 10/min
  upload.single('image'),      // Parse multipart/form-data
  uploadController.uploadImage
);

// ═══════════════════════════════════════════════════════════
// BACKEND CONTROLLER: Handle upload
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/controllers/uploadController.js
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await uploadService.uploadImage(req.file.path);

    // Delete temp file
    fs.unlinkSync(req.file.path);

    return responseFormatter.success(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      },
      'Image uploaded successfully'
    );
  } catch (error) {
    // Cleanup temp file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
// BACKEND SERVICE: Cloudinary upload
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/core/services/UploadService.js
import cloudinary from 'cloudinary';

class UploadService {
  async uploadImage(filePath) {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'aurea/portfolios',  // Organize in Cloudinary
      transformation: [
        { width: 2048, height: 2048, crop: 'limit' },  // Max dimensions
        { quality: 'auto' },                            // Auto quality
        { fetch_format: 'auto' }                        // Auto format (WebP)
      ]
    });

    logger.info('Image uploaded to Cloudinary', {
      publicId: result.public_id,
      url: result.secure_url
    });

    return result;
  }

  async deleteImage(publicId) {
    await cloudinary.v2.uploader.destroy(publicId);
    logger.info('Image deleted from Cloudinary', { publicId });
  }
}

// ═══════════════════════════════════════════════════════════
// CLOUDINARY: Image stored
// ═══════════════════════════════════════════════════════════

/*
Image stored in Cloudinary with:
- URL: https://res.cloudinary.com/aurea/image/upload/v1731583200/aurea/portfolios/abc123.jpg
- Optimizations: Auto format (WebP), auto quality, max 2048px
- Responsive URLs available:
  - /w_800,h_600,c_fill/...  (800x600 cropped)
  - /w_400,h_400,c_thumb/... (400x400 thumbnail)
*/
```

**Result:**
- User sees instant preview (blob URL)
- File compresses client-side (60-80% smaller)
- Uploads to backend → Cloudinary
- Final URL replaces blob URL
- Memory cleanup (blob URL revoked)

---

## 6. Publishing Flow

### 6.1 Custom Subdomain Publishing

**Complete end-to-end publishing flow:**

```javascript
// ═══════════════════════════════════════════════════════════
// FRONTEND: User clicks "Publish"
// ═══════════════════════════════════════════════════════════

function PublishModal({ portfolioId }) {
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
    if (!subdomainRegex.test(customSubdomain)) {
      toast.error('Invalid subdomain format');
      return;
    }

    setIsPublishing(true);

    try {
      // Call API (30s timeout for HTML generation)
      const result = await siteApi.publishToSubdomain(
        portfolioId,
        customSubdomain
      );

      toast.success(`Published at: ${result.data.url}`);

      // Update portfolio store
      portfolioStore.fetchUserPortfolios(null, true);

      onClose();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Subdomain already taken');
      } else {
        toast.error('Publishing failed');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal>
      <input
        placeholder="my-portfolio"
        value={customSubdomain}
        onChange={e => setCustomSubdomain(e.target.value.toLowerCase())}
      />
      <p>.aurea.com</p>

      <button onClick={handlePublish} disabled={isPublishing}>
        {isPublishing ? 'Publishing...' : 'Publish'}
      </button>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// BACKEND: Publishing service
// ═══════════════════════════════════════════════════════════

// File: AUREA---Backend/src/core/services/SiteService.js
async publishToSubdomain(portfolioId, userId, customSubdomain) {
  logger.service('SiteService', 'publishToSubdomain', {
    portfolioId,
    customSubdomain
  });

  // 1. Fetch portfolio with case studies
  const portfolio = await this.portfolioRepo.findByIdAndUser(
    portfolioId,
    userId
  );

  if (!portfolio) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  // 2. Check subdomain availability
  const existingSite = await this.siteRepo.findBySubdomain(customSubdomain);

  if (existingSite && existingSite.userId.toString() !== userId.toString()) {
    throw ConflictError.slugTaken(customSubdomain);
  }

  // 3. Fetch case studies
  const caseStudies = await this.caseStudyRepo.findByPortfolio(portfolioId);

  // 4. Transform portfolio data
  const portfolioData = {
    ...portfolio.toObject(),
    caseStudies: {}
  };

  // Add case studies keyed by projectId
  caseStudies.forEach(cs => {
    portfolioData.caseStudies[cs.projectId] = cs.toObject();
  });

  // Mark projects with case studies
  if (portfolio.content.work?.projects) {
    portfolio.content.work.projects.forEach(project => {
      if (portfolioData.caseStudies[project.id]) {
        project.hasCaseStudy = true;
      }
    });
  }

  // 5. Generate HTML files
  const htmlFiles = templateConverter.generateAllPortfolioFiles(portfolioData);
  // Returns: { 'index.html': '...', 'case-study-project1.html': '...' }

  // 6. Save files to disk
  const outputDir = path.join('generated-files', customSubdomain);

  // Delete old folder if exists
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }

  fs.mkdirSync(outputDir, { recursive: true });

  Object.entries(htmlFiles).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(outputDir, filename), content, 'utf8');
  });

  logger.info('HTML files generated', {
    subdomain: customSubdomain,
    fileCount: Object.keys(htmlFiles).length
  });

  // 7. Update/create Site record
  let site;
  if (existingSite) {
    site = await this.siteRepo.update(existingSite._id, {
      subdomain: customSubdomain,
      urls: {
        custom: `http://localhost:5000/sites/${customSubdomain}/html`
      },
      deploymentStatus: 'published',
      lastPublishedAt: new Date()
    });
  } else {
    site = await this.siteRepo.create({
      userId,
      portfolioId,
      subdomain: customSubdomain,
      urls: {
        custom: `http://localhost:5000/sites/${customSubdomain}/html`
      },
      deploymentStatus: 'published',
      publishedAt: new Date()
    });
  }

  // 8. Mark portfolio as published
  await this.portfolioRepo.update(portfolioId, {
    isPublished: true,
    slug: customSubdomain,
    publishedAt: new Date()
  });

  logger.info('Portfolio published', { portfolioId, subdomain: customSubdomain });

  return {
    site,
    url: site.urls.custom
  };
}
```

**File Structure After Publishing:**
```
generated-files/
└── my-portfolio/
    ├── index.html                    # Main portfolio page
    ├── case-study-project1.html      # Case study 1
    └── case-study-project2.html      # Case study 2
```

**Accessing Published Portfolio:**
```
http://localhost:5000/sites/my-portfolio/html
http://localhost:5000/sites/my-portfolio/case-study-project1.html
```

---

## 7. Adding New Features (Full Stack)

### 7.1 Example: Add Portfolio Rating System

**Goal:** Users can rate portfolios 1-5 stars

**Step 1: Database Schema**
```javascript
// Backend: src/models/Portfolio.js

// Add ratings array
ratings: [{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}],

// Add virtual for average rating
ratingAverage: {
  type: Number,
  default: 0
},

ratingCount: {
  type: Number,
  default: 0
}

// Add method to calculate average
portfolioSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.ratingAverage = 0;
    this.ratingCount = 0;
  } else {
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.ratingAverage = sum / this.ratings.length;
    this.ratingCount = this.ratings.length;
  }
  return this.save();
};
```

**Step 2: Backend Repository**
```javascript
// Backend: src/core/repositories/PortfolioRepository.js

async addRating(portfolioId, userId, rating) {
  const portfolio = await Portfolio.findById(portfolioId);

  if (!portfolio) {
    return null;
  }

  // Check if user already rated
  const existingRating = portfolio.ratings.find(
    r => r.userId.toString() === userId.toString()
  );

  if (existingRating) {
    // Update existing rating
    existingRating.rating = rating;
  } else {
    // Add new rating
    portfolio.ratings.push({ userId, rating });
  }

  await portfolio.calculateAverageRating();

  return portfolio;
}
```

**Step 3: Backend Service**
```javascript
// Backend: src/core/services/PortfolioService.js

async ratePortfolio(portfolioId, userId, rating) {
  logger.service('PortfolioService', 'ratePortfolio', {
    portfolioId,
    userId,
    rating
  });

  // Validation
  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  // Can't rate own portfolio
  const portfolio = await this.portfolioRepo.findById(portfolioId);

  if (portfolio.userId.toString() === userId.toString()) {
    throw new ValidationError('Cannot rate your own portfolio');
  }

  // Add rating
  const updated = await this.portfolioRepo.addRating(
    portfolioId,
    userId,
    rating
  );

  if (!updated) {
    throw NotFoundError.resource('Portfolio', portfolioId);
  }

  logger.info('Portfolio rated', {
    portfolioId,
    userId,
    rating,
    newAverage: updated.ratingAverage
  });

  return updated;
}
```

**Step 4: Backend Controller**
```javascript
// Backend: src/controllers/portfolioController.js

export const ratePortfolio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const portfolio = await portfolioService.ratePortfolio(
      id,
      req.user._id,
      rating
    );

    return responseFormatter.success(
      res,
      {
        portfolio: {
          _id: portfolio._id,
          ratingAverage: portfolio.ratingAverage,
          ratingCount: portfolio.ratingCount
        }
      },
      'Rating submitted successfully'
    );
  } catch (error) {
    next(error);
  }
};
```

**Step 5: Backend Route**
```javascript
// Backend: src/routes/portfolioRoutes.js

router.post(
  '/:id/rate',
  auth,                        // Must be authenticated
  rateLimiter.rateLimiter,     // 10/min per user
  validation.ratePortfolio,    // Validate { rating: 1-5 }
  portfolioController.ratePortfolio
);
```

**Step 6: Frontend API Module**
```javascript
// Frontend: src/lib/portfolioApi.js

export const portfolioApi = {
  // ... existing methods

  ratePortfolio: async (id, rating) => {
    return apiRequest(
      () => api.post(`/api/portfolios/${id}/rate`, { rating }),
      'Failed to rate portfolio'
    );
  }
};
```

**Step 7: Frontend Store**
```javascript
// Frontend: src/stores/portfolioStore.js

ratePortfolio: async (id, rating) => {
  try {
    const response = await portfolioApi.ratePortfolio(id, rating);

    // Update local state
    set((state) => ({
      portfolios: state.portfolios.map(p =>
        p._id === id
          ? {
              ...p,
              ratingAverage: response.data.portfolio.ratingAverage,
              ratingCount: response.data.portfolio.ratingCount
            }
          : p
      )
    }));

    toast.success('Rating submitted!');
    return { success: true, data: response.data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to rate');
    return { success: false, error };
  }
}
```

**Step 8: Frontend Component**
```jsx
// Frontend: src/components/PortfolioCard.jsx

import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

function PortfolioRating({ portfolio }) {
  const { ratePortfolio } = usePortfolioStore();
  const { user } = useAuthStore();
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleRate = async (rating) => {
    if (!user) {
      toast.error('Please login to rate');
      return;
    }

    await ratePortfolio(portfolio._id, rating);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= (hoveredStar || portfolio.ratingAverage);

          return (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-yellow-400 hover:scale-110 transition-transform"
            >
              {filled ? (
                <StarIcon className="w-6 h-6" />
              ) : (
                <StarIconOutline className="w-6 h-6" />
              )}
            </button>
          );
        })}
      </div>

      {/* Average + count */}
      <span className="text-sm text-gray-600">
        {portfolio.ratingAverage.toFixed(1)} ({portfolio.ratingCount})
      </span>
    </div>
  );
}
```

**Result:**
- ✅ Database schema updated
- ✅ Backend API endpoint created
- ✅ Frontend API integration
- ✅ UI component with interactivity
- ✅ State management
- ✅ Validation and error handling

---

## 8. Common Integration Patterns

### 8.1 Pagination

**Backend:**
```javascript
async getUserPortfolios(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Portfolio.countDocuments({ userId })
  ]);

  return {
    portfolios,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
}
```

**Frontend:**
```jsx
function PortfolioList() {
  const [page, setPage] = useState(1);
  const [portfolios, setPortfolios] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      const response = await portfolioApi.getUserPortfolios(page, 10);
      setPortfolios(response.data.portfolios);
      setPagination(response.data.pagination);
    };

    fetchPortfolios();
  }, [page]);

  return (
    <>
      {portfolios.map(p => <PortfolioCard key={p._id} {...p} />)}

      <div className="flex gap-2">
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={!pagination?.hasPrev}
        >
          Previous
        </button>

        <span>Page {page} of {pagination?.totalPages}</span>

        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!pagination?.hasNext}
        >
          Next
        </button>
      </div>
    </>
  );
}
```

### 8.2 Real-Time Search

**Frontend with Debouncing:**
```jsx
function PortfolioSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery) => {
        if (!searchQuery) {
          setResults([]);
          return;
        }

        setIsSearching(true);

        try {
          const response = await portfolioApi.search(searchQuery);
          setResults(response.data.portfolios);
        } catch (error) {
          toast.error('Search failed');
        } finally {
          setIsSearching(false);
        }
      }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search portfolios..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {isSearching && <Spinner />}

      {results.map(p => <PortfolioCard key={p._id} {...p} />)}
    </div>
  );
}
```

**Backend with Text Index:**
```javascript
// Add text index to schema
portfolioSchema.index({
  title: 'text',
  description: 'text',
  'content.about.bio': 'text'
});

// Search method
async searchPortfolios(query, userId) {
  return await Portfolio.find({
    userId,
    $text: { $search: query }
  })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();
}
```

### 8.3 Infinite Scroll

**Frontend:**
```jsx
function InfinitePortfolioList() {
  const [portfolios, setPortfolios] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const response = await portfolioApi.getUserPortfolios(page, 10);

      setPortfolios(prev => [...prev, ...response.data.portfolios]);
      setPage(p => p + 1);
      setHasMore(response.data.pagination.hasNext);
    } catch (error) {
      toast.error('Failed to load more');
    } finally {
      setIsLoading(false);
    }
  };

  // Detect scroll near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return (
    <>
      {portfolios.map(p => <PortfolioCard key={p._id} {...p} />)}
      {isLoading && <Spinner />}
      {!hasMore && <p>No more portfolios</p>}
    </>
  );
}
```

---

## 9. Debugging Full Stack Issues

### 9.1 Common Issues & Solutions

**Issue: 401 Unauthorized**

```javascript
// Check 1: Token exists in localStorage
const token = localStorage.getItem('aurea_token');
console.log('Token:', token ? 'exists' : 'missing');

// Check 2: Token is being sent
// In browser Network tab → Request Headers:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Check 3: Token is valid (not expired)
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

console.log('Token expired:', isTokenExpired(token));

// Fix: Re-login if expired
if (isTokenExpired(token)) {
  authStore.logout();
  navigate('/login');
}
```

**Issue: CORS Error**

```javascript
// Check: Backend CORS configuration
// File: AUREA---Backend/server.js

const allowedOrigins = [
  'http://localhost:5173',      // ← Must include frontend URL
  'https://your-frontend.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

// Fix: Add frontend URL to allowedOrigins
```

**Issue: Data Not Showing After API Call**

```javascript
// Check 1: API response format
console.log('API Response:', response);

// Check 2: Response structure
// Backend sends:
{
  success: true,
  data: {
    portfolio: { ... }  // ← Data nested here
  }
}

// Frontend expects:
const portfolio = response.data.data.portfolio;  // ✅ Correct
// NOT:
const portfolio = response.data;  // ❌ Wrong

// Check 3: Store update
console.log('Store portfolios:', portfolioStore.portfolios);

// Fix: Handle multiple response formats
const portfolio = response.data?.data?.portfolio ||
                 response.data?.portfolio ||
                 response.data;
```

### 9.2 Debugging Workflow

**Step 1: Frontend Console**
```javascript
// Enable debug mode
if (import.meta.env.DEV) {
  window.DEBUG = true;
}

// Log all API calls
axios.interceptors.request.use(config => {
  if (window.DEBUG) {
    console.log('→ API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
  }
  return config;
});

axios.interceptors.response.use(
  response => {
    if (window.DEBUG) {
      console.log('← API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  error => {
    if (window.DEBUG) {
      console.error('← API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    return Promise.reject(error);
  }
);
```

**Step 2: Backend Logs**
```bash
# Watch backend logs
tail -f AUREA---Backend/logs/combined.log

# Or in development (console)
# Check for:
# - Incoming requests
# - Service method calls
# - Database queries
# - Error messages
```

**Step 3: Network Tab**
- Open DevTools → Network
- Filter: XHR/Fetch
- Check request/response for each API call
- Verify:
  - Correct URL
  - Auth header present
  - Request payload correct
  - Response status 200/201
  - Response data structure

**Step 4: Database**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://cluster.mongodb.net/aurea"

# Check data
db.portfolios.find({ userId: ObjectId("...") })
db.users.findOne({ email: "test@test.com" })
```

---

## 10. Best Practices

### 10.1 API Communication

**✅ DO:**
- Use consistent response format (success, message, data)
- Handle errors with user-friendly messages
- Show loading states during API calls
- Implement retry logic for network errors
- Validate input on both frontend and backend
- Use appropriate HTTP status codes
- Implement rate limiting
- Add request/response logging (development)

**❌ DON'T:**
- Trust client-side validation only
- Expose sensitive data in responses
- Ignore error responses
- Make API calls in render functions
- Forget to handle 401 (redirect to login)
- Return raw error messages in production

### 10.2 State Management

**✅ DO:**
- Cache API responses to reduce network calls
- Implement optimistic updates for instant feedback
- Invalidate cache after mutations
- Use stores for global state only
- Keep state normalized (avoid duplication)

**❌ DON'T:**
- Store everything in global state
- Keep stale data in cache indefinitely
- Mutate state directly
- Create circular dependencies

### 10.3 Security

**✅ DO:**
- Store JWTs in localStorage (not cookies for SPA)
- Always send JWT in Authorization header
- Validate ownership on backend (never trust client)
- Sanitize all user inputs
- Use HTTPS in production
- Implement CORS correctly
- Add rate limiting to all endpoints
- Log security events

**❌ DON'T:**
- Store sensitive data in frontend
- Trust user IDs from frontend
- Skip backend validation
- Expose internal errors to users
- Allow unlimited requests

### 10.4 Performance

**✅ DO:**
- Lazy load routes
- Debounce frequent operations (search, auto-save)
- Compress images before upload
- Use pagination for large lists
- Implement caching (frontend + backend)
- Optimize database queries (indexes)
- Use CDN for static assets

**❌ DON'T:**
- Load all data upfront
- Make redundant API calls
- Send large payloads
- Skip image optimization
- Query database without indexes

---

## ✅ Quick Reference Checklist

**When adding a new feature:**

- [ ] **Backend**: Add route with middleware (auth, validation, rate limiting)
- [ ] **Backend**: Create/update service with business logic
- [ ] **Backend**: Add repository method if needed
- [ ] **Backend**: Test with Postman/curl
- [ ] **Frontend**: Add API module method
- [ ] **Frontend**: Add store action if needed
- [ ] **Frontend**: Create/update component
- [ ] **Frontend**: Handle loading/error states
- [ ] **Frontend**: Test in browser
- [ ] **Integration**: Test full flow end-to-end
- [ ] **Docs**: Update API documentation

**When debugging:**

- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify JWT token exists and is valid
- [ ] Check backend logs for errors
- [ ] Verify database has correct data
- [ ] Test API endpoint directly (Postman)
- [ ] Check CORS configuration
- [ ] Verify environment variables

---

## 📚 Additional Resources

**Backend Documentation:**
- [Backend System Architecture](AUREA---Backend/docs/SYSTEM_ARCHITECTURE.md)
- [Backend Developer Onboarding](AUREA---Backend/docs/NEW_DEVELOPER_ONBOARDING.md)
- [API Documentation](http://localhost:5000/api-docs) (Swagger)

**Frontend Documentation:**
- [Frontend System Architecture](Aurea-frontend/docs/SYSTEM_ARCHITECTURE.md)
- [Frontend Developer Onboarding](Aurea-frontend/docs/DEVELOPER_ONBOARDING.md)
- [Quick Start Guide](Aurea-frontend/QUICK_START.md)

**Other Guides:**
- [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

**External Resources:**
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Axios Documentation](https://axios-http.com/)

---

**Happy Full Stack Development! 🚀**

If you encounter issues not covered in this guide, check the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) or reach out to the team.