import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Bell, 
  CheckCheck, 
  Send, 
  Truck, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight, 
  Trash2,
  Check,
  Wallet,
  Zap,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { AppNotification } from '../../types';

export const NotificationsScreen: React.FC = () => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    navigate,
    showToast 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'wallet' | 'bills' | 'trade' | 'cargo' | 'fx' | 'system'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'wallet') return n.type === 'wallet';
    if (filter === 'bills') return n.type === 'bills';
    if (filter === 'trade') return n.type === 'trade';
    if (filter === 'cargo') return n.type === 'cargo';
    if (filter === 'fx') return n.type === 'fx';
    if (filter === 'system') return n.type === 'system' || n.type === 'kyc' || n.type === 'cac';
    return n.type === filter;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'wallet': return Wallet;
      case 'bills': return Zap;
      case 'trade': return Send;
      case 'cargo': return Truck;
      case 'fx': return TrendingUp;
      case 'cac': return FileText;
      case 'kyc': return ShieldCheck;
      default: return Bell;
    }
  };

  const getIconColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'wallet': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'bills': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'trade': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'cargo': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'fx': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'cac': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'kyc': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.linkRoute) {
      navigate(n.linkRoute);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Notification Feed" />

      <div className="p-4 space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-bold text-white whitespace-nowrap">Alerts & Broadcasts</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold whitespace-nowrap">
                {unreadCount > 99 ? '99+' : unreadCount} new
              </span>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>FCM Active</span>
            </div>
          </div>

          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark read</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {([
            { id: 'all', label: 'All Alerts' },
            { id: 'wallet', label: 'Wallet & Payouts' },
            { id: 'bills', label: 'Airtime & Bills' },
            { id: 'trade', label: 'Supplier Trade' },
            { id: 'cargo', label: 'Cargo Tracking' },
            { id: 'fx', label: 'FX Market' },
            { id: 'system', label: 'Compliance & Security' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const Icon = getIcon(item.type);
              const colorClass = getIconColor(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    item.read
                      ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-900 border-emerald-500/40 hover:border-emerald-500 shadow-md'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-300' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {item.linkRoute && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-2 hover:underline">
                        <span>Tap to view details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute right-3 top-3 shadow-sm shadow-emerald-400" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Bell className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No notifications in this category</p>
              <p className="text-[11px] text-slate-500">You're completely up to date!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
