import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { APP_NAME } from '@/lib/config';

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-700 to-primary-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-bold leading-tight">Academic performance and attendance, all in one place.</h1>
          <p className="mt-3 max-w-sm text-primary-100">A single system for admins, faculty and students to track attendance, grades, and academic progress in real time.</p>
        </div>
        <p className="text-xs text-primary-200">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
