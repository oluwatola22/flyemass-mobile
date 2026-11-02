import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Fingerprint, 
  ArrowRight, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  SmartphoneNfc 
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, navigate } = useApp();
  const [identifier, setIdentifier] = useState('babatunde@aladeholding.ng');
  const [password, setPassword] = useState('SecretTrade2026!');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(identifier, password);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pt-2 mb-8">
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
              onClick={() => login(identifier, password)}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 active:scale-95 transition-all shadow-md"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>Face ID / Touch ID</span>
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
          Don't have an enterprise account?{' '}
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
