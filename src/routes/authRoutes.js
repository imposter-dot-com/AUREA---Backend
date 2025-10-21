import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  loginBruteForceProtection,
  signupBruteForceProtection
} from '../middleware/bruteForcePrevention.js';
import {
  signup,
  login,
  getCurrentUser,
  updateCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup - Register a new user
// Protected against brute force signup attempts
router.post('/signup', signupBruteForceProtection, signup);

// POST /api/auth/login - Authenticate user and get access token
// Protected against brute force login attempts
router.post('/login', loginBruteForceProtection, login);

// GET /api/auth/me - Get current authenticated user information
router.get('/me', auth, getCurrentUser);

// PUT /api/auth/me - Update current user profile
router.put('/me', auth, updateCurrentUser);

export default router;
