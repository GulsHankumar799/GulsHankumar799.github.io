const ToolRequest = require('../models/ToolRequest');
const {
  calculatePasswordStrength,
  generateHash,
  validateUrlSafety,
  checkSSLCertificate,
  generateSecurePassword
} = require('../utils/security');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Password strength analyzer
 * @route   POST /api/tools/password-analyzer
 * @access  Private
 */
const passwordAnalyzer = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  const startTime = Date.now();
  const result = calculatePasswordStrength(password);
  const processingTime = Date.now() - startTime;
  
  // Save request to database
  await ToolRequest.create({
    tool: 'password-analyzer',
    userId: req.user?._id || null,
    input: { passwordLength: password.length },
    result,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    processingTime,
    metadata: {
      score: result.score,
      strength: result.strength
    }
  });
  
  res.json({
    success: true,
    data: {
      ...result,
      length: password.length,
      processingTime: `${processingTime}ms`
    }
  });
});

/**
 * @desc    Hash generator
 * @route   POST /api/tools/hash-generator
 * @access  Private
 */
const hashGenerator = asyncHandler(async (req, res) => {
  const { text, algorithm = 'SHA256' } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required'
    });
  }
  
  const startTime = Date.now();
  
  try {
    const hash = generateHash(text, algorithm);
    const processingTime = Date.now() - startTime;
    
    // Save request to database
    await ToolRequest.create({
      tool: 'hash-generator',
      userId: req.user?._id || null,
      input: { algorithm, textLength: text.length },
      result: { hash, algorithm },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      processingTime,
      metadata: {
        algorithm,
        inputLength: text.length
      }
    });
    
    res.json({
      success: true,
      data: {
        hash,
        algorithm,
        inputLength: text.length,
        processingTime: `${processingTime}ms`
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    URL safety checker
 * @route   POST /api/tools/url-checker
 * @access  Private
 */
const urlChecker = asyncHandler(async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format'
    });
  }
  
  const startTime = Date.now();
  const result = await validateUrlSafety(url);
  const processingTime = Date.now() - startTime;
  
  // Save request to database
  await ToolRequest.create({
    tool: 'url-checker',
    userId: req.user?._id || null,
    input: { url },
    result,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    processingTime,
    metadata: {
      url: url.substring(0, 100), // Store truncated URL
      isSafe: result.isSafe
    }
  });
  
  res.json({
    success: true,
    data: {
      url,
      ...result,
      processingTime: `${processingTime}ms`
    }
  });
});

/**
 * @desc    SSL certificate checker
 * @route   POST /api/tools/ssl-checker
 * @access  Private
 */
const sslChecker = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({
      success: false,
      message: 'Domain is required'
    });
  }
  
  // Clean domain (remove protocol)
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  const startTime = Date.now();
  const result = await checkSSLCertificate(cleanDomain);
  const processingTime = Date.now() - startTime;
  
  // Save request to database
  await ToolRequest.create({
    tool: 'ssl-checker',
    userId: req.user?._id || null,
    input: { domain: cleanDomain },
    result,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    processingTime,
    metadata: {
      domain: cleanDomain,
      hasSSL: result.hasSSL
    }
  });
  
  res.json({
    success: true,
    data: {
      domain: cleanDomain,
      ...result,
      processingTime: `${processingTime}ms`
    }
  });
});

/**
 * @desc    Generate secure password
 * @route   POST /api/tools/generate-password
 * @access  Private
 */
const generatePassword = asyncHandler(async (req, res) => {
  const { length = 12, includeNumbers = true, includeSymbols = true } = req.body;
  
  if (length < 8 || length > 32) {
    return res.status(400).json({
      success: false,
      message: 'Password length must be between 8 and 32 characters'
    });
  }
  
  const startTime = Date.now();
  const password = generateSecurePassword(length);
  const strength = calculatePasswordStrength(password);
  const processingTime = Date.now() - startTime;
  
  // Save request to database
  await ToolRequest.create({
    tool: 'generate-password',
    userId: req.user?._id || null,
    input: { length, includeNumbers, includeSymbols },
    result: { password, strength },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    processingTime,
    metadata: {
      length,
      strength: strength.strength
    }
  });
  
  res.json({
    success: true,
    data: {
      password,
      strength,
      length,
      processingTime: `${processingTime}ms`
    }
  });
});

/**
 * @desc    Get tool usage statistics
 * @route   GET /api/tools/statistics
 * @access  Private (Admin/Analyst only)
 */
const getToolStatistics = asyncHandler(async (req, res) => {
  // Get statistics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const statistics = await ToolRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$tool',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        tool: '$_id',
        count: 1,
        avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
        uniqueUsersCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Get daily usage for chart
  const dailyUsage = await ToolRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $limit: 30
    }
  ]);
  
  res.json({
    success: true,
    data: {
      statistics,
      dailyUsage,
      totalRequests: statistics.reduce((sum, stat) => sum + stat.count, 0)
    }
  });
});

module.exports = {
  passwordAnalyzer,
  hashGenerator,
  urlChecker,
  sslChecker,
  generatePassword,
  getToolStatistics
};