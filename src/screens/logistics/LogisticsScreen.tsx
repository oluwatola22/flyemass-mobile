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
  FileBox,
  CreditCard,
  AlertCircle,
  Truck,
  ArrowRight,
  Info
} from 'lucide-react';

export const LogisticsScreen: React.FC = () => {
  const { shipments, navigate, showToast, userProfile, activeUserId } = useApp();
  const [activeTab, setActiveTab] = useState<'shipments' | 'warehouses' | 'calculator' | 'guide'>('shipments');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rate calculator state
  const [calcMode, setCalcMode] = useState<'air_express' | 'air_regular' | 'sea'>('air_regular');
  const [weightKg, setWeightKg] = useState('20');
  const [cbm, setCbm] = useState('0.25');

  const customerShippingMark = `FM / ${activeUserId === 'usr_alade_01' ? 'USR-8924' : (userProfile?.flyeTag?.replace('@', '').toUpperCase() || 'USR-8924')} / ${userProfile?.name || 'Chief Babatunde Alade'}`;

  const FREIGHT_RATES = {
    air_express: { name: 'Air Express', eta: '3–5 Days', ratePerKg: 11.50, unit: 'kg', icon: Plane, desc: 'Daily flights, priority customs dispatch' },
    air_regular: { name: 'Air Regular', eta: '7–10 Days', ratePerKg: 9.50, unit: 'kg', icon: Plane, desc: 'Scheduled cargo flights twice weekly' },
    sea: { name: 'Sea Freight', eta: '25–35 Days', ratePerCbm: 280.00, unit: 'CBM', icon: Ship, desc: 'Full container consolidation for bulky goods' }
  };

  const handleCopy = (text: string, id: string, label: string = 'Address copied!') => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(label, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const calculatedCostUSD = calcMode === 'sea'
    ? (parseFloat(cbm) || 0) * FREIGHT_RATES.sea.ratePerCbm
    : (parseFloat(weightKg) || 0) * (calcMode === 'air_express' ? FREIGHT_RATES.air_express.ratePerKg : FREIGHT_RATES.air_regular.ratePerKg);

  const calculatedCostNGN = calculatedCostUSD * 1485;

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Freight & Logistics" />

      <div className="p-4 space-y-4">
        {/* Customer Unique Shipping Mark Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Your Personal China Shipping Mark
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              Auto-Link Enabled
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <span className="text-[9px] text-slate-400 block font-sans">MARK ON ALL CARTONS / WAYBILLS:</span>
              <p className="font-mono text-xs font-bold text-emerald-400 truncate">
                {customerShippingMark}
              </p>
            </div>
            <button
              onClick={() => handleCopy(customerShippingMark, 'mark', 'Shipping Mark copied to clipboard!')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              {copiedId === 'mark' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'mark' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Ask suppliers on 1688 / WeChat to write this exact mark on outer cartons. When delivered to our warehouse, parcels automatically appear in your app!
          </p>
        </div>

        {/* Quick Rate Badges Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-0.5">
            <span className="text-[9px] font-bold text-cyan-400 block uppercase">Air Express</span>
            <p className="text-xs font-extrabold text-white">$11.50<span className="text-[10px] text-slate-400 font-normal">/kg</span></p>
            <span className="text-[9px] text-slate-500 block">3–5 Days</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-0.5">
            <span className="text-[9px] font-bold text-emerald-400 block uppercase">Air Regular</span>
            <p className="text-xs font-extrabold text-white">$9.50<span className="text-[10px] text-slate-400 font-normal">/kg</span></p>
            <span className="text-[9px] text-slate-500 block">7–10 Days</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-0.5">
            <span className="text-[9px] font-bold text-teal-400 block uppercase">Sea Freight</span>
            <p className="text-xs font-extrabold text-white">$280<span className="text-[10px] text-slate-400 font-normal">/CBM</span></p>
            <span className="text-[9px] text-slate-500 block">25–35 Days</span>
          </div>
        </div>

        {/* Navigation Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'shipments' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cargo ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'warehouses' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hubs (4)
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'calculator' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Estimator
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'guide' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            How It Works
          </button>
        </div>

        {/* 1. SHIPMENTS TAB */}
        {activeTab === 'shipments' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Waybills ({shipments.length})
              </span>
              <button
                onClick={() => navigate('register-package')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[3]" />
                <span>Register Package</span>
              </button>
            </div>

            {shipments.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Registered Shipments</h4>
                <p className="text-xs text-slate-400">Pre-register incoming China parcels from 1688 or suppliers to track them live.</p>
                <button
                  onClick={() => navigate('register-package')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
                >
                  Register First Parcel
                </button>
              </div>
            ) : (
              shipments.map((shipment) => {
                const isPendingPayment = shipment.paymentStatus === 'awaiting_payment' || (!shipment.freightPaid && (shipment.freightFeeUSD || 0) > 0);
                const isDeferred = shipment.paymentStatus === 'deferred' || shipment.paymentTiming === 'pay_on_arrival';

                return (
                  <div
                    key={shipment.trackingNumber}
                    onClick={() => navigate('track')}
                    className="p-4 rounded-3xl bg-slate-900/95 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-lg space-y-3 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          {shipment.type === 'air' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
                              {shipment.shipmentCode || shipment.trackingNumber}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px] uppercase">
                              {shipment.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{shipment.title}</p>
                          {shipment.chineseCourierTracking && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              CN Courier: {shipment.courierCompany || 'SF'} • {shipment.chineseCourierTracking}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold block">
                          {shipment.status}
                        </span>
                        {isPendingPayment && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-bold block">
                            Freight Due: ${shipment.freightFeeUSD || shipment.costEstimate}
                          </span>
                        )}
                        {isDeferred && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-bold block">
                            Pay on Arrival
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Weight / Billable</span>
                        <span className="font-bold text-slate-200 num-tabular">
                          {shipment.billableWeightKg || shipment.weightKg} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lagos Destination</span>
                        <span className="font-bold text-slate-200 truncate block">
                          {shipment.destinationHub || shipment.pickupHub || 'Ikeja MMIA'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ETA</span>
                        <span className="font-bold text-emerald-400">{shipment.eta}</span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{shipment.origin} ➔ Lagos</span>
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Details & Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. CHINA WAREHOUSES TAB (Guangzhou, Yiwu, Foshan, Hong Kong) */}
        {activeTab === 'warehouses' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">4 Verified China Hubs Available</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Copy the complete Chinese address block into 1688, Taobao, or WeChat. Your Shipping Mark <span className="font-mono text-emerald-400 font-bold">{customerShippingMark}</span> ensures automatic intake recognition!
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

                {/* Chinese Address Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      中文收件信息 (Chinese Format for Suppliers)
                    </span>
                    <button
                      onClick={() => handleCopy(`${wh.recipientZh}\n${wh.phone}\n${wh.addressZh} (唛头/Mark: ${customerShippingMark})`, wh.id, 'Full Chinese format copied!')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      {copiedId === wh.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === wh.id ? 'Copied' : 'Copy Chinese'}</span>
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">收件人 (Recipient): </span><strong className="text-white">{wh.recipientZh}</strong></p>
                    <p><span className="text-slate-500">联系电话 (Phone): </span><strong className="text-emerald-400 font-mono">{wh.phone}</strong></p>
                    <p><span className="text-slate-500">详细地址 (Address): </span><span className="text-slate-200 select-all font-sans">{wh.addressZh}</span></p>
                    <p><span className="text-slate-500">邮政编码 (Zip): </span><span className="font-mono text-slate-400">{wh.postalCode}</span></p>
                    <p><span className="text-slate-500">进仓唛头 (Mark): </span><span className="font-mono text-emerald-400 font-bold">{customerShippingMark}</span></p>
                  </div>
                </div>

                {/* English Format Box */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">English Equivalent</span>
                    <button
                      onClick={() => handleCopy(`${wh.recipientEn}\n${wh.phone}\n${wh.addressEn}\nShipping Mark: ${customerShippingMark}`, `${wh.id}-en`, 'English format copied!')}
                      className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === `${wh.id}-en` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
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
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Live Freight Rate Estimator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate all-inclusive landed shipping costs with Nigerian customs clearance included.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCalcMode('air_express')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  calcMode === 'air_express'
                    ? 'bg-slate-950 border-cyan-500 text-cyan-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Plane className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] font-bold block">Express Air</span>
                <span className="text-[9px] text-slate-500 block">$11.50/kg</span>
              </button>

              <button
                onClick={() => setCalcMode('air_regular')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  calcMode === 'air_regular'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Plane className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] font-bold block">Regular Air</span>
                <span className="text-[9px] text-slate-500 block">$9.50/kg</span>
              </button>

              <button
                onClick={() => setCalcMode('sea')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  calcMode === 'sea'
                    ? 'bg-slate-950 border-teal-500 text-teal-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <Ship className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[10px] font-bold block">Sea Cargo</span>
                <span className="text-[9px] text-slate-500 block">$280/CBM</span>
              </button>
            </div>

            {calcMode !== 'sea' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Estimated Gross Weight (kg)
                </label>
                <div className="relative flex items-center">
                  <Scale className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Delivery ETA: {calcMode === 'air_express' ? '3–5 days (Daily Flights)' : '7–10 days (Bi-weekly flights)'}
                </span>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Estimated Volume (CBM - Cubic Metres)
                </label>
                <div className="relative flex items-center">
                  <Package className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={cbm}
                    onChange={(e) => setCbm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Delivery ETA: 25–35 days • Minimum billable volume: 0.1 CBM
                </span>
              </div>
            )}

            {/* Estimated Total Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-medium">Estimated Freight Total:</span>
                <span className="text-xl font-extrabold text-emerald-400 num-tabular">
                  ${calculatedCostUSD.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Naira Equivalent (@ ₦1,485/$):</span>
                <span className="font-extrabold text-white num-tabular">
                  ₦{calculatedCostNGN.toLocaleString(undefined, { maximumFractionDigits: 0 })} NGN
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                <span>RMB Equivalent (@ ¥7.24/$):</span>
                <span className="font-bold text-amber-400 num-tabular">
                  ¥{(calculatedCostUSD * 7.24).toFixed(2)} CNY
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 leading-snug">
                * Includes airport/seaport clearance, customs tariff, sorting, and storage at Lagos Hub. Volumetric weight applies if larger than gross weight.
              </p>
            </div>

            <button
              onClick={() => navigate('register-package')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Register Package Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* 4. HOW IT WORKS GUIDE TAB */}
        {activeTab === 'guide' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">How China-to-Nigeria Shipping Works</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simple 4-step process from factory order to Lagos delivery.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Copy Warehouse Address & Mark</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select Guangzhou, Yiwu, or Foshan and copy the Chinese address. Give it to your 1688 / Taobao / WeChat supplier with your personal shipping mark.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Supplier Ships to China Warehouse</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your supplier dispatches via SF Express, ZTO, or domestic courier. Get the Chinese tracking number and pre-register it on FlyeMass.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Intake, Weighing & Customs Clearing</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Our China team weighs, inspects, and uploads photos. We clear customs and load into air/sea cargo. Pay freight from your wallet or choose Pay on Arrival!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Collection in Lagos or Doorstep Delivery</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Receive your 6-digit pickup OTP. Collect at Ikeja MMIA or your chosen pickup hub, or have our dispatch team deliver straight to your doorstep.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('register-package')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started: Register Package</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};