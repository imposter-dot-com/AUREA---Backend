import siteService from '../core/services/SiteService.js';
import subdomainService from '../core/services/SubdomainService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * Site Controller - Thin HTTP layer
 * Handles HTTP requests/responses for site publishing and management
 * All business logic delegated to SiteService and SubdomainService
 */

/**
 * @desc    Publish portfolio to custom subdomain
 * @route   POST /api/sites/sub-publish
 * @access  Private
 */
export const subPublish = async (req, res, next) => {
  try {
    const { portfolioId, customSubdomain } = req.body;
    const userId = req.user._id;

    const result = await siteService.publishToSubdomain(
      portfolioId,
      userId,
      customSubdomain,
      req.user
    );

    return responseFormatter.success(
      res,
      {
        site: result.site,
        url: result.url,
        summary: result.summary
      },
      'Portfolio published successfully to subdomain'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish portfolio to Vercel
 * @route   POST /api/sites/publish
 * @access  Private
 */
export const publishSite = async (req, res, next) => {
  try {
    const { portfolioId } = req.body;
    const userId = req.user._id;

    const result = await siteService.publishToVercel(
      portfolioId,
      userId,
      req.user
    );

    return responseFormatter.success(
      res,
      {
        site: result.site,
        deployment: result.deployment,
        url: result.url
      },
      'Portfolio deployed to Vercel successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unpublish portfolio site
 * @route   DELETE /api/sites/unpublish/:portfolioId
 * @access  Private
 */
export const unpublishSite = async (req, res, next) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user._id;

    const result = await siteService.unpublish(portfolioId, userId);

    return responseFormatter.success(
      res,
      result,
      'Portfolio unpublished successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get site status for portfolio
 * @route   GET /api/sites/status?portfolioId=xxx
 * @access  Public (no auth required based on routes)
 */
export const getSiteStatus = async (req, res, next) => {
  try {
    const { portfolioId } = req.query;

    if (!portfolioId) {
      return responseFormatter.validationError(res, 'Portfolio ID is required');
    }

    // Since no auth, we can't verify userId - get status without user check
    // Import site repository to check status
    const { default: siteRepository } = await import('../core/repositories/SiteRepository.js');
    const site = await siteRepository.findByPortfolioId(portfolioId);

    if (!site) {
      return responseFormatter.success(
        res,
        {
          published: false,
          subdomain: null,
          status: 'not_published'
        },
        'Site status retrieved'
      );
    }

    // Generate the correct frontend URL
    const config = (await import('../../config/index.js')).default;
    const frontendUrl = config.frontend.url || 'http://localhost:5173';
    const publicUrl = site.vercelUrl || `${frontendUrl}/${site.subdomain}/html`;

    return responseFormatter.success(
      res,
      {
        published: site.published,
        subdomain: site.subdomain,
        status: site.deploymentStatus,
        url: publicUrl,
        lastDeployedAt: site.lastDeployedAt
      },
      'Site status retrieved'
    );
  } catch (error) {
    // Handle CastError (invalid ObjectId format) by returning not_published status
    if (error.name === 'CastError') {
      return responseFormatter.success(
        res,
        {
          published: false,
          subdomain: null,
          status: 'not_published'
        },
        'Site status retrieved'
      );
    }
    next(error);
  }
};

/**
 * @desc    Get site configuration
 * @route   GET /api/sites/config?portfolioId=xxx
 * @access  Private
 */
export const getSiteConfig = async (req, res, next) => {
  try {
    const { portfolioId } = req.query;
    const userId = req.user._id;

    if (!portfolioId) {
      return responseFormatter.validationError(res, 'Portfolio ID is required');
    }

    const status = await siteService.getSiteStatus(portfolioId, userId);

    return responseFormatter.success(
      res,
      { config: status },
      'Site configuration retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update site configuration
 * @route   PUT /api/sites/config
 * @access  Private
 */
export const updateSiteConfig = async (req, res, next) => {
  try {
    const { portfolioId, customSubdomain } = req.body;
    const userId = req.user._id;

    if (!portfolioId) {
      return responseFormatter.validationError(res, 'Portfolio ID is required');
    }

    // For now, republishing is the way to update config
    // Future: could add specific update methods to SiteService

    const result = await siteService.publishToSubdomain(
      portfolioId,
      userId,
      customSubdomain,
      req.user
    );

    return responseFormatter.success(
      res,
      { site: result.site },
      'Site configuration updated'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record site view (analytics)
 * @route   POST /api/sites/analytics/view
 * @access  Public
 */
export const recordSiteView = async (req, res, next) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      return responseFormatter.validationError(res, 'Subdomain is required');
    }

    // Get site
    const site = await siteService.getPublishedSite(subdomain);

    // Log view
    logger.info('Site view recorded', {
      subdomain,
      siteId: site._id,
      ip: req.ip
    });

    // Future: implement proper analytics tracking
    // For now, just acknowledge the view

    return responseFormatter.success(
      res,
      { recorded: true },
      'View recorded'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Debug: Generate HTML/CSS files for testing
 * @route   POST /api/sites/debug/generate
 * @access  Private
 */
export const debugGenerate = async (req, res, next) => {
  try {
    const { portfolioId } = req.body;
    const userId = req.user._id;

    // This is a debug endpoint - generate HTML without publishing
    // Import portfolio repository to get portfolio
    const { default: portfolioRepository } = await import('../core/repositories/PortfolioRepository.js');

    const portfolio = await portfolioRepository.findByIdAndUserId(portfolioId, userId);

    if (!portfolio) {
      return responseFormatter.notFound(res, 'Portfolio not found');
    }

    // Use SiteService internal method to generate HTML
    const { allFiles, portfolioHTML } = await siteService.generatePortfolioHTML(portfolio);

    // Generate subdomain for display
    const subdomain = await subdomainService.generateFromPortfolio(portfolio, req.user);

    return responseFormatter.success(
      res,
      {
        portfolio: {
          id: portfolio._id,
          title: portfolio.title,
          slug: portfolio.slug,
          template: portfolio.template
        },
        files: Object.keys(allFiles),
        subdomain,
        stats: {
          htmlSize: Buffer.byteLength(portfolioHTML, 'utf8'),
          totalFiles: Object.keys(allFiles).length
        }
      },
      'Files generated successfully (debug)'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's published sites
 * @route   GET /api/sites/user
 * @access  Private
 */
export const getUserSites = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit, sort } = req.query;

    const sites = await siteService.getUserSites(userId, {
      limit: parseInt(limit) || 10,
      sort: sort || '-createdAt'
    });

    return responseFormatter.success(
      res,
      { sites, count: sites.length },
      'User sites retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get deployment history
 * @route   GET /api/sites/history
 * @access  Private
 */
export const getDeploymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit, sort } = req.query;

    const history = await siteService.getDeploymentHistory(userId, {
      limit: parseInt(limit) || 10,
      sort: sort || '-lastDeployedAt'
    });

    return responseFormatter.success(
      res,
      { history, count: history.length },
      'Deployment history retrieved'
    );
  } catch (error) {
    next(error);
  }
};

export default {
  subPublish,
  publishSite,
  unpublishSite,
  getSiteStatus,
  getSiteConfig,
  updateSiteConfig,
  recordSiteView,
  debugGenerate,
  getUserSites,
  getDeploymentHistory
};
