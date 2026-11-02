import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowRight, Globe, Lock, ArrowLeftRight, PlaneTakeoff } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Brand & Language */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl tracking-tight shadow-lg shadow-emerald-500/20">
            FM
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-white">FlyeMass</span>
            <span className="block text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">Enterprise Trade & Pay</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>EN / 中文</span>
        </div>
      </div>

      {/* Hero Visual & Proposition */}
      <div className="my-auto py-8">
        <div className="relative mx-auto w-64 h-64 mb-8 flex items-center justify-center">
          {/* Glowing orbital rings */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-spin" style={{ animationDuration: '30s' }} />
          <div className="absolute inset-4 rounded-full border border-indigo-500/20 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 blur-2xl" />

          {/* Core Badge */}
          <div className="relative z-10 w-40 h-40 rounded-3xl bg-slate-900/90 border border-slate-700/80 p-5 shadow-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-2xl">🇳🇬</span>
              <ArrowLeftRight className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-2xl">🇨🇳</span>
            </div>

            <div className="text-center py-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Settlement & Cargo</p>
              <p className="text-base font-extrabold text-emerald-300 num-tabular">¥ & ₦ Direct</p>
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 bg-slate-950/60 py-1 rounded-xl">
              <PlaneTakeoff className="w-3 h-3 text-cyan-400" />
              <span>Baiyun ✈ Ikeja Hub</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 max-w-sm mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Bridging China Trade & African Enterprise.
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct Alipay/WeChat settlement, instant NGN-RMB-USD FX swaps, factory escrow, and express air freight tracking in one secure mobile vault.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Instant Escrow
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" /> Zero FX Spread
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
            3-Day Air Cargo
          </span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3 pb-6">
        <button
          onClick={() => navigate('signup')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Open Verified Business Account</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('login')}
          className="w-full py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs tracking-wide transition-all"
        >
          Already Registered? Log In
        </button>

        <p className="text-[10px] text-center text-slate-400">
          Licensed & compliant cross-border financial provider • CAC / CBN / SAFE Compliant
        </p>
      </div>
    </div>
  );
};
