const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n=============================================================');
console.log('  FLYEMASS UI ENHANCEMENTS: 4 INSTANT ACTIONS, IBAN, STICKY HEADER');
console.log('=============================================================\n');

const homePath = path.resolve(__dirname, '../src/screens/home/HomeScreen.tsx');
const walletPath = path.resolve(__dirname, '../src/screens/wallets/WalletsScreen.tsx');
const headerPath = path.resolve(__dirname, '../src/components/layout/Header.tsx');
const quickActionSheetPath = path.resolve(__dirname, '../src/components/ui/QuickActionSheet.tsx');
const fundWalletPath = path.resolve(__dirname, '../src/screens/wallets/FundWalletScreen.tsx');

// Test 1: Only 4 instant actions on HomeScreen
console.log('--- 1. Verification of 4 Instant Actions on HomeScreen ---');
const homeContent = fs.readFileSync(homePath, 'utf8');
const quickActionsMatch = homeContent.match(/const quickActions = \[([\s\S]*?)\];/);
assert(quickActionsMatch, 'quickActions array must be defined in HomeScreen.tsx');

const quickActionsEntries = quickActionsMatch[1].trim().split('\n').filter(l => l.includes('route:'));
console.log(`Found ${quickActionsEntries.length} instant action items.`);
assert.strictEqual(quickActionsEntries.length, 4, 'Exactly 4 instant actions must be present in HomeScreen quickActions');

assert(homeContent.includes("route: 'fund'"), 'Must include Fund action');
assert(homeContent.includes("route: 'pay'"), 'Must include Pay Supplier action');
assert(homeContent.includes("route: 'exchange'"), 'Must include FX Swap action');
assert(homeContent.includes("route: 'withdraw'"), 'Must include Withdraw action');
assert(homeContent.includes('grid grid-cols-4'), 'Instant actions container must use a 4-column grid (grid-cols-4)');
console.log('✅ PASSED: Exactly 4 instant actions configured in 4-column grid on HomeScreen');

// Test 2: All other services accessible on All Services (QuickActionSheet)
console.log('\n--- 2. Verification of All Services Sheet Accessibility ---');
const sheetContent = fs.readFileSync(quickActionSheetPath, 'utf8');
assert(homeContent.includes('setIsQuickActionOpen(true)'), 'HomeScreen must have All Services button triggering QuickActionSheet');
assert(sheetContent.includes("route: 'track'"), 'All Services must include Track Cargo');
assert(sheetContent.includes("route: 'logistics'"), 'All Services must include Logistics Rates');
assert(sheetContent.includes("route: 'register-package'"), 'All Services must include Register Package');
assert(sheetContent.includes("route: 'shop'"), 'All Services must include Apple Shop');
assert(sheetContent.includes("route: 'hotels'"), 'All Services must include Hotels');
assert(sheetContent.includes("route: 'rentals-apartments'"), 'All Services must include Apartment Rentals');
assert(sheetContent.includes("route: 'rentals-offices'"), 'All Services must include Office Rentals');
assert(sheetContent.includes("route: 'suppliers'"), 'All Services must include Verified Suppliers');
assert(sheetContent.includes("route: 'agent'"), 'All Services must include Agent Sourcing');
console.log('✅ PASSED: All other service pages are accessible via All Services sheet');

// Test 3: Account details & IBAN on Wallets Screen
console.log('\n--- 3. Verification of Inbound Accounts & IBAN on WalletsScreen ---');
const walletContent = fs.readFileSync(walletPath, 'utf8');
assert(walletContent.includes('Account & IBAN Details'), 'WalletsScreen must have dedicated Account & IBAN Details section');
assert(walletContent.includes('US89JPMC02100002148902'), 'USD IBAN US89JPMC02100002148902 must be defined');
assert(walletContent.includes('CN6227003320094892'), 'CNY Virtual IBAN CN6227003320094892 must be defined');
assert(walletContent.includes('9082341902'), 'NGN NUBAN 9082341902 must be defined');
assert(walletContent.includes('CHASUS33'), 'USD SWIFT CHASUS33 must be defined');
assert(walletContent.includes('BKCHCNBJ400'), 'CNY SWIFT BKCHCNBJ400 must be defined');
assert(walletContent.includes('104581000018'), 'CNAPS Code 104581000018 must be defined');
assert(walletContent.includes('handleCopyField'), 'WalletsScreen must have copy handler for all banking fields');
assert(walletContent.includes('Copy IBAN'), 'WalletsScreen must have Copy IBAN button');
console.log('✅ PASSED: Accounts & IBAN details with copy actions fully integrated for NGN, USD, and CNY');

// Test 4: Top Header is sticky across all mobile pages
console.log('\n--- 4. Verification of Sticky Top Header Across All Pages ---');
const headerContent = fs.readFileSync(headerPath, 'utf8');
const stickyHeaders = headerContent.match(/<header className="sticky top-0 z-40 bg-slate-950\/95/g);
assert(stickyHeaders && stickyHeaders.length === 2, 'Both sub-page and home headers in Header.tsx must be sticky top-0 z-40');
assert(!headerContent.includes('className="relative z-30'), 'Relative non-sticky headers must be eliminated from Header.tsx');
console.log('✅ PASSED: Top Header is sticky top-0 with blur backdrop across all mobile screens');

// Test 5: FundWalletScreen consistency
console.log('\n--- 5. Verification of FundWalletScreen Banking Consistency ---');
const fundContent = fs.readFileSync(fundWalletPath, 'utf8');
assert(fundContent.includes('US89JPMC02100002148902'), 'FundWalletScreen must display USD IBAN US89JPMC02100002148902');
assert(fundContent.includes('CN6227003320094892'), 'FundWalletScreen must display CNY Settlement IBAN CN6227003320094892');
console.log('✅ PASSED: FundWalletScreen banking credentials match WalletsScreen');

console.log('\n=============================================================');
console.log('  ALL 5 UI ENHANCEMENT TESTS PASSED PERFECTLY!');
console.log('=============================================================\n');
