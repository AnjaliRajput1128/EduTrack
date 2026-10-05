-- ============================================================
-- EduTrack ERP — Complete Supabase Database Seed Script
-- Run this in your Supabase project's SQL Editor after
-- schema.sql and rls_policies.sql.
--
-- This script provisions:
--   1. Reference data (Departments, Courses, Subjects)
--   2. Complete Demo Auth users directly in auth.users with
--      passwords (Admin@123, Faculty@123, Student@123)
--   3. Matching public.users, public.faculty, public.students
--   4. Enrollments for Semester 3
--   5. Full Attendance history
--   6. Assessment / Examination Marks across all exam types
--   7. Weekly Timetable & Announcements
--
-- All operations use deterministic UUIDs and ON CONFLICT DO UPDATE
-- so this script is 100% idempotent and can be safely re-run.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- 1. REFERENCE DATA
-- ============================================================

-- Departments
insert into public.departments (id, name, code) values
  ('00000000-0000-0000-0000-000000000d01', 'Computer Science', 'CS'),
  ('00000000-0000-0000-0000-000000000d02', 'Mathematics', 'MATH'),
  ('00000000-0000-0000-0000-000000000d03', 'Physics', 'PHY'),
  ('00000000-0000-0000-0000-000000000d04', 'Commerce', 'COM')
on conflict (id) do update set name = excluded.name, code = excluded.code;

-- Courses
insert into public.courses (id, name, code, department_id, duration) values
  ('00000000-0000-0000-0000-000000000c01', 'B.Sc. Computer Science', 'BSC-CS', '00000000-0000-0000-0000-000000000d01', 3),
  ('00000000-0000-0000-0000-000000000c02', 'B.Com', 'BCOM', '00000000-0000-0000-0000-000000000d04', 3),
  ('00000000-0000-0000-0000-000000000c03', 'B.Sc. Mathematics', 'BSC-MATH', '00000000-0000-0000-0000-000000000d02', 3),
  ('00000000-0000-0000-0000-000000000c04', 'B.Sc. Physics', 'BSC-PHY', '00000000-0000-0000-0000-000000000d03', 3)
on conflict (id) do update set name = excluded.name, code = excluded.code, department_id = excluded.department_id, duration = excluded.duration;

-- ============================================================
-- 2. AUTH USERS (Injected with real bcrypt hashes for GoTrue)
-- ============================================================

