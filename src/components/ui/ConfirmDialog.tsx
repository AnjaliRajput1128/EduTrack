import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true, loading }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={
      <>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>Confirm</Button>
      </>
    }>
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </Modal>
  );
}
