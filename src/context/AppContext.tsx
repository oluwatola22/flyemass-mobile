import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, t as i18nT, getRouteTitle as i18nGetRouteTitle } from '../utils/i18n';
import { supabaseAuth } from '../services/supabaseAuth';
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
  ShopOrder,
  Warehouse
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
import { isAdminEnvironment } from '../utils/environment';
import { AdminUser, INITIAL_ADMINS, firebaseSync } from '../services/firebase';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  currentRoute: ScreenRoute;
  navigate: (route: ScreenRoute, param?: string) => void;
  prefetchRoute: (route: ScreenRoute) => void;
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
  addToCart: (product: TechProduct, selectedColor?: string, selectedStorage?: string, variant?: any, quantity?: number) => void;
  updateCartQuantity: (productId: string, delta: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  shopCurrency: 'NGN' | 'CNY' | 'USD';
  setShopCurrency: (curr: 'NGN' | 'CNY' | 'USD') => void;
  savedProductIds: string[];
  toggleSaveProduct: (productId: string) => void;
  compareProductIds: string[];
  toggleCompareProduct: (productId: string) => void;
  clearCompare: () => void;
  shopOrders: ShopOrder[];
  placeShopOrder: (paidWith: Currency, destinationAddress: string, pin?: string) => boolean;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  supportTickets: SupportTicket[];
  addSupportTicket: (ticket: { subject: string; category: SupportTicket['category']; priority: SupportTicket['priority']; message: string }) => void;
  addTicketMessage: (ticketId: string, text: string, attachment?: { url: string; fileName: string; fileType: string }) => void;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  rfqQuotations: RFQQuotation[];
  submitRFQ: (data: { productName: string; category: string; targetQuantity: number; targetUnitUSD: number; supplierCity: 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'; inspectionRequired: boolean; cantonFairBooth?: string }) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'date'>) => void;
  executeSwap: (from: Currency, to: Currency, fromAmount: number, toAmount: number) => boolean;
  fundWallet: (currency: Currency, amount: number, method: string) => void;
  paySupplier: (supplierName: string, method: string, amountCNY: number, note: string) => boolean;
  withdrawToBank: (bankName: string, accountNumber: string, accountName: string, amountNGN: number) => boolean;
  registerPackage: (data: any) => Promise<any>;
  warehouses: Warehouse[];
  refreshWarehouses: () => Promise<Warehouse[]>;
  hotelBookings: HotelBooking[];
  bookHotel: (hotel: Hotel, nights: number, currency?: Currency, pin?: string) => boolean;
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
  login: (identifier?: string, password?: string) => Promise<boolean> | void;
  logout: () => void;
  pendingSignup: any;
  setPendingSignup: (signup: any) => void;
  activeUserId: string;
  switchUser: (userId: string) => void;
  viewAsClient: (userId: string, targetScreen?: ScreenRoute) => void;
  userProfile: {
    name: string;
    email: string;
    phone: string;
    company: string;
    rcNumber: string;
    tier: string;
    flyeTag: string;
    shippingMark?: string;
    avatar: string;
  };
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  adminUser: AdminUser | null;
  loginAdmin: (admin: AdminUser) => void;
  logoutAdmin: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  getRouteTitle: (route: string) => string;
  isSwapModalOpen: boolean;
  setIsSwapModalOpen: (open: boolean) => void;
  swapModalInitialPair: { from?: Currency; to?: Currency } | null;
  openSwapModal: (from?: Currency, to?: Currency) => void;
  closeSwapModal: () => void;
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

  // 7. China Business Hotels & Realty
  hotels: '/hotels',
  'hotel-detail': '/hotels/detail',
  'hotel-bookings': '/hotels/bookings',
  'rentals-apartments': '/rentals/apartments',
  'rentals-offices': '/rentals/offices',

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
  'cac-registration': '/cac-registration',

  // 9. Database schema inspector
  'schema-inspector': '/admin/db',

  // 10. Web Admin Dashboard
  'admin-dashboard': '/admin',
  'admin-login': '/admin/login',
  'admin-services-cac': '/admin/services/cac',
  'admin-users': '/admin/users',
  'admin-user-detail': '/admin/users/detail',
  'admin-wallet-credit': '/admin/users/wallet-credit',
  'admin-logistics': '/admin/shipments',
  'admin-logistics-detail': '/admin/logistics/detail',
  'admin-warehouses': '/admin/warehouses',
  'admin-payments': '/admin/payments',
  'admin-rmb-transfers': '/admin/treasury/rmb',
  'admin-naira-payouts': '/admin/treasury/naira',
  'admin-fx-management': '/admin/fx-management',
  'admin-fx-rates': '/admin/rates',
  'admin-funding': '/admin/funding',
  'admin-gateway': '/admin/gateway',
  'admin-shop': '/admin/shop',
  'admin-hotels': '/admin/hotels',
  'admin-rentals-apartments': '/admin/rentals-apartments',
  'admin-rentals-offices': '/admin/rentals-offices',
  'admin-suppliers': '/admin/suppliers',
  'admin-agents': '/admin/agent-requests',
  'admin-agent-requests': '/admin/agent-requests',
  'admin-agent-settings': '/admin/agent-settings',
  'admin-support': '/admin/support/tickets',
  'admin-support-tickets': '/admin/support/tickets',
  'admin-shipping-rates': '/admin/settings/shipping',
  'admin-team': '/admin/governance/rbac',
  'admin-communications': '/admin/communications',
  'admin-registrations': '/admin/registrations',
  'admin-lagos-hubs': '/admin/lagos-hubs'
};

const getInitialRoute = (): ScreenRoute => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const isAdmin = isAdminEnvironment();

  // ==========================================
  // CUSTOMER MOBILE APPLICATION ENVIRONMENT
  // ==========================================
  if (!isAdmin) {
    // Strictly prevent customer app from resolving admin routes
    if (path.startsWith('/admin') || path.startsWith('/schema-inspector')) {
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({ route: 'home' }, '', '/home');
      }
      return 'home';
    }

    if (path === '' || path === '/' || path === '/app' || path === '/home') return 'home';
    if (path === '/cargo' || path === '/_authenticated/cargo' || path === '/estimator' || path === '/_authenticated/estimator') return 'logistics';
    if (path === '/_authenticated/track' || path.startsWith('/_authenticated/track')) return 'track';
    if (path === '/cart' || path === '/shop/cart') return 'cart';
    if (path === '/checkout' || path === '/shop/checkout') return 'checkout';
    if (path === '/shop/product' || path.startsWith('/shop/product') || path === '/product' || path.startsWith('/product')) return 'product-detail';
    if (path === '/cac-registration' || path === '/_authenticated/services/cac' || path === '/services/cac') return 'cac-registration';
    if (path.startsWith('/rentals/apartments')) return 'rentals-apartments';
    if (path.startsWith('/rentals/offices')) return 'rentals-offices';

    if (path.startsWith('/app/')) {
      const sub = path.replace('/app/', '');
      for (const [route, p] of Object.entries(ROUTE_TO_PATH)) {
        if (p === `/${sub}` && !route.startsWith('admin-') && route !== 'schema-inspector') {
          return route as ScreenRoute;
        }
      }
    }

    for (const [route, p] of Object.entries(ROUTE_TO_PATH)) {
      if (p === path && !route.startsWith('admin-') && route !== 'schema-inspector') {
        return route as ScreenRoute;
      }
    }
    return 'home';
  }

  // ==========================================
  // ADMIN OPERATIONS WORKSPACE ENVIRONMENT
  // ==========================================
  if (path === '/admin/login' || path === '/login') return 'admin-login';
  if (path === '/admin/db') return 'schema-inspector';
  if (path.startsWith('/admin/services/cac') || path.startsWith('/admin/cac')) return 'admin-services-cac';
  if (path.startsWith('/admin/users')) return 'admin-users';
  if (path.startsWith('/admin/settings/shipping') || path.startsWith('/admin/logistics-rates')) return 'admin-shipping-rates';
  if (path.startsWith('/admin/logistics') || path.startsWith('/admin/shipments')) return 'admin-logistics';
  if (path.startsWith('/admin/lagos-hubs')) return 'admin-lagos-hubs';
  if (path.startsWith('/admin/treasury/rmb') || path.startsWith('/admin/rmb-transfers')) return 'admin-rmb-transfers';
  if (path.startsWith('/admin/treasury/naira') || path.startsWith('/admin/naira-payouts')) return 'admin-naira-payouts';
  if (path.startsWith('/admin/rates')) return 'admin-fx-rates';
  if (path.startsWith('/admin/treasury/fx') || path.startsWith('/admin/fx-management')) return 'admin-fx-management';
  if (path.startsWith('/admin/payments') || path.startsWith('/admin/treasury')) return 'admin-payments';
  if (path.startsWith('/admin/funding')) return 'admin-funding';
  if (path.startsWith('/admin/gateway')) return 'admin-gateway';
  if (path.startsWith('/admin/shop')) return 'admin-shop';
  if (path.startsWith('/admin/hotels')) return 'admin-hotels';
  if (path.startsWith('/admin/rentals-apartments')) return 'admin-rentals-apartments';
  if (path.startsWith('/admin/rentals-offices')) return 'admin-rentals-offices';
  if (path.startsWith('/admin/suppliers')) return 'admin-suppliers';
  if (path.startsWith('/admin/agent-requests')) return 'admin-agent-requests';
  if (path.startsWith('/admin/agent-settings')) return 'admin-agent-settings';
  if (path.startsWith('/admin/agents')) return 'admin-agents';
  if (path.startsWith('/admin/support')) return 'admin-support';
  if (path.startsWith('/admin/communications')) return 'admin-communications';
  if (path.startsWith('/admin/registrations')) return 'admin-registrations';
  if (path.startsWith('/admin/governance/rbac') || path.startsWith('/admin/team')) return 'admin-team';

  return 'admin-dashboard';
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const buildUserWallets = (balances?: { NGN?: number; CNY?: number }): WalletBalance[] => {
  const ngn = balances?.NGN ?? 0;
  const cny = balances?.CNY ?? 0;
  return [
    {
      currency: 'NGN',
      balance: ngn,
      symbol: '₦',
      name: 'Nigerian Naira Wallet',
      flag: '🇳🇬',
      accountNumber: '9082341902',
      bankName: 'Providus Bank Plc',
      accountName: 'FlyeMass / Babatunde Alade',
      sortCode: '101002',
      clearingRoute: 'Instant NIP (NIBSS Instant Payment)',
      bankAddress: 'Plot 54, Adetokunbo Ademola St, Victoria Island, Lagos',
      equivalentUSD: Number((ngn / 1485).toFixed(2))
    },
    {
      currency: 'CNY',
      balance: cny,
      symbol: '¥',
      name: 'Chinese Yuan (RMB) Escrow',
      flag: '🇨🇳',
      accountNumber: 'CN6227003320094892',
      bankName: 'Bank of China (Guangzhou)',
      accountName: 'FlyeMass Trade Guangzhou Co., Ltd (FM-7702)',
      iban: 'CN6227003320094892',
      swiftBic: 'BKCHCNBJ400',
      cnapsCode: '104581000018',
      clearingRoute: 'CIPS / Mainland China Direct Settlement',
      bankAddress: 'No. 197 Dongfeng West Road, Yuexiu District, Guangzhou, China',
      equivalentUSD: Number((cny / 7.24).toFixed(2))
    }
  ];
};

const buildInitialShipments = (): Shipment[] => {
  try {
    const dbShipments = db.getShipments();
    if (dbShipments && dbShipments.length > 0) {
      const stepMap: Record<string, number> = {
        'registered': 0,
        'Package Registered': 0,
        'Created': 0,
        'received_warehouse': 1,
        'Package Received': 1,
        'inspection': 1,
        'Inspection': 1,
        'packed': 1,
        'Packing': 1,
        'awaiting_payment': 1,
        'Awaiting Payment': 1,
        'ready_for_dispatch': 2,
        'Paid — Preparing for Shipment': 2,
        'dispatched': 2,
        'Dispatched': 2,
        'in_transit': 2,
        'In Transit': 2,
        'customs_clearance': 3,
        'Customs Clearance': 3,
        'arrived': 4,
        'Arrived Destination': 4,
        'ready_for_pickup': 4,
        'Ready for Pickup': 4,
        'out_for_delivery': 4,
        'Out for Delivery': 4,
        'delivered': 5,
        'Delivered': 5,
        'completed': 5,
        'Completed': 5,
        'On Hold': 2,
        'Returned': 0
      };

      const statusLabelMap: Record<string, string> = {
        'registered': 'Package Registered (Pre-Alert)',
        'Package Registered': 'Package Registered',
        'Created': 'Created',
        'received_warehouse': 'Received at Origin Hub',
        'Package Received': 'Package Received',
        'inspection': 'Inspection & Weight Checked',
        'Inspection': 'Inspection',
        'packed': 'Export Packaged',
        'Packing': 'Packing',
        'awaiting_payment': 'Freight Invoiced (Awaiting Payment)',
        'Awaiting Payment': 'Awaiting Payment',
        'ready_for_dispatch': 'Ready for Air/Sea Dispatch',
        'Paid — Preparing for Shipment': 'Paid — Preparing for Shipment',
        'dispatched': 'Departed Origin Hub',
        'Dispatched': 'Dispatched',
        'in_transit': 'International Transit',
        'In Transit': 'In Transit',
        'customs_clearance': 'Nigeria Customs Clearance (Lagos)',
        'Customs Clearance': 'Customs Clearance',
        'arrived': 'Arrived at Lagos Hub',
        'Arrived Destination': 'Arrived Destination',
        'ready_for_pickup': 'Ready for Hub Collection',
        'Ready for Pickup': 'Ready for Pickup',
        'out_for_delivery': 'Out for Doorstep Delivery',
        'Out for Delivery': 'Out for Delivery',
        'delivered': 'Delivered & Handed Over',
        'Delivered': 'Delivered',
        'completed': 'Completed',
        'Completed': 'Completed',
        'On Hold': 'On Hold',
        'Returned': 'Returned'
      };

      return dbShipments.map((s) => {
        const curStep = stepMap[s.currentStatus] ?? 0;
        return {
          id: s.id,
          platformCode: s.platformCode || s.shipmentCode || s.trackingNumber,
          trackingNumber: s.trackingNumber,
          shipmentCode: s.shipmentCode || s.platformCode || s.trackingNumber,
          trackingCode: s.trackingCode || s.trackingNumber,
          title: s.title || s.packageDescription || `${s.mode || s.shippingMode || 'Air'} Cargo to Lagos`,
          sender: s.sender || s.originWarehouse || 'China Warehouse Hub',
          origin: `${s.originWarehouse || 'Guangzhou'} Hub`,
          originWarehouse: s.originWarehouse,
          destination: s.destination || 'Lagos Hub (LOS)',
          destinationHub: s.destinationHub || s.pickupHub || 'Ikeja MMIA Terminal',
          location: s.location,
          type: (s.mode || s.shippingMode || '').toLowerCase().includes('sea') ? 'sea' : 'air',
          method: s.method,
          shippingMethod: s.shippingMethod,
          status: statusLabelMap[s.currentStatus] || s.currentStatus || 'In Transit',
          currentStatus: s.currentStatus,
          currentStep: curStep,
          eta: s.eta || ((s.mode || s.shippingMode || '').toLowerCase().includes('sea') ? 'In 21 days' : 'In 3-5 days'),
          weightKg: s.weightKg || s.actualWeightKg || 5,
          actualWeightKg: s.actualWeightKg,
          billableWeightKg: s.billableWeightKg,
          cbm: s.cbm || Number(((s.weightKg || 5) * 0.005).toFixed(2)),
          costEstimate: s.costEstimate || s.freightFeeUSD || ((s.mode || '').toLowerCase().includes('sea') ? (s.weightKg || 5) * 3.5 : (s.weightKg || 5) * 10),
          costCurrency: 'USD',
          courierCompany: s.courierCompany,
          chineseCourierTracking: s.chineseCourierTracking,
          packageDescription: s.packageDescription,
          cartonsCount: s.cartonsCount,
          declaredValueRMB: s.declaredValueRMB,
          supplierInvoiceUrl: s.supplierInvoiceUrl,
          consolidationPreference: s.consolidationPreference,
          repackagingPreference: s.packagingCondition,
          deliveryType: s.deliveryType,
          pickupHub: s.pickupHub,
          doorstepAddress: s.doorstepAddress,
          fulfillmentMethod: s.fulfillmentMethod,
          lagosHubId: s.lagosHubId,
          lagosHubLabel: s.lagosHubLabel,
          deliveryAddress: s.deliveryAddress,
          pickupOtp: s.pickupOtp,
          pickupOtpVerifiedAt: s.pickupOtpVerifiedAt,
          assignedRiderName: s.assignedRiderName,
          assignedRiderPhone: s.assignedRiderPhone,
          dimensions: s.dimensions,
          freightFeeUSD: s.freightFeeUSD,
          freightFeeNGN: s.freightFeeNGN,
          freightFeeCNY: s.freightFeeCNY,
          ratePerKg: s.ratePerKg,
          freightPaid: s.freightPaid,
          paymentStatus: s.paymentStatus,
          paymentTiming: s.paymentTiming,
          paidCurrency: s.paidCurrency,
          paidAmount: s.paidAmount,
          otpVerified: s.otpVerified,
          handedOverTo: s.handedOverTo,
          handoverTimestamp: s.handoverTimestamp,
          inspectionPhotos: s.inspectionPhotos || s.warehousePhotos,
          warehousePhotos: s.warehousePhotos || s.inspectionPhotos,
          inspectionNotes: s.inspectionNotes,
          packagingCondition: s.packagingCondition,
          billingNotes: s.billingNotes || s.customerNotes,
          customerNotes: s.customerNotes || s.billingNotes,
          isBilled: s.isBilled,
          createdAt: s.createdAt,
          waypoints: (s.timeline && s.timeline.length > 0)
            ? s.timeline.map((tl, i) => ({
                id: `wp-${s.trackingNumber}-${i}`,
                title: tl.status,
                location: tl.location,
                timestamp: String(tl.timestamp || 'Just now'),
                status: (i < curStep ? 'completed' : i === curStep ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
                description: tl.notes || ''
              }))
            : [
                {
                  id: `wp-${s.trackingNumber}-0`,
                  title: 'Package Registered',
                  location: `${s.originWarehouse || 'China'} Dock`,
                  timestamp: 'Registered',
                  status: 'completed',
                  description: 'Pre-alert manifest registered.'
                }
              ]
        };
      });
    }
  } catch (e) {}
  return INITIAL_SHIPMENTS;
};

const buildInitialTransactions = (currentUid: string): Transaction[] => {
  try {
    const dbLedger = db.getLedger().filter(l => !l.userId || l.userId === currentUid);
    if (dbLedger && dbLedger.length > 0) {
      const dynamicTxs: Transaction[] = dbLedger.map(l => ({
        id: l.id,
        title: l.type === 'FX_SWAP' 
          ? `FX Swap: ${l.sourceCurrency} to ${l.targetCurrency}` 
          : l.type === 'FUND'
          ? `Wallet Top-up (${l.sourceCurrency})`
          : l.type === 'PAY_SUPPLIER'
          ? `Supplier Payout (${l.sourceCurrency})`
          : `${l.type} Transaction`,
        category: l.type === 'FX_SWAP' ? 'FX Swap' : l.type === 'FUND' ? 'Wallet Top-up' : 'Supplier',
        amount: l.amount,
        currency: (l.sourceCurrency as Currency) || 'NGN',
        convertedAmount: l.convertedAmount,
        convertedCurrency: (l.targetCurrency as Currency) || 'CNY',
        date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timestamp: l.timestamp,
        status: l.status === 'completed' ? 'completed' : l.status === 'pending' ? 'processing' : 'failed',
        reference: l.reference,
        recipient: l.type === 'FX_SWAP' ? `${l.sourceCurrency} → ${l.targetCurrency} Vault` : 'Treasury',
        type: l.type === 'FX_SWAP' ? 'swap' : l.type === 'FUND' ? 'fund' : 'pay_supplier'
      }));
      const existingRefs = new Set(dynamicTxs.map(t => t.reference));
      const fallbackFiltered = INITIAL_TRANSACTIONS.filter(t => !existingRefs.has(t.reference));
      return [...dynamicTxs, ...fallbackFiltered];
    }
  } catch (e) {}
  return INITIAL_TRANSACTIONS;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(() => getInitialRoute());
  const [routeHistory, setRouteHistory] = useState<ScreenRoute[]>(() => [getInitialRoute()]);
  const [routeParam, setRouteParam] = useState<string | null>(null);

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const uid = urlParams.get('userId');
      if (uid && db.getUser(uid)) return uid;
    }
    return 'usr_alade_01';
  });
  
  const [wallets, setWallets] = useState<WalletBalance[]>(() => {
    const user = db.getUser(activeUserId) || db.getUser('usr_alade_01');
    if (user && user.balances) {
      return buildUserWallets(user.balances);
    }
    const saved = localStorage.getItem('flyemass_wallets');
    return saved ? JSON.parse(saved) : INITIAL_WALLETS;
  });
  
  const [activeCurrency, setActiveCurrency] = useState<Currency>('NGN');
  const [shopCurrency, setShopCurrency] = useState<'NGN' | 'CNY' | 'USD'>('NGN');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => buildInitialTransactions(activeUserId || 'usr_alade_01'));
  const [shipments, setShipments] = useState<Shipment[]>(buildInitialShipments);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flyemass_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cart from localStorage', e);
      }
    }
    const currentUid = activeUserId || 'usr_alade_01';
    const cloudCart = db.getCloudCart(currentUid);
    if (Array.isArray(cloudCart) && cloudCart.length > 0) return cloudCart;
    return [];
  });
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
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapModalInitialPair, setSwapModalInitialPair] = useState<{ from?: Currency; to?: Currency } | null>(null);

  const openSwapModal = useCallback((from?: Currency, to?: Currency) => {
    if (from || to) {
      setSwapModalInitialPair({ from, to });
    }
    setIsSwapModalOpen(true);
  }, []);

  const closeSwapModal = useCallback(() => {
    setIsSwapModalOpen(false);
  }, []);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flyemass_language');
      if (saved === 'FR') return 'FR';
    }
    return 'EN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flyemass_language', lang);
    }
    const names: Record<Language, string> = {
      EN: 'English',
      FR: 'Français'
    };
    showToast(lang === 'FR' ? 'Langue commerciale définie sur Français' : `Trade language set to ${names[lang] || lang}`, 'success');
  };

  const t = (key: string, fallback?: string) => i18nT(key, language, fallback);
  const getRouteTitle = (route: string) => i18nGetRouteTitle(route, language);
  const [isFrameMockup, setIsFrameMockup] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flyemass_frame_mockup');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userPin, setUserPin] = useState<string>('2468');
  const [pendingSignup, setPendingSignup] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => db.getWarehouses(true));

  // Authoritative Staff Admin Session
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flyemass_admin_session');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return INITIAL_ADMINS[0];
  });

  const loginAdmin = (admin: AdminUser) => {
    setAdminUser(admin);
    firebaseSync.setCurrentAdmin(admin);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flyemass_admin_session', JSON.stringify(admin));
    }
    showToast(`Staff Session Active: ${admin.name} (${admin.roleTitle})`, 'success');
    navigate('admin-dashboard');
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flyemass_admin_session');
    }
    showToast('Signed out from Admin Operations Workspace', 'info');
    setCurrentRoute('admin-login');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ route: 'admin-login' }, '', '/admin/login');
    }
  };

  const [userProfile, setUserProfile] = useState(() => {
    const u = db.getUser(activeUserId) || db.getUser('usr_alade_01');
    const flyeTag = u?.flyeTag || u?.shippingMark || (activeUserId === 'usr_alade_01' || u?.uid === 'usr_alade_01' ? 'FM-USR-8924' : `FM-USR-${(u?.uid || activeUserId || '8924').replace(/\D/g, '').slice(-4) || '8924'}`);
    return {
      name: u?.fullName || 'Chief Babatunde Alade',
      email: u?.email || 'babatunde@aladeholding.ng',
      phone: u?.phone || '+234 803 555 9201',
      company: u?.businessName || 'Alade Global Enterprises Ltd',
      rcNumber: u?.role === 'client' ? 'RC-1849204' : 'GZ-LIC-992144',
      tier: 'Enterprise Member',
      flyeTag,
      shippingMark: flyeTag,
      avatar: u?.role === 'agent'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    };
  });

  const switchUser = (userId: string) => {
    setActiveUserId(userId);
    const u = db.getUser(userId);
    if (u) {
      const flyeTag = u.flyeTag || u.shippingMark || (userId === 'usr_alade_01' ? 'FM-USR-8924' : `FM-USR-${userId.replace(/\D/g, '').slice(-4) || '8924'}`);
      setWallets(buildUserWallets(u.balances));
      setUserProfile({
        name: u.fullName,
        email: u.email,
        phone: u.phone,
        company: u.businessName,
        rcNumber: u.role === 'client' ? 'RC-1849204' : 'GZ-LIC-992144',
        tier: 'Enterprise Member',
        flyeTag,
        shippingMark: flyeTag,
        avatar: u.role === 'agent'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      });
      const userCart = db.getCloudCart(userId);
      setCart(userCart);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('flyemass_cart', JSON.stringify(userCart));
        } catch (e) {}
      }
    }
  };

  const viewAsClient = (userId: string, targetScreen: ScreenRoute = 'home') => {
    switchUser(userId);
    navigate(targetScreen);
    const targetPath = `/app?userId=${userId}`;
    window.history.pushState({ route: targetScreen, userId }, '', targetPath);
    showToast(`Switched view to client: ${db.getUser(userId)?.fullName || userId}`, 'info');
  };

  // Supabase session listener with local caching and token deduplication
  useEffect(() => {
    const { unsubscribe } = supabaseAuth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time synchronization with NoSQL DB and Firestore
  useEffect(() => {
    let lastSyncedRev = -1;
    const syncFromDb = () => {
      const curRev = db.getStateRevision();
      if (curRev === lastSyncedRev) return;
      lastSyncedRev = curRev;

      const user = db.getUser(activeUserId) || db.getUser('usr_alade_01');
      if (user && user.balances) {
        const nextWallets = buildUserWallets(user.balances);
        setWallets((prev) => {
          if (
            prev.length === nextWallets.length &&
            prev.every((w, i) => w.currency === nextWallets[i]?.currency && w.balance === nextWallets[i]?.balance)
          ) {
            return prev;
          }
          return nextWallets;
        });

        const userTag = (user as any).flyeTag || (user as any).shippingMark || (activeUserId === 'usr_alade_01' ? 'FM-USR-8924' : `@${user.fullName.toLowerCase().replace(/\s+/g, '_')}`);
        const userMark = (user as any).shippingMark || userTag;
        const newTier = 'Enterprise Member';

        setUserProfile((prev: any) => {
          if (
            prev.name === user.fullName &&
            prev.email === user.email &&
            prev.phone === user.phone &&
            prev.company === user.businessName &&
            prev.flyeTag === userTag &&
            prev.shippingMark === userMark &&
            prev.tier === newTier
          ) {
            return prev;
          }
          return {
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            company: user.businessName,
            rcNumber: user.role === 'client' ? 'RC-1849204' : 'GZ-LIC-992144',
            tier: newTier,
            flyeTag: userTag,
            shippingMark: userMark,
            avatar: user.role === 'agent'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
          };
        });
      }

      const currentUid = activeUserId || 'usr_alade_01';
      const dbShipments = db.getShipments().filter(s => !s.userId || s.userId === currentUid);
      if (dbShipments && dbShipments.length > 0) {
        const stepMap: Record<string, number> = {
          'registered': 0,
          'Package Registered': 0,
          'Created': 0,
          'received_warehouse': 1,
          'Package Received': 1,
          'inspection': 1,
          'Inspection': 1,
          'packed': 1,
          'Packing': 1,
          'awaiting_payment': 1,
          'Awaiting Payment': 1,
          'ready_for_dispatch': 2,
          'Paid — Preparing for Shipment': 2,
          'dispatched': 2,
          'Dispatched': 2,
          'in_transit': 2,
          'In Transit': 2,
          'customs_clearance': 3,
          'Customs Clearance': 3,
          'arrived': 4,
          'Arrived Destination': 4,
          'ready_for_pickup': 4,
          'Ready for Pickup': 4,
          'out_for_delivery': 4,
          'Out for Delivery': 4,
          'delivered': 5,
          'Delivered': 5,
          'completed': 5,
          'Completed': 5,
          'On Hold': 2,
          'Returned': 0,
          'Origin Received': 0,
          'Packed': 1,
          'In Transit/Customs': 2,
          'Lagos Hub Ready': 3
        };

        const statusLabelMap: Record<string, string> = {
          'registered': 'Registered',
          'Package Registered': 'Package Registered',
          'Created': 'Created',
          'received_warehouse': 'Received at Hub',
          'Package Received': 'Package Received',
          'inspection': 'Inspection & Weighing',
          'Inspection': 'Inspection',
          'packed': 'Packed & Stored',
          'Packing': 'Packing',
          'awaiting_payment': 'Awaiting Freight Payment',
          'Awaiting Payment': 'Awaiting Payment',
          'ready_for_dispatch': 'Ready for Flight / Vessel',
          'Paid — Preparing for Shipment': 'Paid — Preparing for Shipment',
          'dispatched': 'Departed Hub',
          'Dispatched': 'Dispatched',
          'in_transit': 'In Transit to Lagos',
          'In Transit': 'In Transit',
          'customs_clearance': 'Customs Clearance (Lagos)',
          'Customs Clearance': 'Customs Clearance',
          'arrived': 'Arrived Lagos Hub',
          'Arrived Destination': 'Arrived Destination',
          'ready_for_pickup': 'Ready for Pickup',
          'Ready for Pickup': 'Ready for Pickup',
          'out_for_delivery': 'Out for Delivery',
          'Out for Delivery': 'Out for Delivery',
          'delivered': 'Delivered & Handed Over',
          'Delivered': 'Delivered',
          'completed': 'Completed',
          'Completed': 'Completed',
          'On Hold': 'On Hold',
          'Returned': 'Returned'
        };

        const nextShipments = dbShipments.map((s) => {
          const curStep = stepMap[s.currentStatus] ?? 0;
          return {
            id: s.id,
            platformCode: s.platformCode || s.shipmentCode || s.trackingNumber,
            trackingNumber: s.trackingNumber,
            shipmentCode: s.shipmentCode || s.platformCode || s.trackingNumber,
            trackingCode: s.trackingCode || s.trackingNumber,
            title: s.title || s.packageDescription || `${s.mode || s.shippingMode || 'Air'} Cargo to Lagos`,
            sender: s.sender || s.originWarehouse || 'China Warehouse Hub',
            origin: `${s.originWarehouse || 'Guangzhou'} Hub`,
            originWarehouse: s.originWarehouse,
            destination: s.destination || 'Lagos Hub (LOS)',
            destinationHub: s.destinationHub || s.pickupHub || 'Ikeja MMIA Terminal',
            location: s.location,
            type: ((s.mode || s.shippingMode || '').toLowerCase().includes('sea') ? 'sea' : 'air') as 'air' | 'sea',
            method: s.method,
            shippingMethod: s.shippingMethod,
            status: statusLabelMap[s.currentStatus] || s.currentStatus || 'In Transit',
            currentStatus: s.currentStatus,
            currentStep: curStep,
            eta: s.eta || ((s.mode || s.shippingMode || '').toLowerCase().includes('sea') ? 'In 21 days' : 'In 3-5 days'),
            weightKg: s.weightKg || s.actualWeightKg || 5,
            actualWeightKg: s.actualWeightKg,
            billableWeightKg: s.billableWeightKg,
            cbm: s.cbm || Number(((s.weightKg || 5) * 0.005).toFixed(2)),
            costEstimate: s.costEstimate || s.freightFeeUSD || ((s.mode || '').toLowerCase().includes('sea') ? (s.weightKg || 5) * 3.5 : (s.weightKg || 5) * 10),
            costCurrency: 'USD' as Currency,
            courierCompany: s.courierCompany,
            chineseCourierTracking: s.chineseCourierTracking,
            packageDescription: s.packageDescription,
            cartonsCount: s.cartonsCount,
            declaredValueRMB: s.declaredValueRMB,
            supplierInvoiceUrl: s.supplierInvoiceUrl,
            consolidationPreference: s.consolidationPreference,
            repackagingPreference: s.packagingCondition,
            deliveryType: s.deliveryType,
            pickupHub: s.pickupHub,
            doorstepAddress: s.doorstepAddress,
            fulfillmentMethod: s.fulfillmentMethod,
            lagosHubId: s.lagosHubId,
            lagosHubLabel: s.lagosHubLabel,
            deliveryAddress: s.deliveryAddress,
            pickupOtpVerifiedAt: s.pickupOtpVerifiedAt,
            assignedRiderName: s.assignedRiderName,
            assignedRiderPhone: s.assignedRiderPhone,
            dimensions: s.dimensions,
            freightFeeUSD: s.freightFeeUSD,
            freightFeeNGN: s.freightFeeNGN,
            freightFeeCNY: s.freightFeeCNY,
            ratePerKg: s.ratePerKg,
            freightPaid: s.freightPaid,
            paymentStatus: s.paymentStatus,
            paymentTiming: s.paymentTiming,
            paidCurrency: s.paidCurrency,
            paidAmount: s.paidAmount,
            pickupOtp: s.pickupOtp,
            otpVerified: s.otpVerified,
            handedOverTo: s.handedOverTo,
            handoverTimestamp: s.handoverTimestamp,
            inspectionPhotos: s.inspectionPhotos || s.warehousePhotos,
            warehousePhotos: s.warehousePhotos || s.inspectionPhotos,
            inspectionNotes: s.inspectionNotes,
            packagingCondition: s.packagingCondition,
            billingNotes: s.billingNotes || s.customerNotes,
            customerNotes: s.customerNotes || s.billingNotes,
            isBilled: s.isBilled,
            createdAt: s.createdAt,
            waypoints: (s.timeline && s.timeline.length > 0)
              ? s.timeline.map((tl, i) => ({
                  id: `wp-${s.trackingNumber}-${i}`,
                  title: tl.status,
                  location: tl.location,
                  timestamp: String(tl.timestamp || 'Just now'),
                  status: (i < curStep ? 'completed' : i === curStep ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
                  description: tl.notes || ''
                }))
              : [
                  {
                    id: `wp-${s.trackingNumber}-0`,
                    title: 'Package Registered',
                    location: `${s.originWarehouse || 'China'} Dock`,
                    timestamp: 'Registered',
                    status: 'completed' as const,
                    description: 'Pre-alert manifest registered.'
                  }
                ]
          };
        });

        setShipments((prev) => {
          if (
            prev.length === nextShipments.length &&
            prev.every((s, i) => {
              const next = nextShipments[i];
              return (
                s.id === next?.id &&
                s.currentStatus === next?.currentStatus &&
                s.paymentStatus === next?.paymentStatus &&
                s.weightKg === next?.weightKg &&
                s.billableWeightKg === next?.billableWeightKg &&
                s.freightFeeUSD === next?.freightFeeUSD &&
                s.freightFeeNGN === next?.freightFeeNGN &&
                s.freightFeeCNY === next?.freightFeeCNY &&
                s.costEstimate === next?.costEstimate &&
                s.ratePerKg === next?.ratePerKg &&
                s.billingNotes === next?.billingNotes &&
                s.location === next?.location &&
                s.eta === next?.eta &&
                s.fulfillmentMethod === next?.fulfillmentMethod &&
                (s.inspectionPhotos?.length || 0) === (next?.inspectionPhotos?.length || 0) &&
                (s.waypoints?.length || 0) === (next?.waypoints?.length || 0) &&
                s.pickupOtp === next?.pickupOtp
              );
            })
          ) {
            return prev;
          }
          return nextShipments;
        });
      }

      const userFavs = db.getUserFavorites(activeUserId);
      if (userFavs && userFavs.length > 0) {
        setSavedProductIds((prev) => {
          if (prev.length === userFavs.length && prev.every((id, i) => id === userFavs[i])) {
            return prev;
          }
          return userFavs;
        });
      }

      const dbOrders = db.getShopOrders();
      if (dbOrders && dbOrders.length > 0) {
        const orderStatusMap: Record<string, ShopOrder['status']> = {
          'processing': 'Processing',
          'shipped': 'HK Dispatched',
          'delivered': 'Delivered'
        };

        const nextShopOrders = dbOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber || `ORD-${o.id.slice(-5)}`,
          items: o.items,
          totalUSD: o.currency === 'USD' ? o.totalAmount : o.totalAmount / 7.24,
          totalNGN: o.currency === 'NGN' ? o.totalAmount : o.totalAmount * 1485,
          paidWith: (o.paymentWalletUsed as Currency) || 'USD',
          date: new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          status: orderStatusMap[o.fulfillmentStatus] || 'Processing',
          step: o.fulfillmentStatus === 'delivered' ? 3 : o.fulfillmentStatus === 'shipped' ? 2 : 1,
          destinationAddress: o.deliveryAddress,
          trackingNumber: o.trackingNumber || `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`
        }));

        setShopOrders((prev) => {
          if (
            prev.length === nextShopOrders.length &&
            prev.every((o, i) => o.id === nextShopOrders[i]?.id && o.status === nextShopOrders[i]?.status)
          ) {
            return prev;
          }
          return nextShopOrders;
        });
      }

      const dbTickets = db.getSupportTickets();
      if (dbTickets && dbTickets.length > 0) {
        const nextTickets = dbTickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber || `TKT-${t.id.slice(-4)}`,
          subject: t.subject,
          category: (t.category as SupportTicket['category']) || 'Supplier Escrow',
          priority: (t.priority === 'Urgent' ? 'Urgent' : t.priority === 'High' ? 'High' : 'Normal') as SupportTicket['priority'],
          status: (t.status === 'resolved' ? 'Resolved' : t.status === 'in_progress' ? 'In Progress' : 'Open') as SupportTicket['status'],
          lastUpdated: 'Recently',
          createdAt: new Date(t.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          messages: t.messages.map((m) => ({
            sender: (m.isAdmin ? 'agent' : 'user') as 'agent' | 'user',
            senderName: m.senderName || (m.isAdmin ? 'FlyeMass Concierge' : 'Chief Alade'),
            text: m.text,
            timestamp: String(m.timestamp || 'Just now')
          }))
        }));

        setSupportTickets((prev) => {
          if (
            prev.length === nextTickets.length &&
            prev.every((t, i) => t.id === nextTickets[i]?.id && t.status === nextTickets[i]?.status && t.messages.length === nextTickets[i]?.messages.length)
          ) {
            return prev;
          }
          return nextTickets;
        });
      }

      const dbWhs = db.getWarehouses(true);
      if (dbWhs && dbWhs.length > 0) {
        setWarehouses((prev) => {
          if (
            prev.length === dbWhs.length &&
            prev.every((w, i) => w.id === dbWhs[i]?.id && w.isActive === dbWhs[i]?.isActive)
          ) {
            return prev;
          }
          return dbWhs;
        });
      }

      const cloudCart = db.getCloudCart(currentUid);
      if (Array.isArray(cloudCart) && cloudCart.length > 0) {
        setCart((prev) => (prev.length === 0 ? cloudCart : prev));
      }

      // Live Transaction History synchronization from Authoritative Ledger
      const dbLedger = db.getLedger().filter(l => !l.userId || l.userId === currentUid);
      if (dbLedger && dbLedger.length > 0) {
        const withdrawalsMap = db.getState().withdrawals || {};
        const paymentsMap = db.getState().supplier_payments || {};

        const dynamicTxs: Transaction[] = dbLedger.map(l => {
          const matchedWth = Object.values(withdrawalsMap).find(w => w.reference === l.reference || w.id === l.id);
          const matchedPay = Object.values(paymentsMap).find(p => p.reference === l.reference || p.id === l.id);

          const rawStatus = (matchedWth?.status || matchedPay?.status || l.status || '').toLowerCase();
          const isComplete = rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'successful' || rawStatus === 'disbursed';
          const isFailed = rawStatus === 'rejected' || rawStatus === 'failed' || rawStatus === 'refunded';

          const receipt = matchedWth?.paymentProofUrl || matchedWth?.receiptUrl || matchedPay?.paymentProofUrl || (l as any).paymentProofUrl || (l as any).receiptUrl;
          const qr = matchedWth?.qrCodeUrl || matchedPay?.qrCodeUrl || (l as any).qrCodeUrl;
          const chan = matchedWth?.channel || matchedPay?.paymentMethod || (matchedWth?.bankName ? 'Naira Bank Payout' : l.type === 'FX_SWAP' ? 'Vault Swap' : l.type === 'FUND' ? 'Bank Top-up' : 'Transfer');

          let title = l.type === 'FX_SWAP' 
            ? `FX Swap: ${l.sourceCurrency} to ${l.targetCurrency}` 
            : l.type === 'FUND'
            ? `Wallet Top-up (${l.sourceCurrency})`
            : l.type === 'PAY_SUPPLIER'
            ? `${matchedPay?.paymentMethod || 'Supplier'} Payout (${matchedPay?.receiverName || l.sourceCurrency})`
            : matchedWth
            ? `${matchedWth.bankName ? 'Naira Bank Withdrawal' : 'Wallet Withdrawal'} (${matchedWth.accountName || l.sourceCurrency})`
            : `${l.type} Transaction`;

          return {
            id: l.id,
            title,
            category: l.type === 'FX_SWAP' ? 'FX Swap' : l.type === 'FUND' ? 'Wallet Top-up' : 'Supplier',
            amount: l.amount,
            currency: (l.sourceCurrency as Currency) || 'NGN',
            convertedAmount: l.convertedAmount,
            convertedCurrency: (l.targetCurrency as Currency) || 'CNY',
            date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            timestamp: l.timestamp,
            status: isComplete ? 'completed' : isFailed ? 'failed' : 'processing',
            reference: l.reference,
            recipient: matchedWth?.accountName || matchedPay?.receiverName || (l.type === 'FX_SWAP' ? `${l.sourceCurrency} → ${l.targetCurrency} Vault` : 'Treasury'),
            paymentMethod: chan,
            channel: chan,
            accountNumber: matchedWth?.accountNumber || matchedPay?.receiverAccount,
            bankName: matchedWth?.bankName || matchedPay?.bankName,
            receiptUrl: receipt,
            proofUrl: receipt,
            paymentProofUrl: receipt,
            qrCodeUrl: qr,
            type: l.type === 'FX_SWAP' ? 'swap' : l.type === 'FUND' ? 'fund' : 'pay_supplier'
          };
        });

        // Also include any user withdrawals or supplier payments that are direct documents
        Object.values(withdrawalsMap)
          .filter(w => !w.userId || w.userId === currentUid)
          .forEach(w => {
            if (!dynamicTxs.some(t => t.reference === w.reference || t.id === w.id)) {
              const rawStatus = (w.status || '').toLowerCase();
              const isComplete = rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'successful' || rawStatus === 'disbursed';
              const isFailed = rawStatus === 'rejected' || rawStatus === 'failed' || rawStatus === 'refunded';
              const receipt = w.paymentProofUrl || w.receiptUrl;
              dynamicTxs.unshift({
                id: w.id,
                title: w.channel === 'alipay' ? 'Alipay Payout' : w.channel === 'wechat' ? 'WeChat Pay Payout' : w.channel === 'china_bank' ? 'Chinese Bank Transfer' : 'Naira Bank Withdrawal',
                category: 'Supplier',
                amount: w.amountRMB || w.amountNGN,
                currency: (w.currency as Currency) || (w.amountRMB ? 'CNY' : 'NGN'),
                date: new Date(w.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                timestamp: w.createdAt || Date.now(),
                status: isComplete ? 'completed' : isFailed ? 'failed' : 'processing',
                reference: w.reference || w.id,
                recipient: w.accountName || w.customerName || 'Beneficiary',
                paymentMethod: w.channel || 'Naira Bank Payout',
                channel: w.channel || 'Naira Bank Payout',
                accountNumber: w.accountNumber,
                bankName: w.bankName,
                receiptUrl: receipt,
                proofUrl: receipt,
                paymentProofUrl: receipt,
                qrCodeUrl: w.qrCodeUrl,
                type: 'withdraw'
              });
            }
          });

        Object.values(paymentsMap)
          .filter(p => !p.userId || p.userId === currentUid)
          .forEach(p => {
            if (!dynamicTxs.some(t => t.reference === p.reference || t.id === p.id)) {
              const rawStatus = (p.status || '').toLowerCase();
              const isComplete = rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'successful' || rawStatus === 'disbursed';
              const isFailed = rawStatus === 'rejected' || rawStatus === 'failed' || rawStatus === 'refunded';
              const receipt = p.paymentProofUrl;
              dynamicTxs.unshift({
                id: p.id,
                title: `${p.paymentMethod || 'RMB'} Payout (${p.receiverName})`,
                category: 'Supplier',
                amount: p.amountRMB,
                currency: 'CNY',
                date: new Date(p.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                timestamp: p.createdAt || Date.now(),
                status: isComplete ? 'completed' : isFailed ? 'failed' : 'processing',
                reference: p.reference || p.id,
                recipient: p.receiverName,
                paymentMethod: p.paymentMethod,
                channel: p.paymentMethod,
                accountNumber: p.receiverAccount,
                bankName: p.bankName,
                receiptUrl: receipt,
                proofUrl: receipt,
                paymentProofUrl: receipt,
                qrCodeUrl: p.qrCodeUrl,
                type: 'pay_supplier'
              });
            }
          });

        const existingRefs = new Set(dynamicTxs.map(t => t.reference));
        const fallbackFiltered = INITIAL_TRANSACTIONS.filter(t => !existingRefs.has(t.reference));
        const nextTxs = [...dynamicTxs, ...fallbackFiltered];
        setTransactions((prev) => {
          if (
            prev.length === nextTxs.length &&
            prev.every((t, i) => t.id === nextTxs[i]?.id && t.status === nextTxs[i]?.status && t.amount === nextTxs[i]?.amount && t.receiptUrl === nextTxs[i]?.receiptUrl)
          ) {
            return prev;
          }
          return nextTxs;
        });
      }

      // Live In-App Notifications synchronization from State
      const notifTargetUid = activeUserId || 'usr_alade_01';
      const dbNotifs = (db.getState().notifications || []).filter((n: any) => !n.targetUserId && !n.userId || n.targetUserId === notifTargetUid || n.userId === notifTargetUid);
      if (dbNotifs && dbNotifs.length > 0) {
        const mappedNotifs: AppNotification[] = dbNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.time || 'Just now',
          read: !!n.read,
          type: (n.type as any) || 'system',
          linkRoute: n.linkRoute
        }));
        setNotifications((prev) => {
          const merged = [...mappedNotifs];
          for (const p of prev) {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          }
          if (prev.length === merged.length && prev.every((p, i) => p.id === merged[i]?.id && p.read === merged[i]?.read)) {
            return prev;
          }
          return merged;
        });
      }
    };

    db.fetchWarehouses(true).then((whs) => {
      if (whs && whs.length > 0) {
        setWarehouses((prev) => {
          if (
            prev.length === whs.length &&
            prev.every((w, i) => w.id === whs[i]?.id && w.isActive === whs[i]?.isActive)
          ) {
            return prev;
          }
          return whs;
        });
      }
    });

    syncFromDb();
    const unsubscribe = db.subscribe(syncFromDb);
    return () => {
      unsubscribe();
    };
  }, []);

  // Browser History & URL route synchronization
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      const uid = urlParams.get('userId');
      if (uid && db.getUser(uid)) {
        setActiveUserId(uid);
      }

      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
        if (e.state.param !== undefined) {
          setRouteParam(e.state.param);
        }
      } else {
        const initial = getInitialRoute();
        setCurrentRoute(initial);
      }

      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        try {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const mainEl = document.querySelector('main');
          if (mainEl) mainEl.scrollTop = 0;
        } catch (_) {}
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('flyemass_wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('flyemass_cart', JSON.stringify(cart));
      } catch (e) {
        console.warn('Failed to persist cart to localStorage', e);
      }
    }
  }, [cart]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const navigate = useCallback((route: ScreenRoute, param?: string) => {
    let targetRoute = route;
    if ((route as string) === '/cart' || (route as string) === '/shop/cart') targetRoute = 'cart';
    if ((route as string) === '/checkout' || (route as string) === '/shop/checkout') targetRoute = 'checkout';
    if ((route as string) === '/shop/product' || (route as string) === '/product') targetRoute = 'product-detail';

    // Interactive Modal Popup Trigger for Currency Swap across all views
    if (targetRoute === 'exchange' || (route as string) === '/exchange') {
      openSwapModal();
      return;
    }

    const isAdmin = isAdminEnvironment();

    // Security Guard 1: Customer app cannot access admin routes
    if (!isAdmin && (targetRoute.startsWith('admin-') || targetRoute === 'schema-inspector')) {
      showToast('Access Denied: Admin operations are restricted to https://admin.flyemass.com', 'error');
      setCurrentRoute('home');
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({ route: 'home' }, '', '/home');
      }
      return;
    }

    // Security Guard 2: Admin app cannot accidentally navigate to customer screens
    if (isAdmin && !targetRoute.startsWith('admin-') && targetRoute !== 'schema-inspector') {
      setCurrentRoute('admin-dashboard');
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({ route: 'admin-dashboard' }, '', '/admin');
      }
      return;
    }

    if (param !== undefined) {
      setRouteParam(param);
    }
    setRouteHistory((prev) => [...prev, targetRoute]);
    setCurrentRoute(targetRoute);

    const targetPath = ROUTE_TO_PATH[targetRoute] || `/${targetRoute}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ route: targetRoute, param }, '', targetPath);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTop = 0;
        }
      } catch (_) {}
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        try {
          const mainEl = document.querySelector('main');
          if (mainEl) mainEl.scrollTop = 0;
        } catch (_) {}
      });
      setTimeout(() => {
        window.scrollTo(0, 0);
        try {
          const mainEl = document.querySelector('main');
          if (mainEl) mainEl.scrollTop = 0;
        } catch (_) {}
      }, 50);
    }
  }, [openSwapModal, showToast]);

  const prefetchRoute = useCallback((route: ScreenRoute) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flyemass:prefetch-route', { detail: { route } }));
    }
  }, []);

  const refreshWarehouses = useCallback(() => db.fetchWarehouses(true), []);

  const goBack = useCallback(() => {
    setRouteHistory((prev) => {
      if (prev.length > 1) {
        const nextHistory = [...prev];
        nextHistory.pop();
        const previous = nextHistory[nextHistory.length - 1];
        setCurrentRoute(previous);
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
          try {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const mainEl = document.querySelector('main');
            if (mainEl) {
              mainEl.scrollTop = 0;
            }
          } catch (_) {}
          requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            try {
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTop = 0;
            } catch (_) {}
          });
          setTimeout(() => {
            window.scrollTo(0, 0);
            try {
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTop = 0;
            } catch (_) {}
          }, 50);
        }
        return nextHistory;
      } else {
        setCurrentRoute('home');
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
          try {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const mainEl = document.querySelector('main');
            if (mainEl) {
              mainEl.scrollTop = 0;
            }
          } catch (_) {}
          requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            try {
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTop = 0;
            } catch (_) {}
          });
          setTimeout(() => {
            window.scrollTo(0, 0);
            try {
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTop = 0;
            } catch (_) {}
          }, 50);
        }
        return ['home'];
      }
    });
  }, []);

  const toggleBalancePrivacy = useCallback(() => {
    setIsBalanceHidden((prev) => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleFrameMockup = useCallback(() => {
    setIsFrameMockup((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('flyemass_frame_mockup', String(next));
      }
      return next;
    });
  }, []);

  const login = async (identifier?: string, password?: string) => {
    try {
      const res = await db.loginUser(identifier || activeUserId, password);
      if (!res.success) {
        showToast(res.error || 'Authentication rejected', 'error');
        return false;
      }
      if (res.user?.isSuspended) {
        showToast(`Account Suspended: ${res.user.suspensionReason || 'Compliance hold active'}`, 'error');
        return false;
      }
      setIsAuthenticated(true);
      if (res.user?.uid) {
        switchUser(res.user.uid);
      }
      try {
        await supabaseAuth.setSession({
          user: {
            id: res.user?.uid || activeUserId,
            email: res.user?.email || 'user@flyemass.com'
          },
          token: `fms_${Date.now()}`
        });
      } catch (e) {}
      navigate('home');
      showToast('Authenticated successfully with Biometrics / Password', 'success');
      return true;
    } catch (e: any) {
      const user = db.getUser(activeUserId);
      if (user?.isSuspended) {
        showToast('Account is currently suspended. Access denied.', 'error');
        return false;
      }
      setIsAuthenticated(true);
      try {
        await supabaseAuth.setSession({
          user: {
            id: user?.uid || activeUserId,
            email: user?.email || 'user@flyemass.com'
          },
          token: `fms_${Date.now()}`
        });
      } catch (e) {}
      navigate('home');
      showToast('Authenticated successfully (Secure Session)', 'success');
      return true;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      supabaseAuth.signOut();
    } catch (e) {}
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

    const calculatedRate = toAmount / fromAmount;

    db.executeSwap(activeUserId, from, to, fromAmount, toAmount, calculatedRate).then((res) => {
      if (res && res.error) {
        showToast(res.error, 'error');
      } else {
        addTransaction({
          title: `FX Swap: ${from} to ${to}`,
          category: 'FX Swap',
          amount: fromAmount,
          currency: from,
          convertedAmount: toAmount,
          convertedCurrency: to,
          status: 'completed',
          reference: res?.reference || `SWP-${from}-${to}-${Math.floor(1000 + Math.random() * 9000)}`,
          recipient: 'FlyeMass Instant Liquidity Pool',
          paymentMethod: 'Instant FX Rate Lock Engine',
          type: 'swap'
        });
        showToast(`Swapped ${fromWallet.symbol}${fromAmount.toLocaleString()} to ${to} successfully!`, 'success');
      }
    }).catch(() => {
      showToast('Swap communication error', 'error');
    });

    return true;
  };

  const fundWallet = (currency: Currency, amount: number, method: string) => {
    db.fundWallet(activeUserId, currency, amount, method).then((res) => {
      if (res && res.error) {
        showToast(res.error, 'error');
      } else {
        addTransaction({
          title: `Deposit via ${method}`,
          category: 'Wallet Top-up',
          amount,
          currency,
          status: 'completed',
          reference: res?.reference || `TOPUP-${Date.now().toString().slice(-6)}`,
          recipient: `${userProfile.name} ${currency} Vault`,
          paymentMethod: method,
          type: 'fund'
        });
        showToast(`Wallet credited with ${currency === 'NGN' ? '₦' : currency === 'CNY' ? '¥' : '$'}${amount.toLocaleString()}!`, 'success');
      }
    }).catch(() => {
      showToast('Funding communication error', 'error');
    });
  };

  const paySupplier = (supplierName: string, method: string, amountCNY: number, note: string): boolean => {
    const cnyWallet = wallets.find((w) => w.currency === 'CNY');
    if (!cnyWallet || cnyWallet.balance < amountCNY) {
      showToast('Insufficient Chinese Yuan (RMB) balance. Swap NGN/USD first!', 'error');
      return false;
    }

    db.paySupplier(activeUserId, supplierName, '13800138000', method, amountCNY, note).then((res) => {
      if (res && res.error) {
        showToast(res.error, 'error');
      } else {
        addTransaction({
          title: `Supplier Payment: ${supplierName}`,
          category: 'Supplier',
          amount: amountCNY,
          currency: 'CNY',
          status: 'completed',
          reference: res?.reference || `PAY-${supplierName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          recipient: supplierName,
          paymentMethod: method,
          type: 'pay_supplier'
        });
        showToast(`¥${amountCNY.toLocaleString()} transferred to ${supplierName} via ${method}!`, 'success');
      }
    }).catch(() => {
      showToast('Supplier payment error', 'error');
    });

    return true;
  };

  const withdrawToBank = (bankName: string, accountNumber: string, accountName: string, amountNGN: number): boolean => {
    const ngnWallet = wallets.find((w) => w.currency === 'NGN');
    const fee = 500; // Authoritative Flat fee
    const totalDeduction = amountNGN + fee;

    if (!ngnWallet || ngnWallet.balance < totalDeduction) {
      showToast(`Insufficient NGN wallet balance including ₦${fee} flat transfer fee`, 'error');
      return false;
    }

    db.requestWithdrawal(activeUserId, bankName, accountNumber, accountName, amountNGN).then((res) => {
      if (res && res.error) {
        showToast(res.error, 'error');
      } else {
        addTransaction({
          title: `Withdrawal to ${bankName}`,
          category: 'Wallet Top-up',
          amount: amountNGN,
          currency: 'NGN',
          status: 'completed',
          reference: res?.withdrawal?.transferReference || `WTH-${Date.now().toString().slice(-6)}`,
          recipient: `${accountName} (${accountNumber})`,
          paymentMethod: 'NIBSS Instant Transfer',
          type: 'withdraw'
        });
        showToast(`Payout of ₦${amountNGN.toLocaleString()} queued for clearance!`, 'success');
      }
    }).catch(() => {
      showToast('Withdrawal communication error', 'error');
    });

    return true;
  };

  const registerPackage = async (data: any) => {
    try {
      const res = await db.registerShipment({
        userId: activeUserId || 'usr_alade_01',
        receiverName: userProfile.name,
        customerPhone: userProfile.phone,
        ...data
      });
      showToast(`Package pre-alert registered! Code: ${res.shipment?.shipmentCode || res.shipment?.trackingNumber}`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to register package', 'error');
      throw err;
    }
  };

  const addToCart = (product: TechProduct, selectedColor?: string, selectedStorage?: string, variant?: any, quantity: number = 1) => {
    if (!product) return;

    const variantsList = Array.isArray(product.variants) ? product.variants : [];
    const inStockVariant = variantsList.find(v => (v.stockCount ?? 0) > 0 && v.isActive !== false);
    const defaultVariant = inStockVariant || variantsList[0];

    const color = selectedColor || 
      variant?.color || 
      defaultVariant?.color || 
      (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name) || 
      'Standard';

    const storage = selectedStorage || 
      variant?.storage || 
      defaultVariant?.storage || 
      product.storage ||
      product.storageOptions?.[0] || 
      'Standard';

    const activeVariant = variant || 
      (variant?.id ? variantsList.find(v => v.id === variant.id) : undefined) ||
      variantsList.find(v => v.color === color && v.storage === storage) || 
      defaultVariant;

    const variantId = activeVariant?.id;
    const priceAdjustmentNGN = activeVariant?.priceAdjustmentNGN !== undefined 
      ? activeVariant.priceAdjustmentNGN 
      : 0;
    const rates = db.getState().system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };
    const basePriceNGN = product.priceNGN || Math.round((product.priceUSD || 0) * (rates.USD_NGN || 1485));
    const unitPriceNGN = basePriceNGN + priceAdjustmentNGN;

    const qty = Math.max(1, quantity || 1);

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (variantId ? item.variantId === variantId : (item.selectedColor === color && item.selectedStorage === storage))
      );

      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + qty } : item
        );
      } else {
        updated = [
          ...prev,
          {
            id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            product,
            quantity: qty,
            variantId,
            selectedColor: color,
            selectedStorage: storage,
            priceAdjustmentNGN,
            unitPriceNGN
          }
        ];
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('flyemass_cart', JSON.stringify(updated));
        } catch (e) {}
      }
      db.syncCloudCart(activeUserId, updated).catch(() => {});
      return updated;
    });
    showToast(`Added ${qty > 1 ? `${qty}x ` : ''}${product.title} (${color}, ${storage}) to Cart`, 'success');
  };

  const updateCartQuantity = (productIdOrCartItemId: string, delta: number, variantId?: string) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          const isMatch = (item.id && item.id === productIdOrCartItemId) ||
            (item.product.id === productIdOrCartItemId && (variantId ? item.variantId === variantId : true));
          if (isMatch) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('flyemass_cart', JSON.stringify(updated));
        } catch (e) {}
      }
      db.syncCloudCart(activeUserId, updated).catch(() => {});
      return updated;
    });
  };

  const removeFromCart = (productIdOrCartItemId: string, variantId?: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => {
        if (item.id && item.id === productIdOrCartItemId) return false;
        if (item.product.id === productIdOrCartItemId && (variantId ? item.variantId === variantId : true)) return false;
        return true;
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('flyemass_cart', JSON.stringify(updated));
        } catch (e) {}
      }
      db.syncCloudCart(activeUserId, updated).catch(() => {});
      return updated;
    });
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('flyemass_cart');
      } catch (e) {}
    }
    db.syncCloudCart(activeUserId, []).catch(() => {});
  };

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      db.toggleUserFavorite(activeUserId, productId).catch(() => {});
      showToast(exists ? 'Item removed from Wishlist' : 'Item added to Wishlist!', exists ? 'info' : 'success');
      return updated;
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

  const placeShopOrder = (paidWith: Currency, destinationAddress: string, pin?: string): boolean => {
    if (cart.length === 0) return false;
    
    const settings = db.getShopSettings();
    const deliveryFeeNGN = settings.deliveryFeeNGN || 5000;
    const rates = db.getState().system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

    // Accurate subtotal with variant price adjustments
    const subtotalNGN = cart.reduce((sum, item) => {
      const base = item.product.priceNGN || (item.product.priceUSD * rates.USD_NGN);
      const adj = item.priceAdjustmentNGN || 0;
      return sum + ((base + adj) * item.quantity);
    }, 0);

    const totalNGN = subtotalNGN + deliveryFeeNGN;
    const totalUSD = Math.round(totalNGN / rates.USD_NGN);
    const totalCNY = Math.round((totalNGN / rates.USD_NGN) * rates.USD_CNY);

    const walletToDebit = wallets.find((w) => w.currency === paidWith);
    const requiredAmount = paidWith === 'USD' ? totalUSD : paidWith === 'CNY' ? totalCNY : totalNGN;

    if (!walletToDebit || walletToDebit.balance < requiredAmount) {
      showToast(`Insufficient ${paidWith} balance to complete purchase`, 'error');
      return false;
    }

    const openingBal = walletToDebit.balance;
    const newBal = openingBal - requiredAmount;
    db.updateUserBalances(activeUserId, {
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

    // Call authoritative endpoint
    db.checkoutShopWithPin(activeUserId, cart, requiredAmount, paidWith, destinationAddress, pin);

    // Decrement variant stock
    cart.forEach(item => {
      if (item.variantId) {
        db.updateVariantStock(item.product.id, item.variantId, -item.quantity);
      } else {
        db.updateProductStock(item.product.id, -item.quantity);
      }
    });

    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: ShopOrder = {
      id: `ord-tech-${Date.now()}`,
      orderNumber,
      items: [...cart],
      totalUSD,
      totalNGN,
      paidWith,
      date: 'Today, Just now',
      status: 'Processing',
      step: 0,
      destinationAddress,
      trackingNumber
    };

    setShopOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.id);

    db.recordShopOrder({
      userId: activeUserId,
      items: [...cart],
      subtotalNGN,
      deliveryFeeNGN,
      totalAmount: requiredAmount,
      currency: paidWith,
      deliveryAddress: destinationAddress,
      paymentWalletUsed: paidWith,
      fulfillmentStatus: 'pending',
      orderNumber: newOrder.orderNumber,
      trackingNumber: newOrder.trackingNumber,
      courierName: 'FlyeMass Express Air Cargo',
      timeline: [
        {
          status: 'pending',
          title: 'Order Confirmed',
          description: 'Payment verified and inventory allocated in Hong Kong Logistics Hub',
          timestamp: Date.now(),
          location: 'Hong Kong Logistics Hub'
        }
      ]
    });

    clearCart();

    addTransaction({
      title: `Apple Shop: ${cart[0].product.title}${cart.length > 1 ? ` (+${cart.length - 1} items)` : ''}`,
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

    db.createSupportTicket(
      ticket.subject,
      ticket.category,
      ticket.priority,
      ticket.message,
      activeUserId || 'usr_alade_01'
    ).catch(() => {
      db.recordSupportTicket({
        userId: activeUserId || 'usr_alade_01',
        subject: ticket.subject,
        status: 'open',
        category: ticket.category,
        priority: ticket.priority,
        ticketNumber: newTkt.ticketNumber,
        messages: [
          {
            senderId: activeUserId || 'usr_alade_01',
            senderName: userProfile.name,
            text: ticket.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAdmin: false
          }
        ]
      });
    });

    showToast(`Support ticket ${newTkt.ticketNumber} created!`, 'success');
  };

  const addTicketMessage = (ticketId: string, text: string, attachment?: { url: string; fileName: string; fileType: string }) => {
    if (!text.trim() && !attachment) return;

    setSupportTickets((prev) =>
      prev.map((tkt) => {
        if (tkt.id === ticketId) {
          const userMsg = {
            sender: 'user' as const,
            senderName: userProfile.name,
            text: text.trim() || (attachment ? `Attached file: ${attachment.fileName}` : ''),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachmentUrl: attachment?.url,
            attachmentName: attachment?.fileName,
            attachmentType: attachment?.fileType
          };

          db.addTicketMessage(ticketId, {
            senderId: 'usr_alade_01',
            senderName: userProfile.name,
            text: userMsg.text,
            isAdmin: false,
            attachmentUrl: attachment?.url,
            attachmentName: attachment?.fileName,
            attachmentType: attachment?.fileType
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

  const bookHotel = (hotel: Hotel, nights: number, currency: Currency = 'USD', pin?: string): boolean => {
    const totalUSD = hotel.pricePerNightUSD * nights;
    const requiredDebit = currency === 'NGN' ? totalUSD * 1485 : currency === 'CNY' ? totalUSD * 7.24 : totalUSD;
    const targetWallet = wallets.find((w) => w.currency === currency);
    if (!targetWallet || targetWallet.balance < requiredDebit) {
      showToast(`Insufficient balance in ${currency} wallet`, 'error');
      return false;
    }

    const openingBal = targetWallet.balance;
    const newBal = openingBal - requiredDebit;

    db.updateUserBalances(activeUserId, {
      [currency]: newBal
    });

    setWallets((prev) =>
      prev.map((w) => (w.currency === currency ? { ...w, balance: newBal } : w))
    );

    // Call authoritative backend endpoint
    db.bookHotelWithPin(activeUserId, hotel, nights, totalUSD, currency, userProfile.name, pin);

    const confCode = `FM-${hotel.city.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBooking: HotelBooking = {
      id: `BK-${hotel.city.toUpperCase().slice(0, 2)}-${Date.now()}`,
      hotel,
      checkIn: 'Nov 15, 2026',
      checkOut: `Nov ${15 + nights}, 2026`,
      nights,
      totalUSD,
      guestName: userProfile.name,
      confirmationCode: confCode,
      status: 'Confirmed',
      taxiCardZh: `师傅您好，请带我到：${hotel.chineseName} (${hotel.district})。谢谢！`
    };

    setHotelBookings((prev) => [newBooking, ...prev]);

    db.recordHotelBooking({
      ...newBooking,
      userId: activeUserId,
      currency,
      amountDebited: requiredDebit
    });

    db.recordLedgerEntry({
      userId: activeUserId,
      type: 'HOTEL_BOOKING' as any,
      sourceCurrency: currency,
      targetCurrency: currency,
      amount: requiredDebit,
      fee: 0,
      openingBalance: openingBal,
      closingBalance: newBal,
      status: 'completed',
      reference: confCode,
      notes: `Reservation: ${hotel.name} (${nights} nights)`
    });

    addTransaction({
      title: `Hotel Booking: ${hotel.name}`,
      category: 'Logistics',
      amount: requiredDebit,
      currency,
      status: 'completed',
      reference: confCode,
      recipient: hotel.name,
      paymentMethod: `${currency} Wallet Direct`,
      type: 'cargo_freight'
    });

    showToast(`Reservation confirmed at ${hotel.name}!`, 'success');
    return true;
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

    // Dispatch to Gemini API AI Concierge & Trade Support backend
    db.sendConciergeChat(text, selectedTicketId || 'tkt_8901', activeUserId, userProfile.name)
      .then((res) => {
        if (res && res.aiMessage) {
          const aiReply: ChatMessage = {
            id: `msg-reply-${Date.now()}`,
            sender: 'support',
            senderName: res.aiMessage.senderName || 'Chen Wei (Trade AI)',
            text: res.aiMessage.text || 'Trade AI is momentarily busy. Please try again or tap to escalate to human support.',
            timestamp: res.aiMessage.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages((prev) => [...prev, aiReply]);
        }
      })
      .catch((err) => {
        console.error('[sendChatMessage Dispatch Error]:', err);
        const botReply: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          sender: 'support',
          senderName: 'Chen Wei (Trade AI)',
          text: 'Trade AI is momentarily busy. Please try again or tap to escalate to human support.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => [...prev, botReply]);
      });
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        prefetchRoute,
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
        shopCurrency,
        setShopCurrency,
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
        warehouses,
        refreshWarehouses,
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
        pendingSignup,
        setPendingSignup,
        userProfile,
        setUserProfile,
        activeUserId,
        switchUser,
        viewAsClient,
        adminUser,
        loginAdmin,
        logoutAdmin,
        language,
        setLanguage,
        t,
        getRouteTitle,
        isSwapModalOpen,
        setIsSwapModalOpen,
        swapModalInitialPair,
        openSwapModal,
        closeSwapModal
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
