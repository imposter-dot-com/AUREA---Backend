import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to process template data structure
function processTemplateData(inputData) {
  // Check if it's portfolio JSON structure (with sections array)
  if (inputData.sections) {
    const sections = {};
    inputData.sections.forEach(section => {
      sections[section.type] = section.content;
    });
    
    // Handle projects data properly
    const projectsContent = sections.projects || [];
    const hasProjects = Array.isArray(projectsContent) && projectsContent.length > 0;
    
    // Use actual user data, don't fallback to default projects
    const finalProjects = hasProjects ? projectsContent : [];
    const totalTags = finalProjects.reduce((total, project) => total + (project.tags?.length || 0), 0);
    
    return {
      hero: sections.hero || {},
      about: sections.about || {},
      portfolio: { 
        heading: "My Work",
        projects: finalProjects,
        projectsCount: finalProjects.length.toString(),
        technologiesCount: totalTags.toString(),
        successRate: "100%",
        support: "24/7"
      },
      contact: sections.contact || {},
      styling: inputData.styling
    };
  }
  
  // Check if it's template structure (with content object)
  if (inputData.content) {
    return {
      hero: inputData.content.hero || {},
      about: inputData.content.about || {},
      portfolio: inputData.content.portfolio || {},
      contact: inputData.content.contact || {},
      styling: inputData.styling
    };
  }
  
  // Return as-is if it's already in the expected format
  return inputData;
}

// Default template data structure for fallback
// Default template data structure for fallback
const defaultTemplateData = {
  hero: {
    name: "Your Name",
    title: "Creative Professional",
    description: "Passionate about creating beautiful, functional designs that tell stories and solve problems.",
    image: ""
  },
  about: {
    heading: "About Me",
    content: "I'm a creative professional with experience in visual design, branding, and user experience.",
    image: "",
    skills: ["UI/UX Design", "Branding", "Typography", "Illustration", "Problem Solving", "Creative Thinking"]
  },
  portfolio: {
    heading: "My Work",
    projects: [
      {
        id: 1,
        title: "Project One",
        description: "Description of your amazing project",
        image: "",
        tags: ["Design", "Development"]
      },
      {
        id: 2,
        title: "Project Two",
        description: "Description of your amazing project",
        image: "",
        tags: ["Branding", "UI/UX"]
      },
      {
        id: 3,
        title: "Project Three",
        description: "Description of your amazing project",
        image: "",
        tags: ["Web Design", "Frontend"]
      }
    ],
    projectsCount: "3",
    technologiesCount: "12",
    successRate: "100%",
    support: "24/7"
  },
  contact: {
    heading: "Let's Work Together",
    description: "I'm always interested in new projects and opportunities.",
    social_links: [
      { platform: "LinkedIn", url: "https://linkedin.com/in/yourname" },
      { platform: "Email", url: "mailto:your@email.com" },
      { platform: "Phone", url: "tel:+1234567890" }
    ]
  },
  styling: {
    colors: {
      primary: "#1f2937",
      secondary: "#6b7280",
      accent: "#3b82f6",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1f2937",
      textSecondary: "#6b7280"
    }
  }
};

// Generate the exact HTML matching the React template
const generateExactHTML = (inputData = null) => {
  // Process input data or use default
  const processedData = inputData ? processTemplateData(inputData) : defaultTemplateData;
  const templateData = { ...defaultTemplateData, ...processedData };
  
  // Apply custom styling if provided
  const styling = templateData.styling || defaultTemplateData.styling;
  
  // Use font from JSON styling
  const primaryFont = styling.fonts?.heading || styling.fonts?.body || 'Poppins';
  const fontName = primaryFont.charAt(0).toUpperCase() + primaryFont.slice(1);
  
  // Get spacing, borderRadius, and shadows from styling
  const spacing = styling.spacing || {};
  const borderRadius = styling.borderRadius || {};
  const shadows = styling.shadows || {};
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.hero.name} - ${templateData.hero.title} Portfolio</title>
  <meta name="description" content="${templateData.hero.description}">
  <!-- <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"> -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        fontFamily: {
          sans: ["${fontName}"]
        },
        extend: {
          colors: {
            primary: '${styling.colors?.primary || '#1f2937'}',
            secondary: '${styling.colors?.secondary || '#6b7280'}',
            accent: '${styling.colors?.accent || '#3b82f6'}',
            background: '${styling.colors?.background || '#ffffff'}',
            surface: '${styling.colors?.surface || '#f8fafc'}',
            text: '${styling.colors?.text || '#1f2937'}',
            textSecondary: '${styling.colors?.textSecondary || '#6b7280'}'
          },
          spacing: {
            section: '${spacing.section || '5rem'}',
            element: '${spacing.element || '2rem'}',
            tight: '${spacing.tight || '1rem'}'
          },
          borderRadius: {
            'custom-sm': '${borderRadius.small || '0.375rem'}',
            'custom-md': '${borderRadius.medium || '0.5rem'}',
            'custom-lg': '${borderRadius.large || '0.75rem'}'
          },
          boxShadow: {
            'custom-sm': '${shadows.small || '0 1px 2px 0 rgb(0 0 0 / 0.05)'}',
            'custom-md': '${shadows.medium || '0 4px 6px -1px rgb(0 0 0 / 0.1)'}',
            'custom-lg': '${shadows.large || '0 10px 15px -3px rgb(0 0 0 / 0.1)'}'
          },
          animation: {
            'blob': 'blob 7s infinite',
            'blob-delay-2': 'blob 7s infinite 2s',
            'blob-delay-4': 'blob 7s infinite 4s',
          },
          keyframes: {
            blob: {
              '0%': {
                transform: 'translate(0px, 0px) scale(1)',
              },
              '33%': {
                transform: 'translate(30px, -50px) scale(1.1)',
              },
              '66%': {
                transform: 'translate(-20px, 20px) scale(0.9)',
              },
              '100%': {
                transform: 'translate(0px, 0px) scale(1)',
              },
            }
          }
        }
      }
    }
  </script>
  <style>
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
    
    /* Masonry Grid Styles */
    .masonry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    @media (min-width: 768px) {
      .masonry-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }
      .masonry-large {
        grid-column: span 2;
        grid-row: span 2;
      }
      .masonry-medium {
        grid-row: span 2;
      }
    }
  </style>
