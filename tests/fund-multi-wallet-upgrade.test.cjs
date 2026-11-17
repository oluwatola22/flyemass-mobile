const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=============================================================================');
console.log('FLYEMASS FUND MULTI-WALLET (NGN, CNY, USD) VERIFICATION TEST SUITE');
console.log('=============================================================================\n');

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

// -----------------------------------------------------------------------------
// 1. Mobile UI/UX Multi-Wallet Funding Logic
// -----------------------------------------------------------------------------
test('1.1 FundWalletScreen UI layout is untouched and supports NGN, CNY, USD', () => {
  const filePath = path.join(BASE_DIR, 'src/screens/wallets/FundWalletScreen.tsx');
  assert.ok(fs.existsSync(filePath), 'FundWalletScreen must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify wallet selection
  assert.ok(content.includes("(['NGN', 'USD', 'CNY'] as Currency[])"), 'Multi-wallet selector present');
  assert.ok(content.includes('<span>{c} Account</span>'), 'Currency account button label present');

  // Verify amount input and presets
  assert.ok(content.includes('Deposit Amount ({selectedCurrency})'), 'Amount input header present');
  assert.ok(content.includes('presets.map'), 'Dynamic presets by currency present');

  // Verify gateway simulation controls
  assert.ok(content.includes('Gateway Simulator'), 'Gateway simulation controls present');
  assert.ok(content.includes('Simulate Success'), 'Simulate success option present');
  assert.ok(content.includes('Simulate Decline'), 'Simulate decline option present');
  assert.ok(content.includes('simulateGatewayFunding'), 'Backend gateway simulation integration wired');
});

// -----------------------------------------------------------------------------
// 2. Multi-Wallet State and Database Tenancy
// -----------------------------------------------------------------------------
test('2.1 dbState contains active multi-currency balances for NGN, USD, and CNY', () => {
  const dbState = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'db-state.json'), 'utf8'));
  const user = dbState.users['usr_alade_01'];
  assert.ok(user, 'User exists in dbState');
  assert.ok(typeof user.balances.NGN === 'number', 'NGN balance is numeric');
  assert.ok(typeof user.balances.USD === 'number', 'USD balance is numeric');
  assert.ok(typeof user.balances.CNY === 'number', 'CNY balance is numeric');
});

// -----------------------------------------------------------------------------
// 3. Admin Dashboard Funding Requests & Transaction Logs
// -----------------------------------------------------------------------------
test('3.1 AdminFundingScreen contains "Funding Requests & Logs" with Pending, Completed, Failed indicators', () => {
  const adminFundingPath = path.join(BASE_DIR, 'src/screens/admin/AdminFundingScreen.tsx');
  const content = fs.readFileSync(adminFundingPath, 'utf8');

  assert.ok(content.includes('Funding Requests & Logs'), 'Funding Requests & Logs tab present');
  assert.ok(content.includes('allFundingRequests'), 'Aggregates all user funding requests');
  assert.ok(content.includes('pendingRequests'), 'Filters pending requests');
  assert.ok(content.includes('completedRequests'), 'Filters completed requests');
  assert.ok(content.includes('failedRequests'), 'Filters failed requests');

  // Status indicators
  assert.ok(content.includes('Pending'), 'Pending status indicator');
  assert.ok(content.includes('Completed'), 'Completed status indicator');
  assert.ok(content.includes('Failed'), 'Failed status indicator');

  // Multi-Currency filters (NGN, USD, CNY)
  assert.ok(content.includes("['all', 'NGN', 'USD', 'CNY']"), 'Multi-currency filter buttons for NGN, USD, CNY');
});

test('3.2 AdminPaymentsScreen contains multi-currency deposits and status indicators', () => {
  const adminPaymentsPath = path.join(BASE_DIR, 'src/screens/admin/AdminPaymentsScreen.tsx');
  const content = fs.readFileSync(adminPaymentsPath, 'utf8');

  assert.ok(content.includes("depositCurrencyFilter, setDepositCurrencyFilter] = useState<'all' | 'NGN' | 'USD' | 'CNY'>"), 'Supports NGN, USD, CNY in deposits');
  assert.ok(content.includes("dep.currency === 'NGN' ? '₦' : dep.currency === 'CNY' ? '¥' : '$'"), 'Displays appropriate currency symbols');
  assert.ok(content.includes('Completed'), 'Completed indicator present');
  assert.ok(content.includes('Failed'), 'Failed indicator present');
  assert.ok(content.includes('Pending'), 'Pending indicator present');
});

// -----------------------------------------------------------------------------
// 4. Double-Entry Accounting Equilibrium Across Currencies
// -----------------------------------------------------------------------------
test('4.1 Double-Entry Ledger equilibrium across NGN, USD, and CNY', () => {
  const dbState = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'db-state.json'), 'utf8'));
  const ledger = dbState.double_entry_ledger;
  assert.ok(ledger, 'double_entry_ledger must exist');

  const totals = { NGN: 0, CNY: 0, USD: 0 };
  let count = 0;
  for (const entry of Object.values(ledger)) {
    if (entry.postings && Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        totals[p.currency] = (totals[p.currency] || 0) + (p.debit || 0) - (p.credit || 0);
        count++;
      }
    }
  }

  assert.ok(Math.abs(totals.NGN) < 0.01, `NGN ledger unbalanced: ${totals.NGN}`);
  assert.ok(Math.abs(totals.USD) < 0.01, `USD ledger unbalanced: ${totals.USD}`);
  assert.ok(Math.abs(totals.CNY) < 0.01, `CNY ledger unbalanced: ${totals.CNY}`);
  console.log(`   ⚖️ Verified ${count} postings across NGN, USD, CNY with Net 0.`);
});

console.log(`\n=============================================================================`);
console.log(`ALL 5 FUND MULTI-WALLET UPGRADE TESTS PASSED SUCCESSFULLY!`);
console.log(`=============================================================================\n`);
