const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { check, validationResult } = require('express-validator');

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', { errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const user = new User({ username, password });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.redirect('/register');
    }
});

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
    res.redirect('/login');
});

// Route to toggle video status
router.post('/toggle-video', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const user = await User.findById(req.session.user._id);
        user.isVideoEnabled = !user.isVideoEnabled;
        await user.save();
        req.session.user = user; // Update session
        res.json({ success: true, isVideoEnabled: user.isVideoEnabled });
    } catch (error) {
        console.error('Error toggling video:', error);
        res.status(500).json({ success: false, error });
    }
});

router.get('/employer', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const freelancers = await User.find({});
        res.render('employer', { freelancers });
    } catch (error) {
        console.error('Error fetching freelancers:', error);
        res.redirect('/');
    }
});

module.exports = router;
