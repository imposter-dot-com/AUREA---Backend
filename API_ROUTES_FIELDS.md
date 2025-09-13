# AUREA API Routes & Fields Reference

## 🌐 Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

## 🔐 Authentication Header
```
Authorization: Bearer <jwt-token>
```

---

## 📍 API Routes

### Authentication Routes

#### `POST /api/auth/signup`
**Purpose:** Register new user
**Auth Required:** No
**Fields:**
- `name` (string, required, 2-50 chars)
- `email` (string, required, valid email)
- `password` (string, required, min 6 chars)

**Returns:** User object + JWT token

#### `POST /api/auth/login`
**Purpose:** User login
**Auth Required:** No
**Fields:**
- `email` (string, required)
- `password` (string, required)

**Returns:** User object + JWT token

#### `GET /api/auth/me`
**Purpose:** Get current user profile
**Auth Required:** Yes
**Fields:** None

**Returns:** User object

#### `PUT /api/auth/me`
**Purpose:** Update user profile
**Auth Required:** Yes
**Fields:**
- `name` (string, optional)
- `email` (string, optional)

**Returns:** Updated user object

---

### Portfolio Routes

#### `POST /api/portfolios`
**Purpose:** Create new portfolio
**Auth Required:** Yes
**Fields:**
- `title` (string, required, max 100 chars)
- `template` (string, optional, default: "default")
- `sections` (array, optional, default: about/projects/contact)

**Returns:** Portfolio object

#### `GET /api/portfolios/me`
**Purpose:** Get user's portfolios
**Auth Required:** Yes
**Fields:** None
**Query Params:** None

**Returns:** Array of portfolio objects

#### `GET /api/portfolios/public`
**Purpose:** Get public portfolios
**Auth Required:** No
**Fields:** None
**Query Params:**
- `limit` (number, optional, default: 10)

**Returns:** Array of public portfolio objects

#### `GET /api/portfolios/:id`
**Purpose:** Get portfolio by ID
**Auth Required:** No (public portfolios) / Yes (private portfolios)
**Fields:** None
**URL Params:**
- `id` (ObjectId, required)

**Returns:** Portfolio object

#### `GET /api/portfolios/slug/:slug`
**Purpose:** Get portfolio by slug
**Auth Required:** No (public portfolios) / Yes (private portfolios)
**Fields:** None
**URL Params:**
- `slug` (string, required)

**Returns:** Portfolio object

#### `PUT /api/portfolios/:id`
**Purpose:** Update portfolio
**Auth Required:** Yes (owner only)
**URL Params:**
- `id` (ObjectId, required)
**Fields (all optional):**
- `title` (string, max 100 chars)
- `template` (string)
- `sections` (array)
- `published` (boolean)
- `isPublic` (boolean)
- `slug` (string, lowercase, alphanumeric + hyphens)

**Returns:** Updated portfolio object

#### `DELETE /api/portfolios/:id`
**Purpose:** Delete portfolio
**Auth Required:** Yes (owner only)
**URL Params:**
- `id` (ObjectId, required)
**Fields:** None

**Returns:** Success message

---

### Health Check

#### `GET /health`
**Purpose:** Check API status
**Auth Required:** No
**Fields:** None

**Returns:** Server status and timestamp

---

## 📊 Data Structure Fields

### User Object
```
_id: ObjectId (auto-generated)
name: string (required, 2-50 chars)
email: string (required, unique, valid email)
createdAt: Date (auto-generated)
updatedAt: Date (auto-generated)
```

### Portfolio Object
```
_id: ObjectId (auto-generated)
userId: ObjectId (reference to User, auto-set)
title: string (required, max 100 chars)
template: string (default: "default")
sections: Array of Section objects
published: boolean (default: false)
isPublic: boolean (default: false)
slug: string (auto-generated from title, optional manual override)
viewCount: number (default: 0, auto-increment)
url: string (virtual field, computed from slug)
createdAt: Date (auto-generated)
updatedAt: Date (auto-generated)
```

### Section Object
```
_id: ObjectId (auto-generated)
type: string (enum: "about", "projects", "contact", "skills", "experience", "education", "custom")
content: Object (flexible structure based on type)
```

---

## 🎨 Section Content Structures

### About Section
```
type: "about"
content: {
  title?: string
  description?: string
  image?: string (URL)
  socialLinks?: {
    linkedin?: string (URL)
    github?: string (URL)
    twitter?: string (URL)
    website?: string (URL)
  }
}
```

### Projects Section
```
type: "projects"
content: {
  projects: [
    {
      id: string (unique within projects)
      title: string
      description: string
      image?: string (URL)
      technologies: string[] (array of tech names)
      liveUrl?: string (URL)
      githubUrl?: string (URL)
      featured: boolean
    }
  ]
}
```

### Contact Section
```
type: "contact"
content: {
  email?: string
  phone?: string
  location?: string
  message?: string
  socialLinks?: Object (key-value pairs)
}
```

### Skills Section
```
type: "skills"
content: {
  skills: [
    {
      id: string (unique within skills)
      name: string
      level: number (1-100)
      category: string
    }
  ]
  categories: string[] (array of category names)
}
```

### Experience Section
```
type: "experience"
content: {
  experiences: [
    {
      id: string (unique within experiences)
      title: string (job title)
      company: string
      location?: string
      startDate: string (ISO date)
      endDate?: string (ISO date, null if current)
      current: boolean
      description: string
      technologies?: string[] (array of tech names)
    }
  ]
}
```

### Education Section
```
type: "education"
content: {
  education: [
    {
      id: string (unique within education)
      degree: string
      institution: string
      location?: string
      startDate: string (ISO date)
      endDate?: string (ISO date)
      current: boolean
      gpa?: string
      description?: string
    }
  ]
}
```

---

## 🚨 Error Response Format

All errors return:
```
{
  success: false,
  message: string (error description)
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 API Response Format

All successful responses follow:
```
{
  success: true,
  message?: string (optional success message),
  data?: Object (response data),
  count?: number (for arrays)
}
```

### Authentication Responses Include
```
data: {
  user: User object,
  token: string (JWT token)
}
```

### Portfolio Responses Include
```
data: {
  portfolio: Portfolio object
}
```
or
```
data: {
  portfolios: Portfolio[]
}
```
