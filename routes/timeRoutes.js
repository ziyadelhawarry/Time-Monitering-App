const express = require('express');
const router = express.Router();
const { startTracking, stopTracking } = require('../controllers/timeController');
const auth = require('../middleware/authMiddleware');

// Existing routes
router.post('/start', auth, startTracking);
router.post('/stop', auth, stopTracking);

// Development routes without authentication
router.post('/dev/start', startTracking);
router.post('/dev/stop', stopTracking);

module.exports = router;
