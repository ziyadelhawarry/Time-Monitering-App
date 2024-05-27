const mongoose = require('mongoose');
const TimeEntry = require('../models/timeEntryModel');

const startTracking = async (req, res) => {
  try {
    const { projectName } = req.body;
    const timeEntry = new TimeEntry({
      projectName,
      startTime: new Date(),
      description: 'Development time tracking',
      endTime: null,  // Setting null as the endTime will be updated later
      userId: mongoose.Types.ObjectId(),  // Generate a valid ObjectId for development
    });
    await timeEntry.save();
    res.status(201).json({ success: true, timeEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const stopTracking = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOneAndUpdate(
      { endTime: null },  // Find the time entry where endTime is still null
      { endTime: new Date() },
      { new: true }
    );
    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'No active time entry found' });
    }
    res.status(200).json({ success: true, timeEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { startTracking, stopTracking };
