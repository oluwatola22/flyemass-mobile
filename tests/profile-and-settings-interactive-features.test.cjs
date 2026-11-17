const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('--- STARTING PROFILE & SETTINGS INTERACTIVE FEATURES TEST SUITE ---');
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

  // Test 1: Verify Streamlined Language Selector in ProfileScreen & AppContext (EN & FR only)
  test('AppContext & ProfileScreen provide streamlined 2-trade-language support (EN & FR)', () => {
    const appContextContent = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');

    assert(appContextContent.includes("language: Language") || appContextContent.includes("language: 'EN' | 'FR'"), 'AppContext must define streamlined language type');
    assert(appContextContent.includes("localStorage.setItem('flyemass_language', lang)"), 'AppContext must persist language to localStorage');
    assert(profileScreenContent.includes("English (Primary)"), 'ProfileScreen must render English (Primary) option');
    assert(profileScreenContent.includes("Français"), 'ProfileScreen must render Français option');
    assert(!profileScreenContent.includes("['EN', 'ZH', 'YO', 'HA']"), 'ProfileScreen must remove Chinese, Yoruba, Hausa');
  });

  // Test 2: Verify Security Settings & PIN wiring
  test('Security Settings & PIN item correctly wired to "security" route', () => {
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
    assert(profileScreenContent.includes("route: 'security'"), 'ProfileScreen must configure route: security');
    assert(profileScreenContent.includes("Manage 4-digit PIN, 2FA & sessions"), 'Security description must be accurate');
  });

  // Test 3: Verify Device Migration & Biometrics wiring and back navigation
  test('Device Migration & Biometrics item wired to "switch-device" with smart back navigation', () => {
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
    const switchDeviceContent = fs.readFileSync(path.join(__dirname, '../src/screens/auth/SwitchDeviceScreen.tsx'), 'utf8');

    assert(profileScreenContent.includes("route: 'switch-device'"), 'ProfileScreen must route to switch-device');
    assert(switchDeviceContent.includes("if (isAuthenticated)"), 'SwitchDeviceScreen must handle authenticated back navigation');
    assert(switchDeviceContent.includes("navigate('profile')"), 'SwitchDeviceScreen must allow returning to profile');
  });

  // Test 4: Verify Zero-KYC Policy & Complete Removal of KYC Modal from ProfileScreen
  test('ProfileScreen strictly removes KYC menu item, showKycModal and verification barriers', () => {
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');

    assert(!profileScreenContent.includes("setShowKycModal"), 'ProfileScreen must NOT define or call setShowKycModal');
    assert(!profileScreenContent.includes("KYC & Trade Compliance"), 'ProfileScreen must NOT render KYC menu item');
    assert(!profileScreenContent.includes("Tier 3 Enterprise Verified Exporter"), 'ProfileScreen must NOT render Tier 3 KYC modal');
    assert(!profileScreenContent.includes("Download Compliance Dossier"), 'ProfileScreen must NOT render compliance dossier modal');
    assert(!profileScreenContent.includes("Request Tier 4 Super-Exporter Review"), 'ProfileScreen must NOT render KYC tier review button');
  });

  // Test 5: Verify Concierge & Trade Support items wiring
  test('Concierge & Trade Support desk correctly routed (support-chat, support-tickets, support)', () => {
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
    assert(profileScreenContent.includes("route: 'support-chat'"), 'Live Concierge must route to support-chat');
    assert(profileScreenContent.includes("route: 'support-tickets'"), 'Support Tickets Desk must route to support-tickets');
    assert(profileScreenContent.includes("route: 'support'"), 'Help Center must route to support');
  });

  // Test 6: Verify Support FAQs cover Form M customs clearing
  test('Support FAQs include Single-Window Form M & customs clearing guidelines', () => {
    const supportContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/SupportScreen.tsx'), 'utf8');
    assert(supportContent.includes("Form M"), 'Support FAQs must include Form M clearing');
    assert(supportContent.includes("customs or cargo dispute"), 'Support FAQs must include cargo dispute resolution');
  });

  // Test 7: Verify Legal, Compliance & Governance routing
  test('Legal & Compliance items correctly routed (terms, privacy, delete-account)', () => {
    const profileScreenContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
    assert(profileScreenContent.includes("route: 'terms'"), 'Terms of service must route to terms');
    assert(profileScreenContent.includes("route: 'privacy'"), 'Privacy policy must route to privacy');
    assert(profileScreenContent.includes("route: 'delete-account'"), 'Delete account must route to delete-account');
  });

  // Test 8: Verify Account Deletion Request implementation
  test('Account Deletion Request invokes backend API with 14-day grace period protocol', () => {
    const legalContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/LegalScreens.tsx'), 'utf8');
    const dbContent = fs.readFileSync(path.join(__dirname, '../src/services/db.ts'), 'utf8');
    const syncServerContent = fs.readFileSync(path.join(__dirname, '../sync-server.cjs'), 'utf8');

    assert(legalContent.includes("db.requestAccountDeletion(activeUserId, reason)"), 'LegalScreens must call db.requestAccountDeletion');
    assert(legalContent.includes("deletionRef"), 'LegalScreens must display deletion reference');
    assert(dbContent.includes("requestAccountDeletion(userId: string, reason: string)"), 'db.ts must implement requestAccountDeletion');
    assert(dbContent.includes("/api/auth/delete-account"), 'db.ts must target /api/auth/delete-account');
    assert(syncServerContent.includes("pathname === '/api/auth/delete-account'"), 'sync-server.cjs must handle /api/auth/delete-account');
    assert(syncServerContent.includes("status: 'GRACE_PERIOD_ACTIVE'"), 'sync-server.cjs must enforce GRACE_PERIOD_ACTIVE');
    assert(syncServerContent.includes("gracePeriodDays: 14"), 'sync-server.cjs must specify 14-day grace period');
  });

  // Test 9: Verify general ledger mathematical equilibrium
  test('General ledger maintains strict equilibrium ($0.0000, ₦0.0000, ¥0.0000 discrepancy)', () => {
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

  // Test 10: Verify mobile shell routing integrity
  test('MobileShell contains mappings for all profile and settings subroutes', () => {
    const shellContent = fs.readFileSync(path.join(__dirname, '../src/components/layout/MobileShell.tsx'), 'utf8');
    assert(shellContent.includes("case 'security': return <SecurityScreen />"), 'MobileShell must render SecurityScreen');
    assert(shellContent.includes("case 'support': return <SupportScreen />"), 'MobileShell must render SupportScreen');
    assert(shellContent.includes("case 'support-chat': return <SupportChatScreen />"), 'MobileShell must render SupportChatScreen');
    assert(shellContent.includes("case 'support-tickets': return <SupportTicketsScreen initialView=\"list\" />"), 'MobileShell must render SupportTicketsScreen');
    assert(shellContent.includes("case 'terms': return <TermsScreen />"), 'MobileShell must render TermsScreen');
    assert(shellContent.includes("case 'privacy': return <PrivacyScreen />"), 'MobileShell must render PrivacyScreen');
    assert(shellContent.includes("case 'delete-account': return <DeleteAccountScreen />"), 'MobileShell must render DeleteAccountScreen');
  });

  console.log(`\nRESULTS: ${passed}/${total} TESTS PASSED.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
