const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  reportData: {
    type: Object,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
