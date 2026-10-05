import { useEffect, useMemo, useState } from 'react';
import { dataService } from '@/services/dataService';
import type { Student, Subject, MarkRecord } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Select from '@/components/ui/Select';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import { subjectPercentage, gradeForPercentage, isPassing } from '@/utils/calculations';

export default function AdminPerformance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [s, sub, m] = await Promise.all([dataService.getStudents(), dataService.getSubjects(), dataService.getMarks()]);
      setStudents(s); setSubjects(sub); setMarks(m);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => students
    .filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()))
    .map((s) => {
      const relevant = marks.filter((m) => m.student_id === s.id && (subjectFilter === 'all' || m.subject_id === subjectFilter));
      const pct = subjectPercentage(relevant);
      const { grade } = gradeForPercentage(pct);
      return { student: s, pct, grade, count: relevant.length };
    })
    .filter((r) => r.count > 0), [students, marks, subjectFilter, search]);

  const columns: Column<typeof rows[number]>[] = [
    { key: 'name', header: 'Student', render: (r) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{r.student.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{r.student.student_id}</p></div>
    ) },
    { key: 'pct', header: 'Percentage', render: (r) => `${r.pct}%` },
    { key: 'grade', header: 'Grade', render: (r) => <Badge tone={r.grade === 'F' ? 'red' : r.grade.startsWith('A') ? 'green' : 'blue'}>{r.grade}</Badge> },
    { key: 'status', header: 'Result', render: (r) => <Badge tone={isPassing(r.pct) ? 'green' : 'red'}>{isPassing(r.pct) ? 'Passing' : 'Below Passing'}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Performance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Aggregate marks across all recorded exams.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-56">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <DataTable columns={columns} rows={rows} keyField={(r) => r.student.id} loading={loading} />
    </div>
  );
}
