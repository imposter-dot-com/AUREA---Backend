import mongoose from 'mongoose';
import Template from '../src/models/Template.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fix template sections - set required: false for optional sections
 * This script updates the database to match the intended template design
 * where only hero section should be required, other sections are optional
 */
async function fixTemplateSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all templates
    const templates = await Template.find({});
    console.log(`\n📋 Found ${templates.length} templates to update\n`);

    let updatedCount = 0;

    for (const template of templates) {
      console.log(`Processing template: ${template.name} (${template.templateId})`);

      let modified = false;

      // Update sections
      if (template.schema && template.schema.sections) {
        template.schema.sections = template.schema.sections.map(section => {
          const oldRequired = section.required;

          // Only hero section should be required
          // All other sections are optional
          if (section.id === 'hero') {
            section.required = true;
          } else {
            section.required = false;
          }

          if (oldRequired !== section.required) {
            console.log(`  - ${section.id}: required ${oldRequired} → ${section.required}`);
            modified = true;
          }

          return section;
        });

        if (modified) {
          // Mark the schema as modified to ensure it's saved
          template.markModified('schema');
          await template.save();
          updatedCount++;
          console.log(`  ✅ Updated ${template.name}`);
        } else {
          console.log(`  ⏭️  No changes needed for ${template.name}`);
        }
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ Successfully updated ${updatedCount} template(s)`);
    console.log('='.repeat(60));

    // Verify the changes
    console.log('\n🔍 Verification:');
    const verifyTemplates = await Template.find({});
    for (const template of verifyTemplates) {
      console.log(`\n${template.name} (${template.templateId}):`);
      if (template.schema && template.schema.sections) {
        template.schema.sections.forEach(section => {
          const status = section.required ? '✓ Required' : '○ Optional';
          console.log(`  ${status} - ${section.id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error fixing template sections:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fixTemplateSections()
    .then(() => {
      console.log('\n✅ Template section fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Template section fix failed:', error);
      process.exit(1);
    });
}

export default fixTemplateSections;
