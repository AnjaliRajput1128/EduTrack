import { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Student, Enrollment, AttendanceRecord, MarkRecord } from '@/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { attendancePercentage, subjectPercentage, gradeForPercentage } from '@/utils/calculations';
import { exportToCsv } from '@/utils/exportCsv';
import { EXAM_TYPES } from '@/lib/config';

export default function FacultyReports() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
      const [sub, st, enr, att, mk] = await Promise.all([
        dataService.getSubjects(), dataService.getStudents(), dataService.getEnrollments(), dataService.getAttendance(), dataService.getMarks(),
      ]);
      const mySubjects = sub.filter((s) => s.faculty_id === f?.id);
      setSubjects(mySubjects); setStudents(st); setEnrollments(enr); setAttendance(att); setMarks(mk);
      if (mySubjects[0]) setSubjectId(mySubjects[0].id);
      setLoading(false);
    })();
  }, [user]);

  const rows = useMemo(() => {
    const ids = new Set(enrollments.filter((e) => e.subject_id === subjectId).map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id)).map((s) => {
      const att = attendance.filter((a) => a.student_id === s.id && a.subject_id === subjectId);
      const mk = marks.filter((m) => m.student_id === s.id && m.subject_id === subjectId);
      const pct = subjectPercentage(mk);
      const exams: Record<string, string> = {};
      EXAM_TYPES.forEach((t) => { const r = mk.find((x) => x.exam_type === t); exams[t] = r ? `${r.marks_obtained}/${r.max_marks}` : 'Pending'; });
      return {
        'Student ID': s.student_id, Name: s.full_name, ...exams,
        'Attendance %': att.length ? attendancePercentage(att) : 'Not recorded',
        'Marks %': mk.length ? pct : 'Pending',
        Grade: mk.length ? gradeForPercentage(pct).grade : 'Pending',
      };
    });
  }, [enrollments, students, attendance, marks, subjectId]);

  const columns: Column<Record<string, string | number>>[] = rows.length
    ? Object.keys(rows[0]).map((k) => ({ key: k, header: k, render: (r) => String(r[k]) }))
    : [];

  const subjectName = subjects.find((s) => s.id === subjectId)?.name || 'Subject Report';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Attendance and marks summary for your subjects.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print</Button>
          <Button icon={<Download className="h-4 w-4" />} onClick={() => exportToCsv(subjectName, rows)}>Export CSV</Button>
        </div>
      </div>
      <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-64 print:hidden">
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <h2 className="hidden text-lg font-bold print:block">{subjectName}</h2>
      <DataTable columns={columns} rows={rows} keyField={(r) => JSON.stringify(r)} />
    </div>
  );
}
