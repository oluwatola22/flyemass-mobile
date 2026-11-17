/**
 * Enterprise Currency Swap & FX Rate Publishing Engine — functional + structural tests.
 * Runs the real server engine in-process (no sockets) against a scratch DB in /tmp.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-engine-test-'));
process.env.DB_FILE = path.join(tmp, 'db.json');
process.env.WAL_FILE = path.join(tmp, 'wal.jsonl');
process.env.BACKUPS_DIR = path.join(tmp, 'backups');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const fx = require(path.join(root, 'fx-engine.cjs'));
const server = require(path.join(root, 'sync-server.cjs'));
const eng = server.__fx;

let passed = 0;
const results = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push(`✅ ${name}`);
  } catch (e) {
    results.push(`❌ ${name}\n     ${e.message}`);
    process.exitCode = 1;
  }
}

const PIN = '246810';
const U = 'usr_alade_01';
const fresh = (balances = { NGN: 5000000, CNY: 10000, USD: 1000 }) => {
  const st = eng.getState();
  st.users[U].balances = { ...balances };
  st.users[U].pinFailedAttempts = 0;
  st.users[U].pinLockedUntil = 0;
  st.fx_rate_book = null;
  st.fx_rate_audit_log = [];
  st.wallets_ledger = {};
  st.double_entry_ledger = {};
  eng.ensureFxRateBook();
  // deterministic rates + fees
  eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 210, sellRate: 220, actorId: 'adm-001', actorName: 'Test' });
  eng.publishFxRateInternal({ base: 'USD', quote: 'CNY', buyRate: 7.2, sellRate: 7.3, actorId: 'adm-001', actorName: 'Test' });
  return st.users[U];
};
const swap = (direction, amountMinor, extra = {}) =>
  eng.executeCurrencySwapInternal({ user: eng.getState().users[U], direction, amountMinor, pin: PIN, req: null, ...extra });

(async () => {
  // ---------------------------------------------------------------- MATH
  await test('Integer minor-unit math: fee rounds half-up, payout floors, no float drift', () => {
    const q = fx.computeSwapQuote({ direction: 'NGN_TO_CNY', amountMinor: 10000000, rate: { buy_rate: 210, sell_rate: 220 }, feePercent: 0.5 });
    assert.strictEqual(q.ok, true);
    assert.strictEqual(q.feeMinor, 50000);            // 0.5% of ₦100,000.00
    assert.strictEqual(q.netMinor, 9950000);
    assert.strictEqual(q.appliedRate, 220);           // customer BUYS CNY => sell rate
    assert.strictEqual(q.creditedMinor, Math.floor(9950000 / 220)); // 45227 fen
    const q2 = fx.computeSwapQuote({ direction: 'CNY_TO_NGN', amountMinor: 100000, rate: { buy_rate: 210, sell_rate: 220 }, feePercent: 0.5 });
    assert.strictEqual(q2.appliedRate, 210);          // customer SELLS CNY => buy rate
    assert.strictEqual(q2.creditedMinor, (99500 * 210));
    // classic float trap: 0.1 + 0.2 style amounts
    assert.strictEqual(fx.toMinor(0.29), 29);
    assert.strictEqual(fx.toMinor(1234567.89), 123456789);
  });

  await test('Policy: direct USD⇄NGN is rejected with the exact prompt text', () => {
    for (const d of ['USD_TO_NGN', 'NGN_TO_USD']) {
      const q = fx.computeSwapQuote({ direction: d, amountMinor: 100000, rate: { buy_rate: 1, sell_rate: 1 }, feePercent: 0 });
      assert.strictEqual(q.ok, false);
      assert.strictEqual(q.error, 'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.');
    }
  });

  // ------------------------------------------------------------- PUBLISH
  await test('publish_fx_rate: deactivates old, inserts one active row, audit captures actor + deltas', () => {
    fresh();
    const before = eng.getPublicFxBook();
    const old = before.rates.find((r) => r.base === 'CNY' && r.quote === 'NGN');
    const out = eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 212, sellRate: 223, actorId: 'adm-007', actorName: 'Ops Amaka', actorRole: 'ops' });
    assert.strictEqual(out.status, 200);
    const book = eng.getState().fx_rate_book;
    const actives = book.rates.filter((r) => r.base === 'CNY' && r.quote === 'NGN' && r.is_active);
    assert.strictEqual(actives.length, 1, 'exactly one active row per pair');
    assert.strictEqual(actives[0].buy_rate, 212);
    const oldRow = book.rates.find((r) => r.id === old.id);
    assert.strictEqual(oldRow.is_active, false);
    assert.ok(oldRow.deactivated_at);
    const log = eng.getState().fx_rate_audit_log;
    const last = log[log.length - 1];
    assert.strictEqual(last.event, 'RATE_PUBLISHED');
    assert.strictEqual(last.actor_id, 'adm-007');
    assert.strictEqual(last.actor_role, 'ops');
    assert.strictEqual(last.buy_rate_delta, 2);
    assert.strictEqual(last.sell_rate_delta, 3);
    assert.strictEqual(last.old_buy_rate, 210);
  });

  await test('publish_fx_rate: validation (sell>=buy, positive, supported pairs only)', () => {
    fresh();
    assert.strictEqual(eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 220, sellRate: 210 }).status, 400);
    assert.strictEqual(eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: -1, sellRate: 5 }).status, 400);
    assert.strictEqual(eng.publishFxRateInternal({ base: 'NGN', quote: 'USD', buyRate: 1, sellRate: 2 }).status, 400);
    assert.strictEqual(eng.publishFxRateInternal({ base: 'USD', quote: 'NGN', buyRate: 1480, sellRate: 1495 }).status, 200, 'USD/NGN valuation pair is publishable');
  });

  await test('Audit log is hash-chained and tamper-evident; entries are frozen', () => {
    fresh();
    const log = eng.getState().fx_rate_audit_log;
    assert.ok(log.length >= 2);
    for (let i = 1; i < log.length; i++) assert.strictEqual(log[i].previous_hash, log[i - 1].hash);
    assert.ok(Object.isFrozen(log[0]));
    assert.throws(() => { 'use strict'; log[0].new_buy_rate = 1; }, TypeError);
  });

  await test('Publishing mirrors into legacy rates so Live FX ticker + wallets update instantly', () => {
    fresh();
    eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 301, sellRate: 305, actorId: 'adm-001', actorName: 'T' });
    const st = eng.getState().system_settings;
    assert.strictEqual(st.rates.input_cny_to_ngn, 301);
    assert.strictEqual(st.rates.input_ngn_to_cny, 305);
    assert.strictEqual(st.live_fx_display.displayNgnRmb, 305);
  });

  // ---------------------------------------------------------------- SWAP
  await test('execute_currency_swap NGN→CNY: exact debit/credit, paired ledger, SW-YYYYMMDD-XXXXXXXX ref', async () => {
    const u = fresh();
    const out = await swap('NGN_TO_CNY', 10000000); // ₦100,000.00
    assert.strictEqual(out.status, 200, JSON.stringify(out.body));
    const b = out.body;
    assert.match(b.reference, /^SW-\d{8}-[0-9A-F]{8}$/);
    assert.strictEqual(b.fee_minor, 50000);
    assert.strictEqual(b.credited_minor, 45227);
    assert.strictEqual(u.balances.NGN, 5000000 - 100000);
    assert.strictEqual(u.balances.CNY, 10000 + 452.27);
    const legs = Object.values(eng.getState().wallets_ledger).filter((l) => l.swapReference === b.reference);
    assert.strictEqual(legs.length, 2, 'paired debit+credit ledger rows share one reference');
    assert.deepStrictEqual(legs.map((l) => l.leg).sort(), ['credit', 'debit']);
    const d = legs.find((l) => l.leg === 'debit'), c = legs.find((l) => l.leg === 'credit');
    assert.strictEqual(d.pairedEntryId, c.id);
    assert.strictEqual(d.openingBalance, 5000000);
    assert.strictEqual(d.closingBalance, 4900000);
    assert.strictEqual(c.openingBalance, 10000);
    assert.strictEqual(c.closingBalance, 10452.27);
  });

  await test('CNY→USD uses sell rate; USD→CNY uses buy rate; fee applied to source', async () => {
    const u = fresh();
    const a = await swap('USD_TO_CNY', 10000);   // $100.00 -> ¥ at 7.2
    assert.strictEqual(a.status, 200);
    assert.strictEqual(a.body.applied_rate, 7.2);
    assert.strictEqual(a.body.fee_minor, 50);
    assert.strictEqual(a.body.credited_minor, Math.floor(9950 * 7.2));
    const b = await swap('CNY_TO_USD', 7300);    // ¥73.00 -> $ at 7.3
    assert.strictEqual(b.status, 200);
    assert.strictEqual(b.body.applied_rate, 7.3);
    assert.strictEqual(b.body.credited_minor, Math.floor((7300 - 37) * 1e6 / 7.3e6)); // fee 36.5 -> 37 (half-up)
  });

  await test('Direct USD⇄NGN swap is blocked server-side and moves no money', async () => {
    const u = fresh();
    const snap = { ...u.balances };
    for (const d of ['USD_TO_NGN', 'NGN_TO_USD']) {
      const out = await swap(d, 10000);
      assert.strictEqual(out.status, 400);
      assert.strictEqual(out.body.error, 'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.');
    }
    assert.deepStrictEqual(u.balances, snap);
  });

  await test('Legacy /api/wallets/swap shape is also policy-guarded (delegates to engine)', async () => {
    const src = read('sync-server.cjs');
    assert.ok(src.includes("pathname === '/api/wallets/swap'"));
    assert.ok(/direction = `\$\{fromCurrency\}_TO_\$\{toCurrency\}`/.test(src));
  });

  await test('Wrong PIN rejected (401), no balance change, lockout after 5 failures (423)', async () => {
    const u = fresh();
    const snap = { ...u.balances };
    for (let i = 0; i < 4; i++) {
      const out = await swap('NGN_TO_CNY', 10000000, { pin: '000000' });
      assert.strictEqual(out.status, 401);
    }
    const fifth = await swap('NGN_TO_CNY', 10000000, { pin: '000000' });
    assert.strictEqual(fifth.status, 401);
    const locked = await swap('NGN_TO_CNY', 10000000);   // correct PIN, but locked
    assert.strictEqual(locked.status, 423);
    assert.deepStrictEqual(u.balances, snap);
  });

  await test('Missing PIN setup returns 428 PIN_NOT_SET (client routes to setup-pin)', async () => {
    const u = fresh();
    const saved = u.pinHash;
    u.pinHash = undefined;
    const out = await swap('NGN_TO_CNY', 10000000);
    u.pinHash = saved;
    assert.strictEqual(out.status, 428);
    assert.strictEqual(out.body.code, 'PIN_NOT_SET');
  });

  await test('Minimum, insufficient funds, invalid amount are rejected without side effects', async () => {
    const u = fresh({ NGN: 5000000, CNY: 10, USD: 1000 });
    const snap = { ...u.balances };
    assert.strictEqual((await swap('NGN_TO_CNY', 100)).body.code, 'BELOW_MINIMUM');
    assert.strictEqual((await swap('CNY_TO_NGN', 6000)).body.code, 'INSUFFICIENT_FUNDS');
    assert.strictEqual((await swap('NGN_TO_CNY', -5)).body.code, 'INVALID_AMOUNT');
    assert.strictEqual((await swap('NGN_TO_CNY', 1.5)).body.code, 'INVALID_AMOUNT');
    assert.deepStrictEqual(u.balances, snap);
    assert.strictEqual(Object.keys(eng.getState().wallets_ledger).length, 0);
  });

  await test('Stale rate is refused (RATE_STALE); republish restores swapping', async () => {
    const u = fresh();
    const rate = eng.getState().fx_rate_book.rates.find((r) => r.base === 'CNY' && r.quote === 'NGN' && r.is_active);
    rate.published_at = Date.now() - 3 * 24 * 3600 * 1000;
    const out = await swap('NGN_TO_CNY', 10000000);
    assert.strictEqual(out.status, 409);
    assert.strictEqual(out.body.code, 'RATE_STALE');
    eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 210, sellRate: 220, actorId: 'adm-001', actorName: 'T' });
    assert.strictEqual((await swap('NGN_TO_CNY', 10000000)).status, 200);
  });

  await test('Rate locked in the quote: republish between quote and submit => RATE_CHANGED, nothing moves', async () => {
    const u = fresh();
    const quotedId = eng.getPublicFxBook().rates.find((r) => r.base === 'CNY' && r.quote === 'NGN').id;
    eng.publishFxRateInternal({ base: 'CNY', quote: 'NGN', buyRate: 230, sellRate: 240, actorId: 'adm-001', actorName: 'T' });
    const snap = { ...u.balances };
    const out = await swap('NGN_TO_CNY', 10000000, { expectedRateId: quotedId });
    assert.strictEqual(out.status, 409);
    assert.strictEqual(out.body.code, 'RATE_CHANGED');
    assert.deepStrictEqual(u.balances, snap);
  });

  await test('Auto-provisions a missing destination wallet', async () => {
    const u = fresh({ NGN: 5000000 });
    delete u.balances.CNY;
    const out = await swap('NGN_TO_CNY', 10000000);
    assert.strictEqual(out.status, 200);
    assert.strictEqual(u.balances.CNY, 452.27);
  });

  await test('ATOMICITY: failure mid-swap rolls back balances, ledger, journal and audit completely', async () => {
    const u = fresh();
    const st = eng.getState();
    const snap = { ...u.balances };
    const auditLen = st.fx_rate_audit_log.length;
    // wallets_ledger write happens AFTER balances are mutated => proves rollback
    st.wallets_ledger = new Proxy({}, { set() { throw new Error('simulated disk failure'); } });
    const out = await swap('NGN_TO_CNY', 10000000);
    st.wallets_ledger = {};
    assert.strictEqual(out.status, 500);
    assert.strictEqual(out.body.code, 'ROLLED_BACK');
    assert.deepStrictEqual(u.balances, snap, 'balances restored exactly');
    assert.strictEqual(Object.keys(st.double_entry_ledger).length, 0, 'journal entry removed');
    assert.strictEqual(st.fx_rate_audit_log.length, auditLen, 'no SWAP_EXECUTED audit left behind');
  });

  await test('RACE: concurrent swaps are serialised — only affordable ones succeed, balances never negative', async () => {
    const u = fresh({ NGN: 20000, CNY: 0, USD: 0 });  // ₦20,000.00 (major units)
    const results = await Promise.all(Array.from({ length: 5 }, () => swap('NGN_TO_CNY', 1500000))); // 5 x ₦15,000
    const ok = results.filter((r) => r.status === 200).length;
    assert.strictEqual(ok, 1, 'exactly one ₦15,000 swap fits into ₦20,000');
    assert.ok(u.balances.NGN >= 0);
    assert.strictEqual(u.balances.NGN, 5000);
  });

  await test('Double-entry journal stays balanced per currency for a swap', async () => {
    fresh();
    await swap('CNY_TO_NGN', 100000);
    const entries = Object.values(eng.getState().double_entry_ledger);
    assert.ok(entries.length >= 1);
    for (const e of entries) {
      const totals = {};
      for (const p of e.postings) {
        totals[p.currency] = totals[p.currency] || { d: 0, c: 0 };
        totals[p.currency].d += p.debit; totals[p.currency].c += p.credit;
      }
      for (const t of Object.values(totals)) assert.ok(Math.abs(t.d - t.c) < 0.009);
    }
  });

  await test('Swap writes SWAP_EXECUTED into the FX audit trail', async () => {
    fresh();
    const out = await swap('NGN_TO_CNY', 10000000);
    const last = eng.getState().fx_rate_audit_log.slice(-1)[0];
    assert.strictEqual(last.event, 'SWAP_EXECUTED');
    assert.strictEqual(last.details.reference, out.body.reference);
  });

  // ------------------------------------------------------- STRUCTURE
  await test('SQL: publish_fx_rate / execute_currency_swap / fx_fee_settings / immutable audit table', () => {
    const sql = read('supabase-schema-rls.sql');
    for (const needle of [
      'public.publish_fx_rate(', 'public.execute_currency_swap(', 'CREATE TABLE IF NOT EXISTS public.fx_rates',
      'CREATE TABLE IF NOT EXISTS public.fx_fee_settings', 'CREATE TABLE IF NOT EXISTS public.fx_rate_audit_log',
      'fx_audit_log_immutable', 'FOR UPDATE', 'gen_random_bytes', "'SW-' || to_char(NOW(), 'YYYYMMDD')",
      'crypt(_pin', 'RATE_STALE', 'supabase_realtime ADD TABLE public.fx_rates',
      'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.', 'uq_fx_rates_one_active_pair',
      'is_fx_operator'
    ]) assert.ok(sql.includes(needle), `schema missing: ${needle}`);
    assert.ok(/0\.500/.test(sql), 'default fee 0.5%');
  });

  await test('Admin console: /admin/rates route, pair controls, Update exchange rate, fee table, audit trail', () => {
    const scr = read('src/screens/admin/AdminFxRatesScreen.tsx');
    for (const n of ['Update exchange rate', 'CNY ⇌ NGN', 'USD ⇌ CNY', 'USD ⇌ NGN', 'fx-fee-settings', 'fx-audit-trail',
      'publishFxRate', 'updateFxFeeSetting', 'SWAP_DIRECTIONS']) assert.ok(scr.includes(n), n);
    assert.ok(read('src/context/AppContext.tsx').includes("'admin-fx-rates': '/admin/rates'"));
    assert.ok(read('src/components/admin/AdminShell.tsx').includes('<AdminFxRatesScreen />'));
    assert.ok(read('src/components/admin/AdminLayout.tsx').includes("path: '/admin/rates'"));
    const srv = read('sync-server.cjs');
    assert.ok(srv.includes("const FX_OPERATOR_ROLES = ['super_admin', 'admin', 'ops'"));
    assert.ok(srv.includes("pathname === '/api/admin/fx/publish'"));
    assert.ok(srv.includes("pathname === '/api/admin/fx/fees'"));
  });

  await test('Mobile: modal + exchange screen use the engine, show fee/net/min, refresh, policy banner, PIN, go home', () => {
    for (const f of ['src/components/wallet/CurrencySwapModal.tsx', 'src/screens/wallets/ExchangeScreen.tsx']) {
      const src = read(f);
      assert.ok(src.includes('useFxSwap('), f + ' uses shared engine hook');
      assert.ok(src.includes('executeCurrencySwap('), f + ' calls atomic swap');
      assert.ok(src.includes('PinPad'), f + ' PIN pad');
      assert.ok(src.includes("navigate('setup-pin')"), f + ' routes to PIN setup');
      assert.ok(src.includes("navigate('home')"), f + ' returns home');
      assert.ok(/refresh-rates/.test(src), f + ' manual refresh');
    }
    const hook = read('src/hooks/useFxSwap.ts');
    assert.ok(hook.includes('USD_NGN_POLICY_MESSAGE'));
    assert.ok(read('src/services/fxEngine.ts').includes('Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.'));
  });

  await test('Engine parity: TS preview mirrors server math constants', () => {
    const ts = read('src/services/fxEngine.ts');
    assert.ok(ts.includes('(amt * feeMilli + 50000n) / 100000n'));
    assert.ok(ts.includes('(netMinor * rateMicro) / 1000000n'));
    assert.ok(ts.includes('(netMinor * 1000000n) / rateMicro'));
    const cjs = read('fx-engine.cjs');
    assert.ok(cjs.includes('(amt * feeMilli + 50000n) / 100000n'));
  });

  console.log('\n--- ENTERPRISE FX RATE PUBLISHING & CURRENCY SWAP ENGINE TESTS ---');
  results.forEach((r) => console.log(r));
  console.log(`\nRESULTS: ${passed}/${results.length} TESTS PASSED.`);
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(process.exitCode || 0);
})();
