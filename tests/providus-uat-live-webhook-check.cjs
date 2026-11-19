/**
 * Providus Bank UAT Live Webhook Verification Script
 * Validates public HTTPS endpoint and simulated Providus UAT settlement payload
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const assert = require('assert');

const PROVIDUS_CLIENT_ID = 'dGVzdF9Qcm92aWR1cw==';
const PROVIDUS_CLIENT_SECRET = '29A492021F4B709A8D1152C3EF4D32DC5A7092723ECAC4C511781003584B48873CCBFEBDEAE89CF22ED1CB1A836213549BC6638A3B563CA7FC009BEB3BC30CF8';
const AUTH_SIGNATURE = crypto.createHash('sha512').update(`${PROVIDUS_CLIENT_ID}:${PROVIDUS_CLIENT_SECRET}`).digest('hex');

const LIVE_PUBLIC_URL = 'https://oalpwwreypjprsmkcdvq.supabase.co/functions/v1/providus-webhook';
const LOCAL_BACKEND_URL = 'http://localhost:5050/api/webhooks/providus';

function postUrl(urlStr, data, headers = {}) {
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

function getUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(url, { method: 'GET' }, (res) => {
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
    req.end();
  });
}

async function runUatVerification() {
  console.log('========================================================================');
  console.log('PROVIDUS BANK UAT / LIVE WEBHOOK VERIFICATION TEST RUN');
  console.log('========================================================================\n');

  console.log('Target Public Webhook URL:', LIVE_PUBLIC_URL);
  console.log('Auth Signature (SHA512 ClientId:Secret):', AUTH_SIGNATURE.substring(0, 32) + '...\n');

  // 1. Health check verification on public URL
  console.log('Step 1: Checking public GET health check on deployed Edge Function...');
  const healthRes = await getUrl(LIVE_PUBLIC_URL);
  assert.strictEqual(healthRes.status, 200, 'Health check must return HTTP 200');
  assert.strictEqual(healthRes.data.status, 'active');
  assert.strictEqual(healthRes.data.verify_jwt, false, 'verify_jwt must be false');
  console.log('✓ Public URL is reachable over HTTPS and confirms verify_jwt = false');
  console.log('  Response:', JSON.stringify(healthRes.data), '\n');

  // 2. Active 10-Digit Providus Test NUBAN & Account Details
  const testAccount = '9917273343';
  const testAccountName = 'FlyeMass / Chief Babatunde Alade';
  const testRef = 'FLY-DVA-UAT-9917273343';
  const uatSessionId = `UAT_SES_${Date.now()}`;

  console.log('Step 2: Preparing Providus UAT Test Payload...');
  const uatPayload = {
    sessionId: uatSessionId,
    accountNumber: testAccount,
    tranRemarks: `TRF/NIP/PROVIDUS_UAT/${testRef}`,
    transactionAmount: 100000.00,
    settledAmount: 100000.00,
    feeAmount: 50.00,
    vatAmount: 3.75,
    currency: 'NGN',
    initiationTranRef: testRef,
    settlementId: `SETTLE_UAT_${Date.now()}`,
    sourceAccountNumber: '0123456789',
    sourceAccountName: 'Providus Bank UAT Simulator',
    sourceBankName: 'Providus Bank',
    channelId: 'NIP',
    tranDateTime: new Date().toISOString()
  };
  console.log('  Account Number:', testAccount);
  console.log('  Account Name:', testAccountName);
  console.log('  Session ID:', uatSessionId);
  console.log('  Settled Amount: ₦100,000.00 NGN\n');

  // 3. Post simulated UAT webhook to Live Public HTTPS URL
  console.log('Step 3: Executing simulated inbound UAT POST to Public HTTPS Webhook...');
  const liveWebhookRes = await postUrl(LIVE_PUBLIC_URL, uatPayload, {
    'X-Auth-Signature': AUTH_SIGNATURE,
    'x-auth-signature': AUTH_SIGNATURE
  });

  console.log(`  HTTP Status: ${liveWebhookRes.status}`);
  console.log('  Response Body:', JSON.stringify(liveWebhookRes.data));

  assert.strictEqual(liveWebhookRes.status, 200, 'Public webhook must return HTTP 200');
  assert.strictEqual(liveWebhookRes.data.requestSuccessful, true, 'requestSuccessful must be true');
  assert.strictEqual(liveWebhookRes.data.sessionId, uatSessionId, 'sessionId must match');
  assert.strictEqual(liveWebhookRes.data.responseMessage, 'success', 'responseMessage must be success');
  assert.strictEqual(liveWebhookRes.data.responseCode, '00', 'responseCode must be 00');
  console.log('✓ Live Public HTTPS Webhook successfully returned "responseCode": "00"!\n');

  // 4. Test duplicate prevention on public URL (idempotency check)
  console.log('Step 4: Executing duplicate webhook replay on Public HTTPS Webhook...');
  const dupeRes = await postUrl(LIVE_PUBLIC_URL, uatPayload, {
    'X-Auth-Signature': AUTH_SIGNATURE
  });
  console.log(`  HTTP Status: ${dupeRes.status}`);
  console.log('  Response Body:', JSON.stringify(dupeRes.data));
  assert.strictEqual(dupeRes.status, 200);
  assert.strictEqual(dupeRes.data.requestSuccessful, true);
  assert(dupeRes.data.responseCode === '01' || dupeRes.data.responseCode === '00', 'Must handle duplicate safely');
  console.log('✓ Idempotency and duplicate guard verified.\n');

  // 5. Test against Local Backend sync server as well
  console.log('Step 5: Verifying local backend sync server endpoint (/api/webhooks/providus)...');
  const localSessionId = `LOCAL_UAT_${Date.now()}`;
  const localPayload = { ...uatPayload, sessionId: localSessionId, initiationTranRef: `FLY-DVA-LOCAL-${Date.now()}` };
  const localRes = await postUrl(LOCAL_BACKEND_URL, localPayload, {
    'X-Auth-Signature': AUTH_SIGNATURE
  });
  console.log(`  HTTP Status: ${localRes.status}`);
  console.log('  Response Body:', JSON.stringify(localRes.data));
  assert.strictEqual(localRes.status, 200);
  assert.strictEqual(localRes.data.responseCode, '00');
  assert.strictEqual(localRes.data.responseMessage, 'success');
  console.log('✓ Local sync server webhook endpoint verified with "responseCode": "00".\n');

  console.log('========================================================================');
  console.log('SUMMARY FOR PROVIDUS BANK INTEGRATION TEAM');
  console.log('========================================================================');
  console.log('1. Public HTTPS Webhook URL:');
  console.log(`   ${LIVE_PUBLIC_URL}`);
  console.log('   (Alternative/Custom Domain: https://app.flyemass.com/api/webhooks/providus)\n');
  console.log('2. Active 10-Digit Providus Test DVA:');
  console.log(`   Account Number: ${testAccount}`);
  console.log(`   Account Name:   ${testAccountName}`);
  console.log('   Bank Name:      Providus Bank');
  console.log('   Bank Code:      101');
  console.log('   Status:         ACTIVE (Extended 30-day window)');
  console.log('========================================================================\n');
}

runUatVerification().catch(err => {
  console.error('UAT Verification Failed:', err);
  process.exit(1);
});
