# PDF Generation Fix for Railway Deployment

## Problem
The PDF download endpoint (`/api/pdf/portfolio/:id/download`) was returning 500 errors in production on Railway because Puppeteer couldn't launch Chromium. Railway's containerized environment doesn't include Chromium by default.

## Solution Implemented

### 1. Nixpacks Configuration (`.nixpacks/nixpacks.toml`)
Created a Nixpacks configuration file to ensure Chromium and all required dependencies are installed during Railway's build process.

### 2. Serverless Chrome Support
Added `@sparticuz/chromium` and `puppeteer-core` packages for serverless Chrome compatibility. The system now automatically detects the deployment environment and uses the appropriate Chrome binary.

### 3. Enhanced BrowserPool.js
Modified the browser pool to:
- Detect Railway/Vercel/serverless environments
- Use `@sparticuz/chromium` for serverless deployments
- Fall back to system Chromium if available
- Provide detailed error messages for debugging

### 4. Production Optimizations in pdfGenerationService.js
- Increased default timeout from 10s to 30s for production
- Enabled fast mode by default on Railway
- Added memory reduction options for constrained environments
- Improved error messages with specific remediation steps

### 5. Health Check Endpoint
Added `/health/puppeteer` endpoint to verify Chrome launches correctly:
```bash
curl https://your-app.railway.app/health/puppeteer
```

### 6. Environment Variables Documentation
Updated `.env.example` with comprehensive PDF configuration variables and Railway-specific recommendations.

## Deployment Instructions

### Step 1: Set Railway Environment Variables

Add these environment variables in your Railway dashboard:

```bash
# Required for Railway
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
USE_SERVERLESS_CHROME=true

# Optimized settings for Railway
PDF_BROWSER_POOL_SIZE=1
PDF_FAST_MODE=true
PDF_MAX_TIMEOUT=30000
PDF_SKIP_IMAGE_WAIT=true
PDF_REDUCE_MEMORY=true
PDF_CACHE_MAX_MEMORY=100
PDF_CACHE_ENABLED=true

# Your existing variables
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Step 2: Deploy to Railway

1. Commit and push the changes:
```bash
git add .
git commit -m "Fix PDF generation for Railway deployment"
git push origin main
```

2. Railway will automatically rebuild with the new Nixpacks configuration

### Step 3: Verify the Fix

1. Check Puppeteer health:
```bash
curl https://your-app.railway.app/health/puppeteer
```

2. Test PDF generation:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.railway.app/api/pdf/portfolio/PORTFOLIO_ID/download
```

## Troubleshooting

### If PDF generation still fails:

1. **Check Railway logs** for specific error messages:
   - Look for "Chrome binary not found"
   - Check for memory errors
   - Review timeout errors

2. **Verify environment variables** are set correctly in Railway dashboard

3. **Test health endpoint** to see detailed error information:
```bash
curl https://your-app.railway.app/health/puppeteer
```

4. **Memory issues**:
   - Ensure `PDF_BROWSER_POOL_SIZE=1`
   - Set `PDF_REDUCE_MEMORY=true`
   - Consider upgrading Railway plan for more memory

5. **Timeout issues**:
   - Increase `PDF_MAX_TIMEOUT` to 60000 (60 seconds)
   - Enable `PDF_FAST_MODE=true`
   - Set `PDF_SKIP_IMAGE_WAIT=true`

## Alternative Solutions

If the above doesn't work:

### Option 1: Use Docker with Chromium
Create a `Dockerfile` with Chromium pre-installed:
```dockerfile
FROM node:18-slim

# Install Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["npm", "start"]
```

### Option 2: Use External PDF Service
Consider using a dedicated PDF generation service like:
- Puppeteer as a Service (e.g., Browserless.io)
- PDF generation APIs (e.g., PDFShift, Documint)

## Performance Considerations

### Memory Usage
- Each Chrome instance uses ~100-300MB
- PDF cache adds additional memory
- Railway free tier has limited memory

### Optimization Tips
1. Use `PDF_BROWSER_POOL_SIZE=1` for minimal memory
2. Enable `PDF_FAST_MODE=true` for faster generation
3. Set `PDF_REDUCE_MEMORY=true` to lower quality but save memory
4. Reduce `PDF_CACHE_MAX_MEMORY` to 100MB or less

## Monitoring

### Key Metrics to Watch
- Memory usage in Railway dashboard
- Response times for PDF endpoints
- Error rates in Railway logs

### Useful Commands
```bash
# Check health
curl https://your-app.railway.app/health

# Check Puppeteer health
curl https://your-app.railway.app/health/puppeteer

# Monitor logs
railway logs --tail
```

## Summary

This fix addresses the root cause of PDF generation failures on Railway by:
1. Installing Chromium via Nixpacks configuration
2. Supporting serverless Chrome with @sparticuz/chromium
3. Optimizing for Railway's resource constraints
4. Providing detailed debugging capabilities

The solution is production-ready and optimized for Railway's containerized environment.