import CaseStudy from '../models/CaseStudy.js';
import Portfolio from '../models/Portfolio.js';
import mongoose from 'mongoose';

// @desc    Create a new case study
// @route   POST /api/case-studies
// @access  Private (portfolio owner only)
export const createCaseStudy = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { portfolioId, projectId, content } = req.body;

    // Check if portfolio exists and user owns it
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this portfolio',
        code: 'FORBIDDEN'
      });
    }

    // Check if project exists in portfolio
    const projects = portfolio.content?.work?.projects || [];
    const projectExists = projects.some(project => project.id === projectId);
    
    if (!projectExists) {
      return res.status(400).json({
        success: false,
        error: 'Project ID not found in portfolio',
        code: 'INVALID_INPUT'
      });
    }

    // Check for existing case study for this project
    const existingCaseStudy = await CaseStudy.findOne({ portfolioId, projectId });
    if (existingCaseStudy) {
      return res.status(400).json({
        success: false,
        error: 'Case study already exists for this project',
        code: 'CONFLICT'
      });
    }

    // Create case study
    const caseStudy = new CaseStudy({
      portfolioId,
      userId: req.user._id,
      projectId,
      content: content || {
        hero: { title: '' },
        overview: {},
        sections: [],
        additionalContext: {},
        nextProject: {}
      }
    });

    await caseStudy.save({ session });

    // Add case study to portfolio's caseStudies array
    await Portfolio.findByIdAndUpdate(
      portfolioId,
      { $addToSet: { caseStudies: caseStudy._id } },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Case study created successfully',
      data: { caseStudy }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create case study error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

// @desc    Get case study by ID
// @route   GET /api/case-studies/:id
// @access  Private (owner only)
export const getCaseStudyById = async (req, res) => {
  try {
    // Case study is already attached by ownership middleware
    const caseStudy = req.caseStudy;

    // Populate portfolio info
    const populatedCaseStudy = await CaseStudy.findById(caseStudy._id)
      .populate('portfolioId', 'title slug isPublished')
      .populate('userId', 'name');

    res.json({
      success: true,
      data: { caseStudy: populatedCaseStudy }
    });

  } catch (error) {
    console.error('Get case study error:', error);
    throw error;
  }
};

// @desc    Get case study by portfolio and project
// @route   GET /api/case-studies/portfolio/:portfolioId/project/:projectId
// @access  Private (portfolio owner only)
export const getCaseStudyByPortfolioAndProject = async (req, res) => {
  try {
    const { portfolioId, projectId } = req.params;

    // Check if portfolio exists and user owns it
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        code: 'NOT_FOUND'
      });
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this portfolio',
        code: 'FORBIDDEN'
      });
    }

    const caseStudy = await CaseStudy.findOne({ portfolioId, projectId })
      .populate('portfolioId', 'title slug isPublished')
      .populate('userId', 'name');

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { caseStudy }
    });

  } catch (error) {
    console.error('Get case study by portfolio and project error:', error);
    throw error;
  }
};

// @desc    Update case study
// @route   PUT /api/case-studies/:id
// @access  Private (owner only)
export const updateCaseStudy = async (req, res) => {
  try {
    // Case study is already attached by ownership middleware
    const caseStudy = req.caseStudy;
    const { content } = req.body;

    // Perform deep merge for content updates
    let updatedContent = { ...caseStudy.content };
    
    if (content) {
      // Merge hero section
      if (content.hero) {
        updatedContent.hero = { ...updatedContent.hero, ...content.hero };
      }
      
      // Merge overview section
      if (content.overview) {
        updatedContent.overview = { ...updatedContent.overview, ...content.overview };
      }
      
      // Replace sections array if provided
      if (content.sections) {
        updatedContent.sections = content.sections;
      }
      
      // Merge additional context
      if (content.additionalContext) {
        updatedContent.additionalContext = { 
          ...updatedContent.additionalContext, 
          ...content.additionalContext 
        };
      }
      
      // Merge next project
      if (content.nextProject) {
        updatedContent.nextProject = { 
          ...updatedContent.nextProject, 
          ...content.nextProject 
        };
      }
    }

    const updatedCaseStudy = await CaseStudy.findByIdAndUpdate(
      caseStudy._id,
      { content: updatedContent },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Case study updated successfully',
      data: { caseStudy: updatedCaseStudy }
    });

  } catch (error) {
    console.error('Update case study error:', error);
    throw error;
  }
};

// @desc    Delete case study
// @route   DELETE /api/case-studies/:id
// @access  Private (owner only)
export const deleteCaseStudy = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Case study is already attached by ownership middleware
    const caseStudy = req.caseStudy;

    // Remove case study from portfolio's caseStudies array
    await Portfolio.findByIdAndUpdate(
      caseStudy.portfolioId,
      { $pull: { caseStudies: caseStudy._id } },
      { session }
    );

    // Delete the case study
    await CaseStudy.findByIdAndDelete(caseStudy._id, { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Case study deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Delete case study error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

// @desc    Get public case study
// @route   GET /api/case-studies/public/:portfolioSlug/:projectId
// @access  Public
export const getPublicCaseStudy = async (req, res) => {
  try {
    const { portfolioSlug, projectId } = req.params;

    // First find the portfolio by slug and verify it's published
    const portfolio = await Portfolio.findOne({ 
      slug: portfolioSlug, 
      isPublished: true 
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found or not published',
        code: 'NOT_FOUND'
      });
    }

    // Find the case study
    const caseStudy = await CaseStudy.findOne({ 
      portfolioId: portfolio._id, 
      projectId 
    }).populate('portfolioId', 'title slug')
     .populate('userId', 'name profileImage');

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { 
        caseStudy,
        portfolio: {
          _id: portfolio._id,
          title: portfolio.title,
          slug: portfolio.slug
        }
      }
    });

  } catch (error) {
    console.error('Get public case study error:', error);
    throw error;
  }
};