import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, BookOpen, TrendingUp, CalendarCheck, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Course, Department, Subject, Enrollment, AttendanceRecord, MarkRecord } from '@/types';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge, { statusTone } from '@/components/ui/Badge';
import { attendancePercentage, attendanceStatusLabel, calculateCGPA, gradeForPercentage, isPassing, subjectPercentage } from '@/utils/calculations';
import { ATTENDANCE_THRESHOLDS, GRADING_CONFIG } from '@/lib/config';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await dataService.getStudentByUserId(user.id);
        setMe(s || null);

        const [courses, depts, subs, enr, att, mk] = await Promise.all([
          dataService.getCourses(),
          dataService.getDepartments(),
          dataService.getSubjects(),
          s ? dataService.getEnrollmentsForStudent(s.id) : dataService.getEnrollments(),
          s ? dataService.getAttendanceForStudent(s.id) : dataService.getAttendance(),
          s ? dataService.getMarksForStudent(s.id) : dataService.getMarks(),
        ]);

        setCourse(courses.find((c) => c.id === s?.course_id) || null);
        setDepartment(depts.find((d) => d.id === s?.department_id) || null);

        const myEnrolledSubIds = new Set(enr.filter((e) => !s || e.student_id === s.id).map((e) => e.subject_id));
        const mySubs = subs.filter((sub) => myEnrolledSubIds.has(sub.id));
        setSubjects(mySubs.length > 0 ? mySubs : (s ? subs.filter((sub) => sub.course_id === s.course_id && sub.semester === s.semester) : []));

        setEnrollments(s ? enr.filter((e) => e.student_id === s.id) : enr);
        setAttendance(s ? att.filter((a) => a.student_id === s.id) : att);
        setMarks(s ? mk.filter((m) => m.student_id === s.id) : mk);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const overallAttendance = attendance.length ? attendancePercentage(attendance) : 0;

  const subjectResults = useMemo(() => subjects.map((sub) => {
    const m = marks.filter((mk) => mk.subject_id === sub.id);
    const pct = subjectPercentage(m);
    return { subject: sub, pct, credits: sub.credits, hasMarks: m.length > 0 };
  }), [subjects, marks]);

  const sgpa = useMemo(() => calculateCGPA(subjectResults.filter((r) => r.hasMarks).map((r) => ({ credits: r.credits, percentage: r.pct }))), [subjectResults]);
  const cgpa = sgpa;
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);

  const marksChartData = subjectResults.map((r) => ({ name: r.subject.code, marks: r.pct }));
  const attendanceChartData = subjects.map((sub) => ({ name: sub.code, pct: attendancePercentage(attendance.filter((a) => a.subject_id === sub.id)) }));
  const radarData = subjectResults.slice(0, 6).map((r) => ({ subject: r.subject.code, score: r.pct }));

  const progression = useMemo(() => {
    const order: MarkRecord['exam_type'][] = ['Assignment', 'Internal', 'Midterm', 'Final'];
    return order.map((type) => {
      const relevant = marks.filter((m) => m.exam_type === type);
      return { stage: type, pct: subjectPercentage(relevant) };
    });
  }, [marks]);

  const atRisk = useMemo(() => subjects.map((sub) => {
    const att = attendancePercentage(attendance.filter((a) => a.subject_id === sub.id));
    const m = marks.filter((mk) => mk.subject_id === sub.id);
    const pct = subjectPercentage(m);
    const reasons: string[] = [];
    if (attendance.some((a) => a.subject_id === sub.id) && att < ATTENDANCE_THRESHOLDS.warning) reasons.push(`Attendance is ${att}%, below the ${ATTENDANCE_THRESHOLDS.warning}% warning threshold.`);
    if (m.length > 0 && pct < GRADING_CONFIG.passingPercentage) reasons.push(`Marks average is ${pct}%, below the ${GRADING_CONFIG.passingPercentage}% passing threshold.`);
    return { subject: sub, reasons };
  }).filter((r) => r.reasons.length > 0), [subjects, attendance, marks]);

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  const displayName = me?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white shadow-card">
        <h1 className="text-xl font-bold">Welcome back, {displayName} 👋</h1>
        <p className="mt-1 text-sm text-primary-100">
          {me
            ? `${me.student_id} · ${course?.name || 'Department of ' + (department?.name || 'Studies')} · Semester ${me.semester}`
            : `${user?.email} · Student Portal`}
        </p>
      </div>

      {!me && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">No student profile is linked to this account.</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Your login credentials are valid, but an administrator has not yet assigned your course and department profile. Please contact your campus administrator.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Current SGPA" value={sgpa.toFixed(2)} icon={Award} tone="violet" />
        <StatCard label="Overall CGPA" value={cgpa.toFixed(2)} icon={TrendingUp} tone="blue" />
        <StatCard label="Avg Attendance" value={`${overallAttendance}%`} icon={CalendarCheck} tone={overallAttendance >= ATTENDANCE_THRESHOLDS.safe ? 'green' : 'amber'} />
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} tone="blue" />
        <StatCard label="Credits" value={totalCredits} icon={BookOpen} tone="amber" />
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">No Subjects Enrolled Yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You do not currently have any active subject enrollments for this semester.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Subject-wise Marks" subtitle="Aggregate percentage per subject">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={marksChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="marks" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Attendance % by Subject">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="pct" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Performance Trend" subtitle="Average marks by assessment stage">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={progression}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Line type="monotone" dataKey="pct" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Subject Performance Radar">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-slate-200 dark:stroke-slate-800" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Attendance Summary">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr><th className="py-2">Subject</th><th>Present</th><th>Total</th><th>%</th><th>Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjects.map((sub) => {
                    const recs = attendance.filter((a) => a.subject_id === sub.id);
                    const present = recs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
                    const pct = attendancePercentage(recs);
                    return (
                      <tr key={sub.id}>
                        <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{sub.name}</td>
                        <td>{present}</td>
                        <td>{recs.length}</td>
                        <td>{recs.length ? `${pct}%` : '—'}</td>
                        <td>{recs.length ? <Badge tone={statusTone(attendanceStatusLabel(pct))}>{attendanceStatusLabel(pct)}</Badge> : <Badge tone="gray">Not recorded</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Performance Summary">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr><th className="py-2">Subject</th><th>Marks %</th><th>Grade</th><th>Credits</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjectResults.map((r) => (
                    <tr key={r.subject.id}>
                      <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{r.subject.name}</td>
                      <td>{r.hasMarks ? `${r.pct}%` : 'Pending'}</td>
                      <td>{r.hasMarks ? <Badge tone={gradeForPercentage(r.pct).grade === 'F' ? 'red' : 'blue'}>{gradeForPercentage(r.pct).grade}</Badge> : <Badge tone="gray">Awaited</Badge>}</td>
                      <td>{r.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Academic Risk" subtitle="Based on measurable attendance and marks thresholds only">
            {atRisk.length === 0 ? (
              <p className="py-6 text-center text-sm text-emerald-600">No subjects currently below the attendance or passing thresholds. Keep it up!</p>
            ) : (
              <ul className="space-y-3">
                {atRisk.map((r) => (
                  <li key={r.subject.id} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{r.subject.name}</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700 dark:text-amber-400">
                        {r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
