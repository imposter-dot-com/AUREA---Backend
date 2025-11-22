/**
 * Admin Authorization Middleware
 * Protects admin-only routes by verifying user role
 * Must be used after auth middleware
 */

import logger from '../infrastructure/logging/Logger.js';

/**
 * Middleware to check if user has admin role
 * Use this to protect admin-only routes
 * MUST be used after auth middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user exists (from auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      logger.warn('Admin access denied', {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }

    logger.debug('Admin access granted', {
      adminId: req.user._id,
      email: req.user.email,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Admin middleware error', {
      error: error.message,
      userId: req.user?._id
    });

    res.status(500).json({
      success: false,
      message: 'Error verifying admin status',
      code: 'SERVER_ERROR'
    });
  }
};

export default requireAdmin;
