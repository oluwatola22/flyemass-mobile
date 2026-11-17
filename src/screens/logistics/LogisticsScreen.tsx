import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db, DEFAULT_SHIPPING_CORRIDORS } from '../../services/db';
import { 
  Plane, 
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
  CreditCard,
  AlertCircle,
  Truck,
  ArrowRight,
  Info,
  Globe2,
  CheckCircle2,
  Sparkles,
  Layers,
  Compass,
  ExternalLink,
  FileText,
  Boxes,
  ArrowUpRight,
  Barcode
} from 'lucide-react';
import { Currency } from '../../types';

export const LogisticsScreen: React.FC = () => {
  const { shipments, navigate, showToast, userProfile, activeUserId, warehouses, routeParam } = useApp();
  const [activeTab, setActiveTab] = useState<'services' | 'shipments' | 'warehouses' | 'calculator'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/estimator')) {
      return 'calculator';
    }
    if (routeParam === 'estimator' || routeParam === 'calculator') {
      return 'calculator';
    }
    return 'services';
  });
  const [shipmentFilter, setShipmentFilter] = useState<'all' | 'active' | 'awaiting_payment' | 'in_transit' | 'completed'>('all');
  const [quickTrackQuery, setQuickTrackQuery] = useState('');
  const [warehouseRegion, setWarehouseRegion] = useState<'all' | 'china'>('china');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live pricing & FX revision tracker with strict equality gating
  const [ratesKey, setRatesKey] = useState<string>(() =>
    JSON.stringify({
      air: db.getAirShippingRates(),
      fx: db.getLogisticsFxRates(),
      corridors: db.getShippingCorridors()
    })
  );

  useEffect(() => {
    return db.subscribe(() => {
      const nextKey = JSON.stringify({
        air: db.getAirShippingRates(),
        fx: db.getLogisticsFxRates(),
        corridors: db.getShippingCorridors()
      });
      setRatesKey((prev) => (prev === nextKey ? prev : nextKey));
    });
  }, []);

  // Live active warehouses from database
  const liveWarehouses = useMemo(() => {
    const list = (warehouses && warehouses.length > 0) ? warehouses : db.getWarehouses();
    return list.filter((w) => w.isActive !== false);
  }, [warehouses]);

  // Rate calculator state
  const [calcOrigin, setCalcOrigin] = useState<'china'>('china');
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('cn_los');
  const [selectedDestinationHubId, setSelectedDestinationHubId] = useState<string>('los_main');
  const [calcMode, setCalcMode] = useState<'air_express' | 'air_regular'>('air_regular');
  const [weightKg, setWeightKg] = useState('15');
  const [cbm, setCbm] = useState('0.25');

  const corridors = useMemo(() => db.getShippingCorridors(), [ratesKey]);
  const systemSettings = useMemo(() => db.getSystemSettings(), [ratesKey]);
  const logisticsFxRates = useMemo(() => db.getLogisticsFxRates(), [ratesKey]);
  const systemRates = useMemo(() => ({
    ...systemSettings?.rates,
    USD_NGN: logisticsFxRates.usdToNgn || systemSettings?.rates?.USD_NGN || 1400,
    USD_CNY: logisticsFxRates.usdToCny || systemSettings?.rates?.USD_CNY || 7.25
  }), [systemSettings, logisticsFxRates]);

  const activeCorridor = useMemo(() => {
    return corridors.find(c => c.id === selectedCorridorId) || corridors[0] || DEFAULT_SHIPPING_CORRIDORS[0];
  }, [corridors, selectedCorridorId]);

  const calculationResult = useMemo(() => {
    return db.calculateFreightCost(
      selectedCorridorId,
      calcMode,
      parseFloat(weightKg) || 0,
      parseFloat(cbm) || 0,
      selectedDestinationHubId
    );
  }, [selectedCorridorId, calcMode, weightKg, cbm, selectedDestinationHubId, ratesKey]);

  const uniqueUserId = (userProfile as any)?.shippingMark || userProfile?.flyeTag || (activeUserId === 'usr_alade_01' ? 'FM-USR-8924' : `FM-USR-${activeUserId.slice(-4).toUpperCase()}`);
  const userName = userProfile?.name || 'Chief Babatunde Alade';
  const customerShippingMark = `FM / ${uniqueUserId} / ${userName}`;

  const handleCopy = (text: string, id: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(label, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackQuery.trim()) {
      showToast('Please enter a tracking number, waybill code, or SF tracking', 'info');
      return;
    }
    navigate('track', quickTrackQuery.trim());
  };

  // Filtered customer shipments
  const filteredShipments = shipments.filter((s) => {
    const st = String(s.currentStatus || s.status || '').toLowerCase();
    if (shipmentFilter === 'all') return true;
    if (shipmentFilter === 'active') {
      return !['delivered', 'completed', 'cancelled', 'returned'].includes(st);
    }
    if (shipmentFilter === 'awaiting_payment') {
      return s.paymentStatus === 'awaiting_payment' || st === 'awaiting payment' || st === 'awaiting_payment' || (!s.freightPaid && (s.freightFeeUSD || 0) > 0);
    }
    if (shipmentFilter === 'in_transit') {
      return ['ready_for_dispatch', 'paid — preparing for shipment', 'dispatched', 'in_transit', 'in transit', 'customs_clearance', 'customs clearance', 'arrived', 'arrived destination', 'ready_for_pickup', 'ready for pickup', 'out_for_delivery', 'out for delivery'].includes(st);
    }
    if (shipmentFilter === 'completed') {
      return ['delivered', 'completed'].includes(st);
    }
    return true;
  });

  // Dynamic filter counts for sub-navigation badge alignment
  const shipmentCounts = useMemo(() => {
    let active = 0;
    let awaitingPayment = 0;
    let inTransit = 0;
    let completed = 0;

    for (const s of shipments) {
      const st = String(s.currentStatus || s.status || '').toLowerCase();
      if (!['delivered', 'completed', 'cancelled', 'returned'].includes(st)) {
        active++;
      }
      if (s.paymentStatus === 'awaiting_payment' || st === 'awaiting payment' || st === 'awaiting_payment' || (!s.freightPaid && (s.freightFeeUSD || 0) > 0)) {
        awaitingPayment++;
      }
      if (['ready_for_dispatch', 'paid — preparing for shipment', 'dispatched', 'in_transit', 'in transit', 'customs_clearance', 'customs clearance', 'arrived', 'arrived destination', 'ready_for_pickup', 'ready for pickup', 'out_for_delivery', 'out for delivery'].includes(st)) {
        inTransit++;
      }
      if (['delivered', 'completed'].includes(st)) {
        completed++;
      }
    }

    return {
      all: shipments.length,
      active,
      awaiting_payment: awaitingPayment,
      in_transit: inTransit,
      completed
    };
  }, [shipments]);


  const calculatedCostUSD = calculationResult.totalCostUSD;
  const calculatedCostNGN = calculationResult.totalCostNGN;

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950">
      <Header title="Logistics & Shipping" />

      {/* Global Freight Network Status Ribbon */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-300 font-semibold truncate">
            Air Express & Regular (CAN ➔ LOS): <span className="text-emerald-400">Daily Departures</span> • Direct Air Customs Clearance
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:inline-block">
          Air Freight Network Active
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* World-Standard Quick Track Bar */}
        <form onSubmit={handleQuickTrack} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              value={quickTrackQuery}
              onChange={(e) => setQuickTrackQuery(e.target.value)}
              placeholder="Track any shipment code, waybill, or SF tracking..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors shadow-inner font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </form>

        {/* Global Logistics Quick-Launch Action Deck */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => navigate('register-package')}
            className="p-3.5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 shadow-lg cursor-pointer group active:scale-95 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
              Register a Shipment
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Pre-alert parcels from 1688, Taobao & China factories
            </p>
          </div>

          <div
            onClick={() => navigate('track')}
            className="p-3.5 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 shadow-lg cursor-pointer group active:scale-95 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
              Track a Shipment
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Live flight checkpoints, customs status & photo proofs
            </p>
          </div>
        </div>

        {/* Customer Unique Shipping Mark Card (Standard Global Barcode Format) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>YOUR PERSONAL SHIPPING MARK</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black shadow-sm">
              {uniqueUserId}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block font-sans">
                OFFICIAL CARRIER & CARTON MARKING:
              </span>
              <p className="font-mono text-sm sm:text-base font-black text-emerald-400 select-all tracking-tight break-all">
                {customerShippingMark}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(customerShippingMark, 'mark', 'Shipping Mark copied to clipboard!')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {copiedId === 'mark' ? <CheckCheck className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
              <span>{copiedId === 'mark' ? 'Copied!' : 'Copy Full Mark'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
            Instruct your 1688, Taobao, or factory suppliers to write this exact mark on all cartons and waybills. Once delivered to our warehouse dock, admin scans this code to instantly attach incoming parcels to your dashboard.
          </p>
        </div>

        {/* World-Standard Global Logistics Navigation Bar */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl -mx-4 px-4 py-2 border-y border-slate-800/80 shadow-md">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-full relative">
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex flex-row items-center justify-center gap-2 relative z-10 ${
                activeTab === 'services' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 shrink-0" />
              <span>Services</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipments')}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex flex-row items-center justify-center gap-2 relative z-10 ${
                activeTab === 'shipments' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">My Cargo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('warehouses')}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex flex-row items-center justify-center gap-2 relative z-10 ${
                activeTab === 'warehouses' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Hubs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer flex flex-row items-center justify-center gap-2 relative z-10 ${
                activeTab === 'calculator' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span>Estimator</span>
            </button>
          </div>
        </div>


        {/* ======================================================== */}
        {/* TAB 1: SHIPPING SERVICES (CHINA & USA) */}
        {/* ======================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* SERVICE CARD 1: CHINA TO NIGERIA (PRIMARY CORE ROUTE) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                    🇳🇬
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                        China to Nigeria Shipping
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                        Primary Hub
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium truncate">Guangzhou • Yiwu • Foshan • Shenzhen • Hong Kong ➔ Lagos, Abuja, Kano, PH, Onitsha</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                  Daily Intake
                </span>
              </div>

              {/* Rate Badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-center space-y-1">
                  <span className="text-[10px] font-extrabold text-cyan-400 block uppercase tracking-wider">Air Express</span>
                  <p className="text-sm sm:text-base font-black text-white">₦{Math.round(11.5 * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}<span className="text-[10px] text-slate-300 font-semibold">/kg</span></p>
                  <span className="text-[10px] font-mono text-slate-400 block">≈ ¥{(11.5 * (logisticsFxRates.usdToCny || 7.25)).toFixed(1)} RMB</span>
                  <span className="text-[10px] font-bold text-cyan-300 block bg-cyan-950/60 py-0.5 rounded-md border border-cyan-800/40">3–5 Days</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-center space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-400 block uppercase tracking-wider">Air Regular</span>
                  <p className="text-sm sm:text-base font-black text-white">₦{Math.round(9.5 * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}<span className="text-[10px] text-slate-300 font-semibold">/kg</span></p>
                  <span className="text-[10px] font-mono text-slate-400 block">≈ ¥{(9.5 * (logisticsFxRates.usdToCny || 7.25)).toFixed(1)} RMB</span>
                  <span className="text-[10px] font-bold text-emerald-300 block bg-emerald-950/60 py-0.5 rounded-md border border-emerald-800/40">7–10 Days</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setWarehouseRegion('china');
                    setActiveTab('warehouses');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">View 5 China Hub Addresses</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('register-package', 'china')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-700/60 shrink-0"
                >
                  <span>Ship to Nigeria</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Value Added Features */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Why Ship With FlyeMass?
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-emerald-400 font-extrabold text-xs block">✓ Clear Customs Tariff</span>
                  <p className="text-[11px] text-slate-300 leading-snug">All destination customs duty & clearance included in our freight quote.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-cyan-400 font-extrabold text-xs block">✓ Free Consolidation</span>
                  <p className="text-[11px] text-slate-300 leading-snug">Combine multiple 1688 or China factory orders into one waybill to save freight.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-amber-400 font-extrabold text-xs block">✓ Multi-Currency Settlement</span>
                  <p className="text-[11px] text-slate-300 leading-snug">Pay freight securely using your Naira (NGN) or RMB (CNY) wallet balances.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-indigo-400 font-extrabold text-xs block">✓ Doorstep Delivery</span>
                  <p className="text-[11px] text-slate-300 leading-snug">Collect at MMIA Terminal or request direct dispatch to any state in Nigeria.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MY SHIPMENTS & ACTIVE WAYBILLS */}
        {/* ======================================================== */}
        {activeTab === 'shipments' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Status Filter Pills with Responsive Horizontal Scroll & Edge Fade */}
            <div className="relative -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 pr-10">
                {[
                  { id: 'all', label: 'All Shipments', count: shipmentCounts.all },
                  { id: 'active', label: 'Active Cargo', count: shipmentCounts.active },
                  { id: 'awaiting_payment', label: 'Awaiting Payment', count: shipmentCounts.awaiting_payment },
                  { id: 'in_transit', label: 'In Transit', count: shipmentCounts.in_transit },
                  { id: 'completed', label: 'Completed', count: shipmentCounts.completed }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setShipmentFilter(f.id as any)}
                    className={`relative z-10 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      shipmentFilter === f.id
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                      shipmentFilter === f.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
              {/* Fade gradient cue on the right */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent" />
            </div>

            {filteredShipments.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Shipments Found</h4>
                <p className="text-xs text-slate-400">Pre-register incoming China parcels to track them live.</p>
                <button
                  type="button"
                  onClick={() => navigate('register-package')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Register First Parcel
                </button>
              </div>
            ) : (
              filteredShipments.map((shipment) => {
                const isUnbilled = !shipment.freightFeeUSD && !shipment.freightFee && !shipment.freightPaid;
                const isPendingPayment = shipment.paymentStatus === 'awaiting_payment' || (!shipment.freightPaid && (shipment.freightFeeUSD || 0) > 0);
                const isDeferred = shipment.paymentStatus === 'deferred' || shipment.paymentTiming === 'pay_on_arrival';
                const isPaid = shipment.freightPaid || shipment.paymentStatus === 'paid';

                const destinationDisplay = (shipment.destinationHub || shipment.pickupHub || 'Ikeja MMIA')
                  .replace(' Cargo Hub (Lagos)', '')
                  .replace(' (Lagos)', '');

                return (
                  <div
                    key={shipment.trackingNumber || shipment.id}
                    onClick={() => navigate('track', shipment.trackingNumber || shipment.shipmentCode || shipment.trackingCode)}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-lg space-y-3.5 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                          <Plane className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-400 transition-colors font-mono tracking-tight">
                              {shipment.shipmentCode || shipment.trackingCode || shipment.trackingNumber}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px] uppercase font-bold shrink-0">
                              🇨🇳 China • {shipment.type || 'air'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1 leading-snug">
                            {shipment.title || 'General Cargo / Merchandise'}
                          </p>
                          {shipment.chineseCourierTracking && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-bold text-[9px] shrink-0">
                                {shipment.courierCompany || 'SF Express'}
                              </span>
                              <span className="text-slate-300 font-semibold truncate max-w-[160px]">
                                {shipment.chineseCourierTracking}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5 max-w-[42%]">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider block text-center whitespace-nowrap shadow-xs">
                          {shipment.status || shipment.currentStatus || 'In Transit'}
                        </span>
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[9px] font-bold block text-center whitespace-nowrap">
                            ✓ Freight Paid
                          </span>
                        )}
                        {isPendingPayment && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[9px] font-bold block text-center whitespace-nowrap">
                            Due: ₦{(shipment.freightFeeNGN || Math.round((shipment.freightFeeUSD || shipment.costEstimate || 0) * (logisticsFxRates.usdToNgn || 1400))).toLocaleString()}
                          </span>
                        )}
                        {isDeferred && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[9px] font-bold block text-center whitespace-nowrap">
                            Pay on Arrival
                          </span>
                        )}
                        {isUnbilled && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[9px] font-medium block text-center whitespace-nowrap">
                            Quotation Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-[10px]">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Weight / Billable</span>
                        <span className="font-extrabold text-white text-[11px] sm:text-xs num-tabular mt-0.5 block">
                          {shipment.billableWeightKg || shipment.weightKg || 5} kg
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Lagos Destination</span>
                        <span 
                          className="font-extrabold text-white text-[11px] sm:text-xs leading-tight block break-words mt-0.5 line-clamp-2"
                          title={shipment.destinationHub || shipment.pickupHub || 'Ikeja MMIA'}
                        >
                          {destinationDisplay}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Estimated Transit</span>
                        <span className="font-extrabold text-emerald-400 text-[11px] sm:text-xs mt-0.5 block">
                          {shipment.eta || 'In 3-5 days'}
                        </span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80 gap-2">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5 min-w-0 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">🇨🇳 {shipment.originWarehouse || 'China Hub'} ➔ {((shipment as any).destinationCountry || 'Nigeria')}</span>
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: WAREHOUSES & HUBS (CHINA CENTRAL INTAKE HUBS) */}
        {/* ======================================================== */}
        {activeTab === 'warehouses' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header info badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇨🇳</span>
                <div>
                  <span className="font-bold text-white block">China Central Intake Terminals</span>
                  <span className="text-[10px] text-emerald-300">Guangzhou • Yiwu • Foshan • Shenzhen • Hong Kong</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
                {liveWarehouses.filter(w => w.country.toLowerCase() === 'china').length} Active Hubs
              </span>
            </div>

            {/* Warehouse Cards List */}
            {liveWarehouses.filter(w => w.country.toLowerCase() === 'china').map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇨🇳</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{wh.hubName || wh.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold">{wh.type || 'Central Cargo Terminal'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                    {wh.city}, {wh.province || wh.country}
                  </span>
                </div>

                {/* Address Box (Chinese Format for Suppliers) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      中文收件信息 (Chinese Format for Suppliers)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`FlyeMass Warehouse (Attn: ${userName} - ${uniqueUserId})\n${wh.recipientZh ? `收件人: ${wh.recipientZh}\n` : ''}Phone: ${wh.phone}\nAddress: ${wh.addressZh || wh.addressEn}\nPostal Code: ${wh.postalCode}\nShipping Mark: ${customerShippingMark}`, wh.id, 'Full China warehouse address copied!')}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      {copiedId === wh.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === wh.id ? 'Copied' : 'Copy Full Address'}</span>
                    </button>
                  </div>

                  <div className="text-xs space-y-2 text-slate-200">
                    <p><span className="text-slate-400 font-semibold">收件仓库 (Attn): </span><strong className="text-white font-bold">FlyeMass Warehouse (Attn: {userName} - {uniqueUserId})</strong></p>
                    <p><span className="text-slate-400 font-semibold">收件人 (Recipient): </span><strong className="text-white font-bold">{wh.recipientZh || wh.contactPerson || 'Chen Wei'}</strong></p>
                    <p><span className="text-slate-400 font-semibold">联系电话 (Phone): </span><strong className="text-emerald-400 font-mono font-bold">{wh.phone}</strong></p>
                    <p><span className="text-slate-400 font-semibold">详细地址 (Address): </span><span className="text-slate-100 select-all font-sans font-medium">{wh.addressZh || wh.addressEn}</span></p>
                    <p><span className="text-slate-400 font-semibold">邮政编码 (Zip): </span><span className="font-mono text-slate-300 font-bold">{wh.postalCode}</span></p>
                    <p><span className="text-slate-400 font-semibold">进仓唛头 (Mark): </span><span className="font-mono text-emerald-400 font-black">{customerShippingMark} ({uniqueUserId})</span></p>
                  </div>
                </div>

                {/* English Format Box for International Vendors */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">English Equivalent</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`FlyeMass Warehouse (Attn: ${userName} - ${uniqueUserId})\nPhone: ${wh.phone}\nAddress: ${wh.addressEn}\nZip: ${wh.postalCode}\nShipping Mark: ${customerShippingMark}`, `${wh.id}-en`, 'English warehouse format copied!')}
                      className="text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === `${wh.id}-en` ? 'Copied' : 'Copy English Address'}</span>
                    </button>
                  </div>
                  <p><span className="text-slate-400 font-semibold">Attn:</span> <span className="text-slate-200">FlyeMass Warehouse (Attn: {userName} - {uniqueUserId})</span></p>
                  <p><span className="text-slate-400 font-semibold">Address:</span> <span className="text-slate-200">{wh.addressEn}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RATE ESTIMATOR */}
        {/* ======================================================== */}
        {activeTab === 'calculator' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Live Freight Rate Estimator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate landed shipping costs to Nigeria with customs clearance included.
              </p>
            </div>

            {/* China Central Origin Hub Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🇨🇳</span>
                <div>
                  <span className="font-bold text-white block">Origin Hub: China Central Clearing</span>
                  <span className="text-[10px] text-slate-400">Guangzhou • Yiwu • Foshan • Shenzhen • Hong Kong</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                Primary Hub
              </span>
            </div>

            {/* Active Corridor Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Cargo Corridor</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🇨🇳 China</span>
                  <span className="text-emerald-400">➔</span>
                  <span>🇳🇬 Nigeria (Direct Cargo Corridor)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                  Exclusive Route
                </span>
              </div>
            </div>

            {/* Destination Hub / Surcharge Option */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Nigeria Destination Hub & State
              </label>
              <div className="relative">
                {activeCorridor.destinationHubSurcharges && activeCorridor.destinationHubSurcharges.length > 0 ? (
                  <select
                    value={selectedDestinationHubId}
                    onChange={(e) => setSelectedDestinationHubId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    {activeCorridor.destinationHubSurcharges.map(h => (
                      <option key={h.hubId} value={h.hubId}>
                        🇳🇬 {h.name} ({h.state}) {h.airSurchargeUSD ? `[+₦${Math.round(h.airSurchargeUSD * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}/kg air]` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono flex items-center justify-between">
                    <span>{activeCorridor.flag} {activeCorridor.destinationHub}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Standard Terminal</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalcMode('air_express')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  calcMode === 'air_express'
                    ? 'bg-slate-950 border-cyan-500 text-cyan-400 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Plane className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                <span className="text-[11px] font-black block text-white">Air Express</span>
                <span className="text-xs font-black text-cyan-400 block mt-0.5">₦{Math.round(activeCorridor.airExpressRateUSD * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}<span className="text-[10px] text-slate-300 font-semibold">/kg</span></span>
                <span className="text-[10px] font-mono text-slate-400 block">≈ ¥{(activeCorridor.airExpressRateUSD * (logisticsFxRates.usdToCny || 7.25)).toFixed(1)} RMB</span>
                <span className="text-[10px] font-bold text-cyan-300 block bg-cyan-950/60 py-0.5 rounded mt-1 border border-cyan-800/40">{activeCorridor.airExpressDeliveryDays}</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('air_regular')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  calcMode === 'air_regular'
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Plane className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-[11px] font-black block text-white">Air Regular</span>
                <span className="text-xs font-black text-emerald-400 block mt-0.5">₦{Math.round(activeCorridor.airRegularRateUSD * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}<span className="text-[10px] text-slate-300 font-semibold">/kg</span></span>
                <span className="text-[10px] font-mono text-slate-400 block">≈ ¥{(activeCorridor.airRegularRateUSD * (logisticsFxRates.usdToCny || 7.25)).toFixed(1)} RMB</span>
                <span className="text-[10px] font-bold text-emerald-300 block bg-emerald-950/60 py-0.5 rounded mt-1 border border-emerald-800/40">{activeCorridor.airRegularDeliveryDays}</span>
              </button>
            </div>

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
            </div>

            {/* Estimated Total Card & Breakdown (Naira & RMB Only) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    Estimated Freight Total ({calcMode === 'air_express' ? 'Air Express' : 'Air Regular'}):
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {calculationResult.formulaDescription}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-400 num-tabular">
                  ₦{calculatedCostNGN.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                <span>RMB Equivalent (Chinese Yuan):</span>
                <span className="font-extrabold text-amber-400 num-tabular">
                  ¥{calculationResult.totalCostCNY.toFixed(2)} RMB
                </span>
              </div>

              {/* Instant 2-Mode Comparison Breakdown */}
              <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Compare Speed Options ({activeCorridor.name})
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  <div 
                    onClick={() => setCalcMode('air_express')}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      calcMode === 'air_express' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold block text-slate-300">Air Express</span>
                    <span className="text-xs font-black text-cyan-400 block num-tabular my-0.5">
                      ₦{Math.round(calculationResult.comparisons.airExpress.totalUSD * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">
                      ≈ ¥{Number((calculationResult.comparisons.airExpress.totalUSD * (logisticsFxRates.usdToCny || 7.25)).toFixed(1))} RMB
                    </span>
                    <span className="text-[9px] font-bold text-cyan-300/90 block bg-cyan-950/50 py-0.5 rounded">{calculationResult.comparisons.airExpress.days}</span>
                  </div>

                  <div 
                    onClick={() => setCalcMode('air_regular')}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      calcMode === 'air_regular' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold block text-slate-300">Air Regular</span>
                    <span className="text-xs font-black text-emerald-400 block num-tabular my-0.5">
                      ₦{Math.round(calculationResult.comparisons.airRegular.totalUSD * (logisticsFxRates.usdToNgn || 1400)).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">
                      ≈ ¥{Number((calculationResult.comparisons.airRegular.totalUSD * (logisticsFxRates.usdToCny || 7.25)).toFixed(1))} RMB
                    </span>
                    <span className="text-[9px] font-bold text-emerald-300/90 block bg-emerald-950/50 py-0.5 rounded">{calculationResult.comparisons.airRegular.days}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 pt-1 leading-relaxed font-medium">
                * All tariffs, customs duties, port clearance, and destination handling at {calculationResult.destinationHub} included.
              </p>
            </div>

            <button
              onClick={() => navigate('register-package')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register Package Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};