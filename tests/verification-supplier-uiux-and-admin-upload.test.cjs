const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

function runTest() {
  console.log('===================================================================');
  console.log('TEST SUITE: Verification Supplier UI/UX & Admin Upload Workflow');
  console.log('===================================================================');

  const mobileScreen = fs.readFileSync(path.join(ROOT, 'src/screens/suppliers/SuppliersScreen.tsx'), 'utf8');
  const adminScreen = fs.readFileSync(path.join(ROOT, 'src/screens/admin/AdminSuppliersScreen.tsx'), 'utf8');

  // 1. Mobile Verification Supplier Page UI/UX
  console.log('1. Checking Mobile Verification Supplier Page UI/UX & Navigation...');
  assert(mobileScreen.includes('VIP Supplier Directory'), 'Mobile header must be VIP Supplier Directory');
  assert(mobileScreen.includes('VIP Factory Catalog'), 'Sub-bar must have VIP Factory Catalog title');
  assert(mobileScreen.includes('Ground Agents') && mobileScreen.includes("navigate('agent')"), 'Must link to Ground Agents (/agent)');
  assert(mobileScreen.includes('Factory RFQ') && mobileScreen.includes("navigate('procure')"), 'Must link to Factory RFQ (/procure)');
  assert(mobileScreen.includes('Vetted Guangdong & Yiwu Factories'), 'Must display verified China factories headline');
  assert(mobileScreen.includes('Official Business Card'), 'Must include Official Business Card action');
  assert(mobileScreen.includes('Chat WhatsApp') || mobileScreen.includes('handleOpenWhatsApp'), 'Must include direct WhatsApp action');
  assert(mobileScreen.includes('handleCallSupplier'), 'Must include direct Call action');
  assert(mobileScreen.includes('🇳🇬 Nigerian Naira'), 'Paywall modal must feature Nigerian Naira');
  assert(mobileScreen.includes('🇨🇳 RMB / CNY'), 'Paywall modal must feature RMB / CNY');
  console.log('   ✓ Mobile Verification Supplier Page UI/UX, navigation & contacts verified');

  // 2. Admin Verification Supplier Page Redesign
  console.log('2. Checking Admin Verification Supplier Page UI/UX & Colors...');
  assert(adminScreen.includes('#0B1220') || adminScreen.includes('#111C2E'), 'Admin must use dark enterprise background #0B1220 / #111C2E');
  assert(adminScreen.includes('#1B2A40'), 'Admin must use elevated dark cards #1B2A40');
  assert(adminScreen.includes('#293A52'), 'Admin must use crisp enterprise borders #293A52');
  assert(adminScreen.includes('Verified China Suppliers & Factory Directory'), 'Admin page title must be present');
  console.log('   ✓ Admin Verification Supplier Page enterprise theme tokens verified');

  // 3. Admin Navigation & Upload Contacts Workspace
  console.log('3. Checking Admin Navigation & Upload Contacts Workspace...');
  assert(adminScreen.includes("setActiveTab('catalog')"), 'Admin must support Catalog tab');
  assert(adminScreen.includes("setActiveTab('upload')"), 'Admin must support dedicated Upload tab');
  assert(adminScreen.includes("setActiveTab('pricing')"), 'Admin must support Pricing tab');
  assert(adminScreen.includes("setActiveTab('subscribers')"), 'Admin must support Subscribers tab');
  assert(adminScreen.includes('Bulk Upload Supplier Contacts'), 'Must include Bulk Upload Contacts section');
  assert(adminScreen.includes('handleExecuteBulkUpload'), 'Must include handleExecuteBulkUpload function');
  assert(adminScreen.includes('handleParseBulkCsv'), 'Must include handleParseBulkCsv function');
  assert(adminScreen.includes('Quick Register Single Factory'), 'Must include Quick Register Single Factory section');
  assert(adminScreen.includes('Official Chinese Business Card'), 'Must support official business card upload');
  assert(adminScreen.includes('handleCardFileUpload'), 'Must include file upload handler');
  console.log('   ✓ Admin Navigation, dedicated Upload workspace & Bulk CSV contact importer verified');

  console.log('===================================================================');
  console.log('ALL VERIFICATION SUPPLIER UI/UX & ADMIN UPLOAD TESTS PASSED (3/3)!');
  console.log('===================================================================');
}

runTest();
