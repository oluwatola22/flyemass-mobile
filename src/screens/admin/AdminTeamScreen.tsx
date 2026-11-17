import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  AdminUser, 
  AdminRole, 
  AdminModulePermission,
  ALL_ADMIN_MODULE_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  firebaseSync 
} from '../../services/firebase';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  Activity, 
  Search, 
  Plus, 
  CheckCircle2, 
  Lock, 
  MapPin,
  ExternalLink,
  FileText,
  X,
  KeyRound,
  AlertTriangle,
  UserX,
  UserCheck,
  Check,
  Copy,
  RefreshCw,
  Sliders,
  Package,
  Layers,
  DollarSign,
  HelpCircle,
  Truck,
  Building2,
  Key,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface RBACModuleSpec {
  id: AdminModulePermission;
  name: string;
  path: string;
  category: 'core' | 'treasury' | 'commerce';
  description: string;
}

const RBAC_MODULE_SPECS: RBACModuleSpec[] = [
  {
    id: 'shipments',
    name: 'Shipments & Cargo Pipeline',
    path: '/admin/shipments',
    category: 'core',
    description: 'Cargo intake, dock scanning, volumetric billing calculation, 17-state tracking, and OTP counter release'
  },
  {
    id: 'agents',
    name: 'Agent Sourcing & Procurement',
    path: '/admin/agent-requests',
    category: 'core',
    description: 'Mobile client RFQs, factory negotiation, quotation dispatch, and escrow locks'
  },
  {
    id: 'support',
    name: 'Support Tickets & Duty Desk',
    path: '/admin/support/tickets',
    category: 'core',
    description: 'Real-time trade concierge messaging, attachment reviews, and ticket resolution'
  },
  {
    id: 'lagos_hubs',
    name: 'Lagos Hubs & Last-Mile Delivery',
    path: '/admin/lagos-hubs',
    category: 'core',
    description: 'Dynamic collection hubs, pickup point operations, and Lagos fulfillment offices'
  },
  {
    id: 'shipping_rates',
    name: 'Air Shipping & Logistics FX Rates',
    path: '/admin/settings/shipping',
    category: 'core',
    description: 'Air shipping rates ($/kg + flat fees) and live logistics FX conversion engine'
  },
  {
    id: 'users',
    name: 'User Directory & Client Wallets',
    path: '/admin/users',
    category: 'treasury',
    description: 'Customer directory, multi-currency wallet ledger, KYC, and transaction limits'
  },
  {
    id: 'treasury',
    name: 'Treasury, Payouts & General Ledger',
    path: '/admin/payments',
    category: 'treasury',
    description: 'RMB supplier transfers, Nigerian bank payouts, FX margin controls, and funding approvals'
  },
  {
    id: 'commerce',
    name: 'Hubs, Real Estate & Inventory',
    path: '/admin/warehouses',
    category: 'commerce',
    description: 'Origin warehouses, Tech Gadget shop, hotel reservations, and commercial office rentals'
  }
];

