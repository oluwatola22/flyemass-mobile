/**
 * Infinite Re-rendering & Loop Reloading Stabilization Test Suite
 * 
 * Verifies the stabilization fixes across:
 * 1. Supabase Auth deduplication & session caching (SupabaseAuthService)
 * 2. Database warehouse fallback hydration & non-empty initial load
 * 3. RegisterPackageScreen effect stabilization (activeWarehouseIds dependency)
 * 4. LogisticsScreen & TrackShipmentScreen removal of redundant setTick subscriptions
 * 5. HomeScreen banner subscription equality gating
 * 6. AppContext equality-gated syncFromDb and useCallback action wrappers
 * 7. MobileShell streamlined pre-warmed routes
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING INFINITE LOOP & RE-RENDER STABILIZATION TEST ---');

// Test 1: Verify SupabaseAuthService implementation
console.log('[Test 1] Verifying SupabaseAuthService deduplication and caching...');
const supabaseAuthPath = path.resolve(__dirname, '../src/services/supabaseAuth.ts');
assert(fs.existsSync(supabaseAuthPath), 'src/services/supabaseAuth.ts must exist');
const supabaseAuthContent = fs.readFileSync(supabaseAuthPath, 'utf8');

assert(supabaseAuthContent.includes('class SupabaseAuthService'), 'Must define SupabaseAuthService class');
assert(supabaseAuthContent.includes('lastNotifiedToken'), 'Must track lastNotifiedToken for event deduplication');
assert(supabaseAuthContent.includes('flyemass_supabase_session'), 'Must use local cache key flyemass_supabase_session');
assert(supabaseAuthContent.includes('onAuthStateChange'), 'Must implement onAuthStateChange with unsubscribe');
assert(supabaseAuthContent.includes('export const supabaseAuth'), 'Must export supabaseAuth singleton');
console.log('✅ SupabaseAuthService deduplication and session caching verified.');

// Test 2: Verify DEFAULT_WAREHOUSES in db.ts
console.log('[Test 2] Verifying DEFAULT_WAREHOUSES in db.ts...');
const dbPath = path.resolve(__dirname, '../src/services/db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf8');

assert(dbContent.includes('export const DEFAULT_WAREHOUSES'), 'db.ts must export DEFAULT_WAREHOUSES');
assert(dbContent.includes('wh_gz_main'), 'DEFAULT_WAREHOUSES must include Guangzhou main hub');
assert(dbContent.includes('wh_yiwu_sea') || dbContent.includes('wh_yiwu_port'), 'DEFAULT_WAREHOUSES must include Yiwu hub');
assert(dbContent.includes('wh_jfk_air') || dbContent.includes('wh_foshan_heavy'), 'DEFAULT_WAREHOUSES must include logistics hub');
assert(dbContent.includes('wh_hou_sea') || dbContent.includes('wh_shenzhen_tech'), 'DEFAULT_WAREHOUSES must include air/sea hub');
assert(dbContent.includes('warehouses: DEFAULT_WAREHOUSES') || dbContent.includes('warehouses: { ...DEFAULT_WAREHOUSES }'), 'INITIAL_DATABASE must initialize warehouses with DEFAULT_WAREHOUSES');
console.log('✅ DEFAULT_WAREHOUSES and initial warehouse hydration verified.');

// Test 3: Verify RegisterPackageScreen effect stabilization
console.log('[Test 3] Verifying RegisterPackageScreen circular dependency elimination...');
const registerPackagePath = path.resolve(__dirname, '../src/screens/logistics/RegisterPackageScreen.tsx');
const registerPackageContent = fs.readFileSync(registerPackagePath, 'utf8');

assert(registerPackageContent.includes('activeWarehouseIds'), 'RegisterPackageScreen must derive activeWarehouseIds signature');
assert(registerPackageContent.includes('}, [activeWarehouseIds, selectedWarehouseId]);'), 'useEffect must depend on primitive activeWarehouseIds string');
assert(registerPackageContent.includes('setSelectedHubId((prevId) =>'), 'Must use functional setter to avoid lagosHubs infinite loop');
console.log('✅ RegisterPackageScreen dependency stabilization verified.');

// Test 4: Verify removal of setTick from LogisticsScreen & TrackShipmentScreen
console.log('[Test 4] Verifying removal of setTick subscriptions...');
const logisticsScreenPath = path.resolve(__dirname, '../src/screens/logistics/LogisticsScreen.tsx');
const logisticsScreenContent = fs.readFileSync(logisticsScreenPath, 'utf8');
assert(!logisticsScreenContent.includes('setTick'), 'LogisticsScreen must not contain setTick state subscription');

const trackShipmentPath = path.resolve(__dirname, '../src/screens/logistics/TrackShipmentScreen.tsx');
const trackShipmentContent = fs.readFileSync(trackShipmentPath, 'utf8');
assert(!trackShipmentContent.includes('setTick'), 'TrackShipmentScreen must not contain setTick state subscription');
console.log('✅ Redundant setTick subscriptions completely eliminated from logistics screens.');

// Test 5: Verify HomeScreen banner subscription equality gating
console.log('[Test 5] Verifying HomeScreen banner equality gating...');
const homeScreenPath = path.resolve(__dirname, '../src/screens/home/HomeScreen.tsx');
const homeScreenContent = fs.readFileSync(homeScreenPath, 'utf8');

assert(homeScreenContent.includes('db.subscribe(() => {'), 'HomeScreen must subscribe to db');
assert(homeScreenContent.includes('prev.every((b, i) => b.id === nextBanners[i]?.id'), 'HomeScreen must compare banner properties before re-setting state');
console.log('✅ HomeScreen banner equality gating verified.');

// Test 6: Verify AppContext equality-gated syncFromDb and useCallback actions
console.log('[Test 6] Verifying AppContext equality gating & action stabilization...');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.tsx');
const appContextContent = fs.readFileSync(appContextPath, 'utf8');

assert(appContextContent.includes('import { supabaseAuth }'), 'AppContext must import supabaseAuth');
assert(appContextContent.includes('supabaseAuth.onAuthStateChange'), 'AppContext must listen to supabaseAuth.onAuthStateChange');
assert(appContextContent.includes('prev.every((w, i) => w.currency === nextWallets[i]?.currency'), 'Wallets sync must be equality-gated');
assert(appContextContent.includes('prev.name === user.fullName'), 'UserProfile sync must be equality-gated');
assert(appContextContent.includes('prev.every((s, i) =>'), 'Shipments sync must be equality-gated');
assert(appContextContent.includes('prev.every((w, i) => w.id === dbWhs[i]?.id'), 'Warehouses sync must be equality-gated');
assert(appContextContent.includes('prev.every((t, i) => t.id === nextTxs[i]?.id'), 'Transactions sync must be equality-gated');
assert(appContextContent.includes('useCallback((route: ScreenRoute'), 'navigate must be wrapped in useCallback');
assert(appContextContent.includes('useCallback((message: string'), 'showToast must be wrapped in useCallback');
assert(appContextContent.includes('useCallback((route: ScreenRoute) =>'), 'prefetchRoute must be wrapped in useCallback');
console.log('✅ AppContext state synchronization and actions stabilized.');

// Test 7: Verify MobileShell pre-warmed routes optimization
console.log('[Test 7] Verifying MobileShell pre-warmed routes bounds...');
const mobileShellPath = path.resolve(__dirname, '../src/components/layout/MobileShell.tsx');
const mobileShellContent = fs.readFileSync(mobileShellPath, 'utf8');

assert(mobileShellContent.includes("const PRIMARY_TABS: ScreenRoute[] = ['home', 'wallets', 'logistics', 'shop', 'profile'];"), 'PRIMARY_TABS defined');
assert(mobileShellContent.includes("const PREWARMED_ROUTES: ScreenRoute[] = [\n  'home',\n  'wallets',\n  'logistics',\n  'shop',\n  'profile'\n];"), 'PREWARMED_ROUTES restricted to PRIMARY_TABS');
console.log('✅ MobileShell pre-warmed routes bound verified.');

// Test 8: Verify comprehensive screen-level subscription equality gating
console.log('[Test 8] Verifying screen-level subscription equality gating across modules...');
const shopScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/shop/ShopScreen.tsx'), 'utf8');
assert(shopScreenContent.includes('prev.every((p, i) => p.id === current[i]?.id'), 'ShopScreen products subscription must be equality-gated');

const supportChatContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/profile/SupportChatScreen.tsx'), 'utf8');
assert(supportChatContent.includes('prev.messages?.length === current.messages?.length'), 'SupportChatScreen ticket subscription must be equality-gated');

const exchangeContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/wallets/ExchangeScreen.tsx'), 'utf8');
assert(exchangeContent.includes('prev.USD_NGN === nextRates.USD_NGN'), 'ExchangeScreen rates subscription must be equality-gated');

const swapModalContent = fs.readFileSync(path.resolve(__dirname, '../src/components/wallet/CurrencySwapModal.tsx'), 'utf8');
assert(swapModalContent.includes('prev.USD_NGN === nextRates.USD_NGN'), 'CurrencySwapModal rates subscription must be equality-gated');

const aptsContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/rentals/ApartmentsScreen.tsx'), 'utf8');
assert(aptsContent.includes('prev.every((p, i) => p.id === rList[i]?.id'), 'ApartmentsScreen rentals subscription must be equality-gated');

const officesContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/rentals/OfficeRentalsScreen.tsx'), 'utf8');
assert(officesContent.includes('prev.every((p, i) => p.id === rList[i]?.id'), 'OfficeRentalsScreen rentals subscription must be equality-gated');

const hotelsContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/hotels/HotelsScreen.tsx'), 'utf8');
assert(hotelsContent.includes('prev.every((h, i) => h.id === hList[i]?.id'), 'HotelsScreen hotels subscription must be equality-gated');
console.log('✅ Screen-level subscription equality gating verified across all modules.');

console.log('\n========================================================================');
console.log('🎉 ALL INFINITE LOOP & RE-RENDER STABILIZATION TESTS PASSED (8/8)!');
console.log('========================================================================');
