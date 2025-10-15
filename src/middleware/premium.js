import User from '../models/User.js';

/**
 * Middleware to check if user has active premium subscription
 * Use this to protect premium-only routes/features
 */
export const requirePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPremium = user.checkPremiumStatus();

    if (!isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access this feature',
        requiresPremium: true
      });
    }

    // Add premium info to request for use in controllers
    req.premiumInfo = user.getPremiumInfo();
    next();
  } catch (error) {
    console.error('Premium check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying premium status',
      error: error.message
    });
  }
};

/**
 * Middleware to check premium status without blocking
 * Adds premium info to request but doesn't block non-premium users
 */
export const checkPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      req.isPremium = user.checkPremiumStatus();
      req.premiumInfo = user.getPremiumInfo();
    } else {
      req.isPremium = false;
      req.premiumInfo = null;
    }

    next();
  } catch (error) {
    console.error('Premium check middleware error:', error);
    req.isPremium = false;
    req.premiumInfo = null;
    next();
  }
};

export default {
  requirePremium,
  checkPremium
};
