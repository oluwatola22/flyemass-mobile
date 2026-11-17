import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { AgentRequestDocument, AgentServiceKind } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  ClipboardList,
  Search,
  FileText,
  Check,
  ChevronRight,
  X,
  ExternalLink,
  Lock,
  Upload,
  AlertCircle,
  Trash2,
  Truck,
  DollarSign,
  Layers,
  Eye,
  FileCheck,
  Building,
  RefreshCw
} from 'lucide-react';

export const AgentServiceScreen: React.FC = () => {
  const { showToast, navigate, activeUserId, userProfile } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'my_requests'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_review' | 'quotation_sent' | 'paid_active' | 'completed' | 'action_needed' | 'active'>('all');

  // Requests State
  const [requests, setRequests] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [settings, setSettings] = useState<any>({
    sourcingCommissionPercent: 5.0,
    minSourcingCommissionCNY: 500,
    supplierVerificationUSD: 150,
    factoryAuditUSD: 250,
    qualityControlUSD: 200
  });

  // Modal States
  const [activeWizard, setActiveWizard] = useState<AgentServiceKind | null>(null);
  const [sourcingStep, setSourcingStep] = useState<1 | 2>(1);
  const [paymentModalRfq, setPaymentModalRfq] = useState<AgentRequestDocument | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'USD' | 'NGN' | 'CNY'>('USD');
  const [pinInput, setPinInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [viewDetailRfq, setViewDetailRfq] = useState<AgentRequestDocument | null>(null);
  const [submittedRfq, setSubmittedRfq] = useState<AgentRequestDocument | null>(null);

  // Sourcing Wizard Form State
  const [srcProductName, setSrcProductName] = useState('');
  const [srcProductUrl, setSrcProductUrl] = useState('');
  const [srcQuantity, setSrcQuantity] = useState('100');
  const [srcTargetUnitCNY, setSrcTargetUnitCNY] = useState('45');
  const [srcSpecs, setSrcSpecs] = useState('Custom logo silk-screen print, waterproof individual packaging');
  const [srcPhotos, setSrcPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
  ]);
  const [srcNewPhotoUrl, setSrcNewPhotoUrl] = useState('');
  const [isSubmittingSourcing, setIsSubmittingSourcing] = useState(false);

  // Inspection & Ground Booking Form State (Verification / Audit / QC / Canton Fair Escort)
  const [inspProductName, setInspProductName] = useState('Industrial Machinery & High-Capacity Lithium Cells');
  const [inspProductSpecs, setInspProductSpecs] = useState('51.2V 100Ah LiFePO4 cells, laser welded busbars, UN38.3 & CE certification');
  const [inspTargetQuantity, setInspTargetQuantity] = useState('100');
  const [inspCantonFairBooth, setInspCantonFairBooth] = useState('Area B, Hall 11.2, Booth C38-42');
  const [inspSupplierName, setInspSupplierName] = useState('Shenzhen Huaqiangbei Microelectronics Ltd');
  const [inspCity, setInspCity] = useState<'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('Shenzhen');
  const [inspAddress, setInspAddress] = useState('Building 4, Science & Technology Park, Nanshan, Shenzhen');
  const [inspContact, setInspContact] = useState('Manager Li / +86 138 2008 7711');
  const [inspWechat, setInspWechat] = useState('sz_micro_li');
  const [inspDate, setInspDate] = useState('2026-11-15');
  const [inspPaymentMethod, setInspPaymentMethod] = useState<'wallet' | 'quote_first'>('wallet');
  const [inspWalletCurrency, setInspWalletCurrency] = useState<'NGN' | 'CNY'>('NGN');
  const [inspPin, setInspPin] = useState('');
  const [inspRequirements, setInspRequirements] = useState<string[]>([
    'AQL Level II sampling (2.5 Major / 4.0 Minor)',
    'Full packaging carton drop & barcode scan test',
    'High-resolution factory equipment & warehouse photo set'
  ]);
  const [newRequirement, setNewRequirement] = useState('');
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  // Subscribe to DB & load settings
  useEffect(() => {
    db.getAgentSettings().then(setSettings).catch(() => {});
    return db.subscribe(() => {
      const nextRequests = db.getAgentRequests();
      setRequests((prev) => {
        if (
          prev.length === nextRequests.length &&
          prev.every((r, i) => r.id === nextRequests[i]?.id && r.status === nextRequests[i]?.status && r.paymentStatus === nextRequests[i]?.paymentStatus)
        ) {
          return prev;
        }
        return nextRequests;
      });
    });
  }, []);

  const uid = activeUserId || 'usr_alade_01';
  const myRequests = requests.filter(r => !r.userId || r.userId === uid);

  // Metrics
  const pendingReviewCount = myRequests.filter(r => r.status === 'pending_review' || r.status === 'submitted' || r.status === 'pending_quote').length;
  const quotationSentCount = myRequests.filter(r => r.status === 'awaiting_payment' || r.status === 'quote_ready' || r.status === 'quotation_sent').length;
  const paidActiveCount = myRequests.filter(r => r.status === 'in_progress' || r.status === 'paid_active' || r.status === 'approved').length;
  const completedCount = myRequests.filter(r => r.status === 'completed').length;
  const activeRequestsCount = myRequests.filter(r => r.status === 'in_progress' || r.status === 'paid_active' || r.status === 'approved' || r.status === 'pending_review' || r.status === 'pending_quote').length;
  const actionNeededCount = quotationSentCount;

  // Filtered requests list
  const filteredRequests = myRequests.filter(r => {
    if (filterStatus === 'pending_review') return r.status === 'pending_review' || r.status === 'submitted' || r.status === 'pending_quote';
    if (filterStatus === 'quotation_sent' || filterStatus === 'action_needed') return r.status === 'awaiting_payment' || r.status === 'quote_ready' || r.status === 'quotation_sent';
    if (filterStatus === 'paid_active' || filterStatus === 'active') return r.status === 'in_progress' || r.status === 'paid_active' || r.status === 'approved';
    if (filterStatus === 'completed') return r.status === 'completed';
    return true;
  });

  // Rates for conversions
  const usdRate = 7.24; // 1 USD = 7.24 CNY
  const ngnRate = 214.50; // 1 CNY = 214.50 NGN

  // Calculations for Sourcing Step 1
  const qty = parseFloat(srcQuantity) || 1;
  const unitCNY = parseFloat(srcTargetUnitCNY) || 0;
  const totalProductCNY = qty * unitCNY;
  const commissionPercent = settings.sourcingCommissionPercent || 5.0;
  const minCommission = settings.minSourcingCommissionCNY || 500;
  const estimatedCommissionCNY = Math.max(minCommission, Math.round(totalProductCNY * (commissionPercent / 100)));
  const estimatedTotalCNY = totalProductCNY + estimatedCommissionCNY;
  const estimatedTotalUSD = Math.round((estimatedTotalCNY / usdRate) * 100) / 100;
  const estimatedTotalNGN = Math.round(estimatedTotalCNY * ngnRate);

  // Sourcing Submit Handler
  const handleSourcingSubmit = async () => {
    if (!srcProductName.trim()) {
      showToast('Please enter the product name', 'error');
      return;
    }
    setIsSubmittingSourcing(true);
    try {
      const res = await db.createAgentRequest({
        serviceKind: 'sourcing',
        serviceType: 'Product Sourcing & Procurement',
        productName: srcProductName,
        productUrl: srcProductUrl,
        category: 'Tech & Industrial Products',
        targetQuantity: qty,
        targetUnitCNY: unitCNY,
        totalBudgetCNY: estimatedTotalCNY,
        specifications: srcSpecs,
        referencePhotos: srcPhotos.slice(0, 4),
        inspectionRequired: true,
        userId: uid,
        clientName: userProfile?.name || 'Chief Babatunde Alade',
        supplierCity: 'Guangzhou'
      });

      showToast(`Sourcing request #${res.request?.reference || res.request?.id} submitted successfully!`, 'success');
      setActiveWizard(null);
      setSourcingStep(1);
      setSubmittedRfq(res.request);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit sourcing request', 'error');
    } finally {
      setIsSubmittingSourcing(false);
    }
  };

  // Inspection & Ground Booking Submit Handler
  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWizard) return;
    setIsSubmittingInspection(true);

    const feeUSD = activeWizard === 'supplier_verification' 
      ? (settings.supplierVerificationUSD || 150)
      : activeWizard === 'factory_audit'
      ? (settings.factoryAuditUSD || 250)
      : activeWizard === 'canton_fair_escort'
      ? (settings.cantonFairEscortUSD || 200)
      : (settings.qualityControlUSD || 200);

    const titleMap: Record<AgentServiceKind, string> = {
      sourcing: 'Product Sourcing',
      supplier_verification: 'Supplier Legitimacy Verification',
      factory_audit: 'Physical Factory Audit',
      quality_control: 'Pre-Shipment Quality Control (QC)',
      canton_fair_escort: 'Canton Fair Escort & Trade Guide'
    };

    try {
      if (inspPaymentMethod === 'wallet') {
        if (inspPin.length !== 6) {
          showToast('Please enter your 6-digit transaction PIN to pay booking fee', 'error');
          setIsSubmittingInspection(false);
          return;
        }

        const res = await db.bookAgentWithWallet({
          serviceKind: activeWizard,
          serviceType: titleMap[activeWizard],
          productName: inspProductName.trim() || `${titleMap[activeWizard]} — ${inspSupplierName}`,
          specifications: inspProductSpecs.trim(),
          targetQuantity: parseInt(inspTargetQuantity) || 100,
          supplierName: inspSupplierName,
          supplierCity: inspCity,
          supplierLocation: inspAddress,
          supplierContact: inspContact,
          supplierWechat: inspWechat,
          cantonFairBooth: activeWizard === 'canton_fair_escort' ? inspCantonFairBooth.trim() : undefined,
          preferredDate: inspDate,
          inspectionRequirements: inspRequirements,
          paymentWalletUsed: inspWalletCurrency,
          pin: inspPin,
          userId: uid
        });

        showToast(`Ground agent booked! ${res.request?.escrowAmount || feeUSD} ${res.request?.escrowCurrency || inspWalletCurrency} held in secure escrow.`, 'success');
      } else {
        const res = await db.createAgentRequest({
          serviceKind: activeWizard,
          serviceType: titleMap[activeWizard],
          productName: inspProductName.trim() || `${titleMap[activeWizard]} — ${inspSupplierName}`,
          specifications: inspProductSpecs.trim(),
          targetQuantity: parseInt(inspTargetQuantity) || 100,
          supplierName: inspSupplierName,
          supplierCity: inspCity,
          supplierLocation: inspAddress,
          supplierContact: inspContact,
          supplierWechat: inspWechat,
          cantonFairBooth: activeWizard === 'canton_fair_escort' ? inspCantonFairBooth.trim() : undefined,
          preferredDate: inspDate,
          inspectionRequirements: inspRequirements,
          serviceFeeUSD: feeUSD,
          userId: uid,
          clientName: userProfile?.name || 'Chief Babatunde Alade',
          inspectionRequired: true
        });

        showToast(`Inspection request #${res.request?.reference || res.request?.id} filed with China Desk!`, 'success');
      }

      setActiveWizard(null);
      setInspPin('');
      setRequests(db.getAgentRequests());
      setActiveTab('my_requests');
      setFilterStatus('all');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inspection request', 'error');
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  // Payment Execution Handler
  const handleConfirmPayment = async () => {
    if (!paymentModalRfq) return;
    if (pinInput.length !== 6) {
      showToast('Please enter your 6-digit transaction PIN', 'error');
      return;
    }
    setIsProcessingPayment(true);

    try {
      const res = await db.acceptAgentQuote(paymentModalRfq.id, pinInput, selectedWallet, uid);
      showToast(`Quotation approved and paid! Status marked as Paid & Active.`, 'success');
      setPaymentModalRfq(null);
      setPinInput('');
      setRequests(db.getAgentRequests());
      setActiveTab('my_requests');
      setFilterStatus('paid_active');
    } catch (err: any) {
      showToast(err.message || 'Payment authorization failed', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Get Wallet Balance
  const userBalances = db.getUser(uid)?.balances || { USD: 42890.50, NGN: 28450200, CNY: 184250 };

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="China Agents & Sourcing" />

      <div className="p-4 space-y-4">
        {/* Navigation Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Services & Sourcing
          </button>
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`py-2.5 rounded-xl font-bold transition-all relative ${
              activeTab === 'my_requests'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>My Agent Requests ({myRequests.length})</span>
            {actionNeededCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold animate-pulse">
                {actionNeededCount}
              </span>
            )}
          </button>
        </div>

        {/* ===================== TAB 1: OVERVIEW DASHBOARD ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Metric Counter Chips */}
            <div className="grid grid-cols-4 gap-2">
              <div 
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('pending_review'); }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all text-center"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">{pendingReviewCount}</span>
                <span className="text-[9px] text-slate-400 font-medium">Reviewing</span>
              </div>
              <div 
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('quotation_sent'); }}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-all text-center"
              >
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Quoted</span>
                <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">{quotationSentCount}</span>
                <span className="text-[9px] text-amber-300 font-medium">Payable</span>
              </div>
              <div 
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('paid_active'); }}
                className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 cursor-pointer hover:border-indigo-500/50 transition-all text-center"
              >
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Active</span>
                <span className="text-lg font-black text-indigo-400 font-mono mt-0.5 block">{paidActiveCount}</span>
                <span className="text-[9px] text-emerald-400 font-medium">Ground Ops</span>
              </div>
              <div 
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('completed'); }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all text-center"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Done</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">{completedCount}</span>
                <span className="text-[9px] text-slate-400 font-medium">Reports</span>
              </div>
            </div>

            {/* Banner: Bilingual Ground Presence */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-900/40 relative overflow-hidden">
              <div className="relative z-10 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>FlyeMass China Ground Operations (广州 • 深圳 • 义乌)</span>
                </div>
                <h3 className="text-sm font-black text-white">Full-Stack Trade Agents & Sourcing Escrow</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our bilingual ground team inspects factories, negotiates wholesale pricing on 1688 & Taobao, and safeguards payments in multi-currency escrow until quality sign-off.
                </p>
              </div>
            </div>

            {/* 4 Interactive Service Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Agent Service</span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Escrow Protected</span>
              </div>

              {/* Service 1: Product Sourcing */}
              <div 
                onClick={() => { setActiveWizard('sourcing'); setSourcingStep(1); }}
                className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-all">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          Product Sourcing & Purchasing
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                          {settings.sourcingCommissionPercent}% Fee
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Find products on 1688, Taobao, Alibaba, or Pinduoduo. We negotiate direct manufacturer pricing, purchase samples, and coordinate China freight.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">Min. commission: ¥{settings.minSourcingCommissionCNY} CNY</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span>Start Sourcing Wizard</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Service 2: Supplier Verification */}
              <div 
                onClick={() => setActiveWizard('supplier_verification')}
                className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-all">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                          Supplier Legitimacy Verification
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold">
                          ${settings.supplierVerificationUSD} USD Fixed
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        National Enterprise Credit Information check, Unified Social Credit Code verification, business license validation, and physical office check.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">Deliverable: Official Verification Certificate</span>
                  <span className="font-semibold text-indigo-400 flex items-center gap-1">
                    <span>Verify Supplier</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Service 3: Factory Audit */}
              <div 
                onClick={() => setActiveWizard('factory_audit')}
                className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-all">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          On-Site Factory Audit
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">
                          ${settings.factoryAuditUSD} USD Fixed
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        On-the-ground visit to factory workshops. Inspect production machinery, verify manufacturing capacity, worker conditions, and real output capability.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">Deliverable: Comprehensive PDF Audit Report + HD Video</span>
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <span>Book Factory Audit</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Service 4: Quality Control */}
              <div 
                onClick={() => setActiveWizard('quality_control')}
                className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-all">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
                          Quality Control & AQL Pre-Shipment
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[9px] font-bold">
                          ${settings.qualityControlUSD} USD Fixed
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        ANSI/ASQ Z1.4 (ISO 2859-1) AQL sampling inspection before final dispatch. Defect tolerance check, carton drop tests, barcode and label verification.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">Deliverable: AQL Inspection Certificate & Defect Log</span>
                  <span className="font-semibold text-teal-400 flex items-center gap-1">
                    <span>Book QC Inspection</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Service 5: Canton Fair Escort & Trade Guide */}
              <div 
                onClick={() => setActiveWizard('canton_fair_escort')}
                className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-all">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          Canton Fair Escort & Trade Guide
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">
                          ${settings.cantonFairEscortUSD || 200} USD / Day
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Bilingual ground agent escort at Canton Fair (Guangzhou Pazhou Complex). Live English-Chinese translation, booth negotiation, catalog compilation, and supplier vetting.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">Deliverable: Verified Booth Reports & Supplier Dossier</span>
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <span>Book Fair Escort</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Requests Preview */}
            {myRequests.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Recent Activity</span>
                  <button 
                    onClick={() => setActiveTab('my_requests')}
                    className="text-xs text-emerald-400 font-bold hover:underline"
                  >
                    View All ({myRequests.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {myRequests.slice(0, 3).map(rfq => (
                    <div 
                      key={rfq.id}
                      onClick={() => setViewDetailRfq(rfq)}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-400">{rfq.reference || rfq.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            rfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' ? 'bg-amber-500/20 text-amber-300' :
                            rfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {rfq.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white line-clamp-1">{rfq.productName}</h5>
                        <p className="text-[10px] text-slate-400">{rfq.serviceType} • {rfq.supplierCity || 'Guangzhou'}</p>
                      </div>
                      <div className="text-right">
                        {rfq.quoteAmountUSD ? (
                          <span className="text-xs font-bold text-emerald-400 font-mono block">
                            ${rfq.quoteAmountUSD}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block">Pending Quote</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-600 inline-block mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: MY REQUESTS MANAGEMENT ===================== */}
        {activeTab === 'my_requests' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: `All (${myRequests.length})` },
                { id: 'pending_review', label: `Pending Review (${pendingReviewCount})` },
                { id: 'quotation_sent', label: `Quotation Sent (${quotationSentCount})` },
                { id: 'paid_active', label: `Paid & Active (${paidActiveCount})` },
                { id: 'completed', label: `Completed (${completedCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    filterStatus === f.id || (f.id === 'quotation_sent' && filterStatus === 'action_needed') || (f.id === 'paid_active' && filterStatus === 'active')
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No requests in this category</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Submit a product sourcing or inspection assignment to start working with our China operations team.
                </p>
                <button
                  onClick={() => { setActiveTab('overview'); setActiveWizard('sourcing'); }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Start New Sourcing Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(rfq => (
                  <div
                    key={rfq.id}
                    className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">{rfq.reference || rfq.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            rfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent' 
                              ? 'Quotation Sent' 
                              : (rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved')
                              ? 'Paid & Active'
                              : (rfq.status === 'pending_review' || rfq.status === 'submitted' || rfq.status === 'pending_quote')
                              ? 'Pending Review'
                              : rfq.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white pt-1">{rfq.productName}</h4>
                        <p className="text-xs text-slate-400">{rfq.serviceType} • {rfq.supplierCity || 'Guangzhou'}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </span>
                        {rfq.targetQuantity && (
                          <span className="text-[11px] text-slate-300 font-mono block mt-1">
                            {rfq.targetQuantity} units
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linked Cargo Shipment Pill (Phase 10 Feature) */}
                    {rfq.linkedShipmentCode && (
                      <div className="p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-400" />
                          <div>
                            <span className="text-[10px] text-indigo-300 font-bold block uppercase">Linked Cargo Waybill</span>
                            <span className="font-mono font-bold text-white">{rfq.linkedShipmentCode} ({rfq.linkedTrackingCode})</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate('track')}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500 text-white font-bold text-[10px] hover:bg-indigo-400 transition-all flex items-center gap-1"
                        >
                          <span>Track Cargo</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Quotation Breakdown if Quoted */}
                    {rfq.quoteAmountUSD && (
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Total Payable:</span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              {rfq.totalPayableCNY ? `¥${rfq.totalPayableCNY.toLocaleString()} CNY` : `$${rfq.quoteAmountUSD} USD`}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ≈ ${rfq.quoteAmountUSD} USD / ₦{(rfq.quoteAmountNGN || rfq.quoteAmountUSD * 1485).toLocaleString()} NGN
                            </span>
                          </div>
                        </div>

                        {rfq.adminNotes && (
                          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                            "{rfq.adminNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Action Needed: Review & Pay Quotation */}
                      {(rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent') && (
                        <button
                          onClick={() => {
                            setPaymentModalRfq(rfq);
                            setPinInput('');
                          }}
                          className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Review & Pay Quotation ({rfq.totalPayableCNY ? `¥${rfq.totalPayableCNY.toLocaleString()} RMB` : `$${rfq.quoteAmountUSD} USD`})</span>
                        </button>
                      )}

                      {/* Detail View Button */}
                      <button
                        onClick={() => setViewDetailRfq(rfq)}
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details & Timeline</span>
                      </button>

                      {/* Download PDF if Completed */}
                      {rfq.status === 'completed' && rfq.inspectionReportUrl && (
                        <a
                          href={rfq.inspectionReportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Inspection Report</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== MODAL 1: PRODUCT SOURCING WIZARD ===================== */}
      {activeWizard === 'sourcing' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Step {sourcingStep} of 2</span>
                <h3 className="text-base font-black text-white">
                  {sourcingStep === 1 ? 'Product Sourcing Details' : 'Quotation & Fee Review'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveWizard(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Details */}
            {sourcingStep === 1 && (
              <div className="space-y-3.5 text-xs">
                {/* Product Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Product Title / Description</label>
                  <input
                    type="text"
                    value={srcProductName}
                    onChange={(e) => setSrcProductName(e.target.value)}
                    placeholder="e.g. Wireless ANC Bluetooth Headphones with Custom Box"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Product URL */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">1688 / Taobao / Alibaba / Pinduoduo Link</label>
                  <input
                    type="url"
                    value={srcProductUrl}
                    onChange={(e) => setSrcProductUrl(e.target.value)}
                    placeholder="https://detail.1688.com/offer/..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {['1688', 'Taobao', 'Alibaba', 'Pinduoduo'].map(plat => (
                      <span key={plat} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-semibold">
                        {plat} Supported
                      </span>
                    ))}
                  </div>
                </div>

                {/* Qty & Target Unit CNY */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Quantity</label>
                    <input
                      type="number"
                      value={srcQuantity}
                      onChange={(e) => setSrcQuantity(e.target.value)}
                      min="1"
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Unit Price (¥ CNY)</label>
                    <input
                      type="number"
                      value={srcTargetUnitCNY}
                      onChange={(e) => setSrcTargetUnitCNY(e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Live Estimated Conversions */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Estimated Product Subtotal:</span>
                    <strong className="text-white font-mono">¥{totalProductCNY.toLocaleString()} CNY</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>USD & NGN Equivalents:</span>
                    <span className="text-emerald-400 font-mono font-medium">
                      ≈ ${Math.round((totalProductCNY / usdRate) * 100) / 100} USD / ₦{Math.round(totalProductCNY * ngnRate).toLocaleString()} NGN
                    </span>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Specifications & Packaging</label>
                  <textarea
                    value={srcSpecs}
                    onChange={(e) => setSrcSpecs(e.target.value)}
                    rows={2}
                    placeholder="Color, materials, custom logo requirements, gift box packaging..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Photos & Uploader */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block">
                      Reference Photos ({srcPhotos.length}/4)
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Max 4 photos</span>
                  </div>

                  {/* Thumbnail gallery */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {srcPhotos.map((photo, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 group">
                        <img src={photo} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSrcPhotos(srcPhotos.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {srcPhotos.length < 4 && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={srcNewPhotoUrl}
                          onChange={(e) => setSrcNewPhotoUrl(e.target.value)}
                          placeholder="Paste reference photo URL"
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (srcNewPhotoUrl.trim() && srcPhotos.length < 4) {
                              setSrcPhotos([...srcPhotos, srcNewPhotoUrl.trim()]);
                              setSrcNewPhotoUrl('');
                            }
                          }}
                          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* File upload from device */}
                      <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-white cursor-pointer transition-all text-[11px] font-semibold">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Upload photo from device (agent-uploads)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && srcPhotos.length < 4) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result && srcPhotos.length < 4) {
                                  setSrcPhotos(prev => [...prev, ev.target!.result as string]);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Continue to Step 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!srcProductName.trim()) {
                      showToast('Please enter the product name', 'error');
                      return;
                    }
                    setSourcingStep(2);
                  }}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Review Fee Breakdown</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Review & Submit */}
            {sourcingStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                    Request Summary
                  </h4>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Product:</span>
                    <strong className="text-white text-right max-w-[200px] truncate">{srcProductName}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-mono text-white">{qty} units</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Unit:</span>
                    <span className="font-mono text-white">¥{unitCNY} CNY</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Product Subtotal:</span>
                    <span className="font-mono text-white">¥{totalProductCNY.toLocaleString()} CNY</span>
                  </div>

                  <div className="flex justify-between text-emerald-400">
                    <span>Sourcing Commission ({commissionPercent}%):</span>
                    <span className="font-mono font-bold">¥{estimatedCommissionCNY.toLocaleString()} CNY</span>
                  </div>

                  {totalProductCNY * (commissionPercent / 100) < minCommission && (
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      * Includes minimum commission threshold (¥{minCommission} CNY)
                    </div>
                  )}

                  {srcSpecs && (
                    <div className="pt-2 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Specifications:</span>
                      <span className="text-white text-right max-w-[200px] truncate">{srcSpecs}</span>
                    </div>
                  )}

                  {srcProductUrl && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reference Link:</span>
                      <a href={srcProductUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-right max-w-[200px] truncate">
                        {srcProductUrl}
                      </a>
                    </div>
                  )}

                  {srcPhotos.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1.5 font-bold uppercase text-[10px]">Reference Photos ({srcPhotos.length}):</span>
                      <div className="flex gap-2">
                        {srcPhotos.map((p, idx) => (
                          <img key={idx} src={p} alt={`Preview ${idx + 1}`} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-white uppercase text-[11px]">Estimated Sourcing Escrow:</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 text-sm block">
                        ¥{estimatedTotalCNY.toLocaleString()} CNY
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ≈ ${estimatedTotalUSD} USD / ₦{estimatedTotalNGN.toLocaleString()} NGN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explicit Prominent Notice (Phase 2 Requirement) */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Notice: No Wallet Debit at Submission</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    This estimate is not a final quote and no wallet debit occurs at submission. FlyeMass sourcing agents in Guangzhou will inspect the Chinese market and formulate an official binding quotation with verified factory pricing.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 text-[11px] text-indigo-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>FlyeMass China Ground Guarantee</span>
                  </div>
                  <p className="text-slate-400">
                    Your request will be assigned to a bilingual ground sourcing manager in Guangzhou. Once quotation is verified, payment will be held in secure multi-currency escrow until dispatch.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSourcingStep(1)}
                    className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSourcingSubmit}
                    disabled={isSubmittingSourcing}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingSourcing ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Submit Sourcing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: INSPECTION WIZARD (VERIFICATION / AUDIT / QC) ===================== */}
      {activeWizard && activeWizard !== 'sourcing' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <form 
            onSubmit={handleInspectionSubmit} 
            className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Ground Service Booking
                </span>
                <h3 className="text-base font-black text-white">
                  {activeWizard === 'supplier_verification' && 'Supplier Legitimacy Verification'}
                  {activeWizard === 'factory_audit' && 'Physical Factory Inspection & Audit'}
                  {activeWizard === 'quality_control' && 'Pre-Shipment AQL Quality Control'}
                  {activeWizard === 'canton_fair_escort' && 'Canton Fair Escort & Trade Guide'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveWizard(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Product Specifications & Target Quantity */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Product Specifications & Target Volume
                </span>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Product Name / Hardware Commodity
                  </label>
                  <input
                    type="text"
                    value={inspProductName}
                    onChange={(e) => setInspProductName(e.target.value)}
                    placeholder="e.g. 5kW Hybrid Inverters / Lithium Batteries / Industrial Extrusions"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      Product Specifications
                    </label>
                    <input
                      type="text"
                      value={inspProductSpecs}
                      onChange={(e) => setInspProductSpecs(e.target.value)}
                      placeholder="Materials, voltage, packaging, CE/UN38.3 standard"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      Target Quantity
                    </label>
                    <input
                      type="number"
                      value={inspTargetQuantity}
                      onChange={(e) => setInspTargetQuantity(e.target.value)}
                      placeholder="100"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>

                {activeWizard === 'canton_fair_escort' && (
                  <div>
                    <label className="text-[11px] font-bold text-amber-400 uppercase block mb-1">
                      Canton Fair Booth Number / Complex Hall
                    </label>
                    <input
                      type="text"
                      value={inspCantonFairBooth}
                      onChange={(e) => setInspCantonFairBooth(e.target.value)}
                      placeholder="e.g. Area B, Hall 11.2, Booth C38-42"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs font-mono"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Supplier / Factory Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Supplier & Location Information
                </span>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Supplier / Factory Chinese & English Name
                  </label>
                  <input
                    type="text"
                    value={inspSupplierName}
                    onChange={(e) => setInspSupplierName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                {/* City Hub */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Hub City</label>
                    <select
                      value={inspCity}
                      onChange={(e) => setInspCity(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                    >
                      <option value="Guangzhou">Guangzhou (广州)</option>
                      <option value="Shenzhen">Shenzhen (深圳)</option>
                      <option value="Yiwu">Yiwu (义乌)</option>
                      <option value="Foshan">Foshan (佛山)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={inspDate}
                      onChange={(e) => setInspDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Factory Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Factory / Office Address in China</label>
                  <input
                    type="text"
                    value={inspAddress}
                    onChange={(e) => setInspAddress(e.target.value)}
                    placeholder="Industrial Park, Street, District"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                {/* Contact Person & WeChat */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Contact Person & Phone</label>
                    <input
                      type="text"
                      value={inspContact}
                      onChange={(e) => setInspContact(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">WeChat ID</label>
                    <input
                      type="text"
                      value={inspWechat}
                      onChange={(e) => setInspWechat(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Requirements Checklist</label>
                <div className="space-y-1.5 mb-2">
                  {inspRequirements.map((req, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                      <span>{req}</span>
                      <button
                        type="button"
                        onClick={() => setInspRequirements(inspRequirements.filter((_, idx) => idx !== i))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add custom check item (e.g. drop test, moisture check)"
                    className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRequirement.trim()) {
                        setInspRequirements([...inspRequirements, newRequirement.trim()]);
                        setNewRequirement('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-white text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Fixed Fee Preview & Multi-Wallet Payment Option */}
              {(() => {
                const currentFeeUSD = activeWizard === 'supplier_verification' 
                  ? (settings.supplierVerificationUSD || 150)
                  : activeWizard === 'factory_audit' 
                  ? (settings.factoryAuditUSD || 250)
                  : activeWizard === 'canton_fair_escort'
                  ? (settings.cantonFairEscortUSD || 200)
                  : (settings.qualityControlUSD || 200);

                const feeInSelectedCurr = inspWalletCurrency === 'CNY'
                  ? Math.round(currentFeeUSD * usdRate)
                  : Math.round(currentFeeUSD * 1485);

                const currentBal = (userBalances as any)?.[inspWalletCurrency] || 0;
                const hasSufficient = currentBal >= feeInSelectedCurr;

                return (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard Ground Fee:</span>
                        <span className="text-emerald-400 font-mono font-black text-sm">
                          ${currentFeeUSD} USD
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        <span>≈ ₦{(currentFeeUSD * 1485).toLocaleString()} NGN</span>
                        <span className="block text-slate-500">
                          ≈ ¥{Math.round(currentFeeUSD * usdRate).toLocaleString()} CNY
                        </span>
                      </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase block">Payment Method</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setInspPaymentMethod('wallet')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            inspPaymentMethod === 'wallet'
                              ? 'bg-slate-900 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="block text-xs">Pay via Wallet</span>
                          <span className="text-[9px] text-slate-400">Instant Escrow Lock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspPaymentMethod('quote_first')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            inspPaymentMethod === 'quote_first'
                              ? 'bg-slate-900 border-indigo-500 text-indigo-400 font-bold shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="block text-xs">Request Quote First</span>
                          <span className="text-[9px] text-slate-400">Pay on Approval</span>
                        </button>
                      </div>

                      {/* If Wallet Payment: Currency & PIN */}
                      {inspPaymentMethod === 'wallet' && (
                        <div className="space-y-2.5 pt-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Select Debit Vault</span>
                            <div className="grid grid-cols-2 gap-2">
                              {(['NGN', 'CNY'] as const).map(curr => (
                                <button
                                  key={curr}
                                  type="button"
                                  onClick={() => setInspWalletCurrency(curr)}
                                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                                    inspWalletCurrency === curr
                                      ? 'bg-slate-900 border-emerald-500 text-emerald-400 font-bold ring-1 ring-emerald-500/30'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <span className="block font-bold">{curr === 'NGN' ? '🇳🇬 Naira' : '🇨🇳 RMB'}</span>
                                  <span className="text-[10px] font-mono block text-slate-300 mt-0.5">
                                    {curr === 'NGN' ? `₦${(userBalances as any)?.NGN?.toLocaleString()}` :
                                     `¥${(userBalances as any)?.CNY?.toLocaleString()}`}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Required Escrow:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {inspWalletCurrency === 'CNY' ? `¥${feeInSelectedCurr.toLocaleString()} CNY` : `₦${feeInSelectedCurr.toLocaleString()} NGN`}
                            </span>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                              Enter 6-Digit Transaction PIN
                            </label>
                            <input
                              type="password"
                              maxLength={6}
                              value={inspPin}
                              onChange={(e) => setInspPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="••••••"
                              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-white tracking-widest text-lg font-mono outline-none focus:border-emerald-500"
                              required={inspPaymentMethod === 'wallet'}
                            />
                          </div>

                          {!hasSufficient && (
                            <p className="text-[11px] text-rose-400 font-medium">
                              ⚠️ Insufficient {inspWalletCurrency} balance. Please fund your wallet or select another currency.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={isSubmittingInspection}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingInspection ? <span>Processing Booking...</span> : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{inspPaymentMethod === 'wallet' ? 'Pay Booking Fee & Confirm Assignment' : 'Submit Ground Assignment for Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL 3: QUOTATION REVIEW & MULTI-WALLET PAYMENT ===================== */}
      {paymentModalRfq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Official Quotation</span>
                <h3 className="text-sm font-black text-white">Authorize Escrow Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breakdown Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Request Ref:</span>
                <span className="font-mono font-bold text-emerald-400">{paymentModalRfq.reference || paymentModalRfq.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assignment:</span>
                <span className="font-bold text-white max-w-[200px] truncate text-right">{paymentModalRfq.productName}</span>
              </div>

              {/* Sourcing details if available */}
              {paymentModalRfq.productCostCNY && (
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Factory Product Cost:</span>
                  <span className="font-mono text-white">¥{paymentModalRfq.productCostCNY.toLocaleString()} CNY</span>
                </div>
              )}
              {paymentModalRfq.sourcingCommissionCNY && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sourcing Commission ({paymentModalRfq.sourcingCommissionPercent}%):</span>
                  <span className="font-mono text-white">¥{paymentModalRfq.sourcingCommissionCNY.toLocaleString()} CNY</span>
                </div>
              )}
              {paymentModalRfq.chinaShippingCNY && (
                <div className="flex justify-between">
                  <span className="text-slate-400">China Domestic Shipping:</span>
                  <span className="font-mono text-white">¥{paymentModalRfq.chinaShippingCNY.toLocaleString()} CNY</span>
                </div>
              )}

              {/* Total Payable */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white uppercase text-[11px]">Total Escrow Amount:</span>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-base block">
                    {paymentModalRfq.totalPayableCNY 
                      ? `¥${paymentModalRfq.totalPayableCNY.toLocaleString()} CNY` 
                      : `$${paymentModalRfq.quoteAmountUSD} USD`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ ${paymentModalRfq.quoteAmountUSD} USD / ₦{(paymentModalRfq.quoteAmountNGN || paymentModalRfq.quoteAmountUSD * 1485).toLocaleString()} NGN
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                Select Wallet Currency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'USD', balance: userBalances.USD, label: 'USD Wallet' },
                  { id: 'CNY', balance: userBalances.CNY, label: 'CNY Wallet' },
                  { id: 'NGN', balance: userBalances.NGN, label: 'NGN Wallet' }
                ].map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWallet(w.id as any)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      selectedWallet === w.id
                        ? 'bg-slate-800 border-emerald-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-300 block">{w.label}</span>
                    <span className="font-mono text-xs font-black text-white block mt-0.5">
                      {w.id === 'USD' ? `$${w.balance.toLocaleString()}` : w.id === 'CNY' ? `¥${w.balance.toLocaleString()}` : `₦${w.balance.toLocaleString()}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6-Digit PIN Verification Pad */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase block">
                Enter 6-Digit Transaction PIN
              </label>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold border transition-all ${
                      pinInput.length > idx
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {pinInput.length > idx ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPinInput('');
                      else if (k === '⌫') setPinInput(prev => prev.slice(0, -1));
                      else if (pinInput.length < 6) setPinInput(prev => prev + k);
                    }}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm border border-slate-800/80 active:scale-95 transition-all"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Authorize Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment || pinInput.length !== 6}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                pinInput.length === 6 && !isProcessingPayment
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessingPayment ? <span>Authorizing Payment...</span> : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Approve & Pay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: REQUEST DETAILS & TIMELINE DRAWER ===================== */}
      {viewDetailRfq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{viewDetailRfq.reference || viewDetailRfq.id}</span>
                <h3 className="text-base font-black text-white">{viewDetailRfq.productName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Escrow Info */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  {viewDetailRfq.status.replace('_', ' ')}
                </span>
              </div>
              {viewDetailRfq.paymentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Escrow Security:</span>
                  <span className="font-mono text-emerald-400 font-bold uppercase">{viewDetailRfq.paymentStatus}</span>
                </div>
              )}
              {viewDetailRfq.paymentReference && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Payment Reference:</span>
                  <span className="font-mono text-white">{viewDetailRfq.paymentReference}</span>
                </div>
              )}
              {viewDetailRfq.linkedShipmentCode && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-indigo-400 font-bold">Linked Shipment:</span>
                  <span className="font-mono font-bold text-white">{viewDetailRfq.linkedShipmentCode}</span>
                </div>
              )}
            </div>

            {/* Product Specifications / Supplier Info */}
            {viewDetailRfq.specifications && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-400">Specifications:</span>
                <p className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {viewDetailRfq.specifications}
                </p>
              </div>
            )}

            {/* China Ground Operations Findings if any */}
            {(viewDetailRfq.supplierFindings || viewDetailRfq.businessRegistrationFindings || viewDetailRfq.factoryAuditFindings || viewDetailRfq.qualityControlFindings) && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-emerald-400">Ground Agent Findings:</span>
                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-slate-300 space-y-1">
                  {viewDetailRfq.supplierFindings && <p>{viewDetailRfq.supplierFindings}</p>}
                  {viewDetailRfq.businessRegistrationFindings && <p><strong>Registration:</strong> {viewDetailRfq.businessRegistrationFindings}</p>}
                  {viewDetailRfq.factoryAuditFindings && <p><strong>Factory Audit:</strong> {viewDetailRfq.factoryAuditFindings}</p>}
                  {viewDetailRfq.qualityControlFindings && <p><strong>Quality Control:</strong> {viewDetailRfq.qualityControlFindings}</p>}
                </div>
              </div>
            )}

            {/* Timeline Stepper */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Timeline Progression</span>
              <div className="space-y-3 pl-2 border-l-2 border-emerald-500/30">
                {(viewDetailRfq.timeline || [
                  { status: 'Submitted', location: 'Mobile App', timestamp: viewDetailRfq.createdAt, notes: 'Request queued for China Desk review' }
                ]).map((tl, i) => (
                  <div key={i} className="relative pl-3 text-xs">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between">
                      <strong className="text-white capitalize">{tl.status.replace('_', ' ')}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(tl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tl.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: SUBMISSION CONFIRMATION MODAL ===================== */}
      {submittedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                {submittedRfq.reference || submittedRfq.id}
              </span>
              <h3 className="text-base font-black text-white mt-0.5">Sourcing Request Submitted!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your request for <strong>{submittedRfq.productName}</strong> ({submittedRfq.targetQuantity} units) has been assigned to our China sourcing desk.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-left space-y-1">
              <div className="flex justify-between">
                <span>Target Unit:</span>
                <span className="font-mono text-white">¥{submittedRfq.targetUnitCNY} CNY</span>
              </div>
              <div className="flex justify-between">
                <span>Target Budget:</span>
                <span className="font-mono text-white">¥{submittedRfq.totalBudgetCNY?.toLocaleString()} CNY</span>
              </div>
              <p className="text-slate-500 pt-1 border-t border-slate-800 text-[10px]">
                You will receive an in-app notification when your factory quote is formulated.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSubmittedRfq(null);
                  setActiveTab('my_requests');
                  setFilterStatus('all');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open My Requests</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRfq(null);
                  setSrcProductName('');
                  setSrcProductUrl('');
                  setSrcSpecs('');
                  setSourcingStep(1);
                  setActiveWizard('sourcing');
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
