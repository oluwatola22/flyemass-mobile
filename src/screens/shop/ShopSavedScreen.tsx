import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  ArrowLeftRight, 
  ChevronRight, 
  Star, 
  ShieldCheck,
  Check
} from 'lucide-react';

export const ShopSavedScreen: React.FC = () => {
  const { 
    savedProductIds, 
    toggleSaveProduct, 
    addToCart, 
    toggleCompareProduct, 
    compareProductIds,
    navigate,
    showToast 
  } = useApp();

  const savedProducts = TECH_PRODUCTS.filter((p) => savedProductIds.includes(p.id));

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Saved Gadgets & Wishlist" />

      <div className="p-4 space-y-4">
        {/* Sub-navigation bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span className="text-xs font-bold text-white">
              Wishlist Items ({savedProducts.length})
            </span>
          </div>

          <button
            onClick={() => navigate('shop-compare')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Compare Specs ({compareProductIds.length})</span>
          </button>
        </div>

        {savedProducts.length > 0 ? (
          <div className="space-y-3">
            {savedProducts.map((product) => {
              const isComparing = compareProductIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3 relative group"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-20 h-20 rounded-2xl object-cover bg-slate-950 shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>

                        <button
                          onClick={() => toggleSaveProduct(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 
                        onClick={() => navigate('product-detail', product.id)}
                        className="text-xs font-extrabold text-white mt-1 cursor-pointer hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {product.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.subtitle}</p>

                      {/* Prices in USD and NGN */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-sm font-extrabold font-mono text-emerald-400">
                          ${product.priceUSD.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ₦{product.priceNGN.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ¥{product.priceCNY.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cargo Cart</span>
                    </button>

                    <button
                      onClick={() => toggleCompareProduct(product.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                        isComparing
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Compare specs"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{isComparing ? 'Comparing' : 'Compare'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Heart className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Save Hong Kong Apple tech hardware, MacBooks, and AirPods to track daily wholesale price fluctuations.
            </p>
            <button
              onClick={() => navigate('shop')}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs active:scale-95 transition-all"
            >
              Browse Tech Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
