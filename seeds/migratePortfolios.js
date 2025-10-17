import mongoose from 'mongoose';
import Portfolio from '../src/models/Portfolio.js';
import Template from '../src/models/Template.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to update existing portfolios to work with the new template system
 * This script will:
 * 1. Ensure templates exist in the database
 * 2. Update all portfolios with templateId 'echelon' to reference the actual template ObjectId
 * 3. Add templateVersion and customData fields
 */

async function migratePortfolios() {
  try {
    console.log('🚀 Starting portfolio migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // First, ensure we have at least one template
    const templateCount = await Template.countDocuments({ isActive: true });

    if (templateCount === 0) {
      console.log('⚠️  No templates found. Running template seeder first...');

      // Import and run the template seeder
      const seedTemplates = (await import('./templateSeeds.js')).default;
      await seedTemplates();
    }

    // Get the classic template (which maps to the old 'echelon' template)
    let classicTemplate = await Template.findOne({ templateId: 'classic-minimal' });

    if (!classicTemplate) {
      // If classic template doesn't exist, get the default template
      classicTemplate = await Template.findDefault();

      if (!classicTemplate) {
        // If no default, get any active template
        classicTemplate = await Template.findOne({ isActive: true });
      }
    }

    if (!classicTemplate) {
      console.error('❌ No templates available for migration');
      throw new Error('No templates available for migration');
    }

    console.log(`📝 Using template: ${classicTemplate.name} (${classicTemplate._id})`);

    // Find all portfolios that need migration
    // These are portfolios with string templateId or missing the new fields
    const portfoliosToMigrate = await Portfolio.find({
      $or: [
        { templateId: { $type: 'string' } },  // Old string-based templateId
        { templateVersion: { $exists: false } },  // Missing templateVersion
        { customData: { $exists: false } }  // Missing customData
      ]
    });

    console.log(`📊 Found ${portfoliosToMigrate.length} portfolios to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const portfolio of portfoliosToMigrate) {
      try {
        const updateData = {
          templateId: classicTemplate._id,
          templateVersion: classicTemplate.version
        };

        // Add customData if missing
        if (!portfolio.customData) {
          // Copy existing content to customData
          updateData.customData = portfolio.content || {};
        }

        // Update the portfolio
        await Portfolio.updateOne(
          { _id: portfolio._id },
          { $set: updateData }
        );

        migratedCount++;
        console.log(`  ✅ Migrated portfolio: ${portfolio.title} (${portfolio._id})`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error migrating portfolio ${portfolio._id}:`, error.message);
      }
    }

    // Final statistics
    console.log('\n📊 Migration Summary:');
    console.log(`  - Total portfolios found: ${portfoliosToMigrate.length}`);
    console.log(`  - Successfully migrated: ${migratedCount}`);
    console.log(`  - Errors: ${errorCount}`);

    // Verify migration
    const stillNeedMigration = await Portfolio.countDocuments({
      $or: [
        { templateId: { $type: 'string' } },
        { templateVersion: { $exists: false } },
        { customData: { $exists: false } }
      ]
    });

    if (stillNeedMigration > 0) {
      console.log(`\n⚠️  Warning: ${stillNeedMigration} portfolios still need migration`);
    } else {
      console.log('\n✅ All portfolios successfully migrated!');
    }

    return {
      total: portfoliosToMigrate.length,
      migrated: migratedCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  migratePortfolios()
    .then((result) => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default migratePortfolios;