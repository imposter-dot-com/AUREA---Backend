import userService from '../core/services/UserService.js';
import premiumService from '../core/services/PremiumService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * User Controller - Thin HTTP layer
 * Handles HTTP requests/responses for user management
 * All business logic delegated to UserService and PremiumService
 */

/**
 * @desc    Get all users (Admin functionality)
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);

    return responseFormatter.paginated(
      res,
      result.users,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserWithStats(req.params.id);

    return responseFormatter.success(
      res,
      user,
      'User retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userProfile = await userService.getCurrentUserProfile(req.user._id);

    return responseFormatter.success(
      res,
      userProfile,
      'User profile retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateProfile(req.user._id, req.body);

    return responseFormatter.success(
      res,
      updatedUser,
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (PATCH - Modern Frontend)
 * @route   PATCH /api/users/profile
 * @access  Private
 */
export const patchUserProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.patchProfile(req.user._id, req.body);

    return responseFormatter.success(
      res,
      updatedUser,
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload user avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return responseFormatter.validationError(res, 'No file uploaded');
    }

    const avatarData = await userService.uploadAvatar(req.user._id, req.file.buffer);

    return responseFormatter.success(
      res,
      avatarData,
      'Avatar uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user by ID (Admin functionality)
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.adminUpdateUser(req.params.id, req.body);

    return responseFormatter.success(
      res,
      updatedUser,
      'User updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
export const deleteUserProfile = async (req, res, next) => {
  try {
    await userService.deleteProfile(req.user._id, req.body.password);

    return responseFormatter.success(
      res,
      null,
      'Account deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user by ID (Admin functionality)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    await userService.adminDeleteUser(req.params.id);

    return responseFormatter.success(
      res,
      null,
      'User deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

// ============================================
// PREMIUM STATUS ENDPOINTS
// ============================================

/**
 * @desc    Check if current user is premium
 * @route   GET /api/users/premium/status
 * @access  Private
 */
export const checkPremiumStatus = async (req, res, next) => {
  try {
    const premiumInfo = await premiumService.checkPremiumStatus(req.user._id);

    return responseFormatter.success(
      res,
      premiumInfo,
      'Premium status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get premium status for a specific user (Admin)
 * @route   GET /api/users/:id/premium
 * @access  Private (Admin)
 */
export const getUserPremiumStatus = async (req, res, next) => {
  try {
    const premiumInfo = await premiumService.getUserPremiumStatus(req.params.id);

    return responseFormatter.success(
      res,
      premiumInfo,
      'Premium status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set premium status for a user (Admin/Testing)
 * @route   PUT /api/users/:id/premium
 * @access  Private (Admin)
 */
export const setPremiumStatus = async (req, res, next) => {
  try {
    const { premiumType, duration } = req.body;

    const premiumInfo = await premiumService.setPremiumStatus(
      req.params.id,
      premiumType,
      duration
    );

    return responseFormatter.success(
      res,
      premiumInfo,
      'Premium status updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove premium status for a user (Admin)
 * @route   DELETE /api/users/:id/premium
 * @access  Private (Admin)
 */
export const removePremiumStatus = async (req, res, next) => {
  try {
    const premiumInfo = await premiumService.removePremiumStatus(req.params.id);

    return responseFormatter.success(
      res,
      premiumInfo,
      'Premium status removed successfully'
    );
  } catch (error) {
    next(error);
  }
};
