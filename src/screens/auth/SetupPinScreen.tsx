import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { ChevronLeft, CheckCircle2, Shield } from 'lucide-react';

export const SetupPinScreen: React.FC = () => {
  const { navigate, setUserPin, login, showToast, activeUserId, pendingSignup, switchUser } = useApp();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    showToast('Re-enter your 6-digit PIN to confirm', 'info');
  };

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin === firstPin) {
      setIsSubmitting(true);
      try {
        if (pendingSignup) {
          const fullName = pendingSignup.fullName || `${pendingSignup.firstName || ''} ${pendingSignup.surname || ''}`.trim() || 'FlyeMass User';
          const reg = await db.registerUser({
            fullName,
            firstName: pendingSignup.firstName,
            surname: pendingSignup.surname,
            otherName: pendingSignup.otherName,
            dateOfBirth: pendingSignup.dateOfBirth,
            country: pendingSignup.country,
            email: pendingSignup.email,
            phone: pendingSignup.phone,
            businessName: fullName,
            accountType: 'personal',
            pin
          });
          if (reg?.user?.uid) {
            switchUser(reg.user.uid);
          }
        } else {
          await db.setPin(activeUserId, pin);
        }
        setUserPin(pin);
        showToast('6-digit transaction PIN established & encrypted!', 'success');
        await login(pendingSignup?.email || activeUserId);
      } catch (err) {
        showToast('Failed to register PIN. Please retry.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      showToast('PIN combinations do not match. Please restart setup.', 'error');
      setStep('create');
      setFirstPin('');
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-3 mb-4 flex items-center justify-between safe-top shrink-0">
        <button
          onClick={() => (step === 'confirm' ? setStep('create') : navigate('signup'))}
          className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span>{step === 'create' ? 'Step 2: Create 6-Digit PIN' : 'Step 2: Confirm 6-Digit PIN'}</span>
        </span>
        <div className="w-10" />
      </div>

      {/* Main PIN Pad */}
      <div className="my-auto py-4">
        {step === 'create' ? (
          <PinPad
            isSetup={true}
            length={6}
            title="Create 6-Digit Security PIN"
            subtitle="Required to authorize supplier disbursements, FX swaps, and cargo releases."
            onComplete={handleFirstPinComplete}
          />
        ) : (
          <PinPad
            isSetup={true}
            length={6}
            title="Confirm Your 6-Digit PIN"
            subtitle="Please re-type the exact 6-digit combination to finalize encryption."
            onComplete={handleConfirmPinComplete}
          />
        )}
      </div>

      {/* Security Assurance footer */}
      <div className="pt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>HMAC-SHA256 Encrypted • Authoritative Backend Verification</span>
        </div>
      </div>
    </div>
  );
};
