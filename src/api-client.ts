export class BackendError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (authenticated) {
    const { authClient } = await import('./backend-client');
    const { data, error } = await authClient().auth.getSession();
    if (error || !data.session) throw new BackendError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    headers.set('Authorization', 'Bearer ' + data.session.access_token);
  }
  let response: Response;
  try { response = await fetch('/api/v1/' + path.replace(/^\/+/, ''), { ...init, headers }); }
  catch (error) {
    if (init.signal?.aborted) throw error;
    throw new BackendError(0, 'NETWORK_ERROR', 'Could not reach Our Ground. Check your connection and try again.');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new BackendError(response.status, 'INVALID_RESPONSE', 'Resource information is temporarily unavailable. Please try again.'); }
  if (!response.ok) throw new BackendError(response.status, result.error?.code ?? 'REQUEST_FAILED', result.error?.message ?? 'The request could not be completed.');
  return result as T;
}
