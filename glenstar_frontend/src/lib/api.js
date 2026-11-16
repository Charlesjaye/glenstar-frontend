// Small wrapper around fetch that treats HTTP errors and `{ error: ... }`
// payloads as failures, so callers can rely on `catch` for every failure mode.

export const API_BASE = process.env.REACT_APP_API_URL || '';

const TOKEN_KEY = 'glenstar-admin-token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAdminToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function setAdminToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable — the passcode just won't be remembered */ }
}

// Called when the backend answers 401. The app registers a handler that asks for
// the passcode and resolves true if one was entered (the request is then retried).
let unauthorizedHandler = null;
export function onUnauthorized(handler) { unauthorizedHandler = handler; }

export async function request(path, { method = 'GET', body, form, base = API_BASE, retry = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAdminToken();
  if (token && method !== 'GET') headers['X-Admin-Token'] = token;

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (err) {
    throw new ApiError('Could not reach the server. Check your connection and that the backend is running.', 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (res.status === 401 && retry && unauthorizedHandler) {
    const entered = await unauthorizedHandler();
    if (entered) return request(path, { method, body, form, base, retry: false });
  }
  if (!res.ok) {
    const detail = (data && (data.error || data.detail)) || res.statusText || 'Request failed';
    throw new ApiError(data && data.error ? detail : `${detail} (HTTP ${res.status})`, res.status);
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && data.error) {
    throw new ApiError(String(data.error), res.status);
  }
  return data;
}

export const getJSON   = (path, opts) => request(path, { ...opts, method: 'GET' });
export const postJSON  = (path, body, opts) => request(path, { ...opts, method: 'POST', body });
export const patchJSON = (path, body, opts) => request(path, { ...opts, method: 'PATCH', body });
export const putJSON   = (path, body, opts) => request(path, { ...opts, method: 'PUT', body });
export const del       = (path, opts) => request(path, { ...opts, method: 'DELETE' });

export function uploadFiles(files) {
  const form = new FormData();
  for (const file of files) form.append('files', file, file.name);
  return request('/api/documents', { method: 'POST', form });
}

export const documentFileUrl = (id, page) =>
  `${API_BASE}/api/documents/${id}/file${page ? `#page=${page}` : ''}`;
