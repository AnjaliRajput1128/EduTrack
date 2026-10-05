import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_CREDENTIALS } from '@/services/seedData';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    // Role-based redirection happens after the auth user resolves;
    // DashboardLayout also guards each route, this just sends them somewhere sane.
    navigate('/redirect');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your EduTrack account"
      footer={<span>Don't have an account? <Link to="/register" className="font-medium text-primary-600 hover:underline">Register</Link></span>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@edutrack.edu" autoComplete="username" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>Sign In</Button>
      </form>

      {isSupabaseConfigured ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Connected to your Supabase project. Sign in with an account created via Register or the Supabase dashboard.
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p className="mb-1.5 font-semibold text-slate-600 dark:text-slate-300">Demo credentials</p>
          {DEMO_CREDENTIALS.map((c) => (
            <div key={c.email} className="flex items-center justify-between py-0.5">
              <span>{c.label}</span>
              <button type="button" className="font-mono text-primary-600 hover:underline" onClick={() => { setEmail(c.email); setPassword(c.password); }}>
                use
              </button>
            </div>
          ))}
        </div>
      )}
    </AuthShell>
  );
}
