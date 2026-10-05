import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '@/utils/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, id, ...rest }, ref) => {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={classNames(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
          error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 dark:border-slate-700',
          className
        )}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';
export default Input;
