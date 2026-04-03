const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    building: {
        type: String,
        required: true
    },
    floor: {
        type: String,
        required: true
    },
    referenceImages: [{
        type: String // URLs from Cloudinary
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Classroom', classroomSchema);
