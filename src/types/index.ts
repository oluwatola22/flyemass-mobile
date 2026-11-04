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
  | 'rentals-apartments'
  | 'rentals-offices'
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
  | 'admin-rmb-transfers'
  | 'admin-naira-payouts'
  | 'admin-fx-management'
  | 'admin-funding'
  | 'admin-shop'
  | 'admin-hotels'
  | 'admin-rentals-apartments'
  | 'admin-rentals-offices'
  | 'admin-suppliers'
  | 'admin-agents'
  | 'admin-support'
  | 'admin-team'
  | 'admin-communications'
  | 'admin-registrations';

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
  pinFailedAttempts?: number;
  pinLockedUntil?: number;
  isSuspended?: boolean;
  suspensionReason?: string;
  restrictions?: string[];
  adminNotes?: string;
  kycLevel?: string;
  updatedAt?: number;
}

/**
 * /wallets_ledger/{ledgerId}
 */
export interface WalletLedgerDocument {
  id: string;
  userId: string;
  type: 'FUND' | 'PAY_SUPPLIER' | 'FX_SWAP' | 'WITHDRAW' | 'SHOP_ORDER' | 'CARGO_FREIGHT' | 'SUPPLIER_SUB';
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  convertedAmount?: number;
  fee: number;
  rate?: number;
  openingBalance?: number;
  closingBalance?: number;
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
  shipmentCode?: string;
  trackingNumber: string;
  trackingCode?: string;
  userId: string;
  receiverName: string;
  customerPhone?: string;
  customerAddress?: string;
  originWarehouse: 'Guangzhou' | 'Yiwu' | 'Foshan' | string;
  destination: string;
  destinationHub?: string;
  weightKg: number;
  actualWeightKg?: number;
  billableWeightKg?: number;
  mode: 'Air Freight' | 'Sea Freight' | string;
  shippingMode?: 'Air Express' | 'Air Regular' | 'Sea Freight' | string;
  courierCompany?: string;
  chineseCourierTracking?: string;
  packageDescription?: string;
  cartonsCount?: number;
  declaredValueRMB?: number;
  supplierInvoiceUrl?: string;
  consolidationPreference?: string;
  deliveryType?: 'pickup' | 'doorstep';
  pickupHub?: string;
  doorstepAddress?: {
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  cbm?: number;
  currentStatus:
    | 'registered'
    | 'received_warehouse'
    | 'inspection'
    | 'packed'
    | 'awaiting_payment'
    | 'ready_for_dispatch'
    | 'dispatched'
    | 'in_transit'
    | 'customs_clearance'
    | 'arrived'
    | 'ready_for_pickup'
    | 'out_for_delivery'
    | 'delivered'
    | 'completed'
    | 'Cancelled'
    | 'Origin Received'
    | 'In Transit/Customs'
    | 'Lagos Hub Ready'
    | string;
  timeline: ShipmentTimelineEvent[];
  updatedAt: number;
  createdAt?: number;
  costEstimate?: number;
  costCurrency?: Currency;
  title?: string;
  sender?: string;
  freightFee?: number;
  freightFeeUSD?: number;
  freightFeeNGN?: number;
  freightFeeCNY?: number;
  ratePerKg?: number;
  freightCurrency?: Currency;
  freightPaid?: boolean;
  paymentStatus?: 'unbilled' | 'awaiting_payment' | 'paid' | 'deferred' | string;
  paymentTiming?: 'immediate' | 'pay_on_arrival' | string;
  paidCurrency?: Currency;
  paidAmount?: number;
  pickupOtp?: string;
  otpVerified?: boolean;
  handedOverTo?: string;
  handoverTimestamp?: number;
  inspectionPhotos?: string[];
  inspectionNotes?: string;
  packagingCondition?: string;
  billingNotes?: string;
  status?: string;
  isConsolidatedParent?: boolean;
  consolidatedShipmentIds?: string[];
  containerNumber?: string;
  originCity?: string;
  destinationCity?: string;
  type?: string;
  totalWeightKg?: number;
  eta?: string;
}

/**
 * /supplier_payments/{paymentId}
 */
export interface SupplierPaymentDocument {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: 'Alipay' | 'WeChat Pay' | 'China Bank Transfer' | string;
  receiverAccount: string;
  receiverName: string;
  bankName?: string;
  swiftBic?: string;
  qrCodeUrl?: string;
  purpose?: string;
  purposeExplanation?: string;
  amountRMB: number;
  feeCNY?: number;
  totalDeductionCNY?: number;
  equivalentNGN: number;
  status: 'pending' | 'processing' | 'disbursed' | 'completed' | 'flagged' | 'refunded' | 'rejected';
  createdAt: number;
  reference?: string;
  notes?: string;
  clearingSessionId?: string;
  paymentProofUrl?: string;
  safeDeclarationRef?: string;
  externalPaymentRef?: string;
  adminNotes?: string;
  reviewer?: string;
  reviewDate?: number;
  disbursedAt?: number;
  completedAt?: number;
  refundReason?: string;
  refundedAt?: number;
}

export interface WithdrawalDocument {
  id: string;
  userId: string;
  reference?: string;
  customerName?: string;
  customerEmail?: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  amountNGN: number;
  feeNGN: number;
  totalDebit?: number;
  status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'failed' | 'refunded';
  transferReference?: string;
  createdAt: number;
  note?: string;
  customerNote?: string;
  paymentProofUrl?: string;
  adminNotes?: string;
  reviewer?: string;
  reviewDate?: number;
  completedAt?: number;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: number;
}

export interface SupplierSubscriptionDocument {
  id: string;
  userId: string;
  supplierId?: string;
  purchasedAt: number;
  activeUntil: number;
  feeUSD?: number;
  status: 'active' | 'expired';
  userName?: string;
  currency?: string;
  amountPaid?: number;
  reference?: string;
  renewalCount?: number;
  type?: string;
  autoRenew?: boolean;
}

export interface SupplierDirectoryPrices {
  ngn: number;
  usd: number;
  cny: number;
  updatedAt?: number;
  updatedBy?: string;
}

export type AgentServiceKind = 'sourcing' | 'supplier_verification' | 'factory_audit' | 'quality_control';

export interface AgentRequestTimelineEvent {
  status: string;
  timestamp: number | string;
  notes: string;
  agent?: string;
  location?: string;
}

export interface AgentRequestDocument {
  id: string;
  reference?: string; // e.g. AGT-SRC-2026-XXXXX
  userId: string;
  clientName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType: string;
  serviceKind?: AgentServiceKind;
  productName: string;
  category: string;
  targetQuantity: number;
  targetUnitUSD?: number;
  targetUnitCNY?: number;
  totalBudgetCNY?: number;
  productUrl?: string;
  specifications?: string;
  referencePhotos?: string[];

