const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  company: {
    type: String,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  service: {
    type: String,
    enum: [
      'security-audit',
      'penetration-testing',
      'incident-response',
      'compliance',
      'consultation',
      'training',
      'other'
    ],
    default: 'consultation'
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [10, 'Message must be at least 10 characters']
  },
  
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'resolved', 'spam'],
    default: 'new',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  source: {
    type: String,
    default: 'website'
  },
  
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
contactSchema.index({ status: 1, priority: 1, createdAt: -1 });
contactSchema.index({ email: 1, createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;