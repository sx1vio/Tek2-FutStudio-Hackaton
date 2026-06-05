const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DB_NAME = 'fieldtech-offline';
const DB_VERSION = 1;
const STORE = 'queue';

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
  const db = await openOfflineDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add({ name, payload, created_at: new Date().toISOString() });
  await txDone(tx);
  db.close();
}

export async function getOfflineQueue() {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE, 'readonly');
  const request = tx.objectStore(STORE).getAll();
  const rows = await requestDone(request);
  await txDone(tx);
  db.close();
  return rows;
}

export async function syncOfflineQueue() {
  if (!navigator.onLine || !authStore.token) return { synced: 0, remaining: (await getOfflineQueue()).length };
  const db = await openOfflineDb();
  const rows = await requestDone(db.transaction(STORE, 'readonly').objectStore(STORE).getAll());
  let synced = 0;

  for (const row of rows) {
    try {
      if (row.name === 'panne') {
        const panne = await api('/pannes', { method: 'POST', body: JSON.stringify(row.payload.form) });
        if (row.payload.files?.length) {
          const body = new FormData();
          row.payload.files.slice(0, 4).forEach((file) => body.append('photos', file));
          await api(`/pannes/${panne.id}/photos`, { method: 'POST', body });
        }
        for (const piece_nom of row.payload.parts || []) {
          await api(`/pannes/${panne.id}/pieces`, {
            method: 'POST',
            body: JSON.stringify({ piece_nom, quantite: 1, urgence: row.payload.form.severite === 'critique' ? 'critique' : 'urgent' })
          });
        }
        await api(`/pannes/${panne.id}/diagnostic`, { method: 'POST', body: JSON.stringify({}) });
      }
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(row.id);
      await txDone(tx);
      synced += 1;
    } catch {
      break;
    }
  }

  db.close();
  return { synced, remaining: (await getOfflineQueue()).length };
}

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestDone(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
