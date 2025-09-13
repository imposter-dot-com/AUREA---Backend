# AUREA Frontend Integration Guide

## 🎯 Integration Overview

Connect your React frontend to the AUREA backend API running at `http://localhost:5000`.

## 📋 Required Frontend Dependencies

```
axios (HTTP client)
react-router-dom (routing)
react-hook-form (forms)
zustand or redux (state management)
tailwindcss (styling)
react-hot-toast (notifications)
```

## 🔌 API Base Configuration

Set up axios instance with base URL and authentication interceptors.
Store JWT tokens in localStorage.
Handle 401 responses by redirecting to login.

## 🛣️ Required Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/portfolio/:slug` - View public portfolio

### Protected Routes (require authentication)
- `/dashboard` - User dashboard
- `/builder/:id` - Portfolio builder/editor
- `/settings` - User profile settings

## 🏪 State Management Structure

### Auth Store
- user (User object or null)
- isAuthenticated (boolean)
- isLoading (boolean)
- login, signup, logout functions

### Portfolio Store
- portfolios (array)
- currentPortfolio (object or null)
- isLoading (boolean)
- CRUD functions for portfolios

## 📱 Key Components Needed

### Authentication
- LoginForm
- SignupForm
- ProtectedRoute wrapper

### Portfolio Management
- PortfolioCard (dashboard display)
- PortfolioBuilder (drag-drop editor)
- SectionEditor (individual section editing)
- TemplateSelector

### UI Components
- Button, Input, Modal
- Header, Footer, Layout
- Loading indicators
- Error boundaries

## 🎨 Section Types to Support

Build editors for these portfolio sections:
- about (personal info, bio, photo)
- projects (project gallery with details)
- contact (contact information)
- skills (skill tags with levels)
- experience (work history timeline)
- education (academic background)

## 📊 Form Validation Rules

### User Registration
- name: required, 2-50 characters
- email: required, valid email format
- password: required, minimum 6 characters

### Portfolio Creation
- title: required, 1-100 characters
- template: required, select from available options
- sections: array of section objects

### Section Content
Validate based on section type requirements (see API docs for field specifications).

## 🔄 Integration Flow

1. User opens app → Load user from token if exists
2. User logs in → Store token, fetch user data
3. User creates portfolio → POST to API, update local state
4. User edits portfolio → PUT to API, update local state
5. User views portfolio → GET from API, display content
6. User publishes → Update published flag via API

## 📲 Mobile Responsiveness

Implement responsive design for:
- Mobile navigation menu
- Touch-friendly portfolio builder
- Responsive grid layouts
- Mobile-optimized forms

## 🚀 Performance Considerations

- Implement pagination for portfolio lists
- Add loading states for all API calls
- Cache user data and portfolios locally
- Implement optimistic updates for better UX
- Use React.memo for expensive components

## 🛡️ Security Implementation

- Validate all user inputs
- Sanitize portfolio content
- Implement CSRF protection
- Use HTTPS in production
- Store tokens securely
