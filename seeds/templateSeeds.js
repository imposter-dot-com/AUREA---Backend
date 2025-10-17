import mongoose from 'mongoose';
import Template from '../src/models/Template.js';
import dotenv from 'dotenv';

dotenv.config();

// Echelon Template - Classic, minimal design
const echelonTemplate = {
  templateId: 'echelon',
  name: 'Echelon',
  slug: 'echelon',
  description: 'A minimalist portfolio template with focus on typography and clean layouts',
  category: 'classic',
  thumbnail: 'https://via.placeholder.com/400x300?text=Echelon+Template',
  version: '1.0.0',
  isActive: true,
  isDefault: true,
  isPremium: false,
  tags: ['minimal', 'typography', 'classic', 'clean', 'professional'],

  schema: {
    sections: [
      {
        id: 'hero',
        name: 'Hero Section',
        required: true, // Cannot be deleted
        order: 1,
        fields: [
          {
            id: 'title',
            type: 'string',
            label: 'Hero Title',
            required: false,
            placeholder: 'DESIGNING WITH PRECISION',
            maxLength: 200
          },
          {
            id: 'subtitle',
            type: 'string',
            label: 'Hero Subtitle',
            required: false,
            placeholder: 'Case studies in clarity and form',
            maxLength: 300
          }
        ]
      },
      {
        id: 'about',
        name: 'About Section',
        required: false, // Can be deleted
        order: 2,
        fields: [
          {
            id: 'name',
            type: 'string',
            label: 'Your Name',
            required: true,
            placeholder: 'JOHN DESIGNER',
            maxLength: 100
          },
          {
            id: 'image',
            type: 'image',
            label: 'Profile Photo',
            required: false,
            placeholder: 'Upload your professional photo'
          },
          {
            id: 'bio',
            type: 'textarea',
            label: 'Biography',
            required: false,
            placeholder: 'I am a designer focused on minimalism, clarity, and modernist design systems...',
            maxLength: 1000
          }
        ]
      },
      {
        id: 'work',
        name: 'Work Section',
        required: false, // Can be deleted
        order: 3,
        fields: [
          {
            id: 'heading',
            type: 'string',
            label: 'Work Section Title',
            required: false,
            placeholder: 'SELECTED WORK',
            maxLength: 100
          },
          {
            id: 'projects',
            type: 'array',
            label: 'Projects',
            maxItems: 12,
            itemSchema: {
              id: {
                type: 'number',
                autoGenerate: true
              },
              title: {
                type: 'string',
                label: 'Project Title',
                required: true,
                placeholder: 'BRAND IDENTITY SYSTEM',
                maxLength: 200
              },
              description: {
                type: 'textarea',
                label: 'Project Description',
                required: false,
                placeholder: 'Comprehensive brand identity and guidelines...',
                maxLength: 500
              },
              image: {
                type: 'image',
                label: 'Project Cover Image',
                required: false
              },
              meta: {
                type: 'string',
                label: 'Project Meta Info',
                required: false,
                placeholder: '2024 — Branding'
              },
              category: {
                type: 'select',
                label: 'Category',
                required: false,
                options: ['branding', 'web-design', 'ux-ui', 'print', 'motion', 'other']
              },
              hasCaseStudy: {
                type: 'boolean',
                label: 'Has Case Study',
                default: false
              }
            }
          }
        ]
      },
      {
        id: 'contact',
        name: 'Contact Section',
        required: false, // Can be deleted
        order: 4,
        fields: [
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: false
          },
          {
            id: 'phone',
            type: 'string',
            label: 'Phone Number',
            required: false
          },
          {
            id: 'social',
            type: 'object',
            label: 'Social Links',
            fields: [
              {
                id: 'linkedin',
                type: 'url',
                label: 'LinkedIn'
              },
              {
                id: 'twitter',
                type: 'url',
                label: 'Twitter'
              },
              {
                id: 'github',
                type: 'url',
                label: 'GitHub'
              },
              {
                id: 'instagram',
                type: 'url',
                label: 'Instagram'
              }
            ]
          }
        ]
      }
    ],
    layout: {
      type: 'single-page',
      options: ['single-page', 'multi-page']
    },
    styling: {
      colorScheme: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FF0000',
        background: '#FFFFFF',
        text: '#000000'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        scale: 'default'
      },
      spacing: 'default'
    }
  },

  caseStudySchema: {
    enabled: true,
    fields: [
      {
        id: 'category',
        type: 'string',
        label: 'Case Study Category',
        required: false,
        placeholder: 'BRANDING / IDENTITY — 2025'
      },
      {
        id: 'title',
        type: 'string',
        label: 'Case Study Title',
        required: true,
        placeholder: 'LOGO DESIGN PROCESS',
        maxLength: 200
      },
      {
        id: 'intro',
        type: 'textarea',
        label: 'Introduction',
        required: false,
        placeholder: 'In this article I will share my design process...',
        maxLength: 1000
      },
      {
        id: 'heroImage',
        type: 'image',
        label: 'Hero Image',
        required: false
      },
      {
        id: 'heroCaption',
        type: 'string',
        label: 'Hero Image Caption',
        required: false,
        placeholder: 'Figure 01 — Design Process Framework'
      },
      {
        id: 'authorName',
        type: 'string',
        label: 'Author Name',
        required: false
      },
      {
        id: 'sections',
        type: 'array',
        label: 'Case Study Sections',
        maxItems: 10,
        itemSchema: {
          number: {
            type: 'string',
            label: 'Section Number',
            placeholder: '01'
          },
          title: {
            type: 'string',
            label: 'Section Title',
            placeholder: 'RESEARCH'
          },
          subsections: {
            type: 'array',
            label: 'Subsections',
            maxItems: 5,
            itemSchema: {
              title: {
                type: 'string',
                label: 'Subsection Title',
                placeholder: '01.1 QUESTIONNAIRE'
              },
              content: {
                type: 'richtext',
                label: 'Content',
                placeholder: 'After receiving an email and discussing terms...'
              },
              image: {
                type: 'image',
                label: 'Section Image'
              },
              imageCaption: {
                type: 'string',
                label: 'Image Caption',
                placeholder: 'Figure 02 — Keyword Analysis'
              },
              highlighted: {
                type: 'boolean',
                label: 'Highlight Section',
                default: false
              },
              imageLarge: {
                type: 'boolean',
                label: 'Large Image Display',
                default: false
              },
              dark: {
                type: 'boolean',
                label: 'Dark Background',
                default: false
              }
            }
          }
        }
      }
    ]
  }
};

