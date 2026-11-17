/**
 * FLYEMASS — FUND WALLET WORKFLOW & ADMIN INTEGRATION COMPREHENSIVE TEST SUITE
 * 
 * Tests the entire Fund Wallet architecture:
 * - Multi-currency deposit rails (NGN, USD, CNY restriction)
 * - Corporate receiving accounts configuration (NGN Providus, USD Chase)
 * - Payment gateway channel settings & fee management
 * - Customer manual deposit submission with receipt upload
 * - Admin manual deposit review, approval, atomic double-entry credit, and rejection
 * - Automated inbound webhooks (Providus, Squadco HMAC, Korapay)
 * - Replay prevention and idempotent double-spending blocks
 * - Payment Reference Requery & Ledger Reconciliation tool
 * - General Ledger trial balance integrity
 */

const http = require('http');
const crypto = require('crypto');
const assert = require('assert');

const BASE_URL = 'http://localhost:5050';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🚀 FLYEMASS — FUND WALLET & ADMIN INTEGRATION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) {
        console.error(`     Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
      }
      failed++;
    }
  }

  // 1. Corporate Receiving Accounts
  await test('GET /api/wallets/receiving-accounts returns active corporate accounts', async () => {
    const res = await makeRequest('GET', '/api/wallets/receiving-accounts');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.receiving_accounts);
    assert.ok(res.body.receiving_accounts.ngn);
    assert.ok(res.body.receiving_accounts.usd);
    assert.ok(res.body.receiving_accounts.ngn.bankName.includes('Providus'));
    assert.ok(res.body.receiving_accounts.usd.swiftBic);
  });

  await test('POST /api/admin/receiving-accounts updates bank details with audit trail', async () => {
    const payload = {
      receiving_accounts: {
        ngn: {
          bankName: 'Providus Bank Plc',
          accountNumber: '9082341902',
          accountName: 'FlyeMass Logistics & Global Trade Ltd',
          instructions: 'Include User ID in transfer narration.'
        },
        usd: {
          bankName: 'JPMorgan Chase Bank, N.A. (New York)',
          accountName: 'FlyeMass Global International Inc.',
          accountNumber: '02100002148902',
          swiftBic: 'CHASUS33XXX',
          routingNumber: '021000021',
          intermediaryBankInstructions: 'For international wires, quote IBAN US89JPMC02100002148902.'
        }
      }
    };
    const res = await makeRequest('POST', '/api/admin/receiving-accounts', payload, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.receiving_accounts.ngn.bankName, 'Providus Bank Plc');

    // Verify persistence via public endpoint
    const verify = await makeRequest('GET', '/api/wallets/receiving-accounts');
    assert.strictEqual(verify.body.receiving_accounts.ngn.bankName, 'Providus Bank Plc');
  });

  // 2. Gateway Settings
  await test('GET /api/gateways/settings returns configured payment channels', async () => {
    const res = await makeRequest('GET', '/api/gateways/settings');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.gateways);
    assert.ok(res.body.gateways.squad);
    assert.ok(res.body.gateways.providus);
    assert.ok(res.body.gateways.manual_ngn);
    assert.ok(res.body.gateways.manual_usd);
  });

  await test('POST /api/admin/gateways/settings updates channel toggles and fees', async () => {
    const current = await makeRequest('GET', '/api/gateways/settings');
    const updatedGateways = { ...current.body.gateways };
    updatedGateways.squad.feePercent = 1.4;
    updatedGateways.manual_ngn.feeFlat = 0;

    const res = await makeRequest('POST', '/api/admin/gateways/settings', { gateways: updatedGateways }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.gateways.squad.feePercent, 1.4);
  });

  // 3. Direct CNY Deposit Restriction
  await test('POST /api/wallets/manual-deposit blocks direct CNY deposits with SAFE notice', async () => {
    const res = await makeRequest('POST', '/api/wallets/manual-deposit', {
      userId: 'usr_alade_01',
      currency: 'CNY',
      amount: 10000,
      senderName: 'Chief Babatunde Alade',
      originatingBank: 'Industrial and Commercial Bank of China'
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('SAFE regulations') || res.body.error.includes('Currency Exchange'));
  });

  // 4. Minimum Limits Validation
  await test('POST /api/wallets/manual-deposit enforces minimum deposit thresholds', async () => {
    // NGN minimum is ₦100
    const resNGN = await makeRequest('POST', '/api/wallets/manual-deposit', {
      userId: 'usr_alade_01',
      currency: 'NGN',
      amount: 50,
      senderName: 'Chief Babatunde Alade',
      originatingBank: 'GTBank'
    });
    assert.strictEqual(resNGN.status, 400);
    assert.ok(resNGN.body.error.includes('100'));

    // USD minimum is $10
    const resUSD = await makeRequest('POST', '/api/wallets/manual-deposit', {
      userId: 'usr_alade_01',
      currency: 'USD',
      amount: 5,
      senderName: 'Chief Babatunde Alade',
      originatingBank: 'Chase'
    });
    assert.strictEqual(resUSD.status, 400);
    assert.ok(resUSD.body.error.includes('10'));
  });

  // 5. Customer Manual NGN Deposit Submission
  let submittedDepositId = null;
  let initialCustomerBalanceNGN = 0;

  await test('POST /api/wallets/manual-deposit creates pending deposit without premature crediting', async () => {
    // Check initial user balance
    const userRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    initialCustomerBalanceNGN = userRes.body.balances?.NGN || 0;

    const payload = {
      userId: 'usr_alade_01',
      currency: 'NGN',
      amount: 750000,
      senderName: 'Chief Babatunde Alade',
      originatingBank: 'Guaranty Trust Bank (GTBank)',
      destinationBank: 'Providus Bank Plc',
      destinationAccount: '9082341902',
      paymentProofUrl: 'https://storage.flyemass.com/proofs/gtb_transfer_750k.png',
      paymentProofName: 'gtb_transfer_750k.png'
    };

    const res = await makeRequest('POST', '/api/wallets/manual-deposit', payload);
    assert.ok(res.status === 200 || res.status === 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.payment);
    assert.strictEqual(res.body.payment.status, 'pending');
    assert.strictEqual(res.body.payment.amount, 750000);
    assert.ok(res.body.payment.reference.startsWith('DEP-NGN-'));
    submittedDepositId = res.body.payment.id;

    // Verify customer wallet balance was NOT mutated prior to admin review
    const verifyUser = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(verifyUser.body.balances.NGN, initialCustomerBalanceNGN, 'Wallet must NOT be credited before admin approval');
  });

  // 6. Admin Manual Payments Review Queue
  await test('GET /api/admin/manual-payments includes the newly submitted deposit', async () => {
    const res = await makeRequest('GET', '/api/admin/manual-payments', null, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const found = res.body.payments.find(p => p.id === submittedDepositId);
    assert.ok(found, 'Submitted deposit must appear in admin queue');
    assert.strictEqual(found.status, 'pending');
    assert.strictEqual(found.amount, 750000);
  });

  // 7. Admin Approval & Atomic Double-Entry Credit
  await test('POST /api/admin/manual-payments/approve credits wallet and records general ledger entry', async () => {
    const res = await makeRequest('POST', '/api/admin/manual-payments/approve', {
      paymentId: submittedDepositId,
      internalNotes: 'Verified against Providus Bank statement batch #9921'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.payment.status, 'approved');
    assert.ok(res.body.journalEntryId);

    // Verify wallet balance is incremented by exactly ₦750,000
    const verifyUser = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(verifyUser.body.balances.NGN, initialCustomerBalanceNGN + 750000);

    // Verify general ledger double-entry
    const ledgerRes = await makeRequest('GET', '/api/ledger/entries');
    const journalEntry = ledgerRes.body.entries.find(e => e.id === res.body.journalEntryId);
    assert.ok(journalEntry, 'Journal entry must be posted in general ledger');
    assert.strictEqual(journalEntry.transactionType, 'FUND');

    // Verify balanced debit and credit
    const debit = journalEntry.postings.find(p => p.debit > 0);
    const credit = journalEntry.postings.find(p => p.credit > 0);
    assert.ok(debit && credit);
    assert.strictEqual(debit.debit, 750000);
    assert.strictEqual(credit.credit, 750000);
  });

  // 8. Replay Protection on Manual Deposit Approval
  await test('Duplicate approval of already approved deposit is blocked', async () => {
    const res = await makeRequest('POST', '/api/admin/manual-payments/approve', {
      paymentId: submittedDepositId,
      internalNotes: 'Second attempt should be rejected'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('already processed') || res.body.error.includes('approved'));

    // Verify wallet balance was NOT credited twice
    const verifyUser = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(verifyUser.body.balances.NGN, initialCustomerBalanceNGN + 750000);
  });

  // 9. Customer Manual USD Deposit & Rejection with Mandatory Reason
  let submittedUSDDepositId = null;
  let initialBalanceUSD = 0;

  await test('POST /api/wallets/manual-deposit submits USD wire deposit', async () => {
    const userRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    initialBalanceUSD = userRes.body.balances?.USD || 0;

    const payload = {
      userId: 'usr_alade_01',
      currency: 'USD',
      amount: 2500,
      senderName: 'Chief Babatunde Alade',
      originatingBank: 'Standard Chartered Bank Hong Kong',
      destinationBank: 'JPMorgan Chase Bank, N.A.',
      destinationAccount: '02100002148902',
      paymentProofUrl: 'https://storage.flyemass.com/proofs/swift_wire_slip_2500.pdf',
      paymentProofName: 'swift_wire_slip_2500.pdf'
    };

    const res = await makeRequest('POST', '/api/wallets/manual-deposit', payload);
    assert.ok(res.status === 200 || res.status === 201);
    assert.strictEqual(res.body.payment.status, 'pending');
    assert.strictEqual(res.body.payment.currency, 'USD');
    submittedUSDDepositId = res.body.payment.id;
  });

  await test('POST /api/admin/manual-payments/reject requires reason and executes zero balance mutation', async () => {
    // Attempt without reason must fail
    const failRes = await makeRequest('POST', '/api/admin/manual-payments/reject', {
      paymentId: submittedUSDDepositId,
      rejectionReason: ''
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(failRes.status, 400);

    // Reject with proper compliance reason
    const res = await makeRequest('POST', '/api/admin/manual-payments/reject', {
      paymentId: submittedUSDDepositId,
      rejectionReason: 'SWIFT wire transfer reference could not be matched on JPMorgan Chase statement batch'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.payment.status, 'rejected');

    // Verify USD wallet balance did NOT change
    const verifyUser = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(verifyUser.body.balances.USD, initialBalanceUSD);
  });

  // 10. Automated Webhook Processing (Providus Bank)
  await test('POST /api/webhooks/providus processes automated inbound NIP payment', async () => {
    const preRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    const balanceBefore = preRes.body.balances.NGN;
    const ref = `PROV-AUTOTEST-${Date.now()}`;

    const payload = {
      sessionId: `SESSION-${Date.now()}`,
      accountNumber: '9921448201',
      tranRemarks: 'FLYE-NG-8821 Chief Alade wallet funding',
      transactionAmount: 150000,
      settledAmount: 150000,
      feeAmount: 0,
      currency: 'NGN',
      initiationTranRef: ref,
      userId: 'usr_alade_01'
    };

    const res = await makeRequest('POST', '/api/webhooks/providus', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Verify wallet was atomically credited ₦150,000
    const postRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(postRes.body.balances.NGN, balanceBefore + 150000);
  });

  // 11. Automated Webhook Processing with HMAC Signature (Squadco)
  await test('POST /api/webhooks/squad validates HMAC-SHA512 signature and credits wallet', async () => {
    const preRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    const balanceBefore = preRes.body.balances.NGN;
    const squadRef = `SQUAD-TEST-${Date.now()}`;

    const payload = {
      Event: 'charge_successful',
      TransactionRef: squadRef,
      Body: {
        amount: 20000000, // In Kobo = ₦200,000
        currency: 'NGN',
        customer_id: 'usr_alade_01',
        email: 'alade.investments@flyemass.ng',
        is_recurring: false,
        payment_type: 'card'
      }
    };

    const rawBody = JSON.stringify(payload);
    const SQUAD_SECRET = 'SQUAD_SECRET_KEY_99214';
    const signature = crypto.createHmac('sha512', SQUAD_SECRET).update(rawBody).digest('hex');

    const res = await makeRequest('POST', '/api/webhooks/squad', rawBody, {
      'x-squad-signature': signature
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.creditedAmount, 200000);

    // Verify wallet credited
    const postRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(postRes.body.balances.NGN, balanceBefore + 200000);
  });

  // 12. Squadco Webhook Replay Protection
  await test('Replaying Squadco webhook reference is rejected or idempotently ignored', async () => {
    const preRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    const balanceBefore = preRes.body.balances.NGN;
    const squadRef = `SQUAD-REPLAY-${Date.now()}`;

    const payload = {
      Event: 'charge_successful',
      TransactionRef: squadRef,
      Body: {
        amount: 5000000, // ₦50,000
        currency: 'NGN',
        customer_id: 'usr_alade_01'
      }
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha512', 'SQUAD_SECRET_KEY_99214').update(rawBody).digest('hex');

    // First attempt succeeds
    const res1 = await makeRequest('POST', '/api/webhooks/squad', rawBody, { 'x-squad-signature': signature });
    assert.strictEqual(res1.status, 200);

    // Second attempt must not double credit
    const res2 = await makeRequest('POST', '/api/webhooks/squad', rawBody, { 'x-squad-signature': signature });
    assert.strictEqual(res2.status, 200);
    assert.ok(res2.body.already_processed === true || res2.body.message?.includes('Duplicate'));

    const postRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(postRes.body.balances.NGN, balanceBefore + 50000, 'Balance must only increment once despite duplicate webhook delivery');
  });

  // 13. Payment Reference Requery & Reconciliation Tool
  await test('POST /api/admin/gateway/requery detects already credited references', async () => {
    const res = await makeRequest('POST', '/api/admin/gateway/requery', {
      reference: submittedDepositId,
      provider: 'manual'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'already_credited');
  });

  await test('POST /api/admin/gateway/requery reconciles uncredited reference atomically', async () => {
    const preRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    const balanceBefore = preRes.body.balances.NGN;
    const uncreditedRef = `SQUAD-RECON-${Date.now()}`;

    const res = await makeRequest('POST', '/api/admin/gateway/requery', {
      reference: uncreditedRef,
      provider: 'squad'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'finance_officer'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'verified_and_credited');
    assert.strictEqual(res.body.amount, 50000);

    // Verify wallet was credited
    const postRes = await makeRequest('GET', '/api/wallets/usr_alade_01');
    assert.strictEqual(postRes.body.balances.NGN, balanceBefore + 50000);
  });

  // 14. General Ledger Double-Entry Trial Balance Check
  await test('Double-Entry General Ledger maintains perfect debit/credit equality', async () => {
    const ledgerRes = await makeRequest('GET', '/api/ledger/entries');
    assert.strictEqual(ledgerRes.status, 200);

    const totals = { NGN: { dr: 0, cr: 0 }, USD: { dr: 0, cr: 0 }, CNY: { dr: 0, cr: 0 } };
    for (const entry of ledgerRes.body.entries) {
      for (const p of (entry.postings || [])) {
        if (!totals[p.currency]) totals[p.currency] = { dr: 0, cr: 0 };
        totals[p.currency].dr += (p.debit || 0);
        totals[p.currency].cr += (p.credit || 0);
      }
    }

    assert.strictEqual(
      Math.abs(totals.NGN.dr - totals.NGN.cr) < 0.01,
      true,
      `NGN Ledger unbalanced: Dr ${totals.NGN.dr} != Cr ${totals.NGN.cr}`
    );
    assert.strictEqual(
      Math.abs(totals.USD.dr - totals.USD.cr) < 0.01,
      true,
      `USD Ledger unbalanced: Dr ${totals.USD.dr} != Cr ${totals.USD.cr}`
    );
  });

  console.log('\n============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
