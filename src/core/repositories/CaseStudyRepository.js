/**
 * Case Study Repository
 * Data access layer for CaseStudy model
 * Handles all database operations for case studies
 */

import CaseStudy from '../../models/CaseStudy.js';
import logger from '../../infrastructure/logging/Logger.js';

export class CaseStudyRepository {
  /**
   * Create a new case study
   * @param {Object} caseStudyData - Case study data
   * @returns {Promise<CaseStudy>}
   */
  async create(caseStudyData) {
    logger.database('create', 'case_studies', {
      portfolioId: caseStudyData.portfolioId,
      projectId: caseStudyData.projectId
    });
    return await CaseStudy.create(caseStudyData);
  }

  /**
   * Find case study by ID
   * @param {string} id - Case study ID
   * @param {Object} options - Query options
   * @returns {Promise<CaseStudy|null>}
   */
  async findById(id, options = {}) {
    logger.database('findById', 'case_studies', { id });

    let query = CaseStudy.findById(id);

    if (options.populate) {
      options.populate.forEach(field => {
        query = query.populate(field.path, field.select);
      });
    }

    return await query.exec();
  }

  /**
   * Find case study by portfolio and project IDs
   * @param {string} portfolioId - Portfolio ID
   * @param {string|number} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<CaseStudy|null>}
   */
  async findByPortfolioAndProject(portfolioId, projectId, options = {}) {
    logger.database('findByPortfolioAndProject', 'case_studies', { portfolioId, projectId });

    let query = CaseStudy.findOne({ portfolioId, projectId });

    if (options.populate) {
      options.populate.forEach(field => {
        query = query.populate(field.path, field.select);
      });
    }

    return await query.exec();
  }

  /**
   * Find all case studies by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Array>}
   */
  async findByPortfolioId(portfolioId) {
    logger.database('findByPortfolioId', 'case_studies', { portfolioId });
    return await CaseStudy.find({ portfolioId });
  }

  /**
   * Find all case studies by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    logger.database('findByUserId', 'case_studies', { userId });

    const { limit = 10, sort = '-createdAt' } = options;

    return await CaseStudy.find({ userId })
      .sort(sort)
      .limit(limit);
  }

  /**
   * Update case study by ID
   * @param {string} id - Case study ID
   * @param {Object} updateData - Update data
   * @returns {Promise<CaseStudy|null>}
   */
  async update(id, updateData) {
    logger.database('update', 'case_studies', { id });

    return await CaseStudy.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete case study by ID
   * @param {string} id - Case study ID
   * @param {Object} options - Delete options
   * @returns {Promise<CaseStudy|null>}
   */
  async delete(id, options = {}) {
    logger.database('delete', 'case_studies', { id });

    if (options.session) {
      return await CaseStudy.findByIdAndDelete(id, { session: options.session });
    }

    return await CaseStudy.findByIdAndDelete(id);
  }

  /**
   * Check if case study exists for portfolio and project
   * @param {string} portfolioId - Portfolio ID
   * @param {string|number} projectId - Project ID
   * @returns {Promise<boolean>}
   */
  async existsByPortfolioAndProject(portfolioId, projectId) {
    logger.database('existsByPortfolioAndProject', 'case_studies', { portfolioId, projectId });

    const count = await CaseStudy.countDocuments({ portfolioId, projectId });
    return count > 0;
  }

  /**
   * Count case studies by user ID
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async countByUserId(userId) {
    logger.database('countByUserId', 'case_studies', { userId });
    return await CaseStudy.countDocuments({ userId });
  }

  /**
   * Count case studies by portfolio ID
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<number>}
   */
  async countByPortfolioId(portfolioId) {
    logger.database('countByPortfolioId', 'case_studies', { portfolioId });
    return await CaseStudy.countDocuments({ portfolioId });
  }

  /**
   * Delete all case studies for a portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object>}
   */
  async deleteByPortfolioId(portfolioId, options = {}) {
    logger.database('deleteByPortfolioId', 'case_studies', { portfolioId });

    if (options.session) {
      return await CaseStudy.deleteMany({ portfolioId }, { session: options.session });
    }

    return await CaseStudy.deleteMany({ portfolioId });
  }

  /**
   * Delete all case studies for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async deleteByUserId(userId) {
    logger.database('deleteByUserId', 'case_studies', { userId });
    return await CaseStudy.deleteMany({ userId });
  }
}

// Export singleton instance
const caseStudyRepository = new CaseStudyRepository();
export default caseStudyRepository;
