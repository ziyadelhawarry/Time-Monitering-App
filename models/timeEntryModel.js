const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    projectName: String,
    startTime: Date,
    endTime: Date,
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
