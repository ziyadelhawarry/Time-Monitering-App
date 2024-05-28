const express = require('express');
const multer = require('multer');
const { saveVideo, toggleVideo } = require('../controllers/videoController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/save-video', upload.single('video'), saveVideo);
router.post('/toggle-video', toggleVideo);

module.exports = router;
