const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const auth = require('./middleware/authMiddleware');
const reportRoutes = require('./routes/reportRoutes');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});

app.use(express.static('public'));
app.use('/reports', reportRoutes);
app.use('/time', timeRoutes);
app.use('/users', userRoutes);

// Define routes for register, login, and profile pages
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', auth, (req, res) => {
  res.render('profile', { user: req.user });
});

// Development route for testing time tracking without authentication
app.get('/dev/timetracking', (req, res) => {
  res.render('timetracking');
});

// Route to handle video toggling
app.post('/toggle-video', (req, res) => {
  // Simulate toggling video functionality
  res.json({ success: true, isVideoEnabled: !req.body.isVideoEnabled });
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
  ws.send(JSON.stringify({ type: 'connection', message: 'WebSocket connection established' }));
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
