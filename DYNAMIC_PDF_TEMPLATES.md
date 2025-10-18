# Dynamic Template-Based PDF Export System

## Overview

The AUREA backend now supports **template-specific PDF generation**. PDFs can be generated using different templates (Echelon, Serene, etc.) that match the user's portfolio design, providing a consistent experience from web to PDF.

## Architecture

### Core Components

1. **Template Registry** (`src/config/templateRegistry.js`)
   - Central configuration for all templates
   - Maps template IDs to preview URLs and settings
   - Supports plugin architecture for easy template addition

2. **Template Engine** (`src/services/templateEngine.js`)
   - Orchestrates template selection and HTML generation
   - Hybrid approach: Fetches rendered HTML from frontend using Puppeteer
   - Graceful fallback to `templateConvert.js` if frontend unavailable

3. **PDF Generation Service** (`services/pdfGenerationService.js`)
   - Updated to use template engine for portfolio pages
   - Case studies use uniform design (templateConvert.js)
   - High-quality Puppeteer-based PDF generation

4. **Enhanced Frontend Preview Pages**
   - `Aurea-frontend/src/pages/EchelonPreviewPage.jsx`
   - `Aurea-frontend/src/pages/SerenePreviewPage.jsx`
   - Support query parameters: `portfolioId`, `pdfMode`
   - Load real portfolio data for PDF generation

## How It Works

### PDF Generation Flow

```
1. User requests PDF → /api/pdf/portfolio/:id?templateId=echolon
2. Backend identifies template (from param or portfolio.templateId)
3. Template engine fetches HTML from frontend preview URL
4. Puppeteer converts HTML to high-quality PDF
5. PDF returned to user (inline view or download)
```

### Template Selection Priority

1. `templateId` query parameter (explicit override)
2. Portfolio's `templateId` field
3. Portfolio's legacy `template` field
4. Default template (echolon)

### Fallback Strategy

If frontend is unavailable or template fetch fails:

1. **Primary**: Fetch from `http://localhost:5173/template-preview/{templateId}`
2. **Fallback 1**: Use `templateConvert.js` (Swiss design)
3. **Fallback 2**: Generate minimal HTML with portfolio data

## API Usage

### Generate PDF with Specific Template

```bash
# Use Echelon template
GET /api/pdf/portfolio/:portfolioId?templateId=echolon

# Use Serene template
GET /api/pdf/portfolio/:portfolioId?templateId=serene

# Use portfolio's default template
GET /api/pdf/portfolio/:portfolioId
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateId` | string | Template to use (echolon, serene) - optional |
| `pageType` | string | 'portfolio', 'all', or 'case-study-{id}' |
| `format` | string | PDF format: A4, A3, Letter, Legal |
| `landscape` | boolean | Landscape orientation |
| `save` | boolean | Save to filesystem (owner only) |

### All PDF Endpoints

```bash
# View PDF inline
GET /api/pdf/portfolio/:portfolioId

# Complete portfolio + case studies
GET /api/pdf/portfolio/:portfolioId/complete

# Force download
GET /api/pdf/portfolio/:portfolioId/download

# PDF info and options
GET /api/pdf/portfolio/:portfolioId/info
```

## Template Registry

### Current Templates

| ID | Name | Category | Frontend URL |
|----|------|----------|-------------|
| `echolon` | Echelon | Swiss | `/template-preview/echelon` |
| `serene` | Serene | Creative | `/template-preview/serene` |

### Adding New Templates

1. **Add to Template Registry** (`src/config/templateRegistry.js`):

```javascript
export const TEMPLATES = {
  // ... existing templates

  newtemplate: {
    id: 'newtemplate',
    name: 'New Template',
    description: 'Description of template',
    category: 'modern',
    previewUrl: `${FRONTEND_BASE_URL}/template-preview/newtemplate`,
    pdfSettings: {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    },
    puppeteerSettings: {
      viewport: { width: 1200, height: 1600, deviceScaleFactor: 2 },
      waitForSelectors: ['main', 'section'],
      scrollDelay: 500,
      fontLoadDelay: 2000
    }
  }
};
```

2. **Create Frontend Preview Page** (`Aurea-frontend/src/pages/NewTemplatePreviewPage.jsx`):

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewTemplate from '../templates/NewTemplate/NewTemplate';
import { getPortfolioById } from '../lib/portfolioApi';

const NewTemplatePreviewPage = () => {
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('portfolioId');
  const pdfMode = searchParams.get('pdfMode') === 'true';

  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portfolioId) {
      // Load portfolio data...
      window.__PORTFOLIO_DATA__ = portfolioData;
    }
  }, [portfolioId]);

  const displayData = portfolioData?.content || mockData;

  return (
    <div>
      {!pdfMode && <PreviewHeader />}
      <NewTemplate content={displayData} />
      {!pdfMode && <PreviewFooter />}
    </div>
  );
};
```

3. **Add Route** (`Aurea-frontend/src/App.jsx`):

```javascript
<Route
  path="/template-preview/newtemplate"
  element={<NewTemplatePreviewPage />}
