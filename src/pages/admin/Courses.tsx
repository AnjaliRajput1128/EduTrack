import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Course, Department, Student } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

const emptyForm = { name: '', code: '', department_id: '', duration: 3 };

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, d, s] = await Promise.all([dataService.getCourses(), dataService.getDepartments(), dataService.getStudents()]);
    setCourses(c); setDepartments(d); setStudents(s);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.code || !form.department_id) return;
    setSaving(true);
    await dataService.addCourse(form);
    setSaving(false);
    setModalOpen(false);
    setForm(emptyForm);
    load();
  };

  const columns: Column<Course>[] = [
    { key: 'name', header: 'Course', render: (c) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{c.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{c.code}</p></div>
    ) },
    { key: 'dept', header: 'Department', render: (c) => departments.find((d) => d.id === c.department_id)?.name || '—' },
    { key: 'duration', header: 'Duration', render: (c) => `${c.duration} years` },
    { key: 'enrolled', header: 'Students Enrolled', render: (c) => <Badge tone="blue">{students.filter((s) => s.course_id === c.id).length}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Courses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{courses.length} courses offered</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Course</Button>
      </div>

      <DataTable columns={columns} rows={courses} keyField={(c) => c.id} loading={loading} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Course" footer={
        <><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Add</Button></>
      }>
        <div className="space-y-4">
          <Input label="Course name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. B.Sc. Chemistry" />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. BSC-CHEM" />
          <Select label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input label="Duration (years)" type="number" min={1} max={6} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
        </div>
      </Modal>
    </div>
  );
}
