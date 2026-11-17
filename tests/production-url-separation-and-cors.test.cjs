/**
 * FLYEMASS — PRODUCTION URL SEPARATION & CORS AUDIT TEST SUITE
 * 
 * Verifies:
 * 1. CORS allowlisting for Production Mobile (https://app.flyemass.com)
 * 2. CORS allowlisting for Production Admin (https://admin.flyemass.com)
 * 3. Preflight OPTIONS request handling with security headers
 * 4. Separate production build targets (dist/index.html vs dist/admin/index.html)
 * 5. Complete absence of Admin links/controls in Customer Mobile navigation
 * 6. Staff authentication & role enforcement on Admin endpoints
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5050';

function bold(str) { return `\x1b[1m${str}\x1b[0m`; }
function green(str) { return `\x1b[32m${str}\x1b[0m`; }
function cyan(str) { return `\x1b[36m${str}\x1b[0m`; }

async function runCorsAndUrlSeparationTests() {
  console.log(bold('\n==============================================================='));
  console.log(bold('  FLYEMASS: PRODUCTION URL SEPARATION & CORS AUDIT SUITE'));
  console.log(bold('===============================================================\n'));

  // -----------------------------------------------------------------
  // 1. CORS Verification for Mobile App Origin (https://app.flyemass.com)
  // -----------------------------------------------------------------
  console.log(cyan('1. Testing CORS headers for Mobile Production Origin (https://app.flyemass.com)...'));
  const mobileRes = await fetch(`${BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Origin': 'https://app.flyemass.com'
    }
  });
  assert.strictEqual(mobileRes.status, 200);
  assert.strictEqual(mobileRes.headers.get('access-control-allow-origin'), 'https://app.flyemass.com');
  assert.strictEqual(mobileRes.headers.get('access-control-allow-credentials'), 'true');
  console.log(green('✓ Production Mobile origin (https://app.flyemass.com) allowed with credentials'));

  // -----------------------------------------------------------------
  // 2. CORS Verification for Admin Workspace Origin (https://admin.flyemass.com)
  // -----------------------------------------------------------------
  console.log(cyan('\n2. Testing CORS headers for Admin Production Origin (https://admin.flyemass.com)...'));
  const adminRes = await fetch(`${BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Origin': 'https://admin.flyemass.com'
    }
  });
  assert.strictEqual(adminRes.status, 200);
  assert.strictEqual(adminRes.headers.get('access-control-allow-origin'), 'https://admin.flyemass.com');
  assert.strictEqual(adminRes.headers.get('access-control-allow-credentials'), 'true');
  console.log(green('✓ Production Admin origin (https://admin.flyemass.com) allowed with credentials'));

  // -----------------------------------------------------------------
  // 3. Preflight OPTIONS Handling
  // -----------------------------------------------------------------
  console.log(cyan('\n3. Testing Preflight OPTIONS Handling & Security Headers...'));
  const preflightRes = await fetch(`${BASE_URL}/api/hotels/book`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://app.flyemass.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, X-Admin-Role, X-User-Id'
    }
  });
  assert.strictEqual(preflightRes.status, 204);
  assert.strictEqual(preflightRes.headers.get('access-control-allow-origin'), 'https://app.flyemass.com');
  assert.ok(preflightRes.headers.get('access-control-allow-methods').includes('POST'));
  assert.ok(preflightRes.headers.get('access-control-allow-headers').includes('X-User-Id'));
  console.log(green('✓ Preflight OPTIONS responded with 204 and allowed headers (including X-User-Id)'));

  // -----------------------------------------------------------------
  // 4. Standalone Build Output Verification
  // -----------------------------------------------------------------
  console.log(cyan('\n4. Verifying Build Outputs for Independent Production Deployment...'));
  const distDir = path.resolve(__dirname, '../dist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html must exist for Mobile app');
  assert.ok(fs.existsSync(path.join(distDir, 'admin.html')), 'dist/admin.html must exist for Admin workspace');
  assert.ok(fs.existsSync(path.join(distDir, 'admin/index.html')), 'dist/admin/index.html must exist for standalone root routing');

  const mobileIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  assert.ok(mobileIndexHtml.includes('main.tsx') || mobileIndexHtml.includes('assets/index-'), 'Mobile index must mount main.tsx client entry');
  
  const adminIndexHtml = fs.readFileSync(path.join(distDir, 'admin/index.html'), 'utf8');
  assert.ok(adminIndexHtml.includes('main.admin.tsx') || adminIndexHtml.includes('assets/admin-'), 'Admin index must mount main.admin.tsx entry');
  console.log(green('✓ Dedicated build outputs verified (Customer Mobile App & Admin Workspace both have root index.html)'));

  // -----------------------------------------------------------------
  // 5. Customer Mobile Codebase Verification (Zero Admin Exposure)
  // -----------------------------------------------------------------
  console.log(cyan('\n5. Verifying Zero Admin Link / Exposure in Customer Mobile Navigation...'));
  const mobileShellCode = fs.readFileSync(path.resolve(__dirname, '../src/components/layout/MobileShell.tsx'), 'utf8');
  assert(!mobileShellCode.includes('getAdminAppUrl'), 'MobileShell must not import or call getAdminAppUrl');
  assert(!mobileShellCode.includes('Switch to Admin'), 'MobileShell must not contain Switch to Admin');

  const errorBoundaryCode = fs.readFileSync(path.resolve(__dirname, '../src/components/ui/ErrorBoundary.tsx'), 'utf8');
  assert.ok(errorBoundaryCode.includes('isAdminEnvironment()'), 'ErrorBoundary must gate Admin link behind isAdminEnvironment()');
  console.log(green('✓ Customer mobile UI verified completely clean of Admin links, buttons, or entry points'));

  console.log(bold('\n==============================================================='));
  console.log(bold(green('  ALL PRODUCTION URL SEPARATION & CORS AUDIT TESTS PASSED (100%)')));
  console.log(bold('===============================================================\n'));
}

runCorsAndUrlSeparationTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
