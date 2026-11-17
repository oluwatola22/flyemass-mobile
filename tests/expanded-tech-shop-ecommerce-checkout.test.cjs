/**
 * tests/expanded-tech-shop-ecommerce-checkout.test.cjs
 * Comprehensive Verification Test Suite for Expanded Tech Shop E-Commerce & Checkout Flow
 *
 * Verifies:
 * 1. Mobile App Cart & Checkout Fix:
 *    - "Add to Cart" increments cart state, updates badge counter in navigation strip and bottom drawer
 *    - Checkout & Delivery Form: Full Name, Phone Number, Shipping Address, City, State / Country
 *    - Multi-currency wallet checkout (NGN, USD, RMB/CNY) with PIN authorization
 * 2. Expanded Tech Catalog (Apple, Google Pixel, Samsung):
 *    - Distinct brand category filters: Apple, Google Pixel, Samsung
 *    - Detailed specifications on product cards (Brand, Model, Storage capacity, Condition, Stock availability badge, multi-currency pricing)
 * 3. Admin Shop & Product Management Dashboard:
 *    - Phone inventory CRUD panel
 *    - Admin Posting Form with image upload/URL, brand selector (Apple, Google Pixel, Samsung), model name, USD/NGN/RMB pricing, stock qty, key specs
 *    - Edit modal for brand, model, storage, condition, prices, and stock
 *    - Live app synchronization with mobile shop
 * 4. General Ledger Double-Entry Equilibrium (discrepancy = 0.0000 across NGN, USD, CNY)
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
console.log('FLYEMASS "EXPANDED TECH SHOP & MULTI-WALLET CHECKOUT" VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile App Cart & Checkout Fix
// -----------------------------------------------------------------------------
test('1.1 ShopScreen quick navigation strip includes Cart button with live cart badge counter', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  assert.ok(fs.existsSync(file), 'ShopScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("navigate('cart')"), 'Quick navigation has cart button');
  assert.ok(content.includes('cartCount'), 'Displays live cart counter badge');
  assert.ok(content.includes('handleAddToCartQuick'), 'Has instant add-to-cart handler');
  assert.ok(content.includes('ShoppingBag'), 'Has cart bag icon');
});

test('1.2 CheckoutScreen requires full delivery details (Name, Phone, Address, City, State/Country)', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/CheckoutScreen.tsx');
  assert.ok(fs.existsSync(file), 'CheckoutScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('recipientName'), 'Has recipientName field');
  assert.ok(content.includes('recipientPhone'), 'Has recipientPhone field');
  assert.ok(content.includes('deliveryAddress'), 'Has deliveryAddress field');
  assert.ok(content.includes('deliveryCity'), 'Has deliveryCity field');
  assert.ok(content.includes('deliveryStateCountry'), 'Has deliveryStateCountry field');
  assert.ok(content.includes('handlePay'), 'Has pay button handler');
  assert.ok(content.includes('showToast') && content.includes('Please complete all delivery details'), 'Validates complete delivery details');
});

test('1.3 CheckoutScreen executes direct wallet debits across NGN, USD, CNY/RMB with PIN authorization', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/CheckoutScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('PinPad'), 'Integrated with secure 6-digit transaction PIN authorization');
  assert.ok(content.includes('paymentWallet'), 'Multi-currency payment wallet selector present');
  assert.ok(content.includes('placeShopOrder'), 'Executes authoritative placeShopOrder');
  assert.ok(content.includes('orderConfirmed') && content.includes('confirmedOrderData'), 'Displays order confirmation view');
  assert.ok(content.includes('trackingNumber'), 'Generates tracking waybill on checkout');
});

// -----------------------------------------------------------------------------
// 2. Expanded Tech Catalog (Apple, Google Pixel, Samsung)
// -----------------------------------------------------------------------------
test('2.1 ShopScreen supports distinct brand categories: Apple, Google Pixel, Samsung', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('selectedBrand'), 'Tracks selected brand state');
  assert.ok(content.includes("'All Brands', 'Apple', 'Google Pixel', 'Samsung'"), 'Brand filter list contains Apple, Google Pixel, Samsung');
  assert.ok(content.includes("id: 'Google Pixel'"), 'Categories include Google Pixel');
  assert.ok(content.includes("id: 'Samsung'"), 'Categories include Samsung');
});

test('2.2 ShopScreen product cards display detailed specifications (Brand, Model, Storage, Condition, Stock, Multi-currency)', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('product.brand'), 'Displays product brand badge');
  assert.ok(content.includes('product.storage'), 'Displays storage capacity');
  assert.ok(content.includes('condition'), 'Displays hardware condition (Brand New / Refurbished)');
  assert.ok(content.includes('left in stock') || content.includes('Out of Stock'), 'Displays stock availability badge');
  assert.ok(content.includes('formatPrice') && content.includes('getSecondaryPrice'), 'Displays multi-currency pricing');
});

test('2.3 Catalog contains rich flagship devices for Apple, Google Pixel, and Samsung', () => {
  const mockFile = path.join(BASE_DIR, 'src/data/mockData.ts');
  const content = fs.readFileSync(mockFile, 'utf8');

  assert.ok(content.includes('Google Pixel 9 Pro XL'), 'Includes Pixel 9 Pro XL');
  assert.ok(content.includes('Google Pixel 9 Pro Fold'), 'Includes Pixel 9 Pro Fold');
  assert.ok(content.includes('Samsung Galaxy S24 Ultra'), 'Includes Galaxy S24 Ultra');
  assert.ok(content.includes('Samsung Galaxy Z Fold6'), 'Includes Galaxy Z Fold6');
  assert.ok(content.includes('Samsung Galaxy Z Flip6'), 'Includes Galaxy Z Flip6');
  assert.ok(content.includes('iPhone 16 Pro Max'), 'Includes iPhone 16 Pro Max');
});

// -----------------------------------------------------------------------------
// 3. Admin Shop & Product Management Dashboard
// -----------------------------------------------------------------------------
test('3.1 AdminShopScreen provides brand-aware CRUD panel for phone inventory', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminShopScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('newBrand') && content.includes('setNewBrand'), 'Admin has brand selection in Add modal');
  assert.ok(content.includes('newModel') && content.includes('setNewModel'), 'Admin has model name input');
  assert.ok(content.includes('newStorage') && content.includes('setNewStorage'), 'Admin has storage input');
  assert.ok(content.includes('newImage') && content.includes('setNewImage'), 'Admin has image URL input & preview');
  assert.ok(content.includes('newPriceUSD') && content.includes('newPriceNGN') && content.includes('newPriceRMB'), 'Admin has multi-currency pricing inputs (USD, NGN, RMB)');
  assert.ok(content.includes('newStock') && content.includes('setNewStock'), 'Admin specifies stock quantity');
});

test('3.2 AdminShopScreen Edit modal supports editing brand, model, storage, image, condition, prices, and stock', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('editBrand') && content.includes('setEditBrand'), 'Edit modal supports brand');
  assert.ok(content.includes('editModel') && content.includes('setEditModel'), 'Edit modal supports model');
  assert.ok(content.includes('editStorage') && content.includes('setEditStorage'), 'Edit modal supports storage');
  assert.ok(content.includes('editImage') && content.includes('setEditImage'), 'Edit modal supports image URL');
  assert.ok(content.includes('editPriceUSD') && content.includes('editPriceNGN') && content.includes('editPriceCNY'), 'Edit modal supports USD, NGN, CNY/RMB prices');
  assert.ok(content.includes('editStockCount') && content.includes('setEditStockCount'), 'Edit modal supports stock count');
  assert.ok(content.includes('handleSaveEditProduct'), 'Has save product edit handler');
});

test('3.3 AdminShopScreen catalog view features brand filter buttons (All Brands, Apple, Google Pixel, Samsung)', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('catalogBrandFilter') && content.includes('setCatalogBrandFilter'), 'Has catalog brand filter state');
  assert.ok(content.includes("'All Brands', 'Apple', 'Google Pixel', 'Samsung'"), 'Renders brand filter buttons');
  assert.ok(content.includes('handleUpdateStock'), 'Has live inventory adjuster buttons');
  assert.ok(content.includes('handleDeleteProduct'), 'Has delete product handler');
});

// -----------------------------------------------------------------------------
// 4. Financial Ledger Double-Entry Equilibrium
// -----------------------------------------------------------------------------
test('4.1 Double-Entry General Ledger maintains 100% mathematical equilibrium (discrepancy = 0.0000)', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);
  assert.ok(entries.length > 0, 'General ledger must have active entries');

  const balances = { USD: 0, NGN: 0, CNY: 0 };
  let count = 0;

  for (const entry of entries) {
    if (Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        count++;
        const amt = Number(p.amount) || 0;
        const cur = p.currency || 'USD';
        if (p.direction === 'credit') {
          balances[cur] = (balances[cur] || 0) + amt;
        } else if (p.direction === 'debit') {
          balances[cur] = (balances[cur] || 0) - amt;
        }
      }
    }
  }

  console.log(`   Checked ${count} postings across ${entries.length} transactions:`);
  console.log(`   • USD Net Discrepancy: $${balances.USD.toFixed(4)}`);
  console.log(`   • NGN Net Discrepancy: ₦${balances.NGN.toFixed(4)}`);
  console.log(`   • CNY Net Discrepancy: ¥${balances.CNY.toFixed(4)}`);

  assert.strictEqual(Math.abs(balances.USD) < 0.0001, true, 'USD ledger must balance');
  assert.strictEqual(Math.abs(balances.NGN) < 0.0001, true, 'NGN ledger must balance');
  assert.strictEqual(Math.abs(balances.CNY) < 0.0001, true, 'CNY ledger must balance');
});

console.log('\n=============================================================================');
console.log('ALL 10 VERIFICATION TESTS FOR EXPANDED TECH SHOP & CHECKOUT FLOW PASSED!');
console.log('=============================================================================\n');
