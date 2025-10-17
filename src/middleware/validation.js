import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'INVALID_INPUT',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// MongoDB ObjectId validation
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Slug validation regex (matches requirements exactly)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Reserved slugs list
const reservedSlugs = [
  'admin', 'api', 'dashboard', 'login', 'signup', 'about', 'contact', 
  'terms', 'privacy', 'help', 'support', 'blog', 'docs', 'new', 
  'create', 'templates', 'events', 'profile', 'settings'
];

// Portfolio validation rules
const validatePortfolioCreation = [
  body('title')
    .notEmpty()
    .withMessage('Portfolio title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters')
    .trim(),
  
  body('templateId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Invalid template ID format'),
  
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be an object'),

  body('customData')
    .optional()
    .isObject()
    .withMessage('Custom data must be an object'),

  body('styling')
    .optional()
    .isObject()
    .withMessage('Styling must be an object'),
  
  handleValidationErrors
];

const validatePortfolioUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters')
    .trim(),
  
  body('templateId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Invalid template ID format'),
  
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be an object'),

  body('customData')
    .optional()
    .isObject()
    .withMessage('Custom data must be an object'),

  body('styling')
    .optional()
    .isObject()
    .withMessage('Styling must be an object'),
  
  handleValidationErrors
];

// Publish validation rules
const validatePublish = [
  body('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Slug must be between 3 and 50 characters')
    .matches(slugRegex)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)')
    .custom((value) => {
      if (reservedSlugs.includes(value.toLowerCase())) {
        throw new Error('This slug is reserved and cannot be used');
      }
      return true;
    })
    .trim()
    .toLowerCase(),
  
  body('isPublished')
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  handleValidationErrors
];

// Slug check validation
const validateSlugCheck = [
  param('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Slug must be between 3 and 50 characters')
    .matches(slugRegex)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)')
    .trim()
    .toLowerCase(),
  
  handleValidationErrors
];

// Case study validation rules
const validateCaseStudyCreation = [
  body('portfolioId')
    .notEmpty()
    .withMessage('Portfolio ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid portfolio ID format'),
  
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .trim(),
  
  body('content.hero.title')
    .notEmpty()
    .withMessage('Hero title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Hero title must be between 1 and 200 characters')
    .trim(),
  
  body('content.hero.subtitle')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Hero subtitle cannot be more than 300 characters')
    .trim(),
  
  body('content.hero.client')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Client name cannot be more than 100 characters')
    .trim(),
  
  body('content.hero.year')
    .optional()
    .matches(/^\d{4}$/)
    .withMessage('Year must be a 4-digit number'),
  
  body('content.hero.role')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Role cannot be more than 100 characters')
    .trim(),
  
  body('content.hero.duration')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Duration cannot be more than 50 characters')
    .trim(),
  
  handleValidationErrors
];

const validateCaseStudyUpdate = [
  body('content.hero.title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Hero title must be between 1 and 200 characters')
    .trim(),
  
  body('content.hero.subtitle')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Hero subtitle cannot be more than 300 characters')
    .trim(),
  
  body('content.hero.client')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Client name cannot be more than 100 characters')
    .trim(),
  
  body('content.hero.year')
    .optional()
    .matches(/^\d{4}$/)
    .withMessage('Year must be a 4-digit number'),
  
  body('content.hero.role')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Role cannot be more than 100 characters')
    .trim(),
  
  body('content.hero.duration')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Duration cannot be more than 50 characters')
    .trim(),
  
  handleValidationErrors
];

// MongoDB ObjectId parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Query parameter validation for portfolio listing
const validatePortfolioQuery = [
  query('published')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('Published filter must be "true", "false", or "all"'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'viewCount'])
    .withMessage('Sort field must be one of: createdAt, updatedAt, title, viewCount'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be "asc" or "desc"'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  handleValidationErrors
];

// User validation rules
const validateUserProfileUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters'),
  
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  handleValidationErrors
];

const validateUserDelete = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query cannot be more than 100 characters')
    .trim(),
  
  handleValidationErrors
];

export {
  validatePortfolioCreation,
  validatePortfolioUpdate,
  validatePublish,
  validateSlugCheck,
  validateCaseStudyCreation,
  validateCaseStudyUpdate,
  validateObjectId,
  validatePortfolioQuery,
  validateUserProfileUpdate,
  validateUserUpdate,
  validateUserDelete,
  validateUserQuery,
  handleValidationErrors,
  reservedSlugs,
  slugRegex
};