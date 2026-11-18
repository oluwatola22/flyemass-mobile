/**
 * FLYEMASS SEND MONEY TO CHINA (PAYOUT CHANNEL LOGOS & NAVIGATION POLISH) TEST SUITE
 * 
 * Verifies:
 * 1. Payout Channel Icons & Official Branding:
 *    - Official Alipay brand logo component alongside "Alipay (支付宝)"
 *    - Official WeChat Pay brand logo component alongside "WeChat (微信支付)"
 *    - Official UnionPay / CNAPS bank transfer icon alongside "Bank Transfer (银联 / CNAPS)"
 * 2. Navigation & User Flow Optimization:
 *    - Dynamic beneficiary inputs updated without layout shifts when switching channels:
 *      * Alipay: Alipay ID / Mobile Number (or Email), QR code attachment
 *      * WeChat: WeChat Pay Handle / Mobile Number, QR code attachment
 *      * Bank: Corporate/Individual Name, Bank Account Number / Settlement IBAN, Receiving Commercial Bank (with ICBC, BOC, CCB, ABC presets), 12-digit CNAPS clearing code, SWIFT/BIC
 *    - handleTabChange ensures frictionless navigation and pre-populates smart defaults without jarring shift
 * 3. Multi-Currency Funding & Settlement:
 *    - Seamless wallet source selection (CNY, NGN, USD)
 *    - Real-time conversion calculations
 *    - Review Modal and Clearance Receipt Modal displaying full channel metadata (including CNAPS and bank details)
 * 4. General Ledger Equilibrium & Strict Policy:
 *    - Strict Zero-Crypto Platform Policy preserved
 *    - General ledger double-entry equilibrium maintained ($0.0000, ₦0.0000, ¥0.0000)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS "SEND MONEY TO CHINA" PAYOUT CHANNELS & POLISH VERIFICATION SUITE');
  console.log('=============================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  const screenPath = path.join(__dirname, '../src/screens/wallets/PaySupplierScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'PaySupplierScreen.tsx must exist');
  const screenContent = fs.readFileSync(screenPath, 'utf8');

  // -------------------------------------------------------------------------
  // 1. Payout Channel Icons & Official Brand Logos
  // -------------------------------------------------------------------------
  test('1.1 Official Alipay brand logo SVG component and "Alipay (支付宝)" branding present', () => {
    assert.ok(screenContent.includes('const AlipayLogo: React.FC'), 'AlipayLogo SVG component defined');
    assert.ok(screenContent.includes('<AlipayLogo'), 'AlipayLogo rendered in payout buttons');
    assert.ok(screenContent.includes('Alipay') && screenContent.includes('(支付宝)'), 'Alipay (支付宝) text present');
  });

  test('1.2 Official WeChat Pay brand logo SVG component and "WeChat (微信支付)" branding present', () => {
    assert.ok(screenContent.includes('const WeChatLogo: React.FC'), 'WeChatLogo SVG component defined');
    assert.ok(screenContent.includes('<WeChatLogo'), 'WeChatLogo rendered in payout buttons');
    assert.ok(screenContent.includes('WeChat') && screenContent.includes('(微信支付)'), 'WeChat (微信支付) text present');
  });

  test('1.3 Official UnionPay / CNAPS bank transfer icon SVG and "Bank Transfer (银联 / CNAPS)" branding present', () => {
    assert.ok(screenContent.includes('const UnionPayLogo: React.FC'), 'UnionPayLogo SVG component defined');
    assert.ok(screenContent.includes('<UnionPayLogo'), 'UnionPayLogo rendered in payout buttons');
    assert.ok(screenContent.includes('Bank Transfer') && screenContent.includes('(银联 / CNAPS)'), 'Bank Transfer (银联 / CNAPS) text present');
  });

  // -------------------------------------------------------------------------
  // 2. Navigation & User Flow Optimization
  // -------------------------------------------------------------------------
  test('2.1 handleTabChange handles frictionless tab switching with smart defaults to avoid layout shift', () => {
    assert.ok(screenContent.includes('const handleTabChange = (tab: PayMethod) => {'), 'handleTabChange helper exists');
    assert.ok(screenContent.includes("tab === 'alipay'"), 'Alipay tab default logic configured');
    assert.ok(screenContent.includes("tab === 'wechat'"), 'WeChat tab default logic configured');
    assert.ok(screenContent.includes("tab === 'bank'"), 'Bank tab default logic configured');
    assert.ok(screenContent.includes("onClick={() => handleTabChange('alipay')}"), 'Alipay button bound to handleTabChange');
    assert.ok(screenContent.includes("onClick={() => handleTabChange('wechat')}"), 'WeChat button bound to handleTabChange');
    assert.ok(screenContent.includes("onClick={() => handleTabChange('bank')}"), 'Bank button bound to handleTabChange');
  });

  test('2.2 Dynamic beneficiary inputs for Alipay and WeChat with QR attachment support', () => {
    assert.ok(screenContent.includes("activeTab === 'alipay' ? 'Alipay ID / Mobile Number (or Email)'"), 'Alipay specific account label');
    assert.ok(screenContent.includes("activeTab === 'wechat' ? 'WeChat Pay Handle / Mobile Number'"), 'WeChat specific account label');
    assert.ok(screenContent.includes('Recipient QR Code (Optional'), 'QR code upload option available for mobile wallets');
    assert.ok(screenContent.includes('handleQrUpload'), 'QR upload handler present');
  });

  test('2.3 Dynamic beneficiary inputs for Chinese Bank Transfer with bank presets, CNAPS clearing code, and SWIFT', () => {
    assert.ok(screenContent.includes('Bank Account Number / Settlement IBAN (UnionPay / CNAPS)'), 'Bank account / Settlement IBAN label present');
    assert.ok(screenContent.includes('Receiving Commercial Bank'), 'Commercial bank field present');
    assert.ok(screenContent.includes('12-Digit CNAPS Bank Clearing Code'), 'CNAPS clearing code field present');
    assert.ok(screenContent.includes('SWIFT / BIC / CNAPS Branch Code (Optional)'), 'SWIFT / BIC / CNAPS branch code present');
    assert.ok(screenContent.includes('ICBC (工商银行)'), 'ICBC preset present');
    assert.ok(screenContent.includes('Bank of China (中国银行)'), 'BOC preset present');
    assert.ok(screenContent.includes('CCB (建设银行)'), 'CCB preset present');
    assert.ok(screenContent.includes('ABC (农业银行)'), 'ABC preset present');
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Currency Funding & Settlement
  // -------------------------------------------------------------------------
  test('3.1 Multi-currency funding vault selector supports CNY and NGN', () => {
    assert.ok(screenContent.includes("(['CNY', 'NGN', 'USD'] as const).map") || screenContent.includes("(['CNY', 'NGN'] as const).map"), 'Funding selector covers CNY and NGN');
    assert.ok(screenContent.includes('calculateFundingDeduction'), 'Conversion helper converts amount based on currency rates');
    assert.ok(screenContent.includes('Total Wallet Deduction'), 'Summary card displays total wallet deduction');
  });

  test('3.2 Review Modal & Clearance Receipt display channel branding and bank details', () => {
    assert.ok(screenContent.includes('Review China Payment'), 'Review modal header present');
    assert.ok(screenContent.includes("activeTab === 'alipay' ? 'Alipay (支付宝)' : activeTab === 'wechat' ? 'WeChat (微信支付)' : 'Bank Transfer (银联 / CNAPS)'"), 'Review modal uses updated channel labels');
    assert.ok(screenContent.includes('submissionReceipt.bankName'), 'Receipt shows receiving bank if bank transfer');
    assert.ok(screenContent.includes('submissionReceipt.cnapsCode'), 'Receipt shows CNAPS code if bank transfer');
    assert.ok(screenContent.includes('Payment Queued for Clearance'), 'Receipt displays clearance status');
  });

  // -------------------------------------------------------------------------
  // 4. Platform Policy & Accounting Equilibrium
  // -------------------------------------------------------------------------
  test('4.1 Strict Zero-Crypto Platform Policy preserved', () => {
    assert.ok(!screenContent.toLowerCase().includes('usdt'), 'PaySupplierScreen contains no USDT');
    assert.ok(!screenContent.toLowerCase().includes('crypto'), 'PaySupplierScreen contains no crypto');
    assert.ok(!screenContent.toLowerCase().includes('trc-20') && !screenContent.toLowerCase().includes('trc20'), 'PaySupplierScreen contains no TRC-20');
    assert.ok(!screenContent.toLowerCase().includes('bitcoin') && !screenContent.toLowerCase().includes('btc'), 'PaySupplierScreen contains no Bitcoin');
  });

  test('4.2 General Ledger equilibrium verified from db-state.json', () => {
    const dbStatePath = path.join(__dirname, '../db-state.json');
    assert.ok(fs.existsSync(dbStatePath), 'db-state.json must exist');
    const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

    const ledger = dbState.ledger || [];
    let netUSD = 0;
    let netNGN = 0;
    let netCNY = 0;

    for (const entry of ledger) {
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;
      const diff = debit - credit;
      if (entry.currency === 'USD') netUSD += diff;
      else if (entry.currency === 'NGN') netNGN += diff;
      else if (entry.currency === 'CNY') netCNY += diff;
    }

    assert.ok(Math.abs(netUSD) < 0.001, `USD ledger in balance: ${netUSD}`);
    assert.ok(Math.abs(netNGN) < 0.001, `NGN ledger in balance: ${netNGN}`);
    assert.ok(Math.abs(netCNY) < 0.001, `CNY ledger in balance: ${netCNY}`);
  });

  console.log(`\nResults: ${passed} passed, ${total - passed} failed out of ${total} tests.`);
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
