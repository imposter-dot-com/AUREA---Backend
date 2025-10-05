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

/**
 * @swagger
 * /api/case-studies:
 *   post:
 *     summary: Create a new case study for a portfolio project
 *     tags: [Case Studies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - portfolioId
 *               - projectId
 *               - content
 *             properties:
 *               portfolioId:
 *                 type: string
 *                 pattern: ^[0-9a-fA-F]{24}$
 *                 example: "60d21b4967d0d8992e610c85"
 *               projectId:
 *                 type: string
 *                 description: Must match a project ID in the portfolio's content.work.projects array
 *                 example: "project-1"
 *               content:
 *                 type: object
 *                 required:
 *                   - hero
 *                 properties:
 *                   hero:
 *                     type: object
 *                     required:
 *                       - title
 *                     properties:
 *                       title:
 *                         type: string
 *                         maxLength: 200
 *                         example: "Brand Identity Redesign"
 *                       subtitle:
 *                         type: string
 *                         maxLength: 300
 *                         example: "Transforming a legacy brand for the digital age"
 *                       coverImage:
 *                         type: string
 *                         example: "https://res.cloudinary.com/demo/image/upload/cover.jpg"
 *                       client:
 *                         type: string
 *                         maxLength: 100
 *                         example: "TechCorp Inc."
 *                       year:
 *                         type: string
 *                         pattern: ^\d{4}$
 *                         example: "2024"
 *                       role:
 *                         type: string
 *                         maxLength: 100
 *                         example: "Lead Designer"
 *                       duration:
 *                         type: string
 *                         maxLength: 50
 *                         example: "3 months"
 *                   overview:
 *                     type: object
 *                     properties:
 *                       heading:
 *                         type: string
 *                         maxLength: 200
 *                         default: "Project Overview"
 *                       description:
 *                         type: string
 *                         maxLength: 2000
 *                       challenge:
 *                         type: string
 *                         maxLength: 2000
 *                       solution:
 *                         type: string
 *                         maxLength: 2000
 *                       results:
 *                         type: string
 *                         maxLength: 2000
 *                   sections:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required:
 *                         - id
 *                         - type
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "section-1"
 *                         type:
 *                           type: string
 *                           enum: [text, image, image-text, gallery]
 *                         heading:
 *                           type: string
 *                           maxLength: 200
 *                         content:
 *                           type: string
 *                           maxLength: 5000
 *                         image:
 *                           type: string
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                         layout:
 *                           type: string
 *                           enum: [left, right, center, full]
 *                           default: center
 *     responses:
 *       201:
 *         description: Case study created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Case study created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseStudy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         portfolioId:
 *                           type: string
 *                         projectId:
 *                           type: string
 *                         content:
 *                           type: object
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Validation error or project ID not found in portfolio
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       409:
 *         description: Conflict - Case study already exists for this project
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/',
  auth,
  caseStudyCrudLimiter,
  validateCaseStudyCreation,
  createCaseStudy
);

/**
 * @swagger
 * /api/case-studies/{id}:
 *   get:
 *     summary: Get case study by ID
 *     tags: [Case Studies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Case Study ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Case study retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseStudy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         portfolioId:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c84"
 *                         projectId:
 *                           type: string
 *                           example: "project-1"
 *                         content:
 *                           type: object
 *                           description: Complete case study content structure
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid case study ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not case study owner
 *       404:
 *         description: Case study not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  checkCaseStudyOwnership,
  getCaseStudyById
);

/**
 * @swagger
 * /api/case-studies/portfolio/{portfolioId}/project/{projectId}:
 *   get:
 *     summary: Get case study by portfolio and project ID
 *     tags: [Case Studies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c84"
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID within the portfolio
 *         example: "project-1"
 *     responses:
 *       200:
 *         description: Case study retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseStudy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         portfolioId:
 *                           type: object
 *                           description: Portfolio information (populated)
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             slug:
 *                               type: string
 *                             isPublished:
 *                               type: boolean
 *                         projectId:
 *                           type: string
 *                           example: "project-1"
 *                         content:
 *                           type: object
 *                           description: Complete case study content
 *                         userId:
 *                           type: object
 *                           description: User information (populated)
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid portfolio ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Case study not found for this portfolio and project
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/portfolio/:portfolioId/project/:projectId',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('portfolioId'),
  getCaseStudyByPortfolioAndProject
);

/**
 * @swagger
 * /api/case-studies/{id}:
 *   put:
 *     summary: Update case study (supports partial/deep merge updates)
 *     tags: [Case Studies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Case Study ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial update object - any subset of case study content fields
 *             properties:
 *               content:
 *                 type: object
 *                 description: Supports deep merging - you can update individual nested properties
 *                 properties:
 *                   hero:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         maxLength: 200
 *                         example: "Updated Brand Identity Redesign"
 *                       subtitle:
 *                         type: string
 *                         maxLength: 300
 *                       coverImage:
 *                         type: string
 *                       client:
 *                         type: string
 *                         maxLength: 100
 *                       year:
 *                         type: string
 *                         pattern: ^\d{4}$
 *                       role:
 *                         type: string
 *                         maxLength: 100
 *                       duration:
 *                         type: string
 *                         maxLength: 50
 *                   overview:
 *                     type: object
 *                     properties:
 *                       heading:
 *                         type: string
 *                         maxLength: 200
 *                       description:
 *                         type: string
 *                         maxLength: 2000
 *                       challenge:
 *                         type: string
 *                         maxLength: 2000
 *                       solution:
 *                         type: string
 *                         maxLength: 2000
 *                       results:
 *                         type: string
 *                         maxLength: 2000
 *                   sections:
 *                     type: array
 *                     description: Complete replacement of sections array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [text, image, image-text, gallery]
 *                         heading:
 *                           type: string
 *                           maxLength: 200
 *                         content:
 *                           type: string
 *                           maxLength: 5000
 *                         image:
 *                           type: string
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                         layout:
 *                           type: string
 *                           enum: [left, right, center, full]
 *                   additionalContext:
 *                     type: object
 *                     properties:
 *                       heading:
 *                         type: string
 *                         maxLength: 200
 *                       content:
 *                         type: string
 *                         maxLength: 3000
 *                   nextProject:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                         maxLength: 200
 *                       image:
 *                         type: string
 *             example:
 *               content:
 *                 hero:
 *                   title: "Updated Project Title"
 *                   subtitle: "New subtitle"
 *                 overview:
 *                   description: "Updated project description"
 *     responses:
 *       200:
 *         description: Case study updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Case study updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseStudy:
 *                       type: object
 *                       description: Complete updated case study object
 *       400:
 *         description: Bad request - Invalid case study ID or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not case study owner
 *       404:
 *         description: Case study not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  validateCaseStudyUpdate,
  checkCaseStudyOwnership,
  updateCaseStudy
);

/**
 * @swagger
 * /api/case-studies/{id}:
 *   delete:
 *     summary: Delete case study and remove from portfolio
 *     tags: [Case Studies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Case Study ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Case study deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Case study deleted successfully"
 *       400:
 *         description: Bad request - Invalid case study ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not case study owner
 *       404:
 *         description: Case study not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
  auth,
  caseStudyCrudLimiter,
  validateObjectId('id'),
  checkCaseStudyOwnership,
  deleteCaseStudy
);

/**
 * @swagger
 * /api/case-studies/public/{portfolioSlug}/{projectId}:
 *   get:
 *     summary: Get public case study by portfolio slug and project ID
 *     tags: [Case Studies]
 *     parameters:
 *       - in: path
 *         name: portfolioSlug
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 *         description: Portfolio slug
 *         example: "my-design-portfolio"
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID within the portfolio
 *         example: "project-1"
 *     responses:
 *       200:
 *         description: Public case study retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseStudy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         projectId:
 *                           type: string
 *                           example: "project-1"
 *                         content:
 *                           type: object
 *                           description: Complete case study content structure
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                           example: "My Design Portfolio"
 *                         slug:
 *                           type: string
 *                           example: "my-design-portfolio"
 *                         user:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                           description: Portfolio owner information (limited)
 *       404:
 *         description: Case study not found or portfolio not published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Case study not found or portfolio not published"
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/public/:portfolioSlug/:projectId',
  publicViewLimiter,
  getPublicCaseStudy
);

export default router;