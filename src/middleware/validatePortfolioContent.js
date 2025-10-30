import Template from '../models/Template.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * Middleware to validate portfolio content against template schema
 *
 * This middleware:
 * 1. Checks if template and content are provided in request body
 * 2. Fetches the template from database
 * 3. Validates content structure against template schema
 * 4. Attaches template version to request for downstream use
 * 5. Blocks request if validation fails
 *
 * Usage: Add to portfolio create/update routes
 * @example
 * router.post('/', auth, validatePortfolioContent, createPortfolio);
 */
async function validatePortfolioContent(req, res, next) {
  try {
    const { template, templateId, content } = req.body;

    // Skip validation if no template or content (let other validators handle)
    if (!template && !templateId) {
      return next();
    }

    if (!content) {
      return next(); // Content will be validated by schema validators
    }

    // Get template ID (support both 'template' and 'templateId' fields)
    const templateIdentifier = template || templateId;

    // Fetch template from database
    const templateDoc = await Template.findOne({
      $or: [
        { templateId: templateIdentifier },
        { _id: templateIdentifier.match(/^[0-9a-fA-F]{24}$/) ? templateIdentifier : null }
      ],
      isActive: true
    });

    if (!templateDoc) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or inactive'
      });
    }

    // Validate content against template schema
    const validation = templateDoc.validateContent(content);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio content validation failed',
        errors: validation.errors
      });
    }

    // Attach template version to request for downstream use
    req.templateVersion = templateDoc.version;
    req.validatedTemplate = {
      templateId: templateDoc.templateId,
      version: templateDoc.version,
      name: templateDoc.name
    };

    next();
  } catch (error) {
    logger.error('Portfolio content validation error', { error: error.message, template: req.body.template });
    return res.status(500).json({
      success: false,
      message: 'Content validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

export default validatePortfolioContent;
