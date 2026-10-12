const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  formatPhoneNumber,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp,
  sendEmailOtp,
  verifyEmailOtp,
  clearEmailOtp
} = require('../config/twilioService');

/**
 * Step 1: Send OTP to Phone (WhatsApp) or Email for password reset
 */
const sendResetOtp = async (req, res) => {
  const { identifier, email, phone, channel = 'whatsapp' } = req.body;
  const target = (phone || email || identifier || '').toString().trim();

  try {
    if (!target) {
      return res.status(400).json({ message: 'Phone number or email is required' });
    }

    const formattedPhone = formatPhoneNumber(target);

    // Find user by email or phone
    const user = await userModel.findOne({
      $or: [
        { email: target.toLowerCase() },
        { phone: target },
        { phone: formattedPhone }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number or email address.' });
    }

    // Determine target delivery channel
    const useWhatsApp = channel === 'whatsapp' || (!target.includes('@') && user.phone);

    if (useWhatsApp) {
      const recipientPhone = user.phone || formattedPhone;
      if (!recipientPhone) {
        return res.status(400).json({ message: 'No phone number associated with this account. Please use email reset.' });
      }

      await sendWhatsAppOtp(recipientPhone, user.username, 'reset');

      return res.status(200).json({
        success: true,
        channel: 'whatsapp',
        phone: recipientPhone,
        message: `WhatsApp verification code sent to ${recipientPhone}`
      });
    } else {
      await sendEmailOtp(user.email, user.username, 'reset');

      return res.status(200).json({
        success: true,
        channel: 'email',
        email: user.email,
        message: `Password reset code sent to ${user.email}`
      });
    }
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    res.status(500).json({
      message: error.message || 'Error sending reset code. Please try again.'
    });
  }
};

/**
 * Step 2: Validate the OTP for password reset
 */
const verifyResetOtp = async (req, res) => {
  const { identifier, email, phone, otp, channel } = req.body;
  const target = (phone || email || identifier || '').toString().trim();

  try {
    if (!target || !otp) {
      return res.status(400).json({ message: 'Phone/Email and verification code are required' });
    }

    const formattedPhone = formatPhoneNumber(target);
    const isPhone = channel === 'whatsapp' || !target.includes('@');

    let verification;
    if (isPhone) {
      verification = await verifyWhatsAppOtp(formattedPhone, otp);
    } else {
      verification = await verifyEmailOtp(target.toLowerCase(), otp);
    }

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired verification code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/**
 * Step 3: Reset password using verified WhatsApp or Email OTP
 */
const resetPasswordWithOtp = async (req, res) => {
  const { identifier, email, phone, otp, password, confirmPassword, channel } = req.body;
  const target = (phone || email || identifier || '').toString().trim();

  try {
    if (!target || !otp || !password) {
      return res.status(400).json({ message: 'Phone/Email, verification code, and new password are required' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const formattedPhone = formatPhoneNumber(target);
    const isPhone = channel === 'whatsapp' || !target.includes('@');

    // Find user
    const user = await userModel.findOne({
      $or: [
        { email: target.toLowerCase() },
        { phone: target },
        { phone: formattedPhone }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Verify OTP
    let verification;
    if (isPhone) {
      verification = await verifyWhatsAppOtp(user.phone || formattedPhone, otp);
    } else {
      verification = await verifyEmailOtp(user.email, otp);
    }

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired verification code'
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Clear consumed OTP
    if (isPhone) {
      await clearWhatsAppOtp(user.phone || formattedPhone);
    } else {
      await clearEmailOtp(user.email);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = {
  sendResetOtp,
  verifyResetOtp,
  resetPasswordWithOtp
};
