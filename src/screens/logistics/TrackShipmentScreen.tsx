import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Plane, 
  Ship, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  FileText, 
  Share2, 
  Search,
  ExternalLink
} from 'lucide-react';
import { Shipment } from '../../types';

export const TrackShipmentScreen: React.FC = () => {
  const { shipments, showToast } = useApp();
  const [selectedWaybill, setSelectedWaybill] = useState<string>(shipments[0]?.trackingNumber || '');
  const [copied, setCopied] = useState(false);

  const shipment = shipments.find((s) => s.trackingNumber === selectedWaybill) || shipments[0];

  const handleCopy = () => {
    if (!shipment) return;
    navigator.clipboard?.writeText(shipment.trackingNumber);
    setCopied(true);
    showToast('Tracking number copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shipment) return null;

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Cargo Waybill Tracker" />

      <div className="p-4 space-y-4">
        {/* Shipment Switcher Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {shipments.map((s) => (
            <button
              key={s.trackingNumber}
              onClick={() => setSelectedWaybill(s.trackingNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedWaybill === s.trackingNumber
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              {s.type === 'air' ? '✈ ' : '🚢 '} {s.trackingNumber}
            </button>
          ))}
        </div>

        {/* Waybill Status Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Waybill No:</span>
              <span className="font-mono font-bold text-white text-xs">{shipment.trackingNumber}</span>
              <button onClick={handleCopy} className="text-slate-400 hover:text-white">
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
              {shipment.status}
            </span>
          </div>

          <h3 className="text-base font-bold text-white">{shipment.title}</h3>
          <p className="text-xs text-slate-400">Supplier: {shipment.sender}</p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-500 block">Gross Weight</span>
              <span className="font-bold text-slate-200 num-tabular">{shipment.weightKg} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Est. Landed ETA</span>
              <span className="font-bold text-emerald-400">{shipment.eta}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Lagos Terminal</span>
              <span className="font-bold text-slate-200">Ikeja Hub (LOS)</span>
            </div>
          </div>
        </div>

        {/* 4-Step Interactive Tracking Timeline */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Transit Milestones
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Customs Cleared Bond
            </span>
          </div>

          <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {(shipment.waypoints || []).map((wp, index) => {
              const isPast = wp.status === 'completed';
              const isCurrent = wp.status === 'current';
              const isUpcoming = wp.status === 'upcoming';

              return (
                <div key={wp.id} className="relative group">
                  {/* Waypoint Dot */}
                  <div
                    className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      isPast
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-slate-900 border-emerald-400 text-emerald-400 animate-pulse ring-4 ring-emerald-500/20'
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className={`text-xs font-bold ${
                        isCurrent ? 'text-emerald-400' : isPast ? 'text-white' : 'text-slate-500'
                      }`}>
                        {wp.title}
                      </h4>
                      {wp.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{wp.timestamp}</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{wp.location}</span>
                    </p>

                    <p className={`text-[11px] mt-1.5 p-2 rounded-xl border ${
                      isCurrent
                        ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}>
                      {wp.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share & Documentation Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => showToast('Tracking link copied for client share', 'info')}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share with Buyer</span>
          </button>

          <button
            onClick={() => showToast('Downloading Packing List & Air Waybill PDF...', 'success')}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Air Waybill (AWB)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
