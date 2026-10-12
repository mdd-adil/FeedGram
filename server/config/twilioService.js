const crypto = require('crypto');
const twilio = require('twilio');
const Otp = require('../models/otpModel');
const { validatePhone, formatPhoneNumber } = require('../middleware/validators');

// Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // default Twilio sandbox

// Twilio Client
let twilioClient = null;
if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.error('Twilio Client Init Error:', err.message);
  }
}

/**
 * Send OTP via WhatsApp using Twilio Programmable WhatsApp Messages
 */
const sendWhatsAppOtp = async (phone, username = '', purpose = 'registration') => {
  // Strict phone validation
  const validation = validatePhone(phone);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
  const formattedPhone = validation.phone;

  // Generate 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Save to database
  await Otp.deleteMany({
    $or: [{ identifier: formattedPhone }, { phone: formattedPhone }]
  });

  await Otp.create({
    identifier: formattedPhone,
    phone: formattedPhone,
    channel: 'whatsapp',
    otp
  });

  const isReset = purpose === 'reset';
  const messageBody = isReset
    ? `*FeedGram Password Reset*\nYour verification code is: *${otp}*\n\nValid for 10 minutes. Do not share this code.`
    : `*FeedGram Account Verification*\nYour verification code is: *${otp}*\n\nValid for 10 minutes. Welcome to FeedGram!`;

  // Always log OTP in server console for development & emergency lookup
  console.log(`[FeedGram OTP] 💬 WhatsApp OTP for ${formattedPhone}: ${otp}`);

  // Send via Twilio Programmable WhatsApp messaging
  if (twilioClient) {
    try {
      const from = twilioWhatsAppNumber.startsWith('whatsapp:')
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`;

      const message = await twilioClient.messages.create({
        from:from,
        to: `whatsapp:${formattedPhone}`,
        body: messageBody
      });

      console.log(`Twilio WhatsApp message queued/sent: SID ${message.sid}, status: ${message.status}`);

      return {
        success: true,
        method: 'twilio_whatsapp_message',
        sid: message.sid,
        status: message.status
      };
    } catch (msgErr) {
      console.error('Twilio WhatsApp Message Send Error:', msgErr.code, msgErr.message);

      // Handle Twilio Sandbox opt-in and WhatsApp delivery errors
      if (msgErr.code === 63015 || msgErr.code === 63016 || msgErr.code === 21614 || msgErr.code === 21608) {
        throw new Error(
          `WhatsApp Sandbox: ${formattedPhone} has not joined the sandbox. Please send "join noon-roof" to +1 415 523 8886 on WhatsApp first, or check your phone number.`
        );
      }

      throw new Error(`Failed to deliver WhatsApp message via Twilio: ${msgErr.message}`);
    }
  }

  // Fallback for local testing if Twilio keys aren't configured
  return {
    success: true,
    method: 'local_fallback',
    note: `Dev mode: OTP is ${otp}`
  };
};

/**
 * Verify OTP sent via WhatsApp
 */
const verifyWhatsAppOtp = async (phone, otp) => {
  const formattedPhone = formatPhoneNumber(phone);
  const enteredOtp = otp.toString().trim();

  // Check Database record
  const otpRecord = await Otp.findOne({
    $or: [{ identifier: formattedPhone }, { phone: formattedPhone }]
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return { valid: false, message: 'WhatsApp verification code expired or not found. Please request a new code.' };
  }

  if (otpRecord.otp !== enteredOtp) {
    return { valid: false, message: 'Incorrect verification code. Please check and try again.' };
  }

  return { valid: true };
};

const clearWhatsAppOtp = async (phone) => {
  const formattedPhone = formatPhoneNumber(phone);
  await Otp.deleteMany({
    $or: [{ identifier: formattedPhone }, { phone: formattedPhone }]
  });
};

module.exports = {
  formatPhoneNumber,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp
};
