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

INSERT INTO Course (Name, Description, Credits)
VALUES ('AM', 'Analiza matematyczna', 5),
       ('PPJ', 'Podstawy programowania w języku Java', 6),
       ('TAK', 'Techniki i architektura komputerów', 4),
       ('WDZ', 'Wstęp do zarządzania', 3),
       ('WSI', 'Wprowadzenie do systemów informacyjnych', 5),
       ('HKJ', 'Historia i Kultura Japonii', 3),
       ('ANG', 'Język angielski', 3),
       ('BHP', 'Szkolenie z zakresu BHP', 0),
       ('ALG', 'Algebra liniowa i geometria', 5),
       ('MAD', 'Matematyka dyskretna', 5),
       ('RBD', 'Relacyjne bazy danych', 5),
       ('GUI', 'Programowanie obiektowe i GUI', 4),
       ('PJC', 'Programowanie w językach C i C++', 4),
       ('SOP', 'Systemy operacyjne', 4),
       ('ANG', 'Język angielski', 3),
       ('ASD', 'Algorytmy i struktury danych', 5),
       ('SAD', 'Statystyczna analiza danych', 5),
       ('SBD', 'Systemy baz danych', 5),
       ('SYC', 'Systemy cyfrowe i podstawy elektroniki', 4),
       ('UTP', 'Uniwersalne techniki programowania', 4),
       ('SKJ', 'Sieci komputerowe i programowania sieciowe w języku Java', 5),
       ('ANG', 'Język angielski', 3),
       ('NAI', 'Narzedzia sztucznej inteligencji', 6),
       ('PPY', 'Podstawy Programowania w Języku Python', 4),
       ('WF', 'Wychowanie fizyczne', 0),
       ('PRI', 'Projektowanie systemów informacyjnych', 6),
       ('PPB', 'Prawne podstawy działalności gospodarczej', 3),
       ('MUL', 'Multimedia', 6);

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