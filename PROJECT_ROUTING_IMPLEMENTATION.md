# Project Routing System Implementation

## Overview

The backend now fully supports project-level routing for portfolio templates (Chic, Serene, BoldFolio). This enables the frontend to navigate to individual projects using `/portfolio-builder/:portfolioId/project/:projectId`.

## Implementation Date
November 20, 2025

## Changes Made

### 1. **New API Endpoints**

Two new endpoints were added to handle individual project operations:

#### GET /api/portfolios/:portfolioId/projects/:projectId
- **Access**: Private (owner) or Public (if published)
- **Middleware**: `optionalAuth`, `portfolioCrudLimiter`, `validateObjectId`
- **Purpose**: Retrieve a specific project from a portfolio
- **Response**:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project-1",
      "title": "Project Title",
      "description": "Project description",
      "image": "...",
      "portfolioId": "...",
      "portfolioTitle": "Portfolio Name",
      "portfolioTemplate": "chic"
    }
  }
}
```

#### PUT /api/portfolios/:portfolioId/projects/:projectId
- **Access**: Private (owner only)
- **Middleware**: `auth`, `portfolioCrudLimiter`, `validateObjectId`, `checkPortfolioOwnership`
- **Purpose**: Update a specific project in a portfolio
- **Request Body**: Project fields to update (title, description, image, etc.)
- **Response**: Updated project object

### 2. **Auto-Generation of Project IDs**

Projects now automatically receive unique IDs in the format `project-1`, `project-2`, etc.

#### When IDs are Generated:
- **On Portfolio Retrieval** (GET): IDs are added to projects that don't have them
- **On Portfolio Update** (PUT): Content is processed to ensure all projects have IDs

#### Template-Specific Handling:

**Chic & BoldFolio Templates:**
```javascript
content: {
  work: {
    projects: [
      { id: "project-1", title: "...", ... },
      { id: "project-2", title: "...", ... }
    ]
  }
}
```

**Serene Template:**
```javascript
content: {
  gallery: {
    firstRow: [
      { id: "project-1", title: "...", ... },
      { id: "project-2", title: "...", ... }
    ],
    secondRow: [
      { id: "project-3", title: "...", ... }
    ]
  }
}
```

### 3. **Backward Compatibility**

The system maintains full backward compatibility:

✅ **Preserves Existing IDs**: Projects with custom IDs (e.g., `custom-project-alpha`) are preserved
✅ **Auto-Generates Missing IDs**: Projects without IDs get auto-generated ones
✅ **No Data Migration Required**: Existing portfolios work without changes

### 4. **Service Layer Updates**

#### PortfolioService.js

Added three new methods:

1. **`_ensureProjectIds(content, template)`** (private)
   - Ensures all projects have unique IDs
   - Handles template-specific content structures
   - Auto-generates IDs in format `project-${index + 1}`

2. **`_findProjectInContent(content, template, projectId)`** (private)
   - Locates a specific project by ID within portfolio content
   - Searches across all project locations (work.projects, gallery.firstRow, gallery.secondRow)

3. **`getProjectById(portfolioId, projectId, userId)`** (public)
   - Retrieves a single project from a portfolio
   - Enforces access control (owner or published)
   - Returns project with portfolio metadata

4. **`updateProject(portfolioId, projectId, userId, projectData)`** (public)
   - Updates a specific project
   - Preserves project ID
   - Updates the entire portfolio with modified content

#### Modified Existing Methods:

- **`getPortfolioById()`**: Now ensures project IDs exist before returning
- **`updatePortfolio()`**: Auto-generates IDs for new/modified content

### 5. **Controller Layer Updates**

#### portfolioController.js

Added two new controller functions:

1. **`getProjectById()`**: HTTP handler for GET project endpoint
2. **`updateProject()`**: HTTP handler for PUT project endpoint

Both controllers are thin and delegate all business logic to PortfolioService.

### 6. **Route Registration**

Updated `src/routes/portfolioRoutes.js`:

```javascript
// Project-specific routes
router.get('/:portfolioId/projects/:projectId',
  optionalAuth,
  portfolioCrudLimiter,
  validateObjectId('portfolioId'),
  getProjectById
);

router.put('/:portfolioId/projects/:projectId',
  auth,
  portfolioCrudLimiter,
  validateObjectId('portfolioId'),
  checkPortfolioOwnership,
  updateProject
);
```

## Testing

### Test Suite: `test/test-project-routing.js`

Comprehensive test suite with 9 tests covering:

1. ✅ User authentication
2. ✅ Portfolio creation without IDs
3. ✅ ID auto-generation on retrieval
4. ✅ Individual project retrieval
5. ✅ Individual project updates
6. ✅ Update persistence verification
7. ✅ Serene template (gallery structure)
8. ✅ BoldFolio template
9. ✅ Backward compatibility with existing IDs

**Run Tests:**
```bash
node test/test-project-routing.js
```

**Expected Output:**
```
📊 Test Results: 9 passed, 0 failed
✨ All tests passed! Project routing system is working correctly.
```

## Usage Examples

### Get Individual Project

```javascript
// GET /api/portfolios/123abc/projects/project-1
const response = await fetch(`${API_URL}/portfolios/${portfolioId}/projects/project-1`, {
  headers: {
    Authorization: `Bearer ${token}` // Optional for published portfolios
  }
});

