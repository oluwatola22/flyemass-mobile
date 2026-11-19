import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  PlusCircle, 
  Send, 
  ArrowLeftRight, 
  PackageSearch, 
  Smartphone, 
  Users2, 
  Hotel, 
  FileBox, 
  X,
  Sparkles,
  Building,
  Download,
  Headphones,
  ShieldCheck,
  Truck,
  Home,
  Zap
} from 'lucide-react';
import { ScreenRoute } from '../../types';

export const QuickActionSheet: React.FC = () => {
  const { isQuickActionOpen, setIsQuickActionOpen, navigate, openSwapModal } = useApp();
  const [filterCategory, setFilterCategory] = useState<'all' | 'money' | 'cargo' | 'sourcing' | 'hospitality'>('all');

  if (!isQuickActionOpen) return null;

  const actions = [
    {
      title: 'Fund Multi-Wallet',
      subtitle: 'Top up NGN wallet (Naira-only funding)',
      icon: PlusCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      route: 'fund' as ScreenRoute,
      cat: 'money'
    },
    {
      title: 'Pay China Supplier',
      subtitle: 'Alipay / WeChat / Bank (RMB)',
      icon: Send,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      route: 'pay' as ScreenRoute,
      cat: 'money'
    },
    {
      title: 'Instant FX Swap',
      subtitle: 'NGN ↔ RMB bilateral swap',
      icon: ArrowLeftRight,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      route: 'exchange' as ScreenRoute,
      cat: 'money'
    },
    {
      title: 'Nigerian Bank Payout',
      subtitle: 'Instant NUBAN withdrawal',
      icon: Download,
      color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
      route: 'withdraw' as ScreenRoute,
      cat: 'money'
    },
    {
      title: 'Airtime, Data & Utility Bills',
      subtitle: 'MTN, Airtel, Glo, DISCOs & Cable TV',
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      route: 'bills' as ScreenRoute,
      cat: 'money'
    },
    {
      title: 'Register Package',
      subtitle: 'China warehouse parcel intake',
      icon: FileBox,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      route: 'register-package' as ScreenRoute,
      cat: 'cargo'
    },
    {
      title: 'Track Cargo Waybill',
      subtitle: 'Live air cargo milestones',
      icon: PackageSearch,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      route: 'track' as ScreenRoute,
      cat: 'cargo'
    },
    {
      title: 'Freight Rate Calculator',
      subtitle: 'Air Express & Regular pricing',
      icon: Truck,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      route: 'logistics' as ScreenRoute,
      cat: 'cargo'
    },
    {
      title: 'Sourcing Ground Agent & RFQ',
      subtitle: 'Factory audit & quotation desk',
      icon: Users2,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      route: 'agent' as ScreenRoute,
      cat: 'sourcing'
    },
    {
      title: 'CAC Business Registration',
      subtitle: 'Official BN & RC corporate portal',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      route: 'cac-registration' as ScreenRoute,
      cat: 'sourcing'
    },
    {
      title: 'Shop Apple & Tech',
      subtitle: 'Direct gadget wholesale (NGN/RMB)',
      icon: Smartphone,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      route: 'shop' as ScreenRoute,
      cat: 'sourcing'
    },
    {
      title: 'China Trade Hotels',
      subtitle: 'Guangzhou & Yiwu business stays',
      icon: Hotel,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      route: 'hotels' as ScreenRoute,
      cat: 'hospitality'
    },
    {
      title: 'Apartments & Houses',
      subtitle: 'Guangzhou residential rentals',
      icon: Home,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      route: 'rentals-apartments' as ScreenRoute,
      cat: 'hospitality'
    },
    {
      title: 'Commercial Offices',
      subtitle: 'Showrooms & office spaces',
      icon: Building,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      route: 'rentals-offices' as ScreenRoute,
      cat: 'hospitality'
    },
    {
      title: 'Concierge Live Help',
      subtitle: '24/7 Trade support desk',
      icon: Headphones,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      route: 'support-chat' as ScreenRoute,
      cat: 'hospitality'
    },
    {
      title: 'Security & 4-Digit PIN',
      subtitle: 'Transaction authorization key',
      icon: ShieldCheck,
      color: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
      route: 'security' as ScreenRoute,
      cat: 'hospitality'
    }
  ];

  const filteredActions = actions.filter(a => filterCategory === 'all' || a.cat === filterCategory);

  const handleAction = (route: ScreenRoute) => {
    setIsQuickActionOpen(false);
    if (route === 'exchange') {
      openSwapModal();
    } else {
      navigate(route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-10 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">All Platform Trade Services</h3>
              <p className="text-[10px] text-slate-400">Complete China ↔ Nigeria Enterprise Suite</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickActionOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-2 shrink-0">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'money', label: 'Wallets & FX' },
            { id: 'cargo', label: 'Air Cargo Logistics' },
            { id: 'sourcing', label: 'Sourcing & Shop' },
            { id: 'hospitality', label: 'Hotels & Support' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-all ${
                filterCategory === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Grid (Scrollable) */}
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto no-scrollbar pr-0.5">
          {filteredActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => handleAction(act.route)}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all text-left group"
              >
                <div className={`p-2 rounded-xl border ${act.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
