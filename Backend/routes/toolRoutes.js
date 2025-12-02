const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const {
  passwordAnalyzer,
  hashGenerator,
  urlChecker,
  sslChecker,
  generatePassword,
  getToolStatistics
} = require('../controllers/toolController');

// All tools routes require authentication
router.use(optionalAuth);

// Password analyzer
router.post(
  '/password-analyzer',
  [
    body('password').notEmpty().withMessage('Password is required')
  ],
  passwordAnalyzer
);

// Hash generator
router.post(
  '/hash-generator',
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('algorithm').optional().isIn(['MD5', 'SHA1', 'SHA256', 'SHA512'])
  ],
  hashGenerator
);

// URL checker
router.post(
  '/url-checker',
  [
    body('url').notEmpty().withMessage('URL is required').isURL()
  ],
  urlChecker
);

// SSL checker
router.post(
  '/ssl-checker',
  [
    body('domain').notEmpty().withMessage('Domain is required')
  ],
  sslChecker
);

// Generate password
router.post(
  '/generate-password',
  [
    body('length').optional().isInt({ min: 8, max: 32 }),
    body('includeNumbers').optional().isBoolean(),
    body('includeSymbols').optional().isBoolean()
  ],
  generatePassword
);

// Statistics (Admin/Analyst only)
router.get('/statistics', auth, authorize('admin', 'analyst'), getToolStatistics);

module.exports = router;