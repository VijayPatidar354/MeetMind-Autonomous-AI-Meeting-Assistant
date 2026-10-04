const express = require('express');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');

const router = new express.Router();

// Get all meetings for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const meetings = await Meeting.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new meeting
router.post('/', auth, async (req, res) => {
    try {
        const { title, meetingLink, date, time } = req.body;
        
        if (!title || !meetingLink || !date || !time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const meeting = new Meeting({
            userId: req.user._id,
            title,
            meetingLink,
            date,
            time
        });

        await meeting.save();

        // Check if meeting should start immediately
        const now = new Date();
        const currentDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (date < currentDate || (date === currentDate && time <= currentTime)) {
            meeting.status = 'Joining';
            await meeting.save();
            const axios = require('axios');
            axios.post('http://127.0.0.1:8000/bot/dispatch', {
                meeting_id: meeting._id.toString(),
                meeting_link: meeting.meetingLink
            }).catch(e => console.error('[Meetings API] Immediate dispatch failed:', e.message));
        }

        res.status(201).json(meeting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get a specific meeting
router.get('/:id', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user._id });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a meeting
router.delete('/:id', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update meeting status (Typically called by the Python AI Service, but secured here or handled internally)
// We will secure it later, for now we can update it if needed.
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const meeting = await Meeting.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { status },
            { new: true }
        );
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Proxy chat requests to Python AI Service
router.post('/:id/chat', auth, async (req, res) => {
    try {
        const { query } = req.body;
        const axios = require('axios');
        const response = await axios.post('http://127.0.0.1:8000/chat', {
            meeting_id: req.params.id,
            query: query
        });
        res.json(response.data);
    } catch (error) {
        console.error('Chat proxy error:', error.message);
        res.status(500).json({ error: 'Failed to communicate with AI Service' });
    }
});

// Internal route for Python AI Service to update meeting results
router.patch('/:id/internal-update', async (req, res) => {
    try {
        const { status, transcriptPath, recordingPath } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { status, transcriptPath, recordingPath },
            { new: true }
        );
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Transcript content
router.get('/:id/transcript', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user._id });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        
        const path = require('path');
        const fs = require('fs');
        
        // Fallback to deterministic path if the DB wasn't updated (for older meetings)
        const expectedPath = meeting.transcriptPath || path.join(__dirname, '../../../data/transcripts/transcript_' + meeting._id + '.txt');
        const absolutePath = path.resolve(expectedPath);

        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, 'utf8');
            res.json({ content });
        } else {
            res.status(404).json({ error: 'Transcript file missing' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Audio content
router.get('/:id/audio', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user._id });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        
        const path = require('path');
        const fs = require('fs');
        
        // Fallback to deterministic path if the DB wasn't updated
        const expectedPath = meeting.recordingPath || path.join(__dirname, '../../../data/recordings/meeting_' + meeting._id + '.wav');
        const absolutePath = path.resolve(expectedPath);

        if (fs.existsSync(absolutePath)) {
            res.setHeader('Content-Type', 'audio/wav');
            fs.createReadStream(absolutePath).pipe(res);
        } else {
            res.status(404).json({ error: 'Audio file missing' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
