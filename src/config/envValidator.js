/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 * Fails fast if critical configuration is missing
 */

/**
 * Required environment variables with validation rules
 */
const ENV_SCHEMA = {
  // Application
  NODE_ENV: {
    required: true,
    default: 'development',
    validate: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, production, test'
  },
  PORT: {
    required: false,
    default: '5000',
    validate: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'PORT must be a positive number'
  },

  // Database
  MONGO_URI: {
    required: true,
    validate: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
    errorMessage: 'MONGO_URI must be a valid MongoDB connection string'
  },

  // Authentication
  JWT_SECRET: {
    required: true,
    validate: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long'
  },

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    errorMessage: 'CLOUDINARY_CLOUD_NAME is required for image uploads'
  },
  CLOUDINARY_API_KEY: {
    required: true,
    errorMessage: 'CLOUDINARY_API_KEY is required for image uploads'
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    errorMessage: 'CLOUDINARY_API_SECRET is required for image uploads'
  },

  // Frontend URL (for CORS)
  FRONTEND_URL: {
    required: true,
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'FRONTEND_URL must be a valid URL'
  },

  // Optional but validated if present
  REDIS_URL: {
    required: false,
    validate: (value) => !value || value.startsWith('redis://'),
    errorMessage: 'REDIS_URL must be a valid Redis connection string if provided'
  },
  VERCEL_TOKEN: {
    required: false
  },
  VERCEL_ORG_ID: {
    required: false
  },
  VERCEL_PROJECT_ID: {
    required: false
  },
  GEMINI_API_KEY: {
    required: false
  },
  LOG_LEVEL: {
    required: false,
    default: 'info',
    validate: (value) => !value || ['error', 'warn', 'info', 'debug'].includes(value.toLowerCase()),
    errorMessage: 'LOG_LEVEL must be one of: error, warn, info, debug'
  }
};

/**
 * Validation error class
 */
class EnvValidationError extends Error {
  constructor(errors) {
    const message = `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    super(message);
    this.name = 'EnvValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(key, schema) {
  const value = process.env[key];
  const errors = [];

  // Check if required
  if (schema.required && !value) {
    errors.push(schema.errorMessage || `${key} is required but not set`);
    return errors;
  }

  // Apply default if not set
  if (!value && schema.default) {
    process.env[key] = schema.default;
    return errors;
  }

  // Run custom validation if value exists
  if (value && schema.validate) {
    try {
      const isValid = schema.validate(value);
      if (!isValid) {
        errors.push(schema.errorMessage || `${key} validation failed`);
      }
    } catch (error) {
      errors.push(`${key} validation error: ${error.message}`);
    }
  }

  return errors;
}

/**
 * Validate all environment variables
 * @throws {EnvValidationError} If validation fails
 */
export function validateEnv() {
  const errors = [];

  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const keyErrors = validateEnvVar(key, schema);
    errors.push(...keyErrors);
  }

  // Check for placeholder values (common mistake)
  const placeholders = ['<password>', 'your-secret', 'your-token', 'change-me'];
  for (const [key, value] of Object.entries(process.env)) {
    if (value && placeholders.some(p => value.includes(p))) {
      errors.push(`${key} contains placeholder value: "${value}"`);
    }
  }

  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get validated environment variable
 * @param {string} key - Environment variable name
 * @param {*} defaultValue - Default value if not set
 * @returns {string} Environment variable value
 */
export function getEnv(key, defaultValue = undefined) {
  return process.env[key] || defaultValue;
}

/**
 * Get environment variable as integer
 */
export function getEnvInt(key, defaultValue = 0) {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Get environment variable as boolean
 */
export function getEnvBool(key, defaultValue = false) {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Check if running in production
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest() {
  return process.env.NODE_ENV === 'test';
}

export default validateEnv;
