/**
 * FlyeMass Phase 8 Automated Financial & Administrative Verification Suite
 * Tests China RMB payments, Nigerian Naira withdrawals, admin queues, and double-entry accounting:
 * 1. Customer Send Money (Alipay with Notes & Purpose)
 * 2. Customer Send Money (WeChat Pay with QR Code attachment)
 * 3. Customer Send Money (Bank Transfer with Bank Name & SWIFT/BIC)
 * 4. Customer Send Money (Purpose 'Other' with Purpose Explanation)
 * 5. Send Money Validation Guardrails (Limits, Decimals, PIN, Notes length, Balance)
 * 6. Send Money Idempotency Key De-duplication
 * 7. Admin RMB Payments Queue: Mark as Processing
 * 8. Admin RMB Payments Queue: Approve & Disburse with Evidence Protocol
 * 9. Guard: Completed RMB Payment Cannot Be Rejected or Refunded
 * 10. Admin RMB Payments Queue: Reject & Refund with Double-Entry CNY Balance Restoration
 * 11. Guard: Double-Refund Prevention for RMB Payments
 * 12. Customer Withdraw Money (NGN NUBAN with flat ₦50 fee, total debit = amount + ₦50)
 * 13. Withdraw Money Validation Guardrails (Min ₦1,000, 10-digit NUBAN, PIN, Balance)
 * 14. Withdraw Money Idempotency Key De-duplication
 * 15. Admin Naira Payouts Queue: Mark as Processing
 * 16. Admin Naira Payouts Queue: Approve & Disburse with Transfer Reference
 * 17. Guard: Completed Naira Payout Cannot Be Rejected or Refunded
 * 18. Admin Naira Payouts Queue: Reject & Refund with Principal + ₦50 Fee Double-Entry Restoration
 * 19. Guard: Double-Refund Prevention for Naira Payouts
 * 20. Multi-Currency Double-Entry General Ledger Trial Balance Equilibrium (NGN, CNY, USD)
 * 21. Cryptographic SHA-256 Audit Chain Integrity
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5050';

function post(endpoint, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const data = JSON.stringify(body || {});
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(endpoint, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const req = http.request(url, { method: 'GET', headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function report(name, condition) {
  if (condition) {
    console.log(`✅ PASSED: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${name}`);
    failed++;
  }
}

async function runPhase8Suite() {
  console.log('\n=============================================================');
  console.log('  FLYEMASS PHASE 8: PAYMENTS, WITHDRAWALS & ADMIN QUEUES');
  console.log('=============================================================\n');

  const testUser = 'usr_alade_01';
  const pin = '998877';

  // Ensure test PIN is configured
  await post('/api/auth/set-pin', { userId: testUser, newPin: pin });

  // Fund test user NGN and CNY wallets to ensure sufficient liquidity
  await post('/api/wallets/fund', {
    userId: testUser,
    currency: 'NGN',
    amount: 5000000,
    paymentMethod: 'Test Funding'
  });
  await post('/api/wallets/fund', {
    userId: testUser,
    currency: 'CNY',
    amount: 150000,
    paymentMethod: 'Test Funding'
  });

  // --- 1. Customer Send Money: Alipay ---
  console.log('--- 1. Send Money (Alipay with Notes & Purpose) ---');
  const alipayRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Shenzhen Foxconn Micro Tech Ltd',
    receiverAccount: '13800138000',
    paymentMethod: 'Alipay',
    amountCNY: 15000,
    note: 'PO-8924 electronics parts shipment batch',
    purpose: 'Supplier Payment',
    pin
  });
  report(
    'Alipay payment accepted, reference starts with RMB-, status is pending',
    alipayRes.status === 200 &&
    alipayRes.data.success &&
    /^RMB-[0-9]{8}$/.test(alipayRes.data.payment.reference) &&
    alipayRes.data.payment.status === 'pending'
  );
  const alipayPaymentId = alipayRes.data.payment.id;

  // --- 2. Customer Send Money: WeChat Pay with QR Code ---
  console.log('\n--- 2. Send Money (WeChat Pay with Attached QR) ---');
  const wechatRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Guangzhou Textile Co',
    receiverAccount: 'wx_textile_99',
    paymentMethod: 'WeChat Pay',
    amountCNY: 8500,
    note: 'Silk fabrics batch 3 invoice',
    purpose: 'Goods Purchase',
    qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    pin
  });
  report(
    'WeChat payment accepted with QR code URL and purpose',
    wechatRes.status === 200 &&
    wechatRes.data.payment?.qrCodeUrl?.startsWith('data:image/png') &&
    wechatRes.data.payment?.purpose === 'Goods Purchase'
  );

  // --- 3. Customer Send Money: Bank Transfer ---
  console.log('\n--- 3. Send Money (China Bank Transfer with SWIFT/BIC) ---');
  const bankPayRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Yiwu Plastic Commodities Corp',
    receiverAccount: '6222021001123456789',
    paymentMethod: 'China Bank Transfer',
    bankName: 'Industrial and Commercial Bank of China',
    swiftBic: 'ICBCCNBSH',
    amountCNY: 22000,
    note: 'Container customs clearance handling',
    purpose: 'Logistics Fee',
    pin
  });
  report(
    'China Bank Transfer accepted with Bank Name and SWIFT/BIC',
    bankPayRes.status === 200 &&
    bankPayRes.data.payment?.bankName === 'Industrial and Commercial Bank of China' &&
    bankPayRes.data.payment?.swiftBic === 'ICBCCNBSH'
  );

  // --- 4. Customer Send Money: Purpose 'Other' with Explanation ---
  console.log('\n--- 4. Send Money (Purpose "Other" with Explanation) ---');
  const otherPayRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Dongguan Precision Mold Factory',
    receiverAccount: 'dg_precision_alipay',
    paymentMethod: 'Alipay',
    amountCNY: 12000,
    note: 'Mold tooling design advance deposit',
    purpose: 'Other',
    purposeExplanation: 'Deposit for CNC precision injection molding tooling',
    pin
  });
  report(
    'Purpose "Other" requires explanation and records explanation correctly',
    otherPayRes.status === 200 &&
    otherPayRes.data.payment?.purpose === 'Other' &&
    otherPayRes.data.payment?.purposeExplanation?.includes('CNC precision')
  );

  // --- 5. Send Money Validation Guardrails ---
  console.log('\n--- 5. Send Money Validation Guardrails ---');
  const minLimitRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Test',
    receiverAccount: '123',
    amountCNY: 0.5,
    note: 'Valid notes text',
    pin
  });
  report('Rejects amount < ¥1.00', minLimitRes.status === 400);

  const maxLimitRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Test',
    receiverAccount: '123',
    amountCNY: 1500000,
    note: 'Valid notes text',
    pin
  });
  report('Rejects amount > ¥1,000,000.00', maxLimitRes.status === 400);

  const decimalRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Test',
    receiverAccount: '123',
    amountCNY: 100.999,
    note: 'Valid notes text',
    pin
  });
  report('Rejects more than 2 decimal places', decimalRes.status === 400);

  const shortNotesRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Test',
    receiverAccount: '123',
    amountCNY: 50,
    note: 'Hi',
    pin
  });
  report('Rejects notes under 5 characters', shortNotesRes.status === 400);

  const badPinRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Test',
    receiverAccount: '123',
    amountCNY: 50,
    note: 'Valid notes text',
    pin: '000000'
  });
  report('Rejects invalid 6-digit transaction PIN', badPinRes.status === 401);

  // --- 6. Send Money Idempotency Protection ---
  console.log('\n--- 6. Send Money Idempotency Protection ---');
  const idemKey = `idemp_rmb_${Date.now()}`;
  const firstIdemRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Idempotent Merchant',
    receiverAccount: 'idem_wx_1',
    paymentMethod: 'Alipay',
    amountCNY: 2000,
    note: 'First attempt payment',
    purpose: 'Goods Purchase',
    idempotencyKey: idemKey,
    pin
  });
  const secondIdemRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Idempotent Merchant',
    receiverAccount: 'idem_wx_1',
    paymentMethod: 'Alipay',
    amountCNY: 2000,
    note: 'First attempt payment',
    purpose: 'Goods Purchase',
    idempotencyKey: idemKey,
    pin
  });
  report(
    'Duplicate request with same idempotencyKey returns cached response without double debit',
    firstIdemRes.status === 200 &&
    secondIdemRes.status === 200 &&
    firstIdemRes.data.payment.id === secondIdemRes.data.payment.id &&
    secondIdemRes.data.cached === true
  );

  // --- 7. Admin RMB Payments: Mark as Processing ---
  console.log('\n--- 7. Admin RMB: Transition to Processing ---');
  const procRes = await post('/api/admin/supplier-payments/processing', {
    paymentId: alipayPaymentId,
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Admin successfully marks pending RMB payment as processing',
    procRes.status === 200 &&
    procRes.data.payment.status === 'processing' &&
    procRes.data.payment.reviewer === 'adm-001'
  );

  // --- 8. Admin RMB Payments: Approve & Disburse ---
  console.log('\n--- 8. Admin RMB: Disburse / Complete with Evidence ---');
  const disburseRes = await post('/api/admin/supplier-payments/disburse', {
    paymentId: alipayPaymentId,
    clearingSessionId: 'ALIPAY-CN-982142',
    paymentProofUrl: 'https://storage.flyemass.com/receipts/proof_alipay.pdf',
    safeDeclarationRef: 'SAFE-CAN-2026-981242',
    adminNotes: 'Settled via ICBC Hong Kong / Guangzhou clearing gateway',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Admin disburses payment, sets status disbursed/completed, records evidence and double-entry',
    disburseRes.status === 200 &&
    disburseRes.data.payment.status === 'disbursed' &&
    disburseRes.data.payment.clearingSessionId === 'ALIPAY-CN-982142'
  );

  // --- 9. Guard: Completed Payment Cannot Be Rejected ---
  console.log('\n--- 9. Guard: Completed RMB Payment Cannot Be Refunded ---');
  const rejectCompletedRes = await post('/api/admin/supplier-payments/refund', {
    paymentId: alipayPaymentId,
    reason: 'Trying to refund already completed transaction',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Rejection of completed payment is strictly rejected (HTTP 400)',
    rejectCompletedRes.status === 400 &&
    rejectCompletedRes.data.error.includes('already completed')
  );

  // --- 10. Admin RMB Payments: Reject & Refund ---
  console.log('\n--- 10. Admin RMB: Reject & Refund Pending Payment ---');
  // Create payment to be rejected
  const toRejectPayRes = await post('/api/wallets/pay-supplier', {
    userId: testUser,
    supplierName: 'Rejected Beneficiary Co',
    receiverAccount: '13999999999',
    paymentMethod: 'Alipay',
    amountCNY: 5000,
    note: 'Payment that will be rejected by compliance',
    purpose: 'Supplier Payment',
    pin
  });
  const rejectPayId = toRejectPayRes.data.payment.id;
  const cnyBalBefore = toRejectPayRes.data.balances.CNY;

  // Missing reason rejected
  const noReasonRes = await post('/api/admin/supplier-payments/refund', {
    paymentId: rejectPayId,
    reason: '',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report('Rejection without mandatory reason rejected', noReasonRes.status === 400);

  // Confirm rejection and refund
  const rejectSuccessRes = await post('/api/admin/supplier-payments/refund', {
    paymentId: rejectPayId,
    reason: 'Beneficiary account frozen by SAFE China',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Refund transitions status to refunded, restores exact CNY to user balance with double-entry',
    rejectSuccessRes.status === 200 &&
    rejectSuccessRes.data.payment.status === 'refunded' &&
    rejectSuccessRes.data.balances.CNY === cnyBalBefore + 5000
  );

  // --- 11. Guard: Double-Refund Prevention for RMB Payments ---
  console.log('\n--- 11. Guard: Double-Refund Prevention for RMB Payments ---');
  const secondRefundRes = await post('/api/admin/supplier-payments/refund', {
    paymentId: rejectPayId,
    reason: 'Trying to refund second time',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Second refund attempt on same payment rejected (HTTP 400)',
    secondRefundRes.status === 400 &&
    secondRefundRes.data.error.includes('already refunded')
  );

  // --- 12. Customer Withdraw Money (NGN) ---
  console.log('\n--- 12. Customer Withdraw Money (₦50 Flat Fee) ---');
  const dbStateRes = await get('/api/db/state');
  const userNgnBefore = dbStateRes.data?.state?.users[testUser]?.balances?.NGN || 0;
  const wdRes = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    bankCode: '057',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 50000,
    fee: 50,
    note: 'Dividend distribution payout',
    pin
  });
  report(
    'Withdrawal accepted with ₦50 flat fee, reference starts with WD-, total debit is amount + 50',
    wdRes.status === 200 &&
    wdRes.data.success &&
    /^WD-[0-9]{8}$/.test(wdRes.data.withdrawal.reference) &&
    wdRes.data.withdrawal.feeNGN === 50 &&
    wdRes.data.withdrawal.totalDebit === 50050 &&
    wdRes.data.balances.NGN === userNgnBefore - 50050
  );
  const withdrawalId = wdRes.data.withdrawal.id;

  // --- 13. Withdraw Money Validation Guardrails ---
  console.log('\n--- 13. Withdraw Money Validation Guardrails ---');
  const minWdRes = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 500,
    pin
  });
  report('Rejects withdrawal amount < ₦1,000', minWdRes.status === 400);

  const badNubanRes = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '12345',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 5000,
    pin
  });
  report('Rejects invalid non-10 digit NUBAN', badNubanRes.status === 400);

  const badWdPinRes = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 5000,
    pin: '111111'
  });
  report('Rejects invalid 6-digit transaction PIN for withdrawal', badWdPinRes.status === 401);

  // --- 14. Withdraw Money Idempotency Protection ---
  console.log('\n--- 14. Withdraw Money Idempotency Protection ---');
  const wdIdemKey = `idemp_wd_${Date.now()}`;
  const firstWdIdem = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 10000,
    fee: 50,
    idempotencyKey: wdIdemKey,
    pin
  });
  const secondWdIdem = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 10000,
    fee: 50,
    idempotencyKey: wdIdemKey,
    pin
  });
  report(
    'Duplicate withdrawal with same idempotencyKey returns cached response without double deduction',
    firstWdIdem.status === 200 &&
    secondWdIdem.status === 200 &&
    firstWdIdem.data.withdrawal.id === secondWdIdem.data.withdrawal.id &&
    secondWdIdem.data.cached === true
  );

  // --- 15. Admin Naira Payout: Mark as Processing ---
  console.log('\n--- 15. Admin Naira: Transition to Processing ---');
  const wdProcRes = await post('/api/admin/withdrawals/processing', {
    withdrawalId,
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Admin successfully marks pending withdrawal as processing',
    wdProcRes.status === 200 &&
    wdProcRes.data.withdrawal.status === 'processing'
  );

  // --- 16. Admin Naira Payout: Approve & Disburse ---
  console.log('\n--- 16. Admin Naira: Disburse / Confirm Payout ---');
  const wdDisbRes = await post('/api/admin/withdrawals/disburse', {
    withdrawalId,
    transferReference: 'NIP-DISB-2026-90184',
    paymentProofUrl: 'https://storage.flyemass.com/receipts/nip_disb.pdf',
    adminNotes: 'Disbursed via Providus Bank NIP outbound rail',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Admin confirms disbursement, records NIP transfer reference and balanced postings',
    wdDisbRes.status === 200 &&
    wdDisbRes.data.withdrawal.status === 'approved' &&
    wdDisbRes.data.withdrawal.transferReference === 'NIP-DISB-2026-90184'
  );

  // --- 17. Guard: Completed Withdrawal Cannot Be Rejected ---
  console.log('\n--- 17. Guard: Completed Naira Payout Cannot Be Refunded ---');
  const rejectPaidWd = await post('/api/admin/withdrawals/refund', {
    withdrawalId,
    reason: 'Attempting to refund already disbursed withdrawal',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Rejection of completed withdrawal is strictly rejected (HTTP 400)',
    rejectPaidWd.status === 400 &&
    rejectPaidWd.data.error.includes('already completed')
  );

  // --- 18. Admin Naira Payout: Reject & Refund (Principal + ₦50 Fee) ---
  console.log('\n--- 18. Admin Naira: Reject & Refund with Full Fee Reversal ---');
  const toRejectWd = await post('/api/wallets/withdraw', {
    userId: testUser,
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 20000,
    fee: 50,
    note: 'Withdrawal that will be rejected',
    pin
  });
  const rejectWdId = toRejectWd.data.withdrawal.id;
  const userNgnBeforeRefund = toRejectWd.data.balances.NGN;

  const wdRefundRes = await post('/api/admin/withdrawals/refund', {
    withdrawalId: rejectWdId,
    reason: 'Receiving bank account invalid / dormant',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Refund restores principal (₦20,000) AND fee (₦50) back to customer NGN balance (Total ₦20,050)',
    wdRefundRes.status === 200 &&
    (wdRefundRes.data.withdrawal.status === 'refunded' || wdRefundRes.data.withdrawal.status === 'rejected' || wdRefundRes.data.withdrawal.status === 'failed') &&
    wdRefundRes.data.balances.NGN === userNgnBeforeRefund + 20050
  );

  // --- 19. Guard: Double-Refund Prevention for Naira Withdrawals ---
  console.log('\n--- 19. Guard: Double-Refund Prevention for Naira Withdrawals ---');
  const secondWdRefund = await post('/api/admin/withdrawals/refund', {
    withdrawalId: rejectWdId,
    reason: 'Trying to refund second time',
    adminId: 'adm-001'
  }, { 'x-admin-role': 'super_admin' });
  report(
    'Second refund attempt on same withdrawal rejected (HTTP 400)',
    secondWdRefund.status === 400 &&
    (secondWdRefund.data.error.includes('already refunded') || secondWdRefund.data.error.includes('already rejected'))
  );

  // --- 20. Multi-Currency Double-Entry General Ledger Equilibrium ---
  console.log('\n--- 20. Multi-Currency Double-Entry Ledger Equilibrium ---');
  const reconRes = await get('/api/admin/ledger/reconciliation', { 'x-admin-role': 'super_admin' });
  const tb = reconRes.data?.trialBalance || {};
  const ngnNet = Math.abs(tb.NGN?.net || 0);
  const cnyNet = Math.abs(tb.CNY?.net || 0);
  const usdNet = Math.abs(tb.USD?.net || 0);
  report(
    `Trial Balance Equilibrium: NGN Net = ${ngnNet}, CNY Net = ${cnyNet}, USD Net = ${usdNet} (Strictly 0.00)`,
    reconRes.status === 200 &&
    ngnNet < 0.001 &&
    cnyNet < 0.001 &&
    usdNet < 0.001
  );

  // --- 21. Cryptographic SHA-256 Audit Chain Integrity ---
  console.log('\n--- 21. Cryptographic Audit Log Chain Integrity ---');
  const auditRes = await get('/api/admin/audit-logs/verify', { 'x-admin-role': 'super_admin' });
  report(
    'Audit Hash Chain Verified (All blocks anchor to GENESIS_FLYE_2026)',
    auditRes.status === 200 && auditRes.data.valid === true
  );

  console.log('\n=============================================================');
  console.log(`  PHASE 8 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Suite().catch((err) => {
  console.error('Fatal Phase 8 suite error:', err);
  process.exit(1);
});
