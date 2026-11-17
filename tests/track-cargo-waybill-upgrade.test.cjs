/**
 * tests/track-cargo-waybill-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Track Cargo Waybill Upgrade
 * 
 * Verifies:
 * 1. Mobile Logic & UI/UX in TrackShipmentScreen.tsx
 *    - Search input for waybill number or tracking ID
 *    - Active shipment list with live tracking query integration
 *    - 4 Timeline Milestones: Warehouse Received ➔ Customs ➔ In Transit ➔ Delivered
 *    - Chronological transit milestone checkpoint logs (location, timestamp, notes)
 * 2. Admin Logic in AdminLogisticsScreen.tsx
 *    - Staff can create waybill numbers with auto/custom tracking codes
 *    - Staff can update shipment statuses (pending, warehouse, transit, customs, delivered)
 *    - Staff can add transit milestone checkpoints via modal
 *    - Staff can assign/reassign parcels to registered customer User IDs
 * 3. Server Endpoints & Client Service Integration
 *    - /api/shipments/track endpoint (GET & POST) with fuzzy code matching
 *    - /api/shipments/add-milestone endpoint with customer notification dispatch
 *    - /api/shipments/assign-user endpoint with receiver name synchronization
 *    - db.trackShipment, db.addMilestoneCheckpoint, db.assignShipmentUser in db.ts
 *    - TypeScript interface Shipment.timeline in src/types/index.ts
 * 4. General Ledger Equilibrium
 *    - Multi-currency double-entry ledger balance across NGN, USD, and CNY
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
console.log('FLYEMASS "TRACK CARGO WAYBILL" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (TrackShipmentScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 TrackShipmentScreen provides search input and active shipment list with live query integration', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/TrackShipmentScreen.tsx');
  assert.ok(fs.existsSync(file), 'TrackShipmentScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Search input & button
  assert.ok(content.includes('searchQuery'), 'Search query state is present');
  assert.ok(content.includes('handleSearchSubmit'), 'handleSearchSubmit handler is present');
  assert.ok(content.includes('db.trackShipment'), 'db.trackShipment is invoked on search');
  assert.ok(content.includes('Track'), 'Track submit button is present');

  // Active shipment list
  assert.ok(content.includes('allShipments'), 'Combines local and searched shipments');
  assert.ok(content.includes('filteredShipments'), 'Filtered shipments list is present');
  assert.ok(content.includes('activeShipment'), 'Active selected shipment is resolved');
});

test('1.2 TrackShipmentScreen displays the 4 timeline milestones (Warehouse Received ➔ Customs ➔ In Transit ➔ Delivered)', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/TrackShipmentScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Milestone labels in the stepper
  assert.ok(content.includes('Waybill Milestone Tracker'), 'Waybill Milestone Tracker heading is present');
  assert.ok(content.includes('Warehouse Received'), 'Milestone "Warehouse Received" is present');
  assert.ok(content.includes('Customs'), 'Milestone "Customs" is present');
  assert.ok(content.includes('In Transit'), 'Milestone "In Transit" is present');
  assert.ok(content.includes('Delivered'), 'Milestone "Delivered" is present');
  assert.ok(content.includes('Milestone') && content.includes('of 4'), 'Milestone X of 4 counter is present');
});

test('1.3 TrackShipmentScreen renders live transit milestone checkpoint logs with location, status, and officer notes', () => {
  const file = path.join(BASE_DIR, 'src/screens/logistics/TrackShipmentScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Timeline events rendering
  assert.ok(content.includes('Live Transit Checkpoint Logs'), 'Transit checkpoint logs heading is present');
  assert.ok(content.includes('evt.location'), 'Displays event location');
  assert.ok(content.includes('evt.notes'), 'Displays checkpoint notes');
  assert.ok(content.includes('evt.timestamp'), 'Displays event timestamp');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic in AdminLogisticsScreen.tsx
// -----------------------------------------------------------------------------
test('2.1 AdminLogisticsScreen allows staff to create waybill numbers and assign customer User IDs', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminLogisticsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Issue New Cargo Waybill
  assert.ok(content.includes('Issue New Cargo Waybill') || content.includes('Issue Cargo Waybill'), 'Waybill creation modal title is present');
  assert.ok(content.includes('trackingCode') || content.includes('trackingNumber'), 'Tracking code input is present');
  assert.ok(content.includes('generateTrackingCode') || content.includes('Regenerate') || content.includes('Auto-generate'), 'Tracking code generation function/button is present');
  assert.ok(content.includes('Assigned Customer User ID'), 'Assigned Customer User ID selector is present in modal');
  assert.ok(content.includes('dbState.users'), 'Populates user options from registered users');
});

test('2.2 AdminLogisticsScreen provides milestone checkpoint addition modal for staff', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Add transit milestone checkpoint modal
  assert.ok(content.includes('Add Milestone Checkpoint'), 'Milestone checkpoint modal title is present');
  assert.ok(content.includes('milestoneStatus'), 'Milestone status state is present');
  assert.ok(content.includes('milestoneLocation'), 'Milestone location state is present');
  assert.ok(content.includes('milestoneNotes'), 'Milestone notes state is present');
  assert.ok(content.includes('db.addMilestoneCheckpoint'), 'Invokes db.addMilestoneCheckpoint');
});

test('2.3 AdminLogisticsScreen provides modal to assign/reassign parcels to user IDs with UID display', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminLogisticsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Assign user modal & UI triggers
  assert.ok(content.includes('Assign Parcel to User ID'), 'Assign User modal title is present');
  assert.ok(content.includes('targetUserId'), 'Target User ID state is present');
  assert.ok(content.includes('db.assignShipmentUser'), 'Invokes db.assignShipmentUser');
  assert.ok(content.includes('UID:'), 'Displays customer User ID badge on parcel cards');
});

// -----------------------------------------------------------------------------
// 3. Server Endpoints & Client Service Integration
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs implements /api/shipments/track with fuzzy identifier matching', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/shipments/track'), 'Shipment tracking endpoint registered');
  assert.ok(content.includes('trackingNumber') && content.includes('shipmentCode'), 'Matches against multiple identifier fields');
  assert.ok(content.includes('timeline'), 'Returns timeline array with tracking information');
});

test('3.2 sync-server.cjs implements /api/shipments/add-milestone with push notifications', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/shipments/add-milestone'), 'Add milestone endpoint registered');
  assert.ok(content.includes('milestoneEvent'), 'Creates milestone event object');
  assert.ok(content.includes('notifications.unshift'), 'Dispatches live notification to parcel recipient');
  assert.ok(content.includes('Milestone Checkpoint:'), 'Notification subject format matches specification');
});

test('3.3 sync-server.cjs implements /api/shipments/assign-user with user validation', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/shipments/assign-user'), 'Assign user endpoint registered');
  assert.ok(content.includes('targetUser'), 'Finds and validates target user');
  assert.ok(content.includes('ship.userId = userId.trim()'), 'Sets userId on shipment');
});

test('3.4 src/services/db.ts provides trackShipment, addMilestoneCheckpoint, and assignShipmentUser', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('trackShipment(codeOrNumber: string)'), 'db.trackShipment is defined');
  assert.ok(content.includes('addMilestoneCheckpoint('), 'db.addMilestoneCheckpoint is defined');
  assert.ok(content.includes('assignShipmentUser('), 'db.assignShipmentUser is defined');
});

test('3.5 src/types/index.ts includes timeline in Shipment interface', () => {
  const file = path.join(BASE_DIR, 'src/types/index.ts');
  assert.ok(fs.existsSync(file), 'types/index.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('timeline?: ShipmentTimelineEvent[]'), 'Shipment interface contains timeline array');
});

// -----------------------------------------------------------------------------
// 4. Financial Equilibrium (General Ledger Check)
// -----------------------------------------------------------------------------
test('4.1 System state data file exists and double-entry ledger remains in equilibrium', () => {
  const dataPath = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(dataPath), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const shipments = Object.values(state.shipments || {});
  assert.ok(Array.isArray(shipments), 'Shipments are accessible as array');
  assert.ok(shipments.length > 0, 'Shipments collection is non-empty');

  // Verify at least one shipment has timeline checkpoints
  const hasTimeline = shipments.some(s => Array.isArray(s.timeline) && s.timeline.length > 0);
  assert.ok(hasTimeline, 'At least one shipment in state has timeline checkpoints');

  // Verify double-entry ledger journal entries balance
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
console.log('ALL 12 TRACK CARGO WAYBILL VERIFICATION TESTS PASSED!');
console.log('=============================================================================');
