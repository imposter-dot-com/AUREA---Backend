# Template System Guide

## Executive Summary

The **Template Management System** is a sophisticated backend infrastructure that enables dynamic portfolio template creation, validation, and distribution without requiring code deployments. This system transforms templates from static code files into dynamic, schema-driven data entities that can be created, versioned, and validated at runtime.

### Key Capabilities

- **Dynamic Template Storage**: Templates stored as structured data with comprehensive schemas
- **Real-time Validation**: Content validated against template schemas before saving
- **Version Control**: Full versioning system with rollback capabilities
- **Rating System**: User-driven template ratings and feedback
- **Category Management**: Organized template library with tags and categories
- **Premium Tiers**: Support for free and premium templates
- **Usage Analytics**: Track template popularity and adoption

---

## What's New

### ✨ Major Features Implemented

1. **Schema-Driven Architecture**
   - Complete field definitions with types, validations, and UI hints
   - Section-based structure with variants and styling options
   - Support for nested objects, arrays, and complex data types

2. **Content Validation Engine**
   - Validates required fields and data types
   - Enforces constraints (min/max length, patterns, allowed formats)
   - Provides detailed error messages for debugging

3. **Template Versioning**
   - Semantic versioning (major.minor.patch)
   - Version history with changelogs
   - Backward compatibility support

4. **Advanced API**
   - 14 RESTful endpoints for complete template management
   - Filtering by category, tags, and premium status
   - Lightweight schema-only endpoints for performance

5. **Admin Controls**
   - Template creation and modification
   - Version management
   - Activation/deactivation
   - Usage analytics

---

## Architecture

### System Flow

