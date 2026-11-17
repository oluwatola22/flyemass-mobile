import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getMobileAppUrl } from '../../utils/environment';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminManualWalletAdjustmentModal } from '../../components/admin/AdminManualWalletAdjustmentModal';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { UserDocument, Currency } from '../../types';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Filter, 
  ExternalLink, 
  Plus, 
  Minus, 
  CheckCircle2, 
  X, 
  Copy, 
  CheckCheck, 
  Clock, 
  DollarSign,
  Building,
  Eye,
  FileText,
  Smartphone,
  AlertOctagon,
  Ban,
  Bell,
  Truck,
  Package,
  Lock,
  KeyRound,
  RotateCcw
} from 'lucide-react';

export const AdminUsersScreen: React.FC = () => {
  const { showToast, viewAsClient } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'agent' | 'admin'>('all');
  
  // Selected user for deep ledger inspection and balance adjustment
  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);
  const [walletModalUser, setWalletModalUser] = useState<UserDocument | null>(null);
  const [adjustmentCurrency, setAdjustmentCurrency] = useState<Currency>('NGN');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('1000000');
  const [adjustmentReason, setAdjustmentReason] = useState('Providus NIP offline settlement verification');
  const [adminPinInput, setAdminPinInput] = useState('2468');
  const [adminNotesInput, setAdminNotesInput] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
  }, []);

  const dbState = db.getState();

  // URL Deep Link Listener for /admin/users/[id]/wallet-credit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Matches /admin/users/[id]/wallet-credit or ?userId=...&action=wallet-credit
    const walletCreditMatch = path.match(/\/admin\/users\/([^\/]+)\/wallet-credit/) || hash.match(/#\/admin\/users\/([^\/]+)\/wallet-credit/);
    const targetUid = walletCreditMatch?.[1] || (urlParams.get('action') === 'wallet-credit' ? urlParams.get('userId') : null) || urlParams.get('creditUserId');

    if (targetUid && dbState.users[targetUid]) {
      setWalletModalUser(dbState.users[targetUid]);
    }
  }, [dbState.users]);

  const handleOpenWalletModal = (user: UserDocument) => {
    setWalletModalUser(user);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('userId', user.uid);
      url.searchParams.set('action', 'wallet-credit');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCloseWalletModal = () => {
    setWalletModalUser(null);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (selectedUser) {
      setAdminNotesInput(selectedUser.adminNotes || '');
    }
  }, [selectedUser]);

  const usersList = Object.values(dbState.users).filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  const handleSaveAdminNotes = async () => {
    if (!selectedUser) return;
    try {
      await db.updateUserAdminNotes(selectedUser.uid, adminNotesInput, 'adm-001');
      showToast(`Compliance audit notes saved for ${selectedUser.fullName}!`, 'success');
      setSelectedUser({ ...selectedUser, adminNotes: adminNotesInput });
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to save notes', 'error');
    }
  };

  const handleToggleSuspension = async (user: UserDocument) => {
    const nextState = !user.isSuspended;
    try {
      await db.suspendUser(
        user.uid,
        nextState,
        nextState ? 'Compliance review / Trade restriction' : 'Resolved',
        [],
        'adm-001'
      );
      showToast(`${user.fullName} account suspension set to: ${nextState ? 'SUSPENDED' : 'ACTIVE'}`, nextState ? 'error' : 'success');
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, isSuspended: nextState });
      }
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle suspension', 'error');
    }
  };

  const handleSendNotification = async (userId: string) => {
    const text = window.prompt(`Send real-time in-app notification alert to ${selectedUser?.fullName || 'user'}:`);
    if (!text || !text.trim()) return;
    try {
      await db.sendAdminNotification(
        'FlyeMass Executive Notice',
        text.trim(),
        'system',
        userId,
        'notifications',
        'adm-001'
      );
      showToast(`Notification dispatched to ${selectedUser?.fullName || userId}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send notification', 'error');
    }
  };

  const handleUnlockPin = async (user: UserDocument) => {
    try {
      await db.unlockUserPin(user.uid, 'adm-001');
      showToast(`PIN lockout cleared & attempt counters reset for ${user.fullName}!`, 'success');
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, pinFailedAttempts: 0, pinLockedUntil: 0 });
      }
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to clear PIN lockout', 'error');
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid numerical amount', 'error');
      return;
    }

    if (!adjustmentReason || adjustmentReason.trim().length < 5) {
      showToast('Mandatory admin note/reason is required (minimum 5 characters)', 'error');
      return;
    }

    if (!adminPinInput || adminPinInput.trim().length < 4) {
      showToast('Security Guardrail: Mandatory Admin PIN required', 'error');
      return;
    }

    try {
      const res = await db.manualAdjustBalance(
        selectedUser.uid,
        adjustmentCurrency,
        amt,
        adjustmentType,
        adjustmentReason.trim(),
        'Central Treasury Officer',
        adminPinInput.trim()
      );
      showToast(`Successfully executed authoritative ${adjustmentType.toUpperCase()} of ${adjustmentCurrency} ${amt.toLocaleString()}!`, 'success');
      setSelectedUser({ ...selectedUser, balances: res.balances });
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to execute adjustment', 'error');
    }
  };

  const userLedgerHistory = selectedUser 
    ? Object.values(dbState.wallets_ledger).filter((l) => l.userId === selectedUser.uid)
    : [];

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Enterprise User Directory</h1>
            <p className="text-xs text-slate-400">
              Manage client accounts, inspect multi-currency vaults, and execute manual ledger reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Total Accounts: <strong className="text-white">{usersList.length}</strong>
            </span>
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
              placeholder="Search by full name, company, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {(['all', 'client', 'agent', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  roleFilter === r
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">User / Enterprise</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Vault Balances (NGN / CNY)</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">{user.businessName}</p>
                        <span className="text-[9px] font-mono text-slate-500">ID: {user.uid}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-300 font-mono text-[11px]">{user.email}</p>
                      <p className="text-slate-400 text-[10px]">{user.phone}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        user.role === 'agent' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] space-y-0.5">
                        <p className="text-emerald-400 font-bold">₦{(user?.balances?.NGN ?? 0).toLocaleString()}</p>
                        <p className="text-indigo-300 font-semibold">¥{(user?.balances?.CNY ?? 0).toLocaleString()}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                        user.isSuspended
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {user.isSuspended ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Suspended</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenWalletModal(user)}
                          data-testid={`wallet-adjust-btn-${user.uid}`}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                          title={`Manual Credit or Debit for ${user.fullName}`}
                        >
                          <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Credit / Debit</span>
                        </button>
                        <button
                          onClick={() => window.open(getMobileAppUrl(`?userId=${user.uid}`), '_blank')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          title={`Open Client View for ${user.fullName} (${getMobileAppUrl()})`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Client View</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Inspect & Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deep Inspection & Balance Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{selectedUser.fullName}</span>
                  {selectedUser.verifiedBadge && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </h3>
                <p className="text-xs text-slate-400">{selectedUser.businessName} • {selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(getMobileAppUrl(`?userId=${selectedUser.uid}`), '_blank')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 active:scale-95"
                  title={`Open Client View (${getMobileAppUrl()})`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Client View</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Balances Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Nigerian Naira (₦)</span>
                <p className="text-sm font-extrabold text-emerald-400 num-tabular mt-1">
                  ₦{(selectedUser?.balances?.NGN ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Chinese Yuan (¥)</span>
                <p className="text-sm font-extrabold text-indigo-400 num-tabular mt-1">
                  ¥{(selectedUser?.balances?.CNY ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Account Status & Administrative Quick Actions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    selectedUser.isSuspended
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {selectedUser.isSuspended ? 'Account Suspended' : 'Account Active & Compliant'}
                  </span>
                  {selectedUser.suspensionReason && (
                    <span className="text-[11px] text-rose-400 font-mono">({selectedUser.suspensionReason})</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendNotification(selectedUser.uid)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-white font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send In-App Alert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSuspension(selectedUser)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                      selectedUser.isSuspended
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                    }`}
                  >
                    {selectedUser.isSuspended ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reactivate Account</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspend Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Connected Services Footprint */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Shipments</span>
                  <span className="font-bold text-cyan-400">
                    {Object.values(dbState.shipments).filter(s => s.userId === selectedUser.uid).length}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Shop Orders</span>
                  <span className="font-bold text-amber-400">
                    {Object.values(dbState.shop_orders).filter(o => o.userId === selectedUser.uid).length}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Sourcing RFQs</span>
                  <span className="font-bold text-indigo-400">
                    {Object.values(dbState.agent_requests).filter(r => r.userId === selectedUser.uid).length}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Hotel Stays</span>
                  <span className="font-bold text-emerald-400">
                    {Object.values(dbState.hotel_bookings || {}).filter((b: any) => b.userId === selectedUser.uid).length}
                  </span>
                </div>
              </div>

              {/* Internal Compliance Notes */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Administrative Compliance Notes</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveAdminNotes}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Record customer account notes, communication logs, or trade assessments..."
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>

              {/* 6-Digit PIN & Cryptographic Enclave Panel */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>6-Digit Security PIN & Cryptographic Enclave</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                    HMAC-SHA256 ENCRYPTED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Lockout State</span>
                    <span className={`font-bold ${
                      (selectedUser.pinLockedUntil && selectedUser.pinLockedUntil > Date.now())
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}>
                      {(selectedUser.pinLockedUntil && selectedUser.pinLockedUntil > Date.now()) ? 'LOCKED (15m)' : 'UNLOCKED / ACTIVE'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Failed Attempts</span>
                    <span className="font-mono font-bold text-white">
                      {selectedUser.pinFailedAttempts || 0} / 5
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-slate-500">
                    Mandatory authorization key for supplier disbursements, FX swaps, and tech shop checkouts.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleUnlockPin(selectedUser)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Lockout / Reset Tries</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Open Dedicated Enterprise Adjustment Modal Button */}
            <button
              type="button"
              onClick={() => handleOpenWalletModal(selectedUser)}
              data-testid="open-wallet-adjustment-modal-btn"
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-98"
            >
              <DollarSign className="w-4 h-4 text-indigo-400" />
              <span>Launch Enterprise Manual Wallet Credit & Debit Engine</span>
            </button>

            {/* Manual Balance Credit / Debit Form */}
            <form onSubmit={handleApplyAdjustment} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Quick Vault Adjustment & Ledger Posting</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Action Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  >
                    <option value="credit">+ Manual Credit (Top-up)</option>
                    <option value="debit">- Manual Debit (Deduction)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Target Currency</label>
                  <select
                    value={adjustmentCurrency}
                    onChange={(e) => setAdjustmentCurrency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  >
                    <option value="NGN">🇳🇬 NGN (Naira)</option>
                    <option value="CNY">🇨🇳 CNY (RMB)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Amount</label>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none num-tabular font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Audit Reason / Bank Reference</label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g. Providus NIP receipt verification, customs settlement"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-amber-400 block mb-1">Security PIN Guardrail</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="Admin PIN (e.g. 2468)"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-white outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              >
                Execute {adjustmentType.toUpperCase()} & Post to Immutable Ledger
              </button>
            </form>

            {/* Audit History for this user */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                User Ledger Transactions ({userLedgerHistory.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {userLedgerHistory.map((ldg) => (
                  <div key={ldg.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white text-[11px]">{ldg.type} • {ldg.notes}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Ref: {ldg.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400 num-tabular">
                        {ldg.sourceCurrency} {ldg.amount.toLocaleString()}
                      </p>
                      <span className="text-[9px] uppercase font-bold text-slate-400">{ldg.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Manual Wallet Adjustment Dedicated Modal */}
      {walletModalUser && (
        <AdminManualWalletAdjustmentModal
          isOpen={!!walletModalUser}
          onClose={handleCloseWalletModal}
          user={walletModalUser}
          adminIdentifier="Central Treasury Officer"
          onSuccess={(newBalances, ref) => {
            if (selectedUser && selectedUser.uid === walletModalUser.uid) {
              setSelectedUser({ ...selectedUser, balances: newBalances as any });
            }
            setDbRev(db.getStateRevision());
          }}
          showToast={showToast}
        />
      )}
    </AdminLayout>
  );
};
