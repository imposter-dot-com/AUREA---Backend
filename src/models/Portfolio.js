import mongoose from 'mongoose';

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
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
    default: ''
  },
  templateId: {
    type: String,
    required: [true, 'Template ID is required'],
    enum: ['echelon'],
    default: 'echelon'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  styling: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  showcased: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  unpublishedAt: {
    type: Date,
    default: null
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    index: { unique: true, sparse: true },
    minlength: [3, 'Slug must be at least 3 characters'],
    maxlength: [50, 'Slug cannot be more than 50 characters'],
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)']
  },
  publishedUrl: {
    type: String,
    trim: true,
    default: null
  },
  customDomain: {
    type: String,
    trim: true,
    default: null
  },
  exportCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  metadata: {
    theme: {
      type: String,
      default: 'default'
    },
    colors: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    layout: {
      type: String,
      default: 'default'
    }
  },
  caseStudies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseStudy'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
portfolioSchema.index({ userId: 1, createdAt: -1 });
portfolioSchema.index({ isPublished: 1, publishedAt: -1 });
portfolioSchema.index({ userId: 1, isPublished: 1 });
portfolioSchema.index({ templateId: 1 });

// Virtual for portfolio URL
portfolioSchema.virtual('url').get(function() {
  return this.slug ? `/portfolio/${this.slug}` : `/portfolio/${this._id}`;
});

// Virtual for public URL
portfolioSchema.virtual('publicUrl').get(function() {
  return this.slug ? `${process.env.FRONTEND_URL}/portfolio/${this.slug}` : null;
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
    query.isPublished = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find public portfolios
portfolioSchema.statics.findPublic = function(limit = 10) {
  return this.find({ isPublished: true })
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
