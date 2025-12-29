const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// 1. Session Config
app.use(session({
    secret: 'TIN', // in a real project, we need to use an env variable
    resave: false,
    saveUninitialized: false
}));

// 2. Middleware to pass User to Views (Global Variable)
app.use((req, res, next) => {
    res.locals.user = req.session.username; // Available in all EJS files
    res.locals.active = req.path.split('/')[1];
    next();
});

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');

// ---------ROUTES---------
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/', authRoutes); // Use Auth Routes
app.use('/students', studentRoutes);
app.use('/courses', courseRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});