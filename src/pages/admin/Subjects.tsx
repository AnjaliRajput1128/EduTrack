import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Subject, Course, Faculty } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const emptyForm = { name: '', code: '', course_id: '', semester: 1, credits: 3, faculty_id: '' };

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, c, f] = await Promise.all([dataService.getSubjects(), dataService.getCourses(), dataService.getFaculty()]);
    setSubjects(s); setCourses(c); setFaculty(f);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code, course_id: s.course_id, semester: s.semester, credits: s.credits, faculty_id: s.faculty_id || '' });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.code || !form.course_id) return;
    setSaving(true);
    const payload = { ...form, faculty_id: form.faculty_id || null };
    if (editing) await dataService.updateSubject(editing.id, payload);
    else await dataService.addSubject(payload);
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dataService.deleteSubject(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  const columns: Column<Subject>[] = [
    { key: 'name', header: 'Subject', render: (s) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{s.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{s.code}</p></div>
    ) },
    { key: 'course', header: 'Course', render: (s) => courses.find((c) => c.id === s.course_id)?.code || '—' },
    { key: 'sem', header: 'Semester', render: (s) => s.semester },
    { key: 'credits', header: 'Credits', render: (s) => <Badge tone="blue">{s.credits}</Badge> },
    { key: 'faculty', header: 'Assigned Faculty', render: (s) => faculty.find((f) => f.id === s.faculty_id)?.full_name || <span className="text-amber-600">Unassigned</span> },
    { key: 'actions', header: '', render: (s) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(s)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subjects.length} subjects across all courses</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Subject</Button>
      </div>

      <DataTable columns={columns} rows={subjects} keyField={(s) => s.id} loading={loading} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'} footer={
        <><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>{editing ? 'Save' : 'Add'}</Button></>
      }>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Subject name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Select label="Course" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
            <option value="">Select course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Semester" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <Input label="Credits" type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <Select label="Assign faculty" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}>
            <option value="">Unassigned</option>
            {faculty.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
          </Select>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete subject" message={`Remove ${deleteTarget?.name}? Existing attendance and marks records for it will remain but be orphaned.`} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
