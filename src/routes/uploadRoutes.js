import express from 'express';
import { auth } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadSingleImage, uploadMultipleImages } from '../controllers/uploadController.js';

const router = express.Router();

// POST /api/upload/single - Upload a single image to Cloudinary
router.post('/single', 
  auth, 
  uploadLimiter, 
  uploadSingle, 
  uploadSingleImage
);

// POST /api/upload/multiple - Upload multiple images to Cloudinary
router.post('/multiple', 
  auth, 
  uploadLimiter, 
  uploadMultiple, 
  uploadMultipleImages
);

// Apply error handling middleware for multer
router.use(handleMulterError);

export default router;