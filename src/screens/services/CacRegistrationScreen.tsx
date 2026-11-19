import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db, DEFAULT_SHARE_CAPITAL_TIERS } from '../../services/db';
import {
  CacServiceType,
  CacApplicationStatus,
  CacPartnerDirector,
  CacRegistrationDocument,
  CacPricingConfig,
  CacShareCapitalTier
} from '../../types';
import {
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Upload,
  Download,
  Lock,
  Send,
  User,
  Plus,
  Trash2,
  FileCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  PenTool,
  Check
} from 'lucide-react';

export const CAC_INDUSTRY_CATEGORIES = [
  'Agriculture and Farming',
  'Art and Creatives',
  'Beauty and Personal Care',
  'Construction and Real Estate',
  'Education and Training',
  'Events and Entertainment',
  'Fashion and Apparel',
  'Financial Services and Fintech',
  'Fitness and Wellness',
  'Food, Beverages and Catering',
  'HealthCare and Pharmaceuticals',
  'Home, Interior and Repairs',
  'IT, Software and Electronics',
  'Manufacturing and Production',
  'Mining and Solid Minerals',
  'Oil and Gas Energy',
  'Pet Care and Veterinary',
  'Professional Services and Consulting',
  'Retail and General Trade',
  'Security and Surveillance Services',
  'Telecommunications',
  'Transportation and Logistics',
  'Travel, Tourism and Leisure',
  'Waste Management and Recycling'
];

