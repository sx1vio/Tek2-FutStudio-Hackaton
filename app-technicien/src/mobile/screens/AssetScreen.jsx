import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { AppBar, MachineVisual, Screen } from '../components/MobileChrome.jsx';
import { api } from '../../shared/api.js';

const statusStyle = {
  actif: 'bg-green-100 text-green-700',
  arret: 'bg-error-container text-on-error-container',
  maintenance: 'bg-[#fff5cc] text-[#6b5900]'
};

const criticalityStyle = {
  critique: 'bg-error-container text-on-error-container',
  haute: 'bg-[#ffeadb] text-[#9e3d00]',
  moyenne: 'bg-secondary-container text-on-secondary-container',
  faible: 'bg-surface-container text-on-surface-variant'
};

export default function AssetScreen({ equipment, onBack, onReport }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (equipment?.id) {
      api(`/equipements/${equipment.id}`).then(setDetail).catch(() => {});
    }
  }, [equipment?.id]);

  if (!equipment) return null;

  const specs = [
    ['Modèle', equipment.modele],
    ['N° de série', equipment.numero_serie],
    ['Fabricant', equipment.fabricant],
    ['Localisation', equipment.localisation],
    ["Date d'achat", equipment.date_achat],
    ['Criticité', equipment.criticite]
  ].filter(([, v]) => v);

  return (
    <Screen>
      <AppBar title="Fiche équipement" leading="arrow_back" onLeading={onBack} />

      <main className="flex-1 overflow-y-auto px-margin-mobile pt-4 pb-4 max-w-3xl mx-auto w-full space-y-md">
        {/* Main card */}
        <section className="p-md bg-surface-container-lowest rounded-xl border border-[#F2F2F7] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="aspect-video bg-surface-container rounded-lg overflow-hidden mb-md">
            <MachineVisual />
          </div>
          <div className="flex items-center gap-2 mb-xs">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${statusStyle[equipment.statut] || 'bg-surface-variant text-on-surface-variant'}`}>
              {equipment.statut}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${criticalityStyle[equipment.criticite] || ''}`}>
              {equipment.criticite}
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{equipment.nom}</h2>
          <p className="text-on-surface-variant font-body-md">{equipment.localisation}</p>
        </section>

        {/* Specs grid */}
        <section className="grid grid-cols-2 gap-sm">
          {specs.map(([label, value]) => (
            <div key={label} className="p-sm bg-surface-container-low rounded-xl">
              <p className="text-label-sm text-on-surface-variant">{label}</p>
              <p className="text-body-sm font-semibold mt-xs capitalize">{value}</p>
            </div>
          ))}
        </section>

        {/* QR Code */}
        <section className="p-md bg-surface-container-lowest rounded-xl border border-[#F2F2F7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center gap-md">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">QR Code équipement</h3>
            <Icon className="text-primary">qr_code_2</Icon>
          </div>
          <img
            src={`http://localhost:3001/api/equipements/${equipment.id}/qrcode`}
            alt="QR Code"
            className="w-40 h-40 rounded-lg"
          />
          <p className="text-label-sm text-on-surface-variant">Scanner pour identifier rapidement cet équipement</p>
        </section>

        {/* Report button */}
        <button
          onClick={onReport}
          className="w-full py-4 bg-primary text-white rounded-xl font-label-md font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Icon>report_problem</Icon>Signaler une panne
        </button>

        {/* Historique des pannes */}
        <section>
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-md">
            Historique des pannes ({(detail?.pannes || []).length})
          </h3>
          {!(detail?.pannes?.length) && (
            <p className="text-on-surface-variant text-body-md py-2">Aucune panne enregistrée pour cet équipement.</p>
          )}
          {(detail?.pannes || []).map((panne) => (
            <div key={panne.id} className="p-md bg-surface-container-low rounded-xl border border-[#F2F2F7] mb-sm">
              <div className="flex justify-between items-start mb-xs">
                <p className="font-label-md text-on-surface line-clamp-2 flex-1 mr-2">{panne.description}</p>
                <span className="text-label-sm text-on-surface-variant shrink-0">{new Date(panne.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${criticalityStyle[panne.severite] || ''}`}>{panne.severite}</span>
                <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded uppercase">{panne.statut}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </Screen>
  );
}
