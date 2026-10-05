import { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, BookMarked, BookOpen, CalendarCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { dataService } from '@/services/dataService';
import type { Student, Faculty, Course, Subject, Department, AttendanceRecord, MarkRecord } from '@/types';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { attendancePercentage, attendanceStatusLabel, subjectPercentage } from '@/utils/calculations';

const COLORS = ['#2563eb', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, f, c, sub, dep, att, mk] = await Promise.all([
          dataService.getStudents(),
          dataService.getFaculty(),
          dataService.getCourses(),
          dataService.getSubjects(),
          dataService.getDepartments(),
          dataService.getAttendance(),
          dataService.getMarks(),
        ]);
        setStudents(s);
        setFaculty(f);
        setCourses(c);
        setSubjects(sub);
        setDepartments(dep);
        setAttendance(att);
        setMarks(mk);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avgAttendance = useMemo(() => attendance.length ? attendancePercentage(attendance) : 0, [attendance]);
  const avgPerformance = useMemo(() => {
    if (!marks.length) return 0;
    const totalObtained = marks.reduce((s, m) => s + m.marks_obtained, 0);
    const totalMax = marks.reduce((s, m) => s + m.max_marks, 0);
    return totalMax ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  }, [marks]);

  const enrollmentByDept = useMemo(() => departments.map((d) => ({
    name: d.code,
    students: students.filter((s) => s.department_id === d.id).length,
  })), [departments, students]);

  const attendanceTrend = useMemo(() => {
    const byDate: Record<string, { present: number; total: number }> = {};
    attendance.forEach((a) => {
      byDate[a.date] = byDate[a.date] || { present: 0, total: 0 };
      byDate[a.date].total += 1;
      if (a.status === 'Present' || a.status === 'Late') byDate[a.date].present += 1;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date: date.slice(5), pct: Math.round((v.present / v.total) * 100) }));
  }, [attendance]);

  const performanceByCourse = useMemo(() => courses.map((c) => {
    const studentIds = students.filter((s) => s.course_id === c.id).map((s) => s.id);
    const relevant = marks.filter((m) => studentIds.includes(m.student_id));
    const pct = relevant.length ? subjectPercentage(relevant) : 0;
    return { name: c.code, avg: pct };
  }), [courses, students, marks]);

  const riskDistribution = useMemo(() => {
    const studentAvgAttendance = students.map((s) => attendancePercentage(attendance.filter((a) => a.student_id === s.id)));
    const buckets = { Safe: 0, Warning: 0, Critical: 0 };
    studentAvgAttendance.forEach((pct) => { buckets[attendanceStatusLabel(pct)] += 1; });
    return [
      { name: 'Safe', value: buckets.Safe },
      { name: 'Warning', value: buckets.Warning },
      { name: 'Critical', value: buckets.Critical },
    ];
  }, [students, attendance]);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System-wide overview across all departments and courses.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Students" value={students.length} icon={Users} tone="blue" />
        <StatCard label="Faculty" value={faculty.length} icon={GraduationCap} tone="violet" />
        <StatCard label="Courses" value={courses.length} icon={BookMarked} tone="amber" />
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} tone="green" />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} icon={CalendarCheck} tone={avgAttendance >= 75 ? 'green' : 'amber'} />
        <StatCard label="Avg Performance" value={`${avgPerformance}%`} icon={TrendingUp} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Student Enrollment by Department" subtitle="Active students per department">
          {students.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No students enrolled yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollmentByDept}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Attendance Trend" subtitle="Overall attendance rate, last 14 recorded days">
          {attendanceTrend.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No attendance data logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Average Performance by Course" subtitle="Aggregated marks across all exams">
          {courses.length === 0 || marks.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No marks recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={performanceByCourse}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="avg" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Student Attendance Risk Profile" subtitle="Safe (≥ 75%), Warning (60–74%), Critical (< 60%)">
          {students.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No students available for risk calculation.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
