import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Subject, AttendanceRecord, Faculty } from '@/types';
import Select from '@/components/ui/Select';
import Badge, { statusTone } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartCard from '@/components/ui/ChartCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { attendancePercentage, attendanceStatusLabel, attendanceCounts } from '@/utils/calculations';
import { ATTENDANCE_THRESHOLDS } from '@/lib/config';
import { formatDate } from '@/utils/format';

const COLORS: Record<string, string> = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b', Excused: '#64748b' };

export default function MyAttendance() {
  const { user } = useAuth();
  const [me, setMe] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await dataService.getStudentByUserId(user.id);
      setMe(s || null);
      const [sub, att, enr, fac] = await Promise.all([
        dataService.getSubjects(),
        s ? dataService.getAttendanceForStudent(s.id) : Promise.resolve([]),
        s ? dataService.getEnrollmentsForStudent(s.id) : Promise.resolve([]),
        dataService.getFaculty(),
      ]);
      // Show every enrolled subject, not only the ones the faculty has already marked.
      const mySubIds = new Set([...enr.map((e) => e.subject_id), ...att.map((a) => a.subject_id)]);
      setSubjects(sub.filter((x) => mySubIds.has(x.id)));
      setFaculty(fac);
      setAttendance(att);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => attendance.filter((a) => subjectFilter === 'all' || a.subject_id === subjectFilter), [attendance, subjectFilter]);
  const pct = attendancePercentage(filtered);

  const breakdown = useMemo(() => {
    const counts: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    filtered.forEach((a) => { counts[a.status]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const trend = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0, total = 0;
    return sorted.map((a) => {
      total += 1;
      if (a.status === 'Present' || a.status === 'Late') running += 1;
      return { date: a.date.slice(5), pct: Math.round((running / total) * 100) };
    }).slice(-20);
  }, [filtered]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overall: <b>{pct}%</b> · <Badge tone={statusTone(attendanceStatusLabel(pct))}>{attendanceStatusLabel(pct)}</Badge>
            <span className="ml-2 text-xs">(Safe ≥ {ATTENDANCE_THRESHOLDS.safe}%, Warning ≥ {ATTENDANCE_THRESHOLDS.warning}%)</span>
          </p>
        </div>
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-56">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Attendance Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {breakdown.map((b) => <Cell key={b.name} fill={COLORS[b.name]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Attendance Over Time" subtitle="Running attendance %, most recent records">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="pct" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Subject-wise Summary" subtitle="As recorded by each subject's faculty">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400"><tr><th className="py-2">Subject</th><th>Faculty</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Total</th><th>%</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map((sub) => {
                const recs = attendance.filter((a) => a.subject_id === sub.id);
                const c = attendanceCounts(recs);
                const p = attendancePercentage(recs);
                return (
                  <tr key={sub.id}>
                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{sub.name}</td>
                    <td className="text-slate-500 dark:text-slate-400">{faculty.find((f) => f.id === sub.faculty_id)?.full_name || '—'}</td>
                    <td>{c.Present}</td><td>{c.Late}</td><td>{c.Absent}</td><td>{c.Excused}</td><td>{c.total}</td>
                    <td>{recs.length ? <Badge tone={statusTone(attendanceStatusLabel(p))}>{p}%</Badge> : <span className="text-xs text-slate-400">Not recorded yet</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="Attendance History">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs uppercase text-slate-400 dark:bg-slate-900"><tr><th className="py-2">Date</th><th>Subject</th><th>Status</th><th>Faculty remarks</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((a) => {
                const sub = subjects.find((s) => s.id === a.subject_id);
                return (
                  <tr key={a.id}>
                    <td className="py-2">{formatDate(a.date)}</td>
                    <td>{sub?.name}</td>
                    <td><Badge tone={a.status === 'Present' ? 'green' : a.status === 'Absent' ? 'red' : a.status === 'Late' ? 'yellow' : 'gray'}>{a.status}</Badge></td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{a.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
