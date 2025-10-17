import Portfolio from '../models/Portfolio.js';
import CaseStudy from '../models/CaseStudy.js';
import { 
  generateUniqueSlug, 
  checkSlugAvailability, 
  validateSlugFormat,
  generateSlugSuggestions 
} from '../utils/slugGenerator.js';

// @desc    Create a new portfolio
// @route   POST /api/portfolios
// @access  Private
export const createPortfolio = async (req, res) => {
  try {
    const { title, description, templateId, content, styling } = req.body;

    // Create portfolio with user ID
    const portfolioData = {
      userId: req.user._id,
      title,
      description: description || '',
      templateId: templateId || 'echelon',
      content: content || {},
      styling: styling || {}
    };

    const portfolio = await Portfolio.create(portfolioData);

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
        message: messages[0] || 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Get portfolio by ID
// @route   GET /api/portfolios/:id
// @access  Private (owner) or Public (if published)
export const getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const portfolio = await Portfolio.findById(id)
      .populate('caseStudies')
      .populate('userId', 'name');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    // Check access permissions
    if (!portfolio.isPublished && (!req.user || portfolio.userId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Portfolio is not published',
        code: 'ACCESS_DENIED'
      });
    }

    // Increment view count if not owner
    if (!req.user || portfolio.userId._id.toString() !== req.user._id.toString()) {
      portfolio.viewCount += 1;
      portfolio.lastViewedAt = new Date();
      await portfolio.save();
    }

    res.json({
      success: true,
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Update portfolio
// @route   PUT /api/portfolios/:id
// @access  Private (owner only)
export const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, templateId, content, styling } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (content !== undefined) updateData.content = content;
    if (styling !== undefined) updateData.styling = styling;

    const portfolio = await Portfolio.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        populate: 'caseStudies'
      }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: {
        portfolio
      }
    });

  } catch (error) {
    console.error('Update portfolio error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Delete portfolio and all case studies
// @route   DELETE /api/portfolios/:id
// @access  Private (owner only)
export const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findById(id);
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    // Delete all associated case studies
    await CaseStudy.deleteMany({ portfolioId: id });

    // Delete the portfolio
    await Portfolio.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });

  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Get user's portfolios with filters
