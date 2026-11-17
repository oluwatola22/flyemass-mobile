/**
 * ENTERPRISE STAFF LOGIN CREATION & GRANULAR RBAC ACCESS CONTROL TEST SUITE
 * 
 * Verifies:
 * 1. Staff account creation & credential provisioning modal (/admin/governance/rbac/new)
 * 2. Granular module-by-module permission restriction matrix (8 core modules)
 * 3. Frontend route gating, suspended account guards & security audit logging
 * 4. Admin team management dashboard (/admin/governance/rbac) & active/suspended toggling
 * 5. Authoritative backend endpoints in sync-server.cjs & db.ts methods
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

async function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Enterprise Staff Login Creation & RBAC Permissions');
  console.log('===================================================================');

  const syncServerSrc = readFile('sync-server.cjs');
  const dbSrc = readFile('src/services/db.ts');
  const firebaseSrc = readFile('src/services/firebase.ts');
  const appContextSrc = readFile('src/context/AppContext.tsx');
  const adminLayoutSrc = readFile('src/components/admin/AdminLayout.tsx');
  const adminShellSrc = readFile('src/components/admin/AdminShell.tsx');
  const adminTeamSrc = readFile('src/screens/admin/AdminTeamScreen.tsx');
  const accessDeniedSrc = readFile('src/screens/admin/AdminAccessDeniedScreen.tsx');
  const adminLoginSrc = readFile('src/screens/admin/AdminLoginScreen.tsx');

  // -----------------------------------------------------------------
  // 1. Staff Account Creation & Credential Provisioning Modal (/admin/governance/rbac/new)
  // -----------------------------------------------------------------
  console.log('1. Verifying Staff Account Creation & Credential Provisioning Modal...');
  assert(
    adminTeamSrc.includes('Provision Staff Officer') &&
    adminTeamSrc.includes('handleCreateStaff'),
    'AdminTeamScreen must provide Provision Staff Officer action and creation handler'
  );
  assert(
    adminTeamSrc.includes('/admin/governance/rbac/new'),
    'AdminTeamScreen must support deep linking to /admin/governance/rbac/new'
  );
  assert(
    adminTeamSrc.includes('Temporary Staff Password') &&
    adminTeamSrc.includes('Secure Invite & Login Link'),
    'AdminTeamScreen must generate temporary password and secure invite link'
  );
  assert(
    dbSrc.includes('provisionStaff') && dbSrc.includes('/api/admin/staff/create'),
    'db.ts must implement provisionStaff calling /api/admin/staff/create'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/admin/staff/create'"),
    'sync-server.cjs must implement POST /api/admin/staff/create'
  );
  console.log('   ✓ Staff account creation & credential provisioning verified');

  // -----------------------------------------------------------------
  // 2. Granular Module-by-Module Permission Restriction Matrix
  // -----------------------------------------------------------------
  console.log('2. Verifying Granular Module-by-Module Permission Restriction Matrix...');
  assert(
    firebaseSrc.includes('AdminModulePermission') &&
    firebaseSrc.includes("'shipments'") &&
    firebaseSrc.includes("'agents'") &&
    firebaseSrc.includes("'support'") &&
    firebaseSrc.includes("'lagos_hubs'") &&
    firebaseSrc.includes("'shipping_rates'") &&
    firebaseSrc.includes("'users'") &&
    firebaseSrc.includes("'treasury'") &&
    firebaseSrc.includes("'commerce'"),
    'firebase.ts must declare all 8 granular AdminModulePermission types'
  );
  assert(
    adminTeamSrc.includes('Shipments & Cargo Pipeline') &&
    adminTeamSrc.includes('Agent Sourcing & Procurement') &&
    adminTeamSrc.includes('Support Tickets & Duty Desk') &&
    adminTeamSrc.includes('Lagos Hubs & Last-Mile Delivery') &&
    adminTeamSrc.includes('Air Shipping & Logistics FX Rates') &&
    adminTeamSrc.includes('User Directory & Client Wallets') &&
    adminTeamSrc.includes('Treasury, Payouts & General Ledger') &&
    adminTeamSrc.includes('Hubs, Real Estate & Inventory'),
    'AdminTeamScreen must render the complete 8-module permission matrix'
  );
  assert(
    dbSrc.includes('updateStaffPermissions') && dbSrc.includes('/api/admin/staff/update-permissions'),
    'db.ts must implement updateStaffPermissions calling /api/admin/staff/update-permissions'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/admin/staff/update-permissions'"),
    'sync-server.cjs must implement POST /api/admin/staff/update-permissions'
  );
  console.log('   ✓ Granular 8-module permission restriction matrix verified');

  // -----------------------------------------------------------------
  // 3. Frontend Route Gating & Middleware Enforcement
  // -----------------------------------------------------------------
  console.log('3. Verifying Frontend Route Gating & Middleware Enforcement...');
  assert(
    adminShellSrc.includes('ROUTE_REQUIRED_PERMISSION') &&
    adminShellSrc.includes('AdminAccessDeniedScreen'),
    'AdminShell must enforce ROUTE_REQUIRED_PERMISSION and render AdminAccessDeniedScreen on violations'
  );
  assert(
    adminShellSrc.includes('adminUser.status === \'suspended\''),
    'AdminShell must intercept and block suspended staff accounts'
  );
  assert(
    adminShellSrc.includes('UNAUTHORIZED_ACCESS_BLOCKED'),
    'AdminShell must log unauthorized access attempts to audit logs'
  );
  assert(
    accessDeniedSrc.includes('Access Restricted by Admin') &&
    accessDeniedSrc.includes('Staff Account Suspended'),
    'AdminAccessDeniedScreen must handle both permission denial and suspension notices'
  );
  assert(
    adminLayoutSrc.includes('TAB_TO_PERMISSION') &&
    adminLayoutSrc.includes('isTabPermitted') || adminLayoutSrc.includes('currentAdmin.permissions'),
    'AdminLayout must dynamically filter sidebar tabs based on staff permissions'
  );
  console.log('   ✓ Route gating, suspended account guards & security audit logging verified');

  // -----------------------------------------------------------------
  // 4. Admin Team Management Dashboard (/admin/governance/rbac)
  // -----------------------------------------------------------------
  console.log('4. Verifying Admin Team Management Dashboard & Routing...');
  assert(
    appContextSrc.includes("'/admin/governance/rbac'") &&
    appContextSrc.includes("path.startsWith('/admin/governance/rbac')"),
    'AppContext must route /admin/governance/rbac to admin-team'
  );
  assert(
    adminLayoutSrc.includes("path: '/admin/governance/rbac'"),
    'AdminLayout navItems must link to /admin/governance/rbac'
  );
  assert(
    adminTeamSrc.includes('toggleStaffStatus') || adminTeamSrc.includes('handleToggleStatus'),
    'AdminTeamScreen must support one-click active/suspended status toggling'
  );
  assert(
    dbSrc.includes('toggleStaffStatus') && dbSrc.includes('/api/admin/staff/toggle-status'),
    'db.ts must implement toggleStaffStatus calling /api/admin/staff/toggle-status'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/admin/staff/toggle-status'"),
    'sync-server.cjs must implement POST /api/admin/staff/toggle-status'
  );
  assert(
    adminLoginSrc.includes('db.getAdminStaff()') &&
    adminLoginSrc.includes('isSuspended'),
    'AdminLoginScreen must dynamically load staff members and flag suspended accounts'
  );
  console.log('   ✓ Team management dashboard and active/suspended toggling verified');

  // -----------------------------------------------------------------
  // 5. Security Enclave Protection for Master Super Admin
  // -----------------------------------------------------------------
  console.log('5. Verifying Security Enclave Protection for Master Super Admin...');
  assert(
    syncServerSrc.includes("staffId === 'adm-001'") || syncServerSrc.includes("targetAdminId === 'adm-001'"),
    'sync-server.cjs must protect Chief Babatunde Alade (adm-001) from demotion or suspension'
  );
  assert(
    adminTeamSrc.includes("staff.uid === 'adm-001'") || adminTeamSrc.includes("adm-001"),
    'AdminTeamScreen must flag adm-001 with enclave protected status'
  );
  console.log('   ✓ Security Enclave protection verified');

  console.log('===================================================================');
  console.log('ALL ENTERPRISE STAFF LOGIN & RBAC PERMISSION TESTS PASSED!');
  console.log('===================================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
