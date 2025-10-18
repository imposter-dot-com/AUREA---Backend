# Frontend Integration Guide

## Quick Start (5 Minutes)

Get up and running with the template system in your React application.

```bash
# Install dependencies
npm install axios zustand

# Import and use
import { useTemplateStore } from './stores/templateStore';
import { TemplateSelector } from './components/TemplateSelector';

function App() {
  const { selectedTemplate, loadTemplates } = useTemplateStore();
  
  useEffect(() => {
    loadTemplates();
  }, []);
  
  return <TemplateSelector />;
}
```

---

## Installation

### Required Dependencies

```bash
npm install axios zustand
```

### Optional Dependencies

```bash
# For rich text editing
npm install react-quill

# For form handling
npm install react-hook-form

# For UI components
npm install @headlessui/react @heroicons/react
```

---

## API Integration Examples

### 1. Fetching Templates with Axios

**Basic Template List:**

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Get all templates
export const getTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.isPremium !== undefined) params.append('isPremium', filters.isPremium);
    if (filters.tags) params.append('tags', filters.tags.join(','));
    
    const response = await axios.get(`${API_BASE}/templates?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Example usage
const templates = await getTemplates({
  category: 'minimal',
  tags: ['modern', 'clean']
});
```

**Get Specific Template:**

```javascript
export const getTemplateById = async (templateId) => {
  try {
    const response = await axios.get(`${API_BASE}/templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

// Example usage
const template = await getTemplateById('echelon');
console.log(template.data.schema);
```

**Get Template Schema Only:**

```javascript
export const getTemplateSchema = async (templateId) => {
  try {
    const response = await axios.get(`${API_BASE}/templates/${templateId}/schema`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template schema:', error);
    throw error;
  }
};

// Example usage - Lighter payload for form generation
const schema = await getTemplateSchema('echelon');
```

**Get Default Template:**

```javascript
export const getDefaultTemplate = async () => {
  try {
    const response = await axios.get(`${API_BASE}/templates/default`);
    return response.data;
  } catch (error) {
    console.error('Error fetching default template:', error);
    throw error;
  }
};

// Example usage - New user workflow
const defaultTemplate = await getDefaultTemplate();
```

**Get Template Categories:**

```javascript
export const getTemplateCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE}/templates/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Example usage - Filter UI
const categories = await getTemplateCategories();
// ['creative', 'modern', 'classic', 'minimal']
```

### 2. Template Selection UI Pattern

**Template Card Component:**

```jsx
// components/TemplateCard.jsx
import React from 'react';
import { Star } from '@heroicons/react/24/solid';

export const TemplateCard = ({ template, onSelect, isSelected }) => {
  return (
    <div 
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-xl
        ${isSelected ? 'ring-4 ring-blue-500' : ''}
      `}
      onClick={() => onSelect(template)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-200">
        <img 
          src={template.thumbnail} 
          alt={template.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{template.category}</p>
          </div>
          
          {/* Premium Badge */}
          {template.isPremium && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Premium
            </span>
          )}
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">
              {template.rating.average.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            ({template.rating.count} ratings)
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {template.usageCount} uses
          </span>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};
```

**Template Gallery Component:**

```jsx
// components/TemplateGallery.jsx
import React, { useState, useEffect } from 'react';
import { TemplateCard } from './TemplateCard';
import { getTemplates, getTemplateCategories } from '../api/templates';

export const TemplateGallery = ({ onSelectTemplate, selectedTemplateId }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, categoriesRes] = await Promise.all([
        getTemplates(),
        getTemplateCategories()
      ]);
      setTemplates(templatesRes.data);
      setCategories(['all', ...categoriesRes.data]);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const filters = category !== 'all' ? { category } : {};
      const response = await getTemplates(filters);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to filter templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
        <p className="text-gray-600">
          Select a template that best represents your style
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => filterTemplates(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template._id}
            template={template}
            onSelect={onSelectTemplate}
            isSelected={selectedTemplateId === template._id}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found matching your criteria</p>
        </div>
      )}
    </div>
  );
};
```

### 3. Schema-Based Form Generation

**Dynamic Form Builder:**

```jsx
// components/DynamicForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';

export const DynamicForm = ({ section, initialData = {}, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData
  });

  const renderField = (field) => {
    const baseClasses = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
    const errorClasses = errors[field.id] ? "border-red-500" : "border-gray-300";

    const validation = {};
    if (field.required) validation.required = `${field.label} is required`;
    if (field.validation?.minLength) validation.minLength = {
      value: field.validation.minLength,
      message: `Minimum length is ${field.validation.minLength}`
    };
    if (field.validation?.maxLength) validation.maxLength = {
      value: field.validation.maxLength,
      message: `Maximum length is ${field.validation.maxLength}`
    };
    if (field.validation?.pattern) validation.pattern = {
      value: new RegExp(field.validation.pattern),
      message: 'Invalid format'
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
            {...register(field.id, validation)}
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            className={`${baseClasses} ${errorClasses}`}
            {...register(field.id, validation)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`${baseClasses} ${errorClasses}`}
            {...register(field.id, {
              ...validation,
              valueAsNumber: true
            })}
          />
        );

      case 'checkbox':
      case 'toggle':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              {...register(field.id)}
            />
            <span>{field.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            className={`${baseClasses} ${errorClasses}`}
            {...register(field.id, validation)}
          >
            <option value="">Select {field.label}</option>
            {field.validation?.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'image':
      case 'video':
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="url"
              placeholder={`${field.label} URL`}
              className={`${baseClasses} ${errorClasses}`}
              {...register(field.id, validation)}
            />
            <p className="text-xs text-gray-500">
              {field.validation?.allowedFormats && 
                `Allowed formats: ${field.validation.allowedFormats.join(', ')}`
              }
            </p>
          </div>
        );

      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={`${baseClasses} ${errorClasses}`}
            {...register(field.id, validation)}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">{section.name}</h3>
        {section.description && (
          <p className="text-gray-600 mb-6">{section.description}</p>
        )}

        <div className="space-y-4">
          {section.fields.map(field => (
            <div key={field.id}>
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {field.uiHints?.helpText && (
                  <span className="block text-xs text-gray-500 mt-1">
                    {field.uiHints.helpText}
                  </span>
                )}
              </label>
              {renderField(field)}
              {errors[field.id] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors[field.id].message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Save {section.name}
      </button>
    </form>
  );
};
```

**Schema-Driven Portfolio Editor:**

```jsx
// components/PortfolioEditor.jsx
import React, { useState, useEffect } from 'react';
import { DynamicForm } from './DynamicForm';
import { getTemplateSchema } from '../api/templates';

export const PortfolioEditor = ({ templateId, portfolioData, onSave }) => {
  const [schema, setSchema] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState(portfolioData?.customData || {});

  useEffect(() => {
    loadSchema();
  }, [templateId]);

  const loadSchema = async () => {
    try {
      const response = await getTemplateSchema(templateId);
      setSchema(response.data.schema);
    } catch (error) {
      console.error('Failed to load schema:', error);
    }
  };

  const handleSectionSubmit = (sectionData) => {
    const section = schema.sections[currentSection];
    const updatedData = {
      ...formData,
      [section.id]: sectionData
    };
    setFormData(updatedData);

    // Move to next section or save
    if (currentSection < schema.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      onSave(updatedData);
    }
  };

  if (!schema) {
    return <div>Loading...</div>;
  }

  const currentSectionData = schema.sections[currentSection];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Section {currentSection + 1} of {schema.sections.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentSection + 1) / schema.sections.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentSection + 1) / schema.sections.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {schema.sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(index)}
            className={`
              px-4 py-2 rounded-lg whitespace-nowrap transition-colors
              ${currentSection === index
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {section.name}
          </button>
        ))}
      </div>

      {/* Current Section Form */}
      <DynamicForm
        section={currentSectionData}
        initialData={formData[currentSectionData.id]}
        onSubmit={handleSectionSubmit}
      />

      {/* Navigation Buttons */}
      {currentSection > 0 && (
        <button
          onClick={() => setCurrentSection(currentSection - 1)}
          className="mt-4 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Previous Section
        </button>
      )}
    </div>
  );
};
```

### 4. Real-Time Validation

**Validation Service:**

```javascript
// services/validationService.js
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const validateContent = async (templateId, content) => {
  try {
    const response = await axios.post(
      `${API_BASE}/templates/${templateId}/validate`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};

// Debounced validation for real-time checking
export const createDebouncedValidator = (templateId, delay = 500) => {
  let timeoutId;
  
  return (content) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validateContent(templateId, content);
        resolve(result);
      }, delay);
    });
  };
};
```

**Validation Hook:**

```javascript
// hooks/useValidation.js
import { useState, useEffect, useCallback } from 'react';
import { createDebouncedValidator } from '../services/validationService';

