import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../shared/api.js';

const Icon = ({ children, className = '' }) => <span className={`material-symbols-outlined ${className}`}>{children}</span>;

/* ─── Labels de traduction ──────────────────────────────────────────────── */
const severiteLabel = { critique: 'Critique', urgent: 'Urgent', modere: 'Modéré', mineur: 'Mineur' };
const statutLabel   = { en_attente: 'En attente', en_cours: 'En cours', clos: 'Clôturé' };
const statutEqLabel = { actif: 'En service', arret: 'Arrêté', maintenance: 'En maintenance' };
const urgenceLabel  = { standard: 'Standard', urgent: 'Urgent', critique: 'Critique' };
const roleLabel     = { technicien: 'Technicien', manager: 'Manager', admin: 'Admin' };
const critLabel     = { faible: 'Faible', moyenne: 'Moyenne', haute: 'Haute', critique: 'Critique' };

/* ─── Styles de sévérité / statut ───────────────────────────────────────── */
const severityStyle = {
  critique: 'bg-error-container text-on-error-container',
  urgent:   'bg-[#ffeadb] text-[#9e3d00]',
  modere:   'bg-[#fff5cc] text-[#6b5900]',
  mineur:   'bg-primary-fixed text-primary'
};
const statusStyle = {
  en_attente: 'bg-secondary-container text-on-secondary-container',
  en_cours:   'bg-[#fff5cc] text-[#6b5900]',
  clos:       'bg-green-100 text-green-700'
};

