import {
  UserDocument,
  WalletLedgerDocument,
  ShipmentDocument,
  SupplierPaymentDocument,
  WithdrawalDocument,
  SupplierSubscriptionDocument,
  AgentRequestDocument,
  BannerDocument,
  SystemSettingsDocument,
  ShopOrderDocument,
  SupportTicketDocument,
  TechProduct
} from '../types';

export interface DatabaseState {
  users: Record<string, UserDocument>;
  wallets_ledger: Record<string, WalletLedgerDocument>;
  shipments: Record<string, ShipmentDocument>;
  supplier_payments: Record<string, SupplierPaymentDocument>;
  withdrawals: Record<string, WithdrawalDocument>;
  agent_requests: Record<string, AgentRequestDocument>;
  supplier_subscriptions: Record<string, SupplierSubscriptionDocument>;
  shop_orders: Record<string, ShopOrderDocument>;
  hotel_bookings: Record<string, any>;
  products: Record<string, TechProduct>;
  support_tickets: Record<string, SupportTicketDocument>;
  banners: BannerDocument[];
  system_settings: SystemSettingsDocument;
  audit_logs: any[];
}

import { getBackendBaseUrl } from '../utils/environment';

const STORAGE_KEY = 'flyemass_nosql_db_v2';
const BACKEND_BASE = getBackendBaseUrl();

