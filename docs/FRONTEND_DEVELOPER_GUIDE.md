# AUREA Frontend Developer Guide

**Complete Guide for Frontend Integration with Refactored Backend**

**Created:** October 31, 2025
**Backend Status:** 80% Refactored (Clean Architecture)
**Frontend Location:** `Aurea-frontend/`

---

## Table of Contents

1. [Frontend Overview](#1-frontend-overview)
2. [Backend API Integration](#2-backend-api-integration)
3. [Authentication Flow](#3-authentication-flow)
4. [State Management](#4-state-management)
5. [API Call Patterns](#5-api-call-patterns)
6. [Error Handling](#6-error-handling)
7. [Common Tasks](#7-common-tasks)
8. [Best Practices](#8-best-practices)
9. [Troubleshooting](#9-troubleshooting)
10. [Quick Reference](#10-quick-reference)

---

## 1. Frontend Overview

### Tech Stack

**Core Technologies:**
- **React 19.1.1** - UI library
- **Vite 7.1.2** - Build tool & dev server
- **Zustand** - State management
- **React Router DOM 7.9.0** - Routing with lazy loading
- **Tailwind CSS 4.1.13** - Styling
- **Framer Motion & GSAP** - Animations
- **Axios** - HTTP client

### Project Structure

```
Aurea-frontend/
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/               # Route pages (lazy loaded)
│   ├── stores/              # Zustand stores
│   │   ├── authStore.js     # Authentication state
│   │   └── portfolioStore.js # Portfolio state
│   ├── lib/                 # Libraries & utilities
│   │   └── baseApi.js       # Axios instance with interceptors
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── templates/           # Portfolio templates
│   └── App.jsx              # Main app component
├── public/                  # Static assets
├── .env                     # Environment variables
└── package.json             # Dependencies
```

### Key Directories Explained

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `components/` | Reusable UI | Button, Modal, Card, Navbar |
| `pages/` | Route pages | HomePage, PortfolioEditor, Dashboard |
| `stores/` | Global state | authStore, portfolioStore |
| `lib/` | Core libraries | API client, helpers |
| `utils/` | Utilities | formatters, validators |
| `hooks/` | Custom hooks | useAuth, usePortfolio |
| `templates/` | Portfolio templates | Echelon, Serene, Chic |

---

## 2. Backend API Integration

### Backend URL Configuration

**Environment Variables** (`.env`):
```env
# Development
VITE_API_BASE_URL=http://localhost:5000

# Production
VITE_API_BASE_URL=https://aurea-backend-production-8a87.up.railway.app

# Other Config
VITE_API_TIMEOUT=10000
```

### API Client Setup

**File:** `src/lib/baseApi.js`

```javascript
import axios from 'axios';

// Create axios instance with base configuration
const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
baseApi.interceptors.request.use(
  (config) => {
    // Get token from authStore
    const authStore = JSON.parse(
      localStorage.getItem('aurea-auth-storage') || '{}'
    );

    const token = authStore?.state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
baseApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('aurea-auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default baseApi;
```

### Understanding Backend Responses

**All backend responses follow this format:**

✅ **Success Response (200, 201):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Actual data here
  }
}
```

❌ **Error Response (400, 404, 500):**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

📄 **Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

## 3. Authentication Flow

### How Authentication Works

```
1. User signs up/logs in
   ↓
2. Backend returns JWT token (30-day expiration)
   ↓
3. Frontend stores token in authStore (persisted to localStorage)
   ↓
4. All subsequent API calls include token in Authorization header
   ↓
5. Backend validates token on each request
   ↓
6. If valid: Process request
   If expired: Return 401
   ↓
7. Frontend interceptor catches 401, redirects to login
```

### Auth Store Implementation

**File:** `src/stores/authStore.js`

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import baseApi from '../lib/baseApi';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          const response = await baseApi.post('/api/auth/login', credentials);
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({
            error: message,
            loading: false,
            isAuthenticated: false
          });

          return { success: false, error: message };
        }
      },

      signup: async (userData) => {
        set({ loading: true, error: null });

        try {
          const response = await baseApi.post('/api/auth/signup', userData);
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Signup failed';
          set({
            error: message,
            loading: false
          });

          return { success: false, error: message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Get current user (verify token)
      getCurrentUser: async () => {
        const { token } = get();

        if (!token) {
          return { success: false };
        }

        try {
          const response = await baseApi.get('/api/auth/me');
          const { user } = response.data.data;

          set({ user, isAuthenticated: true });

          return { success: true, user };
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });

          return { success: false };
        }
      },

      // Check if token is expired
      isTokenExpired: () => {
        const { token } = get();

        if (!token) return true;

        try {
          // JWT format: header.payload.signature
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000; // Convert to milliseconds

          return Date.now() >= exp;
        } catch {
          return true;
        }
      }
    }),
    {
      name: 'aurea-auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

### Using Auth Store in Components

```javascript
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    const result = await login(credentials);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Protected Routes

```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isTokenExpired } = useAuthStore();

  if (!isAuthenticated || isTokenExpired()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

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

---

## 4. State Management

### Portfolio Store

**File:** `src/stores/portfolioStore.js`

```javascript
import { create } from 'zustand';
import baseApi from '../lib/baseApi';

export const usePortfolioStore = create((set, get) => ({
  // State
  portfolios: [],
  currentPortfolio: null,
  loading: false,
  error: null,

  // Statistics
  stats: {
    total: 0,
    published: 0,
    drafts: 0
  },

  // Fetch all portfolios
  fetchPortfolios: async () => {
    set({ loading: true, error: null });

    try {
      const response = await baseApi.get('/api/portfolios');
      const portfolios = response.data.data.portfolios || [];

      // Calculate stats
      const stats = {
        total: portfolios.length,
        published: portfolios.filter(p => p.isPublished).length,
        drafts: portfolios.filter(p => !p.isPublished).length
      };

      set({
        portfolios,
        stats,
        loading: false
      });

      return { success: true, portfolios };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch portfolios';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Get single portfolio
  fetchPortfolio: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await baseApi.get(`/api/portfolios/${id}`);
      const portfolio = response.data.data.portfolio;

      set({
        currentPortfolio: portfolio,
        loading: false
      });

      return { success: true, portfolio };
    } catch (error) {
      const message = error.response?.data?.message || 'Portfolio not found';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Create portfolio
  createPortfolio: async (portfolioData) => {
    set({ loading: true, error: null });

    try {
      const response = await baseApi.post('/api/portfolios', portfolioData);
      const portfolio = response.data.data.portfolio;

      // Add to list
      set((state) => ({
        portfolios: [portfolio, ...state.portfolios],
        currentPortfolio: portfolio,
        loading: false,
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          drafts: state.stats.drafts + 1
        }
      }));

      return { success: true, portfolio };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create portfolio';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Update portfolio
  updatePortfolio: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const response = await baseApi.put(`/api/portfolios/${id}`, updates);
      const portfolio = response.data.data.portfolio;

      // Update in list
      set((state) => ({
        portfolios: state.portfolios.map(p =>
          p._id === id ? portfolio : p
        ),
        currentPortfolio: state.currentPortfolio?._id === id
          ? portfolio
          : state.currentPortfolio,
        loading: false
      }));

      return { success: true, portfolio };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update portfolio';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Delete portfolio
  deletePortfolio: async (id) => {
    set({ loading: true, error: null });

    try {
      await baseApi.delete(`/api/portfolios/${id}`);

      // Remove from list
      set((state) => ({
        portfolios: state.portfolios.filter(p => p._id !== id),
        currentPortfolio: state.currentPortfolio?._id === id
          ? null
          : state.currentPortfolio,
        loading: false,
        stats: {
          ...state.stats,
          total: state.stats.total - 1
        }
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete portfolio';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Publish portfolio
  publishPortfolio: async (id, customSubdomain) => {
    set({ loading: true, error: null });

    try {
      const response = await baseApi.post('/api/sites/sub-publish', {
        portfolioId: id,
        customSubdomain
      });

      const { site, url } = response.data.data;

      // Update portfolio in list
      set((state) => ({
        portfolios: state.portfolios.map(p =>
          p._id === id
            ? { ...p, isPublished: true, publishedAt: new Date() }
            : p
        ),
        loading: false
      }));

      return { success: true, site, url };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to publish portfolio';
      set({ error: message, loading: false });

      return { success: false, error: message };
    }
  },

  // Clear errors
  clearError: () => set({ error: null })
}));
```

### Using Portfolio Store

```javascript
import { usePortfolioStore } from '../stores/portfolioStore';
import { useEffect } from 'react';

function Dashboard() {
  const {
    portfolios,
    stats,
    loading,
    error,
    fetchPortfolios,
    deletePortfolio
  } = usePortfolioStore();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete this portfolio?')) {
      const result = await deletePortfolio(id);

      if (result.success) {
        alert('Portfolio deleted');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h1>My Portfolios</h1>

      <div className="stats">
        <div>Total: {stats.total}</div>
        <div>Published: {stats.published}</div>
        <div>Drafts: {stats.drafts}</div>
      </div>

      <div className="portfolio-grid">
        {portfolios.map(portfolio => (
          <div key={portfolio._id} className="portfolio-card">
            <h3>{portfolio.title}</h3>
            <p>{portfolio.description}</p>
            <span>{portfolio.isPublished ? 'Published' : 'Draft'}</span>

            <button onClick={() => handleDelete(portfolio._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. API Call Patterns

### Basic CRUD Operations

#### Create Portfolio

```javascript
import baseApi from '../lib/baseApi';

async function createPortfolio(portfolioData) {
  try {
    const response = await baseApi.post('/api/portfolios', {
      title: portfolioData.title,
      description: portfolioData.description,
      template: portfolioData.template || 'echelon',
      content: portfolioData.content || {}
    });

    const portfolio = response.data.data.portfolio;

    return { success: true, portfolio };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create'
    };
  }
}
```

#### Get Portfolio

```javascript
async function getPortfolio(id) {
  try {
    const response = await baseApi.get(`/api/portfolios/${id}`);
    const portfolio = response.data.data.portfolio;

    return { success: true, portfolio };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Portfolio not found'
    };
  }
}
```

#### Update Portfolio

```javascript
async function updatePortfolio(id, updates) {
  try {
    const response = await baseApi.put(`/api/portfolios/${id}`, updates);
    const portfolio = response.data.data.portfolio;

    return { success: true, portfolio };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update'
    };
  }
}
```

#### Delete Portfolio

```javascript
async function deletePortfolio(id) {
  try {
    await baseApi.delete(`/api/portfolios/${id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete'
    };
  }
}
```

### Publishing Portfolio

```javascript
async function publishToSubdomain(portfolioId, customSubdomain) {
  try {
    const response = await baseApi.post('/api/sites/sub-publish', {
      portfolioId,
      customSubdomain  // Optional, e.g., "john-portfolio"
    });

    const { site, url, summary } = response.data.data;

    return { success: true, site, url, summary };
  } catch (error) {
    // Handle specific errors
    if (error.response?.status === 409) {
      return {
        success: false,
        error: 'Subdomain already taken'
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Failed to publish'
    };
  }
}
```

### Case Studies

#### Create Case Study

```javascript
async function createCaseStudy(portfolioId, projectId, content) {
  try {
    const response = await baseApi.post('/api/case-studies', {
      portfolioId,
      projectId,
      content: {
        hero: {
          title: content.title,
          subtitle: content.subtitle,
          coverImage: content.coverImage,
          client: content.client,
          year: content.year,
          role: content.role
        },
        overview: {
          problem: content.problem,
          solution: content.solution,
          outcome: content.outcome
        },
        sections: content.sections || []
      }
    });

    const caseStudy = response.data.data.caseStudy;

    return { success: true, caseStudy };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create case study'
    };
  }
}
```

#### Get Case Studies for Portfolio

```javascript
async function getCaseStudies(portfolioId) {
  try {
    const response = await baseApi.get(`/api/case-studies/portfolio/${portfolioId}`);
    const caseStudies = response.data.data.caseStudies || [];

    return { success: true, caseStudies };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch case studies'
    };
  }
}
```

### File Upload

```javascript
async function uploadImage(file, portfolioId) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('portfolioId', portfolioId);

    const response = await baseApi.post('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const imageData = response.data.data;
    // imageData contains: { public_id, url, width, height, format }

    return { success: true, imageData };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Upload failed'
    };
  }
}
```

### PDF Export

```javascript
async function downloadPortfolioPDF(portfolioId) {
  try {
    const response = await baseApi.get(
      `/api/pdf/portfolio/${portfolioId}/download`,
      { responseType: 'blob' }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'portfolio.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download PDF'
    };
  }
}
```

---

## 6. Error Handling

### Understanding Backend Errors

**Backend error responses:**

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Common error codes:**

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `UNAUTHORIZED` | 401 | Invalid/expired token |
| `FORBIDDEN` | 403 | No permission to access |
| `RESOURCE_CONFLICT` | 409 | Duplicate resource (e.g., slug taken) |
| `SERVER_ERROR` | 500 | Backend error |

### Error Handling Pattern

```javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    return { success: true, data: response.data.data };
  } catch (error) {
    // Network error (no response from server)
    if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }

    // HTTP error codes
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return { success: false, error: message || 'Invalid request' };

      case 401:
        // Token expired - handled by interceptor
        return { success: false, error: 'Session expired' };

      case 403:
        return { success: false, error: 'Permission denied' };

      case 404:
        return { success: false, error: 'Resource not found' };

      case 409:
        return { success: false, error: message || 'Resource conflict' };

      case 429:
        return { success: false, error: 'Too many requests. Please wait.' };

      case 500:
        return { success: false, error: 'Server error. Please try again.' };

      default:
        return { success: false, error: message || 'An error occurred' };
    }
  }
}

// Usage
const result = await handleApiCall(() =>
  baseApi.post('/api/portfolios', portfolioData)
);

if (result.success) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  alert(result.error);
}
```

### Global Error Toast

```javascript
// src/utils/toast.js
import { toast } from 'react-hot-toast';

export function showError(error) {
  const message = error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
}

export function showSuccess(message) {
  toast.success(message);
}

// Usage in components
import { showError, showSuccess } from '../utils/toast';

const result = await createPortfolio(data);

if (result.success) {
  showSuccess('Portfolio created!');
} else {
  showError(result.error);
}
```

---

## 7. Common Tasks

### Task 1: Create Portfolio Editor

```javascript
import { useState } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useNavigate } from 'react-router-dom';

function PortfolioEditor() {
  const { createPortfolio, updatePortfolio, loading } = usePortfolioStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template: 'echelon',
    content: {
      about: {
        name: '',
        bio: '',
        email: '',
        phone: ''
      },
      projects: [],
      skills: []
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await createPortfolio(formData);

    if (result.success) {
      navigate(`/portfolio/${result.portfolio._id}`);
    } else {
      alert(result.error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Portfolio Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />

      <select
        value={formData.template}
        onChange={(e) => handleChange('template', e.target.value)}
      >
        <option value="echelon">Echelon</option>
        <option value="serene">Serene</option>
        <option value="chic">Chic</option>
        <option value="boldfolio">BoldFolio</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Portfolio'}
      </button>
    </form>
  );
}
```

### Task 2: Image Upload Component

```javascript
import { useState } from 'react';
import baseApi from '../lib/baseApi';

function ImageUploader({ portfolioId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('portfolioId', portfolioId);

      const response = await baseApi.post('/api/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageData = response.data.data;

      // Call parent callback with image URL
      onUploadComplete(imageData.url);

      alert('Image uploaded successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          handleFileChange(e);
          handleUpload(e);
        }}
        disabled={uploading}
      />

      {preview && (
        <img src={preview} alt="Preview" className="preview" />
      )}

      {uploading && <div>Uploading...</div>}
    </div>
  );
}

// Usage
<ImageUploader
  portfolioId={portfolioId}
  onUploadComplete={(url) => {
    console.log('Image uploaded:', url);
    // Update your portfolio content with the image URL
  }}
/>
```

### Task 3: Publish Portfolio with Subdomain

```javascript
import { useState } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';

function PublishModal({ portfolio, onClose }) {
  const { publishPortfolio } = usePortfolioStore();
  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  const validateSubdomain = (value) => {
    // Subdomain rules: 3-30 chars, lowercase, numbers, hyphens
    const regex = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
    return regex.test(value);
  };

  const handlePublish = async () => {
    if (subdomain && !validateSubdomain(subdomain)) {
      setError('Invalid subdomain format. Use lowercase letters, numbers, and hyphens.');
      return;
    }

    setPublishing(true);
    setError(null);

    const result = await publishPortfolio(portfolio._id, subdomain || null);

    if (result.success) {
      alert(`Published! View at: ${result.url}`);
      onClose();
    } else {
      setError(result.error);
    }

    setPublishing(false);
  };

  return (
    <div className="modal">
      <h2>Publish Portfolio</h2>

      <div>
        <label>Custom Subdomain (optional)</label>
        <input
          type="text"
          placeholder="my-portfolio"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
          disabled={publishing}
        />
        <small>
          Will be accessible at: /{subdomain || portfolio.slug || 'auto-generated'}/html
        </small>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button onClick={handlePublish} disabled={publishing}>
          {publishing ? 'Publishing...' : 'Publish'}
        </button>
        <button onClick={onClose} disabled={publishing}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

### Task 4: Pagination

```javascript
import { useState, useEffect } from 'react';
import baseApi from '../lib/baseApi';

function PortfolioList() {
  const [portfolios, setPortfolios] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchPortfolios = async (page = 1) => {
    setLoading(true);

    try {
      const response = await baseApi.get('/api/portfolios', {
        params: {
          page,
          limit: 10
        }
      });

      setPortfolios(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handlePageChange = (newPage) => {
    fetchPortfolios(newPage);
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="portfolio-grid">
            {portfolios.map(portfolio => (
              <div key={portfolio._id}>{portfolio.title}</div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 8. Best Practices

### DO ✅

1. **Use Zustand stores for global state**
   - Auth state
   - Portfolio list
   - User preferences

2. **Use baseApi for all HTTP requests**
   - Auto token injection
   - Consistent error handling
   - Interceptors handle 401

3. **Handle loading states**
   ```javascript
   {loading ? <Spinner /> : <Content />}
   ```

4. **Handle errors gracefully**
   ```javascript
   {error && <div className="error">{error}</div>}
   ```

5. **Validate input before API calls**
   ```javascript
   if (!title) {
     setError('Title is required');
     return;
   }
   ```

6. **Use environment variables**
   ```javascript
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   ```

7. **Clear tokens on logout**
   ```javascript
   localStorage.removeItem('aurea-auth-storage');
   ```

### DON'T ❌

1. **❌ Store sensitive data in localStorage**
   - Only store token (encrypted by backend)
   - Never store passwords

2. **❌ Make API calls without error handling**
   ```javascript
   // Bad
   const data = await baseApi.get('/api/portfolios');

   // Good
   try {
     const data = await baseApi.get('/api/portfolios');
   } catch (error) {
     // Handle error
   }
   ```

3. **❌ Forget to check authentication**
   ```javascript
   // Always check before protected operations
   if (!isAuthenticated) {
     navigate('/login');
     return;
   }
   ```

4. **❌ Hardcode API URLs**
   ```javascript
   // Bad
   fetch('http://localhost:5000/api/portfolios')

   // Good
   baseApi.get('/api/portfolios')
   ```

5. **❌ Expose tokens in console**
   ```javascript
   // Bad
   console.log('Token:', token);

   // Good
   console.log('User authenticated');
   ```

---

## 9. Troubleshooting

### Common Issues

#### Issue 1: "Network Error"

**Cause:** Backend not running or wrong URL

**Solution:**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check .env has correct URL
cat .env | grep VITE_API_BASE_URL
```

#### Issue 2: "401 Unauthorized"

**Cause:** Token expired or invalid

**Solution:**
```javascript
// Check token in localStorage
const auth = JSON.parse(localStorage.getItem('aurea-auth-storage'));
console.log('Has token:', !!auth?.state?.token);

// If expired, clear and redirect to login
localStorage.removeItem('aurea-auth-storage');
window.location.href = '/login';
```

#### Issue 3: "CORS Error"

**Cause:** Frontend URL not in backend's allowed origins

**Solution:**
1. Check backend `src/config/index.js`
2. Add your frontend URL to `cors.origins`
3. Restart backend server

#### Issue 4: "Cannot read properties of undefined"

**Cause:** API response structure changed

**Solution:**
```javascript
// Always use optional chaining
const portfolio = response.data?.data?.portfolio;

// Or provide defaults
const portfolios = response.data?.data?.portfolios || [];
```

#### Issue 5: Image Upload Fails

**Cause:** File too large or wrong format

**Solution:**
```javascript
// Validate before upload
if (file.size > 10 * 1024 * 1024) {
  alert('File must be < 10MB');
  return;
}

if (!file.type.startsWith('image/')) {
  alert('Must be an image');
  return;
}
```

---

## 10. Quick Reference

### Environment Variables

```env
# Required
VITE_API_BASE_URL=http://localhost:5000

# Optional
VITE_API_TIMEOUT=10000
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### API Endpoints Quick List

**Auth:**
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Portfolios:**
- `POST /api/portfolios` - Create
- `GET /api/portfolios` - List (user's)
- `GET /api/portfolios/:id` - Get single
- `PUT /api/portfolios/:id` - Update
- `DELETE /api/portfolios/:id` - Delete

**Publishing:**
- `POST /api/sites/sub-publish` - Publish to subdomain
- `POST /api/sites/publish` - Publish to Vercel

**Case Studies:**
- `POST /api/case-studies` - Create
- `GET /api/case-studies/portfolio/:portfolioId` - Get by portfolio

**Upload:**
- `POST /api/upload/single` - Upload image

**PDF:**
- `GET /api/pdf/portfolio/:id/download` - Download PDF

### Common Imports

```javascript
// State management
import { useAuthStore } from './stores/authStore';
import { usePortfolioStore } from './stores/portfolioStore';

// API client
import baseApi from './lib/baseApi';

// Routing
import { useNavigate, useParams } from 'react-router-dom';

// React
import { useState, useEffect } from 'react';
```

### Response Format Reference

```javascript
// Success
{
  success: true,
  message: "Success message",
  data: { ... }
}

// Error
{
  success: false,
  message: "Error message",
  code: "ERROR_CODE"
}

// Paginated
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 45,
    pages: 5
  }
}
```

---

## Conclusion

This guide covers everything you need to integrate the frontend with the refactored AUREA backend:

- ✅ Backend API integration
- ✅ Authentication flow
- ✅ State management with Zustand
- ✅ API call patterns
- ✅ Error handling
- ✅ Common tasks with examples
- ✅ Best practices
- ✅ Troubleshooting

**Next Steps:**
1. Set up environment variables
2. Configure API client
3. Implement auth store
4. Build portfolio CRUD
5. Test all flows
6. Handle errors gracefully

**Need Help?**
- Backend API: See `NEW_ARCHITECTURE_WALKTHROUGH.md`
- Backend endpoints: `http://localhost:5000/api-docs`
- Questions: Check backend team documentation

**Happy coding! 🚀**

---

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Maintained By:** AUREA Development Team
