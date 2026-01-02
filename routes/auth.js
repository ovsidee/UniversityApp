const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});

router.post('/register', (req, res) => {
    // 1. Get all data from form
    const { username, password, first_name, last_name, email, phone } = req.body;

    // 2. Validations
    if (!username || !password || !email || !first_name || !last_name) {
        return res.render('auth/register', { error: "All fields are required." });
    }

    if (password.length < 6) return res.render('auth/register', { error: "Password too short (min 6)." });
    if (!/[A-Z]/.test(password)) return res.render('auth/register', { error: "Need 1 capital letter." });
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return res.render('auth/register', { error: "Need 1 special char." });

    const phoneRegex = /^[0-9\-\+ ]+$/;
    if (phone && !phoneRegex.test(phone)) return res.render('auth/register', { error: "error_invalid_phone" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const roleId = 2; // Role ID 2 = Student

    // 3. Check if Username is taken
    db.get("SELECT ID FROM User WHERE Username = ?", [username], (err, existingUser) => {
        if (existingUser) {
            return res.render('auth/register', { error: "Username already taken." });
        }

        // 4. Check if Student Email exists
        db.get("SELECT ID FROM Student WHERE Email = ?", [email], (err, existingStudent) => {
            if (err) return console.error(err);

            if (existingStudent) {
                // A. Student exists: Link new User to existing Student
                createUser(username, hashedPassword, roleId, existingStudent.ID, res);
            } else {
                // B. Student does NOT exist: Create Student FIRST
                const sqlCreateStudent = "INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber) VALUES (?, ?, ?, ?)";

                db.run(sqlCreateStudent, [first_name, last_name, email, phone], function(err) {
                    if (err) {
                        console.error("Error creating student:", err.message);
                        return res.render('auth/register', { error: "Email likely already in use by another student." });
                    }

                    // 'this.lastID' is the ID of the newly created Student
                    const newStudentId = this.lastID;
                    createUser(username, hashedPassword, roleId, newStudentId, res);
                });
            }
        });
    });
});

// Helper function to insert User
function createUser(username, password, roleId, studentId, res) {
    const sql = "INSERT INTO User (Username, Password, Role_ID, Student_ID) VALUES (?, ?, ?, ?)";

    db.run(sql, [username, password, roleId, studentId], (err) => {
        if (err) {
            console.error("Error creating user:", err.message);
            return res.render('auth/register', { error: "Error creating account." });
        }
        res.redirect('/login');
    });
}

router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `
        SELECT User.*, Role.Name as RoleName
        FROM User
                 LEFT JOIN Role ON User.Role_ID = Role.ID
        WHERE Username = ?`;

    db.get(sql, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.Password)) {
            return res.render('auth/login', { error: "Invalid credentials" });
        }

        req.session.userId = user.ID;
        req.session.username = user.Username;
        req.session.roleName = user.RoleName;
        req.session.studentId = user.Student_ID;

        res.redirect('/');
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

module.exports = router;