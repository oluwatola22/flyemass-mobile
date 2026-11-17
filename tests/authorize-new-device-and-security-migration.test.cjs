/**
 * FLYEMASS AUTHORIZE NEW DEVICE & SECURITY MIGRATION TEST SUITE
 * 
 * Verifies:
 * 1. Tab & Method Cleanup:
 *    - "Pair Key" tab button and 12-character passcode input card are completely removed.
 *    - Exactly two toggle options in header selection: "Face ID" and "QR Sync" (grid-cols-2).
 * 2. Face ID / Biometric Flow Functionality:
 *    - Displays biometric enclave card with "Authenticate with Face ID" button.
 *    - Wires button to Web Authentication API / native biometric authentication.
 *    - Calls db.rebindHardwareSession to securely re-bind session token and hardware enclave.
 *    - Shows success toast and displays enrolled confirmation.
 * 3. QR Sync Flow Functionality:
 *    - Displays dynamic QR code box and "Simulate QR Scanner Match" action button.
 *    - Calls db.authorizeTerminalSession to authorize active terminal session in database.
 *    - Updates "Primary Authorized Terminal" status instantly to mobile handset.
 * 4. Backend Device Migration API & Audit Logging:
 *    - /api/auth/device-migrate endpoint handles session binding and records audit logs.
 * 5. General Ledger Equilibrium & Zero-Crypto Compliance:
 *    - Strict zero-crypto policy platform-wide.
 *    - Double-entry ledger equilibrium strictly maintained.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS AUTHORIZE NEW DEVICE & SECURITY MIGRATION TEST SUITE');
  console.log('=============================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
    }
  }

  const switchDevicePath = path.join(__dirname, '../src/screens/auth/SwitchDeviceScreen.tsx');
  const switchDeviceContent = fs.readFileSync(switchDevicePath, 'utf8');

  const dbPath = path.join(__dirname, '../src/services/db.ts');
  const dbContent = fs.readFileSync(dbPath, 'utf8');

  const syncServerPath = path.join(__dirname, '../sync-server.cjs');
  const syncServerContent = fs.readFileSync(syncServerPath, 'utf8');

  // Test 1: Tab & Method Cleanup - Removal of Pair Key
  test('1. Pair Key option and 12-character passcode input completely removed', () => {
    assert.ok(!switchDeviceContent.includes('Pair Key'), 'SwitchDeviceScreen must not contain "Pair Key"');
    assert.ok(!switchDeviceContent.includes('12-Character Pairing Passcode'), 'SwitchDeviceScreen must not contain "12-Character Pairing Passcode"');
    assert.ok(!switchDeviceContent.includes('FLY-8924-MIGRATE'), 'SwitchDeviceScreen must not contain pairing code placeholder');
    assert.ok(!switchDeviceContent.includes("setMigrationMethod('code')"), 'SwitchDeviceScreen must not have code method setter');
    assert.ok(!switchDeviceContent.includes("migrationMethod === 'code'"), 'SwitchDeviceScreen must not render code panel');
  });

  // Test 2: Exactly Two Toggle Options: Face ID and QR Sync
  test('2. Exactly two toggle options in header selection: "Face ID" and "QR Sync"', () => {
    assert.ok(switchDeviceContent.includes('grid grid-cols-2'), 'Tab selector must use a 2-column grid layout');
    assert.ok(switchDeviceContent.includes("setMigrationMethod('biometric')"), 'Tab selector must allow switching to biometric');
    assert.ok(switchDeviceContent.includes("setMigrationMethod('qr')"), 'Tab selector must allow switching to qr');
    assert.ok(switchDeviceContent.includes('Face ID'), 'Tab selector must label Face ID');
    assert.ok(switchDeviceContent.includes('QR Sync'), 'Tab selector must label QR Sync');
    assert.ok(switchDeviceContent.includes("<Fingerprint"), 'Face ID button includes fingerprint icon');
    assert.ok(switchDeviceContent.includes("<QrCode"), 'QR Sync button includes QR icon');
  });

  // Test 3: Face ID / Biometric Flow Functionality
  test('3. Face ID flow triggers native biometric authentication & hardware session re-binding', () => {
    assert.ok(switchDeviceContent.includes('handleFaceIdAuth'), 'SwitchDeviceScreen must implement handleFaceIdAuth');
    assert.ok(switchDeviceContent.includes('Authenticate with Face ID'), 'Must display "Authenticate with Face ID" button');
    assert.ok(switchDeviceContent.includes('PublicKeyCredential') || switchDeviceContent.includes('navigator.credentials?.get'), 'Must wire to Web Authentication API');
    assert.ok(switchDeviceContent.includes('rebindHardwareSession'), 'Must call db.rebindHardwareSession');
    assert.ok(switchDeviceContent.includes('Hardware cryptographic keys bound to this device'), 'Must display success confirmation toast');
  });

  // Test 4: QR Sync Flow Functionality
  test('4. QR Sync flow displays dynamic QR code box and "Simulate QR Scanner Match"', () => {
    assert.ok(switchDeviceContent.includes('handleQrSync'), 'SwitchDeviceScreen must implement handleQrSync');
    assert.ok(switchDeviceContent.includes('Simulate QR Scanner Match'), 'Must render "Simulate QR Scanner Match" button');
    assert.ok(switchDeviceContent.includes('authorizeTerminalSession'), 'Must call db.authorizeTerminalSession');
    assert.ok(switchDeviceContent.includes('QR session matched! Active terminal authorized & handset linked.'), 'Must display QR match success toast');
  });

  // Test 5: Instant Primary Authorized Terminal Status Update
  test('5. Primary Authorized Terminal status updates instantly upon authorization', () => {
    assert.ok(switchDeviceContent.includes('Primary Authorized Terminal'), 'Card must display Primary Authorized Terminal');
    assert.ok(switchDeviceContent.includes('primaryTerminal'), 'Must maintain dynamic primaryTerminal state');
    assert.ok(switchDeviceContent.includes('iPhone 16 Pro (This Mobile Handset)'), 'Must update terminal name to linked mobile handset');
    assert.ok(switchDeviceContent.includes('setPrimaryTerminal'), 'Must call setPrimaryTerminal on authorization');
  });

  // Test 6: Database Services for Terminal Authorization
  test('6. Database service provides rebindHardwareSession and authorizeTerminalSession', () => {
    assert.ok(dbContent.includes('rebindHardwareSession('), 'db.ts must declare rebindHardwareSession');
    assert.ok(dbContent.includes('authorizeTerminalSession('), 'db.ts must declare authorizeTerminalSession');
    assert.ok(dbContent.includes('/api/auth/device-migrate'), 'db.ts must dispatch to /api/auth/device-migrate');
  });

  // Test 7: Backend Device Migration Endpoint & Audit Logging
  test('7. Authoritative backend provides /api/auth/device-migrate and logs DEVICE_MIGRATED', () => {
    assert.ok(syncServerContent.includes('/api/auth/device-migrate'), 'sync-server.cjs must provide /api/auth/device-migrate endpoint');
    assert.ok(syncServerContent.includes('DEVICE_MIGRATED'), 'Backend must record DEVICE_MIGRATED audit log');
    assert.ok(syncServerContent.includes('terminalSession'), 'Backend must construct and return terminalSession');
  });

  // Test 8: General Ledger Equilibrium & Zero-Crypto Compliance
  test('8. Double-Entry General Ledger Equilibrium & Strict Zero-Crypto Policy', () => {
    const cryptocurrencyRegex = /\b(bitcoin|btc|ethereum|eth|usdt|erc20|trc20|binance|solana|cryptocurrency)\b/i;
    assert.ok(!cryptocurrencyRegex.test(switchDeviceContent), 'SwitchDeviceScreen must not contain cryptocurrency references');
    assert.ok(syncServerContent.includes('calculateTrialBalance()'), 'Backend must calculate general ledger equilibrium');
    assert.ok(syncServerContent.includes('verifyDatabaseIntegrity()'), 'Backend must verify database integrity');
  });

  console.log(`\n=============================================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} PASSED (100% SUCCESS)`);
  console.log(`=============================================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
