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
 * Step 1: Send OTP to phone (WhatsApp) or email before registration
 */
const sendRegisterOtp = async (req, res) => {
  const { email, phone, username, channel = 'whatsapp' } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const formattedPhone = formatPhoneNumber(phone);

    // Check if email already registered
    const existingEmail = await userModel.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Check if phone already registered
    const existingPhone = await userModel.findOne({ phone: formattedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'An account with this phone number already exists' });
    }

    // Check if username already taken
    if (username) {
      const existingUsername = await userModel.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(409).json({ message: 'Username is already taken' });
      }
    }

    // Send OTP via chosen channel (WhatsApp by default, or Email)
    if (channel === 'whatsapp') {
      await sendWhatsAppOtp(formattedPhone, username, 'registration');
      return res.status(200).json({
        success: true,
        channel: 'whatsapp',
        message: `WhatsApp verification code sent to ${formattedPhone}`
      });
    } else {
      await sendEmailOtp(trimmedEmail, username, 'registration');
      return res.status(200).json({
        success: true,
        channel: 'email',
        message: `Verification code sent to ${trimmedEmail}`
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: error.message || 'Failed to send verification code. Please check your phone/email.'
    });
  }
};

/**
 * Step 2: Validate the OTP
 */
const verifyRegisterOtp = async (req, res) => {
  const { email, phone, otp, channel = 'whatsapp' } = req.body;

  try {
    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    let verification;
    if (channel === 'whatsapp') {
      if (!phone) return res.status(400).json({ message: 'Phone number is required' });
      verification = await verifyWhatsAppOtp(phone, otp);
    } else {
      if (!email) return res.status(400).json({ message: 'Email address is required' });
      verification = await verifyEmailOtp(email, otp);
    }

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message || 'Invalid or expired code' });
    }

    res.status(200).json({
      success: true,
      message: 'Verification successful'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/**
 * Step 3: Register user after validating OTP
 */
const registerUser = async (req, res) => {
  const { username, email, phone, password, otp, channel = 'whatsapp' } = req.body;

  try {
    if (!username || !email || !password || !phone) {
      return res.status(400).json({ message: 'Username, email, phone, and password are required' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required to register' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();
    const formattedPhone = formatPhoneNumber(phone);

    // Check existing records
    const existingUser = await userModel.findOne({
      $or: [{ email: trimmedEmail }, { phone: formattedPhone }, { username: trimmedUsername }]
    });

    if (existingUser) {
      if (existingUser.email === trimmedEmail) return res.status(409).json({ message: 'Email is already registered' });
      if (existingUser.phone === formattedPhone) return res.status(409).json({ message: 'Phone number is already registered' });
      if (existingUser.username === trimmedUsername) return res.status(409).json({ message: 'Username is already taken' });
    }

    // Verify OTP
    let verification;
    if (channel === 'whatsapp') {
      verification = await verifyWhatsAppOtp(formattedPhone, otp);
    } else {
      verification = await verifyEmailOtp(trimmedEmail, otp);
    }

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired verification code'
      });
    }

    // Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.create({
      username: trimmedUsername,
      email: trimmedEmail,
      phone: formattedPhone,
      password: hashedPassword
    });

    // Clear consumed OTP
    if (channel === 'whatsapp') {
      await clearWhatsAppOtp(formattedPhone);
    } else {
      await clearEmailOtp(trimmedEmail);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

module.exports = {
  sendRegisterOtp,
  verifyRegisterOtp,
  registerUser
};
