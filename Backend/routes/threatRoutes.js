const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  validateThreat,
  validateThreatQuery,
  validateId
} = require('../middleware/validation');
const {
  getThreats,
  getThreatById,
  createThreat,
  updateThreat,
  deleteThreat,
  getThreatStatistics,
  getThreatFeed,
  simulateThreat
} = require('../controllers/threatController');

// Public route for threat feed (with optional auth)
router.get('/feed', getThreatFeed);

// All routes below require authentication
router.use(auth);

// Get all threats with filtering
router.get('/', validateThreatQuery, getThreats);

// Get threat statistics
router.get('/statistics', authorize('admin', 'analyst'), getThreatStatistics);

// Get threat by ID
router.get('/:id', validateId, getThreatById);

// Create new threat (Admin/Analyst only)
router.post('/', authorize('admin', 'analyst'), validateThreat, createThreat);

// Update threat (Admin/Analyst only)
router.put('/:id', authorize('admin', 'analyst'), validateId, validateThreat, updateThreat);

// Delete threat (Admin only)
router.delete('/:id', authorize('admin'), validateId, deleteThreat);

// Simulate threat (Admin/Analyst only - for demo)
router.post('/simulate', authorize('admin', 'analyst'), simulateThreat);

// Bulk operations (Admin only)
router.post('/bulk/assign', authorize('admin'), (req, res) => {
  // Implementation for bulk assign
  res.json({ success: true, message: 'Bulk assign endpoint' });
});

// Export threats (Admin/Analyst only)
router.get('/export/csv', authorize('admin', 'analyst'), (req, res) => {
  // Implementation for CSV export
  res.json({ success: true, message: 'Export endpoint' });
});

module.exports = router;