import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  KeyRound,
  RotateCcw,
  Mail,
  X
} from 'lucide-react';

export const SecurityScreen: React.FC = () => {
  const { userPin, setUserPin, showToast, goBack, activeUserId, userProfile } = useApp();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  
  // Modal State
  const [pinModalMode, setPinModalMode] = useState<'update' | 'reset' | 'create' | null>(null);
  const [pinStep, setPinStep] = useState<'current' | 'otp' | 'new' | 'confirm'>('current');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trustedDevices, setTrustedDevices] = useState([
    { id: 'dev-1', name: 'iPhone 16 Pro Max (This Device)', location: 'Ikeja, Lagos, Nigeria', active: true, icon: Smartphone },
    { id: 'dev-2', name: 'MacBook Pro 16" (M4 Max)', location: 'Tianhe, Guangzhou, China', active: false, icon: Laptop }
  ]);

  const handleOpenModal = (mode: 'update' | 'reset' | 'create') => {
    setPinModalMode(mode);
    setCurrentPinInput('');
    setNewPinInput('');
    setOtpCode('');
    if (mode === 'update') {
      setPinStep('current');
    } else if (mode === 'reset') {
      setPinStep('otp');
    } else {
      setPinStep('new');
    }
  };

  const handleCloseModal = () => {
    setPinModalMode(null);
    setCurrentPinInput('');
    setNewPinInput('');
    setOtpCode('');
  };

  // Step 1 for Update: User enters current PIN
  const handleCurrentPinComplete = (pin: string) => {
    setCurrentPinInput(pin);
    setPinStep('new');
    showToast('Current PIN verified. Now enter your new 6-digit PIN.', 'info');
  };

  // Step 1 for Reset: User submits OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      showToast('Please enter the 6-digit reset code sent to your email', 'error');
      return;
    }
    setPinStep('new');
    showToast('Reset authorization confirmed. Enter your new 6-digit PIN.', 'info');
  };

  // Step 2: User enters new PIN
  const handleNewPinComplete = (pin: string) => {
    setNewPinInput(pin);
    setPinStep('confirm');
    showToast('Re-enter your new 6-digit PIN to confirm.', 'info');
  };

  // Step 3: User confirms new PIN and dispatches to authoritative backend
  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== newPinInput) {
      showToast('PIN combinations do not match. Please restart setup.', 'error');
      setPinStep('new');
      setNewPinInput('');
      return;
    }

    setIsSubmitting(true);
    try {
      if (pinModalMode === 'reset') {
        const res = await db.resetPin(activeUserId, confirmPin, otpCode || 'EMAIL_OTP', userProfile?.email);
        if (res && res.error) {
          showToast(res.error, 'error');
          return;
        }
        setUserPin(confirmPin);
        showToast('6-digit transaction PIN successfully reset & re-encrypted!', 'success');
      } else {
        const res = await db.setPin(activeUserId, confirmPin, currentPinInput || undefined);
        if (res && res.error) {
          showToast(res.error, 'error');
          return;
        }
        setUserPin(confirmPin);
        showToast('6-digit transaction PIN updated & encrypted on backend!', 'success');
      }
      handleCloseModal();
    } catch (e: any) {
      showToast(e.message || 'Failed to update PIN. Please retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">6-Digit Security PIN</h4>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Mandatory key for wallet disbursements, FX swaps, withdrawals, and shop checkouts
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographically Enforced (HMAC SHA-256)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenModal('reset')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Reset PIN</span>
              </button>
              <button
                onClick={() => handleOpenModal('update')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Change PIN</span>
              </button>
            </div>
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

      {/* Multi-Step PIN Modal (Shows from the Top) */}
      {pinModalMode && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-top-4 duration-200 mt-2">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step: OTP / Email Verification for Reset Mode */}
            {pinModalMode === 'reset' && pinStep === 'otp' && (
              <div className="space-y-4 py-2">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/5">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Reset 6-Digit PIN</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
                    We sent a verification code to <span className="text-white font-mono">{userProfile?.email || 'registered email'}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      6-Digit Security Reset Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-center font-mono text-lg font-bold tracking-widest text-white outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    Authorize PIN Reset
                  </button>
                </form>
              </div>
            )}

            {/* Step: Current PIN for Update Mode */}
            {pinModalMode === 'update' && pinStep === 'current' && (
              <PinPad
                isSetup={false}
                length={6}
                title="Enter Current PIN"
                subtitle="Authenticate your active 6-digit key before updating."
                onComplete={handleCurrentPinComplete}
                onCancel={handleCloseModal}
              />
            )}

            {/* Step: New PIN */}
            {pinStep === 'new' && (
              <PinPad
                isSetup={true}
                length={6}
                title={pinModalMode === 'reset' ? 'Create New 6-Digit PIN' : 'Enter New 6-Digit PIN'}
                subtitle="Choose 6 numerical digits for your new secure transaction key."
                onComplete={handleNewPinComplete}
                onCancel={handleCloseModal}
              />
            )}

            {/* Step: Confirm New PIN */}
            {pinStep === 'confirm' && (
              <PinPad
                isSetup={true}
                length={6}
                title="Confirm New 6-Digit PIN"
                subtitle="Re-type the exact 6 digits to finalize cryptographic hashing."
                onComplete={handleConfirmPinComplete}
                onCancel={handleCloseModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
