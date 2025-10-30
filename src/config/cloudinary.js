import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary configuration
const initCloudinary = () => {
  // Access environment variables directly to avoid circular dependency
  // Config module is imported too early in server.js before dotenv runs
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Upload single image (handles both file path and buffer)
const uploadImage = async (fileInput, options = {}) => {
  try {
    let result;
    
    if (Buffer.isBuffer(fileInput)) {
      // Handle buffer upload (from multer memory storage)
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || 'aurea',
            resource_type: 'auto',
            ...options
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileInput);
      });
    } else {
      // Handle file path upload
      result = await cloudinary.uploader.upload(fileInput, {
        folder: options.folder || 'aurea',
        resource_type: 'auto',
        ...options
      });
    }
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Upload multiple images
const uploadMultipleImages = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => {
      // Handle multer file objects or file paths
      const fileInput = file.buffer || file.path || file;
      return uploadImage(fileInput, {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
      });
    });
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new Error(`Multiple image upload failed: ${error.message}`);
  }
};

// Delete image
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

// Delete multiple images
const deleteMultipleImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => deleteImage(publicId));
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    throw new Error(`Multiple image deletion failed: ${error.message}`);
  }
};

// Get image details
const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to get image details: ${error.message}`);
  }
};

// Transform image URL
const transformImage = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

export {
  cloudinary,
  initCloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageDetails,
  transformImage
};
