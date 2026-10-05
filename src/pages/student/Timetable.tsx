import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Subject, Faculty, TimetableEntry, Weekday } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Timetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await dataService.getStudentByUserId(user.id);
      const [enr, sub, fac, tt] = await Promise.all([
        s ? dataService.getEnrollmentsForStudent(s.id) : Promise.resolve([]),
        dataService.getSubjects(), dataService.getFaculty(), dataService.getTimetable(),
      ]);
      const subIds = new Set(enr.map((e) => e.subject_id));
      setSubjects(sub.filter((x) => subIds.has(x.id)));
      setFaculty(fac);
      setEntries(tt.filter((t) => subIds.has(t.subject_id)));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Timetable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your weekly class schedule.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {DAYS.map((day) => {
          const dayEntries = entries.filter((e) => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
          return (
            <div key={day} className="rounded-xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{day}</h3>
              {dayEntries.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No classes</p>
              ) : (
                <div className="space-y-2">
                  {dayEntries.map((e) => {
                    const sub = subjects.find((s) => s.id === e.subject_id);
                    return (
                      <div key={e.id} className="rounded-lg border border-primary-100 bg-primary-50 p-2 text-xs dark:border-primary-900/40 dark:bg-primary-900/20">
                        <p className="font-medium text-primary-800 dark:text-primary-300">{sub?.name}</p>
                        <p className="text-primary-600 dark:text-primary-400">{e.start_time}–{e.end_time}</p>
                        <p className="text-primary-500 dark:text-primary-500">{e.room} · {faculty.find((f) => f.id === e.faculty_id)?.full_name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
