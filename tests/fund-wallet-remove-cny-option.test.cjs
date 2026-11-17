/**
 * FLYEMASS FUND WALLET - REMOVE CNY ACCOUNT OPTION TEST SUITE
 * 
 * Verifies:
 * 1. Destination Wallet Selector:
 *    - Renders only two accounts: NGN Account and USD Account
 *    - 2-column responsive grid layout (grid-cols-2)
 *    - CNY Account completely removed from selector
 * 2. Complete Removal of CNY Channels:
 *    - Bank of China / CIPS Direct Clearing removed
 *    - CNAPS code and CNY IBAN removed
 *    - Confirm CIPS clearing CTA button removed
 * 3. Preservation of Permitted Funding Rails:
 *    - NGN Account connected to automated gateways (Providus and Korapay)
 *    - USD Account connected to manual wire transfer with receipt upload
 * 4. General Ledger Mathematical Equilibrium:
 *    - Exact 0.0000 discrepancy verification across all currencies
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('--- STARTING FUND WALLET REMOVE CNY OPTION TEST SUITE ---');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  const fundScreenPath = path.join(__dirname, '../src/screens/wallets/FundWalletScreen.tsx');
  assert(fs.existsSync(fundScreenPath), 'FundWalletScreen.tsx must exist');
  const fundContent = fs.readFileSync(fundScreenPath, 'utf8');

  // Test 1: Destination Wallet Selector contains only NGN and USD
  test('Destination wallet selector presents only NGN Account and USD Account in 2-column grid', () => {
    assert(fundContent.includes('grid-cols-2'), 'Must use grid-cols-2 for destination wallet selector');
    assert(fundContent.includes("['NGN', 'USD']"), 'Must only iterate over NGN and USD');
    assert(!fundContent.includes("['NGN', 'USD', 'CNY']"), 'Must not include CNY in selector array');
    assert(!fundContent.includes("c === 'CNY'"), 'Must not have c === CNY ternary in selector');
  });

  // Test 2: CNY Account card and copy completely removed
  test('CNY Account card is completely removed from selector', () => {
    assert(!fundContent.includes('🇨🇳'), 'CNY country flag must not appear in selector');
    assert(!fundContent.includes('CNY Account'), 'CNY Account text must not exist in FundWalletScreen');
  });

  // Test 3: CNY Bank of China and CIPS clearing elements completely removed
  test('All CNY specific deposit forms, IBAN, and CIPS clearing buttons are removed', () => {
    assert(!fundContent.includes('Bank of China / CIPS Direct Clearing'), 'Bank of China / CIPS section must be removed');
    assert(!fundContent.includes('CN6227003320094892'), 'CNY IBAN CN6227003320094892 must be removed');
    assert(!fundContent.includes('Confirm CIPS Clearing'), 'Confirm CIPS Clearing button must be removed');
    assert(!fundContent.includes('104581000018'), 'CNAPS code must be removed');
    assert(!fundContent.includes('BKCHCNBJ400'), 'SWIFT / BIC for Bank of China must be removed');
  });

  // Test 4: NGN automated funding rails preserved
  test('NGN automated funding rails (Providus and Korapay) remain active and functional', () => {
    assert(fundContent.includes('Providus Dedicated Virtual Account'), 'Providus channel must exist');
    assert(fundContent.includes('Korapay Automated Payment Gateway'), 'Korapay channel must exist');
    assert(fundContent.includes('handleGatewayDeposit'), 'Gateway deposit handler must exist');
  });

  // Test 5: USD manual wire funding rail preserved
  test('USD manual bank wire transfer with receipt upload remains active and functional', () => {
    assert(fundContent.includes('setMethod(\'wire\')'), 'USD wire method must exist');
    assert(fundContent.includes('usdReceiptUrl'), 'USD receipt upload state must exist');
    assert(fundContent.includes('handleSubmitUsdWire'), 'USD wire submission handler must exist');
    assert(fundContent.includes('JPMorgan Chase Bank, N.A.'), 'USD treasury bank details must exist');
  });

  // Test 6: General Ledger maintains strict 0.0000 mathematical equilibrium
  test('Authoritative double-entry general ledger in db-state.json maintains exact 0.0000 equilibrium', () => {
    const dbStateRaw = fs.readFileSync(path.join(__dirname, '../db-state.json'), 'utf8');
    const dbState = JSON.parse(dbStateRaw);

    let totalCredits = 0;
    let totalDebits = 0;

    const ledger = dbState.ledger || [];
    for (const entry of ledger) {
      if (entry.credit) totalCredits += Number(entry.credit);
      if (entry.debit) totalDebits += Number(entry.debit);
    }

    const discrepancy = Math.abs(totalCredits - totalDebits);
    assert(discrepancy < 0.0001, `Ledger imbalance detected: credits=${totalCredits}, debits=${totalDebits}, diff=${discrepancy}`);
  });

  console.log(`\nRESULTS: ${passed}/${total} TESTS PASSED.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
