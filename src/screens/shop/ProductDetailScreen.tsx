import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  Star, 
  ShieldCheck, 
  Plane, 
  ShoppingBag, 
  Check, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Heart,
  ArrowLeftRight,
  Cpu,
  Layers,
  Camera,
  Monitor,
  BatteryCharging,
  Fingerprint,
  Droplets,
  Award,
  AlertTriangle,
  Plus,
  Minus,
  CreditCard,
  X,
  Wallet,
  PackageCheck
} from 'lucide-react';
import { TechProduct, ProductVariant, Currency } from '../../types';
import { PinPad } from '../../components/ui/PinPad';

export const ProductDetailScreen: React.FC = () => {
  const { 
    routeParam, 
    addToCart, 
    navigate, 
    goBack, 
    savedProductIds, 
    toggleSaveProduct, 
    compareProductIds, 
    toggleCompareProduct,
    shopCurrency,
    setShopCurrency,
    showToast,
    wallets,
    placeShopOrder,
    userProfile
  } = useApp();

  const allProducts = db.getProducts();
  const product: TechProduct = 
    allProducts.find((p) => p.id === routeParam) || 
    TECH_PRODUCTS.find((p) => p.id === routeParam) || 
    TECH_PRODUCTS[0];

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, [routeParam]);

  // Image Gallery
  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 35;
    const isRightSwipe = distance < -35;

    if (isLeftSwipe && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex((prev) => prev + 1);
    } else if (isRightSwipe && selectedImageIndex > 0) {
      setSelectedImageIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Variant & Option selection
  const variantsList = Array.isArray(product.variants) ? product.variants : [];
  const inStockVariant = variantsList.find(v => (v.stockCount ?? 0) > 0 && v.isActive !== false);
  const defaultVariant = inStockVariant || variantsList[0];

  const colorsList = (Array.isArray(product.colors) && product.colors.length > 0)
    ? product.colors
    : [{ name: defaultVariant?.color || 'Standard', hex: defaultVariant?.colorHex || '#1E1E22' }];

  const storageList = (Array.isArray(product.storageOptions) && product.storageOptions.length > 0)
    ? product.storageOptions
    : (variantsList.length > 0 ? Array.from(new Set(variantsList.map(v => v.storage))) : ['Standard']);

  const [selectedColor, setSelectedColor] = useState<string>(
    defaultVariant?.color || (typeof colorsList[0] === 'string' ? colorsList[0] : colorsList[0]?.name) || 'Standard'
  );
  const [selectedStorage, setSelectedStorage] = useState<string>(
    defaultVariant?.storage || storageList[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Find active variant matching color & storage
  let activeVariant: ProductVariant | undefined = variantsList.find(
    (v) => v.color === selectedColor && v.storage === selectedStorage
  );
  if (!activeVariant && variantsList.length > 0) {
    activeVariant = variantsList.find((v) => v.color === selectedColor) ||
      variantsList.find((v) => v.storage === selectedStorage) ||
      defaultVariant;
  }

  const priceAdjustmentNGN = activeVariant?.priceAdjustmentNGN || 0;
  const baseNGN = product.priceNGN || Math.round((product.priceUSD || 0) * (rates.USD_NGN || 1485));
  const finalUnitNGN = baseNGN + priceAdjustmentNGN;

  // Currency conversions
  const finalUnitUSD = Math.round(finalUnitNGN / (rates.USD_NGN || 1485));
  const finalUnitCNY = Math.round((finalUnitNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));

  const totalNGN = finalUnitNGN * quantity;
  const totalUSD = finalUnitUSD * quantity;
  const totalCNY = finalUnitCNY * quantity;

  const isSaved = savedProductIds.includes(product.id);
  const isComparing = compareProductIds.includes(product.id);

  const variantStock = activeVariant?.stockCount ?? product.stockCount ?? 10;
  const isAvailable = (activeVariant ? activeVariant.isActive !== false : product.inStock !== false) && variantStock > 0;

  // Instant Wallet Checkout State
  const [showInstantBuyModal, setShowInstantBuyModal] = useState(false);
  const [buyWallet, setBuyWallet] = useState<Currency>(shopCurrency);
  const [instantOrderData, setInstantOrderData] = useState<{
    orderNumber: string;
    trackingNumber: string;
    totalAmount: number;
    currency: Currency;
  } | null>(null);

  const selectedWalletObj = wallets.find((w) => w.currency === buyWallet);
  const requiredAmount = buyWallet === 'CNY' ? totalCNY : totalNGN;
  const hasSufficientFunds = (selectedWalletObj?.balance ?? 0) >= requiredAmount;

  const handleAddToCart = () => {
    if (!isAvailable) {
      showToast('Selected configuration is currently out of stock. Please select another variant.', 'info');
      return;
    }
    addToCart(product, selectedColor, selectedStorage, activeVariant, quantity);
    navigate('cart');
  };

  const handleBuyNow = () => {
    if (!isAvailable) {
      showToast('Selected configuration is currently out of stock. Please select another variant.', 'info');
      return;
    }
    setShowInstantBuyModal(true);
  };

  const handleAuthorizeInstantBuy = (pin?: string) => {
    addToCart(product, selectedColor, selectedStorage, activeVariant, quantity);
    const dest = (userProfile as any)?.address || 'Plot 14, Commercial Avenue, Ikeja Computer Village, Lagos, Nigeria';
    const success = placeShopOrder(buyWallet, `${dest} (${userProfile?.name || 'Chief Babatunde Alade'}, ${userProfile?.phone || '+234 803 555 9201'})`, pin);
    if (success) {
      const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const trackingNumber = `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`;
      setInstantOrderData({
        orderNumber,
        trackingNumber,
        totalAmount: requiredAmount,
        currency: buyWallet
      });
      setShowInstantBuyModal(false);
      showToast('Order confirmed! Funds debited from your wallet.', 'success');
    }
  };

  const condition = product.condition || 'Brand New';
  const specs = product.technicalSpecs || {};

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Device Specifications" />

      <div className="p-4 space-y-4">
        {/* Product Image Gallery Viewer & Swipeable Slider */}
        <div className="space-y-2">
          <div 
            className="relative w-full h-72 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center p-4 select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[selectedImageIndex] || product.image}
              alt={`${product.title} - Angle ${selectedImageIndex + 1}`}
              className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300 pointer-events-none"
            />

            {/* Left & Right Chevron Slider Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all backdrop-blur-md z-10 shadow-lg"
                  title="Previous Angle"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all backdrop-blur-md z-10 shadow-lg"
                  title="Next Angle"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* Top Center Image Counter Pill */}
            {images.length > 1 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-300 shadow-md">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Tag badge */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-400">
              {product.brand || product.tag || 'Official Hardware'}
            </div>

            {/* Condition badge */}
            <div className="absolute bottom-3 left-3 bg-indigo-950/90 backdrop-blur-md border border-indigo-700/50 px-2.5 py-1 rounded-xl text-[10px] font-bold text-indigo-300">
              {condition}
            </div>

            {/* Bottom Slider Indicator Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-800/60">
                {images.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setSelectedImageIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === selectedImageIndex ? 'w-4 bg-emerald-400' : 'w-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Top Right Quick Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => toggleSaveProduct(product.id)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isSaved
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleCompareProduct(product.id)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isComparing
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Compare Specs"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Swipeable Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-2xl overflow-hidden border p-1 bg-slate-900 transition-all shrink-0 ${
                    selectedImageIndex === idx 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-md' 
                      : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 bg-slate-950/80 px-1 rounded">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title & Multi-Currency Price Box */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{product.category} Series</span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-500 font-normal">({product.reviewsCount} wholesale reviews)</span>
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-white leading-snug">{product.title}</h2>
          <p className="text-xs text-slate-400">{product.subtitle}</p>

          {/* Pricing Row */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-extrabold text-white num-tabular">
                  {shopCurrency === 'CNY' ? `¥${finalUnitCNY.toLocaleString()}` : `₦${finalUnitNGN.toLocaleString()}`}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">{shopCurrency} Unit Price</span>
              </div>

              {/* Currency Toggle (Dual Currency: NGN ₦ and RMB ¥) */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-0.5">
                {(['NGN', 'CNY'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setShopCurrency(c)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${
                      shopCurrency === c ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {c === 'NGN' ? '₦ NGN' : '¥ RMB'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>₦{finalUnitNGN.toLocaleString()} NGN</span>
              <span>•</span>
              <span>¥{finalUnitCNY.toLocaleString()} RMB</span>
            </div>
          </div>
        </div>

        {/* Color / Finish Chips */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Colour / Finish: <strong className="text-white">{selectedColor}</strong>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {colorsList.map((color) => {
              const colorName = typeof color === 'string' ? color : color.name;
              const colorHex = typeof color === 'string' ? '#1E1E22' : color.hex;
              const isSelected = selectedColor === colorName;
              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setSelectedColor(colorName)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span>{colorName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage / Configuration Selector with Price Adjustments */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Storage Capacity
            </span>
            <span className="text-[10px] text-slate-400">
              Base: ₦{baseNGN.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {storageList.map((opt) => {
              const isSelected = selectedStorage === opt;
              // Check variant adjustment for this storage
              const optVariant = variantsList.find(
                (v) => v.storage === opt && (v.color === selectedColor || true)
              );
              const adj = optVariant?.priceAdjustmentNGN || 0;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedStorage(opt)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{opt}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {adj === 0 ? 'Included' : `+₦${adj.toLocaleString()}`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Variant Stock Status & Quantity Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Inventory Status
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAvailable ? (variantStock > 5 ? `In Stock (${variantStock} units)` : `Only ${variantStock} remaining`) : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-1.5">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-white w-6 text-center num-tabular">{quantity}</span>
            <button
              type="button"
              disabled={!isAvailable || quantity >= variantStock}
              onClick={() => setQuantity(q => Math.min(variantStock, q + 1))}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Full Technical Specifications Matrix */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Authoritative Tech Specifications</h3>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {specs.chip && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chip / Processor</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.chip}</span>
              </div>
            )}

            {specs.ram && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Unified RAM</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.ram}</span>
              </div>
            )}

            {specs.display && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Display</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.display}</span>
              </div>
            )}

            {specs.camera && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Camera System</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.camera}</span>
              </div>
            )}

            {specs.batteryHealth && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Battery Health</span>
                </span>
                <span className="font-semibold text-emerald-400 text-right">{specs.batteryHealth}</span>
              </div>
            )}

            {specs.biometrics && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
                  <span>Biometrics</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.biometrics}</span>
              </div>
            )}

            {specs.waterResistance && (
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Water Resistance</span>
                </span>
                <span className="font-semibold text-white text-right">{specs.waterResistance}</span>
              </div>
            )}

            <div className="py-2.5 flex items-start justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Warranty</span>
              </span>
              <span className="font-semibold text-white text-right">
                {product.warrantyInfo || specs.warranty || '1-Year Apple Warranty + FlyeMass Escrow'}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Guarantee */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Plane className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Express Air Cargo Direct to Lagos</p>
              <p className="text-[11px] text-slate-400">
                {product.deliveryInfo || 'HK Flight ETA: 2-4 business days directly to Ikeja Hub or Doorstep Delivery.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className={`flex-1 py-4 rounded-2xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isAvailable
                ? 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleBuyNow}
            className={`flex-1 py-4 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isAvailable
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isAvailable
                ? `Buy Now via Wallet (${shopCurrency === 'NGN' ? `₦${totalNGN.toLocaleString()}` : shopCurrency === 'USD' ? `$${totalUSD.toLocaleString()}` : `¥${totalCNY.toLocaleString()}`})`
                : 'Out of Stock'}
            </span>
          </button>
        </div>
      </div>

      {/* Instant Wallet Checkout Modal (Shows from the Top) */}
      {showInstantBuyModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-top-4 duration-200 mt-2">
            <button
              onClick={() => setShowInstantBuyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                Direct Apple Store Checkout
              </span>
              <h3 className="text-base font-extrabold text-white">Buy Now via Wallet</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant debit with zero gateway fees and automatic order generation.
              </p>
            </div>

            {/* Product Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex gap-3 items-center">
                <img
                  src={images[0] || product.image}
                  alt={product.title}
                  className="w-12 h-12 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {selectedColor} • {selectedStorage} • Qty: {quantity}
                  </p>
                  <span className="text-[9px] font-bold text-emerald-400">
                    ✓ {variantStock} units available in stock
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Selection (Dual Currency: NGN ₦ and RMB ¥) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                Select Wallet Currency:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['NGN', 'CNY'] as const).map((curr) => {
                  const wal = wallets.find(w => w.currency === curr);
                  const bal = wal?.balance ?? 0;
                  const req = curr === 'CNY' ? totalCNY : totalNGN;
                  const isSufficient = bal >= req;

                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setBuyWallet(curr)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        buyWallet === curr
                          ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold block">{curr === 'NGN' ? '🇳🇬 Naira Wallet' : '🇨🇳 RMB Wallet'}</span>
                      <span className="text-xs font-mono font-bold block text-white mt-0.5">
                        {curr === 'CNY' ? `¥${req.toLocaleString()}` : `₦${req.toLocaleString()}`}
                      </span>
                      <span className={`text-[9px] block font-mono mt-0.5 ${isSufficient ? 'text-slate-400' : 'text-rose-400'}`}>
                        Bal: {curr === 'CNY' ? '¥' : '₦'}{bal.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Insufficient balance warning */}
            {!hasSufficientFunds && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block">Insufficient {buyWallet} Balance</span>
                  <span className="text-[10px] text-rose-400">
                    Need {buyWallet === 'NGN' ? `₦${requiredAmount.toLocaleString()}` : buyWallet === 'USD' ? `$${requiredAmount.toLocaleString()}` : `¥${requiredAmount.toLocaleString()}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInstantBuyModal(false);
                    navigate('fund');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-bold text-[10px]"
                >
                  Fund Wallet
                </button>
              </div>
            )}

            {/* PIN Pad Authorization */}
            {hasSufficientFunds && (
              <PinPad
                title="Authorize Wallet Debit"
                subtitle={`Authorize ${buyWallet === 'NGN' ? `₦${requiredAmount.toLocaleString()}` : buyWallet === 'USD' ? `$${requiredAmount.toLocaleString()}` : `¥${requiredAmount.toLocaleString()}`} from your ${buyWallet} wallet`}
                onComplete={handleAuthorizeInstantBuy}
                onCancel={() => setShowInstantBuyModal(false)}
              />
            )}

            <button
              type="button"
              onClick={() => {
                addToCart(product, selectedColor, selectedStorage, activeVariant, quantity);
                setShowInstantBuyModal(false);
                navigate('checkout');
              }}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors pt-1"
            >
              Or proceed via standard checkout flow
            </button>
          </div>
        </div>
      )}

      {/* Confirmed Order Receipt Modal */}
      {instantOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Payment Authorized
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">Order Successfully Placed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your device has been allocated from Hong Kong sealed stock.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Number:</span>
                <span className="font-mono font-bold text-white">{instantOrderData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Air Waybill Tracking:</span>
                <span className="font-mono font-bold text-emerald-400">{instantOrderData.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-mono font-bold text-white">
                  {instantOrderData.currency === 'NGN' ? `₦${instantOrderData.totalAmount.toLocaleString()}` : instantOrderData.currency === 'USD' ? `$${instantOrderData.totalAmount.toLocaleString()}` : `¥${instantOrderData.totalAmount.toLocaleString()}`} {instantOrderData.currency}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInstantOrderData(null);
                  navigate('shop-orders');
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Track Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstantOrderData(null);
                  navigate('shop');
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
