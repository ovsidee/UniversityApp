const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs'); // Needed to read json files
const db = require('./db');

const app = express();

// 1. Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 2. Session Config
app.use(session({
    secret: 'TIN_PROJECT_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

// 3. Import Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);

// 5. Localization Endpoint (NEW)
// The frontend calls this to get the dictionary (e.g., /api/locales/en)
app.get('/api/locales/:lang', (req, res) => {
    const lang = req.params.lang;
    const allowed = ['en', 'pl'];
    if (!allowed.includes(lang)) return res.status(404).json({ error: 'Language not found' });

    const filePath = path.join(__dirname, 'locales', `${lang}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading locale file' });
        res.header('Content-Type', 'application/json');
        res.send(data);
    });
});

// 6. SPA Catch-All
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`SPA Server started on http://localhost:${PORT}`);
});