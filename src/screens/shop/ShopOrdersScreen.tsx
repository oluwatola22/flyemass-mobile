import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  ShoppingBag, 
  PackageCheck, 
  ChevronRight, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Package,
  Plane,
  XCircle
} from 'lucide-react';
import { ShopOrder } from '../../types';

export const ShopOrdersScreen: React.FC = () => {
  const { shopOrders, setSelectedOrderId, navigate } = useApp();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [allDbOrders, setAllDbOrders] = useState<any[]>(() => {
    return Object.values(db.getState().shop_orders || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  });

  useEffect(() => {
    return db.subscribe(() => {
      const nextOrders = Object.values(db.getState().shop_orders || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllDbOrders((prev) => {
        if (
          prev.length === nextOrders.length &&
          prev.every((o, i) => o.id === nextOrders[i]?.id && (o.fulfillmentStatus || o.status) === (nextOrders[i]?.fulfillmentStatus || nextOrders[i]?.status))
        ) {
          return prev;
        }
        return nextOrders;
      });
    });
  }, []);

  // Merge context shopOrders and authoritative backend dbState orders
  const displayOrders = allDbOrders.length > 0 ? allDbOrders : shopOrders;

  const filteredOrders = displayOrders.filter((order) => {
    if (statusFilter === 'All') return true;
    const s = (order.fulfillmentStatus || order.status || '').toLowerCase();
    return s.includes(statusFilter.toLowerCase());
  });

  const handleOrderClick = (order: any) => {
    setSelectedOrderId(order.id);
    navigate('shop-order-detail', order.id);
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('deliver')) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
    if (s.includes('ship') || s.includes('flight') || s.includes('dispatch')) {
      return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
    }
    if (s.includes('process')) {
      return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
    }
    if (s.includes('cancel')) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    }
    return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Apple Order History & Tracking" />

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-950 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Hong Kong Direct Procurement
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {displayOrders.length} Apple Purchases
            </h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">Automated Trade Settlement & Waybill Tracking</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                statusFilter === filter
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No {statusFilter !== 'All' ? statusFilter : ''} Orders Found</p>
              <p className="text-xs text-slate-500">Your Apple hardware purchases will appear here.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = order.items || [];
              const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
              const firstItem = items[0];
              const statusText = order.fulfillmentStatus || order.status || 'Pending';
              const formattedDate = order.createdAt 
                ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : (order.date || 'Recent');

              const amount = order.totalAmount || order.totalNGN || 0;
              const currency = order.currency || order.paidWith || 'NGN';

              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all active:scale-98 space-y-3 group shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {order.orderNumber || order.id}
                      </span>
                      <span className="text-[10px] text-slate-500">{formattedDate}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(statusText)}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-3">
                    {firstItem && (
                      <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 flex items-center justify-center shrink-0 border border-slate-800 overflow-hidden">
                        <img
                          src={firstItem.product?.image || firstItem.image}
                          alt={firstItem.product?.title || 'Apple device'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {firstItem?.product?.title || 'Apple Tech Procurement'}
                        {items.length > 1 && ` + ${items.length - 1} more`}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {firstItem?.selectedColor && `${firstItem.selectedColor} • `}
                        {firstItem?.selectedStorage && `${firstItem.selectedStorage} • `}
                        Air Cargo Waybill: <span className="font-mono text-emerald-400">{order.trackingNumber || 'Pending'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Settlement</span>
                      <span className="font-mono font-extrabold text-white">
                        {currency} {amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs group-hover:translate-x-1 transition-transform">
                      <span>View Progress Timeline</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
