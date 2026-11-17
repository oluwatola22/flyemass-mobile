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
  FileCheck,
  Award,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Factory,
  CheckCircle,
  FileSpreadsheet
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
      const specs = (r.specifications || '').toLowerCase();
      if (!ref.includes(q) && !pName.includes(q) && !cName.includes(q) && !sName.includes(q) && !specs.includes(q)) return false;
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
        {/* Top Header Command Strip */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111C2E] via-[#152238] to-[#111C2E] border border-[#293A52] shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                  China Ground Trade Sourcing & Inspections
                </h1>
                <p className="text-sm font-medium text-slate-300">
                  Live 1688 RFQ formulations, ground factory legitimacy audits, bilingual Canton Fair escort, and double-entry escrow disbursement.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B1220] border border-[#293A52]">
              <button
                onClick={() => setActiveTab('rfqs')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'rfqs' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Requests Queue ({rfqs.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Fees & Commission</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddSupplier(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Factory</span>
            </button>

            <button
              onClick={() => navigate('admin-suppliers')}
              className="px-4 py-2 rounded-xl bg-[#1B2A40] hover:bg-[#253954] border border-[#293A52] text-amber-300 hover:text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Go to VIP Suppliers Directory"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>VIP Suppliers</span>
            </button>
          </div>
        </div>

        {/* 6 High-Contrast Executive KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Requests */}
          <div className="p-4 rounded-xl bg-[#152238] border border-[#293A52] hover:border-indigo-500/50 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Missions</span>
              <ClipboardList className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{totalCount}</span>
              <span className="text-xs text-slate-400 font-semibold">Logged</span>
            </div>
          </div>

          {/* 2. Pending Review */}
          <div className="p-4 rounded-xl bg-[#152238] border border-amber-500/40 hover:border-amber-400 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300 font-mono">{pendingCount}</span>
              <span className="text-xs text-amber-400/80 font-semibold">Action Needed</span>
            </div>
          </div>

          {/* 3. Awaiting Payment / Quotation Sent */}
          <div className="p-4 rounded-xl bg-[#152238] border border-blue-500/40 hover:border-blue-400 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Quotation Sent</span>
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-300 font-mono">{awaitingPaymentCount}</span>
              <span className="text-xs text-blue-400/80 font-semibold">Proforma Out</span>
            </div>
          </div>

          {/* 4. In Progress / Paid & Active */}
          <div className="p-4 rounded-xl bg-[#152238] border border-indigo-500/40 hover:border-indigo-400 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Paid & Active</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-200 font-mono">{inProgressCount}</span>
              <span className="text-xs text-indigo-300/80 font-semibold">On Ground</span>
            </div>
          </div>

          {/* 5. Completed */}
          <div className="p-4 rounded-xl bg-[#152238] border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300 font-mono">{completedCount}</span>
              <span className="text-xs text-emerald-400/80 font-semibold">Settled</span>
            </div>
          </div>

          {/* 6. Total Quoted Value */}
          <div className="p-4 rounded-xl bg-[#152238] border border-[#293A52] hover:border-emerald-500/50 transition-all shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-emerald-400 font-mono block">
                ${totalQuotedValueUSD.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">USD Quoted</span>
            </div>
          </div>
        </div>

        {/* TAB 1: SOURCING REQUESTS & DIRECT FACTORY RFQS */}
        {activeTab === 'rfqs' && (
          <div className="space-y-5">
            {/* Search, Filter & Quick Status Hub */}
            <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#293A52] space-y-4 shadow-lg">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by AGT reference, client, product, factory, or specifications..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-[#293A52] text-white placeholder-slate-400 outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Statuses ({totalCount})</option>
                    <option value="pending_review">Pending Review ({pendingCount})</option>
                    <option value="quotation_sent">Quotation Sent ({awaitingPaymentCount})</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="in_progress">Approved / Paid & Active ({inProgressCount})</option>
                    <option value="completed">Completed ({completedCount})</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  {/* Service Type Filter */}
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Services</option>
                    <option value="sourcing">Product Sourcing & 1688</option>
                    <option value="supplier_verification">Supplier Verification</option>
                    <option value="factory_audit">Factory Audit</option>
                    <option value="quality_control">Quality Control (QC)</option>
                    <option value="canton_fair_escort">Canton Fair Escort</option>
                  </select>
                </div>
              </div>

              {/* Quick Status Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#22304A]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                  Quick Filter:
                </span>
                {[
                  { id: 'all', label: 'All Requests', count: totalCount },
                  { id: 'pending_review', label: 'Pending Review', count: pendingCount, color: 'text-amber-400' },
                  { id: 'quotation_sent', label: 'Quotation Sent', count: awaitingPaymentCount, color: 'text-blue-400' },
                  { id: 'in_progress', label: 'Paid & Active', count: inProgressCount, color: 'text-indigo-400' },
                  { id: 'completed', label: 'Completed', count: completedCount, color: 'text-emerald-400' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      statusFilter === chip.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                        : 'bg-[#0B1220] text-slate-300 hover:text-white border-[#293A52] hover:border-[#384F6E]'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      statusFilter === chip.id ? 'bg-white/20 text-white' : 'bg-[#152238] text-slate-300'
                    }`}>
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sourcing Requests Queue */}
            {filteredRfqs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#111C2E] border border-[#293A52] space-y-3">
                <Search className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Sourcing Missions Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  No sourcing requests match your search criteria or active filters. Try adjusting your search query or reset filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setServiceFilter('all'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRfqs.map((rfq) => {
                  const isCompleted = rfq.status === 'completed';
                  const isQuoted = rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent';
                  const isActive = rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved';
                  const isRefunded = rfq.status === 'refunded';
                  const isPending = !isCompleted && !isQuoted && !isActive && !isRefunded;

                  const photos = (rfq.referencePhotos && rfq.referencePhotos.length > 0)
                    ? rfq.referencePhotos
                    : (rfq.sampleImages || []);

                  return (
                    <div
                      key={rfq.id}
                      className="p-6 rounded-2xl bg-[#152238] border border-[#293A52] hover:border-indigo-500/40 transition-all space-y-4 shadow-xl"
                    >
                      {/* Card Header Strip */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-[#22304A]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Reference Code */}
                          <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/40">
                            {rfq.reference || rfq.id}
                          </span>

                          {/* Service Type Pill */}
                          <span className="px-3 py-1 rounded-lg bg-[#1B2A40] border border-[#293A52] text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <Factory className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{rfq.serviceType || rfq.serviceKind}</span>
                          </span>

                          {/* Status Badge */}
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            isQuoted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            isActive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                            isRefunded ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              isCompleted ? 'bg-emerald-400 animate-pulse' :
                              isQuoted ? 'bg-amber-400 animate-pulse' :
                              isActive ? 'bg-indigo-400 animate-pulse' :
                              isRefunded ? 'bg-rose-400' :
                              'bg-slate-400'
                            }`} />
                            <span>
                              {isCompleted ? 'Completed' :
                               isQuoted ? 'Quotation Sent' :
                               isActive ? 'Paid & Active' :
                               isPending ? 'Pending Review' :
                               rfq.status.replace('_', ' ')}
                            </span>
                          </span>

                          {/* Escrow Status Pill */}
                          {rfq.paymentStatus && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 text-xs font-mono font-bold border border-emerald-800/50">
                              Escrow: {rfq.paymentStatus}
                            </span>
                          )}

                          {/* Assigned Agent Pill */}
                          {rfq.assignedAgent && (
                            <span className="px-3 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 text-xs font-bold border border-indigo-800/50 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{rfq.assignedAgent}</span>
                            </span>
                          )}
                        </div>

                        {/* Submission Date & Client Profile */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0B1220] border border-[#293A52]">
                            <div className="w-5 h-5 rounded-full bg-indigo-600/50 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                              {(rfq.clientName || 'C')[0]}
                            </div>
                            <span className="text-xs font-bold text-white">
                              {rfq.clientName || 'Chief Babatunde Alade'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Main Card Grid: Product & Specifications vs. Financial & Ground Ops */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left Column: Sourcing Target & Product Specifications (7 cols) */}
                        <div className="lg:col-span-7 space-y-3.5">
                          {/* Product Title */}
                          <div>
                            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                              <span>{rfq.productName}</span>
                            </h3>
                          </div>

                          {/* Target Metrics Strip */}
                          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#0B1220] border border-[#22304A] text-xs">
                            {rfq.targetQuantity && (
                              <div className="px-2.5 py-1 rounded-lg bg-[#152238] border border-[#293A52]">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Qty</span>
                                <span className="font-mono font-bold text-white">{rfq.targetQuantity.toLocaleString()} units</span>
                              </div>
                            )}
                            {rfq.targetUnitCNY && (
                              <div className="px-2.5 py-1 rounded-lg bg-[#152238] border border-[#293A52]">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Unit CNY</span>
                                <span className="font-mono font-bold text-emerald-400">¥{rfq.targetUnitCNY}</span>
                              </div>
                            )}
                            {rfq.totalBudgetCNY && (
                              <div className="px-2.5 py-1 rounded-lg bg-[#152238] border border-[#293A52]">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Budget</span>
                                <span className="font-mono font-bold text-amber-400">¥{rfq.totalBudgetCNY.toLocaleString()} CNY</span>
                              </div>
                            )}
                            {rfq.supplierCity && (
                              <div className="px-2.5 py-1 rounded-lg bg-[#152238] border border-[#293A52] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">China Hub</span>
                                  <span className="font-semibold text-white">{rfq.supplierCity}</span>
                                </div>
                              </div>
                            )}
                            {rfq.cantonFairBooth && (
                              <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                <div>
                                  <span className="text-amber-400 block text-[10px] uppercase font-bold">Canton Booth</span>
                                  <span className="font-mono font-bold text-amber-300">{rfq.cantonFairBooth}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Client Specifications Box */}
                          {rfq.specifications && (
                            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Specifications</span>
                              </span>
                              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                                {rfq.specifications}
                              </p>
                            </div>
                          )}

                          {/* 1688 / Chinese Product URL */}
                          {rfq.productUrl && (
                            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="text-indigo-300 font-bold truncate">Supplier Link:</span>
                                <a
                                  href={rfq.productUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-white hover:underline truncate font-mono text-xs"
                                >
                                  {rfq.productUrl}
                                </a>
                              </div>
                              <a
                                href={rfq.productUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-white font-bold text-xs shrink-0 ml-2"
                              >
                                Open Link
                              </a>
                            </div>
                          )}

                          {/* Negotiated Manufacturer */}
                          {rfq.supplierName && (
                            <div className="p-2.5 rounded-xl bg-[#0B1220] border border-[#22304A] flex items-center gap-2 text-xs">
                              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-slate-400 font-bold">Negotiated Manufacturer / Factory Partner:</span>
                              <span className="text-white font-bold">{rfq.supplierName}</span>
                            </div>
                          )}

                          {/* Client Reference Photos Gallery */}
                          {photos.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Client Reference Photos ({photos.length})</span>
                              </span>
                              <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                                {photos.map((img, i) => (
                                  <div
                                    key={i}
                                    onClick={() => setPreviewImage(img)}
                                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#293A52] hover:border-emerald-500 cursor-pointer group shrink-0 transition-all shadow-sm"
                                  >
                                    <img src={img} alt={`ref-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Eye className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Commercial Quotation & Operations Status (5 cols) */}
                        <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Quotation Pricing Card */}
                            <div className="p-4 rounded-xl bg-[#111C2E] border border-[#293A52] space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                  Commercial Quotation
                                </span>
                                {rfq.quoteAmountUSD ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/40">
                                    Published Offer
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/40">
                                    Unquoted
                                  </span>
                                )}
                              </div>

                              {rfq.quoteAmountUSD ? (
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-2xl font-black text-emerald-400 font-mono block">
                                      {rfq.totalPayableCNY ? `¥${rfq.totalPayableCNY.toLocaleString()} CNY` : `$${rfq.quoteAmountUSD} USD`}
                                    </span>
                                    <span className="text-xs text-slate-300 font-mono font-medium block mt-0.5">
                                      ≈ ${rfq.quoteAmountUSD} USD · ₦{(rfq.quoteAmountNGN || rfq.quoteAmountUSD * 1485).toLocaleString()} NGN
                                    </span>
                                  </div>

                                  {/* Itemized pricing breakdown if sourcing */}
                                  {rfq.serviceKind === 'sourcing' && rfq.productCostCNY && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#22304A] text-xs font-mono">
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Product Cost:</span>
                                        <span className="font-bold text-white">¥{rfq.productCostCNY.toLocaleString()} CNY</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Commission ({rfq.sourcingCommissionPercent || 5}%):</span>
                                        <span className="font-bold text-white">¥{(rfq.sourcingCommissionCNY || 0).toLocaleString()} CNY</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Domestic Freight:</span>
                                        <span className="font-bold text-white">¥{rfq.chinaShippingCNY || 0} CNY</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Est. Lead Time:</span>
                                        <span className="font-bold text-white">{rfq.leadTimeDays || 7} Days</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="py-2 text-center text-slate-400 text-xs font-medium">
                                  <span>No price offer formulated yet. Click "Formulate Quote" to generate proforma.</span>
                                </div>
                              )}
                            </div>

                            {/* Official Proforma / Quotation Sheet Link */}
                            {rfq.supplierInvoiceUrl && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                                  <div>
                                    <span className="text-amber-300 font-bold block">Official Quotation Sheet / Proforma:</span>
                                    <a
                                      href={rfq.supplierInvoiceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline font-mono text-white text-xs truncate max-w-xs block"
                                    >
                                      {rfq.supplierInvoiceUrl}
                                    </a>
                                  </div>
                                </div>
                                <a
                                  href={rfq.supplierInvoiceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 ml-2 shadow-sm"
                                >
                                  View Sheet
                                </a>
                              </div>
                            )}

                            {/* Auto-Linked Cargo Waybill */}
                            {rfq.linkedShipmentCode && (
                              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
                                  <div>
                                    <span className="text-indigo-300 font-bold block">Auto-Linked Cargo Shipment:</span>
                                    <span className="font-mono font-bold text-white">{rfq.linkedShipmentCode} ({rfq.linkedTrackingCode || 'China Hub'})</span>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-600/40 text-indigo-200 text-[10px] font-bold uppercase">
                                  Waybill Sync
                                </span>
                              </div>
                            )}

                            {/* Inspection Deliverable Report */}
                            {rfq.inspectionReportUrl && (
                              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                                  <div>
                                    <span className="text-cyan-300 font-bold block">Inspection Deliverable Attached:</span>
                                    <a
                                      href={rfq.inspectionReportUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline font-mono text-white text-xs truncate max-w-xs block"
                                    >
                                      {rfq.inspectionReportUrl}
                                    </a>
                                  </div>
                                </div>
                                <a
                                  href={rfq.inspectionReportUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0 ml-2 shadow-sm"
                                >
                                  PDF Report
                                </a>
                              </div>
                            )}

                            {/* Ground Findings or Notes */}
                            {(rfq.supplierFindings || rfq.operationalNotes) && (
                              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#22304A] text-xs space-y-1.5">
                                {rfq.supplierFindings && (
                                  <p className="text-slate-300">
                                    <strong className="text-slate-400">Findings:</strong> {rfq.supplierFindings}
                                  </p>
                                )}
                                {rfq.operationalNotes && (
                                  <p className="text-emerald-300">
                                    <strong className="text-emerald-400">Milestone:</strong> {rfq.operationalNotes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Command Hub (Bottom Row) */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-3.5 border-t border-[#22304A]">
                        {/* Formulate / Edit Quote */}
                        <button
                          onClick={() => openQuoteModal(rfq)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{rfq.quoteAmountUSD ? 'Edit Quotation' : 'Formulate Quote'}</span>
                        </button>

                        {/* Assign Agent */}
                        <button
                          onClick={() => openAssignModal(rfq)}
                          className="px-4 py-2 rounded-xl bg-[#1B2A40] hover:bg-[#253954] border border-[#293A52] text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-purple-400" />
                          <span>{rfq.assignedAgent ? 'Reassign Agent' : 'Assign Agent'}</span>
                        </button>

                        {/* Upload Reports & Deliverables */}
                        <button
                          onClick={() => openOpsDrawer(rfq)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                          <span>Upload Reports & Deliverables</span>
                        </button>

                        {/* Send Client Update */}
                        <button
                          onClick={() => openCommunicateModal(rfq)}
                          className="px-4 py-2 rounded-xl bg-[#1B2A40] hover:bg-[#253954] border border-[#293A52] text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-4 h-4 text-cyan-400" />
                          <span>Send Client Update</span>
                        </button>

                        {/* Manage Details Drawer */}
                        <button
                          onClick={() => setManageDrawerRfq(rfq)}
                          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Manage Details</span>
                        </button>

                        {/* Cancel & Refund */}
                        {rfq.status !== 'refunded' && rfq.paymentStatus !== 'refunded' && (
                          <button
                            onClick={() => {
                              setRefundModalRfq(rfq);
                              setForceOverride(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Cancel & Refund</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AGENT FEE & COMMISSION SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="p-7 rounded-2xl bg-[#111C2E] border border-[#293A52] max-w-2xl space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>Agent Fee & Commission Settings</span>
              </h3>
              <p className="text-xs text-slate-300">
                Configure platform commissions, minimum thresholds, and fixed ground audit pricing applied across China trade corridors.
              </p>
            </div>

            <div className="space-y-4">
              {/* Minimum Sourcing Fee Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0B1220] border border-[#22304A]">
                <div>
                  <span className="text-sm font-bold text-white block">Enforce Minimum Sourcing Commission</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Apply minimum floor fee to low-value sourcing requests</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Sourcing Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={feeSettings.sourcingCommissionPercent}
                    onChange={(e) => setFeeSettings({ ...feeSettings, sourcingCommissionPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Default: 5.0%</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Min. Sourcing Commission (¥ CNY)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.minSourcingCommissionCNY}
                    onChange={(e) => setFeeSettings({ ...feeSettings, minSourcingCommissionCNY: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Default: ¥500 CNY {(feeSettings.minSourcingFeeEnabled ?? true) ? '(Active)' : '(Disabled)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Supplier Verification ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.supplierVerificationUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, supplierVerificationUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Default: $150 USD</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Factory Audit ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.factoryAuditUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, factoryAuditUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Default: $250 USD</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Quality Control ($ USD)
                  </label>
                  <input
                    type="number"
                    value={feeSettings.qualityControlUSD}
                    onChange={(e) => setFeeSettings({ ...feeSettings, qualityControlUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Default: $200 USD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingSettings ? <span>Saving Settings...</span> : (
                  <>
                    <Check className="w-5 h-5" />
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
            className="w-full max-w-xl bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {quoteModalRfq.reference || quoteModalRfq.id}
                </span>
                <h3 className="text-base font-extrabold text-white">Formulate Official Quotation</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Client & Product Info & Target Comparison */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <p className="text-sm"><strong>Client:</strong> <span className="text-white font-bold">{quoteModalRfq.clientName}</span></p>
                  <span className="text-xs font-mono font-bold text-slate-400">ID: {quoteModalRfq.userId}</span>
                </div>
                <p className="text-sm"><strong>Assignment:</strong> <span className="text-white font-semibold">{quoteModalRfq.productName}</span></p>
                {quoteModalRfq.serviceKind === 'sourcing' && (
                  <div className="p-3 rounded-lg bg-[#152238] border border-[#293A52] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[10px]">Client Target Budget:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {quoteModalRfq.targetQuantity || 0} units @ ¥{quoteModalRfq.targetUnitCNY || 0} = ¥{((quoteModalRfq.targetQuantity || 0) * (quoteModalRfq.targetUnitCNY || 0)).toLocaleString()} CNY
                      </span>
                    </div>
                    {quoteModalRfq.specifications && (
                      <span className="text-slate-300 text-xs italic max-w-[220px] truncate">
                        Specs: {quoteModalRfq.specifications}
                      </span>
                    )}
                  </div>
                )}
                {quoteModalRfq.productUrl && (
                  <p className="truncate text-indigo-400 flex items-center gap-1 text-xs">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <a href={quoteModalRfq.productUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">{quoteModalRfq.productUrl}</a>
                  </p>
                )}

                {/* Client Reference Photos */}
                {((quoteModalRfq.referencePhotos && quoteModalRfq.referencePhotos.length > 0) || 
                  (quoteModalRfq.sampleImages && quoteModalRfq.sampleImages.length > 0)) && (
                  <div className="pt-2 border-t border-[#22304A]">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Client Reference Photos</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(quoteModalRfq.referencePhotos || quoteModalRfq.sampleImages || []).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`ref-${i}`}
                          onClick={() => setPreviewImage(img)}
                          className="w-16 h-16 object-cover rounded-xl border border-[#293A52] cursor-pointer hover:border-emerald-500 transition-all shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sourcing Breakdown Form */}
              {quoteModalRfq.serviceKind === 'sourcing' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        Factory Product Cost (¥ CNY)
                      </label>
                      <input
                        type="number"
                        value={quoteCostCNY}
                        onChange={(e) => setQuoteCostCNY(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={quoteCommPercent}
                        onChange={(e) => setQuoteCommPercent(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        China Domestic Shipping (¥ CNY)
                      </label>
                      <input
                        type="number"
                        value={quoteShippingCNY}
                        onChange={(e) => setQuoteShippingCNY(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional FX Rate Overrides */}
                  <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-2">
                    <span className="text-xs font-bold uppercase text-slate-400 block">Optional FX Overrides (Blank = System Rates)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">CNY per USD (Default: 7.24)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="7.24"
                          value={fxOverrideUSD_CNY}
                          onChange={(e) => setFxOverrideUSD_CNY(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-[#152238] border border-[#293A52] text-white font-mono text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">NGN per USD (Default: 1,485)</label>
                        <input
                          type="number"
                          step="1"
                          placeholder="1485"
                          value={fxOverrideUSD_NGN}
                          onChange={(e) => setFxOverrideUSD_NGN(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-[#152238] border border-[#293A52] text-white font-mono text-xs outline-none focus:border-indigo-500"
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
                      <div className="p-4 rounded-xl bg-[#0B1220] border border-emerald-500/30 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-slate-400 block uppercase font-bold">Total Client Payable:</span>
                          <span className="text-emerald-400 font-mono font-black text-base">¥{total.toLocaleString()} CNY</span>
                          <span className="text-xs text-slate-300 block font-mono">Commission: ¥{comm.toLocaleString()} CNY</span>
                        </div>
                        <div className="text-right text-xs text-slate-300 font-mono">
                          <span className="text-white font-bold block text-sm">≈ ${totalUSD.toLocaleString()} USD</span>
                          <span className="block text-slate-400">≈ ₦{totalNGN.toLocaleString()} NGN</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
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
                          className={`py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            quoteCurrency === c
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                              : 'bg-[#0B1220] border-[#293A52] text-slate-300 hover:text-white'
                          }`}
                        >
                          {c === 'USD' ? '$ USD' : c === 'NGN' ? '₦ NGN' : '¥ RMB'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        Official Service Fee ({quoteCurrency === 'USD' ? '$ USD' : quoteCurrency === 'NGN' ? '₦ NGN' : '¥ RMB'})
                      </label>
                      <input
                        type="number"
                        value={quoteServiceFeeUSD}
                        onChange={(e) => setQuoteServiceFeeUSD(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#22304A] text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-slate-400">Cross-Currency Equivalents:</span>
                    <span className="text-emerald-400 font-bold text-sm">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Negotiated Manufacturer / Factory Partner
                  </label>
                  <input
                    type="text"
                    value={quoteSupplierName}
                    onChange={(e) => setQuoteSupplierName(e.target.value)}
                    placeholder="e.g. Shenzhen TopPower Co., Ltd"
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Official Quotation Sheet / Proforma URL
                  </label>
                  <input
                    type="url"
                    value={quoteDocUrl}
                    onChange={(e) => setQuoteDocUrl(e.target.value)}
                    placeholder="https://docs.flyemass.com/quotes/proforma.pdf"
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Inspector Notes & Findings */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Supplier Findings & Credential Verification
                </label>
                <textarea
                  value={quoteFindings}
                  onChange={(e) => setQuoteFindings(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Terms & Inspector Notes (Visible to Client)
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuote}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full max-w-xl bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {opsDrawerRfq.reference || opsDrawerRfq.id}
                </span>
                <h3 className="text-base font-extrabold text-white">China Ground Operations & Deliverables</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpsDrawerRfq(null)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Linked Shipment Notice */}
              {opsDrawerRfq.linkedShipmentCode && (
                <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase">Linked FlyeMass Waybill</span>
                      <span className="font-mono font-bold text-white">{opsDrawerRfq.linkedShipmentCode}</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">Tracked</span>
                </div>
              )}

              {/* Sourcing Specific: Purchase details & Supplier Invoice */}
              {opsDrawerRfq.serviceKind === 'sourcing' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                      1688 / Vendor Order ID & Purchase Details
                    </label>
                    <input
                      type="text"
                      value={opsPurchaseDetails}
                      onChange={(e) => setOpsPurchaseDetails(e.target.value)}
                      placeholder="e.g. 1688 Order #338190284419 • Shenzhen Factory Direct"
                      className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                      Supplier Commercial Invoice URL
                    </label>
                    <input
                      type="url"
                      value={opsInvoiceUrl}
                      onChange={(e) => setOpsInvoiceUrl(e.target.value)}
                      placeholder="https://flyemass.cn/invoices/inv-..."
                      className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Inspection Specific: Verification, Factory Audit, QC */}
              {opsDrawerRfq.serviceKind === 'supplier_verification' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Business Registration Findings & Legitimacy Status
                  </label>
                  <textarea
                    value={opsRegFindings}
                    onChange={(e) => setOpsRegFindings(e.target.value)}
                    rows={2}
                    placeholder="Unified Social Credit Code: 91440101MA59XXXXXX • Legal Representative confirmed active"
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {opsDrawerRfq.serviceKind === 'factory_audit' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    On-Site Factory Audit Findings & Machinery Check
                  </label>
                  <textarea
                    value={opsAuditFindings}
                    onChange={(e) => setOpsAuditFindings(e.target.value)}
                    rows={2}
                    placeholder="3 production lines active. ISO9001 verified on wall. Capacity: 5,000 units/day."
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {opsDrawerRfq.serviceKind === 'quality_control' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    AQL Sampling & Defect Rate Findings
                  </label>
                  <textarea
                    value={opsQcFindings}
                    onChange={(e) => setOpsQcFindings(e.target.value)}
                    rows={2}
                    placeholder="Level II Sampling (80 units tested). Defect rate: 0.8% (PASS). Packaging intact."
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Inspection Report PDF URL */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Deliverable PDF Report URL (agent-uploads)
                </label>
                <input
                  type="url"
                  value={opsReportPdfUrl}
                  onChange={(e) => setOpsReportPdfUrl(e.target.value)}
                  placeholder="https://flyemass.cn/reports/audit-report-2026.pdf"
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white font-mono text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Inspection Report Executive Summary */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Inspection Report Executive Summary
                </label>
                <textarea
                  value={opsReportSummary}
                  onChange={(e) => setOpsReportSummary(e.target.value)}
                  rows={2}
                  placeholder="Factory inspection successfully passed all structural and machinery criteria. Official certificate issued."
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Operational Progress Log */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Ground Milestone Update (Sent as Customer Notification)
                </label>
                <textarea
                  value={opsNotes}
                  onChange={(e) => setOpsNotes(e.target.value)}
                  rows={2}
                  placeholder="Goods arrived at Guangzhou Baiyun clearing hub. Inspection checklist completed."
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingOps}
                  className="flex-1 py-3 rounded-xl bg-[#1B2A40] hover:bg-[#253954] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#293A52]"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Deliverable & Progress</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRequest}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Request & Disburse Escrow</span>
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
            className="w-full max-w-md bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>Assign Ground Sourcing Agent</span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalRfq(null)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] text-slate-300 space-y-1">
                <p><strong>Request Ref:</strong> <span className="font-mono text-emerald-400 font-bold">{assignModalRfq.reference || assignModalRfq.id}</span></p>
                <p><strong>Assignment:</strong> {assignModalRfq.productName}</p>
                <p><strong>Client:</strong> {assignModalRfq.clientName}</p>
                <p><strong>Location:</strong> {assignModalRfq.supplierCity || 'Guangzhou'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Select Verified Ground Agent
                </label>
                <select
                  value={selectedAgentToAssign}
                  onChange={(e) => setSelectedAgentToAssign(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white outline-none focus:border-purple-500 text-sm font-semibold"
                >
                  <option value="Zhang Wei (Guangzhou Sourcing & Escort Desk)">Zhang Wei (Guangzhou Sourcing & Escort Desk)</option>
                  <option value="Chen Tao (Foshan Machinery & Hardware Inspector)">Chen Tao (Foshan Machinery & Hardware Inspector)</option>
                  <option value="Lin Xiaomei (Shenzhen Electronics & Tech Specialist)">Lin Xiaomei (Shenzhen Electronics & Tech Specialist)</option>
                  <option value="Wang Jing (Yiwu Small Commodities & QC Agent)">Wang Jing (Yiwu Small Commodities & QC Agent)</option>
                  <option value="Canton Fair Bilingual Escort Squad">Canton Fair Bilingual Escort Squad (Pazhou Complex)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Custom Agent Name / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Special instructions or field deployment notes..."
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isAssigningAgent}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-sm shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full max-w-md bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Communicate Update to Client</span>
              </div>
              <button
                type="button"
                onClick={() => setCommunicateModalRfq(null)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#22304A] text-slate-300 space-y-1">
                <p><strong>Client:</strong> <span className="text-white font-bold">{communicateModalRfq.clientName}</span></p>
                <p><strong>Assignment:</strong> {communicateModalRfq.productName}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Status Transition
                </label>
                <select
                  value={clientMessageStatus}
                  onChange={(e) => setClientMessageStatus(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white outline-none focus:border-cyan-500 text-sm font-semibold"
                >
                  <option value="in_progress">In Progress (Field Mission Active)</option>
                  <option value="quote_ready">Quotation Ready for Review</option>
                  <option value="completed">Mission Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Message Body (Customer Mobile App Notification)
                </label>
                <textarea
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingClientMessage}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full max-w-md bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel & Refund Agent Request</span>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalRfq(null)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-slate-300 space-y-1">
                <p><strong>Request Ref:</strong> <span className="font-mono text-rose-300 font-bold">{refundModalRfq.reference || refundModalRfq.id}</span></p>
                <p><strong>Client:</strong> {refundModalRfq.clientName}</p>
                {refundModalRfq.paidAmount && (
                  <p><strong>Paid Escrow:</strong> <span className="font-mono font-bold text-emerald-400">{refundModalRfq.paidAmount} {refundModalRfq.paidWith}</span></p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Reason for Cancellation & Reversal
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white outline-none focus:border-rose-500 text-sm"
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
                  <label htmlFor="forceOverride" className="text-xs font-semibold cursor-pointer">
                    Supervisor Authorization Override (Request marked completed)
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingRefund}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="w-full max-w-xl h-full bg-[#111C2E] border-l border-[#293A52] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#22304A]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {manageDrawerRfq.reference || manageDrawerRfq.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1B2A40] text-xs font-bold text-slate-300 uppercase">
                      {manageDrawerRfq.serviceType || manageDrawerRfq.serviceKind}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      manageDrawerRfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      manageDrawerRfq.status === 'awaiting_payment' || manageDrawerRfq.status === 'quote_ready' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      manageDrawerRfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' :
                      manageDrawerRfq.status === 'refunded' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {manageDrawerRfq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-1">Sourcing Request Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setManageDrawerRfq(null)}
                  className="w-9 h-9 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Profile Card */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-2 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Information</span>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-xs">Client Name:</span>
                    <strong className="text-white text-sm">{manageDrawerRfq.clientName || 'Chief Babatunde Alade'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Customer ID:</span>
                    <span className="font-mono text-slate-200 text-sm">{manageDrawerRfq.userId || 'usr_alade_01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Contact Email:</span>
                    <span className="text-slate-200 text-xs">{manageDrawerRfq.clientEmail || 'alade.investments@flyemass.ng'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Submission Date:</span>
                    <span className="text-slate-200 text-xs">
                      {manageDrawerRfq.createdAt ? new Date(manageDrawerRfq.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Specifications Card */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-3 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Requested Product Specifications</span>
                <div>
                  <span className="text-slate-400 block text-xs">Product Title:</span>
                  <h4 className="text-white font-bold text-base">{manageDrawerRfq.productName}</h4>
                </div>

                {manageDrawerRfq.specifications && (
                  <div>
                    <span className="text-slate-400 block text-xs mb-1">Detailed Specifications:</span>
                    <p className="text-slate-200 bg-[#152238] p-3 rounded-xl border border-[#293A52] leading-relaxed text-sm">
                      {manageDrawerRfq.specifications}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#152238] border border-[#293A52]">
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
                    <span className="text-slate-400 block text-xs mb-1">Chinese Supplier / Marketplace Link:</span>
                    <a
                      href={manageDrawerRfq.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 hover:text-white transition-all text-xs break-all"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span className="truncate">{manageDrawerRfq.productUrl}</span>
                    </a>
                  </div>
                )}

                {/* Reference Photos Gallery */}
                <div>
                  <span className="text-slate-400 block text-xs mb-1.5">Customer Reference Photos:</span>
                  {(() => {
                    const photos = (manageDrawerRfq.referencePhotos && manageDrawerRfq.referencePhotos.length > 0)
                      ? manageDrawerRfq.referencePhotos
                      : (manageDrawerRfq.sampleImages || []);
                    if (photos.length === 0) {
                      return (
                        <div className="p-3 rounded-xl bg-[#152238] border border-dashed border-[#293A52] text-center text-slate-400 text-xs">
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
                            className="relative aspect-square rounded-xl overflow-hidden border border-[#293A52] hover:border-emerald-500 group cursor-pointer"
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

              {/* Quotation & Pricing Summary Card */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-2 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quotation Summary</span>
                {manageDrawerRfq.quoteAmountUSD ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#152238] border border-[#293A52]">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Client Payable</span>
                        <span className="text-emerald-400 font-mono font-bold text-base">
                          {manageDrawerRfq.totalPayableCNY ? `¥${manageDrawerRfq.totalPayableCNY.toLocaleString()} CNY` : `$${manageDrawerRfq.quoteAmountUSD} USD`}
                        </span>
                      </div>
                      <div className="text-right text-xs font-mono text-slate-300">
                        <span className="text-white font-bold block">${manageDrawerRfq.quoteAmountUSD} USD</span>
                        <span>₦{manageDrawerRfq.quoteAmountNGN?.toLocaleString()} NGN</span>
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
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22304A] space-y-2 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Wallet Payment & Escrow Liability</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-xs">Escrow Status:</span>
                    <span className="font-bold text-white uppercase text-xs">{manageDrawerRfq.paymentStatus || 'unpaid'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Paid Amount:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {manageDrawerRfq.paidAmount ? `${manageDrawerRfq.paidAmount.toLocaleString()} ${manageDrawerRfq.paidWith}` : 'None'}
                    </span>
                  </div>
                  {manageDrawerRfq.paymentReference && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-xs">Transaction Reference:</span>
                      <span className="font-mono text-indigo-300 text-xs">{manageDrawerRfq.paymentReference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Cargo Waybill Card */}
              {manageDrawerRfq.linkedShipmentCode && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Truck className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">Linked Logistics Cargo Shipment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-xs">Waybill Tracking:</span>
                      <strong className="font-mono text-white text-xs">{manageDrawerRfq.linkedShipmentCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">China Local Tracking:</span>
                      <strong className="font-mono text-white text-xs">{manageDrawerRfq.linkedTrackingCode || 'SF-EXPRESS'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Current Status:</span>
                      <span className="font-bold text-emerald-400 text-xs uppercase">
                        {manageDrawerRfq.linkedShipmentStatus || 'received_warehouse'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Action Bar */}
            <div className="pt-4 border-t border-[#22304A] flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  openQuoteModal(manageDrawerRfq);
                  setManageDrawerRfq(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#1B2A40] hover:bg-[#253954] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#293A52]"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{manageDrawerRfq.quoteAmountUSD ? 'Edit Quotation' : 'Formulate Quote'}</span>
              </button>

              <button
                onClick={() => {
                  openOpsDrawer(manageDrawerRfq);
                  setManageDrawerRfq(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Update Progress</span>
              </button>

              {manageDrawerRfq.status !== 'refunded' && manageDrawerRfq.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => {
                    setRefundModalRfq(manageDrawerRfq);
                    setForceOverride(false);
                    setManageDrawerRfq(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
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
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL 7: REGISTER CHINESE SUPPLIER ===================== */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleCreateSupplier} className="w-full max-w-md bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#22304A]">
              <h3 className="text-base font-extrabold text-white">Register Verified Chinese Supplier</h3>
              <button
                type="button"
                onClick={() => setShowAddSupplier(false)}
                className="w-8 h-8 rounded-full bg-[#1B2A40] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Chinese Legal Name (中文名)</label>
                <input
                  type="text"
                  value={newSupZh}
                  onChange={(e) => setNewSupZh(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500 font-chinese"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">City Hub</label>
                  <input
                    type="text"
                    value={newSupCity}
                    onChange={(e) => setNewSupCity(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Badge</label>
                  <select
                    value={newSupBadge}
                    onChange={(e) => setNewSupBadge(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-[#0B1220] border border-[#293A52] text-white text-sm font-semibold outline-none focus:border-indigo-500 cursor-pointer"
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
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
