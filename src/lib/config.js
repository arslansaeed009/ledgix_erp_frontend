/**
 * Frontend runtime config — set values in `.env` / `.env.production`
 * or in Vercel/Netlify environment variables (must start with VITE_).
 *
 * Local:     frontend/.env
 * Production build: frontend/.env.production  OR host dashboard env vars
 */

function trimSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

/** Backend API root, must end with /api */
export const API_URL = trimSlash(
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
);

/** Backend origin without /api (for /uploads/… assets) */
export const API_ORIGIN = API_URL.replace(/\/api$/i, '');

/** Optional public frontend URL (for display / future absolute links) */
export const APP_URL = trimSlash(
  import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
);

export const config = {
  API_URL,
  API_ORIGIN,
  APP_URL,
  isProd: import.meta.env.PROD,
};

export default config;