</head>
<body class="font-sans bg-white">
  <!-- Hero Section -->
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden" style="background-color: #ffffff;">
    <!-- Animated Background Blobs -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-4 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute -top-4 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
    
    <div class="text-center max-w-5xl mx-auto px-6 relative z-10">
      <div class="mb-8">
        <!-- Profile Image with Decorative Rings -->
        <div class="relative inline-block mb-8">
          ${templateData.hero.image ? `
          <div class="w-40 h-40 rounded-full mx-auto ring-4 ring-white shadow-2xl relative overflow-hidden">
            <img 
              src="${templateData.hero.image}" 
              alt="${templateData.hero.name}" 
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          ` : `
          <div class="w-40 h-40 rounded-full mx-auto ring-4 ring-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <p class="text-xs text-gray-500">Profile</p>
            </div>
          </div>
          `}
          <!-- Decorative rings -->
          <div class="absolute -inset-4 rounded-full border-2 border-blue-200 opacity-30 animate-ping pointer-events-none"></div>
          <div class="absolute -inset-8 rounded-full border border-purple-200 opacity-20 animate-pulse pointer-events-none"></div>
        </div>
        
        <h1 class="text-6xl lg:text-7xl font-bold mb-6 text-black">
          ${templateData.hero.name}
        </h1>
        
        <h2 class="text-2xl lg:text-3xl mb-8 text-gray-600 font-light">
          ${templateData.hero.title}
        </h2>
        
        <p class="text-xl max-w-3xl mx-auto leading-relaxed text-gray-700 mb-12">
          ${templateData.hero.description}
        </p>
        
        <div class="text-center">
          <p class="text-lg text-gray-600 font-medium">Scroll to see my work</p>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section class="py-20 relative" style="background-color: #f8fafc;">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-4xl font-bold mb-6">
            ${templateData.about.heading}
          </h2>
          
          <p class="text-lg leading-relaxed mb-8">
            ${templateData.about.content}
          </p>
          
          <div>
            <h3 class="text-xl font-semibold mb-4">Skills</h3>
            <div class="flex flex-wrap gap-3">
              ${templateData.about.skills.map(skill => `
              <span class="px-3 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                ${skill}
              </span>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div>
          ${templateData.about.image ? `
          <div class="aspect-square rounded-lg relative overflow-hidden">
            <img 
              src="${templateData.about.image}" 
              alt="About ${templateData.hero.name}" 
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          ` : `
          <div class="aspect-square rounded-lg relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div class="text-center">
              <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-gray-600 font-medium">About Image</p>
            </div>
          </div>
          `}
        </div>
      </div>
    </div>
  </section>

  <!-- Portfolio Section -->
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-6">
      <h2 class="text-5xl font-bold text-center mb-16">
        ${templateData.portfolio.heading}
      </h2>
      
      <!-- Masonry Portfolio Grid -->
      <div class="masonry-grid">
        ${templateData.portfolio.projects.length === 0 ? `
        <div class="col-span-full text-center py-20">
          <div class="max-w-lg mx-auto">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">No Projects Yet</h3>
            <p class="text-gray-600">Projects will appear here once they're added to your portfolio.</p>
          </div>
        </div>
        ` : templateData.portfolio.projects.map((project, index) => {
          const isLarge = index === 0 || (index + 1) % 4 === 0;
          const isMedium = (index + 1) % 3 === 0;
          
          return `
        <div class="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden ${
          isLarge ? 'masonry-large' : isMedium ? 'masonry-medium' : ''
        }">
          <!-- Project Image -->
          <div class="relative overflow-hidden ${
            isLarge ? 'aspect-[4/3]' : isMedium ? 'aspect-[3/4]' : 'aspect-[4/3]'
          }">
            <div class="w-full h-full object-cover bg-gradient-to-br ${
              index === 0 ? 'from-purple-100 to-pink-100' : 
              index === 1 ? 'from-blue-100 to-cyan-100' : 
              'from-yellow-100 to-orange-100'
            } flex items-center justify-center group">
              <div class="text-center transform group-hover:scale-110 transition-transform duration-700">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                      index === 0 ? 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z' : 
                      index === 1 ? 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' : 
                      'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.414a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 005.586 6H4a2 2 0 00-2 2v4a2 2 0 002 2h2m10-4v6m0 0l-3-3m3 3l3-3'
                    }"></path>
                  </svg>
                </div>
                <p class="text-gray-600 font-medium">Project Image</p>
              </div>
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2 text-gray-900 ${isLarge ? 'lg:text-3xl' : ''}">
              ${project.title}
            </h3>
            <p class="text-gray-600 mb-4">
              ${project.description}
            </p>
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              ${project.tags.map(tag => `
              <span class="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                ${tag}
              </span>
              `).join('')}
            </div>
          </div>
        </div>
          `;
        }).join('')}
      </div>
      
      <!-- Portfolio Statistics -->
      <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm">
          <div class="text-3xl font-bold text-gray-900">${templateData.portfolio.projectsCount || '0'}</div>
          <div class="text-sm text-gray-600 mt-1">Projects</div>
        </div>
        <div class="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm">
          <div class="text-3xl font-bold text-gray-900">${templateData.portfolio.technologiesCount || '0'}</div>
          <div class="text-sm text-gray-600 mt-1">Technologies</div>
        </div>
        <div class="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm">
          <div class="text-3xl font-bold text-gray-900">${templateData.portfolio.successRate || '100%'}</div>
          <div class="text-sm text-gray-600 mt-1">Success Rate</div>
        </div>
        <div class="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm">
          <div class="text-3xl font-bold text-gray-900">${templateData.portfolio.support || '24/7'}</div>
          <div class="text-sm text-gray-600 mt-1">Support</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="py-20 relative" style="background-color: #f8fafc;">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl font-bold mb-6">
        ${templateData.contact.heading}
      </h2>
      
      <p class="text-lg mb-12">
        ${templateData.contact.description}
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${templateData.contact.social_links.map((link) => `
        <a
          href="${link.url}"
          class="block p-6 bg-white rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="text-2xl font-semibold capitalize">${link.platform}</div>
          <div class="text-gray-600 mt-2">Connect with me</div>
        </a>
        `).join('')}
      </div>
    </div>
  </section>

  <script>
    // Smooth scroll behavior for any internal links
    document.addEventListener('DOMContentLoaded', function() {
      // Add smooth scrolling animation
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Add intersection observer for fade-in animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, observerOptions);
      
      // Observe all sections
      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
      });
      
      // Trigger first section immediately
      document.querySelector('section').style.opacity = '1';
      document.querySelector('section').style.transform = 'translateY(0)';
    });
  </script>
</body>
</html>`;

  return html;
};

