const mongoose = require('mongoose');

const threatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Threat title is required'],
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  type: {
    type: String,
    enum: [
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
    ],
    required: true,
    index: true
  },
  
  sourceIp: {
    type: String,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address']
  },
  
  sourceCountry: {
    type: String,
    default: 'Unknown'
  },
  
  target: {
    type: String
  },
  
  status: {
    type: String,
    enum: ['detected', 'investigating', 'contained', 'mitigated', 'resolved', 'false-positive'],
    default: 'detected',
    index: true
  },
  
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  resolvedAt: {
    type: Date
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  evidence: [{
    type: String,
    url: String,
    description: String
  }],
  
  impactScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 5
  },
  
  mitigationSteps: [{
    step: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  tags: [{
    type: String
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
threatSchema.index({ severity: 1, status: 1, detectedAt: -1 });
threatSchema.index({ type: 1, detectedAt: -1 });

// Virtual for threat age in hours
threatSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const detected = this.detectedAt;
  const diffHours = Math.floor((now - detected) / (1000 * 60 * 60));
  return diffHours;
});

// Method to mark as resolved
threatSchema.methods.markAsResolved = function(userId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.updatedBy = userId;
};

const Threat = mongoose.model('Threat', threatSchema);

module.exports = Threat;