```
┌────────────────────────────────────────────────────────────┐
│                  TEMPLATE LIFECYCLE                         │
└────────────────────────────────────────────────────────────┘

1. TEMPLATE CREATION (Admin)
   ┌──────────────────────────────────┐
   │ POST /api/templates              │
   │ - Submit template schema         │
   │ - Include sections, fields       │
   │ - Define validation rules        │
   └──────────────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │ Backend Validation               │
   │ - Verify required fields         │
   │ - Validate field types           │
   │ - Check section structure        │
   └──────────────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │ Store in Database                │
   │ - Assign version 1.0.0           │
   │ - Generate unique templateId     │
   │ - Set as active                  │
   └──────────────────────────────────┘

2. TEMPLATE DISCOVERY (User)
   ┌──────────────────────────────────┐
   │ GET /api/templates               │
   │ - Browse templates               │
   │ - Filter by category/tags        │
   │ - View ratings & popularity      │
   └──────────────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │ GET /api/templates/:id           │
   │ - Fetch full template details    │
   │ - Increment usage counter        │
   └──────────────────────────────────┘

3. CONTENT VALIDATION (User)
   ┌──────────────────────────────────┐
   │ POST /api/templates/:id/validate │
   │ - Submit portfolio content       │
   │ - Validate against schema        │
   │ - Receive detailed errors        │
   └──────────────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │ POST /api/portfolios             │
   │ - Create portfolio               │
   │ - Attach templateId & version    │
   │ - Store validated content        │
   └──────────────────────────────────┘

4. TEMPLATE RATING (User)
   ┌──────────────────────────────────┐
   │ POST /api/templates/:id/rating   │
   │ - Submit rating (1-5)            │
   │ - Update average & count         │
   └──────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Template    │  │   Portfolio  │  │    Content   │      │
│  │   Selector   │  │    Editor    │  │  Validator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      REST API LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Template Routes (/api/templates)                    │   │
│  │  - Public: GET, categories, default                  │   │
│  │  - Auth: validate, rating                            │   │
│  │  - Admin: POST, PUT, DELETE, version                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   TEMPLATE CONTROLLER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic                                      │   │
│  │  - Template CRUD operations                          │   │
│  │  - Content validation                                │   │
│  │  - Rating calculations                               │   │
│  │  - Usage tracking                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     TEMPLATE MODEL                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Schema Definition & Methods                         │   │
│  │  - validateContent()                                 │   │
│  │  - incrementUsage()                                  │   │
│  │  - addRating()                                       │   │
│  │  - createNewVersion()                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  templates collection                                │   │
│  │  - Indexed by: templateId, category, tags           │   │
│  │  - Optimized queries for filtering & search          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Template Model Structure

```javascript
{
  // ============================================
  // IDENTIFICATION
  // ============================================
  templateId: String,        // Unique ID (e.g., 'echelon', 'modern-bold')
  name: String,              // Display name (e.g., 'Echelon')
  slug: String,              // URL-friendly slug
  description: String,       // Brief description (max 500 chars)

  // ============================================
  // CATEGORIZATION
  // ============================================
  category: String,          // Enum: creative, modern, classic, minimal,
                            //       professional, artistic, portfolio, business
  tags: [String],           // Searchable tags (e.g., ['minimal', 'typography'])

  // ============================================
  // TEMPLATE SCHEMA (THE CORE)
  // ============================================
  schema: {
    sections: [              // Array of section definitions
      {
        id: String,          // Section identifier (e.g., 'hero', 'about')
        type: String,        // Section type (e.g., 'hero', 'gallery', 'text')
        variant: String,     // Visual variant (e.g., 'centered-large')
        name: String,        // Display name
        description: String, // Section description
        order: Number,       // Display order
        required: Boolean,   // Can section be deleted?
        styling: {           // Section-specific styling
          background: String,
          backgroundColor: String,
          height: String,
          padding: String
        },
        fields: [            // Field definitions within section
          {
            id: String,      // Field identifier (e.g., 'title', 'bio')
            type: String,    // Field type: text, textarea, richtext, email,
                            //   url, tel, number, array, object, checkbox,
                            //   toggle, image, video, file, select
            label: String,   // Display label
            placeholder: String,  // Placeholder text
            required: Boolean,    // Is field required?
            validation: {         // Validation rules
              minLength: Number,
              maxLength: Number,
              min: Number,
              max: Number,
              pattern: String,    // Regex pattern
              allowedFormats: [String],  // For files/images
              options: [String]   // For select/radio
            },
            uiHints: {           // UI rendering hints
              helpText: String,
              order: Number
            }
          }
        ]
      }
    ],
    styling: {               // Global template styling
      theme: {
        primary: String,     // Color values
        secondary: String,
        accent: String,
        background: String,
        surface: String,
        text: String,
        textSecondary: String
      },
      typography: {
        headingFont: String,
        bodyFont: String,
        monoFont: String,
        scale: String        // 'default', 'compact', 'comfortable'
      },
      spacing: String,       // 'tight', 'default', 'relaxed'
      borderRadius: String   // 'none', 'minimal', 'rounded', 'full'
    },
    layout: {
      maxWidth: String,      // e.g., '1200px'
      columns: Number,       // Grid columns (typically 12)
      gutter: String         // e.g., '24px'
    }
  },

  // ============================================
  // CASE STUDY SCHEMA (Optional)
  // ============================================
  caseStudySchema: {         // Similar structure to main schema
    enabled: Boolean,
    fields: [...]            // Field definitions for case studies
  },

  // ============================================
  // PREVIEW & ASSETS
  // ============================================
  thumbnail: String,         // Main thumbnail URL (required)
  previewImages: [String],   // Gallery of preview images
  demoUrl: String,           // Live demo URL (optional)

  // ============================================
  // VERSIONING
  // ============================================
  version: String,           // Current version (e.g., '1.0.0')
  versionHistory: [          // Previous versions
    {
      version: String,
      schema: Object,        // Schema snapshot
      publishedAt: Date,
      changelog: String
    }
  ],

  // ============================================
  // FEATURES & COMPATIBILITY
  // ============================================
  features: [String],        // Feature list (e.g., 'dark-mode', 'responsive')
  requiredPlugins: [         // Plugin dependencies
    {
      name: String,
      version: String
    }
  ],
  compatibility: {           // Frontend version requirements
    minFrontendVersion: String,
    maxFrontendVersion: String
  },

  // ============================================
  // STATUS & METADATA
  // ============================================
  isActive: Boolean,         // Is template available?
  isDefault: Boolean,        // Is this the default template?
  isPremium: Boolean,        // Premium status

  // ============================================
  // USAGE TRACKING
  // ============================================
  usageCount: Number,        // How many times used
  rating: {
    average: Number,         // Average rating (0-5)
    count: Number            // Number of ratings
  },

  // ============================================
  // OWNERSHIP
  // ============================================
  createdBy: String,         // Creator user ID
  updatedBy: String,         // Last updater user ID

  // ============================================
  // TIMESTAMPS (Automatic)
  // ============================================
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes for Performance

```javascript
// Single field indexes
templateId: 1           // Unique lookup
slug: 1                 // Unique lookup
category: 1             // Filter by category
isActive: 1             // Filter active templates
tags: 1                 // Search by tags

// Compound indexes
{ templateId: 1, version: 1 }        // Version lookup
{ category: 1, isActive: 1 }         // Active by category
{ usageCount: -1 }                   // Sort by popularity
{ 'rating.average': -1 }             // Sort by rating
```

---

## API Reference

### Base URL

```
http://localhost:5000/api/templates
```

### Authentication

Most endpoints support optional authentication. Admin endpoints require authentication with admin role.

```javascript
// Include JWT token in headers
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

### 1. Get All Templates

Retrieve a list of all active templates with optional filtering.

**Endpoint:** `GET /api/templates`

**Authentication:** Optional

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| category | String | Filter by category | `?category=minimal` |
| isPremium | Boolean | Filter premium status | `?isPremium=true` |
| tags | String | Comma-separated tags | `?tags=modern,clean` |

**Example Request:**

```javascript
// Get all templates
const response = await axios.get('/api/templates');

// Filter minimal templates
const response = await axios.get('/api/templates?category=minimal');

// Filter by tags
const response = await axios.get('/api/templates?tags=modern,professional');
```

**Example Response:**

```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": [
    {
      "_id": "6501234567890abcdef12345",
      "templateId": "echelon",
      "name": "Echelon",
      "slug": "echelon",
      "description": "A minimalist portfolio template with focus on typography",
      "category": "classic",
      "tags": ["minimal", "typography", "classic"],
      "thumbnail": "https://example.com/echelon-thumb.jpg",
      "previewImages": ["https://example.com/preview1.jpg"],
      "demoUrl": "https://demo.example.com/echelon",
      "version": "1.0.0",
      "isActive": true,
      "isDefault": true,
      "isPremium": false,
      "usageCount": 145,
      "rating": {
        "average": 4.5,
        "count": 23
      },
      "features": ["responsive", "dark-mode"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-02-20T14:22:00.000Z"
    }
    // More templates...
  ]
}
```

**Note:** Schema fields are excluded from list view for performance. Use specific template endpoint to get full schema.

---

### 2. Get Template by ID

Retrieve a specific template with full schema details.

**Endpoint:** `GET /api/templates/:id`

**Authentication:** Optional

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID (templateId) or MongoDB ObjectId |

**Example Request:**

```javascript
// By templateId
const response = await axios.get('/api/templates/echelon');

