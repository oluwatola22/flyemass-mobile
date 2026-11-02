import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { Plane, Ship, FileBox, Tag, Scale, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPackageScreen: React.FC = () => {
  const { registerPackage, goBack } = useApp();
  const [trackingNumber, setTrackingNumber] = useState('SF18920488219');
  const [title, setTitle] = useState('100x GaN 65W Fast Chargers & Cables');
  const [sender, setSender] = useState('Shenzhen Anker Micro Technology');
  const [type, setType] = useState<'air' | 'sea'>('air');
  const [weightKg, setWeightKg] = useState('8.5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerPackage({
      trackingNumber,
      title,
      sender,
      type,
      weightKg: parseFloat(weightKg) || 5.0
    });
    goBack();
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Register Incoming Parcel" />

      <div className="p-4 space-y-4">
        <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-start gap-2.5">
          <FileBox className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            Pre-register domestic China parcels from 1688, Taobao, Pinduoduo, or direct factory dispatch. Once received at our Guangzhou or Yiwu dock, we cross-check and notify you immediately!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              China Domestic Tracking / Courier Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. SF Express, ZTO, YTO number"
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Item Description & Quantity
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50x Phone Displays, Solar Lamps"
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Supplier / Factory Name
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. Foxconn or 1688 Store Name"
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Target Shipping Mode to Nigeria
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('air')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'air'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>Express Air (3-5d)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('sea')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'sea'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Ship className="w-4 h-4" />
                <span>Sea Cargo (25-30d)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Estimated Weight (KG)
            </label>
            <input
              type="number"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Register Package Pre-Alert</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
