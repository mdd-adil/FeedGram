const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  otp: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'sms'],
    default: 'email'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-deleted after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('Otp', otpSchema);
