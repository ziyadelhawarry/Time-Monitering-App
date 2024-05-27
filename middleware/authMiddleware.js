const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : '';
    console.log('Received Token:', token); // Log the token for debugging
    
    if (!token) {
      throw new Error('Token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); // Log the decoded token for debugging
    
    const user = await User.findOne({ _id: decoded._id });
    console.log('User Found:', user ? 'Yes' : 'No'); // Log whether the user was found
    
    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message); // Log the error
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
