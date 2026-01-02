INSERT INTO Student (First_Name, Last_Name, Email, PhoneNumber)
VALUES ('Vitalii', 'Korytnyi', 's31719@pjwstk.edu.pl', '555-444-333'),
       ('Piotr', 'Gago', 'pg@pjwstk.edu.pl', '222-111-333'),
       ('Piotr', 'Grel', 'pgrel@pjwstk.edu.pl', '672-671-677'),
       ('Arseniy', 'Chuganin', 'arseniy.chuganin@pjwstk.edu.pl', '500-111-222'),
       ('Viktoriya', 'Kharchenko', 'v.kharchenko@pjwstk.edu.pl', '500-111-223'),
       ('Ivan', 'Semenets', 'ivan.sements@pjwstk.edu.pl', '500-111-224'),
       ('Viacheslav', 'Larin', 'viacheslav.larin@pjwstk.edu.pl', '500-111-225'),
       ('Pawel', 'Tsydzik', 'pawel.tsydzik@pjwstk.edu.pl', '500-111-226'),
       ('Artem', 'Gatsuta', 'artem.gatsuta@pjwstk.edu.pl', '500-111-227'),
       ('Maryna', 'Korytna', 'maryna.korytna@pjwstk.edu.pl', '500-111-228');

INSERT INTO Course (Name, Credits)
VALUES
    ('AM', 5),
    ('PPJ', 6),
    ('TAK', 4),
    ('WDZ', 3),
    ('WSI', 5),
    ('HKJ', 3),
    ('ANG', 3),
    ('BHP', 0),
    ('ALG', 5),
    ('MAD', 5),
    ('RBD', 5),
    ('GUI', 4),
    ('PJC', 4),
    ('SOP', 4),
    ('ANG', 3),
    ('ASD', 5),
    ('SAD', 5),
    ('SBD', 5),
    ('SYC', 4),
    ('UTP', 4),
    ('SKJ', 5),
    ('ANG', 3),
    ('NAI', 6),
    ('PPY', 4),
    ('WF', 0),
    ('PRI', 6),
    ('PPB', 3),
    ('MUL', 6);

INSERT INTO Enrollment (student_ID, course_ID, grade, enrollment_date)
VALUES
-- Vitalii (1)
(1, 2, '5', '2026-09-01'),
(1, 11, '4.5', '2026-09-01'),
(1, 16, '4.0', '2026-09-02'),
(1, 10, '5', '2026-09-03'),
(1, 9, '4.5', '2026-09-04'),
(1, 21, '5', '2026-09-05'),

-- Piotr Gago (2)
(2, 2, '4.0', '2026-09-01'),
(2, 12, '4.0', '2026-09-02'),
(2, 14, '3.5', '2026-09-03'),
(2, 16, '4.0', '2026-09-04'),

-- Piotr Grel (3)
(3, 3, '2.0', '2026-09-03'),
(3, 13, '3.0', '2026-09-04'),
(3, 20, '3.5', '2026-09-05'),

-- Arseniy Chuganin (4)
(4, 2, '4.5', '2026-09-01'),
(4, 11, '5.0', '2026-09-02'),
(4, 16, '5.0', '2026-09-03'),
(4, 21, '4.5', '2026-09-04'),
(4, 9, '4.0', '2026-09-05'),

-- Viktoriya Kharchenko (5)
(5, 2, '4.0', '2026-09-01'),
(5, 12, '4.5', '2026-09-02'),
(5, 5, '4.5', '2026-09-03'),
(5, 7, '5.0', '2026-09-04'),

-- Ivan Sements (6)
(6, 1, '3.5', '2026-09-01'),
(6, 11, '4.0', '2026-09-02'),
(6, 16, '5.0', '2026-09-03'),
(6, 14, '4.0', '2026-09-04'),

-- Viacheslav Larin (7)
(7, 3, '4.0', '2026-09-01'),
(7, 7, '4.5', '2026-09-02'),
(7, 8, '5.0', '2026-09-03'),
(7, 10, '4.5', '2026-09-04'),

-- Pawel Tsydzik (8)
(8, 2, '5.0', '2026-09-01'),
(8, 12, '4.5', '2026-09-02'),
(8, 20, '4.0', '2026-09-03'),

-- Artem Gatsuta (9)
(9, 16, '3.0', '2026-09-01'),
(9, 2, '3.5', '2026-09-02'),
(9, 21, '4.0', '2026-09-03'),

-- Maryna Korytna (10)
(10, 11, '4.5', '2026-09-01'),
(10, 16, '5.0', '2026-09-02'),
(10, 26, '4.5', '2026-09-03'),
(10, 23, '5.0', '2026-09-04');

INSERT INTO Role (Name)
VALUES
('admin'),
('student'),
('guest');

INSERT INTO User (Username, Password, Role_ID, Student_ID)
VALUES
('admin', '$2a$12$z12jpWDJ6XwXfPglYHWeRuuJWgSYDRep73TgOP1BhntCya2Oip9ci', 1, NULL), -- pass is 'Admin123!'
('student', '$2a$12$aHwOMeufQtjmBw1j4AV5ZeotOgo406fPfmypal8TYsOTOpq.6Z3u6', 2, NULL), -- pass is 'Student123!'
('guest', '$2a$12$zD/hkcEQoziO0rBV5ABrCu40UfR6B2CuXdJjj.yCs5YVWtC8yiyLq', 3, NULL); -- pass is 'Guest123!'
