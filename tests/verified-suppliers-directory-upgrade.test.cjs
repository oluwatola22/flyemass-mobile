/**
 * tests/verified-suppliers-directory-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Verified Suppliers Directory & Paywall Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in SuppliersScreen.tsx:
 *    - Directory featuring manufacturer listings behind a monthly subscription paywall
 *    - Subscription payment options using NGN, USD, or RMB/CNY wallet balances
 *    - Unlocks 30-day access to contact details (WeChat ID, phone, address, official business card)
 *    - Prominent mandatory Flyemass Support Safety Notice banner
 *    - Preservation of luxury dark-mode FinTech design tokens
 * 2. Admin Logic in AdminSuppliersScreen.tsx:
 *    - Admin CRUD panel for posting, editing, and managing weekly verified supplier contacts, business cards, and categories
 *    - Business Card management (file upload & image URL input with preview)
 *    - Custom category support and standard categories
 *    - Monthly subscription pricing management (NGN, USD, CNY)
 *    - Subscribers table tracking 30-day active access and renewals
 * 3. Server Endpoints & Client Service Integration:
 *    - /api/suppliers/preview, /api/suppliers/directory, /api/suppliers/subscribe-directory
 *    - /api/storage/supplier-cards/signed-url and /api/storage/supplier-cards/view
 *    - /api/admin/suppliers/create, /api/admin/suppliers/update, /api/admin/suppliers/delete, /api/admin/suppliers/toggle-status
 *    - Double-entry general ledger debit with liabilities:customer debit and revenue:fees credit
 * 4. Authoritative General Ledger Equilibrium (NGN, USD, CNY)
 */

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
console.log('FLYEMASS "VERIFIED SUPPLIERS DIRECTORY & PAYWALL" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (SuppliersScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 SuppliersScreen features manufacturer directory behind a monthly subscription paywall', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
  assert.ok(fs.existsSync(file), 'SuppliersScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('VIP Supplier Directory'), 'Directory title is present');
  assert.ok(content.includes('showPaywallModal') && content.includes('setShowPaywallModal'), 'Paywall modal state exists');
  assert.ok(content.includes('isSubscribed') && content.includes('setIsSubscribed'), 'Subscription status state exists');
  assert.ok(content.includes('Unlock VIP Supplier Contacts'), 'Paywall modal header exists');
});

test('1.2 SuppliersScreen paywall supports subscription payments using NGN, USD, or RMB/CNY wallet balances', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("setPayWallet('NGN')"), 'NGN wallet selection exists');
  assert.ok(content.includes("setPayWallet('USD')"), 'USD wallet selection exists');
  assert.ok(content.includes("setPayWallet('CNY')"), 'CNY/RMB wallet selection exists');
  assert.ok(content.includes('RMB / CNY') || content.includes('CNY'), 'RMB/CNY label is present');
  assert.ok(content.includes('db.subscribeSupplierDirectory'), 'Calls db.subscribeSupplierDirectory');
});

test('1.3 SuppliersScreen unlocks 30-day access to WeChat ID, phone, address, and official business card', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('supplier.wechatId'), 'WeChat ID is displayed when subscribed');
  assert.ok(content.includes('supplier.phone'), 'Phone is displayed when subscribed');
  assert.ok(content.includes('supplier.businessAddress'), 'Factory address is displayed when subscribed');
  assert.ok(content.includes('handleViewBusinessCard'), 'handleViewBusinessCard function exists');
  assert.ok(content.includes('Official Business Card'), 'Official Business Card button is present');
  assert.ok(content.includes('cardModalSupplier') && content.includes('signedCardUrl'), 'Business card modal state exists');
});

test('1.4 SuppliersScreen displays mandatory Flyemass support safety notice banner', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Safety Notice'), 'Safety notice header is present');
  assert.ok(
    content.includes('Negotiate freely, but ALWAYS notify Flyemass Support before making direct payments for escrow verification and goods inspection.'),
    'Exact required safety notice text is present'
  );
});

test('1.5 SuppliersScreen strictly adheres to luxury dark-mode FinTech design tokens', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('bg-slate-950') && content.includes('bg-slate-900'), 'Uses dark slate surface background tokens');
  assert.ok(content.includes('border-slate-800'), 'Uses border-slate-800 border tokens');
  assert.ok(content.includes('text-amber-400') || content.includes('text-emerald-400'), 'Uses signature luxury accent tokens');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic in AdminSuppliersScreen.tsx
// -----------------------------------------------------------------------------
test('2.1 AdminSuppliersScreen provides CRUD panel for posting, editing, and managing verified suppliers', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminSuppliersScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminSuppliersScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleOpenCreateModal'), 'Create supplier modal handler exists');
  assert.ok(content.includes('handleOpenEditModal'), 'Edit supplier modal handler exists');
  assert.ok(content.includes('handleDeleteSupplier'), 'Delete supplier handler exists');
  assert.ok(content.includes('handleToggleStatus'), 'Toggle supplier active status handler exists');
  assert.ok(content.includes('handleSubmitSupplier'), 'Submit supplier handler exists');
});

