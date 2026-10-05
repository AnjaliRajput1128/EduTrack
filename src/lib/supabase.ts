import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isPlaceholderUrl = (u: string) =>
  u.includes('your-project') ||
  u.includes('your-project-ref') ||
  u.includes('your-project-id') ||
  u.includes('example.com') ||
  u.includes('<') ||
  !u.startsWith('https://');

const isPlaceholderKey = (k: string) =>
  k.includes('your-anon-key') ||
  k.includes('your-actual-anon-key') ||
  k.includes('your-key') ||
  k.includes('<') ||
  k.length < 25;

export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  url.trim().length > 0 &&
  anonKey.trim().length > 0 &&
  !isPlaceholderUrl(url.trim()) &&
  !isPlaceholderKey(anonKey.trim())
);

/**
 * Real Supabase client with standard session persistence.
 * Instantiated only when valid environment variables are provided.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/**
 * Creates an isolated Supabase client without session persistence.
 * Used for admin operations (e.g. creating student/faculty Auth accounts)
 * from the browser WITHOUT logging out the active admin session and WITHOUT
 * exposing any unsafe service-role keys.
 */
export function createIsolatedAuthClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
