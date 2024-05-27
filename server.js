const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const WebSocket = require('ws');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const connectDB = require('./models/db');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // To handle JSON requests

// Session middleware configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/timeTrackingTool' }),
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

app.use('/', userRoutes);
app.use('/', reportRoutes);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Integrate WebSocket with time tracking routes
const timeRoutes = require('./routes/timeRoutes')(wss);
app.use('/time', timeRoutes);

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        // Handle signaling messages for WebRTC here
        if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
