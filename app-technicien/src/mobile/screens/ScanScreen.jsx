import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Icon from '../components/Icon.jsx';
import { AppBar, Screen } from '../components/MobileChrome.jsx';
import { api } from '../../shared/api.js';

export default function ScanScreen({ equipements, onBack, onSelect }) {
  const [status, setStatus] = useState('Initialisation de la caméra...');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Caméra indisponible dans ce navigateur.');
      return undefined;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus("Caméra prête. Pointez vers un QR code d'équipement.");
        setScanning(true);
      })
      .catch(() => setStatus('Permission caméra refusée. Sélectionnez un équipement manuellement ci-dessous.'));

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 240 }, false);
    scanner.render(
      async (decoded) => {
        setError('');
        try {
          const id = decoded.split(':').pop();
          const equipment = await api(`/equipements/${id}`);
          scanner.clear().catch(() => {});
          onSelect(equipment);
        } catch {
          setError('Équipement introuvable pour ce QR code. Sélectionnez manuellement ci-dessous.');
        }
      },
      () => {}
    );

    return () => { scanner.clear().catch(() => {}); };
  }, []);

  return (
    <Screen>
      <AppBar
        title="Scanner un équipement"
        leading="arrow_back"
        onLeading={onBack}
        trailing={
          <div className={`flex items-center gap-xs px-3 py-1 rounded-full text-label-sm font-bold ${scanning ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-outline'}`} />
            {scanning ? 'Live' : 'Off'}
          </div>
        }
      />

      <main className="pt-20 pb-10 px-margin-mobile max-w-3xl mx-auto space-y-md">
        <section className="bg-surface-container-lowest p-md rounded-xl border border-[#F2F2F7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Scan QR Code</h2>
            <Icon className="text-primary">qr_code_scanner</Icon>
          </div>
          <p className="text-label-sm text-on-surface-variant">{status}</p>
          {error && (
            <div className="flex items-center gap-sm p-sm bg-error-container text-on-error-container rounded-lg text-label-sm">
              <Icon className="text-[16px]">error</Icon>{error}
            </div>
          )}
          <div id="qr-reader" className="overflow-hidden rounded-xl bg-surface-container-low" />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-md">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-label-sm text-on-surface-variant font-bold uppercase px-2">ou sélectionner manuellement</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          <div className="space-y-sm">
            {equipements.map((equipment) => (
              <button
                key={equipment.id}
                onClick={() => onSelect(equipment)}
                className="w-full text-left p-md bg-surface-container-low rounded-xl flex items-center justify-between active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-md min-w-0">
                  <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="text-primary">precision_manufacturing</Icon>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface truncate">{equipment.nom}</p>
                    <p className="text-label-sm text-on-surface-variant truncate">{equipment.numero_serie} • {equipment.localisation}</p>
                  </div>
                </div>
                <Icon className="text-primary shrink-0">chevron_right</Icon>
              </button>
            ))}
          </div>
        </section>
      </main>
    </Screen>
  );
}
