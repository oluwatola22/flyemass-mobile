import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ChevronLeft, 
  Headphones, 
  Check, 
  X
} from 'lucide-react';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ showBack, title }) => {
  const { 
    userProfile, 
    isBalanceHidden, 
    toggleBalancePrivacy, 
    goBack, 
    currentRoute, 
    navigate 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const notificationsList = [
    {
      id: 'notif-1',
      title: 'Alipay Payment Confirmed',
      desc: '¥45,000 received by Foxconn Micro Tech.',
      time: '12m ago',
      unread: true
    },
    {
      id: 'notif-2',
      title: 'Flight ET921 Waypoint Update',
      desc: 'Air cargo departed Guangzhou Baiyun hub.',
      time: '2h ago',
      unread: true
    },
    {
      id: 'notif-3',
      title: 'FX Rate Alert: RMB/NGN ₦214.50',
      desc: 'Naira appreciated +0.4% against Yuan.',
      time: '5h ago',
      unread: false
    }
  ];

  // If on sub-page with back button or specific page title
  const isSubPage = Boolean(title) || showBack || currentRoute !== 'home';

  if (isSubPage) {
    return (
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white p-1 rounded-lg active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-emerald-400" />
          <span>Back</span>
        </button>

        <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px]">
          {title || currentRoute.replace('-', ' ').toUpperCase()}
        </h2>

        <div className="flex items-center gap-2">
          {currentRoute === 'wallets' && (
            <button
              onClick={toggleBalancePrivacy}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title={isBalanceHidden ? 'Show Balances' : 'Hide Balances'}
            >
              {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => navigate('support-chat')}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 transition-colors"
            title="Trade Support"
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pt-3 pb-3">
      <div className="flex items-center justify-between">
        {/* User Greeting & Verified Status */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('profile')}
            className="relative cursor-pointer group"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Check className="w-2 h-2 text-slate-950 stroke-[3]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Welcome,</span>
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {userProfile.name.split(' ')[1] || 'Chief Alade'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Tier 3 Verified Exporter</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Eye Toggle, Notifications, Support */}
        <div className="flex items-center gap-2">
          {/* Privacy Toggle */}
          <button
            onClick={toggleBalancePrivacy}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
            title={isBalanceHidden ? 'Show Balances' : 'Hide Balances'}
          >
            {isBalanceHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Support Concierge */}
          <button
            onClick={() => navigate('support-chat')}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all active:scale-95"
            title="FlyeMass Concierge"
          >
            <Headphones className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
                  {notificationsList.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('notifications');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        item.unread 
                          ? 'bg-slate-800/80 border-slate-700/80 hover:border-emerald-500/50' 
                          : 'bg-slate-950/40 border-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('notifications');
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors w-full py-1"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
