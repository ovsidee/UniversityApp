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

router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM Course", [], (err, row) => {
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all("SELECT * FROM Course ORDER BY ID LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows, meta: { currentPage: page, totalPages: totalPages } });
        });
    });
});

router.get('/:id', requireLogin, (req, res) => {
    const id = req.params.id;
    const sqlCourse = "SELECT * FROM Course WHERE ID = ?";
    const sqlStudents = `SELECT Student.ID, Student.First_Name, Student.Last_Name, Enrollment.grade, Student.Email FROM Enrollment JOIN Student ON Enrollment.student_ID = Student.ID WHERE Enrollment.course_ID = ?`;

    db.get(sqlCourse, [id], (err, course) => {
        if (!course) return res.status(404).json({ error: "404_msg" });
        db.all(sqlStudents, [id], (err, students) => {
            res.json({ course, students });
        });
    });
});

router.post('/', requireLogin, requireAdmin, (req, res) => {
    const { name, credits } = req.body;
    db.run("INSERT INTO Course (Name, Credits) VALUES (?, ?)", [name, credits], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "error_course_exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: "Course created" });
    });
});

router.put('/:id', requireLogin, requireAdmin, (req, res) => {
    const { name, credits } = req.body;
    db.run("UPDATE Course SET Name = ?, Credits = ? WHERE ID = ?", [name, credits, req.params.id], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "error_course_exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Course updated" });
    });
});
router.delete('/:id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Course WHERE ID = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Course deleted" });
    });
});

router.post('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const { student_id, grade, enrollment_date } = req.body;
    db.run("INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)",
        [student_id, req.params.id, grade, enrollment_date], (err) => {
            if (err) return res.status(400).json({ error: "error_enroll_exists" });
            res.json({ message: "Student enrolled" });
        });
});

router.put('/:id/grade/:student_id', requireLogin, requireAdmin, (req, res) => {
    const grade = parseFloat(req.body.grade);

    if (isNaN(grade) || grade < 2 || grade > 5)
        return res.status(400).json({ error: "Grade must be between 2 and 5" });

    db.run("UPDATE Enrollment SET grade = ? WHERE course_ID = ? AND student_ID = ?",
        [grade, req.params.id, req.params.student_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Grade updated" });
        });
});

router.delete('/:id/remove/:student_id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Enrollment WHERE course_ID = ? AND student_ID = ?",
        [req.params.id, req.params.student_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Student removed from course" });
        });
});

module.exports = router;