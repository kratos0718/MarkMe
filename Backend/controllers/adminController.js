const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const facultyCount = await User.countDocuments({ role: 'faculty' });
        const classroomCount = await Classroom.countDocuments({});

        res.json({
            students: studentCount,
            faculty: facultyCount,
            classrooms: classroomCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users by role
// @route   GET /api/admin/users?role=student
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        if (!role) {
            return res.status(400).json({ message: 'Role query parameter is required' });
        }
        const users = await User.find({ role }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a new user (Student or Faculty)
// @route   POST /api/admin/add-user
// @access  Private (Admin)
exports.addUser = async (req, res) => {
    try {
        const { name, email, password, role, rollNo, branch, year, subject, department, phone } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Default password if not provided
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        const userPassword = password;

        // Hash password (handled in User model pre-save, but redundant check is fine if we passed plain text)
        // Actually User model pre-save handles hashing if isModified('password')

        user = new User({
            name,
            email,
            password: userPassword,
            role,
            phone,
            // Student Fields
            // Student specific
            rollNo,
            branch,
            year,
            // Faculty specific
            subject, // Note: subject is not in base User model, you might want to add it or store in separate profile
            department
        });

        // Note: The User model currently might not have rollNo, branch, etc.
        // We should double check User.js. If it doesn't, we need to update it.
        // Assuming for now User.js needs an update or we store it in a generic 'info' field?
        // Let's check User.js after this tool call.

        await user.save();

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/user/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/user/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, rollNo, branch, year, subject, department, faceImages } = req.body;

        // Build update object
        const updateFields = {
            name,
            email,
            phone,
            rollNo,
            branch,
            year,
            subject,
            department,
            faceImages
        };

        // Remove undefined fields
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all classrooms
// @route   GET /api/admin/classrooms
// @access  Private (Admin)
exports.getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find({});
        res.json(classrooms);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a classroom
// @route   POST /api/admin/create-classroom
// @access  Private (Admin)
exports.createClassroom = async (req, res) => {
    try {
        const { name, building, floor, referenceImages } = req.body;

        // Check if exists
        let classroom = await Classroom.findOne({ name });
        if (classroom) {
            return res.status(400).json({ message: 'Classroom already exists' });
        }

        // Upload Reference Images to Cloudinary
        let referenceImageUrls = [];
        if (referenceImages && referenceImages.length > 0) {
            console.log(`Received ${referenceImages.length} reference images for classroom.`);

            // Process uploads concurrently
            const uploadPromises = referenceImages.map((image, index) => {
                console.log(`Uploading classroom image ${index + 1}... Size: ~${Math.round(image.length / 1024)}KB`);
                return cloudinary.uploader.upload(image, {
                    folder: 'classroom_images',
                }).catch(err => {
                    console.error(`Failed to upload classroom image ${index + 1}:`, err.message);
                    throw new Error(`Failed to upload classroom image ${index + 1}: ${err.message}`);
                });
            });

            try {
                const uploadResults = await Promise.all(uploadPromises);
                console.log("All classroom images uploaded successfully to Cloudinary.");
                referenceImageUrls = uploadResults.map(result => result.secure_url);
            } catch (uploadErr) {
                console.error("Cloudinary Upload Error:", uploadErr);
                return res.status(500).json({ message: "Image upload failed. " + uploadErr.message });
            }
        } else {
            console.log("No reference images provided for classroom.");
        }

        classroom = new Classroom({
            name,
            building,
            floor,
            referenceImages: referenceImageUrls
        });

        await classroom.save();
        res.status(201).json(classroom);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a classroom
// @route   DELETE /api/admin/classroom/:id
// @access  Private (Admin)
exports.deleteClassroom = async (req, res) => {
    try {
        await Classroom.findByIdAndDelete(req.params.id);
        res.json({ message: 'Classroom deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a classroom (e.g., add reference images)
// @route   PUT /api/admin/classroom/:id
// @access  Private (Admin)
exports.updateClassroom = async (req, res) => {
    try {
        const { name, building, floor, referenceImages } = req.body;

        // Handle reference images: upload new base64 images to Cloudinary, keep existing URLs
        let referenceImageUrls = [];
        if (referenceImages && referenceImages.length > 0) {
            console.log(`Processing ${referenceImages.length} reference images for classroom update.`);

            // Separate existing URLs from new base64 images
            const existingUrls = referenceImages.filter(img => img.startsWith('http'));
            const newImages = referenceImages.filter(img => !img.startsWith('http'));

            referenceImageUrls = [...existingUrls];

            if (newImages.length > 0) {
                // Process uploads for new images concurrently
                const uploadPromises = newImages.map((image, index) => {
                    console.log(`Uploading new classroom image ${index + 1}... Size: ~${Math.round(image.length / 1024)}KB`);
                    return cloudinary.uploader.upload(image, {
                        folder: 'classroom_images',
                    }).catch(err => {
                        console.error(`Failed to upload classroom image ${index + 1}:`, err.message);
                        throw new Error(`Failed to upload classroom image ${index + 1}: ${err.message}`);
                    });
                });

                try {
                    const uploadResults = await Promise.all(uploadPromises);
                    console.log("New classroom images uploaded successfully to Cloudinary.");
                    const newUrls = uploadResults.map(result => result.secure_url);
                    referenceImageUrls = [...referenceImageUrls, ...newUrls];
                } catch (uploadErr) {
                    console.error("Cloudinary Upload Error:", uploadErr);
                    return res.status(500).json({ message: "Image upload failed. " + uploadErr.message });
                }
            }
        }

        const updateFields = {
            name,
            building,
            floor,
            referenceImages: referenceImageUrls
        };

        // Remove undefined fields
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const classroom = await Classroom.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json(classroom);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get comprehensive attendance reports for admin
// @route   GET /api/admin/attendance
// @access  Private (Admin)
exports.getAttendanceReports = async (req, res) => {
    try {
        const { date, subject, className } = req.query;

        let query = {};

        // Filter sessions first
        let sessionQuery = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            sessionQuery.createdAt = { $gte: startDate, $lte: endDate };
        }
        // Note: 'subject' and 'className' are not directly on Session model in previous steps?
        // We might need to populate Faculty to filter by subject, or store it.
        // The previous context said "Add subject and className fields to Session model".
        // I should verify if Session model has these fields.

        // For now, let's fetch all sessions and their attendance
        const sessions = await Session.find(sessionQuery).populate('faculty', 'name email');

        // This is a naive implementation, meant to be refined.
        // We'll aggregate results.

        const reports = [];
        for (const session of sessions) {
            const attendanceCount = await Attendance.countDocuments({ session: session._id, status: 'Present' });
            // Total students? We don't have a fixed class list linked to a session yet.
            // AdminDashboard expects { date, subject, className, present, total, proxiesBlocked }

            reports.push({
                sessionKey: session.sessionKey,
                date: session.createdAt.toISOString().split('T')[0],
                // If session doesn't have subject/class, these will be undefined.
                subject: session.subject || "Unknown",
                className: session.className || "Unknown",
                present: attendanceCount,
                total: 0, // Placeholder
                proxiesBlocked: 0 // Placeholder
            });
        }

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
