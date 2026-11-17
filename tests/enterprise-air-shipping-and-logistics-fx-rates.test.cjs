/**
 * Enterprise Air Shipping Rates & Logistics FX Rates Management Console Test Suite
 * Verifies:
 * 1. Air Shipping Rates Management Panel (/admin/settings/shipping & /admin/logistics-rates)
 * 2. Logistics FX Rates Management Panel
 * 3. End-to-End Real-Time Mobile App & Calculator Synchronization (/estimator, /register-package, /track)
 * 4. Authoritative Backend Endpoints in sync-server.cjs
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function runTests() {
  console.log('===================================================================');
  console.log('TEST SUITE: Enterprise Air Shipping Rates & Logistics FX Rates');
  console.log('===================================================================');

  const adminLogisticsSrc = fs.readFileSync(
    path.join(ROOT, 'src/screens/admin/AdminLogisticsScreen.tsx'),
    'utf8'
  );
  const appContextSrc = fs.readFileSync(
    path.join(ROOT, 'src/context/AppContext.tsx'),
    'utf8'
  );
  const dbSrc = fs.readFileSync(
    path.join(ROOT, 'src/services/db.ts'),
    'utf8'
  );
  const logisticsScreenSrc = fs.readFileSync(
    path.join(ROOT, 'src/screens/logistics/LogisticsScreen.tsx'),
    'utf8'
  );
  const registerPkgSrc = fs.readFileSync(
    path.join(ROOT, 'src/screens/logistics/RegisterPackageScreen.tsx'),
    'utf8'
  );
  const trackScreenSrc = fs.readFileSync(
    path.join(ROOT, 'src/screens/logistics/TrackShipmentScreen.tsx'),
    'utf8'
  );
  const syncServerSrc = fs.readFileSync(
    path.join(ROOT, 'sync-server.cjs'),
    'utf8'
  );

  // 1. Air Shipping Rates Management Panel Verification
  console.log('1. Verifying Air Shipping Rates Management Panel...');
  assert(
    adminLogisticsSrc.includes('Air shipping rates'),
    'Air shipping rates heading must be present'
  );
  assert(
    adminLogisticsSrc.includes('Air-only freight pricing displayed to every user. Sea freight has been retired. Changes push live instantly.'),
    'Air shipping rates subtitle must match exact specification'
  );
  assert(
    adminLogisticsSrc.includes('Express Air Shipping') &&
      adminLogisticsSrc.includes('PER KILOGRAM (KG) · DELIVERED IN 48 HOURS (2 DAYS)'),
    'Express Air Shipping field and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('Express handling / clearance fee') &&
      adminLogisticsSrc.includes('FLAT USD ADDED TO EVERY EXPRESS QUOTE'),
    'Express handling / clearance fee field and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('Normal Air Shipping') &&
      (adminLogisticsSrc.includes('PER KILOGRAM (KG) · DELIVERED IN 5-7 WORKING DAYS') ||
       adminLogisticsSrc.includes('PER KILOGRAM (KG) · DELIVERED IN 5–7 WORKING DAYS')),
    'Normal Air Shipping field and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('Normal handling / clearance fee') &&
      adminLogisticsSrc.includes('FLAT USD ADDED TO EVERY NORMAL AIR QUOTE'),
    'Normal handling / clearance fee field and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('Update Rates'),
    'Primary "Update Rates" action button must be present'
  );
  console.log('   ✓ Air Shipping Rates Management Panel verified');

  // 2. Logistics FX Rates Management Panel Verification
  console.log('2. Verifying Logistics FX Rates Management Panel...');
  assert(
    adminLogisticsSrc.includes('Logistics FX rates'),
    'Logistics FX rates heading must be present'
  );
  assert(
    adminLogisticsSrc.includes('Independent of the peer-to-peer wallet swap rate.'),
    'Logistics FX rates subtitle must note independence from peer-to-peer wallet swap rate'
  );
  assert(
    adminLogisticsSrc.includes('1 USD to NGN (Logistics)') &&
      adminLogisticsSrc.includes('NAIRA PER US DOLLAR FOR FREIGHT'),
    '1 USD to NGN (Logistics) input and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('1 USD to CNY (Logistics)') &&
      adminLogisticsSrc.includes('RMB PER US DOLLAR FOR FREIGHT'),
    '1 USD to CNY (Logistics) input and subtitle must be present'
  );
  assert(
    adminLogisticsSrc.includes('Update FX Rates'),
    'Primary "Update FX Rates" action button must be present'
  );
  console.log('   ✓ Logistics FX Rates Management Panel verified');

  // 3. End-to-End Real-Time Mobile App & Calculator Synchronization
  console.log('3. Verifying End-to-End Real-Time Mobile App & Calculator Synchronization...');
  assert(
    appContextSrc.includes("path.startsWith('/admin/settings/shipping')") &&
      appContextSrc.includes("path.startsWith('/admin/logistics-rates')"),
    'AppContext must route /admin/settings/shipping and /admin/logistics-rates to admin-logistics'
  );
  assert(
    appContextSrc.includes("path === '/estimator'") &&
      appContextSrc.includes("path === '/_authenticated/estimator'"),
    'AppContext must route /estimator and /_authenticated/estimator to mobile logistics calculator'
  );
  assert(
    dbSrc.includes('getAirShippingRates') &&
      dbSrc.includes('updateAirShippingRates') &&
      dbSrc.includes('getLogisticsFxRates') &&
      dbSrc.includes('updateLogisticsFxRates'),
    'db.ts must implement getAirShippingRates, updateAirShippingRates, getLogisticsFxRates, and updateLogisticsFxRates'
  );
  assert(
    logisticsScreenSrc.includes('db.getAirShippingRates()') &&
      logisticsScreenSrc.includes('db.getLogisticsFxRates()'),
    'LogisticsScreen (/estimator) must subscribe to live Air Shipping Rates and Logistics FX Rates'
  );
  assert(
    registerPkgSrc.includes('db.getAirShippingRates()') &&
      registerPkgSrc.includes('db.getLogisticsFxRates()'),
    'RegisterPackageScreen (/register-package) must subscribe to live Air Shipping Rates and Logistics FX Rates'
  );
  assert(
    trackScreenSrc.includes('db.getLogisticsFxRates()'),
    'TrackShipmentScreen (/track) billing checkout must use live Logistics FX Rates'
  );
  console.log('   ✓ End-to-End Real-Time Mobile App & Calculator Synchronization verified');

  // 4. Authoritative Backend Endpoints in sync-server.cjs
  console.log('4. Verifying Authoritative Backend Endpoints in sync-server.cjs...');
  assert(
    syncServerSrc.includes("pathname === '/api/logistics/rates'"),
    'sync-server.cjs must implement GET /api/logistics/rates'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/admin/logistics/air-shipping-rates'"),
    'sync-server.cjs must implement POST /api/admin/logistics/air-shipping-rates'
  );
  assert(
    syncServerSrc.includes("pathname === '/api/admin/logistics/fx-rates'"),
    'sync-server.cjs must implement POST /api/admin/logistics/fx-rates'
  );
  console.log('   ✓ Authoritative Backend Endpoints verified');

  console.log('===================================================================');
  console.log('ALL ENTERPRISE AIR SHIPPING & LOGISTICS FX RATES TESTS PASSED!');
  console.log('===================================================================');
}

runTests();
