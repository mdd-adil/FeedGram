const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  formatPhoneNumber,
  verifyEmailOtp,
  clearEmailOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp
} = require('../config/twilioService');

const resetPassword = async (req, res) => {
  const { email, phone, identifier, otp, token, password, confirmPassword, channel } = req.body;
  const target = (phone || email || identifier || '').toString().trim();

  try {
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 1. If OTP is provided
    if (target && otp) {
      const formattedPhone = formatPhoneNumber(target);
      const isPhone = channel === 'whatsapp' || !target.includes('@');

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

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      if (isPhone) {
        await clearWhatsAppOtp(user.phone || formattedPhone);
      } else {
        await clearEmailOtp(user.email);
      }

      return res.status(200).json({
        message: 'Password has been reset successfully. You can now log in.',
        success: true
      });
    }

    // 2. Fallback: If legacy token is provided
    if (token) {
      const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(200).json({
        message: 'Password has been reset successfully. You can now log in.',
        success: true
      });
    }

    return res.status(400).json({ message: 'Verification code or token is required' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password. Please try again.' });
  }
};

module.exports = resetPassword;
