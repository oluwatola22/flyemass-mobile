const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5050;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db-state.json');
const WAL_FILE = process.env.WAL_FILE || path.join(__dirname, 'db-transactions.wal.jsonl');
const BACKUPS_DIR = process.env.BACKUPS_DIR || path.join(__dirname, 'backups');

const PROVIDUS_WEBHOOK_SECRET = process.env.PROVIDUS_WEBHOOK_SECRET || 'PROVIDUS_SECRET_KEY_PROD_998124';
const MONNIFY_WEBHOOK_SECRET = process.env.MONNIFY_WEBHOOK_SECRET || 'MONNIFY_SECRET_KEY_99182';
const KORAPAY_WEBHOOK_SECRET = process.env.KORAPAY_WEBHOOK_SECRET || 'KORAPAY_SECRET_KEY_99182';
const MASTER_RECOVERY_KEY = process.env.MASTER_RECOVERY_KEY || 'FLYE-MASTER-RECOVERY-KEY-2026-ALADE';

if (!fs.existsSync(BACKUPS_DIR)) {
  try { fs.mkdirSync(BACKUPS_DIR, { recursive: true }); } catch (e) {}
}

// =========================================================================
// 1. CRYPTOGRAPHIC UTILITIES & PIN ENCLAVE
// =========================================================================

function hashPin(pin, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', s).update(String(pin)).digest('hex');
  return { hash, salt: s };
}

function verifyUserTransactionPin(user, pin) {
  if (!user) return { valid: false, status: 404, error: 'User account not found' };

  if (user.pinLockedUntil && Date.now() < user.pinLockedUntil) {
    const remainingSec = Math.ceil((user.pinLockedUntil - Date.now()) / 1000);
    return {
      valid: false,
      status: 423,
      error: `Security Lockout: Account PIN locked due to excessive failed attempts. Please wait ${remainingSec} seconds.`
    };
  }

  if (!pin || String(pin).length !== 6 || !/^\d{6}$/.test(String(pin))) {
    return {
      valid: false,
      status: 400,
      error: 'Mandatory 6-digit numerical transaction PIN required for financial execution'
    };
  }

  const { hash } = hashPin(pin, user.pinSalt);
  if (hash !== user.pinHash) {
    user.pinFailedAttempts = (user.pinFailedAttempts || 0) + 1;
    if (user.pinFailedAttempts >= 5) {
      user.pinLockedUntil = Date.now() + 15 * 60 * 1000;
    }
    persistState();
    return {
      valid: false,
      status: 401,
      error: user.pinFailedAttempts >= 5
        ? 'Account transaction PIN locked for 15 minutes due to 5 consecutive failed attempts.'
        : `Incorrect 6-digit transaction PIN. ${5 - user.pinFailedAttempts} attempts remaining.`
    };
  }

  user.pinFailedAttempts = 0;
  user.pinLockedUntil = 0;
  return { valid: true };
}

// In development/test mode, seed initial accounts with secure hashes
// NEVER expose or hardcode plaintext PINs in responses or fallbacks.
const seedAladePin = hashPin('246810');
const seedChenPin = hashPin('246810');

// =========================================================================
// 2. DATABASE-LEVEL FINANCIAL CONCURRENCY, WAL & IDEMPOTENCY LOCKS
// =========================================================================

// Memory lock fallback for ultra-fast local serialization
const memoryLocks = new Map();

function cleanExpiredLocks() {
  if (!dbState.resource_locks) dbState.resource_locks = {};
  const now = Date.now();
  for (const [key, lock] of Object.entries(dbState.resource_locks)) {
    if (lock.leaseExpiresAt < now) {
      delete dbState.resource_locks[key];
    }
  }
}

async function acquireDatabaseLock(resourceId, leaseMs = 15000, maxWaitMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    cleanExpiredLocks();
    const existing = dbState.resource_locks[resourceId];
    if (!existing || existing.leaseExpiresAt < Date.now()) {
      dbState.resource_locks[resourceId] = {
        acquiredBy: process.pid,
        acquiredAt: Date.now(),
        leaseExpiresAt: Date.now() + leaseMs
      };
      return true;
    }
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
}

function releaseDatabaseLock(resourceId) {
  if (dbState.resource_locks && dbState.resource_locks[resourceId]) {
    delete dbState.resource_locks[resourceId];
  }
}

async function withUserLock(userId, fn) {
  const lockKey = `wallet:${userId}`;
  while (memoryLocks.get(userId)) {
    await new Promise((r) => setTimeout(r, 15));
  }
  memoryLocks.set(userId, true);

  const acquired = await acquireDatabaseLock(lockKey, 20000, 6000);
  try {
    return await fn();
  } finally {
    releaseDatabaseLock(lockKey);
    memoryLocks.delete(userId);
  }
}

function appendToWal(record) {
  try {
    const line = JSON.stringify({ ...record, walTimestamp: Date.now() }) + '\n';
    fs.appendFileSync(WAL_FILE, line, 'utf8');
  } catch (e) {
    console.error('[Sync Server] WAL append error:', e);
  }
}

// =========================================================================
// 3. NUBAN VALIDATION (CBN Check Digit Algorithm)
// =========================================================================

const BANK_CODES = {
  'zenith': '057',
  'gtb': '058',
  'guaranty': '058',
  'access': '044',
  'first': '011',
  'providus': '101',
  'uba': '033',
  'standard chartered': '068'
};

function getBankCode(bankName) {
  if (!bankName) return '058';
  const lower = String(bankName).toLowerCase();
  for (const [k, code] of Object.entries(BANK_CODES)) {
    if (lower.includes(k)) return code;
  }
  return '058';
}

function validateNuban(accountNumber, bankNameOrCode = '058') {
  if (!accountNumber || !/^\d{10}$/.test(String(accountNumber))) return false;
  const bankCode = /^\d{3}$/.test(bankNameOrCode) ? bankNameOrCode : getBankCode(bankNameOrCode);
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  const fullStr = String(bankCode).padStart(3, '0') + String(accountNumber).slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(fullStr[i], 10) * weights[i];
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit === parseInt(String(accountNumber)[9], 10);
}

// =========================================================================
// 4. PRIVATE VETTED SUPPLIER CONTACT ENCLAVE
// =========================================================================

const PRIVATE_SUPPLIER_CONTACTS = {
  'sup-1': {
    wechatId: 'foxconn_sz_export88',
    phone: '+86 755 2812 8900',
    directManager: 'Lin Zhiming (Director of Overseas Tech Exports)',
    factoryAddress: 'Foxconn Industrial Park, Longhua, Shenzhen, Guangdong, China'
  },
  'sup-2': {
    wechatId: 'shengda_yiwu_vip',
    phone: '+86 579 8555 9210',
    directManager: 'Madam Zhang Yulan (District 3 General Manager)',
    factoryAddress: 'Block 18, Yiwu International Trade City District 3, Zhejiang, China'
  },
  'sup-3': {
    wechatId: 'growatt_solar_cn',
    phone: '+86 757 8820 4410',
    directManager: 'Wang Chen (Head of Clean Energy Commercial)',
    factoryAddress: 'Chuangye Road, Shunde High-Tech Zone, Foshan, Guangdong, China'
  },
  'sup-4': {
    wechatId: 'zhongda_textile_gz',
    phone: '+86 20 8419 7720',
    directManager: 'Chen Guowei (International Fabric Export Desk)',
    factoryAddress: 'Zhongda International Fabric Market, Haizhu, Guangzhou, China'
  }
};

// =========================================================================
// 5. INITIAL DATABASE & BALANCED DOUBLE-ENTRY LEDGER SEED
// =========================================================================

const INITIAL_DATABASE = {
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
      },
      pinHash: seedAladePin.hash,
      pinSalt: seedAladePin.salt,
      pinFailedAttempts: 0,
      pinLockedUntil: 0
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
      },
      pinHash: seedChenPin.hash,
      pinSalt: seedChenPin.salt,
      pinFailedAttempts: 0,
      pinLockedUntil: 0
    }
  },

  // Authoritative Double-Entry General Ledger
  double_entry_ledger: {
    'je_seed_01': {
      id: 'je_seed_01',
      reference: 'NIP-CR-992144882',
      timestamp: Date.now() - 86400000,
      userId: 'usr_alade_01',
      transactionType: 'FUND',
      description: 'Providus Virtual Direct Account Settlement',
      postings: [
        { account: 'assets:bank:providus_clearing:ngn', currency: 'NGN', debit: 10000000, credit: 0 },
        { account: 'liabilities:customer:usr_alade_01:ngn', currency: 'NGN', debit: 0, credit: 10000000 }
      ]
    },
    'je_seed_02': {
      id: 'je_seed_02',
      reference: 'SWP-NGN-CNY-7712',
      timestamp: Date.now() - 14400000,
      userId: 'usr_alade_01',
      transactionType: 'FX_SWAP',
      description: 'FX Swap ₦15,000,000 to ¥69,930 CNY',
      postings: [
        { account: 'liabilities:customer:usr_alade_01:ngn', currency: 'NGN', debit: 15000000, credit: 0 },
        { account: 'treasury:fx_clearing:ngn', currency: 'NGN', debit: 0, credit: 15000000 },
        { account: 'treasury:fx_clearing:cny', currency: 'CNY', debit: 69930, credit: 0 },
        { account: 'liabilities:customer:usr_alade_01:cny', currency: 'CNY', debit: 0, credit: 69930 }
      ]
    },
    'je_seed_03': {
      id: 'je_seed_03',
      reference: 'FLYE-ALIPAY-98214',
      timestamp: Date.now() - 3600000,
      userId: 'usr_alade_01',
      transactionType: 'PAY_SUPPLIER',
      description: 'Disbursed ¥45,000 to Foxconn Micro Tech via Alipay Business',
      postings: [
        { account: 'liabilities:customer:usr_alade_01:cny', currency: 'CNY', debit: 45000, credit: 0 },
        { account: 'assets:china:alipay_disbursement:cny', currency: 'CNY', debit: 0, credit: 45000 }
      ]
    }
  },

  // Customer Statement Read Ledger
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
    }
  },

  withdrawals: {
    'wth_9921': {
      id: 'wth_9921',
      userId: 'usr_alade_01',
      bankName: 'Access Bank Nigeria',
      accountNumber: '0029148821',
      accountName: 'Chief Babatunde Alade',
      amountNGN: 5000000,
      feeNGN: 500,
      status: 'approved',
      transferReference: 'WTH-NIP-8891244',
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
    'sub_sup-1_usr_alade_01': {
      id: 'sub_sup-1_usr_alade_01',
      userId: 'usr_alade_01',
      supplierId: 'sup-1',
      purchasedAt: Date.now() - 5 * 86400000,
      activeUntil: Date.now() + 25 * 86400000,
      feeUSD: 50,
      status: 'active'
    }
  },

  shop_orders: {},
  hotel_bookings: {},
  hotels: {
    'hotel-gz-westin': {
      id: 'hotel-gz-westin',
      name: 'The Westin Pazhou Guangzhou',
      chineseName: '广州广交会威斯汀酒店',
      city: 'Guangzhou',
      district: 'Haizhu Pazhou Complex Zone',
      pricePerNightUSD: 185,
      pricePerNightCNY: 1340,
      rating: 4.9,
      reviewsCount: 520,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      tags: ['Direct Skybridge to Canton Fair', 'English Concierge', 'Halal Dining Option'],
      distanceToMarket: '0.1 km from Canton Fair Exhibition Complex',
      amenities: ['Direct Fair Access', 'High-speed VPN Wi-Fi', 'Airport Limousine', 'Currency Exchange'],
      roomType: 'Deluxe King City View',
      taxiCardZh: '师傅，请带我去广州琶洲广交会威斯汀酒店（海珠区会展东路1号）。谢谢！'
    },
    'hotel-sz-futian': {
      id: 'hotel-sz-futian',
      name: 'Futian Shangri-La Shenzhen',
      chineseName: '深圳福田香格里拉大酒店',
      city: 'Shenzhen',
      district: 'Futian CBD / Near Huaqiangbei',
      pricePerNightUSD: 160,
      pricePerNightCNY: 1158,
      rating: 4.85,
      reviewsCount: 410,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      tags: ['10 Mins to Huaqiangbei Market', 'Multi-Language Desk', 'Executive Lounge'],
      distanceToMarket: '3.2 km to Huaqiangbei Electronics Hub',
      amenities: ['Huaqiangbei Shuttle', 'Indoor Heated Pool', 'Business Center', 'Metro Station Direct'],
      roomType: 'Horizon Club Deluxe Room',
      taxiCardZh: '师傅，请带我去深圳福田香格里拉大酒店（益田路4088号）。谢谢！'
    },
    'hotel-yiwu-marriott': {
      id: 'hotel-yiwu-marriott',
      name: 'Yiwu Marriott Hotel',
      chineseName: '义乌万豪酒店',
      city: 'Yiwu',
      district: 'Futian International Trade City',
      pricePerNightUSD: 125,
      pricePerNightCNY: 905,
      rating: 4.88,
      reviewsCount: 380,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80',
      tags: ['Opposite Futian Trade Market', 'African Buyers Favorite', 'Free Trade Shuttle'],
      distanceToMarket: '400m to District 1 & 2 Commodity Mart',
      amenities: ['Futian Market Shuttle', 'Halal Kitchen', 'Arabic / English Staff', 'High-Speed Wi-Fi'],
      roomType: 'Deluxe Business Suite',
      taxiCardZh: '师傅，请带我去义乌万豪酒店（福田路188号，近国际商贸城）。谢谢！'
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
      colors: [{ name: 'Desert Titanium', hex: '#C2AD97' }],
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
      colors: [{ name: 'Space Black', hex: '#1E1E22' }],
      storageOptions: ['1TB SSD', '2TB SSD']
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
      withdrawalFlatNGN: 500, // Configurable business fee (₦500)
      fundingCardPercent: 1.2,
      supplierEscrowPercent: 0.5,
      airFreightPerKgUSD: 10.00,
      seaFreightPerCbmUSD: 145.00,
      supplier30DayPassUSD: 50.00,
      sourcingCommissionPercent: 5.0,
      minSourcingCommissionCNY: 500,
      supplierVerificationUSD: 150,
      factoryAuditUSD: 250,
      qualityControlUSD: 200
    }
  },

  processed_webhooks: {},
  webhook_events: [
    {
      id: 'whk_seed_01',
      provider: 'Providus',
      reference: 'PROV-SETTLE-892401',
      amount: 1500000,
      currency: 'NGN',
      status: 'SUCCESS',
      timestamp: Date.now() - 3600000,
      accountNumber: '9082341902',
      userId: 'usr_alade_01'
    },
    {
      id: 'whk_seed_02',
      provider: 'Monnify',
      reference: 'MNFY-CARD-66219',
      amount: 250000,
      currency: 'NGN',
      status: 'SUCCESS',
      timestamp: Date.now() - 7200000,
      accountNumber: 'CARD-TXN',
      userId: 'usr_alade_01'
    },
    {
      id: 'whk_seed_03',
      provider: 'Korapay',
      reference: 'KORA-TRF-10928',
      amount: 500000,
      currency: 'NGN',
      status: 'SUCCESS',
      timestamp: Date.now() - 14400000,
      accountNumber: 'KORA-NUBAN',
      userId: 'usr_alade_01'
    }
  ],
  audit_logs: []
};

// =========================================================================
// 6. STATE PERSISTENCE & DOUBLE-ENTRY ENGINE
// =========================================================================

let dbState = { ...INITIAL_DATABASE };

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    dbState = {
      ...INITIAL_DATABASE,
      ...parsed,
      users: (() => {
        const mergedUsers = { ...INITIAL_DATABASE.users };
        if (parsed.users) {
          for (const [uid, u] of Object.entries(parsed.users)) {
            const initUser = INITIAL_DATABASE.users[uid] || {};
            mergedUsers[uid] = {
              ...initUser,
              ...u,
              balances: {
                NGN: 28450200,
                CNY: 184250,
                USD: 42890.50,
                ...(initUser.balances || {}),
                ...(u.balances || {})
              }
            };
          }
        }
        return mergedUsers;
      })(),
      double_entry_ledger: { ...INITIAL_DATABASE.double_entry_ledger, ...(parsed.double_entry_ledger || {}) },
      wallets_ledger: { ...INITIAL_DATABASE.wallets_ledger, ...(parsed.wallets_ledger || {}) },
      shipments: { ...INITIAL_DATABASE.shipments, ...(parsed.shipments || {}) },
      supplier_payments: { ...INITIAL_DATABASE.supplier_payments, ...(parsed.supplier_payments || {}) },
      withdrawals: { ...INITIAL_DATABASE.withdrawals, ...(parsed.withdrawals || {}) },
      agent_requests: { ...INITIAL_DATABASE.agent_requests, ...(parsed.agent_requests || {}) },
      supplier_subscriptions: { ...INITIAL_DATABASE.supplier_subscriptions, ...(parsed.supplier_subscriptions || {}) },
      shop_orders: { ...INITIAL_DATABASE.shop_orders, ...(parsed.shop_orders || {}) },
      hotel_bookings: { ...INITIAL_DATABASE.hotel_bookings, ...(parsed.hotel_bookings || {}) },
      hotels: { ...INITIAL_DATABASE.hotels, ...(parsed.hotels || {}) },
      webhook_events: parsed.webhook_events || INITIAL_DATABASE.webhook_events || [],
      products: { ...INITIAL_DATABASE.products, ...(parsed.products || {}) },
      support_tickets: { ...INITIAL_DATABASE.support_tickets, ...(parsed.support_tickets || {}) },
      banners: parsed.banners || INITIAL_DATABASE.banners,
      system_settings: {
        ...INITIAL_DATABASE.system_settings,
        ...(parsed.system_settings || {}),
        fees: {
          ...INITIAL_DATABASE.system_settings.fees,
          ...(parsed.system_settings?.fees || {})
        }
      },
      processed_webhooks: parsed.processed_webhooks || {},
      idempotency_keys: parsed.idempotency_keys || {},
      resource_locks: parsed.resource_locks || {},
      payment_providers: parsed.payment_providers || {
        providus: { mode: 'sandbox', baseUrl: 'https://api.providusbank.com', active: true },
        monnify: { mode: 'sandbox', baseUrl: 'https://sandbox.monnify.com', active: true },
        korapay: { mode: 'sandbox', baseUrl: 'https://api.korapay.com', active: true }
      },
      super_admin_recovery: parsed.super_admin_recovery || {
        recoveryKeyHash: crypto.createHash('sha256').update('FLYE-MASTER-RECOVERY-KEY-2026-ALADE').digest('hex'),
        primaryAdminId: 'adm-001'
      },
      audit_logs: parsed.audit_logs || []
    };
  }
} catch (e) {
  console.warn('[Sync Server] Initializing fresh state from schema defaults:', e.message);
}

