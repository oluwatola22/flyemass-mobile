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
  Building,
  RefreshCw,
  Phone,
  MessageSquare,
  ShieldAlert,
  Award,
  Layers,
  ChevronDown,
  Copy,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

export const AgentServiceScreen: React.FC = () => {
  const { showToast, navigate, activeUserId, userProfile } = useApp();

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'overview' | 'my_requests' | 'desks'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_review' | 'quotation_sent' | 'paid_active' | 'completed' | 'action_needed' | 'active'>('all');
  const [selectedCityDesk, setSelectedCityDesk] = useState<'all' | 'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('all');

  // Requests State
  const [requests, setRequests] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [settings, setSettings] = useState<any>({
    sourcingCommissionPercent: 5.0,
    minSourcingCommissionCNY: 500,
    supplierVerificationUSD: 150,
    factoryAuditUSD: 250,
    qualityControlUSD: 200,
    cantonFairEscortUSD: 200
  });

  // Modal & Sheet States
  const [activeWizard, setActiveWizard] = useState<AgentServiceKind | null>(null);
  const [sourcingStep, setSourcingStep] = useState<1 | 2>(1);
  const [paymentModalRfq, setPaymentModalRfq] = useState<AgentRequestDocument | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'USD' | 'NGN' | 'CNY'>('CNY');
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

  // Inspection & Ground Booking Form State
  const [inspProductName, setInspProductName] = useState('Industrial Machinery & High-Capacity Lithium Cells');
  const [inspProductSpecs, setInspProductSpecs] = useState('51.2V 100Ah LiFePO4 cells, laser welded busbars, UN38.3 & CE certification');
  const [inspTargetQuantity, setInspTargetQuantity] = useState('100');
  const [inspCantonFairBooth, setInspCantonFairBooth] = useState('Area B, Hall 11.2, Booth C38-42');
  const [inspSupplierName, setInspSupplierName] = useState('Shenzhen Huaqiangbei Microelectronics Ltd');
  const [inspCity, setInspCity] = useState<'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('Shenzhen');
  const [inspAddress, setInspAddress] = useState('Building 4, Science & Technology Park, Nanshan, Shenzhen');
  const [inspContact, setInspContact] = useState('Manager Li / +86 138 2008 7711');
  const [inspWechat, setInspWechat] = useState('sz_micro_li');
  const [inspDate, setInspDate] = useState('2026-11-20');
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

  // Subscribe to DB & load settings with stabilization equality check
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
    if (selectedCityDesk !== 'all' && r.supplierCity !== selectedCityDesk) return false;
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
        serviceType: 'Product Sourcing & Purchasing',
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
      sourcing: 'Product Sourcing & Purchasing',
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
      await db.acceptAgentQuote(paymentModalRfq.id, pinInput, selectedWallet, uid);
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

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    }
  };

  // China On-Ground Hubs Data
  const CHINA_HUBS = [
    {
      city: 'Guangzhou',
      nameZh: '广州总指挥部',
      hubTitle: 'Pazhou & Baiyun Trade Desk',
      address: 'Tower B, Poly World Trade Center, Pazhou, Haizhu District',
      focus: 'Canton Fair Escorts, Factory Sourcing, Apparel, Audio & Air Logistics',
      agentsCount: 14,
      leadAgent: 'Zhang Wei (Lead Sourcing Specialist)',
      languages: 'Mandarin, Cantonese, English',
      rating: 4.98
    },
    {
      city: 'Shenzhen',
      nameZh: '深圳前海专区',
      hubTitle: 'Huaqiangbei & Bao\'an Tech Desk',
      address: 'SEG Plaza Tower, Huaqiang North, Futian District, Shenzhen',
      focus: 'Electronics, Lithium Batteries, CNC Precision & High-Tech Hardware',
      agentsCount: 11,
      leadAgent: 'Lin Feng (Senior QA Engineer)',
      languages: 'Mandarin, Cantonese, English',
      rating: 4.96
    },
    {
      city: 'Yiwu',
      nameZh: '义乌小商品总局',
      hubTitle: 'Futian International Market Hub',
      address: 'District 4, Yiwu International Trade City, Chouzhou North Rd',
      focus: 'Small Commodities, Hardware, FMCG, Home Essentials & Container Consolidation',
      agentsCount: 9,
      leadAgent: 'Liu Bo (Senior Trade Agent)',
      languages: 'Mandarin, English',
      rating: 4.95
    },
    {
      city: 'Foshan',
      nameZh: '佛山工业中心',
      hubTitle: 'Lecong Furniture & Ceramics Desk',
      address: 'Louvre International Furniture Exhibition Center, Shunde',
      focus: 'Luxury Furniture, Building Materials, Sanitaryware & Factory Audits',
      agentsCount: 7,
      leadAgent: 'Chen Xia (Industrial Inspector)',
      languages: 'Mandarin, Cantonese, English',
      rating: 4.97
    }
  ];

  return (
    <div className="min-h-full pb-32 bg-slate-950 text-white">
      <Header title="China Agents & Sourcing" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        
        {/* ========================================================================= */}
        {/* LUXURY STATUS CARD: ON-GROUND CHINA DESK BEACON */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl overflow-hidden">
          {/* Subtle luxury ambient backlight */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
                  China Ground Ops Live
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-slate-300">Guangzhou • Shenzhen • Yiwu</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Bilingual On-Ground Agents & Escrow
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct factory inspections, 1688 wholesale price negotiations, and physical quality audits across mainland China manufacturing corridors.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Active Agents</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">41 On-Ground</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Escrow Security</span>
                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">100% Protected</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Turnaround</span>
                <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">24–48 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NATIVE SEGMENTED NAVIGATION CONTROLS */}
        {/* ========================================================================= */}
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-3 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Services & Sourcing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_requests')}
            className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all relative flex items-center justify-center gap-1.5 ${
              activeTab === 'my_requests'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Agent Requests</span>
            {myRequests.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'my_requests' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {myRequests.length}
              </span>
            )}
            {actionNeededCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desks')}
            className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'desks'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>China Desks</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SERVICES & SOURCING CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Status KPI Summary */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('pending_review'); }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group"
              >
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Pending</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block group-hover:text-emerald-400">
                  {pendingReviewCount}
                </span>
                <span className="text-[9px] text-slate-500 block">Reviewing</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('quotation_sent'); }}
                className={`p-3 rounded-2xl border text-center transition-all group ${
                  quotationSentCount > 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider block">Quoted</span>
                <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                  {quotationSentCount}
                </span>
                <span className="text-[9px] text-amber-300/80 block">Payable</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('paid_active'); }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group"
              >
                <span className="text-[10px] text-indigo-400 uppercase font-semibold tracking-wider block">Active</span>
                <span className="text-base font-bold text-indigo-400 font-mono mt-0.5 block">
                  {paidActiveCount}
                </span>
                <span className="text-[9px] text-slate-400 block">Ground Ops</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('completed'); }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group"
              >
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Done</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block group-hover:text-emerald-400">
                  {completedCount}
                </span>
                <span className="text-[9px] text-slate-500 block">Reports</span>
              </button>
            </div>

            {/* Service Cards Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div>
                <h3 className="text-sm font-bold text-white">Select Ground Assignment</h3>
                <p className="text-[11px] text-slate-400">Direct execution by local bilingual trade officers</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Escrow Protected
              </span>
            </div>

            {/* SERVICE CARD 1: PRODUCT SOURCING & PURCHASING */}
            <div 
              onClick={() => { setActiveWizard('sourcing'); setSourcingStep(1); }}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Product Sourcing & Purchasing
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {settings.sourcingCommissionPercent}% Fee
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Source directly on 1688, Taobao, Alibaba, or Pinduoduo. We negotiate direct manufacturer pricing, purchase samples, and coordinate China freight.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Min. commission: ¥{settings.minSourcingCommissionCNY} CNY</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Start Sourcing Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 2: PHYSICAL FACTORY AUDIT */}
            <div 
              onClick={() => setActiveWizard('factory_audit')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Physical Factory Audit
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                        ${settings.factoryAuditUSD} USD Fixed
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      On-the-ground visit to factory workshops. Inspect production machinery, verify manufacturing capacity, worker conditions, and real output capability.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Deliverable: Comprehensive PDF Audit Report + HD Video</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <span>Book Factory Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 3: CANTON FAIR ESCORT & TRADE GUIDE */}
            <div 
              onClick={() => setActiveWizard('canton_fair_escort')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Canton Fair Escort & Trade Guide
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                        ${settings.cantonFairEscortUSD || 200} USD / Day
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bilingual ground agent escort at Canton Fair (Guangzhou Pazhou Complex). Live English-Chinese translation, booth negotiation, catalog compilation, and supplier vetting.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Deliverable: Verified Booth Reports & Supplier Dossier</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <span>Book Fair Escort</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 4: SUPPLIER LEGITIMACY VERIFICATION */}
            <div 
              onClick={() => setActiveWizard('supplier_verification')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        Supplier Legitimacy Verification
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                        ${settings.supplierVerificationUSD} USD Fixed
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      National Enterprise Credit Information check, Unified Social Credit Code verification, business license validation, and physical office check.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Deliverable: Official Verification Certificate</span>
                <span className="font-semibold text-indigo-400 flex items-center gap-1">
                  <span>Verify Supplier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 5: PRE-SHIPMENT QUALITY CONTROL */}
            <div 
              onClick={() => setActiveWizard('quality_control')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
                        Pre-Shipment Quality Control (QC)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold">
                        ${settings.qualityControlUSD} USD Fixed
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ANSI/ASQ Z1.4 (ISO 2859-1) AQL sampling inspection before final dispatch. Defect tolerance check, carton drop tests, barcode and label verification.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Deliverable: AQL Inspection Certificate & Defect Log</span>
                <span className="font-semibold text-teal-400 flex items-center gap-1">
                  <span>Book QC Inspection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY AGENT REQUESTS & ACTIVE MISSIONS */}
        {/* ========================================================================= */}
        {activeTab === 'my_requests' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'all', label: `All (${myRequests.length})` },
                { id: 'pending_review', label: `Pending Review (${pendingReviewCount})` },
                { id: 'quotation_sent', label: `Quotation Sent (${quotationSentCount})` },
                { id: 'paid_active', label: `Paid & Active (${paidActiveCount})` },
                { id: 'completed', label: `Completed (${completedCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterStatus === f.id || (f.id === 'quotation_sent' && filterStatus === 'action_needed') || (f.id === 'paid_active' && filterStatus === 'active')
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* City Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
              <span className="text-slate-500 font-medium mr-1">City Hub:</span>
              {['all', 'Guangzhou', 'Shenzhen', 'Yiwu', 'Foshan'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCityDesk(city as any)}
                  className={`px-2.5 py-1 rounded-lg border transition-all capitalize ${
                    selectedCityDesk === city
                      ? 'bg-white/10 border-white/30 text-white font-bold'
                      : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No requests found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Submit a product sourcing inquiry or book a physical factory audit to begin working with our on-ground team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab('overview'); setActiveWizard('sourcing'); }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <span>Start New Sourcing Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(rfq => {
                  const isAwaitingPayment = rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent';
                  const isPaidActive = rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved';
                  const isCompleted = rfq.status === 'completed';

                  return (
                    <div
                      key={rfq.id}
                      className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(rfq.reference || rfq.id, 'Reference')}
                            className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
                          >
                            <span>{rfq.reference || rfq.id}</span>
                            <Copy className="w-3 h-3 text-slate-500" />
                          </button>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-xs text-slate-400 font-medium">{rfq.supplierCity || 'Guangzhou'}</span>
                        </div>

                        {/* Status Tag */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : isAwaitingPayment
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse'
                            : isPaidActive
                            ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}>
                          {rfq.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title & Service Details */}
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{rfq.productName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{rfq.serviceType}</p>
                      </div>

                      {/* Visual Milestone Stepper */}
                      <div className="py-2 px-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span className="text-emerald-400 font-bold">1. Logged</span>
                          <span className={rfq.assignedAgent || isPaidActive || isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            2. Agent Assigned
                          </span>
                          <span className={isPaidActive || isCompleted ? 'text-indigo-400 font-bold' : 'text-slate-600'}>
                            3. Field Visit
                          </span>
                          <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            4. Report Ready
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full w-1/4" />
                          <div className={`h-full w-1/4 transition-all ${rfq.assignedAgent || isPaidActive || isCompleted ? 'bg-emerald-500' : 'bg-transparent'}`} />
                          <div className={`h-full w-1/4 transition-all ${isPaidActive || isCompleted ? 'bg-indigo-500' : 'bg-transparent'}`} />
                          <div className={`h-full w-1/4 transition-all ${isCompleted ? 'bg-emerald-400' : 'bg-transparent'}`} />
                        </div>
                      </div>

                      {/* Price / Quote Summary */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Escrow / Fee</span>
                          <span className="text-sm font-bold text-white font-mono">
                            {rfq.totalPayableCNY 
                              ? `¥${rfq.totalPayableCNY.toLocaleString()} CNY`
                              : rfq.quoteAmountUSD
                              ? `$${rfq.quoteAmountUSD} USD`
                              : rfq.serviceFeeUSD
                              ? `$${rfq.serviceFeeUSD} USD`
                              : 'Pending Quote'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewDetailRfq(rfq)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
                          >
                            Dossier
                          </button>

                          {isAwaitingPayment && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentModalRfq(rfq);
                                setPinInput('');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Review & Pay Quotation</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CHINA ON-GROUND NETWORK DESKS */}
        {/* ========================================================================= */}
        {activeTab === 'desks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">FlyeMass Mainland Operations Hubs</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct regional offices with full-time bilingual trade officers, certified factory inspectors, and warehouse loading docks.
              </p>
            </div>

            <div className="space-y-3">
              {CHINA_HUBS.map((hub) => (
                <div
                  key={hub.city}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{hub.city} Desk</span>
                        <span className="text-xs text-emerald-400 font-mono font-medium">{hub.nameZh}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-300 mt-0.5">{hub.hubTitle}</h4>
                    </div>

                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {hub.agentsCount} Officers On-Duty
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{hub.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Coverage:</strong> {hub.focus}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">Officer Lead: <strong className="text-white">{hub.leadAgent}</strong></span>
                      <span className="text-emerald-400 font-medium">★ {hub.rating}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInspCity(hub.city as any);
                      setActiveWizard('factory_audit');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Dispatch Agent in {hub.city}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PRODUCT SOURCING WIZARD */}
      {/* ========================================================================= */}
      {activeWizard === 'sourcing' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Step {sourcingStep} of 2
                </span>
                <h3 className="text-base font-bold text-white">
                  {sourcingStep === 1 ? 'Product Sourcing Details' : 'Quotation & Fee Review'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveWizard(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Details */}
            {sourcingStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Product Title / Description
                  </label>
                  <input
                    type="text"
                    value={srcProductName}
                    onChange={(e) => setSrcProductName(e.target.value)}
                    placeholder="e.g. Wireless ANC Bluetooth Headphones with Custom Box"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    1688 / Taobao / Alibaba / Pinduoduo Link
                  </label>
                  <input
                    type="url"
                    value={srcProductUrl}
                    onChange={(e) => setSrcProductUrl(e.target.value)}
                    placeholder="https://detail.1688.com/offer/..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {['1688', 'Taobao', 'Alibaba', 'Pinduoduo'].map(plat => (
                      <span key={plat} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-medium">
                        {plat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Quantity</label>
                    <input
                      type="number"
                      value={srcQuantity}
                      onChange={(e) => setSrcQuantity(e.target.value)}
                      min="1"
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
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
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>

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

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Specifications & Packaging</label>
                  <textarea
                    value={srcSpecs}
                    onChange={(e) => setSrcSpecs(e.target.value)}
                    rows={2}
                    placeholder="Color, materials, custom logo requirements, gift box packaging..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block">
                      Reference Photos ({srcPhotos.length}/4)
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Max 4 photos</span>
                  </div>

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
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={srcNewPhotoUrl}
                        onChange={(e) => setSrcNewPhotoUrl(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (srcNewPhotoUrl.trim()) {
                            setSrcPhotos([...srcPhotos, srcNewPhotoUrl.trim()]);
                            setSrcNewPhotoUrl('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!srcProductName.trim()) {
                      showToast('Please enter the product name', 'error');
                      return;
                    }
                    setSourcingStep(2);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Sourcing Escrow Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Review & Submit */}
            {sourcingStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Product:</span>
                    <span className="font-bold text-white text-right max-w-[200px] truncate">{srcProductName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Quantity:</span>
                    <span className="font-mono text-white">{qty} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Goods Cost:</span>
                    <span className="font-mono text-white">¥{totalProductCNY.toLocaleString()} CNY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sourcing Commission ({commissionPercent}%):</span>
                    <span className="font-mono text-emerald-400">¥{estimatedCommissionCNY.toLocaleString()} CNY</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-white uppercase text-[11px]">Total Estimated Escrow:</span>
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

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>FlyeMass Trade Escrow Guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Submitting this RFQ sends it directly to our Guangzhou sourcing desk. An official manufacturer quotation will be prepared within 24 hours. No wallet deduction occurs until you review and approve the final quote.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSourcingStep(1)}
                    className="w-1/3 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSourcingSubmit}
                    disabled={isSubmittingSourcing}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingSourcing ? <span>Submitting RFQ...</span> : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Sourcing Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INSPECTION & GROUND BOOKING WIZARD */}
      {/* ========================================================================= */}
      {activeWizard && activeWizard !== 'sourcing' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Ground Mission Dispatch
                </span>
                <h3 className="text-base font-bold text-white">
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

            <form onSubmit={handleInspectionSubmit} className="space-y-3.5 text-xs">
              
              {/* Product Specifications */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Product Specifications & Scope
                </label>
                <input
                  type="text"
                  value={inspProductSpecs}
                  onChange={(e) => setInspProductSpecs(e.target.value)}
                  placeholder="e.g. 51.2V 100Ah LiFePO4 cells with CE & UN38.3 report"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              {/* Target Quantity & Canton Fair Booth */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Target Quantity
                  </label>
                  <input
                    type="number"
                    value={inspTargetQuantity}
                    onChange={(e) => setInspTargetQuantity(e.target.value)}
                    min="1"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Hub City</label>
                  <select
                    value={inspCity}
                    onChange={(e) => setInspCity(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                  >
                    <option value="Guangzhou">Guangzhou (广州)</option>
                    <option value="Shenzhen">Shenzhen (深圳)</option>
                    <option value="Yiwu">Yiwu (义乌)</option>
                    <option value="Foshan">Foshan (佛山)</option>
                  </select>
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
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-white outline-none focus:border-amber-500 text-xs font-mono"
                    required
                  />
                </div>
              )}

              {/* Supplier & Location Information */}
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

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Factory / Office Address in China
                  </label>
                  <input
                    type="text"
                    value={inspAddress}
                    onChange={(e) => setInspAddress(e.target.value)}
                    placeholder="Industrial Park, Street, District"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

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

              {/* Requirements Checklist */}
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

              {/* Payment Mode & Debit Vault */}
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

                    <div className="pt-2 border-t border-slate-800 space-y-2">
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
                              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-base tracking-[0.4em] text-white outline-none focus:border-emerald-500"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={isSubmittingInspection}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingInspection ? <span>Dispatching Mission...</span> : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Authorize On-Ground Assignment</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUOTATION REVIEW & PAY ESCROW */}
      {/* ========================================================================= */}
      {paymentModalRfq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Quotation Review</span>
                <h3 className="text-base font-bold text-white">Approve & Pay Escrow</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Request Ref:</span>
                <span className="font-mono font-bold text-emerald-400">{paymentModalRfq.reference || paymentModalRfq.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assignment:</span>
                <span className="font-bold text-white max-w-[200px] truncate text-right">{paymentModalRfq.productName}</span>
              </div>

              {paymentModalRfq.productCostCNY && (
                <div className="flex justify-between pt-1 border-t border-slate-800">
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

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white uppercase text-[11px]">Total Escrow Amount:</span>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm block">
                    {paymentModalRfq.totalPayableCNY 
                      ? `¥${paymentModalRfq.totalPayableCNY.toLocaleString()} CNY` 
                      : `$${paymentModalRfq.quoteAmountUSD} USD`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ ${paymentModalRfq.quoteAmountUSD} USD / ₦{(paymentModalRfq.quoteAmountNGN || (paymentModalRfq.quoteAmountUSD || 0) * 1485).toLocaleString()} NGN
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Selector (Multi-Currency NGN, USD, CNY) */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                Select Wallet Currency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CNY', balance: userBalances.CNY, label: 'CNY / RMB' },
                  { id: 'NGN', balance: userBalances.NGN, label: 'NGN Wallet' },
                  { id: 'USD', balance: userBalances.USD, label: 'USD Wallet' }
                ].map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWallet(w.id as any)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      selectedWallet === w.id
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-300 block">{w.label}</span>
                    <span className="font-mono text-xs font-bold text-white block mt-0.5">
                      {w.id === 'USD' ? `$${w.balance.toLocaleString()}` : w.id === 'CNY' ? `¥${w.balance.toLocaleString()}` : `₦${w.balance.toLocaleString()}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6-Digit PIN Pad */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase block text-center">
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

              <div className="grid grid-cols-3 gap-1.5 pt-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPinInput('');
                      else if (k === '⌫') setPinInput(prev => prev.slice(0, -1));
                      else if (pinInput.length < 6) setPinInput(prev => prev + k);
                    }}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm border border-slate-800 active:scale-95 transition-all"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment || pinInput.length !== 6}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                pinInput.length === 6 && !isProcessingPayment
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
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

      {/* ========================================================================= */}
      {/* MODAL 4: REQUEST DETAIL & TIMELINE DRAWER */}
      {/* ========================================================================= */}
      {viewDetailRfq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400 block">{viewDetailRfq.reference || viewDetailRfq.id}</span>
                <h3 className="text-base font-bold text-white">{viewDetailRfq.productName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
              {viewDetailRfq.assignedAgent && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Ground Agent:</span>
                  <span className="font-bold text-white">{viewDetailRfq.assignedAgent}</span>
                </div>
              )}
              {viewDetailRfq.linkedShipmentCode && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-indigo-400 font-bold">Linked Shipment:</span>
                  <span className="font-mono font-bold text-white">{viewDetailRfq.linkedShipmentCode}</span>
                </div>
              )}
            </div>

            {viewDetailRfq.specifications && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-400">Specifications:</span>
                <p className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {viewDetailRfq.specifications}
                </p>
              </div>
            )}

            {(viewDetailRfq.supplierFindings || viewDetailRfq.businessRegistrationFindings || viewDetailRfq.factoryAuditFindings || viewDetailRfq.qualityControlFindings) && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-emerald-400">Ground Agent Findings:</span>
                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-slate-300 space-y-1">
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

      {/* ========================================================================= */}
      {/* MODAL 5: SUBMISSION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {submittedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                {submittedRfq.reference || submittedRfq.id}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Sourcing Request Submitted!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your request for <strong>{submittedRfq.productName}</strong> ({submittedRfq.targetQuantity} units) has been assigned to our China sourcing desk.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
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
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
