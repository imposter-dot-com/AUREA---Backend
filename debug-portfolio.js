/**
 * Debug script to check portfolio structure
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portfolio from './src/models/Portfolio.js';

dotenv.config();

const portfolioId = '691e821ab4443125952a6616';

async function debugPortfolio() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch the portfolio
    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      console.log('❌ Portfolio not found');
      process.exit(1);
    }

    console.log('📋 Portfolio Details:');
    console.log('═══════════════════════════════════════\n');
    console.log(`ID: ${portfolio._id}`);
    console.log(`Title: ${portfolio.title}`);
    console.log(`Template: ${portfolio.template}`);
    console.log(`Created: ${portfolio.createdAt}`);
    console.log(`\n📊 Content Structure:`);
    console.log('═══════════════════════════════════════\n');

    // Check if content exists
    if (!portfolio.content) {
      console.log('⚠️  No content field found');
    } else {
      console.log('Content keys:', Object.keys(portfolio.content));

      // Check for gallery structure (Serene template)
      if (portfolio.content.gallery) {
        console.log('\n🎨 Gallery Structure:');
        console.log('─────────────────────────────────────');
        console.log('Gallery keys:', Object.keys(portfolio.content.gallery));

        const firstRow = portfolio.content.gallery.firstRow || [];
        const secondRow = portfolio.content.gallery.secondRow || [];
        const thirdRow = portfolio.content.gallery.thirdRow || [];

        console.log(`\nFirst Row: ${firstRow.length} projects`);
        firstRow.forEach((project, index) => {
          console.log(`  [${index}] ID: ${project.id || 'NO ID'}, Title: ${project.title || 'NO TITLE'}`);
        });

        console.log(`\nSecond Row: ${secondRow.length} projects`);
        secondRow.forEach((project, index) => {
          console.log(`  [${index}] ID: ${project.id || 'NO ID'}, Title: ${project.title || 'NO TITLE'}`);
        });

        console.log(`\nThird Row: ${thirdRow.length} projects`);
        thirdRow.forEach((project, index) => {
          console.log(`  [${index}] ID: ${project.id || 'NO ID'}, Title: ${project.title || 'NO TITLE'}`);
        });

        console.log(`\n📊 Total Projects: ${firstRow.length + secondRow.length + thirdRow.length}`);
      } else {
        console.log('⚠️  No gallery structure found in content');
      }

      // Check for work.projects structure (Chic/BoldFolio template)
      if (portfolio.content.work) {
        console.log('\n💼 Work Structure:');
        console.log('─────────────────────────────────────');
        const projects = portfolio.content.work.projects || [];
        console.log(`Projects: ${projects.length}`);
        projects.forEach((project, index) => {
          console.log(`  [${index}] ID: ${project.id || 'NO ID'}, Title: ${project.title || 'NO TITLE'}`);
        });
      }
    }

    // Check sections field
    if (portfolio.sections && portfolio.sections.length > 0) {
      console.log('\n\n📄 Sections Field (Legacy):');
      console.log('═══════════════════════════════════════');
      console.log(`Found ${portfolio.sections.length} sections`);
      portfolio.sections.forEach((section, index) => {
        console.log(`  [${index}] Type: ${section.type || 'unknown'}, ID: ${section.id || 'none'}`);
      });
    }

    console.log('\n\n🔍 Raw Content JSON:');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(portfolio.content, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugPortfolio();
