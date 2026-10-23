import axios from 'axios';
import { API_URL } from './config';

const API_BASE = API_URL;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mh_token');
      localStorage.removeItem('mh_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection or API URL.';
  }
  return fallback;
}

// For direct browser navigation (anchor tags, target="_blank") to protected endpoints
// like PDF or Excel downloads — these can't carry an Authorization header, so the
// token is passed as a query param instead (the backend accepts either).
export function authFileUrl(path) {
  const token = localStorage.getItem('mh_token') || '';
  const separator = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Fetch a protected file (PDF/Excel) with the Authorization header and open it
 * in a new tab. Avoids blank/stuck tabs when generation fails, and surfaces errors.
 */
export async function openAuthFile(path, { filename } = {}) {
  try {
    const res = await api.get(path, { responseType: 'blob' });
    const contentType = res.headers['content-type'] || '';

    // Backend returns JSON on auth/validation errors even when we asked for a blob.
    if (contentType.includes('application/json')) {
      const text = await res.data.text();
      let message = 'Could not open file.';
      try { message = JSON.parse(text).error || message; } catch { /* ignore */ }
      throw new Error(message);
    }

    const blob = new Blob([res.data], { type: contentType || 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Popup blocked — fall back to a download link.
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document.pdf';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    // Revoke after the new tab has had time to load the blob URL.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return url;
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || 'Could not open file.');
      } catch (inner) {
        if (inner instanceof Error && inner.message && !inner.message.includes('JSON')) throw inner;
      }
    }
    throw err instanceof Error ? err : new Error(apiErrorMessage(err, 'Could not open file.'));
  }
}

export default api;
