/**
 * Forbidden Error
 * Thrown when user doesn't have permission to access a resource
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApplicationError } from './ApplicationError.js';

export class ForbiddenError extends ApplicationError {
  /**
   * @param {string} message - Error message
   * @param {string} code - Specific error code (optional)
   */
  constructor(message = 'Access forbidden', code = ERROR_CODES.FORBIDDEN) {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      code
    );
  }

  /**
   * Create for insufficient permissions
   * @returns {ForbiddenError}
   */
  static insufficientPermissions() {
    return new ForbiddenError(
      'You do not have permission to perform this action',
      ERROR_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  /**
   * Create for ownership requirement
   * @param {string} resource - Resource type
   * @returns {ForbiddenError}
   */
  static ownershipRequired(resource = 'resource') {
    return new ForbiddenError(
      `You do not own this ${resource}`,
      ERROR_CODES.OWNERSHIP_REQUIRED
    );
  }

  /**
   * Create for premium requirement
   * @returns {ForbiddenError}
   */
  static premiumRequired() {
    return new ForbiddenError(
      'This feature requires a premium subscription',
      ERROR_CODES.PREMIUM_REQUIRED
    );
  }
}

export default ForbiddenError;
