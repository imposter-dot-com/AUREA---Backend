/**
 * Template Service
 * Business logic for template management
 * Handles template CRUD, validation, versioning, and ratings
 */

import templateRepository from '../repositories/TemplateRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError } from '../../shared/exceptions/index.js';

class TemplateService {
  constructor(repository = templateRepository) {
    this.repository = repository;
  }

  /**
   * Get all active templates with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Templates
   */
  async getTemplates(filters = {}) {
    const { category, isPremium, tags } = filters;

    logger.service('TemplateService', 'getTemplates', filters);

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (isPremium !== undefined) {
      query.isPremium = isPremium === 'true' || isPremium === true;
    }

    if (tags) {
      const tagArray = typeof tags === 'string'
        ? tags.split(',').map(tag => tag.trim().toLowerCase())
        : tags;
      query.tags = { $in: tagArray };
    }

    return await this.repository.find(query, {
      select: '-schema -caseStudySchema' // Exclude heavy schema fields for list view
    });
  }

  /**
   * Get template by ID (supports both _id and templateId)
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template
   */
  async getTemplateById(id) {
    logger.service('TemplateService', 'getTemplateById', { id });

    const template = await this.repository.findByIdOrTemplateId(id);

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    // Increment usage count (non-blocking)
    this.repository.incrementUsage(template._id).catch(err =>
      logger.warn('Failed to increment template usage', { error: err, templateId: id })
    );

    return template;
  }

  /**
   * Get template schema only
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template schema
   */
  async getTemplateSchema(id) {
    logger.service('TemplateService', 'getTemplateSchema', { id });

    const template = await this.repository.findByIdOrTemplateId(id, {
      select: 'templateId name schema caseStudySchema version'
    });

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    return {
      templateId: template.templateId,
      name: template.name,
      version: template.version,
      schema: template.schema,
      caseStudySchema: template.caseStudySchema
    };
  }

  /**
   * Get template categories
   * @returns {Promise<Array>} Categories
   */
  async getTemplateCategories() {
    logger.service('TemplateService', 'getTemplateCategories', {});

    return await this.repository.getDistinctCategories({ isActive: true });
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData) {
    logger.service('TemplateService', 'createTemplate', { templateId: templateData.templateId });

    // Check if templateId already exists
    const existingTemplate = await this.repository.findByTemplateId(templateData.templateId);
    if (existingTemplate) {
      throw new ValidationError(`Template with ID "${templateData.templateId}" already exists`);
    }

    const template = await this.repository.create(templateData);

    logger.info('Template created', { templateId: template.templateId });

    return template;
  }

  /**
   * Update template
   * @param {string} id - Template ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(id, updateData) {
    logger.service('TemplateService', 'updateTemplate', { id });

    const template = await this.repository.findById(id);

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    const updatedTemplate = await this.repository.update(id, updateData);

    logger.info('Template updated', { templateId: updatedTemplate.templateId });

    return updatedTemplate;
  }

  /**
   * Deactivate template
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Deactivated template
   */
  async deactivateTemplate(id) {
    logger.service('TemplateService', 'deactivateTemplate', { id });

    const template = await this.repository.findById(id);

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    const deactivatedTemplate = await this.repository.deactivate(id);

    logger.info('Template deactivated', { templateId: deactivatedTemplate.templateId });

    return deactivatedTemplate;
  }

  /**
   * Get default template
   * @returns {Promise<Object>} Default template
   */
  async getDefaultTemplate() {
    logger.service('TemplateService', 'getDefaultTemplate', {});

    const defaultTemplate = await this.repository.getDefault();

    if (!defaultTemplate) {
      throw new NotFoundError('No default template found');
    }

    return defaultTemplate;
  }

  /**
   * Validate template content against schema
   * @param {string} templateId - Template ID
   * @param {Object} content - Content to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateTemplateContent(templateId, content) {
    logger.service('TemplateService', 'validateTemplateContent', { templateId });

    const template = await this.repository.findByIdOrTemplateId(templateId);

    if (!template) {
      throw NotFoundError.resource('Template', templateId);
    }

    // Import Template model for validation method
    const Template = (await import('../../models/Template.js')).default;

    const validationResult = template.validateContent
      ? template.validateContent(content)
      : { valid: true, errors: [] };

    return {
      valid: validationResult.valid,
      errors: validationResult.errors || [],
      templateId: template.templateId,
      templateName: template.name
    };
  }

  /**
   * Create template version
   * @param {string} id - Template ID
   * @param {Object} versionData - Version data
   * @returns {Promise<Object>} Updated template
   */
  async createTemplateVersion(id, versionData) {
    logger.service('TemplateService', 'createTemplateVersion', { id });

    const template = await this.repository.findById(id);

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    // Use template model method for versioning
    const Template = (await import('../../models/Template.js')).default;
    const updatedTemplate = await Template.findById(id);

    if (updatedTemplate.createVersion) {
      await updatedTemplate.createVersion(versionData);
    } else {
      // Fallback: manually increment version
      updatedTemplate.version = versionData.version || `${parseInt(updatedTemplate.version) + 1}.0.0`;
      await updatedTemplate.save();
    }

    logger.info('Template version created', { templateId: updatedTemplate.templateId, version: updatedTemplate.version });

    return updatedTemplate;
  }

  /**
   * Add rating to template
   * @param {string} id - Template ID
   * @param {number} rating - Rating value (1-5)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated template
   */
  async addTemplateRating(id, rating, userId) {
    logger.service('TemplateService', 'addTemplateRating', { id, rating, userId });

    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const template = await this.repository.findById(id);

    if (!template) {
      throw NotFoundError.resource('Template', id);
    }

    // Use template model method for rating
    const Template = (await import('../../models/Template.js')).default;
    const updatedTemplate = await Template.findById(id);

    if (updatedTemplate.addRating) {
      await updatedTemplate.addRating(rating, userId);
    } else {
      // Fallback: simple rating average calculation
      const totalRatings = (updatedTemplate.ratingCount || 0) + 1;
      const currentTotal = (updatedTemplate.rating || 0) * (updatedTemplate.ratingCount || 0);
      updatedTemplate.rating = (currentTotal + rating) / totalRatings;
      updatedTemplate.ratingCount = totalRatings;
      await updatedTemplate.save();
    }

    logger.info('Template rating added', { templateId: updatedTemplate.templateId, rating });

    return updatedTemplate;
  }
}

// Export singleton instance
const templateService = new TemplateService();
export default templateService;
