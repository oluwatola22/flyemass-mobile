import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Plane, 
  ArrowRight, 
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Package
} from 'lucide-react';
import { CartItem } from '../../types';

export const CartScreen: React.FC = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    navigate,
    shopCurrency,
    setShopCurrency 
  } = useApp();

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };
  const shopSettings = db.getShopSettings();
  const deliveryFeeNGN = shopSettings.deliveryFeeNGN ?? 5000;

  // Real-time inventory status checks
  const getInventoryStatus = (item: CartItem) => {
    const liveProduct = db.getProduct(item.product.id) || item.product;
    if (item.variantId && liveProduct.variants && liveProduct.variants.length > 0) {
      const v = liveProduct.variants.find(x => x.id === item.variantId);
      if (!v || !v.isActive) return { isAvailable: false, stock: 0, reason: 'Variant Unavailable' };
      if (v.stockCount < item.quantity) return { isAvailable: false, stock: v.stockCount, reason: `Only ${v.stockCount} left` };
      return { isAvailable: true, stock: v.stockCount };
    }
    if ((liveProduct.stockCount ?? 0) < item.quantity) {
      return { isAvailable: false, stock: liveProduct.stockCount ?? 0, reason: `Only ${liveProduct.stockCount ?? 0} left` };
    }
    return { isAvailable: true, stock: liveProduct.stockCount ?? 0 };
  };

  const inventoryIssues = cart.map(item => ({
    item,
    status: getInventoryStatus(item)
  })).filter(x => !x.status.isAvailable);

  const hasInventoryBlocker = inventoryIssues.length > 0;

  // Calculate authoritative Subtotal in NGN
  const subtotalNGN = cart.reduce((sum, item) => {
    const base = item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485));
    const adj = item.priceAdjustmentNGN || 0;
    return sum + ((base + adj) * item.quantity);
  }, 0);

  const totalNGN = subtotalNGN + deliveryFeeNGN;
  const totalUSD = Math.round(totalNGN / (rates.USD_NGN || 1485));
  const totalCNY = Math.round((totalNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));

  const deliveryFeeUSD = Math.round(deliveryFeeNGN / (rates.USD_NGN || 1485));
  const deliveryFeeCNY = Math.round((deliveryFeeNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));

  if (cart.length === 0) {
    return (
      <div className="min-h-full pb-24 bg-slate-950 text-white flex flex-col justify-between">
        <Header title="Your Tech Cart" />
        <div className="p-8 text-center my-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Your Cart is Empty</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Browse our Hong Kong wholesale catalog for authentic Apple iPhones, MacBooks, and gadgets.
          </p>
          <button
            onClick={() => navigate('shop')}
            className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Explore Tech Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title={`Shopping Cart (${cart.length} ${cart.length === 1 ? 'item' : 'items'})`} />

      <div className="p-4 space-y-4">
        {/* Inventory Warning Banner if any item has issues */}
        {hasInventoryBlocker && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-xs flex items-center gap-2.5 text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold">Stock Availability Changed</p>
              <p className="text-[11px] text-rose-400/90">
                Some items in your cart exceed available wholesale inventory. Please reduce quantity or remove out-of-stock variants.
              </p>
            </div>
          </div>
        )}

        {/* Currency Switcher */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-slate-400">Cart Currency:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
            {(['NGN', 'USD', 'CNY'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setShopCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  shopCurrency === curr ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Item Cards */}
        <div className="space-y-3">
          {cart.map((item, index) => {
            const status = getInventoryStatus(item);
            const unitPrice = (item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485))) + (item.priceAdjustmentNGN || 0);
            const lineTotalNGN = unitPrice * item.quantity;
            const lineTotalUSD = Math.round(lineTotalNGN / (rates.USD_NGN || 1485));
            const lineTotalCNY = Math.round((lineTotalNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));

            return (
              <div
                key={item.id || `${item.product.id}-${item.variantId || index}`}
                className={`p-4 rounded-3xl bg-slate-900 border transition-all flex flex-col gap-3 relative ${
                  !status.isAvailable ? 'border-rose-500/80 bg-rose-950/20' : 'border-slate-800'
                }`}
              >
                <div className="flex gap-3.5 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        {item.product.category}
                      </span>
                      {!status.isAvailable && (
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                          {status.reason}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.product.title}</h4>
                    <p className="text-[10px] text-slate-400">
                      {item.selectedColor} • {item.selectedStorage}
                      {item.priceAdjustmentNGN ? ` (+₦${item.priceAdjustmentNGN.toLocaleString()})` : ''}
                    </p>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xs font-extrabold text-emerald-400 num-tabular">
                        {shopCurrency === 'NGN' && `₦${lineTotalNGN.toLocaleString()}`}
                        {shopCurrency === 'USD' && `$${lineTotalUSD.toLocaleString()}`}
                        {shopCurrency === 'CNY' && `¥${lineTotalCNY.toLocaleString()}`}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        (₦{unitPrice.toLocaleString()} ea)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Quantity Controls & Remove */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id || item.product.id, -1, item.variantId)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-white num-tabular w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id || item.product.id, 1, item.variantId)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id || item.product.id, item.variantId)}
                    className="text-slate-500 hover:text-rose-400 flex items-center gap-1 text-xs font-semibold p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Delivery Fee & Warehouse Info */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Plane className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Direct Hong Kong Air Flight to Lagos</p>
              <p className="text-[11px] text-slate-400">
                Consolidated cargo shipment with door-to-door escrow clearance. Standard flat delivery fee: ₦{deliveryFeeNGN.toLocaleString()}.
              </p>
            </div>
          </div>
        </div>

        {/* Order Price Breakdown */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs shadow-xl">
          <div className="flex justify-between text-slate-400">
            <span>Hardware Subtotal:</span>
            <span className="text-white num-tabular font-bold">₦{subtotalNGN.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Standard Air Cargo Delivery:</span>
            <span className="text-white num-tabular font-bold">
              ₦{deliveryFeeNGN.toLocaleString()}
              <span className="text-slate-500 font-normal ml-1">(${deliveryFeeUSD} USD)</span>
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Customs Duties & Escrow Guard:</span>
            <span className="text-emerald-400 font-bold">100% Guaranteed</span>
          </div>

          <div className="flex justify-between items-baseline text-white border-t border-slate-800 pt-2 font-bold">
            <span className="text-sm">Total Payable:</span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-emerald-400 num-tabular block">
                {shopCurrency === 'NGN' && `₦${totalNGN.toLocaleString()}`}
                {shopCurrency === 'USD' && `$${totalUSD.toLocaleString()}`}
                {shopCurrency === 'CNY' && `¥${totalCNY.toLocaleString()}`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {shopCurrency === 'NGN' ? `≈ $${totalUSD.toLocaleString()} USD / ¥${totalCNY.toLocaleString()} CNY` : `≈ ₦${totalNGN.toLocaleString()} NGN`}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          disabled={hasInventoryBlocker}
          onClick={() => navigate('checkout')}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
            hasInventoryBlocker
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-98'
          }`}
        >
          <span>{hasInventoryBlocker ? 'Resolve Stock Warnings to Proceed' : 'Proceed to Checkout'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
