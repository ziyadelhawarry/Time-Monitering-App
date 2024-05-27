const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/timeEntryModel');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/start', authMiddleware, async (req, res) => {
    const { projectName } = req.body;
    try {
        const timeEntry = new TimeEntry({
            user: req.session.user._id,
            projectName,
            startTime: new Date()
        });
        await timeEntry.save();
        res.json({ success: true, timeEntry });
    } catch (error) {
        console.error('Error starting time entry:', error);
        res.json({ success: false, error });
    }
});

router.post('/stop', authMiddleware, async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findOne({
            user: req.session.user._id,
            endTime: { $exists: false }
        });
        if (timeEntry) {
            timeEntry.endTime = new Date();
            await timeEntry.save();
            res.json({ success: true, timeEntry });
        } else {
            res.json({ success: false, error: 'No active time entry found' });
        }
    } catch (error) {
        console.error('Error stopping time entry:', error);
        res.json({ success: false, error });
    }
});

module.exports = router;
