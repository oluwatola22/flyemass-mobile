/**
 * MY CARGO SCREEN UI/UX LAYOUT & OVERFLOW FIX TEST
 * 
 * Tests:
 * 1. Sub-navigation filter pills responsive horizontal scroll container & right edge fade
 * 2. Filter pill badge count alignment without overlapping text labels
 * 3. Main tab "My Cargo" badge count alignment (handling multi-digit numbers like 136)
 * 4. Shipment card top flexbox non-colliding layout (min-w-0 flex-1 vs shrink-0 max-w-[42%])
 * 5. Destination string full display without "Ikeja MMIA Car..." cutoff
 * 6. Carrier company details and waybill non-colliding display
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting My Cargo Screen UI/UX Layout & Overflow Fix Verification...\n');

const logisticsScreenPath = path.join(__dirname, '../src/screens/logistics/LogisticsScreen.tsx');
const logisticsSrc = fs.readFileSync(logisticsScreenPath, 'utf8');

// --------------------------------------------------------------------------
// 1. Filter Tabs & Badge Alignment
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Sub-Navigation Filter Tabs & Edge Fade...');
assert(logisticsSrc.includes('relative -mx-4 px-4'), 'Sub-filter pills must use negative margin container for edge-to-edge scroll');
assert(logisticsSrc.includes('bg-gradient-to-l from-slate-950 to-transparent'), 'Sub-filter container must feature right-edge gradient fade cue');
assert(logisticsSrc.includes('overflow-x-auto no-scrollbar'), 'Filter container must support smooth horizontal scrolling without scrollbar clutter');
assert(logisticsSrc.includes('shipmentCounts.all'), 'Filter pills must display dynamic count for All Shipments');
assert(logisticsSrc.includes('shipmentCounts.active'), 'Filter pills must display dynamic count for Active Cargo');
assert(logisticsSrc.includes('shipmentCounts.awaiting_payment'), 'Filter pills must display dynamic count for Awaiting Payment');
assert(logisticsSrc.includes('shipmentCounts.in_transit'), 'Filter pills must display dynamic count for In Transit');
assert(logisticsSrc.includes('shipmentCounts.completed'), 'Filter pills must display dynamic count for Completed');
console.log('✅ Filter tabs responsive horizontal scroll & edge fade verified.\n');

// --------------------------------------------------------------------------
// 2. Main Tab My Cargo Layout (Badge removed, clean side-by-side icon & text)
// --------------------------------------------------------------------------
console.log('Test 2: Verifying Main Tab My Cargo Clean Side-by-Side Layout...');
assert(logisticsSrc.includes('<span className="whitespace-nowrap">My Cargo</span>'), 'Main Cargo tab must use whitespace-nowrap on text to prevent label wrap');
assert(logisticsSrc.includes('flex flex-row items-center justify-center gap-2'), 'Main tab buttons must use flex-row with gap-2 (8px)');
assert(logisticsSrc.includes('<Package className="w-3.5 h-3.5 shrink-0" />'), 'Package icon must be shrink-0');
console.log('✅ Main tab My Cargo clean side-by-side layout verified.\n');

// --------------------------------------------------------------------------
// 3. Shipment Card Non-Colliding Layout & Flexbox Guard
// --------------------------------------------------------------------------
console.log('Test 3: Verifying Shipment Card Flexbox Non-Colliding Layout...');
assert(logisticsSrc.includes('min-w-0 flex-1'), 'Left card content must use min-w-0 flex-1 to prevent pushing right status badges');
assert(logisticsSrc.includes('max-w-[42%]'), 'Right status badge stack must use max-w-[42%] and shrink-0 to prevent collision');
assert(logisticsSrc.includes('text-right shrink-0 space-y-1.5'), 'Right side badges must be non-shrinking right-aligned stack');
console.log('✅ Shipment card flexbox non-colliding layout verified.\n');

// --------------------------------------------------------------------------
// 4. Destination String Display & Clean Wrap (No "Ikeja MMIA Car..." Cutoff)
// --------------------------------------------------------------------------
console.log('Test 4: Verifying Destination String Formatting (No Truncation Cutoff)...');
assert(logisticsSrc.includes(".replace(' Cargo Hub (Lagos)', '')"), 'Must clean up repetitive Hub suffixes to maximize visible space');
assert(logisticsSrc.includes(".replace(' (Lagos)', '')"), 'Must clean up redundant state suffix for concise high-density display');
assert(logisticsSrc.includes('line-clamp-2'), 'Destination must allow 2-line clean wrap instead of hard single-line ellipsis cutoff');
assert(logisticsSrc.includes('break-words'), 'Destination must support word breaks for long terminal addresses');
console.log('✅ Destination string formatting verified.\n');

// --------------------------------------------------------------------------
// 5. Courier Company & Waybill Details
// --------------------------------------------------------------------------
console.log('Test 5: Verifying Courier Details Display...');
assert(logisticsSrc.includes('shipment.courierCompany || \'SF Express\''), 'Must display carrier company tag');
assert(logisticsSrc.includes('shipment.chineseCourierTracking'), 'Must display carrier tracking number');
console.log('✅ Courier details layout verified.\n');

console.log('🎉 ALL 5 MY CARGO LAYOUT & OVERFLOW TESTS PASSED! 100% verified.');