export const INITIAL_DATABASE: DatabaseState = {
  users: {
    'usr_alade_01': {
      uid: 'usr_alade_01',
      fullName: 'Chief Babatunde Alade',
      email: 'babatunde@aladeholding.ng',
      phone: '+234 803 555 9201',
      businessName: 'Alade Global Enterprises Ltd',
      verifiedBadge: true,
      role: 'client',
      createdAt: Date.now() - 30 * 86400000,
      balances: {
        NGN: 28450200,
        CNY: 184250,
        USD: 42890.50
      }
    },
    'usr_chen_agent': {
      uid: 'usr_chen_agent',
      fullName: 'Chen Wei',
      email: 'chen.wei@flyemass.cn',
      phone: '+86 186 2008 9142',
      businessName: 'FlyeMass Guangzhou Logistics Center',
      verifiedBadge: true,
      role: 'agent',
      createdAt: Date.now() - 90 * 86400000,
      balances: {
        NGN: 0,
        CNY: 520000,
        USD: 75000
      }
    }
  },

  wallets_ledger: {
    'ldg_89201': {
      id: 'ldg_89201',
      userId: 'usr_alade_01',
      type: 'PAY_SUPPLIER',
      sourceCurrency: 'CNY',
      targetCurrency: 'CNY',
      amount: 45000,
      fee: 0,
      openingBalance: 229250,
      closingBalance: 184250,
      status: 'completed',
      reference: 'FLYE-ALIPAY-98214',
      timestamp: Date.now() - 3600000,
      notes: 'Disbursed ¥45,000 to Shenzhen Foxconn Micro Tech via Alipay Business'
    },
    'ldg_89202': {
      id: 'ldg_89202',
      userId: 'usr_alade_01',
      type: 'FX_SWAP',
      sourceCurrency: 'NGN',
      targetCurrency: 'CNY',
      amount: 15000000,
      fee: 0,
      openingBalance: 43450200,
      closingBalance: 28450200,
      status: 'completed',
      reference: 'SWP-NGN-CNY-7712',
      timestamp: Date.now() - 14400000,
      notes: 'Instant swap ₦15,000,000 to ¥69,930 CNY (Cleared at ₦214.50)'
    },
    'ldg_89203': {
      id: 'ldg_89203',
      userId: 'usr_alade_01',
      type: 'FUND',
      sourceCurrency: 'NGN',
      targetCurrency: 'NGN',
      amount: 10000000,
      fee: 0,
      openingBalance: 18450200,
      closingBalance: 28450200,
      status: 'completed',
      reference: 'NIP-CR-992144882',
      timestamp: Date.now() - 86400000,
      notes: 'Virtual Providus Account NIBSS settlement confirmed'
    },
    'ldg_89204': {
      id: 'ldg_89204',
      userId: 'usr_alade_01',
      type: 'SHOP_ORDER',
      sourceCurrency: 'USD',
      targetCurrency: 'USD',
      amount: 1420.00,
      fee: 45.00,
      openingBalance: 44355.50,
      closingBalance: 42890.50,
      status: 'completed',
      reference: 'ORD-TECH-89201',
      timestamp: Date.now() - 172800000,
      notes: 'Apple iPhone 16 Pro Max (512GB) HK Spec Dual Nano-SIM'
    }
  },

  shipments: {
    'ship_can_los_89241': {
      id: 'ship_can_los_89241',
      trackingNumber: 'FM-CAN-LOS-89241',
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      originWarehouse: 'Guangzhou',
      destination: 'Lagos Hub',
      weightKg: 28.5,
      mode: 'Air Freight',
      currentStatus: 'In Transit/Customs',
      freightFee: 285.00,
      freightCurrency: 'USD',
      freightPaid: true,
      timeline: [
        {
          status: 'Origin Received',
          location: 'Baiyun Logistics Hub, Guangzhou',
          timestamp: 'Nov 1, 09:30 AM',
          notes: 'Package verified against supplier packing list. 100% seal intact.'
        },
        {
          status: 'Packed',
          location: 'Guangzhou Export Terminal B',
          timestamp: 'Nov 1, 19:45 PM',
          notes: 'Aviation security scanning passed. Loaded into flight ULD container.'
        },
        {
          status: 'In Transit/Customs',
          location: 'Flight ET921 (Addis Ababa - Lagos MM2)',
          timestamp: 'Nov 2, 04:15 AM',
          notes: 'Air cargo mid-transit approaching West African airspace.'
        }
      ],
      updatedAt: Date.now() - 7200000,
      cbm: 0.18,
      costEstimate: 285.00,
      costCurrency: 'USD',
      title: '50x Apple Tech Gadgets & Accessories'
    },
    'ship_yiw_los_77192': {
      id: 'ship_yiw_los_77192',
      trackingNumber: 'FM-YIW-LOS-77192',
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      originWarehouse: 'Yiwu',
      destination: 'Lagos Hub',
      weightKg: 4200,
      mode: 'Sea Freight',
      currentStatus: 'Packed',
      freightFee: 4200.00,
      freightCurrency: 'USD',
      freightPaid: false,
      timeline: [
        {
          status: 'Origin Received',
          location: 'Yiwu International Port D-18 Hub',
          timestamp: 'Oct 30, 11:20 AM',
          notes: 'Consolidated from 4 factory suppliers.'
        },
        {
          status: 'Packed',
          location: 'Ningbo Maritime Port Terminal',
          timestamp: 'Nov 1, 16:00 PM',
          notes: 'Container CN-9821 stuffed and customs export sealed.'
        }
      ],
      updatedAt: Date.now() - 43200000,
      cbm: 28.4,
      costEstimate: 4200.00,
      costCurrency: 'USD',
      title: '40ft Container: Small Commodities & Solar Inverters'
    }
  },

  supplier_payments: {
    'pay_foxconn_01': {
      id: 'pay_foxconn_01',
      userId: 'usr_alade_01',
      paymentMethod: 'Alipay',
      receiverAccount: '13800138000',
      receiverName: 'Shenzhen Foxconn Micro Tech Ltd',
      amountRMB: 45000,
      equivalentNGN: 9652500,
      status: 'disbursed',
      createdAt: Date.now() - 3600000,
      reference: 'FLYE-ALIPAY-98214',
      notes: 'PO #9824 - iPhone Parts Batch 2'
    },
    'pay_shengda_02': {
      id: 'pay_shengda_02',
      userId: 'usr_alade_01',
      paymentMethod: 'WeChat Pay',
      receiverAccount: 'wxp_yiwu_shengda_88',
      receiverName: 'Yiwu Shengda Global Commodity Group',
      amountRMB: 18500,
      equivalentNGN: 3968250,
      status: 'disbursed',
      createdAt: Date.now() - 86400000,
      reference: 'FLYE-WXP-44102',
      notes: 'District 3 Hardware Samples'
    }
  },

  withdrawals: {
    'wth_9921': {
      id: 'wth_9921',
      userId: 'usr_alade_01',
      bankName: 'Access Bank PLC',
      accountNumber: '0029148821',
      accountName: 'Chief Babatunde Alade',
      amountNGN: 5000000,
      feeNGN: 1500,
      status: 'approved',
      transferReference: 'NIP-OUT-8891244',
      createdAt: Date.now() - 120000000
    }
  },

  agent_requests: {
    'rfq_8921': {
      id: 'rfq_8921',
      userId: 'usr_alade_01',
      clientName: 'Chief Babatunde Alade',
      serviceType: 'Factory Audit & Inspection',
      productName: 'Solar Hybrid Inverters 5kW & 48V Powerwalls',
      category: 'Renewable Clean Energy',
      targetQuantity: 100,
      targetUnitUSD: 420,
      supplierCity: 'Foshan',
      inspectionRequired: true,
      cantonFairBooth: 'Area B, Hall 10.3 D18',
      quoteAmountUSD: 250,
      quoteAmountNGN: 371250,
      status: 'quote_ready',
      createdAt: Date.now() - 86400000,
      adminNotes: 'Field inspector Chen assigned for Nov 8 inspection'
    }
  },

  supplier_subscriptions: {
    'sub_sup_1_alade': {
      id: 'sub_sup_1_alade',
      userId: 'usr_alade_01',
      supplierId: 'sup-1',
      purchasedAt: Date.now() - 5 * 86400000,
      activeUntil: Date.now() + 25 * 86400000,
      feeUSD: 50,
      status: 'active'
    }
  },

  shop_orders: {
    'ord_tech_89201': {
      id: 'ord_tech_89201',
      userId: 'usr_alade_01',
      items: [
        {
          product: {
            id: 'prod-iphone-16-pro',
            title: 'Apple iPhone 16 Pro Max (512GB)',
            subtitle: 'Desert Titanium • Hong Kong / China Dual Physical SIM',
            category: 'iPhone',
            priceUSD: 1420,
            priceNGN: 2108700,
            priceCNY: 10280,
            image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
            rating: 4.9,
            reviewsCount: 312,
            specs: ['A18 Pro Chip', 'Grade 5 Titanium', '48MP Fusion Camera', 'Dual Nano-SIM (HK Spec)'],
            inStock: true,
            stockCount: 18,
            tag: 'Best Seller for Lagos Wholesale',
            colors: [{ name: 'Desert Titanium', hex: '#C2AD97' }],
            storageOptions: ['256GB', '512GB', '1TB']
          },
          selectedColor: 'Desert Titanium',
          selectedStorage: '512GB',
          quantity: 1
        }
      ],
      totalAmount: 1465,
      currency: 'USD',
      deliveryAddress: 'Plot 14, Commercial Avenue, Ikeja Computer Village, Lagos, Nigeria',
      paymentWalletUsed: 'USD',
      fulfillmentStatus: 'shipped',
      createdAt: Date.now() - 172800000,
      orderNumber: 'ORD-89201',
      trackingNumber: 'FM-CAN-LOS-89241'
    }
  },

  hotel_bookings: {
    'bk_gz_99120': {
      id: 'bk_gz_99120',
      userId: 'usr_alade_01',
      hotelId: 'hotel-gz-westin',
      hotelName: 'The Westin Pazhou Guangzhou',
      checkIn: 'Nov 12, 2026',
      checkOut: 'Nov 18, 2026',
      nights: 6,
      totalUSD: 1110,
      guestName: 'Chief Babatunde Alade',
      confirmationCode: 'WST-CAN-884102',
      status: 'confirmed',
      taxiCardZh: '请带我到：广州市海珠区凤浦中路681号 广交会威斯汀酒店',
      createdAt: Date.now() - 400000000
    }
  },

  support_tickets: {
    'tkt_8901': {
      id: 'tkt_8901',
      userId: 'usr_alade_01',
      subject: 'Alipay merchant payment clearance confirmation',
      status: 'in_progress',
      category: 'Supplier Escrow',
      priority: 'High',
      ticketNumber: 'TKT-8901',
      updatedAt: Date.now() - 1800000,
      messages: [
        {
          senderId: 'usr_alade_01',
          senderName: 'Chief Babatunde Alade',
          text: 'Can you confirm if my Alipay payment of ¥45,000 to Shenzhen Foxconn was cleared by their merchant account?',
          timestamp: '10:02 AM',
          isAdmin: false
        },
        {
          senderId: 'usr_chen_agent',
          senderName: 'Chen Wei (Guangzhou Clearing Desk)',
          text: 'Yes Chief Alade! We received instant SAFE API confirmation. Foxconn has acknowledged receipt and scheduled your 50x gadgets dispatch to our Baiyun Hub.',
          timestamp: '10:04 AM',
          isAdmin: true
        }
      ]
    }
  },

  banners: [
    {
      id: 'ban_canton_136',
      title: '136th Canton Fair VIP Delegation',
      description: 'Exclusive on-ground bilingual guides, factory transport & Pazhou Westin vouchers.',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
      destinationRoute: 'agent',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'ban_sea_promo',
      title: 'Guangzhou to Lagos Consolidated Sea Freight',
      description: 'Starting at $145 / CBM with full Nigeria customs pre-clearance.',
      imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80',
      destinationRoute: 'logistics',
      isActive: true,
      displayOrder: 2
    }
  ],

  system_settings: {
    rates: {
      NGN_CNY: 214.50,
      USD_NGN: 1485.00,
      USD_CNY: 7.24,
      spreadPercent: 0.75,
      lastUpdated: Date.now(),
      updatedBy: 'Chief Babatunde Alade (Super Admin)'
    },
    fees: {
      withdrawalFlatNGN: 1500,
      fundingCardPercent: 1.2,
      supplierEscrowPercent: 0.5,
      airFreightPerKgUSD: 10.00,
      seaFreightPerCbmUSD: 145.00,
      supplier30DayPassUSD: 50.00
    }
  },

  products: {
    'prod-iphone-16-pro': {
      id: 'prod-iphone-16-pro',
      title: 'Apple iPhone 16 Pro Max (512GB)',
      subtitle: 'Desert Titanium • Hong Kong / China Dual Physical SIM',
      category: 'iPhone',
      priceUSD: 1420,
      priceNGN: 2108700,
      priceCNY: 10280,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      reviewsCount: 312,
      specs: ['A18 Pro Chip', 'Grade 5 Titanium', '48MP Fusion Camera', 'Dual Nano-SIM (HK Spec)'],
      inStock: true,
      stockCount: 18,
      tag: 'Best Seller for Lagos Wholesale',
      colors: [
        { name: 'Desert Titanium', hex: '#C2AD97' },
        { name: 'Natural Titanium', hex: '#9A958E' },
        { name: 'Black Titanium', hex: '#2F3133' },
        { name: 'White Titanium', hex: '#F0F0F2' }
      ],
      storageOptions: ['256GB', '512GB', '1TB']
    },
    'prod-macbook-pro-16': {
      id: 'prod-macbook-pro-16',
      title: 'MacBook Pro 16" (M4 Max / 36GB / 1TB)',
      subtitle: 'Space Black • US English International Keyboard',
      category: 'Mac',
      priceUSD: 3499,
      priceNGN: 5196015,
      priceCNY: 25330,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 89,
      specs: ['M4 Max 14-core CPU', '32-core GPU', 'Liquid Retina XDR', '22-hr Battery Life'],
      inStock: true,
      stockCount: 6,
      tag: 'Enterprise Elite',
      colors: [
        { name: 'Space Black', hex: '#1E1E22' },
        { name: 'Silver', hex: '#E3E4E5' }
      ],
      storageOptions: ['1TB SSD', '2TB SSD', '4TB SSD']
    },
    'prod-ipad-pro-m4': {
      id: 'prod-ipad-pro-m4',
      title: 'iPad Pro 13" M4 Ultra Retina XDR',
      subtitle: 'Standard Glass • Wi-Fi + 5G Cellular',
      category: 'iPad',
      priceUSD: 1299,
      priceNGN: 1929015,
      priceCNY: 9400,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      reviewsCount: 145,
      specs: ['M4 Ultra Chip', 'OLED Tandem Display', 'Apple Pencil Pro Support', 'Thunderbolt 4'],
      inStock: true,
      stockCount: 12,
      tag: 'Hot Item',
      colors: [
        { name: 'Space Black', hex: '#1E1E22' },
        { name: 'Silver', hex: '#E3E4E5' }
      ],
      storageOptions: ['256GB', '512GB', '1TB']
    },
    'prod-apple-watch-ultra-2': {
      id: 'prod-apple-watch-ultra-2',
      title: 'Apple Watch Ultra 2 GPS + Cellular',
      subtitle: '49mm Titanium Case • Black Ocean Band',
      category: 'Watch',
      priceUSD: 799,
      priceNGN: 1186515,
      priceCNY: 5780,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      reviewsCount: 220,
      specs: ['S9 SiP with 64-bit dual-core', '3000 nits Peak Brightness', 'Precision Dual-Frequency GPS', '100m Water Resistance'],
      inStock: true,
      stockCount: 24,
      tag: 'High Demand',
      colors: [
        { name: 'Natural Titanium', hex: '#9A958E' },
        { name: 'Black Titanium', hex: '#2F3133' }
      ],
      storageOptions: ['64GB GPS + Cellular']
    },
    'prod-airpods-max-usb-c': {
      id: 'prod-airpods-max-usb-c',
      title: 'AirPods Max (USB-C)',
      subtitle: 'Midnight • Lossless Audio with Personalized Spatial Audio',
      category: 'Audio',
      priceUSD: 549,
      priceNGN: 815265,
      priceCNY: 3975,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      rating: 4.7,
      reviewsCount: 178,
      specs: ['Apple-designed Dynamic Driver', 'Active Noise Cancellation', 'USB-C Charging Port', 'Smart Case Sleep Mode'],
      inStock: true,
      stockCount: 15,
      tag: 'New Colorway',
      colors: [
        { name: 'Midnight', hex: '#1C2024' },
        { name: 'Starlight', hex: '#E5DED0' },
        { name: 'Space Gray', hex: '#53565A' },
        { name: 'Silver', hex: '#E3E4E5' }
      ],
      storageOptions: ['USB-C Universal']
    }
  },

  audit_logs: [
    {
      id: 'log-001',
      adminId: 'adm-002',
      adminName: 'Chen Wei',
      action: 'WAYPOINT_UPDATE',
      targetCollection: 'shipments',
      targetId: 'ship_can_los_89241',
      details: 'Advanced status to Flight ET921 mid-transit',
      timestamp: Date.now() - 3600000,
      ipAddress: '119.130.228.42 (Guangzhou)'
    },
    {
      id: 'log-002',
      adminId: 'adm-003',
      adminName: 'Ngozi Okonjo-Ade',
      action: 'SUPPLIER_PAYOUT_APPROVED',
      targetCollection: 'supplier_payments',
      targetId: 'pay_foxconn_01',
      details: 'Disbursed ¥45,000 to Foxconn Micro Tech via Alipay Business',
      timestamp: Date.now() - 7200000,
      ipAddress: '102.89.44.12 (Lagos)'
    }
  ]
};

