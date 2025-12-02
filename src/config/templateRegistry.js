/**
 * Template Registry
 *
 * Central registry for all portfolio templates with their configuration.
 * This enables a plugin architecture where new templates can be easily added.
 *
 * Each template configuration includes:
 * - id: Unique template identifier
 * - name: Display name
 * - previewUrl: Frontend URL for Puppeteer to capture
 * - category: Template category (swiss, creative, modern, etc.)
 * - pdfSettings: PDF-specific configuration
 */

import { getEnv } from './envValidator.js';
import logger from '../infrastructure/logging/Logger.js';

// Base frontend URL (configurable via environment)
const FRONTEND_BASE_URL = getEnv('FRONTEND_URL', 'http://localhost:5173');

/**
 * Template configurations
 */
export const TEMPLATES = {
  echolon: {
    id: 'echolon',
    name: 'Echelon',
    description: 'Swiss/International Typographic Style - clean, precise, grid-driven design',
    category: 'swiss',
    previewUrl: `${FRONTEND_BASE_URL}/template-preview/echelon`,
    caseStudyUrl: `${FRONTEND_BASE_URL}/template-preview/echelon/case-study`,
    hasCaseStudySupport: true, // Echelon has case study page support
    pdfSettings: {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    },
    puppeteerSettings: {
      viewport: {
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      },
      waitForSelectors: [
        'h1',
        'h2',
        '.section',
        'section',
        'main',
        '[class*="hero"]',
        '[class*="about"]'
      ],
      scrollDelay: 300, // Delay between scroll steps (ms)
      fontLoadDelay: 800 // Wait time for custom fonts (ms) - reduced for speed
    }
  },

  serene: {
    id: 'serene',
    name: 'Serene',
    description: 'Botanical and elegant portfolio template with soft, organic design',
    category: 'creative',
    previewUrl: `${FRONTEND_BASE_URL}/template-preview/serene`,
    caseStudyUrl: `${FRONTEND_BASE_URL}/template-preview/serene/case-study`,
    hasCaseStudySupport: true, // Enabled - falls back to templateConvert.js
    pdfSettings: {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    },
    puppeteerSettings: {
      viewport: {
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      },
      waitForSelectors: [
        'h1',
        'h2',
        '.section',
        'section',
        'main',
        '[class*="hero"]',
        '[class*="about"]'
      ],
      scrollDelay: 300,
      fontLoadDelay: 800 // Reduced for speed
    }
  },

  chic: {
    id: 'chic',
    name: 'Chic',
    description: 'Editorial/Magazine-inspired portfolio with sophisticated typography',
    category: 'modern',
    previewUrl: `${FRONTEND_BASE_URL}/template-preview/chic`,
    caseStudyUrl: `${FRONTEND_BASE_URL}/template-preview/chic/case-study`,
    hasCaseStudySupport: true, // Enabled - falls back to templateConvert.js
    pdfSettings: {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    },
    puppeteerSettings: {
      viewport: {
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      },
      waitForSelectors: [
        'h1',
        'h2',
        '.section',
        'section',
        'main',
        '[class*="hero"]',
        '[class*="about"]'
      ],
      scrollDelay: 300,
      fontLoadDelay: 800 // Reduced for speed
    }
  },

  boldfolio: {
    id: 'boldfolio',
    name: 'BoldFolio',
    description: 'Bold statement design with impactful visuals and strong typography',
    category: 'creative',
    previewUrl: `${FRONTEND_BASE_URL}/template-preview/boldfolio`,
    caseStudyUrl: `${FRONTEND_BASE_URL}/template-preview/boldfolio/case-study`,
    hasCaseStudySupport: true, // Enabled - falls back to templateConvert.js
    pdfSettings: {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    },
    puppeteerSettings: {
      viewport: {
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      },
      waitForSelectors: [
        'h1',
        'h2',
        '.section',
        'section',
        'main',
        '[class*="hero"]',
        '[class*="about"]'
      ],
      scrollDelay: 300,
      fontLoadDelay: 800 // Reduced for speed
    }
  }
};

/**
 * Default template (fallback when template not specified)
 */
export const DEFAULT_TEMPLATE_ID = 'echolon';

/**
 * Legacy template ID mappings for backwards compatibility
 */
export const LEGACY_TEMPLATE_MAP = {
  'minimal-designer': 'echolon',
  'minimal': 'echolon',
  'designer': 'echolon',
  'swiss': 'echolon',
  'echelon': 'echolon', // Handle correct spelling
  'botanical': 'serene',
  'creative': 'serene',
  'editorial': 'chic',
  'magazine': 'chic',
  'bold': 'boldfolio',
  'statement': 'boldfolio'
};

/**
 * Get template configuration by ID
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template configuration or null if not found
 */
export function getTemplate(templateId) {
  if (!templateId) {
    return TEMPLATES[DEFAULT_TEMPLATE_ID];
  }

  // Normalize template ID (handle legacy IDs)
  const normalizedId = LEGACY_TEMPLATE_MAP[templateId] || templateId;

  return TEMPLATES[normalizedId] || null;
}

/**
 * Check if template exists
 * @param {string} templateId - Template identifier
 * @returns {boolean} True if template exists
 */
export function templateExists(templateId) {
  const normalizedId = LEGACY_TEMPLATE_MAP[templateId] || templateId;
  return normalizedId in TEMPLATES;
}

/**
 * Get all available templates
 * @returns {Array} Array of template configurations
 */
export function getAllTemplates() {
  return Object.values(TEMPLATES);
}

/**
 * Get template categories
 * @returns {Array} Array of unique categories
 */
export function getTemplateCategories() {
  const categories = new Set();
  Object.values(TEMPLATES).forEach(template => {
    categories.add(template.category);
  });
  return Array.from(categories);
}

/**
 * Get templates by category
 * @param {string} category - Category name
 * @returns {Array} Array of templates in the category
 */
export function getTemplatesByCategory(category) {
  return Object.values(TEMPLATES).filter(
    template => template.category === category
  );
}

/**
 * Register a new template (for future dynamic template loading)
 * @param {Object} templateConfig - Template configuration
 * @returns {boolean} True if successfully registered
 */
export function registerTemplate(templateConfig) {
  if (!templateConfig.id) {
    logger.error('Template registration failed: id is required');
    return false;
  }

  if (TEMPLATES[templateConfig.id]) {
    logger.warn(`Template ${templateConfig.id} already exists, overwriting...`);
  }

  TEMPLATES[templateConfig.id] = {
    ...templateConfig,
    previewUrl: templateConfig.previewUrl || `${FRONTEND_BASE_URL}/template-preview/${templateConfig.id}`
  };

  return true;
}

export default {
  TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  LEGACY_TEMPLATE_MAP,
  getTemplate,
  templateExists,
  getAllTemplates,
  getTemplateCategories,
  getTemplatesByCategory,
  registerTemplate
};
