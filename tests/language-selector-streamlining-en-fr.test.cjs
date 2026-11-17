/**
 * LANGUAGE SELECTOR STREAMLINING (ENGLISH & FRENCH ONLY) TEST SUITE
 * 
 * Verifies:
 * 1. Streamlining to English (Primary) and French (Français) only
 * 2. Complete removal of Chinese, Yoruba, and Hausa
 * 3. Global i18n localization engine and translation dictionaries
 * 4. Dynamic translation across headings, buttons, wallet balances, cargo statuses, and navigation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Language Selector Streamlining (EN & FR Only) Verification...\n');

const profileSrc = fs.readFileSync(path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'), 'utf8');
const appContextSrc = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');
const i18nSrc = fs.readFileSync(path.join(__dirname, '../src/utils/i18n.ts'), 'utf8');
const bottomNavSrc = fs.readFileSync(path.join(__dirname, '../src/components/layout/BottomNav.tsx'), 'utf8');
const headerSrc = fs.readFileSync(path.join(__dirname, '../src/components/layout/Header.tsx'), 'utf8');
const homeSrc = fs.readFileSync(path.join(__dirname, '../src/screens/home/HomeScreen.tsx'), 'utf8');
const walletsSrc = fs.readFileSync(path.join(__dirname, '../src/screens/wallets/WalletsScreen.tsx'), 'utf8');

// --------------------------------------------------------------------------
// 1. Language Options Reduction (English & French Only)
// --------------------------------------------------------------------------
console.log('Test 1: Verifying Language Options in ProfileScreen & AppContext...');
assert(profileSrc.includes("English (Primary)"), 'ProfileScreen must include English (Primary) pill');
assert(profileSrc.includes("Français"), 'ProfileScreen must include Français pill');
assert(!profileSrc.includes("'ZH'"), 'Chinese (ZH) option must be removed');
assert(!profileSrc.includes("'YO'"), 'Yoruba (YO) option must be removed');
assert(!profileSrc.includes("'HA'"), 'Hausa (HA) option must be removed');
assert(!profileSrc.includes("English, Chinese, Yoruba, Hausa"), 'Old 4-language subtitle must be removed');
console.log('✅ Only English and French options are present. Chinese, Yoruba, and Hausa removed.\n');

// --------------------------------------------------------------------------
// 2. Localization State & Persistence
// --------------------------------------------------------------------------
console.log('Test 2: Verifying Localization State & LocalStorage Persistence...');
assert(appContextSrc.includes("language: Language") || appContextSrc.includes("language: 'EN' | 'FR'"), 'AppContext must define Language type');
assert(appContextSrc.includes("localStorage.setItem('flyemass_language', lang)"), 'Must persist language to localStorage');
assert(appContextSrc.includes("saved === 'FR' ? 'FR' : 'EN'") || appContextSrc.includes("if (saved === 'FR') return 'FR';"), 'Must fallback to EN unless FR is saved');
console.log('✅ Localization state and persistence verified.\n');

// --------------------------------------------------------------------------
// 3. Translation Engine & Dictionary Coverage
// --------------------------------------------------------------------------
console.log('Test 3: Verifying i18n Translation Engine & Dictionaries...');
const { t, TRANSLATIONS } = require('../src/utils/i18n.ts');

assert.strictEqual(t('nav.home', 'EN'), 'Home');
assert.strictEqual(t('nav.home', 'FR'), 'Accueil');

assert.strictEqual(t('nav.wallets', 'EN'), 'Wallets');
assert.strictEqual(t('nav.wallets', 'FR'), 'Portefeuilles');

assert.strictEqual(t('nav.cargo', 'EN'), 'Cargo');
assert.strictEqual(t('nav.cargo', 'FR'), 'Fret');

assert.strictEqual(t('route.wallets', 'EN'), 'Wallets & Multi-Currency');
assert.strictEqual(t('route.wallets', 'FR'), 'Portefeuilles & Multi-Devises');

assert.strictEqual(t('route.logistics', 'EN'), 'Logistics & Shipping');
assert.strictEqual(t('route.logistics', 'FR'), 'Logistique & Expédition');

assert.strictEqual(t('action.fund', 'EN'), 'Fund');
assert.strictEqual(t('action.fund', 'FR'), 'Approvisionner');

assert.strictEqual(t('wallets.available_balance', 'EN'), 'Available Balance');
assert.strictEqual(t('wallets.available_balance', 'FR'), 'Solde Disponible');

assert.strictEqual(t('logistics.in_transit', 'EN'), 'In Transit');
assert.strictEqual(t('logistics.in_transit', 'FR'), 'En Transit');

// Fallback check
assert.strictEqual(t('non.existent.key', 'FR', 'Fallback Text'), 'Fallback Text');
console.log('✅ Translation engine and EN/FR dictionaries verified.\n');

// --------------------------------------------------------------------------
// 4. Component Wiring & Dynamic Integration
// --------------------------------------------------------------------------
console.log('Test 4: Verifying Component Wiring (BottomNav, Header, Home, Wallets)...');
assert(bottomNavSrc.includes("t('nav.home'"), 'BottomNav must wire home tab translation');
assert(bottomNavSrc.includes("t('nav.wallets'"), 'BottomNav must wire wallets tab translation');
assert(bottomNavSrc.includes("t('nav.cargo'"), 'BottomNav must wire cargo tab translation');
assert(bottomNavSrc.includes("t('nav.shop'"), 'BottomNav must wire shop tab translation');
assert(bottomNavSrc.includes("t('nav.profile'"), 'BottomNav must wire profile tab translation');

assert(headerSrc.includes("getRouteTitle(currentRoute)"), 'Header must wire getRouteTitle for dynamic page titles');
assert(homeSrc.includes("t('action.fund'"), 'HomeScreen must wire action.fund translation');
assert(homeSrc.includes("t('wallets.available_balance'"), 'HomeScreen must wire available_balance translation');
assert(walletsSrc.includes("t('wallets.available_balance'"), 'WalletsScreen must wire available_balance translation');
console.log('✅ Component wiring verified.\n');

console.log('🎉 ALL 4 LANGUAGE STREAMLINING TESTS PASSED! 100% verified.');
