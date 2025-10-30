/**
 * Premium Service
 * Business logic for premium subscription management
 * Handles premium status checks, upgrades, and downgrades
 */

import { UserRepository } from '../repositories/UserRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError } from '../../shared/exceptions/index.js';

class PremiumService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Check premium status for current user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Premium information
   */
  async checkPremiumStatus(userId) {
    logger.service('PremiumService', 'checkPremiumStatus', { userId });

    // Import User model for premium methods
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    return user.getPremiumInfo();
  }

  /**
   * Get premium status for specific user (admin)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User premium information
   */
  async getUserPremiumStatus(userId) {
    logger.service('PremiumService', 'getUserPremiumStatus', { userId });

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    const premiumInfo = user.getPremiumInfo();

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      ...premiumInfo
    };
  }

  /**
   * Set premium status for user (admin/testing)
   * @param {string} userId - User ID
   * @param {string} premiumType - Premium type (monthly, yearly, lifetime)
   * @param {number} duration - Duration in days (optional)
   * @returns {Promise<Object>} Updated premium info
   */
  async setPremiumStatus(userId, premiumType, duration) {
    logger.service('PremiumService', 'setPremiumStatus', { userId, premiumType, duration });

    // Validate premium type
    if (!['monthly', 'yearly', 'lifetime'].includes(premiumType)) {
      throw new ValidationError('Invalid premium type. Must be: monthly, yearly, or lifetime');
    }

    // Import User model for static method
    const User = (await import('../../models/User.js')).default;

    // Use User model's static method to set premium
    const user = await User.setPremiumStatus(userId, premiumType, duration);

    return user.getPremiumInfo();
  }

  /**
   * Remove premium status for user (admin)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated premium info
   */
  async removePremiumStatus(userId) {
    logger.service('PremiumService', 'removePremiumStatus', { userId });

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Reset premium fields
    user.isPremium = false;
    user.premiumType = 'none';
    user.premiumStartDate = null;
    user.premiumEndDate = null;

    await user.save();

    logger.info('Premium status removed', { userId });

    return user.getPremiumInfo();
  }

  /**
   * Upgrade user to premium
   * @param {string} userId - User ID
   * @param {string} premiumType - Premium type
   * @param {Object} paymentInfo - Payment information
   * @returns {Promise<Object>} Updated premium info
   */
  async upgradeToPremium(userId, premiumType, paymentInfo = {}) {
    logger.service('PremiumService', 'upgradeToPremium', { userId, premiumType });

    // Validate premium type
    if (!['monthly', 'yearly', 'lifetime'].includes(premiumType)) {
      throw new ValidationError('Invalid premium type');
    }

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Check if already premium
    if (user.checkPremiumStatus()) {
      logger.warn('User already has premium', { userId, currentType: user.premiumType });
    }

    // Set premium status
    const now = new Date();
    user.isPremium = true;
    user.premiumType = premiumType;
    user.premiumStartDate = now;

    // Calculate end date based on type
    if (premiumType === 'monthly') {
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      user.premiumEndDate = endDate;
    } else if (premiumType === 'yearly') {
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
      user.premiumEndDate = endDate;
    } else if (premiumType === 'lifetime') {
      user.premiumEndDate = null; // Lifetime has no end date
    }

    await user.save();

    logger.info('User upgraded to premium', { userId, premiumType });

    return user.getPremiumInfo();
  }

  /**
   * Downgrade user from premium
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated premium info
   */
  async downgradeFromPremium(userId) {
    logger.service('PremiumService', 'downgradeFromPremium', { userId });

    // Import User model
    const User = (await import('../../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw NotFoundError.resource('User', userId);
    }

    // Reset premium status
    user.isPremium = false;
    user.premiumType = 'none';
    user.premiumStartDate = null;
    user.premiumEndDate = null;

    await user.save();

    logger.info('User downgraded from premium', { userId });

    return user.getPremiumInfo();
  }
}

// Export singleton instance
const premiumService = new PremiumService();
export default premiumService;
