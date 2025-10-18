import express from 'express';
import {
  getTemplates,
  getTemplateById,
  getTemplateSchema,
  getTemplateCategories,
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  getDefaultTemplate,
  validateTemplateContent,
  createTemplateVersion,
  addTemplateRating
} from '../controllers/templateController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/categories', getTemplateCategories);
router.get('/default', getDefaultTemplate);
router.get('/', optionalAuth, getTemplates);
router.get('/:id', optionalAuth, getTemplateById);
router.get('/:id/schema', optionalAuth, getTemplateSchema);

// Content validation (auth optional for flexibility)
router.post('/:id/validate', optionalAuth, validateTemplateContent);

// User routes (auth required)
router.post('/:id/rating', auth, addTemplateRating);

// Admin only routes
router.post('/', auth, createTemplate);
router.put('/:id', auth, updateTemplate);
router.delete('/:id', auth, deactivateTemplate);
router.post('/:id/version', auth, createTemplateVersion);

export default router;