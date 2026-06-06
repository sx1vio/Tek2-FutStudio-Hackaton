import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { AppBar, Screen } from '../components/MobileChrome.jsx';
import { api } from '../../shared/api.js';
import { getDiagnosticFromDetail, severityMeta } from '../lib/mobileUtils.js';

export default function InterventionScreen({ panne, onBack, reload }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('steps');

  async function loadDetail() {
    if (!panne?.id) return;
    const d = await api(`/pannes/${panne.id}`).catch(() => null);
    setDetail(d);
  }

  useEffect(() => { loadDetail(); }, [panne?.id]);

  const diagnostic = getDiagnosticFromDetail(detail);
  const steps = detail?.etapes?.length ? detail.etapes : [
    { id: 'a', titre: 'Isoler la section concernée', statut: 'termine' },
    { id: 'b', titre: 'Purger la pression résiduelle', statut: 'termine' },
    { id: 'c', titre: 'Démonter le composant défaillant', statut: 'en_attente' },
    { id: 'd', titre: 'Installer la pièce de remplacement', statut: 'en_attente' }
  ];

  const current = steps.find((s) => s.statut !== 'termine') || steps[steps.length - 1];
  const doneCount = steps.filter((s) => s.statut === 'termine').length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const allDone = steps.length > 0 && doneCount === steps.length;
  const meta = severityMeta[panne?.severite] || severityMeta.modere;

  async function validate() {
    if (!current?.id || String(current.id).length === 1) {
      setMessage('Étape démo validée.');
      return;
    }
    setBusy(true);
    try {
      await api(`/etapes/${current.id}/statut`, { method: 'PUT', body: JSON.stringify({ statut: 'termine' }) });
      setMessage('Étape validée.');
      await loadDetail();
      reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function closePanne() {
    if (!panne?.id) return;
    await api(`/pannes/${panne.id}/statut`, { method: 'PUT', body: JSON.stringify({ statut: 'clos' }) });
    reload();
    onBack();
  }

  return (
    <Screen>
      <AppBar
        title={panne?.equipement_nom || 'Intervention'}
        subtitle={`#INT-${panne?.id || '?'} • ${panne?.localisation || ''}`}
        leading="arrow_back"
        onLeading={onBack}
        trailing={
          <div className="flex items-center gap-xs px-3 py-1 bg-surface-container-high rounded-full text-primary">
            <Icon className="text-[18px]">timer</Icon>
            <span className="font-label-md text-label-md">{progress}%</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-margin-mobile pt-4 pb-4 max-w-3xl mx-auto w-full">
        {/* En-tête panne */}
        <div className="mb-md p-md bg-surface-container-lowest rounded-xl border border-[#F2F2F7] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-xs">
            <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${meta.pillClass}`}>{meta.label}</span>
            <span className="text-label-sm text-on-surface-variant">{panne?.created_at ? new Date(panne.created_at).toLocaleString('fr-FR') : ''}</span>
          </div>
          <p className="text-body-md text-on-surface">{panne?.description || 'Aucune description fournie.'}</p>
        </div>

        {/* Progression */}
        <div className="mb-md">
          <div className="flex justify-between items-center mb-xs">
            <span className="text-label-md font-label-md text-primary">Étape {Math.min(doneCount + 1, steps.length)} sur {steps.length}</span>
            <span className="text-label-sm text-outline">{progress}% terminé</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-md overflow-x-auto pb-1">
          {[['steps', 'build', 'Étapes'], ['parts', 'inventory_2', 'Pièces'], ['ai', 'psychology', 'Diag IA'], ['photos', 'photo_library', 'Photos']].map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-label-sm font-bold shrink-0 transition-colors ${activeTab === id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
            >
              <Icon className="text-[16px]">{icon}</Icon>{label}
            </button>
          ))}
        </div>

        {/* Onglet Étapes */}
        {activeTab === 'steps' && (
          <div className="space-y-md">
            {steps.map((step) => {
              const done = step.statut === 'termine';
              const active = step.id === current?.id;
              if (done) return (
                <div key={step.id} className="flex items-center gap-md p-md bg-surface-container-low rounded-xl opacity-60">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Icon className="text-white text-[16px]">check</Icon>
                  </div>
                  <span className="text-body-md line-through text-on-surface-variant italic">{step.titre}</span>
                </div>
              );
              if (!active) return (
                <div key={step.id} className="flex items-center gap-md p-md border border-outline-variant rounded-xl opacity-40">
                  <div className="w-6 h-6 rounded-full border-2 border-outline shrink-0" />
                  <span className="text-body-md text-on-surface-variant">{step.titre}</span>
                </div>
              );
              return (
                <div key={step.id} className="p-md rounded-xl shadow-lg border-2 border-primary bg-surface-container-lowest">
                  <div className="flex items-start gap-md mb-md">
                    <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-headline-md font-headline-md text-on-surface mb-xs">{step.titre}</h3>
                      {step.deadline && <p className="text-label-sm text-on-surface-variant">Échéance : {new Date(step.deadline).toLocaleString('fr-FR')}</p>}
                    </div>
                  </div>
                  <div className="p-md rounded-lg border-2 border-dashed border-outline-variant bg-surface flex flex-col items-center gap-sm">
                    <Icon className="text-primary text-[48px]">add_a_photo</Icon>
                    <span className="text-label-sm text-on-surface-variant">Photo de l'étape (optionnel)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Onglet Pièces */}
        {activeTab === 'parts' && (
          <div className="space-y-sm">
            {!(detail?.pieces?.length) && (
              <p className="text-on-surface-variant text-body-md py-4 text-center">Aucune pièce demandée pour cette intervention.</p>
            )}
            {(detail?.pieces || []).map((piece) => (
              <div key={piece.id} className="p-md bg-surface-container-low rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-label-md text-on-surface">{piece.piece_nom}</p>
                  <p className="text-label-sm text-on-surface-variant">Qté : {piece.quantite} • Urgence : {piece.urgence}</p>
                  {piece.commentaire && <p className="text-label-sm text-primary mt-xs">{piece.commentaire}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-label-sm font-bold shrink-0 ${
                  piece.statut === 'approuve' ? 'bg-green-100 text-green-700'
                  : piece.statut === 'rejete' ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-container text-on-secondary-container'
                }`}>{piece.statut}</span>
              </div>
            ))}
          </div>
        )}

        {/* Onglet Diagnostic IA */}
        {activeTab === 'ai' && (
          <div>
            {diagnostic ? (
              <div className="p-md bg-primary-fixed text-on-primary-fixed rounded-xl space-y-md">
                <div className="flex items-center gap-sm mb-sm">
                  <Icon>psychology</Icon>
                  <h3 className="font-headline-md text-headline-md">Diagnostic IA</h3>
                </div>
                <div>
                  <p className="text-label-sm opacity-70 mb-xs uppercase tracking-wider">Défaut probable</p>
                  <p className="text-body-md font-semibold">{diagnostic.type_defaut_probable}</p>
                </div>
                <div>
                  <p className="text-label-sm opacity-70 mb-xs uppercase tracking-wider">Cause possible</p>
                  <p className="text-body-md">{diagnostic.cause_possible || diagnostic.resultat_texte || '—'}</p>
                </div>
                {diagnostic.pieces_suggerees?.length > 0 && (
                  <div>
                    <p className="text-label-sm opacity-70 mb-sm uppercase tracking-wider">Pièces suggérées</p>
                    <ul className="space-y-xs">
                      {diagnostic.pieces_suggerees.map((p) => (
                        <li key={p} className="flex items-center gap-sm text-body-sm">
                          <Icon className="text-[16px]">settings_input_component</Icon>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-md bg-surface-container-low rounded-xl text-center">
                <Icon className="text-outline text-[48px] mb-sm">psychology</Icon>
                <p className="text-on-surface-variant text-body-md">Aucun diagnostic IA disponible.</p>
                <p className="text-label-sm text-outline mt-xs">Le manager peut déclencher un diagnostic depuis le tableau de bord admin.</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Photos */}
        {activeTab === 'photos' && (
          <div>
            {!(detail?.photos?.length) && (
              <div className="p-md text-center">
                <Icon className="text-outline text-[48px] mb-sm">photo_library</Icon>
                <p className="text-on-surface-variant text-body-md">Aucune photo pour cette intervention.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {(detail?.photos || []).map((photo) => (
                <div key={photo.id} className="aspect-square bg-surface-container rounded-xl overflow-hidden">
                  <img
                    src={`http://localhost:3001${photo.url}`}
                    alt={photo.annotation || 'Photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Barre d'action en bas */}
      <div className="shrink-0 bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.07)] px-margin-mobile py-3 z-50">
        <div className="max-w-3xl mx-auto flex flex-col gap-sm">
          {message && <p className="text-label-sm text-primary text-center">{message}</p>}
          {allDone ? (
            <button
              onClick={closePanne}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-label-md font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Icon>check_circle</Icon>Clôturer l'intervention
            </button>
          ) : (
            <button
              onClick={validate}
              disabled={busy}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-label-md font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {busy ? 'Validation…' : <><span>Valider l'étape en cours</span><Icon>arrow_forward</Icon></>}
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}
