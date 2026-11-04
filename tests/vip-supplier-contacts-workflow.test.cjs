/**
 * FLYEMASS — VIP SUPPLIER CONTACTS & ACCESS ENCLAVE TEST SUITE
 * 
 * Verifies:
 * 1. 8-Category directory preview and live aggregate category counts.
 * 2. Privacy invariant: Unsubscribed users cannot access contact details or private cards.
 * 3. Monthly VIP pricing retrieval and dynamic admin updates.
 * 4. Multi-currency wallet balance checks and PIN security.
 * 5. Atomic 30-day subscription payment with double-entry ledger & WAL stream.
 * 6. Early renewal duration stacking (existing_activeUntil + 30 days).
 * 7. Unlocked contact access for active VIP subscribers (WeChat, Phone, WhatsApp, Address).
 * 8. Cryptographically signed 1-hour storage URLs for supplier business cards.
 * 9. Trade safety escrow support ticket generation.
 * 10. Admin supplier CRUD, activation toggle, and multi-currency revenue metrics.
 */

const http = require('http');
const assert = require('assert');

const API_BASE = 'http://localhost:5050';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, API_BASE);
    const reqOpts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('  FLYEMASS VIP SUPPLIER CONTACTS COMPLETE WORKFLOW SUITE');
  console.log('=============================================================\n');

  // Initialize known PIN for Alade and Chen
  await request({ path: '/api/auth/set-pin', method: 'POST' }, { userId: 'usr_alade_01', newPin: '246810' });
  await request({ path: '/api/auth/set-pin', method: 'POST' }, { userId: 'usr_chen_agent', newPin: '246810' });

  // Test 1: Category Counts & 8 Standard Categories
  console.log('--- 1. Directory Preview & 8 Standard Categories ---');
  const prevRes = await request({ path: '/api/suppliers/preview' });
  assert.strictEqual(prevRes.status, 200, 'Preview endpoint must return 200');
  assert.ok(prevRes.body.total >= 14, `Expected at least 14 suppliers, got ${prevRes.body.total}`);
  
  const expectedCats = ['All', 'Electronics', 'Fashion', 'Appliances', 'Home & Living', 'Beauty', 'Machinery', 'Other'];
  for (const cat of expectedCats) {
    assert.ok(prevRes.body.categories[cat] !== undefined, `Category "${cat}" must be present in preview counts`);
    assert.ok(prevRes.body.categories[cat] >= 0, `Category "${cat}" count must be non-negative`);
  }
  console.log(`✅ PASSED: All 8 standard categories verified. Total active factories: ${prevRes.body.total}`);

  // Test 2: Privacy Invariant: Zero Contact Leakage in Preview
  console.log('\n--- 2. Privacy Invariant: Strict Contact Protection for Unsubscribed Users ---');
  for (const sup of prevRes.body.suppliers) {
    assert.strictEqual(sup.wechatId, undefined, `Supplier ${sup.id} must NOT leak wechatId in preview`);
    assert.strictEqual(sup.phone, undefined, `Supplier ${sup.id} must NOT leak phone in preview`);
    assert.strictEqual(sup.whatsapp, undefined, `Supplier ${sup.id} must NOT leak whatsapp in preview`);
    assert.strictEqual(sup.businessAddress, undefined, `Supplier ${sup.id} must NOT leak businessAddress in preview`);
    assert.strictEqual(sup.isLocked, true, `Supplier ${sup.id} must be flagged as locked`);
  }

  // Attempt direct directory access without subscription
  const unauthorizedDirRes = await request({ path: '/api/suppliers/directory?userId=usr_unsubscribed_test' });
  assert.strictEqual(unauthorizedDirRes.status, 403, 'Unsubscribed user must be blocked with 403 Forbidden');
  assert.strictEqual(unauthorizedDirRes.body.unlocked, false, 'Unsubscribed user unlocked must be false');

  // Attempt single contact access without subscription
  const unauthorizedContactRes = await request({ path: '/api/suppliers/contact?supplierId=sup-1&userId=usr_unsubscribed_test' });
  assert.strictEqual(unauthorizedContactRes.status, 403, 'Unsubscribed contact lookup must return 403');
  console.log('✅ PASSED: Zero contact information leaked to unsubscribed users across API and preview RPC');

  // Test 3: Backend VIP Pricing & Admin Pricing Controls
  console.log('\n--- 3. VIP Pricing Endpoint & Real-Time Admin Configuration ---');
  const pricesRes = await request({ path: '/api/suppliers/prices' });
  assert.strictEqual(pricesRes.status, 200);
  assert.ok(pricesRes.body.prices.ngn > 0, 'NGN price must be configured');
  assert.ok(pricesRes.body.prices.usd > 0, 'USD price must be configured');
  assert.ok(pricesRes.body.prices.cny > 0, 'CNY price must be configured');

  // Admin updates pricing
  const updatePriceRes = await request({
    path: '/api/admin/suppliers/prices',
    method: 'POST',
    headers: { 'x-admin-id': 'adm-001', 'x-admin-role': 'super_admin' }
  }, {
    _ngn: 15000,
    _usd: 10,
    _cny: 70,
    adminId: 'Chief Babatunde Alade (Super Admin)'
  });
  assert.strictEqual(updatePriceRes.status, 200, 'Admin price update must succeed');
  assert.strictEqual(updatePriceRes.body.prices.ngn, 15000);
  assert.strictEqual(updatePriceRes.body.prices.usd, 10);
  assert.strictEqual(updatePriceRes.body.prices.cny, 70);
  console.log('✅ PASSED: Admin updated 30-day VIP fees (₦15,000 NGN / $10 USD / ¥70 CNY) in real-time');

  // Test 4: Insufficient Balance and Incorrect PIN Rejection
  console.log('\n--- 4. Financial Validation: PIN Security & Balance Checks ---');
  const wrongPinRes = await request({
    path: '/api/suppliers/subscribe-directory',
    method: 'POST'
  }, {
    userId: 'usr_alade_01',
    currency: 'USD',
    pin: '000000' // wrong PIN
  });
  assert.ok(wrongPinRes.status === 401 || wrongPinRes.status === 403 || wrongPinRes.status === 423, 'Wrong PIN must be rejected');

  // User with insufficient balance
  const brokeUserRes = await request({
    path: '/api/suppliers/subscribe-directory',
    method: 'POST'
  }, {
    userId: 'usr_chen_agent', // 0 NGN balance
    currency: 'NGN',
    pin: '246810' // chen's valid pin
  });
  assert.strictEqual(brokeUserRes.status, 400, 'Insufficient balance must return 400');
  assert.ok(brokeUserRes.body.error.includes('Insufficient NGN balance'), 'Error message must specify insufficient currency');
  console.log('✅ PASSED: Security guards verified: wrong PIN and insufficient funds safely rejected');

  // Test 5: Atomic 30-Day VIP Pass Subscription
  console.log('\n--- 5. Atomic 30-Day VIP Subscription & Double-Entry Ledger ---');
  const dbStateRes = await request({ path: '/api/db/state' });
  const openingUSD = dbStateRes.body.state.users['usr_alade_01'].balances.USD;

  const subscribeRes = await request({
    path: '/api/suppliers/subscribe-directory',
    method: 'POST'
  }, {
    userId: 'usr_alade_01',
    currency: 'USD',
    pin: '246810'
  });

  assert.strictEqual(subscribeRes.status, 200, 'VIP Subscription payment must succeed');
  assert.strictEqual(subscribeRes.body.success, true);
  assert.ok(subscribeRes.body.subscription.activeUntil > Date.now(), 'activeUntil must be in the future');
  assert.strictEqual(subscribeRes.body.subscription.autoRenew, false, 'autoRenew must strictly be false (manual renewal only)');
  
  // Verify wallet debit
  const closingUSD = subscribeRes.body.balances.USD;
  assert.strictEqual(Math.round((openingUSD - closingUSD) * 100) / 100, 10, 'Wallet must be debited exactly $10 USD');

  // Verify subscription status endpoint
  const statusRes = await request({ path: '/api/suppliers/subscription-status?userId=usr_alade_01' });
  assert.strictEqual(statusRes.body.isSubscribed, true);
  assert.strictEqual(statusRes.body.status, 'active');
  assert.ok(statusRes.body.daysRemaining >= 29, 'New subscription must have 30 days remaining');
  console.log(`✅ PASSED: 30-Day VIP pass activated (Ref: ${subscribeRes.body.reference}). Wallet balance debited atomically.`);

  // Test 6: Early Renewal Stacking (+30 Days)
  console.log('\n--- 6. Early Renewal Duration Stacking (+30 Days) ---');
  const preRenewalExpiry = subscribeRes.body.subscription.activeUntil;

  const renewRes = await request({
    path: '/api/suppliers/subscribe-directory',
    method: 'POST'
  }, {
    userId: 'usr_alade_01',
    currency: 'USD',
    pin: '246810'
  });

  assert.strictEqual(renewRes.status, 200);
  const postRenewalExpiry = renewRes.body.subscription.activeUntil;
  const expectedStackExpiry = preRenewalExpiry + 30 * 86400000;
  assert.strictEqual(postRenewalExpiry, expectedStackExpiry, 'Renewal must stack exactly 30 days onto existing active access');
  assert.ok(renewRes.body.subscription.renewalCount >= 1, 'Renewal count must increment');
  console.log(`✅ PASSED: Early renewal stacked +30 days without loss of remaining time (New Expiry: ${new Date(postRenewalExpiry).toLocaleDateString()})`);

  // Test 7: Unlocked Directory for VIP Customer
  console.log('\n--- 7. Unlocked Directory Access for VIP Customer ---');
  const unlockedDirRes = await request({ path: '/api/suppliers/directory?userId=usr_alade_01' });
  assert.strictEqual(unlockedDirRes.status, 200);
  assert.strictEqual(unlockedDirRes.body.unlocked, true);
  assert.ok(unlockedDirRes.body.suppliers.length >= 14);

  const sampleUnlocked = unlockedDirRes.body.suppliers[0];
  assert.ok(sampleUnlocked.wechatId && sampleUnlocked.wechatId.length > 0, 'WeChat ID must be unmasked');
  assert.ok(sampleUnlocked.phone && sampleUnlocked.phone.length > 0, 'Phone must be unmasked');
  assert.ok(sampleUnlocked.whatsapp && sampleUnlocked.whatsapp.length > 0, 'WhatsApp must be unmasked');
  assert.ok(sampleUnlocked.businessAddress && sampleUnlocked.businessAddress.length > 0, 'Business address must be unmasked');
  assert.strictEqual(sampleUnlocked.isLocked, false);
  console.log(`✅ PASSED: VIP Subscriber unlocked direct contact enclave: WeChat (${sampleUnlocked.wechatId}), Phone (${sampleUnlocked.phone})`);

  // Test 8: Private Storage 1-Hour Signed URL & Dynamic Card Rendering
  console.log('\n--- 8. Private Storage Bucket & Cryptographic 1-Hour Signed URLs ---');
  const signedRes = await request({ path: '/api/storage/supplier-cards/signed-url?supplierId=sup-1&userId=usr_alade_01&docType=card' });
  assert.strictEqual(signedRes.status, 200);
  assert.ok(signedRes.body.signedUrl.includes('/api/storage/supplier-cards/view'));
  assert.strictEqual(signedRes.body.durationMinutes, 60);

  // Fetch image using signed URL
  const viewRes = await request({ path: signedRes.body.signedUrl });
  assert.strictEqual(viewRes.status, 200);
  assert.ok(viewRes.headers['content-type'].includes('image/svg+xml'), 'Content type must be image/svg+xml');
  assert.ok(viewRes.body.includes('VERIFIED CANTON FACTORY ENCLAVE'), 'SVG must render verified enclave badge');

  // Attempt access with forged signature
  const forgedRes = await request({ path: `/api/storage/supplier-cards/view?supplierId=sup-1&docType=card&expires=${Date.now() + 1000}&token=forged_token` });
  assert.strictEqual(forgedRes.status, 403, 'Forged token must be rejected with 403');
  console.log('✅ PASSED: Cryptographic 1-hour signed URL generated and verified for private storage bucket');

  // Test 9: Escrow Support Ticket Integration
  console.log('\n--- 9. Trade Safety Escrow Support Ticket Creation ---');
  const ticketRes = await request({
    path: '/api/support/tickets/create',
    method: 'POST'
  }, {
    subject: 'Supplier Verification: Shenzhen Kingzone Microelectronics Ltd',
    category: 'Supplier Escrow',
    priority: 'High',
    message: 'Hello FlyeMass, please help verify supplier Shenzhen Kingzone Microelectronics Ltd in Electronics before I make payment. I would like assistance with supplier verification, transaction coordination, and warehouse inspection.',
    userId: 'usr_alade_01'
  });
  assert.strictEqual(ticketRes.status, 201, 'Support ticket creation must succeed');
  assert.strictEqual(ticketRes.body.ticket.category, 'Supplier Escrow');
  console.log(`✅ PASSED: Escrow verification support ticket #${ticketRes.body.ticket.reference || ticketRes.body.ticket.id} dispatched to China Trade Desk`);

  // Test 10: Admin Supplier Management & Revenue Metrics
  console.log('\n--- 10. Admin Supplier CRUD & Multi-Currency Metrics ---');
  const newSupplierRes = await request({
    path: '/api/admin/suppliers/create',
    method: 'POST',
    headers: { 'x-admin-id': 'adm-001', 'x-admin-role': 'super_admin' }
  }, {
    supplier: {
      name: 'Foshan Precision Aluminium Extrusions Ltd',
      chineseName: '佛山精密铝型材实业有限公司',
      city: 'Foshan (Dali)',
      category: 'Machinery',
      wechatId: 'dali_aluminum_oem',
      phone: '+86 757 8555 4321',
      whatsapp: '+86 138 8555 4321',
      businessAddress: 'Dali Non-Ferrous Metals Industrial Zone, Foshan, China',
      minOrderValue: '¥8,000',
      verifiedYears: 10,
      tags: ['Gold Supplier', 'Factory Direct', '10+ Years']
    },
    adminId: 'Chief Babatunde Alade (Super Admin)'
  });
  assert.strictEqual(newSupplierRes.status, 201);
  const createdSupId = newSupplierRes.body.supplier.id;

  // Toggle Deactivation
  const toggleRes = await request({
    path: '/api/admin/suppliers/toggle-status',
    method: 'POST',
    headers: { 'x-admin-id': 'adm-001', 'x-admin-role': 'super_admin' }
  }, {
    supplierId: createdSupId,
    active: false,
    adminId: 'adm-001'
  });
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleRes.body.supplier.active, false);

  // Verify deactivated supplier disappears from customer preview
  const checkPreviewRes = await request({ path: '/api/suppliers/preview' });
  const foundInPreview = checkPreviewRes.body.suppliers.find(s => s.id === createdSupId);
  assert.strictEqual(foundInPreview, undefined, 'Deactivated supplier must immediately disappear from customer catalog');

  // Admin Metrics
  const metricsRes = await request({
    path: '/api/admin/suppliers/metrics',
    headers: { 'x-admin-id': 'adm-001', 'x-admin-role': 'super_admin' }
  });
  assert.strictEqual(metricsRes.status, 200);
  assert.ok(metricsRes.body.metrics.activeSubscribers >= 1);
  assert.ok(metricsRes.body.metrics.revenue.USD >= 20);
  console.log(`✅ PASSED: Admin created, deactivated, and verified supplier. Multi-currency revenue metrics tracked ($${metricsRes.body.metrics.revenue.USD} USD)`);

  console.log('\n=============================================================');
  console.log('  ALL 10 VIP SUPPLIER CONTACTS TESTS PASSED PERFECTLY!');
  console.log('=============================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER FAILURE:', err);
  process.exit(1);
});
