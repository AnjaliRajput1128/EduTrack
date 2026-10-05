import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataService } from '@/services/dataService';
import type { Student, Faculty } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { initials } from '@/utils/format';
import { CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [record, setRecord] = useState<Student | Faculty | null>(null);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (user.role === 'student') {
        const s = await dataService.getStudentByUserId(user.id);
        if (s) { setRecord(s); setPhone(s.phone); }
      } else if (user.role === 'faculty') {
        const f = await dataService.getFacultyByUserId(user.id);
        if (f) { setRecord(f); setPhone(f.phone); }
      }
    })();
  }, [user]);

  const save = async () => {
    if (!record) return;
    if (user?.role === 'student') await dataService.updateStudent(record.id, { phone });
    if (user?.role === 'faculty') await dataService.updateFaculty(record.id, { phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and update your account details.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
            {initials(record ? ('full_name' in record ? record.full_name : '') : user?.email.split('@')[0] || 'U')}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{record && 'full_name' in record ? record.full_name : user?.email}</p>
            <Badge tone="blue">{user?.role.toUpperCase()}</Badge>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" value={user?.email || ''} disabled />
          {record && 'student_id' in record && <Input label="Student ID" value={record.student_id} disabled />}
          {record && 'employee_id' in record && <Input label="Employee ID" value={record.employee_id} disabled />}
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {record && 'semester' in record && <Input label="Current Semester" value={String(record.semester)} disabled />}
          {record && 'designation' in record && <Input label="Designation" value={record.designation} disabled />}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save}>Save Changes</Button>
          {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
        </div>
      </div>
    </div>
  );
}
