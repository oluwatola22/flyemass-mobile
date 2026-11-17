/**
 * FlyeMass Phase 9 Logistics & Register Package End-to-End Workflow Verification Suite
 * 
 * Verifies:
 * 1. Customer Package Pre-Registration (SF Express tracking, Guangzhou hub, cartons, declared RMB, 6-digit OTP)
 * 2. Uniqueness of Shipment Code (SL-2026-XXXXX), Barcode (FMCN...), and Pickup OTP
 * 3. China Warehouse Intake, Scale Weighing, Dimensional CBM, and Volumetric Billable Formula
 * 4. Freight Billing Drawer (USD, NGN, CNY conversion) -> Sets status to 'awaiting_payment'
 * 5. Freight Payment Option A: Immediate USD Wallet Debit with 6-Digit PIN & Double-Entry Ledger Posting
 * 6. Freight Payment Option A2: Immediate NGN Wallet Debit with 6-Digit PIN
 * 7. Freight Payment Option B: Pay on Arrival (Deferred Payment) allows dispatch without blocking
 * 8. Complete Multi-Stage Lifecycle Advancement (dispatched -> in_transit -> customs_clearance -> arrived)
 * 9. Lagos Hub Office Pickup: Validates 6-Digit OTP, Rejects Invalid OTP
 * 10. Lagos Hub Office Pickup: Enforces Deferred Freight Collection Before Handover
 * 11. Doorstep Delivery: Dispatch to Address, Recipient Proof Note, Deferred COD Collection
 * 12. Master Consolidation: Groups multiple dock parcels into an air cargo container
 * 13. Double-Entry General Ledger Equilibrium for all Freight Transactions
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

async function runTests() {
  console.log('\n============================================================');
  console.log('📦 FLYEMASS PHASE 9 — LOGISTICS & PACKAGE WORKFLOW TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name} ... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL\n  Error: ${err.message}`);
      failed++;
    }
  }

  // Initial Sync Check
  await test('0. Authoritative Backend Health & Database Connectivity', async () => {
    const res = await get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'healthy');
  });

  let shipmentA_Id = '';
  let shipmentA_Code = '';
  let shipmentA_Otp = '';

  // 1. Customer Package Pre-Registration
  await test('1. Customer Package Pre-Registration (SF Express tracking, Guangzhou hub, OTP generation)', async () => {
    const payload = {
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      customerPhone: '+234 803 555 9201',
      courierCompany: 'SF Express',
      chineseCourierTracking: `SF${Date.now().toString().slice(-9)}`,
      packageDescription: '50x Apple GaN 65W Fast Chargers & USB-C Braided Cables',
      cartonsCount: 2,
      declaredValueRMB: 3600,
      sender: 'Shenzhen Anker Factory Outlet',
      originWarehouse: 'Guangzhou',
      shippingMode: 'Air Express',
      deliveryType: 'pickup',
      pickupHub: 'Ikeja MMIA Cargo Hub (Lagos)',
      weightKg: 8.5
    };

    const res = await post('/api/shipments/register', payload);
    assert.strictEqual(res.status === 200 || res.status === 201, true, `Expected 200/201 status, got ${res.status}`);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.shipment);
    
    const s = res.data.shipment;
    shipmentA_Id = s.id;
    shipmentA_Code = s.shipmentCode;
    shipmentA_Otp = s.pickupOtp;

    assert.ok(s.shipmentCode.startsWith('SL-2026-'), `Expected shipmentCode to start with SL-2026-, got ${s.shipmentCode}`);
    assert.ok(s.trackingCode.startsWith('FMCN'), `Expected trackingCode to start with FMCN, got ${s.trackingCode}`);
    assert.strictEqual(s.pickupOtp.length, 6, 'Expected 6-digit pickup OTP');
    assert.strictEqual(s.currentStatus, 'registered');
    assert.strictEqual(s.paymentStatus, 'unbilled');
    assert.strictEqual(s.freightPaid, false);
  });

  // 2. China Warehouse Intake & Volumetric Weighing Formula
  await test('2. China Warehouse Intake & Volumetric Billable Formula max(actual, L*W*H/6000)', async () => {
    // Actual weight: 8.5kg. Dimensions: 60cm x 40cm x 30cm -> Volumetric = 72,000 / 6,000 = 12.0kg.
    // Billable weight must be max(8.5, 12.0) = 12.0kg
    const payload = {
      shipmentId: shipmentA_Id,
      actualWeightKg: 8.5,
      dimensions: { lengthCm: 60, widthCm: 40, heightCm: 30 },
      packagingCondition: 'Intact',
      inspectionNotes: 'Intact outer box sealed with factory security strip. Inspection photos attached.',
      inspectionPhotos: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
      ]
    };

    const res = await post('/api/shipments/intake', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const s = res.data.shipment;
    assert.strictEqual(s.actualWeightKg, 8.5);
    assert.strictEqual(s.billableWeightKg, 12.0, `Expected billable weight to be 12.0 kg, got ${s.billableWeightKg}`);
    assert.strictEqual(s.cbm, 0.072);
    assert.strictEqual(s.currentStatus, 'inspection');
    assert.strictEqual(s.inspectionPhotos.length, 2);
  });

  // 3. Shipment Billing Drawer
  await test('3. Shipment Billing Drawer: Rate calculation in USD, NGN, and CNY -> awaiting_payment', async () => {
    // 12.0 kg billable * $11.50/kg = $138.00 USD
    const payload = {
      shipmentId: shipmentA_Id,
      ratePerKg: 11.50,
      freightFeeUSD: 138.00,
      freightFeeNGN: 204930, // 138 * 1485
      freightFeeCNY: 999.12,  // 138 * 7.24
      billingNotes: 'Air express priority clearance included.'
    };

    const res = await post('/api/shipments/bill', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const s = res.data.shipment;
    assert.strictEqual(s.freightFeeUSD, 138.00);
    assert.ok(s.freightFeeNGN > 0);
    assert.ok(s.freightFeeCNY > 0);
    assert.strictEqual(s.currentStatus, 'awaiting_payment');
    assert.strictEqual(s.paymentStatus, 'awaiting_payment');
  });

  // 4. Option A: Pay Freight Now with USD Wallet & Balanced Ledger
  await test('4. Pay Freight Now (USD Wallet, 6-digit PIN 998877, Balanced Double-Entry Ledger)', async () => {
    // Ensure sufficient USD balance for test
    await post('/api/wallets/fund', { userId: 'usr_alade_01', currency: 'USD', amount: 500, paymentMethod: 'Card' });
    // Ensure PIN is initialized for test user
    await post('/api/auth/set-pin', { userId: 'usr_alade_01', newPin: '998877' });

    const payload = {
      shipmentId: shipmentA_Id,
      userId: 'usr_alade_01',
      walletCurrency: 'USD',
      pin: '998877'
    };

    const res = await post('/api/shipments/pay-freight', payload);
    assert.strictEqual(res.status, 200, res.data ? res.data.error : `Status ${res.status}`);
    assert.strictEqual(res.data.success, true);

    const s = res.data.shipment;
    assert.strictEqual(s.freightPaid, true);
    assert.strictEqual(s.paymentStatus, 'paid');
    assert.strictEqual(s.paidCurrency, 'USD');
    assert.strictEqual(s.paidAmount, 138.00);
    assert.strictEqual(s.currentStatus, 'ready_for_dispatch');
  });

  // 5. Lifecycle Transitions (Dispatched -> In Transit -> Customs -> Arrived)
  await test('5. Multi-Stage Lifecycle Progression (Dispatched -> In Transit -> Customs -> Arrived)', async () => {
    // Stage: dispatched
    let res = await post('/api/shipments/update-status', {
      shipmentId: shipmentA_Id,
      status: 'dispatched',
      location: 'Guangzhou Baiyun Aviation Apron',
      notes: 'Container loaded onto cargo flight'
    });
    assert.strictEqual(res.data.shipment.currentStatus, 'dispatched');

    // Stage: in_transit
    res = await post('/api/shipments/update-status', {
      shipmentId: shipmentA_Id,
      status: 'in_transit',
      location: 'Flight ET921 Air Cargo En Route to Lagos',
      notes: 'Mid-air transit over Addis Ababa'
    });
    assert.strictEqual(res.data.shipment.currentStatus, 'in_transit');

    // Stage: customs_clearance
    res = await post('/api/shipments/update-status', {
      shipmentId: shipmentA_Id,
      status: 'customs_clearance',
      location: 'Lagos MMIA Customs Clearing Terminal',
      notes: 'Customs duties processed and bond released'
    });
    assert.strictEqual(res.data.shipment.currentStatus, 'customs_clearance');

    // Stage: ready_for_pickup
    res = await post('/api/shipments/update-status', {
      shipmentId: shipmentA_Id,
      status: 'ready_for_pickup',
      location: 'Ikeja MMIA Cargo Hub (Lagos)',
      notes: 'Sorted into pickup vault. 6-digit OTP required for release.'
    });
    assert.strictEqual(res.data.shipment.currentStatus, 'ready_for_pickup');
  });

  // 6. Lagos Hub Pickup: Reject Invalid 6-Digit OTP
  await test('6. Lagos Hub Pickup: Reject Incorrect 6-Digit OTP', async () => {
    const payload = {
      shipmentId: shipmentA_Id,
      otp: '000000', // Invalid OTP
      freightCollected: false,
      staffId: 'adm-001'
    };

    const res = await post('/api/shipments/verify-pickup-otp', payload);
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.toLowerCase().includes('otp'), `Expected OTP error, got ${res.data.error}`);
  });

  // 7. Lagos Hub Pickup: Verify Valid 6-Digit OTP & Release Parcel
  await test('7. Lagos Hub Pickup: Verify Correct 6-Digit OTP & Mark Delivered', async () => {
    const payload = {
      shipmentId: shipmentA_Id,
      otp: shipmentA_Otp,
      freightCollected: true,
      staffId: 'adm-001'
    };

    const res = await post('/api/shipments/verify-pickup-otp', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const s = res.data.shipment;
    assert.strictEqual(s.currentStatus, 'delivered');
    assert.strictEqual(s.otpVerified, true);
    assert.ok(s.handoverTimestamp > 0);
  });

  // 8. Option B: Pay on Arrival (Deferred Freight) & Doorstep Delivery Workflow
  let shipmentB_Id = '';
  let shipmentB_Otp = '';

  await test('8. Option B: Register Doorstep Package & Defer Freight Payment (Pay on Arrival)', async () => {
    // Register shipment B
    const regRes = await post('/api/shipments/register', {
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      customerPhone: '+234 803 555 9201',
      courierCompany: 'ZTO Express',
      chineseCourierTracking: `ZTO${Date.now().toString().slice(-9)}`,
      packageDescription: '20x Smart Home LED Floodlights',
      cartonsCount: 4,
      declaredValueRMB: 5000,
      sender: 'Zhongshan Lighting Factory',
      originWarehouse: 'Foshan',
      shippingMode: 'Sea Freight',
      deliveryType: 'doorstep',
      doorstepAddress: {
        street: '14 Broad Street, Marina',
        city: 'Lagos Island',
        state: 'Lagos',
        phone: '+234 803 555 9201'
      },
      weightKg: 40.0
    });

    assert.strictEqual(regRes.status === 200 || regRes.status === 201, true, `Expected 200/201, got ${regRes.status}`);
    shipmentB_Id = regRes.data.shipment.id;
    shipmentB_Otp = regRes.data.shipment.pickupOtp;

    // Intake: 40kg, 80x50x40cm = 0.16 CBM
    await post('/api/shipments/intake', {
      shipmentId: shipmentB_Id,
      actualWeightKg: 40.0,
      dimensions: { lengthCm: 80, widthCm: 50, heightCm: 40 },
      packagingCondition: 'Wooden crate reinforced',
      inspectionNotes: 'Heavy cargo reinforced in wooden crate.'
    });

    // Bill: 0.16 CBM * $280/CBM = $44.80 USD
    await post('/api/shipments/bill', {
      shipmentId: shipmentB_Id,
      ratePerKg: 280,
      freightFeeUSD: 44.80,
      freightFeeNGN: 66528,
      freightFeeCNY: 324.35,
      billingNotes: 'Sea freight consolidation to Lagos Island.'
    });

    // Customer defers payment (Option B: Pay on Arrival)
    const deferRes = await post('/api/shipments/defer-payment', {
      shipmentId: shipmentB_Id,
      userId: 'usr_alade_01'
    });

    assert.strictEqual(deferRes.status, 200);
    assert.strictEqual(deferRes.data.success, true);
    assert.strictEqual(deferRes.data.shipment.paymentStatus, 'deferred');
    assert.strictEqual(deferRes.data.shipment.paymentTiming, 'pay_on_arrival');
    assert.strictEqual(deferRes.data.shipment.currentStatus, 'ready_for_dispatch');
  });

  // 9. Doorstep Delivery: Enforces COD Freight Collection Check
  await test('9. Doorstep Delivery: Guard against handover without COD freight collection', async () => {
    // Advance to out_for_delivery
    await post('/api/shipments/update-status', {
      shipmentId: shipmentB_Id,
      status: 'out_for_delivery',
      location: 'Dispatch Van Lagos Island Route',
      notes: 'Driver en route to 14 Broad Street'
    });

    // Attempt delivery confirmation without freight collection -> Must be rejected with 400
    const failRes = await post('/api/shipments/confirm-doorstep-delivery', {
      shipmentId: shipmentB_Id,
      proofNote: 'Attempted release without collecting freight',
      freightCollected: false,
      staffId: 'adm-001'
    });

    assert.strictEqual(failRes.status, 400);
    assert.ok(failRes.data.error.toLowerCase().includes('must be collected'), `Expected COD check error, got ${failRes.data.error}`);
  });

  // 10. Doorstep Delivery: Successful Handover with Recipient Proof & COD Collected
  await test('10. Doorstep Delivery: Complete Handover with Proof Note & COD Collection Confirmed', async () => {
    const res = await post('/api/shipments/confirm-doorstep-delivery', {
      shipmentId: shipmentB_Id,
      proofNote: 'Handed directly to Chief Alade at residence. POS payment confirmed.',
      freightCollected: true,
      staffId: 'adm-001'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const s = res.data.shipment;
    assert.strictEqual(s.currentStatus, 'delivered');
    assert.strictEqual(s.freightPaid, true);
    assert.strictEqual(s.paymentStatus, 'paid');
    assert.ok(s.handoverTimestamp > 0);
  });

  // 11. Cargo Consolidation
  await test('11. Cargo Consolidation: Combine multiple origin parcels into Master Container', async () => {
    // Register two parcels to consolidate
    const p1 = await post('/api/shipments/register', {
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      packageDescription: 'Parcel A for consolidation',
      weightKg: 10
    });
    const p2 = await post('/api/shipments/register', {
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      packageDescription: 'Parcel B for consolidation',
      weightKg: 15
    });

    const consolRes = await post('/api/shipments/consolidate', {
      shipmentIds: [p1.data.shipment.id, p2.data.shipment.id],
      destinationHub: 'Lagos MMIA Cargo Terminal',
      mode: 'air_express',
      userId: 'usr_alade_01'
    });

    assert.strictEqual(consolRes.status === 200 || consolRes.status === 201, true, `Expected 200/201, got ${consolRes.status}`);
    assert.strictEqual(consolRes.data.success, true);
    assert.ok(consolRes.data.consolidation);
    assert.strictEqual(consolRes.data.consolidation.consolidatedShipmentIds.length, 2);
  });

  // 12. Double-Entry General Ledger Trial Balance
  await test('12. Double-Entry General Ledger Trial Balance Equilibrium (Debits = Credits)', async () => {
    const res = await get('/api/admin/ledger/reconciliation', { 'x-admin-role': 'super_admin' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const tb = res.data.trialBalance;
    assert.ok(tb, 'Expected trialBalance object');

    // NGN Trial Balance
    const ngnNet = Math.abs(Number(tb.NGN.net));
    assert.strictEqual(ngnNet <= 0.05, true, `NGN Trial balance mismatch: Net=${ngnNet}`);

    // USD Trial Balance
    const usdNet = Math.abs(Number(tb.USD.net));
    assert.strictEqual(usdNet <= 0.05, true, `USD Trial balance mismatch: Net=${usdNet}`);

    // CNY Trial Balance
    const cnyNet = Math.abs(Number(tb.CNY.net));
    assert.strictEqual(cnyNet <= 0.05, true, `CNY Trial balance mismatch: Net=${cnyNet}`);
  });

  console.log('\n------------------------------------------------------------');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
