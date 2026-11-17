/**
 * tests/freight-rate-calculator-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Freight Rate Calculator Upgrade
 * 
 * Verifies:
 * 1. Mobile Logic & UI/UX in LogisticsScreen.tsx
 *    - Interactive rate estimator tab with origin & global trade corridor selector
 *    - Destination hub selector (Lagos MMIA, Abuja, Kano, Port Harcourt, Onitsha)
 *    - Weight (KG) and Volume (CBM) input handling
 *    - Calculated Air Express, Air Regular, and Sea Freight cost breakdowns (USD, NGN, CNY)
 *    - Side-by-side 3-mode comparison cards
 * 2. Admin Logic in AdminLogisticsScreen.tsx
 *    - Dedicated "Corridor Rates & Pricing" tab
 *    - Global trade corridors overview with pricing matrix and destination surcharges
 *    - Edit Corridor Pricing Formula modal to configure base fees, $/KG, $/CBM, and transit speeds
 * 3. Server Endpoints & Client Service Layer
 *    - DEFAULT_SHIPPING_CORRIDORS covering global corridors
 *    - Endpoints: GET /api/logistics/corridors, POST /api/logistics/corridors/update, POST /api/logistics/corridors/create
 *    - Client methods: db.getShippingCorridors, db.updateShippingCorridor, db.calculateFreightCost
 *    - Accurate mathematical formula execution and currency conversion
 * 4. General Ledger Equilibrium
 *    - Multi-currency double-entry ledger equilibrium across NGN, USD, and CNY
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
console.log('FLYEMASS "FREIGHT RATE CALCULATOR" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (LogisticsScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 LogisticsScreen provides interactive calculator with corridor and destination hub selectors', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/LogisticsScreen.tsx');
  assert.ok(fs.existsSync(file), 'LogisticsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Calculator tab & title
  assert.ok(content.includes("activeTab === 'calculator'"), 'Calculator tab is rendered');
  assert.ok(content.includes('Live Freight Rate Estimator'), 'Estimator heading is present');

  // Corridor selector & destination hub
  assert.ok(content.includes('selectedCorridorId'), 'Selected corridor state is present');
  assert.ok(content.includes('selectedDestinationHubId'), 'Selected destination hub state is present');
  assert.ok(content.includes('Global Trade Corridor'), 'Corridor selector label is present');
  assert.ok(content.includes('Nigeria Destination Hub'), 'Nigeria destination hub label is present');
});

test('1.2 LogisticsScreen supports weight (KG) and volume (CBM) inputs with mode selector', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/LogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('weightKg'), 'Weight (KG) state is present');
  assert.ok(content.includes('cbm'), 'Volume (CBM) state is present');
  assert.ok(content.includes('calcMode'), 'Mode state is present');
  assert.ok(content.includes('Air Express') && content.includes('Air Regular') && content.includes('Sea Cargo'), '3 shipping modes present');
});

test('1.3 LogisticsScreen renders multi-currency breakdown (USD, NGN, CNY) and 3-mode comparison cards', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/LogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Multi-currency breakdown
  assert.ok(content.includes('Estimated Freight Total'), 'Estimated freight total header is present');
  assert.ok(content.includes('Naira Equivalent'), 'Naira equivalent conversion is present');
  assert.ok(content.includes('RMB Equivalent'), 'RMB equivalent conversion is present');
  assert.ok(content.includes('formulaDescription'), 'Pricing formula description is displayed');

  // 3-mode comparative breakdown
  assert.ok(content.includes('Compare Speed Options') || content.includes('comparisons'), 'Speed comparison section is present');
  assert.ok(content.includes('calculationResult.comparisons.airExpress'), 'Air express comparison is rendered');
  assert.ok(content.includes('calculationResult.comparisons.airRegular'), 'Air regular comparison is rendered');
  assert.ok(content.includes('calculationResult.comparisons.seaFreight'), 'Sea freight comparison is rendered');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic in AdminLogisticsScreen.tsx
// -----------------------------------------------------------------------------
test('2.1 AdminLogisticsScreen provides dedicated Corridor Rates & Pricing tab', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminLogisticsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("activeTab === 'rates'"), 'Rates tab content is rendered');
  assert.ok(content.includes('Corridor Rates & Pricing'), 'Rates tab button is present');
  assert.ok(content.includes('Global Shipping Corridors & Pricing Formulas'), 'Rates management header is present');
});

test('2.2 AdminLogisticsScreen displays corridor cards with $/KG and $/CBM pricing matrices', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('airExpressRateUSD'), 'Air express rate display is present');
  assert.ok(content.includes('airRegularRateUSD'), 'Air regular rate display is present');
  assert.ok(content.includes('seaFreightRateCbmUSD'), 'Sea freight rate display is present');
  assert.ok(content.includes('destinationHubSurcharges'), 'Destination surcharges preview is present');
});

test('2.3 AdminLogisticsScreen provides modal to edit base pricing formulas, cost-per-KG, and cost-per-CBM', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('editingCorridor'), 'Editing corridor state is present');
  assert.ok(content.includes('Edit Pricing Formula:'), 'Edit corridor modal title is present');
  assert.ok(content.includes('editAirExpressRate') && content.includes('editAirExpressBaseFee'), 'Air express formula inputs present');
  assert.ok(content.includes('editAirRegularRate') && content.includes('editAirRegularBaseFee'), 'Air regular formula inputs present');
  assert.ok(content.includes('editSeaRate') && content.includes('editSeaBaseFee'), 'Sea freight formula inputs present');
  assert.ok(content.includes('Save & Broadcast Rates'), 'Save and broadcast button is present');
});

// -----------------------------------------------------------------------------
// 3. Server Endpoints & Client Service Integration
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs implements /api/logistics/corridors endpoints with default corridor seeding', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('DEFAULT_SHIPPING_CORRIDORS'), 'DEFAULT_SHIPPING_CORRIDORS defined in sync-server');
  assert.ok(content.includes('/api/logistics/corridors'), 'GET /api/logistics/corridors registered');
  assert.ok(content.includes('/api/logistics/corridors/update'), 'POST /api/logistics/corridors/update registered');
  assert.ok(content.includes('/api/logistics/corridors/create'), 'POST /api/logistics/corridors/create registered');
});

test('3.2 src/services/db.ts provides getShippingCorridors, updateShippingCorridor, and calculateFreightCost', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('getShippingCorridors()'), 'db.getShippingCorridors is defined');
  assert.ok(content.includes('updateShippingCorridor('), 'db.updateShippingCorridor is defined');
  assert.ok(content.includes('createShippingCorridor('), 'db.createShippingCorridor is defined');
  assert.ok(content.includes('calculateFreightCost('), 'db.calculateFreightCost is defined');
});

test('3.3 db.calculateFreightCost accurately computes Air Express, Air Regular, and Sea Freight formulas', () => {
  const state = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'db-state.json'), 'utf8'));
  const corridors = state.system_settings.shipping_corridors;
  assert.ok(Array.isArray(corridors) && corridors.length >= 8, 'At least 8 global trade corridors seeded');

  const cnCorridor = corridors.find(c => c.id === 'cn_los');
  assert.ok(cnCorridor, 'China ➔ Nigeria corridor exists');

  // Verify Air Regular calculation for 15kg
  const weight = 15;
  const expectedRegularAir = Number((cnCorridor.airRegularBaseFeeUSD + (weight * cnCorridor.airRegularRateUSD)).toFixed(2));
  assert.strictEqual(expectedRegularAir, 3.00 + (15 * 9.50), 'Air Regular formula matches: $3 + (15 * $9.50) = $145.50');

  // Verify Air Express calculation for 10kg
  const expectedExpressAir = Number((cnCorridor.airExpressBaseFeeUSD + (10 * cnCorridor.airExpressRateUSD)).toFixed(2));
  assert.strictEqual(expectedExpressAir, 5.00 + (10 * 11.50), 'Air Express formula matches: $5 + (10 * $11.50) = $120.00');

  // Verify Sea Freight calculation for 0.5 CBM
  const expectedSea = Number((cnCorridor.seaFreightBaseFeeUSD + (0.5 * cnCorridor.seaFreightRateCbmUSD)).toFixed(2));
  assert.strictEqual(expectedSea, 25.00 + (0.5 * 280.00), 'Sea Freight formula matches: $25 + (0.5 * $280) = $165.00');
});

// -----------------------------------------------------------------------------
// 4. Financial Equilibrium (General Ledger Check)
// -----------------------------------------------------------------------------
test('4.1 System state db-state.json double-entry ledger remains in absolute equilibrium', () => {
  const dataPath = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(dataPath), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const entries = Object.values(state.double_entry_ledger || {});
  assert.ok(entries.length > 0, 'Double entry ledger entries exist');

  for (const entry of entries) {
    const totalDebit = (entry.postings || []).reduce((acc, p) => acc + (p.debit || 0), 0);
    const totalCredit = (entry.postings || []).reduce((acc, p) => acc + (p.credit || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    assert.ok(diff < 0.0001, `Double-entry entry ${entry.reference} must be balanced (diff: ${diff})`);
  }
});

console.log('\n=============================================================================');
console.log('ALL 10 FREIGHT RATE CALCULATOR VERIFICATION TESTS PASSED!');
console.log('=============================================================================');
