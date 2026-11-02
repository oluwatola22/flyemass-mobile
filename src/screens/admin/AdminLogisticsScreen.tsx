import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { ShipmentDocument } from '../../types';
import { 
  Truck, 
  Plane, 
  Ship, 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Scale, 
  Package, 
  ShieldCheck,
  Edit,
  ExternalLink,
  Building2,
  DollarSign,
  AlertTriangle,
  Key,
  Camera,
  Check,
  Receipt,
  Layers,
  ChevronDown,
  Phone,
  Home
} from 'lucide-react';

export const AdminLogisticsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeTab, setActiveTab] = useState<'cargo' | 'warehouses' | 'rates' | 'consolidation'>('cargo');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'Air Freight' | 'Sea Freight'>('all');
  
  // Rate settings
  const [airExpressRateUSD, setAirExpressRateUSD] = useState('11.50');
  const [airRegularRateUSD, setAirRegularRateUSD] = useState('9.50');
  const [seaRateUSD, setSeaRateUSD] = useState('280.00');

  // Package Creation Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newTitle, setNewTitle] = useState('Apple Gadgets & GaN Chargers (Batch 4)');
  const [newReceiver, setNewReceiver] = useState('Chief Babatunde Alade');
  const [newOrigin, setNewOrigin] = useState<'Guangzhou' | 'Yiwu' | 'Foshan'>('Guangzhou');
  const [newMode, setNewMode] = useState<'Air Freight' | 'Sea Freight'>('Air Freight');
  const [newWeight, setNewWeight] = useState('32.5');

  // 1. Intake & Inspection Modal
  const [intakeShipment, setIntakeShipment] = useState<ShipmentDocument | null>(null);
  const [intakeActualWeight, setIntakeActualWeight] = useState('8.5');
  const [intakeLength, setIntakeLength] = useState('40');
  const [intakeWidth, setIntakeWidth] = useState('30');
  const [intakeHeight, setIntakeHeight] = useState('25');
  const [intakeCondition, setIntakeCondition] = useState<'Intact' | 'Re-taped' | 'Repackaged' | 'Wooden crate reinforced'>('Intact');
  const [intakeNotes, setIntakeNotes] = useState('Good factory packaging. Barcode sealed.');
  const [intakePhotos, setIntakePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
  ]);

  // 2. Billing Drawer / Modal
  const [billingShipment, setBillingShipment] = useState<ShipmentDocument | null>(null);
  const [billingRatePerKg, setBillingRatePerKg] = useState('9.50');
  const [billingExtraFeeUSD, setBillingExtraFeeUSD] = useState('0');
  const [billingNotes, setBillingNotes] = useState('Standard airport handling included.');

  // 3. Lifecycle Transition Modal
  const [lifecycleShipment, setLifecycleShipment] = useState<ShipmentDocument | null>(null);
  const [targetLifecycleStatus, setTargetLifecycleStatus] = useState<string>('in_transit');
  const [lifecycleLocation, setLifecycleLocation] = useState('Air Cargo Flight ET921 Transit Hub');
  const [lifecycleNotes, setLifecycleNotes] = useState('Departed Guangzhou Baiyun Terminal');

  // 4. Verify Pickup OTP Modal
  const [otpShipment, setOtpShipment] = useState<ShipmentDocument | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [freightCollectedCheck, setFreightCollectedCheck] = useState(false);

  // 5. Doorstep Delivery Modal
  const [doorstepShipment, setDoorstepShipment] = useState<ShipmentDocument | null>(null);
  const [doorstepProofNote, setDoorstepProofNote] = useState('Handed directly to recipient at gate.');
  const [doorstepFreightCollected, setDoorstepFreightCollected] = useState(false);

  // Consolidation State
  const [selectedConsolParcels, setSelectedConsolParcels] = useState<string[]>([]);
  const [consolContainerCode, setConsolContainerCode] = useState(`FM-CONSOL-AIR-${Date.now().toString().slice(-6)}`);
  const [consolDestinationHub, setConsolDestinationHub] = useState('Lagos MMIA Air Cargo Terminal');
  const [consolMode, setConsolMode] = useState<'air_express' | 'sea_freight'>('air_express');
  const [isConsolidating, setIsConsolidating] = useState(false);

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const shipmentsList = Object.values(dbState.shipments || {}).filter((s) => {
    const matchesMode = modeFilter === 'all' || s.mode === modeFilter;
    const matchesSearch = 
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.shipmentCode && s.shipmentCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.trackingCode && s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.chineseCourierTracking && s.chineseCourierTracking.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.receiverName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'registered' ? (s.currentStatus === 'registered') :
      statusFilter === 'inspection' ? (s.currentStatus === 'received_warehouse' || s.currentStatus === 'inspection' || s.currentStatus === 'packed') :
      statusFilter === 'awaiting_payment' ? (s.currentStatus === 'awaiting_payment' || s.paymentStatus === 'awaiting_payment') :
      statusFilter === 'in_transit' ? (['ready_for_dispatch', 'dispatched', 'in_transit', 'customs_clearance'].includes(s.currentStatus)) :
      statusFilter === 'arrived' ? (['arrived', 'ready_for_pickup', 'out_for_delivery'].includes(s.currentStatus)) :
      statusFilter === 'delivered' ? (['delivered', 'completed'].includes(s.currentStatus)) : true;

    return matchesMode && matchesSearch && matchesStatus;
  });

  const unconsolidatedShipments = Object.values(dbState.shipments || {}).filter(
    (s) => s.status !== 'consolidated' && !s.isConsolidatedParent
  );
  const consolidatedContainers = Object.values(dbState.shipments || {}).filter(
    (s) => s.isConsolidatedParent || s.status === 'consolidated'
  );

  // 1. Submit Intake & Inspection
  const handleConfirmIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeShipment) return;
    const actKg = parseFloat(intakeActualWeight) || 1;
    const l = parseFloat(intakeLength) || 1;
    const w = parseFloat(intakeWidth) || 1;
    const h = parseFloat(intakeHeight) || 1;
    const cbm = (l * w * h) / 1000000;
    const isAir = (intakeShipment.mode || intakeShipment.shippingMode || '').toLowerCase().includes('air');
    const volumetricKg = isAir ? (l * w * h) / 6000 : cbm * 167;
    const billableKg = Math.max(actKg, volumetricKg);

    try {
      await db.intakeShipment(intakeShipment.id, {
        actualWeightKg: actKg,
        dimensions: { lengthCm: l, widthCm: w, heightCm: h },
        cbm: Number(cbm.toFixed(3)),
        billableWeightKg: Number(billableKg.toFixed(2)),
        inspectionPhotos: intakePhotos,
        inspectionNotes: intakeNotes,
        packagingCondition: intakeCondition
      });
      showToast(`Waybill #${intakeShipment.trackingNumber} intake & weighing saved! Billable: ${billableKg.toFixed(1)}kg`, 'success');
      setIntakeShipment(null);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Intake failed', 'error');
    }
  };

  // 2. Submit Billing
  const handleConfirmBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingShipment) return;
    const rate = parseFloat(billingRatePerKg) || 9.50;
    const extra = parseFloat(billingExtraFeeUSD) || 0;
    const billableKg = billingShipment.billableWeightKg || billingShipment.actualWeightKg || billingShipment.weightKg || 5;
    const freightUSD = Number(((billableKg * rate) + extra).toFixed(2));
    const freightNGN = Math.round(freightUSD * 1485);
    const freightCNY = Number((freightUSD * 7.24).toFixed(2));

    try {
      await db.billShipment(billingShipment.id, {
        freightFeeUSD: freightUSD,
        freightFeeNGN: freightNGN,
        freightFeeCNY: freightCNY,
        ratePerKg: rate,
        billingNotes
      });
      showToast(`Shipment billed for $${freightUSD} USD! Status updated to "Awaiting Payment".`, 'success');
      setBillingShipment(null);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Billing failed', 'error');
    }
  };

  // 3. Submit Lifecycle Advance
  const handleConfirmLifecycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleShipment) return;
    try {
      await db.updateShipmentLifecycle(
        lifecycleShipment.id,
        targetLifecycleStatus,
        lifecycleLocation,
        lifecycleNotes
      );
      showToast(`Shipment updated to "${targetLifecycleStatus}"! Timeline event logged.`, 'success');
      setLifecycleShipment(null);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Lifecycle update failed', 'error');
    }
  };

  // 4. Verify Pickup OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpShipment) return;
    try {
      const res = await db.verifyPickupOtp(otpShipment.id, enteredOtp, freightCollectedCheck, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`OTP Verified! Package handed over and marked "Delivered".`, 'success');
      setOtpShipment(null);
      setEnteredOtp('');
      setFreightCollectedCheck(false);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed', 'error');
    }
  };

  // 5. Confirm Doorstep Delivery
  const handleConfirmDoorstep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doorstepShipment) return;
    try {
      const res = await db.confirmDoorstepDelivery(doorstepShipment.id, doorstepProofNote, doorstepFreightCollected, 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Doorstep delivery confirmed! Package marked "Delivered".`, 'success');
      setDoorstepShipment(null);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Delivery confirmation failed', 'error');
    }
  };

  // Consolidation handler
  const handleConsolidatePackages = async () => {
    if (selectedConsolParcels.length === 0) {
      showToast('Select at least one package to consolidate', 'error');
      return;
    }
    setIsConsolidating(true);
    try {
      const res = await db.consolidateShipments(selectedConsolParcels, consolDestinationHub, consolMode, 'usr_alade_01');
      showToast(`Successfully consolidated ${selectedConsolParcels.length} parcels into container #${res.consolidation?.containerNumber || consolContainerCode}!`, 'success');
      setSelectedConsolParcels([]);
      setConsolContainerCode(`FM-CONSOL-AIR-${Date.now().toString().slice(-6)}`);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Consolidation failed', 'error');
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const tracking = newTrackingNumber || `FM-${newOrigin.slice(0, 3).toUpperCase()}-LOS-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      await db.registerShipment({
        trackingNumber: tracking,
        userId: 'usr_alade_01',
        receiverName: newReceiver,
        originWarehouse: newOrigin,
        destination: 'Lagos Hub',
        weightKg: Number(newWeight),
        mode: newMode,
        title: `${newOrigin} to Lagos ${newMode}`
      });
      setShowCreateModal(false);
      setNewTrackingNumber('');
      setDbState({ ...db.getState() });
      showToast(`Consignment #${tracking} registered in dock manifest!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to register consignment', 'error');
    }
  };

  return (
    <AdminLayout activeTab="logistics">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Cargo Control Tower & Warehouse Dock</h1>
            <p className="text-xs text-slate-400">
              China warehouse intake, dimensional weighing, billing, multi-stage lifecycle, and Lagos OTP handover.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab('cargo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'cargo' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Intake & Waybills ({Object.values(dbState.shipments || {}).length})
              </button>
              <button
                onClick={() => setActiveTab('consolidation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'consolidation' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Consolidation ({unconsolidatedShipments.length})
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'warehouses' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hub Addresses
              </button>
            </div>

            <button
              onClick={() => {
                setNewTrackingNumber(`FM-CAN-LOS-${Math.floor(10000 + Math.random() * 90000)}`);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Issue Waybill</span>
            </button>
          </div>
        </div>

        {/* 1. CARGO & INTAKE TAB */}
        {activeTab === 'cargo' && (
          <div className="space-y-4">
            {/* Status Tabs Filter Bar */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
              {[
                { id: 'all', label: 'All Packages' },
                { id: 'registered', label: '1. Registered (Pre-Alert)' },
                { id: 'inspection', label: '2. Inspection Bay' },
                { id: 'awaiting_payment', label: '3. Awaiting Payment' },
                { id: 'in_transit', label: '4. In Transit / Clearing' },
                { id: 'arrived', label: '5. Lagos Hub / Ready' },
                { id: 'delivered', label: '6. Delivered / Closed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? 'bg-slate-950 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SL-..., FMCN..., CN Courier, Receiver, or Goods..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'Air Freight', 'Sea Freight'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModeFilter(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      modeFilter === m
                        ? 'bg-slate-950 border-cyan-500 text-cyan-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'Air Freight' && <Plane className="w-3.5 h-3.5" />}
                    {m === 'Sea Freight' && <Ship className="w-3.5 h-3.5" />}
                    <span>{m === 'all' ? 'All Freight Modes' : m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shipment Cards with Intake & Billing Controls */}
            <div className="space-y-4">
              {shipmentsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No shipments matching this filter criteria.</p>
                </div>
              ) : (
                shipmentsList.map((shp) => {
                  const isAir = (shp.mode || shp.shippingMode || '').toLowerCase().includes('air');
                  const isDeferred = shp.paymentStatus === 'deferred' || shp.paymentTiming === 'pay_on_arrival';
                  const isPaid = shp.paymentStatus === 'paid' || shp.freightPaid;

                  return (
                    <div
                      key={shp.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
                    >
                      {/* Top Row: IDs, Mode, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            {isAir ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-white text-sm">
                                {shp.shipmentCode || shp.trackingNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[9px] uppercase font-bold">
                                {shp.shippingMode || shp.mode}
                              </span>
                              {shp.chineseCourierTracking && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px]">
                                  {shp.courierCompany || 'SF'}: {shp.chineseCourierTracking}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-300 mt-0.5">{shp.title || shp.packageDescription}</p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
                            Stage: {shp.currentStatus}
                          </span>
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                              Paid (${shp.freightFeeUSD || shp.costEstimate})
                            </span>
                          ) : isDeferred ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                              Pay on Arrival (${shp.freightFeeUSD || shp.costEstimate})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                              Unpaid (${shp.freightFeeUSD || shp.costEstimate})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Customer</span>
                          <span className="font-bold text-white block truncate">{shp.receiverName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{shp.customerPhone || 'Alade Holdings'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Weight / Dimensions</span>
                          <span className="font-mono font-bold text-emerald-400 block">
                            {shp.actualWeightKg || shp.weightKg} kg gross • {shp.billableWeightKg || shp.weightKg} kg billable
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {shp.dimensions ? `${shp.dimensions.lengthCm}x${shp.dimensions.widthCm}x${shp.dimensions.heightCm} cm` : 'Not measured'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Routing Hub</span>
                          <span className="font-bold text-slate-200 block">{shp.originWarehouse} ➔ Lagos</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {shp.deliveryType === 'doorstep' ? 'Doorstep Delivery' : (shp.pickupHub || 'Ikeja MMIA Hub')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Lagos Release OTP</span>
                          <span className="font-mono font-black text-indigo-400 text-sm tracking-wider block">
                            {shp.pickupOtp || '682104'}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {shp.otpVerified ? '✓ OTP Verified' : 'Awaiting OTP at counter'}
                          </span>
                        </div>
                      </div>

                      {/* Operational Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* 1. Weigh & Inspect Button */}
                          <button
                            onClick={() => {
                              setIntakeShipment(shp);
                              setIntakeActualWeight(String(shp.actualWeightKg || shp.weightKg || 8.5));
                              if (shp.dimensions) {
                                setIntakeLength(String(shp.dimensions.lengthCm));
                                setIntakeWidth(String(shp.dimensions.widthCm));
                                setIntakeHeight(String(shp.dimensions.heightCm));
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 flex items-center gap-1.5 transition-all"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Weigh & Inspect</span>
                          </button>

                          {/* 2. Bill Shipment Button */}
                          <button
                            onClick={() => {
                              setBillingShipment(shp);
                              setBillingRatePerKg(String(shp.ratePerKg || (isAir ? 9.50 : 3.50)));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Bill Freight</span>
                          </button>

                          {/* 3. Advance Lifecycle Stage */}
                          <button
                            onClick={() => {
                              setLifecycleShipment(shp);
                              setTargetLifecycleStatus('in_transit');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-all"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Advance Stage</span>
                          </button>
                        </div>

                        {/* Handover Buttons */}
                        <div className="flex items-center gap-1.5">
                          {shp.deliveryType === 'doorstep' ? (
                            <button
                              onClick={() => setDoorstepShipment(shp)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Home className="w-3.5 h-3.5" />
                              <span>Doorstep Proof</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setOtpShipment(shp);
                                setEnteredOtp('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Verify Pickup OTP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. CONSOLIDATION TAB */}
        {activeTab === 'consolidation' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">China Origin Cargo Consolidation Hub</h3>
              <p className="text-xs text-slate-400">
                Group individual parcels into air cargo master flights or 40ft sea containers to minimize customs duties.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <input
                  type="text"
                  value={consolContainerCode}
                  onChange={(e) => setConsolContainerCode(e.target.value)}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  placeholder="Master Container #"
                />
                <select
                  value={consolMode}
                  onChange={(e) => setConsolMode(e.target.value as any)}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="air_express">Express Air Container</option>
                  <option value="sea_freight">Sea Freight 40ft High-Cube</option>
                </select>
                <button
                  onClick={handleConsolidatePackages}
                  disabled={isConsolidating || selectedConsolParcels.length === 0}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50"
                >
                  {isConsolidating ? 'Consolidating...' : `Consolidate ${selectedConsolParcels.length} Parcels`}
                </button>
              </div>
            </div>

            {/* Selectable Parcels List */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Unconsolidated Dock Parcels ({unconsolidatedShipments.length})
              </span>
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {unconsolidatedShipments.map((s) => {
                  const isChecked = selectedConsolParcels.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedConsolParcels(prev => 
                          prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                        );
                      }}
                      className="py-2.5 px-2 flex items-center justify-between cursor-pointer hover:bg-slate-950/60 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="w-4 h-4 text-emerald-500 rounded" />
                        <div>
                          <p className="text-xs font-bold text-white">{s.shipmentCode || s.trackingNumber}</p>
                          <p className="text-[10px] text-slate-400">{s.title || s.packageDescription}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 font-bold">{s.weightKg} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. WAREHOUSES TAB */}
        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Guangzhou Baiyun Consolidation Hub',
                city: 'Guangzhou',
                zh: '广东省广州市白云区石井国际物流园B栋302室',
                en: 'Room 302, Building B, Shijing Logistics Park, Baiyun, Guangzhou',
                phone: '+86 186 2008 9142',
                type: 'Air Express & Air Regular Hub'
              },
              {
                name: 'Yiwu Futian Consolidated Sea & Air Hub',
                city: 'Yiwu',
                zh: '浙江省义乌市稠州北路义乌港国际物流区D区18号仓',
                en: 'Warehouse 18, Block D, Yiwu Port Logistics Zone, Yiwu',
                phone: '+86 139 5792 8841',
                type: 'Sea Freight & Small Commodities'
              },
              {
                name: 'Foshan Nanhai Furniture & Heavy Cargo Hub',
                city: 'Foshan',
                zh: '广东省佛山市南海区澜石国际金属家具物流中心6栋',
                en: 'Building 6, Lanshi International Center, Nanhai, Foshan',
                phone: '+86 177 2278 6109',
                type: 'Heavy Sea Cargo & Furniture'
              },
              {
                name: 'Lagos MMIA Airport Terminal Hub',
                city: 'Lagos',
                zh: '尼日利亚拉各斯穆尔塔拉穆罕默德机场货运中心',
                en: 'Plot 4, Cargo Village, MMIA Airport Road, Ikeja, Lagos',
                phone: '+234 803 555 9201',
                type: 'Final Destination Vault & Dispatch'
              }
            ].map((wh, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{wh.name}</h4>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">{wh.city}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">{wh.zh}</p>
                <p className="text-[11px] text-slate-400">{wh.en}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Contact: <strong className="text-emerald-400 font-mono">{wh.phone}</strong></span>
                  <span className="text-slate-400 font-semibold">{wh.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: INTAKE & INSPECTION */}
      {intakeShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">Warehouse Intake Bay</span>
                <h3 className="text-sm font-extrabold text-white">
                  Weigh & Inspect Waybill #{intakeShipment.shipmentCode || intakeShipment.trackingNumber}
                </h3>
              </div>
              <button onClick={() => setIntakeShipment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmIntake} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Gross Scale Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={intakeActualWeight}
                  onChange={(e) => setIntakeActualWeight(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Outer Carton Dimensions (L x W x H in cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={intakeLength}
                    onChange={(e) => setIntakeLength(e.target.value)}
                    placeholder="Length (cm)"
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono text-center outline-none"
                    required
                  />
                  <input
                    type="number"
                    value={intakeWidth}
                    onChange={(e) => setIntakeWidth(e.target.value)}
                    placeholder="Width (cm)"
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono text-center outline-none"
                    required
                  />
                  <input
                    type="number"
                    value={intakeHeight}
                    onChange={(e) => setIntakeHeight(e.target.value)}
                    placeholder="Height (cm)"
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono text-center outline-none"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Volumetric Formula: Air = (L x W x H) / 6000 • Sea = CBM x 167
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Packaging Condition
                </label>
                <select
                  value={intakeCondition}
                  onChange={(e) => setIntakeCondition(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                >
                  <option value="Intact">Intact (Original factory seal)</option>
                  <option value="Re-taped">Re-taped (Reinforced seam)</option>
                  <option value="Repackaged">Repackaged (Consolidated into master box)</option>
                  <option value="Wooden crate reinforced">Wooden Crate Reinforced (Heavy/Fragile)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Inspection Notes & Security Check
                </label>
                <textarea
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  rows={2}
                />
              </div>

              {/* Photos Gallery */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Dock Intake Inspection Photos ({intakePhotos.length})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {intakePhotos.map((url, i) => (
                    <img key={i} src={url} alt="Photo" className="h-20 w-full object-cover rounded-xl border border-slate-800" />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Save Intake & Calculate Billable Weight
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SHIPMENT BILLING DRAWER */}
      {billingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Finance & Rating Desk</span>
                <h3 className="text-sm font-extrabold text-white">
                  Issue Freight Invoice #{billingShipment.shipmentCode || billingShipment.trackingNumber}
                </h3>
              </div>
              <button onClick={() => setBillingShipment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBilling} className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Billable Weight:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {billingShipment.billableWeightKg || billingShipment.actualWeightKg || billingShipment.weightKg || 5} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-bold text-white">{billingShipment.shippingMode || billingShipment.mode}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Freight Rate ($ USD / kg or CBM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={billingRatePerKg}
                  onChange={(e) => setBillingRatePerKg(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Extra Handling / Wooden Crate Fee ($ USD)
                </label>
                <input
                  type="number"
                  value={billingExtraFeeUSD}
                  onChange={(e) => setBillingExtraFeeUSD(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Billing Notes for Customer
                </label>
                <input
                  type="text"
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Save & Bill Shipment (Sets Awaiting Payment)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIFECYCLE ADVANCE */}
      {lifecycleShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">
                Advance Lifecycle Stage #{lifecycleShipment.shipmentCode || lifecycleShipment.trackingNumber}
              </h3>
              <button onClick={() => setLifecycleShipment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmLifecycle} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Target Stage</label>
                <select
                  value={targetLifecycleStatus}
                  onChange={(e) => setTargetLifecycleStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 outline-none"
                >
                  <option value="ready_for_dispatch">Ready for Dispatch (China Dock)</option>
                  <option value="dispatched">Dispatched from China Hub</option>
                  <option value="in_transit">In Transit (International Flight / Vessel)</option>
                  <option value="customs_clearance">Customs Clearance (Lagos Port Bond)</option>
                  <option value="arrived">Arrived Lagos Terminal Hub</option>
                  <option value="ready_for_pickup">Ready for Pickup (Ikeja MMIA Hub)</option>
                  <option value="out_for_delivery">Out for Doorstep Delivery</option>
                  <option value="delivered">Delivered & Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Current Waypoint Location</label>
                <input
                  type="text"
                  value={lifecycleLocation}
                  onChange={(e) => setLifecycleLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Status Milestone Description</label>
                <textarea
                  value={lifecycleNotes}
                  onChange={(e) => setLifecycleNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Advance Stage & Notify Customer App
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VERIFY PICKUP OTP */}
      {otpShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Verify Pickup OTP at Counter</h3>
              <button onClick={() => setOtpShipment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="text-xs text-slate-400">
                Customer: <strong className="text-white">{otpShipment.receiverName}</strong>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Customer 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="e.g. 682104"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono font-black text-xl text-emerald-400 tracking-widest outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* If deferred, require freight collected checkbox */}
              {(otpShipment.paymentStatus === 'deferred' || otpShipment.paymentTiming === 'pay_on_arrival') && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-300">
                      Collect Freight: ${otpShipment.freightFeeUSD || 95} USD
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={freightCollectedCheck}
                      onChange={(e) => setFreightCollectedCheck(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded"
                      required
                    />
                    <span>I confirm freight fee was collected at counter</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Verify OTP & Release Parcel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DOORSTEP DELIVERY CONFIRMATION */}
      {doorstepShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Confirm Doorstep Delivery</h3>
              <button onClick={() => setDoorstepShipment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDoorstep} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Recipient Proof / Gate Note
                </label>
                <input
                  type="text"
                  value={doorstepProofNote}
                  onChange={(e) => setDoorstepProofNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              {(doorstepShipment.paymentStatus === 'deferred' || doorstepShipment.paymentTiming === 'pay_on_arrival') && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    COD Freight Due: ${doorstepShipment.freightFeeUSD || 95} USD
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={doorstepFreightCollected}
                      onChange={(e) => setDoorstepFreightCollected(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded"
                      required
                    />
                    <span>I confirm cash/POS payment collected</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Mark as Delivered & Archive
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Issue New Cargo Waybill</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Waybill Tracking #</label>
                <input
                  type="text"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Goods Description</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Receiver Full Name</label>
                <input
                  type="text"
                  value={newReceiver}
                  onChange={(e) => setNewReceiver(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Origin Warehouse</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="Guangzhou">Guangzhou Baiyun Hub</option>
                    <option value="Yiwu">Yiwu Futian Hub</option>
                    <option value="Foshan">Foshan Nanhai Hub</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Freight Mode</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="Air Freight">Express Air (3-5d)</option>
                    <option value="Sea Freight">Consolidated Sea (25d)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Gross Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
              >
                Create Waybill & Notify Mobile User
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};