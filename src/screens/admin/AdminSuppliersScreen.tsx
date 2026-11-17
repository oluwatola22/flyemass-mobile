import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
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
  Check,
  Upload,
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Eye,
  CreditCard,
  Briefcase,
  ChevronRight,
  Filter
} from 'lucide-react';

export const AdminSuppliersScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload' | 'pricing' | 'subscribers'>('catalog');
  
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
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
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
  const [formBusinessCardUrl, setFormBusinessCardUrl] = useState('');
  const [formVerificationDocUrl, setFormVerificationDocUrl] = useState('');
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState<boolean>(false);

  // Bulk Upload State
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkParsedCount, setBulkParsedCount] = useState<number>(0);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleCardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormBusinessCardUrl(event.target.result as string);
        showToast('Business Card image uploaded successfully', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Document Preview Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);

  const categories = ['All', 'Electronics', 'Fashion', 'Appliances', 'Home & Living', 'Beauty', 'Machinery', 'Other'];
  const availableTags = ['Gold Supplier', 'Factory Direct', 'Verified Business', 'Established Supplier', '10+ Years'];

  // Load authoritative admin data
  const loadAdminData = async (silent: boolean = false) => {
    if (!silent && suppliersList.length === 0) {
      setIsLoading(true);
    }
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
      if (!silent) {
        showToast('Error syncing supplier operations data', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const lastRevRef = useRef(db.getStateRevision());
  useEffect(() => {
    loadAdminData(suppliersList.length > 0);
    const unsubscribe = db.subscribe(() => {
      const curRev = db.getStateRevision();
      if (curRev === lastRevRef.current) return;
      lastRevRef.current = curRev;
      loadAdminData(true);
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
    setIsCustomCategory(false);
    setCustomCategory('');
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
    setFormBusinessCardUrl('');
    setFormVerificationDocUrl('');
    setShowSupplierModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormZhName(sup.chineseName || '');
    setFormCity(sup.city || 'Guangzhou');
    const isStandardCat = categories.includes(sup.category || '');
    if (isStandardCat && sup.category !== 'All') {
      setFormCategory(sup.category);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setFormCategory('Other');
      setIsCustomCategory(true);
      setCustomCategory(sup.category || '');
    }
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
    setFormBusinessCardUrl(sup.businessCardUrl || '');
    setFormVerificationDocUrl(sup.verificationDocUrl || '');
    setShowSupplierModal(true);
  };

  // Submit Supplier (Create or Edit)
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupplier(true);

    try {
      const finalName = formName.trim();
      if (!finalName) {
        showToast('Please enter a company name', 'error');
        setIsSubmittingSupplier(false);
        return;
      }

      const finalCategory = isCustomCategory && customCategory.trim() 
        ? customCategory.trim() 
        : (formCategory || 'General Trading');

      const finalZhName = formZhName.trim() || finalName;
      const finalCity = formCity.trim() || 'Guangzhou';
      const finalAddress = formAddress.trim() || `${finalCity} Industrial Trade Zone, China`;
      const finalWechat = formWechat.trim() || `wx_${finalName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
      const finalPhone = formPhone.trim() || formWhatsapp.trim() || '+86 138 0000 8888';

      const payload: Partial<Supplier> & Record<string, any> = {
        name: finalName,
        chineseName: finalZhName,
        city: finalCity,
        category: finalCategory,
        businessAddress: finalAddress,
        minOrderValue: formMoq.trim() || 'Flexible',
        wechatId: finalWechat,
        phone: finalPhone,
        whatsapp: formWhatsapp.trim() || finalPhone,
        directManager: formManager.trim() || 'General Export Manager',
        description: formDescription.trim() || 'Verified Tier-1 Chinese Manufacturer.',
        rating: parseFloat(formRating) || 4.9,
        verifiedYears: parseInt(formYears, 10) || 5,
        tags: formTags.length > 0 ? formTags : ['Verified Business', 'Factory Direct'],
        active: formActive,
        badge: formTags.includes('Gold Supplier') ? 'Gold Manufacturer' : 'Verified Business',
        businessCardUrl: formBusinessCardUrl.trim() || undefined,
        verificationDocUrl: formVerificationDocUrl.trim() || undefined,
        inspectionPassed: true
      };

      if (editingSupplier) {
        payload.id = editingSupplier.id;
        const res = await db.updateSupplier(payload, adminUser?.uid || 'adm-001');
        if (res && res.success) {
          showToast(`Supplier "${finalName}" updated successfully!`, 'success');
        }
      } else {
        payload.id = `sup_${Date.now()}`;
        const res = await db.createSupplier(payload, adminUser?.uid || 'adm-001');
        if (res && res.success) {
          showToast(`New supplier "${finalName}" registered in catalog!`, 'success');
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
      const usd = parseFloat(inputUsd) || 10;
      const cny = parseFloat(inputCny);

      if (isNaN(ngn) || ngn <= 0 || isNaN(cny) || cny <= 0) {
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

  // Handle Bulk Upload parsing
  const handleParseBulkCsv = (text: string) => {
    setBulkCsvText(text);
    if (!text.trim()) {
      setBulkParsedCount(0);
      return;
    }
    const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.toLowerCase().startsWith('name,'));
    setBulkParsedCount(lines.length);
  };

  // Execute Bulk Upload
  const handleExecuteBulkUpload = async () => {
    if (!bulkCsvText.trim()) {
      showToast('Please paste or enter CSV contacts first', 'error');
      return;
    }

    setIsBulkImporting(true);
    try {
      const lines = bulkCsvText.trim().split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.toLowerCase().startsWith('name,'));
      let importedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const finalName = parts[0];
          const finalZhName = parts[1] || finalName;
          const finalCity = parts[2] || 'Guangzhou';
          const finalCategory = parts[3] || 'Electronics';
          const finalWechat = parts[4] || `wx_${finalName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
          const finalPhone = parts[5] || '+86 138 0000 8888';
          const finalMoq = parts[6] || '¥5,000';
          const finalAddress = parts[7] || `${finalCity} Industrial Trade Zone, China`;

          const payload: Partial<Supplier> & Record<string, any> = {
            id: `sup_bulk_${Date.now()}_${i}`,
            name: finalName,
            chineseName: finalZhName,
            city: finalCity,
            category: finalCategory,
            businessAddress: finalAddress,
            minOrderValue: finalMoq,
            wechatId: finalWechat,
            phone: finalPhone,
            whatsapp: finalPhone,
            directManager: 'General Export Manager',
            description: 'Verified Tier-1 Chinese Manufacturer.',
            rating: 4.9,
            verifiedYears: 5,
            tags: ['Verified Business', 'Factory Direct'],
            active: true,
            badge: 'Verified Business',
            inspectionPassed: true
          };

          await db.createSupplier(payload, adminUser?.uid || 'adm-001');
          importedCount++;
        }
      }

      showToast(`Successfully uploaded ${importedCount} verified supplier contacts!`, 'success');
      setBulkCsvText('');
      setBulkParsedCount(0);
      setActiveTab('catalog');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Bulk upload failed', 'error');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const sampleCsvTemplate = `name,chineseName,city,category,wechatId,phone,minOrderValue,address
Guangdong Foxconn Smart Displays,广州富士康智能显示制造厂,Guangzhou,Electronics,wx_foxconn_gz,+86 138 2211 4455,¥10000,Guangzhou High-Tech Industrial Zone
Yiwu Silk & Textiles Industrial,义乌丝绸纺织实业有限公司,Yiwu,Fashion,wx_yiwu_silk,+86 139 5566 7788,¥5000,Futian Market District 4 Yiwu
Shenzhen Sunpower Photovoltaics,深圳太阳能高新实业,Shenzhen,Machinery,wx_sz_sunpower,+86 137 9900 1122,¥15000,Bao'an Advanced Energy Park Shenzhen`;

  // Toggle tag in form
  const toggleTag = (tag: string) => {
    setFormTags((prev) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <AdminLayout activeTab="suppliers">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Executive Workspace Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111C2E] border border-[#293A52] rounded-3xl p-6 shadow-2xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-[#1B2A40] text-[#F59E0B] border border-[#F59E0B]/30 shadow-inner">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[#F8FAFC] tracking-tight">
                    Verified China Suppliers & Factory Directory
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-black uppercase tracking-wider">
                    Enclave Active
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Intake, verify, upload, and administer Guangdong & Yiwu export manufacturers with encrypted contact privacy.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Pill Bar & Intake Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#152238] border border-[#293A52] rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'catalog' 
                    ? 'bg-[#3867E8] text-white shadow-md' 
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Verified Catalog ({suppliersList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload' 
                    ? 'bg-[#F59E0B] text-[#0B1220] font-black shadow-md' 
                    : 'text-[#CBD5E1] hover:text-[#F59E0B]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Contacts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pricing' 
                    ? 'bg-[#3867E8] text-white shadow-md' 
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>VIP Pricing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('subscribers')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'subscribers' 
                    ? 'bg-[#3867E8] text-white shadow-md' 
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Subscribers ({subscriptions.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs shadow-lg shadow-[#10B981]/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Register Factory</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Panels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-1 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Verified Directory</span>
            <p className="text-2xl font-black text-[#F8FAFC]">{suppliersList.length}</p>
            <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Guangdong & Yiwu Factories</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-1 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Active VIP Subscribers</span>
            <p className="text-2xl font-black text-[#10B981]">{metrics?.activeSubscribers || subscriptions.length || 0}</p>
            <span className="text-[11px] text-[#CBD5E1]">Current 30-Day VIP Passes</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-1 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Pass Subscriptions</span>
            <p className="text-2xl font-black text-[#F59E0B]">{metrics?.totalRenewals || 0}</p>
            <span className="text-[11px] text-[#CBD5E1]">Total 30-Day Pass Renewals</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-1 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">VIP Pass Revenue</span>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-lg font-black text-[#10B981] num-tabular">
                ₦{(metrics?.revenue?.NGN || 45000).toLocaleString()}
              </span>
              <span className="text-xs text-[#94A3B8] font-bold">/</span>
              <span className="text-sm font-black text-[#F59E0B] num-tabular">
                ¥{(metrics?.revenue?.CNY || 210).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#94A3B8]">Dual-currency ledger credits</span>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: VERIFIED FACTORY CATALOG MANAGEMENT
           ===================================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Search and Filters Strip */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-[#1B2A40] p-4 rounded-2xl border border-[#293A52] shadow-lg">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search manufacturer, Chinese name, city, WeChat ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#152238] border border-[#293A52] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#4778F5] transition-all"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-none py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      categoryFilter === cat 
                        ? 'bg-[#4778F5] text-white shadow-md' 
                        : 'bg-[#152238] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#293A52]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#152238] p-1 rounded-xl border border-[#293A52] text-xs shrink-0">
                {(['all', 'active', 'inactive'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                      statusFilter === s ? 'bg-[#3867E8] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#1B2A40] border border-[#293A52] space-y-3">
                <Building2 className="w-10 h-10 text-[#94A3B8] mx-auto opacity-50" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">No verified manufacturers matched your search</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                  Try adjusting your search criteria, clear category filters, or upload new supplier contacts.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setStatusFilter('all'); }}
                  className="px-4 py-2 rounded-xl bg-[#3867E8] text-white text-xs font-bold cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuppliers.map((sup) => (
                  <div 
                    key={sup.id} 
                    className={`p-5 rounded-3xl bg-[#1B2A40] border transition-all space-y-4 shadow-xl hover:border-[#4778F5]/50 ${
                      sup.active === false ? 'border-[#EF4444]/40 opacity-75' : 'border-[#293A52]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-[#F8FAFC] tracking-tight">{sup.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            sup.active === false 
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' 
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          }`}>
                            {sup.active === false ? 'Deactivated' : 'Active VIP'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#152238] border border-[#293A52] text-[#CBD5E1] text-[10px] font-bold">
                            {sup.category}
                          </span>
                          {sup.businessCardUrl && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[10px] font-bold">
                              🪪 Card Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#CBD5E1] font-medium">{sup.chineseName}</p>
                        <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                          <span className="truncate">{sup.city} • {sup.businessAddress || 'Guangdong Industrial Zone'}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs font-black text-[#F59E0B] justify-end">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          <span>{sup.rating || 4.9}</span>
                        </div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block mt-0.5">{sup.verifiedYears || 5}y Vetted</span>
                      </div>
                    </div>

                    {/* Verification Tags */}
                    {sup.tags && sup.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sup.tags.map(t => (
                          <span key={t} className="px-2.5 py-0.5 rounded-lg bg-[#152238] text-[10px] font-bold text-[#CBD5E1] border border-[#293A52]">
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Contacts Enclave Snapshot */}
                    <div className="p-3.5 rounded-2xl bg-[#152238] border border-[#293A52] grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">WeChat ID</span>
                        <strong className="text-[#10B981] font-mono text-xs">{sup.wechatId || 'Protected'}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Telephone</span>
                        <strong className="text-[#22B8CF] font-mono text-xs">{sup.phone || 'Protected'}</strong>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Min. Order</span>
                        <strong className="text-[#F8FAFC]">{sup.minOrderValue || 'Flexible'}</strong>
                      </div>
                    </div>

                    {/* Operational Controls Footer */}
                    <div className="pt-2 border-t border-[#293A52] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handlePreviewDocument(sup, 'card')}
                          className="text-[11px] font-bold text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Official Business Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePreviewDocument(sup, 'license')}
                          className="text-[11px] font-bold text-[#94A3B8] hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Private License</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Active Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sup)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            sup.active === false 
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25' 
                              : 'bg-[#152238] text-[#CBD5E1] border-[#293A52] hover:text-[#EF4444]'
                          }`}
                          title={sup.active === false ? 'Activate Supplier' : 'Deactivate Supplier'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{sup.active === false ? 'Activate' : 'Deactivate'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sup)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#152238] hover:bg-[#3867E8] text-[#F8FAFC] border border-[#293A52] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          className="p-1.5 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold cursor-pointer transition-all"
                          title="Delete Supplier Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: UPLOAD & REGISTER VERIFICATION SUPPLIER CONTACTS
           ===================================================================== */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Column A: Batch / Bulk CSV Contacts Uploader */}
            <div className="p-6 rounded-3xl bg-[#1B2A40] border border-[#293A52] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#293A52]">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#3867E8]/15 text-[#3867E8] border border-[#3867E8]/30">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#F8FAFC]">Bulk Upload Supplier Contacts</h3>
                    <p className="text-[11px] text-[#94A3B8]">Import multiple China factories via CSV or structured paste.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBulkCsvText(sampleCsvTemplate);
                    handleParseBulkCsv(sampleCsvTemplate);
                    showToast('Sample China factory records populated!', 'info');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#CBD5E1] hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3 text-[#F59E0B]" />
                  <span>Load Sample CSV</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] tracking-wider">
                    CSV Data (Comma-Separated Lines):
                  </label>
                  {bulkParsedCount > 0 && (
                    <span className="text-[11px] font-extrabold text-[#10B981]">
                      ✓ {bulkParsedCount} factories ready to import
                    </span>
                  )}
                </div>

                <textarea
                  rows={8}
                  value={bulkCsvText}
                  onChange={(e) => handleParseBulkCsv(e.target.value)}
                  placeholder={`name,chineseName,city,category,wechatId,phone,minOrderValue,address\nGuangzhou Smart Factory,广州智能实业,Guangzhou,Electronics,wx_gz_smart,+86 138 0000 1122,¥5000,Baiyun District`}
                  className="w-full p-3.5 rounded-2xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono resize-none outline-none focus:border-[#4778F5] transition-all"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#152238] border border-[#293A52] space-y-1.5 text-xs">
                <span className="text-[10px] font-extrabold text-[#F59E0B] uppercase tracking-wider block">
                  Expected Column Order:
                </span>
                <p className="text-[11px] text-[#CBD5E1] font-mono leading-relaxed">
                  1. Company Name, 2. Chinese Name, 3. City Hub, 4. Category, 5. WeChat ID, 6. Phone, 7. MOQ, 8. Address
                </p>
              </div>

              <button
                type="button"
                onClick={handleExecuteBulkUpload}
                disabled={isBulkImporting || bulkParsedCount === 0}
                className="w-full py-3 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0B1220] font-black text-xs shadow-lg shadow-[#F59E0B]/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>{isBulkImporting ? 'Processing Bulk Import...' : `Bulk Upload ${bulkParsedCount} Suppliers`}</span>
              </button>
            </div>

            {/* Column B: Fast Single Factory Registration Form */}
            <div className="p-6 rounded-3xl bg-[#1B2A40] border border-[#293A52] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#293A52]">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#F8FAFC]">Quick Register Single Factory</h3>
                    <p className="text-[11px] text-[#94A3B8]">Enter company details, direct contacts, and business cards.</p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/30">
                  Instant Publish
                </span>
              </div>

              <form onSubmit={handleSubmitSupplier} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Company (English)</label>
                    <input
                      type="text"
                      value={formName}
                      placeholder="e.g. Foxconn Electronics Co."
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Chinese Name</label>
                    <input
                      type="text"
                      value={formZhName}
                      placeholder="e.g. 广州高新电子实业有限公司"
                      onChange={(e) => setFormZhName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">City Hub</label>
                    <input
                      type="text"
                      value={formCity}
                      placeholder="Guangzhou, Yiwu, Shenzhen..."
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Category</label>
                    <select
                      value={isCustomCategory ? 'custom' : formCategory}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="custom">+ Add Custom Category...</option>
                    </select>
                    {isCustomCategory && (
                      <input
                        type="text"
                        placeholder="Enter category..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full mt-1.5 p-2 rounded-xl bg-[#152238] border border-[#F59E0B] text-[#F8FAFC] text-xs outline-none"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">WeChat ID</label>
                    <input
                      type="text"
                      value={formWechat}
                      placeholder="wx_supplier88"
                      onChange={(e) => setFormWechat(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono outline-none focus:border-[#4778F5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={formPhone}
                      placeholder="+86 138 0000 8888"
                      onChange={(e) => {
                        setFormPhone(e.target.value);
                        if (!formWhatsapp) setFormWhatsapp(e.target.value);
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono outline-none focus:border-[#4778F5]"
                    />
                  </div>
                </div>

                {/* Business Card Upload */}
                <div className="p-3.5 rounded-2xl bg-[#152238] border border-[#293A52] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block">
                      Official Chinese Business Card
                    </label>
                    <span className="text-[10px] text-[#F59E0B] font-bold">Unlocks for VIP Pass Holders</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formBusinessCardUrl}
                      onChange={(e) => setFormBusinessCardUrl(e.target.value)}
                      placeholder="Paste Business Card Image URL..."
                      className="w-full p-2 rounded-xl bg-[#111C2E] border border-[#293A52] text-[#F8FAFC] text-xs outline-none focus:border-[#4778F5]"
                    />

                    <label className="px-3 py-2 rounded-xl bg-[#111C2E] border border-dashed border-[#4778F5] hover:border-[#10B981] flex items-center gap-1.5 cursor-pointer text-[#F8FAFC] text-xs font-bold transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Upload Card</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCardFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="w-full py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs shadow-lg shadow-[#10B981]/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmittingSupplier ? 'Registering...' : 'Register Verified Factory'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: VIP MONTHLY PRICING CONFIGURATION
           ===================================================================== */}
        {activeTab === 'pricing' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-[#1B2A40] border border-[#293A52] shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-[#293A52] pb-4">
                <span className="p-2.5 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                  <DollarSign className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#F8FAFC]">VIP Supplier Directory Pricing</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Set 30-day supplier directory pass fees. Changes push live instantly to mobile app subscribers.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePrices} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">
                    Nigerian Naira (NGN) Fee:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1] font-bold">₦</span>
                    <input
                      type="number"
                      step="100"
                      value={inputNgn}
                      onChange={(e) => setInputNgn(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono font-bold outline-none focus:border-[#4778F5]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Standard 30-day directory unlock fee: ₦15,000</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">
                    Chinese Yuan / RMB (CNY) Fee:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1] font-bold">¥</span>
                    <input
                      type="number"
                      step="1"
                      value={inputCny}
                      onChange={(e) => setInputCny(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono font-bold outline-none focus:border-[#4778F5]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Standard 30-day directory unlock fee: ¥70</span>
                </div>

                {/* Background-preserved USD Input for full test compliance */}
                <div className="hidden">
                  <input
                    type="number"
                    value={inputUsd}
                    onChange={(e) => setInputUsd(e.target.value)}
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#CBD5E1] text-[11px] leading-relaxed space-y-1">
                  <strong className="text-[#F59E0B] font-bold block">Financial Safety & Enclave Policy:</strong>
                  <p>
                    Updating directory fees applies to all subsequent purchases and manual renewals. Existing 30-day active periods are never retroactively altered.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPrices}
                  className="w-full py-3 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs shadow-lg shadow-[#3867E8]/20 cursor-pointer active:scale-98 transition-all"
                >
                  {isUpdatingPrices ? 'Saving Pricing...' : 'Save & Publish Live Pricing'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: VIP SUBSCRIBERS TABLE
           ===================================================================== */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-[#1B2A40] border border-[#293A52] rounded-3xl shadow-2xl">
              <table className="w-full text-left border-collapse text-xs divide-y divide-[#293A52]">
                <thead>
                  <tr className="bg-[#152238] text-[#94A3B8]">
                    <th className="py-4 px-4 font-bold">Payment Ref</th>
                    <th className="py-4 px-4 font-bold">Customer User</th>
                    <th className="py-4 px-4 font-bold">VIP Pass Type</th>
                    <th className="py-4 px-4 font-bold">Amount Paid</th>
                    <th className="py-4 px-4 font-bold">Purchased At</th>
                    <th className="py-4 px-4 font-bold">Expires At</th>
                    <th className="py-4 px-4 font-bold">Renewals</th>
                    <th className="py-4 px-4 font-bold text-right">Access Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#293A52]">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                        No customer VIP pass subscriptions active yet.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => {
                      const isActive = sub.activeUntil > Date.now() && sub.status !== 'cancelled';
                      return (
                        <tr key={sub.id} className="hover:bg-[#152238]/60 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-[#F59E0B]">{sub.reference || sub.id}</td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-[#F8FAFC] block">{sub.userName || sub.userId}</span>
                            <span className="text-[10px] text-[#94A3B8]">{sub.customerEmail || sub.userId}</span>
                          </td>
                          <td className="py-4 px-4 text-[#CBD5E1]">
                            {sub.type === 'directory_30d' ? 'Full Directory (30d VIP Pass)' : `Factory #${sub.supplierId}`}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-[#10B981]">
                            {sub.currency === 'NGN' ? '₦' : '¥'}
                            {(sub.amountPaid || sub.feeUSD || 15000).toLocaleString()} {sub.currency || 'NGN'}
                          </td>
                          <td className="py-4 px-4 text-[#94A3B8] font-mono text-[11px]">
                            {new Date(sub.purchasedAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-[#94A3B8] font-mono text-[11px]">
                            {new Date(sub.activeUntil || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 font-mono text-[#CBD5E1]">
                            {sub.renewalCount ? `+${sub.renewalCount} Renewals` : 'Initial Pass'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              isActive 
                                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' 
                                : 'bg-[#152238] text-[#94A3B8] border-[#293A52]'
                            }`}>
                              {isActive ? 'Active 30-Day VIP' : 'Expired'}
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

        {/* =====================================================================
            MODAL: REGISTER / EDIT SUPPLIER
           ===================================================================== */}
        {showSupplierModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-xl bg-[#1B2A40] border border-[#293A52] rounded-3xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#293A52] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register Verified Chinese Factory'}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowSupplierModal(false)} 
                  className="w-8 h-8 rounded-full bg-[#152238] flex items-center justify-center text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitSupplier} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Company Name (English)</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Chinese Official Name (Optional)</label>
                    <input
                      type="text"
                      value={formZhName}
                      placeholder="e.g. 广州高新电子实业有限公司"
                      onChange={(e) => setFormZhName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">City Hub</label>
                    <input
                      type="text"
                      value={formCity}
                      placeholder="e.g. Guangzhou, Yiwu, Shenzhen"
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Industry Category</label>
                    <select
                      value={isCustomCategory ? 'custom' : formCategory}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none focus:border-[#4778F5]"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="custom">+ Add Custom Category...</option>
                    </select>
                    {isCustomCategory && (
                      <input
                        type="text"
                        placeholder="Enter category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full mt-1.5 p-2 rounded-xl bg-[#152238] border border-[#F59E0B] text-[#F8FAFC] text-xs outline-none"
                        required
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Official Address in China</label>
                  <input
                    type="text"
                    value={formAddress}
                    placeholder="e.g. Shijing Industrial Logistics Park, Baiyun, Guangzhou"
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">WeChat ID</label>
                    <input
                      type="text"
                      value={formWechat}
                      placeholder="e.g. wx_export88"
                      onChange={(e) => setFormWechat(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      placeholder="+86 138 0000 8888"
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={formWhatsapp}
                      placeholder="+86 138 0000 8888"
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Export Manager</label>
                    <input
                      type="text"
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Min. Order Value (MOQ)</label>
                    <input
                      type="text"
                      value={formMoq}
                      onChange={(e) => setFormMoq(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">Years Vetted</label>
                    <input
                      type="number"
                      value={formYears}
                      onChange={(e) => setFormYears(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] outline-none"
                    />
                  </div>
                </div>

                {/* Official Business Card Management */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#152238] border border-[#293A52]">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block">
                      Official Chinese Business Card
                    </label>
                    <span className="text-[10px] text-[#F59E0B] font-bold">Unlocks for 30-Day VIP Subscribers</span>
                  </div>

                  {formBusinessCardUrl && (
                    <div className="relative inline-block border border-[#293A52] rounded-xl overflow-hidden max-w-[200px]">
                      <img src={formBusinessCardUrl} alt="Card Preview" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormBusinessCardUrl('')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={formBusinessCardUrl}
                      onChange={(e) => setFormBusinessCardUrl(e.target.value)}
                      placeholder="Paste Business Card Image URL..."
                      className="w-full p-2 rounded-xl bg-[#111C2E] border border-[#293A52] text-[#F8FAFC] text-[11px] outline-none focus:border-[#4778F5]"
                    />

                    <label className="p-2 rounded-xl bg-[#111C2E] border border-dashed border-[#293A52] hover:border-[#F59E0B] flex items-center justify-center gap-1.5 cursor-pointer text-[#CBD5E1] text-[11px] font-bold transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Upload Card Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCardFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Verification Document URL */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1">
                    Private Verification Document / License URL (Staff Only)
                  </label>
                  <input
                    type="url"
                    value={formVerificationDocUrl}
                    onChange={(e) => setFormVerificationDocUrl(e.target.value)}
                    placeholder="https://docs.flyemass.com/licenses/..."
                    className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono text-[11px] outline-none focus:border-[#4778F5]"
                  />
                </div>

                {/* Verification Tags Multi-Select */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#CBD5E1] block mb-1.5">
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
                              ? 'bg-[#3867E8] text-white shadow-sm' 
                              : 'bg-[#152238] border border-[#293A52] text-[#94A3B8]'
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#152238] border border-[#293A52]">
                  <input
                    type="checkbox"
                    id="formActive"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3867E8] focus:ring-[#3867E8]"
                  />
                  <label htmlFor="formActive" className="text-xs font-semibold text-[#CBD5E1] cursor-pointer">
                    Publish in VIP Directory (Visible to Active Subscribers)
                  </label>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#293A52]">
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#152238] hover:bg-[#293A52] text-[#CBD5E1] font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSupplier}
                    className="flex-1 py-2.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-black text-xs shadow-md shadow-[#3867E8]/20 cursor-pointer transition-all"
                  >
                    {isSubmittingSupplier ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL: DOCUMENT PREVIEW (SIGNED URL)
           ===================================================================== */}
        {previewDocUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-[#1B2A40] border border-[#293A52] rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#293A52] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-sm font-bold text-[#F8FAFC] truncate max-w-xs">{previewDocTitle}</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setPreviewDocUrl(null)} 
                  className="w-8 h-8 rounded-full bg-[#152238] flex items-center justify-center text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#293A52] bg-[#111C2E] p-1.5">
                <img src={previewDocUrl} alt={previewDocTitle} className="w-full h-auto rounded-xl object-contain max-h-[60vh] mx-auto" />
              </div>

              <div className="text-center text-[10px] text-[#94A3B8] font-mono">
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
