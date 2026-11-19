/**
 * Automated Test Suite: Enterprise KYC Verification & Compliance Engine
 * Verifies mobile & backend compliance gating, government ID submissions,
 * admin review workflows (Approve/Reject), and financial execution unlocking.
 */

const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:5050';

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(text) });
          } catch (e) {
            resolve({ status: res.statusCode, text });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method: 'GET' }, (res) => {
      let text = '';
      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(text) });
        } catch (e) {
          resolve({ status: res.statusCode, text });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=================================================================');
  console.log('ENTERPRISE KYC VERIFICATION & COMPLIANCE ENGINE TEST SUITE');
  console.log('=================================================================\n');

  const testUserId = 'usr_alade_01';

  // 1. Ensure user is initially unverified / pending to test gating
  console.log('Step 1: Setting user KYC status to "unverified"...');
  const sim1 = await postJson('/api/kyc/simulate-status', {
    userId: testUserId,
    status: 'unverified'
  });
  assert.strictEqual(sim1.status, 200, 'Simulate unverified should return 200');
  assert.strictEqual(sim1.data.status, 'unverified');
  console.log('✓ User set to unverified.\n');

  // 2. Test compliance gating on Withdrawal
  console.log('Step 2: Testing compliance gating on /api/wallets/withdraw...');
  const wdRes = await postJson('/api/wallets/withdraw', {
    userId: testUserId,
    amount: 100000,
    pin: '123456',
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Chief Babatunde Alade'
  });
  assert.strictEqual(wdRes.status, 403, 'Unverified withdrawal should return 403');
  assert.strictEqual(wdRes.data.kycRequired, true, 'Should include kycRequired: true');
  assert.strictEqual(wdRes.data.kycStatus, 'unverified');
  assert(wdRes.data.error.includes('KYC Verification Required'), 'Error must instruct user to complete KYC');
  console.log('✓ Withdrawal strictly blocked by compliance middleware (HTTP 403).\n');

  // 3. Test compliance gating on Supplier Payment
  console.log('Step 3: Testing compliance gating on /api/wallets/pay-supplier...');
  const payRes = await postJson('/api/wallets/pay-supplier', {
    userId: testUserId,
    amountCNY: 500,
    pin: '123456',
    recipientName: 'Foxconn Micro Tech',
    receiverAccount: '13800138000',
    method: 'Alipay (支付宝)'
  });
  assert.strictEqual(payRes.status, 403, 'Unverified supplier payout should return 403');
  assert.strictEqual(payRes.data.kycRequired, true, 'Should include kycRequired: true');
  assert(payRes.data.error.includes('KYC Verification Required'), 'Error must instruct user to complete KYC');
  console.log('✓ Supplier payment strictly blocked by compliance middleware (HTTP 403).\n');

  // 4. Test User KYC Submission
  console.log('Step 4: Submitting primary government ID (NIN) with front/back scans...');
  const submitRes = await postJson('/api/kyc/submit', {
    userId: testUserId,
    fullLegalName: 'Chief Babatunde Alade',
    idType: 'NIN',
    idNumber: '29384756102',
    documentFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    documentBackUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    documentFileName: 'nin_slip_alade_full.jpg'
  });
  assert.strictEqual(submitRes.status, 200, 'Submission should return 200');
  assert.strictEqual(submitRes.data.success, true);
  assert.strictEqual(submitRes.data.submission.status, 'pending');
  assert.strictEqual(submitRes.data.submission.idType, 'NIN');
  const submissionId = submitRes.data.submission.id;
  console.log(`✓ KYC submitted successfully! Submission ID: ${submissionId}\n`);

  // 5. Verify KYC status reflects 'pending'
  console.log('Step 5: Verifying GET /api/kyc/status reflects pending review...');
  const statusRes = await getJson(`/api/kyc/status?userId=${testUserId}`);
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusRes.data.kycStatus, 'pending');
  assert.strictEqual(statusRes.data.submission.id, submissionId);
  console.log('✓ User status confirmed pending compliance review.\n');

  // 6. Test Admin List Submissions
  console.log('Step 6: Testing GET /api/admin/kyc/list...');
  const listRes = await getJson('/api/admin/kyc/list');
  assert.strictEqual(listRes.status, 200);
  assert(Array.isArray(listRes.data.submissions), 'Submissions must be an array');
  assert(listRes.data.counts.pending >= 1, 'Pending count must be >= 1');
  const found = listRes.data.submissions.find(s => s.id === submissionId);
  assert(found, 'Submitted document must be present in admin review list');
  console.log(`✓ Admin review queue lists ${listRes.data.submissions.length} submissions (${listRes.data.counts.pending} pending).\n`);

  // 7. Test Admin Rejection with Mandatory Reason
  console.log('Step 7: Testing Admin rejection flow (testing validation & rejection reason)...');
  // 7a. Test missing rejection reason
  const failReject = await postJson('/api/admin/kyc/review', {
    submissionId,
    userId: testUserId,
    action: 'reject',
    rejectionReason: ''
  });
  assert.strictEqual(failReject.status, 400, 'Missing rejection reason must return 400');
  console.log('✓ Rejection without specific reason rejected with HTTP 400.');

  // 7b. Perform valid rejection
  const testReason = 'NIN slip photo is blurry and NIN number is unreadable. Please re-upload a clear flat scan.';
  const rejectRes = await postJson('/api/admin/kyc/review', {
    submissionId,
    userId: testUserId,
    action: 'reject',
    rejectionReason: testReason,
    adminName: 'Chief Compliance Officer'
  });
  assert.strictEqual(rejectRes.status, 200);
  assert.strictEqual(rejectRes.data.submission.status, 'rejected');
  assert.strictEqual(rejectRes.data.user.kyc_status, 'rejected');
  assert.strictEqual(rejectRes.data.user.kyc_rejection_reason, testReason);
  console.log('✓ Admin successfully rejected submission with feedback recorded on user record.\n');

  // 8. Verify user status reflects 'rejected' with reason
  console.log('Step 8: Verifying customer sees rejection feedback...');
  const userStatusAfterReject = await getJson(`/api/kyc/status?userId=${testUserId}`);
  assert.strictEqual(userStatusAfterReject.data.kycStatus, 'rejected');
  assert.strictEqual(userStatusAfterReject.data.rejectionReason, testReason);
  console.log('✓ Customer profile receives specific compliance rejection reason.\n');

  // 9. Test User Resubmission
  console.log('Step 9: Customer resubmits corrected high-resolution NIN document...');
  const resubmitRes = await postJson('/api/kyc/submit', {
    userId: testUserId,
    fullLegalName: 'Chief Babatunde Alade',
    idType: 'NIN',
    idNumber: '29384756102',
    documentFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    documentFileName: 'nin_corrected_clear_scan.jpg'
  });
  assert.strictEqual(resubmitRes.status, 200);
  assert.strictEqual(resubmitRes.data.submission.status, 'pending');
  const newSubmissionId = resubmitRes.data.submission.id;
  console.log(`✓ Resubmission queued! New Submission ID: ${newSubmissionId}\n`);

  // 10. Test Admin Approval
  console.log('Step 10: Admin approves verified government identification...');
  const approveRes = await postJson('/api/admin/kyc/review', {
    submissionId: newSubmissionId,
    userId: testUserId,
    action: 'approve',
    adminName: 'Chief Compliance Officer'
  });
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.submission.status, 'verified');
  assert.strictEqual(approveRes.data.user.kyc_status, 'verified');
  assert.strictEqual(approveRes.data.user.verifiedBadge, true);
  console.log('✓ KYC Approved! User promoted to verified with verifiedBadge: true.\n');

  // 11. Verify User is now unlocked for withdrawals
  console.log('Step 11: Verifying verified user withdrawal is no longer gated by KYC...');
  const verifiedWdRes = await postJson('/api/wallets/withdraw', {
    userId: testUserId,
    amount: 50000,
    pin: '123456',
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Chief Babatunde Alade'
  });
  // Since user has balances in seed data, it shouldn't be blocked by KYC!
  assert.notStrictEqual(verifiedWdRes.status, 403, 'Verified user must not receive KYC 403');
  assert(!verifiedWdRes.data.kycRequired, 'kycRequired must be falsy for verified user');
  console.log(`✓ Withdrawal executed/cleared without KYC gating! Status: ${verifiedWdRes.status}.\n`);

  console.log('=================================================================');
  console.log('ALL 11 COMPLIANCE AND KYC VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('=================================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
