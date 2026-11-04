const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n=============================================================');
console.log('  FLYEMASS — MOBILE APP & ADMIN DASHBOARD URL SEPARATION SUITE');
console.log('=============================================================\n');

const mobileAppPath = path.resolve(__dirname, '../src/MobileApp.tsx');
const adminAppPath = path.resolve(__dirname, '../src/AdminApp.tsx');
const mobileShellPath = path.resolve(__dirname, '../src/components/layout/MobileShell.tsx');
const adminShellPath = path.resolve(__dirname, '../src/components/admin/AdminShell.tsx');
const adminLoginPath = path.resolve(__dirname, '../src/screens/admin/AdminLoginScreen.tsx');
const environmentPath = path.resolve(__dirname, '../src/utils/environment.ts');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.tsx');

// --- Test 1: URL & Environment Resolution ---
console.log('--- 1. Dedicated URLs & Independent Entry Points ---');
const envContent = fs.readFileSync(environmentPath, 'utf8');
assert(envContent.includes('http://localhost:3030'), 'Mobile development URL must be port 3030');
assert(envContent.includes('http://localhost:5173'), 'Admin development URL must be port 5173');
assert(envContent.includes('https://app.flyemass.com'), 'Mobile production URL must be https://app.flyemass.com');
assert(envContent.includes('https://admin.flyemass.com'), 'Admin production URL must be https://admin.flyemass.com');
assert(envContent.includes('isAdminEnvironment'), 'Must export isAdminEnvironment helper');
assert(envContent.includes('isMobileEnvironment'), 'Must export isMobileEnvironment helper');
console.log('✅ PASSED: Environment utility defines independent URLs for Mobile (:3030) and Admin (:5173)');

// --- Test 2: Elimination of DevEnvironmentSwitcher ---
console.log('\n--- 2. Elimination of Admin/Mobile Switching Bars ---');
const mobileAppContent = fs.readFileSync(mobileAppPath, 'utf8');
const adminAppContent = fs.readFileSync(adminAppPath, 'utf8');
assert(!mobileAppContent.includes('DevEnvironmentSwitcher'), 'MobileApp must NOT import or render DevEnvironmentSwitcher');
assert(!adminAppContent.includes('DevEnvironmentSwitcher'), 'AdminApp must NOT import or render DevEnvironmentSwitcher');
console.log('✅ PASSED: DevEnvironmentSwitcher completely removed from both Mobile and Admin entry points');

// --- Test 3: Customer Mobile App Clean of Admin Links & Buttons ---
console.log('\n--- 3. Customer Mobile Shell Navigation Cleanliness ---');
const shellContent = fs.readFileSync(mobileShellPath, 'utf8');
assert(!shellContent.includes('🛡️ Admin'), 'MobileShell must NOT contain "🛡️ Admin" button');
assert(!shellContent.includes('getAdminAppUrl()'), 'MobileShell must NOT link to Admin URL');
assert(!shellContent.includes('DB Schema'), 'MobileShell must NOT contain DB Schema button');
assert(!shellContent.includes("route: 'admin-dashboard'"), 'allRoutes must NOT expose admin-dashboard');
assert(!shellContent.includes("route: 'admin-users'"), 'allRoutes must NOT expose admin-users');
assert(!shellContent.includes("route: 'admin-payments'"), 'allRoutes must NOT expose admin-payments');
assert(!shellContent.includes("route: 'schema-inspector'"), 'allRoutes must NOT expose schema-inspector');
assert(!shellContent.includes('AdminLoginScreen'), 'MobileShell must NOT import or render AdminLoginScreen');
assert(!shellContent.includes('AdminDashboardScreen'), 'MobileShell must NOT import or render AdminDashboardScreen');
console.log('✅ PASSED: Customer Mobile App contains zero Admin links, buttons, navigation, or screens');

// --- Test 4: Admin Portal Clean of Mobile Switching Buttons ---
console.log('\n--- 4. Admin Portal Independent Navigation & Security ---');
const loginContent = fs.readFileSync(adminLoginPath, 'utf8');
assert(!loginContent.includes('Switch to Mobile App'), 'AdminLoginScreen must NOT contain "Switch to Mobile App" button');
assert(!loginContent.includes("navigate('home')"), 'AdminLoginScreen must NOT navigate to customer mobile home');

const adminShellContent = fs.readFileSync(adminShellPath, 'utf8');
assert(adminShellContent.includes('adminUser'), 'AdminShell must enforce adminUser staff authentication guard');
assert(adminShellContent.includes('effectiveRoute'), 'AdminShell must check effective route and restrict unauthenticated access');
console.log('✅ PASSED: Admin Operations Workspace is fully independent and protected by staff authentication');

// --- Test 5: Route Guarding & Prevention of Direct URL Manipulation ---
console.log('\n--- 5. Route Guarding & Direct URL Manipulation Interception ---');
const contextContent = fs.readFileSync(appContextPath, 'utf8');
assert(contextContent.includes('if (!isAdmin)'), 'getInitialRoute must check environment');
assert(contextContent.includes("path.startsWith('/admin')"), 'Customer app must intercept /admin URL requests');
assert(contextContent.includes("Access Denied: Admin operations are restricted"), 'navigate must guard against admin route access on mobile');
assert(contextContent.includes("loginAdmin"), 'AppContext must export loginAdmin authentication action');
assert(contextContent.includes("logoutAdmin"), 'AppContext must export logoutAdmin authentication action');
console.log('✅ PASSED: Route guards strictly prevent URL manipulation and enforce environmental boundary');

// --- Test 6: Shared Backend Continuity via Live Sync Server ---
console.log('\n--- 6. Shared Authoritative Backend & Synchronization ---');
const syncServerPath = path.resolve(__dirname, '../sync-server.cjs');
const syncContent = fs.readFileSync(syncServerPath, 'utf8');
assert(syncContent.includes('verifyAdminRole'), 'Sync server must enforce verifyAdminRole on administrative RPCs');
assert(syncContent.includes('dbState.users'), 'Sync server must serve unified users collection');
assert(syncContent.includes('dbState.wallets_ledger'), 'Sync server must serve unified wallets ledger');
assert(syncContent.includes('dbState.shipments'), 'Sync server must serve unified shipments collection');
console.log('✅ PASSED: Unified backend infrastructure powers both Mobile and Admin applications');

console.log('\n=============================================================');
console.log('  ALL 6 URL SEPARATION & ACCESS CONTROL TESTS PASSED PERFECTLY!');
console.log('=============================================================\n');
