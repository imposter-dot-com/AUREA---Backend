import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

/**
 * Delete a specific user by email
 */
async function deleteUser(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user first
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      process.exit(0);
    }

    console.log('📋 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log();

    // Delete the user
    await User.deleteOne({ _id: user._id });
    console.log('✅ User deleted successfully!');
    console.log();

    // Verify deletion
    const deletedCheck = await User.findOne({ email: email.toLowerCase() });
    if (!deletedCheck) {
      console.log('✅ Verified: User no longer exists in database');
    } else {
      console.log('⚠️  Warning: User still exists after deletion attempt');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/delete-user.js <email>');
  process.exit(1);
}

// Run the deletion
deleteUser(email);