/>
```

4. **Done!** The system will automatically use the new template.

## Frontend Requirements

### Preview Page Specs

Preview pages must:

1. **Accept Query Parameters**
   - `portfolioId` - Load real portfolio data
   - `pdfMode` - Hide navigation/headers for clean PDF

2. **Load Portfolio Data**
   ```javascript
   const response = await getPortfolioById(portfolioId);
   setPortfolioData(response.data);
   window.__PORTFOLIO_DATA__ = response.data;
   ```

3. **Conditional UI**
   ```javascript
   {!pdfMode && <PreviewHeader />}
   <TemplateContent content={portfolioData?.content || mockData} />
   {!pdfMode && <PreviewFooter />}
   ```

4. **Clean Output**
   - No fixed headers in PDF mode
   - No navigation bars
   - No "Use Template" buttons
   - Proper margins (0 in PDF mode)

## Configuration

### Environment Variables

```bash
# Backend (.env)
FRONTEND_URL=http://localhost:5173  # Frontend preview URL
PUPPETEER_TIMEOUT=30000             # Timeout for HTML fetch
```

### Template Engine Config

```javascript
// Modify in src/services/templateEngine.js
const CONFIG = {
  puppeteerTimeout: 30000,  // 30 seconds
  maxRetries: 2,             // Retry attempts
  retryDelay: 1000,          // Delay between retries (ms)
  enableFallback: true       // Use fallback on failure
};
```

## Case Studies

Case studies **always use uniform design** regardless of template:

- Uses `templateConvert.js` for consistency
- Accessible via `getCaseStudyHTML()` in template engine
- Same design across all templates for professional look

## Testing

### Test PDF Generation

```bash
# Test with Echelon template
curl "http://localhost:5000/api/pdf/portfolio/PORTFOLIO_ID?templateId=echolon" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-echelon.pdf

# Test with Serene template
curl "http://localhost:5000/api/pdf/portfolio/PORTFOLIO_ID?templateId=serene" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-serene.pdf

# Test complete portfolio
curl "http://localhost:5000/api/pdf/portfolio/PORTFOLIO_ID/complete?templateId=echolon" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-complete.pdf
```

### Verify Frontend Accessibility

```bash
# Start frontend
cd Aurea-frontend && npm run dev

# Test preview pages
curl "http://localhost:5173/template-preview/echelon?portfolioId=PORTFOLIO_ID&pdfMode=true"
curl "http://localhost:5173/template-preview/serene?portfolioId=PORTFOLIO_ID&pdfMode=true"
```

## Troubleshooting

### Frontend Not Accessible

**Symptom**: PDF generation fails with "Failed to fetch from frontend"

**Solution**:
1. Verify frontend is running: `http://localhost:5173`
2. Check `FRONTEND_URL` in backend `.env`
3. Test preview URL manually in browser
4. Check backend logs for specific error

**Fallback**: System will use `templateConvert.js` automatically

### Template Not Found

**Symptom**: 404 or "Template not found"

**Solution**:
1. Check template exists in `templateRegistry.js`
2. Verify preview route in `Aurea-frontend/src/App.jsx`
3. Check template ID spelling (e.g., "echolon" not "echelon")
4. Test preview URL manually

### PDF Looks Different Than Preview

**Possible Causes**:
1. **Fonts not loaded**: Increase `fontLoadDelay` in template settings
2. **Images not loaded**: Check `waitForSelectors` includes image containers
3. **CSS not applied**: Ensure `printBackground: true` in pdfSettings
4. **Viewport issues**: Adjust viewport dimensions in template settings

**Solution**: Adjust template's `puppeteerSettings` in registry

### Case Studies Missing

**Symptom**: Case studies not included in PDF

**Check**:
1. Case studies exist: `CaseStudy.find({ portfolioId })`
2. Projects have `hasCaseStudy: true` flag
3. Project IDs match case study `projectId` fields
4. Using `/complete` endpoint for full portfolio

## Performance Considerations

- **Browser Reuse**: Puppeteer browser instance cached for 5 minutes
- **Concurrent Requests**: Each request gets its own page instance
- **Memory**: Browser auto-closes after idle timeout
- **Timeout**: 30-second max per PDF generation
- **Fallback**: Fast fallback to templateConvert.js on failure

## Security Notes

- Preview pages respect portfolio access permissions
- Published portfolios accessible to public
- Unpublished portfolios require authentication
- `optionalAuth` middleware handles both cases
- Template IDs validated against registry

## Future Enhancements

Potential improvements:

1. **Template Caching**: Cache rendered HTML for faster generation
2. **Async Generation**: Queue system for large PDFs
3. **Server-Side Rendering**: Render React components on backend
4. **Custom Fonts**: Auto-download custom fonts for offline generation
5. **PDF Watermarks**: Add branding/watermarks to PDFs
6. **Batch Export**: Export multiple portfolios at once
7. **Template Versioning**: Support multiple versions of templates

## Migration Notes

### For Existing Portfolios

- Old portfolios continue to work with fallback
- `template` field mapped to `templateId` via `LEGACY_TEMPLATE_MAP`
- No database migration required
- Gradual adoption of new system

### For Developers

- `templateConvert.js` still used for case studies
- Backwards compatible with existing code
- All PDF endpoints accept `templateId` parameter
- Default behavior unchanged (uses portfolio's template)

## Support

For issues or questions:

1. Check backend logs for error details
2. Test preview URLs manually in browser
3. Verify frontend is accessible
4. Review template registry configuration
5. Check environment variables

---

**Last Updated**: October 2025
**System Version**: 2.0 (Dynamic Template Support)
