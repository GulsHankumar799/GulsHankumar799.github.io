const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

/**
 * Generate JWT token
 */
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate random string for tokens
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure password
 */
const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Ensure at least one of each type
  password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
  password += '0123456789'.charAt(Math.floor(Math.random() * 10));
  password += '!@#$%^&*()_+-=[]{}|;:,.<>?'.charAt(Math.floor(Math.random() * 25));
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Calculate password strength score
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Check for common patterns
  const commonPasswords = [
    'password', '123456', 'qwerty', 'letmein', 'welcome',
    'admin', 'password123', '12345678', '123456789', '123123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('This is a very common password - choose something more unique');
  }

  // Check for sequential characters
  if (/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequential letters');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  // Determine strength level
  let strength;
  if (score <= 2) {
    strength = 'Weak';
  } else if (score <= 4) {
    strength = 'Moderate';
  } else if (score <= 6) {
    strength = 'Strong';
  } else {
    strength = 'Very Strong';
  }

  return {
    score: Math.max(0, score),
    strength,
    feedback: feedback.length > 0 ? feedback : ['Excellent password!']
  };
};

/**
 * Generate cryptographic hash
 */
const generateHash = (text, algorithm = 'SHA256') => {
  const algorithms = {
    'MD5': CryptoJS.MD5,
    'SHA1': CryptoJS.SHA1,
    'SHA256': CryptoJS.SHA256,
    'SHA512': CryptoJS.SHA512
  };

  const hashFunction = algorithms[algorithm.toUpperCase()];
  
  if (!hashFunction) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  return hashFunction(text).toString();
};

/**
 * Validate URL safety (simulated - integrate with VirusTotal API for real)
 */
const validateUrlSafety = async (url) => {
  // For demo purposes - simulate API call
  // In production, integrate with VirusTotal, Google Safe Browsing, etc.
  
  const maliciousPatterns = [
    'malicious.com',
    'phishing-site.com',
    'bad-website.org',
    'dangerous.net',
    '.xyz' // Example: new TLDs often used for malicious sites
  ];

  const isMalicious = maliciousPatterns.some(pattern => 
    url.includes(pattern) || 
    url.endsWith(pattern.replace('*', ''))
  );

  const hasHttps = url.startsWith('https://');
  const isShortened = /(bit\.ly|goo\.gl|tinyurl|t\.co)/.test(url);

  return {
    isSafe: !isMalicious,
    hasHttps,
    isShortened,
    warnings: []
      .concat(!hasHttps ? ['Website does not use HTTPS'] : [])
      .concat(isShortened ? ['URL is shortened - proceed with caution'] : [])
      .concat(isMalicious ? ['Potential malicious website detected'] : [])
  };
};

/**
 * Check SSL certificate information (simulated)
 */
const checkSSLCertificate = async (domain) => {
  // For demo purposes - simulate SSL check
  // In production, use a library like 'ssl-checker'
  
  const hasSSL = Math.random() > 0.2; // 80% chance of having SSL
  const daysRemaining = hasSSL ? Math.floor(Math.random() * 365) : 0;
  const issuer = hasSSL ? 'Let\'s Encrypt' : null;
  const valid = hasSSL && daysRemaining > 0;

  return {
    hasSSL,
    valid,
    daysRemaining,
    issuer,
    grade: hasSSL ? (daysRemaining > 30 ? 'A' : 'B') : 'F'
  };
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  generateRandomString,
  generateSecurePassword,
  calculatePasswordStrength,
  generateHash,
  validateUrlSafety,
  checkSSLCertificate
};