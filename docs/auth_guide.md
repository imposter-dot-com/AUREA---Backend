● Perfect! Let me show you exactly what you need for production. Here's what to add
   to your .env file with real values:

  🔴 Critical for Production (Must Have)

  1. Email Service (Required for authentication to work)

  # Email Configuration - Gmail (Recommended for quick setup)
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-actual-gmail@gmail.com
  SMTP_PASS=xxxx xxxx xxxx xxxx    # 16-character App Password from Google
  EMAIL_FROM=noreply@yourdomain.com
  EMAIL_FROM_NAME=AUREA

  How to get Gmail App Password:
  1. Go to: https://myaccount.goog
  le.com/apppasswords
  2. Sign in with your Gmail account
  3. Under "Select app" → Choose "Mail"
  4. Under "Select device" → Choose "Other" → Type "AUREA Backend"
  5. Click Generate
  6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)
  7. Use this as SMTP_PASS

  Alternative Email Services (if not using Gmail):

  # SendGrid (100 emails/day free)
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your-sendgrid-api-key

  # Or Mailgun (5,000 emails/month free)
  SMTP_HOST=smtp.mailgun.org
  SMTP_PORT=587
  SMTP_USER=postmaster@your-domain.mailgun.org
  SMTP_PASS=your-mailgun-password

  2. Security Secret (Required)

  # Generate a random 32-character string
  OTP_SECRET=AbCd1234EfGh5678IjKl9012MnOp3456

  How to generate:
  # On Linux/Mac:
  openssl rand -hex 32

  # Or use Node.js:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

  # Or online: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

  ---
  🟡 Optional (For Google Sign-In)

  3. Google OAuth (Only if you want "Sign in with Google")

  GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
  GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

  How to get Google OAuth credentials:

  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Create Project (if you don't have one)
  3. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
  4. Choose "Web application"
  5. Add Authorized redirect URIs:
    - Development: http://localhost:5000/api/auth/google/callback
    - Production: https://yourdomain.com/api/auth/google/callback
  6. Click Create
  7. Copy Client ID and Client Secret

  ---
  ✅ Already Have (No Change Needed)

  These have good defaults in code:

  # Email Settings (already have good defaults)
  OTP_EXPIRY_MINUTES=10              # OTP expires in 10 minutes
  RESET_TOKEN_EXPIRY_HOURS=1         # Reset link expires in 1 hour
  VERIFICATION_TOKEN_EXPIRY_HOURS=24 # Verification link expires in 24 hours

  ---
  📋 Priority Order

  For Basic Auth + Email Verification (Start Here):

  # 1. Email (Critical)
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-gmail@gmail.com
  SMTP_PASS=your-16-char-app-password
  EMAIL_FROM=noreply@aurea.com
  EMAIL_FROM_NAME=AUREA

  # 2. Security (Critical)
  OTP_SECRET=your-random-32-char-secret

  To Add Google Sign-In Later:

  # 3. Google OAuth (Optional)
  GOOGLE_CLIENT_ID=your-client-id
  GOOGLE_CLIENT_SECRET=your-client-secret
  GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

  ---
  🚀 Quick Start (5 Minutes)

  Step 1: Get Gmail App Password (2 min)

  1. Visit: https://myaccount.google.com/apppasswords
  2. Generate password for "Mail" → "AUREA Backend"
  3. Copy the 16-character password

  Step 2: Generate OTP Secret (30 sec)

  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

  Step 3: Update .env (1 min)

  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=abcd efgh ijkl mnop  # Your generated password
  EMAIL_FROM=noreply@aurea.com
  EMAIL_FROM_NAME=AUREA
  OTP_SECRET=your-generated-secret-here

  Step 4: Restart Server (30 sec)

  npm run dev

  Step 5: Test! (1 min)

  curl -X POST http://localhost:5000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "your-test-email@gmail.com",
      "password": "Test123456"
    }'

  # Check your email for OTP! 📧

  ---
  ⚠️ Important Notes

  1. Gmail App Password:
    - Must enable 2FA on Google account first
    - Regular Gmail password won't work
    - Use the 16-character app-specific password
  2. Email Sending Limits:
    - Gmail: ~500 emails/day
    - SendGrid Free: 100 emails/day
    - Mailgun Free: 5,000 emails/month
  3. Production Domain:
    - Update EMAIL_FROM to your actual domain
    - Update GOOGLE_CALLBACK_URL to your production URL
  4. Security:
    - Never commit .env to git (already in .gitignore)
    - Use different secrets for dev/staging/production
    - Rotate secrets periodically

  ---
  🎯 Minimum for Production

  If you only want basic authentication working:

  # Absolutely required (3 values)
  SMTP_USER=your-gmail@gmail.com
  SMTP_PASS=your-app-password
  OTP_SECRET=your-random-secret

  # Everything else uses defaults

  That's it! The rest have sensible defaults built into the code.

  Would you like me to help you set up the Gmail App Password now?


● For the App domain section in Google OAuth configuration, you should add your
  application's domain. Here's what to enter based on your environment:

  Development Environment

  For local development testing:

  Authorized Domains:
  localhost

  Application Homepage:
  http://localhost:5173

  Privacy Policy URL:
  http://localhost:5173/privacy

  Terms of Service URL:
  http://localhost:5173/terms

  ---
  Production Environment

  For production deployment (once you deploy):

  Authorized Domains:
  aurea.com
  yourdomain.com
  vercel.app

  Application Homepage:
  https://aurea.com

  Privacy Policy URL:
  https://aurea.com/privacy

  Terms of Service URL:
  https://aurea.com/terms

  ---
  Important Notes:

  1. Authorized Domains - Add the base domain only (no http://, no paths):
    - ✅ localhost
    - ✅ aurea.com
    - ✅ vercel.app
    - ❌ http://localhost:5173
    - ❌ https://aurea.com/dashboard
  2. Multiple Domains - You can add multiple authorized domains:
    - localhost (for development)
    - Your production domain
    - Your Vercel deployment domain
  3. Callback URLs - These are configured separately in "Authorized redirect URIs"
  section (different from App domain):
  http://localhost:5000/api/auth/google/callback
  https://your-backend-url.com/api/auth/google/callback
  4. Privacy Policy & Terms - These pages already exist in your frontend:
    - /privacy route
    - /terms route

  ---
  For Your Current Setup:

  Since you're testing locally, start with:

  Authorized Domains:
  localhost

  And add your production domains when you deploy.

  Would you like me to help you set up the complete Google OAuth configuration in
  the Google Cloud Console?
