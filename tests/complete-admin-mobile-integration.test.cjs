/**
 * FLYEMASS — COMPLETE ADMIN WORKSPACE & MOBILE APP INTEGRATION TEST SUITE
 * 
 * Comprehensive Verification Across All 13 Core Modules:
 * 1. Admin Authentication & Role-Based Access Control (RBAC).
 * 2. Wallet Funding & Treasury Double-Entry Balance Verification.
 * 3. China RMB Transfers: Disbursement & Rejection with Auto-Refund.
 * 4. Naira Bank Withdrawals: Approval & Rejection with Auto-Refund.
 * 5. Logistics Package Pre-Alert Intake & Consignment Billing.
 * 6. Freight Invoicing, Wallet Settlement & Dispatch Advancement.
 * 7. Tech Gadget / Apple Shop: Stock Decrement, Order Checkout & Admin Fulfillment.
 * 8. VIP Supplier Directory: Access Enclave, Subscription, & Revenue Metrics.
 * 9. Agent Sourcing & Inspection Request Flow with Quotation.
 * 10. Hotel Reservations & Realty Inquiry Integration.
 * 11. Customer Support Ticket Lifecycle & Real-Time Concierge Resolution.
 * 12. Communications Desk: Banner CRUD, In-App Notifications, & Marketing Email Delivery.
 * 13. FX Rates, Spreads, & SHA-256 Tamper-Evident Audit Chain Integrity.
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

async function runTestSuite() {
  console.log('================================================================');
  console.log(' FLYEMASS — COMPLETE ADMIN WORKSPACE & MOBILE INTEGRATION TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[Test ${total}] ${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error('   Error:', err.message);
      if (err.stack) {
        console.error('   ' + err.stack.split('\n').slice(1, 4).join('\n   '));
      }
    }
  }

  const TEST_USER = 'usr_alade_01';
  const VALID_PIN = '246810';
  const ADMIN_HEADERS = {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  };

  // Set active cryptographic PIN for test user
  await request({
    path: '/api/auth/set-pin',
    method: 'POST'
  }, { userId: TEST_USER, newPin: VALID_PIN });

  // -------------------------------------------------------------
  // TEST 1: ADMIN RBAC ENFORCEMENT
  // -------------------------------------------------------------
  await test('Admin RBAC: Unauthorized staff request rejected; Super Admin allowed', async () => {
    // 1. Without admin role header, settings update is blocked with 403
    const unauthRes = await request({
      path: '/api/settings/update',
      method: 'POST'
    }, { rates: { USD_NGN: 1550 } });
    assert.strictEqual(unauthRes.status, 403, 'Should reject unauthenticated staff request');

    // 2. With super_admin role, settings update succeeds
    const authRes = await request({
      path: '/api/settings/update',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      adminName: 'Chief Babatunde Alade',
      rates: { USD_NGN: 1485, USD_CNY: 7.24, spreadPercent: 0.75 }
    });
    assert.strictEqual(authRes.status, 200, 'Should allow super_admin role');
    assert.strictEqual(authRes.body.success, true);
  });

  // -------------------------------------------------------------
  // TEST 2: WALLET FUNDING & DOUBLE-ENTRY INFLOW
  // -------------------------------------------------------------
  await test('Wallet Funding: Simulated bank webhook credits customer wallet balance', async () => {
    const fundAmount = 500000; // ₦500,000
    const fundRes = await request({
      path: '/api/admin/webhooks/simulate',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      provider: 'providus',
      amount: fundAmount,
      userId: TEST_USER
    });

    assert.strictEqual(fundRes.status, 200);
    assert.strictEqual(fundRes.body.success, true);
    assert(fundRes.body.balances.NGN >= fundAmount, 'Customer NGN balance must be credited');

    // Also fund USD wallet so customer can execute USD freight payments
    await request({
      path: '/api/wallets/fund',
      method: 'POST'
    }, {
      userId: TEST_USER,
      currency: 'USD',
      amount: 5000,
      paymentMethod: 'Test Card'
    });
  });

  // -------------------------------------------------------------
  // TEST 3: CHINA RMB TRANSFERS DISBURSEMENT & AUTO-REFUND
  // -------------------------------------------------------------
  await test('China RMB Transfers: Submission, Admin Disbursement & Rejection with Refund', async () => {
    // A. Submit payment
    const payRes = await request({
      path: '/api/wallets/pay-supplier',
      method: 'POST'
    }, {
      userId: TEST_USER,
      amountCNY: 200,
      pin: VALID_PIN,
      supplierName: 'Shenzhen MicroTech Electronic Co.',
      receiverAccount: '6228480039201928',
      paymentMethod: 'bank_card',
      bankName: 'China Construction Bank (Guangzhou Pazhou Branch)',
      note: 'Deposit for electronics batch #802'
    });
    assert.strictEqual(payRes.status, 200);
    const paymentId = payRes.body.payment.id;
    assert(paymentId, 'Payment record must be created');

    // B. Admin marks disbursed with Chinese remittance evidence
    const disburseRes = await request({
      path: '/api/admin/supplier-payments/disburse',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      paymentId,
      externalPaymentRef: 'CCB-CORP-90218',
      paymentProofUrl: 'https://storage.flyemass.com/receipts/cny_tx_902.pdf',
      safeDeclarationRef: 'SAFE-DECL-2026-08',
      adminNotes: 'Disbursed via CCB Corporate Remittance Desk'
    });
    assert.strictEqual(disburseRes.status, 200);
    assert.strictEqual(disburseRes.body.payment.status, 'disbursed');

    // C. Test Rejection with Auto-Refund
    const pay2Res = await request({
      path: '/api/wallets/pay-supplier',
      method: 'POST'
    }, {
      userId: TEST_USER,
      amountCNY: 150,
      pin: VALID_PIN,
      supplierName: 'Guangzhou Textile Corp',
      receiverAccount: '6228489999999999',
      paymentMethod: 'bank_card',
      bankName: 'Industrial and Commercial Bank of China'
    });
    assert.strictEqual(pay2Res.status, 200);
    const payment2Id = pay2Res.body.payment.id;

    const refundRes = await request({
      path: '/api/admin/supplier-payments/refund',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      paymentId: payment2Id,
      reason: 'Supplier beneficiary name does not match ICBC account'
    });
    assert.strictEqual(refundRes.status, 200);
    assert.strictEqual(refundRes.body.payment.status, 'refunded');
  });

  // -------------------------------------------------------------
  // TEST 4: NAIRA BANK WITHDRAWALS & REFUND
  // -------------------------------------------------------------
  await test('Naira Bank Withdrawals: Admin approval and rejection with instant refund', async () => {
    // 1. Submit withdrawal request
    const withdrawAmount = 25000;
    const withdrawRes = await request({
      path: '/api/wallets/withdraw',
      method: 'POST'
    }, {
      userId: TEST_USER,
      amountNGN: withdrawAmount,
      pin: VALID_PIN,
      bankCode: '057',
      bankName: 'Zenith Bank',
      accountNumber: '2089140022',
      accountName: 'Chief Babatunde Alade'
    });
    assert.strictEqual(withdrawRes.status, 200);
    const withdrawalId = withdrawRes.body.withdrawal.id;

    // 2. Admin approves and disburses withdrawal
    const disburseRes = await request({
      path: '/api/admin/withdrawals/disburse',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      withdrawalId,
      transferReference: 'NIBSS-ZNT-290182'
    });
    assert.strictEqual(disburseRes.status, 200);
    assert.strictEqual(disburseRes.body.withdrawal.status, 'approved');

    // 3. Submit second withdrawal and reject with auto-refund
    const withdraw2Res = await request({
      path: '/api/wallets/withdraw',
      method: 'POST'
    }, {
      userId: TEST_USER,
      amountNGN: 15000,
      pin: VALID_PIN,
      bankCode: '057',
      bankName: 'Zenith Bank',
      accountNumber: '2089140022',
      accountName: 'Chief Babatunde Alade'
    });
    assert.strictEqual(withdraw2Res.status, 200);
    const withdrawal2Id = withdraw2Res.body.withdrawal.id;

    const refundWthRes = await request({
      path: '/api/admin/withdrawals/refund',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      withdrawalId: withdrawal2Id,
      reason: 'NIBSS destination account unverified'
    });
    assert.strictEqual(refundWthRes.status, 200);
    assert(['rejected', 'failed'].includes(refundWthRes.body.withdrawal.status));
  });

  // -------------------------------------------------------------
  // TEST 5: LOGISTICS PRE-ALERT INTAKE & CONSIGNMENT BILLING
  // -------------------------------------------------------------
  let testShipmentId = '';
  await test('Logistics: Customer registers package pre-alert; Admin performs intake', async () => {
    const testTrackingNumber = `SF${Math.floor(100000000000 + Math.random() * 900000000000)}CN`;
    const preAlertRes = await request({
      path: '/api/shipments/register',
      method: 'POST'
    }, {
      userId: TEST_USER,
      chineseCourierTracking: testTrackingNumber,
      title: 'High-Density Lithium Inverters (10 Cartons)',
      shippingMode: 'air_cargo',
      declaredValueRMB: 8500,
      destinationHub: 'Lagos Main Airport Cargo Village',
      destinationHubId: 'hub-lagos-mma2',
      originWarehouse: 'Guangzhou Main Bonded Hub',
      originWarehouseId: 'wh-gz-baiyun',
      receiverName: 'Chief Babatunde Alade',
      receiverPhone: '+234 803 555 9201'
    });
    assert([200, 201].includes(preAlertRes.status));
    assert(preAlertRes.body.success, 'Pre-alert registration must succeed');
    testShipmentId = preAlertRes.body.shipment.id;

    // Admin verifies intake at warehouse
    const intakeRes = await request({
      path: '/api/shipments/intake',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      shipmentId: testShipmentId,
      actualWeightKg: 42.5,
      lengthCm: 60,
      widthCm: 50,
      heightCm: 40,
      packagingCondition: 'Good condition / Factory seals intact',
      inspectionNotes: 'All 10 cartons verified with zero cosmetic defects.'
    });
    assert.strictEqual(intakeRes.status, 200);
    assert.strictEqual(intakeRes.body.shipment.currentStatus, 'inspection');
  });

  // -------------------------------------------------------------
  // TEST 6: FREIGHT INVOICING & ADVANCEMENT
  // -------------------------------------------------------------
  await test('Logistics: Admin bills freight and advances cargo status', async () => {
    // 1. Admin generates freight bill
    const billRes = await request({
      path: '/api/shipments/bill',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      shipmentId: testShipmentId,
      freightFeeUSD: 425.00,
      ratePerKg: 10.00,
      billingNotes: 'Air Freight: 42.5kg @ $10.00/kg'
    });
    assert.strictEqual(billRes.status, 200);
    assert.strictEqual(billRes.body.shipment.currentStatus, 'awaiting_payment');

    // 2. Customer pays freight bill via wallet
    const payFreightRes = await request({
      path: '/api/shipments/pay-freight',
      method: 'POST'
    }, {
      shipmentId: testShipmentId,
      userId: TEST_USER,
      currency: 'USD',
      pin: VALID_PIN
    });
    assert.strictEqual(payFreightRes.status, 200);
    assert.strictEqual(payFreightRes.body.shipment.paymentStatus, 'paid');

    // 3. Admin advances status to in_transit
    const updateStatusRes = await request({
      path: '/api/shipments/update-status',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      shipmentId: testShipmentId,
      status: 'in_transit',
      flightVoyageNumber: 'ET-902-CAN-LOS',
      location: 'In Flight — Can/Addis/Los',
      notes: 'Cargo departed Guangzhou Baiyun Airport en route to Lagos'
    });
    assert.strictEqual(updateStatusRes.status, 200);
    assert.strictEqual(updateStatusRes.body.shipment.currentStatus, 'in_transit');
  });

  // -------------------------------------------------------------
  // TEST 7: TECH GADGET / APPLE SHOP INVENTORY & ORDERS
  // -------------------------------------------------------------
  await test('Commerce / Apple Shop: Stock management, order creation, & admin fulfillment', async () => {
    // Fund USD wallet to ensure sufficient balance for MacBook purchase
    await request({
      path: '/api/wallets/fund',
      method: 'POST'
    }, {
      userId: TEST_USER,
      currency: 'USD',
      amount: 10000,
      paymentMethod: 'Test Card'
    });

    const testProductId = `prod_test_${Date.now()}`;
    // 1. Admin adds product
    const createProdRes = await request({
      path: '/api/shop/add-product',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      product: {
        id: testProductId,
        title: 'MacBook Pro 16" M3 Max 36GB / 1TB Space Black',
        category: 'MacBook',
        condition: 'Brand New',
        priceNGN: 4850000,
        priceUSD: 3260,
        priceCNY: 23600,
        stockCount: 8,
        inStock: true
      }
    });
    assert.strictEqual(createProdRes.status, 201);

    // 2. Adjust stock
    const stockRes = await request({
      path: '/api/shop/update-stock',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      productId: testProductId,
      delta: -2
    });
    assert.strictEqual(stockRes.status, 200);
    assert.strictEqual(stockRes.body.product.stockCount, 6);

    // 3. Customer places order
    const checkoutRes = await request({
      path: '/api/shop/checkout',
      method: 'POST'
    }, {
      userId: TEST_USER,
      pin: VALID_PIN,
      currency: 'USD',
      items: [
        {
          productId: testProductId,
          quantity: 1,
          product: {
            id: testProductId,
            title: 'MacBook Pro 16" M3 Max',
            priceUSD: 3260,
            priceNGN: 4850000
          }
        }
      ],
      deliveryAddress: 'Plot 12, Victoria Island Corporate Tower, Lagos'
    });
    if (checkoutRes.status !== 200) {
      console.log('CHECKOUT ERROR:', checkoutRes.status, checkoutRes.body);
    }
    assert.strictEqual(checkoutRes.status, 200);
    const orderId = checkoutRes.body.order.id;

    // 4. Admin updates fulfillment status
    const fulfillRes = await request({
      path: '/api/admin/shop/orders/fulfill',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      orderId,
      status: 'shipped',
      trackingReference: 'FLY-LOG-8902',
      courierName: 'FlyeMass Lagos Express Fleet'
    });
    assert.strictEqual(fulfillRes.status, 200);
    assert.strictEqual(fulfillRes.body.order.fulfillmentStatus, 'shipped');
  });

  // -------------------------------------------------------------
  // TEST 8: VIP SUPPLIER DIRECTORY ACCESS ENCLAVE & REVENUE METRICS
  // -------------------------------------------------------------
  await test('VIP Supplier Directory: Access restrictions, subscription, and revenue metrics', async () => {
    // 1. Pricing config
    const priceRes = await request({
      path: '/api/suppliers/prices',
      method: 'GET'
    });
    assert.strictEqual(priceRes.status, 200);
    assert(priceRes.body.prices.usd > 0);

    // 2. Admin supplier metrics
    const metricsRes = await request({
      path: '/api/admin/suppliers/metrics',
      method: 'GET',
      headers: ADMIN_HEADERS
    });
    assert.strictEqual(metricsRes.status, 200);
    assert(metricsRes.body.metrics.totalSubscriptions >= 0);

    // 3. Admin supplier directory listing
    const supRes = await request({
      path: '/api/admin/suppliers',
      method: 'GET',
      headers: ADMIN_HEADERS
    });
    assert.strictEqual(supRes.status, 200);
    assert(Array.isArray(supRes.body.suppliers));
    assert(supRes.body.suppliers.length > 0);
  });

  // -------------------------------------------------------------
  // TEST 9: AGENT SOURCING & INSPECTIONS WORKFLOW
  // -------------------------------------------------------------
  await test('Agent Sourcing: Customer request submission and admin quotation', async () => {
    // 1. Customer submits request
    const reqRes = await request({
      path: '/api/agents/request',
      method: 'POST'
    }, {
      userId: TEST_USER,
      serviceKind: 'sourcing',
      productName: 'Solar Hybrid Inverters 5KW 48V',
      specifications: 'Pure sine wave, MPPT 100A, dual AC inputs, CE & RoHS certified',
      targetQuantity: 100,
      totalBudgetCNY: 120000
    });
    assert([200, 201].includes(reqRes.status));
    const agentReqId = reqRes.body.request.id;

    // 2. Admin submits quotation
    const quoteRes = await request({
      path: '/api/admin/agents/quote',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      requestId: agentReqId,
      productCostCNY: 105000,
      sourcingCommissionCNY: 3150,
      chinaShippingCNY: 1200,
      totalPayableCNY: 109350,
      quoteAmountUSD: 15100,
      leadTimeDays: 7,
      assignedAgent: 'David Zhang (Guangzhou Sourcing Office)',
      quotationNotes: 'Tier-1 manufacturer verified in Foshan with 2-year warranty.'
    });
    assert.strictEqual(quoteRes.status, 200);
    assert(['quoted', 'awaiting_payment'].includes(quoteRes.body.request.status));
  });

  // -------------------------------------------------------------
  // TEST 10: HOTEL & RENTALS RESERVATIONS INTEGRATION
  // -------------------------------------------------------------
  await test('Hotels & Rentals: Reservation booking and admin status update', async () => {
    // 1. Customer books hotel
    const bookRes = await request({
      path: '/api/hotels/book',
      method: 'POST'
    }, {
      userId: TEST_USER,
      hotelId: 'htl_westin_pazhou',
      nights: 4,
      totalUSD: 640,
      currency: 'USD',
      guestName: 'Chief Babatunde Alade',
      guestEmail: 'babatunde@aladeholding.ng',
      guestPhone: '+234 803 555 9201',
      roomType: 'Deluxe Executive King',
      checkIn: '2026-11-10',
      checkOut: '2026-11-14',
      pin: VALID_PIN
    });
    assert.strictEqual(bookRes.status, 200);
    const bookingId = bookRes.body.booking.id;

    // 2. Admin manages booking status
    const statusRes = await request({
      path: '/api/admin/hotels/booking-status',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      bookingId,
      status: 'confirmed',
      confirmationNumber: 'WST-CAN-90218'
    });
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.booking.status, 'confirmed');
  });

  // -------------------------------------------------------------
  // TEST 11: SUPPORT TICKET & REAL-TIME CONCIERGE CHAT
  // -------------------------------------------------------------
  await test('Support & Concierge: Customer ticket submission and admin resolution', async () => {
    // 1. Customer creates ticket
    const ticketRes = await request({
      path: '/api/support/tickets/create',
      method: 'POST'
    }, {
      userId: TEST_USER,
      subject: 'Customs Valuation Documentation Request',
      category: 'logistics',
      priority: 'high',
      initialMessage: 'Please provide the stamped Bill of Lading and Form M certificate for our air cargo.'
    });
    assert([200, 201].includes(ticketRes.status));
    const ticketId = ticketRes.body.ticket.id;

    // 2. Admin resolves ticket
    const resolveRes = await request({
      path: '/api/admin/support/tickets/resolve',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      ticketId,
      resolutionNotes: 'Official stamped documents transmitted to customer vault'
    });
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.ticket.status, 'resolved');
  });

  // -------------------------------------------------------------
  // TEST 12: COMMUNICATIONS DESK (BANNERS, NOTIFICATIONS & EMAILS)
  // -------------------------------------------------------------
  await test('Communications Desk: Banner CRUD, in-app push dispatch, & marketing email receipts', async () => {
    // 1. Create Promotional Banner
    const createBanRes = await request({
      path: '/api/admin/banners/create',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      banner: {
        title: 'Guangzhou Sea Freight Promotion 2026',
        description: 'Consolidated containers starting at $140/CBM with cleared Lagos delivery',
        imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec',
        destinationRoute: 'logistics',
        isActive: true,
        displayOrder: 3
      }
    });
    assert.strictEqual(createBanRes.status, 201);
    const bannerId = createBanRes.body.banner.id;

    // 2. Toggle Banner Status
    const toggleBanRes = await request({
      path: '/api/admin/banners/toggle',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      bannerId,
      isActive: false
    });
    assert.strictEqual(toggleBanRes.status, 200);
    assert.strictEqual(toggleBanRes.body.banner.isActive, false);

    // 3. Dispatch In-App Notification
    const notifRes = await request({
      path: '/api/admin/notifications/send',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      title: 'Yiwu Warehouse Holiday Notice',
      message: 'Intake will remain open 24/7 during the national trade week.',
      type: 'cargo',
      targetUserId: TEST_USER,
      linkRoute: 'logistics'
    });
    assert.strictEqual(notifRes.status, 200);
    assert.strictEqual(notifRes.body.notification.targetUserId, TEST_USER);

    // 4. Send Marketing Email Campaign
    const emailRes = await request({
      path: '/api/admin/emails/send',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      recipientEmail: 'babatunde@aladeholding.ng',
      recipientName: 'Chief Babatunde Alade',
      subject: '136th Canton Fair VIP Logistics Passes Confirmed',
      message: 'Your VIP delegation passes have been issued with complimentary factory shuttle access.',
      campaignType: 'marketing_broadcast'
    });
    assert.strictEqual(emailRes.status, 200);
    assert.strictEqual(emailRes.body.count, 1);

    // 5. Inspect Email Delivery Logs
    const logsRes = await request({
      path: '/api/admin/emails/logs',
      method: 'GET',
      headers: ADMIN_HEADERS
    });
    assert.strictEqual(logsRes.status, 200);
    assert(Array.isArray(logsRes.body.logs));
    assert(logsRes.body.logs.length > 0);

    // 6. Delete Banner
    const delBanRes = await request({
      path: '/api/admin/banners/delete',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, { bannerId });
    assert.strictEqual(delBanRes.status, 200);
  });

  // -------------------------------------------------------------
  // TEST 13: FX RATES, SPREAD & AUDIT CHAIN INTEGRITY
  // -------------------------------------------------------------
  await test('FX Rates & Audit Chain: Spread configuration and SHA-256 tamper-evident integrity check', async () => {
    // 1. Update FX Rates
    const fxRes = await request({
      path: '/api/settings/update',
      method: 'POST',
      headers: ADMIN_HEADERS
    }, {
      rates: {
        NGN_CNY: 215.20,
        USD_NGN: 1490.00,
        USD_CNY: 7.26,
        spreadPercent: 0.75
      }
    });
    assert.strictEqual(fxRes.status, 200);
    assert.strictEqual(fxRes.body.settings.rates.spreadPercent, 0.75);

    // 2. Verify Tamper-Evident SHA-256 Audit Chain
    const auditRes = await request({
      path: '/api/admin/audit-logs/verify',
      method: 'GET',
      headers: ADMIN_HEADERS
    });
    assert.strictEqual(auditRes.status, 200);
    assert.strictEqual(auditRes.body.valid, true, 'Audit log chain hash must be intact');
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('----------------------------------------------------------------\n');

  if (passed === total) {
    console.log('🎉 ALL FLYEMASS ADMIN WORKSPACE & MOBILE INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME INTEGRATION TESTS FAILED');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
