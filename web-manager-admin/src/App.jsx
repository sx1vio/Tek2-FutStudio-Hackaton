import React, { useEffect, useState } from 'react';
import WebApp from './web/WebApp.jsx';
import { api, authStore } from './shared/api.js';

function Login({ onLogin }) {
  const [email, setEmail] = useState('manager@demo.local');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const session = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then((response) => response.ok ? response.json() : Promise.reject(new Error('Identifiants invalides')));
      if (!['manager', 'admin'].includes(session.user.role)) throw new Error('Dashboard reserve aux managers et admins.');
      authStore.setSession(session);
      onLogin(session.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="bg-background text-on-surface min-h-screen flex items-center justify-center px-lg">
      <form onSubmit={submit} className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg custom-shadow space-y-md">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">Industrial Ops</h1>
          <p className="text-label-md font-label-md text-on-surface-variant mt-2">Dashboard manager / admin</p>
        </div>
        <input className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-error text-body-sm">{error}</p>}
        <button className="w-full bg-primary text-on-primary rounded-xl py-3 font-semibold">Se connecter</button>
        <div className="grid grid-cols-2 gap-sm text-label-sm">
          <button type="button" onClick={() => setEmail('manager@demo.local')} className="bg-surface-container-low rounded-lg py-2 text-on-surface-variant">manager</button>
          <button type="button" onClick={() => setEmail('admin@demo.local')} className="bg-surface-container-low rounded-lg py-2 text-on-surface-variant">admin</button>
        </div>
      </form>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(authStore.user());

  useEffect(() => {
    if (!authStore.token) return;
    api('/analytics/pannes-par-equipement').catch(() => {
      authStore.clear();
      setUser(null);
    });
  }, []);

  if (!user || !['manager', 'admin'].includes(user.role)) return <Login onLogin={setUser} />;
  return <WebApp user={user} onLogout={() => { authStore.clear(); setUser(null); }} />;
}
