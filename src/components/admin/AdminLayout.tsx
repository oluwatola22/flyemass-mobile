import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getMobileAppUrl } from '../../utils/environment';
import { db } from '../../services/db';
import { INITIAL_ADMINS, AdminUser, AdminRole, AdminModulePermission, firebaseSync } from '../../services/firebase';
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
  ExternalLink,
  Send,
  Home,
  Briefcase,
  Sliders,
  Download,
  Megaphone,
  MapPin,
  Calculator,
  Plane,
  ChevronDown,
  Terminal,
  Clock,
  FileCheck,
  Zap
} from 'lucide-react';
import { ScreenRoute } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export const AdminLayoutContext = React.createContext<boolean>(false);

interface AdminNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  section: 'core' | 'treasury' | 'commerce' | 'governance';
  route: ScreenRoute;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  isDev?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const isNested = React.useContext(AdminLayoutContext);
  if (isNested) {
    return <>{children}</>;
  }

  const { navigate, showToast, logoutAdmin, adminUser } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(() => adminUser || INITIAL_ADMINS[0]);
  const [devModeAccordionOpen, setDevModeAccordionOpen] = useState(activeTab === 'db');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeTab === 'db') {
      setDevModeAccordionOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (adminUser) {
      setCurrentAdmin(adminUser);
    }
  }, [adminUser]);

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoized unread badge counts & live rates from authoritative database with strict equality gating
  const computeBadges = () => {
    const s = db.getState();
    const pendingPaymentsCount = Object.values(s.supplier_payments || {}).filter(
      (p) => p.status === 'processing' || p.status === 'pending'
    ).length;

    const pendingWithdrawalsCount = Object.values(s.withdrawals || {}).filter(
      (w) => w.status === 'pending' || w.status === 'processing'
    ).length;

    const inTransitCargoCount = Object.values(s.shipments || {}).length;

    const openTicketsCount = Object.values(s.support_tickets || {}).filter(
      (t) => t.status === 'open' || t.status === 'in_progress'
    ).length;

    const agentRequestsCount = Object.values(s.agent_requests || {}).filter(
      (r) => r.status !== 'completed' && r.status !== 'cancelled'
    ).length;

    const usersCount = Object.keys(s.users || {}).length;
    const shopOrdersCount = Object.keys(s.shop_orders || {}).length;
    const cacApplicationsCount = Object.values(s.cac_registrations || {}).filter(
      (a: any) => a.status === 'pending' || a.status === 'action_required' || a.status === 'in_review'
    ).length;
    const pendingKycCount = Object.values((s as any).kyc_submissions || {}).filter(
      (k: any) => k.status === 'pending'
    ).length;
    const airRates = db.getAirShippingRates();
    const fxRates = db.getLogisticsFxRates();

    return {
      pendingPaymentsCount,
      pendingWithdrawalsCount,
      inTransitCargoCount,
      openTicketsCount,
      agentRequestsCount,
      usersCount,
      shopOrdersCount,
      cacApplicationsCount,
      pendingKycCount,
      expressAirRate: airRates.expressRatePerKgUSD ?? 13.0,
      normalAirRate: airRates.normalRatePerKgUSD ?? 9.6,
      usdToNgn: fxRates.usdToNgn ?? 1400.0,
      usdToCny: fxRates.usdToCny ?? 7.25
    };
  };

  const [badges, setBadges] = useState(computeBadges);

  useEffect(() => {
    return db.subscribe(() => {
      const next = computeBadges();
      setBadges((prev) => {
        if (
          prev.pendingPaymentsCount === next.pendingPaymentsCount &&
          prev.pendingWithdrawalsCount === next.pendingWithdrawalsCount &&
          prev.inTransitCargoCount === next.inTransitCargoCount &&
          prev.openTicketsCount === next.openTicketsCount &&
          prev.agentRequestsCount === next.agentRequestsCount &&
          prev.usersCount === next.usersCount &&
          prev.shopOrdersCount === next.shopOrdersCount &&
          prev.cacApplicationsCount === next.cacApplicationsCount &&
          prev.pendingKycCount === next.pendingKycCount &&
          prev.expressAirRate === next.expressAirRate &&
          prev.normalAirRate === next.normalAirRate &&
          prev.usdToNgn === next.usdToNgn &&
          prev.usdToCny === next.usdToCny
        ) {
          return prev;
        }
        return next;
      });
    });
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+K or '/' focuses global search; Cmd/Ctrl+B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (!isInputFocused && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = useMemo(() => [
    // 1. CORE OPERATIONAL WORKFLOWS (Primary 1-Click Access)
    {
      id: 'dashboard',
      label: 'Dashboard & Overview',
      shortLabel: 'Dashboard',
      path: '/admin',
      section: 'core',
      route: 'admin-dashboard' as ScreenRoute,
      icon: LayoutDashboard
    },
    {
      id: 'logistics',
      label: 'Shipments & Cargo Pipeline',
      shortLabel: 'Shipments',
      path: '/admin/shipments',
      section: 'core',
      route: 'admin-logistics' as ScreenRoute,
      icon: Truck,
      badge: badges.inTransitCargoCount,
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
    },
    {
      id: 'agents',
      label: 'Agent Sourcing & Procurement',
      shortLabel: 'Agent Requests',
      path: '/admin/agent-requests',
      section: 'core',
      route: 'admin-agent-requests' as ScreenRoute,
      icon: Users,
      badge: badges.agentRequestsCount,
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'support',
      label: 'Support Tickets & Duty Desk',
      shortLabel: 'Support Tickets',
      path: '/admin/support/tickets',
      section: 'core',
      route: 'admin-support' as ScreenRoute,
      icon: Headphones,
      badge: badges.openTicketsCount,
      badgeColor: 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
    },
    {
      id: 'lagos-hubs',
      label: 'Lagos Hubs & Last-Mile Offices',
      shortLabel: 'Lagos Hubs',
      path: '/admin/lagos-hubs',
      section: 'core',
      route: 'admin-lagos-hubs' as ScreenRoute,
      icon: MapPin
    },
    {
      id: 'shipping-rates',
      label: 'Air Shipping & FX Rates',
      shortLabel: 'Air & FX Rates',
      path: '/admin/settings/shipping',
      section: 'core',
      route: 'admin-shipping-rates' as ScreenRoute,
      icon: Calculator
    },

    // 2. TREASURY, SETTLEMENT & WALLETS
    {
      id: 'users',
      label: 'User Directory & Wallets',
      path: '/admin/users',
      section: 'treasury',
      route: 'admin-users' as ScreenRoute,
      icon: Users,
      badge: badges.usersCount
    },
    {
      id: 'kyc-compliance',
      label: 'KYC & Compliance Verification',
      shortLabel: 'KYC Compliance',
      path: '/admin/compliance/kyc',
      section: 'treasury',
      route: 'admin-kyc-compliance' as ScreenRoute,
      icon: ShieldCheck,
      badge: badges.pendingKycCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'rmb-transfers',
      label: 'China RMB Transfers',
      path: '/admin/treasury/rmb',
      section: 'treasury',
      route: 'admin-rmb-transfers' as ScreenRoute,
      icon: Send,
      badge: badges.pendingPaymentsCount,
      badgeColor: 'bg-indigo-500/20 text-indigo-300'
    },
    {
      id: 'naira-payouts',
      label: 'Naira Bank Payouts',
      path: '/admin/treasury/naira',
      section: 'treasury',
      route: 'admin-naira-payouts' as ScreenRoute,
      icon: Download,
      badge: badges.pendingWithdrawalsCount,
      badgeColor: 'bg-teal-500/20 text-teal-300'
    },
    {
      id: 'fx-management',
      label: 'FX Rates & Margins',
      path: '/admin/fx-management',
      section: 'treasury',
      route: 'admin-fx-management' as ScreenRoute,
      icon: Sliders
    },
    {
      id: 'fx-rates',
      label: 'FX Rate Publishing & Swap Fees',
      shortLabel: 'Publish Rates',
      path: '/admin/rates',
      section: 'treasury',
      route: 'admin-fx-rates' as ScreenRoute,
      icon: TrendingUp
    },
    {
      id: 'funding',
      label: 'Funding & Gateways',
      path: '/admin/funding',
      section: 'treasury',
      route: 'admin-funding' as ScreenRoute,
      icon: CreditCard
    },
    {
      id: 'payments',
      label: 'Treasury & General Ledger',
      path: '/admin/payments',
      section: 'treasury',
      route: 'admin-payments' as ScreenRoute,
      icon: Activity
    },

    // 3. WAREHOUSES, MARKETPLACE & REAL ESTATE
    {
      id: 'warehouses',
      label: 'Warehouses & Hubs',
      path: '/admin/warehouses',
      section: 'commerce',
      route: 'admin-warehouses' as ScreenRoute,
      icon: Building2
    },
    {
      id: 'suppliers',
      label: 'VIP Supplier Directory',
      path: '/admin/suppliers',
      section: 'commerce',
      route: 'admin-suppliers' as ScreenRoute,
      icon: Building2
    },
    {
      id: 'shop',
      label: 'Tech Gadget Inventory',
      path: '/admin/shop',
      section: 'commerce',
      route: 'admin-shop' as ScreenRoute,
      icon: ShoppingBag,
      badge: badges.shopOrdersCount
    },
    {
      id: 'hotels',
      label: 'Hotel Bookings',
      path: '/admin/hotels',
      section: 'commerce',
      route: 'admin-hotels' as ScreenRoute,
      icon: Hotel
    },
    {
      id: 'rentals-apartments',
      label: 'Residential Apartments',
      path: '/admin/rentals-apartments',
      section: 'commerce',
      route: 'admin-rentals-apartments' as ScreenRoute,
      icon: Home
    },
    {
      id: 'rentals-offices',
      label: 'Commercial Offices',
      path: '/admin/rentals-offices',
      section: 'commerce',
      route: 'admin-rentals-offices' as ScreenRoute,
      icon: Briefcase
    },
    {
      id: 'services-bills',
      label: 'Airtime, Data & VTU Bills',
      shortLabel: 'VTU & Bills',
      path: '/admin/services/bills',
      section: 'commerce',
      route: 'admin-services-bills' as ScreenRoute,
      icon: Zap
    },
    {
      id: 'services-cac',
      label: 'CAC Business Registration',
      shortLabel: 'CAC Registrations',
      path: '/admin/services/cac',
      section: 'commerce',
      route: 'admin-services-cac' as ScreenRoute,
      icon: FileCheck,
      badge: badges.cacApplicationsCount,
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    },

    // 4. SYSTEM & GOVERNANCE
    {
      id: 'communications',
      label: 'Communications & Banners',
      path: '/admin/communications',
      section: 'governance',
      route: 'admin-communications' as ScreenRoute,
      icon: Megaphone
    },
    {
      id: 'team',
      label: 'Staff & RBAC Governance',
      shortLabel: 'Staff & RBAC',
      path: '/admin/governance/rbac',
      section: 'governance',
      route: 'admin-team' as ScreenRoute,
      icon: ShieldCheck
    },
    {
      id: 'db',
      label: 'Developer Diagnostics',
      path: '/admin/db',
      section: 'governance',
      route: 'schema-inspector' as ScreenRoute,
      icon: Database,
      isDev: true
    }
  ], [badges]);

  const ROLE_AUTHORIZED_TABS: Record<AdminRole, string[]> = {
    super_admin: [
      'dashboard', 'logistics', 'agents', 'support', 'lagos-hubs', 'shipping-rates',
      'users', 'kyc-compliance', 'warehouses', 'rmb-transfers', 'naira-payouts', 
      'fx-management', 'fx-rates', 'funding', 'payments', 'shop', 'hotels', 
      'rentals-apartments', 'rentals-offices', 'suppliers', 'services-bills', 'services-cac',
      'communications', 'team', 'db'
    ],
    finance_officer: [
      'dashboard', 'shipping-rates', 'users', 'kyc-compliance', 'warehouses', 'lagos-hubs', 'rmb-transfers', 'naira-payouts', 
      'fx-management', 'fx-rates', 'funding', 'payments', 'services-bills', 'services-cac'
    ],
    logistics_manager: [
      'dashboard', 'logistics', 'shipping-rates', 'warehouses', 'lagos-hubs', 'shop', 'suppliers', 'agents', 'services-bills', 'communications'
    ],
    support_agent: [
      'dashboard', 'logistics', 'support', 'agents', 'users', 'kyc-compliance', 'warehouses', 'lagos-hubs', 'hotels', 'rentals-apartments', 'rentals-offices', 'communications', 'services-bills', 'services-cac'
    ],
    warehouse_officer: [
      'dashboard', 'logistics', 'warehouses', 'lagos-hubs', 'shop', 'suppliers'
    ],
    custom: [
      'dashboard', 'logistics', 'kyc-compliance', 'services-bills'
    ]
  };

  const TAB_TO_PERMISSION: Record<string, AdminModulePermission> = {
    'logistics': 'shipments',
    'agents': 'agents',
    'support': 'support',
    'lagos-hubs': 'lagos_hubs',
    'shipping-rates': 'shipping_rates',
    'users': 'users',
    'kyc-compliance': 'users',
    'payments': 'treasury',
    'rmb-transfers': 'treasury',
    'naira-payouts': 'treasury',
    'fx-management': 'treasury',
    'fx-rates': 'treasury',
    'funding': 'treasury',
    'warehouses': 'commerce',
    'shop': 'commerce',
    'hotels': 'commerce',
    'rentals-apartments': 'commerce',
    'rentals-offices': 'commerce',
    'suppliers': 'commerce',
    'services-bills': 'commerce',
    'services-cac': 'commerce',
    'communications': 'support'
  };

  const authorizedTabs = useMemo(() => {
    if (currentAdmin.role === 'super_admin') {
      return ROLE_AUTHORIZED_TABS.super_admin;
    }
    if (currentAdmin.status === 'suspended') {
      return ['dashboard'];
    }
    if (currentAdmin.permissions && Array.isArray(currentAdmin.permissions)) {
      const allowed: string[] = ['dashboard'];
      for (const [tab, perm] of Object.entries(TAB_TO_PERMISSION)) {
        if (currentAdmin.permissions.includes(perm)) {
          allowed.push(tab);
        }
      }
      return allowed.filter(tab => tab !== 'db' && tab !== 'team');
    }
    const roleAllowed = ROLE_AUTHORIZED_TABS[currentAdmin.role] || ['dashboard'];
    return roleAllowed.filter(tab => tab !== 'db' && tab !== 'team');
  }, [currentAdmin]);
  const filteredNavItems = useMemo(() => {
    const base = navItems.filter(item => authorizedTabs.includes(item.id));
    if (!sidebarFilter.trim()) return base;
    const q = sidebarFilter.toLowerCase();
    return base.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        (item.shortLabel && item.shortLabel.toLowerCase().includes(q))
    );
  }, [navItems, authorizedTabs, sidebarFilter]);

  const coreWorkflowItems = useMemo(
    () => navItems.filter(item => item.section === 'core' && authorizedTabs.includes(item.id)),
    [navItems, authorizedTabs]
  );

  const activeNavItem = useMemo(
    () => navItems.find(item => item.id === activeTab) || navItems[0],
    [navItems, activeTab]
  );

  const sectionLabelMap: Record<AdminNavItem['section'], string> = {
    core: 'CORE OPERATIONS',
    treasury: 'TREASURY & SETTLEMENTS',
    commerce: 'HUBS, TRADE & REAL ESTATE',
    governance: 'SYSTEM & GOVERNANCE'
  };

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
    if (q.includes('air') || q.includes('shipping rate') || q.includes('logistics fx')) {
      navigate('admin-shipping-rates');
    } else if (q.includes('lagos') || q.includes('last-mile') || q.includes('ikeja') || q.includes('lekki')) {
      navigate('admin-lagos-hubs');
    } else if (q.includes('agent') || q.includes('rfq') || q.includes('sourcing') || q.includes('procure') || q.includes('quote')) {
      navigate('admin-agent-requests');
    } else if (q.includes('ticket') || q.includes('support') || q.includes('duty') || q.includes('help') || q.includes('tkt')) {
      navigate('admin-support');
    } else if (q.includes('warehouse') || q.includes('guangzhou') || q.includes('yiwu')) {
      navigate('admin-warehouses');
    } else if (q.includes('ship') || q.includes('fm-') || q.includes('sl-') || q.includes('sp-') || q.includes('can') || q.includes('cargo') || q.includes('waybill')) {
      navigate('admin-logistics');
    } else if (q.includes('rmb') || q.includes('alipay') || q.includes('wechat') || q.includes('supplier pay')) {
      navigate('admin-rmb-transfers');
    } else if (q.includes('withdraw') || q.includes('naira') || q.includes('payout') || q.includes('nuban')) {
      navigate('admin-naira-payouts');
    } else if (q.includes('rate') || q.includes('spread') || q.includes('fx') || q.includes('swap')) {
      navigate('admin-fx-management');
    } else if (q.includes('gateway') || q.includes('webhook') || q.includes('providus') || q.includes('monnify') || q.includes('fund')) {
      navigate('admin-funding');
    } else if (q.includes('apart') || q.includes('flat') || q.includes('house') || q.includes('resident')) {
      navigate('admin-rentals-apartments');
    } else if (q.includes('office') || q.includes('showroom') || q.includes('commercial')) {
      navigate('admin-rentals-offices');
    } else if (q.includes('vetted') || q.includes('vip sup') || q.includes('factory')) {
      navigate('admin-suppliers');
    } else if (q.includes('kyc') || q.includes('compliance') || q.includes('nin') || q.includes('identity') || q.includes('passport') || q.includes('voter')) {
      navigate('admin-kyc-compliance');
    } else if (q.includes('bill') || q.includes('vtu') || q.includes('airtime') || q.includes('data bundle') || q.includes('disco') || q.includes('electricity') || q.includes('cable') || q.includes('dstv') || q.includes('gotv')) {
      navigate('admin-services-bills');
    } else if (q.includes('user') || q.includes('alade') || q.includes('client')) {
      navigate('admin-users');
    } else if (q.includes('iphone') || q.includes('order') || q.includes('tech')) {
      navigate('admin-shop');
    } else {
      navigate('admin-dashboard');
    }
    showToast(`Navigated command center for "${searchQuery}"`, 'info');
  };

  return (
    <AdminLayoutContext.Provider value={true}>
      {/* Enterprise Admin Color Palette System:
          Obsidian background: #0B0F19, #0B1220
          Dark slate surfaces: #131C31, #152238, #1B2A40
          Crisp structural slate borders: #22304A, #293A52, #374151
          Luminous banking emerald: #00F5D4, #10B981
          Professional logistic blue: #2563EB, #4778F5, #3867E8
      */}
      <div
        className="admin-enterprise-theme dark h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-white overflow-hidden"
        style={{
          // Color token bindings for high-contrast enterprise terminal styling
          ['--obsidian-bg' as any]: '#0B0F19',
          ['--slate-surface' as any]: '#131C31',
          ['--slate-border' as any]: '#22304A',
          ['--luminous-emerald' as any]: '#00F5D4',
          ['--logistic-blue' as any]: '#2563EB'
        }}
        data-testid="admin-enterprise-console"
      >
        {/* Top Enterprise Banking & Logistics Telemetry Ribbon */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-sm z-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-xs shadow-sm shadow-indigo-600/30">
                FM
              </div>
              <span className="font-extrabold tracking-wide text-white text-sm">
                FlyeMass Enterprise Command Tower
              </span>
            </div>

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>China ↔ Nigeria Trade Pipeline Active</span>
            </span>
          </div>

          {/* Live Logistics Rates & Client App Switcher */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Express Air:</span>
              <span className="text-emerald-400 font-bold">${badges.expressAirRate.toFixed(2)}/kg</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Normal Air:</span>
              <span className="text-slate-200 font-bold">${badges.normalAirRate.toFixed(2)}/kg</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Logistics FX:</span>
              <span className="text-indigo-400 font-bold">₦{badges.usdToNgn.toLocaleString()}/$ · ¥{badges.usdToCny.toFixed(2)}/$</span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== 'logistics' && (
                <button
                  onClick={() => navigate('admin-logistics')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                  title="Jump to Shipments & Cargo Pipeline (/admin/shipments)"
                >
                  <Truck className="w-4 h-4" />
                  <span>Shipments & Cargo</span>
                </button>
              )}
              <button
                onClick={() => window.open(getMobileAppUrl(), '_blank')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 hover:text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                title={`Open Client Mobile App in New Window (${getMobileAppUrl()})`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Open Client View</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Fixed Collapsible Sidebar */}
          <aside
            data-testid="admin-collapsible-sidebar"
            className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
              sidebarCollapsed ? 'w-16' : 'w-68'
            }`}
          >
            {/* Sidebar Header, Brand & Quick Filter */}
            <div className="flex flex-col min-h-0 flex-1">
              <div className="p-3.5 border-b border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <div>
                      <h2 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
                        Admin Navigation
                      </h2>
                      <p className="text-xs text-slate-300 font-medium">Global Management Suite</p>
                    </div>
                  )}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors mx-auto cursor-pointer"
                    title={sidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </div>

                {!sidebarCollapsed && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={sidebarFilter}
                      onChange={(e) => setSidebarFilter(e.target.value)}
                      placeholder="Filter modules..."
                      aria-label="Filter sidebar navigation"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Grouped Navigation Menu */}
              <nav
                aria-label="Admin Console Navigation"
                className="p-2.5 space-y-3.5 overflow-y-auto flex-1 no-scrollbar"
              >
                {(['core', 'treasury', 'commerce', 'governance'] as const).map((sectionKey) => {
                  const sectionItems = filteredNavItems.filter((i) => i.section === sectionKey);
                  if (sectionItems.length === 0) return null;

                  return (
                    <div key={sectionKey} className="space-y-1">
                      {!sidebarCollapsed && (
                        <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                          {sectionLabelMap[sectionKey]}
                        </div>
                      )}
                      {/* Standard section items */}
                      {sectionItems.filter((i) => !i.isDev).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigate(item.route)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25 border border-indigo-500'
                                : 'text-slate-200 hover:text-white hover:bg-slate-800/90 border border-transparent'
                            }`}
                            title={sidebarCollapsed ? `${item.label} (${item.path})` : item.path}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`w-4.5 h-4.5 shrink-0 transition-transform ${
                                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-105'
                                }`}
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </div>

                            {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold num-tabular ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor || 'bg-slate-800 text-slate-100 border border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Developer Mode & Advanced Diagnostics Collapsible Accordion (Super Admin Only) */}
                      {sectionItems.some((i) => i.isDev) && currentAdmin.role === 'super_admin' && (
                        sidebarCollapsed ? (
                          sectionItems.filter((i) => i.isDev).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => navigate(item.route)}
                                className={`w-full flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                                }`}
                                title={`[Developer Diagnostics] ${item.label}`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })
                        ) : (
                          <div className="pt-2 mt-2 border-t border-slate-800" data-testid="dev-mode-accordion-wrapper">
                            <button
                              type="button"
                              onClick={() => setDevModeAccordionOpen((prev) => !prev)}
                              data-testid="dev-mode-accordion-toggle"
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-400 hover:text-indigo-400 hover:bg-slate-800/70 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Terminal className="w-3.5 h-3.5 text-amber-400 group-hover:text-indigo-400 transition-colors" />
                                <span className="uppercase tracking-wider">Developer Diagnostics</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-[9px] border border-amber-500/30 font-bold">
                                  SUPER
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${devModeAccordionOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'}`} />
                              </div>
                            </button>

                            {devModeAccordionOpen && (
                              <div className="space-y-1 pl-2 mt-1 border-l-2 border-indigo-500/40 animate-in fade-in duration-150">
                                {sectionItems.filter((i) => i.isDev).map((item) => {
                                  const Icon = item.icon;
                                  const isActive = activeTab === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => navigate(item.route)}
                                      data-testid={`nav-item-${item.id}`}
                                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                                        isActive
                                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                                          : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                                      }`}
                                      title={item.path}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Icon
                                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                                          }`}
                                        />
                                        <span className="truncate">{item.label}</span>
                                      </div>
                                      <span className="text-[9px] font-mono text-emerald-400 font-bold">RAW</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Current Admin Session Profile Footer */}
            <div className="p-3 border-t border-slate-800 relative shrink-0">
              <div
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-all ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <img
                  src={currentAdmin.avatar}
                  alt={currentAdmin.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-indigo-500/50 shrink-0"
                />
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold text-white truncate">{currentAdmin.name}</p>
                    <p className="text-[11px] text-indigo-400 font-semibold truncate">
                      {currentAdmin.roleTitle.split(' ')[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Role Switcher Menu Popup */}
              {showRoleSwitcher && !sidebarCollapsed && (
                <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
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
                            ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold text-white">{adm.name}</p>
                          <p className="text-[11px] text-slate-400">{adm.roleTitle}</p>
                        </div>
                        {currentAdmin.uid === adm.uid && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Fluid Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
            {/* Sticky Top Global Command Header, Breadcrumb Trail & 1-Click Core Workflow Bar */}
            <header
              data-testid="admin-sticky-header"
              className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-2.5 space-y-2 shrink-0 shadow-sm"
            >
              {/* Top Row: Breadcrumb Navigation, Keyboard-Friendly Command Search & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Interactive Breadcrumb Trail */}
                <div
                  className="flex items-center gap-2 text-sm min-w-0"
                  data-testid="admin-breadcrumb-header"
                >
                  <button
                    type="button"
                    onClick={() => navigate('admin-dashboard')}
                    className="font-bold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Enterprise Console
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-300 font-medium hidden sm:inline whitespace-nowrap">
                    {sectionLabelMap[activeNavItem.section]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:inline shrink-0" />
                  <span className="font-extrabold text-white truncate">{activeNavItem.label}</span>
                  <span className="hidden md:inline-block px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-400 font-semibold">
                    {activeNavItem.path}
                  </span>
                </div>

                {/* Date & Time Indicator */}
                <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>{currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-slate-600">|</span>
                  <span className="font-bold text-white">{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className="text-xs text-indigo-400 font-bold">WAT</span>
                </div>

                {/* System Status Indicator */}
                <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>99.98% SLA Nominal</span>
                </div>

                {/* Keyboard-Friendly Global Command Search + Notifications + Quick Actions + Sign Out */}
                <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-end">
                  <form onSubmit={handleGlobalSearch} className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Quick jump or search (⌘K or /): shipments, RFQs, tickets, hubs, rates..."
                      aria-label="Global Command Search"
                      className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-400 outline-none transition-all"
                    />
                    <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                      ⌘K
                    </kbd>
                  </form>

                  {/* Quick Actions Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-100 hover:text-white transition-all cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <span className="hidden sm:inline">Actions</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showQuickActions && (
                      <div className="absolute right-0 top-11 w-52 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Operational Shortcuts
                        </div>
                        <button
                          onClick={() => { navigate('admin-logistics'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Issue New Waybill</span>
                        </button>
                        <button
                          onClick={() => { navigate('admin-fx-rates'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Publish FX Rates</span>
                        </button>
                        <button
                          onClick={() => { navigate('admin-rmb-transfers'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Disburse RMB Payout</span>
                        </button>
                        <button
                          onClick={() => { navigate('admin-support'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Review Support Desk</span>
                        </button>
                        <button
                          onClick={() => { navigate('admin-kyc-compliance'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review Pending KYC</span>
                        </button>
                        <button
                          onClick={() => { navigate('admin-services-bills'); setShowQuickActions(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Bills & VTU Control</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      aria-label="Toggle system notifications"
                      className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all relative cursor-pointer"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 top-11 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                          <span className="font-bold text-white">System Alerts</span>
                          <span className="text-[10px] text-indigo-400 font-semibold">Real-time</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="font-bold text-amber-400 text-xs">Pending Supplier Review</p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            ¥45,000 Foxconn transfer awaiting clearance confirmation.
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="font-bold text-emerald-400 text-xs">Flight ET921 Approaching Lagos</p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Air cargo waybill FM-CAN-LOS-89241 touching down MM2.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Header Staff Profile Pill */}
                  <div
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                    title={`Logged in as ${currentAdmin.name} (${currentAdmin.roleTitle})`}
                  >
                    <img
                      src={currentAdmin.avatar}
                      alt={currentAdmin.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/50"
                    />
                    <div className="text-left text-xs leading-tight">
                      <p className="font-bold text-white truncate max-w-[120px]">{currentAdmin.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{currentAdmin.role.slice(0, 10)}</p>
                    </div>
                  </div>

                  {/* Admin Sign Out */}
                  <button
                    onClick={logoutAdmin}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 text-xs text-slate-200 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                    title="Sign out of Admin Session"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row: Frictionless 1-Click Core Operational Workflows Bar */}
              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800"
                data-testid="admin-core-workflow-bar"
              >
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mr-1 shrink-0">
                  Core Workflows:
                </span>
                {coreWorkflowItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-600 text-white font-extrabold border-indigo-500 shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-950 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.shortLabel || item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </header>

            {/* Main Scrollable Workspace */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-slate-950">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
};
