import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle,
  Trash2
} from 'lucide-react';

export const SecurityScreen: React.FC = () => {
  const { userPin, setUserPin, showToast, goBack } = useApp();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState([
    { id: 'dev-1', name: 'iPhone 16 Pro Max (This Device)', location: 'Ikeja, Lagos, Nigeria', active: true, icon: Smartphone },
    { id: 'dev-2', name: 'MacBook Pro 16" (M4 Max)', location: 'Tianhe, Guangzhou, China', active: false, icon: Laptop }
  ]);

  const handlePinUpdate = (newPin: string) => {
    setUserPin(newPin);
    setShowPinModal(false);
    showToast('Transaction PIN updated successfully!', 'success');
  };

  const handleRevokeDevice = (id: string) => {
    setTrustedDevices((prev) => prev.filter((d) => d.id !== id));
    showToast('Device session revoked', 'info');
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Security & Trusted Devices" />

      <div className="p-4 space-y-4">
        {/* PIN Management Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">4-Digit Security PIN</h4>
                <p className="text-[10px] text-slate-400">Used for supplier payouts & withdrawals</p>
              </div>
            </div>
            <button
              onClick={() => setShowPinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition-all"
            >
              Change PIN
            </button>
          </div>
        </div>

        {/* Biometric Toggle Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Biometric Fast Authorization</h4>
              <p className="text-[10px] text-slate-400">Face ID & Touch ID for rapid checkouts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setBiometricEnabled(!biometricEnabled);
              showToast(biometricEnabled ? 'Biometrics disabled' : 'Biometrics enabled', 'info');
            }}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              biometricEnabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                biometricEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Trusted Devices Sessions */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Authorized Enterprise Devices ({trustedDevices.length})
          </span>

          <div className="space-y-2">
            {trustedDevices.map((dev) => {
              const Icon = dev.icon;
              return (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-white">{dev.name}</h5>
                        {dev.active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{dev.location}</p>
                    </div>
                  </div>

                  {!dev.active && (
                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Revoke Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              isSetup={true}
              title="Set New 4-Digit PIN"
              subtitle="Enter 4 numbers to update your transaction security key."
              onComplete={handlePinUpdate}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
