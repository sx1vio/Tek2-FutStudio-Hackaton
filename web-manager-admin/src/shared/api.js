const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const authStore = {
  get token() { return localStorage.getItem('token'); },
  setSession({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  user() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  }
};

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Erreur API');
  if (response.headers.get('content-type')?.includes('application/json')) return response.json();
  return response;
}

export async function queueOffline(name, payload) {
  const items = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  items.push({ name, payload, created_at: new Date().toISOString() });
  localStorage.setItem('offlineQueue', JSON.stringify(items));
}
