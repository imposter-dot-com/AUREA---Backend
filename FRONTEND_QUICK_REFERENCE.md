# Frontend Quick Reference: Subdomain Publishing

## 🚨 IMPORTANT CHANGE

**CustomSubdomain is now REQUIRED for ALL publishes (new and re-publish)**

## Quick API Reference

### Check Subdomain Availability

```
GET /api/portfolios/check-slug/:slug
Authorization: NOT Required (public endpoint)
Rate Limit: None (unlimited checks)
```

**Response**:
```json
// ✅ Available
{
  "success": true,
  "available": true,
  "message": "✅ This subdomain is available!",
  "subdomain": "my-portfolio"
}

// ❌ Not Available
{
  "success": true,
  "available": false,
  "message": "Error message here",
  "reason": "INVALID_FORMAT" | "TAKEN_BY_ANOTHER_USER" | "TAKEN_BY_YOUR_PORTFOLIO",
  "suggestions": ["alternative-1", "alternative-2"]
}
```

### Publish Portfolio

```
POST /api/sites/sub-publish
Authorization: Bearer {token}
Rate Limit: 5/min
Content-Type: application/json
```

**Request**:
```json
{
  "portfolioId": "string",
  "customSubdomain": "string" // ALWAYS REQUIRED (new and re-publish)
}
```

**Responses**:
```json
// ✅ Success (200)
{
  "success": true,
  "data": {
    "site": {
      "subdomain": "my-portfolio",
      "url": "aurea.tool/my-portfolio"
    }
  }
}

// ❌ Missing Subdomain (400)
{
  "success": false,
  "message": "Custom subdomain is required. Please choose a unique subdomain for your portfolio.",
  "required": "customSubdomain",
  "suggestions": ["suggested-name"]
}

// ❌ Invalid Format (400)
{
  "success": false,
  "message": "Validation error message",
  "suggestions": ["alternative-1", "alternative-2"]
}

// ❌ Already Taken (409)
{
  "success": false,
  "message": "Subdomain already taken",
  "subdomain": "my-portfolio",
  "available": false,
  "suggestions": ["my-portfolio-2025", "my-portfolio-1"]
}
```

## React Component Examples

### 1. Subdomain Input with Availability Check

