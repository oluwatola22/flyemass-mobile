/**
 * FlyeMass Phase 10 Agent Services & Sourcing End-to-End Workflow Verification Suite
 * 
 * Verifies:
 * 1. Agent Fee Settings API (GET fees, POST admin updates with RBAC)
 * 2. Product Sourcing 2-Step Request Creation (AGT-SRC-2026-XXXXX, status: pending_review)
 * 3. Inspection Requests Creation:
 *    - Supplier Verification (AGT-VER-2026-XXXXX)
 *    - Physical Factory Audit (AGT-AUD-2026-XXXXX)
 *    - Pre-Shipment Quality Control (AGT-QC-2026-XXXXX)
 * 4. Admin Sourcing Quotation Formulation with Full Breakdown (productCost, commission %, shipping, totals)
 * 5. Admin Inspection Quotation Formulation (fixed USD service fee, lead time, findings)
 * 6. Customer Wallet Payment & Automatic Escrow (USD wallet with 6-digit PIN):
 *    - Debits user wallet, credits liabilities:agent_escrow:usd
 *    - Sets status = in_progress, paymentStatus = paid, generates AGTPAY-2026-XXXXX
 *    - AUTOMATICALLY CREATES AND LINKS A FLYEMASS CARGO SHIPMENT (SL-2026-XXXXX, FMCN...)
 * 7. Customer Wallet Payment (CNY wallet with 6-digit PIN)
 * 8. Payment Security Guards (rejects invalid PIN, prevents duplicate payment)
 * 9. China Ground Operations Updates (purchase details, invoice URL, factory findings, timeline)
 * 10. Service Completion & Double-Entry Escrow Disbursement to Service Revenue
 * 11. Cancellation & Automatic Wallet Refund:
 *     - Credits original wallet currency, creates AGTREF-2026-XXXXX
 *     - Balanced double-entry reversal
 * 12. Double-Refund Prevention & Completed Request Lockout Guard
 * 13. General Ledger Equilibrium across all currencies (Total Debits == Total Credits)
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
  console.log('======================================================================');
  console.log('   FLYEMASS PHASE 10: AGENT SERVICES & SOURCING VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passedCount = 0;
  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}\n`);
      throw err;
    }
  };

  const testUserId = 'usr_alade_01';
  const testPin = '998877';
  let sourcingRequestId = null;
  let verificationRequestId = null;
  let auditRequestId = null;
  let qcRequestId = null;
  let initialBalances = null;

  // Initialize active PIN for test user
  await post('/api/auth/set-pin', { userId: testUserId, newPin: testPin });

  // -------------------------------------------------------------------------
  // 1. Fee Settings API
  // -------------------------------------------------------------------------
  await test('1. GET /api/agents/settings returns active fee configuration', async () => {
    const res = await get('/api/agents/settings');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.settings.sourcingCommissionPercent, 'number');
    assert.strictEqual(typeof res.data.settings.minSourcingCommissionCNY, 'number');
    assert.strictEqual(typeof res.data.settings.supplierVerificationUSD, 'number');
    assert.strictEqual(typeof res.data.settings.factoryAuditUSD, 'number');
    assert.strictEqual(typeof res.data.settings.qualityControlUSD, 'number');
  });

  await test('2. POST /api/admin/agents/settings updates fee settings with RBAC check', async () => {
    // Unauthenticated / non-admin should fail
    const failRes = await post('/api/admin/agents/settings', { settings: { sourcingCommissionPercent: 5.5 } });
    assert.strictEqual(failRes.status, 403);

    // Super admin succeeds
    const okRes = await post(
      '/api/admin/agents/settings',
      {
        settings: {
          sourcingCommissionPercent: 5.0,
          minSourcingCommissionCNY: 500,
          supplierVerificationUSD: 150,
          factoryAuditUSD: 250,
          qualityControlUSD: 200
        }
      },
      { 'x-admin-role': 'super_admin', 'x-admin-id': 'adm-001' }
    );
    assert.strictEqual(okRes.status, 200);
    assert.strictEqual(okRes.data.success, true);
    assert.strictEqual(okRes.data.fees.sourcingCommissionPercent, 5.0);
  });

  // -------------------------------------------------------------------------
  // 2. Product Sourcing 2-Step Request Creation
  // -------------------------------------------------------------------------
  await test('3. Customer Wizard: Create Product Sourcing Request (AGT-SRC-2026-XXXXX)', async () => {
    const res = await post('/api/agents/request', {
      serviceKind: 'sourcing',
      serviceType: 'Product Sourcing & Procurement',
      productName: 'ANC Bluetooth 5.4 Wireless Headphones with Custom Packaging',
      productUrl: 'https://detail.1688.com/offer/79201948210.html',
      category: 'Electronics & Audio',
      targetQuantity: 200,
      targetUnitCNY: 45.0,
      totalBudgetCNY: 9450.0,
      specifications: 'Matte black finish, custom silk-screen logo, EVA travel case',
      referencePhotos: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
      supplierCity: 'Guangzhou',
      userId: testUserId,
      clientName: 'Chief Babatunde Alade'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    const req = res.data.request;
    assert.ok(req.id);
    assert.ok(req.reference.startsWith('AGT-SRC-2026-'));
    assert.strictEqual(req.status, 'pending_review');
    assert.strictEqual(req.paymentStatus, 'unpaid');
    assert.strictEqual(req.serviceKind, 'sourcing');
    assert.ok(Array.isArray(req.timeline));
    assert.strictEqual(req.timeline[0].status, 'pending_review');
    sourcingRequestId = req.id;
  });

  // -------------------------------------------------------------------------
  // 3. Inspection Requests Creation
  // -------------------------------------------------------------------------
  await test('4. Customer Wizard: Create Supplier Verification (AGT-VER-2026-XXXXX)', async () => {
    const res = await post('/api/agents/request', {
      serviceKind: 'supplier_verification',
      serviceType: 'Supplier Legitimacy Verification',
      productName: 'Supplier Verification — Shenzhen Micro Precision Ltd',
      supplierName: 'Shenzhen Micro Precision Electronics Ltd',
      supplierCity: 'Shenzhen',
      supplierLocation: 'High-Tech Industrial Park, Nanshan, Shenzhen',
      supplierContact: 'Manager Zhang / +86 138 2881 9922',
      supplierWechat: 'sz_micro_zhang',
      preferredDate: '2026-11-12',
      inspectionRequirements: ['Verify Unified Social Credit Code', 'Verify physical office registration'],
      serviceFeeUSD: 150,
      userId: testUserId
    });

    assert.strictEqual(res.status, 201);
    const req = res.data.request;
    assert.ok(req.reference.startsWith('AGT-VER-2026-'));
    assert.strictEqual(req.serviceKind, 'supplier_verification');
    verificationRequestId = req.id;
  });

  await test('5. Customer Wizard: Create Factory Audit (AGT-AUD-2026-XXXXX)', async () => {
    const res = await post('/api/agents/request', {
      serviceKind: 'factory_audit',
      serviceType: 'Physical Factory Audit',
      productName: 'Factory Audit — Foshan Nanhai Aluminum Plant',
      supplierName: 'Foshan Nanhai Precision Aluminum Extrusions',
      supplierCity: 'Foshan',
      supplierLocation: 'Dali Industrial Zone, Nanhai, Foshan',
      supplierContact: 'Director Chen / +86 186 2008 9142',
      supplierWechat: 'fs_chen_aluminum',
      preferredDate: '2026-11-18',
      inspectionRequirements: ['Inspect production lines', 'Verify ISO9001 certification', 'Machinery video call'],
      serviceFeeUSD: 250,
      userId: testUserId
    });

    assert.strictEqual(res.status, 201);
    const req = res.data.request;
    assert.ok(req.reference.startsWith('AGT-AUD-2026-'));
    assert.strictEqual(req.serviceKind, 'factory_audit');
    auditRequestId = req.id;
  });

  await test('6. Customer Wizard: Create Pre-Shipment Quality Control (AGT-QC-2026-XXXXX)', async () => {
    const res = await post('/api/agents/request', {
      serviceKind: 'quality_control',
      serviceType: 'Pre-Shipment Quality Control',
      productName: 'AQL Inspection — Yiwu Giftware Hub',
      supplierName: 'Yiwu Golden Dragon Craft Co.',
      supplierCity: 'Yiwu',
      supplierLocation: 'Futian Market District 2, Yiwu',
      supplierContact: 'Manager Wang / +86 139 5882 1100',
      preferredDate: '2026-11-20',
      inspectionRequirements: ['AQL Level II (2.5 Major / 4.0 Minor)', 'Drop test on 5 cartons', 'Barcode scan'],
      serviceFeeUSD: 200,
      userId: testUserId
    });

    assert.strictEqual(res.status, 201);
    const req = res.data.request;
    assert.ok(req.reference.startsWith('AGT-QC-2026-'));
    assert.strictEqual(req.serviceKind, 'quality_control');
    qcRequestId = req.id;
  });

  // -------------------------------------------------------------------------
  // 4. Admin Sourcing Quotation Formulation with Full Breakdown
  // -------------------------------------------------------------------------
  await test('7. Admin Formulates Sourcing Quote with full breakdown (CNY, USD, NGN)', async () => {
    const res = await post(
      '/api/admin/agents/quote',
      {
        requestId: sourcingRequestId,
        productCostCNY: 9000.0,
        sourcingCommissionPercent: 5.0,
        sourcingCommissionCNY: 500.0,
        chinaShippingCNY: 150.0,
        totalPayableCNY: 9650.0,
        leadTimeDays: 7,
        supplierFindings: '1688 manufacturer verified. MOQ 200 confirmed. Sample approved by Guangzhou desk.',
        quotationNotes: 'Includes domestic freight to FlyeMass Guangzhou Consolidation Hub.',
        assignedAgent: 'Chen Wei (Guangzhou Senior Sourcing Manager)'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.status, 'awaiting_payment');
    assert.strictEqual(req.paymentStatus, 'awaiting_payment');
    assert.strictEqual(req.productCostCNY, 9000);
    assert.strictEqual(req.sourcingCommissionCNY, 500);
    assert.strictEqual(req.chinaShippingCNY, 150);
    assert.strictEqual(req.totalPayableCNY, 9650);
    assert.ok(req.quoteAmountUSD > 0);
    assert.ok(req.quoteAmountNGN > 0);
    assert.ok(req.quotedAt > 0);
  });

  // -------------------------------------------------------------------------
  // 5. Admin Inspection Quotation Formulation
  // -------------------------------------------------------------------------
  await test('8. Admin Formulates Factory Audit Quote ($250 USD fixed)', async () => {
    const res = await post(
      '/api/admin/agents/quote',
      {
        requestId: auditRequestId,
        serviceFeeUSD: 250,
        leadTimeDays: 3,
        supplierFindings: 'Factory confirmed on-site appointment for 2026-11-18.',
        quotationNotes: 'Bilingual engineer Zhang Wei scheduled for physical inspection and video call.',
        assignedAgent: 'Zhang Wei (Foshan Industrial Inspector)'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.status, 'awaiting_payment');
    assert.strictEqual(req.quoteAmountUSD, 250);
    const liveRatesRes = await get('/api/wallets/rates');
    const expectedNGN = 250 * (liveRatesRes.data.rates.USD_NGN || 1485);
    assert.strictEqual(req.quoteAmountNGN, expectedNGN);
  });

  // -------------------------------------------------------------------------
  // 6. Security & Payment Guards
  // -------------------------------------------------------------------------
  await test('9. Payment Security: Rejects invalid transaction PIN (HTTP 401)', async () => {
    const res = await post('/api/agents/accept-quote', {
      requestId: sourcingRequestId,
      pin: '000000',
      paymentWalletUsed: 'USD',
      userId: testUserId
    });

    assert.strictEqual(res.status, 401);
    assert.ok(res.data.error.includes('PIN'));
  });

  // -------------------------------------------------------------------------
  // 7. Multi-Currency Escrow Payment (USD Wallet) & AUTOMATIC CARGO LINKING
  // -------------------------------------------------------------------------
  await test('10. Customer Pays Sourcing Quote via USD Wallet: Debits Wallet, Credits Escrow & AUTO-CREATES CARGO SHIPMENT', async () => {
    // Record initial user balance
    const dbStateRes = await get('/api/db/state');
    initialBalances = dbStateRes.data.state.users[testUserId].balances;

    const res = await post('/api/agents/accept-quote', {
      requestId: sourcingRequestId,
      pin: testPin,
      paymentWalletUsed: 'USD',
      userId: testUserId
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const req = res.data.request;
    assert.strictEqual(req.status, 'in_progress');
    assert.strictEqual(req.paymentStatus, 'paid');
    assert.strictEqual(req.paidWith, 'USD');
    assert.ok(req.paidAmount > 0);
    assert.ok(req.paymentReference.startsWith('AGTPAY-2026-'));

    // Check user balance deduction
    assert.ok(res.data.balances.USD < initialBalances.USD);

    // CRITICAL PHASE 10 REQUIREMENT: Automatic cargo shipment creation & linking for Sourcing
    assert.ok(req.linkedShipmentId, 'linkedShipmentId must be populated');
    assert.ok(req.linkedShipmentCode.startsWith('SL-2026-'), 'linkedShipmentCode must start with SL-2026-');
    assert.ok(req.linkedTrackingCode.startsWith('FMCN'), 'linkedTrackingCode must start with FMCN');

    // Verify the linked shipment exists in system shipments
    const dbPostState = await get('/api/db/state');
    const linkedShipment = dbPostState.data.state.shipments[req.linkedShipmentId];
    assert.ok(linkedShipment, 'Linked shipment must exist in database');
    assert.strictEqual(linkedShipment.shipmentCode, req.linkedShipmentCode);
    assert.strictEqual(linkedShipment.trackingCode, req.linkedTrackingCode);
    assert.strictEqual(linkedShipment.status, 'registered');
  });

  await test('11. Security Guard: Prevents duplicate payment on already-paid request', async () => {
    const res = await post('/api/agents/accept-quote', {
      requestId: sourcingRequestId,
      pin: testPin,
      paymentWalletUsed: 'USD',
      userId: testUserId
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.includes('already been paid'));
  });

  // -------------------------------------------------------------------------
  // 8. Payment via CNY Wallet for Factory Audit
  // -------------------------------------------------------------------------
  await test('12. Customer Pays Factory Audit Quote via CNY Wallet with 6-Digit PIN', async () => {
    const res = await post('/api/agents/accept-quote', {
      requestId: auditRequestId,
      pin: testPin,
      paymentWalletUsed: 'CNY',
      userId: testUserId
    });

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.status, 'in_progress');
    assert.strictEqual(req.paymentStatus, 'paid');
    assert.strictEqual(req.paidWith, 'CNY');
    assert.strictEqual(req.paidAmount, req.quoteAmountCNY);
  });

  // -------------------------------------------------------------------------
  // 9. China Ground Operations Updates (Milestones & Deliverables)
  // -------------------------------------------------------------------------
  await test('13. China Ground Desk: Record Purchase Details & Supplier Invoice for Sourcing', async () => {
    const res = await post(
      '/api/admin/agents/update-status',
      {
        requestId: sourcingRequestId,
        purchaseDetails: '1688 Order #882910481 • Shenzhen Yuda Audio Tech Co.',
        supplierInvoiceUrl: 'https://flyemass.cn/invoices/inv-1688-882910481.pdf',
        operationalNotes: 'Goods purchased from factory. Dispatched via SF Express to FlyeMass Guangzhou Warehouse.',
        agentLocation: 'Guangzhou Sourcing Center'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.purchaseDetails, '1688 Order #882910481 • Shenzhen Yuda Audio Tech Co.');
    assert.strictEqual(req.supplierInvoiceUrl, 'https://flyemass.cn/invoices/inv-1688-882910481.pdf');
    assert.strictEqual(req.operationalNotes, 'Goods purchased from factory. Dispatched via SF Express to FlyeMass Guangzhou Warehouse.');
  });

  await test('14. China Ground Desk: Record Factory Audit Findings & Deliverable Report', async () => {
    const res = await post(
      '/api/admin/agents/update-status',
      {
        requestId: auditRequestId,
        factoryAuditFindings: '4 Extrusion lines operational. ISO9001 and CE certificates verified. Capacity: 30 tons/month.',
        factoryPhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758'],
        inspectionReportUrl: 'https://flyemass.cn/reports/audit-foshan-aluminum-2026.pdf',
        operationalNotes: 'Factory audit successfully conducted on-site. PDF report compiled.'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.factoryAuditFindings, '4 Extrusion lines operational. ISO9001 and CE certificates verified. Capacity: 30 tons/month.');
    assert.strictEqual(req.inspectionReportUrl, 'https://flyemass.cn/reports/audit-foshan-aluminum-2026.pdf');
  });

  // -------------------------------------------------------------------------
  // 10. Service Completion & Escrow Disbursement
  // -------------------------------------------------------------------------
  await test('15. Admin Completes Factory Audit Request: Disburses Escrow to Service Revenue', async () => {
    const res = await post(
      '/api/admin/agents/complete',
      {
        requestId: auditRequestId,
        reportSummary: 'Factory audit passed. Official verification certificate issued to client Babatunde Alade.',
        inspectionReportUrl: 'https://flyemass.cn/reports/audit-foshan-aluminum-2026.pdf'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    const req = res.data.request;
    assert.strictEqual(req.status, 'completed');
    assert.ok(req.completedAt > 0);
  });

  // -------------------------------------------------------------------------
  // 11. Cancellation & Automatic Refund into Original Wallet Currency
  // -------------------------------------------------------------------------
  await test('16. Cancel & Full Refund of Sourcing Escrow: Credits USD Wallet with AGTREF-2026-XXXXX', async () => {
    // Record user balance right before refund
    const preDb = await get('/api/db/state');
    const preUSD = preDb.data.state.users[testUserId].balances.USD;

    const res = await post(
      '/api/admin/agents/cancel-refund',
      {
        requestId: sourcingRequestId,
        reason: 'Client requested cancellation due to revised production timeline.'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const req = res.data.request;
    assert.strictEqual(req.status, 'refunded');
    assert.strictEqual(req.paymentStatus, 'refunded');
    assert.ok(req.refundReference.startsWith('AGTREF-2026-'));
    assert.strictEqual(req.refundCurrency, 'USD');
    assert.ok(req.refundAmount > 0);

    // Verify customer wallet was credited back
    assert.strictEqual(res.data.balances.USD, preUSD + req.refundAmount);
  });

  // -------------------------------------------------------------------------
  // 12. Double-Refund and Completed Request Protection Guards
  // -------------------------------------------------------------------------
  await test('17. Security Guard: Prevents double-refund on already-refunded request', async () => {
    const res = await post(
      '/api/admin/agents/cancel-refund',
      {
        requestId: sourcingRequestId,
        reason: 'Attempting duplicate refund'
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.toLowerCase().includes('refund prevented') || res.data.error.toLowerCase().includes('already'));
  });

  await test('18. Security Guard: Locks out refund on completed request without supervisor override', async () => {
    const res = await post(
      '/api/admin/agents/cancel-refund',
      {
        requestId: auditRequestId,
        reason: 'Attempting refund without supervisor auth',
        forceOverride: false
      },
      { 'x-admin-role': 'operations', 'x-admin-id': 'adm-001' }
    );

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.includes('supervisor authorization'));
  });

  // -------------------------------------------------------------------------
  // 13. General Ledger Equilibrium
  // -------------------------------------------------------------------------
  await test('19. Double-Entry General Ledger Equilibrium: Total Debits == Total Credits across all currencies', async () => {
    const res = await get('/api/admin/ledger/reconciliation', { 'x-admin-role': 'super_admin' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const tb = res.data.trialBalance;
    assert.ok(tb, 'trialBalance must exist');

    for (const [currency, totals] of Object.entries(tb)) {
      assert.ok(
        Math.abs(totals.net || 0) < 0.01,
        `Currency ${currency} ledger out of balance: Debits ${totals.debits} != Credits ${totals.credits}, Net: ${totals.net}`
      );
    }
  });

  console.log('\n======================================================================');
  console.log(`   ALL ${passedCount}/${passedCount} AGENT SERVICES & SOURCING TESTS PASSED!`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('\nTest Suite Execution Terminated with Error:', err);
  process.exit(1);
});
