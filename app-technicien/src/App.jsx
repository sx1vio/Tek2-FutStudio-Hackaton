import React, { useEffect, useState } from 'react';
import MobileApp from './mobile/MobileApp.jsx';
import { api, authStore } from './shared/api.js';

function Login({ onLogin }) {
  const [email, setEmail] = useState('tech@demo.local');
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
      if (session.user.role !== 'technicien') throw new Error('Cette app est reservee aux techniciens.');
      authStore.setSession(session);
      onLogin(session.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="bg-surface text-on-surface min-h-screen flex items-center justify-center px-margin-mobile">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] space-y-md">
        <div>
          <h1 className="text-headline-md font-bold text-primary">FieldTech Pro</h1>
          <p className="text-on-surface-variant text-label-sm mt-1">Application technicien</p>
        </div>
        <input className="w-full bg-surface-container-low rounded-lg border-outline-variant px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full bg-surface-container-low rounded-lg border-outline-variant px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-error text-label-sm">{error}</p>}
        <button className="w-full bg-primary text-on-primary rounded-lg py-3 font-semibold">Se connecter</button>
      </form>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(authStore.user());

  useEffect(() => {
    if (!authStore.token) return;
    api('/pannes?mine=true').catch(() => {
      authStore.clear();
      setUser(null);
    });
  }, []);

  if (!user || user.role !== 'technicien') return <Login onLogin={setUser} />;
  return <MobileApp user={user} onLogout={() => { authStore.clear(); setUser(null); }} />;
}
