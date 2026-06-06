import React from 'react';
import Icon from '../components/Icon.jsx';
import { AppBar, BottomNav, OfflineBanner, Screen } from '../components/MobileChrome.jsx';
import { InterventionCard, SummaryCard } from '../components/Cards.jsx';

export default function DashboardScreen({ user, pannes, offlineCount, syncMessage, onLogout, navigate, openPanne }) {
  const open = pannes.filter((p) => p.statut !== 'clos');
  const critical = pannes.find((p) => p.severite === 'critique') || pannes[0];

  return (
    <Screen withBottomNav>
      <AppBar
        title="FieldTech Pro"
        onLeading={() => navigate('dashboard')}
        trailing={
          <div className="flex items-center gap-2">
            <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100"><Icon>notifications</Icon></button>
            <button onClick={onLogout} className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs overflow-hidden">{user.prenom?.[0] || 'T'}</button>
          </div>
        }
      />

      <main className="px-margin-mobile pt-24 pb-8">
        <section className="mb-lg">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Bonjour, {user.prenom || 'Technicien'}</h2>
          <p className="font-body-md text-on-surface-variant">Voici l'état de votre parc pour aujourd'hui.</p>
          <OfflineBanner offlineCount={offlineCount} syncMessage={syncMessage} />
        </section>

        <div className="grid grid-cols-1 gap-gutter mb-lg">
          <SummaryCard title="Pannes assignées" icon="engineering" value={String(pannes.length).padStart(2, '0')} note="+2 aujourd'hui" noteClass="text-error" />
          <SummaryCard title="Tâches en cours" icon="assignment_turned_in" value={String(open.length).padStart(2, '0')} note="Planifié à 14h00" iconClass="text-secondary bg-secondary-fixed" />
          <div className="bg-error-container p-md rounded-xl shadow-lg border-l-4 border-error flex flex-col justify-between h-40 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Icon className="text-[120px]">warning</Icon></div>
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-on-error-container font-label-md flex items-center gap-2"><Icon className="text-[18px]">report</Icon> Alerte critique</h3>
                <p className="text-on-error-container font-body-md mt-1 font-semibold">{critical?.equipement_nom || 'Aucune alerte critique'}</p>
              </div>
              <button onClick={() => critical && openPanne(critical)} className="bg-error text-on-error font-label-md px-4 py-2 rounded-lg active:scale-95 transition-all shadow-lg border-2 border-on-error/20 shrink-0">Intervenir</button>
            </div>
          </div>
        </div>

        <section className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">Interventions prioritaires</h3>
            <button onClick={() => navigate('intervention')} className="text-primary font-label-md hover:underline">Voir tout</button>
          </div>
          <div className="flex gap-2 mb-2 overflow-x-auto">
            <button className="bg-primary text-on-primary px-4 py-1 rounded-full text-label-sm shrink-0">Toutes</button>
            <button className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-label-sm shrink-0">Urgent</button>
            <button className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-label-sm shrink-0">Normal</button>
          </div>
          {pannes.map((panne) => <InterventionCard key={panne.id} panne={panne} onOpen={() => openPanne(panne)} />)}
        </section>

        <section className="space-y-md mt-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface">Vue du parc</h3>
          <div className="bg-surface-container rounded-xl aspect-square relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-40">
              {Array.from({ length: 16 }).map((_, index) => <div key={index} className="border border-white/70" />)}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <button onClick={() => navigate('scan')} className="absolute left-[45%] top-[35%] w-10 h-10 bg-error text-white rounded-full shadow-lg flex items-center justify-center animate-pulse"><Icon>location_on</Icon></button>
            <button onClick={() => navigate('scan')} className="absolute left-[20%] top-[58%] w-8 h-8 bg-primary text-white rounded-full shadow-lg flex items-center justify-center"><Icon className="text-[18px]">location_on</Icon></button>
          </div>
          <button onClick={() => navigate('report')} className="w-full py-4 bg-primary text-on-primary rounded-xl font-headline-md text-label-md font-bold shadow-lg shadow-primary/20 active:scale-95">Signaler une panne</button>
        </section>
      </main>

      <BottomNav current="dashboard" navigate={navigate} />
    </Screen>
  );
}
