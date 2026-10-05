import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Student, Enrollment, AttendanceRecord, MarkRecord } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Select from '@/components/ui/Select';
import SearchBar from '@/components/ui/SearchBar';
import Badge, { statusTone } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SubjectRecordCard from '@/components/SubjectRecordCard';
import { attendancePercentage, attendanceStatusLabel, subjectPercentage } from '@/utils/calculations';
import { EXAM_TYPES } from '@/lib/config';

export default function FacultyStudents() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
      const [sub, st, enr, att, mk, fac] = await Promise.all([
        dataService.getSubjects(), dataService.getStudents(), dataService.getEnrollments(), dataService.getAttendance(), dataService.getMarks(), dataService.getFaculty(),
      ]);
      setFaculty(fac);
      setSubjects(sub.filter((s) => s.faculty_id === f?.id));
      setStudents(st); setEnrollments(enr); setAttendance(att); setMarks(mk);
      setLoading(false);
    })();
  }, [user]);

  const mySubjectIds = subjects.map((s) => s.id);

  const rows = useMemo(() => {
    const relevantEnr = enrollments.filter((e) => mySubjectIds.includes(e.subject_id) && (subjectFilter === 'all' || e.subject_id === subjectFilter));
    const studentIds = Array.from(new Set(relevantEnr.map((e) => e.student_id)));
    return studentIds
      .map((id) => students.find((s) => s.id === id))
      .filter((s): s is Student => !!s)
      .filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()));
  }, [enrollments, students, mySubjectIds, subjectFilter, search]);

  const statsFor = (studentId: string) => {
    const subIds = subjectFilter === 'all' ? mySubjectIds : [subjectFilter];
    const att = attendance.filter((a) => a.student_id === studentId && subIds.includes(a.subject_id));
    const mk = marks.filter((m) => m.student_id === studentId && subIds.includes(m.subject_id));
    // Assessments entered vs expected across the student's enrolled subjects of this faculty.
    const enrolledIds = subIds.filter((sid) => enrollments.some((e) => e.student_id === studentId && e.subject_id === sid));
    const expected = enrolledIds.length * EXAM_TYPES.length;
    const entered = enrolledIds.reduce((n, sid) => n + new Set(mk.filter((m) => m.subject_id === sid).map((m) => m.exam_type)).size, 0);
    return { attPct: attendancePercentage(att), markPct: subjectPercentage(mk), hasAtt: att.length > 0, hasMarks: mk.length > 0, entered, expected };
  };

  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', render: (s) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{s.student_id}</p></div>
    ) },
    { key: 'email', header: 'Email', render: (s) => s.email },
    { key: 'att', header: 'Attendance', render: (s) => {
      const { attPct, hasAtt } = statsFor(s.id);
      return hasAtt ? <Badge tone={statusTone(attendanceStatusLabel(attPct))}>{attPct}%</Badge> : <Badge tone="gray">Not recorded</Badge>;
    } },
    { key: 'marks', header: 'Avg Marks', render: (s) => { const st = statsFor(s.id); return st.hasMarks ? `${st.markPct}%` : <span className="text-slate-400">Pending</span>; } },
    { key: 'done', header: 'Data entered', render: (s) => {
      const { entered, expected } = statsFor(s.id);
      return <Badge tone={expected > 0 && entered === expected ? 'green' : entered > 0 ? 'yellow' : 'gray'}>{entered}/{expected} assessments</Badge>;
    } },
    { key: 'view', header: '', render: (s) => <button onClick={() => setSelected(s)} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">View student's record</button> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Students</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Students enrolled in your subjects.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-56">
          <option value="all">All My Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <DataTable columns={columns} rows={rows} keyField={(s) => s.id} loading={loading} />

      <Modal open={!!selected} onClose={() => setSelected(null)} size="lg" title={selected ? `${selected.full_name} · ${selected.student_id}` : ''}>
        {selected && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">This is exactly what the student sees in their own login for your subjects.</p>
            {subjects
              .filter((sub) => enrollments.some((e) => e.student_id === selected.id && e.subject_id === sub.id))
              .map((sub) => (
                <SubjectRecordCard
                  key={sub.id}
                  subject={sub}
                  facultyName={faculty.find((f) => f.id === sub.faculty_id)?.full_name}
                  attendance={attendance.filter((a) => a.student_id === selected.id && a.subject_id === sub.id)}
                  marks={marks.filter((m) => m.student_id === selected.id && m.subject_id === sub.id)}
                />
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
