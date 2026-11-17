const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

function runTest() {
  console.log('===================================================================');
  console.log('TEST SUITE: Air-Only Shipping (Air Express & Air Regular) Verification');
  console.log('===================================================================');

  const logisticsScreen = fs.readFileSync(path.join(ROOT, 'src/screens/logistics/LogisticsScreen.tsx'), 'utf8');
  const registerPkgScreen = fs.readFileSync(path.join(ROOT, 'src/screens/logistics/RegisterPackageScreen.tsx'), 'utf8');
  const adminLogisticsScreen = fs.readFileSync(path.join(ROOT, 'src/screens/admin/AdminLogisticsScreen.tsx'), 'utf8');

  // 1. LogisticsScreen
  console.log('1. Checking LogisticsScreen for Air Express & Air Regular only...');
  assert(logisticsScreen.includes("setCalcMode] = useState<'air_express' | 'air_regular'>('air_regular')"), 'calcMode must strictly be air_express | air_regular');
  assert(!logisticsScreen.includes("'sea'"), 'calcMode must not allow sea mode');
  assert(!logisticsScreen.includes('Sea Cargo'), 'LogisticsScreen must not contain Sea Cargo option');
  assert(!logisticsScreen.includes('Sea Freight'), 'LogisticsScreen must not contain Sea Freight option');
  assert(!logisticsScreen.includes('CBM - Cubic Metres'), 'LogisticsScreen must not contain CBM input');
  assert(logisticsScreen.includes('Air Express'), 'LogisticsScreen must contain Air Express');
  assert(logisticsScreen.includes('Air Regular'), 'LogisticsScreen must contain Air Regular');
  console.log('   ✓ LogisticsScreen verified: Sea freight completely removed; Air Express & Air Regular only');

  // 2. RegisterPackageScreen
  console.log('2. Checking RegisterPackageScreen for Air Express & Air Regular only...');
  assert(registerPkgScreen.includes("setShippingMode] = useState<'Air Express' | 'Air Regular'>('Air Regular')"), 'shippingMode must strictly be Air Express | Air Regular');
  assert(!registerPkgScreen.includes("'Sea Freight'"), 'shippingMode must not contain Sea Freight');
  assert(registerPkgScreen.includes("mode: 'Air Freight'"), 'mode payload must be Air Freight');
  assert(!registerPkgScreen.includes("mode: shippingMode.toLowerCase().includes('sea')"), 'mode payload must not reference sea freight');
  console.log('   ✓ RegisterPackageScreen verified: Sea freight completely removed; Air Express & Air Regular only');

  // 3. AdminLogisticsScreen
  console.log('3. Checking AdminLogisticsScreen for Air-only freight...');
  assert(adminLogisticsScreen.includes("setNewMode] = useState<'Air Freight'>('Air Freight')"), 'newMode must strictly be Air Freight');
  assert(adminLogisticsScreen.includes("setConsolMode] = useState<'air_express' | 'air_regular'>('air_express')"), 'consolMode must strictly be air_express | air_regular');
  assert(adminLogisticsScreen.includes('Air-only freight pricing displayed to every user. Sea freight has been retired. Changes push live instantly.'), 'AdminLogisticsScreen must confirm sea freight retirement');
  console.log('   ✓ AdminLogisticsScreen verified: Air-only freight active');

  console.log('===================================================================');
  console.log('ALL AIR-ONLY (EXPRESS & REGULAR) SHIPPING TESTS PASSED (3/3)!');
  console.log('===================================================================');
}

runTest();
