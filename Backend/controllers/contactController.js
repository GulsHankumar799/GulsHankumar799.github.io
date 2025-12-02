const Contact = require('../models/Contact');
const { sendContactNotification } = require('../utils/email');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination } = require('../utils/helpers');

/**
 * @desc    Submit contact form
 * @route   POST /api/contact
 * @access  Public
 */
const submitContact = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    company,
    phone,
    service,
    message,
    priority = 'medium'
  } = req.body;

  // Create contact
  const contact = await Contact.create({
    name,
    email,
    company,
    phone,
    service,
    message,
    priority,
    source: 'website',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send email notification (if configured)
  if (process.env.EMAIL_USER) {
    await sendContactNotification({
      name,
      email,
      company,
      phone,
      service,
      message,
      priority,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  res.status(201).json({
    success: true,
    message: 'Contact request submitted successfully',
    data: {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      status: contact.status,
      priority: contact.priority,
      submittedAt: contact.createdAt
    }
  });
});

/**
 * @desc    Get all contacts with filtering
 * @route   GET /api/contact
 * @access  Private (Admin/Analyst only)
 */
const getContacts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    service,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (service) filter.service = service;
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const total = await Contact.countDocuments(filter);

  // Get contacts with pagination
  const contacts = await Contact.find(filter)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(startIndex)
    .limit(parseInt(limit))
    .populate('assignedTo', 'name email avatar')
    .populate('notes.createdBy', 'name email');

  // Get pagination metadata
  const pagination = getPagination(page, limit, total);

  res.json({
    success: true,
    count: contacts.length,
    pagination,
    data: contacts
  });
});

/**
 * @desc    Get contact by ID
 * @route   GET /api/contact/:id
 * @access  Private (Admin/Analyst only)
 */
const getContactById = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('notes.createdBy', 'name email');

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  res.json({
    success: true,
    data: contact
  });
});

/**
 * @desc    Update contact status
 * @route   PUT /api/contact/:id/status
 * @access  Private (Admin/Analyst only)
 */
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status, assignedTo, notes } = req.body;

  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  // Update fields
  if (status) contact.status = status;
  if (assignedTo) contact.assignedTo = assignedTo;
  
  // Add note if provided
  if (notes && notes.content) {
    contact.notes.push({
      content: notes.content,
      createdBy: req.user._id
    });
  }

  await contact.save();

  res.json({
    success: true,
    message: 'Contact updated successfully',
    data: contact
  });
});

/**
 * @desc    Delete contact
 * @route   DELETE /api/contact/:id
 * @access  Private (Admin only)
 */
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  await contact.deleteOne();

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

/**
 * @desc    Get contact statistics
 * @route   GET /api/contact/statistics
 * @access  Private (Admin/Analyst only)
 */
const getContactStatistics = asyncHandler(async (req, res) => {
  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Status distribution
  const statusStats = await Contact.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Priority distribution
  const priorityStats = await Contact.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Service distribution
  const serviceStats = await Contact.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$service',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Daily contacts for chart
  const dailyContacts = await Contact.aggregate([
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
        count: { $sum: 1 },
        highPriority: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
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

  // Average response time (if status changed from new)
  const responseTimeStats = await Contact.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: 'new' }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            1000 * 60 * 60 // Convert to hours
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      statusStats,
      priorityStats,
      serviceStats,
      dailyContacts,
      responseTimeStats: responseTimeStats[0] || {},
      totalContacts: statusStats.reduce((sum, stat) => sum + stat.count, 0),
      newContacts: statusStats.find(s => s._id === 'new')?.count || 0
    }
  });
});

module.exports = {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStatistics
};