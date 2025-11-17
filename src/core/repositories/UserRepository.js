/**
 * User Repository
 * Data access layer for User model
 * Handles all database operations for users
 */

import User from '../../models/User.js';
import logger from '../../infrastructure/logging/Logger.js';

export class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>}
   */
  async create(userData) {
    logger.database('create', 'users', { email: userData.email });
    return await User.create(userData);
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @param {Object} options - Query options
   * @returns {Promise<User|null>}
   */
  async findById(id, options = {}) {
    logger.database('findById', 'users', { id });

    let query = User.findById(id);

    if (options.selectPassword) {
      query = query.select('+password');
    }

    if (options.select) {
      query = query.select(options.select);
    }

    return await query.exec();
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Include password field
   * @returns {Promise<User|null>}
   */
  async findByEmail(email, includePassword = false) {
    logger.database('findByEmail', 'users', { email });

    let query = User.findOne({ email: email.toLowerCase() });

    if (includePassword) {
      query = query.select('+password');
    }

    return await query.exec();
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    logger.database('findByUsername', 'users', { username });
    return await User.findOne({ username: username.toLowerCase() });
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User|null>}
   */
  async update(id, updateData) {
    logger.database('update', 'users', { id });

    return await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>}
   */
  async delete(id) {
    logger.database('delete', 'users', { id });
    return await User.findByIdAndDelete(id);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async emailExists(email, excludeId = null) {
    const query = { email: email.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await User.countDocuments(query);
    return count > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {string} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async usernameExists(username, excludeId = null) {
    const query = { username: username.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await User.countDocuments(query);
    return count > 0;
  }

  /**
   * Find users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<User[]>}
   */
  async findAll(options = {}) {
    logger.database('findAll', 'users');

    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      filter = {}
    } = options;

    const skip = (page - 1) * limit;

    return await User.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .select('-password')
      .exec();
  }

  /**
   * Count total users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    return await User.countDocuments(filter);
  }

  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} newPassword - New password (will be hashed by model)
   * @returns {Promise<User|null>}
   */
  async updatePassword(id, newPassword) {
    logger.database('updatePassword', 'users', { id });

    const user = await User.findById(id);
    if (!user) return null;

    user.password = newPassword;
    await user.save(); // Triggers password hashing middleware

    return user;
  }

  /**
   * Update user avatar
   * @param {string} id - User ID
   * @param {string} avatarUrl - Avatar URL
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<User|null>}
   */
  async updateAvatar(id, avatarUrl, publicId) {
    logger.database('updateAvatar', 'users', { id });

    return await User.findByIdAndUpdate(
      id,
      {
        avatar: avatarUrl,
        avatarPublicId: publicId
      },
      { new: true }
    );
  }

  /**
   * Update premium status
   * @param {string} id - User ID
   * @param {Object} premiumData - Premium subscription data
   * @returns {Promise<User|null>}
   */
  async updatePremium(id, premiumData) {
    logger.database('updatePremium', 'users', { id });

    return await User.findByIdAndUpdate(
      id,
      premiumData,
      { new: true }
    );
  }

  /**
   * Get user statistics
   * @param {string} id - User ID
   * @returns {Promise<Object>}
   */
  async getStats(id) {
    logger.database('getStats', 'users', { id });

    const user = await User.findById(id);
    if (!user) return null;

    // Could aggregate stats from related collections here
    return {
      isPremium: user.isPremium,
      premiumType: user.premiumType,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      lastLogin: user.lastLoginAt
    };
  }

  /**
   * Find user by Google ID
   * @param {string} googleId - Google ID
   * @returns {Promise<User|null>}
   */
  async findByGoogleId(googleId) {
    logger.database('findByGoogleId', 'users', { googleId });
    return await User.findOne({ googleId });
  }

  /**
   * Find user by reset token
   * @param {string} token - Reset password token
   * @returns {Promise<User|null>}
   */
  async findByResetToken(token) {
    logger.database('findByResetToken', 'users');
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  }

  /**
   * Update OTP for email verification
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {Date} expires - Expiration date
   * @returns {Promise<User|null>}
   */
  async updateOTP(email, otp, expires) {
    logger.database('updateOTP', 'users', { email });

    return await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: expires
      },
      { new: true }
    );
  }

  /**
   * Clear OTP fields
   * @param {string} userId - User ID
   * @returns {Promise<User|null>}
   */
  async clearOTP(userId) {
    logger.database('clearOTP', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      {
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null
      },
      { new: true }
    );
  }

  /**
   * Update reset password token
   * @param {string} userId - User ID
   * @param {string} token - Reset token
   * @param {Date} expires - Expiration date
   * @returns {Promise<User|null>}
   */
  async updateResetToken(userId, token, expires) {
    logger.database('updateResetToken', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      },
      { new: true }
    );
  }

  /**
   * Clear reset password token
   * @param {string} userId - User ID
   * @returns {Promise<User|null>}
   */
  async clearResetToken(userId) {
    logger.database('clearResetToken', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      {
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      { new: true }
    );
  }

  /**
   * Update last login time
   * @param {string} userId - User ID
   * @returns {Promise<User|null>}
   */
  async updateLastLogin(userId) {
    logger.database('updateLastLogin', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark email as verified
   * @param {string} userId - User ID
   * @returns {Promise<User|null>}
   */
  async markEmailVerified(userId) {
    logger.database('markEmailVerified', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      {
        emailVerified: true,
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null
      },
      { new: true }
    );
  }

  /**
   * Link Google account to existing user
   * @param {string} userId - User ID
   * @param {string} googleId - Google ID
   * @returns {Promise<User|null>}
   */
  async linkGoogleAccount(userId, googleId) {
    logger.database('linkGoogleAccount', 'users', { userId });

    return await User.findByIdAndUpdate(
      userId,
      {
        googleId,
        authProvider: 'google'
      },
      { new: true }
    );
  }
}

// Export singleton instance
export default new UserRepository();
