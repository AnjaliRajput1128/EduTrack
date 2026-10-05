import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Subject, MarkRecord } from '@/types';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartCard from '@/components/ui/ChartCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { gradeForPercentage, isPassing, subjectPercentage, calculateCGPA, examCompletion } from '@/utils/calculations';
import { EXAM_TYPES } from '@/lib/config';

export default function MyPerformance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await dataService.getStudentByUserId(user.id);
      const [sub, mk, enr] = await Promise.all([
        dataService.getSubjects(),
        s ? dataService.getMarksForStudent(s.id) : Promise.resolve([]),
        s ? dataService.getEnrollmentsForStudent(s.id) : Promise.resolve([]),
      ]);
      // Every enrolled subject is listed, even if the faculty has not entered marks yet.
      const mySubIds = new Set([...enr.map((e) => e.subject_id), ...mk.map((m) => m.subject_id)]);
      setSubjects(sub.filter((x) => mySubIds.has(x.id)));
      setMarks(mk);
      setLoading(false);
    })();
  }, [user]);

  const subjectResults = useMemo(() => subjects
    .filter((s) => subjectFilter === 'all' || s.id === subjectFilter)
    .map((s) => {
      const m = marks.filter((mk) => mk.subject_id === s.id);
      const pct = subjectPercentage(m);
      return { subject: s, marksByType: m, pct, grade: gradeForPercentage(pct).grade, hasMarks: m.length > 0, completion: examCompletion(m) };
    }), [subjects, marks, subjectFilter]);

  const cgpa = useMemo(() => calculateCGPA(subjectResults.filter((r) => r.hasMarks).map((r) => ({ credits: r.subject.credits, percentage: r.pct }))), [subjectResults]);

  const chartData = subjectResults.map((r) => {
    const row: Record<string, string | number> = { name: r.subject.code };
    EXAM_TYPES.forEach((type) => {
      const rec = r.marksByType.find((m) => m.exam_type === type);
      row[type] = rec ? Math.round((rec.marks_obtained / rec.max_marks) * 100) : 0;
    });
    return row;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Performance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overall GPA: <b>{cgpa.toFixed(2)}</b> / 10</p>
        </div>
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-56">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      <ChartCard title="Marks by Exam Type (%)" subtitle="Per subject, normalized to 100%">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {EXAM_TYPES.map((type, i) => (
              <Bar key={type} dataKey={type} fill={['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="space-y-3">
        {subjectResults.map((r) => (
          <div key={r.subject.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{r.subject.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.subject.code} · {r.subject.credits} credits</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.completion.complete ? 'green' : 'yellow'}>{r.completion.entered}/{r.completion.total} assessed</Badge>
                {r.hasMarks ? (
                  <>
                    <Badge tone={r.grade === 'F' ? 'red' : r.grade.startsWith('A') ? 'green' : 'blue'}>{r.grade}</Badge>
                    <Badge tone={isPassing(r.pct) ? 'green' : 'red'}>{isPassing(r.pct) ? 'Passing' : 'Below Passing'}</Badge>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{r.pct}%</span>
                  </>
                ) : <Badge tone="gray">Marks awaited</Badge>}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {EXAM_TYPES.map((type) => {
                const rec = r.marksByType.find((m) => m.exam_type === type);
                return (
                  <div key={type} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800">
                    <p className="text-[11px] text-slate-400">{type}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{rec ? `${rec.marks_obtained}/${rec.max_marks}` : 'Pending'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
