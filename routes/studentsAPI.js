const express = require('express');
const router = express.Router();
const db = require('../db');

function requireLogin(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: "access_denied" });
    next();
}

function requireAdmin(req, res, next) {
    if (req.session.roleName !== 'admin') return res.status(403).json({ error: "access_denied" });
    next();
}

router.get('/', requireLogin, (req, res) => {
    // if user is not admin, they can only see their own profile
    if (req.session.roleName !== 'admin') {
        const studentId = req.session.studentId;
        if (!studentId) return res.json([]); // if user has no student profile linked, return empty.

        // return single student
        return db.all("SELECT * FROM Student WHERE ID = ?", [studentId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows, meta: { currentPage: 1, totalPages: 1 } });
        });
    }

    if (req.query.all) {
        return db.all("SELECT * FROM Student ORDER BY First_Name ASC", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows); // Returns a plain array [ ... ]
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM Student", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all("SELECT * FROM Student ORDER BY ID ASC LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows, meta: { currentPage: page, totalPages: totalPages } });
        });
    });
});

router.get('/:id', requireLogin, (req, res) => {
    const id = req.params.id;
    if (req.session.roleName !== 'admin' && req.session.studentId != id) {
        return res.status(403).json({ error: "access_denied_msg" });
    }

    const sqlStudent = "SELECT * FROM Student WHERE ID = ?";
    const sqlEnrollments = `
        SELECT Course.ID as course_ID, Course.Name, Course.Credits, Enrollment.grade, Enrollment.enrollment_date
        FROM Enrollment
                 JOIN Course ON Enrollment.course_ID = Course.ID
        WHERE Enrollment.student_ID = ?`;

    db.get(sqlStudent, [id], (err, student) => {
        if (!student) return res.status(404).json({ error: "404_msg" });
        db.all(sqlEnrollments, [id], (err, enrollments) => {
            res.json({ student, enrollments });
        });
    });
});

router.post('/', requireLogin, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return res.status(400).json({ error: "error_invalid_email" });

    const phoneRegex = /^[0-9\-\+ ]+$/;
    if (phone && !phoneRegex.test(phone)) return res.status(400).json({ error: "error_invalid_phone" });

    const sql = "INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber) VALUES (?, ?, ?, ?)";
    db.run(sql, [first_name, last_name, email, phone], function(err) {
        if (err) return res.status(400).json({ error: "error_email_duplicate" });
        res.status(201).json({ id: this.lastID, message: "Student created" });
    });
});

router.put('/:id', requireLogin, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    const phoneRegex = /^[0-9\-\+ ]+$/;
    if (phone && !phoneRegex.test(phone)) return res.status(400).json({ error: "error_invalid_phone" });

    const sql = "UPDATE Student SET First_Name = ?, Last_Name = ?, Email = ?, PhoneNumber = ? WHERE ID = ?";
    db.run(sql, [first_name, last_name, email, phone, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Student updated" });
    });
});

router.delete('/:id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Student WHERE ID = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Student deleted" });
    });
});

router.post('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const { course_id, grade, enrollment_date } = req.body;
    const sql = "INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)";
    db.run(sql, [req.params.id, course_id, grade, enrollment_date], (err) => {
        if (err) return res.status(400).json({ error: "error_enroll_exists" });
        res.json({ message: "Enrolled successfully" });
    });
});

router.delete('/:id/enroll/:course_id', requireLogin, requireAdmin, (req, res) => {
    const sql = "DELETE FROM Enrollment WHERE student_ID = ? AND course_ID = ?";
    db.run(sql, [req.params.id, req.params.course_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Enrollment removed" });
    });
});

module.exports = router;