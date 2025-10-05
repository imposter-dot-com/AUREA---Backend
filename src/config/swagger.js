import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.aurea.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
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
    join(__dirname, '../controllers/*.js'),
    join(__dirname, '../../swagger.yaml'),
  ],
};

// Generate Swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
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

/**
 * Setup Swagger documentation middleware
 * @param {Express} app - Express application instance
 */
export const setupSwagger = (app) => {
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
      const yamlFile = readFileSync(join(__dirname, '../swagger.yaml'), 'utf8');
      res.setHeader('Content-Type', 'application/x-yaml');
      res.send(yamlFile);
    } catch (error) {
      res.status(500).json({ error: 'Could not load YAML specification' });
    }
  });

  console.log('📖 Swagger UI available at: /api-docs');
  console.log('📄 OpenAPI JSON spec at: /api-docs.json');
  console.log('📄 OpenAPI YAML spec at: /api-docs.yaml');
};

export default swaggerSpec;