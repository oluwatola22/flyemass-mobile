import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupplierPaymentDocument, WithdrawalDocument } from '../../types';
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
  X,
  ArrowDownLeft,
  FileText
} from 'lucide-react';

export const AdminPaymentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeTab, setActiveTab] = useState<'supplier' | 'withdrawals' | 'rates'>('supplier');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'disbursed' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily Margin Controls state from authoritative settings
  const settings = dbState.system_settings || { rates: { NGN_CNY: 214.50, USD_NGN: 1485.00, USD_CNY: 7.24, spreadPercent: 0.75 }, fees: { withdrawalFlatNGN: 1500 } };
  const [ngnRmbRate, setNgnRmbRate] = useState(String(settings.rates.NGN_CNY || 214.50));
  const [usdNgnRate, setUsdNgnRate] = useState(String(settings.rates.USD_NGN || 1485.00));
  const [usdCnyRate, setUsdCnyRate] = useState(String(settings.rates.USD_CNY || 7.24));
  const [spreadPercent, setSpreadPercent] = useState(String(settings.rates.spreadPercent || 0.75));

  // Payout confirmation modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalDocument | null>(null);
  const [transferRefInput, setTransferRefInput] = useState('');

  // Supplier Disbursement Evidence Modal state (Phase 3 Requirement)
  const [disburseModalPayment, setDisburseModalPayment] = useState<SupplierPaymentDocument | null>(null);
  const [clearingSessionId, setClearingSessionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [safeDeclarationRef, setSafeDeclarationRef] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const paymentsList = Object.values(dbState.supplier_payments || {}).filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.receiverAccount.includes(searchQuery) ||
                          p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const withdrawalsList = Object.values(dbState.withdrawals || {});

  const handleOpenDisburseModal = (payment: SupplierPaymentDocument) => {
    setDisburseModalPayment(payment);
    setClearingSessionId(`ALIPAY-CN-${Date.now().toString().slice(-8)}`);
    setPaymentProofUrl(`https://storage.flyemass.com/receipts/${payment.id}.pdf`);
    setSafeDeclarationRef(`SAFE-CAN-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSubmitSupplierDisbursement = async () => {
    if (!disburseModalPayment) return;
    try {
      const res = await db.disburseSupplierPayment(
        disburseModalPayment.id,
        { clearingSessionId, paymentProofUrl, safeDeclarationRef },
        'adm-001'
      );
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Disbursed ¥${disburseModalPayment.amountRMB.toLocaleString()} to ${disburseModalPayment.receiverName}! Proof logged.`, 'success');
      setDisburseModalPayment(null);
    } catch (e) {
      showToast('Disbursement failed', 'error');
    }
  };

  const handleRefundSupplierPayment = async (payment: SupplierPaymentDocument) => {
    if (!window.confirm(`Refund ¥${payment.amountRMB.toLocaleString()} back to customer wallet?`)) return;
    try {
      const res = await db.refundSupplierPayment(payment.id, 'Compliance / Supplier rejection', 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payment refunded. ¥${payment.amountRMB.toLocaleString()} credited back to customer wallet!`, 'info');
      setDisburseModalPayment(null);
    } catch (e) {
      showToast('Refund failed', 'error');
    }
  };

  const handleUpdatePaymentStatus = (payment: SupplierPaymentDocument, status: 'disbursed' | 'flagged') => {
    if (status === 'disbursed') {
      handleOpenDisburseModal(payment);
      return;
    }
    db.updateSupplierPaymentStatus(payment.id, status);
    firebaseSync.recordAudit(
      'Finance Officer',
      'FLAG_PAYOUT',
      'supplier_payments',
      payment.id,
      `Flagged for Compliance ¥${payment.amountRMB} to ${payment.receiverName}`
    );
    showToast(`Payment to ${payment.receiverName} marked as FLAGGED!`, 'error');
  };

  const handleApproveWithdrawal = (w: WithdrawalDocument) => {
    setSelectedWithdrawal(w);
    setTransferRefInput(`NIP-DISB-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmDisbursement = async () => {
    if (!selectedWithdrawal) return;
    try {
      const res = await db.disburseWithdrawal(selectedWithdrawal.id, transferRefInput, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payout of ₦${selectedWithdrawal.amountNGN.toLocaleString()} confirmed paid to ${selectedWithdrawal.accountName}!`, 'success');
      setSelectedWithdrawal(null);
    } catch (e) {
      showToast('Disbursement failed', 'error');
    }
  };

  const handleRefundWithdrawal = async (w: WithdrawalDocument) => {
    if (!window.confirm(`Reject withdrawal and refund ₦${(w.amountNGN + w.feeNGN).toLocaleString()} back to customer?`)) return;
    try {
      const res = await db.refundWithdrawal(w.id, 'Compliance review rejection', 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Withdrawal rejected. ₦${(w.amountNGN + w.feeNGN).toLocaleString()} refunded to user balance!`, 'info');
    } catch (e) {
      showToast('Refund error', 'error');
    }
  };

  const handleSaveMarginRates = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.updateSystemSettings('Finance Officer Ngozi', {
      NGN_CNY: Number(ngnRmbRate),
      USD_NGN: Number(usdNgnRate),
      USD_CNY: Number(usdCnyRate),
      spreadPercent: Number(spreadPercent)
    });
    showToast(`Authoritative exchange rates & margins updated! 1 RMB = ₦${ngnRmbRate} NGN`, 'success');
  };

  return (
    <AdminLayout activeTab="payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Treasury, Supplier Payouts & FX Clearing</h1>
            <p className="text-xs text-slate-400">
              Manage cross-border Alipay, WeChat Pay, Nigerian NUBAN payouts, and live rate margins.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('supplier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'supplier' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              RMB Supplier Queue ({paymentsList.length})
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'withdrawals' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Naira Payouts ({withdrawalsList.length})
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rates' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              FX Rates & Margins
            </button>
          </div>
        </div>

        {/* 1. SUPPLIER RMB DISBURSAL QUEUE */}
        {activeTab === 'supplier' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search receiver, Alipay ID, or bank account..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                {(['all', 'processing', 'disbursed', 'flagged'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                      statusFilter === st ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3">Supplier / Beneficiary</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Amount (CNY)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-bold text-emerald-400">{p.reference || p.id}</span>
                        <p className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <h4 className="font-bold text-white text-xs">{p.receiverName}</h4>
                        <p className="font-mono text-[11px] text-slate-400">{p.receiverAccount}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        <span className="font-extrabold text-white text-sm">¥{(p.amountRMB ?? 0).toLocaleString()}</span>
                        <p className="text-[10px] text-slate-500">≈ ₦{(p.equivalentNGN ?? 0).toLocaleString()} NGN</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          p.status === 'disbursed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          p.status === 'flagged' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {p.status === 'processing' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdatePaymentStatus(p, 'disbursed')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                            >
                              Approve Disbursal
                            </button>
                            <button
                              onClick={() => handleUpdatePaymentStatus(p, 'flagged')}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700"
                              title="Flag Transaction"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. NAIRA PAYOUTS / WITHDRAWALS QUEUE */}
        {activeTab === 'withdrawals' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              Naira NUBAN Bank Payouts ({withdrawalsList.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Client & Bank Account</th>
                    <th className="py-3 px-3">Amount & Fee</th>
                    <th className="py-3 px-3">Transfer Ref</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {withdrawalsList.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <h4 className="font-bold text-white text-xs">{w.accountName}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{w.bankName} • {w.accountNumber}</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        <span className="font-extrabold text-emerald-400 text-sm">₦{(w.amountNGN ?? 0).toLocaleString()}</span>
                        <p className="text-[10px] text-slate-500">+ ₦{w.feeNGN} NIBSS fee</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                        {w.transferReference || 'Pending Reference'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          w.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          w.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {w.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                            >
                              Disburse
                            </button>
                            <button
                              onClick={() => handleRefundWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono capitalize">{w.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. EXCHANGE RATES & MARGINS CONTROL TOWER */}
        {activeTab === 'rates' && (
          <form onSubmit={handleSaveMarginRates} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 max-w-2xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Authoritative Central Bank & Clearing Rate Controller
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Configure Active Currency Pairs & Daily Spreads
              </h3>
              <p className="text-xs text-slate-400">
                Affects all customer FX swaps, freight calculations, and Chinese factory payouts immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Broadcast & Lock New Clearing Rates</span>
            </button>
          </form>
        )}
      </div>

      {/* Confirm Bank Payout Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                NUBAN Transfer Reference Confirmation
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Disburse ₦{selectedWithdrawal.amountNGN.toLocaleString()} NGN
              </h3>
              <p className="text-xs text-slate-400">
                Beneficiary: <strong className="text-white">{selectedWithdrawal.accountName}</strong> ({selectedWithdrawal.bankName})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Official NIBSS / Bank Session ID:
              </label>
              <input
                type="text"
                value={transferRefInput}
                onChange={(e) => setTransferRefInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisbursement}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Disbursement Evidence Modal (Strict Phase 3 Compliance) */}
      {disburseModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                China Trade Remittance Evidence Protocol
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Disburse ¥{disburseModalPayment.amountRMB.toLocaleString()} RMB
              </h3>
              <p className="text-xs text-slate-400">
                Beneficiary: <strong className="text-white">{disburseModalPayment.receiverName}</strong> ({disburseModalPayment.receiverAccount})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  1. Clearing Session ID (Alipay/WeChat/CNAPS Reference):
                </label>
                <input
                  type="text"
                  value={clearingSessionId}
                  onChange={(e) => setClearingSessionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  2. Remittance Receipt / Slip Document URL:
                </label>
                <input
                  type="text"
                  value={paymentProofUrl}
                  onChange={(e) => setPaymentProofUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  3. SAFE China Customs / Forex Declaration Ref:
                </label>
                <input
                  type="text"
                  value={safeDeclarationRef}
                  onChange={(e) => setSafeDeclarationRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-400 outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRefundSupplierPayment(disburseModalPayment)}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
              >
                Reject & Refund
              </button>
              <button
                type="button"
                onClick={() => setDisburseModalPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSupplierDisbursement}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Confirm Disbursement
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
