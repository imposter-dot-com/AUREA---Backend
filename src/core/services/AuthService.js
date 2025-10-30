/**
 * Authentication Service
 * Business logic layer for authentication operations
 * Handles user registration, login, and token management
 */

import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import userRepository from '../repositories/UserRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError
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

    // Generate token
    const token = this.generateToken(user._id);

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email
    });

    return {
      user: user.toAuthJSON(),
      token
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
}

// Export singleton instance
export default new AuthService();
