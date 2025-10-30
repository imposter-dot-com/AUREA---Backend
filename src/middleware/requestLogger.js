import { sanitizeRequest, sanitizeResponse } from './logSanitizer.js';
import logger from '../infrastructure/logging/Logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // List of paths to ignore in logging (common browser requests)
  const ignorePaths = ['/favicon.ico', '/robots.txt', '/manifest.json', '/apple-touch-icon.png'];

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Skip logging for ignored paths (like favicon.ico)
    if (ignorePaths.includes(req.originalUrl)) {
      return;
    }

    // Sanitize request data before logging
    const sanitizedReq = sanitizeRequest(req);
    const sanitizedRes = sanitizeResponse(res);

    // Helper function to remove undefined/null values from object
    const removeUndefined = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
      );
    };

    const logData = {
      method: sanitizedReq.method,
      url: sanitizedReq.url,
      ip: sanitizedReq.ip,
      ...(sanitizedReq.userAgent && { userAgent: sanitizedReq.userAgent }),
      ...(Object.keys(removeUndefined(sanitizedReq.headers)).length > 0 && {
        headers: removeUndefined(sanitizedReq.headers)
      }),
      ...(sanitizedReq.body && Object.keys(sanitizedReq.body).length > 0 && { body: sanitizedReq.body }),
      ...(Object.keys(sanitizedReq.query).length > 0 && { query: sanitizedReq.query }),
      ...(Object.keys(sanitizedReq.params).length > 0 && { params: sanitizedReq.params }),
      ...(sanitizedReq.userId && { userId: sanitizedReq.userId }),
      statusCode: sanitizedRes.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    // Log suspicious activity with WARNING level
    if (res.statusCode >= 400) {
      // Don't log full request body for errors to avoid filling logs
      const errorLog = {
        method: logData.method,
        url: logData.url,
        ip: logData.ip,
        statusCode: logData.statusCode,
        duration: logData.duration,
        timestamp: logData.timestamp,
        ...(logData.userId && { userId: logData.userId })
      };
      logger.warn('Suspicious request', errorLog);
    } else if (process.env.NODE_ENV === 'development') {
      // Only log full details in development (excluding undefined values)
      logger.debug('Request completed', logData);
    }
    // In production, reduce logging to minimize log size
  });

  next();
};