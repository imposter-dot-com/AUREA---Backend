/**
 * PDF Routes
 * 
 * API routes for PDF generation and management
 */

import express from 'express';
import {
  generatePDF,
  generateFromHTML,
  downloadPDF,
  getStatus,
  batchGenerate,
  regeneratePDF,
} from '../controllers/pdfController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/pdf/generate/{subdomain}:
 *   post:
 *     summary: Generate PDF for a portfolio
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio subdomain
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               debug:
 *                 type: boolean
 *                 default: true
 *               format:
 *                 type: string
 *                 enum: [A4, Letter, Legal]
 *                 default: A4
 *               landscape:
 *                 type: boolean
 *                 default: false
 *               margin:
 *                 type: object
 *                 properties:
 *                   top:
 *                     type: string
 *                     default: "0.5in"
 *                   right:
 *                     type: string
 *                     default: "0.5in"
 *                   bottom:
 *                     type: string
 *                     default: "0.5in"
 *                   left:
 *                     type: string
 *                     default: "0.5in"
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Server error
 */
router.post('/generate/:subdomain', auth, generatePDF);

/**
 * @swagger
 * /api/pdf/download/{subdomain}:
 *   get:
 *     summary: Download generated PDF
 *     tags: [PDF]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio subdomain
 *       - in: query
 *         name: version
 *         schema:
 *           type: string
 *         description: Specific version/filename to download
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF not found
 */
router.get('/download/:subdomain', downloadPDF);

/**
 * @swagger
 * /api/pdf/status/{subdomain}:
 *   get:
 *     summary: Get PDF status and metadata
 *     tags: [PDF]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio subdomain
 *     responses:
 *       200:
 *         description: PDF status information
 *       500:
 *         description: Server error
 */
router.get('/status/:subdomain', getStatus);

/**
 * @swagger
 * /api/pdf/batch-generate:
 *   post:
 *     summary: Batch generate PDFs for multiple portfolios
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subdomains
 *             properties:
 *               subdomains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of portfolio subdomains
 *               concurrency:
 *                 type: number
 *                 default: 2
 *                 description: Maximum concurrent PDF generations
 *     responses:
 *       200:
 *         description: Batch generation completed
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/batch-generate', auth, batchGenerate);

/**
 * @swagger
 * /api/pdf/regenerate/{subdomain}:
 *   put:
 *     summary: Regenerate PDF for a portfolio
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio subdomain
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [A4, Letter, Legal]
 *               landscape:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: PDF regenerated successfully
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Server error
 */
router.put('/regenerate/:subdomain', auth, regeneratePDF);

/**
 * @swagger
 * /api/pdf/generate-from-html:
 *   post:
 *     summary: Generate PDF from raw HTML content
 *     tags: [PDF]
 *     description: Generate a PDF directly from HTML content sent in the request body. No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - html
 *             properties:
 *               html:
 *                 type: string
 *                 description: Raw HTML content to convert to PDF
 *                 example: "<h1>Hello PDF!</h1><p>This is generated from Express.</p>"
 *               filename:
 *                 type: string
 *                 description: Output PDF filename
 *                 default: "output.pdf"
 *                 example: "my-document.pdf"
 *               format:
 *                 type: string
 *                 enum: [A4, Letter, Legal, A3, A5]
 *                 default: A4
 *                 description: PDF page format
 *               landscape:
 *                 type: boolean
 *                 default: false
 *                 description: Page orientation
 *               printBackground:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to print background graphics
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid HTML content
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
 *                   example: "HTML content is required"
 *       500:
 *         description: PDF generation failed
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
 *                 message:
 *                   type: string
 */
router.post('/generate-from-html', generateFromHTML);

export default router;
