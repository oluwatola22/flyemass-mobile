import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { INITIAL_ADMINS, firebaseSync, AdminUser } from '../../services/firebase';
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
  FileText
} from 'lucide-react';

export const AdminTeamScreen: React.FC = () => {
  const { showToast } = useApp();
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [auditLogs] = useState(firebaseSync.getAuditLogs());
  const [activeTab, setActiveTab] = useState<'team' | 'audit'>('team');

  return (
    <AdminLayout activeTab="team">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Admin Team & Security Audit Logs</h1>
            <p className="text-xs text-slate-400">
              Manage Role-Based Access Control (RBAC) permissions and review immutable administrative logs.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'team' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Personnel Directory ({admins.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Security Audit Trail ({auditLogs.length})
            </button>
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
                <div className="flex items-center gap-3.5">
                  <img
                    src={adm.avatar}
                    alt={adm.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{adm.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-semibold">{adm.roleTitle}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{adm.email}</p>
                  </div>
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

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="font-mono">Role: {adm.role.toUpperCase()}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Hardware Enclave Key Verified
                  </span>
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
    </AdminLayout>
  );
};
