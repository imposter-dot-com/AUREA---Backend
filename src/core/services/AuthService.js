/**
 * Authentication Service
 * Business logic layer for authentication operations
 * Handles user registration, login, and token management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import config from '../../config/index.js';
import userRepository from '../repositories/UserRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import emailService from '../../infrastructure/email/EmailService.js';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  ServiceError
} from '../../shared/exceptions/index.js';

export class AuthService {
  constructor(repository = userRepository) {
    this.repository = repository;
  }

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiration }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   * @throws {UnauthorizedError} If token is invalid or expired
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw UnauthorizedError.tokenExpired();
      }
      throw UnauthorizedError.tokenInvalid();
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token
   */
  async signup(userData) {
    logger.service('AuthService', 'signup', { email: userData.email });

    const { name, email, password } = userData;

    // Validation
    if (!name || !email || !password) {
      throw new ValidationError('Please provide name, email, and password');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(
        'User already exists with this email',
        'RESOURCE_ALREADY_EXISTS',
        { field: 'email' }
      );
    }

    // Create user
    const user = await this.repository.create({
      name,
      email: email.toLowerCase(),
      password
    });

    // Send verification OTP automatically (async - don't wait)
    // This prevents signup from timing out due to slow SMTP connections
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + config.email.otpExpiryMinutes * 60 * 1000);

    // Update OTP in database first (synchronous)
    await this.repository.updateOTP(email, otp, expiresAt);

    // Send email asynchronously (fire and forget)
    emailService.sendVerificationOTP(email, otp, user.name)
      .then(() => {
        logger.info('Verification OTP sent to new user', { email });
      })
      .catch((error) => {
        logger.error('Failed to send verification OTP during signup', { error: error.message });
      });

    // Generate token (but login will be blocked until email verified)
    const token = this.generateToken(user._id);

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email
    });

    return {
      user: user.toAuthJSON(),
      token,
      message: 'Account created successfully. Please check your email for verification code.'
    };
  }

  /**
   * Authenticate user and generate token
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User and token
   */
  async login(credentials) {
    logger.service('AuthService', 'login', { email: credentials.email });

    const { email, password } = credentials;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Please provide email and password');
    }

    // Find user with password field
    const user = await this.repository.findByEmail(email, true);

    if (!user) {
      throw UnauthorizedError.invalidCredentials();
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logger.warn('Failed login attempt', { email });
      throw UnauthorizedError.invalidCredentials();
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw ServiceError.emailNotVerified();
    }

    // Update last login
    await this.repository.updateLastLogin(user._id);

    // Generate token
    const token = this.generateToken(user._id);

    logger.auth('login', user._id, { email });

    return {
      user: user.toAuthJSON(),
      token
    };
  }

  /**
   * Get current authenticated user
   * @param {string} userId - User ID from token
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser(userId) {
    logger.service('AuthService', 'getCurrentUser', { userId });

    const user = await this.repository.findById(userId);

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    return user.toAuthJSON();
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    logger.service('AuthService', 'updateProfile', { userId });

    const { name, email, username } = updates;

    // Check if email is being changed and if it's already taken
    if (email) {
      const emailExists = await this.repository.emailExists(email, userId);
      if (emailExists) {
        throw new ConflictError(
          'Email already in use',
          'RESOURCE_ALREADY_EXISTS',
          { field: 'email' }
        );
      }
    }

    // Check if username is being changed and if it's already taken
    if (username) {
      const usernameExists = await this.repository.usernameExists(username, userId);
      if (usernameExists) {
        throw new ConflictError(
          'Username already taken',
          'RESOURCE_ALREADY_EXISTS',
          { field: 'username' }
        );
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (username !== undefined) updateData.username = username.toLowerCase();

    const user = await this.repository.update(userId, updateData);

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    logger.info('Profile updated', { userId });

    return user.toAuthJSON();
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    logger.service('AuthService', 'changePassword', { userId });

    // Validation
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Please provide current and new password');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    // Get user with password
    const user = await this.repository.findById(userId, { selectPassword: true });

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw UnauthorizedError.invalidCredentials();
    }

    // Update password
    await this.repository.updatePassword(userId, newPassword);

    logger.info('Password changed', { userId });
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @param {string} password - Password for confirmation
   * @returns {Promise<void>}
   */
  async deleteAccount(userId, password) {
    logger.service('AuthService', 'deleteAccount', { userId });

    // Get user with password
    const user = await this.repository.findById(userId, { selectPassword: true });

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw UnauthorizedError.invalidCredentials();
    }

    // Delete user
    await this.repository.delete(userId);

    logger.info('Account deleted', { userId });
  }

  // ========== EMAIL OTP VERIFICATION METHODS ==========

  /**
   * Generate a 6-digit OTP code
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    return speakeasy.totp({
      secret: config.security.otpSecret,
      encoding: 'base32',
      digits: 6
    });
  }

  /**
   * Send email verification OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async sendVerificationOTP(email) {
    logger.service('AuthService', 'sendVerificationOTP', { email });

    // Find user by email
    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new ValidationError('No account found with this email');
    }

    // Check if already verified
    if (user.emailVerified) {
      throw ServiceError.emailAlreadyVerified();
    }

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + config.email.otpExpiryMinutes * 60 * 1000);

    // Save OTP to database
    await this.repository.updateOTP(email, otp, expiresAt);

    // Send email asynchronously (fire and forget)
    emailService.sendVerificationOTP(email, otp, user.name)
      .then(() => {
        logger.info('Verification OTP sent', { email });
      })
      .catch((error) => {
        logger.error('Failed to send verification OTP', { error: error.message });
      });

    return {
      message: 'Verification code sent to your email',
      expiresIn: config.email.otpExpiryMinutes
    };
  }

  /**
   * Verify email OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Result
   */
  async verifyEmailOTP(email, otp) {
    logger.service('AuthService', 'verifyEmailOTP', { email });

    // Find user by email
    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new ValidationError('No account found with this email');
    }

    // Check if already verified
    if (user.emailVerified) {
      throw ServiceError.emailAlreadyVerified();
    }

    // Check OTP
    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      throw ServiceError.invalidOTP();
    }

    // Check expiration
    if (new Date() > user.emailVerificationOTPExpires) {
      await this.repository.clearOTP(user._id);
      throw ServiceError.otpExpired();
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      throw ServiceError.invalidOTP();
    }

    // Mark as verified and clear OTP
    await this.repository.markEmailVerified(user._id);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, user.name);
    } catch (error) {
      logger.error('Failed to send welcome email', { error: error.message });
      // Don't throw error - verification still succeeded
    }

    logger.info('Email verified successfully', { email });

    return {
      message: 'Email verified successfully',
      emailVerified: true
    };
  }

  /**
   * Resend verification OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async resendVerificationOTP(email) {
    return this.sendVerificationOTP(email);
  }

  // ========== FORGOT PASSWORD METHODS ==========

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async requestPasswordReset(email) {
    logger.service('AuthService', 'requestPasswordReset', { email });

    // Find user by email
    const user = await this.repository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists - security best practice
      logger.warn('Password reset requested for non-existent email', { email });
      return {
        message: 'If an account exists with this email, you will receive a password reset link'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + config.email.resetTokenExpiryHours * 60 * 60 * 1000);

    // Save token to database
    await this.repository.updateResetToken(user._id, hashedToken, expiresAt);

    // Send email asynchronously (fire and forget)
    emailService.sendPasswordReset(email, resetToken, user.name)
      .then(() => {
        logger.info('Password reset email sent', { email });
      })
      .catch((error) => {
        logger.error('Failed to send password reset email', { error: error.message });
      });

    return {
      message: 'If an account exists with this email, you will receive a password reset link',
      expiresIn: config.email.resetTokenExpiryHours
    };
  }

  /**
   * Verify reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Result
   */
  async verifyResetToken(token) {
    logger.service('AuthService', 'verifyResetToken');

    // Hash token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await this.repository.findByResetToken(hashedToken);

    if (!user) {
      throw ServiceError.invalidResetToken();
    }

    return {
      message: 'Reset token is valid',
      email: user.email
    };
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  async resetPassword(token, newPassword) {
    logger.service('AuthService', 'resetPassword');

    // Validation
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Hash token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await this.repository.findByResetToken(hashedToken);

    if (!user) {
      throw ServiceError.invalidResetToken();
    }

    // Update password
    await this.repository.updatePassword(user._id, newPassword);

    // Clear reset token
    await this.repository.clearResetToken(user._id);

    logger.info('Password reset successfully', { userId: user._id });

    return {
      message: 'Password reset successfully. You can now login with your new password.'
    };
  }

  // ========== OTP PASSWORDLESS LOGIN METHODS ==========

  /**
   * Send login OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async sendLoginOTP(email) {
    logger.service('AuthService', 'sendLoginOTP', { email });

    // Find user by email
    const user = await this.repository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists - security best practice
      logger.warn('Login OTP requested for non-existent email', { email });
      return {
        message: 'If an account exists with this email, you will receive a login code'
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw ServiceError.emailNotVerified();
    }

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + config.email.otpExpiryMinutes * 60 * 1000);

    // Save OTP to database (reusing email verification fields)
    await this.repository.updateOTP(email, otp, expiresAt);

    // Send email asynchronously (fire and forget)
    emailService.sendLoginOTP(email, otp, user.name)
      .then(() => {
        logger.info('Login OTP sent', { email });
      })
      .catch((error) => {
        logger.error('Failed to send login OTP', { error: error.message });
      });

    return {
      message: 'If an account exists with this email, you will receive a login code',
      expiresIn: config.email.otpExpiryMinutes
    };
  }

  /**
   * Verify login OTP and authenticate
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} User and token
   */
  async verifyLoginOTP(email, otp) {
    logger.service('AuthService', 'verifyLoginOTP', { email });

    // Find user by email
    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new ValidationError('Invalid email or verification code');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw ServiceError.emailNotVerified();
    }

    // Check OTP
    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      throw ServiceError.invalidOTP();
    }

    // Check expiration
    if (new Date() > user.emailVerificationOTPExpires) {
      await this.repository.clearOTP(user._id);
      throw ServiceError.otpExpired();
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      throw ServiceError.invalidOTP();
    }

    // Clear OTP
    await this.repository.clearOTP(user._id);

    // Update last login
    await this.repository.updateLastLogin(user._id);

    // Generate token
    const token = this.generateToken(user._id);

    logger.auth('otp-login', user._id, { email });

    return {
      user: user.toAuthJSON(),
      token
    };
  }

  // ========== GOOGLE OAUTH METHODS ==========

  /**
   * Find or create user from Google OAuth profile
   * @param {Object} profile - Google OAuth profile
   * @returns {Promise<Object>} User and token
   */
  async findOrCreateGoogleUser(profile) {
    logger.service('AuthService', 'findOrCreateGoogleUser', { googleId: profile.id });

    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const avatar = photos?.[0]?.value;

    if (!email) {
      throw new ValidationError('Google account must have an email address');
    }

    // Try to find by Google ID first
    let user = await this.repository.findByGoogleId(googleId);

    if (user) {
      // Update last login
      await this.repository.updateLastLogin(user._id);

      const token = this.generateToken(user._id);

      logger.auth('google-login', user._id, { email });

      return {
        user: user.toAuthJSON(),
        token
      };
    }

    // Try to find by email (existing account)
    user = await this.repository.findByEmail(email);

    if (user) {
      // Link Google account to existing user
      await this.repository.linkGoogleAccount(user._id, googleId);

      // Update last login
      await this.repository.updateLastLogin(user._id);

      const token = this.generateToken(user._id);

      logger.info('Google account linked to existing user', { userId: user._id, email });

      return {
        user: user.toAuthJSON(),
        token
      };
    }

    // Create new user
    user = await this.repository.create({
      name: displayName || 'Google User',
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'), // Random password (won't be used)
      googleId,
      authProvider: 'google',
      emailVerified: true, // Google emails are verified
      avatar
    });

    const token = this.generateToken(user._id);

    logger.info('New user created via Google OAuth', { userId: user._id, email });

    return {
      user: user.toAuthJSON(),
      token
    };
  }

  /**
   * Link Google account to existing user
   * @param {string} userId - User ID
   * @param {string} googleId - Google ID
   * @returns {Promise<Object>} Updated user
   */
  async linkGoogleAccount(userId, googleId) {
    logger.service('AuthService', 'linkGoogleAccount', { userId });

    // Check if Google ID is already linked to another account
    const existingUser = await this.repository.findByGoogleId(googleId);

    if (existingUser && existingUser._id.toString() !== userId) {
      throw new ConflictError(
        'This Google account is already linked to another user',
        'GOOGLE_ACCOUNT_ALREADY_LINKED'
      );
    }

    // Link account
    const user = await this.repository.linkGoogleAccount(userId, googleId);

    if (!user) {
      throw UnauthorizedError.tokenInvalid();
    }

    logger.info('Google account linked', { userId });

    return user.toAuthJSON();
  }
}

// Export singleton instance
export default new AuthService();
