/**
 * Passport Configuration
 * Configures authentication strategies for OAuth
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';
import authService from '../core/services/AuthService.js';
import logger from '../infrastructure/logging/Logger.js';

/**
 * Initialize Passport with strategies
 */
export const initializePassport = () => {
  // Serialize user for session (not used with JWT, but required by Passport)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session (not used with JWT, but required by Passport)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await authService.repository.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure Google OAuth Strategy
  if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.google.clientId,
          clientSecret: config.oauth.google.clientSecret,
          callbackURL: config.oauth.google.callbackUrl,
          scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            logger.info('Google OAuth callback received', { profileId: profile.id });

            // Use AuthService to find or create user
            const result = await authService.findOrCreateGoogleUser(profile);

            // Pass user and token to callback
            done(null, result);
          } catch (error) {
            logger.error('Google OAuth authentication failed', {
              error: error.message,
              profileId: profile?.id
            });
            done(error, null);
          }
        }
      )
    );

    logger.info('Google OAuth strategy configured');
  } else {
    logger.warn('Google OAuth not configured - missing credentials');
  }
};

export default initializePassport;
