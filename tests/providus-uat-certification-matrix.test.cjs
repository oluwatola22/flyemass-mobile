/**
 * Providus Bank UAT Certification Test Suite: 4-Scenario Webhook Validation Matrix
 * 
 * Verifies live Supabase Edge Function:
 * https://oalpwwreypjprsmkcdvq.supabase.co/functions/v1/providus-webhook
 * 
 * Scenarios:
 *  1. Valid payload + valid X-Auth-Signature + unique settlementId + account 9917273343 -> responseCode "00"
 *  2. Duplicate replay with identical settlementId -> responseCode "01" (duplicate transaction)
 *  3. Invalid or missing X-Auth-Signature -> responseCode "02" (rejected transaction)
 *  4. Unknown accountNumber OR missing settlementId -> responseCode "02" (rejected transaction)
 */

const https = require('https');
const http = require('http');
const assert = require('assert');

const LIVE_WEBHOOK_URL = 'https://oalpwwreypjprsmkcdvq.supabase.co/functions/v1/providus-webhook';
const LOCAL_WEBHOOK_URL = 'http://localhost:5050/api/webhooks/providus';

const VALID_AUTH_SIGNATURE = 'BE09BEE831CF262226B426E39BD1092AF84DC63076D4174FAC78A2261F9A3D6E59744983B8326B69CDF2963FE314DFC89635CFA37A40596508DD6EAAB09402C7';
const ACTIVE_UAT_ACCOUNT = '9917273343';

