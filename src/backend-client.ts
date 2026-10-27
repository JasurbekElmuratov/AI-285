import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export { apiRequest, BackendError } from './api-client';
export type { CurrentAccount } from '../shared/contracts';

let client: SupabaseClient | undefined;
export function isSignInConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key && !/YOUR_|REPLACE_ME/.test(url + key) && !key.startsWith('sb_secret_'));
}
export function authClient() {
  if (!isSignInConfigured()) throw new Error('Sign-in is not available yet.');
  client ??= createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: false }
  });
  return client;
}
export async function signInWithGoogle() {
  const { error } = await authClient().auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: window.location.origin + '/account' }
  });
  if (error) throw error;
}
export async function finishGoogleRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const rejected = url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error');
  if (!code && !rejected) return;
  try {
    if (rejected) throw new Error('Google sign-in was canceled or could not be completed. Please try again.');
    const { error } = await authClient().auth.exchangeCodeForSession(code!);
    if (error) throw new Error('This sign-in link expired or was opened in a different browser. Start Google sign-in again.');
  } finally { window.history.replaceState(null, '', '/account'); }
}
