require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Import Routes
const authRouter = require('./src/routes/auth');
const meetingsRouter = require('./src/routes/meetings');

// Setup Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/meetings', meetingsRouter);

// Start Cron Scheduler
require('./src/cron/scheduler');

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Node Backend' });
});

const PORT = process.env.PORT || 3001;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
