// Small wrapper around fetch that treats HTTP errors and `{ error: ... }`
// payloads as failures, so callers can rely on `catch` for every failure mode.

export const API_BASE = process.env.REACT_APP_API_URL || '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, base = API_BASE } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const detail = (data && (data.error || data.detail)) || res.statusText || 'Request failed';
    throw new ApiError(`${detail} (HTTP ${res.status})`, res.status);
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && data.error) {
    throw new ApiError(String(data.error), res.status);
  }
  return data;
}

export const getJSON  = (path, opts) => request(path, { ...opts, method: 'GET' });
export const postJSON = (path, body, opts) => request(path, { ...opts, method: 'POST', body });
