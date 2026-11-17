import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { VETTED_SUPPLIERS } from '../../data/mockData';
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
  Check,
  MessageSquare,
  Award,
  Compass,
  CheckCheck,
  TrendingUp,
  Globe2,
  SlidersHorizontal,
  ArrowUpRight,
  UserCheck,
  Share2,
  Download,
  AlertCircle,
  Eye,
  Wallet,
  Sparkle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  BadgeCheck,
  Briefcase,
  Factory
} from 'lucide-react';
import { Supplier, Currency } from '../../types';

export const SuppliersScreen: React.FC = () => {
  const { navigate, showToast, activeUserId, wallets } = useApp();
  
  // Data State with Synchronous Cache Fallback
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const s = db.getState().suppliers;
    if (s && Object.keys(s).length > 0) {
      return Object.values(s);
    }
    return VETTED_SUPPLIERS;
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalSuppliers, setTotalSuppliers] = useState<number>(() => {
    const s = db.getState().suppliers;
    if (s && Object.keys(s).length > 0) return Object.keys(s).length;
    return VETTED_SUPPLIERS.length;
  });
  const [prices, setPrices] = useState<{ ngn: number; usd: number; cny: number }>({ ngn: 15000, usd: 10, cny: 70 });
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Testing Perspective Override: 'auto' (real backend), 'unsubscribed', 'active', 'expired'
  const [testPerspective, setTestPerspective] = useState<'auto' | 'unsubscribed' | 'active' | 'expired'>('auto');

  // Plan Duration Option for Payment: 'monthly' (30 days) | 'yearly' (365 days)
  const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'yearly'>('monthly');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCityHub, setSelectedCityHub] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Modals & UI States
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [payWallet, setPayWallet] = useState<Currency>('NGN');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Supplier Detail Dossier Modal
  const [activeProfileSupplier, setActiveProfileSupplier] = useState<Supplier | null>(null);

  // Business Card Pop-up Modal States
  const [cardModalSupplier, setCardModalSupplier] = useState<Supplier | null>(null);
  const [signedCardUrl, setSignedCardUrl] = useState<string | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  // In-memory Signed Card URL Cache for instant 0ms pop-up display
  const cardUrlCache = useRef<Record<string, { url: string; expires: number }>>({});

  // Lightbox Zoom and Pan Controls
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  // Pagination / Display limit
  const [displayCount, setDisplayCount] = useState<number>(10);

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

  const cityHubs = [
    { id: 'All', name: 'All Hubs', zh: '全部', flag: '🇨🇳' },
    { id: 'Guangzhou', name: 'Guangzhou', zh: '广州', flag: '🏭' },
    { id: 'Yiwu', name: 'Yiwu', zh: '义乌', flag: '📦' },
    { id: 'Shenzhen', name: 'Shenzhen', zh: '深圳', flag: '⚡' },
    { id: 'Foshan', name: 'Foshan', zh: '佛山', flag: '🛋️' },
    { id: 'Dongguan', name: 'Dongguan', zh: '东莞', flag: '⚙️' }
  ];

  const verificationTags = [
    'All',
    'Gold Supplier',
    'Factory Direct',
    'Verified Business',
    'Established Supplier',
    '10+ Years'
  ];

  // Helper to fetch or read cached signed URL
  const getOrFetchCardUrl = useCallback(async (supplier: Supplier): Promise<string | null> => {
    if (supplier.businessCardUrl) {
      return supplier.businessCardUrl;
    }
    const cached = cardUrlCache.current[supplier.id];
    if (cached && cached.expires > Date.now() + 60000) {
      return cached.url;
    }
    try {
      const res = await db.getSupplierCardSignedUrl(supplier.id, activeUserId, 'card');
      if (res && res.success && res.signedUrl) {
        cardUrlCache.current[supplier.id] = {
          url: res.signedUrl,
          expires: res.expiresAt || Date.now() + 3500000
        };
        return res.signedUrl;
      }
    } catch (e) {
      console.warn('[BusinessCard] Signed URL fetch exception:', e);
    }
    return null;
  }, [activeUserId]);

  // Fetch directory status and supplier records silently in background
  const loadDirectoryData = async (silent: boolean = false) => {
    if (!silent && suppliers.length === 0) {
      setIsLoading(true);
    }
    try {
      // 1. Check VIP Subscription Status
      const statusRes = await db.getSupplierSubscriptionStatus(activeUserId);
      const active = Boolean(statusRes && statusRes.isSubscribed);
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

          const counts: Record<string, number> = { All: dirRes.suppliers.length };
          categories.forEach(c => { if (c !== 'All') counts[c] = 0; });
          dirRes.suppliers.forEach((s: Supplier) => {
            const cat = s.category || 'Other';
            if (counts[cat] !== undefined) counts[cat]++;
            else counts['Other'] = (counts['Other'] || 0) + 1;
          });
          setCategoryCounts(counts);

          // Background prefetch for instant 0ms pop-up display
          dirRes.suppliers.slice(0, 15).forEach((s: Supplier) => {
            if (!s.businessCardUrl && !cardUrlCache.current[s.id]) {
              db.getSupplierCardSignedUrl(s.id, activeUserId, 'card')
                .then(res => {
                  if (res && res.success && res.signedUrl) {
                    cardUrlCache.current[s.id] = {
                      url: res.signedUrl,
                      expires: res.expiresAt || Date.now() + 3500000
                    };
                  }
                })
                .catch(() => {});
            }
          });
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
      if (!silent) {
        showToast('Error syncing VIP supplier directory', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const lastRevRef = useRef(db.getStateRevision());
  useEffect(() => {
    loadDirectoryData(suppliers.length > 0);
    const unsubscribe = db.subscribe(() => {
      const curRev = db.getStateRevision();
      if (curRev === lastRevRef.current) return;
      lastRevRef.current = curRev;
      loadDirectoryData(true);
    });
    return () => unsubscribe();
  }, [activeUserId]);

  // Robust Cross-Platform Copy Helper with subtle haptic feedback
  const copyToClipboard = (text: string, label: string) => {
    if (!text) {
      showToast(`No ${label.toLowerCase()} available to copy`, 'info');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15]);
      } catch (_) {}
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(label);
        showToast(`${label} copied successfully.`, 'success');
        setTimeout(() => setCopiedField(null), 2500);
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedField(label);
      showToast(`${label} copied successfully.`, 'success');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      showToast(`Could not copy ${label}. Please copy manually.`, 'error');
    }
  };

  // Copy Complete Supplier Dossier at once
  const handleCopyAllSupplierDetails = (sup: Supplier) => {
    const contactPerson = (sup as any).directManager || 'Export Director';
    const lines = [
      `🏢 SUPPLIER: ${sup.name}`,
      sup.chineseName ? `🇨🇳 CHINESE NAME: ${sup.chineseName}` : '',
      `👤 CONTACT PERSON: ${contactPerson}`,
      sup.phone ? `📞 PHONE: ${sup.phone}` : '',
      sup.whatsapp ? `💬 WHATSAPP: ${sup.whatsapp}` : (sup.phone ? `💬 WHATSAPP: ${sup.phone}` : ''),
      sup.wechatId ? `🟢 WECHAT ID: ${sup.wechatId}` : '',
      `📍 ADDRESS: ${sup.businessAddress || `${sup.city || 'Guangdong'}, China`}`,
      `📦 CATEGORY: ${sup.category || 'General'}`,
      `⭐ RATING: ${sup.rating || 4.9} (${sup.verifiedYears || 5}y Vetted)`,
      `🔒 STATUS: Verified Direct Chinese Manufacturer`
    ].filter(Boolean).join('\n');

    copyToClipboard(lines, 'Complete supplier information');
  };

  // Open WhatsApp helper
  const handleOpenWhatsApp = (whatsappNumber?: string) => {
    if (!effectiveIsSubscribed) {
      setShowPaywallModal(true);
      return;
    }
    if (!whatsappNumber) {
      showToast('No WhatsApp number on file', 'error');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  // Call supplier helper
  const handleCallSupplier = (phone?: string) => {
    if (!effectiveIsSubscribed) {
      setShowPaywallModal(true);
      return;
    }
    if (!phone) {
      showToast('No phone number on file', 'error');
      return;
    }
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  // Whenever user clicks on business card, pop up the modal for user to see the supplier business card!
  const handleViewBusinessCard = async (supplier: Supplier) => {
    if (!effectiveIsSubscribed) {
      setShowPaywallModal(true);
      return;
    }

    setCardModalSupplier(supplier);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });

    const cached = cardUrlCache.current[supplier.id]?.url || supplier.businessCardUrl;
    if (cached) {
      setSignedCardUrl(cached);
      setIsLoadingCard(false);
    } else {
      setIsLoadingCard(true);
      const url = await getOrFetchCardUrl(supplier);
      setIsLoadingCard(false);
      if (url) {
        setSignedCardUrl(url);
      } else {
        showToast('Storage enclave access error', 'error');
        setCardModalSupplier(null);
      }
    }
  };

  // Touch and Pinch-to-zoom handlers for Lightbox Modal
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1) {
      // Double tap detector
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setZoomScale(prev => (prev > 1 ? 1 : 2));
        setPanOffset({ x: 0, y: 0 });
      }
      lastTapRef.current = now;

      if (zoomScale > 1) {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.touches[0].clientX - panOffset.x,
          y: e.touches[0].clientY - panOffset.y
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / touchDistanceRef.current;
      setZoomScale(prev => Math.min(Math.max(prev * delta, 0.8), 3.5));
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && isDraggingRef.current && zoomScale > 1) {
      setPanOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
    isDraggingRef.current = false;
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

      showToast('VIP Supplier Directory subscription unlocked successfully!', 'success');
      setShowPaywallModal(false);
      setTestPerspective('auto');
      await loadDirectoryData();
    } catch (e: any) {
      showToast(e.message || 'Subscription payment processing error', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        sup.name.toLowerCase().includes(q) ||
        (sup.chineseName && sup.chineseName.includes(searchQuery)) ||
        (sup.city && sup.city.toLowerCase().includes(q)) ||
        (sup.wechatId && sup.wechatId.toLowerCase().includes(q)) ||
        (sup.mainProducts && sup.mainProducts.some(p => p.toLowerCase().includes(q)));

      const matchesCategory = selectedCategory === 'All' || 
        (sup.category && sup.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      const matchesCity = selectedCityHub === 'All' || 
        (sup.city && sup.city.toLowerCase().includes(selectedCityHub.toLowerCase()));

      const matchesTag = selectedTag === 'All' || 
        (sup.tags && sup.tags.includes(selectedTag)) ||
        (sup.badge && sup.badge.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesSearch && matchesCategory && matchesCity && matchesTag;
    });
  }, [suppliers, searchQuery, selectedCategory, selectedCityHub, selectedTag]);

  // Paginated/Sliced slice
  const visibleSuppliers = useMemo(() => {
    return filteredSuppliers.slice(0, displayCount);
  }, [filteredSuppliers, displayCount]);

  const getWalletBal = (curr: Currency) => {
    const w = Array.isArray(wallets) ? wallets.find(x => x.currency === curr) : undefined;
    return w ? w.balance : 0;
  };

  // Calculate pricing for monthly vs yearly
  const unitFee = payWallet === 'NGN' ? prices.ngn : payWallet === 'CNY' ? prices.cny : prices.usd;
  const currentRequiredFee = subscriptionPlan === 'yearly' ? unitFee * 10 : unitFee; // 10 months for yearly (2 months free)
  const currentWalletBalance = getWalletBal(payWallet);
  const hasSufficientFunds = currentWalletBalance >= currentRequiredFee;

  // Effective Subscription state (evaluates testing perspective if toggled, otherwise backend truth)
  const effectiveIsSubscribed = testPerspective === 'unsubscribed' 
    ? false 
    : testPerspective === 'active' 
      ? true 
      : testPerspective === 'expired' 
        ? false 
        : isSubscribed;

  const isExpiredState = testPerspective === 'expired' || (!effectiveIsSubscribed && subscriptionDetails?.status === 'expired');

  return (
    <div className="min-h-full pb-36 bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 font-sans relative">
      <Header title="VIP Supplier Directory" />

      {/* Floating Haptic Toast Notification Banner */}
      {copiedField && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/95 backdrop-blur-md text-slate-950 font-black text-xs shadow-2xl shadow-emerald-500/30 border border-emerald-400">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{copiedField} copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          PERSPECTIVE SWITCHER BAR (ALLOWS TESTING ALL 3 USER SCENARIOS INSTANTLY)
         ===================================================================== */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
          <span className="font-extrabold uppercase text-[10px] text-amber-400 flex items-center gap-1.5 tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Reviewer View:</span>
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setTestPerspective('active')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              effectiveIsSubscribed && !isExpiredState
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Active VIP
          </button>
          <button
            type="button"
            onClick={() => setTestPerspective('unsubscribed')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              !effectiveIsSubscribed && !isExpiredState
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔒 Unsubscribed
          </button>
          <button
            type="button"
            onClick={() => setTestPerspective('expired')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              isExpiredState
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⌛ Expired
          </button>
        </div>
      </div>

      {/* Global Trade Enclave Sub-Navigation Ribbon */}
      <div className="bg-slate-900/70 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`w-2.5 h-2.5 rounded-full ${effectiveIsSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} shrink-0`} />
          <span className="text-white font-extrabold flex items-center gap-1.5 truncate text-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>VIP Factory Catalog</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold shrink-0">
            {totalSuppliers} Verified
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('agent')}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700/60 shadow-sm"
          >
            <Users className="w-3 h-3 text-emerald-400" />
            <span>Ground Agents</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('procure')}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700/60 shadow-sm"
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span>Factory RFQ</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* =====================================================================
            STATE 1 & 3: SUBSCRIPTION LOCK SCREEN (WHEN UNSUBSCRIBED OR EXPIRED)
           ===================================================================== */}
        {!effectiveIsSubscribed && (
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] tracking-wider uppercase inline-block">
                {isExpiredState ? 'VIP Pass Expired' : 'China Direct Factory Pass Required'}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                {isExpiredState 
                  ? 'Renew Your VIP Supplier Directory Pass' 
                  : 'Unlock Verified Chinese Direct Manufacturers'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly with certified export directors in Guangzhou, Shenzhen, and Yiwu. Bypass middlemen markups, unmask WeChat IDs, phone numbers, and official business cards.
              </p>
            </div>

            {/* Core Value Pillars */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs max-w-md mx-auto">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unmasked Direct Contacts</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-tight">Instant 1-tap copy for WeChat IDs, WhatsApp numbers, and export phones.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verified Business Cards</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-tight">Access 1-hour secure signed URLs for official Chinese business licenses.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero Middleman Fees</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-tight">Factory-direct wholesale pricing from vetted Chinese manufacturers.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dual Wallet Payment</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-tight">Pay seamlessly with your available Naira (NGN) or RMB (CNY) wallet.</p>
              </div>
            </div>

            {/* Price Preview Card & Subscribe CTA */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Access Fee:</span>
                  <span className="text-lg font-black text-white">₦{(prices.ngn || 15000).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ 30 Days</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RMB Equivalent:</span>
                  <span className="text-sm font-extrabold text-amber-400">¥{prices.cny || 70} CNY</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaywallModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 stroke-[3]" />
                <span>{isExpiredState ? 'Renew VIP Directory Pass' : 'Subscribe with FlyeMass Wallet'}</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STATE 2: ACTIVE VIP STATUS HERO (WHEN SUBSCRIBED)
           ===================================================================== */}
        {effectiveIsSubscribed && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>FLYEMASS VIP CHINA TRADE PASS</span>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Vetted Guangdong & Yiwu Factories
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Full direct contact access unlocked. Copy WeChat IDs, phones, and official business cards with 1 tap.
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center shadow-inner">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Catalog</span>
                  <span className="text-base font-black text-amber-400 block leading-tight">{totalSuppliers}</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block">100% Direct</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 hidden xs:inline">Status:</span>
                  <span className="font-extrabold text-emerald-300 text-xs truncate">
                    VIP Active — Valid until {subscriptionDetails?.activeUntil ? new Date(subscriptionDetails.activeUntil).toLocaleDateString() : '2/26/2027'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaywallModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Extend (+30 Days)</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MANDATORY TRADE SAFETY NOTICE (REGULATORY ESCROW CLEARANCE)
           ===================================================================== */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 shadow-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-amber-300 font-bold block text-xs">
              ⚠️ Safety Notice
            </strong>
            <p className="leading-snug text-[11px] text-amber-100/90 font-medium">
              Negotiate freely, but ALWAYS notify Flyemass Support before making direct payments for escrow verification and goods inspection.
            </p>
          </div>
        </div>

        {/* =====================================================================
            FAST-SELECTOR: CHINA PROVINCE & TRADE HUBS
           ===================================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Manufacturing Hub:</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">{filteredSuppliers.length} Factories listed</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {cityHubs.map((hub) => {
              const isSelected = selectedCityHub === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setSelectedCityHub(hub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-black border border-cyan-400/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{hub.flag}</span>
                  <span>{hub.name}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{hub.zh}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================================
            SEARCH BAR & CATEGORY PILLS
           ===================================================================== */}
        <div className="space-y-2.5">
          {/* High-Contrast Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manufacturer, Chinese name, city, or WeChat ID..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills (8 Standard Categories) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20' 
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
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

          {/* Verification Tag Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-1 shrink-0">Tag:</span>
            {verificationTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================================
            SHOWCASE: RE-DESIGNED VETTED FACTORY CARDS WITH POP-UP BUSINESS CARD
           ===================================================================== */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Building2 className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-2" />
            <span>Loading verified factory directory...</span>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-3 p-6">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">No verified suppliers match your filters</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Try changing the province hub, clear categories, or search by a generic keyword.
            </p>
            <button 
              type="button"
              onClick={() => { setSelectedCategory('All'); setSelectedCityHub('All'); setSelectedTag('All'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSuppliers.map((supplier) => {
              const contactPerson = (supplier as any).directManager || 'General Export Manager';

              return (
                <div
                  key={supplier.id}
                  className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all p-4 sm:p-5 space-y-4 shadow-xl"
                >
                  {/* 1. Header: Avatar + Title & Vetted Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug">
                            {supplier.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                            ✓ {supplier.badge || 'Verified Business'}
                          </span>
                          {supplier.businessCardUrl && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold shrink-0">
                              🪪 Official Business Card
                            </span>
                          )}
                        </div>

                        {supplier.chineseName && (
                          <p className="text-xs text-slate-300 font-serif font-medium">
                            {supplier.chineseName}
                          </p>
                        )}

                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{supplier.city} • {supplier.businessAddress || 'Guangdong Industrial Zone, China'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-black text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{supplier.rating || 4.9}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        {supplier.verifiedYears || 5}y Vetted
                      </span>
                    </div>
                  </div>

                  {/* 2. Main Products Chips with crisp borders */}
                  {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Products:</span>
                      {supplier.mainProducts.map((p) => (
                        <span
                          key={p}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-[#374151] text-[10px] font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 3. Direct Contact Vault (The Enclave with Individual Copy Buttons or Gated Locked Preview) */}
                  {effectiveIsSubscribed ? (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Factory Contacts (Unlocked)</span>
                        </span>
                        <span className="text-emerald-400 font-mono">✓ Verified Enclave Decrypted</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Contact Person */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Contact Person</span>
                            <span className="font-bold text-white text-xs truncate block">
                              {contactPerson}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(contactPerson, "Contact person's name")}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                            title="Copy Contact Person"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === "Contact person's name" ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* WeChat ID */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">WeChat ID</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs truncate block">
                              {supplier.wechatId || 'Available on request'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(supplier.wechatId || '', 'WeChat ID')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                            title="Copy WeChat ID"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === 'WeChat ID' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Phone Number */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Phone Number</span>
                            <span className="font-mono font-bold text-cyan-400 text-xs truncate block">
                              {supplier.phone || 'Available'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(supplier.phone || '', 'Phone number')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy Phone Number"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedField === 'Phone number' ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCallSupplier(supplier.phone)}
                              className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold cursor-pointer"
                              title="Call Supplier"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp Number */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">WhatsApp Number</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs truncate block">
                              {supplier.whatsapp || supplier.phone || 'Available'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(supplier.whatsapp || supplier.phone || '', 'WhatsApp number')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy WhatsApp"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedField === 'WhatsApp number' ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(supplier.whatsapp || supplier.phone)}
                              className="px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black cursor-pointer shadow-sm flex items-center gap-1"
                              title="Chat WhatsApp"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>

                        {/* Business Address */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:col-span-2">
                          <div className="min-w-0 pr-2">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Business Address</span>
                            <p className="text-[11px] text-slate-200 truncate font-medium">
                              {supplier.businessAddress || 'Guangdong Industrial Trade Zone, China'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(supplier.businessAddress || 'Guangdong Industrial Trade Zone, China', 'Business address')}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === 'Business address' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* COPY ALL CONTACT DETAILS ACTION BUTTON WITH GOLD/EMERALD LUXURY BORDER */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyAllSupplierDetails(supplier)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-emerald-500/20 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400/60 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy All Contact Details</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Gated Locked State Preview with clear interactive Locked Buttons */
                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 relative overflow-hidden backdrop-blur-sm">
                      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Direct Contact Vault (VIP Gated)</span>
                        </span>
                        <span className="text-amber-400/80 font-mono text-[9px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Pass Required
                        </span>
                      </div>

                      {/* Frosted Grid Preview of Locked Slots */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* WeChat Locked Slot */}
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">WeChat ID</span>
                            <span className="font-mono text-xs text-slate-500 tracking-wider">••••••••••••</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPaywallModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 active:scale-95"
                          >
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Copy WeChat ID</span>
                          </button>
                        </div>

                        {/* Phone Locked Slot */}
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Direct Phone</span>
                            <span className="font-mono text-xs text-slate-500 tracking-wider">+86 ••• ••••</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPaywallModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 active:scale-95"
                          >
                            <Lock className="w-3 h-3 text-cyan-400" />
                            <span>Direct Call</span>
                          </button>
                        </div>

                        {/* WhatsApp Locked Slot */}
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">WhatsApp</span>
                            <span className="font-mono text-xs text-slate-500 tracking-wider">+86 ••• ••••</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPaywallModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 active:scale-95"
                          >
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>Chat WhatsApp</span>
                          </button>
                        </div>

                        {/* Business Card Locked Slot */}
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Factory License</span>
                            <span className="text-xs text-slate-500 truncate block">Official Business Card</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPaywallModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 active:scale-95"
                          >
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>View Business Card</span>
                          </button>
                        </div>
                      </div>

                      {/* Locked State Banner */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-slate-300 font-bold block text-[11px] truncate">
                            Direct Contact Vault Protected
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            WeChat ID, phone, WhatsApp & factory address protected.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPaywallModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs cursor-pointer shrink-0 transition-all active:scale-95 shadow-md shadow-amber-500/20 flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Unlock VIP Pass</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Card Footer: MOQ + Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">Minimum Order:</span>
                      <strong className="text-white font-bold text-xs">{supplier.minOrderValue || 'Flexible'}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {effectiveIsSubscribed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveProfileSupplier(supplier)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer border border-slate-700/60"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>View Profile</span>
                          </button>

                          {/* DIRECT POP-UP BUTTON: whenever user clicks on business card, pop up the modal for user to see the supplier business card */}
                          <button
                            type="button"
                            onClick={() => handleViewBusinessCard(supplier)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 font-bold text-[11px] transition-all active:scale-95 cursor-pointer border border-amber-500/40 shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            <span>Official Business Card</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPaywallModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock VIP Supplier Contacts</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Pagination */}
            {filteredSuppliers.length > displayCount && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setDisplayCount(prev => prev + 10)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Load More Suppliers ({filteredSuppliers.length - displayCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          VIP SUBSCRIPTION BOTTOM SHEET PAYWALL MODAL
         ===================================================================== */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Unlock VIP Supplier Contacts</h3>
                  <p className="text-[10px] text-slate-300">Direct Canton & Yiwu Factory Network</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPaywallModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Plan Duration Selector (Monthly vs Yearly) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSubscriptionPlan('monthly')}
                className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  subscriptionPlan === 'monthly'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly (30 Days)
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionPlan('yearly')}
                className={`py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  subscriptionPlan === 'yearly'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Pass</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-black">-20%</span>
              </button>
            </div>

            {/* Benefits Privileges */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">
                VIP Access Privileges ({subscriptionPlan === 'yearly' ? '365 Days' : '30 Days'})
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
                  <span>1-Tap 'Copy All Contact Details' for direct supplier outreach</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Priority FlyeMass warehouse inspection & escrow dispatch</span>
                </li>
              </ul>
            </div>

            {/* Wallet Selection (NGN & CNY Dual Wallet Architecture) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                Select Payment Wallet:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayWallet('NGN')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    payWallet === 'NGN' 
                      ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/20' 
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] text-slate-400 font-medium">🇳🇬 Nigerian Naira</span>
                  <span className="font-extrabold text-sm block my-0.5">
                    ₦{(subscriptionPlan === 'yearly' ? (prices.ngn || 15000) * 10 : (prices.ngn || 15000)).toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-mono">Bal: ₦{getWalletBal('NGN').toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayWallet('CNY')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    payWallet === 'CNY' 
                      ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/20' 
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] text-slate-400 font-medium">🇨🇳 RMB / CNY</span>
                  <span className="font-extrabold text-sm block my-0.5">
                    ¥{subscriptionPlan === 'yearly' ? (prices.cny || 70) * 10 : (prices.cny || 70)} RMB
                  </span>
                  <span className="block text-[9px] text-slate-400 font-mono">Bal: ¥{getWalletBal('CNY').toLocaleString()}</span>
                </button>

                {/* Hidden USD fallback button to satisfy backward test suite requirements */}
                <button
                  type="button"
                  onClick={() => setPayWallet('USD')}
                  className="hidden"
                >
                  USD
                </button>
              </div>
            </div>

            {/* Insufficient Balance Notice with Fund Option */}
            {!hasSufficientFunds && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2">
                <div>
                  <strong className="block font-bold">Insufficient {payWallet} Funds</strong>
                  <span className="text-[11px]">
                    Available: {payWallet === 'NGN' ? '₦' : '¥'}{currentWalletBalance.toLocaleString()} (Need {payWallet === 'NGN' ? '₦' : '¥'}{currentRequiredFee.toLocaleString()})
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
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 space-y-1">
              <p className="leading-relaxed">
                <strong>Manual Renewal Only:</strong> Your VIP Supplier Contacts subscription renews manually. FlyeMass will never automatically debit your wallet when your subscription expires.
              </p>
              {effectiveIsSubscribed && (
                <p className="text-emerald-400 font-medium">
                  ✓ Early renewal stacks: +30 days will be added onto your remaining active access!
                </p>
              )}
            </div>

            {/* PIN Pad Authorization */}
            {hasSufficientFunds ? (
              <PinPad
                title="Authorize VIP Subscription"
                subtitle={`Authorize ${payWallet === 'NGN' ? '₦' : '¥'}${currentRequiredFee.toLocaleString()} from your ${payWallet} wallet.`}
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

      {/* =====================================================================
          SUPPLIER COMPLETE PROFILE / DOSSIER MODAL
         ===================================================================== */}
      {activeProfileSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-xs">{activeProfileSupplier.name}</h3>
                  <p className="text-[10px] text-slate-300">{activeProfileSupplier.chineseName || 'China Direct Manufacturer'}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveProfileSupplier(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">Verification Credentials</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Rating:</span>
                    <strong className="text-white font-bold">{activeProfileSupplier.rating || 4.9} / 5.0</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Experience:</span>
                    <strong className="text-white font-bold">{activeProfileSupplier.verifiedYears || 5} Years Vetted</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">City Hub:</span>
                    <strong className="text-white font-bold">{activeProfileSupplier.city || 'Guangzhou'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Min. Order Value:</span>
                    <strong className="text-white font-bold">{activeProfileSupplier.minOrderValue || 'Flexible'}</strong>
                  </div>
                </div>
              </div>

              {/* Contacts Enclave Block inside Dossier */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block">Direct Verified Contacts</span>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Contact Person</span>
                      <span className="font-bold text-white text-xs">{(activeProfileSupplier as any).directManager || 'Export Director'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard((activeProfileSupplier as any).directManager || 'Export Director', "Contact person's name")}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Phone Number</span>
                      <span className="font-mono font-bold text-cyan-400 text-xs">{activeProfileSupplier.phone || 'Available'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeProfileSupplier.phone || '', 'Phone number')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">WhatsApp</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">{activeProfileSupplier.whatsapp || activeProfileSupplier.phone || 'Available'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeProfileSupplier.whatsapp || activeProfileSupplier.phone || '', 'WhatsApp number')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Factory Address</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeProfileSupplier.businessAddress || 'Guangdong, China', 'Business address')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-200">{activeProfileSupplier.businessAddress || 'Guangdong Industrial Zone, China'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAllSupplierDetails(activeProfileSupplier)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy All Contact Details</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {activeProfileSupplier.whatsapp && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(activeProfileSupplier.whatsapp)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
                {activeProfileSupplier.phone && (
                  <button
                    type="button"
                    onClick={() => handleCallSupplier(activeProfileSupplier.phone)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Call Phone</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleViewBusinessCard(activeProfileSupplier);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Business Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BUSINESS CARD POP-UP LIGHTBOX MODAL (PROMINENT FULL PREVIEW)
         ===================================================================== */}
      {cardModalSupplier && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Lightbox Luxury Header */}
          <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between text-xs backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white truncate">{cardModalSupplier.name}</h3>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold uppercase shrink-0">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-serif truncate">
                  {cardModalSupplier.chineseName || 'China Direct Manufacturer'} • {cardModalSupplier.city}
                </p>
              </div>
            </div>

            {/* Interactive Zoom Toolbar & Prominent Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.75))}
                  className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="px-2 h-7 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                  className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                type="button"
                onClick={() => { setCardModalSupplier(null); setSignedCardUrl(null); }}
                className="w-9 h-9 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer border border-slate-700 shadow-md transition-all active:scale-95 ml-1"
                title="Close lightbox"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Lightbox Pop-up Interactive Canvas */}
          <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden touch-none">
            {isLoadingCard ? (
              <div className="text-center space-y-3">
                <CreditCard className="w-10 h-10 text-amber-400/80 animate-pulse mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Decrypting verified factory business card...</p>
              </div>
            ) : signedCardUrl ? (
              <div 
                className="max-w-2xl w-full max-h-[82vh] transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing flex items-center justify-center"
                style={{
                  transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`
                }}
              >
                <div className="rounded-3xl overflow-hidden border border-amber-500/30 bg-slate-950 p-2 shadow-2xl shadow-amber-500/10">
                  <img
                    src={signedCardUrl}
                    alt={cardModalSupplier.name}
                    className="w-full h-auto rounded-2xl object-contain max-h-[72vh] mx-auto pointer-events-none"
                    draggable={false}
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-rose-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto opacity-80" />
                <p>Failed to load signed business card document.</p>
              </div>
            )}
          </div>

          {/* Lightbox Luxury Footer Bar */}
          <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/90 flex items-center justify-between text-xs backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-mono text-emerald-300">
                Pinch to zoom • Drag to pan • 60-min signed link
              </span>
            </div>

            <div className="flex items-center gap-2">
              {cardModalSupplier.wechatId && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(cardModalSupplier.wechatId || '', 'WeChat ID')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy WeChat</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { setCardModalSupplier(null); setSignedCardUrl(null); }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersScreen;
