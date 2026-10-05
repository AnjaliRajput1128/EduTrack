import type {
  Department, Course, Student, Faculty, Subject, Enrollment,
  AttendanceRecord, MarkRecord, Announcement, TimetableEntry, AppUser,
} from '@/types';
import * as seed from './seedData';
import { supabase, isSupabaseConfigured, createIsolatedAuthClient } from '@/lib/supabase';

/**
 * DATA SERVICE
 * ------------
 * Two implementations of the exact same async, Supabase-shaped interface:
 *
 *  - `supabaseDataService` — real `supabase.from(...)` calls. Used the
 *    moment VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.
 *  - `mockDataService` — the original localStorage-backed demo layer.
 *    Used automatically whenever Supabase isn't configured, so the app
 *    keeps working out of the box with zero setup.
 *
 * Every page in the app imports `dataService` from this file and never
 * needs to know or care which implementation is active.
 */

function throwIfError<T>(
  response: { data: T | null; error: { message: string } | null },
  fallback?: T
): T {
  if (response.error) {
    console.error('Supabase error:', response.error.message);
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error('No data returned from query');
  }
  return response.data;
}

// ============================================================
// Real Supabase implementation
// ============================================================
const supabaseDataService = {
  resetToSeed(): void {
    console.warn('resetToSeed() is a no-op when connected to a real Supabase project.');
  },
  clearDemoData(): void {
    console.warn('clearDemoData() is a no-op when connected to a real Supabase project.');
  },

  // ---------- Reference data ----------
  async getDepartments(): Promise<Department[]> {
    return throwIfError(await supabase!.from('departments').select('*').order('name'), []);
  },
  async getCourses(): Promise<Course[]> {
    return throwIfError(await supabase!.from('courses').select('*').order('name'), []);
  },
  async getSubjects(): Promise<Subject[]> {
    return throwIfError(await supabase!.from('subjects').select('*').order('name'), []);
  },
  async getTimetable(): Promise<TimetableEntry[]> {
    return throwIfError(await supabase!.from('timetable').select('*'), []);
  },
  async getUsers(): Promise<AppUser[]> {
    return throwIfError(await supabase!.from('users').select('*'), []);
  },

  async addSubject(s: Omit<Subject, 'id'>): Promise<Subject> {
    return throwIfError(await supabase!.from('subjects').insert(s).select().single());
  },
  async updateSubject(id: string, patch: Partial<Subject>): Promise<void> {
    throwIfError(await supabase!.from('subjects').update(patch).eq('id', id), null);
  },
  async deleteSubject(id: string): Promise<void> {
    throwIfError(await supabase!.from('subjects').delete().eq('id', id), null);
  },

  async addDepartment(d: Omit<Department, 'id'>): Promise<Department> {
    return throwIfError(await supabase!.from('departments').insert(d).select().single());
  },
  async addCourse(c: Omit<Course, 'id'>): Promise<Course> {
    return throwIfError(await supabase!.from('courses').insert(c).select().single());
  },

  // ---------- Students ----------
  async getStudents(): Promise<Student[]> {
    return throwIfError(await supabase!.from('students').select('*').order('full_name'), []);
  },
  async getStudentById(id: string): Promise<Student | undefined> {
    const { data, error } = await supabase!.from('students').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error('getStudentById error:', error.message);
      throw new Error(error.message);
    }
    return data ?? undefined;
  },
  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const { data, error } = await supabase!.from('students').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      console.error('getStudentByUserId error:', error.message);
      throw new Error(error.message);
    }
    return data ?? undefined;
  },
  async addStudent(s: Omit<Student, 'id' | 'created_at'> & { temporary_password?: string }): Promise<Student> {
    const isRealUUID = s.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.user_id);
    let authUserId = s.user_id;

    if (!isRealUUID) {
      const authClient = createIsolatedAuthClient();
      if (!authClient) throw new Error('Supabase client is not configured.');

      const tempPassword = s.temporary_password || 'Student@123';
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: s.email.trim(),
        password: tempPassword,
        options: {
          data: {
            role: 'student',
            full_name: s.full_name,
            department_id: s.department_id,
            course_id: s.course_id,
            semester: s.semester,
            admission_year: s.admission_year,
          },
        },
      });

      if (authError) {
        console.warn('Auth signup notice:', authError.message);
        const { data: existingUser } = await supabase!.from('users').select('id').eq('email', s.email.trim()).maybeSingle();
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          throw new Error(`Failed to create student account: ${authError.message}`);
        }
      } else if (authData.user) {
        authUserId = authData.user.id;
      } else {
        throw new Error('Failed to create student authentication account.');
      }
    }

    const payload = {
      user_id: authUserId,
      student_id: s.student_id,
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      date_of_birth: s.date_of_birth || null,
      gender: s.gender,
      department_id: s.department_id,
      course_id: s.course_id,
      semester: s.semester,
      admission_year: s.admission_year,
      status: s.status || 'active',
    };

    const { data: created, error } = await supabase!
      .from('students')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create/link student profile:', error);
      throw new Error(error.message);
    }

    // Auto-enroll the student in current semester subjects for this course
    try {
      const { data: courseSubjects } = await supabase!
        .from('subjects')
        .select('id, semester')
        .eq('course_id', s.course_id)
        .eq('semester', s.semester);

      if (courseSubjects && courseSubjects.length > 0) {
        const enrollments = courseSubjects.map((sub) => ({
          student_id: created.id,
          subject_id: sub.id,
          academic_year: '2025-2026',
          semester: sub.semester,
        }));
        await supabase!.from('enrollments').upsert(enrollments, {
          onConflict: 'student_id,subject_id,academic_year',
        });
      }
    } catch (e) {
      console.warn('Auto-enrollment non-fatal notification:', e);
    }

    return created as Student;
  },
  async updateStudent(id: string, patch: Partial<Student>): Promise<void> {
    throwIfError(await supabase!.from('students').update(patch).eq('id', id), null);
  },
  async deleteStudent(id: string): Promise<void> {
    const { data: student } = await supabase!.from('students').select('user_id').eq('id', id).maybeSingle();
    // Delete student record (cascades to enrollments, marks, attendance via DB foreign keys)
    throwIfError(await supabase!.from('students').delete().eq('id', id), null);
    if (student?.user_id) {
      await supabase!.from('users').delete().eq('id', student.user_id);
    }
  },

  // ---------- Faculty ----------
  async getFaculty(): Promise<Faculty[]> {
    return throwIfError(await supabase!.from('faculty').select('*').order('full_name'), []);
  },
  async getFacultyById(id: string): Promise<Faculty | undefined> {
    const { data, error } = await supabase!.from('faculty').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error('getFacultyById error:', error.message);
      throw new Error(error.message);
    }
    return data ?? undefined;
  },
  async getFacultyByUserId(userId: string): Promise<Faculty | undefined> {
    const { data, error } = await supabase!.from('faculty').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      console.error('getFacultyByUserId error:', error.message);
      throw new Error(error.message);
    }
    return data ?? undefined;
  },
  async addFaculty(f: Omit<Faculty, 'id' | 'created_at'> & { temporary_password?: string }): Promise<Faculty> {
    const isRealUUID = f.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.user_id);
    let authUserId = f.user_id;

    if (!isRealUUID) {
      const authClient = createIsolatedAuthClient();
      if (!authClient) throw new Error('Supabase client is not configured.');

      const tempPassword = f.temporary_password || 'Faculty@123';
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: f.email.trim(),
        password: tempPassword,
        options: {
          data: {
            role: 'faculty',
            full_name: f.full_name,
            department_id: f.department_id,
            designation: f.designation,
          },
        },
      });

      if (authError) {
        console.warn('Auth signup notice:', authError.message);
        const { data: existingUser } = await supabase!.from('users').select('id').eq('email', f.email.trim()).maybeSingle();
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          throw new Error(`Failed to create faculty account: ${authError.message}`);
        }
      } else if (authData.user) {
        authUserId = authData.user.id;
      } else {
        throw new Error('Failed to create faculty authentication account.');
      }
    }

    const payload = {
      user_id: authUserId,
      employee_id: f.employee_id,
      full_name: f.full_name,
      email: f.email,
      phone: f.phone,
      department_id: f.department_id,
      designation: f.designation,
      status: f.status || 'active',
    };

    const { data: created, error } = await supabase!
      .from('faculty')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create/link faculty profile:', error);
      throw new Error(error.message);
    }

    return created as Faculty;
  },
  async updateFaculty(id: string, patch: Partial<Faculty>): Promise<void> {
    throwIfError(await supabase!.from('faculty').update(patch).eq('id', id), null);
  },
  async deleteFaculty(id: string): Promise<void> {
    const { data: fac } = await supabase!.from('faculty').select('user_id').eq('id', id).maybeSingle();
    // 1. Unassign faculty from subjects
    await supabase!.from('subjects').update({ faculty_id: null }).eq('faculty_id', id);
    // 2. Remove timetable and classes entries
    await supabase!.from('timetable').delete().eq('faculty_id', id);
    await supabase!.from('classes').delete().eq('faculty_id', id);
    // 3. Delete faculty profile
    throwIfError(await supabase!.from('faculty').delete().eq('id', id), null);
    if (fac?.user_id) {
      await supabase!.from('users').delete().eq('id', fac.user_id);
    }
  },

  // ---------- Enrollments ----------
  async getEnrollments(): Promise<Enrollment[]> {
    return throwIfError(await supabase!.from('enrollments').select('*'), []);
  },
  async getEnrollmentsForSubject(subjectId: string): Promise<Enrollment[]> {
    return throwIfError(await supabase!.from('enrollments').select('*').eq('subject_id', subjectId), []);
  },
  async getEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
    return throwIfError(await supabase!.from('enrollments').select('*').eq('student_id', studentId), []);
  },

  // ---------- Attendance ----------
  async getAttendance(): Promise<AttendanceRecord[]> {
    return throwIfError(await supabase!.from('attendance').select('*'), []);
  },
  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    return throwIfError(await supabase!.from('attendance').select('*').eq('student_id', studentId), []);
  },
  async getAttendanceForSubject(subjectId: string): Promise<AttendanceRecord[]> {
    return throwIfError(await supabase!.from('attendance').select('*').eq('subject_id', subjectId), []);
  },
  async getAttendanceForSubjectDate(subjectId: string, date: string): Promise<AttendanceRecord[]> {
    return throwIfError(await supabase!.from('attendance').select('*').eq('subject_id', subjectId).eq('date', date), []);
  },
  async saveAttendanceBulk(records: Array<Omit<AttendanceRecord, 'id'>>): Promise<void> {
    if (records.length === 0) return;
    const { error } = await supabase!.from('attendance').upsert(records, { onConflict: 'student_id,subject_id,date' });
    if (error) {
      console.error('saveAttendanceBulk error:', error.message);
      throw new Error(error.message);
    }
  },

  // ---------- Marks ----------
  async getMarks(): Promise<MarkRecord[]> {
    return throwIfError(await supabase!.from('marks').select('*'), []);
  },
  async getMarksForStudent(studentId: string): Promise<MarkRecord[]> {
    return throwIfError(await supabase!.from('marks').select('*').eq('student_id', studentId), []);
  },
  async getMarksForSubject(subjectId: string): Promise<MarkRecord[]> {
    return throwIfError(await supabase!.from('marks').select('*').eq('subject_id', subjectId), []);
  },
  async upsertMark(m: Omit<MarkRecord, 'id'> & { id?: string }): Promise<void> {
    const payload = {
      student_id: m.student_id,
      subject_id: m.subject_id,
      exam_type: m.exam_type,
      marks_obtained: m.marks_obtained,
      max_marks: m.max_marks,
      semester: m.semester,
      academic_year: m.academic_year,
    };
    const { error } = await supabase!.from('marks').upsert([payload], {
      onConflict: 'student_id,subject_id,exam_type,academic_year',
    });
    if (error) {
      console.error('upsertMark error:', error.message);
      throw new Error(error.message);
    }
  },

  // ---------- Announcements ----------
  async getAnnouncements(): Promise<Announcement[]> {
    return throwIfError(await supabase!.from('announcements').select('*').order('created_at', { ascending: false }), []);
  },
  async addAnnouncement(a: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    const payload: Record<string, any> = { ...a };
    if (!payload.subject_id) payload.subject_id = null;
    return throwIfError(await supabase!.from('announcements').insert(payload).select().single());
  },
  async deleteAnnouncement(id: string): Promise<void> {
    throwIfError(await supabase!.from('announcements').delete().eq('id', id), null);
  },
};

