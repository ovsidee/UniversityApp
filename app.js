const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 1. Session Config
app.use(session({
    secret: 'TIN_PROJECT_SECRET',
    resave: false,
    saveUninitialized: false
}));

// 2. Load Locales
const languages = {
    en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf8')),
    pl: JSON.parse(fs.readFileSync('./locales/pl.json', 'utf8'))
};

// 3. Global Middleware (Auth + i18n)
app.use((req, res, next) => {
    // A. Authentication Globals
    res.locals.user = req.session.username;
    res.locals.role = req.session.roleName || 'guest'; // 'admin', 'student', 'guest'
    res.locals.userId = req.session.userId;
    res.locals.studentId = req.session.studentId;

    // B. i18n Logic
    let lang = req.query.lang || req.cookies.lang || 'en';
    if (req.query.lang) res.cookie('lang', lang);

    res.locals.lang = lang;
    res.locals.__ = (key) => {
        return languages[lang][key] || key; // Fallback to key if missing
    };

    res.locals.active = req.path.split('/')[1];
    next();
});

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');

// Routes
app.get('/', (req, res) => { res.render('index'); });
app.use('/', authRoutes);
app.use('/students', studentRoutes);
app.use('/courses', courseRoutes);

// 404
app.use((req, res) => { res.status(404).render('404'); });

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});