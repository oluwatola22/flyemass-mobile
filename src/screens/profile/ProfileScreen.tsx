import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  Headphones, 
  FileText, 
  Globe, 
  LogOut, 
  ChevronRight, 
  Moon, 
  Sun, 
  Smartphone,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { 
    userProfile, 
    logout, 
    navigate, 
    showToast,
    themeMode,
    toggleTheme,
    isFrameMockup,
    toggleFrameMockup
  } = useApp();

  const [language, setLanguage] = useState<'EN' | 'ZH' | 'YO' | 'HA'>('EN');

  const menuSections = [
    {
      title: 'Security & Hardware Enclave',
      items: [
        { title: 'Security Settings & PIN', desc: 'Manage 4-digit PIN, 2FA & sessions', icon: Lock, route: 'security', color: 'text-indigo-400 bg-indigo-500/10' },
        { title: 'Device Migration & Biometrics', desc: 'Re-bind hardware terminal keys', icon: Smartphone, route: 'switch-device', color: 'text-cyan-400 bg-cyan-500/10' },
        { title: 'KYC & Trade Compliance', desc: 'CAC RC-1849204 • Tier 3 Exporter', icon: ShieldCheck, route: 'profile', color: 'text-emerald-400 bg-emerald-500/10' }
      ]
    },
    {
      title: 'Concierge & Trade Support',
      items: [
        { title: 'FlyeMass Live Concierge', desc: 'Guangzhou & Lagos active trade desks', icon: Headphones, route: 'support-chat', color: 'text-emerald-400 bg-emerald-500/10' },
        { title: 'Support Tickets Desk', desc: 'Air waybills, customs disputes & Form M', icon: FileText, route: 'support-tickets', color: 'text-cyan-400 bg-cyan-500/10' },
        { title: 'Help Center & Trade FAQs', desc: 'Import guidelines, customs & clearing', icon: FileText, route: 'support', color: 'text-amber-400 bg-amber-500/10' }
      ]
    },
    {
      title: 'Legal, Compliance & Governance',
      items: [
        { title: 'Terms of Trade Service', desc: 'Cross-border escrow and logistics rules', icon: FileText, route: 'terms', color: 'text-slate-400 bg-slate-800' },
        { title: 'Privacy Policy & NDPR', desc: 'Nigeria Data Protection Regulation', icon: ShieldCheck, route: 'privacy', color: 'text-slate-400 bg-slate-800' },
        { title: 'Account Deletion Request', desc: 'Store compliant data purge protocol', icon: LogOut, route: 'delete-account', color: 'text-rose-400 bg-rose-500/10' }
      ]
    }
  ];

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Corporate Profile" />

      <div className="p-4 space-y-4">
        {/* User Badge Profile Header */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white truncate">{userProfile.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">{userProfile.company}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                  {userProfile.tier}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{userProfile.rcNumber}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">FlyeTag Username</span>
              <span className="font-mono font-bold text-slate-200">{userProfile.flyeTag}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Contact Phone</span>
              <span className="font-mono font-bold text-slate-200">{userProfile.phone}</span>
            </div>
          </div>
        </div>

        {/* Display & Layout Controls Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            App Experience & Viewport
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Device Frame Mockup</p>
                <p className="text-[10px] text-slate-400">Toggle realistic mobile shell bezel</p>
              </div>
            </div>
            <button
              onClick={toggleFrameMockup}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isFrameMockup ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                  isFrameMockup ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">Trade Language</p>
                <p className="text-[10px] text-slate-400">English, Chinese, Yoruba, Hausa</p>
              </div>
            </div>
            <div className="flex gap-1">
              {(['EN', 'ZH', 'YO'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    language === lang ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {lang === 'EN' ? 'English' : lang === 'ZH' ? '中文' : 'Yorùbá'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((sec) => (
          <div key={sec.title} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {sec.title}
            </span>

            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  onClick={() => navigate(item.route as any)}
                  className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/70 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl bg-slate-900 border border-rose-500/20 hover:border-rose-500/50 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Corporate Account</span>
        </button>
      </div>
    </div>
  );
};
