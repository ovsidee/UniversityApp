const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');

// 2. Global Variables (Active Menu)
app.use((req, res, next) => {
    res.locals.active = req.path.split('/')[1];
    next();
});

// ---------ROUTES---------

// home page (/)
app.get('/', (req, res) => {
    res.render('index');
});

// if a request starts with ..., send it to ...
app.use('/students', studentRoutes);
app.use('/courses', courseRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});