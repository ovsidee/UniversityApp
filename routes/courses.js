const express = require('express');
const router = express.Router();
const db = require('../db');

// --- PERMISSIONS ---
function requireLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

function requireStudentOrAdmin(req, res, next) {
    if (req.session.roleName === 'guest') {
        return res.status(403).render('403', { message: "Guests cannot view courses." });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session.roleName !== 'admin') {
        return res.status(403).render('403', { message: "Admin access required." });
    }
    next();
}

// 1. List Courses (Student + Admin)
router.get('/', requireLogin, requireStudentOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM Course", [], (err, row) => {
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all("SELECT * FROM Course ORDER BY ID LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
            res.render('courses/list', { courses: rows, currentPage: page, totalPages });
        });
    })
});

// 2. Add Course (Admin Only)
router.get('/add', requireLogin, requireAdmin, (req, res) => {
    res.render('courses/form', { course: {}, error: null, mode: 'Add' });
});

// [UPDATED] Removed 'description' from logic
router.post('/add', requireLogin, requireAdmin, (req, res) => {
    const { name, credits } = req.body;
    db.run("INSERT INTO Course (Name, Credits) VALUES (?, ?)",
        [name, credits], (err) => {
            if(err) return res.render('courses/form', { course:req.body, error: "Error", mode:'Add'});
            res.redirect('/courses');
        });
});

// 3. View Details (Student + Admin)
router.get('/view/:id', requireLogin, requireStudentOrAdmin, (req, res) => {
    const id = req.params.id;
    const sqlCourse = "SELECT * FROM Course WHERE ID = ?";
    const sqlStudents = `
        SELECT Student.ID, Student.First_Name, Student.Last_Name, Enrollment.grade
        FROM Enrollment
                 JOIN Student ON Enrollment.student_ID = Student.ID
        WHERE Enrollment.course_ID = ?`;

    db.get(sqlCourse, [id], (err, course) => {
        if (!course) return res.status(404).render('404');
        db.all(sqlStudents, [id], (err, students) => {
            res.render('courses/view', { course, students });
        });
    });
});

// 4. Edit/Delete (Admin Only)
router.get('/edit/:id', requireLogin, requireAdmin, (req, res) => {
    db.get("SELECT * FROM Course WHERE ID = ?", [req.params.id], (err, row) => {
        if(!row) return res.redirect('/courses');
        res.render('courses/form', { course: row, error: null, mode: 'Edit' });
    });
});

// [UPDATED] Removed 'description' from logic
router.post('/edit/:id', requireLogin, requireAdmin, (req, res) => {
    const { name, credits } = req.body;
    db.run("UPDATE Course SET Name = ?, Credits = ? WHERE ID = ?",
        [name, credits, req.params.id], () => res.redirect('/courses'));
});

router.post('/delete/:id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Course WHERE ID = ?", [req.params.id], () => res.redirect('/courses'));
});

// 5. ENROLLMENT ROUTES (Admin Only)

router.get('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const courseId = req.params.id;
    db.get("SELECT * FROM Course WHERE ID = ?", [courseId], (err, course) => {
        if (!course) return res.status(404).render('404');

        db.all("SELECT * FROM Student ORDER BY Last_Name", [], (err, students) => {
            res.render('courses/enroll', { course, students, error: null });
        });
    });
});

router.post('/:id/enroll', requireLogin, requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const { student_id, grade, enrollment_date } = req.body;

    const sqlInsert = "INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)";

    db.run(sqlInsert, [student_id, courseId, grade, enrollment_date], (err) => {
        if (err) {
            const sqlCourse = "SELECT * FROM Course WHERE ID = ?";
            const sqlStudents = "SELECT * FROM Student ORDER BY Last_Name";

            db.get(sqlCourse, [courseId], (err2, course) => {
                db.all(sqlStudents, [], (err3, students) => {
                    return res.render('courses/enroll', {
                        course: course,
                        students: students,
                        error: "error_enroll_exists"
                    });
                });
            });
            return;
        }
        res.redirect(`/courses/view/${courseId}`);
    });
});

router.post('/:id/remove/:student_id', requireLogin, requireAdmin, (req, res) => {
    db.run("DELETE FROM Enrollment WHERE course_ID = ? AND student_ID = ?",
        [req.params.id, req.params.student_id], () => res.redirect(`/courses/view/${req.params.id}`));
});

router.post('/:id/grade/:student_id', requireLogin, requireAdmin, (req, res) => {
    db.run("UPDATE Enrollment SET grade = ? WHERE course_ID = ? AND student_ID = ?",
        [req.body.grade, req.params.id, req.params.student_id], () => res.redirect(`/courses/view/${req.params.id}`));
});

module.exports = router;