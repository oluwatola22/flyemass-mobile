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
  DeviceShopSettings
} from '../types';
import { TECH_PRODUCTS } from '../data/mockData';

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
  hotels?: Record<string, any>;
  rental_properties?: Record<string, any>;
  property_inquiries?: Record<string, any>;
  webhook_events?: any[];
  products: Record<string, TechProduct>;
  device_shop_settings?: DeviceShopSettings;
  user_favorites?: Record<string, string[]>;
  device_cart_items?: Record<string, CartItem[]>;
  support_tickets: Record<string, SupportTicketDocument>;
  banners: BannerDocument[];
  system_settings: SystemSettingsDocument;
  audit_logs: any[];
  double_entry_ledger?: Record<string, any>;
  notifications?: any[];
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
      supplier30DayPassUSD: 50.00,
      sourcingCommissionPercent: 5.0,
      minSourcingCommissionCNY: 500,
      supplierVerificationUSD: 150,
      factoryAuditUSD: 250,
      qualityControlUSD: 200
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
      return await res.json();
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
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error requesting withdrawal' };
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

  public async markWithdrawalProcessing(withdrawalId: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ withdrawalId, adminId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error updating withdrawal to processing' };
    }
  }

  public async disburseWithdrawal(withdrawalId: string, transferReference: string, paymentProofUrl?: string, adminNotes?: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/withdrawals/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId || 'adm-001', 'x-admin-role': 'finance_officer' },
        body: JSON.stringify({ withdrawalId, transferReference, paymentProofUrl, adminNotes, adminId })
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
    return this.state.device_cart_items[userId] || [];
  }

  public async syncCloudCart(userId: string, items: CartItem[]): Promise<any> {
    if (!this.state.device_cart_items) this.state.device_cart_items = {};
    this.state.device_cart_items[userId] = items;
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

  public async registerUser(details: { fullName: string; email: string; phone?: string; businessName?: string; pin?: string }): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    return await res.json();
  }

  public async manualAdjustBalance(
    userId: string,
    currency: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string,
    adminId: string = 'adm-001'
  ): Promise<any> {
    const res = await fetch(`${BACKEND_BASE}/api/admin/wallets/manual-adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-admin-role': 'super_admin'
      },
      body: JSON.stringify({ userId, currency, amount, type, reason, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust balance');
    return data;
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

  public async createSupplier(supplier: any, adminId: string = 'adm-001'): Promise<any> {
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
    return data;
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
}

export const db = new DatabaseService();
