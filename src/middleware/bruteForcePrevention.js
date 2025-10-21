/**
 * Secure Brute Force Prevention Middleware
 * Custom implementation to replace vulnerable express-brute package
 * Implements progressive delays and blocking for repeated failed attempts
 */

import { redisClient } from '../utils/cache.js';

/**
 * Storage abstraction for brute force tracking
 */
class BruteForceStore {
  constructor(useRedis = false) {
    this.useRedis = useRedis && redisClient && redisClient.isOpen;
    this.memoryStore = new Map(); // Fallback in-memory store
    this.prefix = 'brute:';

    if (this.useRedis) {
      console.log('✅ Brute force protection using Redis store');
    } else {
      console.log('ℹ️  Brute force protection using memory store');
    }
  }

  /**
   * Get attempt data for a key
   */
  async get(key) {
    try {
      if (this.useRedis) {
        const data = await redisClient.get(this.prefix + key);
        return data ? JSON.parse(data) : null;
      } else {
        return this.memoryStore.get(key) || null;
      }
    } catch (error) {
      console.error('Error getting brute force data:', error);
      return null;
    }
  }

  /**
   * Set attempt data for a key
   */
  async set(key, value, lifetimeSeconds) {
    try {
      if (this.useRedis) {
        await redisClient.setEx(
          this.prefix + key,
          lifetimeSeconds,
          JSON.stringify(value)
        );
      } else {
        this.memoryStore.set(key, value);
        // Auto-expire from memory store
        setTimeout(() => {
          this.memoryStore.delete(key);
        }, lifetimeSeconds * 1000);
      }
    } catch (error) {
      console.error('Error setting brute force data:', error);
    }
  }

  /**
   * Reset/delete attempt data for a key
   */
  async reset(key) {
    try {
      if (this.useRedis) {
        await redisClient.del(this.prefix + key);
      } else {
        this.memoryStore.delete(key);
      }
    } catch (error) {
      console.error('Error resetting brute force data:', error);
    }
  }
}

// Initialize store
const store = new BruteForceStore(true);

/**
 * Brute Force Limiter Class
 */
class BruteForceLimiter {
  constructor(options = {}) {
    this.freeRetries = options.freeRetries || 5;
    this.minWait = options.minWait || 1000; // milliseconds
    this.maxWait = options.maxWait || 15 * 60 * 1000; // 15 minutes
    this.lifetime = options.lifetime || 60 * 60; // seconds (1 hour)
    this.failCallback = options.failCallback || this.defaultFailCallback;
  }

  /**
   * Default failure callback
   */
  defaultFailCallback(req, res, next, nextValidRequestDate) {
    const retryAfter = Math.ceil((nextValidRequestDate.getTime() - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: retryAfter,
      retryAt: nextValidRequestDate.toISOString()
    });
  }

  /**
   * Calculate wait time based on number of attempts
   * Uses exponential backoff
   */
  calculateWaitTime(attemptCount) {
    if (attemptCount <= this.freeRetries) {
      return 0;
    }

    const extraAttempts = attemptCount - this.freeRetries;
    // Exponential backoff: 2^n * minWait
    const waitTime = Math.pow(2, extraAttempts - 1) * this.minWait;

    return Math.min(waitTime, this.maxWait);
  }

  /**
   * Get middleware function
   */
  getMiddleware(options = {}) {
    const keyGenerator = options.key || ((req, res, next) => next(req.ip));

    return async (req, res, next) => {
      // Generate key for this request
      keyGenerator(req, res, async (key) => {
        try {
          const now = Date.now();
          const data = await store.get(key);

          let attemptCount = 1;
          let firstAttemptTime = now;
          let lastAttemptTime = now;

          if (data) {
            attemptCount = (data.count || 0) + 1;
            firstAttemptTime = data.firstAttemptTime || now;
            lastAttemptTime = data.lastAttemptTime || now;

            // Check if we're still within the lifetime window
            const elapsedSeconds = (now - firstAttemptTime) / 1000;
            if (elapsedSeconds > this.lifetime) {
              // Reset if outside lifetime window
              attemptCount = 1;
              firstAttemptTime = now;
            }
          }

          // Calculate required wait time
          const requiredWait = this.calculateWaitTime(attemptCount - 1);
          const timeSinceLastAttempt = now - lastAttemptTime;

          if (requiredWait > 0 && timeSinceLastAttempt < requiredWait) {
            // Still need to wait
            const nextValidRequestDate = new Date(lastAttemptTime + requiredWait);
            return this.failCallback(req, res, next, nextValidRequestDate);
          }

          // Store updated attempt data
          await store.set(key, {
            count: attemptCount,
            firstAttemptTime,
            lastAttemptTime: now
          }, this.lifetime);

          // Attach reset function to request
          req.brute = {
            reset: async () => {
              await store.reset(key);
            },
            key: key
          };

          next();
        } catch (error) {
          console.error('Brute force middleware error:', error);
          // On error, allow request through to prevent blocking legitimate users
          next();
        }
      });
    };
  }
}

// Configure different brute force limiters for different scenarios

// 1. Login attempts - stricter
const loginBruteForce = new BruteForceLimiter({
  freeRetries: 5, // 5 free login attempts
  minWait: 2 * 1000, // 2 seconds
  maxWait: 30 * 60 * 1000, // 30 minutes max
  lifetime: 60 * 60 * 2 // 2 hour window (in seconds)
});

// 2. Signup attempts - moderate
const signupBruteForce = new BruteForceLimiter({
  freeRetries: 3, // 3 free signup attempts
  minWait: 5 * 1000, // 5 seconds
  maxWait: 60 * 60 * 1000, // 1 hour max
  lifetime: 60 * 60 * 24 // 24 hour window
});

// 3. Password reset - strictest
const passwordResetBruteForce = new BruteForceLimiter({
  freeRetries: 3, // 3 free attempts
  minWait: 10 * 1000, // 10 seconds
  maxWait: 60 * 60 * 1000, // 1 hour max
  lifetime: 60 * 60 * 24 // 24 hour window
});

// 4. General API - lenient
const apiBruteForce = new BruteForceLimiter({
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
  }
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
  resetBruteForce,
  BruteForceLimiter // Export class for custom use cases
};
