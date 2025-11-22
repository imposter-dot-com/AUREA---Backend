/**
 * Custom HTML Export Script (ES Module Compatible)
 * 
 * This script exports portfolio templates to static HTML
 * Generates HTML as strings without React dependency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the exportable template
// Note: This will need to be bundled first with Vite
const EXAMPLE_DATA = {
  hero: {
    title: 'DESIGNING WITH PRECISION',
    subtitle: 'Case studies in clarity and form'
  },
  about: {
    name: 'JOHN DESIGNER',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    bio: 'I am a designer focused on minimalism, clarity, and modernist design systems. My work emphasizes grid-based layouts, precise typography, and functional design solutions.'
  },
  work: {
    heading: 'SELECTED WORK',
    projects: [
      {
        id: 1,
        title: 'BRAND IDENTITY SYSTEM',
        description: 'Comprehensive brand identity and guidelines for a tech startup.',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        meta: '2024 — Branding',
        category: 'branding',
        hasCaseStudy: true
      },
    ]
  },
  caseStudies: {
    1: {
      category: 'BRANDING / IDENTITY — 2025',
      title: 'LOGO DESIGN\nPROCESS',
      intro: 'In this article I will share my logo design process from start to finish, that I have built in 8 years as a graphic designer.',
      heroImage: 'mockDataImage/1.jpg',
      heroCaption: 'Figure 01 — Design Process Framework',
      authorName: 'MIHAI',
      sections: [
        {
          number: '01',
          title: 'RESEARCH',
          subsections: [
            {
              title: '01.1 QUESTIONNAIRE',
              content: 'After receiving an email and discussing terms and price with the client, getting paid with 50% payment I send them a Google Form Questionnaire that gets completed with the relevant info about their brand, vision and needs.\n\nThis is a crucial part of the research process because it eliminates a lot of guesses and it helps you better understand, what is it that the client wants and what should you do about it.',
              image: 'mockDataImage/2.jpg',
              imageCaption: 'Figure 02 — Keyword Analysis'
            },
            {
              title: '01.2 DIG DEEP',
              content: 'With the form printed I start to read it and mark keywords that would help in narrowing down possible ideas / concepts for the logo. I also do competitor analysis and try to gather as much info about the brand as I can.',
              highlighted: true
            }
          ]
        },
        {
          number: '02',
          title: 'SKETCH',
          subsections: [
            {
              title: '02.1 SKETCHING IDEAS',
              content: 'This is by far my favourite part of the whole process because it is where my creativity goes wild and I am free to experiment with various ideas I had in mind.\n\nIt usually starts by having the form in front of me and by associating keywords with very simple graphical forms. I try to roughly sketch them without being too detailed.',
              image: 'mockDataImage/5.jpg',
              imageCaption: 'Figure 03 — Initial Sketches',
              imageLarge: true
            },
            {
              title: '02.2 NARROWING DOWN',
              content: 'After having a couple of pages of sketches I can already see which of them are good enough to make it to the client as concepts because while sketching simultaneously I test the ideas digitally to ensure they work and are not busy or irrelevant.\n\nMy number one tip when sketching is to go fast and don\'t strive to make perfect sketches as that tends to break the flow of whole process.',
              image: 'mockDataImage/6.jpg',
              imageCaption: null,
              dark: true
            }
          ]
        },
        {
          number: '03',
          title: 'DIGITAL',
          subsections: [
            {
              title: '03.1 DIGITIZING DIRECTIONS',
              content: 'Once we have approved the scanned directions I take them and start on the digital process. I use them only as a guidance, because my best ideas usually come when working in front of the computer.',
              image: 'mockDataImage/7.jpg',
              imageCaption: null
            },
            {
              title: '03.2 PRESENTATIONS & MOCKUPS',
              content: 'After a lot of experimenting and trying to make things look good I take 3 of my best directions and craft 3 presentations in which I present the logo in various scenarios:',
              steps: [
                'Main Logo + Wordmark in Color Version',
                'Main Logo + Wordmark in Dark / Light Version',
                'Simple Mockups (T-shirt, Cup, Office Wall)'
              ]
            }
          ]
        },
        {
          number: '04',
          title: 'SOURCE FILES',
          subsections: [
            {
              title: '04.1 PREPARING SOURCE FILES',
              content: 'Now that the final logo has been approved and there are no more changes I proceed to creating the source files.\n\nI save everything in different folders:',
              image: 'mockDataImage/8.jpg',
              imageCaption: null,
              list: [
                '→ Vector (.AI / .EPS / .PDF)',
                '→ PNG (Transparent / White BG)'
              ]
            },
            {
              title: '04.2 LOGO AND/OR BRAND GUIDELINES',
              content: 'Along with the source files I offer a PDF guideline where I demonstrate logo usage to ensure that everything is used accordingly to the rules I have set.',
              images: ['mockDataImage/9.jpg', 'mockDataImage/10.jpg']
            }
          ]
        }
      ],
      conclusion: {
        title: 'BOTTOM LINE',
        content: 'Having a process and sticking to it, will definitely give you and your work a sense of ownership. You will position yourself as an expert and people will be most likely to trust you and hand over their projects and ideas so you can convert them into useful graphical solutions.'
      }
    }
  },
  gallery: {
    heading: 'VISUAL STUDIES',
    images: [
      { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', caption: 'Visual exploration 01', meta: '01' },
      { src: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80', caption: 'Visual exploration 02', meta: '02' }
    ]
  },
  contact: {
    heading: 'GET IN TOUCH',
    text: 'Available for new projects and collaborations.',
    button: 'CONTACT ME',
    email: 'hello@designer.com'
  }
};

const HTML_TEMPLATE = (content, styles = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Portfolio - ${content.hero?.title || 'Portfolio'}">
  <title>${content.hero?.title || 'Portfolio'}</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: "Neue Haas Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #000000;
      background-color: #FFFFFF;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* Responsive Utilities */
    @media (max-width: 1024px) {
      .swiss-grid {
        padding: 0 40px !important;
      }
    }

    @media (max-width: 768px) {
      .swiss-grid {
        padding: 0 24px !important;
      }
      .grid-col {
        grid-column: 1 / -1 !important;
      }
    }

    ${styles}
  </style>
