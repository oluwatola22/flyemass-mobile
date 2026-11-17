import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import {
  FxBook,
  FxRateRow,
  SwapDirection,
  SWAP_DIRECTIONS,
  fromMinor,
  toMinor,
  isRateStale
} from '../../services/fxEngine';
import { TrendingUp, RefreshCw, ShieldCheck, History, Lock, ArrowLeftRight, Percent } from 'lucide-react';

const PAIRS: { base: 'CNY'; quote: 'NGN'; title: string; buyHint: string; sellHint: string; swappable: boolean; note: string }[] = [
  {
    base: 'CNY', quote: 'NGN', title: 'CNY ⇌ NGN (RMB to Naira)', swappable: true,
    buyHint: 'Buy rate: ₦ per ¥1 (customer sells RMB)', sellHint: 'Sell rate: ₦ per ¥1 (customer buys RMB)',
    note: 'Customer swaps CNY → NGN at the buy rate and NGN → CNY at the sell rate. USD is retired.'
  }
];

const DIRECTIONS: SwapDirection[] = ['NGN_TO_CNY', 'CNY_TO_NGN'];

const fmtDelta = (n?: number | null) => (n === undefined || n === null ? '—' : `${n > 0 ? '+' : ''}${n}`);

export const AdminFxRatesScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();
  const adminId: string = (adminUser as any)?.id || (adminUser as any)?.uid || 'adm-001';
  const adminName: string = (adminUser as any)?.fullName || (adminUser as any)?.name || 'Treasury Officer';
  const adminRole: string = (adminUser as any)?.role || 'super_admin';

  const [book, setBook] = useState<(FxBook & { history?: FxRateRow[] }) | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { buy: string; sell: string }>>({});
  const [feeDrafts, setFeeDrafts] = useState<Record<string, { fee: string; min: string }>>({});
  const [audit, setAudit] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const key = (b: string, q: string) => `${b}_${q}`;

  const load = useCallback(async (resetDrafts: boolean = true) => {
    try {
      const data = await db.getFxBook();
      setBook(data);
      if (!resetDrafts) {
        setAudit(await db.getFxAuditLog(adminId, adminRole));
        return;
      }
      const d: Record<string, { buy: string; sell: string }> = {};
      for (const r of data.rates as FxRateRow[]) d[key(r.base, r.quote)] = { buy: String(r.buy_rate), sell: String(r.sell_rate) };
      setDrafts(d);
      const f: Record<string, { fee: string; min: string }> = {};
      for (const dir of DIRECTIONS) {
        const s = data.fees[dir];
        f[dir] = { fee: String(s.fee_percent), min: String(fromMinor(s.min_amount_minor)) };
      }
      setFeeDrafts(f);
      setAudit(await db.getFxAuditLog(adminId, adminRole));
    } catch (e: any) {
      showToast(e.message || 'Failed to load FX book', 'error');
    }
  }, [adminId, adminRole, showToast]);

  useEffect(() => {
    load(true);
    return db.subscribe(() => {
      /* live state changes: refresh book + audit without clobbering in-progress edits */
      load(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publish = async (base: string, quote: string) => {
    const d = drafts[key(base, quote)];
    const buy = Number(d?.buy);
    const sell = Number(d?.sell);
    if (!(buy > 0) || !(sell > 0)) return showToast('Enter positive buy and sell rates', 'error');
    if (sell < buy) return showToast('Sell rate must be greater than or equal to the buy rate', 'error');
    setBusy(key(base, quote));
    const res = await db.publishFxRate(base, quote, buy, sell, adminId, adminName, adminRole);
    setBusy(null);
    if (res.success) {
      showToast(`${base}/${quote} rate published — live on all mobile clients`, 'success');
      load(true);
    } else {
      showToast(res.error || 'Publishing failed', 'error');
    }
  };

  const saveFee = async (dir: SwapDirection) => {
    const f = feeDrafts[dir];
    const fee = Number(f.fee);
    const minMinor = toMinor(f.min);
    if (!(fee >= 0 && fee <= 10)) return showToast('Fee must be between 0% and 10%', 'error');
    setBusy(dir);
    const res = await db.updateFxFeeSetting(dir, fee, minMinor, adminId, adminName, adminRole);
    setBusy(null);
    if (res.success) {
      showToast(`${dir.replace('_TO_', ' → ')} fee settings applied`, 'success');
      load(true);
    } else {
      showToast(res.error || 'Fee update failed', 'error');
    }
  };

  const rateFor = (b: string, q: string) => book?.rates.find((r) => r.base === b && r.quote === q && r.is_active);

  return (
    <AdminLayout activeTab="fx-rates">
      <div className="p-6 space-y-6" data-testid="admin-fx-rates-console">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">FX Rate Publishing & Swap Fees</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Published rates are versioned, audited, and pushed instantly to every customer's Exchange screen.
            </p>
          </div>
          <button
            onClick={() => load(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* LIVE PAIRS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {PAIRS.map((p) => {
            const active = rateFor(p.base, p.quote);
            const d = drafts[key(p.base, p.quote)] || { buy: '', sell: '' };
            const stale = book ? isRateStale(active, book.max_rate_age_minutes) : false;
            const busyKey = key(p.base, p.quote);
            return (
              <div key={busyKey} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4" data-testid={`fx-pair-${busyKey}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">{p.title}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      !active ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : stale ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {!active ? 'No active rate' : stale ? 'Stale' : 'Live'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{p.note}</p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{p.buyHint}</label>
                    <input
                      type="number" step="0.0001" min="0" value={d.buy}
                      data-testid={`input-buy-${busyKey}`}
                      onChange={(e) => setDrafts({ ...drafts, [busyKey]: { ...d, buy: e.target.value } })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">{p.sellHint}</label>
                    <input
                      type="number" step="0.0001" min="0" value={d.sell}
                      data-testid={`input-sell-${busyKey}`}
                      onChange={(e) => setDrafts({ ...drafts, [busyKey]: { ...d, sell: e.target.value } })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {active && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Active v· {new Date(active.published_at).toLocaleString()} · by {active.published_by_name || active.published_by}
                  </div>
                )}

                <button
                  onClick={() => publish(p.base, p.quote)}
                  disabled={busy === busyKey}
                  data-testid={`btn-publish-${busyKey}`}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {busy === busyKey ? 'Publishing…' : 'Update exchange rate'}
                </button>
                {!p.swappable && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
                    <Lock className="w-3 h-3" /> Swaps disabled for this pair (policy)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FEES & MINIMUMS */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4" data-testid="fx-fee-settings">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Swap Fees & Minimums (fx_fee_settings)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2">Direction</th>
                  <th className="py-2 px-2">Fee %</th>
                  <th className="py-2 px-2">Minimum (source currency)</th>
                  <th className="py-2 px-2 text-right">Apply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {DIRECTIONS.map((dir) => {
                  const f = feeDrafts[dir] || { fee: '', min: '' };
                  return (
                    <tr key={dir}>
                      <td className="py-2 px-2 font-mono font-bold text-slate-200">{dir}</td>
                      <td className="py-2 px-2">
                        <input
                          type="number" step="0.01" min="0" max="10" value={f.fee}
                          data-testid={`input-fee-${dir}`}
                          onChange={(e) => setFeeDrafts({ ...feeDrafts, [dir]: { ...f, fee: e.target.value } })}
                          className="w-24 p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number" step="0.01" min="0" value={f.min}
                          data-testid={`input-min-${dir}`}
                          onChange={(e) => setFeeDrafts({ ...feeDrafts, [dir]: { ...f, min: e.target.value } })}
                          className="w-36 p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => saveFee(dir)} disabled={busy === dir}
                          data-testid={`btn-save-fee-${dir}`}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] cursor-pointer"
                        >
                          {busy === dir ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AUDIT TRAIL */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3" data-testid="fx-audit-trail">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-300" />
            <h3 className="text-sm font-bold text-white">Immutable Rate Audit Log</h3>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> Hash-chained, append-only
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2">When</th><th className="py-2 px-2">Event</th><th className="py-2 px-2">Actor</th>
                  <th className="py-2 px-2">Pair</th><th className="py-2 px-2">Buy Δ</th><th className="py-2 px-2">Sell Δ</th>
                  <th className="py-2 px-2">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {audit.length === 0 ? (
                  <tr><td colSpan={7} className="py-4 text-center text-slate-500">No audit entries yet.</td></tr>
                ) : audit.slice(0, 40).map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2 font-bold text-slate-200">{a.event}</td>
                    <td className="py-2 px-2 text-slate-300">{a.actor_name || a.actor_id}</td>
                    <td className="py-2 px-2 font-mono text-slate-300">{a.base ? `${a.base}/${a.quote}` : '—'}</td>
                    <td className="py-2 px-2 font-mono text-slate-300">{fmtDelta(a.buy_rate_delta)}</td>
                    <td className="py-2 px-2 font-mono text-slate-300">{fmtDelta(a.sell_rate_delta)}</td>
                    <td className="py-2 px-2 font-mono text-slate-500">{String(a.hash || '').slice(0, 10)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFxRatesScreen;
