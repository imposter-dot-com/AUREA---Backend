/**
 * Admin Script: Upgrade User to Premium
 * 
 * This script upgrades a user account to premium status.
 * 
 * Target User:
 *   Email: user2@gmail.com
 *   New Status: Premium (Pro Plan)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const result = dotenv.config({ path: join(__dirname, '..', '.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Please make sure .env file exists with MONGODB_URI');
  process.exit(1);
}

// Import User model
import User from '../src/models/User.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Target user email
const TARGET_EMAIL = 'user2@gmail.com';

// Premium configuration
const PREMIUM_CONFIG = {
  isPremium: true,
  premiumType: 'yearly',
  premiumStartDate: new Date(),
  premiumEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  subscription: {
    plan: 'pro',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  storage: {
    limit: 50 * 1024 * 1024 * 1024 // 50GB for premium users
  }
};

async function upgradeToPremium() {
  try {
    log('\n========================================', 'blue');
    log('  UPGRADE USER TO PREMIUM', 'blue');
    log('========================================\n', 'blue');

    // Connect to MongoDB
    log('Connecting to MongoDB...', 'yellow');
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB\n', 'green');

    // Find user
    log(`Looking for user: ${TARGET_EMAIL}`, 'yellow');
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
      log(`❌ User not found: ${TARGET_EMAIL}`, 'red');
      await mongoose.connection.close();
      process.exit(1);
    }

    log('✅ User found!\n', 'green');

    // Display current status
    log('Current User Status:', 'cyan');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Username:', user.username || 'Not set');
    console.log('  Premium Status:', user.isPremium ? '✅ Premium' : '❌ Free');
    console.log('  Premium Type:', user.premiumType);
    console.log('  Subscription Plan:', user.subscription?.plan || 'free');
    console.log('  Storage Limit:', `${(user.storage?.limit / (1024 * 1024 * 1024)).toFixed(2)} GB`);

    if (user.isPremium) {
      log('\n⚠️  User is already premium!', 'yellow');
      console.log('  Premium Start:', user.premiumStartDate);
      console.log('  Premium End:', user.premiumEndDate);
      
      log('\nDo you want to extend/update premium status? (Ctrl+C to cancel)', 'yellow');
    }

    // Update user to premium
    log('\nUpgrading to premium...', 'yellow');
    
    user.isPremium = PREMIUM_CONFIG.isPremium;
    user.premiumType = PREMIUM_CONFIG.premiumType;
    user.premiumStartDate = PREMIUM_CONFIG.premiumStartDate;
    user.premiumEndDate = PREMIUM_CONFIG.premiumEndDate;
    user.subscription.plan = PREMIUM_CONFIG.subscription.plan;
    user.subscription.expiresAt = PREMIUM_CONFIG.subscription.expiresAt;
    
    // Update storage limit but keep current usage
    user.storage.limit = PREMIUM_CONFIG.storage.limit;

    await user.save();

    log('✅ User successfully upgraded to premium!\n', 'green');

    // Display new status
    log('========================================', 'magenta');
    log('  NEW USER STATUS', 'magenta');
    log('========================================\n', 'magenta');
    
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Username:', user.username || 'Not set');
    console.log('  Premium Status:', '✅ Premium');
    console.log('  Premium Type:', user.premiumType);
    console.log('  Premium Start:', user.premiumStartDate.toLocaleDateString());
    console.log('  Premium End:', user.premiumEndDate.toLocaleDateString());
    console.log('  Subscription Plan:', user.subscription.plan);
    console.log('  Subscription Expires:', user.subscription.expiresAt.toLocaleDateString());
    console.log('  Storage Limit:', `${(user.storage.limit / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log('  Storage Used:', `${(user.storage.used / (1024 * 1024)).toFixed(2)} MB`);

    const daysRemaining = Math.ceil((user.premiumEndDate - new Date()) / (1000 * 60 * 60 * 24));
    log(`\n✨ Premium active for ${daysRemaining} days!`, 'green');

    // Close connection
    await mongoose.connection.close();
    log('\n✅ Database connection closed', 'green');
    log('\n========================================', 'blue');
    log('  UPGRADE COMPLETE!', 'blue');
    log('========================================\n', 'blue');

  } catch (error) {
    log('\n❌ Error upgrading user:', 'red');
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the upgrade
upgradeToPremium();