// Modern Template - Bold, dynamic design
const modernTemplate = {
  templateId: 'modern-v1',
  name: 'Modern Bold',
  slug: 'modern-bold',
  description: 'A contemporary portfolio template with bold typography and dynamic layouts',
  category: 'modern',
  thumbnail: 'https://via.placeholder.com/400x300?text=Modern+Template',
  version: '1.0.0',
  isActive: true,
  isDefault: false,
  isPremium: false,
  tags: ['modern', 'bold', 'dynamic', 'creative', 'colorful'],

  schema: {
    sections: [
      {
        id: 'hero',
        name: 'Hero Section',
        required: true, // Cannot be deleted
        order: 1,
        fields: [
          {
            id: 'title',
            type: 'string',
            label: 'Hero Title',
            required: false,
            placeholder: 'Creative Portfolio',
            maxLength: 200
          },
          {
            id: 'subtitle',
            type: 'string',
            label: 'Hero Subtitle',
            required: false,
            placeholder: 'Pushing boundaries through design',
            maxLength: 300
          },
          {
            id: 'backgroundImage',
            type: 'image',
            label: 'Hero Background Image',
            required: false
          },
          {
            id: 'ctaButton',
            type: 'object',
            label: 'Call to Action Button',
            fields: [
              {
                id: 'text',
                type: 'string',
                label: 'Button Text',
                placeholder: 'View My Work'
              },
              {
                id: 'link',
                type: 'string',
                label: 'Button Link',
                placeholder: '#work'
              }
            ]
          }
        ]
      },
      {
        id: 'about',
        name: 'About Section',
        required: false, // Can be deleted
        order: 2,
        fields: [
          {
            id: 'name',
            type: 'string',
            label: 'Your Name',
            required: true,
            placeholder: 'Jane Creative',
            maxLength: 100
          },
          {
            id: 'title',
            type: 'string',
            label: 'Professional Title',
            required: false,
            placeholder: 'Creative Director & Designer',
            maxLength: 100
          },
          {
            id: 'image',
            type: 'image',
            label: 'Profile Photo',
            required: false
          },
          {
            id: 'bio',
            type: 'richtext',
            label: 'Biography',
            required: false,
            placeholder: 'A passionate creative professional...',
            maxLength: 2000
          },
          {
            id: 'skills',
            type: 'array',
            label: 'Skills',
            maxItems: 10,
            itemSchema: {
              name: {
                type: 'string',
                label: 'Skill',
                placeholder: 'UI/UX Design'
              },
              level: {
                type: 'number',
                label: 'Proficiency (1-100)',
                min: 1,
                max: 100
              }
            }
          }
        ]
      },
      {
        id: 'projects',
        name: 'Projects Section',
        required: false, // Can be deleted
        order: 3,
        fields: [
          {
            id: 'heading',
            type: 'string',
            label: 'Section Title',
            required: false,
            placeholder: 'Featured Projects',
            maxLength: 100
          },
          {
            id: 'displayStyle',
            type: 'select',
            label: 'Display Style',
            options: ['grid', 'masonry', 'carousel', 'list'],
            default: 'grid'
          },
          {
            id: 'items',
            type: 'array',
            label: 'Project Items',
            maxItems: 20,
            itemSchema: {
              id: {
                type: 'number',
                autoGenerate: true
              },
              title: {
                type: 'string',
                label: 'Project Title',
                required: true,
                maxLength: 200
              },
              subtitle: {
                type: 'string',
                label: 'Project Subtitle',
                required: false,
                maxLength: 150
              },
              description: {
                type: 'richtext',
                label: 'Project Description',
                required: false,
                maxLength: 1000
              },
              image: {
                type: 'image',
                label: 'Project Cover Image',
                required: true
              },
              gallery: {
                type: 'array',
                label: 'Project Gallery',
                itemSchema: {
                  image: {
                    type: 'image'
                  },
                  caption: {
                    type: 'string'
                  }
                }
              },
              category: {
                type: 'select',
                label: 'Category',
                required: false,
                options: ['branding', 'web-design', 'mobile-app', 'ux-ui', 'illustration', 'motion', 'photography', 'other']
              },
              year: {
                type: 'string',
                label: 'Year',
                placeholder: '2024'
              },
              client: {
                type: 'string',
                label: 'Client Name'
              },
              link: {
                type: 'url',
                label: 'Project Link'
              },
              hasCaseStudy: {
                type: 'boolean',
                label: 'Has Case Study',
                default: false
              }
            }
          }
        ]
      },
      {
        id: 'testimonials',
        name: 'Testimonials Section',
        required: false, // Can be deleted
        order: 4,
        fields: [
          {
            id: 'heading',
            type: 'string',
            label: 'Section Title',
            placeholder: 'What Clients Say'
          },
          {
            id: 'items',
            type: 'array',
            label: 'Testimonials',
            maxItems: 6,
            itemSchema: {
              quote: {
                type: 'textarea',
                label: 'Testimonial',
                required: true
              },
              author: {
                type: 'string',
                label: 'Author Name',
                required: true
              },
              role: {
                type: 'string',
                label: 'Author Role/Company'
              },
              image: {
                type: 'image',
                label: 'Author Photo'
              }
            }
          }
        ]
      },
      {
        id: 'contact',
        name: 'Contact Section',
        required: false, // Can be deleted
        order: 5,
        fields: [
          {
            id: 'heading',
            type: 'string',
            label: 'Section Title',
            placeholder: 'Get In Touch'
          },
          {
            id: 'subheading',
            type: 'string',
            label: 'Section Subtitle',
            placeholder: 'Let\'s create something amazing together'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true
          },
          {
            id: 'phone',
            type: 'string',
            label: 'Phone Number',
            required: false
          },
          {
            id: 'location',
            type: 'string',
            label: 'Location',
            placeholder: 'New York, USA'
          },
          {
            id: 'social',
            type: 'object',
            label: 'Social Links',
            fields: [
              {
                id: 'linkedin',
                type: 'url',
                label: 'LinkedIn'
              },
              {
                id: 'twitter',
                type: 'url',
                label: 'Twitter'
              },
              {
                id: 'github',
                type: 'url',
                label: 'GitHub'
              },
              {
                id: 'instagram',
                type: 'url',
                label: 'Instagram'
              },
              {
                id: 'behance',
                type: 'url',
                label: 'Behance'
              },
              {
                id: 'dribbble',
                type: 'url',
                label: 'Dribbble'
              }
            ]
          }
        ]
      }
    ],
    layout: {
      type: 'single-page',
      options: ['single-page', 'multi-page', 'sidebar', 'centered']
    },
    styling: {
      colorScheme: {
        primary: '#6366F1',
        secondary: '#F3F4F6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      typography: {
        headingFont: 'Poppins',
        bodyFont: 'Inter',
        scale: 'large'
      },
      spacing: 'spacious',
      animations: {
        enabled: true,
        type: 'fade-in'
      }
    }
  },

  caseStudySchema: {
    enabled: true,
    fields: [
      {
        id: 'title',
        type: 'string',
        label: 'Case Study Title',
        required: true,
        maxLength: 200
      },
      {
        id: 'subtitle',
        type: 'string',
        label: 'Subtitle',
        maxLength: 150
      },
      {
        id: 'client',
        type: 'string',
        label: 'Client Name'
      },
      {
        id: 'year',
        type: 'string',
        label: 'Year'
      },
      {
        id: 'role',
        type: 'string',
        label: 'Your Role'
      },
      {
        id: 'heroImage',
        type: 'image',
        label: 'Hero Image',
        required: false
      },
      {
        id: 'overview',
        type: 'richtext',
        label: 'Project Overview',
        maxLength: 2000
      },
      {
        id: 'challenge',
        type: 'richtext',
        label: 'The Challenge',
        maxLength: 1500
      },
      {
        id: 'solution',
        type: 'richtext',
        label: 'The Solution',
        maxLength: 1500
      },
      {
        id: 'process',
        type: 'array',
        label: 'Design Process',
        maxItems: 8,
        itemSchema: {
          phase: {
            type: 'string',
            label: 'Phase Name'
          },
          description: {
            type: 'richtext',
            label: 'Phase Description'
          },
          images: {
            type: 'array',
            label: 'Phase Images',
            itemSchema: {
              image: {
                type: 'image'
              },
              caption: {
                type: 'string'
              }
            }
          }
        }
      },
      {
        id: 'results',
        type: 'richtext',
        label: 'Results & Impact',
        maxLength: 1500
      },
      {
        id: 'testimonial',
        type: 'object',
        label: 'Client Testimonial',
        fields: [
          {
            id: 'quote',
            type: 'textarea',
            label: 'Testimonial Quote'
          },
          {
            id: 'author',
            type: 'string',
            label: 'Author'
          },
          {
            id: 'role',
            type: 'string',
            label: 'Role'
          }
        ]
      },
      {
        id: 'gallery',
        type: 'array',
        label: 'Project Gallery',
        itemSchema: {
          image: {
            type: 'image'
          },
          caption: {
            type: 'string'
          },
          fullWidth: {
            type: 'boolean',
            default: false
          }
        }
      }
    ]
  }
};

const templates = [echelonTemplate, modernTemplate];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing templates (optional - comment out if you want to preserve existing templates)
    await Template.deleteMany({});
    console.log('🗑️  Cleared existing templates');

    // Insert new templates
    const insertedTemplates = await Template.insertMany(templates);
    console.log(`✅ Successfully seeded ${insertedTemplates.length} templates`);

    // Log template details
    insertedTemplates.forEach(template => {
      console.log(`  - ${template.name} (ID: ${template.templateId})`);
    });

    return insertedTemplates;
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedTemplates()
    .then(() => {
      console.log('✅ Template seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Template seeding failed:', error);
      process.exit(1);
    });
}

export default seedTemplates;