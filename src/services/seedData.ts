import type {
  AppUser, Department, Course, Student, Faculty, Subject, Enrollment,
  AttendanceRecord, MarkRecord, Announcement, TimetableEntry, Role, ExamType,
} from '@/types';

// Simple seeded PRNG so demo data is stable across reloads instead of
// re-randomising (and looking different) every time the app boots.
let seed = 42;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const AY = '2025-2026';

export const departments: Department[] = [
  { id: 'dep-cs', name: 'Computer Science', code: 'CS' },
  { id: 'dep-math', name: 'Mathematics', code: 'MATH' },
  { id: 'dep-phy', name: 'Physics', code: 'PHY' },
  { id: 'dep-com', name: 'Commerce', code: 'COM' },
];

export const courses: Course[] = [
  { id: 'crs-bsccs', name: 'B.Sc. Computer Science', code: 'BSC-CS', department_id: 'dep-cs', duration: 3 },
  { id: 'crs-bcom', name: 'B.Com', code: 'BCOM', department_id: 'dep-com', duration: 3 },
  { id: 'crs-bscmath', name: 'B.Sc. Mathematics', code: 'BSC-MATH', department_id: 'dep-math', duration: 3 },
  { id: 'crs-bscphy', name: 'B.Sc. Physics', code: 'BSC-PHY', department_id: 'dep-phy', duration: 3 },
];

export const facultyUsers: AppUser[] = [
  { id: 'u-f1', email: 'r.mehta@edutrack.edu', role: 'faculty', created_at: '2023-06-01' },
  { id: 'u-f2', email: 's.iyer@edutrack.edu', role: 'faculty', created_at: '2022-06-01' },
  { id: 'u-f3', email: 'a.khan@edutrack.edu', role: 'faculty', created_at: '2021-06-01' },
  { id: 'u-f4', email: 'p.nair@edutrack.edu', role: 'faculty', created_at: '2020-06-01' },
  { id: 'u-f5', email: 'n.das@edutrack.edu', role: 'faculty', created_at: '2024-06-01' },
];

export const faculty: Faculty[] = [
  { id: 'fac-1', user_id: 'u-f1', employee_id: 'EMP1001', full_name: 'Dr. Rohan Mehta', email: 'r.mehta@edutrack.edu', phone: '9820011122', department_id: 'dep-cs', designation: 'Professor', status: 'active', created_at: '2023-06-01' },
  { id: 'fac-2', user_id: 'u-f2', employee_id: 'EMP1002', full_name: 'Dr. Sunita Iyer', email: 's.iyer@edutrack.edu', phone: '9820011123', department_id: 'dep-math', designation: 'Associate Professor', status: 'active', created_at: '2022-06-01' },
  { id: 'fac-3', user_id: 'u-f3', employee_id: 'EMP1003', full_name: 'Prof. Ayesha Khan', email: 'a.khan@edutrack.edu', phone: '9820011124', department_id: 'dep-phy', designation: 'Assistant Professor', status: 'active', created_at: '2021-06-01' },
  { id: 'fac-4', user_id: 'u-f4', employee_id: 'EMP1004', full_name: 'Dr. Prakash Nair', email: 'p.nair@edutrack.edu', phone: '9820011125', department_id: 'dep-com', designation: 'Professor', status: 'active', created_at: '2020-06-01' },
  { id: 'fac-5', user_id: 'u-f5', employee_id: 'EMP1005', full_name: 'Ms. Neha Das', email: 'n.das@edutrack.edu', phone: '9820011126', department_id: 'dep-cs', designation: 'Lecturer', status: 'active', created_at: '2024-06-01' },
];

export const subjects: Subject[] = [
  { id: 'sub-1', name: 'Data Structures', code: 'CS201', course_id: 'crs-bsccs', semester: 3, credits: 4, faculty_id: 'fac-1' },
  { id: 'sub-2', name: 'Database Management Systems', code: 'CS202', course_id: 'crs-bsccs', semester: 3, credits: 4, faculty_id: 'fac-1' },
  { id: 'sub-3', name: 'Operating Systems', code: 'CS301', course_id: 'crs-bsccs', semester: 5, credits: 4, faculty_id: 'fac-5' },
  { id: 'sub-4', name: 'Web Technologies', code: 'CS302', course_id: 'crs-bsccs', semester: 5, credits: 3, faculty_id: 'fac-5' },
  { id: 'sub-5', name: 'Linear Algebra', code: 'MA201', course_id: 'crs-bscmath', semester: 3, credits: 4, faculty_id: 'fac-2' },
  { id: 'sub-6', name: 'Real Analysis', code: 'MA202', course_id: 'crs-bscmath', semester: 3, credits: 4, faculty_id: 'fac-2' },
  { id: 'sub-7', name: 'Classical Mechanics', code: 'PH201', course_id: 'crs-bscphy', semester: 3, credits: 4, faculty_id: 'fac-3' },
  { id: 'sub-8', name: 'Electromagnetism', code: 'PH202', course_id: 'crs-bscphy', semester: 3, credits: 4, faculty_id: 'fac-3' },
  { id: 'sub-9', name: 'Financial Accounting', code: 'CM201', course_id: 'crs-bcom', semester: 3, credits: 3, faculty_id: 'fac-4' },
  { id: 'sub-10', name: 'Business Statistics', code: 'CM202', course_id: 'crs-bcom', semester: 3, credits: 3, faculty_id: 'fac-4' },
];