export const AdminTeamScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());

  // Listen to live database updates
  useEffect(() => {
    return db.subscribe(() => {
      setDbRev(db.getStateRevision());
    });
  }, []);

  const staffMembers: AdminUser[] = useMemo(() => db.getAdminStaff(), [db.getStateRevision()]);
  const [auditLogs, setAuditLogs] = useState(() => firebaseSync.getAuditLogs());
  const [activeTab, setActiveTab] = useState<'team' | 'audit'>('team');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [permissionModalStaff, setPermissionModalStaff] = useState<AdminUser | null>(null);
  const [credentialsModalStaff, setCredentialsModalStaff] = useState<AdminUser | null>(null);

  // New Staff Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('logistics_manager');
  const [newDepartment, setNewDepartment] = useState('Cross-Border Cargo Operations');
  const [newHub, setNewHub] = useState('Guangzhou Baiyun Hub');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminModulePermission[]>(
    ROLE_DEFAULT_PERMISSIONS.logistics_manager
  );
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Permission Editing State
  const [editingPermissions, setEditingPermissions] = useState<AdminModulePermission[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Deep-linking support for /admin/governance/rbac/new on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/new')) {
      handleOpenAddModal();
    }
  }, []);

  // Update permissions when role changes in add form
  const handleRoleSelectChange = (role: AdminRole) => {
    setNewRole(role);
    const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ['shipments'];
    setSelectedPermissions(defaults);

    const deptMap: Record<AdminRole, string> = {
      super_admin: 'Executive Governance & Security',
      finance_officer: 'Treasury & FX Settlements',
      logistics_manager: 'Cross-Border Cargo Operations',
      support_agent: 'Customer Support Duty Desk',
      warehouse_officer: 'Origin Warehouse Receiving',
      custom: 'Special Operations'
    };
    setNewDepartment(deptMap[role] || 'Operations Team');
  };

  const handleOpenAddModal = () => {
    const generated = `Flye@${Math.floor(1000 + Math.random() * 9000)}#2026`;
    setNewTempPassword(generated);
    setSelectedPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || ['shipments']);
    setShowAddModal(true);
    if (typeof window !== 'undefined' && window.history && !window.location.pathname.includes('/new')) {
      window.history.pushState({ route: 'admin-team' }, '', '/admin/governance/rbac/new');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    if (typeof window !== 'undefined' && window.history && window.location.pathname.includes('/new')) {
      window.history.pushState({ route: 'admin-team' }, '', '/admin/governance/rbac');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Please provide full official name and corporate email', 'error');
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await db.provisionStaff(
        {
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          department: newDepartment,
          hubLocation: newHub,
          permissions: selectedPermissions,
          tempPassword: newTempPassword
        },
        adminUser?.uid || 'adm-001'
      );

      if (res.success && res.staff) {
        showToast(`Staff officer ${res.staff.name} provisioned with ${res.staff.permissions.length} module permissions!`, 'success');
        firebaseSync.recordAudit(
          adminUser?.name || 'Executive Director',
          'STAFF_ACCOUNT_PROVISIONED',
          'users',
          res.staff.uid,
          `Provisioned ${res.staff.name} (${res.staff.roleTitle}) with credentials`
        );
        setAuditLogs(firebaseSync.getAuditLogs());
        handleCloseAddModal();
        setCredentialsModalStaff(res.staff);
        setNewName('');
        setNewEmail('');
      } else {
        showToast(res.error || 'Failed to create staff member', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to provision staff officer', 'error');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleOpenPermissionModal = (staff: AdminUser) => {
    setPermissionModalStaff(staff);
    setEditingPermissions([...(staff.permissions || ROLE_DEFAULT_PERMISSIONS[staff.role] || [])]);
  };

  const handleTogglePermission = (modId: AdminModulePermission) => {
    setEditingPermissions(prev => {
      if (prev.includes(modId)) {
        return prev.filter(p => p !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!permissionModalStaff) return;
    if (permissionModalStaff.uid === 'adm-001') {
      showToast('Master Super Admin account permissions are immutable', 'error');
      return;
    }

    setIsSavingPermissions(true);
    try {
      const res = await db.updateStaffPermissions(
        permissionModalStaff.uid,
        editingPermissions,
        adminUser?.uid || 'adm-001'
      );
      if (res.success) {
        showToast(`Permissions updated for ${permissionModalStaff.name} (${editingPermissions.length} modules granted)`, 'success');
        firebaseSync.recordAudit(
          adminUser?.name || 'Executive Director',
          'STAFF_PERMISSIONS_UPDATED',
          'users',
          permissionModalStaff.uid,
          `Updated permissions to [${editingPermissions.join(', ')}]`
        );
        setAuditLogs(firebaseSync.getAuditLogs());
        setPermissionModalStaff(null);
      } else {
        showToast(res.error || 'Failed to update permissions', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating permissions', 'error');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleStatus = async (staff: AdminUser) => {
    if (staff.uid === 'adm-001') {
      showToast('Security Enclave: Master Super Admin cannot be suspended', 'error');
      return;
    }

    const nextStatus = staff.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await db.toggleStaffStatus(staff.uid, nextStatus, adminUser?.uid || 'adm-001');
      if (res.success) {
        const actionLabel = nextStatus === 'active' ? 'activated' : 'suspended';
        showToast(`Staff member ${staff.name} has been ${actionLabel}`, nextStatus === 'active' ? 'success' : 'info');
        firebaseSync.recordAudit(
          adminUser?.name || 'Executive Director',
          nextStatus === 'suspended' ? 'STAFF_ACCOUNT_SUSPENDED' : 'STAFF_ACCOUNT_ACTIVATED',
          'users',
          staff.uid,
          `Status changed to ${nextStatus.toUpperCase()}`
        );
        setAuditLogs(firebaseSync.getAuditLogs());
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle staff status', 'error');
    }
  };

  const handleResetPassword = async (staff: AdminUser) => {
    try {
      const res = await db.resetStaffCredentials(staff.uid, adminUser?.uid || 'adm-001');
      if (res.success && res.staff) {
        showToast(`New credentials generated for ${staff.name}`, 'success');
        setCredentialsModalStaff(res.staff);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset credentials', 'error');
    }
  };

  // Filter staff list
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(staff => {
      if (statusFilter !== 'all' && staff.status !== statusFilter) return false;
      if (departmentFilter !== 'all' && staff.department !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          staff.name.toLowerCase().includes(q) ||
          staff.email.toLowerCase().includes(q) ||
          staff.roleTitle.toLowerCase().includes(q) ||
          staff.hubLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffMembers, searchQuery, departmentFilter, statusFilter]);

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const total = staffMembers.length;
    const active = staffMembers.filter(s => s.status === 'active').length;
    const suspended = staffMembers.filter(s => s.status === 'suspended').length;
    const superAdmins = staffMembers.filter(s => s.role === 'super_admin').length;
    return { total, active, suspended, superAdmins };
  }, [staffMembers]);

  // Department List for Filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffMembers.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [staffMembers]);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`, 'success');
    }
  };

  return (
    <AdminLayout activeTab="team">
      <div className="space-y-6">
        {/* =========================================================================
            HEADER & EXECUTIVE ACTION BAR
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>System & Governance</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">Role-Based Access Control (RBAC)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Staff Governance & RBAC Access Control</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono font-bold">
                • Security Enclave Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Provision staff accounts, assign departmental roles, and enforce granular module-by-module permission restrictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Staff Directory ({staffMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Security Audit Trail ({auditLogs.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/25 text-xs font-extrabold shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Staff Officer</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TOP EXECUTIVE METRIC CARDS
           ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Staff Accounts</span>
            <div className="text-2xl font-black text-white font-mono">{metrics.total}</div>
            <span className="text-[10px] text-slate-500 block">Across global hubs & clearing desks</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active Staff Officers</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.active}</div>
            <span className="text-[10px] text-slate-500 block">Authorized operational sessions</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Suspended Accounts</span>
            <div className="text-2xl font-black text-rose-400 font-mono">{metrics.suspended}</div>
            <span className="text-[10px] text-slate-500 block">Access revoked by Super Admin</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Super Administrators</span>
            <div className="text-2xl font-black text-indigo-400 font-mono">{metrics.superAdmins}</div>
            <span className="text-[10px] text-slate-500 block">Full enclave root overrides</span>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: STAFF DIRECTORY & GRANULAR PERMISSION MATRIX
           ========================================================================= */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, department, or hub location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Department filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="all">All Departments ({staffMembers.length})</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Staff Accounts Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Role & Department</th>
                      <th className="py-3.5 px-4">Hub Assignment</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Permitted Modules</th>
                      <th className="py-3.5 px-4">Last Active</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No staff accounts found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => {
                        const isMaster = staff.uid === 'adm-001';
                        const isSuspended = staff.status === 'suspended';
                        const perms = staff.permissions || ROLE_DEFAULT_PERMISSIONS[staff.role] || [];
                        const permCount = perms.length;

                        return (
                          <tr key={staff.uid} className={`hover:bg-slate-950/50 transition-colors ${isSuspended ? 'opacity-70 bg-rose-950/10' : ''}`}>
                            {/* Member info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={staff.avatar}
                                  alt={staff.name}
                                  className={`w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ${
                                    isMaster ? 'ring-amber-500/50' : (isSuspended ? 'ring-rose-500/50' : 'ring-indigo-500/40')
                                  }`}
                                />
                                <div>
                                  <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                                    <span>{staff.name}</span>
                                    {isMaster ? (
                                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold flex items-center gap-1">
                                        <Lock className="w-2.5 h-2.5" /> MASTER
                                      </span>
                                    ) : null}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block">{staff.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Role & Department */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-200 block">{staff.roleTitle}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{staff.department}</span>
                            </td>

                            {/* Hub location */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-400" />
                                <span>{staff.hubLocation}</span>
                              </span>
                            </td>

                            {/* Status Toggle */}
                            <td className="py-3.5 px-4">
                              {isMaster ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                  PROTECTED
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(staff)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isSuspended
                                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                  }`}
                                  title={`Click to ${isSuspended ? 'activate' : 'suspend'} staff member`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <UserX className="w-3 h-3" />
                                      <span>Suspended</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3" />
                                      <span>Active</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>

                            {/* Permitted modules count & hover */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                                  permCount === 8
                                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                }`}>
                                  {permCount}/8 Modules
                                </span>
                              </div>
                            </td>

                            {/* Last active */}
                            <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px]">
                              {staff.lastLogin}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPermissionModal(staff)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Edit granular module permissions"
                                >
                                  <Sliders className="w-3 h-3 text-indigo-400" />
                                  <span>Edit Permissions</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCredentialsModalStaff(staff)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="View temporary password and invite link"
                                >
                                  <KeyRound className="w-3 h-3 text-amber-400" />
                                  <span>Invite / Key</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: IMMUTABLE AUDIT TRAIL
           ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Immutable RBAC & Security Audit Logs</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Append-only cryptographic audit chain
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admin Officer</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Operational Details</th>
                    <th className="py-3 px-4">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => {
                    const isDenied = log.action === 'UNAUTHORIZED_ACCESS_BLOCKED';
                    return (
                      <tr key={log.id} className={`hover:bg-slate-950/50 transition-colors ${isDenied ? 'bg-rose-950/20' : ''}`}>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-white text-[11px]">{log.adminName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            isDenied
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-950 border border-slate-800 text-indigo-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">/{log.targetCollection}</td>
                        <td className={`py-3 px-4 text-[11px] ${isDenied ? 'text-rose-300 font-semibold' : 'text-slate-300'}`}>
                          {log.details}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{log.ipAddress}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: PROVISION NEW STAFF OFFICER & CREDENTIALS
           ========================================================================= */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Provision Staff Officer & Assign Permissions</h3>
                    <p className="text-[10px] text-slate-400">Create administrative credentials and configure module access</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-950"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Full Official Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ibrahim Danjuma"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Corporate Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ibrahim.d@flyemass.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Assigned Role Preset</label>
                    <select
                      value={newRole}
                      onChange={(e) => handleRoleSelectChange(e.target.value as AdminRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-indigo-500"
                    >
                      <option value="logistics_manager">Warehouse / Cargo Operations Officer</option>
                      <option value="finance_officer">Treasury Manager & FX Officer</option>
                      <option value="support_agent">Customer Support Duty Desk</option>
                      <option value="warehouse_officer">Warehouse Intake Officer</option>
                      <option value="super_admin">Super Administrator (Full Root)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Hub Location</label>
                    <select
                      value={newHub}
                      onChange={(e) => setNewHub(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-indigo-500"
                    >
                      <option value="Guangzhou Baiyun Hub">Guangzhou Baiyun Hub</option>
                      <option value="Yiwu International Trade Port">Yiwu International Trade Port</option>
                      <option value="Shenzhen Futian Tech Center">Shenzhen Futian Tech Center</option>
                      <option value="Lagos MM2 Air Freight Hub">Lagos MM2 Air Freight Hub</option>
                      <option value="Victoria Island Clearing Center">Victoria Island Clearing Center</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Temporary Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Temporary Staff Password</label>
                    <button
                      type="button"
                      onClick={() => setNewTempPassword(`Flye@${Math.floor(1000 + Math.random() * 9000)}#2026`)}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Re-generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-emerald-400 font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Granular Module Permission Matrix Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-white block">Initial Granular Module Permissions</span>
                      <span className="text-[10px] text-slate-400">Select which admin pages this staff officer can view and access</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions([...ALL_ADMIN_MODULE_PERMISSIONS])}
                        className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        Grant All
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || ['shipments'])}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Role Defaults
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {RBAC_MODULE_SPECS.map((spec) => {
                      const isChecked = selectedPermissions.includes(spec.id);
                      return (
                        <div
                          key={spec.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedPermissions(prev => prev.filter(p => p !== spec.id));
                            } else {
                              setSelectedPermissions(prev => [...prev, spec.id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-slate-950 border-indigo-500/40 shadow-xs'
                              : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isChecked ? 'bg-indigo-600 text-white border-indigo-500 text-slate-950' : 'border-slate-600 bg-transparent'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white text-[11px] block truncate">{spec.name}</span>
                            <span className="text-[9px] text-indigo-400 font-mono block">{spec.path}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/25 font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNew ? 'Provisioning...' : 'Provision Officer & Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: GRANULAR PERMISSION RESTRICTION MATRIX (EDIT STAFF)
           ========================================================================= */}
        {permissionModalStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={permissionModalStaff.avatar}
                    alt={permissionModalStaff.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-indigo-500/40"
                  />
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Edit Permissions — {permissionModalStaff.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">{permissionModalStaff.roleTitle} · {permissionModalStaff.department}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPermissionModalStaff(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-950"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {permissionModalStaff.uid === 'adm-001' ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Security Enclave Root Administrator</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Chief Babatunde Alade is the Master Super Administrator. Root system access cannot be revoked or restricted to ensure platform continuity.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-xs block">Granular Module Permissions Grid</span>
                      <span className="text-[10px] text-slate-400">Restricted modules are hidden from sidebar and blocked via route guards</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPermissions([...ALL_ADMIN_MODULE_PERMISSIONS])}
                        className="text-[10px] text-indigo-400 hover:underline font-bold cursor-pointer"
                      >
                        Grant All
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setEditingPermissions([])}
                        className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                      >
                        Revoke All
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setEditingPermissions(ROLE_DEFAULT_PERMISSIONS[permissionModalStaff.role] || ['shipments'])}
                        className="text-[10px] text-slate-400 hover:text-white font-bold cursor-pointer"
                      >
                        Role Defaults
                      </button>
                    </div>
                  </div>

                  {/* Module Toggle List */}
                  <div className="space-y-2">
                    {RBAC_MODULE_SPECS.map((spec) => {
                      const isPermitted = editingPermissions.includes(spec.id);
                      return (
                        <div
                          key={spec.id}
                          onClick={() => handleTogglePermission(spec.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isPermitted
                              ? 'bg-slate-950 border-indigo-500/40 shadow-xs'
                              : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-2">
                            <div className={`w-5 h-5 rounded-lg mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                              isPermitted ? 'bg-indigo-600 text-white border-indigo-500 text-slate-950' : 'border-slate-600 bg-transparent'
                            }`}>
                              {isPermitted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-white text-xs block truncate">{spec.name}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{spec.description}</p>
                              <span className="text-[9px] text-indigo-400 font-mono mt-1 inline-block">{spec.path}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                            isPermitted ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {isPermitted ? 'PERMITTED' : 'RESTRICTED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPermissionModalStaff(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={isSavingPermissions}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/25 font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: CREDENTIALS & INVITE LINK POPUP
           ========================================================================= */}
        {credentialsModalStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Staff Login Credentials</h3>
                    <p className="text-[10px] text-slate-400">{credentialsModalStaff.name} ({credentialsModalStaff.roleTitle})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCredentialsModalStaff(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-950"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Official Email */}
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Official Corporate Email</span>
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-white text-xs">{credentialsModalStaff.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(credentialsModalStaff.email, 'Email')}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Temporary Password */}
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Temporary Staff Password</span>
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      {credentialsModalStaff.tempPassword || 'Flye@Master2026#Secure'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(credentialsModalStaff.tempPassword || 'Flye@Master2026#Secure', 'Password')}
                      className="text-emerald-400 hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Secure Invite Link */}
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Secure Invite & Login Link</span>
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-slate-300 text-[10px] truncate max-w-[240px]">
                      {typeof window !== 'undefined' ? `${window.location.origin}/admin/login?invite=${credentialsModalStaff.inviteToken || credentialsModalStaff.uid}` : 'https://flyemass.com/admin/login'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const link = typeof window !== 'undefined'
                          ? `${window.location.origin}/admin/login?invite=${credentialsModalStaff.inviteToken || credentialsModalStaff.uid}`
                          : `https://flyemass.com/admin/login?invite=${credentialsModalStaff.inviteToken || credentialsModalStaff.uid}`;
                        copyToClipboard(link, 'Invite link');
                      }}
                      className="text-indigo-400 hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  Provide these credentials to the staff officer. Upon first sign-in, the officer will be prompted to configure their personal biometric/2FA security key.
                </div>

                <div className="pt-2 flex justify-between gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(credentialsModalStaff)}
                    className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCredentialsModalStaff(null)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
