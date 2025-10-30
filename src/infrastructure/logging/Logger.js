/**
 * Structured Logging System
 * Replaces console.log statements with structured, contextual logging
 * Integrates with existing log sanitization
 */

import { sanitizeError, sanitizeRequest } from '../../middleware/logSanitizer.js';

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Log Level Priority (for filtering)
 */
const LOG_LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Color codes for console output (development mode)
 */
const COLORS = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',    // Cyan
  debug: '\x1b[90m',   // Gray
  reset: '\x1b[0m'
};

/**
 * Emoji icons for different log levels
 */
const ICONS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍'
};

/**
 * Logger Class
 * Provides structured logging with context and automatic sanitization
 */
export class Logger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'AUREA-Backend';
    this.minLevel = options.minLevel || this.getMinLevelFromEnv();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Get minimum log level from environment
   */
  getMinLevelFromEnv() {
    const envLevel = process.env.LOG_LEVEL || 'info';
    return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const levelPriority = LOG_LEVEL_PRIORITY[level];
    const minPriority = LOG_LEVEL_PRIORITY[this.minLevel];
    return levelPriority <= minPriority;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const icon = ICONS[level];

    // Base log object
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      ...context
    };

    // Sanitize context if it contains sensitive data
    if (context.error) {
      logObject.error = sanitizeError(context.error);
    }
    if (context.req) {
      logObject.req = sanitizeRequest(context.req);
    }

    return { logObject, icon };
  }

  /**
   * Output log to console
   */
  output(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const { logObject, icon } = this.formatMessage(level, message, context);

    if (this.isDevelopment) {
      // Colorized console output for development
      const color = COLORS[level];
      const reset = COLORS.reset;

      console.log(
        `${color}${icon} [${logObject.level}]${reset} ${logObject.timestamp} - ${message}`
      );

      // Log context details if present
      if (Object.keys(context).length > 0) {
        console.log(`${color}Context:${reset}`, this.sanitizeContext(context));
      }
    } else {
      // JSON output for production (easier to parse by log aggregators)
      console.log(JSON.stringify(logObject));
    }
  }

  /**
   * Sanitize context object
   */
  sanitizeContext(context) {
    const sanitized = { ...context };

    // Remove circular references and sensitive data
    if (sanitized.req) {
      sanitized.req = {
        method: context.req.method,
        path: context.req.path,
        userId: context.req.user?.id
      };
    }

    if (sanitized.error) {
      sanitized.error = {
        name: context.error.name,
        message: context.error.message,
        code: context.error.code
      };
    }

    return sanitized;
  }

  /**
   * Log error message
   */
  error(message, context = {}) {
    this.output(LOG_LEVELS.ERROR, message, context);
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    this.output(LOG_LEVELS.WARN, message, context);
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    this.output(LOG_LEVELS.INFO, message, context);
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    this.output(LOG_LEVELS.DEBUG, message, context);
  }

  /**
   * Log HTTP request
   */
  request(req, res, duration) {
    const context = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (req.user) {
      context.userId = req.user.id || req.user._id;
    }

    this.info(`${req.method} ${req.path}`, context);
  }

  /**
   * Log database operation
   */
  database(operation, collection, context = {}) {
    this.debug(`Database ${operation}`, {
      collection,
      ...context
    });
  }

  /**
   * Log service operation
   */
  service(serviceName, operation, context = {}) {
    this.debug(`${serviceName}.${operation}`, context);
  }

  /**
   * Log authentication event
   */
  auth(event, userId, context = {}) {
    this.info(`Auth: ${event}`, {
      userId,
      ...context
    });
  }

  /**
   * Log external API call
   */
  externalApi(service, endpoint, status, duration, context = {}) {
    this.info(`External API: ${service}`, {
      endpoint,
      status,
      duration: `${duration}ms`,
      ...context
    });
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;

// Export factory for creating child loggers with specific context
export const createLogger = (options) => new Logger(options);
