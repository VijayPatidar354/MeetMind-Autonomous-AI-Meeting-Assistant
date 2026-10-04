const cron = require('node-cron');
const axios = require('axios');
const Meeting = require('../models/Meeting');

// Run every minute to check for scheduled meetings
cron.schedule('* * * * *', async () => {
    try {
        console.log('[Cron] Checking for upcoming meetings...');
        
        // Get current date and time
        const now = new Date();
        // Extract local YYYY-MM-DD
        const currentDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        // Extract local HH:MM
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        // Find meetings that are scheduled for today and the time is less than or equal to current time
        const meetingsToStart = await Meeting.find({
            status: 'Scheduled',
            date: currentDate,
            time: { $lte: currentTime }
        });

        if (meetingsToStart.length === 0) {
            return;
        }

        console.log(`[Cron] Found ${meetingsToStart.length} meetings to start right now.`);

        for (const meeting of meetingsToStart) {
            // Mark as joining
            meeting.status = 'Joining';
            await meeting.save();

            console.log(`[Cron] Triggering AI Bot for meeting ID: ${meeting._id}`);
            
            try {
                // Call Python FastAPI service (Assuming it runs on 8000)
                // This is fire-and-forget from the perspective of cron
                await axios.post('http://127.0.0.1:8000/bot/dispatch', {
                    meeting_id: meeting._id.toString(),
                    meeting_link: meeting.meetingLink
                });
            } catch (pyError) {
                console.error(`[Cron] Failed to dispatch Python Bot for meeting ${meeting._id}:`, pyError.message);
                meeting.status = 'Failed';
                await meeting.save();
            }
        }
    } catch (error) {
        console.error('[Cron] Error running scheduler:', error.message);
    }
});
