/**
 * Admin Service
 * Business logic for admin dashboard and analytics
 * Handles system-wide statistics and admin-only operations
 */

import User from '../../models/User.js';
import Portfolio from '../../models/Portfolio.js';
import Template from '../../models/Template.js';
import Site from '../../models/Site.js';
import logger from '../../infrastructure/logging/Logger.js';

class AdminService {
  /**
   * Build query to exclude test users
   * Excludes users where:
   * - Email is exactly "user1@example.com", OR
   * - Name field contains "test" (case-insensitive)
   * @returns {Object} MongoDB query object
   */
  buildNonTestUserQuery() {
    return {
      $and: [
        { email: { $ne: 'user1@example.com' } },
        {
          $or: [
            { name: { $not: { $regex: 'test', $options: 'i' } } },
            { name: { $exists: false } },
            { name: null }
          ]
        }
      ]
    };
  }

  /**
   * Get test user IDs for portfolio filtering
   * @returns {Promise<Array>} Array of test user IDs
   */
  async getTestUserIds() {
    const testUsers = await User.find(
      {
        $or: [
          { email: 'user1@example.com' },
          { name: { $regex: 'test', $options: 'i' } }
        ]
      },
      { _id: 1 }
    );
    return testUsers.map(u => u._id);
  }

  /**
   * Get comprehensive dashboard statistics excluding test users
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    logger.service('AdminService', 'getDashboardStats', {});

    try {
      // Define test user filter
      const testUserFilter = this.buildNonTestUserQuery();

      // Get date ranges
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      // ===== USER STATISTICS =====

      const [
        totalUsers,
        usersThisWeek,
        activeUsers,
        verifiedUsers
      ] = await Promise.all([
        // Total users (excluding test users)
        User.countDocuments(testUserFilter),

        // Users created this week
        User.countDocuments({
          ...testUserFilter,
          createdAt: { $gte: oneWeekAgo }
        }),

        // Active users (logged in within last 30 days)
        User.countDocuments({
          ...testUserFilter,
          lastLoginAt: { $gte: oneMonthAgo }
        }),

        // Verified users
        User.countDocuments({
          ...testUserFilter,
          emailVerified: true
        })
      ]);

      // User growth data (last 8 weeks)
      const userGrowthData = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - ((i - 1) * 7));

        const count = await User.countDocuments({
          ...testUserFilter,
          createdAt: {
            $gte: weekStart,
            $lt: weekEnd
          }
        });

        userGrowthData.push({
          week: `Week ${8 - i}`,
          users: count,
          date: weekStart.toISOString().split('T')[0]
        });
      }

      // ===== PORTFOLIO STATISTICS =====

      // Get all test user IDs to exclude from portfolio stats
      const testUserIds = await this.getTestUserIds();

      const [
        totalPortfolios,
        portfoliosThisWeek,
        publishedPortfolios
      ] = await Promise.all([
        // Total portfolios (excluding test users)
        Portfolio.countDocuments({
          userId: { $nin: testUserIds }
        }),

        // Portfolios created this week
        Portfolio.countDocuments({
          userId: { $nin: testUserIds },
          createdAt: { $gte: oneWeekAgo }
        }),

        // Published portfolios
        Portfolio.countDocuments({
          userId: { $nin: testUserIds },
          isPublished: true
        })
      ]);

      // Total views across all portfolios
      const portfolioViewsResult = await Portfolio.aggregate([
        { $match: { userId: { $nin: testUserIds } } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]);
      const totalPortfolioViews = portfolioViewsResult[0]?.totalViews || 0;

      // Portfolio creation data (last 8 weeks)
      const portfolioGrowthData = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - ((i - 1) * 7));

        const count = await Portfolio.countDocuments({
          userId: { $nin: testUserIds },
          createdAt: {
            $gte: weekStart,
            $lt: weekEnd
          }
        });

        portfolioGrowthData.push({
          week: `Week ${8 - i}`,
          portfolios: count,
          date: weekStart.toISOString().split('T')[0]
        });
      }

      // ===== TEMPLATE STATISTICS =====

      const [
        totalTemplates,
        activeTemplates
      ] = await Promise.all([
        // Total templates
        Template.countDocuments(),

        // Active templates (published/enabled)
        Template.countDocuments({ isPublished: true })
      ]);

      // Template usage stats - count portfolios using each template
      const templateUsageResult = await Portfolio.aggregate([
        { $match: { userId: { $nin: testUserIds } } },
        { $group: { _id: null, totalUsage: { $sum: 1 } } }
      ]);
      const totalClones = templateUsageResult[0]?.totalUsage || 0;

      // Template views - sum of all template view counts
      const totalViewsResult = await Template.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]);
      const totalTemplateViews = totalViewsResult[0]?.totalViews || 0;

      // Most used templates (top 5)
      const topTemplatesResult = await Portfolio.aggregate([
        { $match: { userId: { $nin: testUserIds }, templateId: { $exists: true, $ne: null } } },
        { $group: { _id: '$templateId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // Get template details for top templates
      const topTemplates = await Promise.all(
        topTemplatesResult.map(async (item) => {
          const template = await Template.findOne({ templateId: item._id }).select('name category');
          return {
            name: template?.name || 'Unknown',
            clones: item.count,
            category: template?.category || 'Other'
          };
        })
      );

      // Template categories count
      const categories = await Template.distinct('category');
      const totalCategories = categories.length;

      // ===== RESPONSE =====

      return {
        users: {
          total: totalUsers,
          thisWeek: usersThisWeek,
          active: activeUsers,
          verified: verifiedUsers,
          growthData: userGrowthData
        },
        portfolios: {
          total: totalPortfolios,
          thisWeek: portfoliosThisWeek,
          published: publishedPortfolios,
          totalViews: totalPortfolioViews,
          growthData: portfolioGrowthData
        },
        templates: {
          total: totalTemplates,
          active: activeTemplates,
          totalClones: totalClones,
          totalViews: totalTemplateViews,
          categories: totalCategories,
          topTemplates: topTemplates
        }
      };
    } catch (error) {
      logger.error('AdminService.getDashboardStats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get IDs of test users AND admin users to exclude from portfolio listing
   * @returns {Promise<Array>} Array of user IDs to exclude
   */
  async getExcludedUserIds() {
    const excludedUsers = await User.find(
      {
        $or: [
          { email: 'user1@example.com' },
          { name: { $regex: 'test', $options: 'i' } },
          { name: { $regex: 'admin', $options: 'i' } },
          { role: 'admin' }
        ]
      },
      { _id: 1 }
    );
    return excludedUsers.map(u => u._id);
  }

