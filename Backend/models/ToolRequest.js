const mongoose = require('mongoose');

const toolRequestSchema = new mongoose.Schema({
  tool: {
    type: String,
    required: true,
    enum: [
      'password-analyzer',
      'hash-generator',
      'url-checker',
      'network-scanner',
      'ssl-checker',
      'ip-lookup',
      'email-validator'
    ]
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  
  success: {
    type: Boolean,
    default: true
  },
  
  error: {
    type: String
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for analytics
toolRequestSchema.index({ tool: 1, createdAt: -1 });
toolRequestSchema.index({ userId: 1, createdAt: -1 });

const ToolRequest = mongoose.model('ToolRequest', toolRequestSchema);

module.exports = ToolRequest;