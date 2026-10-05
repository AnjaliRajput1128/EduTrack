import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Announcement, Subject } from '@/types';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime } from '@/utils/format';

export default function StudentAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const me = await dataService.getStudentByUserId(user.id);
      const [all, enr, subs] = await Promise.all([
        dataService.getAnnouncements(),
        me ? dataService.getEnrollmentsForStudent(me.id) : Promise.resolve([]),
        dataService.getSubjects(),
      ]);
      const mine = new Set(enr.map((e) => e.subject_id));
      setSubjects(subs);
      // Subject-specific notices reach only students enrolled in that subject.
      setItems(all.filter((a) => (a.target_role === 'all' || a.target_role === 'student') && (!a.subject_id || mine.has(a.subject_id))));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Announcements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Updates from your faculty and the admin office.</p>
      </div>
      {items.length === 0 ? <EmptyState icon={Megaphone} title="No announcements yet" /> : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 shadow-card dark:bg-slate-900 ${a.priority === 'important' ? 'border-red-200 bg-red-50/50 dark:border-red-900/40' : 'border-slate-200 bg-white dark:border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                {a.priority === 'important' && <Badge tone="red">Important</Badge>}
                {a.subject_id && <Badge tone="blue">{subjects.find((x) => x.id === a.subject_id)?.name || 'Subject'}</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.content}</p>
              <p className="mt-2 text-xs text-slate-400">{a.created_by_name} · {formatDateTime(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
