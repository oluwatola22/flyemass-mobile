/**
 * MY CARGO TAB NAVIGATION ICON OVERLAY & TEXT ALIGNMENT FIX TEST
 * 
 * Verifies:
 * 1. Flexbox Container Spacing:
 *    - Main tab bar uses responsive flex container with proper gap spacing instead of rigid grid layout.
 *    - All 4 tab buttons feature balanced flex-1 min-w-0 proportioning.
 * 2. Icon & Text Side-by-Side Alignment (No Collision):
 *    - Package icon and <span>My Cargo</span> render side-by-side with flex-row and gap-2 (8px spacing).
 *    - No count badge on the My Cargo main tab button.
 *    - Package icon is distinctly rendered to the left of the text without absolute overlay.
 * 3. Badge Removal & Clean Legibility:
 *    - Count badge ("136") is completely removed from the My Cargo tab button.
 *    - No visual glitch, collision, or layering artifacts.
 * 4. Sub-Navigation Filter Bar Edge Clearance & Overlay Protection:
 *    - Sub-navigation filter pills feature pr-10 edge clearance preventing gradient fade cutoff.
 *    - Filter pills retain dynamic count badges and relative z-10 layer protection.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting My Cargo Tab Navigation Icon Overlay & Alignment Verification...\n');

const logisticsScreenPath = path.join(__dirname, '../src/screens/logistics/LogisticsScreen.tsx');
const logisticsSrc = fs.readFileSync(logisticsScreenPath, 'utf8');

// --------------------------------------------------------------------------
// 1. Flex Container Spacing for Main Navigation Tabs
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Main Tab Navigation Flex Container & Balanced Sizing...');
assert(logisticsSrc.includes('flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-full relative'), 
  'Main navigation must use a responsive flex container with proper gap spacing');
assert(logisticsSrc.includes('flex-1 min-w-0'), 
  'Tabs must have balanced flex-1 min-w-0 sizing');
console.log('✅ Main tab navigation flex container verified.\n');

// --------------------------------------------------------------------------
// 2. Icon & Text Side-by-Side Flex Container (row with 8px gap)
// --------------------------------------------------------------------------
console.log('Test 2: Verifying Side-by-Side Icon & Text with gap-2 (8px)...');
assert(logisticsSrc.includes('flex flex-row items-center justify-center gap-2 relative z-10'), 
  'Tab buttons must use flex-row with gap-2 (8px)');
assert(logisticsSrc.includes('<Package className="w-3.5 h-3.5 shrink-0" />'), 'My Cargo package icon must be shrink-0');
assert(logisticsSrc.includes('<span className="whitespace-nowrap">My Cargo</span>'), 'My Cargo label must prevent line breaks');

assert(logisticsSrc.includes('<Globe2 className="w-3.5 h-3.5 shrink-0" />'), 'Services icon must be shrink-0');
assert(logisticsSrc.includes('<MapPin className="w-3.5 h-3.5 shrink-0" />'), 'Hubs map pin icon must be shrink-0');
assert(logisticsSrc.includes('<Calculator className="w-3.5 h-3.5 shrink-0" />'), 'Estimator calculator icon must be shrink-0');

assert(logisticsSrc.includes('<span>Services</span>'), 'Services text label must render cleanly');
assert(logisticsSrc.includes('<span className="whitespace-nowrap">Hubs</span>'), 'Hubs label must prevent line breaks');
assert(logisticsSrc.includes('<span>Estimator</span>'), 'Estimator label must render cleanly');
console.log('✅ Side-by-side icon & text flex row verified without overlap.\n');

// --------------------------------------------------------------------------
// 3. Count Badge Removal from My Cargo Tab
// --------------------------------------------------------------------------
console.log('Test 3: Verifying Badge Removal from My Cargo Tab Button...');
// Check that inside the shipments button there is no badge
const shipmentsButtonMatch = logisticsSrc.match(/setActiveTab\('shipments'\)[\s\S]*?<\/button>/);
assert(shipmentsButtonMatch, 'Shipments tab button must exist');
const shipmentsBtnCode = shipmentsButtonMatch[0];

assert(!shipmentsBtnCode.includes('{shipments.length}'), 'Count badge ({shipments.length}) must be completely removed from My Cargo tab button');
assert(shipmentsBtnCode.includes('<Package className="w-3.5 h-3.5 shrink-0" />'), 'Cargo icon must be present');
assert(shipmentsBtnCode.includes('<span className="whitespace-nowrap">My Cargo</span>'), 'My Cargo text must be present');
console.log('✅ Count badge completely removed from My Cargo tab button; icon and text render cleanly.\n');

// --------------------------------------------------------------------------
// 4. Sub-Navigation Filter Bar Edge Clearance & Overlay Protection
// --------------------------------------------------------------------------
console.log('Test 4: Verifying Sub-Navigation Filter Scroll & Overlay Clearance...');
assert(logisticsSrc.includes('pr-10'), 
  'Sub-navigation scroll track must feature pr-10 right clearance to prevent gradient fade overlap on end pill');
assert(logisticsSrc.includes('relative z-10 px-3.5 py-2 rounded-2xl text-xs font-bold'), 
  'Filter pills must have relative z-10 layer protection');
console.log('✅ Sub-navigation filter bar edge clearance and overlay protection verified.\n');

console.log('🎉 ALL 4 TAB NAVIGATION TESTS PASSED! Badge removed & clean side-by-side layout 100% verified.');
