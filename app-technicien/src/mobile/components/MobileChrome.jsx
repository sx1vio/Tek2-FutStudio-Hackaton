import React from 'react';
import Icon from './Icon.jsx';

export function AppBar({ title, subtitle, leading = 'menu', onLeading, trailing }) {
  return (
    <header className="fixed top-0 w-full z-50 shadow-sm bg-surface flex items-center justify-between px-margin-mobile h-16">
      <div className="flex items-center gap-4 min-w-0">
        <button onClick={onLeading} className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100">
          <Icon>{leading}</Icon>
        </button>
        <div className="min-w-0">
          <h1 className="font-headline-md text-headline-md font-bold text-primary truncate">{title}</h1>
          {subtitle && <p className="text-label-sm font-label-sm text-on-surface-variant truncate">{subtitle}</p>}
        </div>
      </div>
      {trailing}
    </header>
  );
}

export function Screen({ children, className = '', withBottomNav = false }) {
  return (
    <div className={`min-h-screen bg-surface text-on-surface ${withBottomNav ? 'pb-24' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function BottomNav({ current, navigate }) {
  const items = [
    ['dashboard', 'dashboard', 'Home'],
    ['scan', 'qr_code_scanner', 'Scan'],
    ['report', 'report_problem', 'Report'],
    ['intervention', 'assignment_turned_in', 'Tasks']
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center z-50">
      {items.map(([id, icon, label]) => (
        <button key={id} onClick={() => navigate(id)} className={`flex flex-col items-center gap-1 text-label-sm min-w-16 active:scale-95 ${current === id ? 'text-primary' : 'text-on-surface-variant'}`}>
          <Icon>{icon}</Icon>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function MachineVisual({ className = '' }) {
  return (
    <div className={`w-full h-full bg-surface-container flex items-center justify-center ${className}`}>
      <Icon className="text-primary text-[88px]">precision_manufacturing</Icon>
    </div>
  );
}

export function OfflineBanner({ offlineCount, syncMessage }) {
  if (!offlineCount && !syncMessage) return null;
  return (
    <div className="mt-3 px-3 py-2 rounded-lg bg-primary-fixed text-on-primary-fixed text-label-sm">
      {offlineCount > 0 ? `${offlineCount} offline report(s) waiting for sync.` : syncMessage}
    </div>
  );
}
