import caseStudyService from '../core/services/CaseStudyService.js';
import responseFormatter from '../shared/utils/responseFormatter.js';

/**
 * Case Study Controller - Thin HTTP layer
 * Handles HTTP requests/responses for case study management
 * All business logic delegated to CaseStudyService
 */

/**
 * @desc    Create a new case study
 * @route   POST /api/case-studies
 * @access  Private (portfolio owner only)
 */
export const createCaseStudy = async (req, res, next) => {
  try {
    const caseStudy = await caseStudyService.createCaseStudy(req.body, req.user._id);

    return responseFormatter.created(
      res,
      { caseStudy },
      'Case study created successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get case study by ID
 * @route   GET /api/case-studies/:id
 * @access  Private (owner only)
 */
export const getCaseStudyById = async (req, res, next) => {
  try {
    // Note: req.caseStudy is attached by ownership middleware
    // But we still fetch with population for consistency
    const caseStudy = await caseStudyService.getCaseStudyById(req.caseStudy._id);

    return responseFormatter.success(
      res,
      { caseStudy },
      'Case study retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get case study by portfolio and project
 * @route   GET /api/case-studies/portfolio/:portfolioId/project/:projectId
 * @access  Private (portfolio owner only)
 */
export const getCaseStudyByPortfolioAndProject = async (req, res, next) => {
  try {
    const { portfolioId, projectId } = req.params;

    const caseStudy = await caseStudyService.getCaseStudyByPortfolioAndProject(
      portfolioId,
      projectId,
      req.user._id
    );

    return responseFormatter.success(
      res,
      { caseStudy },
      'Case study retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update case study
 * @route   PUT /api/case-studies/:id
 * @access  Private (owner only)
 */
export const updateCaseStudy = async (req, res, next) => {
  try {
    // req.caseStudy is attached by ownership middleware
    const updatedCaseStudy = await caseStudyService.updateCaseStudy(
      req.caseStudy._id,
      req.body
    );

    return responseFormatter.success(
      res,
      { caseStudy: updatedCaseStudy },
      'Case study updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete case study
 * @route   DELETE /api/case-studies/:id
 * @access  Private (owner only)
 */
export const deleteCaseStudy = async (req, res, next) => {
  try {
    // req.caseStudy is attached by ownership middleware
    await caseStudyService.deleteCaseStudy(req.caseStudy._id);

    return responseFormatter.success(
      res,
      null,
      'Case study deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public case study
 * @route   GET /api/case-studies/public/:portfolioSlug/:projectId
 * @access  Public
 */
export const getPublicCaseStudy = async (req, res, next) => {
  try {
    const { portfolioSlug, projectId } = req.params;

    const result = await caseStudyService.getPublicCaseStudy(portfolioSlug, projectId);

    return responseFormatter.success(
      res,
      result,
      'Case study retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
