import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  ShoppingBag, 
  PackageCheck, 
  ChevronRight, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ShopOrder } from '../../types';

export const ShopOrdersScreen: React.FC = () => {
  const { shopOrders, setSelectedOrderId, navigate } = useApp();

  const handleOrderClick = (order: ShopOrder) => {
    setSelectedOrderId(order.id);
    navigate('shop-order-detail', order.id);
  };

  const getStatusBadge = (status: ShopOrder['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Lagos Ikeja Ready':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'Flight Mid-air':
      case 'HK Dispatched':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Tech Gadget Purchases" />

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Hong Kong Direct Procurement
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {shopOrders.length} Completed Orders
            </h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">100% Genuine Apple HK Dual-SIM Spec</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {shopOrders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const firstItem = order.items[0];

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all active:scale-98 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">{order.date}</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-3">
                  {firstItem && (
                    <img
                      src={firstItem.product.image}
                      alt={firstItem.product.title}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {firstItem?.product.title}
                      {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {itemCount} {itemCount === 1 ? 'unit' : 'units'} • Air Cargo: <span className="font-mono text-emerald-400">{order.trackingNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Settlement</span>
                    <span className="font-mono font-extrabold text-white">
                      ${order.totalUSD.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (₦{order.totalNGN.toLocaleString()})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Track Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
