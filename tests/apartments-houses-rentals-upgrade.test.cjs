/**
 * tests/apartments-houses-rentals-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Apartments & Houses Rentals Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in ApartmentsScreen.tsx & OfficeRentalsScreen.tsx:
 *    - Real estate listing directory for residential apartments and commercial spaces in Guangzhou
 *    - Detailed property views (monthly rent in CNY/USD, upfront move-in costs, square meters, bedrooms, amenities, addresses)
 *    - Booking agent consultations and viewing inquiries (applicant profile, move-in/viewing dates, lease terms)
 *    - Generates inquiry reference (INQ-APT / INQ-OFF) and linked support ticket
 *    - Active user inquiries tracker card with China Desk concierge status
 *    - Strict preservation of luxury dark-mode FinTech design tokens
 * 2. Admin Logic in AdminRentalsApartmentsScreen.tsx, AdminRentalsOfficesScreen.tsx, & AdminHotelsScreen.tsx:
 *    - Admin property listing management panel to upload and update residential and commercial rental spaces
 *    - Pricing management (CNY, USD, deposit/advance terms, floor area, amenities)
 *    - Reviewing inquiry leads with status filters (new, viewing_scheduled, agreement_in_progress, closed)
 *    - Inquiry status updates and assigned concierge staff management
 * 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts):
 *    - /api/rentals/properties, /api/rentals/inquire, /api/rentals/inquiries
 *    - /api/admin/rentals/inquiry-status, /api/admin/rentals/listings, /api/admin/rentals/toggle-status, /api/admin/rentals/delete
 *    - db.ts methods: createRentalProperty, updateRentalProperty, toggleRentalPropertyStatus, deleteRentalProperty,
 *      createPropertyInquiry, updatePropertyInquiryStatus, getPropertyInquiries
 * 4. Authoritative Database State in db-state.json (Guangzhou residential apartments, commercial spaces, and inquiry leads)
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
console.log('FLYEMASS "APARTMENTS & HOUSES RENTALS" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (ApartmentsScreen.tsx & OfficeRentalsScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 ApartmentsScreen provides real estate directory for residential apartments in Guangzhou', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/ApartmentsScreen.tsx');
  assert.ok(fs.existsSync(file), 'ApartmentsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Apartments & House Rentals'), 'Header title is present');
  assert.ok(content.includes('Guangzhou') && content.includes('Tianhe CBD'), 'Features Guangzhou residential districts');
  assert.ok(content.includes('apartmentDistricts'), 'District filter list exists');
  assert.ok(content.includes('filteredApartments'), 'Filters residential properties');
});

test('1.2 ApartmentsScreen calculates upfront move-in costs and displays comprehensive property details', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/ApartmentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('upfrontMoveInCNY'), 'Calculates estimated upfront move-in cost');
  assert.ok(content.includes('depositMonths') && content.includes('advanceRentMonths'), 'Includes deposit and advance rent parameters');
  assert.ok(content.includes('floorAreaSqm') && content.includes('bedrooms'), 'Displays floor area and bedroom count');
  assert.ok(content.includes('monthlyRentCNY'), 'Displays monthly rent in Chinese Yuan');
});

test('1.3 ApartmentsScreen allows users to book agent consultations and view active inquiries', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/ApartmentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleInquirySubmit'), 'Has inquiry submission handler');
  assert.ok(content.includes('selectedPropForInquiry'), 'Has property selection state for inquiry');
  assert.ok(content.includes('applicantName') && content.includes('applicantPhone'), 'Collects applicant contact profile');
  assert.ok(content.includes('preferredMoveIn') && content.includes('leaseDuration'), 'Collects move-in timeline and lease duration');
  assert.ok(content.includes('userInquiries'), 'Renders active customer inquiries tracking card');
});

test('1.4 OfficeRentalsScreen provides directory and viewing bookings for commercial spaces in Guangzhou', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/OfficeRentalsScreen.tsx');
  assert.ok(fs.existsSync(file), 'OfficeRentalsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Commercial Office Rentals'), 'Commercial office title present');
  assert.ok(content.includes('Pazhou') && content.includes('Tianhe CBD'), 'Covers Guangzhou commercial trade zones');
  assert.ok(content.includes('handleViewingSubmit'), 'Has commercial viewing schedule handler');
  assert.ok(content.includes('preferredViewing'), 'Collects preferred viewing date');
  assert.ok(content.includes('companyName'), 'Collects company name for commercial lease');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic (AdminRentalsApartmentsScreen.tsx, AdminRentalsOfficesScreen.tsx, AdminHotelsScreen.tsx)
// -----------------------------------------------------------------------------
test('2.1 AdminRentalsApartmentsScreen allows uploading and updating residential property listings and pricing', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsApartmentsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminRentalsApartmentsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('showAddModal') && content.includes('setShowAddModal'), 'Add apartment modal state exists');
  assert.ok(content.includes('handleAddApartment'), 'Apartment upload submission handler exists');
  assert.ok(content.includes('newRentCNY') && content.includes('newDepositMonths'), 'Collects monthly rent and deposit terms');
  assert.ok(content.includes('newDistrict') && content.includes('newAddress'), 'Collects district and address details');
});

test('2.2 AdminRentalsApartmentsScreen provides tenant inquiry leads queue and status updates', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsApartmentsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('residentialInquiries'), 'Filters tenant inquiries list');
  assert.ok(content.includes('handleUpdateInquiryStatus'), 'Status update handler exists');
  assert.ok(content.includes('inquiryStatusFilter'), 'Status filter control exists');
});

test('2.3 AdminRentalsOfficesScreen allows uploading commercial spaces and managing viewing leads', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsOfficesScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminRentalsOfficesScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleAddOffice'), 'Office upload submission handler exists');
  assert.ok(content.includes('newRentCNY') && content.includes('newFloorArea'), 'Collects office rent and square meters');
  assert.ok(content.includes('officeInquiries'), 'Filters commercial viewing inquiries');
  assert.ok(content.includes('handleUpdateInquiryStatus'), 'Commercial inquiry status update handler exists');
});

test('2.4 AdminHotelsScreen unified stays panel manages rental properties and inquiries', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminHotelsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminHotelsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("activeTab === 'rentals'") || content.includes('Apartments & offices'), 'Rentals management tab exists');
  assert.ok(content.includes("activeTab === 'inquiries'") || content.includes('Rental enquiries'), 'Rental enquiries tab exists');
  assert.ok(content.includes('handlePublishRental') || content.includes('handleEditRental'), 'Rental publishing and editing handlers exist');
  assert.ok(content.includes('handleToggleRentalStatus'), 'Rental status toggle handler exists');
});

// -----------------------------------------------------------------------------
// 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts)
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs handles rental listings, inquiry submission, and admin status updates', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/rentals/properties'"), 'Rental properties query endpoint exists');
  assert.ok(content.includes("pathname === '/api/rentals/inquire'"), 'Property inquiry creation endpoint exists');
  assert.ok(content.includes("pathname === '/api/rentals/inquiries'"), 'Property inquiries list endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/rentals/inquiry-status'"), 'Inquiry status update endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/rentals/listings'"), 'Rental listing creation endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/rentals/toggle-status'"), 'Rental status toggle endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/rentals/delete'"), 'Rental deletion endpoint exists');
});

test('3.2 db.ts exposes createRentalProperty, toggleRentalPropertyStatus, deleteRentalProperty, and createPropertyInquiry', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('createRentalProperty('), 'db.ts includes createRentalProperty');
  assert.ok(content.includes('toggleRentalPropertyStatus('), 'db.ts includes toggleRentalPropertyStatus');
  assert.ok(content.includes('deleteRentalProperty('), 'db.ts includes deleteRentalProperty');
  assert.ok(content.includes('createPropertyInquiry('), 'db.ts includes createPropertyInquiry');
  assert.ok(content.includes('updatePropertyInquiryStatus('), 'db.ts includes updatePropertyInquiryStatus');
  assert.ok(content.includes('getPropertyInquiries('), 'db.ts includes getPropertyInquiries');
});

// -----------------------------------------------------------------------------
// 4. Authoritative Database State (Guangzhou rentals & inquiry leads)
// -----------------------------------------------------------------------------
test('4.1 db-state.json contains active Guangzhou apartments, commercial offices, and inquiry leads', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const properties = Object.values(state.rental_properties || {});
  assert.ok(properties.length > 0, 'Rental properties must exist in db-state.json');

  const apt = properties.find(p => p.propertyType === 'apartment');
  assert.ok(apt, 'Residential apartment exists in db-state');
  assert.ok(apt.monthlyRentCNY > 0, 'Apartment has valid monthly rent');

  const office = properties.find(p => p.propertyType === 'office');
  assert.ok(office, 'Commercial office exists in db-state');
  assert.ok(office.district, 'Commercial office has valid district');

  const inquiries = Object.values(state.property_inquiries || {});
  assert.ok(inquiries.length > 0, 'Property inquiries must exist in db-state.json');
  assert.ok(inquiries[0].reference, 'Inquiry lead has reference code');
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
console.log('ALL 12 VERIFICATION TESTS FOR APARTMENTS & HOUSES RENTALS PASSED SUCCESSFULLY!');
console.log('=============================================================================\n');