// By MongoDB ObjectId
const response = await axios.get('/api/templates/6501234567890abcdef12345');
```

**Example Response:**

```json
{
  "success": true,
  "message": "Template retrieved successfully",
  "data": {
    "_id": "6501234567890abcdef12345",
    "templateId": "echelon",
    "name": "Echelon",
    "slug": "echelon",
    "description": "A minimalist portfolio template",
    "category": "classic",
    "tags": ["minimal", "typography"],
    "schema": {
      "sections": [
        {
          "id": "hero",
          "type": "hero",
          "variant": "centered-large",
          "name": "Hero Section",
          "description": "Main hero section with title and subtitle",
          "required": true,
          "order": 1,
          "styling": {
            "background": "solid",
            "backgroundColor": "#FFFFFF",
            "height": "fullscreen",
            "padding": "default"
          },
          "fields": [
            {
              "id": "title",
              "type": "text",
              "label": "Hero Title",
              "placeholder": "DESIGNING WITH PRECISION",
              "required": false,
              "validation": {
                "maxLength": 200
              },
              "uiHints": {
                "helpText": "Main heading displayed in hero",
                "order": 1
              }
            },
            {
              "id": "subtitle",
              "type": "text",
              "label": "Hero Subtitle",
              "placeholder": "Case studies in clarity",
              "required": false,
              "validation": {
                "maxLength": 300
              },
              "uiHints": {
                "helpText": "Supporting text",
                "order": 2
              }
            }
          ]
        }
        // More sections...
      ],
      "styling": {
        "theme": {
          "primary": "#000000",
          "secondary": "#666666",
          "accent": "#FF6B35",
          "background": "#FFFFFF",
          "text": "#000000"
        },
        "typography": {
          "headingFont": "Inter",
          "bodyFont": "Inter",
          "scale": "default"
        },
        "spacing": "default",
        "borderRadius": "minimal"
      },
      "layout": {
        "maxWidth": "1200px",
        "columns": 12,
        "gutter": "24px"
      }
    },
    "caseStudySchema": {
      "enabled": true,
      "fields": [...]
    },
    "thumbnail": "https://example.com/thumb.jpg",
    "version": "1.0.0",
    "versionHistory": [],
    "isActive": true,
    "isDefault": true,
    "isPremium": false,
    "usageCount": 145,
    "rating": {
      "average": 4.5,
      "count": 23
    },
    "features": ["responsive", "dark-mode"],
    "compatibility": {
      "minFrontendVersion": "1.0.0"
    },
    "createdBy": "Aurea",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-02-20T14:22:00.000Z"
  }
}
```

**Side Effect:** This endpoint increments the template's `usageCount` (non-blocking).

---

### 3. Get Template Schema Only

Lightweight endpoint returning only the schema without metadata.

**Endpoint:** `GET /api/templates/:id/schema`

**Authentication:** Optional

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Example Request:**

```javascript
const response = await axios.get('/api/templates/echelon/schema');
```

**Example Response:**

```json
{
  "success": true,
  "message": "Template schema retrieved successfully",
  "data": {
    "templateId": "echelon",
    "name": "Echelon",
    "version": "1.0.0",
    "schema": {
      "sections": [...],
      "styling": {...},
      "layout": {...}
    },
    "caseStudySchema": {
      "enabled": true,
      "fields": [...]
    }
  }
}
```

**Use Case:** Use this endpoint when you only need schema structure for form generation, avoiding large metadata overhead.

---

### 4. Get Default Template

Retrieve the template marked as default.

**Endpoint:** `GET /api/templates/default`

**Authentication:** Optional

**Example Request:**

```javascript
const response = await axios.get('/api/templates/default');
```

**Example Response:**

```json
{
  "success": true,
  "message": "Default template retrieved successfully",
  "data": {
    // Full template object
  }
}
```

**Fallback:** If no template is marked as default, returns the first active template by creation date.

---

### 5. Get Template Categories

Retrieve list of all available template categories.

**Endpoint:** `GET /api/templates/categories`

**Authentication:** None

**Example Request:**

```javascript
const response = await axios.get('/api/templates/categories');
```

**Example Response:**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    "creative",
    "modern",
    "classic",
    "minimal",
    "professional",
    "artistic",
    "portfolio",
    "business"
  ]
}
```

