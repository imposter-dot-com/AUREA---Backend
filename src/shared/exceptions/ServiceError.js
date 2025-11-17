/**
 * Service Error Class
 * For service-level errors (email, external APIs, etc.)
 */

import { ApplicationError } from './ApplicationError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class ServiceError extends ApplicationError {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.SERVER_ERROR, details = null) {
    super(message, statusCode, code, details);
  }

  /**
   * Email service not configured
   */
  static emailNotConfigured() {
    return new ServiceError(
      'Email service is not configured. Please contact support.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'EMAIL_NOT_CONFIGURED'
    );
  }

  /**
   * Failed to send email
   */
  static emailSendFailed(reason = '') {
    return new ServiceError(
      `Failed to send email${reason ? `: ${reason}` : ''}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'EMAIL_SEND_FAILED'
    );
  }

  /**
   * Invalid or expired OTP
   */
  static invalidOTP() {
    return new ServiceError(
      'Invalid or expired verification code',
      HTTP_STATUS.BAD_REQUEST,
      'INVALID_OTP'
    );
  }

  /**
   * OTP expired
   */
  static otpExpired() {
    return new ServiceError(
      'Verification code has expired. Please request a new one.',
      HTTP_STATUS.BAD_REQUEST,
      'OTP_EXPIRED'
    );
  }

  /**
   * Invalid or expired reset token
   */
  static invalidResetToken() {
    return new ServiceError(
      'Invalid or expired password reset token',
      HTTP_STATUS.BAD_REQUEST,
      'INVALID_RESET_TOKEN'
    );
  }

  /**
   * Reset token expired
   */
  static resetTokenExpired() {
    return new ServiceError(
      'Password reset link has expired. Please request a new one.',
      HTTP_STATUS.BAD_REQUEST,
      'RESET_TOKEN_EXPIRED'
    );
  }

  /**
   * Too many OTP requests
   */
  static tooManyOTPRequests() {
    return new ServiceError(
      'Too many OTP requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'TOO_MANY_OTP_REQUESTS'
    );
  }

  /**
   * Email already verified
   */
  static emailAlreadyVerified() {
    return new ServiceError(
      'Email is already verified',
      HTTP_STATUS.BAD_REQUEST,
      'EMAIL_ALREADY_VERIFIED'
    );
  }

  /**
   * Email not verified
   */
  static emailNotVerified() {
    return new ServiceError(
      'Please verify your email before logging in',
      HTTP_STATUS.FORBIDDEN,
      'EMAIL_NOT_VERIFIED'
    );
  }

  /**
   * External service error (Google OAuth, etc.)
   */
  static externalServiceError(service, reason = '') {
    return new ServiceError(
      `External service error (${service})${reason ? `: ${reason}` : ''}`,
      HTTP_STATUS.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      { service, reason }
    );
  }
}

export default ServiceError;
