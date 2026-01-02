const express = require('express');
const router = express.Router();
const db = require('../db');

// ... (Permissions middleware remains the same) ...
function requireLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}
function requireStudentOrAdmin(req, res, next) {
    if (req.session.roleName === 'guest') {
        return res.status(403).render('403', { message: "Guests cannot view students." });
    }
    next();
}
function requireAdmin(req, res, next) {
    if (req.session.roleName !== 'admin') {
        return res.status(403).render('403', { message: "Admin access required." });
    }
    next();
}

// 1. List Students
router.get('/', requireLogin, requireStudentOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM Student", [], (err, row) => {
        if (err) return console.error(err);
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all("SELECT * FROM Student ORDER BY ID LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
            if (err) return console.error(err);
            res.render('students/list', {
                students: rows,
                currentPage: page,
                totalPages: totalPages
            });
        });
    });
});

// 2. Add Student (Form)
router.get('/add', requireLogin, requireAdmin, (req, res) => {
    res.render('students/form', { student: {}, error: null, mode: 'Add' });
});

// 2. Create Student (POST) - UPDATED WITH PHONE CHECK
router.post('/add', requireLogin, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone } = req.body;

    // A. Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // B. Phone Regex (Allows digits, spaces, hyphens, and plus sign)
    // This rejects letters like "zxc"
    const phoneRegex = /^[0-9\-\+ ]+$/;

    // Validation 1: Email
    if (!email || !emailRegex.test(email)) {
        return res.render('students/form', {
            student: req.body,
            error: "error_invalid_email",
            mode: 'Add'
        });
    }

    // Validation 2: Phone (Check only if phone is provided)
    if (phone && !phoneRegex.test(phone)) {
        return res.render('students/form', {
            student: req.body,
            error: "error_invalid_phone", // New error key
            mode: 'Add'
        });
    }

    const sql = "INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber) VALUES (?, ?, ?, ?)";
    db.run(sql, [first_name, last_name, email, phone], (err) => {
        if (err) {
            console.error(err);
            return res.render('students/form', {
                student: req.body,
                error: "error_email_duplicate",
                mode: 'Add'
            });
        }
        res.redirect('/students');
    });
});

// 3. View Profile
router.get('/view/:id', requireLogin, requireStudentOrAdmin, (req, res) => {
    const id = req.params.id;
    if (req.session.roleName !== 'admin' && req.session.studentId != id) {
        return res.status(403).render('403', { message: "You can only view your own profile." });
    }

    const sqlEnrollments = `
        SELECT Course.ID as course_ID, Course.Name, Course.Credits, Enrollment.grade, Enrollment.enrollment_date
        FROM Enrollment
                 JOIN Course ON Enrollment.course_ID = Course.ID
        WHERE Enrollment.student_ID = ?`;

    db.get("SELECT * FROM Student WHERE ID = ?", [id], (err, student) => {
        if (!student) return res.status(404).render('404');
        db.all(sqlEnrollments, [id], (err, enrollments) => {
            res.render('students/view', { student, enrollments });
        });
    });
});

// 4. Edit (Form)
router.get('/edit/:id', requireLogin, requireAdmin, (req, res) => {
    db.get("SELECT * FROM Student WHERE ID = ?", [req.params.id], (err, row) => {
        res.render('students/form', { student: row, error: null, mode: 'Edit' });
    });
});

// 4. Edit (POST) - UPDATED WITH PHONE CHECK
router.post('/edit/:id', requireLogin, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone } = req.body;

    // Add validation here too so they can't edit it to be invalid later
    const phoneRegex = /^[0-9\-\+ ]+$/;
    if (phone && !phoneRegex.test(phone)) {
        // We need to re-render the form with the error
        // We construct the student object so the form stays filled
        const studentData = { ID: req.params.id, First_Name: first_name, Last_Name: last_name, Email: email, PhoneNumber: phone };
        return res.render('students/form', {
            student: studentData,
            error: "error_invalid_phone",
            mode: 'Edit'
        });
    }

    db.run("UPDATE Student SET First_Name = ?, Last_Name = ?, Email = ?, PhoneNumber = ? WHERE ID = ?",
        [first_name, last_name, email, phone, req.params.id], () => res.redirect('/students'));
});

// ... (Rest of the file: delete, enroll, etc.) ...
router.post('/delete/:id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Student WHERE ID = ?", [req.params.id], () => res.redirect('/students'));
});
router.get('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const studentId = req.params.id;
    db.get("SELECT * FROM Student WHERE ID = ?", [studentId], (err, student) => {
        if (!student) return res.status(404).render('404');
        db.all("SELECT * FROM Course ORDER BY Name", [], (err, courses) => {
            res.render('students/enroll', { student, courses, error: null });
        });
    });
});
router.post('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const studentId = req.params.id;
    const { course_id, grade, enrollment_date } = req.body;
    const sqlInsert = "INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)";
    db.run(sqlInsert, [studentId, course_id, grade, enrollment_date], (err) => {
        if (err) {
            db.get("SELECT * FROM Student WHERE ID = ?", [studentId], (err2, student) => {
                db.all("SELECT * FROM Course ORDER BY Name", [], (err3, courses) => {
                    res.render('students/enroll', { student, courses, error: "error_enroll_exists" });
                });
            });
            return;
        }
        res.redirect(`/students/view/${studentId}`);
    });
});
router.post('/:id/enroll/:course_id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Enrollment WHERE student_ID = ? AND course_ID = ?",
        [req.params.id, req.params.course_id], () => res.redirect(`/students/view/${req.params.id}`));
});

module.exports = router;