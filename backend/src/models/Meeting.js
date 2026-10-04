const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    meetingLink: {
        type: String,
        required: true
    },
    date: {
        type: String, // format YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // format HH:MM
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Joining', 'Recording', 'Processing', 'Completed', 'Failed'],
        default: 'Scheduled'
    },
    recordingPath: {
        type: String,
        default: null
    },
    transcriptPath: {
        type: String,
        default: null
    },
    summary: {
        executiveSummary: String,
        actionItems: [String],
        decisions: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
