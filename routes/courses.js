const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. List All Courses (GET)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM Course ORDER BY ID";
    db.all(sql, [], (err, rows) => {
        if (err) return console.error(err.message);
        res.render('courses/list', { courses: rows });
    });
});

// 2. Add Course Form (GET)
router.get('/add', (req, res) => {
    res.render('courses/form', { course: {}, error: null, mode: 'Add' });
});

// 3. Create Course (POST)
router.post('/add', (req, res) => {
    const { name, description, credits } = req.body;

    // Server-side Validation
    if (!name || !credits) {
        return res.render('courses/form', {
            course: req.body,
            error: "Course Name and Credits are required.",
            mode: 'Add'
        });
    }

    const sql = "INSERT INTO Course (Name, Description, Credits) VALUES (?, ?, ?)";
    db.run(sql, [name, description, credits], (err) => {
        if (err) {
            console.error(err);
            return res.render('courses/form', {
                course: req.body,
                error: "Error adding course.",
                mode: 'Add'
            });
        }
        res.redirect('/courses');
    });
});

// 4. View Course Details + Enrolled Students (GET)
router.get('/view/:id', (req, res) => {
    const id = req.params.id;

    // Query 1: Get Course Details
    const sqlCourse = "SELECT * FROM Course WHERE ID = ?";

    // Query 2: Get Enrolled Students (Relationship)
    // This joins Student and Enrollment to show WHO is in the class
    const sqlEnrolledStudents = `
        SELECT Student.ID, Student.First_Name, Student.Last_Name, Enrollment.grade 
        FROM Enrollment 
        JOIN Student ON Enrollment.student_ID = Student.ID 
        WHERE Enrollment.course_ID = ?`;

    db.get(sqlCourse, [id], (err, course) => {
        if (err || !course) {
            return res.status(404).render('404');
        }

        db.all(sqlEnrolledStudents, [id], (err, students) => {
            if (err) return console.error(err);
            res.render('courses/view', { course, students });
        });
    });
});

// 5. Edit Course Form (GET)
router.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Course WHERE ID = ?";
    db.get(sql, [id], (err, row) => {
        if (err || !row) return res.redirect('/courses');
        res.render('courses/form', { course: row, error: null, mode: 'Edit' });
    });
});

// 6. Update Course (POST)
router.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, credits } = req.body;

    const sql = "UPDATE Course SET Name = ?, Description = ?, Credits = ? WHERE ID = ?";
    db.run(sql, [name, description, credits, id], (err) => {
        if (err) return console.error(err);
        res.redirect('/courses');
    });
});

// 7. Delete Course (POST)
router.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Course WHERE ID = ?";
    db.run(sql, [id], (err) => {
        if (err) return console.error(err);
        res.redirect('/courses');
    });
});

// [NEW] 8. Show Enroll Student Form
router.get('/:id/enroll', (req, res) => {
    const courseId = req.params.id;
    const sqlCourse = "SELECT * FROM Course WHERE ID = ?";
    const sqlStudents = "SELECT * FROM Student ORDER BY Last_Name";

    db.get(sqlCourse, [courseId], (err, course) => {
        if (err || !course) return res.redirect('/courses');

        db.all(sqlStudents, [], (err, students) => {
            if (err) return console.error(err);
            res.render('courses/enroll', { course, students, error: null });
        });
    });
});

// [NEW] 9. Process Enrollment (Add Student to Course)
router.post('/:id/enroll', (req, res) => {
    const courseId = req.params.id;
    const { student_id, grade, enrollment_date } = req.body;

    if (!student_id) {
        return res.redirect(`/courses/${courseId}/enroll`);
    }

    const date = enrollment_date || new Date().toISOString().split('T')[0];
    const sqlInsert = "INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date) VALUES (?, ?, ?, ?)";

    db.run(sqlInsert, [student_id, courseId, grade, date], (err) => {
        if (err) {
            console.error(err);
            // Error handling: Reload page with error message
            const sqlCourse = "SELECT * FROM Course WHERE ID = ?";
            const sqlStudents = "SELECT * FROM Student ORDER BY Last_Name";

            db.get(sqlCourse, [courseId], (err2, course) => {
                db.all(sqlStudents, [], (err3, students) => {
                    return res.render('courses/enroll', {
                        course: course,
                        students: students,
                        error: "Error: Student likely already in this course."
                    });
                });
            });
            return;
        }
        res.redirect(`/courses/view/${courseId}`);
    });
});

// [NEW] 10. Remove Student from Course (Unenroll)
router.post('/:id/remove/:student_id', (req, res) => {
    const courseId = req.params.id;
    const studentId = req.params.student_id;

    const sql = "DELETE FROM Enrollment WHERE course_ID = ? AND student_ID = ?";
    db.run(sql, [courseId, studentId], (err) => {
        if (err) console.error(err);
        res.redirect(`/courses/view/${courseId}`);
    });
});

// 11. Update Student Grade (POST)
router.post('/:id/grade/:student_id', (req, res) => {
    const courseId = req.params.id;
    const studentId = req.params.student_id;
    const { grade } = req.body;

    const sql = "UPDATE Enrollment SET grade = ? WHERE course_ID = ? AND student_ID = ?";

    db.run(sql, [grade, courseId, studentId], (err) => {
        if (err) {
            console.error(err);
        }
        // Redirect back to the course view so the user sees the updated list
        res.redirect(`/courses/view/${courseId}`);
    });
});

module.exports = router;