import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { MachineVisual } from '../components/MobileChrome.jsx';
import { StepPill } from '../components/Cards.jsx';
import { severityMeta } from '../lib/mobileUtils.js';
import { api, queueOffline } from '../../shared/api.js';

const suggestedParts = ['Mechanical Seal Kit HZ-880', 'High-Temp Lubricant Cartridge', 'Drive Belt V-Series 450'];

export default function ReportScreen({ equipements, selectedEquipment, setSelectedEquipment, onClose, onCreated }) {
  const [form, setForm] = useState({ equipement_id: selectedEquipment?.id || '', description: '', severite: 'urgent' });
  const [files, setFiles] = useState([]);
  const [parts, setParts] = useState(['Mechanical Seal Kit HZ-880']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

    setSubmitting(true);
    try {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 w-full z-50 shadow-sm bg-surface flex items-center justify-between px-margin-mobile h-16">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-100"><Icon className="text-primary">close</Icon></button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Report a Breakdown</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-100"><Icon className="text-on-surface-variant">help_outline</Icon></button>
      </header>

      <div className="fixed top-16 w-full z-40 bg-surface-container-low border-b border-outline-variant px-margin-mobile py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {[{ index: 1, label: 'Asset' }, { index: 2, label: 'Severity' }, { index: 3, label: 'Details' }, { index: 4, label: 'Parts' }].map((step, index) => (
            <React.Fragment key={step.label}>
              <StepPill step={step} active={index < 2} />
              {index < 3 && <div className="flex-1 h-px bg-outline-variant mx-2 mb-4"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <form onSubmit={submit}>
        <main className="pt-36 pb-32 max-w-4xl mx-auto px-margin-mobile">
          <section className="mb-lg p-6 bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col gap-6 items-center">
            <div className="w-full aspect-video bg-surface-container rounded-lg overflow-hidden"><MachineVisual /></div>
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded uppercase tracking-wider">Active Asset</span><span className="text-outline text-label-sm truncate">Location: {currentAsset?.localisation || 'Sector B-12'}</span></div>
              <select className="w-full mb-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 font-label-md" value={form.equipement_id} onChange={(e) => setForm({ ...form, equipement_id: e.target.value })}>
                <option value="">Choose asset</option>{equipements.map((e) => <option key={e.id} value={e.id}>{e.nom} • {e.numero_serie}</option>)}
              </select>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{currentAsset?.nom || 'Pump HZ-880'}</h2>
              <p className="text-on-surface-variant font-body-md">Primary circulation pump for cooling tower assembly. Last maintenance: 14 days ago.</p>
            </div>
          </section>

          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Select Severity Level</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(severityMeta).map(([value, meta]) => (
                <button type="button" key={value} onClick={() => setForm({ ...form, severite: value })} className={`severity-card group flex flex-col items-center p-6 bg-surface-container-lowest border-2 ${form.severite === value ? 'border-primary bg-primary-container/5 shadow-md' : 'border-transparent'} rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all active:scale-95`}>
                  <div className={`severity-icon w-12 h-12 rounded-full ${meta.bgClass} flex items-center justify-center mb-3 transition-transform`}><Icon className={meta.textClass}>{meta.icon}</Icon></div>
                  <span className={`font-label-md text-label-md ${meta.textClass} font-bold`}>{meta.label}</span>
                  <span className="text-[10px] text-outline text-center mt-1">{meta.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-lg">
            <div className="p-8 bg-primary rounded-xl flex flex-col items-center justify-between gap-6 overflow-hidden relative shadow-lg">
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
            <div className="grid grid-cols-2 gap-3 mb-3">
              {['Front', 'Fault detail', 'Serial plate', 'Environment'].map((label, index) => <div key={label} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-label-sm text-on-surface-variant">{index + 1}. {label}</div>)}
            </div>
            <input className="w-full p-4 bg-surface-container-lowest border border-[#F2F2F7] rounded-xl" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles([...e.target.files])} />
          </section>

          <section className="mb-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Suggested Spare Parts</h3><span className="text-[10px] text-outline font-bold">BASED ON ASSET HISTORY</span></div>
            {suggestedParts.map((part, index) => (
              <div key={part} className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between group hover:bg-surface-container transition-colors mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"><Icon className="text-on-surface-variant">{index === 1 ? 'hardware' : 'settings_input_component'}</Icon></div>
                  <div><p className="font-label-md text-label-md text-on-surface">{part}</p><span className={`px-1.5 py-0.5 ${index === 2 ? 'bg-error-container text-error' : 'bg-primary-container/10 text-primary'} text-[10px] font-bold rounded`}>{index === 2 ? '3 IN STOCK' : 'IN STOCK'}</span></div>
                </div>
                <button type="button" onClick={() => setParts(parts.includes(part) ? parts.filter((p) => p !== part) : [...parts, part])} className={`w-10 h-10 rounded-full border border-[#F2F2F7] flex items-center justify-center transition-all active:scale-90 shadow-sm ${parts.includes(part) ? 'bg-primary text-white' : 'bg-white text-primary'}`}><Icon>{parts.includes(part) ? 'check' : 'add'}</Icon></button>
              </div>
            ))}
            {error && <p className="text-error font-label-md mt-4">{error}</p>}
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest p-6 border-t border-[#F2F2F7] z-50">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button disabled={submitting} className="flex-1 py-4 bg-primary text-white rounded-xl font-headline-md text-label-md font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70">{submitting ? 'Submitting...' : 'Submit Report'}</button>
            <button type="button" onClick={() => queueOffline('panne', { form, files, parts }).then(onClose)} className="px-6 py-4 border border-[#F2F2F7] text-on-surface rounded-xl font-label-md hover:bg-surface-container-high transition-all active:scale-95">Draft</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