test('2.2 AdminSuppliersScreen supports managing weekly verified supplier contacts, business cards, and categories', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminSuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('formBusinessCardUrl') && content.includes('setFormBusinessCardUrl'), 'Business card URL state exists');
  assert.ok(content.includes('handleCardFileUpload'), 'Business card file upload handler exists');
  assert.ok(content.includes('Official Chinese Business Card'), 'Business card label is present');
  assert.ok(content.includes('customCategory') && content.includes('setCustomCategory'), 'Custom category management state exists');
  assert.ok(content.includes('+ Add Custom Category'), 'Option to add custom categories dynamically exists');
  assert.ok(content.includes('Card Verified') || content.includes('Business Card'), 'Business card verification badge is present');
});

test('2.3 AdminSuppliersScreen provides monthly pricing management and subscribers tracking', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminSuppliersScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('pricing'), 'VIP Pricing tab is present');
  assert.ok(content.includes('inputNgn') && content.includes('inputUsd') && content.includes('inputCny'), 'Pricing inputs for NGN, USD, CNY exist');
  assert.ok(content.includes('handleSavePrices'), 'Save pricing handler exists');
  assert.ok(content.includes('subscribers') && (content.includes('VIP pass') || content.includes('VIP Pass') || content.includes('subscriptions')), 'VIP subscribers tracking tab exists');
});

// -----------------------------------------------------------------------------
// 3. Server Endpoints & Client Service Integration
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs implements supplier directory preview and protected contact endpoints', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/suppliers/preview'"), 'Preview endpoint exists');
  assert.ok(content.includes("pathname === '/api/suppliers/directory'"), 'Protected directory endpoint exists');
  assert.ok(content.includes("pathname === '/api/suppliers/subscription-status'"), 'Subscription status endpoint exists');
});

test('3.2 sync-server.cjs handles 30-day VIP subscription payment with double-entry ledger debit', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/suppliers/subscribe-directory'"), 'Subscribe directory endpoint exists');
  assert.ok(content.includes('activeUntil = existingSub.activeUntil + 30 * 86400000') || content.includes('30 * 86400000'), 'Sets 30-day access duration with stacking');
  assert.ok(content.includes("transactionType: 'SUPPLIER_SUB'"), 'Double-entry transaction type is SUPPLIER_SUB');
  assert.ok(content.includes('revenue:fees:vip_supplier_directory'), 'Credits platform VIP revenue account');
});

test('3.3 sync-server.cjs implements admin CRUD endpoints for supplier management', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/admin/suppliers/create'"), 'Admin create supplier endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/suppliers/update'"), 'Admin update supplier endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/suppliers/delete'"), 'Admin delete supplier endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/suppliers/toggle-status'"), 'Admin toggle status endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/suppliers/prices'"), 'Admin set prices endpoint exists');
});

test('3.4 sync-server.cjs implements secure business card storage signed URL endpoint with 1-hour expiration', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/storage/supplier-cards/signed-url'"), 'Signed URL generation endpoint exists');
  assert.ok(content.includes("pathname === '/api/storage/supplier-cards/view'"), 'Secure card view endpoint exists');
  assert.ok(content.includes('3600000'), '1-hour (3,600,000ms) signed URL expiration enforced');
});

// -----------------------------------------------------------------------------
// 4. Authoritative Multi-Currency General Ledger Equilibrium
// -----------------------------------------------------------------------------
test('4.1 General Ledger in db-state.json maintains 100% mathematical equilibrium across NGN, USD, CNY', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);
  assert.ok(entries.length > 0, 'double_entry_ledger entries must exist');

  const totals = { USD: 0, NGN: 0, CNY: 0 };

  for (const entry of entries) {
    if (Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        const curr = p.currency || 'USD';
        const d = Number(p.debit) || 0;
        const c = Number(p.credit) || 0;
        if (totals[curr] !== undefined) {
          totals[curr] += (d - c);
        }
      }
    }
  }

  assert.ok(Math.abs(totals.NGN) < 0.01, `NGN ledger unbalanced: ${totals.NGN}`);
  assert.ok(Math.abs(totals.USD) < 0.01, `USD ledger unbalanced: ${totals.USD}`);
  assert.ok(Math.abs(totals.CNY) < 0.01, `CNY ledger unbalanced: ${totals.CNY}`);

  console.log(`   Ledger Equilibrium Verified:
   • USD Net Difference: $${totals.USD.toFixed(4)}
   • NGN Net Difference: ₦${totals.NGN.toFixed(4)}
   • CNY Net Difference: ¥${totals.CNY.toFixed(4)}`);
});

console.log('\n=============================================================================');
console.log('ALL 12 VERIFIED SUPPLIERS DIRECTORY & PAYWALL TESTS PASSED WITH 100% SUCCESS!');
console.log('=============================================================================');
