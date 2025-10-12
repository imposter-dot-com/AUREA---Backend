import mongoose from 'mongoose';

const caseStudySchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: [true, 'Portfolio ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true
  },
  content: {
    hero: {
      title: {
        type: String,
        required: [true, 'Hero title is required'],
        trim: true,
        maxlength: [200, 'Hero title cannot be more than 200 characters']
      },
      subtitle: {
        type: String,
        trim: true,
        maxlength: [300, 'Hero subtitle cannot be more than 300 characters'],
        default: ''
      },
      coverImage: {
        type: String,
        trim: true,
        default: ''
      },
      client: {
        type: String,
        trim: true,
        maxlength: [100, 'Client name cannot be more than 100 characters'],
        default: ''
      },
      year: {
        type: String,
        trim: true,
        match: [/^\d{4}$/, 'Year must be a 4-digit number'],
        default: ''
      },
      role: {
        type: String,
        trim: true,
        maxlength: [100, 'Role cannot be more than 100 characters'],
        default: ''
      },
      duration: {
        type: String,
        trim: true,
        maxlength: [50, 'Duration cannot be more than 50 characters'],
        default: ''
      }
    },
    overview: {
      heading: {
        type: String,
        trim: true,
        maxlength: [200, 'Overview heading cannot be more than 200 characters'],
        default: 'Project Overview'
      },
      description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters'],
        default: ''
      },
      challenge: {
        type: String,
        trim: true,
        maxlength: [2000, 'Challenge cannot be more than 2000 characters'],
        default: ''
      },
      solution: {
        type: String,
        trim: true,
        maxlength: [2000, 'Solution cannot be more than 2000 characters'],
        default: ''
      },
      results: {
        type: String,
        trim: true,
        maxlength: [2000, 'Results cannot be more than 2000 characters'],
        default: ''
      }
    },
    sections: [{
      id: {
        type: String,
        required: [true, 'Section ID is required'],
        trim: true
      },
      type: {
        type: String,
        required: [true, 'Section type is required'],
        enum: ['text', 'image', 'image-text', 'gallery'],
        trim: true
      },
      heading: {
        type: String,
        trim: true,
        maxlength: [200, 'Section heading cannot be more than 200 characters'],
        default: ''
      },
      content: {
        type: String,
        trim: true,
        maxlength: [5000, 'Section content cannot be more than 5000 characters'],
        default: ''
      },
      image: {
        type: String,
        trim: true,
        default: ''
      },
      images: [{
        type: String,
        trim: true
      }],
      layout: {
        type: String,
        enum: ['left', 'right', 'center', 'full'],
        default: 'center'
      }
    }],
    additionalContext: {
      heading: {
        type: String,
        trim: true,
        maxlength: [200, 'Additional context heading cannot be more than 200 characters'],
        default: 'Additional Context'
      },
      content: {
        type: String,
        trim: true,
        maxlength: [3000, 'Additional context content cannot be more than 3000 characters'],
        default: ''
      }
    },
    nextProject: {
      id: {
        type: String,
        trim: true,
        default: ''
      },
      title: {
        type: String,
        trim: true,
        maxlength: [200, 'Next project title cannot be more than 200 characters'],
        default: ''
      },
      image: {
        type: String,
        trim: true,
        default: ''
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
caseStudySchema.index({ portfolioId: 1, projectId: 1 }, { unique: true });
caseStudySchema.index({ userId: 1, createdAt: -1 });
caseStudySchema.index({ portfolioId: 1 });

// Virtual for case study URL
caseStudySchema.virtual('url').get(function() {
  return `/case-study/${this._id}`;
});

// Static method to find by portfolio and project
caseStudySchema.statics.findByPortfolioAndProject = function(portfolioId, projectId) {
  return this.findOne({ portfolioId, projectId })
    .populate('portfolioId', 'title slug isPublished')
    .populate('userId', 'name');
};

// Static method to find by portfolio
caseStudySchema.statics.findByPortfolio = function(portfolioId) {
  return this.find({ portfolioId })
    .sort({ createdAt: -1 });
};

// Pre-save middleware to validate projectId exists in portfolio
caseStudySchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Portfolio = mongoose.model('Portfolio');
      const portfolio = await Portfolio.findById(this.portfolioId);
      
      if (!portfolio) {
        return next(new Error('Portfolio not found'));
      }
      
      // Check if projectId exists in portfolio (check both work.projects and projects arrays)
      const workProjects = portfolio.content?.work?.projects || [];
      const contentProjects = portfolio.content?.projects || [];
      const allProjects = [...workProjects, ...contentProjects];
      
      // Use loose comparison to handle both string and number IDs
      const projectExists = allProjects.some(project => project.id == this.projectId);
      
      if (!projectExists) {
        return next(new Error(`Project ID "${this.projectId}" not found in portfolio. Available: ${allProjects.map(p => p.id).join(', ')}`));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to add case study to portfolio
caseStudySchema.post('save', async function(doc) {
  try {
    const Portfolio = mongoose.model('Portfolio');
    await Portfolio.findByIdAndUpdate(
      doc.portfolioId,
      { $addToSet: { caseStudies: doc._id } }
    );
  } catch (error) {
    console.error('Error updating portfolio with case study:', error);
  }
});

// Post-remove middleware to remove case study from portfolio
caseStudySchema.post('remove', async function(doc) {
  try {
    const Portfolio = mongoose.model('Portfolio');
    await Portfolio.findByIdAndUpdate(
      doc.portfolioId,
      { $pull: { caseStudies: doc._id } }
    );
  } catch (error) {
    console.error('Error removing case study from portfolio:', error);
  }
});

const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);

export default CaseStudy;