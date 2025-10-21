/**
 * Log Sanitization Middleware
 * Removes sensitive data from logs to prevent credential leakage
 */

// Patterns for sensitive data detection
const SENSITIVE_PATTERNS = {
  // Password fields
  password: /password|passwd|pwd/i,

  // Token fields
  token: /token|jwt|auth|bearer/i,

  // API keys
  apiKey: /api[_-]?key|apikey|api[_-]?secret/i,

  // Credit card numbers (13-19 digits with optional spaces/dashes)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Social Security Numbers (XXX-XX-XXXX)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Email addresses (for PII protection in logs)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (various formats)
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  // Private keys
  privateKey: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA )?PRIVATE KEY-----/g,

  // Bearer tokens in headers
  bearerToken: /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi,

  // MongoDB connection strings with credentials
  mongoUri: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi
};

/**
 * Sanitize sensitive data from any object
 * @param {any} data - Data to sanitize
 * @param {boolean} deep - Whether to deep sanitize nested objects
 * @returns {any} Sanitized data
 */
export const sanitize = (data, deep = true) => {
  if (!data) return data;

  // Handle different data types
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return deep ? data.map(item => sanitize(item, deep)) : data;
  }

  if (typeof data === 'object') {
    return sanitizeObject(data, deep);
  }

  return data;
};

/**
 * Sanitize strings by masking sensitive patterns
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  let sanitized = str;

  // Mask credit cards
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '****-****-****-****');

  // Mask SSNs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.ssn, '***-**-****');

  // Mask emails (keep domain for debugging)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  });

  // Mask phone numbers
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, '***-***-****');

  // Mask private keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.privateKey, '[PRIVATE_KEY_REDACTED]');

  // Mask bearer tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.bearerToken, 'Bearer [TOKEN_REDACTED]');

  // Mask MongoDB URIs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.mongoUri, 'mongodb://[CREDENTIALS_REDACTED]@');

  return sanitized;
};

/**
 * Sanitize objects by removing/masking sensitive fields
 * @param {object} obj - Object to sanitize
 * @param {boolean} deep - Whether to deep sanitize nested objects
 * @returns {object} Sanitized object
 */
const sanitizeObject = (obj, deep = true) => {
  if (!obj || typeof obj !== 'object') return obj;

  // Create a shallow copy to avoid modifying original
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (!sanitized.hasOwnProperty(key)) continue;

    const lowerKey = key.toLowerCase();
    const value = sanitized[key];

    // Check if key matches sensitive patterns
    if (SENSITIVE_PATTERNS.password.test(lowerKey)) {
      sanitized[key] = '[PASSWORD_REDACTED]';
      continue;
    }

    if (SENSITIVE_PATTERNS.token.test(lowerKey)) {
      sanitized[key] = '[TOKEN_REDACTED]';
      continue;
    }

    if (SENSITIVE_PATTERNS.apiKey.test(lowerKey)) {
      sanitized[key] = '[API_KEY_REDACTED]';
      continue;
    }

    // Special handling for common fields
    if (key === 'cookie' || key === 'Cookie') {
      sanitized[key] = '[COOKIE_REDACTED]';
      continue;
    }

    if (key === 'authorization' || key === 'Authorization') {
      sanitized[key] = '[AUTH_HEADER_REDACTED]';
      continue;
    }

    // Deep sanitization for nested objects
    if (deep && value && typeof value === 'object') {
      sanitized[key] = sanitize(value, deep);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    }
  }

  return sanitized;
};

/**
 * Sanitize HTTP request object for logging
 * @param {object} req - Express request object
 * @returns {object} Sanitized request data
 */
export const sanitizeRequest = (req) => {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    // Sanitize headers (remove auth, cookies, etc)
    headers: sanitizeObject({
      'content-type': req.get('Content-Type'),
      'accept': req.get('Accept'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    }, false),
    // Sanitize body
    body: sanitize(req.body),
    // Sanitize query params
    query: sanitize(req.query),
    // Sanitize params
    params: sanitize(req.params),
    // Add user ID if available (for audit trail)
    userId: req.user?._id?.toString() || null
  };
};

/**
 * Sanitize HTTP response for logging
 * @param {object} res - Express response object
 * @returns {object} Sanitized response data
 */
export const sanitizeResponse = (res) => {
  return {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage
  };
};

/**
 * Sanitize error for logging
 * @param {Error} error - Error object
 * @returns {object} Sanitized error data
 */
export const sanitizeError = (error) => {
  if (!error) return null;

  return {
    name: error.name,
    message: sanitizeString(error.message || 'Unknown error'),
    code: error.code,
    // Stack trace in development only, and sanitized
    stack: process.env.NODE_ENV === 'development'
      ? sanitizeString(error.stack || '')
      : undefined
  };
};

// Export all functions
export default {
  sanitize,
  sanitizeString,
  sanitizeObject,
  sanitizeRequest,
  sanitizeResponse,
  sanitizeError
};
