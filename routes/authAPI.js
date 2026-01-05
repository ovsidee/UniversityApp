const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.get('/me', (req, res) => {
    if (req.session.userId) {
        return res.json({
            isAuthenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.roleName,
                studentId: req.session.studentId
            }
        });
    }
    return res.status(401).json({ isAuthenticated: false });
});

router.post('/register', (req, res) => {
    const { username, password, first_name, last_name, email, phone } = req.body;

    if (!username || !password || !email || !first_name || !last_name) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < 6) return res.status(400).json({ error: "password_hint" }); // Using key for error

    const phoneRegex = /^[0-9\-\+ ]+$/;
    if (phone && !phoneRegex.test(phone)) return res.status(400).json({ error: "error_invalid_phone" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const roleId = 2;

    db.get("SELECT ID FROM User WHERE Username = ?", [username], (err, existingUser) => {
        if (existingUser) return res.status(400).json({ error: "Username taken" });

        db.get("SELECT ID FROM Student WHERE Email = ?", [email], (err, existingStudent) => {
            if (existingStudent) {
                createUser(username, hashedPassword, roleId, existingStudent.ID, res);
            } else {
                const sqlCreateStudent = "INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber) VALUES (?, ?, ?, ?)";
                db.run(sqlCreateStudent, [first_name, last_name, email, phone], function(err) {
                    if (err) return res.status(400).json({ error: "error_email_duplicate" });
                    createUser(username, hashedPassword, roleId, this.lastID, res);
                });
            }
        });
    });
});

function createUser(username, password, roleId, studentId, res) {
    const sql = "INSERT INTO User (Username, Password, Role_ID, Student_ID) VALUES (?, ?, ?, ?)";
    db.run(sql, [username, password, roleId, studentId], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(201).json({ message: "Registration successful" });
    });
}

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT User.*, Role.Name as RoleName FROM User LEFT JOIN Role ON User.Role_ID = Role.ID WHERE Username = ?`;

    db.get(sql, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.Password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.userId = user.ID;
        req.session.username = user.Username;
        req.session.roleName = user.RoleName;
        req.session.studentId = user.Student_ID;

        res.json({
            message: "Logged in",
            user: { id: user.ID, username: user.Username, role: user.RoleName, studentId: user.Student_ID }
        });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ message: "Logged out" }));
});

module.exports = router;