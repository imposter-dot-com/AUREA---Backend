# Puppeteer PDF Generation in Production

This guide explains how to fix Puppeteer PDF generation failures in production environments (Railway, Heroku, Vercel Functions, Docker).

## The Problem

Puppeteer requires a Chrome/Chromium browser to generate PDFs. Production environments typically:
- Don't include Chrome/Chromium binaries
- Lack system dependencies (fonts, graphics libraries)
- Have limited memory and `/dev/shm` space
- May timeout during Chromium installation

## Solutions by Platform

### Railway (Recommended: nixpacks.toml)

**Status**: ✅ Already configured in `nixpacks.toml`

Railway uses Nixpacks for builds. We've configured it to install Chromium:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "chromium"]

[variables]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
```

**Deployment Steps**:

1. **Commit the configuration**:
   ```bash
   git add nixpacks.toml
   git commit -m "Add Chromium for PDF generation"
   git push
   ```

2. **Railway will automatically**:
   - Detect `nixpacks.toml`
   - Install Chromium via Nix package manager
   - Skip Puppeteer's Chromium download (saves ~280MB)
   - Set correct executable path

3. **Verify in Railway logs**:
   ```
   🔍 Using system Chrome: /nix/store/.../chromium
   ✅ Puppeteer browser initialized successfully
   ```

**Troubleshooting**:
- If still failing, check Railway environment variables include `NODE_ENV=production`
- Check memory usage (upgrade to Railway Pro if needed - Puppeteer needs 1GB+ RAM)
- View logs: Railway Dashboard → Deployments → View Logs

---

### Heroku (Buildpack Method)

**Steps**:

1. **Add Puppeteer Heroku buildpack**:
   ```bash
   heroku buildpacks:add jontewks/puppeteer
   heroku buildpacks:add heroku/nodejs
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

**Alternative**: Use [puppeteer-heroku-buildpack](https://github.com/jontewks/puppeteer-heroku-buildpack)

---

### Docker (Custom Dockerfile)

Create a `Dockerfile` with Chromium dependencies:

```dockerfile
FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
```

**Build and run**:
```bash
docker build -t aurea-backend .
docker run -p 5000:5000 --env-file .env aurea-backend
```

---

### Render.com

**Steps**:

1. **Add build command** in Render dashboard:
   ```bash
   npm install && apt-get update && apt-get install -y chromium
   ```

2. **Set environment variables**:
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
   - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`

---

## Alternative: External PDF Service

If Puppeteer continues to fail, use a dedicated PDF service:

### Option 1: Browserless.io (Cloud Service)

**Steps**:

1. **Sign up**: https://browserless.io (Free tier: 6 hours/month)

2. **Install puppeteer-core** (lighter than puppeteer):
   ```bash
   npm uninstall puppeteer
   npm install puppeteer-core
   ```

3. **Update `pdfGenerationService.js`**:
   ```javascript
   import puppeteer from 'puppeteer-core';

   const initializeBrowser = async () => {
     const browser = await puppeteer.connect({
       browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
     });
     return browser;
   };
   ```

4. **Set environment variable**:
   ```bash
   BROWSERLESS_TOKEN=your-api-key
   ```

**Pros**: No Chrome installation needed, scales automatically
**Cons**: Costs money after free tier, external dependency

---

### Option 2: PDFShift / HTML2PDF APIs

Replace Puppeteer entirely with a PDF API:

```javascript
// Example with PDFShift
const response = await axios.post(
  'https://api.pdfshift.io/v3/convert/pdf',
  { source: htmlContent },
  { auth: { username: 'api', password: process.env.PDFSHIFT_KEY } }
);
```

---

## Testing PDF Generation

### Local Test
```bash
curl http://localhost:5000/api/pdf/portfolio/{portfolioId}
```

### Production Test
```bash
curl https://aurea-backend-production-8a87.up.railway.app/api/pdf/portfolio/{portfolioId}
```

**Expected Response**: PDF binary data
**Error Response**: Check logs for initialization errors

---

## Memory Requirements

Puppeteer memory usage:
- **Minimum**: 512MB RAM
- **Recommended**: 1GB+ RAM
- **With multiple concurrent PDFs**: 2GB+ RAM

**Railway Plans**:
- Hobby: 512MB RAM (may struggle with concurrent requests)
- Pro: 8GB RAM (recommended for production)

---

## Debugging Production Issues

### Enable Detailed Logging

The updated code in `pdfGenerationService.js` now logs:
```
🔍 Using system Chrome: /path/to/chromium
✅ Puppeteer browser initialized successfully
```

Or if it fails:
```
Failed to initialize Puppeteer browser: [error message]
Error details: { message, stack, env }
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to launch chrome` | Missing Chrome | Add `nixpacks.toml` or use buildpack |
| `Could not find Chrome` | Wrong executable path | Check `PUPPETEER_EXECUTABLE_PATH` |
| `Cannot find module 'puppeteer'` | Missing dependency | Run `npm install` |
| `Navigation timeout` | Slow network/images | Increase timeout in code |
| `Protocol error` | Out of memory | Upgrade Railway plan |

### Check Railway Logs

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

---

## Current Status

✅ **Code Updated**: `pdfGenerationService.js` now auto-detects system Chrome
✅ **Railway Config**: `nixpacks.toml` configured to install Chromium
✅ **Environment Docs**: `.env.example` updated with Puppeteer variables

**Next Steps**:
1. Push changes to Railway
2. Monitor deployment logs
3. Test PDF endpoint
4. If still failing, check memory usage and consider upgrading plan

---

## Fallback Plan

If PDF generation continues to fail, implement a graceful fallback:

```javascript
// In pdfExportController.js
try {
  const pdfResult = await generatePortfolioPDF(...);
  res.send(pdfResult.buffer);
} catch (error) {
  // Fallback: Return HTML instead or queue for async processing
  res.status(503).json({
    success: false,
    message: 'PDF generation temporarily unavailable',
    fallback: {
      html: `/api/sites/${portfolioId}/html`,
      note: 'Please try again later or use print-to-PDF from browser'
    }
  });
}
```

---

## Additional Resources

- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [Railway Nixpacks Docs](https://nixpacks.com/)
- [Heroku Puppeteer Buildpack](https://github.com/jontewks/puppeteer-heroku-buildpack)
- [Browserless.io Docs](https://docs.browserless.io/)
