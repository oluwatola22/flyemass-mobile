export type Currency = 'NGN' | 'CNY' | 'USD';

export type ScreenRoute = 
  | 'welcome'
  | 'login'
  | 'signup'
  | 'reset-password'
  | 'verify-email'
  | 'setup-pin'
  | 'switch-device'
  | 'home'
  | 'wallets'
  | 'history'
  | 'notifications'
  | 'fund'
  | 'pay'
  | 'exchange'
  | 'withdraw'
  | 'logistics'
  | 'track'
  | 'register-package'
  | 'shop'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'shop-saved'
  | 'shop-compare'
  | 'shop-orders'
  | 'shop-order-detail'
  | 'suppliers'
  | 'agent'
  | 'procure'
  | 'hotels'
  | 'hotel-detail'
  | 'hotel-bookings'
  | 'profile'
  | 'security'
  | 'support'
  | 'support-chat'
  | 'support-tickets'
  | 'support-ticket-detail'
  | 'support-new-ticket'
  | 'terms'
  | 'privacy'
  | 'delete-account'
  | 'schema-inspector'
  // Web Admin Dashboard Routes
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-user-detail'
  | 'admin-logistics'
  | 'admin-logistics-detail'
  | 'admin-payments'
  | 'admin-shop'
  | 'admin-hotels'
  | 'admin-agents'
  | 'admin-support'
  | 'admin-team';

// ==========================================
// BACKEND DATABASE SCHEMA SPECIFICATION
// ==========================================

export interface UserBalances {
  NGN: number;
  CNY: number;
  USD: number;
}

/**
 * /users/{userId}
 */
export interface UserDocument {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  verifiedBadge: boolean;
  role: 'client' | 'agent' | 'admin';
  createdAt: number;
  balances: UserBalances;
}

/**
 * /wallets_ledger/{ledgerId}
 */
export interface WalletLedgerDocument {
  id: string;
  userId: string;
  type: 'FUND' | 'PAY_SUPPLIER' | 'FX_SWAP' | 'WITHDRAW' | 'SHOP_ORDER';
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  timestamp: number;
  notes?: string;
}

/**
 * /shipments/{shipmentId}
 */
export interface ShipmentTimelineEvent {
  status: string;
  location: string;
  timestamp: number | string;
  notes: string;
}

export interface ShipmentDocument {
  id: string;
  trackingNumber: string;
  userId: string;
  receiverName: string;
  originWarehouse: 'Guangzhou' | 'Yiwu';
  destination: 'Lagos Hub';
  weightKg: number;
  mode: 'Air Freight' | 'Sea Freight';
  currentStatus: 'Origin Received' | 'Packed' | 'In Transit/Customs' | 'Lagos Hub Ready' | 'Delivered';
  timeline: ShipmentTimelineEvent[];
  updatedAt: number;
  cbm?: number;
  costEstimate?: number;
  costCurrency?: Currency;
  title?: string;
}

/**
 * /supplier_payments/{paymentId}
 */
export interface SupplierPaymentDocument {
  id: string;
  userId: string;
  paymentMethod: 'Alipay' | 'WeChat Pay' | 'China Bank Transfer';
  receiverAccount: string;
  receiverName: string;
  amountRMB: number;
  equivalentNGN: number;
  status: 'processing' | 'disbursed' | 'flagged';
  createdAt: number;
  reference?: string;
  notes?: string;
}

/**
 * /shop_orders/{orderId}
 */
export interface ShopOrderDocument {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  paymentWalletUsed: string;
  fulfillmentStatus: 'processing' | 'shipped' | 'delivered';
  createdAt: number;
  orderNumber?: string;
  trackingNumber?: string;
}

/**
 * /support_tickets/{ticketId}
 */
export interface SupportTicketMessage {
  senderId: string;
  text: string;
  timestamp: number | string;
  isAdmin: boolean;
  senderName?: string;
}

export interface SupportTicketDocument {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  messages: SupportTicketMessage[];
  updatedAt: number;
  ticketNumber?: string;
  category?: string;
  priority?: 'Urgent' | 'High' | 'Normal';
}

// ==========================================
// CLIENT UI MODELS & APPLICATION INTERFACES
// ==========================================

export interface WalletBalance {
  currency: Currency;
  symbol: string;
  name: string;
  balance: number;
  flag: string;
  accountNumber?: string;
  bankName?: string;
  equivalentUSD: number;
}

export interface FxRate {
  pair: string;
  from: Currency;
  to: Currency;
  rate: number;
  change24h: number;
  isPositive: boolean;
}

