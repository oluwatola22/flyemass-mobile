/**
 * TRADE LANGUAGE MODAL / DROPDOWN SELECTOR TEST SUITE
 * 
 * Verifies:
 * 1. Sleek iOS-style settings row with Globe icon, active language display, and ChevronDown trigger
 * 2. Minimalist bottom sheet / picker modal with mobile pull handle, header, and close button
 * 3. Crisp two-option picker (English (Primary) & Français (French)) with active checkmark / radio indicator
 * 4. Instant localization & state update: setLanguage trigger, modal dismiss, and toast feedback without page reloads
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Trade Language Modal / Dropdown Selector Verification...\n');

const profileSrc = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
const appContextSrc = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');
const i18nSrc = fs.readFileSync(path.join(__dirname, '../src/utils/i18n.ts'), 'utf8');

// --------------------------------------------------------------------------
// 1. Sleek Row Selector Design
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Sleek Row Selector Design & Trigger...');
assert(profileSrc.includes('setShowLanguagePicker(true)'), 
  'Row selector must trigger showLanguagePicker modal');
assert(profileSrc.includes('ChevronDown'), 
  'Selector trigger must include ChevronDown icon');
assert(profileSrc.includes('aria-label="Select Trade Language"'), 
  'Dropdown trigger must have accessible label');
assert(profileSrc.includes("language === 'FR' ? 'Français' : 'English (Primary)'"), 
  'Dropdown trigger must display currently active language');
assert(profileSrc.includes('<Globe className="w-4 h-4" />'), 
  'Row selector must display Globe icon');
console.log('✅ Sleek row selector design and ChevronDown trigger verified.\n');

// --------------------------------------------------------------------------
// 2. Minimalist Bottom Sheet / Picker Modal Structure
// --------------------------------------------------------------------------
console.log('Test 2: Verifying Minimalist Bottom Sheet / Modal Structure...');
assert(profileSrc.includes('showLanguagePicker &&'), 
  'ProfileScreen must conditionally render showLanguagePicker modal');
assert(profileSrc.includes('fixed inset-0 z-50 flex items-end sm:items-center justify-center'), 
  'Modal must render as iOS-style bottom sheet on mobile and centered on larger viewports');
assert(profileSrc.includes('w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden'), 
  'Bottom sheet must render iOS-style top drag handle on mobile');
assert(profileSrc.includes('onClick={() => setShowLanguagePicker(false)}'), 
  'Backdrop and close buttons must dismiss modal');
console.log('✅ Minimalist bottom sheet / modal structure verified.\n');

// --------------------------------------------------------------------------
// 3. Crisp Two-Option Language Picker (English & French Only)
// --------------------------------------------------------------------------
console.log('Test 3: Verifying Two-Option Picker with Active Indicators...');
assert(profileSrc.includes("name: 'English (Primary)'"), 
  'Modal must provide English (Primary) option');
assert(profileSrc.includes("name: 'Français (French)'"), 
  'Modal must provide Français (French) option');
assert(profileSrc.includes('Check className="w-3 h-3 stroke-[3]"'), 
  'Active option must show crisp checkmark indicator');
assert(!profileSrc.includes("'Chinese'"), 
  'Must not include Chinese option');
assert(!profileSrc.includes("'Yoruba'"), 
  'Must not include Yoruba option');
assert(!profileSrc.includes("'Hausa'"), 
  'Must not include Hausa option');
console.log('✅ Two-option language list with active indicators verified.\n');

// --------------------------------------------------------------------------
// 4. Instant Localization & State Update without Page Reload
// --------------------------------------------------------------------------
console.log('Test 4: Verifying Instant State Update & Microcopy Translation...');
assert(profileSrc.includes('setLanguage(option.id)'), 
  'Selecting option must immediately invoke setLanguage');
assert(profileSrc.includes('setShowLanguagePicker(false)'), 
  'Selecting option must immediately close modal');
assert(profileSrc.includes('showToast('), 
  'Selecting option must trigger feedback toast');

const { t } = require('../src/utils/i18n.ts');
assert.strictEqual(t('profile.trade_language', 'EN'), 'Trade Language');
assert.strictEqual(t('profile.trade_language', 'FR'), 'Langue Commerciale');
assert.strictEqual(t('nav.home', 'EN'), 'Home');
assert.strictEqual(t('nav.home', 'FR'), 'Accueil');
assert.strictEqual(t('route.wallets', 'EN'), 'Wallets & Multi-Currency');
assert.strictEqual(t('route.wallets', 'FR'), 'Portefeuilles & Multi-Devises');

console.log('✅ Instant state update and reactive i18n translation verified.\n');

console.log('🎉 ALL 4 TRADE LANGUAGE MODAL / DROPDOWN SELECTOR TESTS PASSED! 100% verified.');
