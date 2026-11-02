import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from './BottomNav';
import { QuickActionSheet } from '../ui/QuickActionSheet';
import { Toast } from '../ui/Toast';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Moon, 
  Sun, 
  Smartphone, 
  RotateCcw,
  Compass,
  Globe,
  Layers
} from 'lucide-react';
import { ScreenRoute } from '../../types';

// Section 1: Auth & Security
import { WelcomeScreen } from '../../screens/auth/WelcomeScreen';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { SignupScreen } from '../../screens/auth/SignupScreen';
import { ResetPasswordScreen } from '../../screens/auth/ResetPasswordScreen';
import { VerifyEmailScreen } from '../../screens/auth/VerifyEmailScreen';
import { SetupPinScreen } from '../../screens/auth/SetupPinScreen';
import { SwitchDeviceScreen } from '../../screens/auth/SwitchDeviceScreen';

// Section 2: Core Hub & Dashboard
import { HomeScreen } from '../../screens/home/HomeScreen';
import { HistoryScreen } from '../../screens/home/HistoryScreen';
import { NotificationsScreen } from '../../screens/home/NotificationsScreen';

// Section 3: Banking & Money Flows
import { WalletsScreen } from '../../screens/wallets/WalletsScreen';
import { FundWalletScreen } from '../../screens/wallets/FundWalletScreen';
import { PaySupplierScreen } from '../../screens/wallets/PaySupplierScreen';
import { ExchangeScreen } from '../../screens/wallets/ExchangeScreen';
import { WithdrawScreen } from '../../screens/wallets/WithdrawScreen';

// Section 4: Logistics & Cargo Tracking
import { LogisticsScreen } from '../../screens/logistics/LogisticsScreen';
import { TrackShipmentScreen } from '../../screens/logistics/TrackShipmentScreen';
import { RegisterPackageScreen } from '../../screens/logistics/RegisterPackageScreen';

// Section 5: Apple & Tech Gadget Shop
import { ShopScreen } from '../../screens/shop/ShopScreen';
import { ProductDetailScreen } from '../../screens/shop/ProductDetailScreen';
import { CartScreen } from '../../screens/shop/CartScreen';
import { CheckoutScreen } from '../../screens/shop/CheckoutScreen';
import { ShopSavedScreen } from '../../screens/shop/ShopSavedScreen';
import { ShopCompareScreen } from '../../screens/shop/ShopCompareScreen';
import { ShopOrdersScreen } from '../../screens/shop/ShopOrdersScreen';
import { ShopOrderDetailScreen } from '../../screens/shop/ShopOrderDetailScreen';

// Section 6: Trade Sourcing & Agent Services
import { SuppliersScreen } from '../../screens/suppliers/SuppliersScreen';
import { AgentServiceScreen } from '../../screens/suppliers/AgentServiceScreen';
import { ProcureScreen } from '../../screens/suppliers/ProcureScreen';

// Section 7: China Business Hotels
import { HotelsScreen } from '../../screens/hotels/HotelsScreen';
import { HotelDetailScreen } from '../../screens/hotels/HotelDetailScreen';
import { HotelBookingsScreen } from '../../screens/hotels/HotelBookingsScreen';

// Section 8: Profile, Security & Support
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import { SecurityScreen } from '../../screens/profile/SecurityScreen';
import { SupportScreen } from '../../screens/profile/SupportScreen';
import { SupportChatScreen } from '../../screens/profile/SupportChatScreen';
import { SupportTicketsScreen } from '../../screens/profile/SupportTicketsScreen';
import { TermsScreen, PrivacyScreen, DeleteAccountScreen } from '../../screens/profile/LegalScreens';

// Backend Database & Schema Inspector
import { DatabaseViewerScreen } from '../../screens/admin/DatabaseViewerScreen';
import { Database, LayoutDashboard } from 'lucide-react';

// Web Admin Dashboard Modules
import { AdminLoginScreen } from '../../screens/admin/AdminLoginScreen';
import { AdminDashboardScreen } from '../../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../../screens/admin/AdminUsersScreen';
import { AdminLogisticsScreen } from '../../screens/admin/AdminLogisticsScreen';
import { AdminPaymentsScreen } from '../../screens/admin/AdminPaymentsScreen';
import { AdminShopScreen } from '../../screens/admin/AdminShopScreen';
import { AdminHotelsScreen } from '../../screens/admin/AdminHotelsScreen';
import { AdminAgentsScreen } from '../../screens/admin/AdminAgentsScreen';
import { AdminSupportScreen } from '../../screens/admin/AdminSupportScreen';
import { AdminTeamScreen } from '../../screens/admin/AdminTeamScreen';
import { DevEnvironmentSwitcher } from '../dev/DevEnvironmentSwitcher';

