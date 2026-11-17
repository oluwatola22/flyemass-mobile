const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

function postRequest(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: urlPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, rawBody: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getRequest(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: urlPath,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, rawBody: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING LAGOS WAREHOUSE & LAST-MILE FULFILLMENT VERIFICATION ---');

  // Test 1: Verify SQL schema definition
  console.log('[Test 1] Verifying supabase-schema-rls.sql schema definitions...');
  const schemaPath = path.join(__dirname, '../supabase-schema-rls.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.lagos_hubs'), 'Missing public.lagos_hubs table definition');
  assert(schemaSql.includes('fulfillment_method VARCHAR(32) NOT NULL DEFAULT \'pickup\''), 'Missing fulfillment_method column in shipments');
  assert(schemaSql.includes('lagos_hub_id VARCHAR(64)'), 'Missing lagos_hub_id column in shipments');
  assert(schemaSql.includes('lagos_hub_label VARCHAR(120)'), 'Missing lagos_hub_label column in shipments');
  assert(schemaSql.includes('delivery_address JSONB'), 'Missing delivery_address JSONB column');
  assert(schemaSql.includes('pickup_otp VARCHAR(16)'), 'Missing pickup_otp column');
  assert(schemaSql.includes('pickup_otp_verified_at TIMESTAMPTZ'), 'Missing pickup_otp_verified_at column');
  assert(schemaSql.includes('CREATE OR REPLACE FUNCTION public.verify_pickup_otp'), 'Missing verify_pickup_otp RPC function');
  assert(schemaSql.includes('HUB-IKEJA'), 'Missing HUB-IKEJA seed data');
  assert(schemaSql.includes('HUB-ALABA'), 'Missing HUB-ALABA seed data');
  console.log('✅ Schema & RPC definitions verified.');

  // Test 2: Verify GET /api/lagos-hubs endpoint
  console.log('[Test 2] Querying GET /api/lagos-hubs endpoint...');
  const hubsRes = await getRequest('/api/lagos-hubs');
  assert.strictEqual(hubsRes.statusCode, 200, 'GET /api/lagos-hubs must return 200');
  assert(Array.isArray(hubsRes.body.hubs), 'Expected hubs array in response');
  assert(hubsRes.body.hubs.length >= 5, 'Expected at least 5 default Lagos hubs');
  const ikeja = hubsRes.body.hubs.find((h) => h.id === 'HUB-IKEJA');
  assert(ikeja, 'HUB-IKEJA must exist in response');
  assert.strictEqual(ikeja.district, 'Ikeja', 'HUB-IKEJA district should be Ikeja');
  console.log(`✅ Loaded ${hubsRes.body.hubs.length} Lagos hubs successfully. Pre-seeded Ikeja hub verified.`);

  // Test 3: Register package with Pickup Office & 4-Digit OTP
  console.log('[Test 3] Registering package with Pickup Office and 4-Digit OTP...');
  const regPayload = {
    userId: 'usr_alade_01',
    trackingNumber: 'FMLOS' + Math.floor(10000000 + Math.random() * 90000000),
    receiverName: 'Chief Babatunde Alade',
    originCountry: 'China',
    originWarehouse: 'Guangzhou Air Express Terminal',
    destination: 'Lagos Hub',
    weightKg: 8.5,
    shippingMode: 'Air Regular',
    mode: 'Air Freight',
    title: 'Flagship Electronics & Gadgets',
    fulfillmentMethod: 'pickup',
    lagosHubId: 'HUB-IKEJA',
    lagosHubLabel: 'Ikeja Hub (Central Lagos)',
    pickupOtp: '7492',
    adminId: 'adm-001'
  };
  const regRes = await postRequest('/api/shipments/register', regPayload);
  assert(regRes.statusCode === 200 || regRes.statusCode === 201, 'Register shipment must return 200 or 201');
  const shipment = regRes.body.shipment;
  assert(shipment, 'Shipment object must be returned');
  assert.strictEqual(shipment.fulfillmentMethod, 'pickup', 'Fulfillment method should be pickup');
  assert.strictEqual(shipment.lagosHubId, 'HUB-IKEJA', 'Lagos Hub ID must be HUB-IKEJA');
  assert.strictEqual(shipment.pickupOtp, '7492', 'Pickup OTP must be 7492');
  console.log(`✅ Package registered with tracking ${shipment.trackingCode || shipment.trackingNumber} and 4-digit OTP: ${shipment.pickupOtp}`);

  // Test 4: Counter Verification with Wrong OTP (Security check)
  console.log('[Test 4] Verifying counter release rejection with incorrect OTP...');
  const wrongOtpRes = await postRequest('/api/shipments/verify-pickup-otp', {
    shipmentId: shipment.id,
    otp: '0000',
    adminId: 'adm-001'
  });
  assert.strictEqual(wrongOtpRes.statusCode, 400, 'Invalid OTP should return 400');
  assert(wrongOtpRes.body.error.toLowerCase().includes('invalid') || wrongOtpRes.body.error.toLowerCase().includes('mismatch'), 'Should report invalid OTP');
  console.log('✅ Correctly rejected invalid OTP "0000".');

  // Test 5: Counter Verification with Correct 4-Digit OTP
  console.log('[Test 5] Verifying counter release with correct 4-Digit OTP 7492...');
  const validOtpRes = await postRequest('/api/shipments/verify-pickup-otp', {
    shipmentId: shipment.id,
    otp: '7492',
    freightCollected: true,
    adminId: 'adm-001'
  });
  assert.strictEqual(validOtpRes.statusCode, 200, 'Valid OTP should return 200');
  assert(validOtpRes.body.success, 'Verification should be marked successful');
  assert.strictEqual(validOtpRes.body.shipment.status, 'completed', 'Status should advance to completed');
  assert.strictEqual(validOtpRes.body.shipment.currentStatus, 'completed', 'Current status should advance to completed');
  assert(validOtpRes.body.shipment.pickupOtpVerifiedAt, 'pickupOtpVerifiedAt timestamp must be recorded');
  console.log(`✅ 4-Digit OTP verified! Status: ${validOtpRes.body.shipment.currentStatus}, VerifiedAt: ${validOtpRes.body.shipment.pickupOtpVerifiedAt}`);

  // Test 6: Register Package for Doorstep Delivery & Rider Assignment
  console.log('[Test 6] Registering package for Doorstep Delivery & assigning courier rider...');
  const doorstepTracking = 'FMLOS' + Math.floor(10000000 + Math.random() * 90000000);
  const doorstepRegRes = await postRequest('/api/shipments/register', {
    userId: 'usr_alade_01',
    trackingNumber: doorstepTracking,
    receiverName: 'Chief Babatunde Alade',
    originCountry: 'USA',
    originWarehouse: 'New York JFK Hub',
    destination: 'Lagos Doorstep',
    weightKg: 12.0,
    shippingMode: 'Air Express',
    mode: 'Air Freight',
    title: 'Apparel & High Fashion Samples',
    fulfillmentMethod: 'delivery',
    deliveryAddress: {
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      phone: '+234 803 123 4567',
      deliveryNotes: 'Leave with concierge at reception'
    },
    pickupOtp: '8910',
    adminId: 'adm-001'
  });
  assert(doorstepRegRes.statusCode === 200 || doorstepRegRes.statusCode === 201, 'Register doorstep shipment must return 200 or 201');
  const doorstepShipment = doorstepRegRes.body.shipment;
  assert.strictEqual(doorstepShipment.fulfillmentMethod, 'delivery');
  assert.strictEqual(doorstepShipment.deliveryAddress.city, 'Lekki');

  // Test 7: Assign Courier Rider
  console.log('[Test 7] Assigning dispatch courier rider...');
  const assignRes = await postRequest('/api/shipments/assign-rider', {
    shipmentId: doorstepShipment.id,
    riderName: 'Tunde Balogun (Express Fleet)',
    riderPhone: '+234 803 999 8888',
    adminId: 'adm-001'
  });
  assert.strictEqual(assignRes.statusCode, 200, 'Assign rider must return 200');
  assert.strictEqual(assignRes.body.shipment.assignedRiderName, 'Tunde Balogun (Express Fleet)');
  assert.strictEqual(assignRes.body.shipment.currentStatus, 'out_for_delivery');
  console.log(`✅ Rider assigned: ${assignRes.body.shipment.assignedRiderName}. Parcel status: ${assignRes.body.shipment.currentStatus}`);

  // Test 8: On-the-fly fulfillment conversion test
  console.log('[Test 8] Converting fulfillment method from delivery to hub pickup...');
  const convertRes = await postRequest('/api/shipments/convert-fulfillment', {
    shipmentId: doorstepShipment.id,
    fulfillmentMethod: 'pickup',
    details: {
      lagosHubId: 'HUB-LEKKI',
      lagosHubLabel: 'Lekki Hub (Admiralty Way)'
    }
  });
  assert.strictEqual(convertRes.statusCode, 200, 'Conversion must return 200');
  assert.strictEqual(convertRes.body.shipment.fulfillmentMethod, 'pickup');
  assert.strictEqual(convertRes.body.shipment.lagosHubId, 'HUB-LEKKI');
  console.log(`✅ Successfully converted fulfillment to pickup at ${convertRes.body.shipment.lagosHubLabel}`);

  console.log('\n======================================================');
  console.log('🎉 ALL LAGOS WAREHOUSE & LAST-MILE TESTS PASSED (8/8)!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
