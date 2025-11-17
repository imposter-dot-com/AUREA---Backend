# AUREA - Unified Troubleshooting Guide

**Quick solutions to common development issues across frontend and backend.**

This guide covers common errors, their root causes, and step-by-step solutions. Use the Quick Reference table to jump to your issue.

---

## 📑 Quick Reference Table

| Issue Category | Error/Symptom | Jump To |
|----------------|---------------|---------|
| **Environment** | "Cannot find module" / Dependencies fail | [Environment Setup](#-environment-setup-issues) |
| **Database** | "bad auth" / Connection timeout | [MongoDB Connection](#-mongodb-connection-issues) |
| **API/Network** | CORS errors / Network failed | [CORS & Network](#-cors--network-issues) |
| **Authentication** | 401 Unauthorized / Token invalid | [JWT Authentication](#-jwt-authentication-issues) |
| **File Upload** | Upload fails / Cloudinary errors | [File Uploads](#-file-upload-issues) |
| **Templates** | Template not rendering / Schema errors | [Template System](#-template-system-issues) |
| **Publishing** | Subdomain conflict / HTML not found | [Publishing & Deployment](#-publishing--deployment-issues) |
| **PDF Generation** | PDF fails / Puppeteer errors | [PDF Export](#-pdf-export-issues) |
| **Performance** | Slow queries / High memory | [Performance](#-performance-issues) |
| **Build/Deploy** | Build fails / Production errors | [Build & Deploy](#-build--deployment-errors) |

---

## 🔧 Environment Setup Issues

### Issue: "Cannot find module" or dependency errors

**Symptoms:**
```bash
Error: Cannot find module 'express'
Error: Cannot find module '@vitejs/plugin-react'
Module not found: Can't resolve 'react'
```

**Root Cause:**
- node_modules not installed
- Corrupted npm cache
- Wrong Node.js version
- package-lock.json mismatch

**Solution (Backend):**
```bash
cd AUREA---Backend

# 1. Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 2. Verify Node version
node --version  # Should be 18+ or 20+

# 3. If still failing, use legacy peer deps
npm install --legacy-peer-deps
```

**Solution (Frontend):**
```bash
cd Aurea-frontend

# 1. Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 2. Verify installation
npm list react  # Should show react@19.1.1
```

**Prevention:**
- Always commit package-lock.json
- Use same Node version across team (use `.nvmrc`)
- Don't manually edit package-lock.json

---

### Issue: Node version mismatch

**Symptoms:**
```bash
error @vitejs/plugin-react@4.2.1: The engine "node" is incompatible with this module
unsupported engine "node": ">=18.0.0"
```

**Root Cause:**
- Using Node.js version < 18

**Solution:**
```bash
# Check current version
node --version

# Install Node 18+ (using nvm)
nvm install 18
nvm use 18
nvm alias default 18

# Or install Node 20 LTS
nvm install 20
nvm use 20
```

**Create .nvmrc file (both repos):**
```bash
echo "20" > .nvmrc

# Team members can then use:
nvm use
```

---

### Issue: Environment variables not loading

**Symptoms (Backend):**
```bash
process.env.JWT_SECRET is undefined
MongooseError: MONGODB_URI not set
```

**Symptoms (Frontend):**
```bash
import.meta.env.VITE_API_BASE_URL is undefined
```

**Root Cause:**
- `.env` file missing
- `.env` in wrong location
- Variables not prefixed correctly (frontend)
- Server not restarted after `.env` changes

**Solution (Backend):**
```bash
cd AUREA---Backend

# 1. Check .env exists
ls -la .env

# 2. Copy from example if missing
cp .env.example .env

# 3. Edit with real values
nano .env

# 4. Verify loading
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI ? 'Loaded' : 'Failed')"

# 5. Restart server
npm run dev
```

**Solution (Frontend):**
```bash
cd Aurea-frontend

# 1. Create .env
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
EOF

# 2. IMPORTANT: Restart dev server
# Vite only loads .env on startup
npm run dev

# 3. Verify in browser console
console.log(import.meta.env.VITE_API_BASE_URL)
```

**Common mistakes:**
- ❌ Frontend variable without `VITE_` prefix
- ❌ Sensitive credentials in frontend `.env` (they get bundled!)
- ❌ Not restarting server after changes
- ❌ `.env` file in wrong directory

---

## 🗄️ MongoDB Connection Issues

### Issue: "bad auth : authentication failed"

**Symptoms:**
```bash
MongooseServerSelectionError: bad auth : authentication failed
MongooseError: password must be escaped
```

**Root Cause:**
- Password placeholder `<password>` not replaced
- Special characters in password not URL-encoded
- Wrong database name
- IP not whitelisted in MongoDB Atlas

**Solution:**

**Step 1: Fix password in MONGODB_URI**
```bash
# ❌ WRONG
MONGODB_URI=mongodb+srv://username:<password>@cluster.mongodb.net/aurea

# ✅ CORRECT
MONGODB_URI=mongodb+srv://username:MyActualP@ssw0rd@cluster.mongodb.net/aurea
```

**Step 2: URL-encode special characters**

If password contains special characters like `@`, `#`, `$`, `%`, `:`, `/`:

```bash
# Original password: MyP@ss#123
# URL-encoded: MyP%40ss%23123

MONGODB_URI=mongodb+srv://username:MyP%40ss%23123@cluster.mongodb.net/aurea
```

**URL encoding reference:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `:` → `%3A`
- `/` → `%2F`

**Step 3: Verify MongoDB Atlas settings**

1. Login to MongoDB Atlas
2. Navigate to Network Access
3. Click "Add IP Address"
4. Add `0.0.0.0/0` (allow all) for development
5. Production: Add specific IP addresses only

**Step 4: Test connection**
```bash
cd AUREA---Backend

node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ Connected'); process.exit(0); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });
"
```

**Prevention:**
- Use strong passwords without special characters
- Test connection string before committing
- Keep backup of working `.env` file

---

### Issue: Connection timeout

**Symptoms:**
```bash
MongooseServerSelectionError: connection <monitor> to ... timed out
Error: getaddrinfo ENOTFOUND cluster0.xxxxx.mongodb.net
```

**Root Cause:**
- No internet connection
- MongoDB Atlas cluster paused/deleted
- Firewall blocking MongoDB ports
- Wrong cluster URL

**Solution:**

**Step 1: Check internet**
```bash
ping 8.8.8.8
```

**Step 2: Verify cluster exists**
- Login to MongoDB Atlas
- Check cluster is running (not paused)
- Verify cluster name in connection string

**Step 3: Test DNS resolution**
```bash
# Extract hostname from connection string
# Example: cluster0.abc123.mongodb.net

nslookup cluster0.abc123.mongodb.net
# Should return IP addresses
```

**Step 4: Check firewall**
```bash
# Test MongoDB port (27017)
telnet cluster0.abc123.mongodb.net 27017

# Or use nc (netcat)
nc -zv cluster0.abc123.mongodb.net 27017
```

**Step 5: Try alternate connection string**

MongoDB Atlas provides multiple connection string formats:
1. Navigate to Cluster → Connect
2. Choose "Connect your application"
3. Copy new connection string
4. Update `.env`

---

### Issue: Database operation errors

**Symptoms:**
```bash
ValidationError: Portfolio validation failed: userId: Path `userId` is required
CastError: Cast to ObjectId failed for value "123" at path "_id"
MongooseError: Model.find() no longer accepts a callback
```

**Solutions:**

**ValidationError:**
```javascript
// Problem: Missing required field
const portfolio = new Portfolio({ title: 'Test' });
await portfolio.save();  // ❌ ValidationError: userId required

// Solution: Provide all required fields
const portfolio = new Portfolio({
  userId: req.user._id,  // ✅ Required field
  title: 'Test',
  content: {}
});
await portfolio.save();
```

**CastError (Invalid ObjectId):**
```javascript
// Problem: Invalid ID format
const portfolio = await Portfolio.findById('123');  // ❌ CastError

// Solution 1: Validate ID before query
const mongoose = require('mongoose');
if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({ success: false, message: 'Invalid ID' });
}
const portfolio = await Portfolio.findById(id);  // ✅

// Solution 2: Use try-catch
try {
  const portfolio = await Portfolio.findById(id);
} catch (error) {
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  throw error;
}
```

**Callback Error (Mongoose 7+):**
```javascript
// ❌ WRONG (callbacks removed in Mongoose 7+)
Portfolio.find({}, (err, docs) => { ... });

// ✅ CORRECT (use async/await)
const docs = await Portfolio.find({});

// ✅ CORRECT (use promises)
Portfolio.find({})
  .then(docs => { ... })
  .catch(err => { ... });
```

---

## 🌐 CORS & Network Issues

### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'http://localhost:5000/api/portfolios' from origin
'http://localhost:5173' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
- Backend not configured to allow frontend origin
- Request from disallowed origin
- Preflight OPTIONS request failing

**Solution (Backend):**

**Check `server.js` CORS configuration:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',      // ✅ Frontend dev server
  'http://localhost:3000',      // Alternative port
  'https://your-frontend.vercel.app',  // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('No origin header'), false);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: true,
}));
```

**Quick fix for development:**
```javascript
// Temporarily allow all origins (DEVELOPMENT ONLY!)
app.use(cors({ origin: true, credentials: true }));
```

**Restart backend after changes:**
```bash
cd AUREA---Backend
npm run dev
```

**Solution (Frontend):**

**Verify API base URL:**
```javascript
// Check .env
VITE_API_BASE_URL=http://localhost:5000  // ✅ No trailing slash

// Not
VITE_API_BASE_URL=http://localhost:5000/  // ❌ Trailing slash can cause issues
```

**Test from browser console:**
```javascript
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Prevention:**
- Add all frontend URLs to allowedOrigins
- Test CORS configuration in production before deploying
- Use environment variables for origins

---

### Issue: Network request failed / ERR_CONNECTION_REFUSED

**Symptoms:**
```
Error: Network Error
ERR_CONNECTION_REFUSED
Failed to fetch
```

**Root Cause:**
- Backend server not running
- Wrong API URL
- Firewall blocking requests
- Port already in use

**Diagnostic steps:**

**Step 1: Verify backend is running**
```bash
# Check if backend process is running
ps aux | grep node

# Check if port 5000 is listening
lsof -i :5000

# Or use netstat
netstat -an | grep 5000
```

**Step 2: Test backend health**
```bash
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123.456}
```

**Step 3: Check frontend API URL**
```javascript
// In browser console
console.log(import.meta.env.VITE_API_BASE_URL);
// Should output: http://localhost:5000
```

**Step 4: Verify no firewall blocking**
```bash
# macOS: Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Linux: Check iptables
sudo iptables -L
```

**Solutions:**

**Backend not running:**
```bash
cd AUREA---Backend
npm run dev
```

**Port conflict:**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

**Wrong API URL (frontend):**
```bash
# Update .env
echo "VITE_API_BASE_URL=http://localhost:5000" > .env

# Restart frontend
npm run dev
```

---

## 🔐 JWT Authentication Issues

### Issue: 401 Unauthorized on protected routes

**Symptoms:**
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

**Root Cause:**
- No token sent with request
- Token expired (30-day expiry)
- Token format invalid
- JWT_SECRET mismatch between environments

**Diagnostic steps:**

**Step 1: Check if token exists (Frontend)**
```javascript
// In browser console
const authData = JSON.parse(localStorage.getItem('aurea-auth-storage'));
console.log('Token:', authData?.state?.token);
console.log('User:', authData?.state?.user);
```

**Step 2: Check token format**

Token should be sent as:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 3: Verify token in Network tab**
- Open DevTools → Network tab
- Make API request
- Click request → Headers
- Check "Request Headers" for `Authorization: Bearer <token>`

**Step 4: Decode token (check expiry)**
```javascript
// In browser console
function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

const authData = JSON.parse(localStorage.getItem('aurea-auth-storage'));
const decoded = decodeJWT(authData.state.token);

console.log('Token issued:', new Date(decoded.iat * 1000));
console.log('Token expires:', new Date(decoded.exp * 1000));
console.log('Is expired:', Date.now() > decoded.exp * 1000);
```

**Solutions:**

**Token expired:**
```javascript
// Clear storage and login again
localStorage.clear();
// Navigate to /login
```

**Token not being sent:**

Check axios configuration in `src/lib/axios.js`:
```javascript
// Should have interceptor
axiosInstance.interceptors.request.use(config => {
  const authData = JSON.parse(localStorage.getItem('aurea-auth-storage'));
  if (authData?.state?.token) {
    config.headers.Authorization = `Bearer ${authData.state.token}`;
  }
  return config;
});
```

**JWT_SECRET mismatch (Backend):**
```bash
# Verify JWT_SECRET is set
cd AUREA---Backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing')"

# If missing, add to .env
echo "JWT_SECRET=your-super-secret-key-min-32-chars" >> .env

# Restart server
npm run dev
```

**Token format invalid:**

Backend expects: `Authorization: Bearer <token>`

Common mistakes:
- ❌ `Authorization: <token>` (missing "Bearer ")
- ❌ `Authorization: bearer <token>` (lowercase "bearer")
- ❌ `Token: <token>` (wrong header name)

---

### Issue: Login succeeds but user data not persisting

**Symptoms:**
- Login works, redirects to dashboard
- Refresh page → logged out again
- Dashboard shows "Not authenticated"

**Root Cause:**
- Token not saved to localStorage
- Zustand store not persisting
- Browser blocking localStorage (incognito/private mode)

**Diagnostic steps:**

**Step 1: Check localStorage**
```javascript
// Should return auth data
localStorage.getItem('aurea-auth-storage');

// Should return object with token
JSON.parse(localStorage.getItem('aurea-auth-storage'));
```

**Step 2: Check Zustand persist configuration**

File: `src/stores/authStore.js`
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        set({ user, token });  // ✅ This should trigger persist
      },
    }),
    {
      name: 'aurea-auth-storage',  // ✅ localStorage key
    }
  )
);
```

**Step 3: Test localStorage manually**
```javascript
// Try to set item
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test'));  // Should return 'value'

// If null → localStorage is blocked
```

**Solutions:**

**Browser blocking localStorage:**
- Disable private/incognito mode
- Check browser privacy settings
- Try different browser

**Zustand not persisting:**
```javascript
// Verify persist middleware is imported and used
import { persist } from 'zustand/middleware';

// Check storage config
{
  name: 'aurea-auth-storage',
  getStorage: () => localStorage,  // Can add this explicitly
}
```

**Force logout and re-login:**
```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();

// Login again and check
```

---

### Issue: "Token is required" but token is being sent

**Symptoms:**
- Network tab shows `Authorization: Bearer <token>`
- Backend still returns "Token is required"

**Root Cause:**
- Middleware order issue
- auth middleware not parsing headers correctly
- Token sent in wrong format

**Solution (Backend):**

**Check middleware order in routes:**
```javascript
// ✅ CORRECT order
router.get('/api/portfolios',
  auth,              // 1. Authenticate first
  validation,        // 2. Then validate
  ownership,         // 3. Then check ownership
  controller.getPortfolios
);

// ❌ WRONG order
router.get('/api/portfolios',
  validation,        // ❌ Validation before auth
  auth,
  controller.getPortfolios
);
```

**Check auth middleware (`src/middleware/auth.js`):**
```javascript
export const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];  // "Bearer <token>" → "<token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }

    // Verify token
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
```

**Debug logging:**
```javascript
// Temporarily add to auth middleware
console.log('Auth header:', req.headers.authorization);
console.log('Token:', token);
console.log('Decoded:', decoded);
```

---

## 📤 File Upload Issues

### Issue: File upload fails / "File too large"

**Symptoms:**
```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB"
}
```

**Root Cause:**
- File exceeds size limit (5MB)
- Wrong file type
- Multer middleware not configured
- Cloudinary upload failure

**Solutions:**

**Check file size:**
```javascript
// In browser before upload
const file = event.target.files[0];
const maxSize = 5 * 1024 * 1024;  // 5MB

