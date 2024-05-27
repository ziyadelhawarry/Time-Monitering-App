const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/timeEntryModel');
const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/report', roleMiddleware('employer'), async (req, res) => {
    try {
        const freelancers = await User.find({ role: 'freelancer' });
        const reports = await Promise.all(freelancers.map(async freelancer => {
            const timeEntries = await TimeEntry.find({ user: freelancer._id });
            const activityLogs = await ActivityLog.find({ user: freelancer._id });
            const totalHours = timeEntries.reduce((sum, entry) => {
                if (entry.endTime) {
                    const duration = (new Date(entry.endTime) - new Date(entry.startTime)) / 1000 / 60 / 60;
                    return sum + duration;
                }
                return sum;
            }, 0);
            return {
                freelancer: freelancer.username,
                timeEntries,
                activityLogs,
                totalHours: totalHours.toFixed(2),
                isVideoEnabled: freelancer.isVideoEnabled
            };
        }));
        res.render('report', { reports });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.redirect('/employer');
    }
});

module.exports = router;
