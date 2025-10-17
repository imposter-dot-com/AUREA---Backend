import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import { checkPortfolioOwnership } from '../middleware/ownership.js';
import {
  portfolioCrudLimiter,
  slugCheckLimiter,
  publishLimiter,
  publicViewLimiter
} from '../middleware/rateLimiter.js';
import {
  validatePortfolioCreation,
  validatePortfolioUpdate,
  validatePublish,
  validateSlugCheck,
  validateObjectId,
  validatePortfolioQuery
} from '../middleware/validation.js';
import { cachePublicPortfolio } from '../utils/cache.js';
import {
  createPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getUserPortfolios,
  getPortfolioStats,
  checkSlug,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio
} from '../controllers/portfolioController.js';

const router = express.Router();

router.post('/', 
  auth, 
  portfolioCrudLimiter, 
  validatePortfolioCreation, 
  createPortfolio
);

// Stats endpoint - should come before /user/me to avoid conflicts
router.get('/stats', 
  auth, 
  getPortfolioStats
);

router.get('/user/me', 
  auth, 
  portfolioCrudLimiter, 
  validatePortfolioQuery, 
  getUserPortfolios
);

router.get('/check-slug/:slug', 
  auth, 
  slugCheckLimiter, 
  validateSlugCheck, 
  checkSlug
);

router.get('/public/:slug', 
  publicViewLimiter, 
  cachePublicPortfolio(300), // 5 minutes cache
  getPublicPortfolio
);

router.get('/:id', 
  optionalAuth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  getPortfolioById
);

router.put('/:id', 
  auth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  validatePortfolioUpdate, 
  checkPortfolioOwnership, 
  updatePortfolio
);

router.delete('/:id', 
  auth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  checkPortfolioOwnership, 
  deletePortfolio
);

router.put('/:id/publish', 
  auth, 
  publishLimiter, 
  validateObjectId('id'), 
  validatePublish, 
  checkPortfolioOwnership, 
  publishPortfolio
);

router.put('/:id/unpublish', 
  auth, 
  publishLimiter, 
  validateObjectId('id'), 
  checkPortfolioOwnership, 
  unpublishPortfolio
);

export default router;