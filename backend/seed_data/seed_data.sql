-- YEARS
INSERT INTO years (year_id, year_name) VALUES (1, '1st Year');
INSERT INTO years (year_id, year_name) VALUES (2, '2nd Year');
INSERT INTO years (year_id, year_name) VALUES (3, '3rd Year');

-- SUBJECTS
INSERT INTO subjects (subject_id, subject_name) VALUES (1, 'Engineering Mathematics');
INSERT INTO subjects (subject_id, subject_name) VALUES (2, 'Engineering Physics');
INSERT INTO subjects (subject_id, subject_name) VALUES (3, 'Basic Electrical Engineering');
INSERT INTO subjects (subject_id, subject_name) VALUES (4, 'Programming in C');
INSERT INTO subjects (subject_id, subject_name) VALUES (5, 'Engineering Chemistry');
INSERT INTO subjects (subject_id, subject_name) VALUES (6, 'Data Structures');
INSERT INTO subjects (subject_id, subject_name) VALUES (7, 'Digital Logic Design');
INSERT INTO subjects (subject_id, subject_name) VALUES (8, 'Object Oriented Programming');
INSERT INTO subjects (subject_id, subject_name) VALUES (9, 'Discrete Mathematics');
INSERT INTO subjects (subject_id, subject_name) VALUES (10, 'Electronic Devices and Circuits');
INSERT INTO subjects (subject_id, subject_name) VALUES (11, 'Operating Systems');
INSERT INTO subjects (subject_id, subject_name) VALUES (12, 'Database Management Systems');
INSERT INTO subjects (subject_id, subject_name) VALUES (13, 'Computer Networks');
INSERT INTO subjects (subject_id, subject_name) VALUES (14, 'Software Engineering');
INSERT INTO subjects (subject_id, subject_name) VALUES (15, 'Compiler Design');

-- TEACHERS
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (1, 'David Mwangi', 'david.mwangi@example.com', '+254720123456', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (2, 'Grace Kimani', 'grace.kimani@example.com', '+256755678901', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (3, 'Mohammed Abdi', 'mohammed.abdi@example.com', '+252634567890', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (4, 'Alice Wambua', 'alice.wambua@example.com', '+255712345678', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (5, 'Peter Njoroge', 'peter.njoroge@example.com', '+254723456789', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (6, 'Amina Omar', 'amina.omar@example.com', '+25366123456', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (7, 'Joseph Kassim', 'joseph.kassim@example.com', '+251911234567', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (8, 'Wanjiru Kamau', 'wanjiru.kamau@example.com', '+250782345678', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (9, 'Moses Tewolde', 'moses.tewolde@example.com', '+291712345678', 'Computer Science Engineering');
INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES (10, 'Aisha Said', 'aisha.said@example.com', '+255765432109', 'Computer Science Engineering');

-- STUDENTS
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (1, 'John Makori', 'john.makori@example.com', '+254712345678', 1, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (2, 'Amina Njoroge', 'amina.njoroge@example.com', '+254723456789', 2, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (3, 'Daniel Girma', 'daniel.girma@example.com', '+251911234567', 3, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (4, 'Sara Kibet', 'sara.kibet@example.com', '+256755678901', 1, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (5, 'Moses Kimani', 'moses.kimani@example.com', '+255712345678', 2, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (6, 'Zainab Said', 'zainab.said@example.com', '+255765432109', 3, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (7, 'Patrick Kamau', 'patrick.kamau@example.com', '+254700123456', 1, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (8, 'Aisha Mohammed', 'aisha.mohammed@example.com', '+254711223344', 2, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (9, 'Abdi Nur', 'abdi.nur@example.com', '+252612345678', 3, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (10, 'Elsa Makamba', 'elsa.makamba@example.com', '+250782345678', 1, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (11, 'Omar Kassim', 'omar.kassim@example.com', '+25366123456', 2, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (12, 'Grace Wambui', 'grace.wambui@example.com', '+254733987654', 3, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (13, 'Yohannes Tesfaye', 'yohannes.tesfaye@example.com', '+251922345678', 1, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (14, 'Halima Abdi', 'halima.abdi@example.com', '+252634567890', 2, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (15, 'Robert Oduor', 'robert.oduor@example.com', '+254710123456', 3, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (16, 'Nadia Gebre', 'nadia.gebre@example.com', '+291712345678', 1, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (17, 'Suleiman Ali', 'suleiman.ali@example.com', '+252612345678', 2, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (18, 'Jane Muthoni', 'jane.muthoni@example.com', '+254799876543', 3, 'B');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (19, 'Tewodros Berhanu', 'tewodros.berhanu@example.com', '+251933456789', 1, 'A');
INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES (20, 'Fatima Ali', 'fatima.ali@example.com', '+252612345678', 2, 'A');

-- TEACHER_SUBJECT_YEAR (teacher's booking-eligible year+subject pairs)
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (1, 1, 1, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (2, 1, 6, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (3, 1, 11, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (4, 2, 2, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (5, 2, 7, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (6, 2, 12, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (7, 3, 3, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (8, 3, 8, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (9, 3, 13, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (10, 4, 4, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (11, 4, 9, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (12, 4, 14, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (13, 5, 5, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (14, 5, 10, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (15, 5, 15, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (16, 6, 1, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (17, 6, 6, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (18, 6, 11, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (19, 7, 2, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (20, 7, 7, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (21, 7, 12, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (22, 8, 3, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (23, 8, 8, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (24, 8, 13, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (25, 9, 4, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (26, 9, 9, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (27, 9, 14, 3);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (28, 10, 5, 1);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (29, 10, 10, 2);
INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES (30, 10, 15, 3);