const firstNames = ['Aarav', 'Vivaan', 'Aditi', 'Diya', 'Ishaan', 'Ananya', 'Kabir', 'Meera', 'Reyansh', 'Saanvi', 'Arjun', 'Kavya', 'Yash', 'Riya', 'Dev'];
const lastNames = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Reddy', 'Nair', 'Rao', 'Singh', 'Joshi', 'Kulkarni', 'Bose', 'Menon', 'Chatterjee', 'Pillai', 'Agarwal'];

export const studentUsers: AppUser[] = [];
export const students: Student[] = [];

const courseIds = courses.map((c) => c.id);
for (let i = 1; i <= 15; i++) {
  const fn = firstNames[i - 1];
  const ln = lastNames[i - 1];
  const uid = `u-s${i}`;
  const courseId = courseIds[i % courseIds.length];
  const course = courses.find((c) => c.id === courseId)!;
  studentUsers.push({ id: uid, email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edutrack.edu`, role: 'student', created_at: '2024-07-01' });
  students.push({
    id: `stu-${i}`,
    user_id: uid,
    student_id: `2024CS${String(100 + i)}`,
    full_name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edutrack.edu`,
    phone: `98${randInt(10000000, 99999999)}`,
    date_of_birth: `200${randInt(3, 6)}-0${randInt(1, 9)}-1${randInt(0, 9)}`,
    gender: pick(['Male', 'Female'] as const),
    department_id: course.department_id,
    course_id: courseId,
    semester: 3,
    admission_year: 2024,
    status: 'active',
    created_at: '2024-07-01',
  });
}

export const adminUser: AppUser = { id: 'u-admin', email: 'admin@edutrack.edu', role: 'admin', created_at: '2020-01-01' };

export const allUsers: AppUser[] = [adminUser, ...facultyUsers, ...studentUsers];

// Enrollments: every student enrolls in every semester-3 subject in their course's department
export const enrollments: Enrollment[] = [];
let enrId = 1;
for (const s of students) {
  const subs = subjects.filter((sub) => {
    const course = courses.find((c) => c.id === s.course_id);
    return course && sub.course_id === course.id;
  });
  for (const sub of subs) {
    enrollments.push({ id: `enr-${enrId++}`, student_id: s.id, subject_id: sub.id, academic_year: AY, semester: sub.semester });
  }
}

// Attendance: last 40 calendar days, ~3 classes/week per subject
export const attendance: AttendanceRecord[] = [];
let attId = 1;
const today = new Date();
for (const enr of enrollments) {
  const subject = subjects.find((s) => s.id === enr.subject_id)!;
  const studentBias = rand(); // some students attend better than others
  for (let d = 40; d >= 0; d--) {
    if (rand() > 0.55) continue; // ~class held every other day roughly
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    if (date.getDay() === 0) continue; // skip Sundays
    const roll = rand();
    let status: AttendanceRecord['status'];
    if (roll < 0.08 + (1 - studentBias) * 0.15) status = 'Absent';
    else if (roll < 0.13 + (1 - studentBias) * 0.15) status = 'Late';
    else if (roll < 0.16) status = 'Excused';
    else status = 'Present';
    attendance.push({
      id: `att-${attId++}`,
      student_id: enr.student_id,
      subject_id: enr.subject_id,
      faculty_id: subject.faculty_id || 'fac-1',
      date: date.toISOString().slice(0, 10),
      status,
    });
  }
}

// Marks
export const marks: MarkRecord[] = [];
let markId = 1;
const examMaxMarks: Record<ExamType, number> = { Assignment: 20, Internal: 20, Midterm: 30, Practical: 25, Final: 100 };
for (const enr of enrollments) {
  const studentSkill = rand();
  (['Assignment', 'Internal', 'Midterm', 'Final'] as ExamType[]).forEach((examType) => {
    const max = examMaxMarks[examType];
    const base = 0.45 + studentSkill * 0.5;
    const noise = (rand() - 0.5) * 0.15;
    const pct = Math.min(1, Math.max(0.15, base + noise));
    marks.push({
      id: `mark-${markId++}`,
      student_id: enr.student_id,
      subject_id: enr.subject_id,
      exam_type: examType,
      marks_obtained: Math.round(max * pct),
      max_marks: max,
      semester: enr.semester,
      academic_year: AY,
    });
  });
}

