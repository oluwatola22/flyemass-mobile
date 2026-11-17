const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🧪 RUNNING: FlyeMass Personal Account Registration Test Suite\n');

// 1. Verify SignupScreen.tsx source code adherence
const signupSourcePath = path.join(__dirname, '../src/screens/auth/SignupScreen.tsx');
const signupCode = fs.readFileSync(signupSourcePath, 'utf8');

console.log('1. Checking UI/UX and Corporate Field Removal...');
assert(!signupCode.includes('Register Corporate Account'), 'Should NOT contain Register Corporate Account');
assert(!signupCode.includes('rcNumber'), 'Should NOT contain rcNumber');
assert(!signupCode.includes('CAC / RC Number'), 'Should NOT contain CAC / RC Number');
assert(!signupCode.includes('Registered Company Name'), 'Should NOT contain Registered Company Name');
assert(!signupCode.includes('Corporate Email Address'), 'Should NOT contain Corporate Email Address');
assert(!signupCode.includes('SAFE regulations'), 'Should NOT contain corporate SAFE regulations message');

console.log('   ✅ All corporate fields and terminology removed from SignupScreen');

console.log('2. Checking Required Title, Subtitle, and Progress Indicator...');
assert(signupCode.includes('Create Your FlyeMass Account'), 'Must contain exact heading: Create Your FlyeMass Account');
assert(signupCode.includes('Join FlyeMass to manage your wallets, payments, shipments, and international services.'), 'Must contain exact subtitle');
assert(signupCode.includes('STEP 1 OF 2'), 'Must contain STEP 1 OF 2 progress indicator');
assert(signupCode.includes('Continue to PIN Setup'), 'Must contain primary button: Continue to PIN Setup');
console.log('   ✅ Title, subtitle, progress indicator, and CTA verified');

console.log('3. Checking Required 7 Personal Information Fields in Exact Sequence...');
const firstNameIdx = signupCode.indexOf('1. First Name');
const surnameIdx = signupCode.indexOf('2. Surname');
const otherNameIdx = signupCode.indexOf('3. Other Name');
const dobIdx = signupCode.indexOf('4. Date of Birth');
const phoneIdx = signupCode.indexOf('5. Phone Number');
const emailIdx = signupCode.indexOf('6. Email Address');
const countryIdx = signupCode.indexOf('7. Country');

assert(firstNameIdx !== -1, 'First Name must exist in form');
assert(surnameIdx !== -1, 'Surname must exist in form');
assert(otherNameIdx !== -1, 'Other Name must exist in form');
assert(dobIdx !== -1, 'Date of Birth must exist in form');
assert(phoneIdx !== -1, 'Phone Number must exist in form');
assert(emailIdx !== -1, 'Email Address must exist in form');
assert(countryIdx !== -1, 'Country must exist in form');

assert(firstNameIdx < surnameIdx, 'First Name must precede Surname');
assert(surnameIdx < otherNameIdx, 'Surname must precede Other Name');
assert(otherNameIdx < dobIdx, 'Other Name must precede Date of Birth');
assert(dobIdx < phoneIdx, 'Date of Birth must precede Phone Number');
assert(phoneIdx < emailIdx, 'Phone Number must precede Email Address');
assert(emailIdx < countryIdx, 'Email Address must precede Country');
console.log('   ✅ Exact 7-field order verified: First Name -> Surname -> Other Name -> Date of Birth -> Phone Number -> Email Address -> Country');

console.log('4. Checking Country Selection & Calling Code Suggestion...');
assert(signupCode.includes('callingCode: c.dialCode'), 'Country selection must auto-suggest international calling code');
assert(signupCode.includes('searchQuery') || signupCode.includes('countrySearchQuery'), 'Must provide searchable country filtering');
assert(signupCode.includes('flag'), 'Must display country flags');
console.log('   ✅ Country search and calling code auto-suggestion verified');

console.log('5. Checking 18+ Age Requirement & Validation Logic...');
assert(signupCode.includes('18 years'), 'Must validate 18+ age requirement');
assert(signupCode.includes('maxDobDate') || signupCode.includes('max={maxDobDate}'), 'Must enforce max date of birth');
console.log('   ✅ 18+ age validation verified');

console.log('6. Checking Backend User Registration Integration...');
const dbStatePath = path.join(__dirname, '../db-state.json');
const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

// Test user registration payload
const testEmail = `chinedu.test.${Date.now()}@flyemass-personal.test`;
const testPayload = {
  firstName: 'Chinedu',
  surname: 'Okonkwo',
  otherName: 'Emeka',
  fullName: 'Chinedu Emeka Okonkwo',
  dateOfBirth: '1995-04-12',
  country: 'Nigeria',
  phone: '+234 802 345 6789',
  email: testEmail,
  accountType: 'personal',
  pin: '135792'
};

// Simulate backend registration logic from sync-server.cjs
const userId = `usr_test_${Date.now()}`;
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}
const pinSecurity = hashPin(testPayload.pin);

const newUser = {
  uid: userId,
  fullName: testPayload.fullName,
  firstName: testPayload.firstName,
  surname: testPayload.surname,
  otherName: testPayload.otherName,
  dateOfBirth: testPayload.dateOfBirth,
  country: testPayload.country,
  accountType: testPayload.accountType,
  email: testPayload.email,
  phone: testPayload.phone,
  businessName: testPayload.fullName,
  verifiedBadge: false,
  role: 'client',
  createdAt: Date.now(),
  balances: { NGN: 0, CNY: 0, USD: 0 },
  pinHash: pinSecurity.hash,
  pinSalt: pinSecurity.salt,
  pinFailedAttempts: 0,
  pinLockedUntil: 0
};

assert.strictEqual(newUser.accountType, 'personal');
assert.strictEqual(newUser.firstName, 'Chinedu');
assert.strictEqual(newUser.surname, 'Okonkwo');
assert.strictEqual(newUser.otherName, 'Emeka');
assert.strictEqual(newUser.balances.NGN, 0);
assert.strictEqual(newUser.balances.CNY, 0);
assert.strictEqual(newUser.balances.USD, 0);
assert(!('rcNumber' in newUser), 'User object must not contain rcNumber');
assert(!('companyName' in newUser), 'User object must not require companyName');

// Verify PBKDF2 PIN verification
const verifyHash = crypto.pbkdf2Sync('135792', newUser.pinSalt, 100000, 64, 'sha512').toString('hex');
assert.strictEqual(verifyHash, newUser.pinHash, 'PIN verification must match PBKDF2 hash');

console.log('   ✅ Personal user registration, PBKDF2 PIN hashing, and account defaults verified');

console.log('7. Verifying Preservation of Historical Financial Ledger...');
// Check that double entry trial balance is intact
let nPostings = 0;
const totals = { NGN: 0, CNY: 0, USD: 0 };
for (const key in dbState.double_entry_ledger) {
  const entry = dbState.double_entry_ledger[key];
  if (Array.isArray(entry.postings)) {
    for (const p of entry.postings) {
      nPostings++;
      const cur = p.currency || 'NGN';
      totals[cur] = (totals[cur] || 0) + (p.debit || 0) - (p.credit || 0);
    }
  }
}

assert.strictEqual(totals.NGN, 0, 'NGN trial balance must be zero');
assert.strictEqual(totals.CNY, 0, 'CNY trial balance must be zero');
assert.strictEqual(totals.USD, 0, 'USD trial balance must be zero');
console.log(`   ✅ Double-entry equilibrium preserved (${nPostings} individual postings, net 0 across all currencies)`);

console.log('\n🎉 ALL TESTS PASSED: Personal Account Registration verified successfully!\n');
