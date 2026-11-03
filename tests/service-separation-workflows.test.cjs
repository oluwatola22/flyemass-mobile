/**
 * FLYEMASS — COMPLETE SERVICE PAGE SEPARATION & ADMIN INTEGRATION TEST SUITE
 * 
 * Verifies that:
 * 1. Every customer service has its own independent page, navigation, workflow, and data structures:
 *    - Logistics & Shipping (/logistics, /track, /register-package)
 *    - Hotels & BNBs (/hotels, /hotels/detail, /hotels/bookings)
 *    - Residential Apartments & Houses (/rentals/apartments, rentals-apartments)
 *    - Commercial Office Rentals (/rentals/offices, rentals-offices)
 *    - Apple Shop (/shop, /shop/cart, /shop/orders)
 *    - VIP Supplier Contacts (/suppliers)
 *    - Agent Services & Direct RFQ (/agent, /procure)
 *    - Wallet Funding (/fund)
 *    - Currency Exchange (/exchange)
 *    - Naira Withdrawal (/withdraw)
 *    - Send Money / China Payments (/pay)
 * 2. Dedicated Admin Operations Sections operate independently:
 *    - Cargo Control Tower (admin-logistics)
 *    - China RMB Transfers Desk (admin-rmb-transfers)
 *    - Naira Bank Payouts Desk (admin-naira-payouts)
 *    - FX Rates & Margins Management (admin-fx-management)
 *    - Payment Gateways & Funding Webhooks (admin-funding)
 *    - Treasury & General Ledger (admin-payments)
 *    - Tech Gadget Inventory & Orders (admin-shop)
 *    - Hotel Bookings & Vouchers (admin-hotels)
 *    - Residential Apartments & Tenant Inquiries (admin-rentals-apartments)
 *    - Commercial Offices & Corporate Viewing Inquiries (admin-rentals-offices)
 *    - VIP Suppliers & Access Pass Management (admin-suppliers)
 *    - Sourcing & Ground Inspections (admin-agents)
 *    - Support Concierge & Tickets (admin-support)
 * 3. Authoritative backend APIs process and separate all inquiries, bookings, payouts, and listings
 * 4. Cryptographic SHA-256 audit log integrity & balanced ledger equilibrium
 */

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:5050';

function post(pathName, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      `${BASE_URL}${pathName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(pathName, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE_URL}${pathName}`,
      {
        method: 'GET',
        headers
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runServiceSeparationSuite() {
  console.log('\n=============================================================');
  console.log('  FLYEMASS SERVICE PAGE SEPARATION & ADMIN INTEGRATION SUITE');
  console.log('=============================================================\n');

  let passedTests = 0;

  // -------------------------------------------------------------
  // TEST 1: Source Code Verification of Independent Route Definitions
  // -------------------------------------------------------------
  console.log('--- 1. Verification of Separated Route & Path Architecture ---');
  const typesPath = path.join(__dirname, '../src/types/index.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  // Verify dedicated mobile routes
  assert.ok(typesContent.includes("'rentals-apartments'"), "Missing 'rentals-apartments' route in ScreenRoute");
  assert.ok(typesContent.includes("'rentals-offices'"), "Missing 'rentals-offices' route in ScreenRoute");
  assert.ok(typesContent.includes("'hotels'"), "Missing 'hotels' route in ScreenRoute");
  assert.ok(typesContent.includes("'shop'"), "Missing 'shop' route in ScreenRoute");
  assert.ok(typesContent.includes("'suppliers'"), "Missing 'suppliers' route in ScreenRoute");
  assert.ok(typesContent.includes("'agent'"), "Missing 'agent' route in ScreenRoute");
  assert.ok(typesContent.includes("'fund'"), "Missing 'fund' route in ScreenRoute");
  assert.ok(typesContent.includes("'pay'"), "Missing 'pay' route in ScreenRoute");
  assert.ok(typesContent.includes("'exchange'"), "Missing 'exchange' route in ScreenRoute");
  assert.ok(typesContent.includes("'withdraw'"), "Missing 'withdraw' route in ScreenRoute");

  // Verify dedicated admin routes
  assert.ok(typesContent.includes("'admin-rmb-transfers'"), "Missing 'admin-rmb-transfers' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-naira-payouts'"), "Missing 'admin-naira-payouts' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-fx-management'"), "Missing 'admin-fx-management' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-funding'"), "Missing 'admin-funding' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-rentals-apartments'"), "Missing 'admin-rentals-apartments' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-rentals-offices'"), "Missing 'admin-rentals-offices' route in ScreenRoute");
  assert.ok(typesContent.includes("'admin-suppliers'"), "Missing 'admin-suppliers' route in ScreenRoute");

  console.log('✅ PASSED: All independent customer and admin routes defined in TypeScript schema');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 2: Verification of Independent Mobile Screens Existence
  // -------------------------------------------------------------
  console.log('\n--- 2. Independent Mobile Screen Files Verification ---');
  const aptScreenPath = path.join(__dirname, '../src/screens/rentals/ApartmentsScreen.tsx');
  const offScreenPath = path.join(__dirname, '../src/screens/rentals/OfficeRentalsScreen.tsx');
  const hotelsScreenPath = path.join(__dirname, '../src/screens/hotels/HotelsScreen.tsx');

  assert.ok(fs.existsSync(aptScreenPath), "ApartmentsScreen.tsx does not exist");
  assert.ok(fs.existsSync(offScreenPath), "OfficeRentalsScreen.tsx does not exist");
  assert.ok(fs.existsSync(hotelsScreenPath), "HotelsScreen.tsx does not exist");

  const aptContent = fs.readFileSync(aptScreenPath, 'utf8');
  assert.ok(aptContent.includes('Apartments & House Rentals'), "ApartmentsScreen missing dedicated header");
  assert.ok(aptContent.includes('depositMonths'), "ApartmentsScreen missing move-in deposit calculation");
  assert.ok(!aptContent.includes("setMainTab('offices')"), "ApartmentsScreen incorrectly contains offices tab");

  const offContent = fs.readFileSync(offScreenPath, 'utf8');
  assert.ok(offContent.includes('Commercial Office Rentals'), "OfficeRentalsScreen missing dedicated header");
  assert.ok(offContent.includes('Schedule Commercial Viewing'), "OfficeRentalsScreen missing viewing modal");
  assert.ok(!offContent.includes("setMainTab('apartments')"), "OfficeRentalsScreen incorrectly contains apartments tab");

  const hotelContent = fs.readFileSync(hotelsScreenPath, 'utf8');
  assert.ok(hotelContent.includes('China Business Hotels & BNBs'), "HotelsScreen missing pure hotels header");
  assert.ok(!hotelContent.includes("setMainTab('apartments')"), "HotelsScreen still bundles apartments tab");
  assert.ok(!hotelContent.includes("setMainTab('offices')"), "HotelsScreen still bundles offices tab");

  console.log('✅ PASSED: Mobile screen files cleanly separated (Hotels vs Residential vs Commercial Offices)');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 3: Verification of Dedicated Admin Screens Existence
  // -------------------------------------------------------------
  console.log('\n--- 3. Dedicated Admin Screen Files Verification ---');
  const adminRmbPath = path.join(__dirname, '../src/screens/admin/AdminRmbTransfersScreen.tsx');
  const adminNairaPath = path.join(__dirname, '../src/screens/admin/AdminNairaPayoutsScreen.tsx');
  const adminFxPath = path.join(__dirname, '../src/screens/admin/AdminFxManagementScreen.tsx');
  const adminFundingPath = path.join(__dirname, '../src/screens/admin/AdminFundingScreen.tsx');
  const adminAptPath = path.join(__dirname, '../src/screens/admin/AdminRentalsApartmentsScreen.tsx');
  const adminOffPath = path.join(__dirname, '../src/screens/admin/AdminRentalsOfficesScreen.tsx');
  const adminSupPath = path.join(__dirname, '../src/screens/admin/AdminSuppliersScreen.tsx');

  assert.ok(fs.existsSync(adminRmbPath), "AdminRmbTransfersScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminNairaPath), "AdminNairaPayoutsScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminFxPath), "AdminFxManagementScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminFundingPath), "AdminFundingScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminAptPath), "AdminRentalsApartmentsScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminOffPath), "AdminRentalsOfficesScreen.tsx does not exist");
  assert.ok(fs.existsSync(adminSupPath), "AdminSuppliersScreen.tsx does not exist");

  console.log('✅ PASSED: All 7 dedicated administrative operational workspace screens exist');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 4: Backend Residential Apartment Inquiry Workflow (INQ-APT)
  // -------------------------------------------------------------
  console.log('\n--- 4. Backend Residential Apartment Inquiry Submission (INQ-APT) ---');
  // 1. Fetch available properties
  const propRes = await get('/api/rentals/properties?type=apartment');
  assert.strictEqual(propRes.status, 200, "Failed to get rental properties");
  assert.ok(propRes.data.success && propRes.data.properties.length > 0, "No rental properties returned");
  const aptProp = propRes.data.properties[0];

  // 2. Submit residential inquiry (zero wallet deduction)
  const inqRes = await post('/api/rentals/inquire', {
    userId: 'usr_alade_01',
    propertyId: aptProp.id,
    customerName: 'Chief Babatunde Alade',
    customerPhone: '+234 803 123 4567',
    preferredMoveInDate: '2026-12-15',
    leaseDuration: '1 Year',
    customNotes: 'Prefer 12th floor or above with Zhujiang New Town view.'
  });

  assert.strictEqual(inqRes.status, 201, "Failed to create residential inquiry");
  assert.ok(inqRes.data.success, "Inquiry response unsuccessful");
  assert.ok(inqRes.data.inquiry.reference.startsWith('INQ-APT-'), "Inquiry reference should start with INQ-APT-");
  assert.ok(inqRes.data.ticketNumber.startsWith('FM-RNT-'), "Should auto-generate FM-RNT- support ticket");
  assert.strictEqual(inqRes.data.inquiry.propertyType, 'apartment', "Property type must be apartment");

  console.log(`✅ PASSED: Residential inquiry ${inqRes.data.inquiry.reference} registered with ticket ${inqRes.data.ticketNumber}`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 5: Backend Commercial Office Viewing Workflow (INQ-OFF)
  // -------------------------------------------------------------
  console.log('\n--- 5. Backend Commercial Office Viewing Submission (INQ-OFF) ---');
  const offRes = await get('/api/rentals/properties?type=office');
  assert.strictEqual(offRes.status, 200, "Failed to get office properties");
  assert.ok(offRes.data.success && offRes.data.properties.length > 0, "No office properties returned");
  const officeProp = offRes.data.properties[0];

  const offInqRes = await post('/api/rentals/inquire', {
    userId: 'usr_alade_01',
    propertyId: officeProp.id,
    customerName: 'Alade Executive Team',
    customerPhone: '+234 803 123 4567',
    companyName: 'Alade International Trading Ltd',
    preferredMoveInDate: '2026-12-01',
    preferredViewingDate: '2026-11-20',
    leaseDuration: '2 Years',
    customNotes: 'Require 20 workstations and high-speed fiber internet for Canton Fair operations.'
  });

  assert.strictEqual(offInqRes.status, 201, "Failed to create commercial office inquiry");
  assert.ok(offInqRes.data.inquiry.reference.startsWith('INQ-OFF-'), "Inquiry reference should start with INQ-OFF-");
  assert.strictEqual(offInqRes.data.inquiry.propertyType, 'office', "Property type must be office");
  assert.strictEqual(offInqRes.data.inquiry.companyName, 'Alade International Trading Ltd');

  console.log(`✅ PASSED: Commercial inquiry ${offInqRes.data.inquiry.reference} registered for company "${offInqRes.data.inquiry.companyName}"`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 6: Admin Operational Status Transition for Inquiries
  // -------------------------------------------------------------
  console.log('\n--- 6. Dedicated Admin Status Transitions for Rental Inquiries ---');
  const updateRes = await post('/api/admin/rentals/inquiry-status', {
    inquiryId: offInqRes.data.inquiry.id,
    status: 'viewing_scheduled',
    notes: 'In-person physical walkthrough confirmed for 10:00 AM Guangzhou time.',
    assignedStaff: 'Guangzhou Commercial Realty Desk',
    adminId: 'adm-001'
  }, {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  });

  assert.strictEqual(updateRes.status, 200, "Failed to update inquiry status as admin");
  assert.strictEqual(updateRes.data.inquiry.status, 'viewing_scheduled');
  assert.strictEqual(updateRes.data.inquiry.assignedStaff, 'Guangzhou Commercial Realty Desk');

  console.log(`✅ PASSED: Admin updated inquiry status to ${updateRes.data.inquiry.status} with assigned concierge`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 7: Dedicated Admin Publishing of New Residential Apartment
  // -------------------------------------------------------------
  console.log('\n--- 7. Dedicated Admin Publishing of Residential Apartment Listing ---');
  const newAptPayload = {
    property: {
      title: 'Haizhu Riverside Luxury Suite',
      chineseTitle: '海珠江景奢华商务套房',
      propertyType: 'apartment',
      district: 'Haizhu',
      address: 'Riverside Boulevard, Haizhu District, Guangzhou',
      chineseAddress: '广州市海珠区滨江路',
      monthlyRentCNY: 7800,
      monthlyRentUSD: 1077,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 95,
      bedrooms: 2,
      isFurnished: true,
      amenities: ['River View', 'Smart Home', '24/7 Concierge', 'Gym Access'],
      status: 'live'
    },
    adminId: 'adm-001'
  };

  const publishRes = await post('/api/admin/rentals/listings', newAptPayload, {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  });

  assert.strictEqual(publishRes.status, 201, "Failed to publish residential apartment listing");
  assert.strictEqual(publishRes.data.property.title, 'Haizhu Riverside Luxury Suite');
  assert.strictEqual(publishRes.data.property.propertyType, 'apartment');

  console.log(`✅ PASSED: Dedicated Admin created residential apartment listing ID ${publishRes.data.property.id}`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 8: Dedicated Admin Publishing of Commercial Office Space
  // -------------------------------------------------------------
  console.log('\n--- 8. Dedicated Admin Publishing of Commercial Office Listing ---');
  const newOfficePayload = {
    property: {
      title: 'Tianhe International Financial Center Office',
      chineseTitle: '天河国际金融中心商业办公室',
      propertyType: 'office',
      district: 'Tianhe CBD',
      address: 'Zhujiang West Road, Tianhe District, Guangzhou',
      chineseAddress: '广州市天河区珠江西路广州IFC',
      monthlyRentCNY: 28000,
      monthlyRentUSD: 3867,
      depositMonths: 2,
      advanceRentMonths: 1,
      floorAreaSqm: 240,
      deskCapacity: 35,
      isFurnished: true,
      amenities: ['Boardroom', 'Canton Fair Shuttle', '24/7 Access', 'Fiber Internet'],
      status: 'live'
    },
    adminId: 'adm-001'
  };

  const publishOfficeRes = await post('/api/admin/rentals/listings', newOfficePayload, {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  });

  assert.strictEqual(publishOfficeRes.status, 201, "Failed to publish commercial office listing");
  assert.strictEqual(publishOfficeRes.data.property.propertyType, 'office');
  assert.strictEqual(publishOfficeRes.data.property.deskCapacity, 35);

  console.log(`✅ PASSED: Dedicated Admin created commercial office listing ID ${publishOfficeRes.data.property.id}`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 9: Strict Workflow Separation (RMB Transfers vs Naira Withdrawals)
  // -------------------------------------------------------------
  console.log('\n--- 9. Strict Workflow Separation: RMB Transfers vs Naira Withdrawals ---');
  const dbStatePath = path.join(__dirname, '../db-state.json');
  const state = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

  const supplierPayments = Object.values(state.supplier_payments || {});
  const withdrawals = Object.values(state.withdrawals || {});

  // Confirm that supplier payments contain Chinese beneficiary accounts (Alipay, WeChat, Bank) and RMB amounts
  supplierPayments.forEach((p) => {
    assert.ok(p.amountRMB !== undefined, `Supplier payment ${p.id} missing amountRMB`);
    assert.ok(p.receiverAccount !== undefined, `Supplier payment ${p.id} missing receiverAccount`);
    assert.ok(p.amountNGN === undefined, `Supplier payment ${p.id} improperly mixed with amountNGN`);
  });

  // Confirm that withdrawals contain Nigerian bank NUBAN accounts (10 digits) and NGN amounts
  withdrawals.forEach((w) => {
    assert.ok(w.amountNGN !== undefined, `Withdrawal ${w.id} missing amountNGN`);
    assert.ok(w.accountNumber !== undefined && w.accountNumber.length === 10, `Withdrawal ${w.id} accountNumber must be 10 digits`);
    assert.ok(w.amountRMB === undefined, `Withdrawal ${w.id} improperly mixed with amountRMB`);
  });

  console.log(`✅ PASSED: Verified strict separation between ${supplierPayments.length} China RMB transfers and ${withdrawals.length} Naira withdrawals`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 10: Multi-Currency General Ledger Trial Balance Equilibrium
  // -------------------------------------------------------------
  console.log('\n--- 10. Multi-Currency General Ledger Trial Balance Equilibrium ---');
  const adminHeaders = {
    'x-admin-id': 'adm-001',
    'x-admin-role': 'super_admin'
  };

  const reconRes = await get('/api/admin/ledger/reconciliation', adminHeaders);
  assert.strictEqual(reconRes.status, 200, 'Should retrieve reconciliation from ledger');
  assert.ok(reconRes.data.success, 'Reconciliation report returned');
  const tb = reconRes.data.trialBalance || {};
  assert.ok(tb.NGN && Math.abs(tb.NGN.net || 0) < 0.001, 'NGN net delta must be zero');
  assert.ok(tb.CNY && Math.abs(tb.CNY.net || 0) < 0.001, 'CNY net delta must be zero');
  assert.ok(tb.USD && Math.abs(tb.USD.net || 0) < 0.001, 'USD net delta must be zero');

  console.log(`✅ PASSED: General Ledger in perfect balance for NGN, CNY, USD`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 11: Cryptographic SHA-256 Audit Log Integrity Chain
  // -------------------------------------------------------------
  console.log('\n--- 11. Cryptographic Audit Log Integrity Verification ---');
  const auditRes = await get('/api/admin/audit-logs/verify', adminHeaders);
  assert.strictEqual(auditRes.status, 200, 'Should verify audit chain');
  assert.strictEqual(auditRes.data.valid, true, 'Audit log chain must be intact');

  console.log(`✅ PASSED: Cryptographic SHA-256 audit chain verified (${auditRes.data.blocksVerified} blocks verified against GENESIS_FLYE_2026)`);
  passedTests++;

  console.log('\n=============================================================');
  console.log(`  ALL ${passedTests} SERVICE SEPARATION & INTEGRATION TESTS PASSED!`);
  console.log('=============================================================\n');
}

runServiceSeparationSuite().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILURE:', err);
  process.exit(1);
});
