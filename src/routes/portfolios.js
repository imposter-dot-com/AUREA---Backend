import express from 'express';
import Portfolio from '../models/Portfolio.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/portfolios
// @desc    Create a new portfolio
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, template, sections } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio title is required'
      });
    }

    // Create portfolio
    const portfolio = await Portfolio.create({
      userId: req.user._id,
      title,
      template: template || 'default',
      sections: sections || [
        { type: 'about', content: {} },
        { type: 'projects', content: {} },
        { type: 'contact', content: {} }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Create portfolio error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating portfolio'
    });
  }
});

// @route   GET /api/portfolios/me
// @desc    Get current user's portfolios
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const portfolios = await Portfolio.findByUser(req.user._id);

    res.json({
      success: true,
      count: portfolios.length,
      data: {
        portfolios
      }
    });

  } catch (error) {
    console.error('Get user portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolios'
    });
  }
});

// @route   GET /api/portfolios/public
// @desc    Get public portfolios
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const portfolios = await Portfolio.findPublic(limit);

    res.json({
      success: true,
      count: portfolios.length,
      data: {
        portfolios
      }
    });

  } catch (error) {
    console.error('Get public portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting public portfolios'
    });
  }
});

// @route   GET /api/portfolios/:id
// @desc    Get portfolio by ID
// @access  Public (but private portfolios require ownership)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate('userId', 'name');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user can view this portfolio
    const isOwner = req.user && portfolio.userId._id.toString() === req.user._id.toString();
    const canView = portfolio.published && portfolio.isPublic || isOwner;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this portfolio'
      });
    }

    // Increment view count if not owner
    if (!isOwner) {
      await portfolio.incrementViews();
    }

    res.json({
      success: true,
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Get portfolio error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting portfolio'
    });
  }
});

// @route   PUT /api/portfolios/:id
// @desc    Update portfolio
// @access  Private (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user owns this portfolio
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only update your own portfolios'
      });
    }

    // Update portfolio
    const updateData = {};
    const allowedFields = ['title', 'template', 'sections', 'published', 'isPublic', 'slug'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Update portfolio error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating portfolio'
    });
  }
});

// @route   DELETE /api/portfolios/:id
// @desc    Delete portfolio
// @access  Private (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user owns this portfolio
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only delete your own portfolios'
      });
    }

    await Portfolio.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });

  } catch (error) {
    console.error('Delete portfolio error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting portfolio'
    });
  }
});

// @route   GET /api/portfolios/slug/:slug
// @desc    Get portfolio by slug
// @access  Public
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ slug: req.params.slug }).populate('userId', 'name');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user can view this portfolio
    const isOwner = req.user && portfolio.userId._id.toString() === req.user._id.toString();
    const canView = portfolio.published && portfolio.isPublic || isOwner;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this portfolio'
      });
    }

    // Increment view count if not owner
    if (!isOwner) {
      await portfolio.incrementViews();
    }

    res.json({
      success: true,
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Get portfolio by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolio'
    });
  }
});

export default router;
