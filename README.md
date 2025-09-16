# AUREA Backend Setup

A Node.js/Express backend for the AUREA ## 🔧 Troubleshootingth MongoDB Atlas and Cloudinary integration.

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster
2. Create a database user
3. Get your connection string from: Database → Connect → Drivers → Node.js
4. Replace the placeholder values in `MONGO_URI`

### 4. Cloudinary Setup
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from Dashboard
3. Add them to your `.env` file

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Verify Setup
- Server should start on `http://localhost:3000`
- Health check: `GET http://localhost:3000/health`
- MongoDB connection should show as successful
- Cloudinary should initialize without errors

## 🔧 Troubleshooting

**MongoDB Connection Issues:**
- Check connection string format
- Verify username/password
- Ensure IP whitelist includes your IP

**Cloudinary Upload Issues:**
- Verify API credentials
- Check file size limits (5MB max)
- Ensure files are sent as form-data

**Server Issues:**
- Check Node.js version (14+)
- Verify all environment variables are set
- Check for port conflicts

## 📁 Project Structure
```
src/
├── config/
│   ├── database.js          # MongoDB connection
│   └── cloudinary.js        # Cloudinary configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── portfolioController.js # Portfolio CRUD
│   └── uploadController.js  # Image upload logic
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── upload.js           # File upload middleware
│   └── errorHandler.js     # Error handling
├── models/
│   ├── User.js             # User schema
│   └── Portfolio.js        # Portfolio schema
└── routes/
    ├── authRoutes.js       # Auth endpoints
    ├── portfolioRoutes.js  # Portfolio endpoints
    └── uploadRoutes.js     # Upload endpoints
```

That's it! Your AUREA backend should be ready to use. 🎉
