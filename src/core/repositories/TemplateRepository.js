/**
 * Template Repository
 * Data access layer for Template model
 * Handles all database operations for templates
 */

import Template from '../../models/Template.js';
import logger from '../../infrastructure/logging/Logger.js';

export class TemplateRepository {
  /**
   * Find templates with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async find(filters = {}, options = {}) {
    logger.database('find', 'templates', filters);

    const { select, sort = { usageCount: -1, createdAt: -1 } } = options;

    let query = Template.find(filters);

    if (select) {
      query = query.select(select);
    }

    query = query.sort(sort);

    return await query.exec();
  }

  /**
   * Find template by ID or templateId
   * @param {string} id - MongoDB ObjectId or templateId
   * @param {Object} options - Query options
   * @returns {Promise<Template|null>}
   */
  async findByIdOrTemplateId(id, options = {}) {
    logger.database('findByIdOrTemplateId', 'templates', { id });

    // Support both MongoDB ObjectId and templateId
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    let templateQuery = Template.findOne(query);

    if (options.select) {
      templateQuery = templateQuery.select(options.select);
    }

    return await templateQuery.exec();
  }

  /**
   * Find template by MongoDB ID
   * @param {string} id - MongoDB ObjectId
   * @returns {Promise<Template|null>}
   */
  async findById(id) {
    logger.database('findById', 'templates', { id });
    return await Template.findById(id);
  }

  /**
   * Find template by templateId
   * @param {string} templateId - Template ID string
   * @returns {Promise<Template|null>}
   */
  async findByTemplateId(templateId) {
    logger.database('findByTemplateId', 'templates', { templateId });
    return await Template.findOne({ templateId });
  }

  /**
   * Get distinct categories
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async getDistinctCategories(filters = {}) {
    logger.database('getDistinctCategories', 'templates', filters);
    return await Template.distinct('category', filters);
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Template>}
   */
  async create(templateData) {
    logger.database('create', 'templates', { templateId: templateData.templateId });
    return await Template.create(templateData);
  }

  /**
   * Update template by ID
   * @param {string} id - Template ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Template|null>}
   */
  async update(id, updateData) {
    logger.database('update', 'templates', { id });

    return await Template.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Deactivate template
   * @param {string} id - Template ID
   * @returns {Promise<Template|null>}
   */
  async deactivate(id) {
    logger.database('deactivate', 'templates', { id });

    return await Template.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Get default template
   * @returns {Promise<Template|null>}
   */
  async getDefault() {
    logger.database('getDefault', 'templates', {});
    return await Template.findOne({ isDefault: true, isActive: true });
  }

  /**
   * Count templates with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    logger.database('count', 'templates', filters);
    return await Template.countDocuments(filters);
  }

  /**
   * Increment template usage count
   * @param {string} id - Template ID
   * @returns {Promise<void>}
   */
  async incrementUsage(id) {
    logger.database('incrementUsage', 'templates', { id });
    await Template.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
  }
}

// Export singleton instance
const templateRepository = new TemplateRepository();
export default templateRepository;
