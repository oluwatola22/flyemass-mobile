import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { supabase } from '../../services/supabaseClient';
import { 
  X, 
  Building2, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Zap,
  Radio,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export interface FundWalletModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose 
}) => {
  const { 
    isFundModalOpen: contextIsOpen, 
    closeFundModal: contextOnClose, 
    activeUserId, 
    userProfile, 
    wallets, 
    showToast 
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const onClose = propOnClose || contextOnClose;

  const [amount, setAmount] = useState<string>('500000');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Providus Dedicated Virtual Account (DVA) State
  const [dva, setDva] = useState<any>(null);
  const [status, setStatus] = useState<'generating' | 'awaiting' | 'settled'>('awaiting');
  const [settledTx, setSettledTx] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 mins

  const ngnWallet = useMemo(() => {
    return wallets.find(w => w.currency === 'NGN') || {
      currency: 'NGN',
      balance: 0,
      accountNumber: '9082341902',
      bankName: 'Providus Bank',
      accountName: 'FlyeMass / Babatunde Alade'
    };
  }, [wallets]);

  // Generate or Retrieve Active Providus DVA
  const initDva = async (targetAmount: number) => {
    setIsGenerating(true);
    setStatus('generating');
    try {
      const res = await db.createProvidusDva({
        userId: activeUserId || 'usr_alade_01',
        amount: targetAmount,
        accountName: userProfile?.name || 'Chief Babatunde Alade',
        walletId: 'w_ngn_01'
      });

      if (res && res.dva) {
        setDva(res.dva);
        setStatus('awaiting');
        const remaining = Math.max(0, Math.floor((res.dva.expiresAt - Date.now()) / 1000));
        setSecondsRemaining(remaining || 1800);
      } else {
        setStatus('awaiting');
      }
    } catch (err: any) {
      console.warn('Providus DVA init fallback:', err);
      setStatus('awaiting');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate on open
  useEffect(() => {
    if (isOpen) {
      setSettledTx(null);
      initDva(parseFloat(amount) || 500000);
    }
  }, [isOpen]);

  // Expiry Countdown Timer
  useEffect(() => {
    if (!isOpen || status === 'settled') return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, status]);

  // Realtime Settlement Listener: Supabase Realtime + local db subscription
  useEffect(() => {
    if (!isOpen || !dva) return;

    // 1. Supabase Realtime Channel Subscription
    let channel: any = null;
    try {
      channel = supabase.channel(`providus-dva-${dva.accountNumber}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'providus_virtual_accounts',
            filter: `account_number=eq.${dva.accountNumber}`
          },
          (payload: any) => {
            if (payload?.new && (payload.new.status === 'settled' || payload.new.status === 'completed')) {
              setStatus('settled');
              setSettledTx(payload.new);
              showToast(`₦${(payload.new.settled_amount || amount).toLocaleString()} credited via Providus NIP!`, 'success');
            }
          }
        )
        .subscribe();
    } catch (e) {}

    // 2. Authoritative SSE Database State Subscription
    const unsub = db.subscribe(() => {
      const state = db.getState();
      const allDvas = (state as any)?.providus_virtual_accounts || {};
      const current = allDvas[dva.initiationTranRef] || allDvas[dva.accountNumber];

      // Check if current DVA settled
      if (current && (current.status === 'settled' || current.status === 'completed')) {
        setStatus('settled');
        setSettledTx(current);
        return;
      }

      // Also check wallets ledger for completed FUND transactions matching this DVA
      const ledger = Object.values(state.wallets_ledger || {});
      const matchingFund = ledger.find(
        (tx: any) => 
          tx.type === 'FUND' && 
          tx.status === 'completed' && 
          (tx.reference === dva.initiationTranRef || tx.notes?.includes(dva.accountNumber))
      );

      if (matchingFund && status !== 'settled') {
        setStatus('settled');
        setSettledTx(matchingFund);
        showToast(`Instant Providus settlement confirmed! ₦${Number(matchingFund.amount).toLocaleString()} credited.`, 'success');
      }
    });

    return () => {
      unsub();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, dva, status, amount]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Simulate Providus Webhook Payment (Sandbox / Demo Test)
  const handleSimulateWebhook = async () => {
    if (!dva) return;
    setIsSimulating(true);
    try {
      const num = parseFloat(amount) || 500000;
      await db.simulateProvidusWebhook({
        accountNumber: dva.accountNumber,
        amount: num,
        initiationTranRef: dva.initiationTranRef,
        userId: activeUserId || 'usr_alade_01'
      });
      // The realtime subscription above will catch the settlement and update the UI
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation error', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const presets = [50000, 100000, 500000, 2000000, 5000000];

  return (
    <div 
      data-testid="fund-wallet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        data-testid="fund-wallet-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Fund Naira Wallet</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                  🇳🇬 NGN
                </span>
              </h2>
              <p className="text-xs text-slate-400">Providus Bank Dedicated Virtual Account (DVA)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* ======================================================== */}
          {/* SUCCESS STATE: FUNDS SETTLED                             */}
          {/* ======================================================== */}
          {status === 'settled' ? (
            <div 
              data-testid="dva-status-success"
              className="py-6 px-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95 duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Payment Confirmed & Settled!</h3>
                <p className="text-xs text-emerald-300 font-mono">
                  Funds received via Providus Bank NIP Fast-Settlement
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-left text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Credited Amount:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    +₦{(settledTx?.settled_amount || settledTx?.amount || amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Channel / Rail:</span>
                  <span className="text-white">Providus NIP Clearing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[180px]">
                    {settledTx?.settlement_id || settledTx?.reference || dva?.initiationTranRef}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400 font-sans">New NGN Balance:</span>
                  <span className="text-white font-bold text-sm">
                    ₦{((ngnWallet as any).balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              >
                Return to Wallets Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* DEPOSIT AMOUNT SELECTOR                                 */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Deposit Amount
                  </label>
                  <span className="text-emerald-400 font-mono font-bold text-[10px]">Zero Processing Fee</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                    }}
                    placeholder="500,000"
                    className="w-full bg-transparent text-xl font-black text-white font-mono outline-none num-tabular"
                  />
                </div>

                {/* Amount Quick Presets */}
                <div className="flex gap-1.5 pt-1.5 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset.toString());
                        initDva(preset);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all shrink-0 cursor-pointer ${
                        Number(amount) === preset
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      ₦{(preset / 1000).toLocaleString()}k
                    </button>
                  ))}
                </div>
              </div>

              {/* ======================================================== */}
              {/* DEDICATED VIRTUAL ACCOUNT CARD (PROVIDUS BANK)           */}
              {/* ======================================================== */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      Dynamic Virtual Account (DVA)
                    </span>
                  </div>

                  {/* Time Remaining Timer */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{timeFormatted} remaining</span>
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  {/* 1. Account Number with 1-Tap Copy */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Virtual Account Number
                      </span>
                      <span 
                        data-testid="dva-account-number"
                        className="text-xl font-black font-mono text-white tracking-wider block"
                      >
                        {dva?.accountNumber || (ngnWallet as any).accountNumber || '9902341902'}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-testid="copy-dva-account-btn"
                      onClick={() => handleCopy(dva?.accountNumber || (ngnWallet as any).accountNumber || '9902341902', 'Account Number')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedField === 'Account Number' ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 2. Bank Name with 1-Tap Copy */}
                  <div className="flex items-center justify-between border-t border-slate-800/70 pt-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Bank Name
                      </span>
                      <span 
                        data-testid="dva-bank-name"
                        className="text-xs font-extrabold text-slate-200 block"
                      >
                        {dva?.bankName || 'Providus Bank'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(dva?.bankName || 'Providus Bank', 'Bank Name')}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Bank Name"
                    >
                      {copiedField === 'Bank Name' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* 3. Beneficiary Account Name with 1-Tap Copy */}
                  <div className="flex items-center justify-between border-t border-slate-800/70 pt-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Beneficiary / Account Name
                      </span>
                      <span 
                        data-testid="dva-account-name"
                        className="text-xs font-extrabold text-slate-200 block truncate max-w-[220px]"
                      >
                        {dva?.accountName || `FlyeMass / ${userProfile?.name || 'Chief Babatunde Alade'}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(dva?.accountName || `FlyeMass / ${userProfile?.name || 'Chief Babatunde Alade'}`, 'Account Name')}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Beneficiary Name"
                    >
                      {copiedField === 'Account Name' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* LIVE STATUS INDICATOR: AWAITING TRANSFER                 */}
                {/* ======================================================== */}
                <div 
                  data-testid="dva-status-awaiting"
                  className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        Awaiting Transfer...
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Listening via Providus Realtime Webhook
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                    LIVE
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open any Nigerian banking app (GTBank, Zenith, Access, Kuda, PalmPay, etc.) and transfer ₦{(parseFloat(amount) || 500000).toLocaleString()} to the Providus account number above. Your Naira vault will be credited automatically.
                </p>
              </div>

              {/* ======================================================== */}
              {/* TEST SIMULATOR / WEBHOOK TRIGGER BUTTON                  */}
              {/* ======================================================== */}
              <div className="pt-1">
                <button
                  type="button"
                  data-testid="simulate-providus-webhook-btn"
                  disabled={isSimulating}
                  onClick={handleSimulateWebhook}
                  className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSimulating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    {isSimulating ? 'Sending Providus Webhook...' : 'Simulate Providus Bank Transfer (Test Webhook)'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundWalletModal;
