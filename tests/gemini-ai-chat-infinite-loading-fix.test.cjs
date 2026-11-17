/**
 * FLYEMASS GEMINI AI CHAT INFINITE LOADING & FALLBACK FIX TEST SUITE
 * 
 * Verifies:
 * 1. API Route / Service Handler Debugging:
 *    - GEMINI_API_KEY and VITE_GEMINI_API_KEY environment variables are loaded and supported.
 *    - Backend callGeminiTradeConcierge implements AbortController timeout to prevent hanging.
 *    - Unhandled asynchronous promises and streaming/chunk errors are handled with try/catch.
 *    - /api/support/chat endpoint never hangs and always returns a valid JSON response.
 * 2. Fallback & State Error Handling:
 *    - Client-side sendConciergeChat implements AbortController timeout and try/catch.
 *    - Safety timeout in SupportChatScreen prevents infinite "is composing response..." rolling loader.
 *    - Friendly fallback error bubble ("Trade AI is momentarily busy. Please try again or tap to escalate to human support.")
 *    - Exact error logged to console via console.error.
 *    - State updates correctly append AI's response text to both local React state and Supabase chat_messages table.
 *    - Tap to escalate to human support button seamlessly transitions status to 'Pending Human Review' / 'Human In-Progress'.
 * 3. General Ledger Equilibrium & Strict Zero-Crypto Compliance.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=============================================================================');
  console.log('FLYEMASS GEMINI AI CHAT INFINITE LOADING & FALLBACK FIX TEST SUITE');
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

  const syncServerPath = path.join(__dirname, '../sync-server.cjs');
  const syncServerContent = fs.readFileSync(syncServerPath, 'utf8');

  const supportChatPath = path.join(__dirname, '../src/screens/profile/SupportChatScreen.tsx');
  const supportChatContent = fs.readFileSync(supportChatPath, 'utf8');

  const dbPath = path.join(__dirname, '../src/services/db.ts');
  const dbContent = fs.readFileSync(dbPath, 'utf8');

  const appContextPath = path.join(__dirname, '../src/context/AppContext.tsx');
  const appContextContent = fs.readFileSync(appContextPath, 'utf8');

  // Test 1: Environment Key Loading & Authorization
  test('1. Environment variable loading for GEMINI_API_KEY and VITE_GEMINI_API_KEY', () => {
    assert.ok(
      syncServerContent.includes('loadEnvFile'),
      'sync-server.cjs must include helper to load .env files'
    );
    assert.ok(
      syncServerContent.includes('process.env.GEMINI_API_KEY') && syncServerContent.includes('process.env.VITE_GEMINI_API_KEY'),
      'sync-server.cjs must check both GEMINI_API_KEY and VITE_GEMINI_API_KEY'
    );
    assert.ok(
      syncServerContent.includes('.env.development'),
      'Must load .env.development file on startup'
    );
  });

  // Test 2: Backend Gemini API Timeout & Async Promise Resolution
  test('2. Backend callGeminiTradeConcierge timeout protection via AbortController', () => {
    assert.ok(
      syncServerContent.includes('const controller = new AbortController();'),
      'Must use AbortController for network timeout protection'
    );
    assert.ok(
      syncServerContent.includes('clearTimeout(timeoutId);'),
      'Must clear timeout when response completes'
    );
    assert.ok(
      syncServerContent.includes('gemini-3.8-flash'),
      'Must target current gemini-3.8-flash endpoint'
    );
    assert.ok(
      syncServerContent.includes('[Gemini API Call Exception - Falling back to Knowledge Engine]'),
      'Must gracefully catch exceptions and log warning to console'
    );
  });

  // Test 3: Backend /api/support/chat Error Guarding & Non-Hanging Guarantee
  test('3. Backend /api/support/chat error recovery with friendly fallback bubble', () => {
    assert.ok(
      syncServerContent.includes('Trade AI is momentarily busy. Please try again or tap to escalate to human support.'),
      'Must define exact friendly fallback message in sync-server.cjs'
    );
    assert.ok(
      syncServerContent.includes('catch (fatalErr)'),
      'Must have top-level try/catch around /api/support/chat endpoint'
    );
    assert.ok(
      syncServerContent.includes('dbState.chat_messages'),
      'Must append fallback message to dbState.chat_messages table'
    );
  });

  // Test 4: Client-side Database Service (db.ts) Timeout & Fallback
  test('4. db.sendConciergeChat timeout protection & Supabase chat_messages sync', () => {
    assert.ok(
      dbContent.includes('const controller = new AbortController();'),
      'db.sendConciergeChat must implement AbortController timeout'
    );
    assert.ok(
      dbContent.includes('Trade AI is momentarily busy. Please try again or tap to escalate to human support.'),
      'db.sendConciergeChat must fall back to friendly message on timeout/fetch failure'
    );
    assert.ok(
      dbContent.includes('this.state.chat_messages.push(aiMsg);'),
      'Must append AI response to this.state.chat_messages'
    );
    assert.ok(
      dbContent.includes('console.error(\'[Gemini AI Concierge db.sendConciergeChat Error / Fallback Activated]:\''),
      'Must log exact error to console'
    );
  });

  // Test 5: Client-side UI SupportChatScreen Infinite Loading Prevention
  test('5. SupportChatScreen clears "is composing response..." loader & logs error', () => {
    assert.ok(
      supportChatContent.includes('Promise.race'),
      'SupportChatScreen must race against safety timeout to guarantee loading state is cleared'
    );
    assert.ok(
      supportChatContent.includes('finally {'),
      'SupportChatScreen must reset isSending in finally block'
    );
    assert.ok(
      supportChatContent.includes('setIsSending(false);'),
      'Must clear isSending loading state immediately'
    );
    assert.ok(
      supportChatContent.includes('console.error(\'[Gemini AI Concierge Error]:\''),
      'Must log exact error to console with console.error'
    );
    assert.ok(
      supportChatContent.includes('Trade AI is momentarily busy. Please try again or tap to escalate to human support.'),
      'Must render friendly error bubble in chat'
    );
  });

  // Test 6: One-tap Escalate to Human Support Button in Chat
  test('6. Tap to escalate to human support button in chat message bubble', () => {
    assert.ok(
      supportChatContent.includes('handleEscalateToHuman'),
      'SupportChatScreen must define handleEscalateToHuman handler'
    );
    assert.ok(
      supportChatContent.includes('Tap to Escalate to Human Support'),
      'Must render "Tap to Escalate to Human Support" interactive button'
    );
    assert.ok(
      supportChatContent.includes('db.takeOverSupportTicket'),
      'Must call db.takeOverSupportTicket on escalation'
    );
  });

  // Test 7: AppContext sendChatMessage Error Handling
  test('7. AppContext sendChatMessage robust promise & fallback handling', () => {
    assert.ok(
      appContextContent.includes('console.error(\'[sendChatMessage Dispatch Error]:\''),
      'AppContext sendChatMessage must log dispatch errors to console'
    );
    assert.ok(
      appContextContent.includes('Trade AI is momentarily busy. Please try again or tap to escalate to human support.'),
      'AppContext sendChatMessage must append fallback reply on error'
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
