import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { Sliders, TrendingUp, CheckCircle2, RefreshCw, Scale, ArrowLeftRight } from 'lucide-react';

export const AdminFxManagementScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());

  const settings = dbState.system_settings || { 
    rates: { NGN_CNY: 214.50, USD_NGN: 1485.00, USD_CNY: 7.24, spreadPercent: 0.75 }, 
    fees: { withdrawalFlatNGN: 1500 } 
  };

  const [ngnRmbRate, setNgnRmbRate] = useState(String(settings.rates.NGN_CNY || 214.50));
  const [usdNgnRate, setUsdNgnRate] = useState(String(settings.rates.USD_NGN || 1485.00));
  const [usdCnyRate, setUsdCnyRate] = useState(String(settings.rates.USD_CNY || 7.24));
  const [spreadPercent, setSpreadPercent] = useState(String(settings.rates.spreadPercent || 0.75));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    return db.subscribe(() => {
      const s = db.getState();
      setDbState({ ...s });
      if (s.system_settings?.rates) {
        setNgnRmbRate(String(s.system_settings.rates.NGN_CNY || 214.50));
        setUsdNgnRate(String(s.system_settings.rates.USD_NGN || 1485.00));
        setUsdCnyRate(String(s.system_settings.rates.USD_CNY || 7.24));
        setSpreadPercent(String(s.system_settings.rates.spreadPercent || 0.75));
      }
    });
  }, []);

  // Filter exchange transactions from wallets ledger
  const exchangeTransactions = Object.values(dbState.wallets_ledger || {})
    .filter((tx) => tx.type === 'FX_SWAP')
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const handleSaveMarginRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await db.updateSystemSettings('Finance Officer Ngozi', {
        NGN_CNY: Number(ngnRmbRate),
        USD_NGN: Number(usdNgnRate),
        USD_CNY: Number(usdCnyRate),
        spreadPercent: Number(spreadPercent)
      });
      showToast(`Authoritative exchange rates & margins updated! 1 RMB = ₦${ngnRmbRate} NGN`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update rates', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout activeTab="fx-management">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                FX & Daily Margin Spread Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authoritative interbank baseline exchange rates, retail margin spreads, and customer conversion journal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Total Swaps Logged:</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
              {exchangeTransactions.length} Swaps
            </span>
          </div>
        </div>

        {/* Live Rates Form */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Authoritative Clearing Rates</h3>
          </div>

          <form onSubmit={handleSaveMarginRates} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  1 RMB (CNY) = Nigerian Naira (₦)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-emerald-400">₦</span>
                  <input
                    type="number"
                    step="0.01"
                    value={ngnRmbRate}
                    onChange={(e) => setNgnRmbRate(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  1 USD ($) = Nigerian Naira (₦)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-emerald-400">₦</span>
                  <input
                    type="number"
                    step="0.01"
                    value={usdNgnRate}
                    onChange={(e) => setUsdNgnRate(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  1 USD ($) = Chinese Yuan (¥)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-indigo-400">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    value={usdCnyRate}
                    onChange={(e) => setUsdCnyRate(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Clearing Margin Spread (%)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400">%</span>
                  <input
                    type="number"
                    step="0.01"
                    value={spreadPercent}
                    onChange={(e) => setSpreadPercent(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUpdating ? 'Broadcasting...' : 'Broadcast & Lock New Clearing Rates'}</span>
            </button>
          </form>
        </div>

        {/* Currency Swaps Journal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Recent FX Conversions Journal</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{exchangeTransactions.length} Total Swaps</span>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                  <th className="py-3 px-4 font-semibold">Reference</th>
                  <th className="py-3 px-4 font-semibold">User ID</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Currency & Amount</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {exchangeTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No FX swap transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  exchangeTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{tx.reference || tx.id}</td>
                      <td className="py-3 px-4 text-white font-medium">{tx.userId}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {tx.sourceCurrency} ➔ {tx.targetCurrency} {tx.rate ? `@ ${tx.rate}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {tx.sourceCurrency} {tx.amount.toLocaleString()} 
                        {tx.convertedAmount ? ` ➔ ${tx.targetCurrency} ${tx.convertedAmount.toLocaleString()}` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.timestamp || Date.now()).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tx.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
export default AdminFxManagementScreen;
