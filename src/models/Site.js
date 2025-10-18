import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  // ============================================
  // IDENTIFICATION
  // ============================================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid subdomain format'],
    index: true
  },

  // ============================================
  // BASIC INFO
  // ============================================
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },

  // ============================================
  // METADATA (Denormalized for search/display)
  // ============================================
  metadata: {
    ownerName: {
      type: String,
      default: ''
    },
    ownerEmail: {
      type: String,
      default: ''
    }
  },

  // ============================================
  // DEPLOYMENT
  // ============================================
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
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastDeployedAt: {
    type: Date,
    default: null
  },
  deploymentStatus: {
    type: String,
    enum: ['draft', 'building', 'success', 'failed'],
    default: 'draft',
    index: true
  },
  files: [{
    type: String
  }],
  styling: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ============================================
  // SEO
  // ============================================
  seo: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    keywords: [{
      type: String
    }]
  },

  // ============================================
  // ANALYTICS
  // ============================================
  viewCount: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  referrers: [{
    source: {
      type: String
    },
    count: {
      type: Number,
      default: 1
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ============================================
// COMPOUND INDEXES
// ============================================
// Unique subdomain globally (already defined in schema)
// Primary lookup - active sites by subdomain
siteSchema.index({ subdomain: 1, isActive: 1 });

// User's active sites
siteSchema.index({ userId: 1, isActive: 1 });

// Recently published sites
siteSchema.index({ published: 1, publishedAt: -1 });

// Portfolio lookups
siteSchema.index({ portfolioId: 1 });

// Virtual for site URL
siteSchema.virtual('url').get(function() {
  return this.customDomain || `https://${this.subdomain}.vercel.app`;
});

// ============================================
// INSTANCE METHODS
// ============================================

// Method to increment views with referrer tracking
siteSchema.methods.incrementViews = function(referrer = null, isUniqueVisitor = false) {
  this.viewCount = (this.viewCount || 0) + 1;
  this.lastViewedAt = new Date();

  // Track unique visitors
  if (isUniqueVisitor) {
    this.uniqueVisitors = (this.uniqueVisitors || 0) + 1;
  }

  // Track referrer if provided
  if (referrer) {
    const existingReferrer = this.referrers.find(r => r.source === referrer);
    if (existingReferrer) {
      existingReferrer.count += 1;
      existingReferrer.lastSeen = new Date();
    } else {
      this.referrers.push({
        source: referrer,
        count: 1,
        lastSeen: new Date()
      });
    }
  }

  return this.save();
};

// Method to deactivate site (soft delete)
siteSchema.methods.deactivate = function() {
  this.isActive = false;
  this.published = false;
  return this.save();
};

// Method to reactivate site
siteSchema.methods.reactivate = function() {
  this.isActive = true;
  this.published = true;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

// Static method to find active site by subdomain
siteSchema.statics.findBySubdomain = function(subdomain, includeInactive = false) {
  const query = { subdomain };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.findOne(query).populate('portfolioId');
};

// Static method to find user's active sites
siteSchema.statics.findByUser = function(userId, includeInactive = false) {
  const query = { userId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query)
    .populate('portfolioId')
    .sort({ publishedAt: -1 });
};

// Static method to find published sites
siteSchema.statics.findPublished = function() {
  return this.find({ published: true, isActive: true })
    .populate('userId', 'name email')
    .populate('portfolioId', 'title')
    .sort({ publishedAt: -1 });
};

// Static method to check subdomain availability
siteSchema.statics.isSubdomainAvailable = async function(subdomain, excludeSiteId = null) {
  const query = { subdomain, isActive: true };
  if (excludeSiteId) {
    query._id = { $ne: excludeSiteId };
  }
  const existing = await this.findOne(query);
  return !existing;
};

const Site = mongoose.model('Site', siteSchema);

export default Site;