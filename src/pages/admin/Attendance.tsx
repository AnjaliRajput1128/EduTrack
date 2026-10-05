import { useEffect, useMemo, useState } from 'react';
import { dataService } from '@/services/dataService';
import type { Student, Subject, AttendanceRecord, AttendanceStatus } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Select from '@/components/ui/Select';
import SearchBar from '@/components/ui/SearchBar';
import Badge, { statusTone } from '@/components/ui/Badge';
import { attendancePercentage, attendanceStatusLabel } from '@/utils/calculations';
import { ATTENDANCE_THRESHOLDS } from '@/lib/config';

export default function AdminAttendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [s, sub, att] = await Promise.all([dataService.getStudents(), dataService.getSubjects(), dataService.getAttendance()]);
      setStudents(s); setSubjects(sub); setAttendance(att);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => {
    return students
      .filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()))
      .map((s) => {
        const recs = attendance.filter((a) => a.student_id === s.id && (subjectFilter === 'all' || a.subject_id === subjectFilter));
        const pct = attendancePercentage(recs);
        const present = recs.filter((r) => r.status === 'Present').length;
        const absent = recs.filter((r) => r.status === 'Absent').length;
        const late = recs.filter((r) => r.status === 'Late').length;
        return { student: s, total: recs.length, present, absent, late, pct };
      })
      .filter((r) => r.total > 0 || subjectFilter === 'all');
  }, [students, attendance, subjectFilter, search]);

  const columns: Column<typeof rows[number]>[] = [
    { key: 'name', header: 'Student', render: (r) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{r.student.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{r.student.student_id}</p></div>
    ) },
    { key: 'total', header: 'Total Classes', render: (r) => r.total },
    { key: 'present', header: 'Present', render: (r) => r.present },
    { key: 'absent', header: 'Absent', render: (r) => r.absent },
    { key: 'late', header: 'Late', render: (r) => r.late },
    { key: 'pct', header: 'Attendance %', render: (r) => <span className="font-semibold">{r.pct}%</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(attendanceStatusLabel(r.pct))}>{attendanceStatusLabel(r.pct)}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Thresholds: Safe ≥ {ATTENDANCE_THRESHOLDS.safe}%, Warning ≥ {ATTENDANCE_THRESHOLDS.warning}%, otherwise Critical. Configurable in Settings.
        </p>
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
