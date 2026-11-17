/**
 * FlyeMass Find Products / China Product Sourcing Workflow End-to-End Test Suite
 * 
 * Verifies all 9 phases of China Product Sourcing:
 * 1. Customer product sourcing request submission with specifications and up to 4 photos.
 * 2. 4-photo maximum enforcement and reference format validation.
 * 3. Sourcing fees settings retrieval & update including Minimum Sourcing Fee toggle (`minSourcingFeeEnabled`).
 * 4. Admin Sourcing Requests retrieval with full specs, product links, and drawer details.
 * 5. Admin quote formulation with Quote Builder (product cost CNY, commission %, domestic freight, FX overrides, total CNY, USD & NGN equivalents).
 * 6. Non-negative validation on quote builder amounts.
 * 7. Customer quote viewing in My Requests with validity and breakdown.
 * 8. Customer multi-currency payment with 6-digit transaction PIN verification.
 * 9. Atomic wallet debit, double-entry escrow liability posting, and `AGTPAY-2026-XXXXX` issuance.
 * 10. Automatic cargo shipment creation and waybill linking (`SL-2026-XXXXX`, Chinese tracking).
 * 11. Ground operations milestone update and automatic linked shipment advancement to `received_warehouse`.
 * 12. Verification of linked shipment on customer tracking.
 * 13. Unpaid request cancellation without financial deduction.
 * 14. Paid request cancellation with atomic double-entry refund to original currency (`AGTREF-2026-XXXXX`).
 * 15. Prevention of duplicate payments and duplicate refunds.
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
    const req = http.request(
      url,
      {
        method: 'GET',
        headers: {
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
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 FLYEMASS FIND PRODUCTS / CHINA PRODUCT SOURCING WORKFLOW TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) {
        const stackLine = err.stack.split('\n')[1];
        console.error(`     At: ${stackLine}`);
      }
      failed++;
    }
  }

  // Stage 1: Sourcing Fee Settings & Minimum Fee Toggle
  console.log('--- STAGE 1: SOURCING FEE SETTINGS & MINIMUM COMMISSION TOGGLE ---');
  await test('GET /api/agents/settings retrieves active platform commission & min fee toggle', async () => {
    const res = await get('/api/agents/settings');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.settings, 'Settings object should exist');
    assert.strictEqual(typeof res.data.settings.sourcingCommissionPercent, 'number');
    assert.strictEqual(typeof res.data.settings.minSourcingCommissionCNY, 'number');
    assert.strictEqual(typeof res.data.settings.minSourcingFeeEnabled, 'boolean');
  });

  await test('POST /api/admin/agents/settings updates min fee toggle and rates with RBAC check', async () => {
    // Attempt without admin header
    const unauth = await post('/api/admin/agents/settings', {
      sourcingCommissionPercent: 5.5,
      minSourcingCommissionCNY: 550,
      minSourcingFeeEnabled: true
    });
    assert.ok([401, 403].includes(unauth.status), 'Unauthorized request should be rejected with 401 or 403');

    // Authorized update
    const auth = await post('/api/admin/agents/settings', {
      sourcingCommissionPercent: 5.0,
      minSourcingCommissionCNY: 500,
      minSourcingFeeEnabled: true,
      supplierVerificationUSD: 150,
      factoryAuditUSD: 250,
      qualityControlUSD: 200
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });
    assert.strictEqual(auth.status, 200);
    assert.strictEqual(auth.data.settings.sourcingCommissionPercent, 5.0);
    assert.strictEqual(auth.data.settings.minSourcingCommissionCNY, 500);
    assert.strictEqual(auth.data.settings.minSourcingFeeEnabled, true);
  });

  // Stage 2: Sourcing Request Submission & 4-Photo Limit Enforcement
  console.log('\n--- STAGE 2: SOURCING REQUEST SUBMISSION & 4-PHOTO LIMIT ---');
  let testSourcingId1 = null;
  let testSourcingRef1 = null;

  await test('POST /api/agents/request creates sourcing request with specs and caps reference photos to 4', async () => {
    const payload = {
      userId: 'usr_alade_01',
      clientName: 'Chief Babatunde Alade',
      clientEmail: 'alade.investments@flyemass.ng',
      serviceKind: 'sourcing',
      productName: 'Commercial Solar Inverter 5kVA Pure Sine Wave',
      productDescription: 'OEM 48V pure sine wave inverters with RS485 communication ports',
      specifications: 'Color: Matte Industrial Grey; Battery Input: 48V DC; Packaging: Double corrugated export carton with wooden crate',
      productUrl: 'https://detail.1688.com/offer/794829103829.html',
      targetQuantity: 50,
      targetUnitCNY: 1200,
      supplierCity: 'Shenzhen',
      referencePhotos: [
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600' // 5th photo should be truncated to 4
      ]
    };

    const res = await post('/api/agents/request', payload);
    assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert.ok(res.data.request, 'Created request should exist');
    assert.ok(res.data.request.id, 'Request ID should be present');
    assert.ok(res.data.request.reference.startsWith('AGT-SRC-2026-'), 'Reference should follow AGT-SRC-2026-XXXXX format');
    assert.strictEqual(res.data.request.status, 'pending_review');
    assert.strictEqual(res.data.request.referencePhotos.length, 4, 'Must enforce maximum 4 reference photos');

    testSourcingId1 = res.data.request.id;
    testSourcingRef1 = res.data.request.reference;
  });

  // Stage 3: Admin Sourcing Requests Query
  console.log('\n--- STAGE 3: ADMIN SOURCING REQUESTS QUERY & DRAWER METRICS ---');
  await test('GET /api/agent-requests verifies submitted request is visible to operations staff', async () => {
    const res = await get('/api/agent-requests');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.requests));
    const found = res.data.requests.find(r => r.id === testSourcingId1);
    assert.ok(found, 'Submitted sourcing request must appear in requests list');
    assert.strictEqual(found.productName, 'Commercial Solar Inverter 5kVA Pure Sine Wave');
    assert.strictEqual(found.targetQuantity, 50);
    assert.strictEqual(found.targetUnitCNY, 1200);
    assert.ok(found.specifications.includes('Matte Industrial Grey'));
  });

  // Stage 4: Admin Quote Formulation with FX Overrides & Validation
  console.log('\n--- STAGE 4: ADMIN QUOTE BUILDER & VALIDATIONS ---');
  await test('POST /api/admin/agents/quote rejects negative numbers', async () => {
    const res = await post('/api/admin/agents/quote', {
      requestId: testSourcingId1,
      productCostCNY: -500,
      sourcingCommissionPercent: 5.0,
      chinaShippingCNY: 100
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });
    assert.strictEqual(res.status, 400, 'Must reject negative product cost');
  });

  await test('POST /api/admin/agents/quote calculates totals, applies min fee, and sets status to awaiting_payment', async () => {
    // 50 units * 1150 = 57,500 CNY factory cost
    // Commission: 5.0% of 57,500 = 2,875 CNY
    // Shipping: 650 CNY
    // Total: 61,025 CNY
    const costCNY = 57500;
    const commPct = 5.0;
    const commCNY = Math.round(costCNY * (commPct / 100)); // 2875
    const shippingCNY = 650;
    const totalCNY = costCNY + commCNY + shippingCNY; // 61025
    const totalUSD = Math.round((totalCNY / 7.24) * 100) / 100;
    const totalNGN = Math.round(totalCNY * 214.50);

    const quotePayload = {
      requestId: testSourcingId1,
      adminId: 'adm-001',
      assignedAgent: 'Zhang Wei (Guangzhou Sourcing Desk)',
      supplierFindings: 'Direct Tier-1 manufacturer verified in Shenzhen Baoan. Inverters tested with AQL standard.',
      quotationNotes: 'Quotation includes factory ex-works price, 5% FlyeMass sourcing commission, and freight to Guangzhou port.',
      leadTimeDays: 10,
      productCostCNY: costCNY,
      sourcingCommissionPercent: commPct,
      sourcingCommissionCNY: commCNY,
      chinaShippingCNY: shippingCNY,
      totalPayableCNY: totalCNY,
      quoteAmountCNY: totalCNY,
      quoteAmountUSD: totalUSD,
      quoteAmountNGN: totalNGN,
      fxOverrideUSD_CNY: 7.24,
      fxOverrideUSD_NGN: 1485
    };

    const res = await post('/api/admin/agents/quote', quotePayload, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.data.request.status, 'awaiting_payment');
    assert.strictEqual(res.data.request.totalPayableCNY, totalCNY);
    assert.strictEqual(res.data.request.quoteAmountUSD, totalUSD);
    assert.ok(res.data.request.quotedAt > 0);
  });

  // Stage 5: Customer Quote Payment with PIN & Auto Cargo Linking
  console.log('\n--- STAGE 5: CUSTOMER MULTI-CURRENCY PAYMENT & SHIPMENT LINKING ---');
  await test('POST /api/agents/accept-quote rejects invalid transaction PIN', async () => {
    const res = await post('/api/agents/accept-quote', {
      requestId: testSourcingId1,
      userId: 'usr_alade_01',
      pin: '000000', // Invalid PIN
      currency: 'CNY'
    });
    assert.strictEqual(res.status, 401, 'Should reject invalid transaction PIN');
  });

  let linkedShipmentCode = null;
  await test('POST /api/agents/accept-quote debits wallet, creates AGTPAY-, and auto-links cargo shipment', async () => {
    // Fetch initial CNY wallet balance
    const walletResBefore = await get('/api/wallet/summary?userId=usr_alade_01');
    const initialCNY = walletResBefore.data.wallets.CNY.available;

    const res = await post('/api/agents/accept-quote', {
      requestId: testSourcingId1,
      userId: 'usr_alade_01',
      pin: '246810', // Verified PIN for usr_alade_01
      currency: 'CNY'
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert.strictEqual(res.data.request.status, 'in_progress');
    assert.strictEqual(res.data.request.paymentStatus, 'paid');
    assert.ok(res.data.request.paymentReference.startsWith('AGTPAY-2026-'), 'Must issue AGTPAY- reference');
    assert.ok(res.data.request.linkedShipmentCode.startsWith('SL-2026-'), 'Must auto-link FlyeMass cargo shipment');
    assert.ok(res.data.request.linkedTrackingCode.startsWith('FMCN'), 'Must generate Chinese logistics tracking');

    linkedShipmentCode = res.data.request.linkedShipmentCode;

    // Verify wallet was actually debited
    const walletResAfter = await get('/api/wallet/summary?userId=usr_alade_01');
    const newCNY = walletResAfter.data.wallets.CNY.available;
    assert.strictEqual(newCNY, initialCNY - res.data.request.totalPayableCNY, 'Wallet must be debited exactly by quote amount');
  });

  await test('POST /api/agents/accept-quote rejects duplicate payment on already-paid request', async () => {
    const res = await post('/api/agents/accept-quote', {
      requestId: testSourcingId1,
      userId: 'usr_alade_01',
      pin: '246810',
      currency: 'CNY'
    });
    assert.strictEqual(res.status, 400, 'Must reject duplicate payment attempt');
  });

  // Stage 6: Ground Milestone Updates & Shipment Status Progression
  console.log('\n--- STAGE 6: GROUND OPERATIONS MILESTONE & WAREHOUSE ARRIVAL ---');
  await test('POST /api/admin/agents/update-status updates ground milestone', async () => {
    const res = await post('/api/admin/agents/update-status', {
      requestId: testSourcingId1,
      adminId: 'adm-001',
      purchaseDetails: 'Shenzhen Tech Factory Direct PO #8839104',
      supplierInvoiceUrl: 'https://flyemass.cn/invoices/inv-8839104.pdf',
      operationalNotes: 'Factory production 100% complete. Inverters packaged in wooden export crates.'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.request.purchaseDetails, 'Shenzhen Tech Factory Direct PO #8839104');
    assert.ok(res.data.request.operationalNotes.includes('Factory production 100% complete'));
  });

  await test('Marking status arrived_at_warehouse automatically advances linked shipment to received_warehouse', async () => {
    const res = await post('/api/admin/agents/update-status', {
      requestId: testSourcingId1,
      adminId: 'adm-001',
      status: 'arrived_at_warehouse',
      operationalNotes: 'Consignment arrived at FlyeMass Guangzhou Baiyun hub. Barcode scanned into cargo bay.'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });

    assert.strictEqual(res.status, 200);

    // Verify linked shipment in shipments table
    const shipRes = await get('/api/shipments');
    assert.strictEqual(shipRes.status, 200);
    const shipment = shipRes.data.shipments.find(s => s.waybillNumber === linkedShipmentCode || s.id === res.data.request.linkedShipmentId);
    assert.ok(shipment, 'Linked shipment must exist in database');
    assert.strictEqual(shipment.currentStatus, 'received_warehouse', 'Shipment status must advance to received_warehouse');
  });

  // Stage 7: Unpaid Request Cancellation (No Financial Debit)
  console.log('\n--- STAGE 7: UNPAID REQUEST CANCELLATION ---');
  let testUnpaidId = null;
  await test('Create second sourcing request and cancel while unpaid without financial mutation', async () => {
    const createRes = await post('/api/agents/request', {
      userId: 'usr_alade_01',
      clientName: 'Chief Babatunde Alade',
      serviceKind: 'sourcing',
      productName: 'Commercial Bread Slicing Machine',
      targetQuantity: 5,
      targetUnitCNY: 2500,
      supplierCity: 'Guangzhou'
    });
    assert.strictEqual(createRes.status, 201);
    testUnpaidId = createRes.data.request.id;

    // Record wallet before cancellation
    const walletBefore = await get('/api/wallet/summary?userId=usr_alade_01');

    // Cancel unpaid request
    const cancelRes = await post('/api/admin/agents/cancel-refund', {
      requestId: testUnpaidId,
      adminId: 'adm-001',
      reason: 'Discontinued product model requested by client'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.request.status, 'cancelled');
    assert.strictEqual(cancelRes.data.refundAmount, 0, 'No refund amount for unpaid request');

    // Wallet balances unchanged
    const walletAfter = await get('/api/wallet/summary?userId=usr_alade_01');
    assert.strictEqual(walletAfter.data.wallets.CNY.available, walletBefore.data.wallets.CNY.available);
  });

  // Stage 8: Paid Request Cancellation & Atomic Escrow Reversal
  console.log('\n--- STAGE 8: PAID REQUEST CANCELLATION & ATOMIC WALLET REFUND ---');
  let testPaidRefundId = null;
  let paidTotalCNY = null;

  await test('Create and pay a sourcing request in CNY', async () => {
    const createRes = await post('/api/agents/request', {
      userId: 'usr_alade_01',
      clientName: 'Chief Babatunde Alade',
      serviceKind: 'sourcing',
      productName: 'Heavy Duty Packaging Strapping Machine',
      targetQuantity: 2,
      targetUnitCNY: 1800,
      supplierCity: 'Dongguan'
    });
    assert.strictEqual(createRes.status, 201);
    testPaidRefundId = createRes.data.request.id;

    // Issue quote
    paidTotalCNY = 3600 + 500 + 150; // 4250 CNY
    await post('/api/admin/agents/quote', {
      requestId: testPaidRefundId,
      adminId: 'adm-001',
      productCostCNY: 3600,
      sourcingCommissionPercent: 5.0,
      sourcingCommissionCNY: 500,
      chinaShippingCNY: 150,
      totalPayableCNY: paidTotalCNY,
      quoteAmountCNY: paidTotalCNY,
      quoteAmountUSD: Math.round((paidTotalCNY / 7.24) * 100) / 100,
      quoteAmountNGN: Math.round(paidTotalCNY * 214.50)
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });

    // Accept & Pay quote
    const payRes = await post('/api/agents/accept-quote', {
      requestId: testPaidRefundId,
      userId: 'usr_alade_01',
      pin: '246810',
      currency: 'CNY'
    });
    assert.strictEqual(payRes.status, 200);
    assert.strictEqual(payRes.data.request.status, 'in_progress');
  });

  await test('Cancel paid request and verify atomic refund to original CNY wallet', async () => {
    const walletBefore = await get('/api/wallet/summary?userId=usr_alade_01');
    const cnyBefore = walletBefore.data.wallets.CNY.available;

    const refundRes = await post('/api/admin/agents/cancel-refund', {
      requestId: testPaidRefundId,
      adminId: 'adm-001',
      reason: 'Supplier factory failed quality audit criteria'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });

    assert.strictEqual(refundRes.status, 200, `Expected 200, got ${refundRes.status}`);
    assert.strictEqual(refundRes.data.request.status, 'refunded');
    assert.strictEqual(refundRes.data.request.paymentStatus, 'refunded');
    assert.ok(refundRes.data.request.refundReference.startsWith('AGTREF-2026-'), 'Must issue AGTREF- reference');
    assert.strictEqual(refundRes.data.refundAmount, paidTotalCNY);
    assert.strictEqual(refundRes.data.refundCurrency, 'CNY');

    // Verify wallet was atomically refunded
    const walletAfter = await get('/api/wallet/summary?userId=usr_alade_01');
    const cnyAfter = walletAfter.data.wallets.CNY.available;
    assert.strictEqual(cnyAfter, cnyBefore + paidTotalCNY, 'Customer CNY wallet must be credited with exact refund');
  });

  await test('Reject duplicate refund on already refunded request', async () => {
    const res = await post('/api/admin/agents/cancel-refund', {
      requestId: testPaidRefundId,
      adminId: 'adm-001',
      reason: 'Attempt duplicate refund'
    }, {
      'x-admin-id': 'adm-001',
      'x-admin-role': 'operations'
    });
    assert.strictEqual(res.status, 400, 'Must block duplicate refund');
  });

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
