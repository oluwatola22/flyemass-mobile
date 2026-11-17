import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { LagosHub } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Copy, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2, 
  Check, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  RefreshCw,
  Truck,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';

export const AdminLagosHubsScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();

  const [hubs, setHubs] = useState<LagosHub[]>(() => db.getLagosHubs(false));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHub, setEditingHub] = useState<LagosHub | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<LagosHub | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: 'Ikeja',
    address: '',
    phone: '+234 803 ',
    contactPerson: '',
    operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
    doorstepDispatchAvailable: true,
    sortOrder: 1,
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync hubs from db and authoritative backend
  const loadHubs = async (silent: boolean = false) => {
    if (!silent && hubs.length === 0) {
      setIsLoading(true);
    }
    try {
      const data = await db.lagosHubsQuery(false);
      if (data && data.length > 0) {
        setHubs(data);
      } else {
        setHubs(db.getLagosHubs(false));
      }
    } catch {
      setHubs(db.getLagosHubs(false));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHubs();
    return db.subscribe(() => {
      const nextHubs = db.getLagosHubs(false);
      setHubs((prev) => {
        if (
          prev.length === nextHubs.length &&
          prev.every((h, i) => h.id === nextHubs[i]?.id && h.isActive === nextHubs[i]?.isActive && h.updatedAt === nextHubs[i]?.updatedAt)
        ) {
          return prev;
        }
        return nextHubs;
      });
    });
  }, []);

  // Filtered & Sorted Hubs
  const filteredHubs = useMemo(() => {
    return hubs.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.contactPerson && h.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDistrict = districtFilter === 'all' || h.district.toLowerCase() === districtFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? h.isActive !== false : h.isActive === false);

      return matchesSearch && matchesDistrict && matchesStatus;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [hubs, searchQuery, districtFilter, statusFilter]);

  // District options
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    hubs.forEach(h => {
      if (h.district) set.add(h.district);
    });
    return Array.from(set).sort();
  }, [hubs]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = hubs.length;
    const active = hubs.filter(h => h.isActive !== false).length;
    const doorstep = hubs.filter(h => h.doorstepDispatchAvailable && h.isActive !== false).length;
    return { total, active, doorstep };
  }, [hubs]);

  const openAddModal = () => {
    setEditingHub(null);
    setFormData({
      name: '',
      code: `LOS-${Math.floor(100 + Math.random() * 900)}`,
      district: 'Ikeja',
      address: '',
      phone: '+234 803 ',
      contactPerson: '',
      operatingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
      doorstepDispatchAvailable: true,
      sortOrder: hubs.length + 1,
      isActive: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (hub: LagosHub) => {
    setEditingHub(hub);
    setFormData({
      name: hub.name,
      code: hub.code,
      district: hub.district,
      address: hub.address,
      phone: hub.phone,
      contactPerson: hub.contactPerson || '',
      operatingHours: hub.operatingHours || 'Mon - Sat: 8:00 AM - 6:00 PM',
      doorstepDispatchAvailable: hub.doorstepDispatchAvailable !== false,
      sortOrder: hub.sortOrder || 1,
      isActive: hub.isActive !== false
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Hub Station Name is required';
    if (!formData.code.trim()) errors.code = 'Hub Code (e.g. LOS-IKJ) is required';
    if (!formData.district.trim()) errors.district = 'District / Area is required';
    if (!formData.address.trim()) errors.address = 'Street address is required';
    if (!formData.phone.trim() || formData.phone.length < 8) errors.phone = 'Valid phone number required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingHub) {
        await db.updateLagosHub(editingHub.id, formData, adminUser?.uid || 'adm-001');
        showToast(`Lagos Hub "${formData.name}" updated successfully!`, 'success');
      } else {
        await db.createLagosHub(formData, adminUser?.uid || 'adm-001');
        showToast(`New Lagos Hub "${formData.name}" created and synced with mobile app!`, 'success');
      }
      setIsModalOpen(false);
      loadHubs(true);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (hub: LagosHub) => {
    try {
      const nextStatus = !hub.isActive;
      await db.updateLagosHub(hub.id, { isActive: nextStatus }, adminUser?.uid || 'adm-001');
      showToast(`Hub "${hub.name}" is now ${nextStatus ? 'Visible (Active)' : 'Hidden (Inactive)'} in mobile registration.`, 'info');
      loadHubs(true);
    } catch (err: any) {
      showToast(err.message || 'Status toggle failed', 'error');
    }
  };

  const handleToggleDoorstep = async (hub: LagosHub) => {
    try {
      const next = !hub.doorstepDispatchAvailable;
      await db.updateLagosHub(hub.id, { doorstepDispatchAvailable: next }, adminUser?.uid || 'adm-001');
      showToast(`Doorstep dispatch from "${hub.name}" ${next ? 'enabled' : 'disabled'}.`, 'info');
      loadHubs(true);
    } catch (err: any) {
      showToast(err.message || 'Toggle failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await db.deleteLagosHub(deleteTarget.id);
      showToast(`Lagos Hub "${deleteTarget.name}" deleted.`, 'success');
      setDeleteTarget(null);
      loadHubs(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete hub', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Lagos Offices & Last-Mile Hubs</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                {metrics.active} of {metrics.total} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure Nigerian physical collection stations, doorstep dispatch zones, and real-time counter release desks synced with the customer app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadHubs()}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Hubs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Collection Hub</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Lagos Stations</span>
          <p className="text-2xl font-black text-white num-tabular">{metrics.total}</p>
          <span className="text-[11px] text-slate-500">Physical collection points across Lagos State</span>
        </div>
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active in Mobile Registration</span>
          <p className="text-2xl font-black text-emerald-400 num-tabular">{metrics.active}</p>
          <span className="text-[11px] text-slate-500">Live options in Step 3 Package Registration</span>
        </div>
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Doorstep Dispatch Capable</span>
          <p className="text-2xl font-black text-indigo-400 num-tabular">{metrics.doorstep}</p>
          <span className="text-[11px] text-slate-500">Stations with courier riders assigned for last-mile</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by hub name, code, district, address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Districts ({uniqueDistricts.length})</option>
            {uniqueDistricts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Visibility Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Visibility</option>
            <option value="active">Active Only</option>
            <option value="inactive">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Lagos Hubs Table / Card Grid */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lagos Stations Directory ({filteredHubs.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Ranked by Sort Priority
          </span>
        </div>

        {filteredHubs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No collection stations matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredHubs.map((hub) => (
              <div
                key={hub.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 relative overflow-hidden ${
                  hub.isActive !== false
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                }`}
              >
                {/* Top Row: Name, Code, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {hub.sortOrder || 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white">{hub.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-emerald-400">
                          {hub.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">{hub.district}</span>
                        <span>•</span>
                        <span>{hub.operatingHours || 'Mon - Sat: 8:00 AM - 6:00 PM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility Pill */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                      hub.isActive !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {hub.isActive !== false ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Address & Contact Row */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{hub.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span className="font-mono text-slate-200">{hub.phone}</span>
                    </div>
                    {hub.contactPerson && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>Attn: <strong className="text-slate-200">{hub.contactPerson}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls & Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDoorstep(hub)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                        hub.doorstepDispatchAvailable
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      <span>{hub.doorstepDispatchAvailable ? 'Doorstep Enabled' : 'No Doorstep'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleActive(hub)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {hub.isActive !== false ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                      <span>{hub.isActive !== false ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(hub)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Edit Hub"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(hub)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Hub"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>{editingHub ? 'Edit Lagos Collection Station' : 'Add New Lagos Collection Station'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Station Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ikeja MMIA Cargo Terminal"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.name && <span className="text-[10px] text-rose-400 mt-0.5 block">{formErrors.name}</span>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Station Code (Unique) *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LOS-IKJ"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  {formErrors.code && <span className="text-[10px] text-rose-400 mt-0.5 block">{formErrors.code}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    District / Area *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Ikeja, Alaba, Lekki"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.district && <span className="text-[10px] text-rose-400 mt-0.5 block">{formErrors.district}</span>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Physical Address *
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Cargo Village, Murtala Muhammed International Airport, Airport Road, Ikeja, Lagos"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
                {formErrors.address && <span className="text-[10px] text-rose-400 mt-0.5 block">{formErrors.address}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 999 1001"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  {formErrors.phone && <span className="text-[10px] text-rose-400 mt-0.5 block">{formErrors.phone}</span>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Station Manager / Attn
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Babatunde Balogun"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="Mon - Sat: 8:00 AM - 6:00 PM"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.doorstepDispatchAvailable}
                    onChange={(e) => setFormData({ ...formData, doorstepDispatchAvailable: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded bg-slate-950 border-slate-800"
                  />
                  <span>Doorstep Delivery Dispatch Capable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded bg-slate-950 border-slate-800"
                  />
                  <span>Active in Customer App</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingHub ? 'Save Hub Station' : 'Create Hub Station')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Delete Lagos Hub?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <strong className="text-white">"{deleteTarget.name}"</strong> ({deleteTarget.code})? This will remove it from future package pre-alerts.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