if (file.size > maxSize) {
  alert(`File too large. Max size is ${maxSize / 1024 / 1024}MB`);
  return;
}
```

**Check file type:**
```javascript
// Allowed types in backend
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

if (!allowedTypes.includes(file.type)) {
  alert('Invalid file type. Only JPG, PNG, WebP allowed');
  return;
}
```

**Increase size limit (Backend):**

File: `src/middleware/upload.js`
```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024  // ✅ Changed to 10MB
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
```

**Check Cloudinary configuration (Backend):**
```bash
# Verify environment variables
node -e "
require('dotenv').config();
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');
"
```

---

### Issue: Cloudinary upload fails / "Invalid signature"

**Symptoms:**
```json
{
  "error": {
    "message": "Invalid signature",
    "http_code": 401
  }
}
```

**Root Cause:**
- Wrong Cloudinary credentials
- API key/secret mismatch
- Cloudinary not initialized

**Solution:**

**Step 1: Verify credentials**
- Login to Cloudinary Dashboard
- Navigate to Settings → Access Keys
- Copy Cloud Name, API Key, API Secret
- Update `.env`

```bash
# .env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456ghi789jkl
```

**Step 2: Test Cloudinary connection**
```bash
cd AUREA---Backend

node -e "
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('❌ Cloudinary error:', error);
  } else {
    console.log('✅ Cloudinary connected:', result);
  }
});
"
```

**Step 3: Check initialization in `server.js`**
```javascript
// Should be called early in server.js
initCloudinary();  // From src/config/cloudinary.js
```

**Step 4: Restart server**
```bash
npm run dev
```

---

### Issue: Image upload shows progress but doesn't complete

**Symptoms:**
- Upload progress bar shows 90-100%
- Never completes
- No error message
- Image not saved

**Root Cause:**
- Frontend not handling response correctly
- Backend returning wrong response format
- Network timeout

**Solution (Frontend):**

Check upload handler in component:
```javascript
const handleUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      },
      timeout: 60000  // ✅ 60 second timeout
    });

    console.log('Upload response:', response.data);  // ✅ Debug

    if (response.data.success) {
      setImageUrl(response.data.data.url);  // ✅ Check response structure
      setUploadProgress(0);
    }
  } catch (error) {
    console.error('Upload error:', error);  // ✅ Debug
    alert('Upload failed: ' + error.message);
  }
};
```

**Check response format (Backend):**

File: `src/controllers/uploadController.js`
```javascript
export const uploadImage = async (req, res) => {
  try {
    // ... upload to Cloudinary

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,      // ✅ HTTPS URL
        publicId: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    // ... error handling
  }
};
```

**Increase timeout (Frontend):**

File: `src/lib/axios.js`
```javascript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,  // ✅ 60 seconds (was 10000)
});
```

---

## 📄 Template System Issues

### Issue: Template not rendering / Blank page

**Symptoms:**
- Portfolio preview shows blank page
- Template components not loading
- Console shows no errors

**Root Cause:**
- Template data structure mismatch
- Missing required fields
- Template component not found
- Schema validation failing silently

**Diagnostic steps:**

**Step 1: Check template data structure**
```javascript
// In browser console or backend
console.log('Portfolio data:', JSON.stringify(portfolio, null, 2));

