import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Student, Enrollment, MarkRecord, ExamType } from '@/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EXAM_TYPES } from '@/lib/config';
import { CheckCircle2, Save } from 'lucide-react';
import { classNames } from '@/utils/format';

const MAX_BY_EXAM: Record<ExamType, number> = { Assignment: 20, Internal: 20, Midterm: 30, Practical: 25, Final: 100 };
const ACADEMIC_YEAR = '2025-2026';

export default function FacultyMarks() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [existingMarks, setExistingMarks] = useState<MarkRecord[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState<ExamType>('Assignment');
  // Raw input text per student; '' means "not entered" (never silently saved as 0).
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
        const [sub, st, enr] = await Promise.all([dataService.getSubjects(), dataService.getStudents(), dataService.getEnrollments()]);
        const mySubjects = sub.filter((s) => s.faculty_id === f?.id);
        setSubjects(mySubjects);
        setStudents(st);
        setEnrollments(enr);
        if (mySubjects[0]) setSubjectId(mySubjects[0].id);
      } catch (err) {
        console.error('Failed to load faculty marks data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const allEnrolled = useMemo(() => {
    const ids = new Set(enrollments.filter((e) => e.subject_id === subjectId).map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id));
  }, [enrollments, students, subjectId]);

  const enrolledStudents = useMemo(
    () => allEnrolled.filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase())),
    [allEnrolled, search],
  );

  const loadMarks = async (sid: string, exam: ExamType) => {
    const all = await dataService.getMarksForSubject(sid);
    setExistingMarks(all);
    const map: Record<string, string> = {};
    all.filter((m) => m.exam_type === exam).forEach((m) => { map[m.student_id] = String(m.marks_obtained); });
    setValues(map);
  };

  useEffect(() => { if (subjectId) loadMarks(subjectId, examType); }, [subjectId, examType]);

  const maxMarks = MAX_BY_EXAM[examType];

  // How many enrolled students already have each assessment recorded (drives the completion strip).
  const completion = useMemo(() => EXAM_TYPES.map((t) => {
    const done = allEnrolled.filter((s) => existingMarks.some((m) => m.student_id === s.id && m.exam_type === t)).length;
    return { type: t as ExamType, done, total: allEnrolled.length };
  }), [allEnrolled, existingMarks]);

  const invalid = (raw: string | undefined) => {
    if (raw === undefined || raw === '') return false;
    const n = Number(raw);
    return isNaN(n) || n < 0 || n > maxMarks;
  };
  const hasInvalid = enrolledStudents.some((s) => invalid(values[s.id]));

  const save = async () => {
    if (hasInvalid) return;
    setSaving(true);
    const subject = subjects.find((s) => s.id === subjectId);
    for (const s of enrolledStudents) {
      const raw = values[s.id];
      if (raw === undefined || raw === '') continue;
      const existing = existingMarks.find((m) => m.student_id === s.id && m.exam_type === examType);
      await dataService.upsertMark({
        id: existing?.id, student_id: s.id, subject_id: subjectId, exam_type: examType,
        marks_obtained: Number(raw), max_marks: maxMarks,
        semester: subject?.semester || 1, academic_year: existing?.academic_year || ACADEMIC_YEAR,
      });
    }
    await loadMarks(subjectId, examType); // refresh so the completion strip and ids are current
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <LoadingSpinner />;

  const cur = completion.find((c) => c.type === examType);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enter Marks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Record assignment, internal, midterm, practical or final marks. Saved marks appear immediately in each student's portal.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-64">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {completion.map((c) => {
          const full = c.total > 0 && c.done === c.total;
          return (
            <button
              key={c.type}
              onClick={() => setExamType(c.type)}
              className={classNames(
                'rounded-xl border px-3 py-2 text-left transition-colors',
                examType === c.type ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800',
              )}
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.type} <span className="text-slate-400">(/{MAX_BY_EXAM[c.type]})</span></p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.done}/{c.total}</span>
                <Badge tone={full ? 'green' : c.done > 0 ? 'yellow' : 'gray'}>{full ? 'Complete' : c.done > 0 ? 'Partial' : 'Not started'}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        {enrolledStudents.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-400">No students enrolled in this subject.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">{examType} marks (/ {maxMarks})</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrolledStudents.map((s) => {
                const recorded = existingMarks.some((m) => m.student_id === s.id && m.exam_type === examType);
                const bad = invalid(values[s.id]);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{s.full_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{s.student_id}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number" min={0} max={maxMarks} step="0.5"
                        value={values[s.id] ?? ''}
                        onChange={(e) => setValues({ ...values, [s.id]: e.target.value })}
                        className={classNames('w-24 rounded-lg border bg-white px-2 py-1 text-sm dark:bg-slate-800 dark:text-slate-100', bad ? 'border-red-500' : 'border-slate-300 dark:border-slate-700')}
                      />
                      {bad && <span className="ml-2 text-xs text-red-600">0–{maxMarks} only</span>}
                    </td>
                    <td className="px-4 py-2.5">{recorded ? <Badge tone="green">Visible to student</Badge> : <Badge tone="gray">Pending</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button icon={<Save className="h-4 w-4" />} onClick={save} loading={saving} disabled={enrolledStudents.length === 0 || hasInvalid}>Save Marks</Button>
        {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
        {cur && <Badge tone={cur.done === cur.total && cur.total > 0 ? 'green' : 'blue'}>{cur.done}/{cur.total} students have {examType} marks</Badge>}
      </div>
    </div>
  );
}
