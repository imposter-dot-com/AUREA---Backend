import Site from '../../models/Site.js';
import logger from '../../infrastructure/logging/Logger.js';

/**
 * Repository for Site data access
 * Handles all database operations for published portfolio sites
 */
export class SiteRepository {

  /**
   * Create a new site
   * @param {Object} data - Site data
   * @returns {Promise<Object>} Created site
   */
  async create(data) {
    logger.database('create', 'sites', { userId: data.userId, subdomain: data.subdomain });
    return await Site.create(data);
  }

  /**
   * Find site by ID
   * @param {string} id - Site ID
   * @returns {Promise<Object|null>} Site or null
   */
  async findById(id) {
    logger.database('findById', 'sites', { id });
    return await Site.findById(id);
  }

  /**
   * Find site by subdomain
   * @param {string} subdomain - Subdomain to search
   * @returns {Promise<Object|null>} Site or null
   */
  async findBySubdomain(subdomain) {
    logger.database('findBySubdomain', 'sites', { subdomain });
    return await Site.findOne({ subdomain });
  }

  /**
   * Find site by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object|null>} Site or null
   */
  async findByPortfolioId(portfolioId) {
    logger.database('findByPortfolioId', 'sites', { portfolioId });
    return await Site.findOne({ portfolioId });
  }

  /**
   * Find site by portfolio ID and user ID
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Site or null
   */
  async findByPortfolioAndUser(portfolioId, userId) {
    logger.database('findByPortfolioAndUser', 'sites', { portfolioId, userId });
    return await Site.findOne({ portfolioId, userId });
  }

  /**
   * Find all sites by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sites
   */
  async findByUserId(userId, options = {}) {
    logger.database('findByUserId', 'sites', { userId });
    const { limit = 10, sort = '-createdAt' } = options;
    return await Site.find({ userId })
      .sort(sort)
      .limit(limit);
  }

  /**
   * Update site
   * @param {string} id - Site ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated site or null
   */
  async update(id, data) {
    logger.database('update', 'sites', { id });
    return await Site.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Update site by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated site or null
   */
  async updateByPortfolio(portfolioId, userId, data) {
    logger.database('updateByPortfolio', 'sites', { portfolioId, userId });
    return await Site.findOneAndUpdate(
      { portfolioId, userId },
      data,
      { new: true, upsert: false }
    );
  }

  /**
   * Create or update site (upsert)
   * @param {Object} filter - Filter criteria
   * @param {Object} data - Site data
   * @returns {Promise<Object>} Created or updated site
   */
  async upsert(filter, data) {
    logger.database('upsert', 'sites', { filter });
    return await Site.findOneAndUpdate(
      filter,
      data,
      { new: true, upsert: true }
    );
  }

  /**
   * Delete site
   * @param {string} id - Site ID
   * @returns {Promise<Object|null>} Deleted site or null
   */
  async delete(id) {
    logger.database('delete', 'sites', { id });
    return await Site.findByIdAndDelete(id);
  }

  /**
   * Delete site by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted site or null
   */
  async deleteByPortfolio(portfolioId, userId) {
    logger.database('deleteByPortfolio', 'sites', { portfolioId, userId });
    return await Site.findOneAndDelete({ portfolioId, userId });
  }

  /**
   * Check if subdomain exists
   * @param {string} subdomain - Subdomain to check
   * @param {string} excludeUserId - User ID to exclude from check (optional)
   * @returns {Promise<boolean>} True if subdomain exists
   */
  async subdomainExists(subdomain, excludeUserId = null) {
    logger.database('subdomainExists', 'sites', { subdomain, excludeUserId });

    const query = { subdomain };

    // If excludeUserId provided, exclude sites belonging to that user
    if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
    }

    const site = await Site.exists(query);
    return !!site;
  }

  /**
   * Check if subdomain is taken by a different user
   * @param {string} subdomain - Subdomain to check
   * @param {string} currentUserId - Current user ID
   * @returns {Promise<boolean>} True if taken by different user
   */
  async isSubdomainTakenByOtherUser(subdomain, currentUserId) {
    logger.database('isSubdomainTakenByOtherUser', 'sites', { subdomain, currentUserId });

    const site = await Site.findOne({
      subdomain,
      userId: { $ne: currentUserId }
    });

    return !!site;
  }

  /**
   * Check if subdomain is used by another portfolio of same user
   * @param {string} subdomain - Subdomain to check
   * @param {string} userId - User ID
   * @param {string} portfolioId - Current portfolio ID
   * @returns {Promise<boolean>} True if used by another portfolio
   */
  async isSubdomainUsedByAnotherPortfolio(subdomain, userId, portfolioId) {
    logger.database('isSubdomainUsedByAnotherPortfolio', 'sites', { subdomain, userId, portfolioId });

    const site = await Site.findOne({
      subdomain,
      userId,
      portfolioId: { $ne: portfolioId }
    });

    return !!site;
  }

  /**
   * Get site with subdomain by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object|null>} Site or null
   */
  async getSiteWithSubdomain(portfolioId) {
    logger.database('getSiteWithSubdomain', 'sites', { portfolioId });
    return await Site.findOne({ portfolioId }).select('subdomain portfolioId userId');
  }

  /**
   * Find all active/published sites
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sites
   */
  async findPublicSites(options = {}) {
    logger.database('findPublicSites', 'sites');
    const { limit = 50, skip = 0, sort = '-createdAt' } = options;

    return await Site.find({ published: true, isActive: true })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  /**
   * Get deployment history for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sites with deployment info
   */
  async getDeploymentHistory(userId, options = {}) {
    logger.database('getDeploymentHistory', 'sites', { userId });
    const { limit = 10, sort = '-lastDeployedAt' } = options;

    return await Site.find({ userId })
      .select('subdomain title portfolioId published deploymentStatus lastDeployedAt createdAt')
      .sort(sort)
      .limit(limit);
  }

  /**
   * Update deployment status
   * @param {string} id - Site ID
   * @param {string} status - Deployment status
   * @returns {Promise<Object|null>} Updated site or null
   */
  async updateDeploymentStatus(id, status) {
    logger.database('updateDeploymentStatus', 'sites', { id, status });

    return await Site.findByIdAndUpdate(
      id,
      {
        deploymentStatus: status,
        lastDeployedAt: new Date()
      },
      { new: true }
    );
  }

  /**
   * Count total sites by user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of sites
   */
  async countByUserId(userId) {
    logger.database('countByUserId', 'sites', { userId });
    return await Site.countDocuments({ userId });
  }

  /**
   * Count published sites
   * @returns {Promise<number>} Count of published sites
   */
  async countPublished() {
    logger.database('countPublished', 'sites');
    return await Site.countDocuments({ published: true, isActive: true });
  }

  /**
   * Find sites by subdomain pattern (for suggestions)
   * @param {string} pattern - Subdomain pattern (e.g., "john-")
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Array of matching subdomains
   */
  async findSimilarSubdomains(pattern, limit = 5) {
    logger.database('findSimilarSubdomains', 'sites', { pattern });

    const regex = new RegExp(`^${pattern}`, 'i');

    return await Site.find({ subdomain: regex })
      .select('subdomain')
      .limit(limit)
      .lean();
  }
}

export default new SiteRepository();
