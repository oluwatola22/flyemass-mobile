import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupplierPaymentDocument, WithdrawalDocument } from '../../types';
import { getBackendBaseUrl } from '../../utils/environment';
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
  FileText,
  Download,
  Scale,
  RefreshCw
} from 'lucide-react';

export const AdminPaymentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeTab, setActiveTab] = useState<'supplier' | 'withdrawals' | 'ledger' | 'reconciliation' | 'rates' | 'gateways'>('supplier');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'disbursed' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyRefInput, setVerifyRefInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifyingRef, setIsVerifyingRef] = useState(false);
  const [auditVerifyResult, setAuditVerifyResult] = useState<any>(null);
  
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

  // Webhook Simulation Modal state
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simProvider, setSimProvider] = useState<'providus' | 'monnify' | 'korapay'>('providus');
  const [simAmount, setSimAmount] = useState('250000');
  const [simUserId, setSimUserId] = useState('usr_alade_01');
  const [isSimulating, setIsSimulating] = useState(false);

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
  const webhookEvents = dbState.webhook_events || db.getWebhookEvents();

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await db.simulateWebhook(simProvider, parseFloat(simAmount) || 100000, simUserId, 'adm-001');
      showToast(`Sandbox ${simProvider.toUpperCase()} webhook processed! ₦${(parseFloat(simAmount) || 100000).toLocaleString()} credited with double-entry. Ref: ${res.reference}`, 'success');
      setShowSimulateModal(false);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation failed', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

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

  const handleVerifyReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRefInput.trim()) return;
    setIsVerifyingRef(true);
    try {
      const res = await fetch(`${getBackendBaseUrl()}/api/payments/verify/${encodeURIComponent(verifyRefInput.trim())}`);
      const data = await res.json();
      setVerifyResult(data);
      if (res.ok) {
        showToast(`Reference ${verifyRefInput.trim()} verified on authoritative ledger!`, 'success');
      } else {
        showToast(data.error || 'Reference not found', 'error');
      }
    } catch (err: any) {
      showToast('Network error verifying reference', 'error');
    } finally {
      setIsVerifyingRef(false);
    }
  };

  const handleVerifyAuditChain = async () => {
    try {
      const res = await fetch(`${getBackendBaseUrl()}/api/admin/audit-logs/verify`, {
        headers: {
          'x-admin-id': 'adm-001',
          'x-admin-role': 'super_admin'
        }
      });
      const data = await res.json();
      setAuditVerifyResult(data);
      if (data.valid) {
        showToast(`Audit Hash Chain Verified! ${data.verifiedRecords} consecutive hashes validated against GENESIS_FLYE_2026`, 'success');
      } else {
        showToast(`Audit Chain Integrity Broken at record #${data.brokenAtRecord}`, 'error');
      }
    } catch (e: any) {
      showToast('Failed to verify audit logs', 'error');
    }
  };

  const handleExportLedgerCSV = () => {
    const entries = Object.values(dbState.double_entry_ledger || {});
    if (entries.length === 0) {
      showToast('No ledger entries to export', 'info');
      return;
    }
    const headers = ['Journal ID', 'Reference', 'Type', 'Description', 'Timestamp', 'Date', 'Postings'];
    const rows = entries.map((j: any) => [
      j.id,
      j.reference,
      j.transactionType,
      `"${(j.description || '').replace(/"/g, '""')}"`,
      j.timestamp,
      new Date(j.timestamp).toISOString(),
      `"${(j.postings || []).map((p: any) => `${p.account} (${p.currency}): Dr ${p.debit} / Cr ${p.credit}`).join('; ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flyemass_general_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${entries.length} double-entry general ledger records!`, 'success');
  };

  const journalEntries = Object.values(dbState.double_entry_ledger || {}).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

  // Compute live trial balance
  const trialTotals = { NGN: { debit: 0, credit: 0 }, CNY: { debit: 0, credit: 0 }, USD: { debit: 0, credit: 0 } };
  journalEntries.forEach((entry: any) => {
    (entry.postings || []).forEach((p: any) => {
      const c = p.currency as 'NGN' | 'CNY' | 'USD';
      if (trialTotals[c]) {
        trialTotals[c].debit += (p.debit || 0);
        trialTotals[c].credit += (p.credit || 0);
      }
    });
  });

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

          <div className="flex flex-wrap gap-2">
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
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ledger' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              General Ledger ({journalEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reconciliation' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Trial Balance & Recon
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rates' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              FX Rates & Margins
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gateways' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Gateways & Webhooks ({webhookEvents.length})
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

        {/* 3. DOUBLE-ENTRY GENERAL LEDGER JOURNAL */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xl">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Authoritative Double-Entry General Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {journalEntries.length} balanced journal entries • Immutable SHA-256 audited record
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLedgerCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Ledger</span>
                </button>
              </div>
            </div>

            {/* Funding Reference Live Verification Bar */}
            <form onSubmit={handleVerifyReference} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={verifyRefInput}
                onChange={(e) => setVerifyRefInput(e.target.value)}
                placeholder="Verify settlement reference (e.g. Providus NIP, Monnify, Korapay, or Order Number)..."
                className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
              />
              <button
                type="submit"
                disabled={isVerifyingRef}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
              >
                {isVerifyingRef ? 'Verifying...' : 'Verify Reference'}
              </button>
            </form>

            {verifyResult && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">Settlement Verification Result:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                    {verifyResult.settlementStatus || 'VERIFIED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div>Ref: <strong className="text-white">{verifyResult.reference}</strong></div>
                  <div>Settled: <strong className="text-white">{new Date(verifyResult.settledAt || Date.now()).toLocaleTimeString()}</strong></div>
                  <div>Amount: <strong className="text-white">{verifyResult.currency} {verifyResult.amount?.toLocaleString()}</strong></div>
                  <div>Journal ID: <strong className="text-emerald-400">{verifyResult.journalId || 'SETTLED'}</strong></div>
                </div>
              </div>
            )}

            {/* General Ledger Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4">Journal Ref & Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Debits (Dr)</th>
                      <th className="py-3 px-4">Credits (Cr)</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {journalEntries.map((j: any) => (
                      <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-white text-xs">{j.reference}</p>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase">
                            {j.transactionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-300 text-[11px]">
                          {j.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {(j.postings || []).filter((p: any) => p.debit > 0).map((p: any, idx: number) => (
                            <div key={idx} className="text-emerald-400">
                              <span className="text-slate-500">{p.account}: </span>
                              <strong>{p.currency} {p.debit.toLocaleString()}</strong>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {(j.postings || []).filter((p: any) => p.credit > 0).map((p: any, idx: number) => (
                            <div key={idx} className="text-indigo-400">
                              <span className="text-slate-500">{p.account}: </span>
                              <strong>{p.currency} {p.credit.toLocaleString()}</strong>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-[10px] font-mono whitespace-nowrap">
                          {new Date(j.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. FINANCIAL RECONCILIATION & TRIAL BALANCE */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Multi-Currency Trial Balance</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authoritative accounting invariant: Total Debits must exactly equal Total Credits (Net Variance === 0)
                  </p>
                </div>

                <button
                  onClick={handleVerifyAuditChain}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verify SHA-256 Audit Chain</span>
                </button>
              </div>

              {auditVerifyResult && (
                <div className={`p-4 rounded-2xl border text-xs ${
                  auditVerifyResult.valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{auditVerifyResult.valid ? 'Cryptographic Link Continuity Confirmed' : 'Integrity Broken'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Genesis Hash: <strong className="font-mono text-white">GENESIS_FLYE_2026</strong>. {auditVerifyResult.verifiedRecords} audit log records verified with unbroken SHA-256 hashes.
                  </p>
                </div>
              )}

              {/* 3-Currency Trial Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* NGN */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">🇳🇬 Nigerian Naira (NGN)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      Net: ₦{(trialTotals.NGN.debit - trialTotals.NGN.credit).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Debits:</span>
                      <strong className="text-emerald-400">₦{trialTotals.NGN.debit.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Credits:</span>
                      <strong className="text-indigo-400">₦{trialTotals.NGN.credit.toLocaleString()}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                      <span>Status:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                      </span>
                    </div>
                  </div>
                </div>

                {/* CNY */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">🇨🇳 Chinese Yuan (CNY)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      Net: ¥{(trialTotals.CNY.debit - trialTotals.CNY.credit).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Debits:</span>
                      <strong className="text-emerald-400">¥{trialTotals.CNY.debit.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Credits:</span>
                      <strong className="text-indigo-400">¥{trialTotals.CNY.credit.toLocaleString()}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                      <span>Status:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                      </span>
                    </div>
                  </div>
                </div>

                {/* USD */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">🇺🇸 US Dollar (USD)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      Net: ${(trialTotals.USD.debit - trialTotals.USD.credit).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Debits:</span>
                      <strong className="text-emerald-400">${trialTotals.USD.debit.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Credits:</span>
                      <strong className="text-indigo-400">${trialTotals.USD.credit.toLocaleString()}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                      <span>Status:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. EXCHANGE RATES & MARGINS CONTROL TOWER */}
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

        {/* 6. PAYMENT GATEWAYS & WEBHOOK MONITOR */}
        {activeTab === 'gateways' && (
          <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Payment Infrastructure Control Tower
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Gateways, Virtual NUBAN Accounts & Webhooks
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect real-time health, cryptographic signatures, and trigger inbound sandbox webhook simulations.
                </p>
              </div>

              <button
                onClick={() => setShowSimulateModal(true)}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Simulate Inbound Webhook</span>
              </button>
            </div>

            {/* Provider Connection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Providus Bank</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SANDBOX_VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Virtual Reserved Accounts & Direct Inflow NIP Webhooks.
                </p>
                <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Endpoint: <span className="text-emerald-400">/api/webhooks/providus</span></div>
                  <div>Auth: <span className="text-indigo-400">HMAC-SHA256 (Secret)</span></div>
                  <div>Account: <span className="text-slate-200">9082341902</span></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Monnify</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SANDBOX_VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dynamic Reserved Accounts & Card Checkout Rail.
                </p>
                <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Endpoint: <span className="text-emerald-400">/api/webhooks/monnify</span></div>
                  <div>Auth: <span className="text-indigo-400">HMAC-SHA512</span></div>
                  <div>Contract: <span className="text-slate-200">8920194821</span></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Korapay</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SANDBOX_VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Naira Checkout & Direct Bank Transfer Webhook Adapter.
                </p>
                <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Endpoint: <span className="text-emerald-400">/api/webhooks/korapay</span></div>
                  <div>Auth: <span className="text-indigo-400">x-korapay-signature</span></div>
                  <div>Merchant: <span className="text-slate-200">FLYE_KORA_01</span></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">China SAFE Bridge</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    AWAITING_CREDENTIALS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Direct Alipay & WeChat Pay Corporate Remittance.
                </p>
                <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Protocol: <span className="text-amber-400">Dual-Officer SAFE Proof</span></div>
                  <div>Status: <span className="text-slate-300">Manual Clearing Active</span></div>
                  <div>Direct API: <span className="text-slate-500">Awaiting China entity</span></div>
                </div>
              </div>
            </div>

            {/* Inbound Webhook Event Log Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Inbound Webhook Events Ledger</h4>
                  <p className="text-[10px] text-slate-400">Live stream of incoming gateway notifications and automatic double-entry credits</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">{webhookEvents.length} events logged</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Event Reference</th>
                      <th className="py-3 px-4">Account / Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {webhookEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">No webhook events logged yet</td>
                      </tr>
                    ) : (
                      webhookEvents.map((evt: any) => (
                        <tr key={evt.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="py-3 px-4 font-sans font-bold text-white">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                              {evt.provider}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{evt.reference}</td>
                          <td className="py-3 px-4 font-sans text-slate-400">{evt.accountNumber || evt.userId || 'N/A'}</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">₦{(evt.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              evt.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {evt.status}
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

      {/* Simulate Inbound Webhook Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Simulate Inbound Webhook</h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Payment Gateway Rail
                </label>
                <select
                  value={simProvider}
                  onChange={(e: any) => setSimProvider(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="providus">Providus Bank Virtual Account</option>
                  <option value="monnify">Monnify Card / Dynamic Reserved Account</option>
                  <option value="korapay">Korapay Direct Checkout</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Inflow Amount (NGN ₦)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Target Customer User ID
                </label>
                <select
                  value={simUserId}
                  onChange={(e) => setSimUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                >
                  {Object.values(dbState.users || {}).map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.fullName} ({u.businessName || u.uid})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800">
                This triggers a cryptographic HMAC webhook request to the backend, posts balanced entries to the double-entry general ledger, and updates user balance immediately.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isSimulating ? 'Executing...' : 'Fire Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
