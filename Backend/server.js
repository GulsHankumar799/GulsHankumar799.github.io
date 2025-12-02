require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const threatRoutes = require('./routes/threatRoutes');
const contactRoutes = require('./routes/contactRoutes');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://gulshankumar799.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CyberShield Pro Backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/contact', contactRoutes);

// Serve documentation
app.get('/api-docs', (req, res) => {
  res.json({
    message: 'CyberShield Pro API Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile',
        'POST /api/auth/demo/:role': 'Demo login (admin|analyst|user)'
      },
      tools: {
        'POST /api/tools/password-analyzer': 'Analyze password strength',
        'POST /api/tools/hash-generator': 'Generate cryptographic hash',
        'POST /api/tools/url-checker': 'Check URL safety',
        'POST /api/tools/ssl-checker': 'Check SSL certificate',
        'POST /api/tools/generate-password': 'Generate secure password'
      },
      threats: {
        'GET /api/threats': 'Get all threats',
        'GET /api/threats/statistics': 'Get threat statistics',
        'GET /api/threats/feed': 'Get real-time threat feed'
      },
      contact: {
        'POST /api/contact': 'Submit contact form'
      }
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 CyberShield Pro Backend Started
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  📍 Port: ${PORT}
  🗓️  ${new Date().toISOString()}
  
  📚 API Documentation: http://localhost:${PORT}/api-docs
  ❤️  Health Check: http://localhost:${PORT}/health
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;