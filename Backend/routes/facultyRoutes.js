const express = require('express');
const { createSession, getAttendanceHistory, getSessionDetails } = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-session', protect, authorize('faculty', 'admin'), createSession);
router.get('/history', protect, authorize('faculty', 'admin'), getAttendanceHistory);
router.get('/session/:id', protect, authorize('faculty', 'admin'), getSessionDetails);

module.exports = router;
