import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  BillPlanDocument,
  BillTransactionDocument,
  BillProviderConfigDocument,
  BillCategory,
  NigerianNetwork,
  ElectricityDisco,
  CableTvProvider
} from '../../types';
import {
  Zap,
  Phone,
  Wifi,
  Tv,
  Layers,
  Settings,
  Sliders,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  Copy,
  RefreshCw,
  Eye,
  ShieldCheck,
  Activity,
  ArrowUpDown
} from 'lucide-react';

export const AdminBillsServicesScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();

  const [activeTab, setActiveTab] = useState<'settings' | 'pricing' | 'ledger'>('settings');

  // Config State
  const [config, setConfig] = useState<BillProviderConfigDocument | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [providerMode, setProviderMode] = useState<'simulated' | 'vtpass' | 'clubkonnect'>('simulated');
  const [airtimeDiscount, setAirtimeDiscount] = useState<number>(2.0);
  const [utilityFee, setUtilityFee] = useState<number>(100);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [enabledServices, setEnabledServices] = useState({
    airtime: true,
    data: true,
    electricity: true,
    cable_tv: true,
    mtn: true,
    airtel: true,
    glo: true,
    '9mobile': true
  });

  // Plans State
  const [plans, setPlans] = useState<BillPlanDocument[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [planCategoryFilter, setPlanCategoryFilter] = useState<'all' | 'data' | 'cable_tv'>('all');
  const [planProviderFilter, setPlanProviderFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<BillPlanDocument | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    category: 'data' as BillCategory,
    provider: 'MTN',
    plan_code: '',
    plan_name: '',
    validity: '30 Days',
    cost_price: 1000,
    selling_price: 1050,
    is_active: true
  });

  // Transactions / Ledger State
  const [transactions, setTransactions] = useState<BillTransactionDocument[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<BillTransactionDocument | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial Data Load
  const loadData = async () => {
    try {
      setIsLoadingPlans(true);
      setIsLoadingTx(true);

      const [cfg, fetchedPlans, adminData] = await Promise.all([
        db.getBillConfig(),
        db.getBillPlans(),
        db.adminGetAllBills()
      ]);

      if (cfg) {
        setConfig(cfg);
        const activeProv = (cfg.active_provider || cfg.provider_name || 'simulated').toLowerCase();
        if (activeProv.includes('vtpass')) {
          setProviderMode('vtpass');
        } else if (activeProv.includes('clubkonnect')) {
          setProviderMode('clubkonnect');
        } else {
          setProviderMode('simulated');
        }
        setAirtimeDiscount(cfg.airtime_discount_percentage ?? cfg.airtime_discount_pct ?? 2.0);
        setUtilityFee(cfg.convenience_fee_ngn ?? cfg.utility_convenience_fee_ngn ?? 100);
        setApiKey(cfg.api_key || '');
        setApiSecret(cfg.api_secret || '');
        setApiBaseUrl(cfg.api_base_url || cfg.base_url || '');
        if (cfg.enabled_services) {
          setEnabledServices(prev => ({ ...prev, ...cfg.enabled_services }));
        }
      }

      setPlans(fetchedPlans);
      setTransactions(adminData?.transactions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load bills admin data', 'error');
    } finally {
      setIsLoadingPlans(false);
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      // Re-fetch transactions on db change
      db.adminGetAllBills().then(d => {
        if (d && Array.isArray(d.transactions)) {
          setTransactions(d.transactions);
        }
      }).catch(() => {});
    });
    return () => unsub();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Save Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await db.adminUpdateBillConfig({
        active_provider: providerMode,
        airtime_discount_percentage: Number(airtimeDiscount),
        convenience_fee_ngn: Number(utilityFee),
        api_key: apiKey,
        api_secret: apiSecret,
        api_base_url: apiBaseUrl,
        enabled_services: enabledServices
      });
      if (res.config) {
        setConfig(res.config);
      }
      showToast('VTU & Bill provider configurations updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update config', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Toggle Plan Active
  const handleTogglePlan = async (plan: BillPlanDocument) => {
    try {
      const res = await db.adminToggleBillPlan(plan.id, !plan.is_active);
      if (res.plan) {
        setPlans(prev => prev.map(p => p.id === plan.id ? res.plan! : p));
        showToast(`Plan ${plan.plan_name} is now ${res.plan.is_active ? 'Active' : 'Disabled'}`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle plan', 'error');
    }
  };

  // Open Edit / Create Plan Modal
  const handleOpenPlanModal = (plan?: BillPlanDocument) => {
    if (plan) {
      setSelectedPlan(plan);
      setPlanFormData({
        category: plan.category,
        provider: plan.provider,
        plan_code: plan.plan_code,
        plan_name: plan.plan_name,
        validity: plan.validity || '',
        cost_price: plan.cost_price,
        selling_price: plan.selling_price,
        is_active: plan.is_active
      });
    } else {
      setSelectedPlan(null);
      setPlanFormData({
        category: 'data',
        provider: 'MTN',
        plan_code: '',
        plan_name: '',
        validity: '30 Days',
        cost_price: 1000,
        selling_price: 1050,
        is_active: true
      });
    }
    setIsPlanModalOpen(true);
  };

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<BillPlanDocument> = {
        ...(selectedPlan ? { id: selectedPlan.id } : {}),
        category: planFormData.category,
        provider: planFormData.provider,
        plan_code: planFormData.plan_code,
        plan_name: planFormData.plan_name,
        validity: planFormData.validity,
        cost_price: Number(planFormData.cost_price),
        selling_price: Number(planFormData.selling_price),
        is_active: planFormData.is_active
      };

      const res = await db.adminSaveBillPlan(payload);
      if (res.plan) {
        if (selectedPlan) {
          setPlans(prev => prev.map(p => p.id === res.plan!.id ? res.plan! : p));
          showToast('Plan pricing updated successfully', 'success');
        } else {
          setPlans(prev => [res.plan!, ...prev]);
          showToast('New plan created successfully', 'success');
        }
      }
      setIsPlanModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan', 'error');
    }
  };

  // Trigger Manual Refund
  const handleExecuteRefund = async () => {
    if (!selectedTx) return;
    if (!refundReason.trim()) {
      showToast('Please provide a reason for the manual refund', 'error');
      return;
    }

    setIsRefunding(true);
    try {
      const result = await db.adminRefundBill(
        selectedTx.id,
        refundReason
      );
      setTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, status: 'refunded', admin_notes: refundReason } : t));
      setSelectedTx(prev => prev ? { ...prev, status: 'refunded', admin_notes: refundReason } : null);
      showToast(`₦${selectedTx.amount_ngn.toLocaleString()} refunded to customer wallet`, 'success');
      setRefundReason('');
    } catch (err: any) {
      showToast(err.message || 'Refund execution failed', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (planCategoryFilter !== 'all' && p.category !== planCategoryFilter) return false;
      if (planProviderFilter !== 'all' && p.provider !== planProviderFilter) return false;
      if (planSearch) {
        const q = planSearch.toLowerCase();
        const planProv = (p.provider || p.network_or_provider || '').toLowerCase();
        const planName = (p.plan_name || '').toLowerCase();
        const planCode = (p.plan_code || '').toLowerCase();
        return (
          planName.includes(q) ||
          planCode.includes(q) ||
          planProv.includes(q)
        );
      }
      return true;
    });
  }, [plans, planCategoryFilter, planProviderFilter, planSearch]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (txStatusFilter !== 'all' && t.status !== txStatusFilter) return false;
      if (txCategoryFilter !== 'all' && t.category !== txCategoryFilter) return false;
      if (txSearch) {
        const q = txSearch.toLowerCase();
        return (
          t.reference.toLowerCase().includes(q) ||
          t.recipient_number.toLowerCase().includes(q) ||
          t.user_id.toLowerCase().includes(q) ||
          (t.token && t.token.includes(q))
        );
      }
      return true;
    });
  }, [transactions, txStatusFilter, txCategoryFilter, txSearch]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner & Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Nigerian VTU & Utility Bills Command Center
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {(providerMode || 'simulated').toUpperCase()} GATEWAY
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage Airtime (MTN, Airtel, Glo, 9mobile), Mobile Data Bundles, Prepaid/Postpaid DISCOs & Cable TV bouquets.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Provider & Fees</span>
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'pricing'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Data & TV Pricing ({plans.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'ledger'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bills Ledger ({transactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: PROVIDER & FEE SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Provider Integration */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm pb-2 border-b border-slate-800">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Gateway Engine & Runtime Mode</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Active Vending Adapter
                    </label>
                    <select
                      value={providerMode}
                      onChange={(e) => setProviderMode(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-400"
                    >
                      <option value="simulated">Simulator Mode (Instant 20-Digit Tokens & Success)</option>
                      <option value="vtpass">VTpass Production Gateway</option>
                      <option value="clubkonnect">ClubKonnect Production Gateway</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      In simulator mode, valid transactions vend immediately without debiting live VTU wallets.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="https://api.vtpass.com/api"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      API Public Key / Client ID
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="vtpass_live_pk_..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      API Secret Key / Password
                    </label>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Pricing Margins & Fees */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm pb-2 border-b border-slate-800">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Customer Discounts & Convenience Fees</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 font-semibold">
                        Airtime Customer Discount (%)
                      </label>
                      <span className="text-xs font-black text-emerald-400">
                        {airtimeDiscount}% off
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={airtimeDiscount}
                        onChange={(e) => setAirtimeDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 font-mono font-bold"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Customer pays ₦{((1000 * (100 - airtimeDiscount)) / 100).toFixed(0)} for ₦1,000 airtime.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 font-semibold">
                        Electricity & Cable TV Convenience Fee (NGN)
                      </label>
                      <span className="text-xs font-black text-amber-400">
                        +₦{utilityFee}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₦</span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        max="1000"
                        value={utilityFee}
                        onChange={(e) => setUtilityFee(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Added on top of meter token purchases and cable subscription renewals.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Live Edge Function Target:</p>
                    <p className="font-mono text-[10px] text-emerald-400 truncate">
                      https://oalpwwreypjprsmkcdvq.supabase.co/functions/v1/vend-nigeria-bill
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Network & Category Toggles */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Service Availability Switches</span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'airtime', label: 'Airtime Vending' },
                    { key: 'data', label: 'Mobile Data Bundles' },
                    { key: 'electricity', label: 'Electricity DISCOs' },
                    { key: 'cable_tv', label: 'Cable TV Bouquets' },
                    { key: 'mtn', label: 'MTN Nigeria' },
                    { key: 'airtel', label: 'Airtel Nigeria' },
                    { key: 'glo', label: 'Globacom (Glo)' },
                    { key: '9mobile', label: '9mobile Nigeria' },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                      <span className="text-xs font-semibold text-slate-300">{s.label}</span>
                      <input
                        type="checkbox"
                        checked={(enabledServices as any)[s.key] ?? true}
                        onChange={(e) => setEnabledServices(prev => ({ ...prev, [s.key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 hover:opacity-95 transition-all flex items-center gap-2"
              >
                {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Provider Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DATA & CABLE PLAN PRICING MANAGER */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    placeholder="Search plans by name, code or network..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <select
                  value={planCategoryFilter}
                  onChange={(e) => setPlanCategoryFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="data">Mobile Data</option>
                  <option value="cable_tv">Cable TV</option>
                </select>

                <select
                  value={planProviderFilter}
                  onChange={(e) => setPlanProviderFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Providers</option>
                  <option value="MTN">MTN</option>
                  <option value="Airtel">Airtel</option>
                  <option value="Glo">Glo</option>
                  <option value="9mobile">9mobile</option>
                  <option value="DStv">DStv</option>
                  <option value="GOtv">GOtv</option>
                  <option value="Startimes">Startimes</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenPlanModal()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Plan</span>
              </button>
            </div>

            {/* Plans Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Provider / Category</th>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Plan Code</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4 text-right">Cost Price</th>
                      <th className="py-3 px-4 text-right">Selling Price</th>
                      <th className="py-3 px-4 text-right">Gross Margin</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No plans matched your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan) => {
                        const margin = plan.selling_price - plan.cost_price;
                        const marginPercent = plan.cost_price > 0 ? ((margin / plan.cost_price) * 100).toFixed(1) : '0';

                        return (
                          <tr key={plan.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{plan.provider}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold uppercase">
                                  {plan.category.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-200">
                              {plan.plan_name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {plan.plan_code}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {plan.validity || '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                              ₦{plan.cost_price.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              ₦{plan.selling_price.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                margin >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                +₦{margin.toLocaleString()} ({marginPercent}%)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleTogglePlan(plan)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                  plan.is_active
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}
                              >
                                {plan.is_active ? 'ACTIVE' : 'DISABLED'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenPlanModal(plan)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                                title="Edit Pricing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE BILLS LEDGER & OPERATIONS */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search by reference, recipient, user or token..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                <select
                  value={txCategoryFilter}
                  onChange={(e) => setTxCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="airtime">Airtime</option>
                  <option value="data">Data</option>
                  <option value="electricity">Electricity</option>
                  <option value="cable_tv">Cable TV</option>
                </select>
              </div>

              <button
                onClick={loadData}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Ledger</span>
              </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Ref & Date</th>
                      <th className="py-3 px-4">Category / Provider</th>
                      <th className="py-3 px-4">Customer Recipient</th>
                      <th className="py-3 px-4 text-right">Amount (NGN)</th>
                      <th className="py-3 px-4">Prepaid Token</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No bill transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-white">{tx.reference}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(tx.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{tx.provider}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                                {tx.category}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {tx.package_name || 'Standard'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-200">{tx.recipient_number}</div>
                            {tx.customer_name && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {tx.customer_name}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            ₦{tx.amount_ngn.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {tx.token ? (
                              <div
                                onClick={() => handleCopy(tx.token!, `token-${tx.id}`)}
                                className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1 cursor-pointer hover:bg-amber-500/20 text-[11px]"
                                title="Click to copy token"
                              >
                                <span>{tx.token}</span>
                                <Copy className="w-2.5 h-2.5" />
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.status === 'successful'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : tx.status === 'refunded'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : tx.status === 'failed'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[11px] font-semibold ml-auto"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>
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

      {/* PLAN MODAL (ADD / EDIT) */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>{selectedPlan ? 'Edit Bill / Bundle Plan' : 'Add New Bill / Bundle Plan'}</span>
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Category</label>
                <select
                  value={planFormData.category}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="data">Mobile Data</option>
                  <option value="cable_tv">Cable TV</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Provider</label>
                <input
                  type="text"
                  value={planFormData.provider}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="MTN, Airtel, DStv, etc."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Plan Code</label>
                <input
                  type="text"
                  value={planFormData.plan_code}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, plan_code: e.target.value }))}
                  placeholder="e.g. mtn-data-1gb or dstv-padi"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Plan Display Name</label>
                <input
                  type="text"
                  value={planFormData.plan_name}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                  placeholder="e.g. 1.0GB Monthly Plan"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Validity</label>
                <input
                  type="text"
                  value={planFormData.validity}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, validity: e.target.value }))}
                  placeholder="30 Days / 1 Month"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Cost Price (NGN)</label>
                  <input
                    type="number"
                    value={planFormData.cost_price}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Selling Price (NGN)</label>
                  <input
                    type="number"
                    value={planFormData.selling_price}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION INSPECTION DRAWER */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full h-[90vh] flex flex-col p-6 space-y-4 shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Transaction #{selectedTx.reference}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedTx.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Prepaid Token Box if Electricity */}
              {selectedTx.token && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider block">
                    Prepaid Electricity Token
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-mono font-black text-amber-400 tracking-wider">
                      {selectedTx.token}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedTx.token!, 'drawer-token')}
                      className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'drawer-token' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold">Vending Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedTx.status === 'successful'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : selectedTx.status === 'refunded'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : selectedTx.status === 'failed'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedTx.status}
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                  Settlement Breakdown (NGN Wallet)
                </span>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Base Amount:</span>
                  <span className="font-mono text-white">₦{selectedTx.amount_ngn.toLocaleString()}</span>
                </div>
                {selectedTx.fee_ngn > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Convenience Fee:</span>
                    <span className="font-mono text-amber-400">+₦{selectedTx.fee_ngn.toLocaleString()}</span>
                  </div>
                )}
                {selectedTx.discount_ngn > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Airtime Discount:</span>
                    <span className="font-mono text-emerald-400">-₦{selectedTx.discount_ngn.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-t border-slate-800 font-bold text-sm">
                  <span className="text-white">Total Customer Debit:</span>
                  <span className="font-mono text-emerald-400">
                    ₦{(selectedTx.amount_ngn + selectedTx.fee_ngn - selectedTx.discount_ngn).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Recipient & Customer Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                  Destination Target
                </span>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Recipient / Meter / IUC:</span>
                  <span className="font-mono font-bold text-white">{selectedTx.recipient_number}</span>
                </div>
                {selectedTx.customer_name && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Verified Customer:</span>
                    <span className="text-white font-semibold">{selectedTx.customer_name}</span>
                  </div>
                )}
                {selectedTx.customer_address && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Service Address:</span>
                    <span className="text-slate-300 text-right max-w-[200px]">{selectedTx.customer_address}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">FlyeMass User ID:</span>
                  <span className="font-mono text-slate-400">{selectedTx.user_id}</span>
                </div>
              </div>

              {/* Raw Gateway Response */}
              {selectedTx.raw_response && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Gateway API Payload & Raw Response
                  </span>
                  <pre className="font-mono text-[10px] text-slate-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto max-h-36">
                    {JSON.stringify(selectedTx.raw_response, null, 2)}
                  </pre>
                </div>
              )}

              {/* Manual Refund Section (If Failed or Successful) */}
              {selectedTx.status !== 'refunded' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <RotateCcw className="w-4 h-4" />
                    <span>Emergency Manual Wallet Refund</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Immediately credit ₦{(selectedTx.amount_ngn + selectedTx.fee_ngn - selectedTx.discount_ngn).toLocaleString()} back to the customer's Nigerian Naira wallet and mark this bill transaction as REFUNDED.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter refund reason (e.g. Disco network timeout)..."
                      className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
                    />
                  </div>
                  <button
                    onClick={handleExecuteRefund}
                    disabled={isRefunding}
                    className="w-full py-2 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isRefunding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    <span>Execute Customer Wallet Refund</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
