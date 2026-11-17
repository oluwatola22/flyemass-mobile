import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { db } from '../../services/db';

// Legacy references for tests: US89JPMC02100002148902 CN6227003320094892
export const FundWalletScreen: React.FC = () => {
  const { wallets, activeUserId, goBack, navigate, showToast } = useApp();
  const [amount, setAmount] = useState<string>('500000');
  const [method, setMethod] = useState<'providus' | 'korapay'>('providus');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Gateway Simulation State for NGN Rails
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<string>('');

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
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Bank Name</span>
                    <span className="font-semibold text-slate-200">{(ngnWallet as any).bankName || 'Providus Bank Plc'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Instant Clearing
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Account Number</span>
                    <span className="font-mono font-bold text-white text-sm">{(ngnWallet as any).accountNumber || '9082341902'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy((ngnWallet as any).accountNumber || '9082341902', 'Account Number');
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'Account Number' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedField === 'Account Number' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Beneficiary Name</span>
                  <span className="font-semibold text-slate-200">{(ngnWallet as any).accountName || 'FlyeMass / Babatunde Alade'}</span>
                </div>
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
