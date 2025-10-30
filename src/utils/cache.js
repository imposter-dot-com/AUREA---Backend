import { createClient } from 'redis';
import logger from '../infrastructure/logging/Logger.js';

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  // Access environment variables directly to avoid circular dependency
  // Config module is imported too early in server.js before dotenv runs
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('Redis URL not provided, caching will be disabled');
    return null;
  }

  try {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err });
      redisClient = null;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error });
    redisClient = null;
    return null;
  }
};

// Get cached data
const getCache = async (key) => {
  if (!redisClient) return null;

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error', { error, key });
    return null;
  }
};

// Set cached data
const setCache = async (key, data, ttlSeconds = 300) => {
  if (!redisClient) return false;

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Cache set error', { error, key });
    return false;
  }
};

// Delete cached data
const deleteCache = async (key) => {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', { error, key });
    return false;
  }
};

// Delete multiple cached keys by pattern
const deleteCachePattern = async (pattern) => {
  if (!redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Cache delete pattern error', { error, pattern });
    return false;
  }
};

// Cache middleware for public portfolio views
const cachePublicPortfolio = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    const cacheKey = `portfolio:public:${req.params.slug}`;
    
    try {
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200 && data.success) {
          setCache(cacheKey, data, ttlSeconds);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error });
      next();
    }
  };
};

// Invalidate portfolio caches when portfolio is updated
const invalidatePortfolioCache = async (slug) => {
  if (!slug) return;

  try {
    // Delete specific portfolio cache
    await deleteCache(`portfolio:public:${slug}`);

    // Delete public portfolio list caches
    await deleteCachePattern('portfolios:public:*');

    logger.info('Cache invalidated for portfolio', { slug });
  } catch (error) {
    logger.error('Error invalidating portfolio cache', { error, slug });
  }
};

// Generate cache keys
const getCacheKeys = {
  publicPortfolio: (slug) => `portfolio:public:${slug}`,
  publicCaseStudy: (portfolioSlug, projectId) => `casestudy:public:${portfolioSlug}:${projectId}`,
  publicPortfolioList: (page = 1, limit = 10) => `portfolios:public:${page}:${limit}`,
  userPortfolios: (userId) => `portfolios:user:${userId}`
};

export {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  cachePublicPortfolio,
  invalidatePortfolioCache,
  getCacheKeys,
  redisClient
};