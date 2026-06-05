import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../shared/api.js';

const Icon = ({ children, className = '' }) => <span className={`material-symbols-outlined ${className}`}>{children}</span>;

export default function WebApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [equipements, setEquipements] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [analytics, setAnalytics] = useState({ pannes: [], pieces: [], tendances: [], risques: [] });

  async function load() {
    const [eq, pa, pi, a1, a2, a3, a4] = await Promise.all([
      api('/equipements'), api('/pannes'), api('/pieces?statut=en_attente'),
      api('/analytics/pannes-par-equipement'), api('/analytics/pieces-frequentes'), api('/analytics/tendances'), api('/analytics/risques')
    ]);
    setEquipements(eq); setPannes(pa); setPieces(pi); setAnalytics({ pannes: a1, pieces: a2, tendances: a3, risques: a4 });
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className="w-[280px] h-screen sticky left-0 top-0 bg-surface-container-lowest border-r border-outline-variant shadow-sm flex flex-col py-md shrink-0">
        <div className="px-md mb-xl">
          <div className="flex items-center gap-sm"><Icon className="text-primary text-headline-md">precision_manufacturing</Icon><div><h1 className="text-headline-sm font-headline-sm font-bold text-primary">Industrial Ops</h1><p className="text-label-md font-label-md text-on-surface-variant">GMAO Management</p></div></div>
        </div>
        <nav className="flex-1 space-y-1">
          {[['dashboard', 'dashboard', 'Dashboard'], ['equipements', 'precision_manufacturing', 'Equipment'], ['pannes', 'report_problem', 'Failures'], ['pieces', 'inventory_2', 'Spare Parts'], ['analytics', 'analytics', 'Analytics'], ['users', 'settings', 'Settings']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setView(id)} className={`w-[calc(100%-16px)] flex items-center gap-md ${view === id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container'} transition-colors rounded-xl px-4 py-3 mx-2`}>
              <Icon>{icon}</Icon><span className="font-label-md text-label-md">{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-md pt-md border-t border-outline-variant">
          <button onClick={onLogout} className="w-full flex items-center gap-sm bg-surface-container-low p-sm rounded-xl text-left"><div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">{user.prenom?.[0] || 'M'}</div><div><p className="text-body-sm font-semibold">{user.prenom} {user.nom}</p><p className="text-label-sm text-on-surface-variant">{user.role}</p></div></button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full h-20 sticky top-0 z-40 bg-surface border-b border-outline-variant shadow-sm flex items-center px-lg">
          <div className="flex-1 flex items-center"><div className="relative w-full max-w-md"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</Icon><input className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-body-md focus:ring-0" placeholder="Search assets, IDs, or history..." /></div></div>
          <div className="flex items-center gap-md"><button className="flex items-center gap-sm px-4 py-2 text-error font-semibold border border-error rounded-lg hover:bg-error-container transition-all"><Icon>emergency</Icon>Emergency Stop</button><button onClick={() => setView('pannes')} className="flex items-center gap-sm px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-container transition-all shadow-md"><Icon>add</Icon>New Work Order</button></div>
        </header>
        <main className="flex-1 p-lg overflow-y-auto">
          {view === 'dashboard' && <Dashboard equipements={equipements} pannes={pannes} pieces={pieces} />}
          {view === 'equipements' && <Equipements equipements={equipements} reload={load} />}
          {view === 'pannes' && <Pannes pannes={pannes} reload={load} />}
          {view === 'pieces' && <Pieces pieces={pieces} reload={load} />}
          {view === 'analytics' && <Analytics analytics={analytics} />}
          {view === 'users' && <Users />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ equipements, pannes, pieces }) {
  const open = pannes.filter((p) => p.statut !== 'clos');
  const stopped = equipements.filter((e) => e.statut === 'arret');
  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-md">
        <StatusCard icon="report_problem" label="Pannes ouvertes" value={open.length} tag="Live" />
        <StatusCard icon="precision_manufacturing" label="Machines en arret" value={stopped.length} tag="Critical" error />
        <StatusCard icon="pending_actions" label="Demandes en attente" value={pieces.length} tag="Pending" />
        <StatusCard icon="engineering" label="Techniciens actifs" value={3} tag="Active" />
      </section>
      <section className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl">
        <div className="flex justify-between items-center mb-md"><h2 className="text-headline-md font-headline-md">Incidents critiques</h2><span className="text-label-md text-outline">Polling 10s</span></div>
        <div className="space-y-sm">{open.filter((p) => ['critique', 'urgent'].includes(p.severite)).map((p) => <Incident key={p.id} panne={p} />)}</div>
      </section>
    </div>
  );
}

function StatusCard({ icon, label, value, tag, error }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant tonal-elevation p-md rounded-xl flex flex-col justify-between group">
      <div><div className="flex justify-between items-start"><Icon className={`p-2 ${error ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'} rounded-lg`}>{icon}</Icon><span className={`text-label-md font-label-md ${error ? 'text-error bg-error-container' : 'text-secondary bg-secondary-container'} px-2 py-0.5 rounded-full`}>{tag}</span></div><h3 className="text-headline-sm font-headline-sm mt-4">{label}</h3><p className="text-display-lg font-display-lg text-on-surface">{String(value).padStart(2, '0')}</p></div>
      <div className="mt-4 pt-4 border-t border-outline-variant flex items-center text-body-sm text-outline group-hover:text-primary transition-colors">View details <Icon className="ml-1 text-[16px]">arrow_forward</Icon></div>
    </div>
  );
}

