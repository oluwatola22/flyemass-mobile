import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  Heart,
  ArrowLeftRight,
  Filter,
  Package,
  Sparkles,
  Check,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Flame,
  Truck,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Headphones,
  Zap,
  Tag,
  X
} from 'lucide-react';
import { TechProduct, BannerDocument, ScreenRoute } from '../../types';

export const ShopScreen: React.FC = () => {
  const { 
    navigate, 
    addToCart, 
    cart, 
    savedProductIds, 
    toggleSaveProduct, 
    compareProductIds, 
    toggleCompareProduct, 
    shopOrders,
    shopCurrency,
    setShopCurrency,
    showToast
  } = useApp();

  const [selectedBrand, setSelectedBrand] = useState<'All Brands' | 'Apple' | 'Google Pixel' | 'Samsung'>('All Brands');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'stock'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default standard 2-column market grid
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const [productsList, setProductsList] = useState<TechProduct[]>(() => {
    const list = db.getProducts();
    return list.length > 0 ? list : TECH_PRODUCTS;
  });

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  useEffect(() => {
    return db.subscribe(() => {
      const current = db.getProducts();
      if (current.length > 0) {
        setProductsList((prev) => {
          if (
            prev.length === current.length &&
            prev.every((p, i) => p.id === current[i]?.id && p.priceUSD === current[i]?.priceUSD && p.inStock === current[i]?.inStock)
          ) {
            return prev;
          }
          return current;
        });
      }
    });
  }, []);

  // Dynamic Image Banners from Database & Real-Time Sync
  const [dbShopBanners, setDbShopBanners] = useState<BannerDocument[]>(() => {
    return db.getShopBanners();
  });
  const [bannerImagesLoaded, setBannerImagesLoaded] = useState<Record<string, boolean>>({});
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    return db.subscribe(() => {
      const current = db.getProducts();
      if (current.length > 0) {
        setProductsList((prev) => {
          if (
            prev.length === current.length &&
            prev.every((p, i) => p.id === current[i]?.id && p.priceUSD === current[i]?.priceUSD && p.inStock === current[i]?.inStock)
          ) {
            return prev;
          }
          return current;
        });
      }

      const nextBanners = db.getShopBanners();
      setDbShopBanners((prev) => {
        if (
          prev.length === nextBanners.length &&
          prev.every((b, i) => b.id === nextBanners[i]?.id && b.imageUrl === nextBanners[i]?.imageUrl && b.isActive === nextBanners[i]?.isActive && b.title === nextBanners[i]?.title && b.displayOrder === nextBanners[i]?.displayOrder)
        ) {
          return prev;
        }
        return nextBanners;
      });
    });
  }, []);

  // Marketplace Promotional Banners (Dynamic Image Banners connected to Admin & Supabase Storage)
  const marketBanners = useMemo(() => {
    const source = (dbShopBanners && dbShopBanners.length > 0) ? dbShopBanners : [
      {
        id: 'banner-hk-direct',
        badge: 'Hong Kong Direct Hub',
        title: 'Apple iPhone 16 Pro Max • Dual SIM',
        subtitle: 'Dual physical SIM models with 2-4 days express air freight to Lagos MM2 Hub.',
        description: 'Factory Sealed HK Spec Dual physical SIM models with express air freight to Lagos.',
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: 'shop' as ScreenRoute,
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'banner-m4-arrival',
        badge: 'New Arrival',
        title: 'Apple M4 Max & Pro Hardware',
        subtitle: 'Global Apple Limited Warranty with cryptographic serial number tracking.',
        description: 'Brand new Apple Silicon hardware available with direct quality inspection.',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: 'shop' as ScreenRoute,
        isActive: true,
        displayOrder: 2
      },
      {
        id: 'banner-wholesale',
        badge: 'Wholesale & Retail',
        title: 'Direct Ikeja Retailer Pricing',
        subtitle: 'Multi-currency checkout with verified trade clearance in Naira or Chinese Yuan.',
        description: 'Bulk wholesale orders with insured freight and zero customs demurrage.',
        imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: 'shop' as ScreenRoute,
        isActive: true,
        displayOrder: 3
      }
    ];

    return source.map((banner, index) => {
      const icon = index === 0 ? Zap : index === 1 ? Sparkles : Flame;
      return {
        id: banner.id,
        badge: banner.badge || (index === 0 ? 'Hong Kong Direct Hub' : index === 1 ? 'New Arrival' : 'Wholesale Deal'),
        title: banner.title,
        subtitle: banner.subtitle || banner.description || 'Direct Air Cargo from Hong Kong & Guangzhou to Lagos MMIA.',
        imageUrl: banner.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: banner.destinationRoute || 'shop',
        linkUrl: banner.linkUrl,
        productId: banner.productId,
        color: index === 0 ? 'from-emerald-950/80 via-slate-900 to-slate-900' : index === 1 ? 'from-amber-950/80 via-slate-900 to-slate-900' : 'from-indigo-950/80 via-slate-900 to-slate-900',
        border: index === 0 ? 'border-emerald-500/30' : index === 1 ? 'border-amber-500/30' : 'border-indigo-500/30',
        badgeColor: index === 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : index === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon
      };
    });
  }, [dbShopBanners]);

  // Auto-rotate promotional carousel every 5s with pause on interaction
  useEffect(() => {
    if (marketBanners.length <= 1 || isCarouselPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % marketBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [marketBanners.length, isCarouselPaused]);

  // Standard marketplace categories with icons
  const categories = [
    { id: 'All', label: 'All Items', icon: Sparkles },
    { id: 'iPhone', label: 'iPhones', icon: Smartphone },
    { id: 'MacBook', label: 'MacBooks', icon: Laptop },
    { id: 'iPad', label: 'iPads', icon: Tablet },
    { id: 'Apple Watch', label: 'Watches', icon: Watch },
    { id: 'AirPods', label: 'Audio', icon: Headphones },
    { id: 'Google Pixel', label: 'Google Pixel', icon: Smartphone },
    { id: 'Samsung', label: 'Samsung Galaxy', icon: Smartphone },
    { id: 'Accessories', label: 'Accessories', icon: Tag }
  ];

  const brands = ['All Brands', 'Apple', 'Google Pixel', 'Samsung'] as const;
  const conditions = ['All', 'Brand New', 'Refurbished', 'Fair / Pre-owned'] as const;

  const matchesCategory = (prod: TechProduct, cat: string) => {
    if (cat === 'All') return true;
    if (cat === 'iPhone') return prod.category === 'iPhone' || (prod.brand === 'Apple' && prod.title.toLowerCase().includes('iphone'));
    if (cat === 'MacBook') return prod.category === 'MacBook' || prod.category === 'Mac';
    if (cat === 'Apple Watch') return prod.category === 'Apple Watch' || prod.category === 'Watch';
    if (cat === 'AirPods') return prod.category === 'AirPods' || prod.category === 'Audio';
    if (cat === 'Google Pixel') return prod.brand === 'Google Pixel' || prod.category === 'Google Pixel' || prod.title.toLowerCase().includes('pixel');
    if (cat === 'Samsung') return prod.brand === 'Samsung' || prod.category === 'Samsung' || prod.title.toLowerCase().includes('samsung') || prod.title.toLowerCase().includes('galaxy');
    return prod.category === cat;
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const list = productsList.filter((prod) => {
      // 1. Brand match
      let matchBrand = true;
      if (selectedBrand === 'Apple') {
        matchBrand = prod.brand === 'Apple' || (!prod.brand && !prod.title.includes('Pixel') && !prod.title.includes('Samsung'));
      } else if (selectedBrand === 'Google Pixel') {
        matchBrand = prod.brand === 'Google Pixel' || prod.category === 'Google Pixel' || prod.title.includes('Pixel');
      } else if (selectedBrand === 'Samsung') {
        matchBrand = prod.brand === 'Samsung' || prod.category === 'Samsung' || prod.title.includes('Samsung') || prod.title.includes('Galaxy');
      }

      // 2. Category match
      const matchCat = matchesCategory(prod, selectedCategory);

      // 3. Condition match
      const prodCond = prod.condition || 'Brand New';
      const matchCond = selectedCondition === 'All' || prodCond === selectedCondition;

      // 4. Search query
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        prod.title.toLowerCase().includes(q) || 
        prod.subtitle.toLowerCase().includes(q) ||
        (prod.brand && prod.brand.toLowerCase().includes(q)) ||
        (prod.model && prod.model.toLowerCase().includes(q)) ||
        (prod.specs && prod.specs.some((s) => s.toLowerCase().includes(q))) ||
        (prod.technicalSpecs?.chip && prod.technicalSpecs.chip.toLowerCase().includes(q));

      return matchBrand && matchCat && matchCond && matchQuery;
    });

    return list.sort((a, b) => {
      const priceA = a.priceNGN || Math.round((a.priceUSD || 0) * (rates.USD_NGN || 1485));
      const priceB = b.priceNGN || Math.round((b.priceUSD || 0) * (rates.USD_NGN || 1485));
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'stock') return (b.stockCount || 0) - (a.stockCount || 0);
      return 0; // featured default
    });
  }, [productsList, selectedBrand, selectedCategory, selectedCondition, searchQuery, sortBy, rates.USD_NGN]);

  // Cart summary
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalNGN = cart.reduce((sum, item) => {
    const base = item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485));
    const adj = item.priceAdjustmentNGN || 0;
    return sum + ((base + adj) * item.quantity);
  }, 0);

  const formatPrice = (prod: TechProduct, curr: 'NGN' | 'CNY' | 'USD') => {
    const baseNGN = prod.priceNGN || Math.round((prod.priceUSD || 0) * (rates.USD_NGN || 1485));
    if (curr === 'CNY') {
      const cny = prod.priceRMB || prod.priceCNY || Math.round((baseNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));
      return `¥${cny.toLocaleString()}`;
    }
    return `₦${baseNGN.toLocaleString()}`;
  };

  const getSecondaryPrice = (prod: TechProduct, curr: 'NGN' | 'CNY' | 'USD') => {
    const baseNGN = prod.priceNGN || Math.round((prod.priceUSD || 0) * (rates.USD_NGN || 1485));
    const cny = prod.priceRMB || prod.priceCNY || Math.round((baseNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));
    if (curr === 'NGN') {
      return `¥${cny.toLocaleString()} RMB`;
    }
    return `₦${baseNGN.toLocaleString()} NGN`;
  };

  const formatCartTotal = (curr: 'NGN' | 'CNY' | 'USD') => {
    if (curr === 'CNY') {
      const cny = Math.round((cartSubtotalNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));
      return `¥${cny.toLocaleString()}`;
    }
    return `₦${cartSubtotalNGN.toLocaleString()}`;
  };

  const handleAddToCartQuick = (e: React.MouseEvent, product: TechProduct) => {
    e.stopPropagation();
    const defaultColor = (product.colors && product.colors[0]) 
      ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].name)
      : 'Standard';
    const defaultStorage = product.storage || (product.storageOptions && product.storageOptions[0]) || '256GB';
    const defaultVariant = (product.variants && product.variants.length > 0)
      ? (product.variants.find(v => (v.stockCount ?? 0) > 0 && v.isActive !== false) || product.variants[0])
      : undefined;

    addToCart(product, defaultColor, defaultStorage, defaultVariant, 1);
  };

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      {/* Top Header Placeholder (Hoisted at shell level) */}
      <Header title="Apple & Tech Store • Hong Kong Hub" />

      <div className="p-4 space-y-4">
        {/* ======================================================== */}
        {/* 1. TOP MARKETPLACE SEARCH & CURRENCY TOOLBAR */}
        {/* ======================================================== */}
        <div className="space-y-2.5">
          <div className="flex gap-2 items-center">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Apple, Google Pixel, Samsung Galaxy..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Currency Selector Pill (Dual Currency: NGN ₦ and RMB ¥) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 shrink-0">
              {(['NGN', 'CNY'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setShopCurrency(curr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    shopCurrency === curr
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {curr === 'NGN' ? '🇳🇬 ₦ NGN' : '🇨🇳 ¥ RMB'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Navigation Strip (Wishlist, Compare, Orders, Cart) */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => navigate('shop-saved')}
              className="px-2 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all text-xs"
            >
              <Heart className={`w-3.5 h-3.5 ${savedProductIds.length > 0 ? 'text-rose-400 fill-rose-400' : 'text-slate-400'}`} />
              <span className="font-semibold text-slate-300 text-xs">Wishlist</span>
              {savedProductIds.length > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                  {savedProductIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('shop-compare')}
              className="px-2 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all text-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300 text-xs">Compare</span>
              {compareProductIds.length > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  {compareProductIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('shop-orders')}
              className="px-2 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all text-xs"
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-300 text-xs">Orders</span>
              <span className="min-w-4 h-4 px-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                {shopOrders.length}
              </span>
            </button>

            <button
              onClick={() => navigate('cart')}
              className="px-2 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all text-xs"
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${cartCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="font-semibold text-slate-300 text-xs">Cart</span>
              {cartCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PROMOTIONAL MARKETPLACE HERO BANNER CAROUSEL */}
        {/* ======================================================== */}
        <div 
          className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl h-[132px] sm:h-[155px] group cursor-pointer"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={() => setIsCarouselPaused(true)}
          onTouchEnd={() => setIsCarouselPaused(false)}
        >
          {marketBanners.map((banner, index) => {
            const Icon = banner.icon;
            const isActive = activeBannerIndex === index;

            return (
              <div 
                key={banner.id}
                onClick={() => {
                  if (banner.destinationRoute && banner.destinationRoute !== 'shop') {
                    navigate(banner.destinationRoute as any);
                  } else if (banner.productId) {
                    navigate('product-detail', banner.productId);
                  }
                }}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col justify-between p-4 select-none ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Full-Bleed High-Fidelity Banner Image */}
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onLoad={() => setBannerImagesLoaded(prev => ({ ...prev, [banner.id]: true }))}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 scale-100 group-hover:scale-105 ${
                    bannerImagesLoaded[banner.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Fallback Skeleton State */}
                {!bannerImagesLoaded[banner.id] && (
                  <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                  </div>
                )}

                {/* Luxury Obsidian Gradient Scrim Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-950/30 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />

                {/* Overlaid Content Top Row */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-sm backdrop-blur-md ${banner.badgeColor}`}>
                    <Icon className="w-3 h-3" />
                    <span>{banner.badge}</span>
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-200 font-semibold">Lagos MMIA Cargo</span>
                  </div>
                </div>

                {/* Overlaid Content Middle: Headline & Subtitle */}
                <div className="relative z-10 my-auto py-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight drop-shadow-md">
                    {banner.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-1 drop-shadow-sm font-medium">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Overlaid Content Bottom Row: Trust Badge & Dot Pagination */}
                <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 drop-shadow-sm">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Trade Protected Settlement</span>
                  </span>

                  {/* Carousel Indicator Dots */}
                  <div className="flex items-center gap-1.5">
                    {marketBanners.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBannerIndex(dotIdx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          dotIdx === activeBannerIndex 
                            ? 'w-5 bg-emerald-400 shadow-sm shadow-emerald-400/50' 
                            : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                        aria-label={`Go to banner slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 2.5 BRAND SELECTOR TABS (Apple, Google Pixel, Samsung) */}
        {/* ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shop by Brand
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              Hong Kong Direct Hub
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {brands.map((brand) => {
              const isSelected = selectedBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-extrabold shadow-emerald-500/20'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. MARKETPLACE CATEGORY NAVIGATION */}
        {/* ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Product Categories
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. MARKETPLACE FILTER & VIEW MODE STRIP */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          {/* Condition Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {conditions.map((cond) => (
              <button
                key={cond}
                onClick={() => setSelectedCondition(cond)}
                className={`px-2 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                  selectedCondition === cond
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>

          {/* Right: Sort & Grid/List View Toggle */}
          <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-800 pl-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2 py-1 text-[10px] font-semibold outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="stock">In Stock First</option>
            </select>

            {/* Layout Toggle (Grid vs List) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="2-Column Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Single Column List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. STANDARD 2-COLUMN MARKETPLACE PRODUCT GRID */}
        {/* ======================================================== */}
        {filteredProducts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <Package className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No products found</p>
            <p className="text-xs text-slate-500">Try adjusting your category, condition, or search query.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* STANDARD 2-COLUMN E-COMMERCE GRID */
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const isSaved = savedProductIds.includes(product.id);
              const isComparing = compareProductIds.includes(product.id);
              const variantsTotalStock = (product.variants && product.variants.length > 0)
                ? product.variants.reduce((sum, v) => sum + (v.stockCount ?? 0), 0)
                : 0;
              const stock = variantsTotalStock > 0 ? variantsTotalStock : (product.stockCount ?? 10);
              const condition = product.condition || 'Brand New';
              const inCartCount = cart
                .filter((item) => item.product.id === product.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={product.id}
                  onClick={() => navigate('product-detail', product.id)}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between group hover:shadow-emerald-500/5"
                >
                  {/* Top Image Section */}
                  <div className="relative w-full aspect-square bg-slate-950 overflow-hidden flex items-center justify-center p-2 border-b border-slate-800/80">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Condition Pill (Top Left) */}
                    <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md border backdrop-blur-md ${
                      condition === 'Brand New'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                        : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {condition}
                    </span>

                    {/* Stock Pill (Bottom Left) */}
                    <span className={`absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded-md backdrop-blur-md ${
                      stock > 5 
                        ? 'bg-slate-900/90 text-slate-300 border border-slate-700' 
                        : stock > 0 
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40' 
                        : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                    }`}>
                      {stock > 5 ? `${stock} left in stock` : stock > 0 ? `Only ${stock} left` : 'Out of Stock'}
                    </span>

                    {/* Action Buttons (Top Right): Wishlist & Compare */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveProduct(product.id);
                        }}
                        className={`p-1.5 rounded-xl border backdrop-blur-md transition-all ${
                          isSaved 
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Save to Wishlist"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareProduct(product.id);
                        }}
                        className={`p-1.5 rounded-xl border backdrop-blur-md transition-all ${
                          isComparing 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Compare Specs"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Content Section */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-medium mb-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{product.rating}</span>
                        <span className="text-slate-500">({product.reviewsCount})</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                        {product.title}
                      </h3>

                      {/* Brand & Storage Specifications Badge */}
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {product.brand || 'Apple'}
                        </span>
                        {(product.storage || product.storageOptions?.[0]) && (
                          <span className="text-xs font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {product.storage || product.storageOptions?.[0]}
                          </span>
                        )}
                      </div>

                      {/* Chip / Storage spec subtitle */}
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                        {product.technicalSpecs?.chip ? product.technicalSpecs.chip.split('(')[0] : product.subtitle}
                      </p>
                    </div>

                    {/* Price & Add to Cart Action */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-semibold text-white num-tabular">
                            {formatPrice(product, shopCurrency)}
                          </span>
                          <span className="text-xs text-emerald-400 font-semibold">{shopCurrency}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono num-tabular">
                          ≈ {getSecondaryPrice(product, shopCurrency)}
                        </p>
                      </div>

                      {inCartCount > 0 ? (
                        <div className="flex items-center gap-1 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('cart');
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>{inCartCount} in Cart</span>
                          </button>
                          <button
                            type="button"
                            disabled={stock <= inCartCount}
                            onClick={(e) => handleAddToCartQuick(e, product)}
                            className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center active:scale-95 transition-all shadow-md disabled:bg-slate-800 disabled:text-slate-500 shrink-0"
                            title="Add Another"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={stock <= 0}
                          onClick={(e) => handleAddToCartQuick(e, product)}
                          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md ${
                            stock > 0
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* SINGLE-COLUMN LIST VIEW ALTERNATIVE */
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => {
              const isSaved = savedProductIds.includes(product.id);
              const isComparing = compareProductIds.includes(product.id);
              const variantsTotalStock = (product.variants && product.variants.length > 0)
                ? product.variants.reduce((sum, v) => sum + (v.stockCount ?? 0), 0)
                : 0;
              const stock = variantsTotalStock > 0 ? variantsTotalStock : (product.stockCount ?? 10);
              const condition = product.condition || 'Brand New';
              const inCartCount = cart
                .filter((item) => item.product.id === product.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={product.id}
                  onClick={() => navigate('product-detail', product.id)}
                  className="p-3.5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl relative overflow-hidden group"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 flex items-center justify-center p-1">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 left-1 bg-slate-950/90 text-[8px] font-bold text-slate-300 px-1 rounded border border-slate-800">
                        {condition}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{product.rating}</span>
                            <span className="text-slate-500">({product.reviewsCount})</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveProduct(product.id);
                              }}
                              className={`p-1 rounded-lg border ${
                                isSaved ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${isSaved ? 'fill-rose-400' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompareProduct(product.id);
                              }}
                              className={`p-1 rounded-lg border ${
                                isComparing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                              }`}
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xs font-bold text-white truncate mt-1">{product.title}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap my-1">
                          <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {product.brand || 'Apple'}
                          </span>
                          {product.model && (
                            <span className="text-[9px] font-medium text-slate-400">
                              {product.model}
                            </span>
                          )}
                          {(product.storage || product.storageOptions?.[0]) && (
                            <span className="text-[9px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {product.storage || product.storageOptions?.[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{product.subtitle}</p>
                      </div>

                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-extrabold text-white num-tabular">
                              {formatPrice(product, shopCurrency)}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">{shopCurrency}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">
                            ≈ {getSecondaryPrice(product, shopCurrency)}
                          </span>
                        </div>

                        {inCartCount > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('cart');
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>{inCartCount} in Cart</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={stock <= 0}
                            onClick={(e) => handleAddToCartQuick(e, product)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-md flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. MARKETPLACE TRUST & AIR CARGO ASSURANCE */}
        {/* ======================================================== */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              FlyeMass Market Guarantees
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-slate-200 block">✈️ Express Air Freight</span>
              <span className="text-slate-400">Guangzhou / HK Hub to Lagos MM2 Hub in 2-4 Days.</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-slate-200 block">🔒 Trade Protection</span>
              <span className="text-slate-400">Funds settled securely upon arrival verification.</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. FLOATING ROUND VIEW CART BUTTON (NON-INTRUSIVE) */}
        {/* ======================================================== */}
        {cartCount > 0 && (
          <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-40 pointer-events-none flex justify-end">
            <button
              type="button"
              onClick={() => navigate('cart')}
              data-testid="floating-view-cart-round-btn"
              title={`View Cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'} • ${formatCartTotal(shopCurrency)})`}
              aria-label={`View Cart with ${cartCount} items`}
              className="pointer-events-auto group relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-2 border-slate-950 active:scale-90 transition-all cursor-pointer hover:shadow-emerald-500/60"
            >
              {/* Outer soft pulse ring */}
              <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping pointer-events-none opacity-75" />

              {/* Shopping Bag Icon */}
              <ShoppingBag className="w-6 h-6 text-slate-950 stroke-[2.3] group-hover:scale-110 transition-transform relative z-10" />

              {/* Cart Count Badge (Top-Right of Circle) */}
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-slate-950 text-emerald-400 font-black text-[11px] border-2 border-emerald-400 flex items-center justify-center shadow-lg num-tabular z-20">
                {cartCount}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
