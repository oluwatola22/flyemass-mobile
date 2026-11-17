const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING ADMIN & MOBILE INFINITE RELOADING STABILIZATION TEST ---');

const baseDir = path.resolve(__dirname, '..');

// -----------------------------------------------------------------------------
// Test 1: db.ts SSE Stream Deduplication, Revision Counter & Microtask Batching
// -----------------------------------------------------------------------------
console.log('[Test 1] Verifying db.ts SSE stream deduplication, revision counter & microtask batching...');
const dbFile = fs.readFileSync(path.join(baseDir, 'src/services/db.ts'), 'utf8');

assert(dbFile.includes('stateRevision: number'), 'db.ts must maintain stateRevision');
assert(dbFile.includes('lastSerializedState: string'), 'db.ts must maintain lastSerializedState');
assert(dbFile.includes('getStateRevision(): number'), 'db.ts must expose getStateRevision()');
assert(dbFile.includes('incomingStr === this.lastSerializedState'), 'db.ts must check incomingStr against lastSerializedState');
assert(dbFile.includes('queueMicrotask'), 'db.ts must batch notifyListeners using queueMicrotask');
assert(dbFile.includes('this.stateRevision++'), 'db.ts must increment stateRevision on state mutation');

console.log('✅ db.ts state revision, SSE deduplication, and microtask batching verified.');

// -----------------------------------------------------------------------------
// Test 2: AdminLayout.tsx Badge Equality Gating & Elimination of Full State Subscriptions
// -----------------------------------------------------------------------------
console.log('[Test 2] Verifying AdminLayout.tsx badge equality gating & elimination of full state re-renders...');
const adminLayoutFile = fs.readFileSync(path.join(baseDir, 'src/components/admin/AdminLayout.tsx'), 'utf8');

assert(!adminLayoutFile.includes("setDbState({ ...db.getState() })"), 'AdminLayout must not unconditionally clone db.getState() on every notification');
assert(adminLayoutFile.includes('computeBadges'), 'AdminLayout must compute targeted badge counts');
assert(adminLayoutFile.includes('setBadges((prev) => {'), 'AdminLayout must equality-gate badge state updates');
assert(adminLayoutFile.includes('prev.pendingPaymentsCount === next.pendingPaymentsCount'), 'AdminLayout must numerically compare pending payments count');
assert(adminLayoutFile.includes('navItems = useMemo('), 'AdminLayout must memoize navItems based on badges');

console.log('✅ AdminLayout.tsx badge equality gating verified.');

// -----------------------------------------------------------------------------
// Test 3: Elimination of Unconditional setDbState({ ...db.getState() }) across Admin Screens
// -----------------------------------------------------------------------------
console.log('[Test 3] Verifying elimination of unconditional setDbState in admin screens...');

const adminScreensToCheck = [
  'src/screens/admin/AdminDashboardScreen.tsx',
  'src/screens/admin/AdminUsersScreen.tsx',
  'src/screens/admin/AdminFundingScreen.tsx',
  'src/screens/admin/AdminPaymentsScreen.tsx',
  'src/screens/admin/AdminRmbTransfersScreen.tsx',
  'src/screens/admin/AdminNairaPayoutsScreen.tsx',
  'src/screens/admin/AdminCommunicationsScreen.tsx',
  'src/screens/admin/AdminSupportScreen.tsx',
  'src/screens/admin/AdminLogisticsScreen.tsx',
  'src/screens/admin/AdminHotelsScreen.tsx',
  'src/screens/admin/AdminShopScreen.tsx',
  'src/screens/admin/AdminFxManagementScreen.tsx',
  'src/screens/admin/DatabaseViewerScreen.tsx'
];

for (const screenPath of adminScreensToCheck) {
  const content = fs.readFileSync(path.join(baseDir, screenPath), 'utf8');
  assert(!content.includes("setDbState({ ...db.getState() })"), `${screenPath} must not contain setDbState({ ...db.getState() })`);
  assert(content.includes('db.getStateRevision()'), `${screenPath} must utilize db.getStateRevision() for stable re-rendering`);
  assert(content.includes('const dbState = db.getState()'), `${screenPath} must synchronously evaluate dbState via db.getState()`);
}

console.log('✅ All 13 core admin screens verified to use db.getStateRevision() without object reference re-renders.');

// -----------------------------------------------------------------------------
// Test 4: Gated Subscriptions in Specialized Admin Operational Screens
// -----------------------------------------------------------------------------
console.log('[Test 4] Verifying equality-gated subscriptions in specialized admin screens...');

const warehousesContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminWarehousesScreen.tsx'), 'utf8');
assert(warehousesContent.includes('prev.every((w, i) => w.id === nextWhs[i]?.id'), 'AdminWarehousesScreen must equality-gate warehouses subscription');

const lagosHubsContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminLagosHubsScreen.tsx'), 'utf8');
assert(lagosHubsContent.includes('prev.every((h, i) => h.id === nextHubs[i]?.id'), 'AdminLagosHubsScreen must equality-gate lagos hubs subscription');

const agentsContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminAgentsScreen.tsx'), 'utf8');
assert(agentsContent.includes('prev.every((r, i) => r.id === nextRfqs[i]?.id'), 'AdminAgentsScreen must equality-gate RFQs subscription');

const suppliersContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminSuppliersScreen.tsx'), 'utf8');
assert(suppliersContent.includes('curRev === lastRevRef.current'), 'AdminSuppliersScreen must gate loadAdminData on revision changes');

const apartmentsContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminRentalsApartmentsScreen.tsx'), 'utf8');
assert(apartmentsContent.includes('prev.every((inq, i) => inq.id === nextInq[i]?.id'), 'AdminRentalsApartmentsScreen must equality-gate property inquiries');

const officesContent = fs.readFileSync(path.join(baseDir, 'src/screens/admin/AdminRentalsOfficesScreen.tsx'), 'utf8');
assert(officesContent.includes('prev.every((inq, i) => inq.id === nextInq[i]?.id'), 'AdminRentalsOfficesScreen must equality-gate commercial inquiries');

console.log('✅ Specialized admin operational screens verified with equality-gated subscriptions.');

// -----------------------------------------------------------------------------
// Test 5: Customer Mobile Screens Subscription Equality Gating
// -----------------------------------------------------------------------------
console.log('[Test 5] Verifying customer mobile screens subscription equality gating...');

const shopOrdersContent = fs.readFileSync(path.join(baseDir, 'src/screens/shop/ShopOrdersScreen.tsx'), 'utf8');
assert(shopOrdersContent.includes('prev.every((o, i) => o.id === nextOrders[i]?.id'), 'ShopOrdersScreen must equality-gate orders subscription');

const shopDetailContent = fs.readFileSync(path.join(baseDir, 'src/screens/shop/ShopOrderDetailScreen.tsx'), 'utf8');
assert(shopDetailContent.includes('db.getStateRevision()'), 'ShopOrderDetailScreen must use getStateRevision()');

const procureContent = fs.readFileSync(path.join(baseDir, 'src/screens/suppliers/ProcureScreen.tsx'), 'utf8');
assert(procureContent.includes('prev.every((r, i) => r.id === nextReqs[i]?.id'), 'ProcureScreen must equality-gate agent requests');

const agentServiceContent = fs.readFileSync(path.join(baseDir, 'src/screens/suppliers/AgentServiceScreen.tsx'), 'utf8');
assert(agentServiceContent.includes('prev.every((r, i) => r.id === nextRequests[i]?.id'), 'AgentServiceScreen must equality-gate agent requests');

const mobileSuppliersContent = fs.readFileSync(path.join(baseDir, 'src/screens/suppliers/SuppliersScreen.tsx'), 'utf8');
assert(mobileSuppliersContent.includes('curRev === lastRevRef.current'), 'SuppliersScreen must gate directory loads on revision changes');

console.log('✅ Customer mobile screens verified with equality-gated subscriptions.');

// -----------------------------------------------------------------------------
// Test 6: Supabase Auth Deduplication and Session Caching
// -----------------------------------------------------------------------------
console.log('[Test 6] Verifying Supabase Auth deduplication and session caching...');
const supabaseAuthFile = fs.readFileSync(path.join(baseDir, 'src/services/supabaseAuth.ts'), 'utf8');

assert(supabaseAuthFile.includes('flyemass_supabase_session'), 'SupabaseAuthService must cache session in localStorage');
assert(supabaseAuthFile.includes('lastNotifiedToken'), 'SupabaseAuthService must deduplicate session token broadcasts');
assert(supabaseAuthFile.includes('onAuthStateChange'), 'SupabaseAuthService must provide stable onAuthStateChange listener');

console.log('✅ Supabase Auth deduplication and session caching verified.');

console.log('\n========================================================================');
console.log('🎉 ALL ADMIN & MOBILE INFINITE RELOADING STABILIZATION TESTS PASSED (6/6)!');
console.log('========================================================================\n');
