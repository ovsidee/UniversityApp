PRAGMA
foreign_keys = OFF;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Role;
PRAGMA
foreign_keys = ON;

CREATE TABLE Role
(
    ID   INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT UNIQUE NOT NULL
);

CREATE TABLE Student
(
    ID          INTEGER PRIMARY KEY AUTOINCREMENT,
    First_Name  TEXT        NOT NULL,
    Last_Name   TEXT        NOT NULL,
    Email       TEXT UNIQUE NOT NULL,
    PhoneNumber TEXT
);

CREATE TABLE Course
(
    ID          INTEGER PRIMARY KEY AUTOINCREMENT,
    Name        TEXT  UNIQUE  NOT NULL,
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

CREATE TABLE User
(
    ID         INTEGER PRIMARY KEY AUTOINCREMENT,
    Username   TEXT UNIQUE NOT NULL,
    Password   TEXT        NOT NULL,
    Role_ID    INTEGER,
    Student_ID INTEGER,
    FOREIGN KEY (Student_ID) REFERENCES Student (ID) ON DELETE SET NULL,
    FOREIGN KEY (Role_ID) REFERENCES Role (ID) ON DELETE SET NULL
);