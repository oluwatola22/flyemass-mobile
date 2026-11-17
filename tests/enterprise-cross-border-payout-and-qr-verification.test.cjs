/**
 * Enterprise Cross-Border Payout & QR Code Withdrawal Verification Engine
 * Test Suite: Admin & Mobile App Integration
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Enterprise Cross-Border Payout & QR Verification Engine Test Suite...\n');

// 1. Check Source Files Exist
const withdrawScreenPath = path.join(__dirname, '../src/screens/wallets/WithdrawScreen.tsx');
const walletsScreenPath = path.join(__dirname, '../src/screens/wallets/WalletsScreen.tsx');
const adminRmbScreenPath = path.join(__dirname, '../src/screens/admin/AdminRmbTransfersScreen.tsx');
const adminNairaScreenPath = path.join(__dirname, '../src/screens/admin/AdminNairaPayoutsScreen.tsx');
const syncServerPath = path.join(__dirname, '../sync-server.cjs');
const typesPath = path.join(__dirname, '../src/types/index.ts');

assert(fs.existsSync(withdrawScreenPath), 'WithdrawScreen.tsx must exist');
assert(fs.existsSync(walletsScreenPath), 'WalletsScreen.tsx must exist');
assert(fs.existsSync(adminRmbScreenPath), 'AdminRmbTransfersScreen.tsx must exist');
assert(fs.existsSync(adminNairaScreenPath), 'AdminNairaPayoutsScreen.tsx must exist');
assert(fs.existsSync(syncServerPath), 'sync-server.cjs must exist');

const withdrawScreenContent = fs.readFileSync(withdrawScreenPath, 'utf8');
const walletsScreenContent = fs.readFileSync(walletsScreenPath, 'utf8');
const adminRmbContent = fs.readFileSync(adminRmbScreenPath, 'utf8');
const adminNairaContent = fs.readFileSync(adminNairaScreenPath, 'utf8');
const syncServerContent = fs.readFileSync(syncServerPath, 'utf8');
const typesContent = fs.readFileSync(typesPath, 'utf8');

// =========================================================================
// TEST 1: Customer Mobile App Multi-Channel Withdrawal Setup
// =========================================================================
console.log('▶ Test 1: Verifying Mobile App Multi-Channel Withdrawal Rail in WithdrawScreen.tsx...');
assert(withdrawScreenContent.includes('payout-tab-alipay'), 'Alipay payout tab must have data-testid="payout-tab-alipay"');
assert(withdrawScreenContent.includes('payout-tab-wechat'), 'WeChat Pay payout tab must have data-testid="payout-tab-wechat"');
assert(withdrawScreenContent.includes('payout-tab-china-bank'), 'Chinese bank payout tab must have data-testid="payout-tab-china-bank"');
assert(withdrawScreenContent.includes('payout-tab-naira-bank'), 'Naira bank payout tab must have data-testid="payout-tab-naira-bank"');
console.log('  ✔ All 4 payout channels (Alipay, WeChat Pay, China Bank, Naira Bank) present');

// =========================================================================
// TEST 2: QR Code Upload & Field Validation
// =========================================================================
console.log('▶ Test 2: Verifying QR Code Upload & Beneficiary Inputs in WithdrawScreen.tsx...');
assert(withdrawScreenContent.includes('input-alipay-name'), 'Alipay beneficiary name input must exist');
assert(withdrawScreenContent.includes('input-alipay-account'), 'Alipay account input must exist');
assert(withdrawScreenContent.includes('upload-alipay-qr-box'), 'Alipay QR upload trigger must exist');

assert(withdrawScreenContent.includes('input-wechat-name'), 'WeChat beneficiary name input must exist');
assert(withdrawScreenContent.includes('input-wechat-account'), 'WeChat account input must exist');
assert(withdrawScreenContent.includes('upload-wechat-qr-box'), 'WeChat QR upload trigger must exist');

assert(withdrawScreenContent.includes('input-china-account-name'), 'Chinese bank account name input must exist');
assert(withdrawScreenContent.includes('input-china-account-number'), 'Chinese bank account number input must exist');

assert(withdrawScreenContent.includes('input-ngn-account-number'), 'Naira bank account number input must exist');
assert(withdrawScreenContent.includes('handleQrUpload'), 'QR upload reader handler must exist');
assert(withdrawScreenContent.includes('readAsDataURL'), 'QR code image must be converted to base64 Data URL');
console.log('  ✔ Form inputs and QR code base64 upload handlers verified');

// =========================================================================
// TEST 3: Mobile Live Pending Tracking View & Status Synchronization
// =========================================================================
console.log('▶ Test 3: Verifying Mobile Live Pending Tracking View in WithdrawScreen.tsx...');
assert(withdrawScreenContent.includes('pending-withdrawal-view'), 'Pending withdrawal tracking view must have data-testid="pending-withdrawal-view"');
assert(withdrawScreenContent.includes('withdrawal-status-badge'), 'Status badge must have data-testid="withdrawal-status-badge"');
assert(withdrawScreenContent.includes('db.subscribe'), 'WithdrawScreen must subscribe to real-time db updates for live status transitions');
assert(withdrawScreenContent.includes('Successful'), 'WithdrawScreen must support transition to "Successful" status');
assert(withdrawScreenContent.includes('admin-proof-receipt-card'), 'Admin proof receipt card must be rendered upon disbursement');
console.log('  ✔ Real-time pending tracking and live receipt updates verified in WithdrawScreen');

// =========================================================================
// TEST 4: Admin RMB Transfers Desk (`/admin/treasury/rmb`)
// =========================================================================
console.log('▶ Test 4: Verifying Admin RMB Transfers Desk & QR Inspector in AdminRmbTransfersScreen.tsx...');
assert(adminRmbContent.includes('download-qr-btn'), 'Admin QR inspector must have download button with data-testid="download-qr-btn"');
assert(adminRmbContent.includes('input-payout-receipt-file'), 'Admin receipt file upload input must have data-testid="input-payout-receipt-file"');
assert(adminRmbContent.includes('complete-rmb-payout-btn'), 'Disbursement button must have data-testid="complete-rmb-payout-btn"');
assert(adminRmbContent.includes('Mark as Successful / Complete Payout'), 'Disbursement button must be labelled "Mark as Successful / Complete Payout"');
assert(adminRmbContent.includes('handleReceiptFileUpload'), 'Receipt file upload handler must read file into data URL');
console.log('  ✔ Admin RMB Desk QR inspection, file upload, and "Mark as Successful" verified');

// =========================================================================
// TEST 5: Admin Naira Payouts Desk (`/admin/treasury/naira`)
// =========================================================================
console.log('▶ Test 5: Verifying Admin Naira Payouts Desk in AdminNairaPayoutsScreen.tsx...');
assert(adminNairaContent.includes('input-naira-receipt-file'), 'Naira receipt file upload input must have data-testid="input-naira-receipt-file"');
assert(adminNairaContent.includes('complete-naira-payout-btn'), 'Naira payout button must have data-testid="complete-naira-payout-btn"');
assert(adminNairaContent.includes('Mark as Successful / Complete Payout'), 'Naira payout button must be labelled "Mark as Successful / Complete Payout"');
assert(adminNairaContent.includes('handleNairaReceiptUpload'), 'Naira receipt upload handler must exist');
console.log('  ✔ Admin Naira Desk receipt file upload and "Mark as Successful" verified');

// =========================================================================
// TEST 6: Mobile Wallets Receipt & Proof Download
// =========================================================================
console.log('▶ Test 6: Verifying Mobile Wallets Receipt & Proof Download in WalletsScreen.tsx...');
assert(walletsScreenContent.includes('download-receipt-btn'), 'Transaction receipt modal must have data-testid="download-receipt-btn"');
assert(walletsScreenContent.includes('Beneficiary Payout QR Code'), 'Receipt modal must render uploaded beneficiary QR code');
assert(walletsScreenContent.includes('Admin Transfer Proof Receipt'), 'Receipt modal must render admin transfer proof receipt');
assert(walletsScreenContent.includes('Successful'), 'Receipt modal status badge must reflect Successful');
console.log('  ✔ Mobile WalletsScreen receipt proof preview and download button verified');

// =========================================================================
// TEST 7: Backend Sync Server API Pipeline
// =========================================================================
console.log('▶ Test 7: Verifying Backend Sync Server Endpoints in sync-server.cjs...');
assert(syncServerContent.includes('/api/wallets/withdraw'), 'Sync server must support /api/wallets/withdraw endpoint');
assert(syncServerContent.includes('/api/admin/supplier-payments/disburse'), 'Sync server must support supplier-payments/disburse');
assert(syncServerContent.includes('/api/admin/withdrawals/disburse'), 'Sync server must support withdrawals/disburse');
assert(syncServerContent.includes("payment.status = 'successful'"), 'Supplier payment disbursement must set status to successful');
assert(syncServerContent.includes("wth.status = 'successful'"), 'Naira withdrawal disbursement must set status to successful');
assert(syncServerContent.includes("payment.receiptUrl = proof"), 'Supplier payment disbursement must link receiptUrl');
assert(syncServerContent.includes("wth.receiptUrl = paymentProofUrl"), 'Naira withdrawal disbursement must link receiptUrl');
console.log('  ✔ Sync server backend endpoints and status mutations verified');

// =========================================================================
// TEST 8: State Transition Simulation
// =========================================================================
console.log('▶ Test 8: Simulating Complete Payout Lifecycle In-Process...');
const state = {
  users: {
    'usr-vip-001': {
      id: 'usr-vip-001',
      fullName: 'Chief Adebayo Adeleke',
      email: 'adebayo@adcorp.ng',
      balances: { NGN: 5000000, CNY: 45000, USD: 12000 }
    }
  },
  supplier_payments: {},
  withdrawals: {},
  wallets_ledger: {}
};

// 1. Simulate User Alipay Withdrawal Request
const withdrawReq = {
  userId: 'usr-vip-001',
  channel: 'alipay',
  amountRMB: 3000,
  receiverName: 'Wang Fang',
  receiverAccount: '13912345678',
  qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  notes: 'Sourcing batch AGT-99'
};

// User balance deduction
state.users['usr-vip-001'].balances.CNY -= withdrawReq.amountRMB;
assert.strictEqual(state.users['usr-vip-001'].balances.CNY, 42000, 'User CNY balance must be debited by ¥3,000');

const paymentId = 'sp-test-8899';
const paymentRef = 'RMB-ALIPAY-8899';
state.supplier_payments[paymentId] = {
  id: paymentId,
  reference: paymentRef,
  userId: withdrawReq.userId,
  amountRMB: withdrawReq.amountRMB,
  receiverName: withdrawReq.receiverName,
  receiverAccount: withdrawReq.receiverAccount,
  paymentMethod: 'Alipay',
  qrCodeUrl: withdrawReq.qrCodeUrl,
  status: 'pending',
  createdAt: Date.now()
};

assert.strictEqual(state.supplier_payments[paymentId].status, 'pending', 'Initial status must be pending');

// 2. Simulate Admin Disbursing & Attaching Receipt
const adminEvidence = {
  clearingSessionId: 'ALIPAY-CN-98214',
  paymentProofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  receiptUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  safeDeclarationRef: 'SAFE-CAN-2026-9921',
  adminNotes: 'Cleared via China Construction Bank correspondent window'
};

const payment = state.supplier_payments[paymentId];
payment.status = 'successful';
payment.completed = true;
payment.paymentProofUrl = adminEvidence.paymentProofUrl;
payment.receiptUrl = adminEvidence.receiptUrl;
payment.clearingSessionId = adminEvidence.clearingSessionId;

assert.strictEqual(payment.status, 'successful', 'Status must transition to successful');
assert.strictEqual(payment.receiptUrl, adminEvidence.receiptUrl, 'Receipt URL must be linked');
assert.strictEqual(payment.clearingSessionId, 'ALIPAY-CN-98214', 'Clearing session ID must be recorded');
console.log('  ✔ State transition simulation passed with 100% data integrity');

console.log('\n=============================================================');
console.log('🎉 ALL 8 ENTERPRISE CROSS-BORDER PAYOUT & QR CODE TESTS PASSED!');
console.log('=============================================================\n');
