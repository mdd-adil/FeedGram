const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp
} = require('../config/twilioService');
const {
  validateEmail,
  validatePhone,
  formatPhoneNumber
} = require('../middleware/validators');

/**
 * Step 1: Send WhatsApp OTP for password reset
 */
const sendResetOtp = async (req, res) => {
  const { identifier, phone, email } = req.body;
  const rawTarget = (phone || email || identifier || '').toString().trim();

  try {
    if (!rawTarget) {
      return res.status(400).json({ message: 'Phone number, email, or username is required.' });
    }

    const formattedPhone = formatPhoneNumber(rawTarget);

    // Find user by phone, formatted phone, email, or username
    const user = await userModel.findOne({
      $or: [
        { phone: rawTarget },
        { phone: formattedPhone },
        { email: rawTarget.toLowerCase() },
        { username: rawTarget }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: 'No account found matching this phone number, email, or username.'
      });
    }

    const recipientPhone = user.phone || (formattedPhone.startsWith('+') ? formattedPhone : null);

    if (!recipientPhone) {
      return res.status(400).json({
        message: 'No mobile number is linked to this account for WhatsApp verification. Please contact support.'
      });
    }

    // Exclusively send OTP via WhatsApp
    await sendWhatsAppOtp(recipientPhone, user.username, 'reset');

    return res.status(200).json({
      success: true,
      channel: 'whatsapp',
      phone: recipientPhone,
      message: `WhatsApp verification code sent to ${recipientPhone}`
    });
  } catch (error) {
    console.error('Forgot password WhatsApp OTP error:', error);
    res.status(500).json({
      message: error.message || 'Error sending WhatsApp verification code. Please check your phone number.'
    });
  }
};

/**
 * Step 2: Validate the WhatsApp OTP for password reset
 */
const verifyResetOtp = async (req, res) => {
  const { identifier, phone, otp } = req.body;
  const rawTarget = (phone || identifier || '').toString().trim();

  try {
    if (!rawTarget || !otp) {
      return res.status(400).json({ message: 'Phone number/Account identifier and verification code are required.' });
    }

    const formattedPhone = formatPhoneNumber(rawTarget);
    const user = await userModel.findOne({
      $or: [
        { phone: rawTarget },
        { phone: formattedPhone },
        { email: rawTarget.toLowerCase() },
        { username: rawTarget }
      ]
    });

    const targetPhone = user?.phone || formattedPhone;
    const verification = await verifyWhatsAppOtp(targetPhone, otp);

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired WhatsApp verification code.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'WhatsApp code verified successfully.'
    });
  } catch (error) {
    console.error('Verify reset WhatsApp OTP error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/**
 * Step 3: Reset password using verified WhatsApp OTP
 */
const resetPasswordWithOtp = async (req, res) => {
  const { identifier, phone, otp, password, confirmPassword } = req.body;
  const rawTarget = (phone || identifier || '').toString().trim();

  try {
    if (!rawTarget || !otp || !password) {
      return res.status(400).json({ message: 'Account identifier, verification code, and new password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const formattedPhone = formatPhoneNumber(rawTarget);

    // Find user
    const user = await userModel.findOne({
      $or: [
        { phone: rawTarget },
        { phone: formattedPhone },
        { email: rawTarget.toLowerCase() },
        { username: rawTarget }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const targetPhone = user.phone || formattedPhone;

    // Verify WhatsApp OTP
    const verification = await verifyWhatsAppOtp(targetPhone, otp);

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired WhatsApp verification code.'
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Clear consumed WhatsApp OTP
    await clearWhatsAppOtp(targetPhone);

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
