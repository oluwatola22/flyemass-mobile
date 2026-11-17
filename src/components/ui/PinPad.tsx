import React, { useState } from 'react';
import { Delete, ShieldCheck, Fingerprint, Lock } from 'lucide-react';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  expectedPin?: string;
  isSetup?: boolean;
  length?: number;
}

export const PinPad: React.FC<PinPadProps> = ({
  title = 'Enter 6-Digit Transaction PIN',
  subtitle = 'Authorize this cross-border transfer',
  onComplete,
  onCancel,
  expectedPin,
  isSetup = false,
  length = 6
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pin.length < length) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);

      if (nextPin.length === length) {
        setTimeout(() => {
          if (expectedPin && nextPin !== expectedPin) {
            setError('Incorrect 6-digit security PIN. Please try again.');
            setPin('');
          } else {
            onComplete(nextPin);
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(null);
    }
  };

  const handleBiometric = () => {
    // In production biometric requires hardware WebAuthn / Biometric API prompt
    if (typeof window !== 'undefined' && (window as any).PublicKeyCredential) {
      setError('Biometric hardware prompt required. Please enter your 6-digit PIN.');
    } else {
      setError('Biometric sensor not enrolled on this terminal. Enter 6-digit PIN.');
    }
  };

  const dotIndices = Array.from({ length }, (_, i) => i);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Whenever user wants to enter pin, ensure pin pad container is scrolled into view from the top immediately
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-between w-full max-w-xs mx-auto py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/5">
          {isSetup ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">{subtitle}</p>
      </div>

      {/* 6 Masked Dots */}
      <div className="flex items-center gap-3 mb-6">
        {dotIndices.map((index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                filled
                  ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-400/50'
                  : 'bg-slate-800 border border-slate-700'
              } ${error ? 'bg-rose-500 border-rose-500 animate-bounce' : ''}`}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-rose-400 text-xs font-medium mb-3 text-center">
          {error}
        </div>
      )}

      {/* Numerical Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            type="button"
            className="h-14 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:bg-slate-800 active:scale-95 transition-all text-xl font-semibold text-slate-100 shadow-sm flex items-center justify-center select-none"
          >
            {digit}
          </button>
        ))}

        {/* Biometrics button */}
        <button
          onClick={handleBiometric}
          type="button"
          aria-label="Biometric Authentication"
          className="h-14 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 active:scale-95 transition-all flex items-center justify-center text-emerald-400"
          title="Authenticate via Biometrics (FaceID / Fingerprint)"
        >
          <Fingerprint className="w-6 h-6" />
        </button>

        {/* Digit 0 */}
        <button
          onClick={() => handleKeyPress('0')}
          type="button"
          className="h-14 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:bg-slate-800 active:scale-95 transition-all text-xl font-semibold text-slate-100 shadow-sm flex items-center justify-center select-none"
        >
          0
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          type="button"
          aria-label="Delete"
          className="h-14 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-slate-200"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          type="button"
          className="mt-6 text-xs text-slate-400 hover:text-slate-200 font-medium py-1 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
};
