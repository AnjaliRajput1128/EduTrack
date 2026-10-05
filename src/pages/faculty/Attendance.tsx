import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Student, Enrollment, AttendanceRecord, AttendanceStatus } from '@/types';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CheckCircle2, Check, X, Clock3, FileWarning, Save } from 'lucide-react';
import { classNames } from '@/utils/format';

const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
const STATUS_ICON: Record<AttendanceStatus, typeof Check> = { Present: Check, Absent: X, Late: Clock3, Excused: FileWarning };
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-600 text-white',
  Absent: 'bg-red-600 text-white',
  Late: 'bg-amber-500 text-white',
  Excused: 'bg-slate-500 text-white',
};

export default function FacultyAttendance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [faculty, setFaculty] = useState<Faculty | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
        setFaculty(f || null);
        const [sub, st, enr] = await Promise.all([dataService.getSubjects(), dataService.getStudents(), dataService.getEnrollments()]);
        const mySubjects = sub.filter((s) => s.faculty_id === f?.id);
        setSubjects(mySubjects);
        setStudents(st);
        setEnrollments(enr);
        if (mySubjects[0]) setSubjectId(mySubjects[0].id);
      } catch (err) {
        console.error('Failed to load faculty attendance data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const enrolledStudents = useMemo(() => {
    const ids = new Set(enrollments.filter((e) => e.subject_id === subjectId).map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id)).filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()));
  }, [enrollments, students, subjectId, search]);

  const loadDay = async () => {
    const existing = await dataService.getAttendanceForSubjectDate(subjectId, date);
    const map: Record<string, AttendanceStatus> = {};
    const rem: Record<string, string> = {};
    existing.forEach((e) => { map[e.student_id] = e.status; if (e.remarks) rem[e.student_id] = e.remarks; });
    setStatusMap(map);
    setRemarksMap(rem);
  };
  const loadSessions = async () => setSessions(await dataService.getAttendanceForSubject(subjectId));

  useEffect(() => {
    if (!subjectId) return;
    loadDay();
    loadSessions();
  }, [subjectId, date]);

  // One row per class date already recorded for this subject (what students can see).
  const sessionList = useMemo(() => {
    const byDate: Record<string, { date: string; present: number; total: number }> = {};
    sessions.forEach((r) => {
      const d = (byDate[r.date] ||= { date: r.date, present: 0, total: 0 });
      d.total++;
      if (r.status === 'Present' || r.status === 'Late') d.present++;
    });
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  const setStatus = (studentId: string, status: AttendanceStatus) => setStatusMap((m) => ({ ...m, [studentId]: status }));
  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = { ...statusMap };
    enrolledStudents.forEach((s) => { map[s.id] = status; });
    setStatusMap(map);
  };

  const save = async () => {
    if (!faculty) return;
    setSaving(true);
    const records: Array<Omit<AttendanceRecord, 'id'>> = enrolledStudents
      .filter((s) => statusMap[s.id])
      .map((s) => ({ student_id: s.id, subject_id: subjectId, faculty_id: faculty.id, date, status: statusMap[s.id], remarks: remarksMap[s.id]?.trim() || '' }));
    await dataService.saveAttendanceBulk(records);
    await loadSessions();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mark Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Select a subject and date, then mark each student. Saved records and remarks show up instantly in the student's portal.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-64">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" max={new Date().toISOString().slice(0, 10)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAll('Present')}>Select All Present</Button>
          <Button variant="outline" size="sm" onClick={() => markAll('Absent')}>Mark All Absent</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        {enrolledStudents.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-400">No students enrolled in this subject.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {enrolledStudents.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.student_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    value={remarksMap[s.id] ?? ''}
                    onChange={(e) => setRemarksMap((m) => ({ ...m, [s.id]: e.target.value }))}
                    placeholder="Remark (shown to student)"
                    className="w-44 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {STATUSES.map((st) => {
                    const Icon = STATUS_ICON[st];
                    const active = statusMap[s.id] === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setStatus(s.id, st)}
                        className={classNames(
                          'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                          active ? STATUS_COLOR[st] + ' border-transparent' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" /> {st}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sessionList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Classes already recorded for this subject — click a date to review or correct it</p>
          <div className="flex flex-wrap gap-2">
            {sessionList.slice(0, 30).map((d) => (
              <button key={d.date} onClick={() => setDate(d.date)}
                className={classNames('rounded-lg border px-2.5 py-1 text-xs', d.date === date ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')}>
                {d.date.slice(5)} · {d.present}/{d.total}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button icon={<Save className="h-4 w-4" />} onClick={save} loading={saving} disabled={enrolledStudents.length === 0}>Save Attendance</Button>
        {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
        <Badge tone="blue">{Object.keys(statusMap).filter((id) => enrolledStudents.some((s) => s.id === id)).length}/{enrolledStudents.length} marked</Badge>
      </div>
    </div>
  );
}
