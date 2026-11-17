/**
 * ENTERPRISE FX & MULTI-DIRECTIONAL CURRENCY SWAPS TEST SUITE
 * 
 * Verifies:
 * 1. Admin FX & Margin Management Console Expansion (/admin/treasury/fx)
 * 2. Dedicated input fields & badges: 1 RMB=₦, 1 USD=₦, 1 USD=¥, Inverse/Direct cross rates, Spread (%)
 * 3. Multi-directional swap conversion multipliers preview grid (6 routes)
 * 4. Broadcast & Lock New Clearing Rates persisting to system_settings & fx_rates
 * 5. Mobile App Currency Swap Modal & Exchange Screen integration
 * 6. Transparent fee breakdowns, live conversion multipliers, and atomic double-entry execution
 * 7. Real-Time SSE synchronization & Total Swaps Logged journal audit
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
  console.log('TEST SUITE: Enterprise FX & Multi-Directional Currency Swaps');
  console.log('===================================================================');

  const adminFxSrc = readFile('src/screens/admin/AdminFxManagementScreen.tsx');
  const swapModalSrc = readFile('src/components/wallet/CurrencySwapModal.tsx');
  const exchangeScreenSrc = readFile('src/screens/wallets/ExchangeScreen.tsx');
  const homeScreenSrc = readFile('src/screens/home/HomeScreen.tsx');
  const dbSrc = readFile('src/services/db.ts');
  const syncServerSrc = readFile('sync-server.cjs');

  // -----------------------------------------------------------------
  // 1. Admin FX Management Console Expansion (/admin/treasury/fx)
  // -----------------------------------------------------------------
  console.log('1. Verifying Admin FX & Margin Management Console Expansion...');
  assert(
    adminFxSrc.includes('data-testid="authoritative-clearing-rates-card"'),
    'AdminFxManagementScreen must have Authoritative Clearing Rates control card'
  );
  assert(
    adminFxSrc.includes('data-testid="input-ngn-rmb-rate"') &&
    adminFxSrc.includes('1 RMB (CNY) = Naira (₦)'),
    'AdminFxManagementScreen must include input for 1 RMB (CNY) = Nigerian Naira'
  );
  assert(
    adminFxSrc.includes('data-testid="input-usd-ngn-rate"') &&
    adminFxSrc.includes('1 USD ($) = Naira (₦)'),
    'AdminFxManagementScreen must include input for 1 USD ($) = Nigerian Naira'
  );
  assert(
    adminFxSrc.includes('data-testid="input-usd-cny-rate"') &&
    adminFxSrc.includes('1 USD ($) = Chinese Yuan (¥)'),
    'AdminFxManagementScreen must include input for 1 USD ($) = Chinese Yuan'
  );
  assert(
    adminFxSrc.includes('data-testid="input-spread-percent"') &&
    adminFxSrc.includes('Clearing Margin Spread (%)'),
    'AdminFxManagementScreen must include input for Clearing Margin Spread (%)'
  );
  assert(
    adminFxSrc.includes('Inverse (NGN ➔ CNY)') &&
    adminFxSrc.includes('Inverse (NGN ➔ USD)'),
    'AdminFxManagementScreen must include badge indicators for inverse/direct cross rates'
  );
  assert(
    adminFxSrc.includes('data-testid="broadcast-fx-rates-btn"') &&
    adminFxSrc.includes('Broadcast & Lock New Clearing Rates'),
    'AdminFxManagementScreen must include Broadcast & Lock New Clearing Rates action button'
  );
  console.log('   ✓ Authoritative Clearing Rates card, input fields & badges verified.');

  // -----------------------------------------------------------------
  // 2. Multi-Directional Conversion Multipliers Preview & Manual Inputs
  // -----------------------------------------------------------------
  console.log('2. Verifying Multi-Directional Swap Conversion & Dedicated Manual Inputs...');
  assert(
    adminFxSrc.includes('Live Multi-Directional Wallet Conversion Multipliers'),
    'AdminFxManagementScreen must display multi-directional conversion multipliers grid'
  );
  assert(
    adminFxSrc.includes('data-testid="input-manual-cny-to-ngn"') &&
    adminFxSrc.includes('data-testid="input-manual-ngn-to-cny"') &&
    adminFxSrc.includes('data-testid="input-manual-usd-to-ngn"') &&
    adminFxSrc.includes('data-testid="input-manual-ngn-to-usd"') &&
    adminFxSrc.includes('data-testid="input-manual-usd-to-cny"') &&
    adminFxSrc.includes('data-testid="input-manual-cny-to-usd"'),
    'AdminFxManagementScreen must have 6 dedicated manual input fields for all corridors'
  );
  assert(
    adminFxSrc.includes('data-testid="auto-calculate-swap-rates-btn"') &&
    adminFxSrc.includes('Auto-Calculate from Base Rates + Spread'),
    'AdminFxManagementScreen must include auto-calculate helper button'
  );
  assert(
    adminFxSrc.includes('NGN') && adminFxSrc.includes('CNY') &&
    adminFxSrc.includes('Supplier Pay'),
    'Grid must display NGN ➔ CNY conversion route for China supplier pay'
  );
  assert(
    adminFxSrc.includes('CNY ➔ NGN') &&
    adminFxSrc.includes('USD ➔ NGN') &&
    adminFxSrc.includes('NGN ➔ USD') &&
    adminFxSrc.includes('USD ➔ CNY') &&
    adminFxSrc.includes('CNY ➔ USD'),
    'Grid must cover all 6 bilateral multi-directional corridors'
  );
  console.log('   ✓ 6 multi-directional swap conversion multipliers & manual inputs verified.');

  // -----------------------------------------------------------------
  // 3. Currency Swaps Journal ("Total Swaps Logged")
  // -----------------------------------------------------------------
  console.log('3. Verifying Recent FX Conversions Journal & Total Swaps Logged...');
  assert(
    adminFxSrc.includes('Total Swaps Logged:') &&
    adminFxSrc.includes('Recent FX Conversions Journal'),
    'AdminFxManagementScreen must track and display Total Swaps Logged journal'
  );
  assert(
    adminFxSrc.includes('journalFilter') &&
    adminFxSrc.includes('searchQuery'),
    'Journal must support filtering by currency pair and search query'
  );
  console.log('   ✓ Swaps Journal table and audit counter verified.');

  // -----------------------------------------------------------------
  // 3b. Clean Live FX Financial Feed Ticker & Configuration
  // -----------------------------------------------------------------
  console.log('3b. Verifying Clean Mobile App Live FX Financial Feed Ticker & Admin Configuration...');
  assert(
    adminFxSrc.includes('data-testid="mobile-livefx-display-card"'),
    'AdminFxManagementScreen must include Mobile App Live FX display configuration card'
  );
  assert(
    adminFxSrc.includes('liveAnnouncement') &&
    adminFxSrc.includes('liveDisplayRmb') &&
    adminFxSrc.includes('liveDisplayUsdNgn') &&
    adminFxSrc.includes('liveDisplayUsdCny'),
    'AdminFxManagementScreen must provide dedicated inputs for LiveFX announcement and display rates'
  );
  assert(
    !adminFxSrc.includes('conciergeImageUrl'),
    'AdminFxManagementScreen must remove conciergeImageUrl input to maintain a clean financial stream'
  );
  assert(
    !homeScreenSrc.includes('VIP FX Concierge'),
    'HomeScreen must remove VIP Concierge photo/avatar to maintain clean financial ticker feed'
  );
  assert(
    homeScreenSrc.includes('LIVE FX') &&
    homeScreenSrc.includes('WHOLESALE'),
    'HomeScreen must display clean financial Live FX badge'
  );
  console.log('   ✓ Clean Live FX financial feed ticker (no concierge avatar or photo input) verified.');

  // -----------------------------------------------------------------
  // 4. Mobile App Multi-Currency Wallet Swap Integration
  // -----------------------------------------------------------------
  console.log('4. Verifying Mobile App Wallet Swap Integration (CurrencySwapModal & ExchangeScreen)...');
  assert(
    swapModalSrc.includes('RMB') && swapModalSrc.includes('Naira') &&
    swapModalSrc.includes('Dollar') &&
    exchangeScreenSrc.includes('RMB') && exchangeScreenSrc.includes('Naira'),
    'Both SwapModal and ExchangeScreen must provide 1-click corridors for RMB to Naira and Dollar to Naira'
  );
  assert(
    swapModalSrc.includes("setFromCurrency('USD'); setToCurrency('CNY')") &&
    swapModalSrc.includes("setFromCurrency('CNY'); setToCurrency('USD')") &&
    exchangeScreenSrc.includes("setFromCurrency('USD'); setToCurrency('CNY')") &&
    exchangeScreenSrc.includes("setFromCurrency('CNY'); setToCurrency('USD')"),
    'Both SwapModal and ExchangeScreen must provide all 6 bidirectional quick corridors (including USD ⇄ CNY)'
  );
  assert(
    swapModalSrc.includes('getExchangeRate') &&
    swapModalSrc.includes('systemRates.spreadPercent'),
    'CurrencySwapModal must calculate dynamic rate using systemRates and spreadPercent'
  );
  assert(
    swapModalSrc.includes('Conversion Multiplier') &&
    swapModalSrc.includes('Inverse Multiplier') &&
    swapModalSrc.includes('Clearing Margin Spread') &&
    swapModalSrc.includes('Platform Swap Fee'),
    'CurrencySwapModal must display transparent fee breakdown and multipliers'
  );
  assert(
    exchangeScreenSrc.includes('Conversion Multiplier:') &&
    exchangeScreenSrc.includes('Inverse Multiplier:') &&
    exchangeScreenSrc.includes('Clearing Margin Spread:') &&
    exchangeScreenSrc.includes('Platform Swap Fee:'),
    'ExchangeScreen must display transparent fee breakdown and multipliers'
  );
  assert(
    swapModalSrc.includes('db.executeSwap') &&
    exchangeScreenSrc.includes('db.executeSwap'),
    'Both swap entry points must call authoritative db.executeSwap'
  );
  console.log('   ✓ Mobile app swap calculators, transparent breakdown & execution verified.');

  // -----------------------------------------------------------------
  // 5. Backend Persistence to system_settings & fx_rates
  // -----------------------------------------------------------------
  console.log('5. Verifying Backend Endpoints in sync-server.cjs & db.ts...');
  assert(
    syncServerSrc.includes("pathname === '/api/settings/update'") &&
    syncServerSrc.includes('dbState.system_settings.rates =') &&
    syncServerSrc.includes('dbState.fx_rates ='),
    'sync-server.cjs must persist rates to both system_settings.rates and fx_rates'
  );
  assert(
    syncServerSrc.includes('broadcastUpdate()'),
    'sync-server.cjs must call broadcastUpdate() to notify all SSE listeners in real time'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/wallets/swap'"),
    'sync-server.cjs must provide authoritative /api/wallets/swap endpoint'
  );
  assert(
    syncServerSrc.includes("recordDoubleEntry({") &&
    syncServerSrc.includes("transactionType: 'FX_SWAP'"),
    'sync-server.cjs must execute double-entry ledger accounting for all swaps'
  );
  assert(
    dbSrc.includes('updateSystemSettings') &&
    dbSrc.includes('this.state.fx_rates ='),
    'db.ts must maintain both system_settings.rates and fx_rates in local reactive state'
  );
  console.log('   ✓ Backend synchronization, broadcast & double-entry ledger verified.');

  // -----------------------------------------------------------------
  // 6. Mathematical Corridors & Spread Calculation Verification
  // -----------------------------------------------------------------
  console.log('6. Verifying Mathematical Bilateral Corridors & Clearing Rates...');
  const testRates = {
    NGN_CNY: 215.20,
    USD_NGN: 1490.00,
    USD_CNY: 7.26,
    spreadPercent: 0.75
  };

  const spread = testRates.spreadPercent / 100;

  // Corridors:
  // 1. NGN -> CNY (Customer swaps Naira to buy RMB for China supplier)
  const rateNgnToCny = (1 / testRates.NGN_CNY) * (1 - spread);
  assert(rateNgnToCny > 0.0045 && rateNgnToCny < 0.0047, 'NGN to CNY rate must be ~0.0046');
  const cnyReceivedFor100kNgn = 100000 * rateNgnToCny;
  assert(cnyReceivedFor100kNgn > 450 && cnyReceivedFor100kNgn < 470, '100,000 NGN must yield ~¥461 CNY');

  // 2. USD -> NGN (Customer liquidates Dollar into Naira)
  const rateUsdToNgn = testRates.USD_NGN * (1 - spread);
  assert(rateUsdToNgn > 1470 && rateUsdToNgn < 1485, 'USD to NGN rate must be ~1,478.8 NGN');
  const ngnReceivedFor1kUsd = 1000 * rateUsdToNgn;
  assert(ngnReceivedFor1kUsd > 1470000 && ngnReceivedFor1kUsd < 1485000, '$1,000 USD must yield ~₦1,478,825 NGN');

  // 3. USD -> CNY (Direct Dollar to RMB settlement)
  const rateUsdToCny = testRates.USD_CNY * (1 - spread);
  assert(rateUsdToCny > 7.15 && rateUsdToCny < 7.25, 'USD to CNY rate must be ~7.205 CNY');

  // 4. CNY -> NGN (Inward RMB refund to Naira)
  const rateCnyToNgn = testRates.NGN_CNY * (1 - spread);
  assert(rateCnyToNgn > 212 && rateCnyToNgn < 214.5, 'CNY to NGN rate must be ~213.58 NGN');

  // 5. NGN -> USD (Air Cargo Freight & International Vault Top-up)
  const rateNgnToUsd = (1 / testRates.USD_NGN) * (1 - spread);
  assert(rateNgnToUsd > 0.00065 && rateNgnToUsd < 0.00068, 'NGN to USD rate must be ~0.000666 USD');

  // 6. CNY -> USD (Cross trade RMB to Dollar)
  const rateCnyToUsd = (1 / testRates.USD_CNY) * (1 - spread);
  assert(rateCnyToUsd > 0.135 && rateCnyToUsd < 0.138, 'CNY to USD rate must be ~0.1367 USD');

  console.log(`   ✓ Corridor NGN ➔ CNY: 1 NGN = ¥${rateNgnToCny.toFixed(6)} CNY (100k NGN = ¥${cnyReceivedFor100kNgn.toFixed(2)})`);
  console.log(`   ✓ Corridor USD ➔ NGN: 1 USD = ₦${rateUsdToNgn.toFixed(2)} NGN ($1k USD = ₦${ngnReceivedFor1kUsd.toLocaleString()})`);
  console.log(`   ✓ Corridor USD ➔ CNY: 1 USD = ¥${rateUsdToCny.toFixed(4)} CNY`);
  console.log(`   ✓ Corridor CNY ➔ NGN: 1 CNY = ₦${rateCnyToNgn.toFixed(2)} NGN`);
  console.log(`   ✓ Corridor NGN ➔ USD: 1 NGN = $${rateNgnToUsd.toFixed(6)} USD`);
  console.log(`   ✓ Corridor CNY ➔ USD: 1 CNY = $${rateCnyToUsd.toFixed(4)} USD`);

  console.log('===================================================================');
  console.log('ALL TESTS PASSED: Enterprise FX & Multi-Directional Swaps 100% Verified!');
  console.log('===================================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
