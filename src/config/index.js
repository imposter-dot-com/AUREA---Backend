/**
 * Centralized Configuration
 * Single source of truth for all application configuration
 *
 * IMPORTANT: This config uses lazy evaluation via getters to avoid reading process.env
 * before dotenv.config() runs. Each property is a getter that reads env vars
 * only when accessed, ensuring dotenv has already populated process.env.
 */

import { getEnv, getEnvInt, getEnvBool, isDevelopment, isProduction } from './envValidator.js';

/**
 * Application Configuration with lazy evaluation
 * All properties use getters to delay env var reading until access time
 */
export const config = {
  get app() {
    return {
      name: 'AUREA Backend',
      version: '1.0.0',
      env: getEnv('NODE_ENV', 'development'),
      port: getEnvInt('PORT', 5000),
      isDevelopment: isDevelopment(),
      isProduction: isProduction()
    };
  },

  get database() {
    return {
      uri: getEnv('MONGO_URI'),
      options: {
        retryWrites: true,
        w: 'majority'
      }
    };
  },

  get auth() {
    return {
      jwtSecret: getEnv('JWT_SECRET'),
      jwtExpiration: '30d',
      bcryptRounds: 12
    };
  },

  get cors() {
    return {
      origins: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://aurea-frontend.vercel.app',
        'https://www.aurea.tools',
        getEnv('FRONTEND_URL')
      ].filter(Boolean),
      credentials: true,
      maxAge: 86400
    };
  },

  get cloudinary() {
    return {
      cloudName: getEnv('CLOUDINARY_CLOUD_NAME'),
      apiKey: getEnv('CLOUDINARY_API_KEY'),
      apiSecret: getEnv('CLOUDINARY_API_SECRET')
    };
  },

  get redis() {
    return {
      url: getEnv('REDIS_URL'),
      enabled: !!getEnv('REDIS_URL')
    };
  },

  get vercel() {
    return {
      token: getEnv('VERCEL_TOKEN'),
      orgId: getEnv('VERCEL_ORG_ID'),
      projectId: getEnv('VERCEL_PROJECT_ID'),
      enabled: !!(getEnv('VERCEL_TOKEN') && getEnv('VERCEL_ORG_ID') && getEnv('VERCEL_PROJECT_ID'))
    };
  },

  get gemini() {
    return {
      apiKey: getEnv('GEMINI_API_KEY'),
      enabled: !!getEnv('GEMINI_API_KEY')
    };
  },

  get logging() {
    return {
      level: getEnv('LOG_LEVEL', 'info').toLowerCase(),
      prettyPrint: isDevelopment()
    };
  },

  get rateLimit() {
    return {
      general: {
        windowMs: 60 * 1000,
        max: 100
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      upload: {
        windowMs: 60 * 1000,
        max: 20
      },
      slugCheck: {
        windowMs: 60 * 1000,
        max: 10
      },
      publish: {
        windowMs: 60 * 1000,
        max: 5
      }
    };
  },

  get upload() {
    return {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      tempDir: 'uploads/'
    };
  },

  get pdf() {
    return {
      outputDir: 'uploads/pdfs/',
      maxConcurrent: 3,
      timeout: 60000
    };
  },

  get subdomain() {
    return {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/,
      generatedFilesDir: 'generated-files/'
    };
  },

  get pagination() {
    return {
      defaultLimit: 10,
      maxLimit: 100
    };
  },

  get frontend() {
    return {
      url: getEnv('FRONTEND_URL', 'http://localhost:5173')
    };
  }
};

export default config;
