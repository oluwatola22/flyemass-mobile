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
  const [activeTab, setActiveTab] = useState<'cargo' | 'warehouses' | 'rates'>('cargo');
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

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

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

  const handleUpdateStatus = (shipment: ShipmentDocument, newStatus: ShipmentDocument['currentStatus']) => {
    db.updateShipmentStatus(shipment.id, newStatus, {
      location: newStatus === 'Lagos Hub Ready' ? 'FlyeMass Ikeja Clearing Terminal, Lagos' : 
                newStatus === 'Delivered' ? 'Delivered to Customer Doorstep' :
                newStatus === 'In Transit/Customs' ? 'International Air/Sea Transit' : 'Guangzhou Dock Hub',
      notes: `Status advanced to ${newStatus} by Cargo Control Tower`
    });

    firebaseSync.recordAudit('Logistics Desk', 'SHIPMENT_STATUS_ADVANCE', 'shipments', shipment.id, `Status updated to ${newStatus}`);
    showToast(`Waybill #${shipment.trackingNumber} advanced to "${newStatus}"! Synced with mobile app.`, 'success');
    setDbState({ ...db.getState() });
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const tracking = newTrackingNumber || `FM-${newOrigin.slice(0, 3).toUpperCase()}-LOS-${Math.floor(10000 + Math.random() * 90000)}`;

    const newDoc = db.recordShipment({
      trackingNumber: tracking,
      userId: 'usr_alade_01',
      receiverName: newReceiver,
      originWarehouse: newOrigin,
      destination: 'Lagos Hub',
      weightKg: parseFloat(newWeight) || 10,
      mode: newMode,
      currentStatus: 'Origin Received',
      timeline: [
        {
          status: 'Origin Received',
          location: `${newOrigin} Logistics Consolidation Center`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes: 'Checked in by warehouse dock manager'
        }
      ],
      title: newTitle,
      cbm: Number(((parseFloat(newWeight) || 10) * 0.005).toFixed(2)),
      costEstimate: newMode === 'Air Freight' ? (parseFloat(newWeight) || 10) * 9.5 : (parseFloat(newWeight) || 10) * 2.8,
      costCurrency: 'USD'
    });

    firebaseSync.recordAudit('Logistics Desk', 'CREATE_WAYBILL', 'shipments', newDoc.id, `Created waybill #${tracking}`);
    showToast(`New cargo waybill #${tracking} created and broadcasted!`, 'success');
    setShowCreateModal(false);
    setDbState({ ...db.getState() });
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
