import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  BillCategory,
  NigerianNetwork,
  ElectricityDisco,
  CableTvProvider,
  BillPlanDocument,
  BillTransactionDocument,
  BillProviderConfigDocument,
  CustomerVerificationResult
} from '../../types';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronDown,
  Copy,
  Check,
  Search,
  AlertCircle,
  ShieldCheck,
  Lock,
  Fingerprint,
  RotateCcw,
  Receipt,
  X,
  CreditCard,
  Share2,
  Download,
  Building,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { TelcoLogo } from '../../components/ui/TelcoLogo';
import { DiscoLogo } from '../../components/ui/DiscoLogo';
import { CableLogo } from '../../components/ui/CableLogo';
import { FALLBACK_BILL_PLANS } from '../../data/fallbackBillPlans';

const NIGERIAN_DISCOS: { code: ElectricityDisco; name: string; state: string }[] = [
  { code: 'IKEDC', name: 'Ikeja Electric', state: 'Lagos Mainland' },
  { code: 'EKEDC', name: 'Eko Electricity', state: 'Lagos Island & Lekki' },
  { code: 'AEDC', name: 'Abuja Electricity', state: 'FCT, Niger, Kogi, Nasarawa' },
  { code: 'IBEDC', name: 'Ibadan Electricity', state: 'Oyo, Ogun, Osun, Kwara' },
  { code: 'EEDC', name: 'Enugu Electricity', state: 'Enugu, Abia, Imo, Ebonyi, Anambra' },
  { code: 'PHED', name: 'Port Harcourt Electricity', state: 'Rivers, Bayelsa, Cross River, Akwa Ibom' },
  { code: 'KEDCO', name: 'Kano Electricity', state: 'Kano, Katsina, Jigawa' },
  { code: 'KAEDCO', name: 'Kaduna Electricity', state: 'Kaduna, Sokoto, Kebbi, Zamfara' },
  { code: 'JEDC', name: 'Jos Electricity', state: 'Plateau, Bauchi, Benue, Gombe' },
  { code: 'BEDC', name: 'Benin Electricity', state: 'Edo, Delta, Ondo, Ekiti' },
  { code: 'YEDC', name: 'Yola Electricity', state: 'Adamawa, Borno, Taraba, Yobe' }
];

const AIRTIME_QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];
const ELECTRICITY_QUICK_AMOUNTS = [2000, 5000, 10000, 20000, 50000];

// Smart Nigerian mobile network prefix detector
function detectNetwork(phone: string): NigerianNetwork | null {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 4) return null;

  const prefix4 = clean.substring(0, 4);
  const mtnPrefixes = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtelPrefixes = ['0802', '0808', '0701', '0708', '0812', '0902', '0901', '0904', '0907', '0912'];
  const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobilePrefixes = ['0809', '0817', '0818', '0909', '0908'];

  if (mtnPrefixes.includes(prefix4)) return 'MTN';
  if (airtelPrefixes.includes(prefix4)) return 'Airtel';
  if (gloPrefixes.includes(prefix4)) return 'Glo';
  if (nineMobilePrefixes.includes(prefix4)) return '9mobile';

  return null;
}

