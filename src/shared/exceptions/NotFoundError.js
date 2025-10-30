/**
 * Not Found Error
 * Thrown when a requested resource is not found
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApplicationError } from './ApplicationError.js';

export class NotFoundError extends ApplicationError {
  /**
   * @param {string} message - Error message
   * @param {string} resource - Resource type that was not found
   * @param {string} identifier - Resource identifier (optional)
   */
  constructor(message = 'Resource not found', resource = null, identifier = null) {
    const details = resource ? { resource, ...(identifier && { identifier }) } : null;

    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      details
    );
  }

  /**
   * Create a not found error for a specific resource type
   * @param {string} resourceType - Type of resource (e.g., 'Portfolio', 'User')
   * @param {string} id - Resource ID
   * @returns {NotFoundError}
   */
  static resource(resourceType, id) {
    return new NotFoundError(
      `${resourceType} not found`,
      resourceType,
      id
    );
  }
}

export default NotFoundError;