const { data } = await response.json();
console.log(data.project);
// {
//   id: "project-1",
//   title: "Project Alpha",
//   description: "...",
//   portfolioId: "123abc",
//   portfolioTitle: "My Portfolio",
//   portfolioTemplate: "chic"
// }
```

### Update Individual Project

```javascript
// PUT /api/portfolios/123abc/projects/project-1
const response = await fetch(`${API_URL}/portfolios/${portfolioId}/projects/project-1`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Updated Project Title',
    description: 'New description',
    meta: '2025 — Updated'
  })
});

const { data } = await response.json();
console.log(data.project); // Updated project with preserved ID
```

### Frontend Navigation

```javascript
// Navigate to project editor
navigate(`/portfolio-builder/${portfolioId}/project/${projectId}`);

// The backend will serve this project's data via:
// GET /api/portfolios/:portfolioId/projects/:projectId
```

## Architecture Patterns

### Clean Architecture Maintained

The implementation follows the existing Clean Architecture pattern:

```
Route → Controller (HTTP) → Service (Business Logic) → Repository (Data Access) → Model
```

- **Controllers**: Thin HTTP handlers, no business logic
- **Services**: All business rules, validation, and orchestration
- **Repositories**: Direct database access (unchanged)
- **Models**: Data structure definitions (unchanged)

### Error Handling

Standard error responses using the centralized exception system:

- `NotFoundError`: Portfolio or project not found
- `ForbiddenError`: Access denied (unpublished portfolio, not owner)
- `ValidationError`: Invalid input data

### Logging

All operations logged using structured logging:

```javascript
logger.service('PortfolioService', 'getProjectById', { portfolioId, projectId, userId });
logger.info('Project retrieved successfully', { portfolioId, projectId });
```

## Publishing & Export

### Current State

The existing HTML generation system (`services/templateConvert.js`) already supports:
- Case study pages: `case-study-{projectId}.html`
- Main portfolio page: `index.html`

### For Full Project Detail Pages

To add standalone project detail pages for published portfolios (routes like `/portfolio-slug/project/project-1`), you would need to:

1. **Generate Project HTML**: Add a new function to `services/templateConvert.js`:
   ```javascript
   function generateProjectDetailHTML(project, portfolioData) {
     // Generate HTML for individual project page
     // Return HTML string
   }
   ```

2. **Update Publishing Flow**: Modify `SiteService.generatePortfolioHTML()` to generate project pages:
   ```javascript
   // In addition to existing case study generation
   if (portfolioData.content?.work?.projects) {
     portfolioData.content.work.projects.forEach(project => {
       const projectHTML = generateProjectDetailHTML(project, portfolioData);
       allFiles[`project-${project.id}.html`] = projectHTML;
     });
   }
   ```

3. **Add Routes**: Add server routes in `server.js` for project pages:
   ```javascript
   app.get('/:subdomain/project/:projectId.html', (req, res) => {
     // Serve generated project HTML
   });
   ```

**Note**: Case study pages are already generated. Project detail pages are different from case studies and would be template-specific portfolio project showcases.

## Database Impact

**No Database Schema Changes Required**

- Portfolio model uses flexible `content` field (Mixed type)
- Project IDs are stored within `content` object
- No new models or collections needed
- No migration scripts required

## Performance Considerations

### Efficiency
- Project lookups are O(n) where n = number of projects (typically small)
- No additional database queries (projects stored in portfolio document)
- ID generation happens in-memory during retrieval

### Caching
- Portfolio responses can be cached (IDs generated consistently)
- Project endpoint responses inherit portfolio caching strategy

## Security

All existing security measures apply:

✅ **Authentication**: JWT-based, optional for public portfolios
✅ **Authorization**: Ownership verification via `checkPortfolioOwnership` middleware
✅ **Rate Limiting**: 30 requests/minute for CRUD operations
✅ **Input Validation**: MongoDB ObjectId validation for IDs
✅ **Access Control**: Published vs unpublished portfolio checks

## Frontend Integration Guide

### 1. Fetch Project List
```javascript
const portfolio = await getPortfolio(portfolioId);
const projects = portfolio.content.work?.projects || [];

