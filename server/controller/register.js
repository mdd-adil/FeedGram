const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp
} = require('../config/twilioService');
const {
  validateEmail,
  validatePhone
} = require('../middleware/validators');

/**
 * Step 1: Send WhatsApp OTP before registration
 */
const sendRegisterOtp = async (req, res) => {
  const { email, phone, username } = req.body;

  try {
    // 1. Strict validation of Email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.message });
    }
    const trimmedEmail = emailValidation.email;

    // 2. Strict validation of Phone Number
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: phoneValidation.message });
    }
    const formattedPhone = phoneValidation.phone;

    // 3. Username validation
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required.' });
    }
    const trimmedUsername = username.trim();

    // Check if email already registered
    const existingEmail = await userModel.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Check if phone already registered
    const existingPhone = await userModel.findOne({ phone: formattedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }

    // Check if username already taken
    const existingUsername = await userModel.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    // Exclusively send OTP via WhatsApp
    await sendWhatsAppOtp(formattedPhone, trimmedUsername, 'registration');

    return res.status(200).json({
      success: true,
      channel: 'whatsapp',
      phone: formattedPhone,
      message: `WhatsApp verification code sent to ${formattedPhone}`
    });
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    res.status(500).json({
      message: error.message || 'Failed to send WhatsApp verification code. Please check your phone number.'
    });
  }
};

/**
 * Step 2: Validate the WhatsApp OTP
 */
const verifyRegisterOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    if (!otp) {
      return res.status(400).json({ message: 'WhatsApp verification code is required.' });
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: phoneValidation.message });
    }

    const verification = await verifyWhatsAppOtp(phoneValidation.phone, otp);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message || 'Invalid or expired WhatsApp code.' });
    }

    res.status(200).json({
      success: true,
      message: 'WhatsApp verification successful.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/**
 * Step 3: Register user after validating WhatsApp OTP
 */
const registerUser = async (req, res) => {
  const { username, email, phone, password, otp } = req.body;

  try {
    if (!username || !email || !password || !phone) {
      return res.status(400).json({ message: 'Username, email, phone, and password are required.' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'WhatsApp verification code is required to register.' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) return res.status(400).json({ message: emailValidation.message });

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) return res.status(400).json({ message: phoneValidation.message });

    const trimmedEmail = emailValidation.email;
    const formattedPhone = phoneValidation.phone;
    const trimmedUsername = username.trim();

    // Check existing records
    const existingUser = await userModel.findOne({
      $or: [{ email: trimmedEmail }, { phone: formattedPhone }, { username: trimmedUsername }]
    });

    if (existingUser) {
      if (existingUser.email === trimmedEmail) return res.status(409).json({ message: 'Email is already registered.' });
      if (existingUser.phone === formattedPhone) return res.status(409).json({ message: 'Phone number is already registered.' });
      if (existingUser.username === trimmedUsername) return res.status(409).json({ message: 'Username is already taken.' });
    }

    // Verify WhatsApp OTP
    const verification = await verifyWhatsAppOtp(formattedPhone, otp);

    if (!verification.valid) {
      return res.status(400).json({
        message: verification.message || 'Invalid or expired WhatsApp verification code.'
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

    // Clear consumed WhatsApp OTP
    await clearWhatsAppOtp(formattedPhone);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

module.exports = {
  sendRegisterOtp,
  verifyRegisterOtp,
  registerUser
};
