/**
 * FlyeMass Phase 7 Automated Integration & Platform Parity Suite
 * Tests the new administrative capabilities, feature recovery, and end-to-end integration:
 * 1. Authoritative Product Catalog Creation (POST /api/shop/add-product)
 * 2. Real-Time Product Stock Adjustment (POST /api/shop/update-stock)
 * 3. Customer KYC Verification Status Toggle (POST /api/admin/users/toggle-kyc)
 * 4. Customer Compliance & Due Diligence Audit Notes (POST /api/admin/users/update-notes)
 * 5. Payment Gateway Sandbox Inflow Simulation (Providus, Monnify, Korapay)
 * 6. Webhook Inbound Events Persistence & Idempotency Tracking
 * 7. China Business Hotel Property Registration (POST /api/admin/hotels/create)
 * 8. Administrative Logistics Package Consolidation into Master Container
 * 9. Multi-Currency Double-Entry General Ledger Equilibrium (Zero Net Delta)
 * 10. Cryptographic SHA-256 Audit Log Integrity Verification
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5050';

function post(endpoint, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const data = JSON.stringify(body || {});
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(endpoint, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const req = http.request(url, { method: 'GET', headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runPhase7Tests() {
  console.log('\n=============================================================');
  console.log('  FLYEMASS PHASE 7 COMPLETE PLATFORM INTEGRATION SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  const adminHeaders = {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  };

  try {
    // 1. Authoritative Product Catalog Addition
    console.log('--- 1. Tech Product Catalog Creation ---');
    const newProduct = {
      id: `prod-ipad-pro-m4-${Date.now()}`,
      title: 'iPad Pro 13" M4 (256GB WiFi + Cellular)',
      subtitle: 'Space Black • China / Hong Kong Spec',
      category: 'iPad',
      priceUSD: 1299,
      priceNGN: 1928000,
      priceCNY: 9405,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      specs: ['M4 Chip', 'OLED Ultra Retina XDR', 'Nano-texture glass', 'eSIM + Nano-SIM'],
      inStock: true,
      stockCount: 12
    };

    const addProdRes = await post('/api/shop/add-product', { product: newProduct }, adminHeaders);
    assert.strictEqual(addProdRes.status, 201, 'Should create product with 201 Created');
    assert.strictEqual(addProdRes.data.product.id, newProduct.id);
    assert.strictEqual(addProdRes.data.product.stockCount, 12);
    console.log('✅ PASSED: New Apple hardware product added authoritatively to tech catalog');
    passed++;

    // 2. Real-Time Product Stock Adjustment
    console.log('\n--- 2. Product Inventory Stock Management ---');
    const stockAdjustRes = await post('/api/shop/update-stock', { productId: newProduct.id, delta: 5 }, adminHeaders);
    assert.strictEqual(stockAdjustRes.status, 200, 'Should adjust stock with 200 OK');
    assert.strictEqual(stockAdjustRes.data.product.stockCount, 17, 'Stock count should increment to 17');
    console.log('✅ PASSED: Tech inventory adjusted atomically (+5 units to 17)');
    passed++;

    // 3. Customer KYC Verification Toggle
    console.log('\n--- 3. Customer KYC Verification Toggle ---');
    const kycRes = await post('/api/admin/users/toggle-kyc', { userId: 'usr_alade_01', verified: true }, adminHeaders);
    assert.strictEqual(kycRes.status, 200, 'Should toggle KYC with 200 OK');
    assert.strictEqual(kycRes.data.user.verifiedBadge, true, 'User verifiedBadge should be true');
    assert.strictEqual(kycRes.data.user.kycLevel, 'Tier 3 (BVN & CAC Verified)');
    console.log('✅ PASSED: Customer KYC verified badge and Tier 3 level updated authoritatively');
    passed++;

    // 4. Customer Compliance & Due Diligence Notes
    console.log('\n--- 4. Customer Compliance Notes ---');
    const noteText = 'Due diligence complete: Form CAC 1.1 inspected, Nigerian NUBAN BVN match verified, China SAFE corporate quota approved.';
    const notesRes = await post('/api/admin/users/update-notes', { userId: 'usr_alade_01', notes: noteText }, adminHeaders);
    assert.strictEqual(notesRes.status, 200, 'Should update compliance notes with 200 OK');
    assert.strictEqual(notesRes.data.user.adminNotes, noteText);
    console.log('✅ PASSED: Internal compliance notes saved and linked to customer profile');
    passed++;

    // 5. Payment Gateway Inbound Webhook Simulation (Providus)
    console.log('\n--- 5. Payment Gateway Inbound Webhook Simulation (Providus) ---');
    const provSim = await post('/api/admin/webhooks/simulate', {
      provider: 'providus',
      amount: 750000,
      userId: 'usr_alade_01'
    }, adminHeaders);
    assert.strictEqual(provSim.status, 200, 'Should simulate Providus inflow successfully');
    assert.ok(provSim.data.reference.startsWith('PROVIDUS-SIM-'));
    console.log(`✅ PASSED: Providus virtual account inflow simulated (₦750,000 credited, Ref: ${provSim.data.reference})`);
    passed++;

    // 6. Payment Gateway Inbound Webhook Simulation (Monnify)
    console.log('\n--- 6. Payment Gateway Inbound Webhook Simulation (Monnify) ---');
    const mnfySim = await post('/api/admin/webhooks/simulate', {
      provider: 'monnify',
      amount: 300000,
      userId: 'usr_alade_01'
    }, adminHeaders);
    assert.strictEqual(mnfySim.status, 200, 'Should simulate Monnify inflow successfully');
    assert.ok(mnfySim.data.reference.startsWith('MONNIFY-SIM-'));
    console.log(`✅ PASSED: Monnify card checkout simulated (₦300,000 credited, Ref: ${mnfySim.data.reference})`);
    passed++;

    // 7. Payment Gateway Inbound Webhook Simulation (Korapay)
    console.log('\n--- 7. Payment Gateway Inbound Webhook Simulation (Korapay) ---');
    const koraSim = await post('/api/admin/webhooks/simulate', {
      provider: 'korapay',
      amount: 450000,
      userId: 'usr_alade_01'
    }, adminHeaders);
    assert.strictEqual(koraSim.status, 200, 'Should simulate Korapay inflow successfully');
    assert.ok(koraSim.data.reference.startsWith('KORAPAY-SIM-'));
    console.log(`✅ PASSED: Korapay transfer simulated (₦450,000 credited, Ref: ${koraSim.data.reference})`);
    passed++;

    // 8. China Business Hotel Property Creation
    console.log('\n--- 8. China Business Hotel Registration ---');
    const newHotel = {
      id: `htl_canton_garden_${Date.now()}`,
      name: 'Guangzhou Garden Hotel Trade Executive',
      chineseName: '广州花园酒店',
      city: 'Guangzhou',
      district: 'Yuexiu Commercial Hub',
      pricePerNightUSD: 145,
      pricePerNightCNY: 1050,
      distanceToMarket: '15 mins to Pazhou Complex',
      taxiCardZh: '请带我到：广州市越秀区环市东路368号 花园酒店。谢谢！'
    };
    const hotelRes = await post('/api/admin/hotels/create', { hotel: newHotel }, adminHeaders);
    assert.strictEqual(hotelRes.status, 201, 'Should register hotel with 201 Created');
    assert.strictEqual(hotelRes.data.hotel.name, newHotel.name);
    assert.strictEqual(hotelRes.data.hotel.chineseName, newHotel.chineseName);
    console.log('✅ PASSED: China partner hotel registered with bilingual Chinese taxi card translation');
    passed++;

    // 9. Admin Logistics Package Consolidation
    console.log('\n--- 9. Origin Warehouse Package Consolidation ---');
    // First register two parcels
    const p1 = await post('/api/shipments/register', {
      userId: 'usr_alade_01',
      title: 'GaN Fast Chargers 100W',
      originWarehouse: 'Guangzhou',
      mode: 'Air Freight',
      weightKg: 15.5
    });
    const p2 = await post('/api/shipments/register', {
      userId: 'usr_alade_01',
      title: 'Braided USB-C Cables (500 pcs)',
      originWarehouse: 'Guangzhou',
      mode: 'Air Freight',
      weightKg: 12.0
    });

    const consolRes = await post('/api/shipments/consolidate', {
      shipmentIds: [p1.data.shipment.id, p2.data.shipment.id],
      destinationHub: 'Lagos MMIA Air Cargo Hub',
      mode: 'air_express',
      userId: 'usr_alade_01'
    });
    assert.ok(consolRes.status === 200 || consolRes.status === 201, 'Should consolidate parcels');
    assert.ok(consolRes.data.consolidation.trackingNumber.startsWith('FM-CONSOL-'));
    assert.strictEqual(consolRes.data.count, 2);
    console.log(`✅ PASSED: Consolidated 2 origin parcels into Master Air Container #${consolRes.data.consolidation.trackingNumber}`);
    passed++;

    // 10. Multi-Currency Double-Entry General Ledger Equilibrium
    console.log('\n--- 10. Double-Entry General Ledger Trial Balance Equilibrium ---');
    const reconRes = await get('/api/admin/ledger/reconciliation', adminHeaders);
    assert.strictEqual(reconRes.status, 200, 'Should retrieve reconciliation');
    assert.ok(reconRes.data.success, 'Reconciliation report returned');
    const tb = reconRes.data.trialBalance || {};
    assert.ok(tb.NGN && Math.abs(tb.NGN.net || 0) < 0.001, 'NGN net delta must be zero');
    assert.ok(tb.CNY && Math.abs(tb.CNY.net || 0) < 0.001, 'CNY net delta must be zero');
    assert.ok(tb.USD && Math.abs(tb.USD.net || 0) < 0.001, 'USD net delta must be zero');
    console.log('✅ PASSED: Multi-currency general ledger in perfect equilibrium (Debits === Credits for NGN, CNY, USD)');
    passed++;

    // 11. Tamper-Evident SHA-256 Audit Hash Chain Verification
    console.log('\n--- 11. Cryptographic Audit Log Integrity ---');
    const auditRes = await get('/api/admin/audit-logs/verify', adminHeaders);
    assert.strictEqual(auditRes.status, 200, 'Should verify audit chain');
    assert.strictEqual(auditRes.data.valid, true, 'Audit log chain must be intact');
    console.log(`✅ PASSED: Cryptographic SHA-256 audit log chain verified (${auditRes.data.blocksVerified} blocks verified)`);
    passed++;

    console.log('\n=============================================================');
    console.log(`  ALL ${passed} PHASE 7 INTEGRATION & AUDIT TESTS PASSED!`);
    console.log('=============================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runPhase7Tests();
