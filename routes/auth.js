const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// register Form
router.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});

// register Logic
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.render('auth/register', { error: "All fields required" });

    if (password.length < 6)
        return res.render('auth/register', { error: "Password must be at least 6 characters long." });

    // Check for at least one capital letter
    if (!/[A-Z]/.test(password))
        return res.render('auth/register', { error: "Password must contain at least one capital letter." });

    // Check for at least one special character(regex looks for any character that is NOT a letter or a number)

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        return res.render('auth/register', { error: "Password must contain at least one special character (!@#$%)." });


    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO User (Username, Password) VALUES (?, ?)";

    db.run(sql, [username, hashedPassword], function(err) {
        if (err) {
            console.error(err);
            return res.render('auth/register', { error: "Username already exists" });
        }
        res.redirect('/login');
    });
});

// login Form
router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

// login Logic
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM User WHERE Username = ?";

    db.get(sql, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.Password)) {
            return res.render('auth/login', { error: "Invalid username or password" });
        }
        // Set session
        req.session.userId = user.ID;
        req.session.username = user.Username;
        res.redirect('/');
    });
});

// logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;