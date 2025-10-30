/**
 * Unauthorized Error
 * Thrown when authentication fails or is required
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApplicationError } from './ApplicationError.js';

export class UnauthorizedError extends ApplicationError {
  /**
   * @param {string} message - Error message
   * @param {string} code - Specific error code (optional)
   */
  constructor(message = 'Unauthorized access', code = ERROR_CODES.UNAUTHORIZED) {
    super(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      code
    );
  }

  /**
   * Create for invalid credentials
   * @returns {UnauthorizedError}
   */
  static invalidCredentials() {
    return new UnauthorizedError(
      'Invalid credentials',
      ERROR_CODES.INVALID_CREDENTIALS
    );
  }

  /**
   * Create for expired token
   * @returns {UnauthorizedError}
   */
  static tokenExpired() {
    return new UnauthorizedError(
      'Token has expired',
      ERROR_CODES.TOKEN_EXPIRED
    );
  }

  /**
   * Create for invalid token
   * @returns {UnauthorizedError}
   */
  static tokenInvalid() {
    return new UnauthorizedError(
      'Invalid token',
      ERROR_CODES.TOKEN_INVALID
    );
  }

  /**
   * Create for missing token
   * @returns {UnauthorizedError}
   */
  static tokenMissing() {
    return new UnauthorizedError(
      'No token provided',
      ERROR_CODES.UNAUTHORIZED
    );
  }
}

export default UnauthorizedError;
