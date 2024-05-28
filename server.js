const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const userRoutes = require('./routes/userRoutes');
const timeRoutes = require('./routes/timeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const videoRoutes = require('./routes/videoRoutes');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/timeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.set('view engine', 'ejs');

app.use('/api/users', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/videos', videoRoutes);

app.get('/dev/timetracking', (req, res) => {
  res.render('timetracking');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log('Received:', message);

    // Handle the message
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
