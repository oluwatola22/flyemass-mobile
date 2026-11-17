import React, { useState, useMemo } from 'react';
import { UserDocument, Currency } from '../../types';
import { db } from '../../services/db';
import { 
  X, 
  DollarSign, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Bell,
  Wallet,
  Building,
  KeyRound,
  FileText
} from 'lucide-react';

interface AdminManualWalletAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDocument;
  adminIdentifier?: string;
  onSuccess?: (updatedBalances: Record<string, number>, reference: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminManualWalletAdjustmentModal: React.FC<AdminManualWalletAdjustmentModalProps> = ({
  isOpen,
  onClose,
  user,
  adminIdentifier = 'Central Treasury Officer',
  onSuccess,
  showToast
}) => {
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<string>('500000');
  const [adminNote, setAdminNote] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('2468');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBal = user.balances?.[currency] ?? 0;
  const numAmount = parseFloat(amount) || 0;
  
  const projectedBalance = useMemo(() => {
    if (adjustmentType === 'credit') {
      return currentBal + numAmount;
    } else {
      return Math.max(0, currentBal - numAmount);
    }
  }, [currentBal, numAmount, adjustmentType]);

  const currencySymbol = currency === 'NGN' ? '₦' : '¥';

  const quickAmounts = useMemo(() => {
    if (currency === 'NGN') {
      return [
        { label: '+₦50,000', value: '50000' },
        { label: '+₦200,000', value: '200000' },
        { label: '+₦1,000,000', value: '1000000' },
        { label: '+₦5,000,000', value: '5000000' }
      ];
    } else {
      return [
        { label: '+¥500', value: '500' },
        { label: '+¥2,000', value: '2000' },
        { label: '+¥10,000', value: '10000' },
        { label: '+¥50,000', value: '50000' }
      ];
    }
  }, [currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Enter a valid numerical amount greater than zero');
      return;
    }

    if (!adminNote || adminNote.trim().length < 5) {
      setErrorMsg('Mandatory admin note / reason is required for compliance and audit logging (minimum 5 characters)');
      return;
    }

    if (!adminPin || adminPin.trim().length < 4) {
      setErrorMsg('Security Guardrail: Mandatory Admin PIN required to authorize manual adjustment');
      return;
    }

    if (adjustmentType === 'debit' && currentBal < numAmount) {
      setErrorMsg(`Insufficient customer balance. Available: ${currencySymbol}${currentBal.toLocaleString()}, requested debit: ${currencySymbol}${numAmount.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.manualAdjustBalance(
        user.uid,
        currency,
        numAmount,
        adjustmentType,
        adminNote.trim(),
        adminIdentifier,
        adminPin.trim()
      );

      showToast(
        `Authoritative ${adjustmentType.toUpperCase()} of ${currencySymbol}${numAmount.toLocaleString()} ${currency} executed successfully! Ref: ${res.reference || 'SUCCESS'}`,
        'success'
      );

      if (onSuccess) {
        onSuccess(res.balances, res.reference);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute manual wallet adjustment');
      showToast(err.message || 'Failed to execute adjustment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      data-testid="admin-manual-wallet-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">Manual Wallet Credit & Debit Engine</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative double-entry balance adjustment with real-time mobile sync.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Target Customer Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{user.fullName}</span>
                {user.verifiedBadge && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.businessName} • {user.email}</p>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">UID: {user.uid}</span>
            </div>

            <div className="text-right font-mono text-xs space-y-0.5">
              <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Live Vaults</span>
              <p className="text-emerald-400 font-bold">₦{(user.balances?.NGN || 0).toLocaleString()}</p>
              <p className="text-indigo-400 font-semibold">¥{(user.balances?.CNY || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Currency Selector Toggle Cards */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              1. Select Target Wallet Currency
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('NGN')}
                data-testid="select-currency-ngn"
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currency === 'NGN'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🇳🇬</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">NGN (₦)</span>
                </div>
                <p className="text-xs font-bold text-white">Naira Wallet</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                  Bal: ₦{(user.balances?.NGN || 0).toLocaleString()}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCurrency('CNY')}
                data-testid="select-currency-cny"
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currency === 'CNY'
                    ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🇨🇳</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">CNY (¥)</span>
                </div>
                <p className="text-xs font-bold text-white">RMB Wallet</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                  Bal: ¥{(user.balances?.CNY || 0).toLocaleString()}
                </p>
              </button>
            </div>
          </div>

          {/* 2. Transaction Type Selector (Credit vs Debit) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              2. Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('credit')}
                data-testid="select-type-credit"
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adjustmentType === 'credit'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">+ Credit Wallet</span>
                  <span className="text-[11px] text-slate-400">Deposit, refund, or compensation</span>
                </div>
                <span className="text-base font-extrabold text-emerald-400">+</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('debit')}
                data-testid="select-type-debit"
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adjustmentType === 'debit'
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-rose-400 block">- Debit Wallet</span>
                  <span className="text-[11px] text-slate-400">Correction, clawback, or charge</span>
                </div>
                <span className="text-base font-extrabold text-rose-400">-</span>
              </button>
            </div>
          </div>

          {/* 3. Amount Input Field with Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                3. Amount to {adjustmentType === 'credit' ? 'Credit (+)' : 'Debit (-)'}
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Current: {currencySymbol}{currentBal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 transition-all">
              <span className="font-mono font-extrabold text-indigo-400 text-lg">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-adjustment-amount"
                placeholder="0.00"
                className="w-full bg-transparent font-mono font-bold text-white text-lg outline-none num-tabular"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickAmounts.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setAmount(q.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Projected Balance Preview Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Opening Vault Balance:</span>
              <span className="font-mono font-bold text-white">{currencySymbol}{currentBal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{adjustmentType === 'credit' ? 'Manual Credit Addition:' : 'Manual Debit Deduction:'}</span>
              <span className={`font-mono font-bold ${adjustmentType === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {adjustmentType === 'credit' ? '+' : '-'}{currencySymbol}{numAmount.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
              <span className="text-white">Projected Closing Balance:</span>
              <span className="font-mono text-sm text-indigo-400">{currencySymbol}{projectedBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* 4. Mandatory Admin Note / Reason */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                4. Mandatory Admin Note / Audit Reason
              </label>
              <span className="text-[10px] text-amber-400 font-bold">Required for Audit Trail</span>
            </div>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              data-testid="input-admin-note"
              placeholder="e.g. Manual deposit compensation for Providus bank transfer delay, Refund for canceled sourcing order AGT-41B260CD6C"
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none font-sans resize-none transition-colors"
              required
            />
          </div>

          {/* 5. Security Guardrail: Admin PIN Confirmation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Security Guardrail: Admin Authorization PIN</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold">
                MANDATORY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-amber-400">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="password"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  data-testid="admin-pin-input"
                  placeholder="Enter 4 or 6-digit Admin PIN (e.g. 2468)"
                  className="w-full bg-transparent font-mono font-bold text-white text-xs outline-none tracking-widest"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Confirmation of the administrator's PIN is required to authorize ledger mutations and prevent accidental adjustments.
            </p>
          </div>

          {/* Sync & Notification Assurance Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Real-time update: User's mobile wallet balance updates instantly and an in-app alert is dispatched.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="execute-wallet-adjustment-btn"
              className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
                adjustmentType === 'credit'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              )}
              <span>
                {isSubmitting 
                  ? 'Posting to Ledger...' 
                  : `Authorize & Execute ${adjustmentType.toUpperCase()} (${currencySymbol}${numAmount.toLocaleString()})`
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
