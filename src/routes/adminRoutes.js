/**
 * Admin Routes
 * Handles admin dashboard, analytics, and system management
 * All routes require admin authentication
 */

import express from 'express';
import {
  getDashboardStats,
  getNonTestUsers,
  getAllPortfolios,
  getAllSites
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

// ============================================
// ADMIN PORTFOLIO ROUTES
// ============================================

/**
 * @route   GET /api/admin/portfolios
 * @desc    Get all portfolios (optionally filter by userId)
 * @query   page, limit, userId, sortBy, order, isPublished
 * @access  Private (Admin only)
 */
router.get(
  '/portfolios',
  auth,
  requireAdmin,
  adminLimiter,
  getAllPortfolios
);

/**
 * @route   GET /api/admin/sites
 * @desc    Get all published sites
 * @query   page, limit, sortBy, order, published, deploymentStatus
 * @access  Private (Admin only)
 */
router.get(
  '/sites',
  auth,
  requireAdmin,
  adminLimiter,
  getAllSites
);

export default router;
