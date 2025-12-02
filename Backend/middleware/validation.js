const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Validation result handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'analyst', 'admin']).withMessage('Invalid role specified'),
  
  validate
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

/**
 * Password change validation
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validate
];

/**
 * Profile update validation
 */
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL'),
  
  body('securityPreferences.twoFactorEnabled')
    .optional()
    .isBoolean().withMessage('Two-factor enabled must be a boolean'),
  
  body('securityPreferences.emailNotifications')
    .optional()
    .isBoolean().withMessage('Email notifications must be a boolean'),
  
  validate
];

/**
 * Threat creation/update validation
 */
const validateThreat = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  
  body('severity')
    .notEmpty().withMessage('Severity is required')
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn([
      'phishing',
      'malware',
      'ransomware',
      'ddos',
      'brute-force',
      'vulnerability',
      'data-breach',
      'insider-threat',
      'zero-day',
      'social-engineering'
    ]).withMessage('Invalid threat type'),
  
  body('sourceIp')
    .optional()
    .matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/).withMessage('Invalid IP address format'),
  
  body('sourceCountry')
    .optional()
    .isLength({ max: 100 }).withMessage('Country name too long'),
  
  body('target')
    .optional()
    .isLength({ max: 200 }).withMessage('Target description too long'),
  
  body('status')
    .optional()
    .isIn(['detected', 'investigating', 'contained', 'mitigated', 'resolved', 'false-positive'])
    .withMessage('Invalid status'),
  
  body('impactScore')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Impact score must be between 0 and 10'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString().withMessage('Each tag must be a string')
    .isLength({ max: 50 }).withMessage('Tag too long'),
  
  body('mitigationSteps')
    .optional()
    .isArray().withMessage('Mitigation steps must be an array'),
  
  body('mitigationSteps.*.step')
    .notEmpty().withMessage('Step description is required')
    .isLength({ max: 500 }).withMessage('Step description too long'),
  
  body('mitigationSteps.*.completed')
    .optional()
    .isBoolean().withMessage('Completed must be a boolean'),
  
  body('evidence')
    .optional()
    .isArray().withMessage('Evidence must be an array'),
  
  body('evidence.*.type')
    .notEmpty().withMessage('Evidence type is required'),
  
  body('evidence.*.url')
    .optional()
    .isURL().withMessage('Evidence URL must be valid'),
  
  body('evidence.*.description')
    .optional()
    .isLength({ max: 500 }).withMessage('Evidence description too long'),
  
  validate
];

/**
 * Tool request validation
 */
const validateToolRequest = [
  body('password')
    .if(body('tool').equals('password-analyzer'))
    .notEmpty().withMessage('Password is required for analysis'),
  
  body('text')
    .if(body('tool').equals('hash-generator'))
    .notEmpty().withMessage('Text is required for hash generation'),
  
  body('url')
    .if(body('tool').equals('url-checker'))
    .notEmpty().withMessage('URL is required')
    .isURL().withMessage('Invalid URL format'),
  
  body('domain')
    .if(body('tool').equals('ssl-checker'))
    .notEmpty().withMessage('Domain is required'),
  
  body('algorithm')
    .optional()
    .isIn(['MD5', 'SHA1', 'SHA256', 'SHA512']).withMessage('Invalid algorithm'),
  
  body('length')
    .optional()
    .isInt({ min: 8, max: 32 }).withMessage('Length must be between 8 and 32'),
  
  body('includeNumbers')
    .optional()
    .isBoolean().withMessage('Include numbers must be a boolean'),
  
  body('includeSymbols')
    .optional()
    .isBoolean().withMessage('Include symbols must be a boolean'),
  
  validate
];

/**
 * Contact form validation
 */
const validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  
  body('company')
    .