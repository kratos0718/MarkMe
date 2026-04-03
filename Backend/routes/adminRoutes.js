const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getStats,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getClassrooms,
    createClassroom,
    deleteClassroom,
    updateClassroom,
    getAttendanceReports
} = require('../controllers/adminController');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/add-user', addUser);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);

router.get('/classrooms', getClassrooms);
router.post('/create-classroom', createClassroom);
router.put('/classroom/:id', updateClassroom);
router.delete('/classroom/:id', deleteClassroom);

router.get('/attendance', getAttendanceReports);

module.exports = router;