export const announcements: Announcement[] = [
  { id: 'ann-1', title: 'Mid-Semester Exam Schedule Released', content: 'The mid-semester examination timetable for all departments has been published. Please check the notice board and your subject pages for exact dates and reporting times.', created_by: 'u-admin', created_by_name: 'Admin Office', target_role: 'all', priority: 'important', created_at: daysAgo(2) },
  { id: 'ann-2', title: 'Library Extended Hours During Exams', content: 'The central library will remain open until 10 PM on weekdays for the next three weeks to support exam preparation.', created_by: 'u-admin', created_by_name: 'Admin Office', target_role: 'all', priority: 'normal', created_at: daysAgo(5) },
  { id: 'ann-3', title: 'Data Structures Assignment 3 Deadline Extended', content: 'The deadline for Assignment 3 has been moved to next Monday, 11:59 PM, due to multiple requests. No further extensions will be granted.', created_by: 'u-f1', created_by_name: 'Dr. Rohan Mehta', target_role: 'student', priority: 'important', subject_id: 'sub-1', created_at: daysAgo(1) },
  { id: 'ann-4', title: 'Guest Lecture on Cloud Computing', content: 'A guest lecture by an industry expert on cloud computing fundamentals will be held in the CS seminar hall this Friday at 2 PM. Attendance is optional but recommended.', created_by: 'u-f5', created_by_name: 'Ms. Neha Das', target_role: 'student', priority: 'normal', subject_id: 'sub-3', created_at: daysAgo(7) },
  { id: 'ann-5', title: 'Faculty Meeting — Semester Review', content: 'All faculty members are requested to attend the semester review meeting in the conference room on Thursday at 4 PM.', created_by: 'u-admin', created_by_name: 'Admin Office', target_role: 'faculty', priority: 'normal', created_at: daysAgo(3) },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const timetable: TimetableEntry[] = [
  { id: 'tt-1', subject_id: 'sub-1', faculty_id: 'fac-1', day: 'Mon', start_time: '09:00', end_time: '10:00', room: 'CS-101' },
  { id: 'tt-2', subject_id: 'sub-2', faculty_id: 'fac-1', day: 'Mon', start_time: '10:15', end_time: '11:15', room: 'CS-102' },
  { id: 'tt-3', subject_id: 'sub-1', faculty_id: 'fac-1', day: 'Wed', start_time: '09:00', end_time: '10:00', room: 'CS-101' },
  { id: 'tt-4', subject_id: 'sub-3', faculty_id: 'fac-5', day: 'Tue', start_time: '11:30', end_time: '12:30', room: 'CS-201' },
  { id: 'tt-5', subject_id: 'sub-4', faculty_id: 'fac-5', day: 'Thu', start_time: '09:00', end_time: '10:00', room: 'CS-Lab-1' },
  { id: 'tt-6', subject_id: 'sub-5', faculty_id: 'fac-2', day: 'Mon', start_time: '11:30', end_time: '12:30', room: 'MA-101' },
  { id: 'tt-7', subject_id: 'sub-6', faculty_id: 'fac-2', day: 'Wed', start_time: '11:30', end_time: '12:30', room: 'MA-102' },
  { id: 'tt-8', subject_id: 'sub-7', faculty_id: 'fac-3', day: 'Tue', start_time: '09:00', end_time: '10:00', room: 'PH-101' },
  { id: 'tt-9', subject_id: 'sub-8', faculty_id: 'fac-3', day: 'Fri', start_time: '09:00', end_time: '10:00', room: 'PH-Lab' },
  { id: 'tt-10', subject_id: 'sub-9', faculty_id: 'fac-4', day: 'Mon', start_time: '13:00', end_time: '14:00', room: 'CM-101' },
  { id: 'tt-11', subject_id: 'sub-10', faculty_id: 'fac-4', day: 'Thu', start_time: '13:00', end_time: '14:00', room: 'CM-102' },
  { id: 'tt-12', subject_id: 'sub-2', faculty_id: 'fac-1', day: 'Fri', start_time: '10:15', end_time: '11:15', room: 'CS-102' },
];

// Demo login directory: maps a login email to a password + which record it represents.
// In the real Supabase build this disappears entirely — Supabase Auth owns credentials.
export const DEMO_CREDENTIALS: { email: string; password: string; role: Role; label: string }[] = [
  { email: 'admin@edutrack.edu', password: 'Admin@123', role: 'admin', label: 'Admin Office' },
  { email: 'r.mehta@edutrack.edu', password: 'Faculty@123', role: 'faculty', label: 'Dr. Rohan Mehta (Faculty)' },
  { email: students[0].email, password: 'Student@123', role: 'student', label: `${students[0].full_name} (Student)` },
];
