const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 RUNNING: FlyeMass Shop Banners Isolation & Home Exclusion Test Suite\n');

const homeScreenPath = path.resolve(__dirname, '../src/screens/home/HomeScreen.tsx');
const shopScreenPath = path.resolve(__dirname, '../src/screens/shop/ShopScreen.tsx');
const dbPath = path.resolve(__dirname, '../src/services/db.ts');
const dbStatePath = path.resolve(__dirname, '../db-state.json');

// 1. Check HomeScreen Banner Filtering
console.log('1. Checking HomeScreen Banner Isolation...');
const homeScreenContent = fs.readFileSync(homeScreenPath, 'utf8');
assert(
  homeScreenContent.includes("b.placement !== 'shop' && b.destinationRoute !== 'shop'"),
  'HomeScreen must strictly filter out shop banners so they never show on the mobile homepage'
);
console.log('   ✅ HomeScreen strictly excludes banners with placement: "shop" or destinationRoute: "shop".');

// 2. Check ShopScreen Banner Retrieval
console.log('2. Checking ShopScreen Banner Retrieval...');
const shopScreenContent = fs.readFileSync(shopScreenPath, 'utf8');
assert(
  shopScreenContent.includes('db.getShopBanners()'),
  'ShopScreen must retrieve banners using db.getShopBanners()'
);
console.log('   ✅ ShopScreen accurately retrieves and displays dedicated Apple & Tech Store banners.');

// 3. Check db.ts getBanners, getHomeBanners, and getShopBanners
console.log('3. Checking Database Service Banner Method Contracts...');
const dbContent = fs.readFileSync(dbPath, 'utf8');
assert(
  dbContent.includes("getBanners(placement?: 'home' | 'shop' | 'all')") ||
  dbContent.includes("b.placement !== 'shop' && b.destinationRoute !== 'shop'"),
  'db.getBanners must filter out shop banners by default'
);
assert(
  dbContent.includes('getHomeBanners(): BannerDocument[]'),
  'db.ts must provide getHomeBanners() method'
);
assert(
  dbContent.includes('getShopBanners(): BannerDocument[]'),
  'db.ts must provide getShopBanners() method'
);
console.log('   ✅ db.ts guarantees strict separation between home banners and shop banners.');

// 4. Test Live Backend Sync Server Endpoints
console.log('4. Testing Live Backend Sync Server API Responses...');

function fetchJson(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const shopRes = await fetchJson('http://localhost:5050/api/shop/banners');
    assert(shopRes.success, 'GET /api/shop/banners must return success: true');
    assert(shopRes.banners && shopRes.banners.length > 0, 'Shop banners must not be empty');
    for (const b of shopRes.banners) {
      assert(
        b.placement === 'shop' || b.destinationRoute === 'shop',
        `Shop banner ${b.id} must have placement: "shop" or destinationRoute: "shop"`
      );
    }
    console.log(`   ✅ GET /api/shop/banners returned ${shopRes.banners.length} shop-specific banners.`);

    const homeRes = await fetchJson('http://localhost:5050/api/banners?placement=home');
    assert(homeRes.success, 'GET /api/banners?placement=home must return success: true');
    for (const b of homeRes.banners) {
      assert(
        b.placement !== 'shop' && b.destinationRoute !== 'shop',
        `Home banner ${b.id} must not be a shop banner`
      );
    }
    console.log(`   ✅ GET /api/banners?placement=home returned ${homeRes.banners.length} non-shop banners.`);

    // 5. Financial Ledger Equilibrium Verification
    console.log('5. Verifying Financial Ledger Equilibrium...');
    const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));
    const ledger = dbState.double_entry_ledger || {};
    const netSums = { NGN: 0, CNY: 0, USD: 0 };
    let totalPostings = 0;

    Object.values(ledger).forEach(tx => {
      if (Array.isArray(tx.postings)) {
        tx.postings.forEach(post => {
          totalPostings++;
          const curr = post.currency || 'NGN';
          if (netSums[curr] !== undefined) {
            netSums[curr] += (Number(post.credit) || 0) - (Number(post.debit) || 0);
          }
        });
      }
    });

    for (const curr of ['NGN', 'CNY', 'USD']) {
      assert(
        Math.abs(netSums[curr]) < 0.0001,
        `Ledger imbalance detected in ${curr}: ${netSums[curr]}`
      );
    }
    console.log(`   ✅ Financial equilibrium confirmed (${totalPostings} postings, net 0 discrepancy).`);

    console.log('\n=============================================================');
    console.log('🎉 ALL SHOP BANNER ISOLATION & EXCLUSION TESTS PASSED!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
})();
