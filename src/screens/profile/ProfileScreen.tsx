import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
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
  ChevronDown,
  Moon, 
  Sun, 
  Smartphone,
  CheckCircle2,
  Share2,
  Edit,
  X,
  Check,
  Copy,
  FileCheck
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { 
    userProfile, 
    setUserProfile,
    activeUserId,
    logout, 
    navigate, 
    showToast,
    themeMode,
    toggleTheme,
    isFrameMockup,
    toggleFrameMockup,
    language,
    setLanguage,
    t
  } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editCompany, setEditCompany] = useState(userProfile.company);
  const [editPhone, setEditPhone] = useState(userProfile.phone);

  useEffect(() => {
    const u = db.getUser(activeUserId);
    if (u && setUserProfile) {
      if (u.company || u.registeredCompanyName || u.rcNumber || u.cacRcNumber) {
        setUserProfile((prev: any) => ({
          ...prev,
          company: u.company || u.registeredCompanyName || prev.company,
          rcNumber: u.rcNumber || u.cacRcNumber || prev.rcNumber
        }));
      }
    }
  }, [activeUserId, setUserProfile]);

  const uniqueUserId = (userProfile as any).shippingMark || userProfile.flyeTag || (activeUserId === 'usr_alade_01' ? 'FM-USR-8924' : `FM-USR-${activeUserId.slice(-4).toUpperCase()}`);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateUser(activeUserId, {
      fullName: editName,
      businessName: editCompany,
      phone: editPhone
    });
    if (setUserProfile) {
      setUserProfile((prev: any) => ({
        ...prev,
        name: editName,
        company: editCompany,
        phone: editPhone
      }));
    }
    showToast('Corporate profile updated and synchronized!', 'success');
    setShowEditModal(false);
  };

  const menuSections = [
    {
      title: t('profile.security_section', 'Security & Hardware Enclave'),
      items: [
        { title: t('profile.security_pin', 'Security Settings & PIN'), desc: 'Manage 4-digit PIN, 2FA & sessions', icon: Lock, route: 'security', color: 'text-indigo-400 bg-indigo-500/10' },
        { title: t('profile.device_migration', 'Device Migration & Biometrics'), desc: 'Re-bind hardware terminal keys', icon: Smartphone, route: 'switch-device', color: 'text-cyan-400 bg-cyan-500/10' }
      ]
    },
    {
      title: t('profile.concierge_section', 'Concierge & Trade Support'),
      items: [
        { title: t('profile.live_concierge', 'FlyeMass Live Concierge'), desc: 'Guangzhou & Lagos active trade desks', icon: Headphones, route: 'support-chat', color: 'text-emerald-400 bg-emerald-500/10' },
        { title: t('profile.tickets_desk', 'Support Tickets Desk'), desc: 'Air waybills, customs disputes & Form M', icon: FileText, route: 'support-tickets', color: 'text-cyan-400 bg-cyan-500/10' },
        { title: t('profile.help_center', 'Help Center & Trade FAQs'), desc: 'Import guidelines, customs & clearing', icon: FileText, route: 'support', color: 'text-amber-400 bg-amber-500/10' }
      ]
    },
    {
      title: t('profile.legal_section', 'Legal, Compliance & Governance'),
      items: [
        { title: 'CAC Business Registration', desc: 'Corporate Affairs Commission BN & RC Portal', icon: FileCheck, route: 'cac-registration' as any, color: 'text-emerald-400 bg-emerald-500/10' },
        { title: t('profile.terms', 'Terms of Trade Service'), desc: 'Cross-border escrow and logistics rules', icon: FileText, route: 'terms', color: 'text-slate-400 bg-slate-800' },
        { title: t('profile.privacy', 'Privacy Policy & NDPR'), desc: 'Nigeria Data Protection Regulation', icon: ShieldCheck, route: 'privacy', color: 'text-slate-400 bg-slate-800' },
        { title: t('profile.delete_account', 'Account Deletion Request'), desc: 'Store compliant data purge protocol', icon: LogOut, route: 'delete-account', color: 'text-rose-400 bg-rose-500/10' }
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
                <h3 className="text-base font-semibold text-white truncate">{userProfile.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-sm text-slate-400 truncate">{userProfile.company}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  {userProfile.tier}
                </span>
                <span className="text-xs text-slate-500 font-mono">{userProfile.rcNumber}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(userProfile.name);
                setEditCompany(userProfile.company);
                setEditPhone(userProfile.phone);
                setShowEditModal(true);
              }}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
              title="Edit Profile Details"
            >
              <Edit className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-xs text-slate-500 block">Unique User ID / FlyeTag</span>
              <span className="font-mono font-semibold text-emerald-400">{uniqueUserId}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Contact Phone</span>
              <span className="font-mono font-semibold text-slate-200">{userProfile.phone}</span>
            </div>
          </div>
        </div>

        {/* Unique User ID / FlyeTag & Official Shipping Mark Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Unique Shipping ID / FlyeTag
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              Official Shipping Mark
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <span className="text-xs text-slate-400 block font-sans">UNIQUE ID (MARK ON ALL CARTONS):</span>
              <p className="font-mono text-sm font-semibold text-emerald-400 tracking-wider truncate">
                {uniqueUserId}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(uniqueUserId);
                setCopiedTag(true);
                setTimeout(() => setCopiedTag(false), 2000);
                showToast(`Unique Shipping ID copied: ${uniqueUserId}`, 'success');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-500/25 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTag ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-tight">
            Use this automated ID on all warehouse shipments. China dock personnel scan this ID to instantly route packages to your FlyeMass account.
          </p>
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

          {/* Trade Language iOS-Style Selector Row */}
          <div 
            onClick={() => setShowLanguagePicker(true)}
            className="flex items-center justify-between border-t border-slate-800/80 pt-3 cursor-pointer group select-none transition-colors hover:bg-slate-800/20 -mx-1 px-1 rounded-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {t('profile.trade_language', 'Trade Language')}
                </p>
                <p className="text-[10px] text-slate-400">
                  {t('profile.language_subtitle', 'English (Primary), French (Français)')}
                </p>
              </div>
            </div>

            {/* Dropdown / Chevron Trigger showing active language */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLanguagePicker(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm group-hover:border-slate-600"
              aria-label="Select Trade Language"
            >
              <span className="text-xs font-bold text-emerald-400">
                {language === 'FR' ? 'Français' : 'English (Primary)'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
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
                  onClick={() => {
                    if ((item as any).action) {
                      (item as any).action();
                    } else if ((item as any).route) {
                      navigate((item as any).route);
                    }
                  }}
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

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <form onSubmit={handleSaveProfile} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-200 mt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-extrabold text-white">Edit Corporate Profile</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Director / Authorized Representative</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Registered Enterprise Name</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone Number (SMS / WhatsApp)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Save & Synchronize Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trade Language Selection Modal / Minimalist Bottom Sheet */}
        {showLanguagePicker && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in p-0 sm:p-4"
            onClick={() => setShowLanguagePicker(false)}
          >
            <div 
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iOS-Style Top Pull Handle on Mobile */}
              <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {t('profile.trade_language', 'Trade Language')}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {language === 'FR' ? 'Choisir la langue d\'affichage' : 'Choose interface display language'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLanguagePicker(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language Options List */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'EN' as const,
                    name: 'English (Primary)',
                    nativeLabel: 'English',
                    description: 'Default language for global trade & logistics'
                  },
                  {
                    id: 'FR' as const,
                    name: 'Français (French)',
                    nativeLabel: 'Français',
                    description: 'Langue officielle pour le commerce et la facturation'
                  }
                ].map((option) => {
                  const isSelected = language === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setLanguage(option.id);
                        setShowLanguagePicker(false);
                        showToast(
                          option.id === 'FR' 
                            ? 'Langue modifiée avec succès : Français' 
                            : 'Trade language updated successfully: English',
                          'success'
                        );
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {option.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {option.description}
                        </p>
                      </div>

                      {/* Crisp Checkmark / Radio Indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ml-3 ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                          : 'border border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Instant Application Subtext */}
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center">
                <p className="text-[10px] text-slate-400">
                  {language === 'FR' 
                    ? '⚡ La mise à jour s\'applique instantanément sans recharger la page.' 
                    : '⚡ Changes apply instantly across all screens without reloading.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