// @route   GET /api/portfolios/user/me
// @access  Private
export const getUserPortfolios = async (req, res) => {
  try {
    const { published, limit = 50, offset = 0, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter
    const filter = { userId: req.user._id };
    
    if (published !== undefined) {
      filter.isPublished = published === 'true';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get portfolios with optimized field selection (exclude large content/styling)
    const portfolios = await Portfolio.find(filter)
      .select('-content -styling')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('caseStudies', 'projectId');

    // Get statistics
    const totalStats = await Portfolio.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: {
            $sum: {
              $cond: [{ $eq: ['$isPublished', true] }, 1, 0]
            }
          },
          unpublished: {
            $sum: {
              $cond: [{ $eq: ['$isPublished', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = totalStats[0] || { total: 0, published: 0, unpublished: 0 };

    // Format data for frontend compatibility
    const formattedPortfolios = portfolios.map(portfolio => ({
      id: portfolio._id,
      title: portfolio.title,
      description: portfolio.description,
      published: portfolio.isPublished,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      exportCount: portfolio.exportCount || 0,
      showcased: portfolio.showcased || false,
      caseStudiesCount: portfolio.caseStudies.length
    }));

    res.json({
      success: true,
      data: formattedPortfolios,
      meta: {
        total: stats.total,
        published: stats.published,
        unpublished: stats.unpublished,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get user portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving portfolios',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Check slug availability
// @route   GET /api/portfolios/check-slug/:slug
// @access  Private
export const checkSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Use utility function for comprehensive checking
    const availabilityResult = await checkSlugAvailability(slug);

    if (availabilityResult.isAvailable) {
      res.json({
        success: true,
        available: true,
        message: 'Slug is available'
      });
    } else {
      // Format error response with suggestions if slug is taken
      const responseData = {
        success: true,
        available: false,
        message: availabilityResult.error
      };

      if (availabilityResult.suggestions) {
        responseData.suggestions = availabilityResult.suggestions;
      }

      res.json(responseData);
    }

  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking slug availability',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Publish portfolio with slug
// @route   PUT /api/portfolios/:id/publish
// @access  Private (owner only)
export const publishPortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, isPublished } = req.body;

    // Validate slug format first
    const formatValidation = validateSlugFormat(slug);
    if (!formatValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: formatValidation.error
      });
    }

    // Check if slug is already taken by another portfolio
    const availabilityResult = await checkSlugAvailability(slug, id);
    if (!availabilityResult.isAvailable) {
      const statusCode = availabilityResult.code === 'SLUG_TAKEN' ? 409 : 400;
      const responseData = {
        success: false,
        message: availabilityResult.error
      };
      
      if (availabilityResult.suggestions) {
        responseData.suggestions = availabilityResult.suggestions;
      }
      
      return res.status(statusCode).json(responseData);
    }

    // Get current portfolio to check if it's first time publishing
    const currentPortfolio = await Portfolio.findById(id);
    if (!currentPortfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    const isFirstTimePublishing = !currentPortfolio.publishedAt;

    const portfolio = await Portfolio.findByIdAndUpdate(
      id,
      {
        slug,
        isPublished,
        publishedAt: isPublished && isFirstTimePublishing ? new Date() : currentPortfolio.publishedAt,
        unpublishedAt: !isPublished ? new Date() : null
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: isPublished ? 'Portfolio published successfully' : 'Portfolio unpublished successfully',
      data: {
        portfolio: {
          _id: portfolio._id,
          slug: portfolio.slug,
          isPublished: portfolio.isPublished,
          publishedAt: portfolio.publishedAt,
          publicUrl: portfolio.publicUrl
        }
      }
    });

  } catch (error) {
    console.error('Publish portfolio error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error publishing portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Unpublish portfolio (keeps slug)
// @route   PUT /api/portfolios/:id/unpublish
// @access  Private (owner only)
export const unpublishPortfolio = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findByIdAndUpdate(
      id,
      {
        isPublished: false,
        unpublishedAt: new Date()
      },
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio unpublished successfully',
      data: {
        portfolio: {
          _id: portfolio._id,
          isPublished: portfolio.isPublished,
          slug: portfolio.slug,
          unpublishedAt: portfolio.unpublishedAt
        }
      }
    });

  } catch (error) {
    console.error('Unpublish portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unpublishing portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Get published portfolio by slug (public access)
// @route   GET /api/portfolios/public/:slug
// @access  Public
export const getPublicPortfolio = async (req, res) => {
  try {
    const { slug } = req.params;

    // Use atomic increment for view count (more efficient and race-condition safe)
    const portfolio = await Portfolio.findOneAndUpdate(
      { slug, isPublished: true },
      { 
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() }
      },
      { new: true }
    )
      .populate('caseStudies')
      .populate('userId', 'name');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found or not published',
        code: 'NOT_FOUND'
      });
    }

    // Format response according to requirements
    res.json({
      success: true,
      data: {
        _id: portfolio._id,
        title: portfolio.title,
        description: portfolio.description,
        templateId: portfolio.templateId,
        content: portfolio.content,
        styling: portfolio.styling,
        slug: portfolio.slug,
        isPublished: portfolio.isPublished,
        publishedAt: portfolio.publishedAt,
        viewCount: portfolio.viewCount,
        caseStudies: portfolio.caseStudies,
        userId: {
          _id: portfolio.userId._id,
          name: portfolio.userId.name
        }
      }
    });

  } catch (error) {
    console.error('Get public portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving portfolio',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Get portfolio statistics
// @route   GET /api/portfolios/stats
// @access  Private
export const getPortfolioStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalPortfolios = await Portfolio.countDocuments({ userId });
    const publishedPortfolios = await Portfolio.countDocuments({ 
      userId, 
      isPublished: true 
    });

    // Get total exports (sum of all exportCount)
    const exportResult = await Portfolio.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalExports: { $sum: '$exportCount' } } }
    ]);
    const totalExports = exportResult.length > 0 ? exportResult[0].totalExports : 0;

    res.json({
      success: true,
      data: {
        totalPortfolios,
        publishedPortfolios,
        unpublishedPortfolios: totalPortfolios - publishedPortfolios,
        totalExports,
        storageUsed: req.user.storage?.used || 0,
        storageLimit: req.user.storage?.limit || 10737418240
      }
    });

  } catch (error) {
    console.error('Get portfolio stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving statistics',
      code: 'SERVER_ERROR'
    });
  }
};