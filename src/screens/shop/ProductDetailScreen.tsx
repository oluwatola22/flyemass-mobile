import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  Star, 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  Check, 
  CheckCircle2, 
  Sparkles,
  Plane,
  ChevronRight,
  Heart,
  ArrowLeftRight
} from 'lucide-react';

export const ProductDetailScreen: React.FC = () => {
  const { 
    routeParam, 
    addToCart, 
    navigate, 
    goBack, 
    savedProductIds, 
    toggleSaveProduct, 
    compareProductIds, 
    toggleCompareProduct 
  } = useApp();
  
  const product = TECH_PRODUCTS.find((p) => p.id === routeParam) || TECH_PRODUCTS[0];

  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0] || '');
  const [wholesaleTier, setWholesaleTier] = useState<number>(1);

  const isSaved = savedProductIds.includes(product.id);
  const isComparing = compareProductIds.includes(product.id);

  const getTierDiscountMultiplier = (tier: number) => {
    if (tier >= 20) return 0.92; // 8% off for bulk 20+
    if (tier >= 5) return 0.96; // 4% off for 5-19
    return 1.0;
  };

  const discount = getTierDiscountMultiplier(wholesaleTier);
  const finalPriceNGN = Math.round(product.priceNGN * discount * wholesaleTier);
  const finalPriceUSD = Math.round(product.priceUSD * discount * wholesaleTier);
  const finalPriceCNY = Math.round(product.priceCNY * discount * wholesaleTier);

  const handleAddToCart = () => {
    for (let i = 0; i < wholesaleTier; i++) {
      addToCart(product, selectedColor, selectedStorage);
    }
    navigate('cart');
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Product Specifications" />

      <div className="p-4 space-y-4">
        {/* Product Image Stage */}
        <div className="relative w-full h-64 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center p-4">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-400">
            {product.tag}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
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
          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>HK Dual SIM Spec</span>
          </div>
        </div>

        {/* Title & Multi-Currency Price Box */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">{product.category} Series</span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-500 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-white leading-snug">{product.title}</h2>
          <p className="text-xs text-slate-400">{product.subtitle}</p>

          {/* Pricing Row */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white num-tabular">
                ₦{finalPriceNGN.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">NGN Total</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 num-tabular">
                ${finalPriceUSD.toLocaleString()} USD
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 num-tabular">
                ¥{finalPriceCNY.toLocaleString()} CNY
              </span>
            </div>
          </div>
        </div>

        {/* Wholesale Volume Tier Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Wholesale Quantity Tiers
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 5, 20].map((units) => {
              const isSelected = wholesaleTier === units;
              return (
                <button
                  key={units}
                  type="button"
                  onClick={() => setWholesaleTier(units)}
                  className={`p-2.5 rounded-2xl border text-xs text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="font-extrabold">{units} {units === 1 ? 'Unit' : 'Units'}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {units === 1 ? 'Sample Order' : units === 5 ? '4% Bulk Off' : '8% VIP Deal'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Options */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Finish / Color: <strong className="text-white">{selectedColor}</strong>
          </span>
          <div className="flex items-center gap-3">
            {product.colors.map((color) => {
              const isSelected = selectedColor === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-700"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Storage Specification
          </span>
          <div className="flex items-center gap-2">
            {product.storageOptions.map((opt) => {
              const isSelected = selectedStorage === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setSelectedStorage(opt)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shipping & Delivery Guarantee */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Plane className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Express Air Cargo Direct to Lagos</p>
              <p className="text-[11px] text-slate-400">
                Departing Guangzhou Baiyun Hub via Ethiopian / Qatar Cargo. Estimated landed arrival in Ikeja: 3 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="pt-2">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add {wholesaleTier} to Cart (₦{finalPriceNGN.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
