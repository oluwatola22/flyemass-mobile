import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Currency, 
  ScreenRoute, 
  WalletBalance, 
  Transaction, 
  Shipment, 
  TechProduct, 
  CartItem, 
  Hotel,
  HotelBooking, 
  ChatMessage,
  SupportTicket,
  AppNotification,
  RFQQuotation,
  ShopOrder
} from '../types';
import { 
  INITIAL_WALLETS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SHIPMENTS, 
  INITIAL_BOOKINGS, 
  INITIAL_CHAT_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
  INITIAL_QUOTATIONS,
  INITIAL_SHOP_ORDERS,
  TECH_PRODUCTS
} from '../data/mockData';
import { db } from '../services/db';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  currentRoute: ScreenRoute;
  navigate: (route: ScreenRoute, param?: string) => void;
  goBack: () => void;
  routeHistory: ScreenRoute[];
  routeParam: string | null;
  wallets: WalletBalance[];
  activeCurrency: Currency;
  setActiveCurrency: (c: Currency) => void;
  isBalanceHidden: boolean;
  toggleBalancePrivacy: () => void;
  transactions: Transaction[];
  shipments: Shipment[];
  cart: CartItem[];
  addToCart: (product: TechProduct, selectedColor?: string, selectedStorage?: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  savedProductIds: string[];
  toggleSaveProduct: (productId: string) => void;
  compareProductIds: string[];
  toggleCompareProduct: (productId: string) => void;
  clearCompare: () => void;
  shopOrders: ShopOrder[];
  placeShopOrder: (paidWith: Currency, destinationAddress: string) => boolean;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  supportTickets: SupportTicket[];
  addSupportTicket: (ticket: { subject: string; category: SupportTicket['category']; priority: SupportTicket['priority']; message: string }) => void;
  addTicketMessage: (ticketId: string, text: string) => void;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  rfqQuotations: RFQQuotation[];
  submitRFQ: (data: { productName: string; category: string; targetQuantity: number; targetUnitUSD: number; supplierCity: 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'; inspectionRequired: boolean; cantonFairBooth?: string }) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'date'>) => void;
  executeSwap: (from: Currency, to: Currency, fromAmount: number, toAmount: number) => boolean;
  fundWallet: (currency: Currency, amount: number, method: string) => void;
  paySupplier: (supplierName: string, method: string, amountCNY: number, note: string) => boolean;
  withdrawToBank: (bankName: string, accountNumber: string, accountName: string, amountNGN: number) => boolean;
  registerPackage: (data: { trackingNumber: string; title: string; sender: string; type: 'air' | 'sea'; weightKg: number }) => void;
  hotelBookings: HotelBooking[];
  bookHotel: (hotel: Hotel, nights: number) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  isQuickActionOpen: boolean;
  setIsQuickActionOpen: (open: boolean) => void;
  themeMode: 'dark' | 'light';
  toggleTheme: () => void;
  isFrameMockup: boolean;
  toggleFrameMockup: () => void;
  isAuthenticated: boolean;
  userPin: string;
  setUserPin: (pin: string) => void;
  login: () => void;
  logout: () => void;
  userProfile: {
    name: string;
    email: string;
    phone: string;
    company: string;
    rcNumber: string;
    tier: string;
    flyeTag: string;
    avatar: string;
  };
}

const ROUTE_TO_PATH: Record<ScreenRoute, string> = {
  // 1. Auth & Security
  welcome: '/welcome',
  login: '/login',
  signup: '/signup',
  'reset-password': '/reset-password',
  'verify-email': '/verify-email',
  'setup-pin': '/setup-pin',
  'switch-device': '/switch-device',

  // 2. Core Hub & Dashboard
  home: '/',
  wallets: '/wallets',
  history: '/history',
  notifications: '/notifications',

  // 3. Banking & Money Flows
  fund: '/fund',
  pay: '/pay',
  exchange: '/exchange',
  withdraw: '/withdraw',

  // 4. Logistics & Cargo Tracking
  logistics: '/logistics',
  track: '/track',
  'register-package': '/register-package',

  // 5. Apple & Tech Gadget Shop
  shop: '/shop',
  'product-detail': '/shop/product',
  cart: '/shop/cart',
  checkout: '/shop/checkout',
  'shop-saved': '/shop/saved',
  'shop-compare': '/shop/compare',
  'shop-orders': '/shop/orders',
  'shop-order-detail': '/shop/orders/detail',

  // 6. Trade Sourcing & Agent Services
  suppliers: '/suppliers',
  agent: '/agent',
  procure: '/procure',

  // 7. China Business Hotels
  hotels: '/hotels',
  'hotel-detail': '/hotels/detail',
  'hotel-bookings': '/hotels/bookings',

  // 8. Profile, Security & Support
  profile: '/profile',
  security: '/security',
  support: '/support',
  'support-chat': '/support/chat',
  'support-tickets': '/support/tickets',
  'support-ticket-detail': '/support/tickets/detail',
  'support-new-ticket': '/support/tickets/new',
  terms: '/terms',
  privacy: '/privacy',
  'delete-account': '/delete-account',

  // 9. Database schema inspector
  'schema-inspector': '/admin/db',

  // 10. Web Admin Dashboard
  'admin-dashboard': '/admin',
  'admin-login': '/admin/login',
  'admin-users': '/admin/users',
  'admin-user-detail': '/admin/users/detail',
  'admin-logistics': '/admin/logistics',
  'admin-logistics-detail': '/admin/logistics/detail',
  'admin-payments': '/admin/payments',
  'admin-shop': '/admin/shop',
  'admin-hotels': '/admin/hotels',
  'admin-agents': '/admin/agents',
  'admin-support': '/admin/support',
  'admin-team': '/admin/team'
};

const getInitialRoute = (): ScreenRoute => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  
  if (path === '' || path === '/' || path === '/app' || path === '/home') return 'home';
  if (path === '/admin' || path === '/admin/dashboard') return 'admin-dashboard';
  if (path === '/admin/db') return 'schema-inspector';
  if (path.startsWith('/admin/users')) return 'admin-users';
  if (path.startsWith('/admin/logistics')) return 'admin-logistics';
  if (path.startsWith('/admin/payments')) return 'admin-payments';
  if (path.startsWith('/admin/shop')) return 'admin-shop';
  if (path.startsWith('/admin/hotels')) return 'admin-hotels';
  if (path.startsWith('/admin/agents')) return 'admin-agents';
  if (path.startsWith('/admin/support')) return 'admin-support';
  if (path.startsWith('/admin/team')) return 'admin-team';
  if (path.startsWith('/admin/login')) return 'admin-login';

  for (const [route, p] of Object.entries(ROUTE_TO_PATH)) {
    if (p === path) return route as ScreenRoute;
  }
  return 'home';
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(() => getInitialRoute());
  const [routeHistory, setRouteHistory] = useState<ScreenRoute[]>(() => [getInitialRoute()]);
  const [routeParam, setRouteParam] = useState<string | null>(null);
  
  const [wallets, setWallets] = useState<WalletBalance[]>(() => {
    const user = db.getUser('usr_alade_01');
    if (user && user.balances) {
      return [
        { currency: 'NGN', balance: user.balances.NGN, symbol: '₦', name: 'Nigerian Naira' },
        { currency: 'CNY', balance: user.balances.CNY, symbol: '¥', name: 'Chinese Yuan' },
        { currency: 'USD', balance: user.balances.USD, symbol: '$', name: 'US Dollar' }
      ];
    }
    const saved = localStorage.getItem('flyemass_wallets');
    return saved ? JSON.parse(saved) : INITIAL_WALLETS;
  });
  
  const [activeCurrency, setActiveCurrency] = useState<Currency>('NGN');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>(['prod-iphone-16-pro', 'prod-watch-ultra-2']);
  const [compareProductIds, setCompareProductIds] = useState<string[]>(['prod-iphone-16-pro', 'prod-macbook-pro-16']);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>(INITIAL_SHOP_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>('ord-tech-101');
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('tkt-1');
  const [rfqQuotations, setRfqQuotations] = useState<RFQQuotation[]>(INITIAL_QUOTATIONS);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>(INITIAL_BOOKINGS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isFrameMockup, setIsFrameMockup] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userPin, setUserPin] = useState<string>('2468');

  const [userProfile] = useState({
    name: 'Chief Babatunde Alade',
    email: 'babatunde@aladeholding.ng',
    phone: '+234 803 555 9201',
    company: 'Alade Global Enterprises Ltd',
    rcNumber: 'RC-1849204',
    tier: 'Tier 3 Enterprise Verified',
    flyeTag: '@alade_trade',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  });

  // Real-time synchronization with NoSQL DB and Firestore
  useEffect(() => {
    const syncFromDb = () => {
      const user = db.getUser('usr_alade_01');
      if (user && user.balances) {
        setWallets([
          { currency: 'NGN', balance: user.balances.NGN, symbol: '₦', name: 'Nigerian Naira' },
          { currency: 'CNY', balance: user.balances.CNY, symbol: '¥', name: 'Chinese Yuan' },
          { currency: 'USD', balance: user.balances.USD, symbol: '$', name: 'US Dollar' }
        ]);
      }

      const dbShipments = db.getShipments();
      if (dbShipments && dbShipments.length > 0) {
        const stepMap: Record<string, number> = {
          'Origin Received': 0,
          'Packed': 1,
          'In Transit/Customs': 2,
          'Lagos Hub Ready': 3,
          'Delivered': 4
        };

        setShipments(
          dbShipments.map((s) => {
            const curStep = stepMap[s.currentStatus] ?? 0;
            return {
              trackingNumber: s.trackingNumber,
              title: s.title || `${s.mode} Cargo to Lagos`,
              sender: s.originWarehouse,
              origin: `${s.originWarehouse} Hub`,
              destination: s.destination,
              type: s.mode.toLowerCase().includes('sea') ? 'sea' : 'air',
              status: s.currentStatus,
              currentStep: curStep,
              eta: s.mode.toLowerCase().includes('sea') ? 'In 21 days' : 'In 3 days',
              weightKg: s.weightKg,
              cbm: s.cbm || Number((s.weightKg * 0.005).toFixed(2)),
              costEstimate: s.costEstimate || (s.mode.toLowerCase().includes('sea') ? s.weightKg * 3.5 : s.weightKg * 10),
              costCurrency: 'USD',
              waypoints: (s.timeline || []).map((tl, i) => ({
                id: `wp-${s.trackingNumber}-${i}`,
                title: tl.status,
                location: tl.location,
                timestamp: tl.timestamp || 'Just now',
                status: i < curStep ? 'completed' : i === curStep ? 'current' : 'upcoming',
                description: tl.notes || ''
              }))
            };
          })
        );
      }

      const dbOrders = db.getShopOrders();
      if (dbOrders && dbOrders.length > 0) {
        setShopOrders(
          dbOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber || `ORD-${o.id.slice(-5)}`,
            items: o.items,
            totalUSD: o.currency === 'USD' ? o.totalAmount : o.totalAmount / 7.24,
            totalNGN: o.currency === 'NGN' ? o.totalAmount : o.totalAmount * 1485,
            paidWith: (o.paymentWalletUsed as Currency) || 'USD',
            date: new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            status: o.fulfillmentStatus === 'delivered' ? 'Delivered' : o.fulfillmentStatus === 'shipped' ? 'Shipped' : 'Processing',
            step: o.fulfillmentStatus === 'delivered' ? 3 : o.fulfillmentStatus === 'shipped' ? 2 : 1,
            destinationAddress: o.deliveryAddress,
            trackingNumber: o.trackingNumber || `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`
          }))
        );
      }

      const dbTickets = db.getSupportTickets();
      if (dbTickets && dbTickets.length > 0) {
        setSupportTickets(
          dbTickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber || `TKT-${t.id.slice(-4)}`,
            subject: t.subject,
            category: (t.category as SupportTicket['category']) || 'Supplier Escrow',
            priority: (t.priority as SupportTicket['priority']) || 'Medium',
            status: t.status === 'resolved' ? 'Resolved' : t.status === 'in_progress' ? 'In Progress' : 'Open',
            lastUpdated: 'Recently',
            createdAt: new Date(t.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            messages: t.messages.map((m) => ({
              sender: m.isAdmin ? 'support' : 'user',
              senderName: m.senderName || (m.isAdmin ? 'FlyeMass Concierge' : 'Chief Alade'),
              text: m.text,
              timestamp: m.timestamp || 'Just now'
            }))
          }))
        );
      }
    };

    syncFromDb();
    const unsubscribe = db.subscribe(syncFromDb);
    return () => {
      unsubscribe();
    };
  }, []);

  // Browser History & URL route synchronization
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
        if (e.state.param !== undefined) {
          setRouteParam(e.state.param);
        }
      } else {
        const initial = getInitialRoute();
        setCurrentRoute(initial);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('flyemass_wallets', JSON.stringify(wallets));
  }, [wallets]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const navigate = (route: ScreenRoute, param?: string) => {
    if (param !== undefined) {
      setRouteParam(param);
    }
    setRouteHistory((prev) => [...prev, route]);
    setCurrentRoute(route);

    const targetPath = ROUTE_TO_PATH[route] || `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ route, param }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (routeHistory.length > 1) {
      const nextHistory = [...routeHistory];
      nextHistory.pop(); // Remove current
      const previous = nextHistory[nextHistory.length - 1];
      setRouteHistory(nextHistory);
      setCurrentRoute(previous);
    } else {
      setCurrentRoute('home');
    }
  };

  const toggleBalancePrivacy = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleFrameMockup = () => {
    setIsFrameMockup((prev) => !prev);
  };

  const login = () => {
    setIsAuthenticated(true);
    navigate('home');
    showToast('Authenticated successfully with Biometrics / Password', 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    navigate('welcome');
    showToast('Signed out of corporate session', 'info');
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: Date.now(),
      date: 'Just now'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const executeSwap = (from: Currency, to: Currency, fromAmount: number, toAmount: number): boolean => {
    const fromWallet = wallets.find((w) => w.currency === from);
    if (!fromWallet || fromWallet.balance < fromAmount) {
      showToast(`Insufficient ${from} balance for this conversion`, 'error');
      return false;
    }

    const toWallet = wallets.find((w) => w.currency === to);
    const newFromBal = fromWallet.balance - fromAmount;
    const newToBal = (toWallet?.balance || 0) + toAmount;

    db.updateUserBalances('usr_alade_01', {
      [from]: newFromBal,
      [to]: newToBal
    });

    setWallets((prev) =>
      prev.map((w) => {
        if (w.currency === from) {
          return { ...w, balance: newFromBal };
        }
        if (w.currency === to) {
          return { ...w, balance: newToBal };
        }
        return w;
      })
    );

    addTransaction({
      title: `FX Swap: ${from} to ${to}`,
      category: 'FX Swap',
      amount: fromAmount,
      currency: from,
      convertedAmount: toAmount,
      convertedCurrency: to,
      status: 'completed',
      reference: `SWP-${from}-${to}-${Math.floor(1000 + Math.random() * 9000)}`,
      recipient: 'FlyeMass Instant Liquidity Pool',
      paymentMethod: 'Instant FX Rate Lock Engine',
      type: 'swap'
    });

    db.recordLedgerEntry({
      userId: 'usr_alade_01',
      type: 'FX_SWAP',
      sourceCurrency: from,
      targetCurrency: to,
      amount: fromAmount,
      fee: 0,
      status: 'completed',
      reference: `SWP-${from}-${to}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Instant FX Swap: ${from} to ${to}`
    });

    showToast(`Swapped ${fromWallet.symbol}${fromAmount.toLocaleString()} to ${to} successfully!`, 'success');
    return true;
  };

  const fundWallet = (currency: Currency, amount: number, method: string) => {
    const targetWallet = wallets.find((w) => w.currency === currency);
    const newBal = (targetWallet?.balance || 0) + amount;

    db.updateUserBalances('usr_alade_01', {
      [currency]: newBal
    });

    setWallets((prev) =>
      prev.map((w) => {
        if (w.currency === currency) {
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    addTransaction({
      title: `Deposit via ${method}`,
      category: 'Wallet Top-up',
      amount,
      currency,
      status: 'completed',
      reference: `TOPUP-${Date.now().toString().slice(-6)}`,
      recipient: `${userProfile.name} ${currency} Vault`,
      paymentMethod: method,
      type: 'fund'
    });

    db.recordLedgerEntry({
      userId: 'usr_alade_01',
      type: 'FUND',
      sourceCurrency: currency,
      targetCurrency: currency,
      amount,
      fee: 0,
      status: 'completed',
      reference: `TOPUP-${Date.now().toString().slice(-6)}`,
      notes: `Deposit via ${method}`
    });

    showToast(`Wallet credited with ${currency === 'NGN' ? '₦' : currency === 'CNY' ? '¥' : '$'}${amount.toLocaleString()}!`, 'success');
  };

  const paySupplier = (supplierName: string, method: string, amountCNY: number, note: string): boolean => {
    const cnyWallet = wallets.find((w) => w.currency === 'CNY');
    if (!cnyWallet || cnyWallet.balance < amountCNY) {
      showToast('Insufficient Chinese Yuan (RMB) balance. Swap NGN/USD first!', 'error');
      return false;
    }

    const newBal = cnyWallet.balance - amountCNY;
    db.updateUserBalances('usr_alade_01', {
      CNY: newBal
    });

    setWallets((prev) =>
      prev.map((w) => {
        if (w.currency === 'CNY') {
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    addTransaction({
      title: `Supplier Payment: ${supplierName}`,
      category: 'Supplier',
      amount: amountCNY,
      currency: 'CNY',
      status: 'completed',
      reference: `PAY-${supplierName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      recipient: supplierName,
      paymentMethod: method,
      type: 'pay_supplier'
    });

    const paymentMethodClean = method.includes('WeChat')
      ? 'WeChat Pay'
      : method.includes('Bank')
      ? 'China Bank Transfer'
      : 'Alipay';

    db.recordLedgerEntry({
      userId: 'usr_alade_01',
      type: 'PAY_SUPPLIER',
      sourceCurrency: 'CNY',
      targetCurrency: 'CNY',
      amount: amountCNY,
      fee: 0,
      status: 'completed',
      reference: `PAY-${supplierName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Payment to ${supplierName}`
    });

    db.recordSupplierPayment({
      userId: 'usr_alade_01',
      paymentMethod: paymentMethodClean,
      receiverAccount: '13800138000',
      receiverName: supplierName,
      amountRMB: amountCNY,
      equivalentNGN: amountCNY * 214.5,
      status: 'disbursed',
      notes: note
    });

    showToast(`¥${amountCNY.toLocaleString()} transferred to ${supplierName} via ${method}!`, 'success');
    return true;
  };

  const withdrawToBank = (bankName: string, accountNumber: string, accountName: string, amountNGN: number): boolean => {
    const ngnWallet = wallets.find((w) => w.currency === 'NGN');
    const fee = 100; // Flat fee
    const totalDeduction = amountNGN + fee;

    if (!ngnWallet || ngnWallet.balance < totalDeduction) {
      showToast('Insufficient NGN wallet balance including transfer fee', 'error');
      return false;
    }

    const newBal = ngnWallet.balance - totalDeduction;
    db.updateUserBalances('usr_alade_01', {
      NGN: newBal
    });

    setWallets((prev) =>
      prev.map((w) => {
        if (w.currency === 'NGN') {
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    addTransaction({
      title: `Payout to ${bankName} - ${accountName}`,
      category: 'Wallet Top-up',
      amount: amountNGN,
      currency: 'NGN',
      status: 'completed',
      reference: `WDR-NGN-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: `${accountName} (${accountNumber})`,
      paymentMethod: `NIBSS Instant Transfer (${bankName})`,
      type: 'withdraw'
    });

    showToast(`₦${amountNGN.toLocaleString()} sent to ${bankName} (${accountNumber})!`, 'success');
    return true;
  };

  const registerPackage = (data: { trackingNumber: string; title: string; sender: string; type: 'air' | 'sea'; weightKg: number }) => {
    const newShipment: Shipment = {
      trackingNumber: data.trackingNumber || `FM-GZ-LOS-${Math.floor(10000 + Math.random() * 90000)}`,
      title: data.title,
      sender: data.sender,
      origin: 'Guangzhou Baiyun Hub',
      destination: 'Lagos Ikeja Hub',
      type: data.type,
      status: 'Origin Received',
      currentStep: 0,
      eta: data.type === 'air' ? 'In 4 days' : 'In 28 days',
      weightKg: data.weightKg,
      cbm: Number((data.weightKg * 0.005).toFixed(2)),
      costEstimate: data.type === 'air' ? data.weightKg * 10 : data.weightKg * 3.5,
      costCurrency: 'USD',
      waypoints: [
        {
          id: `wp-${Date.now()}-1`,
          title: 'Package Logged & Received at Hub',
          location: 'Guangzhou Cargo Consolidation Center',
          timestamp: 'Just now',
          status: 'current',
          description: 'Package received from supplier and placed in inspection bay.'
        },
        {
          id: `wp-${Date.now()}-2`,
          title: 'Quality Check & Export Clearance',
          location: 'Customs Air/Sea Terminal',
          status: 'upcoming',
          description: 'Barcode tagged and export declarations submitted.'
        },
        {
          id: `wp-${Date.now()}-3`,
          title: 'International Transit',
          location: data.type === 'air' ? 'Air Flight Cargo' : 'Container Vessel',
          status: 'upcoming',
          description: 'En route to Nigerian waters/airspace.'
        },
        {
          id: `wp-${Date.now()}-4`,
          title: 'Lagos Hub Arrival & Final Clearing',
          location: 'Lagos Terminal Ready',
          status: 'upcoming',
          description: 'Available for warehouse pickup or doorstep delivery.'
        }
      ]
    };

    setShipments((prev) => [newShipment, ...prev]);

    db.recordShipment({
      trackingNumber: newShipment.trackingNumber,
      userId: 'usr_alade_01',
      receiverName: userProfile.name,
      originWarehouse: 'Guangzhou',
      destination: 'Lagos Hub',
      weightKg: data.weightKg,
      mode: data.type === 'air' ? 'Air Freight' : 'Sea Freight',
      currentStatus: 'Origin Received',
      timeline: [
        {
          status: 'Origin Received',
          location: 'China Consolidation Center (Guangzhou)',
          timestamp: new Date().toLocaleTimeString(),
          notes: 'Package registered and pre-alert sent to dock.'
        }
      ],
      title: data.title
    });

    showToast(`Package ${newShipment.trackingNumber} registered successfully!`, 'success');
  };

  const addToCart = (product: TechProduct, selectedColor?: string, selectedStorage?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === (selectedColor || product.colors[0]?.name) &&
          item.selectedStorage === (selectedStorage || product.storageOptions[0])
      );

      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedColor: selectedColor || product.colors[0]?.name,
          selectedStorage: selectedStorage || product.storageOptions[0]
        }
      ];
    });
    showToast(`Added ${product.title} to Cart`, 'success');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Item removed from Wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Item added to Wishlist!', 'success');
        return [...prev, productId];
      }
    });
  };

  const toggleCompareProduct = (productId: string) => {
    setCompareProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        showToast('You can compare at most 3 products at a time', 'info');
        return prev;
      }
      showToast('Added to comparison tool', 'success');
      return [...prev, productId];
    });
  };

  const clearCompare = () => {
    setCompareProductIds([]);
  };

  const placeShopOrder = (paidWith: Currency, destinationAddress: string): boolean => {
    if (cart.length === 0) return false;
    
    const totalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const totalNGN = cart.reduce((sum, item) => sum + item.product.priceNGN * item.quantity, 0);
    
    const walletToDebit = wallets.find((w) => w.currency === paidWith);
    const requiredAmount = paidWith === 'USD' ? totalUSD : paidWith === 'NGN' ? totalNGN : totalUSD * 7.24;

    if (!walletToDebit || walletToDebit.balance < requiredAmount) {
      showToast(`Insufficient ${paidWith} balance to complete purchase`, 'error');
      return false;
    }

    const newBal = walletToDebit.balance - requiredAmount;
    db.updateUserBalances('usr_alade_01', {
      [paidWith]: newBal
    });

    setWallets((prev) =>
      prev.map((w) => {
        if (w.currency === paidWith) {
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    const newOrder: ShopOrder = {
      id: `ord-tech-${Date.now()}`,
      orderNumber: `ORD-HK-${Math.floor(10000 + Math.random() * 90000)}`,
      items: [...cart],
      totalUSD,
      totalNGN,
      paidWith,
      date: 'Today, Just now',
      status: 'Processing',
      step: 0,
      destinationAddress,
      trackingNumber: `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`
    };

    setShopOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.id);

    db.recordShopOrder({
      userId: 'usr_alade_01',
      items: [...cart],
      totalAmount: requiredAmount,
      currency: paidWith,
      deliveryAddress: destinationAddress,
      paymentWalletUsed: paidWith,
      fulfillmentStatus: 'processing',
      orderNumber: newOrder.orderNumber,
      trackingNumber: newOrder.trackingNumber
    });

    db.recordLedgerEntry({
      userId: 'usr_alade_01',
      type: 'SHOP_ORDER',
      sourceCurrency: paidWith,
      targetCurrency: paidWith,
      amount: requiredAmount,
      fee: 0,
      status: 'completed',
      reference: newOrder.orderNumber,
      notes: `Tech Wholesale: ${cart[0].product.title}`
    });

    clearCart();

    addTransaction({
      title: `Tech Store: ${cart[0].product.title} (${cart.length} items)`,
      category: 'Tech Store',
      amount: requiredAmount,
      currency: paidWith,
      status: 'completed',
      reference: newOrder.orderNumber,
      recipient: 'FlyeMass Hong Kong Distribution',
      paymentMethod: `${paidWith} Wallet Escrow`,
      type: 'shop_purchase'
    });

    showToast(`Order ${newOrder.orderNumber} confirmed! Preparing HK dispatch.`, 'success');
    return true;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const addSupportTicket = (ticket: { subject: string; category: SupportTicket['category']; priority: SupportTicket['priority']; message: string }) => {
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TK-${Math.floor(10000 + Math.random() * 90000)}`,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: 'Open',
      lastUpdated: 'Just now',
      createdAt: 'Today',
      messages: [
        {
          sender: 'user',
          senderName: userProfile.name,
          text: ticket.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setSupportTickets((prev) => [newTkt, ...prev]);
    setSelectedTicketId(newTkt.id);

    db.recordSupportTicket({
      userId: 'usr_alade_01',
      subject: ticket.subject,
      status: 'open',
      category: ticket.category,
      priority: ticket.priority,
      ticketNumber: newTkt.ticketNumber,
      messages: [
        {
          senderId: 'usr_alade_01',
          senderName: userProfile.name,
          text: ticket.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAdmin: false
        }
      ]
    });

    showToast(`Support ticket ${newTkt.ticketNumber} created!`, 'success');
  };

  const addTicketMessage = (ticketId: string, text: string) => {
    if (!text.trim()) return;

    setSupportTickets((prev) =>
      prev.map((tkt) => {
        if (tkt.id === ticketId) {
          const userMsg = {
            sender: 'user' as const,
            senderName: userProfile.name,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          db.addTicketMessage(ticketId, {
            senderId: 'usr_alade_01',
            senderName: userProfile.name,
            text,
            isAdmin: false
          });
          return {
            ...tkt,
            lastUpdated: 'Just now',
            messages: [...tkt.messages, userMsg]
          };
        }
        return tkt;
      })
    );

    // Simulated agent reply
    setTimeout(() => {
      setSupportTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id === ticketId) {
            const agentReply = {
              sender: 'agent' as const,
              senderName: 'Li Wei (Cross-Border Desk)',
              text: `Acknowledged Chief Alade. Our on-ground team is expediting this with the port authorities/clearing officers. Reference recorded under ${tkt.ticketNumber}.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            return {
              ...tkt,
              status: 'In Progress' as const,
              lastUpdated: 'Just now',
              messages: [...tkt.messages, agentReply]
            };
          }
          return tkt;
        })
      );
    }, 1200);
  };

  const submitRFQ = (data: { productName: string; category: string; targetQuantity: number; targetUnitUSD: number; supplierCity: 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'; inspectionRequired: boolean; cantonFairBooth?: string }) => {
    const newRfq: RFQQuotation = {
      id: `rfq-${Date.now()}`,
      rfqCode: `RFQ-${data.supplierCity.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: data.productName,
      category: data.category,
      targetQuantity: data.targetQuantity,
      targetUnitUSD: data.targetUnitUSD,
      supplierCity: data.supplierCity,
      status: 'Quotation Submitted',
      inspectionRequired: data.inspectionRequired,
      cantonFairBooth: data.cantonFairBooth,
      date: 'Today, Just now'
    };

    setRfqQuotations((prev) => [newRfq, ...prev]);
    showToast(`RFQ ${newRfq.rfqCode} assigned to our ${data.supplierCity} agent team!`, 'success');
  };

  const bookHotel = (hotel: Hotel, nights: number) => {
    const newBooking: HotelBooking = {
      id: `BK-${hotel.city.toUpperCase().slice(0, 2)}-${Math.floor(10000 + Math.random() * 90000)}`,
      hotel,
      checkIn: 'Nov 15, 2026',
      checkOut: `Nov ${15 + nights}, 2026`,
      nights,
      totalUSD: hotel.pricePerNightUSD * nights,
      guestName: userProfile.name,
      confirmationCode: `FM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'Confirmed',
      taxiCardZh: `师傅您好，请带我到：${hotel.chineseName} (${hotel.district})。谢谢！`
    };

    setHotelBookings((prev) => [newBooking, ...prev]);
    showToast(`Reservation confirmed at ${hotel.name}!`, 'success');
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: userProfile.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = 'Thank you for contacting FlyeMass trade desk. Our Guangzhou and Lagos agents are reviewing your request. For urgent supplier escrow or freight booking, our average response time is under 2 minutes.';
      const lower = text.toLowerCase();
      if (lower.includes('rate') || lower.includes('fx') || lower.includes('rmb') || lower.includes('exchange')) {
        replyText = `Current live rate is ₦214.50 per RMB and ₦1,485.00 per USD. You can lock rates instantly for 60 seconds directly in the Exchange tab with zero slippage!`;
      } else if (lower.includes('cargo') || lower.includes('track') || lower.includes('package') || lower.includes('shipment')) {
        replyText = `Your active air cargo FM-CAN-LOS-89241 is currently in flight on Ethiopian Cargo ET921 and scheduled to touch down at Lagos MM2 Cargo apron tomorrow!`;
      } else if (lower.includes('address') || lower.includes('warehouse')) {
        replyText = `Our Guangzhou Baiyun warehouse address: 广东省广州市白云区石井国际物流园B栋302室. Mark all cartons with your user mark FM-90214.`;
      } else if (lower.includes('alipay') || lower.includes('wechat')) {
        replyText = `We process direct 1688 and factory Alipay/WeChat settlement within 90 seconds. Verification is automated via China Merchant Clearing API.`;
      }

      const botReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'support',
        senderName: 'Li Na (FlyeMass Trade Concierge)',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        goBack,
        routeHistory,
        routeParam,
        wallets,
        activeCurrency,
        setActiveCurrency,
        isBalanceHidden,
        toggleBalancePrivacy,
        transactions,
        shipments,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        savedProductIds,
        toggleSaveProduct,
        compareProductIds,
        toggleCompareProduct,
        clearCompare,
        shopOrders,
        placeShopOrder,
        selectedOrderId,
        setSelectedOrderId,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        supportTickets,
        addSupportTicket,
        addTicketMessage,
        selectedTicketId,
        setSelectedTicketId,
        rfqQuotations,
        submitRFQ,
        addTransaction,
        executeSwap,
        fundWallet,
        paySupplier,
        withdrawToBank,
        registerPackage,
        hotelBookings,
        bookHotel,
        chatMessages,
        sendChatMessage,
        toast,
        showToast,
        isQuickActionOpen,
        setIsQuickActionOpen,
        themeMode,
        toggleTheme,
        isFrameMockup,
        toggleFrameMockup,
        isAuthenticated,
        userPin,
        setUserPin,
        login,
        logout,
        userProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
