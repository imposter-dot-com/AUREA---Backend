/**
 * Cleanup Orphaned Portfolios
 * Removes portfolios where the user no longer exists
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function cleanupOrphanedPortfolios() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Portfolio = mongoose.model('Portfolio', new mongoose.Schema({}, { strict: false }));

    // Get all valid user IDs
    const validUsers = await User.find({}, { _id: 1 }).lean();
    const validUserIds = validUsers.map(u => u._id.toString());
    console.log(`Found ${validUserIds.length} valid users`);

    // Find orphaned portfolios
    const allPortfolios = await Portfolio.find({}, { _id: 1, title: 1, userId: 1 }).lean();
    const orphanedPortfolios = allPortfolios.filter(p => {
      const userIdStr = p.userId?.toString();
      return !userIdStr || !validUserIds.includes(userIdStr);
    });

    console.log(`\nFound ${orphanedPortfolios.length} orphaned portfolios:`);
    orphanedPortfolios.forEach(p => {
      console.log(`  - ${p.title} (ID: ${p._id}, userId: ${p.userId || 'null'})`);
    });

    if (orphanedPortfolios.length === 0) {
      console.log('\nNo orphaned portfolios to delete.');
      await mongoose.disconnect();
      return;
    }

    // Delete orphaned portfolios
    const orphanedIds = orphanedPortfolios.map(p => p._id);
    const result = await Portfolio.deleteMany({ _id: { $in: orphanedIds } });
    console.log(`\nDeleted ${result.deletedCount} orphaned portfolios`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedPortfolios();
