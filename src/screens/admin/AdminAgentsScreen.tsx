import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { AgentRequestDocument, Supplier, AgentServiceKind } from '../../types';
import { VETTED_SUPPLIERS } from '../../data/mockData';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  FileText,
  DollarSign,
  Send,
  Plus,
  Star,
  ShieldAlert,
  X,
  ChevronRight,
  ExternalLink,
  Search,
  Truck,
  RotateCcw,
  Check,
  AlertTriangle,
  Settings,
  ClipboardList,
  Eye,
  Camera,
  Layers,
  FileCheck
} from 'lucide-react';

interface AdminAgentsScreenProps {
  initialTab?: 'rfqs' | 'settings';
}

export const AdminAgentsScreen: React.FC<AdminAgentsScreenProps> = ({ initialTab = 'rfqs' }) => {
  const { showToast, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'rfqs' | 'settings'>(initialTab);
  const [rfqs, setRfqs] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(VETTED_SUPPLIERS);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Manage Request Drawer State
  const [manageDrawerRfq, setManageDrawerRfq] = useState<AgentRequestDocument | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quotation Modal State
  const [quoteModalRfq, setQuoteModalRfq] = useState<AgentRequestDocument | null>(null);
  const [quoteCostCNY, setQuoteCostCNY] = useState('');
  const [quoteCommPercent, setQuoteCommPercent] = useState('5.0');
  const [quoteShippingCNY, setQuoteShippingCNY] = useState('120');
  const [quoteServiceFeeUSD, setQuoteServiceFeeUSD] = useState('250');
  const [quoteLeadDays, setQuoteLeadDays] = useState('7');
  const [quoteAgentName, setQuoteAgentName] = useState('Zhang Wei (Bilingual Ground Agent)');
  const [quoteFindings, setQuoteFindings] = useState('Manufacturer verified on 1688 with Gold Supplier status (5 years). Production capacity confirmed.');
  const [quoteNotes, setQuoteNotes] = useState('Formal quotation includes FlyeMass QA check and Guangzhou hub consolidation.');
  const [quoteSupplierName, setQuoteSupplierName] = useState('');
  const [quoteDocUrl, setQuoteDocUrl] = useState('');
  const [fxOverrideUSD_CNY, setFxOverrideUSD_CNY] = useState('');
  const [fxOverrideUSD_NGN, setFxOverrideUSD_NGN] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState<'USD' | 'NGN' | 'RMB'>('USD');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Operations Progress Drawer State
  const [opsDrawerRfq, setOpsDrawerRfq] = useState<AgentRequestDocument | null>(null);
  const [opsNotes, setOpsNotes] = useState('');
  const [opsPurchaseDetails, setOpsPurchaseDetails] = useState('');
  const [opsInvoiceUrl, setOpsInvoiceUrl] = useState('');
  const [opsRegFindings, setOpsRegFindings] = useState('');
  const [opsAuditFindings, setOpsAuditFindings] = useState('');
  const [opsQcFindings, setOpsQcFindings] = useState('');
  const [opsReportPdfUrl, setOpsReportPdfUrl] = useState('');
  const [opsReportSummary, setOpsReportSummary] = useState('');
  const [isSavingOps, setIsSavingOps] = useState(false);

  // Assign Agent Modal State
  const [assignModalRfq, setAssignModalRfq] = useState<AgentRequestDocument | null>(null);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('Zhang Wei (Guangzhou Sourcing & Escort Desk)');
  const [assignNotes, setAssignNotes] = useState('Assigned for on-site mission coordination.');
  const [isAssigningAgent, setIsAssigningAgent] = useState(false);

  // Client Communication Modal State
  const [communicateModalRfq, setCommunicateModalRfq] = useState<AgentRequestDocument | null>(null);
  const [clientMessage, setClientMessage] = useState('');
  const [clientMessageStatus, setClientMessageStatus] = useState('in_progress');
  const [isSendingClientMessage, setIsSendingClientMessage] = useState(false);

  // Cancellation & Refund Modal State
  const [refundModalRfq, setRefundModalRfq] = useState<AgentRequestDocument | null>(null);
  const [refundReason, setRefundReason] = useState('Supplier failed physical factory audit criteria.');
  const [forceOverride, setForceOverride] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Fee Settings State
  const [feeSettings, setFeeSettings] = useState<any>({
    sourcingCommissionPercent: 5.0,
    minSourcingFeeEnabled: true,
    minSourcingCommissionCNY: 500,
    supplierVerificationUSD: 150,
    factoryAuditUSD: 250,
    qualityControlUSD: 200
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Register Supplier Modal State
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('Foshan Nanhai Precision Aluminum Extrusions');
  const [newSupZh, setNewSupZh] = useState('佛山市南海精工铝业实业有限公司');
  const [newSupCity, setNewSupCity] = useState('Foshan');
  const [newSupCategory, setNewSupCategory] = useState('Industrial & Building Materials');
  const [newSupBadge, setNewSupBadge] = useState<Supplier['badge']>('Factory Direct');
  const [newSupMinOrder, setNewSupMinOrder] = useState('¥10,000 (~$1,380)');

  useEffect(() => {
    db.getAgentSettings().then(setFeeSettings).catch(() => {});
    return db.subscribe(() => {
      const nextRfqs = db.getAgentRequests();
      setRfqs((prev) => {
        if (
          prev.length === nextRfqs.length &&
          prev.every((r, i) => r.id === nextRfqs[i]?.id && r.status === nextRfqs[i]?.status && r.paymentStatus === nextRfqs[i]?.paymentStatus)
        ) {
          return prev;
        }
        return nextRfqs;
      });
    });
  }, []);

  // Filtered RFQs
  const filteredRfqs = rfqs.filter(r => {
    // Status filter
    if (statusFilter !== 'all') {
      if ((statusFilter === 'pending_review' || statusFilter === 'Pending Review') && r.status !== 'pending_review' && r.status !== 'pending_quote' && r.status !== 'submitted') return false;
      if ((statusFilter === 'quotation_sent' || statusFilter === 'awaiting_payment' || statusFilter === 'Quotation Sent') && r.status !== 'awaiting_payment' && r.status !== 'quote_ready' && r.status !== 'quotation_sent') return false;
      if ((statusFilter === 'in_progress' || statusFilter === 'paid_active' || statusFilter === 'approved' || statusFilter === 'Approved') && r.status !== 'in_progress' && r.status !== 'paid_active' && r.status !== 'approved') return false;
      if ((statusFilter === 'completed' || statusFilter === 'Completed') && r.status !== 'completed') return false;
      if (statusFilter === 'refunded' && r.status !== 'refunded' && r.paymentStatus !== 'refunded') return false;
    }
    // Service filter
    if (serviceFilter !== 'all') {
      if (r.serviceKind !== serviceFilter) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ref = (r.reference || r.id).toLowerCase();
      const pName = (r.productName || '').toLowerCase();
      const cName = (r.clientName || '').toLowerCase();
      const sName = (r.supplierName || '').toLowerCase();
      if (!ref.includes(q) && !pName.includes(q) && !cName.includes(q) && !sName.includes(q)) return false;
    }
    return true;
  });

  // Metrics
  const totalCount = rfqs.length;
  const pendingCount = rfqs.filter(r => r.status === 'pending_review' || r.status === 'pending_quote' || r.status === 'submitted').length;
  const awaitingPaymentCount = rfqs.filter(r => r.status === 'awaiting_payment' || r.status === 'quote_ready' || r.status === 'quotation_sent').length;
  const inProgressCount = rfqs.filter(r => r.status === 'in_progress' || r.status === 'paid_active' || r.status === 'approved').length;
  const completedCount = rfqs.filter(r => r.status === 'completed').length;
  const totalQuotedValueUSD = rfqs.reduce((acc, r) => acc + (r.quoteAmountUSD || 0), 0);

  // Populate Quotation Form
  const openQuoteModal = (rfq: AgentRequestDocument) => {
    setQuoteModalRfq(rfq);
    if (rfq.serviceKind === 'sourcing') {
      const estCost = rfq.totalBudgetCNY ? Math.round(rfq.totalBudgetCNY * 0.95) : ((rfq.targetQuantity || 100) * (rfq.targetUnitCNY || 45));
      setQuoteCostCNY(String(rfq.productCostCNY || estCost));
      setQuoteCommPercent(String(rfq.sourcingCommissionPercent || feeSettings.sourcingCommissionPercent || 5.0));
      setQuoteShippingCNY(String(rfq.chinaShippingCNY || 120));
      setQuoteLeadDays(String(rfq.leadTimeDays || 7));
      setFxOverrideUSD_CNY(rfq.fxOverrideUSD_CNY ? String(rfq.fxOverrideUSD_CNY) : '');
      setFxOverrideUSD_NGN(rfq.fxOverrideUSD_NGN ? String(rfq.fxOverrideUSD_NGN) : '');
    } else {
      const defaultFee = rfq.serviceFeeUSD || rfq.quoteAmountUSD || (rfq.serviceKind === 'supplier_verification' ? feeSettings.supplierVerificationUSD : rfq.serviceKind === 'factory_audit' ? feeSettings.factoryAuditUSD : feeSettings.qualityControlUSD || 250);
      setQuoteServiceFeeUSD(String(defaultFee));
      setQuoteLeadDays(String(rfq.leadTimeDays || 3));
      setFxOverrideUSD_CNY('');
      setFxOverrideUSD_NGN('');
    }
    setQuoteCurrency('USD');
    setQuoteAgentName(rfq.assignedAgent || 'Zhang Wei (Guangzhou Sourcing Desk)');
    setQuoteFindings(rfq.supplierFindings || 'Direct manufacturer identified and preliminary catalog reviewed.');
    setQuoteNotes(rfq.adminNotes || 'Quotation formulated according to client specifications.');
    setQuoteSupplierName(rfq.supplierName || 'Shenzhen TopPower Electronics Co., Ltd');
    setQuoteDocUrl(rfq.supplierInvoiceUrl || '');
  };

  // Submit Official Quotation
  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalRfq) return;
    setIsSubmittingQuote(true);

    try {
      const isSourcing = quoteModalRfq.serviceKind === 'sourcing';
      let payload: any = {
        requestId: quoteModalRfq.id,
        supplierName: quoteSupplierName.trim() || undefined,
        supplierInvoiceUrl: quoteDocUrl.trim() || undefined,
        assignedAgent: quoteAgentName,
        supplierFindings: quoteFindings,
        quotationNotes: quoteNotes,
        leadTimeDays: parseInt(quoteLeadDays) || 7,
        adminId: 'adm-001'
      };

      if (isSourcing) {
        const costCNY = parseFloat(quoteCostCNY) || 0;
        const commPct = parseFloat(quoteCommPercent) || 5.0;
        const rawComm = Math.round(costCNY * (commPct / 100));
        const minCNY = feeSettings.minSourcingCommissionCNY || 500;
        const commCNY = (feeSettings.minSourcingFeeEnabled !== false) ? Math.max(minCNY, rawComm) : rawComm;
        const shipCNY = parseFloat(quoteShippingCNY) || 0;
        const totalCNY = costCNY + commCNY + shipCNY;

        const rateUSD_CNY = parseFloat(fxOverrideUSD_CNY) || 7.24;
        const rateUSD_NGN = parseFloat(fxOverrideUSD_NGN) || 1485;
        const totalUSD = Math.round((totalCNY / rateUSD_CNY) * 100) / 100;
        const totalNGN = Math.round(totalUSD * rateUSD_NGN);

        payload = {
          ...payload,
          productCostCNY: costCNY,
          sourcingCommissionPercent: commPct,
          sourcingCommissionCNY: commCNY,
          chinaShippingCNY: shipCNY,
          totalPayableCNY: totalCNY,
          quoteAmountCNY: totalCNY,
          quoteAmountUSD: totalUSD,
          quoteAmountNGN: totalNGN,
          quoteFeeUSD: totalUSD,
          quoteFeeNGN: totalNGN,
          quoteFeeRMB: totalCNY,
          quoteCurrency: 'RMB'
        };
        if (fxOverrideUSD_CNY) payload.fxOverrideUSD_CNY = parseFloat(fxOverrideUSD_CNY);
        if (fxOverrideUSD_NGN) payload.fxOverrideUSD_NGN = parseFloat(fxOverrideUSD_NGN);
      } else {
        let feeUSD = parseFloat(quoteServiceFeeUSD) || 250;
        let feeNGN = Math.round(feeUSD * 1485);
        let feeCNY = Math.round(feeUSD * 7.24);

        if (quoteCurrency === 'NGN') {
          feeNGN = parseFloat(quoteServiceFeeUSD) || 371250;
          feeUSD = Math.round((feeNGN / 1485) * 100) / 100;
          feeCNY = Math.round((feeUSD * 7.24) * 100) / 100;
        } else if (quoteCurrency === 'RMB') {
          feeCNY = parseFloat(quoteServiceFeeUSD) || 1810;
          feeUSD = Math.round((feeCNY / 7.24) * 100) / 100;
          feeNGN = Math.round(feeUSD * 1485);
        }

        payload = {
          ...payload,
          serviceFeeUSD: feeUSD,
          quoteAmountUSD: feeUSD,
          quoteAmountNGN: feeNGN,
          quoteAmountCNY: feeCNY,
          quoteFeeUSD: feeUSD,
          quoteFeeNGN: feeNGN,
          quoteFeeRMB: feeCNY,
          quoteCurrency,
          totalPayableCNY: feeCNY
        };
      }

      await db.quoteAgentRequest(quoteModalRfq.id, payload);
      showToast(`Official quotation issued to ${quoteModalRfq.clientName}!`, 'success');
      setQuoteModalRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to issue quotation', 'error');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Open Operations Progress Drawer
  const openOpsDrawer = (rfq: AgentRequestDocument) => {
    setOpsDrawerRfq(rfq);
    setOpsNotes(rfq.operationalNotes || '');
    setOpsPurchaseDetails(rfq.purchaseDetails || '');
    setOpsInvoiceUrl(rfq.supplierInvoiceUrl || '');
    setOpsRegFindings(rfq.businessRegistrationFindings || '');
    setOpsAuditFindings(rfq.factoryAuditFindings || '');
    setOpsQcFindings(rfq.qualityControlFindings || '');
    setOpsReportPdfUrl(rfq.inspectionReportUrl || '');
    setOpsReportSummary(rfq.reportSummary || '');
  };

  // Save Operations Progress
  const handleSaveOpsProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opsDrawerRfq) return;
    setIsSavingOps(true);

    try {
      await db.updateAgentStatus(opsDrawerRfq.id, {
        operationalNotes: opsNotes,
        purchaseDetails: opsPurchaseDetails || undefined,
        supplierInvoiceUrl: opsInvoiceUrl || undefined,
        businessRegistrationFindings: opsRegFindings || undefined,
        factoryAuditFindings: opsAuditFindings || undefined,
        qualityControlFindings: opsQcFindings || undefined,
        inspectionReportUrl: opsReportPdfUrl || undefined,
        reportSummary: opsReportSummary || undefined
      }, 'adm-001');

      showToast(`Milestone update and deliverables saved for #${opsDrawerRfq.reference || opsDrawerRfq.id}!`, 'success');
      setOpsDrawerRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsSavingOps(false);
    }
  };

  // Assign Agent Handler
  const openAssignModal = (rfq: AgentRequestDocument) => {
    setAssignModalRfq(rfq);
    setSelectedAgentToAssign(rfq.assignedAgent || 'Zhang Wei (Guangzhou Sourcing & Escort Desk)');
    setAssignNotes('Assigned for on-site mission coordination.');
  };

  const handleConfirmAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalRfq) return;
    setIsAssigningAgent(true);
    try {
      await db.assignAgent(assignModalRfq.id, selectedAgentToAssign, assignNotes, `${assignModalRfq.supplierCity || 'Guangzhou'} Trade Desk`, 'adm-001');
      showToast(`Agent ${selectedAgentToAssign} assigned to request #${assignModalRfq.reference || assignModalRfq.id}!`, 'success');
      setAssignModalRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to assign agent', 'error');
    } finally {
      setIsAssigningAgent(false);
    }
  };

  // Communicate Client Update Handler
  const openCommunicateModal = (rfq: AgentRequestDocument) => {
    setCommunicateModalRfq(rfq);
    setClientMessage(`Ground agent has initiated verification in ${rfq.supplierCity || 'Guangzhou'}. Next checkpoint expected within 24 hours.`);
    setClientMessageStatus(rfq.status || 'in_progress');
  };

  const handleSendClientUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communicateModalRfq) return;
    setIsSendingClientMessage(true);
    try {
      await db.sendAgentClientUpdate(
        communicateModalRfq.id,
        clientMessage,
        clientMessageStatus,
        `${communicateModalRfq.supplierCity || 'Guangzhou'} Ground Desk`,
        undefined,
        undefined,
        'adm-001'
      );
      showToast(`Client update sent for #${communicateModalRfq.reference || communicateModalRfq.id}!`, 'success');
      setCommunicateModalRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to send client update', 'error');
    } finally {
      setIsSendingClientMessage(false);
    }
  };

  // Complete Request & Disburse Escrow
  const handleCompleteRequest = async () => {
    if (!opsDrawerRfq) return;
    try {
      await db.completeAgentRequest(
        opsDrawerRfq.id,
        opsNotes || 'Ground inspection and factory audit completed successfully. Verified deliverables filed.',
        'adm-001'
      );
      showToast(`Request #${opsDrawerRfq.reference || opsDrawerRfq.id} completed & escrow disbursed to revenue!`, 'success');
      setOpsDrawerRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to complete request', 'error');
    }
  };

  // Execute Refund
  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalRfq) return;
    setIsProcessingRefund(true);

    try {
      const res = await db.refundAgentRequest(refundModalRfq.id, refundReason, 'adm-001', forceOverride);
      showToast(`Request refunded! ${res.refundAmount} ${res.refundCurrency} returned to client wallet.`, 'success');
      setRefundModalRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to execute refund', 'error');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await db.updateAgentSettings(feeSettings, 'adm-001');
      showToast('Agent fee & commission settings updated across platform!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Register Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName,
      chineseName: newSupZh,
      category: newSupCategory,
      city: newSupCity,
      badge: newSupBadge,
      rating: 4.9,
      ordersFulfilled: 0,
      minOrderValue: newSupMinOrder,
      verifiedYears: 1,
      mainProducts: ['Custom Hardware', 'Wholesale OEM Parts'],
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      inspectionPassed: true
    };

    try {
      await db.createSupplier(newSup, 'adm-001');
      setSuppliersList(prev => [newSup, ...prev]);
      setShowAddSupplier(false);
      showToast(`Supplier ${newSup.name} registered and published!`, 'success');
    } catch (err: any) {
      setSuppliersList(prev => [newSup, ...prev]);
      setShowAddSupplier(false);
      showToast(`Supplier ${newSup.name} added to directory!`, 'success');
    }
  };

  return (
    <AdminLayout activeTab="agents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">China Ground Trade Sourcing & Inspections</h1>
            <p className="text-xs text-slate-400">
              Manage 1688 sourcing requests, supplier legitimacy audits, pre-shipment AQL QA, and double-entry escrow disbursement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab('rfqs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rfqs' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Requests ({rfqs.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'settings' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Fees & Commission</span>
              </button>
              <button
                onClick={() => navigate('admin-suppliers')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-amber-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                title="Go to VIP Suppliers Directory"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>VIP Suppliers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Operational Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Requests</span>
            <span className="text-xl font-black text-white font-mono mt-1 block">{totalCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">Pending Review</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{pendingCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <span className="text-[10px] font-bold uppercase text-indigo-400 block">Awaiting Payment</span>
            <span className="text-xl font-black text-indigo-400 font-mono mt-1 block">{awaitingPaymentCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30">
            <span className="text-[10px] font-bold uppercase text-teal-400 block">In Progress</span>
            <span className="text-xl font-black text-teal-400 font-mono mt-1 block">{inProgressCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block">Completed</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{completedCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Quoted Value</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
              ${totalQuotedValueUSD.toLocaleString()}
            </span>
          </div>
        </div>

        {/* TAB 1: RFQs & AGENT SOURCING TABLE */}
        {activeTab === 'rfqs' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by AGT reference, client, product..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="quotation_sent">Quotation Sent</option>
                  <option value="awaiting_payment">Awaiting Payment</option>
                  <option value="in_progress">Approved / Paid & Active</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                </select>

                {/* Service Type Filter */}
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                >
                  <option value="all">All Services</option>
                  <option value="sourcing">Product Sourcing</option>
                  <option value="supplier_verification">Supplier Verification</option>
                  <option value="factory_audit">Factory Audit</option>
                  <option value="quality_control">Quality Control</option>
                  <option value="canton_fair_escort">Canton Fair Escort</option>
                </select>
              </div>
            </div>

            {/* RFQ List */}
            <div className="space-y-3">
              {filteredRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">{rfq.reference || rfq.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                          {rfq.serviceType}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          rfq.status === 'refunded' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {rfq.status === 'completed' ? 'Completed' :
                           rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent' ? 'Quotation Sent' :
                           rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved' ? 'Paid & Active' :
                           rfq.status === 'pending_review' || rfq.status === 'submitted' || rfq.status === 'pending_quote' ? 'Pending Review' :
                           rfq.status.replace('_', ' ')}
                        </span>
                        {rfq.paymentStatus && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-900/40">
                            Escrow: {rfq.paymentStatus}
                          </span>
                        )}
                        {rfq.assignedAgent && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-400 text-[10px] font-bold border border-indigo-900/40 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{rfq.assignedAgent}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white pt-1">{rfq.productName}</h4>
                      <p className="text-xs text-slate-400">
                        Client: <strong className="text-white">{rfq.clientName || 'Chief Babatunde Alade'}</strong>
                        {rfq.targetQuantity && (
                          <span> • Target Qty: <strong className="font-mono text-slate-200">{rfq.targetQuantity} units</strong></span>
                        )}
                        {rfq.targetUnitCNY && (
                          <span> @ <strong className="font-mono text-slate-200">¥{rfq.targetUnitCNY} CNY/unit</strong></span>
                        )}
                        {rfq.supplierCity && (
                          <span> • City: <strong className="text-slate-200">{rfq.supplierCity}</strong></span>
                        )}
                        {rfq.cantonFairBooth && (
                          <span> • Booth: <strong className="text-amber-400 font-mono">{rfq.cantonFairBooth}</strong></span>
                        )}
                      </p>

                      {/* Product URL */}
                      {rfq.productUrl && (
                        <p className="text-xs text-indigo-400 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <a href={rfq.productUrl} target="_blank" rel="noreferrer" className="hover:underline max-w-md truncate">
                            {rfq.productUrl}
                          </a>
                        </p>
                      )}

                      {/* Specifications */}
                      {rfq.specifications && (
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          <strong className="text-slate-400">Specifications:</strong> {rfq.specifications}
                        </p>
                      )}

                      {/* Reference Photos Thumbnails */}
                      {((rfq.referencePhotos && rfq.referencePhotos.length > 0) || (rfq.sampleImages && rfq.sampleImages.length > 0)) && (
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Photos:</span>
                          {(rfq.referencePhotos || rfq.sampleImages || []).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`ref-${i}`}
                              onClick={() => setPreviewImage(img)}
                              className="w-9 h-9 object-cover rounded-lg border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      {/* Negotiated Factory Partner */}
                      {rfq.supplierName && (
                        <p className="text-xs text-slate-300">
                          <strong className="text-slate-400">Negotiated Factory:</strong> <span className="text-white font-semibold">{rfq.supplierName}</span>
                        </p>
                      )}

                      {/* Official Quotation Proforma Link */}
                      {rfq.supplierInvoiceUrl && (
                        <p className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Proforma Sheet: </span>
                          <a href={rfq.supplierInvoiceUrl} target="_blank" rel="noreferrer" className="underline font-mono truncate max-w-sm">
                            {rfq.supplierInvoiceUrl}
                          </a>
                        </p>
                      )}

                      {/* Linked Cargo Shipment */}
                      {rfq.linkedShipmentCode && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs">
                          <Truck className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-indigo-300 font-bold">Auto-Linked Cargo Shipment:</span>
                          <span className="font-mono font-bold text-white">{rfq.linkedShipmentCode} ({rfq.linkedTrackingCode})</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary Pill */}
                    <div className="text-right">
                      {rfq.quoteAmountUSD ? (
                        <div>
                          <span className="text-sm font-black text-emerald-400 font-mono block">
                            {rfq.totalPayableCNY ? `¥${rfq.totalPayableCNY.toLocaleString()} CNY` : `$${rfq.quoteAmountUSD} USD`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ≈ ${rfq.quoteAmountUSD} USD / ₦{(rfq.quoteAmountNGN || rfq.quoteAmountUSD * 1485).toLocaleString()} NGN
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                          Awaiting Quote Formulation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ground Notes Preview if available */}
                  {(rfq.adminNotes || rfq.supplierFindings || rfq.operationalNotes || rfq.inspectionReportUrl) && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                      {rfq.supplierFindings && <p><strong className="text-slate-400">Findings:</strong> {rfq.supplierFindings}</p>}
                      {rfq.operationalNotes && <p><strong className="text-emerald-400">Milestone:</strong> {rfq.operationalNotes}</p>}
                      {rfq.inspectionReportUrl && (
                        <p className="flex items-center gap-1.5 text-cyan-400 font-medium">
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Report Attached: </span>
                          <a href={rfq.inspectionReportUrl} target="_blank" rel="noreferrer" className="underline font-mono truncate max-w-sm">
                            {rfq.inspectionReportUrl}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    {/* View / Manage Request Details */}
                    <button
                      onClick={() => setManageDrawerRfq(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage Details</span>
                    </button>

                    {/* Assign Agent */}
                    <button
                      onClick={() => openAssignModal(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>{rfq.assignedAgent ? 'Reassign Agent' : 'Assign Agent'}</span>
                    </button>

                    {/* Communicate Client Update */}
                    <button
                      onClick={() => openCommunicateModal(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Send Client Update</span>
                    </button>

                    {/* Formulate Quote */}
                    <button
                      onClick={() => openQuoteModal(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rfq.quoteAmountUSD ? 'Edit Quotation' : 'Formulate Quote'}</span>
                    </button>

                    {/* Update Operations Progress (Milestone updates & reports) */}
                    <button
                      onClick={() => openOpsDrawer(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Upload Reports & Deliverables</span>
                    </button>

                    {/* Cancel & Refund Action */}
                    {rfq.status !== 'refunded' && rfq.paymentStatus !== 'refunded' && (
                      <button
                        onClick={() => {
                          setRefundModalRfq(rfq);
                          setForceOverride(false);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel & Refund</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN FEE CONFIGURATION */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-extrabold text-white">Agent Fee & Commission Settings</h3>
              <p className="text-xs text-slate-400">
                Configure platform commissions, minimum thresholds, and fixed ground audit pricing.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Minimum Sourcing Fee Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Enforce Minimum Sourcing Commission</span>
                  <span className="text-[11px] text-slate-400 block">Apply minimum floor fee to low-value sourcing requests</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeeSettings({ ...feeSettings, minSourcingFeeEnabled: !(feeSettings.minSourcingFeeEnabled ?? true) })}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    (feeSettings.minSourcingFeeEnabled ?? true) ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      (feeSettings.minSourcingFeeEnabled ?? true) ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Sourcing Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={feeSettings.sourcingCommissionPercent}
                    onChange={(e) => setFeeSettings({ ...feeSettings, sourcingCommissionPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 5.0%</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Min. Sourcing Commission (¥ CNY)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.minSourcingCommissionCNY}
                    onChange={(e) => setFeeSettings({ ...feeSettings, minSourcingCommissionCNY: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: ¥500 CNY {(feeSettings.minSourcingFeeEnabled ?? true) ? '(Active)' : '(Disabled)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Supplier Verification ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.supplierVerificationUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, supplierVerificationUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: $150 USD</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Factory Audit ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.factoryAuditUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, factoryAuditUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: $250 USD</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Quality Control ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.qualityControlUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, qualityControlUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: $200 USD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isSavingSettings ? <span>Saving Settings...</span> : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Agent Fee Configuration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================== MODAL 1: FORMULATE OFFICIAL QUOTATION ===================== */}
      {quoteModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleSendQuote} 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {quoteModalRfq.reference || quoteModalRfq.id}
                </span>
                <h3 className="text-sm font-black text-white">Formulate Official Quotation</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Client & Product Info & Target Comparison */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <p><strong>Client:</strong> <span className="text-white font-semibold">{quoteModalRfq.clientName}</span></p>
                  <span className="text-[10px] font-mono font-bold text-slate-400">ID: {quoteModalRfq.userId}</span>
                </div>
                <p><strong>Assignment:</strong> <span className="text-white">{quoteModalRfq.productName}</span></p>
                {quoteModalRfq.serviceKind === 'sourcing' && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[9px]">Client Target Budget:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {quoteModalRfq.targetQuantity || 0} units @ ¥{quoteModalRfq.targetUnitCNY || 0} = ¥{((quoteModalRfq.targetQuantity || 0) * (quoteModalRfq.targetUnitCNY || 0)).toLocaleString()} CNY
                      </span>
                    </div>
                    {quoteModalRfq.specifications && (
                      <span className="text-slate-400 text-[10px] italic max-w-[200px] truncate">
                        Specs: {quoteModalRfq.specifications}
                      </span>
                    )}
                  </div>
                )}
                {quoteModalRfq.productUrl && (
                  <p className="truncate text-indigo-400 flex items-center gap-1 text-[11px]">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <a href={quoteModalRfq.productUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">{quoteModalRfq.productUrl}</a>
                  </p>
                )}

                {/* Client Reference Photos */}
                {((quoteModalRfq.referencePhotos && quoteModalRfq.referencePhotos.length > 0) || 
                  (quoteModalRfq.sampleImages && quoteModalRfq.sampleImages.length > 0)) && (
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Client Reference Photos</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(quoteModalRfq.referencePhotos || quoteModalRfq.sampleImages || []).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`ref-${i}`}
                          onClick={() => setPreviewImage(img)}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sourcing Breakdown Form */}
              {quoteModalRfq.serviceKind === 'sourcing' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Factory Product Cost (¥ CNY)
                      </label>
                      <input
                        type="number"
                        value={quoteCostCNY}
                        onChange={(e) => setQuoteCostCNY(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={quoteCommPercent}
                        onChange={(e) => setQuoteCommPercent(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        China Domestic Shipping (¥ CNY)
                      </label>
                      <input
                        type="number"
                        value={quoteShippingCNY}
                        onChange={(e) => setQuoteShippingCNY(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional FX Rate Overrides */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Optional FX Overrides (Blank = System Rates)</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">CNY per USD (Default: 7.24)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="7.24"
                          value={fxOverrideUSD_CNY}
                          onChange={(e) => setFxOverrideUSD_CNY(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">NGN per USD (Default: 1,485)</label>
                        <input
                          type="number"
                          step="1"
                          placeholder="1485"
                          value={fxOverrideUSD_NGN}
                          onChange={(e) => setFxOverrideUSD_NGN(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Totals Box */}
                  {(() => {
                    const c = parseFloat(quoteCostCNY) || 0;
                    const p = parseFloat(quoteCommPercent) || 5;
                    const rawComm = Math.round(c * (p / 100));
                    const min = feeSettings.minSourcingCommissionCNY || 500;
                    const comm = (feeSettings.minSourcingFeeEnabled !== false) ? Math.max(min, rawComm) : rawComm;
                    const s = parseFloat(quoteShippingCNY) || 0;
                    const total = c + comm + s;
                    const rateUSD_CNY = parseFloat(fxOverrideUSD_CNY) || 7.24;
                    const rateUSD_NGN = parseFloat(fxOverrideUSD_NGN) || 1485;
                    const totalUSD = Math.round((total / rateUSD_CNY) * 100) / 100;
                    const totalNGN = Math.round(totalUSD * rateUSD_NGN);
                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Client Payable:</span>
                          <span className="text-emerald-400 font-mono font-black text-sm">¥{total.toLocaleString()} CNY</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Commission: ¥{comm.toLocaleString()} CNY</span>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 font-mono">
                          <span className="text-white font-bold">≈ ${totalUSD.toLocaleString()} USD</span>
                          <span className="block text-slate-400">≈ ₦{totalNGN.toLocaleString()} NGN</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                      Select Quotation Fee Currency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['USD', 'NGN', 'RMB'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (quoteCurrency !== c) {
                              const currentVal = parseFloat(quoteServiceFeeUSD) || 0;
                              if (c === 'USD') {
                                const newUSD = quoteCurrency === 'NGN' ? Math.round((currentVal / 1485) * 100) / 100 : Math.round((currentVal / 7.24) * 100) / 100;
                                setQuoteServiceFeeUSD(String(newUSD || 250));
                              } else if (c === 'NGN') {
                                const newNGN = quoteCurrency === 'USD' ? Math.round(currentVal * 1485) : Math.round((currentVal / 7.24) * 1485);
                                setQuoteServiceFeeUSD(String(newNGN || 371250));
                              } else {
                                const newRMB = quoteCurrency === 'USD' ? Math.round(currentVal * 7.24) : Math.round((currentVal / 1485) * 7.24);
                                setQuoteServiceFeeUSD(String(newRMB || 1810));
                              }
                              setQuoteCurrency(c);
                            }
                          }}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            quoteCurrency === c
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {c === 'USD' ? '$ USD' : c === 'NGN' ? '₦ NGN' : '¥ RMB'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Official Service Fee ({quoteCurrency === 'USD' ? '$ USD' : quoteCurrency === 'NGN' ? '₦ NGN' : '¥ RMB'})
                      </label>
                      <input
                        type="number"
                        value={quoteServiceFeeUSD}
                        onChange={(e) => setQuoteServiceFeeUSD(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Cross-Currency Equivalents:</span>
                    <span className="text-emerald-400 font-bold">
                      {(() => {
                        const val = parseFloat(quoteServiceFeeUSD) || 0;
                        if (quoteCurrency === 'USD') {
                          return `≈ ₦${Math.round(val * 1485).toLocaleString()} NGN / ¥${Math.round(val * 7.24).toLocaleString()} RMB`;
                        } else if (quoteCurrency === 'NGN') {
                          const u = Math.round((val / 1485) * 100) / 100;
                          return `≈ $${u} USD / ¥${Math.round(u * 7.24).toLocaleString()} RMB`;
                        } else {
                          const u = Math.round((val / 7.24) * 100) / 100;
                          return `≈ $${u} USD / ₦${Math.round(u * 1485).toLocaleString()} NGN`;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Negotiated Manufacturer & Official Quotation Sheet */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Negotiated Manufacturer / Factory Partner
                  </label>
                  <input
                    type="text"
                    value={quoteSupplierName}
                    onChange={(e) => setQuoteSupplierName(e.target.value)}
                    placeholder="e.g. Shenzhen TopPower Co., Ltd"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Official Quotation Sheet / Proforma URL
                  </label>
                  <input
                    type="url"
                    value={quoteDocUrl}
                    onChange={(e) => setQuoteDocUrl(e.target.value)}
                    placeholder="https://docs.flyemass.com/quotes/proforma.pdf"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Inspector Notes & Findings */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Supplier Findings & Credential Verification
                </label>
                <textarea
                  value={quoteFindings}
                  onChange={(e) => setQuoteFindings(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Terms & Inspector Notes (Visible to Client)
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuote}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmittingQuote ? <span>Dispatching Quotation...</span> : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Issue Official Quotation to Client</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL 2: OPERATIONS PROGRESS & DELIVERABLES ===================== */}
      {opsDrawerRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleSaveOpsProgress} 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {opsDrawerRfq.reference || opsDrawerRfq.id}
                </span>
                <h3 className="text-sm font-black text-white">China Ground Operations & Deliverables</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpsDrawerRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Linked Shipment Notice */}
              {opsDrawerRfq.linkedShipmentCode && (
                <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase">Linked FlyeMass Waybill</span>
                      <span className="font-mono font-bold text-white">{opsDrawerRfq.linkedShipmentCode}</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px]">Tracked</span>
                </div>
              )}

              {/* Sourcing Specific: Purchase details & Supplier Invoice */}
              {opsDrawerRfq.serviceKind === 'sourcing' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      1688 / Vendor Order ID & Purchase Details
                    </label>
                    <input
                      type="text"
                      value={opsPurchaseDetails}
                      onChange={(e) => setOpsPurchaseDetails(e.target.value)}
                      placeholder="e.g. 1688 Order #338190284419 • Shenzhen Factory Direct"
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      Supplier Commercial Invoice URL
                    </label>
                    <input
                      type="url"
                      value={opsInvoiceUrl}
                      onChange={(e) => setOpsInvoiceUrl(e.target.value)}
                      placeholder="https://flyemass.cn/invoices/inv-..."
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* Inspection Specific: Verification, Factory Audit, QC */}
              {opsDrawerRfq.serviceKind === 'supplier_verification' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Business Registration Findings & Legitimacy Status
                  </label>
                  <textarea
                    value={opsRegFindings}
                    onChange={(e) => setOpsRegFindings(e.target.value)}
                    rows={2}
                    placeholder="Unified Social Credit Code: 91440101MA59XXXXXX • Legal Representative confirmed active"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {opsDrawerRfq.serviceKind === 'factory_audit' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    On-Site Factory Audit Findings & Machinery Check
                  </label>
                  <textarea
                    value={opsAuditFindings}
                    onChange={(e) => setOpsAuditFindings(e.target.value)}
                    rows={2}
                    placeholder="3 production lines active. ISO9001 verified on wall. Capacity: 5,000 units/day."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {opsDrawerRfq.serviceKind === 'quality_control' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    AQL Sampling & Defect Rate Findings
                  </label>
                  <textarea
                    value={opsQcFindings}
                    onChange={(e) => setOpsQcFindings(e.target.value)}
                    rows={2}
                    placeholder="Level II Sampling (80 units tested). Defect rate: 0.8% (PASS). Packaging intact."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Inspection Report PDF URL */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Deliverable PDF Report URL (agent-uploads)
                </label>
                <input
                  type="url"
                  value={opsReportPdfUrl}
                  onChange={(e) => setOpsReportPdfUrl(e.target.value)}
                  placeholder="https://flyemass.cn/reports/audit-report-2026.pdf"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              {/* Inspection Report Executive Summary */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Inspection Report Executive Summary
                </label>
                <textarea
                  value={opsReportSummary}
                  onChange={(e) => setOpsReportSummary(e.target.value)}
                  rows={2}
                  placeholder="Factory inspection successfully passed all structural and machinery criteria. Official certificate issued."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Operational Progress Log */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Ground Milestone Update (Sent as Customer Notification)
                </label>
                <textarea
                  value={opsNotes}
                  onChange={(e) => setOpsNotes(e.target.value)}
                  rows={2}
                  placeholder="Goods arrived at Guangzhou Baiyun clearing hub. Inspection checklist completed."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingOps}
                  className="w-1/2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Milestone & Deliverables</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRequest}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed & Disburse Escrow</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: ASSIGN GROUND AGENT ===================== */}
      {assignModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleConfirmAssignAgent}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>Assign Ground Sourcing Agent</span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
                <p><strong>Request Ref:</strong> <span className="font-mono text-emerald-400">{assignModalRfq.reference || assignModalRfq.id}</span></p>
                <p><strong>Assignment:</strong> {assignModalRfq.productName}</p>
                <p><strong>Client:</strong> {assignModalRfq.clientName}</p>
                <p><strong>Location:</strong> {assignModalRfq.supplierCity || 'Guangzhou'}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Select Verified Ground Agent
                </label>
                <select
                  value={selectedAgentToAssign}
                  onChange={(e) => setSelectedAgentToAssign(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-purple-500 text-xs"
                >
                  <option value="Zhang Wei (Guangzhou Sourcing & Escort Desk)">Zhang Wei (Guangzhou Sourcing & Escort Desk)</option>
                  <option value="Chen Tao (Foshan Machinery & Hardware Inspector)">Chen Tao (Foshan Machinery & Hardware Inspector)</option>
                  <option value="Lin Xiaomei (Shenzhen Electronics & Tech Specialist)">Lin Xiaomei (Shenzhen Electronics & Tech Specialist)</option>
                  <option value="Wang Jing (Yiwu Small Commodities & QC Agent)">Wang Jing (Yiwu Small Commodities & QC Agent)</option>
                  <option value="Canton Fair Bilingual Escort Squad">Canton Fair Bilingual Escort Squad (Pazhou Complex)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Custom Agent Name / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Special instructions or field deployment notes..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isAssigningAgent}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAssigningAgent ? <span>Assigning Agent...</span> : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Confirm Agent Assignment & Notify Client</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: COMMUNICATE CLIENT UPDATE ===================== */}
      {communicateModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleSendClientUpdate}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Communicate Update to Client</span>
              </div>
              <button
                type="button"
                onClick={() => setCommunicateModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
                <p><strong>Recipient:</strong> <span className="text-white font-semibold">{communicateModalRfq.clientName}</span> ({communicateModalRfq.userId})</p>
                <p><strong>Request Ref:</strong> <span className="font-mono text-emerald-400">{communicateModalRfq.reference || communicateModalRfq.id}</span></p>
                <p><strong>Service:</strong> {communicateModalRfq.serviceType}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Operational Progress Message
                </label>
                <textarea
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  rows={3}
                  placeholder="Type real-time ground progress, booth visit details, factory audit notes..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Progress Milestone Stage
                </label>
                <select
                  value={clientMessageStatus}
                  onChange={(e) => setClientMessageStatus(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="in_progress">In Progress (Agent On-Site)</option>
                  <option value="factory_visited">Factory / Booth Visited</option>
                  <option value="samples_collected">Samples Collected & Evaluated</option>
                  <option value="report_ready">Inspection Report Formulated</option>
                  <option value="completed">Mission Complete</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSendingClientMessage}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSendingClientMessage ? <span>Sending Update...</span> : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Update & Push Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL 3: CANCELLATION & REFUND ===================== */}
      {refundModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleExecuteRefund} 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel & Refund Agent Request</span>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-slate-300 space-y-1">
                <p><strong>Request Ref:</strong> <span className="font-mono text-rose-300">{refundModalRfq.reference || refundModalRfq.id}</span></p>
                <p><strong>Client:</strong> {refundModalRfq.clientName}</p>
                {refundModalRfq.paidAmount && (
                  <p><strong>Paid Escrow:</strong> <span className="font-mono font-bold text-emerald-400">{refundModalRfq.paidAmount} {refundModalRfq.paidWith}</span></p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Reason for Cancellation & Reversal
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-rose-500 text-xs"
                  required
                />
              </div>

              {refundModalRfq.status === 'completed' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <input
                    type="checkbox"
                    id="forceOverride"
                    checked={forceOverride}
                    onChange={(e) => setForceOverride(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="forceOverride" className="text-[11px] font-semibold cursor-pointer">
                    Supervisor Authorization Override (Request marked completed)
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingRefund}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessingRefund ? <span>Executing Reversal...</span> : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Authorize Full Escrow Reversal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL 5: MANAGE REQUEST DRAWER ===================== */}
      {manageDrawerRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {manageDrawerRfq.reference || manageDrawerRfq.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                      {manageDrawerRfq.serviceType || manageDrawerRfq.serviceKind}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      manageDrawerRfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      manageDrawerRfq.status === 'awaiting_payment' || manageDrawerRfq.status === 'quote_ready' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      manageDrawerRfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' :
                      manageDrawerRfq.status === 'refunded' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {manageDrawerRfq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">Sourcing Request Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setManageDrawerRfq(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Information</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Client Name:</span>
                    <strong className="text-white text-xs">{manageDrawerRfq.clientName || 'Chief Babatunde Alade'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Customer ID:</span>
                    <span className="font-mono text-slate-300 text-xs">{manageDrawerRfq.userId || 'usr_alade_01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Contact Email:</span>
                    <span className="text-slate-300 text-xs">{manageDrawerRfq.clientEmail || 'alade.investments@flyemass.ng'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Submission Date:</span>
                    <span className="text-slate-300 text-xs">
                      {manageDrawerRfq.createdAt ? new Date(manageDrawerRfq.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Specifications Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested Product Specifications</span>
                <div>
                  <span className="text-slate-500 block text-[11px]">Product Title:</span>
                  <h4 className="text-white font-bold text-sm">{manageDrawerRfq.productName}</h4>
                </div>

                {manageDrawerRfq.specifications && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Detailed Specifications (Color, Size, Material, Packaging):</span>
                    <p className="text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800 mt-1 leading-relaxed">
                      {manageDrawerRfq.specifications}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Quantity</span>
                    <span className="font-mono font-bold text-white text-xs">{manageDrawerRfq.targetQuantity || 'N/A'} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Unit CNY</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">¥{manageDrawerRfq.targetUnitCNY || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Budget CNY</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      ¥{((manageDrawerRfq.targetQuantity || 0) * (manageDrawerRfq.targetUnitCNY || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Sourcing Link */}
                {manageDrawerRfq.productUrl && (
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Chinese Supplier / Marketplace Link:</span>
                    <a
                      href={manageDrawerRfq.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 hover:text-white transition-all text-xs break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{manageDrawerRfq.productUrl}</span>
                    </a>
                  </div>
                )}

                {/* Reference Photos Gallery */}
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1.5">Customer Reference Photos:</span>
                  {(() => {
                    const photos = (manageDrawerRfq.referencePhotos && manageDrawerRfq.referencePhotos.length > 0)
                      ? manageDrawerRfq.referencePhotos
                      : (manageDrawerRfq.sampleImages || []);
                    if (photos.length === 0) {
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                          No reference photos attached to this request.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {photos.map((imgUrl: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500 group cursor-pointer"
                          >
                            <img src={imgUrl} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quotation Breakdown Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Quotation Breakdown</span>
                {manageDrawerRfq.quoteAmountUSD ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Factory Cost</span>
                        <span className="font-mono font-bold text-white text-xs">¥{manageDrawerRfq.productCostCNY || 0} CNY</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Commission ({manageDrawerRfq.sourcingCommissionPercent || 5}%)</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">¥{manageDrawerRfq.sourcingCommissionCNY || 0} CNY</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">China Domestic Freight</span>
                        <span className="font-mono font-bold text-white text-xs">¥{manageDrawerRfq.chinaShippingCNY || 0} CNY</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold block uppercase">Grand Total Payable</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          ¥{manageDrawerRfq.totalPayableCNY?.toLocaleString()} CNY
                        </span>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-300">
                        <span>≈ ${manageDrawerRfq.quoteAmountUSD} USD</span>
                        <span className="block text-slate-400">≈ ₦{manageDrawerRfq.quoteAmountNGN?.toLocaleString()} NGN</span>
                      </div>
                    </div>
                    {manageDrawerRfq.supplierFindings && (
                      <p className="text-slate-300 text-xs">
                        <strong className="text-slate-400">Ground Sourcing Findings:</strong> {manageDrawerRfq.supplierFindings}
                      </p>
                    )}
                    {manageDrawerRfq.adminNotes && (
                      <p className="text-slate-300 text-xs">
                        <strong className="text-slate-400">Quotation Terms:</strong> {manageDrawerRfq.adminNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    Pending quote formulation. Use the quote builder below to calculate factory pricing and dispatch quotation to customer.
                  </div>
                )}
              </div>

              {/* Escrow Payment Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wallet Payment & Escrow Liability</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Escrow Status:</span>
                    <span className="font-bold text-white uppercase text-xs">{manageDrawerRfq.paymentStatus || 'unpaid'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Paid Amount:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {manageDrawerRfq.paidAmount ? `${manageDrawerRfq.paidAmount.toLocaleString()} ${manageDrawerRfq.paidWith}` : 'None'}
                    </span>
                  </div>
                  {manageDrawerRfq.paymentReference && (
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px]">Transaction Reference:</span>
                      <span className="font-mono text-indigo-300 text-xs">{manageDrawerRfq.paymentReference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Cargo Waybill Card */}
              {manageDrawerRfq.linkedShipmentCode && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Truck className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">Linked Logistics Cargo Shipment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Waybill Tracking:</span>
                      <strong className="font-mono text-white text-xs">{manageDrawerRfq.linkedShipmentCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">China Local Tracking:</span>
                      <strong className="font-mono text-white text-xs">{manageDrawerRfq.linkedTrackingCode || 'SF-EXPRESS'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Current Status:</span>
                      <span className="font-bold text-emerald-400 text-xs uppercase">
                        {manageDrawerRfq.linkedShipmentStatus || 'received_warehouse'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  openQuoteModal(manageDrawerRfq);
                  setManageDrawerRfq(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{manageDrawerRfq.quoteAmountUSD ? 'Edit Quotation' : 'Formulate Quote'}</span>
              </button>

              <button
                onClick={() => {
                  openOpsDrawer(manageDrawerRfq);
                  setManageDrawerRfq(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Update Progress</span>
              </button>

              {manageDrawerRfq.status !== 'refunded' && manageDrawerRfq.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => {
                    setRefundModalRfq(manageDrawerRfq);
                    setForceOverride(false);
                    setManageDrawerRfq(null);
                  }}
                  className="py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel / Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6: IMAGE LIGHTBOX PREVIEW ===================== */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImage} alt="Reference Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showAddSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleCreateSupplier} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Register Verified Chinese Supplier</h3>
              <button
                type="button"
                onClick={() => setShowAddSupplier(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Chinese Legal Name (中文名)</label>
                <input
                  type="text"
                  value={newSupZh}
                  onChange={(e) => setNewSupZh(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-chinese"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">City Hub</label>
                  <input
                    type="text"
                    value={newSupCity}
                    onChange={(e) => setNewSupCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Badge</label>
                  <select
                    value={newSupBadge}
                    onChange={(e) => setNewSupBadge(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="Canton Fair VIP">Canton Fair VIP</option>
                    <option value="Factory Direct">Factory Direct</option>
                    <option value="Gold Manufacturer">Gold Manufacturer</option>
                    <option value="Verified Escrow">Verified Escrow</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Register & Publish to Sourcing Directory
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};
