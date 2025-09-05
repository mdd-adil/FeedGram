# Forgot Password Setup Instructions

## Email Configuration

To enable the forgot password functionality, you need to configure email settings in your `.env` file:

1. **Gmail Setup (Recommended):**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Generate an App Password:
     - Go to Security → 2-Step Verification → App passwords
     - Generate a password for "Mail"
   - Update your `.env` file:
     ```
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASS=your_16_character_app_password
     ```

2. **Other Email Providers:**
   - Update the transporter configuration in `server/controller/forgotPassword.js`
   - Replace the service with your email provider (e.g., 'outlook', 'yahoo')
   - Or configure SMTP settings manually

## Testing the Feature

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   cd client && npm start
   ```

2. **Test Flow:**
   - Go to login page
   - Click "Forgot Password?"
   - Enter your email address
   - Check your email for reset link
   - Click the link to reset password
   - Enter new password and confirm
   - Login with new password

## Features Added

### Backend:
- `forgotPassword.js` - Generates reset token and sends email
- `resetPassword.js` - Validates token and updates password
- Updated user model with reset token fields
- New routes for forgot/reset password endpoints

### Frontend:
- `ForgotPassword.jsx` - Email input form
- `ResetPassword.jsx` - New password form with token validation
- Updated Login component with forgot password link
- New routes in App.js

## Security Features

- Reset tokens expire after 1 hour
- Secure token generation using crypto
- Password hashing with bcrypt
- Token validation before password reset
- Clear token after successful reset

## Email Template

The reset email includes:
- Professional styling
- Clear call-to-action button
- Security information
- Fallback link for accessibility
- Expiration warning
