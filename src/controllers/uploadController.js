import uploadService from '../core/services/UploadService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * Upload Controller - Thin HTTP layer
 * Handles HTTP requests/responses for file uploads
 * All business logic delegated to UploadService
 */

/**
 * @desc    Upload single image to Cloudinary
 * @route   POST /api/upload/single
 * @access  Private
 */
export const uploadSingleImage = async (req, res, next) => {
  try {
    const { portfolioId } = req.body;

    const imageData = await uploadService.uploadSingleImage(
      req.file,
      req.user._id,
      portfolioId
    );

    return responseFormatter.success(
      res,
      imageData,
      'Image uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple images to Cloudinary
 * @route   POST /api/upload/multiple
 * @access  Private
 */
export const uploadMultipleImages = async (req, res, next) => {
  try {
    const { portfolioId } = req.body;

    const results = await uploadService.uploadMultipleImages(
      req.files,
      req.user._id,
      portfolioId
    );

    return responseFormatter.success(
      res,
      { images: results },
      'Images uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
export const deleteImage = async (req, res, next) => {
  try {
    const result = await uploadService.deleteImage(req.params.publicId);

    return responseFormatter.success(
      res,
      result,
      'Image deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};
