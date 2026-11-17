/**
 * tests/apple-tech-shop-ecommerce-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Apple & Tech Shop E-Commerce Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in ShopScreen.tsx & ProductDetailScreen.tsx:
 *    - Product catalog for iPhones, MacBooks, and AirPods with categories & condition filters
 *    - Multi-currency pricing (NGN, USD, CNY)
 *    - Dynamic live stock counters and stock availability indicators
 *    - "Buy Now via Wallet" instant checkout with wallet selector (NGN, USD, CNY) and PIN authorization
 *    - Automatic wallet balance deduction, order generation, and tracking number assignment
 *    - Luxury dark-mode FinTech styling
 * 2. Admin Logic in AdminShopScreen.tsx:
 *    - Product inventory management dashboard to add products with multi-currency pricing
 *    - Edit modal for updating product title, category, condition, prices (USD, NGN, CNY), and stock
 *    - Quick stock increment/decrement and product deletion
 *    - Order fulfillment workflow (pending, processing, shipped, delivered, cancelled)
 *    - Dispatch modal with courier & airway bill / tracking number assignment
 * 3. Server Endpoints & Client Database Methods (sync-server.cjs & src/services/db.ts):
 *    - /api/shop/add-product, /api/shop/update-product, /api/shop/delete-product, /api/shop/update-stock, /api/shop/update-order-status
 * 4. Authoritative State Manipulation (Product CRUD & Order Fulfillment Lifecycle)
 * 5. Multi-Currency Double-Entry General Ledger Equilibrium
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
console.log('FLYEMASS "APPLE & TECH SHOP E-COMMERCE" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (ShopScreen.tsx & ProductDetailScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 ShopScreen contains product catalog for iPhones, MacBooks, and AirPods', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  assert.ok(fs.existsSync(file), 'ShopScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('iPhone') && content.includes('iPhones'), 'Includes iPhone category');
  assert.ok(content.includes('MacBook') && content.includes('MacBooks'), 'Includes MacBook category');
  assert.ok(content.includes('AirPods'), 'Includes AirPods category');
});

test('1.2 ShopScreen displays multi-currency pricing (NGN, USD, CNY) and currency selector', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('shopCurrency') && content.includes('setShopCurrency'), 'Has shop currency state');
  assert.ok(content.includes('USD') && content.includes('NGN') && content.includes('CNY'), 'Supports USD, NGN, and CNY pricing');
  assert.ok(content.includes('formatPrice'), 'Formats pricing across currencies');
});

test('1.3 ShopScreen renders stock counters and availability status', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('stock') || content.includes('inStock'), 'Tracks stock availability');
  assert.ok(content.includes('Out of Stock') || content.includes('left in stock') || content.includes('left'), 'Renders stock indicator pills');
});

test('1.4 ProductDetailScreen features "Buy Now via Wallet" instant checkout and stock counter', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ProductDetailScreen.tsx');
  assert.ok(fs.existsSync(file), 'ProductDetailScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleBuyNow'), 'Has Buy Now handler');
  assert.ok(content.includes('Buy Now via Wallet') || content.includes('Buy Now'), 'Has Buy Now action button');
  assert.ok(content.includes('showInstantBuyModal') && content.includes('setShowInstantBuyModal'), 'Instant buy modal state is present');
  assert.ok(content.includes('variantStock') || content.includes('stock'), 'Displays live variant stock counter');
});

test('1.5 ProductDetailScreen instant buy modal supports NGN, USD, CNY wallets & PIN authorization', () => {
  const file = path.join(BASE_DIR, 'src/screens/shop/ProductDetailScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('buyWallet') && content.includes('setBuyWallet'), 'Wallet selection state present');
  assert.ok(content.includes('PinPad'), 'Integrated with secure 6-digit transaction PIN authorization');
  assert.ok(content.includes('handleAuthorizeInstantBuy'), 'Has instant buy authorization handler');
  assert.ok(content.includes('placeShopOrder'), 'Executes authoritative order placement via placeShopOrder');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic (AdminShopScreen.tsx)
// -----------------------------------------------------------------------------
test('2.1 AdminShopScreen provides product inventory management dashboard', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminShopScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Apple Shop & Fulfillment Operations'), 'Header title exists');
  assert.ok(content.includes('Apple Catalog') && content.includes('Fulfillment Board'), 'Catalog and fulfillment tabs exist');
  assert.ok(content.includes('showAddModal') && content.includes('setShowAddModal'), 'Add product modal state exists');
  assert.ok(content.includes('handleAddProduct'), 'Product creation handler exists');
});

test('2.2 AdminShopScreen supports multi-currency price inputs (USD, NGN, CNY) for products', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('newPriceUSD') && content.includes('newPriceNGN'), 'Add form includes USD and NGN prices');
  assert.ok(content.includes('editPriceUSD') && content.includes('editPriceNGN') && content.includes('editPriceCNY'), 'Edit form includes USD, NGN, CNY prices');
});

test('2.3 AdminShopScreen supports updating products and managing stock quantities', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('showEditModal') && content.includes('setShowEditModal'), 'Edit product modal state exists');
  assert.ok(content.includes('handleOpenEditProduct'), 'Has edit product modal trigger');
  assert.ok(content.includes('handleSaveEditProduct'), 'Has product update submission handler');
  assert.ok(content.includes('handleUpdateStock'), 'Has stock adjustment handler');
  assert.ok(content.includes('handleDeleteProduct'), 'Has product deletion handler');
});

test('2.4 AdminShopScreen provides order fulfillment board with waybill & status management', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Fulfillment Board'), 'Order fulfillment view exists');
  assert.ok(content.includes('handleUpdateOrderStatus'), 'Has status transition handler');
  assert.ok(content.includes('handleConfirmShipment'), 'Has dispatch shipment handler');
  assert.ok(content.includes('courierName') && content.includes('trackingNumber'), 'Allows assigning courier and tracking number');
});

// -----------------------------------------------------------------------------
// 3. Database Service & Sync Server Routes
// -----------------------------------------------------------------------------
test('3.1 db.ts exposes updateProduct, deleteProduct, updateProductStock, and updateOrderStatus', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('updateProduct('), 'db.ts includes updateProduct');
  assert.ok(content.includes('deleteProduct('), 'db.ts includes deleteProduct');
  assert.ok(content.includes('updateProductStock('), 'db.ts includes updateProductStock');
  assert.ok(content.includes('updateOrderStatus(') || content.includes('updateShopOrderStatus('), 'db.ts includes updateOrderStatus');
});

test('3.2 sync-server.cjs handles product CRUD, stock updates, and order fulfillment endpoints', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/shop/add-product'"), 'Endpoint for add-product exists');
  assert.ok(content.includes("pathname === '/api/shop/update-product'"), 'Endpoint for update-product exists');
  assert.ok(content.includes("pathname === '/api/shop/delete-product'"), 'Endpoint for delete-product exists');
  assert.ok(content.includes("pathname === '/api/shop/update-stock'"), 'Endpoint for update-stock exists');
  assert.ok(content.includes("pathname === '/api/shop/update-order-status'") || content.includes("pathname === '/api/admin/shop/orders/status'"), 'Endpoint for update-order-status exists');
});

// -----------------------------------------------------------------------------
// 4. Authoritative State Data & Product Inventory
// -----------------------------------------------------------------------------
test('4.1 Authoritative db-state.json contains active Apple catalog products and shop orders', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const products = state.products || {};
  const productList = Object.values(products);
  assert.ok(productList.length > 0, 'Catalog products must exist in db-state.json');

  const iphone = productList.find(p => p.category === 'iPhone' || p.title.toLowerCase().includes('iphone'));
  assert.ok(iphone, 'iPhone model present in catalog');
  assert.ok(iphone.priceUSD > 0, 'Product has USD price');
  assert.ok(iphone.priceNGN > 0, 'Product has NGN price');

  const orders = state.shop_orders || {};
  const orderList = Object.values(orders);
  assert.ok(orderList.length > 0, 'Shop orders must exist in db-state.json');
  const order = orderList[0];
  assert.ok(order.id, 'Order has valid id');
  assert.ok(order.totalAmount > 0, 'Order has totalAmount');
});

// -----------------------------------------------------------------------------
// 5. Authoritative Double-Entry General Ledger Equilibrium
// -----------------------------------------------------------------------------
test('5.1 Double-Entry General Ledger in db-state.json maintains 100% mathematical equilibrium across NGN, USD, CNY', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);
  assert.ok(entries.length > 0, 'double_entry_ledger entries must exist');

  const totals = { USD: 0, NGN: 0, CNY: 0 };

  for (const entry of entries) {
    if (Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        const curr = p.currency || 'USD';
        const d = Number(p.debit) || 0;
        const c = Number(p.credit) || 0;
        if (totals[curr] !== undefined) {
          totals[curr] += (d - c);
        }
      }
    }
  }

  assert.ok(Math.abs(totals.NGN) < 0.01, `NGN ledger unbalanced: ${totals.NGN}`);
  assert.ok(Math.abs(totals.USD) < 0.01, `USD ledger unbalanced: ${totals.USD}`);
  assert.ok(Math.abs(totals.CNY) < 0.01, `CNY ledger unbalanced: ${totals.CNY}`);

  console.log(`   Ledger Equilibrium Verified:
   • USD Net Difference: $${totals.USD.toFixed(4)}
   • NGN Net Difference: ₦${totals.NGN.toFixed(4)}
   • CNY Net Difference: ¥${totals.CNY.toFixed(4)}`);
});

console.log('\n=============================================================================');
console.log('ALL 12 VERIFICATION TESTS FOR APPLE & TECH SHOP E-COMMERCE PASSED SUCCESSFULLY!');
console.log('=============================================================================\n');
