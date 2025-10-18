import Template from '../models/Template.js';

/**
 * Get all active templates
 * @route GET /api/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { category, isPremium, tags } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (isPremium !== undefined) {
      query.isPremium = isPremium === 'true';
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    const templates = await Template.find(query)
      .select('-schema -caseStudySchema') // Exclude heavy schema fields for list view
      .sort({ usageCount: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Templates retrieved successfully',
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get a specific template by ID
 * @route GET /api/templates/:id
 */
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both MongoDB ObjectId and templateId
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOne(query);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Increment usage count (non-blocking)
    template.incrementUsage().catch(err =>
      console.error('Failed to increment template usage:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Template retrieved successfully',
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get template schema only (for editor)
 * @route GET /api/templates/:id/schema
 */
export const getTemplateSchema = async (req, res) => {
  try {
    const { id } = req.params;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOne(query)
      .select('templateId name schema caseStudySchema version');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template schema retrieved successfully',
      data: {
        templateId: template.templateId,
        name: template.name,
        version: template.version,
        schema: template.schema,
        caseStudySchema: template.caseStudySchema
      }
    });
  } catch (error) {
    console.error('Error fetching template schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template schema',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get template categories
 * @route GET /api/templates/categories
 */
export const getTemplateCategories = async (req, res) => {
  try {
    const categories = await Template.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create a new template (Admin only)
 * @route POST /api/templates
 */
export const createTemplate = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create templates'
      });
    }

    const templateData = req.body;

    // Check if templateId already exists
    const existingTemplate = await Template.findOne({
      $or: [
        { templateId: templateData.templateId },
        { slug: templateData.slug }
      ]
    });

    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message: 'Template with this ID or slug already exists'
      });
    }

    const newTemplate = new Template({
      ...templateData,
      createdBy: req.user._id.toString()
    });

    await newTemplate.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: newTemplate
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update a template (Admin only)
 * @route PUT /api/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update templates'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing templateId
    delete updates.templateId;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOneAndUpdate(
      query,
      updates,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Deactivate a template (Admin only)
 * @route DELETE /api/templates/:id
 */
export const deactivateTemplate = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can deactivate templates'
      });
    }

    const { id } = req.params;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template deactivated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error deactivating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get default template
 * @route GET /api/templates/default
 */
export const getDefaultTemplate = async (req, res) => {
  try {
    const template = await Template.findDefault();

    if (!template) {
      // Fallback to first active template
      const firstTemplate = await Template.findOne({ isActive: true })
        .sort({ createdAt: 1 });

      if (!firstTemplate) {
        return res.status(404).json({
          success: false,
          message: 'No templates available'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Default template retrieved',
        data: firstTemplate
      });
    }

    res.status(200).json({
      success: true,
      message: 'Default template retrieved successfully',
      data: template
    });
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Validate portfolio content against template schema
 * @route POST /api/templates/:id/validate
 */
export const validateTemplateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for validation'
      });
    }

    // Support both MongoDB ObjectId and templateId
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOne(query);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Validate content against template schema
    const validation = template.validateContent(content);

    return res.status(200).json({
      success: true,
      message: validation.valid ? 'Content is valid' : 'Content has validation errors',
      data: validation
    });
  } catch (error) {
    console.error('Error validating template content:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new template version (Admin only)
 * @route POST /api/templates/:id/version
 */
export const createTemplateVersion = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create template versions'
      });
    }

    const { id } = req.params;
    const { schema, changelog } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: 'New schema is required'
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOne(query);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Create new version
    await template.createNewVersion(schema, changelog);

    res.status(200).json({
      success: true,
      message: 'Template version created successfully',
      data: {
        templateId: template.templateId,
        version: template.version,
        changelog: changelog || 'Version update'
      }
    });
  } catch (error) {
    console.error('Error creating template version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template version',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Add rating to template
 * @route POST /api/templates/:id/rating
 */
export const addTemplateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { templateId: id };

    const template = await Template.findOne(query);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.addRating(rating);

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      data: {
        templateId: template.templateId,
        rating: {
          average: template.rating.average,
          count: template.rating.count
        }
      }
    });
  } catch (error) {
    console.error('Error adding template rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};