const express = require('express');
const router = express.Router();
const { startTracking, stopTracking } = require('../controllers/timeController');

// Define the start and stop tracking routes
router.post('/dev/start', startTracking);
router.post('/dev/stop', stopTracking);

module.exports = router;
