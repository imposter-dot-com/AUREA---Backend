import express from 'express';
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUserProfile,
  patchUserProfile,
  uploadAvatar as uploadAvatarController,
  updateUser,
  deleteUserProfile,
  deleteUser,
  checkPremiumStatus,
  getUserPremiumStatus,
  setPremiumStatus,
  removePremiumStatus
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
import { uploadSingle, uploadAvatar, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// Rate limiters
const userCrudLimiter = createRateLimiter(30, 15); // 30 requests per 15 minutes
const avatarUploadLimiter = createRateLimiter(5, 60); // 5 requests per hour
const userDeleteLimiter = createRateLimiter(3, 60); // 3 requests per hour

// ============================================
// CURRENT USER ROUTES (Self-service)
// ============================================

router.get('/profile', auth, getCurrentUser);

router.put(
  '/profile',
  auth,
  userCrudLimiter,
  validateUserProfileUpdate,
  updateUserProfile
);

// Modern frontend endpoint - PATCH for profile updates
router.patch(
  '/profile',
  auth,
  userCrudLimiter,
  patchUserProfile
);

// Avatar upload endpoint
router.post(
  '/avatar',
  auth,
  avatarUploadLimiter,
  uploadAvatar,
  handleMulterError,
  uploadAvatarController
);

router.delete(
  '/profile',
  auth,
  userDeleteLimiter,
  validateUserDelete,
  deleteUserProfile
);

// ============================================
// PREMIUM STATUS ROUTES (Current User)
// ============================================

router.get('/premium/status', auth, checkPremiumStatus);

// ============================================
// ADMIN ROUTES (User Management)
// ============================================

router.get(
  '/',
  auth,
  validateUserQuery,
  getAllUsers
);

router.get(
  '/:id',
  auth,
  validateObjectId('id'),
  getUserById
);

router.put(
  '/:id',
  auth,
  userCrudLimiter,
  validateObjectId('id'),
  validateUserUpdate,
  updateUser
);

router.delete(
  '/:id',
  auth,
  userDeleteLimiter,
  validateObjectId('id'),
  deleteUser
);

// ============================================
// PREMIUM MANAGEMENT ROUTES (Admin)
// ============================================

router.get(
  '/:id/premium',
  auth,
  validateObjectId('id'),
  getUserPremiumStatus
);

router.put(
  '/:id/premium',
  auth,
  userCrudLimiter,
  validateObjectId('id'),
  setPremiumStatus
);

router.delete(
  '/:id/premium',
  auth,
  validateObjectId('id'),
  removePremiumStatus
);

export default router;
