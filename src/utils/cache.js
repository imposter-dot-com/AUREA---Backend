import { createClient } from 'redis';

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('Redis URL not provided, caching will be disabled');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    redisClient.on('disconnect', () => {
      console.log('❌ Redis client disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
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
    console.error('Cache get error:', error);
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
    console.error('Cache set error:', error);
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
    console.error('Cache delete error:', error);
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
    console.error('Cache delete pattern error:', error);
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
      console.error('Cache middleware error:', error);
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
    
    console.log(`Cache invalidated for portfolio: ${slug}`);
  } catch (error) {
    console.error('Error invalidating portfolio cache:', error);
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