// Should have:
{
  "_id": "...",
  "userId": "...",
  "templateId": "...",  // ✅ Required
  "content": {          // ✅ Should match template schema
    "about": { ... },
    "projects": [ ... ],
    "contact": { ... }
  }
}
```

**Step 2: Verify template exists**
```bash
# Test template endpoint
curl http://localhost:5000/api/templates/<templateId>

# Should return template with schema
```

**Step 3: Validate data against schema**
```bash
# Test validation endpoint
curl -X POST http://localhost:5000/api/templates/<templateId>/validate \
  -H "Content-Type: application/json" \
  -d '{"content": { ... }}'
```

**Solutions:**

**Missing templateId:**
```javascript
// When creating portfolio
const portfolio = await Portfolio.create({
  userId: req.user._id,
  templateId: '...template-object-id...',  // ✅ Required
  content: { ... }
});
```

**Schema mismatch:**
```javascript
// Fetch template schema first
const template = await Template.findById(templateId);
const schema = template.schema;

// Validate content matches schema
const { error } = validateAgainstSchema(content, schema);
if (error) {
  console.error('Schema validation failed:', error);
}
```

**Template component not found:**

File: `src/App.jsx` or template router
```javascript
import EchelonTemplate from './templates/Echelon/EchelonTemplate';
import SereneTemplate from './templates/Serene/SereneTemplate';

