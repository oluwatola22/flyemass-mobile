import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Mail, Phone, Lock, ChevronLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignupScreen: React.FC = () => {
  const { navigate, setPendingSignup } = useApp();
  const [form, setForm] = useState({
    companyName: 'Alade Global Enterprises Ltd',
    rcNumber: 'RC-1849204',
    country: 'Nigeria',
    email: 'babatunde@aladeholding.ng',
    phone: '+234 803 555 9201',
    tradeRole: 'Importer & Tech Wholesaler'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSignup(form);
    navigate('verify-email');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pt-2 mb-6">
          <button
            onClick={() => navigate('welcome')}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Step 1 of 2
          </span>
          <div className="w-10" />
        </div>

        <div className="space-y-1.5 mb-6">
          <h2 className="text-2xl font-extrabold text-white">Register Corporate Account</h2>
          <p className="text-xs text-slate-400">
            Compliant trade accounts for Nigerian importers & Chinese exporters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Registered Company Name
            </label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                CAC / RC Number
              </label>
              <input
                type="text"
                value={form.rcNumber}
                onChange={(e) => setForm({ ...form, rcNumber: e.target.value })}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Trading Country
              </label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
              >
                <option value="Nigeria">🇳🇬 Nigeria</option>
                <option value="China">🇨🇳 China (PRC)</option>
                <option value="Hong Kong">🇭🇰 Hong Kong</option>
                <option value="Ghana">🇬🇭 Ghana</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Corporate Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              WhatsApp / Business Phone
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              FlyeMass verifies CAC registry, Chinese SAFE regulations, and issues dedicated virtual NGN and RMB clearing credentials.
            </span>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Continue to PIN Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="pt-6 text-center border-t border-slate-900">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={() => navigate('login')}
            className="text-emerald-400 font-bold hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};
