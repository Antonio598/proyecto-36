/**
 * Client-side fetch wrapper that automatically adds the x-account-id header
 * from the stored session. Use this instead of raw fetch() for all API calls.
 */
export function getAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('med_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accountId ?? null;
  } catch {
    return null;
  }
}

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accountId = getAccountId();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (accountId) headers['x-account-id'] = accountId;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(url, { ...options, headers });
}
