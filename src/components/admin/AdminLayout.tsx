import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { INITIAL_ADMINS, AdminUser, AdminRole, firebaseSync } from '../../services/firebase';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  CreditCard, 
  ShoppingBag, 
  Hotel, 
  ShieldCheck, 
  Headphones, 
  Database, 
  Search, 
  Bell, 
  Smartphone, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  DollarSign,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';
import { ScreenRoute } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const { navigate, showToast, themeMode, toggleTheme } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(INITIAL_ADMINS[0]);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Unread badge counts from live database
  const [dbState, setDbState] = useState(db.getState());
  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const pendingPaymentsCount = Object.values(dbState.supplier_payments).filter(
    (p) => p.status === 'processing'
  ).length;

  const inTransitCargoCount = Object.values(dbState.shipments).filter(
    (s) => s.currentStatus === 'In Transit/Customs' || s.currentStatus === 'Origin Received'
  ).length;

  const openTicketsCount = Object.values(dbState.support_tickets).filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Command Center', route: 'admin-dashboard' as ScreenRoute, icon: LayoutDashboard },
    { id: 'users', label: 'User Directory & Wallets', route: 'admin-users' as ScreenRoute, icon: Users, badge: Object.keys(dbState.users).length },
    { id: 'logistics', label: 'Cargo Control Tower', route: 'admin-logistics' as ScreenRoute, icon: Truck, badge: inTransitCargoCount, badgeColor: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'payments', label: 'Supplier Payout Desk', route: 'admin-payments' as ScreenRoute, icon: CreditCard, badge: pendingPaymentsCount, badgeColor: 'bg-amber-500/20 text-amber-400' },
    { id: 'shop', label: 'Tech Gadget Inventory', route: 'admin-shop' as ScreenRoute, icon: ShoppingBag, badge: Object.keys(dbState.shop_orders).length },
    { id: 'hotels', label: 'Business Hotel Bookings', route: 'admin-hotels' as ScreenRoute, icon: Hotel },
    { id: 'agents', label: 'Sourcing & Inspections', route: 'admin-agents' as ScreenRoute, icon: Building2 },
    { id: 'support', label: 'Live Support & Tickets', route: 'admin-support' as ScreenRoute, icon: Headphones, badge: openTicketsCount, badgeColor: 'bg-rose-500/20 text-rose-400' },
    { id: 'team', label: 'Team & RBAC Security', route: 'admin-team' as ScreenRoute, icon: ShieldCheck },
    { id: 'db', label: 'NoSQL Schema Explorer', route: 'schema-inspector' as ScreenRoute, icon: Database, isDev: true },
  ];

  const handleRoleChange = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setShowRoleSwitcher(false);
    showToast(`Switched active session to ${admin.name} (${admin.roleTitle})`, 'info');
    firebaseSync.recordAudit(admin.name, 'ROLE_SWITCH', 'users', admin.uid, `Assumed role ${admin.role}`);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('ship') || q.includes('fm-') || q.includes('can') || q.includes('cargo')) {
      navigate('admin-logistics');
    } else if (q.includes('pay') || q.includes('alipay') || q.includes('wechat') || q.includes('rmb')) {
      navigate('admin-payments');
    } else if (q.includes('user') || q.includes('alade') || q.includes('client')) {
      navigate('admin-users');
    } else if (q.includes('iphone') || q.includes('order') || q.includes('tech')) {
      navigate('admin-shop');
    } else {
      navigate('admin-dashboard');
    }
    showToast(`Filtering command center for "${searchQuery}"`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Cross-Platform Switcher Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-[10px]">
              FM
            </div>
            <span className="font-extrabold tracking-wide text-white">
              FlyeMass Enterprise Command Center
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Guangzhou ↔ Lagos Synchronized</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* FX Margins Ticker Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-400">RMB/NGN:</span>
            <span className="text-emerald-400 font-bold">₦214.50</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">USD/NGN:</span>
            <span className="text-indigo-400 font-bold">₦1,485.00</span>
          </div>

          {/* Quick Switch to Mobile Client App */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                navigate('home');
                window.history.pushState({ route: 'home' }, '', '/app');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-[11px] shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
              title="Preview Mobile Client Application (/app)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 View Client Mobile App (/app)</span>
            </button>
            <a
              href="/app"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors border border-slate-700/60 flex items-center justify-center"
              title="Open Mobile App in New Tab (/app)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Fixed Collapsible Sidebar */}
        <aside
          className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header & Brand */}
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
                    Admin Portal
                  </h2>
                  <p className="text-[11px] text-slate-400">Cross-Border Clearance</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors mx-auto"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold shadow-sm shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-emerald-400' : 'group-hover:scale-110'}`} />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold num-tabular ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Current Admin Session Profile Footer */}
          <div className="p-3 border-t border-slate-800 relative">
            <div
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={`flex items-center gap-2.5 p-2 rounded-2xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-all ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <img
                src={currentAdmin.avatar}
                alt={currentAdmin.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500/40 shrink-0"
              />
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-white truncate">{currentAdmin.name}</p>
                  <p className="text-[10px] text-emerald-400 font-medium truncate">{currentAdmin.roleTitle.split(' ')[0]}</p>
                </div>
              )}
            </div>

            {/* Role Switcher Menu Popup */}
            {showRoleSwitcher && !sidebarCollapsed && (
              <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Assigned Personnel (RBAC)
                </p>
                <div className="space-y-1 mt-1">
                  {INITIAL_ADMINS.map((adm) => (
                    <button
                      key={adm.uid}
                      onClick={() => handleRoleChange(adm)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        currentAdmin.uid === adm.uid
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold">{adm.name}</p>
                        <p className="text-[10px] text-slate-400">{adm.roleTitle}</p>
                      </div>
                      {currentAdmin.uid === adm.uid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Fluid Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Global Command Bar */}
          <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global Command Search: tracking #, supplier, client..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </form>

            {/* Right Quick Controls */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="font-bold text-white">System Alerts</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Real-time</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="font-bold text-amber-400 text-[11px]">Pending Supplier Review</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">¥45,000 Foxconn transfer awaiting clearance confirmation.</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="font-bold text-cyan-400 text-[11px]">Flight ET921 Approaching Lagos</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Air cargo waybill FM-CAN-LOS-89241 touching down MM2.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Sign Out */}
              <button
                onClick={() => {
                  navigate('admin-login');
                  showToast('Signed out from Admin Command Center', 'info');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 hover:text-rose-400 transition-colors"
                title="Sign out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Main Scrollable Workspace */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
