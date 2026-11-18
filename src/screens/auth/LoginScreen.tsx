import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  detectBiometricCapabilities,
  authenticateWithBiometrics,
  isBiometricLoginEnabled,
  BiometricCapabilities
} from '../../services/biometricAuth';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Fingerprint, 
  ScanFace,
  ArrowRight, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  SmartphoneNfc,
  RefreshCw
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, navigate, showToast, activeUserId } = useApp();
  const [identifier, setIdentifier] = useState('babatunde@aladeholding.ng');
  const [password, setPassword] = useState('SecretTrade2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isBioLoggingIn, setIsBioLoggingIn] = useState(false);
  const [bioCaps, setBioCaps] = useState<BiometricCapabilities>({
    isAvailable: true,
    isNative: false,
    biometryType: 'fingerprint',
    platform: 'web',
    label: 'Fingerprint',
    actionLabel: 'Authenticate with Fingerprint',
    shortLabel: 'Fingerprint'
  });

  useEffect(() => {
    detectBiometricCapabilities().then(setBioCaps).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(identifier, password);
  };

  const handleBiometricLogin = async () => {
    const uid = activeUserId || 'usr_alade_01';
    if (!isBiometricLoginEnabled(uid)) {
      showToast(`Enable "${bioCaps.label} Login & Swap Approval" in Profile → Security first, or sign in with password.`, 'info');
      return;
    }
    setIsBioLoggingIn(true);
    try {
      const res = await authenticateWithBiometrics(`Sign in to FlyeMass with ${bioCaps.label}`);
      if (!res.verified) {
        showToast(res.error || `${bioCaps.label} verification cancelled`, 'error');
        return;
      }
      await login(identifier, password);
      showToast(`Unlocked with ${bioCaps.label}`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Biometric sign-in failed', 'error');
    } finally {
      setIsBioLoggingIn(false);
    }
  };

  const BiometricIcon = bioCaps.biometryType === 'face_id' ? ScanFace : Fingerprint;

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-3 mb-8 flex items-center justify-between safe-top shrink-0">
          <button
            onClick={() => navigate('welcome')}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Banking Gate</span>
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400">
            Sign in to manage your multi-currency accounts, China supplier payouts, and customs air cargo.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email or FlyeTag ID
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="trade@company.com or @flyetag"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs text-white placeholder-slate-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs text-white placeholder-slate-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
              <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0" />
              <span>Remember Device</span>
            </label>
            <button 
              type="button" 
              onClick={() => navigate('reset-password')}
              className="text-emerald-400 font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Log In to Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Biometrics & Device Fast Pass */}
        <div className="mt-8 text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-[10px] text-slate-500 uppercase tracking-wider">
              Or Biometric & Hardware Fast Pass
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleBiometricLogin}
              disabled={isBioLoggingIn}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isBioLoggingIn ? <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" /> : <BiometricIcon className="w-4 h-4 text-emerald-400" />}
              <span>{isBioLoggingIn ? 'Verifying...' : bioCaps.label}</span>
            </button>

            <button
              onClick={() => navigate('switch-device')}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 active:scale-95 transition-all shadow-md"
            >
              <SmartphoneNfc className="w-4 h-4 text-cyan-400" />
              <span>Switch Device</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center border-t border-slate-900">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('signup')}
            className="text-emerald-400 font-bold hover:underline"
          >
            Register Here
          </button>
        </p>
      </div>
    </div>
  );
};
