const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

// middleware to protect routes
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// 1 get all students (GET) (Base path: /students)
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Items per page
    //offset just for skipping the X number of items (depends on the page)
    const offset = (page - 1) * limit;

    // Count total students first
    db.get("SELECT COUNT(*) as count FROM Student", [], (err, row) => {
        if (err) return console.error(err);

        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        // Fetch paginated data
        const sql = "SELECT * FROM Student ORDER BY ID LIMIT ? OFFSET ?";
        db.all(sql, [limit, offset], (err, rows) => {
            if (err) return console.error(err.message);
            res.render('students/list', {
                students: rows,
                currentPage: page,
                totalPages: totalPages
            });
        });
    });
});

// 2 add Student Form
router.get('/add', requireLogin, (req, res) => {
    res.render('students/form', { student: {}, error: null, mode: 'Add' });
});

// 3. Create Student (POST)
router.post('/add', requireLogin, (req, res) => {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email) {
        return res.render('students/form', {
            student: req.body,
            error: "First Name, Last Name, and Email are required.",
            mode: 'Add'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return console.error("Invalid Email: " + email);

    const sql = "INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber) VALUES (?, ?, ?, ?)";
    db.run(sql, [first_name, last_name, email, phone], (err) => {
        if (err) {
            console.error(err);
            return res.render('students/form', {
                student: req.body,
                error: "Error adding student (Email might be duplicate).",
                mode: 'Add'
            });
        }
        res.redirect('/students');
    });
});

// 4. get student Details
router.get('/view/:id', (req, res) => {
    const id = req.params.id;
    const sqlStudent = "SELECT * FROM Student WHERE ID = ?";
    const sqlEnrollments = `
        SELECT Course.ID as course_ID, Course.Name, Course.Credits, Enrollment.grade, Enrollment.enrollment_date
        FROM Enrollment
        JOIN Course ON Enrollment.course_ID = Course.ID
        WHERE Enrollment.student_ID = ?`;

    db.get(sqlStudent, [id], (err, student) => {
        if (err || !student) {
            console.error(err ? err.message : 'Student ID not found');
            return res.status(404).render('404');
        }

        db.all(sqlEnrollments, [id], (err, enrollments) => {
            if (err) return console.error(err);
            res.render('students/view', { student, enrollments });
        });
    });
});

// 5. edit student form
router.get('/edit/:id', requireLogin, (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Student WHERE ID = ?";
    db.get(sql, [id], (err, row) => {
        if (err || !row) return res.redirect('/students');
        res.render('students/form', { student: row, error: null, mode: 'Edit' });
    });
});

// 6. update Student (POST)
router.post('/edit/:id', requireLogin, (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, email, phone } = req.body;

    const sql = "UPDATE Student SET First_Name = ?, Last_Name = ?, Email = ?, PhoneNumber = ? WHERE ID = ?";
    db.run(sql, [first_name, last_name, email, phone, id], (err) => {
        if (err) return console.error(err);
        res.redirect('/students');
    });
});

// 7. Delete Student
router.post('/delete/:id', requireLogin, (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Student WHERE ID = ?";
    db.run(sql, [id], (err) => {
        if (err) return console.error(err);
        res.redirect('/students');
    });
});

/// 8. Enroll Student
router.get('/:id/enroll', requireLogin, (req, res) => {
    const id = req.params.id;
    const sqlStudent = "SELECT * FROM Student WHERE ID = ?";
    const sqlCourses = "SELECT * FROM Course ORDER BY Name";

    db.get(sqlStudent, [id], (err, student) => {
        if (err || !student) return res.redirect('/students');

        // We need the list of courses so the user can pick one
        db.all(sqlCourses, [], (err, courses) => {
            if (err) return console.error(err);
            res.render('students/enroll', { student, courses, error: null });
        });
    });
});

//  9. Process Enrollment
router.post('/:id/enroll', requireLogin, (req, res) => {
    const studentId = req.params.id;
    const { course_id, grade, enrollment_date } = req.body;

    // Validation: Check if course is selected
    if (!course_id) return res.redirect(`/students/${studentId}/enroll`);
    if (grade && (grade < 2 || grade > 5)) console.error("Grade must be between 2 and 5. Provided: " + grade);
    
    const date = enrollment_date || new Date().toISOString().split('T')[0];
    const sqlInsert = `INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)`;

    db.run(sqlInsert, [studentId, course_id, grade, date], (err) => {
        if (err) {
            console.error(err);
            const sqlStudent = "SELECT * FROM Student WHERE ID = ?";
            const sqlCourses = "SELECT * FROM Course ORDER BY Name";

            db.get(sqlStudent, [studentId], (err2, student) => {
                db.all(sqlCourses, [], (err3, courses) => {
                    // Now we render the page with the ERROR message AND the DATA
                    return res.render('students/enroll', {
                        student: student,
                        courses: courses,
                        error: "Error: Student likely already enrolled in this course."
                    });
                });
            });
            // --- FIX ENDS HERE ---
            return;
        }

        // Success: Redirect to student details
        res.redirect(`/students/view/${studentId}`);
    });
});

// 10. Unenroll Student
router.post('/:id/enroll/:course_id', requireLogin, (req, res) => {
    const studentId = req.params.id;
    const courseId = req.params.course_id;

    const sql = "DELETE FROM Enrollment WHERE student_ID = ? AND course_ID = ?";

    db.run(sql, [studentId, courseId], (err) => {
        if (err) {
            console.error(err);
        }
        // Redirect back to the student details page regardless of success/error
        res.redirect(`/students/view/${studentId}`);
    });
});

module.exports = router;