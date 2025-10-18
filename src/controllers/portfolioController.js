import Portfolio from '../models/Portfolio.js';
import CaseStudy from '../models/CaseStudy.js';
import Template from '../models/Template.js';
import {
  generateUniqueSlug,
  checkSlugAvailability,
  validateSlugFormat,
  generateSlugSuggestions
} from '../utils/slugGenerator.js';
import {
  validateAgainstTemplate,
  mergeWithTemplateDefaults
} from '../utils/templateValidator.js';

// @desc    Create a new portfolio
// @route   POST /api/portfolios
// @access  Private
export const createPortfolio = async (req, res) => {
  try {
    const { title, description, template, templateId, customData, content, styling, sections } = req.body;

    // Handle both template (string) and templateId (legacy ObjectId) for backwards compatibility
    let selectedTemplate = template || 'echelon'; // Default to 'echelon' if not provided

    // If legacy templateId is provided but no template string, try to use it
    if (templateId && !template) {
      // For backwards compatibility, we'll just use a default template name
      selectedTemplate = 'echelon';
      console.log('Legacy templateId provided, using default template: echelon');
    }

    // Create portfolio with user ID
    const portfolioData = {
      userId: req.user._id,
      title,
      description: description || '',
      template: selectedTemplate,
      templateVersion: '1.0.0', // Default version
      content: content || {},
      sections: sections || [],
      customData: customData || {},
      styling: styling || {}
    };

    // If templateId was provided (legacy), include it for backwards compatibility
    if (templateId) {
      portfolioData.templateId = templateId;
    }

    console.log('Creating portfolio with data:', {
      ...portfolioData,
      content: '[content object]', // Don't log full content
      sections: `[${portfolioData.sections.length} sections]`
    });

    const portfolio = await Portfolio.create(portfolioData);

    console.log('Portfolio created successfully:', portfolio._id);

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
        portfolio: {
          ...portfolio.toObject(),
          template: portfolio.template || 'echelon' // Ensure template is included
        }
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
    const { title, description, template, templateId, customData, content, styling, sections } = req.body;

    console.log('Update portfolio request:', {
      id,
      bodyKeys: Object.keys(req.body),
      hasSections: !!sections,
      sectionsLength: sections ? sections.length : 0
    });

    // Get current portfolio
    const currentPortfolio = await Portfolio.findById(id);
    if (!currentPortfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (styling !== undefined) updateData.styling = styling;
    if (sections !== undefined) updateData.sections = sections;
    if (content !== undefined) updateData.content = content;
    if (customData !== undefined) updateData.customData = customData;

    // Handle template (string) update
    if (template !== undefined) {
      updateData.template = template;
      updateData.templateVersion = '1.0.0'; // Default version for string templates
    }

    // Handle legacy templateId for backwards compatibility
    if (templateId !== undefined) {
      updateData.templateId = templateId;
      // If no template string provided, default to echelon
      if (!template) {
        updateData.template = 'echelon';
      }
    }

    console.log('Updating portfolio with data:', {
      ...updateData,
      content: updateData.content ? '[content object]' : undefined,
      sections: updateData.sections ? `[${updateData.sections.length} sections]` : undefined
    });

    const portfolio = await Portfolio.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
        populate: 'caseStudies'
      }
    );

    console.log('Portfolio updated successfully:', portfolio._id);

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

    // Format data for frontend compatibility - include all fields the frontend needs
    const formattedPortfolios = portfolios.map(portfolio => ({
      _id: portfolio._id, // Frontend expects _id not id
      id: portfolio._id, // Keep both for compatibility
      title: portfolio.title,
      description: portfolio.description,
      template: portfolio.template || 'echelon', // Include template
      templateId: portfolio.templateId, // Include for backwards compatibility
      isPublished: portfolio.isPublished, // Frontend expects isPublished not published
      published: portfolio.isPublished, // Keep both for compatibility
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      exportCount: portfolio.exportCount || 0,
      showcased: portfolio.showcased || false,
      slug: portfolio.slug,
      publishedAt: portfolio.publishedAt,
      caseStudiesCount: portfolio.caseStudies.length,
      caseStudies: portfolio.caseStudies // Include case studies array
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

// @desc    Check slug/subdomain availability
// @route   GET /api/portfolios/check-slug/:slug
// @access  Public (auth optional)
export const checkSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?._id; // Optional - user might not be authenticated

    // Import subdomain validator
    const { validateSubdomain, generateSubdomainSuggestions } = await import('../utils/subdomainValidator.js');

    // Step 1: Validate format using subdomain rules
    const formatValidation = validateSubdomain(slug);

    if (!formatValidation.valid) {
      const suggestions = generateSubdomainSuggestions(slug);
      return res.json({
        success: true,
        available: false,
        message: formatValidation.error,
        reason: 'INVALID_FORMAT',
        suggestions: suggestions.length > 0 ? suggestions : undefined
      });
    }

    // Step 2: Check if it's available (not taken by another user)
    const Site = (await import('../models/Site.js')).default;
    const existingSite = await Site.findOne({ subdomain: slug.toLowerCase() });

    if (existingSite) {
      // Check if it belongs to the current user (if authenticated)
      const isSameUser = userId && existingSite.userId.toString() === userId.toString();

      if (!isSameUser) {
        // Taken by another user
        const suggestions = generateSubdomainSuggestions(slug);
        return res.json({
          success: true,
          available: false,
          message: 'This subdomain is already taken by another user. Please choose a different subdomain.',
          reason: 'TAKEN_BY_ANOTHER_USER',
          suggestions: suggestions.length > 0 ? suggestions : undefined
        });
      } else {
        // Taken by current user (different portfolio)
        const suggestions = generateSubdomainSuggestions(slug);
        return res.json({
          success: true,
          available: false,
          message: 'This subdomain is already used by another one of your portfolios.',
          reason: 'TAKEN_BY_YOUR_PORTFOLIO',
          ownedByYou: true,
          portfolioId: existingSite.portfolioId.toString(),
          suggestions: suggestions.length > 0 ? suggestions : undefined
        });
      }
    }

    // Step 3: Also check Portfolio model (legacy slug check)
    const availabilityResult = await checkSlugAvailability(slug);

    if (!availabilityResult.isAvailable) {
      const suggestions = generateSubdomainSuggestions(slug);
      return res.json({
        success: true,
        available: false,
        message: availabilityResult.error || 'This subdomain is not available',
        reason: availabilityResult.code || 'UNAVAILABLE',
        suggestions: suggestions.length > 0 ? (suggestions) : (availabilityResult.suggestions || undefined)
      });
    }

    // Available!
    res.json({
      success: true,
      available: true,
      message: '✅ This subdomain is available! You can use it for your portfolio.',
      subdomain: slug.toLowerCase()
    });

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