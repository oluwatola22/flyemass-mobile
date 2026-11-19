/**
 * FlyeMass Nigerian Airtime, Mobile Data & Utility Bills Engine Integration Tests
 * Validates Edge Function vend-nigeria-bill, Sync Server VTU endpoints, and DB state transitions.
 */

const http = require('http');
const https = require('https');

const EDGE_FUNCTION_URL = 'https://oalpwwreypjprsmkcdvq.supabase.co/functions/v1/vend-nigeria-bill';
const SYNC_SERVER_PORT = 5050;

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (_e) {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 FLYEMASS NIGERIAN VTU & UTILITY BILLS INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Supabase Edge Function Health
  try {
    console.log('--- 1. Testing Live Supabase Edge Function (vend-nigeria-bill) ---');
    const edgeRes = await fetchJson(EDGE_FUNCTION_URL, { method: 'GET' });
    assert(edgeRes.status === 200, 'Edge function returns HTTP 200', `Status ${edgeRes.status}`);
    assert(edgeRes.data && edgeRes.data.status === 'active', 'Edge function is active', edgeRes.data.service);
    assert(Array.isArray(edgeRes.data.supported_categories), 'Edge function reports supported categories', edgeRes.data.supported_categories.join(', '));
  } catch (err) {
    assert(false, 'Edge function health check failed', err.message);
  }

  // 2. Sync Server Plans Endpoint
  try {
    console.log('\n--- 2. Testing Plans & Config Endpoints ---');
    const plansRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/plans`);
    assert(plansRes.status === 200, 'Plans endpoint returns HTTP 200');
    assert(plansRes.data && plansRes.data.success, 'Plans API reports success: true');
    assert(Array.isArray(plansRes.data.plans) && plansRes.data.plans.length > 0, 'Plans list is populated', `${plansRes.data.plans.length} plans loaded`);

    const mtnDataPlans = plansRes.data.plans.filter(p => (p.provider === 'MTN' || p.network_or_provider === 'MTN') && p.category === 'data');
    assert(mtnDataPlans.length > 0, 'MTN data plans exist', `${mtnDataPlans.length} MTN plans found`);

    const configRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/config`);
    assert(configRes.status === 200, 'Config endpoint returns HTTP 200');
    assert(configRes.data && configRes.data.success, 'Config API reports success: true');
    const discount = configRes.data.config.airtime_discount_percentage ?? configRes.data.config.airtime_discount_pct;
    assert(discount > 0, 'Airtime discount is configured', `${discount}%`);
  } catch (err) {
    assert(false, 'Plans/Config testing failed', err.message);
  }

  // 3. Customer Validation (Meter & Smartcard)
  try {
    console.log('\n--- 3. Testing Customer Verification Endpoint ---');
    const meterVerifyRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/validate-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        category: 'electricity',
        provider: 'IKEDC',
        customerNumber: '04218892019',
        meterType: 'Prepaid'
      }
    });

    assert(meterVerifyRes.status === 200, 'Meter verification returns HTTP 200');
    assert(meterVerifyRes.data.success, 'Meter verification reports success: true');
    assert(meterVerifyRes.data.customerName && meterVerifyRes.data.customerName.includes('Chief Babatunde Alade'), 'Customer name matched', meterVerifyRes.data.customerName);

    const smartcardVerifyRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/validate-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        category: 'cable_tv',
        provider: 'DStv',
        customerNumber: '7029182390'
      }
    });

    assert(smartcardVerifyRes.status === 200, 'Smartcard verification returns HTTP 200');
    assert(smartcardVerifyRes.data.success, 'Smartcard verification reports success: true');
    assert(smartcardVerifyRes.data.customerName && smartcardVerifyRes.data.customerName.length > 0, 'Smartcard subscriber matched', smartcardVerifyRes.data.customerName);
  } catch (err) {
    assert(false, 'Customer verification failed', err.message);
  }

  // 4. Airtime Vending with Discount
  let airtimeTxRef = '';
  try {
    console.log('\n--- 4. Testing Airtime Vending with Discount ---');
    const airtimeVendRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/vend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        userId: 'usr_alade_01',
        pin: '1234',
        category: 'airtime',
        provider: 'MTN',
        recipientNumber: '08035559201',
        recipientName: 'Chief Babatunde Alade',
        amount: 2000,
        fee: 0
      }
    });

    assert(airtimeVendRes.status === 200, 'Airtime vend returns HTTP 200');
    assert(airtimeVendRes.data.success, 'Airtime vend reports success: true');
    assert(airtimeVendRes.data.discountNgn > 0, 'Airtime discount applied correctly', `₦${airtimeVendRes.data.discountNgn} discount on ₦2,000`);
    assert(airtimeVendRes.data.totalDebited === 2000 - airtimeVendRes.data.discountNgn, 'Customer debited net discount', `Total debited: ₦${airtimeVendRes.data.totalDebited}`);
    airtimeTxRef = airtimeVendRes.data.reference;
    assert(!!airtimeTxRef, 'Vending reference issued', airtimeTxRef);
  } catch (err) {
    assert(false, 'Airtime vending test failed', err.message);
  }

  // 5. Electricity Vending with 20-Digit Token
  let electricityTxId = '';
  try {
    console.log('\n--- 5. Testing Electricity Vending & 20-Digit Token Generation ---');
    const powerVendRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/vend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        userId: 'usr_alade_01',
        pin: '1234',
        category: 'electricity',
        provider: 'EKEDC',
        recipientNumber: '04218892019',
        recipientName: 'Chief Babatunde Alade',
        amount: 5000,
        fee: 100,
        meterType: 'Prepaid'
      }
    });

    assert(powerVendRes.status === 200, 'Electricity vend returns HTTP 200');
    assert(powerVendRes.data.success, 'Electricity vend reports success: true');
    assert(powerVendRes.data.meterToken && powerVendRes.data.meterToken.length === 24, '20-digit prepaid token generated with 4-digit dashes', powerVendRes.data.meterToken);
    assert(powerVendRes.data.unitsKwh > 0, 'Electricity units in kWh calculated', `${powerVendRes.data.unitsKwh} kWh`);
    assert(powerVendRes.data.totalDebited === 5100, 'Amount + Convenience fee debited', `Debited: ₦${powerVendRes.data.totalDebited}`);

    // Fetch transactions to find transaction id
    const txList = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/bills/transactions?userId=usr_alade_01`);
    const found = txList.data.transactions.find(t => t.reference === powerVendRes.data.reference);
    if (found) electricityTxId = found.id;
  } catch (err) {
    assert(false, 'Electricity vending test failed', err.message);
  }

  // 6. Enterprise Admin Controls (Pricing Update, Toggle & Manual Refund)
  try {
    console.log('\n--- 6. Testing Enterprise Admin Controls ---');
    const adminAllRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/admin/bills/all`);
    assert(adminAllRes.status === 200, 'Admin All Bills returns HTTP 200');
    assert(adminAllRes.data.success, 'Admin API reports success: true');
    assert(adminAllRes.data.transactions.length >= 2, 'Admin bills ledger lists all transactions', `${adminAllRes.data.transactions.length} transactions`);

    // Admin Config Update
    const configUpdateRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/admin/bills/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        airtime_discount_percentage: 2.5,
        convenience_fee_ngn: 150
      }
    });
    assert(configUpdateRes.data.success, 'Admin config update succeeded');
    assert(configUpdateRes.data.config.airtime_discount_percentage === 2.5, 'Discount updated to 2.5%');

    // Admin Manual Refund
    if (electricityTxId) {
      const refundRes = await fetchJson(`http://localhost:${SYNC_SERVER_PORT}/api/admin/bills/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          transactionId: electricityTxId,
          reason: 'Test Disco Network Timeout Simulation',
          adminId: 'adm-001'
        }
      });
      assert(refundRes.data.success, 'Admin manual refund executed');
      assert(refundRes.data.transaction.status === 'refunded', 'Transaction status moved to REFUNDED');
      assert(refundRes.data.refundAmount === 5100, 'Customer refunded exact ₦5,100 debited');
    }
  } catch (err) {
    assert(false, 'Admin controls test failed', err.message);
  }

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