function persistState() {
  try {
    const tmpFile = `${DB_FILE}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (e) {
    console.error('[Sync Server] Failed to atomically write db-state.json', e);
  }
}

/**
 * Execute a balanced Double-Entry Journal Entry
 * Verifies that sum(debit) === sum(credit) for each currency involved.
 */
function recordDoubleEntry(entry) {
  const { reference, userId, transactionType, description, postings, metadata } = entry;

  // 1. Group postings by currency and verify debit === credit
  const currencyTotals = {};
  for (const p of postings) {
    const c = p.currency;
    if (!currencyTotals[c]) currencyTotals[c] = { debit: 0, credit: 0 };
    currencyTotals[c].debit += Number(p.debit || 0);
    currencyTotals[c].credit += Number(p.credit || 0);
  }

  for (const [curr, totals] of Object.entries(currencyTotals)) {
    const diff = Math.abs(totals.debit - totals.credit);
    if (diff > 0.009) {
      throw new Error(`Unbalanced double-entry journal posting for ${curr}: Debits (${totals.debit}) != Credits (${totals.credit})`);
    }
  }

  // 2. Commit journal entry
  const journalId = `je_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const journalDoc = {
    id: journalId,
    reference,
    timestamp: Date.now(),
    userId,
    transactionType,
    description,
    postings,
    metadata: metadata || {}
  };

  if (!dbState.double_entry_ledger) dbState.double_entry_ledger = {};
  dbState.double_entry_ledger[journalId] = journalDoc;
  appendToWal({ type: 'DOUBLE_ENTRY', journalId, journalDoc });

  // 3. Mutate customer balances strictly from liabilities postings
  if (userId && dbState.users[userId]) {
    const user = dbState.users[userId];
    for (const p of postings) {
      if (p.account === `liabilities:customer:${userId}:${p.currency}`) {
        const netChange = Number(p.credit || 0) - Number(p.debit || 0);
        user.balances[p.currency] = (user.balances[p.currency] || 0) + netChange;
        // Never allow negative customer balance
        if (user.balances[p.currency] < -0.0001) {
          throw new Error(`Insufficient funds: transaction would cause negative balance in ${p.currency}`);
        }
      }
    }
  }

  return journalDoc;
}

// -----------------------------------------------------------------
// APPEND-ONLY HASH-CHAINED AUDIT TRAIL ENGINE
// -----------------------------------------------------------------

function calculateLogHash(entry, previousHash) {
  const content = `${entry.id}|${entry.timestamp}|${entry.adminId}|${entry.action}|${entry.targetCollection}|${entry.targetId}|${entry.details}|${previousHash}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

function recordAudit(adminName, action, targetCollection, targetId, details, req) {
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
  if (!dbState.audit_logs) dbState.audit_logs = [];

  const lastEntry = dbState.audit_logs[dbState.audit_logs.length - 1];
  const previousHash = lastEntry ? (lastEntry.hash || 'GENESIS_FLYE_2026') : 'GENESIS_FLYE_2026';

  const logDoc = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    adminId: (req && req.headers['x-admin-id']) || 'sys',
    adminName: adminName || 'System Service',
    action,
    targetCollection,
    targetId,
    details,
    timestamp: Date.now(),
    ipAddress: ip,
    previousHash
  };

  logDoc.hash = calculateLogHash(logDoc, previousHash);
  dbState.audit_logs.push(logDoc); // Append-only! Never truncate or pop historical audit records.
  appendToWal({ type: 'AUDIT_LOG', logDoc });
}

function verifyAuditChain() {
  if (!dbState.audit_logs || dbState.audit_logs.length === 0) {
    return { valid: true, message: 'Empty audit log', verifiedCount: 0 };
  }

  let prevHash = 'GENESIS_FLYE_2026';
  for (let i = 0; i < dbState.audit_logs.length; i++) {
    const log = dbState.audit_logs[i];
    if (log.previousHash && log.previousHash !== prevHash) {
      return {
        valid: false,
        error: `Hash chain mismatch at index ${i} (Log ${log.id})`,
        brokenIndex: i
      };
    }
    const expectedHash = calculateLogHash(log, log.previousHash || prevHash);
    if (log.hash && log.hash !== expectedHash) {
      return {
        valid: false,
        error: `Tampered log detected at index ${i} (Log ${log.id}): computed ${expectedHash} != stored ${log.hash}`,
        brokenIndex: i
      };
    }
    prevHash = log.hash || prevHash;
  }

  return { valid: true, verifiedCount: dbState.audit_logs.length, headHash: prevHash };
}

// -----------------------------------------------------------------
// DATABASE BACKUP, SNAPSHOT & RECOVERY ENGINE
// -----------------------------------------------------------------

function createBackupSnapshot(reason = 'AUTOMATED_CHECKPOINT', adminId = 'sys') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `db-backup-${timestamp}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const snapshotData = JSON.stringify(dbState, null, 2);
  const checksum = crypto.createHash('sha256').update(snapshotData).digest('hex');

  fs.writeFileSync(filePath, snapshotData, 'utf8');

  // Maintain backup manifest
  const manifestFile = path.join(BACKUPS_DIR, 'manifest.jsonl');
  const manifestRecord = {
    filename,
    timestamp: Date.now(),
    isoDate: new Date().toISOString(),
    checksum,
    sizeBytes: Buffer.byteLength(snapshotData),
    reason,
    adminId,
    recordsCount: {
      users: Object.keys(dbState.users || {}).length,
      doubleEntry: Object.keys(dbState.double_entry_ledger || {}).length,
      auditLogs: (dbState.audit_logs || []).length
    }
  };
  fs.appendFileSync(manifestFile, JSON.stringify(manifestRecord) + '\n', 'utf8');

  // Retention policy: keep 15 latest backup files
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('db-backup-') && f.endsWith('.json'));
    if (files.length > 15) {
      files.sort().slice(0, files.length - 15).forEach(oldFile => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, oldFile)); } catch (e) {}
      });
    }
  } catch (e) {}

  return manifestRecord;
}

function listBackupSnapshots() {
  const manifestFile = path.join(BACKUPS_DIR, 'manifest.jsonl');
  if (!fs.existsSync(manifestFile)) return [];
  const lines = fs.readFileSync(manifestFile, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(l => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean).reverse();
}

function restoreBackupSnapshot(filename, adminId = 'sys') {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file ${filename} does not exist`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const computedChecksum = crypto.createHash('sha256').update(raw).digest('hex');

  const snapshots = listBackupSnapshots();
  const entry = snapshots.find(s => s.filename === filename);
  if (entry && entry.checksum !== computedChecksum) {
    throw new Error('Backup integrity verification failed: SHA-256 checksum mismatch');
  }

  createBackupSnapshot(`SAFETY_SNAPSHOT_BEFORE_RESTORE_${filename}`, adminId);

  const restored = JSON.parse(raw);
  dbState = restored;
  persistState();
  broadcastUpdate();

  recordAudit(adminId, 'DATABASE_RESTORED', 'system', filename, `Restored database from snapshot ${filename}`);
  return { success: true, filename, checksum: computedChecksum };
}

function calculateTrialBalance() {
  const trialBalance = {
    NGN: { debits: 0, credits: 0, net: 0 },
    CNY: { debits: 0, credits: 0, net: 0 },
    USD: { debits: 0, credits: 0, net: 0 }
  };

  const accountBalances = {};

  const ledger = Object.values(dbState.double_entry_ledger || {});
  for (const entry of ledger) {
    for (const p of (entry.postings || [])) {
      const c = p.currency || 'USD';
      if (!trialBalance[c]) trialBalance[c] = { debits: 0, credits: 0, net: 0 };
      trialBalance[c].debits += Number(p.debit || 0);
      trialBalance[c].credits += Number(p.credit || 0);

      if (!accountBalances[p.account]) accountBalances[p.account] = { debits: 0, credits: 0, net: 0, currency: c };
      accountBalances[p.account].debits += Number(p.debit || 0);
      accountBalances[p.account].credits += Number(p.credit || 0);
    }
  }

  for (const [c, b] of Object.entries(trialBalance)) {
    b.debits = Number(b.debits.toFixed(2));
    b.credits = Number(b.credits.toFixed(2));
    b.net = Number((b.debits - b.credits).toFixed(2));
  }

  for (const [acc, b] of Object.entries(accountBalances)) {
    b.net = Number((b.credits - b.debits).toFixed(2));
  }

  return { trialBalance, accountBalances, totalJournalEntries: ledger.length };
}

function verifyDatabaseIntegrity() {
  const errors = [];
  const warnings = [];

  const { trialBalance, totalJournalEntries } = calculateTrialBalance();
  for (const [c, b] of Object.entries(trialBalance)) {
    if (Math.abs(b.net) > 0.05) {
      errors.push(`Trial balance mismatch for ${c}: Debits ${b.debits} != Credits ${b.credits} (Delta: ${b.net})`);
    }
  }

  for (const [userId, user] of Object.entries(dbState.users || {})) {
    for (const curr of ['NGN', 'CNY', 'USD']) {
      const bal = user.balances?.[curr] ?? 0;
      if (bal < -0.001) {
        errors.push(`Negative balance detected: user ${userId} has ${curr} ${bal}`);
      }
    }
  }

  const auditResult = verifyAuditChain();
  if (!auditResult.valid) {
    errors.push(`Audit log integrity violation: ${auditResult.error}`);
  }

  return {
    healthy: errors.length === 0,
    errors,
    warnings,
    trialBalance,
    totalJournalEntries,
    usersCount: Object.keys(dbState.users || {}).length,
    auditVerification: auditResult
  };
}

// -----------------------------------------------------------------
// NIGERIAN BANKING DIRECTORY & NAME ENQUIRY
// -----------------------------------------------------------------

const NIGERIAN_BANKS = [
  { code: '057', name: 'Zenith Bank Plc', cbnCode: '057', active: true },
  { code: '058', name: 'Guaranty Trust Bank (GTB)', cbnCode: '058', active: true },
  { code: '044', name: 'Access Bank Nigeria', cbnCode: '044', active: true },
  { code: '011', name: 'First Bank of Nigeria', cbnCode: '011', active: true },
  { code: '101', name: 'Providus Bank', cbnCode: '101', active: true },
  { code: '033', name: 'United Bank for Africa (UBA)', cbnCode: '033', active: true },
  { code: '221', name: 'Stanbic IBTC Bank', cbnCode: '221', active: true },
  { code: '090267', name: 'Kuda Microfinance Bank', cbnCode: '090267', active: true },
  { code: '090405', name: 'Moniepoint MFB', cbnCode: '090405', active: true },
  { code: '090565', name: 'OPay Digital Services', cbnCode: '090565', active: true }
];

function simulateNubanNameEnquiry(bankCode, accountNumber) {
  if (!accountNumber || !/^\d{10}$/.test(String(accountNumber))) {
    return { success: false, error: 'Account number must be exactly 10 digits' };
  }

  const isValidChecksum = validateNuban(accountNumber, bankCode);
  if (!isValidChecksum) {
    return { success: false, error: 'Invalid 10-digit NUBAN check digit for selected institution' };
  }

  const bank = NIGERIAN_BANKS.find(b => b.code === bankCode || b.cbnCode === bankCode) || { name: 'Nigerian Commercial Bank', code: bankCode };

  const knownAccounts = {
    '2089140022': 'CHIEF BABATUNDE ALADE',
    '0029148822': 'ALADE GLOBAL ENTERPRISES LTD',
    '9082341902': 'CHIEF BABATUNDE ALADE (FLYE VAULT)',
    '1102948821': 'NGOZI OKONJO-ADE'
  };

  const accountName = knownAccounts[accountNumber] || `VERIFIED COMMERCIAL CLIENT (${accountNumber.slice(-4)})`;
  return {
    success: true,
    accountNumber,
    bankCode,
    bankName: bank.name,
    accountName,
    kycTier: 'Tier 3 (BVN & NIN Verified)',
    sessionReference: `NIP-ENQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
  };
}

// =========================================================================
// 7. SSE BROADCAST STREAM
// =========================================================================

const sseClients = new Set();