export const MobileShell: React.FC = () => {
  const { 
    currentRoute, 
    navigate, 
    isFrameMockup, 
    toggleFrameMockup, 
    themeMode, 
    toggleTheme,
    showToast 
  } = useApp();

  const [currentTime] = useState('09:41');

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      // 1. Auth & Security
      case 'welcome': return <WelcomeScreen />;
      case 'login': return <LoginScreen />;
      case 'signup': return <SignupScreen />;
      case 'reset-password': return <ResetPasswordScreen />;
      case 'verify-email': return <VerifyEmailScreen />;
      case 'setup-pin': return <SetupPinScreen />;
      case 'switch-device': return <SwitchDeviceScreen />;

      // 2. Core App Hub & Dashboard
      case 'home': return <HomeScreen />;
      case 'history': return <HistoryScreen />;
      case 'notifications': return <NotificationsScreen />;

      // 3. Banking & Money Flows
      case 'wallets': return <WalletsScreen />;
      case 'fund': return <FundWalletScreen />;
      case 'pay': return <PaySupplierScreen />;
      case 'exchange': return <ExchangeScreen />;
      case 'withdraw': return <WithdrawScreen />;

      // 4. Logistics & Cargo Tracking
      case 'logistics': return <LogisticsScreen />;
      case 'track': return <TrackShipmentScreen />;
      case 'register-package': return <RegisterPackageScreen />;

      // 5. Apple & Tech Gadget Shop
      case 'shop': return <ShopScreen />;
      case 'product-detail': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <CheckoutScreen />;
      case 'shop-saved': return <ShopSavedScreen />;
      case 'shop-compare': return <ShopCompareScreen />;
      case 'shop-orders': return <ShopOrdersScreen />;
      case 'shop-order-detail': return <ShopOrderDetailScreen />;

      // 6. Trade Sourcing & Agent Services
      case 'suppliers': return <SuppliersScreen />;
      case 'agent': return <AgentServiceScreen />;
      case 'procure': return <ProcureScreen />;

      // 7. China Business Hotels
      case 'hotels': return <HotelsScreen />;
      case 'hotel-detail': return <HotelDetailScreen />;
      case 'hotel-bookings': return <HotelBookingsScreen />;

      // 8. Profile, Security & Support
      case 'profile': return <ProfileScreen />;
      case 'security': return <SecurityScreen />;
      case 'support': return <SupportScreen />;
      case 'support-chat': return <SupportChatScreen />;
      case 'support-tickets': return <SupportTicketsScreen initialView="list" />;
      case 'support-ticket-detail': return <SupportTicketsScreen initialView="detail" />;
      case 'support-new-ticket': return <SupportTicketsScreen initialView="new" />;
      case 'terms': return <TermsScreen />;
      case 'privacy': return <PrivacyScreen />;
      case 'delete-account': return <DeleteAccountScreen />;

      // 9. Backend Database & Schema Inspector
      case 'schema-inspector': return <DatabaseViewerScreen />;

      // 10. Web Admin Dashboard Modules
      case 'admin-login': return <AdminLoginScreen />;
      case 'admin-dashboard': return <AdminDashboardScreen />;
      case 'admin-users':
      case 'admin-user-detail': return <AdminUsersScreen />;
      case 'admin-logistics':
      case 'admin-logistics-detail': return <AdminLogisticsScreen />;
      case 'admin-payments': return <AdminPaymentsScreen />;
      case 'admin-shop': return <AdminShopScreen />;
      case 'admin-hotels': return <AdminHotelsScreen />;
      case 'admin-agents': return <AdminAgentsScreen />;
      case 'admin-support': return <AdminSupportScreen />;
      case 'admin-team': return <AdminTeamScreen />;

      default: return <HomeScreen />;
    }
  };

  const allRoutes: { label: string; route: ScreenRoute; group: string }[] = [
    // 1. Auth & Security
    { label: '/index (Welcome Splash)', route: 'welcome', group: '1. Auth & Security' },
    { label: '/login (Biometric & Creds)', route: 'login', group: '1. Auth & Security' },
    { label: '/signup (2-Step CAC Onboarding)', route: 'signup', group: '1. Auth & Security' },
    { label: '/reset-password (Recovery Link)', route: 'reset-password', group: '1. Auth & Security' },
    { label: '/verify-email (6-Digit OTP Code)', route: 'verify-email', group: '1. Auth & Security' },
    { label: '/setup-pin (4-Digit Security Key)', route: 'setup-pin', group: '1. Auth & Security' },
    { label: '/switch-device (Hardware Migration)', route: 'switch-device', group: '1. Auth & Security' },

    // 2. Core App Hub & Dashboard
    { label: '/home (Enterprise Trade Hub)', route: 'home', group: '2. Core Hub & Dashboard' },
    { label: '/wallets (Multi-Currency Balances)', route: 'wallets', group: '2. Core Hub & Dashboard' },
    { label: '/history (Searchable Ledger)', route: 'history', group: '2. Core Hub & Dashboard' },
    { label: '/notifications (Live Trade Alerts)', route: 'notifications', group: '2. Core Hub & Dashboard' },

    // 3. Banking & Money Flows
    { label: '/fund (Providus, Squad, Korapay)', route: 'fund', group: '3. Banking & Money' },
    { label: '/pay (Alipay, WeChat, Bank)', route: 'pay', group: '3. Banking & Money' },
    { label: '/withdraw (Nigerian NUBAN Payout)', route: 'withdraw', group: '3. Banking & Money' },
    { label: '/exchange (Real-Time FX Swap)', route: 'exchange', group: '3. Banking & Money' },

    // 4. Logistics & Cargo Tracking
    { label: '/logistics (Guangzhou & Yiwu Hubs)', route: 'logistics', group: '4. Logistics & Cargo' },
    { label: '/register-package (Declare Tracking)', route: 'register-package', group: '4. Logistics & Cargo' },
    { label: '/track (4-Step Timeline & Waypoints)', route: 'track', group: '4. Logistics & Cargo' },

    // 5. Apple & Tech Gadget Shop
    { label: '/shop (Hong Kong Hardware)', route: 'shop', group: '5. Apple & Tech Shop' },
    { label: '/shop/product/$id (Specs & Tiers)', route: 'product-detail', group: '5. Apple & Tech Shop' },
    { label: '/shop/cart (Shopping Basket)', route: 'cart', group: '5. Apple & Tech Shop' },
    { label: '/shop/checkout (Multi-Wallet Debit)', route: 'checkout', group: '5. Apple & Tech Shop' },
    { label: '/shop/saved (Wishlist)', route: 'shop-saved', group: '5. Apple & Tech Shop' },
    { label: '/shop/compare (Side-by-Side Matrix)', route: 'shop-compare', group: '5. Apple & Tech Shop' },
    { label: '/shop/orders (Purchase History)', route: 'shop-orders', group: '5. Apple & Tech Shop' },
    { label: '/shop/orders/$id (Consignment Tracker)', route: 'shop-order-detail', group: '5. Apple & Tech Shop' },

    // 6. Trade Sourcing & Agent Services
    { label: '/suppliers (Vetted China Directory)', route: 'suppliers', group: '6. Trade Sourcing' },
    { label: '/agent (Ground Inspection & Canton)', route: 'agent', group: '6. Trade Sourcing' },
    { label: '/procure (Direct Quotation RFQ)', route: 'procure', group: '6. Trade Sourcing' },

    // 7. China Business Hotels
    { label: '/hotels (Guangzhou, Shenzhen, Yiwu)', route: 'hotels', group: '7. Business Hotels' },
    { label: '/hotels/$id (Hotel Details & Chinese Card)', route: 'hotel-detail', group: '7. Business Hotels' },
    { label: '/hotels/bookings (Check-in Vouchers)', route: 'hotel-bookings', group: '7. Business Hotels' },

    // 8. Profile, Security & Support
    { label: '/profile (CAC Tier 3 Credentials)', route: 'profile', group: '8. Profile & Security' },
    { label: '/security (PIN & Trusted Sessions)', route: 'security', group: '8. Profile & Security' },
    { label: '/support (Help Center & FAQ)', route: 'support', group: '8. Profile & Security' },
    { label: '/support/chat (24/7 Trade Desk)', route: 'support-chat', group: '8. Profile & Security' },
    { label: '/support/tickets (Ticket Management)', route: 'support-tickets', group: '8. Profile & Security' },
    { label: '/support/new (Open Support Ticket)', route: 'support-new-ticket', group: '8. Profile & Security' },
    { label: '/terms (Cross-Border Agreement)', route: 'terms', group: '8. Profile & Security' },
    { label: '/privacy (NDPR & Data Protection)', route: 'privacy', group: '8. Profile & Security' },
    { label: '/delete-account (Data Purge Flow)', route: 'delete-account', group: '8. Profile & Security' },

    // 9. Backend Database & Schema
    { label: '/admin/db (Backend Schema Inspector)', route: 'schema-inspector', group: '9. Backend Architecture' },

    // 10. Web Admin Command Center
    { label: '/admin/dashboard (Executive Command Center)', route: 'admin-dashboard', group: '10. Enterprise Admin' },
    { label: '/admin/users (User Directory & Balances)', route: 'admin-users', group: '10. Enterprise Admin' },
    { label: '/admin/logistics (Cargo Control Tower)', route: 'admin-logistics', group: '10. Enterprise Admin' },
    { label: '/admin/payments (Supplier Payout Desk)', route: 'admin-payments', group: '10. Enterprise Admin' },
    { label: '/admin/shop (Tech Gadget Inventory)', route: 'admin-shop', group: '10. Enterprise Admin' },
    { label: '/admin/hotels (Hotel Operations Desk)', route: 'admin-hotels', group: '10. Enterprise Admin' },
    { label: '/admin/agents (Factory Inspection Desk)', route: 'admin-agents', group: '10. Enterprise Admin' },
    { label: '/admin/support (Live Support & Chat)', route: 'admin-support', group: '10. Enterprise Admin' },
    { label: '/admin/team (Personnel & RBAC)', route: 'admin-team', group: '10. Enterprise Admin' },
    { label: '/admin/login (Admin Sign-In)', route: 'admin-login', group: '10. Enterprise Admin' }
  ];

  const handleResetData = () => {
    localStorage.removeItem('flyemass_wallets');
    showToast('App state refreshed to default balances', 'info');
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col items-center justify-start text-slate-100 ${themeMode === 'light' ? 'light-mode' : ''}`}>
      {/* Top Reviewer Bar / Route Switcher */}
      <div className="w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-2.5 z-50 flex items-center justify-between text-xs gap-3">
        {/* Brand */}
        <div 
          onClick={() => navigate('home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center font-extrabold text-slate-950 text-xs shadow-sm shadow-emerald-500/50">
            FM
          </div>
          <span className="font-extrabold text-white hidden sm:inline tracking-tight">FlyeMass Mobile</span>
        </div>

        {/* Screen Quick Jump Selector */}
        <div className="flex items-center gap-2 max-w-xs sm:max-w-md w-full">
          <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
          <select
            value={currentRoute}
            onChange={(e) => navigate(e.target.value as ScreenRoute)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-semibold outline-none hover:border-emerald-500 cursor-pointer"
          >
            {allRoutes.map((r) => (
              <option key={r.route} value={r.route} className="bg-slate-900 text-white">
                [{r.group}] {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Device Frame & Refresh Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.open('http://localhost:5173', '_blank')}
            className="p-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 hover:from-indigo-500/30 hover:to-cyan-500/30 border border-indigo-500/40 text-indigo-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-500/10 active:scale-95"
            title="Open Web Admin Dashboard (http://localhost:5173)"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline font-extrabold">🛡️ Admin (http://localhost:5173)</span>
          </button>

          <button
            onClick={() => navigate('schema-inspector')}
            className={`p-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              currentRoute === 'schema-inspector'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Inspect NoSQL Database Schema"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline font-bold">DB Schema</span>
          </button>

          <button
            onClick={toggleFrameMockup}
            className={`p-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              isFrameMockup
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle iPhone 16 Pro Frame"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Bezel</span>
          </button>

          <button
            onClick={handleResetData}
            className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
            title="Reset to Initial Balances"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`w-full flex-1 flex items-center justify-center p-0 ${isFrameMockup ? 'sm:py-6 sm:px-4' : ''}`}>
        <div
          className={`w-full transition-all duration-300 relative flex flex-col ${
            isFrameMockup
              ? 'max-w-[400px] h-[852px] bg-slate-950 rounded-[50px] ring-[10px] ring-slate-850 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.15)] overflow-hidden border border-slate-750'
              : 'max-w-md min-h-screen bg-slate-950 shadow-2xl'
          }`}
        >
          {/* iOS Status Bar & Dynamic Island (when frame mockup enabled) */}
          <div className="sticky top-0 z-40 bg-slate-950 pt-3 pb-2 px-6 flex items-center justify-between select-none">
            {/* Left: Clock */}
            <span className="text-xs font-semibold text-white num-tabular tracking-tight">
              {currentTime}
            </span>

            {/* Dynamic Island Notch */}
            {isFrameMockup && (
              <div className="w-24 h-6 rounded-full bg-black border border-slate-800/60 flex items-center justify-between px-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
            )}

            {/* Right: Icons (Signal, Wifi, Battery) */}
            <div className="flex items-center gap-1.5 text-white">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono font-bold">98%</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Active Screen View */}
          <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            {renderCurrentScreen()}
          </main>

          {/* Bottom Tab Bar */}
          <BottomNav />

          {/* iOS Home Indicator Bar */}
          {isFrameMockup && (
            <div className="w-full bg-slate-950 py-1.5 flex justify-center shrink-0">
              <div className="w-32 h-1 rounded-full bg-slate-600/70" />
            </div>
          )}

          {/* Global Modals & Toasts */}
          <QuickActionSheet />
          <Toast />
        </div>
      </div>
    </div>
  );
};
