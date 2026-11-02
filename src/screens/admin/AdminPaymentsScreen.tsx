import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupplierPaymentDocument } from '../../types';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Building2, 
  Send, 
  Sliders, 
  TrendingUp, 
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export const AdminPaymentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'disbursed' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily Margin Controls state
  const [ngnRmbRate, setNgnRmbRate] = useState('214.50');
  const [usdNgnRate, setUsdNgnRate] = useState('1485.00');
  const [usdCnyRate, setUsdCnyRate] = useState('7.24');
  const [spreadPercent, setSpreadPercent] = useState('0.75');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const paymentsList = Object.values(dbState.supplier_payments).filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.receiverAccount.includes(searchQuery) ||
                          p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdatePaymentStatus = (payment: SupplierPaymentDocument, status: 'disbursed' | 'flagged') => {
    db.updateSupplierPaymentStatus(payment.id, status);
    firebaseSync.recordAudit(
      'Finance Officer',
      status === 'disbursed' ? 'APPROVE_PAYOUT' : 'FLAG_PAYOUT',
      'supplier_payments',
      payment.id,
      `${status === 'disbursed' ? 'Approved & Disbursed' : 'Flagged for Compliance'} ¥${payment.amountRMB} to ${payment.receiverName}`
    );
    showToast(`Payment to ${payment.receiverName} marked as ${status.toUpperCase()}!`, status === 'disbursed' ? 'success' : 'error');
  };

  const handleSaveMarginRates = (e: React.FormEvent) => {
    e.preventDefault();
    firebaseSync.recordAudit('Finance Officer', 'FX_MARGIN_UPDATE', 'wallets_ledger', 'fx_rates', `Set RMB rate to ₦${ngnRmbRate}, spread to ${spreadPercent}%`);
    showToast(`Exchange rates updated: 1 RMB = ₦${ngnRmbRate} NGN (Spread: ${spreadPercent}%)`, 'success');
  };

  return (
    <AdminLayout activeTab="payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Supplier Payment Disbursement Desk</h1>
            <p className="text-xs text-slate-400">
              Review and disburse cross-border Alipay, WeChat Pay, and UnionPay merchant transfers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              China Merchant Clearing: ONLINE (T+0)
            </span>
          </div>
        </div>

        {/* Daily Exchange Rate Margin Controls Card */}
        <form onSubmit={handleSaveMarginRates} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Daily FX Clearing Rates & Margin Policy
              </h2>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Update Live Clearing Rates
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">RMB / NGN Rate (₦)</label>
              <input
                type="text"
                value={ngnRmbRate}
                onChange={(e) => setNgnRmbRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">USD / NGN Rate (₦)</label>
              <input
                type="text"
                value={usdNgnRate}
                onChange={(e) => setUsdNgnRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">USD / CNY Rate (¥)</label>
              <input
                type="text"
                value={usdCnyRate}
                onChange={(e) => setUsdCnyRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Platform Spread (%)</label>
              <input
                type="text"
                value={spreadPercent}
                onChange={(e) => setSpreadPercent(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-amber-400 outline-none"
              />
            </div>
          </div>
        </form>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, Alipay account, or channel..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'processing', 'disbursed', 'flagged'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  statusFilter === s
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All Transfers' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Supplier Transfer Queue Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier / Merchant</th>
                  <th className="py-3 px-4">Payment Method & Account</th>
                  <th className="py-3 px-4">Amount (CNY / NGN)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paymentsList.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-xs">{payment.receiverName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{payment.notes || 'Factory Goods Settlement'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          payment.paymentMethod.includes('Alipay') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          payment.paymentMethod.includes('WeChat') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {payment.paymentMethod}
                        </span>
                        <span className="font-mono text-slate-300 font-bold">{payment.receiverAccount}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-emerald-400 font-mono text-sm">
                        ¥{payment.amountRMB.toLocaleString()} CNY
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ≈ ₦{payment.equivalentNGN.toLocaleString()} NGN
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        payment.status === 'disbursed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        payment.status === 'flagged' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      }`}>
                        {payment.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {payment.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdatePaymentStatus(payment, 'disbursed')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Disburse</span>
                          </button>
                          <button
                            onClick={() => handleUpdatePaymentStatus(payment, 'flagged')}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Flag for suspicious receiver account"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Reconciled</span>
                      )}
                    </td>
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
