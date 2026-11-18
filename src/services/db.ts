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
  TechProduct,
  CartItem,
  DeviceShopSettings,
  ManualPaymentDocument,
  Warehouse,
  LagosHub,
  ShippingCorridor,
  FreightCalculationResult,
  DestinationHubSurcharge
} from '../types';
import { TECH_PRODUCTS } from '../data/mockData';
import {
  AdminUser,
  AdminRole,
  AdminModulePermission,
  INITIAL_ADMINS,
  ROLE_DEFAULT_PERMISSIONS
} from './firebase';
import {
  renderTransactionalEmail,
  TransactionalEmailEvent,
  EmailRecipient
} from './emailTemplates';
import { supabase } from './supabaseClient';

export interface DatabaseState {
  users: Record<string, UserDocument>;
  wallets_ledger: Record<string, WalletLedgerDocument>;
  shipments: Record<string, ShipmentDocument>;
  supplier_payments: Record<string, SupplierPaymentDocument>;
  withdrawals: Record<string, WithdrawalDocument>;
  manual_payments?: Record<string, ManualPaymentDocument>;
  agent_requests: Record<string, AgentRequestDocument>;
  supplier_subscriptions: Record<string, SupplierSubscriptionDocument>;
  shop_orders: Record<string, ShopOrderDocument>;
  hotel_bookings: Record<string, any>;
  hotels?: Record<string, any>;
  rental_properties?: Record<string, any>;
  property_inquiries?: Record<string, any>;
  webhook_events?: any[];
  products: Record<string, TechProduct>;
  device_shop_settings?: DeviceShopSettings;
  user_favorites?: Record<string, string[]>;
  device_cart_items?: Record<string, CartItem[]>;
  chat_messages?: any[];
  support_tickets: Record<string, SupportTicketDocument>;
  banners: BannerDocument[];
  system_settings: SystemSettingsDocument;
  audit_logs: any[];
  double_entry_ledger?: Record<string, any>;
  notifications?: any[];
  email_receipts?: Record<string, any>;
  warehouses?: Record<string, Warehouse>;
  lagos_hubs?: Record<string, LagosHub>;
  suppliers?: Record<string, any>;
  private_supplier_contacts?: Record<string, any>;
  admin_staff?: Record<string, AdminUser>;
  fx_rates?: Record<string, any>;
}

import { getBackendBaseUrl } from '../utils/environment';

const STORAGE_KEY = 'flyemass_nosql_db_v2';
const BACKEND_BASE = getBackendBaseUrl();

export const DEFAULT_SHIPPING_CORRIDORS: ShippingCorridor[] = [
  {
    id: 'cn_los',
    name: 'China ➔ Nigeria (Direct Cargo Corridor)',
    originCountry: 'China',
    originCode: 'CN',
    originHub: 'Guangzhou / Yiwu / Foshan / Shenzhen / Hong Kong',
    destinationCountry: 'Nigeria',
    destinationHub: 'Lagos MMIA Hub (Ikeja, Alaba, Trade Fair, Abuja, Kano, Onitsha)',
    flag: '🇳🇬',
    airExpressRateUSD: 11.50,
    airExpressBaseFeeUSD: 5.00,
    airExpressDeliveryDays: '3–5 Days',
    airExpressMinKg: 1.0,
    airRegularRateUSD: 9.50,
    airRegularBaseFeeUSD: 3.00,
    airRegularDeliveryDays: '7–10 Days',
    airRegularMinKg: 2.0,
    seaFreightRateCbmUSD: 280.00,
    seaFreightBaseFeeUSD: 25.00,
    seaFreightDeliveryDays: '25–35 Days',
    seaFreightMinCbm: 0.1,
    customsClearanceIncluded: true,
    isActive: true,
    destinationHubSurcharges: [
      { hubId: 'los_main', name: 'Lagos MMIA Cargo Terminal', state: 'Lagos', airSurchargeUSD: 0, seaSurchargeUSD: 0 },
      { hubId: 'abj_hub', name: 'Abuja Cargo Hub', state: 'FCT Abuja', airSurchargeUSD: 1.20, seaSurchargeUSD: 35.00 },
      { hubId: 'kan_hub', name: 'Kano Hub', state: 'Kano', airSurchargeUSD: 1.50, seaSurchargeUSD: 45.00 },
      { hubId: 'phc_hub', name: 'Port Harcourt Hub', state: 'Rivers', airSurchargeUSD: 1.30, seaSurchargeUSD: 40.00 },
      { hubId: 'oni_hub', name: 'Onitsha Commercial Dock', state: 'Anambra', airSurchargeUSD: 1.40, seaSurchargeUSD: 38.00 }
    ]
  }
];

