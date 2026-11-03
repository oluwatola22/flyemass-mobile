import { 
  FxRate, 
  WalletBalance, 
  Transaction, 
  Shipment, 
  WarehouseAddress, 
  TechProduct, 
  Supplier, 
  Hotel,
  HotelBooking,
  ChatMessage
} from '../types';

export const INITIAL_WALLETS: WalletBalance[] = [
  {
    currency: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira Wallet',
    balance: 28450200,
    flag: '🇳🇬',
    accountNumber: '9082341902',
    bankName: 'FlyeMass / Providus Bank',
    equivalentUSD: 19158.38
  },
  {
    currency: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan (RMB) Escrow',
    balance: 184250,
    flag: '🇨🇳',
    accountNumber: 'CN892300041289',
    bankName: 'FlyeMass China Merchant Clearing',
    equivalentUSD: 25448.90
  },
  {
    currency: 'USD',
    symbol: '$',
    name: 'US Dollar Global Account',
    balance: 42890.50,
    flag: '🇺🇸',
    accountNumber: 'US8921894002',
    bankName: 'FlyeMass / Evolve Bank NY',
    equivalentUSD: 42890.50
  }
];

export const LIVE_FX_RATES: FxRate[] = [
  { pair: 'NGN / RMB', from: 'CNY', to: 'NGN', rate: 214.50, change24h: 0.42, isPositive: true },
  { pair: 'USD / NGN', from: 'USD', to: 'NGN', rate: 1485.00, change24h: -0.18, isPositive: false },
  { pair: 'USD / CNY', from: 'USD', to: 'CNY', rate: 7.24, change24h: 0.05, isPositive: true },
  { pair: 'RMB / USD', from: 'CNY', to: 'USD', rate: 0.138, change24h: -0.05, isPositive: false },
  { pair: 'RMB / NGN', from: 'NGN', to: 'CNY', rate: 0.00466, change24h: -0.35, isPositive: false }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-892401',
    title: 'Shenzhen Foxconn Micro Tech',
    category: 'Supplier',
    amount: 45000,
    currency: 'CNY',
    convertedAmount: 9652500,
    convertedCurrency: 'NGN',
    date: 'Today, 14:20',
    timestamp: Date.now() - 3600000,
    status: 'completed',
    reference: 'FLYE-ALIPAY-98214',
    recipient: '13800138000 (Alipay Business)',
    paymentMethod: 'Alipay Instant QR',
    type: 'pay_supplier'
  },
  {
    id: 'TX-892398',
    title: 'FX Swap: NGN to RMB',
    category: 'FX Swap',
    amount: 15000000,
    currency: 'NGN',
    convertedAmount: 69930,
    convertedCurrency: 'CNY',
    date: 'Today, 11:05',
    timestamp: Date.now() - 14400000,
    status: 'completed',
    reference: 'SWP-NGN-CNY-7712',
    recipient: 'FlyeMass Guaranteed Liquidity Pool',
    paymentMethod: 'Instant Auto-Swap',
    type: 'swap'
  },
  {
    id: 'TX-892340',
    title: 'Air Freight: Guangzhou to Lagos Hub',
    category: 'Logistics',
    amount: 1420.00,
    currency: 'USD',
    convertedAmount: 2108700,
    convertedCurrency: 'NGN',
    date: 'Yesterday, 18:30',
    timestamp: Date.now() - 86400000,
    status: 'completed',
    reference: 'WAYBILL-CAN-LOS-89241',
    recipient: 'FlyeMass Air Cargo Logistics',
    paymentMethod: 'USD Wallet Direct Debit',
    type: 'cargo_freight'
  },
  {
    id: 'TX-892110',
    title: 'Top-Up via Providus Virtual NGN Account',
    category: 'Wallet Top-up',
    amount: 10000000,
    currency: 'NGN',
    date: 'Oct 30, 09:12',
    timestamp: Date.now() - 172800000,
    status: 'completed',
    reference: 'NIP-CR-992144882',
    recipient: 'FlyeMass Chief Alade NGN',
    paymentMethod: 'NIBSS Instant Transfer',
    type: 'fund'
  },
  {
    id: 'TX-891902',
    title: 'Apple iPhone 16 Pro Max Batch (5 units)',
    category: 'Tech Store',
    amount: 5995.00,
    currency: 'USD',
    convertedAmount: 43403.80,
    convertedCurrency: 'CNY',
    date: 'Oct 28, 16:45',
    timestamp: Date.now() - 345600000,
    status: 'completed',
    reference: 'ORD-TECH-89201',
    recipient: 'FlyeMass Apple Direct Distribution',
    paymentMethod: 'USD Wallet Escrow',
    type: 'shop_purchase'
  }
];

