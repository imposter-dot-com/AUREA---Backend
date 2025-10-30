/**
 * Case Study Service
 * Business logic for case study management
 * Handles case study CRUD operations with portfolio validation
 */

import caseStudyRepository from '../repositories/CaseStudyRepository.js';
import Portfolio from '../../models/Portfolio.js';
import mongoose from 'mongoose';
import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../../shared/exceptions/index.js';

class CaseStudyService {
  constructor(repository = caseStudyRepository) {
    this.repository = repository;
  }

  /**
   * Create a new case study
   * @param {Object} data - Case study data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created case study
   */
  async createCaseStudy(data, userId) {
    const { portfolioId, projectId, content } = data;

    logger.service('CaseStudyService', 'createCaseStudy', { portfolioId, projectId, userId });

    // Check if portfolio exists and user owns it
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    if (portfolio.userId.toString() !== userId.toString()) {
      throw ForbiddenError.ownershipRequired('portfolio');
    }

    // Check if project exists in portfolio (check both work.projects and projects arrays)
    const workProjects = portfolio.content?.work?.projects || [];
    const contentProjects = portfolio.content?.projects || [];
    const allProjects = [...workProjects, ...contentProjects];

    // Use loose comparison to handle both string and number IDs
    const projectExists = allProjects.some(project => project.id == projectId);

    if (!projectExists) {
      const availableIds = allProjects.map(p => p.id).join(', ');
      throw new ValidationError(
        `Project ID "${projectId}" not found in portfolio. Available projects: ${availableIds}`
      );
    }

    // Check for existing case study for this project
    const existingCaseStudy = await this.repository.findByPortfolioAndProject(portfolioId, projectId);
    if (existingCaseStudy) {
      throw new ConflictError('Case study already exists for this project');
    }

    // Create case study with default content structure
    const caseStudy = await this.repository.create({
      portfolioId,
      userId,
      projectId,
      content: content || {
        hero: { title: '' },
        overview: {},
        sections: [],
        additionalContext: {},
        nextProject: {}
      }
    });

    logger.info('Case study created', { caseStudyId: caseStudy._id, portfolioId, projectId });

    return caseStudy;
  }

  /**
   * Get case study by ID with population
   * @param {string} caseStudyId - Case study ID
   * @returns {Promise<Object>} Case study
   */
  async getCaseStudyById(caseStudyId) {
    logger.service('CaseStudyService', 'getCaseStudyById', { caseStudyId });

    const caseStudy = await this.repository.findById(caseStudyId, {
      populate: [
        { path: 'portfolioId', select: 'title slug isPublished' },
        { path: 'userId', select: 'name' }
      ]
    });

    if (!caseStudy) {
      throw NotFoundError.resource('Case Study', caseStudyId);
    }

    return caseStudy;
  }

