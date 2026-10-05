import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import DashboardLayout from '@/layouts/DashboardLayout';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import RoleRedirect from '@/pages/RoleRedirect';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminStudents from '@/pages/admin/Students';
import AdminFaculty from '@/pages/admin/Faculty';
import AdminDepartments from '@/pages/admin/Departments';
import AdminCourses from '@/pages/admin/Courses';
import AdminSubjects from '@/pages/admin/Subjects';
import AdminAttendance from '@/pages/admin/Attendance';
import AdminPerformance from '@/pages/admin/Performance';
import AdminReports from '@/pages/admin/Reports';
import AdminAnnouncements from '@/pages/admin/Announcements';
import AdminSettings from '@/pages/admin/Settings';

import FacultyDashboard from '@/pages/faculty/FacultyDashboard';
import MySubjects from '@/pages/faculty/MySubjects';
import FacultyStudents from '@/pages/faculty/Students';
import FacultyAttendance from '@/pages/faculty/Attendance';
import FacultyMarks from '@/pages/faculty/Marks';
import FacultyPerformance from '@/pages/faculty/Performance';
import FacultyAnnouncements from '@/pages/faculty/Announcements';
import FacultyReports from '@/pages/faculty/Reports';

import StudentDashboard from '@/pages/student/StudentDashboard';
import MyAttendance from '@/pages/student/MyAttendance';
import MyPerformance from '@/pages/student/MyPerformance';
import StudentSubjects from '@/pages/student/Subjects';
import Timetable from '@/pages/student/Timetable';
import StudentAnnouncements from '@/pages/student/Announcements';
import StudentReports from '@/pages/student/Reports';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/redirect" element={<RoleRedirect />} />

            <Route path="/admin" element={<DashboardLayout role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="faculty" element={<AdminFaculty />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="performance" element={<AdminPerformance />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/faculty" element={<DashboardLayout role="faculty" />}>
              <Route index element={<FacultyDashboard />} />
              <Route path="subjects" element={<MySubjects />} />
              <Route path="students" element={<FacultyStudents />} />
              <Route path="attendance" element={<FacultyAttendance />} />
              <Route path="marks" element={<FacultyMarks />} />
              <Route path="performance" element={<FacultyPerformance />} />
              <Route path="announcements" element={<FacultyAnnouncements />} />
              <Route path="reports" element={<FacultyReports />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/student" element={<DashboardLayout role="student" />}>
              <Route index element={<StudentDashboard />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="performance" element={<MyPerformance />} />
              <Route path="subjects" element={<StudentSubjects />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="reports" element={<StudentReports />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
