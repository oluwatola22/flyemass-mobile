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
  ExternalLink
} from 'lucide-react';

export const AdminLogisticsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'Air Freight' | 'Sea Freight'>('all');
  
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewTrackingNumber(`FM-CAN-LOS-${Math.floor(10000 + Math.random() * 90000)}`);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Cargo Waybill</span>
            </button>
          </div>
        </div>

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

                {/* Live Timeline Waypoints Preview */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Last Milestone: <strong>{shipment.timeline[shipment.timeline.length - 1]?.location || shipment.originWarehouse}</strong></span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {shipment.timeline.length} waypoint events logged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
