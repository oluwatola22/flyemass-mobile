import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Plane, 
  ArrowRight, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const CartScreen: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart, navigate } = useApp();
  const [shippingMethod, setShippingMethod] = useState<'express' | 'standard'>('express');

  const subtotalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const subtotalNGN = cart.reduce((sum, item) => sum + item.product.priceNGN * item.quantity, 0);
  const subtotalCNY = cart.reduce((sum, item) => sum + item.product.priceCNY * item.quantity, 0);

  const shippingFeeUSD = shippingMethod === 'express' ? 45 : 20;
  const shippingFeeNGN = shippingFeeUSD * 1485;
  const shippingFeeCNY = shippingFeeUSD * 7.24;

  const totalUSD = subtotalUSD + shippingFeeUSD;
  const totalNGN = subtotalNGN + shippingFeeNGN;
  const totalCNY = subtotalCNY + shippingFeeCNY;

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
            className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
          >
            Explore Tech Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title={`Cart (${cart.length} items)`} />

      <div className="p-4 space-y-4">
        {/* Cart Item Cards */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedStorage}`}
              className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 flex gap-3.5 items-center relative"
            >
              <img
                src={item.product.image}
                alt={item.product.title}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {item.selectedColor} • {item.selectedStorage}
                </p>
                <p className="text-xs font-extrabold text-emerald-400 num-tabular mt-1">
                  ₦{(item.product.priceNGN * item.quantity).toLocaleString()}
                </p>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 shrink-0">
                <button
                  onClick={() => updateCartQuantity(item.product.id, -1)}
                  className="text-slate-400 hover:text-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-white num-tabular w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, 1)}
                  className="text-slate-400 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Shipping Method Choice */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Cargo Shipping Method
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShippingMethod('express')}
              className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                shippingMethod === 'express'
                  ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Express Air (3 Days)</span>
                <span>$45</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Direct flight via Ethiopian Airlines</p>
            </button>

            <button
              onClick={() => setShippingMethod('standard')}
              className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                shippingMethod === 'standard'
                  ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Standard Air (7 Days)</span>
                <span>$20</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Weekly consolidated flight</p>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Items Subtotal:</span>
            <span className="text-white num-tabular font-bold">₦{subtotalNGN.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Guangzhou Air Freight:</span>
            <span className="text-white num-tabular font-bold">₦{shippingFeeNGN.toLocaleString()} (${shippingFeeUSD})</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Customs Duties & Clearance:</span>
            <span className="text-emerald-400 font-bold">Included (FlyeMass Escrow)</span>
          </div>
          <div className="flex justify-between items-baseline text-white border-t border-slate-800 pt-2 font-bold">
            <span className="text-sm">Total Payable:</span>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-400 num-tabular block">
                ₦{totalNGN.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ≈ ${totalUSD.toLocaleString()} USD / ¥{totalCNY.toLocaleString()} CNY
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => navigate('checkout')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Proceed to Wallet Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
