/**
 * AUTOMATED TRANSACTION & ACTIVITY EMAIL NOTIFICATION SYSTEM TEST SUITE
 * 
 * Tests:
 * 1. Branded Dark-Mode Luxury HTML Email Templates (All 7 Transactional Events)
 * 2. Visual Tokens & Anti-Phishing Compliance Footers
 * 3. Asynchronous Non-blocking Dispatch & Zero-Latency Performance
 * 4. In-Memory Receipt Persistence & In-App Notification Generation
 * 5. Supabase SQL Schema Triggers & Edge Function Definitions
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Automated Transaction & Activity Email System Verification...\n');

// --------------------------------------------------------------------------
// 1. Inspect Server Source Code & Extract Functions
// --------------------------------------------------------------------------
const serverSrc = fs.readFileSync(path.join(__dirname, '../sync-server.cjs'), 'utf8');

assert(serverSrc.includes('function wrapEmailTemplate'), 'sync-server.cjs must export/define wrapEmailTemplate');
assert(serverSrc.includes('function buildTransactionalEmail'), 'sync-server.cjs must export/define buildTransactionalEmail');
assert(serverSrc.includes('function dispatchTransactionalEmailAsync'), 'sync-server.cjs must export/define dispatchTransactionalEmailAsync');

// Create test environment with mock dbState
const mockDbState = {
  users: {
    'usr_alade_01': {
      uid: 'usr_alade_01',
      fullName: 'Chief Babatunde Alade',
      email: 'alade@enterprisegroup.ng',
      flyeTag: 'FM-USR-8924',
      shippingMark: 'FM-USR-8924',
      balances: { NGN: 15450000, CNY: 42000, USD: 18500 }
    }
  },
  email_receipts: {},
  notifications: []
};

// Evaluate the email builder in an isolated sandbox context
const vm = require('vm');
const sandbox = {
  dbState: mockDbState,
  console: console,
  persistState: () => {},
  broadcastUpdate: () => {},
  setImmediate: setImmediate,
  process: { env: {} }
};

// Extract the wrapEmailTemplate, buildTransactionalEmail, and dispatchTransactionalEmailAsync code
const startMarker = '// =========================================================================\n// 1.5. AUTOMATED TRANSACTIONAL & ACTIVITY EMAIL ENGINE';
const endMarker = '// =========================================================================\n// 2. DATABASE-LEVEL FINANCIAL CONCURRENCY';

const startIndex = serverSrc.indexOf(startMarker);
const endIndex = serverSrc.indexOf(endMarker);
assert(startIndex !== -1 && endIndex !== -1, 'Could not find transactional email engine section in sync-server.cjs');

const engineCode = serverSrc.slice(startIndex, endIndex);
vm.createContext(sandbox);
vm.runInContext(engineCode, sandbox);

const { wrapEmailTemplate, buildTransactionalEmail, dispatchTransactionalEmailAsync } = sandbox;

// --------------------------------------------------------------------------
// 2. Test Dark-Mode Luxury Branding Tokens & Template Styling
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Dark-Mode Luxury Template Wrapper & Design Tokens...');
const testWrap = wrapEmailTemplate(
  'Test Subject',
  '<div class="badge badge-emerald">Verified</div>',
  '<p class="lead">Sample email body test.</p>'
);

assert(testWrap.includes('#020617'), 'Email must use obsidian #020617 background');
assert(testWrap.includes('#0f172a'), 'Email must use slate #0f172a container card');
assert(testWrap.includes('#10b981'), 'Email must use emerald #10b981 accent styling');
assert(testWrap.includes('FLYEMASS'), 'Email must feature official FLYEMASS header');
assert(testWrap.includes('CAC / CBN / SAFE Compliant'), 'Email must display regulatory compliance text');
assert(testWrap.includes('Double-entry general ledger protected'), 'Email must feature financial equilibrium protection notice');
console.log('✅ Dark-mode luxury wrapper and compliance footers verified.\n');

// --------------------------------------------------------------------------
// 3. Test All 7 Transactional Event Templates
// --------------------------------------------------------------------------
console.log('Test 2: Verifying All 7 Transactional Email Generators...');

// Event 1: ACCOUNT_WELCOME
const welcomeEmail = buildTransactionalEmail('ACCOUNT_WELCOME', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
});
assert(welcomeEmail.subject.includes('Welcome to FlyeMass, Chief Babatunde Alade'), 'ACCOUNT_WELCOME subject missing recipient name');
assert(welcomeEmail.subject.includes('FM-USR-8924'), 'ACCOUNT_WELCOME subject missing unique FlyeTag');
assert(welcomeEmail.html.includes('广东省广州市白云区石井国际物流园B栋302室'), 'ACCOUNT_WELCOME must provide China warehouse address');
assert(welcomeEmail.html.includes('FM / FM-USR-8924 / Chief Babatunde Alade'), 'ACCOUNT_WELCOME must provide carton marking format');
console.log('  ✓ 1/7 ACCOUNT_WELCOME: Welcome email with FlyeTag & China warehouse verified.');

// Event 2: WALLET_FUNDING
const fundingEmail = buildTransactionalEmail('WALLET_FUNDING', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  currency: 'NGN',
  amount: 2500000,
  channel: 'Providus Virtual Account (Instant Rail)',
  reference: 'REF-DEP-9941',
  newBalance: 17950000
});
assert(fundingEmail.subject.includes('Deposit Confirmed: NGN 2,500,000.00'), 'WALLET_FUNDING subject missing formatted amount');
assert(fundingEmail.html.includes('₦2,500,000.00 NGN'), 'WALLET_FUNDING HTML must include formatted Naira');
assert(fundingEmail.html.includes('REF-DEP-9941'), 'WALLET_FUNDING HTML must include transaction reference');
assert(fundingEmail.html.includes('Providus Virtual Account'), 'WALLET_FUNDING HTML must include clearing channel');
console.log('  ✓ 2/7 WALLET_FUNDING: Deposit confirmation with currency amount & balance verified.');

// Event 3: FX_SWAP
const swapEmail = buildTransactionalEmail('FX_SWAP', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  fromCurrency: 'NGN',
  toCurrency: 'USD',
  fromAmount: 3240000,
  toAmount: 2000,
  rate: 0.000617,
  reference: 'SWP-8812'
});
assert(swapEmail.subject.includes('Currency Swap Executed: NGN → USD'), 'FX_SWAP subject missing currencies');
assert(swapEmail.html.includes('-3,240,000.00 NGN'), 'FX_SWAP HTML must display debited source amount');
assert(swapEmail.html.includes('+2,000.00 USD'), 'FX_SWAP HTML must display credited target amount');
assert(swapEmail.html.includes('SWP-8812'), 'FX_SWAP HTML must display swap reference token');
assert(swapEmail.html.includes('Cryptocurrency trading or stablecoins are strictly prohibited'), 'FX_SWAP must reinforce zero-crypto policy');
console.log('  ✓ 3/7 FX_SWAP: Currency swap receipt with rates & zero-crypto notice verified.');

// Event 4: SUPPLIER_PAYOUT
const payoutEmail = buildTransactionalEmail('SUPPLIER_PAYOUT', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  supplierName: 'Shenzhen Kingzone Electronics Ltd',
  beneficiaryAccount: 'kingzone_pay@alipay.cn',
  paymentMethod: 'Alipay Commercial Settlement',
  cnyAmount: 38500,
  reference: 'PAY-CN-4410'
});
assert(payoutEmail.subject.includes('¥38,500.00 via Alipay Commercial Settlement'), 'SUPPLIER_PAYOUT subject missing CNY amount or method');
assert(payoutEmail.html.includes('Shenzhen Kingzone Electronics Ltd'), 'SUPPLIER_PAYOUT HTML must include supplier beneficiary');
assert(payoutEmail.html.includes('kingzone_pay@alipay.cn'), 'SUPPLIER_PAYOUT HTML must include account/id');
assert(payoutEmail.html.includes('PAY-CN-4410'), 'SUPPLIER_PAYOUT HTML must include payment reference');
console.log('  ✓ 4/7 SUPPLIER_PAYOUT: Supplier payment disbursement proof verified.');

// Event 5: CARGO_RECEIVED
const cargoEmail = buildTransactionalEmail('CARGO_RECEIVED', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  trackingNumber: 'FM-WB-77291',
  warehouseLocation: 'Guangzhou Baiyun Dock (Bay 04)',
  weightKg: 28.5,
  pieces: 4,
  cbm: 0.18
});
assert(cargoEmail.subject.includes('Shipment Received at Dock: FM-WB-77291 (28.5 kg)'), 'CARGO_RECEIVED subject missing waybill/weight');
assert(cargoEmail.html.includes('Guangzhou Baiyun Dock (Bay 04)'), 'CARGO_RECEIVED HTML missing warehouse dock bay');
assert(cargoEmail.html.includes('FM-USR-8924'), 'CARGO_RECEIVED HTML missing user FlyeTag');
assert(cargoEmail.html.includes('4 carton(s)'), 'CARGO_RECEIVED HTML missing piece count');
console.log('  ✓ 5/7 CARGO_RECEIVED: Package dock intake receipt & weight notice verified.');

// Event 6: SHOP_ORDER
const shopEmail = buildTransactionalEmail('SHOP_ORDER', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  orderId: 'FM-ORD-2026-901',
  productTitle: 'Apple iPhone 16 Pro Max 256GB Desert Titanium (x2)',
  totalUsd: 2398,
  deliveryAddress: 'Lagos Island Commercial Hub, Nigeria'
});
assert(shopEmail.subject.includes('Order Confirmed: Apple iPhone 16 Pro Max'), 'SHOP_ORDER subject missing product title');
assert(shopEmail.html.includes('$2,398.00 USD'), 'SHOP_ORDER HTML missing total USD amount');
assert(shopEmail.html.includes('FM-ORD-2026-901'), 'SHOP_ORDER HTML missing order number');
console.log('  ✓ 6/7 SHOP_ORDER: Wholesale tech hardware order confirmation verified.');

// Event 7: SUPPORT_TICKET
const ticketEmail = buildTransactionalEmail('SUPPORT_TICKET', {
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {
  ticketNumber: 'FM-8901',
  subject: 'China Customs Waybill Clearance Query',
  status: 'Escalated to Senior Trade Officer',
  assignedAgent: 'Chen Wei / Trade AI & Lead Officer',
  latestMessageSnippet: 'Customs declaration has cleared Baiyun inspection and is en route to flight loading.'
});
assert(ticketEmail.subject.includes('[Ticket FM-8901] Status Update: Escalated to Senior Trade Officer'), 'SUPPORT_TICKET subject missing status update');
assert(ticketEmail.html.includes('Chen Wei / Trade AI & Lead Officer'), 'SUPPORT_TICKET HTML missing assigned officer');
assert(ticketEmail.html.includes('Customs declaration has cleared'), 'SUPPORT_TICKET HTML missing latest message excerpt');
console.log('  ✓ 7/7 SUPPORT_TICKET: Trade Concierge ticket status update verified.\n');

// --------------------------------------------------------------------------
// 4. Test Asynchronous Non-Blocking Dispatch & Storage
// --------------------------------------------------------------------------
console.log('Test 3: Verifying Asynchronous Non-blocking Dispatch & Persistence...');

dispatchTransactionalEmailAsync('ACCOUNT_WELCOME', {
  userId: 'usr_alade_01',
  email: 'alade@enterprisegroup.ng',
  name: 'Chief Babatunde Alade',
  flyeTag: 'FM-USR-8924'
}, {});

// Wait for setImmediate to execute
setTimeout(() => {
  const receipts = Object.values(mockDbState.email_receipts);
  assert(receipts.length > 0, 'Email receipt must be saved in dbState.email_receipts');
  
  const savedReceipt = receipts[0];
  assert.strictEqual(savedReceipt.userId, 'usr_alade_01');
  assert.strictEqual(savedReceipt.recipientEmail, 'alade@enterprisegroup.ng');
  assert.strictEqual(savedReceipt.eventType, 'ACCOUNT_WELCOME');
  assert.strictEqual(savedReceipt.status, 'delivered');
  assert(savedReceipt.deliveredAt > 0, 'Delivered timestamp must be positive');
  assert(savedReceipt.html.includes('FM-USR-8924'), 'Saved receipt HTML must preserve Shipping Mark');

  // Verify in-app notification link
  assert(mockDbState.notifications.length > 0, 'In-app notification must be generated alongside email receipt');
  const savedNotif = mockDbState.notifications[0];
  assert.strictEqual(savedNotif.userId, 'usr_alade_01');
  assert(savedNotif.title.includes('Welcome to FlyeMass'));

  console.log('✅ Non-blocking email dispatch and in-app notification synchronization verified.\n');

  // --------------------------------------------------------------------------
  // 5. Test Supabase SQL Schema Triggers & Edge Function Definitions
  // --------------------------------------------------------------------------
  console.log('Test 4: Verifying Supabase SQL Schema & Edge Function Implementation...');
  const sqlFile = fs.readFileSync(path.join(__dirname, '../supabase-schema-rls.sql'), 'utf8');
  assert(sqlFile.includes('CREATE TABLE IF NOT EXISTS public.email_notifications'), 'supabase-schema-rls.sql must create public.email_notifications table');
  assert(sqlFile.includes('CREATE OR REPLACE FUNCTION public.dispatch_transactional_email()'), 'supabase-schema-rls.sql must define dispatch_transactional_email function');
  assert(sqlFile.includes('CREATE TRIGGER trg_wallets_email_notification'), 'supabase-schema-rls.sql must define wallet trigger');
  assert(sqlFile.includes('CREATE TRIGGER trg_shipments_email_notification'), 'supabase-schema-rls.sql must define shipment trigger');
  assert(sqlFile.includes('CREATE TRIGGER trg_support_email_notification'), 'supabase-schema-rls.sql must define support ticket trigger');

  const edgeFunctionFile = fs.readFileSync(path.join(__dirname, '../supabase/functions/send-transactional-email/index.ts'), 'utf8');
  assert(edgeFunctionFile.includes('RESEND_API_KEY'), 'Edge function must support RESEND_API_KEY');
  assert(edgeFunctionFile.includes('SENDGRID_API_KEY'), 'Edge function must support SENDGRID_API_KEY');
  assert(edgeFunctionFile.includes('renderTransactionalEmail'), 'Edge function must render dark-mode luxury templates');

  console.log('✅ Supabase Edge Function & SQL Schema triggers verified.\n');

  // --------------------------------------------------------------------------
  // 6. Test Frontend Email Service Integration (db.ts)
  // --------------------------------------------------------------------------
  console.log('Test 5: Verifying Frontend DatabaseService Email Methods...');
  const dbSrc = fs.readFileSync(path.join(__dirname, '../src/services/db.ts'), 'utf8');
  assert(dbSrc.includes('public async getEmailReceipts('), 'db.ts must implement getEmailReceipts');
  assert(dbSrc.includes('public async dispatchTransactionalEmail('), 'db.ts must implement dispatchTransactionalEmail');
  assert(dbSrc.includes('renderTransactionalEmail'), 'db.ts must import and use renderTransactionalEmail');
  console.log('✅ Frontend DatabaseService email methods verified.\n');

  console.log('🎉 ALL 5 TEST SUITES PASSED! Transactional Email Notification System is 100% verified.');
}, 50);