-- Admin: admin@edutrack.edu / Admin@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@edutrack.edu',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"admin","full_name":"Admin Office"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Faculty 1: Dr. Rohan Mehta (Professor, CS) / Faculty@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'f0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'r.mehta@edutrack.edu',
  crypt('Faculty@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"faculty","full_name":"Dr. Rohan Mehta","employee_id":"EMP1001"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Faculty 2: Dr. Sunita Iyer / Faculty@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'f0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  's.iyer@edutrack.edu',
  crypt('Faculty@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"faculty","full_name":"Dr. Sunita Iyer","employee_id":"EMP1002"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Faculty 3: Prof. Ayesha Khan / Faculty@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'f0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'a.khan@edutrack.edu',
  crypt('Faculty@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"faculty","full_name":"Prof. Ayesha Khan","employee_id":"EMP1003"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Faculty 4: Dr. Prakash Nair / Faculty@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'f0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'p.nair@edutrack.edu',
  crypt('Faculty@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"faculty","full_name":"Dr. Prakash Nair","employee_id":"EMP1004"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Faculty 5: Ms. Neha Das / Faculty@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'f0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'n.das@edutrack.edu',
  crypt('Faculty@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"faculty","full_name":"Ms. Neha Das","employee_id":"EMP1005"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Student 1: Aarav Sharma / Student@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'aarav.sharma@student.edutrack.edu',
  crypt('Student@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"student","full_name":"Aarav Sharma","student_id":"2024CS101"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Student 2: Vivaan Verma / Student@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'vivaan.verma@student.edutrack.edu',
  crypt('Student@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"student","full_name":"Vivaan Verma","student_id":"2024CS102"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Student 3: Aditi Patel / Student@123
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
) values (
  'b0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'aditi.patel@student.edutrack.edu',
  crypt('Student@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"student","full_name":"Aditi Patel","student_id":"2024CS103"}'::jsonb,
  false, 'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_user_meta_data = excluded.raw_user_meta_data;

-- ============================================================
-- 3. PUBLIC USERS TABLE
-- ============================================================

insert into public.users (id, email, role, created_at) values
  ('a0000000-0000-0000-0000-000000000001', 'admin@edutrack.edu', 'admin', now()),
  ('f0000000-0000-0000-0000-000000000001', 'r.mehta@edutrack.edu', 'faculty', now()),
  ('f0000000-0000-0000-0000-000000000002', 's.iyer@edutrack.edu', 'faculty', now()),
  ('f0000000-0000-0000-0000-000000000003', 'a.khan@edutrack.edu', 'faculty', now()),
  ('f0000000-0000-0000-0000-000000000004', 'p.nair@edutrack.edu', 'faculty', now()),
  ('f0000000-0000-0000-0000-000000000005', 'n.das@edutrack.edu', 'faculty', now()),
  ('b0000000-0000-0000-0000-000000000001', 'aarav.sharma@student.edutrack.edu', 'student', now()),
  ('b0000000-0000-0000-0000-000000000002', 'vivaan.verma@student.edutrack.edu', 'student', now()),
  ('b0000000-0000-0000-0000-000000000003', 'aditi.patel@student.edutrack.edu', 'student', now())
on conflict (id) do update set email = excluded.email, role = excluded.role;

-- ============================================================
-- 4. FACULTY PROFILES
-- ============================================================

insert into public.faculty (id, user_id, employee_id, full_name, email, phone, department_id, designation, status) values
  ('fa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'EMP1001', 'Dr. Rohan Mehta', 'r.mehta@edutrack.edu', '9820011122', '00000000-0000-0000-0000-000000000d01', 'Professor', 'active'),
  ('fa000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'EMP1002', 'Dr. Sunita Iyer', 's.iyer@edutrack.edu', '9820011123', '00000000-0000-0000-0000-000000000d02', 'Associate Professor', 'active'),
  ('fa000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'EMP1003', 'Prof. Ayesha Khan', 'a.khan@edutrack.edu', '9820011124', '00000000-0000-0000-0000-000000000d03', 'Assistant Professor', 'active'),
  ('fa000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'EMP1004', 'Dr. Prakash Nair', 'p.nair@edutrack.edu', '9820011125', '00000000-0000-0000-0000-000000000d04', 'Professor', 'active'),
  ('fa000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'EMP1005', 'Ms. Neha Das', 'n.das@edutrack.edu', '9820011126', '00000000-0000-0000-0000-000000000d01', 'Lecturer', 'active')
on conflict (user_id) do update set
  id = excluded.id,
  employee_id = excluded.employee_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  department_id = excluded.department_id,
  designation = excluded.designation,
  status = excluded.status;

-- ============================================================
-- 5. SUBJECTS (Mapped to Courses and Faculty)
-- ============================================================

insert into public.subjects (id, name, code, course_id, semester, credits, faculty_id) values
  ('00000000-0000-0000-0000-000000000b01', 'Data Structures', 'CS201', '00000000-0000-0000-0000-000000000c01', 3, 4, 'fa000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000b02', 'Database Management Systems', 'CS202', '00000000-0000-0000-0000-000000000c01', 3, 4, 'fa000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000b03', 'Operating Systems', 'CS301', '00000000-0000-0000-0000-000000000c01', 5, 4, 'fa000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000b04', 'Web Technologies', 'CS302', '00000000-0000-0000-0000-000000000c01', 5, 3, 'fa000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000b05', 'Linear Algebra', 'MA201', '00000000-0000-0000-0000-000000000c03', 3, 4, 'fa000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000b06', 'Real Analysis', 'MA202', '00000000-0000-0000-0000-000000000c03', 3, 4, 'fa000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000b07', 'Classical Mechanics', 'PH201', '00000000-0000-0000-0000-000000000c04', 3, 4, 'fa000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000b08', 'Electromagnetism', 'PH202', '00000000-0000-0000-0000-000000000c04', 3, 4, 'fa000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000b09', 'Financial Accounting', 'CM201', '00000000-0000-0000-0000-000000000c02', 3, 3, 'fa000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000b10', 'Business Statistics', 'CM202', '00000000-0000-0000-0000-000000000c02', 3, 3, 'fa000000-0000-0000-0000-000000000004')
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  course_id = excluded.course_id,
  semester = excluded.semester,
  credits = excluded.credits,
  faculty_id = excluded.faculty_id;

-- ============================================================
-- 6. STUDENT PROFILES
-- ============================================================

insert into public.students (
  id, user_id, student_id, full_name, email, phone, date_of_birth, gender,
  department_id, course_id, semester, admission_year, status
) values
  ('bb000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '2024CS101', 'Aarav Sharma', 'aarav.sharma@student.edutrack.edu', '9820000001', '2005-03-14', 'Male', '00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000c01', 3, 2024, 'active'),
  ('bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '2024CS102', 'Vivaan Verma', 'vivaan.verma@student.edutrack.edu', '9820000002', '2005-05-18', 'Male', '00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000c01', 3, 2024, 'active'),
  ('bb000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '2024CS103', 'Aditi Patel', 'aditi.patel@student.edutrack.edu', '9820000003', '2005-08-22', 'Female', '00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000c01', 3, 2024, 'active')
on conflict (user_id) do update set
  id = excluded.id,
  student_id = excluded.student_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  department_id = excluded.department_id,
  course_id = excluded.course_id,
  semester = excluded.semester,
  admission_year = excluded.admission_year,
  status = excluded.status;

-- ============================================================
-- 7. ENROLLMENTS (Semester 3)
-- ============================================================

insert into public.enrollments (student_id, subject_id, academic_year, semester) values
  -- Aarav Sharma (CS201 & CS202)
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', '2025-2026', 3),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', '2025-2026', 3),
  -- Vivaan Verma
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', '2025-2026', 3),
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b02', '2025-2026', 3),
  -- Aditi Patel
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', '2025-2026', 3),
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b02', '2025-2026', 3)
on conflict (student_id, subject_id, academic_year) do nothing;

-- ============================================================
-- 8. ATTENDANCE RECORDS (Past 30 days)
-- ============================================================

insert into public.attendance (student_id, subject_id, faculty_id, date, status, remarks) values
  -- Aarav Sharma - CS201 (Dr. Rohan Mehta)
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '1 day')::date, 'Present', 'Active participation'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '3 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '5 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '8 days')::date, 'Late', 'Transit delay'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '10 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '12 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '15 days')::date, 'Absent', 'Medical leave'),
  -- Aarav Sharma - CS202 (Dr. Rohan Mehta)
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '2 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '4 days')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '9 days')::date, 'Present', ''),
  -- Vivaan Verma - CS201
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '1 day')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '3 days')::date, 'Absent', 'Unexcused'),
  -- Aditi Patel - CS201
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '1 day')::date, 'Present', ''),
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', (current_date - interval '3 days')::date, 'Present', '')
on conflict (student_id, subject_id, date) do update set
  status = excluded.status,
  remarks = excluded.remarks;

-- ============================================================
-- 9. MARKS / ASSESSMENT RECORDS
-- ============================================================

insert into public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, semester, academic_year) values
  -- Aarav Sharma - CS201
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'Assignment', 18, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'Internal', 17, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'Midterm', 26, 30, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'Practical', 23, 25, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b01', 'Final', 88, 100, 3, '2025-2026'),
  -- Aarav Sharma - CS202
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'Assignment', 19, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'Internal', 18, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'Midterm', 27, 30, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000b02', 'Final', 84, 100, 3, '2025-2026'),
  -- Vivaan Verma - CS201
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', 'Assignment', 14, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', 'Internal', 15, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000b01', 'Midterm', 21, 30, 3, '2025-2026'),
  -- Aditi Patel - CS201
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'Assignment', 20, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'Internal', 19, 20, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'Midterm', 28, 30, 3, '2025-2026'),
  ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000b01', 'Final', 92, 100, 3, '2025-2026')
on conflict (student_id, subject_id, exam_type, academic_year) do update set
  marks_obtained = excluded.marks_obtained,
  max_marks = excluded.max_marks;

-- ============================================================
-- 10. TIMETABLE
-- ============================================================

insert into public.timetable (id, subject_id, faculty_id, day, start_time, end_time, room) values
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', 'Mon', '09:00', '10:00', 'CS-101'),
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000000b02', 'fa000000-0000-0000-0000-000000000001', 'Mon', '10:15', '11:15', 'CS-102'),
  ('00000000-0000-0000-0000-000000000e03', '00000000-0000-0000-0000-000000000b01', 'fa000000-0000-0000-0000-000000000001', 'Wed', '09:00', '10:00', 'CS-101'),
  ('00000000-0000-0000-0000-000000000e04', '00000000-0000-0000-0000-000000000b03', 'fa000000-0000-0000-0000-000000000005', 'Tue', '11:30', '12:30', 'CS-201'),
  ('00000000-0000-0000-0000-000000000e05', '00000000-0000-0000-0000-000000000b04', 'fa000000-0000-0000-0000-000000000005', 'Thu', '09:00', '10:00', 'CS-Lab-1'),
  ('00000000-0000-0000-0000-000000000e06', '00000000-0000-0000-0000-000000000b05', 'fa000000-0000-0000-0000-000000000002', 'Mon', '11:30', '12:30', 'MA-101'),
  ('00000000-0000-0000-0000-000000000e07', '00000000-0000-0000-0000-000000000b06', 'fa000000-0000-0000-0000-000000000002', 'Wed', '11:30', '12:30', 'MA-102'),
  ('00000000-0000-0000-0000-000000000e08', '00000000-0000-0000-0000-000000000b07', 'fa000000-0000-0000-0000-000000000003', 'Tue', '09:00', '10:00', 'PH-101'),
  ('00000000-0000-0000-0000-000000000e09', '00000000-0000-0000-0000-000000000b08', 'fa000000-0000-0000-0000-000000000003', 'Fri', '09:00', '10:00', 'PH-Lab'),
  ('00000000-0000-0000-0000-000000000e10', '00000000-0000-0000-0000-000000000b09', 'fa000000-0000-0000-0000-000000000004', 'Mon', '13:00', '14:00', 'CM-101'),
  ('00000000-0000-0000-0000-000000000e11', '00000000-0000-0000-0000-000000000b10', 'fa000000-0000-0000-0000-000000000004', 'Thu', '13:00', '14:00', 'CM-102'),
  ('00000000-0000-0000-0000-000000000e12', '00000000-0000-0000-0000-000000000b02', 'fa000000-0000-0000-0000-000000000001', 'Fri', '10:15', '11:15', 'CS-102')
on conflict (id) do update set
  subject_id = excluded.subject_id,
  faculty_id = excluded.faculty_id,
  day = excluded.day,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  room = excluded.room;

-- ============================================================
-- 11. ANNOUNCEMENTS
-- ============================================================

insert into public.announcements (id, title, content, created_by, created_by_name, target_role, priority, subject_id, created_at) values
  ('00000000-0000-0000-0000-000000000a01', 'Mid-Semester Examination Schedule Released', 'The mid-semester examination timetable for all departments has been published. Please check your subject pages for reporting times.', 'a0000000-0000-0000-0000-000000000001', 'Admin Office', 'all', 'important', null, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000a02', 'Central Library Extended Hours During Exams', 'The central library will remain open until 10 PM on weekdays for the next three weeks to support exam preparation.', 'a0000000-0000-0000-0000-000000000001', 'Admin Office', 'all', 'normal', null, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000a03', 'Data Structures Assignment 3 Deadline Extended', 'The deadline for Assignment 3 has been moved to next Monday, 11:59 PM, due to student requests.', 'f0000000-0000-0000-0000-000000000001', 'Dr. Rohan Mehta', 'student', 'important', '00000000-0000-0000-0000-000000000b01', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000a04', 'Faculty Meeting — Semester Progress Review', 'All faculty members are requested to attend the semester review meeting in the conference room on Thursday at 4 PM.', 'a0000000-0000-0000-0000-000000000001', 'Admin Office', 'faculty', 'normal', null, now() - interval '3 days')
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  target_role = excluded.target_role,
  priority = excluded.priority;