  /**
   * Get all portfolios with optional user filter (for admin)
   * Excludes portfolios from test users and admin accounts
   * @param {Object} options - Query options (page, limit, userId, etc.)
   * @returns {Promise<Object>} Portfolio list with pagination
   */
  async getAllPortfolios(options = {}) {
    const {
      page = 1,
      limit = 10,
      userId = null,
      sortBy = 'createdAt',
      order = 'desc',
      isPublished = null
    } = options;

    logger.service('AdminService', 'getAllPortfolios', { page, limit, userId, sortBy, order, isPublished });

    // Get user IDs to exclude (test users + admin users)
    const excludedUserIds = await this.getExcludedUserIds();

    // Build query
    const query = {
      userId: { $nin: excludedUserIds }
    };

    // Filter by specific user if provided (override exclusion)
    if (userId) {
      query.userId = userId;
    }

    // Filter by published status if provided
    if (isPublished !== null && isPublished !== undefined && isPublished !== '') {
      query.isPublished = isPublished === 'true' || isPublished === true;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const [rawPortfolios, total] = await Promise.all([
      Portfolio.find(query)
        .populate('userId', 'name email profileImage')
        .select('-content -sections -styling -customData') // Exclude heavy fields
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Portfolio.countDocuments(query)
    ]);

    // Filter out portfolios where user no longer exists (deleted users)
    // and transform user data to provide fallback values
    const portfolios = rawPortfolios
      .filter(p => p.userId !== null && p.userId !== undefined)
      .map(p => ({
        ...p,
        userId: {
          _id: p.userId._id,
          name: p.userId.name || p.userId.email?.split('@')[0] || 'No Name',
          email: p.userId.email || 'No Email',
          profileImage: p.userId.profileImage || null
        }
      }));

    return {
      portfolios,
      pagination: {
        total: portfolios.length < rawPortfolios.length ? total - (rawPortfolios.length - portfolios.length) : total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    };
  }

  /**
   * Get detailed user list excluding test users
   * @param {Object} options - Query options (page, limit, etc.)
   * @returns {Promise<Object>} User list with pagination
   */
  async getNonTestUsers(options = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = options;

    logger.service('AdminService', 'getNonTestUsers', { page, limit, sortBy, order });

    const nonTestUserQuery = this.buildNonTestUserQuery();

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      User.find(nonTestUserQuery)
        .select('-password')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      User.countDocuments(nonTestUserQuery)
    ]);

    return {
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    };
  }

  /**
   * Get all published sites (for admin dashboard)
   * Excludes sites from test users and admin accounts
   * @param {Object} options - Query options (page, limit, etc.)
   * @returns {Promise<Object>} Site list with pagination
   */
  async getAllSites(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'lastDeployedAt',
      order = 'desc',
      published = null,
      deploymentStatus = null
    } = options;

    logger.service('AdminService', 'getAllSites', { page, limit, sortBy, order, published, deploymentStatus });

    // Get user IDs to exclude (test users + admin users)
    const excludedUserIds = await this.getExcludedUserIds();

    // Build query
    const query = {
      userId: { $nin: excludedUserIds },
      isActive: true
    };

    // Filter by published status if provided
    if (published !== null && published !== undefined && published !== '') {
      query.published = published === 'true' || published === true;
    }

    // Filter by deployment status if provided
    if (deploymentStatus) {
      query.deploymentStatus = deploymentStatus;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const [rawSites, total] = await Promise.all([
      Site.find(query)
        .populate('userId', 'name email profileImage')
        .populate('portfolioId', 'title slug content.about.name content.about.headline content.about.avatarUrl')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Site.countDocuments(query)
    ]);

    // Filter out sites where user no longer exists
    const sites = rawSites
      .filter(s => s.userId !== null && s.userId !== undefined)
      .map(s => ({
        ...s,
        userId: {
          _id: s.userId._id,
          name: s.userId.name || s.userId.email?.split('@')[0] || 'No Name',
          email: s.userId.email || 'No Email',
          profileImage: s.userId.profileImage || null
        }
      }));

    return {
      sites,
      pagination: {
        total: sites.length < rawSites.length ? total - (rawSites.length - sites.length) : total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    };
  }
}

export default new AdminService();
