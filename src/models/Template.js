import mongoose from 'mongoose';

// ============================================
// TEMPLATE SCHEMA
// ============================================
const templateSchema = new mongoose.Schema({
  // ============================================
  // IDENTIFICATION
  // ============================================
  templateId: {
    type: String,
    required: [true, 'Template ID is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [/^[a-z0-9-]+$/, 'Template ID can only contain lowercase letters, numbers, and hyphens']
  },

  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },

  slug: {
    type: String,
    required: [true, 'Template slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },

  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },

  // ============================================
  // CATEGORIZATION
  // ============================================
  category: {
    type: String,
    required: true,
    enum: ['creative', 'modern', 'classic', 'minimal', 'professional', 'artistic', 'portfolio', 'business'],
    default: 'portfolio',
    index: true
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],

  // ============================================
  // TEMPLATE CONTENT
  // ============================================
  // Schema structure uses Mixed types for flexibility while maintaining validation through methods
  // Structure:
  // schema.sections = [{id, type, variant, name, description, order, required, styling, fields}]
  // schema.styling = {theme, typography, spacing, borderRadius, customCSS}
  // schema.layout = {maxWidth, columns, gutter}
  schema: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {
      sections: [],
      styling: {
        theme: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#FF6B35',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666'
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          monoFont: 'Courier New',
          scale: 'default'
        },
        spacing: 'default',
        borderRadius: 'minimal'
      },
      layout: {
        maxWidth: '1200px',
        columns: 12,
        gutter: '24px'
      }
    }
  },

  // ============================================
  // PREVIEW & ASSETS
  // ============================================
  thumbnail: {
    type: String,
    required: true
  },

  previewImages: [String],

  demoUrl: String,

  // ============================================
  // VERSIONING
  // ============================================
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },

  versionHistory: [{
    version: String,
    schema: mongoose.Schema.Types.Mixed,
    publishedAt: Date,
    changelog: String
  }],

  // ============================================
  // FEATURES & COMPATIBILITY
  // ============================================
  features: [{
    type: String
  }],

  requiredPlugins: [{
    name: String,
    version: String
  }],

  compatibility: {
    minFrontendVersion: String,
    maxFrontendVersion: String
  },

  // ============================================
  // STATUS & METADATA
  // ============================================
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  // ============================================
  // USAGE TRACKING
  // ============================================
  usageCount: {
    type: Number,
    default: 0
  },

  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  // ============================================
  // OWNERSHIP
  // ============================================
  createdBy: {
    type: String,
    default: 'Aurea'
  },

  updatedBy: String

}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================
templateSchema.index({ templateId: 1, version: 1 });
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ usageCount: -1 });
templateSchema.index({ 'rating.average': -1 });

// ============================================
// METHODS
// ============================================

// Instance method to increment usage
templateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Instance method to create new version
templateSchema.methods.createNewVersion = function(newSchema, changelog) {
  // Save current version to history
  this.versionHistory.push({
    version: this.version,
    schema: this.schema,
    publishedAt: new Date(),
    changelog: changelog || 'Version update'
  });

  // Increment version (semantic versioning - increment minor version)
  const [major, minor, patch] = this.version.split('.').map(Number);
  this.version = `${major}.${minor + 1}.0`;
  this.schema = newSchema;

  return this.save();
};

// Instance method to add rating
templateSchema.methods.addRating = function(rating) {
  const totalRating = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (totalRating + rating) / this.rating.count;
  return this.save();
};

// Instance method to validate content against template schema
templateSchema.methods.validateContent = function(content) {
  const errors = [];

  // Check if schema has sections
  if (!this.schema || !this.schema.sections) {
    return {
      valid: false,
      errors: [{ error: 'Template schema is invalid or missing sections' }]
    };
  }

  // Validate each section
  for (const sectionDef of this.schema.sections) {
    const sectionContent = content[sectionDef.id];

    // Check required sections
    if (sectionDef.required && !sectionContent) {
      errors.push({
        section: sectionDef.id,
        error: 'Required section is missing'
      });
      continue;
    }

    if (!sectionContent) continue;

    // Validate fields within section
    if (sectionDef.fields && Array.isArray(sectionDef.fields)) {
      for (const fieldDef of sectionDef.fields) {
        const fieldValue = sectionContent[fieldDef.id];

        // Check required fields
        if (fieldDef.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          errors.push({
            section: sectionDef.id,
            field: fieldDef.id,
            error: 'Required field is missing'
          });
          continue;
        }

        if (fieldValue === undefined || fieldValue === null) continue;

        // Validate field type
        const typeValid = validateFieldType(fieldValue, fieldDef.type);
        if (!typeValid) {
          errors.push({
            section: sectionDef.id,
            field: fieldDef.id,
            error: `Invalid type. Expected ${fieldDef.type}`
          });
        }

        // Validate constraints
        if (fieldDef.validation) {
          const constraintErrors = validateConstraints(fieldValue, fieldDef.validation);
          errors.push(...constraintErrors.map(err => ({
            section: sectionDef.id,
            field: fieldDef.id,
            error: err
          })));
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// STATICS
// ============================================

// Static method to find active templates
templateSchema.statics.getActiveTemplates = function(category = null) {
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ usageCount: -1 });
};

// Alias for backward compatibility
templateSchema.statics.findActive = function(category = null) {
  return this.getActiveTemplates(category);
};

// Static method to find default template
templateSchema.statics.getDefaultTemplate = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Alias for backward compatibility
templateSchema.statics.findDefault = function() {
  return this.getDefaultTemplate();
};

// Static method to search templates
templateSchema.statics.searchTemplates = function(searchTerm) {
  return this.find({
    isActive: true,
    $or: [
      { name: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') },
      { tags: new RegExp(searchTerm, 'i') }
    ]
  }).sort({ usageCount: -1 });
};

// ============================================
// VALIDATION HELPERS
// ============================================

function validateFieldType(value, expectedType) {
  switch (expectedType) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'email':
    case 'url':
    case 'tel':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value);
    case 'checkbox':
    case 'toggle':
      return typeof value === 'boolean';
    case 'image':
    case 'video':
    case 'file':
      return typeof value === 'string'; // Expecting URL string
    default:
      return true;
  }
}

function validateConstraints(value, validation) {
  const errors = [];

  if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
    errors.push(`Minimum length is ${validation.minLength}`);
  }

  if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
    errors.push(`Maximum length is ${validation.maxLength}`);
  }

  if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
    errors.push(`Minimum value is ${validation.min}`);
  }

  if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
    errors.push(`Maximum value is ${validation.max}`);
  }

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (typeof value === 'string' && !regex.test(value)) {
      errors.push('Value does not match required pattern');
    }
  }

  if (validation.allowedFormats && Array.isArray(validation.allowedFormats)) {
    if (typeof value === 'string') {
      const format = value.split('.').pop();
      if (!validation.allowedFormats.includes(format)) {
        errors.push(`Allowed formats: ${validation.allowedFormats.join(', ')}`);
      }
    }
  }

  if (validation.options && Array.isArray(validation.options)) {
    if (!validation.options.includes(value)) {
      errors.push(`Value must be one of: ${validation.options.join(', ')}`);
    }
  }

  return errors;
}

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

// Pre-save middleware to ensure only one default template
templateSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const Template = mongoose.model('Template', templateSchema);

export default Template;