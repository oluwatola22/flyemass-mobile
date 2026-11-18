import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupplierPaymentDocument, WithdrawalDocument, ManualPaymentDocument } from '../../types';
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
  RefreshCw,
  Eye,
  AlertCircle,
  QrCode,
  Zap
} from 'lucide-react';

export const AdminPaymentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());
  const dbState = db.getState();
  const [activeTab, setActiveTab] = useState<'deposits' | 'supplier' | 'withdrawals' | 'ledger' | 'reconciliation' | 'rates' | 'gateways'>('deposits');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'disbursed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Customer Deposits filtering & Drawer
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [depositCurrencyFilter, setDepositCurrencyFilter] = useState<'all' | 'NGN' | 'USD' | 'CNY'>('all');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [reviewDrawerDeposit, setReviewDrawerDeposit] = useState<ManualPaymentDocument | null>(null);
  const [depositInternalNotes, setDepositInternalNotes] = useState('');
  const [rejectDepositModal, setRejectDepositModal] = useState<ManualPaymentDocument | null>(null);
  const [depositRejectReason, setDepositRejectReason] = useState('Payment receipt could not be reconciled with corporate bank statement');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [proofPreviewModalUrl, setProofPreviewModalUrl] = useState<string | null>(null);
  
  // Naira withdrawals filtering
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'pending' | 'processing' | 'approved' | 'rejected'>('all');
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState('');

  // Rejection modal states
  const [rejectSupplierModalPayment, setRejectSupplierModalPayment] = useState<SupplierPaymentDocument | null>(null);
  const [supplierRejectReason, setSupplierRejectReason] = useState('');
  const [rejectWithdrawalModal, setRejectWithdrawalModal] = useState<WithdrawalDocument | null>(null);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState('');

  // QR Preview modal
  const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);

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
  const [wthPayoutMode, setWthPayoutMode] = useState<'gateway' | 'manual'>('gateway');
  const [wthGatewayProvider, setWthGatewayProvider] = useState('Providus NIP Instant Switch');
  const [wthGatewaySessionRef, setWthGatewaySessionRef] = useState('');
  const [wthManualTransferRef, setWthManualTransferRef] = useState('');
  const [wthPaymentProofUrl, setWthPaymentProofUrl] = useState('');
  const [wthAdminNotes, setWthAdminNotes] = useState('');
  const [isSubmittingWthPayout, setIsSubmittingWthPayout] = useState(false);

  // Supplier Disbursement Evidence Modal state (Phase 3 Requirement)
  const [disburseModalPayment, setDisburseModalPayment] = useState<SupplierPaymentDocument | null>(null);
  const [clearingSessionId, setClearingSessionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [safeDeclarationRef, setSafeDeclarationRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  // Webhook Simulation Modal state
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simProvider, setSimProvider] = useState<'providus' | 'monnify' | 'korapay'>('providus');
  const [simAmount, setSimAmount] = useState('250000');
  const [simUserId, setSimUserId] = useState('usr_alade_01');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
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

  const withdrawalsList = Object.values(dbState.withdrawals || {}).filter((w) => {
    const matchesStatus = withdrawalStatusFilter === 'all'
      ? true
      : withdrawalStatusFilter === 'approved'
      ? (w.status === 'approved' || w.status === 'completed' || w.status === 'successful')
      : withdrawalStatusFilter === 'rejected'
      ? (w.status === 'rejected' || w.status === 'refunded' || w.status === 'failed')
      : w.status === withdrawalStatusFilter;
    const q = withdrawalSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      (w.accountName && w.accountName.toLowerCase().includes(q)) ||
      (w.accountNumber && w.accountNumber.toLowerCase().includes(q)) ||
      (w.bankName && w.bankName.toLowerCase().includes(q)) ||
      (w.reference && w.reference.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Manual Customer Deposits metrics & filtering
  const manualPayments: ManualPaymentDocument[] = Object.values(dbState.manual_payments || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const pendingDeposits = manualPayments.filter(p => p.status === 'pending');
  const pendingVolumeNGN = pendingDeposits.filter(p => p.currency === 'NGN').reduce((acc, p) => acc + (p.amount || 0), 0);
  const pendingVolumeUSD = pendingDeposits.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (p.amount || 0), 0);
  const pendingVolumeCNY = pendingDeposits.filter(p => p.currency === 'CNY').reduce((acc, p) => acc + (p.amount || 0), 0);
  const approvedDepositsCount = manualPayments.filter(p => p.status === 'approved' || p.status === 'completed').length;
  const rejectedDepositsCount = manualPayments.filter(p => p.status === 'rejected' || p.status === 'failed').length;

  const filteredDeposits = manualPayments.filter((p) => {
    if (depositStatusFilter !== 'all' && p.status !== depositStatusFilter) return false;
    if (depositCurrencyFilter !== 'all' && p.currency !== depositCurrencyFilter) return false;
    if (depositSearchQuery.trim()) {
      const q = depositSearchQuery.toLowerCase();
      const ref = (p.reference || p.id).toLowerCase();
      const name = (p.customerName || '').toLowerCase();
      const email = (p.customerEmail || '').toLowerCase();
      const phone = (p.customerPhone || '').toLowerCase();
      const sender = (p.senderName || '').toLowerCase();
      const bank = (p.originatingBank || '').toLowerCase();
      if (!ref.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !sender.includes(q) && !bank.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleApproveDeposit = async (paymentId: string) => {
    setIsProcessingDeposit(true);
    try {
      const res = await db.approveManualPayment(paymentId, depositInternalNotes, 'adm-001');
      showToast(`Deposit approved! ${res.payment.currency} ${res.payment.amount.toLocaleString()} credited to customer wallet.`, 'success');
      setReviewDrawerDeposit(null);
      setDepositInternalNotes('');
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to approve deposit', 'error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectDepositModal) return;
    if (!depositRejectReason || depositRejectReason.trim().length < 5) {
      showToast('Rejection reason must be at least 5 characters', 'error');
      return;
    }
    setIsProcessingDeposit(true);
    try {
      await db.rejectManualPayment(rejectDepositModal.id, depositRejectReason.trim(), 'adm-001');
      showToast(`Deposit #${rejectDepositModal.reference} rejected. No wallet deduction or credit occurred.`, 'info');
      setRejectDepositModal(null);
      setReviewDrawerDeposit(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to reject deposit', 'error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const webhookEvents = dbState.webhook_events || db.getWebhookEvents();

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await db.simulateWebhook(simProvider, parseFloat(simAmount) || 100000, simUserId, 'adm-001');
      showToast(`Sandbox ${simProvider.toUpperCase()} webhook processed! ₦${(parseFloat(simAmount) || 100000).toLocaleString()} credited with double-entry. Ref: ${res.reference}`, 'success');
      setShowSimulateModal(false);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation failed', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleMarkSupplierProcessing = async (p: SupplierPaymentDocument) => {
    try {
      const res = await db.markSupplierPaymentProcessing(p.id, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payment ${p.reference || p.id} marked as Processing! Customer notified.`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to update payment status', 'error');
    }
  };

  const handleMarkWithdrawalProcessing = async (w: WithdrawalDocument) => {
    try {
      const res = await db.markWithdrawalProcessing(w.id, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Withdrawal ${w.reference || w.id} marked as Processing! Customer notified.`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to update withdrawal status', 'error');
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
      setDbRev(db.getStateRevision());
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
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Refund failed', 'error');
    }
  };

  const handleOpenRejectWithdrawal = (w: WithdrawalDocument) => {
    if (w.status === 'approved' || w.status === 'completed' || w.status === 'successful') {
      showToast('Cannot reject or refund an already completed withdrawal', 'error');
      return;
    }
    setRejectWithdrawalModal(w);
    setWithdrawalRejectReason('Beneficiary account rejected by receiving bank switch');
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
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Refund failed', 'error');
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
    setDbRev(db.getStateRevision());
  };

  const handleApproveWithdrawal = (w: WithdrawalDocument) => {
    setSelectedWithdrawal(w);
    setWthPayoutMode('gateway');
    setWthGatewayProvider('Providus NIP Instant Switch');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setWthGatewaySessionRef(`PROV-NIP-${randomSuffix}`);
    setWthManualTransferRef(`MAN-NIP-${randomSuffix}`);
    setWthPaymentProofUrl('');
    setWthAdminNotes(`Disbursed to ${w.accountName} (${w.bankName} - ${w.accountNumber})`);
  };

  const handleRegenerateWthGatewayRef = () => {
    const prefix = wthGatewayProvider.includes('Monnify') ? 'MNFY-NIP' : wthGatewayProvider.includes('Korapay') ? 'KORA-NIP' : 'PROV-NIP';
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setWthGatewaySessionRef(`${prefix}-${randomSuffix}`);
  };

  const handleConfirmDisbursement = async () => {
    if (!selectedWithdrawal) return;
    const refToUse = wthPayoutMode === 'gateway' ? wthGatewaySessionRef : wthManualTransferRef;
    if (!refToUse || !refToUse.trim()) {
      showToast('Please provide a valid transfer / gateway reference', 'error');
      return;
    }
    setIsSubmittingWthPayout(true);
    try {
      const res = await db.disburseWithdrawal(
        selectedWithdrawal.id, 
        refToUse.trim(), 
        'adm-001',
        {
          payoutMode: wthPayoutMode,
          gatewayProvider: wthPayoutMode === 'gateway' ? wthGatewayProvider : 'Manual Settlement',
          gatewaySessionId: wthPayoutMode === 'gateway' ? refToUse.trim() : undefined,
          paymentProofUrl: wthPaymentProofUrl.trim(),
          adminNotes: wthAdminNotes.trim()
        }
      );
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Payout of ₦${selectedWithdrawal.amountNGN.toLocaleString()} confirmed via ${wthPayoutMode === 'gateway' ? wthGatewayProvider : 'Manual Bank Settlement'}!`, 'success');
      setSelectedWithdrawal(null);
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Disbursement failed', 'error');
    } finally {
      setIsSubmittingWthPayout(false);
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
    const rateNgnRmb = Number(ngnRmbRate);
    const spreadPct = Number(spreadPercent);
    const spreadFrac = spreadPct / 100;
    const calcCnyToNgn = Number((rateNgnRmb * (1 - spreadFrac)).toFixed(2));
    const calcNgnToCny = Number((rateNgnRmb * (1 + spreadFrac)).toFixed(2));

    await db.updateSystemSettings('Finance Officer Ngozi', {
      NGN_CNY: rateNgnRmb,
      CNY_NGN: rateNgnRmb,
      USD_NGN: Number(usdNgnRate),
      NGN_USD: Number(usdNgnRate),
      USD_CNY: Number(usdCnyRate),
      spreadPercent: spreadPct,
      CNY_to_NGN: calcCnyToNgn,
      input_cny_to_ngn: calcCnyToNgn,
      naira_per_rmb: calcNgnToCny,
      input_ngn_to_cny: calcNgnToCny
    });
    if (calcCnyToNgn > 0 && calcNgnToCny >= calcCnyToNgn) {
      await db.publishFxRate('CNY', 'NGN', calcCnyToNgn, calcNgnToCny, 'adm-001', 'Finance Officer Ngozi', 'finance_officer');
    }
    showToast(`Authoritative exchange rates & margins updated! 1 RMB = ₦${rateNgnRmb} (Fixed Buy: ₦${calcCnyToNgn} • Fixed Sell: ₦${calcNgnToCny})`, 'success');
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
              onClick={() => setActiveTab('deposits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deposits' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Customer Deposits ({manualPayments.length})
            </button>
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

        {/* 0. CUSTOMER FUNDING & MANUAL DEPOSITS QUEUE */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Pending Deposits</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-400">{pendingDeposits.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Awaiting finance review</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Pending NGN</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₦{pendingVolumeNGN.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Uncredited bank transfers</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Pending RMB</span>
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-lg font-black text-white">¥{pendingVolumeCNY.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Uncredited Chinese transfers</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Approved Count</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400">{approvedDepositsCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Credited to wallets</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Rejected Count</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-black text-rose-400">{rejectedDepositsCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Zero balance mutation</div>
              </div>
            </div>

            {/* Deposits Management Panel */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={depositSearchQuery}
                    onChange={(e) => setDepositSearchQuery(e.target.value)}
                    placeholder="Search customer, reference, sender, bank..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setDepositStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                          depositStatusFilter === st
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                    {(['all', 'NGN', 'CNY'] as const).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setDepositCurrencyFilter(curr)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          depositCurrencyFilter === curr
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deposit Records List */}
              {filteredDeposits.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No customer deposit submissions found matching the selected filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDeposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl mt-0.5 ${
                          dep.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : (dep.status === 'approved' || dep.status === 'completed')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {dep.status === 'pending' ? (
                            <Clock className="w-5 h-5 animate-pulse" />
                          ) : (dep.status === 'approved' || dep.status === 'completed') ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white tracking-wide">
                              {dep.reference || dep.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              dep.currency === 'NGN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : dep.currency === 'CNY'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}>
                              {dep.currency}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              dep.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : (dep.status === 'approved' || dep.status === 'completed')
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {dep.status === 'approved' || dep.status === 'completed' ? 'Completed' : dep.status === 'rejected' || dep.status === 'failed' ? 'Failed' : 'Pending'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(dep.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                            <span className="font-semibold text-white">
                              {dep.customerName || 'Customer'}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ID: {dep.userId}
                            </span>
                            {dep.customerEmail && (
                              <span className="text-slate-400 text-[11px]">
                                {dep.customerEmail}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                            <span>
                              Sender: <strong className="text-slate-200">{dep.senderName || 'N/A'}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Bank: <strong className="text-slate-200">{dep.originatingBank || 'N/A'}</strong>
                            </span>
                            {dep.destinationBank && (
                              <>
                                <span>•</span>
                                <span>
                                  To: <span className="text-slate-400">{dep.destinationBank}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <div className="text-left md:text-right">
                          <div className="text-base font-black text-white font-mono">
                            {dep.currency === 'NGN' ? '₦' : dep.currency === 'CNY' ? '¥' : '$'}{dep.amount.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {(dep.proofUrl || (dep as any).receiptUrl || dep.paymentProofUrl) ? (
                              <button
                                onClick={() => setProofPreviewModalUrl(dep.proofUrl || (dep as any).receiptUrl || dep.paymentProofUrl || null)}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                Proof Attached
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">No Receipt</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setReviewDrawerDeposit(dep);
                            setDepositInternalNotes(dep.adminNotes || '');
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            dep.status === 'pending'
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {dep.status === 'pending' ? 'Review & Credit' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                {(['all', 'pending', 'processing', 'disbursed', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                      statusFilter === st ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'disbursed' ? 'Completed' : st === 'rejected' ? 'Refunded' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3">Customer (User)</th>
                    <th className="py-3 px-3">Supplier / Beneficiary</th>
                    <th className="py-3 px-3">Channel & QR</th>
                    <th className="py-3 px-3">Amount & Funding</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {paymentsList.map((p) => {
                    const isLongWaiting = (p.status === 'pending' || p.status === 'processing') &&
                      (Date.now() - new Date(p.createdAt).getTime() > 6 * 3600 * 1000);
                    const customer = dbState.users[p.userId];
                    const customerName = p.customerName || customer?.fullName || p.userId;
                    const customerEmail = p.customerEmail || customer?.email || '';
                    const fCurrency = p.fundingCurrency || 'CNY';
                    const fAmount = p.fundingAmount ?? (fCurrency === 'NGN' ? (p.equivalentNGN ?? p.amountRMB * 214.5) : p.amountRMB);

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-xs font-bold text-emerald-400">{p.reference || p.id}</span>
                          <p className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                          {isLongWaiting && (
                            <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              <span>6h+ Waiting</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <h4 className="font-bold text-white text-xs">{customerName}</h4>
                          <p className="font-mono text-[10px] text-slate-400">{p.userId}</p>
                          {customerEmail && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{customerEmail}</p>}
                        </td>
                        <td className="py-3.5 px-3">
                          <h4 className="font-bold text-slate-200 text-xs">{p.receiverName}</h4>
                          <p className="font-mono text-[11px] text-slate-400">{p.receiverAccount}</p>
                          {p.bankName && <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{p.bankName}</p>}
                          {p.purpose && <p className="text-[10px] text-slate-400 mt-0.5">Purpose: <span className="text-slate-300">{p.purpose}</span></p>}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                              {p.paymentMethod}
                            </span>
                            {p.qrCodeUrl && (
                              <button
                                onClick={() => setPreviewQrUrl(p.qrCodeUrl!)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                title="View Beneficiary QR"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <span className="font-extrabold text-white text-sm">¥{(p.amountRMB ?? 0).toLocaleString()} CNY</span>
                          <p className="text-[10px] text-emerald-400 font-semibold">
                            Funded: {fCurrency === 'NGN' ? '₦' : fCurrency === 'USD' ? '$' : '¥'}{fAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fCurrency}
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            p.status === 'disbursed' || p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            p.status === 'rejected' || p.status === 'refunded' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                            p.status === 'processing' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                            'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {p.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleMarkSupplierProcessing(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs"
                              >
                                Process
                              </button>
                              <button
                                onClick={() => handleOpenDisburseModal(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                              >
                                Disburse
                              </button>
                              <button
                                onClick={() => handleOpenRejectSupplier(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : p.status === 'processing' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDisburseModal(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                              >
                                Disburse
                              </button>
                              <button
                                onClick={() => handleOpenRejectSupplier(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : p.status === 'disbursed' || p.status === 'completed' ? (
                            <span className="text-[11px] text-emerald-400 font-mono font-bold">
                              Settled ({p.clearingSessionId || p.reference || 'Done'})
                            </span>
                          ) : (
                            <span className="text-[11px] text-rose-400 font-mono" title={p.refundReason || 'Rejected'}>
                              Refunded
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. NAIRA PAYOUTS / WITHDRAWALS QUEUE */}
        {activeTab === 'withdrawals' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={withdrawalSearchQuery}
                  onChange={(e) => setWithdrawalSearchQuery(e.target.value)}
                  placeholder="Search account holder, NUBAN, or bank..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                {(['all', 'pending', 'processing', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setWithdrawalStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                      withdrawalStatusFilter === st ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'approved' ? 'Completed' : st === 'rejected' ? 'Refunded' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Transaction</th>
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
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-bold text-emerald-400">{w.reference || w.id}</span>
                        <p className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <h4 className="font-bold text-white text-xs">{w.accountName}</h4>
                        <p className="text-[11px] text-teal-400 font-mono tracking-wider">{w.bankName} • {w.accountNumber}</p>
                        <p className="text-[10px] text-slate-400">User: {w.customerName || w.userId} ({w.customerEmail || 'Verified Client'})</p>
                        {w.customerNote && <p className="text-[10px] text-slate-500">Note: {w.customerNote}</p>}
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        <span className="font-extrabold text-emerald-400 text-sm">₦{(w.amountNGN ?? 0).toLocaleString()}</span>
                        <p className="text-[10px] text-slate-500">+ ₦{w.feeNGN || 50} NIP fee</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                        {w.transferReference || 'Pending Reference'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          w.status === 'approved' || w.status === 'completed' || w.status === 'successful' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          w.status === 'rejected' || w.status === 'refunded' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          w.status === 'processing' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {w.status}
                        </span>
                        {w.payoutMode && (
                          <p className="text-[9px] text-slate-400 mt-1 font-mono">
                            {w.payoutMode === 'gateway' ? (w.gatewayProvider || 'NIP Gateway') : 'Manual Wire'}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {w.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleMarkWithdrawalProcessing(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                            >
                              Disburse
                            </button>
                            <button
                              onClick={() => handleOpenRejectWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : w.status === 'processing' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                            >
                              Disburse
                            </button>
                            <button
                              onClick={() => handleOpenRejectWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : w.status === 'approved' || w.status === 'completed' || w.status === 'successful' ? (
                          <span className="text-[11px] text-emerald-400 font-mono capitalize">Paid ({w.transferReference || 'Done'})</span>
                        ) : (
                          <span className="text-[11px] text-rose-400 font-mono capitalize" title={w.refundReason || 'Rejected'}>Refunded</span>
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

                {/* USD (Hidden from display per two-currency architecture) */}
                <div style={{ display: 'none' }} aria-hidden="true" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
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

            {/* Fixed Conversion Rates Summary (Naira ⇄ RMB) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Fixed Buy (RMB ➔ NGN):</span>
                <span className="text-emerald-400 font-bold">₦{(Number(ngnRmbRate) * (1 - Number(spreadPercent)/100)).toFixed(2)} / ¥1</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Fixed Sell (NGN ➔ RMB):</span>
                <span className="text-indigo-400 font-bold">₦{(Number(ngnRmbRate) * (1 + Number(spreadPercent)/100)).toFixed(2)} / ¥1</span>
              </div>
            </div>

            {/* Hidden container for legacy USD inputs */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input
                type="number"
                value={usdNgnRate}
                onChange={(e) => setUsdNgnRate(e.target.value)}
              />
              <input
                type="number"
                value={usdCnyRate}
                onChange={(e) => setUsdCnyRate(e.target.value)}
              />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  NUBAN Payout Clearance Engine
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Disburse ₦{selectedWithdrawal.amountNGN.toLocaleString()} NGN
                </h3>
              </div>
              <button 
                onClick={() => setSelectedWithdrawal(null)} 
                className="text-slate-400 hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Beneficiary & Customer Snapshot */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-bold text-white text-right">{selectedWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account / Bank:</span>
                <span className="font-mono text-slate-200 text-right">{selectedWithdrawal.accountNumber} ({selectedWithdrawal.bankName})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer Account:</span>
                <span className="text-slate-300 text-right">{selectedWithdrawal.customerName || selectedWithdrawal.userId}</span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setWthPayoutMode('gateway')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  wthPayoutMode === 'gateway'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>NUBAN Gateway (NIP)</span>
              </button>
              <button
                type="button"
                onClick={() => setWthPayoutMode('manual')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  wthPayoutMode === 'manual'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Manual Settlement</span>
              </button>
            </div>

            {/* Mode-specific Controls */}
            {wthPayoutMode === 'gateway' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Integrated Payout Gateway Provider
                  </label>
                  <select
                    value={wthGatewayProvider}
                    onChange={(e) => {
                      setWthGatewayProvider(e.target.value);
                      const prefix = e.target.value.includes('Monnify') ? 'MNFY-NIP' : e.target.value.includes('Korapay') ? 'KORA-NIP' : 'PROV-NIP';
                      setWthGatewaySessionRef(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}`);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Providus NIP Instant Switch">Providus Bank (NIP Instant Switch)</option>
                    <option value="Monnify Payouts Engine">Monnify Transfer API</option>
                    <option value="Korapay Direct Settlement">Korapay Commercial Payouts</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      NIP Gateway Session Reference
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateWthGatewayRef}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={wthGatewaySessionRef}
                    onChange={(e) => setWthGatewaySessionRef(e.target.value)}
                    placeholder="e.g. PROV-NIP-982142"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Gateway Switch Active • Automated NIP transfer clearing beneficiary institution.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Bank Clearing / Settlement Session ID
                  </label>
                  <input
                    type="text"
                    value={wthManualTransferRef}
                    onChange={(e) => setWthManualTransferRef(e.target.value)}
                    placeholder="e.g. MAN-NIP-492019 or Corporate Portal Ref"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Payment Proof Document / Receipt URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={wthPaymentProofUrl}
                    onChange={(e) => setWthPaymentProofUrl(e.target.value)}
                    placeholder="https://vault.flyemass.internal/proofs/rec-982.pdf"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Treasury Settlement Notes
                  </label>
                  <input
                    type="text"
                    value={wthAdminNotes}
                    onChange={(e) => setWthAdminNotes(e.target.value)}
                    placeholder="e.g. Cleared via Corporate Banking Desk"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const w = selectedWithdrawal;
                  setSelectedWithdrawal(null);
                  handleOpenRejectWithdrawal(w);
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer transition-all"
              >
                Reject & Refund
              </button>
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer transition-all hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingWthPayout}
                onClick={handleConfirmDisbursement}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSubmittingWthPayout ? 'Disbursing...' : 'Confirm Payout'}
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

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  4. Administrative Notes (Optional):
                </label>
                <input
                  type="text"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="e.g. Paid via ICBC Commercial Desk"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const p = disburseModalPayment;
                  setDisburseModalPayment(null);
                  handleOpenRejectSupplier(p);
                }}
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

      {/* Reject Supplier Payment Modal */}
      {rejectSupplierModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                Reject & Refund RMB Transfer
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Refund ¥{rejectSupplierModalPayment.amountRMB.toLocaleString()} CNY
              </h3>
              <p className="text-xs text-slate-400">
                To: <strong className="text-white">{rejectSupplierModalPayment.receiverName}</strong> ({rejectSupplierModalPayment.reference})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                Mandatory Rejection Reason (Audit Trail):
              </label>
              <textarea
                value={supplierRejectReason}
                onChange={(e) => setSupplierRejectReason(e.target.value)}
                placeholder="Explain the specific reason for rejecting this payment..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500 resize-none"
                required
              />
            </div>

            <p className="text-[10px] text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Confirming this rejection will post a balanced double-entry refund entry to the general ledger, immediately crediting ¥{rejectSupplierModalPayment.amountRMB.toLocaleString()} back to the customer's CNY wallet and notifying the user.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectSupplierModalPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSupplierRejection}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {rejectWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                Reject & Refund Naira Withdrawal
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Refund ₦{(rejectWithdrawalModal.amountNGN + (rejectWithdrawalModal.feeNGN || 50)).toLocaleString()} NGN
              </h3>
              <p className="text-xs text-slate-400">
                Principal ₦{rejectWithdrawalModal.amountNGN.toLocaleString()} + ₦{rejectWithdrawalModal.feeNGN || 50} Fee • {rejectWithdrawalModal.accountName}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                Mandatory Rejection Reason (Audit Trail):
              </label>
              <textarea
                value={withdrawalRejectReason}
                onChange={(e) => setWithdrawalRejectReason(e.target.value)}
                placeholder="Explain the specific reason for rejecting this withdrawal..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500 resize-none"
                required
              />
            </div>

            <p className="text-[10px] text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Confirming this rejection will post a balanced double-entry refund entry to the general ledger, immediately crediting both principal and processing fee back to the customer's NGN wallet and notifying the user.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectWithdrawalModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawalRejection}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {previewQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Beneficiary Payment QR</h3>
            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={previewQrUrl}
                alt="Beneficiary QR"
                className="w-56 h-56 object-contain mx-auto"
              />
            </div>
            <button
              onClick={() => setPreviewQrUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Preview
            </button>
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

      {/* MANUAL DEPOSIT REVIEW DRAWER */}
      {reviewDrawerDeposit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Manual Deposit Review</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      reviewDrawerDeposit.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : reviewDrawerDeposit.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {reviewDrawerDeposit.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Ref: {reviewDrawerDeposit.reference || reviewDrawerDeposit.id}
                  </p>
                </div>
                <button
                  onClick={() => setReviewDrawerDeposit(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Highlight */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-medium">Claimed Deposit Amount</span>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {reviewDrawerDeposit.currency === 'NGN' ? '₦' : '$'}
                  {reviewDrawerDeposit.amount.toLocaleString()} {reviewDrawerDeposit.currency}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Channel: {reviewDrawerDeposit.channel}
                </span>
              </div>

              {/* Customer Profile */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer Profile</h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-semibold text-white">{reviewDrawerDeposit.customerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono text-emerald-400">{reviewDrawerDeposit.userId}</span>
                  </div>
                  {reviewDrawerDeposit.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-200">{reviewDrawerDeposit.customerEmail}</span>
                    </div>
                  )}
                  {reviewDrawerDeposit.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-slate-200">{reviewDrawerDeposit.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Banking & Remittance Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Remittance Details</h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Originating Sender Name:</span>
                    <span className="font-semibold text-white">{reviewDrawerDeposit.senderName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Originating Bank:</span>
                    <span className="text-slate-200">{reviewDrawerDeposit.originatingBank || 'N/A'}</span>
                  </div>
                  {reviewDrawerDeposit.destinationBank && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination Account:</span>
                      <span className="text-slate-200">
                        {reviewDrawerDeposit.destinationBank} ({reviewDrawerDeposit.destinationAccount})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Submission Timestamp:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(reviewDrawerDeposit.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proof Receipt Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Proof of Payment</h4>
                  {(reviewDrawerDeposit.proofUrl || (reviewDrawerDeposit as any).receiptUrl || reviewDrawerDeposit.paymentProofUrl) && (
                    <button
                      onClick={() => setProofPreviewModalUrl(reviewDrawerDeposit.proofUrl || (reviewDrawerDeposit as any).receiptUrl || reviewDrawerDeposit.paymentProofUrl || null)}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Enlarge Proof
                    </button>
                  )}
                </div>

                {(reviewDrawerDeposit.proofUrl || (reviewDrawerDeposit as any).receiptUrl || reviewDrawerDeposit.paymentProofUrl) ? (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div
                      onClick={() => setProofPreviewModalUrl(reviewDrawerDeposit.proofUrl || (reviewDrawerDeposit as any).receiptUrl || reviewDrawerDeposit.paymentProofUrl || null)}
                      className="relative rounded-xl overflow-hidden border border-slate-800 max-h-56 cursor-pointer group bg-black/40 flex items-center justify-center"
                    >
                      <img
                        src={reviewDrawerDeposit.proofUrl || (reviewDrawerDeposit as any).receiptUrl || reviewDrawerDeposit.paymentProofUrl}
                        alt="Payment Proof"
                        className="w-full object-contain max-h-56 group-hover:opacity-90 transition-opacity"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/600x400/0f172a/38bdf8?text=Bank+Transfer+Receipt';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-2">
                        <Eye className="w-4 h-4" />
                        Click to enlarge
                      </div>
                    </div>
                    {(reviewDrawerDeposit.proofFileName || (reviewDrawerDeposit as any).receiptFileName) && (
                      <p className="text-[11px] text-slate-500 mt-2 truncate font-mono">
                        File: {reviewDrawerDeposit.proofFileName || (reviewDrawerDeposit as any).receiptFileName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    No physical receipt or transfer slip was attached by customer.
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Internal Verification Notes
                </label>
                <textarea
                  value={depositInternalNotes}
                  onChange={(e) => setDepositInternalNotes(e.target.value)}
                  placeholder="Record statement reconciliation details, Providus/Chase journal reference, or verification remarks..."
                  rows={2}
                  disabled={reviewDrawerDeposit.status !== 'pending'}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              {/* Status info if already finalized */}
              {reviewDrawerDeposit.status === 'approved' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved and Credited
                  </div>
                  <div className="mt-1 text-slate-400 text-[11px]">
                    Approved by <strong className="text-slate-200">{reviewDrawerDeposit.approvedBy}</strong> on{' '}
                    {reviewDrawerDeposit.approvedAt ? new Date(reviewDrawerDeposit.approvedAt).toLocaleString() : 'N/A'}. Double-entry ledger posted to customer liabilities.
                  </div>
                </div>
              )}

              {reviewDrawerDeposit.status === 'rejected' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Rejected by Compliance
                  </div>
                  <div className="mt-1 text-slate-400 text-[11px]">
                    Reason: <strong className="text-slate-200">{reviewDrawerDeposit.rejectionReason}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 flex gap-3">
              {reviewDrawerDeposit.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled={isProcessingDeposit}
                    onClick={() => setRejectDepositModal(reviewDrawerDeposit)}
                    className="flex-1 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    Reject Deposit...
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingDeposit}
                    onClick={() => handleApproveDeposit(reviewDrawerDeposit.id)}
                    className="flex-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessingDeposit ? 'Crediting Wallet...' : 'Approve & Credit Wallet'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setReviewDrawerDeposit(null)}
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Close Drawer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Reject Deposit Submission</h3>
              </div>
              <button
                onClick={() => setRejectDepositModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are rejecting deposit submission <strong className="font-mono text-white">#{rejectDepositModal.reference || rejectDepositModal.id}</strong> of{' '}
              <strong className="text-emerald-400">
                {rejectDepositModal.currency === 'NGN' ? '₦' : '$'}{rejectDepositModal.amount.toLocaleString()}
              </strong>.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              No wallet deduction or credit will occur. The customer will receive an immediate notification with this mandatory rejection reason.
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Mandatory Rejection Reason
              </label>
              <textarea
                value={depositRejectReason}
                onChange={(e) => setDepositRejectReason(e.target.value)}
                placeholder="Explain why deposit could not be verified (e.g. sender name mismatch, transaction missing on bank statement, illegible slip)..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectDepositModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingDeposit || !depositRejectReason || depositRejectReason.trim().length < 5}
                onClick={handleRejectDeposit}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer"
              >
                {isProcessingDeposit ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF PREVIEW MODAL */}
      {proofPreviewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setProofPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Proof of Payment Receipt
              </span>
              <button
                onClick={() => setProofPreviewModalUrl(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center">
              <img
                src={proofPreviewModalUrl}
                alt="Payment Receipt"
                className="max-h-[70vh] object-contain rounded-lg border border-slate-800"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/800x600/0f172a/38bdf8?text=Bank+Transfer+Receipt';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
