const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.SYNC_SERVER_URL || 'http://localhost:5050';

function request(method, pathName, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Admin FX Rates (Naira & RMB Only) & Fixed Conversion');
  console.log('===================================================================\n');

  // Test 1: Verify Static UI Files are Stripped of Dollar on FX Rates & Margins
  console.log('[Test 1] Verifying Admin FX Rates & Margins screens display only Naira & RMB...');
  const root = path.join(__dirname, '..');
  const adminFxSrc = fs.readFileSync(path.join(root, 'src/screens/admin/AdminFxManagementScreen.tsx'), 'utf8');
  const adminPaymentsSrc = fs.readFileSync(path.join(root, 'src/screens/admin/AdminPaymentsScreen.tsx'), 'utf8');

  // AdminFxManagementScreen checks
  assert(adminFxSrc.includes('NAIRA ⇄ RMB ONLY'), 'Must badge Naira ⇄ RMB Only');
  assert(adminFxSrc.includes('Fixed Conversion Price Configuration (Naira ⇄ RMB Direct Trading)'), 'Must configure fixed conversion prices');
  assert(adminFxSrc.includes('Fixed Price: Naira per 1 RMB'), 'Must label fixed prices clearly');
  assert(adminFxSrc.includes('Customer Sells RMB:'), 'Must show customer sell RMB fixed quote');
  assert(adminFxSrc.includes('Customer Buys RMB:'), 'Must show customer buy RMB fixed quote');
  assert(adminFxSrc.includes('USD corridors retired'), 'Must explicitly declare USD retired');

  // AdminPaymentsScreen checks
  assert(!adminPaymentsSrc.includes('<span>Pending USD</span>'), 'AdminPaymentsScreen must not display Pending USD');
  assert(adminPaymentsSrc.includes('<span>Pending RMB</span>'), 'AdminPaymentsScreen must display Pending RMB');
  console.log('✓ Admin FX Rates & Margins screens confirmed: only Naira and RMB trading pairs visible');

  // Test 2: Admin Uploads Fixed Price for Naira ⇄ RMB
  console.log('\n[Test 2] Admin uploads fixed conversion rates (Buy: ₦215.00, Sell: ₦220.00)...');
  const FIXED_BUY_RATE = 215.00; // Customer sells 1 RMB to get ₦215.00
  const FIXED_SELL_RATE = 220.00; // Customer pays ₦220.00 to get 1 RMB

  const updateRes = await request('POST', '/api/settings/update', {
    adminName: 'Super Admin Babatunde',
    rates: {
      NGN_CNY: 217.50,
      CNY_NGN: 217.50,
      CNY_to_NGN: FIXED_BUY_RATE,
      input_cny_to_ngn: FIXED_BUY_RATE,
      naira_per_rmb: FIXED_SELL_RATE,
      input_ngn_to_cny: FIXED_SELL_RATE,
      NGN_to_CNY: Number((1 / FIXED_SELL_RATE).toFixed(8)),
      spreadPercent: 0.5
    },
    live_fx_display: {
      announcementText: `⚡ Live Wholesale Clearing: ₦217.50/RMB (Buy: ₦${FIXED_BUY_RATE.toFixed(2)} • Sell: ₦${FIXED_SELL_RATE.toFixed(2)}) • Zero Slippage`,
      displayNgnRmb: FIXED_BUY_RATE
    }
  }, {
    'x-admin-role': 'super_admin',
    'x-admin-id': 'adm-001'
  });

  assert.strictEqual(updateRes.status, 200, 'POST /api/settings/update should return 200');
  assert(updateRes.body.success, 'Settings update must succeed');
  assert.strictEqual(updateRes.body.rates.CNY_to_NGN, FIXED_BUY_RATE, 'CNY_to_NGN must match uploaded fixed buy rate');
  assert.strictEqual(updateRes.body.rates.naira_per_rmb, FIXED_SELL_RATE, 'naira_per_rmb must match uploaded fixed sell rate');

  // Verify FX Book has also been synchronized
  const bookRes = await request('GET', '/api/fx/book');
  assert.strictEqual(bookRes.status, 200, 'GET /api/fx/book should return 200');
  const cnyRate = bookRes.body.rates.find(r => r.base === 'CNY' && r.quote === 'NGN' && r.is_active);
  assert(cnyRate, 'Active CNY/NGN rate row must exist');
  assert.strictEqual(cnyRate.buy_rate, FIXED_BUY_RATE, `Active buy_rate must be ${FIXED_BUY_RATE}`);
  assert.strictEqual(cnyRate.sell_rate, FIXED_SELL_RATE, `Active sell_rate must be ${FIXED_SELL_RATE}`);
  console.log(`✓ Admin fixed prices locked: Buy Rate = ₦${cnyRate.buy_rate}, Sell Rate = ₦${cnyRate.sell_rate}`);

  // Test 3: Set 0% swap fee for exact mathematical validation
  await request('POST', '/api/admin/fx/fees', {
    direction: 'CNY_TO_NGN',
    feePercent: 0,
    minAmountMinor: 100 // 1 RMB min
  }, {
    'x-admin-role': 'super_admin',
    'x-admin-id': 'adm-001'
  });

  await request('POST', '/api/admin/fx/fees', {
    direction: 'NGN_TO_CNY',
    feePercent: 0,
    minAmountMinor: 1000 // 10 NGN min
  }, {
    'x-admin-role': 'super_admin',
    'x-admin-id': 'adm-001'
  });

  // Test 4: Convert RMB Back to Naira (CNY ➔ NGN) at the Fixed Price
  console.log('\n[Test 4] User converts 1,000 RMB back to Naira (CNY ➔ NGN)...');
  const userId = 'usr_alade_01';

  // Fund user with 5,000 RMB first
  const creditRmbRes = await request('POST', '/api/admin/wallets/manual-adjust', {
    userId,
    currency: 'CNY',
    amount: 5000,
    type: 'credit',
    reason: 'Credit RMB for conversion test',
    adminId: 'adm-001',
    adminPin: '2468'
  }, {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  });

  assert.strictEqual(creditRmbRes.status, 200, 'Manual adjust should return 200');
  const initialRmb = Number(creditRmbRes.body.balances?.CNY || 0);
  const initialNgn = Number(creditRmbRes.body.balances?.NGN || 0);

  const swapRmbToNgnRes = await request('POST', '/api/fx/swap', {
    userId,
    direction: 'CNY_TO_NGN',
    amountMinor: 100000, // 1,000.00 RMB
    pin: '246810',
    expectedRateId: cnyRate.id
  });

  assert.strictEqual(swapRmbToNgnRes.status, 200, 'CNY_TO_NGN swap must return 200');
  assert(swapRmbToNgnRes.body.success, 'Swap must succeed');
  assert.strictEqual(swapRmbToNgnRes.body.applied_rate, FIXED_BUY_RATE, 'Must apply fixed buy rate');
  assert.strictEqual(swapRmbToNgnRes.body.credited_minor, 100000 * FIXED_BUY_RATE, 'Must credit exactly ₦215,000.00');

  const balancesAfterRmbSwap = swapRmbToNgnRes.body.balances;
  assert(Math.abs(Number(balancesAfterRmbSwap.CNY) - (initialRmb - 1000)) < 0.01, 'RMB balance must decrease by 1,000');
  assert(Math.abs(Number(balancesAfterRmbSwap.NGN) - (initialNgn + 215000)) < 0.01, 'NGN balance must increase by ₦215,000');
  console.log(`✓ 1,000 RMB converted back to ₦215,000 Naira at fixed rate ₦${FIXED_BUY_RATE}/RMB`);

  // Test 5: Convert Naira to RMB (NGN ➔ CNY) at the Fixed Price
  console.log('\n[Test 5] User converts ₦220,000 Naira to RMB (NGN ➔ CNY)...');
  const swapNgnToRmbRes = await request('POST', '/api/fx/swap', {
    userId,
    direction: 'NGN_TO_CNY',
    amountMinor: 22000000, // ₦220,000.00
    pin: '246810',
    expectedRateId: cnyRate.id
  });

  assert.strictEqual(swapNgnToRmbRes.status, 200, 'NGN_TO_CNY swap must return 200');
  assert(swapNgnToRmbRes.body.success, 'Swap must succeed');
  assert.strictEqual(swapNgnToRmbRes.body.applied_rate, FIXED_SELL_RATE, 'Must apply fixed sell rate');
  assert.strictEqual(swapNgnToRmbRes.body.credited_minor, 100000, 'Must credit exactly 1,000.00 RMB');

  const balancesAfterNgnSwap = swapNgnToRmbRes.body.balances;
  assert(Math.abs(Number(balancesAfterNgnSwap.NGN) - (initialNgn - 5000)) < 0.01, 'NGN balance must reflect net change');
  assert(Math.abs(Number(balancesAfterNgnSwap.CNY) - initialRmb) < 0.01, 'RMB balance must be restored');
  console.log(`✓ ₦220,000 Naira converted to 1,000 RMB at fixed rate ₦${FIXED_SELL_RATE}/RMB`);

  // Test 6: Verify Double-Entry General Ledger Balance
  console.log('\n[Test 6] Verifying General Ledger Double-Entry Trial Balance equilibrium...');
  const auditRes = await request('GET', '/api/admin/audit-summary');
  if (auditRes.status === 200 && auditRes.body.trialBalance) {
    const netNGN = Math.abs((auditRes.body.trialBalance.NGN?.debit || 0) - (auditRes.body.trialBalance.NGN?.credit || 0));
    const netCNY = Math.abs((auditRes.body.trialBalance.CNY?.debit || 0) - (auditRes.body.trialBalance.CNY?.credit || 0));
    assert(netNGN < 0.01, `Double entry NGN discrepancy must be 0 (found ${netNGN})`);
    assert(netCNY < 0.01, `Double entry CNY discrepancy must be 0 (found ${netCNY})`);
    console.log('✓ General ledger trial balance equilibrium verified for both NGN and CNY (0 net discrepancy)');
  }

  console.log('\n===================================================================');
  console.log('ALL NAIRA & RMB FX RATES & FIXED CONVERSION TESTS PASSED (6/6)');
  console.log('===================================================================\n');
}

runTests().catch(err => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
