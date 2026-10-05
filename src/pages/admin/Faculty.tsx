import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Power, AlertCircle } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Faculty as FacultyType, Department, Subject, Designation } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';

const emptyForm = { full_name: '', email: '', phone: '', department_id: '', designation: 'Assistant Professor' as Designation };

export default function Faculty() {
  const [faculty, setFaculty] = useState<FacultyType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tempPassword, setTempPassword] = useState('Faculty@123');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacultyType | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [f, d, s] = await Promise.all([dataService.getFaculty(), dataService.getDepartments(), dataService.getSubjects()]);
      setFaculty(f); setDepartments(d); setSubjects(s);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => faculty.filter((f) => {
    const matchesSearch = !search || f.full_name.toLowerCase().includes(search.toLowerCase()) || f.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || f.department_id === deptFilter;
    return matchesSearch && matchesDept;
  }), [faculty, search, deptFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setTempPassword('Faculty@123');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (f: FacultyType) => {
    setEditing(f);
    setFormError('');
    setForm({
      full_name: f.full_name,
      email: f.email,
      phone: f.phone || '',
      department_id: f.department_id || '',
      designation: f.designation,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setFormError('');
    if (!form.full_name.trim() || !form.email.trim() || !form.department_id) {
      setFormError('Please fill in all required fields (Name, Email, Department).');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await dataService.updateFaculty(editing.id, form);
      } else {
        await dataService.addFaculty({
          ...form,
          user_id: '',
          employee_id: `EMP${Math.floor(1000 + Math.random() * 8999)}`,
          status: 'active',
          temporary_password: tempPassword || 'Faculty@123',
        });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      console.error('Error saving faculty:', err);
      setFormError(err.message || 'Failed to save faculty record.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (f: FacultyType) => {
    try {
      await dataService.updateFaculty(f.id, { status: f.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteFaculty(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      console.error('Failed to delete faculty:', err);
      alert(err.message || 'Failed to delete faculty.');
    }
  };

  const workload = (f: FacultyType) => subjects.filter((s) => s.faculty_id === f.id).length;

  const columns: Column<FacultyType>[] = [
    { key: 'name', header: 'Faculty', render: (f) => (
      <div><p className="font-medium text-slate-900 dark:text-white">{f.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{f.employee_id}</p></div>
    ) },
    { key: 'email', header: 'Email', render: (f) => f.email },
    { key: 'dept', header: 'Department', render: (f) => departments.find((d) => d.id === f.department_id)?.name || '—' },
    { key: 'designation', header: 'Designation', render: (f) => f.designation },
    { key: 'workload', header: 'Subjects Assigned', render: (f) => <Badge tone="blue">{workload(f)}</Badge> },
    { key: 'status', header: 'Status', render: (f) => <Badge tone={f.status === 'active' ? 'green' : 'gray'}>{f.status}</Badge> },
    { key: 'actions', header: '', render: (f) => (
      <div className="flex items-center gap-1">
        <button onClick={() => toggleStatus(f)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800" title="Toggle active"><Power className="h-4 w-4" /></button>
        <button onClick={() => openEdit(f)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800" title="Edit"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(f)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{faculty.length} faculty members</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Faculty</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search faculty..." />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-48">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>

      <DataTable columns={columns} rows={filtered} keyField={(f) => f.id} loading={loading} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Faculty' : 'Add Faculty'} footer={
        <>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add Faculty'}</Button>
        </>
      }>
        <div className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="space-y-3">
            <Input label="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. Jane Smith" />
            <Input label="Email address *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="j.smith@edutrack.edu" />
            {!editing && (
              <Input label="Initial Password" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Faculty@123" />
            )}
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            <Select label="Department *" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value as Designation })}>
              <option>Professor</option>
              <option>Associate Professor</option>
              <option>Assistant Professor</option>
              <option>Lecturer</option>
            </Select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete faculty"
        message={`Remove ${deleteTarget?.full_name}? Any subjects currently assigned to this faculty member will become unassigned.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
