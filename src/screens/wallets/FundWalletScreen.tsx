import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Building2, 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  ArrowDownLeft, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Currency } from '../../types';

export const FundWalletScreen: React.FC = () => {
  const { wallets, fundWallet, goBack } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('NGN');
  const [amount, setAmount] = useState<string>('5000000');
  const [method, setMethod] = useState<'virtual' | 'card' | 'qr'>('virtual');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const wallet = wallets.find((w) => w.currency === selectedCurrency) || wallets[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInstantDeposit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    fundWallet(selectedCurrency, num, method === 'virtual' ? 'Providus Virtual Direct NIP' : 'China UnionPay Clearing');
    goBack();
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Fund Wallet" />

      <div className="p-4 space-y-4">
        {/* Currency Switcher */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Select Destination Wallet
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['NGN', 'CNY', 'USD'] as Currency[]).map((c) => {
              const isSelected = selectedCurrency === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCurrency(c)}
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xl">{c === 'NGN' ? '🇳🇬' : c === 'CNY' ? '🇨🇳' : '🇺🇸'}</span>
                  <span>{c} Account</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Deposit Amount ({selectedCurrency})
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{wallet.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-extrabold text-white outline-none num-tabular"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[1000000, 5000000, 10000000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 text-[10px] font-semibold text-slate-300 hover:text-white"
              >
                +{selectedCurrency === 'NGN' ? `₦${(preset / 1000000).toFixed(0)}M` : `¥${preset.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Methods */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Payment Channel
          </label>
          <div className="space-y-2.5">
            {selectedCurrency === 'NGN' && (
              <div
                onClick={() => setMethod('virtual')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  method === 'virtual' ? 'bg-slate-900 border-emerald-500/60' : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Instant Dedicated NGN Virtual Account</p>
                      <p className="text-[10px] text-slate-400">NIBSS Instant Payment (Auto-credited in &lt;10s)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Zero Fee</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Bank Name:</span>
                    <span className="font-bold text-slate-200">Providus Bank / FlyeMass</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">9082341902</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('9082341902', 'acc');
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        {copiedField === 'acc' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Account Name:</span>
                    <span className="font-medium text-slate-200">FlyeMass / Alade Global Ent.</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCurrency === 'CNY' && (
              <div
                onClick={() => setMethod('qr')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  method === 'qr' ? 'bg-slate-900 border-emerald-500/60' : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Bank of China / CIPS Direct Clearing</p>
                      <p className="text-[10px] text-slate-400">Guangzhou Pearl River Branch</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Instant</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Settlement IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">CN6227003320094892</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('CN6227003320094892', 'cnyIban');
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        {copiedField === 'cnyIban' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">CNAPS Code:</span>
                    <span className="font-mono text-slate-200">104581000018</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">SWIFT / BIC:</span>
                    <span className="font-mono text-slate-200">BKCHCNBJ400</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCurrency === 'USD' && (
              <div
                onClick={() => setMethod('virtual')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  method === 'virtual' ? 'bg-slate-900 border-emerald-500/60' : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">JPMorgan Chase Bank, N.A. (New York)</p>
                      <p className="text-[10px] text-slate-400">Federal Reserve Wire, ACH & Global SWIFT</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Direct Wire</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">USD IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">US89JPMC02100002148902</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('US89JPMC02100002148902', 'usdIban');
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        {copiedField === 'usdIban' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">SWIFT / BIC:</span>
                    <span className="font-mono text-slate-200">CHASUS33</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">ABA / Routing:</span>
                    <span className="font-mono text-slate-200">021000021</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleInstantDeposit}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Confirm Instant Deposit ({wallet.symbol}{parseFloat(amount || '0').toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
