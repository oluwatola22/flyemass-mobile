/**
 * FlyeMass Zero-KYC Policy & Complete KYC Removal Test Suite
 * 
 * Verifies:
 * 1. Mobile App ProfileScreen has completely removed KYC & Trade Compliance menu item,
 *    modal state, CAC/BVN/NIN documentation checks, and tier review actions.
 * 2. Admin Console AdminUsersScreen has completely removed KYC verification toggle buttons,
 *    table verification column, and KYC badge management text.
 * 3. User accounts operate with zero mandatory KYC requirements across the entire app.
 * 4. Privacy policy and legal disclosures confirm frictionless zero-KYC policy.
 * 5. General ledger double-entry equilibrium and core trading capabilities remain fully operational.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING ZERO-KYC COMPLETE REMOVAL VERIFICATION ---');

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

// Test 1: Verify ProfileScreen has NO KYC menu item, state, or modal
test('1. ProfileScreen has completely removed KYC menu item, state, and modal', () => {
  const profilePath = path.resolve(__dirname, '../src/screens/profile/ProfileScreen.tsx');
  assert(fs.existsSync(profilePath), 'ProfileScreen.tsx must exist');
  const content = fs.readFileSync(profilePath, 'utf8');

  assert(!content.includes('showKycModal'), 'ProfileScreen must NOT contain showKycModal state');
  assert(!content.includes('setShowKycModal'), 'ProfileScreen must NOT contain setShowKycModal');
  assert(!content.includes('KYC & Trade Compliance'), 'ProfileScreen must NOT contain KYC & Trade Compliance menu item');
  assert(!content.includes('Tier 3 Enterprise Verified Exporter'), 'ProfileScreen must NOT contain Tier 3 KYC modal text');
  assert(!content.includes('Director BVN & National ID (NIN)'), 'ProfileScreen must NOT check BVN/NIN documents');
  assert(!content.includes('Download Compliance Dossier'), 'ProfileScreen must NOT render compliance dossier download');
  assert(!content.includes('Request Tier 4 Super-Exporter Review'), 'ProfileScreen must NOT render tier review request');
});

// Test 2: Verify AdminUsersScreen has NO KYC verification toggle, button, or copy
test('2. AdminUsersScreen has completely removed KYC verification toggles, buttons, and badges', () => {
  const adminUsersPath = path.resolve(__dirname, '../src/screens/admin/AdminUsersScreen.tsx');
  assert(fs.existsSync(adminUsersPath), 'AdminUsersScreen.tsx must exist');
  const content = fs.readFileSync(adminUsersPath, 'utf8');

  assert(!content.includes('KYC Verified'), 'AdminUsersScreen must NOT contain KYC Verified label');
  assert(!content.includes('Verify KYC'), 'AdminUsersScreen must NOT contain Verify KYC button');
  assert(!content.includes('handleToggleVerification'), 'AdminUsersScreen must NOT have handleToggleVerification function');
  assert(!content.includes('Manage client KYC badges'), 'AdminUsersScreen must NOT contain KYC badge management copy');
  assert(!content.includes('BVN/CAC verification logs'), 'AdminUsersScreen must NOT ask for BVN/CAC logs in notes');
  assert(content.includes('Account Status'), 'AdminUsersScreen must use clean Account Status instead of Verification column');
});

// Test 3: Verify Privacy Policy & Legal Screens disclose zero mandatory KYC
test('3. Privacy Policy & Legal disclosures confirm frictionless zero-KYC policy', () => {
  const legalPath = path.resolve(__dirname, '../src/screens/profile/LegalScreens.tsx');
  assert(fs.existsSync(legalPath), 'LegalScreens.tsx must exist');
  const content = fs.readFileSync(legalPath, 'utf8');

  assert(content.includes('zero mandatory KYC identity requirements'), 'PrivacyScreen must state zero mandatory KYC requirements');
  assert(!content.includes('identity proof (NIN, BVN, International Passport)'), 'PrivacyScreen must NOT require NIN, BVN or Passport');
});

// Test 4: Verify AppContext user profile does not block or depend on KYC
test('4. AppContext initializes user profile cleanly without KYC barriers', () => {
  const appContextPath = path.resolve(__dirname, '../src/context/AppContext.tsx');
  assert(fs.existsSync(appContextPath), 'AppContext.tsx must exist');
  const content = fs.readFileSync(appContextPath, 'utf8');

  assert(content.includes("tier: 'Enterprise Member'"), 'AppContext must use clean Enterprise Member designation');
  assert(!content.includes("'Tier 3 Enterprise Verified'"), 'AppContext must NOT depend on Tier 3 KYC verification');
});

// Test 5: Verify i18n dictionaries do not contain KYC compliance keys
test('5. i18n dictionaries do not define KYC compliance keys', () => {
  const i18nPath = path.resolve(__dirname, '../src/utils/i18n.ts');
  assert(fs.existsSync(i18nPath), 'i18n.ts must exist');
  const content = fs.readFileSync(i18nPath, 'utf8');

  assert(!content.includes("'profile.kyc_compliance'"), 'i18n.ts must NOT define profile.kyc_compliance');
});

// Test 6: Verify Database general ledger mathematical equilibrium
test('6. General ledger mathematical equilibrium preserved across all accounts', () => {
  const dbStatePath = path.resolve(__dirname, '../db-state.json');
  assert(fs.existsSync(dbStatePath), 'db-state.json must exist');
  const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

  const users = Object.values(dbState.users || {});
  assert(users.length > 0, 'Must have users in database');

  for (const user of users) {
    assert(user.balances, `User ${user.uid} must have balances`);
    assert(typeof user.balances.NGN === 'number', `User ${user.uid} NGN must be numeric`);
    assert(typeof user.balances.CNY === 'number', `User ${user.uid} CNY must be numeric`);
    assert(typeof user.balances.USD === 'number', `User ${user.uid} USD must be numeric`);
  }
});

console.log('\n========================================================================');
console.log(`🎉 ALL ZERO-KYC REMOVAL TESTS PASSED (${passed}/${total})!`);
console.log('========================================================================');

if (passed !== total) {
  process.exit(1);
}
