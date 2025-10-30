/**
 * Validation Error
 * Thrown when request data fails validation
 */

import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApplicationError } from './ApplicationError.js';

export class ValidationError extends ApplicationError {
  /**
   * @param {string} message - Error message
   * @param {Array|Object} details - Validation error details
   */
  constructor(message = 'Validation error', details = null) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }

  /**
   * Create from express-validator errors
   * @param {Array} errors - Express-validator error array
   * @returns {ValidationError}
   */
  static fromExpressValidator(errors) {
    const details = errors.map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    const message = details.length > 0
      ? details[0].message
      : 'Validation error';

    return new ValidationError(message, details);
  }

  /**
   * Create from Mongoose validation error
   * @param {Object} error - Mongoose validation error
   * @returns {ValidationError}
   */
  static fromMongoose(error) {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    const message = details.length > 0
      ? details[0].message
      : 'Validation error';

    return new ValidationError(message, details);
  }
}

export default ValidationError;
