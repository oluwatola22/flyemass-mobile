import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
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
  Ban,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export const AdminLogisticsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeTab, setActiveTab] = useState<'cargo' | 'warehouses' | 'rates' | 'consolidation'>('cargo');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'Air Freight' | 'Sea Freight'>('all');
  const [airRateUSD, setAirRateUSD] = useState(String(dbState.system_settings?.fees?.airFreightPerKgUSD || 9.50));
  const [seaRateUSD, setSeaRateUSD] = useState(String(dbState.system_settings?.fees?.seaFreightPerCbmUSD || 280.00));
  
  // Package Creation Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newTitle, setNewTitle] = useState('Apple Gadgets & GaN Chargers (Batch 4)');
  const [newReceiver, setNewReceiver] = useState('Chief Babatunde Alade');
  const [newOrigin, setNewOrigin] = useState<'Guangzhou' | 'Yiwu'>('Guangzhou');
  const [newMode, setNewMode] = useState<'Air Freight' | 'Sea Freight'>('Air Freight');
  const [newWeight, setNewWeight] = useState('32.5');

  // Waypoint Update Modal state
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDocument | null>(null);
  const [updateWaypointLocation, setUpdateWaypointLocation] = useState('Flight ET921 Mid-Air Apron');
  const [updateWaypointNotes, setUpdateWaypointNotes] = useState('Passing cargo security scan clearance');

  // Consolidation State
  const [selectedConsolParcels, setSelectedConsolParcels] = useState<string[]>([]);
  const [consolContainerCode, setConsolContainerCode] = useState(`FM-CONSOL-AIR-${Date.now().toString().slice(-6)}`);
  const [consolDestinationHub, setConsolDestinationHub] = useState('Lagos MMIA Air Cargo Terminal');
  const [consolMode, setConsolMode] = useState<'air_express' | 'sea_freight'>('air_express');
  const [isConsolidating, setIsConsolidating] = useState(false);

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const unconsolidatedShipments = Object.values(dbState.shipments || {}).filter(
    (s) => s.status !== 'consolidated' && !s.isConsolidatedParent
  );
  const consolidatedContainers = Object.values(dbState.shipments || {}).filter(
    (s) => s.isConsolidatedParent || s.status === 'consolidated'
  );

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

  const WAREHOUSES = [
    {
      id: 'wh-gz',
      name: 'Guangzhou Baiyun Consolidation Hub',
      city: 'Guangzhou',
      addressEn: 'Building B, No. 88 Huadu Logistics Expressway, Baiyun District, Guangzhou, Guangdong, China',
      addressZh: '广东省广州市白云区花都物流高速88号B栋',
      contact: 'Chen Wei (+86 186 2008 9142)',
      type: 'Air Cargo & Courier Center'
    },
    {
      id: 'wh-yw',
      name: 'Yiwu International Trade Sea Depot',
      city: 'Yiwu',
      addressEn: 'No. 120 Chouzhou North Road, International Trade City Area 4, Yiwu, Zhejiang, China',
      addressZh: '浙江省义乌市稠州北路120号国际商贸城四区',
      contact: 'Zheng Li (+86 139 5790 8821)',
      type: 'Sea Container Consolidation'
    },
    {
      id: 'wh-los',
      name: 'Lagos MM2 Cargo Terminal & Vault Hub',
      city: 'Lagos',
      addressEn: 'Plot 4, Cargo Village, Murtala Muhammed International Airport, Ikeja, Lagos, Nigeria',
      addressZh: '尼日利亚拉各斯穆尔塔拉穆罕默德机场货运村4号',
      contact: 'Adeyemi Logistics Desk (+234 803 555 9201)',
      type: 'Final Destination Vault & Dispatch'
    }
  ];

  const handleCancelShipment = async (shipment: ShipmentDocument) => {
    if (!window.confirm(`Cancel shipment ${shipment.trackingNumber}? If freight was paid, it will be refunded to customer's wallet.`)) return;
    try {
      await db.cancelShipment(shipment.id, 'Administrative cancellation', 'adm-001');
      showToast(`Shipment ${shipment.trackingNumber} cancelled & any paid freight refunded!`, 'info');
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel shipment', 'error');
    }
  };

  const handleFlagException = (shipment: ShipmentDocument) => {
    const reason = window.prompt(`Enter customs/delay exception note for ${shipment.trackingNumber}:`, 'Customs documentation clearance delay in transit hub');
    if (!reason || !reason.trim()) return;
    db.updateShipmentStatus(shipment.id, 'In Transit/Customs', {
      location: 'Customs Holding Dock',
      notes: `EXCEPTION HOLD: ${reason.trim()}`
    });
    showToast(`Exception flag recorded for ${shipment.trackingNumber}!`, 'info');
    setDbState({ ...db.getState() });
  };

  const shipmentsList = Object.values(dbState.shipments).filter((s) => {
    const matchesMode = modeFilter === 'all' || s.mode === modeFilter;
    const matchesSearch = s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.receiverName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const stages: ShipmentDocument['currentStatus'][] = [
    'Origin Received',
    'Packed',
    'In Transit/Customs',
    'Lagos Hub Ready',
    'Delivered'
  ];

  const handleUpdateStatus = async (shipment: ShipmentDocument, newStatus: ShipmentDocument['currentStatus']) => {
    const loc = newStatus === 'Lagos Hub Ready' ? 'FlyeMass Ikeja Clearing Terminal, Lagos' : 
                newStatus === 'Delivered' ? 'Delivered to Customer Doorstep' :
                newStatus === 'In Transit/Customs' ? 'International Air/Sea Transit' : 'Guangzhou Dock Hub';
    const notes = `Status advanced to ${newStatus} by Cargo Control Tower`;

    try {
      await db.updateShipmentWaypoint(shipment.id, newStatus, loc, notes, 'adm-001');
      showToast(`Waybill #${shipment.trackingNumber} advanced to "${newStatus}"! Synced with mobile app.`, 'success');
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Failed to update waypoint', 'error');
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Cargo Control Tower</h1>
            <p className="text-xs text-slate-400">
              Manage China-to-Nigeria freight pipelines, dispatch air/sea cargo batches, and mutably advance waybill status.
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
                Waybill Tower ({shipmentsList.length})
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'warehouses' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Warehouses Hubs
              </button>
              <button
                onClick={() => setActiveTab('rates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rates' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Freight Pricing
              </button>
              <button
                onClick={() => setActiveTab('consolidation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'consolidation' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Consolidation Manager ({unconsolidatedShipments.length})
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
              <span>New Waybill</span>
            </button>
          </div>
        </div>

        {activeTab === 'cargo' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Waybill #, Receiver, or Goods Description..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500"
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

            {/* Shipments Cards with 5-Stage Interactive Status Pipeline */}
            <div className="space-y-4">
          {shipmentsList.map((shipment) => {
            const currentStageIndex = stages.indexOf(shipment.currentStatus);

            return (
              <div
                key={shipment.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      {shipment.mode === 'Air Freight' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-white text-sm">
                          {shipment.trackingNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[9px] uppercase font-bold">
                          {shipment.mode}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">{shipment.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Recipient</span>
                      <span className="font-bold text-slate-200">{shipment.receiverName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Weight / Vol</span>
                      <span className="font-mono font-bold text-emerald-400 num-tabular">{shipment.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Route Hub</span>
                      <span className="font-bold text-slate-200">{shipment.originWarehouse} ➔ LOS</span>
                    </div>
                  </div>
                </div>

                {/* 5-Stage Interactive Pipeline Mutator Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      5-Stage Pipeline Status (Tap any stage to advance/mutate live)
                    </span>
                    <span className="font-bold text-emerald-400 text-xs">
                      Current: {shipment.currentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {stages.map((stageName, idx) => {
                      const isReached = idx <= currentStageIndex;
                      const isCurrent = shipment.currentStatus === stageName;

                      return (
                        <button
                          key={stageName}
                          onClick={() => handleUpdateStatus(shipment, stageName)}
                          className={`p-2.5 rounded-2xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/30'
                              : isReached
                              ? 'bg-slate-950 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="text-[9px] block uppercase font-mono tracking-wider opacity-80">
                            Stage {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold block truncate mt-0.5">
                            {stageName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Timeline Waypoints Preview & Quick Operations */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Last Milestone: <strong>{shipment.timeline[shipment.timeline.length - 1]?.location || shipment.originWarehouse}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFlagException(shipment)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Flag Exception</span>
                    </button>

                    {shipment.currentStatus !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancelShipment(shipment)}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancel & Refund</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 2. CONSOLIDATION WAREHOUSES DIRECTORY */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>International Consolidation Docks & Receiving Hubs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative addresses for Chinese supplier drop-offs, container loading, and Lagos airport collection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WAREHOUSES.map((wh) => (
              <div key={wh.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {wh.city}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{wh.type}</span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-white">{wh.name}</h4>
                  <p className="text-xs font-chinese text-slate-300 mt-1">{wh.addressZh}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{wh.addressEn}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-500">Dock Supervisor:</span>
                  <strong className="text-white font-mono">{wh.contact}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FREIGHT RATE CONTROLS */}
      {activeTab === 'rates' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await db.updateSystemSettings('Logistics Manager Adeyemi', {}, {
              airFreightPerKgUSD: parseFloat(airRateUSD) || 9.5,
              seaFreightPerCbmUSD: parseFloat(seaRateUSD) || 280
            });
            showToast('Freight tariffs updated successfully!', 'success');
          }}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 max-w-xl"
        >
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Configure Global Cargo Tariffs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sets baseline rate for the mobile shipping calculator and automated waybill invoice creation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Express Air Cargo Base Rate ($ / kg)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400">$</span>
                <input
                  type="number"
                  step="0.1"
                  value={airRateUSD}
                  onChange={(e) => setAirRateUSD(e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Sea Freight Consolidated Tariff ($ / CBM)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400">$</span>
                <input
                  type="number"
                  step="1"
                  value={seaRateUSD}
                  onChange={(e) => setSeaRateUSD(e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-white text-sm outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Update Authoritative Freight Tariffs
            </button>
          </div>
        </form>
      )}

      {/* 4. PACKAGE CONSOLIDATION MANAGER */}
      {activeTab === 'consolidation' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Origin Warehouse Operations
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Package Consolidation Desk
                </h3>
                <p className="text-xs text-slate-400">
                  Bundle individual customer parcels into master air pallets or sea containers for joint customs clearance.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConsolidatePackages}
                disabled={selectedConsolParcels.length === 0 || isConsolidating}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Consolidate {selectedConsolParcels.length} Selected Parcels</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Master Container / AWB Code
                </label>
                <input
                  type="text"
                  value={consolContainerCode}
                  onChange={(e) => setConsolContainerCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Destination Port / Terminal
                </label>
                <select
                  value={consolDestinationHub}
                  onChange={(e) => setConsolDestinationHub(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="Lagos MMIA Air Cargo Terminal">Lagos MMIA Air Cargo Terminal (LOS)</option>
                  <option value="Tin Can Island Port Complex">Tin Can Island Port Complex (Lagos Sea)</option>
                  <option value="Onne Port Port-Harcourt">Onne Port (Port-Harcourt Sea)</option>
                  <option value="Abuja Nnamdi Azikiwe International Airport">Abuja Cargo Terminal (ABV)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Freight Class
                </label>
                <select
                  value={consolMode}
                  onChange={(e: any) => setConsolMode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="air_express">Express Air Cargo Consolidation</option>
                  <option value="sea_freight">Sea Freight LCL Container</option>
                </select>
              </div>
            </div>

            {/* Selection Table */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  Select Unconsolidated Origin Parcels ({unconsolidatedShipments.length} Available)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedConsolParcels.length === unconsolidatedShipments.length) {
                      setSelectedConsolParcels([]);
                    } else {
                      setSelectedConsolParcels(unconsolidatedShipments.map(s => s.id));
                    }
                  }}
                  className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  {selectedConsolParcels.length === unconsolidatedShipments.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {unconsolidatedShipments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    All origin parcels have already been consolidated.
                  </div>
                ) : (
                  unconsolidatedShipments.map((shp) => {
                    const isSelected = selectedConsolParcels.includes(shp.id);
                    return (
                      <div
                        key={shp.id}
                        onClick={() => {
                          setSelectedConsolParcels(prev => 
                            prev.includes(shp.id) ? prev.filter(id => id !== shp.id) : [...prev, shp.id]
                          );
                        }}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-950/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{shp.title || shp.trackingNumber}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {shp.trackingNumber} • {shp.originCity || 'Guangzhou'} → {shp.destinationCity || 'Lagos'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white">{shp.weightKg || 1} kg</span>
                          <span className="text-[10px] text-slate-500 block">{shp.type || 'Air Cargo'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Active Consolidated Master Containers Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Master Consolidated Shipments ({consolidatedContainers.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Master Container / Waybill</th>
                    <th className="py-3 px-4">Destination Hub</th>
                    <th className="py-3 px-4">Parcels Included</th>
                    <th className="py-3 px-4">Total Weight</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {consolidatedContainers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">No consolidated containers active yet</td>
                    </tr>
                  ) : (
                    consolidatedContainers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {c.containerNumber || c.trackingNumber}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          {c.destinationHub || c.destinationCity || 'Lagos MMIA'}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {c.consolidatedShipmentIds ? `${c.consolidatedShipmentIds.length} parcels` : '1 batch'}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {c.weightKg || c.totalWeightKg || 120} kg
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            {c.currentStatus || 'In Transit'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Create Cargo Package Modal */}
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
