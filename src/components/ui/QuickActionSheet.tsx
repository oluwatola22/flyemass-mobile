import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { ScreenRoute } from '../../types';

export const QuickActionSheet: React.FC = () => {
  const { isQuickActionOpen, setIsQuickActionOpen, navigate } = useApp();

  if (!isQuickActionOpen) return null;

  const actions = [
    {
      title: 'Fund Wallet',
      subtitle: 'Top up NGN, CNY, USD',
      icon: PlusCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      route: 'fund' as ScreenRoute
    },
    {
      title: 'Pay Supplier',
      subtitle: 'Alipay / WeChat / Bank',
      icon: Send,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      route: 'pay' as ScreenRoute
    },
    {
      title: 'Instant FX Swap',
      subtitle: 'Live rate lock & zero fee',
      icon: ArrowLeftRight,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      route: 'exchange' as ScreenRoute
    },
    {
      title: 'Track Cargo',
      subtitle: 'Air & Sea waybill status',
      icon: PackageSearch,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      route: 'track' as ScreenRoute
    },
    {
      title: 'Shop Apple & Tech',
      subtitle: 'Wholesale Hong Kong stock',
      icon: Smartphone,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      route: 'shop' as ScreenRoute
    },
    {
      title: 'Sourcing Agent',
      subtitle: 'Factory audit & Canton Fair',
      icon: Users2,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      route: 'agent' as ScreenRoute
    },
    {
      title: 'China Trade Hotels',
      subtitle: 'Guangzhou / Yiwu stays',
      icon: Hotel,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      route: 'hotels' as ScreenRoute
    },
    {
      title: 'Register Package',
      subtitle: 'Add 1688 / Taobao parcel',
      icon: FileBox,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      route: 'register-package' as ScreenRoute
    }
  ];

  const handleAction = (route: ScreenRoute) => {
    setIsQuickActionOpen(false);
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle / Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cross-Border Fast Actions</h3>
              <p className="text-xs text-slate-400">China ↔ Nigeria Enterprise Gateway</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickActionOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => handleAction(act.route)}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all text-left group"
              >
                <div className={`p-2.5 rounded-xl border ${act.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
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
