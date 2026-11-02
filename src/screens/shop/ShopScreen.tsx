import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { TECH_PRODUCTS } from '../../data/mockData';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { TechProduct } from '../../types';

export const ShopScreen: React.FC = () => {
  const { navigate, addToCart, cart, savedProductIds, compareProductIds, shopOrders } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'iPhone' | 'Mac' | 'iPad' | 'Watch' | 'Audio'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'iPhone', 'Mac', 'iPad', 'Watch', 'Audio'] as const;

  const filteredProducts = TECH_PRODUCTS.filter((prod) => {
    const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesQuery = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         prod.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Hong Kong Tech Hub" />

      <div className="p-4 space-y-4">
        {/* Navigation Quick Shortcuts Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('shop-saved')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-300">Wishlist</span>
              {savedProductIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[9px] flex items-center justify-center">
                  {savedProductIds.length}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-500">Saved Gadgets</span>
          </button>

          <button
            onClick={() => navigate('shop-compare')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-300">Compare</span>
              {compareProductIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px] flex items-center justify-center">
                  {compareProductIds.length}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-500">Specs Matrix</span>
          </button>

          <button
            onClick={() => navigate('shop-orders')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-300">Orders</span>
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[9px] flex items-center justify-center">
                {shopOrders.length}
              </span>
            </div>
            <span className="text-[9px] text-slate-500">Live Shipments</span>
          </button>
        </div>
        {/* Cart quick bar */}
        {cartCount > 0 && (
          <div 
            onClick={() => navigate('cart')}
            className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cargo cart</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Search & Wholesale guarantee banner */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search iPhone 16 Pro, M4 Mac, Watch..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Wholesale Apple Guarantee Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-[11px]">Factory Sealed HK Specification</p>
              <p className="text-[10px] text-slate-400">Direct wholesale stock for Computer Village & Ikeja retailers</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
            Escrow Guard
          </span>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate('product-detail', product.id)}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl relative overflow-hidden group"
            >
              <div className="flex gap-4">
                {/* Product Thumbnail */}
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/90 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-800">
                    {product.stockCount} in stock
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mb-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount} wholesale reviews)</span>
                    </div>

                    <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {product.subtitle}
                    </p>
                  </div>

                  {/* Multi-Currency Price Conversion Pills */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-white num-tabular">
                        ₦{product.priceNGN.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">NGN</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 num-tabular">
                        ${product.priceUSD.toLocaleString()} USD
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-300 num-tabular">
                        ¥{product.priceCNY.toLocaleString()} CNY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Specs & Action */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="truncate max-w-[180px]">{product.specs.slice(0, 2).join(' • ')}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
