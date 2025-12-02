const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  demoLogin,
  logout
} = require('../controllers/authController');

// Public routes
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.post('/demo/:role', demoLogin);

// Protected routes
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);

// Admin only routes
router.get('/users', auth, authorize('admin'), (req, res) => {
  // Implement user listing
  res.json({ success: true, message: 'User list endpoint' });
});

module.exports = router;