import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { AgentRequestDocument, AgentServiceKind } from '../../types';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Search, 
  ShieldCheck, 
  Users, 
  Building, 
  ClipboardList, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Clock, 
  FileText, 
  Layers, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Wallet,
  Check,
  X,
  Award,
  Phone,
  UserCheck,
  Package,
  Calendar,
  Camera,
  Upload,
  CheckCircle,
  ChevronDown,
  Copy,
  SlidersHorizontal,
  Compass,
  ArrowLeft
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

  // Dedicated Service Page State
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

  // Handle smooth return back to China Agent Hub without navigating to home
  const handleBackToHub = () => {
    setActiveWizard(null);
    setSourcingStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Dedicated Open Service Page Handler
  const handleOpenService = (service: AgentServiceKind) => {
    // Supplier verification is removed from mobile app per policy and retained on Admin console
    if (service === 'supplier_verification') {
      showToast('Supplier Verification is currently managed exclusively via Enterprise Admin console', 'info');
      return;
    }
    setActiveWizard(service);
    if (service === 'sourcing') setSourcingStep(1);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ agentService: service }, '', window.location.href);
      } catch (_) {}
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Browser / Device popstate listener: intercepts Back button so user returns to Agent Hub
  useEffect(() => {
    const handlePopState = () => {
      if (activeWizard) {
        setActiveWizard(null);
        setSourcingStep(1);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      } else if (paymentModalRfq) {
        setPaymentModalRfq(null);
      } else if (viewDetailRfq) {
        setViewDetailRfq(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeWizard, paymentModalRfq, viewDetailRfq]);

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
      setActiveTab('my_requests');
      setFilterStatus('all');
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

  // User Balances
  const userBalances = db.getUser(uid)?.balances || { USD: 42890.50, NGN: 28450200, CNY: 184250 };

  // China On-Ground Hubs Data
  const CHINA_HUBS = [
    {
      city: 'Guangzhou',
      nameZh: '广州总指挥部',
      hubTitle: 'Pazhou & Baiyun Trade Desk',
      address: 'Tower B, Poly World Trade Center, Pazhou, Haizhu District',
      focus: 'Canton Fair Pavilion, Fabric & Garment Wholesale, Electronics & Airport Logistics',
      agentsCount: 14,
      leadAgent: 'Zhang Wei (Lead Sourcing Director)',
      languages: 'Mandarin, Cantonese, English',
      rating: 4.98
    },
    {
      city: 'Shenzhen',
      nameZh: '深圳技术分局',
      hubTitle: 'Huaqiangbei & Nanshan Hardware Hub',
      address: 'SEG Plaza Tower 38F, Huaqiang North Road, Futian District',
      focus: 'Microelectronics, PCBA, Smart Gadgets, Drone Hardware & Lithium Batteries',
      agentsCount: 11,
      leadAgent: 'Lin Fang (Tech QA Inspector)',
      languages: 'Mandarin, English',
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

  // =========================================================================
  // SUBPAGE 1: DEDICATED PRODUCT SOURCING & PURCHASING PAGE
  // =========================================================================
  if (activeWizard === 'sourcing') {
    return (
      <div className="min-h-full pb-32 bg-slate-950 text-white animate-in fade-in duration-200">
        <Header 
          title="Product Sourcing & Purchasing" 
          onBack={handleBackToHub} 
        />

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Easy Return Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToHub}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span>Back to Agent Hub</span>
            </button>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 whitespace-nowrap font-mono">
              Escrow Protected
            </span>
          </div>

          {/* Sourcing Hero Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono whitespace-nowrap">
                    {settings.sourcingCommissionPercent}% Fee
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Min. ¥{settings.minSourcingCommissionCNY} CNY</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-snug">Product Sourcing & Purchasing</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Direct factory price negotiation & sample consolidation across 1688 and Taobao</p>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSourcingStep(1)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  sourcingStep === 1
                    ? 'bg-slate-950 border-emerald-500 text-white font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[10px] text-emerald-400 block uppercase font-mono">Step 1</span>
                <span className="truncate block font-medium">Specifications & Target</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (srcProductName.trim()) setSourcingStep(2);
                  else showToast('Enter product name first', 'error');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  sourcingStep === 2
                    ? 'bg-slate-950 border-emerald-500 text-white font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[10px] text-emerald-400 block uppercase font-mono">Step 2</span>
                <span className="truncate block font-medium">Quotation & Review</span>
              </button>
            </div>
          </div>

          {/* STEP 1: SPECIFICATIONS & TARGET COST */}
          {sourcingStep === 1 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Item Identification</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Product Title / Name
                  </label>
                  <input
                    type="text"
                    value={srcProductName}
                    onChange={(e) => setSrcProductName(e.target.value)}
                    placeholder="e.g. Wireless ANC Headphones with Custom Box"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    1688 / Taobao / Alibaba Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={srcProductUrl}
                    onChange={(e) => setSrcProductUrl(e.target.value)}
                    placeholder="https://detail.1688.com/offer/..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
                    {['1688', 'Taobao', 'Alibaba', 'Pinduoduo'].map(plat => (
                      <span key={plat} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-medium whitespace-nowrap">
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
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Unit (CNY ¥)</label>
                    <input
                      type="number"
                      value={srcTargetUnitCNY}
                      onChange={(e) => setSrcTargetUnitCNY(e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Specifications & Photos */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Customization & Details</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Technical Specifications & Custom Packaging
                  </label>
                  <textarea
                    rows={3}
                    value={srcSpecs}
                    onChange={(e) => setSrcSpecs(e.target.value)}
                    placeholder="Specify materials, colorways, logo engraving, or individual blister packaging..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                    Sample / Reference Photos
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {srcPhotos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 group">
                        <img src={photo} alt="Ref" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSrcPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {srcPhotos.length < 3 && (
                      <div className="aspect-square rounded-2xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 p-2 flex flex-col items-center justify-center text-center">
                        <Camera className="w-5 h-5 text-slate-500 mb-1" />
                        <input
                          type="text"
                          placeholder="Paste URL & Enter"
                          value={srcNewPhotoUrl}
                          onChange={(e) => setSrcNewPhotoUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && srcNewPhotoUrl.trim()) {
                              e.preventDefault();
                              setSrcPhotos(prev => [...prev, srcNewPhotoUrl.trim()]);
                              setSrcNewPhotoUrl('');
                            }
                          }}
                          className="w-full text-[9px] bg-transparent text-slate-300 outline-none text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Cost Estimation Card */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-emerald-500/20 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Total Factory Product Value:</span>
                  <span className="font-mono font-bold text-white">¥{totalProductCNY.toLocaleString()} CNY</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Sourcing Fee ({settings.sourcingCommissionPercent}%):</span>
                  <span className="font-mono font-bold text-emerald-400">¥{estimatedCommissionCNY.toLocaleString()} CNY</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Estimated Upfront Requirement:</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-sm block">
                      ¥{estimatedTotalCNY.toLocaleString()} CNY
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ ${estimatedTotalUSD} USD / ₦{estimatedTotalNGN.toLocaleString()} NGN
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBackToHub}
                  className="w-1/3 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!srcProductName.trim()) {
                      showToast('Please enter the product name to proceed', 'error');
                      return;
                    }
                    setSourcingStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-2/3 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Quotation Review</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: QUOTATION & REVIEW */}
          {sourcingStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sourcing Mission Specification</span>
                </h3>

                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Target Item:</span>
                    <strong className="text-white text-right truncate max-w-[200px]">{srcProductName}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Order Quantity:</span>
                    <strong className="text-white font-mono text-right">{qty.toLocaleString()} units</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Target Unit Price:</span>
                    <strong className="text-white font-mono text-right">¥{unitCNY} CNY / unit</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Hub Assignment:</span>
                    <strong className="text-emerald-400 text-right">Guangzhou Central Procurement Desk</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Flyemass Sourcing Protection Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Once submitted, our on-ground sourcing agents will negotiate directly with licensed factory heads, request official counter-samples, verify CE/FCC certifications, and forward an itemized invoice for your wallet approval.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSourcingStep(1)}
                  className="w-1/3 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center text-center cursor-pointer"
                >
                  Back to Step 1
                </button>
                <button
                  type="button"
                  onClick={handleSourcingSubmit}
                  disabled={isSubmittingSourcing}
                  className="w-2/3 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSourcing ? (
                    <span>Submitting Sourcing Request...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Confirm & Submit Sourcing Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUBPAGE 2: DEDICATED GROUND MISSION & INSPECTION PAGE
  // =========================================================================
  if (activeWizard) {
    const serviceTitles: Record<AgentServiceKind, string> = {
      sourcing: 'Product Sourcing & Purchasing',
      supplier_verification: 'Supplier Legitimacy Verification',
      factory_audit: 'Physical Factory Audit',
      quality_control: 'Pre-Shipment Quality Control (QC)',
      canton_fair_escort: 'Canton Fair Escort & Trade Guide'
    };

    const currentFeeUSD = activeWizard === 'supplier_verification' 
      ? (settings.supplierVerificationUSD || 150)
      : activeWizard === 'factory_audit' 
      ? (settings.factoryAuditUSD || 250)
      : activeWizard === 'canton_fair_escort'
      ? (settings.cantonFairEscortUSD || 200)
      : (settings.qualityControlUSD || 200);

    const feeInSelectedCurr = inspWalletCurrency === 'CNY'
      ? Math.round(currentFeeUSD * usdRate)
      : Math.round(currentFeeUSD * usdRate * ngnRate);

    return (
      <div className="min-h-full pb-32 bg-slate-950 text-white animate-in fade-in duration-200">
        <Header 
          title={serviceTitles[activeWizard]} 
          onBack={handleBackToHub} 
        />

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Easy Return Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToHub}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span>Back to Agent Hub</span>
            </button>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 whitespace-nowrap font-mono">
              Escrow Protected
            </span>
          </div>

          {/* Service Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                {activeWizard === 'factory_audit' && <ShieldCheck className="w-5 h-5" />}
                {activeWizard === 'canton_fair_escort' && <Users className="w-5 h-5" />}
                {activeWizard === 'supplier_verification' && <Building className="w-5 h-5" />}
                {activeWizard === 'quality_control' && <ClipboardList className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono whitespace-nowrap">
                    ${currentFeeUSD} USD Fixed
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold font-mono">100% Escrow</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-snug">{serviceTitles[activeWizard]}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeWizard === 'factory_audit' && 'Comprehensive physical factory inspection, machine review & capacity audit'}
                  {activeWizard === 'canton_fair_escort' && 'Bilingual trade escort & catalog negotiation at Guangzhou Pazhou Complex'}
                  {activeWizard === 'supplier_verification' && 'Official National Enterprise Credit & business license validation'}
                  {activeWizard === 'quality_control' && 'AQL sampling, carton drop test & detailed photographic QC report'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] whitespace-nowrap">Turnaround SLA: 24–48 Hours</span>
              <span className="text-emerald-400 font-semibold text-[11px] whitespace-nowrap">Inspection Report Delivered</span>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleInspectionSubmit} className="space-y-4 text-xs">
            {/* Section 1: Product & Specifications */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Product Specifications & Scope</span>
              </h3>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Product Details / Name
                </label>
                <input
                  type="text"
                  value={inspProductName}
                  onChange={(e) => setInspProductName(e.target.value)}
                  placeholder="e.g. Industrial Machinery & High-Capacity Lithium Cells"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Product Specifications & Scope
                </label>
                <textarea
                  rows={2}
                  value={inspProductSpecs}
                  onChange={(e) => setInspProductSpecs(e.target.value)}
                  placeholder="e.g. 51.2V 100Ah LiFePO4 cells with CE & UN38.3 report"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs resize-none leading-relaxed"
                  required
                />
              </div>

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
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Hub City</label>
                  <select
                    value={inspCity}
                    onChange={(e) => setInspCity(e.target.value as any)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
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
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-amber-500/40 text-white outline-none focus:border-amber-500 text-xs font-mono"
                    required
                  />
                </div>
              )}
            </div>

            {/* Section 2: Factory & Supplier Logistics */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Supplier / Factory Location</span>
              </h3>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Supplier / Factory Entity Name
                </label>
                <input
                  type="text"
                  value={inspSupplierName}
                  onChange={(e) => setInspSupplierName(e.target.value)}
                  placeholder="e.g. Shenzhen Huaqiangbei Microelectronics Ltd"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Factory / Warehouse Location Address
                </label>
                <input
                  type="text"
                  value={inspAddress}
                  onChange={(e) => setInspAddress(e.target.value)}
                  placeholder="e.g. Building 4, Science & Technology Park, Nanshan"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Contact & Phone
                  </label>
                  <input
                    type="text"
                    value={inspContact}
                    onChange={(e) => setInspContact(e.target.value)}
                    placeholder="Manager Li / +86..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    WeChat ID
                  </label>
                  <input
                    type="text"
                    value={inspWechat}
                    onChange={(e) => setInspWechat(e.target.value)}
                    placeholder="sz_micro_li"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Preferred Field Visit Date
                </label>
                <input
                  type="date"
                  value={inspDate}
                  onChange={(e) => setInspDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                  required
                />
              </div>
            </div>

            {/* Section 3: Inspection Checklist */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inspection Scope & Checklist</span>
              </h3>

              <div className="space-y-2">
                {inspRequirements.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-300 leading-snug">{req}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspRequirements(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-500 hover:text-rose-400 p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom inspection test..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRequirement.trim()) {
                      e.preventDefault();
                      setInspRequirements(prev => [...prev, newRequirement.trim()]);
                      setNewRequirement('');
                    }
                  }}
                  className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRequirement.trim()) {
                      setInspRequirements(prev => [...prev, newRequirement.trim()]);
                      setNewRequirement('');
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Section 4: Settlement & Wallet Selection */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Settlement & Escrow Guarantee</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInspPaymentMethod('wallet')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    inspPaymentMethod === 'wallet'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-xs font-bold">Pay via Wallet</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Instant Escrow Lock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspPaymentMethod('quote_first')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    inspPaymentMethod === 'quote_first'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-xs font-bold">Request Quote First</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Admin Formulates Cost</span>
                </button>
              </div>

              {inspPaymentMethod === 'wallet' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                      Select Debit Vault Currency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['NGN', 'CNY'] as const).map(curr => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setInspWalletCurrency(curr)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            inspWalletCurrency === curr
                              ? 'bg-slate-950 border-emerald-500 text-emerald-400 font-bold ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400'
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

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Required Escrow Deposit:</span>
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
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono text-base tracking-[0.4em] text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleBackToHub}
                className="w-1/3 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingInspection}
                className="w-2/3 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingInspection ? (
                  <span>Dispatching Mission...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Authorize Assignment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUBPAGE 3: DEDICATED QUOTATION APPROVAL & PAYMENT PAGE
  // =========================================================================
  if (paymentModalRfq) {
    return (
      <div className="min-h-full pb-32 bg-slate-950 text-white animate-in fade-in duration-200">
        <Header 
          title="Review & Pay Quotation" 
          onBack={() => setPaymentModalRfq(null)} 
        />

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Easy Return Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPaymentModalRfq(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span>Back to My Requests</span>
            </button>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0 whitespace-nowrap font-mono">
              Quotation Sent
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Request Ref:</span>
              <span className="font-mono font-bold text-emerald-400">{paymentModalRfq.reference || paymentModalRfq.id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Assignment:</span>
              <span className="font-bold text-white max-w-[200px] truncate text-right">{paymentModalRfq.productName}</span>
            </div>

            {paymentModalRfq.productCostCNY && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Factory Product Cost:</span>
                <span className="font-mono text-white">¥{paymentModalRfq.productCostCNY.toLocaleString()} CNY</span>
              </div>
            )}
            {paymentModalRfq.sourcingCommissionCNY && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Sourcing Commission ({paymentModalRfq.sourcingCommissionPercent}%):</span>
                <span className="font-mono text-white">¥{paymentModalRfq.sourcingCommissionCNY.toLocaleString()} CNY</span>
              </div>
            )}
            {paymentModalRfq.chinaShippingCNY && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">China Domestic Shipping:</span>
                <span className="font-mono text-white">¥{paymentModalRfq.chinaShippingCNY.toLocaleString()} CNY</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-white uppercase text-[11px]">Total Escrow Amount:</span>
              <div className="text-right">
                <span className="font-mono font-black text-emerald-400 text-base block">
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

          {/* Multi-Currency Wallet Selection */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <label className="text-[11px] font-bold text-slate-300 uppercase block">
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
                      ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
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
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg text-center">
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
                  className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm border border-slate-800 active:scale-95 transition-all"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalRfq(null)}
              className="w-1/3 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment || pinInput.length !== 6}
              className={`w-2/3 h-12 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                pinInput.length === 6 && !isProcessingPayment
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessingPayment ? <span>Authorizing Payment...</span> : (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Approve & Pay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUBPAGE 4: DEDICATED MISSION DOSSIER PAGE
  // =========================================================================
  if (viewDetailRfq) {
    return (
      <div className="min-h-full pb-32 bg-slate-950 text-white animate-in fade-in duration-200">
        <Header 
          title="Mission Dossier" 
          onBack={() => setViewDetailRfq(null)} 
        />

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Easy Return Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setViewDetailRfq(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span>Back to My Requests</span>
            </button>
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 whitespace-nowrap">
              {viewDetailRfq.reference || viewDetailRfq.id}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <h2 className="text-base font-bold text-white leading-snug">{viewDetailRfq.productName}</h2>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase whitespace-nowrap">
                  {viewDetailRfq.status.replace('_', ' ')}
                </span>
              </div>
              {viewDetailRfq.paymentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Escrow Security:</span>
                  <span className="font-mono text-emerald-400 font-bold uppercase whitespace-nowrap">{viewDetailRfq.paymentStatus}</span>
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
              <div className="space-y-1 text-xs">
                <span className="text-[11px] font-bold uppercase text-slate-400">Specifications:</span>
                <p className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {viewDetailRfq.specifications}
                </p>
              </div>
            )}

            {(viewDetailRfq.supplierFindings || viewDetailRfq.businessRegistrationFindings || viewDetailRfq.factoryAuditFindings || viewDetailRfq.qualityControlFindings) && (
              <div className="space-y-1 text-xs">
                <span className="text-[11px] font-bold uppercase text-emerald-400">Ground Agent Findings:</span>
                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-slate-300 space-y-1 leading-relaxed">
                  {viewDetailRfq.supplierFindings && <p>{viewDetailRfq.supplierFindings}</p>}
                  {viewDetailRfq.businessRegistrationFindings && <p><strong>Registration:</strong> {viewDetailRfq.businessRegistrationFindings}</p>}
                  {viewDetailRfq.factoryAuditFindings && <p><strong>Factory Audit:</strong> {viewDetailRfq.factoryAuditFindings}</p>}
                  {viewDetailRfq.qualityControlFindings && <p><strong>Quality Control:</strong> {viewDetailRfq.qualityControlFindings}</p>}
                </div>
              </div>
            )}

            {/* Timeline Stepper */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Timeline Progression</span>
              <div className="space-y-3 pl-2 border-l-2 border-emerald-500/30">
                {(viewDetailRfq.timeline || [
                  { status: 'Submitted', location: 'Mobile App', timestamp: viewDetailRfq.createdAt, notes: 'Request queued for China Desk review' }
                ]).map((tl, i) => (
                  <div key={i} className="relative pl-3 text-xs">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-white capitalize truncate">{tl.status.replace('_', ' ')}</strong>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 whitespace-nowrap">
                        {new Date(tl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tl.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: CHINA AGENTS & SOURCING HUB
  // =========================================================================
  return (
    <div className="min-h-full pb-32 bg-slate-950 text-white">
      <Header title="China Agents & Sourcing" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        
        {/* ========================================================================= */}
        {/* LUXURY STATUS CARD: ON-GROUND CHINA DESK BEACON */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-2xl overflow-hidden">
          {/* Subtle luxury ambient backlight */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase whitespace-nowrap font-mono">
                  China Ground Ops Live
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300">GZ • SZ • Yiwu Hubs</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                Bilingual On-Ground Agents & Escrow
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct factory inspections, 1688 wholesale price negotiations, and physical quality audits across mainland China manufacturing corridors.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-center min-h-[58px]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-tight whitespace-nowrap">Active Team</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block whitespace-nowrap">41 Officers</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-center min-h-[58px]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-tight whitespace-nowrap">Escrow</span>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block whitespace-nowrap">100% Safe</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-center min-h-[58px]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-tight whitespace-nowrap">Turnaround</span>
                <span className="text-xs font-bold text-amber-400 font-mono mt-0.5 block whitespace-nowrap">24–48h SLA</span>
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
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold tracking-tight leading-tight whitespace-nowrap">
                Services & Sourcing
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_requests')}
            className={`py-2 px-1 rounded-xl text-center transition-all relative ${
              activeTab === 'my_requests'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                {myRequests.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono ${
                    activeTab === 'my_requests' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {myRequests.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold tracking-tight leading-tight whitespace-nowrap">
                My Agent Requests
              </span>
            </div>
            {actionNeededCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desks')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === 'desks'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold tracking-tight leading-tight whitespace-nowrap">
                China Desks
              </span>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SERVICES & SOURCING CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Status KPI Summary */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('pending_review'); }}
                title="Pending Review"
                className="py-2.5 px-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group flex flex-col justify-between min-h-[78px]"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight block">Pending</span>
                <span className="text-base font-bold text-white font-mono block group-hover:text-emerald-400 my-0.5">
                  {pendingReviewCount}
                </span>
                <span className="text-[9px] text-slate-500 block truncate w-full">Reviewing</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('quotation_sent'); }}
                title="Quotation Sent"
                className={`py-2.5 px-1.5 rounded-2xl border text-center transition-all group flex flex-col justify-between min-h-[78px] ${
                  quotationSentCount > 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-tight block">Quoted</span>
                <span className="text-base font-bold text-amber-400 font-mono block my-0.5">
                  {quotationSentCount}
                </span>
                <span className="text-[9px] text-amber-300/80 block truncate w-full">Payable</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('paid_active'); }}
                title="Paid & Active"
                className="py-2.5 px-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group flex flex-col justify-between min-h-[78px]"
              >
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight block">Active</span>
                <span className="text-base font-bold text-indigo-400 font-mono block my-0.5">
                  {paidActiveCount}
                </span>
                <span className="text-[9px] text-slate-400 block truncate w-full">Ground Ops</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('my_requests'); setFilterStatus('completed'); }}
                title="Completed"
                className="py-2.5 px-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-center transition-all group flex flex-col justify-between min-h-[78px]"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight block">Done</span>
                <span className="text-base font-bold text-white font-mono block group-hover:text-emerald-400 my-0.5">
                  {completedCount}
                </span>
                <span className="text-[9px] text-slate-500 block truncate w-full">Reports</span>
              </button>
            </div>

            {/* Service Cards Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div>
                <h3 className="text-sm font-bold text-white">Select Ground Assignment</h3>
                <p className="text-[11px] text-slate-400">Direct execution by local bilingual trade officers</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap shrink-0">
                Escrow Protected
              </span>
            </div>

            {/* SERVICE CARD 1: PRODUCT SOURCING & PURCHASING */}
            <div 
              onClick={() => handleOpenService('sourcing')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono whitespace-nowrap">
                      {settings.sourcingCommissionPercent}% Fee
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Min. ¥{settings.minSourcingCommissionCNY}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    Product Sourcing & Purchasing
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Source directly on 1688, Taobao, Alibaba, or Pinduoduo. We negotiate direct manufacturer pricing, purchase samples, and coordinate China freight.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 text-[11px] truncate flex-1 min-w-0">Min. commission: ¥{settings.minSourcingCommissionCNY} CNY</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span>Start Sourcing Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 2: PHYSICAL FACTORY AUDIT */}
            <div 
              onClick={() => handleOpenService('factory_audit')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-mono whitespace-nowrap">
                      ${settings.factoryAuditUSD} USD Fixed
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono whitespace-nowrap">Full Audit</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                    Physical Factory Audit
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    On-the-ground visit to factory workshops. Inspect production machinery, verify manufacturing capacity, worker conditions, and real output capability.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 text-[11px] truncate flex-1 min-w-0">Deliverable: Full PDF Audit Report</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span>Book Factory Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 3: CANTON FAIR ESCORT & TRADE GUIDE */}
            <div 
              onClick={() => handleOpenService('canton_fair_escort')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-mono whitespace-nowrap">
                      ${settings.cantonFairEscortUSD || 200} USD / Day
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Pazhou Escort</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                    Canton Fair Escort & Trade Guide
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bilingual ground agent escort at Canton Fair (Guangzhou Pazhou Complex). Live English-Chinese translation, booth negotiation, catalog compilation, and supplier vetting.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 text-[11px] truncate flex-1 min-w-0">Deliverable: Verified Booth Reports & Dossier</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span>Book Fair Escort</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* SERVICE CARD 4: SUPPLIER LEGITIMACY VERIFICATION (REMOVED FROM MOBILE APP, PRESERVED ON ADMIN) */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <h4>Supplier Legitimacy Verification</h4>
              <span>${settings.supplierVerificationUSD} USD Fixed</span>
            </div>

            {/* SERVICE CARD 5: PRE-SHIPMENT QUALITY CONTROL */}
            <div 
              onClick={() => handleOpenService('quality_control')}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all shadow-xl group space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold font-mono whitespace-nowrap">
                      ${settings.qualityControlUSD} USD Fixed
                    </span>
                    <span className="text-[10px] text-teal-400 font-mono">AQL Sampling</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors leading-snug">
                    Pre-Shipment Quality Control (QC)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AQL Level II standard sampling inspection at factory warehouse prior to dispatch. Barcode scan, dimensions, weight, packaging drop test, and defects count.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 text-[11px] truncate flex-1 min-w-0">Deliverable: AQL Inspection Certificate</span>
                <span className="font-semibold text-teal-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span>Book QC Inspection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY AGENT REQUESTS & MILESTONE TRACKING */}
        {/* ========================================================================= */}
        {activeTab === 'my_requests' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending_review', label: 'Pending Review' },
                { id: 'quotation_sent', label: 'Quotation Sent' },
                { id: 'paid_active', label: 'Paid & Active' },
                { id: 'completed', label: 'Completed' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    filterStatus === f.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* City Filter Pills */}
            <div className="space-y-1.5 px-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Filter by Regional Desk:</span>
                <span className="text-[10px] text-slate-500 font-mono">Showing {filteredRequests.length}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(['all', 'Guangzhou', 'Shenzhen', 'Yiwu', 'Foshan'] as const).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCityDesk(city)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                      selectedCityDesk === city
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {city === 'all' ? 'All Desks' : `${city} Desk`}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Agent Requests Found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {filterStatus === 'all' 
                      ? "You haven't initiated any China sourcing or ground agent assignments yet."
                      : `No assignments matching '${filterStatus.replace('_', ' ')}'.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Explore Ground Services</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(rfq => {
                  const isAwaitingQuotePayment = rfq.status === 'awaiting_payment' || rfq.status === 'quote_ready' || rfq.status === 'quotation_sent';
                  const isPaidActive = rfq.status === 'in_progress' || rfq.status === 'paid_active' || rfq.status === 'approved';
                  const isPending = rfq.status === 'pending_review' || rfq.status === 'submitted' || rfq.status === 'pending_quote';
                  const isDone = rfq.status === 'completed';

                  // Milestone progress stage index (0 to 3)
                  const stageIndex = isDone ? 3 : isPaidActive ? 2 : isAwaitingQuotePayment ? 1 : 0;

                  return (
                    <div
                      key={rfq.id}
                      className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-3.5 group"
                    >
                      {/* Top Header Strip */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                              {rfq.reference || rfq.id}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {new Date(rfq.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5 group-hover:text-emerald-400 transition-colors truncate">
                            {rfq.productName}
                          </h4>
                          <span className="text-[11px] text-slate-400 truncate block">{rfq.serviceType}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap block">
                              Pending Review
                            </span>
                          )}
                          {isAwaitingQuotePayment && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold animate-pulse whitespace-nowrap block">
                              Quotation Sent
                            </span>
                          )}
                          {isPaidActive && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold whitespace-nowrap block">
                              Paid & Active
                            </span>
                          )}
                          {isDone && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap block">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Milestone Progression Bar */}
                      <div className="pt-1 pb-1">
                        <div className="grid grid-cols-4 gap-1 text-[9px] mb-1.5 text-center font-mono">
                          <span className={stageIndex >= 0 ? 'text-emerald-400 font-bold truncate' : 'text-slate-500 truncate'}>
                            1. Logged
                          </span>
                          <span className={stageIndex >= 1 ? 'text-emerald-400 font-bold truncate' : 'text-slate-500 truncate'}>
                            2. Assigned
                          </span>
                          <span className={stageIndex >= 2 ? (isDone ? 'text-emerald-400 font-bold truncate' : 'text-indigo-400 font-bold truncate') : 'text-slate-500 truncate'}>
                            3. Field Ops
                          </span>
                          <span className={stageIndex >= 3 ? 'text-emerald-400 font-bold truncate' : 'text-slate-500 truncate'}>
                            4. Complete
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[0, 1, 2, 3].map(step => (
                            <div
                              key={step}
                              className={`h-1.5 rounded-full transition-all ${
                                stageIndex > step
                                  ? 'bg-emerald-500'
                                  : stageIndex === step
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Specification & Details Card */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Target Quantity:</span>
                          <strong className="text-white font-mono">{rfq.targetQuantity || 100} units</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Location / City:</span>
                          <span className="text-white font-medium">{rfq.supplierCity || 'Guangzhou'} Desk</span>
                        </div>
                        {rfq.supplierName && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Supplier:</span>
                            <span className="text-white font-medium truncate max-w-[180px]">{rfq.supplierName}</span>
                          </div>
                        )}
                        {rfq.assignedAgent && (
                          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Officer:</span>
                            </span>
                            <span className="font-semibold text-white ml-2">{rfq.assignedAgent}</span>
                          </div>
                        )}
                      </div>

                      {/* QUOTATION ACTION BANNER (When Quote is Payable) */}
                      {isAwaitingQuotePayment && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-xs font-bold text-amber-400">Official Quotation Formulated</span>
                            </div>
                            <span className="font-mono font-bold text-sm text-white shrink-0">
                              {rfq.totalPayableCNY 
                                ? `¥${rfq.totalPayableCNY.toLocaleString()} CNY` 
                                : `$${rfq.quoteAmountUSD} USD`}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Our China Desk has audited factory pricing and finalized logistics. Authorize escrow release to dispatch on-ground agent.
                          </p>

                          <button
                            type="button"
                            onClick={() => setPaymentModalRfq(rfq)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Review & Pay Quotation</span>
                          </button>
                        </div>
                      )}

                      {/* COMPLETED REPORT DOWNLOAD BANNER */}
                      {isDone && (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300 font-semibold truncate">Inspection Dossier & PDF Ready</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewDetailRfq(rfq)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-all shrink-0"
                          >
                            View Report
                          </button>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {rfq.id.slice(0, 12)}...
                        </span>

                        <button
                          type="button"
                          onClick={() => setViewDetailRfq(rfq)}
                          className="font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Full Mission Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REGIONAL CHINA OPERATIONS DESKS */}
        {/* ========================================================================= */}
        {activeTab === 'desks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="px-1">
              <h3 className="text-sm font-bold text-white">Mainland China Regional Hubs</h3>
              <p className="text-[11px] text-slate-400">Physical stations staffed with permanent bilingual trade officers</p>
            </div>

            <div className="space-y-3">
              {CHINA_HUBS.map(hub => (
                <div
                  key={hub.city}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm whitespace-nowrap">{hub.city} Desk</span>
                        <span className="text-xs text-emerald-400 font-mono font-medium whitespace-nowrap">{hub.nameZh}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-300 mt-0.5 truncate">{hub.hubTitle}</h4>
                    </div>

                    <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold whitespace-nowrap font-mono">
                      {hub.agentsCount} Officers On-Duty
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{hub.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="leading-snug"><strong>Coverage:</strong> {hub.focus}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] gap-2">
                      <span className="text-slate-400 truncate">Officer Lead: <strong className="text-white">{hub.leadAgent}</strong></span>
                      <span className="text-emerald-400 font-medium whitespace-nowrap shrink-0">★ {hub.rating}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInspCity(hub.city as any);
                      handleOpenService('factory_audit');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Dispatch Agent in {hub.city}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMISSION CONFIRMATION MODAL */}
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
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
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
                    handleOpenService('sourcing');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
