import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Check, 
  X, 
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  Camera,
  Monitor,
  BatteryCharging,
  Fingerprint,
  Droplets,
  Award
} from 'lucide-react';
import { TechProduct } from '../../types';

export const ShopCompareScreen: React.FC = () => {
  const { 
    compareProductIds, 
    toggleCompareProduct, 
    clearCompare, 
    addToCart, 
    navigate,
    shopCurrency,
    setShopCurrency
  } = useApp();

  const allProducts = db.getProducts().length > 0 ? db.getProducts() : TECH_PRODUCTS;
  const comparedProducts = allProducts.filter((p) => compareProductIds.includes(p.id));
  const availableToAdd = allProducts.filter((p) => !compareProductIds.includes(p.id));

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  const formatPrice = (prod: TechProduct) => {
    const baseNGN = prod.priceNGN || Math.round((prod.priceUSD || 0) * (rates.USD_NGN || 1485));
    if (shopCurrency === 'NGN') return `₦${baseNGN.toLocaleString()}`;
    if (shopCurrency === 'USD') {
      const usd = prod.priceUSD || Math.round(baseNGN / (rates.USD_NGN || 1485));
      return `$${usd.toLocaleString()}`;
    }
    const cny = prod.priceCNY || Math.round((baseNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));
    return `¥${cny.toLocaleString()}`;
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Side-by-Side Spec Comparison" />

      <div className="p-4 space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              Comparing ({comparedProducts.length} of 3 max)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency toggle (Dual Currency: NGN ₦ and RMB ¥) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
              {(['NGN', 'CNY'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setShopCurrency(c)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    shopCurrency === c ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {c === 'NGN' ? '₦ NGN' : '¥ RMB'}
                </button>
              ))}
            </div>

            {comparedProducts.length > 0 && (
              <button
                onClick={clearCompare}
                className="text-xs text-rose-400 hover:underline font-semibold"
              >
                Clear Matrix
              </button>
            )}
          </div>
        </div>

        {comparedProducts.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[340px] space-y-3">
              {/* Product Header Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {comparedProducts.map((product) => {
                  const condition = product.condition || 'Brand New';
                  const stock = product.stockCount ?? 0;

                  return (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between relative shadow-lg"
                    >
                      <button
                        onClick={() => toggleCompareProduct(product.id)}
                        className="absolute right-2 top-2 w-6 h-6 rounded-full bg-slate-800/80 text-slate-400 hover:text-rose-400 flex items-center justify-center z-10"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="w-full h-24 rounded-xl bg-slate-950 overflow-hidden mb-2 p-1 flex items-center justify-center">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {product.category}
                          </span>
                          <span className="text-[9px] font-medium text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/30">
                            {condition}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 mt-1">
                          {product.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{product.subtitle}</p>

                        <div className="mt-2 font-mono">
                          <span className="text-sm font-extrabold text-emerald-400 block">
                            {formatPrice(product)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={stock <= 0}
                        onClick={() => {
                          const col = (product.colors && product.colors[0]) ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].name) : 'Standard';
                          const stor = product.storage || (product.storageOptions && product.storageOptions[0]) || '256GB';
                          addToCart(product, col, stor);
                        }}
                        className={`w-full mt-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md ${
                          stock > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                        }`}
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{stock > 0 ? 'Add Cart' : 'Sold Out'}</span>
                      </button>
                    </div>
                  );
                })}

                {comparedProducts.length < 3 && availableToAdd.length > 0 && (
                  <div className="p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-center p-4">
                    <Plus className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Add Slot</span>
                    <p className="text-[10px] text-slate-500 mt-1">Select from catalog below</p>
                  </div>
                )}
              </div>

              {/* Specs Comparison Table Card */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
                  Technical Specifications Matrix
                </span>

                {/* Processor / Chip */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-indigo-400" />
                    <span>Processor / Chip</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-semibold text-white">
                        {p.technicalSpecs?.chip || p.specs[0] || 'Apple Silicon'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* RAM & Memory */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>RAM / Memory</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-semibold text-slate-300">
                        {p.technicalSpecs?.ram || 'Unified Architecture'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Display */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-cyan-400" />
                    <span>Display</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-semibold text-slate-300">
                        {p.technicalSpecs?.display || 'Retina OLED Display'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Camera System */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Camera System</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-semibold text-slate-300">
                        {p.technicalSpecs?.camera || 'Pro Camera Array'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Battery Health */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    <span>Battery Health</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-bold text-emerald-400">
                        {p.technicalSpecs?.batteryHealth || '100% (Brand New)'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biometrics */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 text-purple-400" />
                    <span>Biometrics</span>
                  </span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-semibold text-slate-300">
                        {p.technicalSpecs?.biometrics || 'Secure Enclave'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Options */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Storage Options</span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-mono text-slate-300">
                        {p.storageOptions.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock & Origin */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Live Inventory</span>
                  <div className={`grid grid-cols-${comparedProducts.length} gap-2`}>
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs">
                        <span className="text-emerald-400 font-bold block">
                          {p.stockCount} units in stock
                        </span>
                        <span className="text-[10px] text-slate-500">HK Direct Cargo</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <ArrowLeftRight className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Products Selected to Compare</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Select 2 or 3 gadgets to compare chipsets, memory, camera systems, and wholesale pricing side-by-side.
            </p>
          </div>
        )}

        {/* Quick Add Section from Catalog */}
        {availableToAdd.length > 0 && comparedProducts.length < 3 && (
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
              Add More Devices to Compare
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableToAdd.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => toggleCompareProduct(p.id)}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={p.image} alt={p.title} className="w-10 h-10 rounded-xl object-contain bg-slate-950 shrink-0 p-1" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{p.title}</h5>
                      <span className="text-[10px] font-mono text-emerald-400">{formatPrice(p)}</span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
