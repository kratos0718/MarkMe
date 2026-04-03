const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

// @desc    Create a new attendance session
// @route   POST /api/faculty/create-session
// @access  Private (Faculty/Admin)
const createSession = async (req, res) => {
    // location: { lat, lng, radius }
    const { location, subject, className, activeMinutes } = req.body;

    // Generate unique 6-digit key
    let sessionKey;
    let isUnique = false;
    while (!isUnique) {
        sessionKey = Math.floor(100000 + Math.random() * 900000).toString();
        const existingSession = await Session.findOne({ sessionKey });
        if (!existingSession) isUnique = true;
    }

    try {
        // Calculate expiration based on activeMinutes (default to 5 mins if not provided)
        const duration = activeMinutes ? activeMinutes * 60 * 1000 : 5 * 60 * 1000;
        const expireAt = new Date(Date.now() + duration);

        const session = await Session.create({
            faculty: req.user._id,
            sessionKey,
            location,
            subject,
            className,
            expireAt
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance history/reports
// @route   GET /api/faculty/history
// @access  Private (Faculty/Admin)
const getAttendanceHistory = async (req, res) => {
    try {
        // Find sessions created by this faculty
        const sessions = await Session.find({ faculty: req.user._id }).sort({ createdAt: -1 });

        // Optionally populate attendance for each session or just return session list 
        // For a full report we probably want attendance data too.
        // Let's return sessions and allow fetching details for a specific session in another endpoint or here?
        // Prompt says "retrieve attendance history as JSON". I'll return a list of sessions with their attendance counts.

        const history = await Promise.all(sessions.map(async (session) => {
            const attendanceCount = await Attendance.countDocuments({ session: session._id });
            return {
                ...session.toObject(),
                attendanceCount
            };
        }));

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get specific session details with student list
// @route   GET /api/faculty/session/:id
// @access  Private (Faculty/Admin)
const getSessionDetails = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Ensure faculty owns this session (or is admin)
        if (session.faculty.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const attendance = await Attendance.find({ session: session._id })
            .populate('student', 'name email profileImageUrl');

        console.log(`[Faculty] Fetching session ${session._id}. Found ${attendance.length} attendance records.`);

        res.json({ session, attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { createSession, getAttendanceHistory, getSessionDetails };
