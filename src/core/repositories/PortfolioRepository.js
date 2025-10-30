/**
 * Portfolio Repository
 * Data access layer for Portfolio model
 * Handles all database operations for portfolios
 */

import Portfolio from '../../models/Portfolio.js';
import logger from '../../infrastructure/logging/Logger.js';

export class PortfolioRepository {
  /**
   * Create a new portfolio
   * @param {Object} portfolioData - Portfolio data
   * @returns {Promise<Portfolio>}
   */
  async create(portfolioData) {
    logger.database('create', 'portfolios', { userId: portfolioData.userId });
    return await Portfolio.create(portfolioData);
  }

  /**
   * Find portfolio by ID
   * @param {string} id - Portfolio ID
   * @param {Object} options - Query options (populate, select)
   * @returns {Promise<Portfolio|null>}
   */
  async findById(id, options = {}) {
    logger.database('findById', 'portfolios', { id });

    let query = Portfolio.findById(id);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.select) {
      query = query.select(options.select);
    }

    return await query.exec();
  }

  /**
   * Find portfolio by slug
   * @param {string} slug - Portfolio slug
   * @returns {Promise<Portfolio|null>}
   */
  async findBySlug(slug) {
    logger.database('findBySlug', 'portfolios', { slug });
    return await Portfolio.findOne({ slug });
  }

  /**
   * Find portfolios by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Portfolio[]>}
   */
  async findByUserId(userId, options = {}) {
    logger.database('findByUserId', 'portfolios', { userId });

    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      filter = {}
    } = options;

    const skip = (page - 1) * limit;

    const query = Portfolio.find({
      userId,
      ...filter
    })
      .sort(sort)
      .limit(limit)
      .skip(skip);

    return await query.exec();
  }

  /**
   * Count portfolios by user ID
   * @param {string} userId - User ID
   * @param {Object} filter - Additional filters
   * @returns {Promise<number>}
   */
  async countByUserId(userId, filter = {}) {
    return await Portfolio.countDocuments({
      userId,
      ...filter
    });
  }

  /**
   * Update portfolio by ID
   * @param {string} id - Portfolio ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Portfolio|null>}
   */
  async update(id, updateData) {
    logger.database('update', 'portfolios', { id });

    return await Portfolio.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete portfolio by ID
   * @param {string} id - Portfolio ID
   * @returns {Promise<Portfolio|null>}
   */
  async delete(id) {
    logger.database('delete', 'portfolios', { id });
    return await Portfolio.findByIdAndDelete(id);
  }

  /**
   * Find published portfolios
   * @param {Object} options - Query options
   * @returns {Promise<Portfolio[]>}
   */
  async findPublished(options = {}) {
    logger.database('findPublished', 'portfolios');

    const {
      page = 1,
      limit = 10,
      sort = { publishedAt: -1 }
    } = options;

    const skip = (page - 1) * limit;

    return await Portfolio.find({ isPublished: true })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name avatar')
      .exec();
  }

  /**
   * Increment view count
   * @param {string} id - Portfolio ID
   * @returns {Promise<Portfolio|null>}
   */
  async incrementViewCount(id) {
    logger.database('incrementViewCount', 'portfolios', { id });

    return await Portfolio.findByIdAndUpdate(
      id,
      {
        $inc: { viewCount: 1 },
        lastViewedAt: new Date()
      },
      { new: true }
    );
  }

  /**
   * Check if slug exists
   * @param {string} slug - Slug to check
   * @param {string} excludeId - Portfolio ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async slugExists(slug, excludeId = null) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Portfolio.countDocuments(query);
    return count > 0;
  }

  /**
   * Get portfolio statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getStats(userId) {
    logger.database('getStats', 'portfolios', { userId });

    const [total, published, drafts, viewStats] = await Promise.all([
      Portfolio.countDocuments({ userId }),
      Portfolio.countDocuments({ userId, isPublished: true }),
      Portfolio.countDocuments({ userId, isPublished: false }),
      Portfolio.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' },
            avgViews: { $avg: '$viewCount' }
          }
        }
      ])
    ]);

    return {
      total,
      published,
      drafts,
      totalViews: viewStats[0]?.totalViews || 0,
      avgViews: Math.round(viewStats[0]?.avgViews || 0)
    };
  }

  /**
   * Find portfolio with owner check
   * @param {string} id - Portfolio ID
   * @param {string} userId - User ID to check ownership
   * @returns {Promise<Portfolio|null>}
   */
  async findByIdAndUserId(id, userId) {
    logger.database('findByIdAndUserId', 'portfolios', { id, userId });

    return await Portfolio.findOne({
      _id: id,
      userId: userId
    });
  }
}

// Export singleton instance
export default new PortfolioRepository();
