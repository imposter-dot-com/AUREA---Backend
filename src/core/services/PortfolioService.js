/**
 * Portfolio Service
 * Business logic layer for portfolio operations
 * Handles all portfolio-related business rules and orchestration
 */

import portfolioRepository from '../repositories/PortfolioRepository.js';
import CaseStudy from '../../models/CaseStudy.js';
import {
  generateUniqueSlug,
  validateSlugFormat,
  generateSlugSuggestions
} from '../../utils/slugGenerator.js';
import logger from '../../infrastructure/logging/Logger.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} from '../../shared/exceptions/index.js';

export class PortfolioService {
  constructor(repository = portfolioRepository) {
    this.repository = repository;
  }

  /**
   * Create a new portfolio
   * @param {string} userId - User ID
   * @param {Object} portfolioData - Portfolio data
   * @returns {Promise<Portfolio>}
   */
  async createPortfolio(userId, portfolioData) {
    logger.service('PortfolioService', 'createPortfolio', { userId });

    const {
      title,
      description,
      template,
      templateId,
      customData,
      content,
      styling,
      sections
    } = portfolioData;

    // Handle both template (string) and templateId (legacy ObjectId) for backwards compatibility
    let selectedTemplate = template || 'echelon';

    if (templateId && !template) {
      selectedTemplate = 'echelon';
      logger.debug('Legacy templateId provided, using default template', { templateId });
    }

    // Build portfolio data
    const portfolioToCreate = {
      userId,
      title,
      description: description || '',
      template: selectedTemplate,
      templateVersion: '1.0.0',
      content: content || {},
      sections: sections || [],
      customData: customData || {},
      styling: styling || {}
    };

    // Include legacy templateId if provided (for backward compatibility)
    if (templateId) {
      // Add templateId to the data object dynamically
      Object.assign(portfolioToCreate, { templateId });
    }

    logger.debug('Creating portfolio', {
      userId,
      template: selectedTemplate,
      sectionsCount: portfolioToCreate.sections.length
    });

    const portfolio = await this.repository.create(portfolioToCreate);

    logger.info('Portfolio created successfully', {
      portfolioId: portfolio._id,
      userId
    });

    return portfolio;
  }

  /**
   * Get portfolio by ID with access control
   * @param {string} portfolioId - Portfolio ID
   * @param {string|null} userId - Current user ID (null for public access)
   * @returns {Promise<Portfolio>}
   */
  async getPortfolioById(portfolioId, userId = null) {
    logger.service('PortfolioService', 'getPortfolioById', { portfolioId, userId });

    const portfolio = await this.repository.findById(portfolioId, {
      populate: ['caseStudies', { path: 'userId', select: 'name' }]
    });

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Check access permissions
    const isOwner = userId && portfolio.userId._id.toString() === userId.toString();
    const isPublished = portfolio.isPublished;

    if (!isPublished && !isOwner) {
      throw new ForbiddenError('Access denied - Portfolio is not published');
    }

    // Increment view count if not owner
    if (!isOwner) {
      await this.repository.incrementViewCount(portfolioId);
      logger.debug('View count incremented', { portfolioId });
    }

    return {
      ...portfolio.toObject(),
      template: portfolio.template || 'echelon'
    };
  }

