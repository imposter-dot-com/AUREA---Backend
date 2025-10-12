import express from 'express';
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUserProfile,
  updateUser,
  deleteUserProfile,
  deleteUser
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import {
  validateObjectId,
  validateUserProfileUpdate,
  validateUserUpdate,
  validateUserDelete,
  validateUserQuery
} from '../middleware/validation.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters
const userCrudLimiter = createRateLimiter(30, 15); // 30 requests per 15 minutes
const userDeleteLimiter = createRateLimiter(3, 60); // 3 requests per hour

// ============================================
// CURRENT USER ROUTES (Self-service)
// ============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile with statistics
 * @access  Private
 */
router.get('/profile', auth, getCurrentUser);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile (name, email, password)
 * @access  Private
 */
router.put(
  '/profile',
  auth,
  userCrudLimiter,
  validateUserProfileUpdate,
  updateUserProfile
);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user account (requires password confirmation)
 * @access  Private
 */
router.delete(
  '/profile',
  auth,
  userDeleteLimiter,
  validateUserDelete,
  deleteUserProfile
);

// ============================================
// ADMIN ROUTES (User Management)
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and search
 * @access  Private (Admin - can add role check later)
 */
router.get(
  '/',
  auth,
  validateUserQuery,
  getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID with statistics
 * @access  Private (Admin - can add role check later)
 */
router.get(
  '/:id',
  auth,
  validateObjectId('id'),
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID (admin functionality)
 * @access  Private (Admin - can add role check later)
 */
router.put(
  '/:id',
  auth,
  userCrudLimiter,
  validateObjectId('id'),
  validateUserUpdate,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID (admin functionality)
 * @access  Private (Admin - can add role check later)
 */
router.delete(
  '/:id',
  auth,
  userDeleteLimiter,
  validateObjectId('id'),
  deleteUser
);

export default router;
