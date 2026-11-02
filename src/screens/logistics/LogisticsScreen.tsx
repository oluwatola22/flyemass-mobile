import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { CHINA_WAREHOUSES } from '../../data/mockData';
import { 
  Plane, 
  Ship, 
  Copy, 
  CheckCheck, 
  PlusCircle, 
  Search, 
  ChevronRight, 
  MapPin, 
  Package, 
  Scale, 
  Clock, 
  Calculator,
  ShieldCheck,
  FileBox
} from 'lucide-react';

export const LogisticsScreen: React.FC = () => {
  const { shipments, navigate, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'shipments' | 'warehouses' | 'calculator'>('shipments');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rate calculator state
  const [calcType, setCalcType] = useState<'air' | 'sea'>('air');
  const [weightKg, setWeightKg] = useState('20');
  const [cbm, setCbm] = useState('0.15');
  const [selectedRoute, setSelectedRoute] = useState<'CN-NG' | 'NG-CN' | 'CN-US' | 'CN-CA' | 'CN-EU' | 'CN-GH' | 'CN-ZA' | 'CN-KE'>('CN-NG');

  const ROUTE_MULTIPLIERS = {
    'CN-NG': { airRate: 9.5, seaRate: 280, label: '🇨🇳 China ➔ 🇳🇬 Nigeria (Lagos Hub)' },
    'NG-CN': { airRate: 11.0, seaRate: 310, label: '🇳🇬 Nigeria ➔ 🇨🇳 China (Guangzhou Hub)' },
    'CN-US': { airRate: 12.5, seaRate: 320, label: '🇨🇳 China ➔ 🇺🇸 United States (New York / LA)' },
    'CN-CA': { airRate: 13.0, seaRate: 330, label: '🇨🇳 China ➔ 🇨🇦 Canada (Toronto / Vancouver)' },
    'CN-EU': { airRate: 11.8, seaRate: 300, label: '🇨🇳 China ➔ 🇪🇺 Europe (London / Frankfurt)' },
    'CN-GH': { airRate: 10.2, seaRate: 290, label: '🇨🇳 China ➔ 🇬🇭 Ghana (Accra Hub)' },
    'CN-ZA': { airRate: 10.8, seaRate: 295, label: '🇨🇳 China ➔ 🇿🇦 South Africa (Joburg Hub)' },
    'CN-KE': { airRate: 10.5, seaRate: 285, label: '🇨🇳 China ➔ 🇰🇪 Kenya (Nairobi Hub)' }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast('Warehouse address copied in full Chinese format!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeRate = ROUTE_MULTIPLIERS[selectedRoute];
  const calculatedCost = calcType === 'air' 
    ? (parseFloat(weightKg) || 0) * activeRate.airRate 
    : (parseFloat(cbm) || 0) * activeRate.seaRate;

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Freight & Logistics" />

      <div className="p-4 space-y-4">
        {/* Navigation Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shipments' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Cargo ({shipments.length})
          </button>

          <button
            onClick={() => setActiveTab('warehouses')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'warehouses' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            China Hubs
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calculator' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rate Estimator
          </button>
        </div>

        {/* 1. SHIPMENTS TAB */}
        {activeTab === 'shipments' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                In-Transit Waybills
              </span>
              <button
                onClick={() => navigate('register-package')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 hover:border-emerald-500/40 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Package</span>
              </button>
            </div>

            {shipments.map((shipment) => (
              <div
                key={shipment.trackingNumber}
                onClick={() => navigate('track')}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-lg space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      {shipment.type === 'air' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {shipment.trackingNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px] uppercase">
                          {shipment.type} cargo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{shipment.title}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    {shipment.status}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Weight / Vol</span>
                    <span className="font-bold text-slate-200 num-tabular">{shipment.weightKg} kg / {shipment.cbm} cbm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Route</span>
                    <span className="font-bold text-slate-200">{shipment.origin.split(' ')[0]} ➔ LOS</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estimated ETA</span>
                    <span className="font-bold text-emerald-400">{shipment.eta}</span>
                  </div>
                </div>

                {/* Visual Step Timeline Bar */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Progress Step {shipment.currentStep + 1} of 4</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <span>View Timeline</span>
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Received', 'Packed', 'In Transit', 'Lagos Hub'].map((label, idx) => (
                      <div key={label} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            idx <= shipment.currentStep
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                              : 'bg-slate-800'
                          }`}
                        />
                        <span className={`text-[8px] block truncate text-center ${
                          idx <= shipment.currentStep ? 'text-slate-300 font-bold' : 'text-slate-600'
                        }`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. CHINA WAREHOUSES TAB (Guangzhou & Yiwu addresses for suppliers) */}
        {activeTab === 'warehouses' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Provide to Your 1688 / Factory Suppliers</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Send this Chinese address directly to your suppliers on WeChat or 1688. Your unique mark <span className="font-mono text-emerald-400 font-bold">FM-90214</span> ensures auto-identification upon arrival!
                </p>
              </div>
            </div>

            {CHINA_WAREHOUSES.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇨🇳</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{wh.hubName}</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold">{wh.type}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                    {wh.city}
                  </span>
                </div>

                {/* Chinese Address Box (Essential for Chinese Couriers: SF Express, ZTO, YTO) */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      中文收件信息 (Chinese Format)
                    </span>
                    <button
                      onClick={() => handleCopy(`${wh.recipientZh}\n${wh.phone}\n${wh.addressZh}`, wh.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      {copiedId === wh.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === wh.id ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">收件人 (Recipient): </span><strong className="text-white">{wh.recipientZh}</strong></p>
                    <p><span className="text-slate-500">联系电话 (Phone): </span><strong className="text-emerald-400 font-mono">{wh.phone}</strong></p>
                    <p><span className="text-slate-500">详细地址 (Address): </span><span className="text-slate-200 select-all font-sans">{wh.addressZh}</span></p>
                    <p><span className="text-slate-500">邮政编码 (Zip): </span><span className="font-mono text-slate-400">{wh.postalCode}</span></p>
                  </div>
                </div>

                {/* English Format Box */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50 text-[11px] text-slate-400 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">English Equivalent</p>
                  <p><span className="text-slate-500">Address:</span> {wh.addressEn}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. RATE ESTIMATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Global Air & Sea Freight Estimator</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate all-inclusive landed shipping costs across 8 global trade corridors with customs clearing included.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Global Trade Corridor & Destination
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-semibold"
              >
                {Object.entries(ROUTE_MULTIPLIERS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} (Air: ${val.airRate}/kg • Sea: ${val.seaRate}/CBM)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCalcType('air')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  calcType === 'air'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>Express Air (3-5 days)</span>
              </button>

              <button
                onClick={() => setCalcType('sea')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  calcType === 'sea'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Ship className="w-4 h-4" />
                <span>Sea Cargo (25-30 days)</span>
              </button>
            </div>

            {calcType === 'air' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Gross Weight (kg)
                </label>
                <div className="relative flex items-center">
                  <Scale className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Air Cargo Base Rate: $9.50 / kg (All customs fees included)</span>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Volume (CBM - Cubic Metres)
                </label>
                <div className="relative flex items-center">
                  <Package className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={cbm}
                    onChange={(e) => setCbm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Sea Shipping Base Rate: $280 / CBM (Customs clearing included)</span>
              </div>
            )}

            {/* Estimated Total Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Estimated Freight Cost:</span>
                <span className="text-xl font-extrabold text-emerald-400 num-tabular">
                  ${calculatedCost.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Equivalent in Naira:</span>
                <span className="font-bold text-white num-tabular">
                  ₦{(calculatedCost * 1485).toLocaleString(undefined, { maximumFractionDigits: 0 })} NGN
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
