const express = require('express');
const router = express.Router();
const {
  sendRegisterOtp,
  verifyRegisterOtp,
  registerUser
} = require('../controller/register');

// Route to send email OTP via Twilio
router.post('/send-otp', sendRegisterOtp);

// Route to check email OTP validity
router.post('/verify-otp', verifyRegisterOtp);

// Route to complete registration with verified OTP
router.post('/', registerUser);

module.exports = router;