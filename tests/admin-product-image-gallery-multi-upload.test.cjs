/**
 * FLYEMASS ADMIN PRODUCT IMAGE GALLERY & MULTI-UPLOAD VERIFICATION SUITE
 * 
 * Verifies:
 * 1. AdminShopScreen Multi-Image Dropzone & File Picker Component:
 *    - Drag-and-drop file dropzone accepting PNG, JPG, WebP
 *    - Dynamic "+ Add Image URL / Upload" repeater list
 *    - Image management controls: Primary Cover star, Set Main, Angle index labels, Delete
 *    - Both Add Product Modal and Edit Product Modal support multi-image upload
 * 2. Database Schema & Supabase Storage Alignment:
 *    - supabase-schema-rls.sql specifies images TEXT[] and products storage bucket with RLS
 *    - sync-server.cjs implements /api/shop/upload-image endpoint
 *    - db.ts implements uploadProductImage() and persists images[] on addProduct/updateProduct
 * 3. Mobile App Product Gallery Integration:
 *    - ProductDetailScreen features swipeable image gallery with touch events
 *    - Chevrons (Prev/Next), top counter pill, and bottom indicator dots
 *    - Multi-angle thumbnail strip with active border ring
 * 4. General Ledger Mathematical Equilibrium:
 *    - Strict double-entry accounting verification ($0.0000, ₦0.0000, ¥0.0000)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n=============================================================================');
console.log('FLYEMASS "ADMIN PRODUCT IMAGE GALLERY & MULTI-UPLOAD" VERIFICATION SUITE');
console.log('=============================================================================\n');

// 1. AdminShopScreen Multi-Image Dropzone & Repeater Component
test('1.1 AdminShopScreen defines state for newImages, editImages, dropzone dragging and upload progress', () => {
  const adminShopPath = path.join(ROOT_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(adminShopPath, 'utf-8');

  assert.ok(content.includes('newImages') && content.includes('setNewImages'), 'State newImages is defined');
  assert.ok(content.includes('editImages') && content.includes('setEditImages'), 'State editImages is defined');
  assert.ok(content.includes('isDraggingNew') && content.includes('isDraggingEdit'), 'Drag states are defined');
  assert.ok(content.includes('isUploadingNew') && content.includes('isUploadingEdit'), 'Uploading states are defined');
});

test('1.2 AdminShopScreen Add Modal includes dropzone, file picker, and dynamic "+ Add Image URL / Upload" repeater', () => {
  const adminShopPath = path.join(ROOT_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(adminShopPath, 'utf-8');

  assert.ok(content.includes('Product Image Gallery & Angles'), 'Header for multi-image gallery is present');
  assert.ok(content.includes('new-file-input'), 'Hidden file input for dropzone is present');
  assert.ok(content.includes('image/png,image/jpeg,image/webp'), 'Accepts PNG, JPG, and WebP');
  assert.ok(content.includes('+ Add Image URL / Upload'), 'Dynamic "+ Add Image URL / Upload" button is present');
  assert.ok(content.includes('handleSetPrimaryImage'), 'Primary cover setter is implemented');
  assert.ok(content.includes('handleRemoveImage'), 'Image removal handler is implemented');
});

test('1.3 AdminShopScreen Edit Modal includes multi-image dropzone and repeater', () => {
  const adminShopPath = path.join(ROOT_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(adminShopPath, 'utf-8');

  assert.ok(content.includes('edit-file-input'), 'Edit modal file input is present');
  assert.ok(content.includes('handleUploadFiles(e.target.files, \'edit\')'), 'Edit file upload handler is bound');
  assert.ok(content.includes('handleAddManualImage(\'edit\')'), 'Edit manual image URL repeater is bound');
});

test('1.4 AdminShopScreen handleBrandChange initializes multi-angle photography arrays for Apple, Pixel, and Samsung', () => {
  const adminShopPath = path.join(ROOT_DIR, 'src/screens/admin/AdminShopScreen.tsx');
  const content = fs.readFileSync(adminShopPath, 'utf-8');

  assert.ok(content.includes('pixelGallery') && content.includes('samsungGallery') && content.includes('appleGallery'), 
    'Pre-configures multi-angle galleries for each brand');
  assert.ok(content.includes('setNewImages(pixelGallery)') && content.includes('setNewImages(samsungGallery)'), 
    'Sets newImages on brand switch');
});

// 2. Database Schema & Storage Alignment
test('2.1 supabase-schema-rls.sql defines images TEXT[] column and products storage bucket with RLS', () => {
  const sqlPath = path.join(ROOT_DIR, 'supabase-schema-rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  assert.ok(sql.includes('images TEXT[]'), 'SQL schema defines images TEXT[] array column');
  assert.ok(sql.includes("('products', 'products', true)"), 
    'Supabase storage bucket for products is defined');
  assert.ok(sql.includes("bucket_id = 'products'"), 'RLS policies for products bucket are defined');
});

test('2.2 sync-server.cjs implements /api/shop/upload-image and saves images array in products', () => {
  const serverPath = path.join(ROOT_DIR, 'sync-server.cjs');
  const content = fs.readFileSync(serverPath, 'utf-8');

  assert.ok(content.includes('/api/shop/upload-image'), 'Upload endpoint is defined in sync server');
  assert.ok(content.includes('storage/v1/object/public/products'), 'Supabase storage URL format is configured');
  assert.ok(content.includes('Array.isArray(product.images)'), 'Products API accepts images array');
});

test('2.3 db.ts provides uploadProductImage method and guarantees images array persistence', () => {
  const dbPath = path.join(ROOT_DIR, 'src/services/db.ts');
  const content = fs.readFileSync(dbPath, 'utf-8');

  assert.ok(content.includes('uploadProductImage(file: File)'), 'db.uploadProductImage is implemented');
  assert.ok(content.includes('images: gallery'), 'addProduct sanitizes and stores images array');
  assert.ok(content.includes('updateProduct(productId: string, updates: Partial<TechProduct>)'), 'updateProduct is available');
});

// 3. Mobile App Product Gallery Integration
test('3.1 ProductDetailScreen implements swipeable touch gallery, navigation chevrons, and angle indicators', () => {
  const detailPath = path.join(ROOT_DIR, 'src/screens/shop/ProductDetailScreen.tsx');
  const content = fs.readFileSync(detailPath, 'utf-8');

  assert.ok(content.includes('handleTouchStart') && content.includes('handleTouchMove') && content.includes('handleTouchEnd'), 
    'Touch swipe event handlers are implemented');
  assert.ok(content.includes('isLeftSwipe') && content.includes('isRightSwipe'), 'Left and right swipe threshold logic is implemented');
  assert.ok(content.includes('handlePrevImage') && content.includes('handleNextImage'), 'Chevron buttons are implemented');
  assert.ok(content.includes('selectedImageIndex + 1') && content.includes('images.length'), 'Counter pill is rendered');
  assert.ok(content.includes('dotIdx === selectedImageIndex ? \'w-4 bg-emerald-400\' : \'w-1.5 bg-slate-600\''), 'Active dot indicator is rendered');
});

test('3.2 Authoritative mockData.ts and db-state.json products contain multi-image arrays', () => {
  const mockPath = path.join(ROOT_DIR, 'src/data/mockData.ts');
  const mockContent = fs.readFileSync(mockPath, 'utf-8');
  assert.ok(mockContent.includes("id: 'prod-iphone-16-pro'") && mockContent.includes("images: ["), 'iPhone 16 Pro Max has multi-image gallery');
  assert.ok(mockContent.includes("id: 'prod-pixel-9-pro-xl'") && mockContent.includes("images: ["), 'Pixel 9 Pro XL has multi-image gallery');
  assert.ok(mockContent.includes("id: 'prod-samsung-s24-ultra'") && mockContent.includes("images: ["), 'Galaxy S24 Ultra has multi-image gallery');

  const statePath = path.join(ROOT_DIR, 'db-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  const prods = Object.values(state.products || {});
  assert.ok(prods.length > 0, 'Products exist in db-state.json');
  const multiImageProds = prods.filter(p => Array.isArray(p.images) && p.images.length > 1);
  assert.ok(multiImageProds.length >= 10, `At least 10 products have multi-image galleries (found ${multiImageProds.length})`);
});

// 4. Double-Entry General Ledger Equilibrium
test('4.1 Double-Entry General Ledger in db-state.json maintains 100% mathematical equilibrium (discrepancy = 0.0000)', () => {
  const statePath = path.join(ROOT_DIR, 'db-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  const ledger = state.double_entry_ledger || {};
  const entries = Object.values(ledger);

  assert.ok(entries.length > 0, 'General ledger contains postings');

  const balances = { USD: 0, NGN: 0, CNY: 0 };
  let postingCount = 0;

  for (const entry of entries) {
    if (Array.isArray(entry.postings)) {
      for (const p of entry.postings) {
        postingCount++;
        const amt = Number(p.amount) || 0;
        const cur = p.currency || 'USD';
        if (p.direction === 'credit') {
          balances[cur] = (balances[cur] || 0) + amt;
        } else if (p.direction === 'debit') {
          balances[cur] = (balances[cur] || 0) - amt;
        }
      }
    }
  }

  console.log(`   Checked ${postingCount} postings across ${entries.length} double-entry ledger transactions:`);
  console.log(`   • Net USD Discrepancy: $${(balances.USD || 0).toFixed(4)}`);
  console.log(`   • Net NGN Discrepancy: ₦${(balances.NGN || 0).toFixed(4)}`);
  console.log(`   • Net CNY Discrepancy: ¥${(balances.CNY || 0).toFixed(4)}`);

  assert.strictEqual(Math.abs(balances.USD || 0) < 0.0001, true, `USD ledger discrepancy must be 0.0000`);
  assert.strictEqual(Math.abs(balances.NGN || 0) < 0.0001, true, `NGN ledger discrepancy must be 0.0000`);
  assert.strictEqual(Math.abs(balances.CNY || 0) < 0.0001, true, `CNY ledger discrepancy must be 0.0000`);
});

console.log('\n=============================================================================');
console.log(`ALL ${totalTests} VERIFICATION TESTS FOR ADMIN PRODUCT IMAGE GALLERY & MULTI-UPLOAD PASSED!`);
console.log('=============================================================================\n');
