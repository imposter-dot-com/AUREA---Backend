/**
 * PDF Cache Service
 *
 * Caches generated PDFs to avoid regenerating identical content.
 * Uses in-memory cache with optional Redis support.
 *
 * Features:
 * - Content-based cache keys
 * - TTL-based expiration
 * - Memory limit management
 * - Cache statistics
 */

import crypto from 'crypto';
import logger from '../logging/Logger.js';

class PDFCache {
  constructor() {
    this.cache = new Map();
    this.enabled = process.env.PDF_CACHE_ENABLED !== 'false'; // Default enabled
    this.ttl = parseInt(process.env.PDF_CACHE_TTL || '300', 10) * 1000; // 5 minutes default
    this.maxSize = parseInt(process.env.PDF_CACHE_MAX_SIZE || '100', 10); // Max 100 PDFs in cache
    this.maxMemory = parseInt(process.env.PDF_CACHE_MAX_MEMORY || '500', 10) * 1024 * 1024; // 500MB default
    this.currentMemory = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      errors: 0
    };

    // Start cleanup interval
    if (this.enabled) {
      this.startCleanupInterval();
    }

    logger.info('PDF Cache initialized', {
      enabled: this.enabled,
      ttlSeconds: this.ttl / 1000,
      maxSize: this.maxSize,
      maxMemoryMB: this.maxMemory / (1024 * 1024)
    });
  }

  /**
   * Generate cache key from portfolio data and options
   */
  generateKey(portfolioId, templateId, options = {}) {
    const keyData = {
      portfolioId,
      templateId,
      pageType: options.pageType || 'portfolio',
      format: options.format || 'A4',
      landscape: options.landscape || false,
      includeCaseStudies: options.includeCaseStudies || false,
      // Add content hash if provided
      contentHash: options.contentHash || ''
    };

    const keyString = JSON.stringify(keyData);
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(portfolioData) {
    try {
      // Create hash from relevant portfolio data
      const relevantData = {
        title: portfolioData.title,
        content: portfolioData.content,
        styling: portfolioData.styling,
        updatedAt: portfolioData.updatedAt,
        caseStudiesCount: Object.keys(portfolioData.caseStudies || {}).length
      };

      return crypto.createHash('md5')
        .update(JSON.stringify(relevantData))
        .digest('hex');
    } catch (error) {
      logger.warn('Failed to generate content hash', { error: error.message });
      return '';
    }
  }

  /**
   * Get PDF from cache
   */
  async get(key) {
    if (!this.enabled) {
      this.stats.misses++;
      return null;
    }

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        logger.debug('Cache miss', { key });
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        this.stats.misses++;
        logger.debug('Cache expired', { key });
        return null;
      }

      this.stats.hits++;
      entry.lastAccessed = Date.now();
      entry.accessCount++;

      logger.info('Cache hit', {
        key,
        sizeKB: Math.round(entry.size / 1024),
        accessCount: entry.accessCount,
        ageSeconds: Math.round((Date.now() - entry.createdAt) / 1000)
      });

      return entry.data;
    } catch (error) {
      logger.error('Cache get error', { error: error.message, key });
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set PDF in cache
   */
  async set(key, pdfBuffer, metadata = {}) {
    if (!this.enabled) {
      return false;
    }

    try {
      const size = pdfBuffer.length;

      // Check memory limit
      if (this.currentMemory + size > this.maxMemory) {
        logger.warn('Cache memory limit reached, evicting old entries', {
          currentMB: Math.round(this.currentMemory / (1024 * 1024)),
          newSizeKB: Math.round(size / 1024),
          maxMB: Math.round(this.maxMemory / (1024 * 1024))
        });
        await this.evictOldEntries(size);
      }

      // Check size limit
      if (this.cache.size >= this.maxSize) {
        logger.warn('Cache size limit reached, evicting oldest entry');
        await this.evictOldest();
      }

      const entry = {
        data: pdfBuffer,
        size,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.ttl,
        lastAccessed: Date.now(),
        accessCount: 0,
        metadata: {
          portfolioId: metadata.portfolioId,
          templateId: metadata.templateId,
          filename: metadata.filename,
          ...metadata
        }
      };

      this.cache.set(key, entry);
      this.currentMemory += size;
      this.stats.sets++;

      logger.info('PDF cached', {
        key,
        sizeKB: Math.round(size / 1024),
        ttlSeconds: this.ttl / 1000,
        cacheSize: this.cache.size,
        totalMemoryMB: Math.round(this.currentMemory / (1024 * 1024))
      });

      return true;
    } catch (error) {
      logger.error('Cache set error', { error: error.message, key });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete entry from cache
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
      logger.debug('Cache entry deleted', { key });
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.currentMemory = 0;
    logger.info('Cache cleared', { entriesCleared: size });
  }

  /**
   * Invalidate cache for a specific portfolio
   */
  invalidatePortfolio(portfolioId) {
    let invalidated = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata && entry.metadata.portfolioId === portfolioId) {
        this.delete(key);
        invalidated++;
      }
    }
    logger.info('Portfolio cache invalidated', { portfolioId, entriesInvalidated: invalidated });
    return invalidated;
  }

  /**
   * Evict old entries to make space
   */
  async evictOldEntries(requiredSpace) {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      freedSpace += entry.size;
      this.delete(key);
      this.stats.evictions++;
    }

    logger.info('Evicted old entries', {
      freedSpaceKB: Math.round(freedSpace / 1024),
      requiredSpaceKB: Math.round(requiredSpace / 1024)
    });
  }

  /**
   * Evict oldest entry
   */
  async evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      logger.debug('Evicted oldest entry', { key: oldestKey });
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned expired entries', { count: cleaned });
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired().catch(error => {
        logger.error('Cleanup interval error', { error: error.message });
      });
    }, 60000);

    // Clean up on shutdown
    process.on('exit', () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsedMB: Math.round(this.currentMemory / (1024 * 1024)),
      maxMemoryMB: Math.round(this.maxMemory / (1024 * 1024)),
      enabled: this.enabled
    };
  }

  /**
   * Warm cache with frequently accessed PDFs
   */
  async warmCache(portfolios) {
    if (!this.enabled) return;

    logger.info('Warming PDF cache...', { count: portfolios.length });

    // This would be called with frequently accessed portfolios
    // Implementation would depend on your specific needs
  }

  /**
   * Check if cache has entry
   */
  has(key) {
    if (!this.enabled) return false;

    const entry = this.cache.get(key);
    if (entry && Date.now() <= entry.expiresAt) {
      return true;
    }
    return false;
  }

  /**
   * Get cache metadata for monitoring
   */
  getCacheMetadata() {
    const metadata = [];
    for (const [key, entry] of this.cache.entries()) {
      metadata.push({
        key,
        sizeKB: Math.round(entry.size / 1024),
        ageMinutes: Math.round((Date.now() - entry.createdAt) / 60000),
        accessCount: entry.accessCount,
        portfolioId: entry.metadata?.portfolioId,
        templateId: entry.metadata?.templateId
      });
    }
    return metadata;
  }
}

// Export singleton instance
const pdfCache = new PDFCache();

export default pdfCache;