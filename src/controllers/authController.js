/**
 * Auth Controller (Refactored)
 * Thin controller layer - handles HTTP requests/responses only
 * Business logic delegated to AuthService
 */

import passport from 'passport';
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

// ========== EMAIL OTP VERIFICATION CONTROLLERS ==========

/**
 * @desc    Send email verification OTP
 * @route   POST /api/auth/send-verification-otp
 * @access  Public
 */
export const sendVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.sendVerificationOTP(email);
    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email-otp
 * @access  Public
 */
export const verifyEmailOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmailOTP(email, otp);
    return responseFormatter.success(res, result, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend email verification OTP
 * @route   POST /api/auth/resend-verification-otp
 * @access  Public
 */
export const resendVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationOTP(email);
    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

// ========== FORGOT PASSWORD CONTROLLERS ==========

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    // Reset brute force counter
    resetBruteForce(req);

    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify reset token
 * @route   POST /api/auth/verify-reset-token
 * @access  Public
 */
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyResetToken(token);
    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);

    // Reset brute force counter
    resetBruteForce(req);

    return responseFormatter.success(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

// ========== OTP PASSWORDLESS LOGIN CONTROLLERS ==========

/**
 * @desc    Send login OTP
 * @route   POST /api/auth/login/otp/send
 * @access  Public
 */
export const sendLoginOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.sendLoginOTP(email);
    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify login OTP
 * @route   POST /api/auth/login/otp/verify
 * @access  Public
 */
export const verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyLoginOTP(email, otp);

    // Reset brute force counter on successful login
    resetBruteForce(req);

    return responseFormatter.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ========== GOOGLE OAUTH CONTROLLERS ==========

/**
 * @desc    Initiate Google OAuth
 * @route   GET /api/auth/google
 * @access  Public
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, result) => {
    if (err) {
      return next(err);
    }

    if (!result) {
      return responseFormatter.unauthorized(res, 'Google authentication failed');
    }

    // Redirect to frontend with token
    const { token } = result;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?token=${token}`;

    res.redirect(redirectUrl);
  })(req, res, next);
};

/**
 * @desc    Link Google account to existing user
 * @route   POST /api/auth/link-google
 * @access  Private
 */
export const linkGoogleAccount = async (req, res, next) => {
  try {
    const { googleId } = req.body;
    const user = await authService.linkGoogleAccount(req.user._id, googleId);
    return responseFormatter.success(res, { user }, 'Google account linked successfully');
  } catch (error) {
    next(error);
  }
};
