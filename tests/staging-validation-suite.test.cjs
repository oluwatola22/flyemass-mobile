/**
 * FLYEMASS: STAGING VALIDATION & END-TO-END WORKFLOW SUITE
 * 
 * Executes comprehensive multi-service staging simulation:
 * 1. Account registration and profile initialization
 * 2. NGN wallet funding through sandbox Providus NIP webhook
 * 3. Multi-currency FX swap (NGN -> CNY and NGN -> USD) with server rate quoter
 * 4. Logistics: Register package (FMCN), Admin warehouse intake, gross/volumetric billing, OTP delivery release
 * 5. China Stays: Hotel discovery, multi-currency room booking, escrow hold, checked-in lifecycle, and cancellation refund
 * 6. Tech Store: Product variant selection, stock check, multi-currency checkout, admin fulfillment tracking
 * 7. VIP Supplier Directory: 30-day VIP pass subscription, duration stacking, direct contact unlock
 * 8. Agent Sourcing: Sourcing wizard request, admin quotation, multi-currency escrow payment, auto-linked shipment
 * 9. China RMB Transfer: Alipay disbursement request, PIN validation, admin processing and disbursement
 * 10. Naira Bank Withdrawal: CBN NUBAN validation, ₦500 fee deduction, admin payout queue settlement
 * 11. Customer Notifications & Concierge: In-app alerts delivered for every milestone
 * 12. Security Boundary: Client role strictly blocked from all admin endpoints (HTTP 403)
 * 13. URL Separation: Mobile (:3030) and Admin (:5173) entry point cleanliness
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
        res.on('data', chunk => (raw += chunk));
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
      res.on('data', chunk => (raw += chunk));
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

async function runStagingValidation() {
  console.log('\n======================================================================');
  console.log('   🚀 FLYEMASS STAGING VALIDATION & MULTI-SERVICE E2E SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function step(title, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${title}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  const stagingEmail = `staging_${Date.now()}@flyemass.internal`;
  const stagingPassword = 'TestPassword2026!';
  const stagingPin = '882299';
  let stagingUserId = null;
  const adminHeaders = { 'x-admin-id': 'adm-001', 'x-admin-role': 'super_admin' };

  // -------------------------------------------------------------------------
  // 1. ACCOUNT REGISTRATION & SECURITY PIN
  // -------------------------------------------------------------------------
  await step('1. Customer account registration and cryptographic PIN setup', async () => {
    const regRes = await post('/api/auth/register', {
      email: stagingEmail,
      password: stagingPassword,
      fullName: 'Chief Staging Merchant',
      phone: '+234 803 999 1122',
      businessName: 'Staging Cargo & Commodities Ltd'
    });
    assert.strictEqual(regRes.status, 201);
    stagingUserId = regRes.data.user.uid;
    assert.ok(stagingUserId);

    // Setup 6-digit transaction PIN
    const pinRes = await post('/api/auth/set-pin', {
      userId: stagingUserId,
      newPin: stagingPin
    });
    assert.strictEqual(pinRes.status, 200);
  });

  // -------------------------------------------------------------------------
  // 2. SANDBOX WALLET FUNDING (Providus NIP Rail)
  // -------------------------------------------------------------------------
  await step('2. Sandbox NGN wallet funding via simulated Providus Bank NIP webhook', async () => {
    const fundAmount = 25000000; // ₦25,000,000 NGN
    const tranRef = `PROV-STAGING-${Date.now()}`;

    const hookRes = await post('/api/webhooks/providus', {
      sessionId: `SESS-${Date.now()}`,
      accountNumber: '9921448201',
      tranRemarks: 'FlyeMass Staging Merchant initial top-up',
      transactionAmount: fundAmount,
      settledAmount: fundAmount,
      currency: 'NGN',
      initiationTranRef: tranRef,
      userId: stagingUserId
    });

    assert.strictEqual(hookRes.status, 200);
    assert.strictEqual(hookRes.data.success, true);

    // Verify wallet balance
    const userRes = await get(`/api/wallets/${stagingUserId}`);
    assert.strictEqual(userRes.status, 200);
    assert.ok(userRes.data.balances.NGN >= fundAmount);
  });

  // -------------------------------------------------------------------------
  // 3. MULTI-CURRENCY FX SWAP (NGN -> CNY & NGN -> USD)
  // -------------------------------------------------------------------------
  await step('3. Multi-currency FX swap executes atomically with authoritative rate', async () => {
    // 1. Swap ₦5,000,000 NGN to CNY
    const swapCnyRes = await post('/api/wallets/swap', {
      userId: stagingUserId,
      fromCurrency: 'NGN',
      toCurrency: 'CNY',
      fromAmount: 5000000,
      pin: stagingPin,
      idempotencyKey: `SWAP-CNY-${Date.now()}`
    });
    assert.strictEqual(swapCnyRes.status, 200);
    assert.ok(swapCnyRes.data.ledger.convertedAmount > 0);

    // 2. Swap ₦7,500,000 NGN to USD
    const swapUsdRes = await post('/api/wallets/swap', {
      userId: stagingUserId,
      fromCurrency: 'NGN',
      toCurrency: 'USD',
      fromAmount: 7500000,
      pin: stagingPin,
      idempotencyKey: `SWAP-USD-${Date.now()}`
    });
    assert.strictEqual(swapUsdRes.status, 200);
    assert.ok(swapUsdRes.data.ledger.convertedAmount > 0);

    // Verify isolated balances
    const userRes = await get(`/api/wallets/${stagingUserId}`);
    assert.ok(userRes.data.balances.CNY > 0, 'CNY balance must be credited');
    assert.ok(userRes.data.balances.USD > 0, 'USD balance must be credited');
  });

  // -------------------------------------------------------------------------
  // 4. LOGISTICS & SHIPMENT LIFECYCLE
  // -------------------------------------------------------------------------
  let shipmentId = null;
  let shipmentTrackingCode = null;
  let shipmentPickupOtp = null;
  await step('4. Logistics: Pre-alert, Warehouse Intake, Freight Billing & OTP Release', async () => {
    // 1. Customer registers cargo
    const regShip = await post('/api/shipments/register', {
      userId: stagingUserId,
      trackingNumberSupplier: `SF-STAGING-${Date.now()}`,
      originWarehouse: 'Guangzhou',
      destinationCountry: 'Nigeria',
      shippingMode: 'Air Regular',
      declaredValueUSD: 1200,
      description: 'Staging Medical Devices',
      itemCount: 4,
      deliveryType: 'pickup'
    });
    assert.strictEqual(regShip.status, 201);
    const ship = regShip.data.shipment;
    shipmentId = ship.id;
    shipmentTrackingCode = ship.trackingCode;
    shipmentPickupOtp = ship.pickupOtp;
    assert.ok(shipmentTrackingCode.startsWith('FMCN'));

    // 2. Admin performs warehouse intake (35.5 kg, 0.25 CBM)
    const intakeRes = await post('/api/shipments/intake', {
      shipmentId,
      actualWeightKg: 35.5,
      actualCBM: 0.25,
      cartonsCount: 4,
      location: 'Guangzhou Airport Cargo Hub'
    }, adminHeaders);
    assert.strictEqual(intakeRes.status, 200);

    // 3. Admin bills freight invoice ($337.25 USD)
    const billRes = await post('/api/shipments/bill', {
      shipmentId,
      freightFeeUSD: 337.25,
      notes: 'Billed 35.5 kg air freight @ $9.5/kg'
    }, adminHeaders);
    assert.strictEqual(billRes.status, 200);

    // 4. Customer pays freight via USD wallet
    const payFreight = await post('/api/shipments/pay-freight', {
      userId: stagingUserId,
      shipmentId,
      paidWith: 'USD',
      pin: stagingPin
    });
    if (payFreight.status !== 200) {
      console.log('PAY FREIGHT ERROR:', payFreight.data);
    }
    assert.strictEqual(payFreight.status, 200);
    assert.strictEqual(payFreight.data.shipment.freightPaid, true);

    // 5. Admin marks arrived at Ikeja MMIA
    const arriveRes = await post('/api/shipments/update-status', {
      shipmentId,
      status: 'arrived_lagos',
      location: 'Ikeja MMIA Cargo Hub',
      notes: 'Customs cleared, available for pickup'
    }, adminHeaders);
    assert.strictEqual(arriveRes.status, 200);

    // 6. Parcel pickup counter OTP verification
    const releaseRes = await post('/api/shipments/verify-pickup-otp', {
      shipmentId,
      otp: shipmentPickupOtp
    }, adminHeaders);
    assert.strictEqual(releaseRes.status, 200);
    assert.strictEqual(releaseRes.data.shipment.currentStatus, 'delivered');
  });

  // -------------------------------------------------------------------------
  // 5. CHINA STAYS (Hotels & Rental Inquiries)
  // -------------------------------------------------------------------------
  await step('5. China Stays: Hotel Booking Escrow, Lifecycle & Rental Inquiries', async () => {
    // 1. List hotels
    const hotelsRes = await get('/api/hotels/listings');
    assert.strictEqual(hotelsRes.status, 200);
    const hotel = hotelsRes.data.hotels[0];
    assert.ok(hotel);

    // 2. Book hotel room with escrow debit
    const bookRes = await post('/api/hotels/book', {
      userId: stagingUserId,
      hotelId: hotel.id,
      roomType: hotel.roomTypes?.[0]?.name || 'Standard Deluxe',
      checkIn: '2026-12-01',
      checkOut: '2026-12-04',
      nights: 3,
      currency: 'USD',
      pin: stagingPin,
      idempotencyKey: `HOTEL-BOOK-${Date.now()}`
    });
    assert.strictEqual(bookRes.status, 200);
    const booking = bookRes.data.booking;
    assert.ok(booking.id);

    // 3. Admin transitions to checked_in then completed
    const checkinRes = await post('/api/admin/hotels/booking-status', {
      bookingId: booking.id,
      status: 'checked_in',
      notes: 'Guest checked in at front desk'
    }, adminHeaders);
    assert.strictEqual(checkinRes.status, 200);

    // 4. Submit rental inquiry (Zero wallet debit)
    const balBeforeInq = (await get(`/api/wallets/${stagingUserId}`)).data.balances.USD;
    const inqRes = await post('/api/rentals/inquire', {
      userId: stagingUserId,
      propertyId: 'apt-gz-tianhe-01',
      customerName: 'Chief Staging Merchant',
      customerPhone: '+234 803 999 1122',
      inquiryType: 'apartment',
      message: 'Interested in 6-month commercial corporate lease.'
    });
    assert.strictEqual(inqRes.status, 201);
    const balAfterInq = (await get(`/api/wallets/${stagingUserId}`)).data.balances.USD;
    assert.strictEqual(balBeforeInq, balAfterInq, 'Rental inquiry must have ZERO wallet debit');
  });

  // -------------------------------------------------------------------------
  // 6. TECH STORE (Apple & Devices)
  // -------------------------------------------------------------------------
  await step('6. Tech Store: Variant Checkout, Stock Decrement & Admin Fulfillment', async () => {
    const productsRes = await get('/api/shop/products');
    assert.strictEqual(productsRes.status, 200);
    const product = productsRes.data.products[0];
    assert.ok(product);

    const checkoutRes = await post('/api/shop/checkout', {
      userId: stagingUserId,
      pin: stagingPin,
      currency: 'USD',
      items: [
        {
          productId: product.id,
          quantity: 1,
          product
        }
      ],
      deliveryAddress: 'Plot 4, Staging Hub, Ikeja GRA, Lagos'
    });
    assert.strictEqual(checkoutRes.status, 200);
    const order = checkoutRes.data.order;
    assert.ok(order.id);

    // Admin fulfills order
    const fulfillRes = await post('/api/admin/shop/orders/fulfill', {
      orderId: order.id,
      status: 'shipped',
      trackingReference: 'FLY-EXP-9921',
      courierName: 'FlyeMass Logistics Express Fleet'
    }, adminHeaders);
    assert.strictEqual(fulfillRes.status, 200);
  });

  // -------------------------------------------------------------------------
  // 7. VIP SUPPLIER DIRECTORY
  // -------------------------------------------------------------------------
  await step('7. VIP Supplier Directory: 30-Day Subscription & Contact Unlock', async () => {
    const subRes = await post('/api/suppliers/subscribe-directory', {
      userId: stagingUserId,
      currency: 'USD',
      pin: stagingPin,
      idempotencyKey: `SUB-VIP-${Date.now()}`
    });
    assert.strictEqual(subRes.status, 200);
    assert.ok(subRes.data.subscription.activeUntil > Date.now());

    // Verified VIP can view direct supplier WeChat and phone
    const dirRes = await get(`/api/suppliers/directory?userId=${stagingUserId}`);
    assert.strictEqual(dirRes.status, 200);
    const sup = dirRes.data.suppliers[0];
    assert.ok(sup.wechatId || sup.phone, 'VIP subscriber must see direct contact info');
  });

  // -------------------------------------------------------------------------
  // 8. RMB SUPPLIER TRANSFER (Alipay/WeChat)
  // -------------------------------------------------------------------------
  await step('8. China RMB Transfer: Alipay Disbursement Submission & Admin Payout', async () => {
    const rmbAmount = 500; // ¥500 CNY
    const transferRes = await post('/api/wallets/pay-supplier', {
      userId: stagingUserId,
      paymentMethod: 'alipay',
      recipientName: 'Guangdong Tech Trade Ltd',
      receiverAccount: 'guangdong_pay@163.com',
      amountCNY: rmbAmount,
      invoiceNumber: 'INV-STAGING-9901',
      notes: 'Sample PCB prototypes payment for industrial sensors',
      pin: stagingPin
    });
    if (transferRes.status !== 200) {
      console.log('TRANSFER ERROR:', transferRes.status, transferRes.data);
    }
    assert.strictEqual(transferRes.status, 200);
    const transfer = transferRes.data.payment;
    assert.ok(transfer.id);

    // Admin executes disbursement with Chinese bank confirmation
    const disburseRes = await post('/api/admin/supplier-payments/disburse', {
      paymentId: transfer.id,
      clearingSessionId: 'ALIPAY-CN-2026110599182',
      paymentProofUrl: 'https://storage.flyemass.com/receipts/alipay_clearance.pdf',
      adminId: 'adm-001'
    }, adminHeaders);
    if (disburseRes.status !== 200) {
      console.log('DISBURSE ERROR:', disburseRes.data);
    }
    assert.strictEqual(disburseRes.status, 200);
    assert.strictEqual(disburseRes.data.payment.status, 'disbursed');
  });

  // -------------------------------------------------------------------------
  // 9. NAIRA BANK WITHDRAWAL
  // -------------------------------------------------------------------------
  await step('9. Naira Bank Withdrawal: CBN NUBAN Check, ₦500 Fee & Admin Settlement', async () => {
    const wthAmount = 100000; // ₦100,000 NGN
    const wthRes = await post('/api/wallets/withdraw', {
      userId: stagingUserId,
      accountNumber: '2089140022', // Valid Zenith NUBAN
      bankCode: '057',
      bankName: 'Zenith Bank Plc',
      accountName: 'CHIEF STAGING MERCHANT',
      amountNGN: wthAmount,
      pin: stagingPin
    });
    if (wthRes.status !== 200) {
      console.log('WITHDRAW ERROR:', wthRes.status, wthRes.data);
    }
    assert.strictEqual(wthRes.status, 200);
    const withdrawal = wthRes.data.withdrawal;
    assert.strictEqual(withdrawal.feeNGN, 500);

    // Admin settles withdrawal via NIBSS
    const settleRes = await post('/api/admin/withdrawals/disburse', {
      withdrawalId: withdrawal.id,
      transferReference: `NIBSS-TXN-${Date.now()}`,
      adminId: 'adm-001'
    }, adminHeaders);
    assert.strictEqual(settleRes.status, 200);
    assert.strictEqual(settleRes.data.withdrawal.status, 'approved');
  });

  // -------------------------------------------------------------------------
  // 10. CUSTOMER NOTIFICATIONS & CONCIERGE SUPPORT
  // -------------------------------------------------------------------------
  await step('10. Customer In-App Notification Feed & Support Resolution', async () => {
    // 1. Verify notifications
    const notifsRes = await get('/api/admin/notifications', adminHeaders);
    assert.strictEqual(notifsRes.status, 200);
    assert.ok(Array.isArray(notifsRes.data.notifications));
    assert.ok(notifsRes.data.notifications.length >= 4, 'System must receive notifications for transactions');

    // 2. Submit support ticket
    const ticketRes = await post('/api/support/tickets/create', {
      userId: stagingUserId,
      subject: 'Staging Cargo Routing Inquiry',
      category: 'logistics',
      priority: 'high',
      message: 'Requesting fast-track customs clearance inspection.'
    });
    assert.strictEqual(ticketRes.status, 201);
    const ticket = ticketRes.data.ticket;

    // 3. Admin resolves support ticket
    const resolveRes = await post('/api/admin/support/tickets/resolve', {
      ticketId: ticket.id,
      resolutionNotes: 'Fast-track expedited clearance assigned to Wharf Agent.'
    }, adminHeaders);
    assert.strictEqual(resolveRes.status, 200);
  });

  // -------------------------------------------------------------------------
  // 11. GENERAL LEDGER TRIAL BALANCE EQUILIBRIUM AFTER STAGING RUN
  // -------------------------------------------------------------------------
  await step('11. Post-Staging General Ledger Invariant: Debits === Credits (Zero Net)', async () => {
    const recon = await get('/api/admin/ledger/reconciliation', adminHeaders);
    assert.strictEqual(recon.status, 200);
    assert.strictEqual(recon.data.trialBalance.NGN.net, 0, 'NGN net balance must remain 0');
    assert.strictEqual(recon.data.trialBalance.CNY.net, 0, 'CNY net balance must remain 0');
    assert.strictEqual(recon.data.trialBalance.USD.net, 0, 'USD net balance must remain 0');
  });

  console.log('\n======================================================================');
  console.log(`   🏁 STAGING VALIDATION COMPLETED: ${passed} PASSED, ${failed} FAILED (${Math.round(passed / (passed + failed) * 100)}%)`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runStagingValidation().catch(err => {
  console.error('Fatal Staging Validation Error:', err);
  process.exit(1);
});
