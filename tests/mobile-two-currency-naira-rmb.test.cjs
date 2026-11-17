/**
 * Automated Verification Suite:
 * Mobile App Two-Currency Architecture (Naira NGN & Chinese RMB CNY Only)
 * 
 * Validates:
 * 1. Shop screen currency selector has only NGN and CNY
 * 2. Cart screen currency switcher has only NGN and CNY
 * 3. Checkout screen payment wallet selector allows only NGN and CNY wallets
 * 4. Product detail screen direct buy modal supports only NGN and CNY
 * 5. Track shipment freight payment modal supports only NGN and CNY
 * 6. Pay supplier funding vault selector supports only CNY and NGN
 * 7. Agent service inspection booking supports only NGN and CNY
 * 8. Hotel room booking settlement supports only NGN and CNY
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Mobile App Two-Currency Architecture (Naira & RMB Only)');
  console.log('===================================================================');

  const shopScreen = readFile('src/screens/shop/ShopScreen.tsx');
  const cartScreen = readFile('src/screens/shop/CartScreen.tsx');
  const checkoutScreen = readFile('src/screens/shop/CheckoutScreen.tsx');
  const productDetail = readFile('src/screens/shop/ProductDetailScreen.tsx');
  const paySupplier = readFile('src/screens/wallets/PaySupplierScreen.tsx');
  const trackShipment = readFile('src/screens/logistics/TrackShipmentScreen.tsx');
  const logisticsScreen = readFile('src/screens/logistics/LogisticsScreen.tsx');
  const registerPkgScreen = readFile('src/screens/logistics/RegisterPackageScreen.tsx');
  const agentService = readFile('src/screens/suppliers/AgentServiceScreen.tsx');
  const hotelDetail = readFile('src/screens/hotels/HotelDetailScreen.tsx');

  // 1. Shop Screen
  console.log('1. Checking ShopScreen currency switcher...');
  assert(shopScreen.includes("(['NGN', 'CNY'] as const)"), 'ShopScreen must only have NGN and CNY in toggle');
  assert(!shopScreen.includes("(['NGN', 'USD', 'CNY'] as const)"), 'ShopScreen must not offer USD in toggle');
  console.log('   ✓ ShopScreen currency switcher verified (NGN & CNY only)');

  // 2. Cart Screen
  console.log('2. Checking CartScreen currency switcher...');
  assert(cartScreen.includes("(['NGN', 'CNY'] as const)"), 'CartScreen must only have NGN and CNY in switcher');
  assert(!cartScreen.includes("(['NGN', 'USD', 'CNY'] as const)"), 'CartScreen must not offer USD in switcher');
  console.log('   ✓ CartScreen currency switcher verified (NGN & CNY only)');

  // 3. Checkout Screen
  console.log('3. Checking CheckoutScreen payment wallet selection...');
  assert(checkoutScreen.includes("(['NGN', 'CNY'] as Currency[])"), 'CheckoutScreen must only allow NGN and CNY payment wallets');
  assert(!checkoutScreen.includes("(['NGN', 'CNY', 'USD'] as Currency[])"), 'CheckoutScreen must not offer USD payment wallet');
  console.log('   ✓ CheckoutScreen payment wallets verified (NGN & CNY only)');

  // 4. Product Detail Screen
  console.log('4. Checking ProductDetailScreen pricing and buy modal...');
  assert(productDetail.includes("(['NGN', 'CNY'] as const)"), 'ProductDetailScreen must only have NGN and CNY in currency toggle');
  assert(!productDetail.includes("(['NGN', 'USD', 'CNY'] as const)"), 'ProductDetailScreen must not offer USD in toggle or buy modal');
  console.log('   ✓ ProductDetailScreen pricing verified (NGN & CNY only)');

  // 5. Pay Supplier Screen
  console.log('5. Checking PaySupplierScreen funding vaults...');
  assert(paySupplier.includes("(['CNY', 'NGN'] as const)"), 'PaySupplierScreen must offer only CNY and NGN funding source vaults');
  assert(!paySupplier.includes("(['CNY', 'NGN', 'USD'] as const)"), 'PaySupplierScreen must not offer USD funding vault');
  console.log('   ✓ PaySupplierScreen funding vaults verified (CNY & NGN only)');

  // 6. Track Shipment Screen
  console.log('6. Checking TrackShipmentScreen freight payment wallets...');
  assert(trackShipment.includes("(['NGN', 'CNY'] as const)"), 'TrackShipmentScreen must only offer NGN and CNY for freight payment');
  assert(!trackShipment.includes("(['USD', 'NGN', 'CNY'] as const)"), 'TrackShipmentScreen must not offer USD for freight payment');
  console.log('   ✓ TrackShipmentScreen freight payment verified (NGN & CNY only)');

  // 7. Agent Service Screen
  console.log('7. Checking AgentServiceScreen inspection debit vaults...');
  assert(agentService.includes("(['NGN', 'CNY'] as const)"), 'AgentServiceScreen must only offer NGN and CNY debit vaults');
  assert(!agentService.includes("(['USD', 'NGN', 'CNY'] as const)"), 'AgentServiceScreen must not offer USD debit vault');
  console.log('   ✓ AgentServiceScreen inspection debit vaults verified (NGN & CNY only)');

  // 8. Hotel Detail Screen
  console.log('8. Checking HotelDetailScreen settlement currencies...');
  assert(hotelDetail.includes("(['NGN', 'CNY'] as Currency[])"), 'HotelDetailScreen must only offer NGN and CNY settlement wallets');
  assert(!hotelDetail.includes("(['USD', 'CNY', 'NGN'] as Currency[])"), 'HotelDetailScreen must not offer USD settlement wallet');
  console.log('   ✓ HotelDetailScreen settlement currencies verified (NGN & CNY only)');

  // 9. Shipping & Cargo Screens (Zero USD Display)
  console.log('9. Checking LogisticsScreen & RegisterPackageScreen for zero USD display...');
  assert(!logisticsScreen.includes('${calculatedCostUSD.toFixed(2)} USD'), 'LogisticsScreen must not show USD total cost');
  assert(logisticsScreen.includes('calculatedCostNGN'), 'LogisticsScreen must show Naira total');
  assert(!registerPkgScreen.includes('${estimatedFreightUSD.toLocaleString()} USD'), 'RegisterPackageScreen must not show USD estimate');
  assert(registerPkgScreen.includes('estimatedFreightNGN'), 'RegisterPackageScreen must show Naira estimate');
  assert(!trackShipment.includes('${freightCostUSD} USD'), 'TrackShipmentScreen must not show USD fee');
  console.log('   ✓ Shipping and Cargo screens verified: Zero USD display (Naira & RMB only)');

  console.log('===================================================================');
  console.log('ALL TWO-CURRENCY VERIFICATIONS PASSED (9/9)');
  console.log('===================================================================');
}

runTests();
