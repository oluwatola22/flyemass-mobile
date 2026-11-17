import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, 
  MailCheck, 
  ArrowRight, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

export const VerifyEmailScreen: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(45);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (code?: string) => {
    const fullCode = code || otp.join('');
    if (fullCode.length < 6) {
      showToast('Please enter all 6 digits of the confirmation code', 'error');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      showToast('Corporate email verified successfully!', 'success');
      navigate('setup-pin');
    }, 1000);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    showToast('A fresh 6-digit confirmation code has been sent!', 'info');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-3 mb-8 flex items-center justify-between safe-top shrink-0">
          <button
            onClick={() => navigate('signup')}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Identity Proof</span>
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
            <MailCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Confirm Security OTP</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            We dispatched a 6-digit one-time code to <span className="text-emerald-400 font-medium">babatunde@aladeholding.ng</span>. Enter it below to unlock your trade wallets.
          </p>
        </div>

        {/* 6-digit input boxes */}
        <div className="my-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 rounded-2xl text-center text-xl font-bold font-mono transition-all outline-none border ${
                  digit
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/30'
                    : 'border-slate-800 bg-slate-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
            ))}
          </div>

          {/* Fill test helper */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => {
                const sample = ['8', '9', '2', '4', '1', '0'];
                setOtp(sample);
                handleVerify(sample.join(''));
              }}
              className="text-[11px] text-slate-500 hover:text-emerald-400 underline font-mono"
            >
              Demo: Auto-fill test OTP (892410)
            </button>
          </div>
        </div>

        {/* Timer & Resend */}
        <div className="text-center py-3">
          {timer > 0 ? (
            <p className="text-xs text-slate-400">
              Resend verification code in{' '}
              <span className="font-mono font-bold text-emerald-400">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Resend 6-Digit Code</span>
            </button>
          )}
        </div>

        <button
          onClick={() => handleVerify()}
          disabled={isVerifying}
          className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isVerifying ? (
            <span>Validating Code...</span>
          ) : (
            <>
              <span>Verify & Continue to PIN Setup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center border-t border-slate-900">
        <p className="text-xs text-slate-500">
          FlyeMass Cross-Border Financial Gateway • 256-Bit SSL Enforced
        </p>
      </div>
    </div>
  );
};