function Incident({ panne }) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(panne.created_at).getTime()) / 60000));
  return <div className="bg-surface-container-low rounded-xl p-sm flex items-center justify-between"><div><p className="font-semibold">{panne.equipement_nom}</p><p className="text-body-sm text-on-surface-variant">{panne.description}</p></div><span className="bg-error-container text-on-error-container rounded-full px-3 py-1 text-label-sm">{minutes} min</span></div>;
}

function Equipements({ equipements, reload }) {
  const [form, setForm] = useState({ nom: '', modele: '', numero_serie: '', fabricant: '', localisation: '', criticite: 'moyenne', statut: 'actif' });
  const [error, setError] = useState('');
  async function create(event) {
    event.preventDefault();
    setError('');
    if (form.nom.trim().length < 3) return setError('Nom equipement trop court.');
    if (!form.numero_serie.trim()) return setError('Numero de serie obligatoire.');
    if (!form.localisation.trim()) return setError('Localisation obligatoire.');
    await api('/equipements', { method: 'POST', body: JSON.stringify(form) });
    setForm({ nom: '', modele: '', numero_serie: '', fabricant: '', localisation: '', criticite: 'moyenne', statut: 'actif' });
    reload();
  }
  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <form onSubmit={create} className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow p-md grid grid-cols-4 gap-sm">
        {['nom', 'modele', 'numero_serie', 'fabricant', 'localisation'].map((key) => <input key={key} className="bg-surface-container-low rounded-lg border-outline-variant px-3 py-2" placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'nom'} />)}
        <select className="bg-surface-container-low rounded-lg border-outline-variant" value={form.criticite} onChange={(e) => setForm({ ...form, criticite: e.target.value })}><option>faible</option><option>moyenne</option><option>haute</option><option>critique</option></select>
        <button className="bg-primary text-on-primary rounded-lg font-semibold">Créer</button>
        {error && <p className="col-span-4 text-error text-body-sm">{error}</p>}
      </form>
      <div className="space-y-gutter">{equipements.map((e) => <EquipmentDetail key={e.id} equipement={e} />)}</div>
    </div>
  );
}

function EquipmentDetail({ equipement }) {
  const [detail, setDetail] = useState(null);
  const qrRef = useRef(null);
  useEffect(() => { api(`/equipements/${equipement.id}`).then(setDetail); }, [equipement.id]);
  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${equipement.numero_serie || equipement.id}-qr.png`;
    link.click();
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow p-md mb-gutter overflow-hidden relative">
      <div className="flex flex-col md:flex-row gap-lg">
        <div className="w-full md:w-80 h-64 shrink-0 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-low flex items-center justify-center">
          <Icon className="text-primary text-[96px]">precision_manufacturing</Icon>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-md mb-sm">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">{equipement.nom}</h2>
              <span className="px-3 py-1 bg-[#E1F5FE] text-[#01579B] text-label-md font-bold rounded-full uppercase tracking-wider">{equipement.statut}</span>
            </div>
            <p className="text-body-lg text-on-surface-variant mb-md font-medium">Asset ID: {equipement.numero_serie}</p>
            <div className="flex flex-wrap gap-md mt-lg">
              <button className="flex items-center gap-sm px-md py-3 bg-primary text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all active:scale-[0.98]"><Icon>report</Icon>Log New Incident</button>
              <button onClick={downloadQr} className="flex items-center gap-sm px-md py-3 bg-surface border border-outline-variant text-primary rounded-lg font-semibold hover:bg-surface-container-low transition-all active:scale-[0.98]"><Icon>qr_code_2</Icon>Print QR Code</button>
            </div>
          </div>
          <div className="mt-lg pt-md border-t border-outline-variant flex items-center gap-xl">
            <div className="flex items-center gap-sm"><Icon className="text-outline">history</Icon><div><p className="text-label-sm text-on-surface-variant">Last Service</p><p className="text-body-sm font-semibold">12 Days Ago</p></div></div>
            <div className="flex items-center gap-sm"><Icon className="text-outline">timer</Icon><div><p className="text-label-sm text-on-surface-variant">Running Time</p><p className="text-body-sm font-semibold">4,280 Hours</p></div></div>
          </div>
        </div>
        <div className="w-full md:w-auto flex flex-col items-center justify-center p-md bg-surface-container-low rounded-xl border border-outline-variant">
          <div ref={qrRef} className="bg-white p-2 rounded-lg mb-2"><QRCodeCanvas value={`equipement:${equipement.id}`} size={128} /></div>
          <button onClick={downloadQr} className="text-label-md font-bold text-on-surface-variant">DOWNLOAD PNG</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-gutter">
        <div className="lg:col-span-1 space-y-gutter">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low"><h3 className="text-headline-sm font-headline-sm text-on-surface">Technical Specifications</h3></div>
            <div className="p-md space-y-md">
              {[['Model', equipement.modele || 'V-Series Elite 2024'], ['Manufacturer', equipement.fabricant || 'Industrial OEM'], ['Location', equipement.localisation], ['Criticality', equipement.criticite], ['Installation Date', equipement.date_achat || 'Jan 14, 2023'], ['Warranty Status', 'Active until 2026']].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-sm border-b border-outline-variant"><span className="text-body-md text-on-surface-variant">{label}</span><span className="text-body-md font-semibold text-right">{value}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low flex justify-between items-center"><h3 className="text-headline-sm font-headline-sm text-on-surface">Active Work Orders</h3><span className="bg-primary text-on-primary text-label-md px-2 py-1 rounded-full">{detail?.pannes?.length || 0}</span></div>
            <div className="p-md space-y-md">{(detail?.pannes || []).slice(0, 2).map((p) => <div key={p.id} className="p-sm bg-surface rounded-lg border-l-4 border-error"><div className="flex justify-between mb-xs"><span className="text-label-md font-bold text-error uppercase">{p.severite}</span><span className="text-label-sm text-on-surface-variant">#WO-{p.id}</span></div><p className="text-body-sm font-semibold mb-xs">{p.description}</p><p className="text-label-sm text-on-surface-variant">Assigned to: {p.prenom || 'Technician'}</p></div>)}</div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow overflow-hidden h-full">
            <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low flex justify-between items-center"><h3 className="text-headline-sm font-headline-sm text-on-surface">Maintenance History</h3><div className="flex gap-sm"><button className="p-2 hover:bg-surface-container-high rounded-lg"><Icon className="text-on-surface-variant">filter_list</Icon></button><button className="p-2 hover:bg-surface-container-high rounded-lg"><Icon className="text-on-surface-variant">download</Icon></button></div></div>
            <div className="p-lg"><div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-outline-variant"></div><div className="space-y-xl">
              {(detail?.pannes || []).map((p) => <div key={p.id} className="relative pl-12"><div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface-container-highest border-2 border-primary flex items-center justify-center z-10"><Icon className="text-primary text-sm">build</Icon></div><div className="flex justify-between items-start mb-xs"><h4 className="text-body-lg font-bold text-on-surface">{p.description}</h4><span className="text-label-md text-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</span></div><p className="text-body-md text-on-surface-variant mb-sm">Status: {p.statut}. Severity: {p.severite}.</p></div>)}
            </div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pannes({ pannes, reload }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { api('/users').then(setUsers); }, []);
  async function addStep(panne) {
    const tech = users.find((u) => u.role === 'technicien');
    await api(`/pannes/${panne.id}/etapes`, { method: 'POST', body: JSON.stringify({ titre: 'Diagnostic terrain', assignee_id: tech?.id, ordre: 2, deadline: new Date(Date.now() + 86400000).toISOString() }) });
    reload();
  }
  return <div className="max-w-max_content_width mx-auto space-y-md">{pannes.map((p) => <div key={p.id} className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl flex items-center justify-between"><div><h3 className="text-headline-sm font-headline-sm">{p.equipement_nom}</h3><p className="text-body-sm text-on-surface-variant">{p.description}</p></div><button onClick={() => addStep(p)} className="bg-primary text-on-primary rounded-lg px-4 py-2">Assigner étape</button></div>)}</div>;
}

function Pieces({ pieces, reload }) {
  const [error, setError] = useState('');
  async function update(id, statut) {
    setError('');
    if (!['approuve', 'rejete'].includes(statut)) return setError('Statut invalide.');
    await api(`/pieces/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
    reload();
  }
  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-md">
        <StatusCard icon="priority_high" label="Low Stock" value={12} tag="Critical" error />
        <StatusCard icon="pending_actions" label="Pending Approval" value={pieces.length} tag="Pending" />
        <StatusCard icon="inventory_2" label="Tracked Items" value={42} tag="Stock" />
      </section>
      <section className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl space-y-sm">
        {error && <p className="text-error text-body-sm">{error}</p>}
        {pieces.map((p) => <div key={p.id} className="bg-surface-container-low rounded-xl p-sm flex items-center justify-between group hover:bg-surface-container transition-colors"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"><Icon className="text-on-surface-variant">inventory_2</Icon></div><div><p className="font-semibold">{p.piece_nom}</p><p className="text-body-sm text-on-surface-variant">{p.equipement_nom} • x{p.quantite} • {p.urgence}</p><span className="px-1.5 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded">PENDING APPROVAL</span></div></div><div className="flex gap-sm"><button onClick={() => update(p.id, 'approuve')} className="bg-primary text-on-primary rounded-lg px-4 py-2">Approuver</button><button onClick={() => update(p.id, 'rejete')} className="border border-error text-error rounded-lg px-4 py-2">Rejeter</button></div></div>)}
      </section>
    </div>
  );
}

function Analytics({ analytics }) {
  async function exportJson() {
    const data = await api('/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'industrial-export.json';
    link.click();
  }
  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <button onClick={exportJson} className="bg-primary text-on-primary rounded-lg px-4 py-2">Export JSON</button>
      <Chart title="Pannes par équipement" data={analytics.pannes} dataKey="total" kind="bar" xKey="nom" />
      <Chart title="Pièces les plus demandées" data={analytics.pieces} dataKey="total" kind="bar" xKey="piece_nom" />
      <Chart title="Tendances" data={analytics.tendances} dataKey="total" kind="line" xKey="jour" />
      <Chart title="Score de risque par machine" data={analytics.risques} dataKey="score" kind="bar" xKey="nom" />
    </div>
  );
}

function Chart({ title, data, dataKey, xKey, kind }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl h-80">
      <h2 className="text-headline-sm font-headline-sm mb-md">{title}</h2>
      <ResponsiveContainer width="100%" height="80%">
        {kind === 'line' ? <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip /><Line type="monotone" dataKey={dataKey} stroke="#003ec7" /></LineChart> : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip /><Bar dataKey={dataKey} fill="#003ec7" /></BarChart>}
      </ResponsiveContainer>
    </section>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api('/users').then(setUsers); }, []);
  async function role(id, value) {
    await api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role: value }) });
    setUsers(await api('/users'));
  }
  return <div className="max-w-max_content_width mx-auto bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl space-y-sm">{users.map((u) => <div key={u.id} className="flex justify-between items-center bg-surface-container-low rounded-lg p-sm"><span>{u.prenom} {u.nom} • {u.email}</span><select value={u.role} onChange={(e) => role(u.id, e.target.value)} className="rounded-lg bg-surface-container-lowest"><option>technicien</option><option>manager</option><option>admin</option></select></div>)}</div>;
}
