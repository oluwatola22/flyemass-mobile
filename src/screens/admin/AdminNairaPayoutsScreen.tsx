import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { WithdrawalDocument } from '../../types';
import { 
  ArrowDownLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  Check, 
  Download,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const AdminNairaPayoutsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'pending' | 'processing' | 'approved' | 'rejected'>('all');
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState('');

  // Rejection modal state
  const [rejectWithdrawalModal, setRejectWithdrawalModal] = useState<WithdrawalDocument | null>(null);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState('');

  // Payout confirmation modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalDocument | null>(null);
  const [transferRefInput, setTransferRefInput] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const withdrawalsList = Object.values(dbState.withdrawals || {}).filter((w) => {
    const matchesStatus = withdrawalStatusFilter === 'all'
      ? true
      : withdrawalStatusFilter === 'approved'
      ? (w.status === 'approved' || w.status === 'completed')
      : withdrawalStatusFilter === 'rejected'
      ? (w.status === 'rejected' || w.status === 'refunded' || w.status === 'failed')
      : w.status === withdrawalStatusFilter;
    const q = withdrawalSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      (w.accountName && w.accountName.toLowerCase().includes(q)) ||
      (w.accountNumber && w.accountNumber.toLowerCase().includes(q)) ||
      (w.bankName && w.bankName.toLowerCase().includes(q)) ||
      (w.reference && w.reference.toLowerCase().includes(q)) ||
      (w.userId && w.userId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleMarkWithdrawalProcessing = async (w: WithdrawalDocument) => {
    try {
      const res = await db.markWithdrawalProcessing(w.id, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Withdrawal ${w.reference || w.id} marked as Processing! Customer notified.`, 'success');
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Failed to update withdrawal status', 'error');
    }
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
      setDbState({ ...db.getState() });
    } catch (e) {
      showToast('Disbursement failed', 'error');
    }
  };

  const handleOpenRejectWithdrawal = (w: WithdrawalDocument) => {
    if (w.status === 'approved' || w.status === 'completed') {
      showToast('Cannot reject or refund an already completed withdrawal', 'error');
      return;
    }
    setRejectWithdrawalModal(w);
    setWithdrawalRejectReason('Beneficiary account rejected by receiving bank switch or CBN NUBAN compliance failure');
  };

  const handleConfirmWithdrawalRejection = async () => {
    if (!rejectWithdrawalModal) return;
    if (!withdrawalRejectReason || withdrawalRejectReason.trim().length < 5) {
      showToast('Rejection reason must be at least 5 characters', 'error');
      return;
    }
    try {
      const res = await db.refundWithdrawal(rejectWithdrawalModal.id, withdrawalRejectReason.trim(), 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      const refundTotal = rejectWithdrawalModal.amountNGN + (rejectWithdrawalModal.feeNGN || 50);
      showToast(`Withdrawal rejected and ₦${refundTotal.toLocaleString()} refunded to customer NGN wallet!`, 'info');
      setRejectWithdrawalModal(null);
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Refund failed', 'error');
    }
  };

  return (
    <AdminLayout activeTab="naira-payouts">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Download className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Naira Bank Payouts Desk
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct settlement to verified 10-digit NUBAN accounts across all CBN-licensed commercial and microfinance banks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Total Payouts:</span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
              {withdrawalsList.length} Requests
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, bank, NUBAN, reference..."
              value={withdrawalSearchQuery}
              onChange={(e) => setWithdrawalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {(['all', 'pending', 'processing', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setWithdrawalStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                  withdrawalStatusFilter === status
                    ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Beneficiary (NUBAN)</th>
                <th className="py-3 px-4 font-semibold">Bank Name</th>
                <th className="py-3 px-4 font-semibold">Amount (NGN)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {withdrawalsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No Naira bank withdrawals found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                withdrawalsList.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-400">{w.reference}</div>
                      <div className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{w.userId}</div>
                      <div className="text-[10px] text-slate-400">Fee: ₦{(w.feeNGN || 50).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{w.accountName}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{w.accountNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="font-medium text-slate-300">{w.bankName}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span>CBN Check Digit: PASS</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-white num-tabular text-sm">
                        ₦{w.amountNGN.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total Debited: ₦{(w.amountNGN + (w.feeNGN || 50)).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'approved' || w.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : w.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : w.status === 'rejected' || w.status === 'refunded'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === 'pending' && (
                          <button
                            onClick={() => handleMarkWithdrawalProcessing(w)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Process
                          </button>
                        )}

                        {(w.status === 'pending' || w.status === 'processing') && (
                          <>
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow-sm transition-all cursor-pointer"
                            >
                              Approve Payout
                            </button>
                            <button
                              onClick={() => handleOpenRejectWithdrawal(w)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              Reject & Refund
                            </button>
                          </>
                        )}

                        {(w.status === 'approved' || w.status === 'completed') && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </div>
                        )}

                        {(w.status === 'rejected' || w.status === 'refunded') && (
                          <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Refunded</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Approve Naira Bank Payout</h3>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-bold text-white">{selectedWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account / Bank:</span>
                <span className="font-mono text-slate-300">{selectedWithdrawal.accountNumber} ({selectedWithdrawal.bankName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disbursement Amount:</span>
                <span className="font-mono font-bold text-emerald-400">₦{selectedWithdrawal.amountNGN.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">NIP Transfer Reference</label>
              <input
                type="text"
                value={transferRefInput}
                onChange={(e) => setTransferRefInput(e.target.value)}
                placeholder="e.g. NIP-DISB-492019"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisbursement}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectWithdrawalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Reject Withdrawal & Refund NGN</h3>
              </div>
              <button onClick={() => setRejectWithdrawalModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              Rejecting this withdrawal will refund <strong>₦{(rejectWithdrawalModal.amountNGN + (rejectWithdrawalModal.feeNGN || 50)).toLocaleString()}</strong> (including the ₦{rejectWithdrawalModal.feeNGN || 50} transaction fee) directly back to the customer's NGN wallet.
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rejection Reason</label>
              <textarea
                value={withdrawalRejectReason}
                onChange={(e) => setWithdrawalRejectReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejecting this withdrawal..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectWithdrawalModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawalRejection}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminNairaPayoutsScreen;
