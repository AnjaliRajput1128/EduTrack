import { useEffect, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Department, Student, Faculty } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [d, s, f] = await Promise.all([dataService.getDepartments(), dataService.getStudents(), dataService.getFaculty()]);
    setDepartments(d); setStudents(s); setFaculty(f);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    await dataService.addDepartment(form);
    setSaving(false);
    setModalOpen(false);
    setForm({ name: '', code: '' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{departments.length} departments</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Department</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{d.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Code: {d.code}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{students.filter((s) => s.department_id === d.id).length} students</span>
              <span>{faculty.filter((f) => f.department_id === d.id).length} faculty</span>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Department" footer={
        <><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Add</Button></>
      }>
        <div className="space-y-4">
          <Input label="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chemistry" />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CHEM" />
        </div>
      </Modal>
    </div>
  );
}
