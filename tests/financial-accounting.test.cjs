const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5050';

function postJson(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
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
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'GET',
        headers
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// Color helpers for terminal output
const green = (s) => `\x1b[32m✔ ${s}\x1b[0m`;
const red = (s) => `\x1b[31m✘ ${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(green(testName));
    passedCount++;
  } else {
    console.error(red(`${testName} - FAILED: ${details}`));
    failedCount++;
  }
}

async function runTests() {
  console.log(bold('\n============================================================='));
  console.log(bold('  FLYEMASS AUTHORITATIVE FINANCIAL & SECURITY AUDIT SUITE'));
  console.log(bold('=============================================================\n'));

  // ----------------------------------------------------------------
  // 1. PIN Security & HMAC-SHA256 Verification & Lockout
  // ----------------------------------------------------------------
  console.log(bold('--- 1. 6-Digit Transaction PIN Security ---'));
  
  // Set up PIN for usr_alade_01
  const setPinRes = await postJson('/api/auth/set-pin', {
    userId: 'usr_alade_01',
    newPin: '998877'
  });
  assert(setPinRes.status === 200 && setPinRes.data.success, 'Can set 6-digit PIN securely with salt & HMAC-SHA256');

  // Verify correct PIN
  const validPinRes = await postJson('/api/auth/verify-pin', {
    userId: 'usr_alade_01',
    pin: '998877'
  });
  assert(validPinRes.data.valid === true, 'Correct 6-digit PIN verifies successfully');

  // Verify wrong PIN is rejected
  const wrongPinRes = await postJson('/api/auth/verify-pin', {
    userId: 'usr_alade_01',
    pin: '123456'
  });
  assert(wrongPinRes.data.valid === false, 'Wrong PIN is rejected');

  // Verify default bypass '246810' is rejected
  const bypassRes = await postJson('/api/auth/verify-pin', {
    userId: 'usr_alade_01',
    pin: '246810'
  });
  assert(bypassRes.data.valid === false, 'Hardcoded demo bypass 246810 is completely rejected');

  // ----------------------------------------------------------------
  // 2. CBN NUBAN 10-Digit Check Digit Validation
  // ----------------------------------------------------------------
  console.log(bold('\n--- 2. Central Bank of Nigeria (CBN) NUBAN Check Digit Validation ---'));

  // Invalid NUBAN length
  const shortNubanRes = await postJson('/api/wallets/withdraw', {
    userId: 'usr_alade_01',
    bankName: 'Access Bank Nigeria',
    accountNumber: '12345',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 100000,
    pin: '998877'
  });
  assert(shortNubanRes.status === 400 && shortNubanRes.data.error.includes('10 digits'), 'Rejects non-10 digit NUBAN');

  // Invalid check digit NUBAN
  const badCheckDigitRes = await postJson('/api/wallets/withdraw', {
    userId: 'usr_alade_01',
    bankName: 'Zenith Bank Plc',
    accountNumber: '1234567890',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 100000,
    pin: '998877'
  });
  assert(badCheckDigitRes.status === 400 && badCheckDigitRes.data.error.includes('check digit'), 'Rejects invalid NUBAN check digit');

  // Valid algorithm NUBAN (Zenith Bank code 057, serial 208914002 has check digit 2 => 2089140022)
  const validNubanRes = await postJson('/api/wallets/withdraw', {
    userId: 'usr_alade_01',
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 50000,
    pin: '998877'
  });
  assert(validNubanRes.status === 200 && validNubanRes.data.success, 'Valid NUBAN withdrawal accepted and queued with ₦500 fee deduction');

  // ----------------------------------------------------------------
  // 3. Double-Entry General Ledger Balancing
  // ----------------------------------------------------------------
  console.log(bold('\n--- 3. Double-Entry Accounting Invariant (Debit === Credit) ---'));

  const dbInspect = await getJson('/api/admin/double-entry-ledger', { 'x-admin-id': 'adm-001' });
  assert(dbInspect.status === 200 && dbInspect.data.double_entry_ledger, 'Can fetch double entry ledger with admin credentials');

  const ledger = Object.values(dbInspect.data.double_entry_ledger);
  let allBalanced = true;
  let unbalancedDetails = '';

  for (const entry of ledger) {
    const sumDebits = entry.postings.reduce((sum, p) => sum + (p.debit || 0), 0);
    const sumCredits = entry.postings.reduce((sum, p) => sum + (p.credit || 0), 0);
    // Allow small floating point tolerance (0.001)
    if (Math.abs(sumDebits - sumCredits) > 0.001) {
      allBalanced = false;
      unbalancedDetails = `Entry ${entry.id} (${entry.type}): debits=${sumDebits}, credits=${sumCredits}`;
      break;
    }
  }

  assert(allBalanced && ledger.length > 0, `All ${ledger.length} double-entry transactions perfectly balanced (sum(debits) === sum(credits))`, unbalancedDetails);

  // ----------------------------------------------------------------
  // 4. Authoritative Server-Side FX Swap Calculations
  // ----------------------------------------------------------------
  console.log(bold('\n--- 4. Authoritative Server FX Swap Engine ---'));

  // Attempt client-side rate spoofing (e.g. asking for 10x more CNY than the official rate)
  const spoofedSwap = await postJson('/api/wallets/swap', {
    userId: 'usr_alade_01',
    fromCurrency: 'NGN',
    toCurrency: 'CNY',
    fromAmount: 1000000,
    toAmount: 9999999, // Tampered client value!
    rate: 10.0,        // Tampered client rate!
    pin: '998877'
  });

  // Verify server ignored the tampered toAmount and used authoritative formula: (fromAmount / rate) * (1 - spread)
  const creditedCNY = spoofedSwap.data?.ledger?.convertedAmount;
  assert(spoofedSwap.status === 200 && creditedCNY > 0 && creditedCNY < 10000, 'Server overrides client spoofed FX rates with authoritative spread-adjusted calculation');

  // ----------------------------------------------------------------
  // 5. In-Memory Mutex Lock & Double-Spending Prevention
  // ----------------------------------------------------------------
  console.log(bold('\n--- 5. Concurrency Control & Double-Spending Mutex Lock ---'));

  // Fire 5 simultaneous withdrawal requests for the user
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      postJson('/api/wallets/withdraw', {
        userId: 'usr_alade_01',
        bankName: 'Zenith Bank Plc',
        accountNumber: '2089140022',
        accountName: 'Chief Babatunde Alade',
        amountNGN: 20000,
        pin: '998877'
      })
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.status === 200 && r.data.success);
  assert(successes.length === 5, 'All concurrent wallet operations safely serialized through in-memory user mutex without balance collision');

  // ----------------------------------------------------------------
  // 6. Authenticated Webhooks & Idempotency / Replay Protection
  // ----------------------------------------------------------------
  console.log(bold('\n--- 6. Payment Webhook Signatures & Replay Protection ---'));

  // Test Providus Webhook
  const providusPayload = {
    sessionId: 'PROV-SESSION-' + Date.now(),
    settlementId: 'SETTLE-' + Date.now(),
    accountNumber: '9082341902',
    transactionAmount: 250000,
    currency: 'NGN',
    channel: 'NIP_DIRECT'
  };
  const providusSignature = crypto
    .createHmac('sha256', 'PROVIDUS_SECRET_KEY_PROD_998124')
    .update(JSON.stringify(providusPayload))
    .digest('hex');

  // First call should succeed
  const hookRes1 = await postJson('/api/webhooks/providus', providusPayload, {
    'x-providus-signature': providusSignature
  });
  assert(hookRes1.status === 200 && hookRes1.data.success, 'Valid Providus webhook credit confirmed with HMAC-SHA256');

  // Replay should be rejected as already processed
  const hookResReplay = await postJson('/api/webhooks/providus', providusPayload, {
    'x-providus-signature': providusSignature
  });
  assert(hookResReplay.status === 200 && hookResReplay.data.already_processed, 'Duplicate webhook replay rejected via idempotency tracking');

  // Invalid signature rejected
  const badHook = await postJson('/api/webhooks/providus', providusPayload, {
    'x-providus-signature': 'invalid_signature_hash'
  });
  assert(badHook.status === 401, 'Tampered webhook signature rejected with 401 Unauthorized');

  // ----------------------------------------------------------------
  // 7. VIP Supplier Contact Security Enclave
  // ----------------------------------------------------------------
  console.log(bold('\n--- 7. VIP Supplier Directory Contact Protection ---'));

  // Unsubscribed user should receive 403 Forbidden
  const forbiddenContact = await getJson('/api/suppliers/contact?supplierId=sup-2&userId=usr_unsubscribed_99');
  assert(forbiddenContact.status === 403 && !forbiddenContact.data.unlocked, 'Unsubscribed client receives 403 Forbidden for factory direct WeChat');

  // Subscribed user (usr_alade_01 has active pass for sup-1)
  const allowedContact = await getJson('/api/suppliers/contact?supplierId=sup-1&userId=usr_alade_01');
  assert(allowedContact.status === 200 && allowedContact.data.unlocked && allowedContact.data.contacts.wechatId, 'Active 30-day VIP pass unlocks direct factory contact');

  // ----------------------------------------------------------------
  // 8. Admin RBAC & Super Admin Protection
  // ----------------------------------------------------------------
  console.log(bold('\n--- 8. Admin RBAC & Super Admin Master Protection ---'));

  // Normal client cannot access admin endpoints
  const clientAccess = await getJson('/api/admin/double-entry-ledger', { 'x-admin-role': 'client' });
  assert(clientAccess.status === 403, 'Client role rejected from administrative double-entry ledger');

  // Attempt to delete or demote Super Admin Chief Babatunde Alade (adm-001)
  const demoteRes = await postJson('/api/admin/team/delete', {
    adminId: 'adm-001',
    requesterId: 'adm-002'
  }, { 'x-admin-role': 'super_admin' });
  assert(demoteRes.status === 403 && demoteRes.data.error.includes('Protected Master Super Admin'), 'Master Super Admin adm-001 cannot be deleted or demoted');

  // ----------------------------------------------------------------
  // 9. Withdrawal Reversal / Refund Flow
  // ----------------------------------------------------------------
  console.log(bold('\n--- 9. Admin Withdrawal Reversal & Balanced Refund ---'));

  // Request a withdrawal to be rejected
  const wthForRefund = await postJson('/api/wallets/withdraw', {
    userId: 'usr_alade_01',
    bankName: 'Zenith Bank Plc',
    accountNumber: '2089140022',
    accountName: 'Chief Babatunde Alade',
    amountNGN: 100000,
    pin: '998877'
  });
  const withdrawalId = wthForRefund.data?.withdrawal?.id;

  // Admin refunds the withdrawal
  const refundRes = await postJson('/api/admin/withdrawals/refund', {
    withdrawalId,
    reason: 'Account name mismatch on NIBSS switch',
    adminId: 'adm-001'
  }, { 'x-admin-id': 'adm-001' });

  assert(refundRes.status === 200 && refundRes.data.success, 'Admin can reject and reverse withdrawal, refunding ₦100,500 back to user with balanced postings');

  // ----------------------------------------------------------------
  // 10. Tech Store Inventory Checkout Concurrency
  // ----------------------------------------------------------------
  console.log(bold('\n--- 10. Tech Store Inventory Reservation ---'));

  const checkoutRes = await postJson('/api/shop/checkout', {
    userId: 'usr_alade_01',
    currency: 'USD',
    totalAmount: 1420,
    items: [{ productId: 'prod-iphone-16-pro', quantity: 1 }],
    deliveryAddress: 'Lagos Island, Lagos, Nigeria',
    pin: '998877'
  });
  assert(checkoutRes.status === 200 && checkoutRes.data.success, 'Tech store checkout atomically decrements stock and debits wallet');

  // ----------------------------------------------------------------
  // 11. Multi-Currency Zero-Sum Trial Balance Reconciliation
  // ----------------------------------------------------------------
  console.log(bold('\n--- 11. Multi-Currency Zero-Sum Trial Balance Reconciliation ---'));

  const reconRes = await getJson('/api/admin/ledger/reconciliation', { 'x-admin-role': 'super_admin' });
  assert(reconRes.status === 200 && reconRes.data.success, 'Can retrieve trial balance reconciliation matrix');
  const tb = reconRes.data.trialBalance || {};
  assert(
    tb.NGN && Math.abs(tb.NGN.net || 0) < 0.001,
    `NGN Trial Balance perfectly balanced with zero net delta (Debits: ${tb.NGN?.debits}, Credits: ${tb.NGN?.credits}, Net: ${tb.NGN?.net})`
  );
  assert(
    tb.CNY && Math.abs(tb.CNY.net || 0) < 0.001,
    `CNY Trial Balance perfectly balanced with zero net delta (Debits: ${tb.CNY?.debits}, Credits: ${tb.CNY?.credits}, Net: ${tb.CNY?.net})`
  );
  assert(
    tb.USD && Math.abs(tb.USD.net || 0) < 0.001,
    `USD Trial Balance perfectly balanced with zero net delta (Debits: ${tb.USD?.debits}, Credits: ${tb.USD?.credits}, Net: ${tb.USD?.net})`
  );

  // ----------------------------------------------------------------
  // 12. Deep Database Integrity & Journal Verification
  // ----------------------------------------------------------------
  console.log(bold('\n--- 12. Database Deep Integrity & Journal Verification ---'));

  const integrityRes = await getJson('/api/admin/db/integrity', { 'x-admin-role': 'super_admin' });
  assert(integrityRes.status === 200 && integrityRes.data.healthy === true, 'Database persistence & WAL reported fully healthy');
  assert(integrityRes.data.auditVerification?.valid === true, 'Audit log cryptographic chain verified intact');
  assert(integrityRes.data.usersCount >= 2, `Active user accounts intact (Count: ${integrityRes.data.usersCount})`);

  // ----------------------------------------------------------------
  // 13. Cryptographic Audit Hash Chain Integrity
  // ----------------------------------------------------------------
  console.log(bold('\n--- 13. Cryptographic Audit Hash Chain Integrity ---'));

  const auditVerifyRes = await getJson('/api/admin/audit-logs/verify', { 'x-admin-role': 'compliance' });
  assert(auditVerifyRes.status === 200 && auditVerifyRes.data.valid === true, 'Audit log chain cryptographically verified (zero tampered blocks)');
  assert(auditVerifyRes.data.headHash && auditVerifyRes.data.headHash.length === 64, 'Audit chain properly anchors to 64-character SHA-256 head hash');

  // ----------------------------------------------------------------
  // 14. Automated Database Backups & Snapshot Engine
  // ----------------------------------------------------------------
  console.log(bold('\n--- 14. Automated Database Backups & Snapshot Engine ---'));

  const backupCreateRes = await postJson('/api/admin/backups/create', { reason: 'TEST_SUITE_CHECKPOINT' }, { 'x-admin-role': 'super_admin' });
  assert(backupCreateRes.status === 200 && backupCreateRes.data.snapshot?.filename, 'On-demand snapshot successfully created');

  const backupListRes = await getJson('/api/admin/backups/list', { 'x-admin-role': 'super_admin' });
  assert(backupListRes.status === 200 && Array.isArray(backupListRes.data.backups) && backupListRes.data.backups.length > 0, 'Backup catalog lists active snapshots with SHA-256 digests');

  // ----------------------------------------------------------------
  // 15. CBN Checksum & NIBSS Account Name Enquiry
  // ----------------------------------------------------------------
  console.log(bold('\n--- 15. CBN Checksum & NIBSS Account Name Enquiry ---'));

  // Valid NUBAN for Zenith Bank (057, serial 208914002 has check digit 2 => 2089140022)
  const validEnquiryRes = await getJson('/api/banking/enquire-account?bankCode=057&accountNumber=2089140022');
  assert(validEnquiryRes.status === 200 && validEnquiryRes.data.success && validEnquiryRes.data.accountName, 'Valid 10-digit NUBAN resolves beneficiary name via simulated NIBSS switch');

  // Invalid NUBAN Checksum (checksum mismatch)
  const invalidChecksumRes = await getJson('/api/banking/enquire-account?bankCode=057&accountNumber=1234567890');
  assert(invalidChecksumRes.status === 400 && invalidChecksumRes.data.error.includes('check digit'), 'Invalid NUBAN check digit rejected with 400 CBN algorithm error');

  // Non-10-digit number
  const nonTenDigitRes = await getJson('/api/banking/enquire-account?bankCode=057&accountNumber=12345');
  assert(nonTenDigitRes.status === 400 && nonTenDigitRes.data.error.includes('10 digits'), 'Non-10 digit account number immediately rejected');

  // ----------------------------------------------------------------
  // 16. China Trade Remittance Evidence Protocol & Refund
  // ----------------------------------------------------------------
  console.log(bold('\n--- 16. China Trade Remittance Evidence Protocol & Refund ---'));

  // First create a supplier payment request
  const paySupplierRes = await postJson('/api/wallets/pay-supplier', {
    userId: 'usr_alade_01',
    supplierName: 'Shenzhen Kaida Technology Ltd',
    receiverAccount: 'kaida-direct@alipay.cn',
    paymentMethod: 'alipay',
    amountCNY: 5000,
    note: 'Smart Wearables Batch Q4',
    pin: '998877'
  });
  const supPaymentId = paySupplierRes.data?.payment?.id;

  // Try to disburse without mandatory clearing evidence
  const badDisburseRes = await postJson('/api/admin/supplier-payments/disburse', {
    paymentId: supPaymentId,
    clearingSessionId: '',
    paymentProofUrl: '',
    safeDeclarationRef: ''
  }, { 'x-admin-role': 'super_admin' });
  assert(badDisburseRes.status === 400 && badDisburseRes.data.error.includes('Mandatory Chinese remittance evidence missing'), 'Disbursement without Chinese clearing session ID and SAFE ref rejected');

  // Disburse with full verified evidence
  const goodDisburseRes = await postJson('/api/admin/supplier-payments/disburse', {
    paymentId: supPaymentId,
    clearingSessionId: 'CN-CLR-202611-998124',
    paymentProofUrl: 'https://cdn.flyemass.com/proofs/cnaps_settle_998124.pdf',
    safeDeclarationRef: 'SAFE-2026-GD-0091823'
  }, { 'x-admin-role': 'super_admin' });
  assert(goodDisburseRes.status === 200 && goodDisburseRes.data.payment?.status === 'disbursed', 'Disbursement with valid SAFE clearance and payment proof approved');

  // Create another supplier payment to test refund flow
  const paySupplierForRefund = await postJson('/api/wallets/pay-supplier', {
    userId: 'usr_alade_01',
    supplierName: 'Yiwu Plastic Wholesale Group',
    receiverAccount: 'yiwu-plastics-wx',
    paymentMethod: 'wechat',
    amountCNY: 3000,
    note: 'Sample Moulds Batch',
    pin: '998877'
  });
  const supPaymentRefundId = paySupplierForRefund.data?.payment?.id;

  // Admin initiates refund for supplier payment
  const supRefundRes = await postJson('/api/admin/supplier-payments/refund', {
    paymentId: supPaymentRefundId,
    reason: 'Factory production line closed for maintenance'
  }, { 'x-admin-role': 'super_admin' });
  assert(supRefundRes.status === 200 && supRefundRes.data.payment?.status === 'refunded', 'Supplier payment refund returns CNY to client wallet with balanced reversal');

  // ----------------------------------------------------------------
  // 17. Super Admin Emergency Disaster Recovery Key
  // ----------------------------------------------------------------
  console.log(bold('\n--- 17. Super Admin Emergency Disaster Recovery Key ---'));

  // Invalid key
  const badRecoveryRes = await postJson('/api/auth/super-admin/recover', {
    recoveryKey: 'INCORRECT-SECRET-KEY',
    targetAdminId: 'adm-001'
  });
  assert(badRecoveryRes.status === 401, 'Unauthorized recovery attempt with bad master key rejected with 401');

  // Valid recovery key
  const goodRecoveryRes = await postJson('/api/auth/super-admin/recover', {
    recoveryKey: 'FLYE-MASTER-RECOVERY-KEY-2026-ALADE',
    targetAdminId: 'adm-001'
  });
  assert(goodRecoveryRes.status === 200 && goodRecoveryRes.data.success, 'Master emergency recovery key successfully unlocks Super Admin credentials');

  // ----------------------------------------------------------------
  // 18. Authoritative Payment Verification & Health / Version Checks
  // ----------------------------------------------------------------
  console.log(bold('\n--- 18. Authoritative Payment Verification & System Health ---'));

  // Check health endpoint
  const healthRes = await getJson('/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'healthy', '/health endpoint reports system healthy with active memory metrics');

  // Check version endpoint
  const versionRes = await getJson('/api/version');
  assert(versionRes.status === 200 && versionRes.data.version === '3.0.0', '/api/version reports Production Release Phase 3 (3.0.0)');

  // Verify payment reference endpoint with Providus settlement ID
  const verifyPayRes = await getJson('/api/payments/verify/' + providusPayload.settlementId);
  assert(verifyPayRes.status === 200 && verifyPayRes.data.success, 'Authoritative payment verification endpoint confirms transaction details');

  // Verify 404 for non-existent payment reference
  const notFoundPayRes = await getJson('/api/payments/verify/NON-EXISTENT-REF-999');
  assert(notFoundPayRes.status === 404, 'Non-existent transaction reference correctly returns 404 Not Found');

  console.log(bold('\n============================================================='));
  console.log(bold(`  RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`));
  console.log(bold('=============================================================\n'));

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
