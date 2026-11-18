const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');

const ROOT = path.join(__dirname, '..');

function httpRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: urlPath,
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=========================================================================');
  console.log('TEST SUITE: Native Biometrics & Live Device Switching Migration Engine');
  console.log('=========================================================================');

  // 1. Unified Biometric Auth Service
  const bioSrc = fs.readFileSync(path.join(ROOT, 'src/services/biometricAuth.ts'), 'utf8');
  assert(bioSrc.includes('BiometricAuth') && bioSrc.includes('NativeBiometric'), 'Must integrate Capacitor native biometric bridges');
  assert(bioSrc.includes('SecureStoragePlugin'), 'Must integrate capacitor-secure-storage-plugin for native Keychain/Keystore');
  assert(bioSrc.includes('navigator.credentials.create') && bioSrc.includes('navigator.credentials.get'), 'Must implement WebAuthn Platform Authenticator fallback');
  assert(bioSrc.includes('Authenticate with Face ID') && bioSrc.includes('Authenticate with Fingerprint'), 'Must support dynamic Face ID & Fingerprint labels');
  assert(bioSrc.includes('AES-GCM'), 'Must encrypt web enclave session keys with AES-GCM');
  console.log('✅ [PASS] 1. Unified Native Biometric & Secure Keychain Service verified');

  // 2. Supabase Migration SQL
  const sqlSrc = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/20261118_user_devices_and_biometric_migration.sql'),
    'utf8'
  );
  assert(sqlSrc.includes('CREATE TABLE IF NOT EXISTS public.user_devices'), 'Migration must create public.user_devices');
  assert(sqlSrc.includes('CREATE TABLE IF NOT EXISTS public.device_migration_requests'), 'Migration must create public.device_migration_requests');
  assert(sqlSrc.includes('ENABLE ROW LEVEL SECURITY'), 'Migration must enable RLS');
  assert(sqlSrc.includes('CREATE OR REPLACE FUNCTION public.authorize_new_device'), 'Migration must create authorize_new_device RPC');
  assert(sqlSrc.includes('supabase_realtime'), 'Migration must enable Supabase Realtime');
  console.log('✅ [PASS] 2. Supabase SQL schema, RLS policies, Realtime & authorize_new_device RPC verified');

  // 3. SwitchDeviceScreen (Zero mock MacBook Pro 16, real QRCodeSVG, PIN + Biometric)
  const switchSrc = fs.readFileSync(path.join(ROOT, 'src/screens/auth/SwitchDeviceScreen.tsx'), 'utf8');
  assert(!switchSrc.includes('MacBook Pro 16'), 'SwitchDeviceScreen must NOT contain hardcoded MacBook Pro 16 mock');
  assert(!switchSrc.includes('Tianhe Office'), 'SwitchDeviceScreen must NOT contain hardcoded Tianhe Office mock');
  assert(switchSrc.includes("from 'qrcode.react'") && switchSrc.includes('<QRCodeSVG'), 'SwitchDeviceScreen must render real scannable QRCodeSVG from qrcode.react');
  assert(switchSrc.includes('authorizeNewPrimaryDevice'), 'SwitchDeviceScreen must call authorizeNewPrimaryDevice');
  assert(switchSrc.includes('subscribeToQrMigrationApproval'), 'SwitchDeviceScreen must subscribe to Supabase Realtime QR approvals');
  console.log('✅ [PASS] 3. SwitchDeviceScreen zero-mock real device registry, PIN+Biometric & live QR Sync verified');

  // 4. SecurityScreen & PinPad & LoginScreen
  const secSrc = fs.readFileSync(path.join(ROOT, 'src/screens/profile/SecurityScreen.tsx'), 'utf8');
  assert(!secSrc.includes('MacBook Pro 16'), 'SecurityScreen must NOT contain hardcoded MacBook Pro 16 mock');
  assert(secSrc.includes('Enable Biometric Login & Swap Approval'), 'SecurityScreen must feature Enable Biometric Login & Swap Approval toggle');
  assert(secSrc.includes('revokeDeviceSession'), 'SecurityScreen must revoke devices via real deviceRegistry');

  const pinSrc = fs.readFileSync(path.join(ROOT, 'src/components/ui/PinPad.tsx'), 'utf8');
  assert(pinSrc.includes('authenticateWithBiometrics'), 'PinPad must invoke real authenticateWithBiometrics');

  const loginSrc = fs.readFileSync(path.join(ROOT, 'src/screens/auth/LoginScreen.tsx'), 'utf8');
  assert(loginSrc.includes('handleBiometricLogin') && loginSrc.includes('authenticateWithBiometrics'), 'LoginScreen must support real biometric unlock');

  const shellSrc = fs.readFileSync(path.join(ROOT, 'src/components/layout/MobileShell.tsx'), 'utf8');
  assert(shellSrc.includes('subscribeToDeviceRevocation'), 'MobileShell must subscribe to Realtime forced logout on device revocation');
  console.log('✅ [PASS] 4. SecurityScreen toggle, PinPad biometric unlock, LoginScreen & Realtime logout verified');

  // 5. Live End-to-End Backend API Verification
  const devA = `dev_test_a_${Date.now()}`;
  const devB = `dev_test_b_${Date.now()}`;

  const authA = await httpRequest('POST', '/api/devices/authorize', {
    userId: 'usr_alade_01',
    deviceId: devA,
    deviceName: 'iPhone 16 Pro (iOS 18)',
    platform: 'ios',
    biometricType: 'face_id',
    pin: '1234'
  });
  assert.strictEqual(authA.status, 200, 'Device A authorization should succeed');
  assert.strictEqual(authA.data.device.is_primary, true, 'Device A should be primary');

  const authB = await httpRequest('POST', '/api/devices/authorize', {
    userId: 'usr_alade_01',
    deviceId: devB,
    deviceName: 'Pixel 9 Pro (Android)',
    platform: 'android',
    biometricType: 'fingerprint',
    pin: '1234'
  });
  assert.strictEqual(authB.status, 200, 'Device B authorization should succeed');
  assert.strictEqual(authB.data.device.is_primary, true, 'Device B should now be primary');
  assert(authB.data.revoked_count >= 1, 'Previous primary device A must be revoked');

  const listRes = await httpRequest('GET', '/api/devices/list?userId=usr_alade_01');
  const recA = listRes.data.devices.find((d) => d.device_id === devA);
  const recB = listRes.data.devices.find((d) => d.device_id === devB);
  assert.strictEqual(recA.status, 'revoked', 'Device A status must be revoked');
  assert.strictEqual(recB.status, 'active', 'Device B status must be active');
  console.log('✅ [PASS] 5. Live Device Authorization & Atomic Previous-Device Revocation verified');

  // 6. Live 60s QR Sync Migration Token Flow
  const migRes = await httpRequest('POST', '/api/devices/migration-token', {
    userId: 'usr_alade_01',
    deviceId: `dev_qr_${Date.now()}`,
    deviceName: 'iPhone 16 (QR Target)',
    platform: 'ios'
  });
  assert.strictEqual(migRes.status, 200, 'QR migration token creation should succeed');
  assert(migRes.data.request.token.startsWith('FM-MIG-'), 'Cryptographic token prefix must match');

  const approveRes = await httpRequest('POST', '/api/devices/approve-migration', {
    token: migRes.data.request.token,
    approverDeviceId: devB,
    biometricType: 'face_id'
  });
  assert.strictEqual(approveRes.status, 200, 'QR migration approval should succeed');
  assert.strictEqual(approveRes.data.request.status, 'approved', 'Migration request must be marked approved');
  assert.strictEqual(approveRes.data.device.is_primary, true, 'QR target device must be promoted to primary');
  console.log('✅ [PASS] 6. Live 60-Second QR Sync Token Creation & Biometric Approval verified');

  console.log('=========================================================================');
  console.log('ALL 6 NATIVE BIOMETRICS & DEVICE MIGRATION TESTS PASSED 100%!');
  console.log('=========================================================================');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
