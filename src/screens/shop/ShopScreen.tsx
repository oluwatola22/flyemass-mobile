import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { TechProduct } from '../../types';

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
    setShopCurrency
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState<TechProduct[]>(() => {
    const list = db.getProducts();
    return list.length > 0 ? list : TECH_PRODUCTS;
  });

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  useEffect(() => {
    return db.subscribe(() => {
      const current = db.getProducts();
      if (current.length > 0) setProductsList(current);
    });
  }, []);

  const categories = [
    'All Products',
    'iPhone',
    'iPad',
    'MacBook',
    'AirPods',
    'Apple Watch',
    'Accessories'
  ] as const;

  const conditions = ['All', 'Brand New', 'Refurbished', 'Fair / Pre-owned'] as const;

  const matchesCategory = (prod: TechProduct, cat: string) => {
    if (cat === 'All Products') return true;
    if (cat === 'MacBook') return prod.category === 'MacBook' || prod.category === 'Mac';
    if (cat === 'Apple Watch') return prod.category === 'Apple Watch' || prod.category === 'Watch';
    if (cat === 'AirPods') return prod.category === 'AirPods' || prod.category === 'Audio';
    return prod.category === cat;
  };

  const filteredProducts = productsList.filter((prod) => {
    const matchCat = matchesCategory(prod, selectedCategory);
    const prodCond = prod.condition || 'Brand New';
    const matchCond = selectedCondition === 'All' || prodCond === selectedCondition;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      prod.title.toLowerCase().includes(q) || 
      prod.subtitle.toLowerCase().includes(q) ||
      (prod.specs && prod.specs.some(s => s.toLowerCase().includes(q))) ||
      (prod.technicalSpecs?.chip && prod.technicalSpecs.chip.toLowerCase().includes(q));
    return matchCat && matchCond && matchQuery;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalNGN = cart.reduce((sum, item) => {
    const base = item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485));
    const adj = item.priceAdjustmentNGN || 0;
    return sum + ((base + adj) * item.quantity);
  }, 0);

  const formatPrice = (prod: TechProduct, curr: 'NGN' | 'CNY' | 'USD') => {
    const baseNGN = prod.priceNGN || Math.round((prod.priceUSD || 0) * (rates.USD_NGN || 1485));
    if (curr === 'NGN') return `₦${baseNGN.toLocaleString()}`;
    if (curr === 'USD') {
      const usd = prod.priceUSD || Math.round(baseNGN / (rates.USD_NGN || 1485));
      return `$${usd.toLocaleString()}`;
    }
    const cny = prod.priceCNY || Math.round((baseNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));
    return `¥${cny.toLocaleString()}`;
  };

  const getSecondaryPrice = (prod: TechProduct, curr: 'NGN' | 'CNY' | 'USD') => {
    const baseNGN = prod.priceNGN || Math.round((prod.priceUSD || 0) * (rates.USD_NGN || 1485));
    if (curr === 'NGN') {
      const usd = prod.priceUSD || Math.round(baseNGN / (rates.USD_NGN || 1485));
      return `$${usd.toLocaleString()} USD`;
    }
    return `₦${baseNGN.toLocaleString()} NGN`;
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Apple Store • Hong Kong Hub" />

      <div className="p-4 space-y-4">
        {/* Navigation Quick Shortcuts Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('shop-saved')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <Heart className={`w-3.5 h-3.5 ${savedProductIds.length > 0 ? 'text-rose-400 fill-rose-400' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold text-slate-300">Wishlist</span>
              {savedProductIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[9px] flex items-center justify-center">
                  {savedProductIds.length}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-500">Saved Devices</span>
          </button>

          <button
            onClick={() => navigate('shop-compare')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
          >
            <div className="flex items-center gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
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
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold text-slate-300">Orders</span>
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[9px] flex items-center justify-center">
                {shopOrders.length}
              </span>
            </div>
            <span className="text-[9px] text-slate-500">Tracking</span>
          </button>
        </div>

        {/* Cart Quick Banner */}
        {cartCount > 0 && (
          <div 
            onClick={() => navigate('cart')}
            className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cartCount} {cartCount === 1 ? 'device' : 'devices'} in your cart</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Search & Currency Toggle Bar */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search iPhone, MacBook, M4, iPad, Watch..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 shrink-0">
            {(['NGN', 'USD', 'CNY'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setShopCurrency(curr)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  shopCurrency === curr
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills (7 Categories) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Condition Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Condition:</span>
          </span>
          {conditions.map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all border ${
                selectedCondition === cond
                  ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cond}
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
          {filteredProducts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No Apple devices found</p>
              <p className="text-xs text-slate-500">Try adjusting your category or condition filter.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSaved = savedProductIds.includes(product.id);
              const isComparing = compareProductIds.includes(product.id);
              const variantsTotalStock = (product.variants && product.variants.length > 0)
                ? product.variants.reduce((sum, v) => sum + (v.stockCount ?? 0), 0)
                : 0;
              const stock = variantsTotalStock > 0 ? variantsTotalStock : (product.stockCount ?? 10);
              const condition = product.condition || 'Brand New';
              const inCartCount = cart
                .filter(item => item.product.id === product.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={product.id}
                  onClick={() => navigate('product-detail', product.id)}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl relative overflow-hidden group"
                >
                  <div className="flex gap-4">
                    {/* Product Thumbnail */}
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 flex items-center justify-center p-1">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Stock Indicator */}
                      <span className={`absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md border backdrop-blur-md ${
                        stock > 5 
                          ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30'
                          : stock > 0
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/30'
                          : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
                      }`}>
                        {stock > 5 ? `${stock} in stock` : stock > 0 ? `Only ${stock} left` : 'Out of Stock'}
                      </span>

                      {/* Condition Pill */}
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-950/90 text-[8px] font-medium text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-800">
                        {condition}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mb-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{product.rating}</span>
                            <span className="text-slate-500">({product.reviewsCount})</span>
                          </div>

                          {/* Quick Wishlist & Compare Icons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveProduct(product.id);
                              }}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSaved 
                                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
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
                              className={`p-1.5 rounded-lg border transition-all ${
                                isComparing 
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                              }`}
                              title="Compare Specs"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mt-0.5">
                          {product.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {product.subtitle}
                        </p>
                      </div>

                      {/* Dynamic Multi-Currency Price Display */}
                      <div className="mt-2 space-y-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-white num-tabular">
                            {formatPrice(product, shopCurrency)}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-medium">{shopCurrency}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono num-tabular">
                            ≈ {getSecondaryPrice(product, shopCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Specs & Action */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[180px]">
                      {product.technicalSpecs?.chip ? (
                        <span>{product.technicalSpecs.chip.split('(')[0]} • {product.storageOptions?.[0] || product.variants?.[0]?.storage || 'Standard'}</span>
                      ) : (
                        <span>{(product.specs || []).slice(0, 2).join(' • ')}</span>
                      )}
                    </div>

                    {inCartCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('cart');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 active:scale-95 transition-all shadow-sm"
                          title="View In Cart"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{inCartCount} in Cart</span>
                        </button>
                        <button
                          type="button"
                          disabled={stock <= inCartCount}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-7 h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center active:scale-95 transition-all shadow-md disabled:bg-slate-800 disabled:text-slate-500"
                          title="Add Another Unit"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md ${
                          stock > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Quick Checkout Drawer / Bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-16 left-0 right-0 px-4 z-40 max-w-md mx-auto pointer-events-none">
            <button
              type="button"
              onClick={() => navigate('cart')}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-between shadow-2xl shadow-emerald-500/40 pointer-events-auto active:scale-98 transition-all border border-emerald-300/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs text-slate-950 leading-tight">
                    {cartCount} {cartCount === 1 ? 'Device' : 'Devices'} in Cart
                  </p>
                  <p className="text-[10px] text-slate-800 font-medium">Ready for Priority Air Cargo</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md">
                <span>View Cart</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
