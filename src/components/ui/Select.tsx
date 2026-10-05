import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/utils/format';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, id, children, ...rest }, ref) => {
  const selectId = id || label?.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={classNames(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-100',
          error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 dark:border-slate-700',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';
export default Select;