// Map template IDs to components
const templateComponents = {
  'echelon': EchelonTemplate,
  'serene': SereneTemplate,
  // ... other templates
};

// Render correct template
const TemplateComponent = templateComponents[template.name.toLowerCase()];
if (!TemplateComponent) {
  return <div>Template not found: {template.name}</div>;
}
return <TemplateComponent data={portfolio.content} />;
```

---

### Issue: Schema validation errors

**Symptoms:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "content.about.name is required",
    "content.projects must be an array"
  ]
}
```

**Root Cause:**
- Content doesn't match template schema
- Missing required fields
- Wrong data types

**Solution:**

**Check template schema:**
```javascript
// Fetch template to see required fields
const template = await Template.findById(templateId);
console.log('Required fields:', template.schema.required);
console.log('Properties:', template.schema.properties);
```

**Provide all required fields:**
```javascript
// Example for Echelon template
const content = {
  about: {
    name: 'John Doe',           // ✅ Required
    title: 'Full Stack Developer',  // ✅ Required
    bio: 'About me...',         // ✅ Required
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'New York, USA',
    profileImage: 'https://...'
  },
  projects: [                   // ✅ Required (array)
    {
      id: 'project-1',
      title: 'Project Title',
      description: 'Description',
      image: 'https://...',
      technologies: ['React', 'Node.js']
    }
  ],
  skills: {                     // ✅ Required
    technical: ['JavaScript', 'Python'],
    soft: ['Communication', 'Teamwork']
  },
  contact: {                    // ✅ Required
    email: 'john@example.com',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe'
    }
  }
};
```

