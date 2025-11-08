/**
 * PDF Export Service
 * Business logic for PDF generation and export
 * OPTIMIZED: Now includes cache management, performance monitoring, and clean architecture integration
 */

import logger from '../../infrastructure/logging/Logger.js';
import { NotFoundError } from '../../shared/exceptions/index.js';
import pdfRepository from '../repositories/PDFRepository.js';
import pdfCache from '../../infrastructure/cache/PDFCache.js';
import browserPool from '../../infrastructure/pdf/BrowserPool.js';

class PDFExportService {
  /**
   * Export portfolio as PDF
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Export options
   * @param {string} userId - Optional user ID for ownership check
   * @returns {Promise<Object>} PDF result with buffer and metadata
   */
  async exportPortfolioPDF(portfolioId, options = {}, userId = null) {
    const startTime = Date.now();
    logger.service('PDFExportService', 'exportPortfolioPDF', { portfolioId, hasUserId: !!userId });

    try {
      // Validate portfolio access
      const isAccessible = await pdfRepository.isPortfolioAccessible(portfolioId, userId);
      if (!isAccessible) {
        throw new NotFoundError('Portfolio not found or not accessible');
      }

      // Import PDF generation service dynamically to avoid circular dependencies
      const { generatePortfolioPDF } = await import('../../../services/pdfGenerationService.js');

      // Generate or retrieve from cache
      const pdfResult = await generatePortfolioPDF(
        portfolioId,
        userId,
        options.pageType || 'portfolio',
        options,
        options.templateId
      );

      if (!pdfResult || !pdfResult.buffer) {
        throw new NotFoundError('Failed to generate PDF');
      }

      // Log performance metrics
      const totalTime = Date.now() - startTime;
      logger.info('PDF export completed', {
        portfolioId,
        totalTimeMs: totalTime,
        cached: pdfResult.cached || false,
        sizeKB: Math.round(pdfResult.buffer.length / 1024)
      });

      return pdfResult;
    } catch (error) {
      logger.error('PDF export failed', {
        portfolioId,
        error: error.message,
        timeMs: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Export complete portfolio with case studies
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Export options
   * @param {string} userId - Optional user ID for ownership check
   * @returns {Promise<Object>} PDF result with buffer and metadata
   */
  async exportCompletePDF(portfolioId, options = {}, userId = null) {
    const startTime = Date.now();
    logger.service('PDFExportService', 'exportCompletePDF', { portfolioId, hasUserId: !!userId });

    try {
      // Validate portfolio access
      const isAccessible = await pdfRepository.isPortfolioAccessible(portfolioId, userId);
      if (!isAccessible) {
        throw new NotFoundError('Portfolio not found or not accessible');
      }

      const { generateCombinedPDF } = await import('../../../services/pdfGenerationService.js');

      // Generate or retrieve from cache
      const pdfResult = await generateCombinedPDF(
        portfolioId,
        userId,
        options,
        options.templateId
      );

      if (!pdfResult || !pdfResult.buffer) {
        throw new NotFoundError('Failed to generate complete PDF');
      }

      // Log performance metrics
      const totalTime = Date.now() - startTime;
      logger.info('Complete PDF export completed', {
        portfolioId,
        totalTimeMs: totalTime,
        cached: pdfResult.cached || false,
        sizeKB: Math.round(pdfResult.buffer.length / 1024)
      });

      return pdfResult;
    } catch (error) {
      logger.error('Complete PDF export failed', {
        portfolioId,
        error: error.message,
        timeMs: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get PDF generation info and statistics
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object>} PDF info with cache and performance stats
   */
  async getPDFInfo(portfolioId) {
    logger.service('PDFExportService', 'getPDFInfo', { portfolioId });

    try {
      // Get portfolio metadata
      const metadata = await pdfRepository.getPortfolioMetadata(portfolioId);
      if (!metadata) {
        throw new NotFoundError('Portfolio not found');
      }

      // Get cache stats
      const cacheStats = pdfCache.getStats();

      // Get browser pool stats
      const poolStats = browserPool.getStats();

      return {
        portfolioId,
        available: true,
        formats: ['pdf'],
        maxSize: '10MB',
        template: metadata.templateId || 'echolon',
        caseStudyCount: metadata.caseStudyCount || 0,
        performance: {
          estimatedTimeMs: metadata.caseStudyCount > 0 ? 3000 : 2000, // Estimated based on optimizations
          cachingEnabled: cacheStats.enabled,
          cacheHitRate: cacheStats.hitRate,
          browserPoolSize: poolStats.poolSize,
          browsersAvailable: poolStats.available
        },
        features: {
          fastMode: process.env.PDF_FAST_MODE === 'true',
          caching: process.env.PDF_CACHE_ENABLED !== 'false',
          browserPool: true
        }
      };
    } catch (error) {
      logger.error('Failed to get PDF info', { portfolioId, error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup old PDFs and manage cache
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupPDFs(options = {}) {
    logger.service('PDFExportService', 'cleanupPDFs', options);

    try {
      // Clear cache if requested
      if (options.clearCache) {
        pdfCache.clear();
      }

      // Clean expired cache entries
      await pdfCache.cleanupExpired();

      // Get cleanup stats
      const cacheStats = pdfCache.getStats();
      const poolStats = browserPool.getStats();

      // Import and run file cleanup if needed
      if (options.cleanFiles) {
        const { cleanupOldPDFs } = await import('../../../services/pdfGenerationService.js');
        await cleanupOldPDFs(options.maxAgeInDays || 7);
      }

      return {
        success: true,
        message: 'PDF cleanup completed',
        stats: {
          cacheSize: cacheStats.size,
          cacheMemoryMB: cacheStats.memoryUsedMB,
          evictions: cacheStats.evictions,
          browserPoolSize: poolStats.poolSize
        }
      };
    } catch (error) {
      logger.error('PDF cleanup failed', { error: error.message });
      return {
        success: false,
        message: 'PDF cleanup failed',
        error: error.message
      };
    }
  }

  /**
   * Invalidate cache for a specific portfolio
   * @param {string} portfolioId - Portfolio ID
   * @returns {Promise<Object>} Invalidation result
   */
  async invalidatePortfolioCache(portfolioId) {
    logger.service('PDFExportService', 'invalidatePortfolioCache', { portfolioId });

    try {
      const invalidated = pdfCache.invalidatePortfolio(portfolioId);

      return {
        success: true,
        portfolioId,
        entriesInvalidated: invalidated
      };
    } catch (error) {
      logger.error('Cache invalidation failed', { portfolioId, error: error.message });
      throw error;
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    const cacheStats = pdfCache.getStats();
    const poolStats = browserPool.getStats();

    return {
      cache: cacheStats,
      browserPool: poolStats,
      optimization: {
        fastMode: process.env.PDF_FAST_MODE === 'true',
        maxTimeout: process.env.PDF_MAX_TIMEOUT || '10000',
        browserPoolSize: process.env.PDF_BROWSER_POOL_SIZE || '3'
      }
    };
  }

  /**
   * Warm up the system for better performance
   * @returns {Promise<void>}
   */
  async warmUp() {
    logger.service('PDFExportService', 'warmUp', {});

    try {
      // Warm up browser pool
      await browserPool.warmUp();

      // Optionally warm cache with popular portfolios
      const recentPortfolios = await pdfRepository.getRecentlyUpdatedPortfolios(5);
      logger.info('System warmed up', {
        recentPortfoliosCount: recentPortfolios.length
      });
    } catch (error) {
      logger.error('Warm up failed', { error: error.message });
    }
  }
}

// Export singleton instance
const pdfExportService = new PDFExportService();
export default pdfExportService;
