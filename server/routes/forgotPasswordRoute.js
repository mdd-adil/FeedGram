const express = require('express');
const router = express.Router();
const {
  sendResetOtp,
  verifyResetOtp,
  resetPasswordWithOtp
} = require('../controller/forgotPassword');

// Send OTP to email for password reset
router.post('/', sendResetOtp);
router.post('/send-otp', sendResetOtp);

// Validate OTP
router.post('/verify-otp', verifyResetOtp);

// Complete password reset with verified OTP
router.post('/reset', resetPasswordWithOtp);

module.exports = router;
