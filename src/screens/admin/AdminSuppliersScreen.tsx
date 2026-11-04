import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { Supplier, SupplierDirectoryPrices } from '../../types';
import { 
  Building2, 
  MapPin, 
  Star, 
  Search, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  DollarSign,
  Layers,
  Phone,
  MessageCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Power,
  Check
} from 'lucide-react';

export const AdminSuppliersScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();
  const [activeTab, setActiveTab] = useState<'catalog' | 'pricing' | 'subscribers'>('catalog');
  
  // Data State
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [prices, setPrices] = useState<SupplierDirectoryPrices>({ ngn: 15000, usd: 10, cny: 70 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pricing Form State
  const [inputNgn, setInputNgn] = useState<string>('15000');
  const [inputUsd, setInputUsd] = useState<string>('10');
  const [inputCny, setInputCny] = useState<string>('70');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState<boolean>(false);

  // Add / Edit Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState('');
  const [formZhName, setFormZhName] = useState('');
  const [formCity, setFormCity] = useState('Guangzhou');
  const [formCategory, setFormCategory] = useState('Electronics');
  const [formAddress, setFormAddress] = useState('');
  const [formMoq, setFormMoq] = useState('¥5,000');
  const [formWechat, setFormWechat] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRating, setFormRating] = useState('4.9');
  const [formYears, setFormYears] = useState('5');
  const [formTags, setFormTags] = useState<string[]>(['Verified Business', 'Factory Direct']);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState<boolean>(false);

  // Document Preview Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);

  const categories = ['All', 'Electronics', 'Fashion', 'Appliances', 'Home & Living', 'Beauty', 'Machinery', 'Other'];
  const availableTags = ['Gold Supplier', 'Factory Direct', 'Verified Business', 'Established Supplier', '10+ Years'];

  // Load authoritative admin data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Suppliers
      const supRes = await db.getAdminSuppliers(adminUser?.uid || 'adm-001');
      if (supRes && supRes.suppliers) {
        setSuppliersList(supRes.suppliers);
      }

      // 2. Fetch Pricing
      const priceRes = await db.getSupplierPrices();
      if (priceRes && priceRes.prices) {
        setPrices(priceRes.prices);
        setInputNgn(priceRes.prices.ngn?.toString() || '15000');
        setInputUsd(priceRes.prices.usd?.toString() || '10');
        setInputCny(priceRes.prices.cny?.toString() || '70');
      }

      // 3. Fetch Metrics & Subscriptions
      const metricsRes = await db.getAdminSupplierMetrics(adminUser?.uid || 'adm-001');
      if (metricsRes && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
        setSubscriptions(metricsRes.subscriptions || []);
      }
    } catch (e: any) {
      console.error('Error fetching admin supplier workspace data:', e);
      showToast('Error syncing supplier operations data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const unsubscribe = db.subscribe(() => {
      loadAdminData();
    });
    return () => unsubscribe();
  }, []);

  // Filter suppliers
  const filteredSuppliers = suppliersList.filter((sup) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      sup.name.toLowerCase().includes(q) ||
      (sup.chineseName && sup.chineseName.includes(searchQuery)) ||
      (sup.city && sup.city.toLowerCase().includes(q)) ||
      (sup.category && sup.category.toLowerCase().includes(q)) ||
      (sup.wechatId && sup.wechatId.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'All' || 
      (sup.category && sup.category.toLowerCase() === categoryFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? sup.active !== false : sup.active === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormZhName('');
    setFormCity('Guangzhou');
    setFormCategory('Electronics');
    setFormAddress('High-Tech Industrial District, Guangzhou, China');
    setFormMoq('¥5,000');
    setFormWechat('');
    setFormPhone('+86 138 0000 8888');
    setFormWhatsapp('+86 138 0000 8888');
    setFormManager('General Export Manager');
    setFormDescription('Verified Tier-1 Chinese Manufacturer.');
    setFormRating('4.9');
    setFormYears('5');
    setFormTags(['Verified Business', 'Factory Direct']);
    setFormActive(true);
    setShowSupplierModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormZhName(sup.chineseName || '');
    setFormCity(sup.city || 'Guangzhou');
    setFormCategory(sup.category || 'Electronics');
    setFormAddress(sup.businessAddress || 'Guangdong Industrial Zone, China');
    setFormMoq(sup.minOrderValue || '¥5,000');
    setFormWechat(sup.wechatId || '');
    setFormPhone(sup.phone || '');
    setFormWhatsapp(sup.whatsapp || '');
    setFormManager((sup as any).directManager || 'Export Director');
    setFormDescription((sup as any).description || '');
    setFormRating(sup.rating?.toString() || '4.9');
    setFormYears(sup.verifiedYears?.toString() || '5');
    setFormTags(sup.tags || ['Verified Business', 'Factory Direct']);
    setFormActive(sup.active !== false);
    setShowSupplierModal(true);
  };

  // Submit Supplier (Create or Edit)
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupplier(true);

    try {
      const payload: Partial<Supplier> & Record<string, any> = {
        name: formName.trim(),
        chineseName: formZhName.trim(),
        city: formCity.trim(),
        category: formCategory,
        businessAddress: formAddress.trim(),
        minOrderValue: formMoq.trim(),
        wechatId: formWechat.trim(),
        phone: formPhone.trim(),
        whatsapp: formWhatsapp.trim(),
        directManager: formManager.trim(),
        description: formDescription.trim(),
        rating: parseFloat(formRating) || 4.9,
        verifiedYears: parseInt(formYears, 10) || 5,
        tags: formTags,
        active: formActive,
        badge: formTags.includes('Gold Supplier') ? 'Gold Manufacturer' : 'Verified Business',
        inspectionPassed: true
      };

      if (editingSupplier) {
        payload.id = editingSupplier.id;
        const res = await db.updateSupplier(payload, adminUser?.uid || 'adm-001');
        if (res && res.success) {
          showToast(`Supplier "${formName}" updated successfully!`, 'success');
        }
      } else {
        payload.id = `sup_${Date.now()}`;
        const res = await db.createSupplier(payload, adminUser?.uid || 'adm-001');
        if (res && res.success) {
          showToast(`New supplier "${formName}" registered in catalog!`, 'success');
        }
      }

      setShowSupplierModal(false);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier profile', 'error');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // Toggle Supplier Status (Activate / Deactivate)
  const handleToggleStatus = async (sup: Supplier) => {
    try {
      const newStatus = !(sup.active !== false);
      const res = await db.toggleSupplierStatus(sup.id, newStatus, adminUser?.uid || 'adm-001');
      if (res && res.success) {
        showToast(`Supplier "${sup.name}" ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
        await loadAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (sup: Supplier) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${sup.name}"? This action is recorded in the immutable audit log.`);
    if (!confirmDelete) return;

    try {
      const res = await db.deleteSupplier(sup.id, adminUser?.uid || 'adm-001');
      if (res && res.success) {
        showToast(`Supplier "${sup.name}" removed from database`, 'success');
        await loadAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  // View Business Card or License via Signed URL
  const handlePreviewDocument = async (sup: Supplier, docType: 'card' | 'license') => {
    setIsLoadingDoc(true);
    setPreviewDocTitle(`${sup.name} (${docType === 'card' ? 'Official Business Card' : 'Private Verification License'})`);
    try {
      const res = await db.getSupplierCardSignedUrl(sup.id, adminUser?.uid || 'adm-001', docType);
      if (res && res.signedUrl) {
        setPreviewDocUrl(res.signedUrl);
      } else {
        showToast(res.error || 'Failed to generate document token', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching secure document', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // Update Pricing
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPrices(true);
    try {
      const ngn = parseFloat(inputNgn);
      const usd = parseFloat(inputUsd);
      const cny = parseFloat(inputCny);

      if (isNaN(ngn) || ngn <= 0 || isNaN(usd) || usd <= 0 || isNaN(cny) || cny <= 0) {
        showToast('Please enter valid positive pricing numbers', 'error');
        return;
      }

      const res = await db.setSupplierPrices(ngn, usd, cny, adminUser?.uid || 'adm-001');
      if (res && res.success) {
        showToast('VIP Supplier Directory pricing updated across platform!', 'success');
        setPrices(res.prices);
      } else {
        showToast(res.error || 'Failed to update prices', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating subscription prices', 'error');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Toggle tag in form
  const toggleTag = (tag: string) => {
    setFormTags((prev) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <AdminLayout activeTab="suppliers">
      <div className="p-6 space-y-6">
        {/* Workspace Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                VIP Supplier Directory & Pass Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guangdong & Yiwu factory verification, contact enclave protection, monthly pricing controls, and subscription ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Factory Catalog ({suppliersList.length})
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'pricing' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>VIP Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'subscribers' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribers ({subscriptions.length})</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Register Factory</span>
            </button>
          </div>
        </div>

        {/* Section 14: Metrics Summary Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Active Subscribers</span>
              <p className="text-xl font-black text-emerald-400">{metrics.activeSubscribers || 0}</p>
              <span className="text-[10px] text-slate-400">Current 30-Day Passes</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Expired Passes</span>
              <p className="text-xl font-black text-slate-300">{metrics.expiredSubscribers || 0}</p>
              <span className="text-[10px] text-slate-400">Eligible for Manual Renewal</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Stacked Renewals</span>
              <p className="text-xl font-black text-amber-400">{metrics.totalRenewals || 0}</p>
              <span className="text-[10px] text-slate-400">Early Extensions (+30d)</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Subscription Revenue</span>
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="text-emerald-400">${metrics.revenue?.USD || 0} USD</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">₦{(metrics.revenue?.NGN || 0).toLocaleString()}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">¥{(metrics.revenue?.CNY || 0).toLocaleString()}</span>
              </div>
              <span className="text-[9px] text-slate-500">Total ledger credits across currencies</span>
            </div>
          </div>
        )}

        {/* TAB 1: FACTORY CATALOG MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, city, WeChat ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      categoryFilter === cat 
                        ? 'bg-amber-500 text-slate-950 font-bold' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                {(['all', 'active', 'inactive'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${
                      statusFilter === s ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((sup) => (
                <div 
                  key={sup.id} 
                  className={`p-5 rounded-3xl bg-slate-900 border transition-all space-y-3.5 ${
                    sup.active === false ? 'border-rose-900/40 opacity-75' : 'border-slate-800 hover:border-slate-700 shadow-xl'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{sup.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          sup.active === false 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {sup.active === false ? 'Deactivated' : 'Active VIP'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-[9px] font-semibold">
                          {sup.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{sup.chineseName}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{sup.city} • {sup.businessAddress || 'Guangdong Industrial Zone'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{sup.rating || 4.9}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{sup.verifiedYears}y Vetted</span>
                    </div>
                  </div>

                  {/* Verification Tags */}
                  {sup.tags && sup.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sup.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-950 text-[9px] font-medium text-amber-300 border border-slate-800">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contacts Enclave Snapshot */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">WeChat ID</span>
                      <strong className="text-emerald-400 font-mono text-[11px]">{sup.wechatId || 'Not set'}</strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Telephone</span>
                      <strong className="text-cyan-400 font-mono text-[11px]">{sup.phone || 'Not set'}</strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Min. Order</span>
                      <strong className="text-slate-200">{sup.minOrderValue || '¥5,000'}</strong>
                    </div>
                  </div>

                  {/* Operational Controls Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewDocument(sup, 'card')}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Business Card</span>
                      </button>

                      <button
                        onClick={() => handlePreviewDocument(sup, 'license')}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Private License</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Active Status */}
                      <button
                        onClick={() => handleToggleStatus(sup)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          sup.active === false 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-rose-400'
                        }`}
                        title={sup.active === false ? 'Activate Supplier' : 'Deactivate Supplier'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{sup.active === false ? 'Activate' : 'Deactivate'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(sup)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteSupplier(sup)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold cursor-pointer"
                        title="Delete Supplier Record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VIP MONTHLY PRICING CONFIGURATION */}
        {activeTab === 'pricing' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Monthly VIP Subscription Pricing</h3>
                  <p className="text-xs text-slate-400">
                    Configure 30-day supplier directory pass fees. Changes take effect on customer paywall immediately without redeployment.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePrices} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Nigerian Naira (NGN) Fee:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₦</span>
                    <input
                      type="number"
                      step="100"
                      value={inputNgn}
                      onChange={(e) => setInputNgn(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Default: ₦15,000</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    US Dollar (USD) Fee:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="1"
                      value={inputUsd}
                      onChange={(e) => setInputUsd(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Default: $10</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Chinese Yuan / RMB (CNY) Fee:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold">¥</span>
                    <input
                      type="number"
                      step="1"
                      value={inputCny}
                      onChange={(e) => setInputCny(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Default: ¥70</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                  <strong>Financial Safety Policy:</strong> Updating subscription fees will apply to all subsequent new subscriptions and manual renewals. Existing active customer access periods are never retroactively billed.
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPrices}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98 transition-all"
                >
                  {isUpdatingPrices ? 'Saving Pricing...' : 'Save & Publish Live Pricing'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: VIP SUBSCRIBERS TABLE */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/80">
                    <th className="py-3 px-4 font-semibold">Payment Ref</th>
                    <th className="py-3 px-4 font-semibold">Customer User</th>
                    <th className="py-3 px-4 font-semibold">Pass Type</th>
                    <th className="py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold">Purchased At</th>
                    <th className="py-3 px-4 font-semibold">Expires At</th>
                    <th className="py-3 px-4 font-semibold">Renewals</th>
                    <th className="py-3 px-4 font-semibold text-right">Access Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No customer VIP pass subscriptions active yet.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => {
                      const isActive = sub.activeUntil > Date.now() && sub.status !== 'cancelled';
                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">{sub.reference || sub.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{sub.userName || sub.userId}</span>
                            <span className="text-[10px] text-slate-500">{sub.customerEmail || sub.userId}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {sub.type === 'directory_30d' ? 'Full Directory (30d)' : `Factory #${sub.supplierId}`}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {sub.currency === 'NGN' ? '₦' : sub.currency === 'CNY' ? '¥' : '$'}
                            {(sub.amountPaid || sub.feeUSD || 10).toLocaleString()} {sub.currency || 'USD'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(sub.purchasedAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(sub.activeUntil || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {sub.renewalCount ? `+${sub.renewalCount} Renewals` : 'Initial'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {isActive ? 'Active 30-Day' : 'Expired'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: REGISTER / EDIT SUPPLIER */}
        {showSupplierModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register Verified Chinese Factory'}
                  </h3>
                </div>
                <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmitSupplier} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Company Name (English)</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Official Name</label>
                    <input
                      type="text"
                      value={formZhName}
                      onChange={(e) => setFormZhName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">City Hub</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Industry Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Official Address in China</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">WeChat ID</label>
                    <input
                      type="text"
                      value={formWechat}
                      onChange={(e) => setFormWechat(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Export Manager</label>
                    <input
                      type="text"
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Min. Order Value (MOQ)</label>
                    <input
                      type="text"
                      value={formMoq}
                      onChange={(e) => setFormMoq(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Years Vetted</label>
                    <input
                      type="number"
                      value={formYears}
                      onChange={(e) => setFormYears(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Verification Tags Multi-Select */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                    Admin Verification Tags:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableTags.map((tag) => {
                      const isSelected = formTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-500 text-slate-950' 
                              : 'bg-slate-950 border border-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="formActive"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="formActive" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Publish in VIP Directory (Visible to Active Subscribers)
                  </label>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSupplier}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {isSubmittingSupplier ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DOCUMENT PREVIEW (SIGNED URL) */}
        {previewDocUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white truncate max-w-xs">{previewDocTitle}</h3>
                </div>
                <button onClick={() => setPreviewDocUrl(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-1">
                <img src={previewDocUrl} alt={previewDocTitle} className="w-full h-auto rounded-xl object-contain" />
              </div>

              <div className="text-center text-[10px] text-slate-500 font-mono">
                🔒 Cryptographically signed temporary URL valid for 60 minutes
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default AdminSuppliersScreen;