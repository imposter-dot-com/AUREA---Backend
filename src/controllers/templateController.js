import templateService from '../core/services/TemplateService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * Template Controller - Thin HTTP layer
 * Handles HTTP requests/responses for template management
 * All business logic delegated to TemplateService
 */

/**
 * Get all active templates
 * @route GET /api/templates
 */
export const getTemplates = async (req, res, next) => {
  try {
    const templates = await templateService.getTemplates(req.query);

    return responseFormatter.success(
      res,
      templates,
      'Templates retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific template by ID
 * @route GET /api/templates/:id
 */
export const getTemplateById = async (req, res, next) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);

    return responseFormatter.success(
      res,
      template,
      'Template retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get template schema only (for editor)
 * @route GET /api/templates/:id/schema
 */
export const getTemplateSchema = async (req, res, next) => {
  try {
    const schema = await templateService.getTemplateSchema(req.params.id);

    return responseFormatter.success(
      res,
      schema,
      'Template schema retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get template categories
 * @route GET /api/templates/categories
 */
export const getTemplateCategories = async (req, res, next) => {
  try {
    const categories = await templateService.getTemplateCategories();

    return responseFormatter.success(
      res,
      categories,
      'Categories retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new template
 * @route POST /api/templates
 */
export const createTemplate = async (req, res, next) => {
  try {
    const template = await templateService.createTemplate(req.body);

    return responseFormatter.created(
      res,
      template,
      'Template created successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update template
 * @route PUT /api/templates/:id
 */
export const updateTemplate = async (req, res, next) => {
  try {
    const updatedTemplate = await templateService.updateTemplate(req.params.id, req.body);

    return responseFormatter.success(
      res,
      updatedTemplate,
      'Template updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate template
 * @route DELETE /api/templates/:id
 */
export const deactivateTemplate = async (req, res, next) => {
  try {
    const template = await templateService.deactivateTemplate(req.params.id);

    return responseFormatter.success(
      res,
      template,
      'Template deactivated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get default template
 * @route GET /api/templates/default
 */
export const getDefaultTemplate = async (req, res, next) => {
  try {
    const template = await templateService.getDefaultTemplate();

    return responseFormatter.success(
      res,
      template,
      'Default template retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Validate template content against schema
 * @route POST /api/templates/:id/validate
 */
export const validateTemplateContent = async (req, res, next) => {
  try {
    const validationResult = await templateService.validateTemplateContent(
      req.params.id,
      req.body.content
    );

    return responseFormatter.success(
      res,
      validationResult,
      'Content validation completed'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create template version
 * @route POST /api/templates/:id/version
 */
export const createTemplateVersion = async (req, res, next) => {
  try {
    const template = await templateService.createTemplateVersion(req.params.id, req.body);

    return responseFormatter.success(
      res,
      template,
      'Template version created successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add rating to template
 * @route POST /api/templates/:id/rating
 */
export const addTemplateRating = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const userId = req.user?._id || 'anonymous';

    const template = await templateService.addTemplateRating(req.params.id, rating, userId);

    return responseFormatter.success(
      res,
      template,
      'Rating added successfully'
    );
  } catch (error) {
    next(error);
  }
};
