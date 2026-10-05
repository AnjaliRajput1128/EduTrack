import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Student, Enrollment, MarkRecord } from '@/types';
import Select from '@/components/ui/Select';
import ChartCard from '@/components/ui/ChartCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { gradeForPercentage, subjectPercentage, isPassing } from '@/utils/calculations';

export default function FacultyPerformance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
      const [sub, st, enr, mk] = await Promise.all([dataService.getSubjects(), dataService.getStudents(), dataService.getEnrollments(), dataService.getMarks()]);
      const mySubjects = sub.filter((s) => s.faculty_id === f?.id);
      setSubjects(mySubjects); setStudents(st); setEnrollments(enr); setMarks(mk);
      if (mySubjects[0]) setSubjectId(mySubjects[0].id);
      setLoading(false);
    })();
  }, [user]);

  const studentRows = useMemo(() => {
    const ids = new Set(enrollments.filter((e) => e.subject_id === subjectId).map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id)).map((s) => {
      const m = marks.filter((mk) => mk.student_id === s.id && mk.subject_id === subjectId);
      const pct = subjectPercentage(m);
      return { student: s, pct, hasMarks: m.length > 0, grade: m.length ? gradeForPercentage(pct).grade : 'Pending' };
    });
  }, [enrollments, students, marks, subjectId]);

  const distribution = useMemo(() => {
    const buckets: Record<string, number> = { 'A+/A': 0, 'B+/B': 0, 'C/D': 0, F: 0 };
    studentRows.filter((r) => r.hasMarks).forEach((r) => {
      if (r.grade.startsWith('A')) buckets['A+/A']++;
      else if (r.grade.startsWith('B')) buckets['B+/B']++;
      else if (r.grade === 'F') buckets.F++;
      else buckets['C/D']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [studentRows]);

  const columns: Column<typeof studentRows[number]>[] = [
    { key: 'name', header: 'Student', render: (r) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{r.student.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{r.student.student_id}</p></div>
    ) },
    { key: 'pct', header: 'Percentage', render: (r) => (r.hasMarks ? `${r.pct}%` : <span className="text-slate-400">Pending</span>) },
    { key: 'grade', header: 'Grade', render: (r) => <Badge tone={!r.hasMarks ? 'gray' : r.grade === 'F' ? 'red' : r.grade.startsWith('A') ? 'green' : 'blue'}>{r.grade}</Badge> },
    { key: 'result', header: 'Result', render: (r) => (r.hasMarks ? <Badge tone={isPassing(r.pct) ? 'green' : 'red'}>{isPassing(r.pct) ? 'Passing' : 'Below Passing'}</Badge> : <Badge tone="gray">Marks awaited</Badge>) },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Performance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Student performance for your subjects.</p>
      </div>
      <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-64">
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>

      <ChartCard title="Grade Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={columns} rows={studentRows} keyField={(r) => r.student.id} />
    </div>
  );
}
