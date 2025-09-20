export const API_BASE = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8080';
let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; if (token) localStorage.setItem('vc_admin_token', token); else localStorage.removeItem('vc_admin_token'); }
export function getAuthToken(): string | null { return authToken ?? (typeof window !== 'undefined' ? localStorage.getItem('vc_admin_token') : null); }

export async function apiGet<T>(path: string): Promise<T> {
  const headers: any = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', headers });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers: any = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const headers: any = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed`);
  return res.json();
}

