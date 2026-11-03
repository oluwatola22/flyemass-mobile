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
  Send, 
  ShieldCheck, 
  QrCode, 
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';

export const AdminRmbTransfersScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'disbursed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal state
  const [rejectSupplierModalPayment, setRejectSupplierModalPayment] = useState<SupplierPaymentDocument | null>(null);
  const [supplierRejectReason, setSupplierRejectReason] = useState('');

  // QR Preview modal
  const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);

  // Supplier Disbursement Evidence Modal state
  const [disburseModalPayment, setDisburseModalPayment] = useState<SupplierPaymentDocument | null>(null);
  const [clearingSessionId, setClearingSessionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [safeDeclarationRef, setSafeDeclarationRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const paymentsList = Object.values(dbState.supplier_payments || {}).filter((p) => {
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'disbursed'
      ? (p.status === 'disbursed' || p.status === 'completed')
      : statusFilter === 'rejected'
      ? (p.status === 'rejected' || p.status === 'refunded' || p.status === 'flagged')
      : p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (p.receiverName && p.receiverName.toLowerCase().includes(q)) ||
      (p.receiverAccount && p.receiverAccount.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.purpose && p.purpose.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleMarkSupplierProcessing = async (p: SupplierPaymentDocument) => {
    try {
      const res = await db.markSupplierPaymentProcessing(p.id, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payment ${p.reference || p.id} marked as Processing! Customer notified.`, 'success');
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Failed to update payment status', 'error');
    }
  };

  const handleOpenDisburseModal = (payment: SupplierPaymentDocument) => {
    setDisburseModalPayment(payment);
    setClearingSessionId(`ALIPAY-CN-${Date.now().toString().slice(-8)}`);
    setPaymentProofUrl(`https://storage.flyemass.com/receipts/${payment.id}.pdf`);
    setSafeDeclarationRef(`SAFE-CAN-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    setDisburseNotes('');
  };

  const handleSubmitSupplierDisbursement = async () => {
    if (!disburseModalPayment) return;
    try {
      const res = await db.disburseSupplierPayment(
        disburseModalPayment.id,
        { clearingSessionId, paymentProofUrl, safeDeclarationRef, adminNotes: disburseNotes },
        'adm-001'
      );
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Disbursed ¥${disburseModalPayment.amountRMB.toLocaleString()} to ${disburseModalPayment.receiverName}! Proof logged.`, 'success');
      setDisburseModalPayment(null);
      setDbState({ ...db.getState() });
    } catch (e) {
      showToast('Disbursement failed', 'error');
    }
  };

  const handleOpenRejectSupplier = (payment: SupplierPaymentDocument) => {
    if (payment.status === 'disbursed' || payment.status === 'completed') {
      showToast('Cannot reject or refund an already completed payment', 'error');
      return;
    }
    setRejectSupplierModalPayment(payment);
    setSupplierRejectReason('Beneficiary account name mismatch or SAFE regulatory compliance restriction');
  };

  const handleConfirmSupplierRejection = async () => {
    if (!rejectSupplierModalPayment) return;
    if (!supplierRejectReason || supplierRejectReason.trim().length < 5) {
      showToast('Rejection reason must be at least 5 characters', 'error');
      return;
    }
    try {
      const res = await db.refundSupplierPayment(rejectSupplierModalPayment.id, supplierRejectReason.trim(), 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payment rejected and ¥${rejectSupplierModalPayment.amountRMB.toLocaleString()} refunded to customer CNY wallet!`, 'info');
      setRejectSupplierModalPayment(null);
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Refund failed', 'error');
    }
  };

  return (
    <AdminLayout activeTab="rmb-transfers">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Send className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                China RMB Supplier Transfers Desk
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct settlement to Chinese mainland beneficiaries via Alipay, WeChat Pay & UnionPay with SAFE compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Total Transfers:</span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
              {paymentsList.length} Records
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search receiver, account, reference, method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {(['all', 'pending', 'processing', 'disbursed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* RMB Transfers Table */}
        <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Beneficiary (China)</th>
                <th className="py-3 px-4 font-semibold">Method & Account</th>
                <th className="py-3 px-4 font-semibold">Amount (RMB)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paymentsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No China supplier transfers found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paymentsList.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-indigo-400">{payment.reference}</div>
                      <div className="text-[10px] text-slate-500">{new Date(payment.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{payment.userId}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{payment.purpose || 'Supplier Invoice'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{payment.receiverName}</div>
                      {((payment as any).chineseName || payment.bankName) && (
                        <div className="text-[10px] text-slate-400">{(payment as any).chineseName || payment.bankName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                          {payment.paymentMethod}
                        </span>
                        {payment.qrCodeUrl && (
                          <button
                            onClick={() => setPreviewQrUrl(payment.qrCodeUrl!)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 cursor-pointer"
                            title="Preview QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{payment.receiverAccount}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-white num-tabular text-sm">
                        ¥{payment.amountRMB.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Paid: ₦{(payment.amountRMB * 214.5).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'disbursed' || payment.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : payment.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : payment.status === 'rejected' || payment.status === 'refunded'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handleMarkSupplierProcessing(payment)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Process
                          </button>
                        )}

                        {(payment.status === 'pending' || payment.status === 'processing') && (
                          <>
                            <button
                              onClick={() => handleOpenDisburseModal(payment)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow-sm transition-all cursor-pointer"
                            >
                              Disburse
                            </button>
                            <button
                              onClick={() => handleOpenRejectSupplier(payment)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              Reject & Refund
                            </button>
                          </>
                        )}

                        {(payment.status === 'disbursed' || payment.status === 'completed') && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Disbursed</span>
                          </div>
                        )}

                        {(payment.status === 'rejected' || payment.status === 'refunded') && (
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
      {disburseModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Disburse RMB Supplier Transfer</h3>
              </div>
              <button onClick={() => setDisburseModalPayment(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-bold text-white">{disburseModalPayment.receiverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RMB Amount:</span>
                <span className="font-mono font-bold text-emerald-400">¥{disburseModalPayment.amountRMB.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method & Account:</span>
                <span className="font-mono text-slate-300">{disburseModalPayment.paymentMethod} • {disburseModalPayment.receiverAccount}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Clearing Session ID</label>
                <input
                  type="text"
                  value={clearingSessionId}
                  onChange={(e) => setClearingSessionId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">SAFE Declaration Ref</label>
                <input
                  type="text"
                  value={safeDeclarationRef}
                  onChange={(e) => setSafeDeclarationRef(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bank Proof URL</label>
                <input
                  type="text"
                  value={paymentProofUrl}
                  onChange={(e) => setPaymentProofUrl(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Disbursement Notes</label>
                <textarea
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  rows={2}
                  placeholder="Settled via China Construction Bank correspondent window..."
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisburseModalPayment(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSupplierDisbursement}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectSupplierModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Reject Transfer & Refund Wallet</h3>
              </div>
              <button onClick={() => setRejectSupplierModalPayment(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              Rejecting this RMB transfer will automatically reverse the transaction and refund <strong>¥{rejectSupplierModalPayment.amountRMB.toLocaleString()}</strong> to the customer's CNY wallet with double-entry ledger balance.
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rejection Reason</label>
              <textarea
                value={supplierRejectReason}
                onChange={(e) => setSupplierRejectReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejecting this supplier transfer..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectSupplierModalPayment(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSupplierRejection}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {previewQrUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 max-w-xs w-full text-center shadow-2xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Beneficiary Payment QR</h4>
            <div className="w-56 h-56 mx-auto bg-white p-2 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={previewQrUrl} alt="Alipay / WeChat QR" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setPreviewQrUrl(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminRmbTransfersScreen;
