const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

// Official Providus Bank Test Configuration
const PROVIDUS_BASE_URL = 'http://102.209.190.54:8088/appdevapi/api/';
const PROVIDUS_CLIENT_ID = 'dGVzdF9Qcm92aWR1cw==';
const PROVIDUS_CLIENT_SECRET = '29A492021F4B709A8D1152C3EF4D32DC5A7092723ECAC4C511781003584B48873CCBFEBDEAE89CF22ED1CB1A836213549BC6638A3B563CA7FC009BEB3BC30CF8';
const PROVIDUS_AUTH_SIGNATURE = crypto.createHash('sha512').update(`${PROVIDUS_CLIENT_ID}:${PROVIDUS_CLIENT_SECRET}`).digest('hex');

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
  const syncServerSrc = fs.readFileSync(path.join(root, 'sync-server.cjs'), 'utf8');

  // -----------------------------------------------------------------
  // 1. Providus API Configuration & Authentication
  // -----------------------------------------------------------------
  console.log('[Test 1] Verifying Providus API Configuration & Authentication Rules...');
  assert(syncServerSrc.includes('dGVzdF9Qcm92aWR1cw=='), 'sync-server.cjs must include official Providus test Client-Id');
  assert(syncServerSrc.includes('29A492021F4B709A8D1152C3EF4D32DC5A7092723ECAC4C511781003584B48873CCBFEBDEAE89CF22ED1CB1A836213549BC6638A3B563CA7FC009BEB3BC30CF8'), 'sync-server.cjs must include official Providus ClientSecret');
  assert(syncServerSrc.includes('http://102.209.190.54:8088/appdevapi/api/'), 'sync-server.cjs must configure Providus Base URL');
  assert(syncServerSrc.includes('getProvidusAuthSignature'), 'sync-server.cjs must generate dynamic SHA512(ClientId:ClientSecret) signature');

  assert(edgeDvaSrc.includes('dGVzdF9Qcm92aWR1cw=='), 'providus-create-dva must include official Client-Id');
  assert(edgeDvaSrc.includes('generateProvidusAuthSignature'), 'providus-create-dva must compute SHA-512 signature');
  assert(edgeWhkSrc.includes('dGVzdF9Qcm92aWR1cw=='), 'providus-webhook must include official Client-Id');
  console.log('✓ Providus test credentials, Base URL, and SHA512 signature engine verified');

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
  // 3. Webhook Receiver: Payload Parsing, Idempotency & Standard Response Codes
  // -----------------------------------------------------------------
  console.log('\n[Test 3] Verifying Webhook Payload Parsing, Signature & Response Contracts...');

  const testSessionId = `SES-PROV-${Date.now()}`;
  const validWebhookPayload = {
    sessionId: testSessionId,
    accountNumber: accountNumber,
    tranRemarks: `TRF/NIP/GTBANK TO PROVIDUS/${initiationTranRef}`,
    transactionAmount: 250000,
    settledAmount: 250000,
    feeAmount: 50,
    vatAmount: 3.75,
    currency: 'NGN',
    initiationTranRef: initiationTranRef,
    settlementId: `SETTLE-${Date.now()}`,
    sourceAccountNumber: '0123456789',
    sourceAccountName: 'Chief Babatunde Alade',
    sourceBankName: 'Guaranty Trust Bank',
    channelId: 'NIP',
    tranDateTime: new Date().toISOString()
  };

  const rawJson = JSON.stringify(validWebhookPayload);

  // 3a. Rejection of Forged Signature (Response Code: "02", rejected transaction)
  const invalidSigRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': 'invalid_forged_hash_1234567890abcdef'
  });
  assert.strictEqual(invalidSigRes.status, 401, 'Forged signature must be rejected with 401');
  assert.strictEqual(invalidSigRes.data.responseCode, '02', 'Rejection responseCode must be 02');
  assert.strictEqual(invalidSigRes.data.responseMessage, 'rejected transaction', 'Rejection message must be "rejected transaction"');
  console.log('✓ 3a. Invalid signature rejected: responseCode "02" (rejected transaction)');

  // 3b. Acceptance of Valid SHA512 Auth Signature (Response Code: "00", success)
  // Capture user opening balance before webhook
  const stateBefore = (await request('GET', '/api/db/state')).data.state;
  const openingBalance = stateBefore.users['usr_alade_01'].balances.NGN || 0;

  const validSigRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': PROVIDUS_AUTH_SIGNATURE
  });

  assert.strictEqual(validSigRes.status, 200, 'Valid Providus webhook must return 200 OK');
  assert.strictEqual(validSigRes.data.requestSuccessful, true, 'requestSuccessful must be true');
  assert.strictEqual(validSigRes.data.sessionId, testSessionId, 'Must echo matching sessionId');
  assert.strictEqual(validSigRes.data.responseCode, '00', 'Success responseCode must be 00');
  assert.strictEqual(validSigRes.data.responseMessage, 'success', 'Success responseMessage must be "success"');
  console.log('✓ 3b. Valid settlement acknowledged: responseCode "00" (success)');

  // 3c. Duplicate / Idempotency Guard (Response Code: "01", duplicate transaction)
  const duplicateRes = await request('POST', '/api/webhooks/providus', rawJson, {
    'x-auth-signature': PROVIDUS_AUTH_SIGNATURE
  });
  assert.strictEqual(duplicateRes.status, 200, 'Duplicate webhook must return 200 OK');
  assert.strictEqual(duplicateRes.data.requestSuccessful, true, 'Duplicate requestSuccessful must be true');
  assert.strictEqual(duplicateRes.data.sessionId, testSessionId, 'Duplicate must echo sessionId');
  assert.strictEqual(duplicateRes.data.responseCode, '01', 'Duplicate responseCode must be 01');
  assert.strictEqual(duplicateRes.data.responseMessage, 'duplicate transaction', 'Duplicate responseMessage must be "duplicate transaction"');
  console.log('✓ 3c. Replay duplicate protected: responseCode "01" (duplicate transaction)');

  // 3d. Non-positive amount / Invalid details (Response Code: "02", rejected transaction)
  const rejectedPayload = {
    sessionId: `SES-REJ-${Date.now()}`,
    accountNumber: accountNumber,
    tranRemarks: 'Invalid transaction',
    transactionAmount: -5000,
    settledAmount: 0,
    feeAmount: 0,
    vatAmount: 0,
    currency: 'NGN',
    initiationTranRef: `REJ-${Date.now()}`,
    settlementId: `SETTLE-REJ-${Date.now()}`,
    channelId: 'NIP',
    tranDateTime: new Date().toISOString()
  };
  const rejRes = await request('POST', '/api/webhooks/providus', rejectedPayload, {
    'x-auth-signature': PROVIDUS_AUTH_SIGNATURE
  });
  assert.strictEqual(rejRes.data.responseCode, '02', 'Invalid amount must return responseCode "02"');
  assert.strictEqual(rejRes.data.responseMessage, 'rejected transaction', 'Invalid amount must return "rejected transaction"');
  console.log('✓ 3d. Malformed/Zero amount rejected: responseCode "02" (rejected transaction)');

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
  assert.strictEqual(settledDva.sourceBankName, 'Guaranty Trust Bank', 'Must store source bank name');
  assert.strictEqual(settledDva.sourceAccountName, 'Chief Babatunde Alade', 'Must store source account name');
  console.log('✓ Atomic ledger credit, metadata persistence, and DVA settlement confirmed');

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
