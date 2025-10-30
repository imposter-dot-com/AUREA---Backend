/**
 * Response Formatter Utility
 * Provides consistent response formatting across all API endpoints
 * Single source of truth for API responses
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Created response formatter (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * No content response formatter (204)
 * @param {Object} res - Express response object
 * @returns {Object} Express response
 */
export const sendNoContent = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code for client handling
 * @param {*} details - Additional error details (optional)
 * @returns {Object} Express response
 */
export const sendError = (
  res,
  message = 'An error occurred',
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code = 'SERVER_ERROR',
  details = null
) => {
  const response = {
    success: false,
    message,
    code,
    ...(details && { details })
  };

  return res.status(statusCode).json(response);
};

/**
 * Validation error response formatter (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} details - Validation error details
 * @returns {Object} Express response
 */
export const sendValidationError = (res, message = 'Validation error', details = null) => {
  return sendError(
    res,
    message,
    HTTP_STATUS.BAD_REQUEST,
    'VALIDATION_ERROR',
    details
  );
};

/**
 * Not found response formatter (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(
    res,
    message,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND'
  );
};

/**
 * Unauthorized response formatter (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(
    res,
    message,
    HTTP_STATUS.UNAUTHORIZED,
    'UNAUTHORIZED'
  );
};

/**
 * Forbidden response formatter (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(
    res,
    message,
    HTTP_STATUS.FORBIDDEN,
    'FORBIDDEN'
  );
};

/**
 * Conflict response formatter (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
export const sendConflict = (res, message = 'Resource conflict') => {
  return sendError(
    res,
    message,
    HTTP_STATUS.CONFLICT,
    'CONFLICT'
  );
};

/**
 * Rate limit exceeded response formatter (429)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} retryAfter - Retry information
 * @returns {Object} Express response
 */
export const sendRateLimitExceeded = (res, message = 'Too many requests', retryAfter = null) => {
  const response = {
    success: false,
    message,
    code: 'RATE_LIMIT_EXCEEDED',
    ...(retryAfter && { retryAfter })
  };

  return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(response);
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Paginated data
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
export const sendPaginated = (
  res,
  data,
  pagination,
  message = 'Data retrieved successfully'
) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit)
    }
  };

  return res.status(HTTP_STATUS.OK).json(response);
};

/**
 * Response formatter class for dependency injection
 */
export class ResponseFormatter {
  success(res, data, message, statusCode) {
    return sendSuccess(res, data, message, statusCode);
  }

  created(res, data, message) {
    return sendCreated(res, data, message);
  }

  noContent(res) {
    return sendNoContent(res);
  }

  error(res, message, statusCode, code, details) {
    return sendError(res, message, statusCode, code, details);
  }

  validationError(res, message, details) {
    return sendValidationError(res, message, details);
  }

  notFound(res, message) {
    return sendNotFound(res, message);
  }

  unauthorized(res, message) {
    return sendUnauthorized(res, message);
  }

  forbidden(res, message) {
    return sendForbidden(res, message);
  }

  conflict(res, message) {
    return sendConflict(res, message);
  }

  rateLimitExceeded(res, message, retryAfter) {
    return sendRateLimitExceeded(res, message, retryAfter);
  }

  paginated(res, data, pagination, message) {
    return sendPaginated(res, data, pagination, message);
  }
}

// Export default instance for convenience
export default new ResponseFormatter();
