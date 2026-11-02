import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, 
  SmartphoneNfc, 
  Fingerprint, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Laptop, 
  Smartphone,
  RefreshCw
} from 'lucide-react';

export const SwitchDeviceScreen: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [migrationMethod, setMigrationMethod] = useState<'qr' | 'code' | 'biometric'>('biometric');
  const [pairingCode, setPairingCode] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleMigrate = () => {
    setIsMigrating(true);
    setTimeout(() => {
      setIsMigrating(false);
      setCompleted(true);
      showToast('Hardware cryptographic keys bound to this device!', 'success');
    }, 1200);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pt-2 mb-8">
          <button
            onClick={() => navigate('login')}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <SmartphoneNfc className="w-3.5 h-3.5" />
            <span>Device Migration</span>
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Authorize New Device</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Migrate your enterprise hardware session safely to this phone. FlyeMass stores zero raw private keys in cloud databases.
          </p>
        </div>

        {!completed ? (
          <div className="space-y-5">
            {/* Migration Tab Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMigrationMethod('biometric')}
                className={`py-2 rounded-xl transition-all ${
                  migrationMethod === 'biometric'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Face ID
              </button>
              <button
                type="button"
                onClick={() => setMigrationMethod('qr')}
                className={`py-2 rounded-xl transition-all ${
                  migrationMethod === 'qr'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                QR Sync
              </button>
              <button
                type="button"
                onClick={() => setMigrationMethod('code')}
                className={`py-2 rounded-xl transition-all ${
                  migrationMethod === 'code'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pair Key
              </button>
            </div>

            {/* Current Active Devices Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Primary Authorized Terminal
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">MacBook Pro 16" (Tianhe Office)</h4>
                  <p className="text-[10px] text-slate-400">Online 5 minutes ago • IP: 119.147.22.8</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Dynamic Method Panel */}
            {migrationMethod === 'biometric' && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center ring-4 ring-emerald-500/10">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white">Biometric Enclave Re-binding</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Scan your biometric print or Face ID to re-authenticate this hardware handset with the central liquidity escrow.
                </p>
                <button
                  type="button"
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                  <span>{isMigrating ? 'Verifying Hardware Keys...' : 'Authenticate with Face ID'}</span>
                </button>
              </div>
            )}

            {migrationMethod === 'qr' && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="w-40 h-40 mx-auto bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-xl">
                  <QrCode className="w-32 h-32 text-slate-950" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open FlyeMass on your primary device, navigate to <span className="text-white font-semibold">Security → Device Link</span> and scan this QR code.
                </p>
                <button
                  type="button"
                  onClick={handleMigrate}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs"
                >
                  Simulate QR Scanner Match
                </button>
              </div>
            )}

            {migrationMethod === 'code' && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    12-Character Pairing Passcode
                  </label>
                  <input
                    type="text"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    placeholder="FLY-8924-MIGRATE"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 font-mono text-center tracking-widest text-sm text-emerald-400 outline-none uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleMigrate}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                >
                  Confirm Pairing Code
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Device Successfully Enrolled!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This mobile handset is now your primary verified device. High-value China supplier payouts are unlocked.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('home')}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Trade Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-6 text-center border-t border-slate-900">
        <button
          onClick={() => navigate('login')}
          className="text-xs text-slate-400 hover:text-emerald-400 font-semibold"
        >
          Cancel and return to <span className="text-emerald-400 underline">Login</span>
        </button>
      </div>
    </div>
  );
};
