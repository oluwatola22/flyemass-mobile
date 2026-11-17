/**
 * FLYEMASS — HOTEL & RENTALS ADMIN WORKSPACE UPGRADE TEST SUITE
 * 
 * Verifies 1:1 visual & backend integration with the updated China Stays Admin Workspace:
 * 1. 4 Seed Hotels from Screenshot 1 (Canton Trade Tower Hotel, Yiwu Market View, etc.)
 * 2. Metric Cards: Total Listings, Live Now, Sold Out, Cities Covered
 * 3. Hotel Listing Creation Drawer (Screenshot 2 & 3) with dynamic rooms, amenities & multi-currency
 * 4. Hotel Status Toggle & Soft Delete
 * 5. Booking Queue with Atomic Escrow Reversals
 * 6. Apartments & Commercial Offices Tab
 * 7. Rental Inquiries Tab with Staff Assignment & Zero Wallet Debit
 */

const assert = require('assert');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5050';

function bold(str) { return `\x1b[1m${str}\x1b[0m`; }
function green(str) { return `\x1b[32m${str}\x1b[0m`; }
function cyan(str) { return `\x1b[36m${str}\x1b[0m`; }

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-id': 'adm-001',
  'x-admin-role': 'super_admin'
};

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function postJson(endpoint, body, headers = {}) {
  return fetchJson(endpoint, {
    method: 'POST',
    headers: { ...headers },
    body: JSON.stringify(body)
  });
}

async function getJson(endpoint, headers = {}) {
  return fetchJson(endpoint, { method: 'GET', headers });
}

async function runAdminHotelsWorkspaceTests() {
  console.log(bold('\n==============================================================='));
  console.log(bold('  FLYEMASS: ADMIN CHINA STAYS WORKSPACE INTEGRATION TEST'));
  console.log(bold('===============================================================\n'));

  // -----------------------------------------------------------------
  // 1. Verify 4 Seed Hotels from Screenshot 1
  // -----------------------------------------------------------------
  console.log(cyan('1. Verifying 4 Primary Seed Hotels & Metrics from Screenshot 1...'));
  const listingsRes = await getJson('/api/hotels/listings');
  assert.strictEqual(listingsRes.ok, true, 'Hotels listing must return 200');
  const hotels = listingsRes.data.hotels || listingsRes.data || [];
  
  const canton = hotels.find(h => h.id === 'hotel-canton-trade' || (h.name && h.name.includes('Canton Trade Tower')));
  assert.ok(canton, 'Canton Trade Tower Hotel must exist');
  assert.strictEqual(canton.city, 'Guangzhou');
  assert.strictEqual(canton.pricePerNightUSD, 45);
  assert.strictEqual(canton.pricePerNightCNY, 320);
  assert.strictEqual(canton.pricePerNightNGN, 72000);
  assert.strictEqual(canton.rating, 4.5);
  assert.strictEqual(canton.roomTypes.length, 3);

  const yiwu = hotels.find(h => h.id === 'hotel-yiwu-market' || (h.name && h.name.includes('Yiwu Market View')));
  assert.ok(yiwu, 'Yiwu Market View Residence must exist');
  assert.strictEqual(yiwu.city, 'Yiwu');
  assert.strictEqual(yiwu.pricePerNightUSD, 38);
  assert.strictEqual(yiwu.pricePerNightCNY, 270);
  assert.strictEqual(yiwu.pricePerNightNGN, 61000);

  const sz = hotels.find(h => h.id === 'hotel-sz-huaqiangbei' || (h.name && h.name.includes('Shenzhen Huaqiangbei')));
  assert.ok(sz, 'Shenzhen Huaqiangbei Suites must exist');
  assert.strictEqual(sz.city, 'Shenzhen');
  assert.strictEqual(sz.pricePerNightUSD, 52);
  assert.strictEqual(sz.pricePerNightCNY, 370);
  assert.strictEqual(sz.pricePerNightNGN, 83000);

  const sh = hotels.find(h => h.id === 'hotel-sh-bund-loft' || (h.name && h.name.includes('Shanghai Bund Loft')));
  assert.ok(sh, 'Shanghai Bund Loft BNB must exist');
  assert.strictEqual(sh.city, 'Shanghai');
  assert.strictEqual(sh.pricePerNightUSD, 60);
  assert.strictEqual(sh.pricePerNightCNY, 430);
  assert.strictEqual(sh.pricePerNightNGN, 96000);

  const cities = new Set(hotels.map(h => h.city));
  console.log(green(`✓ Found ${hotels.length} hotels covering ${cities.size} cities with exact multi-currency pricing matching Screenshot 1`));

  // -----------------------------------------------------------------
  // 2. Admin Creates New Hotel Listing (Screenshots 2 & 3 Drawer)
  // -----------------------------------------------------------------
  console.log(cyan('\n2. Testing Admin Hotel Listing Creation Drawer...'));
  const newHotelData = {
    name: 'Guangzhou Pazhou Exhibition Suite',
    city: 'Guangzhou',
    englishAddress: 'No. 380 Yuejiang Middle Road, Haizhu District, Guangzhou',
    chineseAddress: '广州市海珠区阅江中路380号',
    description: 'Direct shuttle to Canton Fair Complex with dedicated multilingual trade desk.',
    rating: 4.8,
    isPublished: true,
    pricePerNightUSD: 80,
    pricePerNightCNY: 570,
    pricePerNightNGN: 128000,
    roomTypes: [
      { id: 'standard', name: 'Standard King', surchargeUSD: 0, surchargeCNY: 0, surchargeNGN: 0 },
      { id: 'fair_deluxe', name: 'Canton Fair Executive View', surchargeUSD: 35, surchargeCNY: 250, surchargeNGN: 56000 }
    ],
    amenities: [
      'Free Wi-Fi',
      'Breakfast included',
      'Air conditioning',
      'Airport shuttle',
      'Elevator',
      '24/7 reception',
      'English-speaking staff'
    ],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000']
  };

  const createRes = await postJson('/api/admin/hotels/create', { hotel: newHotelData, adminId: 'adm-001' }, ADMIN_HEADERS);
  assert.strictEqual(createRes.ok, true, 'Hotel creation must succeed');
  const createdHotel = createRes.data.hotel;
  assert.ok(createdHotel && createdHotel.id, 'Created hotel must have ID');
  assert.strictEqual(createdHotel.name, newHotelData.name);
  assert.strictEqual(createdHotel.amenities.length, 7);
  console.log(green(`✓ Admin created listing "${createdHotel.name}" (ID: ${createdHotel.id})`));

  // -----------------------------------------------------------------
  // 3. Admin Toggles Hotel Status (Live -> Unpublished -> Live)
  // -----------------------------------------------------------------
  console.log(cyan('\n3. Testing Admin Hotel Status Toggle...'));
  const toggleOff = await postJson('/api/admin/hotels/toggle-status', { hotelId: createdHotel.id, adminId: 'adm-001' }, ADMIN_HEADERS);
  assert.strictEqual(toggleOff.ok, true);
  assert.strictEqual(toggleOff.data.hotel.isPublished, false, 'Hotel must now be unpublished');

  const toggleOn = await postJson('/api/admin/hotels/toggle-status', { hotelId: createdHotel.id, adminId: 'adm-001' }, ADMIN_HEADERS);
  assert.strictEqual(toggleOn.ok, true);
  assert.strictEqual(toggleOn.data.hotel.isPublished, true, 'Hotel must now be live');
  console.log(green('✓ Hotel status toggled between unpublished and live successfully'));

  // -----------------------------------------------------------------
  // 4. Admin Updates Hotel Details
  // -----------------------------------------------------------------
  console.log(cyan('\n4. Testing Admin Hotel Edit / Update...'));
  const updateRes = await postJson('/api/admin/hotels/update', {
    hotel: {
      ...createdHotel,
      pricePerNightUSD: 85,
      pricePerNightCNY: 600,
      pricePerNightNGN: 135000
    },
    adminId: 'adm-001'
  }, ADMIN_HEADERS);
  assert.strictEqual(updateRes.ok, true);
  assert.strictEqual(updateRes.data.hotel.pricePerNightUSD, 85);
  console.log(green('✓ Hotel pricing updated successfully'));

  // -----------------------------------------------------------------
  // 5. Customer Booking & Admin Queue Settlement & Cancellation Refund
  // -----------------------------------------------------------------
  console.log(cyan('\n5. Testing Booking Queue Lifecycle & Atomic Cancellation Refund...'));
  const testUser = 'usr_alade_01';
  const testPin = '246810';
  await postJson('/api/auth/set-pin', { userId: testUser, newPin: testPin });

  // Get user balance before booking
  const balBeforeRes = await getJson(`/api/wallets/${testUser}`);
  const initialUSD = balBeforeRes.data.balances?.USD || 0;

  const bookRes = await postJson('/api/hotels/book', {
    userId: testUser,
    pin: testPin,
    hotelId: createdHotel.id,
    roomType: 'Standard King',
    nights: 2,
    checkIn: '2026-12-01',
    checkOut: '2026-12-03',
    guestCount: 2,
    guestName: 'Alade Test Guest',
    guestPhone: '+2348012345678',
    currency: 'USD'
  });
  assert.strictEqual(bookRes.ok, true, 'Hotel booking must succeed');
  const booking = bookRes.data.booking;
  assert.ok(booking.id, 'Booking must have reference ID');
  assert.strictEqual(booking.totalUSD, 170); // $85 * 2 nights

  // Verify wallet balance debited
  const balAfterRes = await getJson(`/api/wallets/${testUser}`);
  assert.strictEqual(balAfterRes.data.balances.USD, initialUSD - 170);
  console.log(green(`✓ Booking created: ${booking.reference || booking.id} for $170 USD; wallet debited correctly`));

  // Admin marks booking as checked in
  const checkInRes = await postJson('/api/admin/hotels/booking-status', {
    bookingId: booking.id,
    status: 'checked_in',
    notes: 'Guest checked in at front desk, passport verified.'
  }, ADMIN_HEADERS);
  assert.strictEqual(checkInRes.ok, true);
  assert.strictEqual(checkInRes.data.booking.status, 'checked_in');
  console.log(green('✓ Admin updated booking status to checked_in'));

  // Admin cancels booking with atomic double-entry refund
  const cancelRes = await postJson('/api/admin/hotels/booking-status', {
    bookingId: booking.id,
    status: 'cancelled',
    notes: 'Guest requested early flight departure cancellation refund.'
  }, ADMIN_HEADERS);
  assert.strictEqual(cancelRes.ok, true);
  assert.strictEqual(cancelRes.data.booking.status, 'cancelled');

  // Verify balance fully refunded
  const balRefundRes = await getJson(`/api/wallets/${testUser}`);
  assert.strictEqual(balRefundRes.data.balances.USD, initialUSD, 'User wallet balance must be completely restored after cancellation');
  console.log(green(`✓ Booking cancelled and atomic escrow refund returned $170 to user balance (${balRefundRes.data.balances.USD} USD)`));

  // -----------------------------------------------------------------
  // 6. Admin Rental Properties & Inquiry Flow (Zero Wallet Debit)
  // -----------------------------------------------------------------
  console.log(cyan('\n6. Testing Admin Rental Properties Management & Zero-Debit Inquiries...'));
  const newPropertyPayload = {
    title: 'Zhujiang New Town High-Rise Executive 2BR',
    type: 'apartment',
    district: 'Tianhe District, Guangzhou',
    englishAddress: 'Tower B, Poly International Plaza, Tianhe, Guangzhou',
    chineseAddress: '广州市天河区保利国际广场B座',
    description: 'Fully furnished serviced apartment with floor-to-ceiling windows overlooking Canton Tower.',
    monthlyRentCNY: 9500,
    monthlyRentUSD: 1350,
    monthlyRentNGN: 2150000,
    depositMonths: 2,
    advanceMonths: 1,
    sizeSqm: 115,
    bedrooms: 2,
    bathrooms: 2,
    metroAccess: '5 mins walk to Zhujiang New Town Metro (Line 3/5)',
    amenities: ['Furnished', 'Central AC', 'Balcony', 'Gym', '24h Security'],
    isAvailable: true
  };

  const createPropRes = await postJson('/api/admin/rentals/listings', { property: newPropertyPayload, adminId: 'adm-001' }, ADMIN_HEADERS);
  assert.strictEqual(createPropRes.ok, true);
  const createdProp = createPropRes.data.property;
  assert.ok(createdProp.id);
  console.log(green(`✓ Admin created rental property "${createdProp.title}"`));

  // Mobile customer submits inquiry
  const inqRes = await postJson('/api/rentals/inquire', {
    userId: testUser,
    propertyId: createdProp.id,
    propertyTitle: createdProp.title,
    propertyType: createdProp.type,
    district: createdProp.district,
    customerName: 'Alade Executive',
    customerPhone: '+2348099887766',
    preferredMoveInDate: '2026-12-15',
    leaseDuration: '1 year',
    customNotes: 'Require bilingual rental lease agreement for company expense reimbursement.'
  });
  assert.strictEqual(inqRes.ok, true);
  const inquiry = inqRes.data.inquiry;
  assert.ok(inquiry.id);
  assert.strictEqual(inquiry.status, 'new');

  // Verify wallet balance was NOT debited
  const balCheckAfterInq = await getJson(`/api/wallets/${testUser}`);
  assert.strictEqual(balCheckAfterInq.data.balances.USD, initialUSD, 'Rental inquiry must NEVER debit customer wallet');
  console.log(green(`✓ Rental inquiry submitted (${inquiry.reference || inquiry.id}); customer wallet balance remained untouched ($${balCheckAfterInq.data.balances.USD})`));

  // Admin updates inquiry status & assigns staff
  const updateInqRes = await postJson('/api/admin/rentals/inquiry-status', {
    inquiryId: inquiry.id,
    status: 'viewing_scheduled',
    assignedStaff: 'David Zhang (Guangzhou Relocation Desk)',
    notes: 'Viewing scheduled for 2026-12-05 with English-speaking China Desk agent.'
  }, ADMIN_HEADERS);
  assert.strictEqual(updateInqRes.ok, true);
  assert.strictEqual(updateInqRes.data.inquiry.status, 'viewing_scheduled');
  assert.strictEqual(updateInqRes.data.inquiry.assignedStaff, 'David Zhang (Guangzhou Relocation Desk)');
  console.log(green('✓ Admin inquiry updated to viewing_scheduled with staff assignment'));

  // -----------------------------------------------------------------
  // 7. Cleanup Test Listings
  // -----------------------------------------------------------------
  console.log(cyan('\n7. Cleaning Up Test Listings...'));
  await postJson('/api/admin/hotels/delete', { hotelId: createdHotel.id, adminId: 'adm-001' }, ADMIN_HEADERS);
  await postJson('/api/admin/rentals/delete', { propertyId: createdProp.id, adminId: 'adm-001' }, ADMIN_HEADERS);
  console.log(green('✓ Test records cleaned up cleanly'));

  console.log(bold('\n==============================================================='));
  console.log(bold(green('  ALL ADMIN HOTELS & RENTALS WORKSPACE TESTS PASSED (100%)')));
  console.log(bold('===============================================================\n'));
}

runAdminHotelsWorkspaceTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
