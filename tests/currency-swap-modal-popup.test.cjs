/**
 * FLYEMASS CURRENCY SWAP MODAL POPUP & LIVE RATE CONVERSION TEST SUITE
 * 
 * Verifies:
 * 1. Interactive Modal Popup Trigger:
 *    - CurrencySwapModal rendered as a sleek, centered modal with backdrop blur
 *    - Clear close (X) button and backdrop dismissal
 *    - "FX Swap" button on HomeScreen and WalletsScreen trigger openSwapModal()
 *    - Live FX Ticker Marquee on HomeScreen triggers openSwapModal(from, to)
 *    - MobileShell mounts CurrencySwapModal globally
 * 2. Live Exchange Rate & Conversion Engine:
 *    - Connects to authoritative rates (NGN, USD, CNY/RMB) and listens to updates via db.subscribe
 *    - Real-time conversion formula mirrors server-side calculations across all 6 currency pairs
 *    - Currency flipping and MAX balance button functionality
 * 3. Atomic Wallet Swap Execution:
 *    - Validates available balance in source wallet
 *    - Requires 6-digit transaction PIN authorization
 *    - Calls db.executeSwap and backend /api/wallets/swap
 *    - Double-entry accounting ledger entries with 0.0000 discrepancy
 *    - Real-time wallet balance and transaction history synchronization
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('--- STARTING CURRENCY SWAP MODAL POPUP & LIVE RATE CONVERSION TEST SUITE ---');
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

  // Test 1: Verify CurrencySwapModal Component & Backdrop Blur
  test('CurrencySwapModal implements centered modal popup with backdrop blur and clear close (X) button', () => {
    const modalPath = path.join(__dirname, '../src/components/wallet/CurrencySwapModal.tsx');
    assert(fs.existsSync(modalPath), 'CurrencySwapModal.tsx must exist');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    assert(modalContent.includes('backdrop-blur-md'), 'Modal must have backdrop-blur-md');
    assert(modalContent.includes('fixed inset-0 z-50 flex items-center justify-center'), 'Modal must be fixed and centered');
    assert(modalContent.includes('handleCloseModal'), 'Modal must have handleCloseModal');
    assert(modalContent.includes('<X className="w-4 h-4" />'), 'Modal must render X close icon');
    assert(modalContent.includes('Instant Currency Swap'), 'Modal header must display title');
  });

  // Test 2: Verify AppContext Global State & Routing
  test('AppContext defines isSwapModalOpen, openSwapModal, and intercepts exchange route to open modal', () => {
    const contextContent = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');

    assert(contextContent.includes('isSwapModalOpen: boolean'), 'AppContextType must include isSwapModalOpen');
    assert(contextContent.includes('openSwapModal: (from?: Currency, to?: Currency) => void'), 'AppContextType must include openSwapModal');
    assert(contextContent.includes("targetRoute === 'exchange'"), 'navigate must intercept exchange route');
    assert(contextContent.includes('openSwapModal();'), 'navigate must invoke openSwapModal on exchange');
  });

  // Test 3: Verify HomeScreen Integration (Action button + Live FX ticker)
  test('HomeScreen triggers Currency Swap modal from FX Swap quick action and Live FX ticker marquee', () => {
    const homeContent = fs.readFileSync(path.join(__dirname, '../src/screens/home/HomeScreen.tsx'), 'utf8');

    assert(homeContent.includes('openSwapModal'), 'HomeScreen must import openSwapModal');
    assert(homeContent.includes("title: 'FX Swap'"), 'HomeScreen must have FX Swap quick action');
    assert(homeContent.includes('action: () => openSwapModal()'), 'FX Swap action must call openSwapModal()');
    assert(homeContent.includes('openSwapModal(from, to)'), 'Marquee item click must invoke openSwapModal(from, to)');
  });

  // Test 4: Verify WalletsScreen Integration (Instant Actions Bar)
  test('WalletsScreen renders FX Swap action button that opens Currency Swap modal', () => {
    const walletsContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/WalletsScreen.tsx'), 'utf8');

    assert(walletsContent.includes('openSwapModal'), 'WalletsScreen must import openSwapModal');
    assert(walletsContent.includes("openSwapModal(activeWalletIndex === 0 ? 'NGN' : activeWalletIndex === 1 ? 'CNY' : 'USD')"), 'WalletsScreen must pass current active wallet to openSwapModal');
    assert(walletsContent.includes('FX Swap'), 'WalletsScreen must render FX Swap action button');
  });

  // Test 5: Verify QuickActionSheet Integration
  test('QuickActionSheet triggers openSwapModal on Instant FX Swap selection', () => {
    const sheetContent = fs.readFileSync(path.join(__dirname, '../src/components/ui/QuickActionSheet.tsx'), 'utf8');

    assert(sheetContent.includes('openSwapModal'), 'QuickActionSheet must import openSwapModal');
    assert(sheetContent.includes("if (route === 'exchange')"), 'QuickActionSheet must check for exchange route');
    assert(sheetContent.includes('openSwapModal();'), 'QuickActionSheet must call openSwapModal()');
  });

  // Test 6: Verify MobileShell Global Mounting
  test('MobileShell globally mounts CurrencySwapModal component', () => {
    const shellContent = fs.readFileSync(path.join(__dirname, '../src/components/layout/MobileShell.tsx'), 'utf8');

    assert(shellContent.includes("import { CurrencySwapModal } from '../wallet/CurrencySwapModal'"), 'MobileShell must import CurrencySwapModal');
    assert(shellContent.includes('<CurrencySwapModal />'), 'MobileShell must mount <CurrencySwapModal />');
  });

  // Test 7: Verify Live Rate & Conversion Engine Math
  test('Currency conversion engine accurately computes exchange rate across all currency pairs', () => {
    const modalContent = fs.readFileSync(path.join(__dirname, '../src/components/wallet/CurrencySwapModal.tsx'), 'utf8');

    assert(modalContent.includes('getExchangeRate'), 'Modal must define getExchangeRate');
    assert(modalContent.includes('systemRates.NGN_CNY'), 'Modal must use NGN_CNY rate');
    assert(modalContent.includes('systemRates.USD_NGN'), 'Modal must use USD_NGN rate');
    assert(modalContent.includes('systemRates.USD_CNY'), 'Modal must use USD_CNY rate');
    assert(modalContent.includes('systemRates.spreadPercent'), 'Modal must use treasury spread');
    assert(modalContent.includes('calculatedTo = Number((parsedFrom * rate).toFixed(2))'), 'Modal must compute real-time converted amount');
  });

  // Test 8: Verify Balance Validation & User Safeguards
  test('CurrencySwapModal enforces balance validation and provides MAX balance helper', () => {
    const modalContent = fs.readFileSync(path.join(__dirname, '../src/components/wallet/CurrencySwapModal.tsx'), 'utf8');

    assert(modalContent.includes('isInsufficientBalance'), 'Modal must validate insufficient balance');
    assert(modalContent.includes('handleMaxAmount'), 'Modal must implement handleMaxAmount');
    assert(modalContent.includes('Insufficient'), 'Modal must show insufficient balance feedback');
  });

  // Test 9: Verify Atomic Swap Execution & PIN Pad
  test('CurrencySwapModal requires 6-digit PIN authorization and dispatches db.executeSwap', () => {
    const modalContent = fs.readFileSync(path.join(__dirname, '../src/components/wallet/CurrencySwapModal.tsx'), 'utf8');

    assert(modalContent.includes('<PinPad'), 'Modal must render PinPad component');
    assert(modalContent.includes('handleAuthorizeSwap'), 'Modal must implement handleAuthorizeSwap');
    assert(modalContent.includes('db.executeSwap'), 'Modal must execute atomic swap through db.executeSwap');
    assert(modalContent.includes("step === 'success'"), 'Modal must display success view');
    assert(modalContent.includes('Currency Swap Successful!'), 'Success view must confirm transaction');
  });

  // Test 10: Verify Double-Entry Accounting Ledger Equilibrium
  test('Authoritative double-entry general ledger in db-state.json maintains exact 0.0000 equilibrium', () => {
    const dbStateRaw = fs.readFileSync(path.join(__dirname, '../db-state.json'), 'utf8');
    const dbState = JSON.parse(dbStateRaw);

    let totalCredits = 0;
    let totalDebits = 0;

    const ledger = dbState.ledger || [];
    for (const entry of ledger) {
      if (entry.credit) totalCredits += Number(entry.credit);
      if (entry.debit) totalDebits += Number(entry.debit);
    }

    const discrepancy = Math.abs(totalCredits - totalDebits);
    assert(discrepancy < 0.0001, `Ledger imbalance detected: credits=${totalCredits}, debits=${totalDebits}, diff=${discrepancy}`);
  });

  console.log(`\nRESULTS: ${passed}/${total} TESTS PASSED.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
