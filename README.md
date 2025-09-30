# 🌟 AUREA Backend API

A modern Node.js/Express backend for the AUREA Portfolio Builder platform featuring **dynamic HTML portfolio generation**, **AI-powered PDF extraction** for pricing calculator tools, **site publishing**, MongoDB Atlas integration, Cloudinary image handling, and comprehensive API documentation.

## ✨ Key Features

- 🎨 **Dynamic HTML Portfolio Generation** - Convert portfolio data to deployable HTML sites
- 🚀 **Site Publishing & Deployment** - Publish portfolios with custom subdomains
- 🤖 **Two-Step AI PDF Processing** - Advanced document analysis with Gemini AI
- 📊 **Pricing Calculator Integration** - Extract pricing-relevant data from client briefs  
- 🔐 **JWT Authentication** - Secure user management with optional auth
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
<<<<<<< Updated upstream
=======
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

# Site Publishing & Deployment
VERCEL_TOKEN=your-vercel-deployment-token

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

>>>>>>> Stashed changes
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

## � **MAIN FEATURE: Dynamic HTML Portfolio Generation**

Our advanced portfolio generation system converts user portfolio data into fully deployable HTML websites with:

### ✨ Key Capabilities
- **Dynamic Content Integration** - Uses actual user data (name, bio, projects, images)
- **Cloudinary Image Integration** - Automatically includes uploaded images
- **Custom Styling** - Applies user's color schemes and font preferences
- **Responsive Design** - TailwindCSS-powered responsive layouts
- **No External Dependencies** - Self-contained HTML with inline CSS/JS
- **SEO Optimized** - Proper meta tags and semantic HTML structure
- **Auto-Generated Subdomains** - Creates unique domains from user's name in portfolio

### 🛠️ How It Works
1. **Portfolio Data Processing** - Converts database portfolio format to template-ready data
2. **Dynamic HTML Generation** - Uses `generateExactHTML.js` service to create complete HTML
3. **Image Integration** - Replaces placeholders with actual Cloudinary URLs
4. **Site Publishing** - Generates deployable files with unique subdomains
5. **Vercel Deployment** - Ready for immediate deployment

### 📂 Generated Site Structure
```
generated-files/portfolio-subdomain/
├── index.html          # Complete responsive portfolio
├── package.json        # Deployment configuration
└── vercel.json        # Vercel deployment settings
```

### 🚀 Quick Test
Visit the API documentation at `http://localhost:5000/api-docs` to test the portfolio publishing functionality.

## 🎯 **SECONDARY FEATURE: Two-Step PDF Extraction**

Our flagship feature extracts comprehensive data from client proposal PDFs using advanced AI processing:

### 🔍 How It Works
**Step 1**: Complete document analysis - extracts ALL information  
**Step 2**: Pricing-focused filtering - filters pricing calculator relevant data

### � Extracted Data Structure
The system extracts comprehensive project information including client details, project requirements, timeline, budget, deliverables, and pricing factors through a two-step analysis process.

### 🛠️ Quick Test
- Test API connectivity: `GET /api/proposals/test-gemini`
- Upload and process PDF via Swagger UI at `http://localhost:5000/api-docs`
- Navigate to: `POST /api/proposals/extract`

## 📊 Database Schema

### Users Collection
Complete user information including name, email, hashed password, and embedded portfolio documents with timestamps.

### Portfolios Collection (Embedded in Users)
Portfolio data structure including title, description, template selection, dynamic sections (hero, about, projects, contact), comprehensive styling options (colors, fonts, spacing), publishing status, and metadata.

### Sites Collection
Site publishing data including user and portfolio references, subdomain and custom domain settings, Vercel deployment information, status tracking, and deployment timestamps.

## 🔗 API Endpoints Overview

### 🎨 Site Publishing Routes (`/api/site`) - **NEW FEATURE**

#### `POST /api/site/publish` - Publish Portfolio as Website
Convert portfolio data to deployable HTML and publish with custom subdomain.

**Features:**
- Dynamic HTML generation with user's actual data
- Cloudinary image integration
- Custom styling application
- Vercel deployment ready
- Unique subdomain assignment

**Request Parameters:**
- `portfolioId`: Portfolio ID to publish
- `customDomain`: Optional custom domain

**Subdomain Generation:**
Automatically generates unique subdomain from user's name in the hero section (e.g., "John Doe" becomes "john-doe-portfolio")

**Response:**
Returns success status, site information (auto-generated subdomain, URLs, deployment ID), portfolio details, and file generation summary.

#### `POST /api/site/debug-generate` - Debug HTML Generation
Test HTML generation without publishing.

#### `GET /api/site/user-sites` - Get User's Published Sites
Retrieve all sites published by the authenticated user.

### 📝 Proposal Extraction (Main Feature)

#### `POST /api/proposals/extract` - Two-Step PDF Processing
Upload and extract structured data from PDF proposals using advanced AI analysis.

**Features:**
- Two-step processing: Complete analysis → Pricing focus
- Gemini 2.5 Pro with intelligent fallback (2.5 Flash → 1.5 Pro → 1.5 Flash → Pro)
- Optional authentication (defaults to 'anonymous')
- Perfect for pricing calculator workflows

**Request:**
Upload PDF file via multipart/form-data

**Response:**
Returns structured data with complete document analysis and pricing-focused information, processing details including model used and timing, plus metadata about the extraction.

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
├── src/                          # Source code directory
│   ├── config/                   # Configuration files
│   ├── controllers/              # Business logic controllers
│   ├── middleware/               # Express middleware
│   ├── models/                   # Database schemas
│   ├── routes/                   # API route definitions
│   └── services/                 # External service integrations
│       └── generateExactHTML.js  # Core HTML generation engine
├── generated-files/              # Generated portfolio sites
├── uploads/                      # File upload directory
├── swagger.yaml                  # Complete API documentation
├── package.json                  # Dependencies and scripts
├── server.js                     # Application entry point
└── README.md                     # Project documentation
```

## � Optimized Dependencies

**Production Dependencies:**
Core packages including AI processing, authentication, image handling, web framework, database ODM, and API documentation tools.

**Development Dependencies:**
Auto-restart development server with nodemon.

**🧹 Removed Unused Dependencies:**
- `@google/generative-ai` (duplicate AI library)
- `pdf-poppler` (unused PDF processor)
- `pdf2json` (unused JSON converter)

## 🚀 Development Workflow

### 1. Setup & Start
- Install dependencies: `npm install`
- Configure environment: Copy `.env.example` to `.env` and edit with your credentials
- Start development server: `npm run dev`

### 2. Testing PDF Extraction
- Test AI connectivity: `GET /api/proposals/test-gemini`
- Interactive testing: Visit `http://localhost:5000/api-docs`

### 3. API Documentation
- **Interactive UI**: `http://localhost:5000/api-docs`
- **JSON Spec**: `http://localhost:5000/api-docs.json`  
- **YAML Spec**: `http://localhost:5000/api-docs.yaml`

### 4. Health Monitoring
Server health check available at `GET /health` endpoint.

## 🎯 Use Cases & Integration

### Portfolio Publishing Platform
Perfect for creative professionals who need to:
1. **Create Dynamic Portfolios** with custom sections and styling
2. **Upload & Manage Images** via Cloudinary integration
3. **Publish Live Websites** with custom subdomains
4. **Deploy Instantly** to Vercel with zero configuration
5. **Share Professional Portfolios** with clients and employers

### Pricing Calculator Integration
Perfect for agencies and freelancers who need to:
1. **Upload client brief PDFs** 
2. **Extract project requirements** automatically
3. **Analyze complexity factors** for accurate pricing
4. **Generate pricing recommendations** based on extracted data

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 🔑 Authentication Errors
**Issue**: "bad auth : authentication failed"  
**Solution**: Replace `<password>` in MONGO_URI with actual password

#### 🤖 AI Processing Errors  
**Issue**: "API key not configured" or "Quota exceeded"  
**Solution**: Get fresh API key from https://aistudio.google.com

#### 📁 File Upload Issues
**Issue**: "No file uploaded" or file size errors  
**Solution**: Check file type (PDF only) and size (max 10MB)

#### 🌐 CORS Issues
**Issue**: Frontend can't connect to backend  
**Solution**: Update CLIENT_URL in .env to match your frontend URL

#### 📦 Dependency Issues
**Issue**: Node.js version warnings  
**Solution**: Use Node.js 18+ (20+ recommended for GenAI)

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` when running `npm run dev`.

Check logs for:
- MongoDB connection success
- Swagger UI availability  
- GenAI API connectivity

## 🚀 Production Deployment

### Environment Setup
Configure production environment variables including NODE_ENV, PORT, CLIENT_URL, MONGO_URI, and GEMINI_API_KEY.

### Build & Start
- Production build check: `npm run build`
- Start production server: `npm start`

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
