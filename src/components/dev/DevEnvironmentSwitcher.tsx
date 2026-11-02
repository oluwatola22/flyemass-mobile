import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  LayoutDashboard, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Layers, 
  Truck, 
  CreditCard, 
  ShoppingBag, 
  Headphones, 
  Database,
  ArrowRight
} from 'lucide-react';

export const DevEnvironmentSwitcher: React.FC = () => {
  const { currentRoute, navigate, showToast } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSubNav, setShowSubNav] = useState(false);

  const isAdmin = currentRoute.startsWith('admin-') || currentRoute === 'schema-inspector';
  const currentPath = window.location.pathname || (isAdmin ? '/admin' : '/');

  const handleOpenMobile = () => {
    navigate('home');
    if (window.location.pathname !== '/') {
      window.history.pushState({ route: 'home' }, '', '/');
    }
    showToast('Switched to Client Mobile App view (/)', 'info');
  };

  const handleOpenAdmin = () => {
    navigate('admin-dashboard');
    if (window.location.pathname !== '/admin') {
      window.history.pushState({ route: 'admin-dashboard' }, '', '/admin');
    }
    showToast('Switched to Web Admin Dashboard (/admin)', 'success');
  };

  const handleCopyUrl = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    showToast(`Copied ${fullUrl} to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-3 right-4 z-[9999] select-none font-sans">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-slate-200 hover:text-white shadow-2xl hover:border-emerald-500/60 transition-all text-xs font-semibold"
          title="Expand Environment Switcher"
        >
          <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{isAdmin ? '⚙️ Web Admin' : '📱 Mobile App'}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] select-none max-w-4xl w-[calc(100vw-24px)] md:w-auto font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.15)] p-1.5 sm:p-2 text-xs flex flex-col gap-1.5">
        {/* Main Control Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Active Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-[11px] font-bold text-slate-300">
              {isAdmin ? (
                <span className="text-indigo-400">Web Admin Center</span>
              ) : (
                <span className="text-emerald-400">Mobile Client App</span>
              )}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
              ({currentPath})
            </span>
          </div>

          {/* Primary View Switcher Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Button 1: Mobile App */}
            <button
              id="btn-open-mobile"
              onClick={handleOpenMobile}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                !isAdmin
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Open Mobile App (/)</span>
            </button>

            {/* Button 2: Web Admin */}
            <button
              id="btn-open-admin"
              onClick={handleOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                isAdmin
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>⚙️ Open Web Admin (/admin)</span>
            </button>
          </div>

          {/* Utility Tools */}
          <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
            <button
              onClick={() => handleCopyUrl(isAdmin ? '/admin' : '/')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700/60"
              title="Copy current direct URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setShowSubNav(!showSubNav)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700/60 flex items-center gap-1"
              title="Quick Module Jumper"
            >
              <span className="text-[10px] font-semibold hidden md:inline">Quick Jump</span>
              {showSubNav ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700/60"
              title="Collapse Switcher"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional Expanded Sub-Navigation Drawer */}
        {showSubNav && (
          <div className="pt-1.5 mt-0.5 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-[11px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
              Direct Routes:
            </span>
            {isAdmin ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigate('admin-users')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /admin/users
                </button>
                <button
                  onClick={() => navigate('admin-logistics')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /admin/logistics
                </button>
                <button
                  onClick={() => navigate('admin-payments')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /admin/payments
                </button>
                <button
                  onClick={() => navigate('admin-shop')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /admin/shop
                </button>
                <button
                  onClick={() => navigate('admin-support')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /admin/support
                </button>
                <button
                  onClick={() => navigate('schema-inspector')}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                >
                  /admin/db
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigate('wallets')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /wallets
                </button>
                <button
                  onClick={() => navigate('logistics')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /logistics
                </button>
                <button
                  onClick={() => navigate('shop')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /shop
                </button>
                <button
                  onClick={() => navigate('pay')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /pay
                </button>
                <button
                  onClick={() => navigate('exchange')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /exchange
                </button>
                <button
                  onClick={() => navigate('profile')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  /profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
