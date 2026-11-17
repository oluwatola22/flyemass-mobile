import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, Lock, UserX, AlertTriangle, ExternalLink } from 'lucide-react';

interface AdminAccessDeniedScreenProps {
  reason: 'permission' | 'suspended';
  staffName?: string;
  missingPermission?: string;
  requestedRoute?: string;
}

const PERMISSION_LABEL_MAP: Record<string, string> = {
  shipments: 'Shipments & Cargo Pipeline (/admin/shipments)',
  agents: 'Agent Sourcing & Procurement (/admin/agent-requests)',
  support: 'Support Tickets & Duty Desk (/admin/support/tickets)',
  lagos_hubs: 'Lagos Hubs & Last-Mile Offices (/admin/lagos-hubs)',
  shipping_rates: 'Air Shipping & FX Rates (/admin/settings/shipping)',
  users: 'User Directory & Wallets (/admin/users)',
  treasury: 'Treasury, Payouts & General Ledger (/admin/payments)',
  commerce: 'Hubs, Real Estate & Inventory (/admin/warehouses, /admin/shop)',
  super_admin: 'Super Administrator Root Privilege (/admin/db, /admin/governance/rbac)'
};

export const AdminAccessDeniedScreen: React.FC<AdminAccessDeniedScreenProps> = ({
  reason,
  staffName = 'Staff Officer',
  missingPermission = 'treasury',
  requestedRoute = '/admin/payments'
}) => {
  const { navigate, adminUser, logoutAdmin } = useApp();

  const isSuspended = reason === 'suspended' || adminUser?.status === 'suspended';
  const permissionFriendlyName = PERMISSION_LABEL_MAP[missingPermission] || missingPermission;

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Security Badge Icon */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/10">
          {isSuspended ? (
            <UserX className="w-8 h-8 text-rose-400" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          )}
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold tracking-wider uppercase inline-block">
            {isSuspended ? 'Account Privileges Revoked' : 'RBAC Policy Enforcement'}
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isSuspended ? 'Staff Account Suspended' : 'Access Restricted by Admin'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            {isSuspended ? (
              <>
                Administrative access for <strong className="text-slate-200">{staffName}</strong> has been suspended by the Super Administrator. All operational modules and API capabilities are currently blocked.
              </>
            ) : (
              <>
                Your staff profile does not have permission to access the <strong className="text-rose-400">{permissionFriendlyName}</strong> module.
              </>
            )}
          </p>
        </div>

        {/* Security Diagnostics Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Target Resource:</span>
            <span className="text-slate-200 font-bold truncate max-w-[240px]">{requestedRoute}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Logged Officer:</span>
            <span className="text-slate-200 font-bold">{adminUser?.name || staffName} ({adminUser?.roleTitle || 'Staff'})</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Missing RBAC Scope:</span>
            <span className="text-rose-400 font-bold">{missingPermission}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
            <span className="text-slate-400">Security Audit Ref:</span>
            <span className="text-emerald-400 text-[10px]">SEC-BLOCK-{Date.now().toString().slice(-6)} (Recorded)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isSuspended ? (
            <button
              type="button"
              onClick={logoutAdmin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign Out to Staff Login</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('admin-dashboard')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Authorized Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('admin-support')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Request Permission Access</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
