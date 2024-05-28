const mongoose = require('mongoose');
const TimeEntry = require('../models/timeEntryModel');

const startTracking = async (req, res) => {
  try {
    const { projectName } = req.body;
    const timeEntry = new TimeEntry({
      projectName,
      startTime: new Date(),
      userId: mongoose.Types.ObjectId("60c72b2f5f1b2c6d88f8f8f8"), // Replace with a valid user ObjectId
      description: 'Default description' // Provide a default description
    });
    await timeEntry.save();
    res.status(200).json({ success: true, timeEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const stopTracking = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({ userId: mongoose.Types.ObjectId("60c72b2f5f1b2c6d88f8f8f8"), endTime: null }); // Replace with a valid user ObjectId
    if (!timeEntry) {
      return res.status(400).json({ success: false, error: 'No active time entry found' });
    }
    timeEntry.endTime = new Date();
    await timeEntry.save();
    res.status(200).json({ success: true, timeEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { startTracking, stopTracking };