**Use template validation before saving:**
```javascript
// In controller
const { valid, errors } = await templateService.validateData(templateId, content);

if (!valid) {
  return res.status(400).json({
    success: false,
    message: 'Content validation failed',
    errors
  });
}

// Only save if validation passes
const portfolio = await Portfolio.create({ ... });
```

---

## 🚀 Publishing & Deployment Issues

### Issue: Subdomain conflict (409)

**Symptoms:**
```json
{
  "success": false,
  "message": "Subdomain 'johndoe' is already taken by another user"
}
```

**Root Cause:**
- Another user owns this subdomain
- Trying to publish with taken subdomain

**Solution:**

**Try different subdomain:**
```javascript
// Check if subdomain is available first
const response = await axios.post('/api/portfolios/check-slug', {
  slug: 'johndoe-portfolio'
});

if (response.data.available) {
  // Proceed with publishing
}
```

**See who owns the subdomain (admin only):**
```bash
cd AUREA---Backend

node -e "
require('dotenv').config();
require('./src/config/database').connectDB().then(async () => {
  const Site = require('./src/models/Site').default;
  const site = await Site.findOne({ subdomain: 'johndoe' }).populate('userId');
  console.log('Owner:', site?.userId?.email);
  process.exit(0);
});
"
```

**Update existing portfolio (if you own it):**

If you own the subdomain, you can update (not create new):
```javascript
// Publishing updates your existing site
await axios.post(`/api/sites/sub-publish`, {
  portfolioId: '...',
  customSubdomain: 'johndoe'  // You already own this
});
```

---

### Issue: Published portfolio shows 404

**Symptoms:**
- Publishing succeeds
- Navigate to `http://localhost:5000/sites/johndoe/html`
- Shows "Portfolio not found" error page

**Root Cause:**
- HTML files not generated
- Generated files deleted
- Wrong subdomain
- Site marked as unpublished

**Diagnostic steps:**

**Step 1: Check if files exist**
```bash
cd AUREA---Backend
ls -la generated-files/johndoe/

# Should show:
# index.html
# case-study-*.html (if case studies exist)
```

**Step 2: Check database record**
```bash
node -e "
require('dotenv').config();
require('./src/config/database').connectDB().then(async () => {
  const Site = require('./src/models/Site').default;
  const site = await Site.findOne({ subdomain: 'johndoe' });
  console.log('Site:', JSON.stringify(site, null, 2));
  process.exit(0);
});
"
```

**Step 3: Verify portfolio is published**
```bash
node -e "
require('dotenv').config();
require('./src/config/database').connectDB().then(async () => {
  const Portfolio = require('./src/models/Portfolio').default;
  const portfolio = await Portfolio.findOne({ slug: 'johndoe' });
  console.log('Published:', portfolio?.isPublished);
  console.log('Slug:', portfolio?.slug);
  process.exit(0);
});
"
```

**Solutions:**

**Files missing → Republish:**
```javascript
// Call publish endpoint again
await axios.post('/api/sites/sub-publish', {
  portfolioId: '...',
  customSubdomain: 'johndoe'
});
```

**Portfolio not marked as published:**
```javascript
// Call portfolio publish endpoint
await axios.post(`/api/portfolios/${portfolioId}/publish`);
```

**Check file permissions:**
```bash
cd AUREA---Backend

# generated-files directory should be writable
ls -ld generated-files/
# Should show: drwxr-xr-x

# If not, fix permissions
chmod 755 generated-files/
```

---

### Issue: Case studies not showing in published portfolio

**Symptoms:**
- Portfolio publishes successfully
- Main page loads correctly
- Case study links return 404
- Projects don't show "View Case Study" button

**Root Cause:**
- Case studies not linked to portfolio properly
- projectId mismatch
- Case study HTML not generated
- hasCaseStudy flag not set

**Diagnostic steps:**

**Step 1: Check if case studies exist**
```bash
curl http://localhost:5000/api/case-studies/portfolio/<portfolioId> \
  -H "Authorization: Bearer <token>"
```

**Step 2: Check projectId matching**
```javascript
// Portfolio projects should have matching case study projectIds
// Portfolio:
{
  content: {
    projects: [
      { id: 'project-1', title: '...' },  // ← This 'id'
      { id: 'project-2', title: '...' }
    ]
  }
}

// Case Study:
{
  portfolioId: '...',
  projectId: 'project-1',  // ← Must match portfolio project 'id'
  content: { ... }
}
```

**Step 3: Check generated files**
```bash
ls -la generated-files/johndoe/

# Should include:
# case-study-project-1.html
# case-study-project-2.html
```

**Solutions:**

