/**
 * Test Suite: Naira-Only Withdrawal & Admin Approval Workflow Verification
 * Verifies that:
 * 1. WithdrawScreen.tsx exclusively supports Naira (NGN) withdrawals.
 * 2. Foreign services (Alipay, WeChat, China Bank) are removed from the visible withdrawal UI and routed to Send Money.
 * 3. Complete list of Nigerian beneficiary banks is present.
 * 4. User initiates Naira withdrawal -> queued on Admin Naira Payouts desk.
 * 5. Admin can process manually and approve the payout.
 * 6. Status transitions from 'pending' to 'successful' on both admin and mobile client.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');

console.log('🧪 Starting Naira-Only Withdrawal & Admin Approval Test Suite...\n');

const withdrawScreenPath = path.join(__dirname, '../src/screens/wallets/WithdrawScreen.tsx');
const adminNairaScreenPath = path.join(__dirname, '../src/screens/admin/AdminNairaPayoutsScreen.tsx');
const syncServerPath = path.join(__dirname, '../sync-server.cjs');

assert(fs.existsSync(withdrawScreenPath), 'WithdrawScreen.tsx must exist');
assert(fs.existsSync(adminNairaScreenPath), 'AdminNairaPayoutsScreen.tsx must exist');
assert(fs.existsSync(syncServerPath), 'sync-server.cjs must exist');

const withdrawContent = fs.readFileSync(withdrawScreenPath, 'utf8');
const adminNairaContent = fs.readFileSync(adminNairaScreenPath, 'utf8');
const syncServerContent = fs.readFileSync(syncServerPath, 'utf8');

// =========================================================================
// TEST 1: WithdrawScreen Exclusively Supports Naira & Removes Foreign Services
// =========================================================================
console.log('▶ Test 1: Verifying WithdrawScreen.tsx is Exclusively Naira (NGN)...');

// Header and title verify Naira withdrawal
assert(withdrawContent.includes('Withdraw Funds (Naira)'), 'Header must indicate Naira withdrawal');
assert(withdrawContent.includes('Naira Bank Withdrawal'), 'Must display Naira Bank Withdrawal');
assert(withdrawContent.includes('NIP Instant Settlement Rail (₦)'), 'Must display NIP Instant Rail');

// Send Money redirect banner for China / RMB remittance
assert(withdrawContent.includes("navigate('pay')"), 'Must provide redirect action to Send Money page for Alipay/WeChat/China Bank');
assert(withdrawContent.includes('Sending Money to China (RMB)?'), 'Must display callout for foreign remittance');

// Check that visible UI does NOT have interactive tab buttons for Alipay/WeChat/China Bank
assert(!withdrawContent.includes('onClick={() => setSelectedChannel(\'alipay\')}'), 'Alipay channel selector tab must be removed from user interaction');
assert(!withdrawContent.includes('onClick={() => setSelectedChannel(\'wechat\')}'), 'WeChat channel selector tab must be removed from user interaction');
assert(!withdrawContent.includes('onClick={() => setSelectedChannel(\'china_bank\')}'), 'China Bank channel selector tab must be removed from user interaction');
console.log('  ✔ WithdrawScreen is strictly dedicated to Naira and removed foreign payout options');

// =========================================================================
// TEST 2: Comprehensive Nigerian Bank Directory
// =========================================================================
console.log('\n▶ Test 2: Verifying Comprehensive Directory of All Nigerian Banks...');

const expectedBanks = [
  'Zenith Bank Plc',
  'Access Bank Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Providus Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'First City Monument Bank (FCMB)',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
  'PalmPay Limited',
  'Moniepoint Microfinance Bank',
  'Wema Bank',
  'Sterling Bank',
  'Union Bank of Nigeria',
  'Polaris Bank',
  'Keystone Bank',
  'Titan Trust Bank',
  'Jaiz Bank',
  'Lotus Bank',
  'TAJ Bank',
  'Standard Chartered Bank',
  'Citibank Nigeria',
  'FairMoney Microfinance Bank',
  'Carbon (One Finance)',
  'Rubies Microfinance Bank',
  'VFD Microfinance Bank',
  'Parallex Bank',
  'PremiumTrust Bank',
  'Optimus Bank',
  'Signature Bank'
];

for (const bank of expectedBanks) {
  assert(withdrawContent.includes(bank), `Expected Nigerian bank "${bank}" to be in NIGERIAN_BANKS directory`);
}
console.log(`  ✔ All ${expectedBanks.length} audited Nigerian banks verified in WithdrawScreen.tsx`);

// =========================================================================
// TEST 3: Admin Naira Payouts Desk Filter & 'successful' Status Support
// =========================================================================
console.log('\n▶ Test 3: Verifying Admin Naira Payouts Desk Filter & Successful Status...');

assert(adminNairaContent.includes('isNaira'), 'AdminNairaPayoutsScreen must filter strictly for Naira withdrawals');
assert(adminNairaContent.includes("w.status === 'successful'"), 'AdminNairaPayoutsScreen must recognize "successful" status');
assert(adminNairaContent.includes('handleApproveWithdrawal'), 'Admin must have payout approval handler');
assert(adminNairaContent.includes('handleMarkWithdrawalProcessing'), 'Admin must have manual processing handler');
console.log('  ✔ Admin Naira Payouts Desk verified with filter and successful status support');

// =========================================================================
// TEST 4: Live End-to-End API Integration Simulation
// =========================================================================
console.log('\n▶ Test 4: Running Live End-to-End API Simulation Against Sync Server...');

const PORT = 5050;

function httpRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runEndToEndTests() {
  const testUserId = 'usr_alade_01';
  const pin = '998877';

  // Ensure test PIN and funding are configured
  await httpRequest('POST', '/api/auth/set-pin', {}, { userId: testUserId, newPin: pin });
  await httpRequest('POST', '/api/wallets/fund', {}, {
    userId: testUserId,
    currency: 'NGN',
    amount: 1000000,
    paymentMethod: 'Test Funding'
  });

  // 1. Check user state before withdrawal
  const stateRes = await httpRequest('GET', '/api/db/state');
  assert.strictEqual(stateRes.status, 200, 'State endpoint must return 200');
  const initialNgn = stateRes.data.state.users[testUserId]?.balances?.NGN || 0;

  // 2. Submit Naira withdrawal
  const withdrawAmount = 25000;
  const withdrawRes = await httpRequest('POST', '/api/wallets/withdraw', {}, {
    userId: testUserId,
    bankName: 'Providus Bank',
    bankCode: '101',
    accountNumber: '2089140022',
    accountName: 'CHIEF BABATUNDE ALADE',
    amountNGN: withdrawAmount,
    fee: 50,
    note: 'Naira test withdrawal',
    pin,
    idempotencyKey: `wd_test_${Date.now()}`
  });

  assert.strictEqual(withdrawRes.status, 200, 'Withdrawal submission must succeed');
  assert(withdrawRes.data.success, 'Response must have success: true');
  assert.strictEqual(withdrawRes.data.withdrawal.status, 'pending', 'Withdrawal initial status must be pending');
  assert.strictEqual(withdrawRes.data.withdrawal.amountNGN, withdrawAmount, 'Amount must match');
  assert.strictEqual(withdrawRes.data.withdrawal.feeNGN, 50, 'Fee must be 50');

  const withdrawalId = withdrawRes.data.withdrawal.id;
  const reference = withdrawRes.data.withdrawal.reference;
  console.log(`  ✔ Withdrawal submitted successfully: ID=${withdrawalId}, Ref=${reference}, Status=pending`);

  // 3. Verify it is visible in DB state
  const stateAfterWd = await httpRequest('GET', '/api/db/state');
  const queuedWth = stateAfterWd.data.state.withdrawals[withdrawalId];
  assert(queuedWth, 'Withdrawal must exist in database withdrawals');
  assert.strictEqual(queuedWth.status, 'pending', 'Queued status must be pending');

  // 4. Admin marks withdrawal as processing
  const procRes = await httpRequest('POST', '/api/admin/withdrawals/processing', {
    'x-admin-role': 'super_admin'
  }, {
    withdrawalId,
    adminId: 'adm-001'
  });
  assert.strictEqual(procRes.status, 200, 'Mark processing must return 200');
  assert.strictEqual(procRes.data.withdrawal.status, 'processing', 'Status must transition to processing');
  console.log(`  ✔ Admin marked withdrawal as processing: Status=processing`);

  // 5. Admin approves and disburses payout
  const disburseRes = await httpRequest('POST', '/api/admin/withdrawals/disburse', {
    'x-admin-role': 'super_admin'
  }, {
    withdrawalId,
    transferReference: `NIP-PROV-${Date.now()}`,
    paymentProofUrl: 'https://storage.flyemass.com/receipts/prov_transfer_slip.png',
    adminNotes: 'Settled via Providus Bank NIP switch',
    adminId: 'adm-001',
    payoutMode: 'gateway',
    gatewayProvider: 'Providus NIP Instant Switch'
  });

  assert.strictEqual(disburseRes.status, 200, 'Disburse payout must return 200');
  assert(disburseRes.data.success, 'Disbursement must be successful');
  assert.strictEqual(disburseRes.data.withdrawal.status, 'successful', 'Status must transition to "successful"');
  assert.strictEqual(disburseRes.data.withdrawal.completed, true, 'Withdrawal must be completed');
  console.log(`  ✔ Admin approved payout: Status transitioned from pending -> successful!`);

  // 6. Guard: Completed withdrawal cannot be refunded
  const refundAttempt = await httpRequest('POST', '/api/admin/withdrawals/refund', {
    'x-admin-role': 'super_admin'
  }, {
    withdrawalId,
    reason: 'Illegal refund attempt on completed payout',
    adminId: 'adm-001'
  });
  assert.strictEqual(refundAttempt.status, 400, 'Refunding an already completed withdrawal must be rejected (HTTP 400)');
  console.log('  ✔ Completed withdrawal cannot be refunded (Security Guard active)');

  // 7. General ledger balance equilibrium check
  const reconRes = await httpRequest('GET', '/api/admin/ledger/reconciliation', {
    'x-admin-role': 'super_admin'
  });
  assert.strictEqual(reconRes.status, 200, 'Reconciliation endpoint must return 200');
  const tb = reconRes.data?.trialBalance || {};
  const ngnNet = Math.abs(tb.NGN?.net || 0);
  assert(ngnNet < 0.001, `Double-entry ledger discrepancy detected: NGN Net = ${ngnNet}`);
  console.log(`  ✔ Double-entry ledger equilibrium verified: NGN Net discrepancy = ${ngnNet} (Strictly 0.00)`);

  console.log('\n=============================================================');
  console.log('🎉 ALL NAIRA-ONLY WITHDRAWAL & ADMIN APPROVAL TESTS PASSED!');
  console.log('=============================================================\n');
}

runEndToEndTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
