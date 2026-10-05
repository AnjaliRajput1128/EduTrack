import { useEffect, useState } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Announcement, Faculty, Subject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime } from '@/utils/format';

export default function FacultyAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [me, setMe] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({ title: '', content: '', subject_id: '', important: false });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const load = async () => {
    setLoading(true);
    const [all, f, subs] = await Promise.all([dataService.getAnnouncements(), user ? dataService.getFacultyByUserId(user.id) : Promise.resolve(undefined), dataService.getSubjects()]);
    setAllSubjects(subs);
    setSubjects(subs.filter((x) => x.faculty_id === f?.id));
    setItems(all.filter((a) => a.target_role === 'all' || a.target_role === 'faculty' || a.created_by === user?.id));
    setMe(f || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!form.title || !form.content || !user || !me) return;
    setSaving(true);
    await dataService.addAnnouncement({ title: form.title, content: form.content, created_by: user.id, created_by_name: me.full_name, target_role: 'student', priority: form.important ? 'important' : 'normal', subject_id: form.subject_id || null });
    setSaving(false);
    setModalOpen(false);
    setForm({ title: '', content: '', subject_id: '', important: false });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dataService.deleteAnnouncement(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Post updates for your students, and see admin/faculty notices.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>New Announcement</Button>
      </div>

      {items.length === 0 ? <EmptyState icon={Megaphone} title="No announcements yet" /> : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                    {a.priority === 'important' && <Badge tone="red">Important</Badge>}
                    {a.subject_id && <Badge tone="blue">{allSubjects.find((x) => x.id === a.subject_id)?.name || 'Subject'}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.content}</p>
                  <p className="mt-2 text-xs text-slate-400">{a.created_by_name} · {formatDateTime(a.created_at)}</p>
                </div>
                {a.created_by === user?.id && (
                  <button onClick={() => setDeleteTarget(a)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement" footer={
        <><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Post</Button></>
      }>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
            <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
          <Select label="Send to" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">All students</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>Only students of {s.name}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.important} onChange={(e) => setForm({ ...form, important: e.target.checked })} /> Mark as important
          </label>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete announcement" message={`Remove "${deleteTarget?.title}"?`} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
