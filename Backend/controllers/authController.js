const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { name, password, role } = req.body;
    // identifier can be a roll number (students) or email (faculty/admin)
    const rawIdentifier = req.body.identifier || req.body.email || '';
    const isRollNo = /^\d{10}$/.test(rawIdentifier.trim());
    const email = isRollNo ? `${rawIdentifier.trim()}@gitam.edu` : rawIdentifier.trim();
    const rollNo = isRollNo ? rawIdentifier.trim() : (req.body.rollNo || '');

    try {
        const userExists = await User.findOne({
            $or: [{ email }, ...(rollNo ? [{ rollNo }] : [])]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Upload Face Images to Cloudinary
        let faceImageUrls = [];
        if (req.body.faceImages && req.body.faceImages.length > 0) {
            console.log(`Received ${req.body.faceImages.length} face images for registration.`);
            const cloudinary = require('../config/cloudinary');

            // Process uploads concurrently
            const uploadPromises = req.body.faceImages.map((image, index) => {
                console.log(`Uploading image ${index + 1}... Size: ~${Math.round(image.length / 1024)}KB`);
                return cloudinary.uploader.upload(image, {
                    folder: 'user_faces',
                }).catch(err => {
                    console.error(`Failed to upload image ${index + 1}:`, err.message);
                    throw new Error(`Failed to upload image ${index + 1}: ${err.message}`);
                });
            });

            try {
                const uploadResults = await Promise.all(uploadPromises);
                console.log("All images uploaded successfully to Cloudinary.");
                faceImageUrls = uploadResults.map(result => result.secure_url);
            } catch (uploadErr) {
                console.error("Cloudinary Upload Error:", uploadErr);
                return res.status(500).json({ message: "Image upload failed. " + uploadErr.message });
            }
        } else {
            console.log("No face images provided for registration.");
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            phone: req.body.phone || '',
            rollNo: rollNo || undefined,
            faceImages: faceImageUrls
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

const loginUser = async (req, res) => {
    const { email, password, identifier, role: expectedRole } = req.body;

    try {
        const loginIdentifier = identifier || email;
        console.log("Login Attempt:", loginIdentifier, "| Expected role:", expectedRole);

        const user = await User.findOne({
            $or: [
                { email: loginIdentifier },
                { rollNo: loginIdentifier },
                { phone: loginIdentifier }
            ]
        });

        if (!user) {
            console.log("User not found for identifier:", loginIdentifier);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If a specific role portal was used, enforce it
        if (expectedRole && user.role !== expectedRole) {
            console.log(`Role mismatch: user is '${user.role}', tried to log in as '${expectedRole}'`);
            return res.status(403).json({
                message: `This account is registered as ${user.role}. Please use the ${user.role} portal.`
            });
        }

        const isMatch = await user.matchPassword(password);
        console.log("User found:", user.email, "| Password match:", isMatch, "| Role:", user.role);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                rollNo: user.rollNo || '',
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // In local dev, logic might differ from prod. Assuming frontend is on port 3000 (React default) or 5173 (Vite).
        // Let's assume standard local setup or use Referer.
        // The user didn't specify frontend URL, I'll guess localhost:5173 for Vite or 3000 for CRA.
        // I'll use req.protocol and host, but targeting frontend port.
        // Ideally ENV var FRONTEND_URL.
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

        const message = `Hi,\n\nYou requested a password reset for your MarkMe account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n\n— Abhinav Tarigoopula, MarkMe`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'GITAM Attendance — Password Reset Link',
                message,
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.log(err);
            console.log("DEV MODE ONLY: Reset Link (since email failed):", resetUrl);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            // return res.status(500).json({ message: 'Email could not be sent' });
            // For checking purpose only, normally we wouldn't return this.
            return res.status(500).json({ message: 'Email failed (check console for link)' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            data: 'Password updated success',
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, getMe };

