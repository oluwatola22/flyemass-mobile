import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PinPad } from '../../components/ui/PinPad';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

export const SetupPinScreen: React.FC = () => {
  const { navigate, setUserPin, login, showToast } = useApp();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    showToast('Re-enter your 4-digit PIN to confirm', 'info');
  };

  const handleConfirmPinComplete = (pin: string) => {
    if (pin === firstPin) {
      setUserPin(pin);
      showToast('Transaction PIN established! Welcome to FlyeMass.', 'success');
      login();
    } else {
      showToast('PINs do not match. Please restart setup.', 'error');
      setStep('create');
      setFirstPin('');
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => (step === 'confirm' ? setStep('create') : navigate('signup'))}
          className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
          {step === 'create' ? 'Step 2: Create PIN' : 'Step 2: Confirm PIN'}
        </span>
        <div className="w-10" />
      </div>

      {/* Main PIN Pad */}
      <div className="my-auto py-4">
        {step === 'create' ? (
          <PinPad
            isSetup={true}
            title="Create 4-Digit Security PIN"
            subtitle="Required to authorize fast supplier payouts, FX swaps, and warehouse releases."
            onComplete={handleFirstPinComplete}
          />
        ) : (
          <PinPad
            isSetup={true}
            title="Confirm Your 4-Digit PIN"
            subtitle="Please re-type the exact 4-digit combination to finalize encryption."
            onComplete={handleConfirmPinComplete}
          />
        )}
      </div>

      {/* Security Assurance footer */}
      <div className="pt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hardware Enclave & End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};
