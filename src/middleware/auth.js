import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import logger from '../infrastructure/logging/Logger.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token is not valid - user not found',
          code: 'UNAUTHORIZED'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid',
        code: 'UNAUTHORIZED'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Server error in authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token invalid, but we continue without user
        logger.debug('Invalid token in optional auth', { error: jwtError.message });
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: error.message, stack: error.stack });
    next(); // Continue even if there's an error
  }
};

export { auth, optionalAuth };
