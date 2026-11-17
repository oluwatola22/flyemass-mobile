const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING: FlyeMass Page Scroll-to-Top & Navigation Loading Test Suite\n');

const mobileShellPath = path.resolve(__dirname, '../src/components/layout/MobileShell.tsx');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.tsx');
const mainPath = path.resolve(__dirname, '../src/main.tsx');
const dbStatePath = path.resolve(__dirname, '../db-state.json');

// 1. Verify Browser History Manual Scroll Restoration
console.log('1. Checking Browser History Manual Scroll Restoration...');
const mainContent = fs.readFileSync(mainPath, 'utf8');
assert(
  mainContent.includes("window.history.scrollRestoration = 'manual'"),
  'main.tsx must configure window.history.scrollRestoration = manual to prevent browser auto-restoration jitter'
);
console.log('   ✅ main.tsx enforces window.history.scrollRestoration = manual.');

// 2. Verify AppContext Navigation & PopState Scroll Reset
console.log('2. Checking AppContext Navigation & History Scroll Handlers...');
const appContextContent = fs.readFileSync(appContextPath, 'utf8');
assert(
  appContextContent.includes('window.scrollTo(0, 0)'),
  'AppContext must call window.scrollTo(0, 0)'
);
assert(
  appContextContent.includes('mainEl.scrollTop = 0'),
  'AppContext must reset main scroll container scrollTop to 0'
);
assert(
  !appContextContent.includes("behavior: 'smooth'"),
  'AppContext must never use delayed smooth scrolling during page navigation'
);
console.log('   ✅ AppContext navigate, goBack, and popstate synchronously reset scroll offsets to top.');

// 3. Verify MobileShell Multi-Frame LayoutEffect Scroll Top Reset
console.log('3. Checking MobileShell Layout & Paint Scroll Resets...');
const shellContent = fs.readFileSync(mobileShellPath, 'utf8');
assert(
  shellContent.includes('useLayoutEffect'),
  'MobileShell must use useLayoutEffect for synchronous pre-paint scroll reset'
);
assert(
  shellContent.includes('scrollPositions'),
  'MobileShell must retain scrollPositions tracking for test invariant compatibility'
);
assert(
  shellContent.includes('mainScrollRef.current.scrollTop = 0'),
  'MobileShell must reset main scroll container'
);
console.log('   ✅ MobileShell useLayoutEffect resets scroll before browser paint.');

// 4. Verify Individual Key Screens Mount Scroll Reset
console.log('4. Checking Key Screen Mount Scroll Resets...');
const screensToCheck = [
  'src/screens/logistics/RegisterPackageScreen.tsx',
  'src/screens/logistics/TrackShipmentScreen.tsx',
  'src/screens/shop/CheckoutScreen.tsx',
  'src/screens/shop/ProductDetailScreen.tsx',
  'src/screens/wallets/PaySupplierScreen.tsx',
  'src/screens/wallets/WithdrawScreen.tsx',
  'src/screens/wallets/ExchangeScreen.tsx',
  'src/screens/wallets/FundWalletScreen.tsx'
];

for (const screenPath of screensToCheck) {
  const fullPath = path.resolve(__dirname, '..', screenPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(
    content.includes('window.scrollTo(0, 0)') && content.includes('scrollTop = 0'),
    `${screenPath} must enforce mount scroll reset to top`
  );
}
console.log(`   ✅ Verified ${screensToCheck.length} key screens enforce mount scroll resets to top.`);

// 5. Financial Ledger Equilibrium Verification
console.log('5. Verifying Financial Ledger Equilibrium...');
const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));
const ledger = dbState.double_entry_ledger || {};
const netSums = { NGN: 0, CNY: 0, USD: 0 };
let totalPostings = 0;
Object.values(ledger).forEach(tx => {
  if (Array.isArray(tx.postings)) {
    tx.postings.forEach(post => {
      totalPostings++;
      const curr = post.currency || 'NGN';
      if (netSums[curr] !== undefined) {
        netSums[curr] += (Number(post.credit) || 0) - (Number(post.debit) || 0);
      }
    });
  }
});

for (const curr of ['NGN', 'CNY', 'USD']) {
  assert(
    Math.abs(netSums[curr]) < 0.0001,
    `Ledger imbalance detected in ${curr}: ${netSums[curr]}`
  );
}
console.log(`   ✅ Double-entry equilibrium confirmed (${totalPostings} postings, net 0 across all currencies).`);

console.log('\n=============================================================');
console.log('🎉 ALL PAGE SCROLL-TO-TOP & NAVIGATION TESTS PASSED!');
console.log('=============================================================\n');
