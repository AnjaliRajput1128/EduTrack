// ===== Core domain types (mirrors the PostgreSQL schema in /supabase/schema.sql) =====

export type Role = 'admin' | 'faculty' | 'student';

export interface AppUser {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department_id: string;
  duration: number; // years
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  department_id: string;
  course_id: string;
  semester: number;
  admission_year: number;
  profile_image?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export type Designation = 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Lecturer';

export interface Faculty {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: string;
  designation: Designation;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty_id: string | null;
}

export interface ClassSection {
  id: string;
  subject_id: string;
  faculty_id: string;
  semester: number;
  section: string;
  academic_year: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  subject_id: string;
  academic_year: string;
  semester: number;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject_id: string;
  faculty_id: string;
  date: string; // ISO date
  status: AttendanceStatus;
  remarks?: string;
}

export type ExamType = 'Assignment' | 'Internal' | 'Midterm' | 'Practical' | 'Final';

export interface MarkRecord {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type: ExamType;
  marks_obtained: number;
  max_marks: number;
  semester: number;
  academic_year: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string; // user id
  created_by_name: string;
  target_role: Role | 'all';
  priority: 'normal' | 'important';
  subject_id?: string | null; // set when a faculty posts for one subject's students only
  created_at: string;
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface TimetableEntry {
  id: string;
  subject_id: string;
  faculty_id: string;
  day: Weekday;
  start_time: string;
  end_time: string;
  room: string;
}

// ===== Configurable business rules (not hard-coded across the app) =====

export interface AttendanceThresholds {
  safe: number;    // >= safe -> Safe
  warning: number; // >= warning and < safe -> Warning, below -> Critical
}

export interface GradeBand {
  min: number;
  max: number;
  grade: string;
  gpa: number;
}

export interface GradingConfig {
  passingPercentage: number;
  bands: GradeBand[];
}
