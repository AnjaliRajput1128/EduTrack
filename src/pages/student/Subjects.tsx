import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Subject, Faculty, AttendanceRecord, MarkRecord } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubjectRecordCard from '@/components/SubjectRecordCard';

/**
 * Formal, complete record of everything each faculty member has entered for
 * this student: assessments (or "Pending"), attendance tally and the dated
 * attendance log with remarks.
 */
export default function StudentSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await dataService.getStudentByUserId(user.id);
      const [enr, sub, fac, att, mk] = await Promise.all([
        s ? dataService.getEnrollmentsForStudent(s.id) : Promise.resolve([]),
        dataService.getSubjects(), dataService.getFaculty(),
        s ? dataService.getAttendanceForStudent(s.id) : Promise.resolve([]),
        s ? dataService.getMarksForStudent(s.id) : Promise.resolve([]),
      ]);
      const ids = new Set(enr.map((e) => e.subject_id));
      setSubjects(sub.filter((x) => ids.has(x.id)));
      setFaculty(fac); setAttendance(att); setMarks(mk);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Subjects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {subjects.length} subjects enrolled. Everything your faculty has recorded for you appears here — anything not yet entered is marked “Pending”.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {subjects.map((s) => (
          <SubjectRecordCard
            key={s.id}
            subject={s}
            facultyName={faculty.find((f) => f.id === s.faculty_id)?.full_name}
            attendance={attendance.filter((a) => a.subject_id === s.id)}
            marks={marks.filter((m) => m.subject_id === s.id)}
          />
        ))}
      </div>
    </div>
  );
}