export type TransactionType = 'fund' | 'pay_supplier' | 'swap' | 'withdraw' | 'shop_purchase' | 'cargo_freight';

export interface Transaction {
  id: string;
  title: string;
  category: 'Supplier' | 'Logistics' | 'FX Swap' | 'Wallet Top-up' | 'Tech Store';
  amount: number;
  currency: Currency;
  convertedAmount?: number;
  convertedCurrency?: Currency;
  date: string;
  timestamp: number;
  status: 'completed' | 'processing' | 'failed';
  reference: string;
  recipient?: string;
  paymentMethod?: string;
  type: TransactionType;
}

export type WaypointStatus = 'completed' | 'current' | 'upcoming';

export interface Waypoint {
  id: string;
  title: string;
  location: string;
  timestamp?: string;
  status: WaypointStatus;
  description: string;
}

export interface Shipment {
  trackingNumber: string;
  title: string;
  sender: string;
  origin: string;
  destination: string;
  type: 'air' | 'sea';
  status: 'Origin Received' | 'Packed & Weighed' | 'In Transit' | 'Customs Cleared' | 'Ready for Pickup';
  currentStep: number; // 0 to 3
  eta: string;
  weightKg: number;
  cbm: number;
  costEstimate: number;
  costCurrency: Currency;
  waypoints: Waypoint[];
}

export interface WarehouseAddress {
  id: string;
  city: string;
  hubName: string;
  addressEn: string;
  addressZh: string;
  recipientEn: string;
  recipientZh: string;
  phone: string;
  postalCode: string;
  type: 'Air Freight Cargo' | 'Sea Freight Cargo' | 'Express Center';
}

export interface TechProduct {
  id: string;
  title: string;
  subtitle: string;
  category: 'iPhone' | 'iPad' | 'Mac' | 'Watch' | 'Audio';
  priceUSD: number;
  priceNGN: number;
  priceCNY: number;
  image: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
  inStock: boolean;
  stockCount: number;
  tag: string;
  colors: { name: string; hex: string }[];
  storageOptions: string[];
}

export interface CartItem {
  product: TechProduct;
  quantity: number;
  selectedColor?: string;
  selectedStorage?: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  totalUSD: number;
  totalNGN: number;
  paidWith: Currency;
  date: string;
  status: 'Processing' | 'HK Dispatched' | 'Flight Mid-air' | 'Lagos Ikeja Ready' | 'Delivered';
  step: number;
  destinationAddress: string;
  trackingNumber: string;
}

export interface Supplier {
  id: string;
  name: string;
  chineseName: string;
  category: string;
  city: string;
  badge: 'Canton Fair VIP' | 'Gold Manufacturer' | 'Verified Escrow' | 'Factory Direct';
  rating: number;
  ordersFulfilled: number;
  minOrderValue: string;
  verifiedYears: number;
  mainProducts: string[];
  image: string;
  inspectionPassed: boolean;
  wechatId?: string;
}

export interface Hotel {
  id: string;
  name: string;
  chineseName: string;
  city: 'Guangzhou' | 'Shenzhen' | 'Yiwu';
  district: string;
  pricePerNightUSD: number;
  pricePerNightCNY: number;
  rating: number;
  reviewsCount: number;
  image: string;
  tags: string[];
  distanceToMarket: string;
  amenities: string[];
  roomType: string;
}

export interface HotelBooking {
  id: string;
  hotel: Hotel;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalUSD: number;
  guestName: string;
  confirmationCode: string;
  status: 'Confirmed' | 'Completed' | 'Pending';
  taxiCardZh: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  avatar?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: 'Supplier Escrow' | 'Customs & Port' | 'Air Freight Waybill' | 'FX Swap Slippage' | 'General';
  priority: 'Urgent' | 'High' | 'Normal';
  status: 'Open' | 'In Progress' | 'Resolved';
  lastUpdated: string;
  createdAt: string;
  messages: {
    sender: 'user' | 'agent';
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'trade' | 'cargo' | 'fx' | 'system';
  linkRoute?: ScreenRoute;
}

export interface RFQQuotation {
  id: string;
  rfqCode: string;
  productName: string;
  category: string;
  targetQuantity: number;
  targetUnitUSD: number;
  supplierCity: 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan';
  status: 'Quotation Submitted' | 'Factory Negotiating' | 'Sample Approved' | 'PO Issued';
  inspectionRequired: boolean;
  cantonFairBooth?: string;
  date: string;
}
