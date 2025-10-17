import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  // Unique identifier for the template
  templateId: {
    type: String,
    required: [true, 'Template ID is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Template ID can only contain lowercase letters, numbers, and hyphens']
  },

  // Display information
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
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },

  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },

  // Template thumbnail/preview
  thumbnail: {
    type: String,
    default: null
  },

  // Category for grouping templates
  category: {
    type: String,
    enum: ['classic', 'modern', 'minimal', 'creative', 'professional', 'portfolio', 'business'],
    default: 'portfolio'
  },

  // Template schema - using Mixed type for flexibility
  // Schema structure:
  // {
  //   sections: [
  //     {
  //       id: "hero",
  //       name: "Hero Section",
  //       required: true,  // Can't be deleted by user
  //       order: 1,
  //       fields: [
  //         {
  //           id: "title",
  //           type: "string",
  //           label: "Title",
  //           required: false,
  //           placeholder: "Enter title",
  //           maxLength: 200
  //         }
  //       ]
  //     }
  //   ]
  // }
  schema: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {
      sections: []
    }
  },

  // Case study template structure
  caseStudySchema: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      enabled: false,
      fields: []
    }
  },

  // Version control
  version: {
    type: String,
    required: [true, 'Template version is required'],
    default: '1.0.0'
  },

  // Template status
  isActive: {
    type: Boolean,
    default: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },

  // Premium template flag
  isPremium: {
    type: Boolean,
    default: false
  },

  // Creator information
  createdBy: {
    type: String,
    default: 'system'
  },

  // Tags for searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ templateId: 1 });
templateSchema.index({ slug: 1 });
templateSchema.index({ isActive: 1, category: 1 });
templateSchema.index({ tags: 1 });

// Instance method to increment usage
templateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Static method to find active templates
templateSchema.statics.findActive = function(category = null) {
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ usageCount: -1, createdAt: -1 });
};

// Static method to find default template
templateSchema.statics.findDefault = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

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