projects.forEach(project => {
  console.log(project.id); // "project-1", "project-2", etc.
});
```

### 2. Navigate to Project
```javascript
function openProject(portfolioId, projectId) {
  navigate(`/portfolio-builder/${portfolioId}/project/${projectId}`);
}
```

### 3. Load Project Data
```javascript
useEffect(() => {
  async function loadProject() {
    const response = await fetch(
      `/api/portfolios/${portfolioId}/projects/${projectId}`
    );
    const { data } = await response.json();
    setProject(data.project);
  }
  loadProject();
}, [portfolioId, projectId]);
```

### 4. Update Project
```javascript
async function updateProject(updates) {
  const response = await fetch(
    `/api/portfolios/${portfolioId}/projects/${projectId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    }
  );

  const { data } = await response.json();
  return data.project;
}
```

## Files Modified

### Created
- `test/test-project-routing.js` - Comprehensive test suite (440 lines)
- `PROJECT_ROUTING_IMPLEMENTATION.md` - This documentation

### Modified
- `src/controllers/portfolioController.js` - Added 2 new controller methods
- `src/routes/portfolioRoutes.js` - Added 2 new routes
- `src/core/services/PortfolioService.js` - Added 4 new methods, modified 2 existing methods

## Migration Guide

### For Existing Portfolios

**No action required.** The system handles everything automatically:

1. Existing portfolios without project IDs → IDs generated on first GET
2. Existing portfolios with custom IDs → Custom IDs preserved
3. Mixed scenarios → Custom IDs preserved, missing IDs auto-generated

### For Frontend Developers

1. **Update Project Listings**: Projects now have `id` field
2. **Use New Endpoints**: Switch from portfolio-level updates to project-level updates where appropriate
3. **Navigation**: Update routes to use `/portfolio-builder/:portfolioId/project/:projectId`

## Future Enhancements

### Possible Improvements

1. **Project Detail Pages in Published Sites**
   - Generate standalone HTML pages for each project
   - Add server routes to serve these pages
   - Template-specific project showcase designs

2. **Project Ordering**
   - Add `order` field to projects
   - Endpoint to reorder projects: `PUT /api/portfolios/:id/projects/reorder`

3. **Project Analytics**
   - Track views per project
   - Add `viewCount` field to project objects

4. **Bulk Project Operations**
   - Endpoint to create multiple projects: `POST /api/portfolios/:id/projects/bulk`
   - Endpoint to delete multiple projects: `DELETE /api/portfolios/:id/projects/bulk`

5. **Project Templates**
   - Predefined project structures
   - Quick project creation from templates

## Troubleshooting

### Project Not Found

**Error**: `404: Project not found`

**Causes**:
- Project ID doesn't exist in portfolio
- Portfolio doesn't belong to user (for private portfolios)
- Invalid project ID format

**Solution**:
```javascript
// Ensure project exists in portfolio
const portfolio = await getPortfolio(portfolioId);
const project = portfolio.content.work?.projects.find(p => p.id === projectId);
if (!project) {
  console.error('Project not found in portfolio');
}
```

### IDs Not Auto-Generated

**Issue**: Projects don't have IDs after creation

**Expected Behavior**: IDs are generated on **GET**, not **POST**

**Solution**:
```javascript
// After creating portfolio, fetch it to get IDs
const createResponse = await createPortfolio(data);
const getResponse = await getPortfolio(createResponse.data.portfolio._id);
// Now getResponse.data.portfolio.content.work.projects will have IDs
```

### Custom IDs Not Preserved

**Issue**: Custom project IDs are lost

**Cause**: Updating entire content object without preserving IDs

**Solution**:
```javascript
// ✅ Correct: Update via project endpoint
PUT /api/portfolios/:id/projects/custom-project-id

// ❌ Avoid: Replacing entire content without IDs
PUT /api/portfolios/:id
{ content: { work: { projects: [{ /* no id */ }] } } }
```

## API Endpoint Reference

### Project Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/portfolios/:portfolioId/projects/:projectId` | Optional | Get individual project |
| PUT | `/api/portfolios/:portfolioId/projects/:projectId` | Required | Update individual project |

### Related Portfolio Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/portfolios/:id` | Optional | Get full portfolio (includes all projects with IDs) |
| PUT | `/api/portfolios/:id` | Required | Update portfolio (auto-generates project IDs) |
| POST | `/api/portfolios` | Required | Create portfolio |

## Support

For issues or questions:
- Check the test suite: `test/test-project-routing.js`
- Review service layer: `src/core/services/PortfolioService.js`
- Check logs: Structured logging provides detailed operation traces

## Conclusion

The project routing system is fully implemented, tested, and production-ready. It provides:

✅ Individual project access via API
✅ Auto-generated project IDs
✅ Backward compatibility
✅ Clean architecture compliance
✅ Comprehensive test coverage
✅ Full documentation

The frontend can now seamlessly navigate to and edit individual projects within portfolios.
