/**
 * Clear Brute Force Protection Script
 * Removes brute force lockout for a specific user/email
 */

import dotenv from 'dotenv';
import { redisClient } from '../src/utils/cache.js';

dotenv.config();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function clearBruteForce() {
  try {
    // Get email from command line args
    const email = process.argv[2];

    if (!email) {
      log.error('Please provide an email address');
      log.info('Usage: node scripts/clear-brute-force.js <email>');
      log.info('Example: node scripts/clear-brute-force.js test@gmail.com');
      process.exit(1);
    }

    log.info(`Clearing brute force protection for: ${email.toLowerCase()}`);

    // Wait a moment for Redis to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const bruteForceKey = `brute:${email.toLowerCase()}`;

    if (redisClient && redisClient.isOpen) {
      // Check if key exists
      const exists = await redisClient.exists(bruteForceKey);

      if (exists) {
        await redisClient.del(bruteForceKey);
        log.success('Brute force protection cleared from Redis!');
        log.info('You can now try logging in again.');
      } else {
        log.warning('No brute force protection found in Redis for this email');
        log.info('The account might already be unlocked or using memory store.');
      }
    } else {
      log.warning('Redis is not available');
      log.info('Brute force data might be in memory store');
      log.info('Options:');
      log.info('  1. Restart the server to clear memory store');
      log.info('  2. Wait for the lockout to expire (max 15 minutes)');
    }

  } catch (error) {
    log.error('Error clearing brute force protection:');
    console.error(error);
  } finally {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
    process.exit(0);
  }
}

// Run the script
clearBruteForce();
