/**
 * Automated Verification Suite:
 * Enterprise Admin Console Visual Identity, Color Palette & Navigation Redesign (Admin Only)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Enterprise Admin Console Visual Identity & Navigation');
  console.log('===================================================================');

  const indexCssSrc = readFile('src/index.css');
  const adminLayoutSrc = readFile('src/components/admin/AdminLayout.tsx');
  const adminShellSrc = readFile('src/components/admin/AdminShell.tsx');
  const appContextSrc = readFile('src/context/AppContext.tsx');
  const adminDashboardSrc = readFile('src/screens/admin/AdminDashboardScreen.tsx');
  const adminLogisticsSrc = readFile('src/screens/admin/AdminLogisticsScreen.tsx');

  // 1. Enterprise Admin Color System & Visual Hierarchy (Scoped to Admin Only)
  console.log('1. Verifying Enterprise Admin Color System & Visual Hierarchy...');
  assert(
    indexCssSrc.includes('.admin-enterprise-theme') && adminLayoutSrc.includes('admin-enterprise-theme'),
    'Admin color system must be scoped to .admin-enterprise-theme so mobile app styling remains untouched'
  );
  assert(
    indexCssSrc.includes('#0B0F19') && adminLayoutSrc.includes('#0B0F19'),
    'Deep obsidian/charcoal background (#0B0F19) must be configured'
  );
  assert(
    indexCssSrc.includes('#131C31') && adminLayoutSrc.includes('#131C31'),
    'Elevated dark slate surfaces (#131C31) must be configured'
  );
  assert(
    indexCssSrc.includes('#22304A') && adminLayoutSrc.includes('#22304A'),
    'Crisp structural slate borders (#22304A) must be configured'
  );
  assert(
    indexCssSrc.includes('#00F5D4') && adminLayoutSrc.includes('#00F5D4'),
    'Luminous banking emerald (#00F5D4) accents must be configured'
  );
  assert(
    indexCssSrc.includes('#2563EB') && adminLayoutSrc.includes('#2563EB'),
    'Professional logistic blue (#2563EB) accents must be configured'
  );
  assert(
    indexCssSrc.includes('#FFFFFF') && indexCssSrc.includes('#F1F5F9') && indexCssSrc.includes('#94A3B8'),
    'High-contrast typography hierarchy (#FFFFFF headers, #F1F5F9 platinum data rows, #94A3B8 muted steel) must be configured'
  );
  console.log('   ✓ Enterprise Admin Color System & Visual Hierarchy verified');

  // 2. Intuitive Admin Navigation & Core Workflow Routes
  console.log('2. Verifying Intuitive Admin Navigation & Core Workflow Routes...');
  const requiredWorkflows = [
    { label: 'Dashboard & Overview', path: '/admin' },
    { label: 'Shipments & Cargo Pipeline', path: '/admin/shipments' },
    { label: 'Agent Sourcing & Procurement', path: '/admin/agent-requests' },
    { label: 'Support Tickets & Duty Desk', path: '/admin/support/tickets' },
    { label: 'Lagos Hubs & Last-Mile Offices', path: '/admin/lagos-hubs' },
    { label: 'Air Shipping & FX Rates', path: '/admin/settings/shipping' }
  ];

  for (const wf of requiredWorkflows) {
    assert(
      adminLayoutSrc.includes(wf.label),
      `AdminLayout must include core workflow label "${wf.label}"`
    );
    assert(
      adminLayoutSrc.includes(wf.path) && appContextSrc.includes(wf.path),
      `AdminLayout and AppContext must support core workflow path "${wf.path}"`
    );
  }

  assert(
    adminLayoutSrc.includes('data-testid="admin-sticky-header"'),
    'Sticky top command header must be present in AdminLayout'
  );
  assert(
    adminLayoutSrc.includes('data-testid="admin-breadcrumb-header"'),
    'Interactive top breadcrumb header must be present in AdminLayout'
  );
  assert(
    adminLayoutSrc.includes('data-testid="admin-collapsible-sidebar"'),
    'Collapsible sidebar must be present in AdminLayout'
  );
  assert(
    adminLayoutSrc.includes('data-testid="admin-core-workflow-bar"'),
    '1-Click Core Operational Workflows bar must be present in AdminLayout'
  );
  assert(
    adminLayoutSrc.includes('⌘K') && adminLayoutSrc.includes('handleKeyDown'),
    'Keyboard-friendly global command search (⌘K / /) must be implemented in AdminLayout'
  );
  assert(
    adminDashboardSrc.includes('data-testid="dashboard-core-workflows-grid"'),
    'AdminDashboardScreen must include 1-click Core Operational Workflows launchpad'
  );

  // 2B. Shipments & Cargo Pipeline Navigation Overhaul (/admin/shipments)
  console.log('2B. Verifying Shipments & Cargo Pipeline Navigation Overhaul (/admin/shipments)...');
  const requiredSubViews = [
    'Pipeline Table',
    'Air & FX Rates',
    'Dock Scanner',
    'Detailed Cards & OTP',
    'Consolidation',
    'Hub Addresses'
  ];
  for (const sv of requiredSubViews) {
    assert(
      adminLogisticsSrc.includes(sv),
      `AdminLogisticsScreen must include sub-view "${sv}" in multi-view header`
    );
  }

  const requiredQuickFilterPills = [
    'All Shipments',
    'Pending Calculation',
    'Awaiting Payment',
    'In Transit',
    'Delivered'
  ];
  for (const qf of requiredQuickFilterPills) {
    assert(
      adminLogisticsSrc.includes(qf),
      `AdminLogisticsScreen must include quick-filter pill "${qf}"`
    );
  }

  assert(
    adminLogisticsSrc.includes('data-testid="master-shipments-table"') &&
      adminLogisticsSrc.includes('divide-x') &&
      adminLogisticsSrc.includes('py-4'),
    'Master shipments table must feature spacious row padding and column dividers'
  );
  assert(
    adminLogisticsSrc.includes('BILL / REPACKAGE'),
    'Prominent thumb-friendly BILL / REPACKAGE action button must be present in table'
  );
  console.log('   ✓ Shipments & Cargo Pipeline Navigation Overhaul verified');
  console.log('   ✓ Intuitive Admin Navigation & Information Architecture verified');

  // 3. Seamless Real-Time Mobile & Backend Synchronization
  console.log('3. Verifying Seamless Real-Time Mobile & Backend Synchronization...');
  assert(
    adminShellSrc.includes("case 'admin-shipping-rates':") &&
      adminShellSrc.includes('<AdminLogisticsScreen initialMainTab="rates" />'),
    'AdminShell must route admin-shipping-rates (/admin/settings/shipping) directly to the Rates tab of AdminLogisticsScreen'
  );
  assert(
    adminLogisticsSrc.includes('initialMainTab') && adminLogisticsSrc.includes('repackageAndBillShipment'),
    'AdminLogisticsScreen must support initialMainTab and real-time shipment billing/repackaging'
  );
  assert(
    appContextSrc.includes("'/_authenticated/cargo'") && appContextSrc.includes("'/_authenticated/track'"),
    'AppContext must preserve customer mobile routes (/cargo, /_authenticated/cargo, /_authenticated/track)'
  );
  console.log('   ✓ Seamless Real-Time Mobile & Backend Synchronization verified');

  console.log('===================================================================');
  console.log('ALL ENTERPRISE ADMIN VISUAL IDENTITY & NAVIGATION TESTS PASSED!');
  console.log('===================================================================');
}

runTests();
