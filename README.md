# 🌟 AUREA Backend API

A modern Node.js/Express backend for the AUREA Portfolio Builder platform featuring **AI-powered PDF extraction** for pricing calculator tools, MongoDB Atlas integration, Cloudinary image handling, and comprehensive API documentation.

## ✨ Key Features

- 🤖 **Two-Step AI PDF Processing** - Advanced document analysis with Gemini AI
- 📊 **Pricing Calculator Integration** - Extract pricing-relevant data from client briefs  
- � **JWT Authentication** - Secure user management with optional auth
- 📁 **Portfolio Management** - Complete portfolio CRUD operations
- 🖼️ **Image Upload** - Cloudinary integration for media handling
- 📖 **Interactive Documentation** - Swagger UI with live testing
- ⚡ **ES6 Modules** - Modern JavaScript with clean architecture

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended, v20+ for optimal GenAI performance)
- MongoDB Atlas account
- Cloudinary account  
- Google AI Studio API key (for PDF processing)

### 1. Installation
```bash
# Clone and install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env
```

**Required Environment Variables:**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aurea

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key

# AI Processing (for PDF extraction)
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# Image Upload
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key  
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
🚀 AUREA Backend Server running on port 5000
📊 Environment: development
✅ MongoDB Connected: cluster-name.mongodb.net
📚 API Documentation: http://localhost:5000/api-docs
```

## 🎯 **MAIN FEATURE: Two-Step PDF Extraction**

Our flagship feature extracts comprehensive data from client proposal PDFs using advanced AI processing:

### 🔍 How It Works
**Step 1**: Complete document analysis - extracts ALL information  
**Step 2**: Pricing-focused filtering - filters pricing calculator relevant data

### � Extracted Data Structure
```javascript
{
  "step1_complete_analysis": {
    "clientInfo": { "name": "...", "contact": {...}, "address": "..." },
    "projectDetails": { "title": "...", "description": "...", "scope": [...] },
    "requirements": [...],
    "timeline": { "startDate": "...", "endDate": "...", "milestones": [...] },
    "budget": { "total": 50000, "currency": "USD", "breakdown": [...] },
    "deliverables": [...],
    "constraints": [...],
    "assumptions": [...],
    "risks": [...]
  },
  "step2_pricing_focused": {
    "requirementsComplexity": { "level": "high", "factors": [...] },
    "projectOverview": { "type": "...", "scope": "...", "complexity": "..." },
    "deadlineUrgency": { "urgency": "medium", "timeframe": "...", "factors": [...] },
    "budgetInfo": { "hasBudget": true, "range": "...", "flexibility": "..." },
    "clientProjectInfo": { "industry": "...", "size": "...", "experience": "..." },
    "pricingFactors": [...]
  }
}
```

### 🛠️ Quick Test
```bash
# Test API connectivity
curl http://localhost:5000/api/proposals/test-gemini

# Upload and process PDF (via Swagger UI)
# Visit: http://localhost:5000/api-docs
# Navigate to: POST /api/proposals/extract
```

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  password: String, // bcrypt hashed
  createdAt: Date,
  updatedAt: Date
}
```

### Portfolios Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to Users
  title: String,
  template: String,
  sections: [
    {
      type: String, // 'about', 'projects', 'contact', etc.
      content: Object // Flexible JSON content
    }
  ],
  published: Boolean,
  isPublic: Boolean,
  slug: String,
  viewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 API Endpoints Overview

### 📝 Proposal Extraction (Main Feature)

#### `POST /api/proposals/extract` - Two-Step PDF Processing
Upload and extract structured data from PDF proposals using advanced AI analysis.

**Features:**
- Two-step processing: Complete analysis → Pricing focus
- Gemini 2.5 Pro with intelligent fallback (2.5 Flash → 1.5 Pro → 1.5 Flash → Pro)
- Optional authentication (defaults to 'anonymous')
- Perfect for pricing calculator workflows

**Request:**
```bash
curl -X POST http://localhost:5000/api/proposals/extract \
  -H "Content-Type: multipart/form-data" \
  -F "pdf=@client_proposal.pdf"
```

**Response Structure:**
```javascript
{
  "success": true,
  "message": "PDF processed successfully with two-step method",
  "data": {
    "step1_complete_analysis": { /* Complete document data */ },
    "step2_pricing_focused": { /* Pricing calculator specific data */ }
  },
  "processing": {
    "method": "two-step",
    "model_used": "gemini-2.5-pro",
    "processing_time": "42.3s"
  },
  "metadata": { /* File info and extraction details */ }
}
```