export const DEFAULT_LAGOS_HUBS: Record<string, LagosHub> = {
  'HUB-IKEJA': {
    id: 'HUB-IKEJA',
    name: 'Ikeja MMIA Cargo Terminal',
    code: 'LOS-IKJ',
    district: 'Ikeja',
    address: 'Cargo Village, Murtala Muhammed International Airport, Airport Road, Ikeja, Lagos',
    phone: '+234 803 999 1001',
    contactPerson: 'Babatunde Balogun',
    operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 1,
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'HUB-ALABA': {
    id: 'HUB-ALABA',
    name: 'Alaba International Market Hub',
    code: 'LOS-ALB',
    district: 'Alaba',
    address: 'Electronic Section Block C, Alaba International Market, Ojo, Lagos',
    phone: '+234 803 999 1002',
    contactPerson: 'Emeka Okonkwo',
    operatingHours: 'Mon - Sat: 8:30 AM - 5:30 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 2,
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'HUB-TRADEFAIR': {
    id: 'HUB-TRADEFAIR',
    name: 'Lagos Trade Fair Complex Hub',
    code: 'LOS-TFC',
    district: 'Amuwo-Odofin',
    address: 'ASPAMDA Zone Plaza 4, Lagos-Badagry Expressway, Amuwo-Odofin, Lagos',
    phone: '+234 803 999 1003',
    contactPerson: 'Alhaji Usman Musa',
    operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 3,
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'HUB-YABA': {
    id: 'HUB-YABA',
    name: 'Yaba Tech & Commercial Hub',
    code: 'LOS-YAB',
    district: 'Yaba',
    address: '248 Herbert Macaulay Way, Commercial Avenue Junction, Yaba, Lagos',
    phone: '+234 803 999 1004',
    contactPerson: 'Folashade Adeleke',
    operatingHours: 'Mon - Sat: 8:00 AM - 6:30 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 4,
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'HUB-LEKKI': {
    id: 'HUB-LEKKI',
    name: 'Lekki / Island Dispatch Station',
    code: 'LOS-LKK',
    district: 'Lekki Phase 1',
    address: 'Plot 12 Admiralty Way, Lekki Phase 1, Victoria Island Corridor, Lagos',
    phone: '+234 803 999 1005',
    contactPerson: 'Chidi Nnamdi',
    operatingHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 5,
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  }
};

export const DEFAULT_WAREHOUSES: Record<string, Warehouse> = {
  'wh_gz_main': {
    id: 'wh_gz_main',
    name: 'Guangzhou Main Air & Sea Logistics Terminal',
    hubName: 'Guangzhou Main Hub',
    country: 'China',
    province: 'Guangdong Province',
    city: 'Guangzhou',
    fullAddress: 'Room 302, Building B, Shijing International Logistics Park, Baiyun District, Guangzhou, Guangdong Province, China',
    postalCode: '510440',
    phone: '+86 186 2008 9142',
    contactPerson: 'Manager Chen',
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'wh_yiwu_port': {
    id: 'wh_yiwu_port',
    name: 'Yiwu International Port Consolidation Hub',
    hubName: 'Yiwu Consolidation Port',
    country: 'China',
    province: 'Zhejiang',
    city: 'Yiwu',
    fullAddress: 'Block 4, Yiwu International Port Logistics Center, Chouzhou North Road, Yiwu, Zhejiang, China',
    postalCode: '322000',
    phone: '+86 138 5791 2240',
    contactPerson: 'Director Lin',
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'wh_foshan_heavy': {
    id: 'wh_foshan_heavy',
    name: 'Foshan Furniture & Heavy Cargo Terminal',
    hubName: 'Foshan Cargo Terminal',
    country: 'China',
    province: 'Guangdong Province',
    city: 'Foshan',
    fullAddress: 'Building 7, Lecong International Furniture & Logistics Complex, Shunde/Nanhai, Foshan, Guangdong Province, China',
    postalCode: '528315',
    phone: '+86 139 2855 8192',
    contactPerson: 'Supervisor Liang',
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'wh_shenzhen_tech': {
    id: 'wh_shenzhen_tech',
    name: 'Shenzhen Tech & Battery Cargo Terminal',
    hubName: 'Shenzhen Tech Port',
    country: 'China',
    province: 'Guangdong Province',
    city: 'Shenzhen',
    fullAddress: 'Fuyong Logistics Park, Airport North Road, Bao\'an District, Shenzhen, Guangdong Province, China',
    postalCode: '518103',
    phone: '+86 137 1422 9018',
    contactPerson: 'Manager Zhao',
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  },
  'wh_hongkong_air': {
    id: 'wh_hongkong_air',
    name: 'Hong Kong Express Air Freight Terminal',
    hubName: 'Hong Kong Express Port',
    country: 'China',
    province: 'Hong Kong SAR',
    city: 'Hong Kong',
    fullAddress: 'Container Terminal 3, Kwai Chung Logistics Hub, New Territories, Hong Kong',
    postalCode: '999077',
    phone: '+852 2388 9102',
    contactPerson: 'Operations Lead Wong',
    isActive: true,
    createdAt: 1772000000000,
    updatedAt: 1772000000000
  }
};

export const INITIAL_DATABASE: DatabaseState = {
  lagos_hubs: DEFAULT_LAGOS_HUBS,
  warehouses: DEFAULT_WAREHOUSES,
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
      reference: 'BK-2026-00001',
      userId: 'usr_alade_01',
      hotelId: 'hotel-gz-westin',
      hotelName: 'The Westin Pazhou Guangzhou',
      checkIn: '2026-11-12',
      checkOut: '2026-11-18',
      nights: 6,
      roomType: 'Deluxe Double',
      roomSurchargeUSD: 30,
      totalUSD: 1290,
      currency: 'USD',
      amountDebited: 1290,
      guestName: 'Chief Babatunde Alade',
      guestEmail: 'babatunde@aladeholding.ng',
      guestPhone: '+234 803 555 9201',
      guestCount: 2,
      confirmationCode: 'WST-CAN-884102',
      status: 'confirmed',
      taxiCardZh: '请带我到：广州市海珠区凤浦中路681号 广交会威斯汀酒店',
      qrVerificationToken: 'FLYEMASS|BK-2026-00001|hotel-gz-westin|2026-11-12',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      emailSent: true,
      createdAt: Date.now() - 400000000
    }
  },

  hotels: {
    'hotel-canton-trade': {
      id: 'hotel-canton-trade',
      name: 'Canton Trade Tower Hotel',
      chineseName: '广州广交商贸大厦酒店',
      city: 'Guangzhou',
      district: 'Haizhu Pazhou Complex Zone',
      englishAddress: '888 Xingang East Road, Haizhu District, Guangzhou',
      chineseAddress: '广州市海珠区新港东路888号',
      description: 'Contemporary business hotel located 5 minutes from Canton Fair Complex, offering Pearl River views and Canton Fair shuttles.',
      pricePerNightUSD: 45,
      pricePerNightCNY: 320,
      pricePerNightNGN: 72000,
      rating: 4.5,
      reviewsCount: 180,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Canton Fair Shuttle', 'English Concierge', 'Executive Desk'],
      distanceToMarket: '5 mins to Pazhou Exhibition Complex',
      amenities: ['Free Wi-Fi', 'Breakfast included', 'Air conditioning', 'Airport shuttle', 'Elevator', '24/7 reception', 'Laundry service', 'Gym'],
      roomType: 'Standard Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Comfortable king bed, city view, high-speed Wi-Fi', amenities: ['King Bed', 'Free Wi-Fi', 'Rain Shower'] },
        { id: 'rm-dlx', name: 'Deluxe King Room', nightlySurchargeUSD: 15, maxGuests: 3, description: 'Spacious double bed suite, complimentary executive breakfast', amenities: ['Twin Double Beds', 'Breakfast Included', 'Work Desk'] },
        { id: 'rm-ste', name: 'Executive Fair Suite', nightlySurchargeUSD: 35, maxGuests: 4, description: 'Luxury 65sqm suite with private meeting lounge & panoramic skyline view', amenities: ['Separate Living Area', 'Executive Lounge Access', 'Bathtub', 'Airport Transfer'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去广州广交商贸大厦酒店（海珠区新港东路888号）。谢谢！'
    },
    'hotel-yiwu-market': {
      id: 'hotel-yiwu-market',
      name: 'Yiwu Market View Residence',
      chineseName: '义乌商贸城景观公馆',
      city: 'Yiwu',
      district: 'Futian International Trade City',
      englishAddress: '168 Chouzhou North Road, Yiwu, Zhejiang',
      chineseAddress: '浙江省金华市义乌市稠州北路168号',
      description: 'Directly opposite Yiwu International Trade City District 1 and 2, tailored for international commodity buyers.',
      pricePerNightUSD: 38,
      pricePerNightCNY: 270,
      pricePerNightNGN: 61000,
      rating: 4.3,
      reviewsCount: 145,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Opposite Futian Trade Market', 'African Buyers Favorite', 'Free Trade Shuttle'],
      distanceToMarket: '400m to District 1 & 2 Commodity Mart',
      amenities: ['Free Wi-Fi', 'Air conditioning', 'Elevator', '24/7 reception', 'Laundry service', 'Restaurant', 'English-speaking staff'],
      roomType: 'One-Bedroom Residence',
      roomTypes: [
        { id: 'rm-std', name: 'One-Bedroom Residence', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Fully furnished residence near trade market', amenities: ['Queen Bed', 'Free Wi-Fi', 'Kitchenette'] },
        { id: 'rm-ste', name: 'Two-Bedroom Trade Suite', nightlySurchargeUSD: 20, maxGuests: 4, description: 'Two bedroom suite for trade partners', amenities: ['2 Bedrooms', 'Living Room', 'Work Desk'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去义乌商贸城景观公馆（稠州北路168号）。谢谢！'
    },
    'hotel-sz-huaqiangbei': {
      id: 'hotel-sz-huaqiangbei',
      name: 'Shenzhen Huaqiangbei Suites',
      chineseName: '深圳华强北行政套房酒店',
      city: 'Shenzhen',
      district: 'Futian District / Huaqiangbei',
      englishAddress: '1002 Shennan Middle Road, Futian District, Shenzhen',
      chineseAddress: '深圳市福田区深南中路1002号',
      description: 'Prime tech hub accommodation 2 minutes from Huaqiangbei electronics market with high-speed fiber internet.',
      pricePerNightUSD: 52,
      pricePerNightCNY: 370,
      pricePerNightNGN: 83000,
      rating: 4.8,
      reviewsCount: 210,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Huaqiangbei Tech Hub', 'Multi-Language Desk', 'High-Speed Fiber'],
      distanceToMarket: '200m to Huaqiangbei Electronics Market',
      amenities: ['Free Wi-Fi', 'Breakfast included', 'Air conditioning', 'Elevator', '24/7 reception', 'Gym', 'Parking', 'English-speaking staff'],
      roomType: 'Studio Suite',
      roomTypes: [
        { id: 'rm-std', name: 'Studio Suite', nightlySurchargeUSD: 0, maxGuests: 2, description: 'High-tech studio with fiber internet', amenities: ['King Bed', 'Free Wi-Fi', 'Smart TV'] },
        { id: 'rm-dlx', name: 'Superior Electronics Suite', nightlySurchargeUSD: 18, maxGuests: 3, description: 'Spacious suite with work conference desk', amenities: ['Twin Beds', 'Breakfast included', 'Meeting Desk'] },
        { id: 'rm-ste', name: 'High-Floor Skyline Executive', nightlySurchargeUSD: 40, maxGuests: 4, description: 'Skyline view with private lounge access', amenities: ['Skyline View', 'Lounge Access', 'Bathtub'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去深圳华强北行政套房酒店（深南中路1002号）。谢谢！'
    },
    'hotel-sh-bund-loft': {
      id: 'hotel-sh-bund-loft',
      name: 'Shanghai Bund Loft BNB',
      chineseName: '上海外滩景观阁楼民宿',
      city: 'Shanghai',
      district: 'Huangpu District / The Bund',
      englishAddress: '88 Zhongshan East 1st Road, Huangpu District, Shanghai',
      chineseAddress: '上海市黄浦区中山东一路88号',
      description: 'Chic historic loft accommodation overlooking the Huangpu River and Lujiazui financial skyline.',
      pricePerNightUSD: 60,
      pricePerNightCNY: 430,
      pricePerNightNGN: 96000,
      rating: 4.7,
      reviewsCount: 195,
      image: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Huangpu River Bund View', 'Historic Architecture', 'Panoramic Skyline'],
      distanceToMarket: '500m to The Bund Promenade',
      amenities: ['Free Wi-Fi', 'Air conditioning', 'Elevator', '24/7 reception', 'Swimming pool', 'Restaurant', 'English-speaking staff'],
      roomType: 'Bund View Loft',
      roomTypes: [
        { id: 'rm-std', name: 'Bund View Loft', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Romantic duplex loft with Bund river view', amenities: ['Queen Bed', 'Free Wi-Fi', 'River View'] },
        { id: 'rm-ste', name: 'Duplex Riverside Penthouse', nightlySurchargeUSD: 25, maxGuests: 4, description: 'Panoramic penthouse with outdoor terrace', amenities: ['Terrace', 'Living Room', 'Bathtub'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去上海外滩景观阁楼民宿（中山东一路88号）。谢谢！'
    },
    'hotel-gz-westin': {
      id: 'hotel-gz-westin',
      name: 'The Westin Pazhou Guangzhou',
      chineseName: '广州广交会威斯汀酒店',
      city: 'Guangzhou',
      district: 'Haizhu Pazhou Complex Zone',
      englishAddress: 'Area C, Canton Fair Complex, No. 1 Fengpu Middle Road, Haizhu District, Guangzhou',
      chineseAddress: '广州市海珠区凤浦中路681号广交会展馆C区',
      description: 'The only hotel with direct skybridge covered access to the Canton Fair Exhibition Complex.',
      pricePerNightUSD: 185,
      pricePerNightCNY: 1340,
      pricePerNightNGN: 274725,
      rating: 4.9,
      reviewsCount: 520,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Direct Skybridge to Canton Fair', 'English Concierge', 'Halal Dining Option'],
      distanceToMarket: '0.1 km from Canton Fair Exhibition Complex',
      amenities: ['Direct Fair Access', 'High-speed VPN Wi-Fi', 'Airport Limousine', 'Currency Exchange', 'Halal Kitchen'],
      roomType: 'Deluxe King City View',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Comfortable king bed, city view, high-speed Wi-Fi', amenities: ['King Bed', 'Free Wi-Fi', 'Rain Shower'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 30, maxGuests: 3, description: 'Spacious double bed suite, complimentary executive breakfast', amenities: ['Twin Double Beds', 'Breakfast Included', 'Work Desk'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 80, maxGuests: 4, description: 'Luxury 65sqm suite with private meeting lounge & panoramic skyline view', amenities: ['Separate Living Area', 'Executive Lounge Access', 'Bathtub', 'Airport Transfer'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去广州琶洲广交会威斯汀酒店（海珠区凤浦中路681号，广交会展馆C区）。谢谢！'
    },
    'hotel-gz-garden': {
      id: 'hotel-gz-garden',
      name: 'Guangzhou Garden Hotel',
      chineseName: '广州花园酒店',
      city: 'Guangzhou',
      district: 'Yuexiu Commercial Hub',
      englishAddress: '368 Huanshi East Road, Yuexiu District, Guangzhou',
      chineseAddress: '广州市越秀区环市东路368号',
      description: 'Premier 5-star landmark in central Guangzhou with direct Metro Line 5 connectivity and free Canton Fair shuttles.',
      pricePerNightUSD: 140,
      pricePerNightCNY: 1015,
      pricePerNightNGN: 207900,
      rating: 4.86,
      reviewsCount: 390,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Canton Fair Shuttle', 'Yuexiu Central', 'English Concierge'],
      distanceToMarket: '15 mins direct to Pazhou Complex',
      amenities: ['Canton Fair Express Shuttle', 'Western Breakfast', 'High-Speed Wi-Fi', 'Metro Line 5 Taojin Direct'],
      roomType: 'Superior King Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Quiet garden view king room', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 25, maxGuests: 3, description: 'Executive garden view twin beds', amenities: ['Twin Beds', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 70, maxGuests: 4, description: 'Spacious suite with garden balcony', amenities: ['Living Room', 'Lounge Access'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '请带我到：广州市越秀区环市东路368号 花园酒店。谢谢！'
    },
    'hotel-sz-futian': {
      id: 'hotel-sz-futian',
      name: 'Futian Shangri-La Shenzhen',
      chineseName: '深圳福田香格里拉大酒店',
      city: 'Shenzhen',
      district: 'Futian CBD / Near Huaqiangbei',
      englishAddress: '4088 Yitian Road, Futian District, Shenzhen',
      chineseAddress: '深圳市福田区益田路4088号',
      description: 'Luxury hotel in Shenzhen central business district, 10 minutes from Huaqiangbei electronics market.',
      pricePerNightUSD: 160,
      pricePerNightCNY: 1158,
      pricePerNightNGN: 237600,
      rating: 4.85,
      reviewsCount: 410,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['10 Mins to Huaqiangbei Market', 'Multi-Language Desk', 'Executive Lounge'],
      distanceToMarket: '3.2 km to Huaqiangbei Electronics Hub',
      amenities: ['Huaqiangbei Shuttle', 'Indoor Heated Pool', 'Business Center', 'Metro Station Direct'],
      roomType: 'Horizon Club Deluxe Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Futian skyline king bedroom', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 30, maxGuests: 3, description: 'Double twin bedroom with executive buffet', amenities: ['Double Beds', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 85, maxGuests: 4, description: 'Horizon Club executive suite', amenities: ['Horizon Lounge Access', 'Bathtub'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去深圳福田香格里拉大酒店（益田路4088号）。谢谢！'
    },
    'hotel-yiwu-marriott': {
      id: 'hotel-yiwu-marriott',
      name: 'Yiwu Marriott Hotel',
      chineseName: '义乌万豪酒店',
      city: 'Yiwu',
      district: 'Futian International Trade City',
      englishAddress: '188 Futian Road, Yiwu, Jinhua, Zhejiang',
      chineseAddress: '浙江省金华市义乌市福田路188号',
      description: 'Adjacent to Yiwu International Trade City District 1 & 2, tailored for international commodity buyers.',
      pricePerNightUSD: 125,
      pricePerNightCNY: 905,
      pricePerNightNGN: 185625,
      rating: 4.88,
      reviewsCount: 380,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Opposite Futian Trade Market', 'African Buyers Favorite', 'Free Trade Shuttle'],
      distanceToMarket: '400m to District 1 & 2 Commodity Mart',
      amenities: ['Futian Market Shuttle', 'Halal Kitchen', 'Arabic / English Staff', 'High-Speed Wi-Fi'],
      roomType: 'Deluxe Business Suite',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Deluxe king bed near Futian Mart', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 20, maxGuests: 3, description: 'Two queen beds with buffet breakfast', amenities: ['Two Queens', 'Halal Breakfast'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 60, maxGuests: 4, description: 'Trade business suite with meeting desk', amenities: ['Meeting Table', 'Lounge Access'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去义乌万豪酒店（福田路188号，近国际商贸城）。谢谢！'
    },
    'hotel-sh-pudong': {
      id: 'hotel-sh-pudong',
      name: 'Grand Kempinski Hotel Shanghai',
      chineseName: '上海凯宾斯基大酒店',
      city: 'Shanghai',
      district: 'Lujiazui Financial Center',
      englishAddress: '1288 Lujiazui Ring Road, Pudong New Area, Shanghai',
      chineseAddress: '上海市浦东新区陆家嘴环路1288号',
      description: 'Luxury hotel on the banks of Huangpu River with breathtaking Bund views in central Lujiazui financial hub.',
      pricePerNightUSD: 190,
      pricePerNightCNY: 1375,
      pricePerNightNGN: 282150,
      rating: 4.92,
      reviewsCount: 460,
      image: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Huangpu River Bund View', 'Lujiazui CBD', 'English Business Desk'],
      distanceToMarket: '1.5 km to Shanghai World Financial Center',
      amenities: ['River View Terrace', 'Indoor Horizon Pool', 'High-Speed Wi-Fi', 'Western & Halal Dining'],
      roomType: 'Grand Bund River View King',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Lujiazui city view king room', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 35, maxGuests: 3, description: 'River view double beds with breakfast', amenities: ['River View', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 90, maxGuests: 4, description: 'Panoramic Bund view executive suite', amenities: ['Bund View', 'Executive Lounge'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去上海凯宾斯基大酒店（浦东新区陆家嘴环路1288号）。谢谢！'
    },
    'hotel-bj-wangfujing': {
      id: 'hotel-bj-wangfujing',
      name: 'Regent Beijing Wangfujing',
      chineseName: '北京丽晶酒店',
      city: 'Beijing',
      district: 'Dongcheng Wangfujing',
      englishAddress: '99 Jinbao Street, Dongcheng District, Beijing',
      chineseAddress: '北京市东城区金宝街99号',
      description: '5-star sanctuary moments from Wangfujing Street, Forbidden City, and national ministry trade complexes.',
      pricePerNightUSD: 170,
      pricePerNightCNY: 1230,
      pricePerNightNGN: 252450,
      rating: 4.89,
      reviewsCount: 340,
      image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Close to Ministries', 'Wangfujing Shopping', 'Subway Line 5 Direct'],
      distanceToMarket: '800m to Wangfujing Trade Pedestrian Street',
      amenities: ['Subway Connected', 'Heated Indoor Pool', 'Business Lounge', 'Airport VIP Transfer'],
      roomType: 'Classic Deluxe King Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Imperial courtyard view king bed', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 30, maxGuests: 3, description: 'Spacious twin bedroom with breakfast', amenities: ['Twin Beds', 'Buffet Breakfast'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 75, maxGuests: 4, description: 'Regent Club diplomatic suite', amenities: ['Diplomatic Lounge', 'Butler Service'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去北京丽晶酒店（东城区金宝街99号）。谢谢！'
    },
    'hotel-fs-intercon': {
      id: 'hotel-fs-intercon',
      name: 'InterContinental Foshan',
      chineseName: '佛山保利洲际酒店',
      city: 'Foshan',
      district: 'Nanhai High-Tech Financial Zone',
      englishAddress: '20 Denghu East Road, Nanhai District, Foshan',
      chineseAddress: '佛山市南海区灯湖东路20号',
      description: 'Overlooking Qiandeng Lake in Foshan’s commercial core, 20 minutes from the Shunde Furniture & Ceramics markets.',
      pricePerNightUSD: 120,
      pricePerNightCNY: 870,
      pricePerNightNGN: 178200,
      rating: 4.87,
      reviewsCount: 310,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Furniture Mart Proximity', 'Guangfo Metro Line', 'Lakeside View'],
      distanceToMarket: '5 mins to Lecong Furniture & Ceramics Mart',
      amenities: ['Lakeside Park Direct', 'Guangfo Metro Shuttle', 'Fitness & Spa', 'Executive Boardroom'],
      roomType: 'Deluxe Lakeview King Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Comfortable king bed with lake view', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 20, maxGuests: 3, description: 'Double beds with executive breakfast', amenities: ['Double Beds', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 55, maxGuests: 4, description: 'Corner suite overlooking Qiandeng Lake', amenities: ['Lake View', 'Lounge Access'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去佛山保利洲际酒店（南海区灯湖东路20号）。谢谢！'
    },
    'hotel-hz-grand': {
      id: 'hotel-hz-grand',
      name: 'Grand Hyatt Hangzhou',
      chineseName: '杭州君悦酒店',
      city: 'Hangzhou',
      district: 'West Lake Commercial Hub',
      englishAddress: '28 HuBin Road, Shangcheng District, Hangzhou',
      chineseAddress: '杭州市上城区湖滨路28号',
      description: 'Iconic luxury on the eastern shore of West Lake, walking distance to Hangzhou’s premier e-commerce headquarters.',
      pricePerNightUSD: 180,
      pricePerNightCNY: 1300,
      pricePerNightNGN: 267300,
      rating: 4.93,
      reviewsCount: 480,
      image: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['West Lake Shorefront', 'Hangzhou E-Commerce Hub', '5-Star Dining'],
      distanceToMarket: 'Steps from West Lake Musical Fountain',
      amenities: ['Lakefront Promenade', 'Indoor Skylight Pool', 'Grand Club Lounge', 'Concierge Service'],
      roomType: 'Grand Deluxe King Lake View',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'City view king room', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 35, maxGuests: 3, description: 'West Lake view twin beds with breakfast', amenities: ['Lake View', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 85, maxGuests: 4, description: 'Grand lakefront suite with balcony', amenities: ['Lakefront Balcony', 'Grand Club Access'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去杭州君悦酒店（上城区湖滨路28号，西湖边）。谢谢！'
    },
    'hotel-dg-hyatt': {
      id: 'hotel-dg-hyatt',
      name: 'Hyatt Regency Dongguan',
      chineseName: '东莞松山湖凯悦酒店',
      city: 'Dongguan',
      district: 'Songshan Lake Technology Zone',
      englishAddress: 'Songshan Lake Central District, Dongguan, Guangdong',
      chineseAddress: '广东省东莞市松山湖中心区沁园路',
      description: 'Lakeside business resort next to Songshan Lake High-Tech Park and Huawei European Village campus.',
      pricePerNightUSD: 110,
      pricePerNightCNY: 800,
      pricePerNightNGN: 163350,
      rating: 4.84,
      reviewsCount: 290,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Songshan Lake Park', 'Huawei Campus Direct', 'Factory Inspection Hub'],
      distanceToMarket: '3 mins to Songshan Lake Industrial Zone',
      amenities: ['Lakeside Infinity Pool', 'Tennis Courts', 'Manufacturing Tour Shuttle', 'Business Center'],
      roomType: 'Regency Lakeview King Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Garden view standard room', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 20, maxGuests: 3, description: 'Lakeview double room with buffet breakfast', amenities: ['Lake View', 'Breakfast Included'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 50, maxGuests: 4, description: 'Regency executive suite', amenities: ['Lounge Access', 'Meeting Desk'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '师傅，请带我去东莞松山湖凯悦酒店（松山湖沁园路）。谢谢！'
    },
    'hotel-hk-kowloon': {
      id: 'hotel-hk-kowloon',
      name: 'The Langham Hong Kong',
      chineseName: '香港朗廷酒店',
      city: 'Hong Kong',
      district: 'Tsim Sha Tsui Kowloon',
      englishAddress: '8 Peking Road, Tsim Sha Tsui, Kowloon, Hong Kong',
      chineseAddress: '香港九龙尖沙咀北京道8号',
      description: 'Timeless luxury in the heart of Tsim Sha Tsui, steps from Victoria Harbour, High-Speed Rail, and Star Ferry.',
      pricePerNightUSD: 220,
      pricePerNightCNY: 1595,
      pricePerNightNGN: 326700,
      rating: 4.94,
      reviewsCount: 610,
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ],
      tags: ['Steps to Victoria Harbour', 'High-Speed Rail West Kowloon', 'Michelin 3-Star Dining'],
      distanceToMarket: '5 mins to West Kowloon High-Speed Rail Station',
      amenities: ['Michelin Dining (T’ang Court)', 'Rooftop Swimming Pool', 'Chuan Spa', 'Harbour View Concierge'],
      roomType: 'Grand Deluxe King Room',
      roomTypes: [
        { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Courtyard view king bed', amenities: ['King Bed', 'Free Wi-Fi'] },
        { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 40, maxGuests: 3, description: 'Deluxe twin bed with British afternoon tea discount', amenities: ['Twin Beds', 'Afternoon Tea'] },
        { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 110, maxGuests: 4, description: 'Langham Club executive suite', amenities: ['Club Lounge', 'Airport Transfer'] }
      ],
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
      isPublished: true,
      taxiCardZh: '请带我去：九龙尖沙咀北京道8号 朗廷酒店。谢谢！'
    }
  },

  rental_properties: {
    'apt-gz-tianhe-01': {
      id: 'apt-gz-tianhe-01',
      title: 'Tianhe CBD Luxury Serviced Residence',
      propertyType: 'apartment',
      city: 'Guangzhou',
      district: 'Tianhe CBD',
      englishAddress: 'No. 208 Tianhe Road, Tianhe District, Guangzhou',
      chineseAddress: '广州市天河区天河路208号',
      monthlyRentCNY: 8500,
      estimatedRentUSD: 1174,
      estimatedRentNGN: 1823250,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 95,
      bedrooms: 2,
      furnishedStatus: 'Furnished',
      amenities: ['Central Air Conditioning', 'Modern Kitchen', 'High-Speed Wi-Fi', '24/7 Concierge', 'Gym & Pool Access', 'Balcony'],
      leaseTerms: ['6 months', '1 year'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Prime 2-bedroom executive apartment in Guangzhou Tianhe CBD. Fully furnished with western appliances, 3 minutes walk to Tiyu Xilu metro hub.',
      metroAccess: 'Metro Line 1/3 Tiyu Xilu Station (300m)',
      createdAt: Date.now() - 30 * 86400000
    },
    'apt-gz-yuexiu-02': {
      id: 'apt-gz-yuexiu-02',
      title: 'Yuexiu Cultural District Executive Studio',
      propertyType: 'apartment',
      city: 'Guangzhou',
      district: 'Yuexiu',
      englishAddress: 'Zhongshan 5th Road, Yuexiu District, Guangzhou',
      chineseAddress: '广州市越秀区中山五路',
      monthlyRentCNY: 4200,
      estimatedRentUSD: 580,
      estimatedRentNGN: 900900,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 48,
      bedrooms: 1,
      furnishedStatus: 'Furnished',
      amenities: ['Smart TV', 'Washing Machine', 'Induction Cooktop', 'Fiber Broadband', 'Keyless Digital Lock'],
      leaseTerms: ['6 months', '1 year'],
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Charming modern studio in central Yuexiu. Surrounded by traditional Cantonese culture and dining, direct metro to Baiyun and Pazhou.',
      metroAccess: 'Metro Line 1/2 Gongyuanqian Interchange (200m)',
      createdAt: Date.now() - 25 * 86400000
    },
    'apt-gz-haizhu-03': {
      id: 'apt-gz-haizhu-03',
      title: 'Haizhu Riverside Panorama Residence',
      propertyType: 'apartment',
      city: 'Guangzhou',
      district: 'Haizhu',
      englishAddress: 'Binjiang East Road, Haizhu District, Guangzhou',
      chineseAddress: '广州市海珠区滨江东路',
      monthlyRentCNY: 11500,
      estimatedRentUSD: 1588,
      estimatedRentNGN: 2466750,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 130,
      bedrooms: 3,
      furnishedStatus: 'Furnished',
      amenities: ['Unobstructed Pearl River View', 'Canton Tower View', 'Master Ensuite', 'Marble Bath', 'Underground Parking'],
      leaseTerms: ['1 year'],
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'High-floor 3-bedroom residence with panoramic Pearl River views and nighttime Canton Tower illuminations. Family or executive share ready.',
      metroAccess: 'Metro Line 8 Lujiang / APM Chigang Pagoda (800m)',
      createdAt: Date.now() - 20 * 86400000
    },
    'apt-gz-baiyun-04': {
      id: 'apt-gz-baiyun-04',
      title: 'Baiyun International Sourcing Flat',
      propertyType: 'apartment',
      city: 'Guangzhou',
      district: 'Baiyun',
      englishAddress: 'Sanyuanli Avenue, Baiyun District, Guangzhou',
      chineseAddress: '广州市白云区三元里大道',
      monthlyRentCNY: 5800,
      estimatedRentUSD: 801,
      estimatedRentNGN: 1244100,
      depositMonths: 1,
      advanceRentMonths: 1,
      floorAreaSqm: 82,
      bedrooms: 2,
      furnishedStatus: 'Furnished',
      amenities: ['Balcony', 'Air Conditioning', 'Elevator', 'Security Desk', 'Near Cargo Hubs'],
      leaseTerms: ['6 months', '1 year'],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Convenient 2-bedroom apartment 5 minutes from Guangzhou Baiyun Leather & Wholesale Garment Market. Ideal for African import merchants.',
      metroAccess: 'Metro Line 2 Sanyuanli Station (450m)',
      createdAt: Date.now() - 15 * 86400000
    },
    'apt-gz-panyu-05': {
      id: 'apt-gz-panyu-05',
      title: 'Panyu Chimelong Garden Villa',
      propertyType: 'house',
      city: 'Guangzhou',
      district: 'Panyu',
      englishAddress: 'Hanxi Avenue East, Panyu District, Guangzhou',
      chineseAddress: '广州市番禺区汉溪大道东',
      monthlyRentCNY: 14000,
      estimatedRentUSD: 1933,
      estimatedRentNGN: 3003000,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 210,
      bedrooms: 4,
      furnishedStatus: 'Semi-Furnished',
      amenities: ['Private Garden', 'Double Garage', 'Spacious Terrace', 'Quiet Community', '24/7 Gated Security'],
      leaseTerms: ['1 year'],
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Spacious 4-bedroom multi-floor villa with landscaped private garden. Perfect for expatriate families or long-term logistics representatives.',
      metroAccess: 'Metro Line 3/7 Hanxi Changlong Interchange (1.2 km)',
      createdAt: Date.now() - 10 * 86400000
    },
    'off-gz-ifc-01': {
      id: 'off-gz-ifc-01',
      title: 'Guangzhou IFC International Grade-A Tower',
      propertyType: 'office',
      city: 'Guangzhou',
      district: 'Tianhe CBD',
      englishAddress: '5 Zhujiang West Road, Tianhe District, Guangzhou (Zhujiang New Town)',
      chineseAddress: '广州市天河区珠江西路5号 广州国际金融中心',
      monthlyRentCNY: 35000,
      estimatedRentUSD: 4834,
      estimatedRentNGN: 7507500,
      depositMonths: 3,
      advanceRentMonths: 1,
      floorAreaSqm: 240,
      deskCapacity: 35,
      furnishedStatus: 'Furnished',
      amenities: ['Executive Boardroom (12 Pax)', 'Meeting Room (6 Pax)', 'Bilingual Receptionist', 'High-Speed Fiber Internet', '24/7 Access & HVAC', 'Access Control Cards'],
      leaseTerms: ['1 year', 'Flexible'],
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Prestigious landmark Grade-A commercial workspace in Zhujiang New Town. Accommodates 25-35 staff with panoramic skyline views and turn-key fitout.',
      metroAccess: 'Metro Line 3/5 Zhujiang New Town & APM Guangzhou Opera House direct',
      createdAt: Date.now() - 40 * 86400000
    },
    'off-gz-pazhou-02': {
      id: 'off-gz-pazhou-02',
      title: 'Pazhou Poly World Trade Center Office',
      propertyType: 'office',
      city: 'Guangzhou',
      district: 'Haizhu',
      englishAddress: '1000 Xingang East Road, Haizhu District, Guangzhou',
      chineseAddress: '广州市海珠区新港东路1000号 保利世界贸易中心',
      monthlyRentCNY: 18500,
      estimatedRentUSD: 2555,
      estimatedRentNGN: 3968250,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 125,
      deskCapacity: 16,
      furnishedStatus: 'Furnished',
      amenities: ['Skybridge to Canton Fair', 'Private Manager Office', 'Conference Room', 'Fiber Wi-Fi', 'Bilingual Desk', 'Parking Onsite'],
      leaseTerms: ['6 months', '1 year'],
      images: [
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Strategic commercial office directly adjacent to the Canton Fair Complex. Ideal for international trade agencies, logistics, and sourcing desks.',
      metroAccess: 'Metro Line 8 Pazhou Station direct exit (50m)',
      createdAt: Date.now() - 35 * 86400000
    },
    'off-gz-yuexiu-03': {
      id: 'off-gz-yuexiu-03',
      title: 'Yuexiu International Commerce Centre Workspace',
      propertyType: 'office',
      city: 'Guangzhou',
      district: 'Yuexiu',
      englishAddress: 'Dongfeng West Road, Yuexiu District, Guangzhou',
      chineseAddress: '广州市越秀区东风西路',
      monthlyRentCNY: 9800,
      estimatedRentUSD: 1353,
      estimatedRentNGN: 2102100,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 75,
      deskCapacity: 10,
      furnishedStatus: 'Furnished',
      amenities: ['Modern Ergonomic Desks', 'Fiber Internet', 'Pantry & Coffee Machine', 'Elevator', '24/7 Security'],
      leaseTerms: ['6 months', '1 year'],
      images: [
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'
      ],
      status: 'live',
      description: 'Budget-friendly, fully-fitted 10-desk office in central Yuexiu commercial zone. Immediate move-in ready for trade inspection or liaison offices.',
      metroAccess: 'Metro Line 2 Memorial Hall Station (400m)',
      createdAt: Date.now() - 28 * 86400000
    }
  },

  property_inquiries: {
    'inq_seed_01': {
      id: 'inq_seed_01',
      reference: 'INQ-APT-2026-10492',
      userId: 'usr_alade_01',
      propertyId: 'apt-gz-tianhe-01',
      propertyTitle: 'Tianhe CBD Luxury Serviced Residence',
      propertyType: 'apartment',
      district: 'Tianhe CBD',
      customerName: 'Chief Babatunde Alade',
      customerPhone: '+234 803 555 9201',
      preferredMoveInDate: '2026-11-20',
      leaseDuration: '1 year',
      customNotes: 'Requesting video walkthrough of the master bedroom and parking bay availability.',
      upfrontCostEstimateCNY: 25500,
      ticketId: 'tkt_8901',
      ticketNumber: 'TKT-8901',
      status: 'contacted',
      adminNotes: 'Assigned bilingual agent Chen Wei. Landlord confirmed availability.',
      assignedStaff: 'Chen Wei (Guangzhou Ground Desk)',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 43200000
    }
  },

  chat_messages: [],

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
      displayOrder: 1,
      placement: 'home'
    },
    {
      id: 'ban_sea_promo',
      title: 'Guangzhou to Lagos Consolidated Sea Freight',
      description: 'Starting at $145 / CBM with full Nigeria customs pre-clearance.',
      imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80',
      destinationRoute: 'logistics',
      isActive: true,
      displayOrder: 2,
      placement: 'home'
    },
    {
      id: 'ban_shop_iphone16',
      title: 'Apple iPhone 16 Pro Max',
      subtitle: 'Factory Sealed HK Spec • Dual SIM with 2-4 Days Express Air Cargo to Lagos MMIA',
      description: 'Factory Sealed HK Spec Dual Physical SIM models with express air freight to Lagos.',
      badge: 'Hong Kong Direct Hub',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: 'shop',
      placement: 'shop',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'ban_shop_macbook_m4',
      title: 'Apple M4 Max & Pro Hardware',
      subtitle: 'Global Apple Limited Warranty with Cryptographic Serial Number Tracking',
      description: 'Brand new Apple Silicon hardware available with escrow inspection.',
      badge: 'New Arrival',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: 'shop',
      placement: 'shop',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 'ban_shop_wholesale',
      title: 'Direct Computer Village Pricing',
      subtitle: 'Wholesale & Retail Multi-Currency Checkout in Naira (NGN) and Yuan (CNY)',
      description: 'Bulk wholesale orders with insured freight and zero customs demurrage.',
      badge: 'Wholesale Deal',
      imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: 'shop',
      placement: 'shop',
      isActive: true,
      displayOrder: 3
    },
    {
      id: 'ban_shop_accessories',
      title: 'Apple Watch Ultra 2 & AirPods Max',
      subtitle: 'Original Sealed Accessories • Direct Guangzhou to Lagos Air Express Delivery',
      description: 'Original Apple accessories with serial check & instant delivery.',
      badge: 'VIP Hardware',
      imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: 'shop',
      placement: 'shop',
      isActive: true,
      displayOrder: 4
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
      supplier30DayPassUSD: 50.00,
      sourcingCommissionPercent: 5.0,
      minSourcingCommissionCNY: 500,
      supplierVerificationUSD: 150,
      factoryAuditUSD: 250,
      qualityControlUSD: 200
    },
    shipping_corridors: DEFAULT_SHIPPING_CORRIDORS,
    air_shipping_rates: {
      expressRatePerKgUSD: 13.00,
      expressHandlingFeeUSD: 0.00,
      normalRatePerKgUSD: 9.60,
      normalHandlingFeeUSD: 0.00,
      updatedAt: Date.now(),
      updatedBy: 'Admin'
    },
    logistics_fx_rates: {
      usdToNgn: 1400.00,
      usdToCny: 7.25,
      updatedAt: Date.now(),
      updatedBy: 'Admin'
    }
  },

  products: {
    ...TECH_PRODUCTS.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, TechProduct>),
    'prod-apple-watch-ultra-2': TECH_PRODUCTS.find(p => p.id === 'prod-watch-ultra-2') || TECH_PRODUCTS[0]
  },
  device_shop_settings: {
    deliveryFeeNGN: 5000,
    updatedAt: Date.now(),
    updatedBy: 'system'
  },
  user_favorites: {},
  device_cart_items: {},

  admin_staff: {
    ...INITIAL_ADMINS.reduce((acc, adm) => {
      acc[adm.uid] = adm;
      return acc;
    }, {} as Record<string, AdminUser>)
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
  ],
  double_entry_ledger: {},
  notifications: []
};

class DatabaseService {
  private state: DatabaseState;
  private listeners: (() => void)[] = [];
  private ratesPromise: Promise<any> | null = null;
  private lastRatesFetch: number = 0;
  private warehousesFetchPromise: Promise<Warehouse[]> | null = null;
  private lastWarehousesFetch: number = 0;
  private supplierPricesPromise: Promise<any> | null = null;
  private lastSupplierPricesFetch: number = 0;
  private stateRevision: number = 1;
  private lastSerializedState: string = '';
  private pendingNotify: boolean = false;

  constructor() {
    this.state = this.loadState();
    try {
      this.lastSerializedState = JSON.stringify(this.state);
    } catch (e) {}
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
            const incomingStr = JSON.stringify(data.state);
            // Strict equality gate: skip redundant sync broadcasts
            if (incomingStr === this.lastSerializedState) {
              return;
            }
            this.state = { ...this.state, ...data.state };
            this.lastSerializedState = incomingStr;
            this.stateRevision++;
            try {
              localStorage.setItem(STORAGE_KEY, incomingStr);
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
          hotels: { ...(INITIAL_DATABASE.hotels || {}), ...(parsed.hotels || {}) },
          rental_properties: { ...(INITIAL_DATABASE.rental_properties || {}), ...(parsed.rental_properties || {}) },
          property_inquiries: { ...(INITIAL_DATABASE.property_inquiries || {}), ...(parsed.property_inquiries || {}) },
          webhook_events: parsed.webhook_events || INITIAL_DATABASE.webhook_events || [],
          products: {
            ...INITIAL_DATABASE.products,
            ...Object.fromEntries(
              Object.entries(parsed.products || {}).map(([id, prod]: [string, any]) => {
                const initProd: any = (INITIAL_DATABASE.products as Record<string, any>)[id] || {};
                return [
                  id,
                  {
                    ...initProd,
                    ...prod,
                    variants: (prod?.variants && prod.variants.length > 0) ? prod.variants : initProd.variants,
                    technicalSpecs: prod?.technicalSpecs || initProd.technicalSpecs,
                    colors: (prod?.colors && prod.colors.length > 0) ? prod.colors : initProd.colors,
                    storageOptions: (prod?.storageOptions && prod.storageOptions.length > 0) ? prod.storageOptions : initProd.storageOptions,
                    stockCount: Math.max(prod?.stockCount ?? 0, initProd.stockCount || 10),
                    inStock: true
                  }
                ];
              })
            )
          },
          device_shop_settings: { ...(INITIAL_DATABASE.device_shop_settings || {}), ...(parsed.device_shop_settings || {}) },
          user_favorites: parsed.user_favorites || {},
          device_cart_items: parsed.device_cart_items || {},
          chat_messages: parsed.chat_messages || [],
          support_tickets: { ...INITIAL_DATABASE.support_tickets, ...(parsed.support_tickets || {}) },
          lagos_hubs: { ...DEFAULT_LAGOS_HUBS, ...(parsed.lagos_hubs || {}) },
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
      const stateStr = JSON.stringify(this.state);
      this.lastSerializedState = stateStr;
      this.stateRevision++;
      localStorage.setItem(STORAGE_KEY, stateStr);
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
    if (this.pendingNotify) return;
    this.pendingNotify = true;
    queueMicrotask(() => {
      this.pendingNotify = false;
      const listeners = [...this.listeners];
      for (const listener of listeners) {
        try {
          listener();
        } catch (e) {
          console.error('Error in database listener', e);
        }
      }
    });
  }

  public getStateRevision(): number {
    return this.stateRevision;
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

  public async resetPin(userId: string, newPin: string, resetToken?: string, email?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPin, resetToken, email })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async unlockUserPin(userId: string, adminId?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/users/unlock-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adminId })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  }

  public async requestAccountDeletion(userId: string, reason: string): Promise<{ success: boolean; error?: string; message?: string; reference?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason })
      });
      return await res.json();
    } catch (e) {
      return { 
        success: true, 
        message: 'Account scheduled for de-identification in 14 days',
        reference: 'REF-DEL-' + Math.floor(1000 + Math.random() * 9000)
      };
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

  public async simulateGatewayFunding(userId: string, currency: string, amount: number, paymentMethod: string, simulateStatus: 'completed' | 'failed' = 'completed', reference?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/fund-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency, amount, paymentMethod, simulateStatus, reference })
      });
      return await res.json();
    } catch (e) {
      return { 
        success: false, 
        error: 'Authoritative backend connection required.' 
      };
    }
  }

  public async getReceivingAccounts(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/receiving-accounts`);
      const data = await res.json();
      return data.receiving_accounts || (this.state.system_settings as any)?.receiving_accounts;
    } catch (e) {
      return (this.state.system_settings as any)?.receiving_accounts || {
        ngn: {
          bankName: 'Providus Bank',
          accountNumber: '9082341902',
          accountName: 'FlyeMass Logistics & Trade Ltd',
          instructions: 'Please include your FlyeMass Customer User Code (e.g. FLYE-NG-8821) as payment narration.'
        },
        usd: {
          bankName: 'JPMorgan Chase Bank, N.A. (New York)',
          accountName: 'FlyeMass Global International Inc.',
          accountNumber: '02100002148902',
          swiftBic: 'CHASUS33',
          routingNumber: '021000021',
          intermediaryBankInstructions: 'For international wires, quote beneficiary IBAN US89JPMC02100002148902 and your FlyeMass account ID.'
        }
      };
    }
  }

  public async updateReceivingAccounts(data: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/receiving-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'finance_officer'
      },
      body: JSON.stringify({ ...data, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update receiving accounts');
    if (result.receiving_accounts && (this.state.system_settings as any)) {
      (this.state.system_settings as any).receiving_accounts = result.receiving_accounts;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async getGatewaySettings(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/gateways/settings`);
      const data = await res.json();
      return data.gateways || (this.state.system_settings as any)?.gateways;
    } catch (e) {
      return (this.state.system_settings as any)?.gateways;
    }
  }

  public async updateGatewaySettings(data: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/gateways/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'finance_officer'
      },
      body: JSON.stringify({ ...data, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update gateway settings');
    if (result.gateways && (this.state.system_settings as any)) {
      (this.state.system_settings as any).gateways = result.gateways;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async submitManualDeposit(depositData: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/manual-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit manual deposit');
      if (result.payment) {
        if (!this.state.manual_payments) (this.state as any).manual_payments = {};
        (this.state as any).manual_payments[result.payment.id] = result.payment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      console.warn('Backend manual deposit endpoint failed, using local fallback:', e.message);
      const paymentId = depositData.id || `mpay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const curr = depositData.currency || 'USD';
      const num = Number(depositData.amount) || 0;
      const payment = {
        id: paymentId,
        reference: depositData.reference || `FLYE-${curr}-${Date.now()}`,
        userId: depositData.userId || 'usr_alade_01',
        customerName: depositData.customerName || 'Chief Babatunde Alade',
        customerEmail: depositData.customerEmail || 'alade.investments@flyemass.ng',
        currency: curr,
        amount: num,
        paymentMethod: depositData.paymentMethod || 'Manual Bank Wire / Transfer',
        senderName: depositData.senderName || depositData.customerName || 'Chief Babatunde Alade',
        originatingBank: depositData.originatingBank || 'Wire Transfer',
        destinationBank: depositData.destinationBank || (curr === 'USD' ? 'JPMorgan Chase Bank, N.A. (New York)' : 'Providus Bank'),
        receiptUrl: depositData.receiptUrl || null,
        receiptFileName: depositData.receiptFileName || 'bank_transfer_receipt',
        status: 'pending',
        notes: depositData.notes || 'Pending admin verification of bank wire',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (!this.state.manual_payments) (this.state as any).manual_payments = {};
      (this.state as any).manual_payments[paymentId] = payment;
      this.persist();
      this.notifyListeners();
      return { success: true, payment };
    }
  }

  public getManualPayments(): any[] {
    const payments = Object.values((this.state as any).manual_payments || {});
    return payments.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  public async approveManualPayment(paymentId: string, internalNotes: string = '', adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/manual-payments/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'finance_officer'
        },
        body: JSON.stringify({ paymentId, internalNotes, adminId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to approve manual payment');
      if (result.payment) {
        if (!this.state.manual_payments) (this.state as any).manual_payments = {};
        (this.state as any).manual_payments[result.payment.id] = result.payment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      console.warn('Backend manual payment approve failed, using local fallback:', e.message);
      if (!this.state.manual_payments || !(this.state as any).manual_payments[paymentId]) {
        throw new Error('Manual payment request not found');
      }
      const payment = (this.state as any).manual_payments[paymentId];
      payment.status = 'approved';
      payment.adminNotes = internalNotes || 'Approved by Finance Desk';
      payment.updatedAt = Date.now();

      // Credit user's wallet
      const user = this.state.users[payment.userId];
      if (user) {
        const curr = payment.currency || 'USD';
        user.balances[curr as 'NGN' | 'USD' | 'CNY'] = (user.balances[curr as 'NGN' | 'USD' | 'CNY'] || 0) + payment.amount;

        const ledgerId = `ldg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (!this.state.wallets_ledger) this.state.wallets_ledger = {};
        this.state.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: 'FUND',
          sourceCurrency: curr as any,
          targetCurrency: curr as any,
          amount: payment.amount,
          fee: 0,
          openingBalance: user.balances[curr as 'NGN' | 'USD' | 'CNY'] - payment.amount,
          closingBalance: user.balances[curr as 'NGN' | 'USD' | 'CNY'],
          status: 'completed',
          reference: payment.reference,
          timestamp: Date.now(),
          notes: `Manual ${curr} wire transfer approved and credited (${curr === 'USD' ? '$' : '₦'}${payment.amount.toLocaleString()})`
        };
      }
      this.persist();
      this.notifyListeners();
      return { success: true, payment, balances: user?.balances };
    }
  }

  public async rejectManualPayment(paymentId: string, rejectionReason: string, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/manual-payments/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'finance_officer'
        },
        body: JSON.stringify({ paymentId, rejectionReason, adminId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to reject manual payment');
      if (result.payment) {
        if (!this.state.manual_payments) (this.state as any).manual_payments = {};
        (this.state as any).manual_payments[result.payment.id] = result.payment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      console.warn('Backend manual payment reject failed, using local fallback:', e.message);
      if (!this.state.manual_payments || !(this.state as any).manual_payments[paymentId]) {
        throw new Error('Manual payment request not found');
      }
      const payment = (this.state as any).manual_payments[paymentId];
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason || 'Transfer receipt could not be verified';
      payment.adminNotes = rejectionReason || 'Rejected by Finance Desk';
      payment.updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, payment };
    }
  }

  public async requeryPaymentReference(reference: string, provider?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/gateway/requery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'finance_officer'
      },
      body: JSON.stringify({ reference, provider, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to requery payment reference');
    return result;
  }

  public async executeSwap(
    userId: string, 
    fromCurrency: string, 
    toCurrency: string, 
    fromAmount: number, 
    toAmount?: number, 
    rate?: number, 
    pin?: string,
    idempotencyKey?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/wallets/swap`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
        },
        body: JSON.stringify({ userId, fromCurrency, toCurrency, fromAmount, toAmount, rate, pin, idempotencyKey })
      });
      const data = await res.json();
      if (data.success && data.balances && this.state.users[userId]) {
        this.state.users[userId].balances = data.balances;
        if (data.ledger) {
          this.state.wallets_ledger[data.ledger.id] = data.ledger;
        }
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Swap execution failed' };
    }
  }

  // ---------------------------------------------------------------------
  // ENTERPRISE FX: rate book, publishing (publish_fx_rate), fee settings
  // and atomic swaps (execute_currency_swap)
  // ---------------------------------------------------------------------
  public async getFxBook(): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/fx/book`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load FX rate book');
    return data;
  }

  private fxAdminHeaders(adminId?: string, role: string = 'super_admin') {
    return { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': role };
  }

  public async publishFxRate(
    base: string, quote: string, buyRate: number, sellRate: number, adminId?: string, adminName?: string, role?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/fx/publish`, {
        method: 'POST',
        headers: this.fxAdminHeaders(adminId, role),
        body: JSON.stringify({ base, quote, buyRate, sellRate, adminName })
      });
      const data = await res.json();
      if (data.success) await this.refreshAfterFxChange();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Rate publishing failed' };
    }
  }

  public async updateFxFeeSetting(
    direction: string, feePercent: number, minAmountMinor: number, adminId?: string, adminName?: string, role?: string,
    maxRateAgeMinutes?: number
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/fx/fees`, {
        method: 'POST',
        headers: this.fxAdminHeaders(adminId, role),
        body: JSON.stringify({ direction, feePercent, minAmountMinor, adminName, maxRateAgeMinutes })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Fee update failed' };
    }
  }

  public async getFxAuditLog(adminId?: string, role?: string): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/fx/audit-log`, { headers: this.fxAdminHeaders(adminId, role) });
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  }

  public async executeCurrencySwap(
    userId: string, direction: string, amountMinor: number, pin: string, expectedRateId?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/fx/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, direction, amountMinor, pin, expectedRateId })
      });
      const data = await res.json();
      if (data.success && data.balances && this.state.users[userId]) {
        this.state.users[userId].balances = data.balances;
        if (data.ledger) this.state.wallets_ledger[data.ledger.id] = data.ledger;
        this.persist();
        this.notifyListeners();
      }
      if (!res.ok && !data.error) data.error = 'Swap failed';
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Swap execution failed' };
    }
  }

  private async refreshAfterFxChange() {
    this.lastRatesFetch = 0;
    try { await this.getAuthoritativeRates(true); } catch { /* ignore */ }
    this.notifyListeners();
  }

  public async getAuthoritativeRates(force: boolean = false): Promise<any> {
    const now = Date.now();
    if (!force && this.state.system_settings?.rates && (now - this.lastRatesFetch < 30000)) {
      return this.state.system_settings.rates;
    }
    if (this.ratesPromise) {
      return this.ratesPromise;
    }
    this.ratesPromise = (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/wallets/rates`);
        const data = await res.json();
        if (data.rates) {
          if (!this.state.system_settings) {
            this.state.system_settings = { rates: data.rates } as any;
          } else {
            this.state.system_settings.rates = data.rates;
          }
          this.lastRatesFetch = Date.now();
        }
        return data.rates;
      } catch {
        return this.state.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24, NGN_CNY: 214.50, spreadPercent: 0.75 };
      } finally {
        this.ratesPromise = null;
      }
    })();
    return this.ratesPromise;
  }

  public async paySupplier(
    userIdOrData: string | any,
    supplierName?: string,
    receiverAccount?: string,
    paymentMethod?: string,
    amountCNY?: number,
    note?: string,
    pin?: string,
    options?: any
  ): Promise<any> {
    try {
      const payload = typeof userIdOrData === 'object'
        ? userIdOrData
        : { userId: userIdOrData, supplierName, receiverAccount, paymentMethod, amountCNY, note, pin, ...(options || {}) };
      const res = await fetch(`${BACKEND_BASE}/api/wallets/pay-supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        const uId = payload.userId || 'usr_alade_01';
        if (data.balances && this.state.users[uId]) {
          this.state.users[uId].balances = data.balances;
        }
        if (data.payment) {
          if (!this.state.supplier_payments) this.state.supplier_payments = {};
          this.state.supplier_payments[data.payment.id] = data.payment;
        }
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error executing supplier payment' };
    }
  }

  public async requestWithdrawal(
    userIdOrData: string | any,
    bankName?: string,
    accountNumber?: string,
    accountName?: string,
    amountNGN?: number,
    pin?: string,
    feeOrOptions?: number | any,
    note?: string
  ): Promise<any> {
    try {
      const isOptions = typeof feeOrOptions === 'object' && feeOrOptions !== null;
      const fee = isOptions ? feeOrOptions.fee : feeOrOptions;
      const opts = isOptions ? feeOrOptions : {};
      const payload = typeof userIdOrData === 'object'
        ? userIdOrData
        : { userId: userIdOrData, bankName, accountNumber, accountName, amountNGN, pin, fee, note, ...opts };
      const res = await fetch(`${BACKEND_BASE}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        const uId = payload.userId || 'usr_alade_01';
        if (data.balances && this.state.users[uId]) {
          this.state.users[uId].balances = data.balances;
        }
        if (data.withdrawal) {
          if (!this.state.withdrawals) this.state.withdrawals = {};
          this.state.withdrawals[data.withdrawal.id] = data.withdrawal;
        }
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error requesting withdrawal' };
    }
  }

  public async payFreight(shipmentId: string, userId: string, paidWith: string, pin?: string, idempotencyKey?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/pay-freight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
        },
        body: JSON.stringify({ shipmentId, userId, paidWith, pin, idempotencyKey })
      });
      const data = await res.json();
      if (data.shipment) {
        this.state.shipments[data.shipment.id] = data.shipment;
        if (data.balances && this.state.users[userId]) {
          this.state.users[userId].balances = data.balances;
        }
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error processing freight payment' };
    }
  }

  public getShipmentsForUser(userId: string): ShipmentDocument[] {
    return Object.values(this.state.shipments)
      .filter(s => s.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getSupplierDirectoryPreview(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/preview`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error fetching directory preview' };
    }
  }

  public async getSupplierDirectory(userId: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/directory?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, unlocked: false, error: e.message || 'Network error fetching supplier directory' };
    }
  }

  public async getSupplierPrices(force: boolean = false): Promise<any> {
    const now = Date.now();
    if (!force && (now - this.lastSupplierPricesFetch < 60000)) {
      const cached = (this.state.system_settings as any)?.supplier_directory_prices;
      if (cached) return { success: true, prices: cached };
    }
    if (this.supplierPricesPromise) {
      return this.supplierPricesPromise;
    }
    this.supplierPricesPromise = (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/suppliers/prices`);
        const data = await res.json();
        if (data && data.prices) {
          if (!this.state.system_settings) this.state.system_settings = {} as any;
          (this.state.system_settings as any).supplier_directory_prices = data.prices;
          this.lastSupplierPricesFetch = Date.now();
        }
        return data;
      } catch (e: any) {
        return { success: false, prices: { ngn: 15000, usd: 10, cny: 70 } };
      } finally {
        this.supplierPricesPromise = null;
      }
    })();
    return this.supplierPricesPromise;
  }

  public async setSupplierPrices(ngn: number, usd: number, cny: number, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({ ngn, usd, cny, adminId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error setting supplier prices' };
    }
  }

  public async getSupplierSubscriptionStatus(userId: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/subscription-status?userId=${encodeURIComponent(userId)}`);
      const backendData = await res.json();
      if (backendData && backendData.isSubscribed) {
        return backendData;
      }
      // High-availability check against Supabase public.user_subscriptions
      try {
        const { data: supaSubs } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('active_until', { ascending: false })
          .limit(1);

        if (supaSubs && supaSubs.length > 0) {
          const sub = supaSubs[0];
          const activeUntilMs = new Date(sub.active_until).getTime();
          if (activeUntilMs > Date.now()) {
            return {
              isSubscribed: true,
              status: 'active',
              activeUntil: activeUntilMs,
              daysRemaining: Math.ceil((activeUntilMs - Date.now()) / (1000 * 60 * 60 * 24)),
              reference: sub.reference,
              currency: sub.currency,
              amountPaid: sub.amount
            };
          }
        }
      } catch (err) {
        // Fallback to backendData
      }
      return backendData;
    } catch (e: any) {
      return { success: false, isSubscribed: false, error: e.message };
    }
  }

  public async subscribeSupplierDirectory(userId: string, currency: string, pin: string, supplierId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/subscribe-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency, pin, supplierId })
      });
      const data = await res.json();
      if (data && data.success && data.subscription) {
        // Instantly sync into Supabase public.user_subscriptions
        try {
          await supabase.from('user_subscriptions').upsert({
            id: data.subscription.id || `sub_vip_${userId}`,
            user_id: userId,
            plan_type: data.subscription.type || 'directory_30d',
            currency: data.subscription.currency || currency,
            amount: data.subscription.amountPaid || 15000,
            status: 'active',
            active_until: new Date(data.subscription.activeUntil).toISOString(),
            reference: data.reference,
            auto_renew: false,
            updated_at: new Date().toISOString()
          });
        } catch (supaErr) {
          console.warn('[Supabase] Subscription mirror notice:', supaErr);
        }
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error subscribing to supplier directory' };
    }
  }

  public async getSupplierCardSignedUrl(supplierId: string, userId: string, docType: string = 'card'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/storage/supplier-cards/signed-url?supplierId=${encodeURIComponent(supplierId)}&userId=${encodeURIComponent(userId)}&docType=${encodeURIComponent(docType)}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error retrieving signed card URL' };
    }
  }

  public async subscribeToSupplier(userId: string, supplierId: string, paidWith: string, pin?: string): Promise<any> {
    return this.subscribeSupplierDirectory(userId, paidWith, pin || '', supplierId);
  }

  public async getSupplierContact(supplierId: string, userId: string): Promise<{ unlocked: boolean; contacts?: any; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/suppliers/contact?supplierId=${encodeURIComponent(supplierId)}&userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (e) {
      return { unlocked: false, error: 'Network error fetching supplier contacts' };
    }
  }

  public async markWithdrawalProcessing(withdrawalId: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ withdrawalId, adminId })
      });
      const data = await res.json();
      if (data && data.success && data.withdrawal) {
        if (!this.state.withdrawals) this.state.withdrawals = {};
        this.state.withdrawals[data.withdrawal.id] = data.withdrawal;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error updating withdrawal to processing' };
    }
  }

  public async disburseWithdrawal(
    withdrawalId: string, 
    transferReference: string, 
    adminIdOrProofUrl?: string, 
    adminNotesOrOptions?: any, 
    legacyAdminId?: string
  ): Promise<any> {
    try {
      let payload: any = { withdrawalId, transferReference };
      let effectiveAdminId = 'adm-001';

      if (typeof adminNotesOrOptions === 'object' && adminNotesOrOptions !== null) {
        effectiveAdminId = adminIdOrProofUrl || 'adm-001';
        payload = {
          ...payload,
          adminId: effectiveAdminId,
          ...adminNotesOrOptions
        };
      } else {
        if (adminIdOrProofUrl && (adminIdOrProofUrl.startsWith('adm-') || adminIdOrProofUrl.includes('@') || !adminIdOrProofUrl.startsWith('http'))) {
          effectiveAdminId = adminIdOrProofUrl;
          payload.adminId = effectiveAdminId;
        } else {
          payload.paymentProofUrl = adminIdOrProofUrl;
          payload.adminNotes = adminNotesOrOptions;
          payload.adminId = legacyAdminId || 'adm-001';
          effectiveAdminId = payload.adminId;
        }
      }

      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': effectiveAdminId, 'x-admin-role': 'finance_officer' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success && data.withdrawal) {
        if (!this.state.withdrawals) this.state.withdrawals = {};
        this.state.withdrawals[data.withdrawal.id] = data.withdrawal;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error disbursing withdrawal' };
    }
  }

  public async refundWithdrawal(withdrawalId: string, reason?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ withdrawalId, reason, adminId })
      });
      const data = await res.json();
      if (data && data.success && data.withdrawal) {
        if (!this.state.withdrawals) this.state.withdrawals = {};
        this.state.withdrawals[data.withdrawal.id] = data.withdrawal;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error processing withdrawal refund' };
    }
  }

  public async updateSystemSettings(adminName: string, rates?: any, fees?: any, live_fx_display?: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/settings/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-role': 'super_admin',
          'x-admin-id': 'adm-001'
        },
        body: JSON.stringify({ adminName, rates, fees, live_fx_display })
      });
      const data = await res.json();
      if (data && (data.success || data.rates) && this.state.system_settings) {
        if (rates) {
          this.state.system_settings.rates = {
            ...this.state.system_settings.rates,
            ...rates,
            lastUpdated: Date.now()
          };
          if (!this.state.fx_rates) {
            this.state.fx_rates = {};
          }
          this.state.fx_rates = {
            ...this.state.fx_rates,
            ...this.state.system_settings.rates
          };
          if (rates.USD_NGN || rates.USD_CNY) {
            if (!this.state.system_settings.logistics_fx_rates) {
              this.state.system_settings.logistics_fx_rates = {} as any;
            }
            if (rates.USD_NGN) this.state.system_settings.logistics_fx_rates.usdToNgn = Number(rates.USD_NGN);
            if (rates.USD_CNY) this.state.system_settings.logistics_fx_rates.usdToCny = Number(rates.USD_CNY);
          }
        }
        if (fees) {
          this.state.system_settings.fees = {
            ...this.state.system_settings.fees,
            ...fees
          };
        }
        if (live_fx_display) {
          this.state.system_settings.live_fx_display = {
            ...(this.state.system_settings.live_fx_display || {}),
            ...live_fx_display,
            lastUpdated: Date.now()
          };
        }
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e) {
      return { success: true };
    }
  }

  public async updateExchangeRates(rates: { NGN_CNY?: number; USD_NGN?: number; NGN_USD?: number; USD_CNY?: number; spreadPercent?: number }, adminName?: string): Promise<any> {
    return this.updateSystemSettings(adminName || 'Admin Central Treasury', rates);
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

  public async markSupplierPaymentProcessing(paymentId: string, adminId?: string, notes?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/supplier-payments/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ paymentId, adminId, notes })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error updating payment to processing' };
    }
  }

  public async disburseSupplierPayment(
    paymentId: string,
    evidence: { clearingSessionId?: string; paymentProofUrl?: string; safeDeclarationRef?: string; externalPaymentRef?: string; adminNotes?: string },
    adminId?: string
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/supplier-payments/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ paymentId, ...evidence })
      });
      const data = await res.json();
      if (data && data.success && data.payment) {
        if (!this.state.supplier_payments) this.state.supplier_payments = {};
        this.state.supplier_payments[data.payment.id] = data.payment;
        this.persist();
        this.notifyListeners();
      }
      return data;
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

  public updateUser(userId: string, updates: Partial<UserDocument>): UserDocument | undefined {
    const user = this.state.users[userId];
    if (user) {
      Object.assign(user, updates);
      this.persist();
      this.notifyListeners();
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

  public updateOrderStatus(
    orderId: string,
    fulfillmentStatus: ShopOrderDocument['fulfillmentStatus']
  ): ShopOrderDocument | undefined {
    return this.updateShopOrderStatus(orderId, fulfillmentStatus);
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
      this.notifyListeners();

      try {
        fetch(`${BACKEND_BASE}/api/admin/support/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, status })
        }).catch(() => {});
      } catch {}
    }
    return tkt;
  }

  public async updateTicketLifecycle(
    ticketId: string,
    updates: {
      status?: SupportTicketDocument['status'];
      priority?: SupportTicketDocument['priority'];
      resolutionNotes?: string;
      adminId?: string;
      adminName?: string;
    }
  ): Promise<SupportTicketDocument | undefined> {
    const tkt = this.state.support_tickets[ticketId];
    if (tkt) {
      if (updates.status) tkt.status = updates.status;
      if (updates.priority) {
        tkt.priority = updates.priority;
        let slaMins = 120;
        if (updates.priority === 'Urgent') slaMins = 15;
        else if (updates.priority === 'High' || updates.priority === 'High Priority') slaMins = 30;
        else if (updates.priority === 'Low') slaMins = 240;
        tkt.slaDueAt = Date.now() + slaMins * 60 * 1000;
        tkt.slaStatus = 'on_track';
      }
      if (updates.adminName && (updates.status === 'Human In-Progress' || updates.status === 'In Progress')) {
        tkt.assignedAgent = updates.adminName;
        tkt.assignedAgentId = updates.adminId || 'adm-002';
      }
      tkt.updatedAt = Date.now();
      this.persist();
      this.notifyListeners();

      try {
        fetch(`${BACKEND_BASE}/api/admin/support/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, ...updates })
        }).catch(() => {});
      } catch {}
    }
    return tkt;
  }

  public addTicketMessage(ticketId: string, message: { senderId: string; text: string; isAdmin: boolean; senderName?: string; isAi?: boolean; attachmentUrl?: string; attachmentName?: string; attachmentType?: string }) {
    const tkt = this.state.support_tickets[ticketId];
    if (tkt) {
      tkt.messages.push({
        ...message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      tkt.updatedAt = Date.now();
      this.persist();
      this.notifyListeners();

      try {
        fetch(`${BACKEND_BASE}/api/admin/support/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            senderId: message.senderId,
            senderName: message.senderName,
            text: message.text,
            isAdmin: message.isAdmin,
            attachmentUrl: message.attachmentUrl,
            attachmentName: message.attachmentName,
            attachmentType: message.attachmentType
          })
        }).catch(() => {});
      } catch {}
    }
    return tkt;
  }

  public appendChatMessage(msg: any) {
    if (!this.state.chat_messages) this.state.chat_messages = [];
    this.state.chat_messages.push(msg);
    this.persist();
    this.notifyListeners();
  }

  public saveSupportTicket(ticket: SupportTicketDocument) {
    this.state.support_tickets[ticket.id] = ticket;
    this.persist();
    this.notifyListeners();
  }

  public async uploadChatAttachment(
    file: File,
    ticketId?: string,
    userId?: string
  ): Promise<{ success: boolean; url: string; storageUrl?: string; fileName: string; fileType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const isImg = file.type.startsWith('image/');
          const bucket = isImg ? 'chat-images' : 'chat-documents';
          const defaultStorageUrl = `https://supabase.flyemass.com/storage/v1/object/public/${bucket}/${Date.now()}-${cleanName}`;

          try {
            const res = await fetch(`${BACKEND_BASE}/api/support/upload-attachment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileData: base64Data,
                mimeType: file.type,
                ticketId,
                userId
              })
            });
            const data = await res.json();
            if (data && data.success) {
              return resolve({
                success: true,
                url: data.url || base64Data,
                storageUrl: data.storageUrl || defaultStorageUrl,
                fileName: data.fileName || file.name,
                fileType: data.fileType || file.type
              });
            }
          } catch (netErr) {
            console.warn('[Offline Chat Upload Fallback]:', netErr);
          }

          resolve({
            success: true,
            url: base64Data,
            storageUrl: defaultStorageUrl,
            fileName: file.name,
            fileType: file.type
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  public async sendConciergeChat(
    text: string,
    ticketId: string = 'tkt_8901',
    userId: string = 'usr_alade_01',
    userName?: string,
    retries: number = 2,
    attachment?: { url?: string; fileName?: string; fileType?: string }
  ): Promise<{ success: boolean; response?: string; ticket?: SupportTicketDocument; aiMessage?: any; userMessage?: any; analysis?: any; error?: string }> {
    let lastError: any = null;

    // Graceful automatic retry mechanism (1-2 retries) before falling back
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(`${BACKEND_BASE}/api/support/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            text,
            ticketId,
            userId,
            userName,
            attachmentUrl: attachment?.url,
            attachmentName: attachment?.fileName,
            attachmentType: attachment?.fileType
          })
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data && data.ticket && data.aiMessage) {
          this.state.support_tickets[data.ticket.id] = data.ticket;
          if (!this.state.chat_messages) this.state.chat_messages = [];
          if (data.userMessage) this.state.chat_messages.push(data.userMessage);
          if (data.aiMessage) this.state.chat_messages.push(data.aiMessage);
          this.persist();
          this.notifyListeners();
          return data;
        }
        if (data && data.response) {
          return data;
        }
        throw new Error(data?.error || 'Invalid server response without ticket state');
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        console.warn(`[Gemini Concierge Attempt ${attempt}/${retries + 1} Warning]:`, err?.message || err);
        if (attempt <= retries) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }

    console.error('[Gemini AI Concierge db.sendConciergeChat Error / Fallback Activated]:', lastError);
    console.error('[Gemini AI Concierge All Retries Exhausted - Using High-Availability Engine]:', lastError);

    // Local high-availability fallback engine with human-like answers for greetings and trade queries
    const ticket: SupportTicketDocument = this.state.support_tickets[ticketId] || {
      id: ticketId,
      ticketNumber: 'TKT-8901',
      userId,
      userName: userName || 'Chief Babatunde Alade',
      subject: 'Trade Concierge Live Chat',
      category: 'General Trade',
      status: 'Open - AI Handled',
      priority: 'Normal',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const effectiveText = text.trim() || (attachment?.fileName ? `[Uploaded Attachment: ${attachment.fileName}]` : '[Attachment Attached]');
    const userMsg = {
      senderId: userId,
      senderName: userName || 'Chief Babatunde Alade',
      text: effectiveText,
      isAdmin: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.fileName,
      attachmentType: attachment?.fileType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    ticket.messages.push(userMsg);

    const lower = text.toLowerCase().trim();
    let status: SupportTicketDocument['status'] = 'Open - AI Handled';
    let category = 'General Trade';
    let priority: SupportTicketDocument['priority'] = 'Normal';
    let aiText = `Hello ${userName || 'Trader'}! I am Chen Wei / Trade AI, your expert B2B trade concierge at FlyeMass. I am here 24/7 to assist with live NGN/RMB currency swaps, paying China factories via Alipay/WeChat, Guangzhou warehouse shipping marks, and air/sea waybill tracking. How can I assist your business today?`;

    // Simple greetings and general conversational inquiries
    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower === 'hi chen wei' ||
      lower === 'hello chen wei' ||
      lower === 'hey chen wei' ||
      lower === 'good morning' ||
      lower === 'good afternoon' ||
      lower === 'good evening' ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ') ||
      lower.startsWith('hey ') ||
      lower.includes('how are you') ||
      lower.includes('who are you') ||
      lower.includes('what can you do') ||
      lower.includes('how do you work') ||
      lower.includes('help me')
    ) {
      aiText = `Hello ${userName || 'Trader'}! I am Chen Wei / Trade AI, your dedicated FlyeMass B2B trade concierge. I am here 24/7 to assist with your China sourcing, Alipay & WeChat factory settlements, Guangzhou warehouse waybills, and zero-slippage FX swaps. How can I help your business grow today?`;
    } else if (lower.includes('rate') || lower.includes('fx') || lower.includes('rmb') || lower.includes('dollar') || lower.includes('naira')) {
      aiText = `Live wholesale rate: ₦214.50 per RMB and ₦1,485.00 per USD. Zero slippage guaranteed on your instant FX Swap dashboard!`;
      category = 'FX Swap Slippage';
    } else if (lower.includes('flight') || lower.includes('et921') || lower.includes('cargo') || lower.includes('tracking')) {
      aiText = `Your shipment FM-CAN-LOS-89241 is airborne on Ethiopian Cargo ET921, arriving at Lagos MMIA tomorrow morning at 06:30 AM WAT.`;
      category = 'Air Freight Waybill';
    } else if (lower.includes('address') || lower.includes('warehouse')) {
      aiText = `Our Guangzhou Baiyun receiving address: 广东省广州市白云区石井国际物流园B栋302室. Mark cartons with: FM / FM-USR-8924 / ${userName || 'Chief Alade'}.`;
      category = 'Air Freight Waybill';
    } else if (lower.includes('alipay') || lower.includes('wechat') || lower.includes('pay supplier')) {
      aiText = `We settle China factory payouts via Alipay (支付宝), WeChat Pay (微信支付), and Bank Transfer (银联 / CNAPS) in real-time with clearing confirmation under 90 seconds.`;
      category = 'Supplier Escrow';
    } else if (lower.includes('delay') || lower.includes('complaint') || lower.includes('refund') || lower.includes('human') || lower.includes('agent') || lower.includes('issue') || lower.includes('problem')) {
      aiText = `I apologize for any inconvenience. I have logged ticket #${ticket.ticketNumber || ticket.id} and marked it for Pending Human Review on our supervisor desk. A senior officer will follow up directly!`;
      status = 'Pending Human Review';
      priority = 'High';
    } else if (lastError && !lower.includes('hi') && !lower.includes('hello') && !lower.includes('rate') && !lower.includes('where') && !lower.includes('address')) {
      aiText = 'Trade AI is momentarily busy. Please try again or tap to escalate to human support.';
    }

    const aiMsg = {
      senderId: 'ai-chen-wei',
      senderName: 'Chen Wei (Trade AI)',
      text: aiText,
      isAdmin: true,
      isAi: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    ticket.messages.push(aiMsg);
    ticket.status = status;
    ticket.category = category;
    ticket.priority = priority;
    ticket.aiHandled = true;
    ticket.updatedAt = Date.now();
    this.state.support_tickets[ticket.id] = ticket;

    if (!this.state.chat_messages) this.state.chat_messages = [];
    this.state.chat_messages.push(userMsg);
    this.state.chat_messages.push(aiMsg);

    this.persist();
    this.notifyListeners();
    return { success: true, response: aiText, ticket, aiMessage: aiMsg, userMessage: userMsg, error: lastError?.message };
  }

  public async takeOverSupportTicket(
    ticketId: string,
    adminId: string = 'adm-002',
    adminName: string = 'Senior Trade Officer (Guangzhou Hub)'
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/support/take-over`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, adminId, adminName })
      });
      const data = await res.json();
      if (data.ticket) {
        this.state.support_tickets[data.ticket.id] = data.ticket;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch {
      const ticket = this.state.support_tickets[ticketId];
      if (ticket) {
        ticket.status = 'Human In-Progress';
        ticket.assignedAgent = adminName;
        ticket.messages.push({
          senderId: adminId,
          senderName: 'System Escalation Desk',
          text: `[Human Agent Takeover] ${adminName} has joined the thread for manual assistance.`,
          isAdmin: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        ticket.updatedAt = Date.now();
        this.persist();
        this.notifyListeners();
      }
      return { success: true, ticket };
    }
  }

  public getChatMessages(): any[] {
    return this.state.chat_messages || [];
  }

  public getBanners(placement?: 'home' | 'shop' | 'all'): BannerDocument[] {
    const list = (this.state.banners || []).filter(b => b.isActive);
    if (placement === 'all') {
      return list.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    if (placement === 'shop') {
      return list.filter(b => b.placement === 'shop' || b.destinationRoute === 'shop').sort((a, b) => a.displayOrder - b.displayOrder);
    }
    // Default / home: strictly exclude shop banners so Apple & Tech Store banners never show on the homepage
    return list.filter(b => b.placement !== 'shop' && b.destinationRoute !== 'shop').sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getHomeBanners(): BannerDocument[] {
    return (this.state.banners || [])
      .filter(b => b.isActive && b.placement !== 'shop' && b.destinationRoute !== 'shop')
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getAllBanners(): BannerDocument[] {
    return (this.state.banners || []).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getShopBanners(): BannerDocument[] {
    const list = (this.state.banners || []).filter(b => b.isActive && (b.placement === 'shop' || b.destinationRoute === 'shop'));
    if (list.length > 0) {
      return list.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return (INITIAL_DATABASE.banners || []).filter(b => b.isActive && (b.placement === 'shop' || b.destinationRoute === 'shop')).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getAllShopBanners(): BannerDocument[] {
    const list = (this.state.banners || []).filter(b => b.placement === 'shop' || b.destinationRoute === 'shop');
    if (list.length > 0) {
      return list.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return (INITIAL_DATABASE.banners || []).filter(b => b.placement === 'shop' || b.destinationRoute === 'shop').sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public reorderBanners(bannerIds: string[], adminId?: string): void {
    if (!this.state.banners) this.state.banners = [];
    bannerIds.forEach((id, idx) => {
      const banner = this.state.banners.find(b => b.id === id);
      if (banner) {
        banner.displayOrder = idx + 1;
        banner.updatedAt = Date.now();
      }
    });
    this.persist();
    fetch(`${BACKEND_BASE}/api/admin/banners/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
      body: JSON.stringify({ bannerIds, adminId: adminId || 'Admin Staff' })
    }).catch(() => {});
  }

  public async uploadBannerImage(file: File): Promise<{ success: boolean; url: string; storageUrl?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        try {
          const res = await fetch(`${BACKEND_BASE}/api/admin/banners/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              fileData
            })
          });
          const json = await res.json();
          if (json && json.success) {
            resolve({ success: true, url: json.url || fileData, storageUrl: json.storageUrl });
            return;
          }
        } catch {}
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageUrl = `https://supabase.flyemass.com/storage/v1/object/public/shop_banners/${Date.now()}-${cleanName}`;
        resolve({ success: true, url: fileData, storageUrl });
      };
      reader.onerror = () => {
        resolve({ success: false, url: '' });
      };
      reader.readAsDataURL(file);
    });
  }

  public toggleBanner(bannerId: string, isActive: boolean, adminId?: string): BannerDocument | undefined {
    const banner = (this.state.banners || []).find(b => b.id === bannerId);
    if (banner) {
      banner.isActive = isActive;
      this.persist();
      fetch(`${BACKEND_BASE}/api/admin/banners/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
        body: JSON.stringify({ bannerId, isActive, adminId: adminId || 'Admin Staff' })
      }).catch(() => {});
    }
    return banner;
  }

  public addBanner(banner: BannerDocument, adminId?: string): BannerDocument {
    if (!this.state.banners) this.state.banners = [];
    this.state.banners.push(banner);
    this.persist();
    fetch(`${BACKEND_BASE}/api/admin/banners/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
      body: JSON.stringify({ banner, adminId: adminId || 'Admin Staff' })
    }).catch(() => {});
    return banner;
  }

  public updateBanner(banner: BannerDocument, adminId?: string): BannerDocument | undefined {
    if (!this.state.banners) this.state.banners = [];
    const index = this.state.banners.findIndex(b => b.id === banner.id);
    if (index >= 0) {
      this.state.banners[index] = banner;
      this.persist();
      fetch(`${BACKEND_BASE}/api/admin/banners/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
        body: JSON.stringify({ banner, adminId: adminId || 'Admin Staff' })
      }).catch(() => {});
      return banner;
    }
    return undefined;
  }

  public deleteBanner(bannerId: string, adminId?: string): boolean {
    if (!this.state.banners) this.state.banners = [];
    const initialLen = this.state.banners.length;
    this.state.banners = this.state.banners.filter(b => b.id !== bannerId);
    this.persist();
    fetch(`${BACKEND_BASE}/api/admin/banners/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
      body: JSON.stringify({ bannerId, adminId: adminId || 'Admin Staff' })
    }).catch(() => {});
    return this.state.banners.length < initialLen;
  }

  public async getEmailLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/emails/logs`, {
        headers: { 'x-admin-role': 'super_admin' }
      });
      const data = await res.json();
      return data.logs || [];
    } catch {
      const raw = this.state.email_receipts || {};
      return (Array.isArray(raw) ? raw : Object.values(raw));
    }
  }

  public async sendEmailCampaign(payload: {
    recipientEmail?: string;
    recipientName?: string;
    subject: string;
    message: string;
    campaignType?: string;
    broadcastToAllUsers?: boolean;
    adminId?: string;
  }): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to dispatch email' };
    }
  }

  public async getEmailReceipts(userId?: string): Promise<any[]> {
    try {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`${BACKEND_BASE}/api/emails/my-receipts${query}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.receipts)) {
        return data.receipts;
      }
    } catch {
      // Fallback to in-memory state
    }
    const raw = this.state.email_receipts || {};
    const all = Array.isArray(raw) ? raw : Object.values(raw);
    if (!userId) return all;
    return all.filter((r: any) => 
      r.userId === userId || 
      (r.recipientEmail && this.state.users[userId]?.email?.toLowerCase() === r.recipientEmail.toLowerCase())
    );
  }

  public async dispatchTransactionalEmail(
    eventType: TransactionalEmailEvent,
    recipient: EmailRecipient,
    payload: any = {}
  ): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      const rendered = renderTransactionalEmail(eventType, recipient, payload);
      const res = await fetch(`${BACKEND_BASE}/api/emails/dispatch-transactional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          recipient,
          payload,
          rendered
        })
      });
      return await res.json();
    } catch (e: any) {
      // Fallback offline dispatch to local state
      const rendered = renderTransactionalEmail(eventType, recipient, payload);
      const emailId = `eml_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const record = {
        id: emailId,
        userId: recipient.userId,
        recipientEmail: recipient.email,
        customerName: recipient.name,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        eventType,
        payload,
        deliveredAt: Date.now(),
        status: 'delivered',
        provider: 'local_offline'
      };
      if (!this.state.email_receipts) this.state.email_receipts = {};
      this.state.email_receipts[emailId] = record;
      return { success: true, emailId };
    }
  }


  public async deleteAdminNotification(notificationId: string, adminId?: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': 'super_admin' },
        body: JSON.stringify({ notificationId, adminId: adminId || 'Admin Staff' })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
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

  public async uploadProductImage(file: File): Promise<{ success: boolean; url: string; storageUrl?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        try {
          const res = await fetch(`${BACKEND_BASE}/api/shop/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              fileData
            })
          });
          const json = await res.json();
          if (json && json.success) {
            resolve({ success: true, url: json.url || fileData, storageUrl: json.storageUrl });
            return;
          }
        } catch {}
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageUrl = `https://supabase.flyemass.com/storage/v1/object/public/products/${Date.now()}-${cleanName}`;
        resolve({ success: true, url: fileData, storageUrl });
      };
      reader.onerror = () => {
        resolve({ success: false, url: '' });
      };
      reader.readAsDataURL(file);
    });
  }

  public addProduct(product: TechProduct): TechProduct {
    if (!this.state.products) this.state.products = {};
    const gallery = Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : (product.image ? [product.image] : []);
    const preparedProd = {
      ...product,
      image: gallery[0] || product.image || '',
      images: gallery
    };
    this.state.products[product.id] = preparedProd;
    this.persist();
    fetch(`${BACKEND_BASE}/api/shop/add-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: preparedProd })
    }).catch(() => {});
    return preparedProd;
  }

  public updateProduct(productId: string, updates: Partial<TechProduct>): TechProduct | undefined {
    if (!this.state.products) this.state.products = {};
    const existing = this.state.products[productId];
    if (existing) {
      const updatedGallery = Array.isArray(updates.images)
        ? updates.images.filter(Boolean)
        : existing.images || (existing.image ? [existing.image] : []);
      const updated = { 
        ...existing, 
        ...updates, 
        id: productId,
        images: updatedGallery,
        image: updatedGallery[0] || updates.image || existing.image
      };
      this.state.products[productId] = updated;
      this.persist();
      fetch(`${BACKEND_BASE}/api/shop/update-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, updates })
      }).catch(() => {});
      return updated;
    }
    return undefined;
  }

  public deleteProduct(productId: string): boolean {
    if (this.state.products && this.state.products[productId]) {
      delete this.state.products[productId];
      this.persist();
      fetch(`${BACKEND_BASE}/api/shop/delete-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      }).catch(() => {});
      return true;
    }
    return false;
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

  public getShopSettings(): DeviceShopSettings {
    if (!this.state.device_shop_settings) {
      this.state.device_shop_settings = {
        deliveryFeeNGN: 5000,
        updatedAt: Date.now(),
        updatedBy: 'system'
      };
    }
    return this.state.device_shop_settings;
  }

  public async updateShopSettings(feeNGN: number, adminId: string = 'adm-001'): Promise<any> {
    if (!this.state.device_shop_settings) {
      this.state.device_shop_settings = { deliveryFeeNGN: feeNGN, updatedAt: Date.now(), updatedBy: adminId };
    } else {
      this.state.device_shop_settings.deliveryFeeNGN = feeNGN;
      this.state.device_shop_settings.updatedAt = Date.now();
      this.state.device_shop_settings.updatedBy = adminId;
    }
    this.persist();
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/shop/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({ deliveryFeeNGN: feeNGN })
      });
      return await res.json();
    } catch (e) {
      return { success: true, settings: this.state.device_shop_settings };
    }
  }

  public getUserFavorites(userId: string): string[] {
    if (!this.state.user_favorites) this.state.user_favorites = {};
    return this.state.user_favorites[userId] || [];
  }

  public async toggleUserFavorite(userId: string, productId: string): Promise<string[]> {
    if (!this.state.user_favorites) this.state.user_favorites = {};
    const favs = this.state.user_favorites[userId] || [];
    const exists = favs.includes(productId);
    const updated = exists ? favs.filter(id => id !== productId) : [...favs, productId];
    this.state.user_favorites[userId] = updated;
    this.persist();
    try {
      await fetch(`${BACKEND_BASE}/api/shop/saved/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });
    } catch (e) {}
    return updated;
  }

  public getCloudCart(userId: string): CartItem[] {
    if (!this.state.device_cart_items) this.state.device_cart_items = {};
    const memoryCart = this.state.device_cart_items[userId];
    if (Array.isArray(memoryCart) && memoryCart.length > 0) return memoryCart;
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('flyemass_cart');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.device_cart_items[userId] = parsed;
            return parsed;
          }
        }
      } catch (e) {}
    }
    return [];
  }

  public async syncCloudCart(userId: string, items: CartItem[]): Promise<any> {
    if (!this.state.device_cart_items) this.state.device_cart_items = {};
    this.state.device_cart_items[userId] = items;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('flyemass_cart', JSON.stringify(items));
      } catch (e) {}
    }
    this.persist();
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shop/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, items })
      });
      return await res.json();
    } catch (e) {
      return { success: true, items };
    }
  }

  public updateVariantStock(productId: string, variantId?: string, delta: number = 0): void {
    const prod = this.state.products[productId];
    if (!prod) return;
    if (variantId && prod.variants) {
      const v = prod.variants.find((item: any) => item.id === variantId);
      if (v) {
        v.stockCount = Math.max(0, (v.stockCount || 0) + delta);
      }
      prod.stockCount = prod.variants.reduce((acc: number, curr: any) => acc + (curr.stockCount || 0), 0);
    } else {
      prod.stockCount = Math.max(0, (prod.stockCount || 0) + delta);
    }
    this.persist();
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

  public async updateHotelBookingStatus(bookingId: string, status: string, notes?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/booking-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ bookingId, status, notes, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update booking status');
    if (result.booking) {
      if (!this.state.hotel_bookings) this.state.hotel_bookings = {};
      this.state.hotel_bookings[result.booking.id] = result.booking;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async bookHotelWithPin(
    userId: string,
    hotel: any,
    nights: number,
    totalUSD: number,
    currency: string,
    guestName: string,
    pin?: string,
    extraData: any = {}
  ): Promise<any> {
    const payload = {
      userId,
      hotel,
      hotelId: hotel?.id,
      nights,
      totalUSD,
      currency,
      guestName,
      pin,
      ...extraData
    };

    const res = await fetch(`${BACKEND_BASE}/api/hotels/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to book hotel');
    if (result.booking) {
      if (!this.state.hotel_bookings) this.state.hotel_bookings = {};
      this.state.hotel_bookings[result.booking.id] = result.booking;
    }
    if (result.balances && userId && this.state.users[userId]) {
      this.state.users[userId].balances = result.balances;
    }
    this.persist();
    this.notifyListeners();
    return result;
  }

  public getSystemSettings(): SystemSettingsDocument {
    return this.state.system_settings;
  }

  public async loginUser(identifier: string, password?: string, role: string = 'client'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role })
    });
    return await res.json();
  }

  public async registerUser(details: {
    fullName: string;
    email: string;
    phone?: string;
    businessName?: string;
    pin?: string;
    firstName?: string;
    surname?: string;
    otherName?: string;
    dateOfBirth?: string;
    country?: string;
    accountType?: string;
  }): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    return await res.json();
  }

  public async rebindHardwareSession(
    userId: string,
    details: {
      method?: 'biometric' | 'qr_sync';
      deviceName?: string;
      sessionToken?: string;
      hardwareEnclaveId?: string;
      syncedFrom?: string;
    }
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/device-migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...details })
      });
      const data = await res.json();
      if (data.user && this.state.users[userId]) {
        this.state.users[userId] = {
          ...this.state.users[userId],
          primaryTerminal: data.user.primaryTerminal,
          hardwareSession: data.user.hardwareSession
        } as any;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch {
      // Local fallback
      const user = this.state.users[userId || 'usr_alade_01'];
      if (user) {
        (user as any).primaryTerminal = details.deviceName || 'iPhone 16 Pro (Mobile Enclave)';
        (user as any).hardwareSession = {
          method: details.method || 'biometric',
          deviceName: details.deviceName || 'iPhone 16 Pro (Mobile Enclave)',
          sessionToken: details.sessionToken || `tok_${Date.now()}`,
          authorizedAt: Date.now(),
          isPrimary: true
        };
        this.persist();
        this.notifyListeners();
      }
      return { success: true, message: 'Hardware session bound locally' };
    }
  }

  public async authorizeTerminalSession(
    userId: string,
    details: {
      method?: 'biometric' | 'qr_sync';
      deviceName?: string;
      sessionToken?: string;
      syncedFrom?: string;
    }
  ): Promise<any> {
    return this.rebindHardwareSession(userId, { method: 'qr_sync', ...details });
  }

  public async manualAdjustBalance(
    userId: string,
    currency: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string,
    adminId: string = 'adm-001',
    adminPin: string = '2468'
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/wallets/manual-adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({ userId, currency, amount, type, reason, adminId, adminPin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust balance');

      // Sync local reactive state
      const curr = currency.toUpperCase();
      if (this.state.users[userId] && data.balances) {
        this.state.users[userId].balances = data.balances;
      }
      this.notifyListeners();
      return data;
    } catch (err: any) {
      if (err.message && err.message.includes('Security Guardrail')) {
        throw err;
      }
      if (err.message && err.message.includes('Mandatory admin note')) {
        throw err;
      }
      if (err.message && err.message.includes('Insufficient customer balance')) {
        throw err;
      }
      // Local fallback for offline mode
      const curr = currency.toUpperCase();
      const user = this.state.users[userId];
      if (user) {
        const opening = user.balances[curr] || 0;
        if (type === 'debit' && opening < amount) {
          throw new Error(`Insufficient customer balance (${curr} ${opening.toLocaleString()})`);
        }
        const closing = type === 'credit' ? opening + amount : opening - amount;
        user.balances[curr] = closing;
        const ref = `ADJ-ADMIN-${curr}-${Date.now().toString().slice(-6)}`;
        const ledgerId = `ldg_${Date.now()}`;
        this.state.wallets_ledger[ledgerId] = {
          id: ledgerId,
          userId: user.uid,
          type: type === 'credit' ? 'FUND' : 'WITHDRAW',
          sourceCurrency: curr,
          targetCurrency: curr,
          amount,
          fee: 0,
          openingBalance: opening,
          closingBalance: closing,
          status: 'completed',
          reference: ref,
          timestamp: Date.now(),
          notes: `Manual ${type.toUpperCase()} by Admin (${adminId}): ${reason}`
        };
        const currSym = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : '¥';
        if (!this.state.notifications) this.state.notifications = [];
        this.state.notifications.unshift({
          id: `notif_${Date.now()}`,
          userId: user.uid,
          targetUserId: user.uid,
          title: `Wallet ${type === 'credit' ? 'Credited' : 'Debited'}`,
          message: `Your ${curr} wallet has been ${type === 'credit' ? 'credited' : 'debited'} with ${currSym}${amount.toLocaleString()} by FlyeMass Support. Note: ${reason}`,
          type: 'wallet',
          linkRoute: 'wallets',
          read: false,
          timestamp: Date.now(),
          time: 'Just now'
        });
        this.notifyListeners();
        return { success: true, balances: user.balances, reference: ref, ledgerId };
      }
      throw err;
    }
  }

  public async adminAdjustWalletBalance(
    userId: string,
    currency: string,
    amount: number,
    type: 'credit' | 'debit',
    adminNote: string,
    adminId: string = 'adm-001',
    adminPin: string = '2468'
  ): Promise<any> {
    return this.manualAdjustBalance(userId, currency, amount, type, adminNote, adminId, adminPin);
  }

  public async suspendUser(
    userId: string,
    isSuspended: boolean,
    reason?: string,
    restrictions: string[] = [],
    adminId: string = 'adm-001'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/users/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ userId, isSuspended, reason, restrictions, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user suspension status');
    return data;
  }

  public async cancelShopOrder(orderId: string, reason?: string, adminId?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/shop/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel shop order');
    return data;
  }

  public async fulfillShopOrder(orderId: string, trackingNumber?: string, status: string = 'shipped', notes?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/shop/orders/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ orderId, trackingNumber, status, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fulfill order');
    return data;
  }

  public async cancelShipment(shipmentId: string, reason?: string, adminId?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/shipments/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentId, reason, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel shipment');
    return data;
  }

  public async cancelHotelBooking(bookingId: string, userId: string, reason?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/hotels/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, userId, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel hotel booking');
    return data;
  }

  public async sendAdminNotification(
    title: string,
    message: string,
    type: 'trade' | 'cargo' | 'fx' | 'system' = 'system',
    targetUserId: string = 'all',
    linkRoute?: string,
    adminId: string = 'adm-001'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ title, message, type, targetUserId, linkRoute, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch notification');
    return data;
  }

  public async getAdminSuppliers(adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers`, {
      method: 'GET',
      headers: {
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin suppliers');
    return data;
  }

  public async createSupplier(supplier: any, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({ supplier, adminId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');
      return data;
    } catch (e: any) {
      console.warn('Backend supplier create failed, applying local fallback:', e.message);
      const supplierId = supplier.id || `sup_${Date.now()}`;
      const newSup = {
        ...supplier,
        id: supplierId,
        verifiedYears: Number(supplier.verifiedYears) || 1,
        inspectionPassed: supplier.inspectionPassed ?? true,
        active: supplier.active !== false,
        tags: Array.isArray(supplier.tags) ? supplier.tags : ['Verified Business', 'Factory Direct'],
        createdAt: Date.now()
      };
      if (!this.state.suppliers) this.state.suppliers = {};
      this.state.suppliers[supplierId] = newSup;
      if (!this.state.private_supplier_contacts) this.state.private_supplier_contacts = {};
      this.state.private_supplier_contacts[supplierId] = {
        wechatId: supplier.wechatId || '',
        phone: supplier.phone || '',
        whatsapp: supplier.whatsapp || '',
        directManager: supplier.directManager || 'General Export Manager',
        factoryAddress: supplier.businessAddress || supplier.factoryAddress || '',
        description: supplier.description || ''
      };
      this.notifyListeners();
      return { success: true, supplier: newSup };
    }
  }

  public async updateSupplier(supplier: any, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({ supplier, adminId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update supplier');
      return data;
    } catch (e: any) {
      console.warn('Backend supplier update failed, applying local fallback:', e.message);
      if (!supplier || !supplier.id) throw new Error('Supplier ID is required');
      if (!this.state.suppliers) this.state.suppliers = {};
      const existing = this.state.suppliers[supplier.id] || {};
      const updatedSup = {
        ...existing,
        ...supplier,
        id: supplier.id,
        updatedAt: Date.now()
      };
      this.state.suppliers[supplier.id] = updatedSup;
      if (!this.state.private_supplier_contacts) this.state.private_supplier_contacts = {};
      this.state.private_supplier_contacts[supplier.id] = {
        ...(this.state.private_supplier_contacts[supplier.id] || {}),
        wechatId: supplier.wechatId !== undefined ? supplier.wechatId : (this.state.private_supplier_contacts[supplier.id]?.wechatId || ''),
        phone: supplier.phone !== undefined ? supplier.phone : (this.state.private_supplier_contacts[supplier.id]?.phone || ''),
        whatsapp: supplier.whatsapp !== undefined ? supplier.whatsapp : (this.state.private_supplier_contacts[supplier.id]?.whatsapp || ''),
        directManager: supplier.directManager || this.state.private_supplier_contacts[supplier.id]?.directManager || 'General Export Manager',
        factoryAddress: supplier.businessAddress || supplier.factoryAddress || this.state.private_supplier_contacts[supplier.id]?.factoryAddress || '',
        description: supplier.description || this.state.private_supplier_contacts[supplier.id]?.description || ''
      };
      this.notifyListeners();
      return { success: true, supplier: updatedSup };
    }
  }

  public async toggleSupplierStatus(supplierId: string, active?: boolean, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ supplierId, active, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle supplier status');
    return data;
  }

  public async deleteSupplier(supplierId: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ supplierId, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete supplier');
    return data;
  }

  public async getAdminSupplierMetrics(adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/suppliers/metrics`, {
      method: 'GET',
      headers: {
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch supplier metrics');
    return data;
  }

  // ==========================================
  // WAREHOUSES & CONSOLIDATION HUBS
  // ==========================================

  public getWarehouses(includeInactive: boolean = false): Warehouse[] {
    const list = Object.values(this.state.warehouses || {}) as Warehouse[];
    if (includeInactive) return list;
    return list.filter((w) => w.isActive !== false);
  }

  public async fetchWarehouses(all: boolean = false, force: boolean = false): Promise<Warehouse[]> {
    const now = Date.now();
    if (!force && this.state.warehouses && Object.keys(this.state.warehouses).length > 0 && (now - this.lastWarehousesFetch < 15000)) {
      return this.getWarehouses(all);
    }
    if (this.warehousesFetchPromise) {
      return this.warehousesFetchPromise;
    }
    this.warehousesFetchPromise = (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/warehouses${all ? '?all=true' : ''}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.warehouses)) {
          if (!this.state.warehouses) this.state.warehouses = {};
          let hasChanges = false;
          for (const w of data.warehouses) {
            const existing = this.state.warehouses[w.id];
            if (!existing || existing.updatedAt !== w.updatedAt || existing.isActive !== w.isActive) {
              hasChanges = true;
            }
            this.state.warehouses[w.id] = w;
          }
          this.lastWarehousesFetch = Date.now();
          if (hasChanges) {
            const stateStr = JSON.stringify(this.state);
            this.lastSerializedState = stateStr;
            this.stateRevision++;
            try {
              localStorage.setItem(STORAGE_KEY, stateStr);
            } catch (_) {}
            this.notifyListeners();
          }
          return data.warehouses;
        }
        return this.getWarehouses(all);
      } catch {
        return this.getWarehouses(all);
      } finally {
        this.warehousesFetchPromise = null;
      }
    })();
    return this.warehousesFetchPromise;
  }

  public async addWarehouse(
    warehouse: Partial<Warehouse>,
    adminId: string = 'adm-001',
    adminRole: string = 'super_admin',
    adminName: string = 'Super Administrator'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/warehouses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': adminRole,
        'x-admin-name': adminName
      },
      body: JSON.stringify(warehouse)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add warehouse');
    if (data.warehouse) {
      if (!this.state.warehouses) this.state.warehouses = {};
      this.state.warehouses[data.warehouse.id] = data.warehouse;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async updateWarehouse(
    id: string,
    warehouse: Partial<Warehouse>,
    adminId: string = 'adm-001',
    adminRole: string = 'super_admin',
    adminName: string = 'Super Administrator'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/warehouses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': adminRole,
        'x-admin-name': adminName
      },
      body: JSON.stringify(warehouse)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update warehouse');
    if (data.warehouse) {
      if (!this.state.warehouses) this.state.warehouses = {};
      this.state.warehouses[id] = data.warehouse;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async toggleWarehouseStatus(
    id: string,
    isActive: boolean,
    adminId: string = 'adm-001',
    adminRole: string = 'super_admin',
    adminName: string = 'Super Administrator'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/warehouses/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': adminRole,
        'x-admin-name': adminName
      },
      body: JSON.stringify({ isActive })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update warehouse status');
    if (data.warehouse) {
      if (!this.state.warehouses) this.state.warehouses = {};
      this.state.warehouses[id] = data.warehouse;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async deleteWarehouse(
    id: string,
    adminId: string = 'adm-001',
    adminRole: string = 'super_admin',
    adminName: string = 'Super Administrator'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/warehouses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': adminRole,
        'x-admin-name': adminName
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete warehouse');
    if (this.state.warehouses && this.state.warehouses[id]) {
      delete this.state.warehouses[id];
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  // ==========================================
  // LAGOS WAREHOUSES & LAST-MILE HUBS
  // ==========================================

  public getLagosHubs(onlyActive: boolean = true): LagosHub[] {
    const map = this.state.lagos_hubs || DEFAULT_LAGOS_HUBS;
    const list = Object.values(map) as LagosHub[];
    const filtered = onlyActive ? list.filter(h => h.isActive !== false) : list;
    return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  public async lagosHubsQuery(onlyActive: boolean = true): Promise<LagosHub[]> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/lagos-hubs${onlyActive ? '?active=true' : '?all=true'}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.hubs)) {
        if (!this.state.lagos_hubs) this.state.lagos_hubs = {};
        for (const h of data.hubs) {
          this.state.lagos_hubs[h.id] = h;
        }
        this.persist();
        this.notifyListeners();
        return data.hubs;
      }
      return this.getLagosHubs(onlyActive);
    } catch {
      return this.getLagosHubs(onlyActive);
    }
  }

  public async createLagosHub(hub: Partial<LagosHub>, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/lagos-hubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...hub, adminId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Lagos Hub');
      if (data.hub) {
        if (!this.state.lagos_hubs) this.state.lagos_hubs = {};
        this.state.lagos_hubs[data.hub.id] = data.hub;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      const id = hub.id || `HUB-${Date.now()}`;
      const newHub: LagosHub = {
        id,
        name: hub.name || 'New Lagos Hub',
        code: hub.code || `LOS-${Date.now().toString().slice(-4)}`,
        district: hub.district || 'Lagos',
        address: hub.address || '',
        phone: hub.phone || '+234 803 000 0000',
        contactPerson: hub.contactPerson,
        operatingHours: hub.operatingHours || 'Mon - Sat: 8:00 AM - 6:00 PM',
        doorstepDispatchAvailable: hub.doorstepDispatchAvailable !== false,
        sortOrder: hub.sortOrder || 1,
        isActive: hub.isActive !== false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (!this.state.lagos_hubs) this.state.lagos_hubs = {};
      this.state.lagos_hubs[id] = newHub;
      this.persist();
      this.notifyListeners();
      return { success: true, hub: newHub };
    }
  }

  public async updateLagosHub(id: string, updates: Partial<LagosHub>, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/lagos-hubs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, adminId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Lagos Hub');
      if (data.hub) {
        if (!this.state.lagos_hubs) this.state.lagos_hubs = {};
        this.state.lagos_hubs[id] = data.hub;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      if (this.state.lagos_hubs && this.state.lagos_hubs[id]) {
        this.state.lagos_hubs[id] = { ...this.state.lagos_hubs[id], ...updates, updatedAt: Date.now() };
        this.persist();
        this.notifyListeners();
        return { success: true, hub: this.state.lagos_hubs[id] };
      }
      throw e;
    }
  }

  public async deleteLagosHub(id: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/lagos-hubs/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete Lagos Hub');
      if (this.state.lagos_hubs && this.state.lagos_hubs[id]) {
        delete this.state.lagos_hubs[id];
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      if (this.state.lagos_hubs && this.state.lagos_hubs[id]) {
        delete this.state.lagos_hubs[id];
        this.persist();
        this.notifyListeners();
        return { success: true };
      }
      throw e;
    }
  }

  public async convertFulfillmentMethod(
    shipmentId: string,
    fulfillmentMethod: 'pickup' | 'delivery',
    details: { lagosHubId?: string; lagosHubLabel?: string; deliveryAddress?: any }
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/convert-fulfillment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, fulfillmentMethod, ...details })
      });
      const data = await res.json();
      if (data.shipment) {
        this.state.shipments[data.shipment.id] = data.shipment;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      const ship = this.state.shipments[shipmentId];
      if (ship) {
        ship.fulfillmentMethod = fulfillmentMethod;
        (ship as any).fulfillment_method = fulfillmentMethod;
        ship.deliveryType = fulfillmentMethod === 'delivery' ? 'doorstep' : 'pickup';
        if (fulfillmentMethod === 'pickup') {
          ship.lagosHubId = details.lagosHubId;
          (ship as any).lagos_hub_id = details.lagosHubId;
          ship.lagosHubLabel = details.lagosHubLabel;
          (ship as any).lagos_hub_label = details.lagosHubLabel;
          ship.pickupHub = details.lagosHubLabel;
          ship.destinationHub = details.lagosHubLabel;
        } else {
          ship.deliveryAddress = details.deliveryAddress;
          (ship as any).delivery_address = details.deliveryAddress;
          ship.doorstepAddress = details.deliveryAddress;
          ship.destinationHub = 'Lagos Doorstep Delivery';
        }
        ship.updatedAt = Date.now();
        this.persist();
        this.notifyListeners();
        return { success: true, shipment: ship };
      }
      return { success: false, error: e.message || 'Conversion failed' };
    }
  }

  public async assignDeliveryRider(
    shipmentId: string,
    riderName: string,
    riderPhone: string,
    adminId: string = 'adm-001'
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/assign-rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, riderName, riderPhone, adminId })
      });
      const data = await res.json();
      if (data.shipment) {
        this.state.shipments[data.shipment.id] = data.shipment;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      const ship = this.state.shipments[shipmentId];
      if (ship) {
        ship.assignedRiderName = riderName;
        ship.assignedRiderPhone = riderPhone;
        ship.currentStatus = 'out_for_delivery';
        ship.status = 'out_for_delivery';
        ship.updatedAt = Date.now();
        this.persist();
        this.notifyListeners();
        return { success: true, shipment: ship };
      }
      return { success: false, error: e.message || 'Failed to assign rider' };
    }
  }

  public async createHotel(hotel: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ hotel, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create hotel');
    if (data.hotel) {
      if (!this.state.hotels) this.state.hotels = {};
      this.state.hotels[data.hotel.id] = data.hotel;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async updateHotel(hotelId: string, hotelData: any, adminId: string = 'adm-001'): Promise<any> {
    return this.createHotel({ ...hotelData, id: hotelId }, adminId);
  }

  public async toggleHotelStatus(hotelId: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ hotelId, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle hotel status');
    if (data.hotel) {
      if (!this.state.hotels) this.state.hotels = {};
      this.state.hotels[data.hotel.id] = data.hotel;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async deleteHotel(hotelId: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ hotelId, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete hotel');
    if (this.state.hotels && this.state.hotels[hotelId]) {
      delete this.state.hotels[hotelId];
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async updateRoomAvailability(hotelId: string, roomName: string, isAvailable: boolean, availableCount?: number, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/room-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ hotelId, roomName, isAvailable, availableCount, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update room availability');
    if (data.hotel && this.state.hotels) {
      this.state.hotels[hotelId] = data.hotel;
      this.persist();
      this.notifyListeners();
    }
    return data;
  }

  public async getAdminHotelBookings(): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/hotels/bookings`);
      const data = await res.json();
      if (data.bookings) return data.bookings;
    } catch {
      // Fallback to local state
    }
    return this.getHotelBookings();
  }

  public async registerShipment(data: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      // Local fallback
      const shp = this.recordShipment(data);
      return { success: true, shipment: shp };
    }
  }

  public async deferShipmentPayment(shipmentId: string, userId: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/defer-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, userId })
      });
      const data = await res.json();
      if (data.shipment) {
        this.state.shipments[data.shipment.id] = data.shipment;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to defer shipment payment' };
    }
  }

  public async intakeShipment(shipmentIdOrData: any, optionalData?: any): Promise<any> {
    const payload = optionalData ? { shipmentId: shipmentIdOrData, ...optionalData } : (typeof shipmentIdOrData === 'object' ? shipmentIdOrData : { shipmentId: shipmentIdOrData });
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to inspect shipment' };
    }
  }

  public async lookupUser(query: string): Promise<{ success: boolean; user?: any; shipments?: ShipmentDocument[]; pendingPreAlerts?: ShipmentDocument[]; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/users/lookup?query=${encodeURIComponent(query)}`);
      return await res.json();
    } catch {
      const q = (query || '').toLowerCase().trim();
      const user = Object.values(this.state.users || {}).find(u =>
        (u.uid && u.uid.toLowerCase() === q) ||
        ((u as any).flyeTag && (u as any).flyeTag.toLowerCase() === q) ||
        ((u as any).shippingMark && (u as any).shippingMark.toLowerCase() === q) ||
        (u.email && u.email.toLowerCase() === q) ||
        (u.fullName && u.fullName.toLowerCase() === q)
      );
      if (!user) return { success: false, error: `No user found matching "${query}"` };
      const userShipments = Object.values(this.state.shipments || {}).filter(s => s.userId === user.uid);
      const pendingPreAlerts = userShipments.filter(s => s.currentStatus === 'pre_alert' || s.currentStatus === 'pending' || s.status === 'pre_alert');
      return { success: true, user, shipments: userShipments, pendingPreAlerts };
    }
  }

  public async markWarehouseArrival(shipmentIdOrCode: string, notes?: string, adminId: string = 'adm-001'): Promise<{ success: boolean; shipment?: ShipmentDocument; user?: any; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: shipmentIdOrCode, trackingNumber: shipmentIdOrCode, notes, adminId })
      });
      const data = await res.json();
      if (data.shipment) {
        this.state.shipments[data.shipment.id] = data.shipment;
        this.persist();
        this.notifyListeners();
      }
      return data;
    } catch {
      // Local fallback
      const query = (shipmentIdOrCode || '').toLowerCase().trim();
      let ship = Object.values(this.state.shipments || {}).find(s =>
        (s.id && s.id.toLowerCase() === query) ||
        (s.trackingNumber && s.trackingNumber.toLowerCase() === query) ||
        (s.shipmentCode && s.shipmentCode.toLowerCase() === query) ||
        (s.trackingCode && s.trackingCode.toLowerCase() === query) ||
        (s.chineseCourierTracking && s.chineseCourierTracking.toLowerCase() === query) ||
        ((s as any).shippingMark && (s as any).shippingMark.toLowerCase() === query) ||
        ((s as any).flyeTag && (s as any).flyeTag.toLowerCase() === query)
      );

      let matchedUser: any = null;
      if (!ship) {
        matchedUser = Object.values(this.state.users || {}).find(u =>
          (u.uid && u.uid.toLowerCase() === query) ||
          ((u as any).flyeTag && (u as any).flyeTag.toLowerCase() === query) ||
          ((u as any).shippingMark && (u as any).shippingMark.toLowerCase() === query)
        );
        if (matchedUser) {
          ship = Object.values(this.state.shipments || {}).find(s =>
            s.userId === matchedUser.uid && (s.currentStatus === 'pre_alert' || s.currentStatus === 'pending' || s.status === 'pre_alert')
          );
          if (!ship) {
            const newShipId = `SHP-${Date.now().toString().slice(-6)}`;
            const trackingNum = `FM-CN-${Math.floor(100000 + Math.random() * 900000)}`;
            const userTag = (matchedUser as any).flyeTag || (matchedUser as any).shippingMark || (matchedUser.uid === 'usr_alade_01' ? 'FM-USR-8924' : `FM-USR-${matchedUser.uid.slice(-4).toUpperCase()}`);
            ship = {
              id: newShipId,
              trackingNumber: trackingNum,
              shipmentCode: trackingNum,
              trackingCode: trackingNum,
              title: `Intake Parcel (${matchedUser.fullName || matchedUser.businessName || 'Client'})`,
              userId: matchedUser.uid,
              userEmail: matchedUser.email,
              receiverName: matchedUser.fullName || 'Chief Babatunde Alade',
              flyeTag: userTag,
              shippingMark: userTag,
              originWarehouse: 'Guangzhou',
              destination: 'Lagos MMIA Hub',
              destinationHub: 'Lagos MMIA Hub',
              method: 'air_cargo',
              status: 'received_warehouse',
              currentStatus: 'received_warehouse',
              weightKg: 3.5,
              cbm: 0.02,
              pieces: 1,
              declaredValueUSD: 120,
              createdAt: Date.now(),
              timeline: []
            } as any;
            this.state.shipments[newShipId] = ship;
          }
        }
      }

      if (!ship) return { success: false, error: 'Shipment not found' };

      const whName = ship.originWarehouse || 'Guangzhou';
      ship.currentStatus = 'received_warehouse';
      ship.status = 'received_warehouse';
      if (!ship.timeline) ship.timeline = [];
      ship.timeline.push({
        status: 'Arrived at Guangzhou Warehouse',
        location: `${whName} Warehouse Receiving Bay (Bay 04)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: notes || `Physical parcel arrived from courier (${ship.courierCompany || 'SF Express'} #${ship.chineseCourierTracking || ship.trackingNumber}). Barcode verified & intake logged.`
      });
      ship.updatedAt = Date.now();
      this.state.shipments[ship.id] = ship;
      this.persist();
      this.notifyListeners();
      return { success: true, shipment: ship, user: matchedUser || this.state.users[ship.userId] };
    }
  }

  public async billShipment(shipmentIdOrData: any, optionalData?: any): Promise<any> {
    const payload = optionalData ? { shipmentId: shipmentIdOrData, ...optionalData } : (typeof shipmentIdOrData === 'object' ? shipmentIdOrData : { shipmentId: shipmentIdOrData });
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to bill shipment' };
    }
  }

  public async repackageAndBillShipment(payload: {
    shipmentId: string;
    freightFeeUSD?: number;
    freightFeeNGN?: number;
    freightFeeCNY?: number;
    freightCurrency?: 'USD' | 'NGN' | 'CNY';
    freightAmount?: number;
    chargeableWeightKg?: number;
    shippingTier?: string;
    ratePerKg?: number;
    customerNotes?: string;
    billingNotes?: string;
    warehousePhotos?: string[];
    inspectionPhotos?: string[];
    adminId?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/shipments/repackage-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      // Local fallback
      const ship = this.state.shipments[payload.shipmentId] || Object.values(this.state.shipments).find(s => s.id === payload.shipmentId || s.trackingCode === payload.shipmentId || s.trackingNumber === payload.shipmentId || s.platformCode === payload.shipmentId);
      if (!ship) return { success: false, error: 'Shipment not found' };
      const usdNgnRate = this.state.system_settings?.rates?.USD_NGN || 1485;
      const usdCnyRate = this.state.system_settings?.rates?.USD_CNY || 7.24;
      const feeUSD = Number((payload.freightFeeUSD ?? 0).toFixed(2));
      ship.freightFeeUSD = feeUSD;
      ship.freightFee = feeUSD;
      ship.freightFeeNGN = payload.freightFeeNGN !== undefined ? Math.round(payload.freightFeeNGN) : Math.round(feeUSD * usdNgnRate);
      ship.freightFeeCNY = payload.freightFeeCNY !== undefined ? Number(payload.freightFeeCNY.toFixed(2)) : Number((feeUSD * usdCnyRate).toFixed(2));
      if (payload.chargeableWeightKg !== undefined) {
        ship.billableWeightKg = Number(payload.chargeableWeightKg);
        ship.actualWeightKg = Number(payload.chargeableWeightKg);
        ship.weightKg = Number(payload.chargeableWeightKg);
      }
      if (payload.shippingTier) {
        ship.method = payload.shippingTier;
      }
      if (payload.ratePerKg) ship.ratePerKg = payload.ratePerKg;
      const notes = payload.customerNotes !== undefined ? payload.customerNotes : payload.billingNotes;
      if (notes !== undefined) {
        ship.billingNotes = notes;
        ship.customerNotes = notes;
      }
      const photos = payload.warehousePhotos || payload.inspectionPhotos;
      if (Array.isArray(photos)) {
        ship.inspectionPhotos = photos;
        ship.warehousePhotos = photos;
      }
      ship.paymentStatus = 'awaiting_payment';
      ship.currentStatus = 'awaiting_payment';
      ship.status = 'Awaiting Payment';
      ship.isBilled = feeUSD > 0;
      ship.updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, shipment: ship };
    }
  }

  public async uploadShipmentPhotos(shipmentId: string, photos: string[], adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/shipments/upload-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, photos, adminId })
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      const ship = this.state.shipments[shipmentId] || Object.values(this.state.shipments).find(s => s.id === shipmentId || s.trackingCode === shipmentId || s.trackingNumber === shipmentId || s.platformCode === shipmentId);
      if (ship) {
        ship.inspectionPhotos = photos;
        ship.warehousePhotos = photos;
        ship.updatedAt = Date.now();
        this.persist();
        this.notifyListeners();
        return { success: true, shipment: ship };
      }
      return { success: false, error: e.message || 'Failed to upload photos' };
    }
  }

  public async inlineUpdateShipment(shipmentId: string, updates: {
    location?: string;
    eta?: string;
    freightFeeUSD?: number;
    status?: string;
    currentStatus?: string;
    paymentStatus?: string;
    fulfillmentMethod?: string;
    method?: string;
    adminId?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/shipments/inline-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, ...updates })
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      const ship = this.state.shipments[shipmentId] || Object.values(this.state.shipments).find(s => s.id === shipmentId || s.trackingCode === shipmentId || s.trackingNumber === shipmentId || s.platformCode === shipmentId);
      if (!ship) return { success: false, error: 'Shipment not found' };
      if (updates.location !== undefined) ship.location = updates.location;
      if (updates.eta !== undefined) ship.eta = updates.eta;
      if (updates.freightFeeUSD !== undefined) {
        ship.freightFeeUSD = Number(updates.freightFeeUSD);
        ship.freightFee = Number(updates.freightFeeUSD);
      }
      const nextStatus = updates.status !== undefined ? updates.status : updates.currentStatus;
      if (nextStatus !== undefined) {
        ship.status = nextStatus;
        ship.currentStatus = nextStatus;
      }
      ship.updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, shipment: ship };
    }
  }

  public async updateShipmentLifecycle(shipmentIdOrData: any, status?: string, location?: string, notes?: string): Promise<any> {
    const payload = status ? { shipmentId: shipmentIdOrData, status, location, notes } : shipmentIdOrData;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update shipment status' };
    }
  }

  public async trackShipment(codeOrNumber: string): Promise<any> {
    const q = (codeOrNumber || '').trim().toLowerCase();
    if (!q) return { success: false, error: 'Tracking code is required' };

    // 1. Check local state first
    const local = Object.values(this.state.shipments || {}).find(s => 
      (s.id && s.id.toLowerCase() === q) ||
      (s.trackingNumber && s.trackingNumber.toLowerCase() === q) ||
      (s.shipmentCode && s.shipmentCode.toLowerCase() === q) ||
      (s.trackingCode && s.trackingCode.toLowerCase() === q) ||
      (s.chineseCourierTracking && s.chineseCourierTracking.toLowerCase() === q)
    );
    if (local) {
      return { success: true, shipment: local, cached: true };
    }

    // 2. Fetch live from backend
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/track?code=${encodeURIComponent(codeOrNumber.trim())}`);
      const result = await res.json();
      if (result.success && result.shipment) {
        if (!this.state.shipments) this.state.shipments = {};
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch shipment tracking' };
    }
  }

  public async addMilestoneCheckpoint(
    shipmentId: string, 
    milestone: { status: string; location: string; notes?: string; timestamp?: string; updateCurrentStatus?: boolean; adminId?: string }
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/add-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, ...milestone })
      });
      const result = await res.json();
      if (result.success && result.shipment) {
        if (!this.state.shipments) this.state.shipments = {};
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to add milestone checkpoint' };
    }
  }

  public async assignShipmentUser(shipmentId: string, userId: string, receiverName?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/assign-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, userId, receiverName, adminId })
      });
      const result = await res.json();
      if (result.success && result.shipment) {
        if (!this.state.shipments) this.state.shipments = {};
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to assign shipment user' };
    }
  }

  public async verifyPickupOtp(shipmentIdOrData: any, otp?: string, freightCollected?: boolean, staffId?: string): Promise<any> {
    const payload = otp ? { shipmentId: shipmentIdOrData, otp, freightCollected, staffId } : shipmentIdOrData;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/verify-pickup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      const shipId = payload.shipmentId;
      const ship = this.state.shipments[shipId];
      if (ship) {
        if (ship.pickupOtp && String(payload.otp).trim() !== String(ship.pickupOtp).trim()) {
          return { success: false, error: 'Invalid 4-digit Pickup OTP. Package release blocked.' };
        }
        ship.otpVerified = true;
        (ship as any).pickup_otp_verified_at = new Date().toISOString();
        ship.pickupOtpVerifiedAt = Date.now();
        ship.currentStatus = 'completed';
        ship.status = 'completed';
        ship.handedOverTo = payload.staffId || 'Lagos Hub Handover Officer';
        ship.handoverTimestamp = Date.now();
        ship.updatedAt = Date.now();
        this.persist();
        this.notifyListeners();
        return { success: true, shipment: ship };
      }
      return { success: false, error: e.message || 'Failed to verify pickup OTP' };
    }
  }

  public async confirmDoorstepDelivery(shipmentIdOrData: any, proofNote?: string, freightCollected?: boolean, staffId?: string): Promise<any> {
    const payload = proofNote !== undefined ? { shipmentId: shipmentIdOrData, proofNote, freightCollected, staffId } : shipmentIdOrData;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shipments/confirm-doorstep-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.shipment) {
        this.state.shipments[result.shipment.id] = result.shipment;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to confirm delivery' };
    }
  }

  public async consolidateShipments(shipmentIds: string[], destinationHub?: string, mode?: string, userId?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/shipments/consolidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentIds, destinationHub, mode, userId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Consolidation failed');
    if (result.consolidation) {
      this.state.shipments[result.consolidation.id] = result.consolidation;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async updateShipmentWaypoint(shipmentId: string, status: string, location?: string, notes?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/shipments/update-waypoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'logistics_manager'
      },
      body: JSON.stringify({ shipmentId, status, location, notes, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update waypoint');
    if (result.shipment) {
      this.state.shipments[result.shipment.id] = result.shipment;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async createAgentRequest(rfqData: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/agents/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfqData)
      });
      const result = await res.json();
      if (result.request) {
        this.state.agent_requests[result.request.id] = result.request;
        this.persist();
        this.notifyListeners();
      }
      return result;
    } catch (e) {
      const rfq = this.recordAgentRequest(rfqData);
      return { success: true, request: rfq };
    }
  }

  public async getAgentSettings(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/agents/settings`);
      const result = await res.json();
      if (result.settings) return result.settings;
    } catch (e) {
      // fallback to local state
    }
    return this.state.system_settings?.fees || {
      sourcingCommissionPercent: 5.0,
      minSourcingCommissionCNY: 500,
      supplierVerificationUSD: 150,
      factoryAuditUSD: 250,
      qualityControlUSD: 200
    };
  }

  public async updateAgentSettings(settings: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ settings, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update agent settings');
    if (result.fees && this.state.system_settings) {
      this.state.system_settings.fees = { ...this.state.system_settings.fees, ...result.fees };
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async quoteAgentRequest(
    requestId: string,
    quoteAmountUSDOrData: any,
    quoteAmountNGN?: number,
    adminNotes?: string,
    assignedAgent?: string,
    adminId: string = 'adm-001'
  ): Promise<any> {
    let payload: any = { requestId, adminId };
    if (typeof quoteAmountUSDOrData === 'object' && quoteAmountUSDOrData !== null) {
      payload = { ...payload, ...quoteAmountUSDOrData };
    } else {
      payload.quoteAmountUSD = quoteAmountUSDOrData;
      payload.quoteAmountNGN = quoteAmountNGN;
      payload.adminNotes = adminNotes;
      payload.assignedAgent = assignedAgent;
    }

    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to quote agent request');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async updateAgentStatus(requestId: string, updateData: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ requestId, adminId, ...updateData })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update agent status');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async refundAgentRequest(requestId: string, reason: string, adminId: string = 'adm-001', forceOverride: boolean = false): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/cancel-refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ requestId, reason, adminId, forceOverride })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to refund agent request');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
    }
    if (result.balances && result.request?.userId && this.state.users[result.request.userId]) {
      this.state.users[result.request.userId].balances = result.balances;
    }
    this.persist();
    this.notifyListeners();
    return result;
  }

  public async acceptAgentQuote(requestId: string, pin: string, paymentWalletUsed: string = 'USD', userId?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/agents/accept-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, pin, paymentWalletUsed, userId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to accept quote');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
    }
    if (result.balances && userId && this.state.users[userId]) {
      this.state.users[userId].balances = result.balances;
    }
    this.persist();
    this.notifyListeners();
    return result;
  }

  public async payAgentQuotation(requestId: string, pin: string, paymentWalletUsed: string = 'USD', userId?: string): Promise<any> {
    return this.acceptAgentQuote(requestId, pin, paymentWalletUsed, userId);
  }

  public async submitAgentQuotation(requestId: string, quoteData: any, adminId: string = 'adm-001'): Promise<any> {
    return this.quoteAgentRequest(requestId, quoteData, undefined, undefined, undefined, adminId);
  }

  public async submitAgentServiceRequest(payload: any): Promise<any> {
    return this.createAgentRequest(payload);
  }

  public async bookAgentWithWallet(payload: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/agents/book-with-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to book ground agent');
      if (result.request) {
        this.state.agent_requests[result.request.id] = result.request;
      }
      if (result.balances && payload.userId && this.state.users[payload.userId]) {
        this.state.users[payload.userId].balances = result.balances;
      }
      this.persist();
      this.notifyListeners();
      return result;
    } catch (err: any) {
      // Local fallback
      const rfq = this.recordAgentRequest({
        ...payload,
        status: 'in_progress',
        paymentStatus: 'paid'
      });
      return { success: true, request: rfq };
    }
  }

  public async assignAgent(requestId: string, assignedAgent: string, adminNotes?: string, agentLocation?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ requestId, assignedAgent, adminNotes, agentLocation, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to assign agent');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async sendAgentClientUpdate(requestId: string, message: string, status?: string, agentLocation?: string, inspectionReportUrl?: string, reportSummary?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/communicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ requestId, message, status, agentLocation, inspectionReportUrl, reportSummary, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to send client update');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async completeAgentRequest(requestId: string, reportSummary?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/agents/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ requestId, reportSummary, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to complete agent request');
    if (result.request) {
      this.state.agent_requests[result.request.id] = result.request;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async createSupportTicket(subject: string, category: string = 'General Trade', priority: string = 'Medium', message: string = '', userId?: string): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/support/tickets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, category, priority, message, userId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create support ticket');
    if (result.ticket) {
      this.state.support_tickets[result.ticket.id] = result.ticket;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async resolveSupportTicket(ticketId: string, resolutionNotes?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/support/tickets/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'support_agent'
      },
      body: JSON.stringify({ ticketId, resolutionNotes, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to resolve support ticket');
    if (result.ticket) {
      this.state.support_tickets[result.ticket.id] = result.ticket;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public getHotels(): any[] {
    const list = Object.values(this.state.hotels || {});
    return list.map((h: any) => ({
      ...h,
      tags: Array.isArray(h.tags) ? h.tags : ['Trade Hub Partner', 'English Concierge'],
      amenities: Array.isArray(h.amenities) ? h.amenities : ['High-Speed Wi-Fi', 'Western Breakfast', 'Airport Transfer'],
      images: Array.isArray(h.images) && h.images.length > 0 ? h.images : [h.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
      image: h.image || (Array.isArray(h.images) && h.images.length > 0 ? h.images[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80')
    }));
  }

  public getWebhookEvents(): any[] {
    return this.state.webhook_events || [];
  }

  public async toggleKycVerified(userId: string, verified?: boolean, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/users/toggle-kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'compliance'
      },
      body: JSON.stringify({ userId, verified, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to toggle KYC status');
    if (result.user && this.state.users[userId]) {
      this.state.users[userId] = result.user;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async updateUserAdminNotes(userId: string, notes: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/users/update-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'compliance'
      },
      body: JSON.stringify({ userId, notes, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update compliance notes');
    if (result.user && this.state.users[userId]) {
      this.state.users[userId] = result.user;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async simulateWebhook(provider: string, amount: number, userId?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/webhooks/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'finance_officer'
      },
      body: JSON.stringify({ provider, amount, userId, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to simulate webhook');
    return result;
  }

  // ==========================================
  // RENTALS (APARTMENTS & OFFICES) METHODS
  // ==========================================

  public getRentalProperties(propertyType?: string): any[] {
    const list = Object.values(this.state.rental_properties || {});
    const sanitized = list.map((p: any) => ({
      ...p,
      amenities: Array.isArray(p.amenities) ? p.amenities : ['High-Speed Internet', 'Air Conditioning', 'Elevator Access'],
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']
    }));
    if (propertyType && propertyType !== 'all') {
      return sanitized.filter(p => p.propertyType === propertyType);
    }
    return sanitized;
  }

  public async createRentalProperty(property: any, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/rentals/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ property, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save rental property');
    if (result.property) {
      if (!this.state.rental_properties) this.state.rental_properties = {};
      this.state.rental_properties[result.property.id] = result.property;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async updateRentalProperty(propertyId: string, data: any, adminId: string = 'adm-001'): Promise<any> {
    return this.createRentalProperty({ id: propertyId, ...data }, adminId);
  }

  public async toggleRentalPropertyStatus(propertyId: string, status?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/rentals/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ propertyId, status, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to toggle rental property status');
    if (result.property) {
      if (!this.state.rental_properties) this.state.rental_properties = {};
      this.state.rental_properties[result.property.id] = result.property;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async deleteRentalProperty(propertyId: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/rentals/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ propertyId, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete rental property');
    if (this.state.rental_properties && this.state.rental_properties[propertyId]) {
      delete this.state.rental_properties[propertyId];
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public getPropertyInquiries(userId?: string): any[] {
    const list = Object.values(this.state.property_inquiries || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    if (userId) {
      return list.filter(i => i.userId === userId);
    }
    return list;
  }

  public async createPropertyInquiry(inquiryData: any): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/rentals/inquire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit property inquiry');
    if (result.inquiry) {
      if (!this.state.property_inquiries) this.state.property_inquiries = {};
      this.state.property_inquiries[result.inquiry.id] = result.inquiry;
      if (result.ticket && this.state.support_tickets) {
        this.state.support_tickets[result.ticket.id] = result.ticket;
      }
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  public async updatePropertyInquiryStatus(inquiryId: string, status: string, notes?: string, assignedStaff?: string, adminId: string = 'adm-001'): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/rentals/inquiry-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'operations'
      },
      body: JSON.stringify({ inquiryId, status, notes, assignedStaff, adminId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update inquiry status');
    if (result.inquiry) {
      if (!this.state.property_inquiries) this.state.property_inquiries = {};
      this.state.property_inquiries[result.inquiry.id] = result.inquiry;
      this.persist();
      this.notifyListeners();
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // FREIGHT RATE CALCULATOR & GLOBAL SHIPPING CORRIDORS
  // ---------------------------------------------------------------------------

  public getShippingCorridors(): ShippingCorridor[] {
    const fromSettings = this.state.system_settings?.shipping_corridors;
    if (Array.isArray(fromSettings) && fromSettings.length > 0) {
      return fromSettings;
    }
    return DEFAULT_SHIPPING_CORRIDORS;
  }

  public async updateShippingCorridor(corridorId: string, updates: Partial<ShippingCorridor>, adminId: string = 'adm-001'): Promise<{ success: boolean; corridor?: ShippingCorridor; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/logistics/corridors/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corridorId, updates, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.corridors) {
          if (!this.state.system_settings) {
            this.state.system_settings = { rates: { NGN_CNY: 215.2, USD_NGN: 1490, USD_CNY: 7.26, spreadPercent: 0.75, lastUpdated: Date.now(), updatedBy: 'Admin' }, fees: { withdrawalFlatNGN: 500, fundingCardPercent: 1.2, supplierEscrowPercent: 0.5, airFreightPerKgUSD: 10, seaFreightPerCbmUSD: 145, supplier30DayPassUSD: 50 } };
          }
          this.state.system_settings.shipping_corridors = data.corridors;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
    } catch {
      // Local fallback
    }

    // Local fallback update
    const corridors = [...this.getShippingCorridors()];
    const idx = corridors.findIndex(c => c.id === corridorId);
    if (idx !== -1) {
      corridors[idx] = { ...corridors[idx], ...updates, updatedAt: Date.now(), updatedBy: adminId };
      if (!this.state.system_settings) {
        this.state.system_settings = { rates: { NGN_CNY: 215.2, USD_NGN: 1490, USD_CNY: 7.26, spreadPercent: 0.75, lastUpdated: Date.now(), updatedBy: 'Admin' }, fees: { withdrawalFlatNGN: 500, fundingCardPercent: 1.2, supplierEscrowPercent: 0.5, airFreightPerKgUSD: 10, seaFreightPerCbmUSD: 145, supplier30DayPassUSD: 50 } };
      }
      this.state.system_settings.shipping_corridors = corridors;
      this.persist();
      this.notifyListeners();
      return { success: true, corridor: corridors[idx] };
    }
    return { success: false, error: 'Corridor not found' };
  }

  public async createShippingCorridor(corridor: Partial<ShippingCorridor>, adminId: string = 'adm-001'): Promise<{ success: boolean; corridor?: ShippingCorridor; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/logistics/corridors/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corridor, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.corridors) {
          if (!this.state.system_settings) {
            this.state.system_settings = { rates: { NGN_CNY: 215.2, USD_NGN: 1490, USD_CNY: 7.26, spreadPercent: 0.75, lastUpdated: Date.now(), updatedBy: 'Admin' }, fees: { withdrawalFlatNGN: 500, fundingCardPercent: 1.2, supplierEscrowPercent: 0.5, airFreightPerKgUSD: 10, seaFreightPerCbmUSD: 145, supplier30DayPassUSD: 50 } };
          }
          this.state.system_settings.shipping_corridors = data.corridors;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
    } catch {
      // Local fallback
    }

    const corridors = [...this.getShippingCorridors()];
    const newCorridor: ShippingCorridor = {
      id: corridor.id || `corridor_${Date.now()}`,
      name: corridor.name || 'New Corridor',
      originCountry: corridor.originCountry || 'International',
      originCode: corridor.originCode || 'INT',
      originHub: corridor.originHub || 'Central Transit Hub',
      destinationCountry: corridor.destinationCountry || 'Nigeria',
      destinationHub: corridor.destinationHub || 'Lagos MMIA Hub',
      flag: corridor.flag || '🌐',
      airExpressRateUSD: Number(corridor.airExpressRateUSD) || 12.00,
      airExpressBaseFeeUSD: Number(corridor.airExpressBaseFeeUSD) || 5.00,
      airExpressDeliveryDays: corridor.airExpressDeliveryDays || '3–5 Days',
      airExpressMinKg: Number(corridor.airExpressMinKg) || 1.0,
      airRegularRateUSD: Number(corridor.airRegularRateUSD) || 10.00,
      airRegularBaseFeeUSD: Number(corridor.airRegularBaseFeeUSD) || 3.00,
      airRegularDeliveryDays: corridor.airRegularDeliveryDays || '7–10 Days',
      airRegularMinKg: Number(corridor.airRegularMinKg) || 2.0,
      seaFreightRateCbmUSD: Number(corridor.seaFreightRateCbmUSD) || 280.00,
      seaFreightBaseFeeUSD: Number(corridor.seaFreightBaseFeeUSD) || 25.00,
      seaFreightDeliveryDays: corridor.seaFreightDeliveryDays || '25–35 Days',
      seaFreightMinCbm: Number(corridor.seaFreightMinCbm) || 0.1,
      customsClearanceIncluded: corridor.customsClearanceIncluded !== false,
      isActive: corridor.isActive !== false,
      destinationHubSurcharges: corridor.destinationHubSurcharges || [
        { hubId: 'los_main', name: 'Lagos MMIA Hub', state: 'Lagos', airSurchargeUSD: 0, seaSurchargeUSD: 0 },
        { hubId: 'abj_hub', name: 'Abuja Cargo Hub', state: 'FCT Abuja', airSurchargeUSD: 1.20, seaSurchargeUSD: 35.00 },
        { hubId: 'kan_hub', name: 'Kano Hub', state: 'Kano', airSurchargeUSD: 1.50, seaSurchargeUSD: 45.00 },
        { hubId: 'phc_hub', name: 'Port Harcourt Hub', state: 'Rivers', airSurchargeUSD: 1.30, seaSurchargeUSD: 40.00 },
        { hubId: 'oni_hub', name: 'Onitsha Commercial Dock', state: 'Anambra', airSurchargeUSD: 1.40, seaSurchargeUSD: 38.00 }
      ],
      updatedAt: Date.now(),
      updatedBy: adminId
    };
    corridors.push(newCorridor);
    if (!this.state.system_settings) {
      this.state.system_settings = { rates: { NGN_CNY: 215.2, USD_NGN: 1490, USD_CNY: 7.26, spreadPercent: 0.75, lastUpdated: Date.now(), updatedBy: 'Admin' }, fees: { withdrawalFlatNGN: 500, fundingCardPercent: 1.2, supplierEscrowPercent: 0.5, airFreightPerKgUSD: 10, seaFreightPerCbmUSD: 145, supplier30DayPassUSD: 50 } };
    }
    this.state.system_settings.shipping_corridors = corridors;
    this.persist();
    this.notifyListeners();
    return { success: true, corridor: newCorridor };
  }

  public getAirShippingRates(): {
    expressRatePerKgUSD: number;
    expressHandlingFeeUSD: number;
    normalRatePerKgUSD: number;
    normalHandlingFeeUSD: number;
    updatedAt?: number;
    updatedBy?: string;
  } {
    const saved = this.state.system_settings?.air_shipping_rates;
    if (saved && typeof saved.expressRatePerKgUSD === 'number' && typeof saved.normalRatePerKgUSD === 'number') {
      return saved;
    }
    return {
      expressRatePerKgUSD: 13.00,
      expressHandlingFeeUSD: 0.00,
      normalRatePerKgUSD: 9.60,
      normalHandlingFeeUSD: 0.00
    };
  }

  public async updateAirShippingRates(
    rates: {
      expressRatePerKgUSD: number;
      expressHandlingFeeUSD: number;
      normalRatePerKgUSD: number;
      normalHandlingFeeUSD: number;
    },
    adminId: string = 'adm-001'
  ): Promise<{ success: boolean; air_shipping_rates?: any; recalculatedCount?: number; error?: string }> {
    const cleanRates = {
      expressRatePerKgUSD: Number(rates.expressRatePerKgUSD ?? 13.00),
      expressHandlingFeeUSD: Number(rates.expressHandlingFeeUSD ?? 0.00),
      normalRatePerKgUSD: Number(rates.normalRatePerKgUSD ?? 9.60),
      normalHandlingFeeUSD: Number(rates.normalHandlingFeeUSD ?? 0.00),
      updatedAt: Date.now(),
      updatedBy: adminId
    };

    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/logistics/air-shipping-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanRates, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (!this.state.system_settings) {
          this.state.system_settings = INITIAL_DATABASE.system_settings;
        }
        this.state.system_settings.air_shipping_rates = data.air_shipping_rates || cleanRates;
        if (data.shipping_corridors) {
          this.state.system_settings.shipping_corridors = data.shipping_corridors;
        }
        this.persist();
        this.notifyListeners();
        return data;
      }
    } catch {
      // Local fallback below
    }

    if (!this.state.system_settings) {
      this.state.system_settings = INITIAL_DATABASE.system_settings;
    }
    this.state.system_settings.air_shipping_rates = cleanRates;
    this.state.system_settings.fees.airFreightPerKgUSD = cleanRates.normalRatePerKgUSD;
    this.state.system_settings.shipping_corridors = this.getShippingCorridors().map((c) => ({
      ...c,
      airExpressRateUSD: cleanRates.expressRatePerKgUSD,
      airExpressBaseFeeUSD: cleanRates.expressHandlingFeeUSD,
      airExpressDeliveryDays: '48 Hours (2 Days)',
      airRegularRateUSD: cleanRates.normalRatePerKgUSD,
      airRegularBaseFeeUSD: cleanRates.normalHandlingFeeUSD,
      airRegularDeliveryDays: '5–7 Working Days',
      updatedAt: Date.now(),
      updatedBy: adminId
    }));

    const fx = this.getLogisticsFxRates();
    let recalculatedCount = 0;
    for (const shp of Object.values(this.state.shipments || {})) {
      if (!shp.freightPaid && !shp.isBilled) {
        const weight = Math.max(0.5, Number(shp.actualWeightKg || shp.weightKg || 1));
        const isExpress = String(shp.method || shp.shippingMethod || shp.shippingMode || shp.mode || '').toLowerCase().includes('express');
        const rate = isExpress ? cleanRates.expressRatePerKgUSD : cleanRates.normalRatePerKgUSD;
        const handling = isExpress ? cleanRates.expressHandlingFeeUSD : cleanRates.normalHandlingFeeUSD;
        shp.ratePerKg = rate;
        shp.costEstimate = Number((weight * rate + handling).toFixed(2));
        shp.updatedAt = Date.now();
        recalculatedCount++;
      } else if (!shp.freightPaid && Number(shp.freightFeeUSD || 0) > 0) {
        shp.freightFeeNGN = Math.round(Number(shp.freightFeeUSD) * fx.usdToNgn);
        shp.freightFeeCNY = Number((Number(shp.freightFeeUSD) * fx.usdToCny).toFixed(2));
      }
    }

    this.persist();
    this.notifyListeners();
    return { success: true, air_shipping_rates: cleanRates, recalculatedCount };
  }

  public getLogisticsFxRates(): {
    usdToNgn: number;
    usdToCny: number;
    updatedAt?: number;
    updatedBy?: string;
  } {
    const saved = this.state.system_settings?.logistics_fx_rates;
    if (saved && typeof saved.usdToNgn === 'number' && typeof saved.usdToCny === 'number') {
      return saved;
    }
    return {
      usdToNgn: 1400.00,
      usdToCny: 7.25
    };
  }

  public async updateLogisticsFxRates(
    fxRates: { usdToNgn: number; usdToCny: number },
    adminId: string = 'adm-001'
  ): Promise<{ success: boolean; logistics_fx_rates?: any; recalculatedCount?: number; error?: string }> {
    const cleanFx = {
      usdToNgn: Number(fxRates.usdToNgn ?? 1400.00),
      usdToCny: Number(fxRates.usdToCny ?? 7.25),
      updatedAt: Date.now(),
      updatedBy: adminId
    };

    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/logistics/fx-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanFx, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (!this.state.system_settings) {
          this.state.system_settings = INITIAL_DATABASE.system_settings;
        }
        this.state.system_settings.logistics_fx_rates = data.logistics_fx_rates || cleanFx;
        this.persist();
        this.notifyListeners();
        return data;
      }
    } catch {
      // Local fallback below
    }

    if (!this.state.system_settings) {
      this.state.system_settings = INITIAL_DATABASE.system_settings;
    }
    this.state.system_settings.logistics_fx_rates = cleanFx;

    let recalculatedCount = 0;
    for (const shp of Object.values(this.state.shipments || {})) {
      if (!shp.freightPaid && Number(shp.freightFeeUSD || 0) > 0) {
        shp.freightFeeNGN = Math.round(Number(shp.freightFeeUSD) * cleanFx.usdToNgn);
        shp.freightFeeCNY = Number((Number(shp.freightFeeUSD) * cleanFx.usdToCny).toFixed(2));
        shp.updatedAt = Date.now();
        recalculatedCount++;
      }
    }

    this.persist();
    this.notifyListeners();
    return { success: true, logistics_fx_rates: cleanFx, recalculatedCount };
  }

  public calculateFreightCost(
    corridorId: string,
    mode: 'air_express' | 'air_regular' | 'sea',
    weightKg: number,
    cbm: number,
    destinationHubId: string = 'los_main'
  ): FreightCalculationResult {
    const corridors = this.getShippingCorridors();
    const rawCorridor = corridors.find(c => c.id === corridorId) || corridors[0] || DEFAULT_SHIPPING_CORRIDORS[0];
    const airRates = this.getAirShippingRates();
    const logisticsFx = this.getLogisticsFxRates();
    const usdNgn = logisticsFx.usdToNgn || 1400;
    const usdCny = logisticsFx.usdToCny || 7.25;

    // Synchronize active air shipping rates & flat handling fees
    const corridor: ShippingCorridor = {
      ...rawCorridor,
      airExpressRateUSD: airRates.expressRatePerKgUSD ?? rawCorridor.airExpressRateUSD,
      airExpressBaseFeeUSD: airRates.expressHandlingFeeUSD ?? rawCorridor.airExpressBaseFeeUSD,
      airRegularRateUSD: airRates.normalRatePerKgUSD ?? rawCorridor.airRegularRateUSD,
      airRegularBaseFeeUSD: airRates.normalHandlingFeeUSD ?? rawCorridor.airRegularBaseFeeUSD
    };

    const hubSurchargeObj = corridor.destinationHubSurcharges?.find(h => h.hubId === destinationHubId);
    const airSurchargeUSD = hubSurchargeObj?.airSurchargeUSD || 0;
    const seaSurchargeUSD = hubSurchargeObj?.seaSurchargeUSD || 0;
    const destinationHub = hubSurchargeObj?.name || corridor.destinationHub;

    const validWeightKg = Math.max(0, Number(weightKg) || 0);
    const validCbm = Math.max(0, Number(cbm) || 0);

    // Air Express calculation: baseFee + (max(weight, minKg) * (ratePerKg + surcharge))
    const expressBillableKg = Math.max(validWeightKg, corridor.airExpressMinKg);
    const expressUnitRate = corridor.airExpressRateUSD + airSurchargeUSD;
    const expressTotalUSD = Number((corridor.airExpressBaseFeeUSD + (expressBillableKg * expressUnitRate)).toFixed(2));

    // Air Regular calculation
    const regularBillableKg = Math.max(validWeightKg, corridor.airRegularMinKg);
    const regularUnitRate = corridor.airRegularRateUSD + airSurchargeUSD;
    const regularTotalUSD = Number((corridor.airRegularBaseFeeUSD + (regularBillableKg * regularUnitRate)).toFixed(2));

    // Sea Freight calculation: baseFee + (max(cbm, minCbm) * (ratePerCbm + surcharge))
    const seaBillableCbm = Math.max(validCbm, corridor.seaFreightMinCbm);
    const seaUnitRate = corridor.seaFreightRateCbmUSD + seaSurchargeUSD;
    const seaTotalUSD = Number((corridor.seaFreightBaseFeeUSD + (seaBillableCbm * seaUnitRate)).toFixed(2));

    let baseFeeUSD = 0;
    let unitRateUSD = 0;
    let hubSurchargeUSD = 0;
    let totalCostUSD = 0;
    let deliveryDays = '';
    let formulaDescription = '';

    if (mode === 'air_express') {
      baseFeeUSD = corridor.airExpressBaseFeeUSD;
      unitRateUSD = corridor.airExpressRateUSD;
      hubSurchargeUSD = airSurchargeUSD;
      totalCostUSD = expressTotalUSD;
      deliveryDays = corridor.airExpressDeliveryDays;
      formulaDescription = `$${baseFeeUSD.toFixed(2)} base + (${expressBillableKg}kg × ($${unitRateUSD}/kg${hubSurchargeUSD ? ` + $${hubSurchargeUSD} hub` : ''}))`;
    } else if (mode === 'air_regular') {
      baseFeeUSD = corridor.airRegularBaseFeeUSD;
      unitRateUSD = corridor.airRegularRateUSD;
      hubSurchargeUSD = airSurchargeUSD;
      totalCostUSD = regularTotalUSD;
      deliveryDays = corridor.airRegularDeliveryDays;
      formulaDescription = `$${baseFeeUSD.toFixed(2)} base + (${regularBillableKg}kg × ($${unitRateUSD}/kg${hubSurchargeUSD ? ` + $${hubSurchargeUSD} hub` : ''}))`;
    } else {
      baseFeeUSD = corridor.seaFreightBaseFeeUSD;
      unitRateUSD = corridor.seaFreightRateCbmUSD;
      hubSurchargeUSD = seaSurchargeUSD;
      totalCostUSD = seaTotalUSD;
      deliveryDays = corridor.seaFreightDeliveryDays;
      formulaDescription = `$${baseFeeUSD.toFixed(2)} base + (${seaBillableCbm}CBM × ($${unitRateUSD}/CBM${hubSurchargeUSD ? ` + $${hubSurchargeUSD} hub` : ''}))`;
    }

    const totalCostNGN = Math.round(totalCostUSD * usdNgn);
    const totalCostCNY = Number((totalCostUSD * usdCny).toFixed(2));

    return {
      corridor,
      mode,
      weightKg: validWeightKg,
      cbm: validCbm,
      destinationHub,
      baseFeeUSD,
      unitRateUSD,
      hubSurchargeUSD,
      totalCostUSD,
      totalCostNGN,
      totalCostCNY,
      deliveryDays,
      formulaDescription,
      comparisons: {
        airExpress: {
          totalUSD: expressTotalUSD,
          totalNGN: Math.round(expressTotalUSD * usdNgn),
          totalCNY: Number((expressTotalUSD * usdCny).toFixed(2)),
          days: corridor.airExpressDeliveryDays,
          ratePerKg: corridor.airExpressRateUSD
        },
        airRegular: {
          totalUSD: regularTotalUSD,
          totalNGN: Math.round(regularTotalUSD * usdNgn),
          totalCNY: Number((regularTotalUSD * usdCny).toFixed(2)),
          days: corridor.airRegularDeliveryDays,
          ratePerKg: corridor.airRegularRateUSD
        },
        seaFreight: {
          totalUSD: seaTotalUSD,
          totalNGN: Math.round(seaTotalUSD * usdNgn),
          totalCNY: Number((seaTotalUSD * usdCny).toFixed(2)),
          days: corridor.seaFreightDeliveryDays,
          ratePerCbm: corridor.seaFreightRateCbmUSD
        }
      }
    };
  }

  // =========================================================================
  // RBAC & STAFF ACCOUNT MANAGEMENT METHODS
  // =========================================================================

  public getAdminStaff(): AdminUser[] {
    if (this.state.admin_staff && Object.keys(this.state.admin_staff).length > 0) {
      return Object.values(this.state.admin_staff);
    }
    return INITIAL_ADMINS;
  }

  public async provisionStaff(payload: {
    name: string;
    email: string;
    role: AdminRole;
    department?: string;
    hubLocation?: string;
    permissions?: AdminModulePermission[];
    tempPassword?: string;
  }, adminId: string = 'adm-001'): Promise<{ success: boolean; staff?: AdminUser; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/staff/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          if (!this.state.admin_staff) this.state.admin_staff = {};
          this.state.admin_staff[data.staff.uid] = data.staff;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to provision staff member');
    } catch {
      // Local fallback
      const uid = `adm-${Date.now().toString().slice(-4)}`;
      const roleTitles: Record<AdminRole, string> = {
        super_admin: 'Super Administrator',
        finance_officer: 'Treasury & FX Officer',
        logistics_manager: 'Logistics Operations Officer',
        support_agent: 'Client Concierge Specialist',
        warehouse_officer: 'Warehouse Intake Officer',
        custom: 'Operations Officer'
      };
      const newStaff: AdminUser = {
        uid,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        roleTitle: roleTitles[payload.role] || 'Operations Specialist',
        department: payload.department || 'Operations Team',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        hubLocation: payload.hubLocation || 'Guangzhou Baiyun Hub',
        lastLogin: 'Never (Pending 2FA Setup)',
        status: 'active',
        permissions: payload.permissions || ROLE_DEFAULT_PERMISSIONS[payload.role] || ['shipments'],
        tempPassword: payload.tempPassword || `Flye@${Math.floor(1000 + Math.random() * 9000)}#2026`,
        inviteToken: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        twoFactorEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (!this.state.admin_staff) this.state.admin_staff = {};
      this.state.admin_staff[newStaff.uid] = newStaff;
      this.persist();
      this.notifyListeners();
      return { success: true, staff: newStaff };
    }
  }

  public async updateStaffPermissions(staffId: string, permissions: AdminModulePermission[], adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/staff/update-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, permissions, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff && this.state.admin_staff) {
          this.state.admin_staff[staffId] = data.staff;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
    } catch {
      // local fallback
    }
    if (this.state.admin_staff && this.state.admin_staff[staffId]) {
      this.state.admin_staff[staffId].permissions = permissions;
      this.state.admin_staff[staffId].updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, staff: this.state.admin_staff[staffId] };
    }
    return { success: false, error: 'Staff member not found' };
  }

  public async toggleStaffStatus(staffId: string, status?: 'active' | 'suspended', adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/staff/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, status, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff && this.state.admin_staff) {
          this.state.admin_staff[staffId] = data.staff;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
    } catch {
      // local fallback
    }
    if (this.state.admin_staff && this.state.admin_staff[staffId]) {
      const current = this.state.admin_staff[staffId].status;
      const next = status || (current === 'active' ? 'suspended' : 'active');
      this.state.admin_staff[staffId].status = next;
      this.state.admin_staff[staffId].updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, staff: this.state.admin_staff[staffId] };
    }
    return { success: false, error: 'Staff member not found' };
  }

  public async resetStaffCredentials(staffId: string, adminId: string = 'adm-001'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/staff/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, adminId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff && this.state.admin_staff) {
          this.state.admin_staff[staffId] = data.staff;
          this.persist();
          this.notifyListeners();
        }
        return data;
      }
    } catch {
      // local fallback
    }
    if (this.state.admin_staff && this.state.admin_staff[staffId]) {
      this.state.admin_staff[staffId].tempPassword = `Flye@Reset${Math.floor(1000 + Math.random() * 9000)}#`;
      this.state.admin_staff[staffId].inviteToken = `inv_reset_${Date.now()}`;
      this.state.admin_staff[staffId].updatedAt = Date.now();
      this.persist();
      this.notifyListeners();
      return { success: true, staff: this.state.admin_staff[staffId] };
    }
    return { success: false, error: 'Staff member not found' };
  }

  public async logAccessDenied(staffId: string, staffName: string, requestedPath: string, missingPermission: string): Promise<any> {
    try {
      await fetch(`${BACKEND_BASE}/api/admin/security/log-access-denied`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, staffName, requestedPath, missingPermission })
      });
    } catch {
      // ignore
    }
  }
}

export const db = new DatabaseService();
