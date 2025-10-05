import express from 'express';
import { auth } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadSingleImage, uploadMultipleImages } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload a single image to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpeg, png, gif, webp, max 25MB)
 *               portfolioId:
 *                 type: string
 *                 description: Optional portfolio ID to organize uploads
 *                 example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                   example: "Image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v1234567890/aurea/user123/portfolio456/1234567890-image.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "aurea/user123/portfolio456/1234567890-image"
 *                     width:
 *                       type: number
 *                       example: 1920
 *                     height:
 *                       type: number
 *                       example: 1080
 *                     format:
 *                       type: string
 *                       example: "jpg"
 *                     size:
 *                       type: number
 *                       example: 2048000
 *       400:
 *         description: Bad request - No image file provided or invalid file type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       413:
 *         description: Payload too large - File exceeds 25MB limit
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/single', 
  auth, 
  uploadLimiter, 
  uploadSingle, 
  uploadSingleImage
);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of image files (max 6 files, 25MB each, jpeg/png/gif/webp)
 *               portfolioId:
 *                 type: string
 *                 description: Optional portfolio ID to organize uploads
 *                 example: "60d21b4967d0d8992e610c85"
 *     responses:
 *       200:
 *         description: All images uploaded successfully
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
 *                   example: "3 of 3 images uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             example: "https://res.cloudinary.com/demo/image/upload/v1234567890/aurea/user123/portfolio456/1234567890-image.jpg"
 *                           publicId:
 *                             type: string
 *                             example: "aurea/user123/portfolio456/1234567890-image"
 *                           width:
 *                             type: number
 *                             example: 1920
 *                           height:
 *                             type: number
 *                             example: 1080
 *                           format:
 *                             type: string
 *                             example: "jpg"
 *                           size:
 *                             type: number
 *                             example: 2048000
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                             example: "corrupted-image.jpg"
 *                           error:
 *                             type: string
 *                             example: "Invalid image format"
 *       207:
 *         description: Partial success - Some images uploaded, some failed
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
 *                   example: "2 of 3 images uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       description: Successfully uploaded images
 *                     failed:
 *                       type: array
 *                       description: Failed uploads with error details
 *       400:
 *         description: Bad request - No files provided or too many files
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       413:
 *         description: Payload too large - One or more files exceed 25MB limit
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/multiple', 
  auth, 
  uploadLimiter, 
  uploadMultiple, 
  uploadMultipleImages
);

// Apply error handling middleware for multer
router.use(handleMulterError);

export default router;