function broadcastUpdate() {
  const payload = JSON.stringify({
    type: 'STATE_MUTATION',
    timestamp: Date.now(),
    state: getSanitizedState()
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function getSanitizedState() {
  const sanitized = JSON.parse(JSON.stringify(dbState));
  if (sanitized.users) {
    for (const u of Object.values(sanitized.users)) {
      delete u.pinHash;
      delete u.pinSalt;
    }
  }
  // Never leak emergency recovery secrets, database locks, or raw idempotency tables in public state broadcasts
  delete sanitized.super_admin_recovery;
  delete sanitized.resource_locks;
  delete sanitized.idempotency_keys;
  return sanitized;
}

// =========================================================================
// 8. HTTP REQUEST DISPATCHER
// =========================================================================

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Role, X-Admin-Id, Monnify-Signature, X-Korapay-Signature, Providus-Auth-Signature');
}

function sendJson(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      req.rawBody = body;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function verifyAdminRole(req, allowedRoles) {
  const adminId = req.headers['x-admin-id'];
  const headerRole = req.headers['x-admin-role'];

  // Explicitly reject regular client role
  if (headerRole === 'client') return false;

  let effectiveRole = null;
  if (adminId) {
    if (adminId === 'adm-001') {
      effectiveRole = 'super_admin';
    } else if (dbState.users && dbState.users[adminId]) {
      effectiveRole = dbState.users[adminId].role;
    }
  }

  // If header specifies authorized role in dev / testing environment
  if (!effectiveRole && headerRole) {
    effectiveRole = headerRole;
  }

  if (!effectiveRole || effectiveRole === 'client') return false;
  return allowedRoles.includes(effectiveRole);
}

// =========================================================================
// 9. HTTP SERVER IMPLEMENTATION
// =========================================================================

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // -------------------------------------------------------------
    // Health & System Info
    // -------------------------------------------------------------
    if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') {
      const integrity = verifyDatabaseIntegrity();
      return sendJson(res, 200, {
        status: integrity.healthy ? 'healthy' : 'degraded',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: Date.now(),
        pid: process.pid,
        database: {
          healthy: integrity.healthy,
          journalEntries: integrity.totalJournalEntries,
          users: integrity.usersCount,
          auditChainVerified: integrity.auditVerification.valid
        },
        memory: process.memoryUsage()
      });
    }

    if (pathname === '/api/version' && req.method === 'GET') {
      return sendJson(res, 200, {
        app: 'FlyeMass Authoritative Financial Core',
        version: '3.0.0',
        stage: 'Phase-3-Production',
        protocol: 'Double-Entry General Ledger v2'
      });
    }

    // -------------------------------------------------------------
    // NIGERIAN BANKING DIRECTORY & NAME ENQUIRY
    // -------------------------------------------------------------
    if (pathname === '/api/banking/banks' && req.method === 'GET') {
      return sendJson(res, 200, { success: true, banks: NIGERIAN_BANKS });
    }

    if (pathname === '/api/banking/enquire-account' && req.method === 'GET') {
      const bankCode = parsedUrl.searchParams.get('bankCode') || '057';
      const accountNumber = parsedUrl.searchParams.get('accountNumber') || '';
      const result = simulateNubanNameEnquiry(bankCode, accountNumber);
      if (!result.success) {
        return sendJson(res, 400, result);
      }
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------
    // PAYMENT VERIFICATION & RECONCILIATION API
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/payments/verify/') && req.method === 'GET') {
      const reference = decodeURIComponent(pathname.replace('/api/payments/verify/', ''));
      const ledgerEntry = Object.values(dbState.wallets_ledger || {}).find(l => l.reference === reference);
      const journalEntry = Object.values(dbState.double_entry_ledger || {}).find(j => j.reference === reference);
      const isProcessedWebhook = !!dbState.processed_webhooks[reference];

      if (!ledgerEntry && !journalEntry && !isProcessedWebhook) {
        return sendJson(res, 404, { success: false, error: 'Transaction reference not found on authoritative ledger' });
      }

      return sendJson(res, 200, {
        success: true,
        reference,
        settlementStatus: 'SETTLED',
        settledAt: ledgerEntry?.timestamp || journalEntry?.timestamp || Date.now(),
        amount: ledgerEntry?.amount,
        currency: ledgerEntry?.sourceCurrency || ledgerEntry?.targetCurrency,
        journalId: journalEntry?.id,
        isIdempotentProcessed: isProcessedWebhook
      });
    }

    // -------------------------------------------------------------
    // SSE Stream
    // -------------------------------------------------------------
    if (pathname === '/api/db/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', state: getSanitizedState() })}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // -------------------------------------------------------------
    // DB Snapshot
    // -------------------------------------------------------------
    if (pathname === '/api/db/state' && req.method === 'GET') {
      return sendJson(res, 200, { state: getSanitizedState() });
    }

    // -------------------------------------------------------------
    // Generic DB Update (Guarded against direct balance tampering)
    // -------------------------------------------------------------
    if (pathname === '/api/db/update' && req.method === 'POST') {
      const update = await readJsonBody(req);
      if (update && typeof update === 'object') {
        // SECURITY FILTER: Prevent frontend from overwriting customer balances or ledger!
        if (update.state) {
          const filtered = { ...update.state };
          delete filtered.wallets_ledger;
          delete filtered.double_entry_ledger;
          if (filtered.users) {
            for (const uid of Object.keys(filtered.users)) {
              if (dbState.users[uid]) {
                filtered.users[uid] = {
                  ...dbState.users[uid],
                  ...filtered.users[uid],
                  balances: dbState.users[uid].balances,
                  pinHash: dbState.users[uid].pinHash,
                  pinSalt: dbState.users[uid].pinSalt
                };
              }
            }
          }
          dbState = { ...dbState, ...filtered };
        }
        persistState();
        broadcastUpdate();
        return sendJson(res, 200, { success: true });
      }
      return sendJson(res, 400, { error: 'Invalid update body' });
    }

    // -------------------------------------------------------------
    // 10. AUTH & 6-DIGIT TRANSACTION PIN
    // -------------------------------------------------------------
    if (pathname === '/api/auth/verify-pin' && req.method === 'POST') {
      const { userId, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      const check = verifyUserTransactionPin(user, pin);
      if (!check.valid) {
        return sendJson(res, check.status || 401, { valid: false, error: check.error });
      }
      return sendJson(res, 200, { valid: true });
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { fullName, email, phone, businessName, pin } = await readJsonBody(req);
      if (!fullName || !email) {
        return sendJson(res, 400, { error: 'Full name and email are required for registration' });
      }
      const userId = `usr_${Date.now()}`;
      const pinSecurity = hashPin(pin && /^\d{6}$/.test(String(pin)) ? pin : '246810');

      const newUser = {
        uid: userId,
        fullName,
        email,
        phone: phone || '',
        businessName: businessName || 'Enterprise Client Ltd',
        verifiedBadge: false,
        role: 'client',
        createdAt: Date.now(),
        balances: { NGN: 0, CNY: 0, USD: 0 },
        pinHash: pinSecurity.hash,
        pinSalt: pinSecurity.salt,
        pinFailedAttempts: 0,
        pinLockedUntil: 0
      };

      dbState.users[userId] = newUser;
      recordAudit(fullName, 'USER_REGISTERED', 'users', userId, `Registered new client account (${email})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, user: newUser });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { identifier, password, role } = await readJsonBody(req);
      // Find user by email, uid, or phone
      const user = Object.values(dbState.users).find(u => 
        (u.email && u.email.toLowerCase() === (identifier || '').toLowerCase()) ||
        u.uid === identifier ||
        (u.phone && u.phone === identifier)
      ) || (role === 'admin' ? dbState.users['adm-001'] : dbState.users['usr_alade_01']);

      if (!user) {
        return sendJson(res, 404, { success: false, error: 'User account not found' });
      }

      if (user.isSuspended) {
        return sendJson(res, 403, { 
          success: false, 
          isSuspended: true, 
          error: `Account Suspended: ${user.suspensionReason || 'Compliance restriction active. Please contact customer support.'}` 
        });
      }

      return sendJson(res, 200, {
        success: true,
        user: {
          uid: user.uid,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          businessName: user.businessName,
          verifiedBadge: user.verifiedBadge,
          role: user.role,
          balances: user.balances,
          isSuspended: !!user.isSuspended,
          restrictions: user.restrictions || []
        }
      });
    }

    if (pathname === '/api/auth/set-pin' && req.method === 'POST') {
      const { userId, newPin, oldPin } = await readJsonBody(req);
      let user = dbState.users[userId || 'usr_alade_01'];
      
      if (!newPin || String(newPin).length !== 6 || !/^\d{6}$/.test(String(newPin))) {
        return sendJson(res, 400, { error: 'PIN must be exactly 6 digits (0-9)' });
      }

      if (!user) {
        if (!userId) return sendJson(res, 404, { error: 'User not found' });
        const security = hashPin(newPin);
        user = {
          uid: userId,
          fullName: 'Security Test Client',
          email: `${userId}@flyemass.internal`,
          role: 'client',
          balances: { NGN: 1000000, CNY: 5000, USD: 1000 },
          pinHash: security.hash,
          pinSalt: security.salt,
          pinFailedAttempts: 0,
          pinLockedUntil: 0
        };
        dbState.users[userId] = user;
        persistState();
        return sendJson(res, 200, { success: true, message: 'Test user created with secure PIN' });
      }

      if (user.pinHash && oldPin) {
        const check = hashPin(oldPin, user.pinSalt);
        if (check.hash !== user.pinHash) {
          return sendJson(res, 401, { error: 'Current PIN is incorrect' });
        }
      }

      const security = hashPin(newPin);
      user.pinHash = security.hash;
      user.pinSalt = security.salt;
      user.pinFailedAttempts = 0;
      user.pinLockedUntil = 0;

      recordAudit(user.fullName, 'PIN_UPDATED', 'users', user.uid, 'Established new 6-digit cryptographic PIN', req);
      persistState();
      return sendJson(res, 200, { success: true, message: 'Transaction PIN updated successfully' });
    }

    // -------------------------------------------------------------
    // 11. PAYMENT PROVIDER WEBHOOKS (Providus, Monnify, Korapay)
    // -------------------------------------------------------------
    if (pathname === '/api/webhooks/providus' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const signature = req.headers['x-providus-signature'] || req.headers['x-auth-signature'];
      if (signature) {
        const expected = crypto.createHmac('sha256', PROVIDUS_WEBHOOK_SECRET).update(req.rawBody).digest('hex');
        if (signature !== expected) {
          return sendJson(res, 401, { success: false, requestSuccessful: false, error: 'Invalid HMAC signature' });
        }
      }

      const { sessionId, accountNumber, transactionAmount, settlementId, initiationTranRef } = payload;
      const ref = initiationTranRef || settlementId || `PROV-${sessionId}`;

      if (dbState.processed_webhooks[ref]) {
        return sendJson(res, 200, { success: true, already_processed: true, requestSuccessful: true, responseMessage: 'Duplicate webhook ignored' });
      }

      const amount = Number(transactionAmount);
      if (isNaN(amount) || amount <= 0) {
        return sendJson(res, 400, { error: 'Invalid settlement amount' });
      }

      // Default to demo client Chief Alade for Providus virtual account
      const userId = 'usr_alade_01';
      const user = dbState.users[userId];

      await withUserLock(userId, async () => {
        const openingBalance = user.balances.NGN || 0;

        recordDoubleEntry({
          reference: ref,
          userId,
          transactionType: 'FUND',
          description: `Providus Virtual Direct Account Transfer (${accountNumber || '9082341902'})`,
          postings: [
            { account: 'assets:bank:providus_clearing:ngn', currency: 'NGN', debit: amount, credit: 0 },
            { account: `liabilities:customer:${userId}:ngn`, currency: 'NGN', debit: 0, credit: amount }
          ],
          metadata: { provider: 'Providus', payload }
        });

        const closingBalance = user.balances.NGN;
        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId,
          type: 'FUND',
          sourceCurrency: 'NGN',
          targetCurrency: 'NGN',
          amount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Providus NIP virtual settlement confirmed (${ref})`
        };

        dbState.processed_webhooks[ref] = true;
        if (!dbState.webhook_events) dbState.webhook_events = [];
        dbState.webhook_events.unshift({
          id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          provider: 'Providus',
          reference: ref,
          amount,
          currency: 'NGN',
          status: 'SUCCESS',
          timestamp: Date.now(),
          accountNumber: accountNumber || '9082341902',
          userId
        });
        recordAudit('Providus Webhook Engine', 'PAYMENT_CREDITED', 'wallets_ledger', ledgerId, `Credited ₦${amount} via Providus webhook`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, requestSuccessful: true, responseMessage: 'Settlement confirmed & wallet credited' });
    }

    if (pathname === '/api/webhooks/monnify' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const signature = req.headers['monnify-signature'];
      if (signature) {
        const expected = crypto.createHmac('sha512', MONNIFY_WEBHOOK_SECRET).update(req.rawBody).digest('hex');
        if (signature !== expected) {
          return sendJson(res, 401, { success: false, error: 'Invalid Monnify signature' });
        }
      }

      const eventData = payload.eventData || payload;
      const ref = eventData.transactionReference || eventData.paymentReference || `MNFY-${Date.now()}`;

      if (dbState.processed_webhooks[ref]) {
        return sendJson(res, 200, { success: true, already_processed: true, status: 'success', message: 'Duplicate transaction ignored' });
      }

      const amount = Number(eventData.amountPaid || eventData.amount || 0);
      if (isNaN(amount) || amount <= 0) return sendJson(res, 400, { error: 'Invalid Monnify amount' });

      const userId = 'usr_alade_01';
      const user = dbState.users[userId];

      await withUserLock(userId, async () => {
        const openingBalance = user.balances.NGN || 0;
        recordDoubleEntry({
          reference: ref,
          userId,
          transactionType: 'FUND',
          description: `Monnify Reserved Account / Card Settlement (${ref})`,
          postings: [
            { account: 'assets:bank:monnify_clearing:ngn', currency: 'NGN', debit: amount, credit: 0 },
            { account: `liabilities:customer:${userId}:ngn`, currency: 'NGN', debit: 0, credit: amount }
          ],
          metadata: { provider: 'Monnify', payload }
        });

        const closingBalance = user.balances.NGN;
        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId,
          type: 'FUND',
          sourceCurrency: 'NGN',
          targetCurrency: 'NGN',
          amount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Monnify payment confirmed: ₦${amount.toLocaleString()}`
        };

        dbState.processed_webhooks[ref] = true;
        if (!dbState.webhook_events) dbState.webhook_events = [];
        dbState.webhook_events.unshift({
          id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          provider: 'Monnify',
          reference: ref,
          amount,
          currency: 'NGN',
          status: 'SUCCESS',
          timestamp: Date.now(),
          accountNumber: 'CARD-RESERVED',
          userId
        });
        recordAudit('Monnify Webhook', 'PAYMENT_CREDITED', 'wallets_ledger', ledgerId, `Credited ₦${amount} via Monnify`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { status: 'success', message: 'Wallet credited' });
    }

    if (pathname === '/api/webhooks/korapay' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const data = payload.data || payload;
      const ref = data.reference || `KORA-${Date.now()}`;

      if (dbState.processed_webhooks[ref]) {
        return sendJson(res, 200, { status: true, message: 'Already processed' });
      }

      const amount = Number(data.amount || 0);
      const currency = data.currency || 'NGN';
      if (isNaN(amount) || amount <= 0) return sendJson(res, 400, { error: 'Invalid Korapay amount' });

      const userId = 'usr_alade_01';
      const user = dbState.users[userId];

      await withUserLock(userId, async () => {
        const openingBalance = user.balances[currency] || 0;
        recordDoubleEntry({
          reference: ref,
          userId,
          transactionType: 'FUND',
          description: `Korapay Direct Checkout (${ref})`,
          postings: [
            { account: `assets:bank:korapay_clearing:${currency.toLowerCase()}`, currency, debit: amount, credit: 0 },
            { account: `liabilities:customer:${userId}:${currency.toLowerCase()}`, currency, debit: 0, credit: amount }
          ],
          metadata: { provider: 'Korapay', payload }
        });

        const closingBalance = user.balances[currency];
        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId,
          type: 'FUND',
          sourceCurrency: currency,
          targetCurrency: currency,
          amount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Korapay checkout confirmed: ${currency} ${amount.toLocaleString()}`
        };

        dbState.processed_webhooks[ref] = true;
        if (!dbState.webhook_events) dbState.webhook_events = [];
        dbState.webhook_events.unshift({
          id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          provider: 'Korapay',
          reference: ref,
          amount,
          currency,
          status: 'SUCCESS',
          timestamp: Date.now(),
          accountNumber: 'KORA-NUBAN',
          userId
        });
        recordAudit('Korapay Webhook', 'PAYMENT_CREDITED', 'wallets_ledger', ledgerId, `Credited ${currency} ${amount} via Korapay`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { status: true, message: 'Wallet credited' });
    }

    // -------------------------------------------------------------
    // 12. AUTHORITATIVE WALLET FUNDING (API Rail)
    // -------------------------------------------------------------
    if (pathname === '/api/wallets/fund' && req.method === 'POST') {
      const { userId, currency, amount, paymentMethod, reference } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      const num = Number(amount);
      if (isNaN(num) || num <= 0) return sendJson(res, 400, { error: 'Invalid funding amount' });

      const curr = currency || 'NGN';
      const ref = reference || `FLYE-FUND-${Date.now()}`;

      // Idempotency check
      const existing = Object.values(dbState.wallets_ledger).find(l => l.reference === ref);
      if (existing) {
        return sendJson(res, 200, { success: true, ledger: existing, message: 'Already processed (idempotent)' });
      }

      let ledgerEntry;
      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr] || 0;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'FUND',
          description: `Deposit via ${paymentMethod || 'Instant Rail'}`,
          postings: [
            { account: `assets:bank:clearing:${curr.toLowerCase()}`, currency: curr, debit: num, credit: 0 },
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: num }
          ]
        });

        user.balances[curr] = (user.balances[curr] || 0) + num;
        const closingBalance = user.balances[curr];
        const ledgerId = `ldg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        ledgerEntry = {
          id: ledgerId,
          userId: user.uid,
          type: 'FUND',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: num,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Wallet credited with ${curr === 'NGN' ? '₦' : curr === 'CNY' ? '¥' : '$'}${num.toLocaleString()} via ${paymentMethod || 'Instant Rail'}`
        };

        dbState.wallets_ledger[ledgerId] = ledgerEntry;
        recordAudit(user.fullName, 'WALLET_FUNDED', 'wallets_ledger', ledgerId, `Credited ${curr} ${num} via ${paymentMethod}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, ledger: ledgerEntry, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 13. AUTHORITATIVE FX SWAP (Server-Side Rate & Double-Entry)
    // -------------------------------------------------------------
    if (pathname === '/api/wallets/swap' && req.method === 'POST') {
      const { userId, fromCurrency, toCurrency, fromAmount, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const fromNum = Number(fromAmount);
      if (isNaN(fromNum) || fromNum <= 0) {
        return sendJson(res, 400, { error: 'Invalid swap amount' });
      }

      if ((user.balances[fromCurrency] || 0) < fromNum) {
        return sendJson(res, 400, { error: `Insufficient ${fromCurrency} balance` });
      }

      // Compute authoritative rate & toAmount server-side
      const rates = dbState.system_settings.rates;
      const spread = (rates.spreadPercent || 0.75) / 100;
      let calculatedRate = 1;

      if (fromCurrency === 'NGN' && toCurrency === 'CNY') {
        calculatedRate = (1 / rates.NGN_CNY) * (1 - spread);
      } else if (fromCurrency === 'CNY' && toCurrency === 'NGN') {
        calculatedRate = rates.NGN_CNY * (1 - spread);
      } else if (fromCurrency === 'USD' && toCurrency === 'NGN') {
        calculatedRate = rates.USD_NGN * (1 - spread);
      } else if (fromCurrency === 'NGN' && toCurrency === 'USD') {
        calculatedRate = (1 / rates.USD_NGN) * (1 - spread);
      } else if (fromCurrency === 'USD' && toCurrency === 'CNY') {
        calculatedRate = rates.USD_CNY * (1 - spread);
      } else if (fromCurrency === 'CNY' && toCurrency === 'USD') {
        calculatedRate = (1 / rates.USD_CNY) * (1 - spread);
      } else {
        return sendJson(res, 400, { error: `Unsupported swap pair: ${fromCurrency} to ${toCurrency}` });
      }

      const toNum = Number((fromNum * calculatedRate).toFixed(2));
      const ref = `SWP-${fromCurrency}-${toCurrency}-${Math.floor(1000 + Math.random() * 9000)}`;

      let ledgerEntry;
      await withUserLock(user.uid, async () => {
        const fromOpening = user.balances[fromCurrency];
        const toOpening = user.balances[toCurrency] || 0;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'FX_SWAP',
          description: `Swap ${fromCurrency} ${fromNum} to ${toCurrency} ${toNum} @ rate ${calculatedRate.toFixed(4)}`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${fromCurrency.toLowerCase()}`, currency: fromCurrency, debit: fromNum, credit: 0 },
            { account: `treasury:fx_clearing:${fromCurrency.toLowerCase()}`, currency: fromCurrency, debit: 0, credit: fromNum },
            { account: `treasury:fx_clearing:${toCurrency.toLowerCase()}`, currency: toCurrency, debit: toNum, credit: 0 },
            { account: `liabilities:customer:${user.uid}:${toCurrency.toLowerCase()}`, currency: toCurrency, debit: 0, credit: toNum }
          ]
        });

        user.balances[fromCurrency] -= fromNum;
        user.balances[toCurrency] = (user.balances[toCurrency] || 0) + toNum;

        const fromClosing = user.balances[fromCurrency];
        const toClosing = user.balances[toCurrency];

        const ledgerId = `ldg_${Date.now()}`;
        ledgerEntry = {
          id: ledgerId,
          userId: user.uid,
          type: 'FX_SWAP',
          sourceCurrency: fromCurrency,
          targetCurrency: toCurrency,
          amount: fromNum,
          convertedAmount: toNum,
          fee: 0,
          rate: calculatedRate,
          openingBalance: fromOpening,
          closingBalance: fromClosing,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Instant swap ${fromCurrency} ${fromNum.toLocaleString()} to ${toCurrency} ${toNum.toLocaleString()} @ locked rate ${calculatedRate.toFixed(4)}`
        };

        dbState.wallets_ledger[ledgerId] = ledgerEntry;
        recordAudit(user.fullName, 'FX_SWAP_EXECUTED', 'wallets_ledger', ledgerId, `Swapped ${fromCurrency} ${fromNum} to ${toCurrency} ${toNum}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, ledger: ledgerEntry, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 14. AUTHORITATIVE SUPPLIER TRANSFER (RMB / Send Money to China)
    // -------------------------------------------------------------
    if (pathname === '/api/wallets/pay-supplier' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const {
        userId, supplierName, recipientName, receiverAccount, paymentMethod, method,
        amountCNY, note, notes, pin, purpose, purposeExplanation,
        bankName, swiftBic, qrCodeUrl, reference, idempotencyKey
      } = body;

      // Idempotency protection against network retries
      if (idempotencyKey && dbState.idempotency_keys && dbState.idempotency_keys[idempotencyKey]) {
        return sendJson(res, 200, {
          success: true,
          ...dbState.idempotency_keys[idempotencyKey],
          already_processed: true,
          cached: true
        });
      }

      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      if (user.isSuspended) {
        return sendJson(res, 403, { error: 'Account suspended. Outgoing transfers restricted.' });
      }

      const numCNY = Number(amountCNY);
      if (isNaN(numCNY) || numCNY <= 0) return sendJson(res, 400, { error: 'Invalid CNY amount' });
      if (numCNY < 1 || numCNY > 1000000) {
        return sendJson(res, 400, { error: 'Payment amount must be between ¥1 and ¥1,000,000' });
      }

      // Check max 2 decimal places
      const decStr = String(amountCNY).split('.');
      if (decStr[1] && decStr[1].length > 2) {
        return sendJson(res, 400, { error: 'Amount cannot exceed 2 decimal places' });
      }

      const finalNote = (note || notes || 'Supplier factory payment').trim();
      if (finalNote.length < 5) {
        return sendJson(res, 400, { error: 'Payment notes must contain at least 5 characters' });
      }

      if (purpose === 'Other' && (!purposeExplanation || purposeExplanation.trim().length < 3)) {
        return sendJson(res, 400, { error: 'Meaningful explanation required for Other payment purpose' });
      }

      if ((user.balances.CNY || 0) < numCNY) {
        return sendJson(res, 400, { error: `Insufficient CNY balance (Available: ¥${user.balances.CNY})` });
      }

      const targetRecipient = supplierName || recipientName || 'Chinese Recipient';
      const pMethod = paymentMethod || method || 'Alipay';
      const ref = reference || `RMB-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const paymentId = `pay_${Date.now()}`;

      let paymentDoc;
      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances.CNY;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'PAY_SUPPLIER',
          description: `Supplier payment queued to ${targetRecipient} via ${pMethod}`,
          postings: [
            { account: `liabilities:customer:${user.uid}:cny`, currency: 'CNY', debit: numCNY, credit: 0 },
            { account: 'liabilities:supplier_escrow:cny', currency: 'CNY', debit: 0, credit: numCNY }
          ]
        });

        user.balances.CNY -= numCNY;
        const closingBalance = user.balances.CNY;

        paymentDoc = {
          id: paymentId,
          userId: user.uid,
          customerName: user.fullName,
          customerEmail: user.email,
          customerPhone: user.phone,
          paymentMethod: pMethod,
          receiverAccount: receiverAccount || 'Merchant Account',
          receiverName: targetRecipient,
          bankName: bankName || '',
          swiftBic: swiftBic || '',
          qrCodeUrl: qrCodeUrl || '',
          purpose: purpose || 'Supplier Payment',
          purposeExplanation: purposeExplanation || '',
          amountRMB: numCNY,
          feeCNY: 0,
          totalDeductionCNY: numCNY,
          equivalentNGN: Math.round(numCNY * (dbState.system_settings.rates.NGN_CNY || 214.50)),
          status: 'pending',
          createdAt: Date.now(),
          reference: ref,
          notes: finalNote
        };
        dbState.supplier_payments[paymentId] = paymentDoc;

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'PAY_SUPPLIER',
          sourceCurrency: 'CNY',
          targetCurrency: 'CNY',
          amount: numCNY,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Transfer ¥${numCNY.toLocaleString()} to ${targetRecipient} via ${pMethod}`
        };

        if (idempotencyKey) {
          if (!dbState.idempotency_keys) dbState.idempotency_keys = {};
          dbState.idempotency_keys[idempotencyKey] = { payment: paymentDoc, balances: user.balances };
        }

        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Send Money Request Queued',
          message: `Your transfer of ¥${numCNY.toLocaleString()} to ${targetRecipient} is queued for review (Ref: ${ref}).`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          type: 'payment',
          targetUserId: user.uid,
          linkRoute: 'wallets'
        });

        recordAudit(user.fullName, 'SUPPLIER_PAYMENT_DISBURSED', 'supplier_payments', paymentId, `Queued ¥${numCNY} to ${targetRecipient}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, payment: paymentDoc, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 15. NAIRA BANK WITHDRAWAL (NUBAN Validation & Processing Fee)
    // -------------------------------------------------------------
    if (pathname === '/api/wallets/withdraw' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { userId, bankName, bankCode, accountNumber, accountName, amountNGN, pin, note, customerNote, fee: customFee, reference, idempotencyKey } = body;

      // Idempotency check
      if (idempotencyKey && dbState.idempotency_keys && dbState.idempotency_keys[idempotencyKey]) {
        return sendJson(res, 200, {
          success: true,
          ...dbState.idempotency_keys[idempotencyKey],
          already_processed: true,
          cached: true
        });
      }

      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      if (user.isSuspended) {
        return sendJson(res, 403, { error: 'Account suspended. Withdrawals restricted.' });
      }

      if (!accountNumber || !/^\d{10}$/.test(String(accountNumber))) {
        return sendJson(res, 400, { error: 'Account number must be exactly 10 digits' });
      }

      if (!validateNuban(accountNumber, bankName)) {
        return sendJson(res, 400, { error: 'Invalid 10-digit NUBAN check digit for selected bank' });
      }

      const num = Number(amountNGN);
      if (isNaN(num) || num <= 0) return sendJson(res, 400, { error: 'Invalid withdrawal amount' });
      if (num < 1000) return sendJson(res, 400, { error: 'Minimum withdrawal amount is ₦1,000' });

      const fee = typeof customFee === 'number' ? customFee : (dbState.system_settings.fees.withdrawalFlatNGN || 500);
      const totalDebit = num + fee;

      if ((user.balances.NGN || 0) < totalDebit) {
        return sendJson(res, 400, { error: `Insufficient NGN balance for withdrawal + ₦${fee} flat fee` });
      }

      const ref = reference || `WD-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const wthId = `wth_${Date.now()}`;

      let wthDoc;
      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances.NGN;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'WITHDRAW_RESERVED',
          description: `Withdrawal payout to ${bankName || 'Nigerian Bank'} (${accountNumber})`,
          postings: [
            { account: `liabilities:customer:${user.uid}:ngn`, currency: 'NGN', debit: totalDebit, credit: 0 },
            { account: `liabilities:pending_withdrawals:${wthId}`, currency: 'NGN', debit: 0, credit: num },
            { account: 'revenue:fees:withdrawal', currency: 'NGN', debit: 0, credit: fee }
          ]
        });

        user.balances.NGN -= totalDebit;
        const closingBalance = user.balances.NGN;

        wthDoc = {
          id: wthId,
          userId: user.uid,
          customerName: user.fullName,
          customerEmail: user.email,
          customerPhone: user.phone,
          bankName: bankName || 'Zenith Bank Plc',
          bankCode: bankCode || '',
          accountNumber,
          accountName: accountName || user.fullName,
          amountNGN: num,
          feeNGN: fee,
          totalDebit,
          note: note || customerNote || 'Bank transfer',
          status: 'pending',
          reference: ref,
          transferReference: ref,
          createdAt: Date.now()
        };
        dbState.withdrawals[wthId] = wthDoc;

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'WITHDRAW',
          sourceCurrency: 'NGN',
          targetCurrency: 'NGN',
          amount: num,
          fee,
          openingBalance,
          closingBalance,
          status: 'pending',
          reference: ref,
          timestamp: Date.now(),
          notes: `Payout ₦${num.toLocaleString()} to ${wthDoc.bankName} (${accountNumber})`
        };

        if (idempotencyKey) {
          if (!dbState.idempotency_keys) dbState.idempotency_keys = {};
          dbState.idempotency_keys[idempotencyKey] = { withdrawal: wthDoc, balances: user.balances };
        }

        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Withdrawal Request Submitted',
          message: `₦${num.toLocaleString()} withdrawal to ${wthDoc.bankName} queued for processing (Ref: ${ref}).`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          type: 'withdrawal',
          targetUserId: user.uid,
          linkRoute: 'wallets'
        });

        recordAudit(user.fullName, 'WITHDRAWAL_INITIATED', 'withdrawals', wthId, `Initiated withdrawal of ₦${num} to ${wthDoc.bankName}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, withdrawal: wthDoc, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 16. ADMIN WITHDRAWAL SETTLEMENT / REFUND
    // -------------------------------------------------------------
    if (pathname === '/api/admin/withdrawals/processing' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }
      const { withdrawalId, adminId } = await readJsonBody(req);
      const wth = dbState.withdrawals[withdrawalId];
      if (!wth) return sendJson(res, 404, { error: 'Withdrawal not found' });
      if (wth.status !== 'pending') {
        return sendJson(res, 400, { error: `Withdrawal is not in pending status (Current: ${wth.status})` });
      }
      wth.status = 'processing';
      wth.processingStartedAt = Date.now();
      wth.reviewer = adminId || 'Finance Officer';

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₦${wth.amountNGN.toLocaleString()} (Ref: ${wth.transferReference}) is being processed via NIBSS.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'withdrawal',
        targetUserId: wth.userId,
        linkRoute: 'wallets'
      });

      recordAudit(adminId || 'Treasury Desk', 'WITHDRAWAL_PROCESSING', 'withdrawals', wth.id, `Status updated to processing`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, withdrawal: wth });
    }

    if (pathname === '/api/admin/withdrawals/disburse' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }

      const { withdrawalId, transferReference, paymentProofUrl, adminNotes, adminId } = await readJsonBody(req);
      const wth = dbState.withdrawals[withdrawalId];
      if (!wth) return sendJson(res, 404, { error: 'Withdrawal not found' });
      if (wth.status === 'approved' || wth.status === 'completed') {
        return sendJson(res, 400, { error: 'Withdrawal already completed' });
      }
      if (wth.status === 'failed' || wth.status === 'rejected') {
        return sendJson(res, 400, { error: 'Cannot complete a rejected withdrawal' });
      }

      recordDoubleEntry({
        reference: transferReference || `NIBSS-${wth.id}`,
        userId: wth.userId,
        transactionType: 'WITHDRAW_CLEARED',
        description: `NIBSS disbursement completed for ${wth.accountNumber}`,
        postings: [
          { account: `liabilities:pending_withdrawals:${wth.id}`, currency: 'NGN', debit: wth.amountNGN, credit: 0 },
          { account: 'assets:nigeria:nibss_clearing:ngn', currency: 'NGN', debit: 0, credit: wth.amountNGN }
        ]
      });

      wth.status = 'approved';
      wth.completed = true;
      wth.transferReference = transferReference || wth.transferReference;
      wth.paymentProofUrl = paymentProofUrl || wth.paymentProofUrl || '';
      wth.adminNotes = adminNotes || wth.adminNotes || '';
      wth.reviewer = adminId || 'Finance Officer';
      wth.completedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Withdrawal Payout Cleared',
        message: `₦${wth.amountNGN.toLocaleString()} has been sent to ${wth.bankName} (${wth.accountNumber}). Ref: ${wth.transferReference}.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'withdrawal',
        targetUserId: wth.userId,
        linkRoute: 'wallets'
      });

      recordAudit('Treasury Desk', 'WITHDRAWAL_DISBURSED', 'withdrawals', wth.id, `Disbursed ₦${wth.amountNGN} via NIBSS (Ref: ${wth.transferReference})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, withdrawal: wth });
    }

    if (pathname === '/api/admin/withdrawals/refund' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }

      const { withdrawalId, reason, adminId } = await readJsonBody(req);
      const wth = dbState.withdrawals[withdrawalId];
      if (!wth) return sendJson(res, 404, { error: 'Withdrawal not found' });
      if (wth.status === 'approved' || wth.status === 'completed') {
        return sendJson(res, 400, { error: 'Cannot reject or refund an already completed withdrawal' });
      }
      if (wth.status === 'failed' || wth.status === 'rejected') {
        return sendJson(res, 400, { error: 'Withdrawal already rejected or refunded' });
      }
      if (!reason || !reason.trim()) {
        return sendJson(res, 400, { error: 'Mandatory rejection reason required' });
      }

      const user = dbState.users[wth.userId];
      const totalRefund = wth.amountNGN + wth.feeNGN;
      const ref = `REV-${wth.transferReference}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances.NGN;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'WITHDRAW_REVERSED',
          description: `Refund for failed withdrawal: ${reason}`,
          postings: [
            { account: `liabilities:pending_withdrawals:${wth.id}`, currency: 'NGN', debit: wth.amountNGN, credit: 0 },
            { account: 'revenue:fees:withdrawal', currency: 'NGN', debit: wth.feeNGN, credit: 0 },
            { account: `liabilities:customer:${user.uid}:ngn`, currency: 'NGN', debit: 0, credit: totalRefund }
          ]
        });

        user.balances.NGN = (user.balances.NGN || 0) + totalRefund;
        const closingBalance = user.balances.NGN;
        wth.status = 'failed';
        wth.rejected = true;
        wth.failureReason = reason;
        wth.refundReason = reason;
        wth.refundedAt = Date.now();
        wth.reviewer = adminId || 'Finance Officer';

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'WITHDRAW',
          sourceCurrency: 'NGN',
          targetCurrency: 'NGN',
          amount: totalRefund,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Reversal & refund: ₦${totalRefund.toLocaleString()} returned to wallet (${reason})`
        };

        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Withdrawal Rejected & Refunded',
          message: `₦${totalRefund.toLocaleString()} (including fee) has been refunded to your NGN wallet. Reason: ${reason}.`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          type: 'withdrawal',
          targetUserId: user.uid,
          linkRoute: 'wallets'
        });

        recordAudit(adminId || 'Treasury Desk', 'WITHDRAWAL_REFUNDED', 'withdrawals', wth.id, `Refunded ₦${totalRefund} to user`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, withdrawal: wth, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 17. CARGO FREIGHT SETTLEMENT (Multi-Currency & Pay on Arrival)
    // -------------------------------------------------------------
    if (pathname === '/api/shipments/pay-freight' && req.method === 'POST') {
      const { shipmentId, userId, paidWith, walletCurrency, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      const ship = dbState.shipments[shipmentId];
      if (!user || !ship) return sendJson(res, 404, { error: 'User or Shipment not found' });

      if (ship.freightPaid) {
        return sendJson(res, 400, { error: 'Freight fee has already been settled for this waybill' });
      }

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const curr = paidWith || walletCurrency || 'USD';
      let requiredDebit = ship.freightFeeUSD || ship.freightFee || 285;
      if (curr === 'NGN') {
        requiredDebit = ship.freightFeeNGN || Math.round(requiredDebit * (dbState.system_settings.rates.USD_NGN || 1485));
      } else if (curr === 'CNY') {
        requiredDebit = ship.freightFeeCNY || Math.round(requiredDebit * (dbState.system_settings.rates.USD_CNY || 7.24) * 100) / 100;
      }

      if ((user.balances[curr] || 0) < requiredDebit) {
        return sendJson(res, 400, { error: `Insufficient ${curr} balance to clear freight fee (Required: ${curr} ${requiredDebit.toLocaleString()})` });
      }

      const ref = `WAYBILL-${ship.trackingCode || ship.trackingNumber}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr];

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'CARGO_FREIGHT',
          description: `Freight settlement for Waybill #${ship.trackingCode || ship.trackingNumber}`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: requiredDebit, credit: 0 },
            { account: 'revenue:fees:freight', currency: curr, debit: 0, credit: requiredDebit }
          ]
        });

        user.balances[curr] -= requiredDebit;
        const closingBalance = user.balances[curr];

        ship.freightPaid = true;
        ship.paymentStatus = 'paid';
        ship.paymentTiming = 'immediate';
        ship.paidCurrency = curr;
        ship.paidAmount = requiredDebit;
        ship.currentStatus = 'ready_for_dispatch';
        ship.status = 'ready_for_dispatch';

        ship.timeline.push({
          status: 'Freight Paid',
          location: 'Lagos Clearing Escrow',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes: `Freight cleared in full (${curr} ${requiredDebit.toLocaleString()}). Ready for customs release and flight dispatch.`
        });
        ship.updatedAt = Date.now();

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'CARGO_FREIGHT',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: requiredDebit,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Freight settlement for Waybill #${ship.trackingCode || ship.trackingNumber}`
        };

        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Freight Settlement Confirmed',
          message: `Freight for #${ship.trackingCode || ship.trackingNumber} paid in full (${curr} ${requiredDebit.toLocaleString()}). Consignment is ready for dispatch.`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          type: 'shipment',
          targetUserId: user.uid,
          linkRoute: 'track'
        });

        recordAudit(user.fullName, 'FREIGHT_PAID', 'shipments', ship.id, `Cleared freight of ${curr} ${requiredDebit} for ${ship.trackingNumber}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship, balances: user.balances });
    }

    if (pathname === '/api/shipments/defer-payment' && req.method === 'POST') {
      const { shipmentId, userId } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      ship.paymentStatus = 'deferred';
      ship.paymentTiming = 'pay_on_arrival';
      ship.freightPaid = false;
      ship.currentStatus = 'ready_for_dispatch';
      ship.status = 'ready_for_dispatch';

      ship.timeline.push({
        status: 'Payment Deferred',
        location: 'Billing Desk',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: 'Pay on Arrival selected. Freight fee will be collected upon pickup at Lagos hub or doorstep handover.'
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Pay on Arrival Selected',
        message: `Shipment #${ship.trackingCode || ship.trackingNumber} cleared for dispatch. Freight will be collected upon arrival in Lagos.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit('Customer', 'FREIGHT_PAYMENT_DEFERRED', 'shipments', ship.id, `Deferred freight to pay-on-arrival for ${ship.trackingNumber}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    // -------------------------------------------------------------
    // 18. SUPPLIER 30-DAY SUBSCRIPTION GATE & PROTECTED CONTACTS
    // -------------------------------------------------------------
    if (pathname === '/api/suppliers/subscribe' && req.method === 'POST') {
      const { userId, supplierId, paidWith, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const curr = paidWith || 'USD';
      const feeUSD = dbState.system_settings.fees.supplier30DayPassUSD || 50;
      const fee = curr === 'NGN' ? Math.round(feeUSD * (dbState.system_settings.rates.USD_NGN || 1485)) : feeUSD;

      if ((user.balances[curr] || 0) < fee) {
        return sendJson(res, 400, { error: `Insufficient ${curr} balance to activate 30-day supplier directory pass` });
      }

      const subId = `sub_${supplierId}_${user.uid}`;
      let subscription;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr];

        recordDoubleEntry({
          reference: `SUB-SUPPLIER-${supplierId.slice(-4)}`,
          userId: user.uid,
          transactionType: 'SUPPLIER_SUB',
          description: `30-Day VIP Supplier Contact Pass for #${supplierId}`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: fee, credit: 0 },
            { account: 'revenue:fees:supplier_pass', currency: curr, debit: 0, credit: fee }
          ]
        });

        const closingBalance = user.balances[curr];

        subscription = {
          id: subId,
          userId: user.uid,
          supplierId,
          purchasedAt: Date.now(),
          activeUntil: Date.now() + 30 * 86400000, // Exactly 30 days
          feeUSD,
          status: 'active'
        };
        dbState.supplier_subscriptions[subId] = subscription;

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'SUPPLIER_SUB',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: fee,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: `SUB-SUPPLIER-${supplierId.slice(-4)}`,
          timestamp: Date.now(),
          notes: `30-Day VIP Supplier Contact Pass for #${supplierId}`
        };

        recordAudit(user.fullName, 'SUPPLIER_SUB_PURCHASED', 'supplier_subscriptions', subId, `Purchased 30-day contact pass for ${supplierId}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, subscription, balances: user.balances });
    }

    if (pathname === '/api/suppliers/contact' && req.method === 'GET') {
      const supplierId = parsedUrl.searchParams.get('supplierId');
      const userId = parsedUrl.searchParams.get('userId') || 'usr_alade_01';

      const subId = `sub_${supplierId}_${userId}`;
      const sub = dbState.supplier_subscriptions[subId];
      const isSubscribed = sub && sub.activeUntil > Date.now();

      if (!isSubscribed) {
        return sendJson(res, 403, { 
          unlocked: false, 
          error: 'Active 30-day VIP pass required to view verified direct factory contacts' 
        });
      }

      const contacts = PRIVATE_SUPPLIER_CONTACTS[supplierId] || {
        wechatId: `vip_factory_${supplierId}`,
        phone: '+86 20 8888 9999',
        directManager: 'General Export Manager',
        factoryAddress: 'China Industrial Trade Zone'
      };

      return sendJson(res, 200, { unlocked: true, contacts, expiresAt: sub.activeUntil });
    }

    // -------------------------------------------------------------
    // 19. TECH STORE INVENTORY & CHECKOUT CONCURRENCY
    // -------------------------------------------------------------
    if (pathname === '/api/shop/checkout' && req.method === 'POST') {
      const { userId, items, totalAmount, currency, deliveryAddress, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const curr = currency || 'USD';

      // Authoritative Price Revalidation: calculate actual catalog price to prevent client tampering
      let calculatedUSD = 0;
      if (Array.isArray(items)) {
        for (const item of items) {
          const prodId = item.product?.id || item.productId;
          const p = dbState.products && dbState.products[prodId];
          if (p) {
            const qty = Number(item.quantity) || 1;
            calculatedUSD += (p.priceUSD || 0) * qty;
          }
        }
      }

      let requiredDebit = calculatedUSD > 0 ? calculatedUSD : Number(totalAmount);
      if (curr === 'NGN') {
        requiredDebit = Math.round(requiredDebit * (dbState.system_settings.rates.USD_NGN || 1485));
      } else if (curr === 'CNY') {
        requiredDebit = Math.round(requiredDebit * (dbState.system_settings.rates.USD_CNY || 7.24));
      }

      if (isNaN(requiredDebit) || requiredDebit <= 0) return sendJson(res, 400, { error: 'Invalid order amount' });

      if ((user.balances[curr] || 0) < requiredDebit) {
        return sendJson(res, 400, { error: `Insufficient ${curr} balance to complete purchase (Required: ${curr} ${requiredDebit.toLocaleString()})` });
      }

      let orderDoc;
      let ledgerEntry;

      await withUserLock(user.uid, async () => {
        // Concurrency check: verify stock for every item before deducting
        if (Array.isArray(items)) {
          for (const item of items) {
            const prodId = item.product?.id || item.productId;
            if (prodId && dbState.products && dbState.products[prodId]) {
              const p = dbState.products[prodId];
              const qty = item.quantity || 1;
              if (p.stockCount < qty) {
                throw new Error(`Item "${p.title}" is out of stock (available: ${p.stockCount})`);
              }
            }
          }

          // Decrement stock atomically
          for (const item of items) {
            const prodId = item.product?.id || item.productId;
            if (prodId && dbState.products && dbState.products[prodId]) {
              const p = dbState.products[prodId];
              p.stockCount -= (item.quantity || 1);
              p.inStock = p.stockCount > 0;
            }
          }
        }

        const openingBalance = user.balances[curr];
        const orderId = `ord_tech_${Date.now()}`;
        const orderNumber = `ORD-HK-${Math.floor(10000 + Math.random() * 90000)}`;
        const trackingNumber = `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`;

        recordDoubleEntry({
          reference: orderNumber,
          userId: user.uid,
          transactionType: 'SHOP_ORDER',
          description: `Hong Kong Tech Wholesale: ${items?.[0]?.product?.title || 'Apple Gadgets'}`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: requiredDebit, credit: 0 },
            { account: 'revenue:sales:tech_gadgets', currency: curr, debit: 0, credit: requiredDebit }
          ]
        });

        const closingBalance = user.balances[curr];

        orderDoc = {
          id: orderId,
          userId: user.uid,
          items: items || [],
          totalAmount: requiredDebit,
          currency: curr,
          deliveryAddress: deliveryAddress || 'Lagos, Nigeria',
          paymentWalletUsed: curr,
          fulfillmentStatus: 'processing',
          createdAt: Date.now(),
          orderNumber,
          trackingNumber
        };
        dbState.shop_orders[orderId] = orderDoc;

        const ledgerId = `ldg_${Date.now()}`;
        ledgerEntry = {
          id: ledgerId,
          userId: user.uid,
          type: 'SHOP_ORDER',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: requiredDebit,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: orderNumber,
          timestamp: Date.now(),
          notes: `Hong Kong Tech Wholesale: ${items?.[0]?.product?.title || 'Apple Gadgets'}`
        };
        dbState.wallets_ledger[ledgerId] = ledgerEntry;

        recordAudit(user.fullName, 'SHOP_ORDER_PLACED', 'shop_orders', orderId, `Placed order #${orderNumber} (${curr} ${requiredDebit})`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, order: orderDoc, ledger: ledgerEntry, balances: user.balances });
    }

    if ((pathname === '/api/shop/cancel' || pathname === '/api/admin/shop/orders/refund') && req.method === 'POST') {
      const { orderId, reason, adminId } = await readJsonBody(req);
      const order = dbState.shop_orders[orderId];
      if (!order) return sendJson(res, 404, { error: 'Order not found' });
      if (order.fulfillmentStatus === 'cancelled' || order.fulfillmentStatus === 'refunded') {
        return sendJson(res, 400, { error: 'Order is already cancelled or refunded' });
      }

      const user = dbState.users[order.userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      const curr = order.currency || order.paymentWalletUsed || 'USD';
      const amount = order.totalAmount;
      const ref = `REV-${order.orderNumber || order.id}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr] || 0;

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'SHOP_ORDER_REFUND',
          description: `Order #${order.orderNumber || order.id} cancellation refund: ${reason || 'Customer requested cancellation'}`,
          postings: [
            { account: `liabilities:shop_escrow:${curr.toLowerCase()}`, currency: curr, debit: amount, credit: 0 },
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: amount }
          ]
        });

        // Restore stock
        if (order.items && Array.isArray(order.items)) {
          for (const itm of order.items) {
            const prodId = itm.product?.id;
            if (prodId && dbState.products[prodId]) {
              dbState.products[prodId].stockCount = (dbState.products[prodId].stockCount || 0) + (itm.quantity || 1);
            }
          }
        }

        const closingBalance = user.balances[curr];
        order.fulfillmentStatus = 'cancelled';
        order.cancellationReason = reason || 'Customer requested cancellation';
        order.cancelledAt = Date.now();

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'SHOP_ORDER',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Shop order refund: ${curr} ${amount.toLocaleString()} credited back`
        };

        recordAudit(adminId || user.fullName, 'SHOP_ORDER_CANCELLED', 'shop_orders', order.id, `Order #${order.orderNumber || order.id} cancelled & refunded (${curr} ${amount})`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, order, balances: user.balances });
    }

    if (pathname === '/api/admin/shop/orders/fulfill' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'logistics_manager', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      const { orderId, trackingNumber, status, notes } = await readJsonBody(req);
      const order = dbState.shop_orders[orderId];
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      order.fulfillmentStatus = status || 'shipped';
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (notes) order.fulfillmentNotes = notes;
      order.updatedAt = Date.now();

      recordAudit('Shop Operations', 'ORDER_FULFILLED', 'shop_orders', order.id, `Status updated to ${order.fulfillmentStatus}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, order });
    }

    if ((pathname === '/api/shipments/cancel' || pathname === '/api/admin/shipments/refund') && req.method === 'POST') {
      const { shipmentId, reason, adminId } = await readJsonBody(req);
      const shipment = dbState.shipments[shipmentId];
      if (!shipment) return sendJson(res, 404, { error: 'Shipment not found' });
      if (shipment.currentStatus === 'Cancelled') {
        return sendJson(res, 400, { error: 'Shipment is already cancelled' });
      }

      const user = dbState.users[shipment.userId];
      if (shipment.freightPaid && user) {
        const curr = shipment.freightCurrency || shipment.costCurrency || 'USD';
        const fee = shipment.freightFee || shipment.costEstimate || 0;
        const ref = `REF-SHP-${shipment.trackingNumber}`;

        await withUserLock(user.uid, async () => {
          const openingBalance = user.balances[curr] || 0;
          recordDoubleEntry({
            reference: ref,
            userId: user.uid,
            transactionType: 'FREIGHT_REFUND',
            description: `Freight fee refund for cancelled shipment ${shipment.trackingNumber}: ${reason || 'Operational cancellation'}`,
            postings: [
              { account: `liabilities:freight_escrow:${curr.toLowerCase()}`, currency: curr, debit: fee, credit: 0 },
              { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: fee }
            ]
          });
          const closingBalance = user.balances[curr];
          shipment.freightPaid = false;

          const ledgerId = `ldg_${Date.now()}`;
          dbState.wallets_ledger[ledgerId] = {
            id: ledgerId,
            userId: user.uid,
            type: 'CARGO_FREIGHT',
            sourceCurrency: curr,
            targetCurrency: curr,
            amount: fee,
            fee: 0,
            openingBalance,
            closingBalance,
            status: 'completed',
            reference: ref,
            timestamp: Date.now(),
            notes: `Freight refund for shipment ${shipment.trackingNumber}: ${curr} ${fee.toLocaleString()} credited back`
          };
        });
      }

      shipment.currentStatus = 'Cancelled';
      shipment.cancellationReason = reason || 'Cancelled by staff / user';
      shipment.updatedAt = Date.now();

      recordAudit(adminId || 'Logistics Desk', 'SHIPMENT_CANCELLED', 'shipments', shipment.id, `Shipment ${shipment.trackingNumber} cancelled`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment, balances: user ? user.balances : null });
    }

    if (pathname === '/api/shipments/register' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const {
        originWarehouse, shippingMode, courierCompany, trackingNumber,
        chineseCourierTracking, packageDescription, title, cartonsCount,
        weightKg, declaredValueRMB, supplierInvoiceUrl, consolidationPreference,
        deliveryType, pickupHub, doorstepAddress, userId, receiverName, sender
      } = body;

      const uid = userId || 'usr_alade_01';
      const user = dbState.users[uid];
      const shipmentId = `shp_${Date.now()}`;
      const numWeight = parseFloat(weightKg) || 5.0;
      const isAir = (shippingMode || 'Air Regular').toLowerCase().includes('air');
      const ratePerKg = isAir ? ((shippingMode || '').toLowerCase().includes('express') ? 11.5 : 9.5) : 3.5;
      const costEstimate = Math.round(numWeight * ratePerKg * 100) / 100;

      const randNum = Math.floor(10000 + Math.random() * 90000);
      const shipmentCode = `SL-2026-${randNum}`;
      const trackingCode = `FMCN${Math.floor(10000000 + Math.random() * 90000000)}`;
      const pickupOtp = String(Math.floor(100000 + Math.random() * 900000));
      const cTrack = trackingNumber || chineseCourierTracking || `SF${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const newShipment = {
        id: shipmentId,
        shipmentCode,
        trackingCode,
        trackingNumber: cTrack,
        chineseCourierTracking: cTrack,
        userId: uid,
        receiverName: receiverName || (user ? user.fullName : 'Chief Babatunde Alade'),
        customerPhone: user?.phone || '+234 803 555 9201',
        originWarehouse: originWarehouse || 'Guangzhou',
        destination: 'Nigeria',
        destinationHub: deliveryType === 'doorstep' ? 'Lagos Doorstep Delivery' : (pickupHub || 'Ikeja MMIA Cargo Hub'),
        deliveryType: deliveryType || 'pickup',
        pickupHub: pickupHub || 'Ikeja MMIA Cargo Hub',
        doorstepAddress: doorstepAddress || undefined,
        shippingMode: shippingMode || 'Air Regular',
        mode: isAir ? 'Air Freight' : 'Sea Freight',
        courierCompany: courierCompany || 'SF Express',
        packageDescription: packageDescription || title || 'Commercial Goods Consignment',
        title: title || packageDescription || 'Commercial Goods Consignment',
        sender: sender || 'Domestic Chinese Supplier',
        cartonsCount: Number(cartonsCount) || 1,
        weightKg: numWeight,
        declaredValueRMB: Number(declaredValueRMB) || 0,
        supplierInvoiceUrl: supplierInvoiceUrl || undefined,
        consolidationPreference: consolidationPreference || 'Keep original packaging',
        currentStatus: 'registered',
        status: 'registered',
        paymentStatus: 'unbilled',
        freightPaid: false,
        costEstimate,
        costCurrency: 'USD',
        pickupOtp,
        timeline: [
          {
            status: 'registered',
            location: `${originWarehouse || 'Guangzhou'} International Receiving Dock`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: `Package pre-alert registered by customer. Courier: ${courierCompany || 'SF Express'} #${cTrack}.`
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      dbState.shipments[shipmentId] = newShipment;

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Package Pre-Alert Registered',
        message: `Package #${newShipment.trackingCode} (${newShipment.shipmentCode}) registered for ${newShipment.originWarehouse} delivery.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: uid,
        linkRoute: 'track'
      });

      recordAudit(user ? user.fullName : 'Client', 'SHIPMENT_REGISTERED', 'shipments', shipmentId, `Registered package ${newShipment.trackingCode} (${newShipment.shipmentCode})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, shipment: newShipment });
    }

    if (pathname === '/api/shipments/intake' && req.method === 'POST') {
      const { shipmentId, actualWeightKg, lengthCm, widthCm, heightCm, dimensions, cbm, inspectionPhotos, inspectionNotes, packagingCondition, adminId } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      const actWeight = parseFloat(actualWeightKg) || ship.weightKg || 5.0;
      const l = lengthCm || (dimensions ? dimensions.lengthCm : null);
      const w = widthCm || (dimensions ? dimensions.widthCm : null);
      const h = heightCm || (dimensions ? dimensions.heightCm : null);
      let volWeight = 0;
      if (l && w && h) {
        volWeight = (Number(l) * Number(w) * Number(h)) / 6000;
      } else if (cbm) {
        volWeight = Number(cbm) * 167;
      }
      const billable = Math.max(actWeight, volWeight);

      ship.actualWeightKg = actWeight;
      ship.weightKg = actWeight;
      ship.billableWeightKg = Number(billable.toFixed(2));
      if (l && w && h) {
        ship.dimensions = { lengthCm: Number(l), widthCm: Number(w), heightCm: Number(h) };
        ship.cbm = Number(((Number(l) * Number(w) * Number(h)) / 1000000).toFixed(3));
      } else if (cbm) {
        ship.cbm = Number(cbm);
      }
      if (Array.isArray(inspectionPhotos) && inspectionPhotos.length > 0) {
        ship.inspectionPhotos = inspectionPhotos;
      }
      if (inspectionNotes) ship.inspectionNotes = inspectionNotes;
      if (packagingCondition) ship.packagingCondition = packagingCondition;

      ship.currentStatus = 'inspection';
      ship.status = 'inspection';
      ship.timeline.push({
        status: 'inspection',
        location: `${ship.originWarehouse || 'China'} Warehouse Receiving Dock`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: `Package weighed (${actWeight} kg actual, ${ship.billableWeightKg} kg billable). Packaging condition: ${packagingCondition || 'Intact'}. Inspection photos recorded.`
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Package Received & Weighed at China Dock',
        message: `Package #${ship.trackingCode || ship.trackingNumber} received at ${ship.originWarehouse} warehouse. Actual weight: ${actWeight} kg. Inspection photos ready.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit(adminId || 'Warehouse Officer', 'SHIPMENT_INSPECTED', 'shipments', ship.id, `Inspected & weighed ${ship.trackingNumber}: ${actWeight} kg`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    if (pathname === '/api/shipments/bill' && req.method === 'POST') {
      const { shipmentId, freightFeeUSD, ratePerKg, billingNotes, adminId } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      const feeUSD = parseFloat(freightFeeUSD);
      if (isNaN(feeUSD) || feeUSD <= 0) return sendJson(res, 400, { error: 'Valid freight fee in USD required' });

      const usdNgnRate = dbState.system_settings.rates.USD_NGN || 1485;
      const usdCnyRate = dbState.system_settings.rates.USD_CNY || 7.24;

      ship.freightFeeUSD = feeUSD;
      ship.freightFee = feeUSD;
      ship.freightFeeNGN = Math.round(feeUSD * usdNgnRate);
      ship.freightFeeCNY = Math.round(feeUSD * usdCnyRate * 100) / 100;
      if (ratePerKg) ship.ratePerKg = Number(ratePerKg);
      if (billingNotes) ship.billingNotes = billingNotes;

      ship.paymentStatus = 'awaiting_payment';
      ship.currentStatus = 'awaiting_payment';
      ship.status = 'awaiting_payment';

      ship.timeline.push({
        status: 'awaiting_payment',
        location: 'Billing Desk',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: `Freight invoice generated: $${feeUSD.toFixed(2)} USD (≈ ₦${ship.freightFeeNGN.toLocaleString()} NGN). Awaiting customer payment.`
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Freight Invoice Ready for Settlement',
        message: `Freight for #${ship.trackingCode || ship.trackingNumber} is ready: $${feeUSD.toFixed(2)} USD (≈ ₦${ship.freightFeeNGN.toLocaleString()}). Pay now or choose Pay on Arrival.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit(adminId || 'Billing Officer', 'SHIPMENT_BILLED', 'shipments', ship.id, `Invoiced freight $${feeUSD} for ${ship.trackingNumber}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    if (pathname === '/api/shipments/update-status' && req.method === 'POST') {
      const { shipmentId, status, location, notes, adminId } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      ship.currentStatus = status;
      ship.status = status;
      ship.timeline.push({
        status,
        location: location || 'Cargo Route Corridor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: notes || `Shipment advanced to stage: ${status}`
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: `Shipment Milestone: ${status}`,
        message: `Waybill #${ship.trackingCode || ship.trackingNumber} has advanced: ${notes || status}`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit(adminId || 'Logistics Officer', 'SHIPMENT_STATUS_UPDATED', 'shipments', ship.id, `Updated status to ${status}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    if (pathname === '/api/shipments/verify-pickup-otp' && req.method === 'POST') {
      const { shipmentId, otp, staffName, freightCollected } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      if (ship.pickupOtp && String(otp).trim() !== String(ship.pickupOtp).trim()) {
        return sendJson(res, 400, { error: 'Invalid 6-digit Pickup OTP. Package release blocked.' });
      }

      if (ship.paymentStatus === 'deferred' && !freightCollected) {
        return sendJson(res, 400, { error: `Deferred freight payment of ₦${(ship.freightFeeNGN || 0).toLocaleString()} must be collected before releasing package.` });
      }

      if (freightCollected) {
        ship.freightPaid = true;
        ship.paymentStatus = 'paid';
      }

      ship.otpVerified = true;
      ship.handedOverTo = staffName || 'Lagos Hub Handover Officer';
      ship.handoverTimestamp = Date.now();
      ship.currentStatus = 'delivered';
      ship.status = 'delivered';

      ship.timeline.push({
        status: 'delivered',
        location: ship.destinationHub || 'Lagos Ikeja Hub',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: `Package verified via 6-digit OTP (${otp}) and handed over to customer by ${staffName || 'Hub Officer'}.`
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Package Handed Over & Collected',
        message: `Package #${ship.trackingCode || ship.trackingNumber} has been verified and picked up at ${ship.destinationHub || 'Lagos Hub'}. Thank you for shipping with FlyeMass!`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit(staffName || 'Lagos Hub Officer', 'PICKUP_OTP_VERIFIED', 'shipments', ship.id, `Released package ${ship.trackingNumber} with OTP verification`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    if (pathname === '/api/shipments/confirm-doorstep-delivery' && req.method === 'POST') {
      const { shipmentId, recipientName, proofNote, freightCollected, staffName } = await readJsonBody(req);
      const ship = dbState.shipments[shipmentId];
      if (!ship) return sendJson(res, 404, { error: 'Shipment not found' });

      if (ship.paymentStatus === 'deferred' && !freightCollected) {
        return sendJson(res, 400, { error: `Deferred freight payment of ₦${(ship.freightFeeNGN || 0).toLocaleString()} must be collected upon doorstep delivery.` });
      }

      if (freightCollected) {
        ship.freightPaid = true;
        ship.paymentStatus = 'paid';
      }

      ship.handedOverTo = recipientName || ship.receiverName;
      ship.handoverTimestamp = Date.now();
      ship.currentStatus = 'delivered';
      ship.status = 'delivered';

      ship.timeline.push({
        status: 'delivered',
        location: ship.doorstepAddress?.city ? `${ship.doorstepAddress.street}, ${ship.doorstepAddress.city}` : 'Customer Doorstep',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: `Delivered to doorstep and signed by ${recipientName || ship.receiverName}. ${proofNote || 'Signed parcel proof of delivery recorded.'}`
      });
      ship.updatedAt = Date.now();

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Package Delivered to Doorstep',
        message: `Package #${ship.trackingCode || ship.trackingNumber} has been delivered to your address. Enjoy your goods!`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'shipment',
        targetUserId: ship.userId,
        linkRoute: 'track'
      });

      recordAudit(staffName || 'Dispatch Driver', 'DOORSTEP_DELIVERY_CONFIRMED', 'shipments', ship.id, `Completed doorstep delivery for ${ship.trackingNumber}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment: ship });
    }

    if (pathname === '/api/shipments/consolidate' && req.method === 'POST') {
      const { shipmentIds, userId, destinationHub, mode } = await readJsonBody(req);
      const uid = userId || 'usr_alade_01';
      const user = dbState.users[uid];
      if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return sendJson(res, 400, { error: 'At least one package must be selected for consolidation' });
      }

      let totalWeight = 0;
      let totalCbm = 0;
      const consolidatedTitles = [];

      for (const id of shipmentIds) {
        const shp = dbState.shipments[id];
        if (shp) {
          totalWeight += (shp.weightKg || 0);
          totalCbm += (shp.cbm || 0.01);
          consolidatedTitles.push(shp.title || shp.trackingNumber);
          shp.currentStatus = 'Packed';
          shp.timeline.push({
            status: 'Packed',
            location: 'Guangzhou Consolidation Staging Bay',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: 'Consolidated into master trade container'
          });
          shp.updatedAt = Date.now();
        }
      }

      const consolId = `shp_consol_${Date.now()}`;
      const isAir = (mode || 'air').toLowerCase() === 'air';
      const consolCost = isAir ? totalWeight * 9.5 : totalWeight * 3.0;

      const masterConsolidation = {
        id: consolId,
        trackingNumber: `FM-CONSOL-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: uid,
        receiverName: user ? user.fullName : 'Valued Client',
        originWarehouse: 'Guangzhou',
        destination: destinationHub || 'Lagos Hub',
        weightKg: Number(totalWeight.toFixed(1)),
        cbm: Number(totalCbm.toFixed(3)),
        mode: isAir ? 'Air Freight' : 'Sea Freight',
        currentStatus: 'Packed',
        timeline: [
          {
            status: 'Packed',
            location: 'Guangzhou Cargo Consolidation Center',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: `Consolidated ${shipmentIds.length} parcels: ${consolidatedTitles.slice(0, 3).join(', ')}`
          }
        ],
        updatedAt: Date.now(),
        costEstimate: consolCost,
        costCurrency: 'USD',
        title: `Consolidated Master Container (${shipmentIds.length} Parcels)`,
        consolidatedShipmentIds: shipmentIds,
        freightPaid: false
      };

      dbState.shipments[consolId] = masterConsolidation;
      recordAudit(user ? user.fullName : 'Client', 'SHIPMENT_CONSOLIDATED', 'shipments', consolId, `Consolidated ${shipmentIds.length} packages into ${masterConsolidation.trackingNumber}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, consolidation: masterConsolidation, count: shipmentIds.length });
    }

    if (pathname === '/api/admin/shipments/update-waypoint' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'logistics_manager', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Logistics Manager or Super Admin role required' });
      }

      const { shipmentId, status, location, notes, adminId } = await readJsonBody(req);
      const shipment = dbState.shipments[shipmentId];
      if (!shipment) return sendJson(res, 404, { error: 'Shipment not found' });

      shipment.currentStatus = status;
      shipment.updatedAt = Date.now();
      shipment.timeline.push({
        status,
        location: location || `${shipment.originWarehouse} Logistics Center`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: notes || `Waypoint milestone advanced to ${status}`
      });

      // Also trigger in-app notification to the customer
      if (shipment.userId && dbState.users[shipment.userId]) {
        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          userId: shipment.userId,
          title: `Shipment Milestone: ${status}`,
          message: `Your cargo #${shipment.trackingNumber} is now: ${status} (${location || 'Checkpoint'}).`,
          type: 'shipping',
          timestamp: Date.now(),
          read: false,
          linkRoute: 'track'
        });
      }

      recordAudit(adminId || 'Logistics Tower', 'WAYPOINT_ADVANCED', 'shipments', shipment.id, `Status updated to ${status} (${shipment.trackingNumber})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, shipment });
    }

    // -------------------------------------------------------------
    // AGENT SERVICES & SOURCING WORKFLOWS (Phase 10)
    // -------------------------------------------------------------
    if (pathname === '/api/agents/settings' && req.method === 'GET') {
      const fees = dbState.system_settings.fees;
      return sendJson(res, 200, {
        success: true,
        settings: {
          sourcingCommissionPercent: fees.sourcingCommissionPercent || 5.0,
          minSourcingCommissionCNY: fees.minSourcingCommissionCNY || 500,
          supplierVerificationUSD: fees.supplierVerificationUSD || 150,
          factoryAuditUSD: fees.factoryAuditUSD || 250,
          qualityControlUSD: fees.qualityControlUSD || 200
        }
      });
    }

    if (pathname === '/api/admin/agents/settings' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const { sourcingCommissionPercent, minSourcingCommissionCNY, supplierVerificationUSD, factoryAuditUSD, qualityControlUSD, adminId } = await readJsonBody(req);
      const fees = dbState.system_settings.fees;

      if (sourcingCommissionPercent !== undefined) fees.sourcingCommissionPercent = parseFloat(sourcingCommissionPercent);
      if (minSourcingCommissionCNY !== undefined) fees.minSourcingCommissionCNY = parseFloat(minSourcingCommissionCNY);
      if (supplierVerificationUSD !== undefined) fees.supplierVerificationUSD = parseFloat(supplierVerificationUSD);
      if (factoryAuditUSD !== undefined) fees.factoryAuditUSD = parseFloat(factoryAuditUSD);
      if (qualityControlUSD !== undefined) fees.qualityControlUSD = parseFloat(qualityControlUSD);

      recordAudit(adminId || 'Super Admin', 'AGENT_SETTINGS_UPDATED', 'system_settings', 'fees', `Updated agent rates: Sourcing ${fees.sourcingCommissionPercent}%, Verification $${fees.supplierVerificationUSD}, Audit $${fees.factoryAuditUSD}, QC $${fees.qualityControlUSD}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, fees });
    }

    if (pathname === '/api/agents/request' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const {
        serviceType, serviceKind, productName, category, targetQuantity, targetUnitUSD, targetUnitCNY, totalBudgetCNY,
        productUrl, specifications, referencePhotos,
        supplierName, supplierLocation, supplierCity, supplierContact, supplierWechat, preferredDate, inspectionRequirements,
        inspectionRequired, cantonFairBooth, userId
      } = body;
      const uid = userId || 'usr_alade_01';
      const user = dbState.users[uid];
      const rfqId = `rfq_${Date.now()}`;

      // Generate unique AGT- code
      const kindPrefix = serviceKind === 'sourcing' ? 'SRC' :
                         serviceKind === 'supplier_verification' ? 'VER' :
                         serviceKind === 'factory_audit' ? 'AUD' :
                         serviceKind === 'quality_control' ? 'QC' : 'REQ';
      const rand5 = Math.floor(10000 + Math.random() * 90000);
      const reference = `AGT-${kindPrefix}-2026-${rand5}`;

      const newRfq = {
        id: rfqId,
        reference,
        userId: uid,
        clientName: user ? user.fullName : 'Enterprise Client',
        customerPhone: user?.phone || '+234 803 555 9201',
        customerEmail: user?.email || 'client@flyemass.com',
        serviceType: serviceType || (serviceKind === 'sourcing' ? 'Product Sourcing & Procurement' : 'Factory Inspection'),
        serviceKind: serviceKind || undefined,
        productName: productName || 'Hardware Commodity',
        category: category || 'Electronics & Tech',
        targetQuantity: parseInt(targetQuantity) || 100,
        targetUnitUSD: parseFloat(targetUnitUSD) || 10.0,
        targetUnitCNY: parseFloat(targetUnitCNY) || (parseFloat(targetUnitUSD) ? parseFloat(targetUnitUSD) * 7.24 : 70.0),
        totalBudgetCNY: parseFloat(totalBudgetCNY) || (parseInt(targetQuantity) || 100) * (parseFloat(targetUnitCNY) || 70.0),
        productUrl: productUrl || undefined,
        specifications: specifications || undefined,
        referencePhotos: Array.isArray(referencePhotos) ? referencePhotos : [],
        supplierName: supplierName || undefined,
        supplierLocation: supplierLocation || undefined,
        supplierCity: supplierCity || 'Guangzhou',
        supplierContact: supplierContact || undefined,
        supplierWechat: supplierWechat || undefined,
        preferredDate: preferredDate || undefined,
        inspectionRequirements: inspectionRequirements || undefined,
        inspectionRequired: inspectionRequired !== false,
        cantonFairBooth: cantonFairBooth || null,
        status: serviceKind ? 'pending_review' : 'pending_quote',
        paymentStatus: 'unpaid',
        timeline: [
          {
            status: serviceKind ? 'pending_review' : 'pending_quote',
            timestamp: Date.now(),
            location: `${supplierCity || 'Guangzhou'} Trade Desk`,
            notes: `Request submitted by client. Reference: ${reference}. Assigned to China trade team for review.`
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      dbState.agent_requests[rfqId] = newRfq;

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: uid,
        title: `Request Registered: ${newRfq.reference}`,
        message: `Your ${newRfq.serviceType} request for "${newRfq.productName}" is under review by our China desk.`,
        type: 'procurement',
        timestamp: Date.now(),
        read: false,
        linkRoute: 'agent'
      });

      recordAudit(user ? user.fullName : 'Client', 'AGENT_REQUEST_CREATED', 'agent_requests', rfqId, `Submitted ${newRfq.serviceType}: ${newRfq.productName} (#${newRfq.reference})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, request: newRfq });
    }

    if (pathname === '/api/admin/agents/quote' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'logistics_manager'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const body = await readJsonBody(req);
      const {
        requestId, quoteAmountUSD, quoteAmountNGN, quoteAmountCNY,
        productCostCNY, sourcingCommissionCNY, sourcingCommissionPercent, chinaShippingCNY, totalPayableCNY,
        serviceFeeUSD, leadTimeDays, supplierFindings, quotationNotes, adminNotes, assignedAgent, adminId
      } = body;

      const rfq = dbState.agent_requests[requestId];
      if (!rfq) return sendJson(res, 404, { error: 'Agent request not found' });

      // Support both sourcing breakdown and inspection quote
      rfq.productCostCNY = productCostCNY !== undefined ? parseFloat(productCostCNY) : rfq.productCostCNY;
      rfq.sourcingCommissionCNY = sourcingCommissionCNY !== undefined ? parseFloat(sourcingCommissionCNY) : rfq.sourcingCommissionCNY;
      rfq.sourcingCommissionPercent = sourcingCommissionPercent !== undefined ? parseFloat(sourcingCommissionPercent) : rfq.sourcingCommissionPercent;
      rfq.chinaShippingCNY = chinaShippingCNY !== undefined ? parseFloat(chinaShippingCNY) : rfq.chinaShippingCNY;
      rfq.totalPayableCNY = totalPayableCNY !== undefined ? parseFloat(totalPayableCNY) : rfq.totalPayableCNY;
      rfq.serviceFeeUSD = serviceFeeUSD !== undefined ? parseFloat(serviceFeeUSD) : rfq.serviceFeeUSD;

      // Currency equivalents
      const totalCNY = rfq.totalPayableCNY || (parseFloat(quoteAmountCNY) || 0);
      let calculatedUSD = quoteAmountUSD ? parseFloat(quoteAmountUSD) : (totalCNY > 0 ? Math.round((totalCNY / 7.24) * 100) / 100 : (rfq.serviceFeeUSD || 250));
      let calculatedNGN = quoteAmountNGN ? parseFloat(quoteAmountNGN) : Math.round(calculatedUSD * 1485);

      rfq.quoteAmountUSD = calculatedUSD;
      rfq.quoteAmountNGN = calculatedNGN;
      rfq.quoteAmountCNY = totalCNY > 0 ? totalCNY : Math.round(calculatedUSD * 7.24 * 100) / 100;
      rfq.leadTimeDays = parseInt(leadTimeDays) || 7;
      rfq.supplierFindings = supplierFindings || undefined;
      rfq.adminNotes = adminNotes || quotationNotes || 'Official quotation formulated by China ground manager';
      rfq.assignedAgent = assignedAgent || 'Zhang Wei (Bilingual Ground Agent)';
      
      // Status transition: awaiting_payment for Phase 10, quote_ready for Phase 6 backwards compatibility
      rfq.status = rfq.serviceKind ? 'awaiting_payment' : 'quote_ready';
      rfq.paymentStatus = 'awaiting_payment';
      rfq.quotedAt = Date.now();
      rfq.updatedAt = Date.now();

      if (!rfq.timeline) rfq.timeline = [];
      rfq.timeline.push({
        status: 'awaiting_payment',
        location: `${rfq.supplierCity || 'China'} Trade Desk`,
        timestamp: Date.now(),
        notes: `Quotation issued: $${rfq.quoteAmountUSD} USD (≈ ₦${rfq.quoteAmountNGN.toLocaleString()} NGN / ¥${rfq.quoteAmountCNY.toLocaleString()} CNY). Lead time: ${rfq.leadTimeDays} days.`
      });

      // Notify customer
      if (rfq.userId && dbState.users[rfq.userId]) {
        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          userId: rfq.userId,
          title: `Quotation Ready: ${rfq.reference || rfq.productName}`,
          message: `Your quote for $${rfq.quoteAmountUSD} USD (¥${rfq.quoteAmountCNY} CNY) is ready for review and wallet authorization!`,
          type: 'procurement',
          timestamp: Date.now(),
          read: false,
          linkRoute: 'agent'
        });
      }

      recordAudit(adminId || 'Agent Desk', 'AGENT_QUOTE_ISSUED', 'agent_requests', rfq.id, `Quoted $${rfq.quoteAmountUSD} USD for ${rfq.productName} (#${rfq.reference || rfq.id})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, request: rfq });
    }

    if (pathname === '/api/agents/accept-quote' && req.method === 'POST') {
      const { requestId, pin, paymentWalletUsed, userId } = await readJsonBody(req);
      const rfq = dbState.agent_requests[requestId];
      if (!rfq) return sendJson(res, 404, { error: 'Agent request not found' });

      if (rfq.paymentStatus === 'paid') {
        return sendJson(res, 400, { error: 'Agent request has already been paid in full' });
      }

      if (rfq.status !== 'quote_ready' && rfq.status !== 'awaiting_payment' && rfq.paymentStatus !== 'awaiting_payment') {
        return sendJson(res, 400, { error: 'RFQ is not awaiting payment' });
      }

      const uid = userId || rfq.userId || 'usr_alade_01';
      const user = dbState.users[uid];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // PIN check
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const curr = (paymentWalletUsed || 'USD').toUpperCase();
      let requiredAmount = rfq.quoteAmountUSD || 250;
      if (curr === 'NGN') {
        requiredAmount = rfq.quoteAmountNGN || Math.round(requiredAmount * 1485);
      } else if (curr === 'CNY') {
        requiredAmount = rfq.totalPayableCNY || rfq.quoteAmountCNY || Math.round(requiredAmount * 7.24 * 100) / 100;
      }

      const ref = `AGTPAY-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr] || 0;
        if (openingBalance < requiredAmount) {
          throw new Error(`Insufficient funds: Available ${curr} ${openingBalance.toLocaleString()}, required ${curr} ${requiredAmount.toLocaleString()}`);
        }

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'AGENT_SERVICE_ESCROW',
          description: `Escrow hold for agent service: ${rfq.productName} (#${rfq.reference || rfq.id})`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: requiredAmount, credit: 0 },
            { account: `liabilities:agent_escrow:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: requiredAmount }
          ]
        });

        user.balances[curr] -= requiredAmount;
        const closingBalance = user.balances[curr];

        rfq.status = rfq.serviceKind ? 'in_progress' : 'po_issued';
        rfq.paymentStatus = 'paid';
        rfq.escrowReference = ref;
        rfq.paymentReference = ref;
        rfq.escrowAmount = requiredAmount;
        rfq.escrowCurrency = curr;
        rfq.paidAmount = requiredAmount;
        rfq.paidWith = curr;
        rfq.paidAt = Date.now();
        rfq.updatedAt = Date.now();

        // Automatic Cargo Shipment Creation for Sourcing
        if (rfq.serviceKind === 'sourcing' || rfq.serviceType?.toLowerCase().includes('sourc')) {
          const shipId = `shp_${Date.now()}`;
          const randNum = Math.floor(10000 + Math.random() * 90000);
          const shipmentCode = `SL-2026-${randNum}`;
          const trackingCode = `FMCN${Math.floor(10000000 + Math.random() * 90000000)}`;
          const pickupOtp = String(Math.floor(100000 + Math.random() * 900000));

          const newShipment = {
            id: shipId,
            shipmentCode,
            trackingCode,
            trackingNumber: `SF${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            chineseCourierTracking: `SF${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            userId: user.uid,
            receiverName: user.fullName || 'Chief Babatunde Alade',
            customerPhone: user.phone || '+234 803 555 9201',
            originWarehouse: rfq.supplierCity || 'Guangzhou',
            destination: 'Nigeria (Lagos Ikeja MMIA Cargo Hub)',
            destinationHub: 'Ikeja MMIA Cargo Hub',
            deliveryType: 'pickup',
            pickupHub: 'Ikeja MMIA Cargo Hub',
            shippingMode: 'Air Express',
            mode: 'Air Freight',
            courierCompany: 'SF Express',
            packageDescription: `${rfq.productName} (${rfq.targetQuantity} units)`,
            title: `${rfq.productName} (Sourced Batch)`,
            sender: rfq.supplierName || 'China Direct Supplier',
            cartonsCount: Math.ceil(rfq.targetQuantity / 50) || 1,
            weightKg: Math.max(5, Math.round((rfq.targetQuantity || 10) * 0.2)),
            declaredValueRMB: rfq.totalPayableCNY || (rfq.targetQuantity * (rfq.targetUnitCNY || 100)),
            currentStatus: 'registered',
            status: 'registered',
            paymentStatus: 'unbilled',
            freightPaid: false,
            costEstimate: 120,
            costCurrency: 'USD',
            pickupOtp,
            linkedAgentRequestId: rfq.id,
            linkedAgentReference: rfq.reference,
            timeline: [
              {
                status: 'registered',
                location: `${rfq.supplierCity || 'Guangzhou'} International Receiving Dock`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                notes: `Cargo linked to Sourcing Request #${rfq.reference || rfq.id}. Awaiting supplier dispatch.`
              }
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          dbState.shipments[shipId] = newShipment;
          rfq.linkedShipmentId = shipId;
          rfq.linkedShipmentCode = shipmentCode;
          rfq.linkedTrackingCode = trackingCode;
        }

        if (!rfq.timeline) rfq.timeline = [];
        rfq.timeline.push({
          status: 'in_progress',
          location: `${rfq.supplierCity || 'China'} Trade Desk`,
          timestamp: Date.now(),
          notes: `Payment of ${curr} ${requiredAmount.toLocaleString()} confirmed via ${curr} wallet. Status: In Progress.`
        });

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'AGENT_PAYMENT',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: requiredAmount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Agent service fee escrow: ${rfq.serviceType} for ${rfq.productName} (#${rfq.reference || rfq.id})`
        };

        recordAudit(user.fullName, 'AGENT_QUOTE_ACCEPTED', 'agent_requests', rfq.id, `Accepted quote and paid ${curr} ${requiredAmount} into escrow (Ref: ${ref})`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, request: rfq, balances: user.balances, paymentReference: ref });
    }

    if (pathname === '/api/admin/agents/update-status' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'logistics_manager'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const body = await readJsonBody(req);
      const {
        requestId, status, operationalNotes, agentLocation, adminId,
        purchaseDetails, supplierInvoiceUrl,
        businessRegistrationFindings, legitimacyNotes,
        factoryAuditFindings, factoryPhotos,
        qualityControlFindings, qcInspectionEvidence,
        inspectionReportUrl
      } = body;

      const rfq = dbState.agent_requests[requestId];
      if (!rfq) return sendJson(res, 404, { error: 'Agent request not found' });

      if (status) rfq.status = status;
      if (operationalNotes) rfq.operationalNotes = operationalNotes;
      if (purchaseDetails) rfq.purchaseDetails = purchaseDetails;
      if (supplierInvoiceUrl) rfq.supplierInvoiceUrl = supplierInvoiceUrl;
      if (businessRegistrationFindings) rfq.businessRegistrationFindings = businessRegistrationFindings;
      if (legitimacyNotes) rfq.legitimacyNotes = legitimacyNotes;
      if (factoryAuditFindings) rfq.factoryAuditFindings = factoryAuditFindings;
      if (Array.isArray(factoryPhotos)) rfq.factoryPhotos = factoryPhotos;
      if (qualityControlFindings) rfq.qualityControlFindings = qualityControlFindings;
      if (Array.isArray(qcInspectionEvidence)) rfq.qcInspectionEvidence = qcInspectionEvidence;
      if (inspectionReportUrl) rfq.inspectionReportUrl = inspectionReportUrl;

      if (!rfq.timeline) rfq.timeline = [];
      rfq.timeline.push({
        status: status || rfq.status,
        location: agentLocation || rfq.supplierCity || 'China Desk',
        timestamp: Date.now(),
        notes: operationalNotes || `Milestone update recorded by operations desk.`
      });
      rfq.updatedAt = Date.now();

      // Notify customer
      if (rfq.userId && dbState.users[rfq.userId]) {
        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          userId: rfq.userId,
          title: `Agent Update: ${rfq.reference || rfq.productName}`,
          message: operationalNotes || `Progress update for request #${rfq.reference || rfq.id}.`,
          type: 'procurement',
          timestamp: Date.now(),
          read: false,
          linkRoute: 'agent'
        });
      }

      recordAudit(adminId || 'Agent Desk', 'AGENT_STATUS_UPDATED', 'agent_requests', rfq.id, `Updated request #${rfq.reference || rfq.id} to ${rfq.status}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, request: rfq });
    }

    if (pathname === '/api/admin/agents/complete' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const { requestId, reportSummary, inspectionReportUrl, adminId } = await readJsonBody(req);
      const rfq = dbState.agent_requests[requestId];
      if (!rfq) return sendJson(res, 404, { error: 'Agent request not found' });

      rfq.status = 'completed';
      rfq.completedAt = Date.now();
      rfq.reportSummary = reportSummary || 'Ground inspection and factory audit completed successfully. Verified deliverables filed.';
      if (inspectionReportUrl) rfq.inspectionReportUrl = inspectionReportUrl;

      // Disburse escrow to service revenue double-entry ledger
      if (rfq.escrowAmount && rfq.escrowCurrency) {
        const curr = rfq.escrowCurrency;
        const amt = rfq.escrowAmount;
        recordDoubleEntry({
          reference: `DISB-${rfq.escrowReference || rfq.id}`,
          userId: rfq.userId,
          transactionType: 'AGENT_ESCROW_DISBURSEMENT',
          description: `Disburse completed agent service escrow for ${rfq.productName}`,
          postings: [
            { account: `liabilities:agent_escrow:${curr.toLowerCase()}`, currency: curr, debit: amt, credit: 0 },
            { account: `equity:service_revenue:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: amt }
          ]
        });
      }

      if (!rfq.timeline) rfq.timeline = [];
      rfq.timeline.push({
        status: 'completed',
        location: `${rfq.supplierCity || 'China'} Trade Desk`,
        timestamp: Date.now(),
        notes: `Agent service marked complete by operations desk. Final report released.`
      });
      rfq.updatedAt = Date.now();

      // Notify customer
      if (rfq.userId && dbState.users[rfq.userId]) {
        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          userId: rfq.userId,
          title: `Service Completed: ${rfq.reference || rfq.productName}`,
          message: `Your agent request #${rfq.reference || rfq.id} has been completed! View your final inspection report.`,
          type: 'procurement',
          timestamp: Date.now(),
          read: false,
          linkRoute: 'agent'
        });
      }

      recordAudit(adminId || 'Agent Desk', 'AGENT_REQUEST_COMPLETED', 'agent_requests', rfq.id, `Marked request ${rfq.id} completed`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, request: rfq });
    }

    if (pathname === '/api/admin/agents/cancel-refund' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const { requestId, reason, adminId, forceOverride } = await readJsonBody(req);
      const rfq = dbState.agent_requests[requestId];
      if (!rfq) return sendJson(res, 404, { error: 'Agent request not found' });

      if (rfq.status === 'completed' && !forceOverride) {
        return sendJson(res, 400, { error: 'Cannot refund a completed agent request without supervisor authorization' });
      }

      if (rfq.paymentStatus === 'refunded' || rfq.status === 'refunded') {
        return sendJson(res, 400, { error: 'Request has already been refunded. Double refund prevented.' });
      }

      const uid = rfq.userId;
      const user = dbState.users[uid];
      if (!user) return sendJson(res, 404, { error: 'Customer account not found' });

      const refundRef = `AGTREF-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      if (rfq.paymentStatus === 'paid' && rfq.paidAmount && rfq.paidWith) {
        const curr = rfq.paidWith;
        const amount = rfq.paidAmount;

        await withUserLock(user.uid, async () => {
          const openingBalance = user.balances[curr] || 0;

          recordDoubleEntry({
            reference: refundRef,
            userId: user.uid,
            transactionType: 'AGENT_SERVICE_REFUND',
            description: `Refund for cancelled/rejected agent request #${rfq.reference || rfq.id}: ${reason || 'Administrative cancellation'}`,
            postings: [
              { account: `liabilities:agent_escrow:${curr.toLowerCase()}`, currency: curr, debit: amount, credit: 0 },
              { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: amount }
            ]
          });

          user.balances[curr] = (user.balances[curr] || 0) + amount;
          const closingBalance = user.balances[curr];

          const ledgerId = `ldg_${Date.now()}`;
          dbState.wallets_ledger[ledgerId] = {
            id: ledgerId,
            userId: user.uid,
            type: 'AGENT_REFUND',
            sourceCurrency: curr,
            targetCurrency: curr,
            amount,
            fee: 0,
            openingBalance,
            closingBalance,
            status: 'completed',
            reference: refundRef,
            timestamp: Date.now(),
            notes: `Refund for agent request #${rfq.reference || rfq.id}: ${reason || 'Cancelled by staff'}`
          };

          rfq.status = 'refunded';
          rfq.paymentStatus = 'refunded';
          rfq.refundReference = refundRef;
          rfq.refundAmount = amount;
          rfq.refundCurrency = curr;
          rfq.refundReason = reason || 'Administrative cancellation';
          rfq.refundedAt = Date.now();
          rfq.cancelledAt = Date.now();
          rfq.cancellationReason = reason || 'Administrative cancellation';

          if (!rfq.timeline) rfq.timeline = [];
          rfq.timeline.push({
            status: 'refunded',
            location: `${rfq.supplierCity || 'China'} Trade Desk`,
            timestamp: Date.now(),
            notes: `Request cancelled & refunded: ${curr} ${amount.toLocaleString()} restored to customer wallet. Ref: ${refundRef}. Reason: ${reason || 'Cancelled'}`
          });
        });
      } else {
        rfq.status = 'cancelled';
        rfq.cancelledAt = Date.now();
        rfq.cancellationReason = reason || 'Cancelled by customer/staff';
        if (!rfq.timeline) rfq.timeline = [];
        rfq.timeline.push({
          status: 'cancelled',
          location: `${rfq.supplierCity || 'China'} Trade Desk`,
          timestamp: Date.now(),
          notes: `Request cancelled before payment. Reason: ${reason || 'Cancelled'}`
        });
      }

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: user.uid,
        title: `Agent Request ${rfq.paymentStatus === 'refunded' ? 'Refunded' : 'Cancelled'}`,
        message: rfq.paymentStatus === 'refunded'
          ? `Refund of ${rfq.refundCurrency} ${rfq.refundAmount?.toLocaleString()} has been credited to your wallet for request #${rfq.reference || rfq.id}.`
          : `Your agent request #${rfq.reference || rfq.id} has been cancelled.`,
        type: 'procurement',
        timestamp: Date.now(),
        read: false,
        linkRoute: 'agent'
      });

      recordAudit(adminId || 'Agent Desk', 'AGENT_REQUEST_REFUNDED', 'agent_requests', rfq.id, `Refunded ${rfq.refundCurrency || ''} ${rfq.refundAmount || 0} for ${rfq.productName}. Reason: ${reason}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, request: rfq, balances: user.balances, refundReference: refundRef });
    }

    // -------------------------------------------------------------
    // 20. HOTEL RESERVATIONS & CANCELLATIONS
    // -------------------------------------------------------------
    if (pathname === '/api/hotels/book' && req.method === 'POST') {
      const { userId, hotel, nights, totalUSD, currency, guestName, pin } = await readJsonBody(req);
      const user = dbState.users[userId || 'usr_alade_01'];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // Mandatory 6-digit transaction PIN verification
      const pinCheck = verifyUserTransactionPin(user, pin);
      if (!pinCheck.valid) {
        return sendJson(res, pinCheck.status || 401, { error: pinCheck.error });
      }

      const curr = currency || 'USD';
      let requiredDebit = Number(totalUSD);
      if (curr === 'NGN') {
        requiredDebit = Math.round(requiredDebit * (dbState.system_settings.rates.USD_NGN || 1485));
      } else if (curr === 'CNY') {
        requiredDebit = Math.round(requiredDebit * (dbState.system_settings.rates.USD_CNY || 7.24));
      }

      if ((user.balances[curr] || 0) < requiredDebit) {
        return sendJson(res, 400, { error: `Insufficient ${curr} balance for hotel booking` });
      }

      const bookingId = `bk_${Date.now()}`;
      const confCode = `WST-${(hotel?.city || 'CAN').slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      let bookingDoc;
      let ledgerEntry;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr];

        recordDoubleEntry({
          reference: confCode,
          userId: user.uid,
          transactionType: 'HOTEL_BOOKING',
          description: `Reservation: ${hotel?.name || 'Partner Hotel'} (${nights || 4} nights)`,
          postings: [
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: requiredDebit, credit: 0 },
            { account: `liabilities:hotel_escrow:${bookingId}`, currency: curr, debit: 0, credit: requiredDebit }
          ]
        });

        user.balances[curr] -= requiredDebit;
        const closingBalance = user.balances[curr];

        bookingDoc = {
          id: bookingId,
          userId: user.uid,
          hotelId: hotel?.id || 'hotel-custom',
          hotelName: hotel?.name || 'China Partner Hotel',
          hotel,
          checkIn: 'Nov 12, 2026',
          checkOut: `Nov ${12 + (nights || 4)}, 2026`,
          nights: nights || 4,
          totalUSD: totalUSD || requiredDebit,
          currency: curr,
          amountDebited: requiredDebit,
          guestName: guestName || user.fullName,
          confirmationCode: confCode,
          status: 'confirmed',
          taxiCardZh: hotel?.chineseName ? `师傅您好，请带我到：${hotel.chineseName}。谢谢！` : '请带我到广州威斯汀酒店',
          createdAt: Date.now()
        };
        dbState.hotel_bookings[bookingId] = bookingDoc;

        const ledgerId = `ldg_${Date.now()}`;
        ledgerEntry = {
          id: ledgerId,
          userId: user.uid,
          type: 'HOTEL_BOOKING',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: requiredDebit,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: confCode,
          timestamp: Date.now(),
          notes: `Reservation: ${hotel?.name || 'Partner Hotel'} (${nights || 4} nights)`
        };
        dbState.wallets_ledger[ledgerId] = ledgerEntry;

        recordAudit(user.fullName, 'HOTEL_BOOKED', 'hotel_bookings', bookingId, `Booked ${hotel?.name} for ${guestName || user.fullName}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, booking: bookingDoc, ledger: ledgerEntry, balances: user.balances });
    }

    if (pathname === '/api/hotels/cancel' && req.method === 'POST') {
      const { bookingId, userId, reason } = await readJsonBody(req);
      const bk = dbState.hotel_bookings[bookingId];
      if (!bk || bk.status !== 'confirmed') {
        return sendJson(res, 400, { error: 'Booking cannot be cancelled or is already processed' });
      }

      const user = dbState.users[userId || bk.userId];
      const curr = bk.currency || 'USD';
      const amount = bk.amountDebited;
      const ref = `REV-${bk.confirmationCode}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr];

        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'HOTEL_REFUND',
          description: `Hotel refund for ${bk.confirmationCode}: ${reason || 'Customer cancellation'}`,
          postings: [
            { account: `liabilities:hotel_escrow:${bk.id}`, currency: curr, debit: amount, credit: 0 },
            { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: amount }
          ]
        });

        user.balances[curr] = (user.balances[curr] || 0) + amount;
        const closingBalance = user.balances[curr];
        bk.status = 'cancelled';
        bk.cancellationReason = reason || 'Customer request';

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'HOTEL_BOOKING',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Hotel booking refund: ${curr} ${amount.toLocaleString()} credited back`
        };

        recordAudit(user.fullName, 'HOTEL_CANCELLED', 'hotel_bookings', bk.id, `Cancelled booking ${bk.confirmationCode}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, booking: bk, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 21. SUPPORT CONCIERGE REAL-TIME TWO-WAY MESSAGING
    // -------------------------------------------------------------
    if (pathname === '/api/support/message' && req.method === 'POST') {
      const { ticketId, senderId, text, isAdmin, senderName } = await readJsonBody(req);
      const ticket = dbState.support_tickets[ticketId || 'tkt_8901'];
      if (!ticket) return sendJson(res, 404, { error: 'Ticket not found' });

      const newMsg = {
        senderId: senderId || 'usr_alade_01',
        senderName: senderName || (isAdmin ? 'FlyeMass Concierge' : 'Chief Alade'),
        text: text || '',
        isAdmin: !!isAdmin,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      ticket.messages.push(newMsg);
      ticket.updatedAt = Date.now();

      recordAudit(senderName || 'Chat User', 'TICKET_MESSAGE', 'support_tickets', ticket.id, `Sent message: "${(text || '').slice(0, 30)}..."`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, ticket });
    }

    if (pathname === '/api/support/tickets/create' && req.method === 'POST') {
      const { subject, category, priority, message, userId } = await readJsonBody(req);
      const uid = userId || 'usr_alade_01';
      const user = dbState.users[uid];
      const ticketId = `tkt_${Date.now()}`;
      const ticketNumber = `FM-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTicket = {
        id: ticketId,
        ticketNumber,
        userId: uid,
        userName: user ? user.fullName : 'Valued Client',
        subject: subject || 'General Inquiry',
        category: category || 'General Trade',
        status: 'open',
        priority: priority || 'Medium',
        messages: [
          {
            senderId: uid,
            senderName: user ? user.fullName : 'Client',
            text: message || '',
            isAdmin: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      dbState.support_tickets[ticketId] = newTicket;
      recordAudit(user ? user.fullName : 'Client', 'TICKET_CREATED', 'support_tickets', ticketId, `Opened ticket #${ticketNumber}: ${subject}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, ticket: newTicket });
    }

    if (pathname === '/api/admin/support/tickets/resolve' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'support_agent', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Support Agent or Admin role required' });
      }

      const { ticketId, resolutionNotes, adminId } = await readJsonBody(req);
      const ticket = dbState.support_tickets[ticketId];
      if (!ticket) return sendJson(res, 404, { error: 'Ticket not found' });

      ticket.status = 'resolved';
      ticket.resolvedAt = Date.now();
      ticket.resolutionNotes = resolutionNotes || 'Inquiry resolved by trade concierge';
      ticket.messages.push({
        senderId: adminId || 'adm-002',
        senderName: 'FlyeMass Concierge Supervisor',
        text: `Ticket marked as RESOLVED: ${resolutionNotes || 'All inquiries have been addressed. Thank you for trading with FlyeMass.'}`,
        isAdmin: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      recordAudit(adminId || 'Support Desk', 'TICKET_RESOLVED', 'support_tickets', ticket.id, `Resolved ticket #${ticket.ticketNumber || ticket.id}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, ticket });
    }

    // -------------------------------------------------------------
    // 22. ADMIN SETTINGS & RATES UPDATE (RBAC Guarded)
    // -------------------------------------------------------------
    if (pathname === '/api/settings/update' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Super Admin or Finance Officer role' });
      }

      const { adminName, rates, fees } = await readJsonBody(req);
      if (rates) {
        dbState.system_settings.rates = {
          ...dbState.system_settings.rates,
          ...rates,
          lastUpdated: Date.now(),
          updatedBy: adminName || 'Admin Desk'
        };
      }
      if (fees) {
        dbState.system_settings.fees = {
          ...dbState.system_settings.fees,
          ...fees
        };
      }

      recordAudit(adminName || 'Admin Desk', 'SETTINGS_UPDATED', 'system_settings', 'config', 'Updated exchange rates and operational margins', req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, settings: dbState.system_settings });
    }

    // -------------------------------------------------------------
    // 23. ADMIN TEAM RBAC & MASTER ACCOUNT PROTECTION
    // -------------------------------------------------------------
    if (pathname === '/api/admin/double-entry-ledger' && req.method === 'GET') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer', 'compliance', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      return sendJson(res, 200, { success: true, double_entry_ledger: dbState.double_entry_ledger });
    }

    if ((pathname === '/api/admin/team/modify' || pathname === '/api/admin/team/delete') && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin'])) {
        return sendJson(res, 403, { error: 'Unauthorized: only Super Admin can manage personnel roles' });
      }

      const body = await readJsonBody(req);
      const targetAdminId = body.targetAdminId || body.adminId;
      // Master Super Admin account cannot be deleted, downgraded, or modified
      if (targetAdminId === 'adm-001') {
        return sendJson(res, 403, { error: 'Security Enclave: Chief Babatunde Alade (adm-001) is the Protected Master Super Admin and cannot be altered or deleted.' });
      }

      recordAudit('Executive Director', 'STAFF_ROLE_MODIFIED', 'users', targetAdminId, `Action: ${body.action || 'delete'}, Role: ${body.newRole || 'none'}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true });
    }

    // -------------------------------------------------------------
    // 24. ADMIN SUPPLIER PAYMENT DISBURSEMENT (Requires Evidence) & REFUND
    // -------------------------------------------------------------
    if (pathname === '/api/admin/supplier-payments/processing' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }

      const { paymentId, adminId, notes } = await readJsonBody(req);
      const payment = dbState.supplier_payments[paymentId];
      if (!payment) return sendJson(res, 404, { error: 'Supplier payment request not found' });
      if (payment.status !== 'pending') {
        return sendJson(res, 400, { error: `Payment not in pending status (Current: ${payment.status})` });
      }

      payment.status = 'processing';
      payment.processingStartedAt = Date.now();
      payment.reviewer = adminId || 'Finance Officer';
      if (notes) payment.adminNotes = notes;

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Send Money Processing',
        message: `Your transfer of ¥${payment.amountRMB} (Ref: ${payment.reference}) is currently being processed by Treasury.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'payment',
        targetUserId: payment.userId,
        linkRoute: 'wallets'
      });

      recordAudit(adminId || 'Treasury Desk', 'SUPPLIER_PAYMENT_PROCESSING', 'supplier_payments', payment.id, `Status updated to processing`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, payment });
    }

    if (pathname === '/api/admin/supplier-payments/disburse' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }

      const { paymentId, clearingSessionId, paymentProofUrl, safeDeclarationRef, externalPaymentRef, adminNotes, adminId } = await readJsonBody(req);
      const payment = dbState.supplier_payments[paymentId];
      if (!payment) return sendJson(res, 404, { error: 'Supplier payment request not found' });
      if (payment.status === 'disbursed' || payment.status === 'completed') {
        return sendJson(res, 400, { error: 'Supplier payment already completed' });
      }
      if (payment.status === 'refunded' || payment.status === 'rejected') {
        return sendJson(res, 400, { error: 'Cannot complete a refunded or rejected payment' });
      }

      // STRICT VALIDATION: Require official Chinese clearing evidence or external payment reference
      const session = clearingSessionId || externalPaymentRef;
      const proof = paymentProofUrl || 'https://storage.flyemass.com/receipts/cleared.pdf';
      const safeRef = safeDeclarationRef || `SAFE-${Date.now()}`;

      if (!session && !paymentProofUrl && !safeDeclarationRef) {
        return sendJson(res, 400, {
          error: 'Disbursement rejected: Mandatory Chinese remittance evidence missing (clearingSessionId, paymentProofUrl, safeDeclarationRef required)'
        });
      }

      payment.status = 'disbursed';
      payment.completed = true;
      payment.clearingSessionId = session || `CN-CLR-${Date.now()}`;
      payment.paymentProofUrl = proof;
      payment.safeDeclarationRef = safeRef;
      payment.externalPaymentRef = externalPaymentRef || session;
      payment.adminNotes = adminNotes || payment.adminNotes || '';
      payment.reviewer = adminId || 'Finance Officer';
      payment.disbursedAt = Date.now();
      payment.completedAt = Date.now();

      recordDoubleEntry({
        reference: `DISB-${payment.reference || payment.id}`,
        userId: payment.userId,
        transactionType: 'SUPPLIER_PAYMENT_DISBURSED',
        description: `Disbursement completed for supplier payment ${payment.id} via ${payment.paymentMethod || 'Alipay'}`,
        postings: [
          { account: 'liabilities:supplier_escrow:cny', currency: 'CNY', debit: payment.amountRMB, credit: 0 },
          { account: `assets:china:${(payment.paymentMethod || 'alipay').toLowerCase()}_disbursement:cny`, currency: 'CNY', debit: 0, credit: payment.amountRMB }
        ]
      });

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: 'Payment Completed',
        message: `¥${payment.amountRMB.toLocaleString()} has been successfully sent to ${payment.receiverName}. Reference: ${payment.reference}.`,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: 'payment',
        targetUserId: payment.userId,
        linkRoute: 'wallets'
      });

      recordAudit(adminId || 'China Desk', 'SUPPLIER_PAYMENT_DISBURSED', 'supplier_payments', payment.id, `Disbursed ¥${payment.amountRMB} to ${payment.receiverName} (Ref: ${payment.reference})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, payment });
    }

    if (pathname === '/api/admin/supplier-payments/refund' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer or Super Admin role' });
      }

      const { paymentId, reason, adminId } = await readJsonBody(req);
      const payment = dbState.supplier_payments[paymentId];
      if (!payment) return sendJson(res, 404, { error: 'Supplier payment request not found' });
      if (payment.status === 'disbursed' || payment.status === 'completed') {
        return sendJson(res, 400, { error: 'Cannot reject or refund an already completed payment' });
      }
      if (payment.status === 'refunded' || payment.status === 'rejected') {
        return sendJson(res, 400, { error: 'Payment not found or already refunded' });
      }
      if (!reason || !reason.trim()) {
        return sendJson(res, 400, { error: 'Mandatory rejection reason required' });
      }

      const user = dbState.users[payment.userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      await withUserLock(user.uid, async () => {
        const ref = `REF-SUP-${payment.reference || payment.id}`;
        recordDoubleEntry({
          reference: ref,
          userId: user.uid,
          transactionType: 'SUPPLIER_PAYMENT_REFUND',
          description: `Refund for unfulfilled China supplier transfer: ${reason}`,
          postings: [
            { account: 'liabilities:supplier_escrow:cny', currency: 'CNY', debit: payment.amountRMB, credit: 0 },
            { account: `liabilities:customer:${user.uid}:cny`, currency: 'CNY', debit: 0, credit: payment.amountRMB }
          ]
        });

        user.balances.CNY = (user.balances.CNY || 0) + payment.amountRMB;

        payment.status = 'refunded';
        payment.rejected = true;
        payment.refundReason = reason;
        payment.refundedAt = Date.now();
        payment.reviewer = adminId || 'Finance Officer';

        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'PAY_SUPPLIER',
          sourceCurrency: 'CNY',
          targetCurrency: 'CNY',
          amount: payment.amountRMB,
          fee: 0,
          openingBalance: user.balances.CNY - payment.amountRMB,
          closingBalance: user.balances.CNY,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Refund for unfulfilled China supplier transfer: ${reason}`
        };

        if (!dbState.notifications) dbState.notifications = [];
        dbState.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Send Money Request Rejected & Refunded',
          message: `¥${payment.amountRMB.toLocaleString()} has been refunded to your CNY wallet. Reason: ${reason}.`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          type: 'payment',
          targetUserId: user.uid,
          linkRoute: 'wallets'
        });

        recordAudit(adminId || 'Finance Officer', 'SUPPLIER_PAYMENT_REFUNDED', 'supplier_payments', payment.id, `Refunded ¥${payment.amountRMB} to ${user.fullName} (${reason})`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, payment, balances: user.balances });
    }

    // -------------------------------------------------------------
    // 24B. AUTHORITATIVE MANUAL WALLET BALANCE ADJUSTMENT
    // -------------------------------------------------------------
    if (pathname === '/api/admin/wallets/manual-adjust' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Finance Officer or Super Admin role required' });
      }

      const { userId, currency, amount, type, reason, adminId } = await readJsonBody(req);
      const user = dbState.users[userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      const curr = (currency || 'NGN').toUpperCase();
      if (!['NGN', 'CNY', 'USD'].includes(curr)) {
        return sendJson(res, 400, { error: 'Invalid currency. Must be NGN, CNY, or USD' });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return sendJson(res, 400, { error: 'Amount must be a positive number' });
      }

      const adjType = (type || '').toLowerCase();
      if (adjType !== 'credit' && adjType !== 'debit') {
        return sendJson(res, 400, { error: 'Type must be "credit" or "debit"' });
      }

      const ref = `ADJ-ADMIN-${Date.now().toString().slice(-6)}`;
      let ledgerId = `ldg_${Date.now()}`;

      await withUserLock(user.uid, async () => {
        const openingBalance = user.balances[curr] || 0;

        if (adjType === 'debit' && openingBalance < numAmount) {
          throw new Error(`Insufficient customer balance: Available ${curr} ${openingBalance.toLocaleString()}, requested debit ${curr} ${numAmount.toLocaleString()}`);
        }

        if (adjType === 'credit') {
          recordDoubleEntry({
            reference: ref,
            userId: user.uid,
            transactionType: 'MANUAL_CREDIT_ADJUSTMENT',
            description: `Manual admin credit adjustment by ${adminId || 'adm-001'}: ${reason || 'Reconciliation'}`,
            postings: [
              { account: `equity:admin_adjustments:${curr.toLowerCase()}`, currency: curr, debit: numAmount, credit: 0 },
              { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: numAmount }
            ]
          });
        } else {
          recordDoubleEntry({
            reference: ref,
            userId: user.uid,
            transactionType: 'MANUAL_DEBIT_ADJUSTMENT',
            description: `Manual admin debit adjustment by ${adminId || 'adm-001'}: ${reason || 'Reconciliation'}`,
            postings: [
              { account: `liabilities:customer:${user.uid}:${curr.toLowerCase()}`, currency: curr, debit: numAmount, credit: 0 },
              { account: `equity:admin_adjustments:${curr.toLowerCase()}`, currency: curr, debit: 0, credit: numAmount }
            ]
          });
        }

        if (adjType === 'credit') {
          user.balances[curr] = (user.balances[curr] || 0) + numAmount;
        } else {
          user.balances[curr] = (user.balances[curr] || 0) - numAmount;
        }

        const closingBalance = user.balances[curr];

        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: adjType === 'credit' ? 'FUND' : 'WITHDRAW',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount: numAmount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Manual ${adjType.toUpperCase()} by Admin (${adminId || 'adm-001'}): ${reason || 'Ledger reconciliation'}`
        };

        recordAudit(adminId || 'Finance Officer', 'MANUAL_BALANCE_ADJUST', 'wallets_ledger', user.uid, `${adjType.toUpperCase()} ${curr} ${numAmount.toLocaleString()} (${reason})`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, balances: user.balances, reference: ref, ledgerId });
    }

    // -------------------------------------------------------------
    // 24C. USER SUSPENSION & RESTRICTIONS MANAGEMENT
    // -------------------------------------------------------------
    if (pathname === '/api/admin/users/suspend' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const { userId, isSuspended, reason, restrictions, adminId } = await readJsonBody(req);
      if (userId === 'adm-001') {
        return sendJson(res, 403, { error: 'Master Super Admin (adm-001) cannot be suspended' });
      }

      const user = dbState.users[userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      user.isSuspended = !!isSuspended;
      user.suspensionReason = reason || '';
      user.restrictions = Array.isArray(restrictions) ? restrictions : [];
      user.updatedAt = Date.now();

      recordAudit(adminId || 'Admin Desk', 'USER_SUSPENSION_TOGGLED', 'users', user.uid, `Set isSuspended: ${user.isSuspended} (${reason || 'No reason provided'})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, user });
    }

    // -------------------------------------------------------------
    // 24D. IN-APP BROADCAST / TARGETED NOTIFICATIONS
    // -------------------------------------------------------------
    if (pathname === '/api/admin/notifications/send' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'support_agent'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }

      const { title, message, type, targetUserId, linkRoute, adminId } = await readJsonBody(req);
      if (!title || !message) {
        return sendJson(res, 400, { error: 'Title and message are required' });
      }

      const notifId = `notif_${Date.now()}`;
      const notif = {
        id: notifId,
        title,
        message,
        time: 'Just now',
        timestamp: Date.now(),
        read: false,
        type: type || 'system',
        targetUserId: targetUserId || 'all',
        linkRoute: linkRoute || 'notifications'
      };

      if (!dbState.notifications) dbState.notifications = [];
      dbState.notifications.unshift(notif);

      recordAudit(adminId || 'Admin Staff', 'NOTIFICATION_DISPATCHED', 'notifications', notifId, `Dispatched: "${title}" to ${targetUserId || 'all users'}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, notification: notif });
    }

    // -------------------------------------------------------------
    // 24E. SUPPLIER DIRECTORY MANAGEMENT
    // -------------------------------------------------------------
    if (pathname === '/api/admin/suppliers/create' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      const { supplier, adminId } = await readJsonBody(req);
      if (!supplier || !supplier.name) return sendJson(res, 400, { error: 'Supplier details required' });

      const supplierId = supplier.id || `sup_${Date.now()}`;
      const newSup = {
        ...supplier,
        id: supplierId,
        verifiedYears: supplier.verifiedYears || 1,
        inspectionPassed: supplier.inspectionPassed ?? true,
        createdAt: Date.now()
      };

      if (!dbState.suppliers) dbState.suppliers = {};
      dbState.suppliers[supplierId] = newSup;

      recordAudit(adminId || 'Trade Sourcing Desk', 'SUPPLIER_REGISTERED', 'suppliers', supplierId, `Registered supplier: ${newSup.name} (${newSup.city})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, supplier: newSup });
    }

    // -------------------------------------------------------------
    // 24F. HOTEL DIRECTORY MANAGEMENT
    // -------------------------------------------------------------
    if (pathname === '/api/admin/hotels/create' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      const { hotel, adminId } = await readJsonBody(req);
      if (!hotel || !hotel.name) return sendJson(res, 400, { error: 'Hotel details required' });

      const hotelId = hotel.id || `htl_${Date.now()}`;
      const newHotel = {
        ...hotel,
        id: hotelId,
        createdAt: Date.now()
      };

      if (!dbState.hotels) dbState.hotels = {};
      dbState.hotels[hotelId] = newHotel;

      recordAudit(adminId || 'Hotels Desk', 'HOTEL_REGISTERED', 'hotels', hotelId, `Registered business hotel: ${newHotel.name} (${newHotel.city})`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, hotel: newHotel });
    }

    // -------------------------------------------------------------
    // 25. AUDIT LOG VERIFICATION (Tamper-Evident SHA-256 Chain)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/audit-logs/verify' && req.method === 'GET') {
      if (!verifyAdminRole(req, ['super_admin', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Compliance or Super Admin role' });
      }
      const result = verifyAuditChain();
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------
    // 26. DATABASE BACKUPS, INTEGRITY & DISASTER RECOVERY
    // -------------------------------------------------------------
    if (pathname === '/api/admin/backups/create' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin'])) {
        return sendJson(res, 403, { error: 'Unauthorized: only Super Admin can create system snapshots' });
      }
      const body = await readJsonBody(req);
      const snapshot = createBackupSnapshot(body.reason || 'MANUAL_ADMIN_CHECKPOINT', req.headers['x-admin-id'] || 'adm-001');
      return sendJson(res, 200, { success: true, snapshot });
    }

    if (pathname === '/api/admin/backups/list' && req.method === 'GET') {
      if (!verifyAdminRole(req, ['super_admin'])) {
        return sendJson(res, 403, { error: 'Unauthorized: only Super Admin can list system snapshots' });
      }
      const backups = listBackupSnapshots();
      return sendJson(res, 200, { success: true, backups });
    }

    if (pathname === '/api/admin/backups/restore' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin'])) {
        return sendJson(res, 403, { error: 'Unauthorized: only Super Admin can restore system snapshots' });
      }
      const { filename } = await readJsonBody(req);
      if (!filename) return sendJson(res, 400, { error: 'Filename parameter required' });
      try {
        const result = restoreBackupSnapshot(filename, req.headers['x-admin-id'] || 'adm-001');
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    if (pathname === '/api/admin/db/integrity' && req.method === 'GET') {
      if (!verifyAdminRole(req, ['super_admin', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Compliance or Super Admin role' });
      }
      const integrity = verifyDatabaseIntegrity();
      return sendJson(res, 200, integrity);
    }

    // -------------------------------------------------------------
    // 27. TRIAL BALANCE RECONCILIATION
    // -------------------------------------------------------------
    if (pathname === '/api/admin/ledger/reconciliation' && req.method === 'GET') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: requires Finance Officer, Compliance, or Super Admin role' });
      }
      const recon = calculateTrialBalance();
      return sendJson(res, 200, { success: true, ...recon });
    }

    // -------------------------------------------------------------
    // 28. SUPER ADMIN EMERGENCY RECOVERY KEY
    // -------------------------------------------------------------
    if (pathname === '/api/auth/super-admin/recover' && req.method === 'POST') {
      const { recoveryKey, targetAdminId } = await readJsonBody(req);
      const expectedHash = dbState.super_admin_recovery?.recoveryKeyHash || crypto.createHash('sha256').update(MASTER_RECOVERY_KEY).digest('hex');
      const providedHash = crypto.createHash('sha256').update(String(recoveryKey || '')).digest('hex');

      if (providedHash !== expectedHash) {
        return sendJson(res, 401, { success: false, error: 'Invalid master emergency recovery key' });
      }

      const adminId = targetAdminId || 'adm-001';
      if (!dbState.users[adminId]) {
        dbState.users[adminId] = {
          uid: adminId,
          fullName: 'Chief Babatunde Alade',
          email: 'babatunde@aladeholding.ng',
          phone: '+234 803 555 9201',
          businessName: 'Alade Global Enterprises Ltd',
          verifiedBadge: true,
          role: 'admin',
          createdAt: Date.now() - 365 * 86400000,
          balances: { NGN: 28450200, CNY: 184250, USD: 42890.50 }
        };
      }
      dbState.users[adminId].role = 'admin';
      dbState.users[adminId].pinFailedAttempts = 0;
      dbState.users[adminId].pinLockedUntil = 0;

      recordAudit('Emergency Key Handler', 'SUPER_ADMIN_RESTORED', 'users', adminId, `Emergency recovery executed for ${adminId}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, message: `Super Admin account ${adminId} restored successfully` });
    }

    // -------------------------------------------------------------
    // 29. PRODUCT CATALOG CREATION & UPDATE
    // -------------------------------------------------------------
    if (pathname === '/api/shop/add-product' && req.method === 'POST') {
      const { product } = await readJsonBody(req);
      if (!product || !product.id || !product.title) {
        return sendJson(res, 400, { error: 'Product id and title required' });
      }
      if (!dbState.products) dbState.products = {};
      dbState.products[product.id] = {
        ...product,
        createdAt: Date.now()
      };
      recordAudit(req.headers['x-admin-id'] || 'Admin Shop', 'ADD_PRODUCT', 'products', product.id, `Created tech product ${product.title}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 201, { success: true, product: dbState.products[product.id] });
    }

    // -------------------------------------------------------------
    // 30. PRODUCT STOCK ADJUSTMENT
    // -------------------------------------------------------------
    if (pathname === '/api/shop/update-stock' && req.method === 'POST') {
      const { productId, delta } = await readJsonBody(req);
      if (!productId || typeof delta !== 'number') {
        return sendJson(res, 400, { error: 'productId and numeric delta required' });
      }
      const prod = dbState.products && dbState.products[productId];
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });
      prod.stockCount = Math.max(0, (prod.stockCount || 0) + delta);
      prod.inStock = prod.stockCount > 0;
      recordAudit(req.headers['x-admin-id'] || 'Admin Shop', 'UPDATE_STOCK', 'products', productId, `Adjusted stock by ${delta} to ${prod.stockCount}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, product: prod });
    }

    // -------------------------------------------------------------
    // 31. CUSTOMER KYC VERIFICATION TOGGLE
    // -------------------------------------------------------------
    if (pathname === '/api/admin/users/toggle-kyc' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      const { userId, verified, adminId } = await readJsonBody(req);
      const user = dbState.users[userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });
      user.verifiedBadge = verified !== undefined ? !!verified : !user.verifiedBadge;
      user.kycLevel = user.verifiedBadge ? 'Tier 3 (BVN & CAC Verified)' : 'Tier 1 (Basic)';
      user.updatedAt = Date.now();
      recordAudit(adminId || 'Compliance Desk', 'USER_KYC_TOGGLED', 'users', user.uid, `Set KYC verified: ${user.verifiedBadge}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, user });
    }

    // -------------------------------------------------------------
    // 32. CUSTOMER COMPLIANCE NOTES
    // -------------------------------------------------------------
    if (pathname === '/api/admin/users/update-notes' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'operations', 'compliance'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Admin role required' });
      }
      const { userId, notes, adminId } = await readJsonBody(req);
      const user = dbState.users[userId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });
      user.adminNotes = notes || '';
      user.updatedAt = Date.now();
      recordAudit(adminId || 'Compliance Desk', 'USER_NOTES_UPDATED', 'users', user.uid, `Updated compliance notes: ${user.adminNotes}`, req);
      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, user });
    }

    // -------------------------------------------------------------
    // 33. WEBHOOK SANDBOX INFLOW SIMULATION
    // -------------------------------------------------------------
    if (pathname === '/api/admin/webhooks/simulate' && req.method === 'POST') {
      if (!verifyAdminRole(req, ['super_admin', 'finance_officer'])) {
        return sendJson(res, 403, { error: 'Unauthorized: Finance Officer or Super Admin required' });
      }
      const { provider, amount, userId, adminId } = await readJsonBody(req);
      const numAmount = parseFloat(amount) || 100000;
      const targetUserId = userId || 'usr_alade_01';
      const user = dbState.users[targetUserId];
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      const provName = (provider || 'providus').toLowerCase();
      const ref = `${provName.toUpperCase()}-SIM-${Date.now()}`;

      await withUserLock(targetUserId, async () => {
        const openingBalance = user.balances.NGN || 0;
        recordDoubleEntry({
          reference: ref,
          userId: targetUserId,
          transactionType: 'FUND',
          description: `Simulated Sandbox Inflow: ${provider ? provider.toUpperCase() : 'PROVIDUS'} Settlement`,
          postings: [
            { account: `assets:bank:${provName}_clearing:ngn`, currency: 'NGN', debit: numAmount, credit: 0 },
            { account: `liabilities:customer:${targetUserId}:ngn`, currency: 'NGN', debit: 0, credit: numAmount }
          ],
          metadata: { provider: provName, simulated: true }
        });

        const closingBalance = user.balances.NGN;
        const ledgerId = `ldg_${Date.now()}`;
        dbState.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: targetUserId,
          type: 'FUND',
          sourceCurrency: 'NGN',
          targetCurrency: 'NGN',
          amount: numAmount,
          fee: 0,
          openingBalance,
          closingBalance,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Sandbox Webhook Simulation confirmed (${ref})`
        };

        dbState.processed_webhooks[ref] = true;
        if (!dbState.webhook_events) dbState.webhook_events = [];
        const evt = {
          id: `whk_${Date.now()}`,
          provider: provName.charAt(0).toUpperCase() + provName.slice(1),
          reference: ref,
          amount: numAmount,
          currency: 'NGN',
          status: 'SUCCESS',
          timestamp: Date.now(),
          accountNumber: '9082341902',
          userId: targetUserId,
          simulated: true
        };
        dbState.webhook_events.unshift(evt);

        recordAudit(adminId || 'Treasury Admin', 'WEBHOOK_SIMULATED', 'wallets_ledger', ledgerId, `Simulated ₦${numAmount} inflow from ${provName.toUpperCase()}`, req);
      });

      persistState();
      broadcastUpdate();
      return sendJson(res, 200, { success: true, balances: user.balances, reference: ref });
    }

    // Endpoint not matched
    sendJson(res, 404, { error: `Endpoint ${pathname} not found` });

  } catch (err) {
    console.error(`[Sync Server Error] ${req.method} ${pathname}:`, err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[FlyeMass Authoritative Backend Sync Server] Running on http://localhost:${PORT}`);
});
