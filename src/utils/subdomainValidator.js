/**
 * Subdomain Validation Utility
 * Provides validation logic for subdomain names including reserved word checking
 */

// ============================================
// RESERVED SUBDOMAINS
// ============================================
// These subdomains are reserved for system use and cannot be used by users
const RESERVED_SUBDOMAINS = [
  // System
  'www', 'api', 'app', 'admin', 'dashboard', 'console',

  // Authentication & User Management
  'auth', 'login', 'signup', 'register', 'logout', 'account',
  'user', 'users', 'profile', 'settings', 'preferences',

  // Communication
  'mail', 'email', 'smtp', 'imap', 'pop', 'webmail',
  'support', 'help', 'contact', 'feedback',

  // Infrastructure
  'ftp', 'sftp', 'ssh', 'git', 'cdn', 'static', 'assets',
  'files', 'media', 'images', 'uploads', 'downloads',

  // Legal & Info Pages
  'blog', 'docs', 'documentation', 'wiki', 'about', 'terms',
  'privacy', 'legal', 'dmca', 'tos', 'gdpr',

  // Marketing & Sales
  'shop', 'store', 'cart', 'checkout', 'payment', 'billing',
  'subscribe', 'newsletter', 'marketing', 'promo', 'sale',

  // Development & Testing
  'dev', 'development', 'test', 'testing', 'staging', 'demo',
  'sandbox', 'preview', 'beta', 'alpha',

  // Monitoring & Analytics
  'status', 'monitor', 'metrics', 'analytics', 'stats',
  'health', 'ping', 'uptime',

  // Security
  'security', 'ssl', 'tls', 'cert', 'certificate',

  // Social
  'social', 'community', 'forum', 'chat', 'discuss',

  // Platform-specific
  'aurea', 'portfolio', 'portfolios', 'site', 'sites',
  'subdomain', 'subdomains', 'host', 'hosting'
];

// ============================================
// VALIDATION RULES
// ============================================

/**
 * Validate subdomain format
 * Rules:
 * - Length: 3-30 characters
 * - Format: lowercase letters, numbers, hyphens
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 */
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

/**
 * Check if subdomain is reserved
 * @param {string} subdomain - Subdomain to check
 * @returns {boolean} - True if reserved, false otherwise
 */
export function isReservedSubdomain(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') {
    return false;
  }

  const normalized = subdomain.toLowerCase().trim();
  return RESERVED_SUBDOMAINS.includes(normalized);
}

/**
 * Validate subdomain format
 * @param {string} subdomain - Subdomain to validate
 * @returns {Object} - Validation result { valid: boolean, error?: string }
 */
export function validateSubdomainFormat(subdomain) {
  // Check if subdomain exists
  if (!subdomain || typeof subdomain !== 'string') {
    return {
      valid: false,
      error: 'Subdomain is required'
    };
  }

  const normalized = subdomain.toLowerCase().trim();

  // Check length
  if (normalized.length < 3) {
    return {
      valid: false,
      error: 'Subdomain must be at least 3 characters long'
    };
  }

  if (normalized.length > 30) {
    return {
      valid: false,
      error: 'Subdomain cannot exceed 30 characters'
    };
  }

  // Check format
  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.'
    };
  }

  // Check for reserved words
  if (isReservedSubdomain(normalized)) {
    return {
      valid: false,
      error: 'This subdomain is reserved for system use'
    };
  }

  return {
    valid: true,
    subdomain: normalized
  };
}

/**
 * Complete subdomain validation (format + reserved check + availability)
 * Note: Availability check must be done separately against database
 * @param {string} subdomain - Subdomain to validate
 * @returns {Object} - Validation result
 */
export function validateSubdomain(subdomain) {
  const formatValidation = validateSubdomainFormat(subdomain);

  if (!formatValidation.valid) {
    return formatValidation;
  }

  return {
    valid: true,
    subdomain: formatValidation.subdomain,
    message: 'Subdomain format is valid'
  };
}

/**
 * Generate suggestions for invalid subdomains
 * @param {string} subdomain - Original subdomain
 * @returns {Array<string>} - Suggested alternatives
 */
export function generateSubdomainSuggestions(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') {
    return [];
  }

  const normalized = subdomain.toLowerCase().trim();
  const suggestions = [];

  // If it's reserved, suggest variations
  if (isReservedSubdomain(normalized)) {
    suggestions.push(`my-${normalized}`);
    suggestions.push(`${normalized}-portfolio`);
    suggestions.push(`${normalized}-site`);
  }

  // If it has invalid characters, clean it up
  const cleaned = normalized
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
    .replace(/-+/g, '-')           // Remove consecutive hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens

  if (cleaned !== normalized && cleaned.length >= 3) {
    suggestions.push(cleaned);
  }

  // If too short, suggest adding suffix
  if (normalized.length < 3) {
    suggestions.push(`${normalized}-portfolio`);
  }

  // If too long, suggest truncation
  if (normalized.length > 30) {
    suggestions.push(normalized.substring(0, 27) + '...');
  }

  // Remove duplicates and return max 5 suggestions
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Get list of all reserved subdomains
 * @returns {Array<string>} - Array of reserved subdomains
 */
export function getReservedSubdomains() {
  return [...RESERVED_SUBDOMAINS];
}

// Export constants for external use
export { RESERVED_SUBDOMAINS, SUBDOMAIN_REGEX };
