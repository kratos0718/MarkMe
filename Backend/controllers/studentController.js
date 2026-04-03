const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
// `fs` is no longer needed since we upload from memory rather than from disk

// Helper to calculate distance (Haversine Formula)
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371 * 1000; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
};

// @desc    Mark attendance for a session
// @route   POST /api/student/mark-attendance
// @access  Private (Student)
const markAttendance = async (req, res) => {
    let { sessionKey, location } = req.body;
    const file = req.file; // multer.memoryStorage provides `file.buffer` and other metadata

    // Parse location if it's a string (from FormData)
    if (typeof location === 'string') {
        try {
            location = JSON.parse(location);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid location format' });
        }
    }

    const isDemoUser = req.user.email && req.user.email.startsWith('demo.');
    if (!sessionKey || !location || (!file && !isDemoUser)) {
        return res.status(400).json({ message: 'Please provide session key, location, and face image' });
    }

    try {
        const session = await Session.findOne({ sessionKey });

        if (!session) {
            return res.status(404).json({ message: 'Invalid Session Key' });
        }

        if (!session.isActive) {
            return res.status(400).json({ message: 'Session is inactive or has expired' });
        }

        // Check if student already marked attendance
        const existingAttendance = await Attendance.findOne({
            session: session._id,
            student: req.user._id,
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for this session' });
        }

        // Validate Location (Geofence) — skipped for demo accounts
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);

        if (!isDemoUser) {
            const distance = getDistanceFromLatLonInKm(lat, lng, session.location.lat, session.location.lng);
            if (distance > session.location.radius) {
                return res.status(400).json({ message: `You are out of range by ${Math.round(distance - session.location.radius)} meters.` });
            }
        }

        // Upload snapshot to Cloudinary — skipped for demo accounts
        let snapshotUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
        if (!isDemoUser && file) {
            const streamUpload = (buffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'attendance_snapshots' },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    Readable.from(buffer).pipe(stream);
                });
            };
            const result = await streamUpload(file.buffer);
            snapshotUrl = result.secure_url;
        }

        const attendance = await Attendance.create({
            session: session._id,
            student: req.user._id,
            snapshotUrl,
            locationCaptured: { lat, lng },
        });
        console.log(`[Attendance] Marked for Student: ${req.user._id} in Session: ${session._id}`);

        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        // if we had written any temporary file to disk we'd clean it here, but using memoryStorage avoids that.
        console.error("[Attendance Error]", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance history for student
// @route   GET /api/student/attendance-history
// @access  Private (Student)
const getAttendanceHistory = async (req, res) => {
    try {
        const attendance = await Attendance.find({ student: req.user._id })
            .populate({
                path: 'session',
                select: 'subject createdAt', // We need subject and date
                populate: {
                    path: 'faculty',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        const history = attendance.map(record => ({
            date: record.session.createdAt.toISOString().split('T')[0],
            subject: record.session.subject || "Unknown",
            status: 'Present', // If record exists, they are present
            facultyName: record.session.faculty.name
        }));

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { markAttendance, getAttendanceHistory };

