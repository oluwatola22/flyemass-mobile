import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Check, 
  X, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const ShopCompareScreen: React.FC = () => {
  const { 
    compareProductIds, 
    toggleCompareProduct, 
    clearCompare, 
    addToCart, 
    navigate 
  } = useApp();

  const comparedProducts = TECH_PRODUCTS.filter((p) => compareProductIds.includes(p.id));
  const availableToAdd = TECH_PRODUCTS.filter((p) => !compareProductIds.includes(p.id));

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

          {comparedProducts.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Clear Comparison
            </button>
          )}
        </div>

        {comparedProducts.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[340px] space-y-3">
              {/* Product Header Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {comparedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between relative"
                  >
                    <button
                      onClick={() => toggleCompareProduct(product.id)}
                      className="absolute right-2 top-2 w-6 h-6 rounded-full bg-slate-800/80 text-slate-400 hover:text-rose-400 flex items-center justify-center"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-24 object-cover rounded-xl bg-slate-950 mb-2"
                      />
                      <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1 mt-1">
                        {product.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{product.subtitle}</p>

                      <div className="mt-2 font-mono">
                        <span className="text-sm font-extrabold text-emerald-400 block">
                          ${product.priceUSD.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ₦{product.priceNGN.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full mt-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add Cart</span>
                    </button>
                  </div>
                ))}

                {comparedProducts.length < 3 && availableToAdd.length > 0 && (
                  <div className="p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-center p-4">
                    <Plus className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Add 3rd Device</span>
                    <p className="text-[10px] text-slate-500 mt-1">Select from catalog below</p>
                  </div>
                )}
              </div>

              {/* Specs Comparison Table Card */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
                  Technical Specifications Matrix
                </span>

                {/* Storage & Variants */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Storage Options</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs font-mono text-slate-300">
                        {p.storageOptions.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Key Features */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Key Specs</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {comparedProducts.map((p) => (
                      <ul key={p.id} className="space-y-1 text-[11px] text-slate-400">
                        {p.specs.map((spec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                </div>

                {/* Stock & Origin */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Hong Kong Stock & MOQ</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {comparedProducts.map((p) => (
                      <div key={p.id} className="text-xs">
                        <span className="text-emerald-400 font-bold block">
                          {p.stockCount} units available
                        </span>
                        <span className="text-[10px] text-slate-500">Same-day dispatch</span>
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
              Select 2 or 3 gadgets to compare battery capacity, chipsets, display glass, and wholesale pricing.
            </p>
          </div>
        )}

        {/* Quick Add Section from Catalog */}
        {availableToAdd.length > 0 && (
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
                    <img src={p.image} alt={p.title} className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{p.title}</h5>
                      <span className="text-[10px] font-mono text-emerald-400">${p.priceUSD.toLocaleString()}</span>
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
