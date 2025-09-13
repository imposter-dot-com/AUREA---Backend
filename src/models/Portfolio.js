import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Section type is required'],
    enum: ['about', 'projects', 'contact', 'skills', 'experience', 'education', 'custom'],
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Portfolio title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  template: {
    type: String,
    required: [true, 'Template is required'],
    trim: true,
    default: 'default'
  },
  sections: {
    type: [sectionSchema],
    default: [
      { type: 'about', content: {} },
      { type: 'projects', content: {} },
      { type: 'contact', content: {} }
    ]
  },
  published: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows multiple null values
    index: { sparse: true }, // Create sparse index on slug
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
portfolioSchema.index({ userId: 1, createdAt: -1 });
portfolioSchema.index({ published: 1, isPublic: 1 });

// Virtual for portfolio URL
portfolioSchema.virtual('url').get(function() {
  return this.slug ? `/portfolio/${this.slug}` : `/portfolio/${this._id}`;
});

// Instance method to increment view count
portfolioSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to find user portfolios
portfolioSchema.statics.findByUser = function(userId, includeUnpublished = true) {
  const query = { userId };
  if (!includeUnpublished) {
    query.published = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find public portfolios
portfolioSchema.statics.findPublic = function(limit = 10) {
  return this.find({ published: true, isPublic: true })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware to generate slug if not provided
portfolioSchema.pre('save', function(next) {
  if (this.isNew && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;
