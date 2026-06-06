import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { MachineVisual } from '../components/MobileChrome.jsx';
import { StepPill } from '../components/Cards.jsx';
import { severityMeta } from '../lib/mobileUtils.js';
import { api, queueOffline } from '../../shared/api.js';

const STEPS = [
  { index: 1, label: 'Équipement' },
  { index: 2, label: 'Sévérité' },
  { index: 3, label: 'Détails' },
  { index: 4, label: 'Pièces' }
];

const SUGGESTED_PARTS = [
  { name: 'Mechanical Seal Kit HZ-880',       icon: 'settings_input_component', stock: true },
  { name: 'High-Temp Lubricant Cartridge',    icon: 'hardware',                  stock: true },
  { name: 'Drive Belt V-Series 450',          icon: 'settings_input_component', stock: false }
];

export default function ReportScreen({ equipements, selectedEquipment, setSelectedEquipment, onClose, onCreated }) {
  const [form, setForm]         = useState({ equipement_id: selectedEquipment?.id || '', description: '', severite: 'urgent' });
  const [files, setFiles]       = useState([]);
  const [parts, setParts]       = useState(['Mechanical Seal Kit HZ-880']);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording]   = useState(false);
  const recognitionRef = useRef(null);

  const currentAsset = equipements.find((e) => String(e.id) === String(form.equipement_id)) || selectedEquipment || equipements[0];

  useEffect(() => {
    if (currentAsset) setSelectedEquipment(currentAsset);
  }, [form.equipement_id]);

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Reconnaissance vocale non supportée dans ce navigateur. Utilisez Chrome ou Edge.'); return; }
    if (recording && recognitionRef.current) { recognitionRef.current.stop(); setRecording(false); return; }
    const recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setForm((f) => ({ ...f, description: f.description ? `${f.description} ${text}` : text }));
      setRecording(false);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend   = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.equipement_id) return setError('Choisissez un équipement avant de soumettre.');
    if (form.description.trim().length < 12) return setError('Décrivez la panne avec au moins 12 caractères.');
    if (files.length > 4) return setError('Maximum 4 photos guidées autorisées.');

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
        await api(`/pannes/${panne.id}/pieces`, {
          method: 'POST',
          body: JSON.stringify({ piece_nom, quantite: 1, urgence: form.severite === 'critique' ? 'critique' : 'urgent' })
        });
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
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-on-background">

      {/* En-tête */}
      <header className="shrink-0 z-50 bg-surface border-b border-outline-variant/40 flex items-center justify-between px-margin-mobile h-16">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95">
            <Icon className="text-primary">close</Icon>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Signaler une panne</h1>
        </div>
        <div className="flex items-center gap-xs px-3 py-1 rounded-full bg-surface-container-high text-label-sm text-on-surface-variant">
          <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-error animate-pulse'}`} />
          {navigator.onLine ? 'En ligne' : 'Hors ligne'}
        </div>
      </header>

      {/* Indicateur d'étapes */}
      <div className="shrink-0 z-40 bg-surface-container-low border-b border-outline-variant px-margin-mobile py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.label}>
              <StepPill step={step} active={index < 2} />
              {index < STEPS.length - 1 && <div className="flex-1 h-px bg-outline-variant mx-2 mb-4" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Formulaire scrollable */}
      <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-margin-mobile pt-4 pb-4">

          {/* Sélecteur d'équipement */}
          <section className="mb-lg p-6 bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col gap-6">
            <div className="w-full aspect-video bg-surface-container rounded-lg overflow-hidden">
              <MachineVisual />
            </div>
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded uppercase tracking-wider">Équipement actif</span>
                <span className="text-outline text-label-sm truncate">Localisation : {currentAsset?.localisation || '—'}</span>
              </div>
              <select
                className="w-full mb-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 font-label-md"
                value={form.equipement_id}
                onChange={(e) => setForm({ ...form, equipement_id: e.target.value })}
              >
                <option value="">Choisir un équipement…</option>
                {equipements.map((e) => <option key={e.id} value={e.id}>{e.nom} • {e.numero_serie}</option>)}
              </select>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{currentAsset?.nom || '—'}</h2>
              <p className="text-on-surface-variant font-body-md">{currentAsset?.fabricant} • {currentAsset?.modele}</p>
            </div>
          </section>

          {/* Sévérité */}
          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Sélectionner la sévérité</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(severityMeta).map(([value, meta]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setForm({ ...form, severite: value })}
                  className={`flex flex-col items-center p-4 bg-surface-container-lowest border-2 ${form.severite === value ? 'border-primary bg-primary-container/5 shadow-md' : 'border-transparent'} rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all active:scale-95`}
                >
                  <div className={`w-10 h-10 rounded-full ${meta.bgClass} flex items-center justify-center mb-2`}>
                    <Icon className={meta.textClass}>{meta.icon}</Icon>
                  </div>
                  <span className={`font-label-md text-label-md ${meta.textClass} font-bold`}>{meta.label}</span>
                  <span className="text-[10px] text-outline text-center mt-1 leading-tight">{meta.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Signalement vocal */}
          <section className="mb-lg">
            <div className="p-6 bg-primary rounded-xl flex flex-col items-center gap-4 overflow-hidden relative shadow-lg">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container rounded-full opacity-20" />
              <div className="z-10 text-center">
                <h4 className="font-headline-md text-headline-md text-white mb-1">Signalement vocal</h4>
                <p className="text-primary-fixed font-body-md text-sm">Décrivez la panne à voix haute — l'IA transcrit automatiquement.</p>
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                className={`z-10 w-20 h-20 ${recording ? 'bg-error' : 'bg-white'} rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all`}
              >
                <Icon className={`text-4xl ${recording ? 'text-white animate-pulse' : 'text-primary'}`}>{recording ? 'stop' : 'mic'}</Icon>
              </button>
              {recording && <p className="z-10 text-white text-label-sm animate-pulse">Écoute en cours… parlez maintenant</p>}
            </div>
          </section>

          {/* Description */}
          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Description de la panne</h3>
            <textarea
              className="w-full min-h-[140px] p-4 bg-surface-container-lowest border border-[#F2F2F7] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline resize-none"
              placeholder="Décrivez les symptômes, codes d'erreur ou dommages physiques observés…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </section>

          {/* Photos guidées */}
          <section className="mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Capture photo guidée</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['1. Vue de face', '2. Détail de la panne', '3. Plaque de série', '4. Environnement'].map((label) => (
                <div key={label} className="p-2 bg-surface-container-low rounded-xl border border-outline-variant text-label-sm text-on-surface-variant flex items-center gap-1.5">
                  <Icon className="text-[14px] shrink-0">photo_camera</Icon><span className="truncate">{label}</span>
                </div>
              ))}
            </div>
            <label className="w-full flex items-center justify-center gap-2 p-4 bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors">
              <Icon className="text-primary">upload</Icon>
              <span className="text-label-md text-on-surface-variant">{files.length ? `${files.length} photo(s) sélectionnée(s)` : 'Appuyer pour capturer ou importer des photos'}</span>
              <input className="hidden" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles([...e.target.files])} />
            </label>
          </section>

          {/* Pièces suggérées */}
          <section className="mb-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Pièces de rechange suggérées</h3>
              <span className="text-[10px] text-outline font-bold">BASÉ SUR L'HISTORIQUE</span>
            </div>
            {SUGGESTED_PARTS.map(({ name, icon, stock }, index) => (
              <div key={name} className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between mb-3 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Icon className="text-on-surface-variant">{icon}</Icon>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{name}</p>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${index === 2 ? 'bg-error-container text-error' : 'bg-primary-container/10 text-primary'}`}>
                      {stock ? 'EN STOCK' : '3 EN STOCK'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setParts(parts.includes(name) ? parts.filter((p) => p !== name) : [...parts, name])}
                  className={`w-10 h-10 rounded-full border border-[#F2F2F7] flex items-center justify-center transition-all active:scale-90 shadow-sm shrink-0 ${parts.includes(name) ? 'bg-primary text-white' : 'bg-white text-primary'}`}
                >
                  <Icon>{parts.includes(name) ? 'check' : 'add'}</Icon>
                </button>
              </div>
            ))}
            {error && <p className="text-error font-label-md mt-4 flex items-center gap-2"><Icon className="text-[16px]">error</Icon>{error}</p>}
          </section>
        </main>

        {/* Pied de page fixe */}
        <footer className="shrink-0 bg-surface-container-lowest px-margin-mobile py-3 border-t border-[#F2F2F7]">
          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              className="flex-1 py-4 bg-primary text-white rounded-xl font-label-md font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting ? <><Icon className="animate-spin">sync</Icon>Envoi en cours…</> : <><Icon>send</Icon>Envoyer le rapport</>}
            </button>
            <button
              type="button"
              onClick={() => queueOffline('panne', { form, files, parts }).then(onClose)}
              className="px-5 py-4 border border-[#F2F2F7] text-on-surface rounded-xl font-label-md hover:bg-surface-container-high transition-all active:scale-95"
            >
              Brouillon
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
