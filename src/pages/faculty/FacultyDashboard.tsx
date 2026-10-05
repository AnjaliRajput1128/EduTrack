import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, CalendarClock, ClipboardCheck, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Enrollment, AttendanceRecord, MarkRecord, TimetableEntry } from '@/types';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { attendancePercentage, subjectPercentage } from '@/utils/calculations';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState<Faculty | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const f = await dataService.getFacultyByUserId(user.id);
        setMe(f || null);

        const [sub, enr, att, mk, tt] = await Promise.all([
          dataService.getSubjects(),
          dataService.getEnrollments(),
          dataService.getAttendance(),
          dataService.getMarks(),
          dataService.getTimetable(),
        ]);

        const mySubs = sub.filter((s) => s.faculty_id === f?.id);
        setSubjects(mySubs);
        setEnrollments(enr);
        setAttendance(att);
        setMarks(mk);
        setTimetable(tt.filter((t) => t.faculty_id === f?.id));
      } catch (err) {
        console.error('Failed to load faculty dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const mySubjectIds = subjects.map((s) => s.id);
  const myStudentIds = useMemo(
    () => new Set(enrollments.filter((e) => mySubjectIds.includes(e.subject_id)).map((e) => e.student_id)),
    [enrollments, mySubjectIds]
  );
  const myAttendance = attendance.filter((a) => mySubjectIds.includes(a.subject_id));
  const myMarks = marks.filter((m) => mySubjectIds.includes(m.subject_id));

  const avgAttendance = myAttendance.length ? attendancePercentage(myAttendance) : 0;
  const avgMarks = myMarks.length ? subjectPercentage(myMarks) : 0;
  const todayClasses = timetable.filter((t) => t.day === WEEKDAY);

  const subjectPerf = subjects.map((s) => ({
    name: s.code,
    avg: subjectPercentage(marks.filter((m) => m.subject_id === s.id)),
  }));

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  const displayName = me?.full_name?.split(' ')?.slice(-1)[0] || user?.email?.split('@')[0] || 'Faculty';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {me
            ? `${me.designation} · ${me.employee_id}`
            : `${user?.email} · Faculty Portal`}
        </p>
      </div>

      {!me && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">No faculty profile is linked to this account.</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Your login credentials are valid, but an administrator has not yet assigned your faculty employee record or department. Please contact your campus administrator.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Assigned Subjects" value={subjects.length} icon={BookOpen} tone="blue" />
        <StatCard label="Total Students" value={myStudentIds.size} icon={Users} tone="violet" />
        <StatCard label="Today's Classes" value={todayClasses.length} icon={CalendarClock} tone="amber" />
        <StatCard label="Avg Class Attendance" value={`${avgAttendance}%`} icon={ClipboardCheck} tone={avgAttendance >= 75 ? 'green' : 'amber'} />
        <StatCard label="Avg Marks" value={`${avgMarks}%`} icon={TrendingUp} tone="blue" />
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">No Subjects Assigned</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You do not currently have any assigned subjects. An administrator can assign subjects to you from the Admin Subjects panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Subject Performance" subtitle="Average marks percentage per subject">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectPerf}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="avg" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Today's Schedule">
            {todayClasses.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No classes scheduled for today.</p>
            ) : (
              <ul className="space-y-2">
                {todayClasses.map((t) => {
                  const sub = subjects.find((s) => s.id === t.subject_id);
                  return (
                    <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{sub?.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{t.start_time}–{t.end_time} · {t.room}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </ChartCard>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/faculty/attendance"><Button>Mark Attendance</Button></Link>
        <Link to="/faculty/marks"><Button variant="outline">Enter Marks</Button></Link>
        <Link to="/faculty/students"><Button variant="outline">View Students</Button></Link>
        <Link to="/faculty/announcements"><Button variant="outline">Create Announcement</Button></Link>
      </div>
    </div>
  );
}
