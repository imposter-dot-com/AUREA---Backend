/**
 * Portfolio Controller (Refactored)
 * Thin controller layer - handles HTTP requests/responses only
 * Business logic delegated to PortfolioService
 */

import portfolioService from '../core/services/PortfolioService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * @desc    Create a new portfolio
 * @route   POST /api/portfolios
 * @access  Private
 */
export const createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(req.user._id, req.body);
    return responseFormatter.created(res, { portfolio }, 'Portfolio created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get portfolio by ID
 * @route   GET /api/portfolios/:id
 * @access  Private (owner) or Public (if published)
 */
export const getPortfolioById = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id.toString() : null;
    const portfolio = await portfolioService.getPortfolioById(req.params.id, userId);
    return responseFormatter.success(res, { portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update portfolio
 * @route   PUT /api/portfolios/:id
 * @access  Private (owner only)
 */
export const updatePortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.updatePortfolio(
      req.params.id,
      req.user._id,
      req.body
    );
    return responseFormatter.success(res, { portfolio }, 'Portfolio updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete portfolio and all case studies
 * @route   DELETE /api/portfolios/:id
 * @access  Private (owner only)
 */
export const deletePortfolio = async (req, res, next) => {
  try {
    await portfolioService.deletePortfolio(req.params.id, req.user._id);
    return responseFormatter.success(res, null, 'Portfolio deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's portfolios with filters
 * @route   GET /api/portfolios/user/me
 * @access  Private
 */
export const getUserPortfolios = async (req, res, next) => {
  try {
    const result = await portfolioService.getUserPortfolios(req.user._id, req.query);
    return responseFormatter.success(res, result.portfolios, 'Portfolios retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get portfolio statistics
 * @route   GET /api/portfolios/stats
 * @access  Private
 */
export const getPortfolioStats = async (req, res, next) => {
  try {
    const stats = await portfolioService.getPortfolioStats(req.user._id);
    return responseFormatter.success(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if slug is available
 * @route   GET /api/portfolios/check-slug/:slug
 * @access  Public
 */
export const checkSlug = async (req, res, next) => {
  try {
    const portfolioId = req.query.portfolioId || null;
    const result = await portfolioService.checkSlugAvailability(req.params.slug, portfolioId);
    return responseFormatter.success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish portfolio
 * @route   POST /api/portfolios/:id/publish
 * @access  Private (owner only)
 */
export const publishPortfolio = async (req, res, next) => {
  try {
    const { slug } = req.body;
    const portfolio = await portfolioService.publishPortfolio(
      req.params.id,
      req.user._id,
      slug
    );
    return responseFormatter.success(res, { portfolio }, 'Portfolio published successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unpublish portfolio
 * @route   POST /api/portfolios/:id/unpublish
 * @access  Private (owner only)
 */
export const unpublishPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.unpublishPortfolio(
      req.params.id,
      req.user._id
    );
    return responseFormatter.success(res, { portfolio }, 'Portfolio unpublished successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public portfolio by slug
 * @route   GET /api/portfolios/public/:slug
 * @access  Public
 */
export const getPublicPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getPublicPortfolio(req.params.slug);
    return responseFormatter.success(res, { portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific project from portfolio
 * @route   GET /api/portfolios/:portfolioId/projects/:projectId
 * @access  Private (owner) or Public (if published)
 */
export const getProjectById = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id.toString() : null;
    const project = await portfolioService.getProjectById(
      req.params.portfolioId,
      req.params.projectId,
      userId
    );
    return responseFormatter.success(res, { project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update specific project in portfolio
 * @route   PUT /api/portfolios/:portfolioId/projects/:projectId
 * @access  Private (owner only)
 */
export const updateProject = async (req, res, next) => {
  try {
    const project = await portfolioService.updateProject(
      req.params.portfolioId,
      req.params.projectId,
      req.user._id,
      req.body
    );
    return responseFormatter.success(res, { project }, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};
