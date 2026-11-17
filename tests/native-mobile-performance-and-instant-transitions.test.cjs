const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testNativePerformanceAndTransitions() {
  console.log('--- STARTING NATIVE MOBILE PERFORMANCE & INSTANT TRANSITIONS TEST ---');

  // Test 1: MobileShell Pre-warmed routes and keep-alive cache
  console.log('[Test 1] Verifying MobileShell route pre-warming and keep-alive cache architecture...');
  const shellPath = path.join(__dirname, '../src/components/layout/MobileShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf8');

  assert(shellContent.includes('PREWARMED_ROUTES'), 'PREWARMED_ROUTES array must be defined');
  assert(shellContent.includes('cachedRoutes'), 'cachedRoutes state must be defined');
  assert(shellContent.includes('scrollPositions'), 'scrollPositions ref must track scroll coordinates per route');
  assert(shellContent.includes('flyemass:prefetch-route'), 'Prefetch custom event listener must be registered');
  assert(shellContent.includes("display: currentRoute === 'home' ? 'flex' : 'none'") || shellContent.includes("display: currentRoute === 'home' ? 'contents' : 'none'"), 'Home tab must use zero-delay display toggle');
  assert(shellContent.includes("display: currentRoute === 'wallets' ? 'flex' : 'none'") || shellContent.includes("display: currentRoute === 'wallets' ? 'contents' : 'none'"), 'Wallets tab must use zero-delay display toggle');
  assert(shellContent.includes("display: currentRoute === 'logistics' ? 'flex' : 'none'") || shellContent.includes("display: currentRoute === 'logistics' ? 'contents' : 'none'"), 'Logistics tab must use zero-delay display toggle');
  assert(shellContent.includes("display: currentRoute === 'shop' ? 'flex' : 'none'") || shellContent.includes("display: currentRoute === 'shop' ? 'contents' : 'none'"), 'Shop tab must use zero-delay display toggle');
  assert(shellContent.includes("display: currentRoute === 'profile' ? 'flex' : 'none'") || shellContent.includes("display: currentRoute === 'profile' ? 'contents' : 'none'"), 'Profile tab must use zero-delay display toggle');
  assert(shellContent.includes('activeCachedRoutes') || shellContent.includes('Array.from(cachedRoutes)'), 'Cached secondary routes must be rendered via keep-alive pattern');
  console.log('✅ MobileShell pre-warmed routes and keep-alive cache verified.');

  // Test 2: AppContext synchronous cache hydration and prefetch API
  console.log('[Test 2] Verifying AppContext synchronous data cache hydration and prefetch API...');
  const appContextPath = path.join(__dirname, '../src/context/AppContext.tsx');
  const appContextContent = fs.readFileSync(appContextPath, 'utf8');

  assert(appContextContent.includes('prefetchRoute: (route: ScreenRoute) => void'), 'prefetchRoute must be part of AppContextType');
  assert(appContextContent.includes('buildInitialShipments'), 'buildInitialShipments helper must exist');
  assert(appContextContent.includes('buildInitialTransactions'), 'buildInitialTransactions helper must exist');
  assert(appContextContent.includes('const [shipments, setShipments] = useState<Shipment[]>(buildInitialShipments)'), 'Shipments must initialize from memory cache');
  assert(appContextContent.includes('const [transactions, setTransactions] = useState<Transaction[]>('), 'Transactions must initialize from memory cache');
  assert(appContextContent.includes('window.scrollTo(0, 0)'), 'Instant scroll reset without smooth animation lag must be implemented');
  assert(!appContextContent.includes("window.scrollTo({ top: 0, behavior: 'smooth' })"), 'Smooth scroll animation delay must be removed from navigate');
  console.log('✅ AppContext synchronous hydration and prefetch API verified.');

  // Test 3: BottomNav touch/pointer prefetching and tactile response
  console.log('[Test 3] Verifying BottomNav touch/pointer prefetching and active state styling...');
  const bottomNavPath = path.join(__dirname, '../src/components/layout/BottomNav.tsx');
  const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

  assert(bottomNavContent.includes('prefetchRoute'), 'prefetchRoute must be imported and used');
  assert(bottomNavContent.includes('onPointerDown={() => prefetchRoute(\'home\')}'), 'Home tab must prefetch on pointer down');
  assert(bottomNavContent.includes('onTouchStart={() => prefetchRoute(\'home\')}'), 'Home tab must prefetch on touch start');
  assert(bottomNavContent.includes('onPointerDown={() => prefetchRoute(\'wallets\')}'), 'Wallets tab must prefetch on pointer down');
  assert(bottomNavContent.includes('onPointerDown={() => prefetchRoute(\'logistics\')}'), 'Cargo tab must prefetch on pointer down');
  assert(bottomNavContent.includes('onPointerDown={() => prefetchRoute(\'shop\')}'), 'Shop tab must prefetch on pointer down');
  assert(bottomNavContent.includes('onPointerDown={() => prefetchRoute(\'profile\')}'), 'Profile tab must prefetch on pointer down');
  assert(bottomNavContent.includes('touch-manipulation'), 'touch-manipulation class must be present to remove 300ms double-tap delay');
  assert(bottomNavContent.includes('active:scale-95'), 'active:scale-95 class must provide tactile visual press feedback');
  console.log('✅ BottomNav touch prefetching and tactile response verified.');

  // Test 4: HomeScreen touch prefetching
  console.log('[Test 4] Verifying HomeScreen quick action prefetching...');
  const homeScreenPath = path.join(__dirname, '../src/screens/home/HomeScreen.tsx');
  const homeScreenContent = fs.readFileSync(homeScreenPath, 'utf8');

  assert(homeScreenContent.includes('prefetchRoute'), 'prefetchRoute must be destructured in HomeScreen');
  assert(homeScreenContent.includes('prefetchRoute((act as any).route)'), 'Quick action buttons must prefetch target route');
  assert(homeScreenContent.includes('prefetchRoute(\'track\')'), 'Active cargo widget must prefetch track route');
  console.log('✅ HomeScreen quick action prefetching verified.');

  // Test 5: CSS Momentum scrolling, zero-delay touch, and active states
  console.log('[Test 5] Verifying CSS touch manipulation and momentum scrolling rules...');
  const cssPath = path.join(__dirname, '../src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('-webkit-overflow-scrolling: touch;'), 'CSS must include -webkit-overflow-scrolling: touch');
  assert(cssContent.includes('overscroll-behavior-y: contain;'), 'CSS must contain overscroll-behavior-y: contain');
  assert(cssContent.includes('touch-action: manipulation;'), 'CSS must enforce touch-action: manipulation on buttons and interactive elements');
  assert(cssContent.includes('-webkit-tap-highlight-color: transparent;'), 'CSS must eliminate grey tap highlight');
  assert(cssContent.includes('button:active:not(:disabled)'), 'CSS must provide native tactile press feedback on active state');
  console.log('✅ CSS momentum scrolling and touch manipulation rules verified.');

  // Test 6: SuppliersScreen synchronous cache and elimination of loading delay
  console.log('[Test 6] Verifying SuppliersScreen synchronous cache and removal of artificial loading delays...');
  const suppliersPath = path.join(__dirname, '../src/screens/suppliers/SuppliersScreen.tsx');
  const suppliersContent = fs.readFileSync(suppliersPath, 'utf8');

  assert(suppliersContent.includes('VETTED_SUPPLIERS'), 'SuppliersScreen must import VETTED_SUPPLIERS as fallback');
  assert(suppliersContent.includes('useState<boolean>(false)'), 'isLoading must initialize to false to prevent loading spinner on initial view');
  assert(suppliersContent.includes('loadDirectoryData = async (silent: boolean = true)'), 'loadDirectoryData must default to silent background revalidation');
  console.log('✅ SuppliersScreen synchronous cache and instant rendering verified.');

  console.log('\n========================================================================');
  console.log('🎉 ALL NATIVE MOBILE PERFORMANCE & INSTANT TRANSITION TESTS PASSED (6/6)!');
  console.log('========================================================================');
}

testNativePerformanceAndTransitions();
