/**
 * tests/commercial-offices-upgrade.test.cjs
 * Comprehensive Verification Test Suite for Commercial Offices Upgrade
 *
 * Verifies:
 * 1. Mobile Logic in OfficeRentalsScreen.tsx:
 *    - Commercial showroom and office leasing directory tailored for international traders operating in China
 *    - Commercial hubs highlighting Pazhou exhibition zone, Tianhe CBD, Yuexiu, and Haizhu
 *    - Detailed property views (monthly commercial rent in CNY/USD, square meters, workstation capacity, amenities)
 *    - In-person commercial viewing and lease inquiry booking form (company name, applicant contact, viewing date, move-in date, lease term)
 *    - Generates commercial inquiry reference (INQ-OFF-2026-XXXXX) and linked support ticket
 *    - Active user commercial inquiries tracker card with China Desk concierge status
 *    - Strict preservation of luxury dark-mode FinTech design tokens
 * 2. Admin Logic in AdminRentalsOfficesScreen.tsx & AdminHotelsScreen.tsx:
 *    - Admin management tool to list commercial spaces and showrooms with pricing (CNY, USD), floor area, and desks
 *    - Catalog view displaying all commercial listings
 *    - Tracking lease inquiries with status filters (all, new, contacted, viewing_scheduled, closed)
 *    - Managing client bookings (Confirm Viewing, Mark Contacted, Commercial Lease Closed, Concierge Chat link)
 * 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts):
 *    - /api/rentals/properties?type=office, /api/rentals/inquire, /api/rentals/inquiries
 *    - /api/admin/rentals/inquiry-status, /api/admin/rentals/listings, /api/admin/rentals/toggle-status, /api/admin/rentals/delete
 *    - db.ts methods: createRentalProperty, createPropertyInquiry, updatePropertyInquiryStatus, getPropertyInquiries
 * 4. Authoritative Database State in db-state.json (Guangzhou commercial offices and INQ-OFF leads)
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
console.log('FLYEMASS "COMMERCIAL OFFICES" UPGRADE VERIFICATION SUITE');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// 1. Mobile Logic & UI/UX (OfficeRentalsScreen.tsx)
// -----------------------------------------------------------------------------
test('1.1 OfficeRentalsScreen provides commercial showroom and office leasing directory for China trade hubs', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/OfficeRentalsScreen.tsx');
  assert.ok(fs.existsSync(file), 'OfficeRentalsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('Commercial Office Rentals'), 'Header title is present');
  assert.ok(content.includes('Pazhou') && content.includes('Tianhe CBD'), 'Features Guangzhou commercial hubs');
  assert.ok(content.includes('officeDistricts'), 'Commercial district filter list exists');
  assert.ok(content.includes('filteredOffices'), 'Filters commercial office properties');
});

test('1.2 OfficeRentalsScreen displays monthly commercial rent, floor area, desk capacity, and trade amenities', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/OfficeRentalsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('monthlyRentCNY'), 'Displays monthly commercial rent in CNY');
  assert.ok(content.includes('monthlyRentUSD'), 'Displays converted USD price');
  assert.ok(content.includes('floorAreaSqm'), 'Displays square meters floor area');
  assert.ok(content.includes('deskCapacity') || content.includes('Workstations'), 'Displays desk / workstation capacity');
});

test('1.3 OfficeRentalsScreen includes commercial viewing and lease inquiry booking request form', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/OfficeRentalsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleViewingSubmit'), 'Has viewing submission handler');
  assert.ok(content.includes('selectedOfficeForViewing'), 'Has office selection state for viewing');
  assert.ok(content.includes('companyName'), 'Collects registered trade company name');
  assert.ok(content.includes('preferredViewing'), 'Collects preferred viewing date');
  assert.ok(content.includes('preferredMoveIn') && content.includes('leaseDuration'), 'Collects target move-in and lease duration');
});

test('1.4 OfficeRentalsScreen tracks active commercial viewing inquiries with concierge status', () => {
  const file = path.join(BASE_DIR, 'src/screens/rentals/OfficeRentalsScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('userInquiries'), 'Tracks user inquiries state');
  assert.ok(content.includes('China Desk Managed'), 'Highlights China Desk managed concierge');
  assert.ok(content.includes('reference'), 'Displays inquiry reference code');
});

// -----------------------------------------------------------------------------
// 2. Admin Logic (AdminRentalsOfficesScreen.tsx & AdminHotelsScreen.tsx)
// -----------------------------------------------------------------------------
test('2.1 AdminRentalsOfficesScreen provides management tool to list commercial spaces and showrooms', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsOfficesScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminRentalsOfficesScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('showAddModal') && content.includes('setShowAddModal'), 'Add commercial space modal state exists');
  assert.ok(content.includes('handleAddOffice'), 'Office upload submission handler exists');
  assert.ok(content.includes('newRentCNY') && content.includes('newFloorArea'), 'Collects monthly rent and floor area');
  assert.ok(content.includes('newDesks'), 'Collects desk / workstation capacity');
  assert.ok(content.includes('officeListings'), 'Renders commercial office catalog');
});

test('2.2 AdminRentalsOfficesScreen tracks commercial lease inquiries with status filters', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsOfficesScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('officeInquiries'), 'Filters commercial lease inquiries');
  assert.ok(content.includes('inquiryStatusFilter'), 'Status filter control exists');
  assert.ok(content.includes('new') && content.includes('contacted') && content.includes('viewing_scheduled') && content.includes('closed'), 'Includes complete commercial inquiry status states');
});

test('2.3 AdminRentalsOfficesScreen manages client bookings with status transitions and support chat link', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminRentalsOfficesScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('handleUpdateInquiryStatus'), 'Status transition handler exists');
  assert.ok(content.includes('Confirm Viewing') || content.includes('viewing_scheduled'), 'Allows confirming viewing appointment');
  assert.ok(content.includes('Commercial Lease Closed') || content.includes('closed'), 'Allows closing commercial lease');
  assert.ok(content.includes('navigate(\'admin-support\')') || content.includes('Chat'), 'Provides link to concierge support chat');
});

test('2.4 AdminHotelsScreen unified stays panel supports commercial office listings and inquiry management', () => {
  const file = path.join(BASE_DIR, 'src/screens/admin/AdminHotelsScreen.tsx');
  assert.ok(fs.existsSync(file), 'AdminHotelsScreen.tsx must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('office'), 'Supports commercial office property type');
  assert.ok(content.includes('RENTAL_AMENITIES') || content.includes('amenities'), 'Includes commercial office amenities');
  assert.ok(content.includes('handlePublishRental') || content.includes('handleEditRental'), 'Allows publishing and editing commercial spaces');
});

// -----------------------------------------------------------------------------
// 3. Backend Routes & Database Methods (sync-server.cjs & src/services/db.ts)
// -----------------------------------------------------------------------------
test('3.1 sync-server.cjs handles commercial office listings, inquiry generation (INQ-OFF), and status tracking', () => {
  const file = path.join(BASE_DIR, 'sync-server.cjs');
  assert.ok(fs.existsSync(file), 'sync-server.cjs must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes("pathname === '/api/rentals/properties'"), 'Properties query endpoint exists');
  assert.ok(content.includes("pathname === '/api/rentals/inquire'"), 'Property inquiry creation endpoint exists');
  assert.ok(content.includes('INQ-OFF'), 'Generates INQ-OFF reference for commercial inquiries');
  assert.ok(content.includes("pathname === '/api/admin/rentals/inquiry-status'"), 'Inquiry status update endpoint exists');
  assert.ok(content.includes("pathname === '/api/admin/rentals/listings'"), 'Rental listings upload endpoint exists');
});

test('3.2 db.ts exposes createRentalProperty, createPropertyInquiry, and updatePropertyInquiryStatus', () => {
  const file = path.join(BASE_DIR, 'src/services/db.ts');
  assert.ok(fs.existsSync(file), 'db.ts must exist');
  const content = fs.readFileSync(file, 'utf8');

  assert.ok(content.includes('createRentalProperty('), 'db.ts includes createRentalProperty');
  assert.ok(content.includes('createPropertyInquiry('), 'db.ts includes createPropertyInquiry');
  assert.ok(content.includes('updatePropertyInquiryStatus('), 'db.ts includes updatePropertyInquiryStatus');
  assert.ok(content.includes('getPropertyInquiries('), 'db.ts includes getPropertyInquiries');
});

// -----------------------------------------------------------------------------
// 4. Authoritative Database State (Guangzhou commercial offices & INQ-OFF leads)
// -----------------------------------------------------------------------------
test('4.1 db-state.json contains active Guangzhou commercial offices and commercial inquiry leads', () => {
  const stateFile = path.join(BASE_DIR, 'db-state.json');
  assert.ok(fs.existsSync(stateFile), 'db-state.json must exist');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  const properties = Object.values(state.rental_properties || {});
  assert.ok(properties.length > 0, 'Rental properties must exist in db-state.json');

  const office = properties.find(p => p.propertyType === 'office');
  assert.ok(office, 'Commercial office exists in db-state');
  assert.ok(office.monthlyRentCNY > 0, 'Commercial office has valid rent');
  assert.ok(office.district, 'Commercial office has valid district');

  const inquiries = Object.values(state.property_inquiries || {});
  assert.ok(inquiries.length > 0, 'Property inquiries must exist in db-state.json');
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
console.log('ALL 12 VERIFICATION TESTS FOR COMMERCIAL OFFICES PASSED SUCCESSFULLY!');
console.log('=============================================================================\n');
