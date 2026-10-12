/**
 * Validation utilities for Email, Phone, and User Identifiers
 */

/**
 * Standard RFC 5322 compliant regex for email validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Check if the input looks like an email
 */
const isEmailLike = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.includes('@');
};

/**
 * Check if the input looks like a phone number
 */
const isPhoneLike = (str) => {
  if (!str || typeof str !== 'string') return false;
  const cleaned = str.trim().replace(/[\s\-()]/g, '');
  return /^\+?\d{8,15}$/.test(cleaned);
};

/**
 * Format and normalize a phone number into strict E.164 format (+<country><number>)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.toString().trim().replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }

  cleaned = cleaned.replace(/\D/g, '');

  // 10 digits starting with 6, 7, 8, or 9 (Indian mobile numbers)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return '+91' + cleaned;
  }

  // 12 digits starting with 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }

  // 11 digits starting with 1 (US/Canada)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }

  return '+' + cleaned;
};

/**
 * Validate an email address
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim();

  // Check if user accidentally entered a phone number
  if (isPhoneLike(trimmed) && !trimmed.includes('@')) {
    return {
      isValid: false,
      message: 'Invalid email: A phone number was entered instead of an email address. Please enter a valid email (e.g. name@example.com).'
    };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g. name@example.com).'
    };
  }

  return { isValid: true, email: trimmed.toLowerCase() };
};

/**
 * Validate a phone number
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required.' };
  }

  const trimmed = phone.trim();

  // Check if user accidentally entered an email
  if (trimmed.includes('@')) {
    return {
      isValid: false,
      message: 'Invalid phone number: An email address was entered instead of a phone number. Please enter a valid mobile number with country code (e.g. +91 9876543210).'
    };
  }

  const cleaned = trimmed.replace(/[\s\-()]/g, '');
  const digitsOnly = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  if (!/^\d+$/.test(digitsOnly)) {
    return {
      isValid: false,
      message: 'Phone number must only contain digits and an optional "+" country code prefix.'
    };
  }

  if (digitsOnly.length < 8) {
    return {
      isValid: false,
      message: 'Phone number is too short. Please include your country code and mobile number (e.g. +91 9876543210).'
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      message: 'Phone number cannot exceed 15 digits according to international E.164 standards.'
    };
  }

  return { isValid: true, phone: formatPhoneNumber(trimmed) };
};

/**
 * Classify whether an identifier is email, phone, or username
 */
const classifyIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return { type: 'invalid', value: '' };
  }

  const trimmed = identifier.trim();

  if (trimmed.includes('@')) {
    const emailResult = validateEmail(trimmed);
    return {
      type: 'email',
      isValid: emailResult.isValid,
      message: emailResult.message,
      value: trimmed.toLowerCase()
    };
  }

  const cleaned = trimmed.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+') || /^\d{8,15}$/.test(cleaned)) {
    const phoneResult = validatePhone(trimmed);
    return {
      type: 'phone',
      isValid: phoneResult.isValid,
      message: phoneResult.message,
      value: phoneResult.phone || cleaned
    };
  }

  return {
    type: 'username',
    isValid: trimmed.length >= 3,
    message: trimmed.length < 3 ? 'Username must be at least 3 characters.' : '',
    value: trimmed
  };
};

module.exports = {
  EMAIL_REGEX,
  isEmailLike,
  isPhoneLike,
  formatPhoneNumber,
  validateEmail,
  validatePhone,
  classifyIdentifier
};
