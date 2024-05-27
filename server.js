const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./models/db');
const userRoutes = require('./routes/userRoutes');
const timeRoutes = require('./routes/timeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { ensureAuthenticated } = require('./middleware/authMiddleware');
const { ensureEmployer } = require('./middleware/roleMiddleware');

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/timeTrackingTool' }),
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/users', userRoutes);
app.use('/time', ensureAuthenticated, timeRoutes);
app.use('/report', ensureAuthenticated, reportRoutes);
app.use('/employer', ensureAuthenticated, ensureEmployer, (req, res) => {
    res.render('employer', { freelancers: [] });
});

app.get('/', ensureAuthenticated, (req, res) => {
    res.render('home');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
