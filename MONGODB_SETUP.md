# MongoDB Atlas Setup Guide

## 🔧 Complete Setup Instructions

### Step 1: Replace the Password in .env

In your `.env` file, replace `<db_password>` with your actual MongoDB Atlas password:

```bash
# Before (won't work):
MONGO_URI=mongodb+srv://aureaAdmin:<db_password>@aurea-backend.v0ccn50.mongodb.net/?retryWrites=true&w=majority&appName=aurea-backend

# After (replace YOUR_ACTUAL_PASSWORD):
MONGO_URI=mongodb+srv://aureaAdmin:YOUR_ACTUAL_PASSWORD@aurea-backend.v0ccn50.mongodb.net/?retryWrites=true&w=majority&appName=aurea-backend
```

### Step 2: Verify MongoDB Atlas Configuration

1. **Database User Permissions**:
   - Go to Database Access in MongoDB Atlas
   - Ensure `aureaAdmin` user exists and has `readWrite` permissions
   - If not, create a new user with these permissions

2. **Network Access (IP Whitelist)**:
   - Go to Network Access in MongoDB Atlas
   - Add your current IP address OR add `0.0.0.0/0` for development (allows all IPs)
   - Make sure the access list is not empty

3. **Cluster Status**:
   - Ensure your cluster `aurea-backend` is running (not paused)

### Step 3: Test the Connection

Run the server:
```bash
npm run dev
```

You should see:
```
🔗 Connecting to MongoDB Atlas...
✅ MongoDB Connected: aurea-backend-shard-00-02.v0ccn50.mongodb.net
📊 Database: aurea
🏓 Pinged your deployment. You successfully connected to MongoDB!
```

### Step 4: Common Issues & Solutions

#### Issue: "querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net"
**Solution**: 
- Check your internet connection
- Verify the cluster hostname is correct
- Ensure your IP is whitelisted in Network Access

#### Issue: "Authentication failed"
**Solution**:
- Double-check your username and password
- Ensure the user has proper database permissions
- Make sure password doesn't contain special characters that need URL encoding

#### Issue: "Connection timeout"
**Solution**:
- Check Network Access settings in MongoDB Atlas
- Try adding `0.0.0.0/0` to allow all IPs (for development only)
- Check firewall settings

### Step 5: URL Encoding Special Characters

If your password contains special characters, you may need to URL encode them:

| Character | URL Encoded |
|-----------|-------------|
| @         | %40         |
| :         | %3A         |
| /         | %2F         |
| ?         | %3F         |
| #         | %23         |
| [         | %5B         |
| ]         | %5D         |
| %         | %25         |

Example:
```bash
# If password is: myP@ss:w0rd
# URL encoded: myP%40ss%3Aw0rd
MONGO_URI=mongodb+srv://aureaAdmin:myP%40ss%3Aw0rd@aurea-backend.v0ccn50.mongodb.net/?retryWrites=true&w=majority&appName=aurea-backend
```

### Step 6: Alternative Connection Testing

Create a test file to verify connection:

```javascript
// test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection successful!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run: `node test-connection.js`

## 🚀 Once Connected Successfully

Your backend will be ready with these endpoints:

- **Health Check**: `GET http://localhost:5000/health`
- **User Signup**: `POST http://localhost:5000/api/auth/signup`
- **User Login**: `POST http://localhost:5000/api/auth/login`
- **Create Portfolio**: `POST http://localhost:5000/api/portfolios`

## 📱 Frontend Integration Ready

Once the backend is running, your React frontend can start making requests to these endpoints!
