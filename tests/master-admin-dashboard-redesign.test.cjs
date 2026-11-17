/**
 * Automated Verification Suite:
 * Master Enterprise Admin Dashboard UI/UX Redesign
 * 
 * Validates:
 * 1. Scoped enterprise styling with midnight navy palette (#0B1220, #111C2E, #101A2B, #152238, #1B2A40, #293A52)
 * 2. Primary electric blue (#4778F5, #3867E8) & financial status colors (#10B981, #F59E0B, #EF4444, #22B8CF, #8B7CF6)
 * 3. 4 strict sidebar categories: CORE OPERATIONS, TREASURY & SETTLEMENTS, HUBS, TRADE & REAL ESTATE, SYSTEM & GOVERNANCE
 * 4. Executive Command Center with Financial, Logistics, Customer Operations, and Interactive Charts
 * 5. Mobile App isolation (zero bleed into customer mobile interface)
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
  console.log('TEST SUITE: Master Enterprise Admin Dashboard UI/UX Redesign');
  console.log('===================================================================');

  const indexCss = readFile('src/index.css');
  const adminHtml = readFile('admin.html');
  const adminLayout = readFile('src/components/admin/AdminLayout.tsx');
  const adminDashboard = readFile('src/screens/admin/AdminDashboardScreen.tsx');
  const mobileHome = readFile('src/screens/home/HomeScreen.tsx');

  // 1. Enterprise Color System Verification
  console.log('1. Verifying Strict Enterprise Color System (#0B1220, #111C2E, #101A2B, #152238, #1B2A40, #293A52)...');
  assert(indexCss.includes('#0B1220'), 'Primary background #0B1220 must be defined in CSS');
  assert(indexCss.includes('#111C2E'), 'Secondary background #111C2E must be defined in CSS');
  assert(indexCss.includes('#101A2B'), 'Sidebar background #101A2B must be defined in CSS');
  assert(indexCss.includes('#152238'), 'Main content surface #152238 must be defined in CSS');
  assert(indexCss.includes('#1B2A40'), 'Elevated cards #1B2A40 must be defined in CSS');
  assert(indexCss.includes('#293A52'), 'Borders #293A52 must be defined in CSS');
  assert(indexCss.includes('#4778F5'), 'Electric blue accent #4778F5 must be defined');
  assert(indexCss.includes('#3867E8'), 'Active navigation blue #3867E8 must be defined');
  assert(indexCss.includes('#10B981'), 'Emerald green #10B981 must be defined');
  assert(indexCss.includes('#F59E0B'), 'Amber status #F59E0B must be defined');
  assert(indexCss.includes('#EF4444'), 'Red status #EF4444 must be defined');
  assert(indexCss.includes('#22B8CF'), 'Cyan status #22B8CF must be defined');
  assert(indexCss.includes('#8B7CF6'), 'Violet status #8B7CF6 must be defined');
  console.log('   ✓ All 13 core enterprise palette colors strictly defined');

  // 2. Sidebar Navigation Grouping into 4 Strict Categories
  console.log('2. Verifying Sidebar Navigation 4 Strict Categories...');
  assert(adminLayout.includes('CORE OPERATIONS'), 'Category CORE OPERATIONS must exist in sidebar');
  assert(adminLayout.includes('TREASURY & SETTLEMENTS'), 'Category TREASURY & SETTLEMENTS must exist in sidebar');
  assert(adminLayout.includes('HUBS, TRADE & REAL ESTATE'), 'Category HUBS, TRADE & REAL ESTATE must exist in sidebar');
  assert(adminLayout.includes('SYSTEM & GOVERNANCE'), 'Category SYSTEM & GOVERNANCE must exist in sidebar');
  assert(adminLayout.includes('Developer Diagnostics'), 'Developer diagnostics must be labeled properly');
  console.log('   ✓ 4 strict navigation categories verified');

  // 3. Header Enhancements
  console.log('3. Verifying Header System Status, Live Clock, and Quick Actions...');
  assert(adminLayout.includes('99.98% SLA Nominal'), '99.98% SLA indicator must exist in header');
  assert(adminLayout.includes('WAT'), 'West Africa Time (WAT) clock must be displayed');
  assert(adminLayout.includes('showQuickActions') && adminLayout.includes('Operational Shortcuts'), 'Quick actions menu must be accessible');
  console.log('   ✓ Header clock, SLA, and quick actions verified');

  // 4. Executive Command Center Panels
  console.log('4. Verifying Executive Command Center Dashboard Panels...');
  assert(adminDashboard.includes('Executive Command Center'), 'Dashboard title must be Executive Command Center');
  assert(adminDashboard.includes('Financial Overview & Liquidity Architecture'), 'Financial Overview panel must exist');
  assert(adminDashboard.includes('Naira Customer Vault'), 'Naira Customer Vault must be displayed');
  assert(adminDashboard.includes('RMB Supplier Vault'), 'RMB Supplier Vault must be displayed');
  assert(adminDashboard.includes('Logistics & Cargo Pipeline'), 'Logistics overview must exist');
  assert(adminDashboard.includes('Customer & Trade Operations'), 'Customer operations must exist');
  assert(adminDashboard.includes('Cross-Border Settlement Flow & FX Throughput'), 'Settlement flow chart must exist');
  assert(adminDashboard.includes('Urgent Action Review Queue'), 'Urgent action queue must exist');
  console.log('   ✓ All Executive Command Center analytical panels verified');

  // 5. Mobile App Isolation
  console.log('5. Verifying Mobile App isolation (zero style pollution)...');
  assert(!mobileHome.includes('admin-enterprise-theme'), 'Mobile home screen must not contain admin theme');
  assert(!mobileHome.includes('#0B1220'), 'Mobile home must retain its own design tokens');
  console.log('   ✓ Mobile application completely isolated from admin redesign');

  console.log('===================================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY (5/5)');
  console.log('===================================================================');
}

runTests();