export const useValidation = (templateId, content) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validator = useCallback(
    createDebouncedValidator(templateId),
    [templateId]
  );

  useEffect(() => {
    if (!content || !templateId) return;

    const validate = async () => {
      setIsValidating(true);
      try {
        const result = await validator(content);
        setValidationResult(result.data);
      } catch (error) {
        console.error('Validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [content, templateId, validator]);

  return { validationResult, isValidating };
};
```

**Validation Display Component:**

```jsx
// components/ValidationDisplay.jsx
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const ValidationDisplay = ({ validationResult, isValidating }) => {
  if (isValidating) {
    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="text-blue-700">Validating...</span>
      </div>
    );
  }

  if (!validationResult) return null;

  if (validationResult.valid) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
        <span className="text-green-700 font-medium">Content is valid</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 bg-red-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <XCircleIcon className="w-5 h-5 text-red-500" />
        <span className="text-red-700 font-medium">
          {validationResult.errors.length} validation error(s)
        </span>
      </div>
      <ul className="space-y-1">
        {validationResult.errors.map((error, index) => (
          <li key={index} className="text-sm text-red-600">
            <strong>{error.section}</strong>
            {error.field && ` › ${error.field}`}: {error.error}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Usage Example:**

```jsx
// pages/EditPortfolio.jsx
import React, { useState } from 'react';
import { PortfolioEditor } from '../components/PortfolioEditor';
import { ValidationDisplay } from '../components/ValidationDisplay';
import { useValidation } from '../hooks/useValidation';

export const EditPortfolio = () => {
  const [templateId, setTemplateId] = useState('echelon');
  const [content, setContent] = useState({});
  
  const { validationResult, isValidating } = useValidation(templateId, content);

  const handleSave = async (data) => {
    setContent(data);
    
    // Wait for validation
    if (!validationResult?.valid) {
      alert('Please fix validation errors before saving');
      return;
    }
    
    // Save portfolio
    try {
      await axios.post('/api/portfolios', {
        templateId,
        customData: data
      });
      alert('Portfolio saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <ValidationDisplay 
        validationResult={validationResult}
        isValidating={isValidating}
      />
      
      <PortfolioEditor
        templateId={templateId}
        portfolioData={{ customData: content }}
        onSave={handleSave}
      />
    </div>
  );
};
```

### 5. Rating Templates

**Rating Component:**

```jsx
// components/TemplateRating.jsx
import React, { useState } from 'react';
import { Star } from '@heroicons/react/24/solid';
import { Star as StarOutline } from '@heroicons/react/24/outline';
import axios from 'axios';

export const TemplateRating = ({ templateId, currentRating, onRated }) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async (rating) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/api/templates/${templateId}/rating`,
        { rating },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      onRated?.(response.data.data.rating);
      alert('Thank you for your rating!');
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= (hoveredRating || currentRating);
          const StarIcon = isFilled ? Star : StarOutline;
          
          return (
            <button
              key={rating}
              disabled={isSubmitting}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => submitRating(rating)}
              className="transition-transform hover:scale-110 disabled:opacity-50"
            >
              <StarIcon 
                className={`w-8 h-8 ${
                  isFilled ? 'text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500">
        {hoveredRating ? `Rate ${hoveredRating} star${hoveredRating > 1 ? 's' : ''}` : 'Rate this template'}
      </p>
    </div>
  );
};
```

---

## React Implementation

### State Management with Zustand

**Template Store:**

```javascript
// stores/templateStore.js
import create from 'zustand';
import { getTemplates, getTemplateById, getTemplateSchema } from '../api/templates';

export const useTemplateStore = create((set, get) => ({
  templates: [],
  selectedTemplate: null,
  selectedSchema: null,
  loading: false,
  error: null,

  loadTemplates: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await getTemplates(filters);
      set({ templates: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectTemplate: async (templateId) => {
    set({ loading: true, error: null });
    try {
      const [templateRes, schemaRes] = await Promise.all([
        getTemplateById(templateId),
        getTemplateSchema(templateId)
      ]);
      set({
        selectedTemplate: templateRes.data,
        selectedSchema: schemaRes.data,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearSelection: () => {
    set({ selectedTemplate: null, selectedSchema: null });
  }
}));
```

**Portfolio Store:**

```javascript
// stores/portfolioStore.js
import create from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const usePortfolioStore = create((set, get) => ({
  portfolio: null,
  portfolios: [],
  loading: false,
  error: null,

  createPortfolio: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/portfolios`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      set({ portfolio: response.data.data.portfolio, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updatePortfolio: async (portfolioId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${API_BASE}/portfolios/${portfolioId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      set({ portfolio: response.data.data.portfolio, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/portfolios`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      set({ portfolios: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

---

## Step-by-Step Integration

### Step 1: Template Gallery/Selector

Create a page where users can browse and select templates.

```jsx
// pages/SelectTemplate.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateGallery } from '../components/TemplateGallery';
import { useTemplateStore } from '../stores/templateStore';

export const SelectTemplatePage = () => {
  const navigate = useNavigate();
  const { selectedTemplate, selectTemplate } = useTemplateStore();

  const handleSelectTemplate = async (template) => {
    await selectTemplate(template.templateId);
    navigate('/create-portfolio');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateId={selectedTemplate?._id}
      />
    </div>
  );
};
```

### Step 2: Form Generation from Schema

Generate forms dynamically based on the selected template's schema.

```jsx
// pages/CreatePortfolio.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortfolioEditor } from '../components/PortfolioEditor';
import { useTemplateStore } from '../stores/templateStore';
import { usePortfolioStore } from '../stores/portfolioStore';

export const CreatePortfolioPage = () => {
  const navigate = useNavigate();
  const { selectedTemplate, selectedSchema } = useTemplateStore();
  const { createPortfolio } = usePortfolioStore();

  if (!selectedTemplate) {
    navigate('/select-template');
    return null;
  }

  const handleSave = async (customData) => {
    try {
      await createPortfolio({
        title: 'My Portfolio',
        description: 'My professional portfolio',
        templateId: selectedTemplate._id,
        customData
      });
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to create portfolio');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Your Portfolio</h1>
      <PortfolioEditor
        templateId={selectedTemplate.templateId}
        portfolioData={null}
        onSave={handleSave}
      />
    </div>
  );
};
```

### Step 3: Content Validation Before Save

Validate content before submitting to ensure data integrity.

```jsx
// components/PortfolioEditor.jsx (Enhanced with validation)
import React, { useState } from 'react';
import { DynamicForm } from './DynamicForm';
import { ValidationDisplay } from './ValidationDisplay';
import { useValidation } from '../hooks/useValidation';
import { validateContent } from '../services/validationService';

export const PortfolioEditor = ({ templateId, portfolioData, onSave }) => {
  const [formData, setFormData] = useState(portfolioData?.customData || {});
  const [isSaving, setIsSaving] = useState(false);
  const { validationResult, isValidating } = useValidation(templateId, formData);

  const handleFinalSave = async () => {
    // Final validation check
    setIsSaving(true);
    try {
      const validation = await validateContent(templateId, formData);
      
      if (!validation.data.valid) {
        alert('Please fix all validation errors before saving');
        return;
      }
      
      await onSave(formData);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save portfolio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ValidationDisplay
        validationResult={validationResult}
        isValidating={isValidating}
      />
      
      {/* Form sections */}
      {/* ... */}
      
      <button
        onClick={handleFinalSave}
        disabled={isSaving || isValidating || !validationResult?.valid}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Portfolio'}
      </button>
    </div>
  );
};
```

### Step 4: Portfolio Creation Workflow

Complete workflow from template selection to portfolio creation.

```jsx
// App.jsx (Routes)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SelectTemplatePage } from './pages/SelectTemplate';
import { CreatePortfolioPage } from './pages/CreatePortfolio';
import { EditPortfolioPage } from './pages/EditPortfolio';
import { DashboardPage } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/select-template" element={<SelectTemplatePage />} />
        <Route path="/create-portfolio" element={<CreatePortfolioPage />} />
        <Route path="/edit-portfolio/:id" element={<EditPortfolioPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Best Practices

### 1. Caching Strategies

**LocalStorage Cache:**

```javascript
// utils/cache.js
const CACHE_KEY = 'templates_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const cacheTemplates = (templates) => {
  const cacheData = {
    templates,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
};

export const getCachedTemplates = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { templates, timestamp } = JSON.parse(cached);
  const isExpired = Date.now() - timestamp > CACHE_DURATION;
  
  return isExpired ? null : templates;
};

export const clearTemplateCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
```

**React Query Integration:**

```javascript
// hooks/useTemplates.js
import { useQuery } from '@tanstack/react-query';
import { getTemplates } from '../api/templates';

export const useTemplates = (filters = {}) => {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: () => getTemplates(filters),
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};
```

### 2. Error Handling Patterns

**Error Boundary Component:**

```jsx
// components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**API Error Handler:**

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'Server error occurred';
    const status = error.response.status;
    
    switch (status) {
      case 404:
        return 'Resource not found';
      case 401:
        return 'Please login to continue';
      case 403:
        return 'You do not have permission';
      case 500:
        return 'Server error. Please try again later';
      default:
        return message;
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection';
  } else {
    // Something else happened
    return error.message || 'An error occurred';
  }
};
```

### 3. UX Considerations

**Loading States:**

```jsx
// components/LoadingState.jsx
export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
);

export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 aspect-video rounded-lg mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);
```

**Empty States:**

```jsx
// components/EmptyState.jsx
export const EmptyState = ({ title, message, action }) => (
  <div className="text-center py-12">
    <svg className="mx-auto h-24 w-24 text-gray-400" /* ... */ />
    <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{message}</p>
    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
);
```

**Progressive Disclosure:**

```jsx
// Show sections one at a time
// Use accordion or stepper components
// Implement autosave to prevent data loss
```

---

## Common Pitfalls & Troubleshooting

### Issue 1: Schema Not Loading

**Problem:** Template schema returns undefined or empty

**Solution:**

```javascript
// Always check schema exists before rendering
const PortfolioEditor = ({ templateId }) => {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const response = await getTemplateSchema(templateId);
        if (!response.data.schema) {
          throw new Error('Invalid schema structure');
        }
        setSchema(response.data.schema);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSchema();
  }, [templateId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!schema?.sections) return <ErrorState message="Invalid schema" />;

  return <div>/* Render form */</div>;
};
```

### Issue 2: Validation Errors Not Displaying

**Problem:** Validation runs but errors don't show

**Solution:**

```javascript
// Ensure validation result structure is correct
const { validationResult } = useValidation(templateId, content);

// Check for errors array
if (validationResult?.errors && Array.isArray(validationResult.errors)) {
  validationResult.errors.forEach(error => {
    console.log(`Section: ${error.section}, Field: ${error.field}, Error: ${error.error}`);
  });
}

// Handle empty errors array
if (validationResult?.valid) {
  // Show success state
}
```

### Issue 3: Form Data Not Persisting

**Problem:** Form data lost on page refresh

**Solution:**

```javascript
// Implement autosave with localStorage
const useAutosave = (portfolioId, data) => {
  useEffect(() => {
    const key = `autosave_${portfolioId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }, [portfolioId, data]);

  const clearAutosave = () => {
    localStorage.removeItem(`autosave_${portfolioId}`);
  };

  return { clearAutosave };
};

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem(`autosave_${portfolioId}`);
  if (saved) {
    setFormData(JSON.parse(saved));
  }
}, [portfolioId]);
```

### Issue 4: Template List Not Filtering

**Problem:** Category/tag filters don't work

**Solution:**

```javascript
// Ensure filter params are correctly formatted
const filterTemplates = async (category, tags) => {
  const params = new URLSearchParams();
  
  if (category && category !== 'all') {
    params.append('category', category);
  }
  
  if (tags && tags.length > 0) {
    params.append('tags', tags.join(',')); // Comma-separated
  }
  
  const response = await axios.get(`/api/templates?${params.toString()}`);
  return response.data;
};
```

### Issue 5: CORS Errors

**Problem:** API requests blocked by CORS policy

**Solution:**

```javascript
// Backend: Ensure CORS is configured
// server.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Frontend: Include credentials if needed
axios.defaults.withCredentials = true;
```

---

## TypeScript Definitions

For TypeScript projects, use these type definitions:

```typescript
// types/template.ts
export interface Template {
  _id: string;
  templateId: string;
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  schema: TemplateSchema;
  caseStudySchema?: CaseStudySchema;
  thumbnail: string;
  previewImages?: string[];
  demoUrl?: string;
  version: string;
  versionHistory: VersionHistory[];
  features?: string[];
  requiredPlugins?: Plugin[];
  compatibility?: Compatibility;
  isActive: boolean;
  isDefault: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: Rating;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 
  | 'creative'
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'professional'
  | 'artistic'
  | 'portfolio'
  | 'business';

export interface TemplateSchema {
  sections: Section[];
  styling: Styling;
  layout: Layout;
}

export interface Section {
  id: string;
  type: string;
  variant: string;
  name: string;
  description?: string;
  required: boolean;
  order: number;
  styling?: SectionStyling;
  fields: Field[];
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: Validation;
  uiHints?: UIHints;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'email'
  | 'url'
  | 'tel'
  | 'number'
  | 'array'
  | 'object'
  | 'checkbox'
  | 'toggle'
  | 'image'
  | 'video'
  | 'file'
  | 'select';

export interface Validation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedFormats?: string[];
  options?: string[];
}

export interface UIHints {
  helpText?: string;
  order?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  section: string;
  field?: string;
  error: string;
}

export interface Rating {
  average: number;
  count: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TemplatesResponse {
  success: boolean;
  message: string;
  data: Template[];
}

export interface TemplateResponse {
  success: boolean;
  message: string;
  data: Template;
}
```

---

## Performance Optimization

### 1. Lazy Loading Components

```javascript
import { lazy, Suspense } from 'react';

const TemplateGallery = lazy(() => import('./components/TemplateGallery'));
const PortfolioEditor = lazy(() => import('./components/PortfolioEditor'));

function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TemplateGallery />
    </Suspense>
  );
}
```

### 2. Memoization

```javascript
import { memo, useMemo } from 'react';

export const TemplateCard = memo(({ template, onSelect, isSelected }) => {
  // Component only re-renders if props change
  return (/* ... */);
});

// Memoize expensive computations
const filteredTemplates = useMemo(() => {
  return templates.filter(t => t.category === selectedCategory);
}, [templates, selectedCategory]);
```

### 3. Virtual Scrolling

```javascript
import { FixedSizeGrid } from 'react-window';

export const TemplateGrid = ({ templates }) => {
  return (
    <FixedSizeGrid
      columnCount={3}
      columnWidth={300}
      height={600}
      rowCount={Math.ceil(templates.length / 3)}
      rowHeight={400}
      width={950}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * 3 + columnIndex;
        const template = templates[index];
        if (!template) return null;
        return (
          <div style={style}>
            <TemplateCard template={template} />
          </div>
        );
      }}
    </FixedSizeGrid>
  );
};
```

---

## Additional Resources

- **Backend Guide**: `/AUREA---Backend/TEMPLATE_SYSTEM_GUIDE.md`
- **Backend Architecture**: `/AUREA---Backend/BACKEND_DYNAMIC_TEMPLATE_SYSTEM.md`
- **Test Suite**: `/AUREA---Backend/test/test-template-system.js`
- **API Documentation**: Swagger at `http://localhost:5000/api-docs`

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0  
**Maintained by:** Aurea Development Team
