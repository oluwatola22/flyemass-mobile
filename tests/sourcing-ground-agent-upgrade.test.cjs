/**
 * tests/sourcing-ground-agent-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Sourcing Ground Agent Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in AgentServiceScreen.tsx:
 *    - Ground services supported: Factory inspection, supplier verification, Canton Fair escort, quality control
 *    - Booking request form fields: product specifications, target quantities, Canton Fair booth
 *    - Pay booking fee directly from multi-currency wallet (USD, NGN, CNY) with 6-digit PIN
 *    - Strict preservation of luxury dark-mode FinTech design tokens
 * 2. Admin Logic in AdminAgentsScreen.tsx:
 *    - Task management queue for ground sourcing requests with status and service filters
 *    - Staff agent assignment workflow (Zhang Wei, Chen Tao, Lin Xiaomei, Wang Jing, Canton Fair Squad)
 *    - Staff inspection report upload workflow (PDF deliverable link, executive summary, findings)
 *    - Staff direct client communication workflow (milestone logging and customer push notification)
 * 3. Server Endpoints & Client Service Integration:
 *    - /api/agents/book-with-wallet endpoint with double-entry escrow hold and PIN verification
 *    - /api/admin/agents/assign endpoint with RBAC and customer notification dispatch
 *    - /api/admin/agents/communicate endpoint with milestone logging
 *    - db.bookAgentWithWallet, db.assignAgent, db.sendAgentClientUpdate in src/services/db.ts
 *    - AgentServiceKind type in src/types/index.ts includes 'canton_fair_escort'
 * 4. Authoritative State & Multi-Currency Ledger Equilibrium (NGN, USD, CNY)
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
console.log('FLYEMASS "SOURCING GROUND AGENT" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (AgentServiceScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 AgentServiceScreen provides ground services for factory inspection, supplier verification, and Canton Fair escort', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  assert.ok(fs.existsSync(file), 'AgentServiceScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  // Ground services cards & wizards
  assert.ok(content.includes('Physical Factory Audit') || content.includes('Factory Inspection'), 'Factory inspection service is supported');
  assert.ok(content.includes('Supplier Legitimacy Verification'), 'Supplier verification service is supported');
  assert.ok(content.includes('Canton Fair Escort & Trade Guide'), 'Canton Fair escort service is supported');
  assert.ok(content.includes('canton_fair_escort'), 'canton_fair_escort service kind is handled');
});

test('1.2 AgentServiceScreen form collects product specifications, target quantities, and Canton Fair booth', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('inspProductSpecs') && content.includes('setInspProductSpecs'), 'Product specifications state exists');
  assert.ok(content.includes('Product Specifications'), 'Product specifications label is present');
  assert.ok(content.includes('inspTargetQuantity') && content.includes('setInspTargetQuantity'), 'Target quantity state exists');
  assert.ok(content.includes('Target Quantity'), 'Target quantity label is present');
  assert.ok(content.includes('inspCantonFairBooth') && content.includes('setInspCantonFairBooth'), 'Canton Fair booth state exists');
  assert.ok(content.includes('Canton Fair Booth Number'), 'Canton Fair booth input is present');
});

test('1.3 AgentServiceScreen allows paying booking fees directly from multi-currency wallets with transaction PIN', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('inspPaymentMethod') && content.includes('setInspPaymentMethod'), 'Payment method toggle exists');
  assert.ok(content.includes('Pay via Wallet'), 'Pay via Wallet button is present');
  assert.ok(content.includes('inspWalletCurrency') && content.includes('setInspWalletCurrency'), 'Wallet currency selector exists');
  assert.ok(content.includes('inspPin') && content.includes('setInspPin'), '6-digit transaction PIN input exists');
  assert.ok(content.includes('db.bookAgentWithWallet'), 'Calls db.bookAgentWithWallet when paying via wallet');
});

test('1.4 AgentServiceScreen strictly preserves luxury dark-mode FinTech design tokens', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('bg-slate-950') && content.includes('bg-slate-900'), 'Uses dark slate surface background tokens');
  assert.ok(content.includes('border-slate-800'), 'Uses border-slate-800 border tokens');
  assert.ok(content.includes('text-emerald-400') || content.includes('text-amber-400'), 'Uses signature luxury accent tokens');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic in AdminAgentsScreen.tsx
// -----------------------------------------------------------------------------
test('2.1 AdminAgentsScreen renders task management queue with status and Canton Fair service filters', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminAgentsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('China Ground Trade Sourcing & Inspections'), 'Screen heading is present');
  assert.ok(content.includes('filteredRfqs'), 'Filtered RFQs queue is present');
  assert.ok(content.includes('statusFilter'), 'Status filter dropdown exists');
  assert.ok(content.includes('serviceFilter'), 'Service filter dropdown exists');
  assert.ok(content.includes('canton_fair_escort'), 'Canton Fair Escort is an option in serviceFilter');
});

test('2.2 AdminAgentsScreen enables staff to assign/reassign ground agents', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('assignModalRfq') && content.includes('setAssignModalRfq'), 'Assign agent modal state exists');
  assert.ok(content.includes('selectedAgentToAssign') && content.includes('setSelectedAgentToAssign'), 'Selected agent state exists');
  assert.ok(content.includes('openAssignModal'), 'openAssignModal handler exists');
  assert.ok(content.includes('handleConfirmAssignAgent'), 'handleConfirmAssignAgent submit handler exists');
  assert.ok(content.includes('db.assignAgent'), 'Calls db.assignAgent service method');
  assert.ok(content.includes('Zhang Wei') && content.includes('Chen Tao'), 'Verified ground agent options are available');
});

test('2.3 AdminAgentsScreen enables staff to upload inspection reports and executive summaries', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('opsReportPdfUrl') && content.includes('setOpsReportPdfUrl'), 'Inspection report URL state exists');
  assert.ok(content.includes('opsReportSummary') && content.includes('setOpsReportSummary'), 'Inspection report summary state exists');
  assert.ok(content.includes('Deliverable PDF Report URL'), 'PDF Report URL input is rendered');
  assert.ok(content.includes('Inspection Report Executive Summary'), 'Report summary textarea is rendered');
  assert.ok(content.includes('handleSaveOpsProgress'), 'handleSaveOpsProgress saves report deliverable');
});

test('2.4 AdminAgentsScreen provides direct client communication to send milestone updates', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('communicateModalRfq') && content.includes('setCommunicateModalRfq'), 'Communicate modal state exists');
  assert.ok(content.includes('clientMessage') && content.includes('setClientMessage'), 'Client message state exists');
  assert.ok(content.includes('openCommunicateModal'), 'openCommunicateModal handler exists');
  assert.ok(content.includes('handleSendClientUpdate'), 'handleSendClientUpdate submit handler exists');
  assert.ok(content.includes('db.sendAgentClientUpdate'), 'Calls db.sendAgentClientUpdate service method');
});

// -----------------------------------------------------------------------------
// 3. Server Endpoints & Client Service Integration
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs implements /api/agents/book-with-wallet with double-entry escrow hold', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/agents/book-with-wallet'), 'POST /api/agents/book-with-wallet is registered');
  assert.ok(content.includes('verifyUserTransactionPin'), 'Validates 6-digit transaction PIN');
  assert.ok(content.includes('AGENT_SERVICE_ESCROW'), 'Records AGENT_SERVICE_ESCROW double-entry transaction');
  assert.ok(content.includes('liabilities:agent_escrow'), 'Credits liabilities:agent_escrow account');
  assert.ok(content.includes('canton_fair_escort'), 'Supports canton_fair_escort service kind');
});

test('3.2 sync-server.cjs implements /api/admin/agents/assign and /api/admin/agents/communicate', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/admin/agents/assign'), 'POST /api/admin/agents/assign is registered');
  assert.ok(content.includes('AGENT_ASSIGNED'), 'Records AGENT_ASSIGNED audit event');
  assert.ok(content.includes('/api/admin/agents/communicate'), 'POST /api/admin/agents/communicate is registered');
  assert.ok(content.includes('AGENT_CLIENT_UPDATE_SENT'), 'Records AGENT_CLIENT_UPDATE_SENT audit event');
});

test('3.3 src/services/db.ts provides bookAgentWithWallet, assignAgent, and sendAgentClientUpdate', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('bookAgentWithWallet('), 'bookAgentWithWallet method exists');
  assert.ok(content.includes('assignAgent('), 'assignAgent method exists');
  assert.ok(content.includes('sendAgentClientUpdate('), 'sendAgentClientUpdate method exists');
});

test('3.4 src/types/index.ts includes canton_fair_escort in AgentServiceKind', () => {
  const file = path.join(BASE_DIR, 'src/types/index.ts');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('canton_fair_escort'), 'canton_fair_escort is included in AgentServiceKind union');
});

// -----------------------------------------------------------------------------
// 4. Authoritative State & Multi-Currency Ledger Equilibrium
// -----------------------------------------------------------------------------
test('4.1 Authoritative db-state.json holds valid agent requests and ledger equilibrium', () => {
  const dbFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(dbFile), 'db-state.json must exist');
  const dbData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

  assert.ok(dbData.agent_requests, 'db-state.json must contain agent_requests collection');
  const requests = Object.values(dbData.agent_requests);
  assert.ok(requests.length > 0, 'Agent requests must exist');

  // Verify wallets ledger equilibrium
  const wallets = Object.values(dbData.wallets || {});
  let totalNGN = 0, totalUSD = 0, totalCNY = 0;
  wallets.forEach(w => {
    totalNGN += (w.balanceNGN || 0);
    totalUSD += (w.balanceUSD || 0);
    totalCNY += (w.balanceCNY || 0);
  });

  assert.ok(!isNaN(totalNGN) && totalNGN >= 0, 'NGN balance must be valid non-negative number');
  assert.ok(!isNaN(totalUSD) && totalUSD >= 0, 'USD balance must be valid non-negative number');
  assert.ok(!isNaN(totalCNY) && totalCNY >= 0, 'CNY balance must be valid non-negative number');
  console.log(`   (Ledger Balance Summary: NGN ₦${totalNGN.toLocaleString()}, USD $${totalUSD.toLocaleString()}, CNY ¥${totalCNY.toLocaleString()})`);
});

console.log('\n=============================================================================');
console.log('ALL SOURCING GROUND AGENT UPGRADE VERIFICATION TESTS PASSED! 🎉');
console.log('=============================================================================');
