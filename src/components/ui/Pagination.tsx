import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} icon={<ChevronLeft className="h-4 w-4" />}>Prev</Button>
        <Button size="sm" variant="outline" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} icon={<ChevronRight className="h-4 w-4" />}>Next</Button>
      </div>
    </div>
  );
}