  /**
   * Get case study by portfolio and project with ownership validation
   * @param {string} portfolioId - Portfolio ID
   * @param {string|number} projectId - Project ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Case study
   */
  async getCaseStudyByPortfolioAndProject(portfolioId, projectId, userId) {
    logger.service('CaseStudyService', 'getCaseStudyByPortfolioAndProject', {
      portfolioId,
      projectId,
      userId
    });

    // Check if portfolio exists and user owns it
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioId);
    }

    if (portfolio.userId.toString() !== userId.toString()) {
      throw ForbiddenError.ownershipRequired('portfolio');
    }

    const caseStudy = await this.repository.findByPortfolioAndProject(portfolioId, projectId, {
      populate: [
        { path: 'portfolioId', select: 'title slug isPublished' },
        { path: 'userId', select: 'name' }
      ]
    });

    if (!caseStudy) {
      throw NotFoundError.resource('Case Study', `portfolio:${portfolioId}, project:${projectId}`);
    }

    return caseStudy;
  }

  /**
   * Update case study with deep merge
   * @param {string} caseStudyId - Case study ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated case study
   */
  async updateCaseStudy(caseStudyId, updates) {
    logger.service('CaseStudyService', 'updateCaseStudy', { caseStudyId });

    // Get existing case study
    const caseStudy = await this.repository.findById(caseStudyId);

    if (!caseStudy) {
      throw NotFoundError.resource('Case Study', caseStudyId);
    }

    const { content } = updates;

    // Perform deep merge for content updates
    let updatedContent = { ...caseStudy.content };

    if (content) {
      // Merge hero section
      if (content.hero) {
        updatedContent.hero = { ...updatedContent.hero, ...content.hero };
      }

      // Merge overview section
      if (content.overview) {
        updatedContent.overview = { ...updatedContent.overview, ...content.overview };
      }

      // Replace sections array if provided
      if (content.sections) {
        updatedContent.sections = content.sections;
      }

      // Merge additional context
      if (content.additionalContext) {
        updatedContent.additionalContext = {
          ...updatedContent.additionalContext,
          ...content.additionalContext
        };
      }

      // Merge next project
      if (content.nextProject) {
        updatedContent.nextProject = {
          ...updatedContent.nextProject,
          ...content.nextProject
        };
      }
    }

    const updatedCaseStudy = await this.repository.update(caseStudyId, {
      content: updatedContent
    });

    logger.info('Case study updated', { caseStudyId });

    return updatedCaseStudy;
  }

  /**
   * Delete case study with transaction
   * @param {string} caseStudyId - Case study ID
   * @returns {Promise<void>}
   */
  async deleteCaseStudy(caseStudyId) {
    logger.service('CaseStudyService', 'deleteCaseStudy', { caseStudyId });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get case study
      const caseStudy = await this.repository.findById(caseStudyId);

      if (!caseStudy) {
        throw NotFoundError.resource('Case Study', caseStudyId);
      }

      // Remove case study from portfolio's caseStudies array
      await Portfolio.findByIdAndUpdate(
        caseStudy.portfolioId,
        { $pull: { caseStudies: caseStudy._id } },
        { session }
      );

      // Delete the case study
      await this.repository.delete(caseStudy._id, { session });

      await session.commitTransaction();

      logger.info('Case study deleted', { caseStudyId });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to delete case study', { error, caseStudyId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get public case study by portfolio slug and project ID
   * @param {string} portfolioSlug - Portfolio slug
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Object>} Case study and portfolio info
   */
  async getPublicCaseStudy(portfolioSlug, projectId) {
    logger.service('CaseStudyService', 'getPublicCaseStudy', { portfolioSlug, projectId });

    // First find the portfolio by slug and verify it's published
    const portfolio = await Portfolio.findOne({
      slug: portfolioSlug,
      isPublished: true
    });

    if (!portfolio) {
      throw NotFoundError.resource('Portfolio', portfolioSlug);
    }

    // Find the case study
    const caseStudy = await this.repository.findByPortfolioAndProject(portfolio._id, projectId, {
      populate: [
        { path: 'portfolioId', select: 'title slug' },
        { path: 'userId', select: 'name profileImage' }
      ]
    });

    if (!caseStudy) {
      throw NotFoundError.resource('Case Study', `slug:${portfolioSlug}, project:${projectId}`);
    }

    return {
      caseStudy,
      portfolio: {
        _id: portfolio._id,
        title: portfolio.title,
        slug: portfolio.slug
      }
    };
  }

  /**
   * Get all case studies for a portfolio
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Array>} Case studies
   */
  async getCaseStudiesByPortfolio(portfolioId) {
    logger.service('CaseStudyService', 'getCaseStudiesByPortfolio', { portfolioId });

    return await this.repository.findByPortfolioId(portfolioId);
  }

  /**
   * Get all case studies for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Case studies
   */
  async getCaseStudiesByUser(userId, options = {}) {
    logger.service('CaseStudyService', 'getCaseStudiesByUser', { userId });

    return await this.repository.findByUserId(userId, options);
  }
}

// Export singleton instance
const caseStudyService = new CaseStudyService();
export default caseStudyService;
