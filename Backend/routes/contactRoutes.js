const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  validateContact,
  validateId
} = require('../middleware/validation');
const {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStatistics
} = require('../controllers/contactController');

// Public route for contact form submission
router.post('/', validateContact, submitContact);

// All routes below require authentication
router.use(auth);

// Get all contacts (Admin/Analyst only)
router.get('/', authorize('admin', 'analyst'), getContacts);

// Get contact statistics (Admin/Analyst only)
router.get('/statistics', authorize('admin', 'analyst'), getContactStatistics);

// Get contact by ID (Admin/Analyst only)
router.get('/:id', authorize('admin', 'analyst'), validateId, getContactById);

// Update contact status (Admin/Analyst only)
router.put('/:id/status', authorize('admin', 'analyst'), validateId, updateContactStatus);

// Add note to contact (Admin/Analyst only)
router.post('/:id/notes', authorize('admin', 'analyst'), validateId, (req, res) => {
  // Implementation for adding notes
  res.json({ success: true, message: 'Add note endpoint' });
});

// Delete contact (Admin only)
router.delete('/:id', authorize('admin'), validateId, deleteContact);

// Export contacts (Admin only)
router.get('/export/csv', authorize('admin'), (req, res) => {
  // Implementation for CSV export
  res.json({ success: true, message: 'Export endpoint' });
});

module.exports = router;