export const CHINA_WAREHOUSES: WarehouseAddress[] = [
  {
    id: 'wh-gz',
    city: 'Guangzhou',
    hubName: 'FlyeMass Baiyun International Air Cargo Hub',
    addressEn: 'Room 302, Building B, Shijing International Logistics Park, Baiyun District, Guangzhou, Guangdong Province, China',
    addressZh: '广东省广州市白云区石井国际物流园B栋302室 (飞马斯中非物流仓)',
    recipientEn: 'FlyeMass Cargo / [Your Shipping Mark: FM / USR-8924 / Babatunde Alade]',
    recipientZh: '飞马斯转运 / FM / USR-8924 / Babatunde Alade (阿德先生收)',
    phone: '+86 186 2008 9142',
    postalCode: '510440',
    type: 'Air Freight Cargo'
  },
  {
    id: 'wh-yiwu',
    city: 'Yiwu',
    hubName: 'FlyeMass Yiwu Futian Consolidated Sea & Air Hub',
    addressEn: 'Warehouse 18, Block D, Yiwu International Port Trade Zone, Chouzhou North Road, Yiwu, Zhejiang Province, China',
    addressZh: '浙江省义乌市稠州北路义乌港国际物流区D区18号仓 (飞马斯外贸集运部)',
    recipientEn: 'FlyeMass Sea Cargo / [FM / USR-8924 / Babatunde Alade]',
    recipientZh: '飞马斯国际集装箱中心 / FM / USR-8924 / Babatunde Alade',
    phone: '+86 139 5792 8841',
    postalCode: '322000',
    type: 'Sea Freight Cargo'
  },
  {
    id: 'wh-foshan',
    city: 'Foshan',
    hubName: 'FlyeMass Foshan Nanhai Furniture & Hardware Hub',
    addressEn: 'Building 6, Lanshi International Metal & Furniture Logistics Center, Nanhai District, Foshan, Guangdong Province, China',
    addressZh: '广东省佛山市南海区澜石国际金属家具物流中心6栋 (飞马斯大宗重货仓)',
    recipientEn: 'FlyeMass Bulky Sea Freight / [FM / USR-8924 / Babatunde Alade]',
    recipientZh: '飞马斯佛山重货集运部 / FM / USR-8924 / Babatunde Alade (阿德先生收)',
    phone: '+86 177 2278 6109',
    postalCode: '528200',
    type: 'Sea Freight Cargo'
  },
  {
    id: 'wh-hk',
    city: 'Hong Kong',
    hubName: 'FlyeMass Hong Kong Express Aviation Gateway',
    addressEn: 'Unit 408, Air Cargo Terminal 2, Hong Kong International Airport, Chek Lap Kok, Hong Kong',
    addressZh: '香港特别行政区赤鱲角香港国际机场第二空运货运站408室 (飞马斯特快空运中心)',
    recipientEn: 'FlyeMass HK Priority Express / [FM / USR-8924 / Babatunde Alade]',
    recipientZh: '飞马斯香港特快空运部 / FM / USR-8924 / Babatunde Alade',
    phone: '+852 2398 7102',
    postalCode: '999077',
    type: 'Air Freight Cargo'
  }
];

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    trackingNumber: 'FM-CAN-LOS-89241',
    title: '50x Apple Tech Gadgets & Accessories',
    sender: 'Foxconn Global Distribution Center, Shenzhen',
    origin: 'Guangzhou (CAN)',
    destination: 'Lagos Hub (LOS)',
    type: 'air',
    status: 'In Transit',
    currentStep: 2,
    eta: 'In 2 days (Nov 4)',
    weightKg: 28.5,
    cbm: 0.18,
    costEstimate: 285.00,
    costCurrency: 'USD',
    waypoints: [
      {
        id: 'wp-1',
        title: 'Origin Received & Inspected',
        location: 'Baiyun Logistics Hub, Guangzhou',
        timestamp: 'Nov 1, 09:30 AM',
        status: 'completed',
        description: 'Package verified against supplier invoice. 100% seal intact.'
      },
      {
        id: 'wp-2',
        title: 'Security Packed & Export Cleared',
        location: 'Guangzhou Customs Export Terminal',
        timestamp: 'Nov 1, 19:45 PM',
        status: 'completed',
        description: 'Aviation security clearance passed. Loaded into flight container.'
      },
      {
        id: 'wp-3',
        title: 'In Flight Transit / En Route to Lagos',
        location: 'Flight ET921 (Addis Ababa - Lagos)',
        timestamp: 'Nov 2, 04:15 AM',
        status: 'current',
        description: 'Air cargo mid-transit. Approaching West African airspace.'
      },
      {
        id: 'wp-4',
        title: 'Lagos Ikeja Hub Ready for Pickup / Delivery',
        location: 'FlyeMass Ikeja Clearing Terminal, Lagos, Nigeria',
        status: 'upcoming',
        description: 'Customs cleared & SMS pickup notification triggered.'
      }
    ]
  },
  {
    trackingNumber: 'FM-YIW-LOS-77192',
    title: '40ft Container: Small Commodities & Solar Inverters',
    sender: 'Yiwu Futian Commodity Market Hall 2',
    origin: 'Yiwu Port (CN)',
    destination: 'Tin Can Port, Lagos (NG)',
    type: 'sea',
    status: 'Packed & Weighed',
    currentStep: 1,
    eta: 'Nov 26 (24 days remaining)',
    weightKg: 4200,
    cbm: 28.4,
    costEstimate: 4200.00,
    costCurrency: 'USD',
    waypoints: [
      {
        id: 'wp-s1',
        title: 'Commodities Received at Yiwu Hub',
        location: 'Yiwu International Port D-18',
        timestamp: 'Oct 30, 11:20 AM',
        status: 'completed',
        description: 'Consolidated from 4 factory suppliers.'
      },
      {
        id: 'wp-s2',
        title: 'Container Stuffed & Sealed',
        location: 'Ningbo Maritime Port Terminal',
        timestamp: 'Nov 1, 16:00 PM',
        status: 'current',
        description: 'Container CN-9821 sealed. Awaiting vessel boarding.'
      },
      {
        id: 'wp-s3',
        title: 'Ocean Voyage & Gulf of Guinea Transit',
        location: 'South Atlantic Shipping Lane',
        status: 'upcoming',
        description: 'Vessel MSC Nigeria Express.'
      },
      {
        id: 'wp-s4',
        title: 'Tin Can Customs Clearance & Port Exit',
        location: 'Apapa / Tin Can Island, Lagos',
        status: 'upcoming',
        description: 'Pre-cleared with single window e-valuation.'
      }
    ]
  }
];

