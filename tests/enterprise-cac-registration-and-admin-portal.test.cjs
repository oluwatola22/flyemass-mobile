const assert = require('assert');
const http = require('http');

const BASE_URL = process.env.SYNC_SERVER_URL || 'http://localhost:5050';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('[CAC Test Suite] Starting Enterprise CAC Business & Company Registration Tests...');

  // 1. Dynamic Pricing Control
  console.log('[Test 1] Testing dynamic CAC statutory pricing retrieval & admin update...');
  const priceRes1 = await request('GET', '/api/cac/pricing');
  assert.strictEqual(priceRes1.status, 200, 'GET /api/cac/pricing should return 200');
  assert(priceRes1.body.success, 'Pricing request should succeed');
  assert(Number(priceRes1.body.pricing.business_name_ngn) > 0, 'Business name pricing must be positive');
  assert(Number(priceRes1.body.pricing.company_registration_ngn) > 0, 'Company registration pricing must be positive');

  // Admin updates pricing
  const updatePriceRes = await request('POST', '/api/admin/cac/pricing', {
    business_name_ngn: 36000,
    company_registration_ngn: 78000,
    adminId: 'Super Admin Babatunde'
  });
  assert.strictEqual(updatePriceRes.status, 200, 'POST /api/admin/cac/pricing should return 200');
  assert.strictEqual(updatePriceRes.body.pricing.business_name_ngn, 36000, 'BN fee must update to 36000');
  assert.strictEqual(updatePriceRes.body.pricing.company_registration_ngn, 78000, 'Company fee must update to 78000');
  console.log('✓ Dynamic pricing successfully updated and verified');

  // 2. Document Upload Endpoint
  console.log('[Test 2] Testing statutory document upload endpoint...');
  const uploadRes = await request('POST', '/api/cac/upload-document', {
    fileName: 'test-nin-slip.png',
    fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    mimeType: 'image/png'
  });
  assert.strictEqual(uploadRes.status, 200, 'Document upload should return 200');
  assert(uploadRes.body.success, 'Upload must succeed');
  assert(uploadRes.body.url, 'Upload must return URL');
  console.log('✓ Statutory document upload endpoint verified');

  // 3. Validation & Reference Signature Invariant for Company Registration
  console.log('[Test 3] Testing validation & reference signature requirement for Company Registration...');
  const invalidCompanyRes = await request('POST', '/api/cac/register', {
    userId: 'usr_alade_01',
    serviceType: 'company_registration',
    primaryName: 'Alade Maritime Technologies Ltd',
    category: 'Transportation and Logistics',
    businessAddress: '14 Warehouse Road, Apapa, Lagos',
    passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
    // referenceSignatureUrl intentionally omitted!
    pin: '123456'
  });
  assert.strictEqual(invalidCompanyRes.status, 400, 'Should reject Company Registration without reference signature');
  assert(invalidCompanyRes.body.error.includes('Reference signature'), 'Error must specify reference signature requirement');
  console.log('✓ Reference signature invariant for Company Registration enforced');

  // 4. Invalid PIN rejection
  console.log('[Test 4] Testing 6-digit transaction PIN security check...');
  const badPinRes = await request('POST', '/api/cac/register', {
    userId: 'usr_alade_01',
    serviceType: 'business_name',
    primaryName: 'Alade Logistics Test Enterprise',
    category: 'Transportation and Logistics',
    businessAddress: '14 Warehouse Road, Apapa, Lagos',
    passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
    pin: '000000' // wrong PIN
  });
  assert.strictEqual(badPinRes.status, 401, 'Should reject incorrect PIN with 401');
  console.log('✓ PIN security verification enforced');

  // 5. Valid CAC Registration Filing with NGN-Only Wallet Debit & Double-Entry Ledger
  console.log('[Test 5] Testing valid CAC filing, NGN wallet deduction & double-entry ledger balance...');
  
  // Ensure user has sufficient NGN balance first
  await request('POST', '/api/admin/users/wallet-credit', {
    userId: 'usr_alade_01',
    currency: 'NGN',
    amount: 100000,
    reference: `FUND-TEST-${Date.now()}`,
    notes: 'Credit for CAC test filing'
  });

  const validFilingRes = await request('POST', '/api/cac/register', {
    userId: 'usr_alade_01',
    serviceType: 'company_registration',
    primaryName: 'Alade Global Haulage & Marine Ltd',
    alternativeName: 'Alade Express Container Lines Ltd',
    category: 'Transportation and Logistics',
    commencementDate: '2026-02-01',
    businessAddress: 'Plot 10, Commercial Avenue, Apapa Sea Port, Lagos, Nigeria',
    businessDescription: 'Ocean freight forwarding, multi-modal haulage and customs compliance',
    partners: [
      {
        id: 'p_dir_1',
        fullName: 'Chief Babatunde Alade',
        email: 'babatunde.alade@flyemass.com',
        phone: '+234 803 123 4567',
        role: 'Director',
        sharesPercent: 70
      },
      {
        id: 'p_dir_2',
        fullName: 'Folashade Alade',
        email: 'folashade@flyemass.com',
        phone: '+234 803 987 6543',
        role: 'Director',
        sharesPercent: 30
      }
    ],
    passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    idCardType: 'NIN',
    signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
    referenceSignatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
    pin: '246810'
  });

  assert.strictEqual(validFilingRes.status, 201, 'Valid filing must return 201 Created');
  assert(validFilingRes.body.success, 'Filing must succeed');
  const app = validFilingRes.body.application;
  assert.strictEqual(app.status, 'pending', 'Initial status must be pending');
  assert.strictEqual(app.primaryName, 'Alade Global Haulage & Marine Ltd');
  assert.strictEqual(app.serviceFeeNGN, 78000, 'Fee must match dynamic price 78,000');
  console.log(`✓ CAC registration filed successfully with reference: ${app.reference}`);

  // Verify double entry trial balance equilibrium
  const auditRes = await request('GET', '/api/admin/audit-summary');
  if (auditRes.status === 200 && auditRes.body.trialBalance) {
    const netNGN = Math.abs((auditRes.body.trialBalance.NGN?.debit || 0) - (auditRes.body.trialBalance.NGN?.credit || 0));
    assert(netNGN < 0.01, `Double entry trial balance for NGN must have 0 net discrepancy (found ${netNGN})`);
    console.log('✓ Double-entry general ledger equilibrium verified (0 net discrepancy)');
  }

  // 6. Two-Way Compliance Messaging Thread
  console.log('[Test 6] Testing two-way compliance communication thread...');
  // Admin requests clarification -> status becomes action_required
  const adminMsgRes = await request('POST', '/api/cac/thread/message', {
    applicationId: app.id,
    sender: 'admin',
    senderName: 'CAC Officer Oladipo',
    message: 'Please provide a clearer NIN slip with legible date of birth and NIN number.'
  });
  assert.strictEqual(adminMsgRes.status, 200, 'Admin message should return 200');
  assert.strictEqual(adminMsgRes.body.application.status, 'action_required', 'Status must transition to action_required');
  console.log('✓ Admin compliance message sent; application status updated to action_required');

  // Customer replies -> status transitions back to in_review
  const userReplyRes = await request('POST', '/api/cac/thread/message', {
    applicationId: app.id,
    sender: 'user',
    senderName: 'Chief Babatunde Alade',
    message: 'High resolution NIN digital verification slip re-uploaded.'
  });
  assert.strictEqual(userReplyRes.status, 200, 'Customer reply should return 200');
  assert.strictEqual(userReplyRes.body.application.status, 'in_review', 'Status must transition to in_review');
  console.log('✓ Customer reply posted; application status updated to in_review');

  // 7. Admin Completion, Profile Tagging & Certificate Dispatch
  console.log('[Test 7] Testing admin completion, profile tagging & certificate dispatch...');
  const completeRes = await request('POST', '/api/admin/cac/complete', {
    applicationId: app.id,
    rcNumber: 'RC-1928401',
    certificatePdfUrl: 'https://supabase.flyemass.com/storage/v1/object/public/cac_documents/cac-cert-alade-haulage.pdf',
    adminId: 'Super Admin Babatunde',
    adminNotes: 'Incorporation verified by CAC Abuja Registry'
  });
  assert.strictEqual(completeRes.status, 200, 'Admin complete should return 200');
  assert(completeRes.body.success, 'Completion must succeed');
  assert.strictEqual(completeRes.body.application.status, 'completed', 'Status must be completed');
  assert.strictEqual(completeRes.body.application.rcNumber, 'RC-1928401');

  // Verify User Profile Tagging
  assert(completeRes.body.user, 'Completed response must return updated user object');
  assert.strictEqual(completeRes.body.user.company, 'Alade Global Haulage & Marine Ltd', 'user.company must be updated');
  assert.strictEqual(completeRes.body.user.rcNumber, 'RC-1928401', 'user.rcNumber must be tagged');
  assert.strictEqual(completeRes.body.user.cacRcNumber, 'RC-1928401', 'user.cacRcNumber must be tagged');
  console.log('✓ Application completed, CAC certificate dispatched, and user profile officially tagged with RC-1928401');

  // 8. Dynamic Share Capital Matrix Pricing Management (Admin)
  console.log('[Test 8] Testing dynamic Share Capital Matrix customization & publish by Admin...');
  const customTiers = [
    {
      id: 'sct_1m',
      name: 'Standard Commercial Tier',
      shareCapitalNGN: 1000000,
      totalFeeNGN: 78000,
      stampDutyNGN: 15000,
      filingFeeNGN: 63000,
      description: '₦1,000,000 SME baseline',
      isDefault: true
    },
    {
      id: 'sct_2m',
      name: 'Commercial Wholesale Tier',
      shareCapitalNGN: 2000000,
      totalFeeNGN: 98000,
      stampDutyNGN: 26000,
      filingFeeNGN: 72000,
      description: '₦2,000,000 Import/export & haulage'
    },
    {
      id: 'sct_5m',
      name: 'Enterprise Corporate Tier',
      shareCapitalNGN: 5000000,
      totalFeeNGN: 148000,
      stampDutyNGN: 48000,
      filingFeeNGN: 100000,
      description: '₦5,000,000 Corporate contracting'
    }
  ];

  const updateMatrixRes = await request('POST', '/api/admin/cac/pricing', {
    business_name_ngn: 36000,
    company_registration_ngn: 78000,
    share_capital_tiers: customTiers,
    adminId: 'Super Admin Babatunde'
  });
  assert.strictEqual(updateMatrixRes.status, 200, 'Admin matrix update should return 200');
  assert(Array.isArray(updateMatrixRes.body.pricing.share_capital_tiers), 'Updated pricing must contain share_capital_tiers');
  assert.strictEqual(updateMatrixRes.body.pricing.share_capital_tiers.length, 3, 'Should have 3 custom tiers');
  assert.strictEqual(updateMatrixRes.body.pricing.share_capital_tiers[1].totalFeeNGN, 98000, '2M tier total fee should be 98,000');
  console.log('✓ Share Capital Matrix customized and published to storefront');

  // 9. Company Filing with Explicit Share Capital Tier & Director Residential Address
  console.log('[Test 9] Testing Company filing with Share Capital Tier (₦2M) & Director Residential Addresses...');
  
  // Credit wallet for filing
  await request('POST', '/api/admin/users/wallet-credit', {
    userId: 'usr_alade_01',
    currency: 'NGN',
    amount: 150000,
    reference: `FUND-TIER-${Date.now()}`,
    notes: 'Credit for Share Capital Tier 2M Filing'
  });

  const tierFilingRes = await request('POST', '/api/cac/register', {
    userId: 'usr_alade_01',
    serviceType: 'company_registration',
    primaryName: 'Trans-Atlantic Energy & Engineering Ltd',
    alternativeName: 'Atlantic Offshore Logistics Ltd',
    category: 'Oil and Gas',
    commencementDate: '2026-03-01',
    businessAddress: 'Suite 400, Victoria Island Corporate Towers, Lagos',
    businessDescription: 'Marine engineering, offshore logistics and petroleum product distribution',
    shareCapitalTierId: 'sct_2m',
    shareCapitalNGN: 2000000,
    partners: [
      {
        id: 'p_dir_101',
        fullName: 'Engr. Damilola Alade',
        email: 'damilola@transatlantic-energy.ng',
        phone: '+234 802 334 5566',
        residentialAddress: '18 Admiralty Way, Lekki Phase 1, Lagos State',
        role: 'Managing Director',
        sharesPercent: 60,
        idCardType: 'NIN',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
        signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e'
      },
      {
        id: 'p_dir_102',
        fullName: 'Barr. Ngozi Okonjo',
        email: 'ngozi@transatlantic-energy.ng',
        phone: '+234 803 778 9900',
        residentialAddress: '5 Bourdillon Road, Ikoyi, Lagos State',
        role: 'Company Secretary & Director',
        sharesPercent: 40,
        idCardType: 'Driver License',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
        signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e'
      }
    ],
    passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    idCardType: 'NIN',
    signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
    referenceSignatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
    pin: '246810'
  });

  assert.strictEqual(tierFilingRes.status, 201, 'Tier filing must return 201 Created');
  const tierApp = tierFilingRes.body.application;
  assert.strictEqual(tierApp.serviceFeeNGN, 98000, 'Fee must strictly be ₦98,000 as configured for ₦2M share capital tier');
  assert.strictEqual(tierApp.shareCapitalNGN, 2000000, 'Application must store ₦2,000,000 share capital');
  assert.strictEqual(tierApp.shareCapitalTierId, 'sct_2m', 'Application must record sct_2m tier ID');
  assert.strictEqual(tierApp.partners.length, 2, 'Must preserve 2 directors');
  assert.strictEqual(tierApp.partners[0].residentialAddress, '18 Admiralty Way, Lekki Phase 1, Lagos State', 'Director residential address must be stored');
  assert.strictEqual(tierApp.partners[1].residentialAddress, '5 Bourdillon Road, Ikoyi, Lagos State', 'Second director residential address must be stored');
  console.log(`✓ ₦2M Share Capital company filed successfully (Fee: ₦${tierApp.serviceFeeNGN.toLocaleString()}, Ref: ${tierApp.reference}) with verified director physical residential addresses`);

  console.log('\n============================================================');
  console.log('ALL ENTERPRISE CAC REGISTRATION PORTAL TESTS PASSED (9/9)');
  console.log('============================================================\n');
}

runTests().catch(err => {
  console.error('[CAC Test Suite Error]:', err);
  process.exit(1);
});
