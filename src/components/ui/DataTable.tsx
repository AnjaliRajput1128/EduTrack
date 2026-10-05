import { useState, type ReactNode } from 'react';
import Pagination from './Pagination';
import { TableSkeleton } from './LoadingSpinner';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  loading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DataTable<T>({ columns, rows, keyField, loading, pageSize = 8, emptyTitle = 'No records found', emptyDescription }: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? null : pageRows.map((row) => (
              <tr key={keyField(row)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle text-slate-700 dark:text-slate-300 ${c.className || ''}`}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <TableSkeleton cols={columns.length} />}
      </div>
      {!loading && rows.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} />}
      {!loading && rows.length > 0 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
