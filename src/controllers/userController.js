import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import CaseStudy from '../models/CaseStudy.js';
import bcrypt from 'bcrypt';

/**
 * @desc    Get all users (Admin functionality)
 * @route   GET /api/users
 * @access  Private (Admin only - can be added later)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's portfolio count
    const portfolioCount = await Portfolio.countDocuments({ userId: user._id });
    const caseStudyCount = await CaseStudy.countDocuments({ userId: user._id });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          portfolios: portfolioCount,
          caseStudies: caseStudyCount
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's statistics
    const portfolioCount = await Portfolio.countDocuments({ userId: user._id });
    const publishedPortfolios = await Portfolio.countDocuments({ 
      userId: user._id, 
      isPublished: true 
    });
    const caseStudyCount = await CaseStudy.countDocuments({ userId: user._id });

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password'
        });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toAuthJSON()
    });
  } catch (error) {
    console.error('Update user profile error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile (PATCH - Modern Frontend)
 * @route   PATCH /api/users/profile
 * @access  Private
 */
export const patchUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const details = {};

    // Update firstName if provided
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length === 0) {
        details.firstName = 'First name is required';
      } else if (firstName.length > 50) {
        details.firstName = 'First name cannot be more than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        details.firstName = 'First name can only contain letters and spaces';
      } else {
        user.firstName = firstName.trim();
      }
    }

    // Update lastName if provided
    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length === 0) {
        details.lastName = 'Last name is required';
      } else if (lastName.length > 50) {
        details.lastName = 'Last name cannot be more than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        details.lastName = 'Last name can only contain letters and spaces';
      } else {
        user.lastName = lastName.trim();
      }
    }

    // Update username if provided
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        details.username = 'Username is required';
      } else if (username.length < 3) {
        details.username = 'Username must be at least 3 characters';
      } else if (username.length > 30) {
        details.username = 'Username cannot be more than 30 characters';
      } else if (!/^[a-z0-9_]+$/.test(username)) {
        details.username = 'Username can only contain lowercase letters, numbers, and underscores';
      } else if (username !== user.username) {
        // Check if username is already taken
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          details.username = 'Username already in use';
        } else {
          user.username = username.toLowerCase();
        }
      }
    }

    // Update email if provided
    if (email !== undefined) {
      if (!email || email.trim().length === 0) {
        details.email = 'Email is required';
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        details.email = 'Please provide a valid email';
      } else if (email.toLowerCase() !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          details.email = 'Email already in use';
        } else {
          user.email = email.toLowerCase();
        }
      }
    }

    // If there are validation errors, return them
    if (Object.keys(details).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    // Update the full name if firstName or lastName changed
    if (user.firstName || user.lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Patch user profile error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error updating profile'
    });
  }
};

/**
 * @desc    Upload user avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Import cloudinary functions
    const { uploadImage, deleteImage } = await import('../config/cloudinary.js');

    // Delete old avatar if exists
    if (user.avatarPublicId) {
      try {
        await deleteImage(user.avatarPublicId);
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
        // Continue even if delete fails
      }
    }

    // Upload new avatar
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

    const result = await uploadImage(req.file.buffer, uploadOptions);

    // Update user with new avatar
    user.avatar = result.url;
    user.avatarPublicId = result.public_id;
    await user.save();

    // Generate thumbnail URL
    const thumbnailUrl = result.url.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face/');

    res.json({
      success: true,
      data: {
        avatar: result.url,
        thumbnailUrl: thumbnailUrl
      },
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error uploading avatar'
    });
  }
};

/**
 * @desc    Update user by ID (Admin functionality)
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.toAuthJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
export const deleteUserProfile = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete all user's portfolios and case studies
    await Portfolio.deleteMany({ userId: user._id });
    await CaseStudy.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user by ID (Admin functionality)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's portfolios and case studies
    await Portfolio.deleteMany({ userId: user._id });
    await CaseStudy.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
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
export const checkPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const premiumInfo = user.getPremiumInfo();

    res.json({
      success: true,
      data: premiumInfo
    });
  } catch (error) {
    console.error('Check premium status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking premium status',
      error: error.message
    });
  }
};

/**
 * @desc    Get premium status for a specific user (Admin)
 * @route   GET /api/users/:id/premium
 * @access  Private (Admin)
 */
export const getUserPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const premiumInfo = user.getPremiumInfo();

    res.json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        ...premiumInfo
      }
    });
  } catch (error) {
    console.error('Get user premium status error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching premium status',
      error: error.message
    });
  }
};

/**
 * @desc    Set premium status for a user (Admin/Testing)
 * @route   PUT /api/users/:id/premium
 * @access  Private (Admin)
 */
export const setPremiumStatus = async (req, res) => {
  try {
    const { premiumType, duration } = req.body;

    // Validate premium type
    if (!['monthly', 'yearly', 'lifetime'].includes(premiumType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid premium type. Must be: monthly, yearly, or lifetime'
      });
    }

    // Update user premium status
    const user = await User.setPremiumStatus(req.params.id, premiumType, duration);

    res.json({
      success: true,
      message: 'Premium status updated successfully',
      data: user.getPremiumInfo()
    });
  } catch (error) {
    console.error('Set premium status error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error setting premium status',
      error: error.message
    });
  }
};

/**
 * @desc    Remove premium status for a user (Admin)
 * @route   DELETE /api/users/:id/premium
 * @access  Private (Admin)
 */
export const removePremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset premium fields
    user.isPremium = false;
    user.premiumType = 'none';
    user.premiumStartDate = null;
    user.premiumEndDate = null;

    await user.save();

    res.json({
      success: true,
      message: 'Premium status removed successfully',
      data: user.getPremiumInfo()
    });
  } catch (error) {
    console.error('Remove premium status error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error removing premium status',
      error: error.message
    });
  }
};

