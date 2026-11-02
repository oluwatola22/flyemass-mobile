import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
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
  Smartphone
} from 'lucide-react';

export const AdminUsersScreen: React.FC = () => {
  const { showToast, viewAsClient } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'agent' | 'admin'>('all');
  
  // Selected user for deep ledger inspection and balance adjustment
  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);
  const [adjustmentCurrency, setAdjustmentCurrency] = useState<Currency>('NGN');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('1000000');
  const [adjustmentReason, setAdjustmentReason] = useState('Providus NIP offline settlement verification');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const usersList = Object.values(dbState.users).filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  const handleToggleVerification = (user: UserDocument) => {
    const newBadge = !user.verifiedBadge;
    db.updateUserVerification(user.uid, newBadge);
    firebaseSync.recordAudit('Admin', 'TOGGLE_KYC_VERIFICATION', 'users', user.uid, `Set verifiedBadge to ${newBadge}`);
    showToast(`${user.fullName} KYC verification set to: ${newBadge ? 'VERIFIED' : 'UNVERIFIED'}`, 'info');
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid numerical amount', 'error');
      return;
    }

    const currentBal = selectedUser.balances[adjustmentCurrency];
    const newBal = adjustmentType === 'credit' ? currentBal + amt : Math.max(0, currentBal - amt);

    db.updateUserBalances(selectedUser.uid, {
      [adjustmentCurrency]: newBal
    });

    db.recordLedgerEntry({
      userId: selectedUser.uid,
      type: adjustmentType === 'credit' ? 'FUND' : 'WITHDRAW',
      sourceCurrency: adjustmentCurrency,
      targetCurrency: adjustmentCurrency,
      amount: amt,
      fee: 0,
      status: 'completed',
      reference: `ADJ-ADMIN-${Date.now().toString().slice(-6)}`,
      notes: `Manual ${adjustmentType.toUpperCase()} by Admin: ${adjustmentReason}`
    });

    firebaseSync.recordAudit('Admin', 'MANUAL_BALANCE_ADJUST', 'wallets_ledger', selectedUser.uid, `${adjustmentType.toUpperCase()} ${adjustmentCurrency} ${amt} (${adjustmentReason})`);

    showToast(`Successfully updated ${selectedUser.fullName}'s ${adjustmentCurrency} vault by ${adjustmentType === 'credit' ? '+' : '-'}${amt.toLocaleString()}`, 'success');
    setSelectedUser({ ...selectedUser, balances: { ...selectedUser.balances, [adjustmentCurrency]: newBal } });
    setDbState({ ...db.getState() });
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
              Manage client KYC badges, inspect multi-currency accounts, and execute manual ledger reconciliations.
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
                  <th className="py-3 px-4">Vault Balances (NGN / CNY / USD)</th>
                  <th className="py-3 px-4">Verification</th>
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
                          {user.verifiedBadge && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
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
                        <p className="text-emerald-400 font-bold">₦{user.balances.NGN.toLocaleString()}</p>
                        <p className="text-indigo-300 font-semibold">¥{user.balances.CNY.toLocaleString()}</p>
                        <p className="text-slate-400">${user.balances.USD.toLocaleString()}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleVerification(user)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-1 ${
                          user.verifiedBadge
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400'
                        }`}
                        title="Click to toggle verification status"
                      >
                        {user.verifiedBadge ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified (Click to Revoke)</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Unverified (Click to Approve)</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`http://localhost:3030?userId=${user.uid}`, '_blank')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          title={`Open Client View for ${user.fullName} (http://localhost:3030)`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Open Client View (http://localhost:3030)</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Inspect & Adjust</span>
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
                  onClick={() => window.open(`http://localhost:3030?userId=${selectedUser.uid}`, '_blank')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 active:scale-95"
                  title="Open Client View (http://localhost:3030)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Client View (http://localhost:3030)</span>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Nigerian Naira (₦)</span>
                <p className="text-sm font-extrabold text-emerald-400 num-tabular mt-1">
                  ₦{selectedUser.balances.NGN.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Chinese Yuan (¥)</span>
                <p className="text-sm font-extrabold text-indigo-400 num-tabular mt-1">
                  ¥{selectedUser.balances.CNY.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">US Dollar ($)</span>
                <p className="text-sm font-extrabold text-white num-tabular mt-1">
                  ${selectedUser.balances.USD.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Manual Balance Credit / Debit Form */}
            <form onSubmit={handleApplyAdjustment} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Manual Vault Adjustment & Ledger Posting</span>
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
                    <option value="USD">🇺🇸 USD (Dollar)</option>
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

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
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
    </AdminLayout>
  );
};
