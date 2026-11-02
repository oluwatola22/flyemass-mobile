import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck,
  Send
} from 'lucide-react';

export const ResetPasswordScreen: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [email, setEmail] = useState('babatunde@aladeholding.ng');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      showToast('Reset authorization code dispatched via email and SMS!', 'success');
    }, 900);
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
            <KeyRound className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your registered enterprise trade email. We will dispatch a 6-digit cryptographic verification code to restore your portal access.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Registered Corporate Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs text-white placeholder-slate-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                For financial safety, resetting password will temporarily freeze China supplier payouts for 6 hours unless verified via your 4-digit PIN.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Generating Token...</span>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Reset Link Dispatched</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We have dispatched security instructions and an OTP token to <span className="text-emerald-400 font-mono">{email}</span>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('verify-email')}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Verification Code</span>
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
          className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
        >
          Remembered your credentials? <span className="text-emerald-400 font-bold underline">Return to Login</span>
        </button>
      </div>
    </div>
  );
};
