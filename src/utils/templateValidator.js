import Template from '../models/Template.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * Validates portfolio data against template schema
 * Handles section deletion - if a section has no data or is empty, it means user deleted it
 * @param {Object} customData - User's portfolio data
 * @param {String} templateId - Template ID to validate against
 * @returns {Object} { isValid: boolean, errors: array, sanitizedData: object, deletedSections: array }
 */
export async function validateAgainstTemplate(customData, templateId) {
  try {
    // Fetch the template
    const template = await Template.findById(templateId);

    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        sanitizedData: null,
        deletedSections: []
      };
    }

    if (!template.isActive) {
      return {
        isValid: false,
        errors: ['Template is not active'],
        sanitizedData: null,
        deletedSections: []
      };
    }

    const errors = [];
    const sanitizedData = {};
    const deletedSections = [];

    // Get template sections
    const templateSections = template.schema.sections || [];

    // Process each template section
    for (const templateSection of templateSections) {
      const sectionId = templateSection.id;
      const sectionData = customData[sectionId];

      // Check if section is deleted (no data or explicitly null/undefined)
      const isSectionDeleted = !sectionData ||
        (typeof sectionData === 'object' && Object.keys(sectionData).length === 0);

      if (isSectionDeleted) {
        // Check if section is required
        if (templateSection.required) {
          errors.push(`Section '${templateSection.name || sectionId}' is required and cannot be deleted`);
          continue;
        } else {
          // Section is optional and deleted by user
          deletedSections.push(sectionId);
          continue;
        }
      }

      // Section has data, validate it
      sanitizedData[sectionId] = {};

      // Validate fields in section
      if (templateSection.fields) {
        for (const fieldSchema of templateSection.fields) {
          const fieldId = fieldSchema.id;
          const fieldValue = sectionData[fieldId];

          // Check required fields
          if (fieldSchema.required && !fieldValue) {
            errors.push(`${sectionId}.${fieldId} is required`);
            continue;
          }

          // Skip empty optional fields
          if (!fieldValue && !fieldSchema.required) {
            continue;
          }

          // Validate field
          const validation = validateField(fieldValue, fieldSchema, `${sectionId}.${fieldId}`);

          if (!validation.isValid) {
            errors.push(...validation.errors);
          } else {
            sanitizedData[sectionId][fieldId] = validation.sanitizedValue;
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData,
      deletedSections
    };
  } catch (error) {
    logger.error('Template validation error', { error: error.message, templateId });
    return {
      isValid: false,
      errors: ['Validation error: ' + error.message],
      sanitizedData: null,
      deletedSections: []
    };
  }
}

/**
 * Validates a single field against its schema
 */
function validateField(value, fieldSchema, fieldPath) {
  const errors = [];
  let sanitizedValue = value;

  // Type validation
  switch (fieldSchema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string`);
      } else {
        sanitizedValue = value.trim();

        // Check max length
        if (fieldSchema.maxLength && sanitizedValue.length > fieldSchema.maxLength) {
          errors.push(`${fieldPath} exceeds maximum length of ${fieldSchema.maxLength}`);
        }

        // Check min length
        if (fieldSchema.minLength && sanitizedValue.length < fieldSchema.minLength) {
          errors.push(`${fieldPath} must be at least ${fieldSchema.minLength} characters`);
        }
      }
      break;

    case 'number':
      if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
        errors.push(`${fieldPath} must be a number`);
      } else {
        sanitizedValue = Number(value);

        // Check min/max
        if (fieldSchema.min !== undefined && sanitizedValue < fieldSchema.min) {
          errors.push(`${fieldPath} must be at least ${fieldSchema.min}`);
        }
        if (fieldSchema.max !== undefined && sanitizedValue > fieldSchema.max) {
          errors.push(`${fieldPath} must be at most ${fieldSchema.max}`);
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        sanitizedValue = Boolean(value);
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string`);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${fieldPath} must be a valid email address`);
        }
        sanitizedValue = value.trim().toLowerCase();
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string`);
      } else {
        try {
          new URL(value);
          sanitizedValue = value.trim();
        } catch {
          errors.push(`${fieldPath} must be a valid URL`);
        }
      }
      break;

    case 'textarea':
    case 'richtext':
      if (typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string`);
      } else {
        sanitizedValue = value.trim();

        if (fieldSchema.maxLength && sanitizedValue.length > fieldSchema.maxLength) {
          errors.push(`${fieldPath} exceeds maximum length of ${fieldSchema.maxLength}`);
        }
      }
      break;

    case 'image':
      // Images are usually URLs or file paths
      if (value && typeof value !== 'string') {
        errors.push(`${fieldPath} must be a string (URL or path)`);
      }
      sanitizedValue = value ? value.trim() : null;
      break;

    case 'select':
      if (fieldSchema.options && !fieldSchema.options.includes(value)) {
        errors.push(`${fieldPath} must be one of: ${fieldSchema.options.join(', ')}`);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldPath} must be an array`);
      } else {
        sanitizedValue = [];

        // Check max items
        if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
          errors.push(`${fieldPath} exceeds maximum of ${fieldSchema.maxItems} items`);
        }

        // Validate each item in array
        if (fieldSchema.itemSchema && value.length > 0) {
          value.forEach((item, index) => {
            const itemValidation = validateArrayItem(item, fieldSchema.itemSchema, `${fieldPath}[${index}]`);
            if (itemValidation.isValid) {
              sanitizedValue.push(itemValidation.sanitizedValue);
            } else {
              errors.push(...itemValidation.errors);
            }
          });
        } else {
          sanitizedValue = value;
        }
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null) {
        errors.push(`${fieldPath} must be an object`);
      } else if (fieldSchema.fields) {
        sanitizedValue = {};

        // Validate nested object fields
        for (const objFieldSchema of fieldSchema.fields) {
          const objFieldId = objFieldSchema.id;
          const objValue = value[objFieldId];

          if (objFieldSchema.required && !objValue) {
            errors.push(`${fieldPath}.${objFieldId} is required`);
          } else if (objValue) {
            const objValidation = validateField(objValue, objFieldSchema, `${fieldPath}.${objFieldId}`);
            if (objValidation.isValid) {
              sanitizedValue[objFieldId] = objValidation.sanitizedValue;
            } else {
              errors.push(...objValidation.errors);
            }
          }
        }
      } else {
        sanitizedValue = value;
      }
      break;

    default:
      // For unknown types, accept as-is
      sanitizedValue = value;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * Validates array item against schema
 */
