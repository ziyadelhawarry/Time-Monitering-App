const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/timeEntryModel');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const timeEntries = await TimeEntry.find({ user: req.session.user._id });
        res.render('report', { timeEntries });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.redirect('/');
    }
});

module.exports = router;
