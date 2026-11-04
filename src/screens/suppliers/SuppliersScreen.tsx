import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  ChevronRight, 
  CheckCircle2, 
  Send,
  Lock,
  Sparkles,
  Users,
  AlertTriangle,
  KeyRound,
  Copy,
  ExternalLink,
  Phone,
  MapPin,
  FileText,
  X,
  CreditCard,
  Clock,
  Shield,
  Layers,
  Check
} from 'lucide-react';
import { Supplier, Currency } from '../../types';

export const SuppliersScreen: React.FC = () => {
  const { navigate, showToast, activeUserId, wallets } = useApp();
  
  // Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalSuppliers, setTotalSuppliers] = useState<number>(0);
  const [prices, setPrices] = useState<{ ngn: number; usd: number; cny: number }>({ ngn: 15000, usd: 10, cny: 70 });
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Modals
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [payWallet, setPayWallet] = useState<Currency>('USD');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Business Card Signed Preview Modal
  const [cardModalSupplier, setCardModalSupplier] = useState<Supplier | null>(null);
  const [signedCardUrl, setSignedCardUrl] = useState<string | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  const categories = [
    'All', 
    'Electronics', 
    'Fashion', 
    'Appliances', 
    'Home & Living', 
    'Beauty', 
    'Machinery', 
    'Other'
  ];

  const verificationTags = [
    'All',
    'Gold Supplier',
    'Factory Direct',
    'Verified Business',
    'Established Supplier',
    '10+ Years'
  ];

  // Fetch directory status and supplier records
  const loadDirectoryData = async () => {
    setIsLoading(true);
    try {
      // 1. Check VIP Subscription Status
      const statusRes = await db.getSupplierSubscriptionStatus(activeUserId);
      const active = statusRes && statusRes.isSubscribed;
      setIsSubscribed(active);
      setSubscriptionDetails(statusRes);

      // 2. Load Prices
      const priceRes = await db.getSupplierPrices();
      if (priceRes && priceRes.prices) {
        setPrices(priceRes.prices);
      }

      // 3. Load Suppliers (Protected Directory if active, otherwise Preview RPC)
      if (active) {
        const dirRes = await db.getSupplierDirectory(activeUserId);
        if (dirRes && dirRes.success && dirRes.suppliers) {
          setSuppliers(dirRes.suppliers);
          setTotalSuppliers(dirRes.suppliers.length);

          // Calculate counts dynamically from real database records
          const counts: Record<string, number> = { All: dirRes.suppliers.length };
          categories.forEach(c => { if (c !== 'All') counts[c] = 0; });
          dirRes.suppliers.forEach((s: Supplier) => {
            const cat = s.category || 'Other';
            if (counts[cat] !== undefined) counts[cat]++;
            else counts['Other'] = (counts['Other'] || 0) + 1;
          });
          setCategoryCounts(counts);
        }
      } else {
        const prevRes = await db.getSupplierDirectoryPreview();
        if (prevRes && prevRes.success && prevRes.suppliers) {
          setSuppliers(prevRes.suppliers);
          setTotalSuppliers(prevRes.total || prevRes.suppliers.length);
          setCategoryCounts(prevRes.categories || {});
          if (prevRes.prices) setPrices(prevRes.prices);
        }
      }
    } catch (e) {
      console.error('Failed to load supplier directory:', e);
      showToast('Error syncing VIP supplier directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectoryData();
    const unsubscribe = db.subscribe(() => {
      loadDirectoryData();
    });
    return () => unsubscribe();
  }, [activeUserId]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Open WhatsApp helper
  const handleOpenWhatsApp = (whatsappNumber?: string) => {
    if (!whatsappNumber) {
      showToast('No WhatsApp number on file', 'error');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  // Request Escrow Verification / Trade Desk Assistance
  const handleRequestEscrow = async (supplier: Supplier) => {
    try {
      const message = `Hello FlyeMass, please help verify supplier ${supplier.name} in ${supplier.category} before I make payment. I would like assistance with supplier verification, transaction coordination, and warehouse inspection.`;
      
      const res = await db.createSupportTicket(
        `Supplier Verification: ${supplier.name}`,
        'Supplier Escrow',
        'High',
        message,
        activeUserId
      );

      if (res && res.ticket) {
        showToast(`Escrow verification ticket #${res.ticket.reference || res.ticket.id} created!`, 'success');
        navigate('support');
      } else {
        showToast('Support desk connected. Redirecting to chat...', 'info');
        navigate('support');
      }
    } catch (e: any) {
      showToast(e.message || 'Error opening escrow verification desk', 'error');
    }
  };

  // View Business Card via 1-Hour Signed URL
  const handleViewBusinessCard = async (supplier: Supplier) => {
    if (!isSubscribed) {
      setShowPaywallModal(true);
      return;
    }

    setIsLoadingCard(true);
    setCardModalSupplier(supplier);
    try {
      const res = await db.getSupplierCardSignedUrl(supplier.id, activeUserId, 'card');
      if (res && res.success && res.signedUrl) {
        setSignedCardUrl(res.signedUrl);
      } else {
        showToast(res.error || 'Failed to generate signed document URL', 'error');
        setCardModalSupplier(null);
      }
    } catch (e: any) {
      showToast(e.message || 'Storage enclave access error', 'error');
      setCardModalSupplier(null);
    } finally {
      setIsLoadingCard(false);
    }
  };

  // Execute Subscription Payment
  const handleAuthorizeSubscription = async (pin: string) => {
    setIsSubscribing(true);
    try {
      const res = await db.subscribeSupplierDirectory(activeUserId, payWallet, pin);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }

      showToast('30-Day VIP Supplier Directory unlocked successfully!', 'success');
      setShowPaywallModal(false);
      await loadDirectoryData();
    } catch (e: any) {
      showToast(e.message || 'Subscription payment processing error', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      sup.name.toLowerCase().includes(q) ||
      (sup.chineseName && sup.chineseName.includes(searchQuery)) ||
      (sup.city && sup.city.toLowerCase().includes(q)) ||
      (sup.wechatId && sup.wechatId.toLowerCase().includes(q)) ||
      (sup.mainProducts && sup.mainProducts.some(p => p.toLowerCase().includes(q)));

    const matchesCategory = selectedCategory === 'All' || 
      (sup.category && sup.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesTag = selectedTag === 'All' || 
      (sup.tags && sup.tags.includes(selectedTag)) ||
      (sup.badge && sup.badge.toLowerCase().includes(selectedTag.toLowerCase()));

    return matchesSearch && matchesCategory && matchesTag;
  });

  const getWalletBal = (curr: Currency) => {
    const w = Array.isArray(wallets) ? wallets.find(x => x.currency === curr) : undefined;
    return w ? w.balance : 0;
  };

  // Calculate current required fee & user wallet balance
  const currentRequiredFee = payWallet === 'NGN' ? prices.ngn : payWallet === 'CNY' ? prices.cny : prices.usd;
  const currentWalletBalance = getWalletBal(payWallet);
  const hasSufficientFunds = currentWalletBalance >= currentRequiredFee;

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="VIP Supplier Directory" />

      <div className="p-4 space-y-4">
        {/* Section 1: Hero Section */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 shadow-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                THE CHINA CONNECTION
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Vetted Guangdong & Yiwu Factories
              </h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Direct export managers, unmasked WeChat IDs, phones, and factory addresses.
              </p>
            </div>

            <div className="text-right">
              <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Catalog</span>
                <strong className="text-amber-400 text-sm font-extrabold">{totalSuppliers}</strong>
                <span className="text-[9px] text-slate-400 block font-medium">Factories</span>
              </div>
            </div>
          </div>

          {/* Subscription Status Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {isSubscribed ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-400">
                  VIP Active — Access until {subscriptionDetails?.activeUntil ? new Date(subscriptionDetails.activeUntil).toLocaleDateString() : 'Active'}
                </span>
                {subscriptionDetails?.daysRemaining !== undefined && (
                  <span className="text-[11px] text-slate-400">
                    ({subscriptionDetails.daysRemaining} days remaining)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Limited Preview Mode — Direct contacts encrypted.
                </span>
              </div>
            )}

            <div>
              {isSubscribed ? (
                <button
                  onClick={() => setShowPaywallModal(true)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  <span>Renew Early (+30 Days)</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowPaywallModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Unlock Contacts (${prices.usd || 10} / 30d)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 10: Mandatory Trade Safety Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-400 font-bold block text-xs uppercase tracking-wide">
              FlyeMass Trade Safety Notice
            </strong>
            <p className="leading-relaxed text-[11px] text-amber-100/90">
              You are free to negotiate prices directly with suppliers. However, before making any payment or finalizing deals, please contact FlyeMass Customer Service. Our team can assist with supplier verification, transaction coordination, and overseas warehouse inspection before shipping to your destination country.
            </p>
          </div>
        </div>

        {/* Shortcut Banner: Bilingual Trade Agents */}
        <div 
          onClick={() => navigate('agent')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Need an On-Site Factory Inspector?</h4>
              <p className="text-[10px] text-slate-400">
                Book a bilingual trade agent in Guangzhou, Yiwu, or Shenzhen for live factory audits.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manufacturer, Chinese name, city, or WeChat ID..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all"
          />
        </div>

        {/* Category Filter Pills (8 Standard Categories) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Verification Tag Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Tag:</span>
          {verificationTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tag 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Section 8: Supplier Cards Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading verified factory catalog...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No verified suppliers found matching your filter criteria.</p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedTag('All'); setSearchQuery(''); }}
              className="text-amber-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5 transition-all hover:border-slate-700"
              >
                {/* Supplier Top Header */}
                <div className="flex gap-3.5">
                  <img
                    src={supplier.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
                    alt={supplier.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                        {supplier.badge || 'Verified Manufacturer'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {supplier.city}
                      </span>
                      {supplier.category && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[9px]">
                          {supplier.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white mt-1 leading-snug">{supplier.name}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{supplier.chineseName}</p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {supplier.rating || 4.9}
                      </span>
                      <span>•</span>
                      <span>{supplier.ordersFulfilled || 120}+ Fulfilled</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{supplier.verifiedYears}y Vetted</span>
                    </div>
                  </div>
                </div>

                {/* Verification Tags */}
                {supplier.tags && supplier.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {supplier.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[9px] font-medium text-amber-300/90"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Main Products Pills */}
                {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {supplier.mainProducts.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact Enclave Box */}
                {isSubscribed ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Verified Direct Factory Contacts
                      </span>
                      <button
                        onClick={() => handleViewBusinessCard(supplier)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Official Business Card</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* WeChat ID */}
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">WeChat ID</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">
                            {supplier.wechatId || 'Protected'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(supplier.wechatId || '', 'WeChat ID')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'WeChat ID' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Phone */}
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Telephone</span>
                          <span className="font-mono font-bold text-cyan-400 text-[11px]">
                            {supplier.phone || '+86 20 8888 9999'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(supplier.phone || '', 'Phone Number')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'Phone Number' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* WhatsApp with Direct Link */}
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">WhatsApp</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">
                            {supplier.whatsapp || supplier.phone || 'Available'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(supplier.whatsapp || supplier.phone || '', 'WhatsApp Number')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenWhatsApp(supplier.whatsapp || supplier.phone)}
                            className="px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">China Factory Address</span>
                          <p className="text-[10px] text-slate-300 truncate">
                            {supplier.businessAddress || 'Guangdong Industrial Zone, China'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(supplier.businessAddress || 'Guangdong Industrial Zone, China', 'Address')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'Address' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] text-slate-400">
                        WeChat ID, phone, WhatsApp & factory address protected.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowPaywallModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                    >
                      Unlock (${prices.usd || 10})
                    </button>
                  </div>
                )}

                {/* Card Footer: MOQ + Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Min Order: <strong className="text-slate-200">{supplier.minOrderValue || 'Flexible'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Escrow Assistance / Support Chat Trigger */}
                    <button
                      onClick={() => handleRequestEscrow(supplier)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Request Escrow Assistance</span>
                    </button>

                    {/* Pay Supplier Shortcut */}
                    <button
                      onClick={() => navigate('pay')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Pay Escrow</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4 & 5: VIP Subscription Bottom Sheet Paywall */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Unlock VIP Supplier Contacts</h3>
                  <p className="text-[10px] text-slate-400">Direct Canton & Yiwu Factory Network</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaywallModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Benefits */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">
                VIP Access Privileges (30 Days)
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unmasked factory WeChat IDs, direct phones & WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verified Chinese business cards & physical addresses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Priority FlyeMass warehouse inspection & escrow dispatch</span>
                </li>
              </ul>
            </div>

            {/* Wallet Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                Select Payment Wallet:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayWallet('NGN')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    payWallet === 'NGN' 
                      ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-medium">🇳🇬 NGN</span>
                  <span className="font-extrabold text-[11px]">₦{(prices.ngn || 15000).toLocaleString()}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Bal: ₦{getWalletBal('NGN').toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayWallet('USD')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    payWallet === 'USD' 
                      ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-medium">🇺🇸 USD</span>
                  <span className="font-extrabold text-[11px]">${prices.usd || 10}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Bal: ${getWalletBal('USD').toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayWallet('CNY')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    payWallet === 'CNY' 
                      ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-medium">🇨🇳 CNY</span>
                  <span className="font-extrabold text-[11px]">¥{prices.cny || 70}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Bal: ¥{getWalletBal('CNY').toLocaleString()}</span>
                </button>
              </div>
            </div>

            {/* Insufficient Balance Notice */}
            {!hasSufficientFunds && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2">
                <div>
                  <strong className="block font-bold">Insufficient {payWallet} Funds</strong>
                  <span className="text-[11px]">
                    Available: {payWallet === 'NGN' ? '₦' : payWallet === 'CNY' ? '¥' : '$'}{currentWalletBalance.toLocaleString()} (Need {payWallet === 'NGN' ? '₦' : payWallet === 'CNY' ? '¥' : '$'}{currentRequiredFee.toLocaleString()})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaywallModal(false);
                    navigate('fund');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  Fund Wallet
                </button>
              </div>
            )}

            {/* Manual Renewal & Stacking Notice */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <p className="leading-relaxed">
                <strong>Manual Renewal Only:</strong> Your VIP Supplier Contacts subscription renews manually. FlyeMass will never automatically debit your wallet when your subscription expires.
              </p>
              {isSubscribed && (
                <p className="text-emerald-400 font-medium">
                  ✓ Early renewal stacks: +30 days will be added onto your remaining active access!
                </p>
              )}
            </div>

            {/* 6-Digit PIN Pad */}
            {hasSufficientFunds ? (
              <PinPad
                title="Authorize VIP Subscription"
                subtitle={`Authorize ${payWallet === 'NGN' ? '₦' : payWallet === 'CNY' ? '¥' : '$'}${currentRequiredFee.toLocaleString()} from your ${payWallet} wallet.`}
                onComplete={handleAuthorizeSubscription}
                onCancel={() => setShowPaywallModal(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowPaywallModal(false);
                  navigate('fund');
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Top-Up {payWallet} Wallet to Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section 9: Business Card Signed Preview Modal */}
      {cardModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Verified Chinese Business Card</h3>
                  <p className="text-[10px] text-slate-400">{cardModalSupplier.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setCardModalSupplier(null); setSignedCardUrl(null); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isLoadingCard ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Generating secure 1-hour signed storage URL...
              </div>
            ) : signedCardUrl ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-1 shadow-inner">
                  <img
                    src={signedCardUrl}
                    alt={cardModalSupplier.name}
                    className="w-full h-auto rounded-xl object-contain max-h-[360px]"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] font-mono">
                    🔒 Temporary signed URL valid for 60 minutes
                  </span>
                  <button
                    onClick={() => handleRequestEscrow(cardModalSupplier)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Request Escrow Verification
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-rose-400">
                Failed to load signed document.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SuppliersScreen;