import express from 'express';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.js';
import { uploadSingleImage, uploadMultipleImages, deleteImageByPublicId } from '../controllers/uploadController.js';

const router = express.Router();

// Upload single image
router.post('/single', uploadSingle, uploadSingleImage);

// Upload multiple images
router.post('/multiple', uploadMultiple, uploadMultipleImages);

// Delete image by public_id
router.delete('/:publicId', deleteImageByPublicId);

// Apply error handling middleware
router.use(handleMulterError);

export default router;