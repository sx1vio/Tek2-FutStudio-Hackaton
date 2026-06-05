import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api, getOfflineQueue, queueOffline, syncOfflineQueue } from '../shared/api.js';

const Icon = ({ children, className = '' }) => <span className={`material-symbols-outlined ${className}`}>{children}</span>;

const machineVisual = (
  <div className="w-full h-full bg-surface-container flex items-center justify-center">
    <Icon className="text-primary text-[88px]">precision_manufacturing</Icon>
  </div>
);

export default function MobileApp({ user, onLogout }) {
  const [screen, setScreen] = useState('dashboard');
  const [equipements, setEquipements] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedPanne, setSelectedPanne] = useState(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');

  async function load() {
    const [eq, pa] = await Promise.all([api('/equipements'), api('/pannes?mine=true')]);
    setEquipements(eq);
    setPannes(pa);
    if (!selectedEquipment && eq[0]) setSelectedEquipment(eq[0]);
    setOfflineCount((await getOfflineQueue()).length);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    async function syncNow() {
      const result = await syncOfflineQueue();
      if (result.synced) {
        setSyncMessage(`${result.synced} offline report synced.`);
        await load();
      }
      setOfflineCount(result.remaining);
    }
    window.addEventListener('online', syncNow);
    syncNow();
    return () => window.removeEventListener('online', syncNow);
  }, []);

  if (screen === 'report') {
    return (
      <ReportScreen
        equipements={equipements}
        selectedEquipment={selectedEquipment}
        setSelectedEquipment={setSelectedEquipment}
        onClose={() => setScreen('dashboard')}
        onCreated={async (panne) => {
          setSelectedPanne(panne);
          await load();
          setScreen('intervention');
        }}
      />
    );
  }

  if (screen === 'intervention') {
    return <InterventionScreen panne={selectedPanne || pannes[0]} onBack={() => setScreen('dashboard')} reload={load} />;
  }

  if (screen === 'scan') {
    return (
      <ScanScreen
        equipements={equipements}
        onBack={() => setScreen('dashboard')}
        onSelect={(equipment) => {
          setSelectedEquipment(equipment);
          setScreen('asset');
        }}
      />
    );
  }

  if (screen === 'asset') {
    return <AssetScreen equipment={selectedEquipment} onBack={() => setScreen('dashboard')} onReport={() => setScreen('report')} />;
  }

  return (
    <DashboardScreen
      user={user}
      pannes={pannes}
      offlineCount={offlineCount}
      syncMessage={syncMessage}
      onLogout={onLogout}
      setScreen={setScreen}
      onOpenPanne={(panne) => {
        setSelectedPanne(panne);
        setScreen('intervention');
      }}
    />
  );
}

function MobileShell({ title, leading = 'menu', onLeading, trailing, children, bottomNav, className = '' }) {
  return (
    <div className={`bg-surface text-on-surface min-h-screen ${bottomNav ? 'pb-24' : ''} ${className}`}>
      <header className="fixed top-0 w-full z-50 shadow-sm bg-surface flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onLeading} className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100">
            <Icon>{leading}</Icon>
          </button>
          {typeof title === 'string' ? <h1 className="font-headline-md text-headline-md font-bold text-primary truncate">{title}</h1> : title}
        </div>
        {trailing}
      </header>
      {children}
      {bottomNav}
    </div>
  );
}

