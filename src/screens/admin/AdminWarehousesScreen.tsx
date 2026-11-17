import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { Warehouse } from '../../types';
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
  Globe2, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  RefreshCw,
  Package,
  Layers,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface CountryOption {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const SUPPORTED_COUNTRIES: CountryOption[] = [
  { name: 'China', code: 'CN', flag: '🇨🇳', dialCode: '+86' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dialCode: '+234' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', dialCode: '+852' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', dialCode: '+233' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', dialCode: '+254' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', dialCode: '+90' }
];

export const AdminWarehousesScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => db.getWarehouses(true));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    country: 'China',
    province: '',
    city: '',
    fullAddress: '',
    postalCode: '',
    phone: '+86 ',
    contactPerson: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync warehouses from db and authoritative backend
  const loadWarehouses = async (silent: boolean = false) => {
    if (!silent && warehouses.length === 0) {
      setIsLoading(true);
    }
    try {
      const data = await db.fetchWarehouses(true);
      if (data && data.length > 0) {
        setWarehouses(data);
      } else {
        setWarehouses(db.getWarehouses(true));
      }
    } catch {
      setWarehouses(db.getWarehouses(true));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses(warehouses.length > 0);
    return db.subscribe(() => {
      const nextWhs = db.getWarehouses(true);
      setWarehouses((prev) => {
        if (
          prev.length === nextWhs.length &&
          prev.every((w, i) => w.id === nextWhs[i]?.id && w.isActive === nextWhs[i]?.isActive && w.updatedAt === nextWhs[i]?.updatedAt)
        ) {
          return prev;
        }
        return nextWhs;
      });
    });
  }, []);

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (countryFilter !== 'all' && wh.country.toLowerCase() !== countryFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'active' && wh.isActive === false) return false;
      if (statusFilter === 'inactive' && wh.isActive !== false) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        wh.name.toLowerCase().includes(q) ||
        wh.country.toLowerCase().includes(q) ||
        wh.city.toLowerCase().includes(q) ||
        (wh.province && wh.province.toLowerCase().includes(q)) ||
        wh.fullAddress.toLowerCase().includes(q) ||
        wh.phone.toLowerCase().includes(q) ||
        (wh.contactPerson && wh.contactPerson.toLowerCase().includes(q)) ||
        (wh.postalCode && wh.postalCode.toLowerCase().includes(q))
      );
    });
  }, [warehouses, searchQuery, countryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.isActive !== false).length;
    const countries = new Set(warehouses.map((w) => w.country)).size;
    const dbShipments = Object.values(db.getState().shipments || {});
    return { total, active, inactive: total - active, countries, shipmentsCount: dbShipments.length };
  }, [warehouses]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      country: 'China',
      province: '',
      city: '',
      fullAddress: '',
      postalCode: '',
      phone: '+86 ',
      contactPerson: '',
      isActive: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      name: wh.name,
      country: wh.country,
      province: wh.province || '',
      city: wh.city,
      fullAddress: wh.fullAddress || wh.addressEn || '',
      postalCode: wh.postalCode || '',
      phone: wh.phone,
      contactPerson: wh.contactPerson || wh.recipientEn || '',
      isActive: wh.isActive !== false
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Warehouse name is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.fullAddress.trim()) errors.fullAddress = 'Full physical address is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save (Create or Update)
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please correct the highlighted form errors', 'error');
      return;
    }

    setIsSubmitting(true);
    const adminId = adminUser?.uid || 'adm-001';
    const adminRole = adminUser?.role || 'super_admin';
    const adminName = adminUser?.name || 'Super Administrator';

    try {
      if (editingWarehouse) {
        await db.updateWarehouse(editingWarehouse.id, formData, adminId, adminRole, adminName);
        showToast(`Warehouse "${formData.name}" updated successfully`, 'success');
      } else {
        await db.addWarehouse(formData, adminId, adminRole, adminName);
        showToast(`Warehouse "${formData.name}" created and live!`, 'success');
      }
      setIsModalOpen(false);
      loadWarehouses();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status (Hide / Activate)
  const handleToggleStatus = async (wh: Warehouse) => {
    const newStatus = !wh.isActive;
    const adminId = adminUser?.uid || 'adm-001';
    const adminRole = adminUser?.role || 'super_admin';
    const adminName = adminUser?.name || 'Super Administrator';

    try {
      await db.toggleWarehouseStatus(wh.id, newStatus, adminId, adminRole, adminName);
      showToast(
        `Warehouse "${wh.name}" is now ${newStatus ? 'ACTIVE (visible to users)' : 'INACTIVE (hidden from users)'}`,
        'info'
      );
      loadWarehouses();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Copy Full Address
  const handleCopyAddress = (wh: Warehouse) => {
    const formatted = [
      `Warehouse: ${wh.name}`,
      wh.contactPerson ? `Contact Person: ${wh.contactPerson}` : '',
      `Address: ${wh.fullAddress}`,
      `City / Province: ${wh.city}${wh.province ? `, ${wh.province}` : ''}`,
      `Country: ${wh.country}`,
      wh.postalCode ? `Postal Code: ${wh.postalCode}` : '',
      `Phone: ${wh.phone}`
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(formatted);
    showToast('Warehouse address copied successfully.', 'success');
  };

  // Delete Warehouse (Safe Deletion Check)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const adminId = adminUser?.uid || 'adm-001';
    const adminRole = adminUser?.role || 'super_admin';
    const adminName = adminUser?.name || 'Super Administrator';

    try {
      await db.deleteWarehouse(deleteTarget.id, adminId, adminRole, adminName);
      showToast(`Warehouse "${deleteTarget.name}" deleted successfully`, 'success');
      setDeleteTarget(null);
      loadWarehouses();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete warehouse', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for flag
  const getCountryFlag = (countryName: string) => {
    const match = SUPPORTED_COUNTRIES.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    return match ? match.flag : '🌐';
  };

  return (
    <AdminLayout activeTab="warehouses">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Warehouses</h1>
                <p className="text-xs text-slate-400">
                  Consolidation hubs and destination addresses shown to users.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadWarehouses(false)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Refresh Warehouses"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Warehouse</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Hubs
              </p>
              <h3 className="text-2xl font-black text-white mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Active Hubs
              </p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Inactive Hubs
              </p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.inactive}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Countries Served
              </p>
              <h3 className="text-2xl font-black text-white mt-1">{stats.countries}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
          {/* Search Records */}
          <div className="relative w-full sm:w-80 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, country, city, address, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-emerald-500"
            >
              <option value="all">All Countries</option>
              {Array.from(new Set(warehouses.map((w) => w.country))).map((c) => (
                <option key={c} value={c}>
                  {getCountryFlag(c)} {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({warehouses.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Warehouse Cards Grid */}
        {filteredWarehouses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                className={`p-5 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
                  wh.isActive === false
                    ? 'border-slate-800/60 opacity-75 bg-slate-900/50'
                    : 'border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(wh.country)}</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-white leading-tight">
                          {wh.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {wh.city}
                          {wh.province ? `, ${wh.province}` : ''} • {wh.country}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        wh.isActive !== false
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          wh.isActive !== false ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span>{wh.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>

                  {/* Physical Address */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>Address</span>
                      </span>
                      {wh.postalCode && (
                        <span className="font-mono text-slate-400">Zip: {wh.postalCode}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans select-all">
                      {wh.fullAddress}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-400">Phone:</span>
                      <strong className="font-mono text-emerald-400 select-all">{wh.phone}</strong>
                    </div>

                    {wh.contactPerson && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-slate-400">Contact:</span>
                        <strong className="text-white">{wh.contactPerson}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions (Copy, Edit, Hide/Activate, Delete) */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  {/* 1. Copy */}
                  <button
                    onClick={() => handleCopyAddress(wh)}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Copy full warehouse address"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </button>

                  {/* 2. Edit */}
                  <button
                    onClick={() => handleOpenEditModal(wh)}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Edit warehouse details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>

                  {/* 3. Hide / Activate */}
                  <button
                    onClick={() => handleToggleStatus(wh)}
                    className={`flex-1 py-2 px-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      wh.isActive !== false
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                    }`}
                    title={wh.isActive !== false ? 'Hide warehouse from users' : 'Activate warehouse'}
                  >
                    {wh.isActive !== false ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  {/* 4. Delete */}
                  <button
                    onClick={() => setDeleteTarget(wh)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete warehouse (safe check)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Warehouses Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No warehouses matched your search query "${searchQuery}".`
                : 'No warehouses have been registered in the system yet.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT WAREHOUSE MODAL FORM */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingWarehouse
                    ? 'Update warehouse location and contact specifications'
                    : 'Register a new consolidation receiving hub for customers'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              {/* 1. Warehouse Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Warehouse Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guangzhou Main Warehouse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-white outline-none transition-all ${
                    formErrors.name
                      ? 'border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-[11px] text-rose-400">{formErrors.name}</p>
                )}
              </div>

              {/* 2. Country & Province/State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Country <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const cObj = SUPPORTED_COUNTRIES.find((c) => c.name === selected);
                      setFormData({
                        ...formData,
                        country: selected,
                        phone: cObj ? `${cObj.dialCode} ` : formData.phone
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Province / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guangdong Province / Texas"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 3. City & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    City <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guangzhou"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-white outline-none transition-all ${
                      formErrors.city
                        ? 'border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 510440 / 77060"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* 4. Full Address (Textarea) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Address <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Complete physical warehouse address (street, building, district, room number)..."
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-white outline-none transition-all ${
                    formErrors.fullAddress
                      ? 'border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {formErrors.fullAddress && (
                  <p className="mt-1 text-[11px] text-rose-400">{formErrors.fullAddress}</p>
                )}
              </div>

              {/* 5. Phone Number & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +86 186 2008 9142"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-white outline-none transition-all font-mono ${
                      formErrors.phone
                        ? 'border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manager Chen (陈经理)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 6. Active Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Active — Visible to Users</p>
                  <p className="text-[11px] text-slate-400">
                    When active, customers can select this warehouse on Register Package.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingWarehouse ? 'Save Changes' : 'Add Warehouse'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (SAFE DELETION GUARD) */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">Delete Warehouse Hub?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{deleteTarget.name}"</strong>?
              </p>
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Safe Deletion Guard</span>
                </p>
                <p>
                  If this warehouse is referenced by existing packages or cargo shipments, deletion will be blocked to preserve historical records. You can choose to <strong>Hide</strong> it instead.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <span>Verifying...</span> : <span>Delete Warehouse</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
