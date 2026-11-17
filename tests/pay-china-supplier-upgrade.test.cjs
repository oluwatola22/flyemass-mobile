// tests/pay-china-supplier-upgrade.test.cjs
// Verifies "Pay China Supplier" upgrade across mobile & admin flows
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const BASE_URL = 'http://localhost:5050';

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAll() {
  console.log('=============================================================================');
  console.log('FLYEMASS "PAY CHINA SUPPLIER" FUNCTIONALITY VERIFICATION SUITE');
  console.log('=============================================================================\n');

  // -----------------------------------------------------------------------------
  // 1. Mobile PaySupplierScreen UI/UX & Multi-Currency Funding Logic
  // -----------------------------------------------------------------------------
  test('1.1 PaySupplierScreen provides multi-currency funding vault selector (CNY, NGN, USD)', () => {
    const file = path.join(BASE_DIR, 'src/screens/wallets/PaySupplierScreen.tsx');
    assert.ok(fs.existsSync(file), 'PaySupplierScreen must exist');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes("(['CNY', 'NGN', 'USD'] as const).map"), 'Funding vault selector present for CNY, NGN, USD');
    assert.ok(content.includes('Funding Wallet Source'), 'Funding Wallet Source header present');
    assert.ok(content.includes('calculateFundingDeduction'), 'Conversion helper exists for multi-currency deductions');
    assert.ok(content.includes('requiredFundingAmount > activeBalance'), 'Validation checks active balance of selected funding currency');
  });

  test('1.2 PaySupplierScreen supports Alipay, WeChat Pay, and Chinese Bank Account inputs', () => {
    const content = fs.readFileSync(path.join(BASE_DIR, 'src/screens/wallets/PaySupplierScreen.tsx'), 'utf8');
    assert.ok(content.includes("activeTab === 'alipay'"), 'Alipay channel supported');
    assert.ok(content.includes("activeTab === 'wechat'"), 'WeChat Pay channel supported');
    assert.ok(content.includes("activeTab === 'bank'"), 'Chinese Bank Transfer channel supported');
    assert.ok(content.includes('Industrial and Commercial Bank of China'), 'Bank details supported');
    assert.ok(content.includes('SWIFT / BIC / CNAPS'), 'CNAPS/SWIFT branch code supported');
    assert.ok(content.includes('SAFE China Registry Check'), 'SAFE China compliance verification present');
  });

  test('1.3 PaySupplierScreen displays Review and Submission Receipt modals with funding wallet metadata', () => {
    const content = fs.readFileSync(path.join(BASE_DIR, 'src/screens/wallets/PaySupplierScreen.tsx'), 'utf8');
    assert.ok(content.includes('Review China Payment'), 'Review modal present');
    assert.ok(content.includes('Authorize RMB Transfer'), 'PIN authorization present');
    assert.ok(content.includes('Payment Queued for Clearance'), 'Clearance receipt modal present');
    assert.ok(content.includes('submissionReceipt.fundingCurrency'), 'Receipt displays funding currency');
  });

  // -----------------------------------------------------------------------------
  // 2. Admin Queue for Supplier Payments in AdminPaymentsScreen & AdminRmbTransfersScreen
  // -----------------------------------------------------------------------------
  test('2.1 AdminPaymentsScreen supplier tab displays user details, supplier details, amounts, and Disburse action', () => {
    const file = path.join(BASE_DIR, 'src/screens/admin/AdminPaymentsScreen.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('Customer (User)'), 'User details column present in table header');
    assert.ok(content.includes('Supplier / Beneficiary'), 'Supplier details column present');
    assert.ok(content.includes('Amount & Funding'), 'Amount and funding column present');
    assert.ok(content.includes('handleOpenDisburseModal'), 'Disburse modal trigger present');
    assert.ok(content.includes('China Trade Remittance Evidence Protocol'), 'Disbursement evidence protocol modal present');
    assert.ok(content.includes('clearingSessionId'), 'Clearing session ID input present');
    assert.ok(content.includes('paymentProofUrl'), 'Payment proof URL input present');
    assert.ok(content.includes('safeDeclarationRef'), 'SAFE declaration reference input present');
  });

  test('2.2 AdminRmbTransfersScreen desk displays customer name, email, UID, supplier info, and Disburse action', () => {
    const file = path.join(BASE_DIR, 'src/screens/admin/AdminRmbTransfersScreen.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('custName'), 'Customer name rendered');
    assert.ok(content.includes('custEmail'), 'Customer email rendered');
    assert.ok(content.includes('payment.userId'), 'Customer UID rendered');
    assert.ok(content.includes('payment.amountRMB'), 'Amount RMB rendered');
    assert.ok(content.includes('fCurr'), 'Funding currency rendered');
    assert.ok(content.includes('handleSubmitSupplierDisbursement'), 'Disbursement submission handler present');
  });

  // -----------------------------------------------------------------------------
  // 3. Backend API Endpoints & Multi-Currency Deduction / Disbursement
  // -----------------------------------------------------------------------------
  await asyncTest('3.1 POST /api/wallets/pay-supplier supports multi-currency funding (CNY, NGN, USD)', async () => {
    // Read current user balances
    const pullRes = await request('/api/db/state');
    assert.strictEqual(pullRes.status, 200, 'Pull db state must succeed');
    const user = pullRes.data.state.users['usr_alade_01'];
    assert.ok(user, 'User usr_alade_01 exists');

    // 1. CNY Funding
    const cnyRes = await request('/api/wallets/pay-supplier', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'usr_alade_01',
        supplierName: 'Shenzhen Foxconn Micro Tech Ltd',
        receiverAccount: '13800138000',
        paymentMethod: 'Alipay',
        amountCNY: 80,
        fundingCurrency: 'CNY',
        note: 'PO #201 - Batch electronics microchips',
        pin: '246810',
        purpose: 'Supplier Payment'
      })
    });
    assert.strictEqual(cnyRes.status, 200, `CNY pay-supplier failed: ${JSON.stringify(cnyRes.data)}`);
    assert.strictEqual(cnyRes.data.payment.fundingCurrency, 'CNY');
    assert.strictEqual(cnyRes.data.payment.amountRMB, 80);
    assert.strictEqual(cnyRes.data.payment.status, 'pending');

    // 2. NGN Funding
    const ngnRes = await request('/api/wallets/pay-supplier', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'usr_alade_01',
        supplierName: 'Guangzhou Garments Factory',
        receiverAccount: 'wx_garments_gz_01',
        paymentMethod: 'WeChat Pay',
        amountCNY: 50,
        fundingCurrency: 'NGN',
        note: 'PO #202 - Sample fabrics roll',
        pin: '246810',
        purpose: 'Goods Purchase'
      })
    });
    assert.strictEqual(ngnRes.status, 200, `NGN pay-supplier failed: ${JSON.stringify(ngnRes.data)}`);
    assert.strictEqual(ngnRes.data.payment.fundingCurrency, 'NGN');
    assert.strictEqual(ngnRes.data.payment.amountRMB, 50);
    assert.ok(ngnRes.data.payment.fundingAmount > 50, 'NGN funding amount must reflect exchange rate');

    // 3. USD Funding
    const usdRes = await request('/api/wallets/pay-supplier', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'usr_alade_01',
        supplierName: 'Yiwu Commodities Ltd',
        receiverAccount: '6222021001123456789',
        bankName: 'Industrial and Commercial Bank of China (ICBC)',
        paymentMethod: 'China Bank Transfer',
        amountCNY: 72.4,
        fundingCurrency: 'USD',
        note: 'PO #203 - Kitchen supplies bulk order',
        pin: '246810',
        purpose: 'Supplier Payment'
      })
    });
    assert.strictEqual(usdRes.status, 200, `USD pay-supplier failed: ${JSON.stringify(usdRes.data)}`);
    assert.strictEqual(usdRes.data.payment.fundingCurrency, 'USD');
    assert.strictEqual(usdRes.data.payment.amountRMB, 72.4);

    // 4. Admin Disburse with transaction reference inputs
    const disburseRes = await request('/api/admin/supplier-payments/disburse', {
      method: 'POST',
      headers: { 'x-admin-role': 'finance_officer' },
      body: JSON.stringify({
        paymentId: cnyRes.data.payment.id,
        clearingSessionId: `ALIPAY-REF-${Date.now()}`,
        paymentProofUrl: 'https://storage.flyemass.com/proofs/receipt.pdf',
        safeDeclarationRef: `SAFE-2026-${Date.now()}`,
        adminNotes: 'Direct settlement executed via China Alipay Merchant Gateway',
        adminId: 'adm_finance_01'
      })
    });
    assert.strictEqual(disburseRes.status, 200, `Disbursement failed: ${JSON.stringify(disburseRes.data)}`);
    assert.strictEqual(disburseRes.data.payment.status, 'disbursed');
    assert.ok(disburseRes.data.payment.clearingSessionId, 'Clearing session ID recorded');

    // 5. Admin Refund original funding currency
    const refundRes = await request('/api/admin/supplier-payments/refund', {
      method: 'POST',
      headers: { 'x-admin-role': 'finance_officer' },
      body: JSON.stringify({
        paymentId: ngnRes.data.payment.id,
        reason: 'Beneficiary account mismatch with SAFE customs filing',
        adminId: 'adm_finance_01'
      })
    });
    assert.strictEqual(refundRes.status, 200, `Refund failed: ${JSON.stringify(refundRes.data)}`);
    assert.strictEqual(refundRes.data.payment.status, 'refunded');
  });

  // -------------------------------------------------------------
  // 4. Double-Entry Ledger Equilibrium Verification
  // -------------------------------------------------------------
  await asyncTest('4.1 Double-Entry Ledger remains in absolute equilibrium across all currencies', async () => {
    const pullRes = await request('/api/db/state');
    const ledger = pullRes.data.state.double_entry_ledger;

    let totalDebitCNY = 0, totalCreditCNY = 0;
    let totalDebitNGN = 0, totalCreditNGN = 0;
    let totalDebitUSD = 0, totalCreditUSD = 0;

    for (const entry of Object.values(ledger)) {
      for (const post of (entry.postings || [])) {
        if (post.currency === 'CNY') {
          totalDebitCNY += Number(post.debit || 0);
          totalCreditCNY += Number(post.credit || 0);
        } else if (post.currency === 'NGN') {
          totalDebitNGN += Number(post.debit || 0);
          totalCreditNGN += Number(post.credit || 0);
        } else if (post.currency === 'USD') {
          totalDebitUSD += Number(post.debit || 0);
          totalCreditUSD += Number(post.credit || 0);
        }
      }
    }

    const diffCNY = Math.abs(totalDebitCNY - totalCreditCNY);
    const diffNGN = Math.abs(totalDebitNGN - totalCreditNGN);
    const diffUSD = Math.abs(totalDebitUSD - totalCreditUSD);

    assert(diffCNY < 0.01, `CNY ledger out of equilibrium: Debit ${totalDebitCNY} != Credit ${totalCreditCNY}`);
    assert(diffNGN < 0.01, `NGN ledger out of equilibrium: Debit ${totalDebitNGN} != Credit ${totalCreditNGN}`);
    assert(diffUSD < 0.01, `USD ledger out of equilibrium: Debit ${totalDebitUSD} != Credit ${totalCreditUSD}`);

    console.log(`   ⚖️ Equilibrium verified:`);
    console.log(`      CNY: Debit ¥${totalDebitCNY.toFixed(2)} === Credit ¥${totalCreditCNY.toFixed(2)}`);
    console.log(`      NGN: Debit ₦${totalDebitNGN.toFixed(2)} === Credit ₦${totalCreditNGN.toFixed(2)}`);
    console.log(`      USD: Debit $${totalDebitUSD.toFixed(2)} === Credit $${totalCreditUSD.toFixed(2)}`);
  });

  console.log('\n=============================================================================');
  console.log('🎉 ALL "PAY CHINA SUPPLIER" FUNCTIONALITY TESTS PASSED (6/6)');
  console.log('=============================================================================\n');
}

runAll().catch((err) => {
  console.error('\n❌ Test Suite Aborted:', err);
  process.exit(1);
});