  // Inspection & Supplier specifics
  supplierName?: string;
  supplierLocation?: string;
  supplierCity: string;
  supplierContact?: string;
  supplierWechat?: string;
  preferredDate?: string;
  inspectionRequirements?: string[] | string;
  inspectionRequired: boolean;
  cantonFairBooth?: string;

  // Quotation Breakdown
  productCostCNY?: number;
  sourcingCommissionCNY?: number;
  sourcingCommissionPercent?: number;
  chinaShippingCNY?: number;
  totalPayableCNY?: number;
  quoteAmountUSD?: number;
  quoteAmountNGN?: number;
  quoteAmountCNY?: number;
  serviceFeeUSD?: number;
  leadTimeDays?: number;
  supplierFindings?: string;
  adminNotes?: string;
  assignedAgent?: string;
  quotedAt?: number;

  // Payment & Escrow
  status: 'submitted' | 'pending_review' | 'pending_quote' | 'awaiting_payment' | 'quote_ready' | 'quote_accepted' | 'po_issued' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus?: 'unpaid' | 'awaiting_payment' | 'paid' | 'refunded';
  paidAt?: number;
  paidWith?: 'USD' | 'NGN' | 'CNY';
  paidAmount?: number;
  paymentReference?: string;
  escrowReference?: string;
  escrowAmount?: number;
  escrowCurrency?: string;

