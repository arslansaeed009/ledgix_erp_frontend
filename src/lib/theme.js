const KEY = 'mh_theme';
const listeners = new Set();

export function getStoredTheme() {
  const stored = localStorage.getItem(KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem(KEY, next);
  listeners.forEach((fn) => {
    try { fn(next); } catch { /* ignore */ }
  });
  return next;
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

/** Subscribe to theme changes (Settings toggle, header toggle, etc.). Returns unsubscribe. */
export function subscribeTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
