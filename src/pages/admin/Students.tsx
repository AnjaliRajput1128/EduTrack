import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, UserRound, AlertCircle } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Student, Department, Course, AttendanceRecord, MarkRecord } from '@/types';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge, { statusTone } from '@/components/ui/Badge';
import { attendancePercentage, attendanceStatusLabel, calculateCGPA, gradeForPercentage, subjectPercentage } from '@/utils/calculations';

const emptyForm = {
  full_name: '', email: '', phone: '', date_of_birth: '', gender: 'Male' as Student['gender'],
  department_id: '', course_id: '', semester: 1, admission_year: new Date().getFullYear(),
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tempPassword, setTempPassword] = useState('Student@123');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, d, c, a, m] = await Promise.all([
        dataService.getStudents(), dataService.getDepartments(), dataService.getCourses(),
        dataService.getAttendance(), dataService.getMarks(),
      ]);
      setStudents(s); setDepartments(d); setCourses(c); setAttendance(a); setMarks(m);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => students.filter((s) => {
    const matchesSearch = !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || s.department_id === deptFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  }), [students, search, deptFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setTempPassword('Student@123');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setFormError('');
    setForm({
      full_name: s.full_name,
      email: s.email,
      phone: s.phone || '',
      date_of_birth: s.date_of_birth || '',
      gender: s.gender,
      department_id: s.department_id || '',
      course_id: s.course_id || '',
      semester: s.semester,
      admission_year: s.admission_year,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setFormError('');
    if (!form.full_name.trim() || !form.email.trim() || !form.department_id || !form.course_id) {
      setFormError('Please fill in all required fields (Name, Email, Department, Course).');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await dataService.updateStudent(editing.id, form);
      } else {
        await dataService.addStudent({
          ...form,
          user_id: '', // Empty triggers real Supabase Auth user generation or mock uid in demo
          student_id: `2024CS${Math.floor(Math.random() * 900 + 100)}`,
          status: 'active',
          temporary_password: tempPassword || 'Student@123',
        });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      console.error('Error saving student:', err);
      setFormError(err.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      alert(err.message || 'Failed to delete student.');
    }
  };

  const studentStats = (s: Student) => {
    const att = attendance.filter((a) => a.student_id === s.id);
    const mk = marks.filter((m) => m.student_id === s.id);
    const bySubject: Record<string, MarkRecord[]> = {};
    mk.forEach((m) => { (bySubject[m.subject_id] ||= []).push(m); });
    const results = Object.values(bySubject).map((arr) => ({ credits: 4, percentage: subjectPercentage(arr) }));
    return { attPct: attendancePercentage(att), cgpa: calculateCGPA(results) };
  };

  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', render: (s) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{s.student_id}</p>
      </div>
    ) },
    { key: 'email', header: 'Email', render: (s) => s.email },
    { key: 'course', header: 'Course', render: (s) => courses.find((c) => c.id === s.course_id)?.code || '—' },
    { key: 'dept', header: 'Department', render: (s) => departments.find((d) => d.id === s.department_id)?.code || '—' },
    { key: 'sem', header: 'Semester', render: (s) => s.semester },
    { key: 'att', header: 'Attendance', render: (s) => {
      const { attPct } = studentStats(s);
      return <Badge tone={statusTone(attendanceStatusLabel(attPct))}>{attPct}%</Badge>;
    } },
    { key: 'cgpa', header: 'CGPA', render: (s) => studentStats(s).cgpa.toFixed(2) },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge> },
    { key: 'actions', header: '', render: (s) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewing(s)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => openEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800" title="Edit"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(s)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{students.length} total students</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Student</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID, or email..." />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-44">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <DataTable columns={columns} rows={filtered} keyField={(s) => s.id} loading={loading} emptyTitle="No students match your filters" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg" footer={
        <>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add Student'}</Button>
        </>
      }>
        <div className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Doe" />
            <Input label="Email address *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john.doe@student.edutrack.edu" />
            {!editing && (
              <Input label="Initial Password" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Student@123" />
            )}
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Student['gender'] })}>
              <option>Male</option><option>Female</option><option>Other</option>
            </Select>
            <Select label="Department *" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Course *" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select course</option>
              {courses.filter((c) => !form.department_id || c.department_id === form.department_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Semester" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
            <Input label="Admission year" type="number" value={form.admission_year} onChange={(e) => setForm({ ...form, admission_year: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete student"
        message={`Are you sure you want to remove ${deleteTarget?.full_name}? This will also remove their attendance and marks history from view.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Student Profile" size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{viewing.full_name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{viewing.student_id} · {viewing.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Department</p><p className="font-medium text-slate-800 dark:text-slate-200">{departments.find((d) => d.id === viewing.department_id)?.name || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Course</p><p className="font-medium text-slate-800 dark:text-slate-200">{courses.find((c) => c.id === viewing.course_id)?.name || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Semester</p><p className="font-medium text-slate-800 dark:text-slate-200">{viewing.semester}</p></div>
              <div><p className="text-xs text-slate-400">Admission Year</p><p className="font-medium text-slate-800 dark:text-slate-200">{viewing.admission_year}</p></div>
              <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium text-slate-800 dark:text-slate-200">{viewing.phone || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Status</p><Badge tone={viewing.status === 'active' ? 'green' : 'gray'}>{viewing.status}</Badge></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
