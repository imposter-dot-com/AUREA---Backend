import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from '../logging/Logger.js';
import { ServiceError } from '../../shared/exceptions/index.js';

/**
 * EmailService - Handles all email operations using Nodemailer
 * Supports SMTP configuration for sending OTP, password reset, and welcome emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter with SMTP configuration
   */
  initializeTransporter() {
    try {
      const emailConfig = config.email;

      if (!emailConfig.smtp.host || !emailConfig.smtp.user || !emailConfig.smtp.pass) {
        logger.warn('Email service not configured. Email functionality will be disabled.');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.port === 465, // true for 465, false for other ports
        auth: {
          user: emailConfig.smtp.user,
          pass: emailConfig.smtp.pass,
        },
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully', {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
      });
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      this.isConfigured = false;
    }
  }

  /**
   * Reinitialize transporter (useful after env vars are loaded)
   */
  reinitialize() {
    this.initializeTransporter();
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error: error.message });
      return false;
    }
  }

  /**
   * Send email using configured transporter
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      throw ServiceError.emailNotConfigured();
    }

    try {
      const mailOptions = {
        from: `${config.email.fromName} <${config.email.from}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message,
      });
      throw ServiceError.emailSendFailed(error.message);
    }
  }

  /**
   * Send OTP verification email
   * @param {string} email - User email
   * @param {string} otp - 6-digit OTP code
   * @param {string} name - User name
   */
  async sendVerificationOTP(email, otp, name = 'User') {
    const subject = 'Verify Your Email - AUREA';
    const html = this.getVerificationOTPTemplate(otp, name);
    const text = `Hello ${name},\n\nYour email verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe AUREA Team`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send login OTP email
   * @param {string} email - User email
   * @param {string} otp - 6-digit OTP code
   * @param {string} name - User name
   */
  async sendLoginOTP(email, otp, name = 'User') {
    const subject = 'Your Login Code - AUREA';
    const html = this.getLoginOTPTemplate(otp, name);
    const text = `Hello ${name},\n\nYour login code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email and secure your account.\n\nBest regards,\nThe AUREA Team`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Password reset token
   * @param {string} name - User name
   */
  async sendPasswordReset(email, resetToken, name = 'User') {
    const resetUrl = `${config.frontend.url}/reset-password/${resetToken}`;
    const subject = 'Password Reset Request - AUREA';
    const html = this.getPasswordResetTemplate(resetUrl, name);
    const text = `Hello ${name},\n\nYou requested a password reset for your AUREA account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe AUREA Team`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send welcome email
   * @param {string} email - User email
   * @param {string} name - User name
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to AUREA!';
    const html = this.getWelcomeEmailTemplate(name);
    const text = `Hello ${name},\n\nWelcome to AUREA! We're excited to have you on board.\n\nStart building your professional portfolio today and showcase your amazing work to the world.\n\nBest regards,\nThe AUREA Team`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Get verification OTP email template
   */
  getVerificationOTPTemplate(otp, name) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            margin-bottom: 10px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .content {
            text-align: center;
            color: #666;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <h2>Email Verification</h2>
          </div>

          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for signing up! Please use the verification code below to verify your email address:</p>
          </div>

          <div class="otp-box">
            <div>Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
          </div>

          <div class="content">
            <p>If you didn't request this code, please ignore this email.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AUREA. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get login OTP email template
   */
  getLoginOTPTemplate(otp, name) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Login Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            margin-bottom: 10px;
          }
          .otp-box {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .content {
            text-align: center;
            color: #666;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <h2>Login Verification Code</h2>
          </div>

          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Here's your one-time login code:</p>
          </div>

          <div class="otp-box">
            <div>Your Login Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AUREA. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   */
  getPasswordResetTemplate(resetUrl, name) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            margin-bottom: 10px;
          }
          .content {
            text-align: center;
            color: #666;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
          }
          .reset-button:hover {
            opacity: 0.9;
          }
          .expiry-notice {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <h2>Password Reset Request</h2>
          </div>

          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
          </div>

          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>

          <div class="expiry-notice">
            <strong>Note:</strong> This link will expire in 1 hour for security reasons.
          </div>

          <div class="content">
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AUREA. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   */
  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AUREA</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            margin-bottom: 10px;
          }
          .welcome-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .welcome-banner h1 {
            margin: 0;
            font-size: 36px;
          }
          .content {
            color: #666;
          }
          .features {
            margin: 30px 0;
          }
          .feature {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
          }
          .feature:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4A90E2;
            font-weight: bold;
            font-size: 20px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .action-button {
            display: inline-block;
            padding: 15px 40px;
            background: #4A90E2;
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
          </div>

          <div class="welcome-banner">
            <h1>Welcome to AUREA!</h1>
            <p style="font-size: 18px; margin-top: 10px;">We're excited to have you on board</p>
          </div>

          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for joining AUREA - the modern platform for building stunning professional portfolios!</p>

            <div class="features">
              <h3>Here's what you can do:</h3>
              <div class="feature">Create beautiful portfolios with customizable templates</div>
              <div class="feature">Showcase your projects and case studies</div>
              <div class="feature">Publish with custom subdomains or deploy to Vercel</div>
              <div class="feature">Export portfolios as professional PDFs</div>
              <div class="feature">Upgrade to premium for advanced features</div>
            </div>

            <p>Ready to get started? Create your first portfolio and let your work shine!</p>
          </div>

          <div class="button-container">
            <a href="${config.frontend.url}/dashboard" class="action-button">Go to Dashboard</a>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AUREA. All rights reserved.</p>
            <p>Need help? Visit our documentation or contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export default new EmailService();
