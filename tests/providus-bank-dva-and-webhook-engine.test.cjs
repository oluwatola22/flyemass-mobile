const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const PROVIDUS_WEBHOOK_SECRET = 'sec_providus_flyemass_live_2026';

function request(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    let payload = null;
    if (typeof body === 'string') {
      payload = body;
    } else if (body) {
      payload = JSON.stringify(body);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5050,
        path: pathUrl,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let respBody = '';
        res.on('data', (chunk) => (respBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(respBody), raw: respBody });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respBody });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Providus Bank DVA & Realtime Webhook Integration Engine');
  console.log('===================================================================\n');

  const root = path.join(__dirname, '..');
  const modalSrc = fs.readFileSync(path.join(root, 'src/components/wallet/FundWalletModal.tsx'), 'utf8');
  const screenSrc = fs.readFileSync(path.join(root, 'src/screens/wallets/FundWalletScreen.tsx'), 'utf8');
  const walletsSrc = fs.readFileSync(path.join(root, 'src/screens/wallets/WalletsScreen.tsx'), 'utf8');
  const edgeDvaSrc = fs.readFileSync(path.join(root, 'supabase/functions/providus-create-dva/index.ts'), 'utf8');
  const edgeWhkSrc = fs.readFileSync(path.join(root, 'supabase/functions/providus-webhook/index.ts'), 'utf8');

  // -----------------------------------------------------------------
  // 1. Supabase Edge Functions & Static Verification
  // -----------------------------------------------------------------
  console.log('[Test 1] Verifying Supabase Edge Functions architecture...');
  assert(edgeDvaSrc.includes('providus-create-dva'), 'Edge function providus-create-dva must exist');
  assert(edgeDvaSrc.includes('Access-Control-Allow-Origin'), 'providus-create-dva must have CORS');
  assert(edgeDvaSrc.includes('CreateDynamicAccountNumber') || edgeDvaSrc.includes('generateProvidusNuban'), 'Must support Providus DVA generation');

  assert(edgeWhkSrc.includes('providus-webhook'), 'Edge function providus-webhook must exist');
  assert(edgeWhkSrc.includes('verifyHmacSignature'), 'providus-webhook must implement HMAC signature verification');
  assert(edgeWhkSrc.includes('requestSuccessful') && edgeWhkSrc.includes('responseCode'), 'Must return Providus response specification');
  console.log('✓ Supabase Edge Functions providus-create-dva & providus-webhook verified');

  // -----------------------------------------------------------------
  // 2. Dynamic Virtual Account (DVA) Generation
  // -----------------------------------------------------------------
  console.log('\n[Test 2] Generating Providus Dynamic Virtual Account (DVA)...');
  const dvaRes = await request('POST', '/api/providus/create-dva', {
    userId: 'usr_alade_01',
    walletId: 'w_ngn_01',
    amount: 250000,
    accountName: 'Chief Babatunde Alade'
  });

  assert.strictEqual(dvaRes.status, 200, 'DVA creation must return 200 OK');
  assert(dvaRes.data.success, 'DVA generation must report success');
  assert(dvaRes.data.dva, 'Must return dva object');

  const { accountNumber, bankName, bankCode, initiationTranRef, expiresAt, status } = dvaRes.data.dva;
  assert(accountNumber && accountNumber.length === 10, 'Account number must be a 10-digit NUBAN');
  assert(accountNumber.startsWith('99') || accountNumber.startsWith('90'), 'DVA must have valid Providus virtual prefix');
  assert.strictEqual(bankName, 'Providus Bank', 'Bank name must be Providus Bank');
  assert.strictEqual(bankCode, '101', 'Bank code must be 101');
  assert(initiationTranRef && initiationTranRef.startsWith('FLY-DVA-'), 'Must generate unique FLY-DVA reference');
  assert(expiresAt > Date.now(), 'DVA must have active future expiry');
  assert.strictEqual(status, 'active', 'DVA must be active upon creation');
  console.log(`✓ Providus DVA successfully created: Account ${accountNumber} (${bankName}) Ref: ${initiationTranRef}`);

  // -----------------------------------------------------------------
  // 3. Webhook Cryptographic Signature Verification
  // -----------------------------------------------------------------
  console.log('\n[Test 3] Verifying HMAC Cryptographic Signature & Replay Protection...');
  const testSessionId = `SES-PROV-${Date.now()}`;
  const validWebhookPayload = {
    sessionId: testSessionId,
    accountNumber: accountNumber,
    transactionAmount: 250000,
    settledAmount: 250000,
    settlementId: `SETTLE-${Date.now()}`,
    initiationTranRef: initiationTranRef,
    currency: 'NGN',
    tranRemarks: `TRF/NIP/GTBANK TO PROVIDUS/${initiationTranRef}`,
    transactionDateTime: new Date().toISOString()
  };

  const rawJson = JSON.stringify(validWebhookPayload);

  // 3a. Rejection of Forged / Invalid Signature
  const invalidSigRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': 'forged_fake_signature_hash_1234567890abcdef'
  });
  assert.strictEqual(invalidSigRes.status, 401, 'Forged HMAC signature must be rejected with 401');
  console.log('✓ Forged HMAC signature successfully rejected (401 Unauthorized)');

  // 3b. Acceptance of Valid HMAC-SHA512 Signature
  const validSignature512 = crypto.createHmac('sha512', PROVIDUS_WEBHOOK_SECRET).update(rawJson).digest('hex');

  // Capture user opening balance before webhook
  const stateBefore = (await request('GET', '/api/db/state')).data.state;
  const openingBalance = stateBefore.users['usr_alade_01'].balances.NGN || 0;

  const validSigRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': validSignature512
  });
  assert.strictEqual(validSigRes.status, 200, 'Valid Providus webhook must return 200 OK');
  assert(validSigRes.data.requestSuccessful, 'Providus response format: requestSuccessful must be true');
  assert.strictEqual(validSigRes.data.responseCode, '00', 'Providus responseCode must be 00');
  console.log('✓ Valid HMAC-SHA512 signature verified and acknowledged with Providus 00 response');

  // 3c. Replay / Duplicate Webhook Idempotency Check
  const duplicateRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': validSignature512
  });
  assert.strictEqual(duplicateRes.status, 200, 'Duplicate webhook must be handled gracefully');
  assert(duplicateRes.data.already_processed, 'Duplicate webhook must be flagged as already_processed');
  console.log('✓ Replay attack protection & duplicate webhook idempotency verified');

  // -----------------------------------------------------------------
  // 4. Atomic General Ledger Credit Verification
  // -----------------------------------------------------------------
  console.log('\n[Test 4] Verifying atomic NGN wallet credit & double-entry balance...');
  const stateAfter = (await request('GET', '/api/db/state')).data.state;
  const closingBalance = stateAfter.users['usr_alade_01'].balances.NGN || 0;
  const expectedBalance = openingBalance + 250000;

  assert.strictEqual(closingBalance, expectedBalance, `Wallet balance must be credited exactly ₦250,000 (Expected: ₦${expectedBalance}, Got: ₦${closingBalance})`);

  // Verify wallet ledger entry
  const ledgerTx = Object.values(stateAfter.wallets_ledger).find(
    (tx) => tx.reference === initiationTranRef || tx.notes?.includes(initiationTranRef)
  );
  assert(ledgerTx, 'Transaction record must exist in wallets_ledger');
  assert.strictEqual(ledgerTx.type, 'FUND');
  assert.strictEqual(ledgerTx.status, 'completed');
  assert.strictEqual(Number(ledgerTx.amount), 250000);

  // Verify DVA status transitioned to 'settled'
  const settledDva = stateAfter.providus_virtual_accounts?.[initiationTranRef] || stateAfter.providus_virtual_accounts?.[accountNumber];
  assert(settledDva, 'DVA record must exist in state');
  assert.strictEqual(settledDva.status, 'settled', 'DVA status must transition to settled');
  console.log('✓ Atomic ledger credit, double-entry postings, and DVA settlement confirmed');

  // -----------------------------------------------------------------
  // 5. Mobile App UI Verification: FundWalletModal & Realtime Listeners
  // -----------------------------------------------------------------
  console.log('\n[Test 5] Verifying Mobile App Wallet Funding UI & Realtime components...');

  // Modal checks
  assert(modalSrc.includes('data-testid="fund-wallet-modal"'), 'FundWalletModal must render modal container');
  assert(modalSrc.includes('data-testid="dva-account-number"'), 'FundWalletModal must display DVA account number');
  assert(modalSrc.includes('data-testid="copy-dva-account-btn"'), 'FundWalletModal must include 1-tap copy button');
  assert(modalSrc.includes('data-testid="dva-bank-name"'), 'FundWalletModal must display Providus Bank');
  assert(modalSrc.includes('data-testid="dva-status-awaiting"'), 'FundWalletModal must display Awaiting Transfer status');
  assert(modalSrc.includes('data-testid="dva-status-success"'), 'FundWalletModal must display success status checkmark');
  assert(modalSrc.includes('Awaiting Transfer...'), 'Must render exact indicator text "Awaiting Transfer..."');
  assert(modalSrc.includes('supabase.channel'), 'Must listen via Supabase Realtime channel');

  // WalletsScreen checks
  assert(walletsSrc.includes('FundWalletModal'), 'WalletsScreen must import FundWalletModal');
  assert(walletsSrc.includes('data-testid="fund-wallet-btn"'), 'WalletsScreen must have fund-wallet-btn');
  assert(walletsSrc.includes('openFundModal()'), 'WalletsScreen fund action must trigger openFundModal()');

  // FundWalletScreen checks
  assert(screenSrc.includes('data-testid="dva-account-number"'), 'FundWalletScreen must display DVA account number');
  assert(screenSrc.includes('data-testid="dva-status-awaiting"'), 'FundWalletScreen must display Awaiting Transfer indicator');
  assert(screenSrc.includes('data-testid="dva-status-success"'), 'FundWalletScreen must display success checkmark on settlement');
  console.log('✓ Mobile UI modal, 1-tap copy buttons, and live status indicators verified');

  console.log('\n===================================================================');
  console.log('ALL PROVIDUS BANK DVA & WEBHOOK TESTS PASSED (5/5)');
  console.log('===================================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