// Sample version with actual data
const sampleData = {
  hero: {
    name: "Sarah Johnson",
    title: "Creative Designer",
    description: "Passionate about creating beautiful, functional designs that tell stories and solve problems.",
    image: ""
  },
  about: {
    heading: "About Me",
    content: "I'm a creative designer with over 5 years of experience in visual design, branding, and user experience. I believe in the power of good design to transform ideas into compelling visual narratives.",
    image: "",
    skills: ["UI/UX Design", "Branding", "Typography", "Illustration", "Figma", "Adobe Creative Suite"]
  },
  portfolio: {
    heading: "My Work",
    projects: [
      {
        id: 1,
        title: "Brand Identity for TechFlow",
        description: "Complete brand identity design for a technology startup including logo, color palette, and brand guidelines.",
        image: "",
        tags: ["Branding", "Logo Design"]
      },
      {
        id: 2,
        title: "Mobile App Design",
        description: "User interface design for a fitness tracking mobile application with focus on user experience and engagement.",
        image: "",
        tags: ["Mobile Design", "UI/UX"]
      },
      {
        id: 3,
        title: "Print Campaign Design",
        description: "Marketing collateral design for a luxury hotel chain including brochures, business cards, and signage.",
        image: "",
        tags: ["Print Design", "Marketing"]
      }
    ],
    projectsCount: "3",
    technologiesCount: "12",
    successRate: "100%",
    support: "24/7"
  },
  contact: {
    heading: "Let's Work Together",
    description: "I'm always interested in new projects and opportunities.",
    social_links: [
      { platform: "LinkedIn", url: "https://linkedin.com/in/sarahjohnson" },
      { platform: "Dribbble", url: "https://dribbble.com/sarahjohnson" },
      { platform: "Behance", url: "https://behance.net/sarahjohnson" }
    ]
  }
};

