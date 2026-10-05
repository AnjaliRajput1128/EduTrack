import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const { requestPasswordReset, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll help you reset it"
      footer={<Link to="/login" className="font-medium text-primary-600 hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="space-y-4">
          {isSupabaseConfigured ? (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              If an account exists for <b>{email}</b>, a password reset link has been sent. Open it to set a new password.
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                This demo runs without email delivery, so continue below to set a new password directly. Connect Supabase to send a real reset link instead.
              </div>
              <Button className="w-full" onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>Continue to Reset Password</Button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@edutrack.edu" />
          <Button type="submit" className="w-full" loading={loading}>Send Reset Instructions</Button>
        </form>
      )}
    </AuthShell>
  );
}
