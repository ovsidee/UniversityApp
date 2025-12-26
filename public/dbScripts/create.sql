-- Disable foreign keys temporarily to allow dropping tables safely
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Student;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

CREATE TABLE Student (
    ID          INTEGER PRIMARY KEY AUTOINCREMENT,
    First_Name  TEXT        NOT NULL,
    Last_Name   TEXT        NOT NULL,
    Email       TEXT UNIQUE NOT NULL,
    PhoneNumber TEXT
);

CREATE TABLE Course
(
    ID          INTEGER PRIMARY KEY AUTOINCREMENT,
    Name        TEXT    NOT NULL,
    Description TEXT,
    Credits     INTEGER NOT NULL
);

CREATE TABLE Enrollment
(
    student_ID      INTEGER,
    course_ID       INTEGER,
    grade           real,
    enrollment_date TEXT,
    PRIMARY KEY (student_ID, course_ID),
    FOREIGN KEY (student_ID) REFERENCES Student (ID) ON DELETE CASCADE,
    FOREIGN KEY (course_ID) REFERENCES Course (ID) ON DELETE CASCADE
);