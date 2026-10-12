const crypto = require('crypto');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const Otp = require('../models/otpModel');

// Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // default Twilio sandbox

// SendGrid Credentials
const sendGridApiKey = process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
const fromEmail = process.env.TWILIO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@feedgram.com';

let twilioClient = null;
if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.error('Twilio Client Init Error:', err.message);
  }
}

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Format phone number to clean E.164 string (e.g. +919876543210 or +14155552671)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.toString().trim().replace(/[\s\-()]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

// HTML Email template for Email OTP
const getOtpEmailTemplate = (otp, username, purpose = 'registration') => {
  const isReset = purpose === 'reset';
  const heading = isReset ? 'Reset your password' : 'Verify your email address';
  const description = isReset
    ? `Use the 6-digit verification code below to reset your FeedGram account password:`
    : `Use the 6-digit verification code below to complete creating your FeedGram account:`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FeedGram Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px 28px; }
        .logo { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: #0f172a; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background-color: #f1f5f9; border-radius: 10px; padding: 18px; text-align: center; letter-spacing: 6px; font-size: 32px; font-weight: 700; color: #0f172a; margin: 24px 0; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">● FeedGram</div>
        <div class="title">${heading}</div>
        <p class="text">Hello ${username || 'there'},<br>${description}</p>
        <div class="otp-box">${otp}</div>
        <p class="text">This code will expire in <strong>10 minutes</strong>. If you did not request this, please safely ignore this email.</p>
        <div class="footer">FeedGram · Secure Account Verification</div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP via WhatsApp using Twilio Verify or Twilio WhatsApp Messages
 */
const sendWhatsAppOtp = async (phone, username = '', purpose = 'registration') => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone || formattedPhone.length < 8) {
    throw new Error('Valid phone number with country code is required (e.g. +14155552671)');
  }

  // 1. Try Twilio Verify API if configured
  if (twilioClient && verifyServiceSid) {
    try {
      const verification = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verifications.create({ to: formattedPhone, channel: 'whatsapp' });

      return {
        success: true,
        method: 'twilio_verify_whatsapp',
        status: verification.status
      };
    } catch (err) {
      console.warn('Twilio Verify WhatsApp failed, trying Twilio Programmable WhatsApp message:', err.message);
    }
  }

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

  // 2. Try Twilio Programmable WhatsApp messaging
  if (twilioClient) {
    try {
      const from = twilioWhatsAppNumber.startsWith('whatsapp:')
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`;

      await twilioClient.messages.create({
        from,
        to: `whatsapp:${formattedPhone}`,
        body: messageBody
      });

      return { success: true, method: 'twilio_whatsapp_message' };
    } catch (msgErr) {
      console.error('Twilio WhatsApp Message Error:', msgErr.message);
      // In dev/sandbox without sender, log OTP clearly
      console.log(`[TESTING/FALLBACK] WhatsApp OTP for ${formattedPhone}: ${otp}`);
      return { success: true, method: 'local_fallback', note: 'Check console for code in sandbox mode' };
    }
  }

  // Fallback for local testing if Twilio keys aren't set
  console.log(`[TESTING/FALLBACK] WhatsApp OTP for ${formattedPhone}: ${otp}`);
  return { success: true, method: 'local_fallback', note: 'Check console for code' };
};

/**
 * Verify OTP sent via WhatsApp
 */
const verifyWhatsAppOtp = async (phone, otp) => {
  const formattedPhone = formatPhoneNumber(phone);
  const enteredOtp = otp.toString().trim();

  // 1. Try Twilio Verify API if configured
  if (twilioClient && verifyServiceSid) {
    try {
      const check = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: formattedPhone, code: enteredOtp });

      if (check.status === 'approved') {
        return { valid: true };
      }
      return { valid: false, message: 'Invalid or expired WhatsApp verification code' };
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found')) {
        return { valid: false, message: 'Verification code expired or not found. Please request a new code.' };
      }
      console.warn('Twilio Verify Check error, falling back to database check:', err.message);
    }
  }

  // 2. Check Database record
  const otpRecord = await Otp.findOne({
    $or: [{ identifier: formattedPhone }, { phone: formattedPhone }]
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return { valid: false, message: 'Verification code expired or not found. Please request a new code.' };
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

/**
 * Send Email OTP using Twilio Verify, Twilio SendGrid, or Nodemailer
 */
const sendEmailOtp = async (email, username = '', purpose = 'registration') => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Twilio Verify API if configured
  if (twilioClient && verifyServiceSid) {
    try {
      const verification = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verifications.create({ to: normalizedEmail, channel: 'email' });

      return {
        success: true,
        method: 'twilio_verify',
        status: verification.status
      };
    } catch (twilioErr) {
      console.warn('Twilio Verify Service failed, falling back to direct email:', twilioErr.message);
    }
  }

  // Generate 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store in database
  await Otp.deleteMany({
    $or: [{ identifier: normalizedEmail }, { email: normalizedEmail }]
  });

  await Otp.create({
    identifier: normalizedEmail,
    email: normalizedEmail,
    channel: 'email',
    otp
  });

  const isReset = purpose === 'reset';
  const subject = isReset
    ? `${otp} is your FeedGram password reset code`
    : `${otp} is your FeedGram verification code`;
  const html = getOtpEmailTemplate(otp, username, purpose);

  // 2. Try Twilio SendGrid
  if (sendGridApiKey) {
    try {
      await sgMail.send({
        to: normalizedEmail,
        from: fromEmail,
        subject,
        html
      });
      return { success: true, method: 'twilio_sendgrid' };
    } catch (sgErr) {
      console.error('Twilio SendGrid Send Error:', sgErr.response?.body || sgErr.message);
    }
  }

  // 3. Fallback to Nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"FeedGram" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject,
      html
    });

    return { success: true, method: 'nodemailer_smtp' };
  }

  throw new Error('No email service configured. Please provide TWILIO_VERIFY_SERVICE_SID, TWILIO_SENDGRID_API_KEY, or EMAIL_USER/EMAIL_PASS.');
};

/**
 * Verify OTP entered by user (Email)
 */
const verifyEmailOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const enteredOtp = otp.toString().trim();

  // 1. Try Twilio Verify API
  if (twilioClient && verifyServiceSid) {
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: normalizedEmail, code: enteredOtp });

      if (verificationCheck.status === 'approved') {
        return { valid: true };
      }
      return { valid: false, message: 'Invalid or expired verification code' };
    } catch (twilioErr) {
      if (twilioErr.status === 404 || twilioErr.message?.includes('not found')) {
        return { valid: false, message: 'Verification code expired or not found. Please request a new code.' };
      }
      console.warn('Twilio Verify Check error, checking database:', twilioErr.message);
    }
  }

  // 2. Check database record
  const otpRecord = await Otp.findOne({
    $or: [{ identifier: normalizedEmail }, { email: normalizedEmail }]
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return { valid: false, message: 'Verification code expired or not found. Please request a new code.' };
  }

  if (otpRecord.otp !== enteredOtp) {
    return { valid: false, message: 'Incorrect verification code. Please check and try again.' };
  }

  return { valid: true };
};

const clearEmailOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  await Otp.deleteMany({
    $or: [{ identifier: normalizedEmail }, { email: normalizedEmail }]
  });
};

module.exports = {
  formatPhoneNumber,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  clearWhatsAppOtp,
  sendEmailOtp,
  verifyEmailOtp,
  clearEmailOtp
};
