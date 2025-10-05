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
  checkSlug,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio
} from '../controllers/portfolioController.js';

const router = express.Router();

/**
 * @swagger
 * /api/portfolios:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - templateId
 *               - content
 *               - styling
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "My Design Portfolio"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "A collection of my best design work"
 *               templateId:
 *                 type: string
 *                 enum: [echelon]
 *                 example: "echelon"
 *               content:
 *                 type: object
 *                 description: Template-specific content structure
 *                 example: {
 *                   "work": {
 *                     "projects": [
 *                       {
 *                         "id": "project1",
 *                         "title": "Brand Identity Design",
 *                         "category": "Branding",
 *                         "image": "https://example.com/image.jpg"
 *                       }
 *                     ]
 *                   }
 *                 }
 *               styling:
 *                 type: object
 *                 description: Color, font, and layout configuration
 *                 example: {
 *                   "colors": {
 *                     "primary": "#3b82f6",
 *                     "secondary": "#1f2937"
 *                   },
 *                   "fonts": {
 *                     "heading": "Inter",
 *                     "body": "Inter"
 *                   }
 *                 }
 *     responses:
 *       201:
 *         description: Portfolio created successfully
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
 *                   example: "Portfolio created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         title:
 *                           type: string
 *                           example: "My Design Portfolio"
 *                         description:
 *                           type: string
 *                           example: "A collection of my best design work"
 *                         templateId:
 *                           type: string
 *                           example: "echelon"
 *                         isPublished:
 *                           type: boolean
 *                           example: false
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  auth, 
  portfolioCrudLimiter, 
  validatePortfolioCreation, 
  createPortfolio
);

/**
 * @swagger
 * /api/portfolios/user/me:
 *   get:
 *     summary: Get current user's portfolios with filtering and sorting
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: published
 *         schema:
 *           type: string
 *           enum: [all, true, false]
 *           default: all
 *         description: Filter by publication status
 *         example: "all"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, viewCount]
 *           default: createdAt
 *         description: Sort field
 *         example: "createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "desc"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results to return
 *         example: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: User portfolios retrieved successfully
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
 *                     portfolios:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4967d0d8992e610c85"
 *                           title:
 *                             type: string
 *                             example: "My Design Portfolio"
 *                           description:
 *                             type: string
 *                           isPublished:
 *                             type: boolean
 *                           slug:
 *                             type: string
 *                           viewCount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 15
 *                         page:
 *                           type: number
 *                           example: 1
 *                         pages:
 *                           type: number
 *                           example: 3
 *                         limit:
 *                           type: number
 *                           example: 20
 *       400:
 *         description: Bad request - Invalid query parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/user/me', 
  auth, 
  portfolioCrudLimiter, 
  validatePortfolioQuery, 
  getUserPortfolios
);

/**
 * @swagger
 * /api/portfolios/check-slug/{slug}:
 *   get:
 *     summary: Check if portfolio slug is available
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 *         description: Portfolio slug to check (lowercase letters, numbers, hyphens only)
 *         example: "my-portfolio"
 *     responses:
 *       200:
 *         description: Slug availability checked successfully
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
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     slug:
 *                       type: string
 *                       example: "my-portfolio"
 *       400:
 *         description: Bad request - Invalid slug format or reserved slug
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "This slug is reserved and cannot be used"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/check-slug/:slug', 
  auth, 
  slugCheckLimiter, 
  validateSlugCheck, 
  checkSlug
);

/**
 * @swagger
 * /api/portfolios/public/{slug}:
 *   get:
 *     summary: Get published portfolio by slug (public access)
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 *         description: Portfolio slug
 *         example: "my-design-portfolio"
 *     responses:
 *       200:
 *         description: Published portfolio retrieved successfully
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
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         title:
 *                           type: string
 *                           example: "My Design Portfolio"
 *                         description:
 *                           type: string
 *                           example: "A collection of my best design work"
 *                         templateId:
 *                           type: string
 *                           example: "echelon"
 *                         content:
 *                           type: object
 *                           description: Portfolio content structure
 *                         styling:
 *                           type: object
 *                           description: Portfolio styling configuration
 *                         slug:
 *                           type: string
 *                           example: "my-design-portfolio"
 *                         viewCount:
 *                           type: number
 *                           example: 125
 *                         publishedAt:
 *                           type: string
 *                           format: date-time
 *                         caseStudies:
 *                           type: array
 *                           items:
 *                             type: object
 *                             description: Associated case studies (populated)
 *                         user:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                           description: Portfolio owner information (limited)
 *       404:
 *         description: Portfolio not found or not published
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
 *                   example: "Portfolio not found or not published"
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/public/:slug', 
  publicViewLimiter, 
  cachePublicPortfolio(300), // 5 minutes cache
  getPublicPortfolio
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: Get portfolio by ID
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Portfolio retrieved successfully
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
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         title:
 *                           type: string
 *                           example: "My Design Portfolio"
 *                         description:
 *                           type: string
 *                           example: "A collection of my best design work"
 *                         templateId:
 *                           type: string
 *                           example: "echelon"
 *                         content:
 *                           type: object
 *                         styling:
 *                           type: object
 *                         isPublished:
 *                           type: boolean
 *                           example: true
 *                         slug:
 *                           type: string
 *                           example: "my-design-portfolio"
 *                         viewCount:
 *                           type: number
 *                           example: 42
 *                         caseStudies:
 *                           type: array
 *                           items:
 *                             type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid portfolio ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token (for private portfolios)
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/:id', 
  optionalAuth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  getPortfolioById
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   put:
 *     summary: Update portfolio (partial updates supported)
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Updated Portfolio Title"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Updated portfolio description"
 *               templateId:
 *                 type: string
 *                 enum: [echelon]
 *                 example: "echelon"
 *               content:
 *                 type: object
 *                 description: Template-specific content structure (supports partial updates)
 *               styling:
 *                 type: object
 *                 description: Color, font, and layout configuration (supports partial updates)
 *     responses:
 *       200:
 *         description: Portfolio updated successfully
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
 *                   example: "Portfolio updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolio:
 *                       type: object
 *                       description: Updated portfolio object with all fields
 *       400:
 *         description: Bad request - Invalid portfolio ID or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  auth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  validatePortfolioUpdate, 
  checkPortfolioOwnership, 
  updatePortfolio
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   delete:
 *     summary: Delete portfolio and all associated case studies
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Portfolio deleted successfully
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
 *                   example: "Portfolio deleted successfully"
 *       400:
 *         description: Bad request - Invalid portfolio ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  auth, 
  portfolioCrudLimiter, 
  validateObjectId('id'), 
  checkPortfolioOwnership, 
  deletePortfolio
);

/**
 * @swagger
 * /api/portfolios/{id}/publish:
 *   put:
 *     summary: Publish portfolio with a unique slug
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - isPublished
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 *                 example: "my-design-portfolio"
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Portfolio published successfully
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
 *                   example: "Portfolio published successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         isPublished:
 *                           type: boolean
 *                           example: true
 *                         slug:
 *                           type: string
 *                           example: "my-design-portfolio"
 *                         publishedAt:
 *                           type: string
 *                           format: date-time
 *                         publicUrl:
 *                           type: string
 *                           example: "https://frontend.com/portfolio/my-design-portfolio"
 *       400:
 *         description: Bad request - Invalid slug or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       409:
 *         description: Conflict - Slug already taken
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put('/:id/publish', 
  auth, 
  publishLimiter, 
  validateObjectId('id'), 
  validatePublish, 
  checkPortfolioOwnership, 
  publishPortfolio
);

/**
 * @swagger
 * /api/portfolios/{id}/unpublish:
 *   put:
 *     summary: Unpublish portfolio (keeps slug reserved)
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Portfolio ObjectId
 *         example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Portfolio unpublished successfully
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
 *                   example: "Portfolio unpublished successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4967d0d8992e610c85"
 *                         isPublished:
 *                           type: boolean
 *                           example: false
 *                         slug:
 *                           type: string
 *                           example: "my-design-portfolio"
 *                         unpublishedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid portfolio ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not portfolio owner
 *       404:
 *         description: Portfolio not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put('/:id/unpublish', 
  auth, 
  publishLimiter, 
  validateObjectId('id'), 
  checkPortfolioOwnership, 
  unpublishPortfolio
);

export default router;