#### `GET /api/proposals/test-gemini` - Test AI Connection
Verify GenAI API connectivity and available models.

#### `GET /api/proposals/history` - Extraction History  
Retrieve PDF extraction history (currently returns empty array).

### 🔐 Authentication Routes (`/api/auth`)

#### `POST /api/auth/signup` - User Registration
#### `POST /api/auth/login` - User Authentication  
#### `GET /api/auth/me` - Get User Profile
#### `PUT /api/auth/me` - Update User Profile

### 📁 Portfolio Routes (`/api/portfolios`)

#### `POST /api/portfolios` - Create Portfolio
#### `GET /api/portfolios/me` - Get User Portfolios
#### `GET /api/portfolios/public` - Get Public Portfolios
#### `GET /api/portfolios/:id` - Get Portfolio by ID
#### `PUT /api/portfolios/:id` - Update Portfolio
#### `DELETE /api/portfolios/:id` - Delete Portfolio
#### `GET /api/portfolios/slug/:slug` - Get Portfolio by Slug

### 🖼️ Upload Routes (`/api/upload`)

#### `POST /api/upload/single` - Upload Single Image
#### `POST /api/upload/multiple` - Upload Multiple Images  
#### `DELETE /api/upload/:publicId` - Delete Image

### 🏥 System Routes

#### `GET /health` - Health Check
#### `GET /api-docs` - Interactive API Documentation
#### `GET /` - API Information

## 🛡️ Security & Architecture

### Security Features
- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: 30-day expiration tokens with optional auth
- **CORS Configuration**: Configurable allowed origins  
- **Input Validation**: Comprehensive Mongoose schema validation
- **Error Handling**: Global error middleware with detailed responses
- **File Upload Security**: Type validation and size limits
- **API Rate Limiting**: Built-in Express protection

### Modern Architecture
- **ES6 Modules**: Modern `import`/`export` syntax throughout
- **Async/Await**: Promise-based asynchronous operations
- **Clean Code Structure**: Organized by feature and responsibility
- **Environment Configuration**: Centralized `.env` management
- **Middleware Pipeline**: Modular request processing
- **Database Integration**: MongoDB with Mongoose ODM

## 📁 Clean Project Structure

```
AUREA---Backend/
├── src/
│   ├── config/
│   │   ├── database.js           # MongoDB Atlas connection
│   │   ├── cloudinary.js        # Image upload configuration
│   │   └── swagger.js           # API documentation setup
│   ├── controllers/
│   │   ├── authController.js     # User authentication logic
│   │   ├── portfolioController.js # Portfolio CRUD operations
│   │   ├── proposalExtract.genai.controller.js # 🎯 Main PDF AI processor
│   │   └── uploadController.js   # Image upload handling
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── requestLogger.js     # Request logging middleware
│   │   └── upload.js           # Multer file upload middleware
│   ├── models/
│   │   ├── User.js             # User database schema
│   │   └── Portfolio.js        # Portfolio database schema
│   └── routes/
│       ├── authRoutes.js        # Authentication endpoints
│       ├── portfolioRoutes.js   # Portfolio endpoints  
│       ├── proposalExtract.routes.js # 🎯 PDF extraction endpoints
│       └── uploadRoutes.js      # Image upload endpoints
├── uploads/                     # File upload directory
├── swagger.yaml                 # 📖 Complete API documentation
├── package.json                 # 📦 Clean dependencies (optimized)
├── server.js                    # 🚀 Application entry point
├── .env                         # Environment configuration
└── README.md                    # 📋 This documentation
```

## � Optimized Dependencies

**Production Dependencies:**
```json
{
  "@google/genai": "^1.21.0",           // AI processing for PDF extraction
  "bcrypt": "^6.0.0",                   // Password hashing
  "cloudinary": "^2.7.0",               // Image upload service
  "cors": "^2.8.5",                     // Cross-origin requests
  "dotenv": "^17.2.2",                  // Environment management
  "express": "^5.1.0",                  // Web framework
  "jsonwebtoken": "^9.0.2",             // JWT authentication
  "mongoose": "^8.18.1",                // MongoDB ODM
  "multer": "^2.0.2",                   // File upload handling
  "pdf-text-extract": "^1.5.0",        // PDF text extraction
  "swagger-jsdoc": "^6.2.8",            // API documentation
  "swagger-ui-express": "^5.0.1"        // Interactive documentation UI
}
```

**Development Dependencies:**
```json
{
  "nodemon": "^3.1.10"                  // Auto-restart development server
}
```

**🧹 Removed Unused Dependencies:**
- `@google/generative-ai` (duplicate AI library)
- `pdf-poppler` (unused PDF processor)
- `pdf2json` (unused JSON converter)

## 🚀 Development Workflow

### 1. Setup & Start
```bash
# Install clean dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### 2. Testing PDF Extraction
```bash
# Test AI connectivity
curl http://localhost:5000/api/proposals/test-gemini

# Interactive testing
open http://localhost:5000/api-docs
```

### 3. API Documentation
- **Interactive UI**: `http://localhost:5000/api-docs`
- **JSON Spec**: `http://localhost:5000/api-docs.json`  
- **YAML Spec**: `http://localhost:5000/api-docs.yaml`

### 4. Health Monitoring
```bash
# Server health check
curl http://localhost:5000/health

# Expected response:
{
  "success": true,
  "message": "AUREA Backend is running",
  "timestamp": "2025-09-26T...",
  "environment": "development"
}
```

## 🎯 Use Cases & Integration

### Pricing Calculator Integration
Perfect for agencies and freelancers who need to:
1. **Upload client brief PDFs** 
2. **Extract project requirements** automatically
3. **Analyze complexity factors** for accurate pricing
4. **Generate pricing recommendations** based on extracted data

### Portfolio Builder Features  
Complete platform for creative professionals:
- **User Registration & Authentication**
- **Portfolio Creation & Management**
- **Template Selection & Customization**
- **Image Upload & Media Management**
- **Public Portfolio Sharing**
- **SEO-Friendly URLs**

### Frontend Integration Example
```javascript
// React/Next.js integration
const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  
  const response = await fetch('/api/proposals/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Optional
    },
    body: formData
  });
  
  const result = await response.json();
  
  // Use extracted data for pricing calculator
  const { step1_complete_analysis, step2_pricing_focused } = result.data;
  
  // Calculate pricing based on complexity, deadline, etc.
  const pricing = calculatePricing(step2_pricing_focused);
};
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 🔑 Authentication Errors
```bash
# "bad auth : authentication failed"
# ✅ Solution: Replace <password> in MONGO_URI with actual password
MONGO_URI=mongodb+srv://username:REAL_PASSWORD@cluster.mongodb.net/aurea
```

#### 🤖 AI Processing Errors  
```bash
# "API key not configured" or "Quota exceeded"
# ✅ Solution: Get fresh API key from https://aistudio.google.com
GEMINI_API_KEY=your-fresh-api-key-here
```

#### 📁 File Upload Issues
```bash
# "No file uploaded" or file size errors
# ✅ Solution: Check file type (PDF only) and size (max 10MB)
curl -X POST -F "pdf=@document.pdf" http://localhost:5000/api/proposals/extract
```

#### 🌐 CORS Issues
```bash
# Frontend can't connect to backend
# ✅ Solution: Update CLIENT_URL in .env
CLIENT_URL=http://localhost:3000  # Match your frontend URL
```

#### 📦 Dependency Issues
```bash
# Node.js version warnings
# ✅ Solution: Use Node.js 18+ (20+ recommended for GenAI)
node --version  # Should be v18+
```

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development npm run dev

# Check logs for:
# ✅ MongoDB connection success
# ✅ Swagger UI availability  
# ✅ GenAI API connectivity
```

## 🚀 Production Deployment

### Environment Setup
```env
# Production environment variables
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
MONGO_URI=mongodb+srv://user:pass@production-cluster.mongodb.net/aurea
GEMINI_API_KEY=prod-api-key
```

### Build & Start
```bash
# Production build check
npm run build

# Start production server
npm start
```

### Health Monitoring
Monitor these endpoints in production:
- `GET /health` - Server status
- `GET /api/proposals/test-gemini` - AI service status  
- Database connection logs in console

## 📈 Performance Optimization

- **PDF Processing**: ~30-45s per document (depends on AI model and document complexity)
- **Model Fallback**: Automatic switching to faster models on quota limits
- **File Caching**: Temporary PDF storage with automatic cleanup
- **MongoDB Indexing**: Optimized queries for user and portfolio data
- **CORS Optimization**: Minimal header processing
- **Error Recovery**: Graceful handling of AI service interruptions

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- Use ES6+ features consistently
- Follow existing file structure
- Add JSDoc comments for complex functions
- Update swagger.yaml for new endpoints
- Test all endpoints before submitting

---

## 📞 Support

- **Documentation**: http://localhost:5000/api-docs
- **Issues**: Create GitHub issue with detailed description
- **Email**: support@aurea.com

**🎉 Ready to build amazing portfolios with AI-powered PDF extraction!**