const generateSampleExactHTML = (data) => {
  // Replace template placeholders with actual data
  let html = generateExactHTML();
  
  // Replace hero section
  html = html.replace(/\{\{hero\.name\}\}/g, data.hero.name);
  html = html.replace(/\{\{hero\.title\}\}/g, data.hero.title);
  html = html.replace(/\{\{hero\.description\}\}/g, data.hero.description);
  
  // Replace about section
  html = html.replace(/\{\{about\.heading\}\}/g, data.about.heading);
  html = html.replace(/\{\{about\.content\}\}/g, data.about.content);
  data.about.skills.forEach((skill, index) => {
    html = html.replace(new RegExp(`\\{\\{about\\.skills\\.${index}\\}\\}`, 'g'), skill);
  });
  
  // Replace portfolio section
  html = html.replace(/\{\{portfolio\.heading\}\}/g, data.portfolio.heading);
  data.portfolio.projects.forEach((project, index) => {
    html = html.replace(new RegExp(`\\{\\{portfolio\\.projects\\.${index}\\.title\\}\\}`, 'g'), project.title);
    html = html.replace(new RegExp(`\\{\\{portfolio\\.projects\\.${index}\\.description\\}\\}`, 'g'), project.description);
    project.tags.forEach((tag, tagIndex) => {
      html = html.replace(new RegExp(`\\{\\{portfolio\\.projects\\.${index}\\.tags\\.${tagIndex}\\}\\}`, 'g'), tag);
    });
  });
  html = html.replace(/\{\{portfolio\.projectsCount\}\}/g, data.portfolio.projectsCount);
  html = html.replace(/\{\{portfolio\.technologiesCount\}\}/g, data.portfolio.technologiesCount);
  html = html.replace(/\{\{portfolio\.successRate\}\}/g, data.portfolio.successRate);
  html = html.replace(/\{\{portfolio\.support\}\}/g, data.portfolio.support);
  
  // Replace contact section
  html = html.replace(/\{\{contact\.heading\}\}/g, data.contact.heading);
  html = html.replace(/\{\{contact\.description\}\}/g, data.contact.description);
  data.contact.social_links.forEach((link, index) => {
    html = html.replace(new RegExp(`\\{\\{contact\\.social_links\\.${index}\\.platform\\}\\}`, 'g'), link.platform);
    html = html.replace(new RegExp(`\\{\\{contact\\.social_links\\.${index}\\.url\\}\\}`, 'g'), link.url);
  });
  
  return html;
};

// Function to save HTML to file
function saveTemplateHTML(data, filename = 'template-generated.html') {
  const html = generateExactHTML(data);
  const outputPath = path.join(process.cwd(), 'html-output', filename);
  
  // Ensure output directory exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Portfolio HTML generated successfully: ${outputPath}`);
  return outputPath;
}

// Create output directory
const outputDir = './html-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Command line usage: node src/services/generateExactHTML.js [input.json] [output.html]
if (process.argv.length > 2) {
  const jsonFile = process.argv[2];
  const outputFile = process.argv[3] || 'dynamic-portfolio.html';
  
  try {
    const portfolioData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    saveTemplateHTML(portfolioData, outputFile);
    console.log('🎨 Custom styling and dynamic data applied');
    console.log('🚀 Portfolio ready for deployment');
  } catch (error) {
    console.error('❌ Error processing portfolio data file:', error.message);
    process.exit(1);
  }
} else {
  // Generate default template if no arguments provided
  // Generate template with placeholders
  const templateHtml = generateExactHTML();
  fs.writeFileSync(path.join(outputDir, 'portfolio-template-exact.html'), templateHtml);

  // Generate sample with real data
  const sampleHtml = generateSampleExactHTML(sampleData);
  fs.writeFileSync(path.join(outputDir, 'portfolio-sample-exact.html'), sampleHtml);

  console.log('✅ Exact React-to-HTML portfolio templates generated!');
  console.log('📁 Template with placeholders: ./html-output/portfolio-template-exact.html');
  console.log('📁 Sample with data: ./html-output/portfolio-sample-exact.html');
  console.log('🎨 Identical styling and structure to the React implementation');
  console.log('🚀 Includes animated blobs, masonry grid, and all original features');
}

export { generateExactHTML, generateSampleExactHTML };