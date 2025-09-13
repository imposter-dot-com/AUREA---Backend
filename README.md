# AUREA Backend API (ES6 Modules)

A modern Node.js/Express backend for the AUREA Portfolio Builder platform with MongoDB Atlas integration using ES6 modules.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment Setup:**
```bash
cp .env.example .env
```

3. **Configure MongoDB Atlas:**
   - Create a MongoDB Atlas cluster
   - Get your connection string from: Database → Connect → Drivers → Node.js
   - **IMPORTANT**: Replace `<aureaverysecuredpassword>` in `.env` file with your actual MongoDB password
   - Generate a strong JWT secret for `JWT_SECRET`

4. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## ⚡ ES6 Module Features

This project now uses modern ES6 module syntax:
- `import`/`export` instead of `require`/`module.exports`
- `"type": "module"` in package.json
- All file imports include `.js` extensions
- Modern async/await patterns throughout

## 🔧 Environment Variables

```bash
# MongoDB Configuration - REPLACE <aureaverysecuredpassword> with your actual password!
MONGO_URI=mongodb+srv://aureaAdmin:YOUR_ACTUAL_PASSWORD@aurea-backend.v0ccn50.mongodb.net/?retryWrites=true&w=majority&appName=aurea-backend

# JWT Configuration
JWT_SECRET=aureasupersecretkeythatshouldbelongenough

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

## 🚨 IMPORTANT: Fix Authentication Error

The server is currently showing: `❌ Error connecting to MongoDB: bad auth : authentication failed`

**To fix this:**

1. **Get your MongoDB Atlas password**:
   - Go to MongoDB Atlas Dashboard
   - Database Access → Database Users
   - Find user `aureaAdmin` or create a new one
   - Copy or reset the password

2. **Update .env file**:
```bash
# Replace this line in .env:
MONGO_URI=mongodb+srv://aureaAdmin:<aureaverysecuredpassword>@aurea-backend...

# With your actual password:
MONGO_URI=mongodb+srv://aureaAdmin:YourRealPassword123@aurea-backend...
```

3. **If password contains special characters**, URL encode them:
```bash
# Special characters that need encoding:
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
[ → %5B
] → %5D
% → %25
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

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/signup`
Register a new user.
```javascript
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get JWT token.
```javascript
// Request Body
{
  "email": "john@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).
```javascript
// Headers
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "data": {
    "user": { /* user object */ }
  }
}
```

#### PUT `/api/auth/me`
Update current user profile (requires authentication).
```javascript
// Headers
Authorization: Bearer <jwt_token>

// Request Body
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### Portfolio Routes (`/api/portfolios`)

#### POST `/api/portfolios`
Create a new portfolio (requires authentication).
```javascript
// Headers
Authorization: Bearer <jwt_token>

// Request Body
{
  "title": "My UI/UX Portfolio",
  "template": "modern",
  "sections": [
    {
      "type": "about",
      "content": {
        "text": "About me...",
        "image": "profile.jpg"
      }
    },
    {
      "type": "projects",
      "content": {
        "projects": [...]
      }
    }
  ]
}
```

#### GET `/api/portfolios/me`
Get current user's portfolios (requires authentication).

#### GET `/api/portfolios/public`
Get public portfolios.

#### GET `/api/portfolios/:id`
Get portfolio by ID.

#### PUT `/api/portfolios/:id`
Update portfolio (requires authentication, owner only).

#### DELETE `/api/portfolios/:id`
Delete portfolio (requires authentication, owner only).

#### GET `/api/portfolios/slug/:slug`
Get portfolio by slug (for SEO-friendly URLs).

## 🛡️ Security Features

- **ES6 Modules**: Modern module system
- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: 30-day expiration tokens
- **CORS Configuration**: Configurable allowed origins
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Comprehensive error responses
- **Authorization**: Route-level access control

## 📁 Project Structure (ES6)

```
AUREA - Backend/
├── src/
│   ├── config/
│   │   └── database.js         # MongoDB connection (ES6)
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication (ES6)
│   │   └── errorHandler.js    # Global error handling (ES6)
│   ├── models/
│   │   ├── User.js           # User schema (ES6)
│   │   └── Portfolio.js      # Portfolio schema (ES6)
│   └── routes/
│       ├── auth.js           # Authentication routes (ES6)
│       └── portfolios.js     # Portfolio CRUD routes (ES6)
├── server.js                 # Main application file (ES6)
├── package.json             # Dependencies and scripts (with "type": "module")
├── .env                     # Environment variables
├── .env.example            # Environment template
└── .gitignore              # Git ignore rules
```

## 🚦 Health Check

Check if the server is running:
```bash
GET /health
```

Response:
```javascript
{
  "success": true,
  "message": "AUREA Backend is running",
  "timestamp": "2025-09-13T...",
  "environment": "development"
}
```

## 🔄 Development Workflow

1. **Fix MongoDB password first**:
   - Update `.env` file with your real MongoDB Atlas password
   - Save the file

2. **Start development server**:
```bash
npm run dev
```

3. **Expected successful output**:
```
🔗 Connecting to MongoDB Atlas...
✅ MongoDB Connected: aurea-backend-shard-00-02.v0ccn50.mongodb.net
📊 Database: aurea
🏓 Pinged your deployment. You successfully connected to MongoDB!
🚀 AUREA Backend Server running on port 5000
```

4. **Test API endpoints**:
   - Use Postman, Insomnia, or Thunder Client
   - Health check: `GET http://localhost:5000/health`
   - Test signup: `POST http://localhost:5000/api/auth/signup`

## 🤝 Frontend Integration

Your React frontend should:
1. Store JWT token in localStorage/sessionStorage
2. Include token in Authorization header: `Bearer <token>`
3. Handle auth state management
4. Implement portfolio builder UI

Example frontend fetch (ES6):
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/portfolios/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🐛 Troubleshooting

- **"bad auth : authentication failed"**: Replace `<aureaverysecuredpassword>` with your real MongoDB password
- **MongoDB Connection Issues**: Check connection string and IP whitelist
- **CORS Errors**: Verify CLIENT_URL in .env matches frontend URL
- **JWT Issues**: Ensure JWT_SECRET is set and tokens aren't expired
- **ES6 Module Errors**: Ensure Node.js version supports ES6 modules (v14+)