function postJson(urlStr, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const bodyStr = typeof data === 'string' ? data : JSON.stringify(data);

    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw), raw });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function runProvidusCertificationMatrix() {
  console.log('========================================================================');
  console.log('PROVIDUS BANK UAT CERTIFICATION: 4-SCENARIO VALIDATION MATRIX');
  console.log('Target Endpoint:', LIVE_WEBHOOK_URL);
  console.log('========================================================================\n');

  const testBatchTime = Date.now();
  const testSettlementId = `SETTLE_CERT_${testBatchTime}_${Math.floor(Math.random() * 9000 + 1000)}`;
  const testSessionId = `SES_CERT_${testBatchTime}`;

  const validPayload = {
    sessionId: testSessionId,
    accountNumber: ACTIVE_UAT_ACCOUNT,
    tranRemarks: `TRF/NIP/PROVIDUS_UAT_CERT/${testSettlementId}`,
    transactionAmount: 75000.00,
    settledAmount: 75000.00,
    feeAmount: 50.00,
    vatAmount: 3.75,
    currency: 'NGN',
    initiationTranRef: `FLY-DVA-UAT-${ACTIVE_UAT_ACCOUNT}`,
    settlementId: testSettlementId,
    sourceAccountNumber: '0123456789',
    sourceAccountName: 'Providus UAT Tester',
    sourceBankName: 'Providus Bank PLC',
    channelId: 'NIP',
    tranDateTime: new Date().toISOString()
  };

  // -------------------------------------------------------------------------
  // SCENARIO 1: Valid Settlement with Unique settlementId -> responseCode "00"
  // -------------------------------------------------------------------------
  console.log('[Scenario 1] Valid Payload + Valid X-Auth-Signature + New settlementId...');
  console.log('  Testing Account:', ACTIVE_UAT_ACCOUNT);
  console.log('  Testing settlementId:', testSettlementId);

  const res1 = await postJson(LIVE_WEBHOOK_URL, validPayload, {
    'X-Auth-Signature': VALID_AUTH_SIGNATURE
  });

  console.log(`  HTTP Status: ${res1.status}`);
  console.log('  Response Payload:', JSON.stringify(res1.data));

  assert.strictEqual(res1.status, 200, 'Must return HTTP 200');
  assert.strictEqual(res1.data.requestSuccessful, true, 'requestSuccessful must be true');
  assert.strictEqual(res1.data.sessionId, testSessionId, 'sessionId must match');
  assert.strictEqual(res1.data.responseCode, '00', 'Must return responseCode 00 on valid settlement');
  assert.strictEqual(res1.data.responseMessage, 'success', 'Must return responseMessage success');
  console.log('✓ Scenario 1 PASSED: Valid settlement acknowledged with "responseCode": "00"\n');

  // -------------------------------------------------------------------------
  // SCENARIO 2: Duplicate Settlement Replay by settlementId -> responseCode "01"
  // -------------------------------------------------------------------------
  console.log('[Scenario 2] Duplicate Replay: Resending identical settlementId...');
  console.log('  Testing Replayed settlementId:', testSettlementId);

  // Even with a modified or different sessionId, duplicate settlementId must be caught
  const dupePayload = {
    ...validPayload,
    sessionId: `SES_REPLAY_${Date.now()}`
  };

  const res2 = await postJson(LIVE_WEBHOOK_URL, dupePayload, {
    'X-Auth-Signature': VALID_AUTH_SIGNATURE
  });

  console.log(`  HTTP Status: ${res2.status}`);
  console.log('  Response Payload:', JSON.stringify(res2.data));

  assert.strictEqual(res2.status, 200, 'Must return HTTP 200');
  assert.strictEqual(res2.data.requestSuccessful, true, 'requestSuccessful must be true');
  assert.strictEqual(res2.data.responseCode, '01', 'Must return responseCode 01 on duplicate settlementId');
  assert.strictEqual(res2.data.responseMessage, 'duplicate transaction', 'Must return responseMessage duplicate transaction');
  console.log('✓ Scenario 2 PASSED: Duplicate settlement strictly intercepted with "responseCode": "01"\n');

  // -------------------------------------------------------------------------
  // SCENARIO 3: Invalid or Missing X-Auth-Signature -> responseCode "02"
  // -------------------------------------------------------------------------
  console.log('[Scenario 3] Signature Verification: Testing wrong and missing X-Auth-Signature...');
  
  // 3a. Invalid signature
  const freshSettlementId3a = `SETTLE_CERT_BADSIG_${Date.now()}`;
  const payload3a = { ...validPayload, settlementId: freshSettlementId3a };
  const res3a = await postJson(LIVE_WEBHOOK_URL, payload3a, {
    'X-Auth-Signature': 'INVALID_FORGED_HASH_1234567890ABCDEF'
  });
  console.log('  3a. Invalid Signature Response:', JSON.stringify(res3a.data));
  assert.strictEqual(res3a.status, 200);
  assert.strictEqual(res3a.data.requestSuccessful, true);
  assert.strictEqual(res3a.data.responseCode, '02', 'Must reject invalid signature with responseCode 02');
  assert.strictEqual(res3a.data.responseMessage, 'rejected transaction');

  // 3b. Missing signature header
  const freshSettlementId3b = `SETTLE_CERT_NOSIG_${Date.now()}`;
  const payload3b = { ...validPayload, settlementId: freshSettlementId3b };
  const res3b = await postJson(LIVE_WEBHOOK_URL, payload3b, {});
  console.log('  3b. Missing Signature Response:', JSON.stringify(res3b.data));
  assert.strictEqual(res3b.status, 200);
  assert.strictEqual(res3b.data.requestSuccessful, true);
  assert.strictEqual(res3b.data.responseCode, '02', 'Must reject missing signature with responseCode 02');
  assert.strictEqual(res3b.data.responseMessage, 'rejected transaction');
  console.log('✓ Scenario 3 PASSED: Forged & missing signatures strictly rejected with "responseCode": "02"\n');

  // -------------------------------------------------------------------------
  // SCENARIO 4: Unknown Account Number OR Missing settlementId -> responseCode "02"
  // -------------------------------------------------------------------------
  console.log('[Scenario 4] Required Fields & Account Existence Validation...');

  // 4a. Unknown Virtual Account Number
  const unknownAccount = '9900000000';
  const payload4a = {
    ...validPayload,
    accountNumber: unknownAccount,
    settlementId: `SETTLE_UNKNOWN_ACCT_${Date.now()}`
  };
  const res4a = await postJson(LIVE_WEBHOOK_URL, payload4a, {
    'X-Auth-Signature': VALID_AUTH_SIGNATURE
  });
  console.log('  4a. Unknown Account Response:', JSON.stringify(res4a.data));
  assert.strictEqual(res4a.status, 200);
  assert.strictEqual(res4a.data.requestSuccessful, true);
  assert.strictEqual(res4a.data.responseCode, '02', 'Unknown account must return responseCode 02');
  assert.strictEqual(res4a.data.responseMessage, 'rejected transaction');

  // 4b. Missing settlementId
  const payload4b = {
    ...validPayload,
    settlementId: '',
    sessionId: `SES_NO_SETTLE_${Date.now()}`
  };
  const res4b = await postJson(LIVE_WEBHOOK_URL, payload4b, {
    'X-Auth-Signature': VALID_AUTH_SIGNATURE
  });
  console.log('  4b. Missing settlementId Response:', JSON.stringify(res4b.data));
  assert.strictEqual(res4b.status, 200);
  assert.strictEqual(res4b.data.requestSuccessful, true);
  assert.strictEqual(res4b.data.responseCode, '02', 'Missing settlementId must return responseCode 02');
  assert.strictEqual(res4b.data.responseMessage, 'rejected transaction');

  // 4c. Missing sessionId
  const payload4c = {
    ...validPayload,
    sessionId: '',
    settlementId: `SETTLE_NO_SES_${Date.now()}`
  };
  const res4c = await postJson(LIVE_WEBHOOK_URL, payload4c, {
    'X-Auth-Signature': VALID_AUTH_SIGNATURE
  });
  console.log('  4c. Missing sessionId Response:', JSON.stringify(res4c.data));
  assert.strictEqual(res4c.status, 200);
  assert.strictEqual(res4c.data.requestSuccessful, true);
  assert.strictEqual(res4c.data.responseCode, '02', 'Missing sessionId must return responseCode 02');
  assert.strictEqual(res4c.data.responseMessage, 'rejected transaction');
  console.log('✓ Scenario 4 PASSED: Unknown accounts & missing required fields rejected with "responseCode": "02"\n');

  console.log('========================================================================');
  console.log('ALL 4 PROVIDUS BANK UAT SCENARIOS FULLY CERTIFIED & PASSED (4/4)!');
  console.log('========================================================================\n');
}

runProvidusCertificationMatrix().catch((err) => {
  console.error('Providus Certification Test Failed:', err);
  process.exit(1);
});
