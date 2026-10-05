import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Faculty, Subject, Course, Enrollment } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { BookOpen } from 'lucide-react';

export default function MySubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const f = await dataService.getFacultyByUserId(user.id) as Faculty | undefined;
      const [sub, c, enr] = await Promise.all([dataService.getSubjects(), dataService.getCourses(), dataService.getEnrollments()]);
      setSubjects(sub.filter((s) => s.faculty_id === f?.id));
      setCourses(c); setEnrollments(enr);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Subjects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subjects.length} subjects assigned to you this semester.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.code} · {courses.find((c) => c.id === s.course_id)?.code}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <Badge tone="blue">Semester {s.semester}</Badge>
              <span className="text-slate-500 dark:text-slate-400">{enrollments.filter((e) => e.subject_id === s.id).length} students · {s.credits} credits</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
