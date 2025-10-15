import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkCaseStudyOwnership, checkPortfolioOwnershipForCaseStudy } from '../middleware/ownership.js';
import { caseStudyCrudLimiter, publicViewLimiter } from '../middleware/rateLimiter.js';
import {
  validateCaseStudyCreation,
  validateCaseStudyUpdate,
  validateObjectId
} from '../middleware/validation.js';
import {
  createCaseStudy,
  getCaseStudyById,
  getCaseStudyByPortfolioAndProject,
  updateCaseStudy,
  deleteCaseStudy,
  getPublicCaseStudy
} from '../controllers/caseStudyController.js';

const router = express.Router();

router.post('/',
  auth,
  caseStudyCrudLimiter,
  validateCaseStudyCreation,
  createCaseStudy
);

router.get('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  checkCaseStudyOwnership,
  getCaseStudyById
);

router.get('/portfolio/:portfolioId/project/:projectId',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('portfolioId'),
  getCaseStudyByPortfolioAndProject
);

router.put('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  validateCaseStudyUpdate,
  checkCaseStudyOwnership,
  updateCaseStudy
);

router.delete('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  checkCaseStudyOwnership,
  deleteCaseStudy
);

router.get('/public/:portfolioSlug/:projectId',
  publicViewLimiter,
  getPublicCaseStudy
);

export default router;