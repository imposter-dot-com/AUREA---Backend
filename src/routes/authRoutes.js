import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  signup,
  login,
  getCurrentUser,
  updateCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup - Register a new user
router.post('/signup', signup);

// POST /api/auth/login - Authenticate user and get access token
router.post('/login', login);

// GET /api/auth/me - Get current authenticated user information
router.get('/me', auth, getCurrentUser);

// PUT /api/auth/me - Update current user profile
router.put('/me', auth, updateCurrentUser);

export default router;
