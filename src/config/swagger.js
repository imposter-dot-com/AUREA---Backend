import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../infrastructure/logging/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only import and generate swagger if NOT in production
let swaggerJSDoc, swaggerUi, swaggerSpec, swaggerUiOptions;

if (process.env.NODE_ENV !== 'production') {
  // Dynamic import for development only
  const swaggerJSDocModule = await import('swagger-jsdoc');
  const swaggerUiModule = await import('swagger-ui-express');
  
  swaggerJSDoc = swaggerJSDocModule.default;
  swaggerUi = swaggerUiModule.default;

  // Swagger configuration options
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'AUREA Backend API',
        version: '1.0.0',
        description: 'Portfolio Builder Platform API with MongoDB Atlas integration',
        contact: {
          name: 'AUREA Team',
          email: 'support@aurea.com',
        },
        license: {
          name: 'ISC',
        },
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: [
      join(__dirname, '../routes/authRoutes.js'),
      join(__dirname, '../routes/portfolioRoutes.js'),
      join(__dirname, '../routes/caseStudyRoutes.js'),
      join(__dirname, '../routes/uploadRoutes.js'),
      join(__dirname, '../routes/proposalExtract.routes.js'),
      join(__dirname, '../routes/pdfRoutes.js'),
      join(__dirname, '../controllers/*.js'),
      join(__dirname, '../../swagger.yaml'),
    ],
  };

  // Generate Swagger specification
  swaggerSpec = swaggerJSDoc(swaggerOptions);

  // Swagger UI options
  swaggerUiOptions = {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
    `,
    customSiteTitle: 'AUREA API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'tag',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  };
}

/**
 * Setup Swagger documentation middleware
 * @param {Express} app - Express application instance
 */
export const setupSwagger = (app) => {
  // Disable Swagger in production for security
  if (process.env.NODE_ENV === 'production') {
    logger.info('Swagger documentation disabled in production');
    
    // Block ALL swagger-related routes in production
    const blockSwagger = (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Not Found'
      });
    };
    
    app.get('/api-docs*', blockSwagger);
    app.use('/api-docs', blockSwagger);
    app.get('/api-docs.json', blockSwagger);
    app.get('/api-docs.yaml', blockSwagger);
    
    return;
  }

  // Only enable Swagger in development/staging
  logger.info('Setting up Swagger documentation...');
  
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve raw OpenAPI spec as YAML
  app.get('/api-docs.yaml', (req, res) => {
    try {
      const yamlFile = readFileSync(join(__dirname, '../../swagger.yaml'), 'utf8');
      res.setHeader('Content-Type', 'application/x-yaml');
      res.send(yamlFile);
    } catch (error) {
      res.status(500).json({ error: 'Could not load YAML specification' });
    }
  });

  logger.info('Swagger UI available at: /api-docs');
  logger.info('OpenAPI JSON spec at: /api-docs.json');
  logger.info('OpenAPI YAML spec at: /api-docs.yaml');
};

export default swaggerSpec;