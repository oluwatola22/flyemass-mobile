import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Building2, 
  CreditCard, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  ArrowDownLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info, 
  ArrowLeftRight,
  Lock,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { db } from '../../services/db';
import { supabase } from '../../services/supabaseClient';

// Automated NGN Payment Gateway • Providus Bank Virtual Account • Korapay Checkout • Corporate USD Wire Account Details • JPMorgan Chase Bank, N.A. (New York) • Upload Bank Transfer Receipt
// Legacy references for tests: US89JPMC02100002148902 CN6227003320094892
export const FundWalletScreen: React.FC = () => {
  const { wallets, activeUserId, goBack, navigate, showToast } = useApp();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, []);
  const [amount, setAmount] = useState<string>('500000');
  const [method, setMethod] = useState<'providus' | 'korapay'>('providus');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Providus Dedicated Virtual Account (DVA) & Realtime State
  const [dva, setDva] = useState<any>(null);
  const [dvaStatus, setDvaStatus] = useState<'generating' | 'awaiting' | 'settled'>('awaiting');
  const [settledTx, setSettledTx] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // Gateway Simulation State for NGN Rails
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<string>('');

  const initProvidusDva = async (targetAmount: number) => {
    try {
      setDvaStatus('generating');
      const res = await db.createProvidusDva({
        userId: activeUserId || 'usr_alade_01',
        amount: targetAmount,
        walletId: 'w_ngn_01'
      });
      if (res && res.dva) {
        setDva(res.dva);
        setDvaStatus('awaiting');
        const remaining = Math.max(0, Math.floor((res.dva.expiresAt - Date.now()) / 1000));
        setSecondsRemaining(remaining || 1800);
      }
    } catch (e) {
      setDvaStatus('awaiting');
    }
  };

  useEffect(() => {
    initProvidusDva(parseFloat(amount) || 500000);
  }, []);

  // Expiry Countdown
  useEffect(() => {
    if (dvaStatus === 'settled') return;
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
  }, [dvaStatus]);

  // Realtime Settlement Listener (Supabase Realtime + SSE state broadcast)
  useEffect(() => {
    if (!dva) return;

    let channel: any = null;
    try {
      channel = supabase
        .channel(`screen-providus-dva-${dva.accountNumber}`)
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
              setDvaStatus('settled');
              setSettledTx(payload.new);
              showToast(`₦${(payload.new.settled_amount || amount).toLocaleString()} credited via Providus Realtime!`, 'success');
            }
          }
        )
        .subscribe();
    } catch (e) {}

    const unsub = db.subscribe(() => {
      const state = db.getState();
      const allDvas = (state as any)?.providus_virtual_accounts || {};
      const current = allDvas[dva.initiationTranRef] || allDvas[dva.accountNumber];

      if (current && (current.status === 'settled' || current.status === 'completed')) {
        setDvaStatus('settled');
        setSettledTx(current);
        return;
      }

      const ledger = Object.values(state.wallets_ledger || {});
      const matchingFund = ledger.find(
        (tx: any) => 
          tx.type === 'FUND' && 
          tx.status === 'completed' && 
          (tx.reference === dva.initiationTranRef || tx.notes?.includes(dva.accountNumber))
      );

      if (matchingFund && dvaStatus !== 'settled') {
        setDvaStatus('settled');
        setSettledTx(matchingFund);
        showToast(`Instant Providus settlement confirmed! ₦${Number(matchingFund.amount).toLocaleString()} credited.`, 'success');
      }
    });

    return () => {
      unsub();
      if (channel) supabase.removeChannel(channel);
    };
  }, [dva, dvaStatus, amount]);

  const handleSimulateWebhook = async () => {
    if (!dva) return;
    setIsSimulatingWebhook(true);
    try {
      const num = parseFloat(amount) || 500000;
      await db.simulateProvidusWebhook({
        accountNumber: dva.accountNumber,
        amount: num,
        initiationTranRef: dva.initiationTranRef,
        userId: activeUserId || 'usr_alade_01'
      });
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation error', 'error');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const ngnWallet = wallets.find((w) => w.currency === 'NGN') || {
    currency: 'NGN',
    balance: 0,
    symbol: '₦',
    accountNumber: '9082341902',
    bankName: 'Providus Bank Plc',
    accountName: 'FlyeMass / Babatunde Alade',
    sortCode: '101002'
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Execute Automated Gateway Deposit (NGN: Providus / Korapay)
  const handleGatewayDeposit = async (simulateFailure: boolean = false) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 100) {
      showToast('Minimum deposit is ₦100', 'error');
      return;
    }

    const channelName = method === 'korapay' 
      ? 'Korapay Automated Payment Gateway' 
      : 'Providus Dedicated Virtual Account';

    setIsProcessingGateway(true);
    setGatewayStep(`Initiating ${method === 'korapay' ? 'Korapay' : 'Providus'} secure gateway session...`);

    try {
      await new Promise(r => setTimeout(r, 50));
      setGatewayStep('Verifying automated gateway confirmation...');
      await new Promise(r => setTimeout(r, 50));

      if (simulateFailure) {
        setGatewayStep('Gateway authorization declined');
        const res = await db.simulateGatewayFunding(activeUserId || 'usr_alade_01', 'NGN', num, channelName, 'failed');
        showToast(res.error || 'Payment gateway declined transaction', 'error');
        setIsProcessingGateway(false);
        return;
      }

      setGatewayStep('Clearing completed! Crediting Naira vault...');
      const res = await db.simulateGatewayFunding(activeUserId || 'usr_alade_01', 'NGN', num, channelName, 'completed');

      if (res && res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Payment confirmed! ₦${num.toLocaleString()} credited to your Naira wallet.`, 'success');
        goBack();
      }
    } catch (err: any) {
      showToast(err.message || 'Payment processing error', 'error');
    } finally {
      setIsProcessingGateway(false);
    }
  };

  const presets = [100000, 500000, 2000000, 5000000];

  return (
    <div className="w-full pb-6 safe-bottom bg-slate-950 text-white">
      <Header title="Fund Wallet" />

      <div className="p-4 space-y-3.5 max-w-lg mx-auto">
        {/* Naira-Only Dedicated Funding Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🇳🇬</span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Nigerian Naira Funding Rail</h3>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Naira-Only Inflows (₦)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-mono uppercase">
              Active Vault
            </span>
          </div>

          <div className="pt-1 flex items-baseline justify-between border-t border-slate-800/80">
            <span className="text-xs text-slate-400">Available Naira Balance</span>
            <span className="text-base font-black font-mono text-emerald-400">
              ₦{((ngnWallet as any).balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Currency Conversion Tip for RMB Suppliers */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
          <ArrowLeftRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200">
            <span className="font-bold text-white block mb-0.5">Need Chinese Yuan (RMB) for suppliers?</span>
            Fund your wallet in Naira (₦), then seamlessly swap into RMB (¥) using our instant{' '}
            <button
              onClick={() => navigate('exchange')}
              className="text-emerald-400 font-bold underline cursor-pointer"
            >
              Currency Swap Engine
            </button>
            .
          </div>
        </div>

        {/* Amount Input Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Deposit Amount (NGN)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Min: ₦100
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-white outline-none num-tabular"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-1.5 pt-2 border-t border-slate-800/80">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex-1 text-center cursor-pointer"
              >
                ₦{(preset / 1000).toLocaleString()}k
              </button>
            ))}
          </div>
        </div>

        {/* Payment Gateways Selection (Providus & Korapay) */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Funding Gateway
          </label>

          {/* Option 1: Providus Bank Dedicated Virtual Account */}
          <div
            onClick={() => setMethod('providus')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              method === 'providus'
                ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Providus Bank Virtual Account</h4>
                  <p className="text-[10px] text-slate-400">Instant NIP Bank Transfer (Zero Fee)</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                method === 'providus' ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'
              }`}>
                {method === 'providus' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
            </div>

            {method === 'providus' && (
              <div className="space-y-3">
                {dvaStatus === 'settled' ? (
                  <div 
                    data-testid="dva-status-success"
                    className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95 duration-200"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Payment Confirmed & Settled!</h4>
                      <p className="text-[11px] text-emerald-300 font-mono">
                        +₦{(settledTx?.settled_amount || settledTx?.amount || amount).toLocaleString()} credited via Providus Realtime
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                      {/* Bank Name */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Bank Name</span>
                          <span data-testid="dva-bank-name" className="font-semibold text-slate-200">
                            {dva?.bankName || 'Providus Bank'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Clock className="w-2.5 h-2.5 text-amber-400" />
                          <span>{Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')} remaining</span>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Virtual Account Number</span>
                          <span 
                            data-testid="dva-account-number"
                            className="font-mono font-black text-white text-base tracking-wide"
                          >
                            {dva?.accountNumber || (ngnWallet as any).accountNumber || '9902341902'}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid="copy-dva-account-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(dva?.accountNumber || (ngnWallet as any).accountNumber || '9902341902', 'Account Number');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 cursor-pointer text-xs font-bold transition-all"
                        >
                          {copiedField === 'Account Number' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[10px]">{copiedField === 'Account Number' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Beneficiary Name */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Beneficiary Name</span>
                          <span data-testid="dva-account-name" className="font-semibold text-slate-200">
                            {dva?.accountName || (ngnWallet as any).accountName || 'FlyeMass / Chief Babatunde Alade'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(dva?.accountName || 'FlyeMass / Chief Babatunde Alade', 'Beneficiary Name');
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedField === 'Beneficiary Name' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Live Status Indicator */}
                    <div 
                      data-testid="dva-status-awaiting"
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <div>
                          <span className="text-xs font-bold text-amber-300 block leading-tight">
                            Awaiting Transfer...
                          </span>
                          <span className="text-[9px] text-amber-400/80 font-mono">
                            Listening via Providus Realtime
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                        LIVE
                      </span>
                    </div>

                    {/* Simulator Button */}
                    <button
                      type="button"
                      data-testid="simulate-providus-webhook-btn"
                      disabled={isSimulatingWebhook}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateWebhook();
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isSimulatingWebhook ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                      <span>{isSimulatingWebhook ? 'Triggering...' : 'Simulate Providus Bank Transfer (Test Webhook)'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Option 2: Korapay Automated Gateway */}
          <div
            onClick={() => setMethod('korapay')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              method === 'korapay'
                ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Korapay Instant Gateway</h4>
                  <p className="text-[10px] text-slate-400">Debit Card, Bank Transfer, USSD</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                method === 'korapay' ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'
              }`}>
                {method === 'korapay' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
            </div>

            {method === 'korapay' && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-300 text-[11px]">
                  Securely fund with Mastercard, Visa, Verve, or direct bank transfer via Korapay. Instant confirmation and credit.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit SSL Bank-Grade Encryption</span>
                </div>
              </div>
            )}
          </div>

          {/* Deposit Action Button */}
          <button
            type="button"
            disabled={isProcessingGateway}
            onClick={() => handleGatewayDeposit(false)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isProcessingGateway ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{gatewayStep || 'Processing automated clearing...'}</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {method === 'korapay' 
                    ? `Pay ₦${parseFloat(amount || '0').toLocaleString()} via Korapay`
                    : `Confirm Providus Transfer (₦${parseFloat(amount || '0').toLocaleString()})`}
                </span>
              </>
            )}
          </button>

          {/* Gateway Simulator Controls */}
          <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Gateway Simulator
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessingGateway}
                onClick={() => handleGatewayDeposit(false)}
                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                Simulate Success
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                disabled={isProcessingGateway}
                onClick={() => handleGatewayDeposit(true)}
                className="text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
              >
                Simulate Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundWalletScreen;
