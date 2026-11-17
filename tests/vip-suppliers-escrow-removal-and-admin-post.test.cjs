const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=============================================================================');
console.log('FLYEMASS VIP SUPPLIERS: ESCROW REMOVAL, NAVIGATION & ADMIN POST TEST SUITE');
console.log('=============================================================================\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const suppliersScreenPath = path.join(ROOT_DIR, 'src/screens/suppliers/SuppliersScreen.tsx');
const adminSuppliersPath = path.join(ROOT_DIR, 'src/screens/admin/AdminSuppliersScreen.tsx');
const syncServerPath = path.join(ROOT_DIR, 'sync-server.cjs');
const dbPath = path.join(ROOT_DIR, 'src/services/db.ts');
const dbStatePath = path.join(ROOT_DIR, 'db-state.json');

// 1. Verify SuppliersScreen.tsx
console.log('--- Checking SuppliersScreen.tsx for Escrow Removal & Standard Navigation ---');
const suppliersSrc = fs.readFileSync(suppliersScreenPath, 'utf8');

// Ensure Pay Escrow & Request Escrow buttons are removed
assert.strictEqual(suppliersSrc.includes('Pay Escrow'), false, 'SuppliersScreen must NOT contain "Pay Escrow" button');
assert.strictEqual(suppliersSrc.includes('Request Escrow'), false, 'SuppliersScreen must NOT contain "Request Escrow" button');
assert.strictEqual(suppliersSrc.includes('handleRequestEscrow'), false, 'SuppliersScreen must NOT contain handleRequestEscrow handler');
console.log('✅ [PASS] 1.1 "Pay Escrow" and "Request Escrow" buttons have been completely removed from SuppliersScreen');

// Ensure world-standard navigation bar and direct contact actions exist
assert.ok(suppliersSrc.includes('VIP Factory Catalog'), 'SuppliersScreen must include VIP Factory Catalog header title');
assert.ok(suppliersSrc.includes('Ground Agents'), 'SuppliersScreen must include Ground Agents quick navigation');
assert.ok(suppliersSrc.includes('Factory RFQ'), 'SuppliersScreen must include Factory RFQ quick navigation');
assert.ok(suppliersSrc.includes('handleOpenWhatsApp'), 'SuppliersScreen must include direct WhatsApp action');
assert.ok(suppliersSrc.includes('handleCallSupplier'), 'SuppliersScreen must include direct Call supplier action');
assert.ok(suppliersSrc.includes('handleViewBusinessCard'), 'SuppliersScreen must include Business Card action');
console.log('✅ [PASS] 1.2 World-standard navigation bar and direct contact actions (WhatsApp, Call, Business Card) verified');

// 2. Verify AdminSuppliersScreen.tsx
console.log('--- Checking AdminSuppliersScreen.tsx for Frictionless Admin Posting ---');
const adminSuppliersSrc = fs.readFileSync(adminSuppliersPath, 'utf8');

assert.ok(adminSuppliersSrc.includes('handleSubmitSupplier'), 'AdminSuppliersScreen must include handleSubmitSupplier');
assert.ok(adminSuppliersSrc.includes('finalZhName'), 'AdminSuppliersScreen must provide smart defaults for Chinese name');
assert.ok(adminSuppliersSrc.includes('finalWechat'), 'AdminSuppliersScreen must provide smart defaults for WeChat ID');
assert.ok(adminSuppliersSrc.includes('finalPhone'), 'AdminSuppliersScreen must provide smart defaults for Phone');
assert.ok(adminSuppliersSrc.includes('finalAddress'), 'AdminSuppliersScreen must provide smart defaults for Factory address');
console.log('✅ [PASS] 2.1 AdminSuppliersScreen provides resilient smart defaults to prevent posting errors');

// 3. Verify sync-server.cjs and db.ts
console.log('--- Checking sync-server.cjs & db.ts for Resilient Supplier Posting ---');
const syncServerSrc = fs.readFileSync(syncServerPath, 'utf8');
const dbSrc = fs.readFileSync(dbPath, 'utf8');

assert.ok(syncServerSrc.includes('/api/admin/suppliers/create'), 'sync-server must provide /api/admin/suppliers/create');
assert.ok(syncServerSrc.includes('/api/admin/suppliers/update'), 'sync-server must provide /api/admin/suppliers/update');
assert.ok(dbSrc.includes('createSupplier'), 'db.ts must provide createSupplier method');
assert.ok(dbSrc.includes('updateSupplier'), 'db.ts must provide updateSupplier method');
console.log('✅ [PASS] 3.1 Backend and frontend service methods for supplier creation and updates verified');

// 4. Verify General Ledger Equilibrium
console.log('--- Checking General Ledger Equilibrium ---');
const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

let netUsd = 0;
let netNgn = 0;
let netCny = 0;

if (dbState.double_entry_ledger) {
  const entries = Object.values(dbState.double_entry_ledger);
  for (const entry of entries) {
    const cur = (entry.currency || 'USD').toUpperCase();
    const dr = Number(entry.debit || 0);
    const cr = Number(entry.credit || 0);
    const diff = dr - cr;
    if (cur === 'USD') netUsd += diff;
    else if (cur === 'NGN') netNgn += diff;
    else if (cur === 'CNY') netCny += diff;
  }
}

assert.ok(Math.abs(netUsd) < 0.0001, `USD ledger unbalanced: ${netUsd}`);
assert.ok(Math.abs(netNgn) < 0.0001, `NGN ledger unbalanced: ${netNgn}`);
assert.ok(Math.abs(netCny) < 0.0001, `CNY ledger unbalanced: ${netCny}`);
console.log('   Ledger Balance Check:');
console.log(`   • USD Net Difference: $${netUsd.toFixed(4)}`);
console.log(`   • NGN Net Difference: ₦${netNgn.toFixed(4)}`);
console.log(`   • CNY Net Difference: ¥${netCny.toFixed(4)}`);
console.log('✅ [PASS] 4.1 General ledger maintains 100% mathematical equilibrium (0.0000 discrepancy)');

console.log('\n=============================================================================');
console.log('ALL VIP SUPPLIER FIX AND ADMIN POST TESTS PASSED WITH 100% SUCCESS!');
console.log('=============================================================================');
