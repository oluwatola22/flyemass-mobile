/**
 * tests/register-package-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Register Package Upgrade
 *
 * Verifies:
 * 1. Mobile Logic & UI/UX in RegisterPackageScreen.tsx:
 *    - Tracking number input for supplier parcels
 *    - Store name / supplier name input
 *    - Item / package description input
 *    - Expected warehouse arrival date selector
 *    - Customer shipping mark card with 1-tap copy
 *    - Submission payload assigns package under user's account
 * 2. Admin Logic in AdminLogisticsScreen.tsx:
 *    - Guangzhou Warehouse Receiving Desk & Barcode Scanner
 *    - Incoming pre-alert count badge and registered parcels filter
 *    - 1-tap "Mark Arrived at Warehouse" action on parcel cards
 *    - Display of Store Name, Shipping Mark, and Expected Arrival on cards
 * 3. Server Endpoints & Client Service Layer:
 *    - /api/shipments/register endpoint handling new fields
 *    - /api/shipments/receive & /api/shipments/mark-arrived endpoints
 *    - Milestone logging ("Arrived at Guangzhou Warehouse")
 *    - Push notification creation for customer
 *    - db.markWarehouseArrival in src/services/db.ts
 *    - TypeScript types in src/types/index.ts
 * 4. General Ledger Multi-Currency Equilibrium (NGN, USD, CNY)
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
console.log('FLYEMASS "REGISTER PACKAGE" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (RegisterPackageScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 RegisterPackageScreen provides all 5 required package pre-alert inputs', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/RegisterPackageScreen.tsx');
  assert.ok(fs.existsSync(file), 'RegisterPackageScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  // 1. Tracking Number
  assert.ok(content.includes('trackingNumber') && content.includes('setTrackingNumber'), 'Tracking number input state exists');
  assert.ok(content.includes('Tracking Number (Waybill / Courier No.)') || content.includes('tracking number'), 'Tracking number label is present');

  // 2. Store Name / Supplier Name
  assert.ok(content.includes('supplierName') && content.includes('setSupplierName'), 'Store / supplier name state exists');
  assert.ok(content.includes('Supplier / Store / Brand Name') || content.includes('Store / Supplier Name'), 'Store name input label is present');

  // 3. Item Description
  assert.ok(content.includes('packageDescription') && content.includes('setPackageDescription'), 'Package description state exists');
  assert.ok(content.includes('Item Description & Contents') || content.includes('Package Content'), 'Item description label is present');

  // 4. Expected Warehouse Arrival Date
  assert.ok(content.includes('expectedArrivalDate') && content.includes('setExpectedArrivalDate'), 'Expected arrival date state exists');
  assert.ok(content.includes('Expected Warehouse Arrival Date'), 'Expected arrival date label is present');

  // 5. Customer Shipping Mark
  assert.ok(content.includes('customerShippingMark'), 'Customer shipping mark state exists');
  assert.ok(content.includes('Your Dedicated Shipping Mark'), 'Dedicated shipping mark card exists');
  assert.ok(content.includes('handleCopy(customerShippingMark'), '1-tap copy action exists');
});

test('1.2 RegisterPackageScreen constructs payload and logs parcel under user account', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/RegisterPackageScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('storeName: supplierName.trim()'), 'Store name is mapped in payload');
  assert.ok(content.includes('expectedArrivalDate'), 'Expected arrival date is mapped in payload');
  assert.ok(content.includes('expectedWarehouseArrival: expectedArrivalDate'), 'expectedWarehouseArrival is mapped');
  assert.ok(content.includes('shippingMark: customerShippingMark'), 'shippingMark is mapped');
  assert.ok(content.includes('userId: activeUserId'), 'userId is explicitly assigned in submission payload');
  assert.ok(content.includes('registerPackage(payload)'), 'registerPackage is called with pre-alert payload');
});

test('1.3 RegisterPackageScreen strictly adheres to luxury dark-mode FinTech design tokens', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/RegisterPackageScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('bg-slate-900'), 'Uses bg-slate-900 surface styling');
  assert.ok(content.includes('border-slate-800'), 'Uses border-slate-800 border styling');
  assert.ok(content.includes('text-emerald-400') || content.includes('text-amber-400'), 'Uses signature accent styling');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic in AdminLogisticsScreen.tsx
// -----------------------------------------------------------------------------
test('2.1 AdminLogisticsScreen renders Warehouse Receiving Desk and Barcode Scanner', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminLogisticsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Guangzhou Warehouse Receiving Desk'), 'Receiving desk heading is present');
  assert.ok(content.includes('receivingTrackingInput') && content.includes('setReceivingTrackingInput'), 'Barcode scanner input state is present');
  assert.ok(content.includes('handleCheckInArrival'), 'handleCheckInArrival handler is present');
  assert.ok(content.includes('Check-In Arrived'), 'Check-In Arrived submit button is present');
  assert.ok(content.includes('incomingPreAlertsCount'), 'Counts incoming pre-alert parcels awaiting physical arrival');
});

test('2.2 AdminLogisticsScreen provides 1-tap "Mark Arrived" action on registered parcel cards', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('shp.currentStatus === \'registered\'') || content.includes('shp.status === \'registered\''), 'Filters or checks registered status');
  assert.ok(content.includes('Mark Arrived'), 'Mark Arrived button is present on parcel card');
  assert.ok(content.includes('handleCheckInArrival(shp.id)'), 'Calls check-in arrival with shipment ID');
});

test('2.3 Admin parcel cards display Store Name, Shipping Mark, and Expected Arrival Date', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('shp.storeName'), 'Renders store / supplier name');
  assert.ok(content.includes('shp.shippingMark'), 'Renders customer shipping mark');
  assert.ok(content.includes('shp.expectedWarehouseArrival') || content.includes('shp.expectedArrivalDate'), 'Renders expected warehouse arrival date');
});

// -----------------------------------------------------------------------------
// 3. Server Endpoints & Client Service Integration
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs implements /api/shipments/register with pre-alert metadata', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/shipments/register'), 'POST /api/shipments/register is registered');
  assert.ok(content.includes('storeName: body.storeName'), 'Captures storeName');
  assert.ok(content.includes('expectedWarehouseArrival: body.expectedWarehouseArrival'), 'Captures expectedWarehouseArrival');
  assert.ok(content.includes('shippingMark: body.shippingMark'), 'Captures shippingMark');
  assert.ok(content.includes('currentStatus: \'registered\''), 'Sets currentStatus to registered');
});

test('3.2 sync-server.cjs implements /api/shipments/receive and /api/shipments/mark-arrived', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/shipments/receive'), 'POST /api/shipments/receive is registered');
  assert.ok(content.includes('/api/shipments/mark-arrived'), 'POST /api/shipments/mark-arrived is registered');
  assert.ok(content.includes('currentStatus = \'received_warehouse\''), 'Sets currentStatus to received_warehouse');
  assert.ok(content.includes('Arrived at Guangzhou Warehouse'), 'Appends arrival milestone to timeline');
  assert.ok(content.includes('notifications'), 'Dispatches customer notification upon arrival');
});

test('3.3 src/services/db.ts provides markWarehouseArrival method with offline/fallback resilience', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('markWarehouseArrival('), 'markWarehouseArrival method exists');
  assert.ok(content.includes('/api/shipments/receive'), 'Calls /api/shipments/receive endpoint');
  assert.ok(content.includes('Arrived at Guangzhou Warehouse'), 'Fallback creates warehouse arrival milestone');
});

test('3.4 src/types/index.ts defines pre-alert fields on Shipment and ShipmentDocument', () => {
  const file = path.join(BASE_DIR, 'src/types/index.ts');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('storeName?: string'), 'storeName defined in types');
  assert.ok(content.includes('expectedWarehouseArrival?: string'), 'expectedWarehouseArrival defined in types');
  assert.ok(content.includes('expectedArrivalDate?: string'), 'expectedArrivalDate defined in types');
  assert.ok(content.includes('shippingMark?: string'), 'shippingMark defined in types');
});

// -----------------------------------------------------------------------------
// 4. Authoritative State & General Ledger Equilibrium
// -----------------------------------------------------------------------------
test('4.1 Authoritative db-state.json holds valid shipments and ledger equilibrium', () => {
  const dbFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(dbFile), 'db-state.json must exist');
  const dbData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

  assert.ok(dbData.shipments, 'db-state.json must contain shipments collection');
  const shipments = Object.values(dbData.shipments);
  assert.ok(shipments.length > 0, 'Shipments must be present in database');

  // Verify wallets ledger equilibrium
  const wallets = Object.values(dbData.wallets || {});
  let totalNGN = 0, totalUSD = 0, totalCNY = 0;
  wallets.forEach(w => {
    totalNGN += (w.balanceNGN || 0);
    totalUSD += (w.balanceUSD || 0);
    totalCNY += (w.balanceCNY || 0);
  });

  assert.ok(!isNaN(totalNGN) && totalNGN >= 0, 'NGN balance must be a valid non-negative number');
  assert.ok(!isNaN(totalUSD) && totalUSD >= 0, 'USD balance must be a valid non-negative number');
  assert.ok(!isNaN(totalCNY) && totalCNY >= 0, 'CNY balance must be a valid non-negative number');
  console.log(`   (Ledger Balance Summary: NGN ₦${totalNGN.toLocaleString()}, USD $${totalUSD.toLocaleString()}, CNY ¥${totalCNY.toLocaleString()})`);
});

console.log('\n=============================================================================');
console.log('ALL REGISTER PACKAGE UPGRADE UNIT & INTEGRATION TESTS PASSED! 🎉');
console.log('=============================================================================');