**Create case study with matching projectId:**
```javascript
await axios.post('/api/case-studies', {
  portfolioId: '...',
  projectId: 'project-1',  // ✅ Must match portfolio project id
  content: {
    hero: { title: '...', subtitle: '...' },
    overview: { challenge: '...', solution: '...', impact: '...' },
    sections: [ ... ]
  }
});
```

**Republish after adding case studies:**
```javascript
// Adding case studies AFTER publishing requires republish
await axios.post('/api/sites/sub-publish', {
  portfolioId: '...',
  customSubdomain: 'johndoe'
});
```

**Verify hasCaseStudy flag:**
```javascript
// Publishing should set this automatically
// Check portfolio data:
{
  content: {
    projects: [
      {
        id: 'project-1',
        hasCaseStudy: true,  // ✅ Should be set during publishing
        title: '...'
      }
    ]
  }
}
```

---

## 📑 PDF Export Issues

### Issue: PDF generation fails / Times out

**Symptoms:**
```json
{
  "success": false,
  "message": "PDF generation failed: Navigation timeout"
}
```

**Root Cause:**
- Frontend preview page not loading
- Puppeteer timeout (default 30s)
- Browser pool exhausted
- Memory issues

**Solution:**

**Step 1: Test preview page loads**
```bash
# Check if preview URL is accessible
curl http://localhost:5173/preview/echelon/<portfolioId>?pdfMode=true

# Should return HTML (not error)
```

**Step 2: Increase timeout**

File: `src/services/templateEngine.js`
```javascript
await page.goto(previewUrl, {
  waitUntil: 'networkidle0',
  timeout: 60000  // ✅ Increased to 60 seconds (was 30000)
});
```

**Step 3: Check browser pool**

File: `.env`
```bash
# Reduce pool size if memory constrained
PDF_BROWSER_POOL_SIZE=1  # Default is 3

# Increase timeout
PDF_BROWSER_IDLE_TIMEOUT=600000  # 10 minutes (was 5)
```

**Step 4: Restart server (to apply pool changes)**
```bash
npm run dev
```

**Step 5: Check memory usage**
```bash
# Monitor memory while generating PDF
top -pid $(pgrep -f "node.*server.js")

# Or use htop
htop -p $(pgrep -f "node.*server.js")
```

**Memory issues → Reduce concurrent PDFs:**
```javascript
// Limit concurrent PDF generation
let activePDFGeneration = 0;
const MAX_CONCURRENT = 2;

if (activePDFGeneration >= MAX_CONCURRENT) {
  return res.status(503).json({
    success: false,
    message: 'PDF service busy, try again later'
  });
}
```

---

### Issue: PDF missing styles / Broken layout

**Symptoms:**
- PDF generates successfully
- But styles not applied
- Layout broken or plain HTML

**Root Cause:**
- External stylesheets not loaded
- Fonts not embedded
- CSS not fully rendered before capture

**Solution:**

**Ensure styles are inline (Template component):**
```jsx
// In template component
<div style={{
  fontFamily: 'Arial, sans-serif',  // ✅ Inline styles
  color: '#333',
  padding: '20px'
}}>
  {/* Content */}
</div>

// Or use Tailwind (processed into inline styles by Vite)
<div className="font-sans text-gray-900 p-6">
  {/* Content */}
</div>
```

**Wait for fonts to load (Backend):**

File: `src/services/templateEngine.js`
```javascript
// After page.goto()
await page.evaluateHandle('document.fonts.ready');  // ✅ Wait for fonts
await new Promise(resolve => setTimeout(resolve, 2000));  // ✅ Extra 2s wait
```

**Embed external fonts:**
```jsx
// In template component
<Helmet>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
</Helmet>
```

**Wait for network idle:**
```javascript
await page.goto(previewUrl, {
  waitUntil: 'networkidle0',  // ✅ Wait until no more network requests
  timeout: 60000
});
```

---

### Issue: PDF shows "Loading..." or template data instead of real data

**Symptoms:**
- PDF generates
- Shows placeholder text like "Your Name Here"
- Or shows "Loading portfolio data..."

**Root Cause:**
- Template component not receiving data
- API request failing in preview mode
- React component not rendering before PDF capture

**Solution:**

**Pass pdfMode query parameter:**
```javascript
// In templateEngine.js
const previewUrl = `${FRONTEND_URL}/preview/${templateName}/${portfolioId}?pdfMode=true`;
```

**Check preview component receives portfolioId:**
```jsx
// In template preview component
function TemplatePreview() {
  const { id } = useParams();  // ✅ portfolioId from URL
  const [pdfMode] = useSearchParams();

  useEffect(() => {
    if (id) {
      // Fetch portfolio data
      fetchPortfolio(id);
    }
  }, [id]);

  if (!portfolio) {
    return <div>Loading...</div>;  // ← This might show in PDF
  }

  return <TemplateComponent data={portfolio} />;
}
```

**Wait for data to load before capture:**
```javascript
// In templateEngine.js
await page.goto(previewUrl, { waitUntil: 'networkidle0' });

// Wait for specific element to confirm data loaded
await page.waitForSelector('[data-pdf-ready="true"]', {
  timeout: 30000
});
```

**Add data-ready indicator in template:**
```jsx
{portfolio && (
  <div data-pdf-ready="true">
    {/* Template content */}
  </div>
)}
```

---

## ⚡ Performance Issues

### Issue: Slow database queries

**Symptoms:**
- API endpoints taking > 1 second
- Dashboard slow to load
- Portfolio listing timeout

**Diagnostic steps:**

