import React, { useState } from 'react';
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
  Minus
} from 'lucide-react';
import { TechProduct, ProductVariant } from '../../types';

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
    setShopCurrency
  } = useApp();

  const allProducts = db.getProducts();
  const product: TechProduct = 
    allProducts.find((p) => p.id === routeParam) || 
    TECH_PRODUCTS.find((p) => p.id === routeParam) || 
    TECH_PRODUCTS[0];

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  // Image Gallery
  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Variant selection
  const defaultVariant = product.variants?.[0];
  const [selectedColor, setSelectedColor] = useState<string>(
    defaultVariant?.color || product.colors?.[0]?.name || 'Standard'
  );
  const [selectedStorage, setSelectedStorage] = useState<string>(
    defaultVariant?.storage || product.storageOptions?.[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Find active variant matching color & storage
  const activeVariant: ProductVariant | undefined = product.variants?.find(
    (v) => v.color === selectedColor && v.storage === selectedStorage
  ) || defaultVariant;

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

  const variantStock = activeVariant?.stockCount ?? product.stockCount ?? 0;
  const isAvailable = (activeVariant ? activeVariant.isActive : product.inStock) && variantStock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, selectedColor, selectedStorage, activeVariant, quantity);
    navigate('cart');
  };

  const condition = product.condition || 'Brand New';
  const specs = product.technicalSpecs || {};

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Device Specifications" />

      <div className="p-4 space-y-4">
        {/* Product Image Gallery Viewer */}
        <div className="space-y-2">
          <div className="relative w-full h-64 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center p-4">
            <img
              src={images[selectedImageIndex] || product.image}
              alt={product.title}
              className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300"
            />
            {/* Tag badge */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-400">
              {product.tag || 'Official Apple'}
            </div>

            {/* Condition badge */}
            <div className="absolute bottom-3 left-3 bg-indigo-950/90 backdrop-blur-md border border-indigo-700/50 px-2.5 py-1 rounded-xl text-[10px] font-bold text-indigo-300">
              {condition}
            </div>

            {/* Top Right Quick Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
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

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border p-1 bg-slate-900 transition-all ${
                    selectedImageIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain" />
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
                  {shopCurrency === 'NGN' && `₦${finalUnitNGN.toLocaleString()}`}
                  {shopCurrency === 'USD' && `$${finalUnitUSD.toLocaleString()}`}
                  {shopCurrency === 'CNY' && `¥${finalUnitCNY.toLocaleString()}`}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">{shopCurrency} Unit Price</span>
              </div>

              {/* Currency Toggle */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-0.5">
                {(['NGN', 'USD', 'CNY'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setShopCurrency(c)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                      shopCurrency === c ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>₦{finalUnitNGN.toLocaleString()} NGN</span>
              <span>•</span>
              <span>${finalUnitUSD.toLocaleString()} USD</span>
              <span>•</span>
              <span>¥{finalUnitCNY.toLocaleString()} CNY</span>
            </div>
          </div>
        </div>

        {/* Color / Finish Chips */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Colour / Finish: <strong className="text-white">{selectedColor}</strong>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {product.colors.map((color) => {
              const isSelected = selectedColor === color.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
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
            {product.storageOptions.map((opt) => {
              const isSelected = selectedStorage === opt;
              // Check variant adjustment for this storage
              const optVariant = product.variants?.find(
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
        <div className="pt-2">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
              isAvailable
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isAvailable 
                ? `Add ${quantity} to Cart (${shopCurrency === 'NGN' ? `₦${totalNGN.toLocaleString()}` : shopCurrency === 'USD' ? `$${totalUSD.toLocaleString()}` : `¥${totalCNY.toLocaleString()}`})`
                : 'Selected Configuration Out of Stock'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
