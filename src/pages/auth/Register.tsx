import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import { AlertCircle, MailCheck } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password) { setError('Please fill in all required fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error, needsEmailConfirmation } = await register(email, password, role, fullName);
    setLoading(false);
    if (error) { setError(error); return; }
    if (needsEmailConfirmation) { setConfirmSent(true); return; }
    navigate('/redirect');
  };

  if (confirmSent) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to activate your account" footer={<Link to="/login" className="font-medium text-primary-600 hover:underline">Back to sign in</Link>}>
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
          We sent a confirmation link to <b>{email}</b>. Click it to activate your account, then sign in.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to access the academic portal"
      footer={<span>Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:underline">Sign in</Link></span>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@edutrack.edu" autoComplete="username" />
        <Select label="I am a" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </Select>
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
      </form>
      <p className="mt-4 text-xs text-slate-400">
        New accounts start with a blank academic record. Ask your admin to link your student/faculty profile for full data, or explore with the demo accounts on the login page.
      </p>
    </AuthShell>
  );
}
