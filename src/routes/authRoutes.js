import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  loginBruteForceProtection,
  signupBruteForceProtection,
  passwordResetBruteForceProtection
} from '../middleware/bruteForcePrevention.js';
import {
  signup,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  sendVerificationOTP,
  verifyEmailOTP,
  resendVerificationOTP,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  sendLoginOTP,
  verifyLoginOTP,
  googleAuth,
  googleCallback,
  linkGoogleAccount
} from '../controllers/authController.js';

const router = express.Router();

// ========== BASIC AUTH ROUTES ==========

// POST /api/auth/signup - Register a new user
// Protected against brute force signup attempts
router.post('/signup', signupBruteForceProtection, signup);

// POST /api/auth/login - Authenticate user and get access token
// Protected against brute force login attempts
router.post('/login', loginBruteForceProtection, login);

// GET /api/auth/me - Get current authenticated user information
router.get('/me', auth, getCurrentUser);

// PUT /api/auth/me - Update current user profile
router.put('/me', auth, updateProfile);

// PUT /api/auth/password - Change password
router.put('/password', auth, changePassword);

// DELETE /api/auth/account - Delete account
router.delete('/account', auth, deleteAccount);

// ========== EMAIL OTP VERIFICATION ROUTES ==========

// POST /api/auth/send-verification-otp - Send email verification OTP
router.post('/send-verification-otp', sendVerificationOTP);

// POST /api/auth/verify-email-otp - Verify email with OTP
router.post('/verify-email-otp', verifyEmailOTP);

// POST /api/auth/resend-verification-otp - Resend verification OTP
router.post('/resend-verification-otp', resendVerificationOTP);

// ========== FORGOT PASSWORD ROUTES ==========

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetBruteForceProtection, forgotPassword);

// POST /api/auth/verify-reset-token - Verify reset token
router.post('/verify-reset-token', verifyResetToken);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', passwordResetBruteForceProtection, resetPassword);

// ========== OTP PASSWORDLESS LOGIN ROUTES ==========

// POST /api/auth/login/otp/send - Send login OTP
router.post('/login/otp/send', loginBruteForceProtection, sendLoginOTP);

// POST /api/auth/login/otp/verify - Verify login OTP
router.post('/login/otp/verify', loginBruteForceProtection, verifyLoginOTP);

// ========== GOOGLE OAUTH ROUTES ==========

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', googleAuth);

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', googleCallback);

// POST /api/auth/link-google - Link Google account to existing user
router.post('/link-google', auth, linkGoogleAccount);

export default router;
