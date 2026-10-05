import { CalendarCheck, ClipboardList } from 'lucide-react';
import type { Subject, AttendanceRecord, MarkRecord } from '@/types';
import Badge, { statusTone } from '@/components/ui/Badge';
import { EXAM_TYPES } from '@/lib/config';
import { attendanceCounts, attendancePercentage, attendanceStatusLabel, examCompletion, gradeForPercentage, isPassing, subjectPercentage } from '@/utils/calculations';
import { formatDate } from '@/utils/format';

const STATUS_TONE = { Present: 'green', Absent: 'red', Late: 'yellow', Excused: 'gray' } as const;

/**
 * One formal, complete record of everything a faculty member has entered for
 * a student in one subject: every assessment (or "Pending"), the attendance
 * tally and the full dated attendance log with the faculty's remarks.
 *
 * The SAME component is used in the student portal and inside the faculty
 * portal ("what this student sees"), so both sides always show identical data.
 */
export default function SubjectRecordCard({ subject, facultyName, attendance, marks }: {
  subject: Subject; facultyName?: string; attendance: AttendanceRecord[]; marks: MarkRecord[];
}) {
  const counts = attendanceCounts(attendance);
  const attPct = attendancePercentage(attendance);
  const hasAtt = attendance.length > 0;
  const pct = subjectPercentage(marks);
  const grade = gradeForPercentage(pct).grade;
  const completion = examCompletion(marks);
  const sorted = [...attendance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{subject.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subject.code} · {subject.credits} credits · Faculty: {facultyName || 'Unassigned'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {marks.length === 0 ? <Badge tone="gray">Marks awaited</Badge> : (
            <>
              <Badge tone={grade === 'F' ? 'red' : grade.startsWith('A') ? 'green' : 'blue'}>{grade}</Badge>
              <Badge tone={isPassing(pct) ? 'green' : 'red'}>{isPassing(pct) ? 'Passing' : 'Below Passing'}</Badge>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300"><ClipboardList className="h-3.5 w-3.5" /> Assessments</span>
          <Badge tone={completion.complete ? 'green' : 'yellow'}>{completion.complete ? 'All entered' : `${completion.entered}/${completion.total} entered`}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {EXAM_TYPES.map((type) => {
            const rec = marks.find((m) => m.exam_type === type);
            return (
              <div key={type} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800">
                <p className="text-[11px] text-slate-400">{type}</p>
                <p className={`text-sm font-semibold ${rec ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{rec ? `${rec.marks_obtained}/${rec.max_marks}` : 'Pending'}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300"><CalendarCheck className="h-3.5 w-3.5" /> Attendance</span>
          {hasAtt ? <Badge tone={statusTone(attendanceStatusLabel(attPct))}>{attPct}% · {attendanceStatusLabel(attPct)}</Badge> : <Badge tone="gray">No classes recorded yet</Badge>}
        </div>
        {hasAtt && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {counts.total} classes: {counts.Present} present · {counts.Late} late · {counts.Absent} absent · {counts.Excused} excused
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-primary-600 dark:text-primary-400">View day-by-day record</summary>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 uppercase text-slate-400 dark:bg-slate-800"><tr><th className="px-2 py-1.5">Date</th><th>Status</th><th>Faculty remarks</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sorted.map((a) => (
                      <tr key={a.id}>
                        <td className="px-2 py-1.5">{formatDate(a.date)}</td>
                        <td><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></td>
                        <td className="text-slate-500 dark:text-slate-400">{a.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
