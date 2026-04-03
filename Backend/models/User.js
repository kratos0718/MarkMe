const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        default: 'student',
    },
    profileImageUrl: {
        type: String, // Cloudinary URL
        default: '',
    },
    // Common Fields
    phone: {
        type: String,
        default: '',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Student Fields
    rollNo: { type: String },
    branch: { type: String },
    year: { type: String },
    faceImages: [{ type: String }], // Array of image URLs using for recognition

    // Faculty Fields
    department: { type: String },
    subject: { type: String },

}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
// const crypto = require('crypto'); // Removed duplicate

userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
