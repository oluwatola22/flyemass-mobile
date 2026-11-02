import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
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
  ExternalLink
} from 'lucide-react';

export const ShopOrderDetailScreen: React.FC = () => {
  const { shopOrders, selectedOrderId, routeParam, navigate, showToast } = useApp();
  const [copiedTracking, setCopiedTracking] = useState(false);

  const orderId = routeParam || selectedOrderId;
  const order = shopOrders.find((o) => o.id === orderId) || shopOrders[0];

  const steps = [
    { title: 'Order Paid & Vault Secured', desc: 'Debited via USD Global Account', time: 'Oct 28, 16:45' },
    { title: 'HK Warehouse Packing & Seal', desc: 'IMEI / Serial numbers verified at Kowloon depot', time: 'Oct 29, 09:20' },
    { title: 'Cathay Cargo Flight CX082', desc: 'Air cargo departed Hong Kong International (HKG)', time: 'Oct 30, 23:10' },
    { title: 'Lagos Ikeja Hub Pre-Clearing', desc: 'Single-window customs valuation completed', time: 'Nov 1, 14:00' },
    { title: 'Vault Ready for Pickup / Dispatch', desc: 'Available at Allen Avenue Terminal', time: 'Estimated Nov 4' }
  ];

  const handleCopyTracking = () => {
    navigator.clipboard?.writeText(order.trackingNumber);
    setCopiedTracking(true);
    showToast(`Air tracking code ${order.trackingNumber} copied!`, 'success');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title={`Order ${order.orderNumber}`} />

      <div className="p-4 space-y-4">
        {/* Order Status Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {order.status}
            </span>
            <span className="text-xs font-mono text-slate-400">{order.date}</span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">{order.orderNumber}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Settled with {order.paidWith} Global Balance
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Air Waybill Number</span>
              <span className="font-mono font-bold text-xs text-white">{order.trackingNumber}</span>
            </div>
            <button
              onClick={handleCopyTracking}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Copy tracking"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Step Order Progress Tracker */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Shipment Milestone Tracker
          </span>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {steps.map((st, i) => {
              const isDone = i <= order.step;
              const isCurrent = i === order.step;

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
        </div>

        {/* Purchased Items List */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Items in this Consignment ({order.items.length})
          </span>

          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-900 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">{item.product.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.selectedStorage} • {item.selectedColor}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${(item.product.priceUSD * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">${order.totalUSD.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Air Freight & Customs:</span>
              <span className="font-semibold text-emerald-400">Included (Free VIP)</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800/80">
              <span>Total Paid:</span>
              <span className="font-mono text-emerald-400">
                ${order.totalUSD.toLocaleString()} (~₦{order.totalNGN.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Destination */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white">Consignment Destination</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {order.destinationAddress}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => showToast('Official Commercial Invoice PDF downloaded!', 'success')}
            className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Invoice PDF</span>
          </button>

          <button
            onClick={() => navigate('support-chat')}
            className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Headphones className="w-4 h-4 text-cyan-400" />
            <span>Chat Concierge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
