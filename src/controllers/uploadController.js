import { v2 as cloudinary } from 'cloudinary';

// Upload single image
// @desc    Upload single image to Cloudinary
// @route   POST /api/upload/single
// @access  Private
export const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        code: 'INVALID_INPUT'
      });
    }

    const { portfolioId } = req.body;

    // Generate Cloudinary path: /aurea/{userId}/{portfolioId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const filename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `aurea/${req.user._id}/${portfolioId || 'general'}/${timestamp}-${filename}`;

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
      ).end(req.file.buffer);
    });

    // Return structured response
    const imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      size: uploadResult.bytes
    };

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: imageData
    });

  } catch (error) {
    console.error('Upload single image error:', error);
    
    if (error.http_code === 400) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image file',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    throw error;
  }
};

// Upload multiple images
// @desc    Upload multiple images to Cloudinary
// @route   POST /api/upload/multiple
// @access  Private
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided',
        code: 'INVALID_INPUT'
      });
    }

    if (req.files.length > 6) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 6 files allowed',
        code: 'INVALID_INPUT'
      });
    }

    const { portfolioId } = req.body;
    const uploadPromises = [];
    const uploadResults = [];
    const failedUploads = [];

    // Process uploads in parallel
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const timestamp = Date.now() + i; // Ensure unique timestamps
      const filename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const publicId = `aurea/${req.user._id}/${portfolioId || 'general'}/${timestamp}-${filename}`;

      const uploadPromise = new Promise((resolve) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: publicId,
            folder: 'aurea',
            format: 'webp',
            transformation: [
              { quality: 'auto', fetch_format: 'webp' },
              { width: 2000, height: 2000, crop: 'limit' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error(`Upload failed for file ${file.originalname}:`, error);
              failedUploads.push({
                filename: file.originalname,
                error: error.message
              });
              resolve(null);
            } else {
              const imageData = {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
              };
              uploadResults.push(imageData);
              resolve(imageData);
            }
          }
        ).end(file.buffer);
      });

      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    const response = {
      success: uploadResults.length > 0,
      message: `${uploadResults.length} of ${req.files.length} images uploaded successfully`,
      data: {
        images: uploadResults,
        failed: failedUploads
      }
    };

    // Return partial success if some uploads failed
    const statusCode = failedUploads.length > 0 ? 207 : 200; // 207 Multi-Status
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Upload multiple images error:', error);
    throw error;
  }
};

