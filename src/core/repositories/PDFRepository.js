/**
 * PDF Repository
 *
 * Handles all data access operations for PDF generation.
 * Follows the repository pattern to abstract data access from business logic.
 */

import Portfolio from '../../models/Portfolio.js';
import CaseStudy from '../../models/CaseStudy.js';
import logger from '../../infrastructure/logging/Logger.js';

class PDFRepository {
  /**
   * Fetch portfolio with all related data for PDF generation
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - Optional user ID for ownership validation
   * @returns {Promise<Object>} Complete portfolio data with case studies
   */
  async getPortfolioForPDF(portfolioId, userId = null) {
    try {
      // Build query
      const query = { _id: portfolioId };
      if (userId) {
        query.userId = userId;
      }

      // Fetch portfolio with lean for better performance
      const portfolio = await Portfolio.findOne(query).lean();

      if (!portfolio) {
        return null;
      }

      // Fetch case studies in parallel
      const caseStudies = await CaseStudy.find({
        portfolioId: portfolioId
      }).lean();

      // Transform case studies to object keyed by projectId
      const caseStudiesMap = {};
      const caseStudyProjectIds = [];

      if (caseStudies && caseStudies.length > 0) {
        caseStudies.forEach(cs => {
          caseStudiesMap[cs.projectId] = cs;
          caseStudyProjectIds.push(String(cs.projectId));
        });
      }

      // Mark projects that have case studies
      if (portfolio.content?.work?.projects) {
        portfolio.content.work.projects = portfolio.content.work.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }

      if (portfolio.content?.projects) {
        portfolio.content.projects = portfolio.content.projects.map(project => ({
          ...project,
          hasCaseStudy: caseStudyProjectIds.includes(String(project.id))
        }));
      }

      // Attach case studies to portfolio
      portfolio.caseStudies = caseStudiesMap;

      logger.database('read', 'portfolios', {
        portfolioId,
        caseStudiesCount: caseStudies.length
      });

      return portfolio;
    } catch (error) {
      logger.error('Error fetching portfolio for PDF', {
        error: error.message,
        portfolioId
      });
      throw error;
    }
  }

  /**
   * Fetch portfolio metadata only (for cache validation)
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object>} Portfolio metadata
   */
  async getPortfolioMetadata(portfolioId) {
    try {
      const metadata = await Portfolio.findById(portfolioId)
        .select('title updatedAt templateId userId isPublished')
        .lean();

      if (!metadata) {
        return null;
      }

      // Get case studies count
      const caseStudyCount = await CaseStudy.countDocuments({
        portfolioId: portfolioId
      });

      metadata.caseStudyCount = caseStudyCount;

      logger.database('read', 'portfolios', {
        portfolioId,
        operation: 'metadata'
      });

      return metadata;
    } catch (error) {
      logger.error('Error fetching portfolio metadata', {
        error: error.message,
        portfolioId
      });
      throw error;
    }
  }

  /**
   * Check if portfolio exists and is accessible
   * @param {string} portfolioId - Portfolio ID
   * @param {string} userId - Optional user ID for ownership check
   * @returns {Promise<boolean>} True if accessible
   */
  async isPortfolioAccessible(portfolioId, userId = null) {
    try {
      const query = { _id: portfolioId };

      if (userId) {
        // Owner can access their own portfolio
        query.userId = userId;
      } else {
        // Public can only access published portfolios
        query.isPublished = true;
      }

      const exists = await Portfolio.exists(query);

      logger.database('read', 'portfolios', {
        portfolioId,
        operation: 'access_check',
        accessible: exists !== null
      });

      return exists !== null;
    } catch (error) {
      logger.error('Error checking portfolio access', {
        error: error.message,
        portfolioId
      });
      return false;
    }
  }

  /**
   * Get case study by project ID
   * @param {string} portfolioId - Portfolio ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Case study data
   */
  async getCaseStudy(portfolioId, projectId) {
    try {
      const caseStudy = await CaseStudy.findOne({
        portfolioId: portfolioId,
        projectId: projectId
      }).lean();

      logger.database('read', 'caseStudies', {
        portfolioId,
        projectId,
        found: caseStudy !== null
      });

      return caseStudy;
    } catch (error) {
      logger.error('Error fetching case study', {
        error: error.message,
        portfolioId,
        projectId
      });
      throw error;
    }
  }

  /**
   * Get all case studies for a portfolio
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Array>} Array of case studies
   */
  async getCaseStudies(portfolioId) {
    try {
      const caseStudies = await CaseStudy.find({
        portfolioId: portfolioId
      })
      .sort({ createdAt: -1 })
      .lean();

      logger.database('read', 'caseStudies', {
        portfolioId,
        count: caseStudies.length
      });

      return caseStudies;
    } catch (error) {
      logger.error('Error fetching case studies', {
        error: error.message,
        portfolioId
      });
      throw error;
    }
  }

  /**
   * Get recently updated portfolios (for cache warming)
   * @param {number} limit - Number of portfolios to fetch
   * @returns {Promise<Array>} Array of portfolio IDs
   */
  async getRecentlyUpdatedPortfolios(limit = 10) {
    try {
      const portfolios = await Portfolio.find({ isPublished: true })
        .select('_id updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

      const ids = portfolios.map(p => p._id.toString());

      logger.database('read', 'portfolios', {
        operation: 'recent_updates',
        count: ids.length
      });

      return ids;
    } catch (error) {
      logger.error('Error fetching recently updated portfolios', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get portfolio template information
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object>} Template information
   */
  async getPortfolioTemplate(portfolioId) {
    try {
      const portfolio = await Portfolio.findById(portfolioId)
        .select('templateId template')
        .lean();

      if (!portfolio) {
        return null;
      }

      const templateId = portfolio.templateId || portfolio.template || 'echolon';

      logger.database('read', 'portfolios', {
        portfolioId,
        operation: 'template',
        templateId
      });

      return {
        templateId,
        legacy: portfolio.template // Old field name
      };
    } catch (error) {
      logger.error('Error fetching portfolio template', {
        error: error.message,
        portfolioId
      });
      throw error;
    }
  }

  /**
   * Batch fetch portfolios for bulk operations
   * @param {Array<string>} portfolioIds - Array of portfolio IDs
   * @returns {Promise<Array>} Array of portfolios
   */
  async getPortfoliosBatch(portfolioIds) {
    try {
      const portfolios = await Portfolio.find({
        _id: { $in: portfolioIds }
      }).lean();

      logger.database('read', 'portfolios', {
        operation: 'batch',
        requested: portfolioIds.length,
        found: portfolios.length
      });

      return portfolios;
    } catch (error) {
      logger.error('Error batch fetching portfolios', {
        error: error.message,
        count: portfolioIds.length
      });
      throw error;
    }
  }

  /**
   * Update portfolio PDF generation timestamp
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<void>}
   */
  async updatePDFGenerationTime(portfolioId) {
    try {
      await Portfolio.findByIdAndUpdate(
        portfolioId,
        {
          $set: { lastPDFGeneration: new Date() },
          $inc: { pdfGenerationCount: 1 }
        },
        { runValidators: false }
      );

      logger.database('update', 'portfolios', {
        portfolioId,
        operation: 'pdf_generation_time'
      });
    } catch (error) {
      logger.error('Error updating PDF generation time', {
        error: error.message,
        portfolioId
      });
      // Non-critical error, don't throw
    }
  }
}

// Export singleton instance
const pdfRepository = new PDFRepository();
export default pdfRepository;