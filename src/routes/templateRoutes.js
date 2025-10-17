import express from 'express';
import {
  getTemplates,
  getTemplateById,
  getTemplateSchema,
  getTemplateCategories,
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  getDefaultTemplate
} from '../controllers/templateController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/categories', getTemplateCategories);
router.get('/default', getDefaultTemplate);
router.get('/', optionalAuth, getTemplates);
router.get('/:id', optionalAuth, getTemplateById);
router.get('/:id/schema', optionalAuth, getTemplateSchema);

// Admin only routes
router.post('/', auth, createTemplate);
router.put('/:id', auth, updateTemplate);
router.delete('/:id', auth, deactivateTemplate);

export default router;