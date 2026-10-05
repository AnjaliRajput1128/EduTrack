import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppUser, Role } from '@/types';
import { DEMO_CREDENTIALS, adminUser, facultyUsers, studentUsers } from '@/services/seedData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Credential { email: string; password: string; role: Role; userId: string; }

const AUTH_USERS_KEY = 'edutrack_auth_credentials_v1';
const SESSION_KEY = 'edutrack_session_v1';

function loadCredentials(): Credential[] {
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  if (raw) return JSON.parse(raw);
  const seeded: Credential[] = DEMO_CREDENTIALS.map((c) => {
    const user = [adminUser, ...facultyUsers, ...studentUsers].find((u) => u.email === c.email)!;
    return { email: c.email, password: c.password, role: c.role, userId: user.id };
  });
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(seeded));
  return seeded;
}

interface AuthResult { error?: string; ok?: boolean; needsEmailConfirmation?: boolean; }

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, role: Role, fullName: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, newPassword: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const allMockUsers = useMemo(() => [adminUser, ...facultyUsers, ...studentUsers], []);

  // ---------------------------------------------------------
  // Session bootstrap + listener
  // ---------------------------------------------------------
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      let active = true;

      const loadProfile = async (authUserId: string, fallbackEmail: string, metaRole?: string) => {
        try {
          const { data: profile, error } = await supabase!
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();

          if (!active) return;

          if (profile) {
            setUser(profile as AppUser);
          } else {
            const effectiveRole = (metaRole || 'student') as Role;
            const newRecord: AppUser = {
              id: authUserId,
              email: fallbackEmail,
              role: effectiveRole,
              created_at: new Date().toISOString(),
            };

            // Attempt to ensure public.users row exists
            try {
              await supabase!.from('users').upsert({
                id: authUserId,
                email: fallbackEmail,
                role: effectiveRole,
              }, { onConflict: 'id' });
            } catch (err) {
              console.warn('public.users upsert fallback notice:', err);
            }

            setUser(newRecord);
          }
        } catch (err) {
          console.error('Error loading Supabase user profile:', err);
          if (active) {
            const effectiveRole = (metaRole || 'student') as Role;
            setUser({
              id: authUserId,
              email: fallbackEmail,
              role: effectiveRole,
              created_at: new Date().toISOString(),
            });
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const metaRole = data.session.user.user_metadata?.role as string | undefined;
          loadProfile(data.session.user.id, data.session.user.email || '', metaRole);
        } else {
          setLoading(false);
        }
      });

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const metaRole = session.user.user_metadata?.role as string | undefined;
          loadProfile(session.user.id, session.user.email || '', metaRole);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    // Mock session (localStorage) for Demo Mode
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  // ---------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------
  const login: AuthContextValue['login'] = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error: error.message };

      if (data.user) {
        const metaRole = (data.user.user_metadata?.role || 'student') as Role;
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            setUser(profile as AppUser);
          } else {
            // Upsert public.users with metadata role
            await supabase.from('users').upsert({
              id: data.user.id,
              email: data.user.email || email.trim(),
              role: metaRole,
            }, { onConflict: 'id' });

            setUser({
              id: data.user.id,
              email: data.user.email || email.trim(),
              role: metaRole,
              created_at: new Date().toISOString(),
            });
          }
        } catch {
          setUser({
            id: data.user.id,
            email: data.user.email || email.trim(),
            role: metaRole,
            created_at: new Date().toISOString(),
          });
        }
      }
      return {};
    }

    // Mock login for Demo Mode
    const creds = loadCredentials();
    const match = creds.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
    );
    if (!match) return { error: 'Invalid email or password.' };
    const appUser = allMockUsers.find((u) => u.id === match.userId) || {
      id: match.userId,
      email: match.email,
      role: match.role,
      created_at: new Date().toISOString(),
    };
    setUser(appUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    return {};
  };

  const register: AuthContextValue['register'] = async (email, password, role, fullName) => {
    if (isSupabaseConfigured && supabase) {
      if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
          },
        },
      });

      if (error) return { error: error.message };

      // If email confirmation is enabled on Supabase, no active session yet
      if (!data.session) return { ok: true, needsEmailConfirmation: true };

      if (data.user) {
        // Trigger handle_new_auth_user automatically creates public.users and role profile.
        // As a resilient client check, we verify or upsert public.users immediately.
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email || email.trim(),
            role,
          }, { onConflict: 'id' });

          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          setUser((profile as AppUser) || {
            id: data.user.id,
            email: data.user.email || email.trim(),
            role,
            created_at: new Date().toISOString(),
          });
        } catch {
          setUser({
            id: data.user.id,
            email: data.user.email || email.trim(),
            role,
            created_at: new Date().toISOString(),
          });
        }
      }
      return {};
    }

    // Mock register for Demo Mode
    const creds = loadCredentials();
    if (creds.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())) {
      return { error: 'An account with this email already exists.' };
    }
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
    const userId = `u-new-${Math.random().toString(36).slice(2, 8)}`;
    const newCred: Credential = { email: email.trim().toLowerCase(), password, role, userId };
    const updated = [...creds, newCred];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updated));
    const newUser: AppUser = { id: userId, email: newCred.email, role, created_at: new Date().toISOString() };
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return {};
  };

  const requestPasswordReset: AuthContextValue['requestPasswordReset'] = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { ok: true };
    }

    const creds = loadCredentials();
    const match = creds.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) return { error: 'No account found with that email.' };
    return { ok: true };
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email, newPassword) => {
    if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { ok: true };
    }

    const creds = loadCredentials();
    const idx = creds.findIndex((c) => c.email.toLowerCase() === email.trim().toLowerCase());
    if (idx === -1) return { error: 'No account found with that email.' };
    creds[idx].password = newPassword;
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(creds));
    return { ok: true };
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch((e) => console.warn('Sign out notice:', e));
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSupabaseConfigured, login, register, requestPasswordReset, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
