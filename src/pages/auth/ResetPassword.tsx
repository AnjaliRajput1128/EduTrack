import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await resetPassword(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate('/login');
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle={isSupabaseConfigured ? 'You arrived here from your reset link — choose a new password.' : 'Choose a strong password for your account'}
      footer={<Link to="/login" className="font-medium text-primary-600 hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {!isSupabaseConfigured && (
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
      </form>
    </AuthShell>
  );
}