function validateArrayItem(item, itemSchema, itemPath) {
  const errors = [];
  const sanitizedItem = {};

  // Handle item schema fields
  for (const [key, schemaValue] of Object.entries(itemSchema)) {
    const value = item[key];

    // Create field schema from item schema
    const fieldSchema = typeof schemaValue === 'object' ? schemaValue : { type: schemaValue };

    if (fieldSchema.required && !value) {
      errors.push(`${itemPath}.${key} is required`);
    } else if (value !== undefined) {
      const validation = validateField(value, fieldSchema, `${itemPath}.${key}`);

      if (!validation.isValid) {
        errors.push(...validation.errors);
      } else {
        sanitizedItem[key] = validation.sanitizedValue;
      }
    } else if (fieldSchema.default !== undefined) {
      sanitizedItem[key] = fieldSchema.default;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedItem
  };
}

/**
 * Merges custom data with template defaults
 * Only adds defaults for sections that exist (not deleted)
 */
export function mergeWithTemplateDefaults(customData, templateSchema) {
  const merged = { ...customData };
  const sections = templateSchema.sections || [];

  // Add default values for existing sections
  for (const section of sections) {
    const sectionId = section.id;

    // Skip if section is deleted (not in customData)
    if (!merged[sectionId]) {
      continue;
    }

    // Add field defaults
    if (section.fields) {
      for (const field of section.fields) {
        const fieldId = field.id;

        if (merged[sectionId][fieldId] === undefined) {
          // Add default value if field has one
          if (field.default !== undefined) {
            merged[sectionId][fieldId] = field.default;
          } else if (field.type === 'array') {
            merged[sectionId][fieldId] = [];
          } else if (field.type === 'object') {
            merged[sectionId][fieldId] = {};
          }
        }
      }
    }
  }

  return merged;
}

/**
 * Gets a list of required sections from template
 */
export function getRequiredSections(templateSchema) {
  const sections = templateSchema.sections || [];
  return sections
    .filter(section => section.required === true)
    .map(section => ({
      id: section.id,
      name: section.name
    }));
}

/**
 * Gets a list of optional sections from template
 */
export function getOptionalSections(templateSchema) {
  const sections = templateSchema.sections || [];
  return sections
    .filter(section => section.required !== true)
    .map(section => ({
      id: section.id,
      name: section.name
    }));
}