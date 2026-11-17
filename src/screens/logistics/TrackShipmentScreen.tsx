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
  Key,
  RefreshCw,
  Phone,
  UserCheck
} from 'lucide-react';
import { Shipment, Currency, ShipmentDocument, LagosHub } from '../../types';

export const TrackShipmentScreen: React.FC = () => {
  const { shipments, showToast, activeUserId, wallets, userProfile, routeParam, navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modals
  const [showPayFreightModal, setShowPayFreightModal] = useState(false);
  const [paymentWallet, setPaymentWallet] = useState<Currency>('NGN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchResult, setOnlineSearchResult] = useState<ShipmentDocument | null>(null);

  // Fulfillment Method Conversion Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertMethod, setConvertMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [lagosHubsList, setLagosHubsList] = useState<LagosHub[]>(() => db.getLagosHubs(true));
  const [convertHubId, setConvertHubId] = useState<string>('HUB-IKEJA');
  const [convertStreet, setConvertStreet] = useState<string>('14 Broad Street, Marina');
  const [convertCity, setConvertCity] = useState<string>('Lagos Island');
  const [convertState, setConvertState] = useState<string>('Lagos');
  const [convertNotes, setConvertNotes] = useState<string>('Call before dispatch');
  const [convertPhone, setConvertPhone] = useState<string>(userProfile?.phone || '+234 803 555 9201');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    db.lagosHubsQuery(true).then((hubs) => {
      if (isMounted && hubs && hubs.length > 0) {
        setLagosHubsList(hubs);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (routeParam && typeof routeParam === 'string' && routeParam.trim()) {
      const q = routeParam.trim();
      setSelectedIdentifier(q);
      setSearchQuery(q);
    }
  }, [routeParam]);

  const dbShipments: ShipmentDocument[] = db.getShipments();

  // Combine user shipments with any searched online shipment
  const allShipments = React.useMemo(() => {
    const list = [...shipments];
    if (onlineSearchResult && !list.find(s => s.id === onlineSearchResult.id || s.trackingNumber === onlineSearchResult.trackingNumber || s.trackingCode === onlineSearchResult.trackingCode)) {
      list.unshift(onlineSearchResult as any);
    }
    return list;
  }, [shipments, onlineSearchResult]);

  // Combine and find selected shipment
  const activeShipment = React.useMemo(() => {
    if (!selectedIdentifier && allShipments.length > 0) {
      return allShipments[0];
    }
    const found = allShipments.find(s => 
      s.trackingNumber === selectedIdentifier ||
      s.platformCode === selectedIdentifier ||
      s.shipmentCode === selectedIdentifier ||
      s.trackingCode === selectedIdentifier ||
      s.chineseCourierTracking === selectedIdentifier ||
      s.id === selectedIdentifier
    );
    return found || allShipments[0] || null;
  }, [selectedIdentifier, allShipments]);

  // Read latest db doc
  const dbShip = React.useMemo(() => {
    if (!activeShipment) return null;
    return dbShipments.find(s => 
      s.id === activeShipment.id || 
      s.platformCode === activeShipment.platformCode ||
      s.trackingNumber === activeShipment.trackingNumber ||
      s.shipmentCode === activeShipment.shipmentCode ||
      s.trackingCode === activeShipment.trackingCode
    ) || null;
  }, [activeShipment, dbShipments]);

  // Filtered shipments by search
  const filteredShipments = React.useMemo(() => {
    if (!searchQuery.trim()) return allShipments;
    const q = searchQuery.toLowerCase().trim();
    return allShipments.filter(s => 
      s.trackingNumber.toLowerCase().includes(q) ||
      s.platformCode?.toLowerCase().includes(q) ||
      s.shipmentCode?.toLowerCase().includes(q) ||
      s.trackingCode?.toLowerCase().includes(q) ||
      s.chineseCourierTracking?.toLowerCase().includes(q) ||
      s.title?.toLowerCase().includes(q)
    );
  }, [searchQuery, allShipments]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    const localMatch = allShipments.find(s => 
      s.trackingNumber.toLowerCase().includes(q.toLowerCase()) ||
      s.platformCode?.toLowerCase().includes(q.toLowerCase()) ||
      s.shipmentCode?.toLowerCase().includes(q.toLowerCase()) ||
      s.trackingCode?.toLowerCase().includes(q.toLowerCase()) ||
      s.chineseCourierTracking?.toLowerCase().includes(q.toLowerCase()) ||
      (s.id && s.id.toLowerCase() === q.toLowerCase())
    );
    if (localMatch) {
      setSelectedIdentifier(localMatch.platformCode || localMatch.shipmentCode || localMatch.trackingNumber || localMatch.id || '');
      return;
    }

    setIsSearchingOnline(true);
    try {
      const res = await db.trackShipment(q);
      if (res && res.success && res.shipment) {
        setOnlineSearchResult(res.shipment);
        setSelectedIdentifier(res.shipment.shipmentCode || res.shipment.trackingNumber || res.shipment.id);
        showToast(`Cargo Waybill #${res.shipment.trackingCode || res.shipment.trackingNumber} located!`, 'success');
      } else {
        showToast(res?.error || `No cargo waybill located matching "${q}"`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Tracking search error', 'error');
    } finally {
      setIsSearchingOnline(false);
    }
  };

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
      const idempKey = `idemp-freight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await db.payFreight(shipId, activeUserId, paymentWallet, pin, idempKey);
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
    if (!window.confirm('Confirm Pay on Arrival? You will settle the freight charge upon package collection in Nigeria.')) return;
    try {
      const shipId = dbShip?.id || activeShipment.id || activeShipment.trackingNumber;
      const res = await db.deferShipmentPayment(shipId, activeUserId);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast('Freight payment deferred to arrival!', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to defer payment', 'error');
    }
  };

  const handleOpenConversionModal = () => {
    if (!activeShipment) return;
    const isDelivery = (dbShip?.fulfillmentMethod || activeShipment.fulfillmentMethod || activeShipment.deliveryType) === 'doorstep' ||
      (dbShip?.fulfillmentMethod || activeShipment.fulfillmentMethod) === 'delivery';
    const nextMethod = isDelivery ? 'pickup' : 'delivery';
    setConvertMethod(nextMethod);
    if (activeShipment.doorstepAddress) {
      setConvertStreet(activeShipment.doorstepAddress.street || convertStreet);
      setConvertCity(activeShipment.doorstepAddress.city || convertCity);
      setConvertState(activeShipment.doorstepAddress.state || convertState);
      setConvertPhone(activeShipment.doorstepAddress.phone || convertPhone);
    }
    if (activeShipment.lagosHubId) {
      setConvertHubId(activeShipment.lagosHubId);
    }
    setShowConvertModal(true);
  };

  const handleConfirmConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    setIsConverting(true);
    try {
      const shipId = dbShip?.id || activeShipment.id || activeShipment.trackingNumber;
      const activeHub = lagosHubsList.find(h => h.id === convertHubId) || lagosHubsList[0];
      const hubLabel = activeHub?.name || 'Ikeja MMIA Cargo Terminal';
      
      const details = convertMethod === 'pickup' ? {
        lagosHubId: activeHub?.id || convertHubId,
        lagosHubLabel: hubLabel
      } : {
        deliveryAddress: {
          street: convertStreet,
          city: convertCity,
          state: convertState,
          phone: convertPhone,
          notes: convertNotes
        }
      };

      const res = await db.convertFulfillmentMethod(shipId, convertMethod, details);
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Fulfillment converted to ${convertMethod === 'delivery' ? 'Doorstep Delivery' : `Pickup Office (${hubLabel})`}!`, 'success');
      setShowConvertModal(false);
    } catch (err: any) {
      showToast(err.message || 'Conversion failed', 'error');
    } finally {
      setIsConverting(false);
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

  // Freight & Payment Status (Live Logistics FX & Air Rates Sync)
  const logisticsFx = db.getLogisticsFxRates();
  const paymentStatus = dbShip?.paymentStatus || activeShipment.paymentStatus || (activeShipment.freightPaid ? 'paid' : 'unbilled');
  const isFreightPaid = paymentStatus === 'paid' || activeShipment.freightPaid;
  const isDeferred = paymentStatus === 'deferred' || dbShip?.paymentTiming === 'pay_on_arrival';
  const hasBilledFee = (dbShip?.freightFeeUSD || activeShipment.freightFeeUSD || dbShip?.freightFee || 0) > 0;
  const isUnbilled = !hasBilledFee && !isFreightPaid;

  const freightCostUSD = dbShip?.freightFeeUSD || activeShipment.freightFeeUSD || dbShip?.freightFee || activeShipment.costEstimate || 0;
  const freightCostNGN = dbShip?.freightFeeNGN || activeShipment.freightFeeNGN || Math.round(freightCostUSD * (logisticsFx.usdToNgn || 1400));
  const freightCostCNY = dbShip?.freightFeeCNY || activeShipment.freightFeeCNY || Number((freightCostUSD * (logisticsFx.usdToCny || 7.25)).toFixed(2));

  // Weights & Volumes
  const actualWeight = dbShip?.actualWeightKg || activeShipment.actualWeightKg || activeShipment.weightKg || 5;
  const billableWeight = dbShip?.billableWeightKg || activeShipment.billableWeightKg || actualWeight;
  const cbm = dbShip?.cbm || activeShipment.cbm || 0.05;

  // 6-Stage Automated Milestone Tracker
  const STAGES_6 = [
    { key: 'registered', title: 'Package Registered', sub: 'Pre-alert registered by customer' },
    { key: 'received_warehouse', title: 'Received at China Warehouse', sub: 'Weighed, barcoded & intake inspected' },
    { key: 'dispatched', title: 'Dispatched & In Transit', sub: 'Departed origin hub via international air/sea freight' },
    { key: 'customs_clearance', title: 'Customs Clearance', sub: 'Lagos MMIA cargo terminal bond clearing' },
    { key: 'arrived', title: 'Arrived at Lagos Hub', sub: 'Arrived at Lagos station / ready for counter collection' },
    { key: 'completed', title: 'Completed (Handover Verified)', sub: 'Released via 4-digit pickup OTP verification' }
  ];

  // Map currentStatus to stage index (0 to 5)
  const currentStatusRaw = (dbShip?.currentStatus || activeShipment.currentStatus || 'registered').toLowerCase();
  let activeStageIdx = 0;
  if (['registered', 'package registered', 'created', 'returned'].includes(currentStatusRaw)) activeStageIdx = 0;
  else if (['received_warehouse', 'package received', 'inspection', 'packed', 'packing', 'awaiting_payment', 'awaiting payment'].includes(currentStatusRaw)) activeStageIdx = 1;
  else if (['dispatched', 'ready_for_dispatch', 'paid — preparing for shipment', 'in_transit', 'in transit', 'on hold'].includes(currentStatusRaw)) activeStageIdx = 2;
  else if (['customs_clearance', 'customs clearance'].includes(currentStatusRaw)) activeStageIdx = 3;
  else if (['arrived', 'arrived destination', 'ready_for_pickup', 'ready for pickup', 'out_for_delivery', 'out for delivery'].includes(currentStatusRaw)) activeStageIdx = 4;
  else if (['completed', 'delivered'].includes(currentStatusRaw)) activeStageIdx = 5;
  else {
    activeStageIdx = activeShipment.currentStep || 0;
  }

  // Inspection Photos
  const inspectionPhotos = dbShip?.warehousePhotos || dbShip?.inspectionPhotos || activeShipment.warehousePhotos || activeShipment.inspectionPhotos || [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
  ];
  const customerRepackageNotes = dbShip?.customerNotes || dbShip?.billingNotes || activeShipment.customerNotes || activeShipment.billingNotes || '';

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Cargo Waybill Tracker" />

      {/* Standard Global Logistics Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-400">
          <button onClick={() => navigate('logistics')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
            Logistics Hub
          </button>
          <span>/</span>
          <span className="text-white font-semibold">Waybill Tracking</span>
        </div>
        <button
          onClick={() => navigate('register-package')}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-400 flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>+ Pre-Alert Package</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Bar for Code Lookups */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Waybill #, FMCN..., SF, or title..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingOnline}
            className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {isSearchingOnline ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {/* Waybill Horizontal Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {filteredShipments.map((s) => {
            const isSelected = (s.trackingNumber === activeShipment.trackingNumber) || (s.shipmentCode === activeShipment.shipmentCode);
            return (
              <button
                key={s.trackingNumber || s.id}
                onClick={() => setSelectedIdentifier(s.shipmentCode || s.trackingNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🇨🇳 {s.type === 'air' ? '✈ ' : '🚢 '} {s.shipmentCode || s.trackingNumber}
              </button>
            );
          })}
        </div>

        {/* Primary Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tracking Code:</span>
              <span className="font-mono font-black text-white text-xs">
                {activeShipment.trackingCode || activeShipment.shipmentCode || activeShipment.trackingNumber}
              </span>
              <button
                onClick={() => handleCopy(activeShipment.trackingCode || activeShipment.shipmentCode || activeShipment.trackingNumber, 'main-code')}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                {copiedId === 'main-code' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
              {activeShipment.status || activeShipment.currentStatus || 'In Transit'}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-white">{activeShipment.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Origin: 🇨🇳 China ({activeShipment.originWarehouse || activeShipment.origin || 'Guangzhou'}) ➔ 🇳🇬 {activeShipment.destinationHub || activeShipment.pickupHub || 'Lagos Ikeja Hub'}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Gross / Billable</span>
              <span className="font-extrabold text-white text-xs num-tabular">
                {actualWeight} kg / <strong className="text-emerald-400 font-black">{billableWeight} kg</strong>
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Volume (CBM)</span>
              <span className="font-extrabold text-white text-xs num-tabular">{cbm} CBM</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Est. Landed ETA</span>
              <span className="font-extrabold text-emerald-400 text-xs">{activeShipment.eta || 'In 3-5 days'}</span>
            </div>
          </div>

          {/* Receiving Warehouse Snapshot / Address */}
          {(activeShipment.warehouseSnapshot || activeShipment.originWarehouse) && (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Receiving Hub: {activeShipment.warehouseSnapshot?.name || `${activeShipment.originWarehouse} Warehouse`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const snap = activeShipment.warehouseSnapshot;
                    const addr = snap?.fullAddress || `${activeShipment.originWarehouse} Consolidation Hub`;
                    const phone = snap?.phone ? `\nPhone: ${snap.phone}` : '';
                    navigator.clipboard?.writeText(`${snap?.name || activeShipment.originWarehouse}\nAddress: ${addr}${phone}`);
                    showToast('Warehouse address copied successfully.', 'success');
                  }}
                  className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {activeShipment.warehouseSnapshot?.fullAddress || `${activeShipment.originWarehouse} International Cargo Consolidation Hub`}
              </p>
            </div>
          )}
        </div>

        {/* FREIGHT PAYMENT CARD */}
        {isFreightPaid ? (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="block font-black text-white">Freight Settled in Full (₦{freightCostNGN.toLocaleString()} / ¥{freightCostCNY} RMB)</span>
                <span className="text-[10px] text-emerald-400 font-normal">Air Waybill Released & Customs Cleared</span>
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
              Amount Due at Lagos Handover: <strong className="text-white">₦{freightCostNGN.toLocaleString()}</strong> (≈ ¥{freightCostCNY} RMB). You can pay via POS/transfer at the collection counter.
            </p>
          </div>
        ) : isUnbilled ? (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-white">Freight Quotation Pending</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold font-mono">
                MEASUREMENT STAGE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your parcel is registered. Once received at the receiving dock, our warehouse team will record actual weight and billable dimensions to generate your quote.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Freight Settlement Invoice
                </span>
                <p className="text-xl font-extrabold text-white mt-0.5 num-tabular">
                  ₦{freightCostNGN.toLocaleString()}
                  <span className="text-xs text-amber-400 font-bold ml-1.5">
                    (≈ ¥{freightCostCNY} RMB)
                  </span>
                </p>
              </div>
            </div>

            {customerRepackageNotes && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/20 text-[11px] text-amber-200">
                <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5">Warehouse Repackage & Billing Notes</span>
                <span>{customerRepackageNotes}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-300">
              Pay immediately from your multi-currency wallet with 6-digit PIN, or choose Pay on Arrival in Lagos.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowPayFreightModal(true)}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center cursor-pointer"
              >
                Pay Freight Now
              </button>
              <button
                onClick={handleDeferPayment}
                className="py-3 px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:border-slate-600 active:scale-95 transition-all text-center cursor-pointer"
              >
                Pay on Arrival
              </button>
            </div>
          </div>
        )}

        {/* 4 CORE TIMELINE MILESTONES & LIVE TRANSIT LOGS */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                Waybill Milestone Tracker
              </span>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                Timeline Milestones
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Milestone {Math.min(activeStageIdx >= 5 ? 4 : activeStageIdx >= 3 ? 3 : activeStageIdx >= 2 ? 2 : 1, 4)} of 4</span>
            </span>
          </div>

          {/* 4 Macro Milestones Stepper: Warehouse Received ➔ In Transit ➔ Customs ➔ Delivered */}
          <div className="grid grid-cols-4 gap-1 relative">
            {[
              { idx: 1, title: 'Warehouse Received', sub: 'China Dock', activeThreshold: 1 },
              { idx: 2, title: 'In Transit', sub: 'Departed Hub', activeThreshold: 2 },
              { idx: 3, title: 'Customs', sub: 'Lagos MMIA', activeThreshold: 3 },
              { idx: 4, title: 'Delivered', sub: 'Final Handover', activeThreshold: 5 }
            ].map((m, mIdx) => {
              const isPassed = activeStageIdx >= m.activeThreshold;
              const isCurrent = (m.idx === 1 && activeStageIdx < 2) ||
                (m.idx === 2 && activeStageIdx === 2) ||
                (m.idx === 3 && (activeStageIdx === 3 || activeStageIdx === 4)) ||
                (m.idx === 4 && activeStageIdx >= 5);

              return (
                <div key={m.idx} className="flex flex-col items-center text-center space-y-1.5 relative">
                  {mIdx > 0 && (
                    <div 
                      className={`absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 transition-colors ${
                        isPassed ? 'bg-emerald-500' : 'bg-slate-800'
                      }`} 
                    />
                  )}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all border-2 ${
                      isPassed
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-slate-900 border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20 animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : m.idx}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold block leading-tight ${
                      isCurrent ? 'text-emerald-400' : isPassed ? 'text-white' : 'text-slate-500'
                    }`}>
                      {m.title}
                    </span>
                    <span className="text-[9px] text-slate-500 block">{m.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed 6-Stage Timeline Breakdown */}
          <div className="pt-2 border-t border-slate-800/80 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Stage Lifecycle Progress
            </span>
            <div className="space-y-5 relative pl-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-800">
              {STAGES_6.map((stg, index) => {
                const isPast = index < activeStageIdx;
                const isCurrent = index === activeStageIdx;

                return (
                  <div key={stg.key} className="relative group">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
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

          {/* LIVE TRANSIT CHECKPOINT EVENT LOGS */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Live Transit Checkpoint Logs ({(dbShip?.timeline || activeShipment.timeline || []).length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time Sync</span>
            </div>

            <div className="space-y-2.5">
              {(dbShip?.timeline || activeShipment.timeline || []).length === 0 ? (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                  Initial pre-alert logged. Warehouse checkpoint scan pending.
                </div>
              ) : (
                [...(dbShip?.timeline || activeShipment.timeline || [])].reverse().map((evt, eIdx) => (
                  <div key={eIdx} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] uppercase">
                        {evt.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {typeof evt.timestamp === 'number' ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : evt.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium pt-0.5">
                      <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>{evt.location}</span>
                    </div>
                    {evt.notes && (
                      <p className="text-[10px] text-slate-400 pl-4 border-l border-slate-800 ml-1 mt-1 leading-snug">
                        {evt.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LAGOS HANDOVER / SECURE PICKUP OTP CARD */}
        {(() => {
          const isDoorstep = (dbShip?.fulfillmentMethod || activeShipment.fulfillmentMethod || activeShipment.deliveryType) === 'doorstep' ||
            (dbShip?.fulfillmentMethod || activeShipment.fulfillmentMethod) === 'delivery';
          const isVerified = dbShip?.otpVerified || activeShipment.otpVerified || !!(dbShip as any)?.pickup_otp_verified_at || !!dbShip?.pickupOtpVerifiedAt || (dbShip?.currentStatus === 'completed');
          const otpCode = dbShip?.pickupOtp || activeShipment.pickupOtp || '7492';
          const hubLabel = dbShip?.lagosHubLabel || activeShipment.lagosHubLabel || dbShip?.pickupHub || activeShipment.pickupHub || 'Ikeja MMIA Cargo Terminal';
          const isCompleted = activeStageIdx >= 5;

          return (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Lagos Fulfillment & Counter Release
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    isDoorstep 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isDoorstep ? 'Doorstep Delivery' : 'Pickup Office'}
                  </span>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={handleOpenConversionModal}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Switch</span>
                    </button>
                  )}
                </div>
              </div>

              {isVerified ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✅ Verified & Released (Lagos Counter Release Complete)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Handed over to customer at {hubLabel}. Counter 4-digit OTP verified successfully.
                  </p>
                </div>
              ) : isDoorstep ? (
                <div className="space-y-3">
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">Destination Address: </span><strong className="text-white">{activeShipment.doorstepAddress?.street || '14 Broad Street, Marina, Lagos'}</strong></p>
                    <p><span className="text-slate-500">City & State: </span><span>{activeShipment.doorstepAddress?.city || 'Lagos Island'}, {activeShipment.doorstepAddress?.state || 'Lagos'}</span></p>
                    <p><span className="text-slate-500">Dispatch Contact: </span><span className="font-mono text-emerald-400">{activeShipment.doorstepAddress?.phone || userProfile?.phone}</span></p>
                    {activeShipment.doorstepAddress?.notes && (
                      <p><span className="text-slate-500">Notes: </span><span className="italic text-slate-400">{activeShipment.doorstepAddress.notes}</span></p>
                    )}
                  </div>

                  {(dbShip?.assignedRiderName || activeShipment.assignedRiderName) && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Dispatch Rider</span>
                          <span className="font-bold text-white">{dbShip?.assignedRiderName || activeShipment.assignedRiderName}</span>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 text-xs font-bold">
                        {dbShip?.assignedRiderPhone || activeShipment.assignedRiderPhone}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Designated Lagos Office: </span><strong className="text-white">{hubLabel}</strong></p>
                    <p className="text-[11px] text-slate-400">Cargo Village, Airport Logistics Hub, Lagos MMIA Corridor</p>
                  </div>

                  {/* Secure 4-Digit Pickup OTP Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-400 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" />
                        Secure 4-Digit Pickup OTP
                      </span>
                      <button
                        onClick={() => handleCopy(otpCode, 'otp-code', 'Pickup OTP copied!')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === 'otp-code' ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === 'otp-code' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center py-2.5 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
                      <span className="font-mono text-2xl font-black tracking-widest text-white num-tabular">
                        OTP: {otpCode}
                      </span>
                    </div>

                    <p className="text-[10px] text-amber-300/90 leading-tight">
                      ⚠️ Present this secure 4-digit code to the warehouse officer at the counter for seamless package release without physical ID paperwork.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* WAREHOUSE INSPECTION PHOTOS GALLERY */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-emerald-400" />
              Dock Intake Inspection Photos ({inspectionPhotos.length})
            </span>
            <span className="text-[10px] text-slate-400">Tap to expand</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {inspectionPhotos.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setPreviewPhotoUrl(url)}
                className="relative rounded-2xl overflow-hidden aspect-video border border-slate-800 group cursor-pointer"
              >
                <img src={url} alt={`Inspection ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-white">
                  Photo #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              handleCopy(
                `FlyeMass Waybill: ${activeShipment.shipmentCode || activeShipment.trackingNumber}\nRoute: ${activeShipment.originWarehouse} to Lagos\nStatus: ${activeShipment.status}\nWeight: ${billableWeight}kg`,
                'share',
                'Shipment details copied!'
              );
            }}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Waybill</span>
          </button>

          <button
            onClick={() => showToast('Generating Air Waybill (AWB) PDF with Customs Seal...', 'success')}
            className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
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
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhotoUrl} alt="Preview" className="w-full object-cover max-h-[70vh]" />
            <div className="p-4 bg-slate-950 text-xs text-slate-300">
              Warehouse Dock Intake Inspection Photo
            </div>
          </div>
        </div>
      )}

      {/* PAY FREIGHT MODAL (Shows from the Top) */}
      {showPayFreightModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-200 mt-2">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Multi-Wallet Freight Debit
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Settlement for #{activeShipment.shipmentCode || activeShipment.trackingNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Chargeable Fee: <strong className="text-emerald-400">₦{freightCostNGN.toLocaleString()}</strong> (≈ ¥{freightCostCNY} RMB)
              </p>
            </div>

            {/* Wallet Selector: NGN, CNY */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Debit From Wallet:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['NGN', 'CNY'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setPaymentWallet(curr)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      paymentWallet === curr
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {curr === 'NGN' && '🇳🇬 Naira (₦)'}
                    {curr === 'CNY' && '🇨🇳 Chinese RMB (¥)'}
                  </button>
                ))}
              </div>
            </div>

            {/* 6-Digit PIN Pad */}
            <PinPad
              title="Authorize Freight Debit"
              subtitle={`Confirm payment of ${
                paymentWallet === 'CNY'
                  ? `¥${freightCostCNY} CNY`
                  : `₦${freightCostNGN.toLocaleString()} NGN`
              }`}
              onComplete={handleAuthorizeFreightPayment}
              onCancel={() => setShowPayFreightModal(false)}
            />
          </div>
        </div>
      )}

      {/* CONVERT FULFILLMENT METHOD MODAL */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Switch Fulfillment Method</span>
              </h3>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmConversion} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Fulfillment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertMethod('pickup')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      convertMethod === 'pickup'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Hub Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertMethod('delivery')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      convertMethod === 'delivery'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Doorstep</span>
                  </button>
                </div>
              </div>

              {convertMethod === 'pickup' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Designated Lagos Collection Station
                  </label>
                  <select
                    value={convertHubId}
                    onChange={(e) => setConvertHubId(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  >
                    {lagosHubsList.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name} ({hub.district})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={convertStreet}
                      onChange={(e) => setConvertStreet(e.target.value)}
                      placeholder="e.g. 14 Broad Street, Marina"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        City / LGA
                      </label>
                      <input
                        type="text"
                        value={convertCity}
                        onChange={(e) => setConvertCity(e.target.value)}
                        placeholder="Lagos Island"
                        required
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={convertState}
                        onChange={(e) => setConvertState(e.target.value)}
                        placeholder="Lagos"
                        required
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Recipient Phone
                    </label>
                    <input
                      type="text"
                      value={convertPhone}
                      onChange={(e) => setConvertPhone(e.target.value)}
                      placeholder="+234 803 555 9201"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Delivery Instructions
                    </label>
                    <input
                      type="text"
                      value={convertNotes}
                      onChange={(e) => setConvertNotes(e.target.value)}
                      placeholder="e.g. Call before dispatch, gate 2"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isConverting ? 'Updating...' : 'Confirm Fulfillment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
