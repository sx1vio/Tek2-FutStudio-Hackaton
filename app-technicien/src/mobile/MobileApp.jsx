import React, { useEffect, useState } from 'react';
import { api, getOfflineQueue, syncOfflineQueue } from '../shared/api.js';
import DashboardScreen from './screens/DashboardScreen.jsx';
import ReportScreen from './screens/ReportScreen.jsx';
import InterventionScreen from './screens/InterventionScreen.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import AssetScreen from './screens/AssetScreen.jsx';

export default function MobileApp({ user, onLogout }) {
  const [screen, setScreen] = useState('dashboard');
  const [equipements, setEquipements] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedPanne, setSelectedPanne] = useState(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');

  async function load() {
    try {
      const [eq, pa] = await Promise.all([api('/equipements'), api('/pannes?mine=true')]);
      setEquipements(eq);
      setPannes(pa);
      if (!selectedEquipment && eq[0]) setSelectedEquipment(eq[0]);
      setOfflineCount((await getOfflineQueue()).length);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    async function syncNow() {
      const result = await syncOfflineQueue();
      if (result.synced) {
        setSyncMessage(`${result.synced} rapport(s) hors-ligne synchronisé(s).`);
        await load();
      }
      setOfflineCount(result.remaining);
    }
    window.addEventListener('online', syncNow);
    syncNow();
    return () => window.removeEventListener('online', syncNow);
  }, []);

  function navigate(newScreen) {
    setScreen(newScreen);
  }

  if (screen === 'report') {
    return (
      <ReportScreen
        equipements={equipements}
        selectedEquipment={selectedEquipment}
        setSelectedEquipment={setSelectedEquipment}
        onClose={() => navigate('dashboard')}
        onCreated={async (panne) => {
          setSelectedPanne(panne);
          await load();
          navigate('intervention');
        }}
      />
    );
  }

  if (screen === 'intervention') {
    return (
      <InterventionScreen
        panne={selectedPanne || pannes[0]}
        onBack={() => navigate('dashboard')}
        reload={load}
      />
    );
  }

  if (screen === 'scan') {
    return (
      <ScanScreen
        equipements={equipements}
        onBack={() => navigate('dashboard')}
        onSelect={(equipment) => {
          setSelectedEquipment(equipment);
          navigate('asset');
        }}
      />
    );
  }

  if (screen === 'asset') {
    return (
      <AssetScreen
        equipment={selectedEquipment}
        onBack={() => navigate('dashboard')}
        onReport={() => navigate('report')}
      />
    );
  }

  return (
    <DashboardScreen
      user={user}
      pannes={pannes}
      offlineCount={offlineCount}
      syncMessage={syncMessage}
      onLogout={onLogout}
      navigate={navigate}
      openPanne={(panne) => {
        setSelectedPanne(panne);
        navigate('intervention');
      }}
    />
  );
}
