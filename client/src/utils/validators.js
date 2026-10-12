/**
 * Client-side validation helpers for email, phone numbers, and credentials
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const formatClientPhone = (phone) => {
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

export const validateClientEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim();

  // Check if user accidentally entered a phone number
  const strippedPhone = trimmed.replace(/[\s\-()]/g, '');
  if (!trimmed.includes('@') && /^\+?\d{8,15}$/.test(strippedPhone)) {
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

export const validateClientPhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required.' };
  }

  const trimmed = phone.trim();

  // Check if user accidentally entered an email
  if (trimmed.includes('@')) {
    return {
      isValid: false,
      message: 'Invalid phone number: An email address was entered instead of a phone number. Please enter a valid mobile number (e.g. +91 9876543210).'
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
      message: 'Phone number is too short. Please include country code and full mobile number (e.g. +91 9876543210).'
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      message: 'Phone number cannot exceed 15 digits according to international standards.'
    };
  }

  return { isValid: true, phone: formatClientPhone(trimmed) };
};
