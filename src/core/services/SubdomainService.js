import siteRepository from '../repositories/SiteRepository.js';
import logger from '../../infrastructure/logging/Logger.js';
import { ValidationError, ConflictError } from '../../shared/exceptions/index.js';
import { validateSubdomain, isReservedSubdomain, generateSubdomainSuggestions } from '../../utils/subdomainValidator.js';

/**
 * Service for subdomain generation and validation logic
 * Handles subdomain availability checking, format validation, and suggestions
 */
export class SubdomainService {

  constructor(siteRepo = siteRepository) {
    this.siteRepository = siteRepo;
  }

  /**
   * Generate subdomain from portfolio data
   * @param {Object} portfolio - Portfolio object
   * @param {Object} user - User object
   * @returns {Promise<string>} Generated subdomain
   */
  async generateFromPortfolio(portfolio, user) {
    logger.service('SubdomainService', 'generateFromPortfolio', {
      portfolioId: portfolio._id,
      userId: user._id
    });

    try {
      let designerName = null;

      // Try to extract designer name from portfolio about section
      if (portfolio.content?.about?.name) {
        designerName = portfolio.content.about.name;
      } else if (portfolio.sections?.about?.name) {
        designerName = portfolio.sections.about.name;
      } else if (portfolio.about?.name) {
        designerName = portfolio.about.name;
      }

      // If no designer name found, try user data as fallback
      if (!designerName) {
        designerName = user.username || user.name || user.email?.split('@')[0];
      }

      if (designerName) {
        // Clean the name for subdomain
        const cleanName = this.cleanSubdomainString(designerName);

        // Ensure minimum length
        if (cleanName.length >= 3) {
          logger.info('Subdomain generated from portfolio/user data', {
            subdomain: cleanName,
            source: 'designer_name'
          });
          return cleanName;
        }
      }

      // Final fallback to user ID
      const fallbackSubdomain = `user-${user._id || Date.now()}`;

      logger.warn('Using fallback subdomain generation', {
        subdomain: fallbackSubdomain,
        reason: 'no_valid_name_found'
      });

      return fallbackSubdomain;

    } catch (error) {
      logger.error('Error generating subdomain from portfolio', { error });
      return `user-${Date.now()}`;
    }
  }

  /**
   * Generate subdomain from user data only (legacy/fallback)
   * @param {Object} user - User object
   * @returns {string} Generated subdomain
   */
  generateFromUser(user) {
    logger.service('SubdomainService', 'generateFromUser', { userId: user._id });

    try {
      // Try to get a meaningful name from user data
      const username = user.username || user.name || user.email?.split('@')[0];

      if (username) {
        // Clean the username for subdomain
        const cleanName = this.cleanSubdomainString(username);

        // Ensure minimum length
        if (cleanName.length >= 3) {
          return cleanName;
        }
      }

      // Fallback to user ID if username not available
      return `user-${user._id || Date.now()}`;

    } catch (error) {
      logger.error('Error generating subdomain from user', { error });
      return `user-${Date.now()}`;
    }
  }

