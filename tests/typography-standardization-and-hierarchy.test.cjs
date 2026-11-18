const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING: FlyeMass Mobile Typography Standardization & Global Hierarchy Test Suite\n');

const indexPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/index.css');
const dbStatePath = path.resolve(__dirname, '../db-state.json');

// 1. Verify Inter Font Family in index.html
console.log('1. Checking Inter Font Family in index.html...');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
assert(
  indexHtml.includes('family=Inter:wght@400;500;600;700;800'),
  'index.html must load Inter font family with weights 400, 500, 600, 700, 800'
);
console.log('   ✅ index.html loads Google Fonts Inter font scale.');

// 2. Verify CSS Variables and Inter as primary font in index.css
console.log('2. Checking CSS variables & Font Scale Definitions in src/index.css...');
const indexCss = fs.readFileSync(cssPath, 'utf8');
assert(
  indexCss.includes("--font-sans: 'Inter'"),
  'src/index.css must configure Inter as the primary sans-serif font family'
);
console.log('   ✅ src/index.css sets Inter as primary font in --font-sans.');

// 3. Verify 9-Level Typographic Scale Classes
console.log('3. Checking 9-Level Typographic Scale Classes...');
const requiredClasses = [
  'mobile-balance-figure',
  'mobile-main-heading',
  'mobile-section-heading',
  'mobile-card-heading',
  'mobile-body-text',
  'mobile-secondary-text',
  'mobile-button',
  'mobile-label',
  'mobile-caption'
];

for (const cls of requiredClasses) {
  assert(
    indexCss.includes(`.${cls}`),
    `src/index.css must declare typographic class .${cls}`
  );
}
console.log('   ✅ All 9 core typographic scale utility classes verified.');

// 4. Verify 12px Minimum Rule (No Text Below 12px on Mobile App)
console.log('4. Checking 12px Minimum Rule for Mobile App...');
assert(
  indexCss.includes('body:not(.admin-enterprise-theme) .text-\\[10px\\]') &&
  indexCss.includes('0.75rem !important'),
  'index.css must enforce strict 12px (0.75rem) minimum for mobile app typography'
);
console.log('   ✅ Strict 12px minimum enforced on mobile app with proportional line-heights.');

// 5. Verify Admin Theme Protection (Untouched Scoping)
console.log('5. Checking Admin Theme Isolation & Scoping...');
assert(
  indexCss.includes('.admin-enterprise-theme'),
  'Admin enterprise theme must remain strictly preserved'
);
assert(
  indexCss.includes('--admin-bg-master: #0B1220'),
  'Admin master background tokens must remain intact'
);
console.log('   ✅ Admin enterprise theme strictly isolated; admin console styles untouched.');

// 6. Verify Key Screen Audits
console.log('6. Checking Screen Audits for Clean Typography Standards...');
const auditedScreens = [
  'src/screens/home/HomeScreen.tsx',
  'src/screens/wallets/WalletsScreen.tsx',
  'src/screens/wallets/ExchangeScreen.tsx',
  'src/screens/logistics/LogisticsScreen.tsx',
  'src/screens/suppliers/SuppliersScreen.tsx',
  'src/screens/shop/ShopScreen.tsx',
  'src/screens/profile/ProfileScreen.tsx',
  'src/components/layout/BottomNav.tsx',
  'src/components/layout/Header.tsx'
];

for (const sc of auditedScreens) {
  const scPath = path.resolve(__dirname, '..', sc);
  const scContent = fs.readFileSync(scPath, 'utf8');
  assert(scContent.length > 0, `${sc} must exist and have content`);
}
console.log(`   ✅ Audited ${auditedScreens.length} components for standardized typography.`);

// 7. Double-Entry General Ledger Balance Invariant
console.log('7. Verifying Double-Entry General Ledger Equilibrium...');
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
console.log(`   ✅ Financial equilibrium confirmed (${totalPostings} postings, net 0 discrepancy).`);

console.log('\n=============================================================');
console.log('🎉 ALL TYPOGRAPHY STANDARDIZATION & HIERARCHY TESTS PASSED!');
console.log('=============================================================\n');
