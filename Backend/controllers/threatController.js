const Threat = require('../models/Threat');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all threats with filtering
 * @route   GET /api/threats
 * @access  Private
 */
const getThreats = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    severity,
    type,
    status,
    sortBy = 'detectedAt',
    sortOrder = 'desc'
  } = req.query;
  
  // Build filter
  const filter = {};
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (status) filter.status = status;
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  
  // Get total count
  const total = await Threat.countDocuments(filter);
  
  // Get threats with pagination
  const threats = await Threat.find(filter)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(startIndex)
    .limit(parseInt(limit))
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  // Calculate pagination metadata
  const pagination = {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasNextPage: startIndex + parseInt(limit) < total,
    hasPrevPage: startIndex > 0
  };
  
  res.json({
    success: true,
    count: threats.length,
    pagination,
    data: threats
  });
});

/**
 * @desc    Get threat by ID
 * @route   GET /api/threats/:id
 * @access  Private
 */
const getThreatById = asyncHandler(async (req, res) => {
  const threat = await Threat.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!threat) {
    return res.status(404).json({
      success: false,
      message: 'Threat not found'
    });
  }
  
  res.json({
    success: true,
    data: threat
  });
});

/**
 * @desc    Create new threat
 * @route   POST /api/threats
 * @access  Private (Admin/Analyst only)
 */
const createThreat = asyncHandler(async (req, res) => {
  const threatData = {
    ...req.body,
    createdBy: req.user._id,
    updatedBy: req.user._id
  };
  
  const threat = await Threat.create(threatData);
  
  // Populate createdBy field
  await threat.populate('createdBy', 'name email');
  
  res.status(201).json({
    success: true,
    message: 'Threat created successfully',
    data: threat
  });
});

/**
 * @desc    Update threat
 * @route   PUT /api/threats/:id
 * @access  Private (Admin/Analyst only)
 */
const updateThreat = asyncHandler(async (req, res) => {
  const threat = await Threat.findById(req.params.id);
  
  if (!threat) {
    return res.status(404).json({
      success: false,
      message: 'Threat not found'
    });
  }
  
  // Update threat
  Object.assign(threat, req.body);
  threat.updatedBy = req.user._id;
  
  // If status changed to resolved, set resolvedAt
  if (req.body.status === 'resolved' && threat.status !== 'resolved') {
    threat.resolvedAt = new Date();
  }
  
  await threat.save();
  
  // Populate updatedBy field
  await threat.populate('updatedBy', 'name email');
  
  res.json({
    success: true,
    message: 'Threat updated successfully',
    data: threat
  });
});

/**
 * @desc    Delete threat
 * @route   DELETE /api/threats/:id
 * @access  Private (Admin only)
 */
const deleteThreat = asyncHandler(async (req, res) => {
  const threat = await Threat.findById(req.params.id);
  
  if (!threat) {
    return res.status(404).json({
      success: false,
      message: 'Threat not found'
    });
  }
  
  await threat.deleteOne();
  
  res.json({
    success: true,
    message: 'Threat deleted successfully'
  });
});

/**
 * @desc    Get threat statistics
 * @route   GET /api/threats/statistics
 * @access  Private
 */
const getThreatStatistics = asyncHandler(async (req, res) => {
  // Get statistics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Severity distribution
  const severityStats = await Threat.aggregate([
    {
      $match: {
        detectedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Type distribution
  const typeStats = await Threat.aggregate([
    {
      $match: {
        detectedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Status distribution
  const statusStats = await Threat.aggregate([
    {
      $match: {
        detectedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Daily threat count for chart
  const dailyThreats = await Threat.aggregate([
    {
      $match: {
        detectedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' }
        },
        count: { $sum: 1 },
        highSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        criticalSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $limit: 30
    }
  ]);
  
  // Top countries
  const topCountries = await Threat.aggregate([
    {
      $match: {
        detectedAt: { $gte: thirtyDaysAgo },
        sourceCountry: { $ne: null, $ne: 'Unknown' }
      }
    },
    {
      $group: {
        _id: '$sourceCountry',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
  
  res.json({
    success: true,
    data: {
      severityStats,
      typeStats,
      statusStats,
      dailyThreats,
      topCountries,
      totalThreats: severityStats.reduce((sum, stat) => sum + stat.count, 0)
    }
  });
});

/**
 * @desc    Get real-time threat feed
 * @route   GET /api/threats/feed
 * @access  Private
 */
const getThreatFeed = asyncHandler(async (req, res) => {
  const threats = await Threat.find()
    .sort({ detectedAt: -1 })
    .limit(10)
    .populate('assignedTo', 'name avatar')
    .select('title severity type status detectedAt sourceCountry');
  
  res.json({
    success: true,
    data: threats
  });
});

/**
 * @desc    Simulate real-time threats (for demo)
 * @route   POST /api/threats/simulate
 * @access  Private (Admin/Analyst only)
 */
const simulateThreat = asyncHandler(async (req, res) => {
  const threatTypes = [
    { type: 'phishing', title: 'Phishing Campaign Detected', severity: 'high' },
    { type: 'malware', title: 'Malware Infection Attempt', severity: 'critical' },
    { type: 'ddos', title: 'DDoS Attack In Progress', severity: 'high' },
    { type: 'vulnerability', title: 'Critical Vulnerability Found', severity: 'medium' },
    { type: 'brute-force', title: 'Brute Force Attack Attempt', severity: 'low' }
  ];
  
  const randomThreat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
  const countries = ['USA', 'China', 'Russia', 'Germany', 'India', 'Brazil', 'UK', 'Japan'];
  
  const threat = await Threat.create({
    title: randomThreat.title,
    description: `Automated simulation of ${randomThreat.type} attack`,
    severity: randomThreat.severity,
    type: randomThreat.type,
    sourceCountry: countries[Math.floor(Math.random() * countries.length)],
    status: 'detected',
    createdBy: req.user._id,
    updatedBy: req.user._id,
    impactScore: Math.floor(Math.random() * 10) + 1,
    tags: ['simulated', 'demo']
  });
  
  res.json({
    success: true,
    message: 'Threat simulation created',
    data: threat
  });
});

module.exports = {
  getThreats,
  getThreatById,
  createThreat,
  updateThreat,
  deleteThreat,
  getThreatStatistics,
  getThreatFeed,
  simulateThreat
};