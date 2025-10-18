import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fix template sections using direct MongoDB operations
 * This bypasses Mongoose validation to directly update the database
 */
async function fixTemplateSectionsDirect() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('templates');

    // Get all templates
    const templates = await collection.find({}).toArray();
    console.log(`\n📋 Found ${templates.length} templates to update\n`);

    let updatedCount = 0;

    for (const template of templates) {
      console.log(`Processing template: ${template.name} (${template.templateId})`);

      if (template.schema && template.schema.sections && Array.isArray(template.schema.sections)) {
        let modified = false;

        // Update sections - only hero should be required
        const updatedSections = template.schema.sections.map(section => {
          const oldRequired = section.required;

          // Only hero section should be required
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
          // Update directly in database
          await collection.updateOne(
            { _id: template._id },
            {
              $set: {
                'schema.sections': updatedSections,
                updatedAt: new Date()
              }
            }
          );
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
    const verifiedTemplates = await collection.find({}).toArray();
    for (const template of verifiedTemplates) {
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
  fixTemplateSectionsDirect()
    .then(() => {
      console.log('\n✅ Template section fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Template section fix failed:', error);
      process.exit(1);
    });
}

export default fixTemplateSectionsDirect;
