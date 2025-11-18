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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            padding: 48px 40px;
            text-align: center;
          }
          .logo {
            font-size: 36px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
            margin-bottom: 8px;
          }
          .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            font-weight: 500;
          }
          .content {
            padding: 48px 40px;
            text-align: center;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 16px;
          }
          .message {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .otp-box {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin: 32px 0;
          }
          .otp-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255,255,255,0.6);
            margin-bottom: 12px;
          }
          .otp-code {
            font-size: 48px;
            font-weight: 900;
            letter-spacing: 12px;
            margin: 16px 0;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            color: #fb8500;
          }
          .otp-expiry {
            font-size: 13px;
            color: rgba(255,255,255,0.6);
            margin-top: 12px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
            margin: 32px 0;
          }
          .security-note {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          .footer-text {
            color: #999;
            font-size: 12px;
            line-height: 1.8;
          }
          @media only screen and (max-width: 600px) {
            .header, .content, .footer { padding: 32px 24px; }
            .otp-code { font-size: 36px; letter-spacing: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <div class="subtitle">Email Verification</div>
          </div>

          <div class="content">
            <div class="greeting">Hello <strong>${name}</strong>,</div>
            <div class="message">
              Thank you for signing up! Please use the verification code below to verify your email address and start building your portfolio.
            </div>

            <div class="otp-box">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱ Valid for 10 minutes</div>
            </div>

            <div class="divider"></div>

            <div class="security-note">
              If you didn't create an account with AUREA, you can safely ignore this email.
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} AUREA. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 48px 40px;
            text-align: center;
          }
          .logo {
            font-size: 36px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
            margin-bottom: 8px;
          }
          .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            font-weight: 500;
          }
          .content {
            padding: 48px 40px;
            text-align: center;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 16px;
          }
          .message {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .otp-box {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin: 32px 0;
          }
          .otp-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255,255,255,0.6);
            margin-bottom: 12px;
          }
          .otp-code {
            font-size: 48px;
            font-weight: 900;
            letter-spacing: 12px;
            margin: 16px 0;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            color: #10b981;
          }
          .otp-expiry {
            font-size: 13px;
            color: rgba(255,255,255,0.6);
            margin-top: 12px;
          }
          .warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 32px 0;
            border-radius: 8px;
            text-align: left;
          }
          .warning-title {
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .warning-text {
            color: #78350f;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          .footer-text {
            color: #999;
            font-size: 12px;
            line-height: 1.8;
          }
          @media only screen and (max-width: 600px) {
            .header, .content, .footer { padding: 32px 24px; }
            .otp-code { font-size: 36px; letter-spacing: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <div class="subtitle">Secure Login</div>
          </div>

          <div class="content">
            <div class="greeting">Hello <strong>${name}</strong>,</div>
            <div class="message">
              Here's your one-time login code. Enter this code to securely access your account.
            </div>

            <div class="otp-box">
              <div class="otp-label">Login Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱ Valid for 10 minutes</div>
            </div>

            <div class="warning">
              <div class="warning-title">
                <span>🔐</span>
                <span>Security Notice</span>
              </div>
              <div class="warning-text">
                If you didn't request this code, someone may be trying to access your account. Please secure your account immediately and change your password.
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} AUREA. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            padding: 48px 40px;
            text-align: center;
          }
          .logo {
            font-size: 36px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
            margin-bottom: 8px;
          }
          .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            font-weight: 500;
          }
          .content {
            padding: 48px 40px;
            text-align: center;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 16px;
          }
          .message {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .reset-button {
            display: inline-block;
            padding: 16px 48px;
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(251, 133, 0, 0.3);
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(251, 133, 0, 0.4);
          }
          .info-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 32px 0;
            border-radius: 8px;
            text-align: left;
          }
          .info-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-text {
            color: #1e3a8a;
            font-size: 14px;
            line-height: 1.6;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
            margin: 32px 0;
          }
          .security-note {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .url-box {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 8px;
            word-break: break-all;
            font-size: 12px;
            color: #666;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            text-align: left;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          .footer-text {
            color: #999;
            font-size: 12px;
            line-height: 1.8;
          }
          @media only screen and (max-width: 600px) {
            .header, .content, .footer { padding: 32px 24px; }
            .reset-button { padding: 14px 32px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <div class="subtitle">Password Reset Request</div>
          </div>

          <div class="content">
            <div class="greeting">Hello <strong>${name}</strong>,</div>
            <div class="message">
              We received a request to reset your password. Click the button below to create a new password for your account.
            </div>

            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>

            <div class="info-box">
              <div class="info-title">
                <span>⏰</span>
                <span>Important</span>
              </div>
              <div class="info-text">
                This password reset link will expire in 1 hour for security reasons. If you need to reset your password after that, you'll need to request a new link.
              </div>
            </div>

            <div class="divider"></div>

            <div class="security-note">
              If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
            </div>

            <div style="font-size: 13px; color: #999; margin-bottom: 8px;">
              If the button doesn't work, copy and paste this link into your browser:
            </div>
            <div class="url-box">${resetUrl}</div>
          </div>

          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} AUREA. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            padding: 64px 40px;
            text-align: center;
          }
          .logo {
            font-size: 48px;
            font-weight: 900;
            color: white;
            letter-spacing: -2px;
            margin-bottom: 16px;
          }
          .welcome-title {
            font-size: 32px;
            font-weight: 900;
            color: white;
            margin-bottom: 12px;
            line-height: 1.2;
          }
          .welcome-subtitle {
            font-size: 16px;
            color: rgba(255,255,255,0.9);
            font-weight: 500;
          }
          .content {
            padding: 48px 40px;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 16px;
            text-align: center;
          }
          .message {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            text-align: center;
            margin-bottom: 40px;
          }
          .features-title {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 24px;
            text-align: center;
          }
          .features-grid {
            display: grid;
            gap: 16px;
            margin-bottom: 40px;
          }
          .feature {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #f8f8f8;
            border-radius: 8px;
            transition: transform 0.2s;
          }
          .feature-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 14px;
          }
          .feature-text {
            color: #333;
            font-size: 14px;
            line-height: 1.5;
            font-weight: 500;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 48px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
            margin: 40px 0;
          }
          .help-section {
            text-align: center;
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
          }
          .footer-text {
            color: #999;
            font-size: 12px;
            line-height: 1.8;
          }
          @media only screen and (max-width: 600px) {
            .header { padding: 48px 24px; }
            .content, .footer { padding: 32px 24px; }
            .logo { font-size: 36px; }
            .welcome-title { font-size: 24px; }
            .cta-button { padding: 14px 32px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUREA</div>
            <div class="welcome-title">Welcome Aboard!</div>
            <div class="welcome-subtitle">Start building your dream portfolio today</div>
          </div>

          <div class="content">
            <div class="greeting">Hello <strong>${name}</strong>,</div>
            <div class="message">
              Thank you for joining AUREA! We're thrilled to have you as part of our community. You now have access to everything you need to create a stunning professional portfolio.
            </div>

            <div class="features-title">What You Can Do</div>
            <div class="features-grid">
              <div class="feature">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Create beautiful portfolios with customizable templates designed by professionals</div>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Showcase your projects with detailed case studies and rich media</div>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Publish instantly with custom subdomains or deploy to Vercel</div>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Export portfolios as professional PDFs for offline sharing</div>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Access premium features and templates to stand out from the crowd</div>
              </div>
            </div>

            <div class="cta-container">
              <a href="${config.frontend.url}/dashboard" class="cta-button">Go to Dashboard</a>
            </div>

            <div class="divider"></div>

            <div class="help-section">
              Need help getting started? Check out our documentation or reach out to our support team. We're here to help you succeed!
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              © ${new Date().getFullYear()} AUREA. All rights reserved.<br>
              This is an automated message. Please do not reply to this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export default new EmailService();
