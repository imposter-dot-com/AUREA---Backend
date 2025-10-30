/**
 * Upload Service
 * Business logic for file upload operations
 * Handles Cloudinary image uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../../infrastructure/logging/Logger.js';
import { ValidationError } from '../../shared/exceptions/index.js';

class UploadService {
  /**
   * Upload single image to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} userId - User ID
   * @param {string} portfolioId - Portfolio ID (optional)
   * @returns {Promise<Object>} Upload result
   */
  async uploadSingleImage(file, userId, portfolioId = 'general') {
    logger.service('UploadService', 'uploadSingleImage', { userId, portfolioId });

    if (!file) {
      throw new ValidationError('No image file provided');
    }

    // Generate Cloudinary path
    const timestamp = Date.now();
    const filename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `aurea/${userId}/${portfolioId}/${timestamp}-${filename}`;

    try {
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: publicId,
            folder: 'aurea',
            format: 'webp',
            transformation: [
              { quality: 'auto', fetch_format: 'webp' },
              { width: 2000, height: 2000, crop: 'limit' }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      logger.info('Image uploaded', { publicId, userId });

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } catch (error) {
      logger.error('Cloudinary upload failed', { error, userId });

      if (error.http_code === 400) {
        throw new ValidationError('Invalid image file');
      }

      throw error;
    }
  }

  /**
   * Upload multiple images to Cloudinary
   * @param {Array} files - Array of Multer file objects
   * @param {string} userId - User ID
   * @param {string} portfolioId - Portfolio ID (optional)
   * @returns {Promise<Array>} Upload results
   */
  async uploadMultipleImages(files, userId, portfolioId = 'general') {
    logger.service('UploadService', 'uploadMultipleImages', { userId, portfolioId, count: files.length });

    if (!files || files.length === 0) {
      throw new ValidationError('No image files provided');
    }

    const uploadPromises = files.map(file => this.uploadSingleImage(file, userId, portfolioId));

    const results = await Promise.all(uploadPromises);

    logger.info('Multiple images uploaded', { count: results.length, userId });

    return results;
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    logger.service('UploadService', 'deleteImage', { publicId });

    try {
      const result = await cloudinary.uploader.destroy(publicId);

      logger.info('Image deleted', { publicId, result: result.result });

      return result;
    } catch (error) {
      logger.error('Cloudinary deletion failed', { error, publicId });
      throw error;
    }
  }
}

// Export singleton instance
const uploadService = new UploadService();
export default uploadService;
