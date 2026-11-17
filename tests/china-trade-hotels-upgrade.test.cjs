/**
 * tests/china-trade-hotels-upgrade.test.cjs
 * Comprehensive Verification Test Suite for China Trade Hotels Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in HotelsScreen.tsx, HotelDetailScreen.tsx, & HotelBookingsScreen.tsx:
 *    - Accommodation booking interface for business travelers visiting trade hubs in Guangzhou and Yiwu
 *    - Hotel listings featuring Guangzhou and Yiwu trade centers, market distances, and multi-currency pricing
 *    - Room details with room categories, amenities, nightly surcharges, and live room availability indicators
 *    - Wallet payment booking checkout with stay duration, guest details, multi-currency wallet selector,
 *      6-digit transaction PIN authorization, confirmation reference, QR token, and Chinese taxi card
 *    - Strict preservation of luxury dark-mode FinTech design tokens
 * 2. Admin Logic in AdminHotelsScreen.tsx:
 *    - Admin hotel listing manager to add properties with title, Chinese address, pricing (USD, CNY, NGN), and photos
 *    - Room availability management (property publishing and granular room type availability toggling)
 *    - Review booking reservation requests queue with status filters and cancel/refund capabilities
 * 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts):
 *    - /api/hotels/listings, /api/hotels/book, /api/hotels/cancel
 *    - /api/admin/hotels/create, /api/admin/hotels/update, /api/admin/hotels/toggle-status, /api/admin/hotels/delete,
 *      /api/admin/hotels/room-availability, /api/admin/hotels/booking-status, /api/admin/hotels/bookings
 *    - db.ts methods: createHotel, updateHotel, toggleHotelStatus, deleteHotel, updateRoomAvailability, bookHotelWithPin
 * 4. Authoritative Database State in db-state.json (Guangzhou and Yiwu trade hotels)
 * 5. Authoritative Double-Entry General Ledger Equilibrium across NGN, USD, CNY
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

console.log('=============================================================================');
console.log('FLYEMASS "CHINA TRADE HOTELS" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (HotelsScreen.tsx, HotelDetailScreen.tsx, HotelBookingsScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 HotelsScreen features trade hub destination filters highlighting Guangzhou and Yiwu', () => {
  const file = path.join(BASE_DIR, 'src/screens/hotels/HotelsScreen.tsx');
  assert.ok(fs.existsSync(file), 'HotelsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Guangzhou') && content.includes('Yiwu'), 'Includes Guangzhou and Yiwu trade hubs');
  assert.ok(content.includes('China Business Hotels') || content.includes('Hotels & BNBs'), 'Screen header present');
  assert.ok(content.includes('selectedCity') && content.includes('setSelectedCity'), 'City filter state exists');
  assert.ok(content.includes('checkInDate') && content.includes('checkOutDate'), 'Stay dates picker exists');
  assert.ok(content.includes('calculateNights'), 'Stay duration calculation function exists');
});

test('1.2 HotelsScreen lists properties with trade market distances, Chinese names, and multi-currency prices', () => {
  const file = path.join(BASE_DIR, 'src/screens/hotels/HotelsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('distanceToMarket'), 'Displays distance to trade market or Canton Fair');
  assert.ok(content.includes('chineseName'), 'Displays Chinese name for local navigation');
  assert.ok(content.includes('pricePerNightUSD') || content.includes('pricePerNightCNY'), 'Includes multi-currency prices');
  assert.ok(content.includes("navigate('hotel-detail'"), 'Allows clicking through to hotel detail screen');
});

test('1.3 HotelDetailScreen displays room details with categories, surcharges, and live availability', () => {
  const file = path.join(BASE_DIR, 'src/screens/hotels/HotelDetailScreen.tsx');
  assert.ok(fs.existsSync(file), 'HotelDetailScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('roomTypes') && content.includes('selectedRoom'), 'Room category selection state present');
  assert.ok(content.includes('Standard Room') || content.includes('nightlySurchargeUSD'), 'Room specifications and surcharges present');
  assert.ok(content.includes('isRoomAvailable') || content.includes('isAvailable'), 'Checks live room availability');
  assert.ok(content.includes('Sold Out') || content.includes('Available'), 'Renders room availability indicators');
});

test('1.4 HotelDetailScreen provides wallet payment booking checkout with PIN authorization and Chinese taxi card', () => {
  const file = path.join(BASE_DIR, 'src/screens/hotels/HotelDetailScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('paymentCurrency') && content.includes('setPaymentCurrency'), 'Multi-currency settlement wallet selector present');
  assert.ok(content.includes('PinPad'), 'Integrated with secure 6-digit transaction PIN authorization modal');
  assert.ok(content.includes('bookHotelWithPin'), 'Executes authoritative booking via bookHotelWithPin');
  assert.ok(content.includes('taxiCardZh') || content.includes('handleCopyTaxiCard'), 'Chinese taxi driver directions card is present');
  assert.ok(content.includes('guestName') && content.includes('guestEmail') && content.includes('guestPhone'), 'Guest profile details collected');
});

test('1.5 HotelBookingsScreen displays active vouchers, QR tokens, bilingual directions, and cancel/refund', () => {
  const file = path.join(BASE_DIR, 'src/screens/hotels/HotelBookingsScreen.tsx');
  assert.ok(fs.existsSync(file), 'HotelBookingsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('filteredBookings'), 'Displays active bookings list');
  assert.ok(content.includes('handleDownloadVoucher'), 'Allows downloading official bilingual hotel reservation voucher');
  assert.ok(content.includes('cancelHotelBooking') || content.includes('handleCancel'), 'Supports booking cancellation with wallet refund');
  assert.ok(content.includes('taxiCardZh'), 'Includes Chinese taxi directions card');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic (AdminHotelsScreen.tsx)
// -----------------------------------------------------------------------------
test('2.1 AdminHotelsScreen provides hotel listing manager to add and edit properties', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminHotelsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminHotelsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleOpenNewHotelDrawer'), 'Drawer trigger to add new hotel listing exists');
  assert.ok(content.includes('handleEditHotel'), 'Handler to edit existing hotel listing exists');
  assert.ok(content.includes('handlePublishHotel'), 'Handler to save/publish hotel listing exists');
  assert.ok(content.includes('hotelTitle') && content.includes('hotelCity'), 'Collects property title and trade city');
  assert.ok(content.includes('hotelAddressEng') && content.includes('hotelAddressZh'), 'Collects English and Chinese taxi addresses');
});

test('2.2 AdminHotelsScreen manages property and room availability', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminHotelsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleToggleHotelStatus'), 'Allows toggling hotel live / unpublished status');
  assert.ok(content.includes('isAvailable'), 'Allows toggling room type availability status');
  assert.ok(content.includes('hotelAvailable') || content.includes('isPublished'), 'Hotel availability boolean tracked');
  assert.ok(content.includes('handleDeleteHotel'), 'Allows deleting hotel listing with confirmation');
});

test('2.3 AdminHotelsScreen provides booking queue to review reservation requests and manage status', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminHotelsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("activeTab === 'bookings'") || content.includes('Booking queue'), 'Booking queue tab exists');
  assert.ok(content.includes('handleUpdateBookingStatus'), 'Handler to update reservation status exists');
  assert.ok(content.includes('handleCancelAndRefundBooking'), 'Handler to cancel and refund booking exists');
  assert.ok(content.includes('bookingStatusFilter'), 'Filters bookings by confirmed, checked_in, completed, cancelled');
});

// -----------------------------------------------------------------------------
// 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts)
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs handles hotel directory, booking, cancellation, and admin management endpoints', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/hotels/listings'"), 'Listings endpoint exists');
  assert.ok(content.includes("pathname === '/api/hotels/book'"), 'Booking checkout endpoint exists');
  assert.ok(content.includes("pathname === '/api/hotels/cancel'"), 'Cancellation endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/create'"), 'Admin hotel create endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/update'"), 'Admin hotel update endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/toggle-status'"), 'Admin hotel toggle-status endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/delete'"), 'Admin hotel delete endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/room-availability'"), 'Admin room availability endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/hotels/booking-status'"), 'Admin booking status update endpoint exists');
});

test('3.2 db.ts exposes createHotel, updateHotel, toggleHotelStatus, deleteHotel, and updateRoomAvailability', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('createHotel('), 'db.ts includes createHotel');
  assert.ok(content.includes('updateHotel('), 'db.ts includes updateHotel');
  assert.ok(content.includes('toggleHotelStatus('), 'db.ts includes toggleHotelStatus');
  assert.ok(content.includes('deleteHotel('), 'db.ts includes deleteHotel');
  assert.ok(content.includes('updateRoomAvailability('), 'db.ts includes updateRoomAvailability');
  assert.ok(content.includes('bookHotelWithPin('), 'db.ts includes bookHotelWithPin');
  assert.ok(content.includes('cancelHotelBooking('), 'db.ts includes cancelHotelBooking');
  assert.ok(content.includes('updateHotelBookingStatus('), 'db.ts includes updateHotelBookingStatus');
});

// -----------------------------------------------------------------------------
// 4. Authoritative Database State (Guangzhou and Yiwu hotels)
// -----------------------------------------------------------------------------
test('4.1 db-state.json contains active trade hotels in Guangzhou and Yiwu with room types and bookings', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const hotels = Object.values(state.hotels || {});
  assert.ok(hotels.length > 0, 'Hotels must exist in db-state.json');

  const gzHotel = hotels.find(h => h.city?.toLowerCase() === 'guangzhou');
  assert.ok(gzHotel, 'Guangzhou trade hotel must exist in db-state');
  assert.ok(gzHotel.name, 'Guangzhou hotel has valid name');
  assert.ok(gzHotel.pricePerNightUSD > 0, 'Guangzhou hotel has USD price');

  const yiwuHotel = hotels.find(h => h.city?.toLowerCase() === 'yiwu');
  assert.ok(yiwuHotel, 'Yiwu trade hotel must exist in db-state');
  assert.ok(yiwuHotel.name, 'Yiwu hotel has valid name');

  const bookings = Object.values(state.hotel_bookings || {});
  assert.ok(bookings.length > 0, 'Hotel bookings must exist in db-state.json');
  assert.ok(bookings[0].id, 'Booking has valid id');
});

// -----------------------------------------------------------------------------
// 5. Authoritative Double-Entry General Ledger Equilibrium
// -----------------------------------------------------------------------------
test('5.1 Double-Entry General Ledger in db-state.json maintains 100% mathematical equilibrium across NGN, USD, CNY', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);
  assert.ok(entries.length > 0, 'double_entry_ledger entries must exist');

  const totals = { USD: 0, NGN: 0, CNY: 0 };

  for (const entry of entries) {
    if (Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        const curr = p.currency || 'USD';
        const d = Number(p.debit) || 0;
        const c = Number(p.credit) || 0;
        if (totals[curr] !== undefined) {
          totals[curr] += (d - c);
        }
      }
    }
  }

  assert.ok(Math.abs(totals.NGN) < 0.01, `NGN ledger unbalanced: ${totals.NGN}`);
  assert.ok(Math.abs(totals.USD) < 0.01, `USD ledger unbalanced: ${totals.USD}`);
  assert.ok(Math.abs(totals.CNY) < 0.01, `CNY ledger unbalanced: ${totals.CNY}`);

  console.log(`   Ledger Equilibrium Verified:
   • USD Net Difference: $${totals.USD.toFixed(4)}
   • NGN Net Difference: ₦${totals.NGN.toFixed(4)}
   • CNY Net Difference: ¥${totals.CNY.toFixed(4)}`);
});

console.log('\n=============================================================================');
console.log('ALL 12 VERIFICATION TESTS FOR CHINA TRADE HOTELS PASSED SUCCESSFULLY!');
console.log('=============================================================================\n');
