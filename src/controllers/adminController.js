/**
 * Admin Controller - Thin HTTP layer
 * Handles HTTP requests/responses for admin operations
 * All business logic delegated to AdminService
 */

import adminService from '../core/services/AdminService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * @desc    Get dashboard statistics (excludes test users)
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin only)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    logger.info('AdminController.getDashboardStats', {
      adminId: req.user?._id
    });

    const stats = await adminService.getDashboardStats();

    return responseFormatter.success(
      res,
      stats,
      'Dashboard statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all portfolios (optionally filter by user)
 * @route   GET /api/admin/portfolios
 * @access  Private (Admin only)
 */
export const getAllPortfolios = async (req, res, next) => {
  try {
    logger.info('AdminController.getAllPortfolios', {
      adminId: req.user?._id,
      query: req.query
    });

    const result = await adminService.getAllPortfolios(req.query);

    return responseFormatter.paginated(
      res,
      result.portfolios,
      result.pagination,
      'Portfolios retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get non-test users list
 * @route   GET /api/admin/users/non-test
 * @access  Private (Admin only)
 */
export const getNonTestUsers = async (req, res, next) => {
  try {
    logger.info('AdminController.getNonTestUsers', {
      adminId: req.user?._id,
      query: req.query
    });

    const result = await adminService.getNonTestUsers(req.query);

    return responseFormatter.paginated(
      res,
      result.users,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all published sites
 * @route   GET /api/admin/sites
 * @access  Private (Admin only)
 */
export const getAllSites = async (req, res, next) => {
  try {
    logger.info('AdminController.getAllSites', {
      adminId: req.user?._id,
      query: req.query
    });

    const result = await adminService.getAllSites(req.query);

    return responseFormatter.paginated(
      res,
      result.sites,
      result.pagination,
      'Sites retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
