const User = require('../models/User');
const { generateToken, comparePassword } = require('../utils/security');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Generate token
  const token = generateToken(user._id, user.role);

  // Update login history
  user.lastLogin = new Date();
  user.loginHistory.push({
    ip: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown'
  });
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  // Update login history
  user.lastLogin = new Date();
  user.loginHistory.push({
    ip: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown'
  });
  
  // Keep only last 10 login records
  if (user.loginHistory.length > 10) {
    user.loginHistory = user.loginHistory.slice(-10);
  }
  
  await user.save();

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      securityPreferences: user.securityPreferences
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, securityPreferences } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;
  if (securityPreferences) updateData.securityPreferences = securityPreferences;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      securityPreferences: user.securityPreferences
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Demo login endpoints
 * @route   POST /api/auth/demo/:role
 * @access  Public
 */
const demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const validRoles = ['admin', 'analyst', 'user'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid demo role'
    });
  }
  
  // Create demo user data
  const demoUsers = {
    admin: {
      id: 'demo_admin_001',
      name: 'Admin User',
      email: 'admin@cybershield.com',
      role: 'admin'
    },
    analyst: {
      id: 'demo_analyst_001',
      name: 'Security Analyst',
      email: 'analyst@cybershield.com',
      role: 'analyst'
    },
    user: {
      id: 'demo_user_001',
      name: 'Standard User',
      email: 'user@cybershield.com',
      role: 'user'
    }
  };
  
  const demoUser = demoUsers[role];
  const token = generateToken(demoUser.id, demoUser.role);
  
  res.json({
    success: true,
    message: `Demo ${role} login successful`,
    token,
    user: demoUser,
    note: 'This is a demo account. Data is not persisted.'
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Note: For JWT, logout is handled client-side by removing token
  // This endpoint is for future implementation with token blacklisting
  
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  demoLogin,
  logout
};