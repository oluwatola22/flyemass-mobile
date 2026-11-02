import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { INITIAL_ADMINS, firebaseSync, AdminUser, AdminRole } from '../../services/firebase';
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
  AlertTriangle
} from 'lucide-react';

export const AdminTeamScreen: React.FC = () => {
  const { showToast } = useApp();
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [auditLogs, setAuditLogs] = useState(firebaseSync.getAuditLogs());
  const [activeTab, setActiveTab] = useState<'team' | 'audit'>('team');
  const [showAddModal, setShowAddModal] = useState(false);

  // New admin form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('logistics_manager');
  const [newHub, setNewHub] = useState('Guangzhou Baiyun Hub');

  const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
    super_admin: ['Full System Override', 'Cryptographic PIN Reset', 'Ledger Reconciliation', 'Balance Top-ups', 'Treasury Liquidity'],
    finance_officer: ['RMB Supplier Clearance', 'NUBAN Bank Payouts', 'FX Spread Margin Config', 'Escrow Release'],
    logistics_manager: ['Air/Sea Waypoint Advance', 'Flight Cargo Manifests', 'Customs Pre-clearance', 'AWB Generation'],
    support_agent: ['Live Chat Concierge', 'Ticket Resolution', 'Supplier Dispute Mediation']
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Please provide full name and business email', 'error');
      return;
    }

    const roleTitles: Record<AdminRole, string> = {
      super_admin: 'Super Administrator',
      finance_officer: 'Treasury & FX Officer',
      logistics_manager: 'Logistics Operations Officer',
      support_agent: 'Client Concierge Specialist'
    };

    const newAdmin: AdminUser = {
      uid: `adm-${Date.now().toString().slice(-4)}`,
      name: newName,
      email: newEmail,
      role: newRole,
      roleTitle: roleTitles[newRole],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      hubLocation: newHub,
      lastLogin: 'Never (Pending 2FA Setup)'
    };

    setAdmins(prev => [...prev, newAdmin]);
    firebaseSync.recordAudit('Executive Director', 'PROVISION_ADMIN', 'users', newAdmin.uid, `Provisioned ${newName} as ${newAdmin.roleTitle}`);
    setAuditLogs(firebaseSync.getAuditLogs());
    showToast(`Staff officer ${newName} provisioned with ${newRole.toUpperCase()} credentials!`, 'success');
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
  };

  const handleChangeRole = (adminId: string, role: AdminRole) => {
    if (adminId === 'adm-001') {
      showToast('Master Super Admin account is cryptographically protected and cannot be altered', 'error');
      return;
    }

    const roleTitles: Record<AdminRole, string> = {
      super_admin: 'Super Administrator',
      finance_officer: 'Treasury & FX Officer',
      logistics_manager: 'Logistics Operations Officer',
      support_agent: 'Client Concierge Specialist'
    };

    setAdmins(prev => prev.map(a => {
      if (a.uid === adminId) {
        return { ...a, role, roleTitle: roleTitles[role] };
      }
      return a;
    }));

    firebaseSync.recordAudit('Executive Director', 'UPDATE_ROLE', 'users', adminId, `Updated role to ${role}`);
    setAuditLogs(firebaseSync.getAuditLogs());
    showToast(`Permissions updated to ${roleTitles[role]}`, 'info');
  };

  return (
    <AdminLayout activeTab="team">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Admin Team & Security RBAC Controls</h1>
            <p className="text-xs text-slate-400">
              Manage Role-Based Access Control (RBAC) permissions and review immutable administrative logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Officer</span>
            </button>

            <div className="flex gap-1.5 ml-2">
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'team' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                Team Directory ({admins.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'audit' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                Audit Trail ({auditLogs.length})
              </button>
            </div>
          </div>
        </div>

        {/* 1. TEAM RBAC DIRECTORY */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((adm) => (
              <div
                key={adm.uid}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={adm.avatar}
                      alt={adm.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{adm.name}</span>
                        {adm.uid === 'adm-001' ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> MASTER
                          </span>
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </h3>
                      <p className="text-[11px] text-emerald-400 font-semibold">{adm.roleTitle}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{adm.email}</p>
                    </div>
                  </div>

                  {adm.uid !== 'adm-001' ? (
                    <select
                      value={adm.role}
                      onChange={(e) => handleChangeRole(adm.uid, e.target.value as AdminRole)}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold outline-none"
                    >
                      <option value="logistics_manager">Logistics Officer</option>
                      <option value="finance_officer">Finance Officer</option>
                      <option value="support_agent">Support Agent</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                      ENCLAVE PROTECTED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold block">Hub Assignment</span>
                    <span className="font-bold text-slate-200 text-[11px] truncate block">{adm.hubLocation}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold block">Last Active</span>
                    <span className="font-bold text-slate-200 text-[11px] truncate block">{adm.lastLogin}</span>
                  </div>
                </div>

                {/* RBAC Capabilities Matrix */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Security Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {(ROLE_PERMISSIONS[adm.role] || []).map((perm) => (
                      <span key={perm} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[9px] text-slate-300 font-medium">
                        ✓ {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. IMMUTABLE SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Immutable Firebase Audit Trail</span>
              </span>
              <span className="text-[10px] text-slate-400">All administrative operations logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admin Officer</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Collection Target</th>
                    <th className="py-3 px-4">Operation Details</th>
                    <th className="py-3 px-4">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-[11px]">{log.adminName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">/{log.targetCollection}</td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">{log.details}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Provision Staff Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Provision Staff Officer</h3>
                  <p className="text-[10px] text-slate-400">Issue RBAC role credentials</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Official Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibrahim Danjuma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ibrahim.d@flyemass.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                >
                  <option value="logistics_manager">Logistics Operations Officer</option>
                  <option value="finance_officer">Treasury & FX Officer</option>
                  <option value="support_agent">Client Concierge Specialist</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hub Location</label>
                <select
                  value={newHub}
                  onChange={(e) => setNewHub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                >
                  <option value="Guangzhou Baiyun Hub">Guangzhou Baiyun Hub</option>
                  <option value="Yiwu International Trade Port">Yiwu International Trade Port</option>
                  <option value="Shenzhen Futian Tech Center">Shenzhen Futian Tech Center</option>
                  <option value="Lagos MM2 Air Freight Hub">Lagos MM2 Air Freight Hub</option>
                  <option value="Victoria Island Clearing Center">Victoria Island Clearing Center</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
