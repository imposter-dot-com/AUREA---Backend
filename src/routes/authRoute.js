import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  signup,
  login,
  getCurrentUser,
  updateCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   PUT /api/auth/me
// @desc    Update current user
// @access  Private
router.put('/me', auth, updateCurrentUser);

export default router;