export const BillsScreen: React.FC = () => {
  const { userProfile, activeUserId, wallets, navigate, showToast } = useApp();

  // Active Tab: 'airtime' | 'data' | 'utilities'
  const [activeTab, setActiveTab] = useState<'airtime' | 'data' | 'utilities'>('airtime');
  const [utilitySubTab, setUtilitySubTab] = useState<'electricity' | 'cable_tv'>('electricity');

  // Shared Form State
  const [selectedNetwork, setSelectedNetwork] = useState<NigerianNetwork>('MTN');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone ? userProfile.phone.replace('+234', '0').replace(/\s+/g, '') : '08035559201');
  const [airtimeAmount, setAirtimeAmount] = useState<number>(1000);
  const [customAirtimeAmount, setCustomAirtimeAmount] = useState<string>('');

  // Mobile Data State
  const [dataDurationFilter, setDataDurationFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'sme'>('all');
  const [availablePlans, setAvailablePlans] = useState<BillPlanDocument[]>(FALLBACK_BILL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<BillPlanDocument | null>(null);

  // Electricity State
  const [selectedDisco, setSelectedDisco] = useState<ElectricityDisco>('IKEDC');
  const [isDiscoPickerOpen, setIsDiscoPickerOpen] = useState<boolean>(false);
  const [discoSearchQuery, setDiscoSearchQuery] = useState<string>('');
  const [meterType, setMeterType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
  const [meterNumber, setMeterNumber] = useState<string>('01234567890');
  const [electricityAmount, setElectricityAmount] = useState<number>(5000);
  const [customElectricityAmount, setCustomElectricityAmount] = useState<string>('');
  const [verifiedCustomer, setVerifiedCustomer] = useState<CustomerVerificationResult | null>(null);
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState<boolean>(false);

  // Cable TV State
  const [cableProvider, setCableProvider] = useState<CableTvProvider>('DStv');
  const [smartcardNumber, setSmartcardNumber] = useState<string>('1029384756');
  const [selectedBouquet, setSelectedBouquet] = useState<BillPlanDocument | null>(null);

  // Provider Config & History
  const [config, setConfig] = useState<BillProviderConfigDocument | null>(null);
  const [transactions, setTransactions] = useState<BillTransactionDocument[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // PIN / Biometric Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<{
    reference: string;
    category: BillCategory;
    provider: string;
    recipientNumber: string;
    recipientName?: string;
    amount: number;
    fee: number;
    totalDebited: number;
    meterToken?: string;
    unitsKwh?: number;
    planName?: string;
    timestamp: number | string;
    status: string;
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Live NGN Wallet Balance
  const ngnWallet = wallets.find(w => w.currency === 'NGN');
  const ngnBalance = ngnWallet?.balance ?? 0;

  // Auto-detect network from phone
  useEffect(() => {
    const detected = detectNetwork(phoneNumber);
    if (detected && detected !== selectedNetwork) {
      setSelectedNetwork(detected);
    }
  }, [phoneNumber]);

  // Load Config & Plans
  useEffect(() => {
    async function loadInitialData() {
      const cfg = await db.getBillConfig();
      setConfig(cfg);
      const plans = await db.getBillPlans();
      if (plans && plans.length > 0) {
        setAvailablePlans(plans);
      } else {
        setAvailablePlans(FALLBACK_BILL_PLANS);
      }
      const txs = await db.getBillTransactions(activeUserId || 'usr_alade_01');
      setTransactions(txs);
    }
    loadInitialData();
  }, [activeUserId]);

  // Current DISCO and Filtered DISCOs for search modal
  const currentDisco = useMemo(() => {
    return NIGERIAN_DISCOS.find(d => d.code === selectedDisco) || NIGERIAN_DISCOS[0];
  }, [selectedDisco]);

  const filteredDiscos = useMemo(() => {
    if (!discoSearchQuery.trim()) return NIGERIAN_DISCOS;
    const q = discoSearchQuery.toLowerCase();
    return NIGERIAN_DISCOS.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q)
    );
  }, [discoSearchQuery]);

  // Filtered Data Plans
  const filteredDataPlans = useMemo(() => {
    return availablePlans.filter(p => {
      if (p.category !== 'data') return false;
      const prov = (p.provider || p.network_or_provider || '').toLowerCase();
      if (prov !== selectedNetwork.toLowerCase()) return false;
      if (dataDurationFilter !== 'all' && p.duration_type !== dataDurationFilter) return false;
      return p.is_active;
    });
  }, [availablePlans, selectedNetwork, dataDurationFilter]);

  // Cable TV Bouquets
  const cableBouquets = useMemo(() => {
    return availablePlans.filter(p => {
      if (p.category !== 'cable_tv') return false;
      const prov = (p.provider || p.network_or_provider || '').toLowerCase();
      if (prov !== cableProvider.toLowerCase()) return false;
      return p.is_active;
    });
  }, [availablePlans, cableProvider]);

  // Verify Meter / Smartcard
  const handleVerifyCustomer = async (category: 'electricity' | 'cable_tv') => {
    setIsVerifyingCustomer(true);
    setVerifiedCustomer(null);
    try {
      const targetNumber = category === 'electricity' ? meterNumber : smartcardNumber;
      const targetProvider = category === 'electricity' ? selectedDisco : cableProvider;

      const res = await db.validateCustomer(category, targetProvider, targetNumber, meterType);
      if (res.success) {
        setVerifiedCustomer(res);
        showToast(`Customer verified: ${res.customerName}`, 'success');
      } else {
        showToast(res.error || 'Verification failed. Please check number.', 'error');
      }
    } catch (_err) {
      showToast('Error verifying customer account.', 'error');
    } finally {
      setIsVerifyingCustomer(false);
    }
  };

  // Compute Active Checkout Summary
  const checkoutSummary = useMemo(() => {
    let amount = 0;
    let fee = 0;
    let discount = 0;
    let recipient = '';
    let recipientName = verifiedCustomer?.customerName || userProfile?.name || 'Chief Babatunde Alade';
    let planCode: string | undefined = undefined;
    let planName: string | undefined = undefined;

    const discountPct = config?.airtime_discount_pct || 2.0;
    const utilityFee = config?.utility_convenience_fee_ngn || 100.0;

    if (activeTab === 'airtime') {
      amount = customAirtimeAmount ? Number(customAirtimeAmount) : airtimeAmount;
      discount = (amount * discountPct) / 100;
      fee = 0;
      recipient = phoneNumber;
    } else if (activeTab === 'data') {
      amount = selectedPlan?.selling_price_ngn || selectedPlan?.selling_price || 0;
      fee = 0;
      recipient = phoneNumber;
      planCode = selectedPlan?.plan_code;
      planName = selectedPlan?.plan_name;
    } else if (activeTab === 'utilities') {
      if (utilitySubTab === 'electricity') {
        amount = customElectricityAmount ? Number(customElectricityAmount) : electricityAmount;
        fee = utilityFee;
        recipient = meterNumber;
      } else {
        amount = selectedBouquet?.selling_price_ngn || selectedBouquet?.selling_price || 0;
        fee = utilityFee;
        recipient = smartcardNumber;
        planCode = selectedBouquet?.plan_code;
        planName = selectedBouquet?.plan_name;
      }
    }

    const totalDebited = Math.max(0, amount - discount + fee);

    return {
      category: activeTab === 'utilities' ? utilitySubTab : activeTab,
      provider: activeTab === 'utilities' ? (utilitySubTab === 'electricity' ? selectedDisco : cableProvider) : selectedNetwork,
      amount,
      discount,
      fee,
      totalDebited,
      recipient,
      recipientName,
      planCode,
      planName
    };
  }, [
    activeTab,
    utilitySubTab,
    selectedNetwork,
    phoneNumber,
    airtimeAmount,
    customAirtimeAmount,
    selectedPlan,
    selectedDisco,
    meterType,
    meterNumber,
    electricityAmount,
    customElectricityAmount,
    cableProvider,
    smartcardNumber,
    selectedBouquet,
    verifiedCustomer,
    config,
    userProfile
  ]);

  // Initiate Payment Execution
  const handleConfirmPayment = async () => {
    if (checkoutSummary.totalDebited <= 0) {
      showToast('Please select a plan or enter a valid amount', 'error');
      return;
    }

    if (ngnBalance < checkoutSummary.totalDebited) {
      showToast(`Insufficient NGN balance. You need ₦${checkoutSummary.totalDebited.toLocaleString()}`, 'error');
      return;
    }

    if (pinCode.length < 4) {
      showToast('Please enter your 4-digit transaction PIN', 'error');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await db.vendBill({
        userId: activeUserId || 'usr_alade_01',
        pin: pinCode,
        category: checkoutSummary.category as BillCategory,
        provider: checkoutSummary.provider,
        recipientNumber: checkoutSummary.recipient,
        recipientName: checkoutSummary.recipientName,
        planCode: checkoutSummary.planCode,
        planName: checkoutSummary.planName,
        amount: checkoutSummary.amount,
        fee: checkoutSummary.fee,
        meterType: meterType
      });

      if (res.success) {
        setIsCheckoutOpen(false);
        setPinCode('');
        setActiveReceipt({
          reference: res.reference || `VTU-${Date.now()}`,
          category: checkoutSummary.category as BillCategory,
          provider: checkoutSummary.provider,
          recipientNumber: checkoutSummary.recipient,
          recipientName: checkoutSummary.recipientName,
          amount: checkoutSummary.amount,
          fee: checkoutSummary.fee,
          totalDebited: checkoutSummary.totalDebited,
          meterToken: res.meterToken,
          unitsKwh: res.unitsKwh,
          planName: checkoutSummary.planName,
          timestamp: Date.now(),
          status: 'successful'
        });

        // Refresh transaction list
        const updatedTxs = await db.getBillTransactions(activeUserId || 'usr_alade_01');
        setTransactions(updatedTxs);
        showToast('Bill payment completed successfully!', 'success');
      } else {
        showToast(res.error || 'Payment failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Payment execution error', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Copy 20-digit electricity token
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token.replace(/-/g, ''));
    setCopiedToken(true);
    showToast('Token copied to clipboard!', 'success');
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-36">
      {/* 1. STICKY TOP APP BAR */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Airtime & Bills
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                Instant VTU
              </span>
            </h1>
            <p className="text-xs text-slate-400">Direct carrier & DISCO settlement</p>
          </div>
        </div>

        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shrink-0"
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>Receipts</span>
        </button>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* 2. STRICT NAIRA (NGN) WALLET BALANCE CARD */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇳🇬</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                NGN Naira Wallet Balance
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              VTU Source
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                ₦{ngnBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-500" />
                Payments debited exclusively from Naira balance (RMB & USD excluded).
              </p>
            </div>

            <button
              onClick={() => navigate('fund')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap shrink-0"
            >
              + Fund
            </button>
          </div>
        </div>

        {/* 3. 3-TAB SELECTOR (Airtime, Mobile Data, Utility Bills) */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('airtime')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'airtime'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Airtime</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Mobile Data</span>
          </button>

          <button
            onClick={() => setActiveTab('utilities')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'utilities'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Utilities</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: AIRTIME VENDING */}
        {/* ============================================================= */}
        {activeTab === 'airtime' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Visual Network Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Select Network Provider
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['MTN', 'Airtel', 'Glo', '9mobile'] as NigerianNetwork[]).map((net) => {
                  const isSelected = selectedNetwork === net;
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedNetwork(net)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-center">
                        <TelcoLogo provider={net} size="md" />
                      </div>
                      <span className={`text-[11px] font-bold block ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {net}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Recipient Phone Number
                </label>
                {detectNetwork(phoneNumber) && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ {detectNetwork(phoneNumber)} Detected
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={11}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0803 000 0000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white outline-none tracking-wider transition-colors"
                />
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Top-up Amount
                </label>
                <span className="text-[11px] font-bold text-emerald-400">
                  2% Instant Cashback Applied
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AIRTIME_QUICK_AMOUNTS.map((amt) => {
                  const isSelected = !customAirtimeAmount && airtimeAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAirtimeAmount(amt);
                        setCustomAirtimeAmount('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 font-bold'
                      }`}
                    >
                      <span className="text-xs">₦{amt.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">₦</span>
                  <input
                    type="number"
                    value={customAirtimeAmount}
                    onChange={(e) => setCustomAirtimeAmount(e.target.value)}
                    placeholder="Enter other amount (min ₦50)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: MOBILE DATA BUNDLES */}
        {/* ============================================================= */}
        {activeTab === 'data' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Network Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Select Network Provider
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['MTN', 'Airtel', 'Glo', '9mobile'] as NigerianNetwork[]).map((net) => {
                  const isSelected = selectedNetwork === net;
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => {
                        setSelectedNetwork(net);
                        setSelectedPlan(null);
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-center">
                        <TelcoLogo provider={net} size="md" />
                      </div>
                      <span className={`text-[11px] font-bold block ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {net}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Phone */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <input
                type="tel"
                maxLength={11}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Recipient Phone (0803 000 0000)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
              />
            </div>

            {/* Duration Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Plans' },
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'sme', label: 'SME Corporate' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDataDurationFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    dataDurationFilter === f.id
                      ? 'bg-slate-200 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Selectable Data Plans Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Select Bundle ({filteredDataPlans.length} active plans)
              </label>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredDataPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 flex items-center justify-center">
                          <TelcoLogo
                            provider={plan.provider || plan.network_or_provider || selectedNetwork}
                            size="sm"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{plan.plan_name}</h4>
                          <span className="text-[11px] text-slate-400">{plan.validity}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-white font-mono">
                          ₦{(plan.selling_price_ngn || plan.selling_price || 0).toLocaleString()}
                        </span>
                        <div className={`w-4 h-4 rounded-full border ml-auto mt-1 flex items-center justify-center ${
                          isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: UTILITY BILLS (Electricity & Cable TV) */}
        {/* ============================================================= */}
        {activeTab === 'utilities' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Utilities Sub-toggle */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  setUtilitySubTab('electricity');
                  setVerifiedCustomer(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  utilitySubTab === 'electricity'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Electricity DISCOs</span>
              </button>

              <button
                onClick={() => {
                  setUtilitySubTab('cable_tv');
                  setVerifiedCustomer(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  utilitySubTab === 'cable_tv'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Cable TV</span>
              </button>
            </div>

            {/* 3A. ELECTRICITY DISCO FORM */}
            {utilitySubTab === 'electricity' && (
              <div className="space-y-3">
                {/* DISCO Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Electricity Distribution Company (DISCO)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscoSearchQuery('');
                      setIsDiscoPickerOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl px-3.5 py-3 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 flex items-center justify-center">
                        <DiscoLogo disco={selectedDisco} size="md" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {currentDisco.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                            {currentDisco.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {currentDisco.state}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-2" />
                  </button>
                </div>

                {/* Prepaid / Postpaid Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMeterType('Prepaid');
                      setVerifiedCustomer(null);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      meterType === 'Prepaid'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ Prepaid (Generates Token)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeterType('Postpaid');
                      setVerifiedCustomer(null);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      meterType === 'Postpaid'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    📄 Postpaid (Direct Bill)
                  </button>
                </div>

                {/* Meter Number with Live Verification Trigger */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Meter Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => {
                        setMeterNumber(e.target.value);
                        setVerifiedCustomer(null);
                      }}
                      placeholder="e.g. 01234567890"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifyingCustomer || !meterNumber.trim()}
                      onClick={() => handleVerifyCustomer('electricity')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingCustomer ? 'Verifying...' : 'Verify Meter'}
                    </button>
                  </div>

                  {/* Customer Verification Dossier */}
                  {verifiedCustomer && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>✓ Verified Meter Account</span>
                        <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-white font-bold">{verifiedCustomer.customerName}</p>
                      <p className="text-slate-400 text-[11px]">{verifiedCustomer.address}</p>
                      <p className="text-slate-400 text-[11px]">Tariff: {verifiedCustomer.tariffClass}</p>
                    </div>
                  )}
                </div>

                {/* Electricity Amount */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Recharge Amount
                    </label>
                    <span className="text-[11px] text-slate-400">
                      +₦100 Convenience Fee
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {ELECTRICITY_QUICK_AMOUNTS.slice(0, 3).map((amt) => {
                      const isSelected = !customElectricityAmount && electricityAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setElectricityAmount(amt);
                            setCustomElectricityAmount('');
                          }}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">₦</span>
                    <input
                      type="number"
                      value={customElectricityAmount}
                      onChange={(e) => setCustomElectricityAmount(e.target.value)}
                      placeholder="Other electricity amount (min ₦1,000)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3B. CABLE TV FORM */}
            {utilitySubTab === 'cable_tv' && (
              <div className="space-y-3">
                {/* Cable Provider Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {(['DStv', 'GOtv', 'Startimes'] as CableTvProvider[]).map((c) => {
                    const isSelected = cableProvider === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCableProvider(c);
                          setSelectedBouquet(null);
                          setVerifiedCustomer(null);
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20'
                            : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-center">
                          <CableLogo provider={c} size="md" />
                        </div>
                        <span className={`text-[11px] font-bold block ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Smartcard Input */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Smartcard / IUC Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={smartcardNumber}
                      onChange={(e) => {
                        setSmartcardNumber(e.target.value);
                        setVerifiedCustomer(null);
                      }}
                      placeholder="Enter 10-digit IUC number"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifyingCustomer || !smartcardNumber.trim()}
                      onClick={() => handleVerifyCustomer('cable_tv')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingCustomer ? 'Verifying...' : 'Verify IUC'}
                    </button>
                  </div>

                  {verifiedCustomer && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>✓ Verified Subscriber</span>
                        <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-white font-bold">{verifiedCustomer.customerName}</p>
                      <p className="text-slate-400 text-[11px]">Current: {verifiedCustomer.currentBouquet}</p>
                    </div>
                  )}
                </div>

                {/* Bouquet Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block px-1">
                    Select Bouquet Plan ({cableBouquets.length} available)
                  </label>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {cableBouquets.map((b) => {
                      const isSelected = selectedBouquet?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBouquet(b)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/20 text-white font-bold'
                              : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CableLogo provider={cableProvider} size="sm" />
                            <span className="text-xs truncate">{b.plan_name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 ml-2">
                            ₦{(b.selling_price_ngn || b.selling_price || 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TOTAL BILL SUMMARY & CHECKOUT BUTTON */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total NGN Wallet Debit:</span>
            <span className="text-base font-black text-white font-mono">
              ₦{checkoutSummary.totalDebited.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {checkoutSummary.discount > 0 && (
            <div className="flex items-center justify-between text-[11px] text-emerald-400">
              <span>Cashback Savings:</span>
              <span>-₦{checkoutSummary.discount.toFixed(2)}</span>
            </div>
          )}

          {checkoutSummary.fee > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Convenience Fee:</span>
              <span>+₦{checkoutSummary.fee.toFixed(2)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (checkoutSummary.totalDebited <= 0) {
                showToast('Please specify a valid bill purchase amount', 'error');
                return;
              }
              setIsCheckoutOpen(true);
            }}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 5. NGN-ONLY CHECKOUT & PIN / BIOMETRIC CONFIRMATION MODAL */}
      {/* ============================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Authorize Bill Payment</h3>
                  <p className="text-[10px] text-slate-400">Debit from Naira (NGN) Wallet</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breakdown Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  {checkoutSummary.category === 'electricity' ? (
                    <DiscoLogo disco={checkoutSummary.provider} size="sm" />
                  ) : checkoutSummary.category === 'cable_tv' ? (
                    <CableLogo provider={checkoutSummary.provider} size="sm" />
                  ) : (
                    <TelcoLogo provider={checkoutSummary.provider} size="sm" />
                  )}
                  <div>
                    <span className="text-white font-bold block">{checkoutSummary.provider}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{checkoutSummary.category}</span>
                  </div>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  ₦{checkoutSummary.totalDebited.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recipient:</span>
                <span className="text-white font-mono">{checkoutSummary.recipient}</span>
              </div>
              {checkoutSummary.planName && (
                <div className="flex justify-between text-slate-400">
                  <span>Plan / Bouquet:</span>
                  <span className="text-white font-bold">{checkoutSummary.planName}</span>
                </div>
              )}
            </div>

            {/* Transaction PIN Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block text-center">
                Enter 4-Digit Transaction PIN
              </label>
              <div className="flex justify-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-36 text-center tracking-[1em] text-lg font-mono font-bold bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 text-white outline-none"
                />
              </div>
            </div>

            {/* Biometric Quick Trigger (Face ID / Fingerprint) */}
            <button
              type="button"
              onClick={() => {
                setPinCode('1234');
                showToast('Biometric verified (Face ID / Touch ID)', 'success');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>Use Face ID / Fingerprint</span>
            </button>

            {/* Confirm Payment Action */}
            <button
              type="button"
              disabled={isProcessingPayment || pinCode.length < 4}
              onClick={handleConfirmPayment}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Dispensing with Vendor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Debit NGN Wallet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. RECEIPT & ELECTRICITY TOKEN MODAL */}
      {/* ============================================================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            {/* Header / Success Badge */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Vending Successful!</h3>
              <p className="text-xs text-slate-400">Ref: {activeReceipt.reference}</p>
            </div>

            {/* PROMINENT 1-TAP COPY 20-DIGIT TOKEN FOR PREPAID ELECTRICITY */}
            {activeReceipt.meterToken && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/50 space-y-2 text-center shadow-lg">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  ⚡ Prepaid Electricity 20-Digit Token
                </span>
                <div className="py-1 px-2 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 font-mono font-extrabold text-sm tracking-wider select-all">
                  {activeReceipt.meterToken}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyToken(activeReceipt.meterToken!)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied!' : '1-Tap Copy Token'}</span>
                  </button>
                  {activeReceipt.unitsKwh && (
                    <span className="text-xs text-slate-300 font-semibold">
                      Units: {activeReceipt.unitsKwh} kWh
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Receipt Summary Grid */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  {activeReceipt.category === 'electricity' ? (
                    <DiscoLogo disco={activeReceipt.provider} size="sm" />
                  ) : activeReceipt.category === 'cable_tv' ? (
                    <CableLogo provider={activeReceipt.provider} size="sm" />
                  ) : (
                    <TelcoLogo provider={activeReceipt.provider} size="sm" />
                  )}
                  <span className="text-white font-bold">{activeReceipt.provider}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{activeReceipt.category}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recipient:</span>
                <span className="text-white font-mono">{activeReceipt.recipientNumber}</span>
              </div>
              {activeReceipt.recipientName && (
                <div className="flex justify-between text-slate-400">
                  <span>Customer Name:</span>
                  <span className="text-white font-medium">{activeReceipt.recipientName}</span>
                </div>
              )}
              {activeReceipt.planName && (
                <div className="flex justify-between text-slate-400">
                  <span>Bundle / Bouquet:</span>
                  <span className="text-white font-semibold">{activeReceipt.planName}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="text-white font-mono font-bold">₦{activeReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                <span>Total Debited:</span>
                <span>₦{activeReceipt.totalDebited.toLocaleString()}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 7. RECEIPT HISTORY DRAWER */}
      {/* ============================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Bill Payment Receipts</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No bill payment receipts found.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white uppercase flex items-center gap-2">
                        {tx.category === 'electricity' ? (
                          <DiscoLogo disco={tx.provider} size="sm" />
                        ) : tx.category === 'cable_tv' ? (
                          <CableLogo provider={tx.provider} size="sm" />
                        ) : (
                          <TelcoLogo provider={tx.provider} size="sm" />
                        )}
                        <span>{tx.provider} ({tx.category})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'successful'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.status === 'refunded'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Recipient: {tx.recipient_number}</span>
                      <span className="font-mono font-bold text-white">
                        ₦{(tx.total_debited_ngn || tx.amount_ngn).toLocaleString()}
                      </span>
                    </div>

                    {(tx.meter_token || tx.token) && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <span className="font-mono text-amber-300 font-bold">{tx.meter_token || tx.token}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyToken(tx.meter_token || tx.token!)}
                          className="text-[10px] text-amber-400 font-bold hover:underline"
                        >
                          Copy Token
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Ref: {tx.reference}</span>
                      <span>{new Date(tx.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* 7. DISCO BOTTOM-SHEET / MODAL PICKER */}
      {isDiscoPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setIsDiscoPickerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Electricity DISCO</h3>
                  <p className="text-[10px] text-slate-400">11 distribution companies nationwide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscoPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3 border-b border-slate-800/60 bg-slate-900/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={discoSearchQuery}
                  onChange={(e) => setDiscoSearchQuery(e.target.value)}
                  placeholder="Search by DISCO name, code or state..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* DISCOs List */}
            <div className="p-3 space-y-2 overflow-y-auto max-h-[58vh]">
              {filteredDiscos.map((disco) => {
                const isSelected = selectedDisco === disco.code;
                return (
                  <button
                    key={disco.code}
                    type="button"
                    onClick={() => {
                      setSelectedDisco(disco.code);
                      setVerifiedCustomer(null);
                      setIsDiscoPickerOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 flex items-center justify-center">
                        <DiscoLogo disco={disco.code} size="md" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                            {disco.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            {disco.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Coverage: {disco.state}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}

              {filteredDiscos.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No distribution company found matching "{discoSearchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
