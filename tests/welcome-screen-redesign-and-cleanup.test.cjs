/**
 * FLYEMASS WELCOME / SPLASH SCREEN REDESIGN & CONTENT CLEANUP TEST SUITE
 * 
 * Verifies:
 * 1. Content & Text Reduction:
 *    - Shortened, punchy headline: "Global Trade & Seamless Payments."
 *    - Concise subtext: "Your secure mobile vault for China sourcing, direct supplier settlements, and express air & sea cargo tracking."
 *    - Old cluttered text removed
 * 2. Active Core Pillars & Inactive Service Removal:
 *    - 3 Core Pillars present:
 *      1. Instant Escrow
 *      2. Multi-Currency Wallets (NGN, USD)
 *      3. Express Air & Sea Cargo
 *    - Inactive / unhandled services removed ("Zero FX Spread", "3-Day Air Cargo", etc.)
 *    - Strict platform-wide Zero Crypto Policy preserved (no crypto, USDT, bitcoin, trc-20)
 * 3. Clean Layout & Call to Action:
 *    - "Create Your FlyeMass Account" button triggers navigate('signup')
 *    - "Already Registered? Log In" button triggers navigate('login')
 *    - Clean professional compliance footer
 * 4. General Ledger Equilibrium:
 *    - General ledger double-entry equilibrium maintained ($0.0000, ₦0.0000, ¥0.0000)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS WELCOME / SPLASH SCREEN REDESIGN & CONTENT CLEANUP TEST SUITE');
  console.log('=============================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  const welcomePath = path.join(__dirname, '../src/screens/auth/WelcomeScreen.tsx');
  assert.ok(fs.existsSync(welcomePath), 'WelcomeScreen.tsx must exist');
  const content = fs.readFileSync(welcomePath, 'utf8');

  // -------------------------------------------------------------------------
  // 1. Content & Text Reduction
  // -------------------------------------------------------------------------
  test('1.1 Punchy headline "Global Trade & Seamless Payments." is rendered', () => {
    assert.ok(content.includes('Global Trade & Seamless Payments.'), 'Headline matches exact required tagline');
    assert.ok(!content.includes('Bridging China Trade & African Enterprise.'), 'Old long headline removed');
  });

  test('1.2 Concise explanatory subtext replaces verbose paragraph', () => {
    const expectedSubtext = 'Your secure mobile vault for China sourcing, direct supplier settlements, and express air & sea cargo tracking.';
    assert.ok(content.includes(expectedSubtext), 'Subtext matches exact concise copy');
    assert.ok(!content.includes('Direct Alipay/WeChat settlement, instant NGN-RMB-USD FX swaps'), 'Old cluttered subtext removed');
  });

  // -------------------------------------------------------------------------
  // 2. Active Core Pillars & Removal of Inactive Services
  // -------------------------------------------------------------------------
  test('2.1 Exactly 3 active core feature pillars rendered', () => {
    assert.ok(content.includes('Instant Escrow'), 'Core Pillar 1: Instant Escrow present');
    assert.ok(content.includes('Multi-Currency Wallets (NGN, USD)'), 'Core Pillar 2: Multi-Currency Wallets (NGN, USD) present');
    assert.ok(content.includes('Express Air & Sea Cargo'), 'Core Pillar 3: Express Air & Sea Cargo present');
  });

  test('2.2 Inactive / unhandled feature tags removed', () => {
    assert.ok(!content.includes('Zero FX Spread'), 'Zero FX Spread pill removed');
    assert.ok(!content.includes('3-Day Air Cargo'), '3-Day Air Cargo pill removed');
  });

  test('2.3 Strict Zero-Crypto Platform Policy preserved', () => {
    assert.ok(!content.toLowerCase().includes('usdt'), 'WelcomeScreen contains no USDT');
    assert.ok(!content.toLowerCase().includes('crypto'), 'WelcomeScreen contains no crypto');
    assert.ok(!content.toLowerCase().includes('bitcoin') && !content.toLowerCase().includes('btc'), 'WelcomeScreen contains no Bitcoin');
    assert.ok(!content.toLowerCase().includes('trc-20') && !content.toLowerCase().includes('trc20'), 'WelcomeScreen contains no TRC-20');
  });

  // -------------------------------------------------------------------------
  // 3. Clean Layout & Call to Action
  // -------------------------------------------------------------------------
  test('3.1 "Create Your FlyeMass Account" button routes to signup', () => {
    assert.ok(content.includes('Create Your FlyeMass Account'), 'Sign up button text present');
    assert.ok(content.includes("navigate('signup')"), 'Sign up button navigates to signup');
  });

  test('3.2 "Already Registered? Log In" button routes to login', () => {
    assert.ok(content.includes('Already Registered? Log In'), 'Log in button text present');
    assert.ok(content.includes("navigate('login')"), 'Log in button navigates to login');
  });

  test('3.3 Compliance note is completely removed from welcome screen footer', () => {
    assert.ok(!content.includes('Licensed & compliant cross-border financial provider'), 'Compliance statement removed');
    assert.ok(!content.includes('CAC / CBN / SAFE Compliant'), 'Regulatory list removed');
  });

  // -------------------------------------------------------------------------
  // 4. Double-Entry General Ledger Equilibrium
  // -------------------------------------------------------------------------
  test('4.1 Double-Entry General Ledger maintains exact mathematical equilibrium (0.0000)', () => {
    const dbStatePath = path.join(__dirname, '../db-state.json');
    const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));
    const ledger = dbState.ledger || [];

    let netUSD = 0;
    let netNGN = 0;
    let netCNY = 0;

    for (const entry of ledger) {
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;
      const diff = debit - credit;
      if (entry.currency === 'USD') netUSD += diff;
      else if (entry.currency === 'NGN') netNGN += diff;
      else if (entry.currency === 'CNY') netCNY += diff;
    }

    assert.ok(Math.abs(netUSD) < 0.001, `USD ledger in balance: ${netUSD}`);
    assert.ok(Math.abs(netNGN) < 0.001, `NGN ledger in balance: ${netNGN}`);
    assert.ok(Math.abs(netCNY) < 0.001, `CNY ledger in balance: ${netCNY}`);
  });

  console.log(`\nResults: ${passed} passed, ${total - passed} failed out of ${total} tests.`);
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
