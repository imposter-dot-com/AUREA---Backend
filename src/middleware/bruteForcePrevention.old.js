/**
 * Brute Force Prevention Middleware
 * Implements progressive delays and blocking for repeated failed attempts
 */

import ExpressBrute from 'express-brute';
import { redisClient } from '../utils/cache.js';

// Store for brute force protection
// Try to use Redis if available, otherwise use memory store
let store;

if (redisClient && redisClient.isOpen) {
  // Redis store for distributed brute force protection
  const RedisStore = ExpressBrute.MemoryStore; // Fallback

  try {
    // Custom Redis store implementation
    class CustomRedisStore {
      constructor(client) {
        this.client = client;
        this.prefix = 'brute:';
      }

      async get(key, callback) {
        try {
          const data = await this.client.get(this.prefix + key);
          if (data) {
            callback(null, JSON.parse(data));
          } else {
            callback(null, null);
          }
        } catch (error) {
          callback(error);
        }
      }

      async set(key, value, lifetime, callback) {
        try {
          await this.client.setEx(
            this.prefix + key,
            Math.ceil(lifetime / 1000), // Convert ms to seconds
            JSON.stringify(value)
          );
          callback(null);
        } catch (error) {
          callback(error);
        }
      }

      async reset(key, callback) {
        try {
          await this.client.del(this.prefix + key);
          callback(null);
        } catch (error) {
          callback(error);
        }
      }
    }

    store = new CustomRedisStore(redisClient);
    console.log('✅ Brute force protection using Redis store');
  } catch (error) {
    console.warn('⚠️  Redis store failed, using memory store:', error.message);
    store = new ExpressBrute.MemoryStore();
  }
} else {
  // Fallback to memory store
  store = new ExpressBrute.MemoryStore();
  console.log('ℹ️  Brute force protection using memory store');
}

// Configure brute force protection with progressive delays
const bruteForceConfig = {
  freeRetries: 5, // Allow 5 free attempts
  minWait: 1000, // 1 second minimum wait
  maxWait: 15 * 60 * 1000, // 15 minutes maximum wait
  lifetime: 60 * 60, // 1 hour window
  failCallback: function (req, res, next, nextValidRequestDate) {
    const retryAfter = Math.ceil((nextValidRequestDate.getTime() - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: retryAfter,
      retryAt: nextValidRequestDate.toISOString()
    });
  },
  // Custom key generator (IP + identifier)
  attachResetToRequest: true // Adds req.brute.reset() method
};

// Create different brute force limiters for different scenarios

// 1. Login attempts - stricter
const loginBruteForce = new ExpressBrute(store, {
  ...bruteForceConfig,
  freeRetries: 5, // 5 free login attempts
  minWait: 2 * 1000, // 2 seconds
  maxWait: 30 * 60 * 1000, // 30 minutes max
  lifetime: 60 * 60 * 2 // 2 hour window
});

// 2. Signup attempts - moderate
const signupBruteForce = new ExpressBrute(store, {
  ...bruteForceConfig,
  freeRetries: 3, // 3 free signup attempts
  minWait: 5 * 1000, // 5 seconds
  maxWait: 60 * 60 * 1000, // 1 hour max
  lifetime: 60 * 60 * 24 // 24 hour window
});

// 3. Password reset - strictest
const passwordResetBruteForce = new ExpressBrute(store, {
  ...bruteForceConfig,
  freeRetries: 3, // 3 free attempts
  minWait: 10 * 1000, // 10 seconds
  maxWait: 60 * 60 * 1000, // 1 hour max
  lifetime: 60 * 60 * 24 // 24 hour window
});

// 4. General API - lenient
const apiBruteForce = new ExpressBrute(store, {
  ...bruteForceConfig,
  freeRetries: 10, // 10 free attempts
  minWait: 500, // 500ms
  maxWait: 5 * 60 * 1000, // 5 minutes max
  lifetime: 60 * 60 // 1 hour window
});

/**
 * Get brute force middleware for login endpoints
 * Keys by IP address + email for failed login attempts
 */
export const loginBruteForceProtection = loginBruteForce.getMiddleware({
  key: function (req, res, next) {
    // Use email from request body as part of the key
    const email = req.body?.email || req.body?.username || 'unknown';
    next(`login:${req.ip}:${email}`);
  },
  ignoreIP: false
});

/**
 * Get brute force middleware for signup endpoints
 * Keys by IP address only
 */
export const signupBruteForceProtection = signupBruteForce.getMiddleware({
  key: function (req, res, next) {
    next(`signup:${req.ip}`);
  }
});

/**
 * Get brute force middleware for password reset endpoints
 * Keys by IP address + email
 */
export const passwordResetBruteForceProtection = passwordResetBruteForce.getMiddleware({
  key: function (req, res, next) {
    const email = req.body?.email || 'unknown';
    next(`password-reset:${req.ip}:${email}`);
  }
});

/**
 * Get brute force middleware for general API endpoints
 * Keys by IP address
 */
export const apiBruteForceProtection = apiBruteForce.getMiddleware({
  key: function (req, res, next) {
    next(`api:${req.ip}`);
  }
});

/**
 * Reset brute force counter for successful operations
 * Call this after successful login/signup
 */
export const resetBruteForce = (req) => {
  if (req.brute && req.brute.reset) {
    req.brute.reset();
  }
};

// Export all protection middleware
export default {
  loginBruteForceProtection,
  signupBruteForceProtection,
  passwordResetBruteForceProtection,
  apiBruteForceProtection,
  resetBruteForce
};
