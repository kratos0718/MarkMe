const express = require('express');
const { markAttendance, getAttendanceHistory } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/mark-attendance', protect, authorize('student'), upload.single('image'), markAttendance);
router.get('/attendance-history', protect, authorize('student'), getAttendanceHistory);

module.exports = router;
