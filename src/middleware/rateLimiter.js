import rateLimit from 'express-rate-limit';

// Generic rate limiter configuration
const createRateLimiter = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: keyGenerator || ((req) => {
      // Default to IP for anonymous routes, user ID for authenticated routes
      return req.user ? req.user._id.toString() : req.ip;
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// Slug check: 10/min per IP
const slugCheckLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many slug checks, please try again later',
  (req) => req.ip // Always use IP for slug checks
);

// Publish: 5/min per user
const publishLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5,
  'Too many publish requests, please try again later'
);

// Portfolio CRUD: 30/min per user
const portfolioCrudLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30,
  'Too many portfolio requests, please try again later'
);

// Image upload: 20/min per user
const uploadLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20,
  'Too many upload requests, please try again later'
);

// Public view: 100/min per IP
const publicViewLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100,
  'Too many requests, please try again later',
  (req) => req.ip // Always use IP for public views
);

// Case study CRUD: 25/min per user
const caseStudyCrudLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  25,
  'Too many case study requests, please try again later'
);

// General API limiter: 100/min per user/IP
const generalApiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100,
  'Too many requests, please try again later'
);

// Strict limiter for sensitive operations: 10/min per user
const strictLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many requests for this operation, please try again later'
);

export {
  createRateLimiter,
  slugCheckLimiter,
  publishLimiter,
  portfolioCrudLimiter,
  uploadLimiter,
  publicViewLimiter,
  caseStudyCrudLimiter,
  generalApiLimiter,
  strictLimiter
};