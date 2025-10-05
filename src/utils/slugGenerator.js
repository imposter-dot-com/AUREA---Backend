import Portfolio from '../models/Portfolio.js';

// Reserved slugs that cannot be used
const reservedSlugs = [
  'admin', 'api', 'dashboard', 'login', 'signup', 'about', 'contact', 
  'terms', 'privacy', 'help', 'support', 'blog', 'docs', 'new', 
  'create', 'templates', 'events', 'profile', 'settings'
];

// Slug validation regex
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Generate a slug from title
 * @param {string} title - The title to convert to slug
 * @returns {string} - Generated slug
 */
const generateSlugFromTitle = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
};

/**
 * Check if a slug is valid format
 * @param {string} slug - The slug to validate
 * @returns {object} - Validation result
 */
const validateSlugFormat = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return {
      isValid: false,
      error: 'Slug is required and must be a string'
    };
  }

  if (slug.length < 3 || slug.length > 50) {
    return {
      isValid: false,
      error: 'Slug must be between 3 and 50 characters'
    };
  }

  if (!slugRegex.test(slug)) {
    return {
      isValid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)'
    };
  }

  if (reservedSlugs.includes(slug.toLowerCase())) {
    return {
      isValid: false,
      error: 'This slug is reserved and cannot be used'
    };
  }

  return { isValid: true };
};

/**
 * Check if a slug is available (not taken by another portfolio)
 * @param {string} slug - The slug to check
 * @param {string} excludePortfolioId - Portfolio ID to exclude from check (for updates)
 * @returns {Promise<object>} - Availability result
 */
const checkSlugAvailability = async (slug, excludePortfolioId = null) => {
  try {
    // First validate format
    const formatValidation = validateSlugFormat(slug);
    if (!formatValidation.isValid) {
      return {
        isAvailable: false,
        error: formatValidation.error,
        code: 'INVALID_SLUG'
      };
    }

    // Check if slug exists in database
    const query = { slug: slug.toLowerCase() };
    if (excludePortfolioId) {
      query._id = { $ne: excludePortfolioId };
    }

    const existingPortfolio = await Portfolio.findOne(query);

    if (existingPortfolio) {
      return {
        isAvailable: false,
        error: 'This slug is already taken',
        code: 'SLUG_TAKEN',
        suggestions: await generateSlugSuggestions(slug)
      };
    }

    return {
      isAvailable: true,
      slug: slug.toLowerCase()
    };
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return {
      isAvailable: false,
      error: 'Error checking slug availability',
      code: 'SERVER_ERROR'
    };
  }
};

/**
 * Generate slug suggestions when the desired slug is taken
 * @param {string} baseSlug - The base slug to generate variations from
 * @returns {Promise<string[]>} - Array of suggested slugs
 */
const generateSlugSuggestions = async (baseSlug) => {
  const suggestions = [];
  const currentYear = new Date().getFullYear();

  try {
    // Suggestion 1: Add current year
    const yearSlug = `${baseSlug}-${currentYear}`;
    const yearCheck = await Portfolio.findOne({ slug: yearSlug });
    if (!yearCheck && !reservedSlugs.includes(yearSlug)) {
      suggestions.push(yearSlug);
    }

    // Suggestion 2: Add incremental numbers
    for (let i = 1; i <= 3; i++) {
      const numberedSlug = `${baseSlug}-${i}`;
      const numberCheck = await Portfolio.findOne({ slug: numberedSlug });
      if (!numberCheck && !reservedSlugs.includes(numberedSlug)) {
        suggestions.push(numberedSlug);
      }
    }

    // Suggestion 3: Add common suffixes
    const suffixes = ['portfolio', 'work', 'site'];
    for (const suffix of suffixes) {
      const suffixSlug = `${baseSlug}-${suffix}`;
      const suffixCheck = await Portfolio.findOne({ slug: suffixSlug });
      if (!suffixCheck && !reservedSlugs.includes(suffixSlug)) {
        suggestions.push(suffixSlug);
        break; // Only add one suffix suggestion
      }
    }

    // Return up to 3 suggestions
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error('Error generating slug suggestions:', error);
    return [];
  }
};

/**
 * Generate a unique slug from title
 * @param {string} title - The title to convert to slug
 * @param {string} excludePortfolioId - Portfolio ID to exclude from uniqueness check
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (title, excludePortfolioId = null) => {
  let baseSlug = generateSlugFromTitle(title);
  
  if (!baseSlug) {
    baseSlug = 'portfolio';
  }

  // Check if base slug is available
  const availability = await checkSlugAvailability(baseSlug, excludePortfolioId);
  
  if (availability.isAvailable) {
    return baseSlug;
  }

  // If not available, try suggestions
  const suggestions = await generateSlugSuggestions(baseSlug);
  
  if (suggestions.length > 0) {
    return suggestions[0];
  }

  // Fallback: add timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

export {
  generateSlugFromTitle,
  validateSlugFormat,
  checkSlugAvailability,
  generateSlugSuggestions,
  generateUniqueSlug,
  reservedSlugs,
  slugRegex
};