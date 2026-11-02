import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export const AgentServiceScreen: React.FC = () => {
  const { showToast, goBack, navigate } = useApp();
  const [serviceType, setServiceType] = useState<'audit' | 'canton' | 'procure'>('audit');
  const [city, setCity] = useState<'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('Guangzhou');
  const [targetFactory, setTargetFactory] = useState('Shenzhen Huaqiangbei Electronics Industrial Park');
  const [requestedDate, setRequestedDate] = useState('2026-11-10');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Agent request received! Our China ground manager will contact you within 30 minutes.', 'success');
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Agent & Sourcing Hub" />

      <div className="p-4 space-y-4">
        {/* Tab switcher: Agent / Procure */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md transition-all"
          >
            Ground Agents & Audits
          </button>
          <button
            onClick={() => navigate('procure')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            Quotation Manager (RFQ)
          </button>
        </div>
        {/* Active Inspection Milestone Tracker */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-900/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Active Ground Assignment
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono text-[9px] font-bold">
              AGT-CAN-441
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Guangzhou Shisanhang Apparel Inspection</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Assigned Agent: <strong className="text-emerald-400">Zhang Wei (Bilingual)</strong></p>
            </div>
            <span className="text-xs font-bold text-emerald-400">In Progress</span>
          </div>

          {/* Milestone timeline */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-3 gap-1.5 text-[9px]">
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-bold block">1. Assigned</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold block">2. On-Site Audit</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-slate-800" />
                <span className="text-slate-600 block">3. PDF Report</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Selector Tabs */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Trade Service
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'audit', title: 'Factory Audit', sub: 'Pre-shipment QA' },
              { id: 'canton', title: 'Canton Fair', sub: 'VIP Translator' },
              { id: 'procure', title: '1688 Sourcing', sub: 'Sample Pickup' }
            ].map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => setServiceType(srv.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  serviceType === srv.id
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <p className="text-xs font-bold text-white">{srv.title}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{srv.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Destination City / Market
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as any)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
            >
              <option value="Guangzhou">Guangzhou (Pazhou, Shisanhang, Zhongda Fabrics)</option>
              <option value="Shenzhen">Shenzhen (Huaqiangbei Electronics, Baoan)</option>
              <option value="Yiwu">Yiwu (International Trade City / Futian Mart)</option>
              <option value="Foshan">Foshan (Furniture & Building Materials)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Target Factory / Supplier Name / Booth No.
            </label>
            <input
              type="text"
              value={targetFactory}
              onChange={(e) => setTargetFactory(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              required
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between text-slate-400">
              <span>Standard Daily Escort Fee:</span>
              <span className="font-bold text-white num-tabular">¥800 CNY / Day ($110 USD)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Included Deliverables:</span>
              <span className="text-emerald-400 font-medium">HD Photos, Video Call & QA Checklist</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Book Verified Ground Agent</span>
          </button>
        </form>
      </div>
    </div>
  );
};