**Enable MongoDB query logging:**
```javascript
// In database.js
mongoose.set('debug', true);  // Shows all queries in console
```

**Check slow query:**
```bash
# Example slow query output:
Mongoose: portfolios.find({ userId: ObjectId("...") }) [142ms]
```

**Solution:**

**Add indexes for common queries:**
```javascript
// In Portfolio model
portfolioSchema.index({ userId: 1, createdAt: -1 });  // ✅ User's portfolios
portfolioSchema.index({ isPublished: 1, publishedAt: -1 });  // ✅ Public portfolios
portfolioSchema.index({ slug: 1 });  // ✅ Lookup by slug

// Check existing indexes
node -e "
require('dotenv').config();
require('./src/config/database').connectDB().then(async () => {
  const Portfolio = require('./src/models/Portfolio').default;
  const indexes = await Portfolio.collection.getIndexes();
  console.log('Indexes:', JSON.stringify(indexes, null, 2));
  process.exit(0);
});
"
```

**Use lean() for read-only queries:**
```javascript
// ❌ SLOW (returns Mongoose documents)
const portfolios = await Portfolio.find({ userId });

// ✅ FAST (returns plain JavaScript objects)
const portfolios = await Portfolio.find({ userId }).lean();
```

**Use select() to limit fields:**
```javascript
// ❌ SLOW (fetches all fields including large content)
const portfolios = await Portfolio.find({ userId });

// ✅ FAST (only fetch needed fields)
const portfolios = await Portfolio.find({ userId })
  .select('title slug isPublished createdAt')
  .lean();
```

**Implement pagination:**
```javascript
// ❌ SLOW (fetches all portfolios)
const portfolios = await Portfolio.find({ userId });

// ✅ FAST (pagination)
const page = 1;
const limit = 10;
const portfolios = await Portfolio.find({ userId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();
```

---

### Issue: High memory usage / Server crashes

**Symptoms:**
```bash
<--- Last few GCs --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Root Cause:**
- Memory leak
- Too many concurrent operations
- Large file processing
- PDF generation memory spike

**Diagnostic steps:**

**Check memory usage:**
```bash
# Linux
free -h
ps aux | grep node

# macOS
top -pid $(pgrep -f "node.*server")
```

**Monitor Node.js heap:**
```bash
node --expose-gc --inspect server.js

# Then in Chrome DevTools:
# chrome://inspect → Open dedicated DevTools → Memory tab
```

**Solutions:**

**Increase Node.js heap size:**
```bash
# In package.json scripts
"dev": "NODE_OPTIONS='--max-old-space-size=4096' nodemon server.js"
# 4096 = 4GB (default is 512MB)
```

**Reduce browser pool size (for PDF generation):**
```bash
# .env
PDF_BROWSER_POOL_SIZE=1  # Reduce from 3
```

**Implement request queuing:**
```javascript
// Limit concurrent requests
const queue = [];
let active = 0;
const MAX_CONCURRENT = 5;

async function processWithLimit(fn) {
  if (active >= MAX_CONCURRENT) {
    await new Promise(resolve => queue.push(resolve));
  }

  active++;
  try {
    return await fn();
  } finally {
    active--;
    if (queue.length > 0) {
      const resolve = queue.shift();
      resolve();
    }
  }
}
```

**Fix memory leaks - common causes:**
```javascript
// ❌ BAD: Event listeners not removed
EventEmitter.on('event', handler);

// ✅ GOOD: Remove listeners
const handler = () => { ... };
EventEmitter.on('event', handler);
// Later:
EventEmitter.off('event', handler);

// ❌ BAD: Large objects in closure
function createHandler() {
  const largeData = new Array(1000000);
  return () => {
    console.log(largeData.length);  // ← Keeps largeData in memory
  };
}

// ✅ GOOD: Don't capture large objects
function createHandler() {
  const size = new Array(1000000).length;
  return () => {
    console.log(size);  // ← Only keeps the number
  };
}
```

---

### Issue: Frontend bundle size too large / Slow page load

**Symptoms:**
- `npm run build` shows large bundle (> 1MB)
- Initial page load takes > 3 seconds
- Large JavaScript files in Network tab

**Solution:**

**Analyze bundle:**
```bash
cd Aurea-frontend

npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })  // ✅ Opens bundle analysis
  ]
});

# Build and analyze
npm run build
# Opens stats.html showing bundle breakdown
```

**Code splitting improvements:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'animation': ['framer-motion', 'gsap'],
          'ui': ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
});
```

**Lazy load routes:**
```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PortfolioBuilder = lazy(() => import('./pages/PortfolioBuilder'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/builder/:id" element={<PortfolioBuilder />} />
      </Routes>
    </Suspense>
  );
}
```

**Remove unused dependencies:**
```bash
# Find unused packages
npm install -g depcheck
depcheck

# Remove unused packages
npm uninstall <package-name>
```

---

## 🏗️ Build & Deployment Errors

### Issue: Production build fails

**Symptoms (Backend):**
```bash
npm run build
> aurea-backend@1.0.0 build
> npm audit --production
# Shows vulnerabilities or fails
```

**Symptoms (Frontend):**
```bash
npm run build
✘ [ERROR] Could not resolve "..."
Build failed with 1 error
```

**Solutions:**

**Backend audit issues:**
```bash
# Check vulnerabilities
npm audit

# Auto-fix if possible
npm audit fix

# Force fix (may break things)
npm audit fix --force

# If can't fix, document and suppress
npm audit --production --audit-level=moderate
```

