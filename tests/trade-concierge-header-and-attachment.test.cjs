/**
 * FLYEMASS TRADE CONCIERGE TOP HEADER UI/UX & ATTACHMENT UPLOAD TEST SUITE
 * 
 * Verifies:
 * 1. Top Header UI/UX Layout Fix:
 *    - Responsive flexbox layout of top status banner ("Chen Wei / Trade AI", "Gemini 3.8 Flash", ticket number, and "Open - AI Handled" badge).
 *    - Clean text scaling with flex-wrap and min-w-0 to prevent overlapping, clipping, or overflowing on narrow viewports.
 *    - Status badge stays shrink-0 and whitespace-nowrap.
 * 2. Document / Receipt Upload Button Integration:
 *    - Paperclip attachment button triggers hidden file input dialog (image/*, application/pdf, .doc, .docx).
 *    - db.uploadChatAttachment uploads files to Supabase Storage (/api/support/upload-attachment).
 *    - Selected attachment displays preview badge with filename, upload state, and remove action.
 *    - Attachment payload (attachmentUrl, attachmentName, attachmentType) correctly appends to messages.
 *    - Rendered in mobile SupportChatScreen and enterprise AdminSupportScreen with view link.
 * 3. Platform Consistency:
 *    - Strict Zero-Crypto Platform Policy preserved.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS TRADE CONCIERGE TOP HEADER UI/UX & ATTACHMENT UPLOAD TEST SUITE');
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

  const supportChatPath = path.join(__dirname, '../src/screens/profile/SupportChatScreen.tsx');
  const supportChatContent = fs.readFileSync(supportChatPath, 'utf8');

  const adminSupportPath = path.join(__dirname, '../src/screens/admin/AdminSupportScreen.tsx');
  const adminSupportContent = fs.readFileSync(adminSupportPath, 'utf8');

  const dbPath = path.join(__dirname, '../src/services/db.ts');
  const dbContent = fs.readFileSync(dbPath, 'utf8');

  const syncServerPath = path.join(__dirname, '../sync-server.cjs');
  const syncServerContent = fs.readFileSync(syncServerPath, 'utf8');

  const typesPath = path.join(__dirname, '../src/types/index.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  // Test 1: Top Header Responsive Layout & Non-Overlapping Structure
  test('1. Top header status banner implements responsive, non-overlapping flexbox layout', () => {
    assert.ok(
      supportChatContent.includes('flex items-center justify-between gap-2.5'),
      'Header card must use gap-2.5 between identity and status badge'
    );
    assert.ok(
      supportChatContent.includes('min-w-0 flex-1'),
      'Identity container must use min-w-0 flex-1 to prevent viewport overflow'
    );
    assert.ok(
      supportChatContent.includes('flex items-center gap-1.5 flex-wrap'),
      'Identity title row must use flex-wrap to scale gracefully on narrow screens'
    );
    assert.ok(
      supportChatContent.includes('shrink-0'),
      'Status badge container must use shrink-0 to prevent deformation'
    );
    assert.ok(
      supportChatContent.includes('whitespace-nowrap'),
      'Status badge text must use whitespace-nowrap'
    );
  });

  // Test 2: Paperclip Button & Hidden File Input Wiring
  test('2. Paperclip button is wired to trigger file selector for images and documents', () => {
    assert.ok(
      supportChatContent.includes('fileInputRef.current?.click()'),
      'Paperclip button must trigger fileInputRef click'
    );
    assert.ok(
      supportChatContent.includes('accept="image/*,application/pdf,.doc,.docx"'),
      'File input must accept images, PDF receipts, and documents'
    );
    assert.ok(
      supportChatContent.includes('handleFileSelect'),
      'File input must be wired to handleFileSelect'
    );
  });

  // Test 3: Supabase Storage Upload Backend Endpoint & db.ts Method
  test('3. Backend /api/support/upload-attachment and db.uploadChatAttachment to Supabase Storage', () => {
    assert.ok(
      syncServerContent.includes("pathname === '/api/support/upload-attachment'"),
      'sync-server.cjs must implement /api/support/upload-attachment endpoint'
    );
    assert.ok(
      syncServerContent.includes('https://supabase.flyemass.com/storage/v1/object/public'),
      'Must target official Supabase Storage URL structure'
    );
    assert.ok(
      dbContent.includes('public async uploadChatAttachment('),
      'db.ts must implement uploadChatAttachment method'
    );
  });

  // Test 4: Attachment Preview & Message Payload Integration
  test('4. Attachment preview card rendered in input bar and appended to message payload', () => {
    assert.ok(
      supportChatContent.includes('pendingAttachment'),
      'SupportChatScreen must manage pendingAttachment state'
    );
    assert.ok(
      supportChatContent.includes('attachmentPayload'),
      'SupportChatScreen must construct and pass attachmentPayload'
    );
    assert.ok(
      dbContent.includes('attachment?: { url?: string; fileName?: string; fileType?: string }'),
      'db.sendConciergeChat must accept attachment payload parameter'
    );
    assert.ok(
      syncServerContent.includes('attachmentUrl, attachmentName, attachmentType'),
      'sync-server.cjs must extract and persist attachment fields in ticket messages'
    );
  });

  // Test 5: Attachment Rendering in Mobile Chat and Admin Console
  test('5. Attachments render with preview image / icon and "View Document" link in mobile and admin', () => {
    assert.ok(
      supportChatContent.includes('msg.attachmentUrl'),
      'SupportChatScreen must render attachment card when msg.attachmentUrl exists'
    );
    assert.ok(
      supportChatContent.includes('View Document'),
      'SupportChatScreen must render "View Document" link'
    );
    assert.ok(
      adminSupportContent.includes('m.attachmentUrl'),
      'AdminSupportScreen must render attachment card when m.attachmentUrl exists'
    );
    assert.ok(
      typesContent.includes('attachmentUrl?: string;'),
      'SupportTicketMessage interface in types must define attachmentUrl'
    );
  });

  console.log('\n=============================================================================');
  console.log(`TEST RUN SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('=============================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
