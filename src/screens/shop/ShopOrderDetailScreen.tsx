import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';

const USD_TO_NGN = 1485;
import { 
  PackageCheck, 
  Truck, 
  Plane, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Download, 
  Headphones, 
  Copy, 
  ShieldCheck,
  ExternalLink,
  Ban,
  FileText,
  AlertCircle
} from 'lucide-react';

export const ShopOrderDetailScreen: React.FC = () => {
  const { shopOrders, selectedOrderId, routeParam, navigate, showToast } = useApp();
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [, setDbRev] = useState(() => db.getStateRevision());

  useEffect(() => {
    return db.subscribe(() => {
      setDbRev(db.getStateRevision());
    });
  }, []);

  const dbState = db.getState();

  const orderId = routeParam || selectedOrderId;
  // Check in dbState first then fallback to shopOrders
  const liveOrder = (dbState.shop_orders && orderId && dbState.shop_orders[orderId]) ? dbState.shop_orders[orderId] : null;
  const contextOrder = shopOrders.find((o) => o.id === orderId) || shopOrders[0];
  const order = liveOrder || contextOrder;

  const orderNumber = order.orderNumber || order.id || 'ORD-2026-00000';
  const trackingNumber = order.trackingNumber || 'FM-HK-LOS-00000';
  const courierName = order.courierName || 'FlyeMass Express Air Cargo';
  const fulfillmentStatus = order.fulfillmentStatus || order.status || 'Pending';
  const currency = order.currency || order.paidWith || 'NGN';
  const totalAmount = order.totalAmount || order.totalNGN || 0;
  const subtotal = order.subtotalNGN || order.totalAmount || 0;
  const deliveryFee = order.deliveryFeeNGN !== undefined ? order.deliveryFeeNGN : 5000;

  const handleCancelOrder = async () => {
    if (!window.confirm(`Request immediate cancellation for Order #${orderNumber}? ${currency} ${totalAmount.toLocaleString()} will be refunded to your wallet and hardware stock restored.`)) return;
    try {
      await db.cancelShopOrder(order.id, 'Customer cancellation request');
      showToast(`Order #${orderNumber} cancelled and refunded!`, 'success');
      navigate('wallets');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  const handleCopyTracking = () => {
    navigator.clipboard?.writeText(trackingNumber);
    setCopiedTracking(true);
    showToast(`Waybill code ${trackingNumber} copied!`, 'success');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Determine timeline steps
  const defaultSteps = [
    { 
      status: 'pending', 
      title: 'Order Confirmed & Payment Escrowed', 
      desc: `Authorized via ${currency} customer wallet. Funds held safely in FlyeMass escrow.`,
      time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Day 1'
    },
    { 
      status: 'processing', 
      title: 'Hong Kong Allocation & Inspection', 
      desc: 'Factory-sealed serial numbers verified at FlyeMass Kowloon facility.',
      time: 'Day 2'
    },
    { 
      status: 'shipped', 
      title: 'Cargo Dispatched via Flight', 
      desc: `Handed over to ${courierName}. In transit to Lagos MM2 Cargo Terminal.`,
      time: 'Day 3'
    },
    { 
      status: 'delivered', 
      title: 'Lagos Hub Arrival & Final Delivery', 
      desc: 'Pre-cleared with Nigeria Customs. Handed over to recipient.',
      time: 'Day 4'
    }
  ];

  const currentStatusLower = fulfillmentStatus.toLowerCase();
  const getStepIndex = (s: string) => {
    if (s.includes('deliver')) return 3;
    if (s.includes('ship') || s.includes('flight') || s.includes('dispatch')) return 2;
    if (s.includes('process')) return 1;
    if (s.includes('cancel')) return -1;
    return 0; // pending
  };
  const activeStepIdx = getStepIndex(currentStatusLower);

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s.includes('deliver')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('ship') || s.includes('flight')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (s.includes('process')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    if (s.includes('cancel')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const isCancellable = currentStatusLower.includes('pending') || currentStatusLower.includes('process');

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title={`Order #${orderNumber}`} />

      <div className="p-4 space-y-4">
        {/* Order Status Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadge(fulfillmentStatus)}`}>
              {fulfillmentStatus}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : (order.date || 'Today')}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">{orderNumber}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Settled with <strong className="text-emerald-400">{currency}</strong> Balance • {courierName}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Air Cargo Consignment Waybill</span>
              <span className="font-mono font-bold text-xs text-emerald-400">{trackingNumber}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyTracking}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Copy tracking"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Staff Delivery Notes if present */}
        {order.deliveryNotes && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
              <FileText className="w-4 h-4" />
              <span>Operations Dispatch Notice</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-5">
              {order.deliveryNotes}
            </p>
          </div>
        )}

        {/* Timeline Milestone Tracker */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Consignment Journey Timeline
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Live Transit
            </span>
          </div>

          {currentStatusLower.includes('cancel') ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-xs">
              <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">Order Cancelled & Refunded</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {order.cancellationReason || 'This order was cancelled and the total amount was credited back to your wallet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {defaultSteps.map((st, i) => {
                const isDone = i <= activeStepIdx;
                const isCurrent = i === activeStepIdx;

                return (
                  <div key={i} className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-400/80'
                          : 'bg-slate-950 border-slate-700 text-slate-600'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3 h-3 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-emerald-400' : isDone ? 'text-white' : 'text-slate-500'}`}>
                          {st.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">{st.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchased Items List */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Items in this Consignment ({(order.items || []).length})
          </span>

          <div className="space-y-2.5">
            {(order.items || []).map((item: any, idx: number) => {
              const prod = item.product || {};
              const unitPrice = item.unitPriceNGN || prod.priceNGN || (prod.priceUSD * USD_TO_NGN) || 0;

              return (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={prod.image || item.image}
                      alt={prod.title || 'Apple item'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">{prod.title || item.title || 'Apple Device'}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.selectedStorage || 'Standard'} • {item.selectedColor || 'Standard'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {currency} {((item.quantity || 1) * (order.currency === 'USD' ? (prod.priceUSD || 1) : unitPrice)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Hardware Subtotal:</span>
              <span className="font-mono text-white">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Standard Air Cargo:</span>
              <span className="font-mono text-white">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800/80">
              <span>Total Settled:</span>
              <span className="font-mono text-emerald-400 text-sm">
                {currency} {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Destination */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-start gap-3 shadow-xl">
          <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white">Consignment Destination</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {order.deliveryAddress || order.destinationAddress || 'Plot 14, Commercial Avenue, Ikeja Computer Village, Lagos, Nigeria'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => showToast('Commercial Invoice & Waybill manifest downloaded!', 'success')}
            className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Invoice PDF</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('support-chat')}
            className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
          >
            <Headphones className="w-4 h-4 text-cyan-400" />
            <span>Chat Concierge</span>
          </button>
        </div>

        {/* Cancellation Button (Only if still pending/processing) */}
        {isCancellable && (
          <button
            type="button"
            onClick={handleCancelOrder}
            className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-2"
          >
            <Ban className="w-4 h-4" />
            <span>Cancel Consignment & Issue Full Refund</span>
          </button>
        )}
      </div>
    </div>
  );
};
