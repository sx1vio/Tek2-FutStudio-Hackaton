import React from 'react';
import Icon from './Icon.jsx';
import { formatTime, isUrgent, severityMeta } from '../lib/mobileUtils.js';

export function SummaryCard({ title, icon, value, note, noteClass = 'text-on-surface-variant', iconClass = 'text-primary bg-primary-fixed-dim' }) {
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col justify-between h-40 active:scale-95 transition-transform">
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

export function InterventionCard({ panne, onOpen }) {
  const urgent = isUrgent(panne.severite);
  const meta = severityMeta[panne.severite] || severityMeta.modere;

  return (
    <button onClick={onOpen} className="w-full text-left bg-surface-container-lowest p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F2F2F7] flex flex-col gap-4 active:scale-[0.99] transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
          <Icon className={urgent ? 'text-tertiary' : 'text-primary'}>precision_manufacturing</Icon>
        </div>
        <div className="min-w-0">
          <h4 className="font-label-md text-on-surface line-clamp-2">{panne.description || 'Hydraulic Pump Failure'}</h4>
          <p className="text-on-surface-variant text-label-sm truncate">
            Machine ID: #{panne.equipement_id} • {panne.localisation || 'Sector 7G'} • <span className={urgent ? 'text-error font-semibold' : 'text-on-surface-variant'}>{formatTime(panne.created_at)}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm truncate">
          <Icon className="text-[16px]">location_on</Icon>{panne.localisation || 'North Depot'}
        </div>
        <span className={`${meta.pillClass} px-3 py-1 rounded-full text-label-sm font-semibold shrink-0`}>{meta.shortLabel}</span>
      </div>
    </button>
  );
}

export function StepPill({ step, active }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full ${active ? 'bg-primary text-white' : 'bg-surface-container-highest text-outline'} flex items-center justify-center text-[10px] font-bold`}>
        {step.index}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-primary' : 'text-outline'} uppercase`}>{step.label}</span>
    </div>
  );
}