  /**
   * Clean string for use as subdomain
   * @param {string} str - String to clean
   * @returns {string} Cleaned subdomain string
   */
  cleanSubdomainString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '') // Remove special characters but keep underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/_+/g, '-') // Replace underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate subdomain format
   * @param {string} subdomain - Subdomain to validate
   * @returns {Object} Validation result { valid: boolean, error?: string }
   */
  validateFormat(subdomain) {
    logger.service('SubdomainService', 'validateFormat', { subdomain });

    const validation = validateSubdomain(subdomain);

    if (!validation.valid) {
      logger.warn('Subdomain validation failed', {
        subdomain,
        error: validation.error
      });
    }

    return validation;
  }

  /**
   * Check if subdomain is available for use
   * @param {string} subdomain - Subdomain to check
   * @param {string} userId - Current user ID
   * @param {string} portfolioId - Current portfolio ID (optional)
   * @returns {Promise<Object>} { available: boolean, reason?: string, conflictType?: string }
   */
  async checkAvailability(subdomain, userId, portfolioId = null) {
    logger.service('SubdomainService', 'checkAvailability', {
      subdomain,
      userId,
      portfolioId
    });

    // First validate format
    const formatValidation = this.validateFormat(subdomain);

    if (!formatValidation.valid) {
      return {
        available: false,
        reason: formatValidation.error,
        conflictType: 'invalid_format'
      };
    }

    // Check if subdomain is reserved
    if (isReservedSubdomain(subdomain)) {
      return {
        available: false,
        reason: 'This subdomain is reserved and cannot be used',
        conflictType: 'reserved'
      };
    }

    // Find existing site with this subdomain
    const existingSite = await this.siteRepository.findBySubdomain(subdomain);

    if (!existingSite) {
      // Subdomain is available
      logger.info('Subdomain is available', { subdomain });
      return { available: true };
    }

    // Check if it belongs to the current user's THIS portfolio
    const isSamePortfolio = portfolioId &&
      existingSite.portfolioId.toString() === portfolioId.toString();
    const isSameUser = existingSite.userId.toString() === userId.toString();

    if (isSameUser && isSamePortfolio) {
      // Same portfolio trying to keep/update subdomain
      logger.info('Subdomain belongs to same portfolio', { subdomain, portfolioId });
      return { available: true, reason: 'owned_by_same_portfolio' };
    }

    if (!isSameUser) {
      // Different user owns this subdomain
      logger.warn('Subdomain taken by different user', {
        subdomain,
        requestingUserId: userId,
        ownerUserId: existingSite.userId
      });

      return {
        available: false,
        reason: 'This subdomain is already taken by another user',
        conflictType: 'different_user'
      };
    }

    if (isSameUser && !isSamePortfolio) {
      // Same user but different portfolio owns this subdomain
      logger.warn('Subdomain used by another portfolio of same user', {
        subdomain,
        userId,
        existingPortfolioId: existingSite.portfolioId,
        requestingPortfolioId: portfolioId
      });

      return {
        available: false,
        reason: 'This subdomain is already used by another one of your portfolios',
        conflictType: 'different_portfolio_same_user'
      };
    }

    // Fallback: not available
    return {
      available: false,
      reason: 'Subdomain is not available',
      conflictType: 'unknown'
    };
  }

  /**
   * Generate subdomain suggestions based on a base string
   * @param {string} baseSubdomain - Base subdomain string
   * @param {number} count - Number of suggestions to generate
   * @returns {Promise<Array<string>>} Array of suggested subdomains
   */
  async suggestAlternatives(baseSubdomain, count = 5) {
    logger.service('SubdomainService', 'suggestAlternatives', { baseSubdomain, count });

    // Clean the base subdomain first
    const cleanBase = this.cleanSubdomainString(baseSubdomain);

    // Use utility function to generate suggestions
    const suggestions = generateSubdomainSuggestions(cleanBase);

    // Filter to ensure all suggestions are valid format
    const validSuggestions = suggestions
      .filter(s => {
        const validation = this.validateFormat(s);
        return validation.valid;
      })
      .slice(0, count);

    logger.info('Generated subdomain suggestions', {
      baseSubdomain: cleanBase,
      suggestionsCount: validSuggestions.length
    });

    return validSuggestions;
  }

  /**
   * Get suggestions when subdomain is taken
   * @param {string} subdomain - Requested subdomain that's taken
   * @param {Object} portfolio - Portfolio object (optional, for personalized suggestions)
   * @param {Object} user - User object (optional, for personalized suggestions)
   * @returns {Promise<Array<string>>} Array of available suggestions
   */
  async getSuggestionsWhenTaken(subdomain, portfolio = null, user = null) {
    logger.service('SubdomainService', 'getSuggestionsWhenTaken', { subdomain });

    const suggestions = [];

    // Add variations of the requested subdomain
    suggestions.push(`${subdomain}-portfolio`);
    suggestions.push(`${subdomain}-${new Date().getFullYear()}`);
    suggestions.push(`${subdomain}-site`);

    // If portfolio provided, try generating from portfolio data
    if (portfolio && user) {
      const portfolioGenerated = await this.generateFromPortfolio(portfolio, user);
      if (portfolioGenerated !== subdomain) {
        suggestions.push(portfolioGenerated);
      }
    }

    // If user provided, add user-based suggestions
    if (user) {
      if (user.name) {
        const nameClean = this.cleanSubdomainString(user.name);
        if (nameClean && nameClean !== subdomain) {
          suggestions.push(nameClean);
        }
      }
      if (user.username) {
        const usernameClean = this.cleanSubdomainString(user.username);
        if (usernameClean && usernameClean !== subdomain) {
          suggestions.push(usernameClean);
        }
      }
    }

    // Use utility to generate more variations
    const moreSuggestions = generateSubdomainSuggestions(subdomain);
    suggestions.push(...moreSuggestions);

    // Remove duplicates and filter valid
    const uniqueSuggestions = [...new Set(suggestions)];
    const validSuggestions = uniqueSuggestions.filter(s => {
      const validation = this.validateFormat(s);
      return validation.valid && s.length >= 3 && s.length <= 30;
    });

    // Check availability of top suggestions
    const availableSuggestions = [];

    for (const suggestion of validSuggestions.slice(0, 10)) {
      const available = await this.siteRepository.subdomainExists(suggestion);
      if (!available) {
        availableSuggestions.push(suggestion);
      }

      // Stop when we have enough
      if (availableSuggestions.length >= 5) {
        break;
      }
    }

    logger.info('Generated available subdomain suggestions', {
      originalSubdomain: subdomain,
      suggestionsCount: availableSuggestions.length
    });

    return availableSuggestions;
  }

  /**
   * Sanitize subdomain for safe use
   * @param {string} subdomain - Subdomain to sanitize
   * @returns {string} Sanitized subdomain
   */
  sanitizeSubdomain(subdomain) {
    logger.service('SubdomainService', 'sanitizeSubdomain', { subdomain });

    if (!subdomain || typeof subdomain !== 'string') {
      return '';
    }

    // Clean the subdomain
    const cleaned = this.cleanSubdomainString(subdomain);

    // Ensure it's within length limits
    let sanitized = cleaned;
    if (sanitized.length > 30) {
      sanitized = sanitized.substring(0, 30);
    }

    // Ensure minimum length
    if (sanitized.length < 3) {
      sanitized = `${sanitized}-portfolio`;
    }

    // Remove trailing/leading hyphens again after trimming
    sanitized = sanitized.replace(/^-|-$/g, '');

    return sanitized;
  }

  /**
   * Validate and sanitize subdomain with suggestions
   * @param {string} subdomain - Subdomain to process
   * @param {string} userId - User ID
   * @param {string} portfolioId - Portfolio ID (optional)
   * @returns {Promise<Object>} { valid: boolean, subdomain: string, suggestions?: Array }
   */
  async validateAndProcess(subdomain, userId, portfolioId = null) {
    logger.service('SubdomainService', 'validateAndProcess', {
      subdomain,
      userId,
      portfolioId
    });

    // Sanitize first
    const sanitized = this.sanitizeSubdomain(subdomain);

    // Validate format
    const formatValidation = this.validateFormat(sanitized);

    if (!formatValidation.valid) {
      const suggestions = await this.suggestAlternatives(subdomain);

      return {
        valid: false,
        error: formatValidation.error,
        suggestions
      };
    }

    // Check availability
    const availability = await this.checkAvailability(sanitized, userId, portfolioId);

    if (!availability.available) {
      const suggestions = await this.getSuggestionsWhenTaken(sanitized);

      return {
        valid: false,
        subdomain: sanitized,
        error: availability.reason,
        conflictType: availability.conflictType,
        suggestions
      };
    }

    // All good
    return {
      valid: true,
      subdomain: sanitized
    };
  }
}

export default new SubdomainService();