export const TECH_PRODUCTS: TechProduct[] = [
  {
    id: 'prod-iphone-16-pro',
    title: 'Apple iPhone 16 Pro Max',
    subtitle: 'Desert Titanium • Hong Kong / China Dual Physical SIM',
    category: 'iPhone',
    condition: 'Brand New',
    priceUSD: 1420,
    priceNGN: 2108700,
    priceCNY: 10280,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviewsCount: 312,
    specs: ['A18 Pro Chip (3nm)', 'Grade 5 Titanium', '48MP Fusion Camera', 'Dual Nano-SIM (HK Spec)'],
    technicalSpecs: {
      chip: 'Apple A18 Pro (6-core CPU, 6-core GPU, 16-core NPU)',
      ram: '8GB Unified LPDDR5X',
      camera: '48MP Fusion Main + 48MP Ultra-Wide + 12MP 5x Telephoto',
      display: '6.9" Super Retina XDR OLED (120Hz ProMotion, 2000 nits)',
      batteryHealth: '100% (Brand New Sealed)',
      biometrics: 'Face ID',
      waterResistance: 'IP68 (6 meters up to 30 mins)',
      warranty: '1-Year Apple Global Limited Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo (HK -> Lagos)'
    },
    inStock: true,
    stockCount: 18,
    tag: 'Best Seller for Lagos Wholesale',
    colors: [
      { name: 'Desert Titanium', hex: '#C2AD97' },
      { name: 'Natural Titanium', hex: '#9A958E' },
      { name: 'Black Titanium', hex: '#2F3133' },
      { name: 'White Titanium', hex: '#F0F0F2' }
    ],
    storageOptions: ['256GB', '512GB', '1TB'],
    variants: [
      { id: 'v-ip16pm-256-dt', color: 'Desert Titanium', colorHex: '#C2AD97', storage: '256GB', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
      { id: 'v-ip16pm-512-dt', color: 'Desert Titanium', colorHex: '#C2AD97', storage: '512GB', priceAdjustmentNGN: 250000, stockCount: 5, isActive: true },
      { id: 'v-ip16pm-1tb-dt', color: 'Desert Titanium', colorHex: '#C2AD97', storage: '1TB', priceAdjustmentNGN: 550000, stockCount: 3, isActive: true },
      { id: 'v-ip16pm-256-nt', color: 'Natural Titanium', colorHex: '#9A958E', storage: '256GB', priceAdjustmentNGN: 0, stockCount: 4, isActive: true }
    ],
    warrantyInfo: 'Official 1-Year Apple Warranty + FlyeMass Cargo Escrow Guarantee',
    deliveryInfo: 'HK Flight ETA: 2-4 business days to Ikeja Hub or Doorstep Delivery across Nigeria',
    isPublished: true
  },
  {
    id: 'prod-iphone-15-pro',
    title: 'Apple iPhone 15 Pro',
    subtitle: 'Blue Titanium • Grade-A Apple Certified Refurbished',
    category: 'iPhone',
    condition: 'Refurbished',
    priceUSD: 976,
    priceNGN: 1450000,
    priceCNY: 7070,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.8,
    reviewsCount: 164,
    specs: ['A17 Pro Chip', 'Grade 5 Aerospace Titanium', 'Action Button', 'USB-C 10Gbps'],
    technicalSpecs: {
      chip: 'Apple A17 Pro (6-core CPU, 6-core GPU)',
      ram: '8GB LPDDR5',
      camera: '48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto',
      display: '6.1" Super Retina XDR OLED (120Hz ProMotion)',
      batteryHealth: '98% (Grade-A Tested)',
      biometrics: 'Face ID',
      waterResistance: 'IP68',
      warranty: '6-Month FlyeMass Escrow Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 14,
    tag: 'Certified Refurbished Deal',
    colors: [
      { name: 'Blue Titanium', hex: '#2D3A4B' },
      { name: 'Natural Titanium', hex: '#9A958E' },
      { name: 'Black Titanium', hex: '#2F3133' }
    ],
    storageOptions: ['128GB', '256GB', '512GB'],
    variants: [
      { id: 'v-ip15p-128-bt', color: 'Blue Titanium', colorHex: '#2D3A4B', storage: '128GB', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
      { id: 'v-ip15p-256-bt', color: 'Blue Titanium', colorHex: '#2D3A4B', storage: '256GB', priceAdjustmentNGN: 150000, stockCount: 5, isActive: true },
      { id: 'v-ip15p-256-nt', color: 'Natural Titanium', colorHex: '#9A958E', storage: '256GB', priceAdjustmentNGN: 150000, stockCount: 3, isActive: true }
    ],
    warrantyInfo: '6-Month Comprehensive Hardware Replacement Guarantee',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-macbook-pro-16',
    title: 'MacBook Pro 16" (M4 Max / 36GB / 1TB)',
    subtitle: 'Space Black • US English International Keyboard',
    category: 'MacBook',
    condition: 'Brand New',
    priceUSD: 3499,
    priceNGN: 5196015,
    priceCNY: 25330,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 5.0,
    reviewsCount: 89,
    specs: ['M4 Max 14-core CPU', '32-core GPU', 'Liquid Retina XDR', '22-hr Battery Life'],
    technicalSpecs: {
      chip: 'Apple M4 Max (14-core CPU, 32-core GPU)',
      ram: '36GB Unified Memory',
      display: '16.2" Liquid Retina XDR (3456 x 2234, 1600 nits)',
      camera: '12MP Center Stage Camera',
      batteryHealth: '100% (Sealed)',
      biometrics: 'Touch ID',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '3-5 Days Direct Air Cargo'
    },
    inStock: true,
    stockCount: 6,
    tag: 'Enterprise Elite',
    colors: [
      { name: 'Space Black', hex: '#1E1E22' },
      { name: 'Silver', hex: '#E3E4E5' }
    ],
    storageOptions: ['1TB SSD', '2TB SSD', '4TB SSD'],
    variants: [
      { id: 'v-mbp16-1tb-sb', color: 'Space Black', colorHex: '#1E1E22', storage: '1TB SSD', priceAdjustmentNGN: 0, stockCount: 4, isActive: true },
      { id: 'v-mbp16-2tb-sb', color: 'Space Black', colorHex: '#1E1E22', storage: '2TB SSD', priceAdjustmentNGN: 600000, stockCount: 2, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Limited Warranty + Tech Escrow',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-macbook-air-13',
    title: 'MacBook Air 13" (M3 / 16GB / 512GB)',
    subtitle: 'Midnight • Ultra-thin Fanless Design',
    category: 'MacBook',
    condition: 'Brand New',
    priceUSD: 1299,
    priceNGN: 1929000,
    priceCNY: 9400,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviewsCount: 110,
    specs: ['Apple M3 8-Core CPU', '10-Core GPU', '18-Hour Battery', 'MagSafe 3 Charging'],
    technicalSpecs: {
      chip: 'Apple M3 (8-core CPU, 10-core GPU)',
      ram: '16GB Unified Memory',
      display: '13.6" Liquid Retina Display (500 nits)',
      camera: '1080p FaceTime HD',
      batteryHealth: '100% (Sealed)',
      biometrics: 'Touch ID',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 10,
    tag: 'Ultra Portable',
    colors: [
      { name: 'Midnight', hex: '#1D2533' },
      { name: 'Starlight', hex: '#F0ECE1' },
      { name: 'Space Gray', hex: '#53565A' }
    ],
    storageOptions: ['256GB SSD', '512GB SSD'],
    variants: [
      { id: 'v-mba13-256-mn', color: 'Midnight', colorHex: '#1D2533', storage: '256GB SSD', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
      { id: 'v-mba13-512-mn', color: 'Midnight', colorHex: '#1D2533', storage: '512GB SSD', priceAdjustmentNGN: 250000, stockCount: 4, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-ipad-pro-m4',
    title: 'iPad Pro 13" M4 Ultra Retina XDR',
    subtitle: 'Standard Glass • Wi-Fi + 5G Cellular',
    category: 'iPad',
    condition: 'Brand New',
    priceUSD: 1499,
    priceNGN: 2226015,
    priceCNY: 10850,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.8,
    reviewsCount: 140,
    specs: ['Tandem OLED Display', 'M4 9-Core Chip', '5.1mm Ultra-Thin', 'Cellular eSIM/Nano'],
    technicalSpecs: {
      chip: 'Apple M4 (9-core CPU, 10-core GPU, 16-core NPU)',
      ram: '8GB Unified Memory',
      display: '13" Ultra Retina XDR Tandem OLED (1000 nits full screen, 1600 nits peak)',
      camera: '12MP Wide + LiDAR Scanner',
      batteryHealth: '100%',
      biometrics: 'Face ID',
      waterResistance: 'N/A',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 12,
    tag: 'Trending in Ikeja Computer Village',
    colors: [
      { name: 'Space Black', hex: '#212124' },
      { name: 'Silver', hex: '#E5E5E7' }
    ],
    storageOptions: ['256GB', '512GB', '1TB'],
    variants: [
      { id: 'v-ippm4-256-sb', color: 'Space Black', colorHex: '#212124', storage: '256GB', priceAdjustmentNGN: 0, stockCount: 7, isActive: true },
      { id: 'v-ippm4-512-sb', color: 'Space Black', colorHex: '#212124', storage: '512GB', priceAdjustmentNGN: 350000, stockCount: 5, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Limited Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-watch-ultra-2',
    title: 'Apple Watch Ultra 2 (GPS + Cellular)',
    subtitle: 'Black Titanium Case with Dark Green Alpine Loop',
    category: 'Apple Watch',
    condition: 'Brand New',
    priceUSD: 799,
    priceNGN: 1186515,
    priceCNY: 5785,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviewsCount: 204,
    specs: ['S9 SiP with Double Tap', '3000 nits Peak Display', '100m Water Resistant', '72hr Low Power'],
    technicalSpecs: {
      chip: 'Apple S9 SiP (64-bit dual-core, 4-core Neural Engine)',
      ram: '64GB Internal Storage',
      display: '49mm Always-On Retina LTPO OLED (3000 nits)',
      camera: 'N/A',
      batteryHealth: '100%',
      biometrics: 'Electrical heart sensor (ECG) + Blood Oxygen sensor',
      waterResistance: '100 meters (dive certified to 40m)',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 24,
    tag: 'Factory Direct Sealed',
    colors: [
      { name: 'Black Titanium', hex: '#2C2D30' },
      { name: 'Natural Titanium', hex: '#A5A29D' }
    ],
    storageOptions: ['49mm Universal'],
    variants: [
      { id: 'v-wultra2-bt', color: 'Black Titanium', colorHex: '#2C2D30', storage: '49mm Universal', priceAdjustmentNGN: 0, stockCount: 12, isActive: true },
      { id: 'v-wultra2-nt', color: 'Natural Titanium', colorHex: '#A5A29D', storage: '49mm Universal', priceAdjustmentNGN: 0, stockCount: 12, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-airpods-pro-2',
    title: 'AirPods Pro 2 (USB-C MagSafe)',
    subtitle: 'Active Noise Cancellation • Transparency Mode',
    category: 'AirPods',
    condition: 'Brand New',
    priceUSD: 249,
    priceNGN: 370000,
    priceCNY: 1800,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviewsCount: 380,
    specs: ['Apple H2 Chip', '2x Active Noise Cancellation', 'Adaptive Audio', 'MagSafe Charging Case (USB-C)'],
    technicalSpecs: {
      chip: 'Apple H2 headphone chip + U1 in charging case',
      display: 'N/A',
      batteryHealth: '100%',
      waterResistance: 'IP54 dust, sweat, and water resistant',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 30,
    tag: 'High Velocity Retailer Favorite',
    colors: [
      { name: 'White', hex: '#FFFFFF' }
    ],
    storageOptions: ['USB-C MagSafe Case'],
    variants: [
      { id: 'v-app2-wh', color: 'White', colorHex: '#FFFFFF', storage: 'USB-C MagSafe Case', priceAdjustmentNGN: 0, stockCount: 30, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Limited Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-airpods-max-usb-c',
    title: 'AirPods Max (USB-C 2024 Edition)',
    subtitle: 'Midnight Blue • Active Noise Cancellation',
    category: 'AirPods',
    condition: 'Brand New',
    priceUSD: 549,
    priceNGN: 815265,
    priceCNY: 3975,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.7,
    reviewsCount: 95,
    specs: ['Lossless Audio via USB-C', 'Personalized Spatial Audio', 'Knit-Mesh Canopy', 'Smart Case Included'],
    technicalSpecs: {
      chip: 'Dual Apple H1 headphone chips',
      batteryHealth: '100%',
      biometrics: 'N/A',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 15,
    tag: 'New Edition',
    colors: [
      { name: 'Midnight', hex: '#1D2533' },
      { name: 'Starlight', hex: '#F0ECE1' },
      { name: 'Blue', hex: '#486985' }
    ],
    storageOptions: ['Standard'],
    variants: [
      { id: 'v-apm-mn', color: 'Midnight', colorHex: '#1D2533', storage: 'Standard', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
      { id: 'v-apm-sl', color: 'Starlight', colorHex: '#F0ECE1', storage: 'Standard', priceAdjustmentNGN: 0, stockCount: 5, isActive: true },
      { id: 'v-apm-bl', color: 'Blue', colorHex: '#486985', storage: 'Standard', priceAdjustmentNGN: 0, stockCount: 4, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  },
  {
    id: 'prod-apple-pencil-pro',
    title: 'Apple Pencil Pro',
    subtitle: 'Squeeze • Barrel Roll • Haptic Feedback • Find My',
    category: 'Accessories',
    condition: 'Brand New',
    priceUSD: 129,
    priceNGN: 191500,
    priceCNY: 935,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80'
    ],
    rating: 4.9,
    reviewsCount: 78,
    specs: ['Squeeze Gesture Sensor', 'Barrel Roll Gyroscope', 'Custom Haptic Engine', 'Magnetic Pairing & Charging'],
    technicalSpecs: {
      chip: 'Custom Apple Sensor Array',
      batteryHealth: '100%',
      warranty: '1-Year Apple Global Warranty',
      deliveryEstimate: '2-4 Days Express Air Cargo'
    },
    inStock: true,
    stockCount: 20,
    tag: 'iPad Pro / Air Essential',
    colors: [
      { name: 'White', hex: '#FFFFFF' }
    ],
    storageOptions: ['Standard'],
    variants: [
      { id: 'v-app-wh', color: 'White', colorHex: '#FFFFFF', storage: 'Standard', priceAdjustmentNGN: 0, stockCount: 20, isActive: true }
    ],
    warrantyInfo: '1-Year Apple Global Warranty',
    deliveryInfo: 'Air Cargo to Lagos Hub or Doorstep Delivery',
    isPublished: true
  }
];

export const VETTED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Shenzhen Kingzone Microelectronics Ltd',
    chineseName: '深圳市晶卓微电子科技有限公司',
    category: 'Consumer Electronics & Phones',
    city: 'Shenzhen (Huaqiangbei)',
    badge: 'Canton Fair VIP',
    rating: 4.95,
    ordersFulfilled: 1420,
    minOrderValue: '¥5,000 (~$690)',
    verifiedYears: 9,
    mainProducts: ['OLED Screens', 'iPhone Replacement Parts', 'Fast GaN Chargers', 'Smart Watches'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    inspectionPassed: true
  },
  {
    id: 'sup-2',
    name: 'Yiwu Shengda Global Commodity Group',
    chineseName: '义乌盛达进出口日用品实业有限公司',
    category: 'Small Commodities & Hardware',
    city: 'Yiwu (Futian District 3)',
    badge: 'Gold Manufacturer',
    rating: 4.88,
    ordersFulfilled: 2890,
    minOrderValue: '¥3,000 (~$415)',
    verifiedYears: 12,
    mainProducts: ['Kitchenware', 'Luggage & Bags', 'LED Solar Lights', 'Hardware Tools'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    inspectionPassed: true
  },
  {
    id: 'sup-3',
    name: 'Guangdong Sunvolt Clean Energy Co.',
    chineseName: '广东日源新能源科技有限公司',
    category: 'Solar & Lithium Inverters',
    city: 'Foshan / Guangzhou',
    badge: 'Verified Escrow',
    rating: 4.92,
    ordersFulfilled: 840,
    minOrderValue: '¥10,000 (~$1,380)',
    verifiedYears: 7,
    mainProducts: ['5kW Hybrid Inverters', 'LiFePO4 Powerwall 48V', 'Tier 1 Mono Solar Panels'],
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    inspectionPassed: true
  },
  {
    id: 'sup-4',
    name: 'Guangzhou Haizhu Textile & Apparel Mills',
    chineseName: '广州海珠国际纺织服饰实业有限公司',
    category: 'Fabrics & African Print Raw Materials',
    city: 'Guangzhou (Zhongda Market)',
    badge: 'Factory Direct',
    rating: 4.82,
    ordersFulfilled: 1150,
    minOrderValue: '¥4,500 (~$620)',
    verifiedYears: 14,
    mainProducts: ['Brocade Jacquard', 'Cotton Lace Fabrics', 'Embroidery Trimmings'],
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
    inspectionPassed: true
  }
];

export const CHINA_HOTELS: Hotel[] = [
  {
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
    roomType: 'Deluxe King City View'
  },
  {
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
    roomType: 'Horizon Club Deluxe Room'
  },
  {
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
    amenities: ['Free Market Shuttle', 'Arabic & English Translators', 'Western Buffet', 'Courier Pickup Desk'],
    roomType: 'Superior Business Queen'
  }
];

export const INITIAL_BOOKINGS: HotelBooking[] = [
  {
    id: 'BK-GZ-99120',
    hotel: CHINA_HOTELS[0],
    checkIn: 'Nov 12, 2026',
    checkOut: 'Nov 18, 2026',
    nights: 6,
    totalUSD: 1110,
    guestName: 'Chief Babatunde Alade',
    confirmationCode: 'WST-CAN-884102',
    status: 'Confirmed',
    taxiCardZh: '请带我到：广州市海珠区会展东路1号 广交会威斯汀酒店 (靠近琶洲展馆C区)。电话：+86 20 8917 8888'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    senderName: 'FlyeMass Trade AI',
    text: 'Hello Chief Alade! Welcome to FlyeMass VIP Concierge. I monitor your China-Nigeria payments, Canton Fair bookings, and Baiyun air cargo in real-time. How can we assist you today?',
    timestamp: '10:00 AM'
  },
  {
    id: 'msg-2',
    sender: 'user',
    senderName: 'Chief Alade',
    text: 'Can you confirm if my Alipay payment of ¥45,000 to Shenzhen Foxconn was cleared by their merchant account?',
    timestamp: '10:02 AM',
    status: 'read'
  },
  {
    id: 'msg-3',
    sender: 'support',
    senderName: 'Chen Wei (Guangzhou Clearing Desk)',
    text: 'Hi Chief Alade! Yes, we have received the instant API confirmation from Alipay China. Foxconn Micro Tech has acknowledged receipt and their logistics department has scheduled your 50x gadgets dispatch to our Baiyun Hub today at 4 PM.',
    timestamp: '10:04 AM'
  }
];

import { 
  SupportTicket, 
  AppNotification, 
  RFQQuotation, 
  ShopOrder 
} from '../types';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Alipay Supplier Payout Confirmed',
    message: '¥45,000 cleared to Foxconn Micro Tech via China Merchant Clearing API.',
    time: '12m ago',
    read: false,
    type: 'trade',
    linkRoute: 'wallets'
  },
  {
    id: 'notif-2',
    title: 'Flight ET921 Air Cargo Update',
    message: 'Air waybill FM-CAN-LOS-89241 departed Guangzhou Baiyun Hub en route to Lagos.',
    time: '2h ago',
    read: false,
    type: 'cargo',
    linkRoute: 'track'
  },
  {
    id: 'notif-3',
    title: 'FX Rate Movement Alert',
    message: 'RMB/NGN rate reached ₦214.50 (+0.42%). Good window to lock your yuan supply.',
    time: '4h ago',
    read: true,
    type: 'fx',
    linkRoute: 'exchange'
  },
  {
    id: 'notif-4',
    title: 'System Security Broadcast',
    message: 'Biometric authorization updated for iPhone 16 Pro Max session.',
    time: '1d ago',
    read: true,
    type: 'system',
    linkRoute: 'security'
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TK-89410',
    subject: 'Guangzhou Hub Air Cargo Inspection Video Request',
    category: 'Air Freight Waybill',
    priority: 'High',
    status: 'In Progress',
    lastUpdated: '15m ago',
    createdAt: 'Nov 1, 2026',
    messages: [
      {
        sender: 'user',
        senderName: 'Chief Babatunde Alade',
        text: 'Please provide high-res carton unboxing photo and video for the 50x iPhone shipment before pallet wrapping.',
        timestamp: 'Nov 1, 10:15'
      },
      {
        sender: 'agent',
        senderName: 'Huang Lei (Baiyun Cargo Ops)',
        text: 'Inspected and verified. All 50 units match serial numbers on Foxconn manifest. HD carton seal clips attached to your tracking portal.',
        timestamp: 'Nov 1, 11:30'
      }
    ]
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TK-88902',
    subject: 'Tin Can Port Customs Pre-Assessment Form M',
    category: 'Customs & Port',
    priority: 'Normal',
    status: 'Open',
    lastUpdated: '3h ago',
    createdAt: 'Oct 31, 2026',
    messages: [
      {
        sender: 'user',
        senderName: 'Chief Babatunde Alade',
        text: 'Have our 40ft container solar inverters been submitted for e-Form M single window customs valuation?',
        timestamp: 'Oct 31, 14:00'
      }
    ]
  }
];

export const INITIAL_QUOTATIONS: RFQQuotation[] = [
  {
    id: 'rfq-1',
    rfqCode: 'RFQ-GZ-2026-99',
    productName: 'Commercial 5kW Hybrid Lithium Inverters',
    category: 'Solar & Clean Energy',
    targetQuantity: 100,
    targetUnitUSD: 410,
    supplierCity: 'Guangzhou',
    status: 'Factory Negotiating',
    inspectionRequired: true,
    cantonFairBooth: 'Pazhou Area B, Hall 11.2, Booth D41',
    date: 'Nov 1, 2026'
  },
  {
    id: 'rfq-2',
    rfqCode: 'RFQ-YIW-2026-42',
    productName: 'African Jacquard Brocade Fabric (5000 Yards)',
    category: 'Textiles & Apparel',
    targetQuantity: 5000,
    targetUnitUSD: 2.80,
    supplierCity: 'Yiwu',
    status: 'Sample Approved',
    inspectionRequired: true,
    date: 'Oct 29, 2026'
  }
];

export const INITIAL_SHOP_ORDERS: ShopOrder[] = [
  {
    id: 'ord-tech-101',
    orderNumber: 'ORD-HK-99214',
    items: [
      {
        product: TECH_PRODUCTS[0],
        quantity: 5,
        selectedColor: 'Desert Titanium',
        selectedStorage: '512GB'
      }
    ],
    totalUSD: 7100,
    totalNGN: 10543500,
    paidWith: 'USD',
    date: 'Oct 28, 2026',
    status: 'HK Dispatched',
    step: 1,
    destinationAddress: 'FlyeMass Central Vault, Allen Avenue, Ikeja, Lagos',
    trackingNumber: 'FM-HK-LOS-90214'
  },
  {
    id: 'ord-tech-102',
    orderNumber: 'ORD-HK-98112',
    items: [
      {
        product: TECH_PRODUCTS[1],
        quantity: 2,
        selectedColor: 'Space Black',
        selectedStorage: '1TB SSD'
      }
    ],
    totalUSD: 6998,
    totalNGN: 10392030,
    paidWith: 'USD',
    date: 'Oct 20, 2026',
    status: 'Delivered',
    step: 4,
    destinationAddress: 'Victoria Island Trade Suite, Lagos',
    trackingNumber: 'FM-HK-LOS-88120'
  }
];
