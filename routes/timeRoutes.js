const express = require('express');
const WebSocket = require('ws');
const TimeEntry = require('../models/timeEntryModel');
const ensureAuthenticated = require('../middleware/authMiddleware');

module.exports = (wss) => {
    const router = express.Router();

    router.post('/start', ensureAuthenticated, async (req, res) => {
        try {
            const timeEntry = new TimeEntry({
                user: req.session.user._id,
                startTime: new Date()
            });
            await timeEntry.save();
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'startTracking', user: req.session.user.username, startTime: timeEntry.startTime }));
                }
            });
            res.json({ success: true, timeEntry });
        } catch (error) {
            console.error('Error starting time tracking:', error);
            res.json({ success: false, error });
        }
    });

    router.post('/stop', ensureAuthenticated, async (req, res) => {
        try {
            const timeEntry = await TimeEntry.findOne({ user: req.session.user._id, endTime: null });
            if (timeEntry) {
                timeEntry.endTime = new Date();
                await timeEntry.save();
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'stopTracking', user: req.session.user.username, endTime: timeEntry.endTime }));
                    }
                });
                res.json({ success: true, timeEntry });
            } else {
                res.json({ success: false, message: 'No active time entry found' });
            }
        } catch (error) {
            console.error('Error stopping time tracking:', error);
            res.json({ success: false, error });
        }
    });

    return router;
};
