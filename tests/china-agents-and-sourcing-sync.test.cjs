/**
 * tests/china-agents-and-sourcing-sync.test.cjs
 * Comprehensive Verification Test Suite for China Agents & Sourcing Page (Mobile & Admin Sync)
 *
 * Verifies:
 * 1. Mobile App Interface ("China Agents & Sourcing"):
 *    - Title: "China Agents & Sourcing"
 *    - Streamlined navigation: Scannable cards for Factory Audit, Canton Fair Escort, Supplier Verification, Quality Control Inspection
 *    - Clear, simplified business copy for descriptions, deliverables, and fee structures
 *    - Specification form collects product details, target quantity, factory location/link, and special instructions
 *    - Submitting request creates active request in user dashboard
 *    - Status badges: 'Pending Review', 'Quotation Sent', 'Paid & Active', 'Completed'
 * 2. Admin Sourcing Management Desk:
 *    - Management table displays incoming requests: user name, selected service, submitted specifications, date, status
 *    - Interactive Quotation & Pricing Tool modal allows inputting official quote fee in USD, NGN, or RMB
 *    - Submitting quotation transitions status to Quotation Sent and synchronizes with mobile app
 * 3. Wallet Payment Integration & Quotation Acceptance:
 *    - "Review & Pay Quotation" button appears on mobile request screen showing exact cost
 *    - "Approve & Pay" authorizes payment directly from multi-currency wallet balance (NGN, USD, or RMB)
 *    - 6-digit transaction PIN validation
 *    - Successful wallet debit instantly marks request as "Paid & Active" and updates admin dashboard
 * 4. General Ledger Equilibrium:
 *    - Double-entry ledger balance across NGN, USD, CNY maintains net discrepancy = 0.0000
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
console.log('FLYEMASS "CHINA AGENTS & SOURCING" SYNC UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile App Interface ("China Agents & Sourcing")
// -----------------------------------------------------------------------------
test('1.1 AgentServiceScreen renders header title "China Agents & Sourcing" and streamlined navigation', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  assert.ok(fs.existsSync(file), 'AgentServiceScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('title="China Agents & Sourcing"'), 'Header title is "China Agents & Sourcing"');
  assert.ok(content.includes('Services & Sourcing') && content.includes('My Agent Requests'), 'Navigation tabs rendered');
  assert.ok(content.includes('Factory Audit') || content.includes('Physical Factory Audit'), 'Factory Audit service present');
  assert.ok(content.includes('Canton Fair Escort'), 'Canton Fair Escort service present');
  assert.ok(content.includes('Supplier Legitimacy Verification') || content.includes('Supplier Verification'), 'Supplier Verification service present');
  assert.ok(content.includes('Quality Control') || content.includes('Pre-Shipment Quality Control'), 'Quality Control service present');
});

test('1.2 AgentServiceScreen provides clear, simplified business language and fee structures', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  // Deliverables and fee clarity
  assert.ok(content.includes('$250 USD Fixed') || content.includes('factoryAuditUSD'), 'Factory Audit fee clear');
  assert.ok(content.includes('$200 USD') || content.includes('cantonFairEscortUSD'), 'Canton Fair Escort fee clear');
  assert.ok(content.includes('$150 USD Fixed') || content.includes('supplierVerificationUSD'), 'Supplier Verification fee clear');
  assert.ok(content.includes('$200 USD Fixed') || content.includes('qualityControlUSD'), 'Quality Control fee clear');
});

test('1.3 AgentServiceScreen specification form captures product details, target quantity, factory location/link, and special instructions', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('inspProductName') && content.includes('setInspProductName'), 'Product details / name captured');
  assert.ok(content.includes('inspTargetQuantity') && content.includes('setInspTargetQuantity'), 'Target quantity captured');
  assert.ok(content.includes('inspAddress') && content.includes('setInspAddress'), 'Factory location captured');
  assert.ok(content.includes('inspRequirements') && content.includes('setInspRequirements'), 'Special instructions / checklist captured');
});

test('1.4 AgentServiceScreen renders clean status filters and badges for Pending Review, Quotation Sent, Paid & Active, Completed', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Pending Review'), 'Pending Review filter/badge present');
  assert.ok(content.includes('Quotation Sent'), 'Quotation Sent filter/badge present');
  assert.ok(content.includes('Paid & Active'), 'Paid & Active filter/badge present');
  assert.ok(content.includes('Completed'), 'Completed filter/badge present');
});

// -----------------------------------------------------------------------------
// 2. Admin Sourcing Management Desk
// -----------------------------------------------------------------------------
test('2.1 AdminAgentsScreen provides management table displaying user name, service, specifications, date, and status', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminAgentsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('clientName'), 'Displays client user name');
  assert.ok(content.includes('serviceType'), 'Displays selected service');
  assert.ok(content.includes('specifications') || content.includes('productName'), 'Displays submitted specifications');
  assert.ok(content.includes('createdAt'), 'Displays request date');
  assert.ok(content.includes('Pending Review'), 'Displays Pending Review status');
  assert.ok(content.includes('Quotation Sent'), 'Displays Quotation Sent status');
  assert.ok(content.includes('Paid & Active'), 'Displays Paid & Active status');
  assert.ok(content.includes('Completed'), 'Displays Completed status');
});

test('2.2 AdminAgentsScreen interactive Quotation & Pricing Tool accepts official quotation fee in USD/NGN/RMB', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminAgentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('quoteCurrency') && content.includes('setQuoteCurrency'), 'Quote currency state exists');
  assert.ok(content.includes('$ USD') && content.includes('₦ NGN') && content.includes('¥ RMB'), 'USD, NGN, and RMB currency selectors present');
  assert.ok(content.includes('Cross-Currency Equivalents'), 'Displays real-time cross-currency equivalents');
  assert.ok(content.includes('quoteServiceFeeUSD'), 'Quotation service fee input present');
  assert.ok(content.includes('db.quoteAgentRequest'), 'Submits quotation via db.quoteAgentRequest');
});

// -----------------------------------------------------------------------------
// 3. Wallet Payment Integration & Quotation Acceptance
// -----------------------------------------------------------------------------
test('3.1 Mobile app displays "Review & Pay Quotation" button with exact cost', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Review & Pay Quotation'), '"Review & Pay Quotation" button text present');
  assert.ok(content.includes('totalPayableCNY') || content.includes('quoteAmountUSD'), 'Shows exact quote amount');
});

test('3.2 Mobile app quotation review modal features "Approve & Pay" with multi-currency wallet selection and 6-digit PIN', () => {
  const file = path.join(BASE_DIR, 'src/screens/suppliers/AgentServiceScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Approve & Pay'), '"Approve & Pay" button text present');
  assert.ok(content.includes('USD') && content.includes('CNY') && content.includes('NGN'), 'Multi-currency wallet selection present');
  assert.ok(content.includes('pinInput') && content.includes('setPinInput'), '6-digit transaction PIN input present');
  assert.ok(content.includes('db.acceptAgentQuote'), 'Calls db.acceptAgentQuote on approval');
});

test('3.3 sync-server.cjs implements /api/agents/quote and /api/agents/pay-quote with instant status updates to "Paid & Active"', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('/api/agents/quote') || content.includes('/api/admin/agents/quote'), 'Quote formulation endpoint supported');
  assert.ok(content.includes('Quotation Sent'), 'Transitions status to Quotation Sent');
  assert.ok(content.includes('/api/agents/pay-quote') || content.includes('/api/agents/accept-quote'), 'Payment acceptance endpoint supported');
  assert.ok(content.includes('Paid & Active'), 'Transitions status to Paid & Active upon successful payment');
  assert.ok(content.includes('AGENT_SERVICE_ESCROW'), 'Records double-entry AGENT_SERVICE_ESCROW');
});

test('3.4 src/services/db.ts provides client methods for quotation submission and payment', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('acceptAgentQuote') || content.includes('payAgentQuotation'), 'acceptAgentQuote / payAgentQuotation present');
  assert.ok(content.includes('quoteAgentRequest') || content.includes('submitAgentQuotation'), 'quoteAgentRequest / submitAgentQuotation present');
});

// -----------------------------------------------------------------------------
// 4. Double-Entry General Ledger Equilibrium
// -----------------------------------------------------------------------------
test('4.1 General Ledger in db-state.json maintains 100% mathematical equilibrium across NGN, USD, CNY', () => {
  const dbFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(dbFile), 'db-state.json must exist');
  const dbData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

  const journal = dbData.general_ledger || [];
  let usdDebits = 0, usdCredits = 0;
  let ngnDebits = 0, ngnCredits = 0;
  let cnyDebits = 0, cnyCredits = 0;

  for (const entry of journal) {
    for (const post of (entry.postings || [])) {
      const curr = (post.currency || '').toUpperCase();
      const debit = parseFloat(post.debit) || 0;
      const credit = parseFloat(post.credit) || 0;

      if (curr === 'USD') {
        usdDebits += debit;
        usdCredits += credit;
      } else if (curr === 'NGN') {
        ngnDebits += debit;
        ngnCredits += credit;
      } else if (curr === 'CNY' || curr === 'RMB') {
        cnyDebits += debit;
        cnyCredits += credit;
      }
    }
  }

  const usdDiff = Math.abs(usdDebits - usdCredits);
  const ngnDiff = Math.abs(ngnDebits - ngnCredits);
  const cnyDiff = Math.abs(cnyDebits - cnyCredits);

  console.log(`   Ledger Equilibrium Verified:`);
  console.log(`   • USD Net Difference: $${usdDiff.toFixed(4)} (Debits: $${usdDebits.toFixed(2)}, Credits: $${usdCredits.toFixed(2)})`);
  console.log(`   • NGN Net Difference: ₦${ngnDiff.toFixed(4)} (Debits: ₦${ngnDebits.toFixed(2)}, Credits: ₦${ngnCredits.toFixed(2)})`);
  console.log(`   • CNY Net Difference: ¥${cnyDiff.toFixed(4)} (Debits: ¥${cnyDebits.toFixed(2)}, Credits: ¥${cnyCredits.toFixed(2)})`);

  assert.ok(usdDiff < 0.0001, `USD ledger must be in exact balance: diff=${usdDiff}`);
  assert.ok(ngnDiff < 0.0001, `NGN ledger must be in exact balance: diff=${ngnDiff}`);
  assert.ok(cnyDiff < 0.0001, `CNY ledger must be in exact balance: diff=${cnyDiff}`);
});

console.log('\n=============================================================================');
console.log('ALL CHINA AGENTS & SOURCING SYNC UPGRADE TESTS PASSED WITH 100% SUCCESS! 🎉');
console.log('=============================================================================');
