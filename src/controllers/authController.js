/**
 * Auth Controller (Refactored)
 * Thin controller layer - handles HTTP requests/responses only
 * Business logic delegated to AuthService
 */

import authService from '../core/services/AuthService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
import { resetBruteForce } from '../middleware/bruteForcePrevention.js';

/**
 * @desc    Register user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);

    // Reset brute force counter on successful signup
    resetBruteForce(req);

    return responseFormatter.created(res, result, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // Reset brute force counter on successful login
    resetBruteForce(req);

    return responseFormatter.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return responseFormatter.success(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    return responseFormatter.success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    return responseFormatter.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    await authService.deleteAccount(req.user._id, password);
    return responseFormatter.success(res, null, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
