/**
 * Enhanced Error Handler Middleware
 * Integrates with custom exception classes and provides consistent error responses
 */

import { sanitizeError, sanitizeRequest } from './logSanitizer.js';
import { ApplicationError } from '../shared/exceptions/ApplicationError.js';
import { HTTP_STATUS } from '../shared/constants/httpStatus.js';
import { ERROR_CODES } from '../shared/constants/errorCodes.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * Global error handling middleware
 * Handles both custom ApplicationError instances and unexpected errors
 */
const errorHandler = (err, req, res, next) => {
  // Sanitize error and request before logging
  const sanitizedError = sanitizeError(err);
  const sanitizedReq = sanitizeRequest(req);

  // Log error with context
  logger.error('Error occurred', {
    error: sanitizedError,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: sanitizedReq.userId
  });

  // Log stack in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    logger.debug('Error stack trace', { stack: sanitizedError.stack });
  }

  // Handle custom ApplicationError instances
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Resource not found',
      code: ERROR_CODES.NOT_FOUND
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    let message = 'Duplicate field value';
    let code = ERROR_CODES.CONFLICT;

    if (field === 'slug') {
      message = 'This slug is already taken';
      code = ERROR_CODES.SLUG_TAKEN;
    } else if (field === 'email') {
      message = 'Email already exists';
      code = ERROR_CODES.RESOURCE_ALREADY_EXISTS;
    } else if (field) {
      message = `${field} already exists`;
    }

    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message,
      code,
      details: { field }
    });
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    const message = details.length > 0 ? details[0].message : 'Validation error';

    // Check for slug validation specifically
    const slugError = details.find(d => d.field === 'slug' || d.message.toLowerCase().includes('slug'));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      code: slugError ? ERROR_CODES.INVALID_SLUG : ERROR_CODES.VALIDATION_ERROR,
      details
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      code: ERROR_CODES.TOKEN_INVALID
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token has expired',
      code: ERROR_CODES.TOKEN_EXPIRED
    });
  }

  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'File too large',
      code: ERROR_CODES.FILE_TOO_LARGE
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid file type',
      code: ERROR_CODES.INVALID_FILE_TYPE
    });
  }

  // Handle errors with statusCode already set (custom errors from old code)
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  // Default error response for unexpected errors
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'An unexpected error occurred';

  return res.status(statusCode).json({
    success: false,
    message,
    code: ERROR_CODES.SERVER_ERROR
  });
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });

  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: ERROR_CODES.NOT_FOUND
  });
};

export { errorHandler, notFound };