</head>
<body>
  <div id="root">{CONTENT}</div>
  
  <script>
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>`;

/**
 * Generate static HTML from portfolio data
 */
async function generateHTML(portfolioData, outputPath) {
  try {
    console.log('📝 Generating HTML from portfolio data...');

    // For now, we'll create a simple HTML structure
    // In production, you'd import and render the EchelonExport component
    const htmlContent = createHTMLFromData(portfolioData);
    
    const fullHTML = HTML_TEMPLATE(portfolioData).replace('{CONTENT}', htmlContent);
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write HTML file
    fs.writeFileSync(outputPath, fullHTML);
    console.log(`✅ HTML generated: ${outputPath}`);
    
    // Create README
    createReadme(dir);
    
    return outputPath;
  } catch (error) {
    console.error('❌ HTML generation failed:', error);
    throw error;
  }
}

/**
 * Create HTML structure from portfolio data
 * This matches the exact React component structure
 */
function createHTMLFromData(data) {
  return `
    <!-- Hero Section - Matching EchelonHero.jsx -->
    <section 
      id="hero"
      style="min-height: 100vh; background-color: #FFFFFF; color: #000000; padding-top: 0; padding-bottom: 0; position: relative; overflow: hidden; display: flex; align-items: center;"
    >
      <!-- Aesthetic Spirals in Corners -->
      <div style="position: absolute; top: 5%; left: 5%; width: 180px; height: 180px; opacity: 0.03; transform: rotate(0deg); pointer-events: none; z-index: 0;">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,100 Q150,50 150,100 T100,100 Q50,150 50,100 T100,100" stroke="#000000" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="position: absolute; bottom: 5%; right: 5%; width: 200px; height: 200px; opacity: 0.04; transform: rotate(180deg); pointer-events: none; z-index: 0;">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,100 Q150,50 150,100 T100,100 Q50,150 50,100 T100,100" stroke="#FF0000" stroke-width="2" fill="none"/>
        </svg>
      </div>
      
      <!-- Diagonal Accent Line -->
      <div style="position: absolute; top: 30%; right: 10%; width: 500px; height: 3px; background-color: #FF0000; transform: rotate(-45deg); opacity: 0.12; z-index: 1; pointer-events: none;"></div>
      
      <!-- Large Intentional Grid - Top Right -->
      <div style="position: absolute; top: 8%; right: 5%; width: 400px; height: 400px; display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); gap: 0; opacity: 0.12; z-index: 1; pointer-events: none;">
        ${Array(64).fill(0).map((_, i) => 
          `<div style="border: 1px solid #FF0000; background-color: ${i % 7 === 0 ? 'rgba(255, 0, 0, 0.05)' : 'transparent'};"></div>`
        ).join('')}
      </div>

      <!-- Vertical Red Lines - Left Side -->
      <div style="position: absolute; left: 80px; top: 20%; bottom: 20%; display: flex; gap: 60px; opacity: 0.15; z-index: 1; pointer-events: none;">
        <div style="width: 3px; height: 100%; background-color: #FF0000;"></div>
        <div style="width: 3px; height: 100%; background-color: #FF0000;"></div>
        <div style="width: 3px; height: 100%; background-color: #FF0000;"></div>
      </div>

      <!-- Circle Elements - Bottom -->
      <div style="position: absolute; bottom: 100px; left: 15%; display: flex; gap: 30px; opacity: 0.08; z-index: 1; pointer-events: none;">
        <div style="width: 80px; height: 80px; border: 4px solid #000000; border-radius: 50%;"></div>
        <div style="width: 120px; height: 120px; border: 4px solid #000000; border-radius: 50%;"></div>
        <div style="width: 160px; height: 160px; border: 4px solid #000000; border-radius: 50%;"></div>
      </div>

      <div style="max-width: 1200px; margin: 0 auto; padding: 0 80px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start; width: 100%;">
        <div style="grid-column: 1 / 13;">
          <div style="position: relative; padding-top: 20vh; padding-bottom: 15vh; z-index: 2;">
            <!-- Huge Background "01" Number -->
            <div style="position: absolute; top: 10%; right: -5%; font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(200px, 30vw, 400px); font-weight: 900; color: rgba(0, 0, 0, 0.02); line-height: 1; z-index: 0; pointer-events: none; -webkit-text-stroke: 2px rgba(255, 0, 0, 0.05);">
              01
            </div>

            <!-- Main Title -->
            <div style="position: relative; overflow: hidden; width: 100%;">
              <h1 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(60px, 12vw, 160px); font-weight: 900; line-height: 1.05; color: #000000; text-transform: uppercase; letter-spacing: -0.03em; margin: 0; margin-bottom: 60px; position: relative; z-index: 2; max-width: 100%; word-break: break-word; overflow-wrap: break-word; hyphens: auto;">
                ${data.hero.title}
                <div style="position: absolute; top: -40px; right: 5%; width: 300px; height: 200px; border: 3px solid #FF0000; opacity: 0.15; pointer-events: none; z-index: -1;"></div>
              </h1>
            </div>
          </div>
        </div>

        <!-- Asymmetrical Layout - Subtitle -->
        <div style="grid-column: 8 / 13;">
          <div style="border-left: 4px solid #FF0000; padding-left: 40px; margin-top: -60px; position: relative;">
            <div style="position: absolute; left: -60px; top: -20px; font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 120px; font-weight: 900; color: rgba(0, 0, 0, 0.03); line-height: 1; z-index: 0;">
              01
            </div>

            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: #FF0000; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.15em;">
              EST. 2025 — DESIGN PORTFOLIO
            </div>

            <p style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 400; line-height: 1.5; color: #000000; margin: 0; max-width: 500px; word-wrap: break-word; overflow-wrap: break-word;">
              ${data.hero.subtitle}
            </p>

            <div style="margin-top: 40px; display: inline-grid; grid-template-columns: repeat(4, 30px); grid-template-rows: repeat(2, 30px); gap: 2px; opacity: 0.3;">
              ${Array(8).fill(0).map(() => '<div style="border: 1px solid #000000;"></div>').join('')}
            </div>
          </div>
        </div>

        <!-- Large Design Statement -->
        <div style="grid-column: 1 / 13;">
          <div style="margin-top: 100px; padding-top: 60px; border-top: 1px solid #000000; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.2em;">
              SCROLL TO EXPLORE
            </div>
            <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.1em;">
              PORTFOLIO 2025
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section - Matching EchelonAbout.jsx -->
    <section id="about" style="min-height: 100vh; background-color: #000000; color: #FFFFFF; padding-top: 80px; padding-bottom: 0px; position: relative; overflow: hidden; display: flex; align-items: center;">
      <!-- Large Grid Overlay - Top Left -->
      <div style="position: absolute; top: 60px; left: 80px; width: 180px; height: 180px; pointer-events: none; z-index: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(7, 1fr); gap: 0; opacity: 0.08;">
        ${Array(49).fill(0).map((_, i) => 
          `<div style="border: 1px solid #FF0000; background-color: ${i % 8 === 0 ? 'rgba(255, 0, 0, 0.03)' : 'transparent'};"></div>`
        ).join('')}
      </div>

      <!-- Decorative Lines -->
      <div style="position: absolute; right: 80px; top: 30%; bottom: 30%; display: flex; gap: 40px; opacity: 0.1; z-index: 1; pointer-events: none;">
        <div style="width: 2px; height: 100%; background-color: #FFFFFF;"></div>
        <div style="width: 2px; height: 100%; background-color: #FFFFFF;"></div>
      </div>

      <!-- Bold Horizontal Accent -->
      <div style="position: absolute; bottom: 25%; left: 0; right: 40%; height: 8px; background-color: #FF0000; opacity: 0.15; z-index: 1; pointer-events: none;"></div>
      
      <div style="max-width: 1200px; margin: 0px auto; padding: 0px 80px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start;">
        <!-- Massive Section Number -->
        <div style="grid-column: 1 / 13;">
          <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(150px, 20vw, 280px); font-weight: 900; line-height: 0.8; color: rgba(255, 255, 255, 0.08); margin-top: -60px; margin-bottom: 60px; letter-spacing: -0.05em; -webkit-text-stroke: 1px rgba(255, 0, 0, 0.1);">
            ABOUT
          </div>
        </div>

        <!-- Large Portrait Image -->
        <div style="grid-column: 1 / 6;">
          <div style="position: relative;">
            <div style="aspect-ratio: 3/4; background-color: ${data.about.image ? 'transparent' : 'rgba(255, 255, 255, 0.05)'}; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; position: relative; z-index: 2; overflow: hidden;">
              ${data.about.image ? 
                `<img src="${data.about.image}" alt="${data.about.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 16px; color: rgba(255, 255, 255, 0.3); text-align: center; text-transform: uppercase; letter-spacing: 0.15em;">PORTRAIT</div>`
              }
            </div>

            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 24px; padding-top: 20px; border-top: 2px solid #FF0000; display: flex; justify-content: space-between; align-items: center;">
              <span>PORTRAIT</span>
              <span style="color: #FF0000;">2025</span>
            </div>
          </div>
        </div>

        <!-- Bio Content -->
        <div style="grid-column: 1 / 8;">
          <div style="margin-left: 60px; position: relative; z-index: 2; max-width: 100%; overflow: hidden;">
            <!-- Section Label -->
            <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 60px;">
              <div style="font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 600; color: #FF0000; text-transform: uppercase; letter-spacing: 0.2em; border-left: 4px solid #FF0000; padding-left: 24px;">
                01 — ABOUT
              </div>

              <div style="display: inline-grid; grid-template-columns: repeat(3, 20px); grid-template-rows: repeat(2, 20px); gap: 2px; opacity: 0.3;">
                ${Array(6).fill(0).map(() => '<div style="border: 1px solid #FFFFFF;"></div>').join('')}
              </div>
            </div>

            <!-- Name with grid lines -->
            <div style="position: relative; width: 100%; overflow: hidden;">
              <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(42px, 7vw, 72px); font-weight: 900; line-height: 1.1; color: #FFFFFF; text-transform: uppercase; letter-spacing: -0.02em; margin: 0 0 30px; position: relative; z-index: 2; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">
                ${data.about.name}

                <div style="position: absolute; top: -30px; left: -30px; right: 20%; height: 3px; background-color: #FF0000; opacity: 0.4; z-index: -1;"></div>
                <div style="position: absolute; bottom: -30px; left: 20%; right: -30px; height: 3px; background-color: #FF0000; opacity: 0.4; z-index: -1;"></div>
              </h3>
            </div>

            <!-- Professional Role Badge -->
            <div style="display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 700; color: #000000; background-color: #FF0000; text-transform: uppercase; letter-spacing: 0.15em; padding: 12px 24px; margin-bottom: 60px; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; line-height: 1.4; transform: skew(-3deg);">
              CREATIVE DIRECTOR / DESIGNER
            </div>

            <!-- Bio Text -->
            <p style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 400; line-height: 1.6; color: rgba(255, 255, 255, 0.85); margin: 0; max-width: 700px; word-wrap: break-word; overflow-wrap: break-word;">
              ${data.about.bio}
            </p>

            <!-- Swiss divider with grid element -->
            <div style="margin-top: 80px; display: flex; align-items: center; gap: 40px;">
              <div style="width: 150px; height: 3px; background-color: #FF0000; opacity: 0.6;"></div>
              
              <!-- Small grid badge -->
              <div style="display: inline-grid; grid-template-columns: repeat(4, 15px); grid-template-rows: repeat(2, 15px); gap: 2px; opacity: 0.4;">
                ${Array(8).fill(0).map(() => '<div style="border: 1px solid #FFFFFF;"></div>').join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Work Section - Matching EchelonWork.jsx -->
    <section id="work" style="background-color: #FFFFFF; padding-top: 200px; padding-bottom: 200px; position: relative; overflow: hidden;">
      <!-- Aesthetic Spirals -->
      <div style="position: absolute; top: 5%; right: 5%; width: 160px; height: 160px; opacity: 0.025; transform: rotate(90deg); pointer-events: none; z-index: 1;">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,100 Q150,50 150,100 T100,100 Q50,150 50,100 T100,100" stroke="#000000" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="position: absolute; bottom: 5%; left: 5%; width: 180px; height: 180px; opacity: 0.035; transform: rotate(270deg); pointer-events: none; z-index: 1;">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,100 Q150,50 150,100 T100,100 Q50,150 50,100 T100,100" stroke="#FF0000" stroke-width="2" fill="none"/>
        </svg>
      </div>
      
      <!-- Large decorative grid -->
      <div style="position: absolute; bottom: 10%; right: 5%; width: 380px; height: 380px; display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); gap: 0; opacity: 0.06; z-index: 1; pointer-events: none;">
        ${Array(64).fill(0).map((_, i) => 
          `<div style="border: 1px solid #000000; background-color: ${i % 9 === 0 ? 'rgba(0, 0, 0, 0.03)' : 'transparent'};"></div>`
        ).join('')}
      </div>

      <div style="max-width: 1200px; margin: 0 auto; padding: 0 80px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start; width: 100%;">
        <!-- Massive Section Title -->
        <div style="grid-column: 1 / 13;">
          <div style="margin-bottom: 140px; position: relative;">
            <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(150px, 20vw, 300px); font-weight: 900; line-height: 0.8; color: rgba(0, 0, 0, 0.03); text-transform: uppercase; letter-spacing: -0.05em; position: absolute; top: -60px; left: -20px; z-index: 0; white-space: nowrap; -webkit-text-stroke: 1px rgba(255, 0, 0, 0.08);">
              WORK
            </div>

            <div style="position: relative; z-index: 2; padding-top: 60px;">
              <div style="display: flex; align-items: center; gap: 40px;">
                <div style="width: 80px; height: 80px; background-color: #FF0000; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 900; color: #FFFFFF; transform: rotate(-5deg);">
                  02
                </div>

                <h2 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(60px, 10vw, 100px); font-weight: 900; line-height: 0.9; color: #000000; text-transform: uppercase; letter-spacing: -0.02em; margin: 0;">
                  ${data.work.heading}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects -->
        ${data.work.projects.map((project, index) => {
          const isEven = index % 2 === 0;
          return `
            <div style="grid-column: 1 / 13; position: relative; margin-bottom: 200px;">
              <!-- Project Number -->
              <div style="position: absolute; top: -60px; left: 0; font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 120px; font-weight: 900; color: rgba(0, 0, 0, 0.03); line-height: 1; z-index: 0;">
                ${String(index + 1).padStart(2, '0')}
              </div>

              <!-- Meta info -->
              <div style="position: absolute; top: -30px; right: 0; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #FF0000; text-transform: uppercase; letter-spacing: 0.15em; z-index: 2;">
                PROJECT ${String(index + 1).padStart(2, '0')}
              </div>

              <div style="display: grid; grid-template-columns: ${isEven ? '4fr 8fr' : '8fr 4fr'}; gap: 60px; position: relative; z-index: 1; align-items: center;">
                <!-- Image Section -->
                <div style="order: ${isEven ? 1 : 2}; position: relative;">
                  <div style="aspect-ratio: 16/11; background-color: ${project.image ? 'transparent' : 'rgba(0, 0, 0, 0.03)'}; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                    ${project.image ? 
                      `<img src="${project.image}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; transform: scale(1);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">` :
                      `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: rgba(0, 0, 0, 0.2); text-transform: uppercase;">IMAGE</div>`
                    }
                  </div>
                </div>

                <!-- Content Section -->
                <div style="order: ${isEven ? 2 : 1};">
                  <div style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 24px;">
                    ${project.meta}
                  </div>

                  <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(36px, 6vw, 64px); font-weight: 900; line-height: 0.95; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin: 0; margin-bottom: 16px; position: relative; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">
                    ${project.title}
                  </h3>

                  <!-- Red underline accent -->
                  <div style="width: 80px; height: 4px; background-color: #FF0000; margin-bottom: 24px;"></div>

                  <p style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 1.5; color: #000000; margin: 0; margin-bottom: 24px; max-width: 400px;">
                    ${project.description}
                  </p>

                  <!-- Case Study Button -->
                  ${project.hasCaseStudy ? `
                  <a href="./case-study-${project.id}.html" style="display: inline-flex; align-items: center; gap: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 700; color: #FFFFFF; background-color: #FF0000; border: 2px solid #FF0000; padding: 14px 28px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s ease; text-decoration: none;" onmouseover="this.style.backgroundColor='#CC0000'; this.style.borderColor='#CC0000'; this.style.transform='translateY(-2px)';" onmouseout="this.style.backgroundColor='#FF0000'; this.style.borderColor='#FF0000'; this.style.transform='translateY(0)';">
                    VIEW CASE STUDY →
                  </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- Gallery Section - Matching Live Site -->
    <section id="gallery" style="background-color: rgb(0, 0, 0); color: rgb(255, 255, 255); padding-top: 200px; padding-bottom: 200px; position: relative; overflow: hidden;">
      <!-- Large Grid Decoration -->
      <div style="position: absolute; top: 8%; left: 3%; width: 320px; height: 320px; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr); gap: 0px; opacity: 0.04; z-index: 1; pointer-events: none;">
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.02);"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
        <div style="border: 1px solid rgb(255, 255, 255); background-color: transparent;"></div>
      </div>

      <div class="swiss-grid " style="max-width: 1200px; margin: 0px auto; padding: 0px 80px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start;">
        <!-- Massive Section Title -->
        <div class="grid-col " style="grid-column: 1 / 13;">
          <div style="margin-bottom: 120px; position: relative;">
            <div style="font-family: &quot;Neue Haas Grotesk&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif; font-size: clamp(180px, 22vw, 320px); font-weight: 900; line-height: 0.8; color: rgba(255, 255, 255, 0.05); text-transform: uppercase; letter-spacing: -0.05em; position: absolute; top: -80px; left: -20px; z-index: 0; -webkit-text-stroke: 1px rgba(255, 0, 0, 0.08);">
              GALLERY
            </div>

            <div style="display: flex; align-items: center; gap: 40px; position: relative; z-index: 2; padding-top: 40px;">
              <div style="width: 60px; height: 60px; border: 4px solid rgb(255, 0, 0); transform: rotate(45deg);"></div>

              <h2 style="font-family: &quot;Neue Haas Grotesk&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif; font-size: clamp(48px, 8vw, 80px); font-weight: 900; line-height: 0.9; color: rgb(255, 255, 255); text-transform: uppercase; letter-spacing: -0.02em; margin: 0px;">
                VISUAL STUDIES
              </h2>
            </div>
          </div>
        </div>

        <!-- Gallery Grid -->
        <div class="grid-col " style="grid-column: 1 / 13;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-bottom: 60px;">
            ${data.gallery && data.gallery.images && data.gallery.images.length > 0
              ? data.gallery.images
                  .filter(image => image.src && image.src.trim() !== '') // Only show images with actual src
                  .map((image, index) => {
                    const aspectRatio = (index % 3 === 0 || index % 3 === 2) ? '4 / 5' : '16 / 11';
                    return `
                      <div style="position: relative; aspect-ratio: ${aspectRatio}; cursor: pointer; overflow: hidden; background-color: rgba(255, 255, 255, 0.03);">
                        <img src="${image.src}" alt="${image.caption || `Gallery image ${index + 1}`}" style="width: 100%; height: 100%; object-fit: cover;" />
                        <div style="position: absolute; top: 20px; right: 20px; width: 60px; height: 60px; background-color: rgb(255, 0, 0); display: flex; align-items: center; justify-content: center; font-family: &quot;IBM Plex Mono&quot;, monospace; font-size: 20px; font-weight: 900; color: rgb(0, 0, 0); z-index: 2; transform: rotate(-8deg); box-shadow: rgba(255, 0, 0, 0.3) 0px 4px 12px;">${String(index + 1).padStart(2, '0')}</div>
                      </div>
                    `;
                  }).join('')
              : // Default message if no gallery images
                `<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.5); font-family: 'IBM Plex Mono', monospace;">
                   <p>No gallery images available</p>
                 </div>`
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section - Matching Live Site -->
    <section id="contact" style="padding-top: 120px; padding-bottom: 120px; background-color: rgb(0, 0, 0); color: rgb(255, 255, 255); position: relative; overflow: hidden;">
      <!-- Decorative Spiral -->
      <div style="position: absolute; top: 60px; left: 80px; width: 100px; height: 100px; opacity: 0.06; pointer-events: none; z-index: 1;">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 50m-40 0a40 40 0 1 1 80 0a30 30 0 1 1 -60 0a20 20 0 1 1 40 0" stroke="#FF0000" stroke-width="2" fill="none"></path>
        </svg>
      </div>

      <!-- Horizontal Decorative Lines -->
      <div style="position: absolute; top: 50%; left: 0px; width: 40%; height: 1px; background-color: rgba(255, 255, 255, 0.05); transform: translateY(-50%);"></div>
      <div style="position: absolute; top: 50%; right: 0px; width: 40%; height: 1px; background-color: rgba(255, 255, 255, 0.05); transform: translateY(-50%);"></div>

      <!-- Massive Background "CONTACT" -->
      <div style="position: absolute; top: 20%; left: -5%; font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(120px, 18vw, 240px); font-weight: 900; color: rgba(255, 255, 255, 0.02); line-height: 1; z-index: 0; pointer-events: none; text-transform: uppercase; letter-spacing: -0.05em; -webkit-text-stroke: 1px rgba(0, 255, 65, 0.03);">
        CONTACT
      </div>

      <div style="max-width: 1200px; margin: 0px auto; padding: 0px 80px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start; width: 100%;">
        <!-- Section Number (Vertical) -->
        <div style="grid-column: 1 / 4;">
          <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(120px, 15vw, 200px); font-weight: 900; line-height: 0.8; color: rgb(26, 26, 26); margin-top: -40px; writing-mode: vertical-rl; text-orientation: mixed;">
            05
          </div>
        </div>

        <!-- Main Heading -->
        <div style="grid-column: 1 / 10;">
          <h2 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(36px, 6vw, 80px); font-weight: 900; line-height: 0.9; color: rgb(255, 255, 255); text-transform: uppercase; letter-spacing: -0.02em; margin: 0px 0px 30px;">
            WORK WITH ME
          </h2>
        </div>

        <!-- Availability Badge -->
        <div style="grid-column: 3 / 7;">
          <div style="display: inline-block; background-color: rgb(0, 255, 65); color: rgb(0, 0, 0); padding: 12px 24px; margin-bottom: 60px; font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; transform: rotate(-2deg);">
            ● AVAILABLE FOR NEW PROJECTS
          </div>
        </div>

        <!-- Contact Information -->
        <div style="grid-column: 1 / 5;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: rgb(102, 102, 102); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 40px; border-bottom: 2px solid rgb(255, 0, 0); padding-bottom: 12px;">
            DIRECT CONTACT
          </div>
          <div style="margin-bottom: 60px;">
            <div style="margin-bottom: 24px;">
              <a href="mailto:${data.contact.email}" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; color: rgb(255, 255, 255); text-decoration: none; border-bottom: 1px solid rgb(102, 102, 102); padding-bottom: 2px; transition: border-bottom-color 0.3s ease 0s;" onmouseover="this.style.borderBottomColor='#00FF41';" onmouseout="this.style.borderBottomColor='rgb(102, 102, 102)';">
                ${data.contact.email}
              </a>
            </div>
            <div style="margin-bottom: 24px;">
              <a href="tel:+15551234567" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; color: rgb(204, 204, 204); text-decoration: none;">
                +1 (555) 123-4567
              </a>
            </div>
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: rgb(102, 102, 102); text-transform: uppercase; letter-spacing: 0.1em;">
              NEW YORK, NY
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div style="grid-column: 2 / 9;">
          <div style="background-color: transparent; border: 3px solid rgb(255, 0, 0); padding: 50px; transform: rotate(1deg); margin-top: 80px; position: relative;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: rgb(255, 0, 0); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; transform: rotate(-1deg);">
              START A PROJECT
            </div>
            <form style="display: flex; flex-direction: column; gap: 24px; transform: rotate(-1deg);">
              <!-- Name and Email -->
              <div style="display: flex; gap: 20px;">
                <input type="text" required="" placeholder="YOUR NAME" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.05); border: none; border-bottom: 2px solid rgb(51, 51, 51); padding: 16px 12px; flex: 1 1 0%; outline: none; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease 0s;" onfocus="this.style.borderBottomColor='#00FF41'; this.style.backgroundColor='rgba(0, 255, 65, 0.05)';" onblur="this.style.borderBottomColor='rgb(51, 51, 51)'; this.style.backgroundColor='rgba(255, 255, 255, 0.05)';">
                <input type="email" required="" placeholder="YOUR EMAIL" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.05); border: none; border-bottom: 2px solid rgb(51, 51, 51); padding: 16px 12px; flex: 1 1 0%; outline: none; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease 0s;" onfocus="this.style.borderBottomColor='#00FF41'; this.style.backgroundColor='rgba(0, 255, 65, 0.05)';" onblur="this.style.borderBottomColor='rgb(51, 51, 51)'; this.style.backgroundColor='rgba(255, 255, 255, 0.05)';">
              </div>
              <!-- Project Type and Budget -->
              <div style="display: flex; gap: 20px;">
                <input type="text" placeholder="PROJECT TYPE" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.05); border: none; border-bottom: 2px solid rgb(51, 51, 51); padding: 16px 12px; flex: 1 1 0%; outline: none; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease 0s;" onfocus="this.style.borderBottomColor='#00FF41'; this.style.backgroundColor='rgba(0, 255, 65, 0.05)';" onblur="this.style.borderBottomColor='rgb(51, 51, 51)'; this.style.backgroundColor='rgba(255, 255, 255, 0.05)';">
                <select style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.05); border: none; border-bottom: 2px solid rgb(51, 51, 51); padding: 16px 12px; flex: 1 1 0%; outline: none; text-transform: uppercase; letter-spacing: 0.05em;">
                  <option value="" style="background-color: rgb(0, 0, 0);">BUDGET RANGE</option>
                  <option value="5k-10k" style="background-color: rgb(0, 0, 0);">$5K - $10K</option>
                  <option value="10k-25k" style="background-color: rgb(0, 0, 0);">$10K - $25K</option>
                  <option value="25k-50k" style="background-color: rgb(0, 0, 0);">$25K - $50K</option>
                  <option value="50k+" style="background-color: rgb(0, 0, 0);">$50K+</option>
                </select>
              </div>
              <!-- Message -->
              <textarea required="" rows="3" placeholder="PROJECT DETAILS..." style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: rgb(255, 255, 255); background-color: rgba(255, 255, 255, 0.05); border: 2px solid rgb(51, 51, 51); padding: 16px; width: 100%; resize: vertical; outline: none; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease 0s;" onfocus="this.style.borderColor='#00FF41'; this.style.backgroundColor='rgba(0, 255, 65, 0.05)';" onblur="this.style.borderColor='rgb(51, 51, 51)'; this.style.backgroundColor='rgba(255, 255, 255, 0.05)';"></textarea>
              <!-- Submit Button -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <button type="submit" style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: rgb(0, 0, 0); background-color: rgb(0, 255, 65); border: 3px solid rgb(0, 255, 65); padding: 16px 40px; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s ease 0s; transform: skew(-5deg);" onmouseover="this.style.backgroundColor='transparent'; this.style.color='#00FF41'; this.style.transform='skew(-5deg) scale(1.05)';" onmouseout="this.style.backgroundColor='rgb(0, 255, 65)'; this.style.color='rgb(0, 0, 0)'; this.style.transform='skew(-5deg) scale(1)';">
                  SEND BRIEF
                </button>
                <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: rgb(0, 255, 65); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
                  → 24H RESPONSE
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Social Links Footer -->
        <div style="grid-column: 1 / 13;">
          <div style="margin-top: 80px; padding-top: 40px; border-top: 1px solid rgb(51, 51, 51); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
            <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            </div>
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: rgb(51, 51, 51); text-transform: uppercase; letter-spacing: 0.1em;">
              © 2025 — ECHELON
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Transform database case study format to HTML template format
 */
function transformCaseStudyForHTML(caseStudy, portfolioData) {
  console.log('🔍 transformCaseStudyForHTML input:', {
    hasCaseStudy: !!caseStudy,
    hasContent: !!caseStudy?.content,
    hasHero: !!caseStudy?.content?.hero,
    heroTitle: caseStudy?.content?.hero?.title,
    hasSections: !!caseStudy?.content?.sections,
    sectionCount: caseStudy?.content?.sections?.length || 0,
    caseStudyKeys: Object.keys(caseStudy || {})
  });
  
  // Check if it's already in template format (has category, intro, etc.)
  if (caseStudy?.category && caseStudy?.intro && caseStudy?.sections?.length > 0) {
    console.log('✓ Already in template format');
    return caseStudy;
  }
  
  // Transform database format to template format
  const hero = caseStudy?.content?.hero || caseStudy?.hero || {};
  const overview = caseStudy?.content?.overview || caseStudy?.overview || {};
  const sections = caseStudy?.content?.sections || caseStudy?.sections || [];
  const additionalContext = caseStudy?.content?.additionalContext || caseStudy?.additionalContext || {};
  
  // Check if we have meaningful content
  const hasRealTitle = hero.title && hero.title.trim() && hero.title !== 'My First Project';
  const hasRealDescription = overview.description && overview.description.trim() && overview.description !== 'Add a description of your project here...';
  const hasRealSections = sections.length > 0 && sections.some(s => s.content && s.content.trim());
  
  console.log('🔄 Transforming case study:', {
    heroTitle: hero.title,
    hasRealTitle,
    hasRealDescription,
    hasRealSections,
    overviewDesc: overview.description?.substring(0, 50),
    sectionCount: sections.length
  });
  
  // If no real content, return minimal fallback
  if (!hasRealTitle && !hasRealDescription && !hasRealSections) {
    console.log('⚠️  No real content found, using minimal fallback');
    const authorName = portfolioData?.about?.name || portfolioData?.content?.about?.name || 'DESIGNER';
    return {
      category: `PROJECT — ${new Date().getFullYear()}`,
      title: 'PROJECT\nCASE STUDY',
      intro: 'This project case study is currently being developed. Check back soon for updates.',
      heroImage: '',
      heroCaption: 'Project Details',
      authorName,
      sections: [],
      conclusion: {
        title: 'THANK YOU',
        content: 'Thank you for your interest in this project.'
      }
    };
  }
  
  // Transform with real data
  const authorName = portfolioData?.about?.name || portfolioData?.content?.about?.name || 'DESIGNER';
  
  return {
    category: `${hero.client || hero.subtitle || 'PROJECT'} — ${hero.year || new Date().getFullYear()}`,
    title: hero.title || 'Untitled Project',
    intro: overview.description || overview.challenge || 'Project case study.',
    heroImage: hero.coverImage || '',
    heroCaption: hero.client ? `${hero.client} ${hero.year || ''}`.trim() : 'Project Details',
    authorName,
    sections: sections.map((section, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title: section.heading || `Section ${index + 1}`,
      subsections: [{
        title: section.heading || `Section ${index + 1}`,
        content: section.content || '',
        image: section.image || (section.images && section.images[0]) || '',
        imageCaption: section.heading || '',
        imageLarge: section.layout === 'full',
        dark: false,
        highlighted: section.type === 'text',
        images: section.images || []
      }]
    })),
    conclusion: {
      title: additionalContext.heading || overview.heading || 'CONCLUSION',
      content: additionalContext.content || overview.results || 'Thank you for viewing this case study.'
    }
  };
}

/**
 * Generate Case Study Page HTML
 */
function generateCaseStudyHTML(projectId, caseStudy, data, options = {}) {
  const { forPDF = false } = options;

  // Transform to template format
  const templateData = transformCaseStudyForHTML(caseStudy, data);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.title.replace(/\n/g, ' ')} - Case Study</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: "Neue Haas Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #000000;
      background-color: #FFFFFF;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    img {
      max-width: 100%;
      display: block;
    }
  </style>
</head>
<body>
  ${!forPDF ? `
  <!-- Fixed Header -->
  <header style="position: fixed; top: 0; left: 0; right: 0; background-color: #000000; color: #FFFFFF; padding: 24px 60px; z-index: 1000; border-bottom: 3px solid #FF0000; display: flex; justify-content: space-between; align-items: center;">
    <a href="./html" style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #FFFFFF; background-color: transparent; border: 2px solid #FFFFFF; padding: 12px 24px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s ease; text-decoration: none; display: inline-block;" onmouseover="this.style.backgroundColor='#FFFFFF'; this.style.color='#000000';" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#FFFFFF';">
      ← BACK
    </a>

    <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #FF0000; text-transform: uppercase; letter-spacing: 0.15em;">
      VIEW CASE STUDY
    </div>
  </header>
  ` : ''}

  <!-- Main Content -->
  <main style="padding-top: ${forPDF ? '60px' : '120px'}; padding-bottom: 120px;">
    <!-- Hero Section -->
    <section style="max-width: 1400px; margin: 0 auto; padding: 0 60px; margin-bottom: 180px;">
      <!-- Category -->
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #FF0000; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 40px;">
        ${templateData.category}
      </div>

      <!-- Main Title -->
      <h1 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: clamp(60px, 10vw, 140px); font-weight: 900; line-height: 0.9; text-transform: uppercase; letter-spacing: -0.03em; margin: 0; margin-bottom: 60px; white-space: pre-line;">
        ${templateData.title}
      </h1>

      <!-- Intro Text -->
      <div style="max-width: 900px; font-size: 24px; line-height: 1.6; margin-bottom: 80px;">
        ${templateData.intro}
      </div>

      <!-- Hero Image -->
      ${templateData.heroImage ? `
        <div style="width: 100%; aspect-ratio: 16/9; background-color: #F5F5F5; margin-bottom: 40px; overflow: hidden;">
          <img src="${templateData.heroImage}" alt="Case Study Hero" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #666666; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
          ${templateData.heroCaption}
        </div>
      ` : ''}
    </section>

    <!-- Introduction -->
    ${templateData.sections && templateData.sections.length > 0 ? `
      <section style="max-width: 900px; margin: 0 auto; padding: 0 60px; margin-bottom: 160px;">
        <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px;">
          ${templateData.intro}
        </p>
        
        ${templateData.sections.length > 1 ? `
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px;">
            This case study consists of ${templateData.sections.length} major sections:
          </p>

          <!-- Steps Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-top: 60px;">
            ${templateData.sections.map((section, i) => `
              <div style="border: 2px solid #000000; padding: 40px; background-color: ${i === 0 ? '#FF0000' : 'transparent'}; color: ${i === 0 ? '#FFFFFF' : '#000000'};">
                <div style="font-family: 'IBM Plex Mono', monospace; font-size: 48px; font-weight: 900; margin-bottom: 20px;">
                  ${section.number}
                </div>
                <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px;">
                  ${section.title}
                </div>
                <div style="font-size: 16px; opacity: 0.8;">
                  ${section.subsections[0]?.title || section.title}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </section>
    ` : ''}

    <!-- Main Sections -->
    ${templateData.sections && templateData.sections.length > 0 ? templateData.sections.map(section => `
      <section style="max-width: 1400px; margin: 0 auto; padding: 0 60px; margin-bottom: 160px;">
        <!-- Section Header -->
        <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 80px;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 100px; font-weight: 900; color: #FF0000; line-height: 1;">
            ${section.number}
          </div>
          <div>
            <h2 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 72px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 0.9;">
              ${section.title}
            </h2>
          </div>
        </div>

        <!-- Subsections -->
        ${section.subsections.map((sub, subIndex) => {
          if (sub.imageLarge) {
            return `
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 60px; margin-bottom: 80px;">
                <div>
                  <div style="aspect-ratio: 16/11; background-color: #F5F5F5; margin-bottom: 24px; overflow: hidden;">
                    <img src="${sub.image}" alt="${sub.title}" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                  ${sub.imageCaption ? `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #666666; text-transform: uppercase;">${sub.imageCaption}</div>` : ''}
                </div>
                <div>
                  <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 24px;">
                    ${sub.title}
                  </h3>
                  <p style="font-size: 16px; line-height: 1.7; white-space: pre-line;">
                    ${sub.content}
                  </p>
                </div>
              </div>
            `;
          } else if (sub.dark) {
            return `
              <div style="background-color: #000000; color: #FFFFFF; padding: 60px; margin-top: 60px;">
                <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; color: #FF0000;">
                  ${sub.title}
                </h3>
                <p style="font-size: 18px; line-height: 1.8; margin-bottom: 30px; white-space: pre-line;">
                  ${sub.content}
                </p>
                ${sub.image ? `
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
                    <img src="${sub.image}" alt="${sub.title}" style="width: 100%; border: 2px solid #FF0000;">
                    <div>
                      <p style="font-size: 16px; line-height: 1.7;">
                        Additional details and insights about the process.
                      </p>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          } else if (sub.highlighted) {
            return `
              <div style="background-color: #F5F5F5; padding: 60px; margin-top: 60px;">
                <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px;">
                  ${sub.title}
                </h3>
                <p style="font-size: 18px; line-height: 1.8; white-space: pre-line;">
                  ${sub.content}
                </p>
              </div>
            `;
          } else if (sub.steps) {
            return `
              <div style="border: 3px solid #FF0000; padding: 60px; margin-top: 80px;">
                <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px;">
                  ${sub.title}
                </h3>
                <p style="font-size: 18px; line-height: 1.8; margin-bottom: 40px; white-space: pre-line;">
                  ${sub.content}
                </p>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">
                  ${sub.steps.map((step, i) => `
                    <div style="border: 2px solid #000000; padding: 30px; background-color: #F5F5F5;">
                      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 700; margin-bottom: 12px;">
                        ${String(i + 1).padStart(2, '0')}
                      </div>
                      <div style="font-size: 16px;">
                        ${step}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else if (sub.list) {
            return `
              <div style="background-color: #F5F5F5; padding: 80px 60px;">
                <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px;">
                  ${sub.title}
                </h3>
                <p style="font-size: 18px; line-height: 1.8; margin-bottom: 40px; white-space: pre-line;">
                  ${sub.content}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
                  ${sub.image ? `<img src="${sub.image}" alt="${sub.title}" style="width: 100%; border: 3px solid #000000;">` : ''}
                  <div>
                    <p style="font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
                      I save everything in different folders:
                    </p>
                    <ul style="font-size: 18px; line-height: 2; list-style: none; padding: 0;">
                      ${sub.list.map(item => `
                        <li style="padding: 16px; background-color: #FFFFFF; margin-bottom: 12px; border: 2px solid #000000; font-weight: 700;">
                          ${item}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            `;
          } else if (sub.images && sub.images.length > 1) {
            return `
              <div style="margin-top: 80px; border: 3px solid #000000; padding: 60px;">
                <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px;">
                  ${sub.title}
                </h3>
                <p style="font-size: 18px; line-height: 1.8; margin-bottom: 40px; white-space: pre-line;">
                  ${sub.content}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 60px;">
                  ${sub.images.map(img => `
                    <img src="${img}" alt="Brand Guidelines" style="width: 100%; border: 2px solid #CCCCCC;">
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            return `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-bottom: 80px;">
                <div>
                  <h3 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px;">
                    ${sub.title}
                  </h3>
                  <p style="font-size: 18px; line-height: 1.8; white-space: pre-line;">
                    ${sub.content}
                  </p>
                </div>
                ${sub.image ? `
                  <div>
                    <div style="aspect-ratio: 4/3; background-color: #F5F5F5; overflow: hidden;">
                      <img src="${sub.image}" alt="${sub.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    ${sub.imageCaption ? `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #666666; margin-top: 16px; text-transform: uppercase;">${sub.imageCaption}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }
        }).join('')}
      </section>
    `).join('') : ''}

    <!-- Conclusion -->
    ${templateData.conclusion ? `
      <section style="max-width: 900px; margin: 0 auto; padding: 0 60px; margin-bottom: 80px;">
        <div style="background-color: #FF0000; color: #FFFFFF; padding: 80px 60px; text-align: center;">
          <h2 style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px; line-height: 1.1;">
            ${templateData.conclusion.title}
          </h2>
          <p style="font-size: 20px; line-height: 1.8;">
            ${templateData.conclusion.content}
          </p>
        </div>
      </section>
    ` : ''}

    <!-- Author -->
    <section style="max-width: 900px; margin: 0 auto; padding: 0 60px; text-align: center;">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #666666; text-transform: uppercase; margin-bottom: 16px;">
        Thank you for reading
      </div>
      <div style="font-family: 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 900;">
        ${templateData.authorName}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer style="background-color: #000000; color: #FFFFFF; padding: 40px 60px; text-align: center; border-top: 3px solid #FF0000;">
    <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em;">
      Case Study — ${templateData.title.replace(/\n/g, ' ')} © ${new Date().getFullYear()}
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Create README for exported portfolio
 */
function createReadme(outputDir) {
  const content = `# Your Portfolio

This is your exported portfolio website!

## 🚀 How to Use

### View Locally
Double-click \`index.html\` to open in your browser.

### Deploy Online

**Netlify:**
1. Go to https://app.netlify.com/drop
2. Drag this folder onto the page
3. Done!

**GitHub Pages:**
1. Create a GitHub repository
2. Push these files
3. Enable GitHub Pages in settings

**Vercel:**
\`\`\`bash
vercel
\`\`\`

Created with ❤️ using Aurea Portfolio Builder
`;
  
  fs.writeFileSync(path.join(outputDir, 'README.md'), content);
}

/**
 * Copy images to export directory
 */
function copyImages(outputDir) {
  const publicDir = path.join(__dirname, '..', 'public');
  const mockImagesSource = path.join(publicDir, 'mockDataImage');
  const mockImagesDest = path.join(outputDir, 'mockDataImage');
  
  // Create mockDataImage directory in export
  if (!fs.existsSync(mockImagesDest)) {
    fs.mkdirSync(mockImagesDest, { recursive: true });
  }
  
  // Copy all images
  if (fs.existsSync(mockImagesSource)) {
    const files = fs.readdirSync(mockImagesSource);
    let copiedCount = 0;
    files.forEach(file => {
      const sourcePath = path.join(mockImagesSource, file);
      const destPath = path.join(mockImagesDest, file);
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
    });
    console.log(`📸 Copied ${copiedCount} mock images`);
  }
}

/**
 * Main export function
 */
async function exportPortfolio(data = EXAMPLE_DATA, outputId = 'example') {
  console.log('\n🎨 Aurea Custom HTML Export\n');
  
  const outputDir = path.join(__dirname, '..', 'html-export', outputId);
  const outputPath = path.join(outputDir, 'index.html');
  
  try {
    // Generate main portfolio page
    await generateHTML(data, outputPath);
    console.log('✅ Generated index.html');
    
    // Copy images to export directory
    copyImages(outputDir);
    
    // Generate case study pages
    if (data.caseStudies) {
      let caseStudyCount = 0;
      for (const [projectId, caseStudy] of Object.entries(data.caseStudies)) {
        const caseStudyPath = path.join(outputDir, `case-study-${projectId}.html`);
        const caseStudyHTML = generateCaseStudyHTML(projectId, caseStudy, data);
        fs.writeFileSync(caseStudyPath, caseStudyHTML);
        console.log(`✅ Generated case-study-${projectId}.html`);
        caseStudyCount++;
      }
      console.log(`\n📄 Generated ${caseStudyCount} case study page(s)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Export Complete! ✨');
    console.log('='.repeat(60));
    console.log(`\n📍 Location: ${outputDir}`);
    console.log('\nYour portfolio is ready to deploy!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Generate HTML for a portfolio (for API use)
 * Processes portfolio data and returns complete HTML string
 */
export function generatePortfolioHTML(portfolioData) {
  try {
    // Process portfolio data to match expected format
    const processedData = processPortfolioData(portfolioData);
    
    // Generate HTML content
    const htmlContent = createHTMLFromData(processedData);
    
    // Wrap in full HTML template
    const fullHTML = HTML_TEMPLATE(processedData).replace('{CONTENT}', htmlContent);
    
    return fullHTML;
  } catch (error) {
    console.error('❌ HTML generation failed:', error);
    throw error;
  }
}

/**
 * Generate Serene template project detail HTML
 */
function generateSereneProjectHTML(project, portfolioData, subdomain) {
  const title = project.title || 'Project';
  const description = project.description || '';
  const detailedDescription = (project.detailedDescription || '').replace(/\n/g, '<br>');
  const image = project.image || '';
  const portfolioTitle = portfolioData.title || portfolioData.hero?.title || 'Portfolio';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${portfolioTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Inter", sans-serif; background: #ffffff; color: #2d3748; }
    .serene-header { position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.98); border-bottom: 1px solid #e2e8f0; z-index: 100; backdrop-filter: blur(10px); }
    .serene-header-inner { max-width: 1400px; margin: 0 auto; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
    .serene-back-btn { font-size: 14px; color: #4a5568; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; text-decoration: none; transition: opacity 0.3s ease; }
    .serene-back-btn:hover { opacity: 0.7; }
    .serene-header-label { font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.1em; }
    .serene-main { padding-top: 80px; max-width: 1200px; margin: 0 auto; padding: 80px 24px 80px; }
    .serene-title-section { margin-bottom: 48px; text-align: center; }
    .serene-title { font-size: clamp(32px, 5vw, 56px); color: #4a5568; font-weight: 400; line-height: 1.2; margin-bottom: 16px; }
    .serene-subtitle { font-size: clamp(16px, 2vw, 20px); color: #718096; font-weight: 500; line-height: 1.6; }
    .serene-image-container { width: 100%; margin-bottom: 64px; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); }
    .serene-image { width: 100%; height: auto; max-height: 70vh; object-fit: cover; display: block; }
    .serene-no-image { width: 100%; height: 60vh; background: #f0fff4; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #718096; text-transform: uppercase; letter-spacing: 0.1em; }
    .serene-description { max-width: 800px; margin: 0 auto 80px; font-size: clamp(16px, 2vw, 18px); color: #2d3748; line-height: 1.8; font-weight: 500; }
    .serene-footer { background: #f7fafc; border-top: 1px solid #e2e8f0; padding: 40px 24px; text-align: center; }
    .serene-footer-btn { font-size: 14px; padding: 14px 32px; background: #4a5568; color: #ffffff; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; text-decoration: none; display: inline-block; transition: all 0.3s ease; }
    .serene-footer-btn:hover { background: #2d3748; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    @media (max-width: 768px) { .serene-header-inner { padding: 16px 20px; } .serene-main { padding: 80px 20px 60px; } }
  </style>
</head>
<body>
  <header class="serene-header">
    <div class="serene-header-inner">
      <a href="/${subdomain}/html" class="serene-back-btn">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to Gallery
      </a>
      <span class="serene-header-label">Project Detail</span>
    </div>
  </header>
  <main class="serene-main">
    <div class="serene-title-section">
      <h1 class="serene-title">${title}</h1>
      ${description ? `<p class="serene-subtitle">${description}</p>` : ''}
    </div>
    <div class="serene-image-container">
      ${image ? `<img src="${image}" alt="${title}" class="serene-image">` : '<div class="serene-no-image">No Image</div>'}
    </div>
    ${detailedDescription ? `<div class="serene-description">${detailedDescription}</div>` : ''}
  </main>
  <footer class="serene-footer">
    <a href="/${subdomain}/html" class="serene-footer-btn">View All Projects</a>
  </footer>
</body>
</html>`;
}

/**
 * Generate Chic template project detail HTML
 */
function generateChicProjectHTML(project, portfolioData, subdomain) {
  const title = project.title || 'Project';
  const subtitle = project.subtitle || '';
  const description = project.description || '';
  const detailedDescription = (project.detailedDescription || '').replace(/\n/g, '<br>');
  const image = project.image || '';
  const category = project.category || '';
  const year = project.year || '';
  const awards = project.awards || '';
  const portfolioTitle = portfolioData.title || portfolioData.hero?.name || 'Portfolio';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${portfolioTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif; background: #ffffff; color: #000000; }
    .chic-header { position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.98); border-bottom: 1px solid #e5e5e5; z-index: 100; backdrop-filter: blur(10px); }
    .chic-header-inner { max-width: 1400px; margin: 0 auto; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; }
    .chic-back-btn { font-size: 11px; color: #000000; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; text-decoration: none; transition: opacity 0.3s ease; }
    .chic-back-btn:hover { opacity: 0.6; }
    .chic-header-label { font-family: "SF Mono", "Monaco", monospace; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; }
    .chic-main { padding-top: 80px; max-width: 1200px; margin: 0 auto; padding: 80px 32px 80px; }
    .chic-meta-section { margin-bottom: 48px; border-bottom: 1px solid #e5e5e5; padding-bottom: 32px; }
    .chic-title { font-size: clamp(32px, 5vw, 56px); color: #000000; font-weight: 600; line-height: 1.1; margin-bottom: 16px; letter-spacing: -0.02em; }
    .chic-subtitle { font-size: clamp(16px, 2vw, 20px); color: #666666; font-weight: 500; line-height: 1.4; margin-bottom: 24px; }
    .chic-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; margin-top: 24px; }
    .chic-meta-item-label { font-family: "SF Mono", "Monaco", monospace; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 600; }
    .chic-meta-item-value { font-size: 14px; color: #000000; font-weight: 500; }
    .chic-image-container { width: 100%; margin-bottom: 64px; overflow: hidden; }
    .chic-image { width: 100%; height: auto; max-height: 70vh; object-fit: contain; display: block; background: #f5f5f5; }
    .chic-no-image { width: 100%; height: 60vh; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-family: "SF Mono", "Monaco", monospace; font-size: 11px; color: #cccccc; text-transform: uppercase; letter-spacing: 0.1em; }
    .chic-description { max-width: 700px; margin: 0 auto 80px; font-size: clamp(15px, 2vw, 17px); color: #333333; line-height: 1.7; font-weight: 400; }
    .chic-footer { background: #fafafa; border-top: 1px solid #e5e5e5; padding: 40px 32px; text-align: center; }
    .chic-footer-btn { font-size: 11px; padding: 14px 32px; background: #000000; color: #ffffff; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; text-decoration: none; display: inline-block; transition: all 0.3s ease; }
    .chic-footer-btn:hover { background: #333333; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    @media (max-width: 768px) { .chic-header-inner { padding: 16px 20px; } .chic-main { padding: 80px 20px 60px; } }
  </style>
</head>
<body>
  <header class="chic-header">
    <div class="chic-header-inner">
      <a href="/${subdomain}/html" class="chic-back-btn">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke-linecap="square" stroke-linejoin="miter"/></svg>
        BACK
      </a>
      <span class="chic-header-label">Project Detail</span>
    </div>
  </header>
  <main class="chic-main">
    <div class="chic-meta-section">
      <h1 class="chic-title">${title}</h1>
      ${subtitle ? `<p class="chic-subtitle">${subtitle}</p>` : ''}
      <div class="chic-meta-grid">
        ${category ? `<div><div class="chic-meta-item-label">Category</div><div class="chic-meta-item-value">${category}</div></div>` : ''}
        ${year ? `<div><div class="chic-meta-item-label">Year</div><div class="chic-meta-item-value">${year}</div></div>` : ''}
        ${awards ? `<div><div class="chic-meta-item-label">Awards</div><div class="chic-meta-item-value">${awards}</div></div>` : ''}
      </div>
    </div>
    <div class="chic-image-container">
      ${image ? `<img src="${image}" alt="${title}" class="chic-image">` : '<div class="chic-no-image">No Image</div>'}
    </div>
    ${detailedDescription ? `<div class="chic-description">${detailedDescription}</div>` : ''}
  </main>
  <footer class="chic-footer">
    <a href="/${subdomain}/html" class="chic-footer-btn">View All Projects</a>
  </footer>
</body>
</html>`;
}

/**
 * Generate BoldFolio template project detail HTML
 */
function generateBoldFolioProjectHTML(project, portfolioData, subdomain) {
  const title = project.title || 'Project';
  const description = (project.description || '').replace(/\n/g, '<br>');
  const detailedDescription = (project.detailedDescription || '').replace(/\n/g, '<br>');
  const images = project.images || [];
  const logo = project.logo || '';
  const portfolioTitle = portfolioData.title || portfolioData.hero?.name || 'Portfolio';

  const imagesHTML = images.filter(img => img && img.src).map((img, i) =>
    `<div class="boldfolio-gallery-image"><img src="${img.src}" alt="${title} - Image ${i + 1}" style="width: ${img.width || 'auto'}; height: ${img.height || 'auto'};"></div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${portfolioTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Graphik", -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #ffffff; color: #000000; font-weight: 500; }
    .boldfolio-header { position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.98); border-bottom: 1px solid #e5e5e5; z-index: 100; backdrop-filter: blur(10px); }
    .boldfolio-header-inner { max-width: 1400px; margin: 0 auto; padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; }
    .boldfolio-back-btn { font-size: 14px; color: #ff0080; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; text-decoration: none; transition: all 0.3s ease; }
    .boldfolio-back-btn:hover { opacity: 0.7; transform: translateX(-4px); }
    .boldfolio-header-label { font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; }
    .boldfolio-main { padding-top: 100px; max-width: 1200px; margin: 0 auto; padding: 100px 40px 100px; }
    .boldfolio-title-section { margin-bottom: 60px; text-align: center; }
    .boldfolio-title { font-size: clamp(36px, 6vw, 72px); color: #000000; font-weight: 700; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.01em; }
    .boldfolio-description { font-size: clamp(18px, 2.5vw, 24px); color: #666666; font-weight: 400; line-height: 1.6; max-width: 800px; margin: 0 auto 30px; }
    .boldfolio-detail-logo { margin-top: 40px; display: flex; align-items: center; justify-content: center; color: #ff0080; font-size: clamp(48px, 10vw, 120px); font-weight: 300; }
    .boldfolio-images-gallery { display: flex; flex-wrap: wrap; gap: 30px; justify-content: center; margin-bottom: 80px; }
    .boldfolio-gallery-image { overflow: hidden; border-radius: 4px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
    .boldfolio-gallery-image img { max-width: 100%; height: auto; object-fit: cover; display: block; }
    .boldfolio-detailed { max-width: 800px; margin: 0 auto 100px; font-size: clamp(16px, 2vw, 18px); color: #000000; line-height: 1.8; font-weight: 400; }
    .boldfolio-footer { background: #fafafa; border-top: 1px solid #e5e5e5; padding: 60px 40px; text-align: center; }
    .boldfolio-footer-btn { font-size: 14px; padding: 18px 40px; background: #ff0080; color: #ffffff; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 4px; text-decoration: none; display: inline-block; transition: all 0.3s ease; }
    .boldfolio-footer-btn:hover { background: #e60073; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 0, 128, 0.3); }
    @media (max-width: 768px) { .boldfolio-header-inner { padding: 20px; } .boldfolio-main { padding: 100px 20px 80px; } .boldfolio-images-gallery { gap: 16px; } }
  </style>
</head>
<body>
  <header class="boldfolio-header">
    <div class="boldfolio-header-inner">
      <a href="/${subdomain}/html" class="boldfolio-back-btn">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke-linecap="round" stroke-linejoin="round"/></svg>
        BACK TO WORK
      </a>
      <span class="boldfolio-header-label">Project Detail</span>
    </div>
  </header>
  <main class="boldfolio-main">
    <div class="boldfolio-title-section">
      <h1 class="boldfolio-title">${title}</h1>
      ${description ? `<div class="boldfolio-description">${description}</div>` : ''}
      ${logo ? `<div class="boldfolio-detail-logo">${logo}</div>` : ''}
    </div>
    ${imagesHTML ? `<div class="boldfolio-images-gallery">${imagesHTML}</div>` : ''}
    ${detailedDescription ? `<div class="boldfolio-detailed">${detailedDescription}</div>` : ''}
  </main>
  <footer class="boldfolio-footer">
    <a href="/${subdomain}/html" class="boldfolio-footer-btn">View All Projects</a>
  </footer>
</body>
</html>`;
}

/**
 * Generate all HTML files for portfolio including case studies and project pages
 * Returns object with index.html, case study HTML files, and template-specific project pages
 */
export function generateAllPortfolioFiles(portfolioData, options = {}) {
  try {
    // Options for PDF generation
    const { forPDF = false } = options;

    // Process portfolio data to match expected format
    const processedData = processPortfolioData(portfolioData);

    const files = {};

    // Generate main portfolio page
    const htmlContent = createHTMLFromData(processedData);
    const fullHTML = HTML_TEMPLATE(processedData).replace('{CONTENT}', htmlContent);
    files['index.html'] = fullHTML;

    // Get template type and subdomain for project page generation
    // Handle both processed data and raw portfolio data
    const rawData = portfolioData.toObject ? portfolioData.toObject() : portfolioData;
    const templateType = (rawData.template || '').toLowerCase();
    const subdomain = rawData.slug || rawData.subdomain || 'portfolio';

    let caseStudiesGenerated = 0;
    let projectPagesGenerated = 0;

    // ========================================
    // TEMPLATE-SPECIFIC PROJECT PAGE GENERATION
    // ========================================
    // Echelon uses case study system (handled below)
    // Serene, Chic, BoldFolio get individual project pages

    if (templateType === 'serene') {
      // Serene: Projects are in gallery rows (firstRow, secondRow, thirdRow)
      const gallery = rawData.content?.gallery || {};
      const allProjects = [
        ...(gallery.firstRow || []),
        ...(gallery.secondRow || []),
        ...(gallery.thirdRow || [])
      ];

      console.log(`\n🎨 Serene template: Generating ${allProjects.length} project pages`);

      allProjects.forEach((project) => {
        if (project && project.id) {
          const projectHTML = generateSereneProjectHTML(project, rawData, subdomain);
          files[`project-${project.id}.html`] = projectHTML;
          projectPagesGenerated++;
          console.log(`  ✅ Generated: project-${project.id}.html`);
        }
      });
    } else if (templateType === 'chic') {
      // Chic: Projects are in content.work.projects
      const projects = rawData.content?.work?.projects || [];

      console.log(`\n🎨 Chic template: Generating ${projects.length} project pages`);

      projects.forEach((project, index) => {
        const projectId = project.id || `chic-${index}`;
        const projectWithId = { ...project, id: projectId };
        const projectHTML = generateChicProjectHTML(projectWithId, rawData, subdomain);
        files[`project-${projectId}.html`] = projectHTML;
        projectPagesGenerated++;
        console.log(`  ✅ Generated: project-${projectId}.html`);
      });
    } else if (templateType === 'boldfolio') {
      // BoldFolio: Projects are in content.work.projects
      const projects = rawData.content?.work?.projects || [];

      console.log(`\n🎨 BoldFolio template: Generating ${projects.length} project pages`);

      projects.forEach((project, index) => {
        const projectId = project.id || `boldfolio-${index}`;
        const projectWithId = { ...project, id: projectId };
        const projectHTML = generateBoldFolioProjectHTML(projectWithId, rawData, subdomain);
        files[`project-${projectId}.html`] = projectHTML;
        projectPagesGenerated++;
        console.log(`  ✅ Generated: project-${projectId}.html`);
      });
    } else if (templateType === 'echolon' || templateType === 'echelon') {
      // Echelon: Uses case study system - only generate case study pages when they exist
      console.log(`\n🎨 Echelon template: Using case study system (no automatic project pages)`);
    } else {
      console.log(`\nℹ️  Unknown template "${templateType}" - skipping project page generation`);
    }

    // ========================================
    // CASE STUDY PAGE GENERATION (ALL TEMPLATES)
    // ========================================
    // Generate case study pages if they exist (primarily for Echelon)
    if (processedData.caseStudies && typeof processedData.caseStudies === 'object') {
      for (const [projectId, caseStudy] of Object.entries(processedData.caseStudies)) {
        const caseStudyHTML = generateCaseStudyHTML(projectId, caseStudy, processedData, { forPDF });
        files[`case-study-${projectId}.html`] = caseStudyHTML;
        caseStudiesGenerated++;
      }
    }

    // Also check if work projects have case studies
    if (processedData.work?.projects) {
      processedData.work.projects.forEach((project, index) => {
        if (project.hasCaseStudy && project.caseStudy) {
          const projectId = project.id || index;
          const caseStudyHTML = generateCaseStudyHTML(projectId, project.caseStudy, processedData, { forPDF });
          files[`case-study-${projectId}.html`] = caseStudyHTML;
          caseStudiesGenerated++;
        }
      });
    }

    // Summary logging
    console.log(`\n📊 Generation Summary:`);
    console.log(`  - Main page: index.html`);
    console.log(`  - Project pages: ${projectPagesGenerated}`);
    console.log(`  - Case study pages: ${caseStudiesGenerated}`);
    console.log(`  - Total files: ${Object.keys(files).length}`);

    return files;
  } catch (error) {
    console.error('❌ HTML generation failed:', error);
    throw error;
  }
}

/**
 * Validates that HTML content doesn't contain template placeholder data
 * @param {string} html - The HTML content to validate
 * @returns {boolean} - Returns true if valid (no placeholder data), false if placeholders found
 */
function validateNoPlaceholderData(html) {
  // List of known placeholder/template strings that should NOT appear in production
  const placeholders = [
    'JOHN DESIGNER',
    'BRAND IDENTITY SYSTEM',
    'DESIGNING WITH PRECISION',
    'Case studies in clarity and form',
    'I am a designer focused on minimalism',
    'Comprehensive brand identity and guidelines for a tech startup',
    'LOGO DESIGN\\nPROCESS',
    'In this article I will share my logo design process'
  ];

  // Check if any placeholder appears in the HTML
  for (const placeholder of placeholders) {
    if (html && html.includes(placeholder)) {
      console.error(`⚠️  Warning: Generated HTML contains template placeholder: "${placeholder}"`);
      return false;
    }
  }

  return true;
}

/**
 * Process portfolio data from database format to template format
 */
function processPortfolioData(inputData) {
  // Handle Mongoose document - convert to plain object
  const data = inputData.toObject ? inputData.toObject() : inputData;
  
  // Check if it's portfolio JSON structure (with sections array)
  // Note: Must check for non-empty array, as empty [] is truthy
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    const sections = {};
    data.sections.forEach(section => {
      sections[section.type] = section.content;
    });
    
    // Handle projects data properly
    const projectsContent = sections.projects || sections.work?.projects || [];
    const hasProjects = Array.isArray(projectsContent) && projectsContent.length > 0;
    
    // Use actual user data
    const finalProjects = hasProjects ? projectsContent : [];
    const totalTags = finalProjects.reduce((total, project) => total + (project.tags?.length || 0), 0);
    
    return {
      hero: sections.hero || { title: 'PORTFOLIO', subtitle: 'Creative Work' },
      about: sections.about || { name: 'Designer', bio: 'Creative professional' },
      work: {
        heading: sections.work?.heading || "My Work",
        projects: finalProjects.map((project, index) => ({
          id: project.id || index,
          title: project.title || 'Project',
          meta: project.meta || 'PROJECT',
          description: project.description || '',
          image: project.image || project.thumbnail || '',
          tags: project.tags || [],
          hasCaseStudy: project.hasCaseStudy || false
        }))
      },
      caseStudies: data.caseStudies || {},
      gallery: sections.gallery || { heading: 'VISUAL STUDIES', images: [] },
      contact: sections.contact || {},
      styling: data.styling
    };
  }
  
  // Check if it's using 'content' field (Portfolio model format)
  if (data.content && typeof data.content === 'object') {
    // Get projects and ensure they have proper structure
    const rawProjects = data.content.work?.projects || [];
    const processedProjects = rawProjects.map((project, index) => ({
      id: project.id || index,
      title: project.title || 'Project',
      meta: project.meta || 'PROJECT',
      description: project.description || '',
      image: project.image || project.thumbnail || '',
      tags: project.tags || [],
      hasCaseStudy: project.hasCaseStudy || false  // Preserve this flag!
    }));

    console.log(`\n📦 Processing ${processedProjects.length} projects:`);
    processedProjects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} - hasCaseStudy: ${p.hasCaseStudy}`);
    });

    return {
      hero: data.content.hero || { title: data.title || 'PORTFOLIO', subtitle: data.description || 'Creative Work' },
      about: data.content.about || { name: 'Designer', bio: 'Creative professional' },
      work: {
        heading: data.content.work?.heading || "My Work",
        projects: processedProjects
      },
      caseStudies: data.caseStudies || {},
      gallery: data.content.gallery || { heading: 'VISUAL STUDIES', images: [] },
      contact: data.content.contact || {},
      styling: data.styling || {}
    };
  }
  
  // Production validation: throw error if no valid portfolio structure found
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the issue for debugging
  console.error(`\n❌ Portfolio data validation failed:`);
  console.error(`  - No 'sections' array found`);
  console.error(`  - No valid 'content' object found`);
  console.error(`  - Portfolio ID: ${data._id || 'unknown'}`);
  console.error(`  - Available keys: ${Object.keys(data).join(', ')}`);

  if (isProduction) {
    // In production, throw an error to prevent publishing with template data
    throw new Error('Portfolio data structure invalid. Portfolio must have either "sections" or "content" field with proper structure.');
  }

  // In development only: attempt to construct from available fields
  console.warn(`⚠️  Development mode: Attempting to construct portfolio structure from available fields`);

  // Try to build a valid structure from whatever fields we have
  const constructedData = {
    hero: {
      title: data.title || data.name || 'PORTFOLIO',
      subtitle: data.description || data.tagline || 'Creative Work'
    },
    about: {
      name: data.name || data.userName || 'Designer',
      bio: data.bio || data.description || 'Creative professional',
      email: data.email || '',
      phone: data.phone || ''
    },
    work: {
      heading: "My Work",
      projects: data.projects || []
    },
    caseStudies: data.caseStudies || {},
    gallery: data.gallery || { heading: 'VISUAL STUDIES', images: [] },
    contact: data.contact || {},
    styling: data.styling || {}
  };

  console.log(`✅ Constructed portfolio structure with ${constructedData.work.projects.length} projects`);
  return constructedData;
}

// Export functions for use in controllers
export { generateHTML, createHTMLFromData, processPortfolioData, validateNoPlaceholderData };

// Run export (commented out for API use - uncomment to run as script)
// exportPortfolio();
