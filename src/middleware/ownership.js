import Portfolio from '../models/Portfolio.js';
import CaseStudy from '../models/CaseStudy.js';
import logger from '../infrastructure/logging/Logger.js';

// Middleware to check portfolio ownership
const checkPortfolioOwnership = async (req, res, next) => {
  try {
    const portfolioId = req.params.id || req.params.portfolioId;
    
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio ID is required',
        code: 'INVALID_INPUT'
      });
    }

    const portfolio = await Portfolio.findById(portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user owns the portfolio
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this portfolio',
        code: 'FORBIDDEN'
      });
    }

    // Attach portfolio to request for use in controller
    req.portfolio = portfolio;
    next();
  } catch (error) {
    logger.error('Portfolio ownership check error', { error: error.message, portfolioId: req.params.id || req.params.portfolioId });
    res.status(500).json({
      success: false,
      error: 'Server error checking portfolio ownership',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware to check case study ownership
const checkCaseStudyOwnership = async (req, res, next) => {
  try {
    const caseStudyId = req.params.id;
    
    if (!caseStudyId) {
      return res.status(400).json({
        success: false,
        error: 'Case study ID is required',
        code: 'INVALID_INPUT'
      });
    }

    const caseStudy = await CaseStudy.findById(caseStudyId);
    
    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user owns the case study
    if (caseStudy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this case study',
        code: 'FORBIDDEN'
      });
    }

    // Attach case study to request for use in controller
    req.caseStudy = caseStudy;
    next();
  } catch (error) {
    logger.error('Case study ownership check error', { error: error.message, caseStudyId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Server error checking case study ownership',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware to check portfolio ownership for case study creation/access
const checkPortfolioOwnershipForCaseStudy = async (req, res, next) => {
  try {
    const portfolioId = req.body.portfolioId || req.params.portfolioId;
    
    if (!portfolioId) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio ID is required',
        code: 'INVALID_INPUT'
      });
    }

    const portfolio = await Portfolio.findById(portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user owns the portfolio
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this portfolio',
        code: 'FORBIDDEN'
      });
    }

    // Attach portfolio to request for use in controller
    req.portfolio = portfolio;
    next();
  } catch (error) {
    logger.error('Portfolio ownership check error', { error: error.message, portfolioId: req.params.id || req.params.portfolioId });
    res.status(500).json({
      success: false,
      error: 'Server error checking portfolio ownership',
      code: 'SERVER_ERROR'
    });
  }
};

export { 
  checkPortfolioOwnership, 
  checkCaseStudyOwnership, 
  checkPortfolioOwnershipForCaseStudy 
};