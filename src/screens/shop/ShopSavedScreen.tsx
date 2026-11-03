import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  ArrowLeftRight, 
  ChevronRight, 
  Star, 
  ShieldCheck,
  Check,
  Package
} from 'lucide-react';
import { TechProduct } from '../../types';

export const ShopSavedScreen: React.FC = () => {
  const { 
    savedProductIds, 
    toggleSaveProduct, 
    addToCart, 
    toggleCompareProduct, 
    compareProductIds,
    navigate,
    showToast,
    shopCurrency,
    setShopCurrency
  } = useApp();

  const allProducts = db.getProducts().length > 0 ? db.getProducts() : TECH_PRODUCTS;
  const savedProducts = allProducts.filter((p) => savedProductIds.includes(p.id));

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
      <Header title="Saved Apple Devices & Wishlist" />

      <div className="p-4 space-y-4">
        {/* Sub-navigation bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span className="text-xs font-bold text-white">
              Wishlist Items ({savedProducts.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
              {(['NGN', 'USD', 'CNY'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setShopCurrency(c)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    shopCurrency === c ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('shop-compare')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare ({compareProductIds.length})</span>
            </button>
          </div>
        </div>

        {savedProducts.length > 0 ? (
          <div className="space-y-3">
            {savedProducts.map((product) => {
              const isComparing = compareProductIds.includes(product.id);
              const condition = product.condition || 'Brand New';
              const stock = product.stockCount ?? 0;

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3 relative group shadow-xl"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-2xl bg-slate-950 shrink-0 p-1 flex items-center justify-center border border-slate-800 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {product.category}
                          </span>
                          <span className="text-[10px] font-medium text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/30">
                            {condition}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSaveProduct(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
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

                      {/* Prices in active currency */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-sm font-extrabold font-mono text-emerald-400">
                          {formatPrice(product)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({stock > 0 ? `${stock} in stock` : 'Out of Stock'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={stock <= 0}
                      onClick={() => addToCart(product)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                        stock > 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{stock > 0 ? 'Move to Cart' : 'Sold Out'}</span>
                    </button>

                    <button
                      type="button"
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
              className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              Browse Apple Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