  // Shipment link (for Sourcing)
  linkedShipmentId?: string;
  linkedShipmentCode?: string;
  linkedTrackingCode?: string;

  // China Fulfilment & Inspection Evidence
  purchaseDetails?: string;
  supplierInvoiceUrl?: string;
  businessRegistrationFindings?: string;
  legitimacyNotes?: string;
  factoryAuditFindings?: string;
  factoryPhotos?: string[];
  qualityControlFindings?: string;
  qcInspectionEvidence?: string[];
  inspectionReportUrl?: string;
  operationalNotes?: string;
  reportSummary?: string;
  completedAt?: number;
  timeline?: AgentRequestTimelineEvent[];

  // Refund Tracking
  refundReference?: string;
  refundAmount?: number;
  refundCurrency?: string;
  refundReason?: string;
  refundedAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;

  createdAt: number;
  updatedAt?: number;
}

export interface BannerDocument {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  destinationRoute: ScreenRoute;
  isActive: boolean;
  displayOrder: number;
}

export interface SystemSettingsDocument {
  rates: {
    NGN_CNY: number;
    USD_NGN: number;
    USD_CNY: number;
    spreadPercent: number;
    lastUpdated: number;
    updatedBy: string;
  };
  fees: {
    withdrawalFlatNGN: number;
    fundingCardPercent: number;
    supplierEscrowPercent: number;
    airFreightPerKgUSD: number;
    seaFreightPerCbmUSD: number;
    supplier30DayPassUSD: number;
    sourcingCommissionPercent?: number;
    minSourcingCommissionCNY?: number;
    supplierVerificationUSD?: number;
    factoryAuditUSD?: number;
    qualityControlUSD?: number;
  };
}

/**
 * /shop_orders/{orderId}
 */
export interface OrderTimelineEvent {
  status: string;
  title: string;
  description: string;
  timestamp: number;
  location?: string;
}

export interface DeviceShopSettings {
  deliveryFeeNGN: number;
  updatedAt: number;
  updatedBy: string;
}

export interface ShopOrderDocument {
  id: string;
  userId: string;
  items: CartItem[];
  subtotalNGN?: number;
  deliveryFeeNGN?: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  destinationAddress?: string;
  paymentWalletUsed: string;
  paidWith?: string;
  totalNGN?: number;
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  status?: string;
  date?: string;
  createdAt: number;
  updatedAt?: number;
  orderNumber?: string;
  trackingNumber?: string;
  courierName?: string;
  timeline?: OrderTimelineEvent[];
  deliveryNotes?: string;
  internalNotes?: string;
  cancellationReason?: string;
  cancelledAt?: number;
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
  iban?: string;
  swiftBic?: string;
  routingAba?: string;
  sortCode?: string;
  cnapsCode?: string;
  accountName?: string;
  clearingRoute?: string;
  bankAddress?: string;
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
  shipmentCode?: string;
  trackingCode?: string;
  id?: string;
  title: string;
  sender: string;
  origin: string;
  originWarehouse?: string;
  destination: string;
  destinationHub?: string;
  type: 'air' | 'sea';
  status: 'Origin Received' | 'Packed & Weighed' | 'In Transit' | 'Customs Cleared' | 'Ready for Pickup' | string;
  currentStatus?: string;
  currentStep: number; // 0 to 3 or 0 to 5
  eta: string;
  weightKg: number;
  actualWeightKg?: number;
  billableWeightKg?: number;
  cbm: number;
  costEstimate: number;
  costCurrency: Currency;
  waypoints: Waypoint[];
  // Extended fields for Phase 9 Logistics Workflow
  courierCompany?: string;
  chineseCourierTracking?: string;
  packageDescription?: string;
  cartonsCount?: number;
  declaredValueRMB?: number;
  supplierInvoiceUrl?: string;
  consolidationPreference?: string;
  repackagingPreference?: string;
  deliveryType?: 'pickup' | 'doorstep';
  pickupHub?: string;
  doorstepAddress?: {
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  freightFeeUSD?: number;
  freightFeeNGN?: number;
  freightFeeCNY?: number;
  ratePerKg?: number;
  freightPaid?: boolean;
  paymentStatus?: 'unbilled' | 'awaiting_payment' | 'paid' | 'deferred' | string;
  paymentTiming?: 'immediate' | 'pay_on_arrival' | string;
  paidCurrency?: Currency;
  paidAmount?: number;
  pickupOtp?: string;
  otpVerified?: boolean;
  handedOverTo?: string;
  handoverTimestamp?: number;
  inspectionPhotos?: string[];
  inspectionNotes?: string;
  packagingCondition?: string;
  billingNotes?: string;
  createdAt?: number;
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

export type ProductCondition = 'Brand New' | 'Refurbished' | 'Fair / Pre-owned';

export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  storage: string;
  priceAdjustmentNGN: number;
  stockCount: number;
  isActive: boolean;
}

export interface TechnicalSpecs {
  chip?: string;
  ram?: string;
  camera?: string;
  display?: string;
  batteryHealth?: string | number;
  biometrics?: string;
  waterResistance?: string;
  warranty?: string;
  deliveryEstimate?: string;
  [key: string]: any;
}

export interface TechProduct {
  id: string;
  title: string;
  subtitle: string;
  category: 'iPhone' | 'iPad' | 'Mac' | 'MacBook' | 'Watch' | 'Apple Watch' | 'Audio' | 'AirPods' | 'Accessories' | string;
  condition?: ProductCondition;
  priceUSD: number;
  priceNGN: number;
  priceCNY: number;
  image: string;
  images?: string[];
  rating: number;
  reviewsCount: number;
  specs: string[];
  technicalSpecs?: TechnicalSpecs;
  inStock: boolean;
  stockCount: number;
  tag: string;
  colors: { name: string; hex: string }[];
  storageOptions: string[];
  variants?: ProductVariant[];
  warrantyInfo?: string;
  deliveryInfo?: string;
  isPublished?: boolean;
  createdAt?: number;
}

export interface CartItem {
  id?: string;
  product: TechProduct;
  quantity: number;
  variantId?: string;
  selectedColor?: string;
  selectedStorage?: string;
  priceAdjustmentNGN?: number;
  unitPriceNGN?: number;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  totalUSD: number;
  totalNGN: number;
  paidWith: Currency;
  date: string;
  status: 'Processing' | 'HK Dispatched' | 'Flight Mid-air' | 'Lagos Ikeja Ready' | 'Delivered' | string;
  step: number;
  destinationAddress: string;
  trackingNumber: string;
  userId?: string;
  subtotalNGN?: number;
  deliveryFeeNGN?: number;
  totalAmount?: number;
  currency?: string;
  deliveryAddress?: string;
  paymentWalletUsed?: string;
  fulfillmentStatus?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | string;
  createdAt?: number;
  updatedAt?: number;
  courierName?: string;
  timeline?: OrderTimelineEvent[];
  deliveryNotes?: string;
  internalNotes?: string;
  cancellationReason?: string;
  cancelledAt?: number;
}

export interface Supplier {
  id: string;
  name: string;
  chineseName: string;
  category: string;
  city: string;
  badge?: 'Canton Fair VIP' | 'Gold Manufacturer' | 'Verified Escrow' | 'Factory Direct' | string;
  rating: number;
  ordersFulfilled?: number;
  minOrderValue?: string;
  verifiedYears: number;
  mainProducts?: string[];
  image?: string;
  inspectionPassed?: boolean;
  wechatId?: string;
  phone?: string;
  whatsapp?: string;
  businessAddress?: string;
  description?: string;
  tags?: string[];
  active?: boolean;
  businessCardUrl?: string;
  verificationDocUrl?: string;
  isLocked?: boolean;
  createdAt?: number;
}

export interface HotelRoomType {
  id: string;
  name: string; // 'Standard Room' | 'Deluxe Double' | 'Executive Suite'
  nightlySurchargeUSD: number;
  maxGuests: number;
  description: string;
  amenities: string[];
}

export interface Hotel {
  id: string;
  name: string;
  chineseName: string;
  city: 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Shanghai' | 'Beijing' | 'Foshan' | 'Hangzhou' | 'Dongguan' | 'Hong Kong' | string;
  district: string;
  englishAddress?: string;
  chineseAddress?: string;
  description?: string;
  pricePerNightUSD: number;
  pricePerNightCNY: number;
  pricePerNightNGN?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  tags: string[];
  distanceToMarket: string;
  amenities: string[];
  roomType: string;
  roomTypes?: HotelRoomType[];
  cancellationPolicy?: string;
  isPublished?: boolean;
  taxiCardZh?: string;
}

export interface HotelBooking {
  id: string;
  reference?: string; // BK-2026-00001
  userId?: string;
  hotelId?: string;
  hotelName?: string;
  hotel: Hotel;
  roomType?: string;
  roomSurchargeUSD?: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount?: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  totalUSD: number;
  currency?: string;
  amountDebited?: number;
  confirmationCode: string;
  status: 'Confirmed' | 'Completed' | 'Pending' | 'cancelled' | 'Cancelled' | 'confirmed' | 'checked_in' | 'completed';
  taxiCardZh: string;
  qrVerificationToken?: string;
  voucherPdfUrl?: string;
  cancellationPolicy?: string;
  cancellationReason?: string;
  cancelledAt?: number;
  refundAmount?: number;
  emailSent?: boolean;
  arrivalNotes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export type RentalPropertyType = 'apartment' | 'house' | 'office';
export type RentalLeaseTerm = '6 months' | '1 year' | 'Flexible';

export interface RentalProperty {
  id: string;
  title: string;
  chineseTitle?: string;
  propertyType: RentalPropertyType; // 'apartment' | 'house' | 'office'
  city?: string; // Guangzhou
  district: 'Tianhe CBD' | 'Yuexiu' | 'Haizhu' | 'Baiyun' | 'Panyu' | 'Liwan' | string;
  englishAddress?: string;
  address?: string;
  chineseAddress?: string;
  monthlyRentCNY: number;
  monthlyRentUSD?: number;
  estimatedRentUSD?: number;
  estimatedRentNGN?: number;
  depositMonths: number; // e.g. 2
  advanceRentMonths: number; // e.g. 1
  floorAreaSqm: number;
  bedrooms?: number; // for apartments/houses
  deskCapacity?: number; // for offices
  isFurnished?: boolean;
  furnishedStatus?: 'Furnished' | 'Unfurnished' | 'Semi-Furnished';
  amenities: string[];
  leaseTerms?: RentalLeaseTerm[];
  images: string[];
  status: 'live' | 'hidden' | 'rented';
  description?: string;
  metroAccess?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PropertyInquiry {
  id: string;
  reference: string; // INQ-APT-2026-XXXXX or INQ-OFF-2026-XXXXX
  userId: string;
  propertyId: string;
  propertyTitle?: string;
  propertyName?: string;
  propertyType: RentalPropertyType;
  district: string;
  customerName: string;
  customerPhone: string;
  companyName?: string; // for office inquiries
  preferredMoveInDate: string;
  preferredViewingDate?: string; // for offices or apartment viewing
  leaseDuration: string; // '6 months' | '1 year'
  customNotes?: string;
  monthlyRentCNY?: number;
  upfrontCostEstimateCNY?: number;
  ticketId: string; // linked support_tickets ID
  ticketNumber?: string;
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'closed';
  adminNotes?: string;
  assignedStaff?: string;
  createdAt: number;
  updatedAt?: number;
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
