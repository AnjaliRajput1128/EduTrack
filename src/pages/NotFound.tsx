import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <GraduationCap className="h-10 w-10 text-primary-600" />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="text-slate-500 dark:text-slate-400">This page doesn't exist or you don't have access to it.</p>
      <Link to="/redirect"><Button>Go to my dashboard</Button></Link>
    </div>
  );
}