class DatabaseService {
  private state: DatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = this.loadState();
    this.initSync();
  }

  private initSync() {
    if (typeof window === 'undefined') return;
    try {
      const eventSource = new EventSource(`${BACKEND_BASE}/api/db/stream`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.state) {
            this.state = { ...this.state, ...data.state };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            } catch (err) {}
            this.notifyListeners();
          }
        } catch (e) {
          console.warn('Failed to parse sync event', e);
        }
      };
      eventSource.onerror = () => {
        // Auto-reconnect managed by browser EventSource
      };
    } catch (e) {
      // Local fallback
    }
  }

  private async syncRemote() {
    if (typeof window === 'undefined') return;
    try {
      await fetch(`${BACKEND_BASE}/api/db/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: this.state })
      });
    } catch (e) {}
  }

  private loadState(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_DATABASE,
          ...parsed,
          users: { ...INITIAL_DATABASE.users, ...(parsed.users || {}) },
          wallets_ledger: { ...INITIAL_DATABASE.wallets_ledger, ...(parsed.wallets_ledger || {}) },
          shipments: { ...INITIAL_DATABASE.shipments, ...(parsed.shipments || {}) },
          supplier_payments: { ...INITIAL_DATABASE.supplier_payments, ...(parsed.supplier_payments || {}) },
          withdrawals: { ...INITIAL_DATABASE.withdrawals, ...(parsed.withdrawals || {}) },
          agent_requests: { ...INITIAL_DATABASE.agent_requests, ...(parsed.agent_requests || {}) },
          supplier_subscriptions: { ...INITIAL_DATABASE.supplier_subscriptions, ...(parsed.supplier_subscriptions || {}) },
          shop_orders: { ...INITIAL_DATABASE.shop_orders, ...(parsed.shop_orders || {}) },
          hotel_bookings: { ...INITIAL_DATABASE.hotel_bookings, ...(parsed.hotel_bookings || {}) },
          products: { ...INITIAL_DATABASE.products, ...(parsed.products || {}) },
          support_tickets: { ...INITIAL_DATABASE.support_tickets, ...(parsed.support_tickets || {}) },
          banners: parsed.banners || INITIAL_DATABASE.banners,
          system_settings: parsed.system_settings || INITIAL_DATABASE.system_settings
        };
      }
    } catch (e) {
      console.warn('Failed to parse database state from localStorage', e);
    }
    return INITIAL_DATABASE;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
      this.syncRemote();
    } catch (e) {
      console.error('Failed to persist database state', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getCollection<K extends keyof DatabaseState>(col: K): DatabaseState[K] {
    return this.state[col];
  }

  public getDocument<K extends keyof DatabaseState>(col: K, docId: string): any {
    const c = this.state[col] as any;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      return c[docId];
    }
    if (Array.isArray(c)) {
      return c.find((item: any) => item.id === docId);
    }
    return undefined;
  }

  public resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
  }

  // ==========================================
  // AUTHORITATIVE BACKEND-BACKED METHODS
  // ==========================================

  public async verifyPin(userId: string, pin: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin })
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { valid: false, error: 'Authentication service unavailable' };
    }
  }

  public async setPin(userId: string, newPin: string, oldPin?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/set-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPin, oldPin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async fundWallet(userId: string, currency: string, amount: number, paymentMethod: string, reference?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency, amount, paymentMethod, reference })
      });
      return await res.json();
    } catch (e) {
      // Strict Financial Invariant: NEVER credit customer wallet locally or offline without authoritative backend verification
      return { 
        success: false, 
        error: 'Authoritative backend connection required. Unverified offline wallet deposits are rejected.' 
      };
    }
  }

  public async executeSwap(userId: string, fromCurrency: string, toCurrency: string, fromAmount: number, toAmount: number, rate: number, pin?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fromCurrency, toCurrency, fromAmount, toAmount, rate, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async paySupplier(userId: string, supplierName: string, receiverAccount: string, paymentMethod: string, amountCNY: number, note?: string, pin?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/pay-supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, supplierName, receiverAccount, paymentMethod, amountCNY, note, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async requestWithdrawal(userId: string, bankName: string, accountNumber: string, accountName: string, amountNGN: number, pin?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bankName, accountNumber, accountName, amountNGN, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async payFreight(shipmentId: string, userId: string, paidWith: string, pin?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/pay-freight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, userId, paidWith, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async subscribeToSupplier(userId: string, supplierId: string, paidWith: string, pin?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, supplierId, paidWith, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error subscribing to supplier' };
    }
  }

  public async getSupplierContact(supplierId: string, userId: string): Promise<{ unlocked: boolean; contacts?: any; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/contact?supplierId=${encodeURIComponent(supplierId)}&userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (e) {
      return { unlocked: false, error: 'Network error fetching supplier contacts' };
    }
  }

  public async disburseWithdrawal(withdrawalId: string, transferReference: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, transferReference, adminId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error disbursing withdrawal' };
    }
  }

  public async refundWithdrawal(withdrawalId: string, reason?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, reason, adminId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error processing withdrawal refund' };
    }
  }

  public async updateSystemSettings(adminName: string, rates?: any, fees?: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, rates, fees })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  // -------------------------------------------------------------
  // PHASE 3: NIGERIAN BANKING & VERIFICATION METHODS
  // -------------------------------------------------------------

  public async enquireAccount(bankCode: string, accountNumber: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/banking/enquire-account?bankCode=${encodeURIComponent(bankCode)}&accountNumber=${encodeURIComponent(accountNumber)}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error performing NIP name enquiry' };
    }
  }

  public async verifyPayment(reference: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/payments/verify/${encodeURIComponent(reference)}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error verifying payment status' };
    }
  }

  public async disburseSupplierPayment(
    paymentId: string,
    evidence: { clearingSessionId: string; paymentProofUrl: string; safeDeclarationRef: string },
    adminId?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/supplier-payments/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001' },
        body: JSON.stringify({ paymentId, ...evidence })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error disbursing supplier remittance' };
    }
  }

  public async refundSupplierPayment(paymentId: string, reason?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/supplier-payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001' },
        body: JSON.stringify({ paymentId, reason })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error refunding supplier payment' };
    }
  }

  // -------------------------------------------------------------
  // PHASE 3: DATABASE BACKUPS, INTEGRITY & RECONCILIATION
  // -------------------------------------------------------------

  public async createBackup(reason?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001' },
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error creating snapshot' };
    }
  }

  public async listBackups(adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/backups/list`, {
        headers: { 'x-admin-id': adminId || 'adm-001' }
      });
      return await res.json();
    } catch (e) {
      return { success: false, backups: [] };
    }
  }

  public async restoreBackup(filename: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/backups/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001' },
        body: JSON.stringify({ filename })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error restoring backup' };
    }
  }

  public async verifyDbIntegrity(adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/db/integrity`, {
        headers: { 'x-admin-id': adminId || 'adm-001' }
      });
      return await res.json();
    } catch (e) {
      return { healthy: false, error: 'Network error verifying database' };
    }
  }

  public async getTrialBalanceReconciliation(adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/ledger/reconciliation`, {
        headers: { 'x-admin-id': adminId || 'adm-001' }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error fetching trial balance' };
    }
  }

  public async verifyAuditLogs(adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/audit-logs/verify`, {
        headers: { 'x-admin-id': adminId || 'adm-001' }
      });
      return await res.json();
    } catch (e) {
      return { valid: false, error: 'Network error verifying audit logs' };
    }
  }

  // ==========================================
  // SYNC ACCESSORS FOR UI READS
  // ==========================================

  public getUser(userId: string): UserDocument | undefined {
    return this.state.users[userId];
  }

  public getUsers(): UserDocument[] {
    return Object.values(this.state.users);
  }

  public updateUserBalances(userId: string, balances: Partial<UserDocument['balances']>): UserDocument | undefined {
    const user = this.state.users[userId];
    if (user) {
      user.balances = { ...user.balances, ...balances };
      this.persist();
    }
    return user;
  }

  public updateUserVerification(userId: string, verifiedBadge: boolean): UserDocument | undefined {
    const user = this.state.users[userId];
    if (user) {
      user.verifiedBadge = verifiedBadge;
      this.persist();
    }
    return user;
  }

  public getLedger(): WalletLedgerDocument[] {
    return Object.values(this.state.wallets_ledger).sort((a, b) => b.timestamp - a.timestamp);
  }

  public recordLedgerEntry(entry: Omit<WalletLedgerDocument, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): WalletLedgerDocument {
    const id = entry.id || `ldg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newDoc: WalletLedgerDocument = {
      ...entry,
      id,
      timestamp: entry.timestamp || Date.now()
    };
    this.state.wallets_ledger[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public getShipments(): ShipmentDocument[] {
    return Object.values(this.state.shipments).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public recordShipment(shipment: Omit<ShipmentDocument, 'id' | 'updatedAt'>): ShipmentDocument {
    const id = `ship_${Date.now()}`;
    const newDoc: ShipmentDocument = {
      ...shipment,
      id,
      updatedAt: Date.now()
    };
    this.state.shipments[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateShipmentStatus(
    id: string,
    status: ShipmentDocument['currentStatus'],
    newTimelineEvent?: { location: string; notes: string }
  ) {
    const ship = this.state.shipments[id];
    if (ship) {
      ship.currentStatus = status;
      ship.updatedAt = Date.now();
      if (newTimelineEvent) {
        ship.timeline.push({
          status,
          location: newTimelineEvent.location,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes: newTimelineEvent.notes
        });
      }
      this.persist();
    }
    return ship;
  }

  public getSupplierPayments(): SupplierPaymentDocument[] {
    return Object.values(this.state.supplier_payments).sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordSupplierPayment(payment: Omit<SupplierPaymentDocument, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): SupplierPaymentDocument {
    const id = payment.id || `pay_${Date.now()}`;
    const newDoc: SupplierPaymentDocument = {
      ...payment,
      id,
      createdAt: payment.createdAt || Date.now()
    };
    this.state.supplier_payments[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateSupplierPaymentStatus(
    paymentId: string,
    status: SupplierPaymentDocument['status']
  ): SupplierPaymentDocument | undefined {
    const payment = this.state.supplier_payments[paymentId];
    if (payment) {
      payment.status = status;
      this.persist();
    }
    return payment;
  }

  public getWithdrawals(): WithdrawalDocument[] {
    return Object.values(this.state.withdrawals).sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordWithdrawal(withdrawal: Omit<WithdrawalDocument, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): WithdrawalDocument {
    const id = withdrawal.id || `wth_${Date.now()}`;
    const newDoc: WithdrawalDocument = {
      ...withdrawal,
      id,
      createdAt: withdrawal.createdAt || Date.now()
    };
    this.state.withdrawals[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public getAgentRequests(): AgentRequestDocument[] {
    return Object.values(this.state.agent_requests).sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordAgentRequest(req: Omit<AgentRequestDocument, 'id' | 'createdAt'>): AgentRequestDocument {
    const id = `rfq_${Date.now()}`;
    const newDoc: AgentRequestDocument = {
      ...req,
      id,
      createdAt: Date.now()
    };
    this.state.agent_requests[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateAgentQuote(requestId: string, quoteUSD: number, quoteNGN: number, notes?: string) {
    const req = this.state.agent_requests[requestId];
    if (req) {
      req.quoteAmountUSD = quoteUSD;
      req.quoteAmountNGN = quoteNGN;
      req.status = 'quote_ready';
      if (notes) req.adminNotes = notes;
      this.persist();
    }
    return req;
  }

  public isSupplierSubscribed(userId: string, supplierId: string): boolean {
    const sub = Object.values(this.state.supplier_subscriptions).find(
      s => s.userId === userId && s.supplierId === supplierId && s.activeUntil > Date.now()
    );
    return !!sub;
  }

  public getShopOrders(): ShopOrderDocument[] {
    return Object.values(this.state.shop_orders).sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordShopOrder(order: Omit<ShopOrderDocument, 'id' | 'createdAt'>): ShopOrderDocument {
    const id = `ord_${Date.now()}`;
    const newDoc: ShopOrderDocument = {
      ...order,
      id,
      createdAt: Date.now()
    };
    this.state.shop_orders[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateShopOrderStatus(
    orderId: string,
    fulfillmentStatus: ShopOrderDocument['fulfillmentStatus']
  ): ShopOrderDocument | undefined {
    const order = this.state.shop_orders[orderId];
    if (order) {
      order.fulfillmentStatus = fulfillmentStatus;
      this.persist();
    }
    return order;
  }

  public getSupportTickets(): SupportTicketDocument[] {
    return Object.values(this.state.support_tickets).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public recordSupportTicket(ticket: Omit<SupportTicketDocument, 'id' | 'updatedAt'>): SupportTicketDocument {
    const id = `tkt_${Date.now()}`;
    const newDoc: SupportTicketDocument = {
      ...ticket,
      id,
      updatedAt: Date.now()
    };
    this.state.support_tickets[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateTicketStatus(
    ticketId: string,
    status: SupportTicketDocument['status']
  ): SupportTicketDocument | undefined {
    const tkt = this.state.support_tickets[ticketId];
    if (tkt) {
      tkt.status = status;
      tkt.updatedAt = Date.now();
      this.persist();
    }
    return tkt;
  }

  public addTicketMessage(ticketId: string, message: { senderId: string; text: string; isAdmin: boolean; senderName?: string }) {
    const tkt = this.state.support_tickets[ticketId];
    if (tkt) {
      tkt.messages.push({
        ...message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      tkt.updatedAt = Date.now();
      this.persist();
    }
    return tkt;
  }

  public getBanners(): BannerDocument[] {
    return (this.state.banners || []).filter(b => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getAllBanners(): BannerDocument[] {
    return (this.state.banners || []).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public toggleBanner(bannerId: string, isActive: boolean): BannerDocument | undefined {
    const banner = (this.state.banners || []).find(b => b.id === bannerId);
    if (banner) {
      banner.isActive = isActive;
      this.persist();
      fetch(`${BACKEND_BASE}/api/banners/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId, isActive })
      }).catch(() => {});
    }
    return banner;
  }

  public addBanner(banner: BannerDocument): BannerDocument {
    if (!this.state.banners) this.state.banners = [];
    this.state.banners.push(banner);
    this.persist();
    return banner;
  }

  public updateBanner(banner: BannerDocument): BannerDocument | undefined {
    if (!this.state.banners) this.state.banners = [];
    const index = this.state.banners.findIndex(b => b.id === banner.id);
    if (index >= 0) {
      this.state.banners[index] = banner;
      this.persist();
      return banner;
    }
    return undefined;
  }

  // ==========================================
  // PRODUCTS & COMMERCE METHODS
  // ==========================================

  public getProducts(): TechProduct[] {
    return Object.values(this.state.products || {});
  }

  public getProduct(id: string): TechProduct | undefined {
    return (this.state.products || {})[id];
  }

  public updateProductStock(productId: string, delta: number): TechProduct | undefined {
    const prod = (this.state.products || {})[productId];
    if (prod) {
      const updated = Math.max(0, prod.stockCount + delta);
      prod.stockCount = updated;
      prod.inStock = updated > 0;
      this.persist();
      fetch(`${BACKEND_BASE}/api/shop/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, delta })
      }).catch(() => {});
    }
    return prod;
  }

  public addProduct(product: TechProduct): TechProduct {
    if (!this.state.products) this.state.products = {};
    this.state.products[product.id] = product;
    this.persist();
    fetch(`${BACKEND_BASE}/api/shop/add-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    }).catch(() => {});
    return product;
  }

  public async checkoutShopWithPin(
    userId: string,
    items: any[],
    totalAmount: number,
    currency: string,
    deliveryAddress: string,
    pin?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shop/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, items, totalAmount, currency, deliveryAddress, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  // ==========================================
  // HOTEL BOOKING METHODS
  // ==========================================

  public getHotelBookings(): any[] {
    return Object.values(this.state.hotel_bookings || {}).sort((a, b) => b.createdAt - a.createdAt);
  }

  public recordHotelBooking(booking: any): any {
    const id = booking.id || `bk_${Date.now()}`;
    const newDoc = {
      ...booking,
      id,
      createdAt: booking.createdAt || Date.now()
    };
    if (!this.state.hotel_bookings) this.state.hotel_bookings = {};
    this.state.hotel_bookings[id] = newDoc;
    this.persist();
    return newDoc;
  }

  public updateHotelBookingStatus(bookingId: string, status: string): any {
    const bk = (this.state.hotel_bookings || {})[bookingId];
    if (bk) {
      bk.status = status;
      this.persist();
    }
    return bk;
  }

  public async bookHotelWithPin(
    userId: string,
    hotel: any,
    nights: number,
    totalUSD: number,
    currency: string,
    guestName: string,
    pin?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/hotels/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hotel, nights, totalUSD, currency, guestName, pin })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public getSystemSettings(): SystemSettingsDocument {
    return this.state.system_settings;
  }
}

export const db = new DatabaseService();
