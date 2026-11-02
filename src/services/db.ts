import {
  UserDocument,
  WalletLedgerDocument,
  ShipmentDocument,
  SupplierPaymentDocument,
  ShopOrderDocument,
  SupportTicketDocument,
  CartItem
} from '../types';

export interface DatabaseState {
  users: Record<string, UserDocument>;
  wallets_ledger: Record<string, WalletLedgerDocument>;
  shipments: Record<string, ShipmentDocument>;
  supplier_payments: Record<string, SupplierPaymentDocument>;
  shop_orders: Record<string, ShopOrderDocument>;
  support_tickets: Record<string, SupportTicketDocument>;
}

const STORAGE_KEY = 'flyemass_nosql_db_v1';

// Default initial seed data matching the user's schema specification
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
      status: 'completed',
      reference: 'FLYE-ALIPAY-98214',
      timestamp: Date.now() - 3600000,
      notes: 'Payment to Shenzhen Foxconn Micro Tech via Alipay Business'
    },
    'ldg_89202': {
      id: 'ldg_89202',
      userId: 'usr_alade_01',
      type: 'FX_SWAP',
      sourceCurrency: 'NGN',
      targetCurrency: 'CNY',
      amount: 15000000,
      fee: 0,
      status: 'completed',
      reference: 'SWP-NGN-CNY-7712',
      timestamp: Date.now() - 14400000,
      notes: 'Instant swap ₦15,000,000 to ¥69,930 CNY'
    },
    'ldg_89203': {
      id: 'ldg_89203',
      userId: 'usr_alade_01',
      type: 'FUND',
      sourceCurrency: 'NGN',
      targetCurrency: 'NGN',
      amount: 10000000,
      fee: 0,
      status: 'completed',
      reference: 'NIP-CR-992144882',
      timestamp: Date.now() - 86400000,
      notes: 'Virtual Providus Account Direct Top-up'
    },
    'ldg_89204': {
      id: 'ldg_89204',
      userId: 'usr_alade_01',
      type: 'SHOP_ORDER',
      sourceCurrency: 'USD',
      targetCurrency: 'USD',
      amount: 1420.00,
      fee: 45.00,
      status: 'completed',
      reference: 'ORD-TECH-89201',
      timestamp: Date.now() - 172800000,
      notes: 'iPhone 16 Pro Max (512GB) HK Spec'
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
      timeline: [
        {
          status: 'Origin Received',
          location: 'Baiyun Logistics Hub, Guangzhou',
          timestamp: '2026-11-01 09:30 AM',
          notes: 'Package verified against supplier invoice. 100% seal intact.'
        },
        {
          status: 'Packed',
          location: 'Guangzhou Export Terminal B',
          timestamp: '2026-11-01 19:45 PM',
          notes: 'Loaded into flight security ULD container.'
        },
        {
          status: 'In Transit/Customs',
          location: 'Flight ET921 (Addis Ababa - Lagos MM2)',
          timestamp: '2026-11-02 04:15 AM',
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
      timeline: [
        {
          status: 'Origin Received',
          location: 'Yiwu International Port D-18 Hub',
          timestamp: '2026-10-30 11:20 AM',
          notes: 'Consolidated from 4 factory suppliers.'
        },
        {
          status: 'Packed',
          location: 'Ningbo Maritime Port Terminal',
          timestamp: '2026-11-01 16:00 PM',
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

  shop_orders: {
    'ord_tech_89201': {
      id: 'ord_tech_89201',
      userId: 'usr_alade_01',
      items: [
        {
          product: {
            id: 'prod-iphone-16-pro',
            title: 'Apple iPhone 16 Pro Max (512GB)',
            subtitle: 'Desert Titanium • HK Spec Dual Nano-SIM',
            category: 'iPhone',
            priceUSD: 1420,
            priceNGN: 2108700,
            priceCNY: 10280,
            image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
            rating: 4.9,
            reviewsCount: 312,
            specs: ['A18 Pro Chip', 'Grade 5 Titanium', 'Dual Nano-SIM (HK Spec)'],
            inStock: true,
            stockCount: 18,
            tag: 'Wholesale Leader',
            colors: [{ name: 'Desert Titanium', hex: '#C2AD97' }],
            storageOptions: ['512GB']
          },
          quantity: 1,
          selectedColor: 'Desert Titanium',
          selectedStorage: '512GB'
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

  support_tickets: {
    'tkt_8901': {
      id: 'tkt_8901',
      userId: 'usr_alade_01',
      subject: 'Alipay merchant payment clearance confirmation',
      status: 'in_progress',
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
      ],
      updatedAt: Date.now() - 1800000,
      ticketNumber: 'TKT-8901',
      category: 'Supplier Escrow',
      priority: 'High'
    }
  }
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
      const eventSource = new EventSource('http://localhost:5050/api/db/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.state) {
            this.state = data.state;
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
        // Auto-reconnect managed by EventSource
      };
    } catch (e) {
      // Local fallback active
    }
  }

  private syncRemote() {
    if (typeof window === 'undefined') return;
    try {
      fetch('http://localhost:5050/api/db/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: this.state })
      }).catch(() => {});
    } catch (e) {}
  }

  private loadState(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          users: { ...INITIAL_DATABASE.users, ...(parsed.users || {}) },
          wallets_ledger: { ...INITIAL_DATABASE.wallets_ledger, ...(parsed.wallets_ledger || {}) },
          shipments: { ...INITIAL_DATABASE.shipments, ...(parsed.shipments || {}) },
          supplier_payments: { ...INITIAL_DATABASE.supplier_payments, ...(parsed.supplier_payments || {}) },
          shop_orders: { ...INITIAL_DATABASE.shop_orders, ...(parsed.shop_orders || {}) },
          support_tickets: { ...INITIAL_DATABASE.support_tickets, ...(parsed.support_tickets || {}) }
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

  public resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
  }

  // Generic helpers
  public getCollection<K extends keyof DatabaseState>(collection: K): DatabaseState[K] {
    return this.state[collection];
  }

  public getDocument<K extends keyof DatabaseState>(
    collection: K,
    id: string
  ): DatabaseState[K][string] | undefined {
    return this.state[collection][id];
  }

  // 1. /users/{userId}
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

  // 2. /wallets_ledger/{ledgerId}
  public getLedger(): WalletLedgerDocument[] {
    return Object.values(this.state.wallets_ledger);
  }

  public recordLedgerEntry(entry: Omit<WalletLedgerDocument, 'id' | 'timestamp'>): WalletLedgerDocument {
    const id = `ldg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newDoc: WalletLedgerDocument = {
      ...entry,
      id,
      timestamp: Date.now()
    };
    this.state.wallets_ledger[id] = newDoc;
    this.persist();
    return newDoc;
  }

  // 3. /shipments/{shipmentId}
  public getShipments(): ShipmentDocument[] {
    return Object.values(this.state.shipments);
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

  // 4. /supplier_payments/{paymentId}
  public getSupplierPayments(): SupplierPaymentDocument[] {
    return Object.values(this.state.supplier_payments);
  }

  public recordSupplierPayment(payment: Omit<SupplierPaymentDocument, 'id' | 'createdAt'>): SupplierPaymentDocument {
    const id = `pay_${Date.now()}`;
    const newDoc: SupplierPaymentDocument = {
      ...payment,
      id,
      createdAt: Date.now()
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

  // 5. /shop_orders/{orderId}
  public getShopOrders(): ShopOrderDocument[] {
    return Object.values(this.state.shop_orders);
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

  // 6. /support_tickets/{ticketId}
  public getSupportTickets(): SupportTicketDocument[] {
    return Object.values(this.state.support_tickets);
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
}

export const db = new DatabaseService();
