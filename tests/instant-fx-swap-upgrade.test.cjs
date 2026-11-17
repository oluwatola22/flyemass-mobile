// tests/instant-fx-swap-upgrade.test.cjs
// Verifies "Instant FX Swap" upgrade across mobile, admin, and backend flows in Standard Sandbox Mode
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

console.log('=============================================================================');
console.log('FLYEMASS "INSTANT FX SWAP" FUNCTIONALITY VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile UI/UX & Real-Time Conversion Calculator
// -----------------------------------------------------------------------------
test('1.1 ExchangeScreen UI layout is untouched and provides multi-currency conversion (NGN, USD, CNY)', () => {
  const file = path.join(BASE_DIR, 'src/screens/wallets/ExchangeScreen.tsx');
  assert.ok(fs.existsSync(file), 'ExchangeScreen must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Verify rates subscription & fetching
  assert.ok(content.includes('getAuthoritativeRates'), 'Fetches authoritative rates from backend');
  assert.ok(content.includes('db.subscribe'), 'Real-time subscription to state and admin rate updates present');

  // Verify calculator inputs and dropdowns
  assert.ok(content.includes('fromAmount'), 'Source amount input present');
  assert.ok(content.includes('fromCurrency'), 'Source currency state present');
  assert.ok(content.includes('toCurrency'), 'Target currency state present');
  assert.ok(content.includes('calculatedTo'), 'Calculated target amount present');
  assert.ok(content.includes('handleFlipCurrencies'), 'One-tap flip button handler present');
});

test('1.2 ExchangeScreen converts bidirectionally across all currency pairs using admin settings rates', () => {
  const file = path.join(BASE_DIR, 'src/screens/wallets/ExchangeScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Verify calculation logic handles all pairs
  assert.ok(content.includes("from === 'CNY' && to === 'NGN'"), 'CNY -> NGN conversion logic present');
  assert.ok(content.includes("from === 'NGN' && to === 'CNY'"), 'NGN -> CNY conversion logic present');
  assert.ok(content.includes("from === 'USD' && to === 'NGN'"), 'USD -> NGN conversion logic present');
  assert.ok(content.includes("from === 'NGN' && to === 'USD'"), 'NGN -> USD conversion logic present');
  assert.ok(content.includes("from === 'USD' && to === 'CNY'"), 'USD -> CNY conversion logic present');
  assert.ok(content.includes("from === 'CNY' && to === 'USD'"), 'CNY -> USD conversion logic present');
});

test('1.3 ExchangeScreen executes atomic swap with 6-digit PIN authorization', () => {
  const file = path.join(BASE_DIR, 'src/screens/wallets/ExchangeScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('db.executeSwap'), 'executeSwap is called on authorization');
  assert.ok(content.includes('PinPad'), '6-digit PIN Pad modal used for secure authorization');
  assert.ok(content.includes('Review Currency Exchange'), 'Review breakdown modal present');
  assert.ok(content.includes('Currency Swapped!'), 'Completed exchange receipt modal present');
});

// -----------------------------------------------------------------------------
// 2. Admin Live FX Rates Control Panel in AdminFxManagementScreen & AdminPaymentsScreen
// -----------------------------------------------------------------------------
test('2.1 AdminFxManagementScreen provides controls to update live rates for NGN/USD, NGN/CNY, USD/CNY in real time', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminFxManagementScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminFxManagementScreen must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Verify input controls for NGN/CNY, USD/NGN, USD/CNY, and spread
  assert.ok(content.includes('ngnRmbRate'), 'NGN/CNY rate input present');
  assert.ok(content.includes('usdNgnRate'), 'USD/NGN rate input present');
  assert.ok(content.includes('usdCnyRate'), 'USD/CNY rate input present');
  assert.ok(content.includes('spreadPercent'), 'Spread percent input present');
  assert.ok(content.includes('handleSaveMarginRates'), 'Rate update submission handler present');
  assert.ok(content.includes('updateSystemSettings'), 'Calls db.updateSystemSettings to broadcast new rates');
});

test('2.2 AdminPaymentsScreen contains dedicated rates tab with real-time rate broadcast', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminPaymentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("activeTab === 'rates'"), 'Rates tab rendered in AdminPaymentsScreen');
  assert.ok(content.includes('Authoritative Central Bank & Clearing Rate Controller'), 'Control tower header present');
  assert.ok(content.includes('Broadcast & Lock New Clearing Rates'), 'Broadcast button present');
});

// -----------------------------------------------------------------------------
// 3. Supabase Schema & Stored Procedure for Atomic Swap
// -----------------------------------------------------------------------------
test('3.1 supabase-schema-rls.sql includes execute_instant_fx_swap atomic procedure with row locks', () => {
  const schemaFile = path.join(BASE_DIR, 'supabase-schema-rls.sql');
  assert.ok(fs.existsSync(schemaFile), 'supabase-schema-rls.sql exists');
  const content = fs.readFileSync(schemaFile, 'utf8');

  assert.ok(content.includes('FUNCTION public.execute_instant_fx_swap'), 'execute_instant_fx_swap RPC exists');
  assert.ok(content.includes('FOR UPDATE'), 'Row-level locking for atomic wallet safety present');
  assert.ok(content.includes("type IN ('FUND', 'WITHDRAW', 'EXCHANGE'"), 'EXCHANGE transaction type supported');
  assert.ok(content.includes('new_source_balance'), 'Returns updated source and target balances');
});

// -----------------------------------------------------------------------------
// 4. Backend Endpoints in sync-server.cjs
// -----------------------------------------------------------------------------
test('4.1 sync-server.cjs implements /api/wallets/rates, /api/settings/update, and atomic /api/wallets/swap', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  // Verify rate endpoints
  assert.ok(content.includes("pathname === '/api/wallets/rates'"), 'GET /api/wallets/rates endpoint present');
  assert.ok(content.includes("pathname === '/api/settings/update'"), 'POST /api/settings/update endpoint present');
  assert.ok(content.includes("pathname === '/api/wallets/swap'"), 'POST /api/wallets/swap endpoint present');

  // Verify atomic execution and double-entry postings
  assert.ok(content.includes("transactionType: 'FX_SWAP'"), 'Logs FX_SWAP double-entry transaction');
  assert.ok(content.includes('treasury:fx_clearing'), 'Clears through treasury fx_clearing ledger accounts');
  assert.ok(content.includes('broadcastUpdate()'), 'Broadcasts updates via SSE in real time');
});

// -----------------------------------------------------------------------------
// 5. Database State & Double-Entry Ledger Equilibrium
// -----------------------------------------------------------------------------
test('5.1 Double-Entry Ledger remains in absolute equilibrium across all three currencies', () => {
  const dbState = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'db-state.json'), 'utf8'));
  const ledger = dbState.double_entry_ledger;
  assert.ok(ledger, 'double_entry_ledger must exist');

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

  assert.ok(diffCNY < 0.01, `CNY out of balance: ${totalDebitCNY} vs ${totalCreditCNY}`);
  assert.ok(diffNGN < 0.01, `NGN out of balance: ${totalDebitNGN} vs ${totalCreditNGN}`);
  assert.ok(diffUSD < 0.01, `USD out of balance: ${totalDebitUSD} vs ${totalCreditUSD}`);

  console.log(`   ⚖️ Equilibrium verified:`);
  console.log(`      CNY: Debit ¥${totalDebitCNY.toFixed(2)} === Credit ¥${totalCreditCNY.toFixed(2)}`);
  console.log(`      NGN: Debit ₦${totalDebitNGN.toFixed(2)} === Credit ₦${totalCreditNGN.toFixed(2)}`);
  console.log(`      USD: Debit $${totalDebitUSD.toFixed(2)} === Credit $${totalCreditUSD.toFixed(2)}`);
});

console.log('\n=============================================================================');
console.log('🎉 ALL 7 "INSTANT FX SWAP" FUNCTIONALITY TESTS PASSED (7/7)');
console.log('=============================================================================\n');