/* ─── Utilitaire temps relatif ──────────────────────────────────────────── */
function timeAgo(dateStr) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.round(h / 24)}j`;
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-label-md font-semibold toast-anim ${type === 'error' ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}>
      <Icon className="text-[20px]">{type === 'error' ? 'error' : 'check_circle'}</Icon>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <Icon className="text-[16px]">close</Icon>
      </button>
    </div>
  );
}

/* ─── Écran de chargement initial ───────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center gap-md z-50">
      <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-sm shadow-lg">
        <Icon className="text-on-primary text-[28px]">precision_manufacturing</Icon>
      </div>
      <p className="text-headline-sm font-headline-sm text-primary">Industrial Ops</p>
      <div className="flex gap-1.5 mt-sm">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Application principale ────────────────────────────────────────────── */
export default function WebApp({ user, onLogout }) {
  const [view, setView]           = useState('dashboard');
  const [equipements, setEquipements] = useState([]);
  const [pannes, setPannes]       = useState([]);
  const [pieces, setPieces]       = useState([]);
  const [analytics, setAnalytics] = useState({ pannes: [], pieces: [], tendances: [], risques: [] });
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  async function load() {
    try {
      const [eq, pa, pi, a1, a2, a3, a4] = await Promise.all([
        api('/equipements'), api('/pannes'), api('/pieces?statut=en_attente'),
        api('/analytics/pannes-par-equipement'), api('/analytics/pieces-frequentes'),
        api('/analytics/tendances'), api('/analytics/risques')
      ]);
      setEquipements(eq); setPannes(pa); setPieces(pi);
      setAnalytics({ pannes: a1, pieces: a2, tendances: a3, risques: a4 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    ['dashboard',   'dashboard',             'Dashboard'],
    ['equipements', 'precision_manufacturing','Équipements'],
    ['pannes',      'report_problem',         'Ordres de travail'],
    ['pieces',      'inventory_2',            'Pièces de rechange'],
    ['analytics',   'analytics',             'Analytiques'],
    ['users',       'manage_accounts',       'Équipe']
  ];

  const criticalPannes = pannes.filter((p) => ['critique', 'urgent'].includes(p.severite) && p.statut !== 'clos');

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* ── Sidebar ── */}
      <aside className="w-[280px] h-screen sticky left-0 top-0 bg-surface-container-lowest border-r border-outline-variant shadow-sm flex flex-col py-md shrink-0">
        <div className="px-md mb-xl">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Icon className="text-on-primary">precision_manufacturing</Icon>
            </div>
            <div>
              <h1 className="text-headline-sm font-headline-sm font-bold text-primary">Industrial Ops</h1>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Plateforme GMAO</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => { setView(id); setSearch(''); }}
              className={`w-full flex items-center gap-md ${view === id ? 'bg-secondary-container text-on-secondary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container'} transition-colors rounded-xl px-4 py-3`}
            >
              <Icon>{icon}</Icon>
              <span className="font-label-md text-label-md">{label}</span>
              {id === 'pannes' && pannes.filter((p) => p.statut === 'en_attente').length > 0 && (
                <span className="ml-auto bg-error text-on-error text-[10px] font-bold rounded-full px-2 py-0.5">
                  {pannes.filter((p) => p.statut === 'en_attente').length}
                </span>
              )}
              {id === 'pieces' && pieces.length > 0 && (
                <span className="ml-auto bg-primary text-on-primary text-[10px] font-bold rounded-full px-2 py-0.5">
                  {pieces.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-md pt-md border-t border-outline-variant mx-2">
          <button onClick={onLogout} className="w-full flex items-center gap-sm bg-surface-container-low p-sm rounded-xl text-left hover:bg-surface-container transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
              {user.prenom?.[0] || 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold truncate">{user.prenom} {user.nom}</p>
              <p className="text-label-sm text-on-surface-variant capitalize">{roleLabel[user.role] || user.role}</p>
            </div>
            <Icon className="text-on-surface-variant ml-auto">logout</Icon>
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="w-full h-16 sticky top-0 z-40 bg-surface border-b border-outline-variant shadow-sm flex items-center px-lg gap-md">
          <div className="flex-1 relative max-w-md">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</Icon>
            <input
              className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-body-md focus:ring-0 focus:outline-none"
              placeholder="Rechercher équipement, ID, historique…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-md ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <Icon className="text-on-surface-variant">notifications</Icon>
                {(criticalPannes.length > 0 || pieces.length > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden panel-anim">
                  <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-headline-sm text-headline-sm">Notifications</h3>
                    <button onClick={() => setNotifOpen(false)}><Icon className="text-on-surface-variant">close</Icon></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant">
                    {criticalPannes.slice(0, 5).map((p) => (
                      <button key={p.id} onClick={() => { setView('pannes'); setNotifOpen(false); }} className="w-full text-left px-md py-sm hover:bg-surface-container-low transition-colors flex items-start gap-sm">
                        <div className="w-2 h-2 bg-error rounded-full mt-1.5 shrink-0 animate-pulse" />
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold truncate">{p.equipement_nom}</p>
                          <p className="text-label-sm text-on-surface-variant truncate">{p.description}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded ${severityStyle[p.severite]}`}>{severiteLabel[p.severite]}</span>
                      </button>
                    ))}
                    {pieces.slice(0, 3).map((p) => (
                      <button key={`piece-${p.id}`} onClick={() => { setView('pieces'); setNotifOpen(false); }} className="w-full text-left px-md py-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm">
                        <Icon className="text-primary text-[18px] shrink-0">inventory_2</Icon>
                        <p className="text-body-sm flex-1 truncate">{p.piece_nom} <span className="text-on-surface-variant">— en attente</span></p>
                      </button>
                    ))}
                    {criticalPannes.length === 0 && pieces.length === 0 && (
                      <div className="px-md py-lg text-center text-on-surface-variant">
                        <Icon className="text-[36px] text-green-500 mb-xs">check_circle</Icon>
                        <p className="text-body-sm">Aucune notification.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setView('pannes')}
              className="flex items-center gap-sm px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:brightness-110 transition-all shadow-md text-label-md"
            >
              <Icon>add</Icon>Nouvel ordre
            </button>
          </div>
        </header>

        <main key={view} className="flex-1 p-lg overflow-y-auto view-anim">
          {view === 'dashboard'   && <Dashboard equipements={equipements} pannes={pannes} pieces={pieces} setView={setView} />}
          {view === 'equipements' && <Equipements equipements={equipements} reload={load} search={search} setView={setView} showToast={showToast} />}
          {view === 'pannes'      && <Pannes pannes={pannes} reload={load} search={search} showToast={showToast} />}
          {view === 'pieces'      && <Pieces pieces={pieces} reload={load} showToast={showToast} />}
          {view === 'analytics'   && <Analytics analytics={analytics} />}
          {view === 'users'       && <Users showToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
function Dashboard({ equipements, pannes, pieces, setView }) {
  const open     = pannes.filter((p) => p.statut !== 'clos');
  const stopped  = equipements.filter((e) => e.statut === 'arret');
  const critical = pannes.filter((p) => ['critique', 'urgent'].includes(p.severite) && p.statut !== 'clos');

  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Vue des opérations</h2>
        <p className="text-body-md text-on-surface-variant">Intelligence industrielle en temps réel</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard icon="report_problem" label="Pannes en cours"      value={open.length}         sub={`${critical.length} critique(s)`}   error={critical.length > 0} onClick={() => setView('pannes')} />
        <StatCard icon="precision_manufacturing" label="Équipements arrêtés" value={stopped.length} sub="Action immédiate requise"         error={stopped.length > 0}  onClick={() => setView('equipements')} />
        <StatCard icon="pending_actions" label="Pièces en attente"   value={pieces.length}       sub="En attente d'approbation"            onClick={() => setView('pieces')} />
        <StatCard icon="engineering"     label="Parc total"          value={equipements.length}  sub="Équipements suivis"                  onClick={() => setView('equipements')} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Incidents critiques */}
        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl">
          <div className="flex justify-between items-center mb-md">
            <h2 className="text-headline-sm font-headline-sm">Incidents critiques</h2>
            <span className="text-label-sm text-outline flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />Flux en direct
            </span>
          </div>
          {critical.length === 0 && (
            <div className="flex flex-col items-center justify-center py-lg text-on-surface-variant">
              <Icon className="text-[48px] mb-sm text-green-500">check_circle</Icon>
              <p className="text-body-md">Aucun incident critique — tout est nominal !</p>
            </div>
          )}
          <div className="space-y-sm">
            {critical.slice(0, 6).map((p) => (
              <div key={p.id} className="bg-surface-container-low rounded-xl p-sm flex items-center justify-between gap-md">
                <div className="flex items-center gap-sm min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${p.severite === 'critique' ? 'bg-error animate-pulse' : 'bg-[#9e3d00]'}`} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.equipement_nom}</p>
                    <p className="text-body-sm text-on-surface-variant truncate">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-sm shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-label-sm font-bold ${severityStyle[p.severite]}`}>{severiteLabel[p.severite]}</span>
                  <span className="text-label-sm text-on-surface-variant">{timeAgo(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* État du parc */}
        <section className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl">
          <h2 className="text-headline-sm font-headline-sm mb-md">État du parc</h2>
          <div className="space-y-sm">
            {[['actif','En service','check_circle','text-green-600'],['maintenance','En maintenance','build','text-[#6b5900]'],['arret','Arrêté','cancel','text-error']].map(([status, label, icon, cls]) => {
              const count = equipements.filter((e) => e.statut === status).length;
              const pct   = equipements.length ? Math.round((count / equipements.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between mb-xs">
                    <span className="flex items-center gap-xs text-body-sm"><Icon className={`text-[16px] ${cls}`}>{icon}</Icon>{label}</span>
                    <span className="font-semibold text-body-sm">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${status === 'actif' ? 'bg-green-500' : status === 'arret' ? 'bg-error' : 'bg-[#6b5900]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-md pt-md border-t border-outline-variant space-y-sm">
            <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider">Pièces en attente</h3>
            {pieces.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-body-sm">
                <span className="truncate flex-1">{p.piece_nom}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-label-sm font-bold ${p.urgence === 'critique' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>{urgenceLabel[p.urgence]}</span>
              </div>
            ))}
            {pieces.length === 0 && <p className="text-body-sm text-on-surface-variant">Aucune demande en attente.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, error, onClick }) {
  return (
    <button onClick={onClick} className="stat-card bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl flex flex-col justify-between group text-left w-full">
      <div className="flex justify-between items-start mb-md">
        <Icon className={`p-2 ${error ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'} rounded-lg`}>{icon}</Icon>
      </div>
      <div>
        <p className="text-display-lg font-display-lg text-on-surface">{String(value).padStart(2, '0')}</p>
        <p className="text-body-sm font-semibold mt-xs">{label}</p>
        <p className="text-label-sm text-on-surface-variant mt-xs">{sub}</p>
      </div>
    </button>
  );
}

/* ─── Équipements ────────────────────────────────────────────────────────── */
function Equipements({ equipements, reload, search, setView, showToast }) {
  const [form, setForm]       = useState({ nom: '', modele: '', numero_serie: '', fabricant: '', localisation: '', criticite: 'moyenne', statut: 'actif', date_achat: '' });
  const [error, setError]     = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = equipements.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.nom?.toLowerCase().includes(q) || e.localisation?.toLowerCase().includes(q) || e.numero_serie?.toLowerCase().includes(q);
  });

  async function create(event) {
    event.preventDefault();
    setError('');
    if (form.nom.trim().length < 3) return setError('Nom trop court (3 caractères minimum).');
    if (!form.numero_serie.trim())  return setError('Numéro de série obligatoire.');
    if (!form.localisation.trim())  return setError('Localisation obligatoire.');
    await api('/equipements', { method: 'POST', body: JSON.stringify(form) });
    setForm({ nom: '', modele: '', numero_serie: '', fabricant: '', localisation: '', criticite: 'moyenne', statut: 'actif', date_achat: '' });
    setShowForm(false);
    reload();
    showToast('Équipement enregistré avec succès.');
  }

  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline-lg font-headline-lg">Registre des équipements</h2>
          <p className="text-body-md text-on-surface-variant">{filtered.length} actif{filtered.length > 1 ? 's' : ''} suivi{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-sm px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-md hover:brightness-110 transition-all text-label-md">
          <Icon>{showForm ? 'close' : 'add'}</Icon>{showForm ? 'Annuler' : 'Ajouter un actif'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow p-md panel-anim">
          <h3 className="text-headline-sm font-headline-sm mb-md">Nouvel actif</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-sm mb-md">
            {[['nom', 'Nom de l\'actif *'], ['modele', 'Modèle'], ['numero_serie', 'N° de série *'], ['fabricant', 'Fabricant'], ['localisation', 'Localisation *']].map(([key, placeholder]) => (
              <input key={key} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ))}
            <input type="date" className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" value={form.date_achat} onChange={(e) => setForm({ ...form, date_achat: e.target.value })} />
            <select className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" value={form.criticite} onChange={(e) => setForm({ ...form, criticite: e.target.value })}>
              <option value="faible">Criticité faible</option>
              <option value="moyenne">Criticité moyenne</option>
              <option value="haute">Criticité haute</option>
              <option value="critique">Critique</option>
            </select>
            <select className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="actif">En service</option>
              <option value="arret">Arrêté</option>
              <option value="maintenance">En maintenance</option>
            </select>
          </div>
          {error && <p className="text-error text-body-sm mb-sm">{error}</p>}
          <button className="bg-primary text-on-primary rounded-lg px-md py-2 font-semibold text-label-md hover:brightness-110 transition-all">Enregistrer l'actif</button>
        </form>
      )}

      <div className="space-y-md">
        {filtered.map((e) => <EquipmentCard key={e.id} equipement={e} setView={setView} showToast={showToast} />)}
        {filtered.length === 0 && (
          <div className="text-center py-lg text-on-surface-variant">
            <Icon className="text-[48px] mb-sm">search_off</Icon>
            <p className="text-body-md">Aucun équipement ne correspond à la recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentCard({ equipement, setView, showToast }) {
  const [detail, setDetail]   = useState(null);
  const [expanded, setExpanded] = useState(false);
  const qrRef = useRef(null);

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${equipement.numero_serie || equipement.id}-qr.png`;
    link.click();
    showToast('QR code téléchargé.');
  }

  useEffect(() => {
    if (expanded && !detail) api(`/equipements/${equipement.id}`).then(setDetail).catch(() => {});
  }, [expanded]);

  const statColor = { actif: 'text-green-600', arret: 'text-error', maintenance: 'text-[#6b5900]' };
  const statDot   = { actif: 'bg-green-500', arret: 'bg-error', maintenance: 'bg-[#6b5900]' };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow overflow-hidden">
      <button className="w-full p-md flex items-center justify-between text-left hover:bg-surface-container-low transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-md min-w-0">
          <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
            <Icon className="text-primary text-[28px]">precision_manufacturing</Icon>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-headline-sm font-headline-sm text-on-surface">{equipement.nom}</h3>
              <span className={`text-label-sm font-bold ${statColor[equipement.statut] || 'text-on-surface-variant'} flex items-center gap-xs`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statDot[equipement.statut] || 'bg-outline'}`} />
                {statutEqLabel[equipement.statut] || equipement.statut}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${severityStyle[equipement.criticite] || 'bg-surface-container text-on-surface-variant'}`}>{critLabel[equipement.criticite] || equipement.criticite}</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">{equipement.numero_serie} • {equipement.localisation}</p>
          </div>
        </div>
        <Icon className={`text-on-surface-variant transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>expand_more</Icon>
      </button>

      {expanded && (
        <div className="border-t border-outline-variant p-md grid grid-cols-1 lg:grid-cols-3 gap-lg panel-anim">
          <div className="lg:col-span-2 space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              {[['Modèle', equipement.modele], ['Fabricant', equipement.fabricant], ['Localisation', equipement.localisation], ["Date d'achat", equipement.date_achat], ['N° de série', equipement.numero_serie]].map(([label, value]) => value && (
                <div key={label} className="p-sm bg-surface-container-low rounded-lg">
                  <p className="text-label-sm text-on-surface-variant">{label}</p>
                  <p className="text-body-sm font-semibold mt-xs">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Ordres de travail récents</h4>
              {(detail?.pannes || []).slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-sm bg-surface rounded-lg mb-xs border-l-4 border-error">
                  <p className="text-body-sm font-semibold line-clamp-1 flex-1">{p.description}</p>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-label-sm font-bold ${severityStyle[p.severite]}`}>{severiteLabel[p.severite]}</span>
                </div>
              ))}
              {!(detail?.pannes?.length) && <p className="text-body-sm text-on-surface-variant">Aucun ordre de travail enregistré.</p>}
            </div>
          </div>

          <div className="flex flex-col items-center gap-md">
            <div ref={qrRef} className="bg-white p-3 rounded-xl border border-outline-variant shadow-sm">
              <QRCodeCanvas value={`equipement:${equipement.id}`} size={140} />
            </div>
            <button onClick={downloadQr} className="flex items-center gap-sm px-md py-2 bg-surface border border-outline-variant text-primary rounded-lg font-semibold hover:bg-surface-container-low transition-all text-label-md w-full justify-center">
              <Icon>download</Icon>Télécharger QR
            </button>
            <button
              onClick={() => setView('pannes')}
              className="flex items-center gap-sm px-md py-2 bg-primary text-on-primary rounded-lg font-semibold hover:brightness-110 transition-all text-label-md w-full justify-center"
            >
              <Icon>report</Icon>Signaler un incident
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Ordres de travail (Pannes) ─────────────────────────────────────────── */
function Pannes({ pannes, reload, search, showToast }) {
  const [users, setUsers]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [newStep, setNewStep]     = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [runningDiag, setRunningDiag] = useState(false);
  const [filter, setFilter]       = useState('all');
  const [busy, setBusy]           = useState(false);

  useEffect(() => { api('/users').then(setUsers); }, []);

  async function loadDetail(panne) {
    setSelected(panne);
    const d = await api(`/pannes/${panne.id}`).catch(() => null);
    setDetail(d);
  }

  async function changeStatus(statut) {
    setBusy(true);
    try {
      await api(`/pannes/${selected.id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
      reload();
      loadDetail(selected);
      showToast(`Statut mis à jour : ${statutLabel[statut]}`);
    } finally {
      setBusy(false);
    }
  }

  async function addStep(e) {
    e.preventDefault();
    if (!newStep.trim()) return;
    const tech = users.find((u) => u.id === Number(assigneeId)) || users.find((u) => u.role === 'technicien');
    await api(`/pannes/${selected.id}/etapes`, {
      method: 'POST',
      body: JSON.stringify({ titre: newStep, assignee_id: tech?.id, ordre: (detail?.etapes?.length || 0) + 1, deadline: new Date(Date.now() + 86400000).toISOString() })
    });
    setNewStep('');
    loadDetail(selected);
    showToast('Étape ajoutée.');
  }

  async function validateStep(stepId) {
    await api(`/etapes/${stepId}/statut`, { method: 'PUT', body: JSON.stringify({ statut: 'termine' }) });
    loadDetail(selected);
    showToast('Étape validée.');
  }

  async function approvePartRequest(pieceId, statut) {
    await api(`/pieces/${pieceId}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
    loadDetail(selected);
    showToast(statut === 'approuve' ? 'Pièce approuvée.' : 'Pièce rejetée.', statut === 'approuve' ? 'success' : 'error');
  }

  async function runDiagnostic() {
    setRunningDiag(true);
    try {
      await api(`/pannes/${selected.id}/diagnostic`, { method: 'POST', body: JSON.stringify({}) });
      loadDetail(selected);
      showToast('Diagnostic IA généré avec succès.');
    } catch {
      showToast('Erreur lors du diagnostic IA.', 'error');
    } finally {
      setRunningDiag(false);
    }
  }

  const filtered = pannes.filter((p) => {
    const matchFilter = filter === 'all' || p.statut === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || p.description?.toLowerCase().includes(q) || p.equipement_nom?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const technicians = users.filter((u) => u.role === 'technicien');

  const parseDiagnostic = (row) => {
    if (!row?.resultat_json) return null;
    try { return JSON.parse(row.resultat_json); } catch { return null; }
  };

  return (
    <div className="max-w-max_content_width mx-auto flex gap-lg items-start">
      {/* Panneau liste */}
      <div className={`space-y-md transition-all ${selected ? 'w-[420px] shrink-0' : 'flex-1'}`}>
        <div>
          <h2 className="text-headline-lg font-headline-lg">Ordres de travail</h2>
          <p className="text-body-md text-on-surface-variant">{pannes.length} au total</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[['all', 'Toutes'], ['en_attente', 'En attente'], ['en_cours', 'En cours'], ['clos', 'Clôturées']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-4 py-1.5 rounded-full text-label-sm font-bold transition-colors ${filter === val ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-sm">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => loadDetail(p)}
              className={`w-full text-left bg-surface-container-lowest border ${selected?.id === p.id ? 'border-primary shadow-md' : 'border-outline-variant'} custom-shadow p-md rounded-xl hover:shadow-md transition-all`}
            >
              <div className="flex justify-between items-start mb-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface">{p.equipement_nom}</p>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-xs">{p.description}</p>
                </div>
                <span className={`ml-2 shrink-0 px-2 py-0.5 text-label-sm font-bold rounded-full ${statusStyle[p.statut] || 'bg-surface-variant'}`}>{statutLabel[p.statut] || p.statut}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${severityStyle[p.severite]}`}>{severiteLabel[p.severite]}</span>
                <span className="text-label-sm text-on-surface-variant">{p.prenom} {p.nom}</span>
                <span className="text-label-sm text-on-surface-variant ml-auto">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-on-surface-variant text-body-md py-4 text-center">Aucun ordre de travail pour ce filtre.</p>}
        </div>
      </div>

      {/* Panneau détail */}
      {selected && detail && (
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl custom-shadow self-start sticky top-8 overflow-hidden panel-anim">
          <div className="p-md border-b border-outline-variant bg-surface-container-low flex justify-between items-start">
            <div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">{detail.equipement_nom}</h3>
              <p className="text-body-sm text-on-surface-variant mt-xs">#{detail.id} • {detail.localisation}</p>
              <p className="text-body-sm text-on-surface mt-sm line-clamp-3">{detail.description}</p>
            </div>
            <button onClick={() => { setSelected(null); setDetail(null); }} className="p-1 rounded-full hover:bg-surface-container-high ml-4 shrink-0 transition-colors">
              <Icon>close</Icon>
            </button>
          </div>

          <div className="p-md space-y-md max-h-[80vh] overflow-y-auto">
            {/* Sévérité & statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${severityStyle[detail.severite]}`}>{severiteLabel[detail.severite]}</span>
              <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${statusStyle[detail.statut]}`}>{statutLabel[detail.statut]}</span>
              <span className="text-label-sm text-on-surface-variant ml-auto">{new Date(detail.created_at).toLocaleString('fr-FR')}</span>
            </div>

            {/* Changer le statut */}
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Changer le statut</p>
              <div className="flex gap-2">
                {[['en_attente', 'En attente'], ['en_cours', 'En cours'], ['clos', 'Clôturé']].map(([s, label]) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={busy}
                    className={`flex-1 py-2 rounded-lg text-label-sm font-bold transition-colors disabled:opacity-60 ${detail.statut === s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Étapes du workflow */}
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Étapes du workflow</p>
              <div className="space-y-xs mb-sm">
                {(detail.etapes || []).map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg gap-sm">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.statut === 'termine' ? 'bg-green-500' : 'border-2 border-outline'}`}>
                        {step.statut === 'termine' && <Icon className="text-white text-[12px]">check</Icon>}
                      </div>
                      <span className={`text-body-sm truncate ${step.statut === 'termine' ? 'line-through text-on-surface-variant' : 'text-on-surface font-medium'}`}>{step.titre}</span>
                    </div>
                    {step.statut !== 'termine' && (
                      <button onClick={() => validateStep(step.id)} className="shrink-0 px-2 py-1 bg-primary text-on-primary rounded text-label-sm font-bold hover:brightness-110 transition-all">Terminé</button>
                    )}
                  </div>
                ))}
                {!(detail.etapes?.length) && <p className="text-body-sm text-on-surface-variant">Aucune étape définie.</p>}
              </div>
              <form onSubmit={addStep} className="flex gap-sm">
                <input value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder="Ajouter une étape…" className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" />
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="bg-surface-container-low border border-outline-variant rounded-lg px-2 text-body-sm">
                  <option value="">Assigner…</option>
                  {technicians.map((u) => <option key={u.id} value={u.id}>{u.prenom}</option>)}
                </select>
                <button className="bg-primary text-on-primary rounded-lg px-3 text-label-sm font-bold hover:brightness-110 transition-all">Ajouter</button>
              </form>
            </div>

            {/* Pièces de rechange */}
            {(detail.pieces || []).length > 0 && (
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Demandes de pièces</p>
                <div className="space-y-xs">
                  {detail.pieces.map((piece) => (
                    <div key={piece.id} className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg gap-sm">
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold truncate">{piece.piece_nom}</p>
                        <p className="text-label-sm text-on-surface-variant">x{piece.quantite} • {urgenceLabel[piece.urgence]}</p>
                      </div>
                      {piece.statut === 'en_attente' ? (
                        <div className="flex gap-xs shrink-0">
                          <button onClick={() => approvePartRequest(piece.id, 'approuve')} className="px-2 py-1 bg-primary text-on-primary rounded text-label-sm font-bold hover:brightness-110">Approuver</button>
                          <button onClick={() => approvePartRequest(piece.id, 'rejete')} className="px-2 py-1 border border-error text-error rounded text-label-sm font-bold hover:bg-error-container">Rejeter</button>
                        </div>
                      ) : (
                        <span className={`shrink-0 px-2 py-1 rounded-full text-label-sm font-bold ${piece.statut === 'approuve' ? 'bg-green-100 text-green-700' : 'bg-error-container text-on-error-container'}`}>
                          {piece.statut === 'approuve' ? 'Approuvée' : 'Rejetée'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic IA */}
            <div>
              <div className="flex items-center justify-between mb-sm">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Diagnostic IA</p>
                <button
                  onClick={runDiagnostic}
                  disabled={runningDiag}
                  className="flex items-center gap-xs px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-lg text-label-sm font-bold hover:brightness-110 transition-all disabled:opacity-70"
                >
                  <Icon className={`text-[16px] ${runningDiag ? 'animate-spin' : ''}`}>{runningDiag ? 'sync' : 'psychology'}</Icon>
                  {runningDiag ? 'Analyse en cours…' : 'Lancer le diagnostic IA'}
                </button>
              </div>
              {(() => {
                const d = parseDiagnostic(detail.diagnostic);
                if (!d) return <p className="text-body-sm text-on-surface-variant">Aucun diagnostic. Cliquez sur "Lancer le diagnostic IA" pour en générer un.</p>;
                return (
                  <div className="p-md bg-primary-fixed text-on-primary-fixed rounded-xl space-y-sm">
                    <p className="font-semibold">{d.type_defaut_probable}</p>
                    <p className="text-body-sm opacity-80">{d.cause_possible || d.resultat_texte}</p>
                    {d.pieces_suggerees?.length > 0 && (
                      <div>
                        <p className="text-label-sm opacity-70 mb-xs">Pièces suggérées :</p>
                        <p className="text-body-sm">{d.pieces_suggerees.join(' • ')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Photos */}
            {(detail.photos || []).length > 0 && (
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Photos ({detail.photos.length})</p>
                <div className="grid grid-cols-2 gap-sm">
                  {detail.photos.map((photo) => (
                    <div key={photo.id} className="aspect-video bg-surface-container rounded-lg overflow-hidden">
                      <img src={`http://localhost:3001${photo.url}`} alt={photo.annotation} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Pièces de rechange ─────────────────────────────────────────────────── */
function Pieces({ pieces, reload, showToast }) {
  async function update(id, statut) {
    await api(`/pieces/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
    reload();
    showToast(statut === 'approuve' ? 'Pièce approuvée.' : 'Pièce rejetée.', statut === 'approuve' ? 'success' : 'error');
  }

  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <div>
        <h2 className="text-headline-lg font-headline-lg">Demandes de pièces de rechange</h2>
        <p className="text-body-md text-on-surface-variant">{pieces.length} en attente d'approbation</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-md">
        <StatCard icon="priority_high"  label="Urgence critique"   value={pieces.filter((p) => p.urgence === 'critique').length} sub="Action immédiate requise" error />
        <StatCard icon="pending_actions" label="En attente"         value={pieces.length} sub="En attente du responsable" />
        <StatCard icon="inventory_2"    label="Références catalogue" value={42}           sub="Dans le catalogue" />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant custom-shadow rounded-xl overflow-hidden">
        <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm">Demandes en attente</h3>
          <span className="text-label-sm text-on-surface-variant">{pieces.length} article{pieces.length > 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-outline-variant">
          {pieces.map((p) => (
            <div key={p.id} className="p-md flex items-center justify-between gap-md hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-md min-w-0">
                <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="text-on-surface-variant">inventory_2</Icon>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface truncate">{p.piece_nom}</p>
                  <p className="text-body-sm text-on-surface-variant">{p.equipement_nom} • Qté : {p.quantite}</p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${p.urgence === 'critique' ? 'bg-error-container text-on-error-container' : p.urgence === 'urgent' ? 'bg-[#ffeadb] text-[#9e3d00]' : 'bg-secondary-container text-on-secondary-container'}`}>{urgenceLabel[p.urgence]}</span>
                </div>
              </div>
              <div className="flex gap-sm shrink-0">
                <button onClick={() => update(p.id, 'approuve')} className="flex items-center gap-xs px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:brightness-110 transition-all">
                  <Icon className="text-[16px]">check</Icon>Approuver
                </button>
                <button onClick={() => update(p.id, 'rejete')} className="flex items-center gap-xs px-4 py-2 border border-error text-error rounded-lg font-semibold text-label-md hover:bg-error-container transition-all">
                  <Icon className="text-[16px]">close</Icon>Rejeter
                </button>
              </div>
            </div>
          ))}
          {pieces.length === 0 && (
            <div className="p-lg text-center text-on-surface-variant">
              <Icon className="text-[48px] text-green-500 mb-sm">check_circle</Icon>
              <p className="text-body-md">Toutes les demandes ont été traitées !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Analytiques ────────────────────────────────────────────────────────── */
function Analytics({ analytics }) {
  async function exportJson() {
    const data = await api('/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `industrial-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline-lg font-headline-lg">Intelligence des données</h2>
          <p className="text-body-md text-on-surface-variant">Analytiques industrielles et insights prédictifs</p>
        </div>
        <button onClick={exportJson} className="flex items-center gap-sm px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-semibold hover:bg-surface-container-low transition-all text-label-md shadow-sm">
          <Icon>download</Icon>Exporter JSON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <Chart title="Pannes par équipement"      subtitle="Identifier les actifs les plus fragiles"          data={analytics.pannes}    dataKey="total" kind="bar"  xKey="nom" />
        <Chart title="Pièces les plus demandées"  subtitle="Anticiper les besoins en stock critique"          data={analytics.pieces}    dataKey="total" kind="bar"  xKey="piece_nom" />
        <Chart title="Tendances des pannes"        subtitle="Détecter les saisonnalités et cycles"             data={analytics.tendances} dataKey="total" kind="line" xKey="jour" />
        <Chart title="Score de risque par machine" subtitle="Prioriser les ressources de maintenance"          data={analytics.risques}   dataKey="score" kind="bar"  xKey="nom" />
      </div>
    </div>
  );
}

function Chart({ title, subtitle, data, dataKey, xKey, kind }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl">
      <h2 className="text-headline-sm font-headline-sm">{title}</h2>
      <p className="text-body-sm text-on-surface-variant mb-md">{subtitle}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'line'
            ? <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" /><XAxis dataKey={xKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey={dataKey} stroke="#003ec7" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
            : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" /><XAxis dataKey={xKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey={dataKey} fill="#003ec7" radius={[4, 4, 0, 0]} /></BarChart>}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ─── Gestion de l'équipe ────────────────────────────────────────────────── */
function Users({ showToast }) {
  const [users, setUsers]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ email: '', password: '', role: 'technicien', nom: '', prenom: '' });

  async function load() { setUsers(await api('/users')); }
  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    await api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
    load();
    showToast('Rôle mis à jour.');
  }

  async function createUser(e) {
    e.preventDefault();
    await api('/users', { method: 'POST', body: JSON.stringify(form) });
    setForm({ email: '', password: '', role: 'technicien', nom: '', prenom: '' });
    setShowForm(false);
    load();
    showToast('Membre créé avec succès.');
  }

  const roleStyle = { technicien: 'bg-secondary-container text-on-secondary-container', manager: 'bg-primary-fixed text-on-primary-fixed', admin: 'bg-error-container text-on-error-container' };

  return (
    <div className="max-w-max_content_width mx-auto space-y-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline-lg font-headline-lg">Gestion de l'équipe</h2>
          <p className="text-body-md text-on-surface-variant">{users.length} membre{users.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-sm px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-md hover:brightness-110 transition-all text-label-md">
          <Icon>{showForm ? 'close' : 'person_add'}</Icon>{showForm ? 'Annuler' : 'Ajouter un membre'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="bg-surface-container-lowest border border-outline-variant custom-shadow p-md rounded-xl space-y-md panel-anim">
          <h3 className="text-headline-sm font-headline-sm">Nouveau membre</h3>
          <div className="grid grid-cols-2 gap-sm">
            {[['prenom', 'Prénom'], ['nom', 'Nom'], ['email', 'Email'], ['password', 'Mot de passe']].map(([key, placeholder]) => (
              <input key={key} type={key === 'password' ? 'password' : 'text'} placeholder={placeholder} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            ))}
            <select className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="technicien">Technicien</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="bg-primary text-on-primary rounded-lg px-md py-2 font-semibold text-label-md hover:brightness-110 transition-all">Créer le membre</button>
        </form>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant custom-shadow rounded-xl overflow-hidden">
        <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low">
          <h3 className="font-headline-sm text-headline-sm">Membres</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {users.map((u) => (
            <div key={u.id} className="p-md flex items-center justify-between gap-md hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-md min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shrink-0">
                  {u.prenom?.[0] || u.email[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{u.prenom} {u.nom}</p>
                  <p className="text-body-sm text-on-surface-variant truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${roleStyle[u.role] || ''}`}>{roleLabel[u.role] || u.role}</span>
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1 text-body-sm">
                  <option value="technicien">Technicien</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
