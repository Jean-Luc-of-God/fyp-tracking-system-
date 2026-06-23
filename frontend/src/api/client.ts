const BASE = 'http://localhost:8080';
const TOKEN_KEY = 'fyp_jwt';

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { auth?: boolean } = { auth: true }
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch { /* ignore parse error */ }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postPublic: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body, { auth: false }),

  // Multipart file upload — does NOT set Content-Type (browser sets it with boundary)
  postForm: async <T>(path: string, form: FormData): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: form });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { const err = await res.json(); message = err.message || err.error || message; }
      catch { /* ignore */ }
      throw new ApiError(res.status, message);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  },
};