function DashboardScreen({ user, pannes, offlineCount, syncMessage, onLogout, setScreen, onOpenPanne }) {
  const open = pannes.filter((p) => p.statut !== 'clos');
  const critical = pannes.find((p) => p.severite === 'critique') || pannes[0];

  return (
    <MobileShell
      title="FieldTech Pro"
      onLeading={() => setScreen('dashboard')}
      trailing={
        <div className="flex items-center gap-2">
          <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100"><Icon>notifications</Icon></button>
          <button onClick={onLogout} className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs overflow-hidden">{user.prenom?.[0] || 'T'}</button>
        </div>
      }
      bottomNav={<BottomNav current="dashboard" setScreen={setScreen} />}
    >
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-24 md:py-12">
        <section className="mb-lg">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Welcome back, {user.prenom || 'J. Miller'}</h2>
          <p className="font-body-md text-on-surface-variant">Here is your fleet status for today.</p>
          {(offlineCount > 0 || syncMessage) && <p className="mt-2 text-label-sm text-primary">{offlineCount > 0 ? `${offlineCount} offline report(s) waiting for sync.` : syncMessage}</p>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-lg">
          <SummaryCard title="Assigned Breakdowns" icon="engineering" value={String(pannes.length).padStart(2, '0')} note="+2 today" noteClass="text-error" />
          <SummaryCard title="Active Tasks" icon="assignment_turned_in" value={String(open.length).padStart(2, '0')} note="Scheduled for 14:00" iconClass="text-secondary bg-secondary-fixed" />
          <div className="md:col-span-4 bg-error-container p-md rounded-xl shadow-lg border-l-4 border-error flex flex-col justify-between h-40 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Icon className="text-[120px]">warning</Icon></div>
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-on-error-container font-label-md flex items-center gap-2"><Icon className="text-[18px]">report</Icon> Critical Alert</h3>
                <p className="text-on-error-container font-body-md mt-1 font-semibold">{critical?.equipement_nom || 'No critical alert'}</p>
              </div>
              <button onClick={() => critical && onOpenPanne(critical)} className="bg-error text-on-error font-label-md px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg border-2 border-on-error/20">Intervene Now</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-start">
          <section className="md:col-span-2 space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Priority Interventions</h3>
              <button onClick={() => setScreen('intervention')} className="text-primary font-label-md hover:underline">View All</button>
            </div>
            <div className="flex gap-2 mb-2">
              <button className="bg-primary text-on-primary px-4 py-1 rounded-full text-label-sm">All</button>
              <button className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-label-sm hover:bg-primary-container transition-colors">Urgent</button>
              <button className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-label-sm hover:bg-primary-container transition-colors">Normal</button>
            </div>
            {pannes.map((panne) => <InterventionCard key={panne.id} panne={panne} onOpen={() => onOpenPanne(panne)} />)}
          </section>

          <section className="space-y-md">
            <h3 className="font-headline-md text-headline-md text-on-surface">Fleet View</h3>
            <div className="bg-surface-container rounded-xl aspect-square relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-40">
                {Array.from({ length: 16 }).map((_, index) => <div key={index} className="border border-white/70" />)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <button onClick={() => setScreen('scan')} className="absolute left-[45%] top-[35%] w-10 h-10 bg-error text-white rounded-full shadow-lg flex items-center justify-center animate-pulse"><Icon>location_on</Icon></button>
              <button onClick={() => setScreen('scan')} className="absolute left-[20%] top-[58%] w-8 h-8 bg-primary text-white rounded-full shadow-lg flex items-center justify-center"><Icon className="text-[18px]">location_on</Icon></button>
            </div>
            <button onClick={() => setScreen('report')} className="w-full py-4 bg-primary text-on-primary rounded-xl font-headline-md text-label-md font-bold shadow-lg shadow-primary/20 active:scale-95">Report a Breakdown</button>
          </section>
        </div>
      </main>
    </MobileShell>
  );
}

function SummaryCard({ title, icon, value, note, noteClass = 'text-on-surface-variant', iconClass = 'text-primary bg-primary-fixed-dim' }) {
  return (
    <div className="md:col-span-4 bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col justify-between h-40 group hover:shadow-md transition-shadow active:scale-95 cursor-pointer">
      <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-md">{title}</span>
        <Icon className={`${iconClass} p-2 rounded-lg`}>{icon}</Icon>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-headline-xl font-headline-xl text-on-surface">{value}</span>
        <span className={`${noteClass} font-label-sm flex items-center gap-1`}>{note}</span>
      </div>
    </div>
  );
}

function InterventionCard({ panne, onOpen }) {
  const urgent = ['critique', 'urgent'].includes(panne.severite);
  return (
    <button onClick={onOpen} className="w-full text-left bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center"><Icon className={urgent ? 'text-tertiary' : 'text-primary'}>precision_manufacturing</Icon></div>
        <div>
          <h4 className="font-label-md text-on-surface">{panne.description || 'Hydraulic Pump Failure'}</h4>
          <p className="text-on-surface-variant text-label-sm">Machine ID: #{panne.equipement_id} • {panne.localisation || 'Sector 7G'} • <span className={urgent ? 'text-error font-semibold' : 'text-on-surface-variant'}>{new Date(panne.created_at).toLocaleTimeString()}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm"><Icon className="text-[16px]">location_on</Icon>{panne.localisation || 'North Depot'}</div>
        <span className={`${urgent ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'} px-3 py-1 rounded-full text-label-sm font-semibold`}>{urgent ? 'Urgent' : 'Normal'}</span>
        <Icon className="text-primary">chevron_right</Icon>
      </div>
    </button>
  );
}

function ReportScreen({ equipements, selectedEquipment, setSelectedEquipment, onClose, onCreated }) {
  const [form, setForm] = useState({ equipement_id: selectedEquipment?.id || '', description: '', severite: 'urgent' });
  const [files, setFiles] = useState([]);
  const [parts, setParts] = useState(['Mechanical Seal Kit HZ-880']);
  const [error, setError] = useState('');
  const currentAsset = equipements.find((e) => String(e.id) === String(form.equipement_id)) || selectedEquipment || equipements[0];

  useEffect(() => {
    if (currentAsset) setSelectedEquipment(currentAsset);
  }, [form.equipement_id]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.equipement_id) return setError('Choose an asset before submitting.');
    if (form.description.trim().length < 12) return setError('Describe the issue with at least 12 characters.');
    if (files.length > 4) return setError('Use a maximum of 4 guided photos.');

    if (!navigator.onLine) {
      await queueOffline('panne', { form, files, parts });
      onClose();
      return;
    }

    const panne = await api('/pannes', { method: 'POST', body: JSON.stringify(form) });
    if (files.length) {
      const body = new FormData();
      files.slice(0, 4).forEach((file) => body.append('photos', file));
      await api(`/pannes/${panne.id}/photos`, { method: 'POST', body });
    }
    for (const piece_nom of parts) {
      await api(`/pannes/${panne.id}/pieces`, { method: 'POST', body: JSON.stringify({ piece_nom, quantite: 1, urgence: form.severite === 'critique' ? 'critique' : 'urgent' }) });
    }
    await api(`/pannes/${panne.id}/diagnostic`, { method: 'POST', body: JSON.stringify({}) });
    onCreated(panne);
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 w-full z-50 shadow-sm bg-surface flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-100"><Icon className="text-primary">close</Icon></button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Report a Breakdown</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-100"><Icon className="text-on-surface-variant">help_outline</Icon></button>
      </header>

      <div className="fixed top-16 w-full z-40 bg-surface-container-low border-b border-outline-variant px-margin-mobile py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {['Asset', 'Severity', 'Details', 'Parts'].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full ${index < 2 ? 'bg-primary text-white' : 'bg-surface-container-highest text-outline'} flex items-center justify-center text-[10px] font-bold`}>{index + 1}</div>
                <span className={`text-[10px] font-bold ${index < 2 ? 'text-primary' : 'text-outline'} uppercase`}>{step}</span>
              </div>
              {index < 3 && <div className="flex-1 h-px bg-outline-variant mx-2 mb-4"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <form onSubmit={submit}>
        <main className="pt-36 pb-32 max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
          <section className="mb-lg p-6 bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 aspect-video bg-surface-container rounded-lg overflow-hidden">{machineVisual}</div>
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded uppercase tracking-wider">Active Asset</span><span className="text-outline text-label-sm">Location: {currentAsset?.localisation || 'Sector B-12'}</span></div>
              <select className="w-full mb-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 font-label-md" value={form.equipement_id} onChange={(e) => setForm({ ...form, equipement_id: e.target.value })}>
                <option value="">Choose asset</option>{equipements.map((e) => <option key={e.id} value={e.id}>{e.nom} • {e.numero_serie}</option>)}
              </select>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{currentAsset?.nom || 'Pump HZ-880'}</h2>
              <p className="text-on-surface-variant font-body-md">Primary circulation pump for cooling tower assembly. Last maintenance: 14 days ago.</p>
            </div>
          </section>

          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Select Severity Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['critique', 'report', 'Critical', 'Total Failure', 'text-error', 'bg-error-container'],
                ['urgent', 'warning', 'Urgent', 'Limited Ops', 'text-[#9e3d00]', 'bg-[#ffeadb]'],
                ['modere', 'error_outline', 'Moderate', 'Efficiency Loss', 'text-[#6b5900]', 'bg-[#fff5cc]'],
                ['mineur', 'info', 'Minor', 'Noise/Vibration', 'text-primary', 'bg-primary-fixed']
              ].map(([value, icon, label, hint, textClass, bgClass]) => (
                <button type="button" key={value} onClick={() => setForm({ ...form, severite: value })} className={`severity-card group flex flex-col items-center p-6 bg-surface-container-lowest border-2 ${form.severite === value ? 'border-primary bg-primary-container/5 shadow-md' : 'border-transparent'} rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg active:scale-95`}>
                  <div className={`severity-icon w-12 h-12 rounded-full ${bgClass} flex items-center justify-center mb-3 transition-transform`}><Icon className={textClass}>{icon}</Icon></div>
                  <span className={`font-label-md text-label-md ${textClass} font-bold`}>{label}</span>
                  <span className="text-[10px] text-outline text-center mt-1">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-lg">
            <div className="p-8 bg-primary rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container rounded-full opacity-20"></div>
              <div className="z-10"><h4 className="font-headline-md text-headline-md text-white mb-2">Voice Report</h4><p className="text-primary-fixed font-body-md max-w-md">Record a quick description of the issue. Our AI will transcribe and categorize the details automatically.</p></div>
              <button type="button" className="z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform group"><Icon className="text-primary text-4xl">mic</Icon></button>
            </div>
          </section>

          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Manual Breakdown Details</h3>
            <textarea className="w-full min-h-[160px] p-6 bg-surface-container-lowest border border-[#F2F2F7] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline" placeholder="Describe the symptoms, error codes, or physical damage observed..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
          </section>

          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Guided Photo Capture</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {['Front', 'Fault detail', 'Serial plate', 'Environment'].map((label, index) => <div key={label} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-label-sm text-on-surface-variant">{index + 1}. {label}</div>)}
            </div>
            <input className="w-full p-4 bg-surface-container-lowest border border-[#F2F2F7] rounded-xl" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles([...e.target.files])} />
          </section>

          <section className="mb-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Suggested Spare Parts</h3><span className="text-[10px] text-outline font-bold">BASED ON ASSET HISTORY</span></div>
            {['Mechanical Seal Kit HZ-880', 'High-Temp Lubricant Cartridge', 'Drive Belt V-Series 450'].map((part, index) => (
              <div key={part} className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between group hover:bg-surface-container transition-colors mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"><Icon className="text-on-surface-variant">{index === 1 ? 'hardware' : 'settings_input_component'}</Icon></div>
                  <div><p className="font-label-md text-label-md text-on-surface">{part}</p><span className={`px-1.5 py-0.5 ${index === 2 ? 'bg-error-container text-error' : 'bg-primary-container/10 text-primary'} text-[10px] font-bold rounded`}>{index === 2 ? '3 IN STOCK' : 'IN STOCK'}</span></div>
                </div>
                <button type="button" onClick={() => setParts(parts.includes(part) ? parts.filter((p) => p !== part) : [...parts, part])} className={`w-10 h-10 rounded-full border border-[#F2F2F7] flex items-center justify-center transition-all active:scale-90 shadow-sm ${parts.includes(part) ? 'bg-primary text-white' : 'bg-white text-primary'}`}><Icon>{parts.includes(part) ? 'check' : 'add'}</Icon></button>
              </div>
            ))}
            <button type="button" className="mt-4 w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-outline font-label-md hover:bg-surface-container-low transition-colors active:scale-98">+ Browse Parts Catalog</button>
            {error && <p className="text-error font-label-md mt-4">{error}</p>}
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest p-6 border-t border-[#F2F2F7] z-50">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button className="flex-1 py-4 bg-primary text-white rounded-xl font-headline-md text-label-md font-bold shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95">Submit Report</button>
            <button type="button" onClick={() => queueOffline('panne', { form, files, parts }).then(onClose)} className="px-6 py-4 border border-[#F2F2F7] text-on-surface rounded-xl font-label-md hover:bg-surface-container-high transition-all active:scale-95">Save Draft</button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function InterventionScreen({ panne, onBack, reload }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const diagnostic = detail?.diagnostic?.resultat_json ? JSON.parse(detail.diagnostic.resultat_json) : null;

  useEffect(() => {
    if (panne?.id) api(`/pannes/${panne.id}`).then(setDetail).catch(() => {});
  }, [panne?.id]);

  const steps = detail?.etapes?.length ? detail.etapes : [
    { id: 'a', titre: 'Isolate valve section', statut: 'termine' },
    { id: 'b', titre: 'Drain residual pressure', statut: 'termine' },
    { id: 'c', titre: 'Disassemble old valve', statut: 'en_attente' },
    { id: 'd', titre: 'Install replacement Unit-C valve', statut: 'en_attente' }
  ];
  const current = steps.find((step) => step.statut !== 'termine') || steps[steps.length - 1];
  const doneCount = steps.filter((step) => step.statut === 'termine').length;
  const progress = Math.round((doneCount / steps.length) * 100);

  async function validate() {
    if (!current?.id || String(current.id).length === 1) return setMessage('Demo step validated.');
    setBusy(true);
    await api(`/etapes/${current.id}/statut`, { method: 'PUT', body: JSON.stringify({ statut: 'termine' }) });
    setBusy(false);
    setMessage('Step validated.');
    reload();
  }

  return (
    <div className="text-on-surface min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 shadow-sm bg-surface flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100">arrow_back</button>
          <div className="min-w-0"><h1 className="font-headline-md text-headline-md font-bold text-primary truncate">{panne?.equipement_nom || 'Valve Replacement'}</h1><p className="text-label-sm font-label-sm text-on-surface-variant">Station 4A • ID: #{panne?.id || 'IV-9821'}</p></div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-primary ml-4"><Icon className="text-[18px]">timer</Icon><span className="font-label-md">01:42:15</span></div>
      </header>

      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <div className="mb-md">
          <div className="flex justify-between items-end mb-xs"><span className="text-label-md font-label-md text-primary">Step {Math.min(doneCount + 1, steps.length)} of {steps.length}</span><span className="text-label-sm font-label-sm text-outline">{progress}% Complete</span></div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
        </div>

        <div className="space-y-md">
          {steps.map((step) => {
            const completed = step.statut === 'termine';
            const active = step.id === current?.id;
            if (completed) {
              return <div key={step.id} className="flex items-center gap-md p-md bg-surface-container-low rounded-xl opacity-60"><div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Icon className="text-white text-[18px]">check</Icon></div><span className="text-body-md font-body-md line-through text-on-surface-variant italic">{step.titre}</span></div>;
            }
            if (!active) {
              return <div key={step.id} className="flex items-center gap-md p-md border border-outline-variant rounded-xl opacity-40"><div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-outline"></div><span className="text-body-md font-body-md text-on-surface-variant">{step.titre}</span></div>;
            }
            return (
              <div key={step.id} className="p-md rounded-xl shadow-lg step-active border-primary-container bg-surface-container-lowest bg-primary-container">
                <div className="flex items-start gap-md mb-md">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-1"><div className="w-2.5 h-2.5 bg-primary rounded-full"></div></div>
                  <div className="flex-1"><h3 className="text-headline-md font-headline-md text-on-surface mb-xs">{step.titre}</h3><p className="text-body-md font-body-md text-on-surface-variant">Unbolt the main flange and safely remove the legacy Unit-B valve from the mounting bracket.</p><button className="mt-sm flex items-center gap-xs text-primary font-label-md hover:underline"><Icon className="text-[18px]">menu_book</Icon>View Reference Manual</button></div>
                </div>
                <div className="mt-md p-md rounded-lg border-2 border-dashed border-outline-variant bg-surface flex flex-col items-center justify-center gap-sm">
                  <div className="w-full overflow-hidden rounded-lg mb-sm relative h-48 bg-surface-container-low flex items-center justify-center"><div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none z-10 flex items-center justify-center"><div className="w-3/4 h-3/4 border border-dashed border-white/50 rounded-md"></div></div><Icon className="text-primary text-[64px]">add_a_photo</Icon></div>
                  <button className="flex items-center gap-sm px-md py-sm bg-surface-container-high rounded-full text-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all"><Icon>add_a_photo</Icon>Capture New Photo</button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface shadow-[0_-10px_20px_rgba(0,0,0,0.05)] p-md z-50">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-md items-center">
          <div className="hidden md:flex flex-col flex-1"><span className="text-label-sm font-label-sm text-outline-variant">TOTAL INTERVENTION TIME</span><span className="text-headline-md font-headline-md text-on-surface">01:42:15</span></div>
          <button onClick={validate} className="w-full md:w-auto px-xl py-4 bg-primary text-on-primary font-headline-md rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-md">{busy ? 'Validating...' : 'Validate Step'}<Icon>arrow_forward</Icon></button>
          {message && <span className="text-label-sm text-primary">{message}</span>}
        </div>
      </div>
      {diagnostic && (
        <div className="fixed left-margin-mobile right-margin-mobile bottom-28 bg-primary-fixed text-on-primary-fixed p-sm rounded-xl shadow-lg z-40 md:left-auto md:right-8 md:w-80">
          <p className="font-label-md">{diagnostic.type_defaut_probable || 'Diagnostic IA'}</p>
          <p className="text-label-sm mt-1">{diagnostic.cause_possible || diagnostic.resultat_texte}</p>
        </div>
      )}
    </div>
  );
}

function ScanScreen({ equipements, onBack, onSelect }) {
  const [status, setStatus] = useState('Camera check pending.');
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera unavailable in this browser.');
      return undefined;
    }
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        setStatus('Camera ready. Scan a machine QR code.');
      })
      .catch(() => setStatus('Camera permission denied or unavailable.'));

    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 220 }, false);
    scanner.render(async (decoded) => {
      const id = decoded.split(':').pop();
      const equipment = await api(`/equipements/${id}`);
      onSelect(equipment);
      scanner.clear();
    }, () => {});
    return () => scanner.clear().catch(() => {});
  }, []);

  return (
    <MobileShell title="Scan Asset" leading="arrow_back" onLeading={onBack}>
      <main className="pt-24 pb-10 px-margin-mobile max-w-3xl mx-auto space-y-md">
        <section className="bg-surface-container-lowest p-md rounded-xl border border-[#F2F2F7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-md">
          <div className="flex items-center justify-between"><h2 className="font-headline-md text-headline-md text-on-surface">QR Code Scanner</h2><Icon className="text-primary">qr_code_scanner</Icon></div>
          <p className="text-label-sm text-on-surface-variant">{status}</p>
          <div id="reader" className="overflow-hidden rounded-xl bg-surface-container-low"></div>
        </section>
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Demo assets</h3>
          {equipements.map((equipment) => <button key={equipment.id} onClick={() => onSelect(equipment)} className="w-full text-left p-4 bg-surface-container-low rounded-xl flex items-center justify-between"><span>{equipment.nom}<span className="block text-label-sm text-on-surface-variant">{equipment.numero_serie}</span></span><Icon className="text-primary">chevron_right</Icon></button>)}
        </section>
      </main>
    </MobileShell>
  );
}

function AssetScreen({ equipment, onBack, onReport }) {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (equipment?.id) api(`/equipements/${equipment.id}`).then(setDetail).catch(() => {});
  }, [equipment?.id]);

  if (!equipment) return null;

  return (
    <MobileShell title="Asset Profile" leading="arrow_back" onLeading={onBack}>
      <main className="pt-24 pb-10 px-margin-mobile max-w-3xl mx-auto space-y-md">
        <section className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7]">
          <div className="aspect-video bg-surface-container rounded-lg overflow-hidden mb-4">{machineVisual}</div>
          <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded uppercase tracking-wider">{equipment.statut}</span><span className="text-outline text-label-sm">{equipment.localisation}</span></div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{equipment.nom}</h2>
          <p className="text-on-surface-variant font-body-md">{equipment.modele} • {equipment.numero_serie}</p>
          <button onClick={onReport} className="mt-6 w-full py-4 bg-primary text-white rounded-xl font-headline-md text-label-md font-bold shadow-lg shadow-primary/20">Report a Breakdown</button>
        </section>
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Breakdown history</h3>
          {(detail?.pannes || []).map((panne) => <div key={panne.id} className="p-4 bg-surface-container-low rounded-xl"><p className="font-label-md text-on-surface">{panne.description}</p><p className="text-label-sm text-on-surface-variant">{panne.severite} • {panne.statut}</p></div>)}
        </section>
      </main>
    </MobileShell>
  );
}

function BottomNav({ current, setScreen }) {
  const items = [
    ['dashboard', 'dashboard', 'Home'],
    ['scan', 'qr_code_scanner', 'Scan'],
    ['report', 'report_problem', 'Report'],
    ['intervention', 'assignment_turned_in', 'Tasks']
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center md:hidden z-50">
      {items.map(([id, icon, label]) => (
        <button key={id} onClick={() => setScreen(id)} className={`flex flex-col items-center gap-1 text-label-sm ${current === id ? 'text-primary' : 'text-on-surface-variant'}`}>
          <Icon>{icon}</Icon><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
