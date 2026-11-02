import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
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
  ExternalLink,
  CreditCard,
  DollarSign,
  AlertCircle,
  Truck,
  Image,
  X,
  Building,
  Home,
  Package,
  Layers,
  Key
} from 'lucide-react';
import { Shipment, Currency, ShipmentDocument } from '../../types';

export const TrackShipmentScreen: React.FC = () => {
  const { shipments, showToast, activeUserId, wallets, userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modals
  const [showPayFreightModal, setShowPayFreightModal] = useState(false);
  const [paymentWallet, setPaymentWallet] = useState<Currency>('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, []);

  const dbShipments: ShipmentDocument[] = db.getShipments();

  // Combine and find selected shipment
  const activeShipment = React.useMemo(() => {
    if (!selectedIdentifier && shipments.length > 0) {
      return shipments[0];
    }
    // Match by shipmentCode, trackingCode, trackingNumber, or chineseCourierTracking
    const found = shipments.find(s => 
      s.trackingNumber === selectedIdentifier ||
      s.shipmentCode === selectedIdentifier ||
      s.trackingCode === selectedIdentifier ||
      s.chineseCourierTracking === selectedIdentifier ||
      s.id === selectedIdentifier
    );
    return found || shipments[0] || null;
  }, [selectedIdentifier, shipments]);

  // Read latest db doc
  const dbShip = React.useMemo(() => {
    if (!activeShipment) return null;
    return dbShipments.find(s => 
      s.id === activeShipment.id || 
      s.trackingNumber === activeShipment.trackingNumber ||
      s.shipmentCode === activeShipment.shipmentCode
    ) || null;
  }, [activeShipment, dbShipments]);

  // Filtered shipments by search
  const filteredShipments = React.useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    const q = searchQuery.toLowerCase().trim();
    return shipments.filter(s => 
      s.trackingNumber.toLowerCase().includes(q) ||
      s.shipmentCode?.toLowerCase().includes(q) ||
      s.trackingCode?.toLowerCase().includes(q) ||
      s.chineseCourierTracking?.toLowerCase().includes(q) ||
      s.title?.toLowerCase().includes(q)
    );
  }, [searchQuery, shipments]);

  const handleCopy = (text: string, id: string, msg: string = 'Copied to clipboard!') => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(msg, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAuthorizeFreightPayment = async (pin: string) => {
    if (!activeShipment) return;
    setIsProcessing(true);
    try {
      const shipId = dbShip?.id || activeShipment.id || activeShipment.trackingNumber;
      const res = await db.payFreight(shipId, activeUserId, paymentWallet, pin);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      setShowPayFreightModal(false);
      showToast(`Freight settled via ${paymentWallet} wallet! Cleared for dispatch.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Payment processing error', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeferPayment = async () => {
    if (!activeShipment) return;
    if (!window.confirm('Confirm Pay on Arrival? You will settle the freight charge upon package collection at Lagos.')) return;
    try {
      const shipId = dbShip?.id || activeShipment.id || activeShipment.trackingNumber;
      const res = await db.deferShipmentPayment(shipId, activeUserId);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast('Freight payment deferred to Lagos arrival!', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to defer payment', 'error');
    }
  };

  if (!activeShipment) {
    return (
      <div className="min-h-full pb-24 bg-slate-950 text-white">
        <Header title="Cargo Tracker" />
        <div className="p-8 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Shipments Found</h3>
          <p className="text-xs text-slate-400">Pre-register incoming parcels from China to begin tracking.</p>
        </div>
      </div>
    );
  }

  // Freight & Payment Status
  const paymentStatus = dbShip?.paymentStatus || activeShipment.paymentStatus || (activeShipment.freightPaid ? 'paid' : 'awaiting_payment');
  const isFreightPaid = paymentStatus === 'paid' || activeShipment.freightPaid;
  const isDeferred = paymentStatus === 'deferred' || dbShip?.paymentTiming === 'pay_on_arrival';
  const freightCostUSD = dbShip?.freightFeeUSD || activeShipment.freightFeeUSD || dbShip?.costEstimate || activeShipment.costEstimate || 95;
  const freightCostNGN = dbShip?.freightFeeNGN || activeShipment.freightFeeNGN || freightCostUSD * 1485;
  const freightCostCNY = dbShip?.freightFeeCNY || activeShipment.freightFeeCNY || Number((freightCostUSD * 7.24).toFixed(2));

  // Weights & Volumes
  const actualWeight = dbShip?.actualWeightKg || activeShipment.actualWeightKg || activeShipment.weightKg || 5;
  const billableWeight = dbShip?.billableWeightKg || activeShipment.billableWeightKg || actualWeight;
  const cbm = dbShip?.cbm || activeShipment.cbm || 0.05;

  // 6-Stage Timeline Configuration
  const STAGES_6 = [
    { key: 'registered', title: 'Package Registered', sub: 'Pre-alert received from supplier' },
    { key: 'received', title: 'Received at China Warehouse', sub: 'Inspected, weighed & barcode sealed' },
    { key: 'in_transit', title: 'In Transit — Departed China', sub: 'Loaded on flight container or vessel' },
    { key: 'customs', title: 'Customs Clearance', sub: 'Lagos seaport/airport clearing bond' },
    { key: 'arrived', title: 'Arrived at Lagos Hub', sub: 'Ready for collection or doorstep dispatch' },
    { key: 'delivered', title: 'Delivered / Completed', sub: 'Handed over with 6-digit OTP verified' }
  ];

  // Map currentStatus to stage index (0 to 5)
  const currentStatusRaw = (dbShip?.currentStatus || activeShipment.currentStatus || 'registered').toLowerCase();
  let activeStageIdx = 0;
  if (currentStatusRaw === 'registered') activeStageIdx = 0;
  else if (['received_warehouse', 'inspection', 'packed', 'awaiting_payment'].includes(currentStatusRaw)) activeStageIdx = 1;
  else if (['ready_for_dispatch', 'dispatched', 'in_transit'].includes(currentStatusRaw)) activeStageIdx = 2;
  else if (currentStatusRaw === 'customs_clearance') activeStageIdx = 3;
  else if (['arrived', 'ready_for_pickup', 'out_for_delivery'].includes(currentStatusRaw)) activeStageIdx = 4;
  else if (['delivered', 'completed'].includes(currentStatusRaw)) activeStageIdx = 5;
  else {
    activeStageIdx = activeShipment.currentStep || 1;
  }

  // Inspection Photos
  const inspectionPhotos = dbShip?.inspectionPhotos || activeShipment.inspectionPhotos || [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
  ];

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Cargo Waybill Tracker" />

      <div className="p-4 space-y-4">
        {/* Search Bar for Code Lookups */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SL-2026-..., FMCN..., SF Express, or item..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Waybill Horizontal Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {filteredShipments.map((s) => {
            const isSelected = (s.trackingNumber === activeShipment.trackingNumber) || (s.shipmentCode === activeShipment.shipmentCode);
            return (
              <button
                key={s.trackingNumber}
                onClick={() => setSelectedIdentifier(s.shipmentCode || s.trackingNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.type === 'air' ? '✈ ' : '🚢 '} {s.shipmentCode || s.trackingNumber}
              </button>
            );
          })}
        </div>

        {/* Primary Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Shipment Code:</span>
              <span className="font-mono font-black text-white text-xs">
                {activeShipment.shipmentCode || activeShipment.trackingNumber}
              </span>
              <button
                onClick={() => handleCopy(activeShipment.shipmentCode || activeShipment.trackingNumber, 'main-code')}
                className="text-slate-400 hover:text-white p-0.5"
              >
                {copiedId === 'main-code' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
              {activeShipment.status}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-white">{activeShipment.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Origin: {activeShipment.originWarehouse || activeShipment.origin} • Destination: {activeShipment.destinationHub || activeShipment.pickupHub || 'Lagos Ikeja Hub'}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Gross / Billable</span>
              <span className="font-bold text-slate-200 num-tabular">
                {actualWeight} kg / <strong className="text-emerald-400">{billableWeight} kg</strong>
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Volume (CBM)</span>
              <span className="font-bold text-slate-200 num-tabular">{cbm} CBM</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Est. Landed ETA</span>
              <span className="font-bold text-emerald-400">{activeShipment.eta}</span>
            </div>
          </div>
        </div>

        {/* FREIGHT PAYMENT CARD */}
        {isFreightPaid ? (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="block font-black text-white">Freight Settled in Full (${freightCostUSD} USD)</span>
                <span className="text-[10px] text-emerald-400 font-normal">Air Waybill Released & Bond Customs Cleared</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              PAID
            </span>
          </div>
        ) : isDeferred ? (
          <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Pay on Arrival (Payable at Lagos Hub)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                DEFERRED
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Amount Due at Lagos Handover: <strong className="text-white">${freightCostUSD} USD</strong> (≈ ₦{freightCostNGN.toLocaleString()} NGN). You can pay via cash/transfer at the pickup counter.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Freight Settlement Pending
                </span>
                <p className="text-base font-extrabold text-white mt-0.5 num-tabular">
                  ${freightCostUSD.toLocaleString()} USD
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    (≈ ₦{freightCostNGN.toLocaleString()} NGN / ¥{freightCostCNY} CNY)
                  </span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300">
              Pay immediately from your multi-currency wallet, or defer to settle upon collection in Lagos.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowPayFreightModal(true)}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center"
              >
                Pay Freight Now
              </button>
              <button
                onClick={handleDeferPayment}
                className="py-3 px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:border-slate-600 active:scale-95 transition-all text-center"
              >
                Pay on Arrival
              </button>
            </div>
          </div>
        )}

        {/* 6-STAGE TIMELINE */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              6-Stage Cargo Timeline
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Stage {activeStageIdx + 1} of 6
            </span>
          </div>

          <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {STAGES_6.map((stg, index) => {
              const isPast = index < activeStageIdx;
              const isCurrent = index === activeStageIdx;
              const isUpcoming = index > activeStageIdx;

              return (
                <div key={stg.key} className="relative group">
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
                    <h4 className={`text-xs font-bold ${
                      isCurrent ? 'text-emerald-400' : isPast ? 'text-white' : 'text-slate-500'
                    }`}>
                      {stg.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stg.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LAGOS HANDOVER / SECURE PICKUP OTP CARD */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-400" />
              Lagos Handover & Verification
            </span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase">
              {activeShipment.deliveryType === 'doorstep' ? 'Doorstep Delivery' : 'Pickup Hub'}
            </span>
          </div>

          {activeShipment.deliveryType === 'doorstep' ? (
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-500">Destination Address: </span><strong className="text-white">{activeShipment.doorstepAddress?.street || '14 Broad Street, Marina, Lagos'}</strong></p>
              <p><span className="text-slate-500">City & State: </span><span>{activeShipment.doorstepAddress?.city || 'Lagos Island'}, {activeShipment.doorstepAddress?.state || 'Lagos'}</span></p>
              <p><span className="text-slate-500">Dispatch Contact: </span><span className="font-mono text-emerald-400">{activeShipment.doorstepAddress?.phone || userProfile?.phone}</span></p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs space-y-1 text-slate-300">
                <p><span className="text-slate-500">Collection Terminal: </span><strong className="text-white">{activeShipment.pickupHub || 'Ikeja MMIA Cargo Hub (Lagos)'}</strong></p>
                <p className="text-[11px] text-slate-400">Cargo Village, Murtala Muhammed International Airport, Ikeja</p>
              </div>

              {/* Secure 6-Digit Pickup OTP Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    Secure 6-Digit Pickup OTP
                  </span>
                  <button
                    onClick={() => handleCopy(dbShip?.pickupOtp || activeShipment.pickupOtp || '682104', 'otp-code', 'Pickup OTP copied!')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    {copiedId === 'otp-code' ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'otp-code' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-center py-2 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
                  <span className="font-mono text-2xl font-black tracking-widest text-white num-tabular">
                    {dbShip?.pickupOtp || activeShipment.pickupOtp || '682104'}
                  </span>
                </div>

                <p className="text-[10px] text-amber-300/90 leading-tight">
                  ⚠️ Present this 6-digit code to the warehouse officer at the counter to verify and release your parcel.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* WAREHOUSE INSPECTION PHOTOS GALLERY */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-emerald-400" />
              China Dock Inspection Photos ({inspectionPhotos.length})
            </span>
            <span className="text-[10px] text-slate-400">Tap to expand</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {inspectionPhotos.map((url, i) => (
              <div
                key={i}
                onClick={() => setPreviewPhotoUrl(url)}
                className="relative rounded-2xl overflow-hidden aspect-video border border-slate-800 cursor-pointer group hover:border-emerald-500 transition-colors"
              >
                <img src={url} alt="Inspection" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] font-bold text-slate-200">Photo #{i + 1} • Carton Intake</span>
                </div>
              </div>
            ))}
          </div>

          {dbShip?.inspectionNotes && (
            <p className="text-[11px] text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <strong className="text-slate-400">Inspection Note: </strong>
              {dbShip.inspectionNotes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              handleCopy(
                `Tracking Waybill: ${activeShipment.shipmentCode || activeShipment.trackingNumber}\nStatus: ${activeShipment.status}\nDestination: Lagos Hub`,
                'share',
                'Shipment details copied!'
              );
            }}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Waybill</span>
          </button>

          <button
            onClick={() => showToast('Generating Air Waybill (AWB) PDF with Customs Seal...', 'success')}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Air Waybill (AWB)</span>
          </button>
        </div>
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhotoUrl} alt="Preview" className="w-full object-cover max-h-[70vh]" />
            <div className="p-4 bg-slate-950 text-xs text-slate-300">
              China Warehouse Dock Intake Inspection Photo
            </div>
          </div>
        </div>
      )}

      {/* PAY FREIGHT MODAL */}
      {showPayFreightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Multi-Wallet Freight Debit
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Settlement for #{activeShipment.shipmentCode || activeShipment.trackingNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Chargeable Fee: <strong className="text-emerald-400">${freightCostUSD} USD</strong> (≈ ₦{freightCostNGN.toLocaleString()} NGN)
              </p>
            </div>

            {/* Wallet Selector: USD, NGN, CNY */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Debit From Wallet:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['USD', 'NGN', 'CNY'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setPaymentWallet(curr)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all ${
                      paymentWallet === curr
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {curr === 'USD' && '🇺🇸 USD'}
                    {curr === 'NGN' && '🇳🇬 NGN'}
                    {curr === 'CNY' && '🇨🇳 CNY'}
                  </button>
                ))}
              </div>
            </div>

            {/* 6-Digit PIN Pad */}
            <PinPad
              title="Authorize Freight Debit"
              subtitle={`Confirm payment of ${
                paymentWallet === 'USD'
                  ? `$${freightCostUSD} USD`
                  : paymentWallet === 'NGN'
                  ? `₦${freightCostNGN.toLocaleString()} NGN`
                  : `¥${freightCostCNY} CNY`
              }`}
              onComplete={handleAuthorizeFreightPayment}
              onCancel={() => setShowPayFreightModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};