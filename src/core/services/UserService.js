/**
 * User Service
 * Business logic for user profile management
 * Handles user CRUD operations, avatar uploads, and statistics
 */

import { UserRepository } from '../repositories/UserRepository.js';
import Portfolio from '../../models/Portfolio.js';
import CaseStudy from '../../models/CaseStudy.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/exceptions/index.js';

class UserService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Get all users with pagination and search
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users list with pagination
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, search = '' } = options;

    logger.service('UserService', 'getAllUsers', { page, limit, search });

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Import User model directly for complex queries
    const User = (await import('../../models/User.js')).default;

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    return {
      users,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
        limit: Number(limit)
      }
    };
  }

  /**
   * Get user by ID with statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User with stats
   */
  async getUserWithStats(userId) {
    logger.service('UserService', 'getUserWithStats', { userId });

    const user = await this.userRepository.findById(userId, { select: '-password' });

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Get user's statistics
    const portfolioCount = await Portfolio.countDocuments({ userId: user._id });
    const caseStudyCount = await CaseStudy.countDocuments({ userId: user._id });

    return {
      ...user.toObject(),
      stats: {
        portfolios: portfolioCount,
        caseStudies: caseStudyCount
      }
    };
  }

  /**
   * Get current authenticated user with detailed stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile with stats
   */
  async getCurrentUserProfile(userId) {
    logger.service('UserService', 'getCurrentUserProfile', { userId });

    const user = await this.userRepository.findById(userId, { select: '-password' });

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Get detailed statistics
    const portfolioCount = await Portfolio.countDocuments({ userId: user._id });
    const publishedPortfolios = await Portfolio.countDocuments({
      userId: user._id,
      isPublished: true
    });
    const caseStudyCount = await CaseStudy.countDocuments({ userId: user._id });

    return {
      id: user._id,
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      isPremium: user.checkPremiumStatus(),
      premiumType: user.premiumType,
      stats: {
        totalPortfolios: portfolioCount,
        publishedPortfolios: publishedPortfolios,
        draftPortfolios: portfolioCount - publishedPortfolios,
        caseStudies: caseStudyCount
      }
    };
  }

  /**
   * Update user profile (full update with optional password change)
   * @param {string} userId - User ID
   * @param {Object} updateData - Profile update data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    const { name, email, currentPassword, newPassword } = updateData;

    logger.service('UserService', 'updateProfile', { userId });

    // Import User model for password operations
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw ConflictError.emailTaken();
      }
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError('Current password is required to set new password');
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new ValidationError('Current password is incorrect');
      }

      user.password = newPassword;
    }

    await user.save();

    return user.toAuthJSON();
  }

  /**
   * Patch user profile (partial update with field validation)
   * @param {string} userId - User ID
   * @param {Object} updates - Partial update data
   * @returns {Promise<Object>} Updated user
   */
  async patchProfile(userId, updates) {
    const { firstName, lastName, username, email } = updates;

    logger.service('UserService', 'patchProfile', { userId });

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    const validationErrors = {};

    // Validate and update firstName
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length === 0) {
        validationErrors.firstName = 'First name is required';
      } else if (firstName.length > 50) {
        validationErrors.firstName = 'First name cannot be more than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        validationErrors.firstName = 'First name can only contain letters and spaces';
      } else {
        user.firstName = firstName.trim();
      }
    }

    // Validate and update lastName
    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length === 0) {
        validationErrors.lastName = 'Last name is required';
      } else if (lastName.length > 50) {
        validationErrors.lastName = 'Last name cannot be more than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        validationErrors.lastName = 'Last name can only contain letters and spaces';
      } else {
        user.lastName = lastName.trim();
      }
    }

    // Validate and update username
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        validationErrors.username = 'Username is required';
      } else if (username.length < 3) {
        validationErrors.username = 'Username must be at least 3 characters';
      } else if (username.length > 30) {
        validationErrors.username = 'Username cannot be more than 30 characters';
      } else if (!/^[a-z0-9_]+$/.test(username)) {
        validationErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
      } else if (username !== user.username) {
        // Check if username is already taken
        const existingUser = await this.userRepository.findByUsername(username.toLowerCase());
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          validationErrors.username = 'Username already in use';
        } else {
          user.username = username.toLowerCase();
        }
      }
    }

    // Validate and update email
    if (email !== undefined) {
      if (!email || email.trim().length === 0) {
        validationErrors.email = 'Email is required';
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        validationErrors.email = 'Please provide a valid email';
      } else if (email.toLowerCase() !== user.email) {
        // Check if email is already taken
        const existingUser = await this.userRepository.findByEmail(email.toLowerCase());
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          validationErrors.email = 'Email already in use';
        } else {
          user.email = email.toLowerCase();
        }
      }
    }

    // If there are validation errors, throw ValidationError
    if (Object.keys(validationErrors).length > 0) {
      throw new ValidationError('Validation failed', validationErrors);
    }

    // Update the full name if firstName or lastName changed
    if (user.firstName || user.lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
    }

    await user.save();

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
  }

  /**
   * Upload user avatar
   * @param {string} userId - User ID
   * @param {Buffer} fileBuffer - Image buffer
   * @returns {Promise<Object>} Avatar URLs
   */
  async uploadAvatar(userId, fileBuffer) {
    logger.service('UserService', 'uploadAvatar', { userId });

    if (!fileBuffer) {
      throw new ValidationError('No file uploaded');
    }

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Import Cloudinary functions
    const { uploadImage, deleteImage } = await import('../../config/cloudinary.js');

    // Delete old avatar if exists
    if (user.avatarPublicId) {
      try {
        await deleteImage(user.avatarPublicId);
      } catch (deleteError) {
        logger.warn('Failed to delete old avatar', { error: deleteError, userId });
        // Continue even if delete fails
      }
    }

    // Upload new avatar with transformations
    const uploadOptions = {
      folder: 'aurea/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      eager: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }
      ]
    };

    const result = await uploadImage(fileBuffer, uploadOptions);

    // Update user with new avatar
    user.avatar = result.url;
    user.avatarPublicId = result.public_id;
    await user.save();

    // Generate thumbnail URL
    const thumbnailUrl = result.url.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face/');

    return {
      avatar: result.url,
      thumbnailUrl: thumbnailUrl
    };
  }

  /**
   * Delete user profile with password verification
   * @param {string} userId - User ID
   * @param {string} password - User password for verification
   * @returns {Promise<void>}
   */
  async deleteProfile(userId, password) {
    logger.service('UserService', 'deleteProfile', { userId });

    if (!password) {
      throw new ValidationError('Password is required to delete account');
    }

    // Import User model for password comparison
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ValidationError('Incorrect password');
    }

    // Delete all user's portfolios and case studies
    await Portfolio.deleteMany({ userId: user._id });
    await CaseStudy.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    logger.info('User profile deleted', { userId });
  }

  /**
   * Admin: Update any user
   * @param {string} userId - User ID to update
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async adminUpdateUser(userId, updateData) {
    const { name, email } = updateData;

    logger.service('UserService', 'adminUpdateUser', { userId });

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw ConflictError.emailTaken();
      }
      user.email = email;
    }

    await user.save();

    return user.toAuthJSON();
  }

  /**
   * Admin: Delete any user
   * @param {string} userId - User ID to delete
   * @returns {Promise<void>}
   */
  async adminDeleteUser(userId) {
    logger.service('UserService', 'adminDeleteUser', { userId });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Delete all user's portfolios and case studies
    await Portfolio.deleteMany({ userId: user._id });
    await CaseStudy.deleteMany({ userId: user._id });

    // Delete user
    await this.userRepository.delete(user._id);

    logger.info('User deleted by admin', { userId });
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