**Frontend build errors:**

**Missing import:**
```javascript
// Error: Could not resolve "./Component"
import Component from './Component';

// ✅ Fix: Add file extension
import Component from './Component.jsx';
```

**Environment variable missing:**
```bash
# Add to .env.production
VITE_API_BASE_URL=https://your-api.com
```

**Clear build cache:**
```bash
rm -rf dist/ node_modules/.vite
npm run build
```

---

### Issue: Production deployment - "Application Error"

**Symptoms:**
- Build succeeds locally
- Deployment succeeds
- Production URL shows "Application Error"
- Or shows blank page

**Diagnostic steps:**

**Check deployment logs:**

**Railway (Backend):**
- Open project in Railway
- Click "Deployments"
- Check logs for errors

**Vercel (Frontend):**
- Open project in Vercel
- Click deployment → "View Function Logs"

**Common production errors:**

**Missing environment variables:**
```bash
# Railway: Go to Variables tab
# Add all required variables from .env

# Vercel: Settings → Environment Variables
# Add VITE_API_BASE_URL, etc.
```

**MongoDB connection in production:**
```bash
# Must use Atlas connection string (not localhost)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aurea

# Whitelist deployment IP in MongoDB Atlas
# Or use 0.0.0.0/0 for testing
```

**CORS issues in production:**
```javascript
// Add production frontend URL to allowedOrigins
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-app.vercel.app',  // ✅ Add production URL
];
```

**Solution template:**

1. **Check environment variables** are set in deployment platform
2. **Check logs** for specific error messages
3. **Test API health endpoint**: `https://your-api.com/health`
4. **Verify database connection** works from deployment IP
5. **Update CORS** to allow production frontend URL
6. **Redeploy** after making changes

---

## 🔍 Advanced Debugging Techniques

### Backend Debugging

**Enable detailed logging:**
```javascript
// In server.js or specific controller
import logger from './src/infrastructure/logging/Logger.js';

logger.setLevel('debug');  // Show all log levels

// In code
logger.debug('Detailed debug info', { data });
logger.info('Info message', { context });
logger.warn('Warning message', { details });
logger.error('Error occurred', { error });
```

**Use VS Code debugger:**

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Set breakpoints, press F5 to debug.

**Database query debugging:**
```javascript
// Enable query logging
mongoose.set('debug', true);

// Or log specific query
const portfolios = await Portfolio.find({ userId }).explain();
console.log('Query plan:', portfolios);
```

### Frontend Debugging

**React DevTools:**
- Install browser extension
- Inspect component tree
- Check props and state
- Profile performance

**Redux DevTools (for Zustand):**
```javascript
// Add to store
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({ /* ... */ }),
      { name: 'aurea-auth-storage' }
    ),
    { name: 'AuthStore' }  // ✅ Shows in Redux DevTools
  )
);
```

**Network debugging:**
```javascript
// In axios.js - Add request/response logging
axiosInstance.interceptors.request.use(config => {
  console.log('→ Request:', config.method.toUpperCase(), config.url, config.data);
  return config;
});

axiosInstance.interceptors.response.use(
  response => {
    console.log('← Response:', response.config.url, response.data);
    return response;
  },
  error => {
    console.error('← Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

---

## 📞 Getting Help

If you've tried everything in this guide and still stuck:

### What to Include When Asking for Help

1. **What you're trying to do**
   - "Trying to upload an image to Cloudinary"

2. **What you expected**
   - "Image should upload and return URL"

3. **What actually happened**
   - "Gets 401 error"

4. **Error message** (exact text)
   ```
   {"success":false,"message":"Invalid signature","http_code":401}
   ```

5. **Environment details**
   - OS: Ubuntu 22.04
   - Node version: v20.10.0
   - npm version: 10.2.3
   - Browser: Chrome 120

6. **Code snippet** (relevant part only)
   ```javascript
   const response = await axios.post('/api/upload/image', formData);
   ```

7. **What you've tried**
   - Checked .env file
   - Verified Cloudinary credentials
   - Restarted server

8. **Screenshots** (if UI issue)
   - Browser console
   - Network tab

### Resources

- **Backend Architecture**: `docs/SYSTEM_ARCHITECTURE.md`
- **Frontend Architecture**: `Aurea-frontend/docs/SYSTEM_ARCHITECTURE.md`
- **API Documentation**: `http://localhost:5000/api-docs`
- **Onboarding Guide**: `docs/NEW_DEVELOPER_ONBOARDING.md`
- **Full Stack Guide**: `FULL_STACK_DEVELOPMENT_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`

---

## ✅ Troubleshooting Checklist

Before asking for help, verify:

- [ ] Node.js version is 18+ (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists with all required variables
- [ ] Backend server is running (`curl http://localhost:5000/health`)
- [ ] Frontend dev server is running (`http://localhost:5173`)
- [ ] MongoDB is connected (check server logs)
- [ ] No errors in browser console (F12 → Console)
- [ ] No errors in backend logs
- [ ] Tried restarting both servers
- [ ] Tried clearing browser localStorage (`localStorage.clear()`)
- [ ] Checked Network tab for failed requests
- [ ] Read error message carefully
- [ ] Searched this document for error keywords

**Most issues are solved by:**
1. Restarting servers
2. Checking environment variables
3. Verifying backend is running
4. Clearing browser storage
5. Reading error messages carefully

Good luck! 🚀
