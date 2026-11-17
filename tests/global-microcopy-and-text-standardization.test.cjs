/**
 * FLYEMASS GLOBAL MICROCOPY & TEXT STANDARDIZATION TEST SUITE
 * 
 * Verifies enterprise-grade English microcopy across all mobile screens:
 * 1. Home / Dashboard:
 *    - Header greeting with verified tier status ("Tier 3 Verified Exporter")
 *    - Crisp multi-currency balance vault labels (NGN, USD, CNY)
 *    - Streamlined instant action matrix ("Fund", "Pay Supplier", "FX Swap", "Withdraw")
 *    - Active tracking status descriptions and waypoint progress
 * 2. Wallets & Funding:
 *    - Automated NGN payment gateway copy (Providus dedicated virtual account, Korapay checkout)
 *    - Exclusively manual USD bank wire transfer with receipt upload copy
 *    - Certified account statement export copy
 * 3. Logistics & Shipping:
 *    - Concise waybill tracking search prompt
 *    - Standardized shipping mark instructions ("MARK ON ALL CARTONS / WAYBILLS")
 *    - Action deck ("Register a Shipment", "Track a Shipment")
 *    - Rate calculator labels (corridors, weight, CBM, estimated cost)
 * 4. Shop & Checkout (Apple, Google Pixel, Samsung):
 *    - Standardized header title: "Apple & Tech Store • Hong Kong Hub"
 *    - Multi-brand catalog selector ("All Brands", "Apple", "Google Pixel", "Samsung")
 *    - Clean variant labels (Storage, Color, Condition)
 *    - Straightforward "Add to Cart" and "Checkout via Wallet" / "Buy Now via Wallet" actions
 *    - Clean empty cart state with helpful call to action
 * 5. Supplier Directory:
 *    - Professional business directory headings ("VIP Supplier Directory", "VIP Factory Catalog")
 *    - VIP subscription status notes
 *    - Permanent safety notice banner ("Negotiate freely, but ALWAYS notify FlyeMass Support...")
 * 6. Profile & Settings:
 *    - Standardized security titles ("Security Settings & PIN", "Device Migration & Biometrics")
 *    - Concierge & trade support desks ("FlyeMass Live Concierge", "Support Tickets Desk", "Help Center & Trade FAQs")
 *    - Compliance & governance ("Terms of Trade Service", "Privacy Policy & NDPR", "Account Deletion Request")
 * 7. General Ledger Double-Entry Equilibrium & Zero Crypto Policy
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS GLOBAL MICROCOPY & TEXT STANDARDIZATION TEST SUITE');
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

  // -------------------------------------------------------------------------
  // 1. Home / Dashboard
  // -------------------------------------------------------------------------
  test('1.1 Home screen displays verified tier badge, vault labels, and streamlined quick actions', () => {
    const homeContent = fs.readFileSync(path.join(__dirname, '../src/screens/home/HomeScreen.tsx'), 'utf8');
    const headerContent = fs.readFileSync(path.join(__dirname, '../src/components/layout/Header.tsx'), 'utf8');

    assert.ok(headerContent.includes('Tier 3 Verified Exporter'), 'Header displays Tier 3 status');
    assert.ok(homeContent.includes('Multi-Currency Vaults'), 'Vault section title present');
    assert.ok(homeContent.includes('Instant Actions'), 'Actions section title present');
    assert.ok(homeContent.includes("action.fund") || homeContent.includes("title: 'Fund'"), 'Fund quick action present');
    assert.ok(homeContent.includes("action.pay_supplier") || homeContent.includes("title: 'Pay Supplier'"), 'Pay Supplier quick action present');
    assert.ok(homeContent.includes("action.fx_swap") || homeContent.includes("title: 'FX Swap'"), 'FX Swap quick action present');
    assert.ok(homeContent.includes("action.withdraw") || homeContent.includes("title: 'Withdraw'"), 'Withdraw quick action present');
    assert.ok(homeContent.includes('Active Air / Sea Cargo'), 'Cargo tracking section title present');
    assert.ok(homeContent.includes('Recent Activity'), 'Recent activity section title present');
  });

  // -------------------------------------------------------------------------
  // 2. Wallets & Funding
  // -------------------------------------------------------------------------
  test('2.1 Wallets & FundWallet screens present enterprise-grade funding microcopy', () => {
    const fundContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/FundWalletScreen.tsx'), 'utf8');
    const walletContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/WalletsScreen.tsx'), 'utf8');

    assert.ok(walletContent.includes('Nigerian Naira Wallet'), 'Naira wallet title present');
    assert.ok(walletContent.includes('Chinese Yuan Wallet'), 'Yuan wallet title present');
    assert.ok(walletContent.includes('United States Dollar Wallet'), 'USD wallet title present');

    assert.ok(fundContent.includes('Automated NGN Payment Gateway'), 'NGN automated gateway heading present');
    assert.ok(fundContent.includes('Providus Bank Virtual Account'), 'Providus channel title present');
    assert.ok(fundContent.includes('Korapay Checkout'), 'Korapay channel title present');

    assert.ok(fundContent.includes('Corporate USD Wire Account Details'), 'USD wire heading present');
    assert.ok(fundContent.includes('JPMorgan Chase Bank, N.A. (New York)'), 'USD beneficiary bank details present');
    assert.ok(fundContent.includes('Upload Bank Transfer Receipt'), 'Receipt upload prompt present');
  });

  // -------------------------------------------------------------------------
  // 3. Logistics & Shipping
  // -------------------------------------------------------------------------
  test('3.1 Logistics screen presents clear waybill search, shipping mark, and rate calculator labels', () => {
    const logContent = fs.readFileSync(path.join(__dirname, '../src/screens/logistics/LogisticsScreen.tsx'), 'utf8');

    assert.ok(logContent.includes('placeholder="Track any shipment code, waybill, or SF tracking..."'), 'Waybill search placeholder present');
    assert.ok(logContent.includes('Register a Shipment'), 'Register shipment card title present');
    assert.ok(logContent.includes('Track a Shipment'), 'Track shipment card title present');
    assert.ok(logContent.toUpperCase().includes('YOUR PERSONAL SHIPPING MARK'), 'Shipping mark card header present');
    assert.ok(logContent.includes('OFFICIAL CARRIER & CARTON MARKING:') || logContent.includes('MARK ON ALL CARTONS'), 'Shipping mark instruction present');
    assert.ok(logContent.includes('Air Express (CAN ➔ LOS)'), 'Freight status ribbon present');
  });

  // -------------------------------------------------------------------------
  // 4. Shop & Checkout
  // -------------------------------------------------------------------------
  test('4.1 Shop and Checkout screens standardize product specs, multi-brand tabs, and actions', () => {
    const shopContent = fs.readFileSync(path.join(__dirname, '../src/screens/shop/ShopScreen.tsx'), 'utf8');
    const cartContent = fs.readFileSync(path.join(__dirname, '../src/screens/shop/CartScreen.tsx'), 'utf8');
    const checkoutContent = fs.readFileSync(path.join(__dirname, '../src/screens/shop/CheckoutScreen.tsx'), 'utf8');
    const headerContent = fs.readFileSync(path.join(__dirname, '../src/components/layout/Header.tsx'), 'utf8');

    assert.ok(headerContent.includes("'shop': 'Apple & Tech Store'"), 'Route title for shop standardized');
    assert.ok(shopContent.includes('Apple & Tech Store • Hong Kong Hub'), 'Shop header title present');
    assert.ok(shopContent.includes("'All Brands', 'Apple', 'Google Pixel', 'Samsung'"), 'Brand tabs present');
    assert.ok(cartContent.includes('Your Cart is Empty'), 'Empty cart heading present');
    assert.ok(cartContent.includes('Explore Tech Catalog'), 'Empty cart CTA button present');
    assert.ok(checkoutContent.includes('Step 3: Select Payment Wallet'), 'Checkout wallet step present');
    assert.ok(checkoutContent.includes('Authorize Payment with 6-Digit PIN'), '6-digit PIN checkout button label present');
  });

  // -------------------------------------------------------------------------
  // 5. Supplier Directory
  // -------------------------------------------------------------------------
  test('5.1 Supplier Directory presents professional business headings and safety notice', () => {
    const supContent = fs.readFileSync(path.join(__dirname, '../src/screens/suppliers/SuppliersScreen.tsx'), 'utf8');

    assert.ok(supContent.includes('VIP Supplier Directory'), 'Directory screen title present');
    assert.ok(supContent.includes('Vetted Guangdong & Yiwu Factories'), 'Hero heading present');
    assert.ok(supContent.includes('⚠️ Safety Notice'), 'Safety notice title present');
    assert.ok(supContent.includes('Negotiate freely, but ALWAYS notify Flyemass Support'), 'Safety notice text present');
  });

  // -------------------------------------------------------------------------
  // 6. Profile & Settings
  // -------------------------------------------------------------------------
  test('6.1 Profile & Settings screen presents standardized security, concierge, and legal items', () => {
    const profContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
    const supContent = fs.readFileSync(path.join(__dirname, '../src/screens/profile/SupportScreen.tsx'), 'utf8');

    assert.ok(profContent.includes('Security Settings & PIN'), 'Security item present');
    assert.ok(profContent.includes('Device Migration & Biometrics'), 'Device migration item present');
    assert.ok(!profContent.includes('KYC & Trade Compliance'), 'KYC item completely removed');
    assert.ok(profContent.includes('FlyeMass Live Concierge'), 'Concierge item present');
    assert.ok(profContent.includes('Support Tickets Desk'), 'Support tickets item present');
    assert.ok(profContent.includes('Help Center & Trade FAQs'), 'Help center item present');
    assert.ok(profContent.includes('Terms of Trade Service'), 'Terms item present');
    assert.ok(profContent.includes('Privacy Policy & NDPR'), 'Privacy item present');
    assert.ok(profContent.includes('Account Deletion Request'), 'Deletion request item present');
    assert.ok(supContent.includes('FlyeMass 24/7 Trade Desk'), 'Support desk title present');
  });

  // -------------------------------------------------------------------------
  // 7. General Ledger Equilibrium & Zero-Crypto Compliance
  // -------------------------------------------------------------------------
  test('7.1 Strict Zero-Crypto Platform Policy preserved across core screens', () => {
    const homeContent = fs.readFileSync(path.join(__dirname, '../src/screens/home/HomeScreen.tsx'), 'utf8');
    const walletContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/WalletsScreen.tsx'), 'utf8');
    const fundContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/FundWalletScreen.tsx'), 'utf8');
    const payContent = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/PaySupplierScreen.tsx'), 'utf8');

    for (const [name, content] of Object.entries({ home: homeContent, wallet: walletContent, fund: fundContent, pay: payContent })) {
      assert.ok(!content.toLowerCase().includes('usdt'), `${name} contains no USDT`);
      assert.ok(!content.toLowerCase().includes('bitcoin') && !content.toLowerCase().includes('btc'), `${name} contains no Bitcoin`);
      assert.ok(!content.toLowerCase().includes('trc-20') && !content.toLowerCase().includes('trc20'), `${name} contains no TRC-20`);
    }
  });

  test('7.2 Double-Entry General Ledger maintains exact mathematical equilibrium (0.0000)', () => {
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
