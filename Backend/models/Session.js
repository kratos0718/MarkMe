const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sessionKey: {
        type: String, // 6-digit key
        required: true,
        unique: true,
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radius: { type: Number, required: true }, // in meters
    },
    subject: { type: String },   // Snapshot of subject at session creation
    className: { type: String }, // Snapshot of class name at session creation
    isActive: {
        type: Boolean,
        default: true,
    },
    expireAt: {
        type: Date,
        default: () => new Date(+new Date() + 3 * 60 * 60 * 1000) // Default 3 hours if not closed
    }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