```jsx
import { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';

export const SubdomainInput = ({ value, onChange }) => {
  const [status, setStatus] = useState('idle'); // idle, checking, available, unavailable
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const checkAvailability = debounce(async (slug) => {
    if (!slug || slug.length < 3) return;

    setStatus('checking');

    try {
      // No auth required - public endpoint!
      const res = await fetch(
        `${API_BASE}/api/portfolios/check-slug/${slug}`
      );

      const data = await res.json();

      setStatus(data.available ? 'available' : 'unavailable');
      setMessage(data.message);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setStatus('idle');
    }
  }, 500);

  useEffect(() => {
    checkAvailability(value);
  }, [value]);

  return (
    <div className="subdomain-input">
      <div className="input-group">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="my-portfolio"
          maxLength={30}
        />
        <span className="suffix">.aurea.tool</span>
      </div>

      {status === 'checking' && (
        <span className="checking">Checking availability...</span>
      )}

      {status === 'available' && (
        <span className="success">✅ {message}</span>
      )}

      {status === 'unavailable' && (
        <div className="error">
          <span>❌ {message}</span>
          {suggestions.length > 0 && (
            <div className="suggestions">
              <p>Try instead:</p>
              {suggestions.map(s => (
                <button key={s} onClick={() => onChange(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 2. Publish Form

```jsx
export const PublishForm = ({ portfolioId, currentSubdomain }) => {
  const [subdomain, setSubdomain] = useState(currentSubdomain || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Subdomain is ALWAYS required
    if (!subdomain) {
      alert('Please enter a subdomain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/sites/sub-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portfolioId,
          customSubdomain: subdomain  // ALWAYS provide subdomain
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      // Success
      navigate(`/portfolio/${data.data.site.subdomain}`);

    } catch (err) {
      setError('Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>{currentSubdomain ? 'Update subdomain' : 'Choose your subdomain'}</label>
        <SubdomainInput value={subdomain} onChange={setSubdomain} />
        {currentSubdomain && (
          <small>Current: {currentSubdomain}.aurea.tool</small>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading || !subdomain}>
        {loading ? 'Publishing...' : currentSubdomain ? 'Update' : 'Publish'}
      </button>
    </form>
  );
};
```

### 3. Simple Validation (Client-Side)

```javascript
export const validateSubdomain = (value) => {
  const errors = [];

  if (!value) {
    errors.push('Subdomain is required');
  }

  if (value.length < 3) {
    errors.push('Must be at least 3 characters');
  }

  if (value.length > 30) {
    errors.push('Cannot exceed 30 characters');
  }

  if (!/^[a-z0-9]/.test(value)) {
    errors.push('Must start with letter or number');
  }

  if (!/[a-z0-9]$/.test(value)) {
    errors.push('Must end with letter or number');
  }

  if (/[^a-z0-9-]/.test(value)) {
    errors.push('Only lowercase, numbers, hyphens allowed');
  }

  if (/--/.test(value)) {
    errors.push('No consecutive hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Common Patterns

### Pattern 1: New Publish (Subdomain Required)

```jsx
if (!portfolio.isPublished) {
  return (
    <div>
      <h2>Choose your subdomain</h2>
      <SubdomainInput value={subdomain} onChange={setSubdomain} />
      <button onClick={() => publish(subdomain)} disabled={!subdomain}>
        Publish
      </button>
    </div>
  );
}
```

### Pattern 2: Re-Publish (Subdomain Also Required)

```jsx
if (portfolio.isPublished) {
  return (
    <div>
      <p>Currently published at: {portfolio.slug}.aurea.tool</p>
      <h3>Update your subdomain</h3>
      <SubdomainInput value={subdomain} onChange={setSubdomain} />
      <button onClick={() => publish(subdomain)} disabled={!subdomain}>
        Update Published Portfolio
      </button>
    </div>
  );
}
```

### Pattern 3: Change Subdomain

```jsx
const [newSubdomain, setNewSubdomain] = useState('');
const [showChangeForm, setShowChangeForm] = useState(false);

return (
  <div>
    <p>Current: {portfolio.slug}.aurea.tool</p>

    {showChangeForm ? (
      <div>
        <SubdomainInput value={newSubdomain} onChange={setNewSubdomain} />
        <button onClick={() => publish({ customSubdomain: newSubdomain })}>
          Change Subdomain
        </button>
      </div>
    ) : (
      <button onClick={() => setShowChangeForm(true)}>
        Change Subdomain
      </button>
    )}
  </div>
);
```

## Error Handling Cheat Sheet

```javascript
const handlePublishError = (status, data) => {
  switch (status) {
    case 400:
      // Validation error or missing subdomain
      if (data.required === 'customSubdomain') {
        return 'Please choose a subdomain for your portfolio';
      }
      return data.message; // Format error

    case 409:
      // Subdomain conflict
      return {
        message: data.message,
        suggestions: data.suggestions
      };

    case 429:
      // Rate limited
      return 'Too many requests. Please wait a minute and try again.';

    default:
      return 'Failed to publish. Please try again.';
  }
};
```

## Validation Rules

```
✅ Valid:
- abc (min 3 chars)
- test-portfolio (hyphens ok)
- portfolio2025 (numbers ok)
- john-doe-designer (multiple hyphens ok)

❌ Invalid:
- AB (too short, < 3)
- test_portfolio (underscore not allowed)
- Test-Portfolio (uppercase not allowed)
- -test (starts with hyphen)
- test- (ends with hyphen)
- test--portfolio (consecutive hyphens)
- 31+ characters (too long)
- admin, api, www (reserved)
```

## Testing Checklist

- [ ] Check availability for valid subdomain
- [ ] Check availability for invalid format (shows suggestions)
- [ ] Check availability for reserved subdomain (shows suggestions)
- [ ] Check availability for taken subdomain (shows suggestions)
- [ ] Publish new portfolio without subdomain (requires it)
- [ ] Publish new portfolio with valid subdomain (succeeds)
- [ ] Publish new portfolio with invalid subdomain (shows error + suggestions)
- [ ] Publish new portfolio with taken subdomain (shows error + suggestions)
- [ ] Re-publish existing portfolio without subdomain (errors - requires subdomain)
- [ ] Re-publish existing portfolio with same subdomain (keeps current subdomain)
- [ ] Change subdomain of existing portfolio to new subdomain (updates)

## Common Issues & Solutions

### Issue: "Subdomain required" error

**Solution**: Always provide `customSubdomain` for both new and re-publish:

```javascript
// ALWAYS include customSubdomain
const body = {
  portfolioId,
  customSubdomain: subdomain  // Required for all publishes
};
```

### Issue: Rate limiting (429 errors)

**Solution**: Implement debouncing for availability checks:

```javascript
const debouncedCheck = debounce(checkAvailability, 500);
```

### Issue: Suggestions not showing

**Solution**: Check if `data.suggestions` exists:

```javascript
const suggestions = data.suggestions || [];
```

### Issue: User wants to keep same subdomain on re-publish

**Solution**: Send the same `customSubdomain` value to keep the existing subdomain:

```javascript
// Correct (keeps same subdomain)
{ portfolioId: "123", customSubdomain: "existing-slug" }

// Correct (changes to new subdomain)
{ portfolioId: "123", customSubdomain: "new-subdomain" }

// Wrong (missing subdomain - will error)
{ portfolioId: "123" }
```

## Quick Start Checklist

1. [ ] Add subdomain input to publish form
2. [ ] Implement real-time availability checking
3. [ ] Display suggestions when unavailable
4. [ ] Handle 400 error (missing/invalid subdomain)
5. [ ] Handle 409 error (subdomain taken)
6. [ ] Differentiate new publish vs re-publish UI
7. [ ] Add client-side validation
8. [ ] Debounce availability checks
9. [ ] Show loading states
10. [ ] Test all scenarios

## Support

- **Full Docs**: `SUBDOMAIN_REQUIREMENT_UPDATE.md`
- **Integration Guide**: `BACKEND_IMPROVEMENTS_FRONTEND_INTEGRATION.md`
- **API Docs**: `http://localhost:5000/api-docs`
- **Tests**: `node test/test-subdomain-required.js`

---

**Quick Links**:
- Check slug: `GET /api/portfolios/check-slug/:slug`
- Publish: `POST /api/sites/sub-publish`
- Unpublish: `DELETE /api/sites/unpublish/:portfolioId`

**Rate Limits**:
- Check slug: None (unlimited)
- Publish: 5/min