// ============================================================
// Mock (localStorage) implementation — 100% preserved for Demo Mode
// ============================================================
const STORAGE_KEY = 'edutrack_db_v1';

interface DB {
  users: AppUser[];
  departments: Department[];
  courses: Course[];
  students: Student[];
  faculty: Faculty[];
  subjects: Subject[];
  enrollments: Enrollment[];
  attendance: AttendanceRecord[];
  marks: MarkRecord[];
  announcements: Announcement[];
  timetable: TimetableEntry[];
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    // fall through to seed
  }
  const fresh: DB = {
    users: seed.allUsers,
    departments: seed.departments,
    courses: seed.courses,
    students: seed.students,
    faculty: seed.faculty,
    subjects: seed.subjects,
    enrollments: seed.enrollments,
    attendance: seed.attendance,
    marks: seed.marks,
    announcements: seed.announcements,
    timetable: seed.timetable,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

let db = loadDB();

function sync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) db = JSON.parse(raw) as DB;
  } catch {
    // keep in-memory copy if corrupt
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to persist mock database to localStorage:', err);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) sync();
  });
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const mockDataService = {
  resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('edutrack_auth_credentials_v1');
    db = loadDB();
  },

  // Clear demo records for users wanting a clean slate
  clearDemoData(): void {
    db = {
      departments: db.departments,
      courses: db.courses,
      students: [],
      faculty: [],
      subjects: db.subjects,
      users: db.users,
      enrollments: [],
      attendance: [],
      marks: [],
      announcements: [],
      timetable: [],
    };
    persist();
  },

  // ---------- Reference data ----------
  async getDepartments(): Promise<Department[]> { return delay([...db.departments]); },
  async getCourses(): Promise<Course[]> { return delay([...db.courses]); },
  async getSubjects(): Promise<Subject[]> { return delay([...db.subjects]); },
  async getTimetable(): Promise<TimetableEntry[]> { return delay([...db.timetable]); },
  async getUsers(): Promise<AppUser[]> { return delay([...db.users]); },

  async addSubject(s: Omit<Subject, 'id'>): Promise<Subject> {
    const rec: Subject = { ...s, id: uid('sub') };
    db.subjects.push(rec); persist(); return delay(rec);
  },
  async updateSubject(id: string, patch: Partial<Subject>): Promise<void> {
    db.subjects = db.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)); persist(); return delay(undefined);
  },
  async deleteSubject(id: string): Promise<void> {
    db.subjects = db.subjects.filter((s) => s.id !== id); persist(); return delay(undefined);
  },

  async addDepartment(d: Omit<Department, 'id'>): Promise<Department> {
    const rec = { ...d, id: uid('dep') }; db.departments.push(rec); persist(); return delay(rec);
  },
  async addCourse(c: Omit<Course, 'id'>): Promise<Course> {
    const rec = { ...c, id: uid('crs') }; db.courses.push(rec); persist(); return delay(rec);
  },

  // ---------- Students ----------
  async getStudents(): Promise<Student[]> { return delay([...db.students]); },
  async getStudentById(id: string): Promise<Student | undefined> { return delay(db.students.find((s) => s.id === id)); },
  async getStudentByUserId(userId: string): Promise<Student | undefined> { return delay(db.students.find((s) => s.user_id === userId)); },
  async addStudent(s: Omit<Student, 'id' | 'created_at'> & { temporary_password?: string }): Promise<Student> {
    const userId = s.user_id || uid('usr');
    const rec: Student = { ...s, id: uid('stu'), user_id: userId, created_at: new Date().toISOString() };
    db.students.push(rec);

    // Auto-enroll student into active course subjects in mock DB
    const courseSubjects = db.subjects.filter((sub) => sub.course_id === s.course_id && (!s.semester || sub.semester === s.semester));
    for (const sub of courseSubjects) {
      db.enrollments.push({
        id: uid('enr'),
        student_id: rec.id,
        subject_id: sub.id,
        semester: s.semester || 1,
        academic_year: '2025-2026',
      });
    }

    // Register login credentials in mock auth
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('edutrack_auth_credentials_v1');
        const creds = raw ? JSON.parse(raw) : [];
        if (!creds.some((c: any) => c.email.toLowerCase() === s.email.trim().toLowerCase())) {
          creds.push({
            email: s.email.trim().toLowerCase(),
            password: s.temporary_password || 'Student@123',
            role: 'student',
            userId,
          });
          localStorage.setItem('edutrack_auth_credentials_v1', JSON.stringify(creds));
        }
      } catch (err) {
        console.warn('Mock student credential registration warning:', err);
      }
    }

    persist();
    return delay(rec);
  },
  async updateStudent(id: string, patch: Partial<Student>): Promise<void> {
    db.students = db.students.map((s) => (s.id === id ? { ...s, ...patch } : s)); persist(); return delay(undefined);
  },
  async deleteStudent(id: string): Promise<void> {
    db.students = db.students.filter((s) => s.id !== id); persist(); return delay(undefined);
  },

  // ---------- Faculty ----------
  async getFaculty(): Promise<Faculty[]> { return delay([...db.faculty]); },
  async getFacultyById(id: string): Promise<Faculty | undefined> { return delay(db.faculty.find((f) => f.id === id)); },
  async getFacultyByUserId(userId: string): Promise<Faculty | undefined> { return delay(db.faculty.find((f) => f.user_id === userId)); },
  async addFaculty(f: Omit<Faculty, 'id' | 'created_at'> & { temporary_password?: string }): Promise<Faculty> {
    const userId = f.user_id || uid('usr');
    const rec: Faculty = { ...f, id: uid('fac'), user_id: userId, created_at: new Date().toISOString() };
    db.faculty.push(rec);

    // Register login credentials in mock auth
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('edutrack_auth_credentials_v1');
        const creds = raw ? JSON.parse(raw) : [];
        if (!creds.some((c: any) => c.email.toLowerCase() === f.email.trim().toLowerCase())) {
          creds.push({
            email: f.email.trim().toLowerCase(),
            password: f.temporary_password || 'Faculty@123',
            role: 'faculty',
            userId,
          });
          localStorage.setItem('edutrack_auth_credentials_v1', JSON.stringify(creds));
        }
      } catch (err) {
        console.warn('Mock faculty credential registration warning:', err);
      }
    }

    persist();
    return delay(rec);
  },
  async updateFaculty(id: string, patch: Partial<Faculty>): Promise<void> {
    db.faculty = db.faculty.map((f) => (f.id === id ? { ...f, ...patch } : f)); persist(); return delay(undefined);
  },
  async deleteFaculty(id: string): Promise<void> {
    db.faculty = db.faculty.filter((f) => f.id !== id); persist(); return delay(undefined);
  },

  // ---------- Enrollments ----------
  async getEnrollments(): Promise<Enrollment[]> { return delay([...db.enrollments]); },
  async getEnrollmentsForSubject(subjectId: string): Promise<Enrollment[]> {
    return delay(db.enrollments.filter((e) => e.subject_id === subjectId));
  },
  async getEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
    return delay(db.enrollments.filter((e) => e.student_id === studentId));
  },

  // ---------- Attendance ----------
  async getAttendance(): Promise<AttendanceRecord[]> { return delay([...db.attendance]); },
  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    return delay(db.attendance.filter((a) => a.student_id === studentId));
  },
  async getAttendanceForSubject(subjectId: string): Promise<AttendanceRecord[]> {
    return delay(db.attendance.filter((a) => a.subject_id === subjectId));
  },
  async getAttendanceForSubjectDate(subjectId: string, date: string): Promise<AttendanceRecord[]> {
    return delay(db.attendance.filter((a) => a.subject_id === subjectId && a.date === date));
  },
  async saveAttendanceBulk(records: Array<Omit<AttendanceRecord, 'id'>>): Promise<void> {
    for (const r of records) {
      const existing = db.attendance.find((a) => a.student_id === r.student_id && a.subject_id === r.subject_id && a.date === r.date);
      if (existing) {
        existing.status = r.status;
        existing.remarks = r.remarks;
      } else {
        db.attendance.push({ ...r, id: uid('att') });
      }
    }
    persist();
    return delay(undefined);
  },

  // ---------- Marks ----------
  async getMarks(): Promise<MarkRecord[]> { return delay([...db.marks]); },
  async getMarksForStudent(studentId: string): Promise<MarkRecord[]> {
    return delay(db.marks.filter((m) => m.student_id === studentId));
  },
  async getMarksForSubject(subjectId: string): Promise<MarkRecord[]> {
    return delay(db.marks.filter((m) => m.subject_id === subjectId));
  },
  async upsertMark(m: Omit<MarkRecord, 'id'> & { id?: string }): Promise<void> {
    if (m.id) {
      db.marks = db.marks.map((rec) => (rec.id === m.id ? { ...rec, ...m } as MarkRecord : rec));
    } else {
      const existing = db.marks.find((rec) => rec.student_id === m.student_id && rec.subject_id === m.subject_id && rec.exam_type === m.exam_type && rec.academic_year === m.academic_year);
      if (existing) {
        existing.marks_obtained = m.marks_obtained;
        existing.max_marks = m.max_marks;
      } else {
        db.marks.push({ ...m, id: uid('mark') } as MarkRecord);
      }
    }
    persist();
    return delay(undefined);
  },

  // ---------- Announcements ----------
  async getAnnouncements(): Promise<Announcement[]> {
    return delay([...db.announcements].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
  },
  async addAnnouncement(a: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    const rec: Announcement = { ...a, id: uid('ann'), created_at: new Date().toISOString() };
    db.announcements.unshift(rec); persist(); return delay(rec);
  },
  async deleteAnnouncement(id: string): Promise<void> {
    db.announcements = db.announcements.filter((a) => a.id !== id); persist(); return delay(undefined);
  },
};

// ============================================================
// Export active implementation
// ============================================================
export const dataService = isSupabaseConfigured ? supabaseDataService : mockDataService;