**Note:** Only returns categories that have active templates.

---

### 6. Validate Content Against Template

Validate portfolio content against a template's schema before saving.

**Endpoint:** `POST /api/templates/:id/validate`

**Authentication:** Optional

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Request Body:**

```json
{
  "content": {
    "hero": {
      "title": "MY PORTFOLIO",
      "subtitle": "Designer & Developer"
    },
    "about": {
      "name": "John Doe",
      "bio": "I'm a creative professional..."
    },
    "work": {
      "heading": "SELECTED WORK",
      "projects": [
        {
          "title": "Project Alpha",
          "description": "A beautiful design project"
        }
      ]
    }
  }
}
```

**Example Request:**

```javascript
const content = {
  hero: {
    title: "MY PORTFOLIO",
    subtitle: "Designer & Developer"
  },
  about: {
    name: "John Doe",
    bio: "Creative professional..."
  }
};

const response = await axios.post('/api/templates/echelon/validate', {
  content
});
```

**Success Response (Valid Content):**

```json
{
  "success": true,
  "message": "Content is valid",
  "data": {
    "valid": true,
    "errors": []
  }
}
```

**Success Response (Invalid Content):**

```json
{
  "success": true,
  "message": "Content has validation errors",
  "data": {
    "valid": false,
    "errors": [
      {
        "section": "about",
        "field": "name",
        "error": "Required field is missing"
      },
      {
        "section": "hero",
        "field": "title",
        "error": "Maximum length is 200"
      },
      {
        "section": "about",
        "field": "bio",
        "error": "Invalid type. Expected text"
      }
    ]
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Content is required for validation"
}
```

**Validation Rules:**

1. **Required Sections**: Checks if required sections exist
2. **Required Fields**: Validates required fields within sections
3. **Field Types**: Ensures correct data types (string, number, boolean, array, object)
4. **Constraints**: Validates minLength, maxLength, min, max, pattern, allowedFormats, options

---

### 7. Add Template Rating

Rate a template (1-5 stars).

**Endpoint:** `POST /api/templates/:id/rating`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Request Body:**

```json
{
  "rating": 5
}
```

**Example Request:**

