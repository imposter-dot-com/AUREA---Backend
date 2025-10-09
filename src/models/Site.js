import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid subdomain format']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  customDomain: {
    type: String,
    default: null
  },
  template: {
    type: String,
    default: 'default'
  },
  published: {
    type: Boolean,
    default: false
  },
  lastDeployedAt: {
    type: Date,
    default: null
  },
  deploymentStatus: {
    type: String,
    enum: ['draft', 'building', 'success', 'failed'],
    default: 'draft'
  },
  files: [{
    type: String
  }],
  styling: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to allow multiple sites per user (unique subdomain globally)
siteSchema.index({ subdomain: 1 }, { unique: true });
siteSchema.index({ userId: 1 });
siteSchema.index({ portfolioId: 1 });
siteSchema.index({ deploymentStatus: 1 });
siteSchema.index({ published: 1 });
siteSchema.index({ createdAt: -1 });

// Virtual for site URL
siteSchema.virtual('url').get(function() {
  return this.customDomain || `https://${this.subdomain}.vercel.app`;
});

// Method to increment views
siteSchema.methods.incrementViews = function() {
  this.viewCount = (this.viewCount || 0) + 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Static method to find site by subdomain
siteSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain }).populate('portfolioId');
};

// Static method to find sites by user
siteSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('portfolioId');
};

// Static method to find published sites
siteSchema.statics.findPublished = function() {
  return this.find({ published: true })
    .populate('userId', 'name email')
    .populate('portfolioId', 'title');
};

const Site = mongoose.model('Site', siteSchema);

export default Site;