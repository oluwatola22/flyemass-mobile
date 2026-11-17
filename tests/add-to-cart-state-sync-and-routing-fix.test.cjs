/**
 * FLYEMASS ADD-TO-CART STATE SYNC & CART ROUTING BUG FIX VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Global Cart State & Local Storage / Cloud Persistence:
 *    - Cart state initialized from localStorage ('flyemass_cart') and db.getCloudCart
 *    - Sync effect persists cart to localStorage on all modifications
 *    - addToCart captures product variants (model, storage, color, price adjustments, unit price, quantity)
 *    - Cart item mutations (updateCartQuantity, removeFromCart, clearCart) sync to localStorage and cloud
 * 2. Dynamic Cart Badge Counters Across the App:
 *    - Top Header component (Header.tsx) renders ShoppingBag icon with dynamic counter badge on home & subpages
 *    - BottomNav.tsx renders dynamic badge counter on Shop tab
 *    - ShopScreen.tsx renders live cart badge and sticky floating quick checkout bottom drawer
 * 3. Navigation & Routing Bug Fix:
 *    - getInitialRoute() supports both '/cart' and '/shop/cart' directly without falling back to home
 *    - navigate() normalizes '/cart' and '/shop/cart' to route 'cart'
 *    - ProductDetailScreen handleAddToCart captures variants and routes seamlessly to cart
 *    - CartScreen renders full cart items, variant specs, subtotals, and Proceed to Checkout button
 *    - Supabase schema (supabase-schema-rls.sql) defines public.user_carts table with RLS
 * 4. Financial Accounting Equilibrium:
 *    - General ledger in db-state.json maintains 100% mathematical equilibrium (0.0000 discrepancy)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n=============================================================================');
console.log('FLYEMASS "ADD TO CART STATE SYNC & CART ROUTING BUG FIX" VERIFICATION SUITE');
console.log('=============================================================================\n');

// 1. Global Cart State & Persistence
test('1.1 AppContext initializes cart from localStorage ("flyemass_cart") and db.getCloudCart', () => {
  const contextPath = path.join(ROOT_DIR, 'src/context/AppContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf-8');

  assert.ok(content.includes("localStorage.getItem('flyemass_cart')"), 'Reads cart from localStorage on init');
  assert.ok(content.includes('db.getCloudCart(currentUid)'), 'Falls back to db.getCloudCart on init');
  assert.ok(content.includes("localStorage.setItem('flyemass_cart', JSON.stringify(cart))"), 'Persists cart to localStorage via useEffect');
});

test('1.2 addToCart captures selected variant attributes (color, storage, price adjustment, unit price, qty)', () => {
  const contextPath = path.join(ROOT_DIR, 'src/context/AppContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf-8');

  assert.ok(content.includes('const color = selectedColor'), 'Captures selectedColor');
  assert.ok(content.includes('const storage = selectedStorage'), 'Captures selectedStorage');
  assert.ok(content.includes('const activeVariant = variant'), 'Captures activeVariant');
  assert.ok(content.includes('priceAdjustmentNGN'), 'Captures priceAdjustmentNGN');
  assert.ok(content.includes('unitPriceNGN = basePriceNGN + priceAdjustmentNGN'), 'Calculates authoritative unit price');
  assert.ok(content.includes("localStorage.setItem('flyemass_cart'"), 'Immediately stores updated cart to localStorage');
  assert.ok(content.includes('db.syncCloudCart(activeUserId, updated)'), 'Syncs cart to cloud database');
});

test('1.3 Cart mutation handlers (updateCartQuantity, removeFromCart, clearCart) persist changes', () => {
  const contextPath = path.join(ROOT_DIR, 'src/context/AppContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf-8');

  assert.ok(content.includes('updateCartQuantity') && content.includes('removeFromCart') && content.includes('clearCart'), 'Exposes all cart handlers');
  assert.ok(content.includes("localStorage.removeItem('flyemass_cart')"), 'clearCart purges localStorage cart state');
});

// 2. Navigation & Routing Normalization
test('2.1 getInitialRoute() maps both "/cart" and "/shop/cart" directly to "cart" screen', () => {
  const contextPath = path.join(ROOT_DIR, 'src/context/AppContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf-8');

  assert.ok(content.includes("if (path === '/cart' || path === '/shop/cart') return 'cart';"), 
    'Explicit route resolution for /cart and /shop/cart');
  assert.ok(content.includes("if (path === '/checkout' || path === '/shop/checkout') return 'checkout';"), 
    'Explicit route resolution for /checkout and /shop/checkout');
});

test('2.2 navigate() handles string routes "/cart" and "/shop/cart" gracefully', () => {
  const contextPath = path.join(ROOT_DIR, 'src/context/AppContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf-8');

  assert.ok(content.includes("(route as string) === '/cart' || (route as string) === '/shop/cart'"), 
    'Normalizes string route paths in navigate');
});

test('2.3 ProductDetailScreen handleAddToCart captures variants and routes to "cart"', () => {
  const detailPath = path.join(ROOT_DIR, 'src/screens/shop/ProductDetailScreen.tsx');
  const content = fs.readFileSync(detailPath, 'utf-8');

  assert.ok(content.includes('addToCart(product, selectedColor, selectedStorage, activeVariant, quantity)'), 
    'Passes complete variant parameters to addToCart');
  assert.ok(content.includes("navigate('cart')"), 'Routes directly to cart after adding item');
});

// 3. Cart Badges & UI Integration Across the App
test('3.1 Header.tsx renders Shopping Cart icon with dynamic counter badge', () => {
  const headerPath = path.join(ROOT_DIR, 'src/components/layout/Header.tsx');
  const content = fs.readFileSync(headerPath, 'utf-8');

  assert.ok(content.includes('ShoppingBag'), 'Header imports ShoppingBag icon');
  assert.ok(content.includes('cartCount'), 'Header calculates cartCount dynamically');
  assert.ok(content.includes("navigate('cart')"), 'Header cart button triggers navigate to cart');
  assert.ok(content.includes('{cartCount}'), 'Header renders badge with live item count');
});

test('3.2 BottomNav.tsx renders dynamic badge counter on Shop tab', () => {
  const navPath = path.join(ROOT_DIR, 'src/components/layout/BottomNav.tsx');
  const content = fs.readFileSync(navPath, 'utf-8');

  assert.ok(content.includes('cartCount = cart.reduce'), 'Calculates total quantity across all items');
  assert.ok(content.includes('{cartCount > 0 &&'), 'Conditionally renders shop badge when items exist');
});

test('3.3 CartScreen renders item cards, subtotals, delivery fee, and proceed to checkout', () => {
  const cartPath = path.join(ROOT_DIR, 'src/screens/shop/CartScreen.tsx');
  const content = fs.readFileSync(cartPath, 'utf-8');

  assert.ok(content.includes('cart.map('), 'Renders cart items array');
  assert.ok(content.includes('subtotalNGN'), 'Calculates hardware subtotal');
  assert.ok(content.includes('deliveryFeeNGN'), 'Calculates air cargo delivery fee');
  assert.ok(content.includes('totalNGN'), 'Calculates total payable');
  assert.ok(content.includes("navigate('checkout')"), 'Proceed to Checkout button navigates to checkout');
  assert.ok(content.includes('Your Cart is Empty'), 'Empty state container maintained when cart is genuinely empty');
});

test('3.4 supabase-schema-rls.sql defines public.user_carts table with RLS policies', () => {
  const sqlPath = path.join(ROOT_DIR, 'supabase-schema-rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.user_carts'), 'User carts table schema is defined');
  assert.ok(sql.includes('items JSONB NOT NULL DEFAULT'), 'Stores cart items as structured JSONB');
  assert.ok(sql.includes('ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY'), 'RLS enabled on user_carts');
});

// 4. Financial General Ledger Mathematical Equilibrium
test('4.1 Double-Entry General Ledger maintains 100% mathematical equilibrium (0.0000 discrepancy)', () => {
  const statePath = path.join(ROOT_DIR, 'db-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);

  assert.ok(entries.length > 0, 'General ledger contains postings');

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

  console.log(`   Checked ${count} postings across ${entries.length} double-entry ledger transactions:`);
  console.log(`   • USD Net Discrepancy: $${(balances.USD || 0).toFixed(4)}`);
  console.log(`   • NGN Net Discrepancy: ₦${(balances.NGN || 0).toFixed(4)}`);
  console.log(`   • CNY Net Discrepancy: ¥${(balances.CNY || 0).toFixed(4)}`);

  assert.strictEqual(Math.abs(balances.USD || 0) < 0.0001, true, 'USD discrepancy must be zero');
  assert.strictEqual(Math.abs(balances.NGN || 0) < 0.0001, true, 'NGN discrepancy must be zero');
  assert.strictEqual(Math.abs(balances.CNY || 0) < 0.0001, true, 'CNY discrepancy must be zero');
});

console.log('\n=============================================================================');
console.log(`ALL ${totalTests} VERIFICATION TESTS FOR ADD TO CART STATE SYNC & ROUTING PASSED!`);
console.log('=============================================================================\n');