export const CacRegistrationScreen: React.FC = () => {
  const { activeUserId, userProfile, wallets, navigate, showToast } = useApp();
  const user = db.getUser(activeUserId);

  // Top Tabs: Form vs My Applications
  const [activeMainTab, setActiveMainTab] = useState<'form' | 'applications'>('form');

  // Form Step Wizard: 1: Entity & Category, 2: Directors/Shareholders, 3: Share Capital & Documents, 4: Review & Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Entity Type
  const [serviceType, setServiceType] = useState<CacServiceType>('business_name');

  // Pricing & Share Capital Tiers from DB
  const [pricing, setPricing] = useState<CacPricingConfig>(() => db.getCacPricing());
  const [selectedCapitalTierId, setSelectedCapitalTierId] = useState<string>('sct_1m');

  // Step 1: Business Identity & Category
  const [primaryName, setPrimaryName] = useState('');
  const [alternativeName, setAlternativeName] = useState('');
  const [category, setCategory] = useState(CAC_INDUSTRY_CATEGORIES[21]); // Transportation & Logistics
  const [commencementDate, setCommencementDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  // Step 2: Directors / Shareholders / Proprietor details
  const [partners, setPartners] = useState<CacPartnerDirector[]>([
    {
      id: 'p_primary',
      fullName: userProfile?.name || user?.fullName || 'Chief Babatunde Alade',
      email: userProfile?.email || user?.email || 'babatunde@aladeholding.ng',
      phone: userProfile?.phone || user?.phone || '+234 803 555 9201',
      role: 'Proprietor',
      sharesPercent: 100,
      residentialAddress: '14 Warehouse Road, Apapa Port Commercial Corridor, Lagos, Nigeria',
      idCardType: 'NIN',
      idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
    }
  ]);

  // Step 3: Statutory Document Uploads
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );
  const [idCardUrl, setIdCardUrl] = useState(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
  );
  const [idCardType, setIdCardType] = useState<'NIN' | 'Driver License' | 'International Passport' | 'Voter Card'>('NIN');
  const [signatureUrl, setSignatureUrl] = useState(
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
  );
  const [referenceSignatureUrl, setReferenceSignatureUrl] = useState('');

  // PIN Authorization Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Applications List & Details Modal
  const [applications, setApplications] = useState<CacRegistrationDocument[]>(() =>
    db.getCacApplications(activeUserId)
  );
  const [selectedApp, setSelectedApp] = useState<CacRegistrationDocument | null>(null);

  // Compliance Chat Thread State
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Load and Subscribe to Database
  useEffect(() => {
    db.fetchCacPricing().then(p => {
      setPricing(p);
      const defaultTier = p.share_capital_tiers?.find(t => t.isDefault) || p.share_capital_tiers?.[0];
      if (defaultTier) setSelectedCapitalTierId(defaultTier.id);
    });
    if (activeUserId) {
      db.fetchCacApplications(activeUserId).then(apps => setApplications(apps));
    }
    const unsub = db.subscribe(() => {
      const p = db.getCacPricing();
      setPricing(p);
      if (activeUserId) {
        setApplications(db.getCacApplications(activeUserId));
        if (selectedApp) {
          const updated = db.getCacApplicationById(selectedApp.id);
          if (updated) setSelectedApp(updated);
        }
      }
    });
    return unsub;
  }, [activeUserId, selectedApp?.id]);

  // Adjust partner roles when switching service type
  useEffect(() => {
    setPartners(prev =>
      prev.map(p => ({
        ...p,
        role: serviceType === 'company_registration' ? 'Director' : 'Proprietor'
      }))
    );
    if (serviceType === 'company_registration' && !referenceSignatureUrl) {
      setReferenceSignatureUrl(
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
      );
    }
  }, [serviceType]);

  // Available share capital tiers
  const shareCapitalTiers: CacShareCapitalTier[] = useMemo(() => {
    return Array.isArray(pricing.share_capital_tiers) && pricing.share_capital_tiers.length > 0
      ? pricing.share_capital_tiers
      : DEFAULT_SHARE_CAPITAL_TIERS;
  }, [pricing]);

  const activeShareCapitalTier = useMemo(() => {
    return (
      shareCapitalTiers.find(t => t.id === selectedCapitalTierId) ||
      shareCapitalTiers.find(t => t.isDefault) ||
      shareCapitalTiers[0]
    );
  }, [shareCapitalTiers, selectedCapitalTierId]);

  // Dynamic Calculated Fee
  const calculatedFee = useMemo(() => {
    if (serviceType === 'company_registration') {
      return activeShareCapitalTier ? Number(activeShareCapitalTier.totalFeeNGN) : Number(pricing.company_registration_ngn || 75000);
    }
    return Number(pricing.business_name_ngn || 35000);
  }, [serviceType, activeShareCapitalTier, pricing]);

  const ngnWalletBalance = Number(
    wallets?.find(w => w.currency === 'NGN')?.balance ?? user?.balances?.NGN ?? 0
  );
  const hasSufficientNgn = ngnWalletBalance >= calculatedFee;

  // Manage Partners / Directors
  const handleAddPartner = () => {
    const newP: CacPartnerDirector = {
      id: `p_${Date.now()}`,
      fullName: '',
      email: '',
      phone: '',
      role: serviceType === 'company_registration' ? 'Director' : 'Partner',
      sharesPercent: 0,
      residentialAddress: businessAddress.trim() || 'Lagos, Nigeria',
      idCardType: 'NIN',
      idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      signatureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
    };
    setPartners([...partners, newP]);
  };

  const handleRemovePartner = (id: string) => {
    if (partners.length <= 1) return;
    setPartners(partners.filter(p => p.id !== id));
  };

  const handlePartnerChange = (id: string, field: keyof CacPartnerDirector, val: any) => {
    setPartners(
      partners.map(p => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!primaryName.trim()) {
        showToast('Please enter your proposed Business or Company Name', 'error');
        return;
      }
      if (!businessAddress.trim()) {
        showToast('Please enter your business operating address', 'error');
        return;
      }
      setCurrentStep(2);
      window.scrollTo(0, 0);
      return;
    }

    if (currentStep === 2) {
      // Validate all partners
      for (let i = 0; i < partners.length; i++) {
        const p = partners[i];
        if (!p.fullName.trim() || !p.phone.trim() || !p.residentialAddress?.trim()) {
          showToast(`Please complete Name, Phone, and Residential Address for Member #${i + 1}`, 'error');
          return;
        }
      }
      setCurrentStep(3);
      window.scrollTo(0, 0);
      return;
    }

    if (currentStep === 3) {
      if (!passportPhotoUrl) {
        showToast('Please upload a passport photograph', 'error');
        return;
      }
      if (!idCardUrl) {
        showToast('Please upload a valid government ID card', 'error');
        return;
      }
      if (!signatureUrl) {
        showToast('Please upload your personal signature', 'error');
        return;
      }
      if (serviceType === 'company_registration' && !referenceSignatureUrl) {
        showToast('Reference signature is strictly required for Company Registration', 'error');
        return;
      }
      setCurrentStep(4);
      window.scrollTo(0, 0);
      return;
    }
  };

  const handleAuthorizePayment = () => {
    if (!hasSufficientNgn) {
      showToast(
        `Insufficient NGN wallet balance (₦${ngnWalletBalance.toLocaleString()} available, ₦${calculatedFee.toLocaleString()} required). Only Naira wallet can be used for CAC regulatory filings.`,
        'error'
      );
      return;
    }
    setPin('');
    setShowPinModal(true);
  };

  const handleSubmitRegistration = async () => {
    if (!pin || pin.length !== 6) {
      showToast('Enter your 6-digit transaction PIN', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.submitCacRegistration({
        userId: activeUserId || 'usr_alade_01',
        serviceType,
        primaryName: primaryName.trim(),
        alternativeName: alternativeName.trim(),
        category,
        commencementDate,
        businessAddress: businessAddress.trim(),
        businessDescription: businessDescription.trim(),
        partners,
        shareCapitalTierId: serviceType === 'company_registration' ? activeShareCapitalTier?.id : undefined,
        shareCapitalNGN: serviceType === 'company_registration' ? activeShareCapitalTier?.shareCapitalNGN : undefined,
        passportPhotoUrl,
        idCardUrl,
        idCardType,
        signatureUrl,
        referenceSignatureUrl: serviceType === 'company_registration' ? referenceSignatureUrl : '',
        pin
      });

      if (res.success && res.application) {
        showToast('CAC Registration filed successfully! Corporate Affairs tracking initiated.', 'success');
        setShowPinModal(false);
        setPrimaryName('');
        setAlternativeName('');
        setBusinessAddress('');
        setBusinessDescription('');
        setCurrentStep(1);
        setActiveMainTab('applications');
        setSelectedApp(res.application);
      } else {
        showToast(res.error || 'Failed to submit CAC registration', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComplianceReply = async () => {
    if (!selectedApp || !chatMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const res = await db.sendCacThreadMessage({
        applicationId: selectedApp.id,
        sender: 'user',
        senderName: userProfile?.name || user?.fullName || 'Applicant',
        message: chatMessage.trim()
      });
      if (res.success && res.application) {
        setSelectedApp(res.application);
        setChatMessage('');
        showToast('Compliance update dispatched to CAC desk', 'success');
      } else {
        showToast(res.error || 'Failed to send reply', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[17px] sm:text-[18px] font-bold tracking-tight text-white whitespace-nowrap">
            CAC Corporate Registration
          </h1>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold tracking-wide font-mono">
              CAMA 2020
            </span>
            <button
              type="button"
              onClick={() => {
                db.fetchCacPricing().then(p => setPricing(p));
                if (activeUserId) db.fetchCacApplications(activeUserId).then(apps => setApplications(apps));
                showToast('Synchronized with CAC Corporate Registry', 'success');
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Refresh Registry"
              aria-label="Refresh Registry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[12px] text-white/60 leading-snug whitespace-nowrap">
          Statutory Business Name & Company Incorporation
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Navigation Switcher: New Filing vs My Filings */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveMainTab('form');
              setSelectedApp(null);
            }}
            className={`py-2 px-3 text-[12px] font-semibold rounded-lg transition-all text-center cursor-pointer ${
              activeMainTab === 'form'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Filing
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('applications')}
            className={`py-2 px-3 text-[12px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMainTab === 'applications'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>My Filings</span>
            {applications.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                activeMainTab === 'applications' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {applications.length}
              </span>
            )}
          </button>
        </div>

        {activeMainTab === 'form' ? (
          <>
            {/* Stepped Progress Indicator */}
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs min-w-0">
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px] sm:text-[12px] tracking-tight min-w-0">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0">
                    {currentStep}
                  </span>
                  <span>
                    {currentStep === 1 && 'Entity Type & Business Details'}
                    {currentStep === 2 && 'Directors, Shareholders & Witnesses'}
                    {currentStep === 3 && 'Share Capital Matrix & Documents'}
                    {currentStep === 4 && 'Statutory Review & Settlement'}
                  </span>
                </span>
                <span className="text-slate-400 font-mono text-[10.5px] sm:text-[11px] shrink-0 ml-2">Step {currentStep} of 4</span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map(st => (
                  <div
                    key={st}
                    className={`h-1 rounded-full transition-all ${
                      st <= currentStep
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: ENTITY TYPE & BUSINESS DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Registration Type Selector */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Entity Classification
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      CAMA 2020 Compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setServiceType('business_name')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        serviceType === 'business_name'
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🏪</span>
                        {serviceType === 'business_name' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white">Business Name</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Sole proprietorship or enterprise partnership</p>
                      <div className="mt-3 pt-2 border-t border-slate-800/80">
                        <span className="text-base font-bold text-emerald-400 num-tabular">
                          ₦{pricing.business_name_ngn?.toLocaleString() || '35,000'}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">all-inclusive</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('company_registration')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        serviceType === 'company_registration'
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🏛️</span>
                        {serviceType === 'company_registration' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white">Incorporated Company</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Private Limited Company (LTD) with shares</p>
                      <div className="mt-3 pt-2 border-t border-slate-800/80">
                        <span className="text-base font-bold text-emerald-400 num-tabular">
                          From ₦{pricing.company_registration_ngn?.toLocaleString() || '75,000'}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">tiered capital</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Business Details Form */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">Proposed Corporate Identity</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Proposed Name (Primary Choice) *
                    </label>
                    <input
                      type="text"
                      value={primaryName}
                      onChange={e => setPrimaryName(e.target.value)}
                      placeholder="e.g. Alade Global Trade & Logistics Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Alternative Name (Second Option if Primary is Unavailable)
                    </label>
                    <input
                      type="text"
                      value={alternativeName}
                      onChange={e => setAlternativeName(e.target.value)}
                      placeholder="e.g. Alade Logistics Express Hub Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Official CAC Industry Category *
                      </label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {CAC_INDUSTRY_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Date of Commencement *
                      </label>
                      <input
                        type="date"
                        value={commencementDate}
                        onChange={e => setCommencementDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business Operating Address *
                    </label>
                    <input
                      type="text"
                      value={businessAddress}
                      onChange={e => setBusinessAddress(e.target.value)}
                      placeholder="e.g. 14 Warehouse Road, Apapa Port Commercial Corridor, Lagos, Nigeria"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Operations & Nature of Trade Description
                    </label>
                    <textarea
                      rows={2}
                      value={businessDescription}
                      onChange={e => setBusinessDescription(e.target.value)}
                      placeholder="Describe the trade goods, cargo haulage, wholesale distribution, or services..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Director & Shareholder Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DIRECTORS, SHAREHOLDERS & PROPRIETORS */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        {serviceType === 'company_registration'
                          ? 'Directors & Shareholders Information'
                          : 'Proprietor & Partner Details'}
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Statutory requirements under CAMA 2020: Full Name, Phone, Physical Address, Email, and Valid ID
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPartner}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Person
                    </button>
                  </div>

                  <div className="space-y-4">
                    {partners.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {p.role} Details
                          </span>
                          {partners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePartner(p.id)}
                              className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Full Name & Role */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Full Legal Name (as on Government ID) *
                            </label>
                            <input
                              type="text"
                              value={p.fullName}
                              onChange={e => handlePartnerChange(p.id, 'fullName', e.target.value)}
                              placeholder="e.g. Chief Babatunde Alade"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Corporate Role *
                            </label>
                            <select
                              value={p.role}
                              onChange={e => handlePartnerChange(p.id, 'role', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              {serviceType === 'company_registration' ? (
                                <>
                                  <option value="Director">Director</option>
                                  <option value="Shareholder">Shareholder</option>
                                  <option value="Secretary">Company Secretary</option>
                                </>
                              ) : (
                                <>
                                  <option value="Proprietor">Proprietor</option>
                                  <option value="Partner">Partner</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Direct Phone Number *
                            </label>
                            <div className="relative">
                              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="tel"
                                value={p.phone}
                                onChange={e => handlePartnerChange(p.id, 'phone', e.target.value)}
                                placeholder="+234 803 555 9201"
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Email Address *
                            </label>
                            <div className="relative">
                              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="email"
                                value={p.email}
                                onChange={e => handlePartnerChange(p.id, 'email', e.target.value)}
                                placeholder="babatunde@aladeholding.ng"
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Physical Residential Address */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Physical Residential Address *
                          </label>
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={p.residentialAddress || ''}
                              onChange={e => handlePartnerChange(p.id, 'residentialAddress', e.target.value)}
                              placeholder="House number, Street, City, State (No P.O. Box allowed)"
                              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Shareholding Percentage */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Equity / Shares Allocation
                            </label>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {p.sharesPercent || 0}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={p.sharesPercent || 0}
                            onChange={e => handlePartnerChange(p.id, 'sharesPercent', Number(e.target.value))}
                            className="w-full accent-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Continue to Share Capital & Documents
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SHARE CAPITAL MATRIX & STATUTORY UPLOADS */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Share Capital Matrix for Company Registrations */}
                {serviceType === 'company_registration' && (
                  <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          Authorized Share Capital Selection
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Select the authorized share capital tier for your incorporated company
                        </p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                        Dynamic CAMA Rates
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shareCapitalTiers.map(tier => {
                        const isSelected = activeShareCapitalTier?.id === tier.id;
                        return (
                          <div
                            key={tier.id}
                            onClick={() => setSelectedCapitalTierId(tier.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xs font-bold text-white">{tier.name}</h3>
                                <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
                                  ₦{tier.shareCapitalNGN.toLocaleString()}
                                </span>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                              {tier.description}
                            </p>

                            <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[10px]">Statutory Fee:</span>
                              <span className="font-bold text-white font-mono">
                                ₦{tier.totalFeeNGN.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Statutory Document Uploads */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white">Statutory Regulatory Documents</h2>
                    </div>
                    <span className="text-[11px] text-slate-400">PDF, PNG, JPG (Max 5MB)</span>
                  </div>

                  {/* Passport Photograph */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={passportPhotoUrl}
                        alt="Passport"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <h3 className="text-xs font-bold text-white">Passport Photograph *</h3>
                        <p className="text-[11px] text-slate-400">Clear frontal face with neutral background</p>
                      </div>
                    </div>
                    <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => {
                              if (ev.target?.result) setPassportPhotoUrl(String(ev.target.result));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Valid Government ID Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-white">Valid Government ID Card *</h3>
                        <p className="text-[11px] text-slate-400">NIN Slip, Driver License, Passport or Voter Card</p>
                      </div>
                      <select
                        value={idCardType}
                        onChange={e => setIdCardType(e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                      >
                        <option value="NIN">National Identity (NIN)</option>
                        <option value="Driver License">Driver's License</option>
                        <option value="International Passport">International Passport</option>
                        <option value="Voter Card">Voter's Card</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400 truncate max-w-[220px]">
                        {idCardType} Document Attached
                      </span>
                      <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        Upload ID
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                if (ev.target?.result) setIdCardUrl(String(ev.target.result));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Personal Signature */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-white">Personal Signature *</h3>
                      <p className="text-[11px] text-slate-400">Sign on plain white paper and take a clear photo</p>
                    </div>
                    <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => {
                              if (ev.target?.result) setSignatureUrl(String(ev.target.result));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Reference Signature (Strictly required for Incorporated Company Registration) */}
                  {serviceType === 'company_registration' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">
                            Mandatory for LTD
                          </span>
                          <h3 className="text-xs font-bold text-white">Reference Signature *</h3>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Required under CAMA 2020 for Company Formation by an accredited witness or co-director.
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">
                          {referenceSignatureUrl ? 'Reference signature attached' : 'No reference signature yet'}
                        </span>
                        <label className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          Attach Signature
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = ev => {
                                  if (ev.target?.result) setReferenceSignatureUrl(String(ev.target.result));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Review Application & Settlement
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & NAIRA-ONLY WALLET SETTLEMENT */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">Statutory Filing Summary</h2>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Proposed Name:</span>
                      <span className="font-bold text-white text-right">{primaryName}</span>
                    </div>
                    {alternativeName && (
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Alternative Choice:</span>
                        <span className="text-slate-300 text-right">{alternativeName}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Entity Type:</span>
                      <span className="text-emerald-400 font-semibold">
                        {serviceType === 'company_registration' ? 'Incorporated Company (LTD)' : 'Business Name'}
                      </span>
                    </div>
                    {serviceType === 'company_registration' && (
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Share Capital Tier:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {activeShareCapitalTier?.name} (₦{activeShareCapitalTier?.shareCapitalNGN.toLocaleString()})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Industry Category:</span>
                      <span className="text-slate-300">{category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Commencement Date:</span>
                      <span className="text-slate-300 font-mono">{commencementDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Directors / Partners:</span>
                      <span className="text-slate-300">{partners.length} members specified</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-0.5">Operating Address:</span>
                      <span className="text-slate-300">{businessAddress}</span>
                    </div>
                  </div>

                  {/* Payment Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Total Statutory Filing Fee</span>
                        <div className="text-2xl font-bold text-emerald-400 num-tabular">
                          ₦{calculatedFee.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Available NGN Wallet</span>
                        <div className={`text-sm font-semibold num-tabular ${hasSufficientNgn ? 'text-white' : 'text-rose-400'}`}>
                          ₦{ngnWalletBalance.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Naira-Only Payment:</strong> CAC registration fees are deducted exclusively from your Nigerian Naira (NGN) wallet balance. Foreign currency vaults (such as RMB) cannot be used for Nigerian regulatory filings.
                      </span>
                    </div>

                    {!hasSufficientNgn && (
                      <button
                        type="button"
                        onClick={() => navigate('fund')}
                        className="w-full py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 active:scale-95 transition-all"
                      >
                        Top Up NGN Wallet with Providus / Korapay ➔
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleAuthorizePayment}
                      disabled={!hasSufficientNgn}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Authorize & Settle Filing (₦{calculatedFee.toLocaleString()})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* MY APPLICATIONS TAB */
          <div className="space-y-4 animate-fadeIn">
            {applications.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No CAC Filings Found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You haven't filed any business name or company registrations yet. Start a new filing to receive your official CAC Certificate.
                </p>
                <button
                  onClick={() => setActiveMainTab('form')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all"
                >
                  Start CAC Registration
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {app.serviceType === 'company_registration' ? '🏛️' : '🏪'}
                          </span>
                          <h3 className="text-sm font-bold text-white">{app.primaryName}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{app.category}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          app.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : app.status === 'action_required'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                            : app.status === 'in_review'
                            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {app.status === 'action_required' ? 'Action Required' : app.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-slate-300">{app.reference}</span>
                      <div className="flex items-center gap-2">
                        {app.shareCapitalNGN && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                            Cap: ₦{(app.shareCapitalNGN / 1000000).toFixed(0)}M
                          </span>
                        )}
                        {app.rcNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                            RC: {app.rcNumber}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Inspection & Two-Way Compliance Thread Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[220px]">
                    {selectedApp.primaryName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedApp.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Status Header */}
              <div
                className={`p-4 rounded-2xl border ${
                  selectedApp.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : selectedApp.status === 'action_required'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Filing Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                      selectedApp.status === 'completed'
                        ? 'text-emerald-400'
                        : selectedApp.status === 'action_required'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                {selectedApp.rcNumber && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Registration Number</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {selectedApp.rcNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Certificate Download Banner */}
              {selectedApp.status === 'completed' && selectedApp.certificatePdfUrl && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Official Certificate Ready</h4>
                      <p className="text-[11px] text-slate-400">Your CAC Certificate is ready and linked to your corporate profile</p>
                    </div>
                  </div>
                  <a
                    href={selectedApp.certificatePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Official Certificate (PDF)
                  </a>
                </div>
              )}

              {/* Summary Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Entity Classification</span>
                  <span className="text-slate-200 font-medium">
                    {selectedApp.serviceType === 'company_registration' ? 'Incorporated Company (LTD)' : 'Business Name'}
                  </span>
                </div>
                {selectedApp.shareCapitalNGN && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Share Capital</span>
                    <span className="text-emerald-400 font-mono font-bold">₦{selectedApp.shareCapitalNGN.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Industry Category</span>
                  <span className="text-slate-200 font-medium">{selectedApp.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Commencement Date</span>
                  <span className="text-slate-200 font-mono">{selectedApp.commencementDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Filing Fee Settled</span>
                  <span className="text-emerald-400 font-bold">₦{selectedApp.serviceFeeNGN?.toLocaleString()}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Operating Address</span>
                  <span className="text-slate-200">{selectedApp.businessAddress}</span>
                </div>
              </div>

              {/* Two-Way Compliance Messaging Thread */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    CAC Compliance Messages & Notices
                  </h4>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {(selectedApp.thread || []).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No messages on thread</p>
                  ) : (
                    selectedApp.thread.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          msg.sender === 'admin'
                            ? 'bg-slate-900 border border-slate-800 text-slate-200 ml-0 mr-4'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 ml-4 mr-0'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="font-semibold text-slate-300">{msg.senderName}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendComplianceReply()}
                    placeholder="Reply or provide requested document details..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendComplianceReply}
                    disabled={isSendingMessage || !chatMessage.trim()}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6-Digit PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Enter Transaction PIN</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorize statutory fee deduction of <strong>₦{calculatedFee.toLocaleString()}</strong> from your NGN wallet balance.
              </p>
            </div>

            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pin.length !== 6 || isSubmitting}
                onClick={handleSubmitRegistration}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Pay'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CacRegistrationScreen;