```javascript
const response = await axios.post(
  '/api/templates/echelon/rating',
  { rating: 5 },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

**Success Response:**

```json
{
  "success": true,
  "message": "Rating added successfully",
  "data": {
    "templateId": "echelon",
    "rating": {
      "average": 4.6,
      "count": 24
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

---

### 8. Create Template (Admin)

Create a new template.

**Endpoint:** `POST /api/templates`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "templateId": "modern-bold",
  "name": "Modern Bold",
  "slug": "modern-bold",
  "description": "A bold, modern portfolio design with vibrant colors",
  "category": "modern",
  "tags": ["modern", "bold", "colorful"],
  "thumbnail": "https://example.com/modern-bold-thumb.jpg",
  "previewImages": [
    "https://example.com/preview1.jpg",
    "https://example.com/preview2.jpg"
  ],
  "demoUrl": "https://demo.example.com/modern-bold",
  "version": "1.0.0",
  "isPremium": false,
  "features": ["responsive", "animations", "dark-mode"],
  "schema": {
    "sections": [...],
    "styling": {...},
    "layout": {...}
  },
  "caseStudySchema": {
    "enabled": true,
    "fields": [...]
  }
}
```

**Example Request:**

```javascript
const newTemplate = {
  templateId: "modern-bold",
  name: "Modern Bold",
  slug: "modern-bold",
  description: "A bold modern design",
  category: "modern",
  tags: ["modern", "bold"],
  thumbnail: "https://example.com/thumb.jpg",
  version: "1.0.0",
  schema: {
    sections: [...]
  }
};

const response = await axios.post(
  '/api/templates',
  newTemplate,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

**Success Response:**

```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    // Full template object
  }
}
```

**Error Responses:**

```json
// Not admin
{
  "success": false,
  "message": "Only admins can create templates"
}

// Duplicate templateId
{
  "success": false,
  "message": "Template with this ID or slug already exists"
}
```

---

### 9. Update Template (Admin)

Update an existing template.

**Endpoint:** `PUT /api/templates/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Request Body:**

```json
{
  "description": "Updated description",
  "tags": ["minimal", "professional", "clean"],
  "isPremium": true,
  "schema": {
    // Updated schema
  }
}
```

**Example Request:**

```javascript
const updates = {
  description: "Updated template description",
  isPremium: true,
  tags: ["minimal", "professional"]
};

const response = await axios.put(
  '/api/templates/echelon',
  updates,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

**Success Response:**

```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": {
    // Updated template object
  }
}
```

**Note:** `templateId` cannot be changed through this endpoint.

---

### 10. Deactivate Template (Admin)

Deactivate a template (soft delete).

**Endpoint:** `DELETE /api/templates/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Example Request:**

```javascript
const response = await axios.delete(
  '/api/templates/modern-bold',
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

**Success Response:**

```json
{
  "success": true,
  "message": "Template deactivated successfully",
  "data": {
    "templateId": "modern-bold",
    "isActive": false
    // Rest of template object
  }
}
```

**Note:** This is a soft delete. Template remains in database but won't appear in public listings.

---

### 11. Create Template Version (Admin)

Create a new version of an existing template.

**Endpoint:** `POST /api/templates/:id/version`

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Template ID or MongoDB ObjectId |

**Request Body:**

```json
{
  "schema": {
    // New schema with updates
  },
  "changelog": "Added new contact form section, improved mobile layout"
}
```

**Example Request:**

```javascript
const newVersion = {
  schema: {
    sections: [
      // Updated sections
    ]
  },
  changelog: "Added dark mode support and new gallery variants"
};

const response = await axios.post(
  '/api/templates/echelon/version',
  newVersion,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

**Success Response:**

```json
{
  "success": true,
  "message": "Template version created successfully",
  "data": {
    "templateId": "echelon",
    "version": "1.1.0",
    "changelog": "Added dark mode support and new gallery variants"
  }
}
```

**Versioning Logic:**
- Current version is saved to `versionHistory` array
- Minor version is incremented automatically (1.0.0 → 1.1.0)
- New schema becomes current version

---

## Schema Structure Explained

### Section Definition

Each template consists of multiple sections. Each section has:

```javascript
{
  id: 'hero',                    // Unique section identifier
  type: 'hero',                  // Section type (hero, about, gallery, contact, etc.)
  variant: 'centered-large',     // Visual variant of the section type
  name: 'Hero Section',          // Display name
  description: 'Main hero...',   // Description for editors
  required: true,                // Can this section be deleted?
  order: 1,                      // Display order
  styling: {                     // Section-specific styles
    background: 'solid',
    backgroundColor: '#FFFFFF',
    height: 'fullscreen',
    padding: 'default'
  },
  fields: [...]                  // Array of field definitions
}
```

### Field Definition

Each section contains fields that define the content structure:

```javascript
{
  id: 'title',                   // Unique field identifier
  type: 'text',                  // Field type (see types below)
  label: 'Hero Title',           // Display label in editor
  placeholder: 'Enter title',    // Placeholder text
  required: false,               // Is this field required?
  validation: {                  // Validation rules
    minLength: 2,
    maxLength: 200,
    min: 0,                      // For numbers
    max: 100,
    pattern: '^[A-Z].*',         // Regex pattern
    allowedFormats: ['jpg', 'png'],  // For files
    options: ['option1', 'option2']  // For select fields
  },
  uiHints: {                     // UI rendering hints
    helpText: 'Main heading',
    order: 1
  }
}
```

### Field Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `text` | Single-line text | `"Hello World"` |
| `textarea` | Multi-line text | `"Long content..."` |
| `richtext` | Formatted text (HTML) | `"<p>Formatted</p>"` |
| `email` | Email address | `"user@example.com"` |
| `url` | Web URL | `"https://example.com"` |
| `tel` | Phone number | `"+1-555-1234"` |
| `number` | Numeric value | `42` |
| `array` | List of items | `[{...}, {...}]` |
| `object` | Nested object | `{key: "value"}` |
| `checkbox` | Boolean checkbox | `true` |
| `toggle` | Boolean toggle | `false` |
| `image` | Image URL | `"https://img.jpg"` |
| `video` | Video URL | `"https://vid.mp4"` |
| `file` | File URL | `"https://file.pdf"` |
| `select` | Dropdown selection | `"option1"` |

### Complex Field Types

**Array Fields:**

```javascript
{
  id: 'projects',
  type: 'array',
  label: 'Projects',
  maxItems: 12,
  itemSchema: {
    title: {
      type: 'string',
      required: true,
      maxLength: 200
    },
    description: {
      type: 'textarea',
      maxLength: 500
    },
    image: {
      type: 'image'
    }
  }
}
```

**Object Fields:**

```javascript
{
  id: 'social',
  type: 'object',
  label: 'Social Links',
  fields: [
    {
      id: 'linkedin',
      type: 'url',
      label: 'LinkedIn'
    },
    {
      id: 'twitter',
      type: 'url',
      label: 'Twitter'
    }
  ]
}
```

---

## Validation System

### How Validation Works

1. **Client submits content** via `POST /api/templates/:id/validate`
2. **Server loads template** from database
3. **Validation engine processes** each section and field
4. **Returns validation result** with detailed errors

### Validation Process

```javascript
// Pseudo-code of validation logic
function validateContent(templateSchema, userContent) {
  const errors = [];
  
  // Check each section in template
  for (const sectionDef of templateSchema.sections) {
    const sectionContent = userContent[sectionDef.id];
    
    // Check if required section exists
    if (sectionDef.required && !sectionContent) {
      errors.push({
        section: sectionDef.id,
        error: 'Required section is missing'
      });
      continue;
    }
    
    // Check each field in section
    for (const fieldDef of sectionDef.fields) {
      const fieldValue = sectionContent[fieldDef.id];
      
      // Check if required field exists
      if (fieldDef.required && isEmpty(fieldValue)) {
        errors.push({
          section: sectionDef.id,
          field: fieldDef.id,
          error: 'Required field is missing'
        });
        continue;
      }
      
      // Validate field type
      if (!isCorrectType(fieldValue, fieldDef.type)) {
        errors.push({
          section: sectionDef.id,
          field: fieldDef.id,
          error: `Invalid type. Expected ${fieldDef.type}`
        });
      }
      
      // Validate constraints
      validateConstraints(fieldValue, fieldDef.validation, errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Validation Rules

**1. Required Checks:**
- Required sections must exist
- Required fields must have non-empty values

**2. Type Validation:**
- String types: text, textarea, richtext, email, url, tel
- Number types: number
- Boolean types: checkbox, toggle
- Complex types: array, object
- File types: image, video, file

**3. Constraint Validation:**

| Constraint | Applies To | Rule |
|------------|------------|------|
| `minLength` | String | Minimum string length |
| `maxLength` | String | Maximum string length |
| `min` | Number | Minimum value |
| `max` | Number | Maximum value |
| `pattern` | String | Regex pattern match |
| `allowedFormats` | File/Image | File extension check |
| `options` | Select | Value must be in options array |

### Example Validation Errors

```javascript
{
  "valid": false,
  "errors": [
    {
      "section": "hero",
      "field": "title",
      "error": "Maximum length is 200"
    },
    {
      "section": "about",
      "field": "name",
      "error": "Required field is missing"
    },
    {
      "section": "about",
      "field": "email",
      "error": "Value does not match required pattern"
    },
    {
      "section": "work",
      "field": "category",
      "error": "Value must be one of: branding, web-design, ux-ui"
    },
    {
      "section": "about",
      "field": "image",
      "error": "Allowed formats: jpg, jpeg, png, webp"
    }
  ]
}
```

---

## Testing

### Running Tests

The template system includes a comprehensive test suite.

**Run all tests:**

```bash
cd AUREA---Backend
node test/test-template-system.js
```

### Test Coverage

The test suite covers:

1. ✅ **User Signup**: Create test user
2. ✅ **Get All Templates**: Fetch template list
3. ✅ **Get Default Template**: Retrieve default template
4. ✅ **Get Template Schema**: Fetch schema only
5. ✅ **Create Portfolio with Template**: Create portfolio using template
6. ✅ **Update Portfolio with Validation**: Update with validated content
7. ✅ **Invalid Data Validation**: Ensure validation rejects bad data
8. ✅ **Change Template**: Switch portfolio to different template
9. ✅ **Cleanup**: Delete test data

### Test Output Example

```
🚀 Starting Template System Tests
================================

📝 Test 1: User Signup
✅ User signup successful
   User ID: 650abc123def456789012345

📝 Test 2: Get All Templates
✅ Retrieved 3 templates
   - Echelon (echelon)
   - Modern Bold (modern-bold)
   - Minimal Clean (minimal-clean)

📝 Test 3: Get Default Template
✅ Retrieved default template
   Name: Echelon
   ID: 650abc123def456789012345
   Category: classic

📝 Test 4: Get Template Schema
✅ Retrieved template schema
   Sections: hero, about, work, contact

📝 Test 5: Create Portfolio with Template
✅ Portfolio created with template
   Portfolio ID: 650def789abc012345678901
   Template ID: 650abc123def456789012345
   Template Version: 1.0.0

📝 Test 6: Update Portfolio with Validation
✅ Portfolio updated with validation

📝 Test 7: Invalid Data Validation
✅ Validation correctly rejected invalid data
   Errors: Maximum length is 200, Required field is missing

📝 Test 8: Change Portfolio Template
✅ Successfully changed portfolio template
   New Template: Modern Bold

📝 Test 9: Cleanup
✅ Portfolio deleted

================================
📊 Test Results:
✅ Passed: 9
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All tests passed! Template system is working correctly.
```

---

## Admin Operations

### Creating a New Template

**Step 1: Design the Schema**

```javascript
const newTemplate = {
  templateId: "creative-studio",
  name: "Creative Studio",
  slug: "creative-studio",
  description: "Bold creative portfolio for studios and agencies",
  category: "creative",
  tags: ["creative", "bold", "agency", "studio"],
  thumbnail: "https://cdn.example.com/creative-studio-thumb.jpg",
  previewImages: [
    "https://cdn.example.com/preview-1.jpg",
    "https://cdn.example.com/preview-2.jpg"
  ],
  demoUrl: "https://demo.aurea.com/creative-studio",
  version: "1.0.0",
  isPremium: true,
  features: ["responsive", "animations", "video-hero", "dark-mode"],
  
  schema: {
    sections: [
      {
        id: "hero",
        type: "hero",
        variant: "video-background",
        name: "Hero Section",
        required: true,
        order: 1,
        fields: [
          {
            id: "videoUrl",
            type: "video",
            label: "Background Video",
            required: true,
            validation: {
              allowedFormats: ["mp4", "webm"]
            }
          },
          {
            id: "tagline",
            type: "text",
            label: "Tagline",
            required: true,
            validation: {
              maxLength: 100
            }
          }
        ]
      }
      // More sections...
    ],
    styling: {
      theme: {
        primary: "#FF3366",
        secondary: "#000000",
        accent: "#00FF88",
        background: "#000000",
        text: "#FFFFFF"
      },
      typography: {
        headingFont: "Montserrat",
        bodyFont: "Open Sans",
        scale: "comfortable"
      },
      spacing: "relaxed",
      borderRadius: "rounded"
    },
    layout: {
      maxWidth: "1400px",
      columns: 12,
      gutter: "32px"
    }
  }
};
```

**Step 2: Create via API**

```javascript
const response = await axios.post(
  'http://localhost:5000/api/templates',
  newTemplate,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Step 3: Test the Template**

```javascript
// Fetch template
const template = await axios.get('/api/templates/creative-studio');

// Test validation
const testContent = {
  hero: {
    videoUrl: "https://cdn.example.com/hero.mp4",
    tagline: "Creating Digital Experiences"
  }
};

const validation = await axios.post(
  '/api/templates/creative-studio/validate',
  { content: testContent }
);

console.log(validation.data); // Should be valid
```

### Updating a Template

```javascript
const updates = {
  description: "Updated description with more detail",
  tags: ["creative", "bold", "agency", "startup"],
  isPremium: false, // Make it free
  schema: {
    // Updated schema with new sections
  }
};

const response = await axios.put(
  '/api/templates/creative-studio',
  updates,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

### Creating a New Version

```javascript
const newVersion = {
  schema: {
    sections: [
      // Updated sections with new features
    ],
    styling: {
      // Enhanced styling options
    }
  },
  changelog: "v1.1.0 - Added portfolio grid section, improved mobile responsiveness, new color scheme options"
};

const response = await axios.post(
  '/api/templates/creative-studio/version',
  newVersion,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

### Deactivating a Template

```javascript
const response = await axios.delete(
  '/api/templates/creative-studio',
  {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  }
);
```

---

## Best Practices

### 1. Schema Design

✅ **Do:**
- Keep section IDs semantic (hero, about, work, contact)
- Use clear, descriptive field labels
- Provide helpful placeholder text
- Set realistic validation constraints
- Include uiHints for better editor UX

❌ **Don't:**
- Use generic IDs (section1, field1)
- Make everything required
- Over-validate (too strict constraints)
- Forget to provide help text

### 2. Validation

✅ **Do:**
- Always validate content before saving portfolios
- Handle validation errors gracefully in UI
- Show specific error messages to users
- Validate on blur/change in forms

❌ **Don't:**
- Skip validation to "save time"
- Show generic error messages
- Let invalid data reach the database

### 3. Performance

✅ **Do:**
- Use `/api/templates` for lists (excludes schemas)
- Use `/api/templates/:id/schema` for form generation
- Cache templates on frontend
- Use pagination for large template lists

❌ **Don't:**
- Fetch full templates for list views
- Re-fetch templates on every render
- Load all templates at once

### 4. Versioning

✅ **Do:**
- Create new versions for breaking changes
- Write detailed changelogs
- Test new versions thoroughly
- Maintain backward compatibility when possible

❌ **Don't:**
- Update schema without versioning
- Break existing portfolios
- Skip changelog documentation

---

## Troubleshooting

### Template Not Found

**Problem:** GET request returns 404

**Solutions:**
```javascript
// Check if template exists
const templates = await axios.get('/api/templates');
console.log(templates.data);

// Verify templateId vs _id
// Use templateId: /api/templates/echelon
// Use _id: /api/templates/650abc123def456789012345
```

### Validation Always Fails

**Problem:** Content validation returns errors for valid data

**Solutions:**
```javascript
// 1. Check field types match schema
// Schema expects 'text', you're sending number

// 2. Verify required fields exist
const template = await axios.get('/api/templates/echelon');
console.log(template.data.schema.sections);

// 3. Check validation constraints
// maxLength, pattern, allowedFormats, etc.

// 4. Test validation endpoint directly
const validation = await axios.post(
  '/api/templates/echelon/validate',
  { content: yourContent }
);
console.log(validation.data.errors);
```

### Schema Not Loading

**Problem:** Schema structure undefined or incomplete

**Solutions:**
```javascript
// Use schema-only endpoint
const schema = await axios.get('/api/templates/echelon/schema');

// Check for schema.data.schema
if (!schema.data.schema || !schema.data.schema.sections) {
  console.error('Invalid schema structure');
}

// Verify template has been seeded
// Run: node seeds/templateSeeds.js
```

### Admin Operations Fail

**Problem:** 403 Forbidden on admin endpoints

**Solutions:**
```javascript
// 1. Verify user is admin
// Check user.role === 'admin'

// 2. Ensure valid JWT token
headers: {
  Authorization: `Bearer ${validToken}`
}

// 3. Check token hasn't expired
// Token expires in 30 days by default
```

### Rating Not Updating

**Problem:** Rating count or average doesn't change

**Solutions:**
```javascript
// 1. Ensure authenticated request
const response = await axios.post(
  '/api/templates/echelon/rating',
  { rating: 5 },
  { headers: { Authorization: `Bearer ${token}` } }
);

// 2. Verify rating value is 1-5
if (rating < 1 || rating > 5) {
  throw new Error('Invalid rating');
}

// 3. Check database update
// Rating updates immediately via addRating() method
```

---

## Migration Guide

### Migrating from Old Portfolio System

**Before:**
```javascript
// Old: Portfolio with direct HTML/CSS
{
  title: "My Portfolio",
  customHTML: "<div>...</div>",
  customCSS: "body { ... }"
}
```

**After:**
```javascript
// New: Portfolio with template system
{
  title: "My Portfolio",
  templateId: "echelon",
  templateVersion: "1.0.0",
  customData: {
    hero: {
      title: "MY WORK",
      subtitle: "Designer"
    },
    about: {
      name: "John Doe",
      bio: "Creative professional..."
    }
  }
}
```

**Migration Steps:**

1. **Select Default Template**
```javascript
const defaultTemplate = await axios.get('/api/templates/default');
```

2. **Map Old Data to New Schema**
```javascript
function migratePortfolio(oldPortfolio, template) {
  const customData = {
    hero: {
      title: extractTitle(oldPortfolio.customHTML),
      subtitle: extractSubtitle(oldPortfolio.customHTML)
    },
    // Map other sections...
  };
  
  return {
    ...oldPortfolio,
    templateId: template._id,
    templateVersion: template.version,
    customData
  };
}
```

3. **Validate Migrated Data**
```javascript
const validation = await axios.post(
  `/api/templates/${template._id}/validate`,
  { content: customData }
);

if (!validation.data.valid) {
  console.error('Migration validation failed:', validation.data.errors);
}
```

4. **Update Portfolio**
```javascript
const updated = await axios.put(
  `/api/portfolios/${portfolio._id}`,
  migratedPortfolio
);
```

---

## Appendix

### Complete Template Example

See `/seeds/templateSeeds.js` for complete Echelon template implementation.

### TypeScript Definitions

```typescript
interface Template {
  _id: string;
  templateId: string;
  name: string;
  slug: string;
  description: string;
  category: 'creative' | 'modern' | 'classic' | 'minimal' | 'professional' | 'artistic' | 'portfolio' | 'business';
  tags: string[];
  schema: TemplateSchema;
  caseStudySchema?: CaseStudySchema;
  thumbnail: string;
  previewImages?: string[];
  demoUrl?: string;
  version: string;
  versionHistory: VersionHistory[];
  features?: string[];
  requiredPlugins?: Plugin[];
  compatibility?: Compatibility;
  isActive: boolean;
  isDefault: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateSchema {
  sections: Section[];
  styling: Styling;
  layout: Layout;
}

interface Section {
  id: string;
  type: string;
  variant: string;
  name: string;
  description?: string;
  required: boolean;
  order: number;
  styling?: SectionStyling;
  fields: Field[];
}

interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: Validation;
  uiHints?: UIHints;
}

type FieldType = 'text' | 'textarea' | 'richtext' | 'email' | 'url' | 'tel' | 
                 'number' | 'array' | 'object' | 'checkbox' | 'toggle' | 
                 'image' | 'video' | 'file' | 'select';

interface Validation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedFormats?: string[];
  options?: string[];
}

interface UIHints {
  helpText?: string;
  order?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  section: string;
  field?: string;
  error: string;
}
```

### Related Documentation

- **Frontend Integration**: See `FRONTEND_INTEGRATION_GUIDE.md`
- **Backend System**: See `BACKEND_DYNAMIC_TEMPLATE_SYSTEM.md`
- **API Swagger**: See `swagger.yaml`

---

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/aurea/issues)
- Email: support@aurea.com
- Documentation: https://docs.aurea.com

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0  
**Maintained by:** Aurea Development Team
