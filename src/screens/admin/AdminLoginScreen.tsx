import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_ADMINS, AdminUser } from '../../services/firebase';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Smartphone, 
  CheckCircle2, 
  KeyRound,
  Building2,
  Globe
} from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const { loginAdmin } = useApp();
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser>(INITIAL_ADMINS[0]);
  const [password, setPassword] = useState('••••••••••••');
  const [securityKey, setSecurityKey] = useState('FLY-ENTERPRISE-2026');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAdmin(selectedAdmin);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/30">
            FM
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider text-white">FlyeMass</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Web Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-semibold shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Operations Portal</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-8 max-w-md mx-auto w-full">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Administrator Sign-In</h2>
            <p className="text-xs text-slate-400">
              Enterprise Role-Based Access Control (RBAC) & Firebase Auth.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Select Role Preset */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Admin Role
              </label>
              <div className="space-y-1.5">
                {INITIAL_ADMINS.map((adm) => {
                  const isSelected = selectedAdmin.uid === adm.uid;
                  return (
                    <div
                      key={adm.uid}
                      onClick={() => setSelectedAdmin(adm)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-950 border-emerald-500 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={adm.avatar}
                          alt={adm.name}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {adm.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{adm.roleTitle}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Work Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={selectedAdmin.email}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none cursor-default"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Master Security Key / Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Authenticate & Enter Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security details */}
          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-center space-y-1">
            <p>Protected by Hardware Security Keys & Firebase RBAC Rules.</p>
            <p className="text-slate-400">All administrative operations logged to immutable audit ledger.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 pt-4 border-t border-slate-900">
        © 2026 FlyeMass Enterprise Logistics & Cross-Border Clearing Infrastructure • SAFE & CBN Compliant
      </div>
    </div>
  );
};
