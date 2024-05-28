const fs = require('fs');
const path = require('path');

exports.toggleVideo = (req, res) => {
  const { isVideoEnabled } = req.body;
  res.status(200).json({ success: true, isVideoEnabled });
};

exports.saveVideo = (req, res) => {
  console.log('Received video upload request');
  if (!req.file) {
    console.error('No video file uploaded');
    return res.status(400).json({ success: false, error: 'No video file uploaded' });
  }

  const videoPath = path.join(__dirname, '../uploads/', req.file.originalname);
  console.log('Saving video to:', videoPath);
  fs.writeFile(videoPath, req.file.buffer, err => {
    if (err) {
      console.error('Error writing video file:', err);
      return res.status(500).json({ success: false, error: 'Failed to save video' });
    }
    res.status(200).json({ success: true, message: 'Video saved successfully', videoPath });
  });
};
