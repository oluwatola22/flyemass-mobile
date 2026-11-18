import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { HeaderContext } from './HeaderContext';
import { ScreenErrorBoundary } from '../ui/ScreenErrorBoundary';
import { QuickActionSheet } from '../ui/QuickActionSheet';
import { CurrencySwapModal } from '../wallet/CurrencySwapModal';
import { FundWalletModal } from '../wallet/FundWalletModal';
import { Toast } from '../ui/Toast';
import { 
  Wifi, 
  WifiOff,
  Battery, 
  Signal, 
  Moon, 
  Sun, 
  Smartphone, 
  RotateCcw,
  Compass,
  Globe,
  Layers,
  Building
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
import { CacRegistrationScreen } from '../../screens/services/CacRegistrationScreen';

// Section 7: China Business Hotels & Realty
import { HotelsScreen } from '../../screens/hotels/HotelsScreen';
import { HotelDetailScreen } from '../../screens/hotels/HotelDetailScreen';
import { HotelBookingsScreen } from '../../screens/hotels/HotelBookingsScreen';
import { ApartmentsScreen } from '../../screens/rentals/ApartmentsScreen';
import { OfficeRentalsScreen } from '../../screens/rentals/OfficeRentalsScreen';

// Section 8: Profile, Security & Support
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import { SecurityScreen } from '../../screens/profile/SecurityScreen';
import { SupportScreen } from '../../screens/profile/SupportScreen';
import { SupportChatScreen } from '../../screens/profile/SupportChatScreen';
import { SupportTicketsScreen } from '../../screens/profile/SupportTicketsScreen';
import { TermsScreen, PrivacyScreen, DeleteAccountScreen } from '../../screens/profile/LegalScreens';

const MobileSuppliersFallback: React.FC = () => {
  const { navigate, showToast } = useApp();
  useEffect(() => {
    showToast('Verified Suppliers directory is currently managed via Enterprise Admin console', 'info');
    navigate('home');
  }, [navigate, showToast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <Building className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white">Exclusive Admin Feature</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        The Verified Suppliers directory is currently managed exclusively via the Enterprise Admin console.
      </p>
      <button
        onClick={() => navigate('home')}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
      >
        Back to Trade Hub
      </button>
    </div>
  );
};

const PRIMARY_TABS: ScreenRoute[] = ['home', 'wallets', 'logistics', 'shop', 'profile'];
const PREWARMED_ROUTES: ScreenRoute[] = [
  'home',
  'wallets',
  'logistics',
  'shop',
  'profile'
];
const AUTH_ROUTES: ScreenRoute[] = [
  'welcome',
  'login',
  'signup',
  'reset-password',
  'verify-email',
  'setup-pin',
  'switch-device'
];

export const MobileShell: React.FC = () => {
  const { 
    currentRoute, 
    routeParam,
    navigate, 
    isFrameMockup, 
    toggleFrameMockup, 
    themeMode, 
    toggleTheme,
    showToast 
  } = useApp();

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Aggressive instant route cache & keep-alive registry (visitedTabs tracking)
  const [cachedRoutes, setCachedRoutes] = useState<Set<ScreenRoute>>(() => {
    const set = new Set<ScreenRoute>(PREWARMED_ROUTES);
    if (!AUTH_ROUTES.includes(currentRoute)) {
      set.add(currentRoute);
    }
    return set;
  });
  const visitedTabs = cachedRoutes;

  // Ensure active screen is synchronously present in the render set without a 1-tick delay
  const activeCachedRoutes = React.useMemo(() => {
    const set = new Set(cachedRoutes);
    if (!PRIMARY_TABS.includes(currentRoute) && !AUTH_ROUTES.includes(currentRoute)) {
      set.add(currentRoute);
    }
    return Array.from(set);
  }, [cachedRoutes, currentRoute]);

  const mainScrollRef = React.useRef<HTMLElement>(null);
  const scrollPositions = React.useRef<Record<string, number>>({});
  const isSwitchingRouteRef = React.useRef(false);

  // Aggressive instant scroll reset on route change: enforce load from top
  React.useLayoutEffect(() => {
    isSwitchingRouteRef.current = true;
    const resetScrollToTop = () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        try {
          if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
          }
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const scrollables = document.querySelectorAll('main, .momentum-scroll, [data-scroll-container]');
          scrollables.forEach((el) => { el.scrollTop = 0; });
        } catch (_) {}
      }
    };

    resetScrollToTop();

    // Reset again on animation frames and microtasks to handle delayed rendering or image layouts
    const rAF1 = requestAnimationFrame(() => {
      resetScrollToTop();
      const rAF2 = requestAnimationFrame(() => {
        resetScrollToTop();
        isSwitchingRouteRef.current = false;
      });
      return () => cancelAnimationFrame(rAF2);
    });

    const t0 = setTimeout(resetScrollToTop, 0);
    const t30 = setTimeout(resetScrollToTop, 30);
    const t80 = setTimeout(resetScrollToTop, 80);
    const t200 = setTimeout(resetScrollToTop, 200);

    return () => {
      cancelAnimationFrame(rAF1);
      clearTimeout(t0);
      clearTimeout(t30);
      clearTimeout(t80);
      clearTimeout(t200);
    };
  }, [currentRoute, routeParam]);

  useEffect(() => {
    if (!AUTH_ROUTES.includes(currentRoute)) {
      setCachedRoutes((prev) => {
        if (prev.has(currentRoute)) return prev;
        const next = new Set(prev);
        next.add(currentRoute);
        return next;
      });
    }

    // Whenever user clicks on any page, let the page load from the top immediately
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [currentRoute]);

  // Listen for route prefetch events from touch/pointer down triggers
  useEffect(() => {
    const handlePrefetch = (e: Event) => {
      const customEvent = e as CustomEvent<{ route: ScreenRoute }>;
      if (customEvent.detail && customEvent.detail.route) {
        const r = customEvent.detail.route;
        if (!AUTH_ROUTES.includes(r)) {
          setCachedRoutes((prev) => {
            if (prev.has(r)) return prev;
            const next = new Set(prev);
            next.add(r);
            return next;
          });
        }
      }
    };
    window.addEventListener('flyemass:prefetch-route', handlePrefetch);
    return () => window.removeEventListener('flyemass:prefetch-route', handlePrefetch);
  }, []);

  // Listen for global navigate-home events from error boundaries
  useEffect(() => {
    const onNavHome = () => navigate('home');
    window.addEventListener('flyemass:navigate-home', onNavHome);
    return () => window.removeEventListener('flyemass:navigate-home', onNavHome);
  }, [navigate]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (isSwitchingRouteRef.current) {
      e.currentTarget.scrollTop = 0;
      return;
    }
    scrollPositions.current[currentRoute] = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network online. Synchronized with FlyeMass backend.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network offline. Working with local cached ledger.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [showToast]);

  const renderScreenByRoute = (route: ScreenRoute) => {
    switch (route) {
      // 1. Auth & Security
      case 'welcome': return <WelcomeScreen />;
      case 'login': return <LoginScreen />;
      case 'signup': return <SignupScreen />;
      case 'reset-password': return <ResetPasswordScreen />;
      case 'verify-email': return <VerifyEmailScreen />;
      case 'setup-pin': return <SetupPinScreen />;
      case 'switch-device': return <SwitchDeviceScreen />;

      // 2. Core App Hub & Dashboard
      case 'history': return <HistoryScreen />;
      case 'notifications': return <NotificationsScreen />;

      // 3. Banking & Money Flows
      case 'fund': return <FundWalletScreen />;
      case 'pay': return <PaySupplierScreen />;
      case 'exchange': return <ExchangeScreen />;
      case 'withdraw': return <WithdrawScreen />;

      // 4. Logistics & Cargo Tracking
      case 'track': return <TrackShipmentScreen />;
      case 'register-package': return <RegisterPackageScreen />;

      // 5. Apple & Tech Gadget Shop
      case 'product-detail': return <ProductDetailScreen />;
      case 'cart': return <CartScreen />;
      case 'checkout': return <CheckoutScreen />;
      case 'shop-saved': return <ShopSavedScreen />;
      case 'shop-compare': return <ShopCompareScreen />;
      case 'shop-orders': return <ShopOrdersScreen />;
      case 'shop-order-detail': return <ShopOrderDetailScreen />;

      // 6. Trade Sourcing & Agent Services
      case 'suppliers': return <MobileSuppliersFallback />;
      case 'agent': return <AgentServiceScreen />;
      case 'procure': return <ProcureScreen />;
      case 'cac-registration': return <CacRegistrationScreen />;

      // 7. China Business Hotels & Realty
      case 'hotels': return <HotelsScreen />;
      case 'hotel-detail': return <HotelDetailScreen />;
      case 'hotel-bookings': return <HotelBookingsScreen />;
      case 'rentals-apartments': return <ApartmentsScreen />;
      case 'rentals-offices': return <OfficeRentalsScreen />;

      // 8. Profile, Security & Support
      case 'security': return <SecurityScreen />;
      case 'support': return <SupportScreen />;
      case 'support-chat': return <SupportChatScreen />;
      case 'support-tickets': return <SupportTicketsScreen initialView="list" />;
      case 'support-ticket-detail': return <SupportTicketsScreen initialView="detail" />;
      case 'support-new-ticket': return <SupportTicketsScreen initialView="new" />;
      case 'terms': return <TermsScreen />;
      case 'privacy': return <PrivacyScreen />;
      case 'delete-account': return <DeleteAccountScreen />;

      default: return null;
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
    { label: '/agent (Ground Inspection & Canton)', route: 'agent', group: '6. Trade Sourcing' },
    { label: '/procure (Direct Quotation RFQ)', route: 'procure', group: '6. Trade Sourcing' },

    // 7. China Business Hotels & Realty
    { label: '/hotels (Guangzhou, Shenzhen, Yiwu)', route: 'hotels', group: '7. Business Hotels' },
    { label: '/hotels/$id (Hotel Details & Chinese Card)', route: 'hotel-detail', group: '7. Business Hotels' },
    { label: '/hotels/bookings (Check-in Vouchers)', route: 'hotel-bookings', group: '7. Business Hotels' },
    { label: '/rentals-apartments (Tianhe, Yuexiu Housing)', route: 'rentals-apartments', group: '7. Business Hotels' },
    { label: '/rentals-offices (Commercial Office Leases)', route: 'rentals-offices', group: '7. Business Hotels' },

    // 8. Profile, Security & Support
    { label: '/profile (Corporate Credentials)', route: 'profile', group: '8. Profile & Security' },
    { label: '/security (PIN & Trusted Sessions)', route: 'security', group: '8. Profile & Security' },
    { label: '/support (Help Center & FAQ)', route: 'support', group: '8. Profile & Security' },
    { label: '/support/chat (24/7 Trade Desk)', route: 'support-chat', group: '8. Profile & Security' },
    { label: '/support/tickets (Ticket Management)', route: 'support-tickets', group: '8. Profile & Security' },
    { label: '/support/new (Open Support Ticket)', route: 'support-new-ticket', group: '8. Profile & Security' },
    { label: '/terms (Cross-Border Agreement)', route: 'terms', group: '8. Profile & Security' },
    { label: '/privacy (NDPR & Data Protection)', route: 'privacy', group: '8. Profile & Security' },
    { label: '/delete-account (Data Purge Flow)', route: 'delete-account', group: '8. Profile & Security' }
  ];

  const handleResetData = () => {
    localStorage.removeItem('flyemass_wallets');
    showToast('App state refreshed to default balances', 'info');
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className={`w-full h-full h-screen h-dvh fixed inset-0 flex flex-col items-center justify-start bg-slate-950 text-slate-100 overflow-hidden select-none ${themeMode === 'light' ? 'light-mode' : ''}`}>
      {/* Top Reviewer Bar / Route Switcher (Visible on desktop/tablet for dev testing) */}
      <div className="hidden sm:flex w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-2.5 z-50 items-center justify-between text-xs gap-3 shrink-0">
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
      <div className={`w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden p-0 ${isFrameMockup ? 'sm:py-6 sm:px-4' : ''}`}>
        <div
          className={`w-full h-full relative flex flex-col ${
            isFrameMockup
              ? 'max-w-[400px] max-h-[852px] sm:h-[min(852px,calc(100vh-80px))] bg-slate-950 sm:rounded-[44px] sm:ring-[8px] sm:ring-slate-800 shadow-2xl overflow-hidden sm:border sm:border-slate-700'
              : 'max-w-md w-full h-full bg-slate-950 shadow-2xl overflow-hidden'
          }`}
        >
          {/* iOS Status Bar & Dynamic Island (only when frame mockup bezel is enabled) */}
          {isFrameMockup && (
            <div className="sticky top-0 z-40 bg-slate-950 pt-3 pb-2 px-6 flex items-center justify-between select-none shrink-0">
              {/* Left: Clock */}
              <span className="text-xs font-semibold text-white num-tabular tracking-tight">
                {currentTime}
              </span>

              {/* Dynamic Island Notch */}
              <div className="w-24 h-6 rounded-full bg-black border border-slate-800/60 flex items-center justify-between px-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>

              {/* Right: Icons (Signal, Wifi, Battery) */}
              <div className="flex items-center gap-1.5 text-white">
                <Signal className="w-3.5 h-3.5" />
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-mono font-bold">98%</span>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          )}

          {/* Network Offline Status Banner */}
          {!isOnline && (
            <div className="bg-amber-500/20 border-b border-amber-500/40 px-3 py-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-300 animate-pulse shrink-0">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Offline Mode — Changes queued locally</span>
            </div>
          )}

          {/* Hoisted Top Sticky Header — Permanently fixed outside of the scrolling main view */}
          {!AUTH_ROUTES.includes(currentRoute) && (
            <div className="w-full shrink-0 z-40">
              <Header />
            </div>
          )}

          {/* Active Screen View with Instant Route Cache & Keep-Alive */}
          <main 
            ref={mainScrollRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col min-h-0 momentum-scroll w-full will-change-scroll"
          >
            <HeaderContext.Provider value={true}>
              {/* Primary 5 Tabs (Pre-mounted & permanently cached for 0ms transitions) */}
              <div 
                style={{ display: currentRoute === 'home' ? 'contents' : 'none' }}
                className="w-full flex-1 flex-col min-h-full"
              >
                <ScreenErrorBoundary screenName="Home">
                  <HomeScreen />
                </ScreenErrorBoundary>
              </div>
              <div 
                style={{ display: currentRoute === 'wallets' ? 'contents' : 'none' }}
                className="w-full flex-1 flex-col min-h-full"
              >
                <ScreenErrorBoundary screenName="Wallets">
                  <WalletsScreen />
                </ScreenErrorBoundary>
              </div>
              <div 
                style={{ display: currentRoute === 'logistics' ? 'contents' : 'none' }}
                className="w-full flex-1 flex-col min-h-full"
              >
                <ScreenErrorBoundary screenName="Logistics">
                  <LogisticsScreen />
                </ScreenErrorBoundary>
              </div>
              <div 
                style={{ display: currentRoute === 'shop' ? 'contents' : 'none' }}
                className="w-full flex-1 flex-col min-h-full"
              >
                <ScreenErrorBoundary screenName="Shop">
                  <ShopScreen />
                </ScreenErrorBoundary>
              </div>
              <div 
                style={{ display: currentRoute === 'profile' ? 'contents' : 'none' }}
                className="w-full flex-1 flex-col min-h-full"
              >
                <ScreenErrorBoundary screenName="Profile">
                  <ProfileScreen />
                </ScreenErrorBoundary>
              </div>

              {/* Cached & Keep-Alive Secondary Screens (Rendered once, preserved for instant re-entry) */}
              {activeCachedRoutes.map((route) => {
                if (PRIMARY_TABS.includes(route) || AUTH_ROUTES.includes(route)) return null;
                const isCurrent = currentRoute === route;
                return (
                  <div 
                    key={route} 
                    style={{ display: isCurrent ? 'flex' : 'none' }}
                    className="w-full flex-1 flex-col min-h-full"
                    aria-hidden={!isCurrent}
                  >
                    <ScreenErrorBoundary screenName={route}>
                      {renderScreenByRoute(route)}
                    </ScreenErrorBoundary>
                  </div>
                );
              })}

              {/* Auth Screens (Rendered directly on-demand during login/signup flows) */}
              {AUTH_ROUTES.includes(currentRoute) && (
                <div className="w-full flex-1 flex flex-col min-h-full">
                  <ScreenErrorBoundary screenName={currentRoute}>
                    {renderScreenByRoute(currentRoute)}
                  </ScreenErrorBoundary>
                </div>
              )}
            </HeaderContext.Provider>
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
          <CurrencySwapModal />
          <FundWalletModal />
          <QuickActionSheet />
          <Toast />
        </div>
      </div>
    </div>
  );
};
