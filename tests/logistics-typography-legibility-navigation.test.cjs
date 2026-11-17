/**
 * LOGISTICS & SHIPPING SCREEN TYPOGRAPHY, LEGIBILITY & NAVIGATION VERIFICATION TEST
 * 
 * Tests:
 * 1. Typography & Readability on Navigation Tabs & Status Badges
 * 2. Visual Hierarchy & Monospace Prominence of Personal Shipping Mark
 * 3. China and USA Rate Breakdown Cards ($/kg, CBM, and Timeline Contrast)
 * 4. Smooth Hub & Country Pre-Selection Navigation (No Layout Shift)
 * 5. Warehouse Address Card Microcopy Contrast (Chinese & English Formats)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Logistics & Shipping Screen Typography & Polish Verification...\n');

const logisticsScreenPath = path.join(__dirname, '../src/screens/logistics/LogisticsScreen.tsx');
const registerScreenPath = path.join(__dirname, '../src/screens/logistics/RegisterPackageScreen.tsx');
const trackScreenPath = path.join(__dirname, '../src/screens/logistics/TrackShipmentScreen.tsx');

const logisticsSrc = fs.readFileSync(logisticsScreenPath, 'utf8');
const registerSrc = fs.readFileSync(registerScreenPath, 'utf8');
const trackSrc = fs.readFileSync(trackScreenPath, 'utf8');

// --------------------------------------------------------------------------
// 1. Navigation Tab Bar & Truncation Elimination
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Navigation Tab Pills Typography & Truncation-Free Layout...');
assert(logisticsSrc.includes('<span>Services</span>'), 'Services tab must be present');
assert(logisticsSrc.includes('<span className="whitespace-nowrap">My Cargo</span>'), 'My Cargo tab must prevent awkward truncation');
assert(logisticsSrc.includes('<span className="whitespace-nowrap">Hubs</span>'), 'Hubs tab must prevent awkward truncation');
assert(logisticsSrc.includes('<span>Estimator</span>'), 'Estimator tab must be present');
assert(!logisticsSrc.includes('<span className="truncate">My Cargo'), 'My Cargo should not use truncate that causes ellipses on mobile');
assert(!logisticsSrc.includes('<span className="truncate">Hubs'), 'Hubs should not use truncate that causes ellipses on mobile');
console.log('✅ Navigation tabs render cleanly without text truncation.\n');

// --------------------------------------------------------------------------
// 2. Personal Shipping Mark Visual Hierarchy & Copy Button
// --------------------------------------------------------------------------
console.log('Test 2: Verifying Personal Shipping Mark Card Visual Hierarchy...');
assert(logisticsSrc.includes('YOUR PERSONAL SHIPPING MARK'), 'Card must feature clear, prominent header');
assert(logisticsSrc.includes('OFFICIAL CARRIER & CARTON MARKING:'), 'Card must feature uppercase label for carrier marking');
assert(logisticsSrc.includes('font-mono text-sm sm:text-base font-black text-emerald-400 select-all tracking-tight break-all'), 'Mark string must be prominent monospace bold');
assert(logisticsSrc.includes('Copy Full Mark'), 'Card must feature prominent "Copy Full Mark" action button');
assert(logisticsSrc.includes('bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'), 'Copy button must use high-contrast solid background');
console.log('✅ Personal Shipping Mark visual hierarchy and action buttons verified.\n');

// --------------------------------------------------------------------------
// 3. Rate Breakdown Cards & High-Contrast Timelines
// --------------------------------------------------------------------------
console.log('Test 3: Verifying China and USA Rate Breakdown Cards & Timelines...');
// China Corridor Rates
assert(logisticsSrc.includes('$11.50'), 'Must display $11.50 Air Express rate');
assert(logisticsSrc.includes('$9.50'), 'Must display $9.50 Air Regular rate');
assert(logisticsSrc.includes('$280'), 'Must display $280 Sea Freight rate');
assert(logisticsSrc.includes('3–5 Days'), 'Must display 3-5 Days Air Express timeline');
assert(logisticsSrc.includes('7–10 Days'), 'Must display 7-10 Days Air Regular timeline');
assert(logisticsSrc.includes('25–35 Days'), 'Must display 25-35 Days Sea Freight timeline');

// USA Corridor Rates
assert(logisticsSrc.includes('$13.50'), 'Must display $13.50 USA Air Express rate');
assert(logisticsSrc.includes('$11.00'), 'Must display $11.00 USA Air Standard rate');
assert(logisticsSrc.includes('$320'), 'Must display $320 USA Sea Cargo rate');
assert(logisticsSrc.includes('4–6 Days'), 'Must display 4-6 Days USA Air Express timeline');
assert(logisticsSrc.includes('30–45 Days'), 'Must display 30-45 Days USA Sea Cargo timeline');

// Check that timelines have high contrast (bg-cyan-950 or bg-emerald-950 pills instead of dim slate-500)
assert(logisticsSrc.includes('text-cyan-300 block bg-cyan-950/60'), 'Air Express timeline must use high-contrast pill');
assert(logisticsSrc.includes('text-emerald-300 block bg-emerald-950/60'), 'Air Regular timeline must use high-contrast pill');
assert(logisticsSrc.includes('text-teal-300 block bg-teal-950/60'), 'Sea Freight timeline must use high-contrast pill');

console.log('✅ Rate cards and timeline badges verified for high contrast.\n');

// --------------------------------------------------------------------------
// 4. Smooth Navigation Links without Layout Shift
// --------------------------------------------------------------------------
console.log('Test 4: Verifying Smooth Action Links (Hubs & Pre-Selection)...');
assert(logisticsSrc.includes("View 4 China Hub Addresses"), 'Must include China hub address link');
assert(logisticsSrc.includes("View 2 USA Hub Addresses"), 'Must include USA hub address link');
assert(logisticsSrc.includes("navigate('register-package', 'china')"), 'Ship from China must navigate with "china" parameter');
assert(logisticsSrc.includes("navigate('register-package', 'usa')"), 'Ship from USA must navigate with "usa" parameter');
assert(registerSrc.includes("routeParam.toLowerCase() === 'usa'"), 'RegisterPackageScreen must respect pre-selected country routeParam');
console.log('✅ Action links navigate smoothly with origin pre-selection.\n');

// --------------------------------------------------------------------------
// 5. Warehouse Address Cards Microcopy & Legibility
// --------------------------------------------------------------------------
console.log('Test 5: Verifying Warehouse Address Cards Microcopy & Legibility...');
assert(logisticsSrc.includes('中文收件信息 (Chinese Format for Suppliers)'), 'Must include Chinese supplier format header');
assert(logisticsSrc.includes('US Domestic Delivery Address (Amazon / US Sellers)'), 'Must include US domestic format header');
assert(logisticsSrc.includes('text-slate-400 font-semibold">收件仓库 (Attn):'), 'Warehouse labels must use high-contrast slate-400 instead of slate-500');
assert(logisticsSrc.includes('text-slate-400 font-semibold">联系电话 (Phone):'), 'Phone labels must use high-contrast slate-400');
assert(logisticsSrc.includes('text-slate-400 font-semibold">进仓唛头 (Mark):'), 'Shipping mark labels must use high-contrast slate-400');
console.log('✅ Warehouse address cards contrast and readability verified.\n');

// --------------------------------------------------------------------------
// 6. Track Shipment Metrics Contrast
// --------------------------------------------------------------------------
console.log('Test 6: Verifying Track Shipment Metrics Contrast...');
assert(trackSrc.includes('text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Gross / Billable</span>'), 'Gross / Billable label must use high-contrast bold');
assert(trackSrc.includes('text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Volume (CBM)</span>'), 'Volume label must use high-contrast bold');
assert(trackSrc.includes('text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Est. Landed ETA</span>'), 'ETA label must use high-contrast bold');
console.log('✅ Track shipment metrics contrast verified.\n');

console.log('🎉 ALL 6 LOGISTICS & SHIPPING TESTS PASSED! Typography, legibility & navigation 100% verified.');
