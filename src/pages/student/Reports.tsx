import { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Course, Department, Subject, AttendanceRecord, MarkRecord } from '@/types';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { attendancePercentage, calculateCGPA, gradeForPercentage, subjectPercentage } from '@/utils/calculations';
import { EXAM_TYPES } from '@/lib/config';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDate } from '@/utils/format';

export default function StudentReports() {
  const { user } = useAuth();
  const [me, setMe] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await dataService.getStudentByUserId(user.id);
      setMe(s || null);
      const [courses, depts, subs, enr, att, mk] = await Promise.all([
        dataService.getCourses(), dataService.getDepartments(), dataService.getSubjects(),
        s ? dataService.getEnrollmentsForStudent(s.id) : Promise.resolve([]),
        s ? dataService.getAttendanceForStudent(s.id) : Promise.resolve([]),
        s ? dataService.getMarksForStudent(s.id) : Promise.resolve([]),
      ]);
      setCourse(courses.find((c) => c.id === s?.course_id) || null);
      setDepartment(depts.find((d) => d.id === s?.department_id) || null);
      const subIds = new Set(enr.map((e) => e.subject_id));
      setSubjects(subs.filter((x) => subIds.has(x.id)));
      setAttendance(att);
      setMarks(mk);
      setLoading(false);
    })();
  }, [user]);

  const rows = useMemo(() => subjects.map((s) => {
    const m = marks.filter((mk) => mk.subject_id === s.id);
    const a = attendance.filter((att) => att.subject_id === s.id);
    const pct = subjectPercentage(m);
    const exams: Record<string, string> = {};
    EXAM_TYPES.forEach((t) => { const r = m.find((x) => x.exam_type === t); exams[t] = r ? `${r.marks_obtained}/${r.max_marks}` : 'Pending'; });
    return {
      Subject: s.name, Code: s.code, Credits: s.credits, ...exams,
      'Attendance %': a.length ? attendancePercentage(a) : 'Not recorded',
      'Marks %': m.length ? pct : 'Pending',
      Grade: m.length ? gradeForPercentage(pct).grade : 'Pending',
    };
  }), [subjects, marks, attendance]);

  const cgpa = useMemo(() => calculateCGPA(subjects.filter((s) => marks.some((m) => m.subject_id === s.id)).map((s) => ({ credits: s.credits, percentage: subjectPercentage(marks.filter((m) => m.subject_id === s.id)) }))), [subjects, marks]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your academic transcript and attendance summary.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print</Button>
          <Button icon={<Download className="h-4 w-4" />} onClick={() => exportToCsv(`${me?.student_id}_transcript`, rows)}>Export CSV</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Transcript</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{me?.full_name} · {me?.student_id}</p>
            <p className="text-xs text-slate-400">{course?.name} · {department?.name} · Semester {me?.semester}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Generated</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(new Date().toISOString())}</p>
            <Badge tone="blue">CGPA {cgpa.toFixed(2)}</Badge>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400"><tr><th className="py-2">Subject</th><th>Credits</th>{EXAM_TYPES.map((t) => <th key={t}>{t}</th>)}<th>Attendance</th><th>Marks %</th><th>Grade</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.Code}>
                <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{r.Subject}</td>
                <td>{r.Credits}</td>
                {EXAM_TYPES.map((t) => {
                  const val = (r as Record<string, any>)[t];
                  return <td key={t} className={val === 'Pending' ? 'text-slate-400' : ''}>{val}</td>;
                })}
                <td>{typeof r['Attendance %'] === 'number' ? `${r['Attendance %']}%` : <span className="text-slate-400">{r['Attendance %']}</span>}</td>
                <td>{typeof r['Marks %'] === 'number' ? `${r['Marks %']}%` : <span className="text-slate-400">Pending</span>}</td>
                <td><Badge tone={r.Grade === 'F' ? 'red' : r.Grade === 'Pending' ? 'gray' : 'blue'}>{r.Grade}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
