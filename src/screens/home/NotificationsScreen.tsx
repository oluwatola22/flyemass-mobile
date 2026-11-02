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
  Check
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

  const [filter, setFilter] = useState<'all' | 'trade' | 'cargo' | 'fx' | 'system'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'trade': return Send;
      case 'cargo': return Truck;
      case 'fx': return TrendingUp;
      default: return ShieldAlert;
    }
  };

  const getIconColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'trade': return 'bg-emerald-500/10 text-emerald-400';
      case 'cargo': return 'bg-cyan-500/10 text-cyan-400';
      case 'fx': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-indigo-500/10 text-indigo-400';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Alerts & Broadcasts</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                {unreadCount} new
              </span>
            )}
          </div>

          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'trade', 'cargo', 'fx', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === tab
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Alerts' : tab === 'trade' ? 'Supplier Payouts' : tab === 'cargo' ? 'Cargo Tracking' : tab === 'fx' ? 'FX Market' : 'Security'}
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
