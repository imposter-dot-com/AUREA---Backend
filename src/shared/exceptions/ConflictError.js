/**
 * Conflict Error
 * Thrown when there's a conflict with existing data
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApplicationError } from './ApplicationError.js';

export class ConflictError extends ApplicationError {
  /**
   * @param {string} message - Error message
   * @param {string} code - Specific error code (optional)
   * @param {Object} details - Additional details
   */
  constructor(
    message = 'Resource conflict',
    code = ERROR_CODES.CONFLICT,
    details = null
  ) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      code,
      details
    );
  }

  /**
   * Create for duplicate resource
   * @param {string} resource - Resource type
   * @param {string} field - Conflicting field
   * @returns {ConflictError}
   */
  static duplicate(resource, field) {
    return new ConflictError(
      `${resource} with this ${field} already exists`,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      { resource, field }
    );
  }

  /**
   * Create for slug already taken
   * @param {string} slug - The conflicting slug
   * @returns {ConflictError}
   */
  static slugTaken(slug) {
    return new ConflictError(
      'This slug is already taken',
      ERROR_CODES.SLUG_TAKEN,
      { slug }
    );
  }

  /**
   * Create for subdomain already taken
   * @param {string} subdomain - The conflicting subdomain
   * @returns {ConflictError}
   */
  static subdomainTaken(subdomain) {
    return new ConflictError(
      'This subdomain is already taken by another user',
      ERROR_CODES.SUBDOMAIN_TAKEN,
      { subdomain }
    );
  }
}

export default ConflictError;
