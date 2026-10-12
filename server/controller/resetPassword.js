const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  formatPhoneNumber,
  verifyWhatsAppOtp,
  clearWhatsAppOtp
} = require('../config/twilioService');

const resetPassword = async (req, res) => {
  const { phone, identifier, otp, token, password, confirmPassword } = req.body;
  const target = (phone || identifier || '').toString().trim();

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

    // 1. If WhatsApp OTP is provided
    if (target && otp) {
      const formattedPhone = formatPhoneNumber(target);

      const user = await userModel.findOne({
        $or: [
          { phone: target },
          { phone: formattedPhone },
          { email: target.toLowerCase() },
          { username: target }
        ]
      });

      if (!user) {
        return res.status(404).json({ message: 'User account not found' });
      }

      const targetPhone = user.phone || formattedPhone;
      const verification = await verifyWhatsAppOtp(targetPhone, otp);

      if (!verification.valid) {
        return res.status(400).json({
          message: verification.message || 'Invalid or expired WhatsApp verification code'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      await clearWhatsAppOtp(targetPhone);

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

    return res.status(400).json({ message: 'WhatsApp verification code or token is required' });
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

module.exports = resetPassword;
