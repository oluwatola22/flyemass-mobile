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

export const AdminAgentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'rfqs' | 'suppliers' | 'settings'>('rfqs');
  const [rfqs, setRfqs] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(VETTED_SUPPLIERS);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

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
  const [isSavingOps, setIsSavingOps] = useState(false);

  // Cancellation & Refund Modal State
  const [refundModalRfq, setRefundModalRfq] = useState<AgentRequestDocument | null>(null);
  const [refundReason, setRefundReason] = useState('Supplier failed physical factory audit criteria.');
  const [forceOverride, setForceOverride] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Fee Settings State
  const [feeSettings, setFeeSettings] = useState<any>({
    sourcingCommissionPercent: 5.0,
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
    return db.subscribe(() => setRfqs(db.getAgentRequests()));
  }, []);

  // Filtered RFQs
  const filteredRfqs = rfqs.filter(r => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_review' && r.status !== 'pending_review' && r.status !== 'pending_quote') return false;
      if (statusFilter === 'awaiting_payment' && r.status !== 'awaiting_payment' && r.status !== 'quote_ready') return false;
      if (statusFilter === 'in_progress' && r.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && r.status !== 'completed') return false;
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
  const pendingCount = rfqs.filter(r => r.status === 'pending_review' || r.status === 'pending_quote').length;
  const awaitingPaymentCount = rfqs.filter(r => r.status === 'awaiting_payment' || r.status === 'quote_ready').length;
  const inProgressCount = rfqs.filter(r => r.status === 'in_progress').length;
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
    } else {
      setQuoteServiceFeeUSD(String(rfq.serviceFeeUSD || (rfq.serviceKind === 'supplier_verification' ? feeSettings.supplierVerificationUSD : rfq.serviceKind === 'factory_audit' ? feeSettings.factoryAuditUSD : feeSettings.qualityControlUSD || 250)));
      setQuoteLeadDays(String(rfq.leadTimeDays || 3));
    }
    setQuoteAgentName(rfq.assignedAgent || 'Zhang Wei (Guangzhou Sourcing Desk)');
    setQuoteFindings(rfq.supplierFindings || 'Direct manufacturer identified and preliminary catalog reviewed.');
    setQuoteNotes(rfq.adminNotes || 'Quotation formulated according to client specifications.');
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
        assignedAgent: quoteAgentName,
        supplierFindings: quoteFindings,
        quotationNotes: quoteNotes,
        leadTimeDays: parseInt(quoteLeadDays) || 7,
        adminId: 'adm-001'
      };

      if (isSourcing) {
        const costCNY = parseFloat(quoteCostCNY) || 0;
        const commPct = parseFloat(quoteCommPercent) || 5.0;
        const minCNY = feeSettings.minSourcingCommissionCNY || 500;
        const commCNY = Math.max(minCNY, Math.round(costCNY * (commPct / 100)));
        const shipCNY = parseFloat(quoteShippingCNY) || 0;
        const totalCNY = costCNY + commCNY + shipCNY;
        const totalUSD = Math.round((totalCNY / 7.24) * 100) / 100;
        const totalNGN = Math.round(totalCNY * 214.50);

        payload = {
          ...payload,
          productCostCNY: costCNY,
          sourcingCommissionPercent: commPct,
          sourcingCommissionCNY: commCNY,
          chinaShippingCNY: shipCNY,
          totalPayableCNY: totalCNY,
          quoteAmountCNY: totalCNY,
          quoteAmountUSD: totalUSD,
          quoteAmountNGN: totalNGN
        };
      } else {
        const feeUSD = parseFloat(quoteServiceFeeUSD) || 250;
        const feeNGN = Math.round(feeUSD * 1485);
        const feeCNY = Math.round(feeUSD * 7.24);

        payload = {
          ...payload,
          serviceFeeUSD: feeUSD,
          quoteAmountUSD: feeUSD,
          quoteAmountNGN: feeNGN,
          quoteAmountCNY: feeCNY,
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
        inspectionReportUrl: opsReportPdfUrl || undefined
      }, 'adm-001');

      showToast(`Milestone update saved for #${opsDrawerRfq.reference || opsDrawerRfq.id}!`, 'success');
      setOpsDrawerRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsSavingOps(false);
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
                onClick={() => setActiveTab('suppliers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Suppliers ({suppliersList.length})
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
            </div>

            {activeTab === 'suppliers' && (
              <button
                onClick={() => setShowAddSupplier(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Register Supplier</span>
              </button>
            )}
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
                  <option value="awaiting_payment">Awaiting Payment</option>
                  <option value="in_progress">In Progress</option>
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          rfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' :
                          rfq.status === 'refunded' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {rfq.status === 'awaiting_payment' ? 'Awaiting Payment' : rfq.status.replace('_', ' ')}
                        </span>
                        {rfq.paymentStatus && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-900/40">
                            Escrow: {rfq.paymentStatus}
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
                  {(rfq.adminNotes || rfq.supplierFindings || rfq.operationalNotes) && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                      {rfq.supplierFindings && <p><strong className="text-slate-400">Findings:</strong> {rfq.supplierFindings}</p>}
                      {rfq.operationalNotes && <p><strong className="text-emerald-400">Milestone:</strong> {rfq.operationalNotes}</p>}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    {/* Formulate Quote */}
                    <button
                      onClick={() => openQuoteModal(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rfq.quoteAmountUSD ? 'Edit Quotation' : 'Formulate Quote'}</span>
                    </button>

                    {/* Update Operations Progress (Milestone updates) */}
                    <button
                      onClick={() => openOpsDrawer(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Update Ground Progress & Deliverables</span>
                    </button>

                    {/* Cancel & Refund Action */}
                    {rfq.status !== 'refunded' && rfq.paymentStatus !== 'refunded' && (
                      <button
                        onClick={() => {
                          setRefundModalRfq(rfq);
                          setForceOverride(false);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
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

        {/* TAB 2: VERIFIED SUPPLIERS DIRECTORY */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliersList.map((sup) => (
                <div key={sup.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{sup.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          {sup.badge}
                        </span>
                      </div>
                      <p className="text-xs font-chinese text-slate-300 mt-0.5">{sup.chineseName}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{sup.city} • {sup.category}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{sup.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{sup.verifiedYears} yrs verified</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Min. Order Value</span>
                      <strong className="text-white">{sup.minOrderValue}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Inspection Status</span>
                      <span className="font-bold inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Audit Passed</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN FEE CONFIGURATION */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-extrabold text-white">Agent Fee & Commission Settings</h3>
              <p className="text-xs text-slate-400">
                Configure platform commissions, minimum thresholds, and fixed ground audit pricing.
              </p>
            </div>

            <div className="space-y-3 text-xs">
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
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: ¥500 CNY</span>
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
              {/* Client & Product Info */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-slate-400">
                <p><strong>Client:</strong> <span className="text-white">{quoteModalRfq.clientName}</span></p>
                <p><strong>Product / Assignment:</strong> <span className="text-white">{quoteModalRfq.productName}</span></p>
                {quoteModalRfq.productUrl && (
                  <p className="truncate text-indigo-400">
                    <strong>URL:</strong> <a href={quoteModalRfq.productUrl} target="_blank" rel="noreferrer" className="hover:underline">{quoteModalRfq.productUrl}</a>
                  </p>
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

                  {/* Calculated Totals Box */}
                  {(() => {
                    const c = parseFloat(quoteCostCNY) || 0;
                    const p = parseFloat(quoteCommPercent) || 5;
                    const min = feeSettings.minSourcingCommissionCNY || 500;
                    const comm = Math.max(min, Math.round(c * (p / 100)));
                    const s = parseFloat(quoteShippingCNY) || 0;
                    const total = c + comm + s;
                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Client Payable:</span>
                          <span className="text-emerald-400 font-mono font-black text-sm">¥{total.toLocaleString()} CNY</span>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 font-mono">
                          <span>≈ ${Math.round((total / 7.24) * 100) / 100} USD</span>
                          <span className="block text-slate-500">≈ ₦{Math.round(total * 214.50).toLocaleString()} NGN</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                        Service Fee ($ USD)
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
                </div>
              )}

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
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingOps}
                  className="w-1/2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Milestone Update</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRequest}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed & Disburse Escrow</span>
                </button>
              </div>
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

      {/* ===================== MODAL 4: REGISTER SUPPLIER ===================== */}
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
