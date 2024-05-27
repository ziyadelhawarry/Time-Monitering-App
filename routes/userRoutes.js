const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const roleMiddleware = require('../middleware/roleMiddleware');
const { body, validationResult } = require('express-validator');

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register',
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['freelancer', 'employer']).withMessage('Invalid role'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('register', { errors: errors.array() });
        }
        const { username, password, role } = req.body;
        try {
            const user = new User({ username, password, role });
            await user.save();
            res.redirect('/login');
        } catch (error) {
            console.error('Error registering user:', error);
            res.redirect('/register');
        }
    }
);

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await user.comparePassword(password)) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

router.post('/toggle-video', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const user = await User.findById(req.session.user._id);
        user.isVideoEnabled = !user.isVideoEnabled;
        await user.save();
        req.session.user = user;
        res.json({ success: true, isVideoEnabled: user.isVideoEnabled });
    } catch (error) {
        console.error('Error toggling video:', error);
        res.status(500).json({ success: false, error });
    }
});

router.get('/employer', roleMiddleware('employer'), async (req, res) => {
    try {
        const freelancers = await User.find({ role: 'freelancer' });
        res.render('employer', { freelancers });
    } catch (error) {
        console.error('Error fetching freelancers:', error);
        res.redirect('/');
    }
});
const ActivityLog = require('../models/activityLogModel');

// Log activity function
async function logActivity(user, action) {
    const log = new ActivityLog({ user: user._id, action });
    await log.save();
}

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await user.comparePassword(password)) {
            req.session.user = user;
            await logActivity(user, 'Logged in');
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.redirect('/login');
    }
});

router.get('/logout', async (req, res) => {
    if (req.session.user) {
        await logActivity(req.session.user, 'Logged out');
    }
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
