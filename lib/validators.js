/**
 * Validate an email address format
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate a Ghanaian phone number format (+233XXXXXXXXX)
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Format must be +233 followed by exactly 9 digits
  const regex = /^\+233\d{9}$/;
  return regex.test(phone);
}

/**
 * Validate a password to ensure it meets complexity requirements
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password must be a valid text string.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!hasLowercase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!hasSymbol) {
    return { valid: false, message: 'Password must contain at least one special character, such as !@#$%^&*().' };
  }
  return { valid: true, message: 'Password is secure and valid.' };
}

export function generateStrongPassword(length = 14) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const allChars = upper + lower + digits + symbols;

  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

/**
 * Sanitize a string by trimming it and escaping HTML entities to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate that a rating is an integer between 1 and 5 inclusive
 * @param {any} rating
 * @returns {boolean}
 */
export function validateRating(rating) {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
}

/**
 * Validate that a file's mime type is within the allowed list
 * @param {string} mimetype
 * @param {string[]} allowed
 * @returns {boolean}
 */
export function validateFileType(mimetype, allowed) {
  if (!mimetype || !Array.isArray(allowed)) return false;
  return allowed.includes(mimetype);
}

/**
 * Validate that a file's size does not exceed the maximum allowed megabytes
 * @param {number} size - File size in bytes
 * @param {number} maxMB - Maximum size in megabytes
 * @returns {boolean}
 */
export function validateFileSize(size, maxMB) {
  const sizeNum = Number(size);
  if (isNaN(sizeNum)) return false;
  const maxBytes = maxMB * 1024 * 1024;
  return sizeNum <= maxBytes;
}
