/**
 * Format response data consistently
 */
const formatResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Generate pagination metadata
 */
const getPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove script tags and dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
  return input;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate IP address format
 */
const isValidIP = (ip) => {
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Generate random number between min and max
 */
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date to readable string
 */
const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  const formats = {
    short: d.toLocaleDateString(),
    medium: d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleString(),
    iso: d.toISOString(),
    relative: getRelativeTime(d)
  };

  return formats[format] || formats.full;
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, 'short');
  }
};

/**
 * Truncate text with ellipsis
 */
const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate unique ID
 */
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Mask sensitive data (like emails, phone numbers)
 */
const maskSensitiveData = (data, type = 'email') => {
  if (!data) return '';
  
  switch (type) {
    case 'email':
      const [username, domain] = data.split('@');
      if (username.length <= 2) {
        return `${username}***@${domain}`;
      }
      const maskedUsername = username.substring(0, 2) + '*'.repeat(3);
      return `${maskedUsername}@${domain}`;
    
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    
    case 'creditCard':
      return data.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
    
    case 'ip':
      return data.replace(/(\d+\.\d+)\.\d+\.\d+/, '$1.*.*');
    
    default:
      return data;
  }
};

/**
 * Generate color based on severity
 */
const getSeverityColor = (severity) => {
  const colors = {
    critical: '#ff2a6d',
    high: '#ff9f43',
    medium: '#00f3ff',
    low: '#00ff95'
  };
  return colors[severity] || '#666';
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Delay execution (for testing/simulation)
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Parse query parameters for filtering
 */
const parseFilterParams = (query) => {
  const filter = {};
  const sort = {};
  
  // Parse filter parameters
  if (query.severity) filter.severity = query.severity;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  // Parse date range
  if (query.startDate || query.endDate) {
    filter.detectedAt = {};
    if (query.startDate) filter.detectedAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.detectedAt.$lte = new Date(query.endDate);
  }
  
  // Parse sort parameters
  if (query.sortBy) {
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    sort[query.sortBy] = sortOrder;
  } else {
    sort.detectedAt = -1; // Default sort by newest
  }
  
  return { filter, sort };
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  formatResponse,
  getPagination,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  isValidIP,
  getRandomNumber,
  formatFileSize,
  formatDate,
  getRelativeTime,
  truncateText,
  generateUniqueId,
  maskSensitiveData,
  getSeverityColor,
  calculatePercentage,
  delay,
  parseFilterParams,
  validatePassword
};