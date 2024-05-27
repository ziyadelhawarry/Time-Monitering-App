const Report = require('../models/reportModel'); // Assuming you have a report model

const generateReport = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
};

module.exports = { generateReport };
