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
      }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Identifiants invalides')));
      if (session.user.role !== 'technicien') throw new Error('Cette app est réservée aux techniciens.');
      authStore.setSession(session);
      onLogin(session.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-margin-mobile bg-surface">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#F2F2F7] space-y-md">
        <div>
          <h1 className="text-headline-md font-bold text-primary">FieldTech Pro</h1>
          <p className="text-on-surface-variant text-label-sm mt-1">Application technicien</p>
        </div>
        <input className="w-full bg-surface-container-low rounded-lg border-outline-variant px-4 py-3 text-body-md" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full bg-surface-container-low rounded-lg border-outline-variant px-4 py-3 text-body-md" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-error text-label-sm">{error}</p>}
        <button className="w-full bg-primary text-on-primary rounded-lg py-3 font-semibold text-label-md">Se connecter</button>
      </form>
    </div>
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

  const isLoggedIn = user && user.role === 'technicien';

  return (
    <div className="min-h-screen bg-surface-container-high flex justify-center items-start">
      {/* Conteneur centré — plein écran sur mobile, cadre max 430px sur desktop */}
      <div className="w-full max-w-[430px] h-screen overflow-hidden bg-surface flex flex-col shadow-none sm:shadow-2xl">
        {isLoggedIn
          ? <MobileApp user={user} onLogout={() => { authStore.clear(); setUser(null); }} />
          : <Login onLogin={setUser} />
        }
      </div>
    </div>
  );
}
