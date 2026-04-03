const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    snapshotUrl: {
        type: String, // Image from the check-in
        required: true,
    },
    locationCaptured: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['Present'],
        default: 'Present',
    }
}, { timestamps: true });

// Prevent duplicate attendance for the same session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
