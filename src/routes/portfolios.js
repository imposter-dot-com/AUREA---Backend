import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import {
  createPortfolio,
  getUserPortfolios,
  getPublicPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getPortfolioBySlug
} from '../controllers/portfolioController.js';

const router = express.Router();

// @route   POST /api/portfolios
// @desc    Create a new portfolio
// @access  Private
router.post('/', auth, createPortfolio);

// @route   GET /api/portfolios/me
// @desc    Get current user's portfolios
// @access  Private
router.get('/me', auth, getUserPortfolios);

// @route   GET /api/portfolios/public
// @desc    Get public portfolios
// @access  Public
router.get('/public', getPublicPortfolios);

// @route   GET /api/portfolios/:id
// @desc    Get portfolio by ID
// @access  Public (but private portfolios require ownership)
router.get('/:id', optionalAuth, getPortfolioById);

// @route   PUT /api/portfolios/:id
// @desc    Update portfolio
// @access  Private (owner only)
router.put('/:id', auth, updatePortfolio);

// @route   DELETE /api/portfolios/:id
// @desc    Delete portfolio
// @access  Private (owner only)
router.delete('/:id', auth, deletePortfolio);

// @route   GET /api/portfolios/slug/:slug
// @desc    Get portfolio by slug
// @access  Public
router.get('/slug/:slug', optionalAuth, getPortfolioBySlug);

export default router;
