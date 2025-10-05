// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  console.error('Error Details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: 'Server Error',
    code: 'SERVER_ERROR'
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    errorResponse = {
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND'
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    
    if (field === 'slug') {
      errorResponse = {
        success: false,
        error: 'This slug is already taken',
        code: 'SLUG_TAKEN'
      };
    } else {
      errorResponse = {
        success: false,
        error: `Duplicate field value: ${field}`,
        code: 'CONFLICT'
      };
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    
    // Check for slug validation specifically
    const slugError = messages.find(msg => msg.includes('slug') || msg.includes('Slug'));
    if (slugError) {
      errorResponse = {
        success: false,
        error: slugError,
        code: 'INVALID_SLUG'
      };
    } else {
      errorResponse = {
        success: false,
        error: messages.join(', '),
        code: 'INVALID_INPUT',
        details: Object.values(err.errors).map(error => ({
          field: error.path,
          message: error.message
        }))
      };
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      success: false,
      error: 'Invalid or expired token',
      code: 'UNAUTHORIZED'
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: 'File too large',
      code: 'FILE_TOO_LARGE'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: 'Invalid file type',
      code: 'INVALID_FILE_TYPE'
    };
  }

  // Custom error with code already set
  if (err.statusCode && err.code) {
    statusCode = err.statusCode;
    errorResponse = {
      success: false,
      error: err.message,
      code: err.code
    };
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
};

export { errorHandler, notFound };