  /**
   * Update portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID (for ownership check)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Portfolio>}
   */
  async updatePortfolio(portfolioId, userId, updateData) {
    logger.service('PortfolioService', 'updatePortfolio', { portfolioId, userId });

    // Check if portfolio exists and user owns it
    const currentPortfolio = await this.repository.findByIdAndUserId(portfolioId, userId);

    if (!currentPortfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    const {
      title,
      description,
      template,
      templateId,
      customData,
      content,
      styling,
      sections
    } = updateData;

    // Build update object with only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (styling !== undefined) updates.styling = styling;
    if (sections !== undefined) updates.sections = sections;
    if (content !== undefined) updates.content = content;
    if (customData !== undefined) updates.customData = customData;

    // Handle template update
    if (template !== undefined) {
      updates.template = template;
      updates.templateVersion = '1.0.0';
    }

    // Handle legacy templateId
    if (templateId !== undefined) {
      updates.templateId = templateId;
      if (!template) {
        updates.template = 'echelon';
      }
    }

    logger.debug('Updating portfolio', {
      portfolioId,
      updateFields: Object.keys(updates)
    });

    const portfolio = await this.repository.update(portfolioId, updates);

    logger.info('Portfolio updated successfully', { portfolioId });

    return portfolio;
  }

  /**
   * Delete portfolio and associated case studies
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<void>}
   */
  async deletePortfolio(portfolioId, userId) {
    logger.service('PortfolioService', 'deletePortfolio', { portfolioId, userId });

    // Check if portfolio exists and user owns it
    const portfolio = await this.repository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Delete all associated case studies
    await CaseStudy.deleteMany({ portfolioId });
    logger.debug('Associated case studies deleted', { portfolioId });

    // Delete the portfolio
    await this.repository.delete(portfolioId);

    logger.info('Portfolio deleted successfully', { portfolioId });
  }

  /**
   * Get user's portfolios with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getUserPortfolios(userId, options = {}) {
    logger.service('PortfolioService', 'getUserPortfolios', { userId });

    const {
      published,
      limit = 50,
      offset = 0,
      sort = 'createdAt',
      order = 'desc'
    } = options;

    // Build filter
    const filter = {};
    if (published !== undefined) {
      filter.isPublished = published === 'true' || published === true;
    }

    // Build sort
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    // Get portfolios
    const portfolios = await this.repository.findByUserId(userId, {
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      sort: sortObj,
      filter
    });

    // Get statistics
    const stats = await this.repository.getStats(userId);

    // Format portfolios for frontend
    const formattedPortfolios = portfolios.map(portfolio => ({
      _id: portfolio._id,
      id: portfolio._id,
      title: portfolio.title,
      description: portfolio.description,
      template: portfolio.template || 'echelon',
      templateId: portfolio.templateId,
      isPublished: portfolio.isPublished,
      published: portfolio.isPublished,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      exportCount: portfolio.exportCount || 0,
      showcased: portfolio.showcased || false,
      slug: portfolio.slug,
      publishedAt: portfolio.publishedAt,
      caseStudiesCount: portfolio.caseStudies?.length || 0,
      caseStudies: portfolio.caseStudies || []
    }));

    return {
      portfolios: formattedPortfolios,
      meta: {
        total: stats.total,
        published: stats.published,
        unpublished: stats.drafts,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };
  }

  /**
   * Get portfolio statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getPortfolioStats(userId) {
    logger.service('PortfolioService', 'getPortfolioStats', { userId });

    const stats = await this.repository.getStats(userId);

    return {
      totalPortfolios: stats.total,
      publishedPortfolios: stats.published,
      draftPortfolios: stats.drafts,
      totalViews: stats.totalViews,
      averageViews: stats.avgViews
    };
  }

  /**
   * Check if slug is available
   * @param {string} slug - Slug to check
   * @param {string|null} portfolioId - Portfolio ID to exclude from check
   * @returns {Promise<Object>}
   */
  async checkSlugAvailability(slug, portfolioId = null) {
    logger.service('PortfolioService', 'checkSlugAvailability', { slug });

    // Validate slug format
    if (!validateSlugFormat(slug)) {
      throw new ValidationError('Invalid slug format', {
        slug,
        requirements: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only'
      });
    }

    // Check if available
    const exists = await this.repository.slugExists(slug, portfolioId);

    if (exists) {
      // Generate suggestions
      const suggestions = await generateSlugSuggestions(slug);

      return {
        available: false,
        message: 'Slug is already taken',
        suggestions
      };
    }

    return {
      available: true,
      message: 'Slug is available',
      slug
    };
  }

  /**
   * Publish portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID (for ownership check)
   * @param {string|null} slug - Custom slug
   * @returns {Promise<Portfolio>}
   */
  async publishPortfolio(portfolioId, userId, slug = null) {
    logger.service('PortfolioService', 'publishPortfolio', { portfolioId, userId, slug });

    // Check ownership
    const portfolio = await this.repository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    if (portfolio.isPublished) {
      throw new ConflictError('Portfolio is already published', 'PORTFOLIO_ALREADY_PUBLISHED');
    }

    // Generate or validate slug
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(portfolio.title || 'portfolio');
    } else {
      const slugCheck = await this.checkSlugAvailability(finalSlug, portfolioId);
      if (!slugCheck.available) {
        throw ConflictError.slugTaken(finalSlug);
      }
    }

    // Update portfolio
    const updated = await this.repository.update(portfolioId, {
      isPublished: true,
      publishedAt: new Date(),
      slug: finalSlug
    });

    logger.info('Portfolio published successfully', { portfolioId, slug: finalSlug });

    return updated;
  }

  /**
   * Unpublish portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Portfolio>}
   */
  async unpublishPortfolio(portfolioId, userId) {
    logger.service('PortfolioService', 'unpublishPortfolio', { portfolioId, userId });

    // Check ownership
    const portfolio = await this.repository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    // Update portfolio
    const updated = await this.repository.update(portfolioId, {
      isPublished: false
    });

    logger.info('Portfolio unpublished successfully', { portfolioId });

    return updated;
  }

  /**
   * Get public portfolio by slug
   * @param {string} slug - Portfolio slug
   * @returns {Promise<Portfolio>}
   */
  async getPublicPortfolio(slug) {
    logger.service('PortfolioService', 'getPublicPortfolio', { slug });

    const portfolio = await this.repository.findBySlug(slug);

    if (!portfolio || !portfolio.isPublished) {
      throw new NotFoundError('Portfolio not found or not published');
    }

    // Increment view count
    await this.repository.incrementViewCount(portfolio._id);

    return portfolio;
  }
}

// Export singleton instance
export default new PortfolioService();
