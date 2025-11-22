/**
 * Admin Routes
 * Handles admin dashboard, analytics, and system management
 * All routes require admin authentication
 */

import express from 'express';
import {
  getDashboardStats,
  getNonTestUsers
} from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters
const adminLimiter = createRateLimiter(60, 15); // 60 requests per 15 minutes

// ============================================
// ADMIN DASHBOARD ROUTES
// ============================================

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics (excludes test users)
 * @access  Private (Admin only)
 */
router.get(
  '/dashboard/stats',
  auth,
  requireAdmin,
  adminLimiter,
  getDashboardStats
);

/**
 * @route   GET /api/admin/users/non-test
 * @desc    Get list of non-test users with pagination
 * @access  Private (Admin only)
 */
router.get(
  '/users/non-test',
  auth,
  requireAdmin,
  adminLimiter,
  getNonTestUsers
